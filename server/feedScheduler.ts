import { reportError } from './errorReporting';
import type { MapBounds } from '../src/lib/types';

export interface ScheduledFeed {
  id: string;
  host: string;
  /** An upstream with a lower request quota can scan idle areas less often. */
  idleIntervalMs?: number;
  /** How long a request keeps it watched, when not the scheduler's watchMs: less long under a tight quota. */
  watchMs?: number;
  /**
   * Its client spaces every request on the host, whatever the collection: it waits on that pace,
   * not on the cache, so it takes one of its host's slots but none of the shared ones.
   */
  paced?: boolean;
  /** An independently paced account within the host has its own collection slots. */
  concurrencyKey?: string;
}

/** What a collection reports back: a failed one is retried sooner than an idle feed is due. */
export interface CollectionOutcome {
  failed: boolean;
}

/**
 * Why a collection started. always: a source collected every active interval.
 * wake: a request asked for a feed collected over an active interval ago.
 * late: an idle feed on a paced host, about to expire, woken as if asked for.
 * watched: a feed someone has looked at recently. idle: nobody has. retry: an
 * idle feed whose last collection failed.
 */
export type CollectionReason = 'always' | 'wake' | 'late' | 'watched' | 'idle' | 'retry';
export type FeedCadenceMode = 'always' | 'watched' | 'idle';

/** What a collection under way can ask of the scheduler (sweeps.ts). */
export interface CollectionAttention {
  /** Someone is looking at the feed: a request is waiting for it, or one has asked within the watch. */
  urgent(): boolean;
  /** Where the last request for the feed looked, while it is watched. */
  focus(): MapBounds | undefined;
}

export interface SchedulerOptions<T extends ScheduledFeed> {
  /** How often always-fast and watched feeds are collected. */
  activeIntervalMs: number;
  /** How often the other feeds are collected. */
  idleIntervalMs: number;
  /** How long a request keeps a feed watched. */
  watchMs: number;
  /** The first retry of a failed idle feed; it doubles, up to half the idle interval. */
  retryMs: number;
  /** Feeds collected every active interval whether or not anyone looks. */
  alwaysFast: (feed: T) => boolean;
  /** When a restored feed last started a successful collection, so a restart does not collect everything at once. */
  lastCollectedAt?: (feed: T) => number | undefined;
  /** Where in the idle interval the feed's collections fall, in [0, 1): it spreads them out. */
  phase?: (feed: T) => number;
  onStart?: (feed: T, reason: CollectionReason) => void;
}

export const DEFAULT_SCHEDULE = { activeIntervalMs: 60_000, idleIntervalMs: 20 * 60_000, watchMs: 10 * 60_000, retryMs: 60_000 };
const MAX_RUNNING = 6;
const MAX_RUNNING_PER_HOST = 2;
// New feeds joining a catalog the cache holds come due this many at a time, a stage this far apart.
const WARM_UP_STAGE_SIZE = MAX_RUNNING;
const WARM_UP_STAGE_MS = 15_000;
// An idle feed on a paced host this long past its interval is woken: five minutes later, its interval
// plus ten, it would expire (cadence.ts).
const LATE_MS = 5 * 60_000;

/** A stable fraction in [0, 1) from the feed id (FNV-1a). */
export function idPhase(id: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 0x01000193);
  return (hash >>> 0) / 2 ** 32;
}

/**
 * Independent due times and host slots keep an operator outage from blocking
 * other operators. Feeds nobody looks at are collected every idle interval, at
 * a phase of their own so they don't all come due together; a request marks the
 * feeds it covers as watched, which collects them every active interval, and
 * at once when their last collection is older than that.
 */
export class FeedScheduler<T extends ScheduledFeed> {
  private definitions: T[] = [];
  private readonly byId = new Map<string, T>();
  private readonly due = new Map<string, number>();
  private readonly running = new Map<string, T>();
  private readonly startedAt = new Map<string, number>();
  private readonly failures = new Map<string, number>();
  private readonly watchedSince = new Map<string, number>();
  private readonly watchedUntil = new Map<string, number>();
  private readonly focusOf = new Map<string, MapBounds>();
  // Collections a request asked for, until they finish.
  private readonly woken = new Set<string>();
  // Of those, the idle feeds woken because they were late, one per paced host at a time.
  private readonly late = new Set<string>();
  private readonly waiters = new Map<string, Set<() => void>>();
  private readonly options: SchedulerOptions<T>;
  private timer?: ReturnType<typeof setTimeout>;
  private stopped = true;

