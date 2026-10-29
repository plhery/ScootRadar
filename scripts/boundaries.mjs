import { writeFileSync } from 'node:fs';
import polygonClipping from 'polygon-clipping';

// Towns' boundaries, fetched from the sources below and simplified, for the
// night bans (scripts/update-curfew-areas.mjs) and the town outlines
// (scripts/update-town-outlines.mjs).

// Metres in a local plane around the first point.
export function toPlane(ring) {
  const cosLat = Math.cos((ring[0][1] * Math.PI) / 180);
  return ring.map(([lng, lat]) => [lng * 111_320 * cosLat, lat * 110_540]);
}

export function planeArea(points) {
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

/**
 * A GeoJSON ring of [lng, lat] points, simplified to within `tolerance` metres, as
 * [lat, lng] points rounded to `digits` decimals. A closed ring is split at the point
 * farthest from its start, so neither half starts and ends at the same place.
 */
export function simplifyRing(ring, tolerance, digits = 4) {
  const points = toPlane(ring);
  let far = 0;
  points.forEach(([x, y], i) => {
    if (Math.hypot(x - points[0][0], y - points[0][1]) > Math.hypot(points[far][0] - points[0][0], points[far][1] - points[0][1])) far = i;
  });
  const keep = new Uint8Array(ring.length);
  simplifyLine(points.slice(0, far + 1), keep, 0, tolerance);
  simplifyLine(points.slice(far), keep, far, tolerance);
  // The ring closes on itself: its last point repeats the first.
  const kept = ring.filter((_, i) => keep[i]).slice(0, -1);
  return kept.map(([lng, lat]) => [Number(lat.toFixed(digits)), Number(lng.toFixed(digits))]);
}

/** The outer rings of the polygons, those of at least `minAreaKm2`, simplified. */
export function outerRings(polygons, { minAreaKm2, tolerance, digits, holes = false }) {
  return polygons
    .filter(([outer]) => planeArea(toPlane(outer)) / 1e6 >= minAreaKm2)
    .map(([outer, ...inner]) => {
      let ring = simplifyRing(outer, tolerance, digits);
      // Preserve enclaves, as Kauniainen inside Espoo, in the single-ring
      // format. A bridge traversed twice cancels under even-odd containment.
      // Simplify before adding the bridge, so its two sides remain identical.
      if (holes) for (const source of inner) {
        const hole = simplifyRing(source, tolerance, digits);
        if (hole.length >= 3) ring = [ring[0], ...hole, hole[0], ring[0], ...ring.slice(1)];
      }
      return ring;
    });
}

// December 2018 districts: Bournemouth, Christchurch and Poole merged the year after.
const ONS_DISTRICTS = 'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/LAD_December_2018_Boundaries_UK_BGC_2022/FeatureServer/0/query';

// Incorporated places as TIGERweb's current layer draws them.
const TIGERWEB_PLACES = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query';

// Brazil's municipalities from IBGE's municipal mesh, as the Geological Survey of Brazil (SGB) serves it.
const SGB_MUNICIPALITIES = 'https://geoportal.sgb.gov.br/server/rest/services/cartografia/divisao_politica/MapServer/0/query';

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
  // A municipality by its IBGE code, reprojected by the server to lon/lat.
  ibge: {
    url: id => `${SGB_MUNICIPALITIES}?where=${encodeURIComponent(`id=${Number(id)}`)}&returnGeometry=true&outSR=4326&f=geojson`,
    geometry: body => body.features?.[0]?.geometry,
  },
  // An OpenStreetMap relation by id, or a closed way as "W168664114", through Nominatim,
  // whose policy asks each client to name itself and to send no more than one request a second.
  osm: {
    url: id => `https://nominatim.openstreetmap.org/lookup?osm_ids=${/^W\d+$/.test(id) ? id : `R${id}`}&polygon_geojson=1&format=json`,
    headers: { 'User-Agent': 'scootradar (+https://scootradar.com)' },
    geometry: body => body[0]?.geojson,
    pause: 1100,
  },
};

const lastRequest = new Map();

/**
 * The boundary as GeoJSON polygons of [lng, lat] rings. A town no source draws whole, as
 * Gwangju, whose five districts OpenStreetMap has placed under the Jeonnam-Gwangju special
 * city since 2026, lists its parts' `ids`. Land the town's rule does not reach is cut out with
 * `minus`, another boundary: Michigan State's campus, which sets its own rules, out of East Lansing.
 */
export async function boundary({ source, id, ids, minus }) {
  if (minus) return polygonClipping.difference(await boundary({ source, id, ids }), await boundary(minus));
  if (ids) {
    const polygons = [];
    for (const part of ids) polygons.push(...await boundary({ source, id: part }));
    return polygons;
  }
  const reader = BOUNDARIES[source];
  if (!reader) throw new Error(`Unknown boundary source: ${source}`);
  const wait = (lastRequest.get(source) ?? 0) + (reader.pause ?? 0) - Date.now();
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  lastRequest.set(source, Date.now());
  const response = await fetch(reader.url(id), { headers: reader.headers });
  if (!response.ok) throw new Error(`${source} ${id} answered ${response.status}`);
  const body = await response.json();
  const geometry = reader.geometry(body);
  if (!geometry) throw new Error(`${source} ${id} has no boundary`);
  return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
}

/** Writes the catalog with one point a line, which keeps the diffs readable. */
export function writeCatalog(path, catalog) {
  const json = JSON.stringify(catalog, null, 2).replace(
    /\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]/g,
    '[$1, $2]',
  );
  writeFileSync(path, `${json}\n`);
}
