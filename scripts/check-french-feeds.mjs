import { readFileSync } from 'node:fs';
import { holdOffMs, hostPacer } from './host-pacing.mjs';

// The catalogs of data/countries.json. --countries= takes country codes (FR,DE), a continent
// (--help lists them) or all; --except= leaves countries out: check:europe skips France,
// which check:france covers.
const countries = JSON.parse(readFileSync(new URL('../data/countries.json', import.meta.url), 'utf8')).countries
  .filter(country => country.catalog);
const catalogs = Object.fromEntries(countries.map(country => [country.code, country.catalog]));
const usage = `Usage: node scripts/check-french-feeds.mjs [--countries=CODES] [--except=CODES] [--fail-on=any|gone] [--json]
Reads each catalog feed live, France's unless --countries= names others: country codes (FR,DE), a continent
(${[...new Set(countries.map(country => country.continent))].join(', ')}) or all.`;
const args = process.argv.slice(2);
if (args.some(arg => arg === '--help' || arg === '-h')) {
  console.log(usage);
  process.exit(0);
}
// An unknown option would otherwise run the whole check without it.
const unknown = args.filter(arg => !['--countries=', '--except=', '--fail-on='].some(name => arg.startsWith(name)) && arg !== '--json');
if (unknown.length) {
  console.error(`Unknown option ${unknown.join(' ')}\n${usage}`);
  process.exit(2);
}
const option =name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.split('=')[1].split(',');
const except = option('except') ?? [];
const requested = (option('countries') ?? ['FR']).flatMap(name => name === 'all'
  ? countries.map(country => country.code)
  : countries.some(country => country.continent === name)
    ? countries.filter(country => country.continent === name).map(country => country.code)
    : [name]).filter(country => !except.includes(country));
if (requested.some(country => !catalogs[country]) || except.some(country => !catalogs[country])) {
  throw new Error(`Use --countries=all, a continent or some of ${Object.keys(catalogs).join(',')}`);
}
// --fail-on=gone fails the run only for an entry its operator no longer serves, as the weekly workflow does.
const failOn = process.argv.find(arg => arg.startsWith('--fail-on='))?.split('=')[1] ?? 'any';
if (!['any', 'gone'].includes(failOn)) throw new Error('Use --fail-on=any or --fail-on=gone');
const catalog = { systems: requested.flatMap(country => JSON.parse(readFileSync(
  new URL(`../${catalogs[country]}`, import.meta.url), 'utf8')).systems.map(system => ({ ...system, country }))) };
const results = [];
const headers = { Accept: 'application/json', 'User-Agent': 'scootradar/2.0 (scootradar.com)' };
// As HOST_HEADERS in src/lib/scooterFeeds.ts: Entur answers only clients that name themselves.
const hostHeaders = { 'api.entur.io': { 'ET-Client-Name': 'scootradar-map' } };
// Dott's listing of a country names only the regions it still serves publicly. Its CDN
// keeps a 404 for hours and an unknown query parameter answers 400: no cache busting.
const DOTT = 'https://gbfs.api.ridedott.com';
const MOBIDATA_BW = 'https://api.mobidata-bw.de';

// At most two requests a second to one host, whatever the number of feeds it serves.
const pacer = hostPacer(500);

async function json(url, retries = 2) {
  await pacer.wait(url);
  const response = await fetch(url, { headers: { ...headers, ...hostHeaders[new URL(url).hostname] }, signal: AbortSignal.timeout(15_000) });
  if (response.status === 429 && retries > 0) {
    pacer.holdOff(url, holdOffMs(response));
    await response.body?.cancel();
    return json(url, retries - 1);
  }
  if (!response.ok) {
    // Dott names the error in the body: {"error":"Not Found: ERR_REGION_NOT_FOUND"}.
    const code = (await response.text().catch(() => '')).match(/\bERR_[A-Z_]+\b/)?.[0];
    // A host that refuses us without naming why, as Dott does a paused region, is left alone for a while.
    if (response.status === 429 || (response.status === 403 && !code)) pacer.holdOff(url, holdOffMs(response));
    throw Object.assign(new Error(`HTTP ${response.status}${code ? ` ${code}` : ''} at ${new URL(url).pathname}`),
      { status: response.status, code });
  }
  return response.json();
}

