import { describe, expect, it, vi } from 'vitest';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { MapBounds } from '../src/lib/types';
import {
  collectGcooRegion, collectGcooScooters, GcooClient, gcooTiles, parseGcooMarkers, withGcooAppCollectors, type GcooMarkers,
} from './gcooApp';

const now = Date.parse('2026-10-24T03:00:00Z');
const scooter = (id: number, changes: Record<string, unknown> = {}) => ({ id, lat: 36.35, lng: 127.38, battery: 81,
  gcooter_status: 'IDLE', is_activated: true, model_info: { id: 19, type: 'scooter' },
  movable_distance_info: { value: 24.5, unit: 'km' }, ...changes });
const cluster = (lat: number, lng: number) => ({ lat, lng, count: 12, model_info: { type: 'cluster' } });
const payload = (list: unknown[]) => ({ result_code: 0, response: { list } });
// One tile of the grid, in Gwangju, and bounds just inside it: in floating point, the tile's
// own south edge falls in the row below.
const tile = gcooTiles({ south: 35.16, north: 35.161, west: 126.85, east: 126.851 })[0];
const inside = { south: tile.south + 1e-9, north: tile.north - 1e-9, west: tile.west + 1e-9, east: tile.east - 1e-9 };
const region: RegionalScooterSystem = { id: 'gcoo_kr_test', provider: 'gcoo', country: 'KR', city: 'Gwangju', center: [35.16, 126.85],
  bounds: tile, discoveryUrl: 'https://live.api.gbike-api.com/api/v1/locations/markers', gcooAppMap: true };
const markers = (vehicles: GcooMarkers['vehicles'] = [], clusters: GcooMarkers['clusters'] = []) => ({ vehicles, clusters, at: now });

describe('GCOO markers', () => {
  it('keeps idle, activated scooters with their battery and range, and the clusters', () => {
    const parsed = parseGcooMarkers(payload([scooter(1), scooter(2, { gcooter_status: 'RIDING' }),
      scooter(3, { is_activated: false }), scooter(4, { model_info: { id: 10006, type: 'bike' } }),
      scooter(5, { battery: 101, movable_distance_info: { value: 3, unit: 'mi' } }),
      { id: 6, lat: 36.35, lng: 127.38, type: 'parking' }, cluster(36.36, 127.39)]));
    expect(parsed.vehicles).toEqual([
      { id: 1, lat: 36.35, lng: 127.38, battery: 81, range_m: 24_500 },
      { id: 5, lat: 36.35, lng: 127.38, battery: null, range_m: null },
    ]);
    expect(parsed.clusters).toEqual([{ lat: 36.36, lng: 127.39 }]);
  });

  it('rejects an error, a broken marker or a cluster without a count instead of reading an empty map', () => {
    for (const bad of [{ result_code: 401, response: { list: [] } }, { result_code: 0 }, payload([null]),
      payload([scooter(1, { lat: NaN })]), payload([scooter(1.5)]), payload([{ ...cluster(36, 127), count: 0 }])]) {
      expect(() => parseGcooMarkers(bad)).toThrow('Invalid GCOO');
    }
    expect(parseGcooMarkers(payload([]))).toEqual({ vehicles: [], clusters: [] });
  });
});

