/**
 * The Worker answers a network (an address, or an IPv6 /64) 60 map requests a minute, scooters and zones
 * together (SCOOTER_API_RATE_LIMITER in wrangler.jsonc), and refuses the rest of the minute with 429 and
 * Retry-After. The map keeps under it by itself: it counts this browser's requests of the last minute, all its
 * tabs and reloads together, and waits with the next one once a pace is reached, rather than be refused.
 *
 * On 16 and 17 November 2026 a home connection in Munich was refused 85 and 74 times in bursts of 80 to 100
 * requests a minute: one map loaded 14 times, each load counting from nothing, and after a refusal the map
 * asked again every ten seconds and at every pan, so the whole refused minute went on being asked for.
 */
export const PACE_WINDOW_MS = 60_000;
/** Loads for a view that moved: the 60 less what another device on the same network may need. */
export const VIEW_PACE = 45;
/** Refreshes of the view on screen, as while it waits for its feeds: they leave the rest to a view that moves. */
export const REFRESH_PACE = 30;
/** What a 429 without a usable Retry-After is waited out for, and the longest one is. */
const REFUSED_DEFAULT_MS = 60_000;
const REFUSED_MAX_MS = 5 * 60_000;

const STORAGE_KEY = 'scooters-requests';

/**
 * When a request may start under `pace` requests a minute, given when the last ones were sent: `now`, or when
 * enough of them are a minute old.
 */
export function paceOpensAt(sent: readonly number[], now: number, pace: number): number {
  const recent = sent.filter(at => at > now - PACE_WINDOW_MS && at <= now).sort((a, b) => a - b);
  return recent.length < pace ? now : recent[recent.length - pace] + PACE_WINDOW_MS;
}

/** How long a 429 asks to be left alone, from its Retry-After in seconds. */
export function refusedForMs(response: Pick<Response, 'headers'>): number {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, REFUSED_MAX_MS) : REFUSED_DEFAULT_MS;
}

/** When this browser sent its map requests of the last minute. Empty where storage is unavailable. */
export function recentRequests(now: number): number[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(stored)
      ? stored.filter((at): at is number => typeof at === 'number' && at > now - PACE_WINDOW_MS && at <= now)
      : [];
  } catch {
    return [];
  }
}

/** Counts a map request about to be sent, for scooters or zones. Only the times of the last minute are kept. */
export function noteRequest(now: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...recentRequests(now), now]));
  } catch {}
}

const REFUSAL_KEY = 'scooters-refused-until';
let storageUnavailableDeadline = 0;

/**
 * Until when a 429 holds this browser's requests: never later than the longest refusal from `now`. The deadline is
 * a time of the device's clock, so a clock set back after a 429 (an NTP correction, a time zone fixed by hand) left
 * it as far ahead as the clock went back: a map opened then stayed on "Finding scooters" over an empty map, with no
 * failure and no button, in every tab and reload, for as long as the jump (week review of 24 November 2026, S1).
 * One further off than that is kept from now, for every tab, so that it ends: capped only as it was read, it would
 * move on with the clock. The requests of the last minute already leave out the times after now.
 */
function refusalDeadline(now: number): number {
  let deadline = storageUnavailableDeadline;
  try {
    deadline = Math.max(Number(localStorage.getItem(REFUSAL_KEY)) || 0, deadline);
  } catch {}
  const latest = now + REFUSED_MAX_MS;
  if (deadline <= latest) return deadline;
  storageUnavailableDeadline = Math.min(storageUnavailableDeadline, latest);
  try {
    localStorage.setItem(REFUSAL_KEY, String(latest));
  } catch {}
  return latest;
}

export function noteRefusal(response: Pick<Response, 'headers'>, now: number): void {
  const deadline = Math.max(refusalDeadline(now), now + refusedForMs(response));
  try {
    localStorage.setItem(REFUSAL_KEY, String(deadline));
  } catch {
    storageUnavailableDeadline = deadline;
  }
}

export function heldUntil(pace: number, now: number): number {
  return Math.max(refusalDeadline(now), paceOpensAt(recentRequests(now), now, pace));
}
