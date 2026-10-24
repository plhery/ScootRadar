import { describe, expect, it } from 'vitest';
import { skippedSources } from '@/lib/scooterSources';
import { buildCityOverview, feedsForQuery, overviewNeedsRefresh, querySnapshot, VEHICLE_MAX_AGE_MS, type FeedSnapshot, type MobilitySnapshot } from './scooterSnapshots';
import { scooterResponseHeaders } from './scooterResponse';
import { ScooterFeedsUnavailableError } from './scooterFeeds';
import { providersForViewport, mapRepresentationsMatch } from './mapCoverage';
import type { Vehicle } from './types';
import { providerHealth, providersDownNotice } from './dataHealth';
import { PARKING_MAX_AGE_MS } from './dataFreshness';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource } from './regionalScooterSystems';

const now = Date.parse('2026-09-08T12:00:00Z');
const lyon = { south: 45.70, west: 4.7, north: 45.9, east: 5.0 };
const zurich = { south: 47.27, west: 8.34, north: 47.49, east: 8.73 };
const vehicle = (id: string, battery: number | null = 80): Vehicle => ({
  vehicle_id: id, lat: 45.75, lng: 4.85, provider: 'dott', battery,
  range_m: null, distance_m: null, deep_link: null,
});
const feed = (values: Partial<FeedSnapshot> = {}): FeedSnapshot => ({
  id: 'france:dott_fr_lyon', source: 'france', provider: 'dott', coverage: [lyon],
  observedAt: now, attemptedAt: now, vehicles: [vehicle('one'), vehicle('two', null)],
  stale: false, failed: false, skipped: false, ...values,
});
const snapshot = (feeds: FeedSnapshot[]): MobilitySnapshot => ({
  version: 1, updatedAt: now, feeds, overview: buildCityOverview(feeds, now),
});
const query = { bounds: lyon, minBattery: 0 };
const voi = feed({ id: 'france:voi_lyon', provider: 'voi', vehicles: [{ ...vehicle('three'), provider: 'voi' }] });
// As the cache server does: publishing keeps the city totals, persisting rebuilds them when needed.
const persistCycle = (cached: MobilitySnapshot, feeds: FeedSnapshot[], at: number): MobilitySnapshot => ({ ...cached, feeds,
  overview: overviewNeedsRefresh(cached, feeds, at) ? buildCityOverview(feeds, at) : cached.overview });

