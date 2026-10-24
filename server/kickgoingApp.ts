import { haversineM } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { MapBounds, Vehicle } from '../src/lib/types';

const ORIGIN = 'https://api.kickgoing.io/v4/kickscooters';
const APP_VERSION = '2.11.23';
const RETRY_MS = 60_000;
// At zoom 15 the map answers with every vehicle within 2.4 km of the point it is asked
// about, with no cap, and `map_radius` 1500; at zoom 14 and below, with clusters only.
// Cells 3.1 km tall and at most 3.36 km wide (south of Jeju) fit inside that circle.
const ZOOM = 15;
const RADIUS_M = 2400;
const CELL = { lat: 0.02788, lng: 0.036 };
const MAX_REQUESTS = 300;
// Kickgoing's and Xingxing's systems of a town read the same cells.
const CACHE_MS = 50_000;
export const kickgoingMapRequests = { status: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

/** The operators whose scooters Kickgoing's map shows: its own and its ally Xingxing's. */
export type KickgoingProvider = 'kickgoing' | 'xingxing';
interface KickgoingScooter { id: string; provider: KickgoingProvider; lat: number; lng: number; battery: number | null }
interface Cell { lat: number; lng: number; bounds: MapBounds }
type TimedScooters = { scooters: KickgoingScooter[]; at: number };
interface ClientOptions { fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Kickgoing returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Kickgoing response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Kickgoing returned invalid JSON'); }
}

/** The standing scooters of a zoom-15 read; its bikes, and TMAP's, are left out. */
export function parseKickgoingScooters(payload: unknown): KickgoingScooter[] {
  const data = object(payload);
  // Another radius, or clusters, would leave parts of a cell unread.
  if (!Array.isArray(data?.kickscooters) || data.kickscooters.length > 50_000 || data.map_radius !== 1500 ||
    !Array.isArray(data.clustered_kickscooters) || data.clustered_kickscooters.length) throw new Error('Invalid Kickgoing map response');
  const scooters: KickgoingScooter[] = [];
  for (const entry of data.kickscooters) {
    const vehicle = object(entry);
    const { lat, lng } = vehicle ?? {};
    // Kickgoing's ids are numbers; some of Xingxing's are hexadecimal strings.
    const id = Number.isSafeInteger(vehicle?.id) ? String(vehicle!.id) : vehicle?.id;
    if (!vehicle || typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(id) || typeof lat !== 'number' || typeof lng !== 'number' ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 ||
      typeof vehicle.mobility_type !== 'string' || typeof vehicle.provider !== 'string') throw new Error('Invalid Kickgoing vehicle');
    if (vehicle.mobility_type !== 'kickboard' || (vehicle.provider !== 'kickgoing' && vehicle.provider !== 'xingxing')) continue;
    const battery = typeof vehicle.battery_rate === 'number' && Number.isInteger(vehicle.battery_rate) &&
      vehicle.battery_rate >= 0 && vehicle.battery_rate <= 100 ? vehicle.battery_rate : null;
    scooters.push({ id, provider: vehicle.provider, lat, lng, battery });
  }
  return scooters;
}

export class KickgoingClient {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, { at: number; scooters: Promise<TimedScooters> }>();
  private nextStart = 0;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 300;
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  /** The scooters within 2.4 km of a point, with when they were asked for: from a request of the last 50 seconds if there was one. */
  scooters(lat: number, lng: number): Promise<TimedScooters> {
    const query = new URLSearchParams({ version: APP_VERSION, lat: lat.toFixed(6), lng: lng.toFixed(6),
      zoom: String(ZOOM), alliance: 'kickgoing', mobility: 'kickboard' });
    const url = `${ORIGIN}?${query}`;
    const now = this.now();
    for (const [key, entry] of this.cache) if (now - entry.at > CACHE_MS) this.cache.delete(key);
    const cached = this.cache.get(url);
    if (cached) return cached.scooters;
    const scooters = this.read(url);
    this.cache.set(url, { at: now, scooters });
    scooters.catch(() => { if (this.cache.get(url)?.scooters === scooters) this.cache.delete(url); });
    return scooters;
  }

  private async read(url: string): Promise<TimedScooters> {
    if (this.now() < this.blockedUntil) throw new Error('Kickgoing is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('Kickgoing is temporarily rate limited');
    kickgoingMapRequests.status++;
    const at = this.now();
    let response: Response;
    try {
      response = await this.fetch(url, { headers: { 'User-Agent': 'okhttp/4.12.0', Accept: 'application/json' },
        redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('Kickgoing request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Kickgoing map HTTP ${response.status}`);
    }
    return { scooters: parseKickgoingScooters(await jsonBody(response, 32 * 1024 * 1024)), at };
  }
}

/** The cells of the fixed grid that meet the bounds, each read at its centre. */
export function kickgoingCells(bounds: MapBounds): Cell[] {
  const cells: Cell[] = [];
  for (let row = Math.floor(bounds.south / CELL.lat); row * CELL.lat < bounds.north; row++) {
    for (let column = Math.floor(bounds.west / CELL.lng); column * CELL.lng < bounds.east; column++) {
      const cell = { south: row * CELL.lat, north: (row + 1) * CELL.lat, west: column * CELL.lng, east: (column + 1) * CELL.lng };
      const lat = (cell.south + cell.north) / 2, lng = (cell.west + cell.east) / 2;
      if (haversineM(lat, lng, cell.north, cell.east) > RADIUS_M - 50) throw new Error('Kickgoing cell exceeds the map radius');
      cells.push({ lat, lng, bounds: cell });
    }
  }
  return cells;
}

const client = new KickgoingClient();
export async function collectKickgoingRegion(system: RegionalScooterSystem,
  api: Pick<KickgoingClient, 'scooters'> = client): Promise<SourceVehicles> {
  if (!system.kickgoingAppMap || (system.provider !== 'kickgoing' && system.provider !== 'xingxing')) {
    throw new Error('Not a Kickgoing app map region');
  }
  const cells = kickgoingCells(system.bounds);
  if (cells.length > MAX_REQUESTS) throw new Error('Kickgoing map exceeds the collection budget');
  const scooters = new Map<string, KickgoingScooter>();
  let observedAt = Infinity;
  for (const cell of cells) {
    const read = await api.scooters(cell.lat, cell.lng);
    observedAt = Math.min(observedAt, read.at);
    for (const scooter of read.scooters) if (scooter.provider === system.provider) scooters.set(scooter.id, scooter);
  }
  const vehicles: Vehicle[] = [...scooters.values()].filter(scooter => systemServesPoint(system, scooter.lat, scooter.lng)).map(scooter => ({
    // By the operator's own id, so a scooter where two towns' bounds overlap is shown once.
    provider: system.provider, vehicle_id: `${system.provider}:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
    battery: scooter.battery, range_m: null, deep_link: null, distance_m: null,
  }));
  return { observedAt, stale: false, vehicles };
}

export function withKickgoingAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.kickgoingAppMap).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, collect: () => collectKickgoingRegion(system) } : feed;
  });
}
