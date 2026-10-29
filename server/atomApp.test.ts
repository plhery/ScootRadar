import { mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATOM_INTERVAL_MS, ATOM_ROUTINE_EVERY, AtomClient, atomMapCenters, collectAtomRegion, parseAtomVehicles,
  withAtomAppCollectors } from './atomApp';
import { Pacer, withinCollection } from './sweeps';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { REGIONAL_SCOOTER_SYSTEMS } from '../src/lib/regionalScooterSystems';

const token = 'e30.eyJpZCI6MTAxfQ.synthetic';
const replacement = 'e30.eyJpZCI6MTAyfQ.synthetic';
const credentials = { token, appPublicKey: 'a'.repeat(48), staticPublicKey: 'b'.repeat(48), deviceId: 'test-device-1234', appVersion: '10.80' };
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const scooter = (id: number, extra: Record<string, unknown> = {}) => ({ id, type: 'SCOOTER', fuel_type: 'ELECTRIC',
  coordinates: { latitude: 59.27, longitude: 15.21 }, battery_level: 73, is_active_ride: false, reservation_minutes: 5, ...extra });
const map = (vehicles: unknown[] = [], extra: Record<string, unknown> = {}) => ({ vehicles, active_vehicle_ids: [],
  hidden_vehicles: [], currently_not_operating: false, ...extra });
const region = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'qick_se_orebro')!;

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'atom-client-'));
  directories.push(directory);
  const sessionPath = join(directory, 'atom-sessions.json');
  const sessions = { version: 1, accounts: { 'qick-se': credentials, 'qick-de': { ...credentials, appPublicKey: 'c'.repeat(48) } } };
  await writeFile(sessionPath, JSON.stringify(sessions), { mode: 0o600 });
  const fetch = vi.fn<typeof globalThis.fetch>();
  let now = 1_800_000_000_000;
  const client = new AtomClient({ sessionPath, fetch, now: () => now, intervalMs: 0, timeoutMs: 25 });
  return { directory, sessionPath, sessions, fetch, client, advance: (ms: number) => { now += ms; } };
}

