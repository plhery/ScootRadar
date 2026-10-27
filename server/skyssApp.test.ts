import { describe, expect, it, vi } from 'vitest';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { MapBounds } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import {
  collectSkyssRegion, collectSkyssScooters, parseSkyssService, parseSkyssView, SkyssClient, skyssTiles, withSkyssAppCollectors,
  type SkyssScooter,
} from './skyssApp';

const now = Date.parse('2026-10-27T22:30:00Z');
const row = (id: string, lat = 60.39, lon = 5.32, changes: Record<string, unknown> = {}) =>
  ({ __typename: 'VehicleDetailsLite', id, vendor: 'RYDE', lat, lon, type: 'ESCOOTER', ...changes });
const map = (rows: unknown[]) => ({ data: { nearbyVehicles_v4: rows } });
const services = (...list: Record<string, unknown>[]) => ({ data: { mobilityServices_v2: [{ services: list }] } });
const ryde = (status = 'NORMAL_SERVICE') => ({ zone: 'BERGEN', vendor: 'RYDE', type: 'ESCOOTER', status });
const box = { south: 60.38, north: 60.4, west: 5.3, east: 5.34 };
const region: RegionalScooterSystem = { id: 'ryde_no_test', provider: 'ryde', country: 'NO', city: 'Bergen', center: [60.39, 5.32],
  bounds: box, discoveryUrl: 'https://cosmo-router.transhub.io/graphql', skyssAppZone: 'BERGEN' };
const view = (scooters: SkyssScooter[] = [], full = false) => ({ scooters, full, at: now });

describe('Skyss map', () => {
  it("reads Ryde's service status in the zone, and fails where Skyss lists none", () => {
    const listed = services({ zone: 'BERGEN', vendor: 'VOI', type: 'ESCOOTER', status: 'NORMAL_SERVICE' },
      { zone: 'BERGEN', vendor: 'RYDE', type: 'CITYBIKE', status: 'NORMAL_SERVICE' }, ryde('LIMITED_SERVICE'));
    expect(parseSkyssService(listed, 'BERGEN')).toBe('LIMITED_SERVICE');
    expect(() => parseSkyssService(listed, 'OSLO')).toThrow('Skyss lists no Ryde scooters in OSLO');
    for (const bad of [{ data: { mobilityServices_v2: null } }, { data: { mobilityServices_v2: [{}] } },
      { ...services(ryde()), errors: [{ message: 'Not authorized' }] }, { errors: [] }]) {
      expect(() => parseSkyssService(bad, 'BERGEN')).toThrow('Invalid Skyss');
    }
  });

  it('keeps the scooters inside the box, and calls a box of 500 rows full', () => {
    expect(parseSkyssView(map([row('864312089773158'), row('868159058248415', 60.41)]), box)).toEqual({
      scooters: [{ id: '864312089773158', lat: 60.39, lng: 5.32 }], full: false });
    const rows = Array.from({ length: 500 }, (_, index) => row(String(100_000 + index), index ? 60.39 : 60.5));
    const full = parseSkyssView(map(rows), box);
    expect(full.full).toBe(true);
    expect(full.scooters).toHaveLength(499);
    expect(parseSkyssView(map([]), box)).toEqual({ scooters: [], full: false });
  });

  it('rejects an error, another vendor or type, or a broken row instead of reading part of the map', () => {
    for (const bad of [{ ...map([row('1')]), errors: [{ message: 'BAD_USER_INPUT' }] }, { data: {} }, map([null]),
      map([row('1', 60.39, 5.32, { vendor: 'VOI' })]), map([row('1', 60.39, 5.32, { type: 'EBIKE' })]),
      map([row('1', 60.39, 5.32, { __typename: 'Station' })]), map([row('', 60.39)]), map([row('1', NaN)]),
      map([row('1', 60.39, 5.32, { id: 864312089773158 })])]) {
      expect(() => parseSkyssView(bad, box)).toThrow('Invalid Skyss');
    }
  });
});

