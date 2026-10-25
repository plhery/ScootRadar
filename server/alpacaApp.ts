import { boundsIntersection } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { Pacer, SweepProgress, nearestFirst } from './sweeps';

const ORIGIN = 'https://alpaca.maasasia.com/graphql';
// The app's map queries, signed out, with each vehicle's type rather than the app's own table of models.
const VEHICLE_QUERY = 'query GetRidableVehicle($center: GeoJSONPoint!) { ridableVehicles(center: $center) ' +
  '{ id vehicleModel { id vehicleType { name } } vehicleCurrentStatus { batteryPercentage coordinate } } }';
const CLUSTER_QUERY = 'query GetRidableCluster($size: Float!) { ridableVehicleClusters(size: $size) { id coordinate } }';
const RETRY_MS = 60_000;
// The map answers with every ridable vehicle within 0.017 degrees of the point, latitude and longitude
// counted alike: about 1.89 km north and south, and 1.39 to 1.56 km east and west in Korea. A
// vehicle 0.01699 degrees away came back, none 0.01701 or more, on 25 October 2026, and none farther
// than 0.016999 in a sweep of the whole country. No cap was seen, up to 393 vehicles in one reply.
const REACH = 0.017;
// A vehicle farther than this means the map no longer reads the circle the cells are drawn for.
const REACH_TOLERANCE = 0.0005;
// Square cells 0.023 degrees across, read at their centres: their corners are 0.01626 degrees from
// the centre, inside the reach with 0.0007 degrees, 60 m or more, to spare. The grid is fixed, so
// neighbouring towns, and a town's next collection, ask for the same points.
export const ALPACA_CELL = 0.023;
// The app's clusters, of the whole country in one reply, snap every ridable vehicle to a grid of this
// many degrees, rounded from 0, and give each occupied square one point inside it: 3,111 points
// (253 kB) at 01:23 Korea time on 26 October 2026. Only the cells that meet an occupied square are
// read: 456 for the 29 towns then, against 1,139 for the whole of their bounds.
export const ALPACA_CLUSTER = 0.003;
// How far beyond its square a cluster's vehicles may stand: on its edge, which the server rounds to
// even, or moved a few metres since. One vehicle 3 m from its cluster's square was seen.
const CLUSTER_MARGIN = 0.0005;
const MAX_REQUESTS = 200;
// Shared between the towns of a collection round, never from one round to the next.
const CACHE_MS = 50_000;
export const alpacaMapRequests = { status: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

interface AlpacaScooter { id: string; lat: number; lng: number; battery: number | null }
interface AlpacaPoint { lat: number; lng: number }
type Timed<T> = { at: number } & T;
export interface AlpacaCell { lat: number; lng: number; bounds: MapBounds }
interface ClientOptions { fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Alpaca returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Alpaca response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Alpaca returned invalid JSON'); }
}

/** A GeoJSON point of the map, as latitude and longitude, or undefined. */
function point(value: unknown): AlpacaPoint | undefined {
  const geometry = object(value);
  const [lng, lat] = Array.isArray(geometry?.coordinates) ? geometry.coordinates : [];
  return geometry?.type === 'Point' && typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) &&
    Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : undefined;
}

/** The query's list in a reply, which must answer without errors. */
function list(payload: unknown, field: string): unknown[] {
  const data = object(payload);
  const entries = object(data?.data)?.[field];
  if (data?.errors !== undefined || !Array.isArray(entries) || entries.length > 50_000) throw new Error('Invalid Alpaca map response');
  return entries;
}

/**
 * The ridable kickboards of a read around a point; its e-bikes (E_BIKE) are left out. A vehicle
 * beyond the map's known reach fails the read, as the cells would no longer fit the circle it reads.
 */
export function parseAlpacaScooters(payload: unknown, lat: number, lng: number): AlpacaScooter[] {
  const scooters: AlpacaScooter[] = [];
  for (const entry of list(payload, 'ridableVehicles')) {
    const vehicle = object(entry);
    const status = object(vehicle?.vehicleCurrentStatus);
    const position = point(status?.coordinate);
    const type = object(object(vehicle?.vehicleModel)?.vehicleType)?.name;
    // GraphQL ids are strings: "14912".
    if (!vehicle || typeof vehicle.id !== 'string' || !/^\d{1,16}$/.test(vehicle.id) || !position || typeof type !== 'string') {
      throw new Error('Invalid Alpaca vehicle');
    }
    if (Math.hypot(position.lat - lat, position.lng - lng) > REACH + REACH_TOLERANCE) throw new Error('Alpaca map read beyond its known reach');
    if (type !== 'KICKBOARD') continue;
    const level = status!.batteryPercentage;
    const battery = typeof level === 'number' && Number.isInteger(level) && level >= 0 && level <= 100 ? level : null;
    scooters.push({ id: vehicle.id, ...position, battery });
  }
  return scooters;
}

/** The points of the map's clusters. None at all, for a whole country's fleet, fails the read rather than leave every town empty. */
export function parseAlpacaClusters(payload: unknown): AlpacaPoint[] {
  const clusters = list(payload, 'ridableVehicleClusters').map(entry => {
    const position = point(object(entry)?.coordinate);
    if (!position) throw new Error('Invalid Alpaca cluster');
    return position;
  });
  if (!clusters.length) throw new Error('Alpaca map lists no vehicles');
  return clusters;
}

