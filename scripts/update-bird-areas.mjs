import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { simplifyRing, writeCatalog } from './boundaries.mjs';

// Fills data/bird-app-areas.json with the operating areas of Bird's rider map, for each area a
// system of a country catalog names by its birdAppArea, and sets that system's bounds to its
// outline's. The cache sweeps an area's outline and keeps the system's brand inside it
// (server/birdApp.ts). Bird's map needs a rider's session, which this reads from a private file and
// never prints, and never renews: one request per area, 30 seconds apart, the cache's own pace. Bird's
// limit is the account's (docs/bird-app-map.md), so these count with the cache's: run nothing else on
// that account meanwhile. Check the diff, then npm run generate:providers.
//   node scripts/update-bird-areas.mjs --session /private/path/bird-session.json [--check]

const ORIGIN = 'https://api-bird.prod.birdapp.com';
// Within 5 m of Bird's own outline, as BinBin's (update-binbin-areas.mjs).
const TOLERANCE_M = 5;
const INTERVAL_MS = 30_000;
const check = process.argv.includes('--check');
const sessionPath = process.argv[process.argv.indexOf('--session') + 1];
if (!process.argv.includes('--session') || !sessionPath) throw new Error('Pass --session with a private Bird session file');
const session = JSON.parse(readFileSync(sessionPath, 'utf8'));
if (typeof session.accessToken !== 'string' || typeof session.deviceId !== 'string') throw new Error('Invalid Bird session');
const path = resolve(process.cwd(), 'data/bird-app-areas.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));
const countries = JSON.parse(readFileSync(resolve(process.cwd(), 'data/countries.json'), 'utf8')).countries;
const catalogs = countries.filter(country => country.catalog).map(country => {
  const feedsPath = resolve(process.cwd(), country.catalog);
  return { feedsPath, feeds: JSON.parse(readFileSync(feedsPath, 'utf8')) };
}).filter(({ feeds }) => feeds.systems.some(system => system.birdAppArea));
const systems = catalogs.flatMap(({ feeds }) => feeds.systems.filter(system => system.birdAppArea));

let next = 0;
async function areasNear([latitude, longitude]) {
  const wait = next - Date.now();
  if (wait > 0) await new Promise(go => setTimeout(go, wait));
  next = Date.now() + INTERVAL_MS;
  const query = new URLSearchParams({ latitude, longitude, radius: 25_000, include_merged: false });
  const response = await fetch(`${ORIGIN}/area/nearby?${query}`, { redirect: 'error', signal: AbortSignal.timeout(30_000), headers: {
    'User-Agent': 'Bird/4.420.0.2 (co.bird.android; release; Android - 15)', 'Device-Id': session.deviceId, Platform: 'android',
    'App-Version': '4.420.0.2', 'App-Name': 'bird', 'App-Type': 'rider', Accept: 'application/json', 'Accept-Language': 'en-US',
    Authorization: `Bearer ${session.accessToken}`, Location: JSON.stringify({ latitude, longitude }) } });
  if (!response.ok) throw new Error(`Bird areas HTTP ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body)) throw new Error('Invalid Bird areas');
  return body;
}

const areas = [];
for (const id of [...new Set(systems.map(system => system.birdAppArea))].sort()) {
  const system = systems.find(candidate => candidate.birdAppArea === id);
  const area = (await areasNear(system.center)).find(candidate => candidate?.id === id);
  if (!area) throw new Error(`Bird has no area ${id} within 25 km of ${system.id}`);
  if (!area.operational || !area.kinds?.includes('OPERATIONAL_AREA') || area.hide_birds) {
    throw new Error(`Bird's area ${id}, ${area.label}, is not an operating area`);
  }
  // No operating area has had a hole; one would be swept and kept as part of its area.
  const rings = (area.region?.rings ?? []).map(({ points }) => {
    const ring = points.map(({ latitude, longitude }) => [longitude, latitude]);
    // simplifyRing takes a closed GeoJSON ring.
    if (ring.length && ring[0].join() !== ring.at(-1).join()) ring.push(ring[0]);
    return simplifyRing(ring, TOLERANCE_M, 5);
  }).filter(ring => ring.length >= 3);
  if (!rings.length) throw new Error(`Bird's area ${id} has no outline`);
  areas.push({ id, title: (area.label ?? '').trim() || `${system.city} operating area`, rings });
}

if (check) {
  const before = new Map(catalog.areas.map(area => [area.id, JSON.stringify(area.rings)]));
  const changed = areas.filter(area => before.get(area.id) !== JSON.stringify(area.rings));
  for (const area of changed) console.log(`${area.id} ${area.title}: ${before.has(area.id) ? 'redrawn' : 'new'}`);
  if (changed.length) process.exit(1);
  console.log(`All ${areas.length} Bird operating areas are as stored`);
} else {
  for (const area of areas) console.log(`${area.id} ${area.title}: ${area.rings.map(ring => ring.length).join(' + ')} points`);
  writeCatalog(path, { ...catalog, verifiedOn: new Date().toISOString().slice(0, 10), areas });
  const byId = new Map(areas.map(area => [area.id, area]));
  for (const { feedsPath, feeds } of catalogs) {
    for (const system of feeds.systems) {
      const points = byId.get(system.birdAppArea)?.rings.flat();
      if (!points) continue;
      const lats = points.map(([lat]) => lat), lngs = points.map(([, lng]) => lng);
      system.bounds = { south: Math.min(...lats), north: Math.max(...lats), west: Math.min(...lngs), east: Math.max(...lngs) };
    }
    writeFileSync(feedsPath, `${JSON.stringify(feeds, null, 2)}\n`);
  }
}
