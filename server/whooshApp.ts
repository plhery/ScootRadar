import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { Pacer, SweepProgress, nearestFirst } from './sweeps';

const ORIGIN = 'https://api.whoosh.bike';
const COGNITO = 'https://cognito.whoosh.bike/';
const RETRY_MS = 60_000;
const METADATA_MS = 3600_000;
const VIEW_SPAN = 0.04;
const VIEW_LIMIT = 300;
const REQUEST_BUDGET = 512;
export const whooshMapRequests = { status: 0, metadata: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const credential = (value: unknown): value is string => typeof value === 'string' && value.length > 0 &&
  value.length < 8192 && !/\s/.test(value);
const regionId = (value: string) => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
interface Credentials { version: 1; clientId: string; apiKey: string; refreshToken: string; deviceId: string }
interface Lease { idToken: string; accessToken: string; expiresAt: number; credentials: Credentials }
interface Options { sessionPath?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }
interface Metadata { closed: boolean; areas: MapBounds[]; expiresAt: number }
interface WhooshScooter { id: string; lat: number; lng: number; battery: number | null; range: number | null }
/** A sweep's scooters as it finds them, and a call for each view it finishes. */
interface WhooshSweep { found: Map<string, WhooshScooter>; done(view: MapBounds): void }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Whoosh returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error();
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error(size > maxBytes ? 'Whoosh response exceeds the size limit' : 'Whoosh response could not be read');
  }
  let data: unknown;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Whoosh returned invalid JSON'); }
  // This API also returns application errors with HTTP 200. Never publish one as an empty fleet.
  if (object(data)?.error) throw new Error('Whoosh returned an application error');
  return data;
}

const validBounds = (b: MapBounds) => [b.south, b.west, b.north, b.east].every(Number.isFinite) &&
  b.south < b.north && b.west < b.east && b.south >= -85 && b.north <= 85 && b.west >= -180 && b.east <= 180;

/** LIMITED polygons are the holes in the app's out-of-ride-area mask, not its speed-limit areas. */
export function parseWhooshRideAreas(payload: unknown): MapBounds[] {
  const areas = object(payload)?.areas;
  if (!Array.isArray(areas)) throw new Error('Invalid Whoosh ride areas');
  return areas.flatMap(entry => {
    const area = object(entry);
    if (!area) throw new Error('Invalid Whoosh area');
    if (area.type !== 'LIMITED' || area.enabled !== true) return [];
    const points = object(area.borders)?.coordinates;
    if (!Array.isArray(points) || points.length < 3) throw new Error('Invalid Whoosh ride polygon');
    const coordinates = points.map(point => {
      const p = object(point);
      if (typeof p?.lat !== 'number' || typeof p.lng !== 'number' || !Number.isFinite(p.lat) ||
        !Number.isFinite(p.lng) || Math.abs(p.lat) > 85 || Math.abs(p.lng) > 180) throw new Error('Invalid Whoosh ride coordinate');
      return { lat: p.lat, lng: p.lng };
    });
    const bounds = { south: Math.min(...coordinates.map(p => p.lat)), north: Math.max(...coordinates.map(p => p.lat)),
      west: Math.min(...coordinates.map(p => p.lng)), east: Math.max(...coordinates.map(p => p.lng)) };
    if (!validBounds(bounds)) throw new Error('Invalid Whoosh ride bounds');
    return [bounds];
  });
}

/** Large, otherwise valid views can return zero; views can also stop at 300 devices. */
/**
 * Whether the ride area lies wholly outside the coverage. The areas endpoint also lists the nearest
 * region's polygons: Joinville's lists Curitiba's, Temuco's and Villarrica's the same three. Those
 * are the other region's to collect; one that crosses the coverage's edge is an unreviewed expansion.
 */
export const outsideCoverage = (area: MapBounds, coverage: MapBounds) => area.north < coverage.south ||
  area.south > coverage.north || area.east < coverage.west || area.west > coverage.east;

