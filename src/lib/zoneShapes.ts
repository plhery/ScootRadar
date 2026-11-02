import polygonClipping, { type Polygon } from 'polygon-clipping';
import type { RuleKind, RuleZoneShape } from './ruleZones';
import type { MapZone } from './zones';

/** What a zone over the map asks, drawn as an area: all but the pavement, drawn as its lines. */
export type AreaKind = Exclude<RuleKind, 'pavement'>;

/**
 * The kinds in the order they are drawn: an area where scooters park only in racks or marked
 * places at the bottom, as the places within it are over it, then parking, the strongest rule on top.
 */
export const AREA_KINDS_BELOW_FIRST: AreaKind[] = ['racksOnly', 'parking', 'slow', 'noParking', 'noRide'];

/** The zones of one kind over the map that hold now, or that don't, with hours or without, whoever sets them. */
export interface ZoneShape {
  kind: AreaKind;
  /** Whether it holds now: a city's rule outside its hours is drawn dimmer. */
  inForce: boolean;
  /** A city's rule with hours, Seoul's streets, whose no riding is hatched the other way. */
  timed: boolean;
  /** Polygons, each its outer ring and then its holes turned the other way, each ring of [lat, lng] points. */
  polygons: [number, number][][][];
}

type Ring = [number, number][];
type Piece = Ring[];
interface Box { south: number; west: number; north: number; east: number }

/**
 * The zones of each kind as one shape: where several operators, or an operator and the city,
 * forbid the same over a street, it is drawn once, within one edge, rather than within an edge of
 * each. Only the zones handed in are merged, so the zones of the providers shown make the shape,
 * and a filter on one provider leaves its own. A city's rules outside their hours, drawn dimmer,
 * are merged apart from those that hold, and so are its rules with hours, hatched the other way,
 * as on the iPhone (ScooterZoneOverlay.swift). A merge that floating-point round-off defeats
 * leaves those zones as they came.
 */
export function mergeZones(zones: MapZone[], rules: RuleZoneShape[] = []): ZoneShape[] {
  const groups = new Map<string, ZoneShape>();
  const add = (kind: AreaKind, inForce: boolean, timed: boolean, polygons: Piece[]) => {
    const key = `${kind} ${inForce} ${timed}`;
    const group = groups.get(key) ?? { kind, inForce, timed, polygons: [] };
    groups.set(key, group);
    group.polygons.push(...polygons);
  };
  for (const zone of zones) add(zone.kind, true, false, zone.polygons);
  for (const rule of rules) if (rule.rule !== 'pavement') add(rule.rule, rule.inForce, !!rule.hours?.length, rule.polygons);
  return AREA_KINDS_BELOW_FIRST.flatMap(kind => [false, true].flatMap(inForce => [false, true].flatMap(timed => {
    const group = groups.get(`${kind} ${inForce} ${timed}`);
    return group?.polygons.length ? [{ ...group, polygons: union(group.polygons) }] : [];
  })));
}

/**
 * The polygons as one shape. Only those whose bounds meet are joined: most zones are apart from
 * the others, and the union of Münster's few hundred in one view takes a third of a second.
 * Each set joined is kept, so that a view moved a little joins only the zones it brings in.
 */
function union(polygons: Piece[]): Piece[] {
  return clusters(polygons).flatMap(cluster => {
    if (cluster.length === 1) return [oriented(cluster[0])];
    const key = cluster.map(idOf).sort((a, b) => a - b).join();
    let merged = joined.get(key);
    if (merged) joined.delete(key);
    else {
      try {
        // The union reads [lat, lng] as [x, y], and gives the points back in that order.
        const [first, ...rest] = cluster as Polygon[];
        merged = polygonClipping.union(first, ...rest).map(oriented);
      } catch {
        merged = cluster.map(oriented);
      }
    }
    // The most recent last, and the oldest let go.
    joined.set(key, merged);
    if (joined.size > JOINED_KEPT) joined.delete(joined.keys().next().value!);
    return merged;
  });
}

const JOINED_KEPT = 500;
const joined = new Map<string, Piece[]>();
const ids = new WeakMap<Piece, number>();
let nextId = 0;
function idOf(polygon: Piece): number {
  let id = ids.get(polygon);
  if (id === undefined) ids.set(polygon, id = nextId++);
  return id;
}

/** The polygons in sets whose bounds meet, edge to edge included, one polygon to a set where it meets none. */
function clusters(polygons: Piece[]): Piece[][] {
  const boxes = polygons.map(boxOf);
  const parent = polygons.map((_, index) => index);
  const root = (index: number) => {
    while (parent[index] !== index) index = parent[index] = parent[parent[index]];
    return index;
  };
  // From south to north, each against those not yet left behind.
  const open: number[] = [];
  for (const index of polygons.map((_, index) => index).sort((a, b) => boxes[a].south - boxes[b].south)) {
    const box = boxes[index];
    for (let at = open.length - 1; at >= 0; at--) {
      const other = boxes[open[at]];
      if (other.north < box.south) open.splice(at, 1);
      else if (other.west <= box.east && box.west <= other.east) parent[root(index)] = root(open[at]);
    }
    open.push(index);
  }
  const sets = new Map<number, Piece[]>();
  polygons.forEach((polygon, index) => {
    const set = sets.get(root(index));
    if (set) set.push(polygon);
    else sets.set(root(index), [polygon]);
  });
  return [...sets.values()];
}

function boxOf([outer]: Piece): Box {
  const box = { south: Infinity, west: Infinity, north: -Infinity, east: -Infinity };
  for (const [lat, lng] of outer ?? []) {
    box.south = Math.min(box.south, lat); box.north = Math.max(box.north, lat);
    box.west = Math.min(box.west, lng); box.east = Math.max(box.east, lng);
  }
  return box;
}

/**
 * The polygon with its outer ring turned one way and its holes the other, read as [x, y], as the
 * union turns them: the map fills by winding, so that zones it could not join still cover where
 * they overlap, and an operator's zone the union never saw keeps its holes open.
 */
function oriented([outer, ...holes]: Piece): Piece {
  return [turned(outer, true), ...holes.map(hole => turned(hole, false))];
}

function turned(ring: Ring, positive: boolean): Ring {
  let twiceArea = 0;
  for (let index = 0; index < ring.length; index++) {
    const [x0, y0] = ring[index];
    const [x1, y1] = ring[(index + 1) % ring.length];
    twiceArea += x0 * y1 - x1 * y0;
  }
  return twiceArea < 0 === positive ? [...ring].reverse() : ring;
}
