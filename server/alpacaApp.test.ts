import { describe, expect, it, vi } from 'vitest';
import { boundsContainPoint } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import {
  ALPACA_CELL, ALPACA_CLUSTER, AlpacaClient, alpacaCells, collectAlpacaRegion, parseAlpacaClusters, parseAlpacaScooters,
  withAlpacaAppCollectors,
} from './alpacaApp';

const now = Date.parse('2026-10-25T16:30:00Z');
const REACH = 0.017;
const vehicle = (id: string, lat = 35.5384, lng = 129.3114, changes: Record<string, unknown> = {}) => ({ id,
  vehicleModel: { id: '7', vehicleType: { name: 'KICKBOARD' } },
  vehicleCurrentStatus: { batteryPercentage: 64, coordinate: { type: 'Point', coordinates: [lng, lat] } }, ...changes });
const vehicles = (list: unknown[]) => ({ data: { ridableVehicles: list } });
const clusters = (points: [number, number][]) => ({ data: { ridableVehicleClusters: points.map(([lat, lng], id) =>
  ({ id: String(id), coordinate: { type: 'Point', coordinates: [lng, lat] } })) } });
const bounds = { south: 35.5, north: 35.6, west: 129.25, east: 129.4 };
const region = (changes: Partial<RegionalScooterSystem> = {}): RegionalScooterSystem => ({ id: 'alpaca_kr_test', provider: 'alpaca',
  country: 'KR', city: 'Ulsan', center: [35.5384, 129.3114], bounds, discoveryUrl: 'https://alpaca.maasasia.com/graphql',
  alpacaAppMap: true, ...changes });

describe('Alpaca map', () => {
  it('keeps the ridable kickboards around the point, with their battery, and leaves its e-bikes out', () => {
    expect(parseAlpacaScooters(vehicles([vehicle('14912'),
      vehicle('2', 35.55, 129.32, { vehicleCurrentStatus: { batteryPercentage: 101, coordinate: { type: 'Point', coordinates: [129.32, 35.55] } } }),
      vehicle('3', 35.54, 129.31, { vehicleModel: { id: '9', vehicleType: { name: 'E_BIKE' } } })]), 35.5384, 129.3114)).toEqual([
      { id: '14912', lat: 35.5384, lng: 129.3114, battery: 64 },
      { id: '2', lat: 35.55, lng: 129.32, battery: null },
    ]);
    expect(parseAlpacaScooters(vehicles([]), 35.5, 129.3)).toEqual([]);
  });

  it('rejects an error, a broken vehicle or one beyond the reach the cells are drawn for', () => {
    for (const bad of [{ errors: [{ message: 'Unauthorized' }], data: null }, { data: {} }, vehicles([vehicle('../1')]),
      vehicles([vehicle('1', 91)]), vehicles([{ ...vehicle('1'), vehicleModel: null }]),
      vehicles([vehicle('1', 35.5, 129.3, { vehicleCurrentStatus: { coordinate: { type: 'LineString', coordinates: [129.3, 35.5] } } })])]) {
      expect(() => parseAlpacaScooters(bad, 35.5, 129.3)).toThrow('Invalid Alpaca');
    }
    // The map's reach is 0.017 degrees, latitude and longitude alike.
    expect(parseAlpacaScooters(vehicles([vehicle('1', 35.5 + 0.01699, 129.3)]), 35.5, 129.3)).toHaveLength(1);
    expect(() => parseAlpacaScooters(vehicles([vehicle('1', 35.5, 129.3 + 0.018)]), 35.5, 129.3)).toThrow('beyond its known reach');
  });

  it("reads the clusters' points, and fails on none rather than leave the country empty", () => {
    expect(parseAlpacaClusters(clusters([[35.54209, 129.3195]]))).toEqual([{ lat: 35.54209, lng: 129.3195 }]);
    expect(() => parseAlpacaClusters(clusters([]))).toThrow('lists no vehicles');
    expect(() => parseAlpacaClusters({ data: { ridableVehicleClusters: [{ id: '0', coordinate: null }] } })).toThrow('Invalid Alpaca cluster');
    expect(() => parseAlpacaClusters({ errors: [{ message: 'Bad' }] })).toThrow('Invalid Alpaca map response');
  });

  it('reads the cells of the fixed grid that meet a square where vehicles stand, each inside the reach', () => {
    // A cluster stands in its square of the clusters' grid; the cells read cover the square and its margin.
    const cells = alpacaCells(bounds, [{ lat: 35.5384, lng: 129.3114 }, { lat: 37.5, lng: 127 }]);
    expect(cells.length).toBeGreaterThanOrEqual(1);
    expect(cells.length).toBeLessThanOrEqual(4);
    for (const cell of cells) {
      expect(Math.hypot(cell.bounds.north - cell.lat, cell.bounds.east - cell.lng)).toBeLessThan(REACH - 0.0005);
      expect(cell.bounds.north - cell.bounds.south).toBeCloseTo(ALPACA_CELL, 9);
    }
    expect(alpacaCells(bounds, [{ lat: 37.5, lng: 127 }])).toEqual([]);
    // Vehicles anywhere in a cluster's square, or a few metres beyond it, as one 3 m from a cluster on its square's edge.
    const seen = [{ lat: 35.542095, lng: 129.31947, cluster: { lat: 35.54209, lng: 129.3195 } }];
    // At the corners of each cluster's square, 0.0004 degrees beyond them.
    const corner = (degrees: number, side: number) => Math.round(degrees / ALPACA_CLUSTER) * ALPACA_CLUSTER + side * (ALPACA_CLUSTER / 2 + 0.0004);
    for (let i = 0; i < 400; i++) {
      const cluster = { lat: 35.51 + (i % 20) * 0.0041, lng: 129.26 + Math.floor(i / 20) * 0.0067 };
      seen.push({ lat: corner(cluster.lat, i % 2 ? 1 : -1), lng: corner(cluster.lng, i % 3 ? 1 : -1), cluster });
    }
    for (const { lat, lng, cluster } of seen) {
      const read = alpacaCells(bounds, [cluster]);
      expect(read.some(cell => boundsContainPoint(cell.bounds, lat, lng) && Math.hypot(lat - cell.lat, lng - cell.lng) < REACH)).toBe(true);
    }
  });

  it("keeps the kickboards in the system's bounds by operator id, reading only where the clusters stand, within budget", async () => {
    const api = {
      clusters: vi.fn(async () => ({ at: now - 5_000, clusters: [{ lat: 35.5384, lng: 129.3114 }, { lat: 37.5, lng: 127 }] })),
      scooters: vi.fn(async () => ({ at: now, scooters: [
        { id: '1', lat: 35.5384, lng: 129.3114, battery: 64 },
        { id: '2', lat: 35.7, lng: 129.3114, battery: 30 },
      ] })),
    };
    const read = await collectAlpacaRegion(region(), api);
    expect(api.clusters).toHaveBeenCalledTimes(1);
    expect(api.scooters).toHaveBeenCalledTimes(alpacaCells(bounds, [{ lat: 35.5384, lng: 129.3114 }]).length);
    expect(read).toEqual({ observedAt: now - 5_000, stale: false, vehicles: [{ provider: 'alpaca', vehicle_id: 'alpaca:1',
      lat: 35.5384, lng: 129.3114, battery: 64, range_m: null, deep_link: null, distance_m: null }] });
    await expect(collectAlpacaRegion(region({ alpacaAppMap: undefined }), api)).rejects.toThrow('Not an Alpaca');
    const everywhere = Array.from({ length: 2_000 }, (_, i) => ({ lat: 35 + (i % 50) * 0.02, lng: 128.5 + Math.floor(i / 50) * 0.03 }));
    api.clusters.mockResolvedValueOnce({ at: now, clusters: everywhere });
    await expect(collectAlpacaRegion(region({ bounds: { south: 35, north: 36, west: 128.5, east: 129.7 } }), api))
      .rejects.toThrow('collection budget');
  });

  it('wires every Alpaca catalog system, collected every two hours while nobody looks, each within budget', () => {
    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.alpacaAppMap);
    expect(systems.length).toBeGreaterThan(0);
    expect(new Set(systems.map(system => system.provider))).toEqual(new Set(['alpaca']));
    const feeds = independentCollectableFeeds();
    const configured = withAlpacaAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    for (const system of systems) {
      // Every cell of its bounds, were its scooters spread all over them.
      const whole = [];
      for (let lat = system.bounds.south; lat <= system.bounds.north + ALPACA_CLUSTER; lat += ALPACA_CLUSTER) {
        for (let lng = system.bounds.west; lng <= system.bounds.east + ALPACA_CLUSTER; lng += ALPACA_CLUSTER) whole.push({ lat, lng });
      }
      expect(alpacaCells(system.bounds, whole).length, system.id).toBeLessThanOrEqual(200);
      const feed = configured.find(f => f.id.endsWith(`:${system.id}`))!;
      expect(feed).toMatchObject({ provider: 'alpaca', idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, paced: true });
      expect(feed.zoneSource).toBeUndefined();
      expect(feed.collect).not.toBe(feeds.find(f => f.id === feed.id)!.collect);
    }
  });
});

