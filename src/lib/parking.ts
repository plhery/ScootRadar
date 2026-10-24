import { serviceAreas, type RegionalScooterSystem } from './regionalScooterSystems';
import type { MapBounds, ParkingLocation } from './types';
import { boundsContainPoint } from './geo';
import { isElectricScooter, type GbfsVehicleType } from './scooterTypes';

export const PARKING_MIN_ZOOM = 16;
export { PARKING_MAX_AGE_MS } from './dataFreshness';
export interface ParkingSnapshot { locations: ParkingLocation[]; observedAt: number; stale: boolean }
interface Station {
  station_id: string; name?: unknown; lat?: number; lon?: number;
  is_virtual_station?: boolean; station_area?: unknown; parking_type?: string;
  vehicle_capacity?: Record<string, number>; vehicle_type_capacity?: Record<string, number>; vehicle_type_ids?: string[];
  vehicle_types_capacity?: Capacity[]; vehicle_docks_capacity?: Capacity[];
}
interface Capacity { vehicle_type_ids?: string[]; count?: number }
interface Rule {
  vehicle_type_ids?: string[]; vehicle_type_id?: string[]; station_parking?: boolean;
}
interface Geometry { type: string; coordinates: number[][][] | number[][][][] }
interface Zone { geometry: Geometry; properties?: { start?: number | string; end?: number | string; rules?: Rule[] } }
export interface ParkingTypesFeed { data?: { vehicle_types?: GbfsVehicleType[] } }
export interface ParkingStationsFeed { data?: { stations?: Station[] } }
export interface ParkingStatusFeed { last_updated?: number | string; data?: { stations?: Array<{station_id: string; is_installed?: boolean | number; is_returning?: boolean | number}> } }
export interface ParkingZonesFeed { data?: { geofencing_zones?: { features?: Zone[] }; global_rules?: Rule[] } }

function ringContains(ring: number[][], lng: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x, y] = ring[i], [px, py] = ring[j];
    if ((y > lat) !== (py > lat) && lng < (px - x) * (lat - y) / (py - y) + x) inside = !inside;
  }
  return inside;
}
function polygons(geometry: Geometry): number[][][][] {
  if (!Array.isArray(geometry?.coordinates)) return [];
  return geometry?.type === 'Polygon' ? [geometry.coordinates as number[][][]]
    : geometry?.type === 'MultiPolygon' ? geometry.coordinates as number[][][][] : [];
}
function polygonBounds(parts: number[][][][]): MapBounds | undefined {
  const points = parts.flat(2);
  if (!points.length || points.some(point => point.length < 2 || !point.every(Number.isFinite))) return undefined;
  const bounds = { west: Infinity, east: -Infinity, south: Infinity, north: -Infinity };
  for (const [x, y] of points) { bounds.west = Math.min(bounds.west, x); bounds.east = Math.max(bounds.east, x);
    bounds.south = Math.min(bounds.south, y); bounds.north = Math.max(bounds.north, y); }
  return bounds;
}
// Within about a metre: the same shape can come at another precision.
function boundsWithin(inner: MapBounds, outer: MapBounds, margin = 0.00001): boolean {
  return inner.west >= outer.west - margin && inner.east <= outer.east + margin &&
    inner.south >= outer.south - margin && inner.north <= outer.north + margin;
}
function timestamp(value: number | string | undefined, fallback: number) {
  return value === undefined ? fallback : typeof value === 'number' ? value * 1000 : Date.parse(value);
}
// Any published parking or dock capacity, keyed by type (GBFS 2) or listed per group of types (GBFS 3),
// limits a station to the types it has room for.
function hasRoomFor(capacity: Record<string, number> | Capacity[] | undefined, type: string): boolean {
  if (!capacity) return true;
  return Array.isArray(capacity) ? capacity.some(group => group?.vehicle_type_ids?.includes(type) && (group.count ?? 0) > 0)
    : (capacity[type] ?? 0) > 0;
}
function stationName(name: unknown, fallback: string, language: string): string {
  if (typeof name === 'string' && name.trim()) return name.trim().replaceAll('_', ' ').slice(0, 200);
  if (Array.isArray(name)) {
    const localized = name.find(x => x?.language === language) ?? name.find(x => typeof x?.text === 'string');
    if (localized) return stationName(localized.text, fallback, language);
  }
  return fallback;
}

