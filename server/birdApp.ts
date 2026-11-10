import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import areaCatalog from '../data/bird-app-areas.json';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import { serviceAreas, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { PositionReads } from '../src/lib/scooterSnapshots';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { daytimeSweeps } from './appMapCadence';
import { heldSquare, sweepNearestArea, type Disc, type NearestMap, type NearestProgress, type NearestSweep, type Ring,
  type SweepLimits } from './nearestSweep';
import { saveAtomically } from './snapshotFile';
import { currentCollection, Pacer, SweepProgress, withinCollection, type CollectionScope, type PaceOptions } from './sweeps';

const ORIGIN = 'https://api-bird.prod.birdapp.com';
const AUTH = 'https://api-auth.prod.birdapp.com';
/** The app's map lists the 250 rentable vehicles nearest its point, nearest first, scooters or not. */
export const BIRD_PAGE = 250;
/** How far a request reaches: the research reader's verified limit (docs/bird-app-map.md). */
export const BIRD_REACH_M = 5_000;
/**
 * An idle sweep's spacing: one request every 30 seconds, as every Bird request was until 10 November
 * 2026. On 27 October 2026 the map made up its scooters twice after about 200 requests: in eleven
 * minutes 2.5 to 3 seconds apart, and in 23 minutes six seconds apart. So its limit counts requests
 * over some period, not their pace, and it is not published (docs/bird-app-map.md).
 */
export const BIRD_QUERY_INTERVAL_MS = 30_000;
/**
 * What all Bird requests may take together (Pacer): a town someone opens up to ten a minute at once
 * (BIRD_BURST_EVERY_MS), 30 in any five minutes and 120 in any hour, of which an idle sweep, at its 30
 * seconds, leaves ten and 30 to the towns someone opens. On 10 November 2026 the research account's map
 * answered 66 requests in 44 seconds, four at a time, with real scooters (Austin's 2,844 in 45 requests;
 * the cache's sweeps found 2,846 to 2,874 that day), and its API refused the Mac's address (HTTP 403,
 * Bird's public feeds still answering it) after 139 in four minutes: 30 in five minutes is under a
 * quarter of that, and 120 an hour well under the 200 the map made up scooters after. Until then two a
 * minute, so a town opened waited up to 30 seconds for its first scooters, 38 at the median from 8 to 10
 * November, and Austin's sweep of 31 to 37 took 17 to 39 minutes.
 */
export const BIRD_PACE: PaceOptions = {
  perMinute: 10,
  spans: [{ ms: 5 * 60_000, requests: 30, idle: 20 }, { ms: 60 * 60_000, requests: 120, idle: 90 }],
};
/** After an unverified map, no Bird request for a quarter of an hour: the research reader's hold. */
export const BIRD_UNTRUSTED_HOLD_MS = 15 * 60_000;
/** A deploy runs the new cache beside the old one for up to 90 seconds; a starting cache waits for it (BINBIN_START_HOLD_MS). */
export const BIRD_START_HOLD_MS = 120_000;
/** An area nobody looks at is swept once a day, by day in its town (daytimeSweeps). */
export const BIRD_IDLE_INTERVAL_MS = 24 * 60 * 60_000;
/**
 * How long past its day an area may go without a sweep before it expires: two hours, not ten minutes. Its turn
 * falls at the same time each day, but its sweep ends after those queued before it on the one client and its own
 * 1 to 50 minutes, and a deploy stops the sweeps under way. From 31 October to 9 November 2026 a day's sweep
 * ended 24 hours after the last at the median and 24 hours 27 at the 99th centile, past ten minutes 15 times
 * in 240. On 9 November Scottsdale's waited for Austin's of 27 minutes and two others, then two deploys 14
 * minutes apart stopped it, and it ended 58 minutes late and Kent's, after it, 48: Sentry heard of them as
 * stopped (SCOOTRADAR-CACHE-6B).
 */
export const BIRD_IDLE_GRACE_MS = 2 * 60 * 60_000;
/**
 * How long a request keeps an area watched: three minutes, not the cache's ten, as Lime's (LIME_WATCH_MS).
 */
export const BIRD_WATCH_MS = 3 * 60_000;
/**
 * A watched area is swept again five minutes after its last sweep started, or once that ends, not a
 * minute after: a town of one request watched for an hour takes twelve of the hour's 120 (BIRD_PACE), not 60.
 */
export const BIRD_WATCHED_INTERVAL_MS = 5 * 60_000;
/**
 * A town someone opens has its sweep at the pace of a town looked at (BIRD_PACE) once in half an hour: its
 * next sweeps, while it stays watched, keep an idle sweep's. Austin's sweeps of 31 to 37, each at that pace
 * as the last ends, would spend the hour's 120 in twenty minutes and leave every other town none for forty.
 */
export const BIRD_BURST_EVERY_MS = 30 * 60_000;
/** When each area's last sweep at a looked-at town's pace began, by system: in memory, so a restart allows one more. */
const bursts = new Map<string, { at: number; token: object }>();
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
interface ClientOptions {
  sessionPath?: string; fetch?: typeof fetch; now?: () => number;
  /** One request every intervalMs, 0 for none, instead of BIRD_PACE. */
  intervalMs?: number;
  timeoutMs?: number; startHoldMs?: number;
  /** Where it keeps when its requests of the last hour started, for the cache that replaces it (BIRD_PACE). */
  pacePath?: string;
}
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
  private readonly startAt: number;
  private readonly pacePath?: string;
  private restored?: Promise<void>;
  private pacing = Promise.resolve();
  private paceSaveFailed = false;

  constructor(options: ClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.BIRD_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'bird-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.startAt = this.now() + (options.startHoldMs ?? 0);
    this.pace = options.intervalMs === undefined ? new Pacer(BIRD_QUERY_INTERVAL_MS, this.now, this.startAt, Infinity, BIRD_PACE)
      : new Pacer(options.intervalMs, this.now, this.startAt);
    this.pacePath = options.pacePath;
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  /**
   * Counts the requests of the cache it replaces against the hour's budget, read once its start hold
   * is over, when that cache has stopped: two caches each with its own hour would double the rate.
   */
  private restorePace(): Promise<void> {
    return this.restored ??= (async () => {
      if (!this.pacePath) return;
      const wait = this.startAt - this.now();
      if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
      try {
        const saved = object(JSON.parse(await readFile(this.pacePath, 'utf8')));
        if (saved?.version === 1 && Array.isArray(saved.started)) this.pace.remember(saved.started.filter(finite));
      } catch { /* none kept, or unreadable: the start hold alone stands */ }
    })();
  }

  /** Each save once the one before is done; one that fails is told once and the requests go on. */
  private savePace(): void {
    const path = this.pacePath;
    if (!path) return;
    const started = this.pace.history();
    this.pacing = this.pacing.then(() => saveAtomically(path, dirname(path), 'bird-pace',
      temporary => writeFile(temporary, JSON.stringify({ version: 1, started }), { mode: 0o600 }))).catch(error => {
      if (this.paceSaveFailed) return;
      this.paceSaveFailed = true;
      console.warn(JSON.stringify({ event: 'bird_pace_save_failed', error: error instanceof Error ? error.name : 'UnknownError' }));
    });
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
    await this.restorePace();
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Bird requests are held off');
    this.savePace();
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
const BIRD_LIMITS: SweepLimits = { requests: 200, milliseconds: 2 * 60 * 60_000, retryMs: BIRD_QUERY_INTERVAL_MS };
/** Every vehicle within the outline, by Bird's 250 nearest (sweepNearestArea), planned from where they stood. */
export const sweepBirdArea = (api: Pick<BirdClient, 'nearest'>, rings: readonly Ring[], previous: readonly { lat: number; lng: number }[],
  limits = BIRD_LIMITS, found = new Map<string, BirdScooter>(), done?: (part: MapBounds, progress: NearestProgress) => void,
  resume?: NearestProgress): Promise<BirdSweep> => sweepNearestArea(BIRD_MAP, api, rings, previous, limits, found, done, resume);

/**
 * How recently a sweep's checkpoint must have been saved for the next sweep of its area to resume it.
 * A deploy hands one over within about three minutes, the new cache's start hold and a reply's pace;
 * one older was left by a cache stopped long before, and the sweep starts again.
 */
export const BIRD_CHECKPOINT_MAX_AGE_MS = 10 * 60_000;
/** A Bird area's sweep under way, as saved after each of its replies: where it stood, and the scooters it had found. */
export interface BirdSweepCheckpoint extends NearestProgress { system: string; scooters: BirdScooter[]; savedAt: number }
const savedDisc = (value: unknown): value is Disc => {
  const entry = object(value);
  return finite(entry?.lat) && finite(entry.lng) && finite(entry.r) && entry.r >= 0;
};
/** A scooter as a file the cache saved holds it, read back: a checkpoint's, or a supplement's (birdSupplement.ts). */
export const savedScooter = (value: unknown): value is BirdScooter => {
  const entry = object(value);
  return typeof entry?.id === 'string' && (entry.brand === 'bird' || entry.brand === 'spin') && finite(entry.lat) && finite(entry.lng) &&
    (entry.battery === null || finite(entry.battery)) && (entry.range === null || finite(entry.range));
};

/**
 * Each Bird area's sweep under way, saved after each reply, from which the area's next sweep goes on
 * (collectBirdArea). A deploy stops the sweeps under way, and they started again from nothing: on 9
 * November 2026 deploys at 23:43 and 23:57 UTC stopped Scottsdale's of 28 requests partway twice,
 * and it ended on the third try, 58 minutes late (SCOOTRADAR-CACHE-6B). Austin's takes up to 49
 * minutes, which deploys close together could stop every time.
 *
 * They are saved among the temporary files beside the snapshot, as `tmp/bird-sweep.<area>.tmp`, which
 * the host's backup skips (/etc/coolify-backup/excludes.txt on netcup: `*-scooter-snapshots/_data/tmp/*.tmp`,
 * whose star stops at a slash): each goes when its sweep ends, and one vanishing while restic read it
 * would fail the backup, as a temporary snapshot did on 19 October 2026 (scooter-cache.ts).
 *
 * A deploy's new cache reads an area's when it starts the area's sweep, not when it starts itself:
 * the old cache goes on sweeping, and saving, for about 90 seconds after. The reads wait out the
 * client's start hold (BIRD_START_HOLD_MS), as its first request does, by when the old cache has
 * stopped and saved its last.
 */
export class BirdSweepCheckpoints {
  readonly directory: string;
  private readonly readFrom: number;
  constructor(options: { directory?: string; startHoldMs?: number } = {}) {
    this.directory = options.directory ?? join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'tmp');
    this.readFrom = Date.now() + (options.startHoldMs ?? 0);
  }

  /** Named .tmp in the folder itself, as the backup's exclusion matches (`_data/tmp/*.tmp`), not in a folder of its own. */
  path(system: string) { return join(this.directory, `bird-sweep.${system}.tmp`); }

  /** The area's sweep stopped partway, if saved recently and started within the limits: none if unreadable. */
  async resumable(system: string, limits: SweepLimits): Promise<BirdSweepCheckpoint | undefined> {
    const wait = this.readFrom - Date.now();
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    let saved: Record<string, unknown> | undefined;
    try { saved = object(JSON.parse(await readFile(this.path(system), 'utf8'))); } catch { return undefined; }
    const { startedAt, requests, discs, scooters, savedAt } = saved ?? {}, now = Date.now();
    if (saved?.system !== system || !finite(startedAt) || !finite(savedAt) || typeof requests !== 'number' || !Number.isInteger(requests) ||
      requests < 0 || !Array.isArray(discs) || !discs.every(savedDisc) || !Array.isArray(scooters) || !scooters.every(savedScooter)) return undefined;
    if (now - savedAt > BIRD_CHECKPOINT_MAX_AGE_MS || savedAt > now || startedAt > savedAt || now - startedAt >= limits.milliseconds) return undefined;
    return { system, startedAt, requests, discs, scooters, savedAt };
  }

  /**
   * Saves the area's sweep after each reply, each save once the one before is done, until it ends, and
   * then removes it, whether the sweep succeeded or failed: a reply still under way then is not saved.
   * A save that fails is told once and the sweep goes on.
   */
  track(system: string): { save(progress: NearestProgress, scooters: BirdScooter[]): void; end(): Promise<void> } {
    let saving = Promise.resolve(), ended = false, told = false;
    return {
      save: ({ startedAt, requests, discs }, scooters) => {
        if (ended) return;
        const write = (path: string) => writeFile(path, JSON.stringify({ system, startedAt, requests, discs, scooters, savedAt: Date.now() }));
        saving = saving.then(() => saveAtomically(this.path(system), this.directory, `bird-sweep.${system}`, write)).catch(error => {
          if (!told) console.warn(JSON.stringify({ event: 'bird_checkpoint_failed', system, error: error instanceof Error ? error.message : String(error) }));
          told = true;
        });
      },
      end: async () => {
        ended = true;
        await saving;
        await rm(this.path(system), { force: true }).catch(() => undefined);
      },
    };
  }
}

interface Area { id: string; title: string; rings: Ring[] }
const AREAS = new Map((areaCatalog.areas as unknown as Area[]).map(area => [area.id, area.rings]));
/** The outline of a Bird operating area of data/bird-app-areas.json. */
export const birdAreaRings = (id: string): readonly Ring[] | undefined => AREAS.get(id);
/**
 * A scooter of Bird's map as the cache publishes it, by the operator's own id, which the map keeps. Its battery
 * is a whole percent, as a GBFS feed's (scooterFeeds.ts) and as the answer's schema says: one of 57.5 would make
 * the iPhone app refuse the whole answer.
 */
export const birdVehicle = (provider: 'bird' | 'spin', scooter: BirdScooter): Vehicle => ({
  provider, vehicle_id: `${provider}:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
  battery: scooter.battery === null ? null : Math.round(scooter.battery), range_m: scooter.range, deep_link: null, distance_m: null,
});
type Published = { lat: number; lng: number; vehicle_id: string | null };
export type PreviousPositions = (feedId: string) => readonly Published[] | undefined;

/**
 * What a Bird area's sweep tells the cache beside its progress (sweeps.ts), so that its scooters are as old as
 * they are, not as the collection: when the sweep began, before a restart for one resumed (sweepStarted), and
 * when it read each scooter it ends with (sweepRead), as a sweep may take longer than a position may be shown.
 */
export interface BirdSweepScope extends CollectionScope {
  sweepStarted?(startedAt: number): void;
  sweepRead?(reads: PositionReads): void;
}

/**
 * The scope the cache collects a feed in. `progress` hears what its sweep has found with when the sweep began:
 * the collection's start, `startedAt`, unless a Bird sweep resumed after a restart says it began before. `reads`
 * gives when a Bird sweep read each scooter it ended with. Until 10 November 2026 a resumed sweep's progress was
 * stamped with the collection's start: scooters it had found up to two hours before the restart (BIRD_LIMITS)
 * showed as live, with the restart's time (week review, finding 2.4).
 */
export function sweepScope(attention: Omit<CollectionScope, 'progress'>, startedAt: number,
  progress: (found: Vehicle[], swept: MapBounds[], startedAt: number) => void): BirdSweepScope & { reads(): PositionReads | undefined } {
  let reads: PositionReads | undefined;
  return { ...attention, progress: (found, swept) => progress(found, swept, startedAt),
    sweepStarted: at => { startedAt = at; }, sweepRead: read => { reads = read; }, reads: () => reads };
}

/**
 * A complete sweep of a Bird area's outline (sweepNearestArea), planned from where its scooters
 * last stood. Only the brand of the system's provider is published, inside the outline and one of
 * the system's service areas: Spin's Greenwood Village system keeps the north of an area whose
 * south is Spin's public Meridian feed. Given checkpoints, the cache's, a sweep stopped partway
 * goes on where it stood, from its start (BirdSweepCheckpoints).
 */
export async function collectBirdArea(system: RegionalScooterSystem, previous: readonly Published[],
  api: Pick<BirdClient, 'nearest'>, limits = BIRD_LIMITS, checkpoints?: BirdSweepCheckpoints): Promise<SourceVehicles> {
  const rings = system.birdAppArea ? AREAS.get(system.birdAppArea) : undefined;
  if (!rings || (system.provider !== 'bird' && system.provider !== 'spin')) throw new Error('Not a Bird app map area');
  const areas = serviceAreas(system);
  const inside = (scooter: BirdScooter) => scooter.brand === system.provider &&
    areas.some(area => boundsContainPoint(area.bounds, scooter.lat, scooter.lng)) &&
    rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng));
  // By the operator's own id, so a scooter where two areas meet is shown once.
  const published = (scooters: Iterable<BirdScooter>): Vehicle[] =>
    [...scooters].filter(inside).map(scooter => birdVehicle(system.provider as 'bird' | 'spin', scooter));
  const scope = currentCollection() as BirdSweepScope | undefined;
  // The client hears someone looks only during the area's one such sweep of the half hour (BIRD_BURST_EVERY_MS).
  const token = {}, began = Date.now();
  const paced: CollectionScope | undefined = scope && { ...scope, urgent: () => {
    if (!scope.urgent()) return false;
    const last = bursts.get(system.id);
    if (last && last.token !== token && began - last.at < BIRD_BURST_EVERY_MS) return false;
    bursts.set(system.id, { at: began, token });
    return true;
  } };
  const found = new Map<string, BirdScooter>();
  // When each scooter was last read, and the last reply: the scooters a long sweep read last show live when
  // it ends, those it read first faded (sweepRead).
  const readAt = new Map<string, number>();
  let lastReadAt: number | undefined;
  const reading = { nearest: async (lat: number, lng: number, radiusM?: number) => {
    const reply = await (paced ? withinCollection(paced, () => api.nearest(lat, lng, radiusM)) : api.nearest(lat, lng, radiusM));
    lastReadAt = Date.now();
    for (const scooter of reply.scooters) readAt.set(scooter.id, lastReadAt);
    return reply;
  } };
  const progress = new SweepProgress(() => published(found.values()));
  const resume = await checkpoints?.resumable(system.id, limits);
  if (resume) {
    // The map shows at once what the stopped sweep had found, and where, as old as that sweep.
    scope?.sweepStarted?.(resume.startedAt);
    for (const seen of resume.scooters) found.set(seen.id, seen);
    progress.done(...resume.discs.map(({ lat, lng, r }) => heldSquare(lat, lng, r)));
  }
  const checkpoint = checkpoints?.track(system.id);
  let sweep: BirdSweep;
  try {
    sweep = await sweepBirdArea(reading, rings, previous, limits, found, (part, state) => {
      progress.done(part);
      checkpoint?.save(state, [...found.values()]);
    }, resume);
  } finally { await checkpoint?.end(); }
  console.log(JSON.stringify({ event: 'bird_sweep', system: system.id, scooters: sweep.scooters.length, requests: sweep.requests,
    planned: sweep.planned, piles: sweep.piles, ...resume ? { resumed: true, resumedRequests: resume.requests } : {},
    seconds: Math.round((Date.now() - sweep.startedAt) / 1000) }));
  const kept = sweep.scooters.filter(inside);
  const vehicles = kept.map(scooter => birdVehicle(system.provider as 'bird' | 'spin', scooter));
  // Those the stopped sweep found and this one did not read again are as old as its start, observedAt.
  if (lastReadAt !== undefined) {
    scope?.sweepRead?.({ lastAt: lastReadAt, at: Object.fromEntries(kept.flatMap((scooter, i) =>
      readAt.has(scooter.id) ? [[vehicles[i].vehicle_id!, readAt.get(scooter.id)!]] : [])) });
  }
  return { observedAt: sweep.startedAt, stale: false, vehicles };
}

/**
 * The cache's one client, whose pace and holds every Bird request shares, the Rome feed's additions' too
 * (birdSupplement.ts). Its last hour's requests are kept beside the sweeps' checkpoints, as a .tmp the
 * host's backup skips.
 */
export const birdMapClient = new BirdClient({ startHoldMs: BIRD_START_HOLD_MS,
  pacePath: join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'tmp', 'bird-pace.tmp') });
/** The cache's sweeps' checkpoints, read once its client's start hold is over. Scripts' sweeps keep none. */
export const birdSweepCheckpoints = new BirdSweepCheckpoints({ startHoldMs: BIRD_START_HOLD_MS });
let scriptClient: BirdClient | undefined;
/** A sweep from nothing known, as scripts/check-french-feeds.mjs makes: it replaces no cache, so it waits for none. */
export const collectBirdRegion = (system: RegionalScooterSystem) => collectBirdArea(system, [], scriptClient ??= new BirdClient());

/** Each area's sweep is planned from the positions the cache last published for it, and resumed after a deploy. */
export function withBirdAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[],
  previous: PreviousPositions, api: Pick<BirdClient, 'nearest'> = birdMapClient, checkpoints = birdSweepCheckpoints) {
  const areas = new Map(systems.filter(system => system.birdAppArea).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = areas.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, idleIntervalMs: BIRD_IDLE_INTERVAL_MS, idleGraceMs: BIRD_IDLE_GRACE_MS, watchMs: BIRD_WATCH_MS,
      activeIntervalMs: BIRD_WATCHED_INTERVAL_MS, paced: true,
      ...system.timeZone ? daytimeSweeps(feed.id, system.timeZone, BIRD_IDLE_INTERVAL_MS) : {},
      collect: () => collectBirdArea(system, previous(feed.id) ?? [], api, undefined, checkpoints) } : feed;
  });
}

