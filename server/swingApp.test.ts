import { describe, expect, it, vi } from 'vitest';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { MapBounds } from '../src/lib/types';
import { collectSwingRegion, parseSwingScooters, SwingClient, swingOneTimeCode, withSwingAppCollectors } from './swingApp';

const now = Date.parse('2026-10-24T03:00:00Z');
// A test secret, in Base32: never the app's.
const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
const key = Buffer.from('Hello!\xde\xad\xbe\xefHello!\xde\xad\xbe\xef', 'latin1');
const bounds = { south: 35.1, north: 35.2, west: 129.0, east: 129.2 };
const vehicle = (imei: string, changes: Record<string, unknown> = {}) =>
  ({ imei, lat: 35.15, lng: 129.1, type: 'SCOOTER', battery: 'HIGH', vendor: 'NINEBOT', model: 'MAX', selected: true, ...changes });
const payload = (vehicles: unknown[], read: MapBounds = bounds, meta: Record<string, unknown> = {}) =>
  ({ __status: 'OK', vehicles, meta: { calcBounds: read, throttleMs: 0, ...meta } });
const region: RegionalScooterSystem = { id: 'swing_kr_test', provider: 'swing', country: 'KR', city: 'Busan', center: [35.15, 129.1],
  bounds, discoveryUrl: 'https://sfr.swingmobility.dev/map/marker/vehicles', swingAppMap: true };

describe('Swing one-time code', () => {
  it("follows RFC 6238's SHA-512 vectors, in six digits", () => {
    const rfcKey = Buffer.from('1234567890'.repeat(7).slice(0, 64));
    expect(swingOneTimeCode(rfcKey, 59_000)).toBe('693936');
    expect(swingOneTimeCode(rfcKey, 1_111_111_109_000)).toBe('091201');
    expect(swingOneTimeCode(rfcKey, 2_000_000_000_000)).toBe('618901');
  });
});

describe('Swing map', () => {
  it('keeps the scooters, by an id that does not reveal the IMEI, and the box the server read', () => {
    const parsed = parseSwingScooters(payload([vehicle('860000000000001'), vehicle('860000000000002', { type: 'BIKE' }),
      vehicle('860000000000003', { type: 'MOPED' })], bounds, { throttleMs: 1500 }), key);
    expect(parsed.read).toEqual(bounds);
    expect(parsed.throttleMs).toBe(1500);
    expect(parsed.scooters).toHaveLength(1);
    expect(parsed.scooters[0].vendor).toBe('NINEBOT');
    expect(parseSwingScooters(payload([vehicle('860000000000001', { vendor: undefined })]), key).scooters[0].vendor).toBeNull();
    const [{ id }] = parsed.scooters;
    expect(id).toMatch(/^[A-Za-z0-9_-]{16}$/);
    expect(id).not.toContain('860000000000001');
    expect(parseSwingScooters(payload([vehicle('860000000000001')]), key).scooters[0].id).toBe(id);
    expect(parseSwingScooters(payload([vehicle('860000000000001')]), Buffer.from('another key')).scooters[0].id).not.toBe(id);
  });

  it('rejects an error, a missing read box or a broken vehicle instead of reading an empty map', () => {
    for (const bad of [{ __status: 'UNAUTHORIZED' }, { __status: 'OK', vehicles: [], meta: {} },
      payload([], { ...bounds, north: NaN }), payload([vehicle('../imei')]), payload([vehicle('1', { lat: '35.1' })]),
      payload([vehicle('1', { type: undefined })])]) {
      expect(() => parseSwingScooters(bad, key)).toThrow('Invalid Swing');
    }
  });

  it('reads the bounds again in quarters where the server read less, by operator id, without IMEIs or batteries', async () => {
    const asked: MapBounds[] = [];
    const api = { scooters: vi.fn(async (box: MapBounds) => {
      asked.push(box);
      const scooters = [{ id: `hash${asked.length}`, vendor: null, lat: 35.15, lng: 129.1 }, { id: 'outside', vendor: null, lat: 35.3, lng: 129.1 }];
      return { at: now + asked.length, scooters, read: asked.length === 1 ? { ...box, north: box.north - 0.01 } : box };
    }) };
    const snapshot = await collectSwingRegion(region, api);
    expect(asked).toHaveLength(5);
    expect(snapshot.observedAt).toBe(now + 2);
    expect(snapshot.vehicles.map(v => v.vehicle_id)).toEqual(['swing:hash2', 'swing:hash3', 'swing:hash4', 'swing:hash5']);
    expect(snapshot.vehicles.every(v => v.provider === 'swing' && v.battery === null && v.range_m === null)).toBe(true);
    const short = { scooters: async (box: MapBounds) => ({ at: now, scooters: [], read: { ...box, east: box.east - 0.01 } }) };
    await expect(collectSwingRegion(region, short)).rejects.toThrow('read less than the box');
    await expect(collectSwingRegion({ ...region, swingAppMap: undefined }, api)).rejects.toThrow('Not a Swing');
    await expect(collectSwingRegion({ ...region, provider: 'gcoo' }, api)).rejects.toThrow('Not a Swing');
  });

  it("gives a Deer system Deer's scooters and a Swing system the rest, each under its own operator's id", async () => {
    // Daegu, where both run.
    const daegu = { ...region, city: 'Daegu', center: [35.8714, 128.6014] as [number, number],
      bounds: { south: 35.7775, west: 128.4541, north: 35.9735, east: 128.7588 } };
    const api = { scooters: async (box: MapBounds) => ({ at: now, read: box, scooters: [
      { id: 'own', vendor: null, lat: 35.8714, lng: 128.6014 }, { id: 'ninebot', vendor: 'NINEBOT', lat: 35.8714, lng: 128.6014 },
      { id: 'deer', vendor: 'DEER', lat: 35.8714, lng: 128.6014 }] }) };
    const swing = await collectSwingRegion(daegu, api);
    expect(swing.vehicles.map(v => [v.provider, v.vehicle_id])).toEqual([['swing', 'swing:own'], ['swing', 'swing:ninebot']]);
    const deer = await collectSwingRegion({ ...daegu, id: 'deer_kr_test', provider: 'deer' }, api);
    expect(deer.vehicles.map(v => [v.provider, v.vehicle_id])).toEqual([['deer', 'deer:deer']]);
  });

  it('wires every Swing catalog system without GBFS discovery', () => {
    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.swingAppMap);
    expect(systems.length).toBeGreaterThan(50);
    const feeds = independentCollectableFeeds();
    const configured = withSwingAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    expect(systems.some(system => system.provider === 'deer')).toBe(true);
    for (const system of systems) {
      expect(['swing', 'deer']).toContain(system.provider);
      const feed = configured.find(f => f.id.endsWith(`:${system.id}`))!;
      expect(feed.zoneSource).toBeUndefined();
      expect(feed.collect).not.toBe(feeds.find(f => f.id === feed.id)!.collect);
    }
  });
});

