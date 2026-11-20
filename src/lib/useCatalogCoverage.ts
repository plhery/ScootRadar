'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { ActiveSeasonalPause } from '@/lib/seasonalPauses';
import type { MapBounds } from '@/lib/types';

// Where the operators run and when a town's season is closed, read from the catalogs of every country
// (catalogCoverage.ts, seasonalPauses.ts): 535 KB of the map page's code, 115 KB compressed. The first scooters
// need none of it: the start city and the closest cities come from the list of cities the catalogs' generator
// writes (coveredCities.ts), and each answer names the apps that run in its view (meta.availableProviders). So the
// page loads them once the map is up and its first answer is in, after what the first scooters need rather than
// beside it. Until then the filter and the dock go by the answer's apps, no season notice is given, and a
// remembered place has no "No data" tag. They are loaded once, and asked for again at the next answer if they failed.

export interface CatalogCoverage {
  providersForViewport: (bounds: MapBounds) => string[];
  isPointCovered: (lat: number, lng: number) => boolean;
  seasonalPause: (point: [number, number] | null, now: number, seasonOver: ReadonlySet<string>) => ActiveSeasonalPause | null;
}

let coverage: CatalogCoverage | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
const get = () => coverage;
const getServer = () => null;

/** Loads the catalogs, once; a load that failed is tried again at the next call. */
export function loadCatalogCoverage(): Promise<void> {
  if (coverage) return Promise.resolve();
  loading ??= Promise.all([import('@/lib/catalogCoverage'), import('@/lib/seasonalPauses')]).then(
    ([{ providersForViewport, isPointCovered }, { activeSeasonalPause }]) => {
      coverage = {
        providersForViewport,
        isPointCovered,
        seasonalPause: (point, now, seasonOver) => activeSeasonalPause(point, now, undefined, seasonOver),
      };
      for (const listener of listeners) listener();
    },
    () => { loading = null; },
  );
  return loading;
}

/** Forgets the catalogs loaded: for the tests. */
export function resetCatalogCoverage(): void {
  coverage = null;
  loading = null;
}

/** The catalogs' coverage, once `answer` is set (any value but null) and they have loaded; null until then. */
export function useCatalogCoverage(answer: unknown): CatalogCoverage | null {
  useEffect(() => {
    if (answer !== null) void loadCatalogCoverage();
  }, [answer]);
  return useSyncExternalStore(subscribe, get, getServer);
}
