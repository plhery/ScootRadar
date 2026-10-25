import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { BoltClient, collectBoltRegion, parseBoltVehicles } from './boltApp';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const initialTime = 1_800_000_000_000;
const token = (marker: string) => `e30.${Buffer.from(JSON.stringify({ marker })).toString('base64url')}.signature`;
const refreshToken = token('refresh');
const deviceId = '01234567-89ab-cdef-0123-456789abcdef';
const riga = [56.95, 24.11] as const;
const emptyMap = () => Response.json({ code: 0, message: 'OK', data: { categories: [{ id: '25', markers_on_map: [] }] } });
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'bolt-client-'));
  directories.push(directory);
  const sessionPath = join(directory, 'bolt-session.json');
  await writeFile(sessionPath, JSON.stringify({ version: 1, refreshToken, deviceId }), { mode: 0o600 });
  const fetch = vi.fn<typeof globalThis.fetch>();
  let now = initialTime;
  const client = new BoltClient({ sessionPath, fetch, now: () => now, intervalMs: 0 });
  return { client, fetch, sessionPath, directory, advance: (milliseconds: number) => { now += milliseconds; },
    session: (marker = 'access', extra: Record<string, unknown> = {}) => Response.json({ code: 0, message: 'OK', data: {
      access_token: token(marker), expires_timestamp: now / 1000 + 3600, expires_in_seconds: 3600,
      next_update_in_seconds: 3540, next_update_give_up_timestamp: now / 1000 + 3580, ...extra } }) };
}
const renewal = (url: unknown) => String(url).includes('/getAccessToken?');

