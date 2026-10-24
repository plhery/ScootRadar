import { expect, it } from 'vitest';
import { limeAppCatalogs, limeAuditFingerprint } from './lime-app-catalog.mjs';
import { decodeLimeArea, limeAreaTiles, LIME_TILE_GROUP_SIZE } from '../server/limeAreas';

it('partitions the complete service grid into bounded groups and preserves public feeds and their provenance', () => {
  const publicFeed = { id: 'public', provider: 'lime', city: 'Public city', discoveryUrl: 'https://example.com/gbfs.json' };
  const previous = { verifiedOn: '2026-10-25', catalogSource: 'https://example.com/catalog', serviceAreaSources: ['https://example.com/public-geofence'], systems: [publicFeed,
    { id: 'old-app-group', limeAppMap: true }] };
  const market = { country: 'RO', city: 'Deva', center: [.015, .015], timeZone: 'Europe/Bucharest', regionToken: 'region',
    serviceAreas: [{ polygon: '???ozDozD??nzDnzD?' }], sourceDocuments: ['https://assets.lime.bike/zones_attributes/example.json'] };
  const result = limeAppCatalogs({ verifiedOn: '2026-10-24', markets: [market] },
    [{ code: 'RO', catalog: 'ro.json' }], () => previous, { decodeLimeArea, limeAreaTiles, LIME_TILE_GROUP_SIZE }).get('ro.json');
  expect(result.catalogSource).toBe(previous.catalogSource);
  expect(result.serviceAreaSources).toEqual(previous.serviceAreaSources);
  expect(result.verifiedOn).toBe('2026-10-25');
  expect(result.systems[0]).toBe(publicFeed);
  expect(result.systems.some(s => s.id === 'old-app-group')).toBe(false);
  const app = result.systems.filter(s => s.limeAppMap);
  expect(app.every(s => s.limeMapTiles.length <= 4 && s.limeMapTiles.length > 0)).toBe(true);
  const tiles = app.flatMap(s => s.limeMapTiles);
  const expected = limeAreaTiles([decodeLimeArea(market.serviceAreas[0].polygon)]);
  expect(tiles).toHaveLength(expected.length);
  expect(new Set(tiles.map(b => JSON.stringify(b))).size).toBe(expected.length);
});

it('keeps geometry audit evidence valid across label changes and invalidates it when a tile changes', () => {
  const market = { country: 'RO', city: 'Deva', regionToken: 'region', serviceAreas: [{ polygon: 'outline' }] };
  const systems = [{ limeMapTiles: [{ south: 0, north: 1, west: 0, east: 1 }] }];
  const fingerprint = limeAuditFingerprint('protocol', market, systems);
  expect(limeAuditFingerprint('protocol', { ...market, aliases: ['Déva'] }, systems)).toBe(fingerprint);
  expect(limeAuditFingerprint('protocol', market, [{ limeMapTiles: [] }])).not.toBe(fingerprint);
  expect(limeAuditFingerprint('changed-protocol', market, systems)).not.toBe(fingerprint);
});
