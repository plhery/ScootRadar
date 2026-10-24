import { describe, expect, it, vi } from 'vitest';
import { haversineM } from '../src/lib/geo';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import {
  collectKickgoingRegion, KickgoingClient, kickgoingCells, parseKickgoingScooters, withKickgoingAppCollectors,
} from './kickgoingApp';

const now = Date.parse('2026-10-24T03:00:00Z');
const vehicle = (id: number | string, changes: Record<string, unknown> = {}) => ({ id, lat: 37.4979, lng: 127.0276,
  mobility_type: 'kickboard', provider: 'kickgoing', battery_rate: 64, ...changes });
const payload = (kickscooters: unknown[], changes: Record<string, unknown> = {}) =>
  ({ kickscooters, clustered_kickscooters: [], map_radius: 1500, ...changes });
const bounds = { south: 37.49, north: 37.51, west: 127.02, east: 127.04 };
const region = (provider: RegionalScooterSystem['provider']): RegionalScooterSystem => ({ id: `${provider}_kr_test`, provider, country: 'KR', city: 'Seoul',
  center: [37.4979, 127.0276], bounds, discoveryUrl: 'https://api.kickgoing.io/v4/kickscooters', kickgoingAppMap: true });

describe('Kickgoing map', () => {
  it("keeps Kickgoing's and Xingxing's standing kickboards, with their battery", () => {
    expect(parseKickgoingScooters(payload([vehicle(1), vehicle('a3f9', { provider: 'xingxing', battery_rate: 101 }),
      vehicle(2, { mobility_type: 'bike' }), vehicle(3, { provider: 'tmap' })]))).toEqual([
      { id: '1', provider: 'kickgoing', lat: 37.4979, lng: 127.0276, battery: 64 },
      { id: 'a3f9', provider: 'xingxing', lat: 37.4979, lng: 127.0276, battery: null },
    ]);
  });

  it('rejects clusters, another radius or a broken vehicle instead of reading part of a cell', () => {
    for (const bad of [{ error: 'Unauthorized' }, payload([], { map_radius: 3000 }),
      payload([], { clustered_kickscooters: [{ lat: 37.5, lng: 127, count: 9 }] }), payload([vehicle(1.5)]),
      payload([vehicle('../1')]), payload([vehicle(1, { lat: 91 })]), payload([vehicle(1, { provider: undefined })])]) {
      expect(() => parseKickgoingScooters(bad)).toThrow('Invalid Kickgoing');
    }
    expect(parseKickgoingScooters(payload([]))).toEqual([]);
  });

  it('reads the fixed grid, each cell inside the radius the map answers for', () => {
    const cells = kickgoingCells(bounds);
    expect(cells).toHaveLength(2);
    for (const cell of cells) {
      expect(haversineM(cell.lat, cell.lng, cell.bounds.north, cell.bounds.east)).toBeLessThan(2350);
    }
    // Cells as wide in kilometres as near the equator would leave their corners unread.
    expect(() => kickgoingCells({ south: 1.3, north: 1.31, west: 103.8, east: 103.81 })).toThrow('map radius');
  });

  it('keeps the system operator\'s scooters within its bounds, by operator id, and stays within budget', async () => {
    const api = { scooters: vi.fn(async () => ({ at: now, scooters: [
      { id: '1', provider: 'kickgoing' as const, lat: 37.5, lng: 127.03, battery: 64 },
      { id: 'a3f9', provider: 'xingxing' as const, lat: 37.5, lng: 127.03, battery: 12 },
      { id: '2', provider: 'kickgoing' as const, lat: 37.6, lng: 127.03, battery: 30 },
    ] })) };
    const kickgoing = await collectKickgoingRegion(region('kickgoing'), api);
    expect(api.scooters).toHaveBeenCalledTimes(2);
    expect(kickgoing).toEqual({ observedAt: now, stale: false, vehicles: [{ provider: 'kickgoing', vehicle_id: 'kickgoing:1',
      lat: 37.5, lng: 127.03, battery: 64, range_m: null, deep_link: null, distance_m: null }] });
    expect((await collectKickgoingRegion(region('xingxing'), api)).vehicles.map(v => v.vehicle_id)).toEqual(['xingxing:a3f9']);
    await expect(collectKickgoingRegion(region('lime'), api)).rejects.toThrow('Not a Kickgoing');
    await expect(collectKickgoingRegion({ ...region('kickgoing'), bounds: { south: 37, north: 38, west: 126.5, east: 127.5 } }, api))
      .rejects.toThrow('collection budget');
  });

  it('wires every Kickgoing and Xingxing catalog system, each within budget and without GBFS discovery', () => {
    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.kickgoingAppMap);
    expect(new Set(systems.map(system => system.provider))).toEqual(new Set(['kickgoing', 'xingxing']));
    const feeds = independentCollectableFeeds();
    const configured = withKickgoingAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    for (const system of systems) {
      expect(kickgoingCells(system.bounds).length).toBeLessThanOrEqual(300);
      const feed = configured.find(f => f.id.endsWith(`:${system.id}`))!;
      expect(feed.zoneSource).toBeUndefined();
      expect(feed.collect).not.toBe(feeds.find(f => f.id === feed.id)!.collect);
    }
  });
});

describe('Kickgoing client', () => {
  it("shares a cell's read between Kickgoing's and Xingxing's systems for 50 seconds", async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(payload([vehicle(1)])));
    const client = new KickgoingClient({ fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    await Promise.all([client.scooters(37.5, 127.03), client.scooters(37.5, 127.03)]);
    clock += 50_000;
    expect((await client.scooters(37.5, 127.03)).at).toBe(now);
    clock += 1;
    expect((await client.scooters(37.5, 127.03)).at).toBe(now + 50_001);
    expect(fetch).toHaveBeenCalledTimes(2);
    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(Object.fromEntries(url.searchParams)).toEqual({ version: '2.11.23', lat: '37.500000', lng: '127.030000', zoom: '15',
      alliance: 'kickgoing', mobility: 'kickboard' });
    expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
  });

  it('backs off after a 429 and bounds and sanitizes bodies', async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 429 }));
    const client = new KickgoingClient({ fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    await expect(client.scooters(37.5, 127.03)).rejects.toThrow('Kickgoing map HTTP 429');
    await expect(client.scooters(37.5, 127.04)).rejects.toThrow('rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    clock += 60_000;
    fetch.mockResolvedValueOnce(new Response('<html>'));
    await expect(client.scooters(37.5, 127.03)).rejects.toThrow('Kickgoing returned invalid JSON');
    fetch.mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(32 * 1024 * 1024 + 1)); controller.close();
    } })));
    await expect(client.scooters(37.5, 127.03)).rejects.toThrow('Kickgoing response exceeds the size limit');
  });
});
