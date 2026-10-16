import { getCloudflareContext } from '@opennextjs/cloudflare';
import { BodyTooLargeError, readJsonBody } from '@/lib/readJsonBody';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAllows } from '@/lib/rateLimit';
import { isPointCovered } from '@/lib/coveredCities';
import { haversineM } from '@/lib/geo';
import { COUNTRY_ANCHORS, COUNTRY_CONTINENTS, COUNTRY_REGIONS, type Continent, type CountryCode } from '@/generated/countries';
import { searchWords, westernDigits } from '@/lib/searchText';
import { streetAddress, townLine } from './addressFormats';
import {
  catalogTownName, cityOfAddress, GEOCODE_LANGUAGES, namedCities, qualifiedQuery, wordsNaming,
  type GeocodeLanguage, type NamedCity, type QualifiedQuery,
} from './cities';

const MAX_QUERY_LENGTH = 160;
const MAX_RESULTS = 5;
// One search, however many services it asks.
const GEOCODE_TIMEOUT_MS = 10_000;

// Places where the app has cities, from OpenStreetMap: Geoapify where GEOAPIFY_API_KEY is
// set, Photon where it is not or when Geoapify cannot answer or finds nothing (searchPlaces).
const GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';
// Geoapify answers in about a second, an address with its house number in up to
// three: one that takes longer leaves Photon the rest of the search's time.
const GEOAPIFY_TIMEOUT_MS = 5_000;
// Geoapify finds what is close to the map centre, as "Hauptbahnhof" in Munich, only
// when asked for nothing farther. It is asked again without the limit when none of
// what it finds there is what was typed: "Kolosseum Rom" from Zürich.
const NEARBY_SEARCH_M = 50_000;
// How far from a city's centre an address typed with the city is looked for.
const CITY_SEARCH_M = 15_000;
// Towns are waited for as long as places are, or this long after both were asked for.
const TOWN_WAIT_MS = 1_500;
// Far more than are shown, so that places with scooter data can be ranked first.
const GEOAPIFY_RESULT_LIMIT = 20;
// Geoapify's kinds of place as Photon names them. Not the centres of counties,
// regions and countries: no place to ride from.
const GEOAPIFY_TYPES: Record<string, string> = {
  amenity: 'house',
  building: 'house',
  street: 'street',
  suburb: 'district',
  district: 'district',
  city: 'city',
  postcode: 'other',
  unknown: 'other',
};
// komoot's public Photon, unless PHOTON_API_URL names our own (photonService).
const PUBLIC_PHOTON_URL = 'https://photon.komoot.io/api/';
// Our own Photon answers in a fraction of a second: one that takes longer is
// left for the public one.
const OWN_PHOTON_TIMEOUT_MS = 3_000;
const PHOTON_RESULT_LIMIT = 15;
// The languages Photon names places in; in the others, places keep their local names.
const PHOTON_LANGUAGES = ['de', 'en', 'fr'] as const;
// Not the centres of counties, regions and countries.
const PHOTON_LAYERS = ['house', 'street', 'locality', 'district', 'city', 'other'];
// The parts of the world where the app may have cities, by continent:
// - Australia and New Zealand, without the Chatham Islands;
// - West Asia, from Israel to the Gulf and Yemen, and East Asia, from Burma to
//   Japan and from Hokkaido to Java; Cyprus, north of 34°N, is in Europe's;
// - North America, from Hawaii and Alaska to Newfoundland and from the Arctic
//   to Mexico's southern border;
// - Europe, from the Azores and the Canaries to the North Cape, without Africa south
//   of 34°N, from the coast facing the Canaries to Sinai: Egypt, Libya and the south
//   of Morocco, Algeria and Tunisia. Cyprus, Crete and Malta are north of it.
// A point is in the first it is in: Israel in West Asia's, not in Europe's.
// Only those with the anchor of a country of data/countries.json are searched.
// Photon is asked within the one around the map centre; Geoapify is not, as in a
// rectangle that large it finds nothing for "Via Roma 10", nor in a list of
// Europe's countries "Gare de Lyon" near Paris: the places of both outside are
// left out instead (servedPlace).
const CONTINENT_BOXES: Record<Continent, Box[]> = {
  oceania: [{ west: 110, south: -48, east: 180, north: -9 }],
  asia: [{ west: 34, south: 12, east: 60, north: 34 }, { west: 95, south: -11, east: 150, north: 46 }],
  'north-america': [{ west: -170, south: 14, east: -50, north: 72 }],
  europe: [{ west: -32, south: 27.5, east: 45, north: 72, without: [{ west: -13.2, south: 27.5, east: 34, north: 34 }] }],
};
const BOXES = (Object.entries(CONTINENT_BOXES) as [Continent, Box[]][])
  .flatMap(([continent, boxes]) => boxes.map(box => ({ continent, box })));
const SERVED_BOXES = BOXES.map(({ box }) => box)
  .filter(box => Object.values(COUNTRY_ANCHORS).some(([lat, lng]) => inBox(box, lat, lng)));
