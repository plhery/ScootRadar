import { boundsIntersect } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { MapBounds, Vehicle } from '../src/lib/types';

const ORIGIN = 'https://live.api.gbike-api.com/api/v1/locations/markers';
const RETRY_MS = 60_000;
// The app's table of scooter models (SCT): ES4, MAX, MAXPro, K, MAXPlus, K2, MAXPlusX and K3.
// Its bicycles, and ids it doesn't list, as 10006 on some B4 bicycles, are left out.
const SCOOTER_MODELS = new Set([9, 10, 11, 12, 13, 16, 19, 23]);
// A box about 6.4 km across comes back as single vehicles and clusters; a quarter of one,
// 1.6 km or less, came back whole even in central Daejeon. The grid is fixed, so neighbouring
// towns, and a town's next collection, ask for the same boxes.
const TILE = { lat: 0.0576, lng: 0.0686 };
const QUARTERS = 4;
// Halvings of a quarter box that still holds clusters, down to about 400 m.
const SPLITS = 2;
const MAX_REQUESTS = 600;
// Shared between the towns of a collection round, never from one round to the next.
const CACHE_MS = 50_000;
export const gcooMapRequests = { status: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

interface GcooScooter { id: number; lat: number; lng: number; battery: number | null; range_m: number | null }
export interface GcooMarkers { vehicles: GcooScooter[]; clusters: { lat: number; lng: number }[] }
type TimedMarkers = GcooMarkers & { at: number };
interface ClientOptions { fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('GCOO returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('GCOO response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('GCOO returned invalid JSON'); }
}

/** The map's markers: idle scooters, and the clusters standing for vehicles a box too wide leaves out. */
export function parseGcooMarkers(payload: unknown): GcooMarkers {
  const data = object(payload);
  const list = object(data?.response)?.list;
  if (data?.result_code !== 0 || !Array.isArray(list) || list.length > 50_000) throw new Error('Invalid GCOO map response');
  const markers: GcooMarkers = { vehicles: [], clusters: [] };
  for (const entry of list) {
    const marker = object(entry);
    if (!marker) throw new Error('Invalid GCOO marker');
    const model = object(marker.model_info);
    // Discount parking spots and charging stations have no model.
    if (!model) continue;
    const { lat, lng } = marker;
    if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new Error('Invalid GCOO marker');
    if (model.type === 'cluster') {
      if (!Number.isSafeInteger(marker.count) || (marker.count as number) < 1) throw new Error('Invalid GCOO cluster');
      markers.clusters.push({ lat, lng });
      continue;
    }
    if (!Number.isSafeInteger(marker.id) || !Number.isSafeInteger(model.id)) throw new Error('Invalid GCOO marker');
    if (!SCOOTER_MODELS.has(model.id as number) || marker.gcooter_status !== 'IDLE' || marker.is_activated !== true) continue;
    const battery = typeof marker.battery === 'number' && Number.isInteger(marker.battery) &&
      marker.battery >= 0 && marker.battery <= 100 ? marker.battery : null;
    const distance = object(marker.movable_distance_info);
    const range = distance?.unit === 'km' && typeof distance.value === 'number' && Number.isFinite(distance.value) &&
      distance.value >= 0 && distance.value <= 200 ? Math.round(distance.value * 1000) : null;
    markers.vehicles.push({ id: marker.id as number, lat, lng, battery, range_m: range });
  }
  return markers;
}

export class GcooClient {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, { at: number; markers: Promise<TimedMarkers> }>();
  private nextStart = 0;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 250;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  /** The markers in a box, with when they were asked for: from a request of the last 50 seconds if there was one. */
  markers(box: MapBounds): Promise<TimedMarkers> {
    const query = new URLSearchParams({ min_lat: box.south.toFixed(6), min_lng: box.west.toFixed(6),
      max_lat: box.north.toFixed(6), max_lng: box.east.toFixed(6), cluster_number: '100000' });
    const url = `${ORIGIN}?${query}`;
    const now = this.now();
    for (const [key, entry] of this.cache) if (now - entry.at > CACHE_MS) this.cache.delete(key);
    const cached = this.cache.get(url);
    if (cached) return cached.markers;
    const markers = this.read(url);
    this.cache.set(url, { at: now, markers });
    markers.catch(() => { if (this.cache.get(url)?.markers === markers) this.cache.delete(url); });
    return markers;
  }

  private async read(url: string): Promise<TimedMarkers> {
    if (this.now() < this.blockedUntil) throw new Error('GCOO is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('GCOO is temporarily rate limited');
    gcooMapRequests.status++;
    const at = this.now();
    let response: Response;
    // Its firewall turns away some default user agents, Python's among them.
    try {
      response = await this.fetch(url, { headers: { 'User-Agent': 'okhttp/4.12.0', Accept: 'application/json' },
        redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('GCOO request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`GCOO map HTTP ${response.status}`);
    }
    return { ...parseGcooMarkers(await jsonBody(response, 16 * 1024 * 1024)), at };
  }
}

/** The boxes of the fixed grid that meet the bounds. */
export function gcooTiles(bounds: MapBounds): MapBounds[] {
  const tiles: MapBounds[] = [];
  for (let row = Math.floor(bounds.south / TILE.lat); row * TILE.lat < bounds.north; row++) {
    for (let column = Math.floor(bounds.west / TILE.lng); column * TILE.lng < bounds.east; column++) {
      tiles.push({ south: row * TILE.lat, north: (row + 1) * TILE.lat, west: column * TILE.lng, east: (column + 1) * TILE.lng });
    }
  }
  return tiles;
}

function split(box: MapBounds, parts: number): MapBounds[] {
  const height = (box.north - box.south) / parts, width = (box.east - box.west) / parts;
  return Array.from({ length: parts * parts }, (_, index) => {
    const row = Math.floor(index / parts), column = index % parts;
    return { south: box.south + row * height, north: box.south + (row + 1) * height,
      west: box.west + column * width, east: box.west + (column + 1) * width };
  });
}

/**
 * Every idle scooter in the bounds: each tile of the grid, then the quarters of a tile
 * near the clusters it returned, halved again where clusters remain. A cluster's
 * vehicles can stand a little beyond its centre, so a quarter is read when a cluster
 * is within half a quarter's width of it.
 */
export async function collectGcooScooters(bounds: MapBounds, api: Pick<GcooClient, 'markers'>) {
  const vehicles = new Map<number, GcooScooter>();
  let requests = 0, observedAt = Infinity;
  const read = async (box: MapBounds) => {
    if (++requests > MAX_REQUESTS) throw new Error('GCOO map exceeds the collection budget');
    const markers = await api.markers(box);
    observedAt = Math.min(observedAt, markers.at);
    for (const vehicle of markers.vehicles) vehicles.set(vehicle.id, vehicle);
    return markers.clusters;
  };
  const near = (box: MapBounds, clusters: GcooMarkers['clusters'], margin: number) => {
    const height = (box.north - box.south) * margin, width = (box.east - box.west) * margin;
    return clusters.some(({ lat, lng }) => lat >= box.south - height && lat <= box.north + height &&
      lng >= box.west - width && lng <= box.east + width);
  };
  const leaf = async (box: MapBounds, splits: number): Promise<void> => {
    const clusters = await read(box);
    if (!clusters.length) return;
    if (!splits) throw new Error('GCOO map still clusters at the smallest box');
    for (const part of split(box, 2)) {
      if (boundsIntersect(part, bounds) && near(part, clusters, 0.5)) await leaf(part, splits - 1);
    }
  };
  for (const tile of gcooTiles(bounds)) {
    const clusters = await read(tile);
    if (!clusters.length) continue;
    for (const quarter of split(tile, QUARTERS)) {
      if (boundsIntersect(quarter, bounds) && near(quarter, clusters, 0.5)) await leaf(quarter, SPLITS);
    }
  }
  return { observedAt, requests, scooters: [...vehicles.values()] };
}

const client = new GcooClient();
export async function collectGcooRegion(system: RegionalScooterSystem, api: Pick<GcooClient, 'markers'> = client): Promise<SourceVehicles> {
  if (!system.gcooAppMap) throw new Error('Not a GCOO app map region');
  const { observedAt, scooters } = await collectGcooScooters(system.bounds, api);
  const vehicles: Vehicle[] = scooters.filter(scooter => systemServesPoint(system, scooter.lat, scooter.lng)).map(scooter => ({
    // By the operator's own id, so a scooter where two towns' bounds overlap is shown once.
    provider: system.provider, vehicle_id: `gcoo:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
    battery: scooter.battery, range_m: scooter.range_m, deep_link: null, distance_m: null,
  }));
  return { observedAt, stale: false, vehicles };
}

export function withGcooAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.gcooAppMap).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, collect: () => collectGcooRegion(system) } : feed;
  });
}
