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

  it('joins every street of the file into a shape or a few, so none is drawn piece by piece', () => {
    // Pieces the union can't join are drawn as they are (hundreds for Antalya's boulevard): two
    // lines sharing an edge can make it fail, so a carriageway leaves out the edges another draws.
    for (const zone of RULE_ZONES) expect(bandPolygons(zone.lines).length, zone.id).toBeLessThanOrEqual(zone.lines.length);
  });

  it('draws the pieces as they are when they can\'t be joined, rather than failing', () => {
    const line: [number, number][] = [[37.5, 127], [37.5, 127.001]];
    expect(bandPolygons([line, [...line].reverse(), line], 14).length).toBeGreaterThan(0);
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
    expect(ruleZonesInView({ bounds: DAECHI, zoom: 16 }, SEOUL_NOON).map(zone => zone.authority)).toEqual(['Gangnam-gu, lines © OpenStreetMap']);
    expect(ruleZonesInView(null, SEOUL_NOON)).toEqual([]);
  });

  it('gives Antalya\'s boulevard in Kemerağzı and Kundu at all hours since 30 September 2025, credited to UKOME', () => {
    // Trendy Lara, Kundu, where the lines end; the boulevard runs on into Güzeloba, where riding is allowed.
    const kundu = { south: 36.862, west: 30.915, north: 36.868, east: 30.925 };
    const guzeloba = { south: 36.85, west: 30.83, north: 36.86, east: 30.855 };
    const night = Date.parse('2026-11-01T23:30:00Z');
    const [boulevard, ...others] = ruleZonesInView({ bounds: kundu, zoom: 15 }, night);
    expect(others).toEqual([]);
    expect(boulevard.id).toBe('antalya-yasar-sobutay-bulvari');
    expect(boulevard.inForce).toBe(true);
    expect(boulevard.authority).toBe('Antalya UKOME, lines © OpenStreetMap');
    expect(boulevard.timeZone).toBe('Europe/Istanbul');
    expect(boulevard.hours).toBeUndefined();
    expect(ruleZonesInView({ bounds: kundu, zoom: 15 }, Date.parse('2025-09-29T12:00:00Z'))[0].inForce).toBe(false);
    expect(ruleZonesInView({ bounds: guzeloba, zoom: 15 }, night)).toEqual([]);
    // On the eastbound carriageway in front of Titanic Mardan Palace.
    const line = boulevard.lines![0];
    const [lat, lng] = line[Math.floor(line.length * 0.9)];
    expect(boulevard.polygons.some(([outer]) => polygonContainsPoint(outer, lat, lng))).toBe(true);
  });

  it('gives Chicago\'s Lakefront Trail, The 606 and Riverwalk at all hours, credited to CDOT', () => {
    // Where the Riverwalk ends at Lake Shore Drive, the Lakefront Trail crosses the river on the Navy Pier Flyover.
    const riverMouth = { south: 41.885, west: -87.618, north: 41.892, east: -87.609 };
    const night = Date.parse('2026-11-02T08:30:00Z');
    const here = ruleZonesInView({ bounds: riverMouth, zoom: 15 }, night);
    expect(here.map(zone => zone.id).sort()).toEqual(['chicago-lakefront-trail', 'chicago-riverwalk']);
    for (const zone of here) {
      expect(zone.inForce).toBe(true);
      expect(zone.authority).toBe('Chicago DOT, lines © OpenStreetMap');
      expect(zone.from).toBeUndefined();
      expect(zone.hours).toBeUndefined();
    }
    expect(ruleZonesInView({ bounds: riverMouth, zoom: 15 }, Date.parse('2019-06-15T12:00:00Z'))[0].inForce).toBe(true);
    // Damen Avenue, over which The 606 runs; State Street in the Loop has no rule.
    expect(ruleZonesInView({ bounds: { south: 41.912, west: -87.68, north: 41.916, east: -87.675 }, zoom: 15 }, night)
      .map(zone => zone.id)).toEqual(['chicago-606-bloomingdale-trail']);
    expect(ruleZonesInView({ bounds: { south: 41.878, west: -87.629, north: 41.882, east: -87.627 }, zoom: 16 }, night)).toEqual([]);
    // North Avenue Beach, where the trail's bike and walking paths run side by side.
    const trail = here.find(zone => zone.id === 'chicago-lakefront-trail')!;
    const lakefront = ruleZonesInView({ bounds: { south: 41.909, west: -87.63, north: 41.915, east: -87.62 }, zoom: 15 }, night);
    const point = trail.lines!.flat().find(([lat, lng]) => lat > 41.91 && lat < 41.914 && lng > -87.63 && lng < -87.62)!;
    expect(lakefront[0].polygons.some(([outer]) => polygonContainsPoint(outer, point[0], point[1]))).toBe(true);
  });

  it('gives Edmonton\'s Whyte Avenue from 112 to 97 Street at all hours, credited to the City', () => {
    const night = Date.parse('2026-11-02T08:30:00Z');
    // Gateway Boulevard, in Old Strathcona; 82 Avenue goes on west of 112 Street and east of 97 Street, open to riding.
    const [whyte, ...others] = ruleZonesInView({ bounds: { south: 53.517, west: -113.499, north: 53.519, east: -113.496 }, zoom: 16 }, night);
    expect(others).toEqual([]);
    expect(whyte).toMatchObject({ id: 'edmonton-whyte-avenue', inForce: true, authority: 'City of Edmonton, lines © OpenStreetMap', timeZone: 'America/Edmonton' });
    expect(whyte.polygons.some(([outer]) => polygonContainsPoint(outer, 53.51808, -113.4975))).toBe(true);
    expect(ruleZonesInView({ bounds: { south: 53.515, west: -113.525, north: 53.519, east: -113.5225 }, zoom: 16 }, night)).toEqual([]);
    expect(ruleZonesInView({ bounds: { south: 53.517, west: -113.4785, north: 53.519, east: -113.477 }, zoom: 16 }, night)).toEqual([]);
  });

  it('gives Tampa\'s Riverwalk, Bayshore Boulevard and 7th Avenue in Ybor City at all hours, credited to the City', () => {
    const night = Date.parse('2026-11-02T08:30:00Z');
    const only = (bounds: { south: number; west: number; north: number; east: number }) =>
      ruleZonesInView({ bounds, zoom: 16 }, night).map(zone => zone.id);
    // Curtis Hixon Park, on the Riverwalk; Florida Avenue, a few blocks inland, has no rule.
    const [riverwalk] = ruleZonesInView({ bounds: { south: 27.95, west: -82.4655, north: 27.952, east: -82.4635 }, zoom: 16 }, night);
    expect(riverwalk).toMatchObject({ id: 'tampa-riverwalk', inForce: true, authority: 'City of Tampa, lines © OpenStreetMap', timeZone: 'America/New_York' });
    expect(only({ south: 27.949, west: -82.4565, north: 27.951, east: -82.4545 })).toEqual([]);
    // Bayshore Boulevard by the bay, its carriageways and the path beside them; none inside MacDill Air Force Base.
    const [bayshore] = ruleZonesInView({ bounds: { south: 27.919, west: -82.4915, north: 27.921, east: -82.4885 }, zoom: 16 }, night);
    expect(bayshore.id).toBe('tampa-bayshore-boulevard');
    expect(bayshore.polygons.some(([outer]) => polygonContainsPoint(outer, 27.919588, -82.490444))).toBe(true);
    expect(only({ south: 27.858, west: -82.49, north: 27.862, east: -82.486 })).toEqual([]);
    // 7th Avenue at 15th Street, in Ybor City; it runs on east of 22nd Street, open to riding.
    expect(only({ south: 27.959, west: -82.444, north: 27.9615, east: -82.441 })).toEqual(['tampa-7th-avenue-ybor-city']);
    expect(only({ south: 27.959, west: -82.432, north: 27.9615, east: -82.429 })).toEqual([]);
  });

  it('keeps each street whole, with a source and hours', () => {
    for (const zone of RULE_ZONES) {
      expect(zone.source.url).toMatch(/^https:\/\//);
      expect(zone.lines.every(line => line.length >= 2)).toBe(true);
      expect(zone.hours?.every(({ from, until }) => /^\d\d:\d\d$/.test(from) && /^\d\d:\d\d$/.test(until)) ?? true).toBe(true);
    }
  });

  it('credits OpenStreetMap in the legend for every street, its lines being traced on its roads', () => {
    // The user's exception to map rules not resting on OpenStreetMap covers this layer only (1 November 2026).
    expect(RULE_ZONES.length).toBeGreaterThan(0);
    for (const zone of RULE_ZONES) expect(zone.authority).toMatch(/^[^,]+, lines © OpenStreetMap$/);
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
