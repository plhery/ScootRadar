import { FEATURED_CITIES, LANDING_COUNTRY_ORDER } from '@/generated/countries';
import { COVERED_CITIES, type CoveredCountry } from '@/lib/coveredCities';
import { mapAt } from '@/lib/mapAddress';

// The cities the landing page names, by their id in the catalogue, and the order of the
// countries (Switzerland and its neighbours first, then the countries in the order they were
// added) are in data/countries.json. The others of each country are counted, so the page
// stays right as cities are added.
const FEATURED = FEATURED_CITIES;
const COUNTRY_ORDER = LANDING_COUNTRY_ORDER;

export interface LandingCity {
  name: string;
  /** The map, opened on this city. */
  href: string;
}

export interface LandingCountryCities {
  country: CoveredCountry;
  total: number;
  featured: LandingCity[];
  /** How many cities of the country are not named. */
  more: number;
}

export function landingCountries(): LandingCountryCities[] {
  return COUNTRY_ORDER.map(country => {
    const cities = COVERED_CITIES.filter(city => city.country === country);
    const featured = FEATURED[country].flatMap(id => {
      const city = cities.find(candidate => candidate.id === id);
      return city ? [{ name: city.city, href: mapAt(city.center) }] : [];
    });
    return { country, total: cities.length, featured, more: cities.length - featured.length };
  });
}
