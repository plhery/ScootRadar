import type { FeedQuery } from '@/lib/scooterFeeds';
import { MAX_CLUSTER_ZOOM } from '@/lib/clustering';
import { coverageIntersects, MOBILITY_COVERAGE, SUPPORTED_MOBILITY_BOUNDS } from '@/lib/feedCoverage';
import { boundsIntersection, lngSpan } from '@/lib/geo';
import { PROVIDERS, type MapBounds } from '@/lib/types';

export const MAX_SCOOTER_RESULTS = 25_000;

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

interface ValidQuery {
  ok: true;
  query: FeedQuery;
  zoom: number | null;
}

interface InvalidQuery {
  ok: false;
  error: string;
}

export type ScooterQueryResult = ValidQuery | InvalidQuery;

function numberParam(params: URLSearchParams, name: string, fallback: number): number {
  const value = params.get(name);
  if (value === null) return fallback;
  return value.trim() === '' ? Number.NaN : Number(value);
}

export function parseScooterQuery(params: URLSearchParams): ScooterQueryResult {
  const hasLat = params.has('lat');
  const hasLng = params.has('lng');
  const lat = hasLat ? numberParam(params, 'lat', Number.NaN) : null;
  const lng = hasLng ? numberParam(params, 'lng', Number.NaN) : null;
  const south = numberParam(params, 'south', 47.33);
  const west = numberParam(params, 'west', 8.45);
  const north = numberParam(params, 'north', 47.43);
  const east = numberParam(params, 'east', 8.62);
  const minBattery = numberParam(params, 'minBattery', 0);
  const minRange = numberParam(params, 'minRange', 0);
  const zoom = params.has('zoom') ? numberParam(params, 'zoom', Number.NaN) : null;

  if (
    hasLat !== hasLng ||
    (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
    (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180)) ||
    !Number.isFinite(south) || south < -90 || south > 90 ||
    !Number.isFinite(west) || west < -180 || west > 180 ||
    !Number.isFinite(north) || north < -90 || north > 90 ||
    !Number.isFinite(east) || east < -180 || east > 180 ||
    // A west greater than the east is a box across the 180° line (geo.ts).
    south >= north || lngSpan({ west, east }) <= 0 ||
    !Number.isInteger(minBattery) || minBattery < 0 || minBattery > 100 ||
    // In metres, as far as a range is believed (MAX_SCOOTER_RANGE_M in scooterFeeds.ts).
    !Number.isInteger(minRange) || minRange < 0 || minRange > 200_000 ||
    (zoom !== null && (!Number.isInteger(zoom) || zoom < 0 || zoom > 22))
  ) {
    return { ok: false, error: 'Invalid scooter search parameters' };
  }

  const providerParam = params.get('provider');
  let providers: Set<string> | undefined;
  if (providerParam !== null) {
    const requestedProviders = providerParam
      .split(',')
      .map(provider => provider.trim().toLowerCase())
      .filter(Boolean);
    if (
      requestedProviders.length === 0 ||
      requestedProviders.some(provider => !Object.hasOwn(PROVIDERS, provider))
    ) {
      return { ok: false, error: 'Unknown scooter provider' };
    }
    providers = new Set(requestedProviders);
  }

  const requestedBounds = { south, west, north, east };
  const supportedBounds = boundsIntersection(requestedBounds, SUPPORTED_MOBILITY_BOUNDS);

  return {
    ok: true,
    query: {
      origin: lat !== null && lng !== null ? [lat, lng] : null,
      bounds: supportedBounds ?? requestedBounds,
      minBattery,
      minRange,
      providers,
      outsideCoverage: !coverageIntersects(MOBILITY_COVERAGE, requestedBounds),
    },
    zoom,
  };
}
