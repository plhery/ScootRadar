import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BIRD_BRANDS, BIRD_BURST_EVERY_MS, BIRD_CHECKPOINT_MAX_AGE_MS, BIRD_IDLE_GRACE_MS, BIRD_IDLE_INTERVAL_MS, BIRD_PAGE, BIRD_QUERY_INTERVAL_MS, BIRD_UNTRUSTED_HOLD_MS,
  BIRD_WATCH_MS, BirdClient, BirdSweepCheckpoints, BirdUntrustedMapError, birdVehicle, collectBirdArea, parseBirdReply, sweepBirdArea, sweepScope,
  withBirdAppCollectors, type BirdScooter } from './birdApp';
import type { NearestProgress } from './nearestSweep';
import { currentCollection, withinCollection } from './sweeps';
import { haversineM, polygonContainsPoint } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { buildCityOverview, querySnapshot, type FeedSnapshot } from '../src/lib/scooterSnapshots';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { COUNTRY_SOURCES } from '../src/generated/countries';

const BIRD = 'df76d602-dd1a-4ce4-a64f-2e5dd8c6f845';
const SPIN = '37f4f15f-d73b-4f1e-8f52-5de2782bd447';
// A level-9 cell of face 4, as the map lists them.
const CELL = '-9114779870449106944';
const at = { lat: 30.2672, lng: -97.7431 };
/** How long the sweeps' tests wait for a sweep to reach a point: the whole suite's load can slow one past a second. */
const WAIT = { timeout: 10_000, interval: 20 };
let serial = 0;
const id = () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}`;
const bird = (lat: number, lng: number, extra: Record<string, unknown> = {}) => ({
  id: id(), brand_id: BIRD, area_key: '0123456789ABCDEF0123456789ABCDEF', vehicle_class: 'scooter', captive: false,
  location: { latitude: lat, longitude: lng }, battery_level: 70, estimated_range: 12_000, ...extra,
});
/** Vehicles i × 10 m north of the point, nearest first, as the map lists them. */
const north = (count: number, extra: Record<string, unknown> = {}) =>
  Array.from({ length: count }, (_, i) => bird(at.lat + (i + 1) * 10 / 111_320, at.lng, extra));

describe('Bird map replies', () => {
  it('keeps the rentable scooters of both brands its map shows, and vouches for its radius unless the page is full', () => {
    const birds = [...north(2), bird(at.lat + 0.0003, at.lng, { brand_id: SPIN, battery_level: null, estimated_range: -1 }),
      bird(at.lat + 0.0004, at.lng, { captive: true }), bird(at.lat + 0.0005, at.lng, { vehicle_class: 'bicycle' })];
    const reply = parseBirdReply({ birds, cell_ids: [CELL] }, at.lat, at.lng, 5_000);
    expect(reply.scooters.map(scooter => scooter.brand)).toEqual(['bird', 'bird', 'spin']);
    expect(reply.scooters[0]).toMatchObject({ lat: birds[0].location.latitude, lng: at.lng, battery: 70, range: 12_000 });
    expect(reply.scooters[2]).toMatchObject({ battery: null, range: null });
    expect(reply.completeM).toBeCloseTo(5_000 * 0.997 - 1);
    expect(parseBirdReply({ birds: [], cell_ids: [CELL] }, at.lat, at.lng, 5_000).scooters).toEqual([]);

    const full = north(BIRD_PAGE);
    const last = full.at(-1)!.location;
    expect(parseBirdReply({ birds: full, cell_ids: [CELL] }, at.lat, at.lng, 5_000).completeM)
      .toBeCloseTo(haversineM(at.lat, at.lng, last.latitude, last.longitude) * 0.997 - 1);
    // Captive vehicles and bicycles fill the page too.
    expect(parseBirdReply({ birds: north(BIRD_PAGE, { captive: true }), cell_ids: [CELL] }, at.lat, at.lng, 5_000).completeM).toBeLessThan(2_600);
    expect(parseBirdReply({ birds: north(3), cell_ids: [CELL], reached_response_limit: true }, at.lat, at.lng, 5_000).completeM).toBeLessThan(30);
  });

  it('publishes a battery as a whole percent, as the answer\'s schema says, which the iPhone app decodes no other way', () => {
    const reply = parseBirdReply({ birds: [bird(at.lat + 0.0001, at.lng, { battery_level: 57.5 }), bird(at.lat + 0.0002, at.lng, { battery_level: 0.4 })],
      cell_ids: [CELL] }, at.lat, at.lng, 5_000);
    expect(reply.scooters.map(scooter => birdVehicle('bird', scooter).battery)).toEqual([58, 0]);
    expect(birdVehicle('spin', { ...reply.scooters[0], battery: null }).battery).toBeNull();
  });

  it('refuses the made-up maps it served on 27 October 2026, and any it cannot vouch for', () => {
    const one = north(1)[0];
    for (const [payload, reason] of [
      [{ birds: [] }, 'shape'],
      [{ birds: north(BIRD_PAGE + 1), cell_ids: [CELL] }, 'shape'],
      [{ birds: [one], cell_ids: [] }, 'cells'],
      [{ birds: [one], cell_ids: ['8'] }, 'cells'],
      [{ birds: [one], cell_ids: [CELL, CELL] }, 'cells'],
      [{ birds: [{ ...one, id: 'B-1' }], cell_ids: [CELL] }, 'identity'],
      [{ birds: [one, one], cell_ids: [CELL] }, 'identity'],
      // Made-up scooters had no brand, and invented areas.
      [{ birds: [{ ...one, brand_id: undefined }], cell_ids: [CELL] }, 'brand'],
      [{ birds: [{ ...one, brand_id: id() }], cell_ids: [CELL] }, 'brand'],
      [{ birds: [{ ...one, area_key: 'area' }], cell_ids: [CELL] }, 'vehicle'],
      [{ birds: [{ ...one, location: { latitude: 'x', longitude: 0 } }], cell_ids: [CELL] }, 'position'],
      // and stood in a line north-east of the point, beyond the radius.
      [{ birds: [bird(at.lat + 0.05, at.lng + 0.05)], cell_ids: [CELL] }, 'beyond radius'],
      [{ birds: north(2).reverse(), cell_ids: [CELL] }, 'not nearest first'],
    ] as const) {
      expect(() => parseBirdReply(payload, at.lat, at.lng, 5_000)).toThrow(new BirdUntrustedMapError(reason).message);
    }
    expect(Object.keys(BIRD_BRANDS)).toEqual([BIRD, SPIN]);
  });
});

const token = (exp: number, sub = 'rider') => ['{"alg":"none"}', JSON.stringify({ sub, exp: Math.floor(exp / 1000) }), 'sig']
  .map(part => Buffer.from(part).toString('base64url')).join('.');
const HOUR = 3600_000;
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('Bird map client', () => {
  let directory: string;
  let sessionPath: string;
  let now: number;
  const session = (accessExp: number, refresh = token(now + 180 * 24 * HOUR, 'refresh')) =>
    ({ version: 1, deviceId: '11111111-2222-4333-8444-555555555555', accessToken: token(accessExp), refreshToken: refresh });
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'bird-'));
    sessionPath = join(directory, 'bird-session.json');
    now = 1_800_000_000_000;
  });
  afterEach(() => rm(directory, { recursive: true, force: true }));
  const client = (fetcher: typeof fetch) => new BirdClient({ sessionPath, fetch: fetcher, now: () => now, intervalMs: 0, timeoutMs: 1_000 });

  it('asks as the app does, standing where it asks', async () => {
    await writeFile(sessionPath, JSON.stringify(session(now + 20 * HOUR)));
    const fetcher = vi.fn<typeof fetch>(async () => ok({ birds: north(1), cell_ids: [CELL] }));
    expect((await client(fetcher).nearest(at.lat, at.lng, 4_000)).scooters).toHaveLength(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe(`https://api-bird.prod.birdapp.com/bird/nearby?latitude=${at.lat}&longitude=${at.lng}&radius=4000`);
    expect(init?.headers).toMatchObject({ 'App-Name': 'bird', 'App-Type': 'rider', Platform: 'android', 'App-Version': '4.420.0.2',
      'Device-Id': '11111111-2222-4333-8444-555555555555', Authorization: `Bearer ${token(now + 20 * HOUR)}`,
      Location: JSON.stringify({ latitude: at.lat, longitude: at.lng }) });
    expect(init?.redirect).toBe('error');
    await expect(client(fetcher).nearest(at.lat, at.lng, 5_001)).rejects.toThrow('Invalid Bird map request');
  });

  it('renews its token an hour before it expires, and keeps a login saved meanwhile', async () => {
    await writeFile(sessionPath, JSON.stringify(session(now + 30 * 60_000)));
    const renewed = token(now + 24 * HOUR);
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('/auth/refresh/token')) {
        expect(init?.method).toBe('POST');
        expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${session(0).refreshToken}`);
        return ok({ access: renewed });
      }
      expect((init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${renewed}`);
      return ok({ birds: [], cell_ids: [] });
    });
    await client(fetcher).nearest(at.lat, at.lng);
    const saved = JSON.parse(await readFile(sessionPath, 'utf8'));
    expect(saved).toEqual({ ...session(0), accessToken: renewed });
    expect((await stat(sessionPath)).mode & 0o777).toBe(0o600);

    // A new login seeded while it renewed is not overwritten.
    await writeFile(sessionPath, JSON.stringify(session(now + 10 * 60_000)));
    const replacement = session(now + 20 * HOUR, token(now + 100 * 24 * HOUR, 'other'));
    const racing = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes('/auth/refresh/token')) {
        await writeFile(sessionPath, JSON.stringify(replacement));
        return ok({ access: renewed, refresh: token(now + 180 * 24 * HOUR, 'next') });
      }
      return ok({ birds: [], cell_ids: [] });
    });
    await client(racing).nearest(at.lat, at.lng);
    expect(JSON.parse(await readFile(sessionPath, 'utf8'))).toEqual(replacement);
  });

  it('holds every Bird request for a quarter of an hour after a made-up map or a refusal', async () => {
    await writeFile(sessionPath, JSON.stringify(session(now + 20 * HOUR)));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let reply: Response = ok({ birds: [bird(at.lat + 0.05, at.lng + 0.05, { brand_id: undefined })], cell_ids: [] });
    const fetcher = vi.fn(async () => reply);
    const birdClient = client(fetcher);
    await expect(birdClient.nearest(at.lat, at.lng)).rejects.toBeInstanceOf(BirdUntrustedMapError);
    await expect(birdClient.nearest(at.lat, at.lng)).rejects.toThrow('held off');
    expect(fetcher).toHaveBeenCalledTimes(1);
    now += BIRD_UNTRUSTED_HOLD_MS;
    reply = new Response('', { status: 429, headers: { 'retry-after': '3600' } });
    await expect(birdClient.nearest(at.lat, at.lng)).rejects.toThrow('HTTP 429');
    now += BIRD_UNTRUSTED_HOLD_MS;
    await expect(birdClient.nearest(at.lat, at.lng)).rejects.toThrow('held off');
    now += HOUR;
    reply = new Response('', { status: 503 });
    await expect(birdClient.nearest(at.lat, at.lng)).rejects.toMatchObject({ transient: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
    vi.restoreAllMocks();
  });

  it('refuses a missing or broken session without asking Bird', async () => {
    const fetcher = vi.fn();
    await expect(client(fetcher).nearest(at.lat, at.lng)).rejects.toThrow('Bird session credentials are missing or unreadable');
    await writeFile(sessionPath, JSON.stringify({ ...session(now + HOUR), accessToken: 'x' }));
    now += 2 * 60_000;
    await expect(client(fetcher).nearest(at.lat, at.lng)).rejects.toThrow('Bird session credentials are invalid');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('asks Bird once every 30 seconds for an idle sweep, for every area together', async () => {
    expect(BIRD_QUERY_INTERVAL_MS).toBe(30_000);
    await writeFile(sessionPath, JSON.stringify(session(Date.now() + 20 * HOUR)));
    const times: number[] = [];
    const fetcher = vi.fn(async () => { times.push(Date.now()); return ok({ birds: [], cell_ids: [] }); });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const paced = new BirdClient({ sessionPath, fetch: fetcher });
      await paced.nearest(at.lat, at.lng);
      const second = paced.nearest(at.lat + 0.1, at.lng);
      await vi.advanceTimersByTimeAsync(29_999);
      expect(times).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(1);
      await second;
    } finally { vi.useRealTimers(); }
    expect(times[1] - times[0]).toBe(30_000);
  });

  const looked = { urgent: () => true, focus: () => undefined, progress: () => {} };

  it('asks Bird up to ten times at once for a town someone looks at', async () => {
    await writeFile(sessionPath, JSON.stringify(session(Date.now() + 20 * HOUR)));
    const times: number[] = [];
    const fetcher = vi.fn(async () => { times.push(Date.now()); return ok({ birds: [], cell_ids: [] }); });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const paced = new BirdClient({ sessionPath, fetch: fetcher });
      const town = withinCollection(looked, () => Promise.all(Array.from({ length: 12 }, (_, i) => paced.nearest(at.lat + i * 0.01, at.lng))));
      // Its session is read from disk before the first.
      await vi.waitFor(() => expect(times).toHaveLength(10));
      await vi.advanceTimersByTimeAsync(60_000);
      await town;
    } finally { vi.useRealTimers(); }
    expect(times.map(time => time - times[0])).toEqual([...Array(10).fill(0), 60_000, 60_000]);
  });

  it('counts the requests of the cache it replaces once its start hold is over, and keeps its own for the next', async () => {
    await writeFile(sessionPath, JSON.stringify(session(Date.now() + 20 * HOUR)));
    const pacePath = join(directory, 'tmp', 'bird-pace.tmp');
    const times: number[] = [];
    const fetcher = vi.fn(async () => { times.push(Date.now()); return ok({ birds: [], cell_ids: [] }); });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const t0 = Date.now();
    // The cache it replaces spent five minutes' 30 requests in the minute before it started.
    const before = Array.from({ length: 30 }, (_, i) => t0 - 60_000 + i * 1_000);
    await mkdir(dirname(pacePath), { recursive: true });
    await writeFile(pacePath, JSON.stringify({ version: 1, started: before }));
    try {
      const paced = new BirdClient({ sessionPath, fetch: fetcher, startHoldMs: 120_000, pacePath });
      const town = withinCollection(looked, () => paced.nearest(at.lat, at.lng));
      await vi.advanceTimersByTimeAsync(240_000 - 1);
      expect(times).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await town;
    } finally { vi.useRealTimers(); }
    // Five minutes after the first of them.
    expect(times).toEqual([t0 + 240_000]);
    await vi.waitFor(async () => expect(JSON.parse(await readFile(pacePath, 'utf8'))).toEqual({ version: 1, started: [...before, t0 + 240_000] }));
    expect((await stat(pacePath)).mode & 0o777).toBe(0o600);
  });

  it('starts at the end of its hold when it finds no requests kept', async () => {
    await writeFile(sessionPath, JSON.stringify(session(Date.now() + 20 * HOUR)));
    const pacePath = join(directory, 'none', 'bird-pace.tmp');
    const times: number[] = [];
    const fetcher = vi.fn(async () => { times.push(Date.now()); return ok({ birds: [], cell_ids: [] }); });
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const t0 = Date.now();
    try {
      const paced = new BirdClient({ sessionPath, fetch: fetcher, startHoldMs: 120_000, pacePath });
      const town = withinCollection(looked, () => Promise.all([paced.nearest(at.lat, at.lng), paced.nearest(at.lat + 0.1, at.lng)]));
      await vi.advanceTimersByTimeAsync(120_000);
      await town;
    } finally { vi.useRealTimers(); }
    expect(times).toEqual([t0 + 120_000, t0 + 120_000]);
    // In a folder it makes.
    await vi.waitFor(async () => expect(JSON.parse(await readFile(pacePath, 'utf8')).started).toEqual(times));
  });
});

