import { createHmac } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { get } from 'node:https';
import { dirname, join } from 'node:path';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';

const ORIGIN = 'https://api.gojet.app/api/v1/';
const MAX_BYTES = 8 * 1024 * 1024;
export const jetMapRequests = { status: 0, metadata: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

interface Configuration { version: 1; signingKey: string; deviceId: string; appVersion: string }
interface Reply { status: number; retryAfter?: string; body?: unknown }
type Request = (url: string, headers: Record<string, string>, timeoutMs: number) => Promise<Reply>;
interface ClientOptions { configPath?: string; request?: Request; now?: () => number; intervalMs?: number; timeoutMs?: number }

/** Linux Node's default TLS handshake is challenged; TLS 1.2 works on the production host. */
export const requestJetMap: Request = (url, headers, timeoutMs) => new Promise((resolve, reject) => {
  let bytes = 0;
  const chunks: Buffer[] = [];
  const request = get(url, { headers, minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2' }, response => {
    if (response.statusCode !== 200) {
      resolve({ status: response.statusCode ?? 0, retryAfter: response.headers['retry-after'] });
      response.destroy();
      return;
    }
    if (!response.headers['content-type']?.includes('application/json')) {
      reject(new Error('JET returned a non-JSON map'));
      response.destroy();
      return;
    }
    response.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) {
        reject(new Error('JET map exceeds the size limit'));
        response.destroy();
      } else chunks.push(chunk);
    });
    response.on('error', () => reject(new Error('JET map response was interrupted')));
    response.on('end', () => {
      try { resolve({ status: 200, body: JSON.parse(Buffer.concat(chunks).toString('utf8')) }); }
      catch { reject(new Error('JET returned invalid JSON')); }
    });
  });
  const timer = setTimeout(() => request.destroy(new Error('JET map request timed out')), timeoutMs);
  request.on('error', () => reject(new Error('JET map request failed or timed out')));
  request.on('close', () => clearTimeout(timer));
});

/** Public map reads need app signing configuration, but no rider account or attestation token. */
export class JetClient {
  private readonly configPath: string;
  private readonly request: Request;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private nextStart = 0;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.configPath = options.configPath ?? process.env.JET_CONFIG_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'jet-config.json');
    this.request = options.request ?? requestJetMap;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 500;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  private async configuration(): Promise<Configuration> {
    let data: Record<string, unknown> | undefined;
    try {
      const text = await readFile(this.configPath, 'utf8');
      if (text.length > 4096) throw new Error();
      data = object(JSON.parse(text));
    } catch { throw new Error('JET signing configuration is missing or unreadable'); }
    if (data?.version !== 1 || typeof data.signingKey !== 'string' ||
      !/^[A-Za-z0-9+/=_-]{16,256}$/.test(data.signingKey) || typeof data.deviceId !== 'string' ||
      !/^[A-Za-z0-9_-]{8,128}$/.test(data.deviceId) || typeof data.appVersion !== 'string' ||
      !/^\d{1,9}$/.test(data.appVersion)) throw new Error('JET signing configuration is invalid');
    return data as unknown as Configuration;
  }

  async vehicles(bounds: MapBounds, deadline = this.now() + 90_000): Promise<unknown> {
    jetMapTiles(bounds); // Validate before loading configuration or reserving a request slot.
    const config = await this.configuration();
    if (this.now() < this.blockedUntil) throw new Error('JET map requests are temporarily held off');
    const wait = Math.max(0, this.nextStart - this.now());
    if (this.now() + wait >= deadline) throw new Error('JET map collection timed out');
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('JET map requests are temporarily held off');
    const remaining = deadline - this.now();
    if (remaining <= 0) throw new Error('JET map collection timed out');
    const query = new URLSearchParams({ north_west_lat: String(bounds.north), north_west_lng: String(bounds.west),
      south_east_lat: String(bounds.south), south_east_lng: String(bounds.east), zoom: '18' });
    const url = `${ORIGIN}geo/transports?${query}`;
    const timestamp = String(this.now());
    jetMapRequests.status++;
    let response: Reply;
    try {
      response = await this.request(url, {
        'user-agent': 'Dart/3.11 (dart:io)', accept: 'application/json',
        'X-App-Version': config.appVersion, 'X-Device-Id': config.deviceId, 'X-Timestamp': timestamp,
        'X-Signature': createHmac('sha256', config.signingKey).update(url + timestamp).digest('base64'),
      }, Math.min(this.timeoutMs, remaining));
    } catch { throw new Error('JET map request failed or timed out'); }
    if (!Number.isInteger(response.status) || response.status !== 200) {
      if ([401, 403, 429].includes(response.status)) {
        const retry = response.retryAfter;
        const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : 0;
        this.blockedUntil = this.now() + Math.max(60_000, Math.min(3600_000, delay || 0));
      }
      throw new Error(`JET map HTTP ${response.status}`);
    }
    return response.body;
  }
}

