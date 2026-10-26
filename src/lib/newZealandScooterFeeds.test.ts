import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchScooters } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
import { systemServesPoint } from './townOutlines';
import { formatRegion } from './formatLocale';
import { formatRidePrice } from './ridePrice';
import { searchText } from './searchText';
import { namedCities } from '@/app/api/geocode/cities';
import { COUNTRY_REGIONS } from '@/generated/countries';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

/** Flamingo's Wellington feed as data.rideflamingo.com serves it: GBFS 3.0, scooters and e-bikes on one plan, a range and no charge. */
function flamingoWellington(vehicles: object[]) {
  const wellington = system('flamingo_nz_wellington');
  const base = new URL('.', wellington.discoveryUrl).toString();
  const lastUpdated = new Date().toISOString();
  return vi.fn(async (url: string) => {
    if (url === wellington.discoveryUrl) return response({ version: '3.0', last_updated: lastUpdated, ttl: 3600, data: { feeds: [
      'system_information', 'vehicle_types', 'vehicle_status', 'system_pricing_plans'].map(name => ({ name, url: `${base}${name}.json` })) } });
    // The feed says Etc/UTC; the catalog's Pacific/Auckland is the one the app reads.
    if (url === `${base}system_information.json`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 3600, data: {
      system_id: 'flamingo_wellington', languages: ['en'], name: [{ text: 'Flamingo', language: 'en' }], timezone: 'Etc/UTC', license_id: 'CC-BY-4.0' } });
    if (url === `${base}vehicle_types.json`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 3600, data: { vehicle_types: [
      { vehicle_type_id: 'flamingo-scooter', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 22000,
        default_pricing_plan_id: '1-standard' },
      { vehicle_type_id: 'flamingo-bike', form_factor: 'bicycle', propulsion_type: 'electric_assist', max_range_meters: 32000,
        default_pricing_plan_id: '1-standard' },
    ] } });
    // GST included, and is_taxable all the same.
    if (url === `${base}system_pricing_plans.json`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 3600, data: { plans: [{
      plan_id: '1-standard', name: [{ text: 'STANDARD', language: 'en' }], currency: 'NZD', price: 1, is_taxable: true,
      description: [{ text: '$1 NZD to unlock, 55c per min', language: 'en' }], per_min_pricing: [{ rate: 0.55, start: 0, interval: 1 }] }] } });
    if (url === `${base}vehicle_status.json`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 0, data: { vehicles } });
    throw new Error(`Unexpected upstream ${url}`);
  });
}

const flamingoVehicle = (id: string, lat: number, lon: number, type = 'flamingo-scooter') => ({
  vehicle_id: id, lat, lon, current_range_meters: 11808, last_reported: new Date(Date.now() - 120_000).toISOString(), vehicle_type_id: type,
  rental_uris: { android: `https://ride.flamingoscooters.com/v/${id}`, ios: `https://ride.flamingoscooters.com/vehicle/${id}` },
  pricing_plan_id: '1-standard', is_reserved: false, is_disabled: false,
});