interface Placed { id: string; brand_id: string; lat: number; lng: number; captive?: boolean }
/** Bird's map over these vehicles: the 250 nearest within the radius, nearest first, with their cells. */
function simulated(vehicles: () => readonly Placed[]) {
  const api = { nearest: vi.fn(async (lat: number, lng: number, radiusM = 5_000) => {
    const birds = vehicles().map(vehicle => ({ vehicle, distance: haversineM(lat, lng, vehicle.lat, vehicle.lng) }))
      .filter(entry => entry.distance <= radiusM).sort((a, b) => a.distance - b.distance).slice(0, BIRD_PAGE)
      .map(({ vehicle }) => ({ id: vehicle.id, brand_id: vehicle.brand_id, area_key: '0123456789ABCDEF0123456789ABCDEF',
        vehicle_class: 'scooter', captive: vehicle.captive ?? false, location: { latitude: vehicle.lat, longitude: vehicle.lng },
        battery_level: 55, estimated_range: 9_000 }));
    return parseBirdReply({ birds, cell_ids: [CELL] }, lat, lng, radiusM);
  }) };
  return { api };
}
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}
// An L of about 12 km by 12 km in Austin, its north-east quarter outside.
const L: [number, number][] = [[30.2, -97.8], [30.308, -97.8], [30.308, -97.75], [30.254, -97.75], [30.254, -97.6745], [30.2, -97.6745]];
const inL = (vehicle: Placed) => polygonContainsPoint(L, vehicle.lat, vehicle.lng);
function fleet(count: number, seed = 1): Placed[] {
  const next = random(seed);
  const vehicles = Array.from({ length: count }, (_, i) => ({ id: `00000000-0000-4000-9000-${String(i).padStart(12, '0')}`,
    brand_id: i % 5 ? BIRD : SPIN, lat: 30.195 + next() * 0.12, lng: -97.805 + next() * 0.14 }));
  // Downtown: 400 within 300 m, more than a page.
  for (let i = 0; i < 400; i++) {
    vehicles.push({ id: `00000000-0000-4000-a000-${String(i).padStart(12, '0')}`, brand_id: BIRD,
      lat: 30.27 + (next() - 0.5) * 0.005, lng: -97.74 + (next() - 0.5) * 0.006 });
  }
  return vehicles;
}
const noLimits = { requests: 3_000, milliseconds: 60_000, retryMs: 1 };

