import { COUNTRY_SOURCES, type RegionalSource } from '@/lib/regionalScooterSystems';

export type FeedSourceStatus = 'fresh' | 'stale' | 'partial' | 'failed' | 'skipped';

/** The sources a response reports on: the Swiss ones, then one per country. */
export type ScooterSource = 'national' | 'hopp' | 'publibike' | RegionalSource;

// Its own module so the Worker's snapshot proxy can answer outside coverage without the feed code.
export function skippedSources(): Record<ScooterSource, FeedSourceStatus> {
  return { national: 'skipped', hopp: 'skipped', publibike: 'skipped',
    ...Object.fromEntries(Object.values(COUNTRY_SOURCES).map(source => [source, 'skipped'])) } as Record<ScooterSource, FeedSourceStatus>;
}
