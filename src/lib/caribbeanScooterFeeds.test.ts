import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchScooters } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { systemServesPoint } from './townOutlines';
import { formatRegion } from './formatLocale';
import { formatRidePrice } from './ridePrice';
import { saysScooter } from './i18n';
import { startCity, timeZoneCountry } from './startPlace';
import { namedCities } from '@/app/api/geocode/cities';
import { COUNTRY_CONTINENTS, COUNTRY_REGIONS } from '@/generated/countries';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

/** A Hopp town's GBFS 2.2 feed as api.hopp.bike serves it: one scooter type, one plan in US dollars, Hopp's own battery field. */
function hoppFeed(id: string, typeId: string, plan: object, bikes: object[]) {
  const town = system(id);
  const base = new URL('.', town.discoveryUrl).toString();
  return vi.fn(async (url: string) => {
    if (url === town.discoveryUrl) return response({ last_updated: Math.floor(Date.now() / 1000), ttl: 0, version: '2.2', data: { en: { feeds: [
      'system_information', 'free_bike_status', 'geofencing_zones', 'system_pricing_plans', 'vehicle_types',
    ].map(name => ({ name, url: `${base}en/${name}.json` })) } } });
    if (url === `${base}en/vehicle_types.json`) return response({ data: { vehicle_types: [
      { vehicle_type_id: typeId, propulsion_type: 'electric', form_factor: 'scooter', max_range_meters: 40000 }] } });
    if (url === `${base}en/system_pricing_plans.json`) return response({ data: { plans: [plan] } });
    if (url === `${base}en/free_bike_status.json`) return response({ last_updated: Math.floor(Date.now() / 1000), ttl: 0, data: { bikes } });
    throw new Error(`Unexpected upstream ${url}`);
  });
}

const hoppScooter = (bikeId: string, code: string, lat: number, lon: number, extra: object = {}) => ({
  bike_id: bikeId, lat, lon, is_disabled: false, is_reserved: false, current_range_meters: 32800, hopp_battery_level: 88, hopp_code: code,
  rental_uris: { android: `https://app.hopp.bike/launch/${bikeId}?direct`, ios: `https://app.hopp.bike/launch/${bikeId}?direct` },
  hopp_deeplink: `https://app.hopp.bike/launch/${bikeId}?direct`, ...extra,
});

