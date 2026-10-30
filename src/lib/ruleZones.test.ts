import { describe, expect, it } from 'vitest';
import { polygonContainsPoint } from './geo';
import { bandPolygons, RULE_ZONES, ruleInForce, ruleZonesInView, type RuleArea } from './ruleZones';

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

  it('holds always without a first day or hours, as a city\'s zones do', () => {
    expect(ruleInForce({ timeZone: 'Europe/Oslo' }, Date.parse('1999-01-01T03:00:00Z'))).toBe(true);
    expect(ruleInForce({ timeZone: 'Europe/Oslo' }, SEOUL_23H)).toBe(true);
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

describe('ruleZonesInView, with the areas a city sets', () => {
  /** Twice the ring's area, its points read as [x, y]: positive one way round, negative the other. */
  const turn = (ring: [number, number][]) =>
    ring.reduce((sum, [x0, y0], index) => {
      const [x1, y1] = ring[(index + 1) % ring.length];
      return sum + x0 * y1 - x1 * y0;
    }, 0);
  // Bergen's Torget, about 110 m by 110 m, and an area a kilometre north of it.
  const TORGET = { south: 60.394, west: 5.32, north: 60.397, east: 5.33 };
  const ring: [number, number][] = [[60.395, 5.324], [60.395, 5.326], [60.396, 5.326], [60.396, 5.324]];
  const parking: RuleArea = {
    id: 'test-parking', place: 'Torget', authority: 'Bergen kommune', rule: 'parking', timeZone: 'Europe/Oslo',
    source: { title: 'Bergen kommune', url: 'https://www.bergen.kommune.no/' }, ring,
  };
  const north: RuleArea = { ...parking, id: 'test-no-ride', rule: 'noRide', ring: ring.map(([lat, lng]) => [lat + 0.01, lng]) };
  const slow: RuleArea = { ...parking, id: 'test-slow', rule: 'slow', ring: [...ring].reverse() };

  it('gives the areas over the view from zoom 14 only, always in force, of their kind', () => {
    const shown = ruleZonesInView({ bounds: TORGET, zoom: 14 }, SEOUL_23H, [...RULE_ZONES, parking, north, slow]);
    expect(shown.map(({ id, rule, inForce, authority }) => ({ id, rule, inForce, authority }))).toEqual([
      { id: 'test-parking', rule: 'parking', inForce: true, authority: 'Bergen kommune' },
      { id: 'test-slow', rule: 'slow', inForce: true, authority: 'Bergen kommune' },
    ]);
    expect(ruleZonesInView({ bounds: TORGET, zoom: 13 }, SEOUL_23H, [parking, north, slow])).toEqual([]);
    expect(ruleZonesInView({ bounds: HONGDAE, zoom: 15 }, SEOUL_23H, [parking, north, slow])).toEqual([]);
  });

  it('draws each area as its ring, every ring turned the way a band\'s outer edge turns', () => {
    const [drawnParking, drawnSlow] = ruleZonesInView({ bounds: TORGET, zoom: 16 }, SEOUL_NOON, [parking, slow]);
    const bandTurn = Math.sign(turn(bandPolygons([[[37.5, 127], [37.5, 127.00226]]])[0][0]));
    for (const { polygons } of [drawnParking, drawnSlow]) {
      expect(polygons).toHaveLength(1);
      expect(polygons[0]).toHaveLength(1);
      expect(Math.sign(turn(polygons[0][0]))).toBe(bandTurn);
      expect(polygonContainsPoint(polygons[0][0], 60.3955, 5.325)).toBe(true);
      expect(polygonContainsPoint(polygons[0][0], 60.3965, 5.325)).toBe(false);
    }
    // Only turned, not changed.
    expect([...drawnParking.polygons[0][0]].sort()).toEqual([...ring].sort());
  });

  it('draws an area\'s holes as rings of their own, turned the other way, without the bridges its file keeps them by', () => {
    // As scripts/boundaries.mjs keeps them: each hole after the first point, there and back.
    const outer: [number, number][] = [[60.39, 5.32], [60.39, 5.33], [60.4, 5.33], [60.4, 5.32]];
    const holes: [number, number][][] = [
      [[60.392, 5.322], [60.394, 5.322], [60.394, 5.324], [60.392, 5.324]],
      [[60.396, 5.326], [60.398, 5.326], [60.398, 5.328], [60.396, 5.328]],
    ];
    const bridged = holes.reduce((kept, hole) => [kept[0], ...hole, hole[0], kept[0], ...kept.slice(1)], outer);
    const [drawn] = ruleZonesInView({ bounds: TORGET, zoom: 16 }, SEOUL_NOON, [{ ...parking, id: 'test-parking-holes', ring: bridged }]);
    const bandTurn = Math.sign(turn(bandPolygons([[[37.5, 127], [37.5, 127.00226]]])[0][0]));
    expect(drawn.polygons).toHaveLength(1);
    const [drawnOuter, ...drawnHoles] = drawn.polygons[0];
    expect([...drawnOuter].sort()).toEqual([...outer].sort());
    expect(Math.sign(turn(drawnOuter))).toBe(bandTurn);
    expect(drawnHoles.map(hole => [...hole].sort())).toEqual([...holes].reverse().map(hole => [...hole].sort()));
    for (const hole of drawnHoles) expect(Math.sign(turn(hole))).toBe(-bandTurn);
  });
});
