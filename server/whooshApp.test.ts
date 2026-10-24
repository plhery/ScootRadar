import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dockModel, type DockInput } from '../src/lib/dockModel';
import { translate, type AppLocale } from '../src/lib/i18n';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource } from '../src/lib/regionalScooterSystems';
import { buildCityOverview, querySnapshot, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { activeSeasonalPause, snapshotPaused } from '../src/lib/seasonalPauses';
import { formatUiText } from '../src/lib/uiText';
import { collectSnapshotFeed } from './collectFeed';
import { createSnapshotMetrics } from './metrics';
import { WhooshClient, collectWhooshRegion, parseWhooshRideAreas, parseWhooshVehicles, whooshMapViews } from './whooshApp';

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
    // The nearest region's polygons, as Curitiba's in Joinville's list, are left to that region.
    const neighbour = { south: 3, north: 3.01, west: 4, east: 4.01 };
    expect(whooshMapViews([...ride, neighbour], coverage)).toEqual(whooshMapViews(ride, coverage));
    expect(() => whooshMapViews([neighbour], coverage)).toThrow('no ride area in its reviewed coverage');
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

describe('Whoosh closed seasons', () => {
  // Whoosh closed these three on 24 October 2026; Jet still runs in Almaty.
  const towns = ['whoosh_kz_ala', 'whoosh_kz_nqz', 'whoosh_mx_zap'].map(id => REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === id)!);
  const feedId = (system: (typeof towns)[number]) => `${regionalSource(system)}:${system.id}`;
  const sample = (text: string, line: string) => text.split('\n').find(candidate => candidate.startsWith(`${line} `))?.split(' ')[1];
  afterEach(() => { vi.useRealTimers(); });

  // Synthetic region info: each town's season is over until `open` lists its region.
  async function regions(open: Set<string>) {
    const dir = await mkdtemp(join(tmpdir(), 'whoosh-test-')); directories.push(dir);
    const sessionPath = join(dir, 'session.json');
    await writeFile(sessionPath, JSON.stringify({ version: 1, clientId: 'client123456', deviceId: 'device123456',
      refreshToken: 'private-refresh', apiKey: 'private-key' }), { mode: 0o600 });
    const byRegion = new Map(towns.map(system => [system.whooshAppRegion!, system]));
    let maps = 0;
    const mock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://cognito.whoosh.bike/') {
        const claims = Buffer.from(JSON.stringify({ aud: 'client123456', exp: Math.floor(Date.now() / 1000) + 86_400 })).toString('base64url');
        return json({ AuthenticationResult: { IdToken: `header.${claims}.signature`, AccessToken: 'private-access' } });
      }
      const region = new Headers(init?.headers).get('x-region-id')!;
      const [lat, lng] = byRegion.get(region)!.center;
      if (url.endsWith('/info')) return json({ region: { id: region, status: 'ACTIVE', seasonIsOver: !open.has(region) } });
      if (url.endsWith('/areas')) return json({ areas: [{ enabled: true, type: 'LIMITED', borders: { coordinates: [
        { lat: lat - 0.004, lng: lng - 0.004 }, { lat: lat + 0.004, lng: lng - 0.004 },
        { lat: lat + 0.004, lng: lng + 0.004 }, { lat: lat - 0.004, lng: lng + 0.004 },
      ] } }] });
      if (url.endsWith('/client/devices/searches')) {
        maps++;
        const { upperLeft, bottomRight } = JSON.parse(String(init?.body)).clientSearchDevicesParams.visibleArea;
        const inView = lat >= upperLeft.lat && lat <= bottomRight.lat && lng >= upperLeft.lng && lng <= bottomRight.lng;
        return json({ devices: inView ? [device(1, lat, lng)] : [] });
      }
      throw new Error('Unexpected URL');
    });
    return { client: new WhooshClient({ sessionPath, fetch: mock as typeof fetch, intervalMs: 0 }), maps: () => maps };
  }

  it('pauses Almaty, Astana and Zapopan while Whoosh says their season is over, until it opens again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-10-28T09:00:00Z'));
    const open = new Set<string>();
    const { client, maps } = await regions(open);
    const records = new Map<string, FeedSnapshot>();
    const collect = async () => {
      for (const system of towns) {
        await collectSnapshotFeed({ id: feedId(system), source: regionalSource(system), provider: 'whoosh',
          coverage: [system.bounds], host: 'api.whoosh.bike', collect: () => collectWhooshRegion(system, client) },
        records.get(feedId(system)), record => records.set(record.id, record));
      }
      const feeds = [...records.values()];
      return { version: 1, updatedAt: Date.now(), feeds, overview: buildCityOverview(feeds, Date.now()) } satisfies MobilitySnapshot;
    };
    const paused = (snapshot: MobilitySnapshot) => {
      const text = createSnapshotMetrics('test').render(snapshot, Date.now());
      return Object.fromEntries(towns.map(system => [system.city,
        sample(text, `scootradar_feed_paused{feed="${feedId(system)}",source="${regionalSource(system)}",provider="whoosh"}`)]));
    };
    const street = (snapshot: MobilitySnapshot, system: (typeof towns)[number]) =>
      querySnapshot(snapshot, { bounds: system.bounds, minBattery: 0 }, 15, Date.now());
    const dock = (snapshot: MobilitySnapshot, system: (typeof towns)[number]) => {
      const response = street(snapshot, system);
      const input: DockInput = {
        count: response.vehicles.length, originInViewport: false, nearest: null, loading: null, failure: null,
        outOfDate: false, hasData: true, meta: response.meta, lastUpdated: Date.now() - 30_000, now: Date.now(),
        representedCount: response.vehicles.length, viewportProviders: ['whoosh'], viewportCenter: system.center,
        providerCounts: {}, providersInView: new Set(), enabledProviders: new Set(['whoosh']), minBattery: 0,
        unfilteredCount: response.vehicles.length,
      };
      const model = dockModel(input);
      if (model.kind !== 'summary') throw new Error(`Expected the summary, got ${model.kind}`);
      return model.notices.find(entry => entry.kind === 'season');
    };

    const closed = await collect();
    expect(maps()).toBe(0);
    for (const system of towns) {
      const record = records.get(feedId(system))!;
      expect(record).toMatchObject({ vehicles: [], failed: false, skipped: false, seasonOver: true });
      // Sentry is not told the feed stopped, and the answer names it rather than failing.
      expect(snapshotPaused(record, Date.now())).toBe(true);
      expect(street(closed, system).meta).toMatchObject({ seasonOver: [feedId(system)], failedSources: [], partial: false });
    }
    // "Feed empty" and "feed stopped" ignore a paused feed.
    expect(paused(closed)).toEqual({ Almaty: '1', Astana: '1', Zapopan: '1' });
    // The website shows Astana and Zapopan paused for the season; Almaty has Jet.
    const [almaty, astana, zapopan] = towns;
    expect(activeSeasonalPause(almaty.center, Date.now(), undefined, new Set([feedId(almaty)]))).toBeNull();
    expect(dock(closed, almaty)).toBeUndefined();
    expect(dock(closed, astana)).toEqual({ kind: 'season', text: { key: 'dock.seasonOver', values: { city: 'Astana' } } });
    const notice = dock(closed, zapopan)!;
    expect(notice).toEqual({ kind: 'season', text: { key: 'dock.seasonOver', values: { city: 'Zapopan' } } });
    const say = (locale: AppLocale, region?: string) => formatUiText(notice.text, { locale, region,
      t: (key, values) => translate(locale, key, values, region), formatNumber: String });
    expect(say('en')).toBe('Off season in Zapopan: scooters are back when the operator reopens');
    expect(say('es', 'MX')).toBe('Pausa de temporada en Zapopan: los scooters vuelven cuando el operador reabra');
    expect(say('de')).toBe('Saisonpause in Zapopan: Scooter wieder, sobald der Anbieter die Saison eröffnet');

    // Whoosh opens the season again: once its region info is read again, within the hour, the towns are back.
    for (const system of towns) open.add(system.whooshAppRegion!);
    vi.setSystemTime(Date.now() + 61 * 60_000);
    const reopened = await collect();
    expect(maps()).toBeGreaterThanOrEqual(3);
    for (const system of towns) {
      const record = records.get(feedId(system))!;
      expect(record.vehicles).toHaveLength(1);
      expect(record.seasonOver).toBeUndefined();
      expect(snapshotPaused(record, Date.now())).toBe(false);
      expect(street(reopened, system).meta.seasonOver).toBeUndefined();
      expect(dock(reopened, system)).toBeUndefined();
    }
    expect(paused(reopened)).toEqual({ Almaty: '0', Astana: '0', Zapopan: '0' });
  });
});
