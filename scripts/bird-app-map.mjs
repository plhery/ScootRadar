// Read-only research client. Nothing in the production collector imports this module.
import { randomUUID } from 'node:crypto';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://api-bird.prod.birdapp.com';
const BRAND = 'df76d602-dd1a-4ce4-a64f-2e5dd8c6f845';
const COOLDOWN_MS = 15 * 60_000;
const CAP = 250;
const CELL_CAP = 1000;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const uuid = value => typeof value === 'string' && /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class BirdUntrustedMapError extends Error {
  constructor() { super('Bird returned an unverified map; stop collection and leave the session alone'); }
}
export class BirdIncompleteMapError extends Error {
  constructor() { super('Bird returned an incomplete map; no complete inventory is available'); }
}

function point(value) {
  if (!object(value) || !finite(value.latitude) || !finite(value.longitude) ||
    Math.abs(value.latitude) > 85 || Math.abs(value.longitude) > 180) throw new Error('Invalid Bird map point');
  return { latitude: value.latitude, longitude: value.longitude };
}
function bounds(value) {
  if (!object(value) || ![value.south, value.west, value.north, value.east].every(finite) ||
    value.south >= value.north || value.west >= value.east || value.south < -85 || value.north > 85 ||
    value.west < -180 || value.east > 180 || value.north - value.south > 0.5 || value.east - value.west > 0.75) {
    throw new Error('Invalid or oversized Bird map bounds');
  }
  return value;
}
const centerOf = box => ({ latitude: (box.south + box.north) / 2, longitude: (box.west + box.east) / 2 });
const inside = (box, v) => v.lat >= box.south && v.lat <= box.north && v.lng >= box.west && v.lng <= box.east;
export function birdDistance(a, b) {
  const rad = Math.PI / 180;
  const h = Math.sin((a.latitude - b.latitude) * rad / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((a.longitude - b.longitude) * rad / 2) ** 2;
  return 12_742_000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function cellId(value, level) {
  if (typeof value !== 'string' || !/^-?[1-9]\d{0,19}$/.test(value)) return false;
  const signed = BigInt(value);
  if (signed < -(1n << 63n) || signed >= 1n << 63n) return false;
  const id = BigInt.asUintN(64, signed);
  const low = id & -id;
  return id >> 61n < 6n && (level === undefined
    ? low > 0n && (low & 0x1555555555555555n) === low
    : low === 1n << BigInt(2 * (30 - level)));
}

/** Metadata is required even for an empty reply: a synthetic empty is not an empty fleet. */
export function parseBirdMap(payload, requestedCells) {
  if (!object(payload) || !Array.isArray(payload.birds) || !Array.isArray(payload.cell_ids) ||
    payload.birds.length > CELL_CAP || payload.cell_ids.length > 4096 ||
    !payload.cell_ids.every(id => cellId(id)) || new Set(payload.cell_ids).size !== payload.cell_ids.length) {
    throw new BirdUntrustedMapError();
  }
  const expected = requestedCells ? new Set(requestedCells) : undefined;
  if (expected && payload.cell_ids.some(id => !expected.has(id))) throw new BirdUntrustedMapError();
  const ids = new Set();
  const vehicles = payload.birds.map(bird => {
    if (!object(bird) || !uuid(bird.id) || ids.has(bird.id) || bird.brand_id !== BRAND ||
      !['scooter', 'bicycle', 'moped'].includes(bird.vehicle_class) || typeof bird.captive !== 'boolean' ||
      typeof bird.area_key !== 'string' || !/^[\dA-F]{32}$/.test(bird.area_key)) throw new BirdUntrustedMapError();
    ids.add(bird.id);
    let location;
    try { location = point(bird.location); } catch { throw new BirdUntrustedMapError(); }
    if (expected && (!expected.has(bird.cell_id) || !payload.cell_ids.includes(bird.cell_id))) {
      throw new BirdUntrustedMapError();
    }
    return { id: bird.id, lat: location.latitude, lng: location.longitude,
      battery: finite(bird.battery_level) && bird.battery_level >= 0 && bird.battery_level <= 100 ? bird.battery_level : null,
      range_m: finite(bird.estimated_range) && bird.estimated_range >= 0 && bird.estimated_range <= 200_000 ? bird.estimated_range : null,
      areaKey: bird.area_key, cellId: bird.cell_id ?? null,
      scooter: bird.vehicle_class === 'scooter' && !bird.captive };
  });
  const capped = payload.reached_response_limit === true || payload.birds.length >= (expected ? CELL_CAP : CAP);
  if (payload.birds.length && !payload.cell_ids.length) throw new BirdUntrustedMapError();
  if (expected && (capped || payload.cell_ids.length !== expected.size)) throw new BirdIncompleteMapError();
  return { vehicles: vehicles.filter(v => v.scooter).map(v => ({ id: v.id, lat: v.lat, lng: v.lng,
    battery: v.battery, range_m: v.range_m, areaKey: v.areaKey, cellId: v.cellId })), capped,
    cellIds: payload.cell_ids, candidates: payload.birds.length };
}

async function jsonBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Bird returned an empty response body');
  const chunks = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8 * 1024 * 1024) throw new Error('Bird response exceeds the size limit');
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('Bird returned invalid JSON'); }
}

