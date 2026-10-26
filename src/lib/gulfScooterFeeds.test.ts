import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchScooters, independentCollectableFeeds } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { boundsContainPoint } from './geo';
import { cityOfAddress, namedCities } from '@/app/api/geocode/cities';
import { COUNTRY_SEARCH_WORDS } from '@/generated/countries';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

/** A Dott region as gbfs.api.ridedott.com serves it: GBFS 2.3, scooters and e-bikes, one price plan each. */
function dottFeeds(id: string, currency: string, unlock: number, minute: number, bikes: object[]) {
  const dott = system(id);
  const base = new URL('.', dott.discoveryUrl).toString();
  return async (url: string) => {
    if (url === dott.discoveryUrl) return response({ version: '2.3', data: { en: { feeds: ['free_bike_status', 'system_pricing_plans',
      'vehicle_types'].map(name => ({ name, url: `${base}${name}.json` })) } } });
    if (url === `${base}vehicle_types.json`) return response({ version: '2.3', data: { vehicle_types: [
      { vehicle_type_id: 'dott_scooter', form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 30000, pricing_plan_ids: ['scooter'] },
      { vehicle_type_id: 'dott_bicycle', form_factor: 'bicycle', propulsion_type: 'electric_assist', max_range_meters: 100000, pricing_plan_ids: ['bicycle'] },
    ] } });
    if (url === `${base}system_pricing_plans.json`) return response({ version: '2.3', data: { plans: ['scooter', 'bicycle'].map(plan => ({
      plan_id: plan, name: `${id}-${plan}-system-pricing-plan`, currency, price: unlock, is_taxable: false,
      per_min_pricing: [{ interval: 1, rate: minute, start: 1 }] })) } });
    if (url === `${base}free_bike_status.json`) return response({ version: '2.3', ttl: 300, last_updated: Math.floor(Date.now() / 1000),
      data: { bikes } });
    return null;
  };
}

const dottScooter = (id: string, lat: number, lon: number, type = 'dott_scooter') => ({
  bike_id: id, lat, lon, is_disabled: false, is_reserved: false, vehicle_type_id: type, pricing_plan_id: type === 'dott_scooter' ? 'scooter' : 'bicycle',
  current_range_meters: 20876, current_fuel_percent: 0.77, last_reported: Math.floor(Date.now() / 1000) - 300,
  rental_uris: { android: `https://go.ridedott.com/vehicles/${id}?platform=android`, ios: `https://go.ridedott.com/vehicles/${id}?platform=ios` },
});

function serve(...feeds: ((url: string) => Promise<Response | null>)[]) {
  return vi.fn(async (url: string) => {
    for (const feed of feeds) {
      const answer = await feed(url);
      if (answer) return answer;
    }
    throw new Error(`Unexpected upstream ${url}`);
  });
}

// SAHAM's feed in Riyadh, on ATOM Mobility: GBFS 3.0, a range and no charge, no unlock fee, and no time on any scooter.
const SAHAM_LINK = 'https://ride-saham.app.link/0131';
function sahamFeeds(lastUpdated: string, vehicles: object[]) {
  const saham = system('saham_sa_riyadh');
  const base = new URL('.', saham.discoveryUrl).toString();
  return async (url: string) => {
    if (url === saham.discoveryUrl) return response({ version: '3.0', last_updated: lastUpdated, ttl: 0, data: { feeds: ['vehicle_types',
      'vehicle_status', 'system_pricing_plans'].map(name => ({ name, url: `${base}${name}` })) } });
    if (url === `${base}vehicle_types`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 0, data: { vehicle_types: [
      { vehicle_type_id: '994', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 40000, default_pricing_plan_id: '994' },
    ] } });
    if (url === `${base}system_pricing_plans`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 0, data: { plans: [{
      plan_id: '994', name: [{ text: 'SAHAM Scooter', language: 'en' }], currency: 'SAR', price: 0.0, is_taxable: false,
      description: [{ text: 'This is pricing plan for SAHAM Scooter; Maximum distance is 40.00; Maximum price per ride is 200.00;', language: 'en' }],
      per_min_pricing: [{ start: 0, rate: 1.0, interval: 1 }] }] } });
    if (url === `${base}vehicle_status`) return response({ version: '3.0', last_updated: lastUpdated, ttl: 0, data: { vehicles } });
    return null;
  };
}
const sahamScooter = (id: string, lat: number, lon: number) => ({
  vehicle_id: id, lat, lon, is_reserved: false, is_disabled: false, vehicle_type_id: '994', current_range_meters: 34000, pricing_plan_id: '994',
  rental_uris: { android: SAHAM_LINK, ios: SAHAM_LINK, web: 'https://ride-saham.app.link/' },
});

