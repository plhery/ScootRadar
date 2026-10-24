import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { collectVoiRegion, parseVoiVehicles, VoiClient } from './voiApp';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const initialTime = 1_800_000_000_000;
const token = (expires: number, marker = 'initial') =>
  `e30.${Buffer.from(JSON.stringify({ exp: expires, marker })).toString('base64url')}.signature`;
const authToken = token(initialTime / 1000 + 540 * 86400);
const deviceId = '0123456789abcdef';
const emptyMap = () => Response.json({ data: { vehicle_groups: [] } });
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'voi-client-'));
  directories.push(directory);
  const sessionPath = join(directory, 'voi-session.json');
  await writeFile(sessionPath, JSON.stringify({ version: 1, authenticationToken: authToken, deviceId }), { mode: 0o600 });
  const fetch = vi.fn<typeof globalThis.fetch>();
  let now = initialTime;
  const client = new VoiClient({ sessionPath, fetch, now: () => now, intervalMs: 0 });
  return { client, fetch, sessionPath, directory, advance: (milliseconds: number) => { now += milliseconds; },
    session: (marker = 'access', authenticationToken = authToken) =>
      Response.json({ accessToken: token(now / 1000 + 900, marker), authenticationToken }) };
}

describe('Voi rider session', () => {
  it('renews once for concurrent maps, uses the required app headers, and keeps login tokens off map requests', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async (url, init) => {
      if (String(url).endsWith('/auth/session')) {
        expect(init?.method).toBe('POST');
        expect(JSON.parse(String(init?.body))).toEqual({ authenticationToken: authToken });
        const headers = new Headers(init?.headers);
        expect(headers.get('X-App-Name')).toBe('Rider');
        expect(headers.get('X-App-Version')).toBe('3.360.0');
        expect(headers.get('X-Device-Id')).toBe(deviceId);
        return f.session();
      }
      expect(init?.body).toBeUndefined();
      expect(new Headers(init?.headers).get('X-Access-Token')).toBe(token(initialTime / 1000 + 900, 'access'));
      expect(init?.redirect).toBe('error');
      return emptyMap();
    });
    await Promise.all([f.client.vehicles('1'), f.client.vehicles('2')]);
    expect(f.fetch.mock.calls.filter(([url]) => String(url).endsWith('/auth/session'))).toHaveLength(1);
    expect(f.fetch.mock.calls.filter(([url]) => String(url).includes('/rides/vehicles?'))).toHaveLength(2);
    expect(await readFile(f.sessionPath, 'utf8')).not.toContain('accessToken');
  });

  it('reuses an access token until renewal and persists a rotated login for the next process', async () => {
    const f = await fixture();
    const rotated = token(initialTime / 1000 + 600 * 86400, 'rotated');
    f.fetch.mockImplementation(async url => String(url).endsWith('/auth/session') ? f.session('access', rotated) : emptyMap());
    await f.client.vehicles('1');
    await f.client.vehicles('1');
    expect(f.fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(await readFile(f.sessionPath, 'utf8')).authenticationToken).toBe(rotated);
    expect((await stat(f.sessionPath)).mode & 0o777).toBe(0o600);
    expect(await readdir(join(f.directory, 'tmp'))).toEqual([]);
    f.advance(15 * 60_000);
    await f.client.vehicles('1');
    expect(f.fetch).toHaveBeenCalledTimes(5);
    expect(JSON.parse(String(f.fetch.mock.calls[3][1]?.body)).authenticationToken).toBe(rotated);
    const restarted = new VoiClient({ sessionPath: f.sessionPath, fetch: f.fetch, now: () => initialTime, intervalMs: 0 });
    await restarted.vehicles('1');
    expect(JSON.parse(String(f.fetch.mock.calls[5][1]?.body)).authenticationToken).toBe(rotated);
  });

  it('replaces a rejected access token once and retries the same map', async () => {
    const f = await fixture();
    let renewals = 0;
    let maps = 0;
    f.fetch.mockImplementation(async url => {
      if (String(url).endsWith('/auth/session')) return f.session(`access-${++renewals}`);
      return ++maps === 1 ? new Response(null, { status: 401 }) : emptyMap();
    });
    await expect(f.client.vehicles('1')).resolves.toEqual({ data: { vehicle_groups: [] } });
    expect(renewals).toBe(2);
    expect(maps).toBe(2);
  });

  it('backs off after rejected authentication and does not include credentials or upstream bodies in errors', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValue(Response.json({ error: authToken }, { status: 401 }));
    await expect(f.client.vehicles('1')).rejects.toThrow('Voi session HTTP 401');
    await expect(f.client.vehicles('2')).rejects.not.toThrow(authToken);
    expect(f.fetch).toHaveBeenCalledTimes(1);
    f.advance(60_000);
    f.fetch.mockImplementation(async url => String(url).endsWith('/auth/session') ? f.session() : emptyMap());
    await expect(f.client.vehicles('2')).resolves.toEqual({ data: { vehicle_groups: [] } });
  });

  it('stops repeated map authorization failures after one retry', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => String(url).endsWith('/auth/session') ? f.session() : new Response(null, { status: 401 }));
    await expect(f.client.vehicles('1')).rejects.toThrow('Voi map HTTP 401');
    await expect(f.client.vehicles('2')).rejects.toThrow('authorization was rejected');
    expect(f.fetch).toHaveBeenCalledTimes(4);
  });

  it('honors a provider rate limit for other regions too', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => String(url).endsWith('/auth/session') ? f.session() :
      new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    await expect(f.client.vehicles('1')).rejects.toThrow('Voi map HTTP 429');
    await expect(f.client.vehicles('2')).rejects.toThrow('temporarily rate limited');
    expect(f.fetch).toHaveBeenCalledTimes(2);
    f.advance(120_000);
    f.fetch.mockResolvedValue(emptyMap());
    await f.client.vehicles('2');
    expect(f.fetch).toHaveBeenCalledTimes(3);
  });

  it('rejects missing credentials, expired tokens, and invalid session replies without publishing an empty map', async () => {
    const f = await fixture();
    await writeFile(f.sessionPath, 'invalid private seed');
    await expect(f.client.vehicles('1')).rejects.toThrow('credentials are missing or unreadable');
    expect(f.fetch).not.toHaveBeenCalled();
    const other = await fixture();
    other.fetch.mockResolvedValue(Response.json({ accessToken: token(initialTime / 1000 - 1), authenticationToken: authToken }));
    await expect(other.client.vehicles('1')).rejects.toThrow('expired access token');
    const invalid = await fixture();
    invalid.fetch.mockResolvedValue(Response.json({ data: [] }));
    await expect(invalid.client.vehicles('1')).rejects.toThrow('session response is invalid');
  });
});

