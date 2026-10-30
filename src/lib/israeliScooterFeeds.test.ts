import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchScooters } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
import { systemServesPoint } from './townOutlines';
import { normalizeParkingLocations } from './parking';
import { formatRegion } from './formatLocale';
import { formatRidePrice } from './ridePrice';
import { namedCities } from '@/app/api/geocode/cities';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

describe('Israel', () => {
  it('reads Bird, Dott and Lime around Tel Aviv, and Bird in Caesarea, one area per town, all in Israel\'s time zone', () => {
    const israeli = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'IL');
    const feeds = israeli.filter(entry => !entry.limeAppMap);
    // Not Bird's tel-aviv feed: the same scooters as its israel feed, under other ids.
    expect(feeds.map(entry => [entry.id, entry.discoveryUrl])).toEqual([
      ['bird_il_israel', 'https://mds.bird.co/gbfs/v2/public/israel/gbfs.json'],
      ['dott_il_tel_aviv', 'https://gbfs.api.ridedott.com/public/v2/tel-aviv/gbfs.json'],
      ['lime_il_tel_aviv', 'https://data.lime.bike/api/partners/v2/gbfs/tel_aviv/gbfs.json'],
    ]);
    expect(Object.fromEntries(feeds.map(entry => [entry.provider, serviceAreas(entry).map(area => area.city)]))).toEqual({
      bird: ['Tel Aviv', 'Ramat Gan', 'Holon', 'Bat Yam', 'Givatayim', 'Herzliya', 'Rishon LeZion', 'Ashdod', 'Bnei Brak', 'Ramat HaSharon', 'Caesarea'],
      dott: ['Tel Aviv', 'Ramat Gan', 'Petah Tikva', 'Holon', 'Bat Yam', 'Givatayim', 'Herzliya', 'Bnei Brak'],
      lime: ['Tel Aviv', 'Ramat Gan', 'Petah Tikva', 'Holon', 'Givatayim', 'Herzliya', 'Kiryat Ono', 'Bnei Brak', 'Givat Shmuel', 'Or Yehuda'],
    });
    // Lime's tel_aviv feed has neither town: its rider map, read in small groups, since 26 October 2026.
    expect([...new Set(israeli.filter(entry => entry.limeAppMap).map(entry => entry.city))]).toEqual(['Ashdod', 'Eilat']);
    // Bird's feed says Asia/Tel_Aviv, an older name the app never reads.
    for (const entry of israeli) {
      for (const area of serviceAreas(entry)) expect(area.timeZone ?? entry.timeZone, `${entry.id} in ${area.city}`).toBe('Asia/Jerusalem');
    }
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'IL').map(entry => entry.id).sort()).toEqual([
      'il:Ashdod', 'il:Bat Yam', 'il:Bnei Brak', 'il:Caesarea', 'il:Eilat', 'il:Givat Shmuel', 'il:Givatayim', 'il:Herzliya', 'il:Holon', 'il:Kiryat Ono',
      'il:Or Yehuda', 'il:Petah Tikva', 'il:Ramat Gan', 'il:Ramat HaSharon', 'il:Rishon LeZion', 'il:Tel Aviv',
    ]);
  });

  it.each([
    ['Tel Aviv', 'Tel Aviv'], ['Tel Aviv-Yafo', 'Tel Aviv'], ['Jaffa', 'Tel Aviv'], ['Yafo', 'Tel Aviv'], ['TLV', 'Tel Aviv'],
    ['תל אביב', 'Tel Aviv'], ['תל־אביב–יפו', 'Tel Aviv'], ['תֵּל אָבִיב', 'Tel Aviv'], ['Tel Aviv, Israel', 'Tel Aviv'], ['תל אביב ישראל', 'Tel Aviv'],
    ['Rishon LeZion', 'Rishon LeZion'], ['Rishon Lezion', 'Rishon LeZion'], ['Rishon le-Zion', 'Rishon LeZion'], ['ראשון לציון', 'Rishon LeZion'],
    ['Petach Tikva', 'Petah Tikva'], ['פתח תקוה', 'Petah Tikva'], ['Herzlia', 'Herzliya'], ['Givataim', 'Givatayim'],
    ['Ramat Hasharon', 'Ramat HaSharon'], ['רמת השרון', 'Ramat HaSharon'], ['בני ברק', 'Bnei Brak'], ['קרית אונו', 'Kiryat Ono'],
    ['Eilat', 'Eilat'], ['אילת', 'Eilat'], ['Caesarea', 'Caesarea'], ['Qesarya', 'Caesarea'], ['קיסריה', 'Caesarea'],
  ])('finds "%s" as %s', (query, title) => {
    expect(namedCities(query)[0]).toMatchObject({ city: { title, subtitle: 'Israel' } });
  });

  it('lists Tel Aviv under Jaffa without a request', () => {
    expect(searchRegionalScooterCities('Jaffa')[0].display_name).toBe('Tel Aviv, Israel');
  });

  it('reads Dott Tel Aviv: ₪5 to start and ₪1.25 a minute, written as Israel writes them', async () => {
    const dott = system('dott_il_tel_aviv');
    const base = new URL('.', dott.discoveryUrl).toString();
    // As Dott publishes them in Tel Aviv, on 15 October 2026.
    const scooter = { bike_id: '547d6ded-1c90-43d4-a01d-a536513e37db', current_range_meters: 20332, current_fuel_percent: 1,
      is_disabled: false, is_reserved: false, last_reported: Math.floor(Date.now() / 1000) - 60, lat: 32.012505, lon: 34.74797,
      pricing_plan_id: '311a8d02-1bf0-4f59-9f2e-47dc2865b464', vehicle_type_id: 'dott_scooter',
      rental_uris: { android: 'https://go.ridedott.com/vehicles/547d6ded-1c90-43d4-a01d-a536513e37db?platform=android',
        ios: 'https://go.ridedott.com/vehicles/547d6ded-1c90-43d4-a01d-a536513e37db?platform=ios' } };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === dott.discoveryUrl) return response({ version: '2.3', data: { en: { feeds: ['free_bike_status', 'system_pricing_plans',
        'vehicle_types'].map(name => ({ name, url: `${base}${name}.json` })) } } });
      if (url === `${base}vehicle_types.json`) return response({ version: '2.3', data: { vehicle_types: [{ form_factor: 'scooter',
        max_range_meters: 30000, pricing_plan_ids: ['311a8d02-1bf0-4f59-9f2e-47dc2865b464'], propulsion_type: 'electric',
        vehicle_type_id: 'dott_scooter' }] } });
      if (url === `${base}system_pricing_plans.json`) return response({ version: '2.3', data: { plans: [{ currency: 'ILS',
        description: 'Pricing information for Tel Aviv (scooter): Riders pay 5 ILS to unlock and 1.25 ILS per minute.',
        is_taxable: false, name: 'tel-aviv-scooter-system-pricing-plan', plan_id: '311a8d02-1bf0-4f59-9f2e-47dc2865b464', price: 5,
        per_min_pricing: [{ interval: 1, rate: 1.25, start: 1 }] }] } });
      if (url === `${base}free_bike_status.json`) return response({ version: '2.3', ttl: 300, last_updated: Math.floor(Date.now() / 1000),
        data: { bikes: [scooter,
          // Dott's few in Givat Shmuel and Kiryat Ono, where only Lime's are counted, positions from the polls of 15 October 2026.
          { ...scooter, bike_id: 'givat-shmuel', lat: 32.08594, lon: 34.8539 }, { ...scooter, bike_id: 'kiryat-ono', lat: 32.04917, lon: 34.85717 }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: dott.bounds, minBattery: 0, providers: new Set(['dott']) });
    expect(result.meta.sources.israel).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'dott', vehicle_id: `dott_il_tel_aviv:${scooter.bike_id}`, battery: 100, range_m: 20332,
      pricing: { currency: 'ILS', unlock_fee_minor_units: 500, minute_fee_minor_units: 125 },
    })]);
    expect(result.vehicles[0].pricing).not.toHaveProperty('plus_tax');
    // The app has no Hebrew: a browser in Israel gets English written as Israel writes it.
    expect(formatRegion('en', ['he-IL', 'he', 'en-US', 'en'])).toBe('IL');
    expect(formatRidePrice(125, 'ILS', 'en', 'IL')).toBe('₪1.25');
    expect(formatRidePrice(500, 'ILS', 'en', 'US')).toBe('₪5.00');
  });

  // Positions from the polls of 15 October 2026. Each stands inside the bounds of a neighbour,
  // nearer its centre, and most inside the bounds of several.
  const standing = {
    bird: [
      ['Tel Aviv', 32.12356, 34.84063], ['Tel Aviv', 32.0473, 34.75489], ['Ramat Gan', 32.08276, 34.808], ['Bnei Brak', 32.08588, 34.82589],
      ['Holon', 32.03249, 34.76066], ['Rishon LeZion', 31.99325, 34.74568], ['Herzliya', 32.15744, 34.81688], ['Givatayim', 32.06071, 34.81467],
      ['Ashdod', 31.80621, 34.66502],
    ],
    dott: [
      ['Tel Aviv', 32.07719, 34.79819], ['Ramat Gan', 32.08041, 34.80857], ['Petah Tikva', 32.09222, 34.85671], ['Holon', 32.03644, 34.76206],
      ['Bat Yam', 32.01263, 34.74777], ['Tel Aviv', 32.10488, 34.82059],
    ],
    lime: [
      ['Ramat Gan', 32.08857, 34.80435], ['Tel Aviv', 32.04511, 34.75239], ['Ramat Gan', 32.04767, 34.83869], ['Petah Tikva', 32.08659, 34.8509],
      ['Ramat Gan', 32.0795, 34.8257], ['Kiryat Ono', 32.03985, 34.86017], ['Givatayim', 32.06159, 34.81821], ['Bnei Brak', 32.06963, 34.83926],
      ['Or Yehuda', 32.03968, 34.85885], ['Givat Shmuel', 32.08594, 34.85455],
    ],
  } as const;
  const ids = { bird: 'bird_il_israel', dott: 'dott_il_tel_aviv', lime: 'lime_il_tel_aviv' } as const;

  it('counts each scooter of Gush Dan under the town it stands in, by the towns\' own boundaries', () => {
    const now = Date.now();
    const feeds = (Object.keys(standing) as (keyof typeof standing)[]).map((provider): FeedSnapshot => ({
      id: `israel:${ids[provider]}`, source: 'israel', provider, coverage: serviceAreas(system(ids[provider])).map(area => area.bounds),
      vehicles: standing[provider].map(([town, lat, lng], index) => ({ provider, vehicle_id: `${town}-${index}`, lat, lng, battery: 80,
        range_m: null, deep_link: null, distance_m: 0 })),
      observedAt: now, attemptedAt: now, collectedAt: now, stale: false, failed: false, skipped: false,
    }));
    for (const [provider, vehicles] of Object.entries(standing)) {
      for (const [town, lat, lng] of vehicles) expect(systemServesPoint(system(ids[provider as keyof typeof ids]), lat, lng), `${provider} in ${town}`).toBe(true);
    }
    const overview = buildCityOverview(feeds, now);
    const counted = Object.fromEntries(overview.cities.filter(city => city.id.startsWith('il:')).map(city => [city.city,
      Object.fromEntries(Object.entries(city.batteries).map(([provider, bins]) => [provider, bins.reduce((sum, count) => sum + count, 0)]))]));
    const expected: Record<string, Record<string, number>> = {};
    for (const [provider, vehicles] of Object.entries(standing)) {
      for (const [town] of vehicles) (expected[town] ??= {})[provider] = (expected[town][provider] ?? 0) + 1;
    }
    expect(counted).toEqual({ ...Object.fromEntries(REGIONAL_SCOOTER_CITIES.filter(city => city.country === 'IL').map(city => [city.city, {}])),
      ...expected });
  });

  it('counts Bird\'s scooters in Caesarea\'s business park and at Caesarea–Pardes Hanna station under Caesarea', () => {
    // Positions from the polls of 29 October 2026: the park's south-west, its middle and the station, where both rides
    // seen that evening ended. Caesarea stands apart, so its box alone decides, as Ashdod's does.
    const positions = [[32.47091, 34.94273], [32.48243, 34.94555], [32.48519, 34.95403]] as const;
    const bird = system('bird_il_israel');
    for (const [lat, lng] of positions) expect(systemServesPoint(bird, lat, lng), `${lat}, ${lng}`).toBe(true);
    const now = Date.now();
    const overview = buildCityOverview([{
      id: 'israel:bird_il_israel', source: 'israel', provider: 'bird', coverage: serviceAreas(bird).map(area => area.bounds),
      vehicles: positions.map(([lat, lng], index) => ({ provider: 'bird', vehicle_id: `caesarea-${index}`, lat, lng, battery: 80,
        range_m: null, deep_link: null, distance_m: 0 })),
      observedAt: now, attemptedAt: now, collectedAt: now, stale: false, failed: false, skipped: false,
    }], now);
    const caesarea = overview.cities.find(city => city.id === 'il:Caesarea');
    expect(caesarea?.batteries.bird?.reduce((sum, count) => sum + count, 0)).toBe(3);
  });

  it('keeps no scooter in a town its feed does not serve, nor beyond Gush Dan, Ashdod, Caesarea and Eilat', () => {
    for (const [provider, town, lat, lng] of [
      ['dott', 'Givat Shmuel', 32.08594, 34.8539], ['dott', 'Kiryat Ono', 32.04917, 34.85717], ['dott', 'Ramat HaSharon', 32.12427, 34.81465],
      ['lime', 'Bat Yam', 32.01535, 34.76161], ['lime', 'Ramat HaSharon', 32.15479, 34.8135], ['bird', 'Petah Tikva', 32.09284, 34.8502],
      // Caesarea's own town, west of Highway 2: Bird's zones there are only its business park.
      ['bird', 'Caesarea', 32.50013, 34.90365],
    ] as const) {
      expect(systemServesPoint(system(ids[provider]), lat, lng), `${provider} in ${town}`).toBe(false);
    }
    // No town reaches the West Bank: its nearest point to Gush Dan, by Oranit, is about 5 km east of Petah Tikva's,
    // and to Caesarea, by Baqa al-Sharqiyya, about 9 km south-east of its box. Eilat, on the Red Sea, is far south of it.
    for (const entry of REGIONAL_SCOOTER_SYSTEMS.filter(candidate => candidate.country === 'IL' && candidate.city !== 'Eilat')) {
      for (const area of serviceAreas(entry)) {
        expect(area.bounds.east, `${entry.id} in ${area.city}`).toBeLessThan(area.city === 'Caesarea' ? 34.97 : 34.94);
      }
    }
  });

  it('shows Dott\'s bays as required inside its bay zones and as designated elsewhere', () => {
    const dott = system('dott_il_tel_aviv');
    const types = { data: { vehicle_types: [{ vehicle_type_id: 'dott_scooter', form_factor: 'scooter', propulsion_type: 'electric' }] } };
    // Two of Dott's stations and the zones they stand in, as rectangles: a zone of bays in central
    // Tel Aviv, and a garden in Givatayim where no ride may end but at the station at its gate.
    const rectangle = (south: number, west: number, north: number, east: number) =>
      [[[west, south], [east, south], [east, north], [west, north], [west, south]]];
    const rule = (stationParking: boolean, rideThrough: boolean) => ({ rules: [{ ride_allowed: false,
      ride_through_allowed: rideThrough, station_parking: stationParking, vehicle_type_id: ['dott_scooter'] }] });
    const zones = { data: { geofencing_zones: { type: 'FeatureCollection', features: [
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: rectangle(32.055, 34.765, 32.065, 34.78) }, properties: rule(true, true) },
      { type: 'Feature', geometry: { type: 'Polygon', coordinates: rectangle(32.07004, 34.80196, 32.07069, 34.80278) }, properties: rule(false, false) },
    ] } } };
    const stations = { data: { stations: [
      { is_virtual_station: true, lat: 32.05950563983405, lon: 34.77243576951117, name: 'נחלת בנימין 105',
        station_id: '49d0871a-7156-451d-b73c-7158749f5604', vehicle_capacity: { dott_scooter: 5 } },
      { is_virtual_station: true, lat: 32.07045777, lon: 34.80250045, name: 'גינת השוטר, סירני/גלוסקא, סירני 2',
        station_id: '4b75bb77-7799-4d51-80f5-31aac3a234f4', vehicle_capacity: { dott_scooter: 5 } },
    ] } };
    expect(normalizeParkingLocations(dott, types, stations, zones).map(location => [location.name, location.mandatory])).toEqual([
      ['נחלת בנימין 105', true], ['גינת השוטר, סירני/גלוסקא, סירני 2', false],
    ]);
  });
});
