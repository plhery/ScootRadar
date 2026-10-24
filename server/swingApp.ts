import { createHmac } from 'node:crypto';
import { boundsContainBounds } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import { systemServesPoint } from '../src/lib/townOutlines';
import type { MapBounds, Vehicle } from '../src/lib/types';

const ORIGIN = 'https://sfr.swingmobility.dev/map/marker/vehicles';
const APP_VERSION = '4.8.1';
const APP_BUILD = '20386';
const RETRY_MS = 60_000;
// Bounds the server did not widen the box to are read again in quarters, down to a sixteenth.
const SPLITS = 2;
export const swingMapRequests = { status: 0 };
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

interface SwingScooter { id: string; lat: number; lng: number }
type TimedScooters = { scooters: SwingScooter[]; at: number };
interface ClientOptions { secret?: string; fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }

async function jsonBody(response: Response, maxBytes: number): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Swing returned an empty response');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new Error('Swing response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Swing returned invalid JSON'); }
}

function base32(value: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes: number[] = [];
  let bits = 0, buffer = 0;
  for (const character of value.replace(/=+$/, '')) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('Swing one-time code secret is missing or invalid');
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) { bits -= 8; bytes.push((buffer >> bits) & 0xff); }
  }
  return Buffer.from(bytes);
}

/** The app's one-time code (RFC 6238: HMAC-SHA512, 30-second steps, six digits). */
export function swingOneTimeCode(key: Buffer, now: number): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(now / 30_000)));
  const mac = createHmac('sha512', key).update(counter).digest();
  const offset = mac[mac.length - 1] & 15;
  return String((mac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, '0');
}

/**
 * The scooters of a read, by an id derived from the device's IMEI with the private
 * key, so the IMEI is neither stored nor shown. The server says which box it read.
 */
export function parseSwingScooters(payload: unknown, key: Buffer): { scooters: SwingScooter[]; read: MapBounds; throttleMs: number } {
  const data = object(payload);
  const meta = object(data?.meta), read = object(meta?.calcBounds);
  if (data?.__status !== 'OK' || !Array.isArray(data.vehicles) || data.vehicles.length > 100_000 || !read ||
    !['south', 'west', 'north', 'east'].every(side => typeof read[side] === 'number' && Number.isFinite(read[side]))) {
    throw new Error('Invalid Swing map response');
  }
  const throttle = Number(meta!.throttleMs ?? 0);
  const scooters: SwingScooter[] = [];
  for (const entry of data.vehicles) {
    const vehicle = object(entry);
    const { lat, lng } = vehicle ?? {};
    if (!vehicle || typeof vehicle.imei !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(vehicle.imei) ||
      typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      Math.abs(lat) > 90 || Math.abs(lng) > 180 || typeof vehicle.type !== 'string') throw new Error('Invalid Swing vehicle');
    // Its e-bikes are BIKE, its bicycles NORMAL_BIKE, and its seated scooters MOPED.
    if (vehicle.type !== 'SCOOTER') continue;
    scooters.push({ id: createHmac('sha256', key).update(vehicle.imei).digest('base64url').slice(0, 16), lat, lng });
  }
  return { scooters, read: read as unknown as MapBounds, throttleMs: Number.isFinite(throttle) ? Math.max(0, throttle) : 0 };
}

