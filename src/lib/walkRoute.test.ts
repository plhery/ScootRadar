import { afterEach, describe, expect, it, vi } from 'vitest';
import { haversineM } from '@/lib/geo';
import {
  WALK_ROUTE_MAX_M,
  WalkRouteError,
  fetchWalkRoute,
  locateOnPath,
  offRoute,
  pathUpTo,
  remainingM,
  walkPath,
  wayAhead,
  type WalkPosition,
} from '@/lib/walkRoute';

type Point = [number, number];

// Metres to degrees around Zürich, as haversineM measures them.
const METRES_PER_DEGREE = 111_195;
const north = (point: Point, m: number): Point => [point[0] + m / METRES_PER_DEGREE, point[1]];
const east = (point: Point, m: number): Point =>
  [point[0], point[1] + m / (METRES_PER_DEGREE * Math.cos((point[0] * Math.PI) / 180))];
const metres = (a: Point, b: Point) => haversineM(a[0], a[1], b[0], b[1]);

const A: Point = [47.3769, 8.5417];
const B = north(A, 200);
const C = east(B, 150);
// 200 m north, then 150 m east.
const corner = walkPath([B], A, C);

function expectPoint(actual: Point, expected: Point) {
  expect(actual[0]).toBeCloseTo(expected[0], 7);
  expect(actual[1]).toBeCloseTo(expected[1], 7);
}

describe('walkPath', () => {
  it('starts and ends on the way found when it is within two metres of both points', () => {
    const to = north(A, 300);
    const found = [north(A, 1), north(A, 150), north(to, -1.5)];

    expect(walkPath(found, A, to).points).toEqual([A, found[1], found[2]]);
  });

  it('draws the gap to a way that starts and ends beside the two points', () => {
    const to = north(A, 200);
    const found = [east(A, 15), east(north(A, 100), 15), east(to, 15)];

    const path = walkPath(found, A, to);

    expect(path.points).toEqual([A, ...found, to]);
    expect(path.lengthM).toBeCloseTo(230, 0);
  });

  it('measures how far along the way each point is, and its length', () => {
    const path = walkPath([B], A, C);

    expect(path.along).toHaveLength(3);
    expect(path.along[0]).toBe(0);
    expect(path.along[1]).toBeCloseTo(metres(A, B), 6);
    expect(path.along[2]).toBeCloseTo(metres(A, B) + metres(B, C), 6);
    expect(path.lengthM).toBe(path.along[2]);
  });

  it('is a single point of no length from a place to itself', () => {
    expect(walkPath([], A, A)).toEqual({ points: [A], along: [0], lengthM: 0 });
    expect(walkPath([north(A, 1)], A, east(A, 1))).toEqual({ points: [A], along: [0], lengthM: 0 });
  });
});

describe('locateOnPath', () => {
  it('finds the nearest point of the way, and how far along and off it that is', () => {
    const beside = locateOnPath(corner, east(north(A, 50), 10));
    expect(beside.segment).toBe(0);
    expect(beside.alongM).toBeCloseTo(50, 0);
    expect(beside.offM).toBeCloseTo(10, 0);
    expectPoint(beside.point, north(A, 50));

    const later = locateOnPath(corner, north(east(B, 100), 20));
    expect(later.segment).toBe(1);
    expect(later.alongM).toBeCloseTo(300, 0);
    expect(later.offM).toBeCloseTo(20, 0);
  });

  it('does not go back to a part of the way that ends more than 30 m behind the progress made', () => {
    // Up a street and back down the next one, 6 m to the east.
    const top = north(A, 200);
    const back = walkPath([top, east(top, 6)], A, east(A, 6));
    // Closer to the way up than to the way back.
    const location = east(north(A, 100), 2);

    expect(locateOnPath(back, location)).toMatchObject({ segment: 0 });
    expect(locateOnPath(back, location).alongM).toBeCloseTo(100, 0);
    // The way up ends 25 m behind: still in reach.
    expect(locateOnPath(back, location, back.along[1] + 25)).toMatchObject({ segment: 0 });

    const onTheWayBack = locateOnPath(back, location, back.along[1] + 35);
    expect(onTheWayBack.segment).toBe(2);
    expect(onTheWayBack.alongM).toBeCloseTo(back.along[2] + 100, 0);
    expect(onTheWayBack.offM).toBeCloseTo(4, 0);
  });

  it('stays at the end of the way once past it', () => {
    const beyond = locateOnPath(corner, east(C, 50));
    expect(beyond.segment).toBe(1);
    expect(beyond.alongM).toBeCloseTo(corner.lengthM, 6);
    expect(beyond.offM).toBeCloseTo(50, 0);
    expectPoint(beyond.point, C);

    // All of the way is behind: the end is the nearest point left, however far.
    const behind = locateOnPath(corner, A, corner.lengthM + 31);
    expect(behind.segment).toBe(1);
    expect(behind.alongM).toBeCloseTo(corner.lengthM, 6);
    expect(behind.offM).toBeCloseTo(metres(A, C), 0);
    expectPoint(behind.point, C);
  });

  it('measures from the only point of a way of one point', () => {
    const position = locateOnPath(walkPath([], A, A), east(A, 10));
    expect(position).toMatchObject({ alongM: 0, point: A, segment: 0 });
    expect(position.offM).toBeCloseTo(10, 0);
  });
});

