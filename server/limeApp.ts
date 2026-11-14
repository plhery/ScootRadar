import { createHash, createPrivateKey, createPublicKey, randomUUID, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import { daytimeSweeps } from './appMapCadence';
import { decodeLimeArea, limeAreaTiles, LIME_QUERY_INTERVAL_MS, LIME_IDLE_INTERVAL_MS, LIME_ROUTINE_EVERY, LIME_WATCH_MS } from './limeAreas';
export { LIME_IDLE_INTERVAL_MS } from './limeAreas';
import limeRegions from '../data/lime-app-regions.json';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { currentCollection, PaceGate, Pacer, SweepProgress, takeNearest } from './sweeps';

const ORIGIN = 'https://web-production.lime.bike';
const RETRY_MS = 60_000;
/** How long the other container of a deploy gets to save the session it renewed. */
const PEER_SAVE_MS = 1_000;
const PIN_LIMIT = 200;
/**
 * Lime counts the calls of one address, whichever accounts make them, in ten-second windows of the clock
 * (:00, :10, ...) and answers 429 from the 61st of a window to its end. Measured on 11 and 12 November 2026,
 * the first two days of eight accounts that lend each other calls: a town opened after a quiet spell sent 66
 * to 78 calls within seconds from every account, and all 195 refusals of those 43 hours fell in the second
 * half of a window, none in its first five seconds; three bursts ended with 66 calls made and six refused,
 * one for each of the six groups reading, so 60 answered, one of them within a single window for certain;
 * and refusals reached three to eight accounts in the same second, idle ones on their first call. Each
 * refusal cooled its account for a minute: 146 of 1,230 Lime collections failed, none in the two days
 * before, on three accounts (docs/lime-app-map.md, "The address's ten seconds").
 *
 * So no more than fifty calls start in any ten seconds, across all accounts (PaceGate): a count over any
 * ten seconds also holds for Lime's windows wherever they begin, and ten are left for calls that arrive
 * late. The cache a deploy runs beside this one for a minute counts its own: the two could pass 60 together
 * in that minute, the new one's accounts keeping their five seconds. Fifty in ten seconds is 300 a minute,
 * twenty-five accounts' worth at twelve each: the eight of November 2026 make 96, so a town's 51st call of
 * a burst waits for the first to be ten seconds old, and nothing waits longer. Lime answered a view through
 * other addresses too (two datacenter proxy exits, 12 November 2026), half a second slower each for the
 * tunnel: worth building only past what one address is allowed.
 */
export const LIME_ADDRESS_CALLS = 50;
export const LIME_ADDRESS_WINDOW_MS = 10_000;
// One Lime region can hold several towns' markets, as Düsseldorf's holds Neuss and Hilden: each keeps its own polygons.
const serviceOutlines = new Map(limeRegions.markets.map(market => [`${market.regionToken}|${market.city}`, market.serviceAreas.map(area => area.polygon)]));
export const limeMapRequests = { status: 0, metadata: 0 };
interface Session {
  version: 1; accessToken: string; refreshToken: string; deviceToken: string; privateKey: string;
  expiresAt: number; refreshExpiresAt: number; renewalWindow: number;
}
interface Reply { status: number; retryAfter?: string; body: unknown }
type Transport = (path: string, headers: Record<string, string>, body?: string) => Promise<Reply>;
interface LimeClientOptions {
  sessionPath?: string; now?: () => number; intervalMs?: number; peerSaveMs?: number; transport?: Transport;
  /** The budget of the address, shared with the other accounts' clients (LIME_ADDRESS_CALLS). */
  gate?: PaceGate;
  /** A call goes out: a map view's (status) or a renewal's (metadata), lent when made for another account's group. */
  onRequest?: (kind: 'status' | 'metadata', lent: boolean) => void;
  /** Lime answered a call of this client's with HTTP 429, a map view's or a renewal's. */
  onThrottled?: () => void;
}
const object = (v: unknown): Record<string, unknown> | undefined =>
  v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : undefined;
const text = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 16_384;
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;

/** TLS 1.2 matches the verified Android path and works from the Linux Node 26 cache. */
const transport: Transport = (path, headers, body) => new Promise((resolve, reject) => {
  const req = request(ORIGIN + path, { minVersion: 'TLSv1.2', maxVersion: 'TLSv1.2',
    method: body === undefined ? 'GET' : 'POST', headers }, response => {
    if (response.statusCode !== 200) {
      response.destroy();
      finish(undefined, { status: response.statusCode ?? 0, retryAfter: response.headers['retry-after'], body: undefined });
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    response.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 8 * 1024 * 1024) req.destroy(new Error('Response size limit'));
      else chunks.push(chunk);
    });
    response.on('error', () => finish(new Error('Lime response failed')));
    response.on('end', () => {
      let data: unknown;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return finish(new Error(`Lime returned invalid JSON (HTTP ${response.statusCode})`)); }
      finish(undefined, { status: response.statusCode ?? 0, retryAfter: response.headers['retry-after'], body: data });
    });
  });
  let done = false;
  const timer = setTimeout(() => req.destroy(new Error('Deadline')), 20_000);
  function finish(error?: Error, reply?: Reply) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    if (error) reject(error);
    else resolve(reply!);
  }
  req.on('error', () => finish(new Error('Lime request failed or timed out')));
  req.end(body);
});

