import { afterEach, describe, expect, it, vi } from 'vitest';
import { once } from 'node:events';
import net, { type AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createSnapshotServer } from './snapshotServer';
import { createSnapshotMetrics } from './metrics';
import { FeedScheduler } from './feedScheduler';
import { buildCityOverview, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import type { ScooterResponse } from '../src/lib/types';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas } from '../src/lib/regionalScooterSystems';
import { sourceClass, type SourceClass } from './sourceClasses';

const token = 'a-test-origin-token-with-at-least-32-characters';
const servers: Server[] = [];
async function start(snapshot?: MobilitySnapshot, extra: Partial<Parameters<typeof createSnapshotServer>[0]> = {}) {
  const server = createSnapshotServer({ token, production: true, snapshot: () => snapshot, ...extra });
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, port: (server.address() as AddressInfo).port };
}
afterEach(async () => { for (const server of servers.splice(0)) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } });

describe('snapshot origin boundary', () => {
  it('rejects a malformed request target without crashing and continues serving', async () => {
    const { port } = await start();
    const response = await new Promise<string>((resolve, reject) => {
      let data = '';
      const socket = net.connect(port, '127.0.0.1', () => socket.write('GET //[ HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n'));
      socket.on('data', chunk => data += chunk);
      socket.on('end', () => resolve(data));
      socket.on('error', reject);
    });
    expect(response).toContain('400 Bad Request');
    expect((await fetch(`http://127.0.0.1:${port}/health`)).status).toBe(503);
  });

  it('requires a production secret and rejects unauthenticated origin reads', async () => {
    expect(() => createSnapshotServer({ production: true, snapshot: () => undefined })).toThrow('SCOOTER_SNAPSHOT_API_TOKEN');
    const { port } = await start();
    const url = `http://127.0.0.1:${port}/api/scooters`;
    expect((await fetch(url)).status).toBe(401);
    expect((await fetch(url, { headers: { Authorization: 'Bearer wrong' } })).status).toBe(401);
    expect((await fetch(url, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(503);
  });

  it('does not count a skipped regional feed or an app map, which collects none, as failed parking', async () => {
    const now = Date.now();
    const feed = { source: 'france' as const, provider: 'dott' as const, coverage: [], vehicles: [],
      observedAt: now, attemptedAt: now, stale: false, failed: false };
    const feeds = [{ ...feed, id: 'france:dott_fr_tignes', skipped: true }, { ...feed, id: 'france:dott_fr_paris', skipped: false },
      { ...feed, id: 'sweden:qick_se_orebro', source: 'sweden' as const, provider: 'qick' as const, skipped: false }];
    const { port } = await start({ version: 1, updatedAt: now, feeds, overview: buildCityOverview([], now) });
    const health = await (await fetch(`http://127.0.0.1:${port}/health`)).json() as { failedParkingFeeds: string[] };
    expect(health.failedParkingFeeds).toEqual(['france:dott_fr_paris']);
  });

  it('lists a feed not collected yet, as one a deploy adds, as warming up rather than failed', async () => {
    const now = Date.now();
    const feed = { source: 'france' as const, provider: 'dott' as const, coverage: [], vehicles: [],
      observedAt: now, attemptedAt: now, stale: false, failed: false, skipped: false };
    const feeds = [{ ...feed, id: 'france:dott_fr_lyon' },
      { ...feed, id: 'france:dott_fr_paris', observedAt: 0, attemptedAt: 0, stale: true, failed: true }];
    const { port } = await start({ version: 1, updatedAt: now, feeds, overview: buildCityOverview([], now) });
    const ready = await (await fetch(`http://127.0.0.1:${port}/ready`)).json() as Record<string, unknown>;
    expect(ready).toMatchObject({ ready: true, usableFeeds: 1, failedFeeds: [], warmingFeeds: ['france:dott_fr_paris'] });
  });

  it('answers a view across the 180° line with the scooters on its west side', async () => {
    const now = Date.now();
    const scooter = (id: string, lng: number) => ({ vehicle_id: id, lat: -37.69, lng, provider: 'flamingo', battery: 70,
      range_m: null, distance_m: null, deep_link: null });
    const feeds: FeedSnapshot[] = [{ id: 'newzealand:flamingo_nz_tauranga', source: 'newzealand', provider: 'flamingo',
      coverage: [{ south: -37.75, west: 176.05, north: -37.62, east: 176.37 }], vehicles: [scooter('a', 176.16), scooter('b', 176.2)],
      observedAt: now, attemptedAt: now, stale: false, failed: false, skipped: false }];
    const { port } = await start({ version: 1, updatedAt: now, feeds, overview: buildCityOverview(feeds, now) });
    const headers = { Authorization: `Bearer ${token}` };
    const view = (zoom: number) => `http://127.0.0.1:${port}/api/scooters?south=-47.06&west=159.9&north=-25.98&east=-157.1&zoom=${zoom}`;
    const street = await fetch(view(16), { headers });
    expect(street.status).toBe(200);
    expect(((await street.json()) as ScooterResponse).vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(['a', 'b']);
    const totals = (await (await fetch(view(6), { headers })).json()) as ScooterResponse;
    expect(totals.clusters.map(cluster => [cluster.id, cluster.count])).toEqual([['city:nz:bop:Tauranga', 2]]);
  });

  it('rate limits authenticated clients, separates readiness, and prevents caching at the public origin', async () => {
    const now = Date.now();
    const snapshot: MobilitySnapshot = { version: 1, updatedAt: now, feeds: [], overview: buildCityOverview([], now) };
    const { port } = await start(snapshot);
    expect((await fetch(`http://127.0.0.1:${port}/health`)).status).toBe(200);
    expect((await fetch(`http://127.0.0.1:${port}/ready`)).status).toBe(503);
    const url = `http://127.0.0.1:${port}/api/scooters?zoom=16`;
    const headers = { Authorization: `Bearer ${token}`, 'X-Scooter-Client-IP': '192.0.2.1' };
    for (let i = 0; i < 60; i++) {
      const response = await fetch(url, { headers });
      expect(response.status).toBe(200);
      expect(response.headers.get('Cache-Control')).toBe('private, no-store');
      await response.text();
    }
    expect((await fetch(url, { headers })).status).toBe(429);
    expect((await fetch(url, { headers: { ...headers, 'X-Scooter-Client-IP': '192.0.2.2' } })).status).toBe(200);
  });

  it('serves metrics only to the metrics token, counting routes without their query', async () => {
    const metricsToken = 'a-test-metrics-token-with-at-least-32-characters';
    expect(() => createSnapshotServer({ token, production: true, snapshot: () => undefined, metricsToken: 'short' }))
      .toThrow('METRICS_TOKEN');
    const closed = await start(undefined, { metrics: createSnapshotMetrics() });
    expect((await fetch(`http://127.0.0.1:${closed.port}/metrics`)).status).toBe(404);
    const { port } = await start(undefined, { metrics: createSnapshotMetrics('abc123'), metricsToken });
    await (await fetch(`http://127.0.0.1:${port}/api/scooters?south=47.3&west=8.5&north=47.4&east=8.6&zoom=16`)).text();
    await (await fetch(`http://127.0.0.1:${port}/elsewhere?south=47.3`)).text();
    expect((await fetch(`http://127.0.0.1:${port}/metrics`, { headers: { Authorization: `Bearer ${token}` } })).status).toBe(401);
    const response = await fetch(`http://127.0.0.1:${port}/metrics`, { headers: { Authorization: `Bearer ${metricsToken}` } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/plain; version=0.0.4');
    const text = await response.text();
    expect(text).toContain('scootradar_build_info{version="abc123"} 1');
    expect(text).toContain('scootradar_http_requests_total{route="/api/scooters",status="401"} 1');
    expect(text).toContain('scootradar_http_requests_total{route="other",status="404"} 1');
    expect(text).toContain('scootradar_http_requests_total{route="/metrics",status="401"} 1');
    expect(text).not.toContain('47.3');
  });

  it('counts the requests the Worker\'s address searches sent to Geoapify, from the Worker only', async () => {
    const metrics = createSnapshotMetrics();
    const { port } = await start(undefined, { metrics });
    const url = (count: string) => `http://127.0.0.1:${port}/api/geocode-usage?geoapify=${count}`;
    const post = (count: string, authorization = `Bearer ${token}`) =>
      fetch(url(count), { method: 'POST', headers: { Authorization: authorization } }).then(response => response.status);
    expect(await post('2')).toBe(204);
    expect(await post('1')).toBe(204);
    expect(await post('3', 'Bearer wrong')).toBe(401);
    expect(await post('0')).toBe(400);
    expect(await post('1.5')).toBe(400);
    expect(await post('100')).toBe(400);
    expect((await fetch(url('1'), { headers: { Authorization: `Bearer ${token}` } })).status).toBe(405);
    expect((await fetch(`http://127.0.0.1:${port}/api/scooters`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })).status).toBe(405);
    expect(metrics.render(undefined)).toContain('scootradar_geoapify_requests_total{version="local"} 3');
  });
});

describe('collection on demand', () => {
  const lyon = { south: 45.70, west: 4.7, north: 45.9, east: 5.0 };
  const paris = { south: 48.8, west: 2.25, north: 48.9, east: 2.42 };
  const lyonUrl = (port: number, extra = '&zoom=16') => `http://127.0.0.1:${port}/api/scooters?south=45.74&west=4.82&north=45.77&east=4.87${extra}`;
  const headers = { Authorization: `Bearer ${token}`, 'X-Scooter-Client-IP': '192.0.2.1' };
  const vehicle = (id: string) => ({ provider: 'dott', vehicle_id: id, lat: 45.75, lng: 4.85, battery: 80,
    range_m: null, distance_m: null, deep_link: null });
  const feed = (id: string, coverage: typeof lyon, at: number, extra: Partial<FeedSnapshot> = {}): FeedSnapshot => ({ id,
    source: 'france', provider: 'dott', coverage: [coverage], vehicles: [vehicle(`${id}-old`)], observedAt: at,
    attemptedAt: at, collectedAt: at, stale: false, failed: false, skipped: false, ...extra });
  const minutes = (count: number) => count * 60_000;

  /** A scheduler whose collections take `delayMs` (forever when null) and then bring fresh positions. */
  function cache(feeds: FeedSnapshot[], delayMs: number | null) {
    let snapshot: MobilitySnapshot = { version: 1, updatedAt: Date.now(), feeds, overview: buildCityOverview(feeds, Date.now()) };
    const scheduler = new FeedScheduler<{ id: string; host: string }>(async definition => {
      if (delayMs === null) return new Promise(() => {});
      await new Promise(resolve => setTimeout(resolve, delayMs));
      const now = Date.now();
      snapshot = { ...snapshot, updatedAt: now, feeds: snapshot.feeds.map(candidate => candidate.id === definition.id
        ? { ...candidate, vehicles: [vehicle(`${candidate.id}-new`)], observedAt: now, attemptedAt: now, collectedAt: now }
        : candidate) };
    }, { lastCollectedAt: definition => feeds.find(candidate => candidate.id === definition.id)?.collectedAt });
    scheduler.setFeeds(feeds.map(candidate => ({ id: candidate.id, host: candidate.id })));
    scheduler.start();
    return { scheduler, snapshot: () => snapshot };
  }
  const stops: Array<() => void> = [];
  afterEach(() => { for (const stop of stops.splice(0)) stop(); });

  it('marks as watched the feeds whose positions answer a request, and none for the city totals', async () => {
    const now = Date.now();
    const feeds = [feed('france:dott_fr_lyon', lyon, now), feed('france:dott_fr_paris', paris, now),
      feed('france:dott_fr_skipped', lyon, now, { skipped: true })];
    const demanded: string[][] = [];
    const { port } = await start({ version: 1, updatedAt: now, feeds, overview: buildCityOverview(feeds, now) }, {
      refresher: { demand: ids => { demanded.push(ids); }, refreshing: () => false, wait: async () => true } });
    for (const extra of ['&zoom=16', '&zoom=8', '&zoom=16&provider=voi']) await (await fetch(lyonUrl(port, extra), { headers })).text();
    expect(demanded).toEqual([['france:dott_fr_lyon'], [], []]);
  });

  it('answers at once from positions still shown, and says a refresh is under way', async () => {
    const { scheduler, snapshot } = cache([feed('france:dott_fr_lyon', lyon, Date.now() - minutes(5))], 100);
    stops.push(() => scheduler.stop());
    const { port } = await start(undefined, { snapshot, refresher: scheduler });
    const started = Date.now();
    const first = await fetch(lyonUrl(port), { headers });
    const body = await first.json() as ScooterResponse;
    expect(Date.now() - started).toBeLessThan(100);
    expect(body.vehicles.map(item => item.vehicle_id)).toEqual(['france:dott_fr_lyon-old']);
    expect(body.meta).toMatchObject({ refreshing: true, refreshAfterSeconds: 3 });
    expect(first.headers.get('X-Scooter-Public-Cache-Control')).toBe('no-store');
    await new Promise(resolve => setTimeout(resolve, 150));
    const second = await (await fetch(lyonUrl(port), { headers })).json() as ScooterResponse;
    expect(second.vehicles.map(item => item.vehicle_id)).toEqual(['france:dott_fr_lyon-new']);
    expect(second.meta.refreshing).toBeUndefined();
    expect(second.meta.refreshAfterSeconds).toBe(60);
  });

  it('waits for the collection of positions too old to show', async () => {
    const { scheduler, snapshot } = cache([feed('france:dott_fr_lyon', lyon, Date.now() - minutes(20))], 100);
    stops.push(() => scheduler.stop());
    const metrics = createSnapshotMetrics();
    const { port } = await start(undefined, { snapshot, refresher: scheduler, metrics });
    const body = await (await fetch(lyonUrl(port), { headers })).json() as ScooterResponse;
    expect(body.vehicles.map(item => item.vehicle_id)).toEqual(['france:dott_fr_lyon-new']);
    expect(body.meta.refreshing).toBeUndefined();
    expect(body.meta.sources.france).toBe('fresh');
    expect(metrics.render(snapshot())).toContain('scootradar_request_waits_total{outcome="collected"} 1');
  });

  it('stops waiting for a slow collection without calling the feed failed', async () => {
    const { scheduler, snapshot } = cache([feed('france:dott_fr_lyon', lyon, Date.now() - minutes(20))], null);
    stops.push(() => scheduler.stop());
    const { port } = await start(undefined, { snapshot, refresher: scheduler, coldWaitMs: 100 });
    const response = await fetch(lyonUrl(port), { headers });
    expect(response.status).toBe(200);
    const body = await response.json() as ScooterResponse;
    expect(body.vehicles).toEqual([]);
    expect(body.meta).toMatchObject({ refreshing: true, failedSources: [], partial: false });
    expect(body.meta.sources.france).toBe('stale');
  });

  it('answers an app map\'s last-seen positions within a second while its sweep goes on', async () => {
    const lime = REGIONAL_SCOOTER_SYSTEMS.find(system => system.limeAppMap)!;
    const id = `${regionalSource(lime)}:${lime.id}`;
    const { scheduler, snapshot } = cache([feed(id, lyon, Date.now() - minutes(40), { provider: 'lime' })], null);
    stops.push(() => scheduler.stop());
    const { port } = await start(undefined, { snapshot, refresher: scheduler, coldWaitMs: 5_000, lastSeenWaitMs: 100 });
    const started = Date.now();
    const body = await (await fetch(lyonUrl(port), { headers })).json() as ScooterResponse;
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(body.vehicles).toEqual([]);
    expect(body.lastSeen?.vehicles.map(item => item.vehicle_id)).toEqual([`${id}-old`]);
    expect(body.meta).toMatchObject({ refreshing: true, refreshAfterSeconds: 3, failedSources: [] });
  });

  it('does not wait for a feed whose last collection failed', async () => {
    const { scheduler, snapshot } = cache([feed('france:dott_fr_lyon', lyon, Date.now() - minutes(20), { failed: true })], null);
    stops.push(() => scheduler.stop());
    const { port } = await start(undefined, { snapshot, refresher: scheduler });
    const started = Date.now();
    const body = await (await fetch(lyonUrl(port), { headers })).json() as ScooterResponse;
    expect(Date.now() - started).toBeLessThan(1_000);
    expect(body.meta).toMatchObject({ refreshing: true, failedSources: ['france:dott_fr_lyon'] });
    expect(body.meta.sources.france).toBe('failed');
  });

  it('reads readiness by cadence: an idle feed with old positions is still usable', async () => {
    const now = Date.now();
    const feeds = [feed('france:dott_fr_lyon', lyon, now - minutes(18)), feed('france:dott_fr_paris', paris, now - minutes(40))];
    const { port } = await start({ version: 1, updatedAt: now, feeds, overview: buildCityOverview(feeds, now) },
      { cadence: { fastSince: () => undefined, idleExpiryMs: minutes(30) } });
    const ready = await (await fetch(`http://127.0.0.1:${port}/ready`)).json() as Record<string, unknown>;
    expect(ready).toMatchObject({ ready: true, usableFeeds: 1, servedFeeds: 0, failedFeeds: ['france:dott_fr_paris'] });
  });

  it('answers the zones of a street view to the Worker, and lets it keep a complete answer', async () => {
    const view = 'south=47.36&west=8.53&north=47.38&east=8.55';
    expect((await fetch(`http://127.0.0.1:${(await start()).port}/api/zones?${view}&zoom=15`,
      { headers: { Authorization: `Bearer ${token}` } })).status).toBe(404);
    let pending = false;
    const zones = vi.fn(async () => ({ zones: [], meta: { generatedAt: new Date().toISOString(), pending, truncated: false } }));
    const { port } = await start(undefined, { zones });
    const url = (query: string) => `http://127.0.0.1:${port}/api/zones?${query}`;
    const headers = { Authorization: `Bearer ${token}` };
    expect((await fetch(url(`${view}&zoom=15`))).status).toBe(401);
    expect((await fetch(url(`${view}&zoom=13`), { headers })).status).toBe(400);
    expect((await fetch(url('south=47&west=8&north=47.5&east=9.2&zoom=15'), { headers })).status).toBe(400);
    expect(zones).not.toHaveBeenCalled();
    const complete = await fetch(url(`${view}&zoom=15`), { headers });
    expect(complete.status).toBe(200);
    expect(complete.headers.get('Cache-Control')).toBe('private, no-store');
    expect(complete.headers.get('X-Scooter-Public-Cache-Control')).toBe('public, max-age=300');
    expect(zones).toHaveBeenCalledWith(expect.objectContaining({ bounds: { south: 47.36, west: 8.53, north: 47.38, east: 8.55 } }));
    pending = true;
    expect((await fetch(url(`${view}&zoom=15`), { headers })).headers.get('X-Scooter-Public-Cache-Control')).toBe('private, no-store');
  });
});

describe('sources hidden from the iPhone app', () => {
  // Münster has a feed of three classes: Voi's from NRW.Mobidrom, Dott's GBFS feed and Qick's app map.
  const ids = ['germany:voi_de_muenster', 'germany:dott_de_munster', 'germany:qick_de_munster'];
  const hidden = new Set<SourceClass>(['rider-app', 'restricted']);
  const center = [51.9607, 7.6261];
  const feed = (id: string, now: number): FeedSnapshot => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(candidate => `${regionalSource(candidate)}:${candidate.id}` === id)!;
    return { id, source: regionalSource(system), provider: system.provider, coverage: serviceAreas(system).map(area => area.bounds),
      vehicles: [{ provider: system.provider, vehicle_id: `${id}-1`, lat: center[0], lng: center[1], battery: 80, range_m: null,
        distance_m: null, deep_link: null }], observedAt: now, attemptedAt: now, collectedAt: now, stale: false, failed: false, skipped: false };
  };
  const snapshotOf = (now = Date.now()): MobilitySnapshot => {
    const feeds = ids.map(id => feed(id, now));
    return { version: 1, updatedAt: now, feeds, overview: buildCityOverview(feeds, now) };
  };
  const street = (port: number) => `http://127.0.0.1:${port}/api/scooters?south=51.95&west=7.61&north=51.97&east=7.64&zoom=16`;
  const country = (port: number) => `http://127.0.0.1:${port}/api/scooters?south=47&west=5&north=55&east=15&zoom=6`;
  const web = { Authorization: `Bearer ${token}` };
  const ios = { ...web, 'X-Scooter-Client': 'ios' };
  const read = async (url: string, headers: Record<string, string>) => {
    const response = await fetch(url, { headers });
    expect(response.status).toBe(200);
    return await response.json() as ScooterResponse;
  };
  const munster = (body: ScooterResponse) => body.clusters.find(cluster => cluster.id === 'city:de:Münster');

  it('has a feed of each class it tests', () => {
    expect(ids.map(sourceClass)).toEqual(['licensed', 'restricted', 'rider-app']);
  });

  it('answers the app as the website while no class is hidden', async () => {
    // A street view's parking expiry is counted from the time of the request.
    vi.spyOn(Date, 'now').mockReturnValue(Date.now());
    const snapshot = snapshotOf();
    const { port } = await start(snapshot);
    for (const url of [street(port), country(port)]) expect(await read(url, ios)).toEqual(await read(url, web));
    expect((await read(street(port), ios)).vehicles).toHaveLength(3);
  });

  it('answers the website as before when classes are hidden from the app', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.now());
    const snapshot = snapshotOf();
    const before = (await start(snapshot)).port;
    const { port } = await start(snapshot, { iosHidden: hidden });
    for (const [url, unfiltered] of [[street(port), street(before)], [country(port), country(before)]]) {
      expect(await read(url, web)).toEqual(await read(unfiltered, web));
    }
  });

  it('leaves the hidden classes out of the app\'s scooters, totals and providers', async () => {
    const { port } = await start(snapshotOf(), { iosHidden: hidden });
    const [shown, all] = [await read(street(port), ios), await read(street(port), web)];
    expect(shown.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(['germany:voi_de_muenster-1']);
    expect(shown.meta).toMatchObject({ totalVehicles: 1, failedSources: [], partial: false });
    expect(shown.meta.sources.germany).toBe('fresh');
    expect(all.meta.availableProviders).toEqual(expect.arrayContaining(['dott', 'qick', 'voi']));
    expect(shown.meta.availableProviders).toEqual(all.meta.availableProviders!.filter(provider => provider !== 'dott' && provider !== 'qick'));
    const [totals, allTotals] = [await read(country(port), ios), await read(country(port), web)];
    expect(munster(allTotals)).toMatchObject({ count: 3, providers: { dott: 1, qick: 1, voi: 1 } });
    expect(munster(totals)).toMatchObject({ count: 1, providers: { voi: 1 } });
    expect(totals.providers).toEqual({ voi: 1 });
    expect(totals.meta).toMatchObject({ totalVehicles: 1, overview: true, generatedAt: allTotals.meta.generatedAt });
    expect(totals.meta.availableProviders).not.toContain('qick');
  });

  it('builds the app\'s city totals again only when the cache has built its own again', async () => {
    let snapshot = snapshotOf();
    const buildOverview = vi.fn((feeds: FeedSnapshot[], now: number) => buildCityOverview(feeds, now));
    const { port } = await start(undefined, { snapshot: () => snapshot, iosHidden: hidden, buildOverview });
    await read(street(port), ios);
    expect(buildOverview).not.toHaveBeenCalled();
    await read(country(port), ios);
    await read(country(port), ios);
    expect(buildOverview).toHaveBeenCalledOnce();
    expect(buildOverview.mock.calls[0][0].map(candidate => candidate.id)).toEqual(['germany:voi_de_muenster']);
    // A collection publishes a new snapshot with the same totals; an hourly rebuild, new ones.
    snapshot = { ...snapshot, updatedAt: Date.now() };
    await read(country(port), ios);
    expect(buildOverview).toHaveBeenCalledOnce();
    snapshot = { ...snapshot, overview: buildCityOverview(snapshot.feeds, Date.now()) };
    await read(country(port), ios);
    expect(buildOverview).toHaveBeenCalledTimes(2);
  });

  it('collects for the app only the feeds it may be shown', async () => {
    const demanded: string[][] = [];
    const { port } = await start(snapshotOf(), { iosHidden: hidden,
      refresher: { demand: ids => { demanded.push(ids); }, refreshing: () => false, wait: async () => true } });
    await read(street(port), ios);
    await read(street(port), web);
    expect(demanded).toEqual([['germany:voi_de_muenster'], ids]);
  });

  it('asks for the zones of the feeds the app may be shown alone', async () => {
    const zones = vi.fn<NonNullable<Parameters<typeof createSnapshotServer>[0]['zones']>>(async () => ({ zones: [],
      meta: { generatedAt: new Date().toISOString(), pending: false, truncated: false } }));
    const url = (port: number) => `http://127.0.0.1:${port}/api/zones?south=51.95&west=7.61&north=51.97&east=7.64&zoom=15`;
    const off = (await start(undefined, { zones })).port;
    await (await fetch(url(off), { headers: ios })).text();
    expect(zones.mock.calls[0]).toHaveLength(1);
    const { port } = await start(undefined, { zones, iosHidden: hidden });
    await (await fetch(url(port), { headers: web })).text();
    expect(zones.mock.calls[1]).toHaveLength(1);
    const response = await fetch(url(port), { headers: ios });
    expect(response.headers.get('X-Scooter-Public-Cache-Control')).toBe('public, max-age=300');
    const shown = zones.mock.calls[2][1]!;
    expect(ids.map(id => shown(id))).toEqual([true, false, false]);
    expect(shown('national:bolt_winterthur')).toBe(true);
  });
});
