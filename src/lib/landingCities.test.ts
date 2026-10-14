import { describe, expect, it } from 'vitest';
import { COUNTRY_CODES, FEATURED_CITIES } from '@/generated/countries';
import { parseClientParams } from '@/lib/clientParams';
import { COVERED_CITIES, COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL, isPointCovered } from '@/lib/coveredCities';
import { landingCountries } from '@/lib/landingCities';

describe('the cities of the landing page', () => {
  it('counts every city of the catalogue, country by country', () => {
    const countries = landingCountries();
    // Switzerland and its neighbours first, then every other country of data/countries.json in its order.
    expect(countries.map(({ country }) => country)).toEqual(['CH', 'DE', 'FR', 'IT',
      ...COUNTRY_CODES.filter(code => !['CH', 'DE', 'FR', 'IT'].includes(code))]);
    expect(countries.reduce((sum, { total }) => sum + total, 0)).toBe(COVERED_CITIES.length);
    // The title's count and the lede's are the app's.
    expect(countries.filter(({ total }) => total > 0)).toHaveLength(COVERED_COUNTRY_TOTAL);
    expect(COVERED_CITY_TOTAL).toBe(COVERED_CITIES.length);
  });

  it('finds every city it names', () => {
    // A name that left the catalogue would be dropped from the page without a word.
    expect(landingCountries().map(({ featured }) => featured.length))
      .toEqual(landingCountries().map(({ country }) => FEATURED_CITIES[country].length));
    expect(landingCountries().slice(0, 4).map(({ featured }) => featured.length)).toEqual([6, 6, 6, 4]);
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
