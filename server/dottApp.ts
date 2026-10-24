import { randomUUID } from 'node:crypto';
import { connect } from 'node:http2';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds } from '../src/lib/types';
import { DottVehicleStream, watchRequest, type DottMapVehicle } from './dottProtocol';

export const DOTT_MAP_URL = 'https://rider.api.ridedott.com/ridedott.rider.v1.Vehicles/WatchAvailableVehicles';
export const dottMapRequests = { status: 0, metadata: 0 };
let nextStart = 0;

// One bounded, anonymous map sync per region. The scheduler limits this host to two streams.
export function readDottVehicles(bounds: MapBounds, timeoutMs = 20_000): Promise<DottMapVehicle[]> {
  return new Promise((resolve, reject) => {
    // Dott's frontend returns 404 to the Linux Node/OpenSSL 3.5 TLS 1.3
    // handshake. TLS 1.2 completed a full sync in node:26-alpine on Netcup.
    const client = connect(new URL(DOTT_MAP_URL).origin, { minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' });
    const stream = client.request({
      ':method': 'POST', ':path': new URL(DOTT_MAP_URL).pathname,
      'content-type': 'application/grpc', te: 'trailers', 'grpc-timeout': `${timeoutMs}m`,
      'user-agent': 'grpc-java-okhttp/1.68.0', platform: 'android', 'build-number': '12863',
      'device-id': randomUUID(), 'application-locale': 'en-GB',
    }, { endStream: false });
    const state = new DottVehicleStream();
    let done = false;
    const finish = (error?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      stream.close();
      client.destroy();
      if (error) reject(error);
      else resolve([...state.vehicles.values()]);
    };
    const timer = setTimeout(() => finish(new Error('Dott map sync timed out')), timeoutMs);
    stream.on('response', headers => {
      if (headers[':status'] !== 200 || !String(headers['content-type']).startsWith('application/grpc')) {
        finish(new Error(`Dott map HTTP ${headers[':status']}`));
      } else if (headers['grpc-status'] && headers['grpc-status'] !== '0') finish(new Error(`Dott gRPC ${headers['grpc-status']}`));
    });
    stream.on('trailers', trailers => {
      if (trailers['grpc-status'] && trailers['grpc-status'] !== '0') finish(new Error(`Dott gRPC ${trailers['grpc-status']}`));
    });
    stream.on('data', (chunk: Buffer) => {
      try { if (state.push(chunk)) finish(); } catch (error) { finish(error as Error); }
    });
    stream.on('error', finish);
    client.on('error', finish);
    stream.on('close', () => finish(new Error('Dott map closed before synchronization')));
    // Keep the request side open: this is a bidirectional watch, closed once synced.
    stream.write(watchRequest(bounds));
  });
}

export async function collectDottRegion(system: RegionalScooterSystem): Promise<SourceVehicles> {
  // Spread cold starts across this shared host, at no more than two calls a second.
  const wait = Math.max(0, nextStart - Date.now());
  nextStart = Date.now() + wait + 500;
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  dottMapRequests.status++;
  const vehicles = await readDottVehicles(system.bounds);
  return { observedAt: Date.now(), stale: false,
    vehicles: vehicles.filter(vehicle => vehicle.type === 1 && vehicle.region === system.dottAppRegion &&
      boundsContainPoint(system.bounds, vehicle.lat, vehicle.lng)).map(vehicle => ({
      provider: 'dott', vehicle_id: `${system.id}:${vehicle.id}`, lat: vehicle.lat, lng: vehicle.lng,
      battery: null, range_m: null, deep_link: null, distance_m: null,
    })) };
}

export function withDottAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const appSystems = new Map(systems.filter(system => system.dottAppRegion).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = appSystems.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, collect: () => collectDottRegion(system) } : feed;
  });
}
