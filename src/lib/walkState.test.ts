import { describe, expect, it } from 'vitest';
import { haversineM } from '@/lib/geo';
import { MAX_REROUTES, REROUTE_INTERVAL_MS, locateOnPath, walkPath, type FoundWalk } from '@/lib/walkRoute';
import {
  followDueAt,
  startWalk,
  walkReducer,
  walkView,
  type WalkFrom,
  type WalkState,
  type WalkTarget,
} from '@/lib/walkState';

type Point = [number, number];

const METRES_PER_DEGREE = 111_195;
const north = (point: Point, m: number): Point => [point[0] + m / METRES_PER_DEGREE, point[1]];
const east = (point: Point, m: number): Point =>
  [point[0], point[1] + m / (METRES_PER_DEGREE * Math.cos((point[0] * Math.PI) / 180))];

// A scooter on Bahnhofstrasse, and where you are, 220 m south of it.
const SCOOTER: Point = [47.376, 8.5417];
const START: Point = [47.374, 8.5417];
const target: WalkTarget = { key: 'vehicle:lime:abc', point: SCOOTER };
const HB: WalkFrom = { point: [47.3779, 8.5403], place: 'Zürich HB' };
const here = (point: Point, accuracyM: number | null = 10): WalkFrom => ({ point, place: null, accuracyM });

/** The way Valhalla would find: straight there, by a point halfway. */
function way(from: Point, to: Point): FoundWalk {
  return {
    path: [from, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], to],
    distanceM: Math.round(haversineM(from[0], from[1], to[0], to[1])),
  };
}

function step(state: WalkState, ...events: Parameters<typeof walkReducer>[1][]): WalkState {
  let next: WalkState | null = state;
  for (const event of events) {
    next = walkReducer(next!, event);
    expect(next).not.toBeNull();
  }
  return next!;
}

/** Answers the request the walk is waiting for. */
function answered(state: WalkState): WalkState {
  const { request } = state;
  expect(request).not.toBeNull();
  return step(state, { type: 'routed', request: request!.id, found: way(request!.from, request!.to) });
}

/** The way on the map, from where you are, asked for at 0. */
const shownFromHere = () => answered(startWalk(target, here(START), 0));
const off = east(north(START, 100), 60);

describe('startWalk', () => {
  it('waits for your location when there is no start yet', () => {
    expect(startWalk(target, null, 0)).toMatchObject({
      target,
      phase: 'locating',
      failure: null,
      from: null,
      route: null,
      request: null,
    });
  });

  it('asks for the way from a searched place at once', () => {
    expect(startWalk(target, HB, 1_000)).toMatchObject({
      phase: 'finding',
      from: HB,
      request: { id: 1, from: HB.point, to: SCOOTER, origin: 'Zürich HB@47.3779,8.5403', again: false },
      lastRequestAt: 1_000,
    });
  });

  it('starts from your location once it comes', () => {
    const located = step(startWalk(target, null, 0), { type: 'origin', from: here(START), now: 2_000 });
    expect(located).toMatchObject({
      phase: 'finding',
      request: { id: 1, from: START, to: SCOOTER, origin: 'here', again: false },
      lastRequestAt: 2_000,
    });
  });

  it('is there already when your location is by the scooter, but not a searched place', () => {
    const close = north(SCOOTER, -15);
    expect(startWalk(target, here(close), 0)).toMatchObject({ phase: 'arrived', request: null, route: null });
    expect(startWalk(target, { point: close, place: 'Bahnhofstrasse 70' }, 0)).toMatchObject({ phase: 'finding' });
  });
});

