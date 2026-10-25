import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { simplifyRing, writeCatalog } from './boundaries.mjs';

// Fills data/binbin-areas.json with the service areas of BinBin's app map, its public geofences of
// type 2, for each area a system of a country catalog names by its binbinAppArea, from Turkey to
// Kosovo, and sets that system's bounds to its outline's. The cache sweeps an area's outline and keeps the
// scooters inside it (server/binbinApp.ts). BinBin redraws its areas every few weeks, İzmir's and
// Samsun's on 23 October 2026: run this, check the diff, then npm run generate:providers, which
// checks each outline against its system. --check only says which outlines changed, and fails if
// any did.

const GEOFENCES_URL = 'https://gatewayapi-sp.binbinapp.com/binbin/api/v1/geofences/get-by-type';
const SERVICE_AREA = '2';
// Within 5 m of BinBin's own outline: the sweep covers what is inside, so a scooter parked on the
// line is kept either way.
const TOLERANCE_M = 5;
const check = process.argv.includes('--check');
const path = resolve(process.cwd(), 'data/binbin-areas.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));
const countries = JSON.parse(readFileSync(resolve(process.cwd(), 'data/countries.json'), 'utf8')).countries;
const catalogs = countries.filter(country => country.catalog).map(country => {
  const feedsPath = resolve(process.cwd(), country.catalog);
  return { feedsPath, feeds: JSON.parse(readFileSync(feedsPath, 'utf8')) };
}).filter(({ feeds }) => feeds.systems.some(system => system.binbinAppArea));
const wanted = new Set(catalogs.flatMap(({ feeds }) => feeds.systems.flatMap(system => system.binbinAppArea ? [system.binbinAppArea] : [])));

const response = await fetch(GEOFENCES_URL, {
  method: 'POST', body: JSON.stringify({ geofenceTypes: SERVICE_AREA }),
  headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'okhttp/4.12.0' },
});
if (!response.ok) throw new Error(`BinBin geofences HTTP ${response.status}`);
const body = await response.json();
if (body?.status !== 'SUCCESS' || !Array.isArray(body.data?.features)) throw new Error('Invalid BinBin geofences');
const features = new Map(body.data.features.filter(feature => feature.properties?.type === Number(SERVICE_AREA))
  .map(feature => [String(feature.properties.id), feature]));

const areas = [...wanted].sort((a, b) => Number(a) - Number(b)).map(id => {
  const feature = features.get(id);
  if (!feature) throw new Error(`BinBin has no service area ${id}`);
  if (!feature.properties.isActive) throw new Error(`BinBin's service area ${id}, ${feature.properties.title}, is inactive`);
  const { type, coordinates } = feature.geometry;
  const polygons = type === 'Polygon' ? [coordinates] : type === 'MultiPolygon' ? coordinates : [];
  // No service area has had a hole; one would be swept and kept as part of its area.
  const rings = polygons.map(([outer]) => simplifyRing(outer, TOLERANCE_M, 5)).filter(ring => ring.length >= 3);
  if (!rings.length) throw new Error(`BinBin's service area ${id} has no outline`);
  return { id, title: feature.properties.title, rings };
});

if (check) {
  const before = new Map(catalog.areas.map(area => [area.id, JSON.stringify(area.rings)]));
  const changed = areas.filter(area => before.get(area.id) !== JSON.stringify(area.rings));
  for (const area of changed) console.log(`${area.id} ${area.title}: ${before.has(area.id) ? 'redrawn' : 'new'}`);
  if (changed.length) process.exit(1);
  console.log(`All ${areas.length} BinBin service areas are as stored`);
} else {
  for (const area of areas) console.log(`${area.id} ${area.title}: ${area.rings.map(ring => ring.length).join(' + ')} points`);
  writeCatalog(path, { ...catalog, verifiedOn: new Date().toISOString().slice(0, 10), areas });
  const byId = new Map(areas.map(area => [area.id, area]));
  for (const { feedsPath, feeds } of catalogs) {
    for (const system of feeds.systems) {
      const points = byId.get(system.binbinAppArea)?.rings.flat();
      if (!points) continue;
      const lats = points.map(([lat]) => lat), lngs = points.map(([, lng]) => lng);
      system.bounds = { south: Math.min(...lats), north: Math.max(...lats), west: Math.min(...lngs), east: Math.max(...lngs) };
    }
    writeFileSync(feedsPath, `${JSON.stringify(feeds, null, 2)}\n`);
  }
}
