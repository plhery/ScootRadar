import { describe, expect, it } from 'vitest';
import { polygonContainsPoint } from './geo';
import { bandPolygons, RULE_ZONES, ruleInForce, ruleZonesInView } from './ruleZones';

// Seoul is UTC+9 all year.
const SEOUL_NOON = Date.parse('2026-10-26T03:00:00Z');
const SEOUL_23H = Date.parse('2026-10-26T14:00:00Z');
const SEOUL_11H59 = Date.parse('2026-10-26T02:59:00Z');
const HONGDAE = { south: 37.55, west: 126.918, north: 37.558, east: 126.93 };
const DAECHI = { south: 37.493, west: 127.05, north: 37.5, east: 127.058 };

describe('ruleInForce', () => {
  const zone = { from: '2026-09-30', timeZone: 'Asia/Seoul', hours: [{ from: '12:00', until: '23:00' }] };

  it('holds from noon until 23:00 by the zone\'s clock', () => {
    expect(ruleInForce(zone, SEOUL_NOON)).toBe(true);
    expect(ruleInForce(zone, SEOUL_23H - 60_000)).toBe(true);
    expect(ruleInForce(zone, SEOUL_23H)).toBe(false);
    expect(ruleInForce(zone, SEOUL_11H59)).toBe(false);
  });

  it('holds only from its first day there, and all day without hours', () => {
    expect(ruleInForce(zone, Date.parse('2026-09-29T14:59:00Z'))).toBe(false);
    expect(ruleInForce(zone, Date.parse('2026-09-30T03:00:00Z'))).toBe(true);
    expect(ruleInForce({ from: '2026-06-30', timeZone: 'Europe/Istanbul' }, Date.parse('2026-10-26T01:00:00Z'))).toBe(true);
  });

  it('holds over midnight when its hours end the next day', () => {
    const night = { ...zone, hours: [{ from: '22:00', until: '06:00' }] };
    expect(ruleInForce(night, Date.parse('2026-10-26T14:00:00Z'))).toBe(true);
    expect(ruleInForce(night, Date.parse('2026-10-26T20:00:00Z'))).toBe(true);
    expect(ruleInForce(night, SEOUL_NOON)).toBe(false);
  });
});

describe('bandPolygons', () => {
  it('widens a street to a band round its line, and joins its bends into one shape', () => {
    // About 200 m east, then 100 m north.
    const line: [number, number][] = [[37.5, 127], [37.5, 127.00226], [37.5009, 127.00226]];
    const band = bandPolygons([line], 14);
    expect(band).toHaveLength(1);
    const [outer] = band[0];
    expect(polygonContainsPoint(outer, 37.5, 127.001)).toBe(true);
    // 5 m off the line is inside, 9 m off is not.
    expect(polygonContainsPoint(outer, 37.5 + 5 / 110_540, 127.001)).toBe(true);
    expect(polygonContainsPoint(outer, 37.5 + 9 / 110_540, 127.001)).toBe(false);
    expect(polygonContainsPoint(outer, 37.50045, 127.00226)).toBe(true);
  });
});

describe('ruleZonesInView', () => {
  it('gives the streets over the view from zoom 14, with whether they hold now', () => {
    const hongdae = ruleZonesInView({ bounds: HONGDAE, zoom: 15 }, SEOUL_NOON);
    expect(hongdae.map(zone => zone.id)).toEqual(['seoul-hongdae-red-road']);
    expect(hongdae[0].inForce).toBe(true);
    expect(hongdae[0].polygons.length).toBeGreaterThan(0);
    expect(ruleZonesInView({ bounds: HONGDAE, zoom: 15 }, SEOUL_23H)[0].inForce).toBe(false);
    expect(ruleZonesInView({ bounds: HONGDAE, zoom: 13 }, SEOUL_NOON)).toEqual([]);
    expect(ruleZonesInView({ bounds: DAECHI, zoom: 16 }, SEOUL_NOON).map(zone => zone.authority)).toEqual(['Gangnam-gu']);
    expect(ruleZonesInView(null, SEOUL_NOON)).toEqual([]);
  });

  it('keeps each street whole, with a source and hours', () => {
    for (const zone of RULE_ZONES) {
      expect(zone.source.url).toMatch(/^https:\/\//);
      expect(zone.lines.every(line => line.length >= 2)).toBe(true);
      expect(zone.hours?.every(({ from, until }) => /^\d\d:\d\d$/.test(from) && /^\d\d:\d\d$/.test(until)) ?? true).toBe(true);
    }
  });
});
