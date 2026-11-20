// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { dockModel, type DockInput } from '@/lib/dockModel';
import { activeCurfew } from '@/lib/rentalCurfews';
import { RULE_ZONES } from '@/lib/ruleZoneCatalog';
import { ruleZonesInView } from '@/lib/ruleZones';
import { NO_RULES, resetRuleCatalogs, useRuleCatalogs } from '@/lib/useRuleCatalogs';

const OSLO: [number, number] = [59.9139, 10.7522];
// A Monday night in Oslo, where renting is banned from 23:00 to 05:00.
const NIGHT = Date.parse('2026-10-12T22:30:00Z');
const OSLO_VIEW = { bounds: { south: 59.90, west: 10.73, north: 59.93, east: 10.77 }, zoom: 15 };
// Around the first point of the first rule zone of data/rule-zones.json.
const [ZONE_LAT, ZONE_LNG] = RULE_ZONES[0].lines?.[0][0] ?? RULE_ZONES[0].ring![0];
const RULE_VIEW = { bounds: { south: ZONE_LAT - 0.002, west: ZONE_LNG - 0.002, north: ZONE_LAT + 0.002, east: ZONE_LNG + 0.002 }, zoom: 15 };

/** The dock in Oslo that night, with the bans the page has. */
function osloDock(curfews: DockInput['curfews']) {
  return dockModel({
    count: 4, originInViewport: false, nearest: null, loading: null, failure: null, outOfDate: false, hasData: true,
    meta: { generatedAt: new Date(NIGHT - 30_000).toISOString(), partial: false, stale: false, failedSources: [], sources: {},
      truncated: false, totalVehicles: 4, mode: 'vehicles', zoom: 15 },
    lastUpdated: NIGHT - 30_000, now: NIGHT, representedCount: 4, viewportProviders: ['voi'], viewportCenter: OSLO,
    providerCounts: { voi: 4 }, providersInView: new Set(['voi']), enabledProviders: new Set(['voi']), unfilteredCount: 4, curfews,
  });
}

afterEach(() => {
  resetRuleCatalogs();
  vi.doUnmock('@/lib/ruleCatalogs');
});

it('knows no rule before the map has a view: no ban for the dock or the cards, no rule zone', () => {
  const { result } = renderHook(() => useRuleCatalogs(null));
  expect(result.current).toBe(NO_RULES);
  expect(activeCurfew(OSLO, NIGHT, result.current.curfews)).toBeNull();
  const dock = osloDock(result.current.curfews);
  expect(dock.kind === 'summary' && dock.notices).toEqual([]);
  expect(ruleZonesInView(RULE_VIEW, NIGHT, [...result.current.ruleZones])).toEqual([]);
});

it('loads the rules once the map has a view, and the dock then says renting is banned', async () => {
  const { result, rerender } = renderHook(({ view }: { view: unknown }) => useRuleCatalogs(view), { initialProps: { view: null as unknown } });
  rerender({ view: OSLO_VIEW });
  await waitFor(() => expect(result.current.curfews.length).toBeGreaterThan(0));
  expect(result.current.ruleZones.length).toBeGreaterThan(0);
  expect(result.current.zoneCities.some(city => city.id === 'oslo')).toBe(true);
  expect(activeCurfew(OSLO, NIGHT, result.current.curfews)).toMatchObject({ city: 'Oslo', timeZone: 'Europe/Oslo' });
  const dock = osloDock(result.current.curfews);
  expect(dock.kind === 'summary' && dock.notices[0]).toMatchObject({ kind: 'curfew', text: { key: 'dock.curfew', values: { city: 'Oslo' } } });
  expect(ruleZonesInView(RULE_VIEW, NIGHT, [...result.current.ruleZones]).length).toBeGreaterThan(0);
  // The same rules for the next view, not loaded again.
  const loaded = result.current;
  rerender({ view: { ...OSLO_VIEW, zoom: 16 } });
  expect(result.current).toBe(loaded);
});

it('asks again at the next view for rules that failed to load', async () => {
  vi.resetModules();
  let fail = true;
  vi.doMock('@/lib/ruleCatalogs', async importOriginal => {
    if (fail) throw new Error('offline');
    return importOriginal();
  });
  const hooks = await import('@/lib/useRuleCatalogs');
  const { result, rerender } = renderHook(({ view }: { view: unknown }) => hooks.useRuleCatalogs(view), { initialProps: { view: OSLO_VIEW as unknown } });
  await new Promise(resolve => setTimeout(resolve, 20));
  expect(result.current).toBe(hooks.NO_RULES);
  fail = false;
  vi.resetModules();
  rerender({ view: { ...OSLO_VIEW, zoom: 16 } });
  await waitFor(() => expect(result.current.curfews.length).toBeGreaterThan(0));
  hooks.resetRuleCatalogs();
});
