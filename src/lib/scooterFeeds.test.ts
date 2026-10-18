import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RIDE_DURATIONS } from '@/lib/ridePrice';
import { skippedSources } from '@/lib/scooterSources';
import {
  discoverCollectableFeeds,
  fetchJson,
  fetchScooters,
  forgetPlanRefreshes,
  independentCollectableFeeds,
  planRefreshCounts,
  ScooterFeedsUnavailableError,
  vehiclePricing,
  type CollectableScooterFeed,
  type FeedQuery,
} from '@/lib/scooterFeeds';
import { upstreamJsonCache } from '@/lib/upstreamJsonCache';
import { listedPricing } from '@/lib/listedPrices';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas } from '@/lib/regionalScooterSystems';

const query: FeedQuery = {
  origin: [47.3769, 8.5417],
  bounds: { south: 47.36, west: 8.52, north: 47.39, east: 8.57 },
  minBattery: 0,
};

function jsonResponse(value: unknown): Response {
  if (value && typeof value === 'object' && 'data' in value && value.data && typeof value.data === 'object' &&
      ('bikes' in value.data || 'vehicles' in value.data)) value = { last_updated: Date.now() / 1000, ...value };
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function nationalResponse(url: string): Response | null {
  if (url === 'https://sharedmobility.ch/v2/gbfs') {
    return jsonResponse({
      systems: [{
        id: 'lime_zurich',
        url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/gbfs',
      }],
    });
  }
  if (url === 'https://sharedmobility.ch/v2/gbfs/lime_zurich/gbfs') {
    return jsonResponse({
      data: {
        en: {
          feeds: [
            {
              name: 'free_bike_status',
              url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/free_bike_status',
            },
            {
              name: 'vehicle_types',
              url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/vehicle_types',
            },
            {
              name: 'system_pricing_plans',
              url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/system_pricing_plans',
            },
          ],
        },
      },
    });
  }
  if (url === 'https://sharedmobility.ch/v2/gbfs/lime_zurich/free_bike_status') {
    return jsonResponse({
      data: {
        bikes: [{
          vehicle_type_id: 'lime-scooter',
          pricing_plan_id: 'lime-standard',
          bike_id: 'lime-1',
          lat: 47.377,
          lon: 8.542,
          current_fuel_percent: 0.75,
          current_range_meters: 12_000,
          rental_uris: {
            ios: 'limebike://vehicle/lime-1',
            android: 'https://lime.bike/vehicle/lime-1?platform=android',
            web: 'https://lime.bike/vehicle/lime-1',
          },
          is_reserved: false,
          is_disabled: false,
        }],
      },
    });
  }
  if (url === 'https://sharedmobility.ch/v2/gbfs/lime_zurich/vehicle_types') {
    return jsonResponse({
      data: {
        vehicle_types: [{
          vehicle_type_id: 'lime-scooter',
          form_factor: 'scooter_standing',
          propulsion_type: 'electric',
        }],
      },
    });
  }
  if (url === 'https://sharedmobility.ch/v2/gbfs/lime_zurich/system_pricing_plans') {
    return jsonResponse({
      data: {
        plans: [{
          plan_id: 'lime-standard',
          currency: 'CHF',
          price: 1,
          per_min_pricing: [{ start: 0, rate: 0.42, interval: 1 }],
        }],
      },
    });
  }
  return null;
}

const HOPP_TOWNS: Record<string, { bikeId: string; lat: number; lon: number }> = {
  zurich: { bikeId: 'hopp-1', lat: 47.3771, lon: 8.5421 },
  basel: { bikeId: 'hopp-basel-1', lat: 47.5531, lon: 7.6030 },
};

function hoppResponse(url: string): Response | null {
  const match = url.match(/^https:\/\/api\.hopp\.bike\/gbfs\/ch-([a-z]+)\/(.+)$/);
  const town = match && HOPP_TOWNS[match[1]];
  if (!match || !town) return null;
  const base = `https://api.hopp.bike/gbfs/ch-${match[1]}`;
  if (match[2] === 'gbfs.json') {
    return jsonResponse({
      data: {
        feeds: [
          {
            name: 'free_bike_status',
            url: `${base}/en/free_bike_status.json`,
          },
          {
            name: 'vehicle_types',
            url: `${base}/en/vehicle_types.json`,
          },
          {
            name: 'system_pricing_plans',
            url: `${base}/en/system_pricing_plans.json`,
          },
        ],
      },
    });
  }
  if (match[2] === 'en/free_bike_status.json') {
    return jsonResponse({
      data: {
        bikes: [{
          vehicle_type_id: 'hopp-scooter',
          pricing_plan_id: 'hopp-standard',
          bike_id: town.bikeId,
          lat: town.lat,
          lon: town.lon,
          hopp_battery_level: 68,
          hopp_deeplink: `https://app.hopp.bike/launch/${town.bikeId}?direct`,
          is_reserved: false,
          is_disabled: false,
        }],
      },
    });
  }
  if (match[2] === 'en/vehicle_types.json') {
    return jsonResponse({
      data: {
        vehicle_types: [{
          vehicle_type_id: 'hopp-scooter',
          form_factor: 'scooter',
          propulsion_type: 'electric',
        }],
      },
    });
  }
  if (match[2] === 'en/system_pricing_plans.json') {
    return jsonResponse({
      data: {
        plans: [{
          plan_id: 'hopp-standard',
          currency: 'chf',
          price: 1,
          per_min_price: [{ start: 0, rate: 0.4, interval: 1 }],
        }],
      },
    });
  }
  return null;
}

function publibikeResponse(url: string): Response | null {
  if (url !== 'https://velospot.info/customer/public/api/pbvsng/freeFloating') {
    return null;
  }

  return jsonResponse([
    {
      id: 'publibike-zurich-1',
      latitude: 47.3772,
      longitude: 8.5422,
      type: 5,
    },
  ]);
}

beforeEach(() => {
  upstreamJsonCache.clear();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  upstreamJsonCache.clear();
  vi.unstubAllGlobals();
});

describe('fetchScooters source health', () => {
  it('does no upstream work for a viewport outside supported coverage', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({
      ...query,
      bounds: { south: 51.4, west: -0.3, north: 51.6, east: 0.1 },
      outsideCoverage: true,
    });

    expect(result.vehicles).toEqual([]);
    expect(result.meta.sources).toEqual(skippedSources());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns all available source data as fresh', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const response = nationalResponse(String(input)) ??
        hoppResponse(String(input)) ??
        publibikeResponse(String(input));
      if (response) return response;
      throw new Error(`Unexpected URL: ${String(input)}`);
    }));

    const result = await fetchScooters(query);

    expect(result.vehicles).toHaveLength(3);
    expect(result.vehicles).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'lime',
        battery: 75,
        range_m: 12_000,
        deep_link: 'https://lime.bike/vehicle/lime-1',
        rental_uris: {
          ios: 'limebike://vehicle/lime-1',
          android: 'https://lime.bike/vehicle/lime-1?platform=android',
          web: 'https://lime.bike/vehicle/lime-1',
        },
        pricing: {
          currency: 'CHF',
          unlock_fee_minor_units: 100,
          minute_fee_minor_units: 42,
        },
      }),
      expect.objectContaining({
        provider: 'hopp',
        battery: 68,
        deep_link: 'https://app.hopp.bike/launch/hopp-1?direct',
        rental_uris: {
          ios: 'https://app.hopp.bike/launch/hopp-1?direct',
          android: 'https://app.hopp.bike/launch/hopp-1?direct',
          web: 'https://app.hopp.bike/launch/hopp-1?direct',
        },
        pricing: {
          currency: 'CHF',
          unlock_fee_minor_units: 100,
          minute_fee_minor_units: 40,
        },
      }),
      expect.objectContaining({
        provider: 'publibike',
        battery: null,
        vehicle_id: 'publibike-freefloating:publibike-zurich-1',
      }),
    ]));
    expect(result.meta).toMatchObject({
      partial: false,
      stale: false,
      failedSources: [],
      sources: { ...skippedSources(), national: 'fresh', hopp: 'fresh', publibike: 'fresh' },
    });
  });

  it('keeps availability fresh when optional pricing cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/lime_zurich/system_pricing_plans')) {
        throw new Error('Pricing unavailable');
      }
      const response = nationalResponse(url);
      if (response) return response;
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]).not.toHaveProperty('pricing');
    expect(result.meta).toMatchObject({
      partial: false,
      stale: false,
      failedSources: [],
      sources: { ...skippedSources(), national: 'fresh' },
    });
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('system_pricing_plans'));
  });

  it('omits a tariff when its canonical values contradict its description', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/lime_zurich/system_pricing_plans')) {
        return jsonResponse({
          data: {
            plans: [{
              plan_id: 'lime-standard',
              currency: 'CHF',
              price: 1,
              description: 'Riders pay 1 CHF to unlock and 0.45 CHF per minute.',
              per_min_pricing: [{ start: 1, rate: 0.41, interval: 1 }],
            }],
          },
        });
      }
      const response = nationalResponse(url);
      if (response) return response;
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0]).not.toHaveProperty('pricing');
    expect(result.meta.sources.national).toBe('fresh');
  });

  it('loads only valid Zürich scooters from the PubliBike app feed', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [{
            id: 'velospot',
            url: 'https://sharedmobility.ch/v2/gbfs/velospot/gbfs',
          }],
        });
      }
      if (url === 'https://velospot.info/customer/public/api/pbvsng/freeFloating') {
        expect(init?.headers).not.toHaveProperty('Authorization');
        return jsonResponse([
          { id: 'zurich-1', latitude: 47.3772, longitude: 8.5422, type: 5 },
          { id: 'bike-1', latitude: 47.3773, longitude: 8.5423, type: 2 },
          { id: 'other-view', latitude: 47.45, longitude: 8.65, type: 5 },
          { id: 'biel-1', latitude: 47.1441, longitude: 7.267379, type: 5 },
          { latitude: 47.3774, longitude: 8.5424, type: 5 },
        ]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['publibike']) });

    // The API prices nothing; PubliBike's own price list does, until that copy gets too old to show.
    const pricing = listedPricing('publibike-freefloating', 47.3772, 8.5422, Date.now());
    expect(result.vehicles).toEqual([{
      provider: 'publibike',
      lat: 47.3772,
      lng: 8.5422,
      battery: null,
      range_m: null,
      vehicle_id: 'publibike-freefloating:zurich-1',
      deep_link: null,
      rental_uris: { ios: null, android: null, web: null },
      ...(pricing ? { pricing } : {}),
      distance_m: expect.any(Number),
    }]);
    expect(result.meta).toMatchObject({
      partial: false,
      stale: false,
      failedSources: [],
      sources: { ...skippedSources(), publibike: 'fresh' },
    });
  });

  it('turns PubliBike station counts in Biel and Locarno into scooters', async () => {
    const station = (id: string, latitude: number, longitude: number, scooters: number, out_of_service = false) => ({
      id, station_type: 4, latitude, longitude, out_of_service,
      available_vehicles: [{ count: 3, type: 2 }, { count: scooters, type: 5 }],
    });
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({ systems: [{ id: 'velospot', url: 'https://sharedmobility.ch/v2/gbfs/velospot/gbfs' }] });
      }
      if (url === 'https://velospot.info/customer/public/api/pbvsng/stations') {
        return jsonResponse([
          station('238', 47.1313, 7.2360, 2),
          station('239', 47.1320, 7.2370, 0),
          station('240', 47.1330, 7.2380, 4, true),
          station('241', 47.1340, 7.2390, 5000),
          station('170', 47.3772, 8.5422, 3),
          { id: '242', latitude: 47.1350, longitude: 7.2400, out_of_service: false, available_vehicles: [{ count: 1, type: 2 }] },
        ]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const result = await fetchScooters({
      bounds: { south: 47.12, west: 7.22, north: 47.15, east: 7.26 }, minBattery: 0, providers: new Set(['publibike']),
    });

    expect(result.vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(['publibike-station:238:1', 'publibike-station:238:2']);
    expect(result.vehicles[0]).toMatchObject({ provider: 'publibike', lat: 47.1313, lng: 7.2360, battery: null, distance_m: null });
    expect(result.vehicles[0].pricing).toEqual(listedPricing('publibike-station', 47.1313, 7.2360, Date.now()));
    // Locarno's station scooters can't be paid per ride, so Biel's price stays in Biel.
    expect(listedPricing('publibike-station', 46.1669, 8.8002, Date.now())).toBeUndefined();
    expect(result.meta).toMatchObject({ failedSources: [], sources: { national: 'skipped', publibike: 'fresh' } });
  });

  it('collects PubliBike stations instead of the national Velospot copy', async () => {
    const { discoverCollectableFeeds } = await import('./scooterFeeds');
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ systems: [
      { id: 'velospot', url: 'https://sharedmobility.ch/v2/gbfs/velospot/gbfs' },
      { id: 'lime_zurich', url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/gbfs' },
    ] })));
    const ids = (await discoverCollectableFeeds()).map(feed => feed.id);
    expect(ids).toContain('publibike-stations');
    expect(ids).toContain('national:lime_zurich');
    expect(ids).not.toContain('national:velospot');
  });

  it('loads only Hopp when it is explicitly requested', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const response = hoppResponse(String(input));
      if (response) return response;
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['hopp']) });

    expect(result.vehicles).toEqual([
      expect.objectContaining({ provider: 'hopp', battery: 68 }),
    ]);
    expect(result.meta.sources).toEqual({ ...skippedSources(), hopp: 'fresh' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('sharedmobility.ch'))).toBe(false);
  });

  it('loads Hopp in Basel from its own Basel feed', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const response = hoppResponse(String(input));
      if (response) return response;
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({
      ...query,
      origin: null,
      bounds: { south: 47.54, west: 7.57, north: 47.57, east: 7.62 },
      providers: new Set(['hopp']),
    });

    expect(result.vehicles).toEqual([
      expect.objectContaining({
        provider: 'hopp',
        vehicle_id: 'hopp:hopp-basel-1',
        pricing: { currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 40 },
      }),
    ]);
    expect(result.meta.sources.hopp).toBe('fresh');
    expect(fetchMock.mock.calls.every(([input]) => String(input).includes('/gbfs/ch-basel/'))).toBe(true);
  });

  it('marks a Hopp outage as partial when national data is available', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const response = nationalResponse(url) ?? publibikeResponse(url);
      if (response) return response;
      if (url.includes('hopp.bike')) throw new Error('Hopp unavailable');
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const result = await fetchScooters(query);

    expect(result.vehicles).toHaveLength(2);
    expect(result.meta).toMatchObject({
      partial: true,
      failedSources: ['hopp:hopp_ch_zurich'],
      sources: { ...skippedSources(), national: 'fresh', hopp: 'failed', publibike: 'fresh' },
    });
  });

  it('omits server-calculated distance when no legacy origin is supplied', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const response = nationalResponse(String(input));
      if (response) return response;
      throw new Error(`Unexpected URL: ${String(input)}`);
    }));

    const result = await fetchScooters({
      ...query,
      origin: null,
      providers: new Set(['lime']),
    });

    expect(result.vehicles[0].distance_m).toBeNull();
  });

  it('reports individual system failures as partial without calling fresh data stale', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [
            {
              id: 'lime_zurich',
              url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/gbfs',
            },
            {
              id: 'dott_zurich',
              url: 'https://sharedmobility.ch/v2/gbfs/dott_zurich/gbfs',
            },
          ],
        });
      }
      if (url.includes('/dott_zurich/')) throw new Error('Dott unavailable');
      const response = nationalResponse(url);
      if (response) return response;
      throw new Error(`Unexpected URL: ${url}`);
    }));

    const result = await fetchScooters({
      ...query,
      providers: new Set(['lime', 'dott']),
    });

    expect(result.vehicles).toHaveLength(1);
    expect(result.meta).toMatchObject({
      partial: true,
      stale: false,
      failedSources: ['national:dott_zurich'],
      sources: { ...skippedSources(), national: 'partial' },
    });
  });

  it('throws a typed unavailable error when every attempted source fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('all feeds unavailable');
    }));

    await expect(fetchScooters(query)).rejects.toMatchObject({
      name: 'ScooterFeedsUnavailableError',
      failedSources: ['national', 'hopp:hopp_ch_zurich', 'publibike'],
    } satisfies Partial<ScooterFeedsUnavailableError>);
  });

  it('loads only the national source when a provider is explicitly requested', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const response = nationalResponse(String(input));
      if (response) return response;
      throw new Error(`Unexpected URL: ${String(input)}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.meta.sources.national).toBe('fresh');
    expect(result.meta.sources.hopp).toBe('skipped');
    expect(result.meta.partial).toBe(false);
  });

  it('skips Hopp before discovery when the viewport is outside its towns', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({
      ...query,
      origin: [46.948, 7.447],
      bounds: { south: 46.92, west: 7.40, north: 46.98, east: 7.49 },
      providers: new Set(['hopp']),
    });

    expect(result.vehicles).toEqual([]);
    expect(result.meta.sources).toEqual(skippedSources());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('loads supported systems from the authenticated national registry', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Authorization: 'hello@scootradar.com',
      });
      const url = String(input);
      const response = nationalResponse(url);
      if (response) return response;
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.vehicles).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('does not load any system feeds outside the requested bounds', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [{
            id: 'lime_basel',
            url: 'https://sharedmobility.ch/v2/gbfs/lime_basel/gbfs',
          }],
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.vehicles).toEqual([]);
    expect(result.meta.sources.national).toBe('skipped');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('loads only systems whose city coverage intersects the viewport', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [
            {
              id: 'lime_zurich',
              url: 'https://sharedmobility.ch/v2/gbfs/lime_zurich/gbfs',
            },
            {
              id: 'lime_basel',
              url: 'https://sharedmobility.ch/v2/gbfs/lime_basel/gbfs',
            },
          ],
        });
      }
      const response = nationalResponse(url);
      if (response) return response;
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.vehicles).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/lime_basel/'))).toBe(false);
  });

  it('skips systems whose discovery document has no individual vehicle feed', async () => {
    const usterQuery: FeedQuery = {
      ...query,
      origin: [47.347, 8.718],
      bounds: { south: 47.32, west: 8.69, north: 47.36, east: 8.75 },
      providers: new Set(['lime']),
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [{
            id: 'lime_uster',
            url: 'https://sharedmobility.ch/v2/gbfs/lime_uster/gbfs',
          }],
        });
      }
      if (url.endsWith('/lime_uster/gbfs')) {
        return jsonResponse({
          data: {
            en: {
              feeds: [{
                name: 'vehicle_types',
                url: 'https://sharedmobility.ch/v2/gbfs/lime_uster/vehicle_types',
              }],
            },
          },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters(usterQuery);

    expect(result.vehicles).toEqual([]);
    expect(result.meta.partial).toBe(false);
    expect(result.meta.sources.national).toBe('skipped');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('leaves out the Swiss systems of towns their operator has left, without asking them', async () => {
    const { discoverCollectableFeeds } = await import('./scooterFeeds');
    const winterthurQuery: FeedQuery = {
      ...query,
      origin: [47.4997, 8.7241],
      bounds: { south: 47.48, west: 8.70, north: 47.52, east: 8.75 },
      providers: new Set(['lime']),
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: ['lime_winterthur', 'lime_zug', 'lime_wetzikon', 'bird-grenchen', 'bird-platform-partner-jmfleets-bulle']
            .map(id => ({ id, url: `https://sharedmobility.ch/v2/gbfs/${id}/gbfs` })),
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters(winterthurQuery);

    expect(result.vehicles).toEqual([]);
    expect(result.meta.partial).toBe(false);
    expect(result.meta.sources.national).toBe('skipped');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await discoverCollectableFeeds()).map(feed => feed.id).filter(id => id.startsWith('national:'))).toEqual([]);
  });

  it('uses declared Voi regions to skip its national vehicle feed', async () => {
    const bernQuery: FeedQuery = {
      ...query,
      origin: [46.95, 7.45],
      bounds: { south: 46.93, west: 7.42, north: 46.97, east: 7.48 },
      providers: new Set(['voi']),
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [{
            id: 'voiscooters.com',
            url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/gbfs',
          }],
        });
      }
      if (url.endsWith('/voiscooters.com/gbfs')) {
        return jsonResponse({
          data: {
            en: {
              feeds: [
                { name: 'free_bike_status', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/free_bike_status' },
                { name: 'vehicle_types', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/vehicle_types' },
                { name: 'system_regions', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/system_regions' },
              ],
            },
          },
        });
      }
      if (url.endsWith('/voiscooters.com/vehicle_types')) {
        return jsonResponse({
          data: {
            vehicle_types: [{
              vehicle_type_id: 'voi-scooter',
              form_factor: 'scooter',
              propulsion_type: 'electric',
            }],
          },
        });
      }
      if (url.endsWith('/voiscooters.com/system_regions')) {
        return jsonResponse({ data: { regions: [{ region_id: '222', name: 'Bern' }] } });
      }
      if (url.endsWith('/voiscooters.com/free_bike_status')) {
        return jsonResponse({
          data: {
            bikes: [{
              vehicle_type_id: 'voi-scooter',
              bike_id: 'voi-bern-1',
              lat: 46.951,
              lon: 7.451,
              is_reserved: false,
              is_disabled: false,
            }],
          },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters(bernQuery);

    expect(result.vehicles).toHaveLength(1);
    expect(result.meta.sources.national).toBe('fresh');
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/system_regions'))).toBe(true);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/free_bike_status'))).toBe(true);
  });

  it('skips a national multi-region system when its declared regions do not intersect', async () => {
    const genevaQuery: FeedQuery = {
      ...query,
      origin: [46.204, 6.143],
      bounds: { south: 46.18, west: 6.10, north: 46.23, east: 6.19 },
      providers: new Set(['voi']),
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [{
            id: 'voiscooters.com',
            url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/gbfs',
          }],
        });
      }
      if (url.endsWith('/voiscooters.com/gbfs')) {
        return jsonResponse({
          data: {
            en: {
              feeds: [
                { name: 'free_bike_status', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/free_bike_status' },
                { name: 'vehicle_types', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/vehicle_types' },
                { name: 'system_regions', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/system_regions' },
              ],
            },
          },
        });
      }
      if (url.endsWith('/voiscooters.com/vehicle_types')) {
        return jsonResponse({
          data: {
            vehicle_types: [{
              vehicle_type_id: 'voi-scooter',
              form_factor: 'scooter',
              propulsion_type: 'electric',
            }],
          },
        });
      }
      if (url.endsWith('/voiscooters.com/system_regions')) {
        return jsonResponse({
          data: { regions: [{ region_id: '401', name: 'Nyon' }, { region_id: '222', name: 'Bern' }] },
        });
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters(genevaQuery);

    expect(result.vehicles).toEqual([]);
    expect(result.meta.sources.national).toBe('skipped');
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/free_bike_status'))).toBe(false);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/identify?'))).toBe(false);
  });

  it('uses the spatial API for newly discovered systems without known coverage', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://sharedmobility.ch/v2/gbfs') {
        return jsonResponse({
          systems: [{
            id: 'lime_newmarket',
            url: 'https://sharedmobility.ch/v2/gbfs/lime_newmarket/gbfs',
          }],
        });
      }
      if (url.endsWith('/lime_newmarket/gbfs')) {
        return jsonResponse({
          data: {
            en: {
              feeds: [
                { name: 'free_bike_status', url: 'https://sharedmobility.ch/v2/gbfs/lime_newmarket/free_bike_status' },
                { name: 'vehicle_types', url: 'https://sharedmobility.ch/v2/gbfs/lime_newmarket/vehicle_types' },
              ],
            },
          },
        });
      }
      if (url.endsWith('/lime_newmarket/vehicle_types')) {
        return jsonResponse({
          data: {
            vehicle_types: [{
              vehicle_type_id: 'escooter',
              form_factor: 'scooter_standing',
              propulsion_type: 'electric',
            }],
          },
        });
      }
      if (url.startsWith('https://api.sharedmobility.ch/v1/sharedmobility/identify?')) {
        const params = new URL(url).searchParams;
        expect(params.getAll('filters')).toContain('ch.bfe.sharedmobility.provider.id=lime_newmarket');
        return jsonResponse([]);
      }
      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });

    expect(result.vehicles).toEqual([]);
    expect(result.meta.sources.national).toBe('skipped');
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/lime_newmarket/free_bike_status'))).toBe(false);
  });
});

