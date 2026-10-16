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
  if (now - lastSuccess(feed) > cadence.idleExpiryMs ||
    (fastFor(feed, now, cadence, VEHICLE_MAX_AGE_MS) && now - feed.observedAt > VEHICLE_MAX_AGE_MS)) return 'expired';
  return feed.failed ? 'failing' : 'ok';
}

/** Whether the feed's parking availability is as fresh as its cadence promises. */
export function parkingUp(feed: FeedSnapshot, now: number, cadence: FeedCadence = ALWAYS_FAST): boolean {
  if (!feed.parking || feed.parking.stale) return false;
  const limit = fastFor(feed, now, cadence, PARKING_MAX_AGE_MS) ? PARKING_MAX_AGE_MS
    : Math.max(PARKING_MAX_AGE_MS, cadence.idleExpiryMs);
  return now - feed.parking.observedAt <= limit;
}

export interface FeedStateChange {
  event: 'snapshot_feed_state';
  feed: string;
  state: FeedState;
  previous: FeedState;
  secondsInPrevious: number;
  observationAgeSeconds: number;
  attemptAgeSeconds: number;
}

/** A feed that has stayed expired for `afterMs`, told once for each time it expires. */
export interface StillExpired {
  afterMs: number;
  /** The change that expired it, and the feed as it is now. */
  report: (change: FeedStateChange, feed: FeedSnapshot) => void;
}

/**
 * Logs every feed whose state changed since the last call. A feed also expires
 * between two collections, without any error, when its time runs out: this
 * runs on a timer, not after collections. The first
 * state seen for a feed is its baseline and is not logged.
 */
export function createFeedStateLog(log: (line: string) => void = console.log,
  onChange?: (change: FeedStateChange, feed: FeedSnapshot) => void, cadence: FeedCadence = ALWAYS_FAST,
  stillExpired?: StillExpired) {
  const known = new Map<string, { state: FeedState; since: number; change?: FeedStateChange }>();
  return (feeds: readonly FeedSnapshot[], now = Date.now()) => {
    const seen = new Set<string>();
    for (const feed of feeds) {
      // A feed not attempted yet has no state to speak of.
      if (feed.skipped || feed.attemptedAt === 0) continue;
      seen.add(feed.id);
      const state = feedState(feed, now, cadence);
      const previous = known.get(feed.id);
      if (previous?.state === state) {
        if (stillExpired && previous.change?.state === 'expired' && now - previous.since >= stillExpired.afterMs) {
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
        observationAgeSeconds: Math.round((now - feed.observedAt) / 1000),
        attemptAgeSeconds: Math.round((now - feed.attemptedAt) / 1000) };
      known.set(feed.id, { state, since: now, change });
      log(JSON.stringify(change));
      onChange?.(change, feed);
    }
    for (const id of known.keys()) if (!seen.has(id)) known.delete(id);
  };
}
