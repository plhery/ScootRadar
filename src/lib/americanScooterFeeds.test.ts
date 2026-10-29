import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchScooters, unlinkedScooterPlan } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { activeSeasonalPause } from './seasonalPauses';
import { outlinedTown, systemServesPoint } from './townOutlines';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
import { boundsContainPoint } from './geo';
import { namedCities } from '@/app/api/geocode/cities';
import { providerKeyForSystemId } from '@/generated/providers';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

describe('the United States', () => {
  it.each(['Washington', 'Washington DC', 'Washington, D.C.', 'DC', 'D.C.', 'District of Columbia', 'Washington USA'])(
    'finds Washington, DC for "%s"', query => {
      expect(namedCities(query)[0].city.title).toBe('Washington, DC');
    });
  it('lists Washington, DC under its other names', () => {
    for (const query of ['Washington', 'Washington DC', 'DC', 'District of Columbia']) {
      expect(searchRegionalScooterCities(query)[0].display_name).toBe('Washington, DC, United States');
    }
  });

  it.each([
    ['New York', ['Bronx, NY', 'Queens, NY']], ['NYC', ['Bronx, NY', 'Queens, NY']], ['New York City', ['Bronx, NY', 'Queens, NY']],
    ['The Bronx', ['Bronx, NY']], ['Queens, NY', ['Queens, NY']], ['George Mason University', ['Fairfax, VA']],
    ['GMU', ['Fairfax, VA']], ['Indy', ['Indianapolis, IN']],
    ['Saint Louis', ['St. Louis, MO']], ['St Louis', ['St. Louis, MO']], ['SF', ['San Francisco, CA']],
  ])('finds "%s" as %j', (query, titles) => {
    expect(namedCities(query).filter(({ exact }) => exact).map(({ city }) => city.title)).toEqual(titles);
  });
  // "IN", "NE" and "OK" are words too; after a city, they are its state.
  it.each([['Indianapolis IN', 'Indianapolis, IN'], ['Lincoln, NE', 'Lincoln, NE'], ['Kansas City MO', 'Kansas City, MO'],
    ['Arlington, VA', 'Arlington, VA'], ['Richmond Virginia', 'Richmond, VA'], ['Cincinnati OH', 'Cincinnati, OH']])('reads the state in "%s"', (query, title) => {
    expect(namedCities(query).map(({ city }) => city.title)).toEqual([title]);
  });

  it('counts the operators of one town as one city, in its own time zone', () => {
    const cities = (id: string) => REGIONAL_SCOOTER_CITIES.filter(city => city.id === id);
    for (const id of ['us:az:Tempe', 'us:ga:Atlanta', 'us:va:Arlington', 'us:ny:Bronx', 'us:ny:Queens']) expect(cities(id)).toHaveLength(1);
    expect(serviceAreas(system('lime_us_new_york')).map(area => area.city)).toEqual(['Bronx', 'Queens']);
    expect(system('bird_us_tempe').timeZone).toBe('America/Phoenix');
    expect(system('lime_us_detroit').timeZone).toBe('America/Detroit');
    expect(system('lime_us_louisville').timeZone).toBe('America/Kentucky/Louisville');
    expect(system('bird_us_indianapolis').timeZone).toBe('America/Indiana/Indianapolis');
  });

  it('reads Lime\'s rider map where Lime publishes no feed, each market under the town the map lists', () => {
    // Lime's towns with no public feed: its rider map, read in small groups, since 26 October 2026.
    const lime = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'US' && entry.limeAppMap);
    expect([...new Set(lime.map(entry => entry.city))].sort()).toEqual(['Albuquerque', 'Alexandria', 'Arvada', 'Austin', 'Bellevue', 'Berkeley', 'Boise', 'Bothell', 'Boulder', 'Charlotte',
      'Cincinnati', 'Clearfield', 'Corpus Christi', 'Dallas', 'Edmond', 'Everett', 'Fairfax', 'Farmington', 'Grand Junction', 'Indianapolis', 'Isla Vista',
      'Jacksonville', 'Jenks', 'Knoxville', 'Lansing', 'Little Rock', 'Long Beach', 'Los Angeles', 'Lubbock', 'Milwaukee', 'Minneapolis',
      'Mobile', 'Montgomery County', 'Nashville', 'North Salt Lake', 'Oklahoma City', 'Omaha', 'Orlando', 'Phoenix', 'Portland', 'Raleigh',
      'Redmond', 'Richmond', 'Rochester', 'Sacramento', 'Salt Lake City', 'San Marcos', 'Scottsdale', 'South Lake Tahoe', 'Spokane',
      'Spokane Valley', 'St. Louis Park', 'St. Paul', 'St. Petersburg', 'Tampa', 'Tualatin', 'Tucson', 'Tulsa', 'UNC Charlotte', 'West Sacramento',
      'Winston-Salem']);
    for (const id of ['us:nc:Raleigh', 'us:in:Indianapolis', 'us:va:Fairfax', 'us:oh:Cincinnati', 'us:fl:Tampa', 'us:fl:Orlando',
      'us:fl:St. Petersburg', 'us:nc:Winston-Salem', 'us:mi:Lansing', 'us:ca:Los Angeles', 'us:or:Portland', 'us:ca:Sacramento',
      'us:ca:West Sacramento', 'us:wa:Spokane', 'us:wa:Spokane Valley', 'us:or:Tualatin', 'us:ca:Isla Vista', 'us:ca:South Lake Tahoe',
      'us:ut:Salt Lake City', 'us:id:Boise', 'us:az:Phoenix', 'us:co:Boulder', 'us:az:Scottsdale', 'us:co:Arvada', 'us:tx:Dallas',
      'us:fl:Jacksonville', 'us:mn:Minneapolis', 'us:md:Montgomery County', 'us:tn:Nashville', 'us:ne:Omaha', 'us:va:Richmond',
      'us:mn:St. Louis Park', 'us:mn:St. Paul', 'us:nc:Charlotte', 'us:tx:Austin', 'us:tx:Corpus Christi', 'us:ok:Edmond', 'us:ok:Jenks',
      'us:ar:Little Rock', 'us:tx:Lubbock', 'us:wi:Milwaukee', 'us:al:Mobile', 'us:ok:Oklahoma City', 'us:mn:Rochester', 'us:ok:Tulsa',
      'us:nm:Albuquerque', 'us:ut:Clearfield', 'us:co:Grand Junction', 'us:tn:Knoxville', 'us:ca:Long Beach', 'us:ut:North Salt Lake',
      'us:va:Alexandria', 'us:wa:Bellevue', 'us:ca:Berkeley', 'us:wa:Bothell', 'us:wa:Everett', 'us:wa:Redmond',
      'us:az:Tucson', 'us:ut:Farmington']) {
      expect(REGIONAL_SCOOTER_CITIES.filter(city => city.id === id), id).toHaveLength(1);
    }
    expect(lime.find(entry => entry.city === 'Indianapolis')?.timeZone).toBe('America/Indiana/Indianapolis');
    expect(lime.find(entry => entry.city === 'Cincinnati')).toMatchObject({ region: 'OH', timeZone: 'America/New_York' });
    expect(lime.find(entry => entry.city === 'Lansing')).toMatchObject({ region: 'MI', timeZone: 'America/Detroit' });
    // Lime's Rochester is Minnesota's; Veo's, in New York, has a feed of its own.
    expect(lime.find(entry => entry.city === 'Rochester')).toMatchObject({ region: 'MN', timeZone: 'America/Chicago' });
    // Lime's Farmington is Utah's, by Station Park and Lagoon, a zone of its Ogden service.
    expect(lime.find(entry => entry.city === 'Farmington')).toMatchObject({ region: 'UT', timeZone: 'America/Denver' });
    // Arizona keeps standard time all year.
    expect(lime.find(entry => entry.city === 'Scottsdale')).toMatchObject({ region: 'AZ', timeZone: 'America/Phoenix' });
    expect(lime.find(entry => entry.city === 'Tucson')).toMatchObject({ region: 'AZ', timeZone: 'America/Phoenix' });
    expect(lime.find(entry => entry.city === 'Boise')).toMatchObject({ region: 'ID', timeZone: 'America/Boise' });
    expect(lime.find(entry => entry.city === 'Spokane')).toMatchObject({ region: 'WA', timeZone: 'America/Los_Angeles' });
    // Lime's region is the county's, from Silver Spring to Wheaton and Rockville: one market, named as Lime names it.
    expect(lime.find(entry => entry.city === 'Montgomery County')).toMatchObject({ region: 'MD', timeZone: 'America/New_York' });
  });

  it('pauses South Lake Tahoe from 1 November until 1 May, by its clock', () => {
    // City Code § 4.185.090(A)(11): operators take their devices away from 1 November through 30 April.
    const tahoe: [number, number] = [38.93324, -119.98435];
    expect(activeSeasonalPause(tahoe, Date.UTC(2026, 10, 1, 6, 30))).toBeNull();
    expect(activeSeasonalPause(tahoe, Date.UTC(2026, 10, 1, 7, 30))).toEqual({ city: 'South Lake Tahoe, CA', month: 5 });
    expect(activeSeasonalPause(tahoe, Date.UTC(2027, 3, 30, 12))).toEqual({ city: 'South Lake Tahoe, CA', month: 5 });
    expect(activeSeasonalPause(tahoe, Date.UTC(2027, 4, 1, 7, 30))).toBeNull();
  });

  it('keeps Spin\'s University of Utah scooters, on the campus inside Salt Lake City\'s outline, under Salt Lake City', () => {
    const spin = system('spin_us_salt_lake_city');
    expect(spin.discoveryUrl).toBe('https://gbfs.spin.pm/api/gbfs/v2_3/university_of_utah/gbfs');
    const american = REGIONAL_SCOOTER_CITIES.filter(city => city.country === 'US');
    expect(american.filter(city => city.id === 'us:ut:Salt Lake City')).toHaveLength(1);
    // Its northernmost, southernmost, westernmost and easternmost available scooters at 17:47 MDT on 21 October 2026.
    for (const [lat, lng] of [[40.7722, -111.8405], [40.75191, -111.83224], [40.76079, -111.85211], [40.76479, -111.82378]]) {
      expect(outlinedTown(american, lat, lng)?.id).toBe('us:ut:Salt Lake City');
      expect(systemServesPoint(spin, lat, lng), `${lat}, ${lng}`).toBe(true);
    }
  });

  it('counts Lime\'s Boise scooters in Garden City under Garden City, by both towns\' census outlines', () => {
    // Lime's Boise market takes in Garden City: one service area, read as one, whose scooters in Garden City count there.
    const groups = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.id.startsWith('lime_us_app_boise_'));
    expect(REGIONAL_SCOOTER_CITIES.find(city => city.id === 'us:id:Garden City')).toMatchObject({ city: 'Garden City, ID' });
    expect(groups.every(group => group.city === 'Boise' && !('towns' in group))).toBe(true);
    // Positions at 03:25 MDT on 29 October 2026: two in Garden City, and three of Boise's 106 inside Garden City's box.
    const now = Date.now();
    const standing = [
      ['us:id:Garden City', 43.626518, -116.235136], ['us:id:Garden City', 43.634827, -116.242828],
      ['us:id:Boise', 43.625171, -116.25951], ['us:id:Boise', 43.66924, -116.258778], ['us:id:Boise', 43.639871, -116.240232],
      ['us:id:Boise', 43.6135, -116.2035],
    ] as const;
    const feeds = standing.map(([town, lat, lng], index): FeedSnapshot => {
      const group = groups.find(entry => entry.limeMapTiles!.some(tile => boundsContainPoint(tile, lat, lng)))!;
      expect(systemServesPoint(group, lat, lng), `${town} ${lat}, ${lng}`).toBe(true);
      return { id: `us:${group.id}:${index}`, source: 'us', provider: 'lime', coverage: serviceAreas(group).map(area => area.bounds),
        vehicles: [{ provider: 'lime', vehicle_id: `${index}`, lat, lng, battery: 80, range_m: null, deep_link: null, distance_m: 0 }],
        observedAt: now, attemptedAt: now, collectedAt: now, stale: false, failed: false, skipped: false };
    });
    const counted = Object.fromEntries(buildCityOverview(feeds, now).cities.filter(city => city.id.startsWith('us:id:'))
      .map(city => [city.id, city.batteries.lime?.reduce((sum, count) => sum + count, 0) ?? 0]));
    expect(counted).toEqual({ 'us:id:Boise': 4, 'us:id:Garden City': 2 });
  });

  it('opens Hopp, Bolt\'s brand in Washington, DC, and reads its GBFS 3.0 feed: USD 1 to start and USD 0.16 a minute', async () => {
    const hopp = system('bolt_hopp_us_washington');
    expect(hopp).toMatchObject({ country: 'US', city: 'Washington', region: 'DC', timeZone: 'America/New_York' });
    // Its ids start as Bolt's do, and are Hopp's.
    expect(providerKeyForSystemId(hopp.id)).toBe('bolt_hopp');
    const base = new URL('.', hopp.discoveryUrl).toString();
    expect(base).toBe('https://mds.bolt.eu/gbfs/3/23/');
    const link = 'bolt-hopp://action/rentalsSelectVehicleByRotatedUuid?rotated_uuid=8d8f81ed-a45a-4ad8-b33c-1a5ad04c5965';
    // As Bolt publishes them, under the system id "BoltEU_Washington DC", with a space, that the app never reads.
    const scooter = { vehicle_id: '8d8f81ed-a45a-4ad8-b33c-1a5ad04c5965', lat: 38.928958892822266, lon: -77.03233337402344,
      current_range_meters: 5600, current_fuel_percent: 0.15, pricing_plan_id: '678891b4-730c-56f1-ae07-fb29882359a1',
      vehicle_type_id: '635b05df-18f6-5850-9b22-616c7377761a', is_reserved: false, is_disabled: false,
      rental_uris: { android: link, ios: link }, vehicle_type: 'scooter_standing' };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === hopp.discoveryUrl) return response({ version: '3.0', data: { feeds: ['system_information', 'vehicle_status',
        'system_pricing_plans', 'vehicle_types', 'geofencing_zones'].map(name => ({ name, url: `${base}${name}` })) } });
      if (url === `${base}vehicle_types`) return response({ version: '3.0', data: { vehicle_types: [
        { vehicle_type_id: '635b05df-18f6-5850-9b22-616c7377761a', propulsion_type: 'electric', form_factor: 'scooter_standing', max_range_meters: 70000 },
        { vehicle_type_id: '7ff246ec-0000-5000-8000-000000000000', propulsion_type: 'electric_assist', form_factor: 'bicycle', max_range_meters: 70000 },
      ] } });
      // GBFS 3.0's time, a string: "2026-10-14T20:32:38Z".
      if (url === `${base}vehicle_status`) return response({ version: '3.0', ttl: 60,
        last_updated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), data: { vehicles: [scooter,
          { ...scooter, vehicle_id: 'bike', vehicle_type_id: '7ff246ec-0000-5000-8000-000000000000', vehicle_type: 'bicycle' },
          // Out of service in a depot in Maryland.
          { ...scooter, vehicle_id: 'depot', lat: 38.880768, lon: -76.860138, is_disabled: true }] } });
      if (url === `${base}system_pricing_plans`) return response({ version: '3.0', data: { plans: [{
        plan_id: '678891b4-730c-56f1-ae07-fb29882359a1', name: [{ language: 'en', text: 'WASHINGTON DC SCOOTER' }], currency: 'USD',
        price: 1, is_taxable: false, per_min_pricing: [{ start: 0, rate: 0.16, interval: 1 }],
        description: [{ language: 'en', text: 'Unlock 1.00 USD, 0.16 USD/MIN.' }] }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: hopp.bounds, minBattery: 0, providers: new Set(['bolt_hopp']) });
    expect(result.meta.sources.us).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'bolt_hopp', vehicle_id: `bolt_hopp_us_washington:${scooter.vehicle_id}`, battery: 15, range_m: 5600,
      pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 16 },
      rental_uris: { android: link, ios: link, web: null },
    })]);
  });

  it('reads Veo\'s Washington feed: USD 1 to start and USD 0.46 a minute plus tax, its standing scooters only', async () => {
    const veo = system('veo_us_washington');
    expect(veo).toMatchObject({ country: 'US', city: 'Washington', region: 'DC', timeZone: 'America/New_York' });
    const base = 'https://cluster-prod.veoride.com/api/shares/name/xdc/gbfs/';
    const link = 'https://gmjc.adj.st/?adj_t=5vyf0nr&number=10103344';
    // As Veo publishes them: GBFS 2.2, no last_reported, and America/Chicago as every Veo town's zone.
    const scooter = { bike_id: '2e2984cb-b351-5a59-b6ec-632b9b2a020e', lat: 38.9001, lon: -77.0102, is_reserved: false, is_disabled: false,
      rental_uris: { android: link, ios: link }, vehicle_type_id: '1', pricing_plan_id: '205', current_range_meters: 58729 };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === veo.discoveryUrl) return response({ version: '2.2', data: { en: { feeds: ['system_information', 'free_bike_status',
        'vehicle_types', 'system_pricing_plans'].map(name => ({ name, url: `${base}${name}` })) } } });
      if (url === `${base}vehicle_types`) return response({ data: { vehicle_types: [
        { vehicle_type_id: '1', form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 52800 },
        // The seated Cosmo, which Veo counts as an electric bicycle.
        { vehicle_type_id: '3', form_factor: 'bicycle', propulsion_type: 'electric', max_range_meters: 67000 },
      ] } });
      if (url === `${base}free_bike_status`) return response({ version: '2.2', ttl: 0, last_updated: Math.floor(Date.now() / 1000),
        data: { bikes: [scooter, { ...scooter, bike_id: 'cosmo', vehicle_type_id: '3' },
          // One the feed puts in Shenzhen, where Veo's scooters are made.
          { ...scooter, bike_id: 'shenzhen', lat: 22.793646, lon: 113.934747 }] } });
      if (url === `${base}system_pricing_plans`) return response({ data: { plans: [{ plan_id: '205', name: 'Price for vehicle', currency: 'USD',
        price: 1.0, is_taxable: true, description: 'The unlock fee is 1.000000 and we charge you 0.460000 for each every 1 minute',
        per_min_pricing: [{ start: 0, rate: 0.46, interval: 1 }] }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    // Central Washington, short of Veo's College Park, Maryland, whose feed the test does not answer.
    const result = await fetchScooters({ bounds: { south: 38.85, west: -77.06, north: 38.95, east: -76.95 }, minBattery: 0,
      providers: new Set(['veo']) });
    expect(result.meta.sources.us).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'veo', vehicle_id: `veo_us_washington:${scooter.bike_id}`, battery: null, range_m: 58729,
      pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 46, plus_tax: true },
      rental_uris: { android: link, ios: link, web: null },
    })]);
  });

  it('reads Lime\'s Washington feed, its standing scooters only, in the District\'s three boxes', async () => {
    const lime = system('lime_us_washington');
    expect(lime).toMatchObject({ country: 'US', provider: 'lime', city: 'Washington', region: 'DC', timeZone: 'America/New_York' });
    expect(serviceAreas(lime)).toEqual(serviceAreas(system('bolt_hopp_us_washington')));
    const base = 'https://data.lime.bike/api/partners/v2/gbfs/washington_dc/';
    // As Lime published it on 25 October 2026: GBFS 2.2, scooters and e-bikes, no prices and no links.
    const scooter = { bike_id: '195291e1-f4a0-4c4e-9d4e-0d3f1c2b7a10', lat: 38.878676, lon: -76.970962, is_reserved: false,
      is_disabled: false, current_range_meters: 17461, vehicle_type_id: '2', last_reported: Math.floor(Date.now() / 1000),
      vehicle_type: 'scooter' };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === lime.discoveryUrl) return response({ version: '2.2', ttl: 0, data: { en: { feeds: ['system_information',
        'station_information', 'station_status', 'free_bike_status', 'vehicle_types'].map(name => ({ name, url: `${base}${name}` })) } } });
      if (url === `${base}vehicle_types`) return response({ data: { vehicle_types: [
        { vehicle_type_id: '1', form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 24140 },
        { vehicle_type_id: '2', form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 40233 },
        { vehicle_type_id: '3', form_factor: 'bicycle', propulsion_type: 'electric_assist', max_range_meters: 85000 },
      ] } });
      if (url === `${base}free_bike_status`) return response({ version: '2.2', ttl: 60, last_updated: Math.floor(Date.now() / 1000),
        data: { bikes: [scooter, { ...scooter, bike_id: 'e-bike', vehicle_type_id: '3', vehicle_type: 'e-bike' },
          { ...scooter, bike_id: 'reserved', is_reserved: true }, { ...scooter, bike_id: 'disabled', is_disabled: true }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    // East of Lime's Arlington feed, whose box reaches across the Potomac to 77.028° W.
    const result = await fetchScooters({ bounds: { south: 38.85, west: -77.02, north: 38.95, east: -76.95 }, minBattery: 0,
      providers: new Set(['lime']) });
    expect(result.meta.sources.us).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'lime', vehicle_id: `lime_us_washington:${scooter.bike_id}`, range_m: 17461,
    })]);
  });

  describe('Lyft in Chicago', () => {
    const lyftChicago = system('lyft_us_chicago');
    const base = 'https://gbfs.lyft.com/gbfs/2.3/chi/en/';
    const link = 'https://chi.lft.to/lastmile_qr_scan';
    // As Lyft publishes them in Chicago: one link per city, which opens the app's code scanner.
    const scooter = { bike_id: 'b6d1a3455ef4be273c1957ff1a89e0b7', lat: 41.919597745, lon: -87.680216908, is_reserved: 0, is_disabled: 0,
      rental_uris: { android: link, ios: link }, current_range_meters: 52786.483199999995, vehicle_type_id: '3' };
    const plan = (plan_id: string, rate: number) => ({ plan_id, name: plan_id.replaceAll('_', ' '), currency: 'USD', price: '1.00',
      is_taxable: true, per_min_pricing: [{ start: 0, rate, interval: 1 }] });
    const types = [{ vehicle_type_id: '1', form_factor: 'bicycle', propulsion_type: 'human' },
      { vehicle_type_id: '2', form_factor: 'bicycle', propulsion_type: 'electric_assist', max_range_meters: 54717.56 },
      { vehicle_type_id: '3', form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 70810.95999999999 }];
    // Wood St & Cortland St, as Divvy lists it: its bikes and scooters counted by type.
    const station = { station_id: '2132204879062053464', name: 'Wood St & Cortland St', short_name: 'CHI02134', lat: 41.91589,
      lon: -87.67281, capacity: 11, rental_uris: { android: link, ios: link }, is_charging: false };
    const docks = (station_id: string, counts: Record<string, number>, is_renting = 1) => ({ station_id, is_installed: 1, is_renting,
      is_returning: is_renting, num_bikes_available: (counts['1'] ?? 0) + (counts['2'] ?? 0),
      vehicle_types_available: Object.entries(counts).map(([vehicle_type_id, count]) => ({ vehicle_type_id, count })) });
    const now = () => Math.floor(Date.now() / 1000);

    function stubLyftChicago(stationStatus: { last_updated: number; data: { stations: unknown[] } }) {
      vi.stubGlobal('fetch', vi.fn(async (url: string) => {
        if (url === lyftChicago.discoveryUrl) return response({ version: '2.3', data: { en: { feeds: ['system_information', 'station_information',
          'station_status', 'free_bike_status', 'vehicle_types', 'system_pricing_plans'].map(name => ({ name, url: `${base}${name}.json` })) } } });
        if (url === `${base}vehicle_types.json`) return response({ data: { vehicle_types: types } });
        if (url === `${base}free_bike_status.json`) return response({ version: '2.3', last_updated: now(), data: { bikes: [
          scooter, { ...scooter, bike_id: 'reserved', is_reserved: 1 }, { ...scooter, bike_id: 'disabled', is_disabled: 1 },
          { ...scooter, bike_id: 'ebike', vehicle_type_id: '2', current_range_meters: 30000 }] } });
        if (url === `${base}system_pricing_plans.json`) return response({ data: { plans: [plan('EBIKE_SINGLE_RIDE', 0.44),
          plan('BIKE_SINGLE_RIDE', 0.2), plan('SCOOTER_SINGLE_RIDE', 0.44)] } });
        if (url === `${base}station_information.json`) return response({ version: '2.3', last_updated: now(), data: { stations: [station,
          { ...station, station_id: 'closed', name: 'Closed' }, { ...station, station_id: 'bikes', name: 'Bikes only' }] } });
        if (url === `${base}station_status.json`) return response({ version: '2.3', ...stationStatus });
        throw new Error(`Unexpected upstream ${url}`);
      }));
    }

    it('reads Lyft\'s flags written 0 and 1, its price written "1.00", and the scooter plan its scooters do not name', async () => {
      expect(lyftChicago).toMatchObject({ country: 'US', city: 'Chicago', region: 'IL', timeZone: 'America/Chicago',
        discoveryUrl: 'https://gbfs.lyft.com/gbfs/2.3/chi/gbfs.json' });
      stubLyftChicago({ last_updated: now(), data: { stations: [] } });
      const result = await fetchScooters({ bounds: lyftChicago.bounds, minBattery: 0, providers: new Set(['lyft']) });
      expect(result.meta.sources.us).toBe('fresh');
      expect(result.vehicles).toEqual([expect.objectContaining({
        provider: 'lyft', vehicle_id: `lyft_us_chicago:${scooter.bike_id}`, battery: null, range_m: 52786,
        pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 44, plus_tax: true },
        rental_uris: { android: link, ios: link, web: null },
      })]);

      // The plan is the scooters' only where it can be no other's.
      const typesById = new Map(types.map(type => [type.vehicle_type_id, type]));
      const plans = { pricing: new Map([['SCOOTER_SINGLE_RIDE', { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 44 }]]),
        names: new Map() };
      expect(unlinkedScooterPlan('lyft', typesById, plans)).toBe('SCOOTER_SINGLE_RIDE');
      expect(unlinkedScooterPlan('lyft', typesById, { pricing: new Map(), names: new Map() })).toBeUndefined();
      expect(unlinkedScooterPlan('lyft', new Map([...typesById, ['4', { ...types[2], vehicle_type_id: '4' }]]), plans)).toBeUndefined();
      expect(unlinkedScooterPlan('lyft', new Map([['3', { ...types[2], default_pricing_plan_id: 'OTHER' }]]), plans)).toBeUndefined();
      expect(unlinkedScooterPlan('bird', typesById, plans)).toBeUndefined();
    });

    it('shows the scooters docked at Divvy\'s stations, which only their count by type lists, each at its station', async () => {
      expect(lyftChicago.stationScooters).toBe(true);
      // Biketown lists its stations too, with no scooter docked at any.
      expect(system('lyft_us_portland').stationScooters).toBeUndefined();
      stubLyftChicago({ last_updated: now(), data: { stations: [docks(station.station_id, { '1': 1, '2': 4, '3': 2 }),
        docks('closed', { '3': 3 }, 0), docks('bikes', { '1': 5, '3': 0 }), docks('unlisted', { '3': 4 })] } });
      const result = await fetchScooters({ bounds: lyftChicago.bounds, minBattery: 0, providers: new Set(['lyft']) });
      expect(result.meta.sources.us).toBe('fresh');
      const docked = { provider: 'lyft', lat: station.lat, lng: station.lon, battery: null, range_m: null,
        pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 44, plus_tax: true },
        rental_uris: { android: link, ios: link, web: null } };
      expect(result.vehicles.map(vehicle => vehicle.vehicle_id).sort()).toEqual([`lyft_us_chicago:${scooter.bike_id}`,
        `lyft_us_chicago:station:${station.station_id}:1`, `lyft_us_chicago:station:${station.station_id}:2`]);
      expect(result.vehicles.filter(vehicle => vehicle.vehicle_id?.includes(':station:')))
        .toEqual([expect.objectContaining(docked), expect.objectContaining(docked)]);
    });

    it('fails Chicago\'s feed, rather than leave its docked scooters out, when the station status is out of date', async () => {
      stubLyftChicago({ last_updated: now() - 3600, data: { stations: [docks(station.station_id, { '3': 2 })] } });
      await expect(fetchScooters({ bounds: lyftChicago.bounds, minBattery: 0, providers: new Set(['lyft']) }))
        .rejects.toMatchObject({ failedSources: ['us:lyft_us_chicago'] });
    });
  });

  it('reads Spin\'s feed, which names no price and gives Bird\'s apps, whose charger sign-up is no rental link', async () => {
    const spin = system('spin_us_baltimore');
    expect(spin).toMatchObject({ country: 'US', city: 'Baltimore', region: 'MD', timeZone: 'America/New_York',
      discoveryUrl: 'https://gbfs.spin.pm/api/gbfs/v2_3/baltimore/gbfs' });
    const base = 'https://gbfs.spin.pm/api/gbfs/v2_3/baltimore/';
    // As Spin publishes them: a last_reported per scooter, and no price or link of its own.
    const scooter = { bike_id: '44e616f1-de8c-4505-bcb9-558eed4f8dee', lat: 39.32782641666667, lon: -76.62328413333333,
      is_disabled: false, is_reserved: false, vehicle_type_id: 'bae2102b-56ba-42ba-9097-720e5990b4b2',
      last_reported: Math.floor(Date.now() / 1000) - 30, current_range_meters: 27318.0, current_fuel_percent: 0.6236559 };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === spin.discoveryUrl) return response({ version: '2.3', data: { en: { feeds: ['system_information', 'free_bike_status',
        'vehicle_types', 'system_pricing_plans'].map(name => ({ name, url: `${base}${name}` })) } } });
      if (url === `${base}system_information`) return response({ version: '2.3', data: { system_id: 'provider-null-baltimore',
        name: 'provider null baltimore', language: 'en', timezone: 'US/Eastern', operator: 'Bird Rides, Inc.', rental_apps: {
          android: { discovery_uri: 'bird://charger-onboarding', store_uri: 'https://play.google.com/store/apps/details?id=co.bird.android' },
          ios: { discovery_uri: 'bird://', store_uri: 'https://apps.apple.com/us/app/bird-be-free-enjoy-the-ride/id1260842311' } } } });
      if (url === `${base}vehicle_types`) return response({ data: { vehicle_types: [{ vehicle_type_id: scooter.vehicle_type_id,
        form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 24000.0 }] } });
      if (url === `${base}free_bike_status`) return response({ version: '2.3', ttl: 60, last_updated: Math.floor(Date.now() / 1000),
        data: { bikes: [scooter, { ...scooter, bike_id: 'reserved', is_reserved: true }] } });
      if (url === `${base}system_pricing_plans`) return response({ version: '2.3', data: { plans: [] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: spin.bounds, minBattery: 0, providers: new Set(['spin']) });
    expect(result.meta.sources.us).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'spin', vehicle_id: `spin_us_baltimore:${scooter.bike_id}`, battery: 62, range_m: 27318, deep_link: null,
      rental_uris: { android: null, ios: null, web: null },
    })]);
    expect(result.vehicles[0].pricing).toBeUndefined();
  });

  it('sets each Veo system\'s own zone, as its feeds give every town America/Chicago', () => {
    const veo = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.provider === 'veo');
    expect(veo.length).toBeGreaterThan(25);
    const zones: Record<string, string> = { CA: 'America/Los_Angeles', CO: 'America/Denver', UT: 'America/Denver',
      IN: 'America/Indiana/Indianapolis', AL: 'America/Chicago', AR: 'America/Chicago', IA: 'America/Chicago', IL: 'America/Chicago',
      KS: 'America/Chicago', OK: 'America/Chicago', TX: 'America/Chicago' };
    for (const entry of veo) expect(entry.timeZone, entry.id).toBe(zones[entry.region!] ?? 'America/New_York');
    expect(system('veo_us_west_lafayette').timeZone).toBe('America/Indiana/Indianapolis');
    expect(system('veo_us_berkeley').timeZone).toBe('America/Los_Angeles');
  });

  it.each([
    ['UC Davis', 'Davis, CA'], ['Purdue', 'West Lafayette, IN'], ['UCSD', 'San Diego, CA'], ['K-State', 'Manhattan, KS'],
    ['Rutgers', 'New Brunswick, NJ'], ['University of Maryland', 'College Park, MD'], ['Michigan State University', 'East Lansing, MI'],
    ['NC State', 'Raleigh, NC'], ['Saint Paul', 'St. Paul, MN'], ['NYC', 'Bronx, NY'], ['New York', 'Bronx, NY'],
    ['University of Utah', 'Salt Lake City, UT'], ['U of U', 'Salt Lake City, UT'], ['UofU', 'Salt Lake City, UT'],
    ['UCSB', 'Isla Vista, CA'], ['UC Santa Barbara', 'Isla Vista, CA'], ['Lake Tahoe', 'South Lake Tahoe, CA'],
    ['Stateline', 'South Lake Tahoe, CA'],
  ])('finds the town of a campus or a borough by its other name: "%s"', (query, title) => {
    expect(namedCities(query)[0].city.title).toBe(title);
  });

  it('finds both boroughs of New York with scooters as New York', () => {
    expect(searchRegionalScooterCities('New York').map(city => city.display_name))
      .toEqual(['Bronx, NY, United States', 'Queens, NY, United States']);
  });
});