describe('remainingM', () => {
  it('counts the way back to the path and the rest of it', () => {
    const position: WalkPosition = { alongM: 50, offM: 10, point: north(A, 50), segment: 0 };
    expect(remainingM(corner, position)).toBeCloseTo(10 + corner.lengthM - 50, 6);
  });

  it('counts only the way back once past the end', () => {
    const position: WalkPosition = { alongM: corner.lengthM + 5, offM: 12, point: C, segment: 1 };
    expect(remainingM(corner, position)).toBe(12);
  });
});

describe('wayAhead', () => {
  it('starts where you are on the way and leaves out what is behind', () => {
    const location = north(A, 50);
    const ahead = wayAhead(corner, locateOnPath(corner, location), location);
    expect(ahead).toEqual([location, B, C]);
  });

  it('leads back to the way from beside it', () => {
    const location = east(north(A, 50), 10);
    const position = locateOnPath(corner, location);
    expect(wayAhead(corner, position, location)).toEqual([location, position.point, B, C]);
  });

  it('leaves out a corner that is within two metres of where you rejoin the way', () => {
    const location = east(north(A, 199), -10);
    const position = locateOnPath(corner, location);
    expect(position.segment).toBe(0);
    expect(wayAhead(corner, position, location)).toEqual([location, position.point, C]);
  });
});

describe('pathUpTo', () => {
  it('draws the way up to a point between two of its corners', () => {
    const drawn = pathUpTo(corner, corner.along[1] + 75);
    expect(drawn).toHaveLength(3);
    expect(drawn.slice(0, 2)).toEqual([A, B]);
    const t = 75 / (corner.along[2] - corner.along[1]);
    expectPoint(drawn[2], [B[0] + (C[0] - B[0]) * t, B[1] + (C[1] - B[1]) * t]);

    const first = pathUpTo(corner, 100);
    expect(first).toHaveLength(2);
    expectPoint(first[1], north(A, 100));
  });

  it('draws the whole way from its length on', () => {
    expect(pathUpTo(corner, corner.lengthM)).toEqual(corner.points);
    expect(pathUpTo(corner, corner.lengthM + 50)).toEqual(corner.points);
  });

  it('draws nothing but the start at no length', () => {
    // Two copies of the start, rather than one: drawn, that is a single dot.
    const drawn = pathUpTo(corner, 0);
    expect(drawn.length).toBeGreaterThan(0);
    for (const point of drawn) expect(point).toEqual(A);
  });
});

describe('offRoute', () => {
  const at = (offM: number): WalkPosition => ({ alongM: 0, offM, point: A, segment: 0 });

  it('is off the way further than 40 m from it', () => {
    expect(offRoute(at(40), null)).toBe(false);
    expect(offRoute(at(40.5), null)).toBe(true);
    expect(offRoute(at(40.5), 10)).toBe(true);
  });

  it('allows half as much again as a rough location may be off', () => {
    expect(offRoute(at(44), 30)).toBe(false);
    expect(offRoute(at(46), 30)).toBe(true);
  });
});

