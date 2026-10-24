import areaCatalog from '../data/binbin-areas.json';
import { boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';

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
/** An area nobody looks at is swept every two hours: a round of all 13 takes thousands of requests. */
export const BINBIN_IDLE_INTERVAL_MS = 2 * 60 * 60_000;
export const binbinMapRequests = { status: 0, metadata: 0 };

export interface BinbinScooter { id: string; lat: number; lng: number; battery: number | null }
/** A reply, and how far from its point it lists every scooter: its whole radius, or up to its tenth. */
export interface BinbinReply { scooters: BinbinScooter[]; completeM: number }
interface ClientOptions { fetch?: typeof fetch; now?: () => number; intervalMs?: number; timeoutMs?: number }
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
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private nextStart = 0;
  private blockedUntil = 0;

  constructor(options: ClientOptions = {}) {
    this.fetch = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.intervalMs = options.intervalMs ?? 250;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async nearest(lat: number, lng: number, radiusM = BINBIN_REACH_M): Promise<BinbinReply> {
    if (this.now() < this.blockedUntil) throw new Error('BinBin is temporarily rate limited');
    const wait = Math.max(0, this.nextStart - this.now());
    this.nextStart = this.now() + wait + this.intervalMs;
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
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
interface Cell { south: number; west: number; north: number; east: number; inside: boolean; asked: boolean }
interface Disc { lat: number; lng: number; r: number }
const middle = (cell: Cell): [number, number] => [(cell.south + cell.north) / 2, (cell.west + cell.east) / 2];
const corners = (cell: Cell): [number, number][] =>
  [[cell.south, cell.west], [cell.south, cell.east], [cell.north, cell.west], [cell.north, cell.east]];
const halfDiagonal = (cell: Cell) => haversineM(cell.south, cell.west, cell.north, cell.east) / 2;

function segmentsCross([a, b]: [number, number][], [c, d]: [number, number][]): boolean {
  const side = (p: [number, number], q: [number, number], r: [number, number]) =>
    Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]));
  return side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b);
}

/** Whether the cell is outside every ring, inside one, or across an edge. */
function relate(rings: readonly Ring[], cell: Cell): 'outside' | 'inside' | 'across' {
  const box = corners(cell);
  const edges: [number, number][][] = [[box[0], box[1]], [box[1], box[3]], [box[3], box[2]], [box[2], box[0]]];
  for (const ring of rings) {
    const cornersIn = box.filter(([lat, lng]) => polygonContainsPoint(ring, lat, lng)).length;
    if (cornersIn > 0 && cornersIn < 4) return 'across';
    let crossed = false;
    for (let i = 0, j = ring.length - 1; i < ring.length && !crossed; j = i++) {
      const [lat, lng] = ring[i];
      if (lat >= cell.south && lat <= cell.north && lng >= cell.west && lng <= cell.east) crossed = true;
      else crossed = edges.some(edge => segmentsCross(edge, [ring[j], ring[i]]));
    }
    if (crossed) return 'across';
    if (cornersIn === 4) return 'inside';
  }
  return 'outside';
}

/** The certified circles of a sweep, bucketed by where they reach. */
class Discs {
  private readonly buckets = new Map<string, Disc[]>();
  private readonly wide: Disc[] = [];
  readonly all: Disc[] = [];
  private static readonly SIZE = 0.01;
  private static key(lat: number, lng: number) { return `${Math.floor(lat / Discs.SIZE)},${Math.floor(lng / Discs.SIZE)}`; }
  add(disc: Disc) {
    this.all.push(disc);
    if (disc.r > 5_000) { this.wide.push(disc); return; }
    const dLat = disc.r / 111_195, dLng = dLat / Math.cos(disc.lat * Math.PI / 180);
    for (let lat = Math.floor((disc.lat - dLat) / Discs.SIZE); lat <= Math.floor((disc.lat + dLat) / Discs.SIZE); lat++) {
      for (let lng = Math.floor((disc.lng - dLng) / Discs.SIZE); lng <= Math.floor((disc.lng + dLng) / Discs.SIZE); lng++) {
        const key = `${lat},${lng}`;
        const bucket = this.buckets.get(key);
        if (bucket) bucket.push(disc); else this.buckets.set(key, [disc]);
      }
    }
  }
  near(cell: Cell): Disc[] {
    const found = new Set(this.wide);
    const [south, west] = Discs.key(cell.south, cell.west).split(',').map(Number);
    const [north, east] = Discs.key(cell.north, cell.east).split(',').map(Number);
    if ((north - south + 1) * (east - west + 1) > 400) return this.all;
    for (let lat = south; lat <= north; lat++) for (let lng = west; lng <= east; lng++) {
      for (const disc of this.buckets.get(`${lat},${lng}`) ?? []) found.add(disc);
    }
    return [...found];
  }
}
const holds = (disc: Disc, cell: Cell) => corners(cell).every(([lat, lng]) => haversineM(disc.lat, disc.lng, lat, lng) <= disc.r);
const touches = (disc: Disc, cell: Cell) => {
  const lat = Math.min(Math.max(disc.lat, cell.south), cell.north), lng = Math.min(Math.max(disc.lng, cell.west), cell.east);
  return haversineM(disc.lat, disc.lng, lat, lng) <= disc.r;
};

