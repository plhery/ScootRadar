import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import areas from '../data/ridemovi-areas.json';
import { haversineM, boundsContainPoint } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { collectRidemoviArea, parseRidemoviReply, RIDEMOVI_FORBIDDEN_RETRY_MS, RIDEMOVI_PAGE, RidemoviClient, withRidemoviAppCollectors } from './ridemoviApp';

const lat = 51.0504, lng = 13.7373;
const bike = (id = 1, offset = 0.01) => ({ id, lat: lat + offset, lon: lng, cityId: 86, bikeType: 'SN1',
  distance: haversineM(lat, lng, lat + offset, lng), bikePowerBatteryStatus: { soc: 73, lockId: 'private-lock-id' },
  estimatedTravelDistanceInKM: 18.256, bikeNo: 'private-qr-id' });
const reply = (bikes = [bike()]) => ({ code: 1000, data: { showNearbyBikes: true, nearbyBikes: bikes } });
const system = REGIONAL_SCOOTER_SYSTEMS.find(s => s.id === 'ridemovi_de_dresden')!;
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

describe('RideMovi response coverage', () => {
  it('keeps position, battery and range, and certifies the 2 km radius below a full page', () => {
    const result = parseRidemoviReply(reply(), 86, lat, lng);
    expect(result.scooters).toEqual([{ id: '1', lat: lat + 0.01, lng, battery: 73, range_m: 18256 }]);
    expect(result.completeM).toBe(1_975);
    expect(JSON.stringify(result)).not.toContain('private');
  });

  it('certifies a full page only up to its last scooter, and never beyond the radius', () => {
    const page = (step: number) => reply(Array.from({ length: RIDEMOVI_PAGE }, (_, i) => bike(i + 1, (i + 1) * step)));
    const near = parseRidemoviReply(page(0.0002), 86, lat, lng);
    expect(near.completeM).toBeCloseTo(haversineM(lat, lng, lat + 0.006, lng) * 0.99 - 5);
    expect(parseRidemoviReply(page(0.001), 86, lat, lng).completeM).toBe(1_975);
  });

  it('reads a hidden, empty list as no scooter within the radius (SCOOTRADAR-CACHE-69)', () => {
    expect(parseRidemoviReply({ code: 1000, data: { showNearbyBikes: false, nearbyBikes: [] } }, 86, lat, lng))
      .toEqual({ scooters: [], completeM: 1_975 });
  });

  it.each([
    { code: 15000, data: {} }, reply([]), { code: 1000, data: { nearbyBikes: [bike()] } },
    { code: 1000, data: { showNearbyBikes: false, nearbyBikes: [bike()] } }, { code: 1000, data: { showNearbyBikes: false } },
    reply(Array.from({ length: 31 }, (_, i) => bike(i + 1, (i + 1) / 1000))),
  ])('rejects auth, contradictory, missing and oversized maps', value => {
    expect(() => parseRidemoviReply(value, 86, lat, lng)).toThrow();
  });

  it.each([
    { cityId: 87 }, { bikeType: 'E1' }, { bikeType: 'new-unreviewed-type' }, { id: -1 },
    { lat: NaN }, { lon: 181 }, { distance: 3 },
  ])('rejects a wrong city, non-scooter or inconsistent position: %j', change => {
    expect(() => parseRidemoviReply(reply([{ ...bike(), ...change }]), 86, lat, lng)).toThrow();
  });

  it('rejects unsorted lists and duplicate identities, and does not turn a pile into complete coverage', () => {
    expect(() => parseRidemoviReply(reply([bike(1, 0.02), bike(2)]), 86, lat, lng)).toThrow('nearest first');
    expect(() => parseRidemoviReply(reply([bike(), bike()]), 86, lat, lng)).toThrow('repeats');
    expect(() => parseRidemoviReply(reply(Array.from({ length: RIDEMOVI_PAGE }, (_, i) => bike(i + 1, 0))), 86, lat, lng)).toThrow('clustered');
  });

  it('leaves missing or implausible battery and range unknown', () => {
    const value = reply([{ ...bike(), bikePowerBatteryStatus: { soc: 140, lockId: '' }, estimatedTravelDistanceInKM: -1 }]);
    expect(parseRidemoviReply(value, 86, lat, lng).scooters[0]).toMatchObject({ battery: null, range_m: null });
  });
});

async function harness(fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(reply()))) {
  const directory = await mkdtemp(join(tmpdir(), 'ridemovi-test-'));
  directories.push(directory);
  const sessionPath = join(directory, 'session.json');
  const token = 'a'.repeat(32);
  await writeFile(sessionPath, JSON.stringify({ version: 1, token }), { mode: 0o600 });
  let now = 10_000;
  const client = new RidemoviClient({ sessionPath, fetch: fetcher, now: () => now, intervalMs: 0 });
  return { client, fetcher, sessionPath, token, advance: (ms: number) => { now += ms; } };
}