describe('persistent map snapshots', () => {
  it('refreshes incomplete startup city counts as failed feeds recover', () => {
    const unavailable = feed({ observedAt: 0, failed: true, stale: true, vehicles: [] });
    const initial = snapshot([unavailable]);
    expect(overviewNeedsRefresh(initial, [unavailable], now)).toBe(false);
    const healthy = feed();
    expect(overviewNeedsRefresh(initial, [healthy], now)).toBe(true);
    const refreshed = { ...initial, feeds: [healthy], overview: buildCityOverview([healthy], now) };
    expect(querySnapshot(refreshed, { bounds: lyon, minBattery: 0 }, 8, now).meta.totalVehicles).toBe(2);
    expect(overviewNeedsRefresh(refreshed, [healthy], now + 60_000)).toBe(false);
  });

  it('counts a feed discovered after the city totals were built', () => {
    // Discovery adds it as a failed placeholder before its first collection.
    const placeholder = { ...voi, vehicles: [], observedAt: 0, attemptedAt: 0, failed: true, stale: true };
    let cached = persistCycle(snapshot([feed()]), [feed(), placeholder], now + 60_000);
    cached = persistCycle(cached, [feed(), voi], now + 120_000);
    expect(querySnapshot(cached, query, 8, now + 120_000).providers).toEqual({ dott: 2, voi: 1 });
    expect(overviewNeedsRefresh(cached, [feed(), voi], now + 180_000)).toBe(false);
  });

  it('drops the counts of a retired feed from the city totals', () => {
    const cached = persistCycle(snapshot([feed(), voi]), [feed()], now + 60_000);
    expect(querySnapshot(cached, query, 8, now + 60_000).providers).toEqual({ dott: 2 });
  });

  it('returns empty coverage without needing live or even fresh cached feeds', () => {
    const response = querySnapshot(snapshot([feed({ observedAt: 0 })]), { ...query, outsideCoverage: true }, 16, now);
    expect(response.vehicles).toEqual([]);
    expect(response.meta.partial).toBe(false);
    expect(response.meta.sources).toEqual(skippedSources());
  });

  it('does not involve Swiss feed health in a French city response', () => {
    const response = querySnapshot(snapshot([feed(), feed({ id: 'hopp', source: 'hopp', provider: 'hopp', coverage: [zurich], failed: true, observedAt: 0 })]), query, 16, now);
    expect(response.vehicles).toHaveLength(2);
    expect(response.meta.sources.national).toBe('skipped');
    expect(response.meta.sources.hopp).toBe('skipped');
    expect(response.meta.sources.publibike).toBe('skipped');
    expect(response.meta.partial).toBe(false);
    expect(response.meta.availableProviders).toEqual(['dott']);
  });

  it('uses hourly city totals, keeps battery counts accurate, and never exposes old individual locations', () => {
    const cached = snapshot([feed()]);
    // Live vehicles change while the saved hourly overview remains stable.
    cached.feeds[0].vehicles = [];
    const all = querySnapshot(cached, query, 8, now + 30 * 60_000);
    expect(all.vehicles).toEqual([]);
    expect(all.clusters).toHaveLength(1);
    expect(all.clusters[0]).toMatchObject({ city: 'Lyon', count: 2 });
    expect(all.meta).toMatchObject({ overview: true, refreshAfterSeconds: 3600, stale: false });
    const charged = querySnapshot(cached, { ...query, minBattery: 50 }, 9, now);
    expect(charged.clusters[0].count).toBe(1);
    expect(querySnapshot(cached, { ...query, providers: new Set(['pony']) }, 9, now).clusters).toEqual([]);
  });

  it('preserves a failing feed up to fifteen minutes but never offers older vehicles', () => {
    const cached = snapshot([feed({ failed: true, stale: true })]);
    const response = querySnapshot(cached, query, 16, now + 8 * 60_000);
    expect(response.vehicles).toHaveLength(2);
    expect(response.meta).toMatchObject({ partial: true, stale: true,
      expiresAt: new Date(now + 15 * 60_000).toISOString(), refreshAfterSeconds: 60 });
    expect(querySnapshot(cached, query, 16, now + 15 * 60_000).vehicles).toHaveLength(2);
    // Then it shows none and names the feed: its operator, not the map, is failing.
    const expired = querySnapshot(cached, query, 16, now + VEHICLE_MAX_AGE_MS + 1);
    expect(expired.vehicles).toEqual([]);
    expect(expired.meta).toMatchObject({ partial: true, failedSources: ['france:dott_fr_lyon'], refreshAfterSeconds: 60 });
  });

  it('reports an unavailable provider without rejecting a successfully collected eight-minute observation', () => {
    const cached = snapshot([
      feed({ observedAt: now - 480_000 }),
      feed({ id: 'france:voi', provider: 'voi', observedAt: now - 900_001, failed: true, stale: true }),
    ]);
    const response = querySnapshot(cached, query, null, now);
    expect(response.vehicles).toHaveLength(2);
    expect(response.meta).toMatchObject({ partial: true, stale: false,
      failedSources: ['france:voi'], expiresAt: new Date(now + 420_000).toISOString() });
    // The dock would name Voi, which shows nothing here, and say nothing about Dott.
    expect(providersDownNotice(providerHealth({
      meta: response.meta, viewportProviders: ['dott', 'voi'], inView: new Set(['dott']),
    }))).toEqual({ key: 'dock.down.one', values: { name: 'Voi' } });
    // Once Dott's positions are too old as well, the answer is empty and names both.
    expect(querySnapshot(cached, query, 16, now + 420_001)).toMatchObject({
      vehicles: [], meta: { failedSources: ['france:dott_fr_lyon', 'france:voi'] } });
  });

  it('does not confuse an empty operating area with an upstream failure', () => {
    const response = querySnapshot(snapshot([feed({ vehicles: [] })]), query, 16, now);
    expect(response.meta).toMatchObject({ totalVehicles: 0, partial: false });
  });

  it('deduplicates overlapping feeds and returns only vehicles inside the requested map', () => {
    const response = querySnapshot(snapshot([feed(), feed({ id: 'duplicate', vehicles: [vehicle('one'), { ...vehicle('far'), lng: 5.5 }] })]), query, 16, now);
    expect(response.vehicles).toHaveLength(2);
    expect(response.providers).toEqual({ dott: 2 });
  });

  it('expires city totals instead of silently serving abandoned snapshots', () => {
    expect(() => querySnapshot(snapshot([feed()]), query, 8, now + 4 * 3600_000)).toThrow(ScooterFeedsUnavailableError);
  });

  it('names the operator of a city whose every feed failed before the overview was built', () => {
    const response = querySnapshot(snapshot([feed({ observedAt: 0, failed: true, vehicles: [] })]), query, 8, now);
    expect(response.clusters).toEqual([]);
    expect(response.meta).toMatchObject({ overview: true, partial: true, failedSources: ['france:dott_fr_lyon'] });
  });

  it('answers unavailable while every feed in view is yet to be collected', () => {
    const placeholder = feed({ observedAt: 0, attemptedAt: 0, failed: true, stale: true, vehicles: [] });
    expect(() => querySnapshot(snapshot([placeholder]), query, 16, now)).toThrow(ScooterFeedsUnavailableError);
    expect(() => querySnapshot(snapshot([placeholder]), query, 8, now)).toThrow(ScooterFeedsUnavailableError);
  });
});

