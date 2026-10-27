import { describe, expect, it, vi } from 'vitest';
import { SkyssMapError, SkyssIncompleteMapError, SkyssRydeReader,
  parseSkyssMap, parseSkyssServices, scanSkyssRydeBounds } from './ryde-skyss-map.mjs';

const box = { south: 60.375, west: 5.29, north: 60.405, east: 5.355 };
const smallBox = { south: 60.38, west: 5.30, north: 60.395, east: 5.33 };
const service = { zone: 'BERGEN', vendor: 'RYDE', type: 'ESCOOTER', status: 'NORMAL_SERVICE', integrationType: 'DEEP_LINK' };
const services = value => ({ data: { mobilityServices_v2: [{ services: [value ?? service] }] } });
const vehicle = (n = 0, extra = {}) => ({ __typename: 'VehicleDetailsLite', id: String(100000000000000 + n),
  vendor: 'RYDE', type: 'ESCOOTER', lat: 60.389, lon: 5.319, ...extra });
const map = (rows = []) => ({ data: { nearbyVehicles_v4: rows } });
const json = value => new Response(JSON.stringify(value), { status: 200 });
function makeReader(fetcher) {
  let at = 0;
  const waits = [];
  const reader = new SkyssRydeReader({ fetch: fetcher, now: () => at,
    sleep: async ms => { waits.push(ms); at += ms; } });
  return { reader, waits, advance: ms => { at += ms; } };
}

describe('Ryde identity and Skyss map data', () => {
  it('requires the Bergen Ryde scooter service and rejects a changed or partial service reply', () => {
    expect(parseSkyssServices(services())).toMatchObject({ city: 'Bergen', provider: 'ryde' });
    for (const change of [{ zone: 'OSLO' }, { vendor: 'VOI' }, { type: 'EBICYCLE' },
      { status: 'SUSPENDED' }, { integrationType: undefined }]) {
      expect(() => parseSkyssServices(services({ ...service, ...change }))).toThrow(SkyssMapError);
    }
    expect(() => parseSkyssServices({ ...services(), errors: [{ message: 'partial failure' }] })).toThrow(SkyssMapError);
    expect(() => parseSkyssServices({ data: { mobilityServices_v2: [] } })).toThrow(SkyssMapError);
  });

  it('distinguishes an empty map from absent, null or errored data', () => {
    expect(parseSkyssMap(map(), box)).toEqual({ vehicles: [], capped: false });
    for (const payload of [{}, { data: {} }, map(null), { ...map(), errors: [{ path: ['nearbyVehicles_v4'] }] },
      { ...map(), errors: 'not an array' }]) {
      expect(() => parseSkyssMap(payload, box)).toThrow(SkyssMapError);
    }
  });

  it('validates every row instead of silently dropping wrong vendors, types, identities or coordinates', () => {
    expect(parseSkyssMap(map([vehicle()]), box).vehicles).toEqual([{ id: vehicle().id, lat: 60.389, lng: 5.319 }]);
    for (const change of [{ vendor: 'VOI' }, { type: 'EBICYCLE' }, { __typename: 'DemoVehicle' },
      { id: '' }, { id: 100000000000000 }, { lat: NaN }, { lon: 10 }, { lat: 60.41 }]) {
      expect(() => parseSkyssMap(map([vehicle(0, change)]), box)).toThrow(SkyssMapError);
    }
    expect(() => parseSkyssMap(map([vehicle(), vehicle()]), box)).toThrow(SkyssMapError);
    expect(parseSkyssMap(map([vehicle(0, { lat: box.north + 0.000001 })]), box).vehicles).toHaveLength(1);
  });

  it('treats 500 and larger pages as capped before any filtering', () => {
    expect(parseSkyssMap(map(Array.from({ length: 499 }, (_, i) => vehicle(i))), box).capped).toBe(false);
    expect(parseSkyssMap(map(Array.from({ length: 500 }, (_, i) => vehicle(i))), box).capped).toBe(true);
    expect(parseSkyssMap(map(Array.from({ length: 600 }, (_, i) => vehicle(i))), box).capped).toBe(true);
  });
});

