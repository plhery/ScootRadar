import { boundsCenter, boundsIntersect, haversineM } from './geo';
import type { MapBounds } from './types';
import { simplifyRing, storedZone, type StoredZone, type ZoneKind } from './zones';

// GCOO publishes no GBFS feed, but its app's area file for America, region.gbike.io's
// all_polygons.json.gz, holds its zones there with its service areas: no-ride and slow zones
// (geofence_areas) and no-parking areas, each with its outline and its holes. One file serves
// every American town, so it is read once an hour for all of them, and each zone goes to the
// town it reaches into whose centre is nearest: Arlington's and Alexandria's boxes overlap,
// and a zone drawn for both would be drawn twice. Zones that reach no town's box, as those of
// Venice and Memphis, where no scooter of the map's stands, are left out.

export const GCOO_US_AREAS_URL = 'https://region.gbike.io/us/all_polygons.json.gz';
// 286 KB gzipped, 1.2 MB of JSON, on 29 October 2026.
const MAX_FILE_BYTES = 4_000_000;
const MAX_JSON_BYTES = 16_000_000;
const FRESH_MS = 3600_000;
const TIMEOUT_MS = 20_000;
const KINDS: Record<string, ZoneKind> = { no_ride_zone: 'noRide', slow_zone: 'slow' };

/** A town of GCOO's in the area file: its feed, and where its scooters stand. */
export interface GcooZoneTown {
  feedId: string;
  center: [number, number];
  bounds: MapBounds;
}

/** GCOO's area file, and the towns its zones are shared out among. */
export interface GcooZoneSource {
  gcooAreasUrl: string;
  towns: GcooZoneTown[];
}

interface GcooArea {
  id?: unknown;
  zone_type?: unknown;
  paths?: { outer_coords?: unknown; inner_coords?: unknown };
}

const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

/** A ring of [lng, lat] points, closed as GeoJSON's are, simplified as a feed's. */
function ring(points: unknown) {
  if (!Array.isArray(points) || !points.length) return null;
  const first: unknown = points[0];
  const last: unknown = points[points.length - 1];
  const closed = Array.isArray(first) && Array.isArray(last) && first[0] === last[0] && first[1] === last[1];
  return simplifyRing(closed ? points : [...points, first]);
}

/** The town a zone of these bounds reaches into whose centre is nearest, if any. */
function townOf(towns: readonly GcooZoneTown[], bounds: MapBounds) {
  const [lat, lng] = boundsCenter(bounds);
  let nearest: GcooZoneTown | undefined;
  let distance = Infinity;
  for (const town of towns) {
    if (!boundsIntersect(town.bounds, bounds)) continue;
    const away = haversineM(lat, lng, town.center[0], town.center[1]);
    if (away < distance) { distance = away; nearest = town; }
  }
  return nearest;
}

/** Each town's zones in GCOO's area file, by its feed's id. */
export function gcooTownZones(payload: unknown, towns: readonly GcooZoneTown[], provider: string): Map<string, StoredZone[]> {
  const file = object(payload);
  if (!Array.isArray(file?.geofence_areas) || !Array.isArray(file.no_parking_areas)) throw new Error('Invalid GCOO area file');
  const areas = [
    ...(file.geofence_areas as GcooArea[]).map(area => ({ area, list: 'zone', kind: KINDS[String(object(area)?.zone_type)] })),
    ...(file.no_parking_areas as GcooArea[]).map(area => ({ area, list: 'no-parking', kind: 'noParking' as const })),
  ];
  const zones = new Map(towns.map(town => [town.feedId, [] as StoredZone[]]));
  for (const { area, list, kind } of areas) {
    if (!kind || !object(area) || !Number.isSafeInteger(area.id)) continue;
    const outer = ring(area.paths?.outer_coords);
    if (!outer) continue;
    const inner = Array.isArray(area.paths?.inner_coords) ? area.paths.inner_coords : [];
    const holes = inner.map(ring).filter((hole): hole is [number, number][] => hole !== null);
    const zone = storedZone({ id: `${list}-${area.id}`, provider, kind, polygons: [[outer, ...holes]] });
    const town = townOf(towns, zone.bounds);
    if (town) zones.get(town.feedId)!.push({ ...zone, id: `${town.feedId}:${zone.id}` });
  }
  return zones;
}

async function readBounded(stream: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<Uint8Array> {
  const reader = stream?.getReader();
  if (!reader) throw new Error('GCOO returned an empty area file');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('GCOO\'s area file exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

/** The file as JSON: gzipped as a file, not as the response's encoding, unless a fetch already undid it. */
async function readAreaFile(url: string): Promise<unknown> {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'scootradar/2.0 (scootradar.com)' },
    redirect: 'error', signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`GCOO's area file returned HTTP ${response.status}`);
  }
  let bytes = await readBounded(response.body, MAX_FILE_BYTES);
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    bytes = await readBounded(new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip')), MAX_JSON_BYTES);
  }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new Error('GCOO\'s area file is not JSON'); }
}

const files = new Map<string, { until: number; zones: Promise<Map<string, StoredZone[]>> }>();

/** A town's zones from GCOO's area file, read once an hour for all its towns. */
export async function fetchGcooZones(feedId: string, provider: string, source: GcooZoneSource): Promise<StoredZone[]> {
  const now = Date.now();
  let file = files.get(source.gcooAreasUrl);
  if (!file || now >= file.until) {
    const read = { until: now + FRESH_MS,
      zones: readAreaFile(source.gcooAreasUrl).then(payload => gcooTownZones(payload, source.towns, provider)) };
    files.set(source.gcooAreasUrl, read);
    // A failed read is not kept: the zone store asks again a minute later.
    read.zones.catch(() => { if (files.get(source.gcooAreasUrl) === read) files.delete(source.gcooAreasUrl); });
    file = read;
  }
  return (await file.zones).get(feedId) ?? [];
}
