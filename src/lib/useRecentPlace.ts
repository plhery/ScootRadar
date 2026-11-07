'use client';

import { useSyncExternalStore } from 'react';
import { recentPlace, type Place } from '@/lib/places';

/** The last place chosen in the search, kept by this browser; none while the page is drawn on the server. */
export function useRecentPlace(): Place | null {
  return useSyncExternalStore(recentPlace.subscribe, recentPlace.get, () => null);
}
