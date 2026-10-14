import { COUNTRY_NAMES, COUNTRY_REGIONS, COUNTRY_SEARCH_WORDS, type CountryCode } from '@/generated/countries';
import { COVERED_CITIES, isPointCovered, type CoveredCountry } from '@/lib/coveredCities';
import { REGIONAL_SCOOTER_CITIES } from '@/lib/regionalScooterSystems';

const MAX_CITIES = 5;

/** The languages the apps are shown in; a result's second line is written in the one asked for. */
export const GEOCODE_LANGUAGES = ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'] as const;
export type GeocodeLanguage = typeof GEOCODE_LANGUAGES[number];


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
// The state or province of a city in a country that lists them: "OR" for Portland, Oregon.
const REGIONS = new Map(REGIONAL_SCOOTER_CITIES.flatMap(city => city.region ? [[city.id, city.region] as const] : []));

// Every city with scooter data, Swiss ones included, with all the names it
// answers to: "Zürich" is also found as "Zurich", "Zuerich" and "Zurigo". A
// catalog's aliases are its city's other names: "NYC" and "Brooklyn" for New
// York, where its catalog gives them; "Portland, OR" answers to "Portland" too.
const CITIES = COVERED_CITIES.map(city => ({
  ...city,
  region: REGIONS.get(city.id),
  names: [city.city, ...(SWISS_ALIASES[city.id] ?? []), ...(REGIONAL_ALIASES.get(city.id) ?? [])]
    .map(name => normalize(name).split(' ')),
}));

/** A country, or a state or province of one, typed beside a city: "Lindau Deutschland", "Portland, OR". */
interface Qualifier {
  country: CountryCode;
  region?: string;
}

// What says which country or state a city is in, as typed: a country's words in
// the languages of the app, and a state's or a province's code and names. A
// table rather than Intl.DisplayNames, whose locale data is not a given on the
// server. All are in data/countries.json.
const QUALIFIERS = (() => {
  const qualifiers = new Map<string, Qualifier[]>();
  const add = (words: string, qualifier: Qualifier) => {
    const key = normalize(words);
    const known = qualifiers.get(key) ?? [];
    const same = known.some(({ country, region }) => country === qualifier.country && region === qualifier.region);
    if (key && !same) qualifiers.set(key, [...known, qualifier]);
  };
  for (const [country, words] of Object.entries(COUNTRY_SEARCH_WORDS) as [CountryCode, readonly string[]][]) {
    for (const word of words) add(word, { country });
  }
  for (const [country, regions] of Object.entries(COUNTRY_REGIONS) as [CountryCode, typeof COUNTRY_REGIONS[CountryCode]][]) {
    for (const { code, name, names } of regions?.list ?? []) {
      for (const words of [code, name, ...Object.values(names ?? {})]) add(words, { country, region: code });
    }
  }
  return qualifiers;
})();

// Names that end in what is also a country's or a state's name, and so say no
// country: Staten Island is no town in Iceland (Ísland), New England none in
// England, New Mexico none in Mexico. The names of the states and provinces are
// such names too, and those of the cities, but for a city in the country or
// state its name ends with: "Austin TX" is Austin in Texas, whichever way it is read.
const NAMES_OF_NO_CITY = [
  'Staten Island', 'Long Island', 'Rhode Island', 'Vancouver Island', 'Prince Edward Island', 'New England', 'New Mexico',
  'Ciudad de Mexico', 'Estado de Mexico', 'Baja California', 'West Virginia', 'Kansas City',
  ...Object.values(COUNTRY_REGIONS).flatMap(regions => (regions?.list ?? []).flatMap(({ name, names }) => [name, ...Object.values(names ?? {})])),
];
const KNOWN_NAMES = (() => {
  const known = new Map<string, ({ country: CountryCode; region?: string } | null)[]>();
  const add = (name: string, city: { country: CountryCode; region?: string } | null) => {
    if (name.includes(' ')) known.set(name, [...(known.get(name) ?? []), city]);
  };
  for (const name of NAMES_OF_NO_CITY) add(normalize(name), null);
  for (const city of CITIES) for (const parts of city.names) add(parts.join(' '), city);
  return known;
})();
const LONGEST_QUALIFIER = Math.max(1, ...[...QUALIFIERS.keys()].map(key => key.split(' ').length));
const LONGEST_KNOWN_NAME = Math.max(1, ...[...KNOWN_NAMES.keys()].map(name => name.split(' ').length));

