import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { POLYGON_TO_CELLS_FLAGS, polygonToCellsExperimental } from 'h3-js';
import { boundsContainPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';

const ORIGIN = 'https://gateway.ridebeam.com/query';
const RETRY_MS = 60_000;
const BATCH_SIZE = 500;
export const beamMapRequests = { status: 0, metadata: 0 };
const object = (value: unknown): Record<string, unknown> | undefined => value !== null &&
  typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const credential = (value: unknown): value is string => typeof value === 'string' &&
  value.length >= 10 && value.length <= 8192 && !/\s/.test(value);
interface Session { version: 1; userId: number; authToken: string; refreshToken: string }
interface Options { sessionPath?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }
class BeamAuthError extends Error { constructor() { super('Beam rider session was rejected'); } }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Beam returned an empty response');
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
    throw new Error(size > maxBytes ? 'Beam response exceeds the size limit' : 'Beam response could not be read');
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Beam returned invalid JSON'); }
}

function tokenExpiry(token: string, userId: number): number {
  try {
    const data = object(JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')));
    if (data?.id !== userId || typeof data.exp !== 'number' || !Number.isFinite(data.exp) ||
      data.isBlocked === true || data.deleted === true) throw new Error();
    return data.exp * 1000;
  } catch { throw new Error('Beam access token is invalid'); }
}

/** H3 overlap coverage includes cells crossing the edge, even for views smaller than one cell. */
export function beamMapCells(bounds: MapBounds): string[] {
  const { south, north, west, east } = bounds;
  if (![south, north, west, east].every(Number.isFinite) || south >= north || west >= east ||
    south < -85 || north > 85 || west < -180 || east > 180) throw new Error('Invalid Beam map bounds');
  // Bound allocation before H3 runs; the finer cell limit also bounds the number of upstream reads.
  if (north - south > 1.5 || east - west > 2) throw new Error('Beam map exceeds the collection budget');
  const cells = polygonToCellsExperimental([[south, west], [south, east], [north, east], [north, west]],
    8, POLYGON_TO_CELLS_FLAGS.containmentOverlapping);
  if (!cells.length || cells.length > 10_000) throw new Error('Beam map exceeds the collection budget');
  return cells;
}

/** Reviewed disjoint areas keep campus networks within the same complete-sweep request budget. */
export function beamRegionCells(system: RegionalScooterSystem): string[] {
  const areas = system.beamAppAreas ?? [system.bounds];
  if (!areas.length || areas.length > 256) throw new Error('Invalid Beam operating areas');
  const cells = new Set<string>();
  for (const area of areas) {
    if (area.south < system.bounds.south || area.north > system.bounds.north ||
      area.west < system.bounds.west || area.east > system.bounds.east) throw new Error('Beam operating area exceeds reviewed bounds');
    for (const cell of beamMapCells(area)) cells.add(cell);
    if (cells.size > 10_000) throw new Error('Beam map exceeds the collection budget');
  }
  return [...cells];
}

/** The session file holds only Beam credentials. Google sign-in is a one-time app operation. */
export class BeamClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private session?: Session;
  private loading?: Promise<Session>;
  private renewing?: Promise<Session>;
  private nextStart = 0;
  private blockedUntil = 0;
  private retryAt = 0;

  constructor(options: Options = {}) {
    this.sessionPath = options.sessionPath ?? process.env.BEAM_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'beam-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    // Keep a fleet-wide startup sweep gentle: rapid bursts have returned transient empty maps.
    this.intervalMs = options.intervalMs ?? 2000;
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private credentials(): Promise<Session> {
    if (this.session) return Promise.resolve(this.session);
    if (this.loading) return this.loading;
    this.loading = (async () => {
      let data: Record<string, unknown> | undefined;
      try {
        const text = await readFile(this.sessionPath, 'utf8');
        if (text.length > 32_768) throw new Error();
        data = object(JSON.parse(text));
      } catch { throw new Error('Beam session credentials are missing or unreadable'); }
      if (data?.version !== 1 || !Number.isSafeInteger(data.userId) || (data.userId as number) <= 0 ||
        !credential(data.authToken) || !credential(data.refreshToken)) throw new Error('Beam session credentials are invalid');
      tokenExpiry(data.authToken, data.userId as number);
      return this.session = data as unknown as Session;
    })().finally(() => { this.loading = undefined; });
    return this.loading;
  }

  private async save(session: Session) {
    const directory = join(dirname(this.sessionPath), 'tmp');
    const temporary = join(directory, `beam-session-${randomUUID()}.json`);
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(temporary, JSON.stringify(session), { mode: 0o600, flag: 'wx' });
      await rename(temporary, this.sessionPath);
    } catch { throw new Error('Beam renewed session could not be saved'); }
    finally { await rm(temporary, { force: true }).catch(() => undefined); }
  }

  private async query(query: string, variables: Record<string, unknown>, center: readonly number[],
    token: string | undefined, kind: 'status' | 'metadata', deadline: number): Promise<Record<string, unknown>> {
    if (this.now() < this.blockedUntil) throw new Error('Beam requests are temporarily held off');
    const wait = Math.max(0, this.nextStart - this.now());
    if (this.now() + wait >= deadline) throw new Error('Beam collection timed out');
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('Beam requests are temporarily held off');
    const remaining = deadline - this.now();
    if (remaining <= 0) throw new Error('Beam collection timed out');
    beamMapRequests[kind]++;
    let response: Response;
    try {
      response = await this.fetch(ORIGIN, { method: 'POST', redirect: 'error',
        headers: { 'Content-Type': 'application/json', latitude: String(center[0]), longitude: String(center[1]),
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(Math.min(this.timeoutMs, remaining)) });
    } catch { throw new Error('Beam request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : 0;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3600_000, delay || 0));
    }
    if (!response.ok) {
      await response.body?.cancel();
      if ([401, 403].includes(response.status)) throw new BeamAuthError();
      throw new Error(`Beam HTTP ${response.status}`);
    }
    const payload = object(await jsonBody(response, kind === 'metadata' ? 32_768 : 16 * 1024 * 1024));
    if (payload?.errors !== undefined) {
      if (Array.isArray(payload.errors) && payload.errors.some(error =>
        /^(unauthorized|unauthenticated|jwt expired)$/i.test(String(object(error)?.message)))) throw new BeamAuthError();
      throw new Error('Beam returned a GraphQL error');
    }
    const data = object(payload?.data);
    if (!data) throw new Error('Beam returned invalid GraphQL data');
    return data;
  }

  private async current(center: readonly number[], deadline: number, rejectedToken?: string): Promise<Session> {
    if (this.now() < this.retryAt) throw new Error('Beam authentication is temporarily unavailable');
    const session = await this.credentials();
    // Another reader may already have replaced the rejected token.
    if (session.authToken !== rejectedToken && tokenExpiry(session.authToken, session.userId) > this.now() + 300_000) return session;
    if (this.renewing) return this.renewing;
    this.renewing = (async () => {
      try {
        const result = await this.query('mutation($userId:Int,$refreshToken:String!) { refreshToken(userId:$userId,refreshToken:$refreshToken) { authToken refreshToken } }',
          { userId: session.userId, refreshToken: session.refreshToken }, center, undefined, 'metadata', deadline);
        const renewed = object(result.refreshToken);
        if (!credential(renewed?.authToken) || !credential(renewed.refreshToken) ||
          tokenExpiry(renewed.authToken, session.userId) <= this.now() + 300_000) throw new Error('Beam session renewal response is invalid');
        const next: Session = { version: 1, userId: session.userId, authToken: renewed.authToken, refreshToken: renewed.refreshToken };
        await this.save(next);
        return this.session = next;
      } catch (error) { this.retryAt = this.now() + RETRY_MS; throw error; }
      finally { this.renewing = undefined; }
    })();
    return this.renewing;
  }

  async vehicles(indexes: readonly string[], center: readonly number[], deadline = this.now() + 90_000): Promise<unknown> {
    if (!indexes.length || indexes.length > BATCH_SIZE || indexes.some(index => !/^88[0-9a-f]{13}$/.test(index)) ||
      center.length !== 2 || !center.every(Number.isFinite) || Math.abs(center[0]) > 85 || Math.abs(center[1]) > 180) {
      throw new Error('Invalid Beam map request');
    }
    const query = 'query($indexes:[String]!) { vehiclesByH3(indexes:$indexes) { id latitude longitude batteryLevel formFactor cityId } }';
    let session = await this.current(center, deadline);
    const read = () => this.query(query, { indexes }, center, session.authToken, 'status', deadline);
    let data: Record<string, unknown>;
    try { data = await read(); }
    catch (error) {
      if (!(error instanceof BeamAuthError)) throw error;
      session = await this.current(center, deadline, session.authToken);
      try { data = await read(); }
      catch (retryError) { if (retryError instanceof BeamAuthError) this.retryAt = this.now() + RETRY_MS; throw retryError; }
    }
    return data.vehiclesByH3;
  }
}

type BeamScooter = Vehicle & { vehicle_id: string };
/** The first field of a scooter Beam sent that fails parseBeamVehicles' checks, and its value, for the error. */
function invalidBeamField(v: Record<string, unknown>) {
  const field = !Number.isSafeInteger(v.id) || (v.id as number) <= 0 ? 'id' : !Number.isSafeInteger(v.cityId) ? 'cityId'
    : typeof v.latitude !== 'number' || !Number.isFinite(v.latitude) || Math.abs(v.latitude) > 85 ? 'latitude'
    : typeof v.longitude !== 'number' || !Number.isFinite(v.longitude) || Math.abs(v.longitude) > 180 ? 'longitude' : 'batteryLevel';
  return `${field} ${String(JSON.stringify(v[field])).slice(0, 20)}`;
}
export function parseBeamVehicles(payload: unknown, system: RegionalScooterSystem): BeamScooter[] {
  if (!Array.isArray(payload) || payload.length > 30_000) throw new Error('Invalid Beam vehicle list');
  const vehicles = new Map<string, BeamScooter>();
  for (const entry of payload) {
    const v = object(entry);
    if (!v || !['ESCOOTER', 'EBIKE', 'EMOPED', 'ESCOOTER_SEATED', ''].includes(String(v.formFactor))) throw new Error('Invalid Beam vehicle type');
    if (v.formFactor !== 'ESCOOTER') continue;
    if (!Number.isSafeInteger(v.id) || (v.id as number) <= 0 || !Number.isSafeInteger(v.cityId) ||
      typeof v.latitude !== 'number' || typeof v.longitude !== 'number' || !Number.isFinite(v.latitude) ||
      !Number.isFinite(v.longitude) || Math.abs(v.latitude) > 85 || Math.abs(v.longitude) > 180 ||
      !Number.isInteger(v.batteryLevel) || (v.batteryLevel as number) < 0 || (v.batteryLevel as number) > 100) {
      throw new Error(`Invalid Beam scooter ${invalidBeamField(v)}`);
    }
    if (v.cityId !== system.beamAppCity || !boundsContainPoint(system.bounds, v.latitude, v.longitude)) continue;
    const id = `beam:${v.id}`;
    vehicles.set(id, { provider: 'beam', vehicle_id: id, lat: v.latitude, lng: v.longitude,
      battery: v.batteryLevel as number, range_m: null, deep_link: null, distance_m: null });
  }
  return [...vehicles.values()];
}

let defaultClient: BeamClient | undefined;
export async function collectBeamRegion(system: RegionalScooterSystem,
  api: Pick<BeamClient, 'vehicles'> = defaultClient ??= new BeamClient()): Promise<SourceVehicles> {
  if (!Number.isSafeInteger(system.beamAppCity) || system.beamAppCity! <= 0) throw new Error('Not a Beam app map region');
  const observedAt = Date.now(), cells = beamRegionCells(system);
  const vehicles = new Map<string, BeamScooter>();
  for (let index = 0; index < cells.length; index += BATCH_SIZE) {
    const batch = await api.vehicles(cells.slice(index, index + BATCH_SIZE), system.center, observedAt + 90_000);
    for (const vehicle of parseBeamVehicles(batch, system)) vehicles.set(vehicle.vehicle_id, vehicle);
  }
  // Any failed batch aborts the sweep, preserving the city's previous complete snapshot.
  return { observedAt, stale: false, vehicles: [...vehicles.values()] };
}

export function withBeamAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.beamAppCity).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, paced: true, collect: () => collectBeamRegion(system) } : feed;
  });
}
