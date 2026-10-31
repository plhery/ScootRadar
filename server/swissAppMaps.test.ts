import { afterEach, describe, expect, it, vi } from 'vitest';
import { VEHICLE_MAX_AGE_MS } from '../src/lib/dataFreshness';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';
import type { Vehicle } from '../src/lib/types';
import { reportError } from './errorReporting';
import { collectFromAppMap, LIME_STANDBY_INTERVAL_MS, mergeAppMap, readsSwissAppMap, standingDown, withLimeStandby, withSwissAppMaps,
  type SwissAppMapState } from './swissAppMaps';

vi.mock('./errorReporting', () => ({ reportError: vi.fn() }));
afterEach(() => { vi.mocked(reportError).mockClear(); vi.restoreAllMocks(); });

const chf = (minute: number) => ({ currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: minute });
// About 1.1 m of latitude per 0.00001°.
const scooter = (id: string, lat: number, lng: number, extra: Partial<Vehicle> = {}): Vehicle =>
  ({ provider: 'bolt', vehicle_id: `bolt_zurich:${id}`, lat, lng, battery: null, range_m: null, deep_link: null, distance_m: null, ...extra });
const official = (id: string, lat: number, lng: number, minute = 42) => scooter(id, lat, lng, { battery: 50, range_m: 20_000,
  deep_link: `https://bolt.eu/${id}`, rental_uris: { android: `https://bolt.eu/${id}`, ios: `https://bolt.eu/${id}`, web: null }, pricing: chf(minute) });

describe('mergeAppMap', () => {
  it('gives each rider-map scooter the price, range and links of the national one standing on it, keeping its own battery and id', () => {
    const app = [scooter('a', 47.37, 8.54, { battery: 81 }), scooter('b', 47.38, 8.55)];
    expect(mergeAppMap(app, [official('n1', 47.37003, 8.54), official('n2', 47.38, 8.55002, 48)])).toEqual([
      { ...official('n1', 47.37, 8.54), vehicle_id: 'bolt_zurich:a', battery: 81 },
      { ...official('n2', 47.38, 8.55, 48), vehicle_id: 'bolt_zurich:b' },
    ]);
  });

  it('pairs the nearest first, so scooters parked together keep their own', () => {
    const app = [scooter('a', 47.37, 8.54), scooter('b', 47.37005, 8.54)];
    const merged = mergeAppMap(app, [official('n2', 47.37005, 8.54), official('n1', 47.37, 8.54)]);
    expect(merged.map(vehicle => vehicle.deep_link)).toEqual(['https://bolt.eu/n1', 'https://bolt.eu/n2']);
  });

  it('leaves a scooter that has moved without range or links, priced as the nearest scooter that has not', () => {
    const app = [scooter('a', 47.37, 8.54), scooter('b', 47.49, 8.7), scooter('moved', 47.3712, 8.54), scooter('far', 47.5, 8.7)];
    const merged = mergeAppMap(app, [official('n1', 47.37, 8.54), official('n2', 47.49, 8.7, 48), official('gone', 47.3, 8.5)]);
    // 130 m from where "a" stands, and 1.1 km from "b".
    expect(merged[2]).toEqual(scooter('moved', 47.3712, 8.54, { pricing: chf(42) }));
    expect(merged[3]).toEqual(scooter('far', 47.5, 8.7, { pricing: chf(48) }));
  });

  it('keeps the rider map\'s scooters as they are without a national feed', () => {
    const app = [scooter('a', 47.37, 8.54, { battery: 12 })];
    expect(mergeAppMap(app, [])).toEqual(app);
  });
});

