import { once } from 'node:events';
import { connect, createServer, type ServerHttp2Stream } from 'node:http2';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REGIONAL_SCOOTER_SYSTEMS } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds } from '../src/lib/scooterFeeds';
import { collectDottRegion, readDottVehicles, withDottAppCollectors } from './dottApp';
import { DottVehicleStream, fields, frame, messageField, watchRequest } from './dottProtocol';

vi.mock('node:http2', async importOriginal => {
  const original = await importOriginal<typeof import('node:http2')>();
  return { ...original, connect: vi.fn(original.connect) };
});

const bounds = { south: 53.4, north: 53.8, west: 9.7, east: 10.4 };
const sync = (status: number) => frame(messageField(3, Buffer.from([8, status])));
function vehicle(id = 'a', region = 'hamburg', type = 1, lat = 53.55, lng = 10) {
  const point = Buffer.alloc(18);
  point[0] = 9; point.writeDoubleLE(lat, 1); point[9] = 17; point.writeDoubleLE(lng, 10);
  return frame(messageField(1, messageField(1, Buffer.concat([
    messageField(1, Buffer.from(id)), messageField(2, point), Buffer.from([24, type]),
    messageField(5, Buffer.from(region)),
  ]))));
}
const remove = (id: string) => frame(messageField(2, messageField(1, Buffer.from(id))));