describe('Alpaca client', () => {
  it("asks as the app does signed out, and shares a point's read, and the clusters, for 50 seconds", async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => Response.json(
      String(init?.body).includes('GetRidableCluster') ? clusters([[35.54, 129.31]]) : vehicles([vehicle('1')])));
    const client = new AlpacaClient({ fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    await Promise.all([client.scooters(35.5384, 129.3114), client.scooters(35.5384, 129.3114), client.clusters(), client.clusters()]);
    clock += 50_000;
    expect((await client.scooters(35.5384, 129.3114)).at).toBe(now);
    expect((await client.clusters()).clusters).toEqual([{ lat: 35.54, lng: 129.31 }]);
    clock += 1;
    expect((await client.scooters(35.5384, 129.3114)).at).toBe(now + 50_001);
    expect(fetch).toHaveBeenCalledTimes(3);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://alpaca.maasasia.com/graphql');
    expect(init).toMatchObject({ method: 'POST', redirect: 'error', headers: { Authorization: '', 'User-Agent': 'okhttp/4.12.0' } });
    expect(JSON.parse(String(init!.body))).toMatchObject({ operationName: 'GetRidableVehicle',
      variables: { center: { type: 'Point', coordinates: [129.3114, 35.5384] } } });
    expect(JSON.parse(String(fetch.mock.calls[1][1]!.body))).toMatchObject({ operationName: 'GetRidableCluster', variables: { size: 0.003 } });
  });

  it('backs off after a 429 and bounds and sanitizes bodies', async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    const client = new AlpacaClient({ fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    await expect(client.scooters(35.5, 129.3)).rejects.toThrow('Alpaca map HTTP 429');
    await expect(client.clusters()).rejects.toThrow('rate limited');
    clock += 60_000;
    await expect(client.scooters(35.5, 129.31)).rejects.toThrow('rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    clock += 60_000;
    fetch.mockResolvedValueOnce(new Response('<html>'));
    await expect(client.scooters(35.5, 129.3)).rejects.toThrow('Alpaca returned invalid JSON');
    fetch.mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(16 * 1024 * 1024 + 1)); controller.close();
    } })));
    await expect(client.scooters(35.5, 129.3)).rejects.toThrow('Alpaca response exceeds the size limit');
  });
});
