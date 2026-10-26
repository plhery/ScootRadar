import { PerformanceObserver, performance } from 'node:perf_hooks';

/**
 * Logs the event loop held for `thresholdMs` or more, with the collections that ended around it, and
 * any garbage collection half that long. The cache held it for about 3.5 seconds every 20 minutes, at
 * minute 11 of the idle cycle, from 22 October 2026 on, and Prometheus could not say which feed or
 * whether the collector did it.
 */
export function watchStalls(log: (line: string) => void, thresholdMs = 1_000, checkMs = 250) {
  const ended: { id: string; at: number }[] = [];
  let last = performance.now();
  const timer = setInterval(() => {
    const now = performance.now();
    const heldMs = now - last - checkMs;
    last = now;
    if (heldMs < thresholdMs) return;
    // The collection that held it may end a few awaits later: those ending up to two seconds after count.
    const from = now - heldMs - 2_000;
    const until = now + 2_000;
    setTimeout(() => log(JSON.stringify({ event: 'event_loop_held', ms: Math.round(heldMs),
      ended: ended.filter(entry => entry.at >= from && entry.at <= until).map(entry => entry.id) })), 2_000).unref();
  }, checkMs);
  timer.unref();
  const collections = new PerformanceObserver(list => {
    for (const entry of list.getEntries()) {
      if (entry.duration >= thresholdMs / 2) {
        log(JSON.stringify({ event: 'gc_pause', ms: Math.round(entry.duration), kind: (entry as { detail?: { kind?: number } }).detail?.kind }));
      }
    }
  });
  collections.observe({ entryTypes: ['gc'] });
  return {
    /** A collection of the feed ended now. */
    ended(id: string) {
      ended.push({ id, at: performance.now() });
      if (ended.length > 64) ended.shift();
    },
    stop() {
      clearInterval(timer);
      collections.disconnect();
    },
  };
}