// A cell this small that no one circle holds is asked at its middle; one still not held after
// that has ten scooters within a few metres of its middle, a pile.
const LEAF_M = 10;

/**
 * The cells of the area no certified circle holds yet, to ask at their middles. A cell no circle
 * reaches is asked whole; one partly reached is split, down to LEAF_M. A pile is counted and
 * dropped: the sweep keeps the ten it sees there.
 */
function openCells(rings: readonly Ring[], cells: readonly Cell[], discs: Discs, piles: { count: number }): Cell[] {
  const open: Cell[] = [];
  const stack = [...cells];
  while (stack.length) {
    const cell = stack.pop()!;
    const relation = cell.inside ? 'inside' : relate(rings, cell);
    if (relation === 'outside') continue;
    const near = discs.near(cell).filter(disc => touches(disc, cell));
    if (near.some(disc => holds(disc, cell))) continue;
    if (halfDiagonal(cell) * 2 <= LEAF_M || !near.length) {
      if (!cell.asked) open.push(cell);
      else if (near.length) piles.count++;
      else throw new Error('BinBin sweep asked a cell its reply did not reach');
      continue;
    }
    const lat = (cell.south + cell.north) / 2, lng = (cell.west + cell.east) / 2, inside = relation === 'inside';
    stack.push({ south: cell.south, west: cell.west, north: lat, east: lng, inside, asked: false },
      { south: cell.south, west: lng, north: lat, east: cell.east, inside, asked: false },
      { south: lat, west: cell.west, north: cell.north, east: lng, inside, asked: false },
      { south: lat, west: lng, north: cell.north, east: cell.east, inside, asked: false });
  }
  return open;
}

/** Cells of at most about 4 km a side over the rings' box: the sweep's first open cells. */
function startCells(rings: readonly Ring[]): Cell[] {
  const lats = rings.flat().map(([lat]) => lat), lngs = rings.flat().map(([, lng]) => lng);
  const south = Math.min(...lats), north = Math.max(...lats), west = Math.min(...lngs), east = Math.max(...lngs);
  const rows = Math.max(1, Math.ceil(haversineM(south, west, north, west) / 4_000));
  const columns = Math.max(1, Math.ceil(haversineM(south, west, south, east) / 4_000));
  const cells: Cell[] = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    cells.push({ south: south + (north - south) * row / rows, north: south + (north - south) * (row + 1) / rows,
      west: west + (east - west) * column / columns, east: west + (east - west) * (column + 1) / columns, inside: false, asked: false });
  }
  return cells;
}

/** A max-heap of candidates by their last known gain. */
class Gains<T extends { gain: number }> {
  private readonly items: T[] = [];
  get size() { return this.items.length; }
  peek(): T | undefined { return this.items[0]; }
  push(item: T) {
    const items = this.items;
    let index = items.push(item) - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (items[parent].gain >= items[index].gain) break;
      [items[parent], items[index]] = [items[index], items[parent]];
      index = parent;
    }
  }
  pop(): T | undefined {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (!items.length || !last) return top;
    items[0] = last;
    for (let index = 0; ;) {
      const left = index * 2 + 1, right = left + 1;
      let largest = index;
      if (left < items.length && items[left].gain > items[largest].gain) largest = left;
      if (right < items.length && items[right].gain > items[largest].gain) largest = right;
      if (largest === index) break;
      [items[largest], items[index]] = [items[index], items[largest]];
      index = largest;
    }
    return top;
  }
}

