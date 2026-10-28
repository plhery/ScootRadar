import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COUNTRY_SOURCES, REGIONAL_SCOOTER_SYSTEMS, regionalSource } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { buildCityOverview, joinCityOverviews, refreshedOverview, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { withBinbinAppCollectors } from './binbinApp';
import { withBirdAppCollectors } from './birdApp';
import { alwaysFastSources, cadenceFromEnv, ownIdleExpiries, retained, retentionCaps, withRetentionCaps } from './cadence';
import { feedState, type FeedCadence } from './feedStateLog';
import { withGcooAppCollectors } from './gcooApp';
import { withLimeAppCollectors } from './limeApp';
import { readSnapshot, writeSnapshot } from './snapshotFile';

it('collects Switzerland every minute by default, every other feed every 20 minutes and a watched one for 10', () => {
  expect(cadenceFromEnv({})).toEqual({ activeIntervalMs: 60_000, idleIntervalMs: 1_200_000, watchMs: 600_000,
    retryMs: 60_000, alwaysFastSources: new Set(['national', 'hopp', 'publibike']), idleExpiryMs: 1_800_000 });
});

it('reads countries and sources to collect every minute', () => {
  expect(alwaysFastSources('CH, fr,germany')).toEqual(new Set(['national', 'hopp', 'publibike', 'france', 'germany']));
  // Switzerland's open data, but not its catalog's Lime map, which keeps Lime's pace.
  expect(alwaysFastSources('CH').has(COUNTRY_SOURCES.CH)).toBe(false);
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

it('tells a feed collected less often on purpose, as a GCOO town every hour or a Bird area once a day, as stopped only ten minutes after its interval', () => {
  const MINUTE = 60_000;
  const now = 1_800_000_000_000;
  // One town of each collector that sets its own interval, as the cache wraps them, and one feed of the default 20 minutes.
  const ids = ['gcooAppMap', 'limeAppMap', 'binbinAppArea', 'birdAppArea'].map(flag => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(candidate => (candidate as unknown as Record<string, unknown>)[flag]);
    if (!system) throw new Error(`no ${flag} system`);
    return `${regionalSource(system)}:${system.id}`;
  });
  const bare = [...ids, 'germany:dott_de_bonn'].map(id => ({ id, host: id }) as CollectableScooterFeed);
  const feeds = withBirdAppCollectors(withBinbinAppCollectors(withLimeAppCollectors(withGcooAppCollectors(bare, REGIONAL_SCOOTER_SYSTEMS),
    REGIONAL_SCOOTER_SYSTEMS), REGIONAL_SCOOTER_SYSTEMS, () => undefined), REGIONAL_SCOOTER_SYSTEMS, () => undefined);
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

describe('the feeds whose data may be kept 15 minutes', () => {
  const MINUTE = 60_000;
  const now = 1_800_000_000_000;
  const definitions: { id: string; host: string; provider: string; idleIntervalMs?: number }[] = REGIONAL_SCOOTER_SYSTEMS
    .map(system => ({ id: `${regionalSource(system)}:${system.id}`, host: new URL(system.discoveryUrl).hostname, provider: system.provider }));
  const feeds = withRetentionCaps(definitions, 20 * MINUTE);
  const cap = retentionCaps(feeds);
  const collected = (id: string, minutesAgo: number) => {
    const at = now - minutesAgo * MINUTE;
    const vehicles = [{ provider: 'bird', vehicle_id: `${id}:1`, lat: 48.85, lng: 2.35, battery: 80, range_m: null,
      distance_m: null, deep_link: null }];
    return { id, source: 'france', provider: 'bird', coverage: [], vehicles, observedAt: at, attemptedAt: at, collectedAt: at,
      stale: false, failed: false, skipped: false,
      parking: { locations: [{ id: 'p1', provider: 'bird', name: 'Rivoli', lat: 48.86, lng: 2.34, mandatory: false }],
        observedAt: at, stale: false } } as unknown as FeedSnapshot;
  };

  it("are Bird's, Spin's and Bolt's own, collected every 13 minutes while idle; the others every 20", () => {
    const capped = feeds.filter(feed => cap(feed.id) !== undefined);
    expect(capped).toHaveLength(90);
    expect(new Set(capped.map(feed => feed.host))).toEqual(new Set(['mds.bird.co', 'gbfs.spin.pm', 'mds.bolt.eu']));
    expect(new Set(capped.map(feed => feed.idleIntervalMs))).toEqual(new Set([13 * MINUTE]));
    expect(capped.every(feed => cap(feed.id) === 15 * MINUTE)).toBe(true);
    // Bolt read through MobiData BW or Entur, and every other feed, keep the default 20 minutes.
    const others = feeds.filter(feed => cap(feed.id) === undefined);
    expect(others.some(feed => feed.provider === 'bolt')).toBe(true);
    expect(others.every(feed => feed.idleIntervalMs === undefined)).toBe(true);
    // A capped feed with an interval of its own longer than 13 minutes is collected every 13 too.
    expect(withRetentionCaps([{ id: 'x', host: 'mds.bird.co', idleIntervalMs: 60 * MINUTE }], 20 * MINUTE)[0].idleIntervalMs)
      .toBe(13 * MINUTE);
  });

  it('tells a capped feed as stopped no sooner than the others, after 30 minutes', () => {
    const cadence: FeedCadence = { fastSince: () => undefined, idleExpiryMs: 30 * MINUTE,
      idleExpiryMsForFeed: ownIdleExpiries(feeds, 30 * MINUTE) };
    for (const id of ['france:bird_fr_agen', 'germany:dott_de_bonn']) {
      expect(feedState(collected(id, 25), now, cadence)).toBe('ok');
      expect(feedState(collected(id, 29), now, cadence)).toBe('ok');
      expect(feedState(collected(id, 31), now, cadence)).toBe('expired');
    }
    // Its data dropped after 15 minutes, its state is that of its collections still.
    const dropped = retained(collected('france:bird_fr_agen', 16), now, cap('france:bird_fr_agen'));
    expect(dropped.vehicles).toEqual([]);
    expect(feedState(dropped, now, cadence)).toBe('ok');
  });

  it("drops a capped feed's vehicles and parking once 15 minutes old, and keeps the others' to 30", () => {
    const bird = 'france:bird_fr_agen';
    expect(retained(collected(bird, 15), now, cap(bird))).toEqual(collected(bird, 15));
    const old = collected(bird, 15.01);
    const kept = retained(old, now, cap(bird));
    expect(kept.vehicles).toEqual([]);
    expect(kept.parking?.locations).toEqual([]);
    expect({ ...kept, vehicles: old.vehicles, parking: old.parking }).toEqual(old);
    // Parking observed later than the vehicles stays while it may.
    const parked = { ...old, parking: { ...old.parking!, observedAt: now - 5 * MINUTE } };
    expect(retained(parked, now, cap(bird)).parking).toEqual(parked.parking);
    const dott = collected('germany:dott_de_bonn', 29);
    expect(retained(dott, now, cap(dott.id))).toBe(dott);
    // Nothing to drop: the same record, which the cache does not publish again.
    expect(retained(kept, now, cap(bird))).toBe(kept);
  });

  // A feed of a system, with a scooter at its middle, observed at `observedAt`.
  const systemFeed = (system: (typeof REGIONAL_SCOOTER_SYSTEMS)[number], observedAt: number, failed = false): FeedSnapshot => {
    const id = `${regionalSource(system)}:${system.id}`;
    const lat = (system.bounds.south + system.bounds.north) / 2;
    const lng = (system.bounds.west + system.bounds.east) / 2;
    return { id, source: regionalSource(system), provider: system.provider, coverage: [system.bounds], observedAt,
      attemptedAt: observedAt, collectedAt: observedAt, stale: false, failed, skipped: false,
      vehicles: failed ? [] : [{ provider: system.provider, vehicle_id: `${id}:${observedAt}`, lat, lng, battery: 50,
        range_m: null, distance_m: null, deep_link: null }] } as FeedSnapshot;
  };
  const birdCount = (overview: MobilitySnapshot['overview']) =>
    overview.cities.reduce((total, city) => total + (city.batteries.bird ?? []).reduce((a, b) => a + (b ?? 0), 0), 0);

  it('builds the city totals of the capped feeds and the others apart as they would be together', () => {
    const counts = () => true;
    const all = REGIONAL_SCOOTER_SYSTEMS.map((system, index) => systemFeed(system, now - (index % 20) * 30_000, index % 7 === 3));
    const capped = all.filter(feed => cap(feed.id) !== undefined);
    expect(capped).toHaveLength(90);
    expect(capped.some(feed => feed.failed) && all.some(feed => feed.failed && cap(feed.id) === undefined)).toBe(true);
    const together = buildCityOverview(all, now, counts, cap);
    const apart = joinCityOverviews(buildCityOverview(all.filter(feed => cap(feed.id) === undefined), now, counts, cap),
      buildCityOverview(capped, now, counts, cap));
    // The same totals, but for the order of the feeds listed.
    const sorted = (overview: MobilitySnapshot['overview']) => ({ ...overview, feedIds: [...overview.feedIds].sort(),
      cities: overview.cities.map(city => ({ ...city, failedSources: [...city.failedSources].sort() })) });
    expect(sorted(apart)).toEqual(sorted(together));
    expect(together.keepUntil).toBe(Math.min(...capped.filter(feed => !feed.failed).map(feed => feed.observedAt)) + 15 * MINUTE);
    expect(buildCityOverview(all, now, counts).keepUntil).toBeUndefined();
  }, 15_000);

  it('rebuilds the capped feeds\' city totals within 14 minutes, before the data they count is 15 minutes old', () => {
    const TICK = 5_000;
    const counts = () => true;
    const bird = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'bird_fr_agen')!;
    const lyon = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'dott_fr_lyon')!;
    const definitions = [bird, lyon].map(system => ({ id: `france:${system.id}`, host: new URL(system.discoveryUrl).hostname,
      system, idleIntervalMs: undefined as number | undefined }));
    const intervals = new Map(withRetentionCaps(definitions, 20 * MINUTE).map(feed => [feed.system, feed.idleIntervalMs ?? 20 * MINUTE]));
    expect([...intervals.values()]).toEqual([13 * MINUTE, 20 * MINUTE]);
    let records: FeedSnapshot[] = [];
    let base: MobilitySnapshot['overview'] | undefined;
    let capped: MobilitySnapshot['overview'] | undefined;
    const builds = { base: 0, capped: 0 };
    const gaps: number[] = [];
    let overview: MobilitySnapshot['overview'] | undefined;
    for (let at = now; at <= now + 3 * 3_600_000; at += TICK) {
      // Each feed collected on its interval, its data last updated 40 seconds before.
      records = [bird, lyon].map((system, index) => (at - now) % intervals.get(system)! === 0
        ? systemFeed(system, at - 40_000) : records[index]);
      // As the cache's tick: the data that would pass its cap before the next goes, then the totals are checked.
      records = records.map(feed => retained(feed, at + TICK, cap(feed.id)));
      const nextBase = refreshedOverview(base, records.filter(feed => !cap(feed.id)), at, counts, cap, TICK);
      const nextCapped = refreshedOverview(capped, records.filter(feed => cap(feed.id)), at, counts, cap, TICK);
      if (nextBase !== base) builds.base++;
      if (nextCapped !== capped) {
        builds.capped++;
        if (capped) gaps.push(at - capped.generatedAt);
        overview = joinCityOverviews(nextBase, nextCapped);
      } else if (nextBase !== base) overview = joinCityOverviews(nextBase, nextCapped);
      base = nextBase;
      capped = nextCapped;
      // Never standing for Bird's data once past its cap, nor without Bird's scooters.
      expect(overview!.keepUntil).toBeGreaterThan(at + TICK);
      expect(birdCount(overview!)).toBe(1);
    }
    // The others' totals are rebuilt hourly, as they were. The capped feeds' are rebuilt every 13 minutes,
    // as each collection brings data that replaces what they count; the first after one built as the data
    // came in a little later, 15 minutes after the data's last_updated and a tick before.
    expect(builds.base).toBe(4);
    expect(gaps).toEqual([15 * MINUTE - 40_000 - TICK, ...Array(12).fill(13 * MINUTE)]);
  }, 15_000);

  it('loads a saved capped feed older than 15 minutes with no vehicles', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'scootradar-cap-'));
    try {
      const path = join(directory, 'scooters.json');
      const saved = [collected('france:bird_fr_agen', 16), collected('us:spin_us_akron', 10), collected('germany:dott_de_bonn', 16)];
      await writeSnapshot(path, { version: 1, updatedAt: now, feeds: saved,
        overview: { generatedAt: now, feedIds: [], cities: [] } });
      const loaded = (await readSnapshot(path))!.feeds.map(feed => retained(feed, now, cap(feed.id)));
      // Bird's 16 minutes old goes; Spin's 10 minutes old stays, as does Dott's, which has no cap.
      expect(saved.map(feed => cap(feed.id))).toEqual([15 * MINUTE, 15 * MINUTE, undefined]);
      expect(loaded.map(feed => feed.vehicles.length)).toEqual([0, 1, 1]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
