import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchScooters } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, serviceAreas } from './regionalScooterSystems';
import { systemServesPoint } from './townOutlines';
import { formatRegion } from './formatLocale';
import { saysScooter } from './i18n';
import { startCity, timeZoneCountry } from './startPlace';
import { namedCities } from '@/app/api/geocode/cities';
import { COUNTRY_CONTINENTS, COUNTRY_REGIONS } from '@/generated/countries';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

/** A Hopp town's GBFS 2.2 feed as api.hopp.bike serves it: one scooter type, its plans in US dollars, Hopp's own battery field. */
function hoppFeed(id: string, typeId: string, plans: object[], bikes: object[]) {
  const town = system(id);
  const base = new URL('.', town.discoveryUrl).toString();
  return vi.fn(async (url: string) => {
    if (url === town.discoveryUrl) return response({ last_updated: Math.floor(Date.now() / 1000), ttl: 0, version: '2.2', data: { en: { feeds: [
      'system_information', 'free_bike_status', 'geofencing_zones', 'system_pricing_plans', 'vehicle_types',
    ].map(name => ({ name, url: `${base}en/${name}.json` })) } } });
    if (url === `${base}en/vehicle_types.json`) return response({ data: { vehicle_types: [
      { vehicle_type_id: typeId, propulsion_type: 'electric', form_factor: 'scooter', max_range_meters: 40000 }] } });
    if (url === `${base}en/system_pricing_plans.json`) return response({ data: { plans } });
    if (url === `${base}en/free_bike_status.json`) return response({ last_updated: Math.floor(Date.now() / 1000), ttl: 0, data: { bikes } });
    throw new Error(`Unexpected upstream ${url}`);
  });
}

const hoppScooter = (bikeId: string, code: string, lat: number, lon: number, extra: object = {}) => ({
  bike_id: bikeId, lat, lon, is_disabled: false, is_reserved: false, current_range_meters: 29200, hopp_battery_level: 79, hopp_code: code,
  rental_uris: { android: `https://app.hopp.bike/launch/${bikeId}?direct`, ios: `https://app.hopp.bike/launch/${bikeId}?direct` },
  hopp_deeplink: `https://app.hopp.bike/launch/${bikeId}?direct`, ...extra,
});

// The plans of 4 November 2026, each given twice under two ids, as Hopp does.
const plan = (id: string, start: number, minute: number) => ({ plan_id: id, name: 'Hopp pricing',
  description: `US$${start.toFixed(2)} to start and US$${minute.toFixed(2)} per minute.`, price: start, currency: 'USD', is_taxable: false,
  per_min_price: [{ start: 0, interval: 1, rate: minute }] });