describe('RideMovi private session and transport', () => {
  it('spaces default map requests five seconds apart even when the caller asks again immediately', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(reply()));
    const { sessionPath } = await harness(fetcher);
    vi.useFakeTimers();
    try {
      const client = new RidemoviClient({ sessionPath, fetch: fetcher });
      await client.nearest(86, lat, lng);
      const next = client.nearest(86, lat, lng);
      await vi.advanceTimersByTimeAsync(4_999);
      expect(fetcher).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await next;
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally { vi.useRealTimers(); }
  });

  it('only reads the map, sends the token in a header, disables redirects and bounds the request', async () => {
    const { client, fetcher, token } = await harness();
    await client.nearest(86, lat, lng);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://api.ridemoviapp.com/bike/nearby?ridingStatus=0&vehicleType=escooter&areaLimit=1');
    expect(init).toMatchObject({ redirect: 'error', headers: { Authorization: `Bearer ${token}`, AppVersion: '5.2.0',
      'X-Vivi-Latitude': String(lat), 'X-Vivi-Longitude': String(lng) } });
    expect(init?.body).toBeUndefined();
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('never sends a request with a missing, malformed or world-readable session', async () => {
    const { client, fetcher, sessionPath } = await harness();
    await chmod(sessionPath, 0o644);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('not private');
    await chmod(sessionPath, 0o600);
    await writeFile(sessionPath, 'invalid-secret-text');
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('session is missing');
    await rm(sessionPath);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('session is missing');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('stops reusing a rejected token and reads a replacement without restarting', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ code: 15000, message: 'secret upstream text' }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, sessionPath } = await harness(fetcher);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('new operator login');
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('new operator login');
    expect(fetcher).toHaveBeenCalledTimes(1);
    await writeFile(sessionPath, JSON.stringify({ version: 1, token: 'b'.repeat(32) }));
    expect((await client.nearest(86, lat, lng)).scooters).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('honours Retry-After and holds queued requests after a failure', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '120' } }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('HTTP 429');
    advance(119_999);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('held');
    expect(fetcher).toHaveBeenCalledTimes(1);
    advance(1);
    await expect(client.nearest(86, lat, lng)).resolves.toBeDefined();
  });

  it('requires replacement after HTTP 401', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('private upstream response', { status: 401 }));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('HTTP 401');
    advance(60_000);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('new operator login');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('backs off a generic 403 without treating it as proof of an expired session', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('HTTP protection', { status: 403 }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('HTTP 403');
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('held');
    advance(RIDEMOVI_FORBIDDEN_RETRY_MS - 1);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('held');
    expect(fetcher).toHaveBeenCalledTimes(1);
    advance(1);
    await expect(client.nearest(86, lat, lng)).resolves.toBeDefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not expose transport secrets or an oversized upstream body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('Authorization secret'))
      .mockResolvedValueOnce(new Response('x'.repeat(2 * 1024 * 1024 + 1)));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow(/^RideMovi request failed or timed out$/);
    advance(60_000);
    await expect(client.nearest(86, lat, lng)).rejects.toThrow('size limit');
  });
});

describe('RideMovi collector registration', () => {
  it('registers Dresden with a reviewed outline, a private app collector and paced scheduling', () => {
    expect(isAppMapSystem(system)).toBe(true);
    expect(areas.areas).toHaveLength(1);
    const area = areas.areas[0];
    expect(area).toMatchObject({ id: system.ridemoviAppArea, cityId: 86 });
    expect(area.rings.every(ring => ring.length >= 4 && ring.every(([a, b]) => boundsContainPoint(system.bounds, a, b)))).toBe(true);
    const feed = withRidemoviAppCollectors(independentCollectableFeeds(), [system], () => [])
      .find(feed => feed.id === 'germany:ridemovi_de_dresden');
    expect(feed).toMatchObject({ provider: 'ridemovi', paced: true, idleIntervalMs: 2 * 60 * 60_000, watchMs: 2 * 60_000 });
    expect(feed?.zoneSource).toBeUndefined();
  });

  it('publishes only scooters in the reviewed area and never converts a failed sweep to an empty success', async () => {
    const nearest = vi.fn().mockResolvedValue({ completeM: 100_000, scooters: [
      { id: '1', lat, lng, battery: 73, range_m: 18000 },
      { id: '2', lat: 51.1, lng: 13.87, battery: 22, range_m: null },
    ] });
    const result = await collectRidemoviArea(system, [], { nearest });
    expect(result.vehicles).toEqual([{ provider: 'ridemovi', vehicle_id: 'ridemovi:1', lat, lng, battery: 73,
      range_m: 18000, deep_link: null, distance_m: null }]);
    expect(result.observedAt).toBeLessThanOrEqual(Date.now());
    expect(nearest.mock.calls[0][0]).toBe(86);
    nearest.mockResolvedValue({ completeM: 100_000, scooters: [] });
    await expect(collectRidemoviArea(system, [], { nearest })).rejects.toThrow('no scooter anywhere');
    nearest.mockRejectedValue(new Error('expired login'));
    await expect(collectRidemoviArea(system, [], { nearest })).rejects.toThrow('expired login');
  });
});
