// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from '@/lib/analytics';
import { REROUTE_INTERVAL_MS } from '@/lib/walkRoute';
import type { WalkFrom } from '@/lib/walkState';
import { useWalkRoute } from './useWalkRoute';

vi.mock('@/lib/analytics', () => ({ track: vi.fn() }));

type Point = [number, number];

const SCOOTER: Point = [47.376, 8.5417];
const MOVED: Point = [47.3763, 8.5417];
const here: WalkFrom = { point: [47.374, 8.5417], place: null, accuracyM: 10 };
const target = { key: 'vehicle:lime:abc', point: SCOOTER };

interface Call {
  body: { from: Point; to: Point };
  signal: AbortSignal;
  answer: (response: Response) => void;
}

let calls: Call[];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const found = ({ from, to }: Call['body']) => json({ path: [from, to], distanceM: 250 });

async function answer(call: Call, response = found(call.body)) {
  await act(async () => {
    call.answer(response);
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  calls = [];
  vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise<Response>(resolve => {
    calls.push({ body: JSON.parse(String(init.body)), signal: init.signal!, answer: resolve });
  })));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.mocked(track).mockClear();
});

describe('useWalkRoute', () => {
  it('shows the way found, and counts the first answer only', async () => {
    const { result } = renderHook(() => useWalkRoute(here));
    act(() => result.current.start(target));

    expect(result.current.view).toMatchObject({ phase: 'finding', line: [] });
    expect(calls.map(call => call.body)).toEqual([{ from: here.point, to: SCOOTER }]);

    await answer(calls[0]);
    expect(result.current.view).toMatchObject({ phase: 'shown', routeId: 1, line: [here.point, SCOOTER] });
    expect(track).toHaveBeenCalledWith('route_result', { result: 'success' });
  });

  it('follows a scooter that moved once a way may be asked for again, even standing still', async () => {
    const { result } = renderHook(() => useWalkRoute(here));
    act(() => result.current.start(target));
    await answer(calls[0]);

    act(() => result.current.setTarget(MOVED));
    expect(calls).toHaveLength(1);

    await act(() => vi.advanceTimersByTimeAsync(REROUTE_INTERVAL_MS));
    expect(calls).toHaveLength(2);
    expect(calls[1].body).toEqual({ from: here.point, to: MOVED });

    await answer(calls[1]);
    // The same route, drawn to where the scooter is now, without a new view of the map.
    expect(result.current.view).toMatchObject({ phase: 'shown', routeId: 1, line: [here.point, MOVED] });
    expect(vi.mocked(track).mock.calls.filter(([name]) => name === 'route_result')).toHaveLength(1);

    await act(() => vi.advanceTimersByTimeAsync(2 * REROUTE_INTERVAL_MS));
    expect(calls).toHaveLength(2);
  });

  it('says why no way was found', async () => {
    const { result } = renderHook(() => useWalkRoute(here));
    act(() => result.current.start(target));
    await answer(calls[0], json({ reason: 'busy' }, 503));

    expect(result.current.view).toMatchObject({ phase: 'failed', failure: 'unavailable' });
    expect(track).toHaveBeenCalledWith('route_result', { result: 'busy' });
  });

  it('drops the request once the walk is put away, and asks nothing more', async () => {
    const { result, unmount } = renderHook(() => useWalkRoute(here));
    act(() => result.current.start(target));
    act(() => result.current.end());

    expect(calls[0].signal.aborted).toBe(true);
    expect(result.current.view).toBeNull();

    act(() => result.current.start(target));
    unmount();
    expect(calls[1].signal.aborted).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(2 * REROUTE_INTERVAL_MS));
    expect(calls).toHaveLength(2);
    expect(track).not.toHaveBeenCalledWith('route_result', expect.anything());
  });
});
