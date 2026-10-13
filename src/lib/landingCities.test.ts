import { describe, expect, it } from 'vitest';
import { parseClientParams } from '@/lib/clientParams';
import { COVERED_CITIES, isPointCovered } from '@/lib/coveredCities';
import { LANDING_CITY_TOTAL, landingCountries } from '@/lib/landingCities';

describe('the cities of the landing page', () => {
  it('counts every city of the catalogue, country by country', () => {
    const countries = landingCountries();
    expect(countries.map(({ country }) => country)).toEqual(['CH', 'DE', 'FR', 'IT', 'BE', 'NO', 'GB', 'PT', 'ES', 'IS', 'SE', 'LV', 'PL', 'HU', 'GR']);
    expect(countries.reduce((sum, { total }) => sum + total, 0)).toBe(COVERED_CITIES.length);
    expect(LANDING_CITY_TOTAL).toBe(COVERED_CITIES.length);
  });

  it('finds every city it names', () => {
    // A name that left the catalogue would be dropped from the page without a word.
    expect(landingCountries().map(({ featured }) => featured.length)).toEqual([6, 6, 6, 3, 4, 6, 6, 6, 6, 6, 2, 1, 6, 1, 3]);
    for (const { total, featured, more } of landingCountries()) expect(featured.length + more).toBe(total);
  });

  it('links each to the map, opened there', () => {
    for (const { featured } of landingCountries()) {
      for (const city of featured) {
        const url = new URL(city.href, 'https://scootradar.com');
        expect(url.pathname).toBe('/map');
        const { origin } = parseClientParams(url.searchParams);
        expect(origin, city.name).not.toBeNull();
        expect(isPointCovered(origin![0], origin![1]), city.name).toBe(true);
      }
    }
  });
});
