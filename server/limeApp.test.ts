import { createPublicKey, generateKeyPairSync, verify } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { idPhase } from './feedScheduler';
import { LimeClient, LimeAccountPool, readLimeAccounts, withLimeAppCollectors, limeDaytime, LIME_IDLE_INTERVAL_MS, limeClientAssertion, LimeMapCollector, parseLimePins, limeCellCovered } from './limeApp';
import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { withinCollection } from './sweeps';

const http = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('node:https', () => ({ request: http.request }));

const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1', privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' } });
const initialTime = 1_800_000_000_000;
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
const response = (body: unknown, status = 200) => ({ status, body });
const pin = (id = 'scooter', lat = 0.0025, lng = 0.0025, extra = {}) => ({ id, type: 'scooter',
  location: { latitude: lat, longitude: lng }, battery_percentage: 65, ...extra });
const map = (...pins: unknown[]) => ({ data: { attributes: { bike_pins: pins, current_level: 'block' } } });
const system: RegionalScooterSystem = { id: 'lime_cz_test', country: 'CZ' as RegionalScooterSystem['country'], provider: 'lime',
  city: 'Test', center: [.005, .005], bounds: { south: 0, north: .01, west: 0, east: .01 },
  discoveryUrl: 'https://web-production.lime.bike/api/rider/v2/map/bike_pins', limeAppMap: true, limeServiceAreas: ['???o}@o}@??n}@n}@?'] };
async function fixture(suffix = '') {
  const directory = await mkdtemp(join(tmpdir(), 'lime-client-')); directories.push(directory);
  const sessionPath = join(directory, 'lime-session.json');
  const seed = { version: 1, accessToken: 'access-private' + suffix, refreshToken: 'refresh-private' + suffix, deviceToken: 'device-private' + suffix, privateKey,
    expiresAt: initialTime + 10 * 3600_000, refreshExpiresAt: initialTime + 180 * 86400_000, renewalWindow: 900 };
  await writeFile(sessionPath, JSON.stringify(seed), { mode: 0o600 });
  let now = initialTime;
  const transport = vi.fn<(path: string, headers: Record<string, string>, body?: string) => Promise<ReturnType<typeof response> & { retryAfter?: string }>>(async () => response(map()));
  const client = new LimeClient({ sessionPath, transport, now: () => now, intervalMs: 0 });
  const renewed = () => response({ access_token: 'new-access', refresh_token: 'new-refresh', expires_in: 36000,
    refresh_token_expires_in: 180 * 86400, renewal_window: 900 });
  return { client, transport, seed, sessionPath, directory, renewed, advance: (ms: number) => { now += ms; } };
}

