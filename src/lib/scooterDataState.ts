import { DEFAULT_REFRESH_AFTER_MS, FOLLOW_UP_GAP_MS, MIN_ATTEMPT_GAP_MS, MIN_FOLLOW_UP_MS } from '@/lib/autoRefresh';
import { deviceTime, failedRequestOutcome, isExpired, responseExpiry } from '@/lib/dataExpiry';
import { expandBounds } from '@/lib/geo';
import type { LoadFailure } from '@/lib/loadFailure';
import { scooterAnswerZoom } from '@/lib/scooterQuery';
import type {
  MapBounds,
  ParkingLocation,
  ScooterCluster,
  ScooterResponse,
  ScooterResponseMeta,
  Vehicle,
} from '@/lib/types';

/** Of an app with scooters drawn faded: when its were seen, on this device's clock, and whether new positions are on their way. */
export interface LastSeenStatus {
  seenAt: number;
  updating: boolean;
}

/**
 * Each app's among the faded scooters (response.lastSeen.providers). A server that does not say gives
 * the oldest time of them all, and says them all updating while it is refreshing.
 */
export function lastSeenStatuses(response: ScooterResponse, clockOffsetMs = 0): Record<string, LastSeenStatus> {
  const lastSeen = response.lastSeen;
  if (!lastSeen) return {};
  const statuses: Record<string, LastSeenStatus> = {};
  if (lastSeen.providers) {
    for (const [provider, { seenAt, updating }] of Object.entries(lastSeen.providers)) {
      const at = deviceTime(seenAt, clockOffsetMs);
      if (Number.isFinite(at)) statuses[provider] = { seenAt: at, updating };
    }
    return statuses;
  }
  const at = response.meta.lastSeenAt ? deviceTime(response.meta.lastSeenAt, clockOffsetMs) : NaN;
  if (!Number.isFinite(at)) return {};
  const providers = new Set([...lastSeen.vehicles.map(vehicle => vehicle.provider), ...lastSeen.clusters.flatMap(cluster => Object.keys(cluster.providers))]);
  for (const provider of providers) statuses[provider] = { seenAt: at, updating: response.meta.refreshing === true };
  return statuses;
}

/** The same, none on its way: a paused map asks for nothing. */
export function notUpdating(statuses: Record<string, LastSeenStatus>): Record<string, LastSeenStatus> {
  return Object.fromEntries(Object.entries(statuses).map(([provider, status]) => [provider, { ...status, updating: false }]));
}

export interface ScooterDataQuery {
  bounds: MapBounds;
  zoom: number;
  /**
   * The range minimum the server filters by, in metres; 0 or absent when the client filters the response
   * itself. The battery minimum the server still takes is the older apps' alone.
   */
  minRange?: number;
}

export function scooterQueryParams({ bounds, zoom, minRange = 0 }: ScooterDataQuery): URLSearchParams {
  const params = new URLSearchParams({
    south: bounds.south.toFixed(5),
    west: bounds.west.toFixed(5),
    north: bounds.north.toFixed(5),
    east: bounds.east.toFixed(5),
    zoom: String(zoom),
  });
  // Only when set, as the apps send it: a query without one is the same as before it existed.
  if (minRange > 0) params.set('minRange', String(minRange));
  return params;
}

/** How much the map asks for beyond its view, on each side, in parts of the view: a little panning needs no request. */
export const VIEWPORT_FETCH_PADDING = 0.25;

/**
 * The box the map asks scooters for at `zoom`: its view with VIEWPORT_FETCH_PADDING on each side, or less around a
 * view so large that the box would be wider or taller than the cache answers at that zoom (MAX_VIEW_PIXELS, such as a
 * 4K screen with the browser at 25%), which would answer it at a lower zoom: clusters for a street. The most that
 * fits, as the request writes the box; none around a view wider or taller than that itself. Clusters are asked for
 * the same way.
 */
