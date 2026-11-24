import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapFeed, isAppMapSystem, serviceAreas } from '../src/lib/regionalScooterSystems';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { boundsContainPoint, haversineM } from '../src/lib/geo';
import { independentCollectableFeeds, type CollectableScooterFeed } from '../src/lib/scooterFeeds';
import type { MapBounds } from '../src/lib/types';
import { APP_MAP_WIDE_INTERVAL_MS, withDailySweeps } from './appMapCadence';
import { FeedScheduler } from './feedScheduler';
import { collectJetRiderRegion, JET_RIDER_WATCHED_INTERVAL_MS, jetRiderCircle, jetRiderRequestHash, JetRiderClient, parseJetRiderParking,
  parseJetRiderPolygon, parseJetRiderRate, parseJetRiderVehicles, withJetRiderAppCollectors } from './jetRiderApp';
import type { JetRiderPrices } from './jetRiderApp';

const paths: string[] = [];
afterEach(async () => { await Promise.all(paths.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const now = 1_800_000_000_000;
const session = () => ({ version: 1, accessToken: 'private-access-token', refreshToken: 'private-refresh-token', expiresAt: now + 1800_000,
  signingKey: Buffer.alloc(64, 7).toString('base64'),
  oauth: { clientId: 'test-client', clientSecret: 'private-client-secret', scope: 'bike.api offline_access' },
  headers: { 'UR-Brand': 'JET', 'UR-Device-Id': 'test-device', 'UR-Client-Id': 'test-client', Authorization: 'untrusted-file-header' } });
const scooter = (identifier = 'S.123456', lat = 41.71, long = 44.77) => ({ identifier, type: 'Scooter', location: { lat, long }, batteryPercent: 47 });
const map = (transports: unknown[] = [], parkings: unknown[] = []) => ({ succeeded: true, errors: [], entries: { transports, parkings } });
const parkingAt = (id: string, countScooters: number, lat = 41.71, long = 44.77) =>
  ({ id, isEmpty: countScooters === 0, countBikes: 0, countScooters, location: { lat, long }, radius: 50, polygon: null });
const hired = (identifier: string, lat = 41.71, long = 44.77, extra: Record<string, unknown> = {}) => ({ identifier, displayedIdentifier: identifier,
  type: 'Scooter', state: 'Available', location: { lat, long }, model: { name: 'Ninebot Max Plus' },
  charge: { batteryPercent: 0.5, remainKm: 15.75, status: 'Ok' }, ...extra });
const polygonReply = (transports: unknown[] = []) => ({ succeeded: true, errors: [], transports });
const parkingReply = (id: string, transports: unknown[] = []) => ({ succeeded: true, errors: [], data: { id, transports } });
/** A scooter's card: a price by the minute, as JET's apps list it in Tbilisi, and one by the hour. */
const card = (modelName = 'Ninebot Max Plus', minute: Record<string, unknown> = {}, culture = 'ka-GE') => ({ succeeded: true, errors: [], modelName,
  identifier: 'S.123456', rate: { dailyPass: null, entries: [
    { displayName: 'Per minute', periodMinute: 1, rateType: 'Period', useActivationCost: true,
      debit: { value: 0.32, culture, value100: 32 }, activationCost: { value: 1, culture, value100: 100 }, ...minute },
    { displayName: 'Per hour', periodMinute: 60, rateType: 'Period', useActivationCost: true,
      debit: { value: 12, culture, value100: 1200 }, activationCost: { value: 0, culture, value100: 0 } }] } });
/** A client whose polygons and parkings, unless given, list nothing, and whose scooter cards can't be read. */
const api = (vehicles: ReturnType<typeof vi.fn<(...args: never[]) => Promise<unknown>>>, polygon = vi.fn().mockResolvedValue(polygonReply()),
  parking = vi.fn().mockImplementation(async (id: string) => parkingReply(id)),
  transport = vi.fn().mockRejectedValue(new Error('no card'))) => ({ vehicles, polygon, parking, transport });
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

  it('posts a closed polygon as signed JSON and reads a parking only by a checked id', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>(async () => json(polygonReply()));
    const { client } = await fixture(fetch);
    await client.polygon(system.bounds, now + 10_000);
    const [input, options] = fetch.mock.calls[0]; const headers = new Headers(options?.headers);
    expect(String(input)).toBe('https://service.jetscooters.fun/gatewayclient/api/v6/transports/polygon');
    expect(options?.method).toBe('POST'); expect(options?.redirect).toBe('error');
    expect(headers.get('content-type')).toBe('application/json');
    expect(headers.get('authorization')).toBe('Bearer private-access-token');
    const body = JSON.parse(String(options?.body));
    expect(body).toEqual({ polygon: [{ lat: 41.7, long: 44.76 }, { lat: 41.7, long: 44.78 }, { lat: 41.72, long: 44.78 },
      { lat: 41.72, long: 44.76 }, { lat: 41.7, long: 44.76 }], withEBikes: true });
    expect(headers.get('ur-request-data')).toBe(jetRiderRequestHash(Object.fromEntries(headers), new URLSearchParams(),
      String(options?.body), session().signingKey));
    await expect(client.parking('../connect/token', now + 10_000)).rejects.toThrow('Invalid JET rider parking');
    await expect(client.polygon({ south: 0, north: 1, west: 0, east: 1 })).rejects.toThrow('view is too large');
    await expect(client.transport('../connect/token', now + 10_000)).rejects.toThrow('Invalid JET rider scooter');
    await client.parking('abc_123', now + 10_000);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(String(fetch.mock.calls[1][0])).toBe('https://service.jetscooters.fun/gatewayclient/api/v1/parkings/abc_123');
    expect(fetch.mock.calls[1][1]?.method).toBe('GET'); expect(fetch.mock.calls[1][1]?.body).toBeUndefined();
    await client.transport('S.123456', now + 10_000);
    expect(String(fetch.mock.calls[2][0])).toBe('https://service.jetscooters.fun/gatewayclient/api/v3/transports/S.123456');
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
  it('lists loose scooters one by one, leaves bikes out, and keeps each parking with only its count', () => {
    const payload = map([scooter(), { type: 'Bike' }, { type: 'EBike' }, { ...scooter('S.2'), batteryPercent: null }],
      [parkingAt('p1', 3), { ...parkingAt('p2', 0), countBikes: 4 }]);
    const parsed = parseJetRiderVehicles(payload);
    expect(parsed.count).toBe(4); expect(parsed.vehicles).toHaveLength(2);
    expect(parsed.vehicles[0]).toMatchObject({ provider: 'jet', vehicle_id: 'jet-rider:S.123456', battery: 47, range_m: null,
      rental_uris: { ios: 'https://ure.su/j/S.123456', android: 'https://ure.su/j/S.123456', web: null } });
    expect(parsed.vehicles[1].battery).toBeNull();
    expect(parsed.parkings).toEqual([{ id: 'p1', lat: 41.71, lng: 44.77, count: 3 }, { id: 'p2', lat: 41.71, lng: 44.77, count: 0 }]);
    expect(parsed.parkingsComplete).toBe(true);
  });

  it('takes a full parking list as complete only when it ends on an empty parking', () => {
    const full = (last: unknown) => map([], [...Array.from({ length: 148 }, (_, i) => parkingAt(`p${i}`, 2)), last]);
    expect(parseJetRiderVehicles(full(parkingAt('last', 1))).parkingsComplete).toBe(false);
    expect(parseJetRiderVehicles(full({ ...parkingAt('last', 0), countBikes: 2 })).parkingsComplete).toBe(false);
    expect(parseJetRiderVehicles(full(parkingAt('last', 0))).parkingsComplete).toBe(true);
  });

  it.each([map([{ ...scooter(), batteryPercent: 101 }]), map([{ ...scooter(), location: { lat: 41, long: NaN } }]),
    map([], [{ countScooters: 1000, countBikes: 1000 }]), map([], [parkingAt('../connect', 1)]), map([], [parkingAt('p1', -1)]),
    map([], [{ ...parkingAt('p1', 1), location: null }]),
    { ...map(), succeeded: false }, { ...map(), errors: [{ message: 'private-server-details' }] }, { succeeded: true, errors: [] }])(
    'rejects invalid or unsuccessful replies', payload => { expect(() => parseJetRiderVehicles(payload)).toThrow(); });

  it('reads the hireable scooters of a polygon with their charge in percent, their range, their parking and their model', () => {
    const unhireable = new Set<string>();
    const parsed = parseJetRiderPolygon(polygonReply([hired('A.1', 41.71, 44.77, { parkingId: 'p1' }),
      hired('A.2', 41.71, 44.77, { charge: null, model: { name: 'Ninebot <b>' } }),
      hired('A.3', 41.71, 44.77, { state: 'Booked' }), hired('B.1', 41.71, 44.77, { type: 'EBike' })]), unhireable);
    // A scooter in a state that can't be hired is told apart, for the map's loose scooters (collectJetRiderRegion); a bike is not.
    expect([...unhireable]).toEqual(['jet-rider:A.3']);
    expect(parsed).toEqual([{ vehicle: { provider: 'jet', vehicle_id: 'jet-rider:A.1', lat: 41.71, lng: 44.77, battery: 50, range_m: 15750,
      deep_link: null, rental_uris: { ios: 'https://ure.su/j/A.1', android: 'https://ure.su/j/A.1', web: null }, distance_m: null },
    parkingId: 'p1', model: 'Ninebot Max Plus' }, { vehicle: expect.objectContaining({ vehicle_id: 'jet-rider:A.2', battery: null, range_m: null }) }]);
    // A model name the map could not show is no model.
    expect(parsed[1]).not.toHaveProperty('parkingId'); expect(parsed[1]).not.toHaveProperty('model');
  });

  it('reads a scooter card’s price by the minute and its start fee, in the country’s currency', () => {
    expect(parseJetRiderRate(card(), 'GE', 'Ninebot Max Plus')).toEqual({ currency: 'GEL', unlock_fee_minor_units: 100, minute_fee_minor_units: 32 });
    expect(parseJetRiderRate(card('Ninebot SL 90', { debit: { culture: 'uz-UZ', value100: 119000 },
      activationCost: { culture: 'uz-UZ', value100: 199000 } }, 'uz-UZ'), 'UZ', 'Ninebot SL 90'))
      .toEqual({ currency: 'UZS', unlock_fee_minor_units: 199000, minute_fee_minor_units: 119000 });
    expect(parseJetRiderRate(card(undefined, { useActivationCost: false, activationCost: null }), 'GE', 'Ninebot Max Plus'))
      .toMatchObject({ unlock_fee_minor_units: 0, minute_fee_minor_units: 32 });
  });

  it.each([
    ['another model', card('Ninebot L 60L'), 'GE'],
    ['another country', card(), 'UZ'],
    ['a country without a currency', card(undefined, {}, 'kk-KZ'), 'KZ'],
    ['a fraction of a hundredth', card(undefined, { debit: { culture: 'ka-GE', value100: 32.5 } }), 'GE'],
    ['a start fee in another currency', card(undefined, { activationCost: { culture: 'ru-RU', value100: 100 } }), 'GE'],
    ['two rates by the minute', { ...card(), rate: { entries: [card().rate.entries[0], card().rate.entries[0]] } }, 'GE'],
  ])('shows no price for a card with %s', (_name, payload, country) => {
    expect(parseJetRiderRate(payload, country, 'Ninebot Max Plus')).toBeUndefined();
  });

  it('rejects an unsuccessful or shapeless card', () => {
    expect(() => parseJetRiderRate({ ...card(), succeeded: false }, 'GE', 'Ninebot Max Plus')).toThrow();
    expect(() => parseJetRiderRate({ ...card(), rate: null }, 'GE', 'Ninebot Max Plus')).toThrow();
  });

  it.each([{ charge: { batteryPercent: 47 } }, { charge: { remainKm: -1 } }, { charge: { remainKm: 201 } }, { charge: 'full' },
    { parkingId: '../connect' }, { state: null }, { location: null }, { identifier: 'a b' }])(
    'rejects an invalid polygon scooter (%o)', extra => {
      expect(() => parseJetRiderPolygon(polygonReply([hired('A.1', 41.71, 44.77, extra)]))).toThrow();
    });

  it('reads a parking’s scooters as standing in it, and only the parking asked for', () => {
    expect(parseJetRiderParking(parkingReply('p1', [hired('A.1')]), 'p1')).toEqual([expect.objectContaining({ parkingId: 'p1' })]);
    expect(() => parseJetRiderParking(parkingReply('p2', [hired('A.1')]), 'p1')).toThrow('Invalid JET rider parking');
    expect(() => parseJetRiderParking({ ...parkingReply('p1'), succeeded: false }, 'p1')).toThrow();
    expect(() => parseJetRiderPolygon({ ...polygonReply(), transports: Array.from({ length: 1001 }, () => hired('A.1')) })).toThrow();
  });

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
    const result = await collectJetRiderRegion(system, api(vehicles));
    expect(vehicles).toHaveBeenCalledTimes(5);
    expect(result.vehicles).toHaveLength(1); expect(result.stale).toBe(false);
    expect(new Set(vehicles.mock.calls.map(call => call[1])).size).toBe(1);
  });

  it('never returns a partial sweep after a child fails or a dense pile stays capped', async () => {
    const vehicles = vi.fn().mockResolvedValueOnce(map(Array.from({ length: 400 }, () => ({ type: 'Bike' }))))
      .mockResolvedValueOnce(map([scooter()])).mockRejectedValueOnce(new Error('upstream unavailable'));
    await expect(collectJetRiderRegion(system, api(vehicles))).rejects.toThrow('upstream unavailable');
    vehicles.mockResolvedValue(map(Array.from({ length: 400 }, () => ({ type: 'Bike' }))));
    await expect(collectJetRiderRegion(system, api(vehicles))).rejects.toThrow('remains capped');
  });

  it('collects disjoint town areas and excludes the unreviewed gap', async () => {
    const left = { ...system, bounds: { ...system.bounds, east: 44.765 } };
    const right = { ...system, bounds: { ...system.bounds, west: 44.775 } };
    const vehicles = vi.fn().mockResolvedValue(map([scooter('left', 41.71, 44.762), scooter('gap'), scooter('right', 41.71, 44.778)]));
    const result = await collectJetRiderRegion({ ...system, areas: [left, right] }, api(vehicles));
    expect(vehicles).toHaveBeenCalledTimes(2);
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual(['jet-rider:left', 'jet-rider:right']);
  });

  it('adds the scooters standing in parkings, and every scooter’s range, from a polygon checked against the map', async () => {
    const vehicles = vi.fn().mockResolvedValue(map([scooter('L.1'), scooter('L.2', 41.715, 44.775)], [parkingAt('p1', 2, 41.705, 44.765)]));
    const polygon = vi.fn().mockResolvedValue(polygonReply([hired('L.1'), hired('P.1', 41.7051, 44.7651, { parkingId: 'p1' }),
      hired('P.2', 41.7049, 44.7649, { parkingId: 'p1' }), hired('far', 41.69, 44.75)]));
    const client = api(vehicles, polygon);
    const result = await collectJetRiderRegion(system, client);
    // L.2, hired or moved since the map was read, is one of four: too few to read the box again.
    expect(polygon).toHaveBeenCalledTimes(1); expect(client.parking).not.toHaveBeenCalled();
    const byId = Object.fromEntries(result.vehicles.map(vehicle => [vehicle.vehicle_id, vehicle]));
    expect(Object.keys(byId).sort()).toEqual(['jet-rider:L.1', 'jet-rider:L.2', 'jet-rider:P.1', 'jet-rider:P.2']);
    expect(byId['jet-rider:L.1']).toMatchObject({ battery: 50, range_m: 15750 });
    expect(byId['jet-rider:L.2']).toMatchObject({ battery: 47, range_m: null });
    // The read reaches past the area, for scooters at the edge of a parking on it, and keeps the sweep's deadline.
    const [view, deadline] = polygon.mock.calls[0];
    expect(view.south).toBeLessThan(system.bounds.south); expect(view.east).toBeGreaterThan(system.bounds.east);
    expect(deadline).toBe(vehicles.mock.calls[0][1]);
  });

  it('leaves out a loose scooter of the map that a polygon lists in a state that can’t be hired, and does not count it missing', async () => {
    // The map lists A.1 and `booked` more loose scooters, with no state; the polygon lists them all, those in `state`.
    const sweep = async (state: string, booked = 1) => {
      const others = Array.from({ length: booked }, (_, i) => [`B.${i}`, 41.711, 44.771 + i * 0.001] as const);
      const vehicles = vi.fn().mockResolvedValue(map([scooter('A.1'), ...others.map(([id, lat, lng]) => scooter(id, lat, lng))]));
      const polygon = vi.fn().mockResolvedValue(polygonReply([hired('A.1'), ...others.map(([id, lat, lng]) => hired(id, lat, lng, { state }))]));
      const result = await collectJetRiderRegion(system, api(vehicles, polygon), new Map());
      return { polygons: polygon.mock.calls.length, ranges: Object.fromEntries(result.vehicles.map(vehicle => [vehicle.vehicle_id, vehicle.range_m])) };
    };
    expect(await sweep('Available')).toEqual({ polygons: 1, ranges: { 'jet-rider:A.1': 15750, 'jet-rider:B.0': 15750 } });
    // Until 24 November 2026 B.0 was kept from the map, with no range or price, as `'jet-rider:B.0': null` (week review of
    // 24 November 2026, C5), and three of them were three missing, more than a box may lack: it was read again, down to 100 m.
    expect(await sweep('Booked')).toEqual({ polygons: 1, ranges: { 'jet-rider:A.1': 15750 } });
    expect(await sweep('Booked', 3)).toEqual({ polygons: 1, ranges: { 'jet-rider:A.1': 15750 } });
    expect(await sweep('Reserved', 3)).toEqual({ polygons: 1, ranges: { 'jet-rider:A.1': 15750 } });
  });

  /** A polygon that lists the scooters in its view, but only 80 of them when it holds more than 50. */
  const truncating = (scooters: ReturnType<typeof scooter>[]) => vi.fn().mockImplementation(async (view: MapBounds) => {
    const inside = scooters.filter(item => boundsContainPoint(view, item.location.lat, item.location.long));
    return polygonReply((inside.length > 50 ? inside.slice(0, 80) : inside).map(item => hired(item.identifier, item.location.lat, item.location.long)));
  });

  it('splits a box the map counts above 150 scooters before reading it', async () => {
    const all = [...Array.from({ length: 80 }, (_, i) => scooter(`SW.${i}`, 41.702, 44.762 + i * 0.00005)),
      ...Array.from({ length: 80 }, (_, i) => scooter(`NE.${i}`, 41.718, 44.772 + i * 0.00005))];
    const polygon = truncating(all);
    const result = await collectJetRiderRegion(system, api(vi.fn().mockResolvedValue(map(all)), polygon));
    expect(polygon).toHaveBeenCalledTimes(2);
    expect(result.vehicles).toHaveLength(160); expect(result.vehicles.every(vehicle => vehicle.range_m === 15750)).toBe(true);
  });

  it('reads the quarters of a box whose reply falls short, then a parking the polygons still leave short', async () => {
    const all = [41.705, 41.715].flatMap(lat => [44.765, 44.775].flatMap(lng =>
      Array.from({ length: 25 }, (_, i) => scooter(`Q.${lat}.${lng}.${i}`, lat + i * 0.0001, lng))));
    const polygon = truncating(all);
    const parking = vi.fn().mockImplementation(async (id: string) => parkingReply(id,
      Array.from({ length: 5 }, (_, i) => hired(`P.${i}`, 41.7031, 44.7637))));
    const result = await collectJetRiderRegion(system, api(vi.fn().mockResolvedValue(map(all, [parkingAt('p1', 5, 41.7031, 44.7637)])),
      polygon, parking));
    expect(polygon.mock.calls.length).toBeGreaterThan(5);
    expect(parking).toHaveBeenCalledTimes(1); expect(parking.mock.calls[0][0]).toBe('p1');
    expect(result.vehicles).toHaveLength(105);
    expect(result.vehicles.every(vehicle => vehicle.range_m === 15750)).toBe(true);
  });

  it('splits a map view whose parking list stops at its cap on a parking holding scooters', async () => {
    const vehicles = vi.fn().mockResolvedValueOnce(map([], Array.from({ length: 149 }, (_, i) => parkingAt(`p${i}`, 1))))
      .mockResolvedValue(map());
    await collectJetRiderRegion(system, api(vehicles));
    expect(vehicles).toHaveBeenCalledTimes(5);
  });

  it('fails rather than read more than 40 parkings one by one, or run past its time budget', async () => {
    const parkings = Array.from({ length: 41 }, (_, i) => parkingAt(`p${i}`, 1, 41.701 + i * 0.0004, 44.761 + i * 0.0004));
    const client = api(vi.fn().mockResolvedValue(map([], parkings)));
    await expect(collectJetRiderRegion(system, client)).rejects.toThrow('parkings remain unread');
    expect(client.parking).not.toHaveBeenCalled();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      const vehicles = vi.fn().mockImplementation(async () => { clock.mockReturnValue(now + 150_000); return map([scooter()]); });
      const late = api(vehicles);
      await expect(collectJetRiderRegion(system, late)).rejects.toThrow('collection budget');
      expect(late.polygon).not.toHaveBeenCalled();
    } finally { clock.mockRestore(); }
  });

  it('prices each model from one of its scooters’ cards, about hourly, and never fails a sweep for a price', async () => {
    const reply = polygonReply([hired('A.1'), hired('A.2'), hired('B.1', 41.711, 44.771, { model: { name: 'Ninebot L 60L' } }),
      hired('C.1', 41.712, 44.772, { model: null })]);
    const vehicles = vi.fn().mockResolvedValue(map([scooter('A.1'), scooter('A.2'), scooter('B.1', 41.711, 44.771), scooter('C.1', 41.712, 44.772)]));
    const transport = vi.fn().mockImplementation(async (identifier: string) => identifier === 'A.1' ? card()
      : card('Ninebot L 60L', { debit: { culture: 'ka-GE', value100: 40 } }));
    const prices: JetRiderPrices = new Map();
    const sweep = () => collectJetRiderRegion(system, api(vehicles, vi.fn().mockResolvedValue(reply), undefined, transport), prices);
    const price = (result: Awaited<ReturnType<typeof sweep>>) => Object.fromEntries(result.vehicles.map(vehicle =>
      [vehicle.vehicle_id, vehicle.pricing && `${vehicle.pricing.currency} ${vehicle.pricing.unlock_fee_minor_units}+${vehicle.pricing.minute_fee_minor_units}`]));
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      expect(price(await sweep())).toEqual({ 'jet-rider:A.1': 'GEL 100+32', 'jet-rider:A.2': 'GEL 100+32', 'jet-rider:B.1': 'GEL 100+40',
        'jet-rider:C.1': undefined });
      expect(transport.mock.calls.map(call => call[0])).toEqual(['A.1', 'B.1']);
      // Within the hour the prices are kept, without a read.
      clock.mockReturnValue(now + 59 * 60_000);
      expect(price(await sweep())['jet-rider:B.1']).toBe('GEL 100+40'); expect(transport).toHaveBeenCalledTimes(2);
      // A card that can't be read keeps the price read before, for six hours.
      transport.mockRejectedValue(new Error('JET rider map HTTP 500'));
      clock.mockReturnValue(now + 61 * 60_000);
      const kept = await sweep();
      expect(transport).toHaveBeenCalledTimes(4); expect(price(kept)['jet-rider:A.1']).toBe('GEL 100+32'); expect(kept.vehicles).toHaveLength(4);
      clock.mockReturnValue(now + 6 * 60 * 60_000);
      expect(Object.values(price(await sweep())).every(value => value === undefined)).toBe(true);
    } finally { clock.mockRestore(); }
  });

  it('keeps the price read before when a card gives none the map can show, for six hours from that read, reading it again hourly', async () => {
    const reply = polygonReply([hired('A.1'), hired('A.2')]);
    const vehicles = vi.fn().mockResolvedValue(map([scooter('A.1'), scooter('A.2')]));
    const transport = vi.fn().mockResolvedValue(card());
    const prices: JetRiderPrices = new Map();
    const sweep = async () => (await collectJetRiderRegion(system, api(vehicles, vi.fn().mockResolvedValue(reply), undefined, transport), prices))
      .vehicles.map(vehicle => vehicle.pricing && `${vehicle.pricing.currency} ${vehicle.pricing.unlock_fee_minor_units}+${vehicle.pricing.minute_fee_minor_units}`);
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now);
    try {
      expect(await sweep()).toEqual(['GEL 100+32', 'GEL 100+32']);
      // An hour on, the card lists two rates by the minute: no price the map can show.
      transport.mockResolvedValue({ ...card(), rate: { entries: [card().rate.entries[0], card().rate.entries[0]] } });
      clock.mockReturnValue(now + 61 * 60_000);
      // Until 24 November 2026 this erased the price at once, for an hour (week review of 24 November 2026, minor note).
      expect(await sweep()).toEqual(['GEL 100+32', 'GEL 100+32']);
      expect(transport).toHaveBeenCalledTimes(2);
      // Within the hour of that read the card is not read again, and the price stays.
      clock.mockReturnValue(now + 120 * 60_000);
      expect(await sweep()).toEqual(['GEL 100+32', 'GEL 100+32']);
      expect(transport).toHaveBeenCalledTimes(2);
      // Six hours after the price was read it goes, though a card was read since.
      clock.mockReturnValue(now + 5 * 60 * 60_000);
      expect(await sweep()).toEqual(['GEL 100+32', 'GEL 100+32']);
      expect(transport).toHaveBeenCalledTimes(3);
      clock.mockReturnValue(now + 6 * 60 * 60_000);
      expect(await sweep()).toEqual([undefined, undefined]);
      // A card that gives a price again shows it at once.
      transport.mockResolvedValue(card());
      clock.mockReturnValue(now + 7 * 60 * 60_000);
      expect(await sweep()).toEqual(['GEL 100+32', 'GEL 100+32']);
    } finally { clock.mockRestore(); }
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
    const wired = withJetRiderAppCollectors(feeds as never, regions);
    expect(wired.every(feed => typeof feed.collect === 'function' && feed.paced === true &&
      feed.activeIntervalMs === JET_RIDER_WATCHED_INTERVAL_MS && feed.wideIntervalMs === APP_MAP_WIDE_INTERVAL_MS)).toBe(true);
    expect(JET_RIDER_WATCHED_INTERVAL_MS).toBe(120_000);
  });
});

