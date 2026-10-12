import { BodyTooLargeError, readJsonBody } from '@/lib/readJsonBody';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimitAllows } from '@/lib/rateLimit';
import { isPointCovered } from '@/lib/coveredCities';
import { boundsContainPoint, haversineM } from '@/lib/geo';
import type { MapBounds } from '@/lib/types';
import { GEOCODE_LANGUAGES, searchCoveredCities, type GeocodeLanguage } from './cities';

const MAX_QUERY_LENGTH = 160;
// Far more than is returned, so that places with scooter data can be ranked
// first and a station is found among its own tracks and depots: "Basel SBB" is
// the twentieth row swisstopo returns for that text.
const UPSTREAM_RESULT_LIMIT = 30;
const MAX_RESULTS = 5;
const GEOCODE_TIMEOUT_MS = 10_000;
const GEOADMIN_SEARCH_URL = 'https://api3.geo.admin.ch/rest/services/api/SearchServer';
// Not places to ride from: the centres of whole cantons and districts, and land parcels.
const SKIPPED_ORIGINS = new Set(['kantone', 'district', 'parcel']);
// Motorway exits and interchanges, which read like quarters ("Zürich-West") once their class is dropped.
const MOTORWAY_CLASS = 'TLM_AUS_EINFAHRT';
// Public transport stops. A stop a rider can use comes with its transport mode
// ("train", "bus / tram"); one without is an operating point of the railway: a
// depot, a junction, a group of tracks ("Basel SBB RB Gr E", "(Spw)", "Cargo GV").
const STOP_ORIGIN = 'haltestellen';

// Places across Europe, from OpenStreetMap: swisstopo knows Switzerland only.
const PHOTON_SEARCH_URL = 'https://photon.komoot.io/api/';
const PHOTON_RESULT_LIMIT = 15;
// The languages Photon names places in; in the others, places keep their local names.
const PHOTON_LANGUAGES = ['de', 'en', 'fr'] as const;
// Not the centres of counties, regions and countries, as swisstopo's cantons and districts are left out.
const PHOTON_LAYERS = ['house', 'street', 'locality', 'district', 'city', 'other'];
// Where the app has cities: Europe, from the Azores and the Canaries to the North Cape.
const EUROPE_BBOX = '-32,27,45,72';
// Distance to the map centre counts for more than prominence: "Bahnhofstrasse 1"
// near Zürich is the one in Zürich, not the better-known station in Goldau.
const PHOTON_BIAS_SCALE = '0.1';
// Switzerland with a margin. With the map centre in it, swisstopo is asked as well; elsewhere Photon alone.
const SWISSTOPO_AREA: MapBounds = { south: 45.8, west: 5.9, north: 47.85, east: 10.55 };
// How far a place is from the map centre: within a short ride, within the city around it, or farther.
const CLOSE_M = 5_000;
const NEARBY_M = 30_000;
// swisstopo answers in a few hundred milliseconds, Photon at times in seconds. Once swisstopo
// has found a place near the map, Photon, which adds places abroad, is waited for this much longer.
const PHOTON_GRACE_MS = 1_000;
// A station, its building and its platforms under one name: within this, they are one place.
const SAME_PLACE_M = 250;
// Where the house number is written before the street: "10 Rue de Rivoli".
const NUMBER_FIRST_COUNTRIES = new Set(['FR', 'GB', 'IE', 'LU', 'MC']);

interface GeoAdminResult {
  attrs?: {
    lat?: number;
    lon?: number;
    x?: number;
    y?: number;
    label?: string;
    origin?: string;
    objectclass?: string;
  };
}

interface GeoAdminResponse {
  results?: GeoAdminResult[];
}

interface PhotonFeature {
  geometry?: { coordinates?: unknown };
  properties?: Record<string, unknown>;
}

interface PhotonResponse {
  features?: PhotonFeature[];
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
  kind: RankedAs;
}

type UpstreamFailure = 'rateLimited' | 'timedOut' | 'unavailable' | 'invalid';

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

const LAYER_PREFIX = /^(?:haltestellen|address|gazetteer)_\s*/i;
const CANTONS = '[A-Z]{2}(?:,\\s*[A-Z]{2})*';
const LOCATED_IN = new RegExp(`^\\((${CANTONS})\\)\\s*-\\s*(.+)$`);
const BRACKETED_CANTONS = new RegExp(`\\((${CANTONS})\\)`, 'g');
const CANTON_SUFFIX = /^(.*\S)\s*\(([A-Z]{2})\)$/;

