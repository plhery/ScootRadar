import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem, serviceAreas } from '../src/lib/regionalScooterSystems';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { boundsContainPoint, haversineM } from '../src/lib/geo';
import { collectJetRiderRegion, jetRiderCircle, jetRiderRequestHash, JetRiderClient, parseJetRiderVehicles, withJetRiderAppCollectors } from './jetRiderApp';

const paths: string[] = [];
afterEach(async () => { await Promise.all(paths.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const now = 1_800_000_000_000;
const session = () => ({ version: 1, accessToken: 'private-access-token', refreshToken: 'private-refresh-token', expiresAt: now + 1800_000,
  signingKey: Buffer.alloc(64, 7).toString('base64'),
  oauth: { clientId: 'test-client', clientSecret: 'private-client-secret', scope: 'bike.api offline_access' },
  headers: { 'UR-Brand': 'JET', 'UR-Device-Id': 'test-device', 'UR-Client-Id': 'test-client', Authorization: 'untrusted-file-header' } });
const scooter = (identifier = 'S.123456', lat = 41.71, long = 44.77) => ({ identifier, type: 'Scooter', location: { lat, long }, batteryPercent: 47 });
const map = (transports: unknown[] = []) => ({ succeeded: true, errors: [], entries: { transports, parkings: [] } });
const json = (data: unknown, status = 200, headers?: HeadersInit) => new Response(JSON.stringify(data), { status, headers });
const system: RegionalScooterSystem = { id: 'jet_ge_test', provider: 'jet', country: 'GE', city: 'Test',
  center: [41.71, 44.77], bounds: { south: 41.7, north: 41.72, west: 44.76, east: 44.78 },
  discoveryUrl: 'https://service.jetscooters.fun/gatewayclient/api/v6/transports', jetRiderAppCity: '123456789012345678901234' };
async function fixture(fetch: typeof globalThis.fetch, changes: Record<string, unknown> = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'jet-rider-')); paths.push(directory);
  const sessionPath = join(directory, 'session.json');
  await writeFile(sessionPath, JSON.stringify({ ...session(), ...changes }));
  let clock = now;
  return { sessionPath, client: new JetRiderClient({ sessionPath, fetch, now: () => clock, intervalMs: 0 }), advance: (ms: number) => { clock += ms; } };
}

describe('JET rider session', () => {
  it('matches the native request-hash ordering without signing Authorization or a previous hash', () => {
    const query = new URLSearchParams({ b: 'x y', a: '1&2' });
    query.append('b', 'ignored second value');
    const result = jetRiderRequestHash({ 'UR-Z': 'last', 'UR-A': 'first', 'ur-request-data': 'old', Authorization: 'not-signed' },
      query, 'payload', session().signingKey);
    expect(result).toBe('6B349D89A291565BB8F83F289C7EEC598C9882FA0A9975D58D5171865E72F548');
  });
  it('keeps credentials on the fixed map host and sends the native map query', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(map([scooter()])));
    const { client } = await fixture(fetch);
    await client.vehicles(system.bounds, now + 10_000);
    const [input, options] = fetch.mock.calls[0]; const url = new URL(String(input));
    expect(url.origin).toBe('https://service.jetscooters.fun');
    expect(url.pathname).toBe('/gatewayclient/api/v6/transports');
    expect(url.searchParams.get('zoom')).toBe('18');
    expect(url.searchParams.get('useBluetooth')).toBe('false');
    expect(url.searchParams.get('withEBikes')).toBe('true');
    expect(options?.redirect).toBe('error');
    expect(new Headers(options?.headers).get('authorization')).toBe('Bearer private-access-token');
    expect(String(input)).not.toContain('private');
    expect(options?.body).toBeUndefined();
  });

  it('renews once for concurrent readers, persists rotation privately and survives a restart', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async (_url, options) => {
      if (options?.method === 'POST') {
        const body = new URLSearchParams(String(options.body));
        expect(body.get('grant_type')).toBe('refresh_token');
        expect(body.get('refresh_token')).toBe('private-refresh-token');
        expect(body.get('username')).toBeNull(); expect(body.get('password')).toBeNull();
        return json({ access_token: 'renewed-access-token', refresh_token: 'rotated-refresh-token', expires_in: 1800 });
      }
      expect(new Headers(options?.headers).get('authorization')).toBe('Bearer renewed-access-token');
      return json(map());
    });
    const { client, sessionPath } = await fixture(fetch, { expiresAt: now - 1 });
    await Promise.all([client.vehicles(system.bounds, now + 10_000), client.vehicles(system.bounds, now + 10_000)]);
    expect(fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
    const saved = JSON.parse(await readFile(sessionPath, 'utf8'));
    expect(saved.refreshToken).toBe('rotated-refresh-token');
    expect(saved.headers.authorization).toBeUndefined();
    expect((await stat(sessionPath)).mode & 0o777).toBe(0o600);
    await new JetRiderClient({ sessionPath, fetch, now: () => now, intervalMs: 0 }).vehicles(system.bounds, now + 10_000);
    expect(fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(1);
  });

  it('recovers one rejected access token and stops after a second refusal', async () => {
    let maps = 0;
    const fetch = vi.fn<typeof globalThis.fetch>(async (_url, options) => options?.method === 'POST'
      ? json({ access_token: 'renewed-access-token', refresh_token: 'rotated-refresh-token', expires_in: 1800 })
      : ++maps === 1 ? json({ private: 'upstream-secret' }, 401) : json(map()));
    const { client } = await fixture(fetch);
    await expect(client.vehicles(system.bounds, now + 10_000)).resolves.toEqual(map());
    expect(fetch).toHaveBeenCalledTimes(3);
    fetch.mockImplementation(async (_url, options) => options?.method === 'POST'
      ? json({ access_token: 'another-access-token', refresh_token: 'another-refresh-token', expires_in: 1800 }) : json({}, 401));
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow('JET rider session was rejected');
    expect(fetch).toHaveBeenCalledTimes(6);
  });

  it('holds off rejected renewal without exposing the server reply or overwriting the session', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({ error: 'private-refresh-token' }, 400));
    const { client, sessionPath } = await fixture(fetch, { expiresAt: now - 1 });
    const original = await readFile(sessionPath, 'utf8');
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow('JET rider renewal HTTP 400');
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow('temporarily unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await readFile(sessionPath, 'utf8')).toBe(original);
  });

  it.each([403, 429])('honours HTTP %s and its retry delay across readers', async status => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json({}, status, { 'retry-after': '120' }));
    const { client, advance } = await fixture(fetch);
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow(`HTTP ${status}`);
    advance(119_999);
    await expect(client.vehicles(system.bounds, now + 200_000)).rejects.toThrow('temporarily held off');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('validates bounds and budgets before sending a credential', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(); const { client } = await fixture(fetch);
    await expect(client.vehicles({ ...system.bounds, east: NaN })).rejects.toThrow('Invalid JET rider map bounds');
    await expect(client.vehicles({ south: 0, north: 1, west: 0, east: 1 })).rejects.toThrow('view is too large');
    await expect(client.vehicles(system.bounds, now)).rejects.toThrow('timed out');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('bounds response size and hides malformed data and transport failures', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response('private-response-body'));
    const { client } = await fixture(fetch);
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow('response was not JSON');
    fetch.mockImplementation(async () => new Response('x'.repeat(2 * 1024 * 1024 + 1)));
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow('size limit');
    fetch.mockImplementation(async () => { throw new Error('private-refresh-token'); });
    await expect(client.vehicles(system.bounds, now + 10_000)).rejects.toThrow('request failed or timed out');
  });
});