describe('JET rider collection cadence', () => {
  const MINUTE = 60_000;
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); });
  afterEach(() => vi.useRealTimers());
  // The definitions as scooter-cache.ts builds them: its setDefinitions leaves a feed with an interval of its own for
  // when it is watched, as these, without the wide view's interval it gives other app maps.
  const definitions = () => withDailySweeps(withJetRiderAppCollectors(independentCollectableFeeds(), REGIONAL_SCOOTER_SYSTEMS),
    REGIONAL_SCOOTER_SYSTEMS, now);

  /** The minutes at which Tashkent is collected while a view, wide or a street's, asks for it every minute from minute 20 to 50. */
  async function viewed(wide: boolean) {
    const feed = definitions().find(definition => definition.id.endsWith(':jet_uz_tashkent'))!;
    expect(isAppMapFeed(feed)).toBe(true);
    const times: number[] = [];
    const scheduler = new FeedScheduler<CollectableScooterFeed>(async () => { times.push((Date.now() - now) / MINUTE); }, { phase: () => 0 });
    scheduler.setFeeds([feed]);
    scheduler.start();
    let viewer: ReturnType<typeof setInterval> | undefined;
    try {
      await vi.advanceTimersByTimeAsync(20 * MINUTE);
      scheduler.demand([feed.id], Date.now(), undefined, wide);
      viewer = setInterval(() => scheduler.demand([feed.id], Date.now(), undefined, wide), MINUTE);
      await vi.advanceTimersByTimeAsync(30 * MINUTE);
    } finally { clearInterval(viewer); scheduler.stop(); }
    return times.filter(at => at >= 20 && at < 50);
  }

  it('collects a region a street’s view asks for every two minutes', async () => {
    expect(await viewed(false)).toEqual(Array.from({ length: 15 }, (_, i) => 20 + 2 * i));
  });

  it('collects a region a view too wide to show single scooters asks for every ten minutes, as other app maps', async () => {
    // From 23 to 24 November 2026 every two minutes, as a street's: Tashkent's 105 requests five times as often (week review
    // of 24 November 2026, C3).
    expect(await viewed(true)).toEqual([20, 30, 40]);
  });
});
