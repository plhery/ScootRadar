import { VEHICLE_MAX_AGE_MS, type FeedSnapshot } from '../src/lib/scooterSnapshots';

/**
 * ok: its positions are served. failing: the last collection failed, the
 * previous positions are still served. expired: nothing is served and the map
 * says the provider is not sharing data.
 */
export type FeedState = 'ok' | 'failing' | 'expired';

export function feedState(feed: FeedSnapshot, now: number): FeedState {
  if (now - feed.observedAt > VEHICLE_MAX_AGE_MS) return 'expired';
  return feed.failed ? 'failing' : 'ok';
}

/**
 * Logs every feed whose state changed since the last call. A feed also expires
 * between two collections, without any error, when the source's own timestamp
 * passes the age limit: this runs on a timer, not after collections. The first
 * state seen for a feed is its baseline and is not logged.
 */
export function createFeedStateLog(log: (line: string) => void = console.log) {
  const known = new Map<string, { state: FeedState; since: number }>();
  return (feeds: readonly FeedSnapshot[], now = Date.now()) => {
    const seen = new Set<string>();
    for (const feed of feeds) {
      // A feed not attempted yet has no state to speak of.
      if (feed.skipped || feed.attemptedAt === 0) continue;
      seen.add(feed.id);
      const state = feedState(feed, now);
      const previous = known.get(feed.id);
      if (previous?.state === state) continue;
      known.set(feed.id, { state, since: now });
      if (!previous) continue;
      log(JSON.stringify({ event: 'snapshot_feed_state', feed: feed.id, state, previous: previous.state,
        secondsInPrevious: Math.round((now - previous.since) / 1000),
        observationAgeSeconds: Math.round((now - feed.observedAt) / 1000),
        attemptAgeSeconds: Math.round((now - feed.attemptedAt) / 1000) }));
    }
    for (const id of known.keys()) if (!seen.has(id)) known.delete(id);
  };
}
