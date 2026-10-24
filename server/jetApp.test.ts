import { EventEmitter } from 'node:events';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { get, type RequestOptions } from 'node:https';
import type { ClientRequest, IncomingMessage } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { collectJetRegion, JetClient, jetMapTiles, parseJetVehicles, requestJetMap } from './jetApp';

vi.mock('node:https', () => ({ get: vi.fn() }));
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
const bounds = { south: -33.52, north: -33.50, west: -70.66, east: -70.64 };
const scooter = (id = 'S.123', extra = {}) => ({ id, type: 'scooter', coordinates: { lat: -33.51, lng: -70.65 }, battery_percent: 0.75, ...extra });

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'jet-client-'));
  directories.push(directory);
  const configPath = join(directory, 'jet-config.json');
  await writeFile(configPath, JSON.stringify({ version: 1, signingKey: 'test-signing-secret', deviceId: 'test-device-1234', appVersion: '691' }));
  type Request = NonNullable<NonNullable<ConstructorParameters<typeof JetClient>[0]>['request']>;
  const request = vi.fn<Request>();
  let now = 1_800_000_000_000;
  const client = new JetClient({ configPath, request, now: () => now, intervalMs: 0 });
  return { client, request, configPath, advance: (ms: number) => { now += ms; } };
}

describe('Go Jet signed-out map', () => {
  it('reads a complete viewport with app signing, without rider authorization or App Check', async () => {
    const f = await fixture();
    f.request.mockResolvedValue({ status: 200, body: { transports: [scooter()] } });
    await f.client.vehicles(bounds);
    const [url, headers, timeout] = f.request.mock.calls[0];
    expect(url).toBe('https://api.gojet.app/api/v1/geo/transports?north_west_lat=-33.5&north_west_lng=-70.66&south_east_lat=-33.52&south_east_lng=-70.64&zoom=18');
    expect(headers).toMatchObject({ 'X-App-Version': '691', 'X-Device-Id': 'test-device-1234', 'X-Timestamp': '1800000000000' });
    expect(headers['X-Signature']).toBe('XYGvs+pJW6HGqNgKvFsTmhgOi/DgefR3/dRbkoNMffI=');
    expect(JSON.stringify(headers).toLowerCase()).not.toMatch(/authorization|appcheck|test-signing-secret/);
    expect(timeout).toBe(15000);
  });

  it('holds off every region after rejection or rate limiting and honors Retry-After', async () => {
    const f = await fixture();
    f.request.mockResolvedValue({ status: 429, retryAfter: '120', body: { secret: 'do-not-log' } });
    await expect(f.client.vehicles(bounds)).rejects.toThrow('JET map HTTP 429');
    await expect(f.client.vehicles(bounds)).rejects.toThrow('temporarily held off');
    expect(f.request).toHaveBeenCalledTimes(1);
    f.advance(120000);
    f.request.mockResolvedValue({ status: 200, body: {} });
    await expect(f.client.vehicles(bounds)).resolves.toEqual({});
    f.request.mockResolvedValue({ status: 401 });
    await expect(f.client.vehicles(bounds)).rejects.toThrow('HTTP 401');
    await expect(f.client.vehicles(bounds)).rejects.toThrow('temporarily held off');
  });

  it('fails closed on missing configuration and on an expired collection deadline', async () => {
    const f = await fixture();
    await writeFile(f.configPath, 'private invalid configuration');
    await expect(f.client.vehicles(bounds)).rejects.toThrow('missing or unreadable');
    expect(f.request).not.toHaveBeenCalled();
    const other = await fixture();
    await expect(other.client.vehicles(bounds, 1_799_999_999_999)).rejects.toThrow('collection timed out');
    expect(other.request).not.toHaveBeenCalled();
  });
});