describe('fetchWalkRoute', () => {
  const FROM: Point = [47.3779, 8.5403];
  const TO: Point = [47.3769, 8.5417];
  const answer = (body: unknown, status = 200) =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

  function stubFetch(response: () => Promise<Response>) {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return response();
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  const failure = (walk: Promise<unknown>) => walk.then(() => null, (error: unknown) => error);

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('asks this site for the way in the body of a request nothing caches', async () => {
    const fetchMock = stubFetch(async () => answer({ path: [FROM, TO], distanceM: 180 }));

    await expect(fetchWalkRoute(FROM, TO, new AbortController().signal)).resolves.toEqual({ path: [FROM, TO], distanceM: 180 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/walk');
    expect(init).toMatchObject({ method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' } });
    expect(JSON.parse(String(init?.body))).toEqual({ from: FROM, to: TO });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it.each([
    [422, { reason: 'no_route' }, 'no_route'],
    [422, { reason: 'too_far' }, 'too_far'],
    [429, '', 'busy'],
    [503, { error: 'Walking routes are busy.' }, 'busy'],
    [503, { reason: 'busy' }, 'busy'],
    [500, '', 'failed'],
    [502, { reason: 'failed' }, 'failed'],
    [400, { reason: 'invalid' }, 'failed'],
  ])('says why when the server answers %i with %j', async (status, body, reason) => {
    stubFetch(async () => answer(body, status));

    const error = await failure(fetchWalkRoute(FROM, TO, new AbortController().signal));

    expect(error).toBeInstanceOf(WalkRouteError);
    expect(error).toMatchObject({ reason });
  });

  it.each([
    ['text', 'Bad gateway'],
    ['nothing', null],
    ['a path that is not a list', { path: 'Zürich HB', distanceM: 180 }],
    ['a point without a longitude', { path: [[47.3779]], distanceM: 180 }],
    ['a point in text', { path: [[47.3779, '8.5403']], distanceM: 180 }],
    ['a point with a height', { path: [[47.3779, 8.5403, 408]], distanceM: 180 }],
    ['no distance', { path: [FROM, TO] }],
    ['a distance in text', { path: [FROM, TO], distanceM: '180' }],
  ])('fails on a success with %s in it', async (_label, body) => {
    stubFetch(async () => answer(body));

    const error = await failure(fetchWalkRoute(FROM, TO, new AbortController().signal));

    expect(error).toBeInstanceOf(WalkRouteError);
    expect(error).toMatchObject({ reason: 'failed' });
  });

  it('fails when the network does', async () => {
    stubFetch(async () => { throw new TypeError('Failed to fetch'); });

    const error = await failure(fetchWalkRoute(FROM, TO, new AbortController().signal));

    expect(error).toBeInstanceOf(WalkRouteError);
    expect(error).toMatchObject({ reason: 'failed' });
  });

  it('passes on a cancellation as it is', async () => {
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    }));
    const controller = new AbortController();

    const walk = failure(fetchWalkRoute(FROM, TO, controller.signal));
    controller.abort();
    const error = await walk;

    expect(error).not.toBeInstanceOf(WalkRouteError);
    expect(error).toBe(controller.signal.reason);
  });

  it('gives up as failed after twelve seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    }));

    const walk = failure(fetchWalkRoute(FROM, TO, new AbortController().signal));
    await vi.advanceTimersByTimeAsync(11_999);
    let settled = false;
    void walk.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const error = await walk;

    expect(error).toBeInstanceOf(WalkRouteError);
    expect(error).toMatchObject({ reason: 'failed' });
  });

  it('does not ask for a way further than a walk', async () => {
    const fetchMock = stubFetch(async () => answer({ path: [], distanceM: 0 }));
    const winterthur: Point = [47.4997, 8.7241];
    expect(metres(FROM, winterthur)).toBeGreaterThan(WALK_ROUTE_MAX_M);

    const error = await failure(fetchWalkRoute(FROM, winterthur, new AbortController().signal));

    expect(error).toBeInstanceOf(WalkRouteError);
    expect(error).toMatchObject({ reason: 'too_far' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