export function limeClientAssertion(privateKey: string, now: number): string {
  const key = createPrivateKey(privateKey);
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails?.namedCurve !== 'prime256v1') throw new Error('Invalid Lime client key');
  const jwk = createPublicKey(key).export({ format: 'jwk' });
  const encode = (v: unknown) => Buffer.from(JSON.stringify(v)).toString('base64url');
  const message = encode({ alg: 'ES256', typ: 'JWT', jwk }) + '.' + encode({
    iss: '134c5eda-3e85-460a-b808-3deae1357602', jti: randomUUID(), iat: Math.floor(now / 1000),
  });
  return message + '.' + sign('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
}

export class LimeClient {
  private session?: Session;
  private renewing?: Promise<Session>;
  private readonly pace: Pacer;
  private blockedUntil = 0;
  private retryAt = 0;
  private failure?: Error;
  private readonly sessionPath: string;
  private readonly now: () => number;
  private readonly transport: Transport;
  constructor(private readonly options: LimeClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.LIME_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'lime-session.json');
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? LIME_QUERY_INTERVAL_MS, this.now, 0, LIME_ROUTINE_EVERY, { gate: options.gate });
    this.transport = options.transport ?? transport;
  }
  private async load(): Promise<Session> {
    let s: Record<string, unknown> | undefined;
    try { s = object(JSON.parse(await readFile(this.sessionPath, 'utf8'))); }
    catch { throw new Error('Lime session credentials are missing or unreadable'); }
    if (!s || s.version !== 1 || !text(s.accessToken) || !text(s.refreshToken) || !text(s.deviceToken) ||
      !text(s.privateKey) || !positive(s.expiresAt) || !positive(s.refreshExpiresAt) ||
      !positive(s.renewalWindow) || s.renewalWindow > 3600) throw new Error('Lime session credentials are invalid');
    try { limeClientAssertion(s.privateKey, this.now()); }
    catch { throw new Error('Lime session client key is invalid'); }
    return s as unknown as Session;
  }
  private async save(session: Session) {
    const directory = join(dirname(this.sessionPath), 'tmp');
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const temporary = join(directory, `lime-session-${randomUUID()}.json`);
    try {
      await writeFile(temporary, JSON.stringify(session), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('Lime renewed credentials could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }
  private headers(s: Session): Record<string, string> {
    return { Authorization: `Bearer ${s.accessToken}`, 'X-Device-Token': s.deviceToken, Platform: 'Android',
      'App-Version': '3.286.0', 'User-Agent': 'okhttp/4.12.0', Accept: 'application/json', 'Content-Type': 'application/json' };
  }
  private async call(path: string, session: Session, body?: string, lent = false) {
    if (this.now() < this.blockedUntil) throw new Error('Lime is temporarily rate limited');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Lime is temporarily rate limited');
    const kind = body === undefined ? 'status' : 'metadata';
    limeMapRequests[kind]++;
    this.options.onRequest?.(kind, lent);
    let reply: Reply;
    const headers = this.headers(session);
    if (path === '/api/auth/v2/oauth/token') delete headers.Authorization;
    try { reply = await this.transport(path, headers, body); }
    catch { throw new Error('Lime request failed or timed out'); }
    if (reply.status === 429) {
      this.options.onThrottled?.();
      const r = reply.retryAfter;
      const ms = r && /^\d+$/.test(r) ? Number(r) * 1000 : r ? Date.parse(r) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Number.isFinite(ms) && ms > 0 ? ms : RETRY_MS);
    }
    return reply;
  }
  private current(rejectedToken?: string): Promise<Session> {
    if (this.renewing) return this.renewing;
    if (this.now() < this.retryAt) return Promise.reject(this.failure);
    if (!rejectedToken && this.session && this.now() < this.session.expiresAt - this.session.renewalWindow * 1000 + 5000) return Promise.resolve(this.session);
    this.renewing = (async () => {
      try {
        let s = await this.load();
        if (s.accessToken === rejectedToken || this.now() >= s.expiresAt - s.renewalWindow * 1000 + 5000) {
          if (s.refreshExpiresAt <= this.now()) throw new Error('Lime login has expired');
          const r = await this.call('/api/auth/v2/oauth/token', s, JSON.stringify({ grant_type: 'refresh_token',
            refresh_token: s.refreshToken, client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
            client_assertion: limeClientAssertion(s.privateKey, this.now()) }));
          if (r.status === 401) {
            // Lime takes a refresh token once, and a deploy's two containers share this file: the
            // one that loses the renewal goes on with the session the other saved. Lost and held
            // for the minute below, the new container's renewal failed 7 feeds on 30 October 2026.
            await new Promise(resolve => setTimeout(resolve, this.options.peerSaveMs ?? PEER_SAVE_MS));
            const saved = await this.load();
            if (saved.refreshToken !== s.refreshToken) {
              this.failure = undefined;
              return this.session = saved;
            }
          }
          if (r.status !== 200) throw new Error(`Lime session HTTP ${r.status}`);
          const d = object(r.body);
          if (!d || !text(d.access_token) || !text(d.refresh_token) || !positive(d.expires_in) ||
            !positive(d.refresh_token_expires_in) || !positive(d.renewal_window) || d.renewal_window > 3600 ||
            d.expires_in <= d.renewal_window) throw new Error('Lime session response is invalid');
          s = { ...s, accessToken: d.access_token, refreshToken: d.refresh_token, expiresAt: this.now() + d.expires_in * 1000,
            refreshExpiresAt: this.now() + d.refresh_token_expires_in * 1000, renewalWindow: d.renewal_window };
          await this.save(s);
        }
        this.failure = undefined;
        return this.session = s;
      } catch (error) {
        this.failure = error instanceof Error ? error : new Error('Lime authentication failed');
        this.retryAt = this.now() + RETRY_MS;
        throw this.failure;
      } finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }
  /** Whether a call asked for now would go out: the account is not cooling down after a 429 or a refused login. */
  ready(): boolean {
    const now = this.now();
    return now >= this.blockedUntil && now >= this.retryAt;
  }
  /** When a call for a town someone is looking at, asked for now, would start (Pacer.urgentStartAt). */
  urgentStartAt(): number { return this.pace.urgentStartAt(); }
  /** A view's scooters; lent when this account reads it for another account's group (LimeAccountPool.pins). */
  async pins(bounds: MapBounds, lent = false): Promise<unknown> {
    const query = new URLSearchParams({ ne_lat: String(bounds.north), ne_lng: String(bounds.east),
      sw_lat: String(bounds.south), sw_lng: String(bounds.west), user_latitude: String((bounds.north + bounds.south) / 2),
      user_longitude: String((bounds.east + bounds.west) / 2), zoom: '18', vehicle_filter: '["scooter"]',
      bounding_box_restriction: 'limit_to_box' });
    const path = '/api/rider/v2/map/bike_pins?' + query;
    let s = await this.current();
    let r = await this.call(path, s, undefined, lent);
    if (r.status === 401) {
      // A concurrent region may already have replaced this token.
      s = this.session?.accessToken !== s.accessToken ? await this.current() : await this.current(s.accessToken);
      r = await this.call(path, s, undefined, lent);
      if (r.status === 401) {
        this.failure = new Error('Lime map authorization was rejected');
        this.retryAt = this.now() + RETRY_MS;
      }
    }
    if (r.status !== 200) throw new LimeMapError(r.status, r.retryAfter);
    return r.body;
  }
}

/** Lime's refusal of a map call, with the Retry-After it sent, if any. */
export class LimeMapError extends Error {
  constructor(status: number, readonly retryAfter?: string) {
    super(`Lime map HTTP ${status}`);
    this.name = 'LimeMapError';
  }
}

export interface LimeScooter { id: string; lat: number; lng: number; battery: number | null }
export function parseLimePins(payload: unknown): { count: number; vehicles: LimeScooter[] } {
  const attributes = object(object(object(payload)?.data)?.attributes);
  if (attributes?.current_level !== 'block') throw new Error('Lime returned a clustered map');
  const pins = attributes.bike_pins;
  if (!Array.isArray(pins)) throw new Error('Invalid Lime map response');
  const vehicles: LimeScooter[] = [];
  for (const pin of pins) {
    const p = object(pin);
    if (!p || typeof p.type !== 'string') throw new Error('Invalid Lime map pin');
    if (p.type !== 'scooter' || (p.provider !== undefined && p.provider !== 'Lime')) continue;
    const l = object(p.location);
    if (!text(p.id) || typeof l?.latitude !== 'number' || typeof l.longitude !== 'number' ||
      !Number.isFinite(l.latitude) || !Number.isFinite(l.longitude) || Math.abs(l.latitude) > 90 || Math.abs(l.longitude) > 180) {
      throw new Error('Invalid Lime scooter');
    }
    vehicles.push({ id: text(p.secondary_id) ? p.secondary_id : p.id, lat: l.latitude, lng: l.longitude,
      battery: typeof p.battery_percentage === 'number' && Number.isFinite(p.battery_percentage) &&
        p.battery_percentage >= 0 && p.battery_percentage <= 100 ? Math.round(p.battery_percentage) : null });
  }
  return { count: pins.length, vehicles };
}

/** The app returns the nearest 200 pins; a radius beyond every cell corner covers that cell. */
export function limeCellCovered(result: ReturnType<typeof parseLimePins>, bounds: MapBounds): boolean {
  if (result.count < PIN_LIMIT) return true;
  if (result.count !== result.vehicles.length || new Set(result.vehicles.map(v => v.id)).size !== result.count) return false;
  const lat = (bounds.north + bounds.south) / 2, lng = (bounds.east + bounds.west) / 2;
  const edge = Math.max(...[bounds.south, bounds.north].flatMap(y =>
    [bounds.west, bounds.east].map(x => haversineM(lat, lng, y, x))));
  const radius = Math.max(...result.vehicles.map(v => haversineM(lat, lng, v.lat, v.lng)));
  return radius >= edge + 50;
}

interface Cell { bounds: MapBounds; depth: number; probe?: true }
/**
 * A capped viewport is never published as a complete fleet. Empty leaves remain in the plan. The
 * cell nearest where people look goes next, and each one found complete is reported (sweeps.ts).
 */
export class LimeMapCollector {
  private plans = new Map<string, Cell[]>();
  constructor(private readonly api: Pick<LimeClient, 'pins'>, private readonly limits = { requests: 256, depth: 9, milliseconds: 900_000 }) {}
  async collect(system: RegionalScooterSystem): Promise<SourceVehicles> {
    if (!system.limeAppMap || system.provider !== 'lime') throw new Error('Not a Lime app map region');
    const started = Date.now();
    const areas = (system.limeServiceAreas ?? serviceOutlines.get(`${system.limeAppRegion}|${system.city}`))?.map(decodeLimeArea);
    if (!areas?.length) throw new Error('Lime map requires verified service outlines');
    const cells: Cell[] = [...(this.plans.get(system.id) ?? (system.limeMapTiles ?? limeAreaTiles(areas)).map(bounds => ({ bounds, depth: 0 })))];
    if (cells.length > this.limits.requests) throw new Error('Lime service area exceeds the collection budget');
    const leaves: Cell[] = [];
    const vehicles = new Map<string, LimeScooter>();
    const published = (v: LimeScooter): Vehicle => ({
      provider: 'lime', vehicle_id: `${system.limeAppRegion ?? system.id}:${v.id}`, lat: v.lat, lng: v.lng, battery: v.battery,
      range_m: null, deep_link: null, distance_m: null,
    });
    const progress = new SweepProgress(() => [...vehicles.values()].map(published));
    let calls = 0;
    for (let cell = takeNearest(cells, c => c.bounds); cell; cell = takeNearest(cells, c => c.bounds)) {
      if (++calls > this.limits.requests || Date.now() - started > this.limits.milliseconds) throw new Error('Lime map completeness budget exceeded');
      const result = parseLimePins(await this.api.pins(cell.bounds));
      // A narrower reply can omit a valid pin seen in its parent. Preserve all
      // observed pins, and keep querying parent views on subsequent refreshes.
      for (const v of result.vehicles) {
        if (boundsContainPoint(cell.bounds, v.lat, v.lng) && areas.some(area => polygonContainsPoint(area, v.lat, v.lng))
          && systemServesPoint(system, v.lat, v.lng)) vehicles.set(v.id, v);
      }
      if (cell.probe) {
        leaves.push(cell);
      } else if (!limeCellCovered(result, cell.bounds)) {
        if (cell.depth >= this.limits.depth) throw new Error('Lime map is still capped at the subdivision limit');
        leaves.push({ ...cell, probe: true });
        const b = cell.bounds, lat = (b.north + b.south) / 2, lng = (b.east + b.west) / 2;
        for (const [south, north] of [[b.south, lat], [lat, b.north]]) {
          for (const [west, east] of [[b.west, lng], [lng, b.east]]) cells.push({ bounds: { south, north, west, east }, depth: cell.depth + 1 });
        }
      } else {
        leaves.push(cell);
        progress.done(cell.bounds);
      }
    }
    this.plans.set(system.id, leaves);
    return { observedAt: started, stale: false, vehicles: [...vehicles.values()].map(published) };
  }
}
export interface LimeAccount { id: string; sessionPath: string }
/**
 * An account's calls by kind, the map reads it took on for another account's groups (lent), which its status calls
 * include, and those of its calls Lime answered with HTTP 429 (throttled), lent or not, renewals included.
 */
export interface LimeAccountRequests { account: string; status: number; metadata: number; lent: number; throttled: number }
/**
 * A sanity bound on the manifest, not a measure of what Lime allows: every account calls from the cache's one
 * address, which is allowed about twenty-five accounts' calls (LIME_ADDRESS_CALLS). Eight until 10 November
 * 2026, the evening eight accounts served production.
 */
export const LIME_MAX_ACCOUNTS = 64;

/** Optional private manifest; an absent default keeps the original single-account setup. */
export function readLimeAccounts(options: { accountsPath?: string; sessionPath?: string } = {}): LimeAccount[] {
  const sessionPath = options.sessionPath ?? process.env.LIME_SESSION_PATH ??
    join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'lime-session.json');
  const explicit = options.accountsPath ?? process.env.LIME_ACCOUNTS_PATH;
  const path = explicit ?? join(dirname(sessionPath), 'lime-accounts.json');
  let manifest: Record<string, unknown> | undefined;
  try { manifest = object(JSON.parse(readFileSync(path, 'utf8'))); }
  catch (error) {
    if (!explicit && (error as NodeJS.ErrnoException).code === 'ENOENT') return [{ id: 'primary', sessionPath }];
    throw new Error('Lime account configuration is missing or unreadable');
  }
  if (manifest?.version !== 1 || !Array.isArray(manifest.accounts) || !manifest.accounts.length || manifest.accounts.length > LIME_MAX_ACCOUNTS) {
    throw new Error('Lime account configuration is invalid');
  }
  return validateAccounts(manifest.accounts.map(value => {
    const account = object(value);
    if (!text(account?.sessionPath) || !text(account?.id)) throw new Error('Lime account configuration is invalid');
    return { id: account.id, sessionPath: resolve(dirname(path), account.sessionPath) };
  }));
}

function validateAccounts(accounts: readonly LimeAccount[]): LimeAccount[] {
  if (!accounts.length || accounts.length > LIME_MAX_ACCOUNTS || accounts.some(account => !/^[a-z0-9][a-z0-9-]{0,31}$/.test(account.id) || !account.sessionPath) ||
      new Set(accounts.map(account => account.id)).size !== accounts.length ||
      new Set(accounts.map(account => resolve(account.sessionPath))).size !== accounts.length) throw new Error('Lime accounts must have unique ids and session files');
  return accounts.map(account => ({ ...account }));
}

/**
 * A Lime call that failed, with the same message, naming the account that made it by its manifest id (not a
 * secret) and whether it made it for another account's group (lent), for the feed's failure log line: on
 * 11 November 2026 four Berlin groups of three accounts failed on a 429 in the same second, and the line could
 * not say whose call it was.
 */
export class LimeAccountError extends Error {
  constructor(cause: unknown, readonly account: string, readonly lent: boolean) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = 'LimeAccountError';
  }
}

/**
 * For a log line: the Lime account whose call failed, when that is why `error` was thrown, and the Retry-After
 * Lime sent with its refusal, if any: the 429s of 11 and 12 November 2026 were read without it, and whether
 * Lime names the ten seconds it counts over (LIME_ADDRESS_CALLS) had to be worked out from their times.
 */
export function limeAccount(error: unknown): { account?: string; lent?: boolean; retryAfter?: string } {
  if (!(error instanceof LimeAccountError)) return {};
  const retryAfter = error.cause instanceof LimeMapError ? error.cause.retryAfter?.slice(0, 40) : undefined;
  return { account: error.account, lent: error.lent, ...(retryAfter ? { retryAfter } : {}) };
}

/**
 * Each group is its account's: its slots, plans and idle sweeps, and its calls but those a group someone is
 * looking at borrows (pins). A feed stays on its account during failures; no retry switches it to another quota.
 */
export class LimeAccountPool {
  readonly accounts: readonly LimeAccount[];
  readonly requests: LimeAccountRequests[];
  /** The address's budget the accounts share (LIME_ADDRESS_CALLS), with the calls it held. */
  readonly gate: PaceGate;
  private readonly clients: Map<string, LimeClient>;
  private readonly collectors: Map<string, LimeMapCollector>;
  constructor(accounts: readonly LimeAccount[], options: Omit<LimeClientOptions, 'sessionPath' | 'onRequest' | 'onThrottled'> = {}) {
    this.accounts = validateAccounts(accounts).sort((a, b) => a.id.localeCompare(b.id));
    this.requests = this.accounts.map(account => ({ account: account.id, status: 0, metadata: 0, lent: 0, throttled: 0 }));
    const gate = this.gate = options.gate ?? new PaceGate(LIME_ADDRESS_CALLS, LIME_ADDRESS_WINDOW_MS);
    this.clients = new Map(this.accounts.map((account, index) => [account.id, new LimeClient({
      ...options, gate, sessionPath: account.sessionPath, onRequest: (kind, lent) => {
        this.requests[index][kind]++;
        // The calls that go out, as Lime counts them: two for a view retried after a refused token, none for a
        // lent view refused before its turn, as the lender cooled down meanwhile. Until 14 November 2026 a lend
        // counted once as it was decided, whatever went out.
        if (lent) this.requests[index].lent++;
      },
      onThrottled: () => { this.requests[index].throttled++; },
    })]));
    this.collectors = new Map(this.accounts.map(account => [account.id,
      new LimeMapCollector({ pins: bounds => this.pins(account.id, bounds) })]));
  }
  /**
   * A view of a group, through its own account, or for a group someone is looking at, through the account
   * that can start the call soonest: its own on a tie, else one not cooling down after a 429 or a refused
   * login. Each account's pacer still holds it to twelve calls in any 60 seconds, whosever the calls, and
   * all of them together to the address's fifty in any ten seconds (LIME_ADDRESS_CALLS). A
   * group's calls waited for its own account's minute while others had theirs to spare: on 9 and 10
   * November 2026 a Lime group someone opened started in 0.8 seconds (median) and showed its first scooters
   * 32 seconds later, though Lime answers a view in half a second. An idle sweep keeps to its account, as
   * does a group whose account cools down: its call fails there, as before.
   */
  private pins(home: string, bounds: MapBounds): Promise<unknown> {
    const own = this.clients.get(home)!;
    if (this.clients.size < 2 || !currentCollection()?.urgent() || !own.ready()) return this.call(home, bounds, false);
    let lender: string | undefined, soonest = own.urgentStartAt();
    for (const [id, client] of this.clients) {
      if (id === home || !client.ready()) continue;
      const at = client.urgentStartAt();
      if (at < soonest) { lender = id; soonest = at; }
    }
    if (lender === undefined) return this.call(home, bounds, false);
    return this.call(lender, bounds, true);
  }
  private call(id: string, bounds: MapBounds, lent: boolean): Promise<unknown> {
    return this.clients.get(id)!.pins(bounds, lent).catch(error => { throw new LimeAccountError(error, id, lent); });
  }
  accountFor(feedId: string): LimeAccount {
    // Rendezvous hashing keeps assignments stable when the manifest is reordered, and moves
    // only an added or removed account's share when the pool changes.
    let chosen = this.accounts[0], best = -1;
    for (const account of this.accounts) {
      const score = createHash('sha256').update(feedId + '\0' + account.id).digest().readUInt32BE(0);
      if (score > best) { chosen = account; best = score; }
    }
    return chosen;
  }
  collect(system: RegionalScooterSystem): Promise<SourceVehicles> {
    return this.collectors.get(this.accountFor(system.id).id)!.collect(system);
  }
}

let productionPool: LimeAccountPool | undefined;
const pool = () => productionPool ??= new LimeAccountPool(readLimeAccounts());
export const limeAccountRequests = () => productionPool?.requests ?? [];
/** The calls the address's budget held though their account had a turn, and how long in all (PaceGate.held). */
export const limeAddressHeld = () => productionPool?.gate.held ?? { requests: 0, ms: 0 };
export const collectLimeRegion = (system: RegionalScooterSystem) => pool().collect(system);
/**
 * When a Lime group's idle sweeps fall (daytimeSweeps). Its interval is three whole days, so a night's count
 * stood for up to three days: Raleigh's and Cincinnati's groups, first swept on the deploy just after 00:30 there on 26 October
 * 2026, and Knoxville's a day later, held 3 of Lime's 566, none of 236 and none of 208. Lime hides its
 * scooters in Raleigh's and Cincinnati's night bans, and Knoxville's map is empty at night without one.
 */
export const limeDaytime = (feedId: string, timeZone: string, now = Date.now()) => daytimeSweeps(feedId, timeZone, LIME_IDLE_INTERVAL_MS, now);

export function withLimeAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[], accounts?: LimeAccountPool) {
  const regions = new Map(systems.filter(s => s.limeAppMap).map(s => [s.id, s]));
  return feeds.map(feed => {
    const s = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    if (!s) return feed;
    const selected = accounts ?? pool();
    return { ...feed, idleIntervalMs: LIME_IDLE_INTERVAL_MS, watchMs: LIME_WATCH_MS, paced: true, keepsIdleTurns: true,
      ...s.timeZone ? limeDaytime(feed.id, s.timeZone) : {},
      concurrencyKey: `lime-account:${selected.accountFor(s.id).id}`, collect: () => selected.collect(s) };
  });
}
