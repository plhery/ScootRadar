import { expect, it } from 'vitest';
import { limeAppCatalogs, limeAuditFingerprint } from './lime-app-catalog.mjs';
import { decodeLimeArea, limeAreaGrid, limeAreaTiles } from '../server/limeAreas';
import { boundsContainPoint } from '../src/lib/geo';
import { limeGridGroups } from '../src/lib/limeGrid';
import { serviceAreas } from '../src/lib/regionalScooterSystems';

it('partitions the complete service grid into bounded groups and preserves public feeds and their provenance', () => {
  const publicFeed = { id: 'public', provider: 'lime', city: 'Public city', discoveryUrl: 'https://example.com/gbfs.json' };
  const previous = { verifiedOn: '2026-10-25', catalogSource: 'https://example.com/catalog', serviceAreaSources: ['https://example.com/public-geofence'], systems: [publicFeed,
    { id: 'old-app-group', limeAppMap: true }] };
  const market = { country: 'RO', city: 'Deva', center: [.015, .015], timeZone: 'Europe/Bucharest', regionToken: 'region',
    serviceAreas: [{ polygon: '???ozDozD??nzDnzD?' }], sourceDocuments: ['https://assets.lime.bike/zones_attributes/example.json'] };
  const result = limeAppCatalogs({ verifiedOn: '2026-10-24', markets: [market] },
    [{ code: 'RO', catalog: 'ro.json' }], () => previous, { decodeLimeArea, limeAreaGrid }).get('ro.json');
  expect(result.catalogSource).toBe(previous.catalogSource);
  expect(result.serviceAreaSources).toEqual(previous.serviceAreaSources);
  expect(result.verifiedOn).toBe('2026-10-25');
  expect(result.systems[0]).toBe(publicFeed);
  expect(result.systems.some(s => s.id === 'old-app-group')).toBe(false);
  // The market is one entry, as compact as its grid; its refresh groups are made from it.
  expect(result.systems.filter(s => s.limeAppMap).map(s => s.id)).toEqual(['lime_ro_app_deva']);
  const app = result.systems.filter(s => s.limeAppMap).flatMap(limeGridGroups);
  expect(app.map(s => s.id)).toEqual(app.map((_, i) => `lime_ro_app_deva_${String(i).padStart(3, '0')}`));
  expect(app.every(s => s.limeMapTiles.length <= 4 && s.limeMapTiles.length > 0)).toBe(true);
  const tiles = app.flatMap(s => s.limeMapTiles);
  const expected = limeAreaTiles([decodeLimeArea(market.serviceAreas[0].polygon)]);
  expect(tiles).toHaveLength(expected.length);
  expect(new Set(tiles.map(b => JSON.stringify(b))).size).toBe(expected.length);
  // The first group wraps onto the next row. Its enclosing rectangle also
  // contains the next group's cells; a street view there must wake only its owner.
  expect(app.filter(s => boundsContainPoint(s.bounds, .02, .02))).toHaveLength(2);
  expect(app.filter(s => serviceAreas(s).some(area => boundsContainPoint(area.bounds, .02, .02)))).toHaveLength(1);
});

it('gives a market its region, for a town whose name other states share', () => {
  const market = { country: 'US', city: 'Newport', region: 'WA', center: [.015, .015], timeZone: 'America/Los_Angeles', regionToken: 'spokane',
    serviceAreas: [{ polygon: '???ozDozD??nzDnzD?' }], sourceDocuments: ['https://assets.lime.bike/zones_attributes/example.json'] };
  const result = limeAppCatalogs({ verifiedOn: '2026-10-25', markets: [market, { ...market, city: 'Spokane', region: undefined }] },
    [{ code: 'US', catalog: 'us.json' }], () => ({ systems: [] }), { decodeLimeArea, limeAreaGrid }).get('us.json');
  expect(result.systems.map(s => [s.city, s.region])).toEqual([['Newport', 'WA'], ['Spokane', undefined]]);
  expect('region' in result.systems[1]).toBe(false);
});

it('keeps geometry audit evidence valid across label changes and invalidates it when a tile changes', () => {
  const market = { country: 'RO', city: 'Deva', regionToken: 'region', serviceAreas: [{ polygon: 'outline' }] };
  const systems = [{ limeMapTiles: [{ south: 0, north: 1, west: 0, east: 1 }] }];
  const fingerprint = limeAuditFingerprint('protocol', market, systems);
  expect(limeAuditFingerprint('protocol', { ...market, aliases: ['Déva'] }, systems)).toBe(fingerprint);
  expect(limeAuditFingerprint('protocol', market, [{ limeMapTiles: [] }])).not.toBe(fingerprint);
  expect(limeAuditFingerprint('changed-protocol', market, systems)).not.toBe(fingerprint);
});

it('keeps the catalog grid when the same grid computed on another processor differs in its last bit', () => {
  const market = { country: 'RO', city: 'Deva', center: [.015, .015], timeZone: 'Europe/Bucharest', regionToken: 'region',
    serviceAreas: [{ polygon: '???ozDozD??nzDnzD?' }], sourceDocuments: ['https://assets.lime.bike/zones_attributes/example.json'] };
  const grid = limeAreaGrid([decodeLimeArea(market.serviceAreas[0].polygon)]);
  const step = new Float64Array([grid.lngStep]);
  new BigUint64Array(step.buffer)[0] += 1n;
  const generate = lngStep => limeAppCatalogs({ verifiedOn: '2026-10-25', markets: [market] }, [{ code: 'RO', catalog: 'ro.json' }],
    () => ({ systems: [{ id: 'lime_ro_app_deva', limeAppMap: true, limeMapGrid: { ...grid, lngStep } }] }), { decodeLimeArea, limeAreaGrid })
    .get('ro.json').systems[0].limeMapGrid.lngStep;
  expect(step[0]).not.toBe(grid.lngStep);
  expect(generate(step[0])).toBe(step[0]);
  expect(generate(grid.lngStep * 1.001)).toBe(grid.lngStep);
});