describe('walkReducer', () => {
  it('shows the way that was asked for, and where you are on it', () => {
    const asked = startWalk(target, here(START), 0);
    const found = way(START, SCOOTER);
    const shown = step(asked, { type: 'routed', request: 1, found });
    const path = walkPath(found.path, START, SCOOTER);

    expect(shown).toMatchObject({ phase: 'shown', failure: null, request: null });
    expect(shown.route).toEqual({ path, origin: 'here', to: SCOOTER, id: 1 });
    expect(shown.position).toEqual(locateOnPath(path, START));
    // From a searched place there is no position to keep.
    expect(answered(startWalk(target, HB, 0)).position).toBeNull();
  });

  it('places you where you have walked to while the way was found', () => {
    const walked = north(START, 50);
    const shown = answered(step(startWalk(target, here(START), 0), { type: 'origin', from: here(walked), now: 3_000 }));
    expect(shown.position?.alongM).toBeCloseTo(50, 0);
  });

  it('drops an answer to a request it no longer waits for', () => {
    const asked = startWalk(target, here(START), 0);
    expect(walkReducer(asked, { type: 'routed', request: 7, found: way(START, SCOOTER) })).toBe(asked);
    expect(walkReducer(asked, { type: 'routeFailed', request: 7 })).toBe(asked);
  });

  it('fails when the first way cannot be found', () => {
    const failed = step(startWalk(target, HB, 0), { type: 'routeFailed', request: 1 });
    expect(failed).toMatchObject({ phase: 'failed', failure: 'route', route: null, position: null, request: null });
  });

  it.each([
    ['no_route', 'route'],
    ['too_far', 'route'],
    ['busy', 'unavailable'],
    ['failed', 'unavailable'],
  ] as const)('fails a first way refused as %s with the failure %s', (reason, failure) => {
    const failed = step(startWalk(target, HB, 0), { type: 'routeFailed', request: 1, reason });
    expect(failed).toMatchObject({ phase: 'failed', failure, route: null, request: null });
    expect(walkView(failed)).toMatchObject({ phase: 'failed', failure, line: [] });
  });

  it('follows you along the way', () => {
    const shown = shownFromHere();
    const walked = north(START, 100);

    const following = step(shown, { type: 'origin', from: here(walked), now: 5_000 });
    const view = walkView(following)!;

    expect(following.request).toBeNull();
    expect(following.position?.alongM).toBeCloseTo(100, 0);
    expect(view.line[0]).toEqual(walked);
    expect(view.line.at(-1)).toEqual(SCOOTER);
    expect(view.remainingM).toBeCloseTo(walkView(shown)!.remainingM! - 100, 0);
  });

  it('asks for the way again from where you are when you leave it, at most every fifteen seconds', () => {
    const shown = shownFromHere();

    const tooSoon = step(shown, { type: 'origin', from: here(off), now: REROUTE_INTERVAL_MS - 1 });
    expect(tooSoon.request).toBeNull();
    expect(tooSoon.position?.offM).toBeCloseTo(60, 0);

    const again = step(tooSoon, { type: 'origin', from: here(off), now: REROUTE_INTERVAL_MS });
    expect(again).toMatchObject({
      phase: 'shown',
      route: shown.route,
      request: { id: 2, from: off, to: SCOOTER, origin: 'here', again: true },
      lastRequestAt: REROUTE_INTERVAL_MS,
      reroutes: 1,
    });

    // One at a time, and fifteen seconds after the last.
    const waiting = step(again, { type: 'origin', from: here(east(off, 20)), now: 3 * REROUTE_INTERVAL_MS });
    expect(waiting.request?.id).toBe(2);
    const failedAgain = step(waiting, { type: 'routeFailed', request: 2 });
    expect(step(failedAgain, { type: 'origin', from: here(off), now: 2 * REROUTE_INTERVAL_MS - 1 }).request).toBeNull();
  });

  it('trusts a rough location less before deciding you left the way', () => {
    const shown = shownFromHere();
    expect(step(shown, { type: 'origin', from: here(off, 50), now: REROUTE_INTERVAL_MS }).request).toBeNull();
    expect(step(shown, { type: 'origin', from: here(off, null), now: REROUTE_INTERVAL_MS }).request).not.toBeNull();
  });

  it('keeps the way on screen when one found again cannot be had', () => {
    const shown = shownFromHere();
    const again = step(shown, { type: 'origin', from: here(off), now: REROUTE_INTERVAL_MS });

    const kept = step(again, { type: 'routeFailed', request: again.request!.id });

    expect(kept).toMatchObject({ phase: 'shown', failure: null, request: null });
    expect(kept.route).toBe(shown.route);
    for (const reason of ['busy', 'failed', 'no_route'] as const) {
      const keptAnyway = step(again, { type: 'routeFailed', request: again.request!.id, reason });
      expect(keptAnyway).toMatchObject({ phase: 'shown', failure: null, request: null });
      expect(keptAnyway.route).toBe(shown.route);
    }
  });

  it('asks for the way again no more than ten times on one walk', () => {
    let state = shownFromHere();
    for (let i = 1; i <= MAX_REROUTES; i++) {
      state = step(state, { type: 'origin', from: here(off), now: i * REROUTE_INTERVAL_MS });
      expect(state.request).toMatchObject({ again: true });
      state = step(state, { type: 'routeFailed', request: state.request!.id });
    }

    const tired = step(state, { type: 'origin', from: here(off), now: (MAX_REROUTES + 1) * REROUTE_INTERVAL_MS });
    expect(tired.request).toBeNull();
    expect(tired.reroutes).toBe(MAX_REROUTES);
  });

  it('keeps the view for a way found again, and frames a new one from another start', () => {
    const shown = shownFromHere();
    const again = step(shown, { type: 'origin', from: here(off), now: REROUTE_INTERVAL_MS });

    const rerouted = answered(again);
    expect(rerouted.route).toMatchObject({ id: shown.route!.id, origin: 'here' });
    expect(rerouted.route!.path.points[0]).toEqual(off);
    expect(rerouted.position?.alongM).toBeCloseTo(0, 6);
    expect(walkView(rerouted)!.routeId).toBe(1);

    // A searched place in place of your location.
    const fromHB = step(rerouted, { type: 'origin', from: HB, now: REROUTE_INTERVAL_MS + 1_000 });
    expect(fromHB).toMatchObject({
      phase: 'finding',
      route: null,
      reroutes: 0,
      request: { id: 3, from: HB.point, origin: 'Zürich HB@47.3779,8.5403', again: false },
    });
    expect(walkView(answered(fromHB))!.routeId).toBe(3);

    // And back to your location.
    const backHere = step(answered(fromHB), { type: 'origin', from: here(START), now: REROUTE_INTERVAL_MS + 2_000 });
    expect(backHere).toMatchObject({ phase: 'finding', request: { id: 4, origin: 'here', again: false } });
    expect(walkView(answered(backHere))!.routeId).toBe(4);
  });

  it('keeps to a searched place that does not move', () => {
    const shown = answered(startWalk(target, HB, 0));
    expect(walkReducer(shown, { type: 'origin', from: HB, now: REROUTE_INTERVAL_MS })).toBe(shown);
  });

  it('asks for the way to where the scooter is now when it moved', () => {
    const shown = shownFromHere();
    const moved = north(SCOOTER, 30);

    const again = step(shown, { type: 'target', point: moved, now: REROUTE_INTERVAL_MS });
    expect(again.target.point).toEqual(moved);
    expect(again.request).toMatchObject({ from: START, to: moved, again: true });

    // Not for a few metres, nor sooner than fifteen seconds after the last request.
    const nudged = step(shown, { type: 'target', point: north(SCOOTER, 20), now: REROUTE_INTERVAL_MS });
    expect(nudged.target.point).toEqual(north(SCOOTER, 20));
    expect(nudged.request).toBeNull();
    expect(step(shown, { type: 'target', point: moved, now: REROUTE_INTERVAL_MS - 1 }).request).toBeNull();
  });

  it('is there when the scooter is brought to you', () => {
    const shown = shownFromHere();
    expect(step(shown, { type: 'target', point: north(START, 10), now: 1_000 })).toMatchObject({ phase: 'arrived', route: null });
  });

  it('asks again at once for a scooter that moved before any way was shown', () => {
    const moved = north(SCOOTER, 30);
    const asked = step(startWalk(target, here(START), 0), { type: 'target', point: moved, now: 2_000 });
    expect(asked).toMatchObject({ phase: 'finding', request: { id: 2, to: moved, again: false } });
    // The answer to the first request is dropped.
    expect(walkReducer(asked, { type: 'routed', request: 1, found: way(START, SCOOTER) })).toBe(asked);
    expect(answered(asked).route!.to).toEqual(moved);
  });

  it('follows a scooter that moved too soon after the last request, once it may ask', () => {
    const moved = north(SCOOTER, 30);
    const shown = step(shownFromHere(), { type: 'target', point: moved, now: 5_000 });
    expect(shown.request).toBeNull();
    expect(followDueAt(shown)).toBe(REROUTE_INTERVAL_MS);

    // Walking on, by the next location after then.
    const walked = step(shown, { type: 'origin', from: here(north(START, 5)), now: 2 * REROUTE_INTERVAL_MS });
    expect(walked.request).toMatchObject({ to: moved, again: true });

    // Standing still, or from a searched place, by the tick the controller sets.
    expect(walkReducer(shown, { type: 'tick', now: REROUTE_INTERVAL_MS - 1 })).toBe(shown);
    const ticked = step(shown, { type: 'tick', now: REROUTE_INTERVAL_MS });
    expect(ticked.request).toMatchObject({ to: moved, again: true });
    expect(followDueAt(ticked)).toBeNull();
    expect(answered(ticked).route!.to).toEqual(moved);
    expect(followDueAt(answered(ticked))).toBeNull();

    const fromHB = step(answered(startWalk(target, HB, 0)), { type: 'target', point: moved, now: 5_000 });
    expect(followDueAt(fromHB)).toBe(REROUTE_INTERVAL_MS);
    expect(step(fromHB, { type: 'tick', now: REROUTE_INTERVAL_MS }).request).toMatchObject({ from: HB.point, to: moved });
  });

  it('has nothing to follow while a way is on its way, the scooter in place, or the walk over', () => {
    expect(followDueAt(null)).toBeNull();
    expect(followDueAt(shownFromHere())).toBeNull();
    expect(followDueAt(startWalk(target, here(START), 0))).toBeNull();
    const gone = step(shownFromHere(), { type: 'gone' }, { type: 'target', point: north(SCOOTER, 30), now: 5_000 });
    expect(followDueAt(gone)).toBeNull();
    expect(walkReducer(gone, { type: 'tick', now: REROUTE_INTERVAL_MS })).toBe(gone);
  });

  it('fails for want of a location only while waiting for it', () => {
    expect(step(startWalk(target, null, 0), { type: 'locationFailed' })).toMatchObject({ phase: 'failed', failure: 'location' });
    const asked = startWalk(target, HB, 0);
    expect(walkReducer(asked, { type: 'locationFailed' })).toBe(asked);
  });

  it('says the scooter is gone, unless you got there', () => {
    expect(step(shownFromHere(), { type: 'gone' })).toMatchObject({
      phase: 'gone',
      failure: null,
      route: null,
      position: null,
      request: null,
    });
    expect(step(startWalk(target, null, 0), { type: 'gone' }).phase).toBe('gone');
    expect(step(startWalk(target, HB, 0), { type: 'routeFailed', request: 1 }, { type: 'gone' }).phase).toBe('gone');

    const arrived = startWalk(target, here(SCOOTER), 0);
    expect(walkReducer(arrived, { type: 'gone' })).toBe(arrived);
  });

  it('pays no attention to where you are once the walk has failed, arrived or gone', () => {
    const over = [
      step(startWalk(target, HB, 0), { type: 'routeFailed', request: 1 }),
      startWalk(target, here(SCOOTER), 0),
      step(shownFromHere(), { type: 'gone' }),
    ];
    for (const state of over) {
      expect(walkReducer(state, { type: 'origin', from: here(off), now: REROUTE_INTERVAL_MS })).toBe(state);
      expect(walkReducer(state, { type: 'origin', from: HB, now: REROUTE_INTERVAL_MS })).toBe(state);
      expect(walkReducer(state, { type: 'origin', from: null, now: REROUTE_INTERVAL_MS })).toBe(state);
    }
  });

  it('ends without a word when its start goes away', () => {
    expect(walkReducer(shownFromHere(), { type: 'origin', from: null, now: 1_000 })).toBeNull();
    expect(walkReducer(startWalk(target, HB, 0), { type: 'origin', from: null, now: 1_000 })).toBeNull();
    const locating = startWalk(target, null, 0);
    expect(walkReducer(locating, { type: 'origin', from: null, now: 1_000 })).toBe(locating);
  });
});

