import { VEHICLE_MAX_AGE_MS, type FeedSnapshot } from '../src/lib/scooterSnapshots';
import { PARKING_MAX_AGE_MS } from '../src/lib/dataFreshness';

/**
 * ok: its last collection succeeded. failing: the last collection failed, the
 * previous positions are still held. expired: it has not been collected as
 * often as its cadence promises, so the map says the provider is not sharing
 * data, or would as soon as someone looked.
 */
export type FeedState = 'ok' | 'failing' | 'expired';

/** How often a feed is meant to be collected, for judging its state. */
export interface FeedCadence {
  /**
   * When the feed went onto the active interval: 0 for an always-fast feed,
   * the start of its watch for a watched one, undefined while it is idle.
   */
  fastSince(id: string, now: number): number | undefined;
  /** An idle feed expires once it has had no successful collection for this long. */
  idleExpiryMs: number;
  /** A collector whose documented idle scan is slower, by feed id. */
  idleExpiryMsForFeed?(id: string): number | undefined;
}

/** Every feed collected every minute: the rule before idle feeds existed. */
export const ALWAYS_FAST: FeedCadence = { fastSince: () => 0, idleExpiryMs: VEHICLE_MAX_AGE_MS };

const lastSuccess = (feed: FeedSnapshot) => feed.collectedAt ?? feed.observedAt;
/** On the active interval for at least `ms`, so its collections should have kept the data that fresh. */
const fastFor = (feed: FeedSnapshot, now: number, cadence: FeedCadence, ms: number) => {
  const since = cadence.fastSince(feed.id, now);
  return since !== undefined && now - since >= ms;
};

/**
 * An idle feed's positions may be older than the map shows (15 minutes): it is
 * collected again as soon as someone looks. So it expires only when no
 * collection has succeeded for its interval and a grace. A feed collected every
 * minute, for at least 15 minutes, expires as its positions do on the map.
 */
export function feedState(feed: FeedSnapshot, now: number, cadence: FeedCadence = ALWAYS_FAST): FeedState {
  if (now - lastSuccess(feed) > (cadence.idleExpiryMsForFeed?.(feed.id) ?? cadence.idleExpiryMs) ||
    (fastFor(feed, now, cadence, VEHICLE_MAX_AGE_MS) && now - feed.observedAt > VEHICLE_MAX_AGE_MS)) return 'expired';
  return feed.failed ? 'failing' : 'ok';
}

/** Whether the feed's parking availability is as fresh as its cadence promises. */
export function parkingUp(feed: FeedSnapshot, now: number, cadence: FeedCadence = ALWAYS_FAST): boolean {
  if (!feed.parking || feed.parking.stale) return false;
  const limit = fastFor(feed, now, cadence, PARKING_MAX_AGE_MS) ? PARKING_MAX_AGE_MS
    : Math.max(PARKING_MAX_AGE_MS, cadence.idleExpiryMsForFeed?.(feed.id) ?? cadence.idleExpiryMs);
  return now - feed.parking.observedAt <= limit;
}

export interface FeedStateChange {
  event: 'snapshot_feed_state';
  feed: string;
  state: FeedState;
  /** warming: not attempted yet, as a feed a deploy adds. */
  previous: FeedState | 'warming';
  secondsInPrevious: number;
  /** null for a feed with no observation, rather than an age from 1970. */
  observationAgeSeconds: number | null;
  attemptAgeSeconds: number;
}

/** A feed that has stayed expired for `afterMs`, told once for each time it expires. */
export interface StillExpired {
  /** How long, the same for every feed or by feed. */
  afterMs: number | ((feed: FeedSnapshot) => number);
  /** Whether to hold the report for now: asked again on each call while the feed stays expired. */
  wait?: (feed: FeedSnapshot, now: number) => boolean;
  /** The change that expired it, and the feed as it is now. */
  report: (change: FeedStateChange, feed: FeedSnapshot) => void;
}

const reportAfter = ({ afterMs }: StillExpired, feed: FeedSnapshot) => typeof afterMs === 'function' ? afterMs(feed) : afterMs;

/**
 * How long a feed stays expired before Sentry hears of it: not a blip, as Voi Switzerland's of
 * 105 seconds on 16 October 2026. Grafana's "feed stopped" waits 10 minutes, and 15 for Voi Switzerland.
 */
export const EXPIRED_REPORT_DELAY_MS = 5 * 60_000;

