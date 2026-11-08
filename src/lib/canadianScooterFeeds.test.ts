import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchScooters, independentCollectableFeeds } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
import { activeSeasonalPause, feedPaused } from './seasonalPauses';
import { isEmptyUndatedStatus } from './feedValidation';
import { filterReturningParking, normalizeParkingLocations } from './parking';
import { namedCities } from '@/app/api/geocode/cities';

const response = (data: unknown) => new Response(JSON.stringify(data));
const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;
const city = (id: string) => REGIONAL_SCOOTER_CITIES.find(entry => entry.id === id)!;
const collector = (id: string) => independentCollectableFeeds().find(feed => feed.id === `canada:${id}`)!;
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

// Bird's two vehicle types in every Canadian town, as its feeds list them.
const BIRD_SCOOTER = 'bae2102b-56ba-42ba-9097-720e5990b4b2';
const BIRD_EBIKE = '2ea3c8b2-ed07-4c53-b87e-638c08471309';

/** A Bird town as mds.bird.co serves it: GBFS 2.3, no prices, and the status the test gives. */
function serveBird(id: string, status: () => object) {
  const bird = system(id);
  const base = new URL('.', bird.discoveryUrl).toString();
  return vi.fn(async (url: string) => {
    if (url === bird.discoveryUrl) return response({ version: '2.3', data: { en: { feeds: ['free_bike_status', 'system_information',
      'system_pricing_plans', 'vehicle_types'].map(name => ({ name, url: `${base}${name}.json` })) } } });
    if (url === `${base}vehicle_types.json`) return response({ version: '2.3', data: { vehicle_types: [
      { vehicle_type_id: BIRD_SCOOTER, form_factor: 'scooter', propulsion_type: 'electric', max_range_meters: 24000.0 },
      { vehicle_type_id: BIRD_EBIKE, form_factor: 'bicycle', propulsion_type: 'electric_assist', max_range_meters: 60000.0 },
    ] } });
    if (url === `${base}system_pricing_plans.json`) return response({ version: '2.3', data: { plans: [] } });
    if (url === `${base}free_bike_status.json`) return response(status());
    throw new Error(`Unexpected upstream ${url}`);
  });
}

