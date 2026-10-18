import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skippedSources } from '@/lib/scooterSources';
import { fetchScooters, independentCollectableFeeds, ScooterFeedsUnavailableError } from '@/lib/scooterFeeds';
import { FRENCH_SCOOTER_SYSTEMS, searchFrenchScooterCities } from '@/lib/frenchScooterSystems';
import { serviceAreas } from '@/lib/regionalScooterSystems';
import { upstreamJsonCache } from '@/lib/upstreamJsonCache';
import { parseScooterQuery } from '@/lib/scooterQuery';
import { boundsIntersect } from '@/lib/geo';
import { listedPricing } from '@/lib/listedPrices';

const lyon = { south: 45.72, west: 4.78, north: 45.82, east: 4.90 };
const angers = { south: 47.42, west: -0.64, north: 47.53, east: -0.46 };
const marseille = { south: 43.22, west: 5.34, north: 43.36, east: 5.48 };
const tignes = { south: 45.46, west: 6.89, north: 45.48, east: 6.92 };
const response = (data: unknown) => new Response(JSON.stringify(data));
// As Dott words a refusal: {"error":"Forbidden: ERR_REGION_OFFLINE"}.
const refusal = (status: number, error: string) => new Response(JSON.stringify({ error }), { status });
const collector = (systemId: string) => independentCollectableFeeds().find(feed => feed.id === `france:${systemId}`)!;

function fixture(
  systemId: string,
  options: { v3?: boolean; vehicles?: object[]; ageSeconds?: number; statusUrl?: string } = {}
) {
  const system = FRENCH_SCOOTER_SYSTEMS.find(system => system.id === systemId)!;
  const base = new URL('.', system.discoveryUrl).toString();
  const status = options.v3 ? 'vehicle_status' : 'free_bike_status';
  return (url: string): Response | undefined => {
    if (url === system.discoveryUrl) {
      const feeds = [status, 'vehicle_types', 'system_pricing_plans'].map(name => ({
        name,
        url: name === status && options.statusUrl ? options.statusUrl : `${base}${name}.json`,
      }));
      return response({ data: options.v3 ? { feeds } : { en: { feeds } } });
    }
    if (url === `${base}vehicle_types.json`) {
      return response({ data: { vehicle_types: [
        { vehicle_type_id: 'scooter', form_factor: options.v3 ? 'scooter_standing' : 'scooter', propulsion_type: 'electric' },
        { vehicle_type_id: 'ebike', form_factor: 'bicycle', propulsion_type: 'electric_assist' },
        { vehicle_type_id: 'moped', form_factor: 'moped', propulsion_type: 'electric' },
      ] } });
    }
    if (url === `${base}${status}.json`) {
      const updatedAt = Date.now() - (options.ageSeconds ?? 0) * 1000;
      return response({
        last_updated: options.v3 ? new Date(updatedAt).toISOString() : updatedAt / 1000,
        data: { [options.v3 ? 'vehicles' : 'bikes']: options.vehicles ?? [{
          bike_id: 'test-scooter', vehicle_type_id: 'scooter', lat: system.center[0], lon: system.center[1],
        }] },
      });
    }
    if (url === `${base}system_pricing_plans.json`) {
      return response({ data: { plans: [{
        plan_id: 'standard', currency: 'EUR', price: 1,
        description: options.v3 ? [{ language: 'en', text: 'Standard plan' }] : 'Standard plan',
        per_min_pricing: [{ start: 0, rate: 0.25, interval: 1 }],
      }] } });
    }
  };
}

