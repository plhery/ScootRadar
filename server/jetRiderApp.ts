import { createHmac, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint, haversineM } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { Pacer } from './sweeps';

const ORIGIN = 'https://service.jetscooters.fun/gatewayclient';
const MAX_RADIUS_M = 5000;
const SPLIT_AT = 400; // Wide views stop at 500 individual vehicles; leave room below that ceiling.
export const jetRiderMapRequests = { status: 0, metadata: 0 };
const object = (value: unknown): Record<string, unknown> | undefined => value !== null &&
  typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const credential = (value: unknown): value is string => typeof value === 'string' &&
  value.length > 0 && value.length <= 16384 && !/\s/.test(value);
const HEADER_NAMES = new Set(['ur-device-id', 'ur-device-model', 'ur-os', 'ur-platform', 'ur-session',
  'ur-time-zone', 'ur-version', 'ur-client-id', 'ur-brand', 'ur-request-version', 'ur-country-code',
  'ur-carrier-country', 'ur-user-id', 'ur-mobile-store-name', 'user-agent', 'accept-language',
  'environment-info', 'x-appsflyer-id', 'ur-latitude', 'ur-longitude']);
interface Session {
  version: 1; accessToken: string; refreshToken: string; expiresAt: number;
  signingKey: string;
  oauth: { clientId: string; clientSecret: string; scope: string }; headers: Record<string, string>;
}
interface Options { sessionPath?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }
class JetRiderAuthError extends Error { constructor() { super('JET rider session was rejected'); } }

/** Native HashUtil: sorted UR header values, sorted decoded query key/value pairs, then the exact body. */
export function jetRiderRequestHash(headers: Record<string, string>, query: URLSearchParams, body: string, key: string): string {
  const headerValues = Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
    .filter(([name]) => name.startsWith('ur-') && name !== 'ur-request-data')
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([, value]) => value).join('');
  const parameters = [...new Set(query.keys())].sort().map(name => name + query.get(name)).join('');
  return createHmac('sha256', Buffer.from(key, 'base64')).update(headerValues + parameters + body).digest('hex').toUpperCase();
}

async function jsonBody(response: Response, maximum: number): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  const reader = response.body?.getReader();
  if (!reader) throw new Error('JET rider response was empty');
  let bytes = 0;
  try {
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      bytes += next.value.byteLength;
      if (bytes > maximum) throw new Error();
      chunks.push(next.value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error(bytes > maximum ? 'JET rider response exceeds the size limit' : 'JET rider response was interrupted');
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('JET rider response was not JSON'); }
}

/** A circle enclosing the complete box, with a small margin for boundary rounding. */
export function jetRiderCircle(bounds: MapBounds) {
  const { south, north, west, east } = bounds;
  if (![south, north, west, east].every(Number.isFinite) || south >= north || west >= east ||
    south < -85 || north > 85 || west < -180 || east > 180 || north - south > 2 || east - west > 2) {
    throw new Error('Invalid JET rider map bounds');
  }
  const latitude = (south + north) / 2, longitude = (west + east) / 2;
  const radius = Math.ceil(Math.max(...[south, north].flatMap(lat =>
    [west, east].map(lng => haversineM(latitude, longitude, lat, lng))))) + 20;
  return { latitude, longitude, radius };
}