describe('collectFromAppMap', () => {
  const fresh = (): SwissAppMapState => ({ national: new Map(), failingSince: new Map() });
  const national = (vehicles: Vehicle[], observedAt = 1_000): SourceVehicles => ({ observedAt, stale: false, vehicles });
  const app = (vehicles: Vehicle[], observedAt = 9_000): SourceVehicles => ({ observedAt, stale: false, vehicles });

  it('serves the rider map\'s scooters at the time it saw them', async () => {
    const result = await collectFromAppMap('national:bolt_zurich', async () => national([official('n1', 47.37, 8.54)]),
      async () => app([scooter('a', 47.37, 8.54, { battery: 70 })]), { current: fresh() });
    expect(result).toEqual({ observedAt: 9_000, stale: false, vehicles: [{ ...official('n1', 47.37, 8.54), vehicle_id: 'bolt_zurich:a', battery: 70 }] });
  });

  it('serves the national feed while the rider map fails, and tells Sentry once it has failed ten minutes', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const current = fresh();
    let now = 0;
    const failing = async () => { throw new Error('Bolt map HTTP 503'); };
    const nationalResult = national([official('n1', 47.37, 8.54)]);
    await expect(collectFromAppMap('national:bolt_zurich', async () => nationalResult, failing, { current, now: () => now }))
      .resolves.toEqual(nationalResult);
    now = 10 * 60_000 - 1;
    await collectFromAppMap('national:bolt_zurich', async () => nationalResult, failing, { current, now: () => now });
    expect(reportError).not.toHaveBeenCalled();
    now = 10 * 60_000;
    await collectFromAppMap('national:bolt_zurich', async () => nationalResult, failing, { current, now: () => now });
    expect(reportError).toHaveBeenCalledWith('swiss-app-map:national:bolt_zurich', expect.any(Error));
    await expect(collectFromAppMap('national:bolt_zurich', async () => { throw new Error('sharedmobility.ch HTTP 502'); }, failing,
      { current, now: () => now })).rejects.toThrow('Bolt map HTTP 503');
    // The rider map back, its failures start again from nothing.
    await collectFromAppMap('national:bolt_zurich', async () => nationalResult, async () => app([]), { current, now: () => now });
    expect(current.failingSince.size).toBe(0);
  });

  it('gives the rider map\'s scooters the attributes the national feed gave last while it fails or is late', async () => {
    const current = fresh();
    const rider = async () => app([scooter('a', 47.37, 8.54)]);
    await collectFromAppMap('national:bolt_zurich', async () => national([official('n1', 47.37, 8.54)]), rider, { current });
    const failed = await collectFromAppMap('national:bolt_zurich', async () => { throw new Error('HTTP 502'); }, rider, { current });
    expect(failed.vehicles[0].deep_link).toBe('https://bolt.eu/n1');
    const late = await collectFromAppMap('national:bolt_zurich', () => new Promise<SourceVehicles>(() => undefined), rider,
      { current, graceMs: 10 });
    expect(late.vehicles[0].deep_link).toBe('https://bolt.eu/n1');
  });
});

describe('withSwissAppMaps', () => {
  const feed = (id: string, provider: CollectableScooterFeed['provider'], source: CollectableScooterFeed['source'] = 'national') =>
    ({ id, provider, source, coverage: [], host: 'sharedmobility.ch', collect: async () => ({ stale: false, vehicles: [] }) }) as CollectableScooterFeed;

  it('reads Bolt\'s, Voi\'s and Dott\'s Swiss national feeds from their rider maps, and leaves the others', () => {
    const feeds = [feed('national:bolt_zurich', 'bolt'), feed('national:voiscooters.com', 'voi'), feed('national:dott_rorschach', 'dott'),
      feed('national:lime_zurich', 'lime'), feed('national:bolt_winterthur', 'bolt'), feed('germany:dott_zurich', 'dott', 'germany')];
    const wrapped = withSwissAppMaps(feeds);
    expect(wrapped.map(definition => definition.host)).toEqual(['user.live.boltsvc.net', 'api.voiapp.io', 'rider.api.ridedott.com',
      'sharedmobility.ch', 'sharedmobility.ch', 'sharedmobility.ch']);
    expect(wrapped.slice(3)).toEqual(feeds.slice(3));
    expect(feeds.map(readsSwissAppMap)).toEqual([true, true, true, false, false, false]);
  });
});

