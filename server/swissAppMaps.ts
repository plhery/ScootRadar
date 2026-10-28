import type { ProviderKey } from '../src/generated/providers';
import { boundsCenter, haversineM } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';
import { collectBoltRegion } from './boltApp';
import { collectDottRegion } from './dottApp';
import { reportError } from './errorReporting';
import { nearestFirst, SweepProgress } from './sweeps';
import { collectVoiRegion } from './voiApp';

/**
 * Bolt's, Voi's and Dott's Swiss scooters stand where their rider maps put them now, priced and
 * linked from sharedmobility.ch's national feeds. The national platform publishes Bolt and Dott about
 * every six minutes and Voi every eight, so a map of Zürich could be seven minutes old; the rider
 * maps answer with each scooter's last report. Their positions are the national feeds' where a scooter
 * stands still: on 28 October 2026, 933 of Bolt's 955 Zürich scooters were within 5 m of one there,
 * and 731 of Dott's 756 within 15 m.
 *
 * The national feeds keep their ids, towns, zones and alerts. Each collection reads both: a scooter
 * of the rider map takes the price, range and rental links of the national one standing on it, and
 * its battery when the rider map has none (Dott's). One the national feed has yet to see where it
 * stands takes the price of the nearest that it has. The national feed alone stands while a rider
 * map fails.
 */
interface SwissAppMap {
  provider: Extract<ProviderKey, 'bolt' | 'voi' | 'dott'>;
  /** Where the rider map is read from, whose scheduler slots the feed takes (feedScheduler.ts). */
  host: string;
  /** Read in turn, the nearest to where people look first; their scooters have the feed's ids. */
  areas: RegionalScooterSystem[];
}

const BOLT_MAP_URL = 'https://user.live.boltsvc.net/micromobility/search/getVehicles/v2';
const VOI_MAP_URL = 'https://api.voiapp.io/v2/rides/vehicles';
const DOTT_MAP_URL = 'https://rider.api.ridedott.com/ridedott.rider.v1.Vehicles/WatchAvailableVehicles';

const area = (id: string, provider: SwissAppMap['provider'], city: string, [south, west, north, east]: readonly number[],
  keys: Partial<RegionalScooterSystem>): RegionalScooterSystem => {
  const bounds = { south, west, north, east };
  return { id, country: 'CH', provider, city, center: boundsCenter(bounds), bounds,
    discoveryUrl: provider === 'bolt' ? BOLT_MAP_URL : provider === 'voi' ? VOI_MAP_URL : DOTT_MAP_URL, ...keys };
};
const bolt = (id: string, city: string, center: [number, number], bounds: readonly number[], categories: string[]): SwissAppMap =>
  ({ provider: 'bolt', host: new URL(BOLT_MAP_URL).hostname, areas: [{ ...area(id, 'bolt', city, bounds,
    { boltAppCity: city, boltAppCategories: categories }), center }] });
const dott = (id: string, city: string, bounds: readonly number[], region: string): SwissAppMap =>
  ({ provider: 'dott', host: new URL(DOTT_MAP_URL).hostname, areas: [area(id, 'dott', city, bounds, { dottAppRegion: region })] });
const voiZone = (city: string, bounds: readonly number[], zone: string) =>
  area('voiscooters.com', 'voi', city, bounds, { voiAppZone: zone });

/**
 * The national feeds read from rider maps, by the national system's id, with the scooters' extent on
 * 28 October 2026 and some margin. Bolt answers with a whole market from its centre, which its
 * categories tell apart (boltApp.ts); Dott streams the scooters within a box, which its region keeps
 * to the town's. Voi's national feed is its eight Swiss zones, of system_regions; Nyon's, 401, has
 * no scooters.
 */
