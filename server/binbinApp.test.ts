import { describe, expect, it, vi } from 'vitest';
import { BINBIN_IDLE_INTERVAL_MS, BINBIN_PAGE, BinbinClient, collectBinbinArea, parseBinbinReply, planBinbinSweep, sweepBinbinArea, withBinbinAppCollectors } from './binbinApp';
import { haversineM, polygonContainsPoint } from '../src/lib/geo';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS } from '../src/lib/regionalScooterSystems';
import { COUNTRY_SOURCES } from '../src/generated/countries';

interface Scooter { id: string; lat: number; lng: number }
const vehicle = (scooter: Scooter, lat: number, lng: number, extra: Record<string, unknown> = {}) => ({
  plate: 'TR-1', status: 'AVAILABLE', vehicleId: scooter.id, battery: 64, vehicleTypeId: 1,
  distance: haversineM(lat, lng, scooter.lat, scooter.lng), latitude: scooter.lat, longitude: scooter.lng, ...extra,
});
/** BinBin's guest map over these scooters: the ten nearest within the radius, nearest first. */
function simulated(scooters: () => readonly Scooter[]) {
  const asked: [number, number][] = [];
  const api = { nearest: vi.fn(async (lat: number, lng: number, radiusM = 15_000) => {
    asked.push([lat, lng]);
    const data = scooters().map(scooter => vehicle(scooter, lat, lng)).filter(entry => entry.distance <= radiusM)
      .sort((a, b) => a.distance - b.distance).slice(0, BINBIN_PAGE);
    return parseBinbinReply({ status: 'SUCCESS', resultStatus: 'Successful', data }, lat, lng, radiusM);
  }) };
  return { api, asked };
}
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}
// An L of about 3 km by 3 km in Eskişehir, its north-east quarter outside.
const L: [number, number][] = [[39.75, 30.5], [39.777, 30.5], [39.777, 30.5175], [39.7635, 30.5175], [39.7635, 30.535], [39.75, 30.535]];
const inL = (scooter: Scooter) => polygonContainsPoint(L, scooter.lat, scooter.lng);
function fleet(count: number, seed = 1): Scooter[] {
  const next = random(seed);
  const scooters = Array.from({ length: count }, (_, i) => ({ id: `s${i}`, lat: 39.748 + next() * 0.031, lng: 30.498 + next() * 0.039 }));
  // Clusters, as at a tram stop: eight within 20 m.
  for (const [c, [lat, lng]] of [[39.755, 30.505], [39.76, 30.53], [39.772, 30.51]].entries()) {
    for (let i = 0; i < 8; i++) scooters.push({ id: `c${c}-${i}`, lat: lat + (next() - 0.5) * 0.0003, lng: lng + (next() - 0.5) * 0.0003 });
  }
  return scooters;
}
const noLimits = { requests: 3_000, milliseconds: 60_000, retryMs: 1 };

