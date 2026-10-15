import type { MapBounds } from '@/lib/types';

export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371000.0;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dl / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

export function boundsContainPoint(bounds: MapBounds, lat: number, lng: number): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

/** Ray casting; a ring of [lat, lng] points, small enough for lat/lng to stand for a plane. */
export function polygonContainsPoint(ring: readonly [number, number][], lat: number, lng: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i];
    const [latJ, lngJ] = ring[j];
    if ((latI > lat) !== (latJ > lat) && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI) inside = !inside;
  }
  return inside;
}

/**
 * What the screen shows of the map. A turned map shows less than its bounds,
 * which enclose the screen: then the corners of the screen say what is on it.
 */
export interface MapViewport extends MapBounds {
  /** [lat, lng] of each corner of the screen, in order around it; none while north is up. */
  corners?: readonly (readonly [number, number])[];
}

function mercatorY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

export function viewportContainsPoint(viewport: MapViewport, lat: number, lng: number): boolean {
  if (!boundsContainPoint(viewport, lat, lng)) return false;
  const { corners } = viewport;
  if (!corners) return true;
  // On the Mercator plane the screen is a rectangle, turned: a point on it is
  // on the same side of each of its edges.
  const y = mercatorY(lat);
  let side = 0;
  for (let i = 0; i < corners.length; i++) {
    const [aLat, aLng] = corners[i];
    const [bLat, bLng] = corners[(i + 1) % corners.length];
    const aY = mercatorY(aLat);
    const cross = Math.sign((bLng - aLng) * (y - aY) - (mercatorY(bLat) - aY) * (lng - aLng));
    if (cross === 0) continue;
    if (side === 0) side = cross;
    else if (cross !== side) return false;
  }
  return true;
}

export function boundsContainBounds(container: MapBounds, contained: MapBounds): boolean {
  return (
    contained.south >= container.south &&
    contained.west >= container.west &&
    contained.north <= container.north &&
    contained.east <= container.east
  );
}

export function boundsIntersect(a: MapBounds, b: MapBounds): boolean {
  return (
    a.south <= b.north &&
    a.north >= b.south &&
    a.west <= b.east &&
    a.east >= b.west
  );
}

export function boundsIntersection(a: MapBounds, b: MapBounds): MapBounds | null {
  if (!boundsIntersect(a, b)) return null;
  return {
    south: Math.max(a.south, b.south),
    west: Math.max(a.west, b.west),
    north: Math.min(a.north, b.north),
    east: Math.min(a.east, b.east),
  };
}

export function expandBounds(bounds: MapBounds, paddingRatio: number): MapBounds {
  const latPadding = (bounds.north - bounds.south) * paddingRatio;
  const lngPadding = (bounds.east - bounds.west) * paddingRatio;

  return {
    south: Math.max(-90, bounds.south - latPadding),
    west: Math.max(-180, bounds.west - lngPadding),
    north: Math.min(90, bounds.north + latPadding),
    east: Math.min(180, bounds.east + lngPadding),
  };
}

export function shouldRefreshLocation(
  origin: [number, number],
  next: [number, number],
  accuracyM: number,
  minimumDistanceM: number
): boolean {
  const refreshDistance = Math.max(minimumDistanceM, accuracyM);
  return haversineM(origin[0], origin[1], next[0], next[1]) >= refreshDistance;
}
