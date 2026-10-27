import { haversineM, polygonContainsPoint } from '../src/lib/geo';
import type { MapBounds } from '../src/lib/types';
import { takeNearest } from './sweeps';

/**
 * An app map that lists the vehicles nearest a point, nearest first, at most a page of them and
 * none beyond the radius asked: BinBin's ten, Bird's 250. A reply vouches for every scooter
 * nearer than its last vehicle, or within its whole radius when it lists fewer than its page, and
 * a sweep covers an outline with the circles its replies vouch for.
 */
export interface NearestMap {
  /** The operator, as the sweep's errors name it. */
  name: string;
  /** The most vehicles a reply lists. */
  page: number;
  /** How far a request reaches, in metres. */
  reachM: number;
  /** The side of the sweep's first cells, in metres: within one reply's reach of their middles. */
  cellM: number;
}
export interface NearestScooter { id: string; lat: number; lng: number }
/** A reply, and how far from its point it lists every scooter: its whole radius, or up to its last vehicle. */
export interface NearestReply<T extends NearestScooter> { scooters: T[]; completeM: number }
export interface NearestApi<T extends NearestScooter> { nearest(lat: number, lng: number, radiusM: number): Promise<NearestReply<T>> }

export type Ring = [number, number][];
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
// that has a page of scooters within a few metres of its middle, a pile.
const LEAF_M = 10;

/**
 * The cells of the area no certified circle holds yet, to ask at their middles. A cell no circle
 * reaches is asked whole; one partly reached is split, down to LEAF_M. A pile is counted and
 * dropped: the sweep keeps the page it sees there.
 */