/**
 * Longer for a feed that stalls upstream and comes back on its own. Voi's Swiss feed moves every
 * 8 minutes and reaches us 3 to 5 minutes later, so it runs 2 or 3 minutes short of expiring; on
 * 16 and 17 October 2026 Voi stopped it for up to 21 minutes three times, and it was back within
 * 10 minutes of expiring each time.
 */
const EXPIRED_REPORT_DELAYS_MS: Readonly<Record<string, number>> = { 'national:voiscooters.com': 15 * 60_000 };

/** A feed whose own idle expiry is this long or longer is swept slowly on purpose, as the app maps every two hours. */
const SLOW_SWEEP_EXPIRY_MS = 60 * 60_000;

/**
 * Longer for a feed swept slowly on purpose. Its sweep waits while views someone watches take its
 * client's turns, and runs late after a deploy; a new feed's first collection may fail and be
 * retried. On 25 October 2026 Whoosh's Recife sweep ran 9 minutes past its grace while São Paulo
 * and Santiago were watched, BinBin's Sakarya 6 after a restart, and a Lime group in Rome added
 * that day failed its first collection: each was back within 10 minutes. Lime's Berlin groups,
 * starved by a watched view for up to 53 minutes the same day, are still told.
 */
export const SLOW_SWEEP_REPORT_DELAY_MS = 30 * 60_000;

/** How long this feed stays expired before Sentry hears of it, given its own idle expiry if it has one. */
export function expiredReportDelay(feed: FeedSnapshot, ownIdleExpiryMs = 0): number {
  return EXPIRED_REPORT_DELAYS_MS[feed.id] ??
    (ownIdleExpiryMs >= SLOW_SWEEP_EXPIRY_MS ? SLOW_SWEEP_REPORT_DELAY_MS : EXPIRED_REPORT_DELAY_MS);
}

/**
 * How long after a night ban Sentry waits for a feed to come back. An operator may take its feed
 * down for the ban, as Dott does in Trondheim, and bring it back minutes after: 7.5 on 17 October
 * 2026, 16 on the 18th. Grafana's "feed stopped" waits as long.
 */
export const CURFEW_RETURN_MS = 30 * 60_000;

/**
 * A StillExpired wait that holds the report while a night ban holds at the feed (`curfewed`), and
 * for CURFEW_RETURN_MS after it ends.
 */
export function waitOutCurfew(curfewed: (feedId: string, now: number) => boolean) {
  return (feed: FeedSnapshot, now: number) => curfewed(feed.id, now) || curfewed(feed.id, now - CURFEW_RETURN_MS);
}

/**
 * Logs every feed whose state changed since the last call. A feed also expires
 * between two collections, without any error, when its time runs out: this
 * runs on a timer, not after collections. The first
 * state seen for a feed is its baseline and is not logged. A feed not attempted
 * yet, as one a deploy adds, has 'warming' as its baseline: the state its first
 * collections leave is a change, so one that never loads is told like any other.
 */
export function createFeedStateLog(log: (line: string) => void = console.log,
  onChange?: (change: FeedStateChange, feed: FeedSnapshot) => void, cadence: FeedCadence = ALWAYS_FAST,
  stillExpired?: StillExpired) {
  const known = new Map<string, { state: FeedState | 'warming'; since: number; change?: FeedStateChange }>();
  return (feeds: readonly FeedSnapshot[], now = Date.now()) => {
    const seen = new Set<string>();
    for (const feed of feeds) {
      if (feed.skipped) continue;
      seen.add(feed.id);
      const previous = known.get(feed.id);
      if (feed.attemptedAt === 0) {
        if (!previous) known.set(feed.id, { state: 'warming', since: now });
        continue;
      }
      const state = feedState(feed, now, cadence);
      if (previous?.state === state) {
        if (stillExpired && previous.change?.state === 'expired' && now - previous.since >= reportAfter(stillExpired, feed) &&
          !stillExpired.wait?.(feed, now)) {
          stillExpired.report(previous.change, feed);
          previous.change = undefined;
        }
        continue;
      }
      if (!previous) {
        known.set(feed.id, { state, since: now });
        continue;
      }
      const change: FeedStateChange = { event: 'snapshot_feed_state', feed: feed.id, state, previous: previous.state,
        secondsInPrevious: Math.round((now - previous.since) / 1000),
        observationAgeSeconds: feed.observedAt ? Math.round((now - feed.observedAt) / 1000) : null,
        attemptAgeSeconds: Math.round((now - feed.attemptedAt) / 1000) };
      known.set(feed.id, { state, since: now, change });
      log(JSON.stringify(change));
      onChange?.(change, feed);
    }
    for (const id of known.keys()) if (!seen.has(id)) known.delete(id);
  };
}
