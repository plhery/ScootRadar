import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import areas from '../data/ridemovi-areas.json';
import { haversineM, boundsContainPoint, polygonContainsPoint } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { collectRidemoviArea, parseRidemoviReply, RIDEMOVI_FORBIDDEN_RETRY_MS, RIDEMOVI_PAGE, RIDEMOVI_SHORT, RidemoviClient, withRidemoviAppCollectors } from './ridemoviApp';

const lat = 51.0504, lng = 13.7373;
const bike = (id = 1, offset = 0.01) => ({ id, lat: lat + offset, lon: lng, cityId: 86, bikeType: 'SN1',
  distance: haversineM(lat, lng, lat + offset, lng), bikePowerBatteryStatus: { soc: 73, lockId: 'private-lock-id' },
  estimatedTravelDistanceInKM: 18.256, bikeNo: 'private-qr-id' });
const reply = (bikes: unknown[] = [bike()]) => ({ code: 1000, data: { showNearbyBikes: true, nearbyBikes: bikes } });
const system = REGIONAL_SCOOTER_SYSTEMS.find(s => s.id === 'ridemovi_de_dresden')!;
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

describe('RideMovi response coverage', () => {
  it('keeps position, battery and range, and certifies the 2 km radius for a reply of five or fewer', () => {
    const result = parseRidemoviReply(reply(), lat, lng);
    expect(result.scooters).toEqual([{ id: '1', lat: lat + 0.01, lng, battery: 73, range_m: 18256 }]);
    expect(result.completeM).toBe(1_975);
    expect(JSON.stringify(result)).not.toContain('private');
    const five = reply(Array.from({ length: RIDEMOVI_SHORT }, (_, i) => bike(i + 1, (i + 1) * 0.001)));
    expect(parseRidemoviReply(five, lat, lng).completeM).toBe(1_975);
  });

  it('certifies a full page only up to its last scooter, and never beyond the radius', () => {
    const page = (step: number) => reply(Array.from({ length: RIDEMOVI_PAGE }, (_, i) => bike(i + 1, (i + 1) * step)));
    const near = parseRidemoviReply(page(0.0002), lat, lng);
    expect(near.completeM).toBeCloseTo(haversineM(lat, lng, lat + 0.006, lng) * 0.99 - 5);
    expect(parseRidemoviReply(page(0.001), lat, lng).completeM).toBe(1_975);
  });

  it.each([RIDEMOVI_SHORT + 1, 19, 26, RIDEMOVI_PAGE - 1])('certifies a reply of %i, short of a page, only up to its last scooter', length => {
    // RideMovi leaves out the scooters a rider cannot rent from its 30 nearest: on 22 November 2026 Bergen's
    // reply of 26 ended 342 m away, and 84 scooters other replies showed within 2 km of its point were not in it.
    const value = reply(Array.from({ length }, (_, i) => bike(i + 1, (i + 1) * 0.0001)));
    expect(parseRidemoviReply(value, lat, lng).completeM).toBeCloseTo(haversineM(lat, lng, lat + length * 0.0001, lng) * 0.99 - 5);
  });

  it('reads a hidden, empty list as no scooter within the radius (SCOOTRADAR-CACHE-69)', () => {
    expect(parseRidemoviReply({ code: 1000, data: { showNearbyBikes: false, nearbyBikes: [] } }, lat, lng))
      .toEqual({ scooters: [], completeM: 1_975 });
  });

  it.each([
    { code: 15000, data: {} }, reply([]), { code: 1000, data: { nearbyBikes: [bike()] } },
    { code: 1000, data: { showNearbyBikes: false, nearbyBikes: [bike()] } }, { code: 1000, data: { showNearbyBikes: false } },
    reply(Array.from({ length: 31 }, (_, i) => bike(i + 1, (i + 1) / 1000))),
  ])('rejects auth, contradictory, missing and oversized maps', value => {
    expect(() => parseRidemoviReply(value, lat, lng)).toThrow();
  });

  it.each([
    { cityId: 0 }, { cityId: '86' }, { bikeType: 'E1' }, { bikeType: 'new-unreviewed-type' }, { id: -1 },
    { lat: NaN }, { lon: 181 }, { distance: 3 },
  ])('rejects a missing city, non-scooter or inconsistent position: %j', change => {
    expect(() => parseRidemoviReply(reply([{ ...bike(), ...change }]), lat, lng)).toThrow();
  });

  it('keeps the scooters of a neighbouring town, which count towards coverage like the others', () => {
    // On the edge between Dortmund's area and Bochum's a reply listed both towns' scooters.
    const mixed = Array.from({ length: RIDEMOVI_PAGE }, (_, i) => ({ ...bike(i + 1, (i + 1) / 10_000), cityId: i % 3 ? 90 : 99 }));
    const result = parseRidemoviReply(reply(mixed), lat, lng);
    expect(result.scooters).toHaveLength(RIDEMOVI_PAGE);
    expect(result.completeM).toBeCloseTo(haversineM(lat, lng, lat + RIDEMOVI_PAGE / 10_000, lng) * 0.99 - 5);
  });

  it('rejects unsorted lists and duplicate identities, and does not turn a pile into any coverage', () => {
    expect(() => parseRidemoviReply(reply([bike(1, 0.02), bike(2)]), lat, lng)).toThrow('nearest first');
    expect(() => parseRidemoviReply(reply([bike(), bike()]), lat, lng)).toThrow('repeats');
    // A pile vouches for nothing: the sweep asks closer in and keeps the scooters it saw there.
    expect(parseRidemoviReply(reply(Array.from({ length: RIDEMOVI_PAGE }, (_, i) => bike(i + 1, 0))), lat, lng).completeM).toBe(0);
    expect(parseRidemoviReply(reply(Array.from({ length: RIDEMOVI_SHORT + 1 }, (_, i) => bike(i + 1, 0.00001))), lat, lng).completeM).toBe(0);
  });

  it('leaves missing or implausible battery and range unknown', () => {
    const value = reply([{ ...bike(), bikePowerBatteryStatus: { soc: 140, lockId: '' }, estimatedTravelDistanceInKM: -1 }]);
    expect(parseRidemoviReply(value, lat, lng).scooters[0]).toMatchObject({ battery: null, range_m: null });
  });

  it('rounds a fractional charge to a whole percent, which the iPhone app needs to read the answer', () => {
    const value = reply([{ ...bike(), bikePowerBatteryStatus: { soc: 57.5, lockId: '' } }]);
    expect(parseRidemoviReply(value, lat, lng).scooters[0].battery).toBe(58);
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
      await client.nearest(lat, lng);
      const next = client.nearest(lat, lng);
      await vi.advanceTimersByTimeAsync(4_999);
      expect(fetcher).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await next;
      expect(fetcher).toHaveBeenCalledTimes(2);
    } finally { vi.useRealTimers(); }
  });

  it('only reads the map, sends the token in a header, disables redirects and bounds the request', async () => {
    const { client, fetcher, token } = await harness();
    await client.nearest(lat, lng);
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
    await expect(client.nearest(lat, lng)).rejects.toThrow('not private');
    await chmod(sessionPath, 0o600);
    await writeFile(sessionPath, 'invalid-secret-text');
    await expect(client.nearest(lat, lng)).rejects.toThrow('session is missing');
    await rm(sessionPath);
    await expect(client.nearest(lat, lng)).rejects.toThrow('session is missing');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('stops reusing a rejected token and reads a replacement without restarting', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ code: 15000, message: 'secret upstream text' }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, sessionPath } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    expect(fetcher).toHaveBeenCalledTimes(1);
    await writeFile(sessionPath, JSON.stringify({ version: 1, token: 'b'.repeat(32) }));
    expect((await client.nearest(lat, lng)).scooters).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('honours Retry-After and holds queued requests after a failure', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '120' } }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('HTTP 429');
    advance(119_999);
    await expect(client.nearest(lat, lng)).rejects.toThrow('held');
    expect(fetcher).toHaveBeenCalledTimes(1);
    advance(1);
    await expect(client.nearest(lat, lng)).resolves.toBeDefined();
  });

  it('requires replacement after HTTP 401', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('private upstream response', { status: 401 }));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('HTTP 401');
    advance(60_000);
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('backs off a generic 403 without treating it as proof of an expired session', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('HTTP protection', { status: 403 }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('HTTP 403');
    await expect(client.nearest(lat, lng)).rejects.toThrow('held');
    advance(RIDEMOVI_FORBIDDEN_RETRY_MS - 1);
    await expect(client.nearest(lat, lng)).rejects.toThrow('held');
    expect(fetcher).toHaveBeenCalledTimes(1);
    advance(1);
    await expect(client.nearest(lat, lng)).resolves.toBeDefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not expose transport secrets or an oversized upstream body', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error('Authorization secret'))
      .mockResolvedValueOnce(new Response('x'.repeat(2 * 1024 * 1024 + 1)));
    const { client, advance } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow(/^RideMovi request failed or timed out$/);
    advance(60_000);
    await expect(client.nearest(lat, lng)).rejects.toThrow('size limit');
  });
});

