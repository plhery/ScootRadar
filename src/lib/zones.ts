import { boundsIntersect, lngSpan } from './geo';
import { isElectricScooter, type GbfsVehicleType } from './scooterTypes';
import type { MapBounds } from './types';

/**
 * The zones the operators publish (GBFS geofencing_zones), drawn on the map
 * from this zoom in, when the visitor turns them on: further out they would
 * cover the scooters, and weigh too much.
 */
export const ZONES_MIN_ZOOM = 14;
/** The widest view, in degrees each way, that one request may ask zones for. */
export const ZONES_MAX_SPAN_DEGREES = 1;
/** The points one answer holds at most: past them, slow zones are left out first, then no-parking zones. */
export const ZONES_MAX_POINTS = 60_000;
/** Corners closer than this to the line between their neighbours are dropped. */
const SIMPLIFY_TOLERANCE_M = 2;
/**
 * At most this fast is a slow zone: the UK's 10 mph zones (16 or 16.1 km/h) are. 19 km/h, which Dott sets over whole
 * cities in Germany and the UAE, and 20 km/h, the usual limit in Europe, are not.
 */
const SLOW_ZONE_MAX_KPH = 18;

/** What a zone forbids a scooter: riding in it at all, ending a ride in it, or going fast. */
export type ZoneKind = 'noRide' | 'noParking' | 'slow';
const KIND_ORDER: Record<ZoneKind, number> = { noRide: 0, noParking: 1, slow: 2 };

export interface MapZone {
  id: string;
  provider: string;
  kind: ZoneKind;
  /** A slow zone's limit. */
  maxSpeedKph?: number;
  /** Polygons, each its outer ring and then its holes, each ring of [lat, lng] points. */
  polygons: [number, number][][][];
}

/** A zone as the cache keeps it, with what answering for an area needs. */
export interface StoredZone extends MapZone {
  bounds: MapBounds;
  points: number;
}

export interface ZoneResponse {
  zones: MapZone[];
  meta: {
    generatedAt: string;
    /** Some feeds' zones are still on their way: ask again in a few seconds. */
    pending: boolean;
    /** Zones were left out to keep the answer small. */
    truncated: boolean;
  };
}

interface ZoneRule {
  vehicle_type_ids?: unknown;
  vehicle_type_id?: unknown;
  /** GBFS 2: a ride may start and end here. */
  ride_allowed?: boolean;
  /** GBFS 3 asks the start and the end apart. */
  ride_start_allowed?: boolean;
  ride_end_allowed?: boolean;
  ride_through_allowed?: boolean;
  maximum_speed_kph?: number;
}
interface ZoneFeature {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: { start?: number | string; end?: number | string; rules?: ZoneRule[] };
}
export interface ZonesFeed { data?: { geofencing_zones?: { features?: ZoneFeature[] } } }
export interface ZoneTypesFeed { data?: { vehicle_types?: GbfsVehicleType[] } }

export function validateZones(value: unknown): void {
  const features = (value as ZonesFeed | null)?.data?.geofencing_zones?.features;
  if (!Array.isArray(features)) throw new Error('Invalid geofencing zones');
}

function timestamp(value: number | string | undefined, fallback: number) {
  return value === undefined ? fallback : typeof value === 'number' ? value * 1000 : Date.parse(value);
}

/** What the first rule for a scooter says, as GBFS orders them; null for a zone that only says where riding is allowed. */
function zoneKind(rule: ZoneRule): Pick<MapZone, 'kind' | 'maxSpeedKph'> | null {
  const speed = rule.maximum_speed_kph;
  if (rule.ride_through_allowed === false || speed === 0) return { kind: 'noRide' };
  if (rule.ride_allowed === false || rule.ride_end_allowed === false) return { kind: 'noParking' };
  if (typeof speed === 'number' && Number.isFinite(speed) && speed > 0 && speed <= SLOW_ZONE_MAX_KPH) {
    return { kind: 'slow', maxSpeedKph: speed };
  }
  return null;
}

function polygonsOf(geometry: ZoneFeature['geometry']): unknown[] {
  if (!Array.isArray(geometry?.coordinates)) return [];
  return geometry.type === 'Polygon' ? [geometry.coordinates]
    : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];
}

const round = (value: number) => Math.round(value * 1e5) / 1e5;

/**
 * A ring of GeoJSON [lng, lat] points as [lat, lng], without the corners that
 * change nothing a visitor can see (Douglas–Peucker, measured in metres).
 */