const SWISS_APP_MAPS: ReadonlyMap<string, SwissAppMap> = new Map([
  // Zürich's market reaches Wädenswil and Richterswil; category 1166 holds its CHF 0.48 a minute scooters.
  ['bolt_zurich', bolt('bolt_zurich', 'Zürich', [47.3769, 8.5417], [47.14, 8.32, 47.51, 8.75], ['735', '1166', '1212'])],
  ['bolt_basel', bolt('bolt_basel', 'Basel', [47.5596, 7.5886], [47.47, 7.52, 47.62, 7.67], ['899'])],
  ['voiscooters.com', { provider: 'voi', host: new URL(VOI_MAP_URL).hostname, areas: [
    voiZone('Zürich', [47.30, 8.41, 47.49, 8.63], '194'),
    voiZone('Winterthur', [47.45, 8.65, 47.55, 8.81], '128'),
    voiZone('Basel', [47.48, 7.50, 47.62, 7.69], '206'),
    voiZone('Bern', [46.90, 7.32, 47.01, 7.55], '222'),
    voiZone('Biel/Bienne', [47.09, 7.19, 47.19, 7.33], '418'),
    voiZone('Frauenfeld', [47.51, 8.80, 47.60, 8.95], '201'),
    voiZone('Schaffhausen', [47.65, 8.55, 47.77, 8.70], '427'),
    voiZone('Illnau-Effretikon', [47.38, 8.65, 47.47, 8.76], '319'),
  ] }],
  ['dott_zurich', dott('dott_zurich', 'Zürich', [47.30, 8.45, 47.49, 8.65], 'zEBJyMoJdpzyuuk16Hd1')],
  ['dott_basel', dott('dott_basel', 'Basel', [47.50, 7.51, 47.61, 7.71], 'JB9dQMwum2vjEkSYVY1P')],
  // St. Gallen's region reaches Wil; Friedrichshafen's, across the lake, is Dott's in Germany.
  ['dott_st-gallen', dott('dott_st-gallen', 'St. Gallen', [47.30, 9.00, 47.52, 9.45], 'C2y1sl8DjcGL8Q2GVoOH')],
  ['dott_romanshorn', dott('dott_romanshorn', 'Romanshorn', [47.49, 9.24, 47.60, 9.40], 'rSubanYKx8YBSyfsmvu9')],
  ['dott_rorschach', dott('dott_rorschach', 'Rorschach', [47.36, 9.40, 47.52, 9.69], 'HwAiI92HUtiKjDUhhoce')],
]);

/** A scooter of the rider map is the national one standing within this of it, the nearest pairs first. */
export const MATCH_METRES = 15;
// Grid cells wider than MATCH_METRES at Swiss latitudes, so a match is in a cell's 3×3 block.
const CELL_DEGREES = 0.0003;
/** How long a collection waits for the national feed once the rider map has answered. */
const NATIONAL_GRACE_MS = 2_000;
/** How long a rider map fails before Sentry hears of it: the national feed stands meanwhile. */
const FAILURE_REPORT_MS = 10 * 60_000;

const cell = (lat: number, lng: number) => `${Math.floor(lat / CELL_DEGREES)}:${Math.floor(lng / CELL_DEGREES)}`;

/** The rider map's scooters, given the attributes of the national ones standing on them. */
export function mergeAppMap(app: readonly Vehicle[], national: readonly Vehicle[]): Vehicle[] {
  const grid = new Map<string, number[]>();
  national.forEach((vehicle, index) => {
    const key = cell(vehicle.lat, vehicle.lng);
    const indices = grid.get(key);
    if (indices) indices.push(index); else grid.set(key, [index]);
  });
  const pairs: { app: number; national: number; metres: number }[] = [];
  app.forEach((vehicle, index) => {
    const row = Math.floor(vehicle.lat / CELL_DEGREES), column = Math.floor(vehicle.lng / CELL_DEGREES);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      for (const other of grid.get(`${row + dr}:${column + dc}`) ?? []) {
        const metres = haversineM(vehicle.lat, vehicle.lng, national[other].lat, national[other].lng);
        if (metres <= MATCH_METRES) pairs.push({ app: index, national: other, metres });
      }
    }
  });
  pairs.sort((a, b) => a.metres - b.metres);
  const matchOf = new Map<number, Vehicle>();
  const taken = new Set<number>();
  for (const pair of pairs) {
    if (matchOf.has(pair.app) || taken.has(pair.national)) continue;
    matchOf.set(pair.app, national[pair.national]);
    taken.add(pair.national);
  }
  const priced = app.flatMap((vehicle, index) => {
    const pricing = matchOf.get(index)?.pricing;
    return pricing ? [{ lat: vehicle.lat, lng: vehicle.lng, pricing }] : [];
  });
  return app.map((vehicle, index) => {
    const match = matchOf.get(index);
    if (match) {
      return { ...vehicle, battery: vehicle.battery ?? match.battery, range_m: match.range_m, deep_link: match.deep_link,
        ...(match.rental_uris ? { rental_uris: match.rental_uris } : {}), ...(match.pricing ? { pricing: match.pricing } : {}) };
    }
    let nearest: (typeof priced)[number] | undefined, nearestMetres = Infinity;
    for (const other of priced) {
      const metres = haversineM(vehicle.lat, vehicle.lng, other.lat, other.lng);
      if (metres < nearestMetres) { nearest = other; nearestMetres = metres; }
    }
    return nearest ? { ...vehicle, pricing: nearest.pricing } : vehicle;
  });
}

