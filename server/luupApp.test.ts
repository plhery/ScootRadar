import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS } from '../src/lib/regionalScooterSystems';
import { haversineM } from '../src/lib/geo';
import { collectLuupRegion, LuupClient, luupMapQuery, parseLuupPorts, withLuupAppCollectors } from './luupApp';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const region = REGIONAL_SCOOTER_SYSTEMS.find(s => s.id === 'luup_jp_shibuya')!;
const now = Date.parse('2026-10-24T03:00:00Z'); // Noon in Japan, Saturday.
const token = (expiry: number, audience = 'luup-prod', suffix = 'test') =>
  `e30.${Buffer.from(JSON.stringify({ exp: expiry / 1000, aud: audience })).toString('base64url')}.${suffix}`;
const port = (id = '1', changes: Record<string, unknown> = {}) => ({ portId: id, cityId: 'shibuya',
  location: { latitude: 35.6595, longitude: 139.7005 }, isAvailable: true, availableKickboardCount: 2,
  availableCycleCount: 5, availableSeatboardCount: 3, openAt: null, closeAt: null, ...changes });

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'luup-client-'));
  directories.push(directory);
  const sessionPath = join(directory, 'luup-session.json');
  const fetch = vi.fn<typeof globalThis.fetch>();
  let clock = now;
  const options = { apiKey: 'private-test-key', refreshToken: 'private-test-refresh', sessionPath, fetch,
    now: () => clock, intervalMs: 0, timeoutMs: 25 };
  const session = (refresh = options.refreshToken, audience = 'luup-prod') => Response.json({
    id_token: token(clock + 3_600_000, audience), refresh_token: refresh, expires_in: '3600', token_type: 'Bearer',
  });
  return { directory, sessionPath, fetch, options, session, client: new LuupClient(options), advance: (ms: number) => { clock += ms; } };
}

describe('LUUP station counts', () => {
  it('covers every city corner within the API radius limit', () => {
    const regions = REGIONAL_SCOOTER_SYSTEMS.filter(s => s.luupAppCities);
    expect(regions).toHaveLength(19);
    for (const system of regions) {
      const query = luupMapQuery(system.bounds);
      const radius = Number(query.get('radiusInMeter'));
      expect(radius).toBeLessThanOrEqual(100_000);
      for (const lat of [system.bounds.south, system.bounds.north]) for (const lng of [system.bounds.west, system.bounds.east]) {
        expect(haversineM(Number(query.get('lat')), Number(query.get('lng')), lat, lng)).toBeLessThan(radius);
      }
    }
    expect(() => luupMapQuery({ south: 24, north: 46, west: 122, east: 146 })).toThrow('budget');
    expect(() => luupMapQuery({ ...region.bounds, west: NaN })).toThrow('bounds');
  });

  it('keeps only standing scooters at open ports in the requested regions and bounds', () => {
    const vehicles = parseLuupPorts([port(), port('2', { cityId: 'tokyo-east', availableKickboardCount: 1 }),
      port('3', { cityId: 'osaka' }), port('4', { isAvailable: false }),
      port('5', { location: { latitude: 34.68, longitude: 135.5 } })], region, now);
    expect(vehicles).toHaveLength(3);
    expect(vehicles.map(v => v.vehicle_id)).toEqual([
      'luup_jp_shibuya:station:1:1', 'luup_jp_shibuya:station:1:2', 'luup_jp_shibuya:station:2:1',
    ]);
    expect(vehicles.every(v => v.provider === 'luup' && v.battery === null && v.range_m === null && v.deep_link === null)).toBe(true);
  });

  it('deduplicates ports, keeps stable ordinal ids when counts fall, and supports large real ports', () => {
    expect(parseLuupPorts([port(), port()], region, now)).toHaveLength(2);
    const smaller = parseLuupPorts([port('1', { availableKickboardCount: 1 })], region, now);
    expect(smaller[0].vehicle_id).toBe(parseLuupPorts([port()], region, now)[0].vehicle_id);
    expect(parseLuupPorts([port('1', { availableKickboardCount: 84 })], region, now)).toHaveLength(84);
    expect(parseLuupPorts([port(), port('1', { isAvailable: false })], region, now)).toEqual([]);
  });

  it('honors local port hours, midnight closings and conservative holiday schedules', () => {
    const hours = { openAt: { Sat: '09:00', Hol: '10:00' }, closeAt: { Sat: '18:00', Hol: '17:00' } };
    expect(parseLuupPorts([port('1', hours)], region, now)).toHaveLength(2);
    expect(parseLuupPorts([port('1', hours)], region, Date.parse('2026-10-24T08:30:00Z'))).toEqual([]);
    expect(parseLuupPorts([port('1', { openAt: { Sat: '09:00' }, closeAt: { Sat: '00:00' } })], region, now)).toHaveLength(2);
    expect(parseLuupPorts([port('1', { openAt: { Sat: '22:00' }, closeAt: { Sat: '04:00' } })], region, now)).toEqual([]);
  });

  it('rejects malformed status instead of treating it as an empty successful map', () => {
    for (const payload of [{ error: 'Unauthorized' }, [port('1', { availableKickboardCount: -1 })],
      [port('1', { availableKickboardCount: 1.5 })], [port('1', { availableKickboardCount: 501 })],
      [port('1', { isAvailable: undefined })], [port('1', { location: { latitude: NaN, longitude: 139 } })],
      [port('1', { openAt: {}, closeAt: { Sat: '18:00' } }) , port('2', { openAt: 'bad', closeAt: {} })]]) {
      expect(() => parseLuupPorts(payload, region, now)).toThrow('Invalid LUUP');
    }
    expect(parseLuupPorts([], region, now)).toEqual([]);
  });

  it('wires private collectors without exposing credentials or attempting GBFS discovery', async () => {
    const feeds = independentCollectableFeeds();
    const configured = withLuupAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    expect(configured.find(f => f.id === 'publibike')).toBe(feeds.find(f => f.id === 'publibike'));
    const luup = configured.find(f => f.id === `japan:${region.id}`)!;
    expect(luup.zoneSource).toBeUndefined();
    expect(luup.collect).not.toBe(feeds.find(f => f.id === luup.id)!.collect);
    const snapshot = await collectLuupRegion(region, { ports: vi.fn(async () => [port()]) });
    expect(snapshot).toMatchObject({ stale: false, vehicles: expect.any(Array), observedAt: expect.any(Number) });
    expect(snapshot.vehicles).toHaveLength(2);
  });
});