describe('withLimeStandby', () => {
  const now = 1_800_000_000_000;
  const seen = (id: string) => scooter(id, 47.37, 8.54, { provider: 'lime' });
  const record = (changes: Partial<FeedSnapshot>): FeedSnapshot => ({ id: 'national:lime_zurich', source: 'national', provider: 'lime',
    coverage: [], vehicles: [seen('n')], observedAt: now - 60_000, attemptedAt: now - 60_000, stale: false, failed: false, skipped: false, ...changes });
  const group = (id: string, collect = vi.fn(async (): Promise<SourceVehicles> => ({ vehicles: [seen('a')], stale: false }))) =>
    ({ id, source: 'switzerland', provider: 'lime', host: 'web-production.lime.bike', idleIntervalMs: 259_200_000, collect } as unknown as CollectableScooterFeed);
  const standing = (national: FeedSnapshot | undefined, id = 'switzerland:lime_ch_app_zurich_004') => {
    const feed = group(id);
    return { read: feed.collect, feed: withLimeStandby([feed], wanted => wanted === 'national:lime_zurich' ? national : undefined, () => now)[0] };
  };

  it('asks Lime for nothing while the national feed serves', async () => {
    const { feed, read } = standing(record({}));
    await expect(feed.collect()).resolves.toEqual({ vehicles: [], stale: false, skipped: true });
    expect(read).not.toHaveBeenCalled();
  });

  it.each<[string, FeedSnapshot | undefined]>([
    ['has been dropped from the registry', undefined],
    ['is failing with positions past the age limit', record({ failed: true, observedAt: now - VEHICLE_MAX_AGE_MS - 1 })],
    ['answers with the same old positions', record({ observedAt: now - VEHICLE_MAX_AGE_MS - 1 })],
    ['lists no scooter', record({ vehicles: [] })],
    ['is skipped', record({ skipped: true })],
  ])('reads the rider map when the national feed %s', async (_, national) => {
    const { feed, read } = standing(national);
    await expect(feed.collect()).resolves.toEqual({ vehicles: [seen('a')], stale: false });
    expect(read).toHaveBeenCalledOnce();
  });

  it('keeps reading the national feed for a moment of failure, within the age limit', async () => {
    const { feed, read } = standing(record({ failed: true, observedAt: now - VEHICLE_MAX_AGE_MS }));
    await expect(feed.collect()).resolves.toMatchObject({ skipped: true });
    expect(read).not.toHaveBeenCalled();
  });

  it('reads the market every half hour rather than every three days, and leaves other Lime markets alone', () => {
    expect(standing(undefined).feed.idleIntervalMs).toBe(LIME_STANDBY_INTERVAL_MS);
    const kloten = group('switzerland:lime_ch_app_kloten_000');
    expect(withLimeStandby([kloten], () => undefined)[0]).toBe(kloten);
  });

  describe('standingDown', () => {
    const groupRecord = (changes: Partial<FeedSnapshot> = {}) => record({ id: 'switzerland:lime_ch_app_zurich_004', source: 'switzerland' as FeedSnapshot['source'], ...changes });

    it('empties a standby group once its national feed serves, so nothing counts twice', () => {
      const sweep = { startedAt: now - 1_000, vehicles: [seen('a')], swept: [] };
      expect(standingDown(groupRecord({ sweep }), () => record({}), now)).toEqual({ ...groupRecord(), vehicles: [], sweep: undefined, skipped: true });
    });

    it('leaves it while the national feed serves nothing, and any other feed', () => {
      const up = groupRecord();
      expect(standingDown(up, () => record({ observedAt: now - VEHICLE_MAX_AGE_MS - 1 }), now)).toBe(up);
      expect(standingDown(up, () => undefined, now)).toBe(up);
      const kloten = groupRecord({ id: 'switzerland:lime_ch_app_kloten_000' });
      expect(standingDown(kloten, () => record({}), now)).toBe(kloten);
    });
  });
});
