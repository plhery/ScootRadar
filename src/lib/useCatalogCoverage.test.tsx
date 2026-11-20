// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { dockModel, type DockInput } from '@/lib/dockModel';
import { resetCatalogCoverage, useCatalogCoverage } from '@/lib/useCatalogCoverage';

// Skien in January, in its pause from 15 December, with nothing on the map.
const SKIEN: [number, number] = [59.2075, 9.6107];
const JANUARY = Date.parse('2027-01-20T12:00:00Z');
const ZURICH_VIEW = { south: 47.36, west: 8.53, north: 47.38, east: 8.55 };
const LUNGERN: [number, number] = [46.7741, 8.1558];

/** The dock in Skien that January, with the seasons the page has. */
function skienDock(seasonalPause: DockInput['seasonalPause']) {
  const model = dockModel({
    count: 0, originInViewport: false, nearest: null, loading: null, failure: null, outOfDate: false, hasData: true,
    meta: { generatedAt: new Date(JANUARY).toISOString(), partial: false, stale: false, failedSources: [], sources: {},
      truncated: false, totalVehicles: 0, mode: 'vehicles', zoom: 14 },
    lastUpdated: JANUARY - 30_000, now: JANUARY, representedCount: 0, viewportProviders: ['ryde'], viewportCenter: SKIEN,
    providerCounts: {}, providersInView: new Set(), enabledProviders: new Set(['ryde']), unfilteredCount: 0, seasonalPause,
  });
  return model.kind === 'summary' ? model.notices.filter(notice => notice.kind === 'season') : [];
}

afterEach(() => {
  resetCatalogCoverage();
  vi.doUnmock('@/lib/catalogCoverage');
});

it('knows no coverage before the first answer, and the dock gives no season notice', () => {
  const { result } = renderHook(() => useCatalogCoverage(null));
  expect(result.current).toBeNull();
  expect(skienDock(result.current?.seasonalPause)).toEqual([]);
});

it('loads the catalogs once an answer is in: the apps in view, the places with data and the towns\' seasons', async () => {
  const { result, rerender } = renderHook(({ answer }: { answer: unknown }) => useCatalogCoverage(answer), { initialProps: { answer: null as unknown } });
  rerender({ answer: JANUARY });
  await waitFor(() => expect(result.current).not.toBeNull());
  expect(result.current!.providersForViewport(ZURICH_VIEW)).toEqual(expect.arrayContaining(['lime', 'voi']));
  expect(result.current!.isPointCovered(...LUNGERN)).toBe(false);
  expect(skienDock(result.current!.seasonalPause))
    .toEqual([{ kind: 'season', text: { key: 'dock.seasonUntilClear', values: { city: 'Skien' }, date: '12-15' } }]);
  // The same for the next answer, not loaded again.
  const loaded = result.current;
  rerender({ answer: JANUARY + 30_000 });
  expect(result.current).toBe(loaded);
});

it('asks again at the next answer for catalogs that failed to load', async () => {
  vi.resetModules();
  let fail = true;
  vi.doMock('@/lib/catalogCoverage', async importOriginal => {
    if (fail) throw new Error('offline');
    return importOriginal();
  });
  const hooks = await import('@/lib/useCatalogCoverage');
  const { result, rerender } = renderHook(({ answer }: { answer: unknown }) => hooks.useCatalogCoverage(answer), { initialProps: { answer: JANUARY as unknown } });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(result.current).toBeNull();
  fail = false;
  vi.resetModules();
  rerender({ answer: JANUARY + 30_000 });
  await waitFor(() => expect(result.current).not.toBeNull());
  hooks.resetCatalogCoverage();
});