describe('Bird area sweeps', () => {
  it('finds every vehicle inside the outline from nothing known, then for fewer requests from where they stood', async () => {
    const vehicles = fleet(1_500);
    const inside = vehicles.filter(inL).map(vehicle => vehicle.id).sort();
    const { api } = simulated(() => vehicles);
    const cold = await sweepBirdArea(api, [L], [], noLimits);
    expect(cold.scooters.map(scooter => scooter.id).sort()).toEqual(inside);
    const warm = await sweepBirdArea(api, [L], cold.scooters, noLimits);
    expect(warm.scooters).toHaveLength(inside.length);
    expect(warm.planned).toBeGreaterThan(0);
    expect(warm.requests).toBeLessThanOrEqual(cold.requests);
  }, 15_000);

  it('stops on the first made-up map', async () => {
    const { api } = simulated(() => fleet(500));
    let calls = 0;
    const decoyed = { nearest: async (lat: number, lng: number, radiusM?: number) => {
      if (++calls === 3) throw new BirdUntrustedMapError('brand');
      return api.nearest(lat, lng, radiusM);
    } };
    await expect(sweepBirdArea(decoyed, [L], [], noLimits)).rejects.toThrow('unverified map (brand)');
  });

  it('goes on from where a stopped sweep stood, from its start and its requests, asking only where its replies did not reach', async () => {
    const vehicles = fleet(1_500);
    const inside = vehicles.filter(inL).map(vehicle => vehicle.id).sort();
    const { api } = simulated(() => vehicles);
    const cold = await sweepBirdArea(api, [L], [], noLimits);
    for (const previous of [[], cold.scooters]) {
      const whole = await sweepBirdArea(api, [L], previous, noLimits);
      // Stopped as by a deploy: the request after half the sweep's goes unanswered, and so does any after it.
      const half = Math.ceil(whole.requests / 2);
      let calls = 0;
      const stopped = { nearest: (lat: number, lng: number, radiusM?: number) =>
        ++calls <= half ? api.nearest(lat, lng, radiusM) : new Promise<never>(() => undefined) };
      const found = new Map<string, BirdScooter>();
      let stood: NearestProgress | undefined;
      void sweepBirdArea(stopped, [L], previous, noLimits, found, (_, progress) => { stood = progress; });
      await vi.waitFor(() => expect(stood?.discs).toHaveLength(half), WAIT);
      const resume = { ...stood! }, before = api.nearest.mock.calls.length;
      let ended: NearestProgress | undefined;
      const resumed = await sweepBirdArea(api, [L], previous, noLimits, found, (_, progress) => { ended = progress; }, resume);
      const asked = api.nearest.mock.calls.slice(before).map(([lat, lng]) => [lat, lng]);
      expect(resumed.startedAt).toBe(resume.startedAt);
      expect(resumed.requests).toBe(resume.requests + asked.length);
      expect(asked.some(([lat, lng]) => resume.discs.some(disc => disc.lat === lat && disc.lng === lng))).toBe(false);
      expect(half + asked.length).toBeLessThanOrEqual(whole.requests + 2);
      expect(resumed.scooters.map(scooter => scooter.id).sort()).toEqual(inside);
      // Every point of the outline within a reply's circle, the resumed one's or those after.
      const discs = ended!.discs;
      expect(discs.slice(0, half)).toEqual(resume.discs);
      for (let lat = 30.2005; lat < 30.308; lat += 0.002) for (let lng = -97.7995; lng < -97.6745; lng += 0.002) {
        if (polygonContainsPoint(L, lat, lng)) expect(discs.some(disc => haversineM(disc.lat, disc.lng, lat, lng) <= disc.r)).toBe(true);
      }
    }
  }, 30_000);
});