  constructor(private readonly collect: (feed: T, attention: CollectionAttention) => Promise<CollectionOutcome | void>,
    options: Partial<SchedulerOptions<T>> = {}) {
    this.options = { ...DEFAULT_SCHEDULE, alwaysFast: () => false, ...options };
  }

  setFeeds(definitions: T[]): void {
    this.definitions = definitions;
    const now = Date.now();
    const ids = new Set(definitions.map(feed => feed.id));
    for (const map of [this.due, this.startedAt, this.failures, this.watchedSince, this.watchedUntil, this.focusOf, this.byId]) {
      for (const id of map.keys()) if (!ids.has(id)) map.delete(id);
    }
    for (const id of this.woken) if (!ids.has(id) && !this.running.has(id)) this.settle(id);
    const added: T[] = [];
    for (const feed of definitions) {
      this.byId.set(feed.id, feed);
      if (this.due.has(feed.id) || this.running.has(feed.id)) continue;
      const last = this.options.lastCollectedAt?.(feed);
      // A feed without a record waits behind the restored ones already overdue: it has no positions to lose.
      if (!last) { added.push(feed); continue; }
      this.startedAt.set(feed.id, last);
      // A restored feed keeps its turn, even one gone by, so a restart goes on with the longest overdue
      // rather than in the catalog's order. After the stall of 24 October 2026, feeds 29 minutes old
      // waited behind ones of 21, and expired (30) on the restart at 19:59.
      this.due.set(feed.id, this.nextDue(feed, last, last, false));
    }
    this.warmUp(added, now, added.length < definitions.length);
    this.pump();
  }

  /**
   * Feeds without a record joining feeds the cache already holds come due a stage at a time, taking
   * their hosts in turn. A deploy on 24 October 2026 added 202 feeds, all due at once, and the
   * feeds already on the map waited behind their slow first collections for over half an hour, some
   * until they expired. An always-fast feed, any feed of a cold start (`staged` false) and a feed a
   * request asks for (demand) are collected at once.
   */
  private warmUp(added: T[], now: number, staged: boolean): void {
    const byHost = new Map<string, T[]>();
    for (const feed of added) {
      if (!staged || this.options.alwaysFast(feed)) { this.due.set(feed.id, now); continue; }
      const queue = byHost.get(feed.host);
      if (queue) queue.push(feed); else byHost.set(feed.host, [feed]);
    }
    const queues = [...byHost.values()];
    for (let turn = 0, index = 0; queues.some(queue => queue.length > turn); turn++) {
      for (const queue of queues) {
        if (turn < queue.length) this.due.set(queue[turn].id, now + Math.floor(index++ / WARM_UP_STAGE_SIZE) * WARM_UP_STAGE_MS);
      }
    }
  }

  start(): void { this.stopped = false; this.pump(); }
  stop(): void { this.stopped = true; clearTimeout(this.timer); }

  /**
   * Marks the feeds as watched. Those last collected over an active interval
   * ago are collected at once, or their collection under way now counts as
   * asked for; the others are collected an active interval after their last.
   * `focus` is where the request looked, which their sweeps collect first.
   */
  demand(ids: Iterable<string>, now = Date.now(), focus?: MapBounds): void {
    let changed = false;
    for (const id of ids) {
      const feed = this.byId.get(id);
      if (!feed) continue;
      if (!this.watched(id, now)) this.watchedSince.set(id, now);
      this.watchedUntil.set(id, now + (feed.watchMs ?? this.options.watchMs));
      if (focus) this.focusOf.set(id, focus);
      if (this.options.alwaysFast(feed) || this.woken.has(id)) continue;
      // A collection already under way answers the request.
      if (this.running.has(id)) { this.woken.add(id); continue; }
      const target = (this.startedAt.get(id) ?? -Infinity) + this.options.activeIntervalMs;
      if (target <= now) {
        this.woken.add(id);
        this.due.set(id, now);
        changed = true;
      } else if (target < (this.due.get(id) ?? Infinity)) {
        this.due.set(id, target);
        changed = true;
      }
    }
    if (changed) this.pump();
  }