describe('Costa Rica and the Caribbean Netherlands', () => {
  it('reads Hopp in Tamarindo and on Bonaire, each in its own country of North America, by its own clock', () => {
    const towns = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'CR' || entry.country === 'BQ');
    expect(towns.map(entry => [entry.id, entry.country, entry.discoveryUrl, entry.timeZone])).toEqual([
      ['hopp_cr_tamarindo', 'CR', 'https://api.hopp.bike/gbfs/cr-tamarindo/gbfs.json', 'America/Costa_Rica'],
      ['hopp_bq_bonaire', 'BQ', 'https://api.hopp.bike/gbfs/bq-bonaire/gbfs.json', 'America/Kralendijk'],
    ]);
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'CR' || entry.country === 'BQ').map(entry => entry.id))
      .toEqual(['cr:Tamarindo', 'bq:Kralendijk']);
    // One town each: no provinces, and one total each, zoomed out.
    expect(COUNTRY_REGIONS.CR).toBeUndefined();
    expect(COUNTRY_REGIONS.BQ).toBeUndefined();
    expect([COUNTRY_CONTINENTS.CR, COUNTRY_CONTINENTS.BQ]).toEqual(['north-america', 'north-america']);
    // Bonaire is the Caribbean Netherlands', not the Netherlands', which the map doesn't cover.
    expect(COUNTRY_CONTINENTS).not.toHaveProperty('NL');
  });

  it('opens the map on Tamarindo or Kralendijk for a device on Costa Rica\'s or Bonaire\'s clock', () => {
    expect(timeZoneCountry('America/Costa_Rica')).toBe('CR');
    expect(timeZoneCountry('America/Kralendijk')).toBe('BQ');
    expect(startCity('America/Costa_Rica')?.id).toBe('cr:Tamarindo');
    expect(startCity('America/Kralendijk')?.id).toBe('bq:Kralendijk');
  });

  it('reads Hopp Tamarindo: US$1 to start and 55¢ a minute with no "+ tax", the battery, the range and a link to each scooter', async () => {
    vi.stubGlobal('fetch', hoppFeed('hopp_cr_tamarindo', 'vtp_72', { plan_id: 'flt_530', name: 'Hopp pricing',
      description: 'US$1.00 to start and US$0.55 per minute.', price: 1, currency: 'USD', is_taxable: false,
      per_min_price: [{ start: 0, interval: 1, rate: 0.55 }] }, [
      hoppScooter('0dd4d18a-b531-43f0-843f-26abd358f007', 'XX574', 10.295458, -85.844507, { pricing_plan_id: 'flt_530', vehicle_type_id: 'vtp_72' }),
      hoppScooter('reserved', 'XX575', 10.2954, -85.8445, { pricing_plan_id: 'flt_530', vehicle_type_id: 'vtp_72', is_reserved: true }),
      hoppScooter('disabled', 'XX576', 10.2954, -85.8445, { pricing_plan_id: 'flt_530', vehicle_type_id: 'vtp_72', is_disabled: true }),
    ]));
    const result = await fetchScooters({ bounds: system('hopp_cr_tamarindo').bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.costarica).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'hopp', vehicle_id: 'hopp_cr_tamarindo:0dd4d18a-b531-43f0-843f-26abd358f007', battery: 88, range_m: 32800,
      pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 55 },
      deep_link: 'https://app.hopp.bike/launch/0dd4d18a-b531-43f0-843f-26abd358f007?direct',
    })]);
    // Costa Rica's prices are as Hopp's plan gives them: no sales tax on top.
    expect(result.vehicles[0].pricing).not.toHaveProperty('plus_tax');
    // A browser in the US writes the dollars as "$", one in Switzerland, the default, as "US$".
    expect(formatRidePrice(55, 'USD', 'en', 'US')).toBe('$0.55');
    expect(formatRidePrice(100, 'USD', 'en', formatRegion('en', ['en-GB', 'en']))).toBe('US$1.00');
    expect(formatRidePrice(55, 'USD', 'en')).toBe('US$\u00a00.55');
    // Spanish in Costa Rica says "scooter", as in the rest of Latin America.
    expect(saysScooter('es', formatRegion('es', ['es-CR', 'es']))).toBe(true);
  });

  it('reads Hopp Bonaire: US$1 to start and 50¢ a minute, and says "patinete" in Spanish for a browser of Bonaire', async () => {
    vi.stubGlobal('fetch', hoppFeed('hopp_bq_bonaire', 'vtp_120', { plan_id: 'flt_460', name: 'Hopp pricing',
      description: 'US$1.00 to start and US$0.50 per minute.', price: 1, currency: 'USD', is_taxable: false,
      per_min_price: [{ start: 0, interval: 1, rate: 0.5 }] }, [
      hoppScooter('fba01dc7-561d-44a4-9d9a-5a8391f9b5e2', 'XX638', 12.149902, -68.276282,
        { pricing_plan_id: 'flt_460', vehicle_type_id: 'vtp_120', hopp_battery_level: 19, current_range_meters: 5200 }),
    ]));
    const result = await fetchScooters({ bounds: system('hopp_bq_bonaire').bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.caribbeannetherlands).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      vehicle_id: 'hopp_bq_bonaire:fba01dc7-561d-44a4-9d9a-5a8391f9b5e2', battery: 19, range_m: 5200,
      pricing: { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 50 },
    })]);
    expect(result.vehicles[0].pricing).not.toHaveProperty('plus_tax');
    // Bonaire speaks Papiamentu, Dutch and English: Spain's word, not Latin America's.
    expect(saysScooter('es', 'BQ')).toBe(false);
  });

  // The scooters at the edges of where they stood in the polls of 15 and 16 October 2026.
  it('keeps every scooter that stood available in the polls, and none of those left far outside', () => {
    for (const [id, lat, lng, served] of [
      // Tamarindo: the farthest south, west, north and east an available scooter stood.
      ['hopp_cr_tamarindo', 10.28687, -85.8445, true], ['hopp_cr_tamarindo', 10.2953, -85.85135, true],
      ['hopp_cr_tamarindo', 10.30408, -85.8401, true], ['hopp_cr_tamarindo', 10.2984, -85.83561, true],
      // Two disabled ones: at Las Delicias, 13 km east, and on the road 3 km east.
      ['hopp_cr_tamarindo', 10.239562, -85.723008, false], ['hopp_cr_tamarindo', 10.306537, -85.806587, false],
      // Bonaire: from Belnem to north of the airport, and Rincon, where Hopp draws a zone of its own.
      ['hopp_bq_bonaire', 12.11044, -68.2801, true], ['hopp_bq_bonaire', 12.15, -68.29222, true],
      ['hopp_bq_bonaire', 12.17264, -68.2801, true], ['hopp_bq_bonaire', 12.15, -68.26966, true],
      ['hopp_bq_bonaire', 12.2375, -68.331, true],
    ] as const) {
      expect(systemServesPoint(system(id), lat, lng), `${id} at ${lat}, ${lng}`).toBe(served);
    }
    // One area each, the whole of Hopp's zones and a kilometre more.
    expect(serviceAreas(system('hopp_cr_tamarindo')).map(area => area.city)).toEqual(['Tamarindo']);
    expect(serviceAreas(system('hopp_bq_bonaire')).map(area => area.city)).toEqual(['Kralendijk']);
  });

  it.each([
    ['Tamarindo', 'Tamarindo', 'Costa Rica'], ['Playa Tamarindo', 'Tamarindo', 'Costa Rica'], ['Langosta', 'Tamarindo', 'Costa Rica'],
    ['Tamarindo, Costa Rica', 'Tamarindo', 'Costa Rica'], ['Tamarindo Kostaríka', 'Tamarindo', 'Costa Rica'],
    ['Kralendijk', 'Kralendijk', 'Caribbean Netherlands'], ['Bonaire', 'Kralendijk', 'Caribbean Netherlands'],
    ['Kralendijk, Bonaire', 'Kralendijk', 'Caribbean Netherlands'], ['Kralendijk Caribbean Netherlands', 'Kralendijk', 'Caribbean Netherlands'],
    ['Kralendijk, Caribisch Nederland', 'Kralendijk', 'Caribbean Netherlands'],
  ])('finds "%s" as %s', (query, title, subtitle) => {
    expect(namedCities(query)[0]).toMatchObject({ city: { title, subtitle } });
  });

  it('names the country in the language asked for, and takes no beach called "Playa" for Kralendijk', () => {
    expect(namedCities('Bonaire', 'nl')[0]).toMatchObject({ city: { title: 'Kralendijk', subtitle: 'Caribisch Nederland' } });
    expect(namedCities('Tamarindo', 'is')[0]).toMatchObject({ city: { title: 'Tamarindo', subtitle: 'Kostaríka' } });
    expect(searchRegionalScooterCities('Langosta').map(city => city.display_name)).toEqual(['Tamarindo, Costa Rica']);
    // Kralendijk is Playa in Papiamentu, but in Spanish any beach is one: "Playa" is on its way
    // to Playa de las Américas or Playa Tamarindo, and is no town typed in full.
    expect(namedCities('Playa').map(({ city, exact }) => [city.title, exact])).toEqual([['Playa de las Américas', false], ['Tamarindo', false]]);
  });
});
