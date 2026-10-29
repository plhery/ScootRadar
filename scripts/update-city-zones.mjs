import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { boundary, outerRings, planeArea, simplifyRing, toPlane, writeCatalog } from './boundaries.mjs';

// Writes data/city-zones/<id>.json, each city's zones from the layers data/city-zones.json lists,
// and fills in each city's bounds and number of zones there. Bergen kommune's are ArcGIS layers,
// whose query answers each zone's name but not its shape: identify, which the city's map calls on
// a click, answers both, for every zone within an envelope. Porto's sharing points are entities of
// Porto Digital's FIWARE broker, each a point with its number of spots. The City of Boise's are an
// ArcGIS feature service, whose query answers every zone's shape, and its parking corrals points;
// so are the City of Västerås's, some zones of several parts and a few with holes. Norrköpings
// kommun's are WMS layers, served as pictures only: drawn as SVG, each zone is a path in the
// picture's pixels, read back to its SWEREF 99 grid and so to latitude and longitude.
// A layer may instead name a boundary (scripts/boundaries.mjs): Arlington National Cemetery's,
// where federal rules forbid riding, is its OpenStreetMap outline.
// Run it now and then, then npm run generate:providers. Name cities to refresh only theirs:
// node scripts/update-city-zones.mjs boise

const TOLERANCE_M = 0.5;
const DIGITS = 6;
/** Porto's sharing points and Boise's corrals are drawn as discs this wide around their point, of this many corners. */
const DISC_RADIUS_M = 5;
const DISC_CORNERS = 8;
/** A zone's holes, and the parts of a zone of several, smaller than this are slivers its drawing left: Västerås's 101 are 3 m² at most. */
const SLIVER_M2 = 5;
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

