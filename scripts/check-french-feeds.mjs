import { readFileSync } from 'node:fs';

const requested = process.argv.find(arg => arg.startsWith('--countries='))?.split('=')[1].split(',') ?? ['FR'];
const catalogs = { FR: 'french', DE: 'german', IT: 'italian' };
if (requested.some(country => !catalogs[country])) throw new Error('Use --countries=FR,DE,IT');
// --fail-on=gone fails the run only for an entry its operator no longer serves, as the weekly workflow does.
const failOn = process.argv.find(arg => arg.startsWith('--fail-on='))?.split('=')[1] ?? 'any';
if (!['any', 'gone'].includes(failOn)) throw new Error('Use --fail-on=any or --fail-on=gone');
const catalog = { systems: requested.flatMap(country => JSON.parse(readFileSync(
  new URL(`../data/${catalogs[country]}-scooter-feeds.json`, import.meta.url), 'utf8')).systems.map(system => ({ ...system, country }))) };
const results = [];
const headers = { Accept: 'application/json', 'User-Agent': 'scootradar/2.0 (scootradar.com)' };
// Dott's listing of a country names only the regions it still serves publicly. Its CDN
// keeps a 404 for hours and an unknown query parameter answers 400: no cache busting.
const DOTT = 'https://gbfs.api.ridedott.com';

async function json(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    // Dott names the error in the body: {"error":"Not Found: ERR_REGION_NOT_FOUND"}.
    const code = (await response.text().catch(() => '')).match(/\bERR_[A-Z_]+\b/)?.[0];
    throw Object.assign(new Error(`HTTP ${response.status}${code ? ` ${code}` : ''} at ${new URL(url).pathname}`),
      { status: response.status, code });
  }
  return response.json();
}

function feedEntries(discovery) {
  const data = discovery.data;
  return data?.feeds ?? Object.values(data ?? {}).find(value => Array.isArray(value?.feeds))?.feeds;
}

function feedUrl(entries, names, discoveryUrl) {
  const base = new URL('.', discoveryUrl);
  const entry = names.map(name => entries.find(entry => entry.name === name)).find(Boolean);
  if (!entry) throw new Error(`Missing ${names.join('/')} feed`);
  const url = new URL(entry.url);
  if (url.protocol !== 'https:' || url.origin !== base.origin || url.username || url.password || !url.pathname.startsWith(base.pathname)) {
    throw new Error(`Feed URL outside reviewed city base: ${url.origin}${url.pathname}`);
  }
  return url;
}

const scooterTypes = types => new Set(types.data.vehicle_types.filter(type => (
  ['scooter', 'scooter_standing'].includes(type.form_factor) && type.propulsion_type === 'electric'
)).map(type => type.vehicle_type_id));

const dottRegion = url => {
  const { origin, pathname } = new URL(url);
  return origin === DOTT ? pathname.match(/^\/public\/v2\/([^/]+)\/[^/]+\.json$/)?.[1] : undefined;
};

// paused: Dott has closed the region for a while, as Tignes out of season; the map skips it.
// gone: the operator no longer serves the feed publicly, so the entry should leave the catalog.
function state(system, error) {
  if (!error) return 'ok';
  if (dottRegion(system.discoveryUrl) && error.status === 403 && error.code === 'ERR_REGION_OFFLINE') return 'paused';
  if ([401, 404, 410].includes(error.status)) return 'gone';
  return 'failed';
}

async function inspect(system) {
  const result = { system: system.id, country: system.country, city: system.city, provider: system.provider, discoveryUrl: system.discoveryUrl };
  try {
    const discovery = await json(system.discoveryUrl);
    const entries = feedEntries(discovery);
    if (!Array.isArray(entries)) throw new Error('Invalid GBFS discovery');
    const [types, status] = await Promise.all([
      json(feedUrl(entries, ['vehicle_types'], system.discoveryUrl)),
      json(feedUrl(entries, ['vehicle_status', 'free_bike_status'], system.discoveryUrl)),
    ]);
    const scooters = scooterTypes(types);
    const vehicles = status.data?.vehicles ?? status.data?.bikes;
    if (!Array.isArray(vehicles)) throw new Error('Missing vehicle array');
    const updatedAt = typeof status.last_updated === 'number' ? status.last_updated * 1000 : Date.parse(status.last_updated);
    const ageSeconds = Math.round((Date.now() - updatedAt) / 1000);
    if (!Number.isFinite(updatedAt) || ageSeconds > 900 || ageSeconds < -300) throw new Error('Status timestamp missing or out of date');
    const available = vehicles.filter(vehicle => (
      scooters.has(vehicle.vehicle_type_id) && !vehicle.is_reserved && !vehicle.is_disabled &&
      Number.isFinite(vehicle.lat) && Number.isFinite(vehicle.lon) &&
      (system.areas ?? [system]).some(area => vehicle.lat >= area.bounds.south && vehicle.lat <= area.bounds.north &&
        vehicle.lon >= area.bounds.west && vehicle.lon <= area.bounds.east)
    ));
    return {
      ...result, state: 'ok', version: discovery.version, availableScooters: available.length,
      withBattery: available.filter(vehicle => Number.isFinite(vehicle.current_fuel_percent)).length,
      withRange: available.filter(vehicle => Number.isFinite(vehicle.current_range_meters)).length,
      withRentalLink: available.filter(vehicle => vehicle.rental_uris?.ios || vehicle.rental_uris?.android || vehicle.rental_uris?.web).length,
      updatedAt: new Date(updatedAt).toISOString(), ageSeconds,
    };
  } catch (error) {
    return { ...result, state: state(system, error), error: error.message };
  }
}