// Distance to the map centre counts for more than prominence: "Bahnhofstrasse 1"
// near Zürich is the one in Zürich, not the better-known station in Goldau.
const PHOTON_BIAS_SCALE = '0.1';
// How far a place is from the map centre: within a short ride, within the city around it, or farther.
const CLOSE_M = 5_000;
const NEARBY_M = 30_000;
// A station, its building and its platforms under one name: within this of each
// other, or of the outline of one, they are one place. The Dubai Mall and its bus
// stop of that name, 300 m from its middle but inside it, are one; two shops of a
// chain 300 m apart are two.
const SAME_PLACE_M = 250;
// A landmark's outline, not a region's: across 180°, or larger than this, it is none.
const MAX_OUTLINE_DEGREES = 1;
// Whose places Geoapify favours without a map centre, when the app does not say where the rider is.
const DEFAULT_HOME = 'CH';

interface Box {
  west: number;
  south: number;
  east: number;
  north: number;
  /** What is left out of it. */
  without?: Box[];
}

interface PhotonFeature {
  geometry?: { coordinates?: unknown };
  properties?: Record<string, unknown>;
}

interface PhotonResponse {
  features?: PhotonFeature[];
}

interface GeoapifyResponse {
  results?: unknown[];
}

/** One search, as the services are asked it. */
interface Search {
  /** As typed: Geoapify and Photon read ß themselves. */
  query: string;
  language: GeocodeLanguage;
  /** The words typed, by which places are ranked. */
  typed: string[];
  /** The same, when they end with a state or a country: a place in it is named by the words before them. */
  qualified: QualifiedQuery | null;
  /** Where places come first: the map centre, or the city an address was typed with. */
  near: [number, number] | null;
  /** The country whose places come first without a centre: that of the device's time zone, or Switzerland. */
  home: string;
  /** An address typed with its city, without the city: "Bahnhofstrasse 10" for "Bahnhofstrasse 10, Biel". */
  address: string | null;
}

/** What places are ranked from: where they come first, and the country that does without a centre. */
type From = Pick<Search, 'near' | 'home'>;
/** What places are ranked by: what was typed, and where they come first. */
type Ranking = Pick<Search, 'typed' | 'qualified'> & From;

interface GeocodeInput {
  query: string;
  requestedLanguage: string;
  /** The centre of the map, when it shows a city or less: places near it come first. */
  near: [number, number] | null;
  /** The country of the device's time zone, sent without a centre: its places come first. */
  country: string | null;
}

interface GeocodePlace {
  lat: number;
  lng: number;
  display_name: string;
  title: string;
  subtitle: string;
  covered: boolean;
}

/** Where a place ranks for what was typed, lower first, and what was found in it. */
interface Ranked {
  rank: number;
  /** A town found by its name or by the start of it. */
  town: boolean;
  /** Found for something other than what was typed. */
  miss: boolean;
  /** Named as typed: a town by any of its names, another place by its own. */
  named: boolean;
  /** How far it is from what the map shows (remoteness). */
  remoteness: 0 | 1 | 2;
}

interface Candidate extends Ranked {
  place: GeocodePlace;
  /** A city with scooter data, from our own list of them. */
  listed?: boolean;
  /** The outline of a landmark, a building or a shop, as a box: what lies in it, of its name, is part of it. */
  outline?: Box;
}

/** The places the services asked found, and their names. */
interface Found {
  sources: ('Geoapify' | 'Photon')[];
  candidates: Candidate[];
}

type UpstreamFailure = 'rateLimited' | 'timedOut' | 'unavailable' | 'invalid';

// Left out before a name of more words, in what is typed and in the names of places:
// "Dubai Mall" names The Dubai Mall, and "Havre" Le Havre. Not a letter alone, as the
// "A" of A Coruña.
const ARTICLES = new Set(['the', 'le', 'la', 'les', 'l', 'el', 'los', 'las', 'il', 'lo', 'gli', 'der', 'die', 'das', 'de', 'het']);

function withoutArticle(words: string[]): string[] {
  return words.length > 1 && ARTICLES.has(words[0]) ? words.slice(1) : words;
}

/** The same words, in any order: "Flughafen Zürich" names "Zürich Flughafen". */
function sameWords(a: string[], b: string[]): boolean {
  return a.length === b.length && [...a].sort().join(' ') === [...b].sort().join(' ');
}

/** The words of a place's name as it may be typed: "Zürich" as "zurich" and, with its umlaut spelled out, "zuerich".
    What is typed is read as it is: "Joel" does not start Joliet, nor "Blue" Bluff. */
function placeSpellings(text: string): string[][] {
  const spelledOut = text.normalize('NFD').replace(/([aouAOU])\u0308/g, '$1e');
  const words = searchWords(text);
  const umlauts = searchWords(spelledOut);
  return umlauts.join(' ') === words.join(' ') ? [words] : [words, umlauts];
}

