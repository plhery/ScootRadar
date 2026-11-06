/** Automatic requests leave at least this long after the previous request finished. */
export const MIN_ATTEMPT_GAP_MS = 10_000;
/**
 * The shortest gap before the one follow-up a response asks for with
 * meta.refreshing, while the server collects its feeds again.
 */
export const FOLLOW_UP_GAP_MS = 2_000;
/**
 * The shortest gap before a follow-up a response asks for with meta.followUpMs. Asked for at once
 * (0) while a quick feed is on its way, the server holds the request until it is in: the gap only
 * spaces the requests should it not.
 */
export const MIN_FOLLOW_UP_MS = 200;
/** Refresh this long before the scooters on screen expire. */
export const EXPIRY_LEAD_MS = 5_000;
export const DEFAULT_REFRESH_AFTER_MS = 60_000;
/**
 * After this long without a touch, a click, a key or the page coming back to the foreground, the
 * map stops refreshing on its own and says so; the next touch refreshes it. A map left open where
 * nobody looks kept asking for the same view every minute, as one on Berlin from 3 to 6 November
 * 2026 that kept Lime's shared rider-map accounts busy (docs/OBSERVABILITY.md).
 */
export const IDLE_PAUSE_MS = 30 * 60_000;

export interface RefreshSchedule {
  /** When the data on screen was received; null before the first success. */
  lastSuccessAt: number | null;
  /** When the previous request finished, whatever its outcome; null before the first. */
  lastAttemptAt: number | null;
  /** meta.refreshAfterSeconds of the data on screen, in milliseconds. */
  refreshAfterMs: number;
  /** When the scooters on screen expire; null when there are none. */
  expiresAt: number | null;
  /** The gap between requests; MIN_ATTEMPT_GAP_MS unless the data on screen asked for a quick follow-up. */
  attemptGapMs?: number;
}

/**
 * When the data is due for a refresh, before the gap between requests is
 * applied: at the server's refresh interval or shortly before the data
 * expires, whichever comes first. Without a successful load it is always due.
 */
export function refreshDueAt(schedule: RefreshSchedule): number {
  if (schedule.lastSuccessAt === null) return -Infinity;
  return Math.min(
    schedule.lastSuccessAt + Math.max(schedule.attemptGapMs ?? MIN_ATTEMPT_GAP_MS, schedule.refreshAfterMs),
    (schedule.expiresAt ?? Infinity) - EXPIRY_LEAD_MS
  );
}

/**
 * When the next automatic request may start. Null until a first request has
 * finished: the first load is started by the map, not by this schedule.
 */
export function nextRefreshAt(schedule: RefreshSchedule): number | null {
  if (schedule.lastAttemptAt === null) return null;
  return Math.max(refreshDueAt(schedule), schedule.lastAttemptAt + (schedule.attemptGapMs ?? MIN_ATTEMPT_GAP_MS));
}

export interface RefreshContext extends RefreshSchedule {
  now: number;
  /** The page is in the foreground. */
  visible: boolean;
  /** The page has just returned to the foreground. */
  returning?: boolean;
  /** A request is running or about to start. */
  requestInFlight: boolean;
  /** The map has told us what to load. */
  hasQuery: boolean;
  /** When someone last touched, clicked or typed on the page, or brought it back to the foreground; never pauses without. */
  lastInteractionAt?: number;
}

export type RefreshDecision =
  | { action: 'refresh' }
  /** `at` is when to decide again; null when only an event can change the answer. */
  | { action: 'wait'; at: number | null }
  /** A refresh is due, but nobody has touched the page for IDLE_PAUSE_MS: only a touch refreshes it. */
  | { action: 'pause' };

/**
 * Evaluated whenever a request finishes, a timer fires or the page changes
 * visibility. Hidden pages never refresh, and a request already under way is
 * waited for, also when the data expires in the meantime. A page that returns
 * to the foreground refreshes at once when a refresh is due, without the gap.
 */
export function refreshDecision(context: RefreshContext): RefreshDecision {
  if (!context.visible || !context.hasQuery || context.requestInFlight) return { action: 'wait', at: null };
  const at = nextRefreshAt(context);
  if (at === null) return { action: 'wait', at: null };
  if (context.now < (context.returning ? refreshDueAt(context) : at)) return { action: 'wait', at };
  return context.lastInteractionAt !== undefined && context.now - context.lastInteractionAt >= IDLE_PAUSE_MS
    ? { action: 'pause' } : { action: 'refresh' };
}