/** The ten smallest of the distances fed to it, to read the tenth. */
class Nearest {
  readonly distances: number[] = [];
  add(distance: number) {
    const distances = this.distances;
    if (distances.length === BINBIN_PAGE && distance >= distances[BINBIN_PAGE - 1]) return;
    let index = distances.length < BINBIN_PAGE ? distances.length : BINBIN_PAGE - 1;
    while (index > 0 && distances[index - 1] > distance) { distances[index] = distances[index - 1]; index--; }
    distances[index] = distance;
  }
  get tenth() { return this.distances.length === BINBIN_PAGE ? this.distances[BINBIN_PAGE - 1] : Infinity; }
}
// A grid square's key, for squares within 2,048 of the middle each way.
const square = (i: number, j: number) => (i + 2048) * 4096 + j + 2048;
const pause = () => new Promise<void>(resolve => setImmediate(resolve));

/**
 * Where to ask first, from where the scooters stood at the last sweep: few points whose ten
 * nearest would then have reached over the whole area, picked greedily over a grid of samples.
 * Those that moved leave gaps, which the sweep then asks about; with none known it asks cell by
 * cell. Eskişehir's 631 scooters took 196 requests cell by cell and 130 from such a plan, on 24
 * October 2026 (docs/binbin-app-map.md). The cache answers requests meanwhile: the plan pauses
 * for them every few milliseconds.
 */