// display_name: decoded by app versions that predate title and subtitle. Keep as is.
function plainTextLabel(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(LAYER_PREFIX, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, entity => HTML_ENTITIES[entity] ?? entity)
    .trim();
}

function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39);/g, entity => HTML_ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(LAYER_PREFIX, '');
}

// "(OW) - Lungern" → "Lungern OW", "(ZH)" → "ZH", no separators left at the edges.
function tidyRemainder(text: string): string {
  const located = text.match(LOCATED_IN);
  if (located) {
    const cantons = located[1].replace(/,\s*/g, ', ');
    // Large places list every municipality they touch; the canton says enough.
    if (located[2].includes(',')) return cantons;
    const place = located[2].match(CANTON_SUFFIX);
    return place ? `${place[1]} ${place[2]}` : `${located[2]} ${cantons}`;
  }
  return text
    // Places across the border have no canton: "() - Triesenberg".
    .replace(/\(\s*\)/g, '')
    .replace(BRACKETED_CANTONS, '$1')
    .replace(/^[\s,;:·–—-]+|[\s,;:·–—-]+$/g, '');
}

/**
 * Splits a swisstopo label, e.g. `Paradeplatz 2 <b>8001 Zürich</b>`, into two display lines.
 * `category` is what the label had in <i>: a feature class, or the transport mode of a stop.
 */
function placeLines(label: string, origin: string | undefined, displayName: string) {
  let category = '';
  let bold = '';
  const outside = plainText(label
    .replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, (_, text: string) => { category += ` ${text}`; return ' '; })
    .replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, (_, text: string) => { bold += ` ${text}`; return ' '; }));
  category = plainText(category);
  // Bilingual towns are named twice: "Fribourg|Freiburg".
  bold = plainText(origin === 'gazetteer' ? bold.split('|')[0] : bold);

  if (!bold) return { title: outside || category || displayName.replace(/\s+/g, ' '), subtitle: '', category };

  if (origin === 'address') {
    // The street is outside the bold locality; "#" stands in for a missing house number.
    const street = outside.replace(/\s*#$/, '');
    return street ? { title: street, subtitle: bold, category } : { title: bold, subtitle: '', category };
  }

  let title = origin === 'zipcode' ? bold.replace(/^(\d{4})\s*-\s*(?=\S)/, '$1 ') : bold;
  let subtitle = tidyRemainder(outside);
  // The <i> part is a feature class for gazetteer names ("Building") but the
  // transport mode for stops ("train"), which is worth a line.
  if (!subtitle && origin !== 'gazetteer' && category) {
    subtitle = category[0].toUpperCase() + category.slice(1);
  }
  // Municipalities arrive as "<b>Lausanne (VD)</b>".
  const municipality = subtitle ? null : title.match(CANTON_SUFFIX);
  if (municipality) {
    title = municipality[1];
    subtitle = municipality[2];
  }
  // "<b>Gossau ZH</b> (ZH) - Gossau (ZH)" would say the same thing twice.
  return { title, subtitle: subtitle === title ? '' : subtitle, category };
}

// Letters swisstopo does not read: it takes "Bahnhofstraße" apart at the ß and
// answers with boundary stones. Swiss addresses are written without them.
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

// From this rank on a place is a last resort, shown only when nothing better was found.
const LAST_RESORT_RANK = 19;

interface RankedAs {
  /** A town or city, first when typed by its name. */
  town: boolean;
  /** A stop without a transport mode. */
  operatingPoint: boolean;
  /** Found by text inside its words, as swisstopo finds "Uettligenfeld" for "Genf". */
  insideWords: boolean;
  /** ISO 3166 code of the country the place is in. */
  country: string;
}