// Towns typed by their names come first, then towns whose names start as typed,
// then the other places, then what was found for something other than what was typed.
const STARTED_TOWN_RANK = 9;
const PLACE_RANK = 18;
const MISS_RANK = 36;

/** Where a place ranks for what was typed. A near miss is what Geoapify was not sure bears all that was typed. */
function placeRank(
  typed: string[],
  place: GeocodePlace,
  town: boolean,
  nearMiss: boolean,
  country: string,
  from: From
): Ranked {
  const spellings = placeSpellings(place.title);
  const title = spellings.flat();
  const named = spellings.some(words => sameWords(words, typed) || sameWords(withoutArticle(words), withoutArticle(typed)));
  const words = [...title, ...placeSpellings(place.subtitle).flat()];
  const atWordStart = typed.every(word => words.some(candidate => candidate.startsWith(word)));
  // What the services found by another of its names is no typing mistake, and a
  // town found so, typed in full, was typed by that name: "Milano" for Milan. Not
  // by a number: Geoapify finds Pompei for "8004", the start of its postcode. Nor
  // by three letters, which may be the start of another name: Bärschwil for "Ber".
  // Nor on another continent than the one looked at: from Zürich, "Mailand" is
  // Milan, and the Maitlands of Nova Scotia and Missouri Geoapify is as sure of are not.
  const namedOtherwise = !atWordStart && spellings[0].length === typed.length && typed.join('').length > 3 &&
    !typed.some(word => /\d/.test(word)) && onLookedAtContinent(place, from);
  // A town typed by its name is what was asked for, with scooter data or without;
  // one whose name starts as typed may be: "Laus" is on its way to Lausanne. By
  // its own name: Burgdorf is in the canton of Bern, not on the way to it.
  const started = typed.every(word => title.some(candidate => candidate.startsWith(word)));
  const distance = remoteness(place, country, from);
  if (town && (named || namedOtherwise || started)) {
    return { rank: townRank(named || namedOtherwise, place, country, from), town: true, miss: false, named: named || namedOtherwise, remoteness: distance };
  }
  const match = named ? 0 : atWordStart ? 1 : 2;
  // "Zürichstrasse" for "Zürich HB"; not "Rue de Rivoli" for "Rue de Rivoli 10",
  // the street of the address typed, whose number Geoapify did not find.
  const street = typed.filter(word => !/\d/.test(word));
  const ofAddress = street.length > 0 && street.length < typed.length &&
    street.every(word => words.some(candidate => candidate.startsWith(word)));
  const miss = nearMiss && match === 2 && !ofAddress;
  // Near the map centre first, then with scooter data, then named as typed: each outweighs those after it.
  const rank = (miss ? MISS_RANK : PLACE_RANK) + distance * 6 + (place.covered ? 0 : 3) + match;
  return { rank, town: false, miss, named, remoteness: distance };
}

/** Where a town ranks: typed by its name before started; the cities of our list
    first, then the others; the nearest first, then those with scooter data. */
function townRank(named: boolean, place: GeocodePlace, country: string, from: From, listed = false): number {
  const distance = remoteness(place, country, from);
  return (named ? 0 : STARTED_TOWN_RANK) + (listed ? distance : 3 + distance * 2 + (place.covered ? 0 : 1));
}

/**
 * The cities of our list found, towns of one name ordered by how far each is from the map, or
 * with the rider's country's first: over Auckland, "Christchurch" is New Zealand's before
 * England's, though both are farther than a town's ranks tell apart.
 */
function namesakesNearestFirst(listed: NamedCity[], { near, home }: From): NamedCity[] {
  const away = ({ city, country }: NamedCity) => near ? haversineM(near[0], near[1], city.lat, city.lng) : country === home ? 0 : 1;
  const byTitle = new Map<string, NamedCity[]>();
  for (const found of listed) byTitle.set(found.city.title, [...(byTitle.get(found.city.title) ?? []), found]);
  for (const namesakes of byTitle.values()) namesakes.sort((a, b) => away(a) - away(b));
  return listed.map(({ city }) => byTitle.get(city.title)!.shift()!);
}

/** Whether a place is on the continent the map shows, or that of the rider's country without a map centre. */
function onLookedAtContinent(place: GeocodePlace, { near, home }: From): boolean {
  const lookedAt = near ? continentAt(near[0], near[1]) : COUNTRY_CONTINENTS[home as CountryCode];
  return !lookedAt || continentAt(place.lat, place.lng) === lookedAt;
}

/** How far a place is from what the map shows: within a short ride of its centre, in the city around it, or farther. */
function remoteness(place: GeocodePlace, country: string, { near, home }: From): 0 | 1 | 2 {
  // Without a map centre, the country of the device's time zone is near; Switzerland
  // where the app does not say, as in iOS apps from before they sent either.
  if (!near) return country === home ? 0 : 1;
  const distance = haversineM(near[0], near[1], place.lat, place.lng);
  return distance <= CLOSE_M ? 0 : distance <= NEARBY_M ? 1 : 2;
}