describe('BinBin map replies', () => {
  const at = { lat: 39.77, lng: 30.52 };
  const near = (i: number) => ({ id: `v${i}`, lat: at.lat + i * 0.0001, lng: at.lng });

  it('vouches for its whole radius when it lists fewer than ten, and up to its tenth when it lists ten', () => {
    const few = parseBinbinReply({ status: 'SUCCESS', data: [vehicle(near(1), at.lat, at.lng), vehicle(near(2), at.lat, at.lng, { battery: null })] },
      at.lat, at.lng, 5_000);
    expect(few.scooters).toEqual([{ id: 'v1', lat: at.lat + 0.0001, lng: at.lng, battery: 64 }, { id: 'v2', lat: at.lat + 0.0002, lng: at.lng, battery: null }]);
    expect(few.completeM).toBeCloseTo(5_000 * 0.997 - 1);
    const ten = parseBinbinReply({ status: 'SUCCESS', data: Array.from({ length: 10 }, (_, i) => vehicle(near(i + 1), at.lat, at.lng)) },
      at.lat, at.lng, 5_000);
    expect(ten.scooters).toHaveLength(10);
    expect(ten.completeM).toBeCloseTo(haversineM(at.lat, at.lng, near(10).lat, near(10).lng) * 0.997 - 1);
    expect(parseBinbinReply({ status: 'SUCCESS', data: [] }, at.lat, at.lng, 5_000).scooters).toEqual([]);
  });

  it('refuses a reply whose distances could not vouch for the scooters it leaves out', () => {
    const one = vehicle(near(1), at.lat, at.lng);
    for (const [payload, error] of [
      [{ status: 'FAIL', data: [] }, 'Invalid BinBin map response'],
      [{ status: 'SUCCESS', data: null }, 'Invalid BinBin map response'],
      [{ status: 'SUCCESS', data: Array.from({ length: 11 }, (_, i) => vehicle(near(i + 1), at.lat, at.lng)) }, 'more than its page'],
      [{ status: 'SUCCESS', data: [{ ...one, vehicleId: 'a b' }] }, 'Invalid BinBin vehicle'],
      [{ status: 'SUCCESS', data: [{ ...one, latitude: Number.NaN }] }, 'Invalid BinBin vehicle'],
      [{ status: 'SUCCESS', data: [{ ...one, distance: undefined }] }, 'Invalid BinBin vehicle'],
      [{ status: 'SUCCESS', data: [{ ...one, distance: one.distance + 30 }] }, 'distances disagree'],
      [{ status: 'SUCCESS', data: [vehicle(near(2), at.lat, at.lng), one] }, 'not nearest first'],
      [{ status: 'SUCCESS', data: [vehicle({ id: 'far', lat: at.lat + 0.1, lng: at.lng }, at.lat, at.lng)] }, 'beyond its radius'],
    ] as const) expect(() => parseBinbinReply(payload, at.lat, at.lng, 5_000)).toThrow(error);
  });
});

describe('BinBin map client', () => {
  it('asks as the app does, signed out, for scooters only', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({ status: 'SUCCESS', data: [] }));
    const client = new BinbinClient({ fetch, intervalMs: 0 });
    await client.nearest(39.77, 30.52, 4_000.2);
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('https://gatewayapi-sp.binbinapp.com/binbin/api/v1/vehicles/list');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ latitude: 39.77, longitude: 30.52, radius: 4_001, vehicleTypeIds: '1' });
    expect(init?.headers).toMatchObject({ 'User-Agent': 'okhttp/4.12.0', 'X-Device-OS': 'Android' });
    expect(init?.headers).not.toHaveProperty('Authorization');
  });

  it('stops asking while rate limited, and calls a timeout or a server error worth asking again', async () => {
    let now = 1_800_000_000_000;
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'Retry-After': '120' } }))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(new Response('{}', { status: 403 }))
      .mockResolvedValueOnce(new Response('x'.repeat(70_000)));
    const client = new BinbinClient({ fetch, now: () => now, intervalMs: 0 });
    await expect(client.nearest(39.77, 30.52)).rejects.toThrow('BinBin map HTTP 429');
    await expect(client.nearest(39.77, 30.52)).rejects.toThrow('temporarily rate limited');
    expect(fetch).toHaveBeenCalledTimes(1);
    now += 121_000;
    await expect(client.nearest(39.77, 30.52)).rejects.toMatchObject({ message: 'BinBin map HTTP 503', transient: true });
    await expect(client.nearest(39.77, 30.52)).rejects.toMatchObject({ message: 'BinBin request failed or timed out', transient: true });
    const forbidden = await client.nearest(39.77, 30.52).catch((error: unknown) => error);
    expect(forbidden).toMatchObject({ message: 'BinBin map HTTP 403' });
    expect(forbidden).not.toHaveProperty('transient');
    await expect(client.nearest(39.77, 30.52)).rejects.toThrow('exceeds the size limit');
  });
});

