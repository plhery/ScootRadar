import L from 'leaflet';
import { prefersReducedMotion } from '@/lib/feedback';
import { pathUpTo, walkPath, type WalkPath } from '@/lib/walkRoute';

/**
 * The way to walk on the map: dots in the blue of your location, each in a
 * ring, over the ground and under the markers. A new way is first framed,
 * then drawn from its start; as you walk, the part behind you goes; at the
 * end the dots fade.
 */

type Point = [number, number];

/** What of the map can be seen, in pixels of its container. */
export interface Frame {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// Closer than this, a short way would fill the screen with a few dots.
export const ROUTE_FIT_MAX_ZOOM = 18;
const DRAW_MS = 700;
const FLY_S = 0.6;
// The flight that frames a way ends with a moveend; the line is drawn then, or after this at the latest.
const FLIGHT_WAIT_MS = 1_200;
const LEAVE_MS = 260;
// Too little of the map is left to frame a way in.
const MIN_FRAME_PX = 80;

/**
 * Where the map should go to show the whole way inside the frame: a zoom, and
 * the point of the screen, as it is now, to centre. Null when the way already
 * fills the frame well and moving would only be a jolt.
 */
export function routeFit({ points, frame, size, zoom, minZoom, maxZoom }: {
  /** The way in pixels of the container at the current zoom. */
  points: { x: number; y: number }[];
  frame: Frame;
  size: { x: number; y: number };
  zoom: number;
  minZoom: number;
  maxZoom: number;
}): { zoom: number; center: { x: number; y: number } } | null {
  const width = frame.right - frame.left;
  const height = frame.bottom - frame.top;
  if (points.length === 0 || width < MIN_FRAME_PX || height < MIN_FRAME_PX) return null;
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const box = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  const scale = Math.min(width / Math.max(box.right - box.left, 1), height / Math.max(box.bottom - box.top, 1));
  const fitted = Math.max(minZoom, Math.min(maxZoom, ROUTE_FIT_MAX_ZOOM, Math.floor(zoom + Math.log2(scale))));
  const inside = box.left >= frame.left && box.right <= frame.right && box.top >= frame.top && box.bottom <= frame.bottom;
  if (inside && fitted - zoom < 1) return null;
  // Zooming scales the screen about its centre: the middle of the way is put in
  // the middle of the frame once the zoom has changed.
  const k = 2 ** (fitted - zoom);
  const middle = { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
  const target = { x: (frame.left + frame.right) / 2, y: (frame.top + frame.bottom) / 2 };
  return {
    zoom: fitted,
    center: { x: middle.x - (target.x - size.x / 2) / k, y: middle.y - (target.y - size.y / 2) / k },
  };
}

const pathOf = (line: Point[]): WalkPath => walkPath(line, line[0], line[line.length - 1]);
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export interface RouteLayer {
  /** Draws a way; a new id frames it and draws it from its start, the same id only follows your steps. */
  show(line: Point[], id: number): void;
  /** Fades the way out. */
  hide(): void;
  remove(): void;
}

/** `frame` says what of the map can be seen when a new way is framed; null leaves the map where it is. */
export function createRouteLayer(map: L.Map, frame: () => Frame | null): RouteLayer {
  // Its own renderer: the map draws on a canvas, and this is styled from the stylesheet.
  const renderer = L.svg({ padding: 0.5 });
  const style = (className: string, color: string, weight: number): L.PolylineOptions => ({
    renderer,
    className: `walk-route ${className}`,
    color,
    weight,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round',
    dashArray: '0 14',
    interactive: false,
    // Leaflet would drop points closer than this many pixels: the dots would jump as the zoom changes.
    smoothFactor: 0,
  });
  let lines: { casing: L.Polyline; dots: L.Polyline } | null = null;
  let shownId: number | null = null;
  let latest: { line: Point[]; path: WalkPath } | null = null;
  let drawing: { start: number; frame: number } | null = null;
  let waiting: { timer: number; onMoveEnd: () => void } | null = null;
  let leaveTimer = 0;

  const draw = (line: Point[]) => {
    lines?.casing.setLatLngs(line);
    lines?.dots.setLatLngs(line);
  };

  const stopWaiting = () => {
    if (!waiting) return;
    window.clearTimeout(waiting.timer);
    map.off('moveend', waiting.onMoveEnd);
    waiting = null;
  };

  // A zoom in the middle of the drawing would show the line in the wrong place until it ends.
  const finishDrawing = () => {
    if (!drawing) return;
    cancelAnimationFrame(drawing.frame);
    drawing = null;
    map.off('zoomstart', finishDrawing);
    if (latest) draw(latest.line);
  };

  const startDrawing = () => {
    stopWaiting();
    if (!latest) return;
    if (prefersReducedMotion()) {
      draw(latest.line);
      return;
    }
    const step = (now: number) => {
      if (!drawing || !latest) return;
      const t = Math.min(1, (now - drawing.start) / DRAW_MS);
      // Your steps change the way while it is drawn: the share drawn is of the way as it is now.
      draw(pathUpTo(latest.path, latest.path.lengthM * easeOut(t)));
      if (t < 1) drawing.frame = requestAnimationFrame(step);
      else finishDrawing();
    };
    draw([]);
    drawing = { start: performance.now(), frame: requestAnimationFrame(step) };
    map.on('zoomstart', finishDrawing);
  };

  const ensureLines = () => {
    window.clearTimeout(leaveTimer);
    if (lines) {
      for (const line of [lines.casing, lines.dots]) line.getElement()?.classList.remove('walk-route-leaving');
      return;
    }
    lines = {
      casing: L.polyline([], style('walk-route-casing', '#fff', 11)).addTo(map),
      dots: L.polyline([], style('walk-route-dots', '#0a84ff', 7)).addTo(map),
    };
  };

  const removeLines = () => {
    window.clearTimeout(leaveTimer);
    lines?.casing.remove();
    lines?.dots.remove();
    lines = null;
  };

  /** Moves the map to show the whole way; true when it flies. */
  const fit = (line: Point[]): boolean => {
    const area = frame();
    if (!area) return false;
    map.stop();
    const fitted = routeFit({
      points: line.map(point => map.latLngToContainerPoint(point)),
      frame: area,
      size: map.getSize(),
      zoom: map.getZoom(),
      minZoom: map.getMinZoom(),
      maxZoom: map.getMaxZoom(),
    });
    if (!fitted) return false;
    const animate = !prefersReducedMotion();
    map.flyTo(map.containerPointToLatLng(L.point(fitted.center.x, fitted.center.y)), fitted.zoom, {
      animate,
      duration: FLY_S,
      easeLinearity: 0.25,
    });
    return animate;
  };

  const hide = () => {
    shownId = null;
    latest = null;
    finishDrawing();
    stopWaiting();
    if (!lines) return;
    if (prefersReducedMotion()) {
      removeLines();
      return;
    }
    for (const line of [lines.casing, lines.dots]) line.getElement()?.classList.add('walk-route-leaving');
    window.clearTimeout(leaveTimer);
    leaveTimer = window.setTimeout(removeLines, LEAVE_MS);
  };

  const show = (line: Point[], id: number) => {
    if (line.length < 2) {
      hide();
      return;
    }
    latest = { line, path: pathOf(line) };
    ensureLines();
    if (id === shownId) {
      if (!drawing && !waiting) draw(line);
      return;
    }
    shownId = id;
    finishDrawing();
    stopWaiting();
    draw([]);
    // The map moves first, then the way is drawn on it: a line drawn in flight
    // would be out of place until the flight ends.
    if (fit(line)) {
      waiting = { timer: window.setTimeout(startDrawing, FLIGHT_WAIT_MS), onMoveEnd: startDrawing };
      map.on('moveend', startDrawing);
    } else {
      startDrawing();
    }
  };

  return {
    show,
    hide,
    remove() {
      hide();
      removeLines();
      renderer.remove();
    },
  };
}
