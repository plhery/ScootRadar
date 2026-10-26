import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { latLngToCell } from 'h3-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { BeamClient, beamMapCells, beamRegionCells, collectBeamRegion, parseBeamVehicles, withBeamAppCollectors } from './beamApp';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const region = { id: 'beam_au_darwin', provider: 'beam', country: 'AU', city: 'Darwin', beamAppCity: 1091,
  center: [-12.4634, 130.8456], bounds: { south: -12.49, north: -12.4, west: 130.82, east: 130.9 },
  discoveryUrl: 'https://gateway.ridebeam.com/query' } as RegionalScooterSystem;
const now = Date.parse('2026-10-24T16:00:00Z');
const token = (expiry = now + 30 * 86400_000, id = 123) =>
  `e30.${Buffer.from(JSON.stringify({ exp: expiry / 1000, id })).toString('base64url')}.signature`;
const scooter = (changes: Record<string, unknown> = {}) => ({ id: 91, cityId: 1091, formFactor: 'ESCOOTER',
  latitude: -12.46, longitude: 130.85, batteryLevel: 74, ...changes });
const cells = [latLngToCell(region.center[0], region.center[1], 8)];
const map = () => Response.json({ data: { vehiclesByH3: [scooter()] } });
const unauthorized = () => Response.json({ errors: [{ message: 'Unauthorized' }], data: null });
async function fixture(expiry = now + 30 * 86400_000) {
  const directory = await mkdtemp(join(tmpdir(), 'beam-client-'));
  directories.push(directory);
  const sessionPath = join(directory, 'beam-session.json');
  const session = { version: 1, userId: 123, authToken: token(expiry), refreshToken: 'private-test-refresh' };
  await writeFile(sessionPath, JSON.stringify(session), { mode: 0o600 });
  const fetch = vi.fn<typeof globalThis.fetch>();
  let clock = now;
  const options = { sessionPath, fetch, now: () => clock, intervalMs: 0, timeoutMs: 25 };
  const renewed = (refreshToken = 'rotated-test-refresh', id = 123) => Response.json({
    data: { refreshToken: { authToken: token(clock + 30 * 86400_000, id), refreshToken } },
  });
  return { directory, sessionPath, session, fetch, options, renewed, client: new BeamClient(options), advance: (ms: number) => { clock += ms; } };
}

