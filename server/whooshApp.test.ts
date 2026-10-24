import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WhooshClient, parseWhooshRideAreas, parseWhooshVehicles, whooshMapViews } from './whooshApp';

const REGION = '11111111-1111-1111-1111-111111111111';
const coverage = { south: 1.001, north: 1.019, west: 2.001, east: 2.019 };
const areas = { areas: [{ enabled: true, type: 'LIMITED', borders: { coordinates: [
  { lat: 1.004, lng: 2.004 }, { lat: 1.016, lng: 2.004 }, { lat: 1.016, lng: 2.016 },
] } }] };
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
const device = (n = 1, lat = 1.01, lng = 2.01) => ({ id: id(n), model: 'NB_S90L_25',
  state: { position: { point: { lat, lng } } }, battery: { power: 80, distanceToCharge: { amount: 19 } } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });

async function fixture(options: { closed?: boolean; map?: (body: Record<string, unknown>, count: number) => Response;
  info?: unknown; now?: () => number } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'whoosh-test-')); directories.push(dir);
  const sessionPath = join(dir, 'session.json');
  await writeFile(sessionPath, JSON.stringify({ version: 1, clientId: 'client123456', deviceId: 'device123456',
    refreshToken: 'private-refresh', apiKey: 'private-key' }), { mode: 0o600 });
  let maps = 0, renewals = 0;
  const mock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    if (url === 'https://cognito.whoosh.bike/') {
      renewals++;
      expect(JSON.parse(String(init?.body))).toMatchObject({ AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: { REFRESH_TOKEN: 'private-refresh' } });
      const claims = Buffer.from(JSON.stringify({ aud: 'client123456', exp: Math.floor((options.now?.() ?? Date.now()) / 1000) + 3600 })).toString('base64url');
      return json({ AuthenticationResult: { IdToken: `header.${claims}.signature`, AccessToken: 'private-access' } });
    }
    const headers = new Headers(init?.headers);
    expect(headers.get('x-region-id')).toBe(REGION);
    expect(headers.get('x-auth-token')).toBe('private-access');
    if (url.endsWith('/info')) return json(options.info ?? { region: { id: REGION, status: 'ACTIVE', seasonIsOver: options.closed ?? false } });
    if (url.endsWith('/areas')) return json(areas);
    if (url.endsWith('/client/devices/searches')) {
      maps++;
      const body = JSON.parse(String(init?.body));
      expect(body.clientSearchDevicesParams.regionIds).toEqual([REGION]);
      expect(body.clientSearchDevicesParams.type).toEqual(['scooter']);
      return options.map?.(body, maps) ?? json({ devices: [device()] });
    }
    throw new Error('Unexpected URL');
  });
  const client = new WhooshClient({ sessionPath, fetch: mock as typeof fetch, intervalMs: 0, now: options.now });
  return { client, mock, sessionPath, counts: () => ({ maps, renewals }) };
}

