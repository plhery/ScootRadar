import { createHmac, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { boundsContainPoint, haversineM } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, RidePricing, Vehicle } from '../src/lib/types';
import { APP_MAP_WIDE_INTERVAL_MS } from './appMapCadence';
import { Pacer } from './sweeps';

const ORIGIN = 'https://service.jetscooters.fun/gatewayclient';
const MAX_RADIUS_M = 5000;
const SPLIT_AT = 400; // Wide views stop at 500 individual vehicles; leave room below that ceiling.
const PARKING_LIST_CAP = 149; // A map view lists 149 parkings at most.
// A polygon's reply stops at 250 scooters, and before that leaves out some of a full box's: one in
// Tbilisi listed 206 of the 319 its sixteenths did on 23 November 2026. Boxes the map counts at 150 or
// fewer read Tashkent in 59 polygons and Tbilisi in 44 that day; at 250, more replies fell short and
// were split, and it took 65 and 53.
const POLYGON_TARGET = 150;
const POLYGON_MARGIN_M = 60;
const MIN_POLYGON_RADIUS_M = 100;
const MAX_REQUESTS = 300;
const MAX_PARKING_READS = 40;
const COLLECTION_MS = 150_000;
const SCOOTER_TYPES = new Set(['Scooter', 'EScooter']);
const HIREABLE_STATES = new Set(['Available', 'AvailableWithoutGps']);
const PARKING_ID = /^[A-Za-z0-9_-]{1,64}$/;
const MODEL_NAME = /^[\p{L}\p{N} ._+()-]{1,64}$/u;
// A scooter's price depends on its city and model: on 23 November 2026, in Tashkent, a Ninebot Max Plus cost
// 990 soʻm to start and 990 a minute, an SL 90 1,990 and 1,190, the same at four places across the city; in
// Tbilisi a Max Plus or Max Pro 1 ₾ and 0.32, an L 60L or Max S100 1 ₾ and 0.40. One scooter of each model is
// read about hourly, and its price is shown for six hours at most when it can't be read again, or its card gives none.
const PRICE_REFRESH_MS = 60 * 60_000;
const PRICE_KEPT_MS = 6 * 60 * 60_000;
const MAX_PRICE_READS = 6;
const CURRENCIES: Record<string, string> = { GE: 'GEL', UZ: 'UZS' };
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

  /** A map read (GET, or a JSON body) or the session's renewal (a form). */
  private async request(path: string, session: Session, deadline: number, body?: URLSearchParams | { json: string }): Promise<unknown> {
    if (this.now() < this.blockedUntil) throw new Error('JET rider requests are temporarily held off');
    if (this.now() + this.pace.wait() >= deadline) throw new Error('JET rider collection timed out');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('JET rider requests are temporarily held off');
    const remaining = deadline - this.now();
    if (remaining <= 0) throw new Error('JET rider collection timed out');
    const renewal = body instanceof URLSearchParams;
    jetRiderMapRequests[renewal ? 'metadata' : 'status']++;
    const encodedBody = body === undefined ? '' : renewal ? body.toString() : body.json;
    const headers: Record<string, string> = { ...session.headers, Authorization: `Bearer ${session.accessToken}`, accept: 'application/json',
      ...body && { 'content-type': renewal ? 'application/x-www-form-urlencoded' : 'application/json' } };
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
      if (response.status === 401 && !renewal) throw new JetRiderAuthError();
      throw new Error(renewal ? `JET rider renewal HTTP ${response.status}` : `JET rider map HTTP ${response.status}`);
    }
    return jsonBody(response, renewal ? 65536 : 2 * 1024 * 1024);
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

  /** One read with the current session, renewed and retried once if JET rejects its access token. */
  private async read(path: string, deadline: number, json?: string): Promise<unknown> {
    let session = await this.current(deadline);
    const read = () => this.request(path, session, deadline, json === undefined ? undefined : { json });
    try { return await read(); }
    catch (error) {
      if (!(error instanceof JetRiderAuthError)) throw error;
      session = await this.current(deadline, session.accessToken);
      return read();
    }
  }

  /** The map: loose scooters one by one, and each parking with only a count of the scooters in it. */
  async vehicles(bounds: MapBounds, deadline = this.now() + 90_000): Promise<unknown> {
    const circle = jetRiderCircle(bounds);
    if (circle.radius > MAX_RADIUS_M) throw new Error('JET rider map view is too large');
    const query = new URLSearchParams({ latitude: String(circle.latitude), longitude: String(circle.longitude),
      radiusByMeters: String(circle.radius), zoom: '18', useBluetooth: 'false', includeEmptyParkings: 'false', withEBikes: 'true' });
    return this.read(`/api/v6/transports?${query}`, deadline);
  }

  /** Every scooter in a box, parked ones included, with its range; a full box's reply leaves some out (collectJetRiderRegion). */
  async polygon(bounds: MapBounds, deadline = this.now() + 90_000): Promise<unknown> {
    if (jetRiderCircle(bounds).radius > MAX_RADIUS_M) throw new Error('JET rider map view is too large');
    const { south, north, west, east } = bounds;
    const polygon = [[south, west], [south, east], [north, east], [north, west], [south, west]].map(([lat, long]) => ({ lat, long }));
    return this.read('/api/v6/transports/polygon', deadline, JSON.stringify({ polygon, withEBikes: true }));
  }

  /** The scooters standing in one parking. */
  async parking(id: string, deadline = this.now() + 90_000): Promise<unknown> {
    if (!PARKING_ID.test(id)) throw new Error('Invalid JET rider parking');
    return this.read(`/api/v1/parkings/${id}`, deadline);
  }

  /** One scooter's card, with its price: the read the app makes for a scooter its link or QR code opens. */
  async transport(identifier: string, deadline = this.now() + 90_000): Promise<unknown> {
    if (!transportId(identifier)) throw new Error('Invalid JET rider scooter');
    return this.read(`/api/v3/transports/${identifier}`, deadline);
  }
}