describe('map coverage and zoom tiers', () => {
  it('hides Swiss providers in Lyon, Marseille and empty French countryside', () => {
    expect(providersForViewport(lyon)).toEqual(['dott']);
    expect(providersForViewport({ south: 43.2, west: 5.3, north: 43.4, east: 5.5 })).toEqual(['lime', 'voi']);
    expect(providersForViewport({ south: 43, west: 1, north: 43.1, east: 1.1 })).toEqual([]);
    expect(providersForViewport(zurich)).toContain('publibike');
  });

  it('reuses city totals across overview zooms and live vehicles across street zooms', () => {
    expect(mapRepresentationsMatch(5, 10)).toBe(true);
    expect(mapRepresentationsMatch(10, 11)).toBe(false);
    expect(mapRepresentationsMatch(12, 13)).toBe(false);
    expect(mapRepresentationsMatch(16, 19)).toBe(true);
  });
});

it('returns parking only at street zoom, separately from scooter counts and battery filters', () => {
  const location = { id: 'dott_fr_lyon:bay', name: 'Bay', provider: 'dott', lat: 45.75, lng: 4.85, mandatory: true };
  const cached = snapshot([feed({ parking: { locations: [location, { ...location, id: 'outside', lat: 47 }], observedAt: now, stale: false } })]);
  const street = querySnapshot(cached, { ...query, minBattery: 100 }, 16, now);
  expect(street.vehicles).toEqual([]);
  expect(street.parking).toEqual([location]);
  expect(street.meta.totalVehicles).toBe(0);
  expect(street.meta.parkingStatus).toBe('fresh');
  expect(querySnapshot(cached, query, 15, now).parking).toBeUndefined();
  expect(querySnapshot(cached, { ...query, providers: new Set(['voi']) }, 16, now).parking).toEqual([]);
  cached.feeds[0].parking!.observedAt = now - PARKING_MAX_AGE_MS - 1;
  const expired = querySnapshot(cached, query, 16, now);
  expect(expired.parking).toEqual([]);
  expect(expired.meta.parkingStatus).toBe('failed');
  expect(expired.vehicles).toHaveLength(2);
});