/** JET's separate Central Asian app uses a rider session; Go Jet's signed-out client is unchanged. */
export class JetRiderClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private session?: Session;
  private loading?: Promise<Session>;
  private renewing?: Promise<Session>;
  private blockedUntil = 0;
  private retryAt = 0;

  constructor(options: Options = {}) {
    this.sessionPath = options.sessionPath ?? process.env.JET_RIDER_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'jet-rider-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? 500, this.now, 0, Infinity, { spaced: true });
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  private credentials(): Promise<Session> {
    if (this.session) return Promise.resolve(this.session);
    if (this.loading) return this.loading;
    this.loading = (async () => {
      let data: Record<string, unknown> | undefined;
      try {
        const text = await readFile(this.sessionPath, 'utf8');
        if (text.length > 65536) throw new Error();
        data = object(JSON.parse(text));
      } catch { throw new Error('JET rider credentials are missing or unreadable'); }
      const oauth = object(data?.oauth), inputHeaders = object(data?.headers);
      if (data?.version !== 1 || !credential(data.accessToken) || !credential(data.refreshToken) ||
        typeof data.signingKey !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(data.signingKey) ||
        typeof data.expiresAt !== 'number' || !Number.isSafeInteger(data.expiresAt) || data.expiresAt <= 0 ||
        !credential(oauth?.clientId) || !credential(oauth.clientSecret) || typeof oauth.scope !== 'string' ||
        !/^[\w. -]{1,2048}$/.test(oauth.scope) || !oauth.scope.split(' ').includes('offline_access') || !inputHeaders) {
        throw new Error('JET rider credentials are invalid');
      }
      const headers: Record<string, string> = {};
      for (const [name, value] of Object.entries(inputHeaders)) {
        if (!HEADER_NAMES.has(name.toLowerCase())) continue;
        if (typeof value !== 'string' || value.length > 512 || /[\r\n]/.test(value)) throw new Error('JET rider headers are invalid');
        headers[name.toLowerCase()] = value;
      }
      if (headers['ur-brand'] !== 'JET' || !headers['ur-device-id'] || !headers['ur-client-id']) {
        throw new Error('JET rider device configuration is invalid');
      }
      return this.session = { version: 1, accessToken: data.accessToken, refreshToken: data.refreshToken,
        expiresAt: data.expiresAt, signingKey: data.signingKey,
        oauth: { clientId: oauth.clientId, clientSecret: oauth.clientSecret, scope: oauth.scope }, headers };
    })().finally(() => { this.loading = undefined; });
    return this.loading;
  }

  private async save(session: Session) {
    const directory = join(dirname(this.sessionPath), 'tmp');
    const temporary = join(directory, `jet-rider-${randomUUID()}.json`);
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(temporary, JSON.stringify(session), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('JET rider renewed session could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }

  private async request(path: string, session: Session, deadline: number, body?: URLSearchParams): Promise<unknown> {
    if (this.now() < this.blockedUntil) throw new Error('JET rider requests are temporarily held off');
    if (this.now() + this.pace.wait() >= deadline) throw new Error('JET rider collection timed out');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('JET rider requests are temporarily held off');
    const remaining = deadline - this.now();
    if (remaining <= 0) throw new Error('JET rider collection timed out');
    jetRiderMapRequests[body ? 'metadata' : 'status']++;
    const encodedBody = body?.toString() ?? '';
    const headers: Record<string, string> = { ...session.headers, Authorization: `Bearer ${session.accessToken}`, accept: 'application/json',
      ...body && { 'content-type': 'application/x-www-form-urlencoded' } };
    headers['UR-Request-Data'] = jetRiderRequestHash(headers, new URL(ORIGIN + path).searchParams, encodedBody, session.signingKey);
    let response: Response;
    try {
      response = await this.fetch(ORIGIN + path, { method: body ? 'POST' : 'GET', redirect: 'error',
        headers, body: body ? encodedBody : undefined,
        signal: AbortSignal.timeout(Math.min(this.timeoutMs, remaining)) });
    } catch { throw new Error('JET rider request failed or timed out'); }
    if ([403, 429].includes(response.status)) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : 0;
      this.blockedUntil = this.now() + Math.max(60_000, Math.min(3600_000, delay || 0));
    }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401 && !body) throw new JetRiderAuthError();
      throw new Error(body ? `JET rider renewal HTTP ${response.status}` : `JET rider map HTTP ${response.status}`);
    }
    return jsonBody(response, body ? 65536 : 2 * 1024 * 1024);
  }

  private async current(deadline: number, rejectedToken?: string): Promise<Session> {
    if (this.now() < this.retryAt) throw new Error('JET rider authentication is temporarily unavailable');
    const session = await this.credentials();
    if (session.accessToken !== rejectedToken && session.expiresAt > this.now() + 60_000) return session;
    if (this.renewing) return this.renewing;
    this.renewing = (async () => {
      try {
        const data = object(await this.request('/api/v1/connect/token', session, deadline, new URLSearchParams({
          client_id: session.oauth.clientId, client_secret: session.oauth.clientSecret, scope: session.oauth.scope,
          grant_type: 'refresh_token', refresh_token: session.refreshToken,
        })));
        if (!credential(data?.access_token) || !credential(data.refresh_token) || typeof data.expires_in !== 'number' ||
          !Number.isSafeInteger(data.expires_in) || data.expires_in <= 60 || data.expires_in > 86400) {
          throw new Error('JET rider renewal response is invalid');
        }
        const next: Session = { ...session, accessToken: data.access_token, refreshToken: data.refresh_token,
          expiresAt: this.now() + data.expires_in * 1000 };
        await this.save(next);
        return this.session = next;
      } catch (error) { this.retryAt = this.now() + 60_000; this.session = undefined; throw error; }
      finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  async vehicles(bounds: MapBounds, deadline = this.now() + 90_000): Promise<unknown> {
    const circle = jetRiderCircle(bounds);
    if (circle.radius > MAX_RADIUS_M) throw new Error('JET rider map view is too large');
    const query = new URLSearchParams({ latitude: String(circle.latitude), longitude: String(circle.longitude),
      radiusByMeters: String(circle.radius), zoom: '18', useBluetooth: 'false', includeEmptyParkings: 'false', withEBikes: 'true' });
    let session = await this.current(deadline);
    const read = () => this.request(`/api/v6/transports?${query}`, session, deadline);
    try { return await read(); }
    catch (error) {
      if (!(error instanceof JetRiderAuthError)) throw error;
      session = await this.current(deadline, session.accessToken);
      return read();
    }
  }
}

type JetScooter = Vehicle & { vehicle_id: string };
export function parseJetRiderVehicles(payload: unknown): { count: number; vehicles: JetScooter[] } {
  const data = object(payload), entries = object(data?.entries);
  if (data?.succeeded !== true || !Array.isArray(data.errors) || data.errors.length || !entries ||
    !Array.isArray(entries.transports) || !Array.isArray(entries.parkings)) throw new Error('Invalid JET rider map');
  const vehicles: JetScooter[] = [];
  for (const item of entries.transports) {
    const transport = object(item);
    if (!transport || typeof transport.type !== 'string') throw new Error('Invalid JET rider transport');
    if (!['Scooter', 'EScooter'].includes(transport.type)) continue;
    const point = object(transport.location);
    if (typeof transport.identifier !== 'string' || !/^[A-Za-z0-9._-]{1,128}$/.test(transport.identifier) ||
      typeof point?.lat !== 'number' || typeof point.long !== 'number' || !Number.isFinite(point.lat) || !Number.isFinite(point.long) ||
      Math.abs(point.lat) > 85 || Math.abs(point.long) > 180 || transport.batteryPercent != null &&
      (typeof transport.batteryPercent !== 'number' || !Number.isFinite(transport.batteryPercent) ||
        transport.batteryPercent < 0 || transport.batteryPercent > 100)) throw new Error('Invalid JET rider scooter');
    vehicles.push({ provider: 'jet', vehicle_id: `jet-rider:${transport.identifier}`, lat: point.lat, lng: point.long,
      battery: typeof transport.batteryPercent === 'number' ? Math.round(transport.batteryPercent) : null,
      range_m: null, deep_link: null, distance_m: null });
  }
  // Parking counts are not additional scooter identities: adding them could count a scooter twice.
  return { count: entries.transports.length, vehicles };
}

let defaultClient: JetRiderClient | undefined;
export async function collectJetRiderRegion(system: RegionalScooterSystem,
  client: Pick<JetRiderClient, 'vehicles'> = defaultClient ??= new JetRiderClient()): Promise<SourceVehicles> {
  if (!system.jetRiderAppCity) throw new Error('Not a JET rider map region');
  jetRiderCircle(system.bounds);
  const areas = (system.areas ?? [system]).map(area => area.bounds);
  if (!areas.length || areas.length > 32) throw new Error('Invalid JET rider operating areas');
  for (const area of areas) {
    jetRiderCircle(area);
    if (area.south < system.bounds.south || area.north > system.bounds.north ||
      area.west < system.bounds.west || area.east > system.bounds.east) throw new Error('JET rider area exceeds reviewed bounds');
  }
  const started = Date.now(), deadline = started + 90_000;
  const vehicles = new Map<string, JetScooter>();
  let requests = 0;
  async function tile(bounds: MapBounds, depth = 0): Promise<void> {
    const circle = jetRiderCircle(bounds);
    let batch: ReturnType<typeof parseJetRiderVehicles> | undefined;
    if (circle.radius <= MAX_RADIUS_M) {
      if (++requests > 160 || Date.now() >= deadline) throw new Error('JET rider map exceeds the collection budget');
      batch = parseJetRiderVehicles(await client.vehicles(bounds, deadline));
    }
    if (!batch || batch.count >= SPLIT_AT) {
      if (depth >= 8) throw new Error('JET rider map remains capped in a small view');
      const lat = circle.latitude, lng = circle.longitude;
      for (const part of [{ ...bounds, north: lat, east: lng }, { ...bounds, south: lat, east: lng },
        { ...bounds, north: lat, west: lng }, { ...bounds, south: lat, west: lng }]) await tile(part, depth + 1);
    } else {
      for (const vehicle of batch.vehicles) if (areas.some(area => boundsContainPoint(area, vehicle.lat, vehicle.lng))) vehicles.set(vehicle.vehicle_id, vehicle);
    }
  }
  for (const area of areas) await tile(area);
  return { observedAt: started, stale: false, vehicles: [...vehicles.values()] };
}

export function withJetRiderAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.jetRiderAppCity).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, collect: () => collectJetRiderRegion(system) } : feed;
  });
}