describe('Swing client', () => {
  it("asks for the centre quarter of the bounds with the app's headers and a fresh one-time code", async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(payload([vehicle('860000000000001')])));
    const client = new SwingClient({ secret, fetch, now: () => now, intervalMs: 0, timeoutMs: 25 });
    expect(await client.scooters(bounds)).toMatchObject({ at: now, read: bounds, scooters: [{ lat: 35.15, lng: 129.1 }] });
    const [url, init] = fetch.mock.calls[0];
    const query = new URL(String(url)).searchParams;
    expect([query.get('south'), query.get('north'), query.get('west'), query.get('east')])
      .toEqual(['35.137500', '35.162500', '129.075000', '129.125000']);
    expect(query.get('VEHICLE')).toBe('SCOOTER');
    expect(query.get('selectedOnly')).toBe('true');
    const headers = new Headers(init?.headers);
    expect(headers.get('X-SW-APP-TS')).toBe(String(now));
    expect(headers.get('X-SW-OS-FSAN')).toMatch(/^\d{6}$/);
    expect(headers.get('X-SW-APP-VERSION')).toBe('4.8.1');
    expect(init).toMatchObject({ redirect: 'error' });
  });

  it('refuses to run without its secret, and waits the throttle the server asks for', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    for (const missing of ['', 'short', 'NOT-BASE32-AT-ALL!!']) {
      await expect(new SwingClient({ secret: missing, fetch }).scooters(bounds)).rejects.toThrow('secret is missing or invalid');
    }
    expect(fetch).not.toHaveBeenCalled();
    vi.useFakeTimers({ now });
    try {
      fetch.mockImplementation(async () => Response.json(payload([], bounds, { throttleMs: 5000 })));
      const client = new SwingClient({ secret, fetch, now: Date.now, intervalMs: 1000, timeoutMs: 25 });
      await client.scooters(bounds);
      const second = client.scooters({ ...bounds, east: 129.3 });
      await vi.advanceTimersByTimeAsync(4999);
      expect(fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await second;
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('answers the same box from a read of the last 50 seconds, and reads it again after', async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json(payload([vehicle('860000000000001')])));
    const client = new SwingClient({ secret, fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    const [first, again] = await Promise.all([client.scooters(bounds), client.scooters(bounds)]);
    clock += 50_000;
    expect(await client.scooters(bounds)).toBe(first);
    expect(again).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    await client.scooters({ ...bounds, east: 129.3 });
    expect(fetch).toHaveBeenCalledTimes(2);
    clock += 1;
    expect((await client.scooters(bounds)).at).toBe(clock);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('backs off after a 429 and sanitizes failures', async () => {
    let clock = now;
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(null, { status: 429, headers: { 'Retry-After': '300' } }));
    const client = new SwingClient({ secret, fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 });
    await expect(client.scooters(bounds)).rejects.toThrow('Swing map HTTP 429');
    await expect(client.scooters(bounds)).rejects.toThrow('rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    clock += 300_000;
    fetch.mockRejectedValueOnce(new Error(`request to ${secret} failed`));
    await expect(client.scooters(bounds)).rejects.toThrow('Swing request failed or timed out');
    fetch.mockResolvedValueOnce(new Response('{'));
    await expect(client.scooters(bounds)).rejects.toThrow('Swing returned invalid JSON');
  });
});
