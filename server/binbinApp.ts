import areaCatalog from '../data/binbin-areas.json';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { planNearestSweep, sweepNearestArea, type NearestMap, type NearestSweep, type SweepLimits } from './nearestSweep';
import { Pacer, SweepProgress } from './sweeps';

const ORIGIN = 'https://gatewayapi-sp.binbinapp.com';
const LIST_PATH = '/binbin/api/v1/vehicles/list';
/** The app's map list holds the ten vehicles nearest its point, closest first, and never more. */
export const BINBIN_PAGE = 10;
/**
 * How far a request reaches. Where fewer than ten scooters are within it, one request
 * answers for all of it; farther, a lat/lng cell drifts from the circle round its middle.
 */
export const BINBIN_REACH_M = 15_000;
const RETRY_MS = 60_000;
/**
 * A deploy runs the new cache beside the old one, for up to 90 seconds over the 55 deploys of 23
 * to 26 October 2026, each client at its own four requests a second. On 26 October BinBin answered
 * 429 80 seconds into one, as both swept, and refused the server for about an hour. A starting
 * cache sends its first BinBin request after this, once the old one has stopped, as ATOM's does.
 */
export const BINBIN_START_HOLD_MS = 120_000;
/** An area nobody looks at is swept every two hours: a round of all 13 takes thousands of requests. */
export const BINBIN_IDLE_INTERVAL_MS = APP_MAP_IDLE_INTERVAL_MS;
export const binbinMapRequests = { status: 0, metadata: 0 };

export interface BinbinScooter { id: string; lat: number; lng: number; battery: number | null }
/** A reply, and how far from its point it lists every scooter: its whole radius, or up to its tenth. */
export interface BinbinReply { scooters: BinbinScooter[]; completeM: number }
interface ClientOptions { fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number; startHoldMs?: number }
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
/** A failure worth asking again a few seconds later: a sweep is hundreds of requests. */
const transient = (message: string) => Object.assign(new Error(message), { transient: true });

/**
 * The reply to a list request at lat, lng within radiusM, checked. Each vehicle's distance is
 * what vouches for the vehicles left out, so each must be its distance from the point, in order.
 * A list of other types too would still hold every scooter nearer than its tenth vehicle.
 */
export function parseBinbinReply(payload: unknown, lat: number, lng: number, radiusM: number): BinbinReply {
  const envelope = object(payload);
  if (envelope?.status !== 'SUCCESS' || !Array.isArray(envelope.data)) throw new Error('Invalid BinBin map response');
  if (envelope.data.length > BINBIN_PAGE) throw new Error('BinBin map returned more than its page');
  const scooters: BinbinScooter[] = [];
  let farthest = 0;
  for (const entry of envelope.data) {
    const vehicle = object(entry);
    if (!vehicle || typeof vehicle.vehicleId !== 'string' || !/^[\w-]{1,64}$/.test(vehicle.vehicleId) ||
      !finite(vehicle.latitude) || !finite(vehicle.longitude) || Math.abs(vehicle.latitude) > 90 ||
      Math.abs(vehicle.longitude) > 180 || !finite(vehicle.distance) || vehicle.distance < 0 ||
      !Number.isInteger(vehicle.vehicleTypeId)) throw new Error('Invalid BinBin vehicle');
    const measured = haversineM(lat, lng, vehicle.latitude, vehicle.longitude);
    if (Math.abs(measured - vehicle.distance) > 2 + vehicle.distance * 0.005) throw new Error('BinBin distances disagree with its positions');
    if (vehicle.distance + 0.5 < farthest) throw new Error('BinBin map is not nearest first');
    if (vehicle.distance > radiusM + 2) throw new Error('BinBin map returned a vehicle beyond its radius');
    farthest = Math.max(farthest, vehicle.distance);
    if (vehicle.vehicleTypeId !== 1) continue;
    scooters.push({ id: vehicle.vehicleId, lat: vehicle.latitude, lng: vehicle.longitude,
      battery: finite(vehicle.battery) && vehicle.battery >= 0 && vehicle.battery <= 100 ? vehicle.battery : null });
  }
  // A scooter as far as the tenth may be the one left out. Less 0.3%, for the distance BinBin
  // measures and for a parallel bowing away from the great circle across a cell.
  const reach = envelope.data.length < BINBIN_PAGE ? radiusM : farthest;
  return { scooters, completeM: Math.max(0, reach * 0.997 - 1) };
}

/** BinBin's guest map: the app sends no session until a rider signs in. */
export class BinbinClient {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? 250, this.now, this.now() + (options.startHoldMs ?? 0));
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async nearest(lat: number, lng: number, radiusM = BINBIN_REACH_M): Promise<BinbinReply> {
    if (this.now() < this.blockedUntil) throw new Error('BinBin is temporarily rate limited');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('BinBin is temporarily rate limited');
    binbinMapRequests.status++;
    let response: Response;
    try {
      response = await this.fetch(ORIGIN + LIST_PATH, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs),
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'okhttp/4.12.0',
          'X-Language': 'en', 'X-App-Version': '1278.3.6', 'X-Device-Language': 'en', 'X-Device-Platform': 'Android-Google-Pixel 8',
          'X-Device-OS': 'Android' },
        body: JSON.stringify({ latitude: lat, longitude: lng, radius: Math.ceil(radiusM), vehicleTypeIds: '1' }) });
    } catch { throw transient('BinBin request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const milliseconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, milliseconds || RETRY_MS));
      // What BinBin asked, which only the failed feeds' state showed on 26 October 2026.
      console.warn(JSON.stringify({ event: 'binbin_rate_limited', retryAfter: retry?.slice(0, 40) ?? null,
        blockedSeconds: Math.round((this.blockedUntil - this.now()) / 1000) }));
    }
    if (!response.ok) {
      await response.body?.cancel();
      const message = `BinBin map HTTP ${response.status}`;
      throw response.status >= 500 ? transient(message) : new Error(message);
    }
    let text: string;
    try { text = await response.text(); } catch { throw transient('BinBin response was cut off'); }
    if (text.length > 65_536) throw new Error('BinBin response exceeds the size limit');
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { throw new Error('BinBin returned invalid JSON'); }
    return parseBinbinReply(payload, lat, lng, radiusM);
  }
}