const scooter = (id = 'scooter-a', overrides: Record<string, unknown> = {}) => ({
  id, category: 'scooter', location: { lat: 59.33, lng: 18.07 }, battery: 72, zone_id: '1', locked: true, ...overrides,
});
const map = (...vehicles: unknown[]) => ({ data: { vehicle_groups: [{ group_type: 'scooter', vehicles }] } });

describe('Voi map data', () => {
  it('keeps only scooters, validates the region, and deduplicates repeated markers', () => {
    const result = parseVoiVehicles(map(scooter(), scooter('bike', { category: 'ebike' }),
      scooter('scooter-a', { battery: 71 }), scooter('unknown-charge', { battery: 130 })), '1');
    expect(result).toEqual([
      { id: 'scooter-a', lat: 59.33, lng: 18.07, battery: 71 },
      { id: 'unknown-charge', lat: 59.33, lng: 18.07, battery: null },
    ]);
    expect(() => parseVoiVehicles(map(scooter('wrong-region', { zone_id: '2' })), '1')).toThrow('requested region');
  });

  it('distinguishes empty scooter maps from changed schemas and invalid positions', () => {
    expect(parseVoiVehicles({ data: { vehicle_groups: [] } }, '1')).toEqual([]);
    expect(parseVoiVehicles(map(scooter('bike', { category: 'ebike' })), '1')).toEqual([]);
    expect(() => parseVoiVehicles({ data: {} }, '1')).toThrow('Invalid Voi map');
    expect(() => parseVoiVehicles({ data: { vehicle_groups: [{}] } }, '1')).toThrow('Invalid Voi vehicle group');
    expect(() => parseVoiVehicles(map(scooter('bad', { location: { lat: NaN, lng: 18 } })), '1')).toThrow('Invalid Voi scooter');
  });

  it('collects the configured bounds without inventing range, fares, or rental links', async () => {
    const system: RegionalScooterSystem = { id: 'voi_se_1', country: 'SE', provider: 'voi', city: 'Stockholm',
      center: [59.33, 18.07], bounds: { south: 59.2, north: 59.5, west: 17.8, east: 18.4 },
      discoveryUrl: 'https://api.voiapp.io/v2/rides/vehicles', voiAppZone: '1' };
    const api = { vehicles: vi.fn(async () => map(scooter(), scooter('outside', { location: { lat: 60, lng: 18 } }))) };
    const result = await collectVoiRegion(system, api);
    expect(api.vehicles).toHaveBeenCalledWith('1');
    expect(result.stale).toBe(false);
    expect(result.vehicles).toEqual([{ provider: 'voi', vehicle_id: 'voi_se_1:scooter-a',
      lat: 59.33, lng: 18.07, battery: 72, range_m: null, deep_link: null, distance_m: null }]);
  });
});
