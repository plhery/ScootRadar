import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FeedScheduler, idPhase, type CollectionReason, type SchedulerOptions } from './feedScheduler';

interface Feed { id: string; host: string; fast?: boolean }
const MINUTE = 60_000;
// A whole number of idle intervals, so a phase of 0 falls on it.
const T0 = 1_800_000_000_000;

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0); });
afterEach(() => vi.useRealTimers());

function schedule(feeds: Feed[], options: Partial<SchedulerOptions<Feed>> = {},
  outcome: (feed: Feed) => Promise<{ failed: boolean } | void> = async () => {}) {
  const calls: Array<{ id: string; at: number; reason?: CollectionReason }> = [];
  const reasons = new Map<string, CollectionReason>();
  const scheduler = new FeedScheduler<Feed>(feed => {
    calls.push({ id: feed.id, at: Date.now() - T0, reason: reasons.get(feed.id) });
    return outcome(feed);
  }, { alwaysFast: feed => feed.fast === true, phase: () => 0, ...options,
    onStart: (feed, reason) => reasons.set(feed.id, reason) });
  scheduler.setFeeds(feeds);
  scheduler.start();
  const times = (id: string) => calls.filter(call => call.id === id).map(call => call.at / MINUTE);
  return { scheduler, calls, times };
}

it('refreshes a healthy host on schedule while many jobs on another host are stuck', async () => {
  const { scheduler, times, calls } = schedule([
    ...Array.from({ length: 88 }, (_, i) => ({ id: `slow-${i}`, host: 'slow', fast: true })),
    { id: 'healthy', host: 'fast', fast: true },
  ], {}, feed => feed.host === 'slow' ? new Promise(() => {}) : Promise.resolve());
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect(calls.filter(call => call.id.startsWith('slow'))).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(2 * MINUTE);
    expect(times('healthy')).toEqual([0, 1, 2]);
    expect(calls.filter(call => call.id.startsWith('slow'))).toHaveLength(2);
  } finally { scheduler.stop(); }
});

it('runs at most six collections at once', async () => {
  const feeds = Array.from({ length: 10 }, (_, i) => ({ id: `feed-${i}`, host: `host-${i}`, fast: true }));
  const { scheduler, calls } = schedule(feeds, {}, () => new Promise(() => {}));
  try {
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    expect(calls).toHaveLength(6);
  } finally { scheduler.stop(); }
});

it('collects always-fast feeds every minute and idle ones every idle interval', async () => {
  const { scheduler, times, calls } = schedule([
    { id: 'zurich', host: 'ch', fast: true }, { id: 'lyon', host: 'fr' },
  ]);
  try {
    await vi.advanceTimersByTimeAsync(41 * MINUTE);
    expect(times('zurich')).toEqual(Array.from({ length: 42 }, (_, minute) => minute));
    expect(times('lyon')).toEqual([0, 20, 40]);
    expect(calls.find(call => call.id === 'lyon' && call.at === 20 * MINUTE)?.reason).toBe('idle');
    expect(calls.find(call => call.id === 'zurich' && call.at === 20 * MINUTE)?.reason).toBe('always');
    expect(scheduler.modes()).toEqual({ always: 1, watched: 0, idle: 1 });
  } finally { scheduler.stop(); }
});

it('spreads idle feeds over the interval by their phase', async () => {
  const feeds = ['a', 'b', 'c', 'd'].map(id => ({ id, host: id }));
  const { scheduler, times } = schedule(feeds, { phase: feed => ({ a: 0, b: 0.25, c: 0.5, d: 0.75 })[feed.id]! });
  try {
    await vi.advanceTimersByTimeAsync(29 * MINUTE);
    expect([times('a'), times('b'), times('c'), times('d')]).toEqual([[0, 20], [0, 5, 25], [0, 10], [0, 15]]);
    expect(idPhase('france:dott_fr_lyon')).toBeGreaterThanOrEqual(0);
    expect(idPhase('france:dott_fr_lyon')).toBeLessThan(1);
    expect(idPhase('france:dott_fr_lyon')).toBe(idPhase('france:dott_fr_lyon'));
  } finally { scheduler.stop(); }
});

it('collects a watched feed at once when its data is over a minute old, then every minute while watched', async () => {
  const { scheduler, times, calls } = schedule([{ id: 'lyon', host: 'fr' }]);
  try {
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    expect(times('lyon')).toEqual([0]);
    scheduler.demand(['lyon']);
    // Started without waiting for its idle turn, and the request can tell.
    expect(times('lyon')).toEqual([0, 5]);
    expect(calls.at(-1)?.reason).toBe('wake');
    expect(scheduler.refreshing('lyon')).toBe(true);
    expect(scheduler.fastSince('lyon')).toBe(T0 + 5 * MINUTE);
    await vi.advanceTimersByTimeAsync(0);
    expect(scheduler.refreshing('lyon')).toBe(false);
    // Watched for ten minutes, then idle again at its phase.
    await vi.advanceTimersByTimeAsync(30 * MINUTE);
    expect(times('lyon')).toEqual([0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20]);
    expect(calls.find(call => call.at === 6 * MINUTE)?.reason).toBe('watched');
    expect(scheduler.fastSince('lyon')).toBeUndefined();
  } finally { scheduler.stop(); }
});