describe('Go Jet map completeness', () => {
  it('covers the whole envelope at individual-vehicle zoom, including its outer edges', () => {
    const area = { south: 40, north: 40.17, west: 49, east: 49.19 };
    const tiles = jetMapTiles(area);
    expect(tiles).toHaveLength(9);
    expect(tiles[0]).toMatchObject({ south: 40, west: 49 });
    expect(tiles.at(-1)).toMatchObject({ north: 40.17, east: 49.19 });
    expect(tiles.every(tile => tile.north - tile.south <= 0.08 && tile.east - tile.west <= 0.08)).toBe(true);
    expect(tiles[0].east).toBe(tiles[1].west);
    expect(tiles[0].north).toBe(tiles[3].south);
    expect(() => jetMapTiles({ ...area, north: 50 })).toThrow('collection budget');
    expect(() => jetMapTiles({ ...area, east: NaN })).toThrow('bounds');
  });

  it('keeps stable scooter ids and charge, excludes other vehicles and active rides, and accepts a truly empty map', () => {
    expect(parseJetVehicles({ transports: [scooter(), scooter('empty', { battery_percent: null }),
      scooter('bike', { type: 'bike' }), scooter('rented', { is_ride_active: true })] }))
      .toMatchObject([{ vehicle_id: 'jet:S.123', lat: -33.51, battery: 75, deep_link: null }, { vehicle_id: 'jet:empty', battery: null }]);
    expect(parseJetVehicles({})).toEqual([]);
    for (const payload of [null, [], { code: 'G-4' }, { transports: {} }, { transport_clusters: [{ num_points: 5 }] },
      { transports: [scooter('bad', { battery_percent: 75 })] }, { transports: [scooter('bad', { coordinates: { lat: NaN, lng: 0 } })] }]) {
      expect(() => parseJetVehicles(payload)).toThrow();
    }
  });

  it('deduplicates tile edges and publishes nothing from a sweep with a failed or clustered tile', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_800_000_000_000);
    const f = await fixture();
    const system = { id: 'jet_cl_test', provider: 'jet', country: 'CL', jetAppMap: true,
      bounds: { ...bounds, east: -70.49 } } as RegionalScooterSystem;
    f.request.mockResolvedValue({ status: 200, body: { transports: [scooter(), scooter('far', { coordinates: { lat: 40, lng: 50 } })] } });
    const snapshot = await collectJetRegion(system, f.client);
    expect(snapshot.vehicles).toHaveLength(1);
    expect(snapshot.stale).toBe(false);
    expect(f.request).toHaveBeenCalledTimes(3);
    f.request.mockResolvedValueOnce({ status: 200, body: { transports: [scooter()] } })
      .mockResolvedValueOnce({ status: 503 });
    await expect(collectJetRegion(system, f.client)).rejects.toThrow('HTTP 503');
    f.request.mockResolvedValue({ status: 200, body: { transport_clusters: [{ num_points: 2 }] } });
    await expect(collectJetRegion(system, f.client)).rejects.toThrow('clustered map');
  });
});

describe('Go Jet production transport', () => {
  it('pins TLS 1.2, rejects redirects, and stops an oversized response before parsing it', async () => {
    const response = Object.assign(new EventEmitter(), { statusCode: 200, headers: { 'content-type': 'application/json' }, destroy: vi.fn() });
    const request = Object.assign(new EventEmitter(), { destroy: vi.fn() });
    let options: RequestOptions | undefined;
    vi.mocked(get).mockImplementation(((_url: unknown, opts: RequestOptions, callback: (r: IncomingMessage) => void) => {
      options = opts;
      queueMicrotask(() => callback(response as unknown as IncomingMessage));
      return request as unknown as ClientRequest;
    }) as typeof get);
    const result = requestJetMap('https://api.gojet.app/api/v1/geo/transports', {}, 1000);
    const assertion = expect(result).rejects.toThrow('size limit');
    await Promise.resolve();
    response.emit('data', Buffer.alloc(8 * 1024 * 1024 + 1));
    request.emit('close');
    await assertion;
    expect(options).toMatchObject({ minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' });
    expect(response.destroy).toHaveBeenCalled();
    response.statusCode = 302;
    const redirected = requestJetMap('https://api.gojet.app/api/v1/geo/transports', {}, 1000);
    await Promise.resolve();
    request.emit('close');
    await expect(redirected).resolves.toEqual({ status: 302 });
  });
});
