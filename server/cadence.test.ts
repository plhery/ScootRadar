import { expect, it } from 'vitest';
import { COUNTRY_SOURCES, REGIONAL_SCOOTER_SYSTEMS, regionalSource } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';
import { withBinbinAppCollectors } from './binbinApp';
import { alwaysFastSources, cadenceFromEnv, ownIdleExpiries } from './cadence';
import { feedState, type FeedCadence } from './feedStateLog';
import { withGcooAppCollectors } from './gcooApp';
import { withLimeAppCollectors } from './limeApp';

it('collects Switzerland every minute by default, every other feed every 20 minutes and a watched one for 10', () => {
  expect(cadenceFromEnv({})).toEqual({ activeIntervalMs: 60_000, idleIntervalMs: 1_200_000, watchMs: 600_000,
    retryMs: 60_000, alwaysFastSources: new Set(['national', 'hopp', 'publibike']), idleExpiryMs: 1_800_000 });
});

it('reads countries and sources to collect every minute', () => {
  expect(alwaysFastSources('CH, fr,germany')).toEqual(new Set(['national', 'hopp', 'publibike', 'france', 'germany']));
  expect(alwaysFastSources('')).toEqual(new Set());
  expect(alwaysFastSources('all')).toEqual(new Set(['national', 'hopp', 'publibike', ...Object.values(COUNTRY_SOURCES)]));
  expect(() => alwaysFastSources('XX')).toThrow('SCOOTER_ALWAYS_FAST');
});

it('reads intervals in seconds and refuses nonsense', () => {
  const cadence = cadenceFromEnv({ SCOOTER_IDLE_INTERVAL_SECONDS: '600', SCOOTER_WATCH_SECONDS: '300', SCOOTER_ALWAYS_FAST: '' });
  expect(cadence).toMatchObject({ idleIntervalMs: 600_000, watchMs: 300_000, idleExpiryMs: 1_200_000 });
  expect(cadence.alwaysFastSources.size).toBe(0);
  expect(() => cadenceFromEnv({ SCOOTER_IDLE_INTERVAL_SECONDS: 'ten' })).toThrow('SCOOTER_IDLE_INTERVAL_SECONDS');
  expect(() => cadenceFromEnv({ SCOOTER_IDLE_INTERVAL_SECONDS: '30' })).toThrow('at least 60');
});

it('tells a feed collected less often on purpose, as a GCOO town every hour, as stopped only ten minutes after its interval', () => {
  const MINUTE = 60_000;
  const now = 1_800_000_000_000;
  // One town of each collector that sets its own interval, as the cache wraps them, and one feed of the default 20 minutes.
  const ids = ['gcooAppMap', 'limeAppMap', 'binbinAppArea'].map(flag => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(candidate => (candidate as unknown as Record<string, unknown>)[flag]);
    if (!system) throw new Error(`no ${flag} system`);
    return `${regionalSource(system)}:${system.id}`;
  });
  const bare = [...ids, 'germany:dott_de_bonn'].map(id => ({ id, host: id }) as CollectableScooterFeed);
  const feeds = withBinbinAppCollectors(withLimeAppCollectors(withGcooAppCollectors(bare, REGIONAL_SCOOTER_SYSTEMS),
    REGIONAL_SCOOTER_SYSTEMS), REGIONAL_SCOOTER_SYSTEMS, () => undefined);
  const cadence: FeedCadence = { fastSince: () => undefined, idleExpiryMs: 30 * MINUTE, idleExpiryMsForFeed: ownIdleExpiries(feeds) };
  const collected = (id: string, minutesAgo: number) => {
    const at = now - minutesAgo * MINUTE;
    return { id, observedAt: at, attemptedAt: at, collectedAt: at, failed: false } as FeedSnapshot;
  };
  for (const feed of feeds.filter(candidate => candidate.idleIntervalMs)) {
    const interval = feed.idleIntervalMs! / MINUTE;
    expect(feedState(collected(feed.id, interval + 1), now, cadence)).toBe('ok');
    expect(feedState(collected(feed.id, interval + 11), now, cadence)).toBe('expired');
  }
  expect(feeds.filter(feed => feed.idleIntervalMs).map(feed => feed.id)).toEqual(ids);
  expect(feedState(collected('germany:dott_de_bonn', 29), now, cadence)).toBe('ok');
  expect(feedState(collected('germany:dott_de_bonn', 31), now, cadence)).toBe('expired');
});
