import { localClock } from '../src/lib/rentalCurfews';
import { idPhase } from './feedScheduler';

/**
 * How often an app map with long sweeps (Alpaca, BinBin, GCOO, ATOM, Whoosh, Skyss's), or DART's, a whole fleet in
 * one read, is collected while nobody looks at it; Lime's many markets are every three days (LIME_IDLE_INTERVAL_MS). While a request
 * has a slow one collected again, its last positions stand faded where its scooters were last seen
 * (showsLastSeen), and its sweep starts where the map looks, so a long interval leaves no empty
 * map, and it spares the operator's servers.
 */
export const APP_MAP_IDLE_INTERVAL_MS = 2 * 60 * 60_000;

const DAY_MS = 24 * 60 * 60_000;
// A town's idle sweeps fall between 08:00 and 21:00 there.
const SWEEP_DAY_FROM = 8 * 60;
const SWEEP_DAY_UNTIL = 21 * 60;

/**
 * When an app map's idle sweeps fall (FeedScheduler), for an interval of whole days: in its town's daytime,
 * at the hour its id puts it or twelve hours on when that is between 21:00 and 08:00 there, and within a day
 * after a sweep by night. Operators hide their scooters in night bans, and some maps are empty at night
 * without one (limeDaytime).
 */
export function daytimeSweeps(feedId: string, timeZone: string, intervalMs: number, now = Date.now()): { idlePhase: number; nightAt: (time: number) => boolean } {
  const nightAt = (time: number) => {
    const { minutes } = localClock(time, timeZone);
    return minutes < SWEEP_DAY_FROM || minutes >= SWEEP_DAY_UNTIL;
  };
  // The scheduler counts phases from midnight UTC, so the turn falls at this time of a UTC day.
  const at = idPhase(feedId) * intervalMs;
  const moved = nightAt(now - now % DAY_MS + at % DAY_MS) ? (at + DAY_MS / 2) % intervalMs : at;
  return { idlePhase: moved / intervalMs, nightAt };
}
