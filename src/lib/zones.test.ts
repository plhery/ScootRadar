import { describe, expect, it } from 'vitest';
import { normalizeZones, nextZoneChange, simplifyRing, zoneQueryError, zonesInBounds, ZONES_MAX_POINTS, type ZonesFeed } from './zones';

const types = { data: { vehicle_types: [
  { vehicle_type_id: 'scooter', form_factor: 'scooter_standing', propulsion_type: 'electric' },
  { vehicle_type_id: 'bike', form_factor: 'bicycle', propulsion_type: 'electric_assist' },
] } };
// A square of about 110 m in Zürich, as GeoJSON gives it: [lng, lat].
const square = [[8.54, 47.37], [8.5415, 47.37], [8.5415, 47.371], [8.54, 47.371], [8.54, 47.37]];
const feed = (...rules: object[][]): ZonesFeed => ({ data: { geofencing_zones: { features: rules.map(zoneRules => ({
  geometry: { type: 'Polygon', coordinates: [square] }, properties: { rules: zoneRules },
})) } } });

describe('operator zones', () => {
  it('reads what a scooter may not do in a zone, in GBFS 2 and GBFS 3 terms', () => {
    const zones = normalizeZones('national:dott_zurich', 'dott', types, feed(
      [{ vehicle_type_id: ['scooter'], ride_allowed: false, ride_through_allowed: false }],
      [{ ride_allowed: false, ride_through_allowed: true }],
      [{ ride_start_allowed: true, ride_end_allowed: false, ride_through_allowed: true }],
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 10 }],
      // Bolt's way of saying no riding.
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 0 }],
      // The usual limit, and an area where all is allowed: nothing to draw.
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 20 }],
      [{ ride_allowed: true, ride_through_allowed: true }],
    ));
    expect(zones.map(zone => [zone.id, zone.kind, zone.maxSpeedKph])).toEqual([
      ['national:dott_zurich:0', 'noRide', undefined],
      ['national:dott_zurich:1', 'noParking', undefined],
      ['national:dott_zurich:2', 'noParking', undefined],
      ['national:dott_zurich:3', 'slow', 10],
      ['national:dott_zurich:4', 'noRide', undefined],
    ]);
    expect(zones[0].polygons).toEqual([[square.map(([lng, lat]) => [lat, lng])]]);
    expect(zones[0].bounds).toEqual({ south: 47.37, west: 8.54, north: 47.371, east: 8.5415 });
  });

  it('counts the UK\'s 10 mph zones and Norway\'s 18 km/h ones as slow, but not the 19 km/h Dott sets over a whole city', () => {
    const zones = normalizeZones('f', 'dott', types, feed(
      // Dott's and Bolt's ways of writing 10 mph.
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 16 }],
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 16.1 }],
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 18 }],
      [{ ride_allowed: true, ride_through_allowed: true, maximum_speed_kph: 19 }],
    ));
    expect(zones.map(zone => [zone.id, zone.kind, zone.maxSpeedKph])).toEqual([
      ['f:0', 'slow', 16],
      ['f:1', 'slow', 16.1],
      ['f:2', 'slow', 18],
    ]);
  });

  it('follows the first rule that names a scooter, and draws nothing for bikes or a feed without scooters', () => {
    const zones = normalizeZones('f', 'lime', types, feed(
      [{ vehicle_type_ids: ['bike'], ride_through_allowed: false }, { vehicle_type_ids: ['scooter'], ride_allowed: false, ride_through_allowed: true }],
      [{ vehicle_type_ids: ['bike'], ride_through_allowed: false }],
    ));
    expect(zones.map(zone => zone.kind)).toEqual(['noParking']);
    expect(normalizeZones('f', 'lime', { data: { vehicle_types: [types.data.vehicle_types[1]] } },
      feed([{ ride_through_allowed: false }]))).toEqual([]);
  });

  it('keeps a zone to its hours, and says when the next one starts or ends', () => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    const timed: ZonesFeed = { data: { geofencing_zones: { features: [
      { geometry: { type: 'Polygon', coordinates: [square] }, properties: { start: now / 1000 + 3600, rules: [{ ride_through_allowed: false }] } },
      { geometry: { type: 'MultiPolygon', coordinates: [[square]] }, properties: { end: '2026-10-18T13:30:00Z', rules: [{ ride_through_allowed: false }] } },
    ] } } };
    expect(normalizeZones('f', 'dott', types, timed, now).map(zone => zone.id)).toEqual(['f:1']);
    expect(nextZoneChange(timed, now)).toBe(now + 3600_000);
  });

  it('drops corners nobody would see, and refuses rings it cannot draw', () => {
    // Ten points along one 110 m edge of the square: only its corners are left.
    const edge = Array.from({ length: 10 }, (_, index) => [8.54 + index * 0.00015, 47.37]);
    const ring = simplifyRing([...edge, [8.5415, 47.371], [8.54, 47.371], [8.54, 47.37]]);
    expect(ring).toEqual([[47.37, 8.54], [47.37, 8.54135], [47.371, 8.5415], [47.371, 8.54], [47.37, 8.54]]);
    expect(simplifyRing([[8.54, 47.37], [8.54, 47.371], [8.54, 47.37]])).toBeNull();
    expect(simplifyRing([[8.54, 47.37], ['x', 47.371], [8.55, 47.371], [8.54, 47.37]])).toBeNull();
    expect(simplifyRing([[8.54, 47.37], [8.5400001, 47.3700001], [8.5400002, 47.37], [8.54, 47.37]])).toBeNull();
  });

  it('answers for an area with the zones that forbid most, within its size', () => {
    const zones = normalizeZones('f', 'dott', types, feed(
      [{ maximum_speed_kph: 10 }], [{ ride_allowed: false, ride_through_allowed: true }], [{ ride_through_allowed: false }],
    ));
    const view = { south: 47.36, west: 8.53, north: 47.38, east: 8.55 };
    expect(zonesInBounds(zones, view).zones.map(zone => zone.kind)).toEqual(['noRide', 'noParking', 'slow']);
    expect(zonesInBounds(zones, { south: 46, west: 7, north: 46.1, east: 7.1 }).zones).toEqual([]);
    const heavy = zones.map(zone => ({ ...zone, points: ZONES_MAX_POINTS / 2 }));
    expect(zonesInBounds(heavy, view)).toMatchObject({ truncated: true, zones: [{ kind: 'noRide' }, { kind: 'noParking' }] });
    expect(Object.keys(zonesInBounds(zones, view).zones[2])).toEqual(['id', 'provider', 'kind', 'polygons', 'maxSpeedKph']);
  });

  it('is asked for from zoom 14 and for a view of a degree at most', () => {
    const view = { south: 47.36, west: 8.53, north: 47.38, east: 8.55 };
    expect(zoneQueryError(14, view)).toBeNull();
    expect(zoneQueryError(13, view)).not.toBeNull();
    expect(zoneQueryError(null, view)).not.toBeNull();
    expect(zoneQueryError(15, { ...view, east: 9.6 })).not.toBeNull();
    // Across the 180° line, the span is measured the short way round.
    expect(zoneQueryError(15, { south: -44, west: 179.8, north: -43.9, east: -179.8 })).toBeNull();
  });
});