type JetScooter = Vehicle & { vehicle_id: string };
/** A parking on the map, with the number of scooters standing in it, which the map does not list. */
export interface JetRiderParking { id: string; lat: number; lng: number; count: number }
/** A scooter of a polygon or a parking, the parking it stands in, and its model. */
export interface JetRiderTransport { vehicle: JetScooter; parkingId?: string; model?: string }

const transportId = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9._-]{1,128}$/.test(value);
/**
 * The link on the scooter's QR code, which JET's app claims on iPhones and Android (ure.su's
 * apple-app-site-association and assetlinks.json, 23 November 2026) and opens on that scooter; without the
 * app, the page sends a phone to the app's store. It names the scooter by the number it carries, as Yoio's do.
 */
const rentalUris = (identifier: string) => {
  const link = `https://ure.su/j/${encodeURIComponent(identifier)}`;
  return { ios: link, android: link, web: null };
};
function position(value: unknown) {
  const point = object(value);
  if (typeof point?.lat !== 'number' || typeof point.long !== 'number' || !Number.isFinite(point.lat) || !Number.isFinite(point.long) ||
    Math.abs(point.lat) > 85 || Math.abs(point.long) > 180) return undefined;
  return { lat: point.lat, lng: point.long };
}
function reply(payload: unknown) {
  const data = object(payload);
  if (data?.succeeded !== true || !Array.isArray(data.errors) || data.errors.length) throw new Error('Invalid JET rider map');
  return data;
}

