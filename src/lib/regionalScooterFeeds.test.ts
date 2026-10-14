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
    ['Zlotow Pologne', 'Złotów, Poland'], ['Wrzesnia', 'Września, Poland'], ['Września Polska', 'Września, Poland'],
    ['Egilsstadir', 'Egilsstaðir, Iceland'], ['Egilstadir Island', 'Egilsstaðir, Iceland'], ['Fellabaer', 'Egilsstaðir, Iceland'],
    ['Hveragerdi', 'Hveragerði, Iceland'], ['Hveragerði Ísland', 'Hveragerði, Iceland'], ['Pecs', 'Pécs, Hungary'], ['Pécs Magyarország', 'Pécs, Hungary'],
    ['Fünfkirchen', 'Pécs, Hungary'], ['Funfkirchen Ungarn', 'Pécs, Hungary'], ['Békéscsaba', 'Békéscsaba, Hungary'],
    ['Bekescsaba Magyarország', 'Békéscsaba, Hungary'], ['Békešská Čaba', 'Békéscsaba, Hungary'],
    ['Bekesska Caba Ungarn', 'Békéscsaba, Hungary'], ['Faliraki', 'Faliraki, Greece'],
    ['Φαληράκι', 'Faliraki, Greece'], ['Rhodes', 'Rhodes, Greece'], ['Rodos Ellada', 'Rhodes, Greece'], ['Ρόδος', 'Rhodes, Greece'],
    ['ΡΟΔΟΣ', 'Rhodes, Greece'], ['Ροδος Ελλάδα', 'Rhodes, Greece'], ['Ialysos', 'Ialysos, Greece'], ['Ιαλυσός', 'Ialysos, Greece'],
    ['Kremasti', 'Ialysos, Greece'], ['Afandou', 'Afantou, Greece'], ['Kolympia Hellas', 'Kolymbia, Greece'],
    ['Kos', 'Kos, Greece'], ['Κως', 'Kos, Greece'], ['Psalidi', 'Kos, Greece'], ['Rethymno', 'Rethymno, Greece'],
    ['Ρέθυμνο', 'Rethymno, Greece'], ['Rethimno Griechenland', 'Rethymno, Greece'], ['Zakynthos', 'Zakynthos, Greece'],
    ['Zante Grèce', 'Zakynthos, Greece'], ['Ζάκυνθος', 'Zakynthos, Greece'], ['Piraeus', 'Piraeus, Greece'], ['Pireas', 'Piraeus, Greece'],
    ['Peiraias Hellas', 'Piraeus, Greece'], ['Πειραιάς', 'Piraeus, Greece'], ['Πειραια', 'Piraeus, Greece'],
    ['Argostoli', 'Argostoli, Greece'], ['Αργοστόλι', 'Argostoli, Greece'], ['Kefalonia', 'Argostoli, Greece'],
    ['Cephalonia Griechenland', 'Argostoli, Greece'], ['Κεφαλονιά', 'Argostoli, Greece'], ['Kefallonia Grèce', 'Argostoli, Greece'],
    ['Ioannina', 'Ioannina, Greece'], ['Giannena', 'Ioannina, Greece'], ['Ιωάννινα', 'Ioannina, Greece'], ['Γιάννενα', 'Ioannina, Greece'],
    ['Paphos', 'Paphos, Cyprus'], ['Pafos', 'Paphos, Cyprus'], ['Πάφος', 'Paphos, Cyprus'], ['ΠΑΦΟΣ', 'Paphos, Cyprus'],
    ['Pafos Kıbrıs', 'Paphos, Cyprus'], ['Paphos Zypern', 'Paphos, Cyprus'], ['Limassol', 'Limassol, Cyprus'],
    ['Lemesos', 'Limassol, Cyprus'], ['Λεμεσός', 'Limassol, Cyprus'], ['Λεμεσος Κύπρος', 'Limassol, Cyprus'],
    ['Limassol Kibris', 'Limassol, Cyprus'], ['Lemesos Kypros', 'Limassol, Cyprus'], ['Limassol Chypre', 'Limassol, Cyprus'],
    ['Mariehamn', 'Mariehamn, Finland'], ['Maarianhamina', 'Mariehamn, Finland'], ['Mariehamn Suomi', 'Mariehamn, Finland'],
    ['Maarianhamina Finnland', 'Mariehamn, Finland'], ['Åland', 'Mariehamn, Finland'], ['Aland Finlande', 'Mariehamn, Finland'],
    ['Ahvenanmaa Suomi', 'Mariehamn, Finland'], ['Rijeka', 'Rijeka, Croatia'], ['Fiume', 'Rijeka, Croatia'],
    ['Rijeka Hrvatska', 'Rijeka, Croatia'], ['Fiume Croazia', 'Rijeka, Croatia'], ['Rijeka Kroatien', 'Rijeka, Croatia'],
    ['Rijeka Croacia', 'Rijeka, Croatia'],
    ['Ostend', 'Oostende, Belgium'], ['Ostende Belgique', 'Oostende, Belgium'],
    ['Bredene', 'Oostende, Belgium'], ['Mechelen', 'Mechelen, Belgium'], ['Malines Belgique', 'Mechelen, Belgium'],
    ['Blankenberge', 'Blankenberge, Belgium'], ['Sint-Niklaas', 'Sint-Niklaas, Belgium'], ['Saint-Nicolas Belgique', 'Sint-Niklaas, Belgium'],
    ['Puerto del Carmen', 'Puerto del Carmen, Spain'], ['Tias', 'Puerto del Carmen, Spain'], ['Lanzarote Spain', 'Puerto del Carmen, Spain'], ['Catania', 'Catania, Italy'],
    ['Corralejo', 'Corralejo, Spain'], ['La Oliva España', 'Corralejo, Spain'], ['Altea', 'Altea, Spain'], ['Albir', 'L\'Albir, Spain'],
    ['El Albir Spain', 'L\'Albir, Spain'], ['Alfaz del Pi', 'L\'Alfàs del Pi, Spain'], ['L\'Alfas del Pi', 'L\'Alfàs del Pi, Spain'],
    ['La Nucia', 'La Nucía, Spain'], ['Polop', 'La Nucía, Spain'], ['La Mata', 'Torrevieja, Spain'],
    ['Catane Italie', 'Catania, Italy']])('finds %s', (query, name) => {
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
      france: 'skipped', germany: 'skipped', italy: 'skipped', belgium: 'skipped', norway: 'skipped', uk: 'skipped', portugal: 'skipped', spain: 'skipped', iceland: 'skipped', sweden: 'skipped', latvia: 'skipped', poland: 'skipped', hungary: 'skipped', greece: 'skipped', cyprus: 'skipped', finland: 'skipped', croatia: 'skipped', [country]: 'fresh' });
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
  it('prices Hopp\'s Greek scooters to the cent, though its feeds write 0.35 as 0.35000000000000003', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hopp_gr_kefalonia')!;
    const base = new URL('.', system.discoveryUrl).toString();
    expect(base).toBe('https://api.hopp.bike/gbfs/gr-kefalonia/');
    const scooter = { bike_id: 'one', vehicle_type_id: 'vtp_119', lat: 38.1754, lon: 20.4896, hopp_battery_level: 46,
      pricing_plan_id: 'flt_540', hopp_start_cost: 100, hopp_credits_per_min: 35 };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) return response({ data: { en: { feeds: ['vehicle_types', 'free_bike_status', 'system_pricing_plans']
        .map(name => ({ name, url: `${base}en/${name}.json` })) } } });
      if (url === `${base}en/vehicle_types.json`) return response({ data: { vehicle_types: [
        { vehicle_type_id: 'vtp_119', form_factor: 'scooter', propulsion_type: 'electric' }] } });
      if (url === `${base}en/free_bike_status.json`) return response({ last_updated: Date.now() / 1000, data: { bikes: [scooter] } });
      // As Hopp Kefalonia publishes it.
      if (url === `${base}en/system_pricing_plans.json`) return response({ data: { plans: [{ plan_id: 'flt_540', name: 'Hopp pricing',
        description: '€1.00 to start and €0.35 per minute.', price: 1, currency: 'EUR', is_taxable: false,
        per_min_price: [{ start: 0, interval: 1, rate: 0.35000000000000003 }] }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.greece).toBe('fresh');
    expect(result.vehicles).toMatchObject([{ vehicle_id: 'hopp_gr_kefalonia:one', battery: 46,
      pricing: { currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 35 } }]);
  });
  it('prices each Hopp Limassol scooter from its own plan, EUR 1.20 or EUR 1.00 to start', async () => {
    // Hopp names the feed Hopp Cyprus; every scooter stands in Limassol.
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hopp_cy_cyprus')!;
    expect(system.city).toBe('Limassol');
    const base = new URL('.', system.discoveryUrl).toString();
    expect(base).toBe('https://api.hopp.bike/gbfs/cy-cyprus/');
    const scooter = { bike_id: 'one', vehicle_type_id: 'vtp_120', lat: 34.6785, lon: 33.0446, hopp_battery_level: 81,
      pricing_plan_id: 'flt_466', hopp_start_cost: 120, hopp_credits_per_min: 25 };
    // As Hopp Cyprus publishes them: two plans at EUR 1.00 to start, one at EUR 1.20.
    const plan = (plan_id: string, price: number) => ({ plan_id, name: 'Hopp pricing', description: '', price, currency: 'EUR',
      is_taxable: false, per_min_price: [{ start: 0, interval: 1, rate: 0.25 }] });
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) return response({ data: { en: { feeds: ['vehicle_types', 'free_bike_status', 'system_pricing_plans']
        .map(name => ({ name, url: `${base}en/${name}.json` })) } } });
      if (url === `${base}en/vehicle_types.json`) return response({ data: { vehicle_types: [
        { vehicle_type_id: 'vtp_119', form_factor: 'scooter', propulsion_type: 'electric' },
        { vehicle_type_id: 'vtp_120', form_factor: 'scooter', propulsion_type: 'electric' }] } });
      if (url === `${base}en/free_bike_status.json`) return response({ last_updated: Date.now() / 1000, data: { bikes: [scooter,
        { ...scooter, bike_id: 'two', vehicle_type_id: 'vtp_119', pricing_plan_id: 'flt_564', hopp_start_cost: 100 },
        { ...scooter, bike_id: 'three', pricing_plan_id: 'flt_470', hopp_start_cost: 100 }] } });
      if (url === `${base}en/system_pricing_plans.json`) return response({ data: { plans: [plan('flt_470', 1), plan('flt_564', 1),
        plan('flt_466', 1.2)] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.cyprus).toBe('fresh');
    expect(Object.fromEntries(result.vehicles.map(vehicle => [vehicle.vehicle_id, vehicle.pricing]))).toEqual({
      'hopp_cy_cyprus:one': { currency: 'EUR', unlock_fee_minor_units: 120, minute_fee_minor_units: 25 },
      'hopp_cy_cyprus:two': { currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 25 },
      'hopp_cy_cyprus:three': { currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 25 },
    });
  });
  it('prices each Hopp Mariehamn scooter at EUR 1.70 to start and EUR 0.42 a minute, and never shows the cars it declares', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hopp_fi_mariehamn')!;
    expect(system).toMatchObject({ country: 'FI', city: 'Mariehamn' });
    const base = new URL('.', system.discoveryUrl).toString();
    expect(base).toBe('https://api.hopp.bike/gbfs/fi-mariehamn/');
    const scooter = { bike_id: 'one', vehicle_type_id: 'vtp_120', lat: 60.0975, lon: 19.9346, hopp_battery_level: 71,
      pricing_plan_id: 'flt_457', hopp_start_cost: 170, hopp_credits_per_min: 42 };
    // As Hopp Mariehamn publishes them: two scooter types and two electric car types.
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) return response({ data: { en: { feeds: ['vehicle_types', 'free_bike_status', 'system_pricing_plans']
        .map(name => ({ name, url: `${base}en/${name}.json` })) } } });
      if (url === `${base}en/vehicle_types.json`) return response({ data: { vehicle_types: [
        { vehicle_type_id: 'vtp_116', form_factor: 'car', propulsion_type: 'electric' },
        { vehicle_type_id: 'vtp_119', form_factor: 'scooter', propulsion_type: 'electric' },
        { vehicle_type_id: 'vtp_120', form_factor: 'scooter', propulsion_type: 'electric' },
        { vehicle_type_id: 'vtp_75', form_factor: 'car', propulsion_type: 'electric' }] } });
      if (url === `${base}en/free_bike_status.json`) return response({ last_updated: Date.now() / 1000, data: { bikes: [scooter,
        { ...scooter, bike_id: 'two', vehicle_type_id: 'vtp_119' },
        { ...scooter, bike_id: 'car', vehicle_type_id: 'vtp_116' }, { ...scooter, bike_id: 'van', vehicle_type_id: 'vtp_75' }] } });
      if (url === `${base}en/system_pricing_plans.json`) return response({ data: { plans: [{ plan_id: 'flt_457', name: 'Hopp pricing',
        description: '€1.70 to start and €0.42 per minute.', price: 1.7, currency: 'EUR', is_taxable: false,
        per_min_price: [{ start: 0, interval: 1, rate: 0.42 }] }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hopp']) });
    expect(result.meta.sources.finland).toBe('fresh');
    expect(Object.fromEntries(result.vehicles.map(vehicle => [vehicle.vehicle_id, vehicle.pricing]))).toEqual({
      'hopp_fi_mariehamn:one': { currency: 'EUR', unlock_fee_minor_units: 170, minute_fee_minor_units: 42 },
      'hopp_fi_mariehamn:two': { currency: 'EUR', unlock_fee_minor_units: 170, minute_fee_minor_units: 42 },
    });
  });
  it('reads Hoppy Rijeka\'s GBFS 3.0 feed: EUR 0 to start and EUR 0.19 a minute, range only, and a link to each scooter', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hoppy_hr_rijeka')!;
    expect(system).toMatchObject({ country: 'HR', city: 'Rijeka' });
    const base = new URL('.', system.discoveryUrl).toString();
    expect(base).toBe('https://hoppy.rideatom.com/gbfs/2304/v3.0/');
    // As Hoppy Rijeka publishes them on ATOM Mobility.
    const scooter = { vehicle_id: '4123108368186487605', lat: 45.3323, lon: 14.4385, is_reserved: false, is_disabled: false,
      rental_uris: { android: 'https://ride-hoppy.app.link/302484', ios: 'https://ride-hoppy.app.link/302484', web: 'https://ride-hoppy.app.link/' },
      vehicle_type_id: '4152', current_range_meters: 46800, pricing_plan_id: '4152' };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) return response({ version: '3.0', data: { feeds: ['vehicle_types', 'vehicle_status', 'system_pricing_plans']
        .map(name => ({ name, url: `${base}${name}` })) } });
      if (url === `${base}vehicle_types`) return response({ data: { vehicle_types: [{ vehicle_type_id: '4152',
        form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 60000, default_pricing_plan_id: '4152' }] } });
      if (url === `${base}vehicle_status`) return response({ last_updated: new Date().toISOString(), data: { vehicles: [scooter,
        { ...scooter, vehicle_id: 'disabled', is_disabled: true }] } });
      if (url === `${base}system_pricing_plans`) return response({ data: { plans: [{ plan_id: '4152',
        name: [{ text: 'SEGW RIJEK ANRT_KSCEG_TIER1', language: 'en' }], currency: 'EUR', price: 0, is_taxable: false,
        description: [{ text: 'This is pricing plan for SEGW RIJEK ANRT_KSCEG_TIER1; Maximum distance is 60.00;', language: 'en' }],
        per_min_pricing: [{ start: 0, rate: 0.19, interval: 1 }] }] } });
      throw new Error(`Unexpected upstream ${url}`);
    }));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hoppy']) });
    expect(result.meta.sources.croatia).toBe('fresh');
    expect(result.vehicles).toEqual([expect.objectContaining({
      provider: 'hoppy', vehicle_id: 'hoppy_hr_rijeka:4123108368186487605', battery: null, range_m: 46800,
      pricing: { currency: 'EUR', unlock_fee_minor_units: 0, minute_fee_minor_units: 19 },
      // The number at the end of the link is the one printed on the scooter, which outlives its rotating id.
      rental_uris: { android: 'https://ride-hoppy.app.link/302484', ios: 'https://ride-hoppy.app.link/302484', web: 'https://ride-hoppy.app.link/' },
    })]);
  });
  // As ATOM Mobility publishes them: GBFS 3.0, a plan per scooter type, and a range that is the type's maximum scaled by the charge.
  const atomFeeds = (system: (typeof REGIONAL_SCOOTER_SYSTEMS)[number], type: object, plan: object, vehicles: object[]) => {
    const base = new URL('.', system.discoveryUrl).toString();
    return vi.fn(async (url: string) => {
      if (url === system.discoveryUrl) return response({ version: '3.0', data: { feeds: ['vehicle_types', 'vehicle_status',
        'system_pricing_plans'].map(name => ({ name, url: `${base}${name}` })) } });
      if (url === `${base}vehicle_types`) return response({ version: '3.0', data: { vehicle_types: [type] } });
      if (url === `${base}vehicle_status`) return response({ last_updated: new Date().toISOString(), version: '3.0', data: { vehicles } });
      if (url === `${base}system_pricing_plans`) return response({ version: '3.0', data: { plans: [plan] } });
      throw new Error(`Unexpected upstream ${url}`);
    });
  };
  it('shows the charge of each Elerent scooter in Catania, never its 1,000 km "range", with its price and link', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'elerent_it_catania')!;
    expect(system).toMatchObject({ country: 'IT', provider: 'elerent', city: 'Catania' });
    const link = 'https://elerent.app.link/CAT0059';
    vi.stubGlobal('fetch', atomFeeds(system,
      { vehicle_type_id: '3866', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 1_000_000,
        default_pricing_plan_id: '3866' },
      { plan_id: '3866', name: [{ text: 'ZIMO CAT', language: 'en' }], currency: 'EUR', price: 1, is_taxable: false,
        per_min_pricing: [{ start: 0, rate: 0.26, interval: 1 }] },
      [{ vehicle_id: '4121700984696156981', lat: 37.5154, lon: 15.0874, is_reserved: false, is_disabled: false,
        rental_uris: { android: link, ios: link, web: 'https://elerent.app.link/' }, vehicle_type_id: '3866',
        current_range_meters: 650_000, pricing_plan_id: '3866' }]));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['elerent']) });
    expect(result.meta.sources.italy).toBe('fresh');
    expect(result.vehicles).toMatchObject([{ vehicle_id: 'elerent_it_catania:4121700984696156981', provider: 'elerent',
      battery: 65, range_m: null, pricing: { currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 26 },
      rental_uris: { ios: link, android: link, web: 'https://elerent.app.link/' } }]);
  });
  it('shows the range of each Hoppy scooter in Oostende, where a type goes 60 km', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hoppy_be_oostende')!;
    const link = 'https://ride-hoppy.app.link/600332';
    vi.stubGlobal('fetch', atomFeeds(system,
      { vehicle_type_id: '3719', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 60_000,
        default_pricing_plan_id: '3719' },
      { plan_id: '3719', name: [{ text: 'SEGW OOS ANRT_ KSCSEG _TIER3', language: 'en' }], currency: 'EUR', price: 1,
        is_taxable: false, per_min_pricing: [{ start: 0, rate: 0.3, interval: 1 }] },
      [{ vehicle_id: '3905803084817904437', lat: 51.2177, lon: 2.913, is_reserved: false, is_disabled: false,
        rental_uris: { android: link, ios: link, web: 'https://ride-hoppy.app.link/' }, vehicle_type_id: '3719',
        current_range_meters: 51_000, pricing_plan_id: '3719' }]));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hoppy']) });
    expect(result.meta.sources.belgium).toBe('fresh');
    expect(result.vehicles).toMatchObject([{ provider: 'hoppy', battery: null, range_m: 51_000,
      pricing: { currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 30 }, rental_uris: { ios: link } }]);
  });
  it('routes Hoppy\'s Rhodes feed to five towns, sharing Faliraki with Hopp, and drops scooters outside them', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hoppy_gr_rhodes')!;
    const areas = serviceAreas(system);
    expect(areas.map(area => area.city)).toEqual(['Rhodes', 'Ialysos', 'Faliraki', 'Afantou', 'Kolymbia']);
    // No two of its towns overlap, and Faliraki is one town, whichever operator a scooter is from.
    for (const [i, a] of areas.entries()) for (const b of areas.slice(i + 1)) {
      expect(a.bounds.south > b.bounds.north || b.bounds.south > a.bounds.north ||
        a.bounds.west > b.bounds.east || b.bounds.west > a.bounds.east, `${a.city} and ${b.city}`).toBe(true);
    }
    expect(REGIONAL_SCOOTER_CITIES.filter(city => city.city === 'Faliraki')).toHaveLength(1);
    const scooter = (code: string, lat: number, lon: number) => ({ vehicle_id: code, lat, lon, is_reserved: false,
      is_disabled: false, rental_uris: { android: `https://ride-hoppy.app.link/${code}` }, vehicle_type_id: '2589',
      current_range_meters: 30_000, pricing_plan_id: '2589' });
    vi.stubGlobal('fetch', atomFeeds(system,
      { vehicle_type_id: '2589', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 60_000 },
      { plan_id: '2589', name: [{ text: 'SEGW RHO ANRT_ KSCSEG _TIER3', language: 'en' }], currency: 'EUR', price: 1,
        is_taxable: false, per_min_pricing: [{ start: 0, rate: 0.35, interval: 1 }] },
      // The old town, Kolymbia, and Lindos, where Hoppy has no zone.
      [scooter('300001', 36.4453, 28.2244), scooter('300002', 36.2538, 28.1598), scooter('300003', 36.0917, 28.088)]));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hoppy']) });
    expect(result.meta.sources.greece).toBe('fresh');
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(['hoppy_gr_rhodes:300001', 'hoppy_gr_rhodes:300002']);
  });
  it('drops the Mechelen scooter that stood in Kortrijk, and keeps Oostende\'s and Blankenberge\'s towns apart', () => {
    const bounds = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === id)!.bounds;
    expect(boundsContainPoint(bounds('hoppy_be_mechelen'), 50.823, 3.2728)).toBe(false);
    expect(boundsContainPoint(bounds('hoppy_be_kortrijk'), 50.823, 3.2728)).toBe(true);
    // Oostende's feed had one scooter in Blankenberge, which its bounds leave to Blankenberge's own feed.
    expect(boundsContainPoint(bounds('hoppy_be_oostende'), 51.3124, 3.121)).toBe(false);
    expect(boundsContainPoint(bounds('hoppy_be_blankenberge'), 51.3124, 3.121)).toBe(true);
    expect(bounds('hoppy_be_oostende').east).toBeLessThan(bounds('hoppy_be_blankenberge').west);
  });
  it('routes Hoppy\'s "Benidorm" feed to the four Marina Baixa towns its scooters stand in, and keeps only its scooters', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'hoppy_es_marina_baixa')!;
    const areas = serviceAreas(system);
    expect(areas.map(area => area.city)).toEqual(['Altea', 'L\'Albir', 'L\'Alfàs del Pi', 'La Nucía']);
    for (const [i, a] of areas.entries()) for (const b of areas.slice(i + 1)) {
      expect(a.bounds.south > b.bounds.north || b.bounds.south > a.bounds.north ||
        a.bounds.west > b.bounds.east || b.bounds.west > a.bounds.east, `${a.city} and ${b.city}`).toBe(true);
    }
    // Hoppy has no zone in Benidorm's centre, so the town is not on the map as Hoppy's.
    expect(searchRegionalScooterCities('Benidorm')).toEqual([]);
    const vehicle = (code: string, type: string, lat: number, lon: number) => ({ vehicle_id: code, lat, lon, is_reserved: false,
      is_disabled: false, rental_uris: { android: `https://ride-hoppy.app.link/${code}` }, vehicle_type_id: type,
      current_range_meters: 30_000, pricing_plan_id: type });
    const fetch = atomFeeds(system,
      { vehicle_type_id: '2332', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 60_000 },
      { plan_id: '2332', name: [{ text: 'SEGW MBAIXA ANRT_KSCSEG_Tier3', language: 'en' }], currency: 'EUR', price: 1,
        is_taxable: false, per_min_pricing: [{ start: 0, rate: 0.35, interval: 1 }] },
      // Scooters in Altea, L'Albir and La Nucía, an e-bike in Altea, and a scooter at Finestrat's shopping centre.
      [vehicle('601001', '2332', 38.5995, -0.0518), vehicle('601002', '2332', 38.5698, -0.0716), vehicle('601003', '2332', 38.6024, -0.1296),
        vehicle('500001', '3952', 38.5996, -0.0519), vehicle('601004', '2332', 38.5294, -0.167)]);
    const types = { version: '3.0', data: { vehicle_types: [
      { vehicle_type_id: '2332', form_factor: 'scooter_standing', propulsion_type: 'electric', max_range_meters: 60_000 },
      { vehicle_type_id: '3952', form_factor: 'bicycle', propulsion_type: 'electric_assist', max_range_meters: 80_000 }] } };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/vehicle_types') ? response(types) : fetch(url)));
    const result = await fetchScooters({ bounds: system.bounds, minBattery: 0, providers: new Set(['hoppy']) });
    expect(result.meta.sources.spain).toBe('fresh');
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(
      ['hoppy_es_marina_baixa:601001', 'hoppy_es_marina_baixa:601002', 'hoppy_es_marina_baixa:601003']);
  });
  it('names Hoppy\'s Canary and Torrevieja towns as Bird and Hopp do, so each town is counted once', () => {
    for (const [id, city] of [['hoppy_es_tenerife_sur', 'Playa de las Américas'], ['hoppy_es_caleta_de_fuste', 'Caleta de Fuste'],
      ['hoppy_es_torrevieja', 'Torrevieja']]) {
      expect(serviceAreas(REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === id)!).map(area => area.city)).toEqual([city]);
      expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'ES' && entry.city === city)).toHaveLength(1);
    }
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
