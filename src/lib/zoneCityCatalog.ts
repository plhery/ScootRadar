import index from '../../data/city-zones.json';
import type { ZoneCity } from '@/lib/cityZones';

/**
 * The cities whose zones the website draws, from data/city-zones.json (124 KB): all but any held back for an
 * iPhone release that downloads them (`"website": false`, docs/city-zone-downloads.md), none since 30 October
 * 2026. Kept out of cityZones.ts, so that the map page loads them once it is up (useRuleCatalogs.ts).
 */
export const ZONE_CITIES: ZoneCity[] = index.cities.filter(city => !('website' in city && city.website === false));
