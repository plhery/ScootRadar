import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import areaCatalog from '../data/bird-app-areas.json';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { daytimeSweeps } from './appMapCadence';
import { sweepNearestArea, type NearestMap, type NearestSweep, type Ring, type SweepLimits } from './nearestSweep';
import { Pacer, SweepProgress } from './sweeps';

const ORIGIN = 'https://api-bird.prod.birdapp.com';
const AUTH = 'https://api-auth.prod.birdapp.com';
/** The app's map lists the 250 rentable vehicles nearest its point, nearest first, scooters or not. */
export const BIRD_PAGE = 250;
/** How far a request reaches: the research reader's verified limit (docs/bird-app-map.md). */
export const BIRD_REACH_M = 5_000;
/**
 * One request every 30 seconds for every Bird area together, 120 an hour. On 27 October 2026 the map
 * made up its scooters twice after about 200 requests: in eleven minutes 2.5 to 3 seconds apart, and
 * in 23 minutes six seconds apart. So its limit counts requests over some period, not their pace,
 * and it is not published (docs/bird-app-map.md).
 */
export const BIRD_QUERY_INTERVAL_MS = 30_000;
/** After an unverified map, no Bird request for a quarter of an hour: the research reader's hold. */
export const BIRD_UNTRUSTED_HOLD_MS = 15 * 60_000;
/** A deploy runs the new cache beside the old one for up to 90 seconds; a starting cache waits for it (BINBIN_START_HOLD_MS). */
export const BIRD_START_HOLD_MS = 120_000;
/** An area nobody looks at is swept once a day, by day in its town (daytimeSweeps). */
export const BIRD_IDLE_INTERVAL_MS = 24 * 60 * 60_000;
/**
 * How long a request keeps an area watched: three minutes, not the cache's ten, as Lime's (LIME_WATCH_MS).
 * A watched area is swept again as soon as its sweep ends, on the one request every 30 seconds.
 */
export const BIRD_WATCH_MS = 3 * 60_000;
const RETRY_MS = 60_000;
const RENEW_BEFORE_MS = 60 * 60_000;
export const birdMapRequests = { status: 0, metadata: 0 };

/**
 * The brands the map lists. Bird's app shows Spin's fleet too: in Phoenix, 234 of the 249 Spin-branded
 * scooters it listed stood within 10 m of one in Spin's public feed, on 27 October 2026. Made-up
 * scooters had no brand at all, so any other is refused.
 */
export const BIRD_BRANDS: Readonly<Record<string, 'bird' | 'spin'>> = {
  'df76d602-dd1a-4ce4-a64f-2e5dd8c6f845': 'bird', '37f4f15f-d73b-4f1e-8f52-5de2782bd447': 'spin',
};
const BIRD_MAP: NearestMap = { name: 'Bird', page: BIRD_PAGE, reachM: BIRD_REACH_M, cellM: 7_000 };

export interface BirdScooter { id: string; brand: 'bird' | 'spin'; lat: number; lng: number; battery: number | null; range: number | null }
export interface BirdReply { scooters: BirdScooter[]; completeM: number }
interface Session { version: 1; deviceId: string; accessToken: string; refreshToken: string }
interface ClientOptions { sessionPath?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number; startHoldMs?: number }
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
const jwt = (value: unknown): value is string => typeof value === 'string' && value.length < 8192 && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(value);
/** A failure worth asking again a few seconds later: a sweep is many requests. */
const transient = (message: string) => Object.assign(new Error(message), { transient: true });

/** A map Bird made up, or one that cannot be told from one: the sweep stops, and so do Bird's requests for a while. */
export class BirdUntrustedMapError extends Error {
  constructor(readonly reason: string) { super(`Bird returned an unverified map (${reason})`); }
}

const S2_LEVEL_BITS = BigInt('0x1555555555555555');
/** An S2 cell id as the map writes it, a signed 64-bit decimal: its face and level bits must hold. */
function cellId(value: unknown): boolean {
  if (typeof value !== 'string' || !/^-?[1-9]\d{0,19}$/.test(value)) return false;
  const signed = BigInt(value);
  if (BigInt.asIntN(64, signed) !== signed) return false;
  const id = BigInt.asUintN(64, signed);
  const low = id & -id;
  return id >> BigInt(61) < BigInt(6) && low > BigInt(0) && (low & S2_LEVEL_BITS) === low;
}

