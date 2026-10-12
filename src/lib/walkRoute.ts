import { haversineM } from '@/lib/geo';
import { requestDeadline } from '@/lib/requestDeadline';

/**
 * The way on foot to a scooter or a parking bay, drawn on the map. Distances
 * are in metres; points are [lat, lng], as everywhere else in the app.
 */

type Point = [number, number];

/** Further than this in a straight line is no walk to a scooter: a maps app gives the directions. */
export const WALK_ROUTE_MAX_M = 10_000;
/** This close to the scooter, by your location, you are there. */
export const ARRIVED_M = 20;
/** Further than this from the way, or than half as much again as the location is accurate, is off it. */
export const OFF_ROUTE_M = 40;
/** A way is found again from where you are at most this often, and this many times on one walk. */
export const REROUTE_INTERVAL_MS = 15_000;
export const MAX_REROUTES = 10;
/** A scooter moved further than this is walked to where it is now. */
export const TARGET_MOVED_M = 25;
// The way starts on the nearest path: a gap larger than this to where you
// are, or to the scooter, is drawn too, so that the line reaches both.
const CONNECTOR_MIN_M = 2;
// Progress along the way only goes forward, but a location can be a little
// behind the last one: where a way doubles back, its other half is further on.
const BACKTRACK_M = 30;
const REQUEST_TIMEOUT_MS = 12_000;

export interface WalkPath {
  points: Point[];
  /** How far along the way each point is, from its start. */
  along: number[];
  lengthM: number;
}

/** Where a location is on the way. */
export interface WalkPosition {
  /** How far along the way, from its start, the nearest point of it is. */
  alongM: number;
  /** How far the location is from that point. */
  offM: number;
  /** That point. */
  point: Point;
  /** The segment it is on: between points[segment] and points[segment + 1]. */
  segment: number;
}

const samePlace = (a: Point, b: Point) => haversineM(a[0], a[1], b[0], b[1]) < CONNECTOR_MIN_M;

/** The way found between two points, from the one to the other even where it starts or ends on a path beside them. */
export function walkPath(found: Point[], from: Point, to: Point): WalkPath {
  const points: Point[] = [];
  const add = (point: Point) => {
    if (points.length === 0 || !samePlace(points[points.length - 1], point)) points.push(point);
  };
  add(from);
  for (const point of found) add(point);
  add(to);
  // From a point to itself: a way of one point, and no length.
  const along = [0];
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    along.push(along[i - 1] + haversineM(a[0], a[1], b[0], b[1]));
  }
  return { points, along, lengthM: along[along.length - 1] };
}

// Metres east and north of a reference point: flat enough over the few
// kilometres of a walk.
const METRES_PER_DEGREE = 111_320;

function planar(point: Point, reference: Point): { x: number; y: number } {
  return {
    x: (point[1] - reference[1]) * METRES_PER_DEGREE * Math.cos((reference[0] * Math.PI) / 180),
    y: (point[0] - reference[0]) * METRES_PER_DEGREE,
  };
}

/** Where a location is on the way: the nearest point of it, not behind the progress already made. */
export function locateOnPath(path: WalkPath, location: Point, fromM = 0): WalkPosition {
  const { points, along } = path;
  if (points.length === 1) {
    return { alongM: 0, offM: haversineM(location[0], location[1], points[0][0], points[0][1]), point: points[0], segment: 0 };
  }
  let best: { distance: number; segment: number; t: number } | null = null;
  for (let i = 0; i < points.length - 1; i++) {
    if (along[i + 1] < fromM - BACKTRACK_M) continue;
    const a = planar(points[i], location);
    const b = planar(points[i + 1], location);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    // The location is the origin of the plane: the nearest point is where it projects on the segment.
    const t = lengthSquared === 0 ? 0 : Math.min(1, Math.max(0, -(a.x * dx + a.y * dy) / lengthSquared));
    const distance = Math.hypot(a.x + t * dx, a.y + t * dy);
    if (!best || distance < best.distance) best = { distance, segment: i, t };
  }
  // Every segment is behind: the location is past the end.
  if (!best) best = { distance: Infinity, segment: points.length - 2, t: 1 };
  const { segment, t } = best;
  const [a, b] = [points[segment], points[segment + 1]];
  const point: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return {
    alongM: along[segment] + (along[segment + 1] - along[segment]) * t,
    offM: haversineM(location[0], location[1], point[0], point[1]),
    point,
    segment,
  };
}