it('expects no parking from an app map, which collects none', () => {
  const binbin = feed({ id: 'turkey:binbin_tr_gaziantep', source: 'turkey', provider: 'binbin',
    vehicles: [{ ...vehicle('four'), provider: 'binbin' }] });
  expect(querySnapshot(snapshot([binbin]), query, 16, now).meta.parkingStatus).toBe('skipped');
  const location = { id: 'dott_fr_lyon:bay', name: 'Bay', provider: 'dott', lat: 45.75, lng: 4.85, mandatory: true };
  const beside = feed({ parking: { locations: [location], observedAt: now, stale: false } });
  expect(querySnapshot(snapshot([beside, binbin]), query, 16, now).meta.parkingStatus).toBe('fresh');
});

describe('feeds collected on demand', () => {
  const minutes = (count: number) => count * 60_000;

  it('names the feeds whose positions answer a query, and none for the city totals', () => {
    const cached = snapshot([feed(), voi, feed({ id: 'national:lime_zurich', source: 'national', provider: 'lime', coverage: [zurich] })]);
    expect(feedsForQuery(cached, query, 16).map(item => item.id)).toEqual(['france:dott_fr_lyon', 'france:voi_lyon']);
    expect(feedsForQuery(cached, { ...query, providers: new Set(['voi']) }, 13).map(item => item.id)).toEqual(['france:voi_lyon']);
    expect(feedsForQuery(cached, query, 10)).toEqual([]);
    expect(feedsForQuery(cached, { ...query, outsideCoverage: true }, 16)).toEqual([]);
  });

  it('says a refresh is under way and does not call a feed being collected again failed', () => {
    const cold = feed({ observedAt: now - minutes(20), collectedAt: now - minutes(20) });
    const cached = snapshot([cold, voi]);
    expect(querySnapshot(cached, query, 16, now).meta.failedSources).toEqual(['france:dott_fr_lyon']);
    const response = querySnapshot(cached, query, 16, now, { refreshing: new Set(['france:dott_fr_lyon']) });
    expect(response.meta).toMatchObject({ refreshing: true, refreshAfterSeconds: 3, failedSources: [], partial: false, stale: true });
    expect(response.meta.sources.france).toBe('stale');
    expect(response.vehicles.map(item => item.provider)).toEqual(['voi']);
    expect(scooterResponseHeaders(response)['Cache-Control']).toBe('no-store');
    // Alone and too old to show, it answers empty rather than unavailable while it comes back.
    expect(() => querySnapshot(snapshot([cold]), query, 16, now)).toThrow(ScooterFeedsUnavailableError);
    expect(querySnapshot(snapshot([cold]), query, 16, now, { refreshing: new Set([cold.id]) }).vehicles).toEqual([]);
  });

  it('calls a feed not collected yet, as one a deploy adds, on its way while it is collected, and failed once it fails', () => {
    const added = feed({ vehicles: [], observedAt: 0, attemptedAt: 0, stale: true, failed: true });
    const response = querySnapshot(snapshot([added, voi]), query, 16, now, { refreshing: new Set([added.id]) });
    expect(response.meta).toMatchObject({ refreshing: true, failedSources: [], partial: false, stale: true });
    const failed = { ...added, attemptedAt: now - 1_000 };
    expect(querySnapshot(snapshot([failed, voi]), query, 16, now, { refreshing: new Set([added.id]) }).meta.failedSources)
      .toEqual([added.id]);
  });

  describe('an app map being collected again', () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(item => item.limeAppMap)!;
    const scooter = (id: string, lat = 45.75, lng = 4.85): Vehicle => ({ ...vehicle(id), provider: 'lime', lat, lng });
    const lime = (values: Partial<FeedSnapshot> = {}) => feed({ id: `${regionalSource(system)}:${system.id}`, provider: 'lime',
      vehicles: [scooter('north', 45.85), scooter('south', 45.72)], observedAt: now - minutes(40), ...values });
    const refreshing = (item: FeedSnapshot) => ({ refreshing: new Set([item.id]) });

    it('shows its scooters where they were last seen, up to three hours ago, counted nowhere', () => {
      const old = lime();
      const response = querySnapshot(snapshot([old, voi]), query, 16, now, refreshing(old));
      expect(response.vehicles.map(item => item.vehicle_id)).toEqual(['three']);
      expect(response.lastSeen?.vehicles.map(item => item.vehicle_id)).toEqual(['north', 'south']);
      expect(response.lastSeen?.clusters).toEqual([]);
      expect(response.meta).toMatchObject({ refreshing: true, lastSeenAt: new Date(now - minutes(40)).toISOString(), totalVehicles: 1 });
      expect(response.providers).toEqual({ voi: 1 });
      // Alone in view, it answers with them rather than empty.
      expect(querySnapshot(snapshot([old]), query, 16, now, refreshing(old)).lastSeen?.vehicles).toHaveLength(2);
      // Not while nothing collects it, nor once older than three hours.
      expect(querySnapshot(snapshot([old, voi]), query, 16, now).lastSeen).toBeUndefined();
      const older = lime({ observedAt: now - minutes(181) });
      expect(querySnapshot(snapshot([older, voi]), query, 16, now, refreshing(older)).lastSeen).toBeUndefined();
    });

    it('keeps the fifteen minutes of a licensed feed', () => {
      const old = feed({ observedAt: now - minutes(40) });
      const response = querySnapshot(snapshot([old, voi]), query, 16, now, refreshing(old));
      expect(response.lastSeen).toBeUndefined();
      expect(response.meta.lastSeenAt).toBeUndefined();
    });

    it('shows its sweep under way, and last-seen scooters only where the sweep has yet to look', () => {
      const southHalf = { south: 45.70, west: 4.7, north: 45.8, east: 5.0 };
      const sweeping = lime({ vehicles: [scooter('north', 45.85), scooter('south', 45.72), scooter('gone', 45.71), scooter('moved', 45.88)],
        sweep: { startedAt: now - 30_000, vehicles: [scooter('moved', 45.73), scooter('new', 45.74)], swept: [southHalf] } });
      const response = querySnapshot(snapshot([sweeping]), query, 16, now, refreshing(sweeping));
      expect(response.vehicles.map(item => item.vehicle_id)).toEqual(['moved', 'new']);
      expect(response.lastSeen?.vehicles.map(item => item.vehicle_id)).toEqual(['north']);
      expect(response.meta.generatedAt).toBe(new Date(now - 30_000).toISOString());
      // Once the sweep has ended, its collection shows, and nothing stands faded.
      const done = lime({ observedAt: now - 10_000, vehicles: [scooter('moved', 45.73)] });
      expect(querySnapshot(snapshot([done]), query, 16, now, refreshing(done)).lastSeen).toBeUndefined();
      // A sweep that started more than fifteen minutes ago is not shown.
      const stalled = { ...sweeping, sweep: { ...sweeping.sweep!, startedAt: now - minutes(16) } };
      const late = querySnapshot(snapshot([stalled]), query, 16, now, refreshing(stalled));
      expect(late.vehicles).toEqual([]);
      expect(late.lastSeen?.vehicles.map(item => item.vehicle_id)).toEqual(['north', 'south', 'gone', 'moved']);
    });

    it('groups its last-seen scooters apart from the others', () => {
      const old = lime({ vehicles: [scooter('a'), scooter('b'), scooter('c', 45.85)] });
      const fresh = feed({ vehicles: [vehicle('one'), vehicle('two')] });
      const response = querySnapshot(snapshot([fresh, old]), query, 13, now, refreshing(old));
      expect(response.clusters.map(cluster => cluster.count)).toEqual([2]);
      expect(response.lastSeen?.clusters.map(cluster => [cluster.count, cluster.providers])).toEqual([[2, { lime: 2 }]]);
      expect(response.lastSeen?.clusters[0].id).toBe(`seen:${response.clusters[0].id}`);
      expect(response.lastSeen?.vehicles.map(item => item.vehicle_id)).toEqual(['c']);
    });
  });

  it('counts in the city totals an idle feed whose positions are older than the map shows', () => {
    const idle = feed({ observedAt: now - minutes(25), collectedAt: now - minutes(16) });
    const onTime = (item: FeedSnapshot) => now - (item.collectedAt ?? item.observedAt) <= minutes(30);
    expect(buildCityOverview([idle], now).cities.find(city => city.id === 'fr:Lyon')?.failedSources).toEqual(['france:dott_fr_lyon']);
    const overview = buildCityOverview([idle], now, onTime);
    const cached: MobilitySnapshot = { version: 1, updatedAt: now, feeds: [idle], overview };
    expect(querySnapshot(cached, query, 8, now).providers).toEqual({ dott: 2 });
    expect(querySnapshot(cached, query, 8, now).meta.sources.france).toBe('fresh');
    expect(overviewNeedsRefresh(cached, [idle], now + 60_000, onTime)).toBe(false);
  });
});

