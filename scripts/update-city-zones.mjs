import { execFileSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createWriteStream, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { get as httpsGet } from 'node:https';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { inflateRawSync, inflateSync } from 'node:zlib';
import { boundary, outerRings, planeArea, simplifyRing, toPlane, writeCatalog } from './boundaries.mjs';

// Writes data/city-zones/<id>.json, each city's zones from the layers data/city-zones.json lists,
// and fills in each city's bounds and number of zones there. Bergen kommune's are ArcGIS layers,
// whose query answers each zone's name but not its shape: identify, which the city's map calls on
// a click, answers both, for every zone within an envelope; so are Augsburg's parking places and
// Kassel's bike racks, points. Porto's sharing points are entities of
// Porto Digital's FIWARE broker, each a point with its number of spots. The City of Boise's are an
// ArcGIS feature service, whose query answers every zone's shape, and its parking corrals points;
// so are the City of Västerås's, some zones of several parts and a few with holes. Norrköpings
// kommun's are WMS layers, served as pictures only: drawn as SVG, each zone is a path in the
// picture's pixels, read back to its SWEREF 99 grid and so to latitude and longitude.
// A layer may instead name a boundary (scripts/boundaries.mjs): Arlington National Cemetery's,
// where federal rules forbid riding, is its OpenStreetMap outline. Boulder's are Lime's, from the
// public zone file its rider app draws them from, each zone an encoded polyline. The City of Omaha's
// are an ArcGIS feature service too, its zones named in another field. Nagoya's are no
// zones but lines: the pavements where a scooter in its 6 km/h mode may ride, from the Aichi
// police's traffic rules as JARTIC publishes them, a zip of one CSV of the whole prefecture.
// A layer of format geojson is GeoJSON: Berlin's, Hamburg's, Helsinki's, München's, Münster's and Wien's are WFS layers,
// asked for so, Turku's an OGC API's collections, Sacramento's a feature service's query answered
// as GeoJSON, Basel's an open data portal's export and Tampa's its GeoHub's download, as the City's
// map server answers only the United States; Poznań's, of format kml, are a Google My
// Maps map's KML, read as GeoJSON, and Orlando's parking areas, of format kmz, a KMZ its map
// serves. Stavanger's, of format nivel, are the zones Nivel's platform
// serves to the map the kommune's page embeds, and Long Beach's and Nashville's, of format
// populus, the shapes of policies on Populus's public policy map, which each city links; both are
// read as GeoJSON. Le Chesnay-Rocquencourt's, of format artifica, are the markers of the Artifica
// map widget the town's page embeds, also read as GeoJSON, as are Mülheim an der Ruhr's stations,
// of format drupal, the points its page's map carries, and Nürnberg's two areas, of format
// geomaps, a map of the city's GeoMaps service. Stuttgart's and Düsseldorf's are WFS layers too,
// read in the grid they are drawn in, ETRS89 / UTM 32N, as Stuttgart's rounds degrees to four
// places. Helsingborg's is the area of a local
// traffic rule, read from the map of Transportstyrelsen's register of them (STFS), in SWEREF 99 TM.
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
const KINDS = new Set(['parking', 'racksOnly', 'noParking', 'slow', 'noRide', 'pavement']);

const path = resolve(process.cwd(), 'data/city-zones.json');
const catalog = JSON.parse(readFileSync(path, 'utf8'));
const only = process.argv.slice(2);

async function getJson(url) {
  try {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    return await response.json();
  } catch (error) {
    // Wien's WFS sends its longer answers in more empty HTTP/2 frames than fetch takes: those are
    // asked for again over HTTP/1.1.
    if (error.cause?.code !== 'ERR_HTTP2_TOO_MANY_INVALID_FRAMES') throw error;
    return getJsonOverHttp1(url);
  }
}

async function getText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.text();
}