// One request per country: the regions Dott lists, each with its feeds.
async function dottListing(country) {
  const regions = new Map();
  for (const entry of feedEntries(await json(`${DOTT}/public/v2/countries/${country.toLowerCase()}/gbfs.json`)) ?? []) {
    const region = dottRegion(entry.url);
    if (region) regions.set(region, { ...regions.get(region), [entry.name]: entry.url });
  }
  if (regions.size === 0) throw new Error('Dott listing names no region');
  return regions;
}

// A region Dott lists that the catalog lacks: worth a review if it has scooters.
async function uncataloged(region, feeds) {
  try {
    const scooters = scooterTypes(await json(feeds.vehicle_types));
    if (scooters.size === 0) return { region, scooters: 0 };
    const status = await json(feeds.free_bike_status);
    const vehicles = status.data?.bikes ?? status.data?.vehicles ?? [];
    return { region, scooters: vehicles.filter(vehicle => (
      scooters.has(vehicle.vehicle_type_id) && !vehicle.is_reserved && !vehicle.is_disabled
    )).length };
  } catch (error) {
    return { region, error: error.message };
  }
}

const listings = Object.fromEntries(await Promise.all(requested.map(async country => {
  try {
    return [country, { regions: await dottListing(country) }];
  } catch (error) {
    return [country, { error: error.message }];
  }
})));

let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (next < catalog.systems.length) results.push(await inspect(catalog.systems[next++]));
}));
results.sort((a, b) => a.system.localeCompare(b.system));

const dott = {};
for (const country of requested) {
  const { regions, error } = listings[country];
  if (error) {
    dott[country] = { error };
    continue;
  }
  const entries = results.filter(result => result.country === country && dottRegion(result.discoveryUrl));
  for (const result of entries) result.listed = regions.has(dottRegion(result.discoveryUrl));
  const cataloged = new Set(entries.map(result => dottRegion(result.discoveryUrl)));
  const missing = [...regions].filter(([region]) => !cataloged.has(region));
  const lacking = [];
  for (const [region, feeds] of missing) lacking.push(await uncataloged(region, feeds));
  dott[country] = {
    listedRegions: regions.size,
    notListed: entries.filter(result => !result.listed).map(({ system, state }) => ({ system, state })),
    uncataloged: lacking,
  };
}

const count = state => results.filter(result => result.state === state).length;
const plural = (amount, noun) => `${amount} ${noun}${amount === 1 ? '' : 's'}`;
const report = {
  checkedAt: new Date().toISOString(),
  systems: results,
  totalAvailableScooters: results.reduce((total, result) => total + (result.availableScooters ?? 0), 0),
  gone: count('gone'),
  paused: count('paused'),
  failures: count('gone') + count('failed') + Object.values(dott).filter(listing => listing.error).length,
  dott,
};
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.table(results.map(({ system, city, state, version, availableScooters, withBattery, withRange, ageSeconds, error }) => (
    { system, city, state, version, availableScooters, withBattery, withRange, ageSeconds, error }
  )));
  console.log(`${report.totalAvailableScooters} available scooters; ${report.gone} gone, ${report.paused} paused and ` +
    `${count('failed')} failed feeds. Checked ${report.checkedAt}.`);
  for (const [country, listing] of Object.entries(dott)) {
    if (listing.error) {
      console.log(`Dott ${country} listing failed: ${listing.error}`);
      continue;
    }
    const notListed = listing.notListed.map(({ system, state }) => `${system} (${state})`);
    const lacking = listing.uncataloged.filter(({ scooters }) => scooters !== 0)
      .map(({ region, scooters, error }) => `${region} (${error ?? plural(scooters, 'scooter')})`);
    const empty = listing.uncataloged.filter(({ scooters }) => scooters === 0).map(({ region }) => region);
    console.log(`Dott ${country} lists ${plural(listing.listedRegions, 'region')}. Catalog entries it does not list: ` +
      `${notListed.join(', ') || 'none'}. Listed regions with scooters the catalog lacks: ${lacking.join(', ') || 'none'}` +
      `${empty.length ? ` (no scooters in ${empty.join(', ')})` : ''}.`);
  }
}
if (report.gone > 0 || (failOn === 'any' && report.failures > 0)) process.exitCode = 1;
