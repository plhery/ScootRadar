import { getCloudflareContext } from '@opennextjs/cloudflare';
import { BodyTooLargeError, readJsonBody } from '@/lib/readJsonBody';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAllows } from '@/lib/rateLimit';
import { isPointCovered } from '@/lib/coveredCities';
import { haversineM } from '@/lib/geo';
import { GEOCODE_LANGUAGES, searchCoveredCities, type GeocodeLanguage } from './cities';

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

interface Candidate {
  place: GeocodePlace;
  rank: number;
}

/** The places one service found, and the credit for them. */
interface Found {
  source: string;
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

/** How a place ranks for what was typed; lower comes first. */
function placeRank(typed: string[], place: GeocodePlace, town: boolean, country: string, near: [number, number] | null): number {
  const title = searchWords(place.title);
  // In any order: "Flughafen Zürich" names "Zürich Flughafen".
  const named = title.length === typed.length && [...title].sort().join(' ') === [...typed].sort().join(' ');
  const words = [...title, ...searchWords(place.subtitle)];
  const atWordStart = typed.every(word => words.some(candidate => candidate.startsWith(word)));
  // What the services found by another of its names is no typing mistake, and a
  // town found so, typed in full, was typed by that name: "Milano" for Milan. Not
  // by a number: Geoapify finds Pompei for "8004", the start of its postcode.
  const namedOtherwise = !atWordStart && title.length === typed.length && !typed.some(word => /\d/.test(word));
  // A town typed by its name is what was asked for, with scooter data or without.
  if (town && (named || namedOtherwise)) return 0;
  const match = named ? 0 : atWordStart ? 1 : 2;
  // Near the map centre first, then with scooter data, then named as typed: each outweighs those after it.
  return 1 + remoteness(place, country, near) * 6 + (place.covered ? 0 : 3) + match;
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
    // Not a town Geoapify found for a near miss of its name: "Rheinwald" for "Rheinfall".
    const town = properties.type === 'city' && properties.nearMiss !== true;
    return [{ place, rank: placeRank(typed, place, town, text(properties.countrycode).toUpperCase(), near) }];
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
  return { ok: true, value: { source: 'Photon, OpenStreetMap', candidates: photonCandidates(features, typed, near) } };
}

function europeanPlace(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && typeof lng === 'number' &&
    lat >= EUROPE.south && lat <= EUROPE.north && lng >= EUROPE.west && lng <= EUROPE.east;
}

/** A Geoapify place as Photon describes one, to be shown and ranked alike. */
function photonFeature(result: Record<string, unknown>): PhotonFeature | null {
  const type = GEOAPIFY_TYPES[text(result.result_type)];
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

async function searchGeoapify(
  query: string,
  language: GeocodeLanguage,
  typed: string[],
  near: [number, number] | null,
  key: string
): Promise<Upstream<Found>> {
  const params = new URLSearchParams({
    text: query,
    // Geoapify names places in every language of the app.
    lang: language,
    limit: String(GEOAPIFY_RESULT_LIMIT),
    // Without a map centre, as in iOS apps from before they sent one, Switzerland is near.
    bias: near ? `proximity:${near[1]},${near[0]}` : 'countrycode:ch',
    format: 'json',
    apiKey: key,
  });
  // A number alone is a postcode, which Geoapify finds only when asked for one:
  // otherwise it answers with the quarters around it, and towns whose postcodes start with it.
  if (/^\d+$/.test(query)) params.set('type', 'postcode');
  const url = new URL(GEOAPIFY_AUTOCOMPLETE_URL);
  url.search = params.toString();

  const answer = await fetchJson(url, {}, GEOAPIFY_TIMEOUT_MS);
  if (!answer.ok) return answer;
  const results = (answer.value as GeoapifyResponse | null)?.results;
  if (!Array.isArray(results)) return { ok: false, failure: 'invalid' };
  const features = results.flatMap(result => {
    const feature = result && typeof result === 'object' ? photonFeature(result as Record<string, unknown>) : null;
    return feature ? [feature] : [];
  });
  return { ok: true, value: { source: 'Geoapify, OpenStreetMap', candidates: photonCandidates(features, typed, near) } };
}

/** Places across Europe: from Geoapify where the Worker has its key, from Photon
    where it has none or when Geoapify cannot answer, all within one search's time. */
async function searchPlaces(
  query: string,
  language: GeocodeLanguage,
  typed: string[],
  near: [number, number] | null
): Promise<Upstream<Found>> {
  const deadline = Date.now() + GEOCODE_TIMEOUT_MS;
  const settings = await workerSettings();
  const key = text(settings.GEOAPIFY_API_KEY);
  if (key) {
    const found = await searchGeoapify(query, language, typed, near, key);
    if (found.ok) return found;
    // Out of credits for the day, the key refused, down or slow: Photon stands in.
    console.warn(JSON.stringify({ event: 'geoapify_fallback', failure: found.failure }));
  }
  return searchPhoton(query, language, typed, near, photonService(settings), deadline);
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
  // A city with scooter data is found by its name alone, before and without a geocoding service.
  const cities = searchCoveredCities(withoutLigatures(typedText), language);
  if (cities.length) {
    return NextResponse.json(cities, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Geocoding-Data-Source': 'Verified European scooter city catalog',
      },
    });
  }

  const { near } = input;
  // Geoapify and Photon read ß themselves, and are asked with the text as typed.
  const found = await searchPlaces(typedText, language, searchWords(typedText), near);
  if (!found.ok) return failureResponse(found.failure);

  const places: Candidate[] = [];
  for (const candidate of found.value.candidates) {
    // A street comes in pieces, a station with its building, platforms and stops: one row each.
    if (places.some(({ place }) => samePlace(place, candidate.place))) continue;
    places.push(candidate);
  }
  // Stable: the service's ranking is kept among the places of one rank.
  places.sort((a, b) => a.rank - b.rank);

  return NextResponse.json(places.slice(0, MAX_RESULTS).map(({ place }) => place), {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Geocoding-Data-Source': found.value.source,
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