function getJsonOverHttp1(url) {
  return new Promise((done, fail) => {
    httpsGet(url, { headers: { 'User-Agent': USER_AGENT } }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        fail(new Error(`${url} answered ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk)).on('error', fail).on('end', () => {
        try { done(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (error) { fail(error); }
      });
    }).on('error', fail);
  });
}

const slug = kind => kind.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

/** How long identify waits between the quarters of an envelope, so a city's server is asked about once a second. */
const IDENTIFY_PAUSE_MS = 1000;

/**
 * An ArcGIS layer's zones, each one ring, or a point drawn as a disc: identify over the envelope round
 * the municipality, those whose attributes have the values `match` gives each, named by `nameField`
 * less the pattern `nameTrim`, unless it is one of the placeholders `unnamed` lists, or else, for a
 * point, `pointName`. Identify answers attributes by their aliases, an empty one as "Null". Bergen's
 * are read so, as its query answers one no-parking zone without a shape; Augsburg's parking places,
 * as its layer answers no query at all; and Kassel's bike racks, as its query answers none of their
 * places. Identify answers at most the service's maxRecordCount: an envelope with as many is asked
 * for again in quarters, as Kassel's 2,128 racks are. Those within a zone an earlier layer drew and
 * `outside` names are left out, as Kassel's racks within its Innenstadtring, where a scooter is
 * parked only on the ring's marked places.
 */
async function arcgisZones(city, { kind, url, layer, envelope, match = {}, nameField = 'Navn', nameTrim, unnamed = [], pointName, outside }, earlier) {
  const { maxRecordCount = 1000 } = await getJson(`${url}?f=json`);
  const results = new Map();
  const identify = async ([west, south, east, north]) => {
    const box = [west, south, east, north].join(',');
    const query = new URLSearchParams({ geometry: box, geometryType: 'esriGeometryEnvelope', sr: '4326',
      layers: `all:${layer}`, tolerance: '0', mapExtent: box, imageDisplay: '2000,2000,96', returnGeometry: 'true', f: 'json' });
    const body = await getJson(`${url}/identify?${query}`);
    if (!Array.isArray(body.results)) throw new Error(`${url} answered no zones`);
    if (body.results.length < maxRecordCount) {
      for (const result of body.results) results.set(String(result.attributes.OBJECTID), result);
      return;
    }
    const [x, y] = [(west + east) / 2, (south + north) / 2];
    for (const quarter of [[west, south, x, y], [x, south, east, y], [west, y, x, north], [x, y, east, north]]) {
      await new Promise(done => setTimeout(done, IDENTIFY_PAUSE_MS));
      await identify(quarter);
    }
  };
  await identify(envelope.split(',').map(Number));
  const has = attributes => Object.entries(match).every(([key, values]) => [values].flat().includes(attributes[key] ?? null));
  const areas = outside ? earlier.filter(zone => zone.name === outside) : [];
  if (outside && !areas.length) throw new Error(`${city.id}: no zone ${outside} drawn before its ${kind}`);
  const inArea = ({ x, y, rings }) => {
    const [lng, lat] = Number.isFinite(x) ? [x, y] : rings?.[0]?.[0] ?? [];
    return areas.some(zone => within([lat, lng], zone.ring));
  };
  return [...results.values()].filter(({ attributes, geometry }) => has(attributes) && !inArea(geometry ?? {})).map(({ attributes, geometry }) => {
    const id = `${city.id}-${slug(kind)}-${attributes.OBJECTID}`;
    let given = String(attributes[nameField] ?? '').trim();
    if (given && nameTrim) given = given.replace(new RegExp(nameTrim), '').trim();
    const name = given && !unnamed.includes(given) ? given : null;
    if (Number.isFinite(geometry?.x) && Number.isFinite(geometry?.y)) {
      return { id, kind, name: name || pointName || city.place, ring: disc(geometry.y, geometry.x) };
    }
    if (geometry?.rings?.length !== 1) throw new Error(`${url}: zone ${attributes.OBJECTID} is not one ring`);
    return { id, kind, name, ring: simplifyRing(geometry.rings[0], TOLERANCE_M, DIGITS) };
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
 * A feature or map service layer's zones, those `where` picks: each part of a polygon one ring, its holes
 * kept as outerRings keeps an enclave, each point a disc, named by its `Name`, or else after the
 * city, as all are where `nameField` is null: Antwerpen's names are mostly ids. `nameField` may
 * list fields, their values joined, as Denver's corrals are named by number and street, and a
 * field of coded values, as Budapest's zones have, gives the name its domain gives the code. A
 * point without a name is named by its `CorralType`, or `pointName`, as half of Vilnius's parking
 * places are, or as a corral. A zone of several parts is a zone for each, numbered, but for its slivers. `idTag`
 * goes into each zone's id where two layers of one kind number theirs alike, as Ottawa's two of
 * parking places do.
 */
async function featureServerZones(city, { kind, url, layer, where = '1=1', nameField = 'Name', idTag, pointName }) {
  const query = new URLSearchParams({ where, outFields: '*', returnGeometry: 'true', outSR: '4326', f: 'json' });
  const body = await getJson(`${url}/${layer}/query?${query}`);
  if (!Array.isArray(body.features) || body.exceededTransferLimit) throw new Error(`${url}/${layer} answered no whole layer`);
  // The layer's object id, which Washington's no-riding layer has as OBJECTID_1, its OBJECTID repeated.
  const idField = body.fields?.find(field => field.type === 'esriFieldTypeOID')?.name ?? 'OBJECTID';
  const codes = Object.fromEntries([nameField ?? []].flat().map(field => [field, body.fields?.find(({ name }) => name === field)?.domain?.codedValues ?? []]));
  return body.features.flatMap(({ attributes, geometry }) => {
    const objectId = attributes[idField];
    const id = `${city.id}-${slug(kind)}-${idTag ? `${idTag}-` : ''}${objectId}`;
    const name = nameField ? [nameField].flat().map(field => {
      const value = attributes[field];
      return String(codes[field].find(({ code }) => code === value)?.name ?? value ?? '').trim();
    }).filter(Boolean).join(' ') : null;
    if (Number.isFinite(geometry?.x) && Number.isFinite(geometry?.y)) {
      const corral = attributes.CorralType ? `${attributes.CorralType} corral` : pointName ?? 'Corral';
      return [{ id, kind, name: name || corral, ring: disc(geometry.y, geometry.x) }];
    }
    if (!geometry?.rings?.length) throw new Error(`${url}/${layer}: zone ${objectId} has no shape`);
    return polygonZones(id, kind, name || city.place, featurePolygons(geometry.rings));
  });
}

/**
 * A feature's polygons, each its outer ring and then its holes, as zones: each part one ring, its
 * holes kept as outerRings keeps an enclave, a zone of several parts a zone for each, numbered,
 * but for its slivers.
 */
function polygonZones(id, kind, name, featureParts, tolerance = TOLERANCE_M) {
  const area = ring => planeArea(toPlane(ring));
  const polygons = featureParts.map(([outer, ...holes]) => [outer, ...holes.filter(hole => area(hole) >= SLIVER_M2)]);
  const parts = polygons.length > 1 ? polygons.filter(([outer]) => area(outer) >= SLIVER_M2) : polygons;
  const rings = outerRings(parts, { minAreaKm2: 0, tolerance, digits: DIGITS, holes: true })
    .filter(ring => ring.length >= 3);
  return rings.map((ring, index) => ({ id: rings.length > 1 ? `${id}-${index + 1}` : id, kind, name, ring }));
}

/**
 * A GeoJSON layer's zones, those whose properties have the values `match` gives each (null for a
 * property left empty) and not all those `except` gives, as Braunschweig's no-parking zones leave
 * out its old town's, where a scooter is parked only at a station: a WFS's or an OGC API's
 * features, asked for as GeoJSON in latitude and longitude, or an open data portal's export.
 * Polygons are zones as a feature service's are, and points discs, named by `nameField` less the
 * pattern `nameTrim`, as the kind's abbreviation Braunschweig's begin with ("PVZ - "), unless it
 * is one of the placeholders `unnamed` lists, as Berlin's "VRAO", or else `pointName`, or after
 * the city. A zone's id is its
 * `idField`, or the feature's id without the layer's name before it, as Helsinki's WFS gives them
 * and Hamburg's (DE.HH.UP_PARKVERBOTSZONEN_E_SCOOTER_6), or for a feature without one, as
 * Münster's are, a hash of its shape, as it is with `shapeIds` too, for a layer whose ids change
 * from one answer to the next: Stockholm's WFS makes its layer anew each night, ids and row
 * numbers too. `idTag` goes into each zone's id where two layers of one kind number theirs alike,
 * as Stuttgart's no-parking zones and its pedestrian zones may. A feature without a shape, as one
 * of Hamburg's, is no zone.
 * A layer may keep its rings to within a coarser `tolerance` in metres than TOLERANCE_M: München's
 * 791 no-parking zones, drawn to the centimetre, would otherwise be 30,000 points. Or a finer one:
 * Stockholm's parking place at John Ericssonsgatan 14, 70 cm wide, would otherwise be a line. A
 * layer of zones may leave its points out, `polygonsOnly`: Turku's hold a few, each inside a zone
 * of its own kind; or only those within a zone of its kind an earlier layer drew, `pointsOutside`:
 * 89 of Rīga's 121 parking points mark parking places its other layer draws as shapes.
 * A layer of format kml is a KML file's placemarks, read as GeoJSON (kmlFeatures), one of format
 * kmz those of the KML file a KMZ holds (kmzFeatures), one of format zip a zip of GeoJSON files
 * (zipFeatures), one of format nivel the active zones of a Nivel public map (nivelFeatures), one
 * of format populus a policy's shapes on Populus's public policy map (populusFeatures), one of
 * format geopdf the point symbols of a georeferenced PDF's map (geopdfFeatures), one of format
 * artifica the markers of the Artifica map widget a page embeds (artificaFeatures), one of format
 * drupal the points of an OpenLayers map a Drupal page carries (drupalFeatures), and one of format
 * geomaps the shapes of a map of Nürnberg's GeoMaps service (geomapsFeatures).
 */
async function geojsonZones(city, { kind, format, url, policy, ocg, symbols, openlayers, geomap, grid, match = {}, except, nameField, nameTrim, unnamed = [], idField, idTag, shapeIds, pointName, tolerance, polygonsOnly, pointsOutside }, earlier) {
  const body = format === 'kml' ? kmlFeatures(await getText(url)) : format === 'kmz' ? await kmzFeatures(url)
    : format === 'zip' ? await zipFeatures(url) : format === 'nivel' ? nivelFeatures(await getJson(url), url)
      : format === 'populus' ? await populusFeatures(url, policy)
        : format === 'geopdf' ? await geopdfFeatures(url, ocg, symbols) : format === 'artifica' ? await artificaFeatures(url)
          : format === 'drupal' ? drupalFeatures(await getText(url), url, openlayers)
            : format === 'geomaps' ? await geomapsFeatures(url, geomap) : await getJson(url);
  if (!Array.isArray(body.features)) throw new Error(`${url} answered no features`);
  // A layer in a grid's metres, which a service gives to the millimetre where its degrees are rounded to metres.
  if (grid) {
    if (!GRIDS[grid] || !body.crs?.properties?.name?.endsWith(grid.replace(':', '::'))) throw new Error(`${url} answered no ${grid}`);
    const toLngLat = coordinates => typeof coordinates[0] === 'number' ? gridToLngLat(coordinates[0], coordinates[1], GRIDS[grid])
      : coordinates.map(toLngLat);
    body.features.forEach(({ geometry }) => { if (geometry) geometry.coordinates = toLngLat(geometry.coordinates); });
  }
  // A service that pages its answer is asked for all of it at once.
  if ((Number.isFinite(body.numberMatched) && body.numberMatched !== body.features.length) || body.links?.some(link => link.rel === 'next')) {
    throw new Error(`${url} answered ${body.features.length} of its features`);
  }
  const has = (properties, given) => Object.entries(given).every(([key, values]) => [values].flat().includes(properties?.[key] ?? null));
  const wanted = ({ properties }) => has(properties, match) && !(except && has(properties, except));
  const covered = ([lng, lat]) => pointsOutside && earlier.some(zone => zone.kind === kind && zone.ring && within([lat, lng], zone.ring));
  let left = 0;
  const zones = body.features.filter(wanted).flatMap(feature => {
    const { properties, geometry } = feature;
    if (geometry === null) {
      console.log(`${city.id} ${kind}: ${feature.id ?? 'a feature'} has no shape`);
      return [];
    }
    if (polygonsOnly && /Point$/.test(geometry.type)) {
      console.log(`${city.id} ${kind}: ${feature.id ?? 'a feature'} is a point, left out`);
      return [];
    }
    const featureId = idField ? String(properties[idField] ?? '')
      : feature.id != null && !shapeIds ? String(feature.id).replace(/^.*\./, '').replace(/^.*_(?=\d+$)/, '')
        : createHash('sha1').update(JSON.stringify(geometry?.coordinates ?? null)).digest('hex').slice(0, 8);
    if (!featureId) throw new Error(`${url}: a feature has no ${idField}`);
    const id = `${city.id}-${slug(kind)}-${idTag ? `${idTag}-` : ''}${featureId}`;
    let given = nameField && String(properties[nameField] ?? '').trim();
    if (given && nameTrim) given = given.replace(new RegExp(nameTrim), '').trim();
    const name = given && !unnamed.includes(given) ? given : null;
    switch (geometry?.type) {
      case 'Point':
      case 'MultiPoint': {
        const given = geometry.type === 'Point' ? [geometry.coordinates] : geometry.coordinates;
        const points = given.filter(point => !covered(point));
        left += given.length - points.length;
        return points.map(([lng, lat], index) => ({ id: points.length > 1 ? `${id}-${index + 1}` : id, kind,
          name: name || pointName || city.place, ring: disc(lat, lng) }));
      }
      case 'Polygon': return polygonZones(id, kind, name || city.place, [geometry.coordinates], tolerance);
      case 'MultiPolygon': return polygonZones(id, kind, name || city.place, geometry.coordinates, tolerance);
      default: throw new Error(`${url}: zone ${featureId} is a ${geometry?.type ?? 'feature without a shape'}`);
    }
  });
  if (left) console.log(`${city.id} ${kind}: ${left} points within a zone of their kind, left out`);
  return zones;
}

/**
 * A KML file's placemarks as GeoJSON features, as Google My Maps exports a map: each placemark's
 * properties its folder's name, `folder`, its own, `name`, its `description`, which gives each of
 * Orlando's parking areas its address, and its data, or its schema's data, as Rīga's portal
 * exports it, and its shape a point or a polygon, its outer ring and then its holes.
 * Any other shape is given by its name, for geojsonZones to refuse.
 */
function kmlFeatures(kml) {
  const text = value => value.trim().replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
  const element = (xml, tag) => new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml)?.[1];
  const positions = list => list.trim().split(/\s+/).map(position => position.split(',').slice(0, 2).map(Number));
  const folders = [...kml.matchAll(/<Folder\b[^>]*>([\s\S]*?)<\/Folder>/g)].map(([, folder]) => folder);
  return {
    features: (folders.length ? folders : [kml]).flatMap(folder => [...folder.matchAll(/<Placemark\b[^>]*>([\s\S]*?)<\/Placemark>/g)]
      .map(([, placemark]) => {
        const properties = { folder: folders.length ? text(element(folder, 'name') ?? '') : null, name: text(element(placemark, 'name') ?? ''),
          description: text(element(placemark, 'description') ?? '') };
        for (const [, key, value] of placemark.matchAll(/<Data name="([^"]+)">\s*<value>([\s\S]*?)<\/value>/g)) properties[text(key)] = text(value);
        for (const [, key, value] of placemark.matchAll(/<SimpleData name="([^"]+)">([\s\S]*?)<\/SimpleData>/g)) properties[text(key)] = text(value);
        const point = element(placemark, 'Point');
        const polygon = element(placemark, 'Polygon');
        const geometry = point ? { type: 'Point', coordinates: positions(element(point, 'coordinates'))[0] }
          : polygon ? { type: 'Polygon', coordinates: [...polygon.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)].map(([, ring]) => positions(ring)) }
            : { type: /<(LineString|MultiGeometry|Model|Track|gx:Track)>/.exec(placemark)?.[1] ?? null };
        return { properties, geometry };
      })),
  };
}

/**
 * A zip's files, each its name and bytes, read entry by entry from its central directory rather
 * than unpacked: Braunschweig's open data names its files in a DOS code page that macOS's file
 * system refuses. Only the files whose names `wanted` takes are inflated.
 */
async function zipEntries(url, wanted) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const zip = Buffer.from(await response.arrayBuffer());
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw new Error(`${url} is no zip`);
  const entries = [];
  for (let entry = zip.readUInt32LE(end + 16), count = zip.readUInt16LE(end + 10); count > 0; count--) {
    if (zip.readUInt32LE(entry) !== 0x02014b50) throw new Error(`${url}: its central directory is broken`);
    const method = zip.readUInt16LE(entry + 10);
    const size = zip.readUInt32LE(entry + 20);
    const nameLength = zip.readUInt16LE(entry + 28);
    const name = zip.toString('latin1', entry + 46, entry + 46 + nameLength);
    const header = zip.readUInt32LE(entry + 42);
    const data = header + 30 + zip.readUInt16LE(header + 26) + zip.readUInt16LE(header + 28);
    entry += 46 + nameLength + zip.readUInt16LE(entry + 30) + zip.readUInt16LE(entry + 32);
    if (!wanted(name)) continue;
    if (method !== 0 && method !== 8) throw new Error(`${url}: ${name} is compressed by method ${method}`);
    const bytes = zip.subarray(data, data + size);
    entries.push({ name, bytes: method === 8 ? inflateRawSync(bytes) : bytes });
  }
  return entries;
}

/** A zip of GeoJSON files' features, as one answer: Braunschweig's open data gives each of its zones a file of its own. */
async function zipFeatures(url) {
  const features = [];
  for (const { name, bytes } of await zipEntries(url, name => /\.(geo)?json$/i.test(name))) {
    const file = JSON.parse(bytes.toString('utf8'));
    if (!Array.isArray(file.features)) throw new Error(`${url}: ${name} holds no features`);
    features.push(...file.features);
  }
  if (!features.length) throw new Error(`${url} holds no GeoJSON`);
  return { features };
}

/** A KMZ's placemarks, those of the KML file it holds, as the City of Orlando's map of its parking areas serves them. */
async function kmzFeatures(url) {
  const files = await zipEntries(url, name => /\.kml$/i.test(name));
  if (files.length !== 1) throw new Error(`${url} holds ${files.length} KML files`);
  return kmlFeatures(files[0].bytes.toString('utf8'));
}

/**
 * Stavanger kommune's zones, as Nivel's micromobility platform serves them to the public map the
 * kommune's page embeds: a list of zones, each with its name, what it sets (`is_parking`,
 * `has_no_parking`, `has_speed_limit`, `has_no_access`, `is_municipal_boundary`) and its shape, a
 * GeoJSON polygon given as text. Only zones whose status is active are kept.
 */
function nivelFeatures(zones, url) {
  if (!Array.isArray(zones)) throw new Error(`${url} answered no zones`);
  return {
    features: zones.filter(zone => zone.status === 'active').map(({ polygons, ...properties }) => ({
      id: properties.id, properties, geometry: JSON.parse(polygons.main),
    })),
  };
}

/**
 * The points of a Drupal page's OpenLayers map, from the settings the page carries (Drupal.settings),
 * as GeoJSON points: Mülheim an der Ruhr's page of its e-scooter stations draws them so, while its
 * GeoServer gives the layer only as a picture. Each feature of the map's layer named `openlayers` is
 * a WKT point in latitude and longitude, named by the text of its title's link and numbered by the
 * node the link leads to.
 */
function drupalFeatures(page, url, openlayers) {
  const settings = /jQuery\.extend\(Drupal\.settings, (\{[\s\S]*?\})\);/.exec(page)?.[1];
  const layers = settings ? Object.values(JSON.parse(settings).openlayers?.maps ?? {}).map(map => map.layers?.[openlayers]).filter(Boolean) : [];
  if (!layers.length) throw new Error(`${url}: no map layer ${openlayers}`);
  const text = value => value.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').trim();
  return {
    features: layers.flatMap(layer => Object.values(layer.features ?? {})).map(({ projection, attributes, wkt }) => {
      if (projection !== 'EPSG:4326') throw new Error(`${url}: a feature in ${projection}`);
      const point = /^POINT \((-?[\d.]+) (-?[\d.]+)\)$/.exec(wkt?.trim() ?? '');
      const link = /<a href="[^"]*\/(\d+)">([^<]*)<\/a>/.exec(attributes?.title ?? '');
      return { id: link?.[1] ?? null, properties: { name: link ? text(link[2]) : null },
        geometry: point ? { type: 'Point', coordinates: [Number(point[1]), Number(point[2])] } : { type: wkt?.trim().split(/\s*\(/)[0] ?? null } };
    }),
  };
}

/**
 * A map of Nürnberg's GeoMaps service, which the city's pages embed (`_NbgGeoMaps`), as GeoJSON:
 * each layer's active shapes, Esri rings in ETRS89 / UTM 32N, each a feature with its title and its
 * layer's name. The service is asked as the pages ask it, by POST.
 */
async function geomapsFeatures(url, geomap) {
  const response = await fetch(url, { method: 'POST', headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapIds: [geomap] }) });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const map = (await response.json()).data?.[geomap];
  if (!Array.isArray(map?.layers)) throw new Error(`${url} answered no map ${geomap}`);
  return {
    features: map.layers.flatMap(({ layerName, pois = [] }) => pois.filter(poi => poi.isActive === 1).map(({ id, title, geometry }) => {
      if (geometry?.spatialReference?.wkid !== 25832 || !geometry.rings?.length) throw new Error(`${url}: ${title} is no shape in EPSG:25832`);
      const rings = geometry.rings.map(ring => ring.map(([easting, northing]) => gridToLngLat(easting, northing, GRIDS['EPSG:25832'])));
      return { id, properties: { layer: layerName, title }, geometry: { type: 'MultiPolygon', coordinates: featurePolygons(rings) } };
    })),
  };
}

/**
 * A georeferenced PDF's point symbols as GeoJSON points, as Metro Nashville's map of its downtown
 * corrals draws them (exported from ArcGIS Pro): the shapes filled within its optional content
 * (layer) named `ocg`, each at the centre of its shape and named by its fill colour as `symbols`
 * gives it, or left out where `symbols` gives null (the corrals for bikes alone). A colour it does
 * not list is refused, as a changed legend. The page's viewport gives the map's frame in Web
 * Mercator and its corners' latitude and longitude, so a symbol's centre, where the map puts its
 * point, is read to within about a metre. The content of each form of the file is read alone, as
 * the page draws it, unmoved.
 */
async function geopdfFeatures(url, ocg, symbols) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const pdf = Buffer.from(await response.arrayBuffer()).toString('latin1');
  const numbers = list => list.trim().split(/\s+/).map(Number);
  const frame = /\/VP\s*\[\s*<<\s*\/BBox\s*\[([^\]]+)\][\s\S]*?\/WKT\s*\(PROJCS\["([^"]*)"[\s\S]*?\/GPTS\s*\[([^\]]+)\]\s*\/LPTS\s*\[([^\]]+)\]/.exec(pdf);
  if (!frame || !/Mercator/.test(frame[2])) throw new Error(`${url}: no map frame in Web Mercator`);
  const [x0, y0, x1, y1] = numbers(frame[1]);
  // Its corners' latitude and longitude, from the frame's lower left round to its lower right.
  const corners = numbers(frame[3]);
  const [south, west, north, , , east] = corners;
  if (frame[4].trim().replace(/\s+/g, ' ') !== '0 0 0 1 1 1 1 0' || corners[3] !== west || corners[4] !== north || corners[6] !== south || corners[7] !== east) {
    throw new Error(`${url}: its map frame is not upright`);
  }
  const mercator = lat => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
  const place = (x, y) => {
    const v = mercator(south) + ((y - y0) / (y1 - y0)) * (mercator(north) - mercator(south));
    return [Number((west + ((x - x0) / (x1 - x0)) * (east - west)).toFixed(DIGITS)),
      Number(((Math.atan(Math.exp(v)) * 360) / Math.PI - 90).toFixed(DIGITS))];
  };
  // Its objects, those packed in object streams too, and its forms' content.
  const objects = new Map();
  const forms = [];
  for (const match of pdf.matchAll(/\d+ 0 obj\s*<<((?:(?!endobj)[\s\S])*?)>>\s*stream\r?\n/g)) {
    const [, dict] = match;
    const kind = /\/Type\s*\/ObjStm/.test(dict) ? 'objects' : /\/Subtype\s*\/Form/.test(dict) ? 'form' : null;
    if (!kind) continue;
    const start = match.index + match[0].length;
    // A length given, not one in another object: "/Length 38 0 R" is not read as 3.
    const length = /\/Length\s+(\d+)\b(?!\s+\d+\s+R)/.exec(dict)?.[1];
    const raw = Buffer.from(pdf.slice(start, length ? start + Number(length) : pdf.indexOf('endstream', start)), 'latin1');
    const data = (/\/FlateDecode/.test(dict) ? inflateSync(raw) : raw).toString('latin1');
    if (kind === 'form') {
      forms.push({ data, matrix: numbers(/\/Matrix\s*\[([^\]]+)\]/.exec(dict)?.[1] ?? '1 0 0 1 0 0') });
      continue;
    }
    const first = Number(/\/First\s+(\d+)/.exec(dict)[1]);
    const header = numbers(data.slice(0, first));
    for (let i = 0; i < header.length; i += 2) objects.set(header[i], data.slice(first + header[i + 1], i + 3 < header.length ? first + header[i + 3] : data.length));
  }
  for (const [, number, body] of pdf.matchAll(/(\d+) 0 obj\s*(<<(?:(?!endobj|stream)[\s\S])*?>>)\s*endobj/g)) objects.set(Number(number), body);
  const text = literal => {
    const bytes = literal.replace(/\\([nrtbf()\\]|[0-7]{1,3}|\r?\n)/g, (_, escape) => (/^[0-7]/.test(escape) ? String.fromCharCode(parseInt(escape, 8))
      : { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f' }[escape] ?? (/^\r?\n$/.test(escape) ? '' : escape)));
    return bytes.startsWith('\xfe\xff') ? Buffer.from(bytes.slice(2), 'latin1').swap16().toString('utf16le') : bytes;
  };
  const layers = new Set([...objects].filter(([, body]) => /\/Type\s*\/OCG\b/.test(body)
    && text(/\/Name\s*\(((?:\\[\s\S]|[^\\)])*)\)/.exec(body)?.[1] ?? '') === ocg).map(([number]) => number));
  if (!layers.size) throw new Error(`${url}: no layer named ${ocg}`);
  const marked = new Set();
  for (const body of objects.values()) {
    for (const [, properties] of body.matchAll(/\/Properties\s*<<((?:(?!>>)[\s\S])*)>>/g)) {
      for (const [, name, number] of properties.matchAll(/\/([^\s/<>[\]()]+)\s*(\d+)\s+0\s+R/g)) if (layers.has(Number(number))) marked.add(name);
    }
  }
  const features = [];
  for (const { data, matrix } of forms) {
    let ctm = matrix;
    let operands = [];
    let fill = null;
    let path = [];
    const saved = [];
    const marks = [];
    for (const [token] of data.matchAll(/\((?:\\[\s\S]|[^\\)])*\)|<<|>>|<[\da-fA-F\s]*>|\[|\]|\/[^\s/[\]()<>{}%]*|[+-]?(?:\d+\.?\d*|\.\d+)|[A-Za-z'"]+\*?|%[^\r\n]*/g)) {
      if (/^[+-]?[\d.]/.test(token)) { operands.push(Number(token)); continue; }
      if (/^[/([\]<>]/.test(token) || token.startsWith('%')) { if (!token.startsWith('%')) operands.push(token); continue; }
      const values = operands.filter(operand => typeof operand === 'number');
      switch (token) {
        case 'q': saved.push(ctm); break;
        case 'Q': ctm = saved.pop() ?? ctm; break;
        case 'cm': {
          const [a, b, c, d, e, f] = values.slice(-6);
          ctm = [a * ctm[0] + b * ctm[2], a * ctm[1] + b * ctm[3], c * ctm[0] + d * ctm[2], c * ctm[1] + d * ctm[3],
            e * ctm[0] + f * ctm[2] + ctm[4], e * ctm[1] + f * ctm[3] + ctm[5]];
          break;
        }
        case 'BDC': marks.push(operands[0] === '/OC' && marked.has(String(operands[1]).slice(1))); break;
        case 'BMC': marks.push(false); break;
        case 'EMC': marks.pop(); break;
        case 'sc': case 'scn': case 'rg': case 'g': case 'k': fill = values.join(' '); break;
        case 'm': case 'l': case 'c': case 'v': case 'y':
          for (let i = 0; i + 1 < values.length; i += 2) path.push([values[i], values[i + 1]]);
          break;
        case 're': {
          const [x, y, w, h] = values;
          path.push([x, y], [x + w, y + h]);
          break;
        }
        case 'f': case 'F': case 'f*': case 'B': case 'B*': case 'b': case 'b*':
          if (marks.includes(true) && path.length) {
            if (!(fill in symbols)) throw new Error(`${url}: ${ocg} holds a shape of colour ${fill}, which its legend did not`);
            const xs = path.map(([x]) => x);
            const ys = path.map(([, y]) => y);
            const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
            const [x, y] = [ctm[0] * cx + ctm[2] * cy + ctm[4], ctm[1] * cx + ctm[3] * cy + ctm[5]];
            if (x < x0 || x > x1 || y < y0 || y > y1) throw new Error(`${url}: ${ocg} holds a shape outside its map`);
            if (symbols[fill] !== null) features.push({ type: 'Feature', properties: { name: symbols[fill] }, geometry: { type: 'Point', coordinates: place(x, y) } });
          }
          path = [];
          break;
        case 'S': case 's': case 'n': path = []; break;
        default:
      }
      operands = [];
    }
  }
  if (!features.length) throw new Error(`${url}: no symbols in ${ocg}`);
  return { features };
}

/** Each Populus region's key and published policies, read once for all its layers. */
const populusRegions = new Map();

/**
 * A city's zones as Populus's public policy map shows them (app.populus.ai/<region>/public/policies):
 * the shapes of the published MDS policy of the given name, read as the map reads them, with the key
 * its page's script carries. The key is read from the script each time, never kept. A shape named
 * only by a number (Long Beach's numbers its no-parking areas) is left unnamed.
 */
async function populusFeatures(url, policy) {
  const region = /^\/([^/]+)\/public\/policies$/.exec(new URL(url).pathname)?.[1];
  if (!region) throw new Error(`${url} is no Populus policy map`);
  if (!populusRegions.has(region)) {
    populusRegions.set(region, (async () => {
      const page = await getText(url);
      const script = /<script type="module"[^>]*src="([^"]+\.js)"/.exec(page)?.[1];
      if (!script) throw new Error(`${url}: no script found`);
      const code = await getText(new URL(script, url).href);
      const variable = /"x-api-key":([A-Za-z_$][\w$]*)/.exec(code)?.[1];
      const key = variable && new RegExp(`[,;{\\s]${variable.replace(/\$/g, '\\$')}="([^"]+)"`).exec(code)?.[1];
      if (!key) throw new Error(`${url}: its script carries no key`);
      const get = async path => {
        const response = await fetch(`${new URL(url).origin}/v2/regions/${region}${path}`,
          { headers: { 'User-Agent': USER_AGENT, 'x-api-key': key, 'accept-language': 'en' } });
        if (!response.ok) throw new Error(`Populus ${region}${path} answered ${response.status}`);
        return response.json();
      };
      const { items, total } = await get('/mds/policies?page=1&size=100');
      if (!Array.isArray(items) || items.length !== total) throw new Error(`Populus ${region} answered ${items?.length} of ${total} policies`);
      return { get, items };
    })());
  }
  const { get, items } = await populusRegions.get(region);
  const found = items.filter(item => item.name.trim() === policy);
  if (found.length !== 1) throw new Error(`Populus ${region}: ${found.length} policies named ${policy}`);
  const { geographies } = await get(`/mds/policies/${found[0].policy_id}/geographies`);
  return {
    features: geographies.flatMap(({ geography_json: json }) => (json.type === 'FeatureCollection' ? json.features : [json]))
      .map(feature => ({ ...feature, properties: { ...feature.properties,
        name: /^\s*\d+\s*$/.test(feature.properties?.name ?? '') ? null : feature.properties?.name?.trim() ?? null } })),
  };
}