describe('Bird areas in the cache', () => {
  const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.birdAppArea);
  const system = systems[0];

  it('collects each Bird area by sweeping its outline, once a day by day when idle, from the positions last published for it', async () => {
    expect(systems.length).toBeGreaterThan(0);
    const feeds = independentCollectableFeeds();
    const feedId = `${COUNTRY_SOURCES[system.country]}:${system.id}`;
    const feed = feeds.find(candidate => candidate.id === feedId)!;
    expect(feed).toMatchObject({ provider: system.provider, host: 'api-bird.prod.birdapp.com' });
    const [lat, lng] = system.center;
    const brand = system.provider === 'bird' ? BIRD : SPIN;
    const other = system.provider === 'bird' ? SPIN : BIRD;
    const vehicles = [{ id: id(), brand_id: brand, lat, lng }, { id: id(), brand_id: other, lat: lat + 0.0001, lng },
      { id: id(), brand_id: brand, lat: lat + 0.0002, lng, captive: true }, { id: id(), brand_id: brand, lat: lat + 3, lng }];
    const { api } = simulated(() => vehicles);
    const previous = vi.fn(() => []);
    const directory = await mkdtemp(join(tmpdir(), 'bird-sweeps-'));
    const wrapped = withBirdAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS, previous, api, new BirdSweepCheckpoints({ directory }));
    const ours = wrapped.find(candidate => candidate.id === feedId)!;
    const result = await ours.collect();
    expect(previous).toHaveBeenCalledWith(feedId);
    expect(result.vehicles).toEqual([{ provider: system.provider, vehicle_id: `${system.provider}:${vehicles[0].id}`, lat, lng,
      battery: 55, range_m: 9_000, deep_link: null, distance_m: null }]);
    expect(wrapped.filter((candidate, i) => candidate !== feeds[i]).map(candidate => candidate.id))
      .toEqual(systems.map(candidate => `${COUNTRY_SOURCES[candidate.country]}:${candidate.id}`));
    expect(BIRD_IDLE_INTERVAL_MS).toBe(24 * 60 * 60_000);
    expect(BIRD_IDLE_GRACE_MS).toBe(2 * 60 * 60_000);
    for (const candidate of wrapped.filter((entry, i) => entry !== feeds[i])) {
      expect(candidate).toMatchObject({ idleIntervalMs: BIRD_IDLE_INTERVAL_MS, idleGraceMs: BIRD_IDLE_GRACE_MS, watchMs: BIRD_WATCH_MS, paced: true });
      // Swept between 08:00 and 21:00 in its town.
      expect(candidate.nightEnds).toBeTypeOf('function');
    }
    await rm(directory, { recursive: true, force: true });
  });

  it('keeps only the scooters inside its service areas, when it has some, as where a public feed has the rest of the outline', async () => {
    const [lat, lng] = system.center;
    const brand = system.provider === 'bird' ? BIRD : SPIN;
    const vehicles = [{ id: id(), brand_id: brand, lat, lng }, { id: id(), brand_id: brand, lat: lat + 0.002, lng }];
    expect((await collectBirdArea(system, [], simulated(() => vehicles).api)).vehicles).toHaveLength(2);
    const north = { city: system.city, center: [lat + 0.002, lng] as [number, number], bounds: { ...system.bounds, south: lat + 0.001 } };
    const result = await collectBirdArea({ ...system, areas: [north] }, [], simulated(() => vehicles).api);
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual([`${system.provider}:${vehicles[1].id}`]);
  });

  it('refuses a system that is not a Bird area', async () => {
    const { api } = simulated(() => []);
    await expect(collectBirdArea({ ...system, birdAppArea: undefined }, [], api)).rejects.toThrow('Not a Bird app map area');
    await expect(collectBirdArea({ ...system, birdAppArea: 'none' }, [], api)).rejects.toThrow('Not a Bird app map area');
    await expect(collectBirdArea({ ...system, provider: 'lime' }, [], api)).rejects.toThrow('Not a Bird app map area');
  });
});