/** The map's reply: its loose scooters, and its parkings, complete unless the list stops at its cap on one holding scooters. */
export function parseJetRiderVehicles(payload: unknown): { count: number; vehicles: JetScooter[]; parkings: JetRiderParking[]; parkingsComplete: boolean } {
  const entries = object(reply(payload).entries);
  if (!entries || !Array.isArray(entries.transports) || !Array.isArray(entries.parkings)) throw new Error('Invalid JET rider map');
  const vehicles: JetScooter[] = [];
  for (const item of entries.transports) {
    const transport = object(item);
    if (!transport || typeof transport.type !== 'string') throw new Error('Invalid JET rider transport');
    if (!SCOOTER_TYPES.has(transport.type)) continue;
    const point = position(transport.location);
    if (!transportId(transport.identifier) || !point || transport.batteryPercent != null &&
      (typeof transport.batteryPercent !== 'number' || !Number.isFinite(transport.batteryPercent) ||
        transport.batteryPercent < 0 || transport.batteryPercent > 100)) throw new Error('Invalid JET rider scooter');
    vehicles.push({ provider: 'jet', vehicle_id: `jet-rider:${transport.identifier}`, ...point,
      battery: typeof transport.batteryPercent === 'number' ? Math.round(transport.batteryPercent) : null,
      range_m: null, deep_link: null, rental_uris: rentalUris(transport.identifier), distance_m: null });
  }
  const parkings: JetRiderParking[] = [];
  let lastEmpty = true;
  for (const item of entries.parkings) {
    const parking = object(item), point = position(parking?.location), count = parking?.countScooters;
    if (!parking || typeof parking.id !== 'string' || !PARKING_ID.test(parking.id) || !point ||
      typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) throw new Error('Invalid JET rider parking');
    parkings.push({ id: parking.id, ...point, count });
    lastEmpty = count === 0 && !(typeof parking.countBikes === 'number' && parking.countBikes > 0);
  }
  // The map lists the parkings that hold anything first: a full list ending in an empty one has them all.
  return { count: entries.transports.length, vehicles, parkings, parkingsComplete: parkings.length < PARKING_LIST_CAP || lastEmpty };
}

/**
 * Scooters of a polygon's or a parking's reply that can be hired, with their range; bikes and other states are left out,
 * and the ids of scooters in another state, as booked, go to `unhireable` (collectJetRiderRegion).
 */
function transports(items: unknown[], parkingId?: string, unhireable?: Set<string>): JetRiderTransport[] {
  if (items.length > 1000) throw new Error('Invalid JET rider map');
  const result: JetRiderTransport[] = [];
  for (const item of items) {
    const transport = object(item);
    if (!transport || typeof transport.type !== 'string' || typeof transport.state !== 'string') throw new Error('Invalid JET rider transport');
    if (!SCOOTER_TYPES.has(transport.type)) continue;
    if (!HIREABLE_STATES.has(transport.state)) {
      if (transportId(transport.identifier)) unhireable?.add(`jet-rider:${transport.identifier}`);
      continue;
    }
    const point = position(transport.location), charge = object(transport.charge);
    const battery = charge?.batteryPercent, km = charge?.remainKm, parking = parkingId ?? transport.parkingId;
    if (!transportId(transport.identifier) || !point || transport.charge != null && !charge ||
      battery != null && (typeof battery !== 'number' || !Number.isFinite(battery) || battery < 0 || battery > 1) ||
      km != null && (typeof km !== 'number' || !Number.isFinite(km) || km < 0 || km > 200) ||
      parking != null && (typeof parking !== 'string' || !PARKING_ID.test(parking))) throw new Error('Invalid JET rider scooter');
    const model = object(transport.model)?.name;
    result.push({ vehicle: { provider: 'jet', vehicle_id: `jet-rider:${transport.identifier}`, ...point,
      battery: typeof battery === 'number' ? Math.round(battery * 100) : null, range_m: typeof km === 'number' ? Math.round(km * 1000) : null,
      deep_link: null, rental_uris: rentalUris(transport.identifier), distance_m: null }, ...parking != null && { parkingId: parking },
      ...typeof model === 'string' && MODEL_NAME.test(model) && { model } });
  }
  return result;
}

