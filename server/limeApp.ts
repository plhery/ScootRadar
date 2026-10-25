import { createHash, createPrivateKey, createPublicKey, randomUUID, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:https';
import { dirname, join, resolve } from 'node:path';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import { decodeLimeArea, limeAreaTiles, LIME_QUERY_INTERVAL_MS, LIME_IDLE_INTERVAL_MS, LIME_WATCH_MS } from './limeAreas';
export { LIME_IDLE_INTERVAL_MS } from './limeAreas';
import limeRegions from '../data/lime-app-regions.json';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { Pacer, SweepProgress, takeNearest } from './sweeps';

const ORIGIN = 'https://web-production.lime.bike';
const RETRY_MS = 60_000;
const PIN_LIMIT = 200;
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
  sessionPath?: string; now?: () => number; intervalMs?: number; transport?: Transport;
  onRequest?: (kind: 'status' | 'metadata') => void;
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
    this.pace = new Pacer(options.intervalMs ?? LIME_QUERY_INTERVAL_MS, this.now);
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
  private async call(path: string, session: Session, body?: string) {
    if (this.now() < this.blockedUntil) throw new Error('Lime is temporarily rate limited');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Lime is temporarily rate limited');
    const kind = body === undefined ? 'status' : 'metadata';
    limeMapRequests[kind]++;
    this.options.onRequest?.(kind);
    let reply: Reply;
    const headers = this.headers(session);
    if (path === '/api/auth/v2/oauth/token') delete headers.Authorization;
    try { reply = await this.transport(path, headers, body); }
    catch { throw new Error('Lime request failed or timed out'); }
    if (reply.status === 429) {
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
  async pins(bounds: MapBounds): Promise<unknown> {
    const query = new URLSearchParams({ ne_lat: String(bounds.north), ne_lng: String(bounds.east),
      sw_lat: String(bounds.south), sw_lng: String(bounds.west), user_latitude: String((bounds.north + bounds.south) / 2),
      user_longitude: String((bounds.east + bounds.west) / 2), zoom: '18', vehicle_filter: '["scooter"]',
      bounding_box_restriction: 'limit_to_box' });
    const path = '/api/rider/v2/map/bike_pins?' + query;
    let s = await this.current();
    let r = await this.call(path, s);
    if (r.status === 401) {
      // A concurrent region may already have replaced this token.
      s = this.session?.accessToken !== s.accessToken ? await this.current() : await this.current(s.accessToken);
      r = await this.call(path, s);
      if (r.status === 401) {
        this.failure = new Error('Lime map authorization was rejected');
        this.retryAt = this.now() + RETRY_MS;
      }
    }
    if (r.status !== 200) throw new Error(`Lime map HTTP ${r.status}`);
    return r.body;
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
        p.battery_percentage >= 0 && p.battery_percentage <= 100 ? p.battery_percentage : null });
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
        if (boundsContainPoint(cell.bounds, v.lat, v.lng) && areas.some(area => polygonContainsPoint(area, v.lat, v.lng))) vehicles.set(v.id, v);
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
export interface LimeAccountRequests { account: string; status: number; metadata: number }

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
  if (manifest?.version !== 1 || !Array.isArray(manifest.accounts) || !manifest.accounts.length || manifest.accounts.length > 8) {
    throw new Error('Lime account configuration is invalid');
  }
  return validateAccounts(manifest.accounts.map(value => {
    const account = object(value);
    if (!text(account?.sessionPath) || !text(account?.id)) throw new Error('Lime account configuration is invalid');
    return { id: account.id, sessionPath: resolve(dirname(path), account.sessionPath) };
  }));
}

function validateAccounts(accounts: readonly LimeAccount[]): LimeAccount[] {
  if (!accounts.length || accounts.length > 8 || accounts.some(account => !/^[a-z0-9][a-z0-9-]{0,31}$/.test(account.id) || !account.sessionPath) ||
      new Set(accounts.map(account => account.id)).size !== accounts.length ||
      new Set(accounts.map(account => resolve(account.sessionPath))).size !== accounts.length) throw new Error('Lime accounts must have unique ids and session files');
  return accounts.map(account => ({ ...account }));
}

/** A feed stays on its account during failures; no retry switches it to another quota. */
export class LimeAccountPool {
  readonly accounts: readonly LimeAccount[];
  readonly requests: LimeAccountRequests[];
  private readonly collectors: Map<string, LimeMapCollector>;
  constructor(accounts: readonly LimeAccount[], options: Omit<LimeClientOptions, 'sessionPath' | 'onRequest'> = {}) {
    this.accounts = validateAccounts(accounts).sort((a, b) => a.id.localeCompare(b.id));
    this.requests = this.accounts.map(account => ({ account: account.id, status: 0, metadata: 0 }));
    this.collectors = new Map(this.accounts.map((account, index) => [account.id, new LimeMapCollector(new LimeClient({
      ...options, sessionPath: account.sessionPath, onRequest: kind => { this.requests[index][kind]++; },
    }))]));
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
export const collectLimeRegion = (system: RegionalScooterSystem) => pool().collect(system);
export function withLimeAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[], accounts?: LimeAccountPool) {
  const regions = new Map(systems.filter(s => s.limeAppMap).map(s => [s.id, s]));
  return feeds.map(feed => {
    const s = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    if (!s) return feed;
    const selected = accounts ?? pool();
    return { ...feed, idleIntervalMs: LIME_IDLE_INTERVAL_MS, watchMs: LIME_WATCH_MS, paced: true,
      concurrencyKey: `lime-account:${selected.accountFor(s.id).id}`, collect: () => selected.collect(s) };
  });
}