const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => { await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => server.close(() => resolve())))); });
async function upstream(handle: (stream: ServerHttp2Stream) => void) {
  const server = createServer(); servers.push(server);
  server.on('stream', (stream, headers) => {
    expect(headers[':path']).toBe('/ridedott.rider.v1.Vehicles/WatchAvailableVehicles');
    expect(headers.authorization).toBeUndefined();
    handle(stream as ServerHttp2Stream);
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test port');
  const original = await vi.importActual<typeof import('node:http2')>('node:http2');
  vi.mocked(connect).mockImplementation(() => original.connect(`http://127.0.0.1:${address.port}`));
}

describe('Dott map wire protocol', () => {
  it('requests the map bounds and only electric scooters', () => {
    const request = watchRequest(bounds);
    expect(request[0]).toBe(0);
    expect(request.readUInt32BE(1)).toBe(request.length - 5);
    const all = fields(request.subarray(5));
    expect(all[0]).toEqual({ number: 1, wire: 0, value: 1 });
    expect(all[2]).toEqual({ number: 3, wire: 2, value: Buffer.from([1]) });
    const box = fields(all[1].value as Buffer);
    expect(fields(box[0].value as Buffer).map(field => field.value)).toEqual([bounds.north, bounds.east]);
    expect(fields(box[1].value as Buffer).map(field => field.value)).toEqual([bounds.south, bounds.west]);
  });

  it('handles fragmented frames, changes, removals and a restarted sync', () => {
    const decoder = new DottVehicleStream();
    const bytes = Buffer.concat([sync(2), vehicle('old'), sync(2), vehicle('a'), vehicle('b'),
      vehicle('a', 'hamburg', 1, 53.6), remove('b'), sync(1)]);
    for (const byte of bytes) decoder.push(Buffer.from([byte]));
    expect(decoder.synced).toBe(true);
    expect([...decoder.vehicles.values()]).toEqual([{ id: 'a', region: 'hamburg', type: 1, lat: 53.6, lng: 10 }]);
  });

  it('accepts a synchronized empty map', () => {
    const decoder = new DottVehicleStream();
    expect(decoder.push(Buffer.concat([sync(2), sync(1)]))).toBe(true);
    expect(decoder.vehicles.size).toBe(0);
  });

  it('rejects invalid coordinates, malformed protobuf, compressed frames and excessive lengths', () => {
    expect(() => new DottVehicleStream().push(vehicle('bad', 'hamburg', 1, NaN))).toThrow('Invalid Dott vehicle');
    expect(() => fields(Buffer.from([10, 255]))).toThrow();
    expect(() => new DottVehicleStream().push(Buffer.from([1, 0, 0, 0, 0]))).toThrow('Compressed');
    expect(() => new DottVehicleStream().push(Buffer.from([0, 0, 32, 0, 0]))).toThrow('size limit');
  });
});

describe('Dott collection', () => {
  it('closes a live watch after sync and returns its vehicles', async () => {
    let request = Buffer.alloc(0);
    let closed!: Promise<unknown>;
    await upstream(stream => {
      closed = once(stream, 'close');
      stream.on('data', chunk => {
        request = Buffer.concat([request, chunk]);
        stream.respond({ ':status': 200, 'content-type': 'application/grpc+proto' });
        stream.write(Buffer.concat([sync(2), vehicle(), sync(1)]));
      });
    });
    expect(await readDottVehicles(bounds)).toHaveLength(1);
    expect(connect).toHaveBeenCalledWith('https://rider.api.ridedott.com', { minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' });
    await closed;
    expect(request).toEqual(watchRequest(bounds));
  });

  it('rejects an incomplete stream instead of publishing a partial snapshot', async () => {
    await upstream(stream => {
      stream.respond({ ':status': 200, 'content-type': 'application/grpc' });
      stream.end(Buffer.concat([sync(2), vehicle()]));
    });
    await expect(readDottVehicles(bounds)).rejects.toThrow('before synchronization');
  });

  it('bounds a watch that never finishes and releases the connection', async () => {
    await upstream(stream => {
      stream.respond({ ':status': 200, 'content-type': 'application/grpc' });
      stream.write(sync(2));
    });
    await expect(readDottVehicles(bounds, 30)).rejects.toThrow('timed out');
  });

  it('rejects HTTP and gRPC errors', async () => {
    await upstream(stream => { stream.respond({ ':status': 403 }); stream.end(); });
    await expect(readDottVehicles(bounds)).rejects.toThrow('HTTP 403');
    await upstream(stream => { stream.respond({ ':status': 200, 'content-type': 'application/grpc', 'grpc-status': '7' }); stream.end(); });
    await expect(readDottVehicles(bounds)).rejects.toThrow('gRPC 7');
  });

  it('publishes scooters only from the requested region and bounds, with unknown charge and range', async () => {
    await upstream(stream => {
      stream.respond({ ':status': 200, 'content-type': 'application/grpc' });
      stream.write(Buffer.concat([sync(2), vehicle(), vehicle('bike', 'hamburg', 2),
        vehicle('neighbor', 'other'), vehicle('outside', 'hamburg', 1, 52), sync(1)]));
    });
    const system = { ...REGIONAL_SCOOTER_SYSTEMS.find(system => system.dottAppRegion)!, id: 'dott_de_hamburg', dottAppRegion: 'hamburg', bounds };
    const result = await collectDottRegion(system);
    expect(result.stale).toBe(false);
    expect(result.observedAt).toBeGreaterThan(Date.now() - 1000);
    expect(result.vehicles).toEqual([{ provider: 'dott', vehicle_id: 'dott_de_hamburg:a',
      lat: 53.55, lng: 10, battery: null, range_m: null, deep_link: null, distance_m: null }]);
  });

  it('wires app collectors without replacing public feeds or treating gRPC as GBFS zones', () => {
    const definitions = independentCollectableFeeds();
    const withApp = withDottAppCollectors(definitions, REGIONAL_SCOOTER_SYSTEMS);
    for (const [index, feed] of withApp.entries()) {
      const app = REGIONAL_SCOOTER_SYSTEMS.find(system => feed.id.endsWith(`:${system.id}`))?.dottAppRegion;
      if (app) {
        expect(feed.collect).not.toBe(definitions[index].collect);
        expect(feed.host).toBe('rider.api.ridedott.com');
        expect(feed.zoneSource).toBeUndefined();
      } else expect(feed).toBe(definitions[index]);
    }
  });
});
