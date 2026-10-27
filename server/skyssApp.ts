import { createHmac, randomBytes } from 'node:crypto';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { Pacer, SweepProgress, takeNearest } from './sweeps';

const ORIGIN = 'https://cosmo-router.transhub.io/graphql';
// What Skyss's app, no.skyss.planner 7.102.0 (40013), sends signed out: the router refuses a
// request without its platform, and answers this one with no account, key or cookie.
const HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json', 'client-platform': 'android',
  'client-version': '7.102.0', 'client-build-date': '1790928393', 'owner-id': 'SKYSS', 'accept-language': 'en' };
const SERVICES = 'query mobilityServices { mobilityServices_v2 { services { zone vendor type status } } }';
const NEARBY = 'query nearbyEVehicles($northWest: LocationInput!, $southEast: LocationInput!, $vendors: [Vendor_v2!]!, ' +
  '$rentalProductTypes: [RentalProductType!]!) { nearbyVehicles_v4(vendors: $vendors, northwest: $northWest, ' +
  'southeast: $southEast, rentalProductTypes: $rentalProductTypes) { __typename id vendor lat lon type } }';
// Skyss's map shows Ryde's Bergen scooters, and Voi's, which Voi's own map gives (voiApp.ts).
const VENDOR = 'RYDE';
// A box lists 500 scooters at most, and says nothing when it leaves some out; one of 499 or fewer
// listed every scooter its quarters did on 27 October 2026.
const FULL = 500;
// The largest box asked for, about 9 by 6.5 km: Bergen's bounds are three by two of them.
const TILE = { lat: 0.08, lng: 0.12 };
// Quarters of a full box, down to about 280 m by 210: 500 scooters there is a map gone wrong.
const MAX_DEPTH = 5;
// A round of Bergen took 27 requests, in 26 seconds, at midnight on 28 October 2026, for 4,679 scooters.
const MAX_REQUESTS = 120;
const RETRY_MS = 60_000;
// Ryde's links to a scooter, as its feeds elsewhere in Norway give them once their IMEI is dropped
// (rentalLinks.ts): the page opens Ryde's app, or its store.
const RENTAL_URIS = { ios: 'https://new-web-platform.ryde.vip/app/ios.html',
  android: 'https://new-web-platform.ryde.vip/app/android.html', web: null };
