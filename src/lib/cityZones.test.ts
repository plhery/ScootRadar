import { readdirSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import index from '../../data/city-zones.json';
import { boundsContainPoint } from './geo';
import { ruleInForce, ruleZonesInView } from './ruleZones';

// Around Bergen's Torget and Bryggen, at zoom 14 on a phone.
const BERGEN_CENTRE = { south: 60.388, west: 5.305, north: 60.405, east: 5.345 };
// Porto's Baixa, from the Sé and São Bento station up the Avenida dos Aliados.
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
// Münster's Prinzipalmarkt, between the Dom and the Ludgeristraße.
const MUNSTER_PRINZIPALMARKT = { south: 51.958, west: 7.62, north: 51.965, east: 7.635 };
// Vancouver's Commercial Drive, in Grandview-Woodland.
const VANCOUVER_COMMERCIAL_DRIVE = { south: 49.265, west: -123.075, north: 49.28, east: -123.06 };
// The Old Market and the Gene Leahy Mall, in downtown Omaha.
const OMAHA_DOWNTOWN = { south: 41.252, west: -95.94, north: 41.262, east: -95.922 };
// Aachen's centre, from the Dom and the Markt to the Elisenbrunnen.
const AACHEN_CENTRE = { south: 50.77, west: 6.075, north: 50.78, east: 6.095 };
// Alexandria's Old Town, from Market Square down King Street to the waterfront.
const ALEXANDRIA_OLD_TOWN = { south: 38.8, west: -77.05, north: 38.81, east: -77.035 };
// Antwerpen's Meir and Groenplaats.
const ANTWERPEN_MEIR = { south: 51.215, west: 4.395, north: 51.222, east: 4.41 };
// Oslo's Karl Johans gate, from the Slottsplassen to Oslo S.
const OSLO_CENTRE = { south: 59.909, west: 10.725, north: 59.92, east: 10.755 };
// Santa Monica's Pier, the Promenade and Palisades Park's south end.
const SANTA_MONICA_PIER = { south: 34.006, west: -118.502, north: 34.019, east: -118.485 };
// Bordeaux's centre, from the Place Pey-Berland to the Grand Théâtre.
const BORDEAUX_CENTRE = { south: 44.835, west: -0.585, north: 44.845, east: -0.57 };
// Braunschweig's old town, from the Altstadtmarkt by the Kohlmarkt and the Burgplatz to the Schlossplatz.
const BRAUNSCHWEIG_ALTSTADT = { south: 52.259, west: 10.512, north: 52.267, east: 10.532 };
// Lambeth's Vauxhall, from Vauxhall Cross to the Oval.
const LAMBETH_VAUXHALL = { south: 51.483, west: -0.13, north: 51.49, east: -0.115 };
// Norfolk's downtown, Granby Street from City Hall Avenue to Olney Road.
const NORFOLK_DOWNTOWN = { south: 36.844, west: -76.296, north: 36.857, east: -76.287 };
// Poznań's Old Market Square and the streets round it.
const POZNAN_OLD_TOWN = { south: 52.404, west: 16.92, north: 52.412, east: 16.94 };
// Budapest's inner city, from Deák Ferenc tér to the Opera and Oktogon.
const BUDAPEST_BELVAROS = { south: 47.494, west: 19.048, north: 47.507, east: 19.066 };
// Kraków's Old Town, from the Rynek Główny to the Planty and Basztowa.
const KRAKOW_OLD_TOWN = { south: 50.056, west: 19.93, north: 50.068, east: 19.945 };
// Rome's Prati, from Piazza Cavour to Via Cola di Rienzo and Viale Giulio Cesare.
const ROMA_PRATI = { south: 41.903, west: 12.458, north: 41.913, east: 12.474 };
// Vilnius's Old Town, from the Cathedral Square down Pilies gatvė to the Town Hall.
const VILNIUS_OLD_TOWN = { south: 54.678, west: 25.278, north: 54.688, east: 25.295 };
// Lisboa's Baixa, from the Praça do Comércio to the Rossio.
const LISBOA_BAIXA = { south: 38.706, west: -9.145, north: 38.716, east: -9.13 };
// Le Chesnay-Rocquencourt's centre, round the town hall on the rue Pottier.
const LE_CHESNAY_CENTRE = { south: 48.822, west: 2.118, north: 48.832, east: 2.132 };
// Reykjavík's centre, from Austurvöllur to Hallgrímskirkja.
const REYKJAVIK_CENTRE = { south: 64.141, west: -21.945, north: 64.149, east: -21.925 };
// Rīga's old town, from the Dom to the Freedom Monument.
const RIGA_OLD_TOWN = { south: 56.945, west: 24.1, north: 56.953, east: 24.12 };
// Rostock's old town, from the Kröpeliner Tor along the Kröpeliner Straße to the Neuer Markt.
const ROSTOCK_ALTSTADT = { south: 54.086, west: 12.125, north: 54.093, east: 12.146 };
// Sacramento's downtown, from Old Sacramento to the State Capitol.
const SACRAMENTO_DOWNTOWN = { south: 38.574, west: -121.506, north: 38.584, east: -121.488 };
// San Francisco's Embarcadero, from the Ferry Building to Pier 9, and Chinatown.
const SAN_FRANCISCO_EMBARCADERO = { south: 37.79, west: -122.41, north: 37.805, east: -122.39 };
// Seattle's downtown, from Pioneer Square to Westlake.
const SEATTLE_DOWNTOWN = { south: 47.6, west: -122.345, north: 47.615, east: -122.325 };
// St. Albert's downtown, round St. Anne Street, where the Farmers' Market is held.
const ST_ALBERT_DOWNTOWN = { south: 53.627, west: -113.64, north: 53.637, east: -113.62 };
// Stockholm's Norrmalm, from Gustav Adolfs torg to Stureplan and Nybroplan.
const STOCKHOLM_NORRMALM = { south: 59.323, west: 18.06, north: 59.337, east: 18.08 };
// Taupō's town centre by the lake, with its four no-parking areas and the 15 km/h area.
const TAUPO_CENTRE = { south: -38.692, west: 176.066, north: -38.684, east: 176.076 };
// Trondheim's Midtbyen, from the Nidaros Cathedral to Torvet.
const TRONDHEIM_MIDTBYEN = { south: 63.425, west: 10.38, north: 63.437, east: 10.41 };
// Turku's market square, the cathedral and the river between them.
const TURKU_CENTRE = { south: 60.448, west: 22.255, north: 60.456, east: 22.28 };
// Zürich's centre, the main station, Bahnhofstrasse and the Niederdorf.
const ZURICH = { south: 47.36, west: 8.53, north: 47.38, east: 8.55 };
// Genève's centre, from the Pont du Mont-Blanc to the old town, where no city zones are drawn.
const GENEVE = { south: 46.2, west: 6.14, north: 46.21, east: 6.155 };
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
// Cleveland's downtown, round Public Square.
const CLEVELAND_DOWNTOWN = { south: 41.495, west: -81.7, north: 41.51, east: -81.68 };
// Downtown Tampa, round Franklin Street.
const TAMPA_DOWNTOWN = { south: 27.943, west: -82.462, north: 27.952, east: -82.452 };
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
// Halmstad's centre, from Stora torg and the Nissan's banks to Resecentrum.
const HALMSTAD_CENTRE = { south: 56.668, west: 12.85, north: 56.68, east: 12.87 };
// Stavanger's centre, from Torget and the Domkirken to Nytorget and Breiavatnet.
const STAVANGER_SENTRUM = { south: 58.966, west: 5.722, north: 58.975, east: 5.742 };
// Downtown Long Beach, from the Aquarium and Shoreline Village to the Convention Center and the beach path.
const LONG_BEACH_DOWNTOWN = { south: 33.758, west: -118.2, north: 33.769, east: -118.18 };
// Nashville's Lower Broadway and Second Avenue, by the Ryman and the Music City Center.
const NASHVILLE_DOWNTOWN = { south: 36.157, west: -86.785, north: 36.167, east: -86.772 };
// Downtown Dallas and Deep Ellum, from Klyde Warren Park to the corrals on Elm and Main Streets.
const DALLAS_DOWNTOWN = { south: 32.774, west: -96.81, north: 32.8, east: -96.78 };
// Downtown Milwaukee, from the Riverwalk and the Third Ward to Marquette's campus.
const MILWAUKEE_DOWNTOWN = { south: 43.028, west: -87.93, north: 43.045, east: -87.895 };
// Downtown Salt Lake City, from Temple Square and the Gateway to Library Square.
const SALT_LAKE_DOWNTOWN = { south: 40.758, west: -111.905, north: 40.772, east: -111.88 };
// Downtown San Antonio, the River Walk, Hemisfair and San Pedro Creek.
const SAN_ANTONIO_DOWNTOWN = { south: 29.415, west: -98.5, north: 29.43, east: -98.48 };
// Baltimore's Inner Harbor, from Camden Yards to the promenade.
const BALTIMORE_INNER_HARBOR = { south: 39.278, west: -76.625, north: 39.29, east: -76.6 };
// Plymouth's city centre, from Royal Parade and Civic Square to the Armada Way.
const PLYMOUTH_CENTRE = { south: 50.366, west: -4.15, north: 50.374, east: -4.132 };
// Leeds's centre, from the station and the Town Hall to Victoria Gate.
const LEEDS_CENTRE = { south: 53.794, west: -1.555, north: 53.802, east: -1.535 };
// Downtown Orlando, from Church Street to Lake Eola.
const ORLANDO_DOWNTOWN = { south: 28.536, west: -81.384, north: 28.548, east: -81.368 };
// Denver's Lower Downtown, from Union Station along Blake and Larimer Streets.
const DENVER_LODO = { south: 39.745, west: -105.005, north: 39.756, east: -104.99 };
// Stuttgart's centre, from the Schlossplatz and the Königstraße to the Marktplatz and the Leonhardsviertel.
const STUTTGART_CENTRE = { south: 48.772, west: 9.17, north: 48.782, east: 9.185 };
// Düsseldorf's Altstadt and the Königsallee, from the Burgplatz to the Kö-Bogen.
const DUSSELDORF_ALTSTADT = { south: 51.222, west: 6.77, north: 51.23, east: 6.785 };
// Augsburg's centre, from the Königsplatz to the Rathausplatz and the Obstmarkt.
const AUGSBURG_CENTRE = { south: 48.364, west: 10.89, north: 48.372, east: 10.905 };
// Mülheim an der Ruhr's centre, round the Schloßstraße and the Hauptbahnhof.
const MULHEIM_CENTRE = { south: 51.424, west: 6.875, north: 51.432, east: 6.89 };
// Nürnberg's old town, round the Hauptmarkt and the Lorenzkirche.
const NURNBERG_ALTSTADT = { south: 49.449, west: 11.07, north: 49.457, east: 11.085 };
// Kassel's centre, round the Königsplatz and the Friedrichsplatz.
const KASSEL_CENTRE = { south: 51.312, west: 9.49, north: 51.32, east: 9.505 };
// Downtown Austin, from Lady Bird Lake's north shore and Republic Square to the Capitol.
const AUSTIN_DOWNTOWN = { south: 30.258, west: -97.75, north: 30.276, east: -97.735 };
// Downtown Phoenix, from Chase Field and City Hall to Roosevelt Street.
const PHOENIX_DOWNTOWN = { south: 33.444, west: -112.08, north: 33.458, east: -112.066 };
// The University of Florida's historic core, from the Reitz Union to the Plaza of the Americas.
const UF_HISTORIC_CORE = { south: 29.643, west: -82.35, north: 29.652, east: -82.338 };
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
    expect(ZONE_CITIES.map(city => city.id).sort()).toEqual(['aachen', 'alexandria', 'antwerpen', 'arlington', 'arlingtoncemetery', 'atlanta', 'augsburg', 'austin', 'baltimore', 'basel', 'bergen', 'berlin', 'boise', 'bordeaux', 'boulder', 'braunschweig', 'budapest', 'cityoflondon', 'cleveland', 'columbus', 'dallas', 'denver', 'dusseldorf', 'halmstad', 'hamburg', 'helsingborg', 'helsinki', 'jarvenpaa', 'kassel', 'krakow', 'lambeth', 'lechesnayrocquencourt', 'leeds', 'lisboa', 'longbeach', 'milwaukee', 'minneapolis', 'mulheim', 'munchen', 'munster', 'nagoya', 'namur', 'nashville', 'newyork', 'norfolk', 'norrkoping', 'nurnberg', 'omaha', 'orlando', 'oslo', 'ottawa', 'oygarden', 'phoenix', 'plymouth', 'porto', 'poznan', 'raleigh', 'reykjavik', 'riga', 'roma', 'rostock', 'sacramento', 'saltlakecity', 'sanantonio', 'sanfrancisco', 'santamonica', 'seattle', 'stalbert', 'stavanger', 'stockholm', 'stuttgart', 'tampa', 'taupo', 'trondheim', 'turku', 'universityofflorida', 'vaasa', 'vancouver', 'vantaa', 'vasteras', 'vilnius', 'washington', 'wien', 'zurich']);
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
    expect(zoneCitiesInView({ bounds: ZURICH, zoom: 16 }).map(city => city.id)).toEqual(['zurich']);
    expect(zoneCitiesInView({ bounds: GENEVE, zoom: 16 })).toEqual([]);
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
      const zones = cityZones.get().filter(zone => zone.id.startsWith(`${id}-`) && zone.rule === 'parking');
      expect(zones).toHaveLength(corrals);
      expect(zones.every(zone => zone.authority === authority && zone.timeZone === 'America/New_York')).toBe(true);
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

  it("draws Aachen's parking areas for e-scooters and the no-parking zones round them, under the Datenlizenz Deutschland", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const aachen = ZONE_CITIES.find(city => city.id === 'aachen')!;
    expect(aachen.authority).toBe('Stadt Aachen (2026), DL-DE BY 2.0');
    expect(aachen.timeZone).toBe('Europe/Berlin');
    // Its 23 parking areas set up, those still provisional not drawn, and its 6 no-parking zones, the centre's of 67 parts.
    const { default: file } = await CITY_ZONE_FILES.aachen();
    const counts = Object.fromEntries(['parking', 'noParking'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 23, noParking: 72 });
    // The Dom is in the centre's no-parking zone, and Löhergraben 34's parking area in a hole of it.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind);
    expect(at(50.7747, 6.0839)).toEqual(['noParking']);
    expect(file.zones.find(zone => zone.name === 'Löhergraben 34')?.kind).toBe('parking');
    expect(at(50.77279, 6.07761)).toEqual(['parking']);
    await loadCityZones(aachen);
    const shown = ruleZonesInView({ bounds: AACHEN_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking']));
  });

  it("draws Bordeaux Métropole's places for shared e-scooters, from its open data under the Licence Ouverte", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const bordeaux = ZONE_CITIES.find(city => city.id === 'bordeaux')!;
    expect(bordeaux.authority).toBe('Bordeaux Métropole, Licence Ouverte');
    expect(bordeaux.timeZone).toBe('Europe/Paris');
    // Its 556 places for bikes and e-scooters, each named for its commune; those for bikes or mopeds alone are not drawn.
    const { default: file } = await CITY_ZONE_FILES.bordeaux();
    expect(file.zones).toHaveLength(556);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    expect(file.zones.filter(zone => zone.name === 'Mérignac')).toHaveLength(52);
    await loadCityZones(bordeaux);
    const shown = ruleZonesInView({ bounds: BORDEAUX_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(20);
  });

  it("draws Braunschweig's parking places, its old town where a scooter is parked only at one, and its no-parking zones, credited to the city under CC BY 4.0", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const braunschweig = ZONE_CITIES.find(city => city.id === 'braunschweig')!;
    expect(braunschweig.authority).toBe('Stadt Braunschweig, CC BY 4.0');
    // 29 parking places in force, of 35 parts, the old town within the Oker, of 9, and 54 no-parking zones, of 59;
    // the places set until a day, as An der Martinikirche until 28 October 2026, are not drawn.
    const { default: file } = await CITY_ZONE_FILES.braunschweig();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 35, racksOnly: 9, noParking: 59 });
    expect(file.zones.find(zone => zone.name === 'Abelnkarre')?.kind).toBe('parking');
    expect(file.zones.some(zone => zone.name === 'An der Martinikirche')).toBe(false);
    // The old town holds the Kohlmarkt, but not the pedestrian zone's Burgplatz, a no-parking zone.
    const oldTown = file.zones.filter(zone => zone.kind === 'racksOnly');
    expect(oldTown.filter(zone => Math.abs(winding(zone.ring!, 52.2619, 10.5196)) === 1)).toHaveLength(1);
    expect(oldTown.filter(zone => Math.abs(winding(zone.ring!, 52.2641, 10.5236)) === 1)).toHaveLength(0);
    expect(file.zones.find(zone => zone.name === 'Fußgängerzone')?.kind).toBe('noParking');
    await loadCityZones(braunschweig);
    const shown = ruleZonesInView({ bounds: BRAUNSCHWEIG_ALTSTADT, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'parking', 'noParking']));
  });

  it("draws Lambeth's parking bays and the borough, where a rental scooter is left only in one, from the council's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const lambeth = ZONE_CITIES.find(city => city.id === 'lambeth')!;
    expect(lambeth.authority).toBe('Lambeth Council');
    expect(lambeth.timeZone).toBe('Europe/London');
    // Its 342 bays and Transport for London's 4, points drawn as discs, and the borough's outline.
    const { default: file } = await CITY_ZONE_FILES.lambeth();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 346, racksOnly: 1 });
    expect(file.zones.find(zone => zone.name === 'Goding Street')?.kind).toBe('parking');
    expect(file.zones.find(zone => zone.name === 'Brixton Hill')?.kind).toBe('parking');
    // The borough holds Brixton and the Oval, not Parliament Square across the river.
    const zone = file.zones.find(zone => zone.kind === 'racksOnly')!;
    expect(Math.abs(winding(zone.ring!, 51.4613, -0.1145))).toBe(1);
    expect(Math.abs(winding(zone.ring!, 51.4837, -0.115))).toBe(1);
    expect(winding(zone.ring!, 51.5005, -0.1265)).toBe(0);
    await loadCityZones(lambeth);
    const shown = ruleZonesInView({ bounds: LAMBETH_VAUXHALL, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'parking']));
  });

  it("draws the City of Cleveland's shared mobility hubs, from its open data under the ODbL", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const cleveland = ZONE_CITIES.find(city => city.id === 'cleveland')!;
    expect(cleveland.authority).toBe('City of Cleveland, ODbL');
    expect(cleveland.timeZone).toBe('America/New_York');
    // Its 95 hubs, 71 in Cleveland and 24 in four suburbs, points drawn as discs.
    const { default: file } = await CITY_ZONE_FILES.cleveland();
    expect(file.zones).toHaveLength(95);
    expect(file.zones.every(zone => zone.kind === 'parking' && zone.name === 'Shared mobility hub')).toBe(true);
    await loadCityZones(cleveland);
    const shown = ruleZonesInView({ bounds: CLEVELAND_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(10);
  });

  it("draws the City of Tampa's multi-use hubs and public bike racks, from its GeoHub under CC0", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const tampa = ZONE_CITIES.find(city => city.id === 'tampa')!;
    expect(tampa.authority).toBe('City of Tampa, CC0');
    expect(tampa.timeZone).toBe('America/New_York');
    // Its 67 hubs and 92 racks, points drawn as discs; the six it marks secure, five of them racks in its garages, are left out.
    const { default: file } = await CITY_ZONE_FILES.tampa();
    expect(file.zones.filter(zone => zone.name === 'Multi-use hub')).toHaveLength(67);
    expect(file.zones.filter(zone => zone.name === 'Public bike rack')).toHaveLength(92);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    await loadCityZones(tampa);
    const shown = ruleZonesInView({ bounds: TAMPA_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(30);
  });

  it("draws the City of Norfolk's micromobility corrals, from its bike network map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const norfolk = ZONE_CITIES.find(city => city.id === 'norfolk')!;
    expect(norfolk.authority).toBe('City of Norfolk');
    expect(norfolk.timeZone).toBe('America/New_York');
    // Its 23 existing corrals, each named for its place; the proposed ones are not drawn.
    const { default: file } = await CITY_ZONE_FILES.norfolk();
    expect(file.zones).toHaveLength(23);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    expect(file.zones.find(zone => zone.id === 'norfolk-parking-1')?.name).toBe('Granby Street - 100 block');
    await loadCityZones(norfolk);
    const shown = ruleZonesInView({ bounds: NORFOLK_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(10);
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

  it("draws Budapest's Mobi-pontok and the zones where a shared scooter is placed only at one, from Budapest Közút's layers", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const budapest = ZONE_CITIES.find(city => city.id === 'budapest')!;
    expect(budapest.authority).toBe('Budapest Közút');
    expect(budapest.timeZone).toBe('Europe/Budapest');
    // Its 1,122 active points, drawn as discs, and its 9 zones, named by their kind's coded value.
    const { default: file } = await CITY_ZONE_FILES.budapest();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 1122, racksOnly: 9 });
    const names = file.zones.filter(zone => zone.kind === 'racksOnly').map(zone => zone.name);
    expect(names.filter(name => name === 'Belvárosi zóna').length).toBe(2);
    expect(names.filter(name => name === 'Átmeneti zóna').length).toBe(6);
    expect(names.filter(name => name === 'Külvárosi centrum zóna').length).toBe(1);
    const baross = file.zones.find(zone => zone.name === 'Baross tér 4.')!.ring!;
    const [lat, lng] = [baross.reduce((sum, [y]) => sum + y, 0) / baross.length, baross.reduce((sum, [, x]) => sum + x, 0) / baross.length];
    expect(Math.abs(lat - 47.499267) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 19.080471) * 75_200).toBeLessThan(2);
    // Deák Ferenc tér and Gellért tér are in the inner city, on either bank; Újpest's centre floats freely.
    const at = (lat: number, lng: number) => file.zones.filter(zone => zone.kind === 'racksOnly' && Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(47.4979, 19.0544)).toEqual(['Belvárosi zóna']);
    expect(at(47.4836, 19.0526)).toEqual(['Belvárosi zóna']);
    expect(at(47.56, 19.09)).toEqual([]);
    await loadCityZones(budapest);
    const shown = ruleZonesInView({ bounds: BUDAPEST_BELVAROS, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'parking']));
  });

  it("draws Kraków's mobility points and the area where a shared scooter is left only at one, from the ZTP's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const krakow = ZONE_CITIES.find(city => city.id === 'krakow')!;
    expect(krakow.authority).toBe('ZTP Kraków');
    expect(krakow.timeZone).toBe('Europe/Warsaw');
    // Its 342 mobility points, drawn as discs, and the area round them.
    const { default: file } = await CITY_ZONE_FILES.krakow();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 342, racksOnly: 1 });
    const basztowa = file.zones.find(zone => zone.name === 'Basztowa')!.ring!;
    const [lat, lng] = [basztowa.reduce((sum, [y]) => sum + y, 0) / basztowa.length, basztowa.reduce((sum, [, x]) => sum + x, 0) / basztowa.length];
    expect(Math.abs(lat - 50.066319) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 19.938538) * 71_600).toBeLessThan(2);
    // The area holds the Rynek Główny and the Wawel, not Nowa Huta.
    const area = file.zones.find(zone => zone.kind === 'racksOnly')!;
    expect(Math.abs(winding(area.ring!, 50.0617, 19.9373))).toBe(1);
    expect(Math.abs(winding(area.ring!, 50.054, 19.9354))).toBe(1);
    expect(winding(area.ring!, 50.07, 20.04)).toBe(0);
    await loadCityZones(krakow);
    const shown = ruleZonesInView({ bounds: KRAKOW_OLD_TOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'parking']));
  });

  it("draws Rome's 13 parking areas for sharing bikes and scooters, from Roma Servizi per la Mobilità's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const roma = ZONE_CITIES.find(city => city.id === 'roma')!;
    expect(roma.authority).toBe('Roma Servizi per la Mobilità');
    expect(roma.timeZone).toBe('Europe/Rome');
    const { default: file } = await CITY_ZONE_FILES.roma();
    expect(file.zones.map(zone => zone.kind)).toEqual(Array(13).fill('parking'));
    const cola = file.zones.find(zone => zone.name === 'Via Cola di Rienzo')!.ring!;
    const [lat, lng] = [cola.reduce((sum, [y]) => sum + y, 0) / cola.length, cola.reduce((sum, [, x]) => sum + x, 0) / cola.length];
    expect(Math.abs(lat - 41.90919) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 12.46884) * 82_900).toBeLessThan(2);
    await loadCityZones(roma);
    const shown = ruleZonesInView({ bounds: ROMA_PRATI, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBe(6);
  });

  it("draws Vilnius's parking places, the zone where a shared scooter is left only at one, its no-parking and 12 km/h zones and the three streets where riding is banned, from JUDU's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const vilnius = ZONE_CITIES.find(city => city.id === 'vilnius')!;
    expect(vilnius.authority).toBe('JUDU');
    expect(vilnius.timeZone).toBe('Europe/Vilnius');
    // Its 837 parking places marked installed, drawn as discs, and the 47 parts of its restricted parking zone.
    const { default: file } = await CITY_ZONE_FILES.vilnius();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 837, racksOnly: 47, noParking: 119, slow: 58, noRide: 3 });
    const place = file.zones.find(zone => zone.name === 'Vilniaus g. 32')!.ring!;
    const [lat, lng] = [place.reduce((sum, [y]) => sum + y, 0) / place.length, place.reduce((sum, [, x]) => sum + x, 0) / place.length];
    expect(Math.abs(lat - 54.681275) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 25.281207) * 64_370).toBeLessThan(2);
    expect(file.zones.filter(zone => zone.kind === 'noRide').map(zone => zone.name).sort()).toEqual(['Pilies g.', 'Savičiaus g.', 'Vilniaus g.']);
    // Pilies gatvė is ridden on by no one, slowly in the Old Town round it; the Cathedral Square is no place to park.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind);
    expect(new Set(at(54.6835, 25.2893))).toEqual(new Set(['noRide', 'noParking', 'slow', 'racksOnly']));
    expect(file.zones.find(zone => zone.name === 'Katedros aikštė')?.kind).toBe('noParking');
    expect(new Set(at(54.6855, 25.2875))).toEqual(new Set(['noParking', 'slow', 'racksOnly']));
    // The restricted parking zone reaches Žirmūnai, across the Neris, but not Naujoji Vilnia.
    expect(at(54.71, 25.3)).toEqual(['racksOnly']);
    expect(at(54.692, 25.42)).toEqual([]);
    await loadCityZones(vilnius);
    const shown = ruleZonesInView({ bounds: VILNIUS_OLD_TOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly', 'noParking', 'slow', 'noRide']));
  });

  it("draws Lisboa's hotspots and racks a shared scooter may be parked at, and the zones where it is neither ridden nor parked, but not one during works, from the Câmara's layers", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const lisboa = ZONE_CITIES.find(city => city.id === 'lisboa')!;
    expect(lisboa.authority).toBe('Câmara Municipal de Lisboa');
    expect(lisboa.timeZone).toBe('Europe/Lisbon');
    // Its 1,856 hotspots and racks for shared vehicles, drawn as discs, and its 347 lasting zones, each part one.
    const { default: file } = await CITY_ZONE_FILES.lisboa();
    const counts = Object.fromEntries(['parking', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 1856, noRide: 502 });
    expect(file.zones.some(zone => zone.name.includes('Temporário'))).toBe(false);
    const comercio = file.zones.find(zone => zone.name === 'Praça do Comércio')!;
    expect(comercio.kind).toBe('noRide');
    const centre = (ring: number[][]) => [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    const [lat, lng] = centre(comercio.ring!);
    expect(Math.abs(lat - 38.707525) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng + 9.136455) * 86_870).toBeLessThan(2);
    // A hotspot with racks by the Parque Eduardo VII, at the Marquês de Pombal.
    const pombal = file.zones.filter(zone => zone.kind === 'parking' && zone.name === 'Praça do Marquês de Pombal').map(zone => centre(zone.ring!));
    expect(pombal.some(([lat, lng]) => Math.abs(lat - 38.726236) * 110_540 < 2 && Math.abs(lng + 9.150473) * 86_870 < 2)).toBe(true);
    // The Rossio is a no-go zone.
    expect(file.zones.filter(zone => Math.abs(winding(zone.ring!, 38.7139, -9.1394)) === 1).map(zone => zone.name)).toEqual(['Praça D. Pedro IV']);
    await loadCityZones(lisboa);
    const shown = ruleZonesInView({ bounds: LISBOA_BAIXA, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noRide']));
  });

  it("draws Le Chesnay-Rocquencourt's places for its Dott scooters and bikes, from the map the town's page draws", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const town = ZONE_CITIES.find(city => city.id === 'lechesnayrocquencourt')!;
    expect(town.authority).toBe('Mairie du Chesnay-Rocquencourt');
    expect(town.timeZone).toBe('Europe/Paris');
    // Its 40 places, drawn as discs, named by their addresses.
    const { default: file } = await CITY_ZONE_FILES.lechesnayrocquencourt();
    expect(file.zones.map(zone => zone.kind)).toEqual(Array(40).fill('parking'));
    const centre = (ring: number[][]) => [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    for (const [name, lat, lng] of [['9, rue Pottier', 48.826447, 2.125306], ['2, rue de la Sabretache', 48.837784, 2.109868]] as const) {
      const [y, x] = centre(file.zones.find(zone => zone.name === name)!.ring!);
      expect(Math.abs(y - lat) * 110_540).toBeLessThan(2);
      expect(Math.abs(x - lng) * 73_400).toBeLessThan(2);
    }
    await loadCityZones(town);
    const shown = ruleZonesInView({ bounds: LE_CHESNAY_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking']));
  });

  it("draws Reykjavík's parking places for shared vehicles, its no-parking and slow zones, from the city's open map services", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const reykjavik = ZONE_CITIES.find(city => city.id === 'reykjavik')!;
    expect(reykjavik.authority).toBe('Reykjavíkurborg');
    expect(reykjavik.timeZone).toBe('Atlantic/Reykjavik');
    // Its 9 parking places, points drawn as discs; its water protection areas, underpasses and the like where none
    // may be parked, and its school grounds and pedestrian streets, ridden at 10 km/h at most.
    const { default: file } = await CITY_ZONE_FILES.reykjavik();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 9, noParking: 157, slow: 49 });
    expect(file.zones.filter(zone => zone.name === 'Grunnskólar').every(zone => zone.kind === 'slow')).toBe(true);
    expect(file.zones.filter(zone => zone.name === 'Undirgöng').every(zone => zone.kind === 'noParking')).toBe(true);
    // The slow zone of Austurstræti.
    expect(file.zones.filter(zone => zone.kind === 'slow' && Math.abs(winding(zone.ring!, 64.1475, -21.9395)) === 1)).toHaveLength(1);
    await loadCityZones(reykjavik);
    const shown = ruleZonesInView({ bounds: REYKJAVIK_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow']));
  });

  it("draws Rīga's parking places, its historic centre where a scooter is parked only at one, its no-parking places and its slow zone, from the city's open data", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const riga = ZONE_CITIES.find(city => city.id === 'riga')!;
    expect(riga.authority).toBe('Rīgas dome, CC BY 4.0');
    expect(riga.timeZone).toBe('Europe/Riga');
    // Its 90 parking areas and the 32 of its parking points not within one, drawn as discs; its 353 crossings,
    // bridges, cycle paths and narrow pavements where none may be parked.
    const { default: file } = await CITY_ZONE_FILES.riga();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking', 'slow'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 122, racksOnly: 1, noParking: 353, slow: 1 });
    expect(file.zones.find(zone => zone.name === 'Bruņinieku iela 10')?.kind).toBe('parking');
    // The historic centre and the slow zone hold the Dom; the slow zone the Central Market too.
    const centre = file.zones.find(zone => zone.kind === 'racksOnly')!;
    const slow = file.zones.find(zone => zone.kind === 'slow')!;
    expect(centre.name).toBe('Vēsturiskā centra daļa');
    expect(Math.abs(winding(centre.ring!, 56.949, 24.1043))).toBe(1);
    expect(Math.abs(winding(slow.ring!, 56.949, 24.1043))).toBe(1);
    expect(Math.abs(winding(centre.ring!, 56.944, 24.114))).toBe(0);
    expect(Math.abs(winding(slow.ring!, 56.944, 24.114))).toBe(1);
    await loadCityZones(riga);
    const shown = ruleZonesInView({ bounds: RIGA_OLD_TOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly', 'noParking', 'slow']));
  });

  it("draws Rostock's marked parking places for e-scooters, from the city's open data", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const rostock = ZONE_CITIES.find(city => city.id === 'rostock')!;
    expect(rostock.authority).toBe('Stadt Rostock');
    // Its 15 places, points drawn as discs, named by their street; its no-parking zones, PDF maps of 2021, are not drawn.
    const { default: file } = await CITY_ZONE_FILES.rostock();
    expect(file.zones).toHaveLength(15);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    expect(file.zones.find(zone => zone.id === 'rostock-parking-03190001')?.name).toBe('Kröpeliner Str.');
    await loadCityZones(rostock);
    const shown = ruleZonesInView({ bounds: ROSTOCK_ALTSTADT, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(5);
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

  it("draws SFMTA's no-parking zones for shared scooters, on the Port's land and in Chinatown, from DataSF", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const sanfrancisco = ZONE_CITIES.find(city => city.id === 'sanfrancisco')!;
    expect(sanfrancisco.authority).toBe('SFMTA');
    expect(sanfrancisco.timeZone).toBe('America/Los_Angeles');
    // The five zones of October 2025; those they replaced, and those of APEC's week and of events, are not drawn.
    const { default: file } = await CITY_ZONE_FILES.sanfrancisco();
    expect(file.zones.map(zone => zone.name).sort()).toEqual(['Chinatown', 'South of Howard - Bayfront Park', 'South of Howard - Pier 40', 'Taylor to Howard', 'West of Taylor']);
    expect(file.zones.every(zone => zone.kind === 'noParking')).toBe(true);
    // The Ferry Building is in the zone from Taylor to Howard, Portsmouth Square in Chinatown's.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(37.7955, -122.3937)).toEqual(['Taylor to Howard']);
    expect(at(37.7948, -122.4056)).toEqual(['Chinatown']);
    await loadCityZones(sanfrancisco);
    const shown = ruleZonesInView({ bounds: SAN_FRANCISCO_EMBARCADERO, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'noParking')).toHaveLength(2);
  });

  it("draws the City of Seattle's bike and scooter corrals, from its layer of bike racks", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const seattle = ZONE_CITIES.find(city => city.id === 'seattle')!;
    expect(seattle.authority).toBe('City of Seattle');
    expect(seattle.timeZone).toBe('America/Los_Angeles');
    // Its 135 corrals in service, points drawn as discs; one without a place and its other bike racks are not drawn.
    const { default: file } = await CITY_ZONE_FILES.seattle();
    expect(file.zones).toHaveLength(135);
    expect(file.zones.every(zone => zone.kind === 'parking' && zone.name === 'Bike and scooter corral')).toBe(true);
    expect(file.zones.find(zone => zone.id === 'seattle-parking-927424')).toBeDefined();
    await loadCityZones(seattle);
    const shown = ruleZonesInView({ bounds: SEATTLE_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(50);
  });

  it("draws Trondheim's parking, no-parking, slow and no-riding zones for e-scooters, from the city's map, credited to the city", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const trondheim = ZONE_CITIES.find(city => city.id === 'trondheim')!;
    expect(trondheim.authority).toBe('Trondheim kommune');
    expect(trondheim.timeZone).toBe('Europe/Oslo');
    // 55 of its zones are both no-parking and slow; the zones that cap the operators' fleets are not drawn.
    const { default: file } = await CITY_ZONE_FILES.trondheim();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 16, noParking: 66, slow: 62, noRide: 11 });
    // Torvet is ridden slowly and no ride ends there; the Nidaros Cathedral's grounds are not ridden.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(63.4305, 10.3951)).toEqual(['noParking', 'slow']);
    expect(at(63.4269, 10.3969)).toEqual(['noRide']);
    await loadCityZones(trondheim);
    const shown = ruleZonesInView({ bounds: TRONDHEIM_MIDTBYEN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });

  it("draws Stavanger's parking places, its inner centre, where a scooter is parked only in one, and its no-parking, slow and no-riding zones, from the kommune's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const stavanger = ZONE_CITIES.find(city => city.id === 'stavanger')!;
    expect(stavanger.authority).toBe('Stavanger kommune');
    expect(stavanger.timeZone).toBe('Europe/Oslo');
    // 213 of the 214 zones Nivel serves to the map the kommune's page embeds, 3 both no-parking and
    // slow; the kommune's boundary is not drawn.
    const { default: file } = await CITY_ZONE_FILES.stavanger();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 152, racksOnly: 1, noParking: 35, slow: 8, noRide: 20 });
    expect(file.zones.find(zone => zone.kind === 'racksOnly')?.name).toBe('Indre sentrumssone');
    // Torget is in the inner centre and its pedestrian streets are ridden slowly; Jorenholmen's car park is not ridden.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(58.9707, 5.7325)).toEqual(['racksOnly', 'slow']);
    expect(at(58.97233, 5.73706)).toEqual(['noRide', 'racksOnly']);
    await loadCityZones(stavanger);
    const shown = ruleZonesInView({ bounds: STAVANGER_SENTRUM, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly', 'noParking', 'slow', 'noRide']));
  });

  it("draws Halmstad's sparkeringar and the places where a ride cannot end, from the kommune's map, placed by its own grid", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const halmstad = ZONE_CITIES.find(city => city.id === 'halmstad')!;
    expect(halmstad.authority).toBe('Halmstads kommun');
    expect(halmstad.timeZone).toBe('Europe/Stockholm');
    // 23 of the layer's 24 places (one has no shape) and its 3 areas, read in SWEREF 99 13 30.
    const { default: file } = await CITY_ZONE_FILES.halmstad();
    const counts = Object.fromEntries(['parking', 'noParking'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 23, noParking: 3 });
    expect(file.zones.length).toBe(26);
    const library = file.zones.find(zone => zone.name === 'Stadsbiblioteket')!.ring!;
    const [lat, lng] = [library.reduce((sum, [y]) => sum + y, 0) / library.length, library.reduce((sum, [, x]) => sum + x, 0) / library.length];
    expect(Math.abs(lat - 56.6747) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 12.8621) * 61_300).toBeLessThan(2);
    // The Nissan's banks in the centre end no ride; the Arena's place is just outside its area.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(56.67426, 12.85463)).toEqual(['Nissan']);
    expect(at(56.67407, 12.88802)).toEqual(['Arena']);
    expect(at(56.673783, 12.888751)).toEqual(['Arenan']);
    await loadCityZones(halmstad);
    const shown = ruleZonesInView({ bounds: HALMSTAD_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking']));
  });

  it("draws Long Beach's no-parking, slow and no-riding areas and its beach path, from Populus's public policy map the city links, but not the operators' drop zones", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const longBeach = ZONE_CITIES.find(city => city.id === 'longbeach')!;
    expect(longBeach.authority).toBe('City of Long Beach');
    expect(longBeach.timeZone).toBe('America/Los_Angeles');
    const { default: file } = await CITY_ZONE_FILES.longbeach();
    const counts = Object.fromEntries(['racksOnly', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ racksOnly: 1, noParking: 21, slow: 10, noRide: 25 });
    expect(file.zones.some(zone => zone.kind === 'parking')).toBe(false);
    // The Aquarium's plaza is not ridden, nor the airport; the beach path is left only at a drop zone.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(33.7623, -118.1966)).toEqual(['noRide', 'slow']);
    expect(at(33.8177, -118.1516)).toEqual(['noParking', 'noRide']);
    expect(at(33.7611, -118.1559)).toEqual(['racksOnly']);
    await loadCityZones(longBeach);
    const shown = ruleZonesInView({ bounds: LONG_BEACH_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'noParking', 'slow', 'noRide']));
  });

  it("draws Nashville's corrals downtown, from Metro's map of them, and its no-riding zones, its parks among them, and its slow zones, from Populus's public policy map Metro links", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const nashville = ZONE_CITIES.find(city => city.id === 'nashville')!;
    expect(nashville.authority).toBe('Metro Nashville');
    expect(nashville.timeZone).toBe('America/Chicago');
    const { default: file } = await CITY_ZONE_FILES.nashville();
    const counts = Object.fromEntries(['parking', 'noRide', 'slow'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 131, noRide: 489, slow: 2 });
    expect(file.zones.length).toBe(622);
    // The map's 138 corrals of March 2025, points drawn as discs, but for the 7 for bikes alone.
    const corrals = Object.groupBy(file.zones.filter(zone => zone.kind === 'parking'), zone => zone.name!);
    expect(Object.fromEntries(Object.entries(corrals).map(([name, zones]) => [name, zones!.length]))).toEqual({
      'Sidewalk scooter corral': 90, 'On-street bike and scooter corral': 22, 'Sidewalk bike and scooter corral': 12, 'On-street scooter corral': 7,
    });
    // Lower Broadway and Second Avenue are ridden slowly, a corral on Broadway's south side by 3rd Avenue;
    // the Ryman and Centennial Park are not ridden.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(36.16083, -86.77763)).toEqual(['Broadway']);
    expect(at(36.164, -86.7765)).toEqual(['Second Ave']);
    expect(at(36.1612, -86.7785)).toEqual(['Ryman Auditorium']);
    expect(at(36.1497, -86.8126)).toEqual(['Centennial Park']);
    expect(at(36.160862, -86.777152)).toEqual(['On-street bike and scooter corral']);
    await loadCityZones(nashville);
    const shown = ruleZonesInView({ bounds: NASHVILLE_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'slow', 'noRide']));
  });

  it("draws Dallas's no-riding zones, its parks, trails, plazas and fast roads, its no-parking areas, its slow zones in force all day and Deep Ellum's corrals, from the City's own map its page links", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const dallas = ZONE_CITIES.find(city => city.id === 'dallas')!;
    expect(dallas.authority).toBe('City of Dallas');
    expect(dallas.timeZone).toBe('America/Chicago');
    // The apps download them: 1,471 areas of the City's, 2,831 zones once parted, 74,000 points.
    expect(index.cities.find(city => city.id === 'dallas')).toMatchObject({ download: true });
    const { default: file } = await CITY_ZONE_FILES.dallas();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 10, noParking: 5, slow: 2, noRide: 2831 });
    // Of its slow zones only Deep Ellum's and the Ronald Kirk Bridge's, at 10 mph whenever a scooter is ridden
    // (5:00 to 21:00); Bishop Arts', the Farmers Market's and Victory Park's hold only on some days.
    expect(file.zones.filter(zone => zone.kind === 'slow').map(zone => zone.name).sort()).toEqual(['Deep Ellum', 'Ron Kirk Bridge']);
    // Fair Park and the Trinity River greenbelt are not ridden, nor Bishop Arts parked in; a corral on Elm Street, in Deep Ellum's slow zone.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => `${zone.kind} ${zone.name}`);
    expect(at(32.7792, -96.7597)).toEqual(['noRide Fair Park']);
    expect(at(32.7744, -96.818)).toEqual(['noRide Trinity River Greenbelt']);
    expect(at(32.749, -96.8284)).toEqual(['noParking Bishop Arts No Park']);
    expect(at(32.78487, -96.78232)).toEqual(['parking 2908 Elm St, Dallas, TX 75226', 'slow Deep Ellum']);
    await loadCityZones(dallas);
    const shown = ruleZonesInView({ bounds: DALLAS_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });

  it("draws Milwaukee's no-riding, slow and no-parking zones and the areas where a ride ends at a corral, from Populus's public policy map beside the portal the City links", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const milwaukee = ZONE_CITIES.find(city => city.id === 'milwaukee')!;
    expect(milwaukee.authority).toBe('City of Milwaukee');
    expect(milwaukee.timeZone).toBe('America/Chicago');
    const { default: file } = await CITY_ZONE_FILES.milwaukee();
    const counts = Object.fromEntries(['racksOnly', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ racksOnly: 4, noParking: 61, slow: 33, noRide: 51 });
    // Halloween's zones on Brady Street, ended on 1 November 2026, are not drawn.
    expect(file.zones.some(zone => /halloween/i.test(zone.name ?? ''))).toBe(false);
    // The Riverwalk is neither ridden nor parked on; the Third Ward is ridden slowly on Broadway and left at a corral.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(43.041, -87.9125)).toEqual(['noParking', 'noRide']);
    expect(at(43.0335, -87.907)).toEqual(['racksOnly', 'slow']);
    await loadCityZones(milwaukee);
    const shown = ruleZonesInView({ bounds: MILWAUKEE_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly', 'noParking', 'slow', 'noRide']));
  });

  it("draws Salt Lake City's downtown corrals, where alone a ride ends there, and its no-parking, slow and no-riding zones, from Populus's public policy map beside the data map the City links", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const saltLakeCity = ZONE_CITIES.find(city => city.id === 'saltlakecity')!;
    expect(saltLakeCity.authority).toBe('Salt Lake City');
    expect(saltLakeCity.timeZone).toBe('America/Denver');
    const { default: file } = await CITY_ZONE_FILES.saltlakecity();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 281, racksOnly: 3, noParking: 42, slow: 4, noRide: 19 });
    // Temple Square is neither ridden nor parked in; Main Street at 200 South is downtown, left only at a corral.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(40.7704, -111.893)).toEqual(['noParking', 'noRide']);
    expect(at(40.7651, -111.891)).toEqual(['racksOnly']);
    expect(at(40.746, -111.8745)).toEqual(['slow']);
    await loadCityZones(saltLakeCity);
    const shown = ruleZonesInView({ bounds: SALT_LAKE_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly', 'noParking', 'slow', 'noRide']));
  });

  it("draws San Antonio's River Walk, San Pedro Creek and parks, where a dockless vehicle is not parked, from Populus's public policy map beside the dashboard the City links", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const sanAntonio = ZONE_CITIES.find(city => city.id === 'sanantonio')!;
    expect(sanAntonio.authority).toBe('City of San Antonio');
    expect(sanAntonio.timeZone).toBe('America/Chicago');
    const { default: file } = await CITY_ZONE_FILES.sanantonio();
    expect(file.zones).toHaveLength(47);
    expect(file.zones.every(zone => zone.kind === 'noParking')).toBe(true);
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(29.4235, -98.488)).toEqual(['RW 4']);
    expect(at(29.4196, -98.4847)).toEqual(["Hemisfair Park- Tower of The America's"]);
    await loadCityZones(sanAntonio);
    const shown = ruleZonesInView({ bounds: SAN_ANTONIO_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['noParking']));
  });

  it("draws Baltimore's no-riding, no-parking and slow zones, from the policy map the City links, beside its corrals", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const baltimore = ZONE_CITIES.find(city => city.id === 'baltimore')!;
    const { default: file } = await CITY_ZONE_FILES.baltimore();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 71, noParking: 40, slow: 22, noRide: 6 });
    // Fort McHenry is not ridden; Camden Yards is neither ridden nor parked in. Populus's corrals, those of
    // the City's own map, and the operators' drop-off limits are not drawn.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(39.2633, -76.58)).toEqual(['noRide']);
    expect(at(39.284, -76.6217)).toEqual(['noParking', 'noRide']);
    await loadCityZones(baltimore);
    const shown = ruleZonesInView({ bounds: BALTIMORE_INNER_HARBOR, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });

  it("draws Turku's parking places and its no-parking, slow and no-riding areas, from the city's open map services", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const turku = ZONE_CITIES.find(city => city.id === 'turku')!;
    expect(turku.authority).toBe('Turun kaupunki, CC BY 4.0');
    expect(turku.timeZone).toBe('Europe/Helsinki');
    // Its 128 parking places, points drawn as discs; its areas' few stray points, each inside an area of its kind, are left out.
    const { default: file } = await CITY_ZONE_FILES.turku();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 128, noParking: 151, slow: 24, noRide: 157 });
    expect(file.zones.find(zone => zone.name === 'Kakola Hotel')?.kind).toBe('parking');
    await loadCityZones(turku);
    const shown = ruleZonesInView({ bounds: TURKU_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });

  it("draws Stockholm's parking places for e-scooters, from the city's open data", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const stockholm = ZONE_CITIES.find(city => city.id === 'stockholm')!;
    expect(stockholm.authority).toBe('Stockholms stad');
    expect(stockholm.timeZone).toBe('Europe/Stockholm');
    // Its 834 parking places, five of them points drawn as discs, the narrowest 70 cm wide; its no-parking
    // along the quays and at 13 places, published only as a picture, is not drawn.
    const { default: file } = await CITY_ZONE_FILES.stockholm();
    expect(file.zones).toHaveLength(834);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    expect(file.zones.find(zone => zone.name === 'John Ericssonsgatan 14')?.ring).toHaveLength(4);
    await loadCityZones(stockholm);
    const shown = ruleZonesInView({ bounds: STOCKHOLM_NORRMALM, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(50);
  });

  it("draws Zürich's parking, no-parking and no-riding zones for shared vehicles, credited to the city", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const zurich = ZONE_CITIES.find(city => city.id === 'zurich')!;
    expect(zurich.authority).toBe('Stadt Zürich');
    expect(zurich.timeZone).toBe('Europe/Zurich');
    // Its no-riding zones are walked at 4 km/h, and no ride may end in one.
    const { default: file } = await CITY_ZONE_FILES.zurich();
    const counts = Object.fromEntries(['parking', 'noParking', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 31, noParking: 35, noRide: 176 });
    // Bahnhofstrasse and the Lindenhof are in one no-riding zone, the main station's hall in a no-parking zone.
    const bahnhofstrasse = file.zones.find(zone => zone.kind === 'noRide' && Math.abs(winding(zone.ring!, 47.3717, 8.5394)) === 1);
    expect(bahnhofstrasse?.id).toBe('zurich-no-ride-81');
    expect(Math.abs(winding(bahnhofstrasse!.ring!, 47.3729, 8.5409))).toBe(1);
    expect(file.zones.find(zone => Math.abs(winding(zone.ring!, 47.3779, 8.5403)) === 1)?.kind).toBe('noParking');
    await loadCityZones(zurich);
    const shown = ruleZonesInView({ bounds: ZURICH, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'noRide']));
  });

  it("draws Plymouth's Beryl docking stations, where its scooters are taken and left, and the two service areas round them, from the council's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const plymouth = ZONE_CITIES.find(city => city.id === 'plymouth')!;
    expect(plymouth.authority).toBe('Plymouth City Council');
    expect(plymouth.timeZone).toBe('Europe/London');
    // Its 69 stations, points drawn as discs, and the service areas of the city and of Derriford, where a scooter is left only at one.
    const { default: file } = await CITY_ZONE_FILES.plymouth();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 69, racksOnly: 2 });
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name).sort();
    const centre = (name: string) => [0, 1].map(axis => { const { ring } = file.zones.find(zone => zone.name === name)!; return ring!.reduce((sum, point) => sum + point[axis], 0) / ring!.length; });
    // Civic Square's station, within a metre of where Beryl's own feed has it, and Derriford Hospital's; Plympton is outside both areas.
    expect(at(50.369072, -4.142051)).toEqual(['Civic Square', 'Plymouth']);
    expect(centre('Civic Square')[0]).toBeCloseTo(50.369072, 5);
    expect(centre('Civic Square')[1]).toBeCloseTo(-4.142051, 5);
    expect(at(50.417134, -4.114309)).toEqual(['Derriford', 'Derriford Hospital']);
    expect(at(50.386, -4.05)).toEqual([]);
    await loadCityZones(plymouth);
    const shown = ruleZonesInView({ bounds: PLYMOUTH_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly']));
  });

  it("draws Leeds's live LNER Beryl bays, outside which a scooter is not returned without a charge, and the scheme's operating area, from the council's map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const leeds = ZONE_CITIES.find(city => city.id === 'leeds')!;
    expect(leeds.authority).toBe('Leeds City Council');
    expect(leeds.timeZone).toBe('Europe/London');
    // The 82 live of its 107 sites, the others planned, ready or suspended, and the operating area round them.
    const { default: file } = await CITY_ZONE_FILES.leeds();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 82, racksOnly: 1 });
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name).sort();
    const centre = (name: string) => [0, 1].map(axis => { const { ring } = file.zones.find(zone => zone.name === name)!; return ring!.reduce((sum, point) => sum + point[axis], 0) / ring!.length; });
    // The Town Hall's bay and Victoria Gate's, within the operating area, which leaves Leeds Bradford Airport out.
    expect(at(53.799713, -1.549921)).toEqual(['Leeds', 'Town Hall']);
    expect(centre('Town Hall')[0]).toBeCloseTo(53.799713, 5);
    expect(centre('Town Hall')[1]).toBeCloseTo(-1.549921, 5);
    expect(at(53.798577, -1.536637)).toEqual(['Leeds', 'Victoria Gate']);
    expect(at(53.8659, -1.6606)).toEqual([]);
    await loadCityZones(leeds);
    const shown = ruleZonesInView({ bounds: LEEDS_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly']));
  });

  it("draws Orlando's designated parking areas, from the map on the City's page, and its no-parking and no-riding zones and Lake Nona, where a scooter is left only at a hub, from Populus's public policy map beside the dashboard the City links", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const orlando = ZONE_CITIES.find(city => city.id === 'orlando')!;
    expect(orlando.authority).toBe('City of Orlando');
    expect(orlando.timeZone).toBe('America/New_York');
    const { default: file } = await CITY_ZONE_FILES.orlando();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'noParking', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 34, racksOnly: 1, noParking: 69, noRide: 25 });
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => `${zone.kind} ${zone.name}`).sort();
    const centre = (name: string) => [0, 1].map(axis => { const { ring } = file.zones.find(zone => zone.name === name)!; return ring!.reduce((sum, point) => sum + point[axis], 0) / ring!.length; });
    // A parking area named for its address; Lake Eola, neither ridden nor parked in; Lake Nona's town centre.
    expect(at(28.539014, -81.377999)).toEqual(['parking 42 East Jackson Street']);
    expect(centre('42 East Jackson Street')[0]).toBeCloseTo(28.539014, 5);
    expect(centre('42 East Jackson Street')[1]).toBeCloseTo(-81.377999, 5);
    expect(at(28.5435, -81.373)).toEqual(['noParking Lake Eola - No Parking / Riding', 'noRide Lake Eola - No Parking / Riding']);
    expect(at(28.374, -81.244)).toEqual(['racksOnly Lake Nona Service Area']);
    await loadCityZones(orlando);
    const shown = ruleZonesInView({ bounds: ORLANDO_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'noRide']));
  });

  it("draws Denver's corrals, the City's own, from its layer of them, but not those once permitted to the operators", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const denver = ZONE_CITIES.find(city => city.id === 'denver')!;
    expect(denver.authority).toBe('City and County of Denver');
    expect(denver.timeZone).toBe('America/Denver');
    const { default: file } = await CITY_ZONE_FILES.denver();
    const counts = Object.fromEntries(['parking'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 106 });
    // Each named for its address, number and street.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name).sort();
    const centre = (name: string) => [0, 1].map(axis => { const { ring } = file.zones.find(zone => zone.name === name)!; return ring!.reduce((sum, point) => sum + point[axis], 0) / ring!.length; });
    expect(at(39.750174, -104.999748)).toEqual(['1525 Blake St']);
    expect(centre('1525 Blake St')[0]).toBeCloseTo(39.750174, 5);
    expect(centre('1525 Blake St')[1]).toBeCloseTo(-104.999748, 5);
    expect(at(39.75219, -104.996352)).toEqual(['1441 18th St']);
    await loadCityZones(denver);
    const shown = ruleZonesInView({ bounds: DENVER_LODO, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking']));
  });

  it("draws Stuttgart's parking areas and no-parking zones, its pedestrian zones among them, from the city's map, placed by its own grid", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const stuttgart = ZONE_CITIES.find(city => city.id === 'stuttgart')!;
    expect(stuttgart.authority).toBe('Landeshauptstadt Stuttgart');
    expect(stuttgart.timeZone).toBe('Europe/Berlin');
    // Its 74 parking areas, its 90 no-parking zones and 287 of its pedestrian zones' 315 parcels (28 of under
    // 4 m² simplify to nothing), read in ETRS89 / UTM 32N, as its WFS rounds degrees to four places.
    const { default: file } = await CITY_ZONE_FILES.stuttgart();
    const counts = Object.fromEntries(['parking', 'noParking'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 74, noParking: 377 });
    expect(file.zones.filter(zone => zone.id.startsWith('stuttgart-no-parking-fz-'))).toHaveLength(287);
    // Sommerrain Bahnhof 1 lies where an inverse of the grid apart from the script's puts it.
    const sommerrain = file.zones.find(zone => zone.id === 'stuttgart-parking-5781')!;
    expect(sommerrain.name).toBe('Sommerrain Bahnhof 1');
    const ring = sommerrain.ring!;
    const [lat, lng] = [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    expect(Math.abs(lat - 48.814995) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 9.246377) * 73_300).toBeLessThan(2);
    // The Königstraße, which the city's own no-parking zones leave out, is a pedestrian zone.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(48.7784, 9.1786)).toEqual(['Königstraße']);
    await loadCityZones(stuttgart);
    const shown = ruleZonesInView({ bounds: STUTTGART_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking']));
  });

  it("draws Düsseldorf's sharing stations and the no-parking zones round them, where a ride ends only at a station, placed by the city's grid", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const dusseldorf = ZONE_CITIES.find(city => city.id === 'dusseldorf')!;
    expect(dusseldorf.authority).toBe('Landeshauptstadt Düsseldorf');
    // 359 of the layer's 369 stations, those in use (aktiv, or temporaer, as the stand-ins for closed ones) for
    // e-scooters, and its 51 zones.
    const { default: file } = await CITY_ZONE_FILES.dusseldorf();
    const counts = Object.fromEntries(['parking', 'racksOnly'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 359, racksOnly: 51 });
    // The station on the Aachener Platz lies in its zone, where an inverse of the grid apart from the script's puts it.
    const station = file.zones.find(zone => zone.id === 'dusseldorf-parking-7773686e-f77f-4ecf-906e-d37b4682953c')!;
    expect(station.name).toBe('Aachener Platz');
    const ring = station.ring!;
    const [lat, lng] = [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    expect(Math.abs(lat - 51.196325) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 6.769624) * 69_800).toBeLessThan(2);
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => `${zone.kind} ${zone.name}`).sort();
    expect(at(lat, lng)).toEqual(['parking Aachener Platz', 'racksOnly Aachener Platz']);
    // The Königsallee and the Burgplatz are in the centre's zone.
    expect(at(51.2235, 6.7795)).toEqual(['racksOnly Gebiet A']);
    expect(at(51.2276, 6.7726)).toEqual(['racksOnly Gebiet A']);
    await loadCityZones(dusseldorf);
    const shown = ruleZonesInView({ bounds: DUSSELDORF_ALTSTADT, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly']));
  });

  it("draws Augsburg's parking places for e-scooters, from its geoportal's layer of places to park, by identify", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const augsburg = ZONE_CITIES.find(city => city.id === 'augsburg')!;
    expect(augsburg.authority).toBe('Stadt Augsburg');
    // Its 37 places ("E-Scooter Stellplatz"), of the layer's 218, points drawn as discs, named by their street.
    const { default: file } = await CITY_ZONE_FILES.augsburg();
    expect(file.zones).toHaveLength(37);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    const obstmarkt = file.zones.find(zone => zone.id === 'augsburg-parking-5642')!;
    expect(obstmarkt.name).toBe('Obstmarkt');
    const ring = obstmarkt.ring!;
    const [lat, lng] = [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    expect(Math.abs(lat - 48.370905) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 10.89727) * 73_900).toBeLessThan(2);
    await loadCityZones(augsburg);
    const shown = ruleZonesInView({ bounds: AUGSBURG_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(10);
  });

  it("draws Mülheim an der Ruhr's e-scooter stations, from the points its page's map carries", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const mulheim = ZONE_CITIES.find(city => city.id === 'mulheim')!;
    expect(mulheim.authority).toBe('Stadt Mülheim an der Ruhr');
    // Its 76 stations, points drawn as discs, each numbered by the page it links to.
    const { default: file } = await CITY_ZONE_FILES.mulheim();
    expect(file.zones).toHaveLength(76);
    expect(file.zones.every(zone => zone.kind === 'parking')).toBe(true);
    const wallstrasse = file.zones.find(zone => zone.id === 'mulheim-parking-932698')!;
    expect(wallstrasse.name).toBe('Wallstraße 9a');
    const ring = wallstrasse.ring!;
    const [lat, lng] = [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    expect(Math.abs(lat - 51.428534) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 6.880848) * 69_400).toBeLessThan(2);
    await loadCityZones(mulheim);
    const shown = ruleZonesInView({ bounds: MULHEIM_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(20);
  });

  it("draws Nürnberg's area where a scooter is hired and returned only at a collection place, from the map its page embeds", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const nurnberg = ZONE_CITIES.find(city => city.id === 'nurnberg')!;
    expect(nurnberg.authority).toBe('Stadt Nürnberg');
    // The city within the Bundesstraßenring (B), which takes in the old town (A), left out so it is not drawn twice;
    // the collection places are not published.
    const { default: file } = await CITY_ZONE_FILES.nurnberg();
    expect(file.zones.map(zone => `${zone.kind} ${zone.name}`)).toEqual(['racksOnly Bereich B']);
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    // The Hauptmarkt and the Hauptbahnhof are in it, the Nordostbahnhof, beyond the ring, is not.
    expect(at(49.4539, 11.0775)).toEqual(['Bereich B']);
    expect(at(49.4459, 11.0826)).toEqual(['Bereich B']);
    expect(at(49.4765, 11.1105)).toEqual([]);
    await loadCityZones(nurnberg);
    const shown = ruleZonesInView({ bounds: NURNBERG_ALTSTADT, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['racksOnly']));
  });

  it("draws Kassel's bike racks where a hired e-scooter may be parked, from its geoportal by identify, asked in quarters, and its Innenstadtring", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const kassel = ZONE_CITIES.find(city => city.id === 'kassel')!;
    expect(kassel.authority).toBe('Stadt Kassel, Innenstadtring © OpenStreetMap');
    // 2,098 of the layer's 2,128 racks (E-Scooter: ja), more than identify answers at once, points drawn as discs,
    // but for the 131 within the Innenstadtring, where a scooter is parked only on its 27 marked places;
    // those without an address are named as racks.
    const { default: file } = await CITY_ZONE_FILES.kassel();
    expect(file.zones).toHaveLength(1968);
    expect(file.zones.filter(zone => zone.kind === 'parking')).toHaveLength(1967);
    expect(file.zones.filter(zone => zone.name === 'Fahrradbügel')).toHaveLength(1211);
    // The ring, traced on OpenStreetMap along the streets the city names: the Königsplatz and the Friedrichsplatz
    // are within it, the Rathaus and the Hauptbahnhof without.
    const ringZone = file.zones.find(zone => zone.kind === 'racksOnly')!;
    expect(ringZone.name).toBe('Innenstadtring');
    const inRing = (lat: number, lng: number) => Math.abs(winding(ringZone.ring!, lat, lng)) === 1;
    expect([inRing(51.3166, 9.4963), inRing(51.3137, 9.4978), inRing(51.312, 9.4886), inRing(51.3183, 9.4895)]).toEqual([true, true, false, false]);
    const rack = file.zones.find(zone => zone.id === 'kassel-parking-2')!;
    expect(rack.name).toBe('Kurfürstenstraße 9');
    const ring = rack.ring!;
    const [lat, lng] = [ring.reduce((sum, [y]) => sum + y, 0) / ring.length, ring.reduce((sum, [, x]) => sum + x, 0) / ring.length];
    expect(Math.abs(lat - 51.317424) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - 9.490429) * 69_600).toBeLessThan(2);
    await loadCityZones(kassel);
    const shown = ruleZonesInView({ bounds: KASSEL_CENTRE, zoom: 15 }, Date.now(), cityZones.get());
    expect(shown.filter(zone => zone.rule === 'parking').length).toBeGreaterThan(30);
    expect(shown.filter(zone => zone.rule === 'racksOnly')).toHaveLength(1);
  });

  it("draws the City of Austin's parking boxes, those complete, and its no-parking, slow and no-riding areas, from its Shared Mobility Operations map", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const austin = ZONE_CITIES.find(city => city.id === 'austin')!;
    expect(austin.authority).toBe('City of Austin');
    expect(austin.timeZone).toBe('America/Chicago');
    // 25 of its 40 boxes and corrals, the others pending installation, and 16 of its 17 areas: the
    // sidewalk between Congress and Trinity only keeps the operators from deploying there. The Domain
    // is in two parts.
    const { default: file } = await CITY_ZONE_FILES.austin();
    const counts = Object.fromEntries(['parking', 'noParking', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 25, noParking: 3, slow: 3, noRide: 11 });
    expect(file.zones.some(zone => zone.name === 'Sidewalk between Congress & Trinity')).toBe(false);
    const box = file.zones.find(zone => zone.name === '301 Lavaca St')!.ring!;
    const [lat, lng] = [box.reduce((sum, [y]) => sum + y, 0) / box.length, box.reduce((sum, [, x]) => sum + x, 0) / box.length];
    expect(Math.abs(lat - 30.266176) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - -97.746087) * 96_200).toBeLessThan(2);
    // The Capitol's grounds are not ridden; Republic Square's park is walked, inside its 5 mph perimeter.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name).sort();
    expect(at(30.2747, -97.7404)).toEqual(['State Capitol']);
    expect(at(30.267794, -97.747377)).toEqual(['Republic Square Park Perimeter', 'Republic Square Parkland']);
    await loadCityZones(austin);
    const shown = ruleZonesInView({ bounds: AUSTIN_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noParking', 'slow', 'noRide']));
  });

  it("draws the City of Phoenix's parking places downtown, kept from its pilot, and its no-ride zones, but not two slivers", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const phoenix = ZONE_CITIES.find(city => city.id === 'phoenix')!;
    expect(phoenix.authority).toBe('City of Phoenix');
    expect(phoenix.timeZone).toBe('America/Phoenix');
    // Its 389 places to park, each a disc round its point, and 108 of its 110 no-ride zones.
    const { default: file } = await CITY_ZONE_FILES.phoenix();
    const counts = Object.fromEntries(['parking', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 389, noRide: 108 });
    expect(file.zones.filter(zone => /^phoenix-no-ride-(169|177)$/.test(zone.id))).toEqual([]);
    const place = file.zones.find(zone => zone.id === 'phoenix-parking-1')!;
    expect(place.name).toBe('Permitted parking');
    const [lat, lng] = [place.ring!.reduce((sum, [y]) => sum + y, 0) / place.ring!.length, place.ring!.reduce((sum, [, x]) => sum + x, 0) / place.ring!.length];
    expect(Math.abs(lat - 33.458449) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - -112.072643) * 92_900).toBeLessThan(2);
    // Chase Field is not ridden, and neither is the zone added in June 2026 that no operator's data had in November.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.name);
    expect(at(33.4455, -112.0667)).toEqual(['Ballpark']);
    expect(file.zones.find(zone => zone.id === 'phoenix-no-ride-59')?.kind).toBe('noRide');
    await loadCityZones(phoenix);
    const shown = ruleZonesInView({ bounds: PHOENIX_DOWNTOWN, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'noRide']));
  });

  it("draws the University of Florida's parking areas, the campus, where a scooter is parked only at one, its slow and dismount zones, but not game days'", async () => {
    const { CITY_ZONE_FILES, ZONE_CITIES, cityZones, loadCityZones } = await fresh();
    const uf = ZONE_CITIES.find(city => city.id === 'universityofflorida')!;
    expect(uf.authority).toBe('University of Florida');
    expect(uf.timeZone).toBe('America/New_York');
    // 59 of its 60 parking areas, one closed, named without their numbers; the campus in three parts.
    const { default: file } = await CITY_ZONE_FILES.universityofflorida();
    const counts = Object.fromEntries(['parking', 'racksOnly', 'slow', 'noRide'].map(kind => [kind, file.zones.filter(zone => zone.kind === kind).length]));
    expect(counts).toEqual({ parking: 59, racksOnly: 3, slow: 1, noRide: 6 });
    expect(file.zones.some(zone => /CLOSED|^\d/.test(zone.name))).toBe(false);
    const area = file.zones.find(zone => zone.name === 'Reitz Union South')!.ring!;
    const [lat, lng] = [area.reduce((sum, [y]) => sum + y, 0) / area.length, area.reduce((sum, [, x]) => sum + x, 0) / area.length];
    expect(Math.abs(lat - 29.645057) * 110_540).toBeLessThan(2);
    expect(Math.abs(lng - -82.347593) * 96_800).toBeLessThan(2);
    // The Plaza of the Americas is walked, in the slow zone, on campus; beside the stadium, in the game
    // days' dismount zone alone, a scooter is only on campus.
    const at = (lat: number, lng: number) => file.zones.filter(zone => Math.abs(winding(zone.ring!, lat, lng)) === 1).map(zone => zone.kind).sort();
    expect(at(29.650722, -82.342517)).toEqual(['noRide', 'racksOnly', 'slow']);
    expect(at(29.64812, -82.35019)).toEqual(['racksOnly']);
    await loadCityZones(uf);
    const shown = ruleZonesInView({ bounds: UF_HISTORIC_CORE, zoom: 15 }, Date.now(), cityZones.get());
    expect(new Set(shown.map(zone => zone.rule))).toEqual(new Set(['parking', 'racksOnly', 'slow', 'noRide']));
  });
});