describe('ATOM map coverage and availability', () => {
  it('covers the whole rectangle with 2 km circles, including grid corners and southern latitudes', () => {
    for (const bounds of [region.bounds, { south: 51.88, north: 52.01, west: 7.55, east: 7.7 },
      { south: -34.05, north: -33.98, west: 18.4, east: 18.5 }]) {
      const centers = atomMapCenters(bounds);
      for (let row = 0; row <= 24; row++) for (let column = 0; column <= 24; column++) {
        const lat = bounds.south + row / 24 * (bounds.north - bounds.south);
        const lng = bounds.west + column / 24 * (bounds.east - bounds.west);
        const distance = Math.min(...centers.map(([a, b]) => Math.hypot((lat - a) * 111_320,
          (lng - b) * 111_320 * Math.cos(lat * Math.PI / 180))));
        expect(distance).toBeLessThan(2000);
      }
    }
    expect(() => atomMapCenters({ south: 50, north: 55, west: 7, east: 10 })).toThrow('budget');
    expect(() => atomMapCenters({ south: 60, north: 59, west: 15, east: 16 })).toThrow('bounds');
  });

  it('keeps electric standing scooters, including the offered reservation time, and preserves unknown charge', () => {
    const result = parseAtomVehicles(map([scooter(1), scooter(2, { battery_level: null }), scooter(3, { type: 'BIKE' }),
      scooter(4, { type: 'E_MOPED' }), scooter(5, { fuel_type: 'PETROL' }), scooter(6, { is_active_ride: true })]));
    expect(result.vehicles.map(v => [v.id, v.battery])).toEqual([[1, 73], [2, null]]);
    expect(result.unavailable).toEqual([6]);
    expect(parseAtomVehicles(map()).vehicles).toEqual([]);
  });

  it('rejects errors disguised as success and malformed availability or scooter coordinates', () => {
    for (const payload of [{ message: 'Unauthorized' }, map([], { hidden_vehicles: null }),
      map([], { active_vehicle_ids: ['bad-id'] }), map([scooter(1, { coordinates: { latitude: NaN, longitude: 15 } })]),
      map([scooter(1, { is_active_ride: undefined })])]) expect(() => parseAtomVehicles(payload)).toThrow('Invalid ATOM');
  });

  it('deduplicates overlapping views and excludes active, hidden and out-of-area scooters across the whole sweep', async () => {
    let count = 0;
    const api = { vehicles: vi.fn(async () => count++ === 0
      ? map([scooter(1), scooter(2), scooter(3), scooter(4, { coordinates: { latitude: 50, longitude: 8 } })])
      : map([scooter(1), scooter(5, { is_active_ride: true })], { active_vehicle_ids: [3], hidden_vehicles: [{ id: 2 }] })) };
    const result = await collectAtomRegion(region, api);
    expect(api.vehicles).toHaveBeenCalledTimes(atomMapCenters(region.bounds).length);
    expect(result.vehicles.map(v => v.vehicle_id)).toEqual([`${region.id}:1`]);
    expect(result.vehicles[0]).toMatchObject({ provider: 'qick', battery: 73, range_m: null });
  });

  it('fails the collection if any view fails and skips a region only if all its views report closed', async () => {
    const api = { vehicles: vi.fn().mockResolvedValueOnce(map([scooter(1)])).mockRejectedValue(new Error('view failed')) };
    await expect(collectAtomRegion(region, api)).rejects.toThrow('view failed');
    const closed = { vehicles: vi.fn(async () => map([scooter(1)], { currently_not_operating: true })) };
    expect(await collectAtomRegion(region, closed)).toMatchObject({ vehicles: [], skipped: true });
  });

  it('collects a verified full-account map once across distant towns while excluding unavailable and out-of-area scooters', async () => {
    const full = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'move_ca_new_brunswick')!;
    const at = (id: number, latitude: number, longitude: number) => scooter(id, { coordinates: { latitude, longitude } });
    const api = { vehicles: vi.fn(async () => map([at(1, 45.9636, -66.6431), at(2, 46.0878, -64.7782),
      at(3, 45.2733, -66.0633), at(4, 45.96, -66.64), at(5, 46.08, -64.77), scooter(6), at(7, 45.7, -65.7)],
    { hidden_vehicles: [{ id: 4 }], active_vehicle_ids: [5] })) };
    const result = await collectAtomRegion(full, api);
    expect(api.vehicles).toHaveBeenCalledExactlyOnceWith(full.atomAppAccount, full.center);
    expect(result.vehicles.map(v => v.vehicle_id)).toEqual([1, 2, 3].map(id => `${full.id}:${id}`));
  });

  it('lets Linköping\'s idle sweep end within its feed\'s grace while a watched Münster sweeps without a pause', async () => {
    // On 28 October 2026 a watched Münster swept again every 1.6 minutes, and Linköping's idle sweep
    // of 18 views took 932 seconds: past the 10 minutes its feed has after its interval (cadence.ts).
    const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
    const [munster, linkoping] = [system('qick_de_munster'), system('qick_se_linkoping')];
    expect(atomMapCenters(linkoping.bounds)).toHaveLength(18);
    const scope = (urgent: boolean) => ({ urgent: () => urgent, focus: () => undefined, progress: () => {} });
    /** How long Linköping's sweep takes, started 10 s into Münster's, as the client paces them with `routineEvery`. */
    async function sweep(routineEvery: number): Promise<number | undefined> {
      const pacer = new Pacer(ATOM_INTERVAL_MS, Date.now, Date.now(), routineEvery);
      const api = { vehicles: async () => { await pacer.turn(); return map(); } };
      let watched = true;
      const looking = (async () => {
        while (watched) await withinCollection(scope(true), () => collectAtomRegion(munster, api));
      })();
      await vi.advanceTimersByTimeAsync(10_000);
      const started = Date.now();
      let took: number | undefined;
      const idle = withinCollection(scope(false), () => collectAtomRegion(linkoping, api)).then(() => { took = Date.now() - started; });
      await vi.advanceTimersByTimeAsync(10 * 60_000);
      watched = false;
      await vi.advanceTimersByTimeAsync(10 * 60_000);
      await Promise.all([looking, idle]);
      return took;
    }
    vi.useFakeTimers();
    try {
      // One turn in three, every 4 seconds: 18 views in about 216 seconds, Münster keeping the other two.
      expect(await sweep(ATOM_ROUTINE_EVERY)).toBeLessThanOrEqual(18 * 3 * ATOM_INTERVAL_MS);
      // Without them, Münster's sweeps take every turn and Linköping's waits until nobody looks.
      expect(await sweep(Infinity)).toBeGreaterThan(10 * 60_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it('registers ATOM through the Node collector without treating its endpoint as GBFS', () => {
    const feeds = independentCollectableFeeds();
    const feed = feeds.find(feed => feed.id.endsWith(`:${region.id}`))!;
    expect(feed.zoneSource).toBeUndefined();
    const configured = withAtomAppCollectors(feeds, REGIONAL_SCOOTER_SYSTEMS);
    expect(configured.find(f => f.id === feed.id)?.collect).not.toBe(feed.collect);
    expect(configured.find(f => f.id === 'publibike')).toBe(feeds.find(f => f.id === 'publibike'));
    expect(REGIONAL_SCOOTER_SYSTEMS.filter(system => system.provider === 'qick' && system.atomAppAccount)).toHaveLength(10);
    for (const system of REGIONAL_SCOOTER_SYSTEMS.filter(system => system.atomAppAccount && !system.atomAppFullMap)) {
      expect(atomMapCenters(system.bounds).length).toBeLessThanOrEqual(64);
    }
  });
});

describe('ATOM rider session transport', () => {
  it('uses the selected account and native read query without putting credentials in URLs', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValue(Response.json(map()));
    await f.client.vehicles('qick-de', [51.95, 7.63]);
    const [input, init] = f.fetch.mock.calls[0];
    const url = new URL(String(input));
    expect(url.origin).toBe('https://app.rideatom.com');
    expect(url.pathname).toBe('/api/v1/user/vehicles');
    expect(url.searchParams.get('fleet_id')).toBe('0');
    expect(url.searchParams.get('user_latitude')).toBe('51.95');
    expect(url.searchParams.get('user_location_timestamp')).toBe('1800000000');
    expect(String(input)).not.toContain(token);
    const headers = new Headers(init?.headers);
    expect(headers.get('Authorization')).toBe(`Basic ${Buffer.from(`${token}:`).toString('base64')}`);
    expect(headers.get('App-Public-Key')).toBe('c'.repeat(48));
    expect(headers.get('Static-App-Public-Key')).toBe(credentials.staticPublicKey);
    expect(init?.redirect).toBe('error');
    expect(init?.body).toBeUndefined();
  });

  it('renews rejected credentials once for concurrent requests, saves them privately and preserves other accounts', async () => {
    const f = await fixture();
    f.fetch.mockImplementation(async (url, init) => {
      if (String(url).endsWith('/user/token/refresh')) return Response.json({ token: replacement });
      return new Headers(init?.headers).get('Authorization') === `Basic ${Buffer.from(`${token}:`).toString('base64')}`
        ? new Response('', { status: 401 }) : Response.json(map());
    });
    await Promise.all([f.client.vehicles('qick-se', [59.27, 15.21]), f.client.vehicles('qick-se', [59.28, 15.22])]);
    expect(f.fetch.mock.calls.filter(([url]) => String(url).endsWith('/user/token/refresh'))).toHaveLength(1);
    const saved = JSON.parse(await readFile(f.sessionPath, 'utf8'));
    expect(saved.accounts['qick-se'].token).toBe(replacement);
    expect(saved.accounts['qick-de'].token).toBe(token);
    expect((await stat(f.sessionPath)).mode & 0o777).toBe(0o600);
    expect(await readdir(join(f.directory, 'tmp'))).toEqual([]);
  });

  it('backs off rejected logins and accepts an operator-provided replacement without a restart', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValue(new Response('', { status: 401 }));
    await expect(f.client.vehicles('qick-se', [59.27, 15.21])).rejects.toThrow('ATOM session HTTP 401');
    expect(f.fetch).toHaveBeenCalledTimes(2);
    await expect(f.client.vehicles('qick-se', [59.27, 15.21])).rejects.toThrow('authorization');
    expect(f.fetch).toHaveBeenCalledTimes(2);
    await writeFile(f.sessionPath, JSON.stringify({ ...f.sessions, accounts: { ...f.sessions.accounts,
      'qick-se': { ...credentials, token: replacement } } }));
    f.fetch.mockResolvedValue(Response.json(map()));
    await expect(f.client.vehicles('qick-se', [59.27, 15.21])).resolves.toMatchObject({ vehicles: [] });
  });

  it('respects Retry-After across accounts instead of retrying every map view', async () => {
    const f = await fixture();
    f.fetch.mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '120' } }));
    await expect(f.client.vehicles('qick-se', [59.27, 15.21])).rejects.toThrow('429');
    await expect(f.client.vehicles('qick-de', [51.95, 7.63])).rejects.toThrow('rate limited');
    expect(f.fetch).toHaveBeenCalledTimes(1);
    f.advance(120_000);
    f.fetch.mockResolvedValue(Response.json(map()));
    await expect(f.client.vehicles('qick-se', [59.27, 15.21])).resolves.toMatchObject({ vehicles: [] });
  });

  it('holds its first view after a start, while the cache it replaces may still be sweeping', async () => {
    const f = await fixture();
    const client = new AtomClient({ sessionPath: f.sessionPath, fetch: f.fetch, intervalMs: 0, startHoldMs: 200 });
    const started = Date.now();
    let sentAt = 0;
    f.fetch.mockImplementation(async () => { sentAt = Date.now(); return Response.json(map()); });
    await expect(client.vehicles('qick-se', [59.27, 15.21])).resolves.toMatchObject({ vehicles: [] });
    expect(sentAt - started).toBeGreaterThanOrEqual(190);
  });

  it('rejects missing credentials, oversized and malformed JSON and sanitizes transport failures', async () => {
    const f = await fixture();
    await expect(new AtomClient({ sessionPath: join(f.directory, 'missing') }).vehicles('qick-se', [59, 15])).rejects.toThrow('missing or unreadable');
    expect(f.fetch).not.toHaveBeenCalled();
    f.fetch.mockResolvedValueOnce(new Response('not JSON'));
    await expect(f.client.vehicles('qick-se', [59, 15])).rejects.toThrow('invalid JSON');
    f.fetch.mockResolvedValueOnce(new Response(new Uint8Array(8 * 1024 * 1024 + 1)));
    await expect(f.client.vehicles('qick-se', [59, 15])).rejects.toThrow('size limit');
    f.fetch.mockRejectedValueOnce(new Error(`private transport ${token}`));
    await expect(f.client.vehicles('qick-se', [59, 15])).rejects.toThrow(/^ATOM request failed or timed out$/);
    f.fetch.mockImplementationOnce(async (_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error(`private timeout ${token}`)), { once: true });
    }));
    await expect(f.client.vehicles('qick-se', [59, 15])).rejects.toThrow(/^ATOM request failed or timed out$/);
  });
});