describe('Bird sweeps resumed after a deploy', () => {
  const austin = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'bird_us_app_austin')!;
  const vehicles = fleet(1_000);
  let directory: string;
  let path: string;
  let logged: Record<string, unknown>[];
  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'bird-sweeps-'));
    path = new BirdSweepCheckpoints({ directory }).path(austin.id);
    logged = [];
    vi.spyOn(console, 'log').mockImplementation(line => { logged.push(JSON.parse(String(line))); });
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(directory, { recursive: true, force: true });
  });
  const saved = async () => JSON.parse(await readFile(path, 'utf8'));
  const gone = () => expect(stat(path)).rejects.toThrow('ENOENT');
  /** A sweep's request that waits, once, until the sweep's checkpoint holds `replies` of its replies or more, and reads it. */
  const reading = (replies: number, nearest: ReturnType<typeof simulated>['api']['nearest'], fail = false) => {
    let calls = 0;
    const read: { checkpoint?: Record<string, unknown> } = {};
    const api = { nearest: async (lat: number, lng: number, radiusM?: number) => {
      if (++calls === replies + 1) {
        read.checkpoint = await vi.waitFor(async () => {
          const checkpoint = await saved();
          expect(checkpoint.discs.length).toBeGreaterThanOrEqual(replies);
          return checkpoint;
        }, WAIT);
        if (fail) throw new Error('Bird map HTTP 400');
      }
      return nearest(lat, lng, radiusM);
    } };
    return { api, read };
  };

  it('saves where the sweep stands after each reply, and removes it once the sweep ends, done or failed', async () => {
    const { api: map } = simulated(() => vehicles);
    const checkpoints = new BirdSweepCheckpoints({ directory });
    const done = reading(3, map.nearest);
    const result = await collectBirdArea(austin, [], done.api, undefined, checkpoints);
    expect(done.read.checkpoint).toMatchObject({ system: austin.id, startedAt: result.observedAt, discs: expect.any(Array) });
    const checkpoint = done.read.checkpoint!;
    expect(checkpoint.requests).toBeGreaterThanOrEqual(3);
    expect(checkpoint.savedAt).toBeGreaterThanOrEqual(result.observedAt!);
    // The scooters found so far, as the sweep holds them.
    expect((checkpoint.scooters as BirdScooter[]).length).toBeGreaterThan(0);
    expect(Object.keys((checkpoint.scooters as BirdScooter[])[0]).sort()).toEqual(['battery', 'brand', 'id', 'lat', 'lng', 'range']);
    await gone();
    const failed = reading(2, map.nearest, true);
    await expect(collectBirdArea(austin, [], failed.api, undefined, checkpoints)).rejects.toThrow('HTTP 400');
    expect((failed.read.checkpoint?.discs as unknown[]).length).toBeGreaterThanOrEqual(2);
    await gone();
  }, 30_000);

  it('resumes a sweep a deploy stopped, from its start, for fewer requests, and starts again from a stale or broken one', async () => {
    const { api: map } = simulated(() => vehicles);
    const whole = await collectBirdArea(austin, [], map, undefined, new BirdSweepCheckpoints({ directory }));
    const wholeRequests = map.nearest.mock.calls.length;
    expect(logged.at(-1)).not.toHaveProperty('resumed');
    // The old cache stops answering after five replies, as a deploy stops it.
    let calls = 0;
    const stopped = { nearest: (lat: number, lng: number, radiusM?: number) =>
      ++calls <= 5 ? map.nearest(lat, lng, radiusM) : new Promise<never>(() => undefined) };
    void collectBirdArea(austin, [], stopped, undefined, new BirdSweepCheckpoints({ directory }));
    await vi.waitFor(async () => expect((await saved()).discs).toHaveLength(5), WAIT);
    const checkpoint = await saved();

    const before = map.nearest.mock.calls.length;
    const resumed = await collectBirdArea(austin, [], map, undefined, new BirdSweepCheckpoints({ directory }));
    const requests = map.nearest.mock.calls.length - before;
    expect(requests).toBeLessThan(wholeRequests);
    expect(resumed.observedAt).toBe(checkpoint.startedAt);
    expect(resumed.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual(whole.vehicles.map(vehicle => vehicle.vehicle_id).sort());
    expect(logged.at(-1)).toMatchObject({ event: 'bird_sweep', system: austin.id, resumed: true, resumedRequests: checkpoint.requests,
      requests: checkpoint.requests + requests });
    await gone();

    for (const left of [JSON.stringify({ ...checkpoint, savedAt: Date.now() - BIRD_CHECKPOINT_MAX_AGE_MS - 1 }),
      JSON.stringify({ ...checkpoint, startedAt: Date.now() - 3 * 60 * 60_000 }), JSON.stringify({ ...checkpoint, system: 'bird_us_app_mesa' }),
      JSON.stringify({ ...checkpoint, discs: [{ lat: 30.27 }] }), '{"system":']) {
      await writeFile(path, left);
      const from = map.nearest.mock.calls.length;
      const fresh = await collectBirdArea(austin, [], map, undefined, new BirdSweepCheckpoints({ directory }));
      expect(map.nearest.mock.calls.length - from).toBe(wholeRequests);
      expect(fresh.observedAt).toBeGreaterThan(checkpoint.startedAt);
      expect(logged.at(-1)).not.toHaveProperty('resumed');
      await gone();
    }
  }, 30_000);

  it('reads a checkpoint only once the start hold is over, by when the cache a deploy replaces has saved its last', async () => {
    await writeFile(path, '{}');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      const checkpoints = new BirdSweepCheckpoints({ directory, startHoldMs: 120_000 });
      let read = false;
      void checkpoints.resumable(austin.id, { requests: 200, milliseconds: 2 * 60 * 60_000, retryMs: 1 }).then(() => { read = true; });
      await vi.advanceTimersByTimeAsync(119_000);
      expect(read).toBe(false);
      await vi.advanceTimersByTimeAsync(1_000);
      vi.useRealTimers();
      await vi.waitFor(() => expect(read).toBe(true));
    } finally { vi.useRealTimers(); }
  });

  it('shows what the stopped sweep had found as old as that sweep, not as fresh as the restart', async () => {
    // The stopped sweep began 40 minutes before, and saved a minute before the deploy what it had found downtown.
    const startedAt = Date.now() - 40 * 60_000;
    await writeFile(path, JSON.stringify({ system: austin.id, startedAt, requests: 3, discs: [{ lat: 30.27, lng: -97.74, r: 300 }],
      scooters: [{ id: 'seen-before-deploy', brand: 'bird', lat: 30.27, lng: -97.74, battery: 50, range: 9_000 }], savedAt: Date.now() - 60_000 }));
    const reports: { found: Vehicle[]; swept: MapBounds[]; since: number }[] = [];
    const attention = { urgent: () => true, focus: () => undefined };
    const collection = sweepScope(attention, Date.now(), (found, swept, since) => { reports.push({ found, swept, since }); });
    // Bird does not answer yet: only what the checkpoint holds is shown.
    const hanging = { nearest: () => new Promise<never>(() => undefined) };
    void withinCollection(collection, () => collectBirdArea(austin, [], hanging, undefined, new BirdSweepCheckpoints({ directory })));
    await vi.waitFor(() => expect(reports).toHaveLength(1), WAIT);
    const [{ found, swept, since }] = reports;
    expect(found.map(vehicle => vehicle.vehicle_id)).toEqual(['bird:seen-before-deploy']);
    expect(since).toBe(startedAt);
    // The cache's record with the sweep under way (scooter-cache.ts), its last whole sweep a day old: the scooter is not live.
    const day = Date.now() - 24 * 60 * 60_000;
    const record: FeedSnapshot = { id: `${regionalSource(austin)}:${austin.id}`, source: regionalSource(austin), provider: 'bird', coverage: serviceAreas(austin).map(area => area.bounds),
      vehicles: [], observedAt: day, attemptedAt: day, collectedAt: day, collectionMs: 600_000, stale: false, failed: false, skipped: false,
      sweep: { startedAt: since, vehicles: found, swept } };
    const asked = Date.now() + 60_000;
    const answer = querySnapshot({ version: 1, updatedAt: asked, feeds: [record], overview: buildCityOverview([record], asked) },
      { bounds: { south: 30.26, west: -97.75, north: 30.28, east: -97.73 }, minBattery: 0 }, 16, asked, { refreshing: new Set([record.id]) });
    expect(answer.vehicles).toEqual([]);
    expect(answer.meta.shownSince).toBeUndefined();
    // A sweep begun with the collection is as old as it.
    const fresh: number[] = [];
    const begun = Date.now();
    const vehicles = fleet(50);
    await withinCollection(sweepScope(attention, begun, (_, __, at) => { fresh.push(at); }),
      () => collectBirdArea(austin, [], simulated(() => vehicles).api));
    expect(fresh.length).toBeGreaterThan(0);
    expect(new Set(fresh)).toEqual(new Set([begun]));
  }, 30_000);
});