/** Whether the point lies within the ring, both of [lng, lat]. */
function within([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * A feature's rings as polygons, each its outer ring and then its holes. ArcGIS turns outer rings
 * clockwise and holes the other way; a ring turned the other way within no outer ring, as three
 * of Västerås's are, is a part of its own.
 */
function featurePolygons(rings) {
  const clockwise = ring => twiceArea(ring) < 0;
  const polygons = rings.filter(clockwise).map(ring => [ring]);
  for (const ring of rings.filter(ring => !clockwise(ring))) {
    const polygon = polygons.find(([outer]) => within(ring[0], outer));
    if (polygon) polygon.push(ring);
    else polygons.push([ring]);
  }
  return polygons;
}

/**
 * A feature service layer's zones, those `where` picks: each part of a polygon one ring, its holes
 * kept as outerRings keeps an enclave, each point a disc, named by its `Name`, a point by its
 * `CorralType`, or else after the city. A zone of several parts is a zone for each, numbered,
 * but for its slivers.
 */
async function featureServerZones(city, { kind, url, layer, where = '1=1' }) {
  const query = new URLSearchParams({ where, outFields: '*', returnGeometry: 'true', outSR: '4326', f: 'json' });
  const body = await getJson(`${url}/${layer}/query?${query}`);
  if (!Array.isArray(body.features) || body.exceededTransferLimit) throw new Error(`${url}/${layer} answered no whole layer`);
  return body.features.flatMap(({ attributes, geometry }) => {
    const objectId = attributes.OBJECTID ?? attributes.objectid;
    const id = `${city.id}-${slug(kind)}-${objectId}`;
    if (Number.isFinite(geometry?.x) && Number.isFinite(geometry?.y)) {
      return [{ id, kind, name: attributes.CorralType ? `${attributes.CorralType} corral` : 'Corral', ring: disc(geometry.y, geometry.x) }];
    }
    if (!geometry?.rings?.length) throw new Error(`${url}/${layer}: zone ${objectId} has no shape`);
    const name = attributes.Name?.trim() || city.place;
    const area = ring => planeArea(toPlane(ring));
    const polygons = featurePolygons(geometry.rings).map(([outer, ...holes]) => [outer, ...holes.filter(hole => area(hole) >= SLIVER_M2)]);
    const parts = polygons.length > 1 ? polygons.filter(([outer]) => area(outer) >= SLIVER_M2) : polygons;
    const rings = outerRings(parts, { minAreaKm2: 0, tolerance: TOLERANCE_M, digits: DIGITS, holes: true })
      .filter(ring => ring.length >= 3);
    return rings.map((ring, index) => ({ id: rings.length > 1 ? `${id}-${index + 1}` : id, kind, name, ring }));
  });
}

/**
 * A boundary's outer rings, each a zone named after the place. The one hole in Arlington National
 * Cemetery's outline, about 60 m across, is bleachers within the cemetery, so it is left closed.
 */
async function boundaryZones(city, { kind, boundary: source }) {
  return outerRings(await boundary(source), { minAreaKm2: 0, tolerance: TOLERANCE_M, digits: DIGITS })
    .map((ring, index) => ({ id: `${city.id}-${slug(kind)}-${index + 1}`, kind, name: city.place, ring }));
}

/** Twice the ring's signed area, its points read as [x, y]: below 0 when it turns clockwise. */
function twiceArea(ring) {
  return ring.reduce((sum, [x0, y0], i) => {
    const [x1, y1] = ring[(i + 1) % ring.length];
    return sum + x0 * y1 - x1 * y0;
  }, 0);
}

/** A path's rings as polygons, each its outer ring and then its holes, turned the other way. */
function nestedPolygons(rings) {
  const polygons = [];
  for (const ring of [...rings].sort((a, b) => Math.abs(twiceArea(b)) - Math.abs(twiceArea(a)))) {
    const polygon = polygons.find(([outer]) => within(ring[0], outer));
    if (!polygon) polygons.push([ring]);
    else polygon.push(Math.sign(twiceArea(ring)) === Math.sign(twiceArea(polygon[0])) ? [...ring].reverse() : ring);
  }
  return polygons;
}

/** Grids a city's map may draw in: SWEREF 99 16 30, Norrköping's, a transverse Mercator projection of GRS 80. */
const GRIDS = { 'EPSG:3010': { meridian: 16.5, scale: 1, falseEasting: 150000 } };

/** A grid's easting and northing as [lng, lat], by Lantmäteriet's Gauss–Krüger formulas. */
function gridToLngLat(easting, northing, { meridian, scale, falseEasting }) {
  const f = 1 / 298.257222101;
  const e2 = f * (2 - f);
  const n = f / (2 - f);
  const radius = (6378137 / (1 + n)) * (1 + n ** 2 / 4 + n ** 4 / 64);
  const deltas = [n / 2 - (2 * n ** 2) / 3 + (37 * n ** 3) / 96 - n ** 4 / 360, n ** 2 / 48 + n ** 3 / 15 - (437 * n ** 4) / 1440,
    (17 * n ** 3) / 480 - (37 * n ** 4) / 840, (4397 * n ** 4) / 161280];
  const xi = northing / (scale * radius);
  const eta = (easting - falseEasting) / (scale * radius);
  let xiPrime = xi;
  let etaPrime = eta;
  deltas.forEach((delta, index) => {
    const k = 2 * (index + 1);
    xiPrime -= delta * Math.sin(k * xi) * Math.cosh(k * eta);
    etaPrime -= delta * Math.cos(k * xi) * Math.sinh(k * eta);
  });
  const conformal = Math.asin(Math.sin(xiPrime) / Math.cosh(etaPrime));
  const s = Math.sin(conformal) ** 2;
  const lat = conformal + Math.sin(conformal) * Math.cos(conformal) * (e2 + e2 ** 2 + e2 ** 3 + e2 ** 4
    - ((7 * e2 ** 2 + 17 * e2 ** 3 + 30 * e2 ** 4) / 6) * s + ((224 * e2 ** 3 + 889 * e2 ** 4) / 120) * s ** 2
    - ((4279 * e2 ** 4) / 1260) * s ** 3);
  return [meridian + (Math.atan(Math.sinh(etaPrime) / Math.cos(xiPrime)) * 180) / Math.PI, (lat * 180) / Math.PI];
}

/** The most pixels a side of one map asks for, under MapServer's limit. */
const WMS_MAX_PX = 2000;
/** How far a map's tiles overlap, so that a zone cut at one's edge, a parking place, is whole in the next. */
const WMS_OVERLAP_M = 50;
/** Within this many pixels of a tile's edge, a zone may have been cut there. */
const WMS_EDGE_PX = 2;

/**
 * A WMS layer's zones, as its map draws them in SVG: each filled path, or each of the colour `fill`,
 * a polygon of the grid `srs`, read back from pixels `metresPerPixel` wide from the corner of `box`.
 * Norrköping kommun's map serves its zones only so, its layers neither queryable nor drawn in KML.
 * MapServer draws a point half a pixel on from where the box's edges put it: so read, the same
 * zones drawn half a metre and two metres a pixel meet within 4 mm. A box wider than WMS_MAX_PX
 * pixels is drawn in overlapping tiles, each zone taken from a tile it lies whole in; none may
 * reach the box's own edge.
 */
async function wmsZones(city, { kind, url, layer, fill, srs, box, metresPerPixel }) {
  const grid = GRIDS[srs];
  if (!grid) throw new Error(`${city.id}: no grid ${srs}`);
  const [west, south, east, north] = box;
  const step = WMS_MAX_PX * metresPerPixel;
  const starts = (from, to) => {
    const list = [from];
    while (list.at(-1) + step < to) list.push(list.at(-1) + step - WMS_OVERLAP_M);
    return list;
  };
  const whole = [];
  const cut = [];
  for (const tileWest of starts(west, east)) {
    for (const tileSouth of starts(south, north)) {
      const tile = [tileWest, tileSouth, Math.min(tileWest + step, east), Math.min(tileSouth + step, north)];
      const width = Math.round((tile[2] - tile[0]) / metresPerPixel);
      const height = Math.round((tile[3] - tile[1]) / metresPerPixel);
      const request = new URL(url);
      const query = { SERVICE: 'WMS', VERSION: '1.1.1', REQUEST: 'GetMap', LAYERS: layer, STYLES: '', SRS: srs,
        BBOX: tile.join(','), WIDTH: width, HEIGHT: height, FORMAT: 'image/svg+xml', TRANSPARENT: 'TRUE' };
      for (const [key, value] of Object.entries(query)) request.searchParams.set(key, String(value));
      const response = await fetch(request, { headers: { 'User-Agent': USER_AGENT } });
      const svg = response.ok ? await response.text() : '';
      if (!svg.includes('<svg')) throw new Error(`${url} ${layer} answered ${response.status} and no drawing`);
      await new Promise(resolve => setTimeout(resolve, 500));
      for (const [, style, d] of svg.replace(/<defs>[\s\S]*?<\/defs>/g, '').matchAll(/<path style="([^"]*)" d="([^"]*)"/g)) {
        if (!style.includes('stroke:none') || (fill && !style.includes(`fill:${fill};`))) continue;
        if (/[^MLZ\d\s.e-]/.test(d)) throw new Error(`${url} ${layer}: a path not of straight lines`);
        const rings = d.split('M').map(part => part.match(/-?\d+(?:\.\d+)?(?:e-?\d+)?/g)?.map(Number) ?? [])
          .filter(numbers => numbers.length >= 6)
          .map(numbers => Array.from({ length: numbers.length / 2 }, (_, i) => [numbers[2 * i], numbers[2 * i + 1]]))
          // Closed, as simplifyRing has rings: a path's Z closes its ring without repeating the first point.
          .map(ring => (ring.at(-1).join() === ring[0].join() ? ring : [...ring, ring[0]]));
        if (!rings.length) continue;
        const pixels = rings.flat();
        const reaches = {
          west: pixels.some(([x]) => x < WMS_EDGE_PX), east: pixels.some(([x]) => x > width - WMS_EDGE_PX),
          north: pixels.some(([, y]) => y < WMS_EDGE_PX), south: pixels.some(([, y]) => y > height - WMS_EDGE_PX),
        };
        if ((reaches.west && tile[0] === west) || (reaches.east && tile[2] === east)
          || (reaches.south && tile[1] === south) || (reaches.north && tile[3] === north)) {
          throw new Error(`${city.id} ${kind}: a zone reaches the edge of the box`);
        }
        const lngLats = rings.map(ring => ring.map(([x, y]) => gridToLngLat(
          tile[0] + ((x + 0.5) * (tile[2] - tile[0])) / width, tile[3] - ((y + 0.5) * (tile[3] - tile[1])) / height, grid)));
        (Object.values(reaches).some(Boolean) ? cut : whole).push(...nestedPolygons(lngLats));
      }
    }
  }
  // A zone whole in two tiles is taken once; each piece of one cut is within one taken whole.
  const centre = ring => [ring.reduce((sum, [lng]) => sum + lng, 0) / ring.length, ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length];
  const near = ([lng0, lat0], [lng1, lat1]) => Math.abs(lat1 - lat0) * 110_540 < 0.5
    && Math.abs(lng1 - lng0) * 111_320 * Math.cos((lat0 * Math.PI) / 180) < 0.5;
  const polygons = [];
  for (const polygon of whole) if (!polygons.some(([outer]) => near(centre(outer), centre(polygon[0])))) polygons.push(polygon);
  for (const [piece] of cut) {
    if (!polygons.some(([outer]) => within(centre(piece), outer))) throw new Error(`${city.id} ${kind}: a zone wider than the tiles overlap`);
  }
  // Numbered from the north-west, so that a zone keeps its number as long as the layer keeps its zones.
  polygons.sort((a, b) => centre(b[0])[1] - centre(a[0])[1] || centre(a[0])[0] - centre(b[0])[0]);
  return outerRings(polygons, { minAreaKm2: 0, tolerance: TOLERANCE_M, digits: DIGITS, holes: true })
    .map((ring, index) => ({ id: `${city.id}-${slug(kind)}-${index + 1}`, kind, name: city.place, ring }));
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
    const pathname = layer.boundary ? null : new URL(layer.url).pathname;
    const found = layer.boundary ? await boundaryZones(city, layer)
      : pathname.endsWith('/FeatureServer') ? await featureServerZones(city, layer)
        : pathname.endsWith('/wms') ? await wmsZones(city, layer)
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