describe('feed validation and tariff regressions', () => {
  it('accepts an eight-minute Swiss observation and expires it fifteen minutes after observation', async () => {
    const observedAt = Date.now() - 480_000;
    vi.stubGlobal('fetch', vi.fn(async input => {
      const response = nationalResponse(String(input))!;
      if (String(input).endsWith('/free_bike_status')) {
        return Response.json({ ...(await response.json() as Record<string, unknown>), last_updated: observedAt / 1000 });
      }
      return response;
    }));
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles).toHaveLength(1);
    expect(result.meta).toMatchObject({ stale: false, expiresAt: new Date(observedAt + 900_000).toISOString() });
  });

  function stubSwissStatusTimestamp(timestamp: number | null) {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const response = nationalResponse(String(input))!;
      if (String(input).endsWith('/free_bike_status')) {
        return Response.json({ ...(await response.json() as Record<string, unknown>), last_updated: timestamp });
      }
      return response;
    }));
  }

  it.each([null, Math.floor((Date.now() - 86400_000) / 1000)])('rejects a missing or expired Swiss status timestamp: %s', async timestamp => {
    stubSwissStatusTimestamp(timestamp);
    await expect(fetchScooters({ ...query, providers: new Set(['lime']) })).rejects.toBeInstanceOf(ScooterFeedsUnavailableError);
  });

  it.each([0, Math.floor((Date.now() - 40 * 86400_000) / 1000)])('skips a Swiss system that no longer sends positions: %s', async timestamp => {
    stubSwissStatusTimestamp(timestamp);
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles).toEqual([]);
    expect(result.meta).toMatchObject({ failedSources: [], sources: { national: 'skipped' } });
  });

  it('retains the last valid registry when an HTTP 200 response has an invalid shape', async () => {
    const { discoverCollectableFeeds } = await import('./scooterFeeds');
    let now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    let invalid = false;
    vi.stubGlobal('fetch', vi.fn(async input => invalid ? Response.json({}) : nationalResponse(String(input))!));
    expect((await discoverCollectableFeeds()).some(feed => feed.id === 'national:lime_zurich')).toBe(true);
    now += 3600_001;
    invalid = true;
    expect((await discoverCollectableFeeds()).some(feed => feed.id === 'national:lime_zurich')).toBe(true);
  });

  it('keeps live observation time advancing when only metadata uses stale fallback', async () => {
    const { discoverCollectableFeeds } = await import('./scooterFeeds');
    let now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    let metadataFails = false;
    vi.stubGlobal('fetch', vi.fn(async input => metadataFails && !String(input).endsWith('/free_bike_status')
      ? new Response('{}', { status: 503 }) : nationalResponse(String(input))!));
    const feed = (await discoverCollectableFeeds()).find(feed => feed.id === 'national:lime_zurich')!;
    await feed.collect();
    now += 3600_001;
    metadataFails = true;
    const collected = await feed.collect();
    expect(collected.stale).toBe(true);
    expect(collected.observedAt).toBe(now);
    expect(collected.vehicles).toHaveLength(1);
  });

  it('reads a minute band that starts at minute 1 as the price of every minute, as Dott, Ryde and Pony mean it', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const response = nationalResponse(String(input))!;
      if (String(input).endsWith('/system_pricing_plans')) {
        return jsonResponse({ data: { plans: [{
          plan_id: 'lime-standard',
          currency: 'CHF',
          price: 1,
          description: 'Pricing information for Zürich (scooter): Riders pay 1 CHF to unlock and 0.42 CHF per minute.',
          per_min_pricing: [{ start: 1, rate: 0.42, interval: 1 }],
        }] } });
      }
      return response;
    }));
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles[0].pricing).toEqual({ currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 42 });
  });

  function stubSwissPricingPlan(plan: Record<string, unknown>) {
    vi.stubGlobal('fetch', vi.fn(async input => {
      if (String(input).endsWith('/system_pricing_plans')) {
        return jsonResponse({ data: { plans: [{ plan_id: 'lime-standard', currency: 'CHF', ...plan }] } });
      }
      return nationalResponse(String(input))!;
    }));
  }

  it.each([
    { price: 0, unlock: '0.95', expected: 95 },
    { price: 1, unlock: '1.2', expected: 120 },
  ])('restores the cents sharedmobility.ch cuts from a $unlock CHF unlock fee', async ({ price, unlock, expected }) => {
    stubSwissPricingPlan({
      price,
      description: `Pricing information for Basel (scooter): Riders pay ${unlock} CHF to unlock and 0.39 CHF per minute.`,
      per_min_pricing: [{ start: 1, rate: 0.39, interval: 1 }],
    });
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles[0].pricing).toEqual({ currency: 'CHF', unlock_fee_minor_units: expected, minute_fee_minor_units: 39 });
  });

  it('still omits an estimate whose description contradicts more than the cents', async () => {
    stubSwissPricingPlan({
      price: 1,
      description: 'Riders pay 0.95 CHF to unlock and 0.39 CHF per minute.',
      per_min_pricing: [{ start: 1, rate: 0.39, interval: 1 }],
    });
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles[0].pricing).toBeUndefined();
  });

  it.each([
    { per_min_pricing: [{ start: 1, rate: 1.5, interval: 20 }] },
    { per_min_pricing: [{ start: 2, rate: 0.42, interval: 1 }] },
    { per_min_pricing: [{ start: 0, rate: 0, interval: 1, end: 5 }, { start: 5, rate: 0.4, interval: 1 }] },
    { per_min_pricing: [{ start: 0, rate: 0.8, interval: 2 }] },
    { per_km_pricing: [{ start: 0, rate: 0.1, interval: 1 }] },
    // A band that stops before the longest ride the app prices, 30 minutes.
    { per_min_pricing: [{ start: 0, rate: 0.42, interval: 1, end: 20 }] },
    // An introductory first minute cheaper than the rest.
    { per_min_pricing: [{ start: 0, rate: 0, interval: 1, end: 1 }, { start: 1, rate: 0.42, interval: 1 }] },
    // Minutes included in the price, as passes have them.
    { per_min_pricing: [{ start: 30, rate: 0.25, interval: 1, end: 1230 }] },
  ])('omits estimates for tariffs the flat-minute contract cannot represent: %j', async changes => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const response = nationalResponse(String(input))!;
      if (String(input).endsWith('/system_pricing_plans')) {
        const body = await response.json() as { data: { plans: Record<string, unknown>[] } };
        Object.assign(body.data.plans[0], changes);
        return Response.json(body);
      }
      return response;
    }));
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0].pricing).toBeUndefined();
  });

  it('shows Swiss prices as they are, VAT included, whatever is_taxable says', async () => {
    stubSwissPricingPlan({ price: 1, is_taxable: true, per_min_pricing: [{ start: 0, rate: 0.42, interval: 1 }] });
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles[0].pricing).toEqual({ currency: 'CHF', unlock_fee_minor_units: 100, minute_fee_minor_units: 42 });
  });

  describe('North American tariffs', () => {
    const priced = (plan: Record<string, unknown>, country = 'US') => vehiclePricing({ plan_id: 'scooter', ...plan }, country);

    it.each([
      { is_taxable: true, plus_tax: true },
      // Bike Share Toronto and SoBi Hamilton write the flag as a number.
      { is_taxable: 1, plus_tax: true },
      { is_taxable: 0, plus_tax: undefined },
      { is_taxable: false, plus_tax: undefined },
    ])('says tax is added to the prices where the plan says so: is_taxable $is_taxable', ({ is_taxable, plus_tax }) => {
      // Veo's plans: "The unlock fee is 1.000000 and we charge you 0.420000 for each every 1 minute".
      const plan = { currency: 'USD', price: 1, is_taxable, per_min_pricing: [{ start: 0, rate: 0.42, interval: 1 }] };
      expect(priced(plan)).toEqual({ currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 42, ...(plus_tax ? { plus_tax } : {}) });
    });

    it('reads a first minute at its own rate as an unlock fee, as Bike Share Toronto publishes its $1', () => {
      expect(priced({
        currency: 'CAD', price: 0, is_taxable: 1, description: '+Classic bike $0.12/min; Ebike $0.20/min',
        per_min_pricing: [{ start: 0, rate: 1.12, interval: 1, end: 1 }, { start: 1, rate: 0.12, interval: 1, end: 825 }],
      }, 'CA')).toEqual({ currency: 'CAD', unlock_fee_minor_units: 100, minute_fee_minor_units: 12, plus_tax: true });
    });

    it.each([
      // Tugo in Tucson: the band ends at the longest trip.
      [{ start: 0, rate: 0.25, interval: 1, end: 1200 }],
      // A table of bands that follow on at one rate.
      [{ start: 15, rate: 0.25, interval: 1, end: 30 }, { start: 0, rate: 0.25, interval: 1, end: 15 }, { start: 30, rate: 0.25, interval: 1 }],
    ])('reads bands that come to one rate through the longest ride priced as one minute price: %j', (...bands) => {
      expect(priced({ currency: 'USD', price: 1, description: '$1 unlock, plus $0.25/min', per_min_pricing: bands }))
        .toEqual({ currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 25 });
    });

    it.each([
      { end: Math.max(...RIDE_DURATIONS), priced: true },
      { end: Math.max(...RIDE_DURATIONS) - 1, priced: false },
    ])('prices a band only when it runs through the longest ride the card offers: end $end', ({ end, priced: isPriced }) => {
      expect(priced({ currency: 'USD', price: 1, per_min_pricing: [{ start: 0, rate: 0.25, interval: 1, end }] }))
        .toEqual(isPriced ? { currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 25 } : null);
    });

    it('keeps a tariff its description agrees with in dollars, as Lyft writes it', () => {
      expect(priced({ currency: 'USD', price: 1, is_taxable: true, description: '$1.00 unlock fee, $0.41 per minute.',
        per_min_pricing: [{ start: 0, rate: 0.41, interval: 1 }] }))
        .toEqual({ currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 41, plus_tax: true });
    });

    it.each([
      // MetroBike Austin: the bands make $2.25 once and $0.25 a minute, the description $2.50 to unlock.
      { price: 0, description: 'Single-trip pass. $2.50 to unlock + $0.25 per minute.', per_min_pricing: [{ start: 0, rate: 2.5, interval: 1, end: 1 }, { start: 1, rate: 0.25, interval: 1, end: 471 }] },
      { price: 1, description: '$1.00 unlock fee, $0.45 per minute.', per_min_pricing: [{ start: 0, rate: 0.41, interval: 1 }] },
    ])('omits a tariff its description contradicts in dollars: $description', plan => {
      expect(priced({ currency: 'USD', ...plan })).toBeNull();
    });
  });

  it('adds no tax to prices that include it, outside the US and Canada', () => {
    // Flamingo in Auckland: "$1 NZD to unlock, 45c per min", GST included, and is_taxable all the same.
    const flamingo = { plan_id: 'auckland', currency: 'NZD', price: 1, is_taxable: true, description: '$1 NZD to unlock, 45c per min',
      per_min_pricing: [{ rate: 0.45, start: 0, interval: 1 }] };
    expect(vehiclePricing(flamingo, 'NZ'))
      .toEqual({ currency: 'NZD', unlock_fee_minor_units: 100, minute_fee_minor_units: 45 });
    // Lyft's in the US, the same plan in dollars, keeps it.
    expect(vehiclePricing({ ...flamingo, currency: 'USD', description: undefined }, 'US'))
      .toEqual({ currency: 'USD', unlock_fee_minor_units: 100, minute_fee_minor_units: 45, plus_tax: true });
    expect(vehiclePricing({ ...flamingo, currency: 'EUR', description: undefined }, 'FR'))
      .toEqual({ currency: 'EUR', unlock_fee_minor_units: 100, minute_fee_minor_units: 45 });
  });

  it('uses a vehicle type default tariff when the vehicle has no override', async () => {
    vi.stubGlobal('fetch', vi.fn(async input => {
      const response = nationalResponse(String(input))!;
      const body = await response.json() as { data: { bikes: Record<string, unknown>[]; vehicle_types: Record<string, unknown>[] } };
      if (String(input).endsWith('/free_bike_status')) delete body.data.bikes[0].pricing_plan_id;
      if (String(input).endsWith('/vehicle_types')) body.data.vehicle_types[0].default_pricing_plan_id = 'lime-standard';
      return Response.json(body);
    }));
    const result = await fetchScooters({ ...query, providers: new Set(['lime']) });
    expect(result.vehicles[0].pricing?.minute_fee_minor_units).toBe(42);
  });
});