function errorResponse(message: string, status: number, retryAfter?: string) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        'Cache-Control': 'private, no-store',
        ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
      },
    }
  );
}

type Upstream<T> = { ok: true; value: T } | { ok: false; failure: UpstreamFailure };

function validCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

async function fetchJson(url: URL, headers: Record<string, string>, timeoutMs: number): Promise<Upstream<unknown>> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'scootradar/2.0 (scootradar.com)', ...headers },
      signal: AbortSignal.timeout(Math.max(0, timeoutMs)),
    });
    if (response.status === 429) return { ok: false, failure: 'rateLimited' };
    if (!response.ok) return { ok: false, failure: 'unavailable' };
    return { ok: true, value: await response.json() };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    return { ok: false, failure: timedOut ? 'timedOut' : 'unavailable' };
  }
}

/** The Worker's settings; none outside it. */
async function workerSettings(): Promise<Record<string, unknown>> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return env as CloudflareEnv & Record<string, unknown>;
  } catch {
    return {};
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

/** The code of a place's state or province, where its country writes it after the town: "TX" for Texas, "QC" for Québec. */
function regionCode(properties: Record<string, unknown>, countryCode: string): string {
  const state = text(properties.state);
  const regions = COUNTRY_REGIONS[countryCode as CountryCode]?.list ?? [];
  return text(properties.statecode)
    || regions.find(({ name, names }) => [name, ...Object.values(names ?? {})].includes(state))?.code
    || state;
}

const LATIN = /\p{Script=Latin}/u;

/** The town of a place, in the script of the apps' languages where Photon and Geoapify name it in another:
    the catalog's name for a town of its own, "Kiryat Ono" for "קרית אונו", or else the name of the
    locality or quarter the place is in where they give one in it, as "Al Barsha 1" in Dubai. As given
    otherwise: not the county, too large to tell two villages apart. */
function townOf(properties: Record<string, unknown>, countryCode: string, lat: number, lng: number): string {
  const [city, locality, district, county] = [properties.city, properties.locality, properties.district, properties.county].map(text);
  const town = city || locality || district || county;
  if (!town || LATIN.test(town)) return town;
  return catalogTownName(town, countryCode, lat, lng) ?? [locality, district].find(name => LATIN.test(name)) ?? town;
}

/** A Photon place in two lines: "Gare de Lyon" over "Place Louis Armand, 75012 Paris". */
function photonLines(properties: Record<string, unknown>, lat: number, lng: number): { title: string; subtitle: string } {
  const name = text(properties.name);
  const street = text(properties.street);
  const countryCode = text(properties.countrycode).toUpperCase();
  const address = streetAddress(countryCode, street, text(properties.housenumber));
  const town = townOf(properties, countryCode, lat, lng);
  const region = text(properties.state) || text(properties.county);
  const country = text(properties.country);
  // "8001 Zürich", "Austin, TX 78701", "Sydney NSW 2000"; with its state, where the country writes
  // one after the town, a town alone: "Mesquite, TX", of which Texas has one and Nevada another.
  const postTown = (postcode: string) => townLine(countryCode, { town, postcode, region: () => regionCode(properties, countryCode) });
  // Nothing said twice: the city of Oslo is in the county of Oslo.
  const lines = (title: string, ...parts: string[]) =>
    ({ title, subtitle: [...new Set(parts.filter(part => part && part !== title))].join(', ') });

  switch (text(properties.type)) {
    case 'city':
      return lines(name, region, country);
    // Without a postcode, which changes along a street: its pieces read as one street.
    case 'street':
      return lines(name || street, town && postTown(''));
    case 'house': {
      const line = postTown(text(properties.postcode));
      return name ? lines(name, address, line) : lines(address, line);
    }
    default:
      return town && town !== name ? lines(name, postTown('')) : lines(name, region, country);
  }
}

/** Where Photon is asked. */
interface PhotonService {
  url: string;
  /** Our own instance's Cloudflare Access service token; nothing for the public one. */
  headers: Record<string, string>;
}

/** Our own Photon where PHOTON_API_URL names one over HTTPS, with the Access
    token where both of its halves are set; komoot's public instance otherwise. */
function photonService(settings: Record<string, unknown>): PhotonService | null {
  const url = settings.PHOTON_API_URL;
  if (typeof url !== 'string' || !url.startsWith('https://')) return null;
  const id = settings.PHOTON_ACCESS_CLIENT_ID;
  const secret = settings.PHOTON_ACCESS_CLIENT_SECRET;
  const headers: Record<string, string> = typeof id === 'string' && id && typeof secret === 'string' && secret
    ? { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret }
    : {};
  return { url, headers };
}

/** The box a landmark's outline fits in, from Photon's extent: west, north, east and south. */
function outlineBox(extent: unknown): Box | undefined {
  if (!Array.isArray(extent) || extent.length !== 4 || !extent.every(value => typeof value === 'number' && Number.isFinite(value))) return undefined;
  const [west, north, east, south] = extent as number[];
  const box = { west: Math.min(west, east), south: Math.min(south, north), east: Math.max(west, east), north: Math.max(south, north) };
  return box.east - box.west <= MAX_OUTLINE_DEGREES && box.north - box.south <= MAX_OUTLINE_DEGREES ? box : undefined;
}

/** The words typed that name a place: those before the state or country typed after them, where the place is
    in it. "Austin TX" names Austin in Texas, which neither Photon nor Geoapify calls TX, and no Austin elsewhere. */
function typedNaming({ typed, qualified }: Ranking, properties: Record<string, unknown>, countryCode: string): string[] {
  return (qualified && wordsNaming(qualified, countryCode, regionCode(properties, countryCode))) ?? typed;
}

/** Photon's places, in its order, as rows ranked for what was typed. */
function photonCandidates(features: PhotonFeature[], ranking: Ranking): Candidate[] {
  return features.flatMap(feature => {
    const coordinates = feature?.geometry?.coordinates;
    const [lng, lat] = Array.isArray(coordinates) && coordinates.every(value => typeof value === 'number') ? coordinates : [NaN, NaN];
    const properties = feature?.properties && typeof feature.properties === 'object' ? feature.properties : {};
    if (!validCoordinate(lat, lng) || !servedPlace(lat, lng)) return [];
    const { title, subtitle } = photonLines(properties, lat, lng);
    if (!title) return [];
    const place = {
      lat,
      lng,
      // Split at its first comma by app versions that predate title and subtitle.
      display_name: subtitle ? `${title}, ${subtitle}` : title,
      title,
      subtitle,
      covered: isPointCovered(lat, lng),
    };
    const nearMiss = properties.nearMiss === true;
    // Not a town Geoapify found for a near miss of its name: "Rheinwald" for "Rheinfall".
    const town = properties.type === 'city' && !nearMiss;
    // A landmark's: not a street's, nor a town's or a quarter's, which may hold others of their name.
    const outline = properties.type === 'house' || properties.type === 'other' ? outlineBox(properties.extent) : undefined;
    const countryCode = text(properties.countrycode).toUpperCase();
    const typed = typedNaming(ranking, properties, countryCode);
    return [{ place, ...placeRank(typed, place, town, nearMiss, countryCode, ranking), ...(outline ? { outline } : {}) }];
  });
}

async function searchPhoton(search: Search, own: PhotonService | null, deadline: number, anywhere = false): Promise<Upstream<Found>> {
  const { query, language, near } = search;
  const params = new URLSearchParams({
    q: query,
    limit: String(PHOTON_RESULT_LIMIT),
    lang: PHOTON_LANGUAGES.find(code => code === language) ?? 'default',
  });
  // Within the part of the world the map shows; anywhere without a centre, as
  // "Paris" may be in France or in Texas, or where Geoapify, asked anywhere, found
  // nothing: "دبي مول" over Zürich is in Dubai. What is outside is left out after.
  const box = !anywhere && near && servedBox(near[0], near[1]);
  if (box) params.set('bbox', [box.west, box.south, box.east, box.north].join(','));
  for (const layer of PHOTON_LAYERS) params.append('layer', layer);
  if (near) {
    params.set('lat', String(near[0]));
    params.set('lon', String(near[1]));
    params.set('location_bias_scale', PHOTON_BIAS_SCALE);
  }
  const ask = (service: string, headers: Record<string, string>, timeoutMs: number) => {
    const url = new URL(service);
    url.search = params.toString();
    return fetchJson(url, headers, timeoutMs);
  };
  const timeLeft = () => deadline - Date.now();

  let answer = own
    ? await ask(own.url, own.headers, Math.min(OWN_PHOTON_TIMEOUT_MS, timeLeft()))
    : await ask(PUBLIC_PHOTON_URL, {}, timeLeft());
  // Ours down, restarting on a new database, slow or refusing an expired
  // token: the public one stands in. Not with what ours turned away as too many.
  if (own && !answer.ok && answer.failure !== 'rateLimited') {
    console.warn(JSON.stringify({ event: 'photon_fallback', failure: answer.failure }));
    answer = await ask(PUBLIC_PHOTON_URL, {}, timeLeft());
  }
  if (!answer.ok) return answer;
  const features = (answer.value as PhotonResponse | null)?.features;
  if (!Array.isArray(features)) return { ok: false, failure: 'invalid' };
  return { ok: true, value: { sources: ['Photon'], candidates: photonCandidates(features, search) } };
}

/** The continent of a point, of those where the app may have cities. */
function continentAt(lat: number, lng: number): Continent | undefined {
  return BOXES.find(({ box }) => inBox(box, lat, lng))?.continent;
}

function inBox(box: Box, lat: number, lng: number): boolean {
  return lat >= box.south && lat <= box.north && lng >= box.west && lng <= box.east &&
    !box.without?.some(part => inBox(part, lat, lng));
}

/** The part of the world where the app has cities that a point is in, if any. */
function servedBox(lat: number, lng: number): Box | undefined {
  return SERVED_BOXES.find(box => inBox(box, lat, lng));
}

function servedPlace(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' && servedBox(lat, lng) !== undefined;
}

/** A Geoapify place as Photon describes one, to be shown and ranked alike. */
function photonFeature(result: Record<string, unknown>): PhotonFeature | null {
  // A hamlet is part of the town it is in: "Mailand" in Leutkirch im Allgäu is no Milan.
  const hamlet = result.result_type === 'city' && text(result.city) !== '' &&
    searchWords(text(result.city)).join(' ') !== searchWords(text(result.name)).join(' ');
  const type = hamlet ? 'other' : GEOAPIFY_TYPES[text(result.result_type)];
  if (!type || !servedPlace(result.lat, result.lon)) return null;
  // A quarter and a postcode are named in their own fields.
  const name = text(result.name)
    || (type === 'district' ? text(result.suburb) || text(result.district) : '')
    || (result.result_type === 'postcode' ? text(result.postcode) : '');
  // How sure Geoapify is that the place bears all of what was typed: under one, a near miss.
  const confidence = result.rank && typeof result.rank === 'object' ? (result.rank as Record<string, unknown>).confidence : undefined;
  const bbox = result.bbox && typeof result.bbox === 'object' ? result.bbox as Record<string, unknown> : null;
  return {
    geometry: { coordinates: [result.lon, result.lat] },
    properties: {
      type,
      name,
      street: result.street,
      housenumber: result.housenumber,
      postcode: result.postcode,
      city: result.city,
      district: result.suburb ?? result.district,
      county: result.county,
      state: result.state,
      statecode: result.state_code,
      country: result.country,
      countrycode: result.country_code,
      nearMiss: typeof confidence === 'number' && confidence < 1,
      extent: bbox ? [bbox.lon1, bbox.lat2, bbox.lon2, bbox.lat1] : undefined,
    },
  };
}

/** How Geoapify is asked, beyond what was typed. */
interface GeoapifyAsk {
  /** What it is asked for instead of what was typed. */
  text?: string;
  /** Only places this close to where places come first. */
  withinM?: number;
  /** Only towns. */
  towns?: boolean;
  timeoutMs: number;
}

async function searchGeoapify(search: Search, key: string, ask: GeoapifyAsk): Promise<Upstream<Found>> {
  const { near } = search;
  const query = ask.text ?? search.query;
  const params = new URLSearchParams({
    text: query,
    // Geoapify names places in every language of the app.
    lang: search.language,
    limit: String(GEOAPIFY_RESULT_LIMIT),
    // Without a map centre, the country of the device's time zone is near, or Switzerland.
    bias: near ? `proximity:${near[1]},${near[0]}` : `countrycode:${search.home.toLowerCase()}`,
    format: 'json',
    apiKey: key,
  });
  if (near && ask.withinM) params.set('filter', `circle:${near[1]},${near[0]},${ask.withinM}`);
  if (ask.towns) params.set('type', 'city');
  // A number alone is a postcode, which Geoapify finds only when asked for one:
  // otherwise it answers with the quarters around it, and towns whose postcodes start with it.
  else if (/^\d+$/.test(query)) params.set('type', 'postcode');
  const url = new URL(GEOAPIFY_AUTOCOMPLETE_URL);
  url.search = params.toString();

  const answer = await fetchJson(url, {}, ask.timeoutMs);
  if (!answer.ok) return answer;
  const results = (answer.value as GeoapifyResponse | null)?.results;
  if (!Array.isArray(results)) return { ok: false, failure: 'invalid' };
  const features = results.flatMap(result => {
    const feature = result && typeof result === 'object' ? photonFeature(result as Record<string, unknown>) : null;
    return feature ? [feature] : [];
  });
  const candidates = photonCandidates(features, search);
  // Towns, not the hamlets, quarters and stations Geoapify also has, nor near misses of their names.
  return { ok: true, value: { sources: ['Geoapify'], candidates: ask.towns ? candidates.filter(({ town }) => town) : candidates } };
}

/** Geoapify's places: those close to where places come first, and those farther
    when none close by is what was typed. An address typed with its city, in the city. */
async function geoapifyPlaces(search: Search, key: string): Promise<Upstream<Found>> {
  const anywhere = () => searchGeoapify(search, key, { timeoutMs: GEOAPIFY_TIMEOUT_MS });
  if (!search.near) return anywhere();
  // Without the city's name: Geoapify finds "Bahnhofstrasse 10" in Biel, but
  // nothing for "Bahnhofstrasse 10 Biel", as it calls the city Biel/Bienne.
  const nearby = await searchGeoapify(search, key, search.address
    ? { text: search.address, withinM: CITY_SEARCH_M, timeoutMs: GEOAPIFY_TIMEOUT_MS }
    : { withinM: NEARBY_SEARCH_M, timeoutMs: GEOAPIFY_TIMEOUT_MS });
  if (!nearby.ok || nearby.value.candidates.some(({ miss }) => !miss)) return nearby;
  const farther = await anywhere();
  if (!farther.ok) return farther;
  // The near misses close by, after what is found farther.
  return { ok: true, value: { sources: ['Geoapify'], candidates: [...nearby.value.candidates, ...farther.value.candidates] } };
}

/** Places where the app has cities: from Geoapify where the Worker has its key, from Photon
    where it has none, when Geoapify cannot answer or when it finds nothing, all within one
    search's time. Not when it finds nothing while a city of the catalog is on its way, as
    "תל אב" is to Tel Aviv: the city is shown at once. */
async function searchPlaces(search: Search, settings: Record<string, unknown>, key: string, deadline: number, cityOnItsWay: boolean): Promise<Upstream<Found>> {
  const photon = photonService(settings);
  if (!key) return searchPhoton(search, photon, deadline);
  const found = await geoapifyPlaces(search, key);
  if (!found.ok) {
    // Out of credits for the day, the key refused, down or slow: Photon stands in.
    console.warn(JSON.stringify({ event: 'geoapify_fallback', failure: found.failure }));
    return searchPhoton(search, photon, deadline);
  }
  // Nothing in the parts of the world the app covers: Geoapify finds "دبي مول", the
  // Dubai Mall in Arabic, only over Dubai, and nothing for "Bahnhofstrase 10". Photon
  // is asked anywhere, as Geoapify was, with what is left of the search's time; if it
  // cannot answer, nothing was found. Not after near misses, which are shown as fast
  // as before: "Alexanderpltz" is Alexanderplatz to Geoapify.
  if (found.value.candidates.length || cityOnItsWay) return found;
  const more = await searchPhoton(search, photon, deadline, true);
  return more.ok ? { ok: true, value: { sources: ['Geoapify', 'Photon'], candidates: more.value.candidates } } : found;
}

/** What a promise comes to within some time, or null. */
async function within<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>(resolve => { timer = setTimeout(resolve, Math.max(0, ms), null); });
  try {
    return await Promise.race([promise, late]);
  } finally {
    clearTimeout(timer);
  }
}

