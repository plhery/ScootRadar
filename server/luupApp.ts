import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint, haversineM } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';

const ORIGIN = 'https://asia-northeast1-luup-prod.cloudfunctions.net';
const RETRY_MS = 60_000;
// Tokyo's port read, the whole city in one circle, takes 25 to 30 s from Netcup: in the three hours to 04:30
// Japan time on 30 October 2026, 21 of its 28 ran past a 30 s limit and Shibuya expired (SCOOTRADAR-CACHE-5Y).
const READ_TIMEOUT_MS = 90_000;
export const luupMapRequests = { status: 0, metadata: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const credential = (value: unknown): value is string => typeof value === 'string' &&
  value.length > 0 && value.length < 8192 && !/\s/.test(value);
interface Options { apiKey?: string; refreshToken?: string; sessionPath?: string; fetch?: typeof fetch;
  now?: () => number; intervalMs?: number; timeoutMs?: number; readTimeoutMs?: number }
interface Lease { token: string; expiresAt: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('LUUP returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('LUUP response exceeds the size limit');
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error(size > maxBytes ? 'LUUP response exceeds the size limit' : 'LUUP response could not be read');
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('LUUP returned invalid JSON'); }
}

/** Secrets enter through the cache's runtime environment; renewed tokens stay in its private volume. */
export class LuupClient {
  private readonly apiKey: string | undefined;
  private readonly seed: string | undefined;
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private readonly readTimeoutMs: number;
  private refreshToken?: string;
  private lease?: Lease;
  private renewing?: Promise<Lease>;
  private nextStart = 0;
  private blockedUntil = 0;
  private retryAt = 0;

  constructor(options: Options = {}) {
    this.apiKey = options.apiKey ?? process.env.LUUP_FIREBASE_API_KEY;
    this.seed = options.refreshToken ?? process.env.LUUP_REFRESH_TOKEN;
    this.sessionPath = options.sessionPath ?? process.env.LUUP_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'luup-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 1000;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.readTimeoutMs = options.readTimeoutMs ?? READ_TIMEOUT_MS;
  }

  private async savedToken(): Promise<string> {
    if (!credential(this.seed) || !credential(this.apiKey)) throw new Error('LUUP runtime credentials are missing or invalid');
    if (this.refreshToken) return this.refreshToken;
    let saved: Record<string, unknown> | undefined;
    try {
      const text = await readFile(this.sessionPath, 'utf8');
      if (text.length > 16_384) throw new Error();
      saved = object(JSON.parse(text));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw new Error('LUUP saved session is unreadable');
    }
    const seedHash = createHash('sha256').update(this.seed).digest('hex');
    if (saved?.seedHash === seedHash) {
      if (saved.version !== 1 || !credential(saved.refreshToken)) throw new Error('LUUP saved session is invalid');
      return this.refreshToken = saved.refreshToken;
    }
    // A replacement runtime secret supersedes a previous login's saved rotation.
    return this.refreshToken = this.seed;
  }

  private async save(token: string) {
    const directory = join(dirname(this.sessionPath), 'tmp');
    const temporary = join(directory, `luup-session-${randomUUID()}.json`);
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(temporary, JSON.stringify({ version: 1,
        seedHash: createHash('sha256').update(this.seed!).digest('hex'), refreshToken: token }), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('LUUP renewed credentials could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }

  private async request(url: string, init: RequestInit, kind: 'status' | 'metadata', timeoutMs = this.timeoutMs) {
    if (this.now() < this.blockedUntil) throw new Error('LUUP is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('LUUP is temporarily rate limited');
    luupMapRequests[kind]++;
    let response: Response;
    try { response = await this.fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(timeoutMs) }); }
    catch { throw new Error('LUUP request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    return response;
  }

  private current(): Promise<Lease> {
    if (this.now() < this.retryAt) return Promise.reject(new Error('LUUP authentication is temporarily unavailable'));
    if (this.lease && this.now() < this.lease.expiresAt - 60_000) return Promise.resolve(this.lease);
    if (this.renewing) return this.renewing;
    this.renewing = (async () => {
      try {
        const token = await this.savedToken();
        const response = await this.request(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(this.apiKey!)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token }) }, 'metadata');
        if (!response.ok) {
          await response.body?.cancel();
          throw new Error(`LUUP session HTTP ${response.status}`);
        }
        const data = object(await jsonBody(response, 32_768));
        let expiresAt: number;
        try {
          if (!credential(data?.id_token) || !credential(data.refresh_token) || data.token_type !== 'Bearer') throw new Error();
          const claims = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64url').toString('utf8'));
          const lifetime = Number(data.expires_in);
          if (claims.aud !== 'luup-prod' || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) ||
            !Number.isFinite(lifetime) || lifetime <= 60) throw new Error();
          expiresAt = Math.min(claims.exp * 1000, this.now() + Math.min(lifetime, 3600) * 1000);
          if (expiresAt <= this.now() + 60_000) throw new Error();
        } catch { throw new Error('LUUP session response is invalid'); }
        if (data!.refresh_token !== token) await this.save(data!.refresh_token as string);
        this.refreshToken = data!.refresh_token as string;
        return this.lease = { token: data!.id_token as string, expiresAt };
      } catch (error) { this.retryAt = this.now() + RETRY_MS; throw error; }
      finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  async ports(bounds: MapBounds): Promise<unknown> {
    const query = luupMapQuery(bounds);
    const url = `${ORIGIN}/mobileApiDBReader-ports/by-location?${query}`;
    let lease = await this.current();
    const read = () => this.request(url, { headers: { Authorization: `Bearer ${lease.token}` } }, 'status', this.readTimeoutMs);
    let response = await read();
    if (response.status === 401 || response.status === 403) {
      await response.body?.cancel();
      if (this.lease?.token === lease.token) this.lease = undefined;
      lease = await this.current();
      response = await read();
      if (response.status === 401 || response.status === 403) { this.lease = undefined; this.retryAt = this.now() + RETRY_MS; }
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`LUUP port reader HTTP ${response.status}`); }
    return jsonBody(response, 32 * 1024 * 1024);
  }
}

export function luupMapQuery(bounds: MapBounds) {
  const { south, north, west, east } = bounds;
  if (![south, north, west, east].every(Number.isFinite) || south >= north || west >= east ||
    south < 24 || north > 46 || west < 122 || east > 146) throw new Error('Invalid LUUP map bounds');
  const lat = (south + north) / 2, lng = (west + east) / 2;
  const radius = Math.ceil(Math.max(...[south, north].flatMap(a => [west, east].map(b => haversineM(lat, lng, a, b))))) + 100;
  if (radius > 100_000) throw new Error('LUUP map exceeds the collection budget');
  return new URLSearchParams({ lat: String(lat), lng: String(lng), radiusInMeter: String(radius) });
}

function portOpen(port: Record<string, unknown>, now: number): boolean {
  if (port.openAt == null && port.closeAt == null) return true;
  const opens = object(port.openAt), closes = object(port.closeAt);
  if (!opens || !closes) throw new Error('Invalid LUUP port hours');
  const local = new Date(now + 9 * 3_600_000);
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][local.getUTCDay()];
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const allowed = (key: string) => {
    const start = opens[key], end = closes[key];
    if (start == null || end == null) return false;
    if (typeof start !== 'string' || typeof end !== 'string' ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(start) || !/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/.test(end)) {
      throw new Error('Invalid LUUP port hours');
    }
    const a = Number(start.slice(0, 2)) * 60 + Number(start.slice(3));
    let b = Number(end.slice(0, 2)) * 60 + Number(end.slice(3));
    if (b === 0) b = 1440;
    // Hide ambiguous overnight schedules until yesterday's/holiday rules are known.
    return a <= minutes && minutes < b;
  };
  // Without a holiday calendar, retain only the intersection of weekday and holiday hours.
  return allowed(day) && (opens.Hol == null && closes.Hol == null || allowed('Hol'));
}

export function parseLuupPorts(payload: unknown, system: RegionalScooterSystem, now = Date.now()): Vehicle[] {
  if (!Array.isArray(payload) || payload.length > 50_000) throw new Error('Invalid LUUP port response');
  const ports = new Map<string, Vehicle[]>();
  for (const entry of payload) {
    const port = object(entry);
    if (!port || typeof port.cityId !== 'string') throw new Error('Invalid LUUP port');
    if (!system.luupAppCities?.includes(port.cityId)) continue;
    const location = object(port.location);
    const count = port.availableKickboardCount;
    if (typeof port.portId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(port.portId) ||
      typeof port.isAvailable !== 'boolean' || typeof location?.latitude !== 'number' || typeof location.longitude !== 'number' ||
      !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) ||
      location.latitude < 24 || location.latitude > 46 || location.longitude < 122 || location.longitude > 146 ||
      !Number.isSafeInteger(count) || (count as number) < 0 || (count as number) > 500) throw new Error('Invalid LUUP port');
    const available = port.isAvailable && portOpen(port, now) && boundsContainPoint(system.bounds, location.latitude, location.longitude);
    ports.set(port.portId, available ? Array.from({ length: count as number }, (_, index) => ({
      provider: 'luup', vehicle_id: `${system.id}:station:${port.portId}:${index + 1}`,
      lat: location.latitude as number, lng: location.longitude as number,
      battery: null, range_m: null, deep_link: null, distance_m: null,
    })) : []);
  }
  return [...ports.values()].flat();
}

const client = new LuupClient();
export async function collectLuupRegion(system: RegionalScooterSystem, api: Pick<LuupClient, 'ports'> = client): Promise<SourceVehicles> {
  if (!system.luupAppCities?.length) throw new Error('Not a LUUP app map region');
  const payload = await api.ports(system.bounds);
  const observedAt = Date.now();
  return { observedAt, stale: false, vehicles: parseLuupPorts(payload, system, observedAt) };
}

export function withLuupAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.luupAppCities).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, collect: () => collectLuupRegion(system) } : feed;
  });
}
