import { createHash, randomBytes } from 'node:crypto';
import { boundsCenter } from '../src/lib/geo';
import { CITY_OVERVIEW_MAX_ZOOM } from '../src/lib/mapCoverage';
import type { MapBounds } from '../src/lib/types';

/** The visitors are counted by UTC quarter hours, as the Lime refreshes they set off (metrics.ts). */
export const VISITOR_WINDOW_MS = 15 * 60_000;
/** An area is a cell of this many degrees of latitude and longitude, about 55 by 35 km in Zürich: a town and around it. */
export const AREA_DEGREES = 0.5;
/**
 * How many areas a visitor's requests keep collected in a quarter hour. Their requests for the areas past
 * these are answered from what the cache holds, collecting nothing, until the quarter hour ends. A map is
 * looked at in a town or two; a sweep of a country or of the world, which would keep every operator's feed
 * there collected each minute and the operators' accounts busy, comes to this within minutes.
 */
export const AREAS_WATCHED_PER_WINDOW = 32;
const AREAS_KEPT = 64;
const MAX_VISITORS = 10_000;

// The visitors of a quarter hour by their requests for scooters: a map left open asks every minute (15),
// one whose feeds are being collected again every three seconds (300).
export const REQUEST_BUCKETS: [string, number][] = [['1-15', 15], ['16-60', 60], ['61-300', 300], ['301+', Infinity]];
// And by the areas they asked for, at a zoom past the city totals: up to 1, 3, 7… and 64 or more.
export const AREA_BUCKETS: [string, number][] = [['1', 1], ['2-3', 3], ['4-7', 7], ['8-15', 15], ['16-31', 31],
  ['32-63', 63], ['64+', Infinity]];

export interface VisitorCounts {
  /** Visitors of the closed quarter hours by their requests, counted since the start. */
  byRequests: [string, number][];
  /** Visitors of the closed quarter hours by the areas they asked for. */
  byAreas: [string, number][];
  /** Requests answered without collecting their view's feeds again: their visitor had spent their areas. */
  unwatched: number;
  /** Of the last closed quarter hour, the most requests and the most areas one visitor made (areas at most 64). */
  lastWindow: { requests: number; areas: number };
}

/** The area of a box: the cell its middle is in. */
export function areaOf(bounds: MapBounds): string {
  const [lat, lng] = boundsCenter(bounds);
  return `${Math.floor(lat / AREA_DEGREES)},${Math.floor(lng / AREA_DEGREES)}`;
}

/**
 * The requests and areas of each visitor in the current quarter hour, by a hash of their address salted
 * afresh by each process. No address is kept, and the hashes go when the quarter hour closes, into the
 * buckets' counts. A scraper reads as one visitor asking for many areas; a map, for one or a few.
 */
export function createVisitorLedger() {
  const salt = randomBytes(16);
  let window = 0;
  const visitors = new Map<string, { requests: number; watched: Set<string>; areas: Set<string> }>();
  const byRequests = new Map(REQUEST_BUCKETS.map(([bucket]) => [bucket, 0]));
  const byAreas = new Map(AREA_BUCKETS.map(([bucket]) => [bucket, 0]));
  let unwatched = 0;
  let lastWindow = { requests: 0, areas: 0 };
  const count = (counts: Map<string, number>, buckets: [string, number][], value: number) => {
    const [bucket] = buckets.find(([, most]) => value <= most)!;
    counts.set(bucket, counts.get(bucket)! + 1);
  };
  const close = (now: number) => {
    const current = Math.floor(now / VISITOR_WINDOW_MS);
    if (current === window) return;
    const most = { requests: 0, areas: 0 };
    for (const { requests, areas } of visitors.values()) {
      count(byRequests, REQUEST_BUCKETS, requests);
      if (areas.size) count(byAreas, AREA_BUCKETS, areas.size);
      most.requests = Math.max(most.requests, requests);
      most.areas = Math.max(most.areas, areas.size);
    }
    // The last closed quarter hour is the one before this: the visitors' own, or a later one without any.
    lastWindow = current === window + 1 ? most : { requests: 0, areas: 0 };
    visitors.clear();
    window = current;
  };

  return {
    /**
     * Counts a request for scooters by `client` (its address) for `bounds` at the zoom it is answered at.
     * Whether it may keep its view's feeds collected: false once its visitor has asked for
     * AREAS_WATCHED_PER_WINDOW other areas this quarter hour. The city totals collect nothing and count
     * no area. Past MAX_VISITORS in a quarter hour, a new visitor is neither counted nor held back.
     */
    record(client: string, bounds: MapBounds, zoom: number | null, now = Date.now()): boolean {
      close(now);
      const id = createHash('sha256').update(salt).update(client).digest('base64url');
      let visitor = visitors.get(id);
      if (!visitor) {
        if (visitors.size >= MAX_VISITORS) return true;
        visitor = { requests: 0, watched: new Set(), areas: new Set() };
        visitors.set(id, visitor);
      }
      visitor.requests++;
      if (zoom !== null && zoom <= CITY_OVERVIEW_MAX_ZOOM) return true;
      const area = areaOf(bounds);
      if (visitor.areas.size < AREAS_KEPT) visitor.areas.add(area);
      if (visitor.watched.has(area)) return true;
      if (visitor.watched.size < AREAS_WATCHED_PER_WINDOW) { visitor.watched.add(area); return true; }
      unwatched++;
      return false;
    },
    counts(now = Date.now()): VisitorCounts {
      close(now);
      return { byRequests: [...byRequests], byAreas: [...byAreas], unwatched, lastWindow };
    },
  };
}

export type VisitorLedger = ReturnType<typeof createVisitorLedger>;
