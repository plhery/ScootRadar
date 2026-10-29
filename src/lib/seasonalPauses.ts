import { SWISS_SCOOTER_AREAS } from '@/lib/feedCoverage';
import { boundsContainPoint } from '@/lib/geo';
import { activeCurfew } from '@/lib/rentalCurfews';
import {
  REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, regionalCityId, regionalSource, serviceAreas,
  type RegionalScooterCity, type RegionalScooterSystem,
} from '@/lib/regionalScooterSystems';

// Some cities have scooters only part of the year: Montréal takes them off its streets each
// winter. A service area of a catalog says so with `seasonal`; its system's, for all its areas
// that set none. Inside the window, the operator's feed may list nothing or stop answering:
// the map says when the scooters come back rather than that the operator is not sharing data,
// and the cache's alerts stay quiet. The iOS ScooterSeasonalPause reads the same windows from
// ScooterCityCatalog, generated from the same catalogs (scripts/generate-provider-catalog.mjs).
//
// Some towns set no day for the scooters to come back: Skien's stop from 15 December "til det er
// snø- og isfritt", until the streets are clear of snow and ice. Their pause ends 'clear'. It
// holds until CLEAR_BY at the latest, so the alerts are back by then if the scooters are not, and
// the dock shows it only while the map has no scooter in view (dockModel.ts), so it gives way as
// soon as the operator brings them back, whichever day that is.
//
// Some operators say themselves when a town's season is over: Whoosh closed Almaty, Astana and
// Zapopan on 24 October 2026. The cache keeps it on the feed's snapshot (`seasonOver`), and it
// pauses the feed as a catalog's window does, until the operator says the season is open again.
// The answers name those feeds (`meta.seasonOver`), so the dock shows the town paused, as one
// until the streets are clear, while no scooter is in view. The iOS app does the same from
// ScooterCity.feeds, each city's feeds with their pauses, generated from the same catalogs.

export interface SeasonalPause {
  /** Local "MM-DD": the first day without scooters. */
  from: string;
  /** Local "MM-DD": the first day they are back; or 'clear', once the streets are clear, on no set day. */
  until: string;
  /** The IANA time zone the dates are in: "America/Toronto". */
  timeZone: string;
}

/**
 * The first day a pause until the streets are clear no longer holds, local "MM-DD": 1 May, when
 * Tromsø, the northernmost town covered, starts its season by its rule. Until then the cache's
 * alerts stay quiet for the feed even once its scooters are back, which may be weeks earlier;
 * from then on, a feed that has not come back is reported as any other.
 */
export const CLEAR_BY = '05-01';

/**
 * When the scooters come back: in a month, 1 for January, or once the streets are clear, after a
 * pause from a local "MM-DD".
 */
export type SeasonalReturn = { month: number } | { from: string };

/** A city in its pause: when its scooters come back, or that its operators have closed its season. */
export type ActiveSeasonalPause = { city: string } & (SeasonalReturn | { seasonOver: true });

const dates = new Map<string, Intl.DateTimeFormat>();

/** The local date in the zone at that instant, "MM-DD". */
function localDate(time: number, timeZone: string): string {
  let format = dates.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-GB', { timeZone, month: '2-digit', day: '2-digit' });
    dates.set(timeZone, format);
  }
  const parts = format.formatToParts(time);
  const part = (type: string) => parts.find(entry => entry.type === type)?.value ?? '';
  return `${part('month')}-${part('day')}`;
}

/**
 * Whether the pause holds at that instant. A window from "11-16" until "04-15" spans the new year;
 * one until the streets are clear holds until CLEAR_BY.
 */
export function pauseHolds(pause: SeasonalPause, now: number): boolean {
  const today = localDate(now, pause.timeZone);
  const until = pause.until === 'clear' ? CLEAR_BY : pause.until;
  return pause.from < until
    ? today >= pause.from && today < until
    : today >= pause.from || today < until;
}

// Days from one "MM-DD" to the next, forward, in a year of 365 days.
const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const dayOfYear = (date: string) => DAYS_BEFORE_MONTH[Number(date.slice(0, 2)) - 1] + Number(date.slice(3, 5));
const daysUntil = (from: string, to: string) => (dayOfYear(to) - dayOfYear(from) + 365) % 365;

/**
 * When the scooters come back, when every one of the pauses holds: the soonest of their ends, and
 * a pause until the streets are clear may end any day. Null when one of them does not hold, or
 * there are none.
 */
export function pausesReturn(pauses: readonly SeasonalPause[] | undefined, now: number): SeasonalReturn | null {
  if (!pauses?.length || !pauses.every(pause => pauseHolds(pause, now))) return null;
  const clear = pauses.find(pause => pause.until === 'clear');
  if (clear) return { from: clear.from };
  const soonest = pauses.reduce((best, pause) =>
    daysUntil(localDate(now, pause.timeZone), pause.until) < daysUntil(localDate(now, best.timeZone), best.until) ? pause : best);
  return { month: Number(soonest.until.slice(0, 2)) };
}