/** How a place ranks for what was typed; lower comes first. */
function placeRank(typed: string[], place: GeocodePlace, kind: RankedAs, near: [number, number] | null): number {
  const title = searchWords(place.title);
  // In any order: "Flughafen Zürich" names "Zürich Flughafen".
  const named = title.length === typed.length && [...title].sort().join(' ') === [...typed].sort().join(' ');
  const words = [...title, ...searchWords(place.subtitle)];
  const atWordStart = typed.every(word => words.some(candidate => candidate.startsWith(word)));
  // Photon matches whole words: what it found by another of its names is no typing mistake,
  // and a town found so, typed in full, was typed by that name: "Milano" for Milan.
  const namedOtherwise = !kind.insideWords && !atWordStart && title.length === typed.length;
  // A town typed by its name is what was asked for, with scooter data or without.
  if (kind.town && (named || namedOtherwise)) return 0;
  // The last resorts: the railway's operating points, then what has the text only inside its words.
  const resort = !atWordStart && kind.insideWords ? 2 : kind.operatingPoint ? 1 : 0;
  const match = named ? 0 : atWordStart ? 1 : 2;
  // Near the map centre first, then with scooter data, then named as typed: each outweighs those after it.
  return 1 + resort * (LAST_RESORT_RANK - 1) + remoteness(place, kind.country, near) * 6 + (place.covered ? 0 : 3) + match;
}

/** How far a place is from what the map shows: within a short ride of its centre, in the city around it, or farther. */
function remoteness(place: GeocodePlace, country: string, near: [number, number] | null): 0 | 1 | 2 {
  // Without a map centre, as in the iOS app and on the first view of the map, Switzerland is near.
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

const SWISSTOPO_LANGUAGES = ['de', 'fr', 'it', 'en'] as const;

type Upstream<T> = { ok: true; value: T } | { ok: false; failure: UpstreamFailure };

function validCoordinate(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

async function fetchJson(url: URL, headers: Record<string, string> = {}, signal?: AbortSignal): Promise<Upstream<unknown>> {
  const timeout = AbortSignal.timeout(GEOCODE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'scootradar/2.0 (scootradar.com)', ...headers },
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.status === 429) return { ok: false, failure: 'rateLimited' };
    if (!response.ok) return { ok: false, failure: 'unavailable' };
    return { ok: true, value: await response.json() };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    return { ok: false, failure: timedOut ? 'timedOut' : 'unavailable' };
  }
}

