import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { nearestFirst, PACE_WINDOW_MS, Pacer, PROGRESS_EVERY_MS, SweepProgress, takeNearest, withinCollection, type CollectionScope } from './sweeps';

const T0 = Date.parse('2026-10-25T08:00:00Z');
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(T0); });
afterEach(() => { vi.useRealTimers(); });

const collection = (values: Partial<CollectionScope> = {}): CollectionScope => ({
  urgent: () => false, focus: () => undefined, progress: () => {}, ...values,
});
const square = (south: number, west: number, size = 0.01): MapBounds => ({ south, west, north: south + size, east: west + size });

describe('Pacer', () => {
  it('spaces the turns and gives one someone is looking at before an idle sweep\'s', async () => {
    const pacer = new Pacer(5_000);
    const turns: [string, number][] = [];
    const sweep = (name: string, count: number, scope: CollectionScope) => withinCollection(scope, async () => {
      for (let i = 1; i <= count; i++) {
        await pacer.turn();
        turns.push([`${name}${i}`, Date.now() - T0]);
      }
    });
    const idle = sweep('idle', 3, collection());
    await vi.advanceTimersByTimeAsync(1_000);
    const looked = sweep('looked', 2, collection({ urgent: () => true }));
    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.all([idle, looked]);
    expect(turns).toEqual([['idle1', 0], ['looked1', 5_000], ['looked2', 10_000], ['idle2', 15_000], ['idle3', 20_000]]);
  });

  it('keeps every third turn, while idle sweeps wait, for the one that began first', async () => {
    const pacer = new Pacer(1_000, Date.now, 0, 3);
    const turns: string[] = [];
    const sweep = (name: string, count: number, scope: CollectionScope) => withinCollection(scope, async () => {
      for (let i = 1; i <= count; i++) {
        await pacer.turn();
        turns.push(`${name}${i}`);
      }
    });
    const first = sweep('first', 3, collection());
    await vi.advanceTimersByTimeAsync(500);
    const second = sweep('second', 2, collection());
    await vi.advanceTimersByTimeAsync(1_000);
    const looked = sweep('looked', 8, collection({ urgent: () => true }));
    await vi.advanceTimersByTimeAsync(20_000);
    await Promise.all([first, second, looked]);
    // The first sweep's third view waits behind the second sweep's first, but its sweep began first.
    expect(turns).toEqual(['first1', 'first2', 'looked1', 'looked2', 'first3', 'looked3', 'looked4', 'second1', 'looked5', 'looked6',
      'second2', 'looked7', 'looked8']);
  });

  it('starts a minute\'s worth at once once its first minute is past, and the next when the first is a minute old', async () => {
    const pacer = new Pacer(5_000);
    const at: number[] = [];
    const looked = collection({ urgent: () => true });
    const take = () => withinCollection(looked, () => pacer.turn()).then(() => at.push(Date.now() - T0));
    // The first minute keeps one turn every five seconds, as a deploy runs the old cache beside it.
    const first = [take(), take(), take()];
    await vi.advanceTimersByTimeAsync(10_000);
    await Promise.all(first);
    expect(at).toEqual([0, 5_000, 10_000]);
    at.length = 0;
    await vi.advanceTimersByTimeAsync(PACE_WINDOW_MS);
    const burst = Array.from({ length: 13 }, take);
    await vi.advanceTimersByTimeAsync(0);
    expect(at).toEqual(Array(12).fill(70_000));
    await vi.advanceTimersByTimeAsync(PACE_WINDOW_MS - 1);
    expect(at).toHaveLength(12);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all(burst);
    expect(at.at(-1)).toBe(130_000);
  });

  it('keeps an idle sweep at its old spacing after a quiet spell, so a town opened meanwhile starts at once', async () => {
    // From 8 November 2026 an idle sweep could spend a Lime account's twelve turns in six seconds after a quiet spell,
    // and a town opened ten seconds later waited 50 for its first view.
    const pacer = new Pacer(5_000, Date.now, 0, 3);
    await vi.advanceTimersByTimeAsync(2 * PACE_WINDOW_MS);
    const turns: string[] = [];
    const sweep = (name: string, count: number, scope: CollectionScope) => withinCollection(scope, async () => {
      for (let i = 1; i <= count; i++) {
        await pacer.turn();
        turns.push(`${name}${i} ${(Date.now() - T0) / 1000}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });
    const idle = sweep('idle', 6, collection());
    await vi.advanceTimersByTimeAsync(11_000);
    const looked = sweep('looked', 4, collection({ urgent: () => true }));
    await vi.advanceTimersByTimeAsync(PACE_WINDOW_MS);
    await Promise.all([idle, looked]);
    // The town's views go at once, but its third waits for the turn kept for the idle sweep, at the sweep's spacing.
    expect(turns).toEqual(['idle1 120', 'idle2 125', 'idle3 130', 'looked1 131', 'looked2 131.5', 'idle4 135',
      'looked3 135', 'looked4 135.5', 'idle5 140', 'idle6 145']);
  });

  it('gives a turn someone is looking at first once the minute\'s turns are spent', async () => {
    const pacer = new Pacer(10_000);
    await vi.advanceTimersByTimeAsync(PACE_WINDOW_MS);
    const turns: string[] = [];
    const sweep = (name: string, count: number, scope: CollectionScope) => withinCollection(scope, async () => {
      for (let i = 1; i <= count; i++) {
        await pacer.turn();
        turns.push(`${name}${i} ${(Date.now() - T0) / 1000}`);
      }
    });
    const looked = collection({ urgent: () => true });
    const first = sweep('first', 6, looked);
    await vi.advanceTimersByTimeAsync(1_000);
    const idle = sweep('idle', 2, collection());
    const second = sweep('second', 2, looked);
    await vi.advanceTimersByTimeAsync(3 * PACE_WINDOW_MS);
    await Promise.all([first, idle, second]);
    // The six turns of 60 s come back together at 120 s: the looked-at town takes the first, the idle sweep the
    // next, and its second waits for its spacing.
    expect(turns).toEqual(['first1 60', 'first2 60', 'first3 60', 'first4 60', 'first5 60', 'first6 60',
      'second1 120', 'idle1 120', 'second2 120', 'idle2 130']);
  });

  it('tells when a turn someone is looking at would start: after those of its kind waiting, as the minute frees turns', async () => {
    const pacer = new Pacer(10_000);
    const looked = collection({ urgent: () => true });
    const take = () => withinCollection(looked, () => pacer.turn());
    await vi.advanceTimersByTimeAsync(PACE_WINDOW_MS);
    expect(pacer.urgentStartAt()).toBe(T0 + 60_000);
    await Promise.all([take(), take(), take()]);
    await vi.advanceTimersByTimeAsync(20_000);
    await Promise.all([take(), take(), take()]);
    // The minute's six turns are spent: the next comes back a minute after the first.
    expect(pacer.urgentStartAt()).toBe(T0 + 120_000);
    // An idle sweep waiting is not ahead of it; three turns someone is looking at are.
    void pacer.turn();
    expect(pacer.urgentStartAt()).toBe(T0 + 120_000);
    const waiting = [take(), take(), take()];
    expect(pacer.urgentStartAt()).toBe(T0 + 140_000);
    pacer.holdUntil(T0 + 200_000);
    expect(pacer.urgentStartAt()).toBe(T0 + 200_000);
    await vi.advanceTimersByTimeAsync(3 * PACE_WINDOW_MS);
    await Promise.all(waiting);
  });

  it('holds the next turn while the host asks to wait, and starts when told', async () => {
    const pacer = new Pacer(1_000, Date.now, T0 + 200);
    const at: number[] = [];
    const take = () => pacer.turn().then(() => at.push(Date.now() - T0));
    void take();
    await vi.advanceTimersByTimeAsync(200);
    pacer.holdUntil(T0 + 30_000);
    void take();
    await vi.advanceTimersByTimeAsync(40_000);
    expect(at).toEqual([200, 30_000]);
  });
});

describe('sweeps', () => {
  const views = [square(45.0, 4.0), square(45.9, 4.9), square(45.2, 4.2), square(45.3, 4.3)];

  it('starts where people look, then the nearest, and in its own order when nobody looks', async () => {
    expect(nearestFirst(views, view => view)).toEqual(views);
    const focus = square(45.3, 4.3, 0.005);
    const order = await withinCollection(collection({ focus: () => focus }), async () => nearestFirst(views, view => view));
    expect(order).toEqual([views[3], views[2], views[0], views[1]]);
  });

  it('follows where people look as they move during the sweep', async () => {
    let focus: MapBounds | undefined;
    const queue = [...views];
    const taken = await withinCollection(collection({ focus: () => focus }), async () => {
      const order = [takeNearest(queue, view => view)];
      focus = square(45.9, 4.9, 0.005);
      order.push(takeNearest(queue, view => view));
      focus = square(45.0, 4.0, 0.005);
      order.push(takeNearest(queue, view => view), takeNearest(queue, view => view), takeNearest(queue, view => view));
      return order;
    });
    expect(taken).toEqual([views[0], views[1], views[2], views[3], undefined]);
  });

  it('reports what it has found every two seconds at most, with every part done so far', async () => {
    const reports: [number, number][] = [];
    const found: Vehicle[] = [];
    const scooter = { provider: 'lime', lat: 45, lng: 4, battery: 80, range_m: null, vehicle_id: 'a', deep_link: null, distance_m: null };
    await withinCollection(collection({ progress: (vehicles, swept) => { reports.push([vehicles.length, swept.length]); } }), async () => {
      const progress = new SweepProgress(() => [...found]);
      found.push(scooter);
      progress.done(views[0]);
      progress.done(views[1]);
      vi.advanceTimersByTime(PROGRESS_EVERY_MS);
      found.push({ ...scooter, vehicle_id: 'b' });
      progress.done(views[2]);
    });
    expect(reports).toEqual([[1, 1], [2, 3]]);
    // Outside a collection it reports to nobody.
    expect(() => new SweepProgress(() => found).done(views[0])).not.toThrow();
  });
});
