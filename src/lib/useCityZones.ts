'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { cityZones, loadCityZones, zoneCitiesInView, type ZoneCity } from '@/lib/cityZones';
import type { RuleZone } from '@/lib/ruleZones';
import type { MapBounds } from '@/lib/types';

const NONE: RuleZone[] = [];

/**
 * The zones of every city of those (useRuleCatalogs' zoneCities) a view from zoom 14 has reached
 * since the page was opened: each city's are loaded the first time a view reaches it, or the view
 * the cities arrive in. A city whose zones failed to load is asked for again when the view next changes.
 */
export function useCityZones(view: { bounds: MapBounds; zoom: number } | null, cities: readonly ZoneCity[]): RuleZone[] {
  useEffect(() => {
    for (const city of zoneCitiesInView(view, cities)) void loadCityZones(city);
  }, [cities, view]);
  return useSyncExternalStore(cityZones.subscribe, cityZones.get, () => NONE);
}