/** How many words at the end of a part of a query say a country or a state: those of the longest such name, unless a longer name known otherwise ends the part. */
function qualifierAtEnd(part: readonly string[]): number {
  let count = Math.min(LONGEST_QUALIFIER, part.length);
  while (count > 0 && !QUALIFIERS.has(part.slice(-count).join(' '))) count--;
  const qualifier = QUALIFIERS.get(part.slice(-count).join(' '));
  for (let longer = count + 1; qualifier && longer <= Math.min(LONGEST_KNOWN_NAME, part.length); longer++) {
    const owners = KNOWN_NAMES.get(part.slice(-longer).join(' ')) ?? [];
    if (owners.some(city => !city || !inQualified([qualifier], city))) return 0;
  }
  return count;
}

/** A word of a query, as the catalogue writes it, with where it is in the query. */
interface QueryWord {
  word: string;
  start: number;
  end: number;
  /** Whether a comma comes before it. */
  afterComma: boolean;
}

// Initials written with full stops are one word: "D.C." is DC, "U.S.A." is USA.
function joinInitials(query: string): string {
  return query.replace(/(?<![\p{L}\p{N}])(\p{L})\.(?=\p{L}(?:\.|(?![\p{L}\p{N}])))/gu, '$1');
}

function queryWords(query: string): QueryWord[] {
  let previousEnd = 0;
  return [...query.matchAll(/[\p{L}\p{M}\p{N}]+/gu)].flatMap(match => {
    const afterComma = query.slice(previousEnd, match.index).includes(',');
    previousEnd = match.index + match[0].length;
    return normalize(match[0]).split(' ').filter(Boolean)
      .map((word, index) => ({ word, start: match.index, end: previousEnd, afterComma: afterComma && index === 0 }));
  });
}

/**
 * The countries and states typed at the end of a query, up to two of them, and
 * how many of its words come before them: "Portland, OR, USA" is Portland in
 * Oregon in the US. A country or a state is said only at the end, and after a
 * place: "Staten Island" is no place in Iceland, nor "Washington" alone the state.
 */
function qualifiersAtEnd(words: readonly QueryWord[]): { count: number; qualifiers: Qualifier[][] } {
  let count = words.length;
  const qualifiers: Qualifier[][] = [];
  while (qualifiers.length < 2) {
    let partStart = count - 1;
    while (partStart > 0 && !words[partStart].afterComma) partStart--;
    const part = words.slice(Math.max(0, partStart), count).map(({ word }) => word);
    const length = qualifierAtEnd(part);
    if (!length || length >= count) break;
    const options = QUALIFIERS.get(part.slice(-length).join(' '))!;
    // A state before its country, not before another state: "Washington, DC" is no city in two states.
    if (qualifiers.length && !options.some(option => option.region &&
      qualifiers[0].some(({ country, region }) => !region && country === option.country))) break;
    qualifiers.push(options);
    count -= length;
  }
  return { count, qualifiers };
}

/** Whether a city is in every country or state typed beside it. */
function inQualified(qualifiers: readonly Qualifier[][], city: { country: CountryCode; region?: string }): boolean {
  return qualifiers.every(options => options.some(({ country, region }) =>
    country === city.country && (!region || region === city.region)));
}

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
  const words = queryWords(joinInitials(query));
  const { count, qualifiers } = qualifiersAtEnd(words);
  const find = (cityWords: string[], within: Qualifier[][]) => cityWords.join('').length < 2 ? [] : CITIES
    .filter(city => inQualified(within, city) && city.names.some(parts =>
      cityWords.every(word => parts.some(part => part.startsWith(word)))));
  const qualified = words.slice(0, count).map(({ word }) => word);
  // What is typed with a country or a state none of its cities starts like is
  // read whole: "Pilar de la" is on its way to Pilar de la Horadada, not in Louisiana.
  let cityWords = qualified;
  let found = find(qualified, qualifiers);
  if (!found.length && qualifiers.length) {
    cityWords = words.map(({ word }) => word);
    found = find(cityWords, []);
  }

  const typed = cityWords.join(' ');
  return found
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

interface AddressCityName {
  center: [number, number];
  id: string;
  country: CountryCode;
  region?: string;
  parts: string[];
}