/**
 * The reply to a nearby request at lat, lng within radiusM, checked as the research reader does
 * (docs/bird-app-map.md): the cells it answers for, even when empty, and for every vehicle an
 * identity, a known brand, an area and a position within the radius, nearest first. Made-up
 * replies had none of these. Every vehicle counts toward the page, scooter or not.
 */
export function parseBirdReply(payload: unknown, lat: number, lng: number, radiusM: number): BirdReply {
  const reply = object(payload);
  const birds = reply?.birds, cells = reply?.cell_ids;
  if (!Array.isArray(birds) || !Array.isArray(cells) || birds.length > BIRD_PAGE || cells.length > 4096) throw new BirdUntrustedMapError('shape');
  if (!cells.every(cellId) || new Set(cells).size !== cells.length || (birds.length && !cells.length)) throw new BirdUntrustedMapError('cells');
  const ids = new Set<string>();
  const scooters: BirdScooter[] = [];
  let farthest = 0;
  for (const entry of birds) {
    const bird = object(entry), location = object(bird?.location);
    if (!bird || !uuid(bird.id) || ids.has(bird.id)) throw new BirdUntrustedMapError('identity');
    ids.add(bird.id);
    const brand = typeof bird.brand_id === 'string' ? BIRD_BRANDS[bird.brand_id] : undefined;
    if (!brand) throw new BirdUntrustedMapError('brand');
    if (typeof bird.area_key !== 'string' || !/^[\dA-F]{32}$/.test(bird.area_key) || typeof bird.captive !== 'boolean' ||
      typeof bird.vehicle_class !== 'string') throw new BirdUntrustedMapError('vehicle');
    if (!finite(location?.latitude) || !finite(location.longitude) || Math.abs(location.latitude) > 85 ||
      Math.abs(location.longitude) > 180) throw new BirdUntrustedMapError('position');
    const distance = haversineM(lat, lng, location.latitude, location.longitude);
    if (distance > radiusM + 30) throw new BirdUntrustedMapError('beyond radius');
    if (distance + 1 + distance * 0.001 < farthest) throw new BirdUntrustedMapError('not nearest first');
    farthest = Math.max(farthest, distance);
    if (bird.vehicle_class !== 'scooter' || bird.captive) continue;
    scooters.push({ id: bird.id, brand, lat: location.latitude, lng: location.longitude,
      battery: finite(bird.battery_level) && bird.battery_level >= 0 && bird.battery_level <= 100 ? bird.battery_level : null,
      range: finite(bird.estimated_range) && bird.estimated_range >= 0 && bird.estimated_range <= 200_000 ? Math.round(bird.estimated_range) : null });
  }
  // A vehicle as far as the last may be the one left out. Less 0.3%, as BinBin's (parseBinbinReply).
  const reach = birds.length < BIRD_PAGE && reply?.reached_response_limit !== true ? radiusM : farthest;
  return { scooters, completeM: Math.max(0, reach * 0.997 - 1) };
}

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw transient('Bird returned an empty response');
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
    throw size > maxBytes ? new Error('Bird response exceeds the size limit') : transient('Bird response was cut off');
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Bird returned invalid JSON'); }
}

