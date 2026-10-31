import index from '../../data/city-zones.json';
import { boundsIntersect } from './geo';
import type { RuleKind, RuleZone } from './ruleZones';
import type { MapBounds } from './types';
import { ZONES_MIN_ZOOM } from './zones';

// The zones cities set for shared e-scooters, from data/city-zones.json: each city's are a
// file of their own, Bergen's about 150 KB, which the map page loads only once a view from
// zoom 14 reaches the city, and keeps. Nagoya's are the pavements a scooter may ride on, lines
// rather than rings; Helsingborg's the centre where scooters park only in racks or marked places.

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

/** A city's file of zones, data/city-zones/<id>.json: each zone one ring, or lines, as a pavement is. */
export interface ZoneFile {
  zones: ({ id: string; kind: string; name: string }
    & ({ ring: number[][]; lines?: undefined } | { lines: number[][][]; ring?: undefined }))[];
}

/**
 * The cities whose zones the website draws: all but any held back for an iPhone release that
 * downloads them (`"website": false`, docs/city-zone-downloads.md), none since 30 October 2026.
 */
export const ZONE_CITIES: ZoneCity[] = index.cities.filter(city => !('website' in city && city.website === false));

/**
 * Each city's zones, loaded when asked for. Named one by one, so that the bundler makes each
 * file a piece of its own and leaves them all out of the map page.
 */
export const CITY_ZONE_FILES: Record<string, () => Promise<{ default: ZoneFile }>> = {
  aachen: () => import('../../data/city-zones/aachen.json'),
  alexandria: () => import('../../data/city-zones/alexandria.json'),
  antwerpen: () => import('../../data/city-zones/antwerpen.json'),
  arlington: () => import('../../data/city-zones/arlington.json'),
  arlingtoncemetery: () => import('../../data/city-zones/arlingtoncemetery.json'),
  atlanta: () => import('../../data/city-zones/atlanta.json'),
  baltimore: () => import('../../data/city-zones/baltimore.json'),
  basel: () => import('../../data/city-zones/basel.json'),
  bergen: () => import('../../data/city-zones/bergen.json'),
  berlin: () => import('../../data/city-zones/berlin.json'),
  boise: () => import('../../data/city-zones/boise.json'),
  bordeaux: () => import('../../data/city-zones/bordeaux.json'),
  boulder: () => import('../../data/city-zones/boulder.json'),
  braunschweig: () => import('../../data/city-zones/braunschweig.json'),
  cityoflondon: () => import('../../data/city-zones/cityoflondon.json'),
  cleveland: () => import('../../data/city-zones/cleveland.json'),
  columbus: () => import('../../data/city-zones/columbus.json'),
  hamburg: () => import('../../data/city-zones/hamburg.json'),
  helsingborg: () => import('../../data/city-zones/helsingborg.json'),
  helsinki: () => import('../../data/city-zones/helsinki.json'),
  jarvenpaa: () => import('../../data/city-zones/jarvenpaa.json'),
  lambeth: () => import('../../data/city-zones/lambeth.json'),
  minneapolis: () => import('../../data/city-zones/minneapolis.json'),
  munchen: () => import('../../data/city-zones/munchen.json'),
  munster: () => import('../../data/city-zones/munster.json'),
  nagoya: () => import('../../data/city-zones/nagoya.json'),
  namur: () => import('../../data/city-zones/namur.json'),
  newyork: () => import('../../data/city-zones/newyork.json'),
  norfolk: () => import('../../data/city-zones/norfolk.json'),
  norrkoping: () => import('../../data/city-zones/norrkoping.json'),
  omaha: () => import('../../data/city-zones/omaha.json'),
  oslo: () => import('../../data/city-zones/oslo.json'),
  ottawa: () => import('../../data/city-zones/ottawa.json'),
  oygarden: () => import('../../data/city-zones/oygarden.json'),
  porto: () => import('../../data/city-zones/porto.json'),
  poznan: () => import('../../data/city-zones/poznan.json'),
  reykjavik: () => import('../../data/city-zones/reykjavik.json'),
  riga: () => import('../../data/city-zones/riga.json'),
  rostock: () => import('../../data/city-zones/rostock.json'),
  sacramento: () => import('../../data/city-zones/sacramento.json'),
  sanfrancisco: () => import('../../data/city-zones/sanfrancisco.json'),
  santamonica: () => import('../../data/city-zones/santamonica.json'),
  seattle: () => import('../../data/city-zones/seattle.json'),
  stalbert: () => import('../../data/city-zones/stalbert.json'),
  stockholm: () => import('../../data/city-zones/stockholm.json'),
  taupo: () => import('../../data/city-zones/taupo.json'),
  trondheim: () => import('../../data/city-zones/trondheim.json'),
  turku: () => import('../../data/city-zones/turku.json'),
  vaasa: () => import('../../data/city-zones/vaasa.json'),
  vancouver: () => import('../../data/city-zones/vancouver.json'),
  vantaa: () => import('../../data/city-zones/vantaa.json'),
  vasteras: () => import('../../data/city-zones/vasteras.json'),
  washington: () => import('../../data/city-zones/washington.json'),
  wien: () => import('../../data/city-zones/wien.json'),
  zurich: () => import('../../data/city-zones/zurich.json'),
};

/** The city's zones as rule zones: in force always, set by the city, linked to where it says so. */
export function cityRuleZones(city: ZoneCity, file: ZoneFile): RuleZone[] {
  return file.zones.map(zone => {
    const common = {
      id: zone.id, place: zone.name, authority: city.authority, rule: zone.kind as RuleKind,
      timeZone: city.timeZone, source: city.source,
    };
    return zone.lines ? { ...common, lines: zone.lines as [number, number][][] } : { ...common, ring: zone.ring as [number, number][] };
  });
}

/** The cities whose zones the view reaches, from zoom 14 in. */
export function zoneCitiesInView(view: { bounds: MapBounds; zoom: number } | null): ZoneCity[] {
  if (!view || view.zoom < ZONES_MIN_ZOOM) return [];
  return ZONE_CITIES.filter(city => boundsIntersect(view.bounds, city.bounds));
}

const NONE: RuleZone[] = [];
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
