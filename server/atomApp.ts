import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds } from '../src/lib/types';

const ORIGIN = 'https://app.rideatom.com/api/v1/';
const RETRY_MS = 60_000;
export const atomMapRequests = { status: 0, metadata: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const jwt = (value: unknown): value is string => typeof value === 'string' && value.length < 8192 &&
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);

interface Credentials { token: string; appPublicKey: string; staticPublicKey: string; deviceId: string; appVersion: string }
interface Sessions { version: 1; accounts: Record<string, Credentials> }
interface ClientOptions { sessionPath?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('ATOM returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('ATOM response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('ATOM returned invalid JSON'); }
}

/** Public app identifiers and rider tokens stay in the cache's private volume, never the catalog. */
export class AtomClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private nextStart = 0;
  private blockedUntil = 0;
  private readonly renewing = new Map<string, Promise<Credentials>>();
  private readonly rejected = new Map<string, { token: string; until: number }>();
  private saving: Promise<void> = Promise.resolve();

  constructor(options: ClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.ATOM_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'atom-sessions.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    // The rider API rejected a 21st view even with starts 1.1 s apart. Keep all
    // accounts together below 20 requests/minute, including cold starts and refreshes.
    this.intervalMs = options.intervalMs ?? 4000;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  private async sessions(): Promise<Sessions> {
    let data: Record<string, unknown> | undefined;
    try {
      const text = await readFile(this.sessionPath, 'utf8');
      if (text.length > 65_536) throw new Error();
      data = object(JSON.parse(text));
    } catch { throw new Error('ATOM session credentials are missing or unreadable'); }
    if (data?.version !== 1 || !object(data.accounts)) throw new Error('ATOM session credentials are invalid');
    return data as unknown as Sessions;
  }

  private async credentials(account: string): Promise<Credentials> {
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(account)) throw new Error('Invalid ATOM app account');
    const data = object((await this.sessions()).accounts[account]);
    if (!data || !jwt(data.token) || !['appPublicKey', 'staticPublicKey'].every(key =>
      typeof data[key] === 'string' && /^[a-f0-9]{32,128}$/.test(data[key] as string)) ||
      typeof data.deviceId !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(data.deviceId) ||
      typeof data.appVersion !== 'string' || !/^\d+(?:\.\d+){1,3}$/.test(data.appVersion)) {
      throw new Error('ATOM app account credentials are invalid');
    }
    return data as unknown as Credentials;
  }

  private headers(credentials: Credentials): Record<string, string> {
    return { 'App-Public-Key': credentials.appPublicKey, 'Static-App-Public-Key': credentials.staticPublicKey,
      Authorization: `Basic ${Buffer.from(`${credentials.token}:`).toString('base64')}`,
      'app-version': credentials.appVersion, 'device-os': 'ANDROID', 'device-os-version': '15',
      'device-id': credentials.deviceId, Language: 'en', Accept: 'application/json' };
  }

  private async request(path: string, credentials: Credentials, kind: 'status' | 'metadata') {
    if (this.now() < this.blockedUntil) throw new Error('ATOM is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('ATOM is temporarily rate limited');
    atomMapRequests[kind]++;
    let response: Response;
    try {
      response = await this.fetch(ORIGIN + path, { headers: this.headers(credentials),
        redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('ATOM request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const milliseconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 :
        retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, milliseconds || RETRY_MS));
    }
    return response;
  }

  private refresh(account: string, previous: Credentials): Promise<Credentials> {
    const existing = this.renewing.get(account);
    if (existing) return existing;
    const renewing = (async () => {
      const current = await this.credentials(account);
      if (current.token !== previous.token) return current;
      const response = await this.request('user/token/refresh', current, 'metadata');
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`ATOM session HTTP ${response.status}`);
      }
      const data = object(await jsonBody(response, 32_768));
      if (!jwt(data?.token)) throw new Error('ATOM session response is invalid');
      const token = data.token;
      let saved = { ...current, token };
      this.saving = this.saving.catch(() => undefined).then(async () => {
        const sessions = await this.sessions();
        // Preserve a replacement login written by an operator or another account's refresh.
        if (sessions.accounts[account]?.token !== previous.token) {
          saved = await this.credentials(account);
          return;
        }
        sessions.accounts[account] = saved;
        const directory = join(dirname(this.sessionPath), 'tmp');
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const temporary = join(directory, `atom-session-${randomUUID()}.json`);
        try {
          await writeFile(temporary, JSON.stringify(sessions), { mode: 0o600, flag: 'wx' });
          await rename(temporary, this.sessionPath);
        } catch { throw new Error('ATOM renewed credentials could not be saved'); }
        finally { await rm(temporary, { force: true }).catch(() => undefined); }
      });
      await this.saving;
      return saved;
    })().finally(() => this.renewing.delete(account));
    this.renewing.set(account, renewing);
    return renewing;
  }

  async vehicles(account: string, center: readonly [number, number]): Promise<unknown> {
    const [lat, lng] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180) {
      throw new Error('Invalid ATOM map center');
    }
    let credentials = await this.credentials(account);
    const rejected = this.rejected.get(account);
    if (rejected?.token === credentials.token && this.now() < rejected.until) throw new Error('ATOM map authorization was rejected');
    const query = new URLSearchParams({ user_latitude: String(lat), user_longitude: String(lng),
      user_location_timestamp: String(Math.floor(this.now() / 1000)), fleet_id: '0' });
    const path = `user/vehicles?${query}`;
    let response = await this.request(path, credentials, 'status');
    if (response.status === 401) {
      await response.body?.cancel();
      try { credentials = await this.refresh(account, credentials); }
      catch (error) {
        this.rejected.set(account, { token: credentials.token, until: this.now() + RETRY_MS });
        throw error;
      }
      response = await this.request(path, credentials, 'status');
      if (response.status === 401) this.rejected.set(account, { token: credentials.token, until: this.now() + RETRY_MS });
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`ATOM map HTTP ${response.status}`);
    }
    return jsonBody(response, 8 * 1024 * 1024);
  }
}