export async function planBinbinSweep(rings: readonly Ring[], previous: readonly { lat: number; lng: number }[],
  options: { samples?: number } = {}): Promise<[number, number][]> {
  if (previous.length < BINBIN_PAGE) return [];
  const lats = rings.flat().map(([lat]) => lat), lngs = rings.flat().map(([, lng]) => lng);
  const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2, lng0 = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  // Metres east and north of the box's middle: flat enough across a town.
  const mLat = 111_195, mLng = mLat * Math.cos(lat0 * Math.PI / 180);
  const x = (lng: number) => (lng - lng0) * mLng, y = (lat: number) => (lat - lat0) * mLat;
  const minX = x(Math.min(...lngs)), maxX = x(Math.max(...lngs)), minY = y(Math.min(...lats)), maxY = y(Math.max(...lats));
  const step = Math.max(40, Math.sqrt((maxX - minX) * (maxY - minY) / (options.samples ?? 60_000)));
  const edges = rings.flatMap(ring => ring.map((point, i) => [point, ring[(i + 1) % ring.length]].map(([lat, lng]) => [x(lng), y(lat)])));
  // Where a row crosses the outline, west to east: inside between the first two, the next two...
  const crossings = (py: number) => edges.flatMap(([[ax, ay], [bx, by]]) =>
    (ay > py) !== (by > py) ? [ax + (py - ay) / (by - ay) * (bx - ax)] : []).sort((a, b) => a - b);
  const insideRow = (py: number, from: number, every: number, visit: (px: number) => void) => {
    const across = crossings(py);
    for (let k = 0; k + 1 < across.length; k += 2) {
      for (let px = from + Math.ceil((across[k] - from) / every) * every; px <= across[k + 1]; px += every) visit(px);
    }
  };
  // The scooters by 250 m square, to find a point's tenth nearest; beyond 2 km, among them all.
  const G = 250;
  const scooters = new Map<number, number[]>();
  const all = previous.map(({ lat, lng }) => [x(lng), y(lat)]);
  for (const [sx, sy] of all) {
    const key = square(Math.floor(sx / G), Math.floor(sy / G));
    const bucket = scooters.get(key);
    if (bucket) bucket.push(sx, sy); else scooters.set(key, [sx, sy]);
  }
  const tenth = (px: number, py: number) => {
    const gx = Math.floor(px / G), gy = Math.floor(py / G);
    for (let reach = 1; reach <= 8; reach *= 2) {
      const nearest = new Nearest();
      for (let i = gx - reach; i <= gx + reach; i++) for (let j = gy - reach; j <= gy + reach; j++) {
        const bucket = scooters.get(square(i, j));
        if (bucket) for (let k = 0; k < bucket.length; k += 2) nearest.add(Math.hypot(bucket[k] - px, bucket[k + 1] - py));
      }
      // The squares searched hold every scooter nearer than their edge.
      if (nearest.tenth <= reach * G) return nearest.tenth;
    }
    const nearest = new Nearest();
    for (const [sx, sy] of all) nearest.add(Math.hypot(sx - px, sy - py));
    return Math.min(nearest.tenth, BINBIN_REACH_M);
  };
  // The samples by 500 m square, each square counting those no pick reaches yet.
  const S = 500;
  const squares = new Map<number, { xs: number[]; ys: number[]; reached: Uint8Array; open: number }>();
  let open = 0;
  for (let py = minY + step / 2; py < maxY; py += step) insideRow(py, minX + step / 2, step, px => {
    const key = square(Math.floor(px / S), Math.floor(py / S));
    const found = squares.get(key) ?? { xs: [], ys: [], reached: new Uint8Array(0), open: 0 };
    found.xs.push(px);
    found.ys.push(py);
    squares.set(key, found);
    open++;
  });
  for (const found of squares.values()) { found.reached = new Uint8Array(found.xs.length); found.open = found.xs.length; }
  const reach = (px: number, py: number, r: number, mark: boolean) => {
    let count = 0;
    for (let i = Math.floor((px - r) / S); i <= Math.floor((px + r) / S); i++) for (let j = Math.floor((py - r) / S); j <= Math.floor((py + r) / S); j++) {
      const found = squares.get(square(i, j));
      if (!found?.open) continue;
      const whole = Math.hypot(Math.abs((i + 0.5) * S - px) + S / 2, Math.abs((j + 0.5) * S - py) + S / 2) <= r;
      if (whole && !mark) { count += found.open; continue; }
      for (let k = 0; k < found.xs.length; k++) {
        if (found.reached[k] || (!whole && Math.hypot(found.xs[k] - px, found.ys[k] - py) > r)) continue;
        count++;
        if (mark) { found.reached[k] = 1; found.open--; }
      }
    }
    return count;
  };
  // Candidates every one and a half samples, each reaching a little short of its tenth nearest
  // then. Lazy greedy: a candidate's gain only falls as others are picked.
  const candidates = new Gains<{ px: number; py: number; r: number; gain: number }>();
  let paused = performance.now();
  const breathe = async () => { if (performance.now() - paused > 10) { await pause(); paused = performance.now(); } };
  for (let py = minY; py <= maxY; py += step * 1.5) {
    insideRow(py, minX, step * 1.5, px => {
      const r = tenth(px, py) * 0.9;
      const gain = reach(px, py, r, false);
      if (gain) candidates.push({ px, py, r, gain });
    });
    await breathe();
  }
  const chosen: [number, number][] = [];
  while (open > 0 && candidates.size) {
    const top = candidates.pop()!;
    top.gain = reach(top.px, top.py, top.r, false);
    if (!top.gain) continue;
    if (top.gain < (candidates.peek()?.gain ?? 0)) { candidates.push(top); continue; }
    open -= reach(top.px, top.py, top.r, true);
    chosen.push([lat0 + top.py / mLat, lng0 + top.px / mLng]);
    await breathe();
  }
  return chosen;
}

export interface BinbinSweep { scooters: BinbinScooter[]; requests: number; planned: number; piles: number; startedAt: number }
// Requests a sweep keeps under way: a reply takes 0.3 to 0.5 s from Europe, longer than the
// client's pacing, which alone then sets the pace.
const IN_FLIGHT = 3;
interface Limits { requests: number; milliseconds: number; retryMs: number }

/**
 * A complete sweep of one service area: every point of its outline ends within a reply that
 * lists every scooter that near it. A sweep that cannot finish within its limits fails, and the
 * cache keeps the area's last sweep. Each scooter it sees, inside the outline or not, is in found
 * as soon as it is seen.
 */