describe('Beam H3 collection', () => {
  it('covers every boundary and tiny views, including southern-hemisphere cities', () => {
    for (const bounds of [region.bounds, { south: 37.55001, north: 37.55002, west: 126.99001, east: 126.99002 }]) {
      const cells = new Set(beamMapCells(bounds));
      for (let row = 0; row <= 20; row++) for (let column = 0; column <= 20; column++) {
        const lat = bounds.south + row * (bounds.north - bounds.south) / 20;
        const lng = bounds.west + column * (bounds.east - bounds.west) / 20;
        expect(cells.has(latLngToCell(lat, lng, 8))).toBe(true);
      }
    }
    expect(() => beamMapCells({ ...region.bounds, north: NaN })).toThrow('bounds');
    expect(() => beamMapCells({ south: -12, north: 30, west: 100, east: 130 })).toThrow('budget');
  });

  it('covers disjoint campus envelopes without filling their empty gap or exceeding reviewed coverage', () => {
    const areas = [{ south: -12.49, north: -12.48, west: 130.82, east: 130.83 },
      { south: -12.41, north: -12.4, west: 130.89, east: 130.9 }];
    const cells = new Set(beamRegionCells({ ...region, beamAppAreas: areas }));
    for (const area of areas) for (const lat of [area.south, area.north]) for (const lng of [area.west, area.east]) {
      expect(cells.has(latLngToCell(lat, lng, 8))).toBe(true);
    }
    expect(cells.has(latLngToCell(-12.445, 130.86, 8))).toBe(false);
    expect(() => beamRegionCells({ ...region, beamAppAreas: [{ ...areas[0], north: -10 }] })).toThrow('reviewed bounds');
    expect(() => beamRegionCells({ ...region, beamAppAreas: [] })).toThrow('operating areas');
  });

  it('keeps only standing scooters in the reviewed city and envelope, deduplicating stable ids', () => {
    const vehicles = parseBeamVehicles([scooter(), scooter({ batteryLevel: 80 }), scooter({ id: 2, formFactor: 'EBIKE' }),
      scooter({ id: 3, formFactor: 'ESCOOTER_SEATED' }), scooter({ id: 4, cityId: 12 }),
      scooter({ id: 5, latitude: -20 }), scooter({ id: 6, formFactor: '' })], region);
    expect(vehicles).toEqual([{ provider: 'beam', vehicle_id: 'beam:91', lat: -12.46, lng: 130.85, battery: 80,
      range_m: null, deep_link: null, distance_m: null }]);
    for (const payload of [undefined, { errors: ['Unauthorized'] }, [scooter({ formFactor: undefined })]]) {
      expect(() => parseBeamVehicles(payload, region)).toThrow('Invalid Beam');
    }
    expect(parseBeamVehicles([], region)).toEqual([]);
  });

  it('leaves out a malformed scooter, and fails the collection only when every one is', async () => {
    // Each says which field Beam sent wrong, as the logs and Sentry show only the message.
    const malformed: string[] = [];
    expect(parseBeamVehicles([scooter({ latitude: 91 }), scooter({ id: 92, longitude: NaN }), scooter({ id: '93' }),
      scooter({ id: 94, cityId: undefined }), scooter({ id: 95 })], region, malformed).map(vehicle => vehicle.vehicle_id)).toEqual(['beam:95']);
    expect(malformed).toEqual(['latitude 91', 'longitude null', 'id "93"', 'cityId undefined']);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const kept = await collectBeamRegion(region, { vehicles: async () => [scooter({ latitude: 91 }), scooter({ id: 95 })] });
    expect(kept.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(['beam:95']);
    expect(JSON.parse(String(warn.mock.calls[0][0]))).toEqual({ event: 'beam_scooters_malformed', system: region.id, count: 1, first: 'latitude 91' });
    warn.mockRestore();
    await expect(collectBeamRegion(region, { vehicles: async () => [scooter({ latitude: 91 })] }))
      .rejects.toThrow('Invalid Beam scooter latitude 91');
  });

  it('keeps a scooter whose charge Beam does not know, with none', () => {
    // Beam sent 255 for one scooter in Cheongju on 26 October 2026.
    for (const batteryLevel of [255, 101, -1, 50.5, null, undefined]) {
      expect(parseBeamVehicles([scooter({ batteryLevel })], region).map(vehicle => vehicle.battery), String(batteryLevel)).toEqual([null]);
    }
    expect(parseBeamVehicles([scooter({ batteryLevel: 0 }), scooter({ id: 92, batteryLevel: 100 })], region)
      .map(vehicle => vehicle.battery)).toEqual([0, 100]);
  });

  it('collects all cells in batches and never returns a partial sweep on failure', async () => {
    const large = { ...region, bounds: { south: -12.6, north: -12.1, west: 130.7, east: 131.2 } };
    const vehicles = vi.fn(async () => [scooter()]);
    const result = await collectBeamRegion(large, { vehicles });
    expect(result.vehicles).toHaveLength(1);
    expect(result.stale).toBe(false);
    expect(vehicles.mock.calls.length).toBeGreaterThan(1);
    const requests = vehicles.mock.calls as unknown as [string[], number[], number][];
    expect(requests.flatMap(args => args[0])).toEqual(beamMapCells(large.bounds));
    expect(requests.every(args => args[0].length <= 500)).toBe(true);
    vehicles.mockResolvedValueOnce([scooter()]).mockRejectedValueOnce(new Error('failed batch'));
    await expect(collectBeamRegion(large, { vehicles })).rejects.toThrow('failed batch');
  });

  it('wires Beam feeds without GBFS or zone discovery and bounds every reviewed region', () => {
    const feeds = independentCollectableFeeds();
    const configured = withBeamAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    const systems = REGIONAL_SCOOTER_SYSTEMS.filter(s => s.beamAppCity);
    expect(systems.length).toBeGreaterThan(1);
    for (const system of systems) {
      const index = feeds.findIndex(f => f.id.endsWith(`:${system.id}`));
      expect(configured[index].collect).not.toBe(feeds[index].collect);
      expect(configured[index].zoneSource).toBeUndefined();
      expect(beamRegionCells(system).length).toBeLessThanOrEqual(10_000);
    }
    expect(configured.find(f => f.id === 'publibike')).toBe(feeds.find(f => f.id === 'publibike'));
  });
});

describe('Beam private session and transport', () => {
  it('uses the saved rider token with only bearer and location headers', async () => {
    const f = await fixture(); f.fetch.mockImplementation(async () => map());
    await f.client.vehicles(cells, region.center);
    expect(f.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = f.fetch.mock.calls[0];
    expect(url).toBe('https://gateway.ridebeam.com/query');
    expect(init).toMatchObject({ redirect: 'error', headers: { Authorization: `Bearer ${f.session.authToken}`,
      latitude: '-12.4634', longitude: '130.8456' } });
    expect(JSON.parse(String(init?.body)).variables).toEqual({ indexes: cells });
  });

  it('renews once for concurrent readers and persists token rotation privately across restarts', async () => {
    const f = await fixture(now + 60_000);
    f.fetch.mockImplementation(async (_url, init) => String(init?.body).includes('mutation(') ? f.renewed() : map());
    await Promise.all([f.client.vehicles(cells, region.center), f.client.vehicles(cells, region.center)]);
    expect(f.fetch).toHaveBeenCalledTimes(3);
    expect((await stat(f.sessionPath)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(f.sessionPath, 'utf8')).refreshToken).toBe('rotated-test-refresh');
    expect(await readdir(join(f.directory, 'tmp'))).toEqual([]);
    f.advance(30 * 86400_000);
    await new BeamClient(f.options).vehicles(cells, region.center);
    const renewed = JSON.parse(String(f.fetch.mock.calls[3][1]?.body));
    expect(renewed.variables.refreshToken).toBe('rotated-test-refresh');
  });

  it('retries a rejected token once, shares renewal and backs off after repeated refusals', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async (_url, init) => String(init?.body).includes('mutation(') ? f.renewed() : unauthorized());
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('session was rejected');
    expect(f.fetch).toHaveBeenCalledTimes(3);
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('temporarily unavailable');
    expect(f.fetch).toHaveBeenCalledTimes(3);
  });

  it('treats GraphQL errors as failed reads, withholds upstream bodies and honors rate limits', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValue(Response.json({ errors: [{ message: f.session.refreshToken }], data: { vehiclesByH3: [] } }));
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('Beam returned a GraphQL error');
    f.fetch.mockResolvedValue(new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('HTTP 429');
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('temporarily held off');
    expect(f.fetch).toHaveBeenCalledTimes(2);
    f.advance(120_000);
    f.fetch.mockRejectedValue(new Error(`request contained ${f.session.authToken}`));
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('Beam request failed or timed out');
  });

  it('rejects wrong-user renewal, invalid credentials, over-budget requests and bad responses', async () => {
    const f = await fixture(now + 60_000); f.fetch.mockResolvedValue(f.renewed('private-renewal', 999));
    await expect(f.client.vehicles(cells, region.center)).rejects.toThrow('Beam access token is invalid');
    await expect(new BeamClient({ ...f.options, sessionPath: join(f.directory, 'missing') }).vehicles(cells, region.center))
      .rejects.toThrow('credentials are missing');
    const good = await fixture();
    await expect(good.client.vehicles([], region.center)).rejects.toThrow('Invalid Beam');
    expect(good.fetch).not.toHaveBeenCalled();
    good.fetch.mockResolvedValue(new Response('not json'));
    await expect(good.client.vehicles(cells, region.center)).rejects.toThrow('invalid JSON');
    good.fetch.mockResolvedValue(Response.json({ data: null }));
    await expect(good.client.vehicles(cells, region.center)).rejects.toThrow('invalid GraphQL data');
    good.fetch.mockResolvedValue(new Response(new Uint8Array(16 * 1024 * 1024 + 1)));
    await expect(good.client.vehicles(cells, region.center)).rejects.toThrow('size limit');
  });
});
