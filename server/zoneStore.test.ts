import { describe, expect, it, vi } from 'vitest';
import { answerZones, createZoneStore } from './zoneStore';
import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import type { StoredZone } from '../src/lib/zones';

const zone = (id: string, provider = 'dott'): StoredZone => ({ id, provider, kind: 'noRide',
  polygons: [[[[47.37, 8.54], [47.37, 8.5415], [47.371, 8.5415], [47.37, 8.54]]]],
  bounds: { south: 47.37, west: 8.54, north: 47.371, east: 8.5415 }, points: 4 });
const later = <T,>() => {
  let resolve!: (value: T) => void, reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
};

describe('zone store', () => {
  it('reads a feed\'s zones once while asked for, and again after an hour', async () => {
    let clock = 0;
    const load = vi.fn(async () => [zone('a:0')]);
    const store = createZoneStore({ now: () => clock });
    store.demand([{ id: 'a', load }]);
    store.demand([{ id: 'a', load }]);
    expect(store.pending(['a'])).toBe(true);
    await store.wait(['a'], 1000);
    expect(store.pending(['a'])).toBe(false);
    expect(store.zones(['a', 'b']).map(item => item.id)).toEqual(['a:0']);
    clock = 3599_000;
    store.demand([{ id: 'a', load }]);
    expect(load).toHaveBeenCalledOnce();
    clock = 3600_000;
    store.demand([{ id: 'a', load }]);
    // The zones read before are drawn while the new ones come.
    expect(store.pending(['a'])).toBe(false);
    await store.wait(['a'], 1000);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps the zones read before when a read fails, and tries again a minute later', async () => {
    let clock = 0;
    const onError = vi.fn();
    const load = vi.fn<() => Promise<StoredZone[]>>().mockResolvedValueOnce([zone('a:0')]).mockRejectedValue(new Error('HTTP 502'));
    const store = createZoneStore({ now: () => clock, onError });
    store.demand([{ id: 'a', load }]);
    await store.wait(['a'], 1000);
    clock = 3600_000;
    store.demand([{ id: 'a', load }]);
    await store.wait(['a'], 1000);
    expect(onError).toHaveBeenCalledWith('a', expect.any(Error));
    expect(store.zones(['a']).map(item => item.id)).toEqual(['a:0']);
    clock += 59_000;
    store.demand([{ id: 'a', load }]);
    expect(load).toHaveBeenCalledTimes(2);
    clock += 1000;
    store.demand([{ id: 'a', load }]);
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('stops waiting for a slow feed, and lets go of zones nobody asks for', async () => {
    let clock = 0;
    const slow = later<StoredZone[]>();
    const store = createZoneStore({ now: () => clock });
    store.demand([{ id: 'slow', load: () => slow.promise }, { id: 'quick', load: async () => [zone('quick:0')] }]);
    await store.wait(['slow', 'quick'], 10);
    expect(store.pending(['slow', 'quick'])).toBe(true);
    expect(store.zones(['quick'])).toHaveLength(1);
    slow.resolve([]);
    await store.wait(['slow'], 1000);
    clock = 6 * 3600_000 + 1;
    store.demand([]);
    expect(store.zones(['slow', 'quick'])).toEqual([]);
  });
});

describe('zones answer', () => {
  const source = { discoveryUrl: 'https://feeds.example/gbfs.json', baseUrl: 'https://feeds.example/' };
  const feed = (id: string, provider: string, zoneSource: typeof source | null = source) => ({
    id, provider, source: 'regional', host: 'feeds.example', collect: async () => ({ vehicles: [] }),
    coverage: [{ south: 47.3, west: 8.4, north: 47.45, east: 8.65 }], zoneSource: zoneSource ?? undefined,
  }) as unknown as CollectableScooterFeed;
  const query = { bounds: { south: 47.36, west: 8.53, north: 47.38, east: 8.55 }, minBattery: 0 };

  it('reads the zones of the feeds the view reaches, for the operators shown', async () => {
    const load = vi.fn(async (id: string, provider: string) => [zone(`${id}:0`, provider)]);
    const feeds = [feed('dott', 'dott'), feed('lime', 'lime'), feed('tier', 'tier', null),
      { ...feed('far', 'dott'), coverage: [{ south: 46, west: 7, north: 46.1, east: 7.1 }] }];
    const answer = await answerZones(createZoneStore(), feeds, { ...query, providers: new Set(['dott', 'tier']) }, 1000, load);
    expect(load.mock.calls.map(([id]) => id)).toEqual(['dott']);
    expect(answer).toMatchObject({ zones: [{ id: 'dott:0' }], meta: { pending: false, truncated: false } });
  });

  it('says it is pending while a feed it waited for is still being read', async () => {
    const slow = later<StoredZone[]>();
    const store = createZoneStore();
    const answer = await answerZones(store, [feed('dott', 'dott')], query, 5, () => slow.promise);
    expect(answer).toMatchObject({ zones: [], meta: { pending: true } });
    slow.resolve([zone('dott:0')]);
    expect(await answerZones(store, [feed('dott', 'dott')], query, 5, () => slow.promise))
      .toMatchObject({ zones: [{ id: 'dott:0' }], meta: { pending: false } });
  });
});
