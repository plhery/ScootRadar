import { open } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import areaCatalog from '../data/ridemovi-areas.json';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';
import { sweepNearestArea, type NearestMap, type Ring, type SweepLimits } from './nearestSweep';
import { Pacer, SweepProgress } from './sweeps';

const ORIGIN = 'https://api.ridemoviapp.com';
const PATH = '/bike/nearby?ridingStatus=0&vehicleType=escooter&areaLimit=1';
export const RIDEMOVI_PAGE = 30;
export const RIDEMOVI_RADIUS_M = 2_000;
const RETRY_MS = 60_000;
// After two production sweeps (68 and 59 reads), the map alone returned an AWS HTML 403,
// while the same session still worked from the Mac and public metadata worked from Netcup.
// The quota is unpublished: keep subsequent sweeps slower and leave the edge a longer cooldown.
const QUERY_INTERVAL_MS = 5_000;
export const RIDEMOVI_FORBIDDEN_RETRY_MS = 15 * 60_000;
export const ridemoviMapRequests = { status: 0 };
interface ClientOptions { sessionPath?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number; startHoldMs?: number }
export interface RidemoviScooter { id: string; lat: number; lng: number; battery: number | null; range_m: number | null }
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * The nearest scooters, at most 30 and none farther than 2 km (RideMovi's distance). A full page
 * vouches for every scooter nearer than its last one; fewer than 30, or none, for the whole 2 km.
 * On 5 November 2026 a scooter 1,990 m from the point asked was listed and at 2,010 m it was not,
 * every underfilled reply of a grid over Dresden ended between 1,915 and 1,997 m, and a point with
 * no scooter within 2 km got `showNearbyBikes: false` and an empty list, as one far outside the
 * city did. That empty reply had failed every sweep since about 09:30 UTC: Dresden's eastern
 * edge had no scooter left within 2 km of it (SCOOTRADAR-CACHE-69).
 */
export function parseRidemoviReply(payload: unknown, cityId: number, lat: number, lng: number) {
  const envelope = object(payload), data = object(envelope?.data), bikes = data?.nearbyBikes;
  // Hidden with an empty list is RideMovi's answer where no scooter is within its radius.
  const none = data?.showNearbyBikes === false && Array.isArray(bikes) && !bikes.length;
  if (envelope?.code !== 1000 || !Array.isArray(bikes) || bikes.length > RIDEMOVI_PAGE ||
    !none && (data?.showNearbyBikes !== true || !bikes.length)) throw new Error('RideMovi map cannot establish nearby coverage');
  const scooters: RidemoviScooter[] = [], ids = new Set<number>();
  let farthest = 0;
  for (const entry of bikes) {
    const bike = object(entry);
    if (!bike || !Number.isSafeInteger(bike.id) || (bike.id as number) <= 0 ||
      !finite(bike.lat) || !finite(bike.lon) || Math.abs(bike.lat) > 85 || Math.abs(bike.lon) > 180 ||
      !finite(bike.distance) || bike.distance < 0 || !['SN1', 'SO1'].includes(String(bike.bikeType))) {
      throw new Error('Invalid RideMovi scooter');
    }
    if (bike.cityId !== cityId) throw new Error('RideMovi map does not match its requested city');
    if (ids.has(bike.id as number)) throw new Error('RideMovi map repeats a scooter');
    ids.add(bike.id as number);
    const measured = haversineM(lat, lng, bike.lat, bike.lon);
    if (Math.abs(measured - bike.distance) > 2 + bike.distance * 0.006) throw new Error('RideMovi distances disagree with its positions');
    if (bike.distance + 0.5 < farthest) throw new Error('RideMovi map is not nearest first');
    farthest = Math.max(farthest, bike.distance);
    const battery = object(bike.bikePowerBatteryStatus)?.soc, range = bike.estimatedTravelDistanceInKM;
    scooters.push({ id: String(bike.id), lat: bike.lat, lng: bike.lon,
      battery: finite(battery) && battery >= 0 && battery <= 100 ? battery : null,
      range_m: finite(range) && range >= 0 && range <= 200 ? Math.round(range * 1000) : null });
  }
  // Distances differ from haversine by about 0.3%: keep a margin. Tied piles cannot establish coverage.
  const reach = bikes.length < RIDEMOVI_PAGE ? RIDEMOVI_RADIUS_M : Math.min(farthest, RIDEMOVI_RADIUS_M);
  const completeM = Math.max(0, reach * 0.99 - 5);
  if (!completeM) throw new Error('RideMovi scooters are too tightly clustered to certify coverage');
  return { scooters, completeM };
}

async function jsonBody(response: Response): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('RideMovi returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) throw new Error();
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new Error('RideMovi response was cut off or exceeded the size limit');
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('RideMovi returned invalid JSON'); }
}

/** Only map reads. Login is an operator action; no OTP, payment or ride endpoint is called. */
export class RidemoviClient {
  private readonly sessionPath: string;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly pace: Pacer;
  private readonly timeoutMs: number;
  private blockedUntil = 0;
  private rejectedToken?: string;

