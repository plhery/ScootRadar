import { viewBounds } from '@/lib/geo';
import { heldUntil, noteRequest, VIEW_PACE } from '@/lib/requestPace';
import { scooterQueryKey, scooterQueryParams, viewportFetchBounds, type ScooterDataQuery } from '@/lib/scooterDataState';
import type { MapBounds } from '@/lib/types';

// The map's first scooters, asked for when the page hydrates rather than once Leaflet has loaded, made the map
// and reported its view: on a slow phone the map's code takes a second or more to arrive, and the answer can be
// on its way meanwhile. The page knows where the map opens (a link's place, or the time zone's city) and how big
// it is, so the box is the one the map asks for (startViewBounds); useScooterData takes this request for its
// first load when the keys are the same, and cancels it otherwise, so a box that came out different costs one
// request and never shows the scooters of another view.

// Leaflet's EPSG:3857, as L.CRS.EPSG3857 projects and unprojects: its sphere, the latitude it stops at, and the
// transformation onto the 256-pixel tile of zoom 0.
const EARTH_RADIUS = 6378137;
const MAX_LATITUDE = 85.0511287798;
const DEGREE = Math.PI / 180;
const RADIAN = 180 / Math.PI;
const TRANSFORM = 0.5 / (Math.PI * EARTH_RADIUS);
const zoomScale = (zoom: number) => 256 * Math.pow(2, zoom);

function project([lat, lng]: readonly [number, number], zoom: number): [number, number] {
  const sin = Math.sin(Math.max(Math.min(MAX_LATITUDE, lat), -MAX_LATITUDE) * DEGREE);
  const x = EARTH_RADIUS * lng * DEGREE;
  const y = EARTH_RADIUS * Math.log((1 + sin) / (1 - sin)) / 2;
  const scale = zoomScale(zoom);
  return [scale * (TRANSFORM * x + 0.5), scale * (-TRANSFORM * y + 0.5)];
}

function unproject(x: number, y: number, zoom: number): [number, number] {
  const scale = zoomScale(zoom);
  const px = (x / scale - 0.5) / TRANSFORM;
  const py = (y / scale - 0.5) / -TRANSFORM;
  return [(2 * Math.atan(Math.exp(py / EARTH_RADIUS)) - Math.PI / 2) * RADIAN, px * RADIAN / EARTH_RADIUS];
}

/**
 * The view a map just made at that centre and zoom, north up, reports (MapComponent's reportViewport): Leaflet's
 * getBounds, whose pixel origin is the centre's pixel less half the map's size, rounded, and whose corners are
 * that origin and the origin plus the size.
 */
export function startViewBounds(center: readonly [number, number], zoom: number, size: { width: number; height: number }): MapBounds {
  const [x, y] = project(center, zoom);
  const left = Math.round(x - size.width / 2);
  const top = Math.round(y - size.height / 2);
  const [south, west] = unproject(left, top + size.height, zoom);
  const [north, east] = unproject(left + size.width, top, zoom);
  return viewBounds(south, west, north, east);
}

/** The first query the map makes at that start: its view, padded as handleViewportChange pads it. */
export function startQuery(center: readonly [number, number], zoom: number, size: { width: number; height: number }): ScooterDataQuery {
  return { bounds: viewportFetchBounds(startViewBounds(center, zoom, size), zoom), zoom };
}

interface FirstScooters {
  key: string;
  /** The view id it was sent with, X-Scooter-View's, whose next request is the second. */
  viewId: string;
  controller: AbortController;
  response: Promise<Response>;
  /** When its answer came, which a refusal's wait counts from (requestPace.ts): the map may take it later. */
  answeredAt: number | null;
}

let first: FirstScooters | null = null;

/**
 * Sends the first request for the query, once a page; the later calls are ignored. It is counted with the map's
 * requests as it is sent, and not sent while they are held (requestPace.ts), as on a reload within the minute a 429
 * asked for: the map's first load waits for that and asks then. One sent anyway was refused, and the load that took
 * its refusal at the end of the wait waited as long again.
 */
export function askFirstScooters(query: ScooterDataQuery): void {
  if (first || typeof fetch !== 'function') return;
  const now = Date.now();
  if (heldUntil(VIEW_PACE, now) > now) return;
  noteRequest(now);
  const viewId = crypto.randomUUID();
  const controller = new AbortController();
  const sent: FirstScooters = { key: scooterQueryKey(query), viewId, controller, answeredAt: null,
    response: fetch(`/api/scooters?${scooterQueryParams(query)}`, {
      headers: { 'X-Scooter-View': `${viewId}.1` },
      cache: 'no-store',
      signal: controller.signal,
    }).then(response => {
      sent.answeredAt = Date.now();
      return response;
    }) };
  // Failed or cancelled, it is the load that took it that reports it, or none.
  sent.response.catch(() => {});
  first = sent;
}

/**
 * The first request, for the first load: when it was sent for this key; otherwise it is cancelled, so that it
 * does not share the connection with the load's own, and null. Either way only once.
 */
export function takeFirstScooters(key: string): FirstScooters | null {
  const taken = first;
  if (!taken) return null;
  first = null;
  if (taken.key === key) return taken;
  taken.controller.abort();
  return null;
}

/** Forgets a request sent and not taken: for the tests. */
export function resetFirstScooters(): void {
  first?.controller.abort();
  first = null;
}
