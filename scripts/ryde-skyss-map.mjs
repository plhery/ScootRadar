// Read-only research reader. The production collector does not import this file.
import { randomUUID } from 'node:crypto';
import { writeFile, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ENDPOINT = 'https://cosmo-router.transhub.io/graphql';
const CAP = 500; // Observed ceiling; a full page is never a complete view.
const MAX_BYTES = 4 * 1024 * 1024;
const QUERIES = {
  mobilityServices: 'query mobilityServices { mobilityServices_v2 { services { zone vendor type status integrationType } } }',
  nearbyEVehicles: 'query nearbyEVehicles($northWest: LocationInput!, $southEast: LocationInput!, $vendors: [Vendor_v2!]!, $rentalProductTypes: [RentalProductType!]!) { nearbyVehicles_v4(vendors: $vendors, northwest: $northWest, southeast: $southEast, rentalProductTypes: $rentalProductTypes) { __typename id vendor lat lon type } }',
};
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const finite = v => typeof v === 'number' && Number.isFinite(v);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export class SkyssMapError extends Error {
  constructor(message = 'Skyss returned an unverified Ryde map') { super(message); }
}
export class SkyssIncompleteMapError extends SkyssMapError {
  constructor() { super('Skyss scan stopped before all requested views were read'); }
}

function bounds(value) {
  if (!object(value) || !['south', 'west', 'north', 'east'].every(k => finite(value[k])) ||
    value.south >= value.north || value.west >= value.east ||
    value.south < 60.15 || value.north > 60.65 || value.west < 4.8 || value.east > 5.8 ||
    value.north - value.south > 0.15 || value.east - value.west > 0.3) {
    throw new SkyssMapError('Invalid or oversized Bergen bounds');
  }
  return { south: value.south, west: value.west, north: value.north, east: value.east };
}
function inside(box, v) {
  const epsilon = 0.000002; // Boundary rounding, about 20 cm of latitude.
  return v.lat >= box.south - epsilon && v.lat <= box.north + epsilon &&
    v.lng >= box.west - epsilon && v.lng <= box.east + epsilon;
}
function data(payload) {
  if (!object(payload) || !object(payload.data) ||
    (payload.errors !== undefined && (!Array.isArray(payload.errors) || payload.errors.length))) {
    throw new SkyssMapError();
  }
  return payload.data;
}

export function parseSkyssServices(payload) {
  const groups = data(payload).mobilityServices_v2;
  if (!Array.isArray(groups) || groups.length > 100 ||
    groups.some(g => !object(g) || !Array.isArray(g.services) || g.services.length > 100)) {
    throw new SkyssMapError();
  }
  const matches = groups.flatMap(g => g.services).filter(v => object(v) &&
    v.zone === 'BERGEN' && v.vendor === 'RYDE' && v.type === 'ESCOOTER');
  if (matches.length !== 1 || matches[0].status !== 'NORMAL_SERVICE' || matches[0].integrationType !== 'DEEP_LINK') {
    throw new SkyssMapError('Skyss did not confirm the Ryde scooter service in Bergen');
  }
  return { city: 'Bergen', provider: 'ryde', status: matches[0].status };
}

export function parseSkyssMap(payload, requestedBounds) {
  const box = bounds(requestedBounds);
  const rows = data(payload).nearbyVehicles_v4;
  if (!Array.isArray(rows) || rows.length > 5000) throw new SkyssMapError();
  const ids = new Set();
  const vehicles = rows.map(v => {
    if (!object(v) || v.__typename !== 'VehicleDetailsLite' || v.vendor !== 'RYDE' || v.type !== 'ESCOOTER' ||
      typeof v.id !== 'string' || !/^[1-9]\d{14}$/.test(v.id) || ids.has(v.id) ||
      !finite(v.lat) || !finite(v.lon) || !inside(box, { lat: v.lat, lng: v.lon })) {
      throw new SkyssMapError();
    }
    ids.add(v.id);
    // The map list has no battery, range, rentability or position timestamp.
    return { id: v.id, lat: v.lat, lng: v.lon };
  });
  return { vehicles, capped: rows.length >= CAP };
}

async function jsonBody(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new SkyssMapError();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) throw new SkyssMapError('Skyss response is too large');
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { return JSON.parse(new TextDecoder().decode(bytes)); }
    catch { throw new SkyssMapError('Skyss returned invalid JSON'); }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export class SkyssRydeReader {
  constructor({ fetch: fetcher = globalThis.fetch, now = Date.now, sleep: sleeper = sleep } = {}) {
    this.fetch = fetcher;
    this.now = now;
    this.sleep = sleeper;
    this.requests = 0;
    this.nextAt = 0;
    this.blockedUntil = 0;
    this.queue = Promise.resolve();
  }

  request(operation, variables, deadline) {
    if (!Object.hasOwn(QUERIES, operation)) return Promise.reject(new SkyssMapError('Unsupported Skyss operation'));
    const run = this.queue.then(async () => {
      if (this.now() < this.blockedUntil) throw new SkyssMapError('Skyss reader is held off after rate limiting');
      const delay = Math.max(0, this.nextAt - this.now());
      if (this.now() + delay >= deadline) throw new SkyssIncompleteMapError();
      if (delay) await this.sleep(delay);
      const remaining = deadline - this.now();
      if (remaining <= 0) throw new SkyssIncompleteMapError();
      this.requests++;
      this.nextAt = this.now() + 2000;
      let response;
      try {
        response = await this.fetch(ENDPOINT, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(Math.min(20_000, Math.ceil(remaining))),
          headers: { 'Content-Type': 'application/json', 'client-platform': 'android', 'client-version': '7.102.0',
            'client-build-date': '1790928393', 'owner-id': 'SKYSS', 'accept-language': 'en' },
          body: JSON.stringify({ query: QUERIES[operation], operationName: operation, variables }),
        });
      } catch { throw new SkyssMapError('Skyss map request failed'); }
      if (response.status === 429) {
        const retry = response.headers.get('retry-after');
        const seconds = retry && /^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry ?? '') - this.now();
        this.blockedUntil = this.now() + Math.max(15 * 60_000, finite(seconds) ? seconds : 0);
      }
      if (!response.ok) {
        await response.body?.cancel().catch(() => {});
        throw new SkyssMapError(`Skyss map HTTP ${response.status}`);
      }
      try { return await jsonBody(response); }
      catch (error) {
        if (error instanceof SkyssMapError) throw error;
        throw new SkyssMapError('Skyss response read failed');
      }
    });
    this.queue = run.catch(() => {});
    return run;
  }

  async services(deadline = this.now() + 20_000) {
    return parseSkyssServices(await this.request('mobilityServices', {}, deadline));
  }

  async map(requestedBounds, deadline = this.now() + 20_000) {
    const box = bounds(requestedBounds);
    const variables = { northWest: { latitude: box.north, longitude: box.west },
      southEast: { latitude: box.south, longitude: box.east }, vendors: ['RYDE'], rentalProductTypes: ['ESCOOTER'] };
    return parseSkyssMap(await this.request('nearbyEVehicles', variables, deadline), box);
  }
}