/** The one-time code's key enters through the cache's runtime environment, never the public catalog. */
export class SwingClient {
  private readonly secret: string | undefined;
  private readonly fetch: typeof fetch;
  private readonly now: () => number;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private nextStart = 0;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.secret = options.secret ?? process.env.SWING_TOTP_SECRET;
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 1000;
    this.timeoutMs = options.timeoutMs ?? 30_000;
  }

  private key(): Buffer {
    const secret = this.secret?.trim().toUpperCase();
    if (!secret || secret.length < 16 || secret.length > 256) throw new Error('Swing one-time code secret is missing or invalid');
    return base32(secret);
  }

  /**
   * The scooters in the bounds. The server reads a box four times as tall and wide as the one
   * asked for, so the box asked for is a quarter of the bounds around their centre.
   */
  async scooters(bounds: MapBounds): Promise<TimedScooters & { read: MapBounds }> {
    const key = this.key();
    const lat = (bounds.south + bounds.north) / 2, lng = (bounds.west + bounds.east) / 2;
    const height = (bounds.north - bounds.south) / 8, width = (bounds.east - bounds.west) / 8;
    const query = new URLSearchParams({ east: (lng + width).toFixed(6), south: (lat - height).toFixed(6),
      west: (lng - width).toFixed(6), north: (lat + height).toFixed(6), center: `${lat.toFixed(6)},${lng.toFixed(6)}`,
      mapType: 'NAVER', mapZoomLevel: '16', VEHICLE: 'SCOOTER', DISCOUNT: 'ALL', BATTERY: 'ALL', selectedOnly: 'true' });
    if (this.now() < this.blockedUntil) throw new Error('Swing is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    if (this.now() < this.blockedUntil) throw new Error('Swing is temporarily rate limited');
    swingMapRequests.status++;
    const at = this.now();
    let response: Response;
    try {
      response = await this.fetch(`${ORIGIN}?${query}`, { headers: {
        'X-SW-OS-PLATFORM': 'AOS', 'X-SW-OS-VERSION': '34', 'X-SW-DEVICE-MODEL': 'Pixel 7',
        'X-SW-DEVICE-LOCATION': '0.0,0.0', 'X-SW-DEVICE-GPS-ACCURACY': '0.0',
        'X-SW-APP-VERSION': APP_VERSION, 'X-SW-APP-BUILD-NUMBER': APP_BUILD, 'X-SW-APP-LANGUAGE': 'ko',
        'X-SW-OS-LANGUAGE': 'ko', 'User-Agent': `SWING/${APP_VERSION}`, 'X-SW-APP-TS': String(at),
        'X-SW-OS-FSAN': swingOneTimeCode(key, at), Accept: 'application/json',
      }, redirect: 'error', signal: AbortSignal.timeout(this.timeoutMs) });
    } catch { throw new Error('Swing request failed or timed out'); }
    if (response.status === 429) {
      const retry = response.headers.get('retry-after');
      const delay = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : retry ? Date.parse(retry) - this.now() : RETRY_MS;
      this.blockedUntil = this.now() + Math.max(RETRY_MS, Math.min(3_600_000, delay || RETRY_MS));
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Swing map HTTP ${response.status}`);
    }
    const { scooters, read, throttleMs } = parseSwingScooters(await jsonBody(response, 32 * 1024 * 1024), key);
    // The next request waits as long after this one as the server asks, up to a minute.
    this.nextStart = Math.max(this.nextStart, at + Math.min(throttleMs, 60_000));
    return { scooters, read, at };
  }
}

function quarters(box: MapBounds): MapBounds[] {
  const lat = (box.south + box.north) / 2, lng = (box.west + box.east) / 2;
  return [{ ...box, north: lat, east: lng }, { ...box, north: lat, west: lng },
    { ...box, south: lat, east: lng }, { ...box, south: lat, west: lng }];
}

const client = new SwingClient();
export async function collectSwingRegion(system: RegionalScooterSystem, api: Pick<SwingClient, 'scooters'> = client): Promise<SourceVehicles> {
  if (!system.swingAppMap) throw new Error('Not a Swing app map region');
  const scooters = new Map<string, SwingScooter>();
  let observedAt = Infinity;
  const read = async (box: MapBounds, splits: number): Promise<void> => {
    const answer = await api.scooters(box);
    // A read of less than the box asked for would leave scooters out without saying so.
    const tolerance = 1e-5;
    if (!boundsContainBounds({ south: answer.read.south - tolerance, west: answer.read.west - tolerance,
      north: answer.read.north + tolerance, east: answer.read.east + tolerance }, box)) {
      if (!splits) throw new Error('Swing map read less than the box asked for');
      for (const quarter of quarters(box)) await read(quarter, splits - 1);
      return;
    }
    observedAt = Math.min(observedAt, answer.at);
    for (const scooter of answer.scooters) scooters.set(scooter.id, scooter);
  };
  await read(system.bounds, SPLITS);
  const vehicles: Vehicle[] = [...scooters.values()].filter(scooter => systemServesPoint(system, scooter.lat, scooter.lng)).map(scooter => ({
    // By the operator's own id, so a scooter where two towns' bounds overlap is shown once. Swing gives a
    // battery band (FULL, HIGH, MIDDLE, LOW), not a level, and no range.
    provider: system.provider, vehicle_id: `swing:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
    battery: null, range_m: null, deep_link: null, distance_m: null,
  }));
  return { observedAt, stale: false, vehicles };
}

export function withSwingAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[]) {
  const regions = new Map(systems.filter(system => system.swingAppMap).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = regions.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return system ? { ...feed, paced: true, collect: () => collectSwingRegion(system) } : feed;
  });
}
