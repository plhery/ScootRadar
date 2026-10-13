import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { discoveredFeedUrl, fetchScooters, independentCollectableFeeds } from './scooterFeeds';
import { upstreamJsonCache } from './upstreamJsonCache';
import { REGIONAL_SCOOTER_SYSTEMS, REGIONAL_SCOOTER_CITIES, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { providersForViewport } from './mapCoverage';
import { normalizeParkingLocations } from './parking';
import { buildCityOverview, querySnapshot, type FeedSnapshot } from './scooterSnapshots';
import { boundsContainPoint } from './geo';

const berlin = { south: 52.49, north: 52.55, west: 13.37, east: 13.44 };
const rome = { south: 41.88, north: 41.93, west: 12.46, east: 12.53 };
const response = (data: unknown) => new Response(JSON.stringify(data));
beforeEach(() => upstreamJsonCache.clear());
afterEach(() => { upstreamJsonCache.clear(); vi.unstubAllGlobals(); });

describe('German and Italian scooter coverage', () => {
  it.each([['Munich', 'München, Germany'], ['Muenchen Deutschland', 'München, Germany'],
    ['Koln', 'Köln, Germany'], ['Rome', 'Roma, Italy'], ['Roma Italia', 'Roma, Italy'], ['Naples', 'Napoli, Italy'],
    ['Neapel', 'Napoli, Italy'], ['Palerme', 'Palermo, Italy'], ['Uppsala Sverige', 'Uppsala, Sweden'], ['Upsala', 'Uppsala, Sweden'],
    ['Kiiruna', 'Kiruna, Sweden'], ['Giron', 'Kiruna, Sweden'], ['Riga', 'Rīga, Latvia'], ['Riga Latvija', 'Rīga, Latvia'],
    ['Rīga Lettland', 'Rīga, Latvia'], ['Wolomin', 'Wołomin, Poland'], ['Wołomin', 'Wołomin, Poland'], ['Kobylka Polska', 'Kobyłka, Poland'],
    ['Oswiecim', 'Oświęcim, Poland'], ['Radzymin Polen', 'Radzymin, Poland'], ['Knurow', 'Knurów, Poland'],
    ['Zlotow Pologne', 'Złotów, Poland'], ['Pecs', 'Pécs, Hungary'], ['Pécs Magyarország', 'Pécs, Hungary'],
    ['Fünfkirchen', 'Pécs, Hungary'], ['Funfkirchen Ungarn', 'Pécs, Hungary']])('finds %s', (query, name) => {
    expect(searchRegionalScooterCities(query)[0].display_name).toBe(name);
  });
  it('does not silently ignore a conflicting country or expose the aggregate feed as a city', () => {
    expect(searchRegionalScooterCities('Berlin Italy')).toEqual([]);
    expect(searchRegionalScooterCities('Germany')).toEqual([]);
    expect(searchRegionalScooterCities('Pforzheim')[0].display_name).toBe('Pforzheim, Germany');
    expect(REGIONAL_SCOOTER_CITIES.some(city => city.city === 'Baden-Württemberg')).toBe(false);
  });
  it('keeps reviewed IDs, coordinates and country membership consistent', () => {
    expect(new Set(REGIONAL_SCOOTER_SYSTEMS.map(system => system.id)).size).toBe(REGIONAL_SCOOTER_SYSTEMS.length);
    for (const system of REGIONAL_SCOOTER_SYSTEMS) for (const area of serviceAreas(system)) {
      expect(boundsContainPoint(area.bounds, ...area.center), `${system.id}: ${area.city}`).toBe(true);
      expect(system.id).toContain(`_${system.country.toLowerCase()}_`);
    }
  });
  it.each([
    { id: 'dott_de_berlin', bounds: berlin, country: 'germany', v3: false },
    { id: 'bird_it_rome', bounds: rome, country: 'italy', v3: false },
    { id: 'hopp_se_kiruna', bounds: { south: 67.84, north: 67.86, west: 20.22, east: 20.3 }, country: 'sweden', v3: false },
    { id: 'bolt_de_karlsruhe', bounds: { south: 49, north: 49.02, west: 8.39, east: 8.42 }, country: 'germany', v3: true },
    { id: 'ride_mobility_lv_riga', bounds: { south: 56.94, north: 56.96, west: 24.1, east: 24.13 }, country: 'latvia', v3: true },
    // Dott writes Wołomin's directory percent-encoded, wo%C5%82omin, in the discovery URL and in its feeds alike.
    { id: 'dott_pl_wolomin', bounds: { south: 52.34, north: 52.35, west: 21.23, east: 21.25 }, country: 'poland', v3: false },
    // Zeus's own feeds call its standing scooters electric_assist.
    { id: 'zeus_de_regensburg', bounds: { south: 49.01, north: 49.02, west: 12.09, east: 12.11 }, country: 'germany', v3: false,
      propulsion: 'electric_assist' },
  ])('reads $id without unrelated country requests', async ({ id, bounds, country, v3, propulsion = 'electric' }) => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === id)!;
    const base = new URL('.', system.discoveryUrl).toString();
    const statusName = v3 ? 'vehicle_status' : 'free_bike_status';
    const vehicle = { [v3 ? 'vehicle_id' : 'bike_id']: 'test', vehicle_type_id: 'scooter',
      lat: (bounds.south + bounds.north) / 2, lon: (bounds.west + bounds.east) / 2, current_fuel_percent: 0.72 };
    const fetchMock = vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) {
        const feeds = ['vehicle_types', statusName].map(name => ({ name, url: `${base}${name}.json` }));
        return response({ data: v3 ? { feeds } : { en: { feeds } } });
      }
      if (url === `${base}vehicle_types.json`) return response({ data: { vehicle_types: [
        { vehicle_type_id: 'scooter', form_factor: v3 ? 'scooter_standing' : 'scooter', propulsion_type: propulsion },
        { vehicle_type_id: 'bike', form_factor: 'bicycle', propulsion_type: 'electric_assist' },
      ] } });
      if (url === `${base}${statusName}.json`) return response({ last_updated: v3 ? new Date().toISOString() : Date.now() / 1000,
        data: { [v3 ? 'vehicles' : 'bikes']: [vehicle, { ...vehicle, vehicle_type_id: 'bike' },
          { ...vehicle, is_reserved: true }, { ...vehicle, lat: 0 }] } });
      throw new Error(`Unexpected upstream ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchScooters({ bounds, minBattery: 50, providers: new Set([system.provider]) });
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]).toMatchObject({ provider: system.provider, battery: 72 });
    expect(result.meta.sources).toEqual({ national: 'skipped', hopp: 'skipped', publibike: 'skipped',
      france: 'skipped', germany: 'skipped', italy: 'skipped', belgium: 'skipped', norway: 'skipped', uk: 'skipped', portugal: 'skipped', spain: 'skipped', iceland: 'skipped', sweden: 'skipped', latvia: 'skipped', poland: 'skipped', hungary: 'skipped', [country]: 'fresh' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('prices each Hopp Pécs scooter from its own plan, in forints, never from the plans in other currencies', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hopp_hu_pecs')!;
    const base = new URL('.', system.discoveryUrl).toString();
    expect(base).toBe('https://api.hopp.bike/gbfs/hu-pecs/');
    const scooter = { bike_id: 'one', vehicle_type_id: 'vtp_120', lat: 46.072, lon: 18.229, hopp_battery_level: 46,
      pricing_plan_id: 'flt_331' };
    // Hopp's Pécs feed lists a Danish and an American plan before its own.
    const plan = (plan_id: string, currency: string, price: number, rate: number) => ({ plan_id, name: 'Hopp pricing', currency, price,
      is_taxable: false, per_min_price: [{ start: 0, interval: 1, rate }] });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) return response({ data: { en: { feeds: ['vehicle_types', 'free_bike_status', 'system_pricing_plans']
        .map(name => ({ name, url: `${base}en/${name}.json` })) } } });
      if (url === `${base}en/vehicle_types.json`) return response({ data: { vehicle_types: [
        { vehicle_type_id: 'vtp_120', form_factor: 'scooter', propulsion_type: 'electric' }] } });
      if (url === `${base}en/free_bike_status.json`) return response({ last_updated: Date.now() / 1000, data: { bikes: [scooter,
        { ...scooter, bike_id: 'two', pricing_plan_id: 'flt_999' }, { ...scooter, bike_id: 'three', pricing_plan_id: undefined }] } });
      if (url === `${base}en/system_pricing_plans.json`) return response({ data: { plans: [plan('flt_426', 'DKK', 10, 2),
        plan('flt_438', 'USD', 3, 0.4), plan('flt_331', 'HUF', 272, 76)] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.hungary).toBe('fresh');
    expect(result.vehicles.every(vehicle => vehicle.battery === 46)).toBe(true);
    // An unknown plan or none leaves the price to Hopp's app.
    expect(Object.fromEntries(result.vehicles.map(vehicle => [vehicle.vehicle_id, vehicle.pricing ?? null]))).toEqual({
      'hopp_hu_pecs:one': { currency: 'HUF', unlock_fee_minor_units: 27_200, minute_fee_minor_units: 7_600 },
      'hopp_hu_pecs:two': null,
      'hopp_hu_pecs:three': null,
    });
  });
  it('keeps Dott Wołomin\'s feeds under its percent-encoded directory, however the letter is written', () => {
    const base = new URL('.', REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'dott_pl_wolomin')!.discoveryUrl).toString();
    const feed = (url: string) => discoveredFeedUrl([{ name: 'free_bike_status', url }], 'free_bike_status', base);
    const encoded = 'https://gbfs.api.ridedott.com/public/v2/wo%C5%82omin/free_bike_status.json';
    expect(feed(encoded)).toBe(encoded);
    expect(feed('https://gbfs.api.ridedott.com/public/v2/wołomin/free_bike_status.json')).toBe(encoded);
    expect(feed('https://gbfs.api.ridedott.com/public/v2/wolomin/free_bike_status.json')).toBeNull();
  });
  it('collects multi-city feeds once and skips the empty space between their service areas', async () => {
    const definitions = independentCollectableFeeds().filter(feed => feed.id === 'germany:lime_de_bw');
    expect(definitions).toHaveLength(1);
    expect(definitions[0].coverage).toHaveLength(2);
    vi.stubGlobal('fetch', vi.fn());
    const gap = { south: 48.19, north: 48.21, west: 9.16, east: 9.19 };
    expect(providersForViewport(gap)).not.toContain('lime');
    expect((await fetchScooters({ bounds: gap, minBattery: 0, providers: new Set(['lime']) })).vehicles).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the local language for German and Italian parking', () => {
    for (const id of ['dott_de_berlin', 'bird_it_rome']) {
      const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === id)!;
      const language = system.country.toLowerCase();
      const locations = normalizeParkingLocations(system, { data: { vehicle_types: [
        { vehicle_type_id: 's', form_factor: 'scooter_standing', propulsion_type: 'electric' },
      ] } }, { data: { stations: [{ station_id: 'bay', is_virtual_station: true,
        lat: system.center[0], lon: system.center[1], name: [{ language: 'fr', text: 'Français' }, { language, text: 'Local' }] }] } }, {});
      expect(locations[0].name).toBe('Local');
    }
  });
  it('keeps country totals, provider filters and parking correct at different zooms', () => {
    const now = Date.now();
    const feeds = ['dott_de_berlin', 'bird_it_rome'].map(id => {
      const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === id)!;
      return { id, source: system.country === 'DE' ? 'germany' : 'italy', provider: system.provider, coverage: [system.bounds],
        observedAt: now, attemptedAt: now, stale: false, failed: false, skipped: false,
        vehicles: [{ provider: system.provider, vehicle_id: id, lat: system.center[0], lng: system.center[1],
          battery: null, range_m: null, distance_m: null, deep_link: null }],
        parking: { observedAt: now, stale: false, locations: [{ id: `${id}:bay`, provider: system.provider, name: 'Bay',
          lat: system.center[0], lng: system.center[1], mandatory: true }] },
      } as FeedSnapshot;
    });
    const snapshot = { version: 1 as const, feeds, updatedAt: now, overview: buildCityOverview(feeds, now) };
    for (const bounds of [berlin, rome]) {
      const query = { bounds, minBattery: 0 };
      const overview = querySnapshot(snapshot, query, 8, now);
      expect(overview.meta.totalVehicles).toBe(1);
      expect(overview.clusters).toHaveLength(1);
      expect(overview.parking).toBeUndefined();
      expect(overview.meta.sources.national).toBe('skipped');
      expect(overview.meta.sources.france).toBe('skipped');
      const detail = querySnapshot(snapshot, { ...query, minBattery: 100 }, 16, now);
      expect(detail.vehicles).toEqual([]);
      expect(detail.parking).toHaveLength(1);
      expect(detail.meta.availableProviders).not.toContain('publibike');
    }
  });
});
