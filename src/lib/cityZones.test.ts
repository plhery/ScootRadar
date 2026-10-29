import { readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import index from '../../data/city-zones.json';
import { boundsContainPoint } from './geo';
import { ruleInForce, ruleZonesInView } from './ruleZones';

// Around Bergen's Torget and Bryggen, at zoom 14 on a phone.
const BERGEN_CENTRE = { south: 60.388, west: 5.305, north: 60.405, east: 5.345 };
const PORTO_CENTRE = { south: 41.14, west: -8.62, north: 41.155, east: -8.6 };
// Downtown Boise, round the Grove Plaza.
const BOISE_DOWNTOWN = { south: 43.608, west: -116.212, north: 43.621, east: -116.196 };
// Downtown Boulder, from the Pearl Street Mall down Boulder Creek.
const BOULDER_DOWNTOWN = { south: 40.01, west: -105.285, north: 40.022, east: -105.265 };
const ZURICH = { south: 47.36, west: 8.53, north: 47.38, east: 8.55 };
// Arlington National Cemetery's Memorial Amphitheater and the Tomb of the Unknown Soldier.
const ARLINGTON_CEMETERY = { south: 38.874, west: -77.077, north: 38.88, east: -77.068 };
// Norrköping's Drottninggatan, from the station to the Gamla torget.
const NORRKOPING_CENTRE = { south: 58.585, west: 16.175, north: 58.597, east: 16.2 };
// Västerås's Stora Torget and Stora gatan, where riding is forbidden.
const VASTERAS_CENTRE = { south: 59.607, west: 16.535, north: 59.614, east: 16.555 };
const KINDS = ['noRide', 'noParking', 'slow', 'parking'];

/** How many times the ring winds round the point: the map fills where it is not 0, the iOS map where it is odd. */
function winding(ring: number[][], lat: number, lng: number): number {
  let turns = 0;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [lat0, lng0] = ring[previous];
    const [lat1, lng1] = ring[index];
    const side = (lng1 - lng0) * (lat - lat0) - (lng - lng0) * (lat1 - lat0);
    if (lat0 <= lat && lat1 > lat && side > 0) turns++;
    else if (lat0 > lat && lat1 <= lat && side < 0) turns--;
  }
  return turns;
}

/** The module as the page first has it, nothing loaded. */
async function fresh() {
  vi.resetModules();
  return import('./cityZones');
}

