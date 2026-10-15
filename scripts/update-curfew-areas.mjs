import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Fills the areas of data/rental-curfews.json with each town's boundary,
// simplified to within TOLERANCE_M: Norwegian municipalities from Kartverket
// (CC BY 4.0), British local authority districts from the ONS (Open Government
// Licence v3.0), Portuguese municipalities from the Direção-Geral do Território's
// CAOP (CC BY 4.0), American incorporated places from the Census Bureau's
// TIGERweb (public domain), and Kyiv from OpenStreetMap (ODbL). Pieces smaller
// than MIN_AREA_KM2 (skerries, most islands) are left out. Run it after adding a
// curfew, then npm run generate:providers.

const TOLERANCE_M = 100;
const MIN_AREA_KM2 = 1;
const path = resolve(process.cwd(), 'data/rental-curfews.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));

// Metres in a local plane around the first point.
function toPlane(ring) {
  const cosLat = Math.cos((ring[0][1] * Math.PI) / 180);
  return ring.map(([lng, lat]) => [lng * 111_320 * cosLat, lat * 110_540]);
}

function planeArea(points) {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += points[j][0] * points[i][1] - points[i][0] * points[j][1];
  }
  return Math.abs(sum) / 2;
}

// Douglas–Peucker over an open line; marks the points to keep.
function simplifyLine(points, keep, offset, tolerance) {
  const stack = [[0, points.length - 1]];
  keep[offset] = keep[offset + points.length - 1] = 1;
  while (stack.length) {
    const [a, b] = stack.pop();
    const [x1, y1] = points[a];
    const [x2, y2] = points[b];
    const length = Math.hypot(x2 - x1, y2 - y1) || 1;
    let farthest = -1;
    let distance = tolerance;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((y2 - y1) * points[i][0] - (x2 - x1) * points[i][1] + x2 * y1 - y2 * x1) / length;
      if (d > distance) [farthest, distance] = [i, d];
    }
    if (farthest >= 0) {
      keep[offset + farthest] = 1;
      stack.push([a, farthest], [farthest, b]);
    }
  }
}

// A closed ring is split at the point farthest from its start, so neither half
// starts and ends at the same place.
function simplifyRing(ring) {
  const points = toPlane(ring);
  let far = 0;
  points.forEach(([x, y], i) => {
    if (Math.hypot(x - points[0][0], y - points[0][1]) > Math.hypot(points[far][0] - points[0][0], points[far][1] - points[0][1])) far = i;
  });
  const keep = new Uint8Array(ring.length);
  simplifyLine(points.slice(0, far + 1), keep, 0, TOLERANCE_M);
  simplifyLine(points.slice(far), keep, far, TOLERANCE_M);
  // The ring closes on itself: its last point repeats the first.
  const kept = ring.filter((_, i) => keep[i]).slice(0, -1);
  return kept.map(([lng, lat]) => [Number(lat.toFixed(4)), Number(lng.toFixed(4))]);
}

// December 2018 districts: Bournemouth, Christchurch and Poole merged the year after.
const ONS_DISTRICTS = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD_December_2018_Boundaries_UK_BGC_2022/FeatureServer/0/query';

// Incorporated places as TIGERweb's current layer draws them.
const TIGERWEB_PLACES = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query';

// Each source's URL for an id, and where its answer keeps the geometry.
const BOUNDARIES = {
  kartverket: {
    url: id => `https://ws.geonorge.no/kommuneinfo/v1/kommuner/${id}/omrade?utkoordsys=4258`,
    geometry: body => body.omrade,
  },
  ons: {
    url: id => `${ONS_DISTRICTS}?where=${encodeURIComponent(`lad18cd='${id}'`)}&returnGeometry=true&outSR=4326&f=geojson`,
    geometry: body => body.features?.[0]?.geometry,
  },
  // Mainland municipalities by DICO, reprojected by the server to lon/lat.
  caop: {
    url: id => `https://ogcapi.dgterritorio.gov.pt/collections/municipios/items/${id}?f=json`,
    geometry: body => body.geometry,
  },
  // An incorporated place by GEOID, its state's code then the place's,
  // reprojected by the server to lon/lat.
  census: {
    url: id => `${TIGERWEB_PLACES}?where=${encodeURIComponent(`GEOID='${id}'`)}&returnGeometry=true&outSR=4326&f=geojson`,
    geometry: body => body.features?.[0]?.geometry,
  },
  // An OpenStreetMap relation by id, through Nominatim, whose policy asks each
  // client to name itself.
  osm: {
    url: id => `https://nominatim.openstreetmap.org/lookup?osm_ids=R${id}&polygon_geojson=1&format=json`,
    headers: { 'User-Agent': 'scootradar (+https://scootradar.com)' },
    geometry: body => body[0]?.geojson,
  },
};

/** The boundary as GeoJSON polygons of [lng, lat] rings. */
async function boundary({ source, id }) {
  const reader = BOUNDARIES[source];
  if (!reader) throw new Error(`Unknown boundary source: ${source}`);
  const response = await fetch(reader.url(id), { headers: reader.headers });
  if (!response.ok) throw new Error(`${source} ${id} answered ${response.status}`);
  const body = await response.json();
  const geometry = reader.geometry(body);
  if (!geometry) throw new Error(`${source} ${id} has no boundary`);
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

for (const curfew of catalog.curfews) {
  const polygons = await boundary(curfew.boundary);
  // Outer rings only. Kyiv's two holes, enclaves of Kyiv Oblast to the west and
  // north-east, lie well outside its scooters' bounds. Of the American holes,
  // only Berry Hill, a city inside Nashville, held a scooter or two.
  curfew.areas = polygons
    .map(([outer]) => outer)
    .filter(outer => planeArea(toPlane(outer)) / 1e6 >= MIN_AREA_KM2)
    .map(simplifyRing);
  console.log(`${curfew.id}: ${curfew.areas.map(area => area.length).join(' + ')} points`);
}

// One point a line keeps the diffs readable.
const json = JSON.stringify(catalog, null, 2).replace(
  /\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g,
  '[$1, $2]',
);
writeFileSync(path, `${json}\n`);