export interface SwissAppMapState {
  /** The last scooters each national feed listed, whose attributes stand while it fails or is late. */
  national: Map<string, Vehicle[]>;
  /** Since when each rider map fails. */
  failingSince: Map<string, number>;
}
const state: SwissAppMapState = { national: new Map(), failingSince: new Map() };

/**
 * A collection of a national feed read from a rider map: the rider map's scooters, given the
 * attributes of the national feed's, or the national feed's alone should the rider map fail.
 */
export async function collectFromAppMap(id: string, national: () => Promise<SourceVehicles>, app: () => Promise<SourceVehicles>,
  { now = Date.now, current = state, graceMs = NATIONAL_GRACE_MS } = {}): Promise<SourceVehicles> {
  const official = national().then(result => {
    if (result.vehicles.length) current.national.set(id, result.vehicles);
    return result;
  });
  // Its failure is that of the collection only when the rider map fails too.
  official.catch(() => undefined);
  let own: SourceVehicles;
  try {
    own = await app();
  } catch (error) {
    const since = current.failingSince.get(id) ?? now();
    current.failingSince.set(id, since);
    console.warn(JSON.stringify({ event: 'swiss_app_map_failed', feed: id,
      error: (error instanceof Error ? error.message : String(error)).slice(0, 300) }));
    if (now() - since >= FAILURE_REPORT_MS) reportError(`swiss-app-map:${id}`, error);
    return official.catch(() => { throw error; });
  }
  current.failingSince.delete(id);
  // sharedmobility.ch late or failing leaves the scooters with the attributes it gave last.
  let timer: NodeJS.Timeout | undefined;
  await Promise.race([official.catch(() => undefined), new Promise(resolve => { timer = setTimeout(resolve, graceMs); })]);
  clearTimeout(timer);
  return { ...own, vehicles: mergeAppMap(own.vehicles, current.national.get(id) ?? []) };
}

async function readAppMap(id: string, map: SwissAppMap, current: SwissAppMapState): Promise<SourceVehicles> {
  if (map.provider === 'bolt') return collectBoltRegion(map.areas[0]);
  if (map.provider === 'dott') return collectDottRegion(map.areas[0]);
  // Voi's zones one at a time, as its client spaces them anyway: the one in view first, shown as it comes.
  const found: Vehicle[] = [];
  let observedAt = Infinity;
  const progress = new SweepProgress(() => mergeAppMap(found, current.national.get(id) ?? []));
  for (const zone of nearestFirst(map.areas, zone => zone.bounds)) {
    const result = await collectVoiRegion(zone);
    observedAt = Math.min(observedAt, result.observedAt ?? Date.now());
    found.push(...result.vehicles);
    progress.done(zone.bounds);
  }
  return { observedAt, stale: false, vehicles: found };
}

export function withSwissAppMaps(feeds: CollectableScooterFeed[]): CollectableScooterFeed[] {
  return feeds.map(feed => {
    const map = feed.source === 'national' ? SWISS_APP_MAPS.get(feed.id.slice(feed.id.indexOf(':') + 1)) : undefined;
    if (!map || map.provider !== feed.provider) return feed;
    return { ...feed, host: map.host, collect: () => collectFromAppMap(feed.id, feed.collect, () => readAppMap(feed.id, map, state)) };
  });
}

/** Whether the feed is a national one read from a rider map, collected as the app maps are rather than every minute. */
export const readsSwissAppMap = (feed: Pick<CollectableScooterFeed, 'id' | 'source'>) =>
  feed.source === 'national' && SWISS_APP_MAPS.has(feed.id.slice(feed.id.indexOf(':') + 1));