export class BirdMapReader {
  constructor({ session, fetch: fetcher = fetch, now = Date.now, sleep: sleeper = sleep, intervalMs = 5000 } = {}) {
    if (!object(session) || session.version !== 1 || !uuid(session.deviceId) ||
      typeof session.accessToken !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(session.accessToken) ||
      session.accessToken.length > 8192) throw new Error('Bird session is missing or invalid');
    if (!finite(intervalMs) || intervalMs < 5000) throw new Error('Bird requests must be at least five seconds apart');
    this.session = session;
    this.fetch = fetcher;
    this.now = now;
    this.sleep = sleeper;
    this.intervalMs = intervalMs;
    this.next = 0;
    this.blockedUntil = 0;
    this.requests = 0;
  }

  async request(path, location, body) {
    point(location);
    if (this.now() < this.blockedUntil) throw new Error('Bird requests are held off after an untrusted or refused response');
    const at = Math.max(this.now(), this.next);
    this.next = at + this.intervalMs;
    if (at > this.now()) await this.sleep(at - this.now());
    if (this.now() < this.blockedUntil) throw new Error('Bird requests are held off after an untrusted or refused response');
    // Restrict this research reader to map reads. No rides, account changes or vehicle actions.
    if (!/^\/(?:bird\/nearby(?:\?|$)|bird\/nearby-by-cells$|map\/rider-cells$)/.test(path)) {
      throw new Error('Unsupported Bird map operation');
    }
    this.requests++;
    let response;
    try {
      response = await this.fetch(ORIGIN + path, { method: body ? 'POST' : 'GET', redirect: 'error',
        headers: { 'User-Agent': 'Bird/4.420.0.2 (co.bird.android; release; Android - 15)',
          'Device-Id': this.session.deviceId, Platform: 'android', 'App-Version': '4.420.0.2',
          'App-Name': 'bird', 'App-Type': 'rider', Accept: 'application/json', 'Accept-Language': 'en-US',
          Authorization: `Bearer ${this.session.accessToken}`, Location: JSON.stringify(point(location)),
          ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) });
    } catch { throw new Error('Bird map request failed or timed out'); }
    if (!response.ok) {
      if ([401, 403, 429].includes(response.status)) {
        const retry = response.headers.get('retry-after');
        const requested = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - this.now();
        this.blockedUntil = this.now() + Math.max(COOLDOWN_MS, Number.isFinite(requested) ? requested : 0);
      }
      await response.body?.cancel();
      throw new Error(`Bird map HTTP ${response.status}`);
    }
    return jsonBody(response);
  }

  verify(payload, cells) {
    try { return { ...parseBirdMap(payload, cells), at: this.now() }; }
    catch (error) {
      if (error instanceof BirdUntrustedMapError) this.blockedUntil = this.now() + COOLDOWN_MS;
      throw error;
    }
  }

  async nearby(location, radius) {
    point(location);
    if (!finite(radius) || radius <= 0 || radius > 5000) throw new Error('Invalid Bird nearby radius');
    const query = new URLSearchParams({ latitude: String(location.latitude), longitude: String(location.longitude), radius: String(radius) });
    const result = this.verify(await this.request(`/bird/nearby?${query}`, location));
    if (result.vehicles.some(v => birdDistance(location, { latitude: v.lat, longitude: v.lng }) > radius + 30)) {
      this.blockedUntil = this.now() + COOLDOWN_MS;
      throw new BirdUntrustedMapError();
    }
    return result;
  }

  async cells(location, cells) {
    point(location);
    if (!Array.isArray(cells) || !cells.length || cells.length > 16 ||
      !cells.every(id => cellId(id, 12)) || new Set(cells).size !== cells.length) throw new Error('Invalid Bird cell query');
    return this.verify(await this.request('/bird/nearby-by-cells', location,
      { map_center: point(location), cell_ids: cells }), cells);
  }

  async cellsForBounds(box) {
    bounds(box);
    const payload = await this.request('/map/rider-cells', centerOf(box), { types: ['bird'],
      geometries: { view: { rect: { lo: { latitude: box.south, longitude: box.west },
        hi: { latitude: box.north, longitude: box.east } } } } });
    const result = payload?.cells?.view?.birds;
    if (!object(result) || result.strategy !== 's2-cell-12' || !Array.isArray(result.cell_ids) ||
      !result.cell_ids.length || result.cell_ids.length > 512 || !result.cell_ids.every(id => cellId(id, 12)) ||
      new Set(result.cell_ids).size !== result.cell_ids.length) {
      this.blockedUntil = this.now() + COOLDOWN_MS;
      throw new BirdUntrustedMapError();
    }
    return result.cell_ids;
  }
}