describe('Canada', () => {
  it('names every town with its province, in that province\'s time zone', () => {
    const canadian = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'CA');
    expect(canadian.filter(entry => !entry.limeAppMap && !entry.birdAppArea).map(entry => entry.id).sort()).toEqual([
      'bird_ca_calgary', 'bird_ca_edmonton', 'bird_ca_halifax', 'bird_ca_hamilton', 'bird_ca_leduc', 'bird_ca_ottawa',
      'bird_ca_vaughan', 'bird_ca_windsor', 'lime_ca_calgary', 'lime_ca_edmonton', 'lime_ca_kelowna', 'lime_ca_mississauga',
      'lime_ca_ottawa', 'lime_ca_vancouver', 'move_ca_new_brunswick',
    ]);
    // Lime's towns with no public feed: its rider map, read in small groups, since 26 October 2026, and since
    // 27 October its former Neuron towns.
    expect([...new Set(canadian.filter(entry => entry.limeAppMap).map(entry => entry.city))]).toEqual([
      'Ajax', 'Coquitlam', 'Laval', 'Montréal', 'Port Moody', 'Richmond', 'Vaughan', 'Blackfalds', 'Waterloo Region', 'Lacombe', 'Red Deer',
      'Regina', 'Saskatoon',
    ]);
    // Bird's towns with no public feed: its rider map, each operating area swept whole, since 28 October 2026.
    expect(canadian.filter(entry => entry.birdAppArea).map(entry => entry.city)).toEqual([
      'Brampton', 'Cochrane', 'Cranbrook', 'Kamloops', 'Lethbridge', 'Medicine Hat', 'Mississauga', 'Okotoks', 'Oshawa', 'Penticton',
      'Pickering', 'Spruce Grove', 'St. Albert', 'Vernon',
    ]);
    // Saskatchewan keeps standard time all year, and Cranbrook, in the East Kootenay, Alberta's time.
    const zones = { AB: 'America/Edmonton', BC: 'America/Vancouver', ON: 'America/Toronto', QC: 'America/Toronto', NS: 'America/Halifax',
      NB: 'America/Moncton', SK: 'America/Regina' };
    for (const entry of canadian) {
      for (const area of serviceAreas(entry)) {
        const region = (area.region ?? entry.region) as keyof typeof zones;
        const zone = area.city === 'Cranbrook' ? 'America/Edmonton' : zones[region];
        expect(zone, `${entry.id} in ${area.city}`).toBe(area.timeZone ?? entry.timeZone);
      }
    }
    // Lime's Calgary and Edmonton feeds hold their neighbours' scooters too: each counts under its own town.
    expect(serviceAreas(system('lime_ca_calgary')).map(area => area.city)).toEqual(['Calgary', 'Airdrie']);
    expect(serviceAreas(system('lime_ca_edmonton')).map(area => area.city)).toEqual(['Edmonton', 'St. Albert', 'Beaumont']);
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'CA').map(entry => entry.city).sort()).toEqual([
      'Airdrie, AB', 'Ajax, ON', 'Beaumont, AB', 'Blackfalds, AB', 'Brampton, ON', 'Calgary, AB', 'Cochrane, AB', 'Coquitlam, BC',
      'Cranbrook, BC', 'Edmonton, AB', 'Fredericton, NB', 'Halifax, NS', 'Hamilton, ON', 'Kamloops, BC', 'Kelowna, BC', 'Lacombe, AB',
      'Laval, QC', 'Leduc, AB', 'Lethbridge, AB', 'Medicine Hat, AB', 'Mississauga, ON', 'Moncton, NB', 'Montréal, QC', 'Okotoks, AB',
      'Oshawa, ON', 'Ottawa, ON', 'Penticton, BC', 'Pickering, ON', 'Port Moody, BC', 'Red Deer, AB', 'Regina, SK', 'Richmond, BC',
      'Saint John, NB', 'Saskatoon, SK', 'Spruce Grove, AB', 'St. Albert, AB', 'Vancouver, BC', 'Vaughan, ON', 'Vernon, BC',
      'Waterloo Region, ON', 'Windsor, ON',
    ]);
    expect(city('ca:on:Ottawa')).toMatchObject({ city: 'Ottawa, ON', country: 'CA', region: 'ON' });
  });

  it.each([
    ['Ottawa', 'Ottawa, ON'], ['Ottawa ON', 'Ottawa, ON'], ['Ottawa, Ontario', 'Ottawa, ON'], ['Calgary Alberta', 'Calgary, AB'],
    ['Vancouver BC', 'Vancouver, BC'], ['Vancouver Colombie-Britannique', 'Vancouver, BC'], ['Halifax Nouvelle-Écosse', 'Halifax, NS'],
    ['Dartmouth', 'Halifax, NS'], ['Dartmouth NS', 'Halifax, NS'], ['Tecumseh', 'Windsor, ON'], ['St Albert', 'St. Albert, AB'],
    ['Saint-Albert', 'St. Albert, AB'], ['St. Albert AB', 'St. Albert, AB'], ['Stony Plain', 'Spruce Grove, AB'], ['Airdrie', 'Airdrie, AB'], ['Edmonton Canada', 'Edmonton, AB'],
    ['Laval Québec', 'Laval, QC'], ['Parc Jean-Drapeau', 'Montréal, QC'], ['Île Sainte-Hélène', 'Montréal, QC'], ['Richmond BC', 'Richmond, BC'],
    // Lime's Waterloo Region zone covers its three cities.
    ['Kitchener', 'Waterloo Region, ON'], ['Waterloo', 'Waterloo Region, ON'], ['Cambridge ON', 'Waterloo Region, ON'],
    ['Saskatoon', 'Saskatoon, SK'], ['Regina Saskatchewan', 'Regina, SK'], ['Red Deer', 'Red Deer, AB'],
  ])('finds "%s" as %s', (query, title) => {
    expect(namedCities(query)[0].city.title).toBe(title);
  });

  it('lists Halifax under Dartmouth, across the harbour, and Windsor under Tecumseh', () => {
    expect(searchRegionalScooterCities('Dartmouth')[0].display_name).toBe('Halifax, NS, Canada');
    expect(searchRegionalScooterCities('Tecumseh')[0].display_name).toBe('Windsor, ON, Canada');
  });

  it('reads Bird Calgary\'s feed: its scooters, not its e-bikes, with their battery and range', async () => {
    const bird = system('bird_ca_calgary');
    // As Bird publishes them in Calgary, with no rental link of their own.
    const scooter = { bike_id: '702b400a-9f33-473e-89d5-46cafb0393ba', lat: 51.030849599999996, lon: -114.0325907,
      is_disabled: false, is_reserved: false, vehicle_type_id: BIRD_SCOOTER, last_reported: Math.floor(Date.now() / 1000) - 120,
      current_range_meters: 14130.0, current_fuel_percent: 0.32258064 };
    vi.stubGlobal('fetch', serveBird('bird_ca_calgary', () => ({ version: '2.3', ttl: 60, last_updated: Math.floor(Date.now() / 1000),
      data: { bikes: [scooter, { ...scooter, bike_id: 'ebike', vehicle_type_id: BIRD_EBIKE },
        { ...scooter, bike_id: 'reserved', is_reserved: true }, { ...scooter, bike_id: 'disabled', is_disabled: true }] } })));
    const result = await fetchScooters({ bounds: bird.bounds, minBattery: 0, providers: new Set(['bird']) });
    expect(result.meta.sources.canada).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'bird', vehicle_id: `bird_ca_calgary:${scooter.bike_id}`, battery: 32, range_m: 14130,
      // The card opens Bird's app; Bird publishes no prices in Canada.
      rental_uris: { ios: null, android: null, web: null },
    })]);
    expect(result.vehicles[0]).not.toHaveProperty('pricing');
  });

  it('shows an empty Bird town, as on a snow day, as empty rather than as a feed that stopped', async () => {
    // What Bird serves where it has no scooter out: no vehicles, and a time of 0.
    const empty = { version: '2.3', data: { bikes: [] }, last_updated: 0, ttl: 60 };
    expect(isEmptyUndatedStatus(empty)).toBe(true);
    const bird = system('bird_ca_calgary');
    vi.stubGlobal('fetch', serveBird('bird_ca_calgary', () => empty));
    const result = await fetchScooters({ bounds: bird.bounds, minBattery: 0, providers: new Set(['bird']) });
    expect(result.vehicles).toEqual([]);
    expect(result.meta).toMatchObject({ partial: false, failedSources: [], sources: { canada: 'skipped' } });
    // The cache leaves it out of the feed states, so the feed-stopped alert has nothing to fire on.
    await expect(collector('bird_ca_calgary').collect()).resolves.toEqual({ vehicles: [], stale: false, skipped: true });
  });

  it('still fails a Bird feed with a time of 0 that lists scooters, or an empty one that is out of date', async () => {
    const bird = system('bird_ca_calgary');
    const scooter = { bike_id: 'a', lat: 51.03, lon: -114.03, is_disabled: false, is_reserved: false, vehicle_type_id: BIRD_SCOOTER };
    const statuses = [
      { version: '2.3', data: { bikes: [scooter] }, last_updated: 0 },
      { version: '2.3', data: { bikes: [] }, last_updated: Math.floor(Date.now() / 1000) - 3600 },
      { version: '2.3', data: {}, last_updated: 0 },
    ];
    for (const status of statuses) {
      upstreamJsonCache.clear();
      vi.stubGlobal('fetch', serveBird('bird_ca_calgary', () => status));
      await expect(fetchScooters({ bounds: bird.bounds, minBattery: 0, providers: new Set(['bird']) }), JSON.stringify(status))
        .rejects.toMatchObject({ failedSources: ['canada:bird_ca_calgary'] });
    }
    expect(isEmptyUndatedStatus({ last_updated: 0, data: { vehicles: [] } })).toBe(true);
    expect(isEmptyUndatedStatus({ last_updated: '0', data: { bikes: [] } })).toBe(false);
    expect(isEmptyUndatedStatus(null)).toBe(false);
  });

  it('counts the scooters of Lime\'s Calgary and Edmonton feeds under Airdrie, St. Albert and Beaumont where they stand', () => {
    const now = Date.now();
    const scooter = (id: string, lat: number, lng: number) => ({ provider: 'lime', vehicle_id: id, lat, lng, battery: null, range_m: 20000,
      deep_link: null, rental_uris: { ios: null, android: null, web: null }, distance_m: 0 });
    const feed = (id: string, vehicles: ReturnType<typeof scooter>[]): FeedSnapshot => ({ id: `canada:${id}`, source: 'canada', provider: 'lime',
      coverage: serviceAreas(system(id)).map(area => area.bounds), vehicles, observedAt: now, attemptedAt: now, collectedAt: now,
      stale: false, failed: false, skipped: false });
    const overview = buildCityOverview([
      feed('lime_ca_calgary', [scooter('downtown', 51.0447, -114.0719), scooter('airdrie', 51.2917, -114.0144)]),
      feed('lime_ca_edmonton', [scooter('whyte', 53.5181, -113.4977), scooter('st-albert', 53.6305, -113.6256),
        scooter('beaumont', 53.3572, -113.4147)]),
    ], now);
    const total = (id: string) => Object.values(overview.cities.find(entry => entry.id === id)!.batteries)
      .flat().reduce((sum, count) => sum + count, 0);
    expect(['ca:ab:Calgary', 'ca:ab:Airdrie', 'ca:ab:Edmonton', 'ca:ab:St. Albert', 'ca:ab:Beaumont', 'ca:ab:Leduc'].map(total))
      .toEqual([1, 1, 1, 1, 1, 0]);
  });

  it('shows Vancouver\'s e-scooter stations, where every Lime ride must end, and no station elsewhere in Lime\'s feeds', () => {
    // As Lime lists them: plain stations, no geofencing, and room for its type 2 scooters in the status.
    const types = { data: { vehicle_types: [{ vehicle_type_id: '2', form_factor: 'scooter', propulsion_type: 'electric' },
      { vehicle_type_id: '3', form_factor: 'bicycle', propulsion_type: 'electric_assist' }] } };
    const stations = { data: { stations: [
      { station_id: '6e24f5eb-3968-40ec-b27d-e97dc96d3797', name: '#0017 - Pandora St & Kamloops St', lat: 49.2829, lon: -123.0545 },
      { station_id: '1e6c0520-8f63-49c6-beba-98a2b25dac7e', name: '#0101 - Closed', lat: 49.2701, lon: -123.1004 },
    ] } };
    const locations = normalizeParkingLocations(system('lime_ca_vancouver'), types, stations, {});
    expect(locations.map(location => [location.name, location.mandatory])).toEqual([
      ['#0017 - Pandora St & Kamloops St', true], ['#0101 - Closed', true],
    ]);
    // A station not taking returns is left out, as anywhere.
    expect(filterReturningParking(locations, { data: { stations: [
      { station_id: '1e6c0520-8f63-49c6-beba-98a2b25dac7e', is_installed: true, is_returning: false },
    ] } }).map(location => location.name)).toEqual(['#0017 - Pandora St & Kamloops St']);
    // Lime's other feeds list one plain station named after the town, at no parking: it stays off the map.
    expect(normalizeParkingLocations(system('lime_ca_mississauga'), types,
      { data: { stations: [{ station_id: 'mississauga', name: 'Mississauga, ON', lat: 43.5797, lon: -79.6556 }] } }, {})).toEqual([]);
  });

  it('says Vaughan\'s scooters, Lime\'s and Bird\'s, are away from 1 November until 1 May, Windsor\'s from 1 November, Oshawa\'s from 2 November and Brampton\'s from 7 November until 1 April', () => {
    // The City of Vaughan pauses its shared e-scooters from 1 November 2026; they came back on 1 May 2026.
    const vaughan: [number, number] = [43.7955, -79.5323];
    // 23:30 on 31 October in Vaughan (UTC-4) is still in season; 00:30 on 1 November is not.
    expect(activeSeasonalPause(vaughan, Date.UTC(2026, 10, 1, 3, 30))).toBeNull();
    expect(activeSeasonalPause(vaughan, Date.UTC(2026, 10, 1, 4, 30))).toEqual({ city: 'Vaughan, ON', month: 5 });
    expect(activeSeasonalPause(vaughan, Date.UTC(2027, 3, 30, 18))).toEqual({ city: 'Vaughan, ON', month: 5 });
    expect(activeSeasonalPause(vaughan, Date.UTC(2027, 4, 1, 18))).toBeNull();
    const winter = Date.UTC(2027, 0, 15, 12);
    expect(feedPaused('canada:bird_ca_vaughan', winter)).toBe(true);
    expect(feedPaused('canada:lime_ca_app_vaughan_008', winter)).toBe(true);
    // Oshawa's Bird program "paused for the cold, snowy months" as of 2 November 2026, back in spring 2027;
    // its spring notice brought the scooters back on 1 April.
    const oshawa: [number, number] = [43.8975, -78.8658];
    // 23:30 on 1 November in Oshawa (UTC-5) is still in season; 00:30 on the 2nd is not.
    expect(activeSeasonalPause(oshawa, Date.UTC(2026, 10, 2, 4, 30))).toBeNull();
    expect(activeSeasonalPause(oshawa, Date.UTC(2026, 10, 2, 5, 30))).toEqual({ city: 'Oshawa, ON', month: 4 });
    expect(activeSeasonalPause(oshawa, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Oshawa, ON', month: 4 });
    expect(activeSeasonalPause(oshawa, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_app_oshawa', winter)).toBe(true);
    // Windsor's page gives the season as "between April and October". Detroit's bounds take in the middle of Windsor,
    // across the river, so the pause is read in Tecumseh, which Bird's Windsor feed reaches.
    const windsor: [number, number] = [42.2981, -82.864];
    // 23:30 on 31 October in Windsor (UTC-4) is still in season; 00:30 on 1 November is not.
    expect(activeSeasonalPause(windsor, Date.UTC(2026, 10, 1, 3, 30))).toBeNull();
    expect(activeSeasonalPause(windsor, Date.UTC(2026, 10, 1, 4, 30))).toEqual({ city: 'Windsor, ON', month: 4 });
    expect(activeSeasonalPause(windsor, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Windsor, ON', month: 4 });
    expect(activeSeasonalPause(windsor, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_windsor', winter)).toBe(true);
    // Brampton sets its season each year (1 April to 16 November in 2025) and gave 2026 no end; Bird's feed fell from 103
    // on 2 November to none from 7 November. Mississauga's bounds take in the middle of Brampton, so the pause is read
    // in its north end, outside them.
    const brampton: [number, number] = [43.76, -79.77];
    // 23:30 on 6 November in Brampton (UTC-5) is still in season; 00:30 on the 7th is not.
    expect(activeSeasonalPause(brampton, Date.UTC(2026, 10, 7, 4, 30))).toBeNull();
    expect(activeSeasonalPause(brampton, Date.UTC(2026, 10, 7, 5, 30))).toEqual({ city: 'Brampton, ON', month: 4 });
    expect(activeSeasonalPause(brampton, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Brampton, ON', month: 4 });
    expect(activeSeasonalPause(brampton, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_app_brampton', winter)).toBe(true);
  });

  it('says Ottawa\'s scooters are away from 16 November until 30 April, Laval\'s until 15 April, Leduc\'s from 22 October and Spruce Grove\'s from 29 October until 1 May, Penticton\'s, Pickering\'s, Medicine Hat\'s and Waterloo Region\'s from 1 November and Cochrane\'s, Cranbrook\'s and Okotoks\'s from 2 November until 1 April, and Red Deer\'s and Saskatoon\'s from 1 November, by each town\'s clock', () => {
    const ottawa: [number, number] = [45.4215, -75.6972];
    // 23:30 on 15 November in Ottawa is still in season; 00:30 on the 16th is not.
    expect(activeSeasonalPause(ottawa, Date.UTC(2026, 10, 16, 4, 30))).toBeNull();
    expect(activeSeasonalPause(ottawa, Date.UTC(2026, 10, 16, 5, 30))).toEqual({ city: 'Ottawa, ON', month: 4 });
    expect(activeSeasonalPause(ottawa, Date.UTC(2027, 3, 29, 12))).toEqual({ city: 'Ottawa, ON', month: 4 });
    expect(activeSeasonalPause(ottawa, Date.UTC(2027, 3, 30, 12))).toBeNull();
    const winter = Date.UTC(2027, 0, 15, 12);
    expect(feedPaused('canada:bird_ca_ottawa', winter)).toBe(true);
    expect(feedPaused('canada:lime_ca_ottawa', winter)).toBe(true);
    // Bird took Leduc's scooters in on 20 and 21 October 2026; the window is that winter's.
    const leduc: [number, number] = [53.2645, -113.5593];
    // 23:30 on 21 October in Leduc is still in season; 00:30 on the 22nd is not.
    expect(activeSeasonalPause(leduc, Date.UTC(2026, 9, 22, 5, 30))).toBeNull();
    expect(activeSeasonalPause(leduc, Date.UTC(2026, 9, 22, 6, 30))).toEqual({ city: 'Leduc, AB', month: 5 });
    expect(activeSeasonalPause(leduc, Date.UTC(2027, 3, 30, 18))).toEqual({ city: 'Leduc, AB', month: 5 });
    expect(activeSeasonalPause(leduc, Date.UTC(2027, 4, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_leduc', winter)).toBe(true);
    // Bird took Spruce Grove's scooters in on 28 and 29 October 2026; the window is that winter's, as Leduc's.
    const spruceGrove: [number, number] = [53.545, -113.9008];
    // 23:30 on 28 October in Spruce Grove (UTC-6) is still in season; 00:30 on the 29th is not.
    expect(activeSeasonalPause(spruceGrove, Date.UTC(2026, 9, 29, 5, 30))).toBeNull();
    expect(activeSeasonalPause(spruceGrove, Date.UTC(2026, 9, 29, 6, 30))).toEqual({ city: 'Spruce Grove, AB', month: 5 });
    expect(activeSeasonalPause(spruceGrove, Date.UTC(2027, 3, 30, 18))).toEqual({ city: 'Spruce Grove, AB', month: 5 });
    expect(activeSeasonalPause(spruceGrove, Date.UTC(2027, 4, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_app_spruce_grove', winter)).toBe(true);
    // Penticton's first season ended on 31 October 2026, by the city's notice; the window is that winter's.
    const penticton: [number, number] = [49.4991, -119.5937];
    // 23:30 on 31 October in Penticton is still in season; 00:30 on 1 November is not.
    expect(activeSeasonalPause(penticton, Date.UTC(2026, 10, 1, 6, 30))).toBeNull();
    expect(activeSeasonalPause(penticton, Date.UTC(2026, 10, 1, 7, 30))).toEqual({ city: 'Penticton, BC', month: 4 });
    expect(activeSeasonalPause(penticton, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Penticton, BC', month: 4 });
    expect(activeSeasonalPause(penticton, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_app_penticton', winter)).toBe(true);
    // Pickering's page runs its pilot "from April through the end of October"; rentals start on 1 April.
    const pickering: [number, number] = [43.8358, -79.0906];
    expect(activeSeasonalPause(pickering, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Pickering, ON', month: 4 });
    expect(activeSeasonalPause(pickering, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_app_pickering', winter)).toBe(true);
    // Bird took Medicine Hat's scooters in from 30 October 2026, 36 to 1 on the morning of 1 November, as it does each
    // winter until April; the window is that winter's.
    const medicineHat: [number, number] = [50.0405, -110.6766];
    // 23:30 on 31 October in Medicine Hat (UTC-6) is still in season; 00:30 on 1 November is not.
    expect(activeSeasonalPause(medicineHat, Date.UTC(2026, 10, 1, 5, 30))).toBeNull();
    expect(activeSeasonalPause(medicineHat, Date.UTC(2026, 10, 1, 6, 30))).toEqual({ city: 'Medicine Hat, AB', month: 4 });
    expect(activeSeasonalPause(medicineHat, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Medicine Hat, AB', month: 4 });
    expect(activeSeasonalPause(medicineHat, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:bird_ca_app_medicine_hat', winter)).toBe(true);
    // Bird's Cochrane, Cranbrook and Okotoks areas held 54, 23 and 21 scooters on 1 November 2026 and none in the sweeps of
    // the afternoon of the 2nd; the window is that winter's. Cranbrook keeps Alberta's clock.
    for (const [city, point, feed] of [['Cochrane, AB', [51.1894, -114.4676], 'cochrane'],
      ['Cranbrook, BC', [49.5097, -115.7688], 'cranbrook'], ['Okotoks, AB', [50.7256, -113.9749], 'okotoks']] as const) {
      // 23:30 on 1 November in Alberta (UTC-6) is still in season; 00:30 on the 2nd is not.
      expect(activeSeasonalPause([...point], Date.UTC(2026, 10, 2, 5, 30)), city).toBeNull();
      expect(activeSeasonalPause([...point], Date.UTC(2026, 10, 2, 6, 30)), city).toEqual({ city, month: 4 });
      expect(activeSeasonalPause([...point], Date.UTC(2027, 2, 31, 18)), city).toEqual({ city, month: 4 });
      expect(activeSeasonalPause([...point], Date.UTC(2027, 3, 1, 18)), city).toBeNull();
      expect(feedPaused(`canada:bird_ca_app_${feed}`, winter), city).toBe(true);
    }
    // Lime took Waterloo Region's scooters in on 1 November 2026, every group of its map there; the Region's season runs
    // from April to October.
    const waterlooRegion: [number, number] = [43.45161, -80.49253];
    // 23:30 on 31 October in Kitchener (UTC-4) is still in season; 00:30 on 1 November is not.
    expect(activeSeasonalPause(waterlooRegion, Date.UTC(2026, 10, 1, 3, 30))).toBeNull();
    expect(activeSeasonalPause(waterlooRegion, Date.UTC(2026, 10, 1, 4, 30))).toEqual({ city: 'Waterloo Region, ON', month: 4 });
    expect(activeSeasonalPause(waterlooRegion, Date.UTC(2027, 2, 31, 18))).toEqual({ city: 'Waterloo Region, ON', month: 4 });
    expect(activeSeasonalPause(waterlooRegion, Date.UTC(2027, 3, 1, 18))).toBeNull();
    expect(feedPaused('canada:lime_ca_app_waterloo_region_008', winter)).toBe(true);
    // Laval's by-law sets the season from 15 April to 15 November, for every group of Lime's map there.
    const laval: [number, number] = [45.56995, -73.692];
    expect(activeSeasonalPause(laval, Date.UTC(2026, 10, 16, 4, 30))).toBeNull();
    expect(activeSeasonalPause(laval, Date.UTC(2026, 10, 16, 5, 30))).toEqual({ city: 'Laval, QC', month: 4 });
    expect(activeSeasonalPause(laval, Date.UTC(2027, 3, 14, 12))).toEqual({ city: 'Laval, QC', month: 4 });
    expect(activeSeasonalPause(laval, Date.UTC(2027, 3, 15, 12))).toBeNull();
    expect(feedPaused('canada:lime_ca_app_laval_000', winter)).toBe(true);
    // Red Deer's by-law has the scooters removed from 1 November to 15 March.
    const redDeer: [number, number] = [52.26682, -113.802];
    expect(activeSeasonalPause(redDeer, Date.UTC(2026, 10, 1, 5, 30))).toBeNull();
    expect(activeSeasonalPause(redDeer, Date.UTC(2026, 10, 1, 6, 30))).toEqual({ city: 'Red Deer, AB', month: 3 });
    expect(activeSeasonalPause(redDeer, Date.UTC(2027, 2, 15, 18))).toEqual({ city: 'Red Deer, AB', month: 3 });
    expect(activeSeasonalPause(redDeer, Date.UTC(2027, 2, 16, 18))).toBeNull();
    // Saskatoon's by-law prices the permits on a season from 15 April to 31 October, on Saskatchewan's clock, which keeps
    // standard time: 23:30 on 31 October is 05:30 UTC.
    const saskatoon: [number, number] = [52.13238, -106.66892];
    expect(activeSeasonalPause(saskatoon, Date.UTC(2026, 10, 1, 5, 30))).toBeNull();
    expect(activeSeasonalPause(saskatoon, Date.UTC(2026, 10, 1, 6, 30))).toEqual({ city: 'Saskatoon, SK', month: 4 });
    expect(activeSeasonalPause(saskatoon, Date.UTC(2027, 3, 14, 18))).toEqual({ city: 'Saskatoon, SK', month: 4 });
    expect(activeSeasonalPause(saskatoon, Date.UTC(2027, 3, 15, 18))).toBeNull();
    expect(feedPaused('canada:lime_ca_app_saskatoon_000', winter)).toBe(true);
    // The other towns' winters are announced each year, or are the operator's own.
    for (const [id, point] of [['ca:on:Mississauga', [43.589, -79.6441]], ['ca:ab:Calgary', [51.0447, -114.0719]],
      ['ca:ns:Halifax', [44.6488, -63.5752]], ['ca:qc:Montréal', [45.5146, -73.534]],
      ['ca:on:Ajax', [43.85012, -79.03288]], ['ca:sk:Regina', [50.45008, -104.6178]],
      ['ca:ab:Lacombe', [52.46681, -113.7353]], ['ca:ab:Blackfalds', [52.38342, -113.7853]]] as const) {
      expect(activeSeasonalPause([...point], winter), id).toBeNull();
    }
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'CA' && entry.pauses).map(entry => entry.id))
      .toEqual(['ca:ab:Leduc', 'ca:on:Ottawa', 'ca:on:Vaughan', 'ca:on:Windsor', 'ca:on:Brampton', 'ca:ab:Cochrane', 'ca:bc:Cranbrook',
        'ca:ab:Medicine Hat', 'ca:ab:Okotoks', 'ca:on:Oshawa', 'ca:bc:Penticton', 'ca:on:Pickering', 'ca:ab:Spruce Grove', 'ca:nb:Moncton', 'ca:qc:Laval', 'ca:on:Waterloo Region', 'ca:ab:Red Deer', 'ca:sk:Saskatoon']);
  });

  it('says Moncton\'s scooters are away from 15 November until 16 April at the latest, while Fredericton\'s and Saint John\'s run on', () => {
    // By-law L-926, 7(2): operators stop on 15 November and start again on a day the city sets, by 16 April.
    const moncton: [number, number] = [46.0878, -64.7782];
    // 23:30 on 14 November in Moncton (UTC-4) is still in season; 00:30 on the 15th is not.
    expect(activeSeasonalPause(moncton, Date.UTC(2026, 10, 15, 3, 30))).toBeNull();
    expect(activeSeasonalPause(moncton, Date.UTC(2026, 10, 15, 4, 30))).toEqual({ city: 'Moncton, NB', month: 4 });
    expect(activeSeasonalPause(moncton, Date.UTC(2027, 3, 16, 12))).toBeNull();
    const winter = Date.UTC(2027, 0, 15, 12);
    expect(activeSeasonalPause([45.9636, -66.6431], winter)).toBeNull();
    expect(activeSeasonalPause([45.2733, -66.0633], winter)).toBeNull();
    // One feed covers the three towns, so it is not paused, and its alerts stay on.
    expect(feedPaused('canada:move_ca_new_brunswick', winter)).toBe(false);
  });
});
