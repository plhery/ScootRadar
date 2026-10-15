import catalog from '../../data/town-outlines.json';
import { boundsContainPoint, boundsIntersect, polygonContainsPoint } from '@/lib/geo';
import { regionalCityId, serviceAreas, type RegionalScooterSystem } from '@/lib/regionalScooterSystems';
import type { MapBounds } from '@/lib/types';

// The boundaries of towns that a rectangle cannot tell from their neighbours, from
// data/town-outlines.json: in Gush Dan, around Tel Aviv, the box around Givatayim
// holds a good part of Ramat Gan and of Tel Aviv. A scooter inside a town's outline
// counts under that town (townOf in scooterSnapshots.ts), and a feed keeps no
// scooter inside the outline of a town of its country that it does not serve, as
// Dott's few in Givat Shmuel, where only Lime's are counted. Read on the server only.

interface TownOutline {
  /** The city's id, "il:Tel Aviv". */
  city: string;
  /** One ring of [lat, lng] points a piece. */
  areas: [number, number][][];
  bounds: MapBounds;
}

function envelope(areas: [number, number][][]): MapBounds {
  const points = areas.flat();
  return {
    south: Math.min(...points.map(([lat]) => lat)),
    west: Math.min(...points.map(([, lng]) => lng)),
    north: Math.max(...points.map(([lat]) => lat)),
    east: Math.max(...points.map(([, lng]) => lng)),
  };
}

const OUTLINES = new Map((catalog.towns as unknown as { city: string; areas: [number, number][][] }[])
  .map(({ city, areas }) => [city, { city, areas, bounds: envelope(areas) }] as const));

function holds(outline: TownOutline, lat: number, lng: number): boolean {
  return boundsContainPoint(outline.bounds, lat, lng) && outline.areas.some(area => polygonContainsPoint(area, lat, lng));
}

/** Whether the town's outline holds the point; false for a town without one. */
export function outlineHolds(cityId: string, lat: number, lng: number): boolean {
  const outline = OUTLINES.get(cityId);
  return outline ? holds(outline, lat, lng) : false;
}

const UNSERVED = new Map<string, TownOutline[]>();

/** The outlines of the towns of its country that the system does not serve, where they meet its areas. */
function unservedOutlines(system: RegionalScooterSystem): TownOutline[] {
  let outlines = UNSERVED.get(system.id);
  if (!outlines) {
    const areas = serviceAreas(system);
    const served = new Set(areas.map(area => regionalCityId(system, area)));
    const country = `${system.country.toLowerCase()}:`;
    outlines = [...OUTLINES.values()].filter(outline => outline.city.startsWith(country) && !served.has(outline.city) &&
      areas.some(area => boundsIntersect(area.bounds, outline.bounds)));
    UNSERVED.set(system.id, outlines);
  }
  return outlines;
}

/**
 * Whether a system's feed keeps a scooter standing there: inside one of its service areas, and
 * not inside the outline of a town of its country it does not serve.
 */
export function systemServesPoint(system: RegionalScooterSystem, lat: number, lng: number): boolean {
  return serviceAreas(system).some(area => boundsContainPoint(area.bounds, lat, lng)) &&
    !unservedOutlines(system).some(outline => holds(outline, lat, lng));
}