describe('Bird sweeps of a town someone looks at', () => {
  const austin = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'bird_us_app_austin')!;
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  /** What Bird's client hears of each request of a sweep: whether someone looks. */
  const heard = (id: string) => {
    const vehicles = fleet(200);
    const { api: map } = simulated(() => vehicles);
    const urgency: (boolean | undefined)[] = [];
    const api = { nearest: async (lat: number, lng: number, radiusM?: number) => {
      urgency.push(currentCollection()?.urgent());
      return map.nearest(lat, lng, radiusM);
    } };
    const sweep = async (urgent: () => boolean) => {
      urgency.length = 0;
      await withinCollection(sweepScope({ urgent, focus: () => undefined }, Date.now(), () => undefined),
        () => collectBirdArea({ ...austin, id }, [], api));
      return [...urgency];
    };
    return sweep;
  };

  it('go at its pace once in half an hour, and the next while it stays watched at an idle sweep\'s', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.useFakeTimers({ toFake: ['Date'] });
    const start = Date.parse('2026-11-10T18:00:00Z');
    vi.setSystemTime(start);
    const sweep = heard('bird_us_app_austin_watched');
    expect(new Set(await sweep(() => false))).toEqual(new Set([false]));
    expect(new Set(await sweep(() => true))).toEqual(new Set([true]));
    vi.setSystemTime(start + 5 * 60_000);
    expect(new Set(await sweep(() => true))).toEqual(new Set([false]));
    vi.setSystemTime(start + BIRD_BURST_EVERY_MS);
    expect(new Set(await sweep(() => true))).toEqual(new Set([true]));
  });

  it('go at its pace from when someone opens the town during an idle sweep', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-11-10T18:00:00Z'));
    const sweep = heard('bird_us_app_austin_opened');
    let asked = 0;
    const urgency = await sweep(() => ++asked > 2);
    expect(urgency.length).toBeGreaterThan(3);
    expect(urgency).toEqual([false, false, ...Array(urgency.length - 2).fill(true)]);
  });
});