/** ATOM's native map returns a 2 km circle. A 2.5 km grid keeps even cell corners inside it. */
export function atomMapCenters(bounds: MapBounds): [number, number][] {
  const { south, west, north, east } = bounds;
  if (![south, west, north, east].every(Number.isFinite) || south >= north || west >= east ||
    south < -85 || north > 85 || west < -180 || east > 180) throw new Error('Invalid ATOM map bounds');
  const nearestEquator = south <= 0 && north >= 0 ? 0 : Math.min(Math.abs(south), Math.abs(north));
  const rows = Math.ceil((north - south) * 111_320 / 2500);
  const columns = Math.ceil((east - west) * 111_320 * Math.cos(nearestEquator * Math.PI / 180) / 2500);
  if (rows * columns > 64) throw new Error('ATOM map bounds exceed the collection budget');
  return Array.from({ length: rows * columns }, (_, index) => [
    south + (Math.floor(index / columns) + 0.5) * (north - south) / rows,
    west + (index % columns + 0.5) * (east - west) / columns,
  ]);
}

interface AtomScooter { id: number; lat: number; lng: number; battery: number | null }
interface AtomView { vehicles: AtomScooter[]; unavailable: number[]; closed: boolean }
export function parseAtomVehicles(payload: unknown): AtomView {
  const data = object(payload);
  if (!data || !Array.isArray(data.vehicles) || typeof data.currently_not_operating !== 'boolean' ||
    !Array.isArray(data.active_vehicle_ids) || !Array.isArray(data.hidden_vehicles)) throw new Error('Invalid ATOM map response');
  const unavailable = [...data.active_vehicle_ids, ...data.hidden_vehicles.map(value => object(value)?.id)];
  if (!unavailable.every(id => Number.isSafeInteger(id) && (id as number) > 0)) throw new Error('Invalid ATOM unavailable vehicle');
  const vehicles: AtomScooter[] = [];
  for (const entry of data.vehicles) {
    const vehicle = object(entry);
    if (!vehicle || vehicle.type !== 'SCOOTER' || vehicle.fuel_type !== 'ELECTRIC') continue;
    const location = object(vehicle.coordinates);
    if (!Number.isSafeInteger(vehicle.id) || (vehicle.id as number) <= 0 ||
      typeof location?.latitude !== 'number' || typeof location.longitude !== 'number' ||
      !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) ||
      Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180 || typeof vehicle.is_active_ride !== 'boolean') {
      throw new Error('Invalid ATOM scooter');
    }
    if (vehicle.is_active_ride) { unavailable.push(vehicle.id); continue; }
    const battery = typeof vehicle.battery_level === 'number' && Number.isFinite(vehicle.battery_level) &&
      vehicle.battery_level >= 0 && vehicle.battery_level <= 100 ? vehicle.battery_level : null;
    vehicles.push({ id: vehicle.id as number, lat: location.latitude, lng: location.longitude, battery });
  }
  return { vehicles, unavailable: unavailable as number[], closed: data.currently_not_operating };
}

const client = new AtomClient();
export async function collectAtomRegion(system: RegionalScooterSystem, api: Pick<AtomClient, 'vehicles'> = client): Promise<SourceVehicles> {
  if (!system.atomAppAccount) throw new Error('Not an ATOM app map region');
  const vehicles = new Map<number, AtomScooter>();
  const unavailable = new Set<number>();
  let closed = true;
  const observedAt = Date.now();
  for (const center of atomMapCenters(system.bounds)) {
    const view = parseAtomVehicles(await api.vehicles(system.atomAppAccount, center));
    closed &&= view.closed;
    for (const id of view.unavailable) unavailable.add(id);
    if (!view.closed) for (const vehicle of view.vehicles) vehicles.set(vehicle.id, vehicle);
  }
  // Publish only a complete sweep. A failed view leaves the caller's previous snapshot intact.
  return { observedAt, stale: false, ...(closed ? { skipped: true } : {}),
    vehicles: [...vehicles.values()].filter(vehicle => !unavailable.has(vehicle.id) &&
      boundsContainPoint(system.bounds, vehicle.lat, vehicle.lng)).map(vehicle => ({
      provider: system.provider, vehicle_id: `${system.id}:${vehicle.id}`, lat: vehicle.lat, lng: vehicle.lng,
      battery: vehicle.battery, range_m: null, deep_link: null, distance_m: null,
    })) };
}

export function withAtomAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.atomAppAccount).map(system => [system.id, system]));
  return feeds.map(feed => {
    const region = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return region ? { ...feed, collect: () => collectAtomRegion(region) } : feed;
  });
}
