import catalog from '../../data/town-outlines.json';
import { boundsContainPoint, boundsIntersect, polygonContainsPoint } from '@/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, regionalCityId, serviceAreas, type RegionalScooterSystem } from '@/lib/regionalScooterSystems';
import type { MapBounds } from '@/lib/types';

// The boundaries of towns that a rectangle cannot tell from their neighbours, from
// data/town-outlines.json: in Gush Dan, around Tel Aviv, the box around Givatayim
// holds a good part of Ramat Gan and of Tel Aviv; west of Paris, Lime's boxes for
// Marly-le-Roi and Le Port-Marly overlap. A scooter inside a town's outline counts
// under that town (townOf in scooterSnapshots.ts); where outlines nest, as Lille
// Métropole's around Roubaix's, the smaller wins. A feed keeps no scooter inside
// the outline of a town of its country where its operator runs no service, as
// Dott's few in Givat Shmuel, where only Lime's are counted. Read on the server only.

interface TownOutline {
  /** The city's id, "il:Tel Aviv". */
  city: string;
  /** One ring of [lat, lng] points a piece, each with its box. */
  areas: { ring: [number, number][]; bounds: MapBounds }[];
  bounds: MapBounds;
  /** In square degrees of latitude, for telling a town from the larger outline around it. */
  size: number;
}

function envelope(points: [number, number][]): MapBounds {
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const [lat, lng] of points) {
    south = Math.min(south, lat); north = Math.max(north, lat);
    west = Math.min(west, lng); east = Math.max(east, lng);
  }
  return { south, west, north, east };
}

function ringSize(ring: [number, number][]): number {
  const cosLat = Math.cos((ring[0][0] * Math.PI) / 180);
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][1] - ring[i][1]) * (ring[j][0] + ring[i][0]);
  return Math.abs(sum / 2) * cosLat;
}

// Smallest first, so the first outline holding a point is the town it stands in.
const OUTLINES: TownOutline[] = (catalog.towns as unknown as { city: string; areas: [number, number][][] }[])
  .map(({ city, areas }) => ({
    city, bounds: envelope(areas.flat()), size: areas.reduce((sum, ring) => sum + ringSize(ring), 0),
    areas: areas.map(ring => ({ ring, bounds: envelope(ring) })),
  }))
  .sort((a, b) => a.size - b.size);

// By country, "fr" for "fr:Roubaix" and "ch" for "ch:zurich".
const BY_COUNTRY = new Map<string, TownOutline[]>();
for (const outline of OUTLINES) {
  const country = outline.city.slice(0, outline.city.indexOf(':'));
  BY_COUNTRY.set(country, [...BY_COUNTRY.get(country) ?? [], outline]);
}

function holds(outline: TownOutline, lat: number, lng: number): boolean {
  return boundsContainPoint(outline.bounds, lat, lng) &&
    outline.areas.some(area => boundsContainPoint(area.bounds, lat, lng) && polygonContainsPoint(area.ring, lat, lng));
}

/** The smallest of the outlines that holds the point, if any does. */
function smallestHolding(outlines: readonly TownOutline[], lat: number, lng: number): TownOutline | undefined {
  return outlines.find(outline => holds(outline, lat, lng));
}

/**
 * The town among `towns`, all of one country, whose outline holds the point; the smaller
 * where two do, as Roubaix inside Lille Métropole. None where no outline holds it.
 */
export function outlinedTown<T extends { id: string }>(towns: readonly T[], lat: number, lng: number): T | undefined {
  if (!towns.length) return undefined;
  const outlines = BY_COUNTRY.get(towns[0].id.slice(0, towns[0].id.indexOf(':')));
  const outline = outlines && smallestHolding(outlines, lat, lng);
  return outline && towns.find(town => town.id === outline.city);
}

// The towns of each operator, by country: "bird:US" holds every town a Bird feed of the United States serves.
const OPERATOR_TOWNS = new Map<string, Set<string>>();
for (const system of REGIONAL_SCOOTER_SYSTEMS) {
  const key = `${system.provider}:${system.country}`;
  const towns = OPERATOR_TOWNS.get(key) ?? new Set<string>();
  for (const area of serviceAreas(system)) towns.add(regionalCityId(system, area));
  OPERATOR_TOWNS.set(key, towns);
}

const NEARBY = new Map<string, { outline: TownOutline; served: boolean }[]>();

/** The outlines of its country that meet the system's areas, and whether its operator serves each town. */
function nearbyOutlines(system: RegionalScooterSystem): { outline: TownOutline; served: boolean }[] {
  let outlines = NEARBY.get(system.id);
  if (!outlines) {
    const areas = serviceAreas(system);
    const served = OPERATOR_TOWNS.get(`${system.provider}:${system.country}`)!;
    outlines = (BY_COUNTRY.get(system.country.toLowerCase()) ?? [])
      .filter(outline => areas.some(area => boundsIntersect(area.bounds, outline.bounds)))
      .map(outline => ({ outline, served: served.has(outline.city) }));
    NEARBY.set(system.id, outlines);
  }
  return outlines;
}

/**
 * Whether a system's feed keeps a scooter standing there: inside one of its service areas, and
 * not in a town of its country where its operator runs no service, by the town's outline:
 * Dott's Tel Aviv feed drops its few in Givat Shmuel, where Dott runs none.
 */
export function systemServesPoint(system: RegionalScooterSystem, lat: number, lng: number): boolean {
  if (!serviceAreas(system).some(area => boundsContainPoint(area.bounds, lat, lng))) return false;
  const outlines = nearbyOutlines(system);
  if (!outlines.length) return true;
  return outlines.find(({ outline }) => holds(outline, lat, lng))?.served ?? true;
}