export function parseJetRiderPolygon(payload: unknown, unhireable?: Set<string>): JetRiderTransport[] {
  const data = reply(payload);
  if (!Array.isArray(data.transports)) throw new Error('Invalid JET rider map');
  return transports(data.transports, undefined, unhireable);
}

export function parseJetRiderParking(payload: unknown, id: string, unhireable?: Set<string>): JetRiderTransport[] {
  const parking = object(reply(payload).data);
  if (parking?.id !== id || !Array.isArray(parking.transports)) throw new Error('Invalid JET rider parking');
  return transports(parking.transports, id, unhireable);
}

const minorUnits = (value: unknown, maximum: number) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 &&
  value <= maximum ? value : undefined;

/**
 * The price on a scooter's card, for a model in the country, or nothing when the card gives none that the map can
 * show: its per-minute rate is the one entry billed by the minute, its start the activation fee when charged, both
 * in hundredths (value100). Its culture ("uz-UZ", "ka-GE") must be the country's, which gives the currency.
 */
export function parseJetRiderRate(payload: unknown, country: string, model: string): RidePricing | undefined {
  const data = reply(payload), rate = object(data.rate);
  if (!rate || !Array.isArray(rate.entries)) throw new Error('Invalid JET rider scooter');
  const currency = CURRENCIES[country];
  const perMinute = rate.entries.map(object).filter(entry => entry?.periodMinute === 1);
  if (!currency || data.modelName !== model || perMinute.length !== 1) return undefined;
  const entry = perMinute[0]!, debit = object(entry.debit), activation = object(entry.activationCost);
  const charged = entry.useActivationCost !== false && entry.activationCost != null;
  const minute = minorUnits(debit?.value100, 1_000_000);
  const start = charged ? minorUnits(activation?.value100, 10_000_000) : 0;
  const cultures = [debit?.culture, ...charged ? [activation?.culture] : []];
  if (minute === undefined || start === undefined ||
    !cultures.every(culture => typeof culture === 'string' && culture.endsWith(`-${country}`))) return undefined;
  return { currency, unlock_fee_minor_units: start, minute_fee_minor_units: minute };
}

/** By region and model, when a card was last read, and the last price one gave, with when that card was read. */
export type JetRiderPrices = Map<string, { readAt: number; price?: { pricing: RidePricing; readAt: number } }>;
const PRICES: JetRiderPrices = new Map();

/** The four quarters of a box, split at its centre. */
function quarters(bounds: MapBounds): MapBounds[] {
  const { latitude: lat, longitude: lng } = jetRiderCircle(bounds);
  return [{ ...bounds, north: lat, east: lng }, { ...bounds, south: lat, east: lng }, { ...bounds, north: lat, west: lng }, { ...bounds, south: lat, west: lng }];
}

function widened({ south, north, west, east }: MapBounds, meters: number): MapBounds {
  const lat = meters / 111_320, lng = lat / Math.cos((south + north) / 2 * Math.PI / 180);
  return { south: south - lat, north: north + lat, west: west - lng, east: east + lng };
}