describe('GCOO collection', () => {
  it('reads each tile, then the quarters near its clusters, halved while clusters remain', async () => {
    const read: MapBounds[] = [];
    const centre = (box: MapBounds) => ({ lat: (box.south + box.north) / 2, lng: (box.west + box.east) / 2 });
    const api = { markers: vi.fn(async (box: MapBounds) => {
      read.push(box);
      // The tile clusters at its centre, where four of its sixteen quarters meet; the first of
      // those clusters again at its own centre, and its halves don't.
      if (read.length <= 2) return markers([], [centre(box)]);
      return markers([{ id: read.length, lat: box.south, lng: box.west, battery: 50, range_m: null }]);
    }) };
    const result = await collectGcooScooters(inside, api);
    // The tile, the first quarter and its four halves, and the three other quarters.
    expect(read).toHaveLength(9);
    expect(result).toMatchObject({ observedAt: now, requests: 9 });
    expect(result.scooters).toHaveLength(7);
  });

  it('fails rather than leave clusters unread or exceed the budget', async () => {
    const clustered = { markers: vi.fn(async (box: MapBounds) => markers([], [{ lat: box.south, lng: box.west }])) };
    await expect(collectGcooScooters(tile, clustered)).rejects.toThrow('still clusters');
    const wide = { south: 33, north: 38.6, west: 124.6, east: 131 };
    await expect(collectGcooScooters(wide, { markers: async () => markers() })).rejects.toThrow('collection budget');
  });

  it('gives scooters operator ids, within the region, and wires every GCOO catalog system without GBFS discovery', async () => {
    const api = { markers: vi.fn(async () => markers([{ id: 7, lat: 35.16, lng: 126.85, battery: 50, range_m: 9000 },
      { id: 8, lat: 36.35, lng: 126.85, battery: 50, range_m: null }])) };
    const snapshot = await collectGcooRegion(region, api);
    expect(snapshot).toEqual({ observedAt: now, stale: false, vehicles: [{ provider: 'gcoo', vehicle_id: 'gcoo:7', lat: 35.16,
      lng: 126.85, battery: 50, range_m: 9000, deep_link: null, distance_m: null }] });
    await expect(collectGcooRegion({ ...region, gcooAppMap: undefined }, api)).rejects.toThrow('Not a GCOO');

    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.gcooAppMap);
    expect(systems.length).toBeGreaterThan(20);
    const feeds = independentCollectableFeeds();
    const configured = withGcooAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    for (const system of systems) {
      expect(system.provider).toBe('gcoo');
      const feed = configured.find(f => f.id.endsWith(`:${system.id}`))!;
      expect(feed.zoneSource).toBeUndefined();
      expect(feed.collect).not.toBe(feeds.find(f => f.id === feed.id)!.collect);
    }
    expect(configured.find(f => f.id === 'publibike')).toBe(feeds.find(f => f.id === 'publibike'));
  });
});

describe('GCOO client', () => {
  const client = (fetch: typeof globalThis.fetch, clock = { now }) =>
    new GcooClient({ fetch, now: () => clock.now, intervalMs: 0, timeoutMs: 25 });

  it('shares a box read between the towns of a round, never with the next round', async () => {
    const clock = { now };
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(payload([scooter(1)])));
    const gcoo = client(fetch, clock);
    await Promise.all([gcoo.markers(tile), gcoo.markers(tile)]);
    clock.now += 30_000;
    expect((await gcoo.markers(tile)).at).toBe(now);
    expect(fetch).toHaveBeenCalledTimes(1);
    clock.now += 30_000;
    expect((await gcoo.markers(tile)).at).toBe(now + 60_000);
    expect(fetch).toHaveBeenCalledTimes(2);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.searchParams.get('cluster_number')).toBe('100000');
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error', headers: { 'User-Agent': 'okhttp/4.12.0' } });
  });

  it('backs off after a 429, retries a failed read, and bounds and sanitizes bodies', async () => {
    const clock = { now };
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    const gcoo = client(fetch, clock);
    await expect(gcoo.markers(tile)).rejects.toThrow('GCOO map HTTP 429');
    await expect(gcoo.markers(tile)).rejects.toThrow('rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    clock.now += 120_000;
    fetch.mockResolvedValueOnce(new Response('not json'));
    await expect(gcoo.markers(tile)).rejects.toThrow('GCOO returned invalid JSON');
    fetch.mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(16 * 1024 * 1024 + 1)); controller.close();
    } })));
    await expect(gcoo.markers(tile)).rejects.toThrow('GCOO response exceeds the size limit');
    fetch.mockRejectedValueOnce(new Error('socket hang up'));
    await expect(gcoo.markers(tile)).rejects.toThrow('GCOO request failed or timed out');
  });
});
