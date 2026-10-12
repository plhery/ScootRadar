import { getCloudflareContext } from '@opennextjs/cloudflare';
import { BodyTooLargeError, readJsonBody } from '@/lib/readJsonBody';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAllows } from '@/lib/rateLimit';
import { isPointCovered } from '@/lib/coveredCities';
import { haversineM } from '@/lib/geo';
import { cityOfAddress, GEOCODE_LANGUAGES, namedCities, type GeocodeLanguage } from './cities';

const MAX_QUERY_LENGTH = 160;
const MAX_RESULTS = 5;
// One search, however many services it asks.
const GEOCODE_TIMEOUT_MS = 10_000;

// Places across Europe, from OpenStreetMap: Geoapify where GEOAPIFY_API_KEY is
// set, Photon where it is not or when Geoapify cannot answer (searchPlaces).
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
// Where the app has cities: Europe, from the Azores and the Canaries to the North
// Cape. Photon is asked within it; Geoapify is not, as in a rectangle that large
// it finds nothing for "Via Roma 10", nor in a list of Europe's countries "Gare de
// Lyon" near Paris: its places outside are left out instead (europeanPlace).
const EUROPE = { west: -32, south: 27, east: 45, north: 72 };
// Distance to the map centre counts for more than prominence: "Bahnhofstrasse 1"
// near Zürich is the one in Zürich, not the better-known station in Goldau.
const PHOTON_BIAS_SCALE = '0.1';
// How far a place is from the map centre: within a short ride, within the city around it, or farther.
const CLOSE_M = 5_000;
const NEARBY_M = 30_000;
// A station, its building and its platforms under one name: within this, they are one place.
const SAME_PLACE_M = 250;
// Where the house number is written before the street: "10 Rue de Rivoli".
const NUMBER_FIRST_COUNTRIES = new Set(['FR', 'GB', 'IE', 'LU', 'MC']);

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
  /** Where places come first: the map centre, or the city an address was typed with. */
  near: [number, number] | null;
  /** An address typed with its city, without the city: "Bahnhofstrasse 10" for "Bahnhofstrasse 10, Biel". */
  address: string | null;
}

interface GeocodeInput {
  query: string;
  requestedLanguage: string;
  /** The centre of the map, when it shows a city or less: places near it come first. */
  near: [number, number] | null;
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
}

interface Candidate extends Ranked {
  place: GeocodePlace;
  /** A city with scooter data, from our own list of them. */
  listed?: boolean;
}

/** The places one service found, and its name. */
interface Found {
  source: 'Geoapify' | 'Photon';
  candidates: Candidate[];
}

type UpstreamFailure = 'rateLimited' | 'timedOut' | 'unavailable' | 'invalid';

// Letters written two ways: "Bahnhofstraße" and "Bahnhofstrasse" are one street.
const LIGATURES: Record<string, string> = { 'ß': 'ss', 'ẞ': 'SS', 'œ': 'oe', 'Œ': 'OE', 'æ': 'ae', 'Æ': 'AE' };

function withoutLigatures(text: string): string {
  return text.replace(/[ßẞœŒæÆ]/g, letter => LIGATURES[letter]);
}

// Letters no accent can be taken from, spelled out so that "Tromso" names Tromsø.
const SPELLED_OUT: Record<string, string> = { 'ø': 'o', 'đ': 'd', 'ł': 'l', 'þ': 'th', 'ð': 'd', 'ı': 'i' };