describe('Bolt rider session', () => {
  it('renews once for concurrent maps, sends the app query, and keeps the refresh token off map requests', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async (url, init) => {
      const query = new URL(String(url)).searchParams;
      expect(query.get('deviceId')).toBe(deviceId);
      expect(query.get('version')).toBe('CA.230.0');
      expect(query.get('country')).toBe('lv');
      expect(init?.redirect).toBe('error');
      if (renewal(url)) {
        expect(init?.method).toBe('POST');
        expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${refreshToken}`);
        expect(query.has('gps_lat')).toBe(false);
        return f.session();
      }
      expect(new Headers(init?.headers).get('Authorization')).toBe(`Bearer ${token('access')}`);
      expect(query.get('gps_lat')).toBe('56.95');
      const { top_right: corner } = JSON.parse(String(init?.body)).viewport;
      expect([corner.lat, corner.lng].map(value => value.toFixed(3))).toEqual(['56.955', '24.115']);
      return emptyMap();
    });
    await Promise.all([f.client.vehicles(riga, 'lv'), f.client.vehicles(riga, 'lv')]);
    expect(f.fetch.mock.calls.filter(([url]) => renewal(url))).toHaveLength(1);
    expect(f.fetch.mock.calls.filter(([url]) => String(url).includes('/getVehicles/v2?'))).toHaveLength(2);
    expect(await readFile(f.sessionPath, 'utf8')).not.toContain(token('access'));
  });

  it('reuses an access token until a minute before it expires and persists a rotated refresh token', async () => {
    const f = await fixture();
    const rotated = token('rotated');
    f.fetch.mockImplementation(async url => renewal(url) ? f.session('access', { refresh_token: rotated }) : emptyMap());
    await f.client.vehicles(riga, 'lv');
    await f.client.vehicles(riga, 'lv');
    expect(f.fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(await readFile(f.sessionPath, 'utf8'))).toEqual({ version: 1, refreshToken: rotated, deviceId });
    expect((await stat(f.sessionPath)).mode & 0o777).toBe(0o600);
    expect(await readdir(join(f.directory, 'tmp'))).toEqual([]);
    f.advance(58 * 60_000);
    await f.client.vehicles(riga, 'lv');
    expect(f.fetch).toHaveBeenCalledTimes(4);
    f.advance(60_000);
    await f.client.vehicles(riga, 'lv');
    expect(f.fetch).toHaveBeenCalledTimes(6);
    expect(new Headers(f.fetch.mock.calls[4][1]?.headers).get('Authorization')).toBe(`Bearer ${rotated}`);
  });

  it('replaces a rejected access token once and retries the same map', async () => {
    const f = await fixture();
    let renewals = 0;
    let maps = 0;
    f.fetch.mockImplementation(async url => {
      if (renewal(url)) return f.session(`access-${++renewals}`);
      return ++maps === 1 ? new Response(null, { status: 401 }) : emptyMap();
    });
    await expect(f.client.vehicles(riga, 'lv')).resolves.toMatchObject({ code: 0 });
    expect(renewals).toBe(2);
    expect(maps).toBe(2);
  });

  it('backs off after rejected authentication and keeps credentials and upstream bodies out of errors', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValue(Response.json({ error: refreshToken }, { status: 401 }));
    await expect(f.client.vehicles(riga, 'lv')).rejects.toThrow('Bolt session HTTP 401');
    await expect(f.client.vehicles(riga, 'lv')).rejects.not.toThrow(refreshToken);
    expect(f.fetch).toHaveBeenCalledTimes(1);
    f.advance(60_000);
    f.fetch.mockImplementation(async url => renewal(url) ? f.session() : emptyMap());
    await expect(f.client.vehicles(riga, 'lv')).resolves.toMatchObject({ code: 0 });
  });

  it('stops repeated map authorization failures after one retry', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => renewal(url) ? f.session() : new Response(null, { status: 401 }));
    await expect(f.client.vehicles(riga, 'lv')).rejects.toThrow('Bolt map HTTP 401');
    await expect(f.client.vehicles(riga, 'lv')).rejects.toThrow('authorization was rejected');
    expect(f.fetch).toHaveBeenCalledTimes(4);
  });

  it('honors a rate limit for every market', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async url => renewal(url) ? f.session() :
      new Response(null, { status: 429, headers: { 'Retry-After': '120' } }));
    await expect(f.client.vehicles(riga, 'lv')).rejects.toThrow('Bolt map HTTP 429');
    await expect(f.client.vehicles([59.44, 24.75], 'ee')).rejects.toThrow('temporarily rate limited');
    expect(f.fetch).toHaveBeenCalledTimes(2);
    f.advance(120_000);
    f.fetch.mockResolvedValue(emptyMap());
    await f.client.vehicles([59.44, 24.75], 'ee');
    expect(f.fetch).toHaveBeenCalledTimes(3);
  });

  it('rejects missing credentials, expired tokens and invalid session replies without publishing an empty map', async () => {
    const f = await fixture();
    await writeFile(f.sessionPath, 'invalid private seed');
    await expect(f.client.vehicles(riga, 'lv')).rejects.toThrow('credentials are missing or unreadable');
    expect(f.fetch).not.toHaveBeenCalled();
    const expired = await fixture();
    expired.fetch.mockImplementation(async () => expired.session('access', { expires_timestamp: initialTime / 1000 - 1 }));
    await expect(expired.client.vehicles(riga, 'lv')).rejects.toThrow('expired access token');
    const invalid = await fixture();
    invalid.fetch.mockResolvedValue(Response.json({ code: 0, data: [] }));
    await expect(invalid.client.vehicles(riga, 'lv')).rejects.toThrow('session response is invalid');
    await expect(invalid.client.vehicles([95, 24], 'lv')).rejects.toThrow('Invalid Bolt map request');
  });
});

const system: RegionalScooterSystem = { id: 'bolt_lv_riga', country: 'LV', provider: 'bolt', city: 'Riga',
  center: [56.95, 24.11], bounds: { south: 56.85, north: 57.1, west: 23.9, east: 24.35 },
  discoveryUrl: 'https://user.live.boltsvc.net/micromobility/search/getVehicles/v2', boltAppCity: '3', boltAppCategories: ['25', '468'] };
const vehicle = (id: number | string, overrides: Record<string, unknown> = {}) => ({ vehicle: {
  id, vehicle_type: 'scooter_25', location: { lat: 56.95, lng: 24.11 }, charge: 72, ...overrides } });
const map = (categories: Record<string, unknown[]>) => ({ code: 0, message: 'OK', data: {
  categories: Object.entries(categories).map(([id, markers_on_map]) => ({ id, markers_on_map })) } });
const scooter = (id: string, overrides: Partial<{ lat: number; lng: number; battery: number | null }> = {}) => ({
  provider: 'bolt', vehicle_id: `bolt_lv_riga:${id}`, lat: 56.95, lng: 24.11, battery: 72,
  range_m: null, deep_link: null, distance_m: null, ...overrides });

describe('Bolt map data', () => {
  it('keeps the market\'s scooters inside the bounds, once each, with their charge unless Bolt hides it', () => {
    expect(parseBoltVehicles(map({
      25: [vehicle(1), vehicle(1, { charge: 71 }), vehicle(2, { hide_battery_charge: true }), vehicle(3, { charge: 130 }),
        vehicle(4, { location: { lat: 56.5, lng: 24.11 } })],
      468: [vehicle('a-5', { vehicle_type: 'scooter_468' })],
      1220: [vehicle(6, { vehicle_type: 'mechanical_bike_1220' }), vehicle(7, { vehicle_type: 'ebike_540' })],
    }), system)).toEqual([scooter('1', { battery: 71 }), scooter('2', { battery: null }), scooter('3', { battery: null }), scooter('a-5')]);
  });

  it('refuses another market\'s answer, changed schemas and invalid positions, and keeps an empty market empty', () => {
    expect(parseBoltVehicles(map({ 25: [] }), system)).toEqual([]);
    expect(() => parseBoltVehicles(map({ 1: [vehicle(1, { vehicle_type: 'scooter_1' })] }), system)).toThrow('another market');
    expect(() => parseBoltVehicles({ code: 503, data: { categories: [] } }, system)).toThrow('Invalid Bolt map response');
    expect(() => parseBoltVehicles({ code: 0, data: { categories: [{ id: 25 }] } }, system)).toThrow('Invalid Bolt vehicle category');
    expect(() => parseBoltVehicles(map({ 25: [{}] }), system)).toThrow('Invalid Bolt vehicle');
    expect(() => parseBoltVehicles(map({ 25: [vehicle(1, { location: { lat: NaN, lng: 24 } })] }), system)).toThrow('Invalid Bolt scooter');
    expect(() => parseBoltVehicles(map({ 25: [vehicle('../1')] }), system)).toThrow('Invalid Bolt scooter');
  });

  it('collects from the system\'s centre in its country without inventing range or rental links', async () => {
    const api = { vehicles: vi.fn(async () => map({ 25: [vehicle(1)] })) };
    const result = await collectBoltRegion(system, api);
    expect(api.vehicles).toHaveBeenCalledWith([56.95, 24.11], 'lv');
    expect(result.stale).toBe(false);
    expect(result.vehicles).toEqual([scooter('1')]);
    await expect(collectBoltRegion({ ...system, boltAppCategories: [] }, api)).rejects.toThrow('Not a Bolt app map region');
  });
});
