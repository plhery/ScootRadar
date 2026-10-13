import { COVERED_CITIES, type CoveredCountry } from '@/lib/coveredCities';
import { mapAt } from '@/lib/mapAddress';

// The cities the landing page names, by their id in the catalogue. The others
// of each country are counted, so the page stays right as cities are added.
const FEATURED: Record<CoveredCountry, string[]> = {
  CH: ['ch:zurich', 'ch:basel', 'ch:bern', 'ch:winterthur', 'ch:st-gallen', 'ch:zug'],
  DE: ['de:Berlin', 'de:München', 'de:Köln', 'de:Frankfurt', 'de:Stuttgart', 'de:Düsseldorf'],
  FR: ['fr:Lyon', 'fr:Marseille', 'fr:Bordeaux', 'fr:Lille Métropole', 'fr:Grenoble', 'fr:Angers'],
  IT: ['it:Roma', 'it:Palermo', 'it:Napoli'],
  BE: ['be:Bruxelles', 'be:Antwerpen', 'be:Charleroi', 'be:Kortrijk'],
  NO: ['no:Oslo', 'no:Trondheim', 'no:Stavanger', 'no:Kristiansand', 'no:Bærum', 'no:Tromsø'],
  GB: ['gb:Bristol', 'gb:Liverpool', 'gb:Nottingham', 'gb:Leeds', 'gb:Brighton', 'gb:Bournemouth'],
  PT: ['pt:Lisboa', 'pt:Porto', 'pt:Cascais', 'pt:Almada', 'pt:Matosinhos', 'pt:Oeiras'],
  ES: ['es:Gijón', 'es:Getafe', 'es:Torrevieja', 'es:Playa de las Américas', 'es:Jávea', 'es:Pilar de la Horadada'],
  IS: ['is:Reykjavík', 'is:Reykjanesbær', 'is:Akureyri', 'is:Selfoss', 'is:Akranes', 'is:Vestmannaeyjar'],
  SE: ['se:Uppsala', 'se:Kiruna'],
  LV: ['lv:Rīga'],
  PL: ['pl:Sosnowiec', 'pl:Wołomin', 'pl:Oświęcim', 'pl:Radzymin', 'pl:Kobyłka', 'pl:Knurów'],
  HU: ['hu:Pécs', 'hu:Békéscsaba'],
  GR: ['gr:Faliraki', 'gr:Piraeus', 'gr:Argostoli', 'gr:Ioannina'],
  CY: ['cy:Paphos', 'cy:Limassol'],
  FI: ['fi:Mariehamn'],
  HR: ['hr:Rijeka'],
};

// Switzerland and its neighbours first, then the countries in the order they were added.
const COUNTRY_ORDER: CoveredCountry[] = ['CH', 'DE', 'FR', 'IT', 'BE', 'NO', 'GB', 'PT', 'ES', 'IS', 'SE', 'LV', 'PL', 'HU', 'GR', 'CY', 'FI', 'HR'];

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
