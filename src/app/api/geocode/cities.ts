import { COUNTRY_NAMES, COUNTRY_SEARCH_WORDS } from '@/generated/countries';
import { COVERED_CITIES, isPointCovered, type CoveredCountry } from '@/lib/coveredCities';
import { REGIONAL_SCOOTER_CITIES } from '@/lib/regionalScooterSystems';

const MAX_CITIES = 5;

/** The languages the apps are shown in; a result's second line is written in the one asked for. */
export const GEOCODE_LANGUAGES = ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'] as const;
export type GeocodeLanguage = typeof GEOCODE_LANGUAGES[number];

// A table rather than Intl.DisplayNames, whose locale data is not a given on the server;
// typed beside a city, a country's words say which one is meant: "Lindau Deutschland".
// Both are in data/countries.json.
const COUNTRY_WORDS = COUNTRY_SEARCH_WORDS;

// What the Swiss cities are called in the other languages of the app, and how
// they are typed without an umlaut. The regional catalogues carry their own aliases.
const SWISS_ALIASES: Record<string, string[]> = {
  'ch:basel': ['Bâle', 'Basilea', 'Basle'],
  'ch:bern': ['Berne', 'Berna'],
  'ch:biel': ['Biel', 'Bienne', 'Bienna'],
  'ch:lichtensteig': ['Toggenburg', 'Wattwil'],
  'ch:schaffhausen': ['Schaffhouse', 'Sciaffusa'],
  'ch:st-gallen': ['Sankt Gallen', 'Saint-Gall', 'San Gallo'],
  'ch:wadenswil': ['Waedenswil', 'Richterswil'],
  'ch:wil': ['Wil SG', 'Bronschhofen'],
  'ch:winterthur': ['Winterthour'],
  'ch:zug': ['Zoug', 'Zugo'],
  'ch:zurich': ['Zuerich', 'Zurigo'],
};

// The letters no accent can be stripped from are spelled out, so "Tromso",
// "Baerum", "Isafjordur" and "Wolomin" find Tromsø, Bærum, Ísafjörður and Wołomin.
// Greek letters are kept, without their accents, and a final sigma is a sigma:
// "Ροδος" and "Ρόδοσ" find Ρόδος. A dotless ı is an i, so "Kıbrıs" finds Cyprus.
// Cyrillic letters are kept as well, without their marks, so "Київ" is found
// typed as "Киів" too.
const SPELLED_OUT: Record<string, string> = { ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', þ: 'th', ð: 'd', ł: 'l', ς: 'σ', ı: 'i' };

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[ßæøœþðłςı]/g, letter => SPELLED_OUT[letter]).replace(/[^a-z0-9α-ωа-яёєіїґ]+/g, ' ').trim();
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
