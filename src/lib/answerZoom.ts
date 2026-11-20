import { MAX_CLUSTER_ZOOM } from '@/lib/clustering';
import { lngSpan } from '@/lib/geo';
import type { MapBounds } from '@/lib/types';

/**
 * The most pixels a map is taken to show on a side, in Leaflet's 256-pixel tiles: four 4K screens
 * across, or one turned at 45°, whose bounds enclose its diagonal, with the browser zoomed out to 25%.
 */
export const MAX_VIEW_PIXELS = 16_384;

/** Leaflet's y of a latitude at zoom 0, in pixels from the top of the world. */
function mercatorY(lat: number): number {
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI / 180;
  return 128 - 128 * Math.log(Math.tan(Math.PI / 4 + clamped / 2)) / Math.PI;
}

/**
 * The zoom a scooter request is answered at: the one it asks for, unless its box is wider or taller
 * than MAX_VIEW_PIXELS at that zoom, which no screen shows. That box is answered at the highest zoom
 * at which it fits: clusters, or the city totals, rather than every scooter in it. Without a zoom
 * (every scooter, unclustered) a box gets every scooter only where it fits at the first zoom without
 * clusters. One request can then hold the positions of a town, not of a country, and can keep
 * collected only the feeds of the view it could be (server/snapshotServer.ts).
 */
export function scooterAnswerZoom(zoom: number | null, bounds: MapBounds): number | null {
  const widest = Math.max(lngSpan(bounds) * 256 / 360, mercatorY(bounds.south) - mercatorY(bounds.north));
  const fits = widest > 0 ? Math.max(0, Math.floor(Math.log2(MAX_VIEW_PIXELS / widest))) : Infinity;
  if (zoom === null) return fits > MAX_CLUSTER_ZOOM ? null : fits;
  return Math.min(zoom, fits);
}
