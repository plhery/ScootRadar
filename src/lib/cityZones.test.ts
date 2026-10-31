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
// Järvenpää's centre, round its station and the Seutulantie pedestrian street.
const JARVENPAA_CENTRE = { south: 60.469, west: 25.08, north: 60.477, east: 25.1 };
// Minneapolis's Stone Arch Bridge and Gold Medal Park, by the Mississippi.
const MINNEAPOLIS_RIVERFRONT = { south: 44.975, west: -93.27, north: 44.985, east: -93.25 };
// Ottawa's Parliament Hill, the Rideau Canal and the ByWard Market.
const OTTAWA_CENTRE = { south: 45.42, west: -75.7, north: 45.43, east: -75.68 };
// Straume's centre, on Sotra in Øygarden, round Sotra Storsenter.
const STRAUME_CENTRE = { south: 60.355, west: 5.118, north: 60.362, east: 5.13 };
// Basel's old town, from the Marktplatz to the Münster.
const BASEL_ALTSTADT = { south: 47.553, west: 7.585, north: 47.56, east: 7.595 };
// Helsinki's centre, round the Esplanadi.
const HELSINKI_CENTRE = { south: 60.165, west: 24.935, north: 60.172, east: 24.95 };
// München's old town, from Stachus to the Marienplatz.
const MUNCHEN_ALTSTADT = { south: 48.135, west: 11.565, north: 48.142, east: 11.58 };
const MUNSTER_PRINZIPALMARKT = { south: 51.958, west: 7.62, north: 51.965, east: 7.635 };
// Vancouver's Commercial Drive, in Grandview-Woodland.
const VANCOUVER_COMMERCIAL_DRIVE = { south: 49.265, west: -123.075, north: 49.28, east: -123.06 };
// The Old Market and the Gene Leahy Mall, in downtown Omaha.
const OMAHA_DOWNTOWN = { south: 41.252, west: -95.94, north: 41.262, east: -95.922 };
// Alexandria's Old Town, from Market Square down King Street to the waterfront.
const ALEXANDRIA_OLD_TOWN = { south: 38.8, west: -77.05, north: 38.81, east: -77.035 };
// Antwerpen's Meir and Groenplaats.
const ANTWERPEN_MEIR = { south: 51.215, west: 4.395, north: 51.222, east: 4.41 };
// Oslo's Karl Johans gate, from the Slottsplassen to Oslo S.
const OSLO_CENTRE = { south: 59.909, west: 10.725, north: 59.92, east: 10.755 };
// Santa Monica's Pier, the Promenade and Palisades Park's south end.
const SANTA_MONICA_PIER = { south: 34.006, west: -118.502, north: 34.019, east: -118.485 };
// Poznań's Old Market Square and the streets round it.
const POZNAN_OLD_TOWN = { south: 52.404, west: 16.92, north: 52.412, east: 16.94 };
// Sacramento's downtown, from Old Sacramento to the State Capitol.
const SACRAMENTO_DOWNTOWN = { south: 38.574, west: -121.506, north: 38.584, east: -121.488 };
// St. Albert's downtown, round St. Anne Street, where the Farmers' Market is held.
const ST_ALBERT_DOWNTOWN = { south: 53.627, west: -113.64, north: 53.637, east: -113.62 };
const TAUPO_CENTRE = { south: -38.692, west: 176.066, north: -38.684, east: 176.076 };
// Turku's market square, the cathedral and the river between them.
const TURKU_CENTRE = { south: 60.448, west: 22.255, north: 60.456, east: 22.28 };
const ZURICH = { south: 47.36, west: 8.53, north: 47.38, east: 8.55 };
// Clarendon, along Wilson Boulevard in Arlington County.
const ARLINGTON_CLARENDON = { south: 38.884, west: -77.1, north: 38.892, east: -77.088 };
// Arlington National Cemetery's Memorial Amphitheater and the Tomb of the Unknown Soldier.
const ARLINGTON_CEMETERY = { south: 38.874, west: -77.077, north: 38.88, east: -77.068 };
// Midtown Atlanta, along Peachtree Street from 3rd to 8th Street.
const ATLANTA_MIDTOWN = { south: 33.775, west: -84.39, north: 33.785, east: -84.38 };
// Baltimore's Mount Vernon, north of the Inner Harbor.
const BALTIMORE_MOUNT_VERNON = { south: 39.285, west: -76.625, north: 39.3, east: -76.605 };
// The City of London round the Guildhall and Moorgate, from Wood Street to Finsbury Circus.
const CITY_OF_LONDON_GUILDHALL = { south: 51.514, west: -0.095, north: 51.52, east: -0.085 };
// Berlin's Tiergarten and the Brandenburg Gate.
const BERLIN_TIERGARTEN = { south: 52.511, west: 13.36, north: 52.519, east: 13.38 };
// Hamburg's Jungfernstieg and the Binnenalster.
const HAMBURG_JUNGFERNSTIEG = { south: 53.551, west: 9.985, north: 53.558, east: 10.0 };
// Columbus's Harrison West, round Michigan Avenue and West 3rd Avenue.
const COLUMBUS_HARRISON_WEST = { south: 39.98, west: -83.025, north: 39.99, east: -83.01 };
// Helsingborg's Stortorget, Kärnan and the station, Knutpunkten.
const HELSINGBORG_CENTRE = { south: 56.042, west: 12.69, north: 56.049, east: 12.705 };
// Ramlösa, south of Helsingborg's centre, where scooters may park on the pavement.
const HELSINGBORG_RAMLOSA = { south: 56.02, west: 12.72, north: 56.026, east: 12.735 };
// Namur's Place d'Armes, the rue de Fer and the station.
const NAMUR_CENTRE = { south: 50.462, west: 4.86, north: 50.469, east: 4.87 };
// Norrköping's Drottninggatan, from the station to the Gamla torget.
const NORRKOPING_CENTRE = { south: 58.585, west: 16.175, north: 58.597, east: 16.2 };
// Vaasa's market square and the city centre round it.
const VAASA_CENTRE = { south: 63.09, west: 21.6, north: 63.1, east: 21.63 };
// Tikkurila's station and centre, in Vantaa.
const VANTAA_TIKKURILA = { south: 60.288, west: 25.03, north: 60.298, east: 25.05 };
// Västerås's Stora Torget and Stora gatan, where riding is forbidden.
const VASTERAS_CENTRE = { south: 59.607, west: 16.535, north: 59.614, east: 16.555 };
// Washington's Wharf and the Tidal Basin's south shore.
const WASHINGTON_WHARF = { south: 38.875, west: -77.03, north: 38.882, east: -77.015 };
// Wien's Innere Stadt, from the Hofburg to Stephansplatz.
const WIEN_INNERE_STADT = { south: 48.203, west: 16.36, north: 48.212, east: 16.38 };
// Nagoya's Sakae, round the Hisaya-ōdōri park, at zoom 14 on a phone.
const SAKAE = { south: 35.16, west: 136.895, north: 35.178, east: 136.922 };
// Parkchester, in the East Bronx.
const PARKCHESTER = { south: 40.828, west: -73.868, north: 40.836, east: -73.852 };
const KINDS = ['noRide', 'noParking', 'slow', 'parking'];
/** The credit JARTIC's terms ask for, of its data processed. */
const JARTIC_CREDIT = '出典：「交通規制情報」（https://www.jartic.or.jp/service/opendata/）（公益財団法人日本道路交通情報センター）を加工して作成';

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
    const { CITY_ZONE_FILES } = await fresh();
    const cities = index.cities.map(city => city.id).sort();
    expect(Object.keys(CITY_ZONE_FILES).sort()).toEqual(cities);
    expect(readdirSync('data/city-zones').map(name => name.replace(/\.json$/, '')).sort()).toEqual(cities);
  });

  it('draws every city, Berlin and Hamburg too, none held back for an iPhone release', async () => {
    const { ZONE_CITIES } = await fresh();
    expect(ZONE_CITIES.map(city => city.id).sort()).toEqual(['alexandria', 'antwerpen', 'arlington', 'arlingtoncemetery', 'atlanta', 'baltimore', 'basel', 'bergen', 'berlin', 'boise', 'boulder', 'cityoflondon', 'columbus', 'hamburg', 'helsingborg', 'helsinki', 'jarvenpaa', 'minneapolis', 'munchen', 'munster', 'nagoya', 'namur', 'newyork', 'norrkoping', 'omaha', 'oslo', 'ottawa', 'oygarden', 'porto', 'poznan', 'sacramento', 'santamonica', 'stalbert', 'taupo', 'turku', 'vaasa', 'vancouver', 'vantaa', 'vasteras', 'washington', 'wien']);
  });

  it('holds in each file the zones the index counts, of the kinds drawn, within the bounds that load them', async () => {
    const { CITY_ZONE_FILES } = await fresh();
    for (const city of index.cities) {
      const { default: file } = await CITY_ZONE_FILES[city.id]();
      expect(file.zones).toHaveLength(city.zones);
      expect(new Set(file.zones.map(zone => zone.id)).size).toBe(city.zones);
      for (const zone of file.zones) {
        expect(zone.id.startsWith(`${city.id}-`)).toBe(true);
        // A zone is one ring, of a kind the operators' zones have, parking, or racks or marked places only; a pavement, lines.
        if (zone.lines) {
          expect(zone.kind).toBe('pavement');
          expect(zone.lines.every(line => line.length >= 2)).toBe(true);
        } else {
          expect([...KINDS, 'racksOnly']).toContain(zone.kind);
          expect(zone.ring.length).toBeGreaterThanOrEqual(3);
        }
        expect((zone.ring ?? zone.lines.flat()).every(([lat, lng]) => boundsContainPoint(city.bounds, lat, lng))).toBe(true);
      }
      expect(city.source.url).toMatch(/^https:\/\//);
    }
    // Every point of every city's zones: 4.2 s on CI on 31 October 2026, past 5 s once Turku's came.
  }, 30_000);

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

    // A pavement, of lines, is a rule zone of lines.
    const nagoya = ZONE_CITIES.find(city => city.id === 'nagoya')!;
    const lines: [number, number][][] = [[[35.1688, 136.9086], [35.1699, 136.9087]]];
    const [pavement] = cityRuleZones(nagoya, { zones: [{ id: 'nagoya-pavement-23-1-0', kind: 'pavement', name: '普通自転車歩道通行可', lines }] });
    expect(pavement).toEqual({
      id: 'nagoya-pavement-23-1-0', place: '普通自転車歩道通行可', authority: 'Aichi police, data JARTIC', rule: 'pavement',
      timeZone: 'Asia/Tokyo', source: nagoya.source, lines,
    });
  });

  it('finds the cities a view reaches, from zoom 14 in', async () => {
    const { zoneCitiesInView } = await fresh();
    expect(zoneCitiesInView({ bounds: BERGEN_CENTRE, zoom: 14 }).map(city => city.id)).toEqual(['bergen']);
    expect(zoneCitiesInView({ bounds: PORTO_CENTRE, zoom: 17 }).map(city => city.id)).toEqual(['porto']);
    expect(zoneCitiesInView({ bounds: BOISE_DOWNTOWN, zoom: 15 }).map(city => city.id)).toEqual(['boise']);
    expect(zoneCitiesInView({ bounds: BOULDER_DOWNTOWN, zoom: 15 }).map(city => city.id)).toEqual(['boulder']);
    expect(zoneCitiesInView({ bounds: OMAHA_DOWNTOWN, zoom: 15 }).map(city => city.id)).toEqual(['omaha']);
    expect(zoneCitiesInView({ bounds: MINNEAPOLIS_RIVERFRONT, zoom: 15 }).map(city => city.id)).toEqual(['minneapolis']);
    expect(zoneCitiesInView({ bounds: OTTAWA_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['ottawa']);
    expect(zoneCitiesInView({ bounds: STRAUME_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['oygarden']);
    expect(zoneCitiesInView({ bounds: BASEL_ALTSTADT, zoom: 15 }).map(city => city.id)).toEqual(['basel']);
    expect(zoneCitiesInView({ bounds: HELSINKI_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['helsinki']);
    expect(zoneCitiesInView({ bounds: MUNCHEN_ALTSTADT, zoom: 15 }).map(city => city.id)).toEqual(['munchen']);
    expect(zoneCitiesInView({ bounds: MUNSTER_PRINZIPALMARKT, zoom: 15 }).map(city => city.id)).toEqual(['munster']);
    expect(zoneCitiesInView({ bounds: VANCOUVER_COMMERCIAL_DRIVE, zoom: 15 }).map(city => city.id)).toEqual(['vancouver']);
    expect(zoneCitiesInView({ bounds: OSLO_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['oslo']);
    expect(zoneCitiesInView({ bounds: SANTA_MONICA_PIER, zoom: 15 }).map(city => city.id)).toEqual(['santamonica']);
    expect(zoneCitiesInView({ bounds: TAUPO_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['taupo']);
    expect(zoneCitiesInView({ bounds: ALEXANDRIA_OLD_TOWN, zoom: 15 }).map(city => city.id)).toEqual(['alexandria']);
    expect(zoneCitiesInView({ bounds: ANTWERPEN_MEIR, zoom: 15 }).map(city => city.id)).toEqual(['antwerpen']);
    expect(zoneCitiesInView({ bounds: ST_ALBERT_DOWNTOWN, zoom: 15 }).map(city => city.id)).toEqual(['stalbert']);
    expect(zoneCitiesInView({ bounds: VAASA_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['vaasa']);
    expect(zoneCitiesInView({ bounds: JARVENPAA_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['jarvenpaa']);
    expect(zoneCitiesInView({ bounds: VANTAA_TIKKURILA, zoom: 15 }).map(city => city.id)).toEqual(['vantaa']);
    // Washington's bounds, a box round the District, reach over the Potomac to the cemetery and Clarendon, and Arlington County's round the cemetery.
    expect(zoneCitiesInView({ bounds: ARLINGTON_CEMETERY, zoom: 16 }).map(city => city.id)).toEqual(['arlington', 'arlingtoncemetery', 'washington']);
    expect(zoneCitiesInView({ bounds: ARLINGTON_CLARENDON, zoom: 15 }).map(city => city.id)).toEqual(['arlington', 'washington']);
    expect(zoneCitiesInView({ bounds: VASTERAS_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['vasteras']);
    expect(zoneCitiesInView({ bounds: NORRKOPING_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['norrkoping']);
    expect(zoneCitiesInView({ bounds: HELSINGBORG_CENTRE, zoom: 15 }).map(city => city.id)).toEqual(['helsingborg']);
    expect(zoneCitiesInView({ bounds: WASHINGTON_WHARF, zoom: 15 }).map(city => city.id)).toEqual(['washington']);
    expect(zoneCitiesInView({ bounds: WIEN_INNERE_STADT, zoom: 15 }).map(city => city.id)).toEqual(['wien']);
    expect(zoneCitiesInView({ bounds: SAKAE, zoom: 14 }).map(city => city.id)).toEqual(['nagoya']);
    expect(zoneCitiesInView({ bounds: PARKCHESTER, zoom: 15 }).map(city => city.id)).toEqual(['newyork']);
    expect(zoneCitiesInView({ bounds: ATLANTA_MIDTOWN, zoom: 15 }).map(city => city.id)).toEqual(['atlanta']);
    expect(zoneCitiesInView({ bounds: BALTIMORE_MOUNT_VERNON, zoom: 15 }).map(city => city.id)).toEqual(['baltimore']);
    expect(zoneCitiesInView({ bounds: COLUMBUS_HARRISON_WEST, zoom: 15 }).map(city => city.id)).toEqual(['columbus']);
    expect(zoneCitiesInView({ bounds: CITY_OF_LONDON_GUILDHALL, zoom: 15 }).map(city => city.id)).toEqual(['cityoflondon']);
    expect(zoneCitiesInView({ bounds: BERLIN_TIERGARTEN, zoom: 15 }).map(city => city.id)).toEqual(['berlin']);
    expect(zoneCitiesInView({ bounds: HAMBURG_JUNGFERNSTIEG, zoom: 15 }).map(city => city.id)).toEqual(['hamburg']);
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
      const lats = zone.ring!.map(([lat]) => lat);
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
      const lats = zone.ring!.map(([lat]) => lat);
      expect(Math.max(...lats) - Math.min(...lats), zone.id).toBeLessThan(0.02);
    }
    // Its mandatory parking zone, where a ride ends at a corral the file does not hold, is not drawn as a place to park.
    expect(file.zones.some(zone => zone.kind === 'parking')).toBe(false);
    const shown = ruleZonesInView({ bounds: BOULDER_DOWNTOWN, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['noRide', 'noParking', 'slow']));
    expect(shown.find(zone => zone.rule === 'slow' && zone.place === 'Pearl Street Mall')).toBeDefined();
  });

  it('draws the City of Omaha\'s automatic enforcement zones as no-ride zones, by their names, credited to the City', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'omaha')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.rule === 'noRide' && zone.authority === 'City of Omaha' && zone.timeZone === 'America/Chicago')).toBe(true);
    // Its 16 zones labelled "No Parking or Riding Allowed", Creighton's campus in 8 parts; the layer's unlabelled shapes are left out.
    expect(zones).toHaveLength(25);
    const shown = ruleZonesInView({ bounds: OMAHA_DOWNTOWN, zoom: 15 }, Date.now(), zones);
    expect(shown.map(zone => zone.place)).toEqual(expect.arrayContaining(['Old Market', 'Leahy Mall Redevelopment']));
  });

  it('draws the City of Minneapolis\'s no-trip-end, slow and no-riding zones, credited to the City', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'minneapolis')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of Minneapolis' && zone.timeZone === 'America/Chicago')).toBe(true);
    // Its 206 zones where a ride may not end, the bridges among them, its 8 speed-capped zones and its 21 no-riding areas, in 23 parts.
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(206);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(8);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(23);
    // Its mobility hubs, where scooters are one service among others, are no places to park.
    expect(zones.some(zone => zone.rule === 'parking')).toBe(false);
    const shown = ruleZonesInView({ bounds: MINNEAPOLIS_RIVERFRONT, zoom: 15 }, Date.now(), zones);
    expect(shown.find(zone => zone.rule === 'slow' && zone.place === 'Stone Arch Bridge')).toBeDefined();
    expect(shown.find(zone => zone.rule === 'noRide' && zone.place === 'Gold Medal Park')).toBeDefined();
  });

  it('draws the City of Ottawa\'s designated parking, slow ride zones and no-ride areas, credited to the City', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'ottawa')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of Ottawa' && zone.timeZone === 'America/Toronto')).toBe(true);
    // Its 22 designated places and 6 at transit stations, discs round their points; its no-ride area that Bird Canada may ride in is left out.
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(28);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(8);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(38);
    const shown = ruleZonesInView({ bounds: OTTAWA_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'slow', 'noRide']));
  });

  it('draws Øygarden kommune\'s no-riding, no-parking and slow zones in Straume, but not its suggested deployment points', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'oygarden')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Øygarden kommune' && zone.timeZone === 'Europe/Oslo')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(4);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(1);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(10);
    // The six it calls parking zones are the points where the kommune suggests the operators set scooters out, not where a ride must end.
    expect(zones.some(zone => zone.rule === 'parking')).toBe(false);
    const shown = ruleZonesInView({ bounds: STRAUME_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['noParking', 'slow', 'noRide']));
  });

  it('draws Basel\'s no-parking zones and the zones where shared scooters may not be used, credited to the canton under CC BY 4.0', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'basel')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Kanton Basel-Stadt, Amt für Mobilität, CC BY 4.0' && zone.timeZone === 'Europe/Zurich')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(33);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(21);
    const shown = ruleZonesInView({ bounds: BASEL_ALTSTADT, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['noParking', 'noRide']));
  });

  it('draws Helsinki\'s e-scooter parking places, credited to the city under CC BY 4.0', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'helsinki')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Helsingin kaupunki, CC BY 4.0' && zone.timeZone === 'Europe/Helsinki')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(312);
    expect(zones.every(zone => zone.rule === 'parking')).toBe(true);
    expect(ruleZonesInView({ bounds: HELSINKI_CENTRE, zoom: 15 }, Date.now(), zones).length).toBeGreaterThan(20);
  });

  it('draws München\'s lasting e-scooter parking areas, no-parking and no-riding zones, not those of building sites, credited to the city', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'munchen')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Landeshauptstadt München, Mobilitätsreferat, DL-DE BY 2.0' && zone.timeZone === 'Europe/Berlin')).toBe(true);
    // Of its 446 parking areas, the 11 suspended by building works and the 5 standing in for those until a set day are left out.
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(430);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(791);
    // 55 no-riding zones, some of several parts.
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(63);
    expect(zones.find(zone => zone.rule === 'parking' && zone.place === 'Thalkirchen')).toBeDefined();
    const shown = ruleZonesInView({ bounds: MUNCHEN_ALTSTADT, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'noRide']));
  });

  it('draws Münster\'s e-scooter parking zones and the no-parking zones round them, credited to the city', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'munster')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Stadt Münster, DL-DE BY 2.0' && zone.timeZone === 'Europe/Berlin')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(432);
    // 701 no-parking zones, two of two parts, less three slivers of under a square metre.
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(700);
    const shown = ruleZonesInView({ bounds: MUNSTER_PRINZIPALMARKT, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking']));
  });

  it('draws the City of Vancouver\'s e-scooter stations as the places to park, credited under its open government licence', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'vancouver')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of Vancouver, Open Government Licence – Vancouver' && zone.timeZone === 'America/Vancouver')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(250);
    expect(zones).toHaveLength(250);
    expect(ruleZonesInView({ bounds: VANCOUVER_COMMERCIAL_DRIVE, zoom: 15 }, Date.now(), zones).length).toBeGreaterThan(0);
  });

  it('draws the City of Alexandria\'s corrals, its no-ride zones and its slow zones where parking is forbidden too', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'alexandria')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of Alexandria' && zone.timeZone === 'America/New_York')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(63);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(13);
    // Its six slow zones, at 6 mph, are each a no-parking zone too.
    const slow = zones.filter(zone => zone.rule === 'slow').map(zone => zone.place).sort();
    expect(slow).toHaveLength(6);
    expect(zones.filter(zone => zone.rule === 'noParking').map(zone => zone.place).sort()).toEqual(slow);
    const shown = ruleZonesInView({ bounds: ALEXANDRIA_OLD_TOWN, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow']));
  });

  it('draws Antwerpen\'s zones for shared e-steps and their drop zones, named after the city where the layer names only ids', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'antwerpen')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Stad Antwerpen' && zone.timeZone === 'Europe/Brussels')).toBe(true);
    // Of its 519 drop zones, the 211 for e-steps; the others are for mopeds, cargo bikes and bikes.
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(211);
    expect(zones.find(zone => zone.rule === 'parking' && zone.place === 'Dropzone Meir 1')).toBeDefined();
    // 322 no-parking, 44 low-speed and 36 no-go zones, some of several parts.
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(330);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(45);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(38);
    expect(zones.filter(zone => zone.rule !== 'parking').every(zone => zone.place === 'Antwerpen')).toBe(true);
    const shown = ruleZonesInView({ bounds: ANTWERPEN_MEIR, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });

  it('draws the City of St. Albert\'s no-go zones as no-ride zones, credited under its open data licence', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'stalbert')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of St. Albert, Open Data License' && zone.timeZone === 'America/Edmonton')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(13);
    expect(zones).toHaveLength(13);
    const shown = ruleZonesInView({ bounds: ST_ALBERT_DOWNTOWN, zoom: 15 }, Date.now(), zones);
    expect(shown.map(zone => zone.place)).toContain("Farmer's Market");
  });

  it('draws Järvenpää\'s lasting no-riding, no-parking and 10 km/h areas, but not its temporary ones', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'jarvenpaa')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Järvenpään kaupunki' && zone.timeZone === 'Europe/Helsinki')).toBe(true);
    // Its two temporary no-parking areas are left out, and a no-riding sliver of a tenth of a square metre; its parking places are lines and not drawn.
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(48);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(10);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(81);
    expect(zones.some(zone => zone.rule === 'parking')).toBe(false);
    const shown = ruleZonesInView({ bounds: JARVENPAA_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['noParking', 'slow', 'noRide']));
  });

  it('draws Vaasa\'s parking places and its zones, but not the area where a ride may end only at one of them', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'vaasa')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Vaasan kaupunki' && zone.timeZone === 'Europe/Helsinki')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(229);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(66);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(1);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(17);
    const shown = ruleZonesInView({ bounds: VAASA_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow']));
  });

  it('draws Vantaa\'s parking places and its no-parking, slow and no-riding zones, credited to the city under CC BY 4.0', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'vantaa')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Vantaan kaupunki, CC BY 4.0' && zone.timeZone === 'Europe/Helsinki')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(76);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(29);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(7);
    // Its no-go zones, round five stations, where neither riding nor parking is allowed.
    expect(zones.filter(zone => zone.rule === 'noRide').map(zone => zone.place)).toContain('Tikkurilan asema');
    const shown = ruleZonesInView({ bounds: VANTAA_TIKKURILA, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
  });

  it('draws Arlington County\'s corrals, those installed, as the places to park, credited to the County', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'arlington')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Arlington County' && zone.timeZone === 'America/New_York')).toBe(true);
    // Its 128 installed corrals, discs round their points; those proposed, approved or removed are left out.
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(128);
    expect(zones).toHaveLength(128);
    expect(ruleZonesInView({ bounds: ARLINGTON_CLARENDON, zoom: 15 }, Date.now(), zones).length).toBeGreaterThan(0);
  });

  it('draws Atlanta\'s, Baltimore\'s and Columbus\'s corrals as the places to park, credited to each city', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    // Atlanta's installed corrals, the City's and Midtown Alliance's; those not yet built are left out.
    // Baltimore's, as its DOT's map shows them all; Columbus's, those active, physical or virtual.
    const cities = [
      { id: 'atlanta', authority: 'City of Atlanta', corrals: 19, view: ATLANTA_MIDTOWN },
      { id: 'baltimore', authority: 'Baltimore City Department of Transportation', corrals: 71, view: BALTIMORE_MOUNT_VERNON },
      { id: 'columbus', authority: 'City of Columbus', corrals: 47, view: COLUMBUS_HARRISON_WEST },
    ];
    for (const { id, authority, corrals, view } of cities) {
      await loadCityZones(ZONE_CITIES.find(city => city.id === id)!);
      const zones = cityZones.get().filter(zone => zone.id.startsWith(`${id}-`));
      expect(zones).toHaveLength(corrals);
      expect(zones.every(zone => zone.rule === 'parking' && zone.authority === authority && zone.timeZone === 'America/New_York')).toBe(true);
      expect(ruleZonesInView({ bounds: view, zoom: 15 }, Date.now(), zones).length).toBeGreaterThan(0);
    }
  });

  it('draws the City of London\'s parking places for hire scooters and bikes, each named for its street', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'cityoflondon')!);
    const zones = cityZones.get().filter(zone => zone.id.startsWith('cityoflondon-'));
    expect(zones).toHaveLength(45);
    expect(zones.every(zone => zone.rule === 'parking' && zone.authority === 'City of London Corporation' && zone.timeZone === 'Europe/London')).toBe(true);
    expect(zones.find(zone => zone.place === 'Basinghall Street')).toBeDefined();
    expect(ruleZonesInView({ bounds: CITY_OF_LONDON_GUILDHALL, zoom: 15 }, Date.now(), zones).length).toBeGreaterThan(0);
  });

  it('draws Oslo kommune\'s zones, those of every day: Marka\'s no-riding area but not the school yards\', no-riding on weekdays', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'oslo')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Oslo kommune' && zone.timeZone === 'Europe/Oslo')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(262);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(366);
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(129);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(78);
    expect(zones.some(zone => zone.place === 'Kjøreforbud Marka')).toBe(true);
    expect(zones.some(zone => zone.place === 'Kjøreforbud skolegårder')).toBe(false);
    const shown = ruleZonesInView({ bounds: OSLO_CENTRE, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
  });

  it('draws the City of Santa Monica\'s drop zones and no-riding areas, credited to the City under ODC-By 1.0', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'santamonica')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'City of Santa Monica, ODC-By 1.0' && zone.timeZone === 'America/Los_Angeles')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(184);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(28);
    const shown = ruleZonesInView({ bounds: SANTA_MONICA_PIER, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noRide']));
  });

  it('draws DDOT\'s corrals and its zones of no parking, no riding and slow riding, credited to it', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'washington')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'District Department of Transportation' && zone.timeZone === 'America/New_York')).toBe(true);
    // Its 259 in-street corrals; its 252 no-parking zones, in parts; its no-riding layer's 58 zones, those of 0 mph no riding.
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(259);
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(365);
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(51);
    expect(zones.filter(zone => zone.rule === 'slow').map(zone => zone.place)).toContain('Wharf - 5 MPH speed limit');
    const shown = ruleZonesInView({ bounds: WASHINGTON_WHARF, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(KINDS));
  });

  it('draws the Taupō District Council\'s no-parking areas and its town centre\'s slow area, credited to the council under CC BY 4.0', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'taupo')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Taupō District Council, CC BY 4.0' && zone.timeZone === 'Pacific/Auckland')).toBe(true);
    // Its operations area, where the scooters may go at all, is not drawn.
    expect(zones.map(zone => zone.rule).sort()).toEqual(['noParking', 'noParking', 'noParking', 'noParking', 'slow']);
    expect(ruleZonesInView({ bounds: TAUPO_CENTRE, zoom: 15 }, Date.now(), zones)).toHaveLength(5);
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
      const lats = zone.ring!.map(([lat]) => lat);
      const lngs = zone.ring!.map(([, lng]) => lng);
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
    const ring = file.zones.find(zone => zone.id === 'vasteras-no-parking-356')!.ring!;
    expect(winding(ring, 59.6265, 16.59928)).toBe(0);
    expect(Math.abs(winding(ring, 59.62697, 16.5983))).toBe(1);
    // An area of two parts is two zones.
    expect(file.zones.filter(zone => zone.id.startsWith('vasteras-no-parking-588-')).map(zone => zone.id))
      .toEqual(['vasteras-no-parking-588-1', 'vasteras-no-parking-588-2']);
  });

  it('draws New York\'s e-scooter parking corrals in the East Bronx and Eastern Queens, credited to its DOT', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'newyork')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'NYC Department of Transportation' && zone.timeZone === 'America/New_York')).toBe(true);
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(538);
    expect(zones.every(zone => zone.rule === 'parking')).toBe(true);
    expect(zones.find(zone => zone.place === 'Watson Avenue & Morrison Avenue')).toBeDefined();
    expect(ruleZonesInView({ bounds: PARKCHESTER, zoom: 15 }, Date.now(), zones).length).toBeGreaterThan(10);
  });

  it('draws Wien\'s lasting zones of every hour, credited to the city under CC BY 4.0', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    await loadCityZones(ZONE_CITIES.find(city => city.id === 'wien')!);
    const zones = cityZones.get();
    expect(zones.every(zone => zone.authority === 'Stadt Wien – data.wien.gv.at, CC BY 4.0' && zone.timeZone === 'Europe/Vienna')).toBe(true);
    // Of its 408 parking areas, the 6 given up on 30 October 2026 are left out.
    expect(zones.filter(zone => zone.rule === 'parking')).toHaveLength(402);
    // The 100 m round each parking area, where a scooter is parked only in it.
    expect(zones.filter(zone => zone.rule === 'noParking')).toHaveLength(392);
    // Of its 900 no-riding zones, the Naschmarkt's flea market, on Saturdays only, is left out.
    expect(zones.filter(zone => zone.rule === 'noRide')).toHaveLength(899);
    // Walking pace in 271 residential streets and pedestrian zones, less 3 that ended in 2024, and 20 km/h in 24 shared spaces.
    expect(zones.filter(zone => zone.rule === 'slow')).toHaveLength(295);
    expect(zones.find(zone => zone.rule === 'noRide' && zone.place === 'Türkenschanzpark')).toBeDefined();
    const shown = ruleZonesInView({ bounds: WIEN_INNERE_STADT, zoom: 15 }, Date.now(), zones);
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'noRide', 'slow']));
  });

  it('draws Nagoya\'s pavements where a scooter may ride as lines, credited to the Aichi police and JARTIC', async () => {
    const { ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const nagoya = ZONE_CITIES.find(city => city.id === 'nagoya')!;
    await loadCityZones(nagoya);
    const zones = cityZones.get();
    expect(zones).toHaveLength(1801);
    expect(zones.every(zone => zone.rule === 'pavement' && zone.lines && !zone.ring
      && zone.authority === 'Aichi police, data JARTIC' && zone.timeZone === 'Asia/Tokyo')).toBe(true);
    // The legend's link says what the lines mean for a rider, and gives the credit JARTIC's terms ask for.
    expect(nagoya.source).toEqual({ url: 'https://www.npa.go.jp/bureau/traffic/anzen/tokuteikogata.html', title: expect.stringContaining('6 km/h') });
    expect(nagoya.source.title.endsWith(JARTIC_CREDIT)).toBe(true);
    // Each id holds from month to month: the old key of the line's record and its points, not the month's key.
    expect(zones.every(zone => /^nagoya-pavement-23-[0-9a-z]+-[0-9a-f]{8}$/.test(zone.id))).toBe(true);
    // Sakae at zoom 14: over a hundred lines, drawn as lines, with no band round them.
    const shown = ruleZonesInView({ bounds: SAKAE, zoom: 14 }, Date.now(), zones);
    expect(shown.length).toBeGreaterThan(100);
    expect(shown.every(zone => zone.inForce && zone.polygons.length === 0)).toBe(true);
    expect(ruleZonesInView({ bounds: SAKAE, zoom: 13 }, Date.now(), zones)).toEqual([]);
  });

  it('draws central Helsingborg, where scooters park only in racks or marked places, from its local traffic rule', async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const helsingborg = ZONE_CITIES.find(city => city.id === 'helsingborg')!;
    await loadCityZones(helsingborg);
    const zones = cityZones.get();
    expect(zones.map(({ id, rule, place, authority, timeZone }) => ({ id, rule, place, authority, timeZone }))).toEqual([{
      id: 'helsingborg-racks-only-1283-2022-502', rule: 'racksOnly', place: '1283 2022:502',
      authority: 'Helsingborgs stad', timeZone: 'Europe/Stockholm' }]);
    // The legend links the rule in Transportstyrelsen's register.
    expect(helsingborg.source.url).toMatch(/^https:\/\/rdt\.transportstyrelsen\.se\/rdt\/AF06_View\.aspx\?.*ForeskriftId=670e14f8-a3d8-447a-ae02-8021396b466a/);
    expect(helsingborg.source.title).toContain('1283 2022:502');
    // About 3.9 km², the rule's area, round the old town and the station but not Ramlösa.
    const { default: file } = await CITY_ZONE_FILES.helsingborg();
    const ring = file.zones[0].ring!;
    const area = Math.abs(ring.reduce((sum, [lat0, lng0], index) => {
      const [lat1, lng1] = ring[(index + 1) % ring.length];
      return sum + (lng0 * lat1 - lng1 * lat0);
    }, 0)) / 2 * 110_540 * 62_300;
    expect(area / 1e6).toBeCloseTo(3.9, 1);
    expect(Math.abs(winding(ring, 56.0475, 12.6946))).toBe(1);
    expect(Math.abs(winding(ring, 56.0436, 12.695))).toBe(1);
    expect(winding(ring, 56.0225, 12.727)).toBe(0);
    expect(ruleZonesInView({ bounds: HELSINGBORG_CENTRE, zoom: 15 }, Date.now(), zones).map(zone => zone.rule)).toEqual(['racksOnly']);
    expect(ruleZonesInView({ bounds: HELSINGBORG_RAMLOSA, zoom: 15 }, Date.now(), zones)).toEqual([]);
  });

  it("draws Namur's reserved places and its centre, where a scooter is parked only in one, from the Ville's open data", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const namur = ZONE_CITIES.find(city => city.id === 'namur')!;
    expect(namur.authority).toBe('Ville de Namur, CC BY 4.0');
    expect(namur.source.url).toBe('https://www.namur.be/fr/ma-ville/mobilite/mobilite/deplacement/trottinette');
    // 63 signed places and 82 in the operator's app, the centre and nine other areas reserved-places-only,
    // 42 no-parking zones and 3 no-go zones; the operations area is not drawn.
    const { default: file } = await CITY_ZONE_FILES.namur();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 145, racksOnly: 10, noParking: 42, noRide: 3 });
    expect(file.zones.find(zone => zone.name === "3. Rue d'Arquet - P Malin")?.kind).toBe('parking');
    // The centre's zone holds the Place d'Armes and the station.
    const centre = file.zones.filter(zone => zone.kind === 'racksOnly' && Math.abs(winding(zone.ring!, 50.4626, 4.8677)) === 1);
    expect(centre).toHaveLength(1);
    expect(Math.abs(winding(centre[0].ring!, 50.4686, 4.8622))).toBe(1);
    await loadCityZones(namur);
    const shown = ruleZonesInView({ bounds: NAMUR_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'parking', 'noParking']));
  });

  it("draws Poznań's Hop & Go points and the zone where a shared scooter is left only at one, from the city roads authority's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const poznan = ZONE_CITIES.find(city => city.id === 'poznan')!;
    expect(poznan.authority).toBe('ZDM Poznań');
    expect(poznan.timeZone).toBe('Europe/Warsaw');
    // Its 270 points not marked inactive, drawn as discs, and the zone of the paid parking zones.
    const { default: file } = await CITY_ZONE_FILES.poznan();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 270, racksOnly: 1 });
    expect(file.zones.find(zone => zone.name === 'Kosińskiego - Prądzyńskiego')?.kind).toBe('parking');
    // The zone holds the Old Market Square and Jeżyce's market.
    const zone = file.zones.find(zone => zone.kind === 'racksOnly')!;
    expect(Math.abs(winding(zone.ring!, 52.4083, 16.9335))).toBe(1);
    expect(Math.abs(winding(zone.ring!, 52.4089, 16.905))).toBe(1);
    await loadCityZones(poznan);
    const shown = ruleZonesInView({ bounds: POZNAN_OLD_TOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'parking']));
  });

  it("draws the City of Sacramento's drop zones, from its layer of bike racks", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const sacramento = ZONE_CITIES.find(city => city.id === 'sacramento')!;
    expect(sacramento.authority).toBe('City of Sacramento');
    // Its 45 drop zones, points drawn as discs; its other bike racks, where a scooter may be parked too, are not drawn.
    const { default: file } = await CITY_ZONE_FILES.sacramento();
    expect(file.zones).toHaveLength(45);
    expect(file.zones.every(zone => zone.kind === 'parking' && zone.name === 'Drop zone')).toBe(true);
    await loadCityZones(sacramento);
    const shown = ruleZonesInView({ bounds: SACRAMENTO_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(20);
  });

  it("draws Turku's parking places and its no-parking, slow and no-riding areas, from the city's open map services", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const turku = ZONE_CITIES.find(city => city.id === 'turku')!;
    expect(turku.authority).toBe('Turun kaupunki, CC BY 4.0');
    expect(turku.timeZone).toBe('Europe/Helsinki');
    // Its 126 parking places, points drawn as discs; its areas' few stray points, each inside an area of its kind, are left out.
    const { default: file } = await CITY_ZONE_FILES.turku();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 126, noParking: 150, slow: 24, noRide: 157 });
    expect(file.zones.find(zone => zone.name === 'Kakola Hotel')?.kind).toBe('parking');
    await loadCityZones(turku);
    const shown = ruleZonesInView({ bounds: TURKU_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });
});