export function viewportFetchBounds(view: MapBounds, zoom: number): MapBounds {
  const answered = (padding: number) => {
    const sent = scooterQueryParams({ bounds: expandBounds(view, padding), zoom });
    const [south, west, north, east] = ['south', 'west', 'north', 'east'].map(side => Number(sent.get(side)));
    return scooterAnswerZoom(zoom, { south, west, north, east }) === zoom;
  };
  if (answered(VIEWPORT_FETCH_PADDING)) return expandBounds(view, VIEWPORT_FETCH_PADDING);
  // Halved twelve times, to within a twentieth of a percent of the view.
  let fits = 0;
  let over = VIEWPORT_FETCH_PADDING;
  for (let halving = 0; halving < 12; halving += 1) {
    const padding = (fits + over) / 2;
    if (answered(padding)) fits = padding;
    else over = padding;
  }
  return expandBounds(view, fits);
}

/** Two queries with the same key receive the same response. */
export function scooterQueryKey(query: ScooterDataQuery): string {
  return scooterQueryParams(query).toString();
}

export interface ScooterDataState {
  vehicles: Vehicle[];
  clusters: ScooterCluster[];
  /** Where scooters still being collected again were last seen (response.lastSeen), drawn faded. */
  lastSeenVehicles: Vehicle[];
  lastSeenClusters: ScooterCluster[];
  /** Of each app among them, from lastSeenStatuses(). */
  lastSeenProviders: Record<string, LastSeenStatus>;
  /**
   * How far a full battery takes, in metres, the scooters of each app in view that say their battery and not
   * their range (response.batteryRanges), which the range minimum judges them by (range.ts).
   */
  batteryRanges: Record<string, number>;
  parking: ParkingLocation[];
  /** Of the last successful response. Kept when the scooters go out of date. */
  meta: ScooterResponseMeta | null;
  /** When the last successful response was observed (meta.generatedAt), in epoch milliseconds on this device's clock. */
  lastUpdated: number | null;
  /** How far this device's clock was ahead of the server's when that response came, from clockOffset(). */
  clockOffsetMs: number;
  /** A response is on screen, even one without scooters. */
  hasData: boolean;
  /** The query that response answered. */
  dataKey: string | null;
  expiresAt: number | null;
  parkingExpiresAt: number | null;
  lastSuccessAt: number | null;
  /** When the previous request finished, whatever its outcome. */
  lastAttemptAt: number | null;
  refreshAfterMs: number;
  /** The gap before the next request: short while the server says it is refreshing the data. */
  attemptGapMs: number;
  /** The query whose refreshing response already had its quick follow-up; null when the last response was not refreshing. */
  followedUpKey: string | null;
  /** The query of the request that was started last. */
  requestKey: string | null;
  requestInFlight: boolean;
  /** Set by a failed request, cleared only by a successful one. */
  failure: LoadFailure | null;
  /** The scooters expired and the request made after that failed, so they were removed. */
  outOfDate: boolean;
  /** Nobody has touched the page for a while, so it no longer refreshes on its own (IDLE_PAUSE_MS). */
  paused: boolean;
}

export const INITIAL_SCOOTER_DATA_STATE: ScooterDataState = {
  vehicles: [],
  clusters: [],
  lastSeenVehicles: [],
  lastSeenClusters: [],
  lastSeenProviders: {},
  batteryRanges: {},
  parking: [],
  meta: null,
  lastUpdated: null,
  clockOffsetMs: 0,
  hasData: false,
  dataKey: null,
  expiresAt: null,
  parkingExpiresAt: null,
  lastSuccessAt: null,
  lastAttemptAt: null,
  refreshAfterMs: DEFAULT_REFRESH_AFTER_MS,
  attemptGapMs: MIN_ATTEMPT_GAP_MS,
  followedUpKey: null,
  requestKey: null,
  requestInFlight: false,
  failure: null,
  outOfDate: false,
  paused: false,
};

export type ScooterDataEvent =
  | { type: 'started'; key: string }
  /** clockOffsetMs: how far this device's clock is ahead of the server's, from clockOffset(). */
  | { type: 'succeeded'; key: string; response: ScooterResponse; now: number; clockOffsetMs?: number }
  | { type: 'failed'; failure: LoadFailure; now: number }
  /** The running request was cancelled without a replacement. */
  | { type: 'aborted' }
  | { type: 'parkingChecked'; now: number }
  /** Automatic refreshes stop until a touch (paused: true), or start again (false). */
  | { type: 'paused'; paused: boolean };

