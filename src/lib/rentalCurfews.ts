import catalog from '../../data/rental-curfews.json';
import { boundsContainPoint, polygonContainsPoint } from '@/lib/geo';
import type { MapBounds } from '@/lib/types';

// Cities that ban renting shared scooters at night, from data/rental-curfews.json.
// Some operators still list their scooters as available then, so the dock and
// the card say why they can't be rented. The iOS RentalCurfew.all is generated
// from the same file (scripts/generate-provider-catalog.mjs); it doesn't read the
// holiday evenings (`dates`) yet (docs/curfew-holiday-nights.md).

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Weekday = (typeof WEEKDAYS)[number];

interface CurfewNight {
  /** The evenings the night starts on, "fri" for Friday to Saturday; every night when left out. */
  days?: Weekday[];
  /**
   * The holiday evenings it starts on besides: "12-24", or days from Easter Sunday, "easter-4" the
   * Wednesday before Maundy Thursday, or from Finland's Midsummer Eve, "midsummerEve-1" (holidayEvening).
   */
  dates?: string[];
  /** Local "HH:MM". A window that starts before noon belongs to the evening before. */
  from: string;
  until: string;
}

interface RentalCurfew {
  id: string;
  city: string;
  timeZone: string;
  nights: CurfewNight[];
  /** The municipality's boundary, one ring of [lat, lng] points a piece. */
  areas: [number, number][][];
}

export interface ActiveCurfew {
  city: string;
  /** When renting is allowed again, epoch milliseconds. */
  until: number;
  /** The city's time zone, "Europe/Oslo", whose clock that time is told by. */
  timeZone: string;
}

const CURFEWS = catalog.curfews as unknown as RentalCurfew[];
// Each area's box: a point outside it is outside the area, whose edges then go uncounted. The cache's
// metrics ask about every service area of its 5,000 feeds on each scrape (feedCurfewed): counting the
// 8,200 edges of the 59 areas for each took most of the render, and held the cache's event loop a
// second or more at its scrapes on 27 October 2026 (stallLog.ts).
const BOXES = new Map(CURFEWS.flatMap(curfew => curfew.areas).map((ring): [[number, number][], MapBounds] => [ring, {
  south: Math.min(...ring.map(([lat]) => lat)), north: Math.max(...ring.map(([lat]) => lat)),
  west: Math.min(...ring.map(([, lng]) => lng)), east: Math.max(...ring.map(([, lng]) => lng)),
}]));
const inArea = (area: [number, number][], [lat, lng]: [number, number]) =>
  boundsContainPoint(BOXES.get(area)!, lat, lng) && polygonContainsPoint(area, lat, lng);
const DAY_MINUTES = 24 * 60;
const NOON = 12 * 60;
const MINUTE_MS = 60_000;
const DAY_MS = DAY_MINUTES * MINUTE_MS;

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const clocks = new Map<string, Intl.DateTimeFormat>();

/**
 * The wall clock of the zone at that instant: minutes since midnight, the day (0 for Monday), and the
 * date, in days since 1 January 1970.
 */
export function localClock(time: number, timeZone: string): { minutes: number; weekday: number; date: number } {
  let clock = clocks.get(timeZone);
  if (!clock) {
    clock = new Intl.DateTimeFormat('en-GB', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    clocks.set(timeZone, clock);
  }
  const parts = clock.formatToParts(time);
  const part = (type: string) => parts.find(entry => entry.type === type)?.value ?? '';
  return {
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
    weekday: WEEKDAYS.indexOf(part('weekday').toLowerCase().slice(0, 3) as Weekday),
    date: Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day'))) / DAY_MS,
  };
}

/** Easter Sunday of the year, in days since 1 January 1970 (the Gregorian computus). */
export function easterSunday(year: number): number {
  const golden = year % 19;
  const century = Math.floor(year / 100);
  const epact = (19 * golden + century - Math.floor(century / 4) - Math.floor((century - Math.floor((century + 8) / 25) + 1) / 3) + 15) % 30;
  const weekday = (32 + 2 * (century % 4) + 2 * Math.floor((year % 100) / 4) - epact - (year % 4)) % 7;
  const correction = Math.floor((golden + 11 * epact + 22 * weekday) / 451);
  const march = epact + weekday - 7 * correction + 114;
  return Date.UTC(year, Math.floor(march / 31) - 1, (march % 31) + 1) / DAY_MS;
}

/** Finland's Midsummer Eve, the Friday from 19 to 25 June, in days since 1 January 1970. */
function midsummerEve(year: number): number {
  const first = Date.UTC(year, 5, 19) / DAY_MS;
  // 1 January 1970 was a Thursday, 3 counting from Monday; Friday is 4.
  return first + ((4 - ((first + 3) % 7) + 7) % 7);
}

/**
 * The evening a night's holiday date names in that year, in days since 1 January 1970: "12-24", "easter-4",
 * "midsummerEve-1"; NaN for a date it can't read.
 */
export function holidayEvening(date: string, year: number): number {
  const fixed = /^(\d\d)-(\d\d)$/.exec(date);
  if (fixed) return Date.UTC(year, Number(fixed[1]) - 1, Number(fixed[2])) / DAY_MS;
  const moving = /^(easter|midsummerEve)([+-]\d+)?$/.exec(date);
  if (!moving) return NaN;
  return (moving[1] === 'easter' ? easterSunday(year) : midsummerEve(year)) + Number(moving[2] ?? 0);
}

/**
 * The first instant from then, on the minute, at which the zone's clock reads that time of day
 * (minutes since midnight). The clock then is passed when already known.
 */
export function nextWallClock(time: number, timeZone: string, target: number, clock = localClock(time, timeZone)): number {
  const end = Math.floor(time / MINUTE_MS) * MINUTE_MS + ((target - clock.minutes + DAY_MINUTES) % DAY_MINUTES) * MINUTE_MS;
  // The night the clocks change is an hour longer or shorter than the wall clock says.
  const drift = ((target - localClock(end, timeZone).minutes + DAY_MINUTES * 1.5) % DAY_MINUTES) - DAY_MINUTES / 2;
  return end + drift * MINUTE_MS;
}

/** Whether the window holds at that wall-clock time, given the day and date it is. */
function nightHolds(night: CurfewNight, { minutes, weekday, date }: ReturnType<typeof localClock>): boolean {
  const from = minutesOfDay(night.from);
  const until = minutesOfDay(night.until);
  // Whether the night started the evening before.
  let before: boolean;
  if (from > until) {
    if (minutes >= from) before = false;
    else if (minutes < until) before = true;
    else return false;
  } else {
    if (minutes < from || minutes >= until) return false;
    before = from < NOON;
  }
  if (!night.days || night.days.includes(WEEKDAYS[(weekday - Number(before) + 7) % 7])) return true;
  const evening = date - Number(before);
  const year = new Date(evening * DAY_MS).getUTCFullYear();
  return night.dates?.some(holiday => holidayEvening(holiday, year) === evening) ?? false;
}

/** The ban in force at that point and instant, if any. */
export function activeCurfew(point: [number, number] | null, now: number): ActiveCurfew | null {
  if (!point) return null;
  for (const curfew of CURFEWS) {
    if (!curfew.areas.some(area => inArea(area, point))) continue;
    const clock = localClock(now, curfew.timeZone);
    const night = curfew.nights.find(candidate => nightHolds(candidate, clock));
    if (!night) continue;
    return { city: curfew.city, until: nextWallClock(now, curfew.timeZone, minutesOfDay(night.until), clock), timeZone: curfew.timeZone };
  }
  return null;
}