/** How far a place is from another's outline, or from the other where it has none. */
function apartM({ place }: Candidate, { place: other, outline }: Candidate): number {
  if (!outline) return haversineM(place.lat, place.lng, other.lat, other.lng);
  const lat = Math.min(Math.max(place.lat, outline.south), outline.north);
  const lng = Math.min(Math.max(place.lng, outline.west), outline.east);
  return haversineM(place.lat, place.lng, lat, lng);
}

/** Two rows for one place: the same two lines, or the same name close by or in the other's outline. */
function samePlace(a: Candidate, b: Candidate): boolean {
  if (a.place.title === b.place.title && a.place.subtitle === b.place.subtitle) return true;
  return searchWords(a.place.title).join(' ') === searchWords(b.place.title).join(' ') &&
    Math.min(apartM(a, b), apartM(b, a)) <= SAME_PLACE_M;
}

function failureResponse(failure: UpstreamFailure) {
  switch (failure) {
    case 'rateLimited': return errorResponse('Address search is temporarily rate limited upstream.', 503, '60');
    case 'timedOut': return errorResponse('Address search timed out.', 504, '30');
    case 'invalid': return errorResponse('Address search returned an invalid response.', 502);
    case 'unavailable': return errorResponse('Address search is temporarily unavailable.', 502, '30');
  }
}

