import catalog from '../../data/rental-curfews.json';

// Cities that ban renting shared scooters at night, from data/rental-curfews.json.
// Some operators still list their scooters as available then, so the dock and
// the card say why they can't be rented. The iOS RentalCurfew.all is generated
// from the same file (scripts/generate-provider-catalog.mjs).

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
type Weekday = (typeof WEEKDAYS)[number];

interface CurfewNight {
  /** The evenings the night starts on, "fri" for Friday to Saturday; every night when left out. */
  days?: Weekday[];
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
const DAY_MINUTES = 24 * 60;
const NOON = 12 * 60;
const MINUTE_MS = 60_000;

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const clocks = new Map<string, Intl.DateTimeFormat>();

/** The wall clock of the zone at that instant: minutes since midnight, and the day (0 for Monday). */
function localClock(time: number, timeZone: string): { minutes: number; weekday: number } {
  let clock = clocks.get(timeZone);
  if (!clock) {
    clock = new Intl.DateTimeFormat('en-GB', {
      timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    });
    clocks.set(timeZone, clock);
  }
  const parts = clock.formatToParts(time);
  const part = (type: string) => parts.find(entry => entry.type === type)?.value ?? '';
  return {
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
    weekday: WEEKDAYS.indexOf(part('weekday').toLowerCase().slice(0, 3) as Weekday),
  };
}

/** Ray casting; the rings are small enough for lat/lng to stand for a plane. */
export function polygonContainsPoint(ring: readonly [number, number][], lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    if ((latI > lat) !== (latJ > lat) && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI) inside = !inside;
  }
  return inside;
}

/** Whether the window holds at that wall-clock time, given the day it is. */
function nightHolds(night: CurfewNight, minutes: number, weekday: number): boolean {
  const from = minutesOfDay(night.from);
  const until = minutesOfDay(night.until);
  let evening: number;
  if (from > until) {
    if (minutes >= from) evening = weekday;
    else if (minutes < until) evening = weekday - 1;
    else return false;
  } else {
    if (minutes < from || minutes >= until) return false;
    evening = from >= NOON ? weekday : weekday - 1;
  }
  return !night.days || night.days.includes(WEEKDAYS[(evening + 7) % 7]);
}

/** The ban in force at that point and instant, if any. */
export function activeCurfew(point: [number, number] | null, now: number): ActiveCurfew | null {
  if (!point) return null;
  for (const curfew of CURFEWS) {
    if (!curfew.areas.some(area => polygonContainsPoint(area, point[0], point[1]))) continue;
    const { minutes, weekday } = localClock(now, curfew.timeZone);
    const night = curfew.nights.find(candidate => nightHolds(candidate, minutes, weekday));
    if (!night) continue;
    const until = minutesOfDay(night.until);
    let end = Math.floor(now / MINUTE_MS) * MINUTE_MS + ((until - minutes + DAY_MINUTES) % DAY_MINUTES) * MINUTE_MS;
    // The night the clocks change is an hour longer or shorter than the wall clock says.
    const drift = ((until - localClock(end, curfew.timeZone).minutes + DAY_MINUTES * 1.5) % DAY_MINUTES) - DAY_MINUTES / 2;
    end += drift * MINUTE_MS;
    return { city: curfew.city, until: end, timeZone: curfew.timeZone };
  }
  return null;
}
