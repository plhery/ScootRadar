import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';

const MAP_URL = 'https://user.live.boltsvc.net/micromobility/search/getVehicles/v2';
const AUTH_URL = 'https://node.bolt.eu/user-auth/profile/auth/getAccessToken';
const RETRY_MS = 60_000;
/** The view the app sends around a point: any view inside a market returns all of its vehicles. */
const VIEW_DEGREES = 0.005;
export const boltMapRequests = { status: 0, metadata: 0 };
interface Credentials { version: 1; refreshToken: string; deviceId: string }
interface Lease { value: string; expiresAt: number; deviceId: string }
interface ClientOptions {
  sessionPath?: string;
  fetch?: typeof fetch;
  now?: () => number;
  intervalMs?: number;
  timeoutMs?: number;
}
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const jwt = (value: unknown): value is string => typeof value === 'string' && value.length < 8192 &&
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Bolt returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Bolt response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Bolt returned invalid JSON'); }
}

/** The refresh token stays in the cache's private volume; access tokens live only in memory. */
export class BoltClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  // One app session per process, as the app keeps one while it runs.
  private readonly sessionId = randomUUID();
  private lease?: Lease;
  private renewing?: Promise<Lease>;
  private nextStart = 0;
  private blockedUntil = 0;
  private retryAt = 0;
  private failure?: Error;

  constructor(options: ClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.BOLT_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'bolt-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 500;
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async credentials(): Promise<Credentials> {
    let data: Record<string, unknown> | undefined;
    try {
      const text = await readFile(this.sessionPath, 'utf8');
      if (text.length > 32_768) throw new Error();
      data = object(JSON.parse(text));
    } catch { throw new Error('Bolt session credentials are missing or unreadable'); }
    if (data?.version !== 1 || !jwt(data.refreshToken) || typeof data.deviceId !== 'string' ||
      !/^[A-Za-z0-9-]{8,64}$/.test(data.deviceId)) throw new Error('Bolt session credentials are invalid');
    return { version: 1, refreshToken: data.refreshToken, deviceId: data.deviceId };
  }

  private async save(credentials: Credentials) {
    const directory = join(dirname(this.sessionPath), 'tmp');
    const temporary = join(directory, `bolt-session-${randomUUID()}.json`);
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(temporary, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('Bolt renewed credentials could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }

  /** The Android app's own query: its version, device and, for the map, the point it looks from. */
  private params(deviceId: string, country: string, point?: readonly number[]) {
    return new URLSearchParams({ version: 'CA.230.0', deviceId, device_name: 'Google sdk_gphone64_arm64',
      device_os_version: '15', channel: 'googleplay', brand: 'bolt', deviceType: 'android', country, language: 'en',
      ...(point ? { theme: 'light', gps_lat: String(point[0]), gps_lng: String(point[1]), gps_accuracy_m: '10', gps_age: '0',
        is_local_authentication_available: 'false', session_id: this.sessionId } : {}) });
  }

  private async request(url: string, init: RequestInit, kind: 'status' | 'metadata') {
    if (this.now() < this.blockedUntil) throw new Error('Bolt is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('Bolt is temporarily rate limited');
    boltMapRequests[kind]++;
    let response: Response;
    try {
      response = await this.fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('Bolt request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const milliseconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 :
        retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, milliseconds || RETRY_MS));
    }
    return response;
  }

  private current(country: string): Promise<Lease> {
    if (this.lease && this.now() < this.lease.expiresAt - 60_000) return Promise.resolve(this.lease);
    if (this.renewing) return this.renewing;
    if (this.now() < this.retryAt) return Promise.reject(this.failure);
    this.renewing = (async () => {
      try {
        // Reload the seed so an operator can replace a revoked login without a restart.
        const credentials = await this.credentials();
        const response = await this.request(`${AUTH_URL}?${this.params(credentials.deviceId, country)}`, { method: 'POST',
          headers: { Authorization: `Bearer ${credentials.refreshToken}`, 'User-Agent': 'okhttp/4.12.0', Accept: 'application/json' } }, 'metadata');
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`Bolt session HTTP ${response.status}`);
        }
        const body = object(await jsonBody(response, 32_768));
        const data = object(body?.data);
        if (body?.code !== 0 || !data || !jwt(data.access_token) || typeof data.expires_timestamp !== 'number' ||
          !Number.isFinite(data.expires_timestamp)) throw new Error('Bolt session response is invalid');
        // Renew when the app would: next_update_in_seconds, a minute before the token expires.
        const update = typeof data.next_update_in_seconds === 'number' && data.next_update_in_seconds > 0
          ? this.now() + data.next_update_in_seconds * 1000 : Infinity;
        const expiresAt = Math.min(data.expires_timestamp * 1000, update + 60_000);
        if (expiresAt <= this.now() + 90_000) throw new Error('Bolt returned an expired access token');
        if (data.refresh_token !== undefined) {
          if (!jwt(data.refresh_token)) throw new Error('Bolt session response is invalid');
          if (data.refresh_token !== credentials.refreshToken) await this.save({ ...credentials, refreshToken: data.refresh_token });
        }
        this.failure = undefined;
        return this.lease = { value: data.access_token, expiresAt, deviceId: credentials.deviceId };
      } catch (error) {
        this.failure = error instanceof Error ? error : new Error('Bolt authentication failed');
        this.retryAt = this.now() + RETRY_MS;
        throw this.failure;
      } finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  /** Every vehicle of the market whose area holds `point`, which a small view around it selects. */
  async vehicles(point: readonly number[], country: string): Promise<unknown> {
    if (point.length !== 2 || !point.every(Number.isFinite) || Math.abs(point[0]) > 85 || Math.abs(point[1]) > 180 ||
      !/^[a-z]{2}$/.test(country)) throw new Error('Invalid Bolt map request');
    const [lat, lng] = point, d = VIEW_DEGREES;
    const body = JSON.stringify({ viewport: { top_right: { lat: lat + d, lng: lng + d }, top_left: { lat: lat + d, lng: lng - d },
      bottom_right: { lat: lat - d, lng: lng + d }, bottom_left: { lat: lat - d, lng: lng - d } }, should_include_style_config: false });
    const read = (lease: Lease) => this.request(`${MAP_URL}?${this.params(lease.deviceId, country, point)}`, { method: 'POST',
      headers: { Authorization: `Bearer ${lease.value}`, 'Content-Type': 'application/json; charset=UTF-8',
        'User-Agent': 'okhttp/4.12.0', Accept: 'application/json' }, body }, 'status');
    let lease = await this.current(country);
    let response = await read(lease);
    if (response.status === 401) {
      await response.body?.cancel();
      // Another request may already have replaced this rejected token.
      if (this.lease?.value === lease.value) this.lease = undefined;
      lease = await this.current(country);
      response = await read(lease);
      if (response.status === 401) {
        this.lease = undefined;
        this.failure = new Error('Bolt map authorization was rejected');
        this.retryAt = this.now() + RETRY_MS;
      }
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Bolt map HTTP ${response.status}`);
    }
    return jsonBody(response, 16 * 1024 * 1024);
  }
}

type BoltScooter = Vehicle & { vehicle_id: string };
/**
 * The market's standing scooters inside the system's bounds. Each market has its own vehicle
 * categories, so one of the system's must answer, or the view landed in another market.
 */
export function parseBoltVehicles(payload: unknown, system: RegionalScooterSystem): BoltScooter[] {
  const body = object(payload);
  const categories = object(body?.data)?.categories;
  if (body?.code !== 0 || !Array.isArray(categories) || categories.length > 256) throw new Error('Invalid Bolt map response');
  const known = new Set(system.boltAppCategories);
  let market = false;
  const vehicles = new Map<string, BoltScooter>();
  for (const entry of categories) {
    const category = object(entry);
    const markers = category?.markers_on_map;
    if (typeof category?.id !== 'string' || !Array.isArray(markers)) throw new Error('Invalid Bolt vehicle category');
    if (known.has(category.id)) market = true;
    for (const item of markers) {
      const vehicle = object(object(item)?.vehicle);
      if (!vehicle || typeof vehicle.vehicle_type !== 'string') throw new Error('Invalid Bolt vehicle');
      // scooter_<category>, beside ebike_, cargo_ebike_ and mechanical_bike_ ones.
      if (!/^scooter_\d+$/.test(vehicle.vehicle_type)) continue;
      const location = object(vehicle.location);
      const id = typeof vehicle.id === 'number' && Number.isSafeInteger(vehicle.id) ? String(vehicle.id) : vehicle.id;
      if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id) || typeof location?.lat !== 'number' ||
        typeof location.lng !== 'number' || !Number.isFinite(location.lat) || !Number.isFinite(location.lng) ||
        Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) throw new Error('Invalid Bolt scooter');
      if (!boundsContainPoint(system.bounds, location.lat, location.lng)) continue;
      const battery = vehicle.hide_battery_charge !== true && typeof vehicle.charge === 'number' &&
        Number.isFinite(vehicle.charge) && vehicle.charge >= 0 && vehicle.charge <= 100 ? vehicle.charge : null;
      const vehicleId = `${system.id}:${id}`;
      vehicles.set(vehicleId, { provider: 'bolt', vehicle_id: vehicleId, lat: location.lat, lng: location.lng,
        battery, range_m: null, deep_link: null, distance_m: null });
    }
  }
  if (!market) throw new Error('Bolt map returned another market');
  return [...vehicles.values()];
}

let defaultClient: BoltClient | undefined;
export async function collectBoltRegion(system: RegionalScooterSystem,
  api: Pick<BoltClient, 'vehicles'> = defaultClient ??= new BoltClient()): Promise<SourceVehicles> {
  if (!system.boltAppCity || system.provider !== 'bolt' || !system.boltAppCategories?.length) throw new Error('Not a Bolt app map region');
  const observedAt = Date.now();
  const vehicles = parseBoltVehicles(await api.vehicles(system.center, system.country.toLowerCase()), system);
  return { observedAt, stale: false, vehicles };
}

export function withBoltAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.boltAppCity).map(system => [system.id, system]));
  return feeds.map(feed => {
    const region = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return region ? { ...feed, collect: () => collectBoltRegion(region) } : feed;
  });
}
