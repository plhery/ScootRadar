import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { nearestFirst, Pacer, PROGRESS_EVERY_MS, SweepProgress, takeNearest, withinCollection, type CollectionScope } from './sweeps';

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