/** A system's pauses, one per service area; undefined where an area has none. */
export function systemPauses(system: RegionalScooterSystem): (SeasonalPause | undefined)[] {
  return serviceAreas(system).map(area => area.seasonal ?? system.seasonal);
}

const SYSTEMS_BY_FEED = new Map(REGIONAL_SCOOTER_SYSTEMS.map(system => [`${regionalSource(system)}:${system.id}`, system]));

/**
 * Whether the feed's every service area is in its seasonal pause: its operator is expected to
 * be quiet, so a failure or old positions say nothing about it. Feeds without a catalog entry,
 * Switzerland's, never pause.
 */
export function feedPaused(feedId: string, now: number, systems: ReadonlyMap<string, RegionalScooterSystem> = SYSTEMS_BY_FEED): boolean {
  const system = systems.get(feedId);
  if (!system) return false;
  const pauses = systemPauses(system);
  return pauses.every(pause => pause !== undefined && pauseHolds(pause, now));
}

/**
 * Whether the feed is paused: its every service area in its seasonal pause (feedPaused), or its
 * operator saying its season is over.
 */
export function snapshotPaused(feed: { id: string; seasonOver?: boolean }, now: number,
  systems: ReadonlyMap<string, RegionalScooterSystem> = SYSTEMS_BY_FEED): boolean {
  return !!feed.seasonOver || feedPaused(feed.id, now, systems);
}

/**
 * Whether a night ban holds at every one of the feed's service areas (rentalCurfews.ts): its
 * operator may then take the feed down until morning, as Dott takes Trondheim's on Friday and
 * Saturday nights, while Entur keeps serving its last positions. The map already says renting is
 * banned; the alerts wait for the morning.
 */
export function feedCurfewed(feedId: string, now: number, systems: ReadonlyMap<string, RegionalScooterSystem> = SYSTEMS_BY_FEED): boolean {
  const system = systems.get(feedId);
  return !!system && serviceAreas(system).every(area => activeCurfew(area.center, now) !== null);
}

/**
 * When the first night ban in force then at one of the feed's service areas ends, if one is: an
 * operator hides its scooters in the ban, so a collection then finds none where they stand by morning.
 */
export function feedCurfewEnds(feedId: string, now: number, systems: ReadonlyMap<string, RegionalScooterSystem> = SYSTEMS_BY_FEED): number | undefined {
  const system = systems.get(feedId);
  const ends = system ? serviceAreas(system).flatMap(area => activeCurfew(area.center, now)?.until ?? []) : [];
  return ends.length ? Math.min(...ends) : undefined;
}

// The feed and pause of each service area, by city id.
let cityAreas: Map<string, { feed: string; pause: SeasonalPause | undefined }[]> | undefined;

/**
 * Whether the city's operators have all closed its season, or are in their own pause, and one
 * at least has closed it: `seasonOver` holds the feeds whose operator says so.
 */
function closedForSeason(cityId: string, now: number, seasonOver: ReadonlySet<string>): boolean {
  if (!seasonOver.size) return false;
  if (!cityAreas) {
    cityAreas = new Map();
    for (const system of REGIONAL_SCOOTER_SYSTEMS) {
      for (const area of serviceAreas(system)) {
        const id = regionalCityId(system, area);
        cityAreas.set(id, [...cityAreas.get(id) ?? [],
          { feed: `${regionalSource(system)}:${system.id}`, pause: area.seasonal ?? system.seasonal }]);
      }
    }
  }
  const areas = cityAreas.get(cityId) ?? [];
  return areas.some(area => seasonOver.has(area.feed))
    && areas.every(area => seasonOver.has(area.feed) || (area.pause !== undefined && pauseHolds(area.pause, now)));
}

/**
 * The city at that point whose scooters are away for the season, and when they come back.
 * Null outside every city, or where one of the cities around the point, Swiss ones included,
 * has scooters now. `seasonOver` holds the feeds whose operator says their season is over.
 */
export function activeSeasonalPause(point: [number, number] | null, now: number,
  cities: readonly RegionalScooterCity[] = REGIONAL_SCOOTER_CITIES,
  seasonOver: ReadonlySet<string> = new Set()): ActiveSeasonalPause | null {
  if (!point || SWISS_SCOOTER_AREAS.some(area => boundsContainPoint(area.bounds, point[0], point[1]))) return null;
  let found: ActiveSeasonalPause | null = null;
  for (const city of cities) {
    if (!boundsContainPoint(city.bounds, point[0], point[1])) continue;
    const back = pausesReturn(city.pauses, now)
      ?? (closedForSeason(city.id, now, seasonOver) ? { seasonOver: true as const } : null);
    if (back === null) return null;
    found ??= { city: city.city, ...back };
  }
  return found;
}