describe('BinBin area sweeps', () => {
  it('finds every scooter inside the outline from nothing known, then for fewer requests from where they stood', async () => {
    const scooters = fleet(400);
    const inside = scooters.filter(inL);
    const { api } = simulated(() => scooters);
    const cold = await sweepBinbinArea(api, [L], [], noLimits);
    expect(cold.scooters.map(scooter => scooter.id).sort()).toEqual(inside.map(scooter => scooter.id).sort());
    expect(cold.planned).toBe(0);
    const warm = await sweepBinbinArea(api, [L], cold.scooters, noLimits);
    expect(warm.scooters).toHaveLength(inside.length);
    expect(warm.planned).toBeGreaterThan(0);
    expect(warm.requests).toBeLessThan(cold.requests * 0.85);
    // Ten at most a reply, and replies overlap: at least a tenth as many requests as scooters.
    expect(warm.requests).toBeGreaterThanOrEqual(inside.length / BINBIN_PAGE);
  });

  it('still finds every scooter once a third of them have moved since the last sweep', async () => {
    const before = fleet(400);
    const next = random(7);
    const after = before.map((scooter, i) => i % 3 ? scooter
      : { ...scooter, lat: 39.75 + next() * 0.027, lng: 30.5 + next() * 0.0175 });
    const { api } = simulated(() => after);
    const sweep = await sweepBinbinArea(api, [L], before.filter(inL), noLimits);
    expect(sweep.scooters.map(scooter => scooter.id).sort()).toEqual(after.filter(inL).map(scooter => scooter.id).sort());
    expect(sweep.requests).toBeGreaterThan(sweep.planned);
  });

  it('keeps the ten it sees of a pile no reply can see past, and stops', async () => {
    const pile = Array.from({ length: 25 }, (_, i) => ({ id: `p${i}`, lat: 39.76, lng: 30.51 }));
    const scooters = [...fleet(100), ...pile];
    const { api } = simulated(() => scooters);
    const sweep = await sweepBinbinArea(api, [L], [], noLimits);
    expect(sweep.piles).toBeGreaterThan(0);
    expect(sweep.scooters.filter(scooter => scooter.id.startsWith('p')).length).toBeGreaterThanOrEqual(BINBIN_PAGE);
    expect(sweep.scooters.filter(scooter => !scooter.id.startsWith('p'))).toHaveLength(fleet(100).filter(inL).length);
    expect(sweep.requests).toBeLessThan(400);
  });

  it('asks again after a timeout, and fails on anything else or past its limits', async () => {
    const scooters = fleet(50);
    const { api } = simulated(() => scooters);
    const flaky = { nearest: vi.fn(api.nearest).mockRejectedValueOnce(Object.assign(new Error('BinBin request failed or timed out'), { transient: true })) };
    expect((await sweepBinbinArea(flaky, [L], [], noLimits)).scooters).toHaveLength(scooters.filter(inL).length);
    const refused = { nearest: vi.fn(api.nearest).mockRejectedValueOnce(new Error('BinBin map HTTP 403')) };
    await expect(sweepBinbinArea(refused, [L], [], noLimits)).rejects.toThrow('HTTP 403');
    await expect(sweepBinbinArea(api, [L], [], { ...noLimits, requests: 3 })).rejects.toThrow('exceeded its limits');
  });

  it('asks three at a time', async () => {
    const { api } = simulated(() => fleet(400));
    let flying = 0, most = 0;
    const slow = { nearest: async (lat: number, lng: number, radiusM?: number) => {
      most = Math.max(most, ++flying);
      await new Promise(resolve => setTimeout(resolve, 1));
      flying--;
      return api.nearest(lat, lng, radiusM);
    } };
    expect((await sweepBinbinArea(slow, [L], [], noLimits)).scooters).toHaveLength(fleet(400).filter(inL).length);
    expect(most).toBe(3);
  });

  it('plans nothing from fewer than ten known scooters', async () => {
    expect(await planBinbinSweep([L], fleet(400).slice(0, 9))).toEqual([]);
  });
});