/** How far is left to walk from a position: back to the way, then along the rest of it. */
export function remainingM(path: WalkPath, position: WalkPosition): number {
  return position.offM + Math.max(0, path.lengthM - position.alongM);
}

/** The way still ahead, drawn from where you are: the part walked is gone. */
export function wayAhead(path: WalkPath, position: WalkPosition, location: Point): Point[] {
  const ahead: Point[] = [location];
  if (!samePlace(location, position.point)) ahead.push(position.point);
  for (const point of path.points.slice(position.segment + 1)) {
    if (!samePlace(ahead[ahead.length - 1], point)) ahead.push(point);
  }
  return ahead;
}

/** The first part of the way, this long: the line as it is drawn, from start to end. */
export function pathUpTo(path: WalkPath, distanceM: number): Point[] {
  const { points, along } = path;
  if (distanceM >= path.lengthM) return points;
  const drawn: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (along[i] <= distanceM) {
      drawn.push(points[i]);
      continue;
    }
    const t = (distanceM - along[i - 1]) / (along[i] - along[i - 1]);
    const [a, b] = [points[i - 1], points[i]];
    drawn.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    break;
  }
  return drawn;
}

/** Off the way: further from it than the location can be trusted, and than a pavement on the other side of a street. */
export function offRoute(position: WalkPosition, accuracyM: number | null): boolean {
  return position.offM > Math.max(OFF_ROUTE_M, (accuracyM ?? 0) * 1.5);
}

/** Why no way was found: too far to ask for, none on foot, the server busy, or any other trouble. */
export type WalkRouteFailure = 'too_far' | 'no_route' | 'busy' | 'failed';

export class WalkRouteError extends Error {
  constructor(readonly reason: WalkRouteFailure) {
    super(`Walking route failed: ${reason}`);
    this.name = 'WalkRouteError';
  }
}

export interface FoundWalk {
  /** The way along paths and streets, [lat, lng]; it may start and end beside the two points asked for. */
  path: Point[];
  distanceM: number;
}

function isPoint(value: unknown): value is Point {
  return Array.isArray(value) && value.length === 2 && value.every(n => typeof n === 'number' && Number.isFinite(n));
}

/**
 * Asks this site's server for a way on foot. The two points go in the body of
 * a request that nothing caches; the server asks the routing service without
 * saying who wanted it.
 */
export async function fetchWalkRoute(from: Point, to: Point, signal: AbortSignal): Promise<FoundWalk> {
  // The server would say so too, after a request for nothing.
  if (haversineM(from[0], from[1], to[0], to[1]) > WALK_ROUTE_MAX_M) throw new WalkRouteError('too_far');
  const deadline = requestDeadline(signal, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch('/api/walk', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
      signal: deadline.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { reason?: unknown } | null;
      const reason = body?.reason;
      throw new WalkRouteError(
        reason === 'too_far' || reason === 'no_route' ? reason : response.status === 429 || response.status === 503 ? 'busy' : 'failed'
      );
    }
    const data = await response.json() as { path?: unknown; distanceM?: unknown };
    if (!Array.isArray(data.path) || !data.path.every(isPoint) || typeof data.distanceM !== 'number') {
      throw new WalkRouteError('failed');
    }
    return { path: data.path, distanceM: data.distanceM };
  } catch (error) {
    if (error instanceof WalkRouteError || signal.aborted) throw error;
    throw new WalkRouteError('failed');
  } finally {
    deadline.dispose();
  }
}