/** The API rejects large viewports; 0.08-degree tiles preserve the whole reviewed envelope. */
export function jetMapTiles(bounds: MapBounds): MapBounds[] {
  const { south, west, north, east } = bounds;
  if (![south, west, north, east].every(Number.isFinite) || south >= north || west >= east ||
    south < -85 || north > 85 || west < -180 || east > 180) throw new Error('Invalid JET map bounds');
  const rows = Math.ceil((north - south) / 0.08);
  const columns = Math.ceil((east - west) / 0.08);
  if (rows * columns > 96) throw new Error('JET map bounds exceed the collection budget');
  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    return { south: south + row * (north - south) / rows, north: south + (row + 1) * (north - south) / rows,
      west: west + column * (east - west) / columns, east: west + (column + 1) * (east - west) / columns };
  });
}

type JetScooter = Vehicle & { vehicle_id: string };
export function parseJetVehicles(payload: unknown): JetScooter[] {
  const data = object(payload);
  if (!data || data.code !== undefined || data.error !== undefined || (data.transports !== undefined && !Array.isArray(data.transports)) ||
    (data.transport_clusters !== undefined && (!Array.isArray(data.transport_clusters) || data.transport_clusters.length)) ||
    (data.transports === undefined && Object.keys(data).some(key => key !== 'transport_clusters'))) {
    throw new Error('JET returned an invalid or clustered map');
  }
  const vehicles: JetScooter[] = [];
  for (const entry of (data.transports ?? []) as unknown[]) {
    const vehicle = object(entry);
    if (!vehicle || typeof vehicle.type !== 'string') throw new Error('Invalid JET transport');
    if (vehicle.type !== 'scooter') continue;
    const point = object(vehicle.coordinates);
    if (typeof vehicle.id !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(vehicle.id) ||
      typeof point?.lat !== 'number' || typeof point.lng !== 'number' ||
      !Number.isFinite(point.lat) || !Number.isFinite(point.lng) || Math.abs(point.lat) > 90 || Math.abs(point.lng) > 180 ||
      (vehicle.battery_percent != null && (typeof vehicle.battery_percent !== 'number' ||
        !Number.isFinite(vehicle.battery_percent) || vehicle.battery_percent < 0 || vehicle.battery_percent > 1)) ||
      (vehicle.is_ride_active !== undefined && typeof vehicle.is_ride_active !== 'boolean')) throw new Error('Invalid JET scooter');
    if (vehicle.is_ride_active) continue;
    vehicles.push({ provider: 'jet', vehicle_id: `jet:${vehicle.id}`, lat: point.lat, lng: point.lng,
      battery: typeof vehicle.battery_percent === 'number' ? Math.round(vehicle.battery_percent * 100) : null,
      range_m: null, deep_link: null, distance_m: null });
  }
  return vehicles;
}

let defaultClient: JetClient | undefined;
export async function collectJetRegion(system: RegionalScooterSystem, client = defaultClient ??= new JetClient()): Promise<SourceVehicles> {
  if (!system.jetAppMap) throw new Error('Not a JET app map region');
  const started = Date.now();
  const vehicles = new Map<string, Vehicle>();
  for (const tile of jetMapTiles(system.bounds)) {
    const batch = parseJetVehicles(await client.vehicles(tile, started + 90_000));
    for (const vehicle of batch) if (boundsContainPoint(system.bounds, vehicle.lat, vehicle.lng)) vehicles.set(vehicle.vehicle_id, vehicle);
  }
  // A failed tile throws before any partial sweep can replace the last good snapshot.
  return { observedAt: started, stale: false, vehicles: [...vehicles.values()] };
}

export function withJetAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const appSystems = new Map(systems.filter(system => system.jetAppMap).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = appSystems.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, collect: () => collectJetRegion(system) } : feed;
  });
}