describe('fetchJson timeouts', () => {
  it('waits longer for Lime, whose big cities can take 26 seconds to answer', async () => {
    const fetchSpy = vi.spyOn(upstreamJsonCache, 'fetch').mockResolvedValue({ data: {}, stale: false, fetchedAt: 0 });
    await fetchJson('https://data.lime.bike/api/partners/v2/gbfs/chicago/free_bike_status', { revalidate: 30 });
    await fetchJson('https://mds.bird.co/gbfs/v2/public/chicago/free_bike_status.json', { revalidate: 30 });
    expect(fetchSpy.mock.calls.map(([, options]) => options.timeoutMs)).toEqual([40_000, 15_000]);
    fetchSpy.mockRestore();
  });
});

describe('a plan the scooters name before the cache has it', () => {
  let now: number;
  // The plan the first scooter names; the second stays on lime-day.
  let named: string;
  // The plans upstream lists, with their minute rate.
  let published: Record<string, number>;
  let ttl: number | undefined;
  let plansFail: boolean;
  let planFetches: number;
  const plansDocument = () => ({ ttl, data: { plans: Object.entries(published).map(([plan_id, rate]) => ({
    plan_id, currency: 'CHF', price: 1, per_min_pricing: [{ start: 0, rate, interval: 1 }] })) } });

  beforeEach(() => {
    forgetPlanRefreshes();
    now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    named = 'lime-day';
    published = { 'lime-day': 0.42 };
    ttl = 60;
    plansFail = false;
    planFetches = 0;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/system_pricing_plans')) {
        planFetches++;
        return plansFail ? new Response('{}', { status: 503 }) : jsonResponse(plansDocument());
      }
      const response = nationalResponse(url)!;
      if (!url.endsWith('/free_bike_status')) return response;
      const body = await response.json() as { data: { bikes: Record<string, unknown>[] } };
      const [bike] = body.data.bikes;
      body.data.bikes = [{ ...bike, pricing_plan_id: named }, { ...bike, bike_id: 'lime-2', pricing_plan_id: 'lime-day' }];
      return Response.json({ ...body, last_updated: now / 1000 });
    }));
  });

  const limeZurich = async () => (await discoverCollectableFeeds()).find(feed => feed.id === 'national:lime_zurich')!;
  // The minute fee of each scooter, in rappen.
  const minuteFees = async (feed: CollectableScooterFeed) => Object.fromEntries((await feed.collect()).vehicles
    .map(vehicle => [vehicle.vehicle_id, vehicle.pricing?.minute_fee_minor_units]));

  it('fetches the plans again once and prices the scooter in the same collection, as when Lime\'s rate changes', async () => {
    const feed = await limeZurich();
    expect(await minuteFees(feed)).toEqual({ 'lime_zurich:lime-1': 42, 'lime_zurich:lime-2': 42 });
    expect(planFetches).toBe(1);
    // At the rate change, Lime puts scooters on a new plan the cache, which keeps plans an hour, has not seen.
    now += 10 * 60_000;
    named = 'lime-peak';
    published = { 'lime-day': 0.42, 'lime-peak': 0.49 };
    expect(await minuteFees(feed)).toEqual({ 'lime_zurich:lime-1': 49, 'lime_zurich:lime-2': 42 });
    expect(planFetches).toBe(2);
    // The next collections use the plans just fetched.
    now += 60_000;
    expect(await minuteFees(feed)).toEqual({ 'lime_zurich:lime-1': 49, 'lime_zurich:lime-2': 42 });
    expect(planFetches).toBe(2);
    expect(planRefreshCounts).toEqual({ listed: 1, unlisted: 0 });
  });

  it('fetches a feed\'s plans again at most every two minutes, however many new plans its scooters name', async () => {
    const feed = await limeZurich();
    await feed.collect();
    now += 60_000;
    named = 'lime-peak';
    published = { 'lime-day': 0.42, 'lime-peak': 0.49 };
    // The plans are a minute old: the scooter waits.
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBeUndefined();
    expect(planFetches).toBe(1);
    now += 60_000;
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBe(49);
    expect(planFetches).toBe(2);
    // Another new plan a minute later waits for two minutes after that fetch.
    now += 60_000;
    named = 'lime-evening';
    published = { ...published, 'lime-evening': 0.4 };
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBeUndefined();
    expect(planFetches).toBe(2);
    now += 60_000;
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBe(40);
    expect(planFetches).toBe(3);
  });

  it('leaves a plan the new plans still lack unpriced, and looks for it again ever more rarely', async () => {
    const feed = await limeZurich();
    await feed.collect();
    now += 5 * 60_000;
    named = 'lime-unknown';
    // One fetch, not one after another: the scooter has no price, the others keep theirs.
    expect(await minuteFees(feed)).toEqual({ 'lime_zurich:lime-1': undefined, 'lime_zurich:lime-2': 42 });
    expect(planFetches).toBe(2);
    expect(planRefreshCounts).toEqual({ listed: 0, unlisted: 1 });
    // Collected every minute for half an hour, the plans are fetched again after 2, 4, 8 and 16 minutes.
    const start = now;
    const fetchedAt: number[] = [];
    for (let minute = 1; minute <= 30; minute++) {
      now = start + minute * 60_000;
      const before = planFetches;
      expect((await minuteFees(feed))['lime_zurich:lime-1']).toBeUndefined();
      if (planFetches > before) fetchedAt.push(minute);
    }
    expect(fetchedAt).toEqual([2, 6, 14, 30]);
    // A plan id not seen before is looked for two minutes after the last fetch.
    now += 2 * 60_000;
    named = 'lime-night';
    published = { ...published, 'lime-night': 0.35 };
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBe(35);
    expect(planFetches).toBe(7);
  });

  it('waits for the plans\' own ttl where it is longer than two minutes', async () => {
    ttl = 600;
    const feed = await limeZurich();
    await feed.collect();
    now += 5 * 60_000;
    named = 'lime-peak';
    published = { 'lime-day': 0.42, 'lime-peak': 0.49 };
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBeUndefined();
    expect(planFetches).toBe(1);
    now += 5 * 60_000;
    expect((await minuteFees(feed))['lime_zurich:lime-1']).toBe(49);
    expect(planFetches).toBe(2);
  });

  it('keeps the prices it has when the plans cannot be fetched again, and backs off', async () => {
    const feed = await limeZurich();
    await feed.collect();
    now += 5 * 60_000;
    named = 'lime-peak';
    plansFail = true;
    expect(await minuteFees(feed)).toEqual({ 'lime_zurich:lime-1': undefined, 'lime_zurich:lime-2': 42 });
    expect(planFetches).toBe(2);
    now += 60_000;
    await feed.collect();
    expect(planFetches).toBe(2);
    now += 60_000;
    plansFail = false;
    published = { 'lime-day': 0.42, 'lime-peak': 0.49 };
    expect(await minuteFees(feed)).toEqual({ 'lime_zurich:lime-1': 49, 'lime_zurich:lime-2': 42 });
    expect(planFetches).toBe(3);
  });

  it('does the same for an operator\'s own GBFS feed', async () => {
    const system = REGIONAL_SCOOTER_SYSTEMS.find(candidate => candidate.provider === 'lime' && !candidate.feedOperator)!;
    const feed = independentCollectableFeeds().find(candidate => candidate.id === `${regionalSource(system)}:${system.id}`)!;
    const area = serviceAreas(system)[0].bounds;
    const base = new URL('.', system.discoveryUrl).toString();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === system.discoveryUrl) return jsonResponse({ data: { en: { feeds: ['free_bike_status', 'vehicle_types', 'system_pricing_plans']
        .map(name => ({ name, url: `${base}${name}` })) } } });
      if (url === `${base}vehicle_types`) return jsonResponse({ data: { vehicle_types: [
        { vehicle_type_id: 'scooter', form_factor: 'scooter_standing', propulsion_type: 'electric' }] } });
      if (url === `${base}free_bike_status`) return Response.json({ last_updated: now / 1000, data: { bikes: [{ bike_id: 'one',
        lat: (area.south + area.north) / 2, lon: (area.west + area.east) / 2, vehicle_type_id: 'scooter', pricing_plan_id: named,
        is_reserved: false, is_disabled: false }] } });
      if (url === `${base}system_pricing_plans`) {
        planFetches++;
        return jsonResponse(plansDocument());
      }
      throw new Error(`Unexpected upstream ${url}`);
    }));
    expect((await feed.collect()).vehicles.map(vehicle => vehicle.pricing?.minute_fee_minor_units)).toEqual([42]);
    now += 3 * 60_000;
    named = 'lime-peak';
    published = { 'lime-day': 0.42, 'lime-peak': 0.49 };
    expect((await feed.collect()).vehicles.map(vehicle => vehicle.pricing?.minute_fee_minor_units)).toEqual([49]);
    expect(planFetches).toBe(2);
  });
});