async function geocode(input: GeocodeInput) {
  // Arabic-Indic digits as 0-9, for the services and for what reads a house number or a postcode.
  const typedText = westernDigits(input.query.trim());
  if (typedText.length < 2 || typedText.length > MAX_QUERY_LENGTH) {
    return errorResponse('Address search must contain between 2 and 160 characters.', 400);
  }

  // The language the app is shown in: for the labels of places and for the countries of cities.
  const requestedLanguage = input.requestedLanguage.toLowerCase();
  const language = GEOCODE_LANGUAGES.find(code => code === requestedLanguage) ?? 'en';
  const deadline = Date.now() + GEOCODE_TIMEOUT_MS;
  // The cities with scooter data the text names, found without a service.
  const listed = namedCities(typedText, language);
  // An address typed with its city is looked for in the city, wherever the map is.
  const inCity = listed.length ? null : cityOfAddress(typedText);
  const search: Search = {
    query: typedText,
    language,
    typed: searchWords(typedText),
    qualified: qualifiedQuery(typedText),
    near: inCity?.center ?? input.near,
    home: input.country ?? DEFAULT_HOME,
    address: inCity?.address ?? null,
  };

  const settings = await workerSettings();
  const key = text(settings.GEOAPIFY_API_KEY);
  const asked = Date.now();
  // The towns of the name typed, wherever they are: those far from the map, which
  // places close to it leave out, and Fribourg for "Freiburg", beside Freiburg im
  // Breisgau. Not for an address, nor a postcode.
  const towns = key && !inCity && !/\d/.test(typedText)
    ? searchGeoapify(search, key, { towns: true, timeoutMs: GEOAPIFY_TIMEOUT_MS })
    : null;
  // A city typed in full is asked for, not the streets and shops of its name.
  const places = listed.some(({ exact }) => exact) ? null : searchPlaces(search, settings, key, deadline, listed.length > 0);
  const foundPlaces = places && await places;
  const foundTowns = towns && await within(towns, asked + TOWN_WAIT_MS - Date.now());

  const candidates: Candidate[] = [
    ...namesakesNearestFirst(listed, search).map(({ city, exact, country }) =>
      ({ place: city, rank: townRank(exact, city, country, search, true), town: true, miss: false, named: exact, remoteness: remoteness(city, country, search), listed: true })),
    ...(foundTowns?.ok ? foundTowns.value.candidates : []),
    ...(foundPlaces?.ok ? foundPlaces.value.candidates : []),
  ];
  if (!candidates.length && foundPlaces && !foundPlaces.ok) return failureResponse(foundPlaces.failure);

  const shown: Candidate[] = [];
  for (const candidate of candidates) {
    // A street comes in pieces, a station with its building, platforms and stops: one row each.
    if (shown.some(other => samePlace(other, candidate))) continue;
    // A town found as typed close to a city with scooter data is that city: "Rom" is Roma.
    const city = candidate.town && !candidate.listed && shown.find(({ place, listed }) =>
      listed && haversineM(place.lat, place.lng, candidate.place.lat, candidate.place.lng) <= CLOSE_M);
    if (city) {
      city.rank = Math.min(city.rank, candidate.rank);
      continue;
    }
    shown.push({ ...candidate });
  }
  // The streets and landmarks close to the map centre named as typed come before the
  // towns far from it: over Tel Aviv, "Rothschild" is the boulevard and its places, not
  // Rothschild, Wisconsin; over Zürich, "Seefeld" is its quarter, not Seefeld in Bavaria
  // nor Seefeld in Tirol. The towns follow in their order, before the places ranked after.
  // Not the cities of our list, nor a town typed with its state or country, as
  // "Rothschild Wisconsin", which no place close by is named.
  const namedClose = search.near ? shown.filter(({ town, named, remoteness }) => !town && named && remoteness < 2) : [];
  if (namedClose.length) {
    const after = Math.max(...namedClose.map(({ rank }) => rank)) + 0.5;
    for (const candidate of shown) {
      // A town ranks under PLACE_RANK: each comes between after and the next rank.
      if (candidate.town && !candidate.listed && candidate.remoteness === 2) candidate.rank = after + candidate.rank / PLACE_RANK / 2;
    }
  }
  // Stable: the services' ranking is kept among the places of one rank.
  shown.sort((a, b) => a.rank - b.rank);

  const services = [...new Set([foundTowns, foundPlaces].flatMap(found => found?.ok ? found.value.sources : []))];
  const sources = [...(listed.length ? ['Verified scooter city catalog'] : []), ...services, ...(services.length ? ['OpenStreetMap'] : [])];
  return NextResponse.json(shown.slice(0, MAX_RESULTS).map(({ place }) => place), {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Geocoding-Data-Source': sources.join(', '),
    },
  });
}

