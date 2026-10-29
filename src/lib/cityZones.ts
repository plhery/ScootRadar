import index from '../../data/city-zones.json';
import { boundsIntersect } from './geo';
import type { RuleArea, RuleKind } from './ruleZones';
import type { MapBounds } from './types';
import { ZONES_MIN_ZOOM } from './zones';

// The zones cities set for shared e-scooters, from data/city-zones.json: each city's are a
// file of their own, Bergen's about 150 KB, which the map page loads only once a view from
// zoom 14 reaches the city, and keeps.

/** A city of data/city-zones.json. */
export interface ZoneCity {
  id: string;
  place: string;
  /** Who sets the zones, as the legend names them: "Bergen kommune". */
  authority: string;
  timeZone: string;
  source: { title: string; url: string };
  /** Around all its zones. */
  bounds: MapBounds;
}

/** A city's file of zones, data/city-zones/<id>.json. */
export interface ZoneFile {
  zones: { id: string; kind: string; name: string; ring: number[][] }[];
}

export const ZONE_CITIES: ZoneCity[] = index.cities;

/**
 * Each city's zones, loaded when asked for. Named one by one, so that the bundler makes each
 * file a piece of its own and leaves them all out of the map page.
 */
export const CITY_ZONE_FILES: Record<string, () => Promise<{ default: ZoneFile }>> = {
  arlingtoncemetery: () => import('../../data/city-zones/arlingtoncemetery.json'),
  bergen: () => import('../../data/city-zones/bergen.json'),
  boise: () => import('../../data/city-zones/boise.json'),
  porto: () => import('../../data/city-zones/porto.json'),
  vasteras: () => import('../../data/city-zones/vasteras.json'),
};

/** The city's zones as rule zones: in force always, set by the city, linked to where it says so. */
export function cityRuleZones(city: ZoneCity, file: ZoneFile): RuleArea[] {
  return file.zones.map(zone => ({
    id: zone.id,
    place: zone.name,
    authority: city.authority,
    rule: zone.kind as RuleKind,
    timeZone: city.timeZone,
    source: city.source,
    ring: zone.ring as [number, number][],
  }));
}

/** The cities whose zones the view reaches, from zoom 14 in. */
export function zoneCitiesInView(view: { bounds: MapBounds; zoom: number } | null): ZoneCity[] {
  if (!view || view.zoom < ZONES_MIN_ZOOM) return [];
  return ZONE_CITIES.filter(city => boundsIntersect(view.bounds, city.bounds));
}

const NONE: RuleArea[] = [];
/** Every city's zones loaded so far, one list, a new one each time a city's arrive. */
let loaded = NONE;
/** The cities loaded or on their way. */
const asked = new Set<string>();
const listeners = new Set<() => void>();

export const cityZones = {
  get: () => loaded,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

/** Loads the city's zones, once. Those that fail to load are not drawn, and are asked for again the next time. */
export async function loadCityZones(city: ZoneCity): Promise<void> {
  if (asked.has(city.id)) return;
  asked.add(city.id);
  try {
    const file = await CITY_ZONE_FILES[city.id]();
    loaded = [...loaded, ...cityRuleZones(city, file.default)];
  } catch {
    asked.delete(city.id);
    return;
  }
  for (const listener of listeners) listener();
}
