import { SWISS_SCOOTER_AREAS } from '@/lib/feedCoverage';
import { boundsContainPoint } from '@/lib/geo';
import { activeCurfew } from '@/lib/rentalCurfews';
import {
  REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas,
  type RegionalScooterCity, type RegionalScooterSystem,
} from '@/lib/regionalScooterSystems';

// Some cities have scooters only part of the year: Montréal takes them off its streets each
// winter. A service area of a catalog says so with `seasonal`; its system's, for all its areas
// that set none. Inside the window, the operator's feed may list nothing or stop answering:
// the map says when the scooters come back rather than that the operator is not sharing data,
// and the cache's alerts stay quiet. The iOS ScooterSeasonalPause reads the same windows from
// ScooterCityCatalog, generated from the same catalogs (scripts/generate-provider-catalog.mjs).

export interface SeasonalPause {
  /** Local "MM-DD": the first day without scooters. */
  from: string;
  /** Local "MM-DD": the first day they are back. */
  until: string;
  /** The IANA time zone the dates are in: "America/Toronto". */
  timeZone: string;
}

export interface ActiveSeasonalPause {
  city: string;
  /** The month the scooters come back, 1 for January. */
  month: number;
}

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

/** Whether the pause holds at that instant. A window from "11-16" until "04-15" spans the new year. */
export function pauseHolds(pause: SeasonalPause, now: number): boolean {
  const today = localDate(now, pause.timeZone);
  return pause.from < pause.until
    ? today >= pause.from && today < pause.until
    : today >= pause.from || today < pause.until;
}

// Days from one "MM-DD" to the next, forward, in a year of 365 days.
const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const dayOfYear = (date: string) => DAYS_BEFORE_MONTH[Number(date.slice(0, 2)) - 1] + Number(date.slice(3, 5));
const daysUntil = (from: string, to: string) => (dayOfYear(to) - dayOfYear(from) + 365) % 365;

/**
 * The month the scooters come back, when every one of the pauses holds: the soonest of their
 * ends. Null when one of them does not hold, or there are none.
 */
export function pausesReturn(pauses: readonly SeasonalPause[] | undefined, now: number): number | null {
  if (!pauses?.length || !pauses.every(pause => pauseHolds(pause, now))) return null;
  const soonest = pauses.reduce((best, pause) =>
    daysUntil(localDate(now, pause.timeZone), pause.until) < daysUntil(localDate(now, best.timeZone), best.until) ? pause : best);
  return Number(soonest.until.slice(0, 2));
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
 * The city at that point whose scooters are away for the season, and when they come back.
 * Null outside every city, or where one of the cities around the point, Swiss ones included,
 * has scooters now.
 */
export function activeSeasonalPause(point: [number, number] | null, now: number,
  cities: readonly RegionalScooterCity[] = REGIONAL_SCOOTER_CITIES): ActiveSeasonalPause | null {
  if (!point || SWISS_SCOOTER_AREAS.some(area => boundsContainPoint(area.bounds, point[0], point[1]))) return null;
  let found: ActiveSeasonalPause | null = null;
  for (const city of cities) {
    if (!boundsContainPoint(city.bounds, point[0], point[1])) continue;
    const month = pausesReturn(city.pauses, now);
    if (month === null) return null;
    found ??= { city: city.city, month };
  }
  return found;
}