function feedEntries(discovery) {
  const data = discovery.data;
  return data?.feeds ?? Object.values(data ?? {}).find(value => Array.isArray(value?.feeds))?.feeds;
}

// As feedBase in src/lib/regionalScooterSystems.ts: the discovery's directory, unless the catalog names another.
function feedUrl(entries, names, system) {
  const base = new URL(system.feedBaseUrl ?? '.', system.discoveryUrl);
  const entry = names.map(name => entries.find(entry => entry.name === name)).find(Boolean);
  if (!entry) throw new Error(`Missing ${names.join('/')} feed`);
  const url = new URL(entry.url);
  if (url.protocol !== 'https:' || url.origin !== base.origin || url.username || url.password || !url.pathname.startsWith(base.pathname)) {
    throw new Error(`Feed URL outside reviewed city base: ${url.origin}${url.pathname}`);
  }
  return url;
}

// As src/lib/scooterTypes.ts: Zeus's own feeds call its standing scooters electric_assist.
const scooterTypes = (types, provider) => new Set(types.data.vehicle_types.filter(type => (
  ['scooter', 'scooter_standing'].includes(type.form_factor) &&
  (type.propulsion_type === 'electric' || (type.propulsion_type === 'electric_assist' && provider === 'zeus'))
)).map(type => type.vehicle_type_id));

// MobiData BW republishes some of Dott's German regions, as dott_<region>; the catalog reads those there.
const dottRegion = url => {
  const { origin, pathname } = new URL(url);
  if (origin === MOBIDATA_BW) return pathname.match(/^\/sharing\/gbfs\/v3\/dott_([^/]+)\/gbfs$/)?.[1];
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

// Load Node-only app collectors on demand; their endpoints are not GBFS discovery.
const appModules = new Map();
async function appCollector(provider) {
  if (!appModules.has(provider)) appModules.set(provider, import('esbuild').then(async ({ build }) => {
    const result = await build({ entryPoints: [new URL(`../server/${provider}App.ts`, import.meta.url).pathname],
      bundle: true, platform: 'node', format: 'esm', write: false });
    return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
  }));
  const adapter = await appModules.get(provider);
  return adapter[`collect${provider[0].toUpperCase() + provider.slice(1)}Region`];
}
async function inspect(system) {
  const result = { system: system.id, country: system.country, city: system.city, provider: system.provider, discoveryUrl: system.discoveryUrl };
  try {
    if (system.dottAppRegion || system.voiAppZone || system.limeAppMap || system.atomAppAccount || system.luupAppCities || system.jetAppMap ||
      system.whooshAppRegion || system.binbinAppArea || system.beamAppCity || system.gcooAppMap || system.kickgoingAppMap || system.swingAppMap) {
      const collect = await appCollector(system.atomAppAccount ? 'atom' : system.kickgoingAppMap ? 'kickgoing' : system.provider);
      const snapshot = await collect(system);
      return { ...result, state: 'ok', version: 'app-map', availableScooters: snapshot.vehicles.length,
        withBattery: snapshot.vehicles.filter(v => v.battery !== null).length, withRange: snapshot.vehicles.filter(v => typeof v.range_m === 'number').length, withRentalLink: 0,
        updatedAt: new Date(snapshot.observedAt).toISOString(), ageSeconds: Math.max(0, Math.round((Date.now() - snapshot.observedAt) / 1000)) };
    }
    const discovery = await json(system.discoveryUrl);
    const entries = feedEntries(discovery);
    if (!Array.isArray(entries)) throw new Error('Invalid GBFS discovery');
    const [types, status] = await Promise.all([
      json(feedUrl(entries, ['vehicle_types'], system)),
      json(feedUrl(entries, ['vehicle_status', 'free_bike_status'], system)),
    ]);
    const scooters = scooterTypes(types, system.provider);
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
      withBattery: available.filter(vehicle => Number.isFinite(vehicle.current_fuel_percent) || Number.isFinite(vehicle.hopp_battery_level)).length,
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
    const scooters = scooterTypes(await json(feeds.vehicle_types), 'dott');
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

// Norway's Dott comes through Entur, whose manifest stands in for Dott's listing.
const dottCountries = requested.filter(country => catalog.systems.some(system => (
  system.country === country && dottRegion(system.discoveryUrl)
)));
const listings = Object.fromEntries(await Promise.all(dottCountries.map(async country => {
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
for (const country of dottCountries) {
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