/**
 * Only actual scooter parking infrastructure, never synthetic whole-city stations: stations the
 * feed marks as parking, or every station of a system whose catalog says rides end at them.
 */
export function normalizeParkingLocations(system: RegionalScooterSystem, types: ParkingTypesFeed,
  information: ParkingStationsFeed, geofencing: ParkingZonesFeed, now = Date.now()): ParkingLocation[] {
  const scooterTypes = (types.data?.vehicle_types ?? []).filter(type => isElectricScooter(type, system.provider))
    .map(type => type.vehicle_type_id);
  if (!scooterTypes.length) return [];
  const zones = (geofencing.data?.geofencing_zones?.features ?? []).flatMap(zone => {
    if (timestamp(zone.properties?.start, -Infinity) > now || timestamp(zone.properties?.end, Infinity) <= now) return [];
    const parts = polygons(zone.geometry);
    const bounds = polygonBounds(parts);
    return bounds ? [{ zone, parts, bounds }] : [];
  });
  const ruleFor = (rules: Rule[] | undefined, type: string) => rules?.find(rule => {
    const ids = rule.vehicle_type_ids ?? rule.vehicle_type_id;
    return !ids || ids.includes(type);
  });
  const unique = new Map<string, ParkingLocation>();
  for (const station of information.data?.stations ?? []) {
    if (typeof station.station_id !== 'string' || !station.station_id ||
      typeof station.lat !== 'number' || typeof station.lon !== 'number' ||
      !Number.isFinite(station.lat) || !Number.isFinite(station.lon) ||
      !serviceAreas(system).some(area => boundsContainPoint(area.bounds, station.lat!, station.lon!)) ||
      !(system.stationParking || station.is_virtual_station === true || station.station_area || station.parking_type)) continue;
    const allowedTypes = scooterTypes.filter(type =>
      (!station.vehicle_type_ids || station.vehicle_type_ids.includes(type)) &&
      [station.vehicle_capacity, station.vehicle_type_capacity, station.vehicle_types_capacity, station.vehicle_docks_capacity]
        .every(capacity => hasRoomFor(capacity, type)));
    if (!allowedTypes.length) continue;
    // A zone no larger than the station's own area is the station itself: Voi in NRW gives each
    // bay one, with station_parking true. Whether the bay is the only place to stop is the rule of
    // the street around it (25 Oct 2026: Duisburg's 39 bays were all required, in a free-floating area).
    const area = station.station_area ? polygonBounds(polygons(station.station_area as Geometry)) : undefined;
    // GBFS rules are ordered: the first matching polygon/rule wins, including holes.
    const mandatory = system.stationParking === true || allowedTypes.every(type => {
      for (const entry of zones) {
        const rule = ruleFor(entry.zone.properties?.rules, type);
        if (!rule || !boundsContainPoint(entry.bounds, station.lat!, station.lon!) ||
          (area && boundsWithin(entry.bounds, area))) continue;
        if (entry.parts.some(part => part[0] && ringContains(part[0], station.lon!, station.lat!) &&
          !part.slice(1).some(hole => ringContains(hole, station.lon!, station.lat!)))) return rule.station_parking === true;
      }
      return ruleFor(geofencing.data?.global_rules, type)?.station_parking === true;
    });
    const location = { id: `${system.id}:${station.station_id}`, provider: system.provider,
      name: stationName(station.name, system.city, system.country.toLowerCase()), lat: station.lat, lng: station.lon, mandatory };
    unique.set(location.id, location);
  }
  return [...unique.values()];
}

/** The next time a geofencing zone starts or ends, which changes what normalizeParkingLocations returns. */
export function nextParkingRuleChange(geofencing: ParkingZonesFeed, now = Date.now()): number {
  return (geofencing.data?.geofencing_zones?.features ?? []).flatMap(zone => [zone.properties?.start, zone.properties?.end])
    .map(time => timestamp(time, Infinity)).reduce((next, time) => time > now && time < next ? time : next, Infinity);
}

export function filterReturningParking(locations: ParkingLocation[], status: ParkingStatusFeed): ParkingLocation[] {
  // These are virtual bays. Pony publishes is_installed=false for every bay,
  // while explicitly allowing returns; use the return permission itself.
  const closed = new Set((status.data?.stations ?? [])
    .filter(station => station.is_returning === false || station.is_returning === 0)
    .map(station => station.station_id));
  return locations.filter(location => !closed.has(location.id.slice(location.id.indexOf(':') + 1)));
}
