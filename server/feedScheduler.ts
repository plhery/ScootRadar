import { reportError } from './errorReporting';

export interface ScheduledFeed {
  id: string;
  host: string;
}

/** What a collection reports back: a failed one is retried sooner than an idle feed is due. */
export interface CollectionOutcome {
  failed: boolean;
}

/**
 * Why a collection started. always: a source collected every active interval.
 * wake: a request asked for a feed collected over an active interval ago.
 * watched: a feed someone has looked at recently. idle: nobody has. retry: an
 * idle feed whose last collection failed.
 */
export type CollectionReason = 'always' | 'wake' | 'watched' | 'idle' | 'retry';
export type FeedCadenceMode = 'always' | 'watched' | 'idle';

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
  private readonly running = new Map<string, string>();
  private readonly startedAt = new Map<string, number>();
  private readonly failures = new Map<string, number>();
  private readonly watchedSince = new Map<string, number>();
  private readonly watchedUntil = new Map<string, number>();
  // Collections a request asked for, until they finish.
  private readonly woken = new Set<string>();
  private readonly waiters = new Map<string, Set<() => void>>();
  private readonly options: SchedulerOptions<T>;
  private timer?: ReturnType<typeof setTimeout>;
  private stopped = true;

  constructor(private readonly collect: (feed: T) => Promise<CollectionOutcome | void>,
    options: Partial<SchedulerOptions<T>> = {}) {
    this.options = { ...DEFAULT_SCHEDULE, alwaysFast: () => false, ...options };
  }

  setFeeds(definitions: T[]): void {
    this.definitions = definitions;
    const now = Date.now();
    const ids = new Set(definitions.map(feed => feed.id));
    for (const map of [this.due, this.startedAt, this.failures, this.watchedSince, this.watchedUntil, this.byId]) {
      for (const id of map.keys()) if (!ids.has(id)) map.delete(id);
    }
    for (const id of this.woken) if (!ids.has(id) && !this.running.has(id)) this.settle(id);
    for (const feed of definitions) {
      this.byId.set(feed.id, feed);
      if (this.due.has(feed.id) || this.running.has(feed.id)) continue;
      const last = this.options.lastCollectedAt?.(feed);
      if (!last) { this.due.set(feed.id, 0); continue; }
      this.startedAt.set(feed.id, last);
      this.due.set(feed.id, Math.max(now, this.nextDue(feed, last, last, false)));
    }
    this.pump();
  }

  start(): void { this.stopped = false; this.pump(); }
  stop(): void { this.stopped = true; clearTimeout(this.timer); }

  /**
   * Marks the feeds as watched. Those last collected over an active interval
   * ago are collected at once, or their collection under way now counts as
   * asked for; the others are collected an active interval after their last.
   */
  demand(ids: Iterable<string>, now = Date.now()): void {
    let changed = false;
    for (const id of ids) {
      const feed = this.byId.get(id);
      if (!feed) continue;
      if (!this.watched(id, now)) this.watchedSince.set(id, now);
      this.watchedUntil.set(id, now + this.options.watchMs);
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

  /** Resolves with true once the feeds' current collections have finished, or with false after timeoutMs. */
  wait(ids: Iterable<string>, timeoutMs: number): Promise<boolean> {
    const pending = [...ids].filter(id => this.woken.has(id) || this.running.has(id));
    if (!pending.length) return Promise.resolve(true);
    return new Promise(resolve => {
      let left = pending.length;
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
    const { activeIntervalMs, idleIntervalMs, retryMs } = this.options;
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
    const rank = (feed: T) => this.woken.has(feed.id) ? -Infinity : this.due.get(feed.id) ?? 0;
    const pending = this.definitions.filter(feed => !this.running.has(feed.id)).sort((a, b) => rank(a) - rank(b));
    for (const feed of pending) {
      if (this.running.size >= MAX_RUNNING) break;
      if (rank(feed) > now || [...this.running.values()].filter(host => host === feed.host).length >= MAX_RUNNING_PER_HOST) continue;
      this.run(feed, now);
    }
    // Blocked hosts are woken by completion; future due times need only one timer.
    const nextDue = this.definitions.filter(feed => !this.running.has(feed.id))
      .map(feed => this.due.get(feed.id) ?? 0).filter(due => due > now);
    if (nextDue.length) this.timer = setTimeout(() => this.pump(), Math.max(1, Math.min(...nextDue) - now));
  }

  private run(feed: T, now: number): void {
    const reason: CollectionReason = this.options.alwaysFast(feed) ? 'always' : this.woken.has(feed.id) ? 'wake'
      : this.watched(feed.id, now) ? 'watched' : this.failures.has(feed.id) ? 'retry' : 'idle';
    this.running.set(feed.id, feed.host);
    this.startedAt.set(feed.id, now);
    this.options.onStart?.(feed, reason);
    let failed = true;
    void this.collect(feed).then(outcome => { failed = outcome?.failed ?? false; }, error => {
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
    const waiting = this.waiters.get(id);
    this.waiters.delete(id);
    for (const callback of waiting ?? []) callback();
  }
}
