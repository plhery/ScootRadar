import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { nearestFirst, PACE_WINDOW_MS, PaceGate, Pacer, PROGRESS_EVERY_MS, SweepProgress, takeNearest, withinCollection, type CollectionScope,
  type PaceOptions } from './sweeps';

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

  // Bird's (BIRD_PACE): ten a minute, 30 in five minutes and 120 an hour, of which an idle sweep may take 20 and 90.
  const MINUTE = 60_000;
  const spans: PaceOptions = { perMinute: 10, spans: [{ ms: 5 * MINUTE, requests: 30, idle: 20 }, { ms: 60 * MINUTE, requests: 120, idle: 90 }] };

  it('starts ten a minute at once for a town someone looks at, from its first minute, and 30 in five minutes', async () => {
    const pacer = new Pacer(30_000, Date.now, 0, Infinity, spans);
    const at: number[] = [];
    const looked = collection({ urgent: () => true });
    const turns = Array.from({ length: 42 }, () => withinCollection(looked, () => pacer.turn()).then(() => at.push((Date.now() - T0) / 1000)));
    await vi.advanceTimersByTimeAsync(6 * MINUTE);
    await Promise.all(turns);
    expect(at).toEqual([...Array(10).fill(0), ...Array(10).fill(60), ...Array(10).fill(120), ...Array(10).fill(300), 360, 360]);
  });

  it('leaves part of five minutes\' turns to the towns someone opens, while an idle sweep keeps its spacing', async () => {
    const pacer = new Pacer(30_000, Date.now, 0, Infinity, spans);
    const turns: string[] = [];
    const sweep = (name: string, count: number, scope: CollectionScope) => withinCollection(scope, async () => {
      for (let i = 1; i <= count; i++) {
        await pacer.turn();
        turns.push(`${name}${i} ${(Date.now() - T0) / 1000}`);
      }
    });
    const looked = collection({ urgent: () => true });
    const first = Promise.all(Array.from({ length: 20 }, () => withinCollection(looked, () => pacer.turn())));
    await vi.advanceTimersByTimeAsync(1_000);
    // Twenty have started in five minutes: the idle sweep waits, a town opened later does not.
    const idle = sweep('idle', 3, collection());
    await vi.advanceTimersByTimeAsync(119_000);
    const town = sweep('town', 12, looked);
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    await Promise.all([first, idle, town]);
    expect(turns).toEqual([...Array.from({ length: 10 }, (_, i) => `town${i + 1} 120`), 'town11 300', 'town12 300',
      'idle1 360', 'idle2 390', 'idle3 420']);
  });

  it('counts the hour\'s requests of the client it replaces, and gives them back', async () => {
    const pacer = new Pacer(30_000, Date.now, 0, Infinity, spans);
    // 115 requests from 55 minutes ago, twenty seconds apart, and one from the future that is not believed.
    const before = Array.from({ length: 115 }, (_, i) => T0 - 55 * MINUTE + i * 20_000);
    pacer.remember([...before, T0 + 1_000, Number.NaN]);
    expect(pacer.history()).toEqual(before);
    const at: number[] = [];
    const looked = collection({ urgent: () => true });
    const turns = Array.from({ length: 8 }, () => withinCollection(looked, () => pacer.turn()).then(() => at.push((Date.now() - T0) / 1000)));
    await vi.advanceTimersByTimeAsync(6 * MINUTE);
    await Promise.all(turns);
    // Five fit in the hour's 120; the others as its oldest are an hour old.
    expect(at).toEqual([0, 0, 0, 0, 0, 300, 320, 340]);
    // The four oldest are over an hour old at six minutes.
    expect(pacer.history()).toHaveLength(115 - 4 + 8);
  });

  it('tells when a turn someone is looking at would start without forgetting the longer spans\' requests', async () => {
    const pacer = new Pacer(30_000, Date.now, 0, Infinity, spans);
    const before = Array.from({ length: 10 }, (_, i) => T0 - 2 * MINUTE + i * 1_000);
    pacer.remember(before);
    expect(pacer.urgentStartAt()).toBe(T0);
    expect(pacer.history()).toEqual(before);
  });

  it('keeps an idle sweep\'s spacing after the last request the client it replaces made', async () => {
    const pacer = new Pacer(30_000, Date.now, 0, Infinity, spans);
    pacer.remember([T0 - 10_000]);
    const at: number[] = [];
    void pacer.turn().then(() => at.push(Date.now() - T0));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(at).toEqual([20_000]);
  });
});

