import frenchCatalog from '../../data/french-scooter-feeds.json';
import germanCatalog from '../../data/german-scooter-feeds.json';
import italianCatalog from '../../data/italian-scooter-feeds.json';
import belgianCatalog from '../../data/belgian-scooter-feeds.json';
import norwegianCatalog from '../../data/norwegian-scooter-feeds.json';
import britishCatalog from '../../data/british-scooter-feeds.json';
import portugueseCatalog from '../../data/portuguese-scooter-feeds.json';
import spanishCatalog from '../../data/spanish-scooter-feeds.json';
import icelandicCatalog from '../../data/icelandic-scooter-feeds.json';
import type { ProviderKey } from '@/generated/providers';
import type { MapBounds } from '@/lib/types';

export type ScooterCountry = 'FR' | 'DE' | 'IT' | 'BE' | 'NO' | 'GB' | 'PT' | 'ES' | 'IS';
export const COUNTRY_SOURCES = {
  FR: 'france', DE: 'germany', IT: 'italy', BE: 'belgium', NO: 'norway', GB: 'uk', PT: 'portugal', ES: 'spain', IS: 'iceland',
} as const;
export type RegionalSource = typeof COUNTRY_SOURCES[ScooterCountry];
const COUNTRY_NAMES = {
  FR: 'France', DE: 'Germany', IT: 'Italy', BE: 'Belgium', NO: 'Norway', GB: 'United Kingdom', PT: 'Portugal', ES: 'Spain', IS: 'Iceland',
};
const COUNTRY_ALIASES = { FR: ['france', 'frankreich', 'francia', 'frankrijk', 'frankrike', 'franca', 'frakkland'],
  DE: ['germany', 'deutschland', 'allemagne', 'germania', 'duitsland', 'tyskland', 'alemanha', 'alemania', 'thyskaland'],
  IT: ['italy', 'italia', 'italie', 'italien'],
  BE: ['belgium', 'belgien', 'belgique', 'belgio', 'belgie', 'belgia', 'belgica'],
  NO: ['norway', 'norwegen', 'norvege', 'norvegia', 'noorwegen', 'norge', 'noruega', 'noregur'],
  GB: ['uk', 'britain', 'england', 'scotland', 'wales', 'angleterre', 'inghilterra', 'engeland', 'storbritannia', 'grossbritannien',
    'inglaterra', 'bretland'],
  PT: ['portugal', 'portogallo'],
  ES: ['spain', 'spanien', 'espagne', 'spagna', 'spanje', 'spania', 'espanha', 'espana', 'spann'],
  IS: ['iceland', 'island', 'islande', 'islanda', 'ijsland', 'islandia'] };

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
}

// Reviewed public endpoints, never an unvalidated runtime registry download.
export const REGIONAL_SCOOTER_SYSTEMS = [
  ...frenchCatalog.systems.map(system => ({ ...system, country: 'FR' })),
  ...germanCatalog.systems, ...italianCatalog.systems,
  ...belgianCatalog.systems, ...norwegianCatalog.systems, ...britishCatalog.systems,
  ...portugueseCatalog.systems, ...spanishCatalog.systems, ...icelandicCatalog.systems,
] as RegionalScooterSystem[];

export function serviceAreas(system: RegionalScooterSystem): ScooterServiceArea[] {
  return system.areas ?? [system];
}
export function regionalSource(system: RegionalScooterSystem) { return COUNTRY_SOURCES[system.country]; }
export function isRegionalSource(source: string): source is RegionalSource {
  return Object.values(COUNTRY_SOURCES).some(value => value === source);
}

// Merge each city's operator envelopes so overview health includes every operator.
const cities = new Map<string, ScooterServiceArea & { id: string; country: ScooterCountry }>();
for (const system of REGIONAL_SCOOTER_SYSTEMS) {
  for (const area of serviceAreas(system)) {
    const id = `${system.country.toLowerCase()}:${area.city}`;
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
// "Baerum" and "Isafjordur" find Tromsø, Bærum and Ísafjörður.
const SPELLED_OUT: Record<string, string> = { ß: 'ss', æ: 'ae', ø: 'o', œ: 'oe', þ: 'th', ð: 'd' };

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[ßæøœþð]/g, letter => SPELLED_OUT[letter]).replace(/[^a-z0-9]+/g, ' ').trim();
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
      display_name: `${city.city}, ${COUNTRY_NAMES[city.country]}` }));
}