// The names an address is placed in a city by: its own, without the state that
// may follow it ("Portland" for "Portland, OR"), and its other names. Not a short
// name of its own that other towns also have: "Freiburg" is Freiburg im Breisgau's,
// and Fribourg's in German.
const ADDRESS_NAMES: AddressCityName[] = CITIES.flatMap(city => {
  const town = city.region && city.city.endsWith(`, ${city.region}`) ? city.city.slice(0, -city.region.length - 2) : city.city;
  const own = normalize(town).split(' ');
  const shortened = (name: string[]) => name.length < own.length && name.every((part, index) => part === own[index]);
  const regional = (REGIONAL_ALIASES.get(city.id) ?? []).map(alias => normalize(alias).split(' ')).filter(name => !shortened(name));
  return [own, ...(SWISS_ALIASES[city.id] ?? []).map(alias => normalize(alias).split(' ')), ...regional]
    .map(parts => ({ center: city.center, id: city.id, country: city.country, region: city.region, parts }));
});

/** The names that are one city's only: not Tenerife, the name of two, nor Portland, unless a state says which. */
function ownNames(names: readonly AddressCityName[]): AddressCityName[] {
  const cities = new Map<string, Set<string>>();
  for (const { id, parts } of names) cities.set(parts.join(' '), (cities.get(parts.join(' ')) ?? new Set()).add(id));
  return names.filter(({ parts }) => cities.get(parts.join(' '))?.size === 1);
}
const ADDRESS_CITY_NAMES = ownNames(ADDRESS_NAMES);

// A US ZIP code or a Canadian postal code at the end of an address, after its state or province: "TX 78701", "ON M5V 2T6".
const POSTCODE_AT_END = /[\s,]+(?:\d{5}(?:-\d{4})?|[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d)\s*$/;

/**
 * An address typed with the city it is in, and the centre of that city:
 * "Bahnhofstrasse 10, Biel" is "Bahnhofstrasse 10" in Biel. The city is a city
 * with scooter data, written after a comma or after a house number, or first
 * and followed by a comma; its state or country and a US or Canadian postcode
 * may follow it, and say which of two towns of a name it is. Not "Via Roma" nor
 * "Bristol Road": streets named after a city, wherever they are.
 */
export function cityOfAddress(typed: string): { address: string; center: [number, number] } | null {
  const query = joinInitials(typed);
  // "1100 Congress Ave, Austin, TX 78701" and "Queen St W, Toronto, ON M5V 2T6": the city before its state and postcode.
  const withoutPostcode = query.replace(POSTCODE_AT_END, '');
  const words = queryWords(withoutPostcode);
  const { count, qualifiers } = qualifiersAtEnd(words);
  if (qualifiers.length) {
    const names = ownNames(ADDRESS_NAMES.filter(name => inQualified(qualifiers, name)));
    const inCity = addressIn(withoutPostcode.slice(0, words[count].start), names, true);
    if (inCity) return inCity;
  }
  return addressIn(query, ADDRESS_CITY_NAMES, false);
}

/** An address typed with one of these cities; with a state or a country after it, when qualified. */
function addressIn(query: string, names: readonly AddressCityName[], qualified: boolean): { address: string; center: [number, number] } | null {
  const words = queryWords(query);
  const between = (before: number, after: number) => query.slice(words[before].end, words[after].start);
  const found = names.flatMap(({ center, parts }) => {
    const count = parts.length;
    if (count >= words.length) return [];
    // A city named as a state or a country is that city, with no state after it, only after a house number:
    // "1600 Pennsylvania Ave, Washington" is in Washington, DC, and "Seattle, Washington" in the state.
    const alsoQualifier = !qualified && QUALIFIERS.has(parts.join(' '));
    const last = words.length - count;
    if (parts.every((part, index) => words[last + index].word === part)) {
      const address = query.slice(0, words[last].start).replace(/[^\p{L}\p{M}\p{N}]+$/u, '');
      const afterComma = between(last - 1, last).includes(',');
      const afterNumber = /\d/.test(address) && !LINKING_WORDS.has(words[last - 1].word);
      return (afterComma && !alsoQualifier) || afterNumber ? [{ center, count, address }] : [];
    }
    if (parts.every((part, index) => words[index].word === part) && between(count - 1, count).includes(',')) {
      const address = query.slice(words[count].start).trim();
      return !alsoQualifier || /\d/.test(address) ? [{ center, count, address }] : [];
    }
    return [];
  })
    // "Brighton and Hove" rather than "Hove".
    .sort((a, b) => b.count - a.count)[0];
  return found && found.address.length >= 2 ? { address: found.address, center: found.center } : null;
}
