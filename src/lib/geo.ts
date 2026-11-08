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

/*
 * Longitudes. A box whose west is greater than its east crosses the 180° line,
 * as in GeoJSON: it runs from its west to 180° and on from -180° to its east,
 * as a view of New Zealand and the Chatham Islands does. A box from -180 to 180
 * goes all the way round. Boxes otherwise keep to -180..180.
 */

/** Whether the box runs across the 180° line. */
export function crossesDateLine(bounds: Pick<MapBounds, 'west' | 'east'>): boolean {
  return bounds.west > bounds.east;
}

/** How many degrees of longitude the box spans, 360 at most. */
export function lngSpan(bounds: Pick<MapBounds, 'west' | 'east'>): number {
  return crossesDateLine(bounds) ? bounds.east - bounds.west + 360 : bounds.east - bounds.west;
}

/** The longitude brought into -180..180; one already in it is kept as it is, 180 included. */
export function wrapLng(lng: number): number {
  if (lng >= -180 && lng <= 180) return lng;
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

/**
 * The copy of a longitude nearest the reference, 360° away from it or more:
 * where a point is drawn on a map whose view has gone past 180°, in the copy of
 * the world on screen.
 */
export function lngNear(lng: number, reference: number): number {
  return lng + 360 * Math.round((reference - lng) / 360);
}

/**
 * The box of a map's view from its edges, whose longitudes run from west to east
 * past ±180° when the view does (as Leaflet and MapKit give them): one wider than
 * the world is all of it, one that reaches past 180° crosses the line.
 */
export function viewBounds(south: number, west: number, north: number, east: number): MapBounds {
  const box = { south: Math.max(-90, south), north: Math.min(90, north) };
  if (east - west >= 360) return { ...box, west: -180, east: 180 };
  let wrappedWest = wrapLng(west);
  let wrappedEast = wrapLng(east);
  // An edge on the line itself is on the side of the rest of the box.
  if (wrappedWest === 180 && wrappedEast < 180) wrappedWest = -180;
  if (wrappedEast === -180 && wrappedWest > -180) wrappedEast = 180;
  return { ...box, west: wrappedWest, east: wrappedEast };
}

/** The middle of the box, on the right side of the 180° line. */
export function boundsCenter(bounds: MapBounds): [number, number] {
  const lat = (bounds.south + bounds.north) / 2;
  return crossesDateLine(bounds)
    ? [lat, wrapLng(bounds.west + lngSpan(bounds) / 2)]
    : [lat, (bounds.west + bounds.east) / 2];
}

function lngWithin(lng: number, west: number, east: number): boolean {
  return west <= east ? lng >= west && lng <= east : lng >= west || lng <= east;
}

/** The box's longitudes as one or two ranges that keep to -180..180. */
function lngRanges(bounds: MapBounds): [number, number][] {
  return crossesDateLine(bounds) ? [[bounds.west, 180], [-180, bounds.east]] : [[bounds.west, bounds.east]];
}

export function boundsContainPoint(bounds: MapBounds, lat: number, lng: number): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lngWithin(lng, bounds.west, bounds.east)
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
 * The part of a ring of [lat, lng] points within `metres` of a centre, the circle drawn as a polygon
 * of `sides` corners on it (64 fall at most 0.12% of the radius inside it). Clipped edge by edge
 * (Sutherland–Hodgman): where the ring leaves the circle and comes back, the parts are joined along
 * it, which a point-in-polygon test does not see. Empty when no part of the ring lies within.
 */
export function clipRingToDisc(ring: readonly [number, number][], [lat0, lng0]: readonly [number, number], metres: number,
  sides = 64): [number, number][] {
  // 111,195 m a degree of latitude on the 6,371 km sphere haversineM measures on.
  const dLat = metres / 111_195, dLng = dLat / Math.cos(lat0 * Math.PI / 180);
  // Anticlockwise with longitude as x: a point is within an edge when it lies on its left.
  const corners = Array.from({ length: sides }, (_, i): [number, number] =>
    [lat0 + dLat * Math.sin(2 * Math.PI * i / sides), lng0 + dLng * Math.cos(2 * Math.PI * i / sides)]);
  let clipped = ring.map(([lat, lng]): [number, number] => [lat, lng]);
  for (let i = 0; i < sides && clipped.length; i++) {
    const [aLat, aLng] = corners[i], [bLat, bLng] = corners[(i + 1) % sides];
    const left = ([lat, lng]: [number, number]) => (bLng - aLng) * (lat - aLat) - (bLat - aLat) * (lng - aLng);
    const points = clipped;
    clipped = [];
    for (let j = 0; j < points.length; j++) {
      const from = points[(j + points.length - 1) % points.length], to = points[j];
      const sideFrom = left(from), sideTo = left(to);
      if ((sideFrom >= 0) !== (sideTo >= 0)) {
        const t = sideFrom / (sideFrom - sideTo);
        clipped.push([from[0] + t * (to[0] - from[0]), from[1] + t * (to[1] - from[1])]);
      }
      if (sideTo >= 0) clipped.push(to);
    }
  }
  return clipped.length >= 3 ? clipped : [];
}

/**
 * Which point of `others` stands on each of `points`: within `metres`, one each, the nearest pairs
 * first, by the index of each in its list. Points are sorted into a grid of cells wider than
 * `metres`, so a pair is always in neighbouring cells; it does not wrap at the 180° line.
 */
export function pairWithin(points: readonly { lat: number; lng: number }[], others: readonly { lat: number; lng: number }[],
  metres: number): Map<number, number> {
  const pairs = new Map<number, number>();
  if (!points.length || !others.length) return pairs;
  const farthest = Math.min(89, Math.max(...points.map(point => Math.abs(point.lat))) + 1);
  const cellLat = metres / 111_000;
  const cellLng = cellLat / Math.cos(farthest * Math.PI / 180);
  const grid = new Map<string, number[]>();
  others.forEach((other, index) => {
    const key = `${Math.floor(other.lat / cellLat)}:${Math.floor(other.lng / cellLng)}`;
    const cell = grid.get(key);
    if (cell) cell.push(index); else grid.set(key, [index]);
  });
  const near: { point: number; other: number; metres: number }[] = [];
  points.forEach((point, index) => {
    const row = Math.floor(point.lat / cellLat), column = Math.floor(point.lng / cellLng);
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      for (const other of grid.get(`${row + dr}:${column + dc}`) ?? []) {
        const apart = haversineM(point.lat, point.lng, others[other].lat, others[other].lng);
        if (apart <= metres) near.push({ point: index, other, metres: apart });
      }
    }
  });
  near.sort((a, b) => a.metres - b.metres);
  const taken = new Set<number>();
  for (const pair of near) {
    if (pairs.has(pair.point) || taken.has(pair.other)) continue;
    pairs.set(pair.point, pair.other);
    taken.add(pair.other);
  }
  return pairs;
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
  // The corners are where the screen is, past 180° if it is: the point is taken there too.
  const x = lngNear(lng, corners.reduce((sum, corner) => sum + corner[1], 0) / corners.length);
  // On the Mercator plane the screen is a rectangle, turned: a point on it is
  // on the same side of each of its edges.
  const y = mercatorY(lat);
  let side = 0;
  for (let i = 0; i < corners.length; i++) {
    const [aLat, aLng] = corners[i];
    const [bLat, bLng] = corners[(i + 1) % corners.length];
    const aY = mercatorY(aLat);
    const cross = Math.sign((bLng - aLng) * (y - aY) - (mercatorY(bLat) - aY) * (x - aLng));
    if (cross === 0) continue;
    if (side === 0) side = cross;
    else if (cross !== side) return false;
  }
  return true;
}

