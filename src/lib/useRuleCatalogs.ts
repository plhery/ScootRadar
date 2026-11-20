'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { ZoneCity } from '@/lib/cityZones';
import type { RentalCurfew } from '@/lib/rentalCurfews';
import type { RuleZone } from '@/lib/ruleZones';

// The cities' rules the map reads: their night bans on renting, the streets and areas they set rules for, and
// the index of the cities whose zones it draws (ruleCatalogs.ts), 467 KB of the map page's code together. The
// first paint needs none of them, so the page loads them once the map is up and has reported its view, beside
// the scooters, and until then the dock and the cards say what they would with no rule known: no curfew
// notice, no rule zone. They are loaded once, and asked for again at the next view if they failed.

export interface RuleCatalogs {
  curfews: readonly RentalCurfew[];
  ruleZones: readonly RuleZone[];
  zoneCities: readonly ZoneCity[];
}

export const NO_RULES: RuleCatalogs = { curfews: [], ruleZones: [], zoneCities: [] };

let catalogs = NO_RULES;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
const get = () => catalogs;
const getServer = () => NO_RULES;

/** Loads the rules, once; a load that failed is tried again at the next call. */
export function loadRuleCatalogs(): Promise<void> {
  if (catalogs !== NO_RULES) return Promise.resolve();
  loading ??= import('@/lib/ruleCatalogs').then(
    ({ RENTAL_CURFEWS, RULE_ZONES, ZONE_CITIES }) => {
      catalogs = { curfews: RENTAL_CURFEWS, ruleZones: RULE_ZONES, zoneCities: ZONE_CITIES };
      for (const listener of listeners) listener();
    },
    () => { loading = null; },
  );
  return loading;
}

/** Forgets the rules loaded: for the tests. */
export function resetRuleCatalogs(): void {
  catalogs = NO_RULES;
  loading = null;
}

/** The cities' rules, once the map has a view (any value but null) and they have loaded; NO_RULES until then. */
export function useRuleCatalogs(view: unknown): RuleCatalogs {
  useEffect(() => {
    if (view !== null) void loadRuleCatalogs();
  }, [view]);
  return useSyncExternalStore(subscribe, get, getServer);
}
