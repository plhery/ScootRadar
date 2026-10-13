import { COVERED_CITIES, isPointCovered, type CoveredCountry } from '@/lib/coveredCities';
import { REGIONAL_SCOOTER_CITIES } from '@/lib/regionalScooterSystems';

const MAX_CITIES = 5;

/** The languages the apps are shown in; a result's second line is written in the one asked for. */
export const GEOCODE_LANGUAGES = ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'] as const;
export type GeocodeLanguage = typeof GEOCODE_LANGUAGES[number];

// A table rather than Intl.DisplayNames, whose locale data is not a given on the server.
const COUNTRY_NAMES: Record<CoveredCountry, Record<GeocodeLanguage, string>> = {
  CH: { en: 'Switzerland', de: 'Schweiz', fr: 'Suisse', it: 'Svizzera', nl: 'Zwitserland', nb: 'Sveits', pt: 'Suíça', es: 'Suiza', is: 'Sviss' },
  FR: { en: 'France', de: 'Frankreich', fr: 'France', it: 'Francia', nl: 'Frankrijk', nb: 'Frankrike', pt: 'França', es: 'Francia', is: 'Frakkland' },
  DE: { en: 'Germany', de: 'Deutschland', fr: 'Allemagne', it: 'Germania', nl: 'Duitsland', nb: 'Tyskland', pt: 'Alemanha', es: 'Alemania', is: 'Þýskaland' },
  IT: { en: 'Italy', de: 'Italien', fr: 'Italie', it: 'Italia', nl: 'Italië', nb: 'Italia', pt: 'Itália', es: 'Italia', is: 'Ítalía' },
  BE: { en: 'Belgium', de: 'Belgien', fr: 'Belgique', it: 'Belgio', nl: 'België', nb: 'Belgia', pt: 'Bélgica', es: 'Bélgica', is: 'Belgía' },
  NO: { en: 'Norway', de: 'Norwegen', fr: 'Norvège', it: 'Norvegia', nl: 'Noorwegen', nb: 'Norge', pt: 'Noruega', es: 'Noruega', is: 'Noregur' },
  GB: { en: 'United Kingdom', de: 'Vereinigtes Königreich', fr: 'Royaume-Uni', it: 'Regno Unito', nl: 'Verenigd Koninkrijk', nb: 'Storbritannia', pt: 'Reino Unido', es: 'Reino Unido', is: 'Bretland' },
  PT: { en: 'Portugal', de: 'Portugal', fr: 'Portugal', it: 'Portogallo', nl: 'Portugal', nb: 'Portugal', pt: 'Portugal', es: 'Portugal', is: 'Portúgal' },
  ES: { en: 'Spain', de: 'Spanien', fr: 'Espagne', it: 'Spagna', nl: 'Spanje', nb: 'Spania', pt: 'Espanha', es: 'España', is: 'Spánn' },
  IS: { en: 'Iceland', de: 'Island', fr: 'Islande', it: 'Islanda', nl: 'IJsland', nb: 'Island', pt: 'Islândia', es: 'Islandia', is: 'Ísland' },
  SE: { en: 'Sweden', de: 'Schweden', fr: 'Suède', it: 'Svezia', nl: 'Zweden', nb: 'Sverige', pt: 'Suécia', es: 'Suecia', is: 'Svíþjóð' },
  LV: { en: 'Latvia', de: 'Lettland', fr: 'Lettonie', it: 'Lettonia', nl: 'Letland', nb: 'Latvia', pt: 'Letónia', es: 'Letonia', is: 'Lettland' },
  PL: { en: 'Poland', de: 'Polen', fr: 'Pologne', it: 'Polonia', nl: 'Polen', nb: 'Polen', pt: 'Polónia', es: 'Polonia', is: 'Pólland' },
};