describe('a map across the 180° line', () => {
  // A view of New Zealand at zoom 6 centred on 181.4°E, as the map asks for it: west greater than east.
  const pastTheLine = { south: -47.06, west: 159.9, north: -25.98, east: -157.1 };
  const tauranga = { south: -37.75, west: 176.05, north: -37.62, east: 176.37 };
  const scooter = (id: string, lng: number): Vehicle => ({
    vehicle_id: id, lat: -37.69, lng, provider: 'flamingo', battery: 70, range_m: null, distance_m: null, deep_link: null,
  });
  const nz = feed({ id: 'newzealand:flamingo_nz_tauranga', source: 'newzealand', provider: 'flamingo', coverage: [tauranga],
    vehicles: [scooter('a', 176.16), scooter('b', 176.2)] });

  it('answers with the scooters west of the line', () => {
    const response = querySnapshot(snapshot([nz, feed()]), { bounds: pastTheLine, minBattery: 0 }, 16, now);
    expect(response.vehicles.map(item => item.vehicle_id)).toEqual(['a', 'b']);
    expect(response.meta.availableProviders).toContain('flamingo');
    expect(response.meta.availableProviders).not.toContain('dott');
    expect(feedsForQuery(snapshot([nz, feed()]), { bounds: pastTheLine, minBattery: 0 }, 16).map(item => item.id))
      .toEqual(['newzealand:flamingo_nz_tauranga']);
  });

  it('answers with the town totals west of the line', () => {
    const response = querySnapshot(snapshot([nz]), { bounds: pastTheLine, minBattery: 0 }, 6, now);
    expect(response.clusters.map(cluster => [cluster.id, cluster.count])).toEqual([['city:nz:bop:Tauranga', 2]]);
    expect(response.meta.totalVehicles).toBe(2);
  });

  it('leaves out a view east of the line alone', () => {
    const east = { south: -47.06, west: -179.9, north: -25.98, east: -157.1 };
    expect(querySnapshot(snapshot([nz]), { bounds: east, minBattery: 0 }, 16, now).vehicles).toEqual([]);
    expect(querySnapshot(snapshot([nz]), { bounds: east, minBattery: 0 }, 6, now).clusters).toEqual([]);
  });
});