/** When a token expires, from its own claims. */
function expiry(token: string): number {
  try {
    const exp = object(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')))?.exp;
    if (finite(exp)) return exp * 1000;
  } catch { /* checked below */ }
  throw new Error('Bird token has no expiry');
}

/** Only the Node cache reads the rider's private session; the catalogs hold Bird's area ids. */
export class BirdClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private blockedUntil = 0;
  private retryAt = 0;
  private failure?: Error;
  private session?: Session;
  private renewing?: Promise<Session>;

  constructor(options: ClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.BIRD_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'bird-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? BIRD_QUERY_INTERVAL_MS, this.now, this.now() + (options.startHoldMs ?? 0));
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async load(): Promise<Session> {
    let data: Record<string, unknown> | undefined;
    try {
      const text = await readFile(this.sessionPath, 'utf8');
      if (text.length > 32_768) throw new Error();
      data = object(JSON.parse(text));
    } catch { throw new Error('Bird session credentials are missing or unreadable'); }
    if (data?.version !== 1 || !uuid(data.deviceId) || !jwt(data.accessToken) || !jwt(data.refreshToken)) {
      throw new Error('Bird session credentials are invalid');
    }
    return { version: 1, deviceId: data.deviceId, accessToken: data.accessToken, refreshToken: data.refreshToken };
  }

  private headers(session: Session, bearer: string): Record<string, string> {
    return { 'User-Agent': 'Bird/4.420.0.2 (co.bird.android; release; Android - 15)', 'Device-Id': session.deviceId,
      Platform: 'android', 'App-Version': '4.420.0.2', 'App-Name': 'bird', 'App-Type': 'rider', Accept: 'application/json',
      'Accept-Language': 'en-US', Authorization: `Bearer ${bearer}` };
  }

  private async request(url: string, init: RequestInit, kind: 'status' | 'metadata'): Promise<Response> {
    if (this.now() < this.blockedUntil) throw new Error('Bird requests are held off');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Bird requests are held off');
    birdMapRequests[kind]++;
    let response: Response;
    try { response = await this.fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) }); }
    catch { throw transient('Bird request failed or timed out'); }
    if (response.status === 429 || response.status === 403) {
      const retry = response.headers.get('retry-after');
      const asked = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : 0;
      this.hold(Math.min(6 * 3600_000, Math.max(BIRD_UNTRUSTED_HOLD_MS, Number.isFinite(asked) ? asked : 0)), `HTTP ${response.status}`);
    }
    return response;
  }

  /** No Bird request until then, whichever feed asks: the account's quota is one. */
  private hold(ms: number, reason: string): void {
    this.blockedUntil = Math.max(this.blockedUntil, this.now() + ms);
    this.pace.holdUntil(this.blockedUntil);
    console.warn(JSON.stringify({ event: 'bird_held_off', reason, seconds: Math.round(ms / 1000) }));
  }

  private current(rejected?: string): Promise<Session> {
    if (this.renewing) return this.renewing;
    if (this.now() < this.retryAt) return Promise.reject(this.failure ?? new Error('Bird authentication is awaiting retry'));
    if (!rejected && this.session && this.now() < expiry(this.session.accessToken) - RENEW_BEFORE_MS) return Promise.resolve(this.session);
    this.renewing = (async () => {
      try {
        let session = await this.load();
        if (session.accessToken === rejected || this.now() >= expiry(session.accessToken) - RENEW_BEFORE_MS) {
          if (this.now() >= expiry(session.refreshToken)) throw new Error('Bird login has expired');
          const response = await this.request(`${AUTH}/api/v1/auth/refresh/token`,
            { method: 'POST', headers: this.headers(session, session.refreshToken) }, 'metadata');
          if (!response.ok) { await response.body?.cancel(); throw new Error(`Bird session HTTP ${response.status}`); }
          const reply = object(await jsonBody(response, 65_536));
          const access = reply?.access ?? reply?.access_token, refresh = reply?.refresh ?? reply?.refresh_token;
          if (!jwt(access) || (refresh !== undefined && !jwt(refresh)) || expiry(access) <= this.now() + RENEW_BEFORE_MS) {
            throw new Error('Bird session response is invalid');
          }
          const renewed: Session = { ...session, accessToken: access, refreshToken: refresh ?? session.refreshToken };
          // A replacement login saved meanwhile is kept, not overwritten.
          if ((await this.load()).refreshToken === session.refreshToken) await this.save(renewed);
          session = renewed;
        }
        this.failure = undefined;
        return this.session = session;
      } catch (error) {
        this.failure = error instanceof Error ? error : new Error('Bird authentication failed');
        this.retryAt = this.now() + RETRY_MS;
        throw this.failure;
      } finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  private async save(session: Session): Promise<void> {
    const directory = join(dirname(this.sessionPath), 'tmp');
    const temporary = join(directory, `bird-session-${randomUUID()}.json`);
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(temporary, JSON.stringify(session), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('Bird renewed credentials could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }

  /** The vehicles nearest lat, lng within radiusM, as a rider standing there sees them. */
  async nearest(lat: number, lng: number, radiusM = BIRD_REACH_M): Promise<BirdReply> {
    if (!finite(lat) || !finite(lng) || Math.abs(lat) > 85 || Math.abs(lng) > 180 || !(radiusM > 0 && radiusM <= BIRD_REACH_M)) {
      throw new Error('Invalid Bird map request');
    }
    const radius = Math.ceil(radiusM);
    const url = `${ORIGIN}/bird/nearby?${new URLSearchParams({ latitude: String(lat), longitude: String(lng), radius: String(radius) })}`;
    // The map answers for where the rider stands, and only there.
    const location = JSON.stringify({ latitude: lat, longitude: lng });
    const get = async (session: Session) => this.request(url, { headers: { ...this.headers(session, session.accessToken), Location: location } }, 'status');
    let session = await this.current();
    let response = await get(session);
    if (response.status === 401) {
      await response.body?.cancel();
      // Another feed may already have renewed it.
      session = this.session && this.session.accessToken !== session.accessToken ? await this.current() : await this.current(session.accessToken);
      response = await get(session);
      if (response.status === 401) { this.failure = new Error('Bird map authorization was rejected'); this.retryAt = this.now() + RETRY_MS; }
    }
    if (!response.ok) {
      await response.body?.cancel();
      const message = `Bird map HTTP ${response.status}`;
      throw response.status >= 500 ? transient(message) : new Error(message);
    }
    try { return parseBirdReply(await jsonBody(response, 8 * 1024 * 1024), lat, lng, radius); }
    catch (error) {
      if (error instanceof BirdUntrustedMapError) this.hold(BIRD_UNTRUSTED_HOLD_MS, error.reason);
      throw error;
    }
  }
}

export type BirdSweep = NearestSweep<BirdScooter>;
/** Every vehicle within the outline, by Bird's 250 nearest (sweepNearestArea), planned from where they stood. */
export const sweepBirdArea = (api: Pick<BirdClient, 'nearest'>, rings: readonly Ring[], previous: readonly { lat: number; lng: number }[],
  limits: SweepLimits = { requests: 200, milliseconds: 2 * 60 * 60_000, retryMs: BIRD_QUERY_INTERVAL_MS }, found = new Map<string, BirdScooter>(),
  done?: (part: MapBounds) => void): Promise<BirdSweep> => sweepNearestArea(BIRD_MAP, api, rings, previous, limits, found, done);

interface Area { id: string; title: string; rings: Ring[] }
const AREAS = new Map((areaCatalog.areas as unknown as Area[]).map(area => [area.id, area.rings]));
type Published = { lat: number; lng: number; vehicle_id: string | null };
export type PreviousPositions = (feedId: string) => readonly Published[] | undefined;

/**
 * A complete sweep of a Bird area's outline (sweepNearestArea), planned from where its scooters
 * last stood. Only the brand of the system's provider is published, inside the outline.
 */
export async function collectBirdArea(system: RegionalScooterSystem, previous: readonly Published[],
  api: Pick<BirdClient, 'nearest'>, limits?: SweepLimits): Promise<SourceVehicles> {
  const rings = system.birdAppArea ? AREAS.get(system.birdAppArea) : undefined;
  if (!rings || (system.provider !== 'bird' && system.provider !== 'spin')) throw new Error('Not a Bird app map area');
  const inside = (scooter: BirdScooter) => scooter.brand === system.provider && boundsContainPoint(system.bounds, scooter.lat, scooter.lng) &&
    rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng));
  const published = (scooters: Iterable<BirdScooter>): Vehicle[] => [...scooters].filter(inside).map(scooter => ({
    // By the operator's own id, which the map keeps, so a scooter where two areas meet is shown once.
    provider: system.provider, vehicle_id: `${system.provider}:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
    battery: scooter.battery, range_m: scooter.range, deep_link: null, distance_m: null,
  }));
  const found = new Map<string, BirdScooter>();
  const progress = new SweepProgress(() => published(found.values()));
  const sweep = await sweepBirdArea(api, rings, previous, limits, found, part => progress.done(part));
  console.log(JSON.stringify({ event: 'bird_sweep', system: system.id, scooters: sweep.scooters.length,
    requests: sweep.requests, planned: sweep.planned, piles: sweep.piles, seconds: Math.round((Date.now() - sweep.startedAt) / 1000) }));
  return { observedAt: sweep.startedAt, stale: false, vehicles: published(sweep.scooters) };
}

const client = new BirdClient({ startHoldMs: BIRD_START_HOLD_MS });
let scriptClient: BirdClient | undefined;
/** A sweep from nothing known, as scripts/check-french-feeds.mjs makes: it replaces no cache, so it waits for none. */
export const collectBirdRegion = (system: RegionalScooterSystem) => collectBirdArea(system, [], scriptClient ??= new BirdClient());

/** Each area's sweep is planned from the positions the cache last published for it. */
export function withBirdAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[],
  previous: PreviousPositions, api: Pick<BirdClient, 'nearest'> = client) {
  const areas = new Map(systems.filter(system => system.birdAppArea).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = areas.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, idleIntervalMs: BIRD_IDLE_INTERVAL_MS, watchMs: BIRD_WATCH_MS, paced: true,
      ...system.timeZone ? daytimeSweeps(feed.id, system.timeZone, BIRD_IDLE_INTERVAL_MS) : {},
      collect: () => collectBirdArea(system, previous(feed.id) ?? [], api) } : feed;
  });
}

