import { coverageIntersects } from '../src/lib/feedCoverage';
import type { CollectableScooterFeed, FeedQuery } from '../src/lib/scooterFeeds';
import { fetchFeedZones } from '../src/lib/zoneFeeds';
import { zoneResponse, type StoredZone, type ZoneResponse } from '../src/lib/zones';

export interface ZoneFeed {
  id: string;
  load: () => Promise<StoredZone[]>;
}

interface Entry {
  zones: StoredZone[];
  loadedAt: number;
  failed: boolean;
  wantedAt: number;
}

interface ZoneStoreOptions {
  /** How long a feed's zones are kept before they are read again; its documents are kept as long. */
  refreshMs?: number;
  /** How soon a feed whose zones failed is tried again. */
  retryMs?: number;
  /** Zones nobody asked for in this long are let go. */
  forgetMs?: number;
  now?: () => number;
  onError?: (feedId: string, error: unknown) => void;
}

/**
 * The zones of the feeds someone looks at with zones on, read when first
 * asked for and again an hour later while asked for: they are off by
 * default, so most feeds' zones are never read at all.
 */
export function createZoneStore(options: ZoneStoreOptions = {}) {
  const refreshMs = options.refreshMs ?? 3600_000;
  const retryMs = options.retryMs ?? 60_000;
  const forgetMs = options.forgetMs ?? 6 * 3600_000;
  const now = options.now ?? Date.now;
  const entries = new Map<string, Entry>();
  const loading = new Map<string, Promise<void>>();

  function load(feed: ZoneFeed) {
    const done = feed.load().then(zones => {
      entries.set(feed.id, { zones, loadedAt: now(), failed: false, wantedAt: entries.get(feed.id)?.wantedAt ?? now() });
    }, (error: unknown) => {
      // The zones read before stay until those of the next try.
      const old = entries.get(feed.id);
      entries.set(feed.id, { zones: old?.zones ?? [], loadedAt: now(), failed: true, wantedAt: old?.wantedAt ?? now() });
      options.onError?.(feed.id, error);
    }).finally(() => loading.delete(feed.id));
    loading.set(feed.id, done);
  }

  return {
    /** Reads the zones of these feeds that are not kept, or kept too long. */
    demand(feeds: ZoneFeed[]) {
      const at = now();
      for (const [id, entry] of entries) if (at - entry.wantedAt > forgetMs) entries.delete(id);
      for (const feed of feeds) {
        const entry = entries.get(feed.id);
        if (entry) entry.wantedAt = at;
        if (loading.has(feed.id) || (entry && at - entry.loadedAt < (entry.failed ? retryMs : refreshMs))) continue;
        load(feed);
      }
    },
    /** Whether the zones of any of these feeds are on their way and none were read before. */
    pending(ids: string[]): boolean {
      return ids.some(id => loading.has(id) && !entries.has(id));
    },
    /** Resolves once these feeds' zones are read, or after timeoutMs. */
    async wait(ids: string[], timeoutMs: number): Promise<void> {
      const waiting = ids.flatMap(id => loading.get(id) ?? []);
      if (!waiting.length) return;
      let timer: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([Promise.all(waiting), new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); })]);
      clearTimeout(timer);
    },
    zones(ids: string[]): StoredZone[] {
      return ids.flatMap(id => entries.get(id)?.zones ?? []);
    },
  };
}

export type ZoneStore = ReturnType<typeof createZoneStore>;

/**
 * The zones of the feeds whose areas reach into the query's, waiting up to
 * waitMs for those not read yet; an answer without them says it is pending.
 */
export async function answerZones(store: ZoneStore, definitions: readonly CollectableScooterFeed[], query: FeedQuery,
  waitMs: number, load = fetchFeedZones): Promise<ZoneResponse> {
  const feeds = definitions.filter(feed => feed.zoneSource && (!query.providers || query.providers.has(feed.provider)) &&
    coverageIntersects(feed.coverage, query.bounds))
    .map(feed => ({ id: feed.id, load: () => load(feed.id, feed.provider, feed.zoneSource!) }));
  const ids = feeds.map(feed => feed.id);
  store.demand(feeds);
  await store.wait(ids, waitMs);
  return zoneResponse(store.zones(ids), query.bounds, store.pending(ids));
}
