import { MIN_ATTEMPT_GAP_MS } from '@/lib/autoRefresh';
import type { TranslationKey } from '@/lib/i18n';
import type { UiText } from '@/lib/uiText';

/**
 * Why scooters could not be loaded. The same six reasons exist on iOS and Android. 'maintenance': the server behind
 * the scooter data did not answer (X-Scooter-Origin: down, src/lib/scooterProxy.ts), as while it reboots. The web
 * map has a seventh, 'unverified': the cache asked for its pass first (428) and Turnstile gave it none (mapPassClient.ts),
 * as when a blocker stops Turnstile; the apps are not asked.
 */
export type LoadFailure = 'offline' | 'timeout' | 'busy' | 'unavailable' | 'maintenance' | 'unverified' | 'failed';

export interface LoadFailureInput {
  /** The HTTP status, when the server answered with an error. */
  status?: number;
  /** The answer said the server behind the scooter data is down (X-Scooter-Origin: down). */
  originDown?: boolean;
  /** The request ran into its deadline. */
  timedOut?: boolean;
  /** navigator.onLine when the request failed. */
  online?: boolean;
}

export function classifyLoadFailure({ status, originDown = false, timedOut = false, online = true }: LoadFailureInput): LoadFailure {
  if (status !== undefined) {
    if (status === 429) return 'busy';
    if (status === 428) return 'unverified';
    if (originDown && status >= 500) return 'maintenance';
    return status >= 500 && status <= 599 ? 'unavailable' : 'failed';
  }
  // A request that stalls because the connection dropped is "offline", not slow.
  if (!online) return 'offline';
  return timedOut ? 'timeout' : 'failed';
}

const REASON_KEYS = {
  offline: 'fail.offline',
  timeout: 'fail.timeout',
  busy: 'fail.busy',
  unavailable: 'fail.unavailable',
  maintenance: 'maint.down',
  unverified: 'fail.unverified',
  failed: 'fail.generic',
} as const satisfies Record<LoadFailure, TranslationKey>;

/** The sentence that explains the failure in the banner and the out-of-date card. */
export function failureReasonKey(failure: LoadFailure): TranslationKey {
  return REASON_KEYS[failure];
}

export type FailureSurface = 'banner' | 'status' | 'card';

/**
 * Where a failure is shown: the banner under the search bar while nothing has
 * loaded, the dock status line while the data on screen is still valid, the
 * out-of-date card once it is not. Never a toast. Maintenance is none of these:
 * its own calm notice says it (maintenanceNotice).
 */
export function failureSurface(state: {
  failure: LoadFailure | null;
  hasData: boolean;
  outOfDate: boolean;
}): FailureSurface | null {
  if (state.failure === 'maintenance') return null;
  if (state.outOfDate) return 'card';
  if (!state.failure) return null;
  return state.hasData ? 'status' : 'banner';
}

/** The longest wait a Retry-After is honoured for: a map is not left unasked longer by a wrong one. */
export const MAX_RETRY_AFTER_MS = 5 * 60_000;

/** A Retry-After in seconds, in milliseconds, at most MAX_RETRY_AFTER_MS; 0 for none or one this map does not read. */
export function retryAfterMs(header: string | null): number {
  if (header === null || !/^\s*\d+\s*$/.test(header)) return 0;
  return Math.min(Number(header) * 1000, MAX_RETRY_AFTER_MS);
}

/**
 * The server behind the scooter data is down for maintenance (X-Scooter-Origin: down): when it was announced to be
 * back (X-Scooter-Back-Around), on this device's clock; null when that was not announced.
 */
export interface MapMaintenance {
  backAround: number | null;
}

/**
 * The calm notice under the search bar while the server is down for maintenance: the scooters on screen and their
 * time, or none, and when it should be back, if that was announced. Once that time has passed (`now`, on this
 * device's clock), it says the maintenance is running late instead of naming a time already gone. No warning and no
 * button: the map asks again by itself, and the notice goes once the data is back.
 */
export function maintenanceNotice(state: { maintenance: MapMaintenance | null; hasData: boolean; lastUpdated: number | null; now: number }): UiText[] | null {
  const { maintenance } = state;
  if (!maintenance) return null;
  const { backAround } = maintenance;
  return [
    state.hasData && state.lastUpdated !== null ? { key: 'maint.paused', time: state.lastUpdated } : { key: 'maint.down' },
    ...(backAround === null ? [] : [backAround > state.now ? { key: 'maint.backAround', time: backAround } satisfies UiText : { key: 'maint.late' } satisfies UiText]),
  ];
}

/** The gap before the next request after an answer with that Retry-After: MIN_ATTEMPT_GAP_MS at least. */
export function retryGapMs(retryAfter = 0): number {
  return Math.max(MIN_ATTEMPT_GAP_MS, retryAfter);
}
