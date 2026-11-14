'use client';

import { useEffect, useState } from 'react';
import { track } from '@/lib/analytics';
import type { MapBounds } from '@/lib/types';
import { ZONES_MIN_ZOOM, type MapZone, type ZoneResponse } from '@/lib/zones';

// Long enough to coalesce the viewport changes of one map gesture, as the scooters' requests do.
const QUERY_DEBOUNCE_MS = 250;
/** While some feeds' zones are still being read, the same area is asked for again this much later, a few times. */
const PENDING_RETRY_MS = 3_000;
const PENDING_RETRIES = 3;
/**
 * Where some feeds' zones could not be read, as soon as the cache tries them again (zoneStore.ts), as many times;
 * where the request itself failed, as long after it.
 */
const UNAVAILABLE_RETRY_MS = 60_000;
/**
 * The area asked for is rounded out to a grid of 1/50° (about 2 km), so that views near
 * each other ask the same address and the browser's copy of its answer (kept five
 * minutes) serves them, leaving the scooters' requests the rate limit they share.
 */
const GRID = 50;
const gridded = (value: number, round: (value: number) => number) => String(round(value * GRID) / GRID);

/** The area the operators' zones are asked for, as the address it is asked at: the view rounded out to the grid, from zoom 14 in. */
export function zoneAreaKey(query: { bounds: MapBounds; zoom: number } | null): string | null {
  if (!query || query.zoom < ZONES_MIN_ZOOM) return null;
  return new URLSearchParams({
    south: gridded(query.bounds.south, Math.floor), west: gridded(query.bounds.west, Math.floor),
    north: gridded(query.bounds.north, Math.ceil), east: gridded(query.bounds.east, Math.ceil),
    // The answer is the same at every zoom it is given at.
    zoom: String(ZONES_MIN_ZOOM),
  }).toString();
}

/** That area as a view, from its address. */
export function zoneArea(key: string): { bounds: MapBounds; zoom: number } {
  const params = new URLSearchParams(key);
  const value = (name: string) => Number(params.get(name));
  return { bounds: { south: value('south'), west: value('west'), north: value('north'), east: value('east') }, zoom: value('zoom') };
}

/**
 * "partial": some zones were left out to keep the answer small; zoomed in, the area is smaller. "failed": some or
 * all of the area's zones are unknown, its answer having failed, or some feeds' zones being still on their way or
 * unreadable; those drawn stay drawn.
 */
export type ZoneDataState = 'off' | 'zoomIn' | 'loading' | 'shown' | 'partial' | 'failed';

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
  const key = enabled ? zoneAreaKey(query) : null;
  const wanted = key !== null;
  const [answer, setAnswer] = useState<{ key: string; zones: MapZone[]; state: 'loading' | 'shown' | 'partial' | 'failed' } | null>(null);

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let timer = 0;
    let reported = false;
    const load = async (retries: number) => {
      let status = 0;
      try {
        const response = await fetch(`/api/zones?${key}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) { status = response.status; throw new Error(`HTTP ${response.status}`); }
        const body = await response.json() as ZoneResponse;
        const pending = Boolean(body.meta?.pending) && retries > 0;
        // An area whose zones are partly unknown says so: it would otherwise read as one with none.
        const unknown = Boolean(body.meta?.unavailable) || Boolean(body.meta?.pending);
        setAnswer({
          key,
          zones: Array.isArray(body.zones) ? body.zones : [],
          state: pending ? 'loading' : unknown ? 'failed' : body.meta?.truncated ? 'partial' : 'shown',
        });
        if (pending) timer = window.setTimeout(() => void load(retries - 1), PENDING_RETRY_MS);
        else if (body.meta?.unavailable && retries > 0) timer = window.setTimeout(() => void load(retries - 1), UNAVAILABLE_RETRY_MS);
      } catch {
        if (controller.signal.aborted) return;
        setAnswer(current => ({ key, zones: current?.key === key ? current.zones : [], state: 'failed' }));
        // The kind of failure alone, neither the area nor anything of the visitor: a status apart
        // tells the limit the zones share with the scooters (429) from the cache failing (503).
        // Once for the area, however many times it is asked again.
        if (!reported) {
          reported = true;
          track('zones_error', { result: status ? `status_${status}` : 'request_failed' });
        }
        // Asked again a minute later while tries are left, as the apps ask with their next scooter refreshes:
        // a request lost to the network would otherwise leave the area without zones until the map leaves it.
        if (retries > 0) timer = window.setTimeout(() => void load(retries - 1), UNAVAILABLE_RETRY_MS);
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
  return { zones, state: answer.state };
}
