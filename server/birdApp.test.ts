import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BIRD_BRANDS, BIRD_IDLE_INTERVAL_MS, BIRD_PAGE, BIRD_QUERY_INTERVAL_MS, BIRD_UNTRUSTED_HOLD_MS, BIRD_WATCH_MS, BirdClient, BirdUntrustedMapError,
  collectBirdArea, parseBirdReply, sweepBirdArea, withBirdAppCollectors } from './birdApp';
import { haversineM, polygonContainsPoint } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { COUNTRY_SOURCES } from '../src/generated/countries';

const BIRD = 'df76d602-dd1a-4ce4-a64f-2e5dd8c6f845';
const SPIN = '37f4f15f-d73b-4f1e-8f52-5de2782bd447';
// A level-9 cell of face 4, as the map lists them.
const CELL = '-9114779870449106944';
const at = { lat: 30.2672, lng: -97.7431 };
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

  it('asks Bird once every 30 seconds, for every area together', async () => {
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
    const wrapped = withBirdAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS, previous, api);
    const ours = wrapped.find(candidate => candidate.id === feedId)!;
    const result = await ours.collect();
    expect(previous).toHaveBeenCalledWith(feedId);
    expect(result.vehicles).toEqual([{ provider: system.provider, vehicle_id: `${system.provider}:${vehicles[0].id}`, lat, lng,
      battery: 55, range_m: 9_000, deep_link: null, distance_m: null }]);
    expect(wrapped.filter((candidate, i) => candidate !== feeds[i]).map(candidate => candidate.id))
      .toEqual(systems.map(candidate => `${COUNTRY_SOURCES[candidate.country]}:${candidate.id}`));
    expect(BIRD_IDLE_INTERVAL_MS).toBe(24 * 60 * 60_000);
    for (const candidate of wrapped.filter((entry, i) => entry !== feeds[i])) {
      expect(candidate).toMatchObject({ idleIntervalMs: BIRD_IDLE_INTERVAL_MS, watchMs: BIRD_WATCH_MS, paced: true });
      // Swept between 08:00 and 21:00 in its town.
      expect(candidate.nightAt).toBeTypeOf('function');
    }
  });

  it('refuses a system that is not a Bird area', async () => {
    const { api } = simulated(() => []);
    await expect(collectBirdArea({ ...system, birdAppArea: undefined }, [], api)).rejects.toThrow('Not a Bird app map area');
    await expect(collectBirdArea({ ...system, birdAppArea: 'none' }, [], api)).rejects.toThrow('Not a Bird app map area');
    await expect(collectBirdArea({ ...system, provider: 'lime' }, [], api)).rejects.toThrow('Not a Bird app map area');
  });
});