export async function sweepBinbinArea(api: Pick<BinbinClient, 'nearest'>, rings: readonly Ring[],
  previous: readonly { lat: number; lng: number }[], limits: Limits = { requests: 3_000, milliseconds: 20 * 60_000, retryMs: 3_000 },
  found = new Map<string, BinbinScooter>()): Promise<BinbinSweep> {
  const startedAt = Date.now();
  const discs = new Discs();
  const piles = { count: 0 };
  let requests = 0;
  const ask = async (lat: number, lng: number) => {
    let reply: BinbinReply | undefined;
    for (let attempt = 0; !reply; attempt++) {
      if (++requests > limits.requests || Date.now() - startedAt > limits.milliseconds) throw new Error('BinBin sweep exceeded its limits');
      try { reply = await api.nearest(lat, lng, BINBIN_REACH_M); } catch (error) {
        if (attempt >= 2 || !(error as { transient?: boolean }).transient) throw error;
        await new Promise(resolve => setTimeout(resolve, limits.retryMs * (attempt + 1)));
      }
    }
    // The later of two sightings of a scooter ridden meanwhile wins.
    for (const scooter of reply.scooters) found.set(scooter.id, scooter);
    discs.add({ lat, lng, r: reply.completeM });
  };
  // Up to IN_FLIGHT at once, and none started once one has failed. Each lane works through its own
  // run of the items, which openCells lists neighbours next to neighbours: a reply can spare the
  // next cell of its lane, and the lanes ask far apart. One that runs out takes the far end of the
  // longest. A single queue would ask a cell's four quarters at once, before any reply could spare
  // the others: half as many requests again as one at a time.
  let failed = false;
  const inLanes = async <T>(items: readonly T[], run: (item: T) => Promise<void>) => {
    const count = Math.min(IN_FLIGHT, items.length);
    const lanes = Array.from({ length: count }, (_, i) => ({
      next: Math.floor(i * items.length / count), end: Math.floor((i + 1) * items.length / count) }));
    await Promise.all(lanes.map(async lane => {
      try {
        while (!failed) {
          const longest = lanes.reduce((a, b) => b.end - b.next > a.end - a.next ? b : a);
          if (lane.next < lane.end) await run(items[lane.next++]);
          else if (longest.next < longest.end) await run(items[--longest.end]);
          else return;
        }
      } catch (error) { failed = true; throw error; }
    }));
  };
  const plan = await planBinbinSweep(rings, previous);
  await inLanes(plan, ([lat, lng]) => ask(lat, lng));
  let cells = openCells(rings, startCells(rings), discs, piles);
  while (cells.length) {
    await inLanes(cells, async cell => {
      // One of the replies before may have reached it.
      if (discs.near(cell).some(disc => holds(disc, cell))) return;
      cell.asked = true;
      await ask(...middle(cell));
    });
    cells = openCells(rings, cells, discs, piles);
  }
  const scooters = [...found.values()].filter(scooter => rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng)));
  return { scooters, requests, planned: plan.length, piles: piles.count, startedAt };
}

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
  let sweep: BinbinSweep;
  try { sweep = await sweepBinbinArea(api, rings, [...known.values()], undefined, seen); } catch (error) {
    for (const { id, lat, lng } of seen.values()) known.set(`${system.id}:${id}`, { lat, lng });
    sightings.set(system.id, known);
    throw error;
  }
  sightings.delete(system.id);
  console.log(JSON.stringify({ event: 'binbin_sweep', system: system.id, scooters: sweep.scooters.length,
    requests: sweep.requests, planned: sweep.planned, piles: sweep.piles, seconds: Math.round((Date.now() - sweep.startedAt) / 1000) }));
  // Positions as old as the sweep's first reply.
  return { observedAt: sweep.startedAt, stale: false,
    vehicles: sweep.scooters.filter(scooter => boundsContainPoint(system.bounds, scooter.lat, scooter.lng)).map(scooter => ({
      provider: 'binbin', vehicle_id: `${system.id}:${scooter.id}`, lat: scooter.lat, lng: scooter.lng,
      battery: scooter.battery, range_m: null, deep_link: null, distance_m: null,
    })) };
}

const client = new BinbinClient();
/** A sweep from nothing known, as scripts/check-french-feeds.mjs makes. */
export const collectBinbinRegion = (system: RegionalScooterSystem) => collectBinbinArea(system, [], client);
/** Each area's sweep is planned from the positions the cache last published for it. */
export function withBinbinAppCollectors(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[],
  previous: PreviousPositions, api: Pick<BinbinClient, 'nearest'> = client) {
  const areas = new Map(systems.filter(system => system.binbinAppArea).map(system => [system.id, system]));
  return feeds.map(feed => {
    const area = areas.get(feed.id.slice(feed.id.indexOf(':') + 1));
    return area ? { ...feed, idleIntervalMs: BINBIN_IDLE_INTERVAL_MS,
      collect: () => collectBinbinArea(area, previous(feed.id) ?? [], api) } : feed;
  });
}