export function boundsContainBounds(container: MapBounds, contained: MapBounds): boolean {
  if (contained.south < container.south || contained.north > container.north) return false;
  if (lngSpan(container) >= 360) return true;
  // Within one of the container's ranges: across the line only if the container crosses it too.
  if (crossesDateLine(contained)) {
    return crossesDateLine(container) && contained.west >= container.west && contained.east <= container.east;
  }
  return lngRanges(container).some(([west, east]) => contained.west >= west && contained.east <= east);
}

export function boundsIntersect(a: MapBounds, b: MapBounds): boolean {
  if (a.south > b.north || a.north < b.south) return false;
  // Both cross the line, so both hold it.
  if (crossesDateLine(a) && crossesDateLine(b)) return true;
  return lngRanges(a).some(([aWest, aEast]) => lngRanges(b).some(([bWest, bEast]) => aWest <= bEast && aEast >= bWest));
}

/**
 * A box that holds what the two have in common, within the narrower of them: the
 * common part itself, unless it falls in two pieces on either side of the 180°
 * line, which the box then joins.
 */
export function boundsIntersection(a: MapBounds, b: MapBounds): MapBounds | null {
  if (!boundsIntersect(a, b)) return null;
  const south = Math.max(a.south, b.south);
  const north = Math.min(a.north, b.north);
  const pieces = lngRanges(a)
    .flatMap(([aWest, aEast]) => lngRanges(b).map(([bWest, bEast]) => [Math.max(aWest, bWest), Math.min(aEast, bEast)] as const))
    .filter(([west, east]) => west <= east);
  if (pieces.length === 1) return { south, west: pieces[0][0], north, east: pieces[0][1] };
  // Measured eastwards from the west edge of the narrower box, which holds every piece.
  const frame = lngSpan(a) <= lngSpan(b) ? a : b;
  const offset = (lng: number) => (lng < frame.west ? lng - frame.west + 360 : lng - frame.west);
  const first = pieces.reduce((best, piece) => offset(piece[0]) < offset(best[0]) ? piece : best);
  const last = pieces.reduce((best, piece) => offset(piece[1]) > offset(best[1]) ? piece : best);
  return { south, west: first[0], north, east: last[1] };
}

/** The box made larger by the ratio of its size on each side; one that would go round the world is all of it. */
export function expandBounds(bounds: MapBounds, paddingRatio: number): MapBounds {
  const latPadding = (bounds.north - bounds.south) * paddingRatio;
  const span = lngSpan(bounds);
  const lngPadding = span * paddingRatio;
  const round = span + 2 * lngPadding >= 360;

  return {
    south: Math.max(-90, bounds.south - latPadding),
    west: round ? -180 : wrapLng(bounds.west - lngPadding),
    north: Math.min(90, bounds.north + latPadding),
    east: round ? 180 : wrapLng(bounds.east + lngPadding),
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
