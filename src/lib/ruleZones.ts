import polygonClipping, { type Polygon } from 'polygon-clipping';
import catalog from '../../data/rule-zones.json';
import { boundsIntersect } from './geo';
import { localClock } from './rentalCurfews';
import type { MapBounds } from './types';
import { ZONES_MIN_ZOOM } from './zones';

// Streets where a city or its police forbids riding, from data/rule-zones.json: Seoul's
// "kickboard-free streets" so far. Unlike the operators' zones they are the law, so the map
// draws them from zoom 14 whether or not the zones are turned on, dimmer outside their hours,
// and the legend says who forbids it, linked to where they say so.

/** Local "HH:MM", from and until. */
export interface RuleHours {
  from: string;
  until: string;
}

export interface RuleZone {
  id: string;
  place: string;
  /** Who forbids it, as the legend names them: "Seoul", "Gangnam-gu". */
  authority: string;
  rule: 'noRide';
  /** The local day it starts, "YYYY-MM-DD". */
  from: string;
  timeZone: string;
  /** Every day; all day when left out. */
  hours?: RuleHours[];
  source: { title: string; url: string };
  /** The street's centrelines, each of [lat, lng] points. */
  lines: [number, number][][];
}

/** A rule zone as the map draws it. */
export interface RuleZoneShape extends RuleZone {
  /** Polygons, each its outer ring and then its holes, each ring of [lat, lng] points. */
  polygons: [number, number][][][];
  /** Whether its hours hold now. */
  inForce: boolean;
}

export const RULE_ZONES = catalog.zones as unknown as RuleZone[];

/** How wide a street's band is drawn: the street and its pavements, so that it shows from zoom 14. */
const BAND_WIDTH_M = 14;
const M_PER_DEGREE_LAT = 110_540;
const M_PER_DEGREE_LNG_AT_EQUATOR = 111_320;
/** The corners of the circle each bend of a band is rounded with. */
const ROUND_CORNERS = 12;

function minutesOfDay(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

const dates = new Map<string, Intl.DateTimeFormat>();

/** Whether the zone's rule holds at that instant: from its first day, within its hours. */
export function ruleInForce(zone: Pick<RuleZone, 'from' | 'timeZone' | 'hours'>, now: number): boolean {
  let date = dates.get(zone.timeZone);
  if (!date) {
    date = new Intl.DateTimeFormat('en-CA', { timeZone: zone.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    dates.set(zone.timeZone, date);
  }
  if (date.format(now) < zone.from) return false;
  if (!zone.hours) return true;
  const { minutes } = localClock(now, zone.timeZone);
  return zone.hours.some(({ from, until }) => {
    const start = minutesOfDay(from);
    const end = minutesOfDay(until);
    return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  });
}

/**
 * The street's band: each piece of its centrelines widened to `widthM`, its bends and ends
 * rounded, all as one shape.
 */
export function bandPolygons(lines: [number, number][][], widthM = BAND_WIDTH_M): [number, number][][][] {
  const pieces: Polygon[] = [];
  for (const line of lines) {
    const kx = M_PER_DEGREE_LNG_AT_EQUATOR * Math.cos((line[0][0] * Math.PI) / 180);
    const half = widthM / 2;
    for (const [lat, lng] of line) {
      pieces.push([Array.from({ length: ROUND_CORNERS + 1 }, (_, index): [number, number] => {
        const angle = ((index % ROUND_CORNERS) / ROUND_CORNERS) * 2 * Math.PI;
        return [lat + (half * Math.sin(angle)) / M_PER_DEGREE_LAT, lng + (half * Math.cos(angle)) / kx];
      })]);
    }
    for (let index = 1; index < line.length; index++) {
      const [lat0, lng0] = line[index - 1];
      const [lat1, lng1] = line[index];
      const dx = (lng1 - lng0) * kx;
      const dy = (lat1 - lat0) * M_PER_DEGREE_LAT;
      const length = Math.hypot(dx, dy);
      if (!length) continue;
      // Half the width across the piece, in degrees.
      const across: [number, number] = [(dx / length) * half / M_PER_DEGREE_LAT, (-dy / length) * half / kx];
      pieces.push([[
        [lat0 + across[0], lng0 + across[1]], [lat1 + across[0], lng1 + across[1]],
        [lat1 - across[0], lng1 - across[1]], [lat0 - across[0], lng0 - across[1]], [lat0 + across[0], lng0 + across[1]],
      ]]);
    }
  }
  // The union reads [lat, lng] as [x, y], and gives the points back in that order.
  const [first, ...rest] = pieces;
  return first ? polygonClipping.union(first, ...rest) : [];
}

function linesBounds(lines: [number, number][][]): MapBounds {
  const points = lines.flat();
  return {
    south: Math.min(...points.map(([lat]) => lat)),
    north: Math.max(...points.map(([lat]) => lat)),
    west: Math.min(...points.map(([, lng]) => lng)),
    east: Math.max(...points.map(([, lng]) => lng)),
  };
}

const shapes = new Map<string, { bounds: MapBounds; polygons: [number, number][][][] }>();

function shapeOf(zone: RuleZone) {
  let shape = shapes.get(zone.id);
  if (!shape) {
    shape = { bounds: linesBounds(zone.lines), polygons: bandPolygons(zone.lines) };
    shapes.set(zone.id, shape);
  }
  return shape;
}

const NONE: RuleZoneShape[] = [];

/** The rule zones over the view, from zoom 14 in, each with whether it holds at that instant. */
export function ruleZonesInView(view: { bounds: MapBounds; zoom: number } | null, now: number,
  zones: RuleZone[] = RULE_ZONES): RuleZoneShape[] {
  if (!view || view.zoom < ZONES_MIN_ZOOM) return NONE;
  const shown = zones.flatMap(zone => {
    const { bounds, polygons } = shapeOf(zone);
    return boundsIntersect(view.bounds, bounds) ? [{ ...zone, polygons, inForce: ruleInForce(zone, now) }] : [];
  });
  // The same empty list every time, so that a map without them does not draw again.
  return shown.length ? shown : NONE;
}
