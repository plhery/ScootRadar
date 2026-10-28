import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';
import { reportError } from './errorReporting';
import { collectFromAppMap, mergeAppMap, readsSwissAppMap, withSwissAppMaps, type SwissAppMapState } from './swissAppMaps';

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