async function searchSwisstopo(
  query: string,
  language: GeocodeLanguage,
  typed: string[],
  near: [number, number] | null
): Promise<Upstream<Candidate[]>> {
  const url = new URL(GEOADMIN_SEARCH_URL);
  url.search = new URLSearchParams({
    searchText: query,
    type: 'locations',
    limit: String(UPSTREAM_RESULT_LIMIT),
    sr: '4326',
    // swisstopo labels in the languages of Switzerland and English only.
    lang: SWISSTOPO_LANGUAGES.find(code => code === language) ?? 'en',
  }).toString();

  const answer = await fetchJson(url, { 'Accept-Language': `${language}-CH,${language};q=0.9,en;q=0.6` });
  if (!answer.ok) return answer;
  const results = (answer.value as GeoAdminResponse | null)?.results;
  if (!Array.isArray(results)) return { ok: false, failure: 'invalid' };

  const seen = new Set<string>();
  const candidates = results.flatMap(result => {
    const attrs = result?.attrs;
    const origin = attrs?.origin;
    // Rows a rider would not choose.
    if (SKIPPED_ORIGINS.has(origin ?? '') || attrs?.objectclass?.toUpperCase() === MOTORWAY_CLASS) return [];
    const lat = Number(attrs?.lat ?? attrs?.y);
    const lng = Number(attrs?.lon ?? attrs?.x);
    const label = typeof attrs?.label === 'string' ? attrs.label : '';
    const displayName = plainTextLabel(label);
    if (!validCoordinate(lat, lng) || !displayName) return [];
    const { title, subtitle, category } = placeLines(label, origin, displayName);
    // swisstopo lists some places more than once (a town as municipality and as
    // place name, for instance); rows that read the same would look like a bug.
    const key = JSON.stringify([title, subtitle]);
    if (seen.has(key)) return [];
    seen.add(key);
    // After the town "Baden / AG", a feature in it that is also just called
    // "Baden / Baden AG" (its airfield, its treatment plant) reads like the town again.
    if (origin === 'gg25' && subtitle) seen.add(JSON.stringify([title, `${title} ${subtitle}`]));
    const place = { lat, lng, display_name: displayName, title, subtitle, covered: isPointCovered(lat, lng) };
    const kind = { town: origin === 'gg25', operatingPoint: origin === STOP_ORIGIN && !category, insideWords: true, country: 'CH' };
    return [{ place, rank: placeRank(typed, place, kind, near), kind }];
  });
  return { ok: true, value: candidates };
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

async function searchPhoton(
  query: string,
  language: GeocodeLanguage,
  typed: string[],
  near: [number, number] | null,
  signal: AbortSignal
): Promise<Upstream<Candidate[]>> {
  const params = new URLSearchParams({
    q: query,
    limit: String(PHOTON_RESULT_LIMIT),
    lang: PHOTON_LANGUAGES.find(code => code === language) ?? 'default',
    bbox: EUROPE_BBOX,
  });
  for (const layer of PHOTON_LAYERS) params.append('layer', layer);
  if (near) {
    params.set('lat', String(near[0]));
    params.set('lon', String(near[1]));
    params.set('location_bias_scale', PHOTON_BIAS_SCALE);
  }
  const url = new URL(PHOTON_SEARCH_URL);
  url.search = params.toString();

  const answer = await fetchJson(url, {}, signal);
  if (!answer.ok) return answer;
  const features = (answer.value as PhotonResponse | null)?.features;
  if (!Array.isArray(features)) return { ok: false, failure: 'invalid' };

  const candidates = features.flatMap(feature => {
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
    const kind = { town: properties.type === 'city', operatingPoint: false, insideWords: false, country: text(properties.countrycode).toUpperCase() };
    return [{ place, rank: placeRank(typed, place, kind, near), kind }];
  });
  return { ok: true, value: candidates };
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
  // "Bahnhofstraße 5" is searched, and ranked, as "Bahnhofstrasse 5".
  const query = withoutLigatures(typedText);

  // The language the app is shown in: for the labels of places and for the countries of cities.
  const requestedLanguage = input.requestedLanguage.toLowerCase();
  const language = GEOCODE_LANGUAGES.find(code => code === requestedLanguage) ?? 'en';
  // A city with scooter data is found by its name alone, before and without a geocoding service.
  const cities = searchCoveredCities(query, language);
  if (cities.length) {
    return NextResponse.json(cities, {
      headers: {
        'Cache-Control': 'private, no-store',
        'X-Geocoding-Data-Source': 'Verified European scooter city catalog',
      },
    });
  }

  const { near } = input;
  const typed = searchWords(query);
  // swisstopo knows Switzerland only: it is asked when the map is there, or when the app does not say where it is.
  const askSwisstopo = near === null || boundsContainPoint(SWISSTOPO_AREA, near[0], near[1]);
  const swissSearch = askSwisstopo ? searchSwisstopo(query, language, typed, near) : null;
  const photon = new AbortController();
  // Photon reads ß itself, and is asked with the text as typed.
  const europeSearch = searchPhoton(typedText, language, typed, near, photon.signal);
  const swiss = await swissSearch;
  const foundNear = swiss?.ok && swiss.value.some(({ place, rank }) => rank < LAST_RESORT_RANK && remoteness(place, 'CH', near) < 2);
  const grace = foundNear ? setTimeout(() => photon.abort(), PHOTON_GRACE_MS) : undefined;
  const europe = await europeSearch;
  clearTimeout(grace);
  if (!swiss?.ok && !europe.ok) return failureResponse(swiss && !swiss.ok ? swiss.failure : europe.failure);

  const places = swiss?.ok ? [...swiss.value] : [];
  for (const candidate of europe.ok ? europe.value : []) {
    // swisstopo has every Swiss town, by its official name: Photon's would be the same town again.
    if (swiss?.ok && candidate.kind.town && candidate.kind.country === 'CH') continue;
    // A street comes in pieces, a station with its building, platforms and stops,
    // and swisstopo may have listed the place already: one row each.
    if (places.some(({ place }) => samePlace(place, candidate.place))) continue;
    places.push(candidate);
  }
  // Stable: each service's ranking is kept among the places of one rank, swisstopo's first.
  places.sort((a, b) => a.rank - b.rank);
  // Operating points are for someone who typed one by its name, matches inside
  // words for a typing mistake: both only when nothing better was found.
  const better = places.filter(({ rank }) => rank < LAST_RESORT_RANK);
  const shown = better.length > 0 ? better : places;

  return NextResponse.json(shown.slice(0, MAX_RESULTS).map(({ place }) => place), {
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Geocoding-Data-Source': [swiss?.ok && 'swisstopo geo.admin.ch', europe.ok && 'Photon photon.komoot.io']
        .filter(Boolean).join(', '),
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
