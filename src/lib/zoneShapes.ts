import polygonClipping, { type Polygon } from 'polygon-clipping';
import type { MapZone, ZoneKind } from './zones';

/** The zones of one kind over the map, whichever operators publish them. */
export interface ZoneShape {
  kind: ZoneKind;
  /** Polygons, each its outer ring and then its holes, each ring of [lat, lng] points. */
  polygons: [number, number][][][];
}

const KINDS: ZoneKind[] = ['noRide', 'noParking', 'slow'];

/**
 * The zones of each kind as one shape: where several operators forbid the same over a
 * street, it is drawn once, within one edge, rather than within an edge of each. Only the
 * zones handed in are merged, so the zones of the providers shown make the shape, and a
 * filter on one provider leaves its own. A merge that floating-point round-off defeats
 * leaves that kind's zones as they came.
 */
export function mergeZones(zones: MapZone[]): ZoneShape[] {
  return KINDS.flatMap(kind => {
    const polygons = zones.filter(zone => zone.kind === kind).flatMap(zone => zone.polygons);
    if (!polygons.length) return [];
    try {
      // The union reads [lat, lng] as [x, y], and gives the points back in that order.
      const [first, ...rest] = polygons as Polygon[];
      return [{ kind, polygons: polygonClipping.union(first, ...rest) }];
    } catch {
      return [{ kind, polygons }];
    }
  });
}