/** Keep parent observations while splitting capped views; never return a partial successful sweep. */
export async function scanBirdBounds(reader, box, { sideM = 3000, maxRequests = 300, onProgress = () => {} } = {}) {
  bounds(box);
  if (!finite(sideM) || sideM < 100 || sideM > 5000 || !Number.isInteger(maxRequests) || maxRequests < 1 || maxRequests > 1000) {
    throw new Error('Invalid Bird sweep budget');
  }
  const startedAt = reader.now();
  const startRequests = reader.requests;
  const dLat = sideM / 111_320;
  const dLng = sideM / (111_320 * Math.cos(centerOf(box).latitude * Math.PI / 180));
  const queue = [];
  for (let s = box.south; s < box.north; s += dLat) for (let w = box.west; w < box.east; w += dLng) {
    queue.push({ south: s, west: w, north: Math.min(s + dLat, box.north), east: Math.min(w + dLng, box.east) });
  }
  if (queue.length > maxRequests) throw new BirdIncompleteMapError();
  const vehicles = new Map();
  let cappedViews = 0;
  while (queue.length) {
    if (reader.requests - startRequests >= maxRequests) throw new BirdIncompleteMapError();
    const view = queue.shift();
    const location = centerOf(view);
    const radius = Math.ceil(Math.max(...[view.south, view.north].flatMap(latitude =>
      [view.west, view.east].map(longitude => birdDistance(location, { latitude, longitude }))))) + 2;
    const result = await reader.nearby(location, radius);
    for (const vehicle of result.vehicles) if (inside(box, vehicle)) vehicles.set(vehicle.id, vehicle);
    if (result.capped) {
      cappedViews++;
      if (birdDistance({ latitude: view.south, longitude: view.west },
        { latitude: view.north, longitude: view.east }) < 100) throw new BirdIncompleteMapError();
      const { latitude, longitude } = location;
      queue.unshift(
        { south: view.south, west: view.west, north: latitude, east: longitude },
        { south: view.south, west: longitude, north: latitude, east: view.east },
        { south: latitude, west: view.west, north: view.north, east: longitude },
        { south: latitude, west: longitude, north: view.north, east: view.east });
    }
    if (queue.length > maxRequests - (reader.requests - startRequests)) throw new BirdIncompleteMapError();
    onProgress({ requests: reader.requests - startRequests, vehicles: vehicles.size, remaining: queue.length });
  }
  return { startedAt, finishedAt: reader.now(), bounds: box, requests: reader.requests - startRequests,
    cappedViews, vehicles: [...vehicles.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

async function main() {
  const args = process.argv.slice(2);
  const usage = 'Usage: node scripts/bird-app-map.mjs --session /private/session.json --bounds south,west,north,east [--output /private/result.json] [--max-requests 300]';
  if (!args.length || args.includes('--help')) { console.log(usage); return; }
  const options = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--session', '--bounds', '--output', '--max-requests'].includes(args[i]) || !args[i + 1] || options.has(args[i])) throw new Error(usage);
    options.set(args[i], args[i + 1]);
  }
  if (!options.has('--session') || !options.has('--bounds')) throw new Error(usage);
  const text = await readFile(options.get('--session'), 'utf8');
  if (text.length > 32_768) throw new Error('Bird session is too large');
  const session = JSON.parse(text);
  if (finite(session.accessExpiresAt) && session.accessExpiresAt <= Date.now()) throw new Error('Bird session has expired; renew it through the existing sign-in helper');
  const coordinates = options.get('--bounds').split(',').map(Number);
  if (coordinates.length !== 4 || coordinates.some(v => !finite(v))) throw new Error(usage);
  const [south, west, north, east] = coordinates;
  const result = await scanBirdBounds(new BirdMapReader({ session }), { south, west, north, east }, {
    maxRequests: Number(options.get('--max-requests') ?? 300),
    onProgress: p => { if (p.requests % 10 === 0 || !p.remaining) console.log(JSON.stringify(p)); },
  });
  if (options.has('--output')) {
    const target = resolve(options.get('--output'));
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(result), { mode: 0o600, flag: 'wx' });
      await rename(temporary, target);
    } finally { await rm(temporary, { force: true }); }
  }
  console.log(JSON.stringify({ vehicles: result.vehicles.length, requests: result.requests,
    startedAt: new Date(result.startedAt).toISOString(), finishedAt: new Date(result.finishedAt).toISOString() }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error instanceof SyntaxError ? 'Invalid Bird session JSON' : error.message); process.exitCode = 1; });
}
