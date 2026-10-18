// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useZoneData } from '@/lib/useZoneData';
import type { MapZone } from '@/lib/zones';

const view = { bounds: { south: 47.3612, west: 8.5321, north: 47.3788, east: 8.5507 }, zoom: 16 };
const zone: MapZone = { id: 'f:0', provider: 'dott', kind: 'noRide', polygons: [] };
const answer = (pending: boolean) => Response.json({ zones: [zone], meta: { generatedAt: '', pending, truncated: false } });

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('asks for nothing while off or zoomed out, and says why', () => {
  const fetcher = vi.spyOn(globalThis, 'fetch');
  const { result, rerender } = renderHook(({ query, enabled }) => useZoneData(query, enabled),
    { initialProps: { query: view, enabled: false } });
  expect(result.current.state).toBe('off');
  rerender({ query: { ...view, zoom: 13 }, enabled: true });
  expect(result.current.state).toBe('zoomIn');
  vi.advanceTimersByTime(1000);
  expect(fetcher).not.toHaveBeenCalled();
});

it('asks for the area rounded out to its grid, and again while the answer is pending', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer(true)).mockResolvedValue(answer(false));
  const { result } = renderHook(() => useZoneData(view, true));
  expect(result.current.state).toBe('loading');
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(String(fetcher.mock.calls[0][0])).toBe('/api/zones?south=47.36&west=8.52&north=47.38&east=8.56&zoom=14');
  expect(result.current).toEqual({ zones: [zone], state: 'shown' });
  await act(() => vi.advanceTimersByTimeAsync(3000));
  expect(fetcher).toHaveBeenCalledTimes(2);
  await act(() => vi.advanceTimersByTimeAsync(10_000));
  expect(fetcher).toHaveBeenCalledTimes(2);
});

it('says the zones are unavailable when the answer fails', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'busy' }, { status: 503 }));
  const { result } = renderHook(() => useZoneData(view, true));
  await act(() => vi.advanceTimersByTimeAsync(250));
  expect(result.current).toEqual({ zones: [], state: 'failed' });
});
