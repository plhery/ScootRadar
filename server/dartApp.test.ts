import { describe, expect, it, vi } from 'vitest';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { DartClient, collectDartRegion, parseDartScooters, withDartAppCollectors } from './dartApp';

const now = Date.parse('2026-10-25T17:30:00Z');
const vehicle = (reg_no: number, latitude = 34.7604, longitude = 127.6622, changes: Record<string, unknown> = {}) => ({
  reg_no, latitude, longitude, status: '1', reward_type: 0, power_percent: 68, remaining_range: 35, region: '전남',
  address: '전남 여수시 학동', qr_code: '020156', parking_img: '/upload/parking/1/img.jpg', mod_val: '0', start_val: '1',
  start_date: { time: now - 600_000 }, mod_date: { time: now - 60_000 }, ...changes });
const reply = (list: unknown[]) => ({ now_time: { time: now }, result: true, data: { reserve_cnt: 0, vehicle: list } });
const area = (city: string, center: [number, number], bounds: RegionalScooterSystem['bounds']) => ({ city, center, bounds });
const yeosu = area('Yeosu', [34.7637, 127.6782], { south: 34.7167, north: 34.7927, west: 127.6192, east: 127.7645 });
const gimpo = area('Gimpo', [37.6428, 126.6716], { south: 37.5797, north: 37.6441, west: 126.5874, east: 126.8039 });
const region = (changes: Partial<RegionalScooterSystem> = {}): RegionalScooterSystem => ({ id: 'dart_kr_test', provider: 'dart',
  country: 'KR', city: 'Yeosu / Gimpo', center: yeosu.center, bounds: { south: 34.7167, north: 37.6441, west: 126.5874, east: 127.7645 },
  discoveryUrl: 'https://app.dartsharing.com:8443/app/vehicle/main_v2', dartAppMap: true, areas: [yeosu, gimpo], ...changes });

describe('DART map', () => {
  it('keeps the scooters that can be ridden, with their battery and range, and reads nothing else of them', () => {
    expect(parseDartScooters(reply([vehicle(1749),
      vehicle(2, 37.61, 126.71, { status: '8', reward_type: 2, power_percent: 101, remaining_range: -1 }),
      vehicle(3, 37.61, 126.71, { status: '3' }), vehicle(4, 37.61, 126.71, { status: '7' }),
      vehicle(5, 37.61, 126.71, { status: '9' }), vehicle(6, 37.61, 126.71, { status: '0' }), vehicle(1749)]))).toEqual([
      { id: '1749', lat: 34.7604, lng: 127.6622, battery: 68, range_m: 35_000 },
      { id: '2', lat: 37.61, lng: 126.71, battery: null, range_m: null },
    ]);
  });

  it('rejects a refused or broken reply, and a fleet with no scooter to ride rather than empty every town', () => {
    for (const bad of [{ result: false, data: null }, { result: true, data: {} }, { ...reply([]), result: 'true' },
      reply([vehicle(-1)]), reply([vehicle(1.5)]), reply([vehicle(1, 91)]), reply([vehicle(1, 34.7, Number.NaN)]),
      reply([{ ...vehicle(1), status: 1 }]), reply([null])]) {
      expect(() => parseDartScooters(bad)).toThrow('Invalid DART');
    }
    expect(() => parseDartScooters(reply([]))).toThrow('lists no scooters');
    expect(() => parseDartScooters(reply([vehicle(1, 34.76, 127.66, { status: '3' })]))).toThrow('lists no scooters');
  });

  it("keeps the scooters in the system's towns by operator id, from one read of the country", async () => {
    const api = { scooters: vi.fn(async () => ({ at: now, scooters: [
      { id: '1', lat: 34.7604, lng: 127.6622, battery: 68, range_m: 35_000 },
      { id: '2', lat: 37.62, lng: 126.7, battery: 40, range_m: null },
      // In Anseong, beyond its towns, and in Seoul, inside Gimpo's bounds: DART has no town in either.
      { id: '3', lat: 37.0, lng: 127.27, battery: 90, range_m: 45_000 },
      { id: '4', lat: 37.585, lng: 126.8, battery: 90, range_m: 45_000 },
    ] })) };
    const read = await collectDartRegion(region(), api);
    expect(api.scooters).toHaveBeenCalledTimes(1);
    expect(read).toEqual({ observedAt: now, stale: false, vehicles: [
      { provider: 'dart', vehicle_id: 'dart:1', lat: 34.7604, lng: 127.6622, battery: 68, range_m: 35_000, deep_link: null, distance_m: null },
      { provider: 'dart', vehicle_id: 'dart:2', lat: 37.62, lng: 126.7, battery: 40, range_m: null, deep_link: null, distance_m: null },
    ] });
    await expect(collectDartRegion(region({ dartAppMap: undefined }), api)).rejects.toThrow('Not a DART');
  });

  it('wires its one catalog system, every town an area, collected every two hours while nobody looks', () => {
    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.dartAppMap);
    // One system reads the whole country once a round; a second would read it again.
    expect(systems.map(system => system.id)).toEqual(['dart_kr_nationwide']);
    expect(REGIONAL_SCOOTER_SYSTEMS.filter(system => system.provider === 'dart')).toEqual(systems);
    expect(systems[0].areas!.length).toBeGreaterThan(1);
    const feeds = independentCollectableFeeds();
    const feed = withDartAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS).find(f => f.id.endsWith(':dart_kr_nationwide'))!;
    expect(feed).toMatchObject({ provider: 'dart', idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS });
    expect(feed.paced).toBeUndefined();
    expect(feed.zoneSource).toBeUndefined();
    expect(feed.coverage).toEqual(systems[0].areas!.map(each => each.bounds));
    expect(feed.collect).not.toBe(feeds.find(f => f.id === feed.id)!.collect);
  });
});

describe('DART client', () => {
  it("asks for the whole country as the app's map does, as user 0 with ScootRadar's token", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(reply([vehicle(1749)])));
    const client = new DartClient({ fetch, now: () => now, timeoutMs: 25 });
    expect(await client.scooters()).toEqual({ at: now, scooters: [{ id: '1749', lat: 34.7604, lng: 127.6622, battery: 68, range_m: 35_000 }] });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://app.dartsharing.com:8443/app/vehicle/main_v2');
    expect(init).toMatchObject({ method: 'POST', redirect: 'error', headers: { token: 'scootradar', 'app-version': '2.3.0',
      'Content-Type': 'application/x-www-form-urlencoded' } });
    expect(Object.fromEntries(init!.body as URLSearchParams)).toEqual({ zoomLevel: '14', user_no: '0', luLat: '38.7', ldLat: '33',
      luLong: '124.5', ruLong: '131' });
  });

  it('backs off after a 429 and bounds and sanitizes bodies', async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    const client = new DartClient({ fetch, now: () => clock, timeoutMs: 25 });
    await expect(client.scooters()).rejects.toThrow('DART map HTTP 429');
    clock += 60_000;
    await expect(client.scooters()).rejects.toThrow('rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    clock += 60_000;
    fetch.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(client.scooters()).rejects.toThrow('DART map HTTP 401');
    fetch.mockResolvedValueOnce(new Response('<html>'));
    await expect(client.scooters()).rejects.toThrow('DART returned invalid JSON');
    fetch.mockResolvedValueOnce(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(16 * 1024 * 1024 + 1)); controller.close();
    } })));
    await expect(client.scooters()).rejects.toThrow('DART response exceeds the size limit');
  });
});
