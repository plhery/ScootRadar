import { describe, expect, it } from 'vitest';
import { knownSystemCoverage } from './feedCoverage';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas } from './regionalScooterSystems';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
import { systemServesPoint } from './townOutlines';
import type { Vehicle } from './types';

// Positions the feeds published just after midnight on 14 October 2026, when
// the nearest centre alone counted 3,322 scooters under the wrong town.
const now = Date.parse('2026-10-13T22:00:00Z');
const scooter = (provider: string, lat: number, lng: number, index: number): Vehicle => ({
  vehicle_id: `${provider}-${index}`, lat, lng, provider, battery: 60, range_m: null, distance_m: null, deep_link: null,
});
const snapshotOf = (id: string, provider: string, coverage: FeedSnapshot['coverage'], source: FeedSnapshot['source'],
  points: Array<[number, number]>): FeedSnapshot => ({
  id, source, provider, coverage, vehicles: points.map(([lat, lng], index) => scooter(provider, lat, lng, index)),
  observedAt: now, attemptedAt: now, stale: false, failed: false, skipped: false,
});
// As the scooter cache collects a catalog system: its coverage is its service areas.
const regional = (systemId: string, points: Array<[number, number]>): FeedSnapshot => {
  const system = REGIONAL_SCOOTER_SYSTEMS.find(candidate => candidate.id === systemId)!;
  return snapshotOf(`${regionalSource(system)}:${system.id}`, system.provider, serviceAreas(system).map(area => area.bounds),
    regionalSource(system), points);
};
const national = (systemId: string, provider: string, points: Array<[number, number]>) => (
  snapshotOf(`national:${systemId}`, provider, knownSystemCoverage(systemId) ?? [], 'national', points));

/** Each town's scooters by provider, as the zoomed-out map shows them. */
function countsOf(feeds: FeedSnapshot[]): Record<string, Record<string, number>> {
  return Object.fromEntries(buildCityOverview(feeds, now).cities
    .filter(city => Object.keys(city.batteries).length)
    .map(city => [city.id, Object.fromEntries(Object.entries(city.batteries)
      .map(([provider, bins]) => [provider, bins.reduce((sum, count) => sum + count, 0)]))]));
}