export function whooshMapViews(areas: readonly MapBounds[], coverage: MapBounds): MapBounds[] {
  if (!validBounds(coverage) || !areas.length) throw new Error('Whoosh region has no reviewed ride coverage');
  const views = new Map<string, MapBounds>();
  for (const area of areas) {
    if (!validBounds(area)) throw new Error('Invalid Whoosh ride bounds');
    if (outsideCoverage(area, coverage)) continue;
    if (area.south < coverage.south || area.north > coverage.north ||
      area.west < coverage.west || area.east > coverage.east) throw new Error('Whoosh ride area exceeds reviewed coverage');
    // A small margin includes scooters on a ride-area boundary. Do not bridge disjoint polygons.
    const south = Math.max(coverage.south, area.south - 0.0001), north = Math.min(coverage.north, area.north + 0.0001);
    const west = Math.max(coverage.west, area.west - 0.0001), east = Math.min(coverage.east, area.east + 0.0001);
    for (let row = Math.floor(south / VIEW_SPAN); row <= Math.floor(north / VIEW_SPAN); row++) {
      for (let column = Math.floor(west / VIEW_SPAN); column <= Math.floor(east / VIEW_SPAN); column++) {
        const key = `${row}:${column}`;
        views.set(key, { south: Math.max(coverage.south, row * VIEW_SPAN), north: Math.min(coverage.north, (row + 1) * VIEW_SPAN),
          west: Math.max(coverage.west, column * VIEW_SPAN), east: Math.min(coverage.east, (column + 1) * VIEW_SPAN) });
        if (views.size > REQUEST_BUDGET) throw new Error('Whoosh ride coverage exceeds the collection budget');
      }
    }
  }
  const targets = [...views.values()].filter(validBounds);
  if (!targets.length) throw new Error('Whoosh region has no ride area in its reviewed coverage');
  return targets;
}

export function parseWhooshVehicles(payload: unknown): WhooshScooter[] {
  const devices = object(payload)?.devices;
  if (!Array.isArray(devices)) throw new Error('Invalid Whoosh map response');
  const vehicles = new Map<string, WhooshScooter>();
  for (const entry of devices) {
    const device = object(entry);
    if (!device || typeof device.id !== 'string' || !regionId(device.id)) throw new Error('Invalid Whoosh vehicle identity');
    if (typeof device.model !== 'string' || !device.model) throw new Error('Invalid Whoosh vehicle model');
    if (['BIKE', 'NB_A200', 'NB_B100'].includes(device.model)) continue;
    const state = object(device.state);
    if (['UNAVAILABLE', 'RESERVED', 'IN_USE', 'DISABLED', 'OFFLINE'].includes(String(state?.status))) continue;
    const point = object(object(state?.position)?.point);
    if (typeof point?.lat !== 'number' || typeof point.lng !== 'number' || !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng) || Math.abs(point.lat) > 85 || Math.abs(point.lng) > 180) throw new Error('Invalid Whoosh scooter position');
    const battery = object(device.battery), distance = object(battery?.distanceToCharge);
    const power = battery?.power;
    const range = distance?.amount;
    const unit = distance?.unit;
    vehicles.set(device.id, { id: device.id, lat: point.lat, lng: point.lng,
      battery: typeof power === 'number' && Number.isFinite(power) && power >= 0 && power <= 100 ? power : null,
      // The app's amount-unit mapper defaults a missing distance unit to kilometres.
      range: typeof range === 'number' && Number.isFinite(range) && range >= 0 && range <= 200 &&
        (unit === undefined || unit === 'km') ? Math.round(range * 1000) : null });
  }
  return [...vehicles.values()];
}

