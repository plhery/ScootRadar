import { COUNTRY_SOURCES } from '../src/lib/regionalScooterSystems';
import { VEHICLE_MAX_AGE_MS } from '../src/lib/dataFreshness';
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
 * interval cannot be told as stopped between two of its collections.
 */
export function ownIdleExpiries(feeds: readonly { id: string; idleIntervalMs?: number }[]): (id: string) => number | undefined {
  const expiries = new Map(feeds.flatMap(feed => feed.idleIntervalMs ? [[feed.id, feed.idleIntervalMs + EXPIRY_GRACE_MS] as const] : []));
  return id => expiries.get(id);
}