  /** A collection a request asked for is queued or under way. */
  refreshing(id: string): boolean { return this.woken.has(id); }

  /**
   * Resolves with true once the feeds' current collections have finished, or the first of them with
   * `first`, or with false after timeoutMs.
   */
  wait(ids: Iterable<string>, timeoutMs: number, first = false): Promise<boolean> {
    const pending = [...ids].filter(id => this.woken.has(id) || this.running.has(id));
    if (!pending.length) return Promise.resolve(true);
    return new Promise(resolve => {
      let left = first ? 1 : pending.length;
      const callbacks = new Map<string, () => void>();
      const finish = (collected: boolean) => {
        clearTimeout(timer);
        for (const [id, callback] of callbacks) this.waiters.get(id)?.delete(callback);
        resolve(collected);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      for (const id of pending) {
        const callback = () => { callbacks.delete(id); if (--left === 0) finish(true); };
        callbacks.set(id, callback);
        const set = this.waiters.get(id) ?? new Set();
        set.add(callback);
        this.waiters.set(id, set);
      }
    });
  }

  /**
   * When the feed went onto the active interval: 0 for an always-fast feed, the
   * start of its watch for a watched one, undefined while it is idle.
   */
  fastSince(id: string, now = Date.now()): number | undefined {
    const feed = this.byId.get(id);
    if (!feed) return undefined;
    if (this.options.alwaysFast(feed)) return 0;
    return this.watched(id, now) ? this.watchedSince.get(id) : undefined;
  }

  mode(feed: T, now = Date.now()): FeedCadenceMode {
    return this.options.alwaysFast(feed) ? 'always' : this.watched(feed.id, now) ? 'watched' : 'idle';
  }

  modes(now = Date.now()): Record<FeedCadenceMode, number> {
    const counts = { always: 0, watched: 0, idle: 0 };
    for (const feed of this.definitions) counts[this.mode(feed, now)]++;
    return counts;
  }

  private watched(id: string, now: number) { return (this.watchedUntil.get(id) ?? 0) > now; }

  private nextDue(feed: T, startedAt: number, finishedAt: number, failed: boolean): number {
    const { activeIntervalMs, retryMs } = this.options;
    const idleIntervalMs = feed.idleIntervalMs ?? this.options.idleIntervalMs;
    if (this.mode(feed, finishedAt) !== 'idle') return startedAt + activeIntervalMs;
    if (failed) {
      const failures = this.failures.get(feed.id) ?? 1;
      return finishedAt + Math.min(retryMs * 2 ** (failures - 1), Math.max(retryMs, idleIntervalMs / 2));
    }
    // The next time of the feed's phase at least an active interval away.
    const phase = (this.options.phase ?? (candidate => idPhase(candidate.id)))(feed) * idleIntervalMs;
    const earliest = startedAt + activeIntervalMs;
    return earliest + ((((phase - earliest) % idleIntervalMs) + idleIntervalMs) % idleIntervalMs);
  }

  private pump(): void {
    if (this.stopped) return;
    clearTimeout(this.timer);
    const now = Date.now();
    this.wakeLate(now);
    const rank = (feed: T) => this.woken.has(feed.id) ? -Infinity : this.due.get(feed.id) ?? 0;
    // A feed on the active interval goes before an idle one. A deploy on 24 October 2026 added 202
    // feeds, due at once; slow sweeps on three hosts held every slot, and Zürich's feeds, due a
    // minute later, waited behind them for over ten minutes.
    const idle = (feed: T) => this.mode(feed, now) === 'idle' && !this.woken.has(feed.id) ? 1 : 0;
    // A polling client must not keep re-queuing earlier feeds ahead of areas
    // still waiting for their first requested collection.
    const wakeOrder = new Map([...this.woken].map((id, index) => [id, index]));
    const pending = this.definitions.filter(feed => !this.running.has(feed.id)).sort((a, b) => {
      const aWake = wakeOrder.get(a.id), bWake = wakeOrder.get(b.id);
      return idle(a) - idle(b) ||
        (aWake !== undefined && bWake !== undefined ? aWake - bWake : rank(a) - rank(b));
    });
    // After the deploy of 24 October 2026, paced app-map sweeps held every shared slot, and
    // idle feeds on other hosts went uncollected for over half an hour.
    let shared = [...this.running.values()].filter(feed => !feed.paced).length;
    for (const feed of pending) {
      if (rank(feed) > now || (!feed.paced && shared >= MAX_RUNNING) || this.hostFull(feed)) continue;
      this.run(feed, now);
      if (!feed.paced) shared++;
    }
    // Blocked hosts are woken by completion; future due times need only one timer.
    const nextDue = this.definitions.filter(feed => !this.running.has(feed.id))
      .map(feed => this.due.get(feed.id) ?? 0).filter(due => due > now);
    if (nextDue.length) this.timer = setTimeout(() => this.pump(), Math.max(1, Math.min(...nextDue) - now));
  }

  /**
   * Wakes, on each paced host, the idle feed longest past its interval once it is LATE_MS past it,
   * one at a time: it then shares the turns and slots of the towns requests asked for, which keep
   * the other slot. From 11:57 to 13:05 on 26 October 2026, a client polling five GCOO towns near
   * Seoul held both of the host's slots and all its turns, and the other 74 towns expired
   * (SCOOTRADAR-CACHE-5W).
   */
  private wakeLate(now: number): void {
    const busy = new Set([...this.late].flatMap(id => {
      const feed = this.byId.get(id);
      return feed ? [this.slotKey(feed)] : [];
    }));
    const late = this.definitions.filter(feed => feed.paced && !this.woken.has(feed.id) && !this.running.has(feed.id) &&
      now - (this.startedAt.get(feed.id) ?? now) >= (feed.idleIntervalMs ?? this.options.idleIntervalMs) + LATE_MS &&
      this.mode(feed, now) === 'idle').sort((a, b) => this.startedAt.get(a.id)! - this.startedAt.get(b.id)!);
    for (const feed of late) {
      if (busy.has(this.slotKey(feed))) continue;
      busy.add(this.slotKey(feed));
      this.late.add(feed.id);
      this.woken.add(feed.id);
    }
  }

  private slotKey(feed: T): string { return feed.paced ? feed.concurrencyKey ?? feed.host : feed.host; }

  /**
   * A paced client spaces its host's requests whatever runs, and gives a feed someone looks at
   * its turns first (sweeps.ts): such a feed asked for by a request has slots of its own on the
   * host, so a town opened while idle sweeps hold the others starts at once.
   */
  private hostFull(feed: T): boolean {
    const own = feed.paced && this.woken.has(feed.id)
      ? (running: T) => this.woken.has(running.id) : () => true;
    return [...this.running.values()].filter(running => this.slotKey(running) === this.slotKey(feed) && own(running)).length >= MAX_RUNNING_PER_HOST;
  }

  private run(feed: T, now: number): void {
    const reason: CollectionReason = this.options.alwaysFast(feed) ? 'always' : this.late.has(feed.id) ? 'late' : this.woken.has(feed.id) ? 'wake'
      : this.watched(feed.id, now) ? 'watched' : this.failures.has(feed.id) ? 'retry' : 'idle';
    this.running.set(feed.id, feed);
    this.startedAt.set(feed.id, now);
    this.options.onStart?.(feed, reason);
    let failed = true;
    void this.collect(feed, {
      urgent: () => this.woken.has(feed.id) || this.watched(feed.id, Date.now()),
      focus: () => this.watched(feed.id, Date.now()) ? this.focusOf.get(feed.id) : undefined,
    }).then(outcome => { failed = outcome?.failed ?? false; }, error => {
      console.error('Feed collection failed', feed.id, error instanceof Error ? error.name : 'UnknownError');
      reportError(`collect:${feed.id}`, error);
    }).finally(() => {
      this.running.delete(feed.id);
      // A feed retired meanwhile is forgotten; one rediscovered has a new definition.
      const current = this.byId.get(feed.id);
      if (current) {
        if (failed) this.failures.set(feed.id, (this.failures.get(feed.id) ?? 0) + 1);
        else this.failures.delete(feed.id);
        this.due.set(feed.id, this.nextDue(current, now, Date.now(), failed));
      }
      this.settle(feed.id);
      this.pump();
    });
  }

  private settle(id: string): void {
    this.woken.delete(id);
    this.late.delete(id);
    const waiting = this.waiters.get(id);
    this.waiters.delete(id);
    for (const callback of waiting ?? []) callback();
  }
}
