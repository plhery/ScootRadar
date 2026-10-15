import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchScooters, unlinkedScooterPlan } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
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
    ['Arlington, VA', 'Arlington, VA'], ['Richmond Virginia', 'Richmond, VA']])('reads the state in "%s"', (query, title) => {
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

  it('reads Lyft\'s flags written 0 and 1, its price written "1.00", and the scooter plan its scooters do not name', async () => {
    const lyftChicago = system('lyft_us_chicago');
    expect(lyftChicago).toMatchObject({ country: 'US', city: 'Chicago', region: 'IL', timeZone: 'America/Chicago',
      discoveryUrl: 'https://gbfs.lyft.com/gbfs/2.3/chi/gbfs.json' });
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
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === lyftChicago.discoveryUrl) return response({ version: '2.3', data: { en: { feeds: ['system_information', 'free_bike_status',
        'vehicle_types', 'system_pricing_plans'].map(name => ({ name, url: `${base}${name}.json` })) } } });
      if (url === `${base}vehicle_types.json`) return response({ data: { vehicle_types: types } });
      if (url === `${base}free_bike_status.json`) return response({ version: '2.3', last_updated: Math.floor(Date.now() / 1000), data: { bikes: [
        scooter, { ...scooter, bike_id: 'reserved', is_reserved: 1 }, { ...scooter, bike_id: 'disabled', is_disabled: 1 },
        { ...scooter, bike_id: 'ebike', vehicle_type_id: '2', current_range_meters: 30000 }] } });
      if (url === `${base}system_pricing_plans.json`) return response({ data: { plans: [plan('EBIKE_SINGLE_RIDE', 0.44),
        plan('BIKE_SINGLE_RIDE', 0.2), plan('SCOOTER_SINGLE_RIDE', 0.44)] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: lyftChicago.bounds, minBattery: 0, providers: new Set(['lyft']) });
    expect(result.meta.sources.us).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'lyft', vehicle_id: `lyft_us_chicago:${scooter.bike_id}`, battery: null, range_m: 52786,
      pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 44, plus_tax: true },
      rental_uris: { android: link, ios: link, web: null },
    })]);

    // The plan is the scooters' only where it can be no other's.
    const typesById = new Map(types.map(type => [type.vehicle_type_id, type]));
    const pricing = new Map([['SCOOTER_SINGLE_RIDE', { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 44 }]]);
    expect(unlinkedScooterPlan('lyft', typesById, pricing)).toBe('SCOOTER_SINGLE_RIDE');
    expect(unlinkedScooterPlan('lyft', typesById, new Map())).toBeUndefined();
    expect(unlinkedScooterPlan('lyft', new Map([...typesById, ['4', { ...types[2], vehicle_type_id: '4' }]]), pricing)).toBeUndefined();
    expect(unlinkedScooterPlan('lyft', new Map([['3', { ...types[2], default_pricing_plan_id: 'OTHER' }]]), pricing)).toBeUndefined();
    expect(unlinkedScooterPlan('bird', typesById, pricing)).toBeUndefined();
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
  ])('finds the town of a campus or a borough by its other name: "%s"', (query, title) => {
    expect(namedCities(query)[0].city.title).toBe(title);
  });

  it('finds both boroughs of New York with scooters as New York', () => {
    expect(searchRegionalScooterCities('New York').map(city => city.display_name))
      .toEqual(['Bronx, NY, United States', 'Queens, NY, United States']);
  });
});
