import { chmod, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import areas from '../data/ridemovi-areas.json';
import { haversineM, boundsContainPoint, polygonContainsPoint } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';
import { collectRidemoviArea, parseRidemoviReply, RIDEMOVI_FORBIDDEN_RETRY_MS, RIDEMOVI_PAGE, RIDEMOVI_RADIUS_M, RIDEMOVI_SHORT, RidemoviClient,
  RidemoviSweepCheckpoints, withRidemoviAppCollectors, type RidemoviScooter } from './ridemoviApp';
import { CHECKPOINT_MAX_AGE_MS } from './sweepCheckpoints';
import { withinCollection } from './sweeps';

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
  const onLoginNeeded = vi.fn();
  const client = new RidemoviClient({ sessionPath, fetch: fetcher, now: () => now, intervalMs: 0, onLoginNeeded });
  return { client, fetcher, sessionPath, token, onLoginNeeded, advance: (ms: number) => { now += ms; } };
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

  it('tells the operator once that the session file cannot be read, and again only after it was read', async () => {
    const { client, sessionPath, onLoginNeeded } = await harness();
    await chmod(sessionPath, 0o644);
    await expect(client.nearest(lat, lng)).rejects.toThrow('not private');
    await expect(client.nearest(lat, lng)).rejects.toThrow('not private');
    expect(onLoginNeeded).toHaveBeenCalledTimes(1);
    expect(onLoginNeeded).toHaveBeenCalledWith({ reason: 'SessionUnreadable', phrase: expect.stringContaining('session file') });
    await chmod(sessionPath, 0o600);
    await client.nearest(lat, lng);
    await rm(sessionPath);
    await expect(client.nearest(lat, lng)).rejects.toThrow('session is missing');
    expect(onLoginNeeded).toHaveBeenCalledTimes(2);
  });

  it('stops reusing a rejected token and reads a replacement without restarting', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ code: 15000, message: 'secret upstream text' }))
      .mockResolvedValueOnce(Response.json(reply()));
    const { client, sessionPath, onLoginNeeded } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(onLoginNeeded).toHaveBeenCalledTimes(1);
    expect(onLoginNeeded).toHaveBeenCalledWith({ reason: 'TokenRefused', phrase: 'its token was refused (code 15000); log in again' });
    expect(JSON.stringify(onLoginNeeded.mock.calls)).not.toMatch(/a{32}|secret/);
    await writeFile(sessionPath, JSON.stringify({ version: 1, token: 'b'.repeat(32) }));
    expect((await client.nearest(lat, lng)).scooters).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(onLoginNeeded).toHaveBeenCalledTimes(1);
  });

  it('tells each refused token once, a replacement refused in its turn included', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ code: 15000 }))
      .mockResolvedValueOnce(new Response('', { status: 401 }));
    const { client, sessionPath, onLoginNeeded, advance } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    await writeFile(sessionPath, JSON.stringify({ version: 1, token: 'b'.repeat(32) }));
    await expect(client.nearest(lat, lng)).rejects.toThrow('HTTP 401');
    advance(60_000);
    await expect(client.nearest(lat, lng)).rejects.toThrow('new operator login');
    expect(onLoginNeeded.mock.calls).toEqual([
      [{ reason: 'TokenRefused', phrase: 'its token was refused (code 15000); log in again' }],
      [{ reason: 'TokenRefused', phrase: 'its token was refused (HTTP 401); log in again' }]]);
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
    const { client, advance, onLoginNeeded } = await harness(fetcher);
    await expect(client.nearest(lat, lng)).rejects.toThrow('HTTP 403');
    await expect(client.nearest(lat, lng)).rejects.toThrow('held');
    advance(RIDEMOVI_FORBIDDEN_RETRY_MS - 1);
    await expect(client.nearest(lat, lng)).rejects.toThrow('held');
    expect(fetcher).toHaveBeenCalledTimes(1);
    advance(1);
    await expect(client.nearest(lat, lng)).resolves.toBeDefined();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(onLoginNeeded).not.toHaveBeenCalled();
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
    ridemovi_gr_thessaloniki: '1215', ridemovi_gr_volos: '1441', ridemovi_es_playa_de_las_americas: '1019',
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