beforeEach(() => {
  upstreamJsonCache.clear();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  upstreamJsonCache.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('French scooter feeds', () => {
  it('does no upstream work for Pony outside its French coverage', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchScooters({
      bounds: { south: 47.36, west: 8.52, north: 47.39, east: 8.57 },
      minBattery: 0,
      providers: new Set(['pony']),
    });
    expect(result.vehicles).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('routes Lyon through Dott without Swiss or other French city requests', async () => {
    const serve = fixture('dott_fr_lyon');
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const result = serve(String(url));
      if (!result) throw new Error(`Unexpected request: ${url}`);
      return result;
    });
    vi.stubGlobal('fetch', fetchMock);
    const parsed = parseScooterQuery(new URLSearchParams(
      Object.entries(lyon).map(([key, value]) => [key, String(value)])
    ));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.query.outsideCoverage).toBe(false);
    expect(parsed.query.bounds).toEqual(lyon);

    // Even a rider currently in Zürich should load only the French viewport.
    const result = await fetchScooters({ ...parsed.query, origin: [47.3769, 8.5417] });
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0].vehicle_id).toBe('dott_fr_lyon:test-scooter');
    expect(result.meta.sources).toEqual({ ...skippedSources(), france: 'fresh' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const [, init] of fetchMock.mock.calls as unknown as [unknown, RequestInit][]) {
      expect(init.headers).not.toHaveProperty('Authorization');
    }
  });

  it.each(FRENCH_SCOOTER_SYSTEMS)('skips all Swiss feeds when viewing $city ($provider)', async system => {
    const [lat, lng] = system.center;
    const bounds = { south: lat - 0.005, north: lat + 0.005, west: lng - 0.005, east: lng + 0.005 };
    // A feed split into towns is read only where one of its towns is, not in the space between them.
    const relevant = FRENCH_SCOOTER_SYSTEMS.filter(candidate => serviceAreas(candidate).some(area => boundsIntersect(area.bounds, bounds)));
    const handlers = relevant.map(candidate => fixture(candidate.id, { v3: candidate.provider === 'pony' }));
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const result = handlers.map(serve => serve(String(url))).find(Boolean);
      if (!result) throw new Error(`Unexpected request: ${url}`);
      return result;
    });
    vi.stubGlobal('fetch', fetchMock);
    const result = await fetchScooters({
      bounds,
      minBattery: 0,
    });
    expect(result.meta.sources).toEqual({ ...skippedSources(), france: 'fresh' });
    expect(result.vehicles.length).toBeGreaterThan(0);
    // Discovery, types, status and prices, but no prices from another operator's feed.
    expect(fetchMock).toHaveBeenCalledTimes(relevant.reduce((calls, candidate) => calls + (candidate.feedOperator ? 3 : 4), 0));
  });

  it('reads Pony GBFS 3 vehicles, pricing and rental links while filtering unavailable vehicles and other modes', async () => {
    const valid = {
      vehicle_id: 'pony-1', vehicle_type_id: 'scooter', lat: 47.478, lon: -0.563,
      current_fuel_percent: 0.75, current_range_meters: 32620, pricing_plan_id: 'standard',
      rental_uris: { ios: 'https://getapony.com/app/scan', android: 'https://getapony.com/app/scan' },
    };
    const serve = fixture('pony_fr_angers', { v3: true, vehicles: [
      valid,
      { ...valid, vehicle_id: 'reserved', is_reserved: true },
      { ...valid, vehicle_id: 'disabled', is_disabled: 1 },
      { ...valid, vehicle_id: 'bike', vehicle_type_id: 'ebike' },
      { ...valid, vehicle_id: 'moped', vehicle_type_id: 'moped' },
      { ...valid, vehicle_id: 'out-of-bounds', lat: 48.8 },
      { ...valid, vehicle_id: 'missing-position', lat: null },
    ] });
    vi.stubGlobal('fetch', vi.fn(async url => serve(String(url))!));

    const result = await fetchScooters({ bounds: angers, minBattery: 50 });
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]).toMatchObject({
      provider: 'pony', vehicle_id: 'pony_fr_angers:pony-1', battery: 75, range_m: 32620,
      rental_uris: { ios: valid.rental_uris.ios, android: valid.rental_uris.android, web: null },
      pricing: { currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 25 },
    });
  });

  it('shows Naolib Micromob\'s scooters as Naolib\'s, in Nantes and Saint-Herblain, with Naolib\'s published price and without Pony\'s price or app', async () => {
    const scooter = {
      bike_id: 'pony_1', vehicle_type_id: 'scooter', lat: 47.2818, lon: -1.5169, current_fuel_percent: 0.8,
      pricing_plan_id: 'standard', rental_uris: { ios: 'https://getapony.com/app/scan', android: 'https://getapony.com/app/scan' },
    };
    const serve = fixture('naolib_fr_nantes', { vehicles: [
      scooter,
      { ...scooter, bike_id: 'pony_2', lat: 47.2225, lon: -1.6394 },
      // In the centre of Nantes, between the two: Naolib has no station there.
      { ...scooter, bike_id: 'pony_3', lat: 47.2109, lon: -1.5774 },
    ] });
    const fetchMock = vi.fn(async (url: string) => serve(String(url))!);
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ bounds: { south: 47.2, west: -1.67, north: 47.31, east: -1.48 }, minBattery: 0 });
    expect(result.vehicles.map(vehicle => vehicle.vehicle_id).sort())
      .toEqual(['naolib_fr_nantes:pony_1', 'naolib_fr_nantes:pony_2']);
    for (const vehicle of result.vehicles) {
      expect(vehicle).toMatchObject({ provider: 'naolib', battery: 80, deep_link: null,
        rental_uris: { ios: null, android: null, web: null } });
      // The price Nantes Métropole publishes for Naolib, until it gets too old to show.
      expect(vehicle.pricing).toEqual(listedPricing('naolib_fr_nantes', vehicle.lat, vehicle.lng, Date.now()));
    }
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContainEqual(expect.stringContaining('pricing'));
  });

  it('retains unknown battery percentages and honors provider and battery filters', async () => {
    const serve = fixture('lime_fr_marseille', { vehicles: [{
      bike_id: 'lime-1', vehicle_type_id: 'scooter', lat: 43.296, lon: 5.369, current_range_meters: 15000,
    }] });
    const fetchMock = vi.fn(async url => serve(String(url))!);
    vi.stubGlobal('fetch', fetchMock);
    const query = { bounds: marseille, minBattery: 0, providers: new Set(['lime']) };
    const result = await fetchScooters(query);
    expect(result.vehicles[0]).toMatchObject({ battery: null, range_m: 15000 });
    expect((await fetchScooters({ ...query, minBattery: 20 })).vehicles).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('reports partial and stale independently when one Marseille provider fails', async () => {
    let now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    let statusFails = false;
    const serve = fixture('lime_fr_marseille', { ageSeconds: 120 });
    vi.stubGlobal('fetch', vi.fn(async url => {
      if (statusFails && String(url).endsWith('/free_bike_status.json')) return new Response('{}', { status: 503 });
      const result = serve(String(url));
      if (!result) throw new Error('Voi unavailable');
      return result;
    }));
    const query = { bounds: marseille, minBattery: 0 };
    expect((await fetchScooters(query)).meta).toMatchObject({ partial: true, stale: false });
    now += 31_000;
    statusFails = true;
    const result = await fetchScooters(query);
    expect(result.vehicles).toHaveLength(1);
    expect(result.meta).toMatchObject({
      partial: true, stale: true, failedSources: ['france:voi_fr_66'], sources: { france: 'partial' },
    });
  });

  it('rejects old successful feed responses with per-system failure details', async () => {
    const serve = fixture('dott_fr_lyon', { ageSeconds: 86400 });
    vi.stubGlobal('fetch', vi.fn(async url => serve(String(url))!));
    await expect(fetchScooters({ bounds: lyon, minBattery: 0 })).rejects.toMatchObject({
      failedSources: ['france:dott_fr_lyon'],
    });
  });

  it.each(['gbfs.json', 'free_bike_status.json'])(
    'skips a Dott region paused out of season, whose %s answers 403 ERR_REGION_OFFLINE',
    async file => {
      const serve = fixture('dott_fr_tignes');
      vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => (
        String(url).endsWith(`/tignes/${file}`) ? refusal(403, 'Forbidden: ERR_REGION_OFFLINE') : serve(String(url))!
      )));

      // Like a system without scooters: the map does not say Dott is not sharing data there.
      const result = await fetchScooters({ bounds: tignes, minBattery: 0 });
      expect(result.vehicles).toEqual([]);
      expect(result.meta).toMatchObject({ partial: false, failedSources: [], sources: { france: 'skipped' } });
      await expect(collector('dott_fr_tignes').collect()).resolves.toEqual({ vehicles: [], stale: false, skipped: true });
    }
  );

  // Lyon, not Tignes: in its seasonal pause, Tignes's failures are not reported (seasonalPauses.ts).
  it.each([
    { systemId: 'dott_fr_lyon', bounds: lyon, status: 404, error: 'Not Found: ERR_REGION_NOT_FOUND' },
    { systemId: 'dott_fr_lyon', bounds: lyon, status: 403, error: 'Forbidden' },
    { systemId: 'pony_fr_angers', bounds: angers, status: 403, error: 'Forbidden: ERR_REGION_OFFLINE' },
  ])('still fails $systemId when it answers $status $error', async ({ systemId, bounds, status, error }) => {
    vi.stubGlobal('fetch', vi.fn(async () => refusal(status, error)));
    await expect(fetchScooters({ bounds, minBattery: 0 })).rejects.toMatchObject({
      failedSources: [`france:${systemId}`],
    });
    const code = error.split(': ')[1];
    await expect(collector(systemId).collect()).rejects.toThrow(
      `GBFS request failed with HTTP ${status}${code ? ` (${code})` : ''}`
    );
  });

  it.each([
    'https://untrusted.example/free_bike_status.json',
    'https://gbfs.api.ridedott.com:444/public/v2/lyon/free_bike_status.json',
    'https://user:password@gbfs.api.ridedott.com/public/v2/lyon/free_bike_status.json',
    'https://gbfs.api.ridedott.com/public/v2/paris/free_bike_status.json',
  ])('rejects discovery URLs outside the reviewed city base: %s', async statusUrl => {
    const serve = fixture('dott_fr_lyon', { statusUrl });
    const fetchMock = vi.fn(async url => serve(String(url))!);
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchScooters({ bounds: lyon, minBattery: 0 })).rejects.toBeInstanceOf(ScooterFeedsUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps supported French cities searchable with accents and no duplicate operators', () => {
    expect(searchFrenchScooterCities('Bordeaux')).toEqual([{ lat: 44.8378, lng: -0.5792, display_name: 'Bordeaux, France' }]);
    expect(searchFrenchScooterCities('Evry France')[0].display_name).toBe('Évry-Courcouronnes, France');
    expect(searchFrenchScooterCities('Chalons')[0].display_name).toBe('Châlons-en-Champagne, France');
    expect(searchFrenchScooterCities('Nantes')[0].display_name).toBe('Nantes, France');
    expect(searchFrenchScooterCities('Chantrerie')[0].display_name).toBe('Nantes, France');
    expect(searchFrenchScooterCities('Saint Herblain')[0].display_name).toBe('Saint-Herblain, France');
    expect(searchFrenchScooterCities('France')).toEqual([]);
  });
});
