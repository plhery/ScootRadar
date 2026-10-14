import { CATALOG_SYSTEMS } from '@/generated/countryCatalogs';
import { COUNTRY_NAMES, COUNTRY_SEARCH_WORDS, COUNTRY_SOURCES, type CatalogCountry } from '@/generated/countries';
import type { ProviderKey } from '@/generated/providers';
import type { MapBounds } from '@/lib/types';

// The countries, their catalogs and their sources come from data/countries.json:
// scripts/generate-provider-catalog.mjs writes src/generated/countries.ts.
export type ScooterCountry = CatalogCountry;
export { COUNTRY_SOURCES };
export type RegionalSource = typeof COUNTRY_SOURCES[ScooterCountry];
const COUNTRY_ALIASES = Object.fromEntries((Object.keys(COUNTRY_SOURCES) as ScooterCountry[])
  .map(country => [country, COUNTRY_SEARCH_WORDS[country]])) as Record<ScooterCountry, readonly string[]>;

export interface ScooterServiceArea {
  city: string;
  center: [number, number];
  bounds: MapBounds;
  aliases?: string[];
}
export interface RegionalScooterSystem extends ScooterServiceArea {
  id: string;
  country: ScooterCountry;
  provider: ProviderKey;
  discoveryUrl: string;
  /** Published subregions of a shared feed; fetched once, routed per city. */
  areas?: ScooterServiceArea[];
  /**
   * The operator whose feed this is, when it is not the provider's own: Pony's
   * feed lists Naolib Micromob's scooters in Nantes. Its prices are that
   * operator's, so none is shown, and the provider's link policy drops its links.
   */
  feedOperator?: ProviderKey;
}

// Reviewed public endpoints, never an unvalidated runtime registry download.
export const REGIONAL_SCOOTER_SYSTEMS = CATALOG_SYSTEMS as RegionalScooterSystem[];

export function serviceAreas(system: RegionalScooterSystem): ScooterServiceArea[] {
  return system.areas ?? [system];
}
export function regionalSource(system: RegionalScooterSystem) { return COUNTRY_SOURCES[system.country]; }
export function isRegionalSource(source: string): source is RegionalSource {
  return Object.values(COUNTRY_SOURCES).some(value => value === source);
}

/** The id of the city a system's service area is in: "no:Oslo". */
export function regionalCityId(system: RegionalScooterSystem, area: ScooterServiceArea) {
  return `${system.country.toLowerCase()}:${area.city}`;
}

// Merge each city's operator envelopes so overview health includes every operator.
const cities = new Map<string, ScooterServiceArea & { id: string; country: ScooterCountry }>();
for (const system of REGIONAL_SCOOTER_SYSTEMS) {
  for (const area of serviceAreas(system)) {
    const id = regionalCityId(system, area);
    const previous = cities.get(id);
    cities.set(id, { ...area, id, country: system.country,
      center: previous?.center ?? area.center,
      aliases: [...new Set([...(previous?.aliases ?? []), ...(area.aliases ?? [])])],
      bounds: previous ? {
        south: Math.min(previous.bounds.south, area.bounds.south), west: Math.min(previous.bounds.west, area.bounds.west),
        north: Math.max(previous.bounds.north, area.bounds.north), east: Math.max(previous.bounds.east, area.bounds.east),
      } : area.bounds,
    });
  }
}
export const REGIONAL_SCOOTER_CITIES = [...cities.values()];

// The letters no accent can be stripped from are spelled out, so "Tromso",
// "Baerum", "Isafjordur" and "Wolomin" find Tromsø, Bærum, Ísafjörður and Wołomin.
// Greek letters are kept, without their accents, and a final sigma is a sigma:
// "Ροδος" and "Ρόδοσ" find Ρόδος. A dotless ı is an i, so "Kıbrıs" finds Cyprus.
// Cyrillic letters are kept as well, without their marks, so "Київ" is found
// typed as "Киів" too.
const SPELLED_OUT: Record<string, string> = { ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', þ: 'th', ð: 'd', ł: 'l', ς: 'σ', ı: 'i' };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[ßæøœþðłςı]/g, letter => SPELLED_OUT[letter]).replace(/[^a-z0-9α-ωа-яёєіїґ]+/g, ' ').trim();
}

/** Local city navigation stays available without a geocoding network request. */
export function searchRegionalScooterCities(query: string, countries?: ScooterCountry[]) {
  const words = normalize(query).split(' ');
  const country = (Object.keys(COUNTRY_ALIASES) as ScooterCountry[])
    .find(code => COUNTRY_ALIASES[code].some(alias => words.includes(alias)));
  const cityWords = words.filter(word => !Object.values(COUNTRY_ALIASES).flat().includes(word));
  if (cityWords.join('').length < 2) return [];
  return REGIONAL_SCOOTER_CITIES.filter(city => (!countries || countries.includes(city.country)) &&
    (!country || country === city.country) && [city.city, ...(city.aliases ?? [])].some(name =>
      cityWords.every(word => normalize(name).split(' ').some(part => part.startsWith(word)))))
    .sort((a, b) => Number(normalize(b.city) === cityWords.join(' ')) - Number(normalize(a.city) === cityWords.join(' ')) || a.city.localeCompare(b.city))
    .slice(0, 5).map(city => ({ lat: city.center[0], lng: city.center[1],
      display_name: `${city.city}, ${COUNTRY_NAMES[city.country].en}` }));
}
