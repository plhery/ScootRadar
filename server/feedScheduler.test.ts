import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FeedScheduler, idPhase, type CollectionAttention, type CollectionReason, type SchedulerOptions } from './feedScheduler';

interface Feed { id: string; host: string; fast?: boolean; paced?: boolean; concurrencyKey?: string; watchMs?: number; idleIntervalMs?: number; idlePhase?: number; nightAt?: (time: number) => boolean }
const MINUTE = 60_000;
// A whole number of idle intervals, so a phase of 0 falls on it.
const T0 = 1_800_000_000_000;

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0); });
afterEach(() => vi.useRealTimers());

function schedule(feeds: Feed[], options: Partial<SchedulerOptions<Feed>> = {},
  outcome: (feed: Feed) => Promise<{ failed: boolean } | void> = async () => {}) {
  const calls: Array<{ id: string; at: number; reason?: CollectionReason }> = [];
  const reasons = new Map<string, CollectionReason>();
  const attention = new Map<string, CollectionAttention>();
  const scheduler = new FeedScheduler<Feed>((feed, heard) => {
    calls.push({ id: feed.id, at: Date.now() - T0, reason: reasons.get(feed.id) });
    attention.set(feed.id, heard);
    return outcome(feed);
  }, { alwaysFast: feed => feed.fast === true, phase: () => 0, ...options,
    onStart: (feed, reason) => reasons.set(feed.id, reason) });
  scheduler.setFeeds(feeds);
  scheduler.start();
  const times = (id: string) => calls.filter(call => call.id === id).map(call => call.at / MINUTE);
  return { scheduler, calls, times, attention };
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

it('collects the always-fast feeds every minute while a deploy\'s new feeds keep every host busy', async () => {
  // A deploy added 202 feeds on 24 October 2026; their slow first collections on three hosts held Zürich's back.
  const added = Array.from({ length: 60 }, (_, i) => ({ id: `new-${i}`, host: `new-${i % 4}` }));
  const { scheduler, times } = schedule([{ id: 'zurich', host: 'ch', fast: true }, ...added],
    { lastCollectedAt: feed => feed.id === 'zurich' ? T0 - 30_000 : undefined },
    feed => feed.host === 'ch' ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, 20_000)));
  try {
    await vi.advanceTimersByTimeAsync(3 * MINUTE);
    // Due 30 seconds in, it takes the first slot a collection frees, then keeps its minute.
    expect(times('zurich').map(minutes => Math.round(minutes * 60))).toEqual([40, 100, 160]);
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

it('runs paced sweeps on their hosts\' two slots, beside six other collections', async () => {
  // GCOO's, Kickgoing's, Swing's and Beam's sweeps held every slot after a deploy on 24 October 2026.
  const sweeps = Array.from({ length: 12 }, (_, i) => ({ id: `sweep-${i}`, host: `app-${i % 4}`, paced: true }));
  const feeds = Array.from({ length: 10 }, (_, i) => ({ id: `feed-${i}`, host: `host-${i}` }));
  const { scheduler, calls } = schedule([...sweeps, ...feeds], {}, () => new Promise(() => {}));
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect(calls.filter(call => call.id.startsWith('sweep'))).toHaveLength(8);
    expect(calls.filter(call => call.id.startsWith('feed'))).toHaveLength(6);
  } finally { scheduler.stop(); }
});

it('gives separately paced accounts on one host their own slots, keeping requested towns first within each account', async () => {
  const accounts = ['primary', 'second', 'third'];
  const feeds = accounts.flatMap(account => Array.from({ length: 4 }, (_, index) => ({
    id: `${account}-${index}`, host: 'web-production.lime.bike', paced: true, concurrencyKey: `lime:${account}`,
  })));
  const { scheduler, calls } = schedule(feeds, {}, () => new Promise(() => {}));
  try {
    await vi.advanceTimersByTimeAsync(0);
    for (const account of accounts) expect(calls.filter(call => call.id.startsWith(account))).toHaveLength(2);
    scheduler.demand(['primary-2', 'primary-3', 'second-2'], Date.now());
    expect(calls.filter(call => call.id.startsWith('primary'))).toHaveLength(4);
    expect(calls.filter(call => call.id.startsWith('second'))).toHaveLength(3);
    expect(calls.filter(call => call.id.startsWith('third'))).toHaveLength(2);
  } finally { scheduler.stop(); }
});

it('keeps the host limit for unpaced clients even if a concurrency key is supplied', async () => {
  const { scheduler, calls } = schedule(Array.from({ length: 4 }, (_, i) => ({
    id: String(i), host: 'unpaced', concurrencyKey: String(i),
  })), {}, () => new Promise(() => {}));
  try { await vi.advanceTimersByTimeAsync(0); expect(calls).toHaveLength(2); }
  finally { scheduler.stop(); }
});

it('starts a paced town someone opens while idle sweeps hold its host, and tells it where they look', async () => {
  // Lime's idle sweeps held both its slots, so a town opened on 25 October 2026 waited minutes for one.
  const sweeps = ['lime-a', 'lime-b', 'lime-c'].map(id => ({ id, host: 'lime', paced: true }));
  const others = ['fr-a', 'fr-b', 'fr-c'].map(id => ({ id, host: 'fr' }));
  const { scheduler, times, attention } = schedule([...sweeps, ...others], {}, () => new Promise(() => {}));
  const lyon = { south: 45.7, west: 4.7, north: 45.9, east: 5.0 };
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect(times('lime-c')).toEqual([]);
    expect(attention.get('lime-a')?.urgent()).toBe(false);
    scheduler.demand(['lime-c', 'lime-a', 'fr-c'], Date.now(), lyon);
    expect(times('lime-c')).toEqual([0]);
    expect(attention.get('lime-c')?.urgent()).toBe(true);
    expect(attention.get('lime-c')?.focus()).toEqual(lyon);
    // The idle sweep under way is looked at now, and gives its turns first too.
    expect(attention.get('lime-a')?.urgent()).toBe(true);
    // A feed whose client paces nothing still waits for a slot on its host.
    expect(times('fr-c')).toEqual([]);
    await vi.advanceTimersByTimeAsync(11 * MINUTE);
    expect(attention.get('lime-a')?.focus()).toBeUndefined();
  } finally { scheduler.stop(); }
});