describe('LUUP private session and transport', () => {
  it('renews once for concurrent readers, caches access tokens and reuses a persisted rotation after restart', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => String(url).startsWith('https://securetoken.') ? f.session('rotated-refresh') : Response.json([]));
    await Promise.all([f.client.ports(region.bounds), f.client.ports(region.bounds)]);
    expect(f.fetch).toHaveBeenCalledTimes(3);
    expect((await stat(f.sessionPath)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(f.sessionPath, 'utf8')).refreshToken).toBe('rotated-refresh');
    expect(await readdir(join(f.directory, 'tmp'))).toEqual([]);
    await new LuupClient(f.options).ports(region.bounds);
    expect(new URLSearchParams(String(f.fetch.mock.calls[3][1]?.body)).get('refresh_token')).toBe('rotated-refresh');
    f.advance(3_600_000);
    await f.client.ports(region.bounds);
    expect(f.fetch).toHaveBeenCalledTimes(7);
    const replaced = new LuupClient({ ...f.options, refreshToken: 'replacement-login' });
    await replaced.ports(region.bounds);
    expect(new URLSearchParams(String(f.fetch.mock.calls[7][1]?.body)).get('refresh_token')).toBe('replacement-login');
  });

  it('renews a rejected ID token once and backs off on repeated 403s', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => String(url).startsWith('https://securetoken.') ? f.session() : new Response(null, { status: 403 }));
    await expect(f.client.ports(region.bounds)).rejects.toThrow('LUUP port reader HTTP 403');
    expect(f.fetch).toHaveBeenCalledTimes(4);
    await expect(f.client.ports(region.bounds)).rejects.toThrow('temporarily unavailable');
    expect(f.fetch).toHaveBeenCalledTimes(4);
  });

  it('does not leak upstream bodies, keys, tokens or fetch errors and retries only after the cooldown', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValue(Response.json({ error: f.options.refreshToken }, { status: 400 }));
    await expect(f.client.ports(region.bounds)).rejects.toThrow('LUUP session HTTP 400');
    await expect(f.client.ports(region.bounds)).rejects.toThrow('temporarily unavailable');
    expect(f.fetch).toHaveBeenCalledTimes(1);
    f.advance(60_000);
    f.fetch.mockRejectedValue(new Error(`request contained ${f.options.apiKey}`));
    await expect(f.client.ports(region.bounds)).rejects.toThrow('LUUP request failed or timed out');
  });

  it('rejects missing credentials, expired tokens, wrong-project tokens and invalid auth responses', async () => {
    const f = await fixture();
    await expect(new LuupClient({ ...f.options, refreshToken: '' }).ports(region.bounds)).rejects.toThrow('credentials');
    expect(f.fetch).not.toHaveBeenCalled();
    for (const data of [{ id_token: token(now - 1), refresh_token: 'test', expires_in: '3600', token_type: 'Bearer' },
      { id_token: token(now + 3_600_000, 'other-project'), refresh_token: 'test', expires_in: '3600', token_type: 'Bearer' },
      { error: 'Unauthorized' }]) {
      f.fetch.mockResolvedValue(Response.json(data));
      await expect(new LuupClient(f.options).ports(region.bounds)).rejects.toThrow('session response is invalid');
    }
  });

  it('shares rate-limit backoff between city readers and refuses redirects', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => String(url).startsWith('https://securetoken.') ? f.session() :
      new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    await expect(f.client.ports(region.bounds)).rejects.toThrow('HTTP 429');
    await expect(f.client.ports(region.bounds)).rejects.toThrow('rate limited');
    expect(f.fetch).toHaveBeenCalledTimes(2);
    expect(f.fetch.mock.calls.every(([, init]) => init?.redirect === 'error' && init.signal instanceof AbortSignal)).toBe(true);
    f.advance(120_000);
    f.fetch.mockResolvedValue(Response.json([]));
    await expect(f.client.ports(region.bounds)).resolves.toEqual([]);
  });

  it('bounds response bodies and sanitizes malformed JSON', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => String(url).startsWith('https://securetoken.') ? f.session() : new Response('not json'));
    await expect(f.client.ports(region.bounds)).rejects.toThrow('LUUP returned invalid JSON');
    f.fetch.mockResolvedValue(new Response(new ReadableStream({ start(controller) {
      controller.enqueue(new Uint8Array(32 * 1024 * 1024 + 1)); controller.close();
    } })));
    await expect(f.client.ports(region.bounds)).rejects.toThrow('LUUP response exceeds the size limit');
  });
});
