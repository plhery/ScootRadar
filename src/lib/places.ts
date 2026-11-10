import { COVERED_CITIES, isPointCovered, type CoveredCity } from '@/lib/coveredCities';
import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale } from '@/lib/i18n';

/** A row of GET/POST /api/geocode. Servers before the two-line labels send display_name only. */
export interface PlaceResult {
  lat: number;
  lng: number;
  display_name: string;
  title?: string;
  subtitle?: string;
  covered?: boolean;
}

/** A place the user can choose as the origin for walking times. */
export interface Place {
  lat: number;
  lng: number;
  display_name: string;
  title: string;
  /** May be empty; then the second line is not shown. */
  subtitle: string;
  /** False gets the "No data" tag. */
  covered: boolean;
  /** A covered city chosen as a whole: the map shows the city rather than one street. */
  city?: true;
}

/** The label splitting from before the API sent a title and a subtitle: at the first comma. */
export function splitDisplayName(displayName: string): { title: string; subtitle: string } {
  const [title, ...rest] = displayName.split(',').map(part => part.trim()).filter(Boolean);
  return { title: title || displayName.trim(), subtitle: rest.join(', ') };
}

// Far less than the distance between two places the address search tells apart.
const SAME_POINT_DEGREES = 1e-6;

/**
 * The address search answers a typed city with scooter data from the catalogue,
 * at the catalogue's centre of that city. Such a row stands for the city as a
 * whole, like a "Cities with scooters" chip; the response itself does not say so.
 */
function isCityCentre(lat: number, lng: number): boolean {
  return COVERED_CITIES.some(city =>
    Math.abs(city.center[0] - lat) < SAME_POINT_DEGREES && Math.abs(city.center[1] - lng) < SAME_POINT_DEGREES);
}

export function toPlace(result: PlaceResult): Place {
  const title = typeof result.title === 'string' ? result.title.trim() : '';
  const lines = title
    ? { title, subtitle: typeof result.subtitle === 'string' ? result.subtitle.trim() : '' }
    : splitDisplayName(result.display_name);
  const covered = typeof result.covered === 'boolean' ? result.covered : isPointCovered(result.lat, result.lng);
  return {
    lat: result.lat,
    lng: result.lng,
    display_name: result.display_name,
    ...lines,
    covered,
    ...(covered && isCityCentre(result.lat, result.lng) ? { city: true as const } : {}),
  };
}

/** A "Cities with scooters" chip chosen as a place; the map shows the whole city. */
export function placeForCity(city: CoveredCity, locale: AppLocale, region?: string): Place {
  const country = new Intl.DisplayNames(formatLocale(locale, region), { type: 'region' }).of(city.country) ?? city.country;
  return {
    lat: city.center[0],
    lng: city.center[1],
    display_name: `${city.city}, ${country}`,
    title: city.city,
    subtitle: country,
    covered: true,
    city: true,
  };
}

// From this zoom the map shows a city or less; zoomed out further, its centre says little about what is looked for.
export const SEARCH_NEAR_MIN_ZOOM = 10;

/**
 * The map centre the address search favours places near, to about a kilometre:
 * no more than it needs to favour a neighbourhood. None for a map of a whole region.
 */
export function searchNear(center: readonly [number, number] | null, zoom: number): [number, number] | null {
  if (!center || zoom < SEARCH_NEAR_MIN_ZOOM) return null;
  return [Math.round(center[0] * 100) / 100, Math.round(center[1] * 100) / 100];
}

/** Where this browser keeps the last place chosen in the search, and nothing else of it. */
export const RECENT_PLACE_STORAGE_KEY = 'scooters-recent-place';

/**
 * A place as an earlier visit stored it, or null for anything else: storage is not to be trusted. Whether the map
 * has data there is as it has today, which a feed added or ended since may have changed.
 */
export function storedPlace(value: unknown): Place | null {
  if (!value || typeof value !== 'object') return null;
  const { lat, lng, display_name: displayName, title, subtitle, city } = value as Record<string, unknown>;
  if (typeof lat !== 'number' || !Number.isFinite(lat) || Math.abs(lat) > 90) return null;
  if (typeof lng !== 'number' || !Number.isFinite(lng) || Math.abs(lng) > 180) return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  return {
    lat,
    lng,
    display_name: typeof displayName === 'string' && displayName.trim() ? displayName : title,
    title,
    subtitle: typeof subtitle === 'string' ? subtitle : '',
    covered: isPointCovered(lat, lng),
    ...(city === true ? { city: true as const } : {}),
  };
}

export interface RecentPlaceStore {
  /** The last place chosen in the search, or null. */
  get: () => Place | null;
  /** A place chosen in the search: it replaces the one remembered. */
  set: (place: Place) => void;
  /** The ✕ beside it: nothing is remembered any more. */
  forget: () => void;
  subscribe: (listener: () => void) => () => void;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Storage blocked for this site: the place is remembered until the page is closed.
    return null;
  }
}

/**
 * The search offers the last place chosen in it again, on later visits too.
 * It stays in this browser's storage, under its own key, until another place
 * is chosen or it is forgotten; the privacy notice says so. It never reaches
 * the URL, analytics or a request of its own.
 */
export function createRecentPlaceStore(storage: () => Storage | null = browserStorage): RecentPlaceStore {
  let loaded = false;
  let place: Place | null = null;
  const listeners = new Set<() => void>();

  const parse = (saved: string) => {
    try {
      return storedPlace(JSON.parse(saved));
    } catch {
      return null;
    }
  };
  const read = () => {
    try {
      const saved = storage()?.getItem(RECENT_PLACE_STORAGE_KEY) ?? null;
      place = saved === null ? null : parse(saved);
      // What could not be read is no place, and is not kept.
      if (saved !== null && !place) storage()?.removeItem(RECENT_PLACE_STORAGE_KEY);
    } catch {
      place = null;
    }
    loaded = true;
  };
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const write = (next: Place | null) => {
    place = next;
    loaded = true;
    try {
      if (next) storage()?.setItem(RECENT_PLACE_STORAGE_KEY, JSON.stringify(next));
      else storage()?.removeItem(RECENT_PLACE_STORAGE_KEY);
    } catch { /* Full or blocked: it is remembered until the page is closed. */ }
    notify();
  };
  // Another tab chose a place or forgot it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== RECENT_PLACE_STORAGE_KEY && event.key !== null) return;
    read();
    notify();
  };

  return {
    get: () => {
      if (!loaded) read();
      return place;
    },
    set: next => write(next),
    forget: () => {
      if (!loaded) read();
      if (place) write(null);
    },
    subscribe(listener) {
      if (listeners.size === 0 && typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
  };
}

/** The last place chosen in the search, in this browser. */
export const recentPlace = createRecentPlaceStore();