/** Only the Node cache can read the rider's private session; public catalogs contain region IDs. */
export class WhooshClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private blockedUntil = 0;
  private retryAt = 0;
  private lease?: Lease;
  private renewing?: Promise<Lease>;
  private readonly metadata = new Map<string, Metadata>();
  // How many of each region's ride polygons lie outside its coverage, last time it was swept.
  private readonly outside = new Map<string, number>();
  private readonly loading = new Map<string, Promise<Metadata>>();

  constructor(options: Options = {}) {
    this.sessionPath = options.sessionPath ?? process.env.WHOOSH_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'whoosh-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? 1000, this.now);
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async credentials(): Promise<Credentials> {
    let data: Record<string, unknown> | undefined;
    try {
      const text = await readFile(this.sessionPath, 'utf8');
      if (text.length > 32_768) throw new Error();
      data = object(JSON.parse(text));
    } catch { throw new Error('Whoosh session credentials are missing or unreadable'); }
    if (data?.version !== 1 || !credential(data.refreshToken) || !credential(data.apiKey) ||
      typeof data.clientId !== 'string' || !/^[a-z0-9]{10,128}$/.test(data.clientId) ||
      typeof data.deviceId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(data.deviceId)) throw new Error('Whoosh session credentials are invalid');
    return data as unknown as Credentials;
  }

  private async request(url: string, init: RequestInit, kind: 'status' | 'metadata') {
    if (this.now() < this.blockedUntil) throw new Error('Whoosh is temporarily rate limited');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Whoosh is temporarily rate limited');
    whooshMapRequests[kind]++;
    let response: Response;
    try { response = await this.fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) }); }
    catch { throw new Error('Whoosh request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const milliseconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3600_000, milliseconds || RETRY_MS));
    }
    return response;
  }

  private current(): Promise<Lease> {
    if (this.lease && this.now() < this.lease.expiresAt - 30_000) return Promise.resolve(this.lease);
    if (this.renewing) return this.renewing;
    if (this.now() < this.retryAt) return Promise.reject(new Error('Whoosh authentication is awaiting retry'));
    this.renewing = (async () => {
      try {
        const credentials = await this.credentials();
        const response = await this.request(COGNITO, { method: 'POST', headers: {
          'Content-Type': 'application/x-amz-json-1.1', 'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'User-Agent': 'Whoosh/4.1.0 (com.punicapp.whoosh, build:420790) aws-sdk-android/2.22.5',
        }, body: JSON.stringify({ AuthFlow: 'REFRESH_TOKEN_AUTH', ClientId: credentials.clientId,
          AuthParameters: { REFRESH_TOKEN: credentials.refreshToken } }) }, 'metadata');
        if (!response.ok) { await response.body?.cancel(); throw new Error(`Whoosh session HTTP ${response.status}`); }
        const result = object(object(await jsonBody(response, 32_768))?.AuthenticationResult);
        if (!credential(result?.IdToken) || !credential(result?.AccessToken)) throw new Error('Invalid Whoosh session response');
        let expiry: number;
        try {
          const claims = object(JSON.parse(Buffer.from(result.IdToken.split('.')[1], 'base64url').toString('utf8')));
          if (claims?.aud !== credentials.clientId || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) throw new Error();
          expiry = Math.min(claims.exp * 1000, this.now() + 3600_000);
        } catch { throw new Error('Invalid Whoosh token expiration or audience'); }
        if (expiry <= this.now() + 30_000) throw new Error('Whoosh returned an expired session');
        if (credential(result.RefreshToken) && result.RefreshToken !== credentials.refreshToken) {
          // Preserve a replacement login supplied during this renewal.
          const saved = await this.credentials();
          if (saved.refreshToken === credentials.refreshToken) {
            credentials.refreshToken = result.RefreshToken;
            const directory = join(dirname(this.sessionPath), 'tmp');
            const temporary = join(directory, `whoosh-session-${randomUUID()}.json`);
            try {
              await mkdir(directory, { recursive: true, mode: 0o700 });
              await writeFile(temporary, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
              await rename(temporary, this.sessionPath);
            } catch { throw new Error('Whoosh renewed credentials could not be saved'); }
            finally { await rm(temporary, { force: true }).catch(() => undefined); }
          }
        }
        return this.lease = { idToken: result.IdToken, accessToken: result.AccessToken, expiresAt: expiry, credentials };
      } catch (error) { this.retryAt = this.now() + RETRY_MS; throw error; }
      finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  private async api(path: string, region: string, body?: unknown): Promise<unknown> {
    if (!regionId(region)) throw new Error('Invalid Whoosh map region');
    const get = async (lease: Lease) => this.request(ORIGIN + path, { method: body === undefined ? 'GET' : 'POST', headers: {
      'Content-Type': 'application/json', 'User-Agent': 'Whoosh/4.1.0 (com.punicapp.whoosh, build:420790) okhttp/4.12.0',
      'X-Client': 'android', 'X-Api-Version': '1.0', 'X-Client-Version': '4.1.0',
      'x-client-uuid': lease.credentials.deviceId, 'X-region-id': region, 'X-Api-Key': lease.credentials.apiKey,
      'X-Id-Token': lease.idToken, 'X-Auth-Token': lease.accessToken, 'Accept-Language': 'en-GB',
    }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, body === undefined ? 'metadata' : 'status');
    let lease = await this.current();
    let response = await get(lease);
    if (response.status === 401) {
      await response.body?.cancel();
      if (this.lease === lease) this.lease = undefined;
      lease = await this.current();
      response = await get(lease);
      if (response.status === 401) { this.lease = undefined; this.retryAt = this.now() + RETRY_MS; }
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`Whoosh map HTTP ${response.status}`); }
    return jsonBody(response, 16 * 1024 * 1024);
  }

  private region(region: string): Promise<Metadata> {
    if (!regionId(region)) return Promise.reject(new Error('Invalid Whoosh map region'));
    const saved = this.metadata.get(region);
    if (saved && this.now() < saved.expiresAt) return Promise.resolve(saved);
    const pending = this.loading.get(region);
    if (pending) return pending;
    const loading = (async () => {
      const info = object(object(await this.api(`/regions/location/${region}/info`, region))?.region);
      if (info?.id !== region || typeof info.seasonIsOver !== 'boolean' || info.status !== 'ACTIVE') throw new Error('Invalid Whoosh region metadata');
      const areas = info.seasonIsOver ? [] : parseWhooshRideAreas(await this.api(`/regions/location/${region}/areas`, region));
      if (!info.seasonIsOver && !areas.length) throw new Error('Whoosh region has no ride areas');
      const value = { closed: info.seasonIsOver, areas, expiresAt: this.now() + METADATA_MS };
      this.metadata.set(region, value);
      return value;
    })().finally(() => this.loading.delete(region));
    this.loading.set(region, loading);
    return loading;
  }

  /** Whether the operator says the region's season is over, from its metadata, read once an hour. */
  async seasonOver(region: string): Promise<boolean> {
    return (await this.region(region)).closed;
  }

  /** The views nearest where people look go first (sweeps.ts). */
  async vehicles(region: string, coverage: MapBounds, sweep?: WhooshSweep): Promise<WhooshScooter[]> {
    if (!validBounds(coverage)) throw new Error('Invalid Whoosh map coverage');
    const metadata = await this.region(region);
    if (metadata.closed) return [];
    // Said once, and again when it changes: a new polygon outside the coverage may be the region's own.
    const outside = metadata.areas.filter(area => outsideCoverage(area, coverage)).length;
    if ((this.outside.get(region) ?? 0) !== outside) {
      console.warn(JSON.stringify({ event: 'whoosh_areas_outside_coverage', region, outside, areas: metadata.areas.length }));
    }
    this.outside.set(region, outside);
    const targets = nearestFirst(whooshMapViews(metadata.areas, coverage), view => view);
    const vehicles = sweep?.found ?? new Map<string, WhooshScooter>();
    let requests = 0;
    const collect = async (bounds: MapBounds, depth: number): Promise<void> => {
      if (++requests > REQUEST_BUDGET) throw new Error('Whoosh collection exceeds the request budget');
      const data = await this.api('/client/devices/searches', region, { clientSearchDevicesParams: {
        // These are the app's field names: its upperLeft is southwest, bottomRight northeast.
        visibleArea: { upperLeft: { lat: Number(bounds.south.toFixed(6)), lng: Number(bounds.west.toFixed(6)) },
          bottomRight: { lat: Number(bounds.north.toFixed(6)), lng: Number(bounds.east.toFixed(6)) } },
        regionIds: [region], type: ['scooter'],
      } });
      const devices = object(data)?.devices;
      const parsed = parseWhooshVehicles(data);
      if (!Array.isArray(devices)) throw new Error('Invalid Whoosh map response');
      if (devices.length >= VIEW_LIMIT) {
        if (depth >= 6) throw new Error('Whoosh view remains capped after subdivision');
        const lat = (bounds.south + bounds.north) / 2, lng = (bounds.west + bounds.east) / 2;
        for (const [south, north] of [[bounds.south, lat], [lat, bounds.north]]) {
          for (const [west, east] of [[bounds.west, lng], [lng, bounds.east]]) await collect({ south, north, west, east }, depth + 1);
        }
        return;
      }
      for (const vehicle of parsed) {
        // Like the app, requests round to six decimals; allow that rounding at a shared edge.
        if (!boundsContainPoint({ south: bounds.south - 0.000001, north: bounds.north + 0.000001,
          west: bounds.west - 0.000001, east: bounds.east + 0.000001 }, vehicle.lat, vehicle.lng)) {
          throw new Error('Whoosh scooter is outside its requested view');
        }
        if (boundsContainPoint(coverage, vehicle.lat, vehicle.lng)) vehicles.set(vehicle.id, vehicle);
      }
      sweep?.done(bounds);
    };
    for (const view of targets) await collect(view, 0);
    return [...vehicles.values()];
  }
}

const client = new WhooshClient();
export async function collectWhooshRegion(system: RegionalScooterSystem,
  api: Pick<WhooshClient, 'seasonOver' | 'vehicles'> = client): Promise<SourceVehicles> {
  if (system.provider !== 'whoosh' || !system.whooshAppRegion) throw new Error('Not a Whoosh app map region');
  // A region closed for the season, as Almaty each winter, is paused by its operator until it
  // says the season is open again, on no day it announces (seasonalPauses.ts).
  if (await api.seasonOver(system.whooshAppRegion)) return { observedAt: Date.now(), stale: false, vehicles: [], seasonOver: true };
  const published = (vehicle: WhooshScooter): Vehicle => ({ provider: 'whoosh',
    vehicle_id: `${system.id}:${vehicle.id}`, lat: vehicle.lat, lng: vehicle.lng, battery: vehicle.battery,
    range_m: vehicle.range, deep_link: null, distance_m: null });
  const found = new Map<string, WhooshScooter>();
  const progress = new SweepProgress(() => [...found.values()].map(published));
  const vehicles = await api.vehicles(system.whooshAppRegion, system.bounds, { found, done: view => progress.done(view) });
  return { observedAt: Date.now(), stale: false, vehicles: vehicles.map(published) };
}

export function withWhooshAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.whooshAppRegion).map(system => [system.id, system]));
  return feeds.map(feed => {
    const region = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    // Its client spaces every request, and sweeps take up to three minutes: idle every two hours.
    return region ? { ...feed, idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, paced: true, collect: () => collectWhooshRegion(region) } : feed;
  });
}
