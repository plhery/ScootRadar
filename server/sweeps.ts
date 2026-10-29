import { AsyncLocalStorage } from 'node:async_hooks';
import { boundsCenter } from '../src/lib/geo';
import type { MapBounds, Vehicle } from '../src/lib/types';

/**
 * What the cache tells a collection under way, and hears back from it, without every collector
 * passing it down to its client: the app maps' clients read it to give their turns to a town
 * someone is looking at, and their sweeps to start where people look and to report each part
 * as it is done, which the map shows before the sweep ends.
 */
export interface CollectionScope {
  /** Someone is looking at the feed now. */
  urgent(): boolean;
  /** Where the last request for the feed looked, while it is watched. */
  focus(): MapBounds | undefined;
  /** The scooters the sweep has found so far, and the parts of the area it has finished. */
  progress(found: Vehicle[], swept: MapBounds[]): void;
}

const scope = new AsyncLocalStorage<CollectionScope>();
export const withinCollection = <T>(collection: CollectionScope, run: () => Promise<T>): Promise<T> => scope.run(collection, run);
export const currentCollection = (): CollectionScope | undefined => scope.getStore();

/**
 * Spaces a client's requests to its host, intervalMs apart, whichever collections make them. A
 * collection someone is looking at goes first, and an idle sweep of another town waits for the
 * turns it leaves. Until 25 October 2026 the turns went in the order asked, so a town opened while
 * idle sweeps ran shared Lime's one request every five seconds with them.
 *
 * Given `routineEvery`, one turn in that many, while an idle sweep waits, goes to the idle sweep that
 * began first, so that a town watched for long cannot hold back the others' sweeps past their feeds'
 * expiry: on 28 October 2026 a watched Münster took nearly every turn of ATOM's client for a
 * quarter of an hour, and Linköping's sweep of 18 views, a minute's work, took 932 seconds.
 */
export class Pacer {
  private next: number;
  private readonly waiting: { urgent: boolean; began: number; go: () => void }[] = [];
  /** When each collection first asked for a turn. */
  private readonly began = new WeakMap<CollectionScope, number>();
  /** The turns given in a row to collections someone is looking at while an idle sweep waited. */
  private urgentTurns = 0;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(private readonly intervalMs: number, private readonly now: () => number = Date.now, startAt = 0,
    private readonly routineEvery = Infinity) {
    this.next = startAt;
  }

  /** Resolves when the next request may start. */
  turn(): Promise<void> {
    const collection = currentCollection();
    const urgent = collection?.urgent() ?? false;
    const began = (collection && this.began.get(collection)) ?? this.now();
    if (collection) this.began.set(collection, began);
    return new Promise(go => {
      const after = urgent ? this.waiting.findIndex(other => !other.urgent) : -1;
      if (after < 0) this.waiting.push({ urgent, began, go });
      else this.waiting.splice(after, 0, { urgent, began, go });
      this.release();
    });
  }

  /** No request starts before `at`, as when the host asks to wait. */
  holdUntil(at: number): void {
    if (at <= this.next) return;
    this.next = at;
    clearTimeout(this.timer);
    this.timer = undefined;
    this.release();
  }

  private release(): void {
    if (this.timer !== undefined || !this.waiting.length) return;
    const start = Math.max(this.next, this.now());
    const go = () => {
      this.timer = undefined;
      this.next = start + this.intervalMs;
      this.take()?.go();
      this.release();
    };
    if (start <= this.now()) go();
    else this.timer = setTimeout(go, start - this.now());
  }

  /** The first in line, but the idle sweep that began first when its turn is kept for it. */
  private take() {
    let oldest = -1;
    this.waiting.forEach((waiter, index) => {
      if (!waiter.urgent && (oldest < 0 || waiter.began < this.waiting[oldest].began)) oldest = index;
    });
    const index = oldest >= 0 && this.urgentTurns >= this.routineEvery - 1 ? oldest : 0;
    this.urgentTurns = oldest >= 0 && this.waiting[index]?.urgent ? this.urgentTurns + 1 : 0;
    return this.waiting.splice(index, 1)[0];
  }
}

/** How far a view is from where people look, in degrees of latitude: 0 for one that meets it. */
function offFocus(view: MapBounds, focus: MapBounds): number {
  const [lat] = boundsCenter(focus);
  const scale = Math.cos(lat * Math.PI / 180);
  const dLat = Math.max(focus.south - view.north, view.south - focus.north, 0);
  const dLng = Math.max(focus.west - view.east, view.west - focus.east, 0) * scale;
  return Math.hypot(dLat, dLng);
}

/** The views that meet where people look first, then the nearest; in their own order when nobody looks. */
export function nearestFirst<T>(views: readonly T[], boundsOf: (view: T) => MapBounds): T[] {
  const focus = currentCollection()?.focus();
  if (!focus) return [...views];
  return views.map((view, index) => ({ view, index, off: offFocus(boundsOf(view), focus) }))
    .sort((a, b) => a.off - b.off || a.index - b.index).map(({ view }) => view);
}

/** Takes from the queue the view nearest where people look now, which may have moved since the sweep began. */
export function takeNearest<T>(queue: T[], boundsOf: (view: T) => MapBounds): T | undefined {
  const focus = currentCollection()?.focus();
  if (!focus || queue.length < 2) return queue.shift();
  let best = 0, bestOff = Infinity;
  for (let i = 0; i < queue.length && bestOff > 0; i++) {
    const off = offFocus(boundsOf(queue[i]), focus);
    if (off < bestOff) { best = i; bestOff = off; }
  }
  return queue.splice(best, 1)[0];
}

/** How often a sweep reports what it has found: often enough for the map, which asks every few seconds. */
export const PROGRESS_EVERY_MS = 2_000;

/**
 * Reports a sweep's progress to the cache, at most every PROGRESS_EVERY_MS: the parts it has
 * finished, and the scooters it has found, which `found` lists as the feed will publish them.
 */
export class SweepProgress {
  private readonly swept: MapBounds[] = [];
  private reportedAt = 0;
  constructor(private readonly found: () => Vehicle[], private readonly now: () => number = Date.now) {}

  done(part: MapBounds): void {
    this.swept.push(part);
    const collection = currentCollection();
    if (!collection || this.now() - this.reportedAt < PROGRESS_EVERY_MS) return;
    this.reportedAt = this.now();
    collection.progress(this.found(), [...this.swept]);
  }
}