// Typed beside a city to say which one is meant: "Lindau Deutschland".
const COUNTRY_WORDS: Record<CoveredCountry, string[]> = {
  CH: ['switzerland', 'schweiz', 'suisse', 'svizzera', 'zwitserland', 'sveits', 'suica', 'suiza', 'sviss'],
  FR: ['france', 'frankreich', 'francia', 'frankrijk', 'frankrike', 'franca', 'frakkland'],
  DE: ['germany', 'deutschland', 'allemagne', 'germania', 'duitsland', 'tyskland', 'alemanha', 'alemania', 'thyskaland'],
  IT: ['italy', 'italia', 'italie', 'italien'],
  BE: ['belgium', 'belgien', 'belgique', 'belgio', 'belgie', 'belgia', 'belgica'],
  NO: ['norway', 'norwegen', 'norvege', 'norvegia', 'noorwegen', 'norge', 'noruega', 'noregur'],
  GB: ['uk', 'britain', 'england', 'scotland', 'wales', 'angleterre', 'inghilterra', 'engeland', 'storbritannia', 'grossbritannien',
    'inglaterra', 'bretland'],
  PT: ['portugal', 'portogallo'],
  ES: ['spain', 'spanien', 'espagne', 'spagna', 'spanje', 'spania', 'espanha', 'espana', 'spann'],
  IS: ['iceland', 'island', 'islande', 'islanda', 'ijsland', 'islandia'],
  SE: ['sweden', 'schweden', 'suede', 'svezia', 'zweden', 'sverige', 'suecia', 'svithjod'],
  LV: ['latvia', 'lettland', 'lettonie', 'lettonia', 'letland', 'letonia', 'latvija'],
  PL: ['poland', 'polen', 'pologne', 'polonia', 'polland', 'polska'],
};

// What the Swiss cities are called in the other languages of the app, and how
// they are typed without an umlaut. The regional catalogues carry their own aliases.
const SWISS_ALIASES: Record<string, string[]> = {
  'ch:basel': ['Bâle', 'Basilea', 'Basle'],
  'ch:bern': ['Berne', 'Berna'],
  'ch:biel': ['Biel', 'Bienne', 'Bienna'],
  'ch:schaffhausen': ['Schaffhouse', 'Sciaffusa'],
  'ch:st-gallen': ['Sankt Gallen', 'Saint-Gall', 'San Gallo'],
  'ch:winterthur': ['Winterthour'],
  'ch:zug': ['Zoug', 'Zugo'],
  'ch:zurich': ['Zuerich', 'Zurigo'],
};

// The letters no accent can be stripped from are spelled out, so "Tromso",
// "Baerum", "Isafjordur" and "Wolomin" find Tromsø, Bærum, Ísafjörður and Wołomin.
const SPELLED_OUT: Record<string, string> = { ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', þ: 'th', ð: 'd', ł: 'l' };

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[ßæøœþðł]/g, letter => SPELLED_OUT[letter]).replace(/[^a-z0-9]+/g, ' ').trim();
}

const REGIONAL_ALIASES = new Map(REGIONAL_SCOOTER_CITIES.map(city => [city.id, city.aliases ?? []]));

// Every city with scooter data, Swiss ones included, with all the names it
// answers to: "Zürich" is also found as "Zurich", "Zuerich" and "Zurigo".
const CITIES = COVERED_CITIES.map(city => ({
  ...city,
  names: [city.city, ...(SWISS_ALIASES[city.id] ?? []), ...(REGIONAL_ALIASES.get(city.id) ?? [])]
    .map(name => normalize(name).split(' ')),
}));

export interface CityMatch {
  lat: number;
  lng: number;
  display_name: string;
  title: string;
  subtitle: string;
  covered: boolean;
}

/** A city with scooter data a query names, and whether it names it in full rather than by its start. */
export interface NamedCity {
  city: CityMatch;
  exact: boolean;
  country: CoveredCountry;
}

/**
 * The cities with scooter data that a query names, found without a geocoding
 * request: a city typed in full first, then those that only start like it, by name.
 * The second line is the country in the language asked for.
 */
export function searchCoveredCities(query: string, language: GeocodeLanguage = 'en'): CityMatch[] {
  return namedCities(query, language).map(({ city }) => city);
}

