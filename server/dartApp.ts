import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { Vehicle } from '../src/lib/types';
import { APP_MAP_IDLE_INTERVAL_MS } from './appMapCadence';

const ORIGIN = 'https://app.dartsharing.com:8443/app/vehicle/main_v2';
// The whole of South Korea in one view. The map lists every scooter in the view, its whole fleet in
// one reply: 1,425 scooters (810 kB) at 02:17 Korea time on 26 October 2026.
const KOREA = { south: 33, north: 38.7, west: 124.5, east: 131 };
// At zoom 14 the map lists scooters; at 5 and below it lists franchise points instead.
const ZOOM = 14;
// The app's marker statuses (MarkerStatus): 1 normal and 8 free to unlock can be ridden; 3 is
// reserved, 7 and 9 held, and 0 a franchise point.
const RIDABLE = new Set(['1', '8']);
const RETRY_MS = 60_000;
export const dartMapRequests = { status: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

interface DartScooter { id: string; lat: number; lng: number; battery: number | null; range_m: number | null }
interface ClientOptions { fetch?: typeof fetch; now?: () => number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('DART returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('DART response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('DART returned invalid JSON'); }
}

/**
 * The scooters that can be ridden, of a reply listing the whole fleet, with their battery and the
 * range the app shows, in kilometres. Their address, QR code and parking photo are never read.
 * None at all fails the read rather than leave every town empty.
 */
export function parseDartScooters(payload: unknown): DartScooter[] {
  const reply = object(payload);
  const vehicles = object(reply?.data)?.vehicle;
  if (reply?.result !== true || !Array.isArray(vehicles) || vehicles.length > 50_000) throw new Error('Invalid DART map response');
  const scooters = new Map<string, DartScooter>();
  for (const entry of vehicles) {
    const vehicle = object(entry);
    const { reg_no: id, latitude: lat, longitude: lng, status } = vehicle ?? {};
    if (!Number.isSafeInteger(id) || (id as number) < 0 || typeof lat !== 'number' || typeof lng !== 'number' ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || typeof status !== 'string') {
      throw new Error('Invalid DART vehicle');
    }
    if (!RIDABLE.has(status)) continue;
    const level = vehicle!.power_percent, range = vehicle!.remaining_range;
    scooters.set(String(id), { id: String(id), lat, lng,
      battery: typeof level === 'number' && Number.isInteger(level) && level >= 0 && level <= 100 ? level : null,
      range_m: typeof range === 'number' && Number.isFinite(range) && range >= 0 && range <= 200 ? Math.round(range * 1000) : null });
  }
  if (!scooters.size) throw new Error('DART map lists no scooters');
  return [...scooters.values()];
}

export class DartClient {
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly timeoutMs: number;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  /** The country's ridable scooters, with when they were asked for. */
  async scooters(): Promise<{ at: number; scooters: DartScooter[] }> {
    if (this.now() < this.blockedUntil) throw new Error('DART is temporarily rate limited');
    dartMapRequests.status++;
    const at = this.now();
    // The app's map request, as user 0 with the token "scootradar": the server answers it without
    // the phone sign-in the app asks for first (the user's choice, 25 October 2026).
    const body = new URLSearchParams({ zoomLevel: String(ZOOM), user_no: '0', luLat: String(KOREA.north), ldLat: String(KOREA.south),
      luLong: String(KOREA.west), ruLong: String(KOREA.east) });
    let response: Response;
    try {
      response = await this.fetch(ORIGIN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded',
        token: 'scootradar', 'app-version': '2.3.0', 'User-Agent': 'okhttp/4.12.0' },
      body, redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('DART request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`DART map HTTP ${response.status}`);
    }
    return { at, scooters: parseDartScooters(await jsonBody(response, 16 * 1024 * 1024)) };
  }
}

const client = new DartClient();
/**
 * Every ridable scooter in the system's towns, from one read of the whole country. DART has one
 * system, its towns its areas, so a round asks once; a scooter is listed once, and counted in the
 * town whose outline holds it (townOf in scooterSnapshots.ts).
 */
export async function collectDartRegion(system: RegionalScooterSystem, api: Pick<DartClient, 'scooters'> = client): Promise<SourceVehicles> {
  if (!system.dartAppMap) throw new Error('Not a DART app map region');
  const { at, scooters } = await api.scooters();
  const vehicles: Vehicle[] = scooters.filter(scooter => systemServesPoint(system, scooter.lat, scooter.lng)).map(scooter => ({
    provider: system.provider, vehicle_id: `dart:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
    battery: scooter.battery, range_m: scooter.range_m, deep_link: null, distance_m: null,
  }));
  return { observedAt: at, stale: false, vehicles };
}

/** Collected every two hours while nobody looks, as the other app maps, to spare DART's server. */
export function withDartAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.dartAppMap).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, idleIntervalMs: APP_MAP_IDLE_INTERVAL_MS, collect: () => collectDartRegion(system) } : feed;
  });
}
