// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { MapBounds } from '@/lib/types';

const BERGEN = { bounds: { south: 60.388, west: 5.305, north: 60.405, east: 5.345 }, zoom: 14 };
const PORTO = { bounds: { south: 41.14, west: -8.62, north: 41.155, east: -8.6 }, zoom: 16 };
const ZURICH = { bounds: { south: 47.36, west: 8.53, north: 47.38, east: 8.55 }, zoom: 16 };

type View = { bounds: MapBounds; zoom: number } | null;

/** The hook as the page first has it, no city loaded. */
async function fresh() {
  vi.resetModules();
  const [{ useCityZones }, { CITY_ZONE_FILES }] = await Promise.all([import('@/lib/useCityZones'), import('@/lib/cityZones')]);
  return { useCityZones, bergen: vi.spyOn(CITY_ZONE_FILES, 'bergen'), porto: vi.spyOn(CITY_ZONE_FILES, 'porto') };
}

it('loads nothing further out than zoom 14 or away from the cities, and gives the same empty list', async () => {
  const { useCityZones, bergen, porto } = await fresh();
  const { result, rerender } = renderHook(({ view }: { view: View }) => useCityZones(view), { initialProps: { view: null as View } });
  const empty = result.current;
  expect(empty).toEqual([]);
  rerender({ view: { ...BERGEN, zoom: 13 } });
  rerender({ view: ZURICH });
  expect(result.current).toBe(empty);
  expect(bergen).not.toHaveBeenCalled();
  expect(porto).not.toHaveBeenCalled();
});

it('loads a city\'s zones once a view from zoom 14 reaches it, once, and keeps them', async () => {
  const { useCityZones, bergen, porto } = await fresh();
  const { result, rerender } = renderHook(({ view }: { view: View }) => useCityZones(view), { initialProps: { view: BERGEN } });
  await waitFor(() => expect(result.current).toHaveLength(772));
  expect(result.current.every(zone => zone.authority === 'Bergen kommune' && zone.ring.length >= 3)).toBe(true);
  const zones = result.current;
  rerender({ view: { ...BERGEN, zoom: 16 } });
  rerender({ view: ZURICH });
  expect(result.current).toBe(zones);
  expect(bergen).toHaveBeenCalledTimes(1);
  expect(porto).not.toHaveBeenCalled();
});

it('asks again for a city whose zones failed to load once the view changes', async () => {
  const { useCityZones, porto } = await fresh();
  porto.mockRejectedValueOnce(new Error('offline'));
  const { result, rerender } = renderHook(({ view }: { view: View }) => useCityZones(view), { initialProps: { view: PORTO } });
  expect(porto).toHaveBeenCalledTimes(1);
  await expect(porto.mock.results[0].value).rejects.toThrow('offline');
  expect(result.current).toEqual([]);
  rerender({ view: { ...PORTO, zoom: 17 } });
  await waitFor(() => expect(result.current).toHaveLength(230));
  expect(porto).toHaveBeenCalledTimes(2);
});