it('wakes the paced town longest past its interval while polled towns hold its host, one at a time', async () => {
  // A client polling five GCOO towns near Seoul held both of the host's slots from 11:57 to 13:05 on 26 October
  // 2026, and the other 74 towns expired (SCOOTRADAR-CACHE-5W).
  const polled = ['near-a', 'near-b', 'near-c', 'near-d', 'near-e'];
  const feeds = [...polled, 'far-a', 'far-b', 'far-c'].map(id => ({ id, host: 'gcoo', paced: true }));
  const started = new Map([['far-a', 19], ['far-b', 18], ['far-c', 1]].map(([id, ago]) => [id as string, T0 - (ago as number) * MINUTE]));
  // The far towns' turns come a minute in, once the polled ones hold the host.
  const { scheduler, calls } = schedule(feeds, { lastCollectedAt: feed => started.get(feed.id) ?? T0 - 30_000,
    phase: feed => feed.id.startsWith('far') ? 1 / 20 : 0 }, () => new Promise(resolve => setTimeout(resolve, 50_000)));
  const poll = setInterval(() => scheduler.demand(polled), 20_000);
  try {
    scheduler.demand(polled);
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    // Five minutes past its interval, five before it would expire, it queues with the polled towns.
    expect(calls.filter(call => call.id.startsWith('far') && call.reason !== 'late')).toEqual([]);
    const late = calls.filter(call => call.reason === 'late');
    expect(late.map(call => call.id)).toEqual(['far-a', 'far-b']);
    expect(late[0].at / MINUTE).toBeGreaterThanOrEqual(6);
    expect(late[0].at / MINUTE).toBeLessThan(8);
    // The next waits for it to finish: the polled towns keep a slot.
    expect(late[1].at - late[0].at).toBeGreaterThanOrEqual(50_000);
    const meanwhile = calls.filter(call => polled.includes(call.id) && call.at >= late[0].at && call.at < late[1].at + 50_000);
    expect(meanwhile.length).toBeGreaterThanOrEqual(2);
  } finally { clearInterval(poll); scheduler.stop(); }
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

it('collects an idle feed at the phase it gives, by default', async () => {
  const { scheduler, times } = schedule([{ id: 'a', host: 'a', idlePhase: 0.5 }], { phase: undefined });
  try {
    await vi.advanceTimersByTimeAsync(31 * MINUTE);
    expect(times('a')).toEqual([0, 10, 30]);
  } finally { scheduler.stop(); }
});

it('collects an idle feed at its hour the next day after a collection by night, not a whole interval on', async () => {
  const HOUR = 60 * MINUTE;
  // T0 is 08:00 UTC, 32 hours into a three-day interval; a phase of 8 hours falls at 08:00 two days on.
  const feed = { id: 'raleigh', host: 'lime', idleIntervalMs: 72 * HOUR, idlePhase: 8 / 72 };
  const night = schedule([{ ...feed, nightAt: time => time === T0 }], { phase: undefined });
  const day = schedule([{ ...feed, id: 'durham' }], { phase: undefined });
  try {
    await vi.advanceTimersByTimeAsync(50 * HOUR);
    expect(night.times('raleigh')).toEqual([0, 24 * 60, 48 * 60]);
    expect(day.times('durham')).toEqual([0, 48 * 60]);
  } finally { night.scheduler.stop(); day.scheduler.stop(); }
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

it('waits for the first of several collections a request asked for', async () => {
  let finish!: () => void;
  const { scheduler } = schedule([{ id: 'lyon', host: 'fr' }, { id: 'stuck', host: 'it' }], {},
    feed => feed.id === 'stuck' && Date.now() > T0 ? new Promise(() => {})
      : Date.now() > T0 ? new Promise(resolve => { finish = () => resolve(); }) : Promise.resolve());
  try {
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    scheduler.demand(['lyon', 'stuck']);
    const first = scheduler.wait(['lyon', 'stuck'], 3_000, true);
    const all = scheduler.wait(['lyon', 'stuck'], 3_000);
    await vi.advanceTimersByTimeAsync(500);
    finish();
    expect(await first).toBe(true);
    await vi.advanceTimersByTimeAsync(2_500);
    expect(await all).toBe(false);
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

it('goes on after a restart with the feeds longest overdue, then new ones, whatever the catalog\'s order', async () => {
  // Collected 22 and 50 minutes ago: due 20 and 40 minutes ago. One host's two slots, 10 seconds a collection.
  const last: Record<string, number> = { fresh: T0 - 22 * MINUTE, 'fresh-2': T0 - 22 * MINUTE, stale: T0 - 50 * MINUTE };
  const { scheduler, calls } = schedule(['new', 'fresh', 'fresh-2', 'stale'].map(id => ({ id, host: 'lime' })),
    { lastCollectedAt: feed => last[feed.id] }, () => new Promise(resolve => setTimeout(resolve, 10_000)));
  try {
    await vi.advanceTimersByTimeAsync(30_000);
    expect(calls.map(call => [call.id, call.at / 1000])).toEqual([['stale', 0], ['fresh', 0], ['fresh-2', 10], ['new', 10]]);
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

it('uses an upstream-specific idle interval while watched areas still refresh every minute', async () => {
  const limited = { id: 'lime-area', host: 'lime', idleIntervalMs: 60 * MINUTE };
  const { scheduler, times } = schedule([limited, { id: 'public', host: 'gbfs' }]);
  try {
    await vi.advanceTimersByTimeAsync(41 * MINUTE);
    expect(times('lime-area')).toEqual([0]);
    expect(times('public')).toEqual([0, 20, 40]);
    scheduler.demand(['lime-area']);
    await vi.advanceTimersByTimeAsync(2 * MINUTE);
    expect(times('lime-area')).toEqual([0, 41, 42, 43]);
  } finally { scheduler.stop(); }
});

it('keeps a feed with a watch of its own watched only that long', async () => {
  const { scheduler, times } = schedule([{ id: 'lime-group', host: 'lime', watchMs: 3 * MINUTE }, { id: 'lyon', host: 'fr' }]);
  try {
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    scheduler.demand(['lime-group', 'lyon']);
    await vi.advanceTimersByTimeAsync(9.5 * MINUTE);
    expect(times('lime-group')).toEqual([0, 5, 6, 7, 8]);
    expect(times('lyon')).toEqual([0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(scheduler.mode({ id: 'lime-group', host: 'lime' })).toBe('idle');
  } finally { scheduler.stop(); }
});

it('serves older requested areas before areas a polling client requests again', async () => {
  const feeds = ['a', 'b', 'c', 'd', 'e', 'f'].map(id => ({ id, host: 'limited' }));
  const { scheduler, calls } = schedule(feeds, {}, () => new Promise(resolve => {
    setTimeout(() => resolve({ failed: false }), 40_000);
  }));
  scheduler.demand(feeds.map(feed => feed.id));
  const polling = setInterval(() => scheduler.demand(feeds.map(feed => feed.id)), 3_000);
  try {
    await vi.advanceTimersByTimeAsync(120_000);
    expect(calls.find(call => call.id === 'e')?.at).toBe(80_000);
    expect(calls.find(call => call.id === 'f')?.at).toBe(80_000);
  } finally {
    clearInterval(polling);
    scheduler.stop();
  }
});

it('warms a deploy\'s new feeds up a stage at a time, so the feeds the cache holds keep their turns', async () => {
  // 30 new feeds on three hosts, 20 seconds a first collection; Lyon, restored, is due 25 seconds in.
  // All due at once, the new feeds would hold every slot until 100 seconds.
  const added = Array.from({ length: 30 }, (_, i) => ({ id: `new-${'abc'[i % 3]}-${Math.floor(i / 3)}`, host: `host-${'abc'[i % 3]}` }));
  const { scheduler, calls, times } = schedule([{ id: 'lyon', host: 'fr' }, ...added],
    { lastCollectedAt: feed => feed.id === 'lyon' ? T0 - 19 * MINUTE : undefined,
      phase: feed => feed.id === 'lyon' ? 25_000 / (20 * MINUTE) : 0 },
    () => new Promise(resolve => setTimeout(resolve, 20_000)));
  try {
    await vi.advanceTimersByTimeAsync(0);
    // The first stage: six, two on each host.
    expect(calls.map(call => call.id).sort()).toEqual(['new-a-0', 'new-a-1', 'new-b-0', 'new-b-1', 'new-c-0', 'new-c-1']);
    scheduler.demand(['new-c-9'], Date.now());
    await vi.advanceTimersByTimeAsync(20_000);
    // A new feed someone looks at goes first, its stage notwithstanding.
    expect(calls.find(call => call.id === 'new-c-9')).toEqual({ id: 'new-c-9', at: 20_000, reason: 'wake' });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(times('lyon')).toEqual([40_000 / MINUTE]);
    await vi.advanceTimersByTimeAsync(3 * MINUTE);
    expect(new Set(calls.map(call => call.id)).size).toBe(31);
  } finally { scheduler.stop(); }
});

it('collects every feed at once on a cold start, and an always-fast new feed at once beside restored ones', async () => {
  const cold = schedule(Array.from({ length: 12 }, (_, i) => ({ id: `feed-${i}`, host: `host-${i}` })), {},
    () => new Promise(resolve => setTimeout(resolve, 20_000)));
  try {
    await vi.advanceTimersByTimeAsync(20_000);
    expect(cold.calls.map(call => call.at / 1000)).toEqual([...Array(6).fill(0), ...Array(6).fill(20)]);
  } finally { cold.scheduler.stop(); }
  vi.setSystemTime(T0);
  const restored = schedule([{ id: 'lyon', host: 'fr' }, ...Array.from({ length: 12 }, (_, i) => ({ id: `new-${i}`, host: `host-${i}` })),
    { id: 'basel', host: 'ch', fast: true }], { lastCollectedAt: feed => feed.id === 'lyon' ? T0 - 5 * MINUTE : undefined });
  try {
    await vi.advanceTimersByTimeAsync(0);
    expect(restored.times('basel')).toEqual([0]);
    // The new idle feeds: the first stage now, the second 15 seconds later.
    expect(restored.calls.filter(call => call.id.startsWith('new-'))).toHaveLength(6);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(restored.calls.filter(call => call.id.startsWith('new-')).map(call => call.at / 1000)).toEqual([...Array(6).fill(0), ...Array(6).fill(15)]);
  } finally { restored.scheduler.stop(); }
});