export function scooterDataReducer(state: ScooterDataState, event: ScooterDataEvent): ScooterDataState {
  switch (event.type) {
    case 'started':
      return { ...state, requestKey: event.key, requestInFlight: true };

    case 'succeeded': {
      // Accepted whatever its timestamps say: a response that is close to its
      // expiry, or already past it, is still the newest data there is.
      const { response, now, clockOffsetMs = 0 } = event;
      const expiry = responseExpiry(response.meta, now, clockOffsetMs);
      const generated = deviceTime(response.meta.generatedAt, clockOffsetMs);
      const refreshAfter = response.meta.refreshAfterSeconds;
      // The server is collecting feeds of this answer again: ask again when it says (meta.followUpMs), at
      // once while a quick feed is on its way. A server that does not say is asked once more soon, but
      // only once in a row, unless scooters stand where they were last seen, which its sweeps replace.
      const refreshing = response.meta.refreshing === true;
      const lastSeenVehicles = response.lastSeen?.vehicles ?? [];
      const lastSeenClusters = response.lastSeen?.clusters ?? [];
      const filling = lastSeenVehicles.length > 0 || lastSeenClusters.length > 0;
      const asked = response.meta.followUpMs;
      const followUpMs = refreshing && typeof asked === 'number' && asked >= 0 ? Math.max(MIN_FOLLOW_UP_MS, asked) : null;
      const followUp = refreshing && (filling || state.followedUpKey !== event.key);
      return {
        vehicles: response.vehicles,
        clusters: response.clusters ?? [],
        lastSeenVehicles,
        lastSeenClusters,
        lastSeenProviders: lastSeenStatuses(response, clockOffsetMs),
        batteryRanges: response.batteryRanges ?? {},
        parking: isExpired(expiry.parking, now) ? [] : response.parking ?? [],
        meta: response.meta,
        lastUpdated: Number.isFinite(generated) ? Math.min(generated, now) : now,
        clockOffsetMs,
        hasData: true,
        dataKey: event.key,
        expiresAt: expiry.vehicles,
        parkingExpiresAt: expiry.parking,
        lastSuccessAt: now,
        lastAttemptAt: now,
        refreshAfterMs: followUpMs ?? (typeof refreshAfter === 'number' && refreshAfter > 0
          ? refreshAfter * 1000
          : DEFAULT_REFRESH_AFTER_MS),
        attemptGapMs: followUpMs ?? (followUp ? FOLLOW_UP_GAP_MS : MIN_ATTEMPT_GAP_MS),
        followedUpKey: refreshing ? event.key : null,
        requestKey: event.key,
        requestInFlight: false,
        failure: null,
        outOfDate: false,
        // A load the map asked for, as a view that moved, leaves a pause as it is: only a touch ends it.
        paused: state.paused,
      };
    }

    case 'failed': {
      const next = { ...state, lastAttemptAt: event.now, requestInFlight: false, failure: event.failure,
        attemptGapMs: MIN_ATTEMPT_GAP_MS };
      if (failedRequestOutcome(state, event.now) !== 'out-of-date') return next;
      return { ...next, vehicles: [], clusters: [], lastSeenVehicles: [], lastSeenClusters: [], lastSeenProviders: {}, batteryRanges: {},
        hasData: false, dataKey: null, outOfDate: true };
    }

    case 'aborted':
      return state.requestInFlight ? { ...state, requestKey: null, requestInFlight: false } : state;

    case 'paused':
      return state.paused === event.paused ? state : { ...state, paused: event.paused };

    case 'parkingChecked':
      return state.parking.length > 0 && isExpired(state.parkingExpiresAt, event.now)
        ? { ...state, parking: [] }
        : state;
  }
}

/**
 * 'load': nothing on screen answers the current view yet (the first load, or a
 * new area, zoom level or server filter). 'refresh': the data on screen is
 * being checked again and must not visibly change until the answer arrives.
 */
export type ScooterLoading = 'load' | 'refresh';

export function scooterLoading(state: ScooterDataState, queryKey: string | null): ScooterLoading | null {
  // A changed query counts from the moment it changes, before its request starts.
  const pending = state.requestInFlight || (queryKey !== null && queryKey !== state.requestKey);
  if (!pending) return state.lastAttemptAt === null ? 'load' : null;
  return state.hasData && state.dataKey === queryKey ? 'refresh' : 'load';
}
