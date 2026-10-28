'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { cityZones, loadCityZones, zoneCitiesInView } from '@/lib/cityZones';
import type { RuleArea } from '@/lib/ruleZones';
import type { MapBounds } from '@/lib/types';

const NONE: RuleArea[] = [];

/**
 * The zones of every city a view from zoom 14 has reached since the page was opened: each
 * city's are loaded the first time a view reaches it. A city whose zones failed to load is
 * asked for again when the view next changes.
 */
export function useCityZones(view: { bounds: MapBounds; zoom: number } | null): RuleArea[] {
  useEffect(() => {
    for (const city of zoneCitiesInView(view)) void loadCityZones(city);
  }, [view]);
  return useSyncExternalStore(cityZones.subscribe, cityZones.get, () => NONE);
}