it('keeps the minute between collections when a watched feed was collected moments ago', async () => {
  const { scheduler, times } = schedule([{ id: 'lyon', host: 'fr' }]);
  try {
    await vi.advanceTimersByTimeAsync(30_000);
    scheduler.demand(['lyon']);
    expect(scheduler.refreshing('lyon')).toBe(false);
    await vi.advanceTimersByTimeAsync(30_000 - 1);
    expect(times('lyon')).toEqual([0]);
    await vi.advanceTimersByTimeAsync(1);
    expect(times('lyon')).toEqual([0, 1]);
  } finally { scheduler.stop(); }
});

it('lets a request wait for the collection it started, up to its timeout', async () => {
  let finish!: () => void;
  const { scheduler } = schedule([{ id: 'lyon', host: 'fr' }, { id: 'stuck', host: 'it' }], {},
    feed => feed.id === 'stuck' && Date.now() > T0 ? new Promise(() => {})
      : Date.now() > T0 ? new Promise(resolve => { finish = () => resolve(); }) : Promise.resolve());
  try {
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    scheduler.demand(['lyon', 'stuck']);
    const collected = scheduler.wait(['lyon'], 3_000);
    const timedOut = scheduler.wait(['stuck'], 3_000);
    await vi.advanceTimersByTimeAsync(1_000);
    finish();
    expect(await collected).toBe(true);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(await timedOut).toBe(false);
    expect(scheduler.refreshing('stuck')).toBe(true);
    expect(await scheduler.wait(['lyon'], 3_000)).toBe(true);
  } finally { scheduler.stop(); }
});

it('retries a failed idle feed after a minute, backing off to half the idle interval', async () => {
  let failing = true;
  const { scheduler, times, calls } = schedule([{ id: 'lyon', host: 'fr' }], {},
    async () => ({ failed: failing }));
  try {
    await vi.advanceTimersByTimeAsync(25 * MINUTE);
    expect(times('lyon')).toEqual([0, 1, 3, 7, 15, 25]);
    expect(calls.at(-1)?.reason).toBe('retry');
    failing = false;
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    expect(times('lyon')).toEqual([0, 1, 3, 7, 15, 25, 35]);
    // Back on its idle phase.
    await vi.advanceTimersByTimeAsync(25 * MINUTE);
    expect(times('lyon')).toEqual([0, 1, 3, 7, 15, 25, 35, 40, 60]);
  } finally { scheduler.stop(); }
});

it('counts a collection that threw as failed', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { scheduler, times } = schedule([{ id: 'lyon', host: 'fr' }], {}, async () => { throw new Error('down'); });
  try {
    await vi.advanceTimersByTimeAsync(2 * MINUTE);
    expect(times('lyon')).toEqual([0, 1]);
  } finally { scheduler.stop(); error.mockRestore(); }
});

it('lets a restored feed wait for its turn instead of collecting everything after a restart', async () => {
  const { scheduler, times } = schedule([{ id: 'lyon', host: 'fr' }, { id: 'nantes', host: 'fr' }, { id: 'zurich', host: 'ch', fast: true }],
    { lastCollectedAt: feed => feed.id === 'nantes' ? undefined : T0 - 30_000 });
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect([times('lyon'), times('nantes'), times('zurich')]).toEqual([[], [0], []]);
    await vi.advanceTimersByTimeAsync(20 * MINUTE);
    expect(times('lyon')).toEqual([20]);
    expect(times('zurich')[0]).toBe(0.5);
  } finally { scheduler.stop(); }
});

it('counts a collection already under way as the one a request asked for', async () => {
  const finishers = new Map<string, () => void>();
  const finish = () => finishers.get('lyon')!();
  const { scheduler, times } = schedule([{ id: 'lyon', host: 'fr' }, { id: 'zurich', host: 'ch', fast: true }], {},
    feed => new Promise(resolve => { finishers.set(feed.id, () => resolve()); }));
  try {
    await vi.advanceTimersByTimeAsync(0);
    scheduler.demand(['lyon', 'zurich']);
    expect(times('lyon')).toEqual([0]);
    expect(scheduler.refreshing('lyon')).toBe(true);
    // An always-fast feed is never refreshed for a request: its next collection is under a minute away.
    expect(scheduler.refreshing('zurich')).toBe(false);
    finish();
    await vi.advanceTimersByTimeAsync(0);
    expect(scheduler.refreshing('lyon')).toBe(false);
  } finally { scheduler.stop(); }
});