describe('the cities\' zones', () => {
  it('has a loader for every city of the index and its file, and a city for every loader', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES } = await fresh();
    const cities = ZONE_CITIES.map(city => city.id).sort();
    expect(cities).toEqual(['arlingtoncemetery', 'bergen', 'boise', 'boulder', 'norrkoping', 'porto', 'vasteras']);
    expect(Object.keys(CITY_ZONE_FILES).sort()).toEqual(cities);
    expect(readdirSync('data/city-zones').map(name => name.replace(/\.json$/, '')).sort()).toEqual(cities);
  });

  it('holds in each file the zones the index counts, of the kinds drawn, within the bounds that load them', async () => {
    const { CITY_ZONE_FILES } = await fresh();
    for (const city of index.cities) {
      const { default: file } = await CITY_ZONE_FILES[city.id]();
      expect(file.zones).toHaveLength(city.zones);
      expect(new Set(file.zones.map(zone => zone.id)).size).toBe(city.zones);
      for (const zone of file.zones) {
        expect(KINDS).toContain(zone.kind);
        expect(zone.id.startsWith(`${city.id}-`)).toBe(true);
        expect(zone.ring.length).toBeGreaterThanOrEqual(3);
        expect(zone.ring.every(([lat, lng]) => boundsContainPoint(city.bounds, lat, lng))).toBe(true);
      }
      expect(city.source.url).toMatch(/^https:\/\//);
    }
  });

  it('makes a city\'s zones rule zones of the city, in force always', async () => {
    const { cityRuleZones, ZONE_CITIES } = await fresh();
    const bergen = ZONE_CITIES.find(city => city.id === 'bergen')!;
    const ring: [number, number][] = [[60.395, 5.324], [60.395, 5.326], [60.396, 5.326]];
    const [zone] = cityRuleZones(bergen, { zones: [{ id: 'bergen-slow-1', kind: 'slow', name: 'Saktesone - Torget', ring }] });
    expect(zone).toEqual({
      id: 'bergen-slow-1', place: 'Saktesone - Torget', authority: 'Bergen kommune', rule: 'slow',
      timeZone: 'Europe/Oslo', source: bergen.source, ring,
    });
    expect(ruleInForce(zone, Date.parse('2026-10-29T23:30:00Z'))).toBe(true);
  });

  it('finds the cities a view reaches, from zoom 14 in', async () => {
    const { zoneCitiesInView } = await fresh();
    expect(zoneCitiesInView({ bounds: BERGEN_CENTRE, zoom: 14 }).map(city => city.id)).toEqual(['bergen']);
    expect(zoneCitiesInView({ bounds: PORTO_CENTRE, zoom: 17 }).map(city => city.id)).toEqual(['porto']);
    expect(zoneCitiesInView({ bounds: BOISE_DOWNTOWN, zoom: 15 }).map(city => city.id)).toEqual(['boise']);
    expect(zoneCitiesInView({ bounds: BOULDER_DOWNTOWN, zoom: 15 }).map(city => city.id)).toEqual(['boulder']);
    expect(zoneCitiesInView({ bounds: ARLINGTON_CEMETERY, zoom: 16 }).map(city => city.id)).toEqual(['arlingtoncemetery']);
    expect(zoneCitiesInView({ bounds: VASTERAS_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['vasteras']);
    expect(zoneCitiesInView({ bounds: NORRKOPING_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['norrkoping']);
    expect(zoneCitiesInView({ bounds: BERGEN_CENTRE, zoom: 13 })).toEqual([]);
    expect(zoneCitiesInView({ bounds: ZURICH, zoom: 16 })).toEqual([]);
    expect(zoneCitiesInView(null)).toEqual([]);
  });

  it('loads a city\'s zones once, and tells those listening', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const load = vi.spyOn(CITY_ZONE_FILES, 'bergen');
    const listener = vi.fn();
    const stop = cityZones.subscribe(listener);
    const bergen = ZONE_CITIES.find(city => city.id === 'bergen')!;
    const empty = cityZones.get();
    expect(empty).toEqual([]);
    await Promise.all([loadCityZones(bergen), loadCityZones(bergen)]);
    expect(load).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledTimes(1);
    const zones = cityZones.get();
    expect(zones).toHaveLength(772);
    await loadCityZones(bergen);
    expect(cityZones.get()).toBe(zones);
    stop();

    // Drawn as the map draws them: a few hundred at zoom 14, of all four kinds, in force.
    const shown = ruleZonesInView({ bounds: BERGEN_CENTRE, zoom: 14 }, Date.now(), zones);
    expect(shown.length).toBeGreaterThan(100);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
    expect(shown.every(zone => zone.inForce && zone.authority === 'Bergen kommune')).toBe(true);
  });

  it('draws nothing of a city whose zones failed to load, and asks for them again the next time', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const load = vi.spyOn(CITY_ZONE_FILES, 'porto').mockRejectedValueOnce(new Error('offline'));
    const porto = ZONE_CITIES.find(city => city.id === 'porto')!;
    await loadCityZones(porto);
    expect(cityZones.get()).toEqual([]);
    await loadCityZones(porto);
    expect(load).toHaveBeenCalledTimes(2);
    expect(cityZones.get()).toHaveLength(230);
    expect(cityZones.get().every(zone => zone.rule === 'parking' && zone.authority === 'Porto')).toBe(true);
  });

  it('draws Boise\'s zones but not the ring round its whole service area', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'boise')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of Boise' && zone.timeZone === 'America/Boise')).toBe(true);
    // The City's no-operation layer holds a ring of 5,259 km² round the service area, over Meridian, Eagle and
    // Nampa: where Lime's service area ends, which Lime's own zones draw. The others are under a square kilometre.
    const { default: file } = await CITY_ZONE_FILES.boise();
    for (const zone of file.zones) {
      const lats = zone.ring.map(([lat]) => lat);
      expect(Math.max(...lats) - Math.min(...lats), zone.id).toBeLessThan(0.02);
    }
    // Lime's own "Grove Center LSZ" is the City's slow zone over the Grove Plaza, drawn here.
    const shown = ruleZonesInView({ bounds: BOISE_DOWNTOWN, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
    expect(shown.filter(zone => zone.rule === 'slow').map(zone => zone.id)).toContain('boise-slow-12');
  });

  it('draws Lime\'s zones for Boulder, credited to Lime, but not the areas round the city where its service ends', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'boulder')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Lime' && zone.timeZone === 'America/Denver')).toBe(true);
    // Lime's file has two no-operation zones of about 90 km² each, east and west of the city, where its service area
    // ends; the others are the size of a park or a campus at most.
    const { default: file } = await CITY_ZONE_FILES.boulder();
    for (const zone of file.zones) {
      const lats = zone.ring.map(([lat]) => lat);
      expect(Math.max(...lats) - Math.min(...lats), zone.id).toBeLessThan(0.02);
    }
    // Its mandatory parking zone, where a ride ends at a corral the file does not hold, is not drawn as a place to park.
    expect(file.zones.some(zone => zone.kind === 'parking')).toBe(false);
    const shown = ruleZonesInView({ bounds: BOULDER_DOWNTOWN, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['noRide', 'noParking', 'slow']));
    expect(shown.find(zone => zone.rule === 'slow' && zone.place === 'Pearl Street Mall')).toBeDefined();
  });

  it('draws Arlington National Cemetery as one no-ride zone, credited to the federal rule and OpenStreetMap', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'arlingtoncemetery')!);
    const [zone, ...others] = cityZones.get();
    expect(others).toEqual([]);
    expect(zone).toMatchObject({
      rule: 'noRide', place: 'Arlington National Cemetery', authority: '32 CFR 553.33(c)(8), outline © OpenStreetMap',
      timeZone: 'America/New_York', source: { url: 'https://www.ecfr.gov/current/title-32/section-553.33' },
    });
    // Its OpenStreetMap outline's one hole is bleachers within the cemetery, so the zone has none.
    const { default: file } = await CITY_ZONE_FILES.arlingtoncemetery();
    expect(file.zones.map(({ id, kind }) => [id, kind])).toEqual([['arlingtoncemetery-no-ride-1', 'noRide']]);
    const shown = ruleZonesInView({ bounds: ARLINGTON_CEMETERY, zoom: 16 }, Date.parse('2026-10-29T23:30:00Z'), [zone]);
    expect(shown.map(({ id, inForce }) => [id, inForce])).toEqual([['arlingtoncemetery-no-ride-1', true]]);
  });

  it('draws Norrköping\'s zones, read back from its map\'s drawing, where its map draws them', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'norrkoping')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Norrköpings kommun' && zone.timeZone === 'Europe/Stockholm')).toBe(true);
    const shown = ruleZonesInView({ bounds: NORRKOPING_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
    // Its parking places are painted bays, 17 m long at most, drawn so: no ring round a square.
    const { default: file } = await CITY_ZONE_FILES.norrkoping();
    for (const zone of file.zones.filter(({ kind }) => kind === 'parking')) {
      const lats = zone.ring.map(([lat]) => lat);
      const lngs = zone.ring.map(([, lng]) => lng);
      expect((Math.max(...lats) - Math.min(...lats)) * 110_540, zone.id).toBeLessThan(25);
      expect((Math.max(...lngs) - Math.min(...lngs)) * 57_900, zone.id).toBeLessThan(25);
    }
  });

  it('draws Västerås\'s zones, each part of one a zone, and leaves the holes in them open', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'vasteras')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Västerås stad' && zone.timeZone === 'Europe/Stockholm')).toBe(true);
    const shown = ruleZonesInView({ bounds: VASTERAS_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
    // A no-parking area of the City's goes round a block it leaves out: the ring goes round the
    // block too, the other way, so the block stays open.
    const { default: file } = await CITY_ZONE_FILES.vasteras();
    const { ring } = file.zones.find(zone => zone.id === 'vasteras-no-parking-356')!;
    expect(winding(ring, 59.6265, 16.59928)).toBe(0);
    expect(Math.abs(winding(ring, 59.62697, 16.5983))).toBe(1);
    // An area of two parts is two zones.
    expect(file.zones.filter(zone => zone.id.startsWith('vasteras-no-parking-588-')).map(zone => zone.id))
      .toEqual(['vasteras-no-parking-588-1', 'vasteras-no-parking-588-2']);
  });
});
