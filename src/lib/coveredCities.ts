import type { CountryCode } from '@/generated/countries';
import { COVERED_CITY_ROWS } from '@/generated/coveredCities';
import { haversineM } from '@/lib/geo';

// How many providers run the scooters of those cities, by the name riders see on them, as the landing page lists
// them: Bolt's Hopp in Washington and the Icelandic Hopp are two companies, but one name, so one provider here.
export { COVERED_PROVIDER_TOTAL } from '@/generated/coveredCities';

/** Switzerland and the countries with a catalog: every country of data/countries.json. */
export type CoveredCountry = CountryCode;

export interface CoveredCity {
  id: string;
  city: string;
  country: CoveredCountry;
  center: [number, number];
}

export interface NearbyCoveredCity extends CoveredCity {
  distanceM: number;
}

// One entry per city with scooter data: the Swiss areas (SWISS_SCOOTER_AREAS), then REGIONAL_SCOOTER_CITIES, as
// scripts/generate-provider-catalog.mjs writes them from the catalogs, the same list as the iOS ScooterCityCatalog.
// Written out, so that the map page starts without the catalogs (useCatalogCoverage.ts).
export const COVERED_CITIES: CoveredCity[] = COVERED_CITY_ROWS.map(([id, city, country, lat, lng]) =>
  ({ id, city, country, center: [lat, lng] }));

/**
 * How many cities and countries ScootRadar covers, as the app and the landing
 * page say it: "186 cities in 17 countries". A city is an entry above, the one
 * riders search, see among the closest cities and find on the landing page:
 * each Swiss area, and each town of the other catalogs once, however many
 * operators run there and whether its feed is its own or shared with other
 * towns through `areas`. The iOS app counts ScooterCityCatalog, generated from
 * the same catalogs, the same way.
 */
export const COVERED_CITY_TOTAL = COVERED_CITIES.length;
export const COVERED_COUNTRY_TOTAL = new Set(COVERED_CITIES.map(city => city.country)).size;

/** Covered cities by distance from the point to their centre, nearest first. */
export function nearestCoveredCities(point: [number, number], count: number): NearbyCoveredCity[] {
  return COVERED_CITIES
    .map(city => ({ ...city, distanceM: haversineM(point[0], point[1], city.center[0], city.center[1]) }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, Math.max(0, count));
}