describe('RideMovi sweeps resumed after a deploy', () => {
  const WAIT = { timeout: 10_000, interval: 20 };
  const rings = areas.areas.find(area => area.id === system.ridemoviAppArea)!.rings as [number, number][][];
  // 400 scooters spread over Dresden's outline, the same each run.
  const fleet: RidemoviScooter[] = [];
  for (let seed = 7; fleet.length < 400;) {
    const next = () => (seed = (seed * 48_271) % 2_147_483_647) / 2_147_483_647;
    const point = { lat: system.bounds.south + next() * (system.bounds.north - system.bounds.south),
      lng: system.bounds.west + next() * (system.bounds.east - system.bounds.west) };
    if (rings.some(ring => polygonContainsPoint(ring, point.lat, point.lng))) fleet.push({ id: String(fleet.length + 1), ...point, battery: 60, range_m: 20_000 });
  }
  // RideMovi's map as parseRidemoviReply reads it: the 30 nearest within 2 km, vouching up to the last unless five or fewer.
  const map = () => vi.fn(async (lat: number, lng: number) => {
    const near = fleet.map(scooter => ({ scooter, d: haversineM(lat, lng, scooter.lat, scooter.lng) }))
      .filter(({ d }) => d <= RIDEMOVI_RADIUS_M).sort((a, b) => a.d - b.d).slice(0, RIDEMOVI_PAGE);
    const reach = near.length <= RIDEMOVI_SHORT ? RIDEMOVI_RADIUS_M : near.at(-1)!.d;
    return { scooters: near.map(({ scooter }) => scooter), completeM: Math.max(0, reach * 0.99 - 5) };
  });
  let directory: string;
  let path: string;
  let logged: Record<string, unknown>[];
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'ridemovi-sweeps-'));
    path = new RidemoviSweepCheckpoints({ directory }).path(system.id);
    logged = [];
    vi.spyOn(console, 'log').mockImplementation(line => { logged.push(JSON.parse(String(line))); });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });
  const saved = async () => JSON.parse(await readFile(path, 'utf8'));
  const gone = () => expect(stat(path)).rejects.toThrow('ENOENT');
  /** The map, answering `replies` times and then never again, as the cache a deploy stops. */
  const stoppedAfter = (replies: number, nearest: ReturnType<typeof map>) => {
    let calls = 0;
    return { nearest: (lat: number, lng: number) => ++calls <= replies ? nearest(lat, lng) : new Promise<never>(() => undefined) };
  };

  it('saves where the sweep stands after each reply as ridemovi-sweep.<town>.tmp, and removes it once the sweep ends, done or failed', async () => {
    expect(path).toBe(join(directory, 'ridemovi-sweep.ridemovi_de_dresden.tmp'));
    const nearest = map();
    void collectRidemoviArea(system, [], stoppedAfter(4, nearest), undefined, new RidemoviSweepCheckpoints({ directory }));
    await vi.waitFor(async () => expect((await saved()).discs).toHaveLength(4), WAIT);
    const checkpoint = await saved();
    // Its requests count those still under way, up to three at once.
    expect(checkpoint).toMatchObject({ system: system.id, startedAt: expect.any(Number), savedAt: expect.any(Number) });
    expect(checkpoint.requests).toBeGreaterThanOrEqual(4);
    expect(Object.keys(checkpoint.scooters[0]).sort()).toEqual(['battery', 'id', 'lat', 'lng', 'range_m']);
    await rm(path);

    await collectRidemoviArea(system, [], { nearest }, undefined, new RidemoviSweepCheckpoints({ directory }));
    await gone();
    let calls = 0;
    const failing = { nearest: async (lat: number, lng: number) => {
      if (++calls > 3) throw new Error('RideMovi map HTTP 500');
      return nearest(lat, lng);
    } };
    await expect(collectRidemoviArea(system, [], failing, undefined, new RidemoviSweepCheckpoints({ directory }))).rejects.toThrow('HTTP 500');
    await gone();
  }, 30_000);

  it('resumes a sweep a deploy stopped, from its start, for fewer requests, and starts again from a stale or broken one', async () => {
    const nearest = map();
    const whole = await collectRidemoviArea(system, [], { nearest }, undefined, new RidemoviSweepCheckpoints({ directory }));
    const wholeRequests = nearest.mock.calls.length;
    expect(whole.vehicles).toHaveLength(fleet.length);
    expect(logged.at(-1)).not.toHaveProperty('resumed');

    void collectRidemoviArea(system, [], stoppedAfter(6, nearest), undefined, new RidemoviSweepCheckpoints({ directory }));
    await vi.waitFor(async () => expect((await saved()).discs).toHaveLength(6), WAIT);
    const checkpoint = await saved();
    const before = nearest.mock.calls.length;
    const resumed = await collectRidemoviArea(system, [], { nearest }, undefined, new RidemoviSweepCheckpoints({ directory }));
    const requests = nearest.mock.calls.length - before;
    expect(requests).toBeLessThan(wholeRequests);
    expect(resumed.observedAt).toBe(checkpoint.startedAt);
    expect(resumed.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual(whole.vehicles.map(vehicle => vehicle.vehicle_id).sort());
    expect(logged.at(-1)).toMatchObject({ event: 'ridemovi_sweep', system: system.id, resumed: true, resumedRequests: checkpoint.requests,
      requests: checkpoint.requests + requests });
    await gone();

    for (const left of [JSON.stringify({ ...checkpoint, savedAt: Date.now() - CHECKPOINT_MAX_AGE_MS - 1 }),
      JSON.stringify({ ...checkpoint, startedAt: Date.now() - 2 * 60 * 60_000 }), JSON.stringify({ ...checkpoint, system: 'ridemovi_de_bonn' }),
      JSON.stringify({ ...checkpoint, scooters: [{ id: 1, lat: 51, lng: 13 }] }), '{"system":']) {
      await writeFile(path, left);
      const from = nearest.mock.calls.length;
      const fresh = await collectRidemoviArea(system, [], { nearest }, undefined, new RidemoviSweepCheckpoints({ directory }));
      expect(nearest.mock.calls.length - from).toBe(wholeRequests);
      expect(fresh.observedAt).toBeGreaterThan(checkpoint.startedAt);
      expect(logged.at(-1)).not.toHaveProperty('resumed');
      await gone();
    }
  }, 60_000);

  it('shows what the stopped sweep had found at once, as old as that sweep', async () => {
    const startedAt = Date.now() - 30 * 60_000;
    await writeFile(path, JSON.stringify({ system: system.id, startedAt, requests: 3, discs: [{ lat, lng, r: 300 }],
      scooters: [{ id: 'seen-before-deploy', lat, lng, battery: 50, range_m: 9_000 }], savedAt: Date.now() - 60_000 }));
    const reports: Vehicle[][] = [];
    const began: number[] = [];
    const collection = { urgent: () => false, focus: () => undefined, progress: (found: Vehicle[]) => { reports.push(found); },
      sweepStarted: (at: number) => { began.push(at); } };
    const hanging = { nearest: () => new Promise<never>(() => undefined) };
    void withinCollection(collection, () => collectRidemoviArea(system, [], hanging, undefined, new RidemoviSweepCheckpoints({ directory })));
    await vi.waitFor(() => expect(reports).toHaveLength(1), WAIT);
    expect(began).toEqual([startedAt]);
    expect(reports[0].map(vehicle => vehicle.vehicle_id)).toEqual(['ridemovi:seen-before-deploy']);
  });

  it('gives the cache\'s collectors checkpoints read after the client\'s start hold', async () => {
    const feed = withRidemoviAppCollectors(independentCollectableFeeds(), [system], () => [], { nearest: map() },
      new RidemoviSweepCheckpoints({ directory })).find(feed => feed.id.endsWith(`:${system.id}`))!;
    await feed.collect();
    expect(logged.at(-1)).toMatchObject({ event: 'ridemovi_sweep', system: system.id });
    await gone();
  }, 30_000);
});