function openCells(map: NearestMap, rings: readonly Ring[], cells: readonly Cell[], discs: Discs, piles: { count: number }): Cell[] {
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
      else throw new Error(`${map.name} sweep asked a cell its reply did not reach`);
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

/** Cells of at most the map's cellM a side over the rings' box: the sweep's first open cells. */
function startCells(map: NearestMap, rings: readonly Ring[]): Cell[] {
  const lats = rings.flat().map(([lat]) => lat), lngs = rings.flat().map(([, lng]) => lng);
  const south = Math.min(...lats), north = Math.max(...lats), west = Math.min(...lngs), east = Math.max(...lngs);
  const rows = Math.max(1, Math.ceil(haversineM(south, west, north, west) / map.cellM));
  const columns = Math.max(1, Math.ceil(haversineM(south, west, south, east) / map.cellM));
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

/** The page smallest of the distances fed to it, to read the last of them: BinBin's tenth. */
class Nearest {
  readonly distances: number[] = [];
  constructor(private readonly page: number) {}
  add(distance: number) {
    const distances = this.distances, page = this.page;
    if (distances.length === page && distance >= distances[page - 1]) return;
    let index = distances.length < page ? distances.length : page - 1;
    while (index > 0 && distances[index - 1] > distance) { distances[index] = distances[index - 1]; index--; }
    distances[index] = distance;
  }
  get last() { return this.distances.length === this.page ? this.distances[this.page - 1] : Infinity; }
}
// A grid square's key, for squares within 2,048 of the middle each way.
const square = (i: number, j: number) => (i + 2048) * 4096 + j + 2048;
const pause = () => new Promise<void>(resolve => setImmediate(resolve));

/**
 * Where to ask first, from where the scooters stood at the last sweep: few points whose page of
 * nearest would then have reached over the whole area, picked greedily over a grid of samples.
 * Those that moved leave gaps, which the sweep then asks about; with none known it asks cell by
 * cell. Eskişehir's 631 scooters took 196 requests cell by cell and 130 from such a plan, on 24
 * October 2026 (docs/binbin-app-map.md). The cache answers requests meanwhile: the plan pauses
 * for them every few milliseconds.
 */
export async function planNearestSweep(map: NearestMap, rings: readonly Ring[], previous: readonly { lat: number; lng: number }[],
  options: { samples?: number } = {}): Promise<[number, number][]> {
  if (previous.length < map.page) return [];
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
  // The scooters by 250 m square, to find a point's page-th nearest; beyond 2 km, among them all.
  const G = 250;
  const scooters = new Map<number, number[]>();
  const all = previous.map(({ lat, lng }) => [x(lng), y(lat)]);
  for (const [sx, sy] of all) {
    const key = square(Math.floor(sx / G), Math.floor(sy / G));
    const bucket = scooters.get(key);
    if (bucket) bucket.push(sx, sy); else scooters.set(key, [sx, sy]);
  }
  const pageth = (px: number, py: number) => {
    const gx = Math.floor(px / G), gy = Math.floor(py / G);
    for (let reach = 1; reach <= 8; reach *= 2) {
      const nearest = new Nearest(map.page);
      for (let i = gx - reach; i <= gx + reach; i++) for (let j = gy - reach; j <= gy + reach; j++) {
        const bucket = scooters.get(square(i, j));
        if (bucket) for (let k = 0; k < bucket.length; k += 2) nearest.add(Math.hypot(bucket[k] - px, bucket[k + 1] - py));
      }
      // The squares searched hold every scooter nearer than their edge.
      if (nearest.last <= reach * G) return nearest.last;
    }
    const nearest = new Nearest(map.page);
    for (const [sx, sy] of all) nearest.add(Math.hypot(sx - px, sy - py));
    return Math.min(nearest.last, map.reachM);
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
  // Candidates every one and a half samples, each reaching a little short of its page-th nearest
  // then. Lazy greedy: a candidate's gain only falls as others are picked.
  const candidates = new Gains<{ px: number; py: number; r: number; gain: number }>();
  let paused = performance.now();
  const breathe = async () => { if (performance.now() - paused > 10) { await pause(); paused = performance.now(); } };
  for (let py = minY; py <= maxY; py += step * 1.5) {
    insideRow(py, minX, step * 1.5, px => {
      const r = pageth(px, py) * 0.9;
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

export interface NearestSweep<T extends NearestScooter> { scooters: T[]; requests: number; planned: number; piles: number; startedAt: number }
// Requests a sweep keeps under way: a reply takes 0.3 to 0.5 s from Europe, longer than the
// client's pacing, which alone then sets the pace.
const IN_FLIGHT = 3;
export interface SweepLimits { requests: number; milliseconds: number; retryMs: number }

/** The square inside the circle a reply lists every scooter of. */
function heldSquare(lat: number, lng: number, radiusM: number): MapBounds {
  const dLat = radiusM / Math.SQRT2 / 111_320;
  const dLng = dLat / Math.max(Math.cos(lat * Math.PI / 180), 0.01);
  return { south: lat - dLat, north: lat + dLat, west: lng - dLng, east: lng + dLng };
}

/**
 * A complete sweep of one service area: every point of its outline ends within a reply that
 * lists every scooter that near it. A sweep that cannot finish within its limits fails, and the
 * cache keeps the area's last sweep. Each scooter it sees, inside the outline or not, is in found
 * as soon as it is seen, and `done` hears of the square each reply answers for.
 */
export async function sweepNearestArea<T extends NearestScooter>(map: NearestMap, api: NearestApi<T>, rings: readonly Ring[],
  previous: readonly { lat: number; lng: number }[], limits: SweepLimits, found = new Map<string, T>(),
  done?: (part: MapBounds) => void): Promise<NearestSweep<T>> {
  const startedAt = Date.now();
  const discs = new Discs();
  const piles = { count: 0 };
  let requests = 0;
  const ask = async (lat: number, lng: number) => {
    let reply: NearestReply<T> | undefined;
    for (let attempt = 0; !reply; attempt++) {
      if (++requests > limits.requests || Date.now() - startedAt > limits.milliseconds) throw new Error(`${map.name} sweep exceeded its limits`);
      try { reply = await api.nearest(lat, lng, map.reachM); } catch (error) {
        if (attempt >= 2 || !(error as { transient?: boolean }).transient) throw error;
        await new Promise(resolve => setTimeout(resolve, limits.retryMs * (attempt + 1)));
      }
    }
    // The later of two sightings of a scooter ridden meanwhile wins.
    for (const scooter of reply.scooters) found.set(scooter.id, scooter);
    discs.add({ lat, lng, r: reply.completeM });
    done?.(heldSquare(lat, lng, reply.completeM));
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
  // The plan's points are asked whatever the replies before them found, so they need no lanes: they
  // go in turn, the nearest to where people look first (takeNearest). Each in its own run, as cells
  // go, a part of town someone opened waited its run's turn: on 26 October 2026 a first visit to
  // Kadıköy saw 10 of its 113 scooters fresh after 20 seconds.
  const inTurn = async (items: readonly [number, number][], run: (item: [number, number]) => Promise<void>) => {
    const queue = [...items];
    await Promise.all(Array.from({ length: Math.min(IN_FLIGHT, queue.length) }, async () => {
      try {
        for (let item = take(queue); item && !failed; item = take(queue)) await run(item);
      } catch (error) { failed = true; throw error; }
    }));
  };
  const take = (queue: [number, number][]) => takeNearest(queue, ([lat, lng]) => ({ south: lat, north: lat, west: lng, east: lng }));
  const plan = await planNearestSweep(map, rings, previous);
  await inTurn(plan, ([lat, lng]) => ask(lat, lng));
  let cells = openCells(map, rings, startCells(map, rings), discs, piles);
  while (cells.length) {
    await inLanes(cells, async cell => {
      // One of the replies before may have reached it.
      if (discs.near(cell).some(disc => holds(disc, cell))) return;
      cell.asked = true;
      await ask(...middle(cell));
    });
    cells = openCells(map, rings, cells, discs, piles);
  }
  const scooters = [...found.values()].filter(scooter => rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng)));
  return { scooters, requests, planned: plan.length, piles: piles.count, startedAt };
}