describe('JET rider collection', () => {
  it('reads only individual standing scooters and never adds parking or bike totals', () => {
    const payload = map([scooter(), { type: 'Bike' }, { type: 'EBike' }, { ...scooter('S.2'), batteryPercent: null }]);
    payload.entries.parkings = [{ countScooters: 1000, countBikes: 1000 }] as never[];
    const parsed = parseJetRiderVehicles(payload);
    expect(parsed.count).toBe(4); expect(parsed.vehicles).toHaveLength(2);
    expect(parsed.vehicles[0]).toMatchObject({ provider: 'jet', vehicle_id: 'jet-rider:S.123456', battery: 47, range_m: null });
    expect(parsed.vehicles[1].battery).toBeNull();
  });

  it.each([map([{ ...scooter(), batteryPercent: 101 }]), map([{ ...scooter(), location: { lat: 41, long: NaN } }]),
    { ...map(), succeeded: false }, { ...map(), errors: [{ message: 'private-server-details' }] }, { succeeded: true, errors: [] }])(
    'rejects invalid or unsuccessful replies', payload => { expect(() => parseJetRiderVehicles(payload)).toThrow(); });

  it('covers every corner with a bounded circle, including at high latitudes', () => {
    const bounds = { south: 70, north: 70.02, west: 28, east: 28.04 };
    const circle = jetRiderCircle(bounds);
    for (const lat of [bounds.south, bounds.north]) for (const lng of [bounds.west, bounds.east]) {
      expect(haversineM(circle.latitude, circle.longitude, lat, lng)).toBeLessThan(circle.radius);
    }
  });

  it('refines capped maps using the unfiltered item count, deduplicates overlaps and clips to the reviewed area', async () => {
    const vehicles = vi.fn().mockResolvedValue(map([scooter(), scooter('outside', 42, 45)]));
    vehicles.mockResolvedValueOnce(map(Array.from({ length: 400 }, () => ({ type: 'Bike' }))));
    const result = await collectJetRiderRegion(system, { vehicles });
    expect(vehicles).toHaveBeenCalledTimes(5);
    expect(result.vehicles).toHaveLength(1); expect(result.stale).toBe(false);
    expect(new Set(vehicles.mock.calls.map(call => call[1])).size).toBe(1);
  });

  it('never returns a partial sweep after a child fails or a dense pile stays capped', async () => {
    const vehicles = vi.fn().mockResolvedValueOnce(map(Array.from({ length: 400 }, () => ({ type: 'Bike' }))))
      .mockResolvedValueOnce(map([scooter()])).mockRejectedValueOnce(new Error('upstream unavailable'));
    await expect(collectJetRiderRegion(system, { vehicles })).rejects.toThrow('upstream unavailable');
    vehicles.mockResolvedValue(map(Array.from({ length: 400 }, () => ({ type: 'Bike' }))));
    await expect(collectJetRiderRegion(system, { vehicles })).rejects.toThrow('remains capped');
  });

  it('collects disjoint town areas and excludes the unreviewed gap', async () => {
    const left = { ...system, bounds: { ...system.bounds, east: 44.765 } };
    const right = { ...system, bounds: { ...system.bounds, west: 44.775 } };
    const vehicles = vi.fn().mockResolvedValue(map([scooter('left', 41.71, 44.762), scooter('gap'), scooter('right', 41.71, 44.778)]));
    const result = await collectJetRiderRegion({ ...system, areas: [left, right] }, { vehicles });
    expect(vehicles).toHaveBeenCalledTimes(2);
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual(['jet-rider:left', 'jet-rider:right']);
  });

  it('wires reviewed catalogs as app maps without overlapping Go Jet regions', () => {
    const regions = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.jetRiderAppCity);
    expect(regions).toHaveLength(10);
    expect(new Set(regions.map(system => system.country))).toEqual(new Set(['UZ', 'GE']));
    const goJet = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.jetAppMap);
    for (const region of regions) {
      expect(isAppMapSystem(region)).toBe(true);
      expect(region.jetRiderAppCity).toMatch(/^[a-f0-9]{24}$/);
      for (const area of serviceAreas(region)) {
        expect(boundsContainPoint(region.bounds, ...area.center)).toBe(true);
        expect(goJet.some(other => other.country === region.country && other.city === area.city)).toBe(false);
      }
    }
    const feeds = regions.map(region => ({ id: `test:${region.id}` }));
    expect(withJetRiderAppCollectors(feeds as never, regions).every(feed => typeof feed.collect === 'function')).toBe(true);
  });
});
