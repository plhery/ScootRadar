import type { FoundWalk } from '@/lib/walkRoute';

/**
 * The routing service the server asks for a way on foot: Valhalla, which
 * answers the same wherever it runs. FOSSGIS e.V. runs the public one on
 * OpenStreetMap data; another can be set with WALK_ROUTE_API_URL.
 */
export const DEFAULT_WALK_ROUTE_API_URL = 'https://valhalla1.openstreetmap.de/route';

type Point = [number, number];

/** The question: on foot, never by ferry, and nothing but the line and its length. */
export function valhallaWalkRequest(from: Point, to: Point) {
  return {
    locations: [{ lat: from[0], lon: from[1] }, { lat: to[0], lon: to[1] }],
    costing: 'pedestrian',
    // Only a preference to Valhalla: a way that still takes a ferry is turned down below.
    costing_options: { pedestrian: { use_ferry: 0 } },
    directions_type: 'none',
    units: 'kilometers',
  };
}

/** Valhalla's line: the points, six decimals each, as differences from the one before. */
export function decodePolyline6(encoded: string): Point[] {
  const points: Point[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) throw new Error('Truncated polyline');
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    lat += next();
    lng += next();
    points.push([lat / 1e6, lng / 1e6]);
  }
  return points;
}

// The errors that mean there is no way on foot between the two points, rather
// than trouble with the service: too far for it, no path near one of them, or
// no path joining them.
const NO_ROUTE_ERRORS = new Set([154, 170, 171, 442, 443]);

interface ValhallaAnswer {
  error_code?: unknown;
  trip?: {
    summary?: { length?: unknown; has_ferry?: unknown };
    legs?: { shape?: unknown }[];
  };
}

/** The way in Valhalla's answer; 'no_route' when there is none on foot, null when the answer makes no sense. */
export function parseValhallaWalk(body: unknown): FoundWalk | 'no_route' | null {
  if (!body || typeof body !== 'object') return null;
  const answer = body as ValhallaAnswer;
  if (typeof answer.error_code === 'number') return NO_ROUTE_ERRORS.has(answer.error_code) ? 'no_route' : null;
  const summary = answer.trip?.summary;
  const legs = answer.trip?.legs;
  if (!summary || typeof summary.length !== 'number' || !Number.isFinite(summary.length) || !Array.isArray(legs) || legs.length === 0) {
    return null;
  }
  // An island, or across a lake: a way by boat is not a walk.
  if (summary.has_ferry === true) return 'no_route';
  const path: Point[] = [];
  for (const leg of legs) {
    if (typeof leg.shape !== 'string') return null;
    let points: Point[];
    try {
      points = decodePolyline6(leg.shape);
    } catch {
      return null;
    }
    path.push(...points);
  }
  if (path.length === 0 || !path.every(([lat, lng]) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return null;
  return { path, distanceM: Math.round(summary.length * 1000) };
}