let defaultClient: JetRiderClient | undefined;
export async function collectJetRiderRegion(system: RegionalScooterSystem,
  client: Pick<JetRiderClient, 'vehicles' | 'polygon' | 'parking' | 'transport'> = defaultClient ??= new JetRiderClient(),
  prices: JetRiderPrices = PRICES): Promise<SourceVehicles> {
  if (!system.jetRiderAppCity) throw new Error('Not a JET rider map region');
  jetRiderCircle(system.bounds);
  const areas = (system.areas ?? [system]).map(area => area.bounds);
  if (!areas.length || areas.length > 32) throw new Error('Invalid JET rider operating areas');
  for (const area of areas) {
    jetRiderCircle(area);
    if (area.south < system.bounds.south || area.north > system.bounds.north ||
      area.west < system.bounds.west || area.east > system.bounds.east) throw new Error('JET rider area exceeds reviewed bounds');
  }
  const inAreas = (lat: number, lng: number) => areas.some(area => boundsContainPoint(area, lat, lng));
  const started = Date.now(), deadline = started + COLLECTION_MS;
  let requests = 0;
  const spend = () => { if (++requests > MAX_REQUESTS || Date.now() >= deadline) throw new Error('JET rider map exceeds the collection budget'); };

  // The map lists each loose scooter, and only counts those standing in a parking.
  const loose = new Map<string, JetScooter>(), parkings = new Map<string, JetRiderParking>();
  async function mapTile(bounds: MapBounds, depth = 0): Promise<void> {
    let batch: ReturnType<typeof parseJetRiderVehicles> | undefined;
    if (jetRiderCircle(bounds).radius <= MAX_RADIUS_M) {
      spend();
      batch = parseJetRiderVehicles(await client.vehicles(bounds, deadline));
    }
    if (!batch || batch.count >= SPLIT_AT || !batch.parkingsComplete) {
      if (depth >= 8) throw new Error('JET rider map remains capped in a small view');
      for (const part of quarters(bounds)) await mapTile(part, depth + 1);
      return;
    }
    for (const vehicle of batch.vehicles) if (inAreas(vehicle.lat, vehicle.lng)) loose.set(vehicle.vehicle_id, vehicle);
    for (const parking of batch.parkings) if (parking.count > 0 && inAreas(parking.lat, parking.lng)) parkings.set(parking.id, parking);
  }
  for (const area of areas) await mapTile(area);

  // Polygons list the parked scooters too, and every scooter's range, but a full box's reply leaves some out with
  // no sign of it: each box is sized by the map's counts, checked against them, and split while it falls short.
  // They list a scooter's state, which the map does not: one they list as booked, or in any state that can't be
  // hired, is neither missing from them nor kept from the map. Until 24 November 2026 it was both: published from
  // the map with no range or price, and counted short, enough of them splitting a box down to 100 metres (week
  // review of 24 November 2026, C5).
  const read = new Map<string, JetScooter>(), parked = new Map<string, Set<string>>(), models = new Map<string, string>();
  const unhireable = new Set<string>();
  const keep = ({ vehicle, parkingId, model }: JetRiderTransport) => {
    read.set(vehicle.vehicle_id, vehicle);
    if (parkingId) parked.set(parkingId, (parked.get(parkingId) ?? new Set()).add(vehicle.vehicle_id));
    if (model) models.set(vehicle.vehicle_id, model);
  };
  async function polygonTile(bounds: MapBounds): Promise<void> {
    const expectedLoose = [...loose.values()].filter(vehicle => boundsContainPoint(bounds, vehicle.lat, vehicle.lng));
    const expectedParkings = [...parkings.values()].filter(parking => boundsContainPoint(bounds, parking.lat, parking.lng));
    const expected = expectedLoose.length + expectedParkings.reduce((sum, parking) => sum + parking.count, 0);
    if (!expected) return;
    // A parking's scooters stand within its 50-metre radius, so the read reaches past the box's edge.
    const view = widened(bounds, POLYGON_MARGIN_M), radius = jetRiderCircle(bounds).radius;
    const divisible = radius > MIN_POLYGON_RADIUS_M;
    if (jetRiderCircle(view).radius > MAX_RADIUS_M || divisible && expected > POLYGON_TARGET) {
      for (const part of quarters(bounds)) await polygonTile(part);
      return;
    }
    spend();
    const batch = parseJetRiderPolygon(await client.polygon(view, deadline), unhireable);
    batch.forEach(keep);
    const ids = new Set(batch.map(item => item.vehicle.vehicle_id));
    const missing = expectedLoose.filter(vehicle => !ids.has(vehicle.vehicle_id) && !unhireable.has(vehicle.vehicle_id)).length +
      expectedParkings.reduce((sum, parking) => sum + Math.max(0, parking.count - batch.filter(item => item.parkingId === parking.id).length), 0);
    // A few may have been hired or moved since the map was read.
    if (divisible && missing > Math.max(2, Math.ceil(expected * 0.03))) for (const part of quarters(bounds)) await polygonTile(part);
  }
  for (const area of areas) await polygonTile(area);

  // A parking the polygons leave short, by a scooter hired since or one a reply dropped, is read on its own.
  const short = [...parkings.values()].filter(parking => (parked.get(parking.id)?.size ?? 0) < parking.count);
  if (short.length > MAX_PARKING_READS) throw new Error('JET rider parkings remain unread');
  for (const parking of short) {
    spend();
    parseJetRiderParking(await client.parking(parking.id, deadline), parking.id, unhireable).forEach(keep);
  }

  const vehicles = new Map([...loose].filter(([id]) => !unhireable.has(id)));
  for (const vehicle of read.values()) if (inAreas(vehicle.lat, vehicle.lng)) vehicles.set(vehicle.vehicle_id, vehicle);

  // Each model's price, read again from one of its scooters once an hour old. A price that can't be read leaves
  // the scooters without one, never the sweep without its scooters. A card read with no price the map can show, as
  // one listing two rates by the minute, keeps the price read before, as a card that can't be read does, until six
  // hours after it was read (PRICE_KEPT_MS), and is read again in an hour. Until 24 November 2026 such a card erased
  // the price at once (week review of 24 November 2026, minor note).
  const byModel = new Map<string, string>();
  for (const id of vehicles.keys()) {
    const model = models.get(id);
    if (model && !byModel.has(model)) byModel.set(model, id.slice(id.indexOf(':') + 1));
  }
  const key = (model: string) => `${system.id}|${model}`;
  let priceReads = 0;
  for (const [model, identifier] of byModel) {
    const known = prices.get(key(model));
    if (known && Date.now() - known.readAt < PRICE_REFRESH_MS) continue;
    if (++priceReads > MAX_PRICE_READS) break;
    try {
      spend();
      const pricing = parseJetRiderRate(await client.transport(identifier, deadline), system.country, model), readAt = Date.now();
      const price = pricing ? { pricing, readAt } : known?.price;
      prices.set(key(model), { readAt, ...price && { price } });
    } catch { /* The price read before, if any, stays until PRICE_KEPT_MS, and the card is read again next sweep. */ }
  }
  const priced = [...vehicles.values()].map(vehicle => {
    const model = models.get(vehicle.vehicle_id), price = model ? prices.get(key(model))?.price : undefined;
    return price && Date.now() - price.readAt < PRICE_KEPT_MS ? { ...vehicle, pricing: price.pricing } : vehicle;
  });
  return { observedAt: started, stale: false, vehicles: priced };
}

/**
 * A watched region is collected again two minutes after its last collection started, not one: reading parked
 * scooters made Tashkent's 105 requests and about a minute on 23 November 2026, where the map alone took 36.
 */
export const JET_RIDER_WATCHED_INTERVAL_MS = 2 * 60_000;

/**
 * A view too wide to show single scooters has a region collected every ten minutes, as other app maps
 * (APP_MAP_WIDE_INTERVAL_MS), and a street's view every two. The cache gives that interval only to app maps
 * without one of their own for when they are watched (scooter-cache.ts, setDefinitions), so the region names
 * it: from 23 to 24 November 2026 a wide view had a region collected every two minutes, Tashkent's 105 requests
 * five times as often (week review of 24 November 2026, C3).
 */
export function withJetRiderAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.jetRiderAppCity).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, paced: true, activeIntervalMs: JET_RIDER_WATCHED_INTERVAL_MS, wideIntervalMs: APP_MAP_WIDE_INTERVAL_MS,
      collect: () => collectJetRiderRegion(system) } : feed;
  });
}
