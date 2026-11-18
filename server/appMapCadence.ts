import { localClock, nextWallClock } from '../src/lib/rentalCurfews';
import { isAppMapSystem, regionalSource, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { idPhase } from './feedScheduler';

/**
 * How often an app map is collected while nobody looks at it: once a day, in its town's daytime (withDailySweeps).
 * Such a collection feeds the city totals and the town's health, which a day's read serves. A town someone opens
 * is collected at once: a quick map's request waits for it, a slow one's last positions stand faded where its
 * scooters were last seen (showsLastSeen) while its sweep starts where the map looks. Until 18 November 2026 the
 * maps read in a request or a few (Dott's, Bolt's, Voi's, Swing's and six more operators', 612 towns) were
 * collected every 20 minutes, as an open feed, and those read in long sweeps (GCOO's, Alpaca's, Whoosh's,
 * BinBin's, ATOM's, RideMovi's, Skyss's and DART's, 163) every two hours: some 46,000 of the 82,451 idle
 * collections of the day before. Lime's groups and Ryde's are swept every three days, Ryde's every day in a city
 * someone opened that week, and Bird's areas every day, each by its collector's own rule.
 */
export const APP_MAP_IDLE_INTERVAL_MS = 24 * 60 * 60_000;

/**
 * How long past its day an app map may go without a collection before it expires, for monitoring, as a Bird area
 * (BIRD_IDLE_GRACE_MS): its turn comes a day after the last, behind its host's other sweeps, and a failed
 * collection is retried after 1, 2, 4… minutes, six times in these two hours.
 */
export const APP_MAP_IDLE_GRACE_MS = 2 * 60 * 60_000;

/**
 * How long after an app map's collection started a view too wide to show single scooters, clusters from
 * zoom 15 out, has it collected again (FeedScheduler's wideIntervalMs), where a street's view has it
 * collected every minute. The map shows positions for 15 minutes and asks again every minute, so the next
 * collection starts in the eleventh minute at the latest and has four to end before they go: the groups
 * of scooters such a view shows never empty, at a tenth of the operator's requests.
 */
export const APP_MAP_WIDE_INTERVAL_MS = 10 * 60_000;

const DAY_MS = 24 * 60 * 60_000;
// A town's idle sweeps fall between 08:00 and 21:00 there.
const SWEEP_DAY_FROM = 8 * 60;
const SWEEP_DAY_UNTIL = 21 * 60;

/**
 * When an app map's idle sweeps fall (FeedScheduler), for an interval of whole days: in its town's daytime,
 * at the hour its id puts it (or `turn`, a share of the interval, for towns read together), or twelve hours
 * on when that is between 21:00 and 08:00 there, and at 08:00 after a sweep by night. Operators hide their
 * scooters in night bans, and some maps are empty at night without one (limeDaytime): two of Bergen's central
 * Lime groups, read at 01:24 on Thursday 29 October 2026, a night without its ban, held none of their 436
 * scooters, and would have until their turn that day.
 */
export function daytimeSweeps(turn: string | number, timeZone: string, intervalMs: number, now = Date.now()): { idlePhase: number; nightEnds: (time: number) => number | undefined } {
  const nightEnds = (time: number) => {
    const clock = localClock(time, timeZone);
    return clock.minutes < SWEEP_DAY_FROM || clock.minutes >= SWEEP_DAY_UNTIL ? nextWallClock(time, timeZone, SWEEP_DAY_FROM, clock) : undefined;
  };
  // The scheduler counts phases from midnight UTC, so the turn falls at this time of a UTC day.
  const at = (typeof turn === 'number' ? turn : idPhase(turn)) * intervalMs;
  const moved = nightEnds(now - now % DAY_MS + at % DAY_MS) !== undefined ? (at + DAY_MS / 2) % intervalMs : at;
  return { idlePhase: moved / intervalMs, nightEnds };
}

// The time zone of a country whose towns the catalog gives none: Dott's, Bolt's, Qick's and RideMovi's, and three of
// BinBin's. Spain's is the mainland's, an hour ahead of the Canaries', which moves a sweep's day by as much.
const COUNTRY_TIME_ZONES: Readonly<Record<string, string>> = {
  AT: 'Europe/Vienna', BA: 'Europe/Sarajevo', BE: 'Europe/Brussels', BG: 'Europe/Sofia', CY: 'Asia/Nicosia', DE: 'Europe/Berlin',
  EE: 'Europe/Tallinn', ES: 'Europe/Madrid', FI: 'Europe/Helsinki', GR: 'Europe/Athens', HU: 'Europe/Budapest', IE: 'Europe/Dublin',
  IS: 'Atlantic/Reykjavik', IT: 'Europe/Rome', LT: 'Europe/Vilnius', LV: 'Europe/Riga', MD: 'Europe/Chisinau', MK: 'Europe/Skopje',
  NO: 'Europe/Oslo', PL: 'Europe/Warsaw', PT: 'Europe/Lisbon', RO: 'Europe/Bucharest', SE: 'Europe/Stockholm', SI: 'Europe/Ljubljana',
  SK: 'Europe/Bratislava', UA: 'Europe/Kiev', XK: 'Europe/Belgrade',
};

/** The time zone a town's day is told in: its own, or its country's where the catalog names none. */
export const townTimeZone = (system: Pick<RegionalScooterSystem, 'timeZone' | 'country'>): string | undefined =>
  system.timeZone ?? COUNTRY_TIME_ZONES[system.country];

/**
 * Every app map collected once a day while nobody looks, in its town's daytime, and at 08:00 after a collection
 * by night (daytimeSweeps), unless its collector set an interval of its own, as Lime's, Bird's and Ryde's do.
 * Towns their collector reads together (its idlePhase, as LUUP's Shibuya, Kawasaki and Yokohama) keep one turn.
 */
export function withDailySweeps(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[], now = Date.now()): CollectableScooterFeed[] {
  const towns = new Map(systems.filter(isAppMapSystem).map(system => [`${regionalSource(system)}:${system.id}`, system]));
  return feeds.map(feed => {
    const town = towns.get(feed.id);
    if (!town || feed.idleIntervalMs !== undefined) return feed;
    const timeZone = townTimeZone(town);
    return { ...feed, idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, idleGraceMs: APP_MAP_IDLE_GRACE_MS,
      ...timeZone ? daytimeSweeps(feed.idlePhase ?? feed.id, timeZone, APP_MAP_IDLE_INTERVAL_MS, now) : {} };
  });
}