describe('walkView', () => {
  it('has nothing to show without a walk', () => {
    expect(walkView(null)).toBeNull();
  });

  it('draws no line until the way is shown', () => {
    const nothing = { line: [], routeId: null, remainingM: null };
    expect(walkView(startWalk(target, null, 0))).toEqual({ phase: 'locating', failure: null, ...nothing });
    expect(walkView(startWalk(target, HB, 0))).toEqual({ phase: 'finding', failure: null, ...nothing });
    expect(walkView(step(startWalk(target, null, 0), { type: 'locationFailed' })))
      .toEqual({ phase: 'failed', failure: 'location', ...nothing });
    expect(walkView(step(startWalk(target, HB, 0), { type: 'routeFailed', request: 1 })))
      .toEqual({ phase: 'failed', failure: 'route', ...nothing });
    expect(walkView(startWalk(target, here(SCOOTER), 0))).toEqual({ phase: 'arrived', failure: null, ...nothing });
    expect(walkView(step(shownFromHere(), { type: 'gone' }))).toEqual({ phase: 'gone', failure: null, ...nothing });
  });

  it('draws the whole way from a searched place', () => {
    const shown = answered(startWalk(target, HB, 0));
    expect(walkView(shown)).toEqual({
      phase: 'shown',
      failure: null,
      line: shown.route!.path.points,
      routeId: 1,
      remainingM: shown.route!.path.lengthM,
    });
  });

  it('draws the way ahead from where you are', () => {
    const walked = east(north(START, 50), 10);
    const following = step(shownFromHere(), { type: 'origin', from: here(walked), now: 5_000 });
    const view = walkView(following)!;

    expect(view.phase).toBe('shown');
    expect(view.routeId).toBe(1);
    expect(view.line).toEqual([walked, following.position!.point, ...following.route!.path.points.slice(1)]);
    expect(view.remainingM).toBeCloseTo(10 + following.route!.path.lengthM - 50, 0);
  });
});