/** The country sent with a search: two letters, or none. */
function countryCode(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : null;
}

/** The map centre sent with a search, to about a kilometre; anything else is no centre. */
function nearPoint(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [lat, lng] = value;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !validCoordinate(lat, lng)) return null;
  return [Math.round(lat * 100) / 100, Math.round(lng * 100) / 100];
}

export async function GET(request: NextRequest) {
  if (!await rateLimitAllows(request, 'GEOCODE_API_RATE_LIMITER')) return errorResponse('Too many address searches. Please try again shortly.', 429, '60');
  return geocode({
    query: request.nextUrl.searchParams.get('q') ?? '',
    requestedLanguage: request.nextUrl.searchParams.get('lang') ?? 'en',
    near: null,
    country: null,
  });
}

export async function POST(request: NextRequest) {
  if (!await rateLimitAllows(request, 'GEOCODE_API_RATE_LIMITER')) return errorResponse('Too many address searches. Please try again shortly.', 429, '60');
  let body: unknown;
  try {
    body = await readJsonBody(request, 4096);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return errorResponse('Address search request is too large.', 413);
    return errorResponse('Address search request must be valid JSON.', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return errorResponse('Address search request must be a JSON object.', 400);
  }

  const { q, lang, near, country } = body as { q?: unknown; lang?: unknown; near?: unknown; country?: unknown };
  return geocode({
    query: typeof q === 'string' ? q : '',
    requestedLanguage: typeof lang === 'string' ? lang : 'en',
    near: nearPoint(near),
    country: countryCode(country),
  });
}