describe('the United Arab Emirates and Saudi Arabia', () => {
  it('lists Dott\'s two Dubai fleets, Abu Dhabi, SAHAM in Riyadh and Dott in Jeddah, each by its own clock', () => {
    const gulf = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'AE' || entry.country === 'SA');
    expect(gulf.filter(entry => !entry.limeAppMap).map(entry => [entry.id, entry.timeZone])).toEqual([
      ['dott_ae_dubai', 'Asia/Dubai'], ['dott_ae_dubai_hills', 'Asia/Dubai'], ['dott_ae_abu_dhabi', 'Asia/Dubai'],
      ['saham_sa_riyadh', 'Asia/Riyadh'], ['dott_sa_jeddah', 'Asia/Riyadh'],
    ]);
    // Lime publishes no feed here: its rider map, read in small groups, since 26 October 2026.
    const lime = gulf.filter(entry => entry.limeAppMap);
    expect([...new Set(lime.map(entry => entry.city))]).toEqual(['Abu Dhabi', 'Al Ain', 'Dubai']);
    for (const entry of lime) expect(entry.timeZone, entry.id).toBe('Asia/Dubai');
    // Dubai Hills is a fleet of its own, inside Dubai: one town, one total.
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'AE' || entry.country === 'SA').map(entry => entry.id))
      .toEqual(['ae:Dubai', 'ae:Abu Dhabi', 'ae:Al Ain', 'sa:Riyadh', 'sa:Jeddah']);
    const dubai = system('dott_ae_dubai').bounds;
    const hills = system('dott_ae_dubai_hills').bounds;
    expect(hills.south >= dubai.south && hills.north <= dubai.north && hills.west >= dubai.west && hills.east <= dubai.east).toBe(true);
  });

  it('leaves out the scooters Dott\'s feeds place in Hatta, in Al Ain, or in Dubai for Abu Dhabi', () => {
    const inside = (id: string, lat: number, lon: number) => serviceAreas(system(id)).some(area => boundsContainPoint(area.bounds, lat, lon));
    // Hatta, Dubai's exclave in the mountains, and Al Ain, have a dozen scooters each and hardly a ride.
    expect(inside('dott_ae_dubai', 24.7997, 56.1311)).toBe(false);
    expect(inside('dott_ae_abu_dhabi', 24.2236, 55.7559)).toBe(false);
    // Two of Abu Dhabi's stood in Al Quoz, in Dubai.
    expect(inside('dott_ae_abu_dhabi', 25.1324, 55.2165)).toBe(false);
    // The west of Abu Dhabi's island, outside Dott's ride zones, is where most of its scooters stand.
    expect(inside('dott_ae_abu_dhabi', 24.4714, 54.3412)).toBe(true);
  });

  it('reads both Dott fleets of Dubai into the town, with their own prices in dirhams, and not their e-bikes', async () => {
    vi.stubGlobal('fetch', serve(
      dottFeeds('dott_ae_dubai', 'AED', 3.5, 1.5, [dottScooter('marina', 25.0805, 55.1403), dottScooter('ebike', 25.0806, 55.1404, 'dott_bicycle'),
        dottScooter('hatta', 24.7997, 56.1311)]),
      dottFeeds('dott_ae_dubai_hills', 'AED', 3, 1.2, [dottScooter('hills', 25.1108, 55.2482)]),
    ));
    const result = await fetchScooters({ bounds: system('dott_ae_dubai').bounds, minBattery: 0, providers: new Set(['dott']) });
    expect(result.meta.sources.emirates).toBe('fresh');
    expect(result.vehicles.map(vehicle => [vehicle.vehicle_id, vehicle.pricing]).sort()).toEqual([
      ['dott_ae_dubai:marina', { currency: 'AED', unlock_fee_minor_units: 350, minute_fee_minor_units: 150 }],
      ['dott_ae_dubai_hills:hills', { currency: 'AED', unlock_fee_minor_units: 300, minute_fee_minor_units: 120 }],
    ]);
  });

  it('reads SAHAM\'s feed: no unlock fee and SAR 1 a minute, the range, and the link to the number on the scooter', async () => {
    vi.stubGlobal('fetch', serve(sahamFeeds(new Date().toISOString(),
      [sahamScooter('3616726088974152501', 24.7015, 46.6963), sahamScooter('jeddah', 21.64, 39.10)])));
    const riyadh = expect.objectContaining({
      provider: 'saham', vehicle_id: 'saham_sa_riyadh:3616726088974152501', battery: null, range_m: 34000,
      pricing: { currency: 'SAR', unlock_fee_minor_units: 0, minute_fee_minor_units: 100 },
      // The number at the end of the link is the one on the scooter, which outlives its rotating id.
      rental_uris: { android: SAHAM_LINK, ios: SAHAM_LINK, web: 'https://ride-saham.app.link/' },
    });
    const collector = independentCollectableFeeds().find(feed => feed.id === 'saudiarabia:saham_sa_riyadh')!;
    expect((await collector.collect()).vehicles).toEqual([riyadh]);
    upstreamJsonCache.clear();
    const result = await fetchScooters({ bounds: system('saham_sa_riyadh').bounds, minBattery: 0, providers: new Set(['saham']) });
    expect(result.meta.sources.saudiarabia).toBe('fresh');
    expect(result.vehicles).toEqual([riyadh]);
  });

  it('judges SAHAM\'s positions by the time of its feed, as the other feeds on ATOM Mobility, and drops them when it is old', async () => {
    // No scooter has a time of its own: a feed last updated 20 minutes ago is out of date, as any other is.
    vi.stubGlobal('fetch', serve(sahamFeeds(new Date(Date.now() - 20 * 60_000).toISOString(), [sahamScooter('a', 24.7015, 46.6963)])));
    await expect(fetchScooters({ bounds: system('saham_sa_riyadh').bounds, minBattery: 0, providers: new Set(['saham']) }))
      .rejects.toMatchObject({ failedSources: ['saudiarabia:saham_sa_riyadh'] });
  });

  it.each([
    ['Dubai', 'Dubai'], ['دبي', 'Dubai'], ['Dubai UAE', 'Dubai'], ['دبي الإمارات', 'Dubai'], ['Abu Dhabi', 'Abu Dhabi'],
    ['أبوظبي', 'Abu Dhabi'], ['أبو ظبي', 'Abu Dhabi'], ['Abu Dhabi Emirates', 'Abu Dhabi'], ['Riyadh', 'Riyadh'], ['الرياض', 'Riyadh'],
    ['Riyadh KSA', 'Riyadh'], ['Jeddah', 'Jeddah'], ['Jiddah', 'Jeddah'], ['جدة', 'Jeddah'], ['Jeddah Saudi Arabia', 'Jeddah'],
    ['جدة السعودية', 'Jeddah'], ['Al Ain', 'Al Ain'], ['العين', 'Al Ain'], ['Al Ain City', 'Al Ain'],
  ])('finds "%s" as %s', (query, title) => {
    expect(namedCities(query).map(({ city }) => city.title)).toEqual([title]);
  });

  it('names the country after the town, and reads the Mall of the Emirates as a place, not as a town of the Emirates', () => {
    expect(searchRegionalScooterCities('Dubai').map(city => city.display_name)).toEqual(['Dubai, United Arab Emirates']);
    expect(searchRegionalScooterCities('Riyadh').map(city => city.display_name)).toEqual(['Riyadh, Saudi Arabia']);
    expect(namedCities('Mall of the Emirates')).toEqual([]);
    expect(cityOfAddress('Mall of the Emirates')).toBeNull();
    // Never "sa", which is a word of many a town and street.
    expect(COUNTRY_SEARCH_WORDS.SA).not.toContain('sa');
  });
});