describe('the town a scooter counts under', () => {
  it('is Oslo for scooters in east Oslo, nearer Lørenskog’s centre', () => {
    // Outside Lørenskog's bounds, where 1,128 of Ryde's and Bolt's scooters stood that night.
    expect(countsOf([
      regional('ryde_no_oslo', [[59.95117, 10.854831], [59.941025, 10.895807]]),
      regional('bolt_no_oslo', [[59.926944732666016, 10.867466926574707]]),
    ])).toEqual({ 'no:Oslo': { ryde: 2, bolt: 1 } });
  });

  it('is the town of the scooter’s own feed where two towns’ bounds hold it', () => {
    // In Carcavelos, inside both Cascais's and Oeiras's bounds and nearer Oeiras's centre,
    // where 293 of Bird Cascais's scooters stood on 15 October 2026.
    expect(countsOf([regional('bird_pt_cascais', [[38.685843, -9.350383]])])).toEqual({ 'pt:Cascais': { bird: 1 } });
  });

  it('is the town whose outline holds it, whichever feed it comes from', () => {
    // Inside Oslo's outline, and both Oslo's and Lørenskog's bounds: Voi Lillestrøm and Lørenskog's scooter is Oslo's too.
    const spot: [number, number] = [59.95868, 10.925698];
    expect(countsOf([regional('ryde_no_oslo', [spot]), regional('voi_no_lillestrom_lorenskog', [spot])]))
      .toEqual({ 'no:Oslo': { ryde: 1, voi: 1 } });
  });

  // Positions of 15 October 2026 that the towns' bounds gave to the second town, and their outlines give to the first.
  it.each([
    ['Roubaix, not Croix', 'lime_fr_lille', [50.68585, 3.15924], 'fr:Roubaix'],
    ['Wattrelos, not Tourcoing', 'lime_fr_lille', [50.71135, 3.17584], 'fr:Wattrelos'],
    ['Villeneuve-d’Ascq, not Wasquehal', 'lime_fr_lille', [50.65516, 3.15205], 'fr:Villeneuve-d\'Ascq'],
    ['Lille Métropole around Tourcoing, not Tourcoing', 'lime_fr_lille', [50.72189, 3.12931], 'fr:Lille Métropole'],
    ['Marly-le-Roi, not Le Port-Marly', 'lime_fr_paris_west', [48.87987, 2.10188], 'fr:Marly-le-Roi'],
    ['Houilles, not Sartrouville', 'lime_fr_paris_west', [48.92991, 2.17495], 'fr:Houilles'],
    ['La Celle-Saint-Cloud, not Bougival', 'dott_fr_versailles-grand-parc', [48.85917, 2.14785], 'fr:La Celle-Saint-Cloud'],
    ['Mantes-la-Jolie, not Buchelay', 'voi_fr_422', [48.99993, 1.68442], 'fr:Mantes-la-Jolie'],
    ['Sandnes, not Stavanger', 'voi_no_stavanger_sandnes', [58.88508, 5.69869], 'no:Sandnes'],
    ['Sandnes at Forus, not Stavanger, from Ryde’s Stavanger feed', 'ryde_no_stavanger', [58.8879, 5.7091], 'no:Sandnes'],
    ['Lillestrøm, not Lørenskog', 'voi_no_lillestrom_lorenskog', [59.96073, 10.97798], 'no:Lillestrøm'],
    ['Skien, not Porsgrunn', 'ryde_no_skien', [59.15197, 9.62459], 'no:Skien'],
    ['Bærum, not Oslo', 'voi_no_oslo', [59.9338, 10.62675], 'no:Bærum'],
    ['Bournemouth, not Christchurch', 'beryl_gb_bournemouth_christchurch_poole', [50.71876, -1.77878], 'gb:Bournemouth'],
    ['Poole, not Bournemouth', 'beryl_gb_bournemouth_christchurch_poole', [50.7299, -1.90585], 'gb:Poole'],
    ['Almada, not Costa da Caparica', 'lime_pt_almada', [38.67084, -9.23683], 'pt:Almada'],
    ['La Nucía, not L’Alfàs del Pi', 'hoppy_es_marina_baixa', [38.57631, -0.12035], 'es:La Nucía'],
    ['Kobyłka, not Wołomin', 'dott_pl_wolomin', [52.33258, 21.22527], 'pl:Kobyłka'],
    ['Los Angeles in Venice, not Santa Monica', 'veo_us_santa_monica', [34.02931, -118.44279], 'us:ca:Los Angeles'],
    ['Santa Monica, not Los Angeles, though Bird’s Los Angeles feed has it', 'bird_us_los_angeles', [34.02194, -118.44807], 'us:ca:Santa Monica'],
    ['College Park, not University Park', 'veo_us_college_park', [38.97843, -76.92885], 'us:md:College Park'],
    ['New Brunswick, not Highland Park', 'veo_us_new_brunswick', [40.48273, -74.42509], 'us:nj:New Brunswick'],
    ['Berkeley, not Emeryville', 'veo_us_berkeley', [37.8511, -122.29251], 'us:ca:Berkeley'],
    ['South Euclid, not University Heights', 'veo_us_cleveland', [41.50317, -81.53785], 'us:oh:South Euclid'],
    // Positions of 24 October 2026, inside both of Dott Liège's areas.
    ['Herstal, though nearer Liège’s centre', 'dott_be_liege', [50.665919, 5.568636], 'be:Herstal'],
    ['Liège in Wandre, though nearer Herstal’s centre', 'dott_be_liege', [50.66935, 5.652248], 'be:Liège'],
    // A position of 24 October 2026, in both of GCOO's Virginia feeds: Arlington's is read first.
    ['Alexandria, though GCOO’s Arlington feed has it', 'gcoo_us_arlington', [38.840523, -77.121596], 'us:va:Alexandria'],
    // A position of 29 October 2026, in GCOO's Alexandria feed and inside Arlington's outline.
    ['Arlington, from GCOO’s Alexandria feed', 'gcoo_us_alexandria', [38.856164, -77.064317], 'us:va:Arlington'],
  ] as const)('is %s', (_case, systemId, [lat, lng], town) => {
    const feed = regional(systemId, [[lat, lng]]);
    expect(countsOf([feed])).toEqual({ [town]: { [feed.provider]: 1 } });
  });

  it('is Zürich or Kloten by their outlines, not Opfikon between them', () => {
    expect(countsOf([national('bolt_zurich', 'bolt', [[47.41627, 8.55776]]), national('dott_zurich', 'dott', [[47.44487, 8.57939]])]))
      .toEqual({ 'ch:zurich': { bolt: 1 }, 'ch:kloten': { dott: 1 } });
  });

  it('is the Swiss area of an app map’s town, as Lime’s in Kloten, there nearer Opfikon’s centre', () => {
    const feed = regional('lime_ch_app_kloten_000', [[47.442, 8.572]]);
    expect(countsOf([feed, national('dott_zurich', 'dott', [[47.44487, 8.57939]])])).toEqual({ 'ch:kloten': { lime: 1, dott: 1 } });
    expect(buildCityOverview([feed], now).cities.find(city => city.id === 'ch:kloten')?.sources.switzerland).toBe('fresh');
  });

  it('is Lisbon for scooters in west Lisbon, nearer Almada’s centre across the river', () => {
    expect(countsOf([
      regional('lime_pt_lisboa', [[38.712425, -9.201434], [38.704111, -9.174261]]),
      regional('bird_pt_lisboa', [[38.70144483333333, -9.174908666666665], [38.713893883333334, -9.19763565]]),
    ])).toEqual({ 'pt:Lisboa': { lime: 2, bird: 2 } });
  });

  it.each([
    ['Stavanger, not Sandnes', 'voi_no_stavanger_sandnes', [58.903294, 5.698539], 'no:Stavanger'],
    ['Poissy, not Le Pecq', 'voi_fr_422', [48.925356, 2.04438], 'fr:Poissy'],
    ['Conflans-Sainte-Honorine, not Sartrouville', 'voi_fr_422', [49.002874, 2.119558], 'fr:Conflans-Sainte-Honorine'],
    ['Lille Métropole in Halluin, not Tourcoing', 'lime_fr_lille', [50.778681, 3.113715], 'fr:Lille Métropole'],
    ['Bristol, not Yate', 'dott_gb_bristol', [51.527599, -2.538522], 'gb:Bristol'],
    ['Stuttgart, not Ludwigsburg', 'voi_de_bw', [48.842752, 9.217511], 'de:Stuttgart'],
    ['Porto, not Matosinhos', 'bird_pt_porto', [41.14945216666667, -8.6759515], 'pt:Porto'],
    ['Oeiras, not Costa da Caparica', 'bird_pt_oeiras', [38.702788166666664, -9.2349365], 'pt:Oeiras'],
  ] as const)('is %s', (_case, systemId, [lat, lng], town) => {
    const feed = regional(systemId, [[lat, lng]]);
    expect(countsOf([feed])).toEqual({ [town]: { [feed.provider]: 1 } });
  });

  it('is the nearest Swiss town whose area holds it, whichever town its system is named after', () => {
    // Swiss areas are generous envelopes: Bolt Zürich's scooters in Glattbrugg stay Opfikon's,
    // and one in Wädenswil, outside Zürich's, is Wädenswil's.
    expect(countsOf([national('bolt_zurich', 'bolt', [[47.4306, 8.5653], [47.2231, 8.6746], [47.3769, 8.5417]])]))
      .toEqual({ 'ch:opfikon': { bolt: 1 }, 'ch:wadenswil': { bolt: 1 }, 'ch:zurich': { bolt: 1 } });
  });

  it('is the nearest town of all when no town’s bounds hold it', () => {
    // A Voi scooter in Lungern, outside every Swiss area.
    expect(countsOf([snapshotOf('national:voiscooters.com', 'voi', [], 'national', [[46.7741, 8.1558]])]))
      .toEqual({ 'ch:bern': { voi: 1 } });
  });
});

