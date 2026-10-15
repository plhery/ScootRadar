import { describe, expect, it } from 'vitest';
import { knownSystemCoverage } from './feedCoverage';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas } from './regionalScooterSystems';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
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
    // Inside both Oslo's and Lørenskog's bounds, and nearer Lørenskog's centre:
    // Ryde Oslo's scooter is Oslo's, Voi Lillestrøm and Lørenskog's is Lørenskog's.
    const spot: [number, number] = [59.95868, 10.925698];
    expect(countsOf([regional('ryde_no_oslo', [spot]), regional('voi_no_lillestrom_lorenskog', [spot])]))
      .toEqual({ 'no:Oslo': { ryde: 1 }, 'no:Lørenskog': { voi: 1 } });
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
