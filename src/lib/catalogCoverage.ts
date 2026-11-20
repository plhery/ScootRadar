import { PROVIDER_KEYS, SWISS_PROVIDER_KEYS } from '@/generated/providers';
import type { CoveredCity } from '@/lib/coveredCities';
import { SWISS_SCOOTER_AREAS } from '@/lib/feedCoverage';
import { boundsContainPoint, boundsIntersect } from '@/lib/geo';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, serviceAreas } from '@/lib/regionalScooterSystems';
import type { MapBounds } from '@/lib/types';

// Where the operators run, from the catalogs of every country, which the map page loads once its first scooters are
// in (useCatalogCoverage.ts): its start needs only the list of cities (coveredCities.ts).

/**
 * The cities with scooter data as the catalogs merge them, each with bounds enclosing its operators' areas: the
 * Swiss areas, then REGIONAL_SCOOTER_CITIES. scripts/generate-provider-catalog.mjs writes COVERED_CITIES from the
 * same merge, without the bounds, and the iOS ScooterCityCatalog with them; the address search reads this one.
 */
export const CATALOG_CITIES: (CoveredCity & { bounds: MapBounds })[] = [
  ...SWISS_SCOOTER_AREAS.map(area => ({
    id: area.id, city: area.city, country: 'CH' as const, center: [area.center[0], area.center[1]] as [number, number], bounds: area.bounds,
  })),
  ...REGIONAL_SCOOTER_CITIES.map(({ id, city, country, center, bounds }) => ({ id, city, country, center, bounds })),
];

// Independent of counts and saved filters: empty batteries or a temporary
// outage must not make a provider switch disappear.
export function providersForViewport(bounds: MapBounds): string[] {
  const providers = new Set<string>();
  if (SWISS_SCOOTER_AREAS.some(area => boundsIntersect(area.bounds, bounds))) {
    for (const key of SWISS_PROVIDER_KEYS) providers.add(key);
  }
  for (const system of REGIONAL_SCOOTER_SYSTEMS) {
    if (serviceAreas(system).some(area => boundsIntersect(area.bounds, bounds))) providers.add(system.provider);
  }
  return PROVIDER_KEYS.filter(key => providers.has(key));
}

// The operators' own envelopes rather than the merged city boxes, so a covered
// point always has at least one provider in providersForViewport.
const SERVICE_AREA_BOUNDS: MapBounds[] = [
  ...SWISS_SCOOTER_AREAS.map(area => area.bounds),
  ...REGIONAL_SCOOTER_SYSTEMS.flatMap(system => serviceAreas(system).map(area => area.bounds)),
];

export function isPointCovered(lat: number, lng: number): boolean {
  return SERVICE_AREA_BOUNDS.some(bounds => boundsContainPoint(bounds, lat, lng));
}