/** The words of a text in one spelling: "Zuerich" and "Zürich" are both "zurich". */
function searchWords(text: string): string[] {
  return withoutLigatures(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[øđłþðı]/g, letter => SPELLED_OUT[letter])
    .replace(/([aou])e/g, '$1').split(/[^a-z0-9]+/).filter(Boolean);
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
  near: [number, number] | null
): Ranked {
  const title = searchWords(place.title);
  // In any order: "Flughafen Zürich" names "Zürich Flughafen".
  const named = title.length === typed.length && [...title].sort().join(' ') === [...typed].sort().join(' ');
  const words = [...title, ...searchWords(place.subtitle)];
  const atWordStart = typed.every(word => words.some(candidate => candidate.startsWith(word)));
  // What the services found by another of its names is no typing mistake, and a
  // town found so, typed in full, was typed by that name: "Milano" for Milan. Not
  // by a number: Geoapify finds Pompei for "8004", the start of its postcode. Nor
  // by three letters, which may be the start of another name: Bärschwil for "Ber".
  const namedOtherwise = !atWordStart && title.length === typed.length && typed.join('').length > 3 &&
    !typed.some(word => /\d/.test(word));
  // A town typed by its name is what was asked for, with scooter data or without;
  // one whose name starts as typed may be: "Laus" is on its way to Lausanne. By
  // its own name: Burgdorf is in the canton of Bern, not on the way to it.
  const started = typed.every(word => title.some(candidate => candidate.startsWith(word)));
  if (town && (named || namedOtherwise || started)) {
    return { rank: townRank(named || namedOtherwise, place, country, near), town: true, miss: false };
  }
  const match = named ? 0 : atWordStart ? 1 : 2;
  // "Zürichstrasse" for "Zürich HB"; not "Rue de Rivoli" for "Rue de Rivoli 10",
  // the street of the address typed, whose number Geoapify did not find.
  const street = typed.filter(word => !/\d/.test(word));
  const ofAddress = street.length > 0 && street.length < typed.length &&
    street.every(word => words.some(candidate => candidate.startsWith(word)));
  const miss = nearMiss && match === 2 && !ofAddress;
  // Near the map centre first, then with scooter data, then named as typed: each outweighs those after it.
  const rank = (miss ? MISS_RANK : PLACE_RANK) + remoteness(place, country, near) * 6 + (place.covered ? 0 : 3) + match;
  return { rank, town: false, miss };
}

/** Where a town ranks: typed by its name before started; the cities of our list
    first, then the others; the nearest first, then those with scooter data. */
function townRank(named: boolean, place: GeocodePlace, country: string, near: [number, number] | null, listed = false): number {
  const distance = remoteness(place, country, near);
  return (named ? 0 : STARTED_TOWN_RANK) + (listed ? distance : 3 + distance * 2 + (place.covered ? 0 : 1));
}