/**
 * The markers of the Artifica ("ICE") map widget the page at the url embeds, as GeoJSON points,
 * each with its own fields as properties and its id: Le Chesnay-Rocquencourt's places for Dott's
 * scooters and bikes. The widget's folders are its div's data-folders, and its key is in the
 * page's TYPO3 settings, read from the page each time, never kept nor printed. The widget's
 * answer is JSON, though sent as text/html.
 */
async function artificaFeatures(url) {
  const page = await getText(url);
  const key = /"TS":\{[^}]*"ice":"([A-Za-z0-9]+)"/.exec(page)?.[1];
  const folders = /class="artifica-map-widget"[^>]*?data-folders="([\d,\s]+)"/.exec(page)?.[1];
  if (!key || !folders) throw new Error(`${url}: no Artifica map widget found`);
  const query = new URLSearchParams([...folders.split(',').map(folder => ['datas[folders][]', folder.trim()]), ['key', key]]);
  const response = await fetch(`https://ice.artifica.fr/datas/widget/datas?${query}`, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url}: its Artifica widget answered ${response.status}`);
  const markers = JSON.parse(await response.text());
  if (!Array.isArray(markers)) throw new Error(`${url}: its Artifica widget answered no markers`);
  return {
    features: markers.filter(marker => marker.table === 'MARKER').map(({ id, lat, lng, ...properties }) => ({
      type: 'Feature', id, properties,
      geometry: Number.isFinite(lat) && Number.isFinite(lng) ? { type: 'Point', coordinates: [lng, lat] } : null,
    })),
  };
}

/**
 * A zone given here as its ring of [lat, lng], where a city names the streets round an area but
 * publishes no shape of it: Kassel's Innenstadtring, traced on OpenStreetMap along the streets its
 * page names, Steinweg, Frankfurter Straße, Fünffensterstraße, Ständeplatz, Scheidemannplatz,
 * Rudolf-Schwander-Straße, Lutherstraße and Kurt-Schumacher-Straße, and across the Altmarkt between
 * the last and the first.
 */
function ringZones(city, { kind, name, ring }) {
  if (!name || !Array.isArray(ring) || ring.length < 3) throw new Error(`${city.id}: a ${kind} ring needs a name and three corners`);
  return [{ id: `${city.id}-${slug(kind)}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, kind, name, ring: ring.map(([lat, lng]) => [lat, lng]) }];
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