describe('Lime portable rider session', () => {
  it('signs a fresh ES256 proof with the public client key and JOSE signature encoding', () => {
    const proof = limeClientAssertion(privateKey, initialTime);
    const [header, payload, signature] = proof.split('.');
    const h = JSON.parse(Buffer.from(header, 'base64url').toString());
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(h).toMatchObject({ alg: 'ES256', typ: 'JWT', jwk: { kty: 'EC', crv: 'P-256' } });
    expect(h.jwk.d).toBeUndefined();
    expect(p).toMatchObject({ iss: '134c5eda-3e85-460a-b808-3deae1357602', iat: initialTime / 1000 });
    expect(Buffer.from(signature, 'base64url')).toHaveLength(64);
    expect(verify('sha256', Buffer.from(header + '.' + payload), { key: createPublicKey(privateKey), dsaEncoding: 'ieee-p1363' },
      Buffer.from(signature, 'base64url'))).toBe(true);
    expect(limeClientAssertion(privateKey, initialTime)).not.toBe(proof);
  });
  it('keeps the seeded access token until renewal is allowed and sends a bounded scooter filter', async () => {
    const f = await fixture(); await f.client.pins(system.bounds);
    expect(f.transport).toHaveBeenCalledTimes(1);
    const [path, headers, body] = f.transport.mock.calls[0];
    const url = new URL(path, 'https://example.com');
    expect(url.searchParams.get('vehicle_filter')).toBe('["scooter"]');
    expect(url.searchParams.get('bounding_box_restriction')).toBe('limit_to_box');
    expect(headers.Authorization).toBe('Bearer access-private');
    expect(headers['X-Device-Token']).toBe('device-private');
    expect(body).toBeUndefined();
  });
  it('renews once for concurrent maps inside the window, persists rotation privately, and survives restart', async () => {
    const f = await fixture(); f.advance(10 * 3600_000 - 899_000 + 5000);
    f.transport.mockImplementation(async path => path.endsWith('/token') ? f.renewed() : response(map()));
    await Promise.all([f.client.pins(system.bounds), f.client.pins(system.bounds)]);
    const renewals = f.transport.mock.calls.filter(([p]) => p.endsWith('/token'));
    expect(renewals).toHaveLength(1);
    expect(renewals[0][1].Authorization).toBeUndefined();
    expect(JSON.parse(renewals[0][2]!)).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'refresh-private',
      client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer' });
    const saved = JSON.parse(await readFile(f.sessionPath, 'utf8'));
    expect(saved).toMatchObject({ accessToken: 'new-access', refreshToken: 'new-refresh', privateKey });
    expect((await stat(f.sessionPath)).mode & 0o777).toBe(0o600);
    expect(await readdir(join(f.directory, 'tmp'))).toEqual([]);
    const restarted = new LimeClient({ sessionPath: f.sessionPath, transport: f.transport, intervalMs: 0, now: () => initialTime + 10 * 3600_000 });
    await restarted.pins(system.bounds);
    expect(f.transport.mock.lastCall?.[1].Authorization).toBe('Bearer new-access');
    expect(f.transport.mock.calls.filter(([p]) => p.endsWith('/token'))).toHaveLength(1);
  });
  it('tries one renewal after a rejected access token and backs off if the renewed map is rejected', async () => {
    const f = await fixture();
    f.transport.mockImplementation(async path => path.endsWith('/token') ? f.renewed() : response({}, 401));
    await expect(f.client.pins(system.bounds)).rejects.toThrow('Lime map HTTP 401');
    await expect(f.client.pins(system.bounds)).rejects.toThrow('authorization was rejected');
    expect(f.transport).toHaveBeenCalledTimes(3);
  });
  it('accepts a replacement login file after rejection without prematurely renewing its fresh token', async () => {
    const f = await fixture(); let calls = 0;
    f.transport.mockImplementation(async (path, headers) => {
      expect(path).not.toContain('/oauth/token');
      calls++;
      if (calls === 1) {
        await writeFile(f.sessionPath, JSON.stringify({ ...f.seed, accessToken: 'replacement-access' }));
        return response({}, 401);
      }
      expect(headers.Authorization).toBe('Bearer replacement-access');
      return response(map());
    });
    await expect(f.client.pins(system.bounds)).resolves.toEqual(map());
    expect(f.transport).toHaveBeenCalledTimes(2);
  });
  it('redacts rejected login responses and respects provider-wide rate limits', async () => {
    const f = await fixture();
    f.transport.mockResolvedValue({ status: 429, retryAfter: '120', body: { error: f.seed.refreshToken } });
    await expect(f.client.pins(system.bounds)).rejects.toThrow('HTTP 429');
    await expect(f.client.pins(system.bounds)).rejects.toThrow('temporarily rate limited');
    expect(f.transport).toHaveBeenCalledTimes(1);
    f.advance(120_000); f.transport.mockResolvedValue(response(map()));
    await expect(f.client.pins(system.bounds)).resolves.toEqual(map());
    f.advance(10 * 3600_000); f.transport.mockResolvedValue(response({ error: privateKey }, 400));
    await expect(f.client.pins(system.bounds)).rejects.toThrow('Lime session HTTP 400');
    await expect(f.client.pins(system.bounds)).rejects.not.toThrow(privateKey);
    expect(f.transport).toHaveBeenCalledTimes(3);
  });
  it('honors an HTML 429 response and a Retry-After longer than an hour', async () => {
    const f = await fixture();
    http.request.mockImplementation((_url: string, _options: unknown, callback: (response: unknown) => void) => {
      const req = new EventEmitter() as EventEmitter & { end(): void; destroy(): void };
      req.end = () => queueMicrotask(() => callback({ statusCode: 429, headers: { 'retry-after': '7200' }, destroy: vi.fn() }));
      req.destroy = () => {};
      return req;
    });
    let now = initialTime;
    const client = new LimeClient({ sessionPath: f.sessionPath, intervalMs: 0, now: () => now });
    await expect(client.pins(system.bounds)).rejects.toThrow('HTTP 429');
    now += 3_600_001;
    await expect(client.pins(system.bounds)).rejects.toThrow('temporarily rate limited');
    expect(http.request).toHaveBeenCalledTimes(1);
    now += 3_600_000;
    await expect(client.pins(system.bounds)).rejects.toThrow('HTTP 429');
    expect(http.request).toHaveBeenCalledTimes(2);
  });
  it('rejects missing credentials, expired logins, and malformed renewal replies', async () => {
    const f = await fixture(); f.advance(181 * 86400_000);
    await expect(f.client.pins(system.bounds)).rejects.toThrow('login has expired');
    expect(f.transport).not.toHaveBeenCalled();
    const other = new LimeClient({ sessionPath: join(f.directory, 'missing') });
    await expect(other.pins(system.bounds)).rejects.toThrow('missing or unreadable');
    const g = await fixture(); g.advance(10 * 3600_000); g.transport.mockResolvedValue(response({ access_token: 'incomplete' }));
    await expect(g.client.pins(system.bounds)).rejects.toThrow('session response is invalid');
  });
});