/** searchCoveredCities, saying of each city whether it was typed in full. */
export function namedCities(query: string, language: GeocodeLanguage = 'en'): NamedCity[] {
  const words = normalize(query).split(' ');
  const countries = Object.keys(COUNTRY_WORDS) as CoveredCountry[];
  const country = countries.find(code => COUNTRY_WORDS[code].some(word => words.includes(word)));
  const cityWords = words.filter(word => !Object.values(COUNTRY_WORDS).flat().includes(word));
  if (cityWords.join('').length < 2) return [];

  const typed = cityWords.join(' ');
  return CITIES
    .filter(city => (!country || country === city.country) && city.names.some(parts =>
      cityWords.every(word => parts.some(part => part.startsWith(word)))))
    .map(city => ({ city, exact: city.names.some(parts => parts.join(' ') === typed) }))
    .sort((a, b) => Number(b.exact) - Number(a.exact) || a.city.city.localeCompare(b.city.city))
    .slice(0, MAX_CITIES)
    .map(({ city, exact }) => ({
      city: {
        lat: city.center[0],
        lng: city.center[1],
        // Decoded by app versions that predate title and subtitle; those always received English.
        display_name: `${city.city}, ${COUNTRY_NAMES[city.country].en}`,
        title: city.city,
        subtitle: COUNTRY_NAMES[city.country][language],
        covered: isPointCovered(city.center[0], city.center[1]),
      },
      exact,
      country: city.country,
    }));
}

// Words that tie a city's name to the street before it: "10 Rue de Lyon" is no address in Lyon.
const LINKING_WORDS = new Set([
  'a', 'al', 'am', 'an', 'au', 'aux', 'bei', 'd', 'da', 'das', 'de', 'dei', 'del', 'della', 'der', 'des', 'di', 'do',
  'dos', 'du', 'en', 'im', 'in', 'l', 'la', 'le', 'les', 'of', 'sur', 'van', 'vom', 'von', 'y', 'zum', 'zur',
]);

// The names an address is placed in a city by. Not a name two cities go by, as
// Tenerife, nor a short name of the city's own that other towns also have:
// "Freiburg" is Freiburg im Breisgau's, and Fribourg's in German.
const ADDRESS_CITY_NAMES = (() => {
  const names = COVERED_CITIES.flatMap(city => {
    const own = normalize(city.city).split(' ');
    const shortened = (name: string[]) => name.length < own.length && name.every((part, index) => part === own[index]);
    const regional = (REGIONAL_ALIASES.get(city.id) ?? []).map(alias => normalize(alias).split(' ')).filter(name => !shortened(name));
    return [own, ...(SWISS_ALIASES[city.id] ?? []).map(alias => normalize(alias).split(' ')), ...regional]
      .map(parts => ({ center: city.center, id: city.id, parts }));
  });
  const cities = new Map<string, Set<string>>();
  for (const { id, parts } of names) cities.set(parts.join(' '), (cities.get(parts.join(' ')) ?? new Set()).add(id));
  return names.filter(({ parts }) => cities.get(parts.join(' '))?.size === 1);
})();

/**
 * An address typed with the city it is in, and the centre of that city:
 * "Bahnhofstrasse 10, Biel" is "Bahnhofstrasse 10" in Biel. The city is a city
 * with scooter data, written after a comma or after a house number, or first
 * and followed by a comma. Not "Via Roma" nor "Bristol Road": streets named
 * after a city, wherever they are.
 */
export function cityOfAddress(query: string): { address: string; center: [number, number] } | null {
  // Each word as written in the catalogue, with where it is in the query.
  const words = [...query.matchAll(/[\p{L}\p{M}\p{N}]+/gu)].flatMap(match => normalize(match[0]).split(' ').filter(Boolean)
    .map(word => ({ word, start: match.index, end: match.index + match[0].length })));
  const between = (before: number, after: number) => query.slice(words[before].end, words[after].start);
  const found = ADDRESS_CITY_NAMES.flatMap(({ center, parts }) => {
    const count = parts.length;
    if (count >= words.length) return [];
    const last = words.length - count;
    if (parts.every((part, index) => words[last + index].word === part)) {
      const address = query.slice(0, words[last].start).replace(/[^\p{L}\p{M}\p{N}]+$/u, '');
      const afterComma = between(last - 1, last).includes(',');
      const afterNumber = /\d/.test(address) && !LINKING_WORDS.has(words[last - 1].word);
      return afterComma || afterNumber ? [{ center, count, address }] : [];
    }
    if (parts.every((part, index) => words[index].word === part) && between(count - 1, count).includes(',')) {
      return [{ center, count, address: query.slice(words[count].start).trim() }];
    }
    return [];
  })
    // "Brighton and Hove" rather than "Hove".
    .sort((a, b) => b.count - a.count)[0];
  return found && found.address.length >= 2 ? { address: found.address, center: found.center } : null;
}