describe('Skyss guest transport', () => {
  it('serializes reads, uses scoped public client metadata and sends no rider credentials', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json(services())).mockResolvedValueOnce(json(map()));
    const { reader, waits } = makeReader(fetcher);
    await Promise.all([reader.services(), reader.map(smallBox)]);
    expect(waits).toEqual([2000]);
    const [url, init] = fetcher.mock.calls[1];
    expect(url).toBe('https://cosmo-router.transhub.io/graphql');
    expect(init.method).toBe('POST');
    expect(init.redirect).toBe('error');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.headers).toEqual({ 'Content-Type': 'application/json', 'client-platform': 'android',
      'client-version': '7.102.0', 'client-build-date': '1790928393', 'owner-id': 'SKYSS', 'accept-language': 'en' });
    expect(JSON.parse(init.body).variables).toEqual({ northWest: { latitude: smallBox.north, longitude: smallBox.west },
      southEast: { latitude: smallBox.south, longitude: smallBox.east }, vendors: ['RYDE'], rentalProductTypes: ['ESCOOTER'] });
  });

  it('rejects unsupported actions and out-of-scope bounds before network access', async () => {
    const fetcher = vi.fn();
    const { reader } = makeReader(fetcher);
    await expect(reader.request('startRental', {}, 1000)).rejects.toThrow('Unsupported');
    await expect(reader.map({ ...box, north: 61 })).rejects.toThrow('bounds');
    await expect(reader.map({ ...box, south: box.north })).rejects.toThrow('bounds');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('honors rate-limit cooldowns without leaking upstream bodies or automatically retrying', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('private upstream diagnostics', {
      status: 429, headers: { 'Retry-After': '3600' },
    }));
    const { reader, advance } = makeReader(fetcher);
    await expect(reader.map(smallBox)).rejects.toThrow('Skyss map HTTP 429');
    advance(16 * 60_000);
    await expect(reader.services()).rejects.toThrow('held off');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('bounds streaming responses and cancels oversized bodies', async () => {
    const cancel = vi.fn();
    const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(4 * 1024 * 1024 + 1)); }, cancel });
    const { reader } = makeReader(vi.fn().mockResolvedValue(new Response(body)));
    await expect(reader.map(smallBox)).rejects.toThrow('too large');
    expect(cancel).toHaveBeenCalledOnce();
  });
});

describe('bounded Skyss scans', () => {
  it('keeps valid parent observations, merges later positions, and completes all four child views', async () => {
    let maps = 0;
    const fetcher = vi.fn(async (_url, init) => {
      if (JSON.parse(init.body).operationName === 'mobilityServices') return json(services());
      maps++;
      if (maps === 1) return json(map(Array.from({ length: 500 }, (_, i) => vehicle(i))));
      if (maps === 2) return json(map([vehicle(0, { lat: 60.3892 })]));
      return json(map());
    });
    const { reader } = makeReader(fetcher);
    const result = await scanSkyssRydeBounds(reader, box, { maxRequests: 6 });
    expect(result).toMatchObject({ requests: 6, cappedViews: 1, leafViews: 4, startedAt: 0, finishedAt: 10_000,
      coverage: 'observations-only' });
    expect(result.views).toHaveLength(5);
    expect(result.vehicles).toHaveLength(500);
    expect(result.vehicles[0].lat).toBe(60.3892);
  });

  it('subdivides broad views even below the cap and never returns a partial scan on budget exhaustion', async () => {
    const fetcher = vi.fn(async (_url, init) => json(JSON.parse(init.body).operationName === 'mobilityServices' ? services() : map()));
    const { reader } = makeReader(fetcher);
    await expect(scanSkyssRydeBounds(reader, box, { maxRequests: 2 })).rejects.toThrow(SkyssIncompleteMapError);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not read maps after a failed service check or after the scan deadline', async () => {
    const bad = makeReader(vi.fn().mockResolvedValue(json(services({ ...service, zone: 'OSLO' }))));
    await expect(scanSkyssRydeBounds(bad.reader, smallBox)).rejects.toThrow('did not confirm');
    expect(bad.reader.requests).toBe(1);
    const clock = makeReader(vi.fn(async (_url, init) => {
      if (JSON.parse(init.body).operationName === 'mobilityServices') return json(services());
      clock.advance(120_000);
      return json(map());
    }));
    await expect(scanSkyssRydeBounds(clock.reader, smallBox)).rejects.toThrow(SkyssIncompleteMapError);
  });
});