type Ring = [number, number][];
const BINBIN_MAP: NearestMap = { name: 'BinBin', page: BINBIN_PAGE, reachM: BINBIN_REACH_M, cellM: 4_000 };

/** Where to ask first, from where the scooters stood at the last sweep (planNearestSweep). */
export const planBinbinSweep = (rings: readonly Ring[], previous: readonly { lat: number; lng: number }[], options: { samples?: number } = {}) =>
  planNearestSweep(BINBIN_MAP, rings, previous, options);

export type BinbinSweep = NearestSweep<BinbinScooter>;

/** A complete sweep of one service area (sweepNearestArea). */
export const sweepBinbinArea = (api: Pick<BinbinClient, 'nearest'>, rings: readonly Ring[], previous: readonly { lat: number; lng: number }[],
  limits: SweepLimits = { requests: 3_000, milliseconds: 20 * 60_000, retryMs: 3_000 }, found = new Map<string, BinbinScooter>(),
  done?: (part: MapBounds) => void): Promise<BinbinSweep> => sweepNearestArea(BINBIN_MAP, api, rings, previous, limits, found, done);

const AREAS = new Map((areaCatalog.areas as unknown as { id: string; rings: Ring[] }[]).map(area => [area.id, area.rings]));
interface Position { lat: number; lng: number }
type Published = Position & { vehicle_id: string | null };
export type PreviousPositions = (feedId: string) => readonly Published[] | undefined;
// What the sweeps that failed have seen since each area's last complete one, by vehicle id. The
// next sweep plans from them over the last published positions, so an area too big to sweep from
// nothing within the limits is swept in two goes or three.
const sightings = new Map<string, Map<string, Position>>();

export async function collectBinbinArea(system: RegionalScooterSystem, previous: readonly Published[],
  api: Pick<BinbinClient, 'nearest'>): Promise<SourceVehicles> {
  const rings = system.binbinAppArea ? AREAS.get(system.binbinAppArea) : undefined;
  if (!rings || system.provider !== 'binbin') throw new Error('Not a BinBin app map area');
  const known = new Map<string, Position>(previous.map(({ vehicle_id, lat, lng }) => [vehicle_id ?? `${lat},${lng}`, { lat, lng }]));
  for (const [id, position] of sightings.get(system.id) ?? []) known.set(id, position);
  const seen = new Map<string, BinbinScooter>();
  const published = (scooters: Iterable<BinbinScooter>): Vehicle[] => [...scooters]
    .filter(scooter => boundsContainPoint(system.bounds, scooter.lat, scooter.lng)).map(scooter => ({
      provider: 'binbin', vehicle_id: `${system.id}:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
      battery: scooter.battery, range_m: null, deep_link: null, distance_m: null,
    }));
  const progress = new SweepProgress(() => published([...seen.values()]
    .filter(scooter => rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng)))));
  let sweep: BinbinSweep;
  try {
    sweep = await sweepBinbinArea(api, rings, [...known.values()], undefined, seen, part => progress.done(part));
  } catch (error) {
    for (const { id, lat, lng } of seen.values()) known.set(`${system.id}:${id}`, { lat, lng });
    sightings.set(system.id, known);
    throw error;
  }
  sightings.delete(system.id);
  console.log(JSON.stringify({ event: 'binbin_sweep', system: system.id, scooters: sweep.scooters.length,
    requests: sweep.requests, planned: sweep.planned, piles: sweep.piles, seconds: Math.round((Date.now() - sweep.startedAt) / 1000) }));
  // Positions as old as the sweep's first reply.
  return { observedAt: sweep.startedAt, stale: false, vehicles: published(sweep.scooters) };
}

const client = new BinbinClient({ startHoldMs: BINBIN_START_HOLD_MS });
let scriptClient: BinbinClient | undefined;
/** A sweep from nothing known, as scripts/check-french-feeds.mjs makes: it replaces no cache, so it waits for none. */
export const collectBinbinRegion = (system: RegionalScooterSystem) => collectBinbinArea(system, [], scriptClient ??= new BinbinClient());
/** Each area's sweep is planned from the positions the cache last published for it. */
export function withBinbinAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[],
  previous: PreviousPositions, api: Pick<BinbinClient, 'nearest'> = client) {
  const areas = new Map(systems.filter(system => system.binbinAppArea).map(system => [system.id, system]));
  return feeds.map(feed => {
    const area = areas.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return area ? { ...feed, idleIntervalMs: BINBIN_IDLE_INTERVAL_MS, paced: true,
      collect: () => collectBinbinArea(area, previous(feed.id) ?? [], api) } : feed;
  });
}
