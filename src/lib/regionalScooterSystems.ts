import { CATALOG_SYSTEMS } from '@/generated/countryCatalogs';
import { COUNTRY_NAMES, COUNTRY_REGIONS, COUNTRY_SEARCH_WORDS, COUNTRY_SOURCES, type CatalogCountry } from '@/generated/countries';
import type { ProviderKey } from '@/generated/providers';
import { searchText, searchWords } from '@/lib/searchText';
import type { SeasonalPause } from '@/lib/seasonalPauses';
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
  /**
   * The state or province, "OR", in the countries that list theirs in data/countries.json, where
   * it is required. Set on a system, it is that of each of its areas that sets none.
   */
  region?: string;
  /**
   * The part of the year the area has no scooters, as Montréal each winter; see
   * seasonalPauses.ts. Set on a system, it is that of each of its areas that sets none.
   */
  seasonal?: SeasonalPause;
  /**
   * The IANA time zone of the town, "America/Chicago", by its name today: required in North
   * America, where it spans several. The feeds' own, US/Central or a wrong one, are never read.
   * Set on a system, it is that of each of its areas that sets none.
   */
  timeZone?: string;
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
  /**
   * Every station of the feed is a parking station where rides must end, though the feed says
   * neither: Vancouver makes riders end at the city's e-scooter stations, and Lime lists them as
   * plain stations, with no geofencing.
   */
  stationParking?: boolean;
  /**
   * Scooters also wait docked at the feed's stations, which its station status counts by type
   * and its vehicle status does not list: Divvy docks Lyft's scooters in Chicago. Each is shown at
   * its station, with no charge or range.
   */
  stationScooters?: boolean;
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

/**
 * The id of the city a system's service area is in: "no:Oslo", or, where the country has
 * regions, "us:or:Portland", so that Portland, Maine is another city.
 */
export function regionalCityId(system: RegionalScooterSystem, area: ScooterServiceArea) {
  const region = area.region ?? system.region;
  return region
    ? `${system.country.toLowerCase()}:${region.toLowerCase()}:${area.city}`
    : `${system.country.toLowerCase()}:${area.city}`;
}

export type RegionalScooterCity = Omit<ScooterServiceArea, 'seasonal' | 'timeZone'> & {
  id: string;
  country: ScooterCountry;
  /**
   * The seasonal pauses of the city's service areas, each once, when every one of them has
   * one: the city has no scooters while all of them hold.
   */
  pauses?: SeasonalPause[];
};

/**
 * One entry per city, its bounds enclosing every operator's envelope, so overview health
 * includes every operator. Its name is the one riders see, "Portland, OR" where the country's
 * names say the region; the town's own name is then one of its aliases.
 */
export function mergeCities(systems: readonly RegionalScooterSystem[], regions: typeof COUNTRY_REGIONS = COUNTRY_REGIONS) {
  const cities = new Map<string, RegionalScooterCity>();
  for (const system of systems) {
    for (const area of serviceAreas(system)) {
      const id = regionalCityId(system, area);
      const region = area.region ?? system.region;
      const name = region && regions[system.country]?.showInCityNames ? `${area.city}, ${region}` : area.city;
      const previous = cities.get(id);
      const pause = area.seasonal ?? system.seasonal;
      // One area without a pause has scooters all year, and so has the city.
      const pauses = pause && (!previous || previous.pauses)
        ? [...previous?.pauses ?? [], pause].filter((entry, index, all) => all.findIndex(other =>
          other.from === entry.from && other.until === entry.until && other.timeZone === entry.timeZone) === index)
        : undefined;
      const place: ScooterServiceArea = { ...area };
      delete place.seasonal;
      delete place.timeZone;
      cities.set(id, { ...place, id, city: name, country: system.country, ...(region ? { region } : {}),
        ...(pauses ? { pauses } : {}),
        center: previous?.center ?? area.center,
        aliases: [...new Set([...(previous?.aliases ?? []), ...(area.aliases ?? []), ...(name === area.city ? [] : [area.city])])],
        bounds: previous ? {
          south: Math.min(previous.bounds.south, area.bounds.south), west: Math.min(previous.bounds.west, area.bounds.west),
          north: Math.max(previous.bounds.north, area.bounds.north), east: Math.max(previous.bounds.east, area.bounds.east),
        } : area.bounds,
      });
    }
  }
  return [...cities.values()];
}
export const REGIONAL_SCOOTER_CITIES = mergeCities(REGIONAL_SCOOTER_SYSTEMS);

/** The country whose search words a query ends with, the longest such words, and the words before them: "Lindau Deutschland", "Portland United States". */
function countryAtEnd(words: readonly string[]): { country?: ScooterCountry; cityWords: readonly string[] } {
  let found: { country?: ScooterCountry; cityWords: readonly string[] } = { cityWords: words };
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES) as [ScooterCountry, readonly string[]][]) {
    for (const alias of aliases) {
      const aliasWords = alias.split(' ');
      const cityWords = words.slice(0, -aliasWords.length);
      if (aliasWords.length < words.length && cityWords.length < found.cityWords.length &&
        aliasWords.every((word, index) => words[cityWords.length + index] === word)) found = { country, cityWords };
    }
  }
  return found;
}

/** Local city navigation stays available without a geocoding network request. */
export function searchRegionalScooterCities(query: string, countries?: ScooterCountry[]) {
  const { country, cityWords } = countryAtEnd(searchWords(query));
  if (cityWords.join('').length < 2) return [];
  const byOwnName = (city: RegionalScooterCity) =>
    cityWords.every(word => searchWords(city.city).some(part => part.startsWith(word)));
  return REGIONAL_SCOOTER_CITIES.filter(city => (!countries || countries.includes(city.country)) &&
    (!country || country === city.country) && [city.city, ...(city.aliases ?? [])].some(name =>
      cityWords.every(word => searchWords(name).some(part => part.startsWith(word)))))
    // Typed in full first, then found by its own name rather than only by another, then by name.
    .sort((a, b) => Number(searchText(b.city) === cityWords.join(' ')) - Number(searchText(a.city) === cityWords.join(' ')) ||
      Number(byOwnName(b)) - Number(byOwnName(a)) || a.city.localeCompare(b.city))
    .slice(0, 5).map(city => ({ lat: city.center[0], lng: city.center[1],
      display_name: `${city.city}, ${COUNTRY_NAMES[city.country].en}` }));
}
