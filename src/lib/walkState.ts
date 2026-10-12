import { haversineM } from '@/lib/geo';
import {
  ARRIVED_M,
  MAX_REROUTES,
  REROUTE_INTERVAL_MS,
  TARGET_MOVED_M,
  locateOnPath,
  offRoute,
  remainingM,
  walkPath,
  wayAhead,
  type FoundWalk,
  type WalkPath,
  type WalkPosition,
  type WalkRouteFailure,
} from '@/lib/walkRoute';

/**
 * A walk to a scooter or a parking bay, from the press on Directions to the
 * arrival. A pure reducer: the page feeds it where the walk starts from and
 * where the scooter is, a controller (useWalkRoute) asks for the ways it
 * wants and feeds back the answers.
 */

type Point = [number, number];

/** What is walked to, by the key of its card: "vehicle:lime:abc", "parking:dott-42". */
export interface WalkTarget {
  key: string;
  point: Point;
}

/** Where the walk starts: a searched place, which stays put, or your location, which moves with you. */
export interface WalkFrom {
  point: Point;
  /** The name of the searched place; null for your location. */
  place: string | null;
  /** How far off your location may be, in metres; none for a place. */
  accuracyM?: number | null;
}

/**
 * - locating: your location is on its way, the walk starts from it.
 * - finding: the way is asked for; nothing is drawn yet.
 * - shown: the way is on the map. A new one may be on its way, from where you are now.
 * - failed: no way, or no location to start from.
 * - arrived: you are at the scooter.
 * - gone: the scooter left the map while you walked to it.
 */
export type WalkPhase = 'locating' | 'finding' | 'shown' | 'failed' | 'arrived' | 'gone';

export interface WalkRequest {
  id: number;
  from: Point;
  to: Point;
  /** The start it is from, by originKey(). */
  origin: string;
  /** From where you are now, to replace the way on screen: shown without a new view of the map. */
  again: boolean;
}

export interface WalkRoute {
  path: WalkPath;
  origin: string;
  /** Where the scooter was when the way was asked for. */
  to: Point;
  /** New with each way from a new start, not with a way found again from where you are. */
  id: number;
}

/**
 * Why a walk failed: no location to start from, no way on foot, or none could
 * be had now, the routing service busy or out of reach.
 */
export type WalkFailure = 'location' | 'route' | 'unavailable';

export interface WalkState {
  target: WalkTarget;
  phase: WalkPhase;
  failure: WalkFailure | null;
  /** The latest start: where you are, or the searched place. */
  from: WalkFrom | null;
  route: WalkRoute | null;
  /** Where you are on the way; none from a searched place. */
  position: WalkPosition | null;
  request: WalkRequest | null;
  lastRequestAt: number;
  /** Ways asked for again on this walk because you left the way or the scooter moved. */
  reroutes: number;
  nextId: number;
}

export type WalkEvent =
  | { type: 'origin'; from: WalkFrom | null; now: number }
  | { type: 'target'; point: Point; now: number }
  | { type: 'locationFailed' }
  | { type: 'routed'; request: number; found: FoundWalk }
  | { type: 'routeFailed'; request: number; reason?: WalkRouteFailure }
  | { type: 'gone' }
  /** The time has come to follow a scooter that moved: see followDueAt. */
  | { type: 'tick'; now: number };

const distance = (a: Point, b: Point) => haversineM(a[0], a[1], b[0], b[1]);

/** A searched place is a start of its own; your location is one start, wherever it moves. */
export function originKey(from: WalkFrom): string {
  return from.place === null ? 'here' : `${from.place}@${from.point[0]},${from.point[1]}`;
}

function ask(state: WalkState, from: WalkFrom, now: number, again: boolean): WalkState {
  const id = state.nextId;
  const request: WalkRequest = { id, from: from.point, to: state.target.point, origin: originKey(from), again };
  return again
    ? { ...state, request, lastRequestAt: now, reroutes: state.reroutes + 1, nextId: id + 1 }
    : {
        ...state,
        phase: 'finding',
        failure: null,
        route: null,
        position: null,
        request,
        lastRequestAt: now,
        reroutes: 0,
        nextId: id + 1,
      };
}

function arrive(state: WalkState): WalkState {
  return { ...state, phase: 'arrived', failure: null, route: null, position: null, request: null };
}

/** From a start: there already, or a way to ask for. */
function begin(state: WalkState, from: WalkFrom, now: number): WalkState {
  const next = { ...state, from };
  if (from.place === null && distance(from.point, state.target.point) <= ARRIVED_M) return arrive(next);
  return ask(next, from, now, false);
}

const mayAskAgain = (state: WalkState, now: number) =>
  state.request === null && state.reroutes < MAX_REROUTES && now - state.lastRequestAt >= REROUTE_INTERVAL_MS;

/** Moved by someone since its way was asked for: the way leads to where it was. */
function targetMoved(state: WalkState): boolean {
  const walkedTo = state.request?.to ?? state.route?.to;
  return walkedTo !== undefined && distance(walkedTo, state.target.point) > TARGET_MOVED_M;
}