describe('New Zealand', () => {
  it('reads Flamingo in eight towns, JOLT in two and Lime in five, every area by New Zealand\'s clock', () => {
    const nz = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'NZ');
    expect(nz.filter(entry => !entry.limeAppMap).map(entry => [entry.id, entry.discoveryUrl])).toEqual([
      ['flamingo_nz_auckland', 'https://data.rideflamingo.com/gbfs/3/auckland/gbfs.json'],
      ['flamingo_nz_christchurch', 'https://data.rideflamingo.com/gbfs/3/christchurch/gbfs.json'],
      ['flamingo_nz_wellington', 'https://data.rideflamingo.com/gbfs/3/wellington/gbfs.json'],
      ['flamingo_nz_porirua', 'https://data.rideflamingo.com/gbfs/3/porirua/gbfs.json'],
      ['flamingo_nz_dunedin', 'https://data.rideflamingo.com/gbfs/3/dunedin/gbfs.json'],
      ['flamingo_nz_tauranga', 'https://data.rideflamingo.com/gbfs/3/tauranga/gbfs.json'],
      ['flamingo_nz_palmerston_north', 'https://data.rideflamingo.com/gbfs/3/palmerston-north/gbfs.json'],
      ['flamingo_nz_waimakariri', 'https://data.rideflamingo.com/gbfs/3/waimakariri/gbfs.json'],
      ['jolt_nz_new_plymouth', 'https://prod-api.joltscooters.co.nz/api/gbfs/new_plymouth/gbfs.json'],
      ['jolt_nz_selwyn', 'https://prod-api.joltscooters.co.nz/api/gbfs/selwyn/gbfs.json'],
    ]);
    // Lime publishes no feed here: its rider map, read in small groups, since 26 October 2026.
    expect([...new Set(nz.filter(entry => entry.limeAppMap).map(entry => entry.city))])
      .toEqual(['Auckland', 'Christchurch', 'Hamilton', 'Palmerston North', 'Wellington']);
    // Flamingo's feeds say Etc/UTC, which the app never reads.
    for (const entry of nz) {
      for (const area of serviceAreas(entry)) expect(area.timeZone ?? entry.timeZone, `${entry.id} in ${area.city}`).toBe('Pacific/Auckland');
    }
    // Porirua's feed serves Tawa too, which is in Wellington.
    expect(serviceAreas(system('flamingo_nz_porirua')).map(area => area.city)).toEqual(['Porirua', 'Wellington']);
    expect(serviceAreas(system('flamingo_nz_waimakariri')).map(area => area.city)).toEqual(['Rangiora', 'Kaiapoi']);
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'NZ').map(entry => entry.id)).toEqual([
      'nz:auk:Auckland', 'nz:can:Christchurch', 'nz:wgn:Wellington', 'nz:wgn:Porirua', 'nz:ota:Dunedin', 'nz:bop:Tauranga',
      'nz:mwt:Palmerston North', 'nz:can:Rangiora', 'nz:can:Kaiapoi', 'nz:tki:New Plymouth', 'nz:can:Rolleston', 'nz:wko:Hamilton',
    ]);
    // Its regions say which town is meant, but its totals are the country's and its towns go by their own names.
    expect(COUNTRY_REGIONS.NZ).toMatchObject({ showInCityNames: false, totals: false });
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'NZ').every(entry => !entry.city.includes(','))).toBe(true);
  });

  it('reads Flamingo Wellington: NZ$1 to start and 55c a minute with GST in, the range for a charge, and not its e-bikes', async () => {
    vi.stubGlobal('fetch', flamingoWellington([
      flamingoVehicle('8f28719feab51c82', -41.29372, 174.78108),
      flamingoVehicle('8bee7d68e6cd8852', -41.27979, 174.78038, 'flamingo-bike'),
    ]));
    // Central Wellington, away from the box of Porirua's feed, which reaches Tawa.
    const result = await fetchScooters({ bounds: { south: -41.31, west: 174.75, north: -41.27, east: 174.8 }, minBattery: 0,
      providers: new Set(['flamingo']) });
    expect(result.meta.sources.newzealand).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'flamingo', vehicle_id: 'flamingo_nz_wellington:8f28719feab51c82', battery: null, range_m: 11808,
      pricing: { currency: 'NZD', unlock_fee_minor_units: 100, minute_fee_minor_units: 55 },
      // One link for iPhones and another for Android, so none for a desktop.
      rental_uris: { ios: 'https://ride.flamingoscooters.com/vehicle/8f28719feab51c82',
        android: 'https://ride.flamingoscooters.com/v/8f28719feab51c82', web: null },
    })]);
    // GST is in the price: no "+ tax", whatever the feed's is_taxable says.
    expect(result.vehicles[0].pricing).not.toHaveProperty('plus_tax');
    // A browser in New Zealand writes its dollars as "$", one elsewhere as "NZ$".
    expect(formatRegion('en', ['en-NZ', 'en'])).toBe('NZ');
    expect(formatRidePrice(55, 'NZD', 'en', 'NZ')).toBe('$0.55');
    expect(formatRidePrice(55, 'NZD', 'en', 'US')).toBe('NZ$0.55');
  });

  // Positions from the polls of 16 October 2026 (NZDT).
  it('counts the scooters Porirua\'s feed leaves in Tawa under Wellington, the town they stand in', () => {
    const now = Date.now();
    const standing = {
      flamingo_nz_porirua: [['Wellington', -41.1635, 174.82626], ['Wellington', -41.16969, 174.82512], ['Porirua', -41.09044, 174.88048],
        ['Porirua', -41.10791, 174.90275]],
      // Courtenay Place, and a wharf on Evans Bay outside the city's land boundary.
      flamingo_nz_wellington: [['Wellington', -41.29372, 174.78108], ['Wellington', -41.28728, 174.80088]],
    } as const;
    const feeds = Object.entries(standing).map(([id, vehicles]): FeedSnapshot => ({
      id: `newzealand:${id}`, source: 'newzealand', provider: 'flamingo', coverage: serviceAreas(system(id)).map(area => area.bounds),
      vehicles: vehicles.map(([town, lat, lng], index) => ({ provider: 'flamingo', vehicle_id: `${id}:${town}-${index}`, lat, lng,
        battery: null, range_m: 9000, deep_link: null, distance_m: 0 })),
      observedAt: now, attemptedAt: now, collectedAt: now, stale: false, failed: false, skipped: false,
    }));
    for (const [id, vehicles] of Object.entries(standing)) {
      for (const [town, lat, lng] of vehicles) expect(systemServesPoint(system(id), lat, lng), `${id} in ${town}`).toBe(true);
    }
    const overview = buildCityOverview(feeds, now);
    const count = (id: string) => Object.values(overview.cities.find(city => city.id === id)!.batteries)
      .reduce((sum, bins) => sum + bins.reduce((total, n) => total + n, 0), 0);
    expect(count('nz:wgn:Wellington')).toBe(4);
    expect(count('nz:wgn:Porirua')).toBe(2);
  });

  it('keeps Kaiapoi, Rangiora and Rolleston apart from Christchurch, and leaves out Woodend, Pegasus and Lincoln', () => {
    for (const [id, town, lat, lng, served] of [
      ['flamingo_nz_waimakariri', 'Rangiora', -43.30077, 172.57849, true], ['flamingo_nz_waimakariri', 'Kaiapoi', -43.36271, 172.67342, true],
      ['jolt_nz_selwyn', 'Rolleston', -43.60408, 172.37082, true], ['flamingo_nz_christchurch', 'Christchurch', -43.53486, 172.62975, true],
      // A few scooters a poll by Pegasus and Woodend, and JOLT's in Lincoln: too few rides to show.
      ['flamingo_nz_waimakariri', 'Pegasus', -43.31599, 172.6931, false], ['jolt_nz_selwyn', 'Lincoln', -43.64226, 172.475, false],
    ] as const) {
      expect(systemServesPoint(system(id), lat, lng), `${id} in ${town}`).toBe(served);
    }
    // No box of the towns around Christchurch reaches into Christchurch's, so none needs an outline.
    const christchurch = system('flamingo_nz_christchurch').bounds;
    for (const id of ['flamingo_nz_waimakariri', 'jolt_nz_selwyn']) {
      for (const area of serviceAreas(system(id))) {
        const apart = area.bounds.north < christchurch.south || area.bounds.south > christchurch.north ||
          area.bounds.east < christchurch.west || area.bounds.west > christchurch.east;
        expect(apart, `${area.city}`).toBe(true);
      }
    }
  });

  it.each([
    ['Auckland', 'Auckland'], ['Tāmaki Makaurau', 'Auckland'], ['Tamaki Makaurau', 'Auckland'], ['Auckland, New Zealand', 'Auckland'],
    ['Auckland NZ', 'Auckland'], ['Auckland Aotearoa', 'Auckland'], ['Christchurch New Zealand', 'Christchurch'],
    ['Christchurch, Canterbury', 'Christchurch'], ['Ōtautahi', 'Christchurch'], ['Otautahi', 'Christchurch'],
    ['Wellington, NZ', 'Wellington'], ['Te Whanganui-a-Tara', 'Wellington'], ['Dunedin', 'Dunedin'], ['Ōtepoti', 'Dunedin'],
    ['Otepoti', 'Dunedin'], ['Dunedin Otago', 'Dunedin'], ['Tauranga', 'Tauranga'], ['Mount Maunganui', 'Tauranga'],
    ['Mt Maunganui', 'Tauranga'], ['Papamoa', 'Tauranga'], ['Palmerston North', 'Palmerston North'], ['Palmy', 'Palmerston North'],
    ['Palmerston North, Manawatū-Whanganui', 'Palmerston North'], ['Palmerston North Manawatu-Whanganui', 'Palmerston North'],
    ['Porirua', 'Porirua'], ['Kaiapoi', 'Kaiapoi'], ['Rangiora', 'Rangiora'], ['New Plymouth', 'New Plymouth'], ['Ngāmotu', 'New Plymouth'],
    ['Ngamotu', 'New Plymouth'], ['New Plymouth, Taranaki', 'New Plymouth'], ['Rolleston, NZ', 'Rolleston'],
  ])('finds "%s" as %s', (query, title) => {
    expect(namedCities(query)[0]).toMatchObject({ city: { title, subtitle: 'New Zealand' } });
  });

  it('reads a name with or without its macrons: Manawatū as Manawatu, Taupō as Taupo', () => {
    expect(searchText('Manawatū-Whanganui')).toBe(searchText('Manawatu-Whanganui'));
    expect(searchText('Taupō')).toBe(searchText('Taupo'));
    expect(searchText('Whangārei')).toBe('whangarei');
    // Taupō's scooters are Beam's, whose feed asks for a key: either spelling is a place to look up, not a town of the map's.
    expect(namedCities('Taupō')).toEqual([]);
    expect(namedCities('Taupo')).toEqual([]);
  });

  it('names the country after the town', () => {
    expect(searchRegionalScooterCities('Palmy').map(city => city.display_name)).toEqual(['Palmerston North, New Zealand']);
    expect(searchRegionalScooterCities('Mount Maunganui').map(city => city.display_name)).toEqual(['Tauranga, New Zealand']);
  });
});