/** How far a place is from what the map shows: within a short ride of its centre, in the city around it, or farther. */
function remoteness(place: GeocodePlace, country: string, near: [number, number] | null): 0 | 1 | 2 {
  // Without a map centre, as in iOS apps from before they sent one, Switzerland is near.
  if (!near) return country === 'CH' ? 0 : 1;
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

/** A Photon place in two lines: "Gare de Lyon" over "Place Louis Armand, 75012 Paris". */
function photonLines(properties: Record<string, unknown>): { title: string; subtitle: string } {
  const name = text(properties.name);
  const street = text(properties.street);
  const number = text(properties.housenumber);
  const address = !street || !number ? street
    : NUMBER_FIRST_COUNTRIES.has(text(properties.countrycode).toUpperCase()) ? `${number} ${street}` : `${street} ${number}`;
  const town = text(properties.city) || text(properties.locality) || text(properties.district) || text(properties.county);
  const region = text(properties.state) || text(properties.county);
  const country = text(properties.country);
  // Nothing said twice: the city of Oslo is in the county of Oslo.
  const lines = (title: string, ...parts: string[]) =>
    ({ title, subtitle: [...new Set(parts.filter(part => part && part !== title))].join(', ') });

  switch (text(properties.type)) {
    case 'city':
      return lines(name, region, country);
    // Without a postcode, which changes along a street: its pieces read as one street.
    case 'street':
      return lines(name || street, town);
    case 'house': {
      const postTown = [text(properties.postcode), town].filter(Boolean).join(' ');
      return name ? lines(name, address, postTown) : lines(address, postTown);
    }
    default:
      return town && town !== name ? lines(name, town) : lines(name, region, country);
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

/** Photon's places, in its order, as rows ranked for what was typed. */
function photonCandidates(features: PhotonFeature[], typed: string[], near: [number, number] | null): Candidate[] {
  return features.flatMap(feature => {
    const coordinates = feature?.geometry?.coordinates;
    const [lng, lat] = Array.isArray(coordinates) && coordinates.every(value => typeof value === 'number') ? coordinates : [NaN, NaN];
    const properties = feature?.properties && typeof feature.properties === 'object' ? feature.properties : {};
    const { title, subtitle } = photonLines(properties);
    if (!validCoordinate(lat, lng) || !title) return [];
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
    return [{ place, ...placeRank(typed, place, town, nearMiss, text(properties.countrycode).toUpperCase(), near) }];
  });
}

async function searchPhoton(
  query: string,
  language: GeocodeLanguage,
  typed: string[],
  near: [number, number] | null,
  own: PhotonService | null,
  deadline: number
): Promise<Upstream<Found>> {
  const params = new URLSearchParams({
    q: query,
    limit: String(PHOTON_RESULT_LIMIT),
    lang: PHOTON_LANGUAGES.find(code => code === language) ?? 'default',
    bbox: [EUROPE.west, EUROPE.south, EUROPE.east, EUROPE.north].join(','),
  });
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
  return { ok: true, value: { source: 'Photon', candidates: photonCandidates(features, typed, near) } };
}

function europeanPlace(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' &&
    lat >= EUROPE.south && lat <= EUROPE.north && lng >= EUROPE.west && lng <= EUROPE.east;
}

/** A Geoapify place as Photon describes one, to be shown and ranked alike. */
function photonFeature(result: Record<string, unknown>): PhotonFeature | null {
  // A hamlet is part of the town it is in: "Mailand" in Leutkirch im Allgäu is no Milan.
  const hamlet = result.result_type === 'city' && text(result.city) !== '' &&
    searchWords(text(result.city)).join(' ') !== searchWords(text(result.name)).join(' ');
  const type = hamlet ? 'other' : GEOAPIFY_TYPES[text(result.result_type)];
  if (!type || !europeanPlace(result.lat, result.lon)) return null;
  // A quarter and a postcode are named in their own fields.
  const name = text(result.name)
    || (type === 'district' ? text(result.suburb) || text(result.district) : '')
    || (result.result_type === 'postcode' ? text(result.postcode) : '');
  // How sure Geoapify is that the place bears all of what was typed: under one, a near miss.
  const confidence = result.rank && typeof result.rank === 'object' ? (result.rank as Record<string, unknown>).confidence : undefined;
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
      country: result.country,
      countrycode: result.country_code,
      nearMiss: typeof confidence === 'number' && confidence < 1,
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
    // Without a map centre, as in iOS apps from before they sent one, Switzerland is near.
    bias: near ? `proximity:${near[1]},${near[0]}` : 'countrycode:ch',
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
  const candidates = photonCandidates(features, search.typed, near);
  // Towns, not the hamlets, quarters and stations Geoapify also has, nor near misses of their names.
  return { ok: true, value: { source: 'Geoapify', candidates: ask.towns ? candidates.filter(({ town }) => town) : candidates } };
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
  return { ok: true, value: { source: 'Geoapify', candidates: [...nearby.value.candidates, ...farther.value.candidates] } };
}

/** Places across Europe: from Geoapify where the Worker has its key, from Photon
    where it has none or when Geoapify cannot answer, all within one search's time. */
async function searchPlaces(search: Search, settings: Record<string, unknown>, key: string, deadline: number): Promise<Upstream<Found>> {
  if (key) {
    const found = await geoapifyPlaces(search, key);
    if (found.ok) return found;
    // Out of credits for the day, the key refused, down or slow: Photon stands in.
    console.warn(JSON.stringify({ event: 'geoapify_fallback', failure: found.failure }));
  }
  return searchPhoton(search.query, search.language, search.typed, search.near, photonService(settings), deadline);
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

/** Two rows for one place: the same two lines, or the same name close by. */
function samePlace(a: GeocodePlace, b: GeocodePlace): boolean {
  if (a.title === b.title && a.subtitle === b.subtitle) return true;
  return searchWords(a.title).join(' ') === searchWords(b.title).join(' ') &&
    haversineM(a.lat, a.lng, b.lat, b.lng) <= SAME_PLACE_M;
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
  const typedText = input.query.trim();
  if (typedText.length < 2 || typedText.length > MAX_QUERY_LENGTH) {
    return errorResponse('Address search must contain between 2 and 160 characters.', 400);
  }

  // The language the app is shown in: for the labels of places and for the countries of cities.
  const requestedLanguage = input.requestedLanguage.toLowerCase();
  const language = GEOCODE_LANGUAGES.find(code => code === requestedLanguage) ?? 'en';
  const deadline = Date.now() + GEOCODE_TIMEOUT_MS;
  // The cities with scooter data the text names, found without a service.
  const listed = namedCities(withoutLigatures(typedText), language);
  // An address typed with its city is looked for in the city, wherever the map is.
  const inCity = listed.length ? null : cityOfAddress(typedText);
  const search: Search = {
    query: typedText,
    language,
    typed: searchWords(typedText),
    near: inCity?.center ?? input.near,
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
  const places = listed.some(({ exact }) => exact) ? null : searchPlaces(search, settings, key, deadline);
  const foundPlaces = places && await places;
  const foundTowns = towns && await within(towns, asked + TOWN_WAIT_MS - Date.now());

  const candidates: Candidate[] = [
    ...listed.map(({ city, exact, country }) =>
      ({ place: city, rank: townRank(exact, city, country, search.near, true), town: true, miss: false, listed: true })),
    ...(foundTowns?.ok ? foundTowns.value.candidates : []),
    ...(foundPlaces?.ok ? foundPlaces.value.candidates : []),
  ];
  if (!candidates.length && foundPlaces && !foundPlaces.ok) return failureResponse(foundPlaces.failure);

  const shown: Candidate[] = [];
  for (const candidate of candidates) {
    // A street comes in pieces, a station with its building, platforms and stops: one row each.
    if (shown.some(({ place }) => samePlace(place, candidate.place))) continue;
    // A town found as typed close to a city with scooter data is that city: "Rom" is Roma.
    const city = candidate.town && !candidate.listed && shown.find(({ place, listed }) =>
      listed && haversineM(place.lat, place.lng, candidate.place.lat, candidate.place.lng) <= CLOSE_M);
    if (city) {
      city.rank = Math.min(city.rank, candidate.rank);
      continue;
    }
    shown.push({ ...candidate });
  }
  // Stable: the services' ranking is kept among the places of one rank.
  shown.sort((a, b) => a.rank - b.rank);

  const services = [...new Set([foundTowns, foundPlaces].flatMap(found => found?.ok ? [found.value.source] : []))];
  const sources = [...(listed.length ? ['Verified European scooter city catalog'] : []), ...services, ...(services.length ? ['OpenStreetMap'] : [])];
  return NextResponse.json(shown.slice(0, MAX_RESULTS).map(({ place }) => place), {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Geocoding-Data-Source': sources.join(', '),
    },
  });
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

  const { q, lang, near } = body as { q?: unknown; lang?: unknown; near?: unknown };
  return geocode({
    query: typeof q === 'string' ? q : '',
    requestedLanguage: typeof lang === 'string' ? lang : 'en',
    near: nearPoint(near),
  });
}