describe('Skyss collection', () => {
  it('cuts the bounds into tiles, and quarters a full box until none is', async () => {
    expect(skyssTiles({ south: 60.275, north: 60.495, west: 5.165, east: 5.405 })).toHaveLength(6);
    const read: MapBounds[] = [];
    const api = { view: vi.fn(async (part: MapBounds) => {
      read.push(part);
      // The tile is full, and so is its first quarter; their other parts list one scooter each.
      return view([{ id: String(read.length), lat: part.south, lng: part.west }], read.length <= 2);
    }) };
    const done: MapBounds[] = [];
    const result = await collectSkyssScooters(box, api, { found: new Map(), done: part => done.push(part) });
    // The tile, its four quarters, and the four quarters of the first.
    expect(read).toHaveLength(9);
    expect(done).toHaveLength(7);
    expect(result).toMatchObject({ observedAt: now, requests: 9 });
    expect(result.scooters).toHaveLength(9);
    // The first quarter's own first quarter, a sixteenth of the tile.
    expect(read[5].south).toBe(box.south);
    expect(read[5].west).toBe(box.west);
    expect(read[5].north).toBeCloseTo(60.385, 9);
    expect(read[5].east).toBeCloseTo(5.31, 9);
  });

  it('fails rather than leave a full box unread or exceed the budget', async () => {
    // The south-west quarter is full at every depth.
    const full = { view: async (part: MapBounds) => view([], part.south === box.south && part.west === box.west) };
    await expect(collectSkyssScooters(box, full)).rejects.toThrow('still full');
    const wide = { south: 58, north: 62, west: 4, east: 12 };
    await expect(collectSkyssScooters(wide, { view: async () => view() })).rejects.toThrow('collection budget');
  });

  it("publishes Ryde's scooters in the region under ids of their own, and skips a sweep Skyss says is pointless", async () => {
    const api = { service: vi.fn(async () => ({ at: now - 1_000, status: 'NORMAL_SERVICE' })),
      view: vi.fn(async () => view([{ id: '864312089773158', lat: 60.39, lng: 5.32 }, { id: '868159058248415', lat: 60.39, lng: 5.29 }])) };
    const snapshot = await collectSkyssRegion(region, api);
    expect(api.service).toHaveBeenCalledWith('BERGEN');
    expect(snapshot).toMatchObject({ observedAt: now - 1_000, stale: false });
    expect(snapshot.vehicles).toEqual([{ provider: 'ryde', vehicle_id: expect.stringMatching(/^skyss:[\w-]{16}$/), lat: 60.39, lng: 5.32,
      battery: null, range_m: null, deep_link: null, distance_m: null, rental_uris: { ios: 'https://new-web-platform.ryde.vip/app/ios.html',
        android: 'https://new-web-platform.ryde.vip/app/android.html', web: null } }]);
    // The IMEI is never published, and the same scooter keeps its id from one round to the next.
    expect(JSON.stringify(snapshot)).not.toContain('864312089773158');
    expect((await collectSkyssRegion(region, api)).vehicles[0].vehicle_id).toBe(snapshot.vehicles[0].vehicle_id);

    api.service.mockResolvedValueOnce({ at: now, status: 'TEMPORARILY_UNAVAILABLE' });
    api.view.mockClear();
    expect(await collectSkyssRegion(region, api)).toEqual({ observedAt: now, stale: false, vehicles: [] });
    expect(api.view).not.toHaveBeenCalled();
    await expect(collectSkyssRegion({ ...region, skyssAppZone: undefined }, api)).rejects.toThrow('Not a Skyss');
  });

  it("wires Bergen's Ryde system as a paced app map without GBFS discovery", () => {
    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.skyssAppZone);
    expect(systems.map(system => [system.id, system.provider, system.skyssAppZone])).toEqual([['ryde_no_app_bergen', 'ryde', 'BERGEN']]);
    expect(isAppMapSystem(systems[0])).toBe(true);
    const feeds = independentCollectableFeeds();
    const feed = withSkyssAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS).find(f => f.id === 'norway:ryde_no_app_bergen')!;
    expect(feed).toMatchObject({ provider: 'ryde', host: 'cosmo-router.transhub.io', idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, paced: true });
    expect(feed.zoneSource).toBeUndefined();
    expect(feed.collect).not.toBe(feeds.find(f => f.id === feed.id)!.collect);
  });
});

describe('Skyss client', () => {
  it("asks as Skyss's app does, signed out, for Ryde's scooters between the box's corners", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(map([row('864312089773158')])));
    const client = new SkyssClient({ fetch, now: () => now, intervalMs: 0, timeoutMs: 25 });
    expect(await client.view(box)).toEqual({ at: now, scooters: [{ id: '864312089773158', lat: 60.39, lng: 5.32 }], full: false });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://cosmo-router.transhub.io/graphql');
    expect(init).toMatchObject({ method: 'POST', redirect: 'error', headers: { 'client-platform': 'android', 'client-version': '7.102.0',
      'owner-id': 'SKYSS', 'Content-Type': 'application/json' } });
    expect(init!.headers).not.toHaveProperty('Authorization');
    const body = JSON.parse(String(init!.body));
    expect(body.operationName).toBe('nearbyEVehicles');
    expect(body.variables).toEqual({ northWest: { latitude: 60.4, longitude: 5.3 }, southEast: { latitude: 60.38, longitude: 5.34 },
      vendors: ['RYDE'], rentalProductTypes: ['ESCOOTER'] });
  });

  it('backs off after a 429 and bounds and sanitizes bodies', async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    const client = new SkyssClient({ fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    await expect(client.view(box)).rejects.toThrow('Skyss map HTTP 429');
    clock += 60_000;
    await expect(client.service('BERGEN')).rejects.toThrow('rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    clock += 60_000;
    fetch.mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(client.view(box)).rejects.toThrow('Skyss map HTTP 403');
    fetch.mockResolvedValueOnce(new Response('<html>'));
    await expect(client.view(box)).rejects.toThrow('Skyss returned invalid JSON');
    fetch.mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); controller.close();
    } })));
    await expect(client.view(box)).rejects.toThrow('Skyss response exceeds the size limit');
    fetch.mockRejectedValueOnce(new Error('socket hang up'));
    await expect(client.view(box)).rejects.toThrow('Skyss request failed or timed out');
  });
});
