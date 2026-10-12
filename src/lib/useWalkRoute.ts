'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { track } from '@/lib/analytics';
import { fetchWalkRoute, WalkRouteError } from '@/lib/walkRoute';
import {
  followDueAt,
  startWalk,
  walkReducer,
  walkView,
  type WalkEvent,
  type WalkFrom,
  type WalkState,
  type WalkTarget,
  type WalkView,
} from '@/lib/walkState';

/**
 * Owns the walk and the request for its way outside React, so that an answer
 * always meets the walk as it is now: one that comes for an earlier start,
 * or after the walk was put away, is dropped.
 */
function createWalkController() {
  let state: WalkState | null = null;
  let from: WalkFrom | null = null;
  let request: { id: number; controller: AbortController } | null = null;
  let followTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const set = (next: WalkState | null) => {
    if (next === state) return;
    const previous = state;
    state = next;
    if (next?.phase === 'arrived' && previous?.phase !== 'arrived') track('route_arrived');
    sync();
    follow();
    for (const listener of listeners) listener();
  };

  const apply = (event: WalkEvent) => {
    if (state) set(walkReducer(state, event));
  };

  // Finds the way again to a scooter that moved, once the walk may ask.
  const follow = () => {
    if (followTimer !== null) clearTimeout(followTimer);
    followTimer = null;
    const due = followDueAt(state);
    if (due === null) return;
    followTimer = setTimeout(() => {
      followTimer = null;
      const before = state;
      apply({ type: 'tick', now: Date.now() });
      // Woken a little early: nothing changed, so nothing set the next one.
      if (state === before) follow();
    }, Math.max(0, due - Date.now()));
  };

  // Asks for the way the walk wants, and cancels one it no longer does.
  const sync = () => {
    const wanted = state?.request ?? null;
    if (request && request.id !== wanted?.id) {
      request.controller.abort();
      request = null;
    }
    if (!wanted || request) return;
    const current = { id: wanted.id, controller: new AbortController() };
    request = current;
    fetchWalkRoute(wanted.from, wanted.to, current.controller.signal).then(
      found => {
        if (request !== current) return;
        request = null;
        // A way found again from where you are is not a new result.
        if (!wanted.again) track('route_result', { result: 'success' });
        apply({ type: 'routed', request: current.id, found });
      },
      (error: unknown) => {
        if (request !== current) return;
        request = null;
        const reason = error instanceof WalkRouteError ? error.reason : 'failed';
        if (!wanted.again) track('route_result', { result: reason });
        apply({ type: 'routeFailed', request: current.id, reason });
      }
    );
  };

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start(target: WalkTarget) {
      set(startWalk(target, from, Date.now()));
    },
    end() {
      set(null);
    },
    setFrom(next: WalkFrom | null) {
      from = next;
      apply({ type: 'origin', from: next, now: Date.now() });
    },
    setTarget(point: [number, number]) {
      const current = state?.target.point;
      if (current && current[0] === point[0] && current[1] === point[1]) return;
      apply({ type: 'target', point, now: Date.now() });
    },
    locationFailed() {
      apply({ type: 'locationFailed' });
    },
    gone() {
      apply({ type: 'gone' });
    },
  };
}

export interface WalkRoute {
  state: WalkState | null;
  view: WalkView | null;
  /** Directions: the way from the start there is, or from your location once it has come. */
  start: (target: WalkTarget) => void;
  /** Hide route, or the card closed: the walk is over and leaves nothing on the map. */
  end: () => void;
  /** Where the scooter is now, from fresh data. */
  setTarget: (point: [number, number]) => void;
  /** The location asked for by Directions could not be had. */
  locationFailed: () => void;
  /** The scooter is no longer in the data that covers where it was. */
  gone: () => void;
}

/**
 * The walk to the selected scooter or bay, and its way on the map. `from` is
 * where walking times start: the searched place, or your location as it moves.
 */
export function useWalkRoute(from: WalkFrom | null): WalkRoute {
  const [controller] = useState(createWalkController);
  const state = useSyncExternalStore(controller.subscribe, controller.getState, () => null);

  useEffect(() => {
    controller.setFrom(from);
  }, [controller, from]);

  // Nothing is asked for once the page is gone.
  useEffect(() => () => controller.end(), [controller]);

  const view = useMemo(() => walkView(state), [state]);
  return useMemo(() => ({
    state,
    view,
    start: controller.start,
    end: controller.end,
    setTarget: controller.setTarget,
    locationFailed: controller.locationFailed,
    gone: controller.gone,
  }), [controller, state, view]);
}