export async function scanSkyssRydeBounds(reader, requestedBounds, { maxRequests = 32, onProgress = () => {} } = {}) {
  const box = bounds(requestedBounds);
  if (!Number.isInteger(maxRequests) || maxRequests < 2 || maxRequests > 64) throw new SkyssMapError('Invalid Skyss request budget');
  const startedAt = reader.now();
  const startRequests = reader.requests;
  const deadline = startedAt + 120_000;
  await reader.services(deadline);
  const pending = [{ box, depth: 0 }];
  const vehicles = new Map();
  const views = [];
  let cappedViews = 0;
  let leafViews = 0;
  while (pending.length) {
    if (reader.requests - startRequests >= maxRequests || reader.now() >= deadline) throw new SkyssIncompleteMapError();
    const { box: view, depth } = pending.shift();
    const page = await reader.map(view, deadline);
    views.push({ bounds: view, observedAt: reader.now(), candidates: page.vehicles.length, capped: page.capped });
    for (const vehicle of page.vehicles) vehicles.set(vehicle.id, vehicle);
    if (vehicles.size > 50_000) throw new SkyssIncompleteMapError();
    if (page.capped || view.north - view.south > 0.02 || view.east - view.west > 0.04) {
      if (page.capped) cappedViews++;
      if (depth >= 8) throw new SkyssIncompleteMapError();
      const lat = (view.north + view.south) / 2;
      const lng = (view.east + view.west) / 2;
      pending.unshift(
        { box: { south: view.south, west: view.west, north: lat, east: lng }, depth: depth + 1 },
        { box: { south: view.south, west: lng, north: lat, east: view.east }, depth: depth + 1 },
        { box: { south: lat, west: view.west, north: view.north, east: lng }, depth: depth + 1 },
        { box: { south: lat, west: lng, north: view.north, east: view.east }, depth: depth + 1 });
    } else { leafViews++; }
    if (pending.length > maxRequests - (reader.requests - startRequests)) throw new SkyssIncompleteMapError();
    onProgress({ requests: reader.requests - startRequests, vehicles: vehicles.size,
      remaining: pending.length, cappedViews, leafViews });
  }
  if (reader.now() >= deadline) throw new SkyssIncompleteMapError();
  // Uncapped local views can still disagree. This is a set of observations,
  // not a guarantee of a complete, simultaneous provider inventory.
  return { source: 'Skyss guest map via Tet/Ruter', provider: 'ryde', city: 'Bergen', bounds: box, coverage: 'observations-only',
    startedAt, finishedAt: reader.now(), requests: reader.requests - startRequests, cappedViews, leafViews,
    views, vehicles: [...vehicles.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

async function main() {
  const args = process.argv.slice(2);
  const usage = 'Usage: node scripts/ryde-skyss-map.mjs --bounds south,west,north,east [--output /private/result.json] [--max-requests 32]';
  if (!args.length || args.includes('--help')) { console.log(usage); return; }
  const options = new Map();
  for (let i = 0; i < args.length; i += 2) {
    if (!['--bounds', '--output', '--max-requests'].includes(args[i]) || !args[i + 1] || options.has(args[i])) throw new SkyssMapError(usage);
    options.set(args[i], args[i + 1]);
  }
  const coordinates = options.get('--bounds')?.split(',').map(Number);
  if (coordinates?.length !== 4 || coordinates.some(v => !finite(v))) throw new SkyssMapError(usage);
  const [south, west, north, east] = coordinates;
  const result = await scanSkyssRydeBounds(new SkyssRydeReader(), { south, west, north, east }, {
    maxRequests: Number(options.get('--max-requests') ?? 32),
    onProgress: progress => console.log(JSON.stringify(progress)),
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
    cappedViews: result.cappedViews, leafViews: result.leafViews, coverage: result.coverage,
    startedAt: new Date(result.startedAt).toISOString(), finishedAt: new Date(result.finishedAt).toISOString() }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error instanceof SkyssMapError ? error.message : 'Skyss map reader failed'); process.exitCode = 1; });
}