describe('Bird sweeps longer than a position may be shown', () => {
  const austin = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'bird_us_app_austin')!;
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it('tell when they read each scooter, so that when one ends those of its last 15 minutes show live and the others faded', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-11-10T18:00:00Z'));
    const vehicles = fleet(1_000);
    const { api: map } = simulated(() => vehicles);
    // A reply every minute and a half, as when other areas shared Bird's two requests a minute until 10 November 2026.
    const api = { nearest: async (lat: number, lng: number, radiusM?: number) => {
      vi.setSystemTime(Date.now() + 90_000);
      return map.nearest(lat, lng, radiusM);
    } };
    const collection = sweepScope({ urgent: () => true, focus: () => undefined }, Date.now(), () => undefined);
    const result = await withinCollection(collection, () =>
      collectBirdArea(austin, [], api, { requests: 3_000, milliseconds: 2 * 60 * 60_000, retryMs: 1 }));
    const reads = collection.reads();
    const end = Date.now();
    expect(end - result.observedAt!).toBeGreaterThan(15 * 60_000);
    expect(reads?.lastAt).toBe(end);
    // Each scooter by its last reply, all of them read by this sweep.
    expect(Object.keys(reads!.at).sort()).toEqual(result.vehicles.map(vehicle => vehicle.vehicle_id).sort());
    const times = Object.values(reads!.at);
    expect(Math.min(...times)).toBeGreaterThan(result.observedAt!);
    expect(Math.max(...times)).toBeLessThanOrEqual(end);
    // The cache's record of it (scooter-cache.ts), asked as it ends.
    const record: FeedSnapshot = { id: `${regionalSource(austin)}:${austin.id}`, source: regionalSource(austin), provider: 'bird', coverage: serviceAreas(austin).map(area => area.bounds),
      vehicles: result.vehicles, observedAt: result.observedAt!, reads, attemptedAt: end, collectedAt: end, stale: false, failed: false, skipped: false };
    const bounds = { south: 30.1, west: -97.9, north: 30.4, east: -97.6 };
    const answer = querySnapshot({ version: 1, updatedAt: end, feeds: [record], overview: buildCityOverview([record], end) },
      { bounds, minBattery: 0 }, 18, end);
    const recent = result.vehicles.filter(vehicle => end - reads!.at[vehicle.vehicle_id!] <= 15 * 60_000);
    expect(recent.length).toBeGreaterThan(0);
    expect(recent.length).toBeLessThan(result.vehicles.length);
    expect(answer.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual(recent.map(vehicle => vehicle.vehicle_id).sort());
    expect(answer.lastSeen?.vehicles).toHaveLength(result.vehicles.length - recent.length);
    expect(answer.meta.generatedAt).toBe(new Date(Math.min(...recent.map(vehicle => reads!.at[vehicle.vehicle_id!]))).toISOString());
  }, 30_000);
});