export class AlpacaClient {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, { at: number; read: Promise<unknown> }>();
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? 500, this.now);
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  /** The kickboards within the map's reach of a point, with when they were asked for: from a request of the last 50 seconds if there was one. */
  scooters(lat: number, lng: number): Promise<Timed<{ scooters: AlpacaScooter[] }>> {
    const [y, x] = [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
    return this.cached(`${y},${x}`, async () => {
      const { at, payload } = await this.post({ operationName: 'GetRidableVehicle', query: VEHICLE_QUERY,
        variables: { center: { type: 'Point', coordinates: [x, y] } } }, 16 * 1024 * 1024);
      return { at, scooters: parseAlpacaScooters(payload, y, x) };
    });
  }

  /** Where the country's ridable vehicles stand, one point for each occupied square of the clusters' grid. */
  clusters(): Promise<Timed<{ clusters: AlpacaPoint[] }>> {
    return this.cached('clusters', async () => {
      const { at, payload } = await this.post({ operationName: 'GetRidableCluster', query: CLUSTER_QUERY,
        variables: { size: ALPACA_CLUSTER } }, 32 * 1024 * 1024);
      return { at, clusters: parseAlpacaClusters(payload) };
    });
  }

  private cached<T>(key: string, read: () => Promise<T>): Promise<T> {
    const now = this.now();
    for (const [cached, entry] of this.cache) if (now - entry.at > CACHE_MS) this.cache.delete(cached);
    const cached = this.cache.get(key);
    if (cached) return cached.read as Promise<T>;
    const reading = read();
    this.cache.set(key, { at: now, read: reading });
    reading.catch(() => { if (this.cache.get(key)?.read === reading) this.cache.delete(key); });
    return reading;
  }

  private async post(body: object, maxBytes: number): Promise<{ at: number; payload: unknown }> {
    if (this.now() < this.blockedUntil) throw new Error('Alpaca is temporarily rate limited');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Alpaca is temporarily rate limited');
    alpacaMapRequests.status++;
    const at = this.now();
    let response: Response;
    // As the app asks signed out: no key, and an empty authorization.
    try {
      response = await this.fetch(ORIGIN, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json',
        'Accept-Language': 'ko', Authorization: '', 'User-Agent': 'okhttp/4.12.0' },
      body: JSON.stringify(body), redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('Alpaca request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Alpaca map HTTP ${response.status}`);
    }
    return { at, payload: await jsonBody(response, maxBytes) };
  }
}

/** The squares of the clusters' grid that a cluster's vehicles may stand in, with the margin: both sides of an edge it is near. */
function occupied(cluster: AlpacaPoint): MapBounds {
  const square = (degrees: number) => [Math.round((degrees - CLUSTER_MARGIN) / ALPACA_CLUSTER) - 0.5, Math.round((degrees + CLUSTER_MARGIN) / ALPACA_CLUSTER) + 0.5]
    .map((edge, side) => edge * ALPACA_CLUSTER + (side ? CLUSTER_MARGIN : -CLUSTER_MARGIN));
  const [south, north] = square(cluster.lat);
  const [west, east] = square(cluster.lng);
  return { south, north, west, east };
}

/**
 * The cells of the fixed grid, each read at its centre, that meet a square of the clusters' grid
 * where vehicles stand within the bounds: every ridable vehicle in the bounds is within reach of one.
 */
export function alpacaCells(bounds: MapBounds, clusters: readonly AlpacaPoint[]): AlpacaCell[] {
  const cells = new Map<string, AlpacaCell>();
  for (const cluster of clusters) {
    const area = boundsIntersection(occupied(cluster), bounds);
    if (!area) continue;
    for (let row = Math.floor(area.south / ALPACA_CELL); row * ALPACA_CELL <= area.north; row++) {
      for (let column = Math.floor(area.west / ALPACA_CELL); column * ALPACA_CELL <= area.east; column++) {
        if (cells.has(`${row},${column}`)) continue;
        const cell = { south: row * ALPACA_CELL, north: (row + 1) * ALPACA_CELL, west: column * ALPACA_CELL, east: (column + 1) * ALPACA_CELL };
        cells.set(`${row},${column}`, { lat: (cell.south + cell.north) / 2, lng: (cell.west + cell.east) / 2, bounds: cell });
      }
    }
  }
  return [...cells.values()];
}

const client = new AlpacaClient();
/**
 * Every ridable kickboard in the system's bounds: the country's clusters, then each cell that meets
 * one, those nearest where people look first (sweeps.ts).
 */
export async function collectAlpacaRegion(system: RegionalScooterSystem, api: Pick<AlpacaClient, 'scooters' | 'clusters'> = client): Promise<SourceVehicles> {
  if (!system.alpacaAppMap) throw new Error('Not an Alpaca app map region');
  const map = await api.clusters();
  const cells = alpacaCells(system.bounds, map.clusters);
  if (cells.length > MAX_REQUESTS) throw new Error('Alpaca map exceeds the collection budget');
  const published = (scooters: Iterable<AlpacaScooter>): Vehicle[] => [...scooters]
    .filter(scooter => systemServesPoint(system, scooter.lat, scooter.lng)).map(scooter => ({
      // By the operator's own id, so a scooter where two towns' bounds overlap is shown once.
      provider: system.provider, vehicle_id: `alpaca:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
      battery: scooter.battery, range_m: null, deep_link: null, distance_m: null,
    }));
  const found = new Map<string, AlpacaScooter>();
  const progress = new SweepProgress(() => published(found.values()));
  let observedAt = map.at;
  for (const cell of nearestFirst(cells, cell => cell.bounds)) {
    const read = await api.scooters(cell.lat, cell.lng);
    observedAt = Math.min(observedAt, read.at);
    for (const scooter of read.scooters) found.set(scooter.id, scooter);
    progress.done(cell.bounds);
  }
  return { observedAt, stale: false, vehicles: published(found.values()) };
}

export function withAlpacaAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.alpacaAppMap).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, paced: true, collect: () => collectAlpacaRegion(system) } : feed;
  });
}