describe('Bahrain and the Dominican Republic', () => {
  it('reads Hopp in Bahrain, in three towns, and in Punta Cana, each by its own clock', () => {
    const towns = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'BH' || entry.country === 'DO');
    expect(towns.map(entry => [entry.id, entry.country, entry.discoveryUrl, entry.timeZone])).toEqual([
      ['hopp_bh_bahrain', 'BH', 'https://api.hopp.bike/gbfs/bh-bahrain/gbfs.json', 'Asia/Bahrain'],
      ['hopp_do_punta_cana', 'DO', 'https://api.hopp.bike/gbfs/do-punta-cana/gbfs.json', 'America/Santo_Domingo'],
    ]);
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'BH' || entry.country === 'DO').map(entry => entry.id))
      .toEqual(['bh:Manama', 'bh:Amwaj Islands', 'bh:Zallaq', 'do:Punta Cana']);
    expect(COUNTRY_REGIONS.BH).toBeUndefined();
    expect(COUNTRY_REGIONS.DO).toBeUndefined();
    expect([COUNTRY_CONTINENTS.BH, COUNTRY_CONTINENTS.DO]).toEqual(['asia', 'north-america']);
  });

  it('opens the map in Bahrain or on Punta Cana for a device on Bahrain\'s or the Dominican Republic\'s clock', () => {
    expect(timeZoneCountry('Asia/Bahrain')).toBe('BH');
    expect(timeZoneCountry('America/Santo_Domingo')).toBe('DO');
    // The town nearest the zone's point, which the time-zone database puts off the north coast, at 26.38° N.
    expect(startCity('Asia/Bahrain')?.id).toBe('bh:Amwaj Islands');
    expect(startCity('America/Santo_Domingo')?.id).toBe('do:Punta Cana');
  });

  it('reads Hopp Bahrain: US$0.80 to start and 26¢ a minute with no "+ tax", in each of its three towns', async () => {
    vi.stubGlobal('fetch', hoppFeed('hopp_bh_bahrain', 'vtp_119', [plan('flt_479', 0.8, 0.26), plan('flt_392', 0.8, 0.26)], [
      hoppScooter('0bafced3-ad8b-46f1-9525-18757003d313', 'XX780', 26.232869, 50.599258, { pricing_plan_id: 'flt_392', vehicle_type_id: 'vtp_119' }),
      hoppScooter('amwaj', 'XX630', 26.28929, 50.66473, { pricing_plan_id: 'flt_479', vehicle_type_id: 'vtp_119' }),
      hoppScooter('zallaq', 'XX335', 25.991047, 50.464453, { pricing_plan_id: 'flt_392', vehicle_type_id: 'vtp_119' }),
    ]));
    const result = await fetchScooters({ bounds: system('hopp_bh_bahrain').bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.bahrain).toBe('fresh');
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual([
      'hopp_bh_bahrain:0bafced3-ad8b-46f1-9525-18757003d313', 'hopp_bh_bahrain:amwaj', 'hopp_bh_bahrain:zallaq',
    ]);
    expect(result.vehicles[0]).toEqual(expect.objectContaining({
      provider: 'hopp', battery: 79, range_m: 29200,
      pricing: { currency: 'USD', unlock_fee_minor_units: 80, minute_fee_minor_units: 26 },
      deep_link: 'https://app.hopp.bike/launch/0bafced3-ad8b-46f1-9525-18757003d313?direct',
    }));
    expect(result.vehicles[0].pricing).not.toHaveProperty('plus_tax');
  });

  it('reads Hopp Punta Cana: US$3 to start and 40¢ a minute, and says "scooter" in Dominican Spanish', async () => {
    vi.stubGlobal('fetch', hoppFeed('hopp_do_punta_cana', 'vtp_120', [plan('flt_438', 3, 0.4), plan('flt_463', 3, 0.4), plan('flt_477', 1, 0.3)], [
      hoppScooter('2e1b1ea5-692e-4af4-88aa-b7fec20b3b7c', 'XX512', 18.498934, -68.379297,
        { pricing_plan_id: 'flt_438', vehicle_type_id: 'vtp_120', hopp_battery_level: 43, current_range_meters: 14800 }),
    ]));
    const result = await fetchScooters({ bounds: system('hopp_do_punta_cana').bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.dominicanrepublic).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      vehicle_id: 'hopp_do_punta_cana:2e1b1ea5-692e-4af4-88aa-b7fec20b3b7c', battery: 43, range_m: 14800,
      pricing: { currency: 'USD', unlock_fee_minor_units: 300, minute_fee_minor_units: 40 },
    })]);
    expect(result.vehicles[0].pricing).not.toHaveProperty('plus_tax');
    expect(saysScooter('es', formatRegion('es', ['es-DO', 'es']))).toBe(true);
  });

  // The scooters at the edges of where they stood in the polls of 4 November 2026.
  it('keeps every scooter that stood in the polls, and none in the parts of Hopp\'s zone where none stood', () => {
    for (const [id, lat, lng, served] of [
      // Manama, at Al-Qudaibiya; the Amwaj Islands; Zallaq, by Al Jazayer beach.
      ['hopp_bh_bahrain', 26.23033, 50.59944, true], ['hopp_bh_bahrain', 26.23287, 50.59926, true],
      ['hopp_bh_bahrain', 26.28929, 50.66473, true], ['hopp_bh_bahrain', 25.99105, 50.46445, true],
      // Riffa and Sitra, inside Hopp's zone, where no scooter stood.
      ['hopp_bh_bahrain', 26.13, 50.555, false], ['hopp_bh_bahrain', 26.155, 50.62, false],
      // Cap Cana: the farthest south, west, north and east a scooter stood.
      ['hopp_do_punta_cana', 18.45669, -68.42231, true], ['hopp_do_punta_cana', 18.51182, -68.39597, true],
      ['hopp_do_punta_cana', 18.50174, -68.37724, true],
      // Bávaro, north of Hopp's zone, and La Romana, whose zone held no scooter.
      ['hopp_do_punta_cana', 18.68, -68.42, false], ['hopp_do_punta_cana', 18.43, -68.97, false],
    ] as const) {
      expect(systemServesPoint(system(id), lat, lng), `${id} at ${lat}, ${lng}`).toBe(served);
    }
    expect(serviceAreas(system('hopp_bh_bahrain')).map(area => area.city)).toEqual(['Manama', 'Amwaj Islands', 'Zallaq']);
    expect(serviceAreas(system('hopp_do_punta_cana')).map(area => area.city)).toEqual(['Punta Cana']);
  });

  it.each([
    ['Manama', 'Manama', 'Bahrain'], ['Manama, Bahrain', 'Manama', 'Bahrain'], ['المنامة', 'Manama', 'Bahrain'],
    ['Amwaj', 'Amwaj Islands', 'Bahrain'], ['Zallaq', 'Zallaq', 'Bahrain'], ['Al Jazayer', 'Zallaq', 'Bahrain'],
    ['Punta Cana', 'Punta Cana', 'Dominican Republic'], ['Cap Cana', 'Punta Cana', 'Dominican Republic'],
    ['Punta Cana, República Dominicana', 'Punta Cana', 'Dominican Republic'],
  ])('finds "%s" as %s', (query, title, subtitle) => {
    expect(namedCities(query)[0]).toMatchObject({ city: { title, subtitle } });
  });
});