describe('independent Lime production accounts', () => {
  it('keeps the legacy session by default, resolves private manifest paths, and rejects duplicate accounts or files', async () => {
    const f = await fixture();
    expect(readLimeAccounts({ sessionPath: f.sessionPath })).toEqual([{ id: 'primary', sessionPath: f.sessionPath }]);
    const path = join(f.directory, 'lime-accounts.json');
    const put = (accounts: unknown[]) => writeFile(path, JSON.stringify({ version: 1, accounts }));
    await put([{ id: 'primary', sessionPath: 'lime-session.json' }, { id: 'second', sessionPath: 'second.json' }]);
    expect(readLimeAccounts({ accountsPath: path })).toEqual([
      { id: 'primary', sessionPath: f.sessionPath }, { id: 'second', sessionPath: join(f.directory, 'second.json') },
    ]);
    await put([{ id: 'primary', sessionPath: 'one.json' }, { id: 'primary', sessionPath: 'two.json' }]);
    expect(() => readLimeAccounts({ accountsPath: path })).toThrow('unique');
    await put([{ id: 'one', sessionPath: 'same.json' }, { id: 'two', sessionPath: './same.json' }]);
    expect(() => readLimeAccounts({ accountsPath: path })).toThrow('unique');
    await put([{ id: 'email@example.com', sessionPath: 'one.json' }]);
    expect(() => readLimeAccounts({ accountsPath: path })).toThrow('unique');
    await put([]);
    expect(() => readLimeAccounts({ accountsPath: path })).toThrow('invalid');
    expect(() => readLimeAccounts({ accountsPath: join(f.directory, 'missing.json') })).toThrow('missing or unreadable');
    await writeFile(path, 'not json');
    expect(() => readLimeAccounts({ accountsPath: path })).toThrow('missing or unreadable');
  });

  it('keeps feed assignments through manifest reordering and adds scheduler slots only to rider feeds', () => {
    const accounts = ['primary', 'second', 'third'].map(id => ({ id, sessionPath: `/private/${id}.json` }));
    const pool = new LimeAccountPool(accounts);
    const reordered = new LimeAccountPool([...accounts].reverse());
    const reduced = new LimeAccountPool(accounts.slice(0, 2));
    const systems = Array.from({ length: 100 }, (_, i) => ({ ...system, id: `lime_test_${i}` }));
    expect(new Set(systems.map(s => pool.accountFor(s.id).id)).size).toBe(3);
    for (const s of systems) {
      expect(reordered.accountFor(s.id).id).toBe(pool.accountFor(s.id).id);
      if (pool.accountFor(s.id).id !== 'third') expect(reduced.accountFor(s.id).id).toBe(pool.accountFor(s.id).id);
    }
    const publicFeed = { id: 'test:public', host: 'public.example' } as CollectableScooterFeed;
    const bare = [...systems.map(s => ({ id: `test:${s.id}`, host: 'web-production.lime.bike' } as CollectableScooterFeed)), publicFeed];
    const feeds = withLimeAppCollectors(bare, systems, pool);
    expect(feeds.at(-1)).toBe(publicFeed);
    for (const [index, feed] of feeds.slice(0, -1).entries()) {
      expect(feed).toMatchObject({ host: 'web-production.lime.bike', paced: true, watchMs: 3 * 60_000,
        concurrencyKey: `lime-account:${pool.accountFor(systems[index].id).id}` });
    }
  });

  it('sweeps an idle town in its daytime: a turn at night there moves twelve hours on', () => {
    const now = Date.UTC(2026, 9, 27, 12);
    const local = (phase: number, offset: number) =>
      ((Math.floor(phase * LIME_IDLE_INTERVAL_MS / 60_000 + 1e-6) + offset) % 1440 + 1440) % 1440;
    const day = (minutes: number) => minutes >= 8 * 60 && minutes < 21 * 60;
    for (const [timeZone, offset] of [['America/New_York', -240], ['Australia/Brisbane', 600]] as const) {
      for (let i = 0; i < 200; i++) {
        const id = `us:lime_test_${i}`;
        const { idlePhase } = limeDaytime(id, timeZone, now);
        expect(day(local(idlePhase, offset))).toBe(true);
        if (day(local(idPhase(id), offset))) expect(idlePhase).toBe(idPhase(id));
        else expect((idlePhase - idPhase(id) + 1) % 1).toBeCloseTo(1 / 6, 9);
      }
    }
    // Raleigh's first sweep, at 00:46 there on 26 October 2026, was by night, which ends at 08:00 there;
    // the town total at 12:29 was not.
    const { nightEnds } = limeDaytime('us:lime_us_app_raleigh_003', 'America/New_York', now);
    expect(nightEnds(Date.UTC(2026, 9, 26, 4, 46))).toBe(Date.UTC(2026, 9, 26, 12));
    expect(nightEnds(Date.UTC(2026, 9, 26, 16, 29))).toBeUndefined();
    expect(nightEnds(Date.UTC(2026, 9, 27, 1, 30))).toBe(Date.UTC(2026, 9, 27, 12));
    // Bergen's central groups, read at 01:24 there on 29 October 2026, a night without its ban, showed none of
    // their scooters; the night the clocks went back, one read at 01:24 still waits for 08:00 on the new clock.
    const bergen = limeDaytime('norway:lime_no_app_bergen_014', 'Europe/Oslo', now);
    expect(bergen.nightEnds(Date.UTC(2026, 9, 29, 0, 24))).toBe(Date.UTC(2026, 9, 29, 7));
    expect(bergen.nightEnds(Date.UTC(2026, 9, 24, 23, 24))).toBe(Date.UTC(2026, 9, 25, 7));
    const feeds = withLimeAppCollectors([{ id: `test:${system.id}`, host: 'web-production.lime.bike' } as CollectableScooterFeed],
      [{ ...system, timeZone: 'Europe/Prague' }], new LimeAccountPool([{ id: 'a', sessionPath: '/private/a.json' }]));
    expect(feeds[0].idlePhase).toBeGreaterThanOrEqual(0);
    expect(feeds[0].nightEnds?.(Date.UTC(2026, 9, 27, 1))).toBe(Date.UTC(2026, 9, 27, 7));
  });

  it('isolates a 429 and its Retry-After without moving the feed onto another account', async () => {
    const a = await fixture('-a'), b = await fixture('-b');
    let now = initialTime;
    const transport = vi.fn(async (_path: string, headers: Record<string, string>) => headers['X-Device-Token'] === a.seed.deviceToken
      ? { ...response({}, 429), retryAfter: '120' } : response(map(pin())));
    const pool = new LimeAccountPool([{ id: 'a', sessionPath: a.sessionPath }, { id: 'b', sessionPath: b.sessionPath }],
      { transport, now: () => now, intervalMs: 0 });
    const candidates = Array.from({ length: 100 }, (_, i) => ({ ...system, id: `lime_test_${i}` }));
    const one = candidates.find(s => pool.accountFor(s.id).id === 'a')!;
    const two = candidates.find(s => pool.accountFor(s.id).id === 'b')!;
    await expect(pool.collect(one)).rejects.toThrow('HTTP 429');
    await expect(pool.collect(two)).resolves.toMatchObject({ vehicles: [expect.anything()] });
    await expect(pool.collect(one)).rejects.toThrow('temporarily rate limited');
    expect(transport).toHaveBeenCalledTimes(2);
    expect(pool.requests).toEqual([{ account: 'a', status: 1, metadata: 0 }, { account: 'b', status: 1, metadata: 0 }]);
    now += 120_000;
    transport.mockImplementation(async () => response(map()));
    await expect(pool.collect(one)).resolves.toMatchObject({ stale: false });
    expect(transport.mock.lastCall?.[1]['X-Device-Token']).toBe(a.seed.deviceToken);
  });

  it('spaces requests within each account while another account can start immediately', async () => {
    const a = await fixture('-a'), b = await fixture('-b');
    vi.useFakeTimers(); vi.setSystemTime(initialTime);
    try {
      const times: { device: string; at: number }[] = [];
      const pool = new LimeAccountPool([{ id: 'a', sessionPath: a.sessionPath }, { id: 'b', sessionPath: b.sessionPath }],
        { intervalMs: 5000, transport: async (_path, headers) => {
          times.push({ device: headers['X-Device-Token'], at: Date.now() - initialTime });
          return response(map(pin()));
        } });
      const candidates = Array.from({ length: 100 }, (_, i) => ({ ...system, id: `lime_test_${i}` }));
      const one = candidates.filter(s => pool.accountFor(s.id).id === 'a');
      const two = candidates.find(s => pool.accountFor(s.id).id === 'b')!;
      await pool.collect(one[0]);
      const waiting = pool.collect(one[1]);
      await pool.collect(two);
      expect(times).toEqual([{ device: a.seed.deviceToken, at: 0 }, { device: b.seed.deviceToken, at: 0 }]);
      await vi.advanceTimersByTimeAsync(4999);
      expect(times).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(1); await waiting;
      expect(times.at(-1)).toEqual({ device: a.seed.deviceToken, at: 5000 });
    } finally { vi.useRealTimers(); }
  });

  it('renews only the due account once, persists its rotation, and leaves another session untouched', async () => {
    const a = await fixture('-a'), b = await fixture('-b');
    await writeFile(a.sessionPath, JSON.stringify({ ...a.seed, expiresAt: initialTime + 1 }));
    const beforeB = await readFile(b.sessionPath, 'utf8');
    const transport = vi.fn(async (path: string, headers: Record<string, string>, body?: string) => {
      if (path.endsWith('/token')) {
        expect(headers['X-Device-Token']).toBe(a.seed.deviceToken);
        expect(JSON.parse(body!).refresh_token).toBe(a.seed.refreshToken);
        return a.renewed();
      }
      return response(map(pin()));
    });
    const pool = new LimeAccountPool([{ id: 'a', sessionPath: a.sessionPath }, { id: 'b', sessionPath: b.sessionPath }],
      { transport, now: () => initialTime, intervalMs: 0 });
    const candidates = Array.from({ length: 100 }, (_, i) => ({ ...system, id: `lime_test_${i}` }));
    const one = candidates.filter(s => pool.accountFor(s.id).id === 'a');
    const two = candidates.find(s => pool.accountFor(s.id).id === 'b')!;
    await Promise.all([pool.collect(one[0]), pool.collect(one[1]), pool.collect(two)]);
    expect(transport.mock.calls.filter(([path]) => path.endsWith('/token'))).toHaveLength(1);
    expect(JSON.parse(await readFile(a.sessionPath, 'utf8')).refreshToken).toBe('new-refresh');
    expect(await readFile(b.sessionPath, 'utf8')).toBe(beforeB);
    expect(pool.requests).toEqual([{ account: 'a', status: 2, metadata: 1 }, { account: 'b', status: 1, metadata: 0 }]);
  });
});

