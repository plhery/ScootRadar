// Spaces the requests a script sends to each host, as the cache paces Dott's and ATOM's: one
// host serves Bird's, Lime's or Dott's feeds of a whole country, and refuses bursts.

/**
 * `wait(url)` resolves when a request to the url's host may go: at most one every spacingMs, so
 * two a second at 500 ms. `holdOff(url, ms)` leaves the host alone for a while, as one answering
 * 429 Too Many Requests asks.
 */
export function hostPacer(spacingMs, { now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const next = new Map();
  return {
    async wait(url) {
      const host = new URL(url).hostname;
      const at = Math.max(now(), next.get(host) ?? 0);
      next.set(host, at + spacingMs);
      if (at > now()) await sleep(at - now());
    },
    holdOff(url, ms) {
      const host = new URL(url).hostname;
      next.set(host, Math.max(next.get(host) ?? 0, now() + ms));
    },
  };
}

/** How long a 429 or 403 answer asks to be left alone: its Retry-After, ten seconds without one, a minute at most. */
export function holdOffMs(response) {
  const seconds = Number(response.headers.get('retry-after'));
  return Math.min(Number.isFinite(seconds) && seconds > 0 ? seconds : 10, 60) * 1000;
}