// Skyss names each scooter by its IMEI, as Ryde's links do: the map's ids are a hash of it, keyed
// by this process, as Swing's are by its key (swingApp.ts), so no IMEI is stored or shown. An id
// lasts as long as the process.
const ID_KEY = randomBytes(32);
export const skyssMapRequests = { status: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

export interface SkyssScooter { id: string; lat: number; lng: number }
export interface SkyssView { scooters: SkyssScooter[]; full: boolean }
type Timed<T> = T & { at: number };
interface ClientOptions { fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Skyss returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Skyss response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Skyss returned invalid JSON'); }
}

/** The data of a GraphQL reply, which fails on any error rather than read part of an answer. */
function data(payload: unknown): Record<string, unknown> {
  const reply = object(payload);
  const result = object(reply?.data);
  if (!result || (reply!.errors !== undefined && (!Array.isArray(reply!.errors) || reply!.errors.length))) {
    throw new Error('Invalid Skyss response');
  }
  return result;
}

/**
 * The status Skyss gives Ryde's scooter service in the zone: NORMAL_SERVICE, LIMITED_SERVICE or
 * TEMPORARILY_UNAVAILABLE in its app. A zone it lists no such service in fails the read.
 */
export function parseSkyssService(payload: unknown, zone: string): string {
  const groups = data(payload).mobilityServices_v2;
  if (!Array.isArray(groups) || groups.length > 100) throw new Error('Invalid Skyss services');
  const services = groups.flatMap(group => {
    const list = object(group)?.services;
    if (!Array.isArray(list) || list.length > 100) throw new Error('Invalid Skyss services');
    return list.map(object);
  });
  const service = services.find(entry => entry?.zone === zone && entry.vendor === VENDOR && entry.type === 'ESCOOTER');
  if (typeof service?.status !== 'string') throw new Error(`Skyss lists no Ryde scooters in ${zone}`);
  return service.status;
}

/**
 * Ryde's scooters in a box, and whether the box listed as many as one can. Rows outside it are
 * left out: the router pads a box, and gave 31 of 246 outside a wide one. The rows give no
 * battery, range or time: 16 of a round's scooters, read one by one, could all be rented, with
 * 33 to 93% charge.
 */
export function parseSkyssView(payload: unknown, box: MapBounds): SkyssView {
  const rows = data(payload).nearbyVehicles_v4;
  if (!Array.isArray(rows) || rows.length > 5_000) throw new Error('Invalid Skyss map response');
  const scooters: SkyssScooter[] = [];
  for (const entry of rows) {
    const row = object(entry);
    const { id, lat, lon: lng } = row ?? {};
    if (row?.__typename !== 'VehicleDetailsLite' || row.vendor !== VENDOR || row.type !== 'ESCOOTER' ||
      typeof id !== 'string' || !/^\d{1,32}$/.test(id) || typeof lat !== 'number' || typeof lng !== 'number' ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Invalid Skyss vehicle');
    }
    if (lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east) scooters.push({ id, lat, lng });
  }
  return { scooters, full: rows.length >= FULL };
}

export class SkyssClient {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? 1_000, this.now);
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  /** The status of Ryde's scooter service in the zone, with when it was asked for. */
  async service(zone: string): Promise<Timed<{ status: string }>> {
    const { at, payload } = await this.post({ query: SERVICES, operationName: 'mobilityServices', variables: {} });
    return { at, status: parseSkyssService(payload, zone) };
  }

  /** Ryde's scooters in a box, with when they were asked for. */
  async view(box: MapBounds): Promise<Timed<SkyssView>> {
    const variables = { northWest: { latitude: box.north, longitude: box.west }, southEast: { latitude: box.south, longitude: box.east },
      vendors: [VENDOR], rentalProductTypes: ['ESCOOTER'] };
    const { at, payload } = await this.post({ query: NEARBY, operationName: 'nearbyEVehicles', variables });
    return { at, ...parseSkyssView(payload, box) };
  }

  private async post(body: object): Promise<{ at: number; payload: unknown }> {
    if (this.now() < this.blockedUntil) throw new Error('Skyss is temporarily rate limited');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('Skyss is temporarily rate limited');
    skyssMapRequests.status++;
    const at = this.now();
    let response: Response;
    try {
      response = await this.fetch(ORIGIN, { method: 'POST', headers: HEADERS, body: JSON.stringify(body),
        redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('Skyss request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Skyss map HTTP ${response.status}`);
    }
    return { at, payload: await jsonBody(response, 4 * 1024 * 1024) };
  }
}

/** The bounds cut into equal boxes no larger than a tile, give or take floating point: 0.24° of longitude is two. */
export function skyssTiles(bounds: MapBounds): MapBounds[] {
  const count = (degrees: number, tile: number) => Math.max(1, Math.ceil(degrees / tile - 1e-9));
  return split(bounds, count(bounds.north - bounds.south, TILE.lat), count(bounds.east - bounds.west, TILE.lng));
}

function split(box: MapBounds, rows: number, columns: number): MapBounds[] {
  const height = (box.north - box.south) / rows, width = (box.east - box.west) / columns;
  return Array.from({ length: rows * columns }, (_, index) => {
    const row = Math.floor(index / columns), column = index % columns;
    return { south: box.south + row * height, north: box.south + (row + 1) * height,
      west: box.west + column * width, east: box.west + (column + 1) * width };
  });
}

/** A sweep's scooters as it finds them, and a call for each box it finishes. */
interface SkyssSweep { found: Map<string, SkyssScooter>; done(box: MapBounds): void }

/**
 * Every scooter in the bounds: each tile, then the quarters of a box that listed as many as one
 * can, the boxes nearest where people look first (sweeps.ts). The rows of a full box are kept, as
 * its quarters list them again.
 */
export async function collectSkyssScooters(bounds: MapBounds, api: Pick<SkyssClient, 'view'>, sweep?: SkyssSweep) {
  const found = sweep?.found ?? new Map<string, SkyssScooter>();
  const queue = skyssTiles(bounds).map(box => ({ box, depth: 0 }));
  let requests = 0, observedAt = Infinity;
  for (let next = takeNearest(queue, view => view.box); next; next = takeNearest(queue, view => view.box)) {
    if (++requests > MAX_REQUESTS) throw new Error('Skyss map exceeds the collection budget');
    const view = await api.view(next.box);
    observedAt = Math.min(observedAt, view.at);
    for (const scooter of view.scooters) found.set(scooter.id, scooter);
    if (!view.full) {
      sweep?.done(next.box);
      continue;
    }
    if (next.depth >= MAX_DEPTH) throw new Error('Skyss map is still full at the smallest box');
    queue.push(...split(next.box, 2, 2).map(box => ({ box, depth: next!.depth + 1 })));
  }
  return { observedAt, requests, scooters: [...found.values()] };
}

const client = new SkyssClient();
/**
 * Ryde's scooters in the system's zone, from Skyss's app map, which shows them signed out: the
 * service's status, then a sweep of the bounds. A service Skyss calls temporarily unavailable has
 * no scooter to rent, and is not swept.
 */
export async function collectSkyssRegion(system: RegionalScooterSystem, api: Pick<SkyssClient, 'service' | 'view'> = client): Promise<SourceVehicles> {
  if (!system.skyssAppZone || system.provider !== 'ryde') throw new Error('Not a Skyss app map region');
  const service = await api.service(system.skyssAppZone);
  if (service.status === 'TEMPORARILY_UNAVAILABLE') return { observedAt: service.at, stale: false, vehicles: [] };
  const published = (scooters: Iterable<SkyssScooter>): Vehicle[] => [...scooters]
    .filter(scooter => systemServesPoint(system, scooter.lat, scooter.lng)).map(scooter => ({
      provider: system.provider, vehicle_id: `skyss:${createHmac('sha256', ID_KEY).update(scooter.id).digest('base64url').slice(0, 16)}`,
      lat: scooter.lat, lng: scooter.lng, battery: null, range_m: null, deep_link: null, rental_uris: RENTAL_URIS, distance_m: null,
    }));
  const found = new Map<string, SkyssScooter>();
  const progress = new SweepProgress(() => published(found.values()));
  const { observedAt, scooters } = await collectSkyssScooters(system.bounds, api, { found, done: box => progress.done(box) });
  return { observedAt: Math.min(service.at, observedAt), stale: false, vehicles: published(scooters) };
}

/** Collected every two hours while nobody looks, as the other app maps, to spare Skyss's server. */
export function withSkyssAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.skyssAppZone).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, paced: true, collect: () => collectSkyssRegion(system) } : feed;
  });
}
