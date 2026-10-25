import { COUNTRY_SOURCES } from '../src/lib/regionalScooterSystems';
import { VEHICLE_MAX_AGE_MS } from '../src/lib/dataFreshness';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';
import { DEFAULT_SCHEDULE } from './feedScheduler';

/** Switzerland's feeds: sharedmobility.ch, Hopp's Swiss towns and PubliBike. */
const SWISS_SOURCES = ['national', 'hopp', 'publibike'];
const ALL_SOURCES = [...SWISS_SOURCES, ...Object.values(COUNTRY_SOURCES)];
/** How long after its interval a feed off the active interval expires. */
const EXPIRY_GRACE_MS = 10 * 60_000;

export interface CollectionCadence {
  activeIntervalMs: number;
  idleIntervalMs: number;
  watchMs: number;
  retryMs: number;
  /** Sources collected every active interval whether or not anyone looks. */
  alwaysFastSources: ReadonlySet<string>;
  /**
   * A feed off the active interval is expired, for monitoring, once it has had
   * no successful collection for this long: its interval plus ten minutes.
   */
  idleExpiryMs: number;
}

/**
 * `SCOOTER_ALWAYS_FAST`: comma-separated country codes (CH, FR, DE…) or
 * source keys (national, hopp, publibike, france…), or "all". CH stands for
 * the three Swiss sources.
 */
export function alwaysFastSources(value: string): Set<string> {
  const sources = new Set<string>();
  for (const token of value.split(',').map(part => part.trim()).filter(Boolean)) {
    const code = token.toUpperCase();
    const key = token.toLowerCase();
    if (key === 'all') ALL_SOURCES.forEach(source => sources.add(source));
    else if (code === 'CH') SWISS_SOURCES.forEach(source => sources.add(source));
    else if (code in COUNTRY_SOURCES) sources.add(COUNTRY_SOURCES[code as keyof typeof COUNTRY_SOURCES]);
    else if (ALL_SOURCES.includes(key)) sources.add(key);
    else throw new Error(`SCOOTER_ALWAYS_FAST: "${token}" is neither a covered country code nor a source`);
  }
  return sources;
}

/** The collection cadence from the environment; every value has a default. */
export function cadenceFromEnv(env: Record<string, string | undefined> = process.env): CollectionCadence {
  const seconds = (name: string, fallbackMs: number, minimumMs: number) => {
    const raw = env[name]?.trim();
    if (!raw) return fallbackMs;
    const value = Number(raw) * 1000;
    if (!Number.isFinite(value) || value < minimumMs) throw new Error(`${name} must be a number of seconds, at least ${minimumMs / 1000}`);
    return value;
  };
  const activeIntervalMs = seconds('SCOOTER_ACTIVE_INTERVAL_SECONDS', DEFAULT_SCHEDULE.activeIntervalMs, 15_000);
  const idleIntervalMs = seconds('SCOOTER_IDLE_INTERVAL_SECONDS', DEFAULT_SCHEDULE.idleIntervalMs, activeIntervalMs);
  return {
    activeIntervalMs, idleIntervalMs,
    watchMs: seconds('SCOOTER_WATCH_SECONDS', DEFAULT_SCHEDULE.watchMs, 60_000),
    retryMs: DEFAULT_SCHEDULE.retryMs,
    alwaysFastSources: alwaysFastSources(env.SCOOTER_ALWAYS_FAST ?? 'CH'),
    idleExpiryMs: Math.max(VEHICLE_MAX_AGE_MS, idleIntervalMs + EXPIRY_GRACE_MS),
  };
}

/**
 * The idle expiry of each feed collected less often on purpose, as GCOO's towns every hour: its own
 * interval plus the same ten minutes, read from the feed itself, so that a collector that sets an
 * interval cannot be told as stopped between two of its collections. A feed collected more often,
 * to replace data it may not keep (withRetentionCaps), is told as stopped no sooner than the others:
 * never before `idleExpiryMs`.
 */
export function ownIdleExpiries(feeds: readonly { id: string; idleIntervalMs?: number }[], idleExpiryMs = 0): (id: string) => number | undefined {
  const expiries = new Map(feeds.flatMap(feed => feed.idleIntervalMs
    ? [[feed.id, Math.max(idleExpiryMs, feed.idleIntervalMs + EXPIRY_GRACE_MS)] as const] : []));
  return id => expiries.get(id);
}

/** How long a host's feeds' data may be kept: Bird's GBFS Data License (b), which Spin's feeds link, and Bolt's GBFS licence 2(e). */
export const RETENTION_CAPS_MS: ReadonlyMap<string, number> = new Map([
  ['mds.bird.co', 15 * 60_000], ['gbfs.spin.pm', 15 * 60_000], ['mds.bolt.eu', 15 * 60_000],
]);
/**
 * A capped feed nobody looks at is collected this long before its data must go, which the collection
 * replaces. Its cap runs from its last_updated, which Bird's feeds gave 29 and 50 seconds old.
 */
const RETENTION_MARGIN_MS = 2 * 60_000;

/** How long each capped feed's data may be kept, by feed id, from the host it is read from. */
export function retentionCaps(feeds: readonly { id: string; host: string }[]): (id: string) => number | undefined {
  const caps = new Map(feeds.flatMap(feed => RETENTION_CAPS_MS.has(feed.host) ? [[feed.id, RETENTION_CAPS_MS.get(feed.host)!] as const] : []));
  return id => caps.get(id);
}

/**
 * Capped feeds collected, while nobody looks, two minutes before their data must go (every 13 minutes
 * rather than every `idleIntervalMs`), so that they are always on the map and in the city totals.
 */
export function withRetentionCaps<T extends { host: string; idleIntervalMs?: number }>(feeds: T[], idleIntervalMs: number): T[] {
  return feeds.map(feed => {
    const cap = RETENTION_CAPS_MS.get(feed.host);
    return cap ? { ...feed, idleIntervalMs: Math.min(feed.idleIntervalMs ?? idleIntervalMs, cap - RETENTION_MARGIN_MS) } : feed;
  });
}

/**
 * The record as it may still be kept at `at`: a capped feed's vehicles, and its parking, go once
 * older than its cap. Its times stay, so its state, and the alerts read from it, are those of its
 * collections (feedState): a feed that misses one is no sooner told as stopped.
 */
export function retained(feed: FeedSnapshot, at: number, capMs: number | undefined): FeedSnapshot {
  if (capMs === undefined) return feed;
  const vehicles = feed.vehicles.length > 0 && at - feed.observedAt > capMs;
  const parking = feed.parking && feed.parking.locations.length > 0 && at - feed.parking.observedAt > capMs;
  if (!vehicles && !parking) return feed;
  return { ...feed, ...(vehicles ? { vehicles: [] } : {}), ...(parking ? { parking: { ...feed.parking!, locations: [] } } : {}) };
}