export function simplifyRing(ring: unknown, toleranceM = SIMPLIFY_TOLERANCE_M): [number, number][] | null {
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const points: [number, number][] = [];
  for (const point of ring) {
    if (!Array.isArray(point) || point.length < 2) return null;
    const [lng, lat] = point;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    points.push([lat, lng]);
  }
  const metresPerLng = 111_320 * Math.cos(points[0][0] * Math.PI / 180);
  const x = (point: [number, number]) => point[1] * metresPerLng;
  const y = (point: [number, number]) => point[0] * 110_540;
  const kept = new Uint8Array(points.length);
  kept[0] = kept[points.length - 1] = 1;
  const spans: [number, number][] = [[0, points.length - 1]];
  while (spans.length) {
    const [first, last] = spans.pop()!;
    const dx = x(points[last]) - x(points[first]);
    const dy = y(points[last]) - y(points[first]);
    const length = Math.hypot(dx, dy);
    let farthest = -1;
    let distance = toleranceM;
    for (let index = first + 1; index < last; index++) {
      const px = x(points[index]) - x(points[first]);
      const py = y(points[index]) - y(points[first]);
      // From the line between the two ends, or from the first end when they meet, as a closed ring's do.
      const away = length > 0 ? Math.abs(dx * py - dy * px) / length : Math.hypot(px, py);
      if (away > distance) { distance = away; farthest = index; }
    }
    if (farthest < 0) continue;
    kept[farthest] = 1;
    spans.push([first, farthest], [farthest, last]);
  }
  const simplified = points.filter((_, index) => kept[index]).map(([lat, lng]): [number, number] => [round(lat), round(lng)]);
  // A ring needs three corners and its closing point.
  return simplified.length >= 4 ? simplified : null;
}

/**
 * The zones of a feed that a scooter must mind now, drawn from its first rule
 * that names a scooter type (or no type), as GBFS reads them. A zone that
 * starts or ends later is left out until it applies (nextZoneChange).
 */
export function normalizeZones(feedId: string, provider: string, types: ZoneTypesFeed, feed: ZonesFeed,
  now = Date.now()): StoredZone[] {
  const scooterTypes = new Set((types.data?.vehicle_types ?? []).filter(type => isElectricScooter(type, provider))
    .map(type => type.vehicle_type_id));
  if (!scooterTypes.size) return [];
  return (feed.data?.geofencing_zones?.features ?? []).flatMap((zone, index): StoredZone[] => {
    if (timestamp(zone.properties?.start, -Infinity) > now || timestamp(zone.properties?.end, Infinity) <= now) return [];
    const rule = zone.properties?.rules?.find(candidate => {
      const ids = candidate?.vehicle_type_ids ?? candidate?.vehicle_type_id;
      return !Array.isArray(ids) || ids.some(id => scooterTypes.has(id));
    });
    const kind = rule && zoneKind(rule);
    if (!kind) return [];
    const polygons = polygonsOf(zone.geometry).flatMap(polygon => {
      if (!Array.isArray(polygon)) return [];
      const [outer, ...holes] = polygon.map(ring => simplifyRing(ring));
      return outer ? [[outer, ...holes.filter((hole): hole is [number, number][] => hole !== null)]] : [];
    });
    if (!polygons.length) return [];
    return [storedZone({ id: `${feedId}:${index}`, provider, ...kind, polygons })];
  });
}

/** A zone as the cache keeps it: with the bounds of its outer rings, and its points. */
export function storedZone(zone: MapZone): StoredZone {
  const bounds = { south: Infinity, west: Infinity, north: -Infinity, east: -Infinity };
  let points = 0;
  for (const [lat, lng] of zone.polygons.flatMap(polygon => polygon[0])) {
    bounds.south = Math.min(bounds.south, lat); bounds.north = Math.max(bounds.north, lat);
    bounds.west = Math.min(bounds.west, lng); bounds.east = Math.max(bounds.east, lng);
  }
  for (const ring of zone.polygons.flat()) points += ring.length;
  return { ...zone, bounds, points };
}

/** The next time a zone starts or ends, which changes what normalizeZones returns. */
export function nextZoneChange(feed: ZonesFeed, now = Date.now()): number {
  return (feed.data?.geofencing_zones?.features ?? []).flatMap(zone => [zone.properties?.start, zone.properties?.end])
    .map(time => timestamp(time, Infinity)).reduce((next, time) => time > now && time < next ? time : next, Infinity);
}

/** The zones that reach into the area, the ones that forbid most first, within ZONES_MAX_POINTS. */
export function zonesInBounds(zones: Iterable<StoredZone>, bounds: MapBounds): { zones: MapZone[]; truncated: boolean } {
  const found = [...zones].filter(zone => boundsIntersect(zone.bounds, bounds))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
  const kept: MapZone[] = [];
  let points = 0;
  let truncated = false;
  for (const zone of found) {
    if (points + zone.points > ZONES_MAX_POINTS) { truncated = true; continue; }
    points += zone.points;
    kept.push({ id: zone.id, provider: zone.provider, kind: zone.kind, polygons: zone.polygons,
      ...(zone.maxSpeedKph === undefined ? {} : { maxSpeedKph: zone.maxSpeedKph }) });
  }
  return { zones: kept, truncated };
}

/** Why zones cannot be asked for this view, or null when they can. */
export function zoneQueryError(zoom: number | null, bounds: MapBounds): string | null {
  if (zoom === null || zoom < ZONES_MIN_ZOOM) return 'Zones are shown from zoom 14';
  return bounds.north - bounds.south > ZONES_MAX_SPAN_DEGREES || lngSpan(bounds) > ZONES_MAX_SPAN_DEGREES
    ? 'Zones are asked for a smaller area' : null;
}

export function zoneResponse(zones: Iterable<StoredZone>, bounds: MapBounds, pending: boolean, now = Date.now()): ZoneResponse {
  const found = zonesInBounds(zones, bounds);
  return { zones: found.zones, meta: { generatedAt: new Date(now).toISOString(), pending, truncated: found.truncated } };
}