describe('BinBin areas in the cache', () => {
  const eskisehir = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'binbin_tr_eskisehir')!;

  it('collects each BinBin feed by sweeping its area, every two hours when idle, from the positions last published for it', async () => {
    const feeds = independentCollectableFeeds();
    const feed = feeds.find(candidate => candidate.id === 'turkey:binbin_tr_eskisehir')!;
    expect(feed).toMatchObject({ provider: 'binbin', source: 'turkey', host: 'gatewayapi-sp.binbinapp.com' });
    expect(feed.zoneSource).toBeUndefined();
    const scooters = [{ id: '7001', lat: 39.7767, lng: 30.5206 }, { id: '7002', lat: 39.7801, lng: 30.5102 }, { id: '7003', lat: 39.5, lng: 30.5 }];
    const { api } = simulated(() => scooters);
    const previous = vi.fn(() => []);
    const wrapped = withBinbinAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS, previous, api);
    const started = Date.now();
    const result = await wrapped.find(candidate => candidate.id === feed.id)!.collect();
    expect(previous).toHaveBeenCalledWith('turkey:binbin_tr_eskisehir');
    expect(result.observedAt).toBeGreaterThanOrEqual(started);
    expect(result.vehicles).toEqual([
      { provider: 'binbin', vehicle_id: 'binbin_tr_eskisehir:7001', lat: 39.7767, lng: 30.5206, battery: 64, range_m: null, deep_link: null, distance_m: null },
      { provider: 'binbin', vehicle_id: 'binbin_tr_eskisehir:7002', lat: 39.7801, lng: 30.5102, battery: 64, range_m: null, deep_link: null, distance_m: null },
    ]);
    expect(wrapped.filter((candidate, i) => candidate !== feeds[i]).map(candidate => candidate.id))
      .toEqual(REGIONAL_SCOOTER_SYSTEMS.filter(system => system.binbinAppArea).map(system => `${COUNTRY_SOURCES[system.country]}:${system.id}`));
    expect(BINBIN_IDLE_INTERVAL_MS).toBe(2 * 60 * 60_000);
    expect(wrapped.filter((candidate, i) => candidate !== feeds[i]).every(candidate => candidate.idleIntervalMs === BINBIN_IDLE_INTERVAL_MS))
      .toBe(true);
  });

  it('plans the sweep after a failed one from what that one saw', async () => {
    const scooters = fleet(400).map(scooter => ({ ...scooter, id: `e${scooter.id}` }));
    const { api } = simulated(() => scooters);
    const cold = (await collectBinbinArea(eskisehir, [], api)).vehicles;
    const coldRequests = api.nearest.mock.calls.length;
    let calls = 0;
    const failing = { nearest: async (lat: number, lng: number, radiusM?: number) => {
      if (++calls > coldRequests / 2) throw new Error('BinBin map HTTP 403');
      return api.nearest(lat, lng, radiusM);
    } };
    await expect(collectBinbinArea(eskisehir, [], failing)).rejects.toThrow('HTTP 403');
    api.nearest.mockClear();
    const ids = (vehicles: { vehicle_id: string | null }[]) => vehicles.map(vehicle => vehicle.vehicle_id).sort();
    expect(ids((await collectBinbinArea(eskisehir, [], api)).vehicles)).toEqual(ids(cold));
    expect(api.nearest.mock.calls.length).toBeLessThan(coldRequests * 0.85);
  }, 15_000);

  it('refuses a system that is not a BinBin area', async () => {
    const { api } = simulated(() => []);
    await expect(collectBinbinArea({ ...eskisehir, binbinAppArea: undefined }, [], api)).rejects.toThrow('Not a BinBin app map area');
    await expect(collectBinbinArea({ ...eskisehir, binbinAppArea: '999' }, [], api)).rejects.toThrow('Not a BinBin app map area');
  });
});
