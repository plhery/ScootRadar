import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { simplifyRing, writeCatalog } from './boundaries.mjs';

// Writes data/city-zones/<id>.json, each city's zones from the layers data/city-zones.json lists,
// and fills in each city's bounds and number of zones there. Bergen kommune's are ArcGIS layers,
// whose query answers each zone's name but not its shape: identify, which the city's map calls on
// a click, answers both, for every zone within an envelope. Porto's sharing points are entities of
// Porto Digital's FIWARE broker, each a point with its number of spots. The City of Boise's are an
// ArcGIS feature service, whose query answers every zone's shape, and its parking corrals points.
// Run it now and then, then npm run generate:providers. Name cities to refresh only theirs:
// node scripts/update-city-zones.mjs boise

const TOLERANCE_M = 0.5;
const DIGITS = 6;
/** Porto's sharing points and Boise's corrals are drawn as discs this wide around their point, of this many corners. */
const DISC_RADIUS_M = 5;
const DISC_CORNERS = 8;
const USER_AGENT = 'scootradar (+https://scootradar.com)';
const KINDS = new Set(['parking', 'noParking', 'slow', 'noRide']);

const path = resolve(process.cwd(), 'data/city-zones.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));
const only = process.argv.slice(2);

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

const slug = kind => kind.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/** An ArcGIS layer's zones, each one ring: identify over an envelope round the municipality. */
async function arcgisZones(city, { kind, url, layer }) {
  const envelope = '4.9,60.1,5.8,60.7';
  const query = new URLSearchParams({ geometry: envelope, geometryType: 'esriGeometryEnvelope', sr: '4326',
    layers: `all:${layer}`, tolerance: '0', mapExtent: envelope, imageDisplay: '2000,2000,96', returnGeometry: 'true', f: 'json' });
  const body = await getJson(`${url}/identify?${query}`);
  if (!Array.isArray(body.results)) throw new Error(`${url} answered no zones`);
  return body.results.map(({ attributes, geometry }) => {
    if (geometry?.rings?.length !== 1) throw new Error(`${url}: zone ${attributes.OBJECTID} is not one ring`);
    return { id: `${city.id}-${slug(kind)}-${attributes.OBJECTID}`, kind, name: attributes.Navn?.trim() || null,
      ring: simplifyRing(geometry.rings[0], TOLERANCE_M, DIGITS) };
  });
}

/** A disc of DISC_RADIUS_M around the point, one ring of [lat, lng]. */
function disc(lat, lng) {
  const kx = 111_320 * Math.cos((lat * Math.PI) / 180);
  return Array.from({ length: DISC_CORNERS }, (_, index) => {
    const angle = (index / DISC_CORNERS) * 2 * Math.PI;
    return [Number((lat + (DISC_RADIUS_M * Math.sin(angle)) / 110_540).toFixed(DIGITS)),
      Number((lng + (DISC_RADIUS_M * Math.cos(angle)) / kx).toFixed(DIGITS))];
  });
}

/**
 * A feature service layer's zones, those `where` picks: each polygon one ring, each point a disc,
 * named by its `Name`, a point by its `CorralType`, or else after the city.
 */
async function featureServerZones(city, { kind, url, layer, where = '1=1' }) {
  const query = new URLSearchParams({ where, outFields: '*', returnGeometry: 'true', outSR: '4326', f: 'json' });
  const body = await getJson(`${url}/${layer}/query?${query}`);
  if (!Array.isArray(body.features) || body.exceededTransferLimit) throw new Error(`${url}/${layer} answered no whole layer`);
  return body.features.map(({ attributes, geometry }) => {
    const id = `${city.id}-${slug(kind)}-${attributes.OBJECTID}`;
    if (Number.isFinite(geometry?.x) && Number.isFinite(geometry?.y)) {
      return { id, kind, name: attributes.CorralType ? `${attributes.CorralType} corral` : 'Corral', ring: disc(geometry.y, geometry.x) };
    }
    if (geometry?.rings?.length !== 1) throw new Error(`${url}/${layer}: zone ${attributes.OBJECTID} is not one ring`);
    return { id, kind, name: attributes.Name?.trim() || city.place, ring: simplifyRing(geometry.rings[0], TOLERANCE_M, DIGITS) };
  });
}

/** Porto's sharing points, each a disc around its point. */
async function fiwareZones(city, { kind, url }) {
  const places = await getJson(url);
  if (!Array.isArray(places) || places.length >= 1000) throw new Error(`${url} answered ${places.length} places`);
  return places.map(place => {
    const [lng, lat] = place.location?.coordinates ?? [];
    if (place.location?.type !== 'Point' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error(`${url}: ${place.id} has no point`);
    }
    const ring = disc(lat, lng);
    const spots = Number.isInteger(place.totalSpotNumber) ? ` (${place.totalSpotNumber} spots)` : '';
    return { id: `${city.id}-${slug(kind)}-${place.id.split(':').pop().split('-')[0]}`, kind,
      name: `${place.description?.trim() || place.address?.streetAddress || 'Ponto de partilha'}${spots}`, ring };
  });
}

for (const city of catalog.cities) {
  if (only.length && !only.includes(city.id)) continue;
  const zones = [];
  for (const layer of city.layers) {
    if (!KINDS.has(layer.kind)) throw new Error(`${city.id}: unknown kind ${layer.kind}`);
    const { pathname } = new URL(layer.url);
    const found = pathname.endsWith('/FeatureServer') ? await featureServerZones(city, layer)
      : pathname.includes('/arcgis/') ? await arcgisZones(city, layer) : await fiwareZones(city, layer);
    console.log(`${city.id} ${layer.kind}: ${found.length} zones, ${found.reduce((sum, zone) => sum + zone.ring.length, 0)} points`);
    zones.push(...found);
  }
  const ids = new Set(zones.map(zone => zone.id));
  if (ids.size !== zones.length) throw new Error(`${city.id}: two zones share an id`);
  zones.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id, 'en', { numeric: true }));
  const points = zones.flatMap(zone => zone.ring);
  city.bounds = {
    south: Math.min(...points.map(([lat]) => lat)), west: Math.min(...points.map(([, lng]) => lng)),
    north: Math.max(...points.map(([lat]) => lat)), east: Math.max(...points.map(([, lng]) => lng)),
  };
  city.zones = zones.length;
  writeCatalog(resolve(process.cwd(), `data/city-zones/${city.id}.json`), { zones });
}

// The day here, as the other catalogs' verifiedOn are.
catalog.verifiedOn = new Date().toLocaleDateString('en-CA');
writeCatalog(path, catalog);
