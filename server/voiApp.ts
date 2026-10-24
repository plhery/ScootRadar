import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';

const ORIGIN = 'https://api.voiapp.io';
const RETRY_MS = 60_000;
export const voiMapRequests = { status: 0, metadata: 0 };
interface Credentials { version: 1; authenticationToken: string; deviceId: string }
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
  if (!reader) throw new Error('Voi returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Voi response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Voi returned invalid JSON'); }
}

/** Rider credentials stay in the cache's private volume; access tokens live only in memory. */
export class VoiClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private lease?: Lease;
  private renewing?: Promise<Lease>;
  private nextStart = 0;
  private blockedUntil = 0;
  private retryAt = 0;
  private failure?: Error;

  constructor(options: ClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.VOI_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'voi-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 500;
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async credentials(): Promise<Credentials> {
    let data: Record<string, unknown> | undefined;
    try { data = object(JSON.parse(await readFile(this.sessionPath, 'utf8'))); }
    catch { throw new Error('Voi session credentials are missing or unreadable'); }
    if (data?.version !== 1 || !jwt(data.authenticationToken) || typeof data.deviceId !== 'string' ||
      !/^[A-Za-z0-9_-]{8,128}$/.test(data.deviceId)) throw new Error('Voi session credentials are invalid');
    return { version: 1, authenticationToken: data.authenticationToken, deviceId: data.deviceId };
  }

  private async save(credentials: Credentials) {
    const directory = join(dirname(this.sessionPath), 'tmp');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = join(directory, `voi-session-${randomUUID()}.json`);
    try {
      await writeFile(temporary, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('Voi renewed credentials could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }

  private headers(deviceId: string): Record<string, string> {
    return { 'X-App-Version': '3.360.0', 'X-App-Name': 'Rider', 'X-OS': 'Android', 'X-OS-Version': '35',
      'X-Device-Id': deviceId, model: 'sdk_gphone64_arm64', brand: 'google', manufacturer: 'Google',
      'User-Agent': 'okhttp/4.12.0', Accept: 'application/json', 'Content-Type': 'application/json' };
  }

  private async request(path: string, init: RequestInit, kind: 'status' | 'metadata') {
    if (this.now() < this.blockedUntil) throw new Error('Voi is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('Voi is temporarily rate limited');
    voiMapRequests[kind]++;
    let response: Response;
    try {
      response = await this.fetch(ORIGIN + path, { ...init, redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('Voi request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const milliseconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 :
        retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, milliseconds || RETRY_MS));
    }
    return response;
  }

  private current(): Promise<Lease> {
    if (this.lease && this.now() < this.lease.expiresAt - 30_000) return Promise.resolve(this.lease);
    if (this.renewing) return this.renewing;
    if (this.now() < this.retryAt) return Promise.reject(this.failure);
    this.renewing = (async () => {
      try {
        // Reload the seed so an operator can replace an expired login without a restart.
        const credentials = await this.credentials();
        const response = await this.request('/v1/auth/session', { method: 'POST', headers: this.headers(credentials.deviceId),
          body: JSON.stringify({ authenticationToken: credentials.authenticationToken }) }, 'metadata');
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`Voi session HTTP ${response.status}`);
        }
        const data = object(await jsonBody(response, 32_768));
        if (!data || !jwt(data.accessToken) || !jwt(data.authenticationToken)) throw new Error('Voi session response is invalid');
        let expiresAt: number;
        try {
          const claims = JSON.parse(Buffer.from(data.accessToken.split('.')[1], 'base64url').toString('utf8'));
          if (typeof claims.exp !== 'number' || !Number.isFinite(claims.exp)) throw new Error();
          expiresAt = Math.min(claims.exp * 1000, this.now() + 15 * 60_000);
        } catch { throw new Error('Voi access token expiration is invalid'); }
        if (expiresAt <= this.now() + 30_000) throw new Error('Voi returned an expired access token');
        if (data.authenticationToken !== credentials.authenticationToken) {
          await this.save({ ...credentials, authenticationToken: data.authenticationToken });
        }
        this.failure = undefined;
        return this.lease = { value: data.accessToken, expiresAt, deviceId: credentials.deviceId };
      } catch (error) {
        this.failure = error instanceof Error ? error : new Error('Voi authentication failed');
        this.retryAt = this.now() + RETRY_MS;
        throw this.failure;
      } finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  async vehicles(zoneId: string): Promise<unknown> {
    if (!/^\d{1,8}$/.test(zoneId)) throw new Error('Invalid Voi map region');
    const path = `/v2/rides/vehicles?zone_id=${zoneId}&include_suggestion=false`;
    let lease = await this.current();
    let response = await this.request(path, { headers: { ...this.headers(lease.deviceId), 'X-Access-Token': lease.value } }, 'status');
    if (response.status === 401) {
      await response.body?.cancel();
      // Another request may already have replaced this rejected token.
      if (this.lease?.value === lease.value) this.lease = undefined;
      lease = await this.current();
      response = await this.request(path, { headers: { ...this.headers(lease.deviceId), 'X-Access-Token': lease.value } }, 'status');
      if (response.status === 401) {
        this.lease = undefined;
        this.failure = new Error('Voi map authorization was rejected');
        this.retryAt = this.now() + RETRY_MS;
      }
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Voi map HTTP ${response.status}`);
    }
    return jsonBody(response, 16 * 1024 * 1024);
  }
}

interface VoiScooter { id: string; lat: number; lng: number; battery: number | null }
export function parseVoiVehicles(payload: unknown, zoneId: string): VoiScooter[] {
  const groups = object(object(payload)?.data)?.vehicle_groups;
  if (!Array.isArray(groups)) throw new Error('Invalid Voi map response');
  const vehicles = new Map<string, VoiScooter>();
  for (const group of groups) {
    const entries = object(group)?.vehicles;
    if (!Array.isArray(entries)) throw new Error('Invalid Voi vehicle group');
    for (const entry of entries) {
      const vehicle = object(entry);
      if (!vehicle || typeof vehicle.category !== 'string') throw new Error('Invalid Voi vehicle');
      if (vehicle.category !== 'scooter') continue;
      if (String(vehicle.zone_id) !== zoneId) throw new Error('Voi map does not match its requested region');
      const location = object(vehicle.location);
      if (typeof vehicle.id !== 'string' || !vehicle.id || typeof location?.lat !== 'number' ||
        typeof location.lng !== 'number' || !Number.isFinite(location.lat) || !Number.isFinite(location.lng) ||
        Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180) throw new Error('Invalid Voi scooter');
      const battery = typeof vehicle.battery === 'number' && Number.isFinite(vehicle.battery) &&
        vehicle.battery >= 0 && vehicle.battery <= 100 ? vehicle.battery : null;
      vehicles.set(vehicle.id, { id: vehicle.id, lat: location.lat, lng: location.lng, battery });
    }
  }
  return [...vehicles.values()];
}

const client = new VoiClient();
export async function collectVoiRegion(system: RegionalScooterSystem, api: Pick<VoiClient, 'vehicles'> = client): Promise<SourceVehicles> {
  if (!system.voiAppZone || system.provider !== 'voi') throw new Error('Not a Voi app map region');
  const vehicles = parseVoiVehicles(await api.vehicles(system.voiAppZone), system.voiAppZone);
  return { observedAt: Date.now(), stale: false,
    vehicles: vehicles.filter(vehicle => boundsContainPoint(system.bounds, vehicle.lat, vehicle.lng)).map(vehicle => ({
      provider: 'voi', vehicle_id: `${system.id}:${vehicle.id}`, lat: vehicle.lat, lng: vehicle.lng,
      battery: vehicle.battery, range_m: null, deep_link: null, distance_m: null,
    })) };
}

export function withVoiAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.voiAppZone).map(system => [system.id, system]));
  return feeds.map(feed => {
    const region = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return region ? { ...feed, collect: () => collectVoiRegion(region) } : feed;
  });
}