/**
 * Grids a city's map may draw in, each a transverse Mercator projection of GRS 80: SWEREF 99 16 30,
 * Norrköping's, SWEREF 99 13 30, Halmstad's, SWEREF 99 TM, the national one, Transportstyrelsen's
 * register's, and ETRS89 / UTM 32N, Stuttgart's, Düsseldorf's and Nürnberg's.
 */
const GRIDS = { 'EPSG:3010': { meridian: 16.5, scale: 1, falseEasting: 150000 },
  'EPSG:3008': { meridian: 13.5, scale: 1, falseEasting: 150000 },
  'EPSG:3006': { meridian: 15, scale: 0.9996, falseEasting: 500000 },
  'EPSG:25832': { meridian: 9, scale: 0.9996, falseEasting: 500000 } };

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

/** A Google encoded polyline, as Lime's zone files give each zone, as [lng, lat] points. */
function decodePolyline(encoded) {
  const points = [];
  let at = 0, lat = 0, lng = 0;
  const delta = () => {
    let value = 0, shift = 0, byte;
    do {
      byte = encoded.charCodeAt(at++) - 63;
      value |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return value & 1 ? ~(value >>> 1) : value >>> 1;
  };
  while (at < encoded.length) {
    lat += delta();
    lng += delta();
    points.push([lng / 1e5, lat / 1e5]);
  }
  return points;
}

/** A Lime zone's name without its codes: "[Boulder][LSZ][[Boulder][LSZ][Pearl Street Mall\n]][low_speed_zone_MIGRATED_FROM_V2]". */
function limeZoneName(city, name) {
  const codes = new RegExp(`\\[(?:${city.place}|[A-Z]{2,3}(?: - \\w+)?|\\d+|Updated|REVISED|\\w+_MIGRATED_FROM_V2)\\]`, 'g');
  const plain = name.replace(/&amp;/g, '&').replace(/[\s ]+/g, ' ').replace(codes, ' ').replace(/[[\]]/g, ' ')
    .replace(/\b(?:NOZ|NPZ|LSZ|MPZ)\b,?/g, ' ').replace(/\s+/g, ' ').trim();
  return plain || city.place;
}

const limeFiles = new Map();
/**
 * Lime's zones of a `category`, from the zone file its rider app draws them from: each one ring, an
 * encoded polyline, kept if it holds for scooters, and below `maxAreaKm2` if given.
 */
async function limeZones(city, { kind, url, category, maxAreaKm2 = Infinity }) {
  if (!limeFiles.has(url)) limeFiles.set(url, getJson(url));
  const { zone_info: zones } = await limeFiles.get(url);
  if (!Array.isArray(zones)) throw new Error(`${url} answered no zones`);
  return zones.filter(zone => zone.category === category && zone.vehicle_types?.includes('scooter')).flatMap(zone => {
    if (!/^\w+$/.test(zone.zone_token ?? '')) throw new Error(`${url}: a zone without a token`);
    const ring = decodePolyline(zone.polygon);
    if (ring.at(-1).join() !== ring[0].join()) ring.push(ring[0]);
    if (planeArea(toPlane(ring)) / 1e6 >= maxAreaKm2) return [];
    return [{ id: `${city.id}-${slug(kind)}-${zone.zone_token.toLowerCase()}`, kind, name: limeZoneName(city, zone.name),
      ring: simplifyRing(ring, TOLERANCE_M, DIGITS) }];
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

/**
 * The columns of JARTIC's traffic rules read here, by their number in its spec (拡張版標準フォーマット
 * k_2.1, table 2 and 3.5), out of 170: a file whose header names them otherwise is not read.
 */
const JARTIC_COLUMNS = 170;
const JARTIC = {
  version: [1, '拡張版標準フォーマット種別・バージョン'],
  rule: [12, '共通規制種別コード'],
  shape: [13, '点・線・面コード'],
  key: [21, 'ユニークキー'],
  points: [24, '規制場所の経度緯度'],
  leftOut: [30, '除外区間及び区域の経度緯度'],
  condition: [131, '規制条件'],
};
// Five sets of whom and when a rule is for, from column 41, then five of whom and when it spares, from 86.
for (const [first, period, time, days, vehicles] of [[41, '対象期間', '規制時間', '規制曜日コード', '対象車両コード'],
  [86, '除外期間', '除外時間', '除外曜日コード', '除外車両コード']]) {
  for (let set = 1; set <= 5; set++) {
    const at = first + (set - 1) * 9;
    const names = [`${period}${set}_開始`, `${period}${set}_終了`, `${time}${set}_開始`, `${time}${set}_終了`, `${days}${set}`,
      ...['A', 'B', 'C', 'D'].map(category => `${vehicles}${set}_${category}`)];
    names.forEach((name, index) => { JARTIC[name] = [at + index, name]; });
  }
}
/** Rule 81, 普通自転車歩道通行可: bicycles, and since July 2023 e-scooters in their 6 km/h mode, may ride on the pavement. A line. */
const JARTIC_PAVEMENT = '81';
/**
 * What the Aichi file, converted from the police's older format (its versions marked 注), puts in the
 * columns of whom and when for every one of its rule-81 records: all day (0 to 2400, or 0 to 0 in the
 * sets after the first), weekday code 9, which the spec's table of days does not have, bicycles as the
 * vehicles it is for (D 100, 普通自転車) and "other" (D 100000000000000, その他) as those it spares.
 * A record with anything else, an hour, a day or a vehicle spared, as a plate 特例特定原付を除く would
 * be, stops the update: the map would draw it as holding always, for scooters too.
 */
const JARTIC_ALWAYS = { time: ['/', '0/2400', '0/0'], days: ['', '9'], for: ['', '100'], spared: ['', '100000000000000'] };

/** Whether the record's columns of whom and when are those of a rule for all, always (JARTIC_ALWAYS). */
function jarticAlways(values, column) {
  const value = name => values[column[name]];
  return [1, 2, 3, 4, 5].every(set => [
    ['対象期間', '規制時間', '規制曜日コード', '対象車両コード', JARTIC_ALWAYS.for],
    ['除外期間', '除外時間', '除外曜日コード', '除外車両コード', JARTIC_ALWAYS.spared],
  ].every(([period, time, days, vehicles, others]) => !value(`${period}${set}_開始`) && !value(`${period}${set}_終了`)
    && JARTIC_ALWAYS.time.includes(`${value(`${time}${set}_開始`)}/${value(`${time}${set}_終了`)}`)
    && JARTIC_ALWAYS.days.includes(value(`${days}${set}`))
    && ['A', 'B', 'C'].every(category => !value(`${vehicles}${set}_${category}`))
    && others.includes(value(`${vehicles}${set}_D`))));
}

/** A JARTIC record's values: each in double quotes, as its spec has them all, a quote within one doubled. */
function csvValues(record) {
  const values = [];
  let at = 0;
  for (;;) {
    if (record[at] !== '"') throw new Error(`A value not in quotes: ${record.slice(0, 80)}`);
    let value = '';
    for (at++; ;) {
      const quote = record.indexOf('"', at);
      if (quote < 0) throw new Error(`A value not closed: ${record.slice(0, 80)}`);
      value += record.slice(at, quote);
      at = quote + 1;
      if (record[at] !== '"') break;
      value += '"';
      at++;
    }
    values.push(value);
    if (at === record.length) return values;
    if (record[at++] !== ',') throw new Error(`Values not parted by commas: ${record.slice(0, 80)}`);
  }
}

/** Whether the point lies within the polygons, each its outer ring and then its holes, all of [lng, lat]. */
function withinPolygons(point, polygons) {
  return polygons.some(([outer, ...holes]) => within(point, outer) && !holes.some(hole => within(point, hole)));
}

/** The point halfway along the line, both of [lng, lat]. */
function halfway(line) {
  const plane = toPlane(line);
  const lengths = plane.slice(1).map(([x, y], index) => Math.hypot(x - plane[index][0], y - plane[index][1]));
  let left = lengths.reduce((sum, length) => sum + length, 0) / 2;
  for (const [index, length] of lengths.entries()) {
    if (left <= length) {
      const share = length ? left / length : 0;
      const [[lng0, lat0], [lng1, lat1]] = [line[index], line[index + 1]];
      return [lng0 + (lng1 - lng0) * share, lat0 + (lat1 - lat0) * share];
    }
    left -= length;
  }
  return line.at(-1);
}

/** How far, in metres of the plane, the point is from the segment. */
function segmentDistance([x, y], [x0, y0], [x1, y1]) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const share = dx || dy ? Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(x - x0 - share * dx, y - y0 - share * dy);
}

/**
 * The line, of [lng, lat] points, simplified by Douglas–Peucker to within `tolerance` metres of
 * each point it leaves out, measured to the piece that replaces it, so that a line which turns
 * back on itself keeps its far end: [lat, lng] points rounded to `digits` decimals, and how far
 * from them, at most, a point left out lies.
 */
function simplifyPath(line, tolerance, digits) {
  const plane = toPlane(line);
  const keep = new Uint8Array(line.length);
  keep[0] = keep[line.length - 1] = 1;
  let strays = 0;
  const stack = [[0, line.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let farthest = -1;
    let distance = 0;
    for (let i = a + 1; i < b; i++) {
      const d = segmentDistance(plane[i], plane[a], plane[b]);
      if (d > distance) [farthest, distance] = [i, d];
    }
    if (distance > tolerance) {
      keep[farthest] = 1;
      stack.push([a, farthest], [farthest, b]);
    } else strays = Math.max(strays, distance);
  }
  const points = line.filter((_, i) => keep[i]).map(([lng, lat]) => [Number(lat.toFixed(digits)), Number(lng.toFixed(digits))]);
  return { points, strays };
}

/**
 * The pavements where a scooter may ride, from JARTIC's open data of a prefecture's traffic
 * rules (「交通規制情報」): a zip of one CSV in Shift_JIS, as its spec (拡張版標準フォーマット k_2.1)
 * lays it out, read line by line as unzip gives it. Each record of rule 81 is a line along a
 * pavement, its points "lng lat" parted by ";", its sections by "/"; a section is kept if the
 * point halfway along it lies within the boundary `within` names, simplified to within a metre,
 * to the source's 5 decimals. The same line twice, either way round, is kept once. The records'
 * keys in a converted file (仮ユニークキー) change each month: a line's id is the old key within
 * it, which up to 404 of Aichi's records share, and the first 8 hex digits of the SHA-1 of its
 * points as the file gives them. The data names no street.
 */
async function jarticZones(city, { kind, url, within: area }) {
  const outline = await boundary(area);
  const directory = mkdtempSync(join(tmpdir(), 'jartic-'));
  try {
    const zip = join(directory, 'rules.zip');
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`${url} answered ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(zip));
    // Its name is the police's, in Shift_JIS, then the month the data is of and the spec's version.
    const names = execFileSync('unzip', ['-Z1', zip]).toString('latin1').split('\n').filter(name => /_k_2\.1\.csv$/.test(name));
    if (names.length !== 1) throw new Error(`${url} holds ${names.length} files of the k_2.1 spec`);
    const month = names[0].match(/_(\d{6})_k_2\.1\.csv$/)?.[1];
    if (!month) throw new Error(`${url}: no month in ${names[0]}`);

    const unzip = spawn('unzip', ['-p', zip, `*_${month}_k_2.1.csv`], { stdio: ['ignore', 'pipe', 'inherit'] });
    const exit = new Promise(resolve => unzip.on('close', resolve));
    const decoder = new TextDecoder('shift_jis', { fatal: true });
    const column = {};
    const found = [];
    let records = 0;
    let rest = '';
    let open = '';
    let short = 0;
    const read = line => {
      // A record runs on to the next line while one of its values is open: an odd number of quotes.
      const record = open ? `${open}\r\n${line}` : line;
      let quotes = 0;
      for (let at = record.indexOf('"'); at >= 0; at = record.indexOf('"', at + 1)) quotes++;
      if (quotes % 2) { open = record; return; }
      open = '';
      if (!records++) {
        const header = csvValues(record);
        if (header.length !== JARTIC_COLUMNS) throw new Error(`${url}: ${header.length} columns, not ${JARTIC_COLUMNS}`);
        for (const [key, [number, name]] of Object.entries(JARTIC)) {
          if (header[number - 1] !== name) throw new Error(`${url}: column ${number} is ${header[number - 1]}, not ${name}`);
          column[key] = number - 1;
        }
        return;
      }
      if (!record.includes(`"${JARTIC_PAVEMENT}"`)) return;
      const values = csvValues(record);
      if (values.length !== JARTIC_COLUMNS) throw new Error(`${url}: a record of ${values.length} values`);
      if (values[column.rule] !== JARTIC_PAVEMENT) return;
      const key = values[column.key];
      if (!values[column.version].startsWith('k_2.1')) throw new Error(`${key}: version ${values[column.version]}`);
      if (values[column.shape] !== '2') throw new Error(`${key}: rule ${JARTIC_PAVEMENT} not a line`);
      // A converted file's key: the prefecture, the month, a number of the month's and the old key, 17 digits.
      const parts = key.match(/^(\d\d)(\d{6})\d{7}([0-9a-z]{17})$/);
      if (parts?.[2] !== month) throw new Error(`${key}: not a key of a converted file of ${month}`);
      for (const section of values[column.points].split('/')) {
        const line = [];
        for (const point of section.split(';').filter(text => text.trim())) {
          const [lng, lat] = point.trim().match(/^(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)$/)?.slice(1).map(Number) ?? [];
          if (!(lng > 122 && lng < 154 && lat > 20 && lat < 46)) throw new Error(`${key}: point ${point} is not one in Japan`);
          if (line.at(-1)?.[0] !== lng || line.at(-1)?.[1] !== lat) line.push([lng, lat]);
        }
        if (line.length < 2) { short++; continue; }
        if (!withinPolygons(halfway(line), outline)) continue;
        if (values[column.leftOut] || values[column.condition] || !jarticAlways(values, column)) {
          throw new Error(`${key}: a part left out (除外区間), a condition (規制条件), an hour, a day or a vehicle not read here`);
        }
        const hash = createHash('sha1').update(section).digest('hex').slice(0, 8);
        found.push({ id: `${city.id}-${slug(kind)}-${parts[1]}-${parts[3].replace(/^0+/, '') || '0'}-${hash}`, line });
      }
    };
    for await (const chunk of unzip.stdout) {
      const lines = (rest + decoder.decode(chunk, { stream: true })).split('\r\n');
      rest = lines.pop();
      lines.forEach(read);
    }
    rest += decoder.decode();
    if (rest) read(rest);
    if (open) throw new Error(`${url}: the last record is not closed`);
    if ((await exit) !== 0) throw new Error(`${url}: unzip failed`);

    // Each line once, either way round, under the first of its ids.
    found.sort((a, b) => a.id.localeCompare(b.id));
    const seen = new Set();
    const zones = [];
    let strays = 0;
    let metres = 0;
    for (const { id, line } of found) {
      const forth = line.join(';');
      const back = [...line].reverse().join(';');
      if (seen.has(forth) || seen.has(back)) continue;
      seen.add(forth);
      const simple = simplifyPath(line, 1, 5);
      strays = Math.max(strays, simple.strays);
      const plane = toPlane(line);
      metres += plane.slice(1).reduce((sum, [x, y], index) => sum + Math.hypot(x - plane[index][0], y - plane[index][1]), 0);
      zones.push({ id, kind, name: '普通自転車歩道通行可', lines: [simple.points] });
    }
    console.log(`${city.id} ${kind}: ${records - 1} records of ${month}, ${found.length} lines of rule ${JARTIC_PAVEMENT} within,`
      + ` ${found.length - zones.length} of them twice, ${short} sections of one point left out; ${(metres / 1000).toFixed(1)} km,`
      + ` ${found.reduce((sum, { line }) => sum + line.length, 0)} points, kept within ${strays.toFixed(2)} m of the line`);
    return zones;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

/**
 * The area of a Swedish local traffic rule, from its page in Transportstyrelsen's register (STFS),
 * whose map is given the rule's features as GeoJSON in SWEREF 99 TM. Helsingborg's 1283 2022:502 is
 * one closed line round central Helsingborg, read as the ring of one zone named after the rule.
 */
async function stfsZones(city, { kind, url }) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  const quoted = /Register\.init\('[^']*',\s*'((?:[^'\\]|\\.)*)'\)/.exec(await response.text())?.[1];
  if (!quoted) throw new Error(`${url} has no map`);
  const { features } = JSON.parse(quoted.replace(/\\(.)/g, '$1'));
  return features.flatMap(({ geometry, properties }) => {
    const id = `${city.id}-${slug(kind)}-${properties.Beteckning.replace(/\W+/g, '-')}`;
    const rings = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.type === 'Polygon' ? geometry.coordinates : [];
    const [first, last] = [rings[0]?.[0], rings[0]?.at(-1)];
    if (!first || first[0] !== last[0] || first[1] !== last[1]) throw new Error(`${url}: ${properties.Beteckning} is no closed area`);
    const polygon = rings.map(ring => ring.map(([easting, northing]) => gridToLngLat(easting, northing, GRIDS['EPSG:3006'])));
    console.log(`${city.id} ${kind}: ${properties.Beteckning}, ${(planeArea(toPlane(polygon[0])) / 1e6).toFixed(2)} km²`);
    return polygonZones(id, kind, properties.Beteckning, [polygon]);
  });
}

/** A zone's points: its ring, or its lines, as Nagoya's pavements are. */
const pointsOf = zone => zone.ring ?? zone.lines.flat();

// A city whose map stops answering keeps the zones last drawn from it, as its file and its bounds
// here are only written once all its layers are read: a city's or a platform's map may go without
// notice, and the run goes on to the others.
for (const city of catalog.cities) {
  if (only.length && !only.includes(city.id)) continue;
  try {
    await updateCity(city);
  } catch (error) {
    console.log(`${city.id}: ${error.message}; its last zones are kept`);
  }
}

async function updateCity(city) {
  const zones = [];
  for (const layer of city.layers) {
    if (!KINDS.has(layer.kind)) throw new Error(`${city.id}: unknown kind ${layer.kind}`);
    const pathname = layer.boundary || layer.ring ? null : new URL(layer.url).pathname;
    const found = layer.boundary ? await boundaryZones(city, layer) : layer.ring ? ringZones(city, layer)
      : ['geojson', 'kml', 'kmz', 'zip', 'nivel', 'populus', 'geopdf', 'artifica', 'drupal', 'geomaps'].includes(layer.format) ? await geojsonZones(city, layer, zones)
        : pathname.startsWith('/zones_attributes/') ? await limeZones(city, layer)
          : pathname.endsWith('.zip') ? await jarticZones(city, layer)
            : pathname.endsWith('/AF06_View.aspx') ? await stfsZones(city, layer)
              : layer.envelope ? await arcgisZones(city, layer, zones)
                : /\/(Feature|Map)Server$/.test(pathname) ? await featureServerZones(city, layer)
                  : pathname.endsWith('/wms') ? await wmsZones(city, layer) : await fiwareZones(city, layer);
    console.log(`${city.id} ${layer.kind}: ${found.length} zones, ${found.reduce((sum, zone) => sum + pointsOf(zone).length, 0)} points`);
    zones.push(...found);
  }
  const ids = new Set(zones.map(zone => zone.id));
  if (ids.size !== zones.length) throw new Error(`${city.id}: two zones share an id`);
  if (!zones.length) throw new Error(`${city.id}: no zones read`);
  zones.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id, 'en', { numeric: true }));
  const points = zones.flatMap(pointsOf);
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