  constructor(options: ClientOptions = {}) {
    this.sessionPath = options.sessionPath ?? process.env.RIDEMOVI_SESSION_PATH ??
      join(dirname(process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json'), 'ridemovi-session.json');
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.pace = new Pacer(options.intervalMs ?? QUERY_INTERVAL_MS, this.now, this.now() + (options.startHoldMs ?? 0));
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  private async token(): Promise<string> {
    try {
      const file = await open(this.sessionPath, 'r');
      try {
        const stat = await file.stat();
        if (!stat.isFile() || stat.size > 4_096 || (stat.mode & 0o077)) throw new Error();
        const session = object(JSON.parse(await file.readFile('utf8')));
        if (session?.version !== 1 || typeof session.token !== 'string' || !/^[a-fA-F0-9]{32}$/.test(session.token)) throw new Error();
        return session.token;
      } finally { await file.close(); }
    } catch { throw new Error('RideMovi session is missing, invalid or not private (0600)'); }
  }

  async nearest(cityId: number, lat: number, lng: number) {
    if (!Number.isSafeInteger(cityId) || cityId <= 0 || !finite(lat) || !finite(lng) ||
      Math.abs(lat) > 85 || Math.abs(lng) > 180) throw new Error('Invalid RideMovi map location');
    if (this.now() < this.blockedUntil) throw new Error('RideMovi requests are temporarily held');
    await this.pace.turn();
    if (this.now() < this.blockedUntil) throw new Error('RideMovi requests are temporarily held');
    // Reload each time: replacing an expired login recovers without restarting the cache.
    const token = await this.token();
    if (token === this.rejectedToken) throw new Error('RideMovi session needs a new operator login');
    ridemoviMapRequests.status++;
    let response: Response;
    try {
      response = await this.fetch(ORIGIN + PATH, { redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs),
        headers: { Authorization: `Bearer ${token}`, AppVersion: '5.2.0', Accept: 'application/json',
          'X-Vivi-Latitude': String(lat), 'X-Vivi-Longitude': String(lng) } });
    } catch {
      this.blockedUntil = this.now() + RETRY_MS;
      throw new Error('RideMovi request failed or timed out');
    }
    if (!response.ok) {
      await response.body?.cancel();
      // A generic 403 can come from an HTTP protection layer; it does not prove an expired login.
      if (response.status === 401) this.rejectedToken = token;
      const retry = response.headers.get('retry-after');
      const minimum = response.status === 403 ? RIDEMOVI_FORBIDDEN_RETRY_MS : RETRY_MS;
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : minimum;
      this.blockedUntil = this.now() + Math.max(minimum, Math.min(3_600_000, delay || minimum));
      throw new Error(`RideMovi map HTTP ${response.status}`);
    }
    const payload = await jsonBody(response);
    if (object(payload)?.code === 15000) {
      this.rejectedToken = token;
      throw new Error('RideMovi session needs a new operator login');
    }
    try { return parseRidemoviReply(payload, cityId, lat, lng); }
    catch (error) { this.blockedUntil = this.now() + RETRY_MS; throw error; }
  }
}

// A first cell's middle reaches its corners: half its 2.5 km diagonal is 1.77 km, within the 1.975 km a reply vouches for.
const MAP: NearestMap = { name: 'RideMovi', page: RIDEMOVI_PAGE, reachM: RIDEMOVI_RADIUS_M, cellM: 2_500 };
const AREAS = new Map(areaCatalog.areas.map(area => [area.id, { cityId: area.cityId, rings: area.rings as Ring[] }]));
const LIMITS: SweepLimits = { requests: 300, milliseconds: 15 * 60_000, retryMs: 3_000 };
type Position = { lat: number; lng: number };

export async function collectRidemoviArea(system: RegionalScooterSystem, previous: readonly Position[],
  api: Pick<RidemoviClient, 'nearest'>, limits = LIMITS): Promise<SourceVehicles> {
  const area = system.ridemoviAppArea ? AREAS.get(system.ridemoviAppArea) : undefined;
  if (!area || system.provider !== 'ridemovi') throw new Error('Not a RideMovi app map area');
  const published = (scooters: Iterable<RidemoviScooter>): Vehicle[] => [...scooters]
    .filter(scooter => boundsContainPoint(system.bounds, scooter.lat, scooter.lng) &&
      area.rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng)))
    .map(scooter => ({ provider: 'ridemovi', vehicle_id: `ridemovi:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
      battery: scooter.battery, range_m: scooter.range_m, deep_link: null, distance_m: null }));
  const found = new Map<string, RidemoviScooter>();
  const progress = new SweepProgress(() => published(found.values()));
  const sweep = await sweepNearestArea(MAP, { nearest: (lat, lng) => api.nearest(area.cityId, lat, lng) },
    area.rings, previous, limits, found, part => progress.done(part));
  if (sweep.piles) throw new Error('RideMovi sweep has unresolved scooter clusters');
  // Empty replies cover their radius, so a map hidden everywhere would read as an empty city.
  if (!found.size) throw new Error('RideMovi sweep found no scooter anywhere');
  console.log(JSON.stringify({ event: 'ridemovi_sweep', system: system.id, scooters: sweep.scooters.length,
    requests: sweep.requests, planned: sweep.planned, seconds: Math.round((Date.now() - sweep.startedAt) / 1000) }));
  return { observedAt: sweep.startedAt, stale: false, vehicles: published(sweep.scooters) };
}

let scriptClient: RidemoviClient | undefined;
export const collectRidemoviRegion = (system: RegionalScooterSystem) => collectRidemoviArea(system, [], scriptClient ??= new RidemoviClient());
const client = new RidemoviClient({ startHoldMs: 120_000 });
export function withRidemoviAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[],
  previous: (feedId: string) => readonly Position[] | undefined, api: Pick<RidemoviClient, 'nearest'> = client) {
  const regions = new Map(systems.filter(system => system.ridemoviAppArea).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, watchMs: 2 * 60_000, paced: true,
      collect: () => collectRidemoviArea(system, previous(feed.id) ?? [], api) } : feed;
  });
}
