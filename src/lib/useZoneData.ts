'use client';

import { useEffect, useState } from 'react';
import type { MapBounds } from '@/lib/types';
import { ZONES_MIN_ZOOM, type MapZone, type ZoneResponse } from '@/lib/zones';

// Long enough to coalesce the viewport changes of one map gesture, as the scooters' requests do.
const QUERY_DEBOUNCE_MS = 250;
/** While some feeds' zones are still being read, the same area is asked for again this much later, a few times. */
const PENDING_RETRY_MS = 3_000;
const PENDING_RETRIES = 3;
/**
 * The area asked for is rounded out to a grid of 1/50° (about 2 km), so that views near
 * each other ask the same address and the browser's copy of its answer (kept five
 * minutes) serves them, leaving the scooters' requests the rate limit they share.
 */
const GRID = 50;
const gridded = (value: number, round: (value: number) => number) => String(round(value * GRID) / GRID);

export type ZoneDataState = 'off' | 'zoomIn' | 'loading' | 'shown' | 'failed';

export interface ZoneData {
  zones: MapZone[];
  state: ZoneDataState;
}

const NO_ZONES: MapZone[] = [];

/**
 * The operators' zones of the map's area while they are turned on, from this
 * zoom in: the area the scooters were asked for, so that panning within it
 * asks for nothing more.
 */
export function useZoneData(query: { bounds: MapBounds; zoom: number } | null, enabled: boolean): ZoneData {
  const wanted = enabled && query !== null && query.zoom >= ZONES_MIN_ZOOM;
  const key = wanted ? new URLSearchParams({
    south: gridded(query.bounds.south, Math.floor), west: gridded(query.bounds.west, Math.floor),
    north: gridded(query.bounds.north, Math.ceil), east: gridded(query.bounds.east, Math.ceil),
    // The answer is the same at every zoom it is given at.
    zoom: String(ZONES_MIN_ZOOM),
  }).toString() : null;
  const [answer, setAnswer] = useState<{ key: string; zones: MapZone[]; failed: boolean } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let timer = 0;
    const load = async (retries: number) => {
      try {
        const response = await fetch(`/api/zones?${key}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.json() as ZoneResponse;
        setAnswer({ key, zones: Array.isArray(body.zones) ? body.zones : [], failed: false });
        if (body.meta?.pending && retries > 0) timer = window.setTimeout(() => void load(retries - 1), PENDING_RETRY_MS);
      } catch {
        if (!controller.signal.aborted) setAnswer(current => ({ key, zones: current?.key === key ? current.zones : [], failed: true }));
      }
    };
    timer = window.setTimeout(() => void load(PENDING_RETRIES), QUERY_DEBOUNCE_MS);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [key]);

  if (!enabled) return { zones: NO_ZONES, state: 'off' };
  if (!wanted) return { zones: NO_ZONES, state: 'zoomIn' };
  // Those of the area before stay drawn while the new area's are on their way.
  const zones = answer?.zones ?? NO_ZONES;
  if (answer?.key !== key) return { zones, state: 'loading' };
  return { zones, state: answer.failed ? 'failed' : 'shown' };
}