describe('PaceGate', () => {
  const looking = collection({ urgent: () => true });
  const calls = (pacer: Pacer, count: number, into: number[], scope = looking) => withinCollection(scope, async () => {
    for (let i = 0; i < count; i++) { await pacer.turn(); into.push(Date.now() - T0); }
  });

  it('holds the pacers that share it to its count in any of its spans, whichever asks', async () => {
    const gate = new PaceGate(5, 10_000);
    const one = new Pacer(0, Date.now, 0, Infinity, { gate }), two = new Pacer(0, Date.now, 0, Infinity, { gate });
    const times: number[] = [];
    const first = calls(one, 4, times), second = calls(two, 4, times);
    await vi.advanceTimersByTimeAsync(0);
    expect(times).toEqual([0, 0, 0, 0, 0]);
    await vi.advanceTimersByTimeAsync(9_999);
    expect(times).toHaveLength(5);
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all([first, second]);
    expect(times).toEqual([0, 0, 0, 0, 0, 10_000, 10_000, 10_000]);
  });

  it('counts over any span, not from a mark: a start frees its place when it is a span old', async () => {
    const gate = new PaceGate(3, 10_000);
    const pacer = new Pacer(0, Date.now, 0, Infinity, { gate });
    const times: number[] = [];
    await calls(pacer, 2, times);
    await vi.advanceTimersByTimeAsync(6_000);
    const rest = calls(pacer, 4, times);
    await vi.advanceTimersByTimeAsync(20_000);
    await rest;
    // The third at once, the next two as the first two turn ten seconds old, the last as the third does.
    expect(times).toEqual([0, 0, 6_000, 10_000, 10_000, 16_000]);
    for (const [i, at] of times.entries()) expect(times.filter(other => other > at - 10_000 && other <= at).length, `start ${i}`).toBeLessThanOrEqual(3);
  });

  it('holds an idle sweep too, and a pacer keeps its own budget under it', async () => {
    const gate = new PaceGate(3, 10_000);
    // Twelve a minute, a looked-at collection's at once, an idle sweep's five seconds apart.
    const account = new Pacer(5_000, Date.now, 0, Infinity, { gate }), other = new Pacer(5_000, Date.now, 0, Infinity, { gate });
    await vi.advanceTimersByTimeAsync(PACE_WINDOW_MS);
    const looked: number[] = [], idle: number[] = [];
    const opened = calls(account, 14, looked), swept = calls(other, 2, idle, collection());
    await vi.advanceTimersByTimeAsync(2 * PACE_WINDOW_MS);
    await Promise.all([opened, swept]);
    const all = [...looked, ...idle].sort((a, b) => a - b);
    for (const at of all) expect(all.filter(start => start > at - 10_000 && start <= at).length).toBeLessThanOrEqual(3);
    // The account's twelve of its minute, three every ten seconds less the idle sweep's, then its thirteenth a minute after its first.
    expect(looked.slice(0, 12).every(at => at < 2 * PACE_WINDOW_MS)).toBe(true);
    expect(looked[12]).toBe(looked[0] + PACE_WINDOW_MS);
    expect(idle).toHaveLength(2);
  });

  it('is counted in when a looked-at request would start', () => {
    const gate = new PaceGate(2, 10_000);
    const pacer = new Pacer(0, Date.now, 0, Infinity, { gate });
    expect(pacer.urgentStartAt()).toBe(T0);
    gate.start(T0 - 4_000); gate.start(T0 - 1_000);
    expect(pacer.urgentStartAt()).toBe(T0 + 6_000);
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

  it('reports what it has found every two seconds at most, with every part done so far, those done meanwhile once they are over', async () => {
    const reports: [number, number][] = [];
    const found: Vehicle[] = [];
    const scooter = { provider: 'lime', lat: 45, lng: 4, battery: 80, range_m: null, vehicle_id: 'a', deep_link: null, distance_m: null };
    await withinCollection(collection({ progress: (vehicles, swept) => { reports.push([vehicles.length, swept.length]); } }), async () => {
      const progress = new SweepProgress(() => [...found]);
      found.push(scooter);
      progress.done(views[0]);
      progress.done(views[1]);
      vi.advanceTimersByTime(PROGRESS_EVERY_MS - 1);
      found.push({ ...scooter, vehicle_id: 'b' });
      progress.done(views[2]);
    });
    expect(reports).toEqual([[1, 1]]);
    // Two seconds after the first, without waiting for another part.
    vi.advanceTimersByTime(1);
    expect(reports).toEqual([[1, 1], [2, 3]]);
    vi.advanceTimersByTime(10 * PROGRESS_EVERY_MS);
    expect(reports).toHaveLength(2);
    // Outside a collection it reports to nobody.
    expect(() => new SweepProgress(() => found).done(views[0])).not.toThrow();
  });
});
