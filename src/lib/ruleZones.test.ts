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
    for (const zone of RULE_ZONES) {
      if (zone.lines) expect(bandPolygons(zone.lines).length, zone.id).toBeLessThanOrEqual(zone.lines.length);
    }
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
    // 104 Street, in Old Strathcona; 82 Avenue goes on west of 112 Street and east of 97 Street, open to riding.
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
    // The Riverwalk just north of Curtis Hixon Park; Morgan Street, a few blocks inland, has no rule.
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

  it('gives four of Brighton & Hove\'s no-go places at all hours, credited to the council', () => {
    const night = Date.parse('2026-11-02T03:30:00Z');
    const only = (bounds: { south: number; west: number; north: number; east: number }) =>
      ruleZonesInView({ bounds, zoom: 16 }, night).map(zone => zone.id);
    // Kensington Gardens, in the North Laine.
    const [lane] = ruleZonesInView({ bounds: { south: 50.8258, west: -0.1392, north: 50.8266, east: -0.1384 }, zoom: 17 }, night);
    expect(lane).toMatchObject({
      id: 'brighton-kensington-gardens', inForce: true,
      authority: 'Brighton & Hove City Council, lines © OpenStreetMap', timeZone: 'Europe/London',
    });
    expect(lane.polygons.some(([outer]) => polygonContainsPoint(outer, 50.826265, -0.138683))).toBe(true);
    expect(only({ south: 50.8229, west: -0.1448, north: 50.8236, east: -0.1436 })).toEqual(['brighton-cranbourne-street']);
    // The Undercliff Walk below Rottingdean; Hove Promenade east of Hove Lagoon, but not its stretch east of Medina
    // Terrace, by Hove Lawns, which OpenStreetMap doesn't name.
    expect(only({ south: 50.8025, west: -0.0595, north: 50.8035, east: -0.0575 })).toEqual(['brighton-undercliff-walk']);
    expect(only({ south: 50.825, west: -0.1885, north: 50.826, east: -0.1865 })).toEqual(['hove-promenade']);
    expect(only({ south: 50.8228, west: -0.1665, north: 50.8245, east: -0.1645 })).toEqual([]);
  });

  it('gives Brighton & Hove\'s skate parks as no-ride areas at all hours, credited to the council', () => {
    const night = Date.parse('2026-11-03T03:30:00Z');
    const at = (lat: number, lng: number) => ruleZonesInView(
      { bounds: { south: lat - 0.0005, west: lng - 0.0008, north: lat + 0.0005, east: lng + 0.0008 }, zoom: 16 }, night)
      .filter(zone => zone.polygons.some(([outer]) => polygonContainsPoint(outer, lat, lng)))
      .map(({ id, rule, inForce, authority }) => ({ id, rule, inForce, authority }));
    const noRide = (id: string) => [{ id, rule: 'noRide', inForce: true, authority: 'Brighton & Hove City Council, lines © OpenStreetMap' }];
    expect(at(50.83081, -0.1333)).toEqual(noRide('brighton-the-level-skatepark'));
    expect(at(50.8474, -0.12586)).toEqual(noRide('brighton-hollingdean-skatepark'));
    expect(at(50.83897, -0.06349)).toEqual(noRide('brighton-woodingdean-skatepark'));
    expect(at(50.83447, -0.06746)).toEqual(noRide('brighton-woodingdean-central-park-skate-area'));
    expect(at(50.8038, -0.04055)).toEqual(noRide('brighton-saltdean-oval-skatepark'));
    // The Level's grass beside its skatepark; the old Hove Lagoon skatepark, closed in September 2024; the indoor
    // skatepark at Brighton Youth Centre; Hollingdean's old skate ramps, abandoned.
    expect(at(50.8302, -0.1340)).toEqual([]);
    expect(at(50.82651, -0.19582)).toEqual([]);
    expect(at(50.82244, -0.13072)).toEqual([]);
    expect(at(50.84857, -0.12527)).toEqual([]);
  });

  it('gives Calgary\'s 15 km/h streets within the communities the City names them by, credited to the City', () => {
    const now = Date.parse('2026-11-03T00:30:00Z');
    const at = (lat: number, lng: number) => ruleZonesInView(
      { bounds: { south: lat - 0.0005, west: lng - 0.0008, north: lat + 0.0005, east: lng + 0.0008 }, zoom: 16 }, now)
      .filter(zone => zone.polygons.some(([outer]) => polygonContainsPoint(outer, lat, lng)))
      .map(({ id, rule, maxSpeedKph, authority }) => ({ id, rule, maxSpeedKph, authority }));
    const slow = (id: string) => [{ id, rule: 'slow', maxSpeedKph: 15, authority: 'City of Calgary, lines © OpenStreetMap' }];
    expect(at(51.033822, -114.071529)).toEqual(slow('calgary-4-street-sw-mission'));
    expect(at(51.041209, -114.034233)).toEqual(slow('calgary-9-avenue-se-inglewood'));
    expect(at(51.045864, -114.073737)).toEqual(slow('calgary-8-avenue-sw-downtown'));
    expect(at(51.055492, -114.085922)).toEqual(slow('calgary-10-street-nw-kensington'));
    // 4 Street north of 17 Avenue, out of Mission; 10 Street north of Riley Park; Kensington Road, which nothing bounds.
    expect(at(51.041, -114.07153)).toEqual([]);
    expect(at(51.0600, -114.0859)).toEqual([]);
    expect(at(51.05252, -114.0900)).toEqual([]);
  });

  it('gives Calgary\'s 7 Avenue transit corridor from 11 Street SW to 4 Street SE at all hours, as the Transit Bylaw bounds it', () => {
    const night = Date.parse('2026-11-03T09:30:00Z');
    const at = (lat: number, lng: number) => ruleZonesInView(
      { bounds: { south: lat - 0.0005, west: lng - 0.0008, north: lat + 0.0005, east: lng + 0.0008 }, zoom: 16 }, night)
      .filter(zone => zone.polygons.some(([outer]) => polygonContainsPoint(outer, lat, lng)))
      .map(({ id, rule, inForce, authority }) => ({ id, rule, inForce, authority }));
    const corridor = [{ id: 'calgary-7-avenue-transit-corridor', rule: 'noRide', inForce: true, authority: 'City of Calgary, lines © OpenStreetMap' }];
    expect(at(51.047097, -114.084073)).toEqual(corridor);
    expect(at(51.046709, -114.070458)).toEqual(corridor);
    expect(at(51.046277, -114.05532)).toEqual(corridor);
    // 7 Avenue east of 4 Street SE and west of 11 Street SW, out of the corridor.
    expect(at(51.04613, -114.0515)).toEqual([]);
    expect(at(51.0469, -114.0905)).toEqual([]);
  });

  it('gives Warsaw\'s no-ride areas and 12 km/h streets, the new ones from 22 May 2026, credited to ZDM', () => {
    const now = Date.parse('2026-11-02T23:30:00Z');
    const at = (lat: number, lng: number, time = now) => ruleZonesInView(
      { bounds: { south: lat - 0.0005, west: lng - 0.0008, north: lat + 0.0005, east: lng + 0.0008 }, zoom: 16 }, time)
      .filter(zone => zone.polygons.some(([outer]) => polygonContainsPoint(outer, lat, lng)));
    // The Old Town's market square, and Castle Square; not the cycle path along the Wisłostrada below it.
    const [rynek] = at(52.2498, 21.0122);
    expect(rynek).toMatchObject({ id: 'warsaw-stare-miasto', rule: 'noRide', inForce: true, authority: 'Warsaw ZDM, lines © OpenStreetMap' });
    expect(at(52.2475, 21.0135).map(zone => zone.id)).toEqual(['warsaw-stare-miasto']);
    expect(at(52.251, 21.0157)).toEqual([]);
    // Chmielna's pedestrian street at 12 km/h since the 2021 agreements; Park Sowińskiego since 22 May 2026.
    expect(at(52.2321, 21.0135).map(({ id, rule, maxSpeedKph }) => ({ id, rule, maxSpeedKph })))
      .toEqual([{ id: 'warsaw-chmielna', rule: 'slow', maxSpeedKph: 12 }]);
    expect(at(52.2308, 20.948).map(({ id, inForce }) => ({ id, inForce }))).toEqual([{ id: 'warsaw-park-sowinskiego', inForce: true }]);
    expect(at(52.2308, 20.948, Date.parse('2026-05-21T12:00:00Z')).map(zone => zone.inForce)).toEqual([false]);
    // Łazienki on both sides of Agrykola; Plac Centralny, a slow square.
    expect(at(52.2150, 21.0350).map(zone => zone.id)).toEqual(['warsaw-lazienki-krolewskie']);
    expect(at(52.2319, 21.0075).map(({ id, rule }) => ({ id, rule }))).toEqual([{ id: 'warsaw-plac-centralny', rule: 'slow' }]);
  });

  it('gives Linköping\'s 6 km/h streets and squares and Gävle\'s slow streets, credited to each kommun', () => {
    const now = Date.parse('2026-11-03T00:30:00Z');
    const at = (lat: number, lng: number) => ruleZonesInView(
      { bounds: { south: lat - 0.0005, west: lng - 0.0008, north: lat + 0.0005, east: lng + 0.0008 }, zoom: 16 }, now)
      .filter(zone => zone.polygons.some(([outer]) => polygonContainsPoint(outer, lat, lng)))
      .map(({ id, rule, maxSpeedKph, authority, inForce }) => ({ id, rule, maxSpeedKph, authority, inForce }));
    const linkoping = (id: string) => [{ id, rule: 'slow', maxSpeedKph: 6, authority: 'Linköpings kommun, lines © OpenStreetMap', inForce: true }];
    expect(at(58.410233, 15.62076)).toEqual(linkoping('linkoping-torggatan'));
    expect(at(58.410282, 15.623002)).toEqual(linkoping('linkoping-tanneforsgatan'));
    expect(at(58.410743, 15.621615)).toEqual(linkoping('linkoping-stora-torget'));
    expect(at(58.412121, 15.626654)).toEqual(linkoping('linkoping-farbror-melins-torg'));
    // Gävle gives no speed.
    const gavle = (id: string) => [{ id, rule: 'slow', maxSpeedKph: undefined, authority: 'Gävle kommun, lines © OpenStreetMap', inForce: true }];
    expect(at(60.67464, 17.143611)).toEqual(gavle('gavle-drottninggatan'));
    expect(at(60.675639, 17.150355)).toEqual(gavle('gavle-centralplan'));
    // Nygatan, whose parts it doesn't name; the 50 km/h Drottninggatan east of the railway.
    expect(at(60.67419, 17.13862)).toEqual([]);
    expect(at(60.6775, 17.1545)).toEqual([]);
  });

  it('keeps each street and area whole, with a source and hours', () => {
    for (const zone of RULE_ZONES) {
      expect(zone.source.url).toMatch(/^https:\/\//);
      expect(['noRide', 'slow']).toContain(zone.rule);
      // A speed only for a slow rule, and only as a whole number a scooter can ride at.
      if (zone.maxSpeedKph !== undefined) expect(zone.rule === 'slow' && Number.isInteger(zone.maxSpeedKph) && zone.maxSpeedKph <= 25, zone.id).toBe(true);
      if (zone.ring) expect(zone.ring.length, zone.id).toBeGreaterThanOrEqual(3);
      else expect(zone.lines.every(line => line.length >= 2), zone.id).toBe(true);
      expect(zone.hours?.every(({ from, until }) => /^\d\d:\d\d$/.test(from) && /^\d\d:\d\d$/.test(until)) ?? true).toBe(true);
    }
  });

  it('credits OpenStreetMap in the legend for every street and area, its lines being traced on its ways', () => {
    // The user's exception to map rules not resting on OpenStreetMap covers this layer only (1 November 2026),
    // its no-ride areas and slow streets too (3 November 2026).
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

  it('draws a slow street as a band of its own kind, its speed kept for the legend', () => {
    const street = {
      ...parking, id: 'test-slow-street', rule: 'slow' as const, maxSpeedKph: 12, ring: undefined,
      lines: [[[60.3955, 5.322], [60.3955, 5.328]]] as [number, number][][],
    };
    const [drawn] = ruleZonesInView({ bounds: TORGET, zoom: 16 }, SEOUL_NOON, [street]);
    expect(drawn).toMatchObject({ id: 'test-slow-street', rule: 'slow', maxSpeedKph: 12, inForce: true });
    expect(drawn.polygons).toHaveLength(1);
    expect(polygonContainsPoint(drawn.polygons[0][0], 60.3955, 5.325)).toBe(true);
    expect(polygonContainsPoint(drawn.polygons[0][0], 60.39555, 5.325)).toBe(true);
    expect(polygonContainsPoint(drawn.polygons[0][0], 60.3957, 5.325)).toBe(false);
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
