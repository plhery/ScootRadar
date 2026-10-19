'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';
import { MAP_PATH } from '@/lib/mapAddress';

/**
 * Counts a view of a page of the site under its own address, and each link to the
 * map followed from it, as `map_open`: `city` for a city's map, `map` for the map.
 * Nothing is opened or installed here.
 */
export default function PageView({ path, title }: { path: string; title: string }) {
  useEffect(() => {
    const page = { path, title };
    track(undefined, {}, page);
    const followed = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== MAP_PATH) return;
      track('map_open', { result: url.searchParams.has('origin') ? 'city' : 'map' }, page);
    };
    document.addEventListener('click', followed);
    return () => document.removeEventListener('click', followed);
  }, [path, title]);
  return null;
}
