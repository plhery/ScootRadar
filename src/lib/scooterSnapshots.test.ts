import { describe, expect, it } from 'vitest';
import { skippedSources } from '@/lib/scooterSources';
import { buildCityOverview, collectsSlowly, demandedFeeds, feedsForQuery, joinCityOverviews, LIME_GROUPS_PER_REQUEST, RYDE_GROUPS_PER_REQUEST, OVERVIEW_RECOVERY_MS, overviewNeedsRefresh, querySnapshot, REACH_STEPS, VEHICLE_MAX_AGE_MS,
  type FeedSnapshot, type MobilitySnapshot } from './scooterSnapshots';
import { scooterResponseHeaders } from './scooterResponse';
import { scooterAnswerZoom } from './scooterQuery';
import { ScooterFeedsUnavailableError } from './scooterFeeds';
import { providersForViewport, mapRepresentationsMatch } from './mapCoverage';
import type { Vehicle } from './types';
import { providerHealth, providersDownNotice } from './dataHealth';
import { PARKING_MAX_AGE_MS } from './dataFreshness';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas } from './regionalScooterSystems';

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
    expect(overviewNeedsRefresh(initial, [healthy], now)).toBe(false);
    const later = now + OVERVIEW_RECOVERY_MS;
    expect(overviewNeedsRefresh(initial, [healthy], later)).toBe(true);
    const refreshed = { ...initial, feeds: [healthy], overview: buildCityOverview([healthy], later) };
    expect(querySnapshot(refreshed, { bounds: lyon, minBattery: 0 }, 8, later).meta.totalVehicles).toBe(2);
    expect(overviewNeedsRefresh(refreshed, [healthy], later + OVERVIEW_RECOVERY_MS)).toBe(false);
  });

  it('counts a feed discovered after the city totals were built', () => {
    // Discovery adds it as a failed placeholder before its first collection.
    const placeholder = { ...voi, vehicles: [], observedAt: 0, attemptedAt: 0, failed: true, stale: true };
    const discovered = now + 60_000, counted = discovered + OVERVIEW_RECOVERY_MS;
    let cached = persistCycle(snapshot([feed()]), [feed(), placeholder], discovered);
    cached = persistCycle(cached, [feed(), voi], counted - 1);
    expect(querySnapshot(cached, query, 8, counted - 1).providers).toEqual({ dott: 2 });
    cached = persistCycle(cached, [feed(), voi], counted);
    expect(querySnapshot(cached, query, 8, counted).providers).toEqual({ dott: 2, voi: 1 });
    expect(overviewNeedsRefresh(cached, [feed(), voi], counted + OVERVIEW_RECOVERY_MS)).toBe(false);
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

  describe('the range minimum', () => {
    // Bolt and Dott give both in Stuttgart, Lime and Voi a range alone in some towns, a battery alone in others.
    const ranged = feed({ vehicles: [
      { ...vehicle('far', 90), range_m: 12_400 },
      { ...vehicle('short', 80), range_m: 4_999 },
      // A battery and no range: 80% of Dott's full 18.7 km, 14,960 m.
      { ...vehicle('unknown', 80), range_m: null },
      { ...vehicle('flat', 20), range_m: 9_000 },
      { ...vehicle('unsaid', null), range_m: 30_000 },
      { ...vehicle('blank', null), range_m: null },
    ] });
    // Lime's full battery takes its scooters 11.5 km at the least: 53% goes 6,095 m, 52% 5,980.
    const limes = feed({ id: 'france:lime_lyon', provider: 'lime', vehicles: [
      { ...vehicle('lime53', 53), provider: 'lime' }, { ...vehicle('lime52', 52), provider: 'lime' },
    ] });
    // Voi's give a range alone.
    const vois = feed({ id: 'france:voi_lyon', provider: 'voi', vehicles: [{ ...vehicle('voi', null), provider: 'voi', range_m: 20_000 }] });
    const ids = (response: { vehicles: Vehicle[] }) => response.vehicles.map(item => item.vehicle_id).sort();
    // As saved before the reaches were counted.
    const withoutRanges = (overview: MobilitySnapshot['overview']): MobilitySnapshot['overview'] => ({ ...overview,
      cities: overview.cities.map(city => {
        const saved = { ...city };
        delete saved.reaches;
        delete saved.batteryOnly;
        return saved;
      }) });
    // The bin of the city totals counting from a step of the sliders, in metres.
    const step = (metres: number) => REACH_STEPS.indexOf(metres);

    it('leaves out at street zoom the scooters that may not go that far, judging those without a range by their battery', () => {
      const cached = snapshot([ranged, limes]);
      expect(ids(querySnapshot(cached, { ...query, minRange: 6_000 }, 16, now))).toEqual(['far', 'flat', 'lime53', 'unknown', 'unsaid']);
      expect(ids(querySnapshot(cached, { ...query, minRange: 12_400 }, 16, now))).toEqual(['far', 'unknown', 'unsaid']);
      expect(ids(querySnapshot(cached, { ...query, minRange: 15_000 }, 16, now))).toEqual(['unsaid']);
      // One that says neither is left out at 1 km already.
      expect(ids(querySnapshot(cached, { ...query, minRange: 1_000 }, 16, now))).not.toContain('blank');
      expect(ids(querySnapshot(cached, { ...query, minRange: 0 }, 16, now))).toHaveLength(8);
    });

    it('still judges the older apps’ battery minimum by the battery alone, and both together by both', () => {
      const cached = snapshot([ranged, limes]);
      expect(ids(querySnapshot(cached, { ...query, minBattery: 50 }, 16, now))).toEqual(['far', 'lime52', 'lime53', 'short', 'unknown']);
      expect(ids(querySnapshot(cached, { ...query, minBattery: 50, minRange: 6_000 }, 16, now))).toEqual(['far', 'lime53', 'unknown']);
      const count = (minBattery: number) => querySnapshot(cached, { ...query, minBattery }, 8, now).clusters[0]?.count ?? 0;
      expect(count(50)).toBe(5);
      expect(count(91)).toBe(0);
    });

    it('counts in the city totals each scooter’s range, or else its battery times its app’s full range, by step of the sliders', () => {
      const cached = snapshot([ranged, limes]);
      const lyonTotals = cached.overview.cities.find(city => city.city === 'Lyon')!;
      // Whole kilometres to 100 and whole miles to 20, and one bin for neither.
      expect(lyonTotals.reaches?.dott).toHaveLength(122);
      // 4,999 m from 3 mi, 4,828 m; 12,400 m from 12 km; 14,960 m from 9 mi, 14,484 m.
      expect(lyonTotals.reaches?.dott[step(4_828)]).toBe(1);
      expect(lyonTotals.reaches?.dott[step(12_000)]).toBe(1);
      expect(lyonTotals.reaches?.dott[step(14_484)]).toBe(1);
      expect(lyonTotals.reaches?.dott[121]).toBe(1);
      expect(lyonTotals.reaches?.lime[step(6_000)]).toBe(1);
      expect(lyonTotals.reaches?.lime[step(5_000)]).toBe(1);
      expect(lyonTotals.batteryOnly?.sort()).toEqual(['dott', 'lime']);
      const count = (minRange: number, minBattery = 0) =>
        querySnapshot(cached, { ...query, minBattery, minRange }, 8, now).clusters[0]?.count ?? 0;
      expect(count(0)).toBe(8);
      // As at street zoom: the Lime at 53% and not the one at 52%.
      expect(count(6_000)).toBe(5);
      expect(querySnapshot(cached, { ...query, minRange: 6_000 }, 8, now).clusters[0].providers).toEqual({ dott: 4, lime: 1 });
      expect(count(5_000)).toBe(6);
      expect(count(15_000)).toBe(1);
      // 3 miles, 4,828 m: the 4,999 m scooter too, as at street zoom.
      expect(count(4_828)).toBe(7);
      expect(ids(querySnapshot(cached, { ...query, minRange: 4_828 }, 16, now))).toEqual(['far', 'flat', 'lime52', 'lime53', 'short', 'unknown', 'unsaid']);
      expect(count(100_000)).toBe(0);
      // Both: no more than either lets through.
      expect(count(13_000, 50)).toBe(2);
    });

    it('counts in the city totals what passes at street zoom and in groups, at every step of the sliders and up to 100 km', () => {
      // At each step, a scooter whose range reaches it to the metre and one a metre short; and battery-only Limes
      // and Vois at every battery, 11.5 km and 72.8 km on a full one: Lime 42% goes 4,830 m, 3 mi, and 41% not.
      const steps = [...Array.from({ length: 30 }, (_, km) => (km + 1) * 1000),
        ...Array.from({ length: 20 }, (_, mi) => Math.round((mi + 1) * 1609.344)), 50_000, 99_000, 100_000];
      const everyOne = snapshot([feed({ vehicles: [
        ...steps.flatMap(metres => [{ ...vehicle(`at ${metres}`), range_m: metres }, { ...vehicle(`short of ${metres}`), range_m: metres - 1 }]),
        { ...vehicle('far beyond'), range_m: 150_000 },
      ] }), feed({ id: 'france:lime_lyon', provider: 'lime',
        vehicles: Array.from({ length: 101 }, (_, battery) => ({ ...vehicle(`lime ${battery}`, battery), provider: 'lime' })) }),
      feed({ id: 'france:voi_lyon', provider: 'voi',
        vehicles: Array.from({ length: 101 }, (_, battery) => ({ ...vehicle(`voi ${battery}`, battery), provider: 'voi' })) })]);
      const passing = (minRange: number, zoom: number) => {
        const answer = querySnapshot(everyOne, { ...query, minRange }, zoom, now);
        return answer.vehicles.length + answer.clusters.reduce((sum, cluster) => sum + cluster.count, 0);
      };
      for (const minRange of [...new Set(steps)]) {
        const street = passing(minRange, 16);
        expect([passing(minRange, 13), passing(minRange, 8)], `${minRange} m`).toEqual([street, street]);
      }
      // The review's cases: Voi 45% at 20 mi and not 44%, Lime 42% at 3 mi and not 41%, a range of 12.9 km at 8 mi.
      const counted = (minRange: number) => querySnapshot(everyOne, { ...query, minRange }, 8, now).clusters[0].providers;
      expect(counted(32_187)).toMatchObject({ voi: 101 - 45 });
      expect(counted(4_828)).toMatchObject({ lime: 101 - 42 });
      expect(querySnapshot(snapshot([feed({ vehicles: [{ ...vehicle('12.9 km'), range_m: 12_900 }] })]), { ...query, minRange: 12_875 }, 8, now)
        .clusters[0].count).toBe(1);
      // 100 km, the API's furthest, counts what goes 100 km or more.
      expect(counted(100_000)).toEqual({ dott: 2 });
    });

    it('gives the full range of each app with a scooter in view that says its battery and not its range, whatever the filters', () => {
      const cached = snapshot([ranged, limes, vois]);
      for (const zoom of [16, 14, 8]) {
        expect(querySnapshot(cached, query, zoom, now).batteryRanges, `zoom ${zoom}`).toEqual({ dott: 18_700, lime: 11_500 });
        // With Voi alone switched on and a minimum that shows nothing, Dott's and Lime's too: the filters' line follows either switched on again.
        const filtered = querySnapshot(cached, { ...query, providers: new Set(['voi']), minRange: 30_000 }, zoom, now);
        expect(filtered.batteryRanges, `zoom ${zoom}`).toEqual({ dott: 18_700, lime: 11_500 });
      }
      // None outside the view, and none where every scooter says its range.
      const elsewhere = { south: 45.76, west: 4.86, north: 45.8, east: 4.9 };
      expect(querySnapshot(cached, { ...query, bounds: elsewhere }, 16, now)).not.toHaveProperty('batteryRanges');
      expect(querySnapshot(snapshot([vois]), query, 16, now)).not.toHaveProperty('batteryRanges');
      expect(querySnapshot(snapshot([vois]), query, 8, now)).not.toHaveProperty('batteryRanges');
    });

    it('builds again totals saved before the reaches were counted, and answers no range minimum from them meanwhile', () => {
      const built = snapshot([ranged]);
      const saved: MobilitySnapshot = { ...built, overview: withoutRanges(built.overview) };
      expect(overviewNeedsRefresh(built, built.feeds, now + 60_000)).toBe(false);
      expect(overviewNeedsRefresh(saved, saved.feeds, now + 60_000)).toBe(true);
      // Those of the first range minimum counted the ranges alone; those of the second by whole kilometres,
      // which would read 3 mi from 5 km.
      const first: MobilitySnapshot = { ...built, overview: { ...withoutRanges(built.overview),
        cities: withoutRanges(built.overview).cities.map(city => ({ ...city, ranges: {} })) } };
      expect(overviewNeedsRefresh(first, first.feeds, now + 60_000)).toBe(true);
      const byKilometre: MobilitySnapshot = { ...built, overview: { ...built.overview,
        cities: withoutRanges(built.overview).cities.map(city => ({ ...city, effectiveRanges: { dott: Array<number>(102).fill(0) }, batteryOnly: [] })) } };
      expect(overviewNeedsRefresh(byKilometre, byKilometre.feeds, now + 60_000)).toBe(true);
      expect(() => querySnapshot(byKilometre, { ...query, minRange: 4_828 }, 8, now)).toThrow(ScooterFeedsUnavailableError);
      expect(() => querySnapshot(saved, { ...query, minRange: 5_000 }, 8, now)).toThrow(ScooterFeedsUnavailableError);
      // What they hold still answers the rest.
      expect(querySnapshot(saved, query, 8, now).clusters[0].count).toBe(6);
      expect(querySnapshot(saved, { ...query, minBattery: 50 }, 8, now).clusters[0].count).toBe(3);
      expect(ids(querySnapshot(saved, { ...query, minRange: 5_000 }, 16, now))).toEqual(['far', 'flat', 'unknown', 'unsaid']);
    });

    it('joins the reaches of two sets of feeds as their batteries, and has none where either has none', () => {
      const joined = joinCityOverviews(buildCityOverview([ranged], now), buildCityOverview([vois, limes, feed({ id: 'more',
        vehicles: [{ ...vehicle('again'), range_m: 12_600 }] })], now));
      const lyonTotals = joined.cities.find(city => city.city === 'Lyon')!;
      expect(lyonTotals.reaches?.dott[step(12_000)]).toBe(2);
      expect(lyonTotals.reaches?.voi[step(20_000)]).toBe(1);
      expect(lyonTotals.reaches?.lime[step(6_000)]).toBe(1);
      expect(lyonTotals.batteryOnly?.sort()).toEqual(['dott', 'lime']);
      const unranged = withoutRanges(buildCityOverview([vois], now));
      expect(joinCityOverviews(buildCityOverview([ranged], now), unranged).cities.some(city => city.reaches || city.batteryOnly)).toBe(false);
    });
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

  describe('a feed slow to collect being collected again', () => {
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
      // Not while nothing collects it, nor once older than three hours, unless the cache keeps it longer.
      expect(querySnapshot(snapshot([old, voi]), query, 16, now).lastSeen).toBeUndefined();
      const older = lime({ observedAt: now - minutes(181) });
      expect(querySnapshot(snapshot([older, voi]), query, 16, now, refreshing(older)).lastSeen).toBeUndefined();
      const days = lime({ observedAt: now - 50 * minutes(60) });
      expect(querySnapshot(snapshot([days, voi]), query, 16, now, { ...refreshing(days),
        lastSeenMaxAgeMs: () => 72 * minutes(60) + minutes(10) }).meta.lastSeenAt).toBe(new Date(days.observedAt).toISOString());
    });

    it('is slow by how long its collections take, whatever its source', () => {
      expect(collectsSlowly(lime())).toBe(true);
      expect(collectsSlowly(feed())).toBe(false);
      // A GBFS feed timed at 20 seconds stands faded; an app map timed at 800 ms is waited for instead.
      const slowFeed = feed({ observedAt: now - minutes(40), collectionMs: 20_000 });
      expect(querySnapshot(snapshot([slowFeed, voi]), query, 16, now, refreshing(slowFeed)).lastSeen?.vehicles).toHaveLength(2);
      const quick = lime({ collectionMs: 800 });
      const response = querySnapshot(snapshot([quick, voi]), query, 16, now, refreshing(quick));
      expect(response.lastSeen).toBeUndefined();
      expect(response.meta.lastSeenAt).toBeUndefined();
    });

    it('asks to be polled again soon, and at once while a quick feed is on its way', () => {
      const old = lime();
      expect(querySnapshot(snapshot([old, voi]), query, 16, now, refreshing(old)).meta)
        .toMatchObject({ refreshing: true, refreshAfterSeconds: 3, followUpMs: 3_000 });
      const cold = feed({ observedAt: now - minutes(40) });
      expect(querySnapshot(snapshot([old, cold]), query, 16, now, { refreshing: new Set([old.id, cold.id]),
        comingSoon: new Set([cold.id]) }).meta.followUpMs).toBe(0);
      expect(querySnapshot(snapshot([old, voi]), query, 16, now).meta.followUpMs).toBeUndefined();
    });

    it('is not said to be on its way while its positions still show, as its sweep shows nothing until it ends', () => {
      // Watched, it is collected again every minute: a map left open would otherwise ask every 3 seconds.
      const shown = lime({ observedAt: now - minutes(2) });
      const response = querySnapshot(snapshot([shown, voi]), query, 16, now, refreshing(shown));
      expect(response.meta.refreshing).toBeUndefined();
      expect(response.meta.followUpMs).toBeUndefined();
      expect(response.meta.refreshAfterSeconds).toBe(60);
      expect(response.vehicles.map(item => item.vehicle_id).sort()).toEqual(['north', 'south', 'three']);
      expect(scooterResponseHeaders(response)['Cache-Control']).not.toBe('no-store');
      // A quick feed collected again is still asked for soon: it is in within seconds.
      const quick = feed({ observedAt: now - minutes(2) });
      expect(querySnapshot(snapshot([quick, voi]), query, 16, now, refreshing(quick)).meta)
        .toMatchObject({ refreshing: true, followUpMs: 3_000 });
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

  describe('a feed read over many minutes, as a Bird area\'s sweep', () => {
    const austin = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'bird_us_app_austin')!;
    const [lat, lng] = austin.center;
    const scooter = (n: number): Vehicle => ({ provider: 'bird', vehicle_id: `bird:${n}`, lat: lat + n * 1e-4, lng, battery: 80,
      range_m: 20_000, deep_link: null, distance_m: null });
    const view = { bounds: { south: lat - 0.01, west: lng - 0.01, north: lat + 0.01, east: lng + 0.01 }, minBattery: 0 };
    const at = (time: number) => new Date(time).toISOString();
    // A sweep of 22 and a half minutes, just ended: its first scooter read at its start, the others 10 and 1 minutes ago.
    const swept = feed({ id: `${regionalSource(austin)}:${austin.id}`, source: regionalSource(austin), provider: 'bird',
      coverage: serviceAreas(austin).map(area => area.bounds), observedAt: now - minutes(22.5), collectionMs: minutes(22.5),
      vehicles: [scooter(1), scooter(2), scooter(3), scooter(4)],
      reads: { lastAt: now - 30_000, at: { 'bird:2': now - minutes(10), 'bird:3': now - minutes(1), 'bird:4': now - minutes(16) } } });
    const ids = (vehicles: Vehicle[] | undefined) => vehicles?.map(item => item.vehicle_id).sort();

    it('shows live the scooters it read in the last 15 minutes, those it read before faded, with the oldest live one\'s time', () => {
      const answer = querySnapshot(snapshot([swept]), view, 16, now, { refreshing: new Set([swept.id]) });
      expect(ids(answer.vehicles)).toEqual(['bird:2', 'bird:3']);
      // The scooter it names no time for was read at its start.
      expect(ids(answer.lastSeen?.vehicles)).toEqual(['bird:1', 'bird:4']);
      expect(answer.meta).toMatchObject({ generatedAt: at(now - minutes(10)), expiresAt: at(now + minutes(5)),
        shownSince: { bird: at(now - minutes(10)) }, lastSeenAt: at(now - minutes(22.5)), stale: false });
      expect(answer.meta.refreshing).toBeUndefined();
      // Its first scooters stand faded whatever collects it: a scooter a walk heads for does not leave the map as its part grows old.
      expect(ids(querySnapshot(snapshot([swept]), view, 16, now).lastSeen?.vehicles)).toEqual(['bird:1', 'bird:4']);
      // Six minutes on, the one read 10 minutes ago is too old as well, and the answer's time is the last one's.
      const later = querySnapshot(snapshot([swept]), view, 16, now + minutes(6));
      expect(ids(later.vehicles)).toEqual(['bird:3']);
      expect(ids(later.lastSeen?.vehicles)).toEqual(['bird:1', 'bird:2', 'bird:4']);
      expect(later.meta.generatedAt).toBe(at(now - minutes(1)));
      // Once its last part is too old, it is a feed whose positions are too old: faded while collected again, else not shown.
      const old = now + minutes(15);
      expect(querySnapshot(snapshot([swept]), view, 16, old, { refreshing: new Set([swept.id]) }).vehicles).toEqual([]);
      expect(ids(querySnapshot(snapshot([swept]), view, 16, old, { refreshing: new Set([swept.id]) }).lastSeen?.vehicles))
        .toEqual(['bird:1', 'bird:2', 'bird:3', 'bird:4']);
      expect(querySnapshot(snapshot([swept]), view, 16, old, { refreshing: new Set([swept.id]) }).meta.lastSeenAt)
        .toBe(at(now - minutes(22.5)));
    });

    it('showed none of them live once it was over 15 minutes old, as old as its start, until 10 November 2026', () => {
      // The same sweep without its reads: as every feed whose positions are too old.
      const whole = { ...swept, reads: undefined };
      const answer = querySnapshot(snapshot([whole]), view, 16, now, { refreshing: new Set([swept.id]) });
      expect(answer.vehicles).toEqual([]);
      expect(answer.lastSeen?.vehicles).toHaveLength(4);
    });
  });

  it('keeps a wide Ryde view from queuing a whole city ahead of the street being watched',()=>{
    const augsburg={south:48.3119,north:48.4049,west:10.8358,east:10.9538};
    const groups=REGIONAL_SCOOTER_SYSTEMS.filter(s=>s.id.startsWith('ryde_app_de_augsburg_')).map(system=>
      feed({id:`${regionalSource(system)}:${system.id}`,source:'germany',provider:'ryde',
        coverage:serviceAreas(system).map(area=>area.bounds),observedAt:now-minutes(40)}));
    const dott=feed({id:'germany:dott_de_augsburg',source:'germany',coverage:[augsburg]});
    expect(groups.length).toBeGreaterThan(20);
    const asked=demandedFeeds([dott,...groups],augsburg);
    expect(asked).toHaveLength(RYDE_GROUPS_PER_REQUEST+1);
    expect(asked).toContain(dott);
    expect(asked).not.toContain(groups[0]);
    const street={south:48.364,north:48.369,west:10.89,east:10.90};
    const near=demandedFeeds(groups,street);
    expect(near).toHaveLength(RYDE_GROUPS_PER_REQUEST);
    expect(near.some(g=>g.coverage.some(b=>b.south<=48.3665&&b.north>=48.3665&&b.west<=10.8944&&b.east>=10.8944))).toBe(true);
    expect(demandedFeeds(near,street)).toEqual(near);
    // The centre finishing must allow faded edges to refresh, without increasing the batch.
    const completed=new Set(asked.map(g=>g.id));
    const after=groups.map(g=>completed.has(g.id)?{...g,observedAt:now}:g);
    const next=demandedFeeds(after,augsburg,now);
    expect(next).toHaveLength(RYDE_GROUPS_PER_REQUEST);
    expect(next.every(g=>!completed.has(g.id))).toBe(true);
  });

  it('has a box as wide as a country collect again only the feeds around its middle, as far as a screen shows', () => {
    const town = (id: string, lat: number, lng: number, size = 0.05) => feed({ id: `france:dott_fr_${id}`,
      coverage: [{ south: lat - size, north: lat + size, west: lng - size, east: lng + size }] });
    const [lyon, saintEtienne, geneva, marseille, paris] = [town('lyon', 45.76, 4.84), town('saint_etienne', 45.43, 4.39),
      town('geneva', 46.2, 6.14), town('marseille', 43.3, 5.37), town('paris', 48.86, 2.35)];
    // About 16,000 pixels across at zoom 11, which is answered at that zoom: France and around it, Lyon in the middle.
    const country = { south: 42.5, north: 49, west: -0.7, east: 10.4 };
    expect(scooterAnswerZoom(11, country)).toBe(11);
    expect(demandedFeeds([lyon, saintEtienne, geneva, marseille, paris], country)).toEqual([lyon, saintEtienne]);
    // A 1920 by 1080 screen's view at zoom 11 has every feed in it collected, to its corners.
    const degrees = 360 / (256 * 2 ** 11);
    const [halfWidth, halfHeight] = [960 * degrees, 540 * degrees * Math.cos(45.75 * Math.PI / 180)];
    const desktop = { south: 45.75 - halfHeight, north: 45.75 + halfHeight, west: 4.85 - halfWidth, east: 4.85 + halfWidth };
    const corners = [town('north_east', desktop.north, desktop.east, 0.005), town('south_west', desktop.south, desktop.west, 0.005)];
    expect(demandedFeeds([lyon, ...corners], desktop)).toEqual([lyon, ...corners]);
  });

  it('uses the latest positive observation of a scooter without deleting unmentioned last-seen positions', () => {
    const old = feed({ id: 'france:ryde_app_test_000', provider: 'ryde', observedAt: now - minutes(40),
      collectionMs: 30_000, vehicles: [vehicle('moved'), vehicle('unmentioned')] });
    const extra = feed({ id: old.id + '_view', provider: 'ryde', stale: true,
      vehicles: [{ ...vehicle('moved'), lat: 45.76 }] });
    const answered = querySnapshot(snapshot([old]), query, 16, now,
      { idleInView: new Set([old.id]), observations: [extra] });
    expect(answered.vehicles.map(v => [v.vehicle_id, v.lat])).toEqual([['moved', 45.76]]);
    expect(answered.lastSeen?.vehicles.map(v => v.vehicle_id)).toEqual(['unmentioned']);
    // A confirmed move outside the view must not leave the same scooter at its old location.
    const outside = { ...extra, vehicles: [{ ...vehicle('moved'), lat: 46.2 }] };
    const gone = querySnapshot(snapshot([old]), query, 16, now,
      { idleInView: new Set([old.id]), observations: [outside] });
    expect(gone.vehicles).toEqual([]);
    expect(gone.lastSeen?.vehicles.map(v => v.vehicle_id)).toEqual(['unmentioned']);
    // A newer completed group beats an older focused read, even if appended later.
    const newer = { ...old, observedAt: now, vehicles: [{ ...vehicle('moved'), lat: 45.77 }] };
    expect(querySnapshot(snapshot([newer]), query, 16, now, { observations: [{ ...extra, observedAt: now - 1000 }] })
      .vehicles.map(v => v.lat)).toEqual([45.77]);
  });

  it('drops older positions a read listed its circle without, live or faded, and only those of its feeds', () => {
    const old = feed({ id: 'germany:ryde_app_test_000', provider: 'ryde', observedAt: now - minutes(40),
      collectionMs: 30_000, vehicles: [vehicle('moved'), { ...vehicle('gone'), lat: 45.751 }, { ...vehicle('far'), lat: 45.85 }] });
    const read = feed({ id: old.id + '_view', provider: 'ryde', stale: true, observedAt: now - 10_000,
      vehicles: [{ ...vehicle('moved'), lat: 45.752 }] });
    const circle = { feeds: new Set([old.id, read.id]), at: read.observedAt, lat: 45.75, lng: 4.85, radiusM: 1000 };
    const answered = querySnapshot(snapshot([old]), query, 16, now,
      { idleInView: new Set([old.id]), observations: [read], listedAreas: [circle] });
    expect(answered.vehicles.map(v => v.vehicle_id)).toEqual(['moved']);
    // Out of the circle a scooter was not looked for.
    expect(answered.lastSeen?.vehicles.map(v => v.vehicle_id)).toEqual(['far']);
    // A read speaks only for its own feeds, and not against positions seen after it.
    const other = { ...old, id: 'germany:ryde_public' };
    expect(querySnapshot(snapshot([other]), query, 16, now, { idleInView: new Set([other.id]), observations: [read],
      listedAreas: [circle] }).lastSeen?.vehicles.map(v => v.vehicle_id)).toEqual(['gone', 'far']);
    const live = { ...old, observedAt: now - 5_000 };
    expect(querySnapshot(snapshot([live]), query, 16, now, { observations: [read], listedAreas: [circle] })
      .vehicles.map(v => v.vehicle_id).sort()).toEqual(['far', 'gone', 'moved']);
    const stale = { ...live, observedAt: now - minutes(2) };
    expect(querySnapshot(snapshot([stale]), query, 16, now, { observations: [read], listedAreas: [circle] })
      .vehicles.map(v => v.vehicle_id).sort()).toEqual(['far', 'moved']);
  });

  it('says of each app among the faded ones when they were seen and whether new positions are on their way', () => {
    const ryde = feed({ id: 'germany:ryde_app_test_000', provider: 'ryde', observedAt: now - minutes(40),
      collectionMs: 30_000, vehicles: [{ ...vehicle('r1'), provider: 'ryde' }] });
    const lime = feed({ id: 'germany:lime_app_test', provider: 'lime', observedAt: now - minutes(90),
      collectionMs: 30_000, vehicles: [{ ...vehicle('l1'), provider: 'lime' }] });
    const waiting = feed({ id: ryde.id + '_view', provider: 'ryde', stale: true, observedAt: 0, attemptedAt: 0,
      vehicles: [], collectionMs: 30_000 });
    const idle = querySnapshot(snapshot([ryde, lime, voi]), query, 16, now, { idleInView: new Set([ryde.id, lime.id]) });
    expect(idle.lastSeen?.providers).toEqual({
      ryde: { seenAt: new Date(now - minutes(40)).toISOString(), updating: false },
      lime: { seenAt: new Date(now - minutes(90)).toISOString(), updating: false },
    });
    expect(idle.meta.refreshing).toBeUndefined();
    // Ryde's read of the view is on its way: its faded ones are updating, Lime's not.
    const reading = querySnapshot(snapshot([ryde, lime, voi]), query, 16, now, { idleInView: new Set([ryde.id, lime.id]),
      observations: [waiting], refreshing: new Set([waiting.id]) });
    expect(reading.lastSeen?.providers?.ryde.updating).toBe(true);
    expect(reading.lastSeen?.providers?.lime.updating).toBe(false);
    expect(reading.meta).toMatchObject({ refreshing: true, followUpMs: 3_000 });
    // A slow feed collected again for the request is updating its own.
    const collecting = querySnapshot(snapshot([lime, voi]), query, 16, now, { refreshing: new Set([lime.id]) });
    expect(collecting.lastSeen?.providers).toEqual({ lime: { seenAt: new Date(now - minutes(90)).toISOString(), updating: true } });
    // No faded ones, no word of them.
    expect(querySnapshot(snapshot([voi]), query, 16, now).lastSeen).toBeUndefined();
  });

  it('names each app whose positions shown make the answer stale, with when the oldest of them were seen', () => {
    // A read of the view 12 minutes old, as Ryde's, is stale; Dott's feed a minute old is not.
    const read = feed({ id: 'germany:ryde_app_test_000_view', provider: 'ryde', stale: true, observedAt: now - minutes(12),
      vehicles: [{ ...vehicle('r1'), provider: 'ryde' }], collectionMs: 30_000 });
    const dott = feed({ observedAt: now - minutes(1) });
    // Voi's collected again, quick to collect, with nothing to show yet: it makes the answer stale,
    // but has nothing shown to be late.
    const coming = { ...voi, observedAt: now - minutes(20), collectionMs: 500 };
    const answer = querySnapshot(snapshot([dott, coming]), query, 16, now, { observations: [read], refreshing: new Set([coming.id]) });
    expect(answer.meta.stale).toBe(true);
    expect(answer.meta.generatedAt).toBe(new Date(now - minutes(12)).toISOString());
    expect(answer.meta.staleProviders).toEqual({ ryde: new Date(now - minutes(12)).toISOString() });
    // A feed whose last collection failed while its positions still show is stale, its oldest time named.
    const failed = feed({ failed: true, observedAt: now - minutes(6) });
    expect(querySnapshot(snapshot([failed, voi]), query, 16, now).meta.staleProviders)
      .toEqual({ dott: new Date(now - minutes(6)).toISOString() });
    // Nothing stale, nothing named.
    expect(querySnapshot(snapshot([dott, voi]), query, 16, now).meta.staleProviders).toBeUndefined();
  });

  it('says of each app with positions shown when the oldest of them were seen, stale or not, as its own collections move it', () => {
    const at = (time: number) => new Date(time).toISOString();
    // Dott's feed is collected every minute; Voi's was last collected 6 minutes ago and is late.
    const dott = (collected: number) => feed({ observedAt: collected });
    const late = { ...voi, observedAt: now - minutes(6) };
    const first = querySnapshot(snapshot([dott(now - minutes(1)), late]), query, 16, now);
    expect(first.meta.stale).toBe(false);
    expect(first.meta.generatedAt).toBe(at(now - minutes(6)));
    expect(first.meta.shownSince).toEqual({ dott: at(now - minutes(1)), voi: at(now - minutes(6)) });
    // A minute later Dott's has been collected again and Voi's not: the answer's time stays with Voi's, and Dott's moves.
    const later = now + minutes(1);
    const second = querySnapshot(snapshot([dott(later - 20_000), late]), query, 16, later);
    expect(second.meta.generatedAt).toBe(first.meta.generatedAt);
    expect(second.meta.shownSince).toEqual({ dott: at(later - 20_000), voi: at(now - minutes(6)) });
    // Asked again before either is collected, neither moves.
    expect(querySnapshot(snapshot([dott(later - 20_000), late]), query, 16, later + 30_000).meta.shownSince).toEqual(second.meta.shownSince);
    // Stale, as when Voi's last collection failed: the same times, and Voi's among the stale ones.
    const failing = querySnapshot(snapshot([dott(later - 20_000), { ...late, failed: true }]), query, 16, later);
    expect(failing.meta.shownSince).toEqual(second.meta.shownSince);
    expect(failing.meta.staleProviders).toEqual({ voi: at(now - minutes(6)) });
    // An app with only faded scooters, its slow feed collected again for the request, is not among them.
    const lime = feed({ id: 'germany:lime_app_test', provider: 'lime', observedAt: now - minutes(40), collectionMs: 30_000,
      vehicles: [{ ...vehicle('l1'), provider: 'lime' }] });
    const faded = querySnapshot(snapshot([dott(now - minutes(1)), lime]), query, 16, now, { refreshing: new Set([lime.id]) });
    expect(faded.lastSeen?.vehicles).toHaveLength(1);
    expect(faded.meta.shownSince).toEqual({ dott: at(now - minutes(1)) });
  });

  describe('Lime\'s groups in a wide view', () => {
    const berlin = { south: 52.34, west: 13.0, north: 52.68, east: 13.76 };
    const wide = { bounds: berlin, minBattery: 0 };
    const groups = REGIONAL_SCOOTER_SYSTEMS.filter(system => system.id.startsWith('lime_de_app_berlin_')).map(system => {
      const coverage = serviceAreas(system).map(area => area.bounds);
      return feed({ id: `${regionalSource(system)}:${system.id}`, source: 'germany', provider: 'lime', coverage,
        vehicles: [{ ...vehicle(system.id), provider: 'lime', lat: (coverage[0].south + coverage[0].north) / 2,
          lng: (coverage[0].west + coverage[0].east) / 2 }], observedAt: now - minutes(40) });
    });
    const holds = (item: FeedSnapshot, [lat, lng]: [number, number]) => item.coverage.some(area =>
      area.south <= lat && lat <= area.north && area.west <= lng && lng <= area.east);

    it('has a request collect again only the few nearest the middle of the view', () => {
      const dott = feed({ id: 'germany:dott_de_berlin', source: 'germany', coverage: [berlin] });
      const demanded = demandedFeeds([dott, ...groups], berlin);
      expect(groups.length).toBeGreaterThan(100);
      expect(demanded).toHaveLength(LIME_GROUPS_PER_REQUEST + 1);
      expect(demanded[0]).toBe(dott);
      expect(demanded.some(item => holds(item, [52.51, 13.38]))).toBe(true);
      expect(demanded).not.toContain(groups[0]);
      // A street view meets fewer, and has them all.
      const street = groups.filter(item => holds(item, [52.51, 13.38]) || holds(item, [52.52, 13.39]));
      expect(demandedFeeds(street, berlin)).toEqual(street);
    });

    it('shows the others where their scooters were last seen, neither served nor failed', () => {
      const [near, far] = [{ ...groups[60], observedAt: now - 30_000 }, groups[0]];
      const response = querySnapshot(snapshot([near, far]), wide, 16, now, { idleInView: new Set([far.id]) });
      expect(response.vehicles.map(item => item.vehicle_id)).toEqual([near.vehicles[0].vehicle_id]);
      expect(response.lastSeen?.vehicles.map(item => item.vehicle_id)).toEqual([far.vehicles[0].vehicle_id]);
      expect(response.meta).toMatchObject({ failedSources: [], partial: false, lastSeenAt: new Date(now - minutes(40)).toISOString() });
      expect(response.meta.refreshing).toBeUndefined();
      expect(response.meta.sources.germany).toBe('fresh');
      // Whatever its pace: nothing collects it for this request.
      const quick = { ...far, collectionMs: 800 };
      expect(querySnapshot(snapshot([near, quick]), wide, 16, now, { idleInView: new Set([far.id]) }).lastSeen?.vehicles).toHaveLength(1);
      // Asked for, and not collected, it would have failed.
      expect(querySnapshot(snapshot([near, far]), wide, 16, now).meta.failedSources).toEqual([far.id]);
      // Its positions recent enough to show count as any feed's.
      const recent = { ...far, observedAt: now - minutes(5) };
      expect(querySnapshot(snapshot([near, recent]), wide, 16, now, { idleInView: new Set([far.id]) }).vehicles).toHaveLength(2);
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

  it('leaves out of the city totals the scooters of a feed in its seasonal pause, unless the map shows them', () => {
    // Red Deer's Lime groups, paused from 1 November 2026: on its morning of 2 November, the cache
    // still took as on time a group swept on 31 October, as it does for three days (limeAreas.ts).
    const system = REGIONAL_SCOOTER_SYSTEMS.find(item => item.id === 'lime_ca_app_red_deer_000')!;
    const [south, west] = [52.23, -113.83];
    const at = Date.parse('2026-11-02T13:00:00Z');
    const swept = Date.parse('2026-10-31T18:12:17Z');
    const group = feed({ id: `${regionalSource(system)}:${system.id}`, source: 'canada', provider: 'lime',
      coverage: serviceAreas(system).map(area => area.bounds), observedAt: swept, attemptedAt: swept, collectedAt: swept,
      vehicles: [{ ...vehicle('rd-1'), lat: south, lng: west, provider: 'lime' }, { ...vehicle('rd-2'), lat: south, lng: west, provider: 'lime' }] });
    const onTime = () => true;
    const redDeer = (feeds: FeedSnapshot[], time: number) => buildCityOverview(feeds, time, onTime).cities.find(city => city.id === 'ca:ab:Red Deer')!;
    const paused = redDeer([group], at);
    expect(paused.batteries).toEqual({});
    // Quiet, as a town's paused feed is up close: neither failed nor stale.
    expect([paused.sources.canada, paused.failedSources]).toEqual(['skipped', []]);
    // Swept the evening before the pause, they counted then.
    expect(Object.values(redDeer([group], swept + minutes(60)).batteries.lime ?? []).reduce((a, b) => a + b, 0)).toBe(2);
    // Brought back early, scooters the map shows count.
    const back = { ...group, observedAt: at - minutes(5), collectedAt: at - minutes(5) };
    expect(redDeer([back], at).batteries.lime?.reduce((a, b) => a + b, 0)).toBe(2);
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