/**
 * When the way on screen can be found again to where the scooter moved, if it
 * leads to where it was and nothing else will ask: from a searched place, or
 * standing still, nothing comes to the walk but time.
 */
export function followDueAt(state: WalkState | null): number | null {
  if (state?.phase !== 'shown' || !state.from || state.request || state.reroutes >= MAX_REROUTES) return null;
  return targetMoved(state) ? state.lastRequestAt + REROUTE_INTERVAL_MS : null;
}

/** The walk as Directions starts it: from the start there is, or once your location has come. */
export function startWalk(target: WalkTarget, from: WalkFrom | null, now: number): WalkState {
  const state: WalkState = {
    target,
    phase: 'locating',
    failure: null,
    from: null,
    route: null,
    position: null,
    request: null,
    lastRequestAt: -Infinity,
    reroutes: 0,
    nextId: 1,
  };
  return from ? begin(state, from, now) : state;
}

/** The next state of a walk; null when the walk is over without anything to say, its start gone. */
export function walkReducer(state: WalkState, event: WalkEvent): WalkState | null {
  // What has been said stays, until the walk is started again or put away.
  const over = state.phase === 'failed' || state.phase === 'arrived' || state.phase === 'gone';

  switch (event.type) {
    case 'origin': {
      const { from, now } = event;
      if (over) return state;
      if (!from) return state.phase === 'locating' ? state : null;
      if (state.phase === 'locating') return begin(state, from, now);
      // Another start, or your location in place of a cleared place: a new way, shown whole.
      if (originKey(from) !== (state.request?.origin ?? state.route?.origin)) return begin(state, from, now);
      // A searched place does not move.
      if (from.place !== null) return state.from === from ? state : { ...state, from };
      if (distance(from.point, state.target.point) <= ARRIVED_M) return arrive({ ...state, from });
      if (!state.route) return { ...state, from };
      const position = locateOnPath(state.route.path, from.point, state.position?.alongM ?? 0);
      const next = { ...state, from, position };
      const stale = offRoute(position, from.accuracyM ?? null) || targetMoved(next);
      return stale && mayAskAgain(state, now) ? ask(next, from, now, true) : next;
    }
    case 'target': {
      const { point, now } = event;
      const next = { ...state, target: { ...state.target, point } };
      if (over || !state.from) return next;
      if (state.from.place === null && distance(state.from.point, point) <= ARRIVED_M) return arrive(next);
      if (!targetMoved(next)) return next;
      // Nothing shown yet: the way to where it is now, in place of the one being found.
      if (!state.route) return ask(next, state.from, now, false);
      // Otherwise once a way may be asked for again; followDueAt says when.
      return mayAskAgain(state, now) ? ask(next, state.from, now, true) : next;
    }
    case 'locationFailed':
      return state.phase === 'locating' ? { ...state, phase: 'failed', failure: 'location' } : state;
    case 'routed': {
      const { request } = state;
      if (!request || request.id !== event.request) return state;
      const path = walkPath(event.found.path, request.from, request.to);
      const route: WalkRoute = {
        path,
        origin: request.origin,
        to: request.to,
        id: request.again && state.route ? state.route.id : request.id,
      };
      // You may have walked on while the way was found.
      const here = state.from?.place === null ? state.from.point : null;
      return {
        ...state,
        phase: 'shown',
        failure: null,
        route,
        position: here ? locateOnPath(path, here) : null,
        request: null,
      };
    }
    case 'routeFailed': {
      const { request } = state;
      if (!request || request.id !== event.request) return state;
      // Found again or not, the way on screen still leads there.
      if (request.again && state.route) return { ...state, request: null };
      const failure = event.reason === 'busy' || event.reason === 'failed' ? 'unavailable' : 'route';
      return { ...state, phase: 'failed', failure, route: null, position: null, request: null };
    }
    case 'gone':
      // Gone once you are there: most likely you took it.
      if (state.phase === 'gone' || state.phase === 'arrived') return state;
      return { ...state, phase: 'gone', failure: null, route: null, position: null, request: null };
    case 'tick':
      return state.from && followDueAt(state) !== null && mayAskAgain(state, event.now)
        ? ask(state, state.from, event.now, true)
        : state;
  }
}

/** What the map and the card show of a walk. */
export interface WalkView {
  phase: WalkPhase;
  failure: WalkFailure | null;
  /** The line to draw, from where you are or from the place; empty while there is none. */
  line: Point[];
  /** Changes with each way from a new start: the map shows it whole, and draws it from its start. */
  routeId: number | null;
  /** What is left to walk, along the way; null without one. */
  remainingM: number | null;
}

export function walkView(state: WalkState | null): WalkView | null {
  if (!state) return null;
  const { route, position, from } = state;
  const shown = state.phase === 'shown' && route !== null;
  return {
    phase: state.phase,
    failure: state.failure,
    line: !shown ? [] : position && from ? wayAhead(route.path, position, from.point) : route.path.points,
    routeId: shown ? route.id : null,
    remainingM: !shown ? null : position ? remainingM(route.path, position) : route.path.lengthM,
  };
}