describe('RideMovi collector registration', () => {
  // Every RideMovi scooter area that had scooters on 22 November 2026, by town (docs/ridemovi-app-map.md, Towns).
  const TOWNS: Record<string, string> = {
    ridemovi_de_dresden: '1286', ridemovi_de_aachen: '1191', ridemovi_de_bochum: '1563', ridemovi_de_bonn: '1585',
    ridemovi_de_dortmund: '1406', ridemovi_de_essen: '1532', ridemovi_de_koeln: '1533', ridemovi_de_muenchen: '1534',
    ridemovi_de_wuppertal: '1451', ridemovi_no_bergen: '1552', ridemovi_it_parma: '1187', ridemovi_it_piacenza: '1539',
    ridemovi_it_vicenza: '1181', ridemovi_it_lecce: '1499', ridemovi_it_alghero: '1586', ridemovi_it_imperia: '1414',
  };
  const towns = REGIONAL_SCOOTER_SYSTEMS.filter(town => town.ridemoviAppArea);

  it('reads each reviewed outline in one town, and no other', () => {
    expect(Object.fromEntries(towns.map(town => [town.id, town.ridemoviAppArea]))).toEqual(TOWNS);
    expect(areas.areas.map(area => area.id).sort()).toEqual(Object.values(TOWNS).sort());
    expect(areas.areas.find(area => area.id === '1286')).toMatchObject({ cityId: 86, name: 'Dresden_OPS' });
  });

  it.each(towns.map(town => [town.id, town] as const))('registers %s with its outline, a private app collector and paced scheduling', (id, town) => {
    expect(isAppMapSystem(town)).toBe(true);
    const area = areas.areas.find(area => area.id === town.ridemoviAppArea)!;
    expect(area.rings.every(ring => ring.length >= 4 && ring.every(([a, b]) => boundsContainPoint(town.bounds, a, b)))).toBe(true);
    expect(area.rings.some(ring => polygonContainsPoint(ring as [number, number][], town.center[0], town.center[1]))).toBe(true);
    const feed = withRidemoviAppCollectors(independentCollectableFeeds(), towns, () => [])
      .find(feed => feed.id.endsWith(`:${id}`));
    expect(feed).toMatchObject({ provider: 'ridemovi', paced: true, watchMs: 2 * 60_000 });
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
    expect(nearest.mock.calls[0]).toHaveLength(2);
    nearest.mockResolvedValue({ completeM: 100_000, scooters: [] });
    await expect(collectRidemoviArea(system, [], { nearest })).rejects.toThrow('no scooter anywhere');
    nearest.mockRejectedValue(new Error('expired login'));
    await expect(collectRidemoviArea(system, [], { nearest })).rejects.toThrow('expired login');
  });

  it('keeps the scooters of a pile with nothing else near it instead of failing the sweep', async () => {
    // Six scooters on one spot, the only ones within 2 km: no reply vouches for the spot itself.
    const spot = { lat: 51.05, lng: 13.74 };
    const pile = Array.from({ length: RIDEMOVI_SHORT + 1 }, (_, i) => ({ id: String(i + 1), ...spot, battery: 50, range_m: null }));
    const nearest = vi.fn(async (qLat: number, qLng: number) => {
      const distance = haversineM(qLat, qLng, spot.lat, spot.lng);
      return distance > 2_000 ? { scooters: [], completeM: 1_975 } : { scooters: pile, completeM: Math.max(0, distance * 0.99 - 5) };
    });
    const result = await collectRidemoviArea(system, [], { nearest });
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual(pile.map(scooter => `ridemovi:${scooter.id}`).sort());
    expect(nearest.mock.calls.length).toBeLessThan(200);
  });
});