describe('the scooters a feed keeps', () => {
  const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(candidate => candidate.id === id)!;

  it('are those in its areas and in no outlined town where its operator has none', () => {
    // Bird's Los Angeles feed keeps its scooters in Santa Monica, a town of Bird's own Santa Monica feed,
    // Ryde Stavanger's those over the line in Sandnes, at Forus, where it has an area, and Bird Cleveland's
    // those in Cleveland Heights, where its zones let rides end.
    expect(systemServesPoint(system('bird_us_los_angeles'), 34.02194, -118.44807)).toBe(true);
    expect(systemServesPoint(system('ryde_no_stavanger'), 58.8879, 5.7091)).toBe(true);
    expect(systemServesPoint(system('bird_us_cleveland'), 41.50636, -81.58994)).toBe(true);
    // Positions of 15 October 2026 inside the feeds' boxes, in towns where their operator has no area.
    for (const [id, town, lat, lng] of [
      ['bolt_no_oslo', 'Lørenskog', 59.94426, 10.94555], ['bolt_no_oslo', 'Bærum', 59.90797, 10.63792],
      ['veo_us_santa_monica', 'Culver City', 33.99147, -118.44615],
      ['lime_us_oakland', 'Emeryville', 37.8285, -122.27838], ['veo_us_berkeley', 'Oakland', 37.84414, -122.28228],
    ] as const) {
      expect(serviceAreas(system(id)).some(area => area.bounds.south <= lat && lat <= area.bounds.north &&
        area.bounds.west <= lng && lng <= area.bounds.east), `${id} in ${town}`).toBe(true);
      expect(systemServesPoint(system(id), lat, lng), `${id} in ${town}`).toBe(false);
    }
  });
});