describe('complete Lime scooter maps', () => {
  it('filters bikes and unknown charge, and distinguishes empty maps from malformed data', () => {
    expect(parseLimePins(map(pin(), pin('bike', 0, 0, { type: 'electric' }), pin('no-charge', 0, 0, { battery_percentage: 101 })))).toEqual({ count: 3,
      vehicles: [{ id: 'scooter', lat: .0025, lng: .0025, battery: 65 }, { id: 'no-charge', lat: 0, lng: 0, battery: null }] });
    expect(parseLimePins(map())).toEqual({ count: 0, vehicles: [] });
    expect(() => parseLimePins({ data: {} })).toThrow('Lime returned a clustered map');
    expect(() => parseLimePins(map(pin('bad', NaN)))).toThrow('Invalid Lime scooter');
  });
  it('retains parent pins omitted by narrower views, deduplicates boundaries, and refreshes parents and empty leaves', async () => {
    const api = { pins: vi.fn(async (b: typeof system.bounds) => {
      if (b.north - b.south === .01) return map(...Array.from({ length: 200 }, (_, i) => pin(String(i))));
      return b.south === 0 ? map(pin('boundary', .0025, .005)) : map();
    }) };
    const collector = new LimeMapCollector(api);
    const first = await collector.collect(system);
    expect(api.pins).toHaveBeenCalledTimes(5);
    expect(first.vehicles).toHaveLength(201);
    expect(first.vehicles).toContainEqual({ provider: 'lime', vehicle_id: 'lime_cz_test:boundary', lat: .0025, lng: .005, battery: 65,
      range_m: null, deep_link: null, distance_m: null });
    expect(first.vehicles.some(v => v.vehicle_id === 'lime_cz_test:0')).toBe(true);
    const second = await collector.collect(system);
    expect(second.vehicles).toHaveLength(201);
    expect(api.pins).toHaveBeenCalledTimes(10);
  });
  it('queries local views throughout a large outline even when a wide response would be uncapped', async () => {
    const large = { ...system, bounds: { south: 0, north: .03, west: 0, east: .03 },
      limeServiceAreas: ['???ozD' + 'ozD??nzDnzD?'] };
    const api = { pins: vi.fn(async (bounds: typeof system.bounds) => map(pin(
      String(bounds.south) + ':' + String(bounds.west), (bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2))) };
    const result = await new LimeMapCollector(api).collect(large);
    expect(api.pins.mock.calls.length).toBeGreaterThan(1);
    expect(result.vehicles.length).toBe(api.pins.mock.calls.length);
    expect(result.vehicles.some(v => v.lat > .02 && v.lng > .02)).toBe(true);
  });
  it('starts where people look and reports each view it finishes, before the sweep ends', async () => {
    const large = { ...system, bounds: { south: 0, north: .03, west: 0, east: .03 },
      limeServiceAreas: ['???ozD' + 'ozD??nzDnzD?'] };
    const api = { pins: vi.fn(async (bounds: typeof system.bounds) => map(pin(
      String(bounds.south) + ':' + String(bounds.west), (bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2))) };
    const focus = { south: .028, west: .028, north: .029, east: .029 };
    const reports: { found: string[]; swept: typeof focus[] }[] = [];
    const result = await withinCollection({ urgent: () => true, focus: () => focus,
      progress: (found, swept) => { reports.push({ found: found.map(v => v.vehicle_id!), swept }); } },
    () => new LimeMapCollector(api).collect(large));
    const first = api.pins.mock.calls[0][0];
    expect(first.north).toBeGreaterThanOrEqual(focus.north);
    expect(first.east).toBeGreaterThanOrEqual(focus.east);
    // The first view is reported at once, the others at most every two seconds, and the sweep's end replaces them.
    expect(reports[0]).toEqual({ found: [`lime_cz_test:${first.south}:${first.west}`], swept: [first] });
    expect(result.vehicles).toHaveLength(api.pins.mock.calls.length);
  });
  it('reads a registered market\'s own polygons by its region and town', async () => {
    const api = { pins: vi.fn(async () => map()) };
    const registered = { ...system, limeAppRegion: 'E7CO5RS5CDCVW', city: 'Deva', limeServiceAreas: undefined,
      limeMapTiles: [{ south: 45.87, north: 45.88, west: 22.89, east: 22.9 }] };
    await expect(new LimeMapCollector(api).collect(registered)).resolves.toMatchObject({ vehicles: [] });
    // Another town of the same region has polygons of its own, not Deva's.
    await expect(new LimeMapCollector(api).collect({ ...registered, city: 'Hunedoara' })).rejects.toThrow('verified service outlines');
  });
  it('uses a capped nearest set only when its radius covers every cell corner with a margin', () => {
    const near = parseLimePins(map(...Array.from({ length: 200 }, (_, i) => pin(String(i)))));
    expect(limeCellCovered(near, system.bounds)).toBe(false);
    const distant = parseLimePins(map(...Array.from({ length: 200 }, (_, i) => pin(String(i), .02, .02))));
    expect(limeCellCovered(distant, system.bounds)).toBe(true);
    expect(limeCellCovered({ count: 200, vehicles: distant.vehicles.slice(1) }, system.bounds)).toBe(false);
    expect(limeCellCovered(parseLimePins(map()), system.bounds)).toBe(true);
  });
  it('fails a capped result at the request/depth limit and does not replace the previous plan after failure', async () => {
    const api = { pins: vi.fn(async () => map(...Array.from({ length: 200 }, (_, i) => pin(String(i))))) };
    const limited = new LimeMapCollector(api, { requests: 1, depth: 9, milliseconds: 1000 });
    await expect(limited.collect(system)).rejects.toThrow('completeness budget');
    const shallow = new LimeMapCollector(api, { requests: 10, depth: 0, milliseconds: 1000 });
    await expect(shallow.collect(system)).rejects.toThrow('subdivision limit');
    api.pins.mockResolvedValue(map());
    await expect(limited.collect(system)).resolves.toMatchObject({ vehicles: [], stale: false });
  });
  it('clips nearby out-of-bounds pins, counts them toward the cap, and rejects a failed child', async () => {
    const api = { pins: vi.fn(async () => map(pin('wrong', 2, 2))) };
    const collector = new LimeMapCollector(api);
    await expect(collector.collect(system)).resolves.toMatchObject({ vehicles: [] });
    const cappedOutside = new LimeMapCollector({ pins: async () => map(...Array.from({ length: 200 }, (_, i) => pin(String(i), 2, 2))) },
      { requests: 1, depth: 9, milliseconds: 1000 });
    await expect(cappedOutside.collect(system)).resolves.toMatchObject({ vehicles: [] });
    let calls = 0;
    api.pins.mockImplementation(async () => {
      calls++;
      if (calls === 1) return map(...Array.from({ length: 200 }, (_, i) => pin(String(i))));
      if (calls === 3) throw new Error('Provider failed');
      return map(pin());
    });
    await expect(collector.collect(system)).rejects.toThrow('Provider failed');
  });
});