describe('Whoosh map contract', () => {
  it('reads the nested point, defaults range to kilometres, and excludes bikes', () => {
    expect(parseWhooshVehicles({ devices: [device(), { ...device(2), model: 'NB_A200' }] })).toEqual([
      { id: id(1), lat: 1.01, lng: 2.01, battery: 80, range: 19000 },
    ]);
    expect(() => parseWhooshVehicles({ error: { message: 'not a fleet' } })).toThrow();
    expect(() => parseWhooshVehicles({ devices: [{ ...device(), state: { position: { point: { lat: 91, lng: 2 } } } }] })).toThrow();
    expect(parseWhooshVehicles({ devices: [{ ...device(), battery: { power: 101, distanceToCharge: { amount: -1 } } }] })[0])
      .toMatchObject({ battery: null, range: null });
  });

  it('covers disjoint ride areas without bridging the gap or accepting unreviewed expansion', () => {
    const ride = parseWhooshRideAreas(areas);
    const views = whooshMapViews([...ride, { south: 1.2, north: 1.21, west: 2.2, east: 2.21 }],
      { south: 1, north: 1.22, west: 2, east: 2.22 });
    expect(views.length).toBeLessThan(8);
    expect(views.every(v => v.north - v.south < 0.040001 && v.east - v.west < 0.040001)).toBe(true);
    expect(views.some(v => v.south > 1.08 && v.north < 1.16)).toBe(false);
    expect(() => whooshMapViews(ride, { ...coverage, north: 1.005 })).toThrow('exceeds reviewed');
    expect(() => parseWhooshRideAreas({ areas: [{ enabled: true, type: 'LIMITED', borders: { coordinates: [] } }] })).toThrow();
  });

  it('renews one session for concurrent collections and binds requests to the reviewed region', async () => {
    const { client, counts } = await fixture();
    const results = await Promise.all([client.vehicles(REGION, coverage), client.vehicles(REGION, coverage)]);
    expect(results.map(r => r.length)).toEqual([1, 1]);
    expect(counts()).toEqual({ maps: 2, renewals: 1 });
  });

  it('subdivides a capped response and deduplicates scooters on shared boundaries', async () => {
    const { client, counts } = await fixture({ map: (body, count) => {
      if (count === 1) return json({ devices: Array.from({ length: 300 }, (_, i) => device(i + 10)) });
      const params = body.clientSearchDevicesParams as { visibleArea: { upperLeft: { lat: number; lng: number }; bottomRight: { lat: number; lng: number } } };
      const { upperLeft: a, bottomRight: b } = params.visibleArea;
      return json({ devices: [device(1), device(count, (a.lat + b.lat) / 2, (a.lng + b.lng) / 2)] });
    } });
    expect(await client.vehicles(REGION, coverage)).toHaveLength(5);
    expect(counts().maps).toBe(5);
  });

  it('fails the whole sweep when a later view fails', async () => {
    const { client } = await fixture({ map: (_body, count) => count === 1
      ? json({ devices: Array.from({ length: 300 }, (_, i) => device(i + 10)) }) : json({ error: 'failed' }, 503) });
    await expect(client.vehicles(REGION, coverage)).rejects.toThrow('HTTP 503');
  });

  it('fails rather than publishing a view that remains capped after repeated subdivision', async () => {
    const { client } = await fixture({ map: () => json({ devices: Array.from({ length: 300 }, (_, i) => device(i + 10)) }) });
    await expect(client.vehicles(REGION, coverage)).rejects.toThrow('remains capped');
  });

  it('does not turn HTTP-200 application errors or wrong region metadata into empty fleets', async () => {
    const broken = await fixture({ map: () => json({ error: { code: 'internal.service.error' } }) });
    await expect(broken.client.vehicles(REGION, coverage)).rejects.toThrow('application error');
    const wrong = await fixture({ info: { region: { id: id(9), status: 'ACTIVE', seasonIsOver: false } } });
    await expect(wrong.client.vehicles(REGION, coverage)).rejects.toThrow('region metadata');
    expect(wrong.counts().maps).toBe(0);
  });

  it('honours the operator season flag without issuing vehicle searches', async () => {
    const { client, counts } = await fixture({ closed: true });
    expect(await client.vehicles(REGION, coverage)).toEqual([]);
    expect(counts()).toEqual({ maps: 0, renewals: 1 });
  });

  it('backs off after rate limiting and sanitizes rejected authentication', async () => {
    const limited = await fixture({ map: () => new Response('', { status: 429, headers: { 'Retry-After': '120' } }) });
    await expect(limited.client.vehicles(REGION, coverage)).rejects.toThrow('HTTP 429');
    await expect(limited.client.vehicles(REGION, coverage)).rejects.toThrow('rate limited');
    expect(limited.counts().maps).toBe(1);
    const rejected = await fixture({ map: () => new Response('private server diagnostics', { status: 401 }) });
    await expect(rejected.client.vehicles(REGION, coverage)).rejects.toThrow('Whoosh map HTTP 401');
    await expect(rejected.client.vehicles(REGION, coverage)).rejects.toThrow('awaiting retry');
    expect(rejected.counts()).toEqual({ maps: 2, renewals: 2 });
  });
});
