import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const rateLimitAllows = vi.hoisted(() => vi.fn());
const getCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock('@/lib/rateLimit', () => ({ rateLimitAllows }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext }));

import { GET, POST } from '@/app/api/geocode/route';
import { RECORDED_GEOAPIFY_ANSWERS, RECORDED_PHOTON_ANSWERS } from '@/app/api/geocode/recordedAnswers';

function request(query: string, language?: string): NextRequest {
  const url = new URL('https://example.com/api/geocode');
  url.searchParams.set('q', query);
  if (language) url.searchParams.set('lang', language);
  return new NextRequest(url);
}

function postRequest(query: unknown, language: unknown = 'en', near?: unknown): NextRequest {
  return new NextRequest('https://example.com/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, lang: language, near }),
  });
}

const GEOAPIFY_HOST = 'api.geoapify.com';
const PHOTON_HOST = 'photon.komoot.io';

type PhotonRow = [properties: Record<string, unknown>, lat: number, lon: number];
type GeoapifyRow = [fields: Record<string, unknown>, lat: number, lon: number];
type GeoapifyRequest = 'towns' | 'nearby' | 'anywhere';
/** What Geoapify answers every request, or each of a search's requests; one not given fails. */
type GeoapifyAnswers = GeoapifyRow[] | number | Partial<Record<GeoapifyRequest, GeoapifyRow[] | number>>;

/** Which of a search's requests Geoapify is asked: for towns, for places close by, or for places anywhere. */
function geoapifyRequest(url: URL): GeoapifyRequest {
  return url.searchParams.get('type') === 'city' ? 'towns' : url.searchParams.has('filter') ? 'nearby' : 'anywhere';
}

/** Answers Geoapify with its results and each Photon with its features, or with a status for a service that fails. */
function stubUpstreams({ geoapify = [], photon = [] }: { geoapify?: GeoapifyAnswers; photon?: PhotonRow[] | number }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const rows = Array.isArray(geoapify) || typeof geoapify === 'number' ? geoapify : geoapify[geoapifyRequest(url)] ?? 500;
    const answer = url.hostname === GEOAPIFY_HOST
      ? typeof rows === 'number' ? rows : { results: rows.map(([fields, lat, lon]) => ({ ...fields, lat, lon })) }
      : typeof photon === 'number' ? photon : {
        type: 'FeatureCollection',
        features: photon.map(([properties, lat, lon]) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lon, lat] } })),
      };
    return typeof answer === 'number' ? new Response('', { status: answer }) : new Response(JSON.stringify(answer), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The URLs one service was asked. */
function asked(fetchMock: ReturnType<typeof vi.fn>, host: string): URL[] {
  return fetchMock.mock.calls.map(([input]) => new URL(String(input))).filter(url => url.hostname === host);
}

/** Answers as Geoapify and Photon did when the query was recorded. */
function stubRecordedAnswer(query: string) {
  return stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS[query] ?? [], photon: RECORDED_PHOTON_ANSWERS[query] ?? [] });
}

/** The rows shown, as a rider reads them. */
async function shownRows(response: Response) {
  return (await response.json() as { title: string; subtitle: string; covered: boolean }[])
    .map(({ title, subtitle, covered }) => [title, subtitle, covered]);
}

function inWorker(env: Record<string, unknown>) {
  getCloudflareContext.mockResolvedValue({ env });
}

// Inside the Zürich service area, and outside every service area.
const ZURICH: [number, number] = [47.3695, 8.5389];
const LAUSANNE: [number, number] = [46.5231, 6.6292];
const BERN: [number, number] = [46.948, 7.4474];
// Inside the Berlin service area, and in Paris, which has none.
const BERLIN: [number, number] = [52.52, 13.405];
const PARIS: [number, number] = [48.8566, 2.3522];

beforeEach(() => {
  rateLimitAllows.mockResolvedValue(true);
  getCloudflareContext.mockRejectedValue(new Error('getCloudflareContext has been called outside the Worker'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('GET /api/geocode', () => {
  it.each([
    ['Munich', 'München, Germany', 'München', 'Germany'],
    ['Rome', 'Roma, Italy', 'Roma', 'Italy'],
    ['Zürich', 'Zürich, Switzerland', 'Zürich', 'Switzerland'],
    ['Bern', 'Bern, Switzerland', 'Bern', 'Switzerland'],
  ])('finds %s without a geocoding request', async (query, name, title, subtitle) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await POST(postRequest(query));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual(expect.arrayContaining([
      expect.objectContaining({ display_name: name, title, subtitle, covered: true }),
    ]));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers a Swiss city with scooter data with the city itself, first and with a second line', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('Biel'));

    expect(response.headers.get('x-geocoding-data-source')).toBe('Verified scooter city catalog');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual([
      { lat: 47.1368, lng: 7.2468, display_name: 'Biel/Bienne, Switzerland', title: 'Biel/Bienne', subtitle: 'Switzerland', covered: true },
    ]);
    // The centre of the city, not of its canton or district.
    await expect((await GET(request('Zürich'))).json()).resolves.toEqual([
      { lat: 47.3769, lng: 8.5417, display_name: 'Zürich, Switzerland', title: 'Zürich', subtitle: 'Switzerland', covered: true },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('includes French scooter cities in searches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"features":[]}')));
    const result = await POST(postRequest('Marseille', 'fr'));
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual([
      { lat: 43.2965, lng: 5.3698, display_name: 'Marseille, France', title: 'Marseille', subtitle: 'France', covered: true },
    ]);
  });

  it('can still navigate to French cities when address search fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    const result = await GET(request('Lyon'));
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual([
      { lat: 45.7578, lng: 4.832, display_name: 'Lyon, France', title: 'Lyon', subtitle: 'France', covered: true },
    ]);
  });

  it.each([
    ['de', 'Deutschland', 'Schweiz'],
    ['fr', 'Allemagne', 'Suisse'],
    ['it', 'Germania', 'Svizzera'],
    ['es', 'Alemania', 'Suiza'],
    ['is', 'Þýskaland', 'Sviss'],
    ['en', 'Germany', 'Switzerland'],
    // Upper case is the same language; a language the apps are not shown in gets English.
    ['DE', 'Deutschland', 'Schweiz'],
    ['sv', 'Germany', 'Switzerland'],
    [undefined, 'Germany', 'Switzerland'],
  ])('writes the country of a city in the language asked for (%s)', async (language, germany, switzerland) => {
    vi.stubGlobal('fetch', vi.fn());
    // Without a map centre, Switzerland is near.
    const expected = [
      { lat: 46.948, lng: 7.4474, display_name: 'Bern, Switzerland', title: 'Bern', subtitle: switzerland, covered: true },
      { lat: 52.52, lng: 13.405, display_name: 'Berlin, Germany', title: 'Berlin', subtitle: germany, covered: true },
    ];

    await expect((await GET(request('Ber', language))).json()).resolves.toEqual(expected);
    await expect((await POST(postRequest('Ber', language))).json()).resolves.toEqual(expected);
  });

  it('asks in English when the language sent is not text', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const [munich] = await (await POST(postRequest('München', 7))).json() as { subtitle: string }[];
    expect(munich.subtitle).toBe('Germany');
  });

  it('validates query length before asking a geocoding service', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const response = await GET(request('Z'));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 429 when the client exceeds the address-search limit', async () => {
    rateLimitAllows.mockResolvedValue(false);

    const response = await GET(request('Zurich HB'));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
  });

  it('accepts address text in a non-cacheable POST body', async () => {
    stubUpstreams({});

    const response = await POST(postRequest('Bern Bahnhof', 'de'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-geocoding-data-source')).toBe('Photon, OpenStreetMap');
  });

  it('rejects malformed POST bodies without asking a geocoding service', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const invalidRequest = new NextRequest('https://example.com/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });

    const response = await POST(invalidRequest);

    expect(response.status).toBe(400);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('address search results', () => {
  it('puts a town typed by its name first, with scooter data or without', async () => {
    stubUpstreams({ photon: [
      [{ type: 'street', name: 'Lausannegasse', city: 'Zürich', countrycode: 'CH' }, ...ZURICH],
      [{ type: 'city', name: 'Lausanne', state: 'Vaud', country: 'Switzerland', countrycode: 'CH' }, ...LAUSANNE],
      [{ type: 'street', name: 'Lausannestrasse', city: 'Zürich', countrycode: 'CH' }, 47.3712, 8.5391],
    ] });

    const results = await (await GET(request('lausanne'))).json() as { title: string; covered: boolean }[];

    expect(results.map(result => [result.title, result.covered])).toEqual([
      ['Lausanne', false], ['Lausannegasse', true], ['Lausannestrasse', true],
    ]);
  });

  it('puts the place named as typed first among those with scooter data, in any word order and spelling', async () => {
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'Zürich Flughafen, OPC', city: 'Kloten', countrycode: 'CH' }, ...ZURICH],
      [{ type: 'house', name: 'Zürich Flughafen', city: 'Kloten', countrycode: 'CH' }, ...ZURICH],
      [{ type: 'house', name: 'Zürich Flughafen, Werft', city: 'Kloten', countrycode: 'CH' }, ...ZURICH],
    ] });

    const results = await (await GET(request('Flughafen Zuerich'))).json() as { title: string }[];

    expect(results.map(result => result.title)).toEqual(['Zürich Flughafen', 'Zürich Flughafen, OPC', 'Zürich Flughafen, Werft']);
  });

  it('reads an umlaut spelled out in a name, and nothing else into what was typed', async () => {
    const town = (name: string, lat: number, lng: number): PhotonRow => [{ type: 'city', name, country: 'Deutschland', countrycode: 'DE' }, lat, lng];
    const street = (name: string): PhotonRow => [{ type: 'street', name, city: 'Zürich', countrycode: 'CH' }, ...ZURICH];
    const answers = async (query: string, photon: PhotonRow[]) => {
      stubUpstreams({ photon });
      return (await (await POST(postRequest(query, 'de', ZURICH))).json() as { title: string }[]).map(place => place.title);
    };

    // A town whose name starts as typed comes before a street: "Muen" is on its way to München, and to Münster...
    expect(await answers('Muen', [street('Muenzgasse'), town('München', 48.1372, 11.5756)])).toEqual(['München', 'Münster', 'Muenzgasse']);
    // ...but "Joe" is not on its way to Johannisberg, as it was when "oe" was read as "o".
    expect(await answers('Joe', [town('Johannisberg', 49.99, 7.98), street('Joe-Kaeser-Weg')])).toEqual(['Joe-Kaeser-Weg', 'Johannisberg']);
  });

  it('ranks an address typed with ß as the same address typed with ss, and asks for it as typed', async () => {
    // Einsiedeln starts with the "e" that is left of "Straße" when the ß is taken for a space.
    const photon: PhotonRow[] = [
      [{ type: 'house', housenumber: '5', street: 'Bahnhofstrasse', postcode: '8840', city: 'Einsiedeln', countrycode: 'CH' }, 47.1281, 8.7529],
      [{ type: 'house', housenumber: '5', street: 'Bahnhofstrasse', postcode: '8001', city: 'Zürich', countrycode: 'CH' }, ...ZURICH],
      [{ type: 'house', housenumber: '50', street: 'Bahnhofstrasse', postcode: '8001', city: 'Zürich', countrycode: 'CH' }, 47.3712, 8.5391],
    ];
    const answers = async (query: string) => {
      const fetchMock = stubUpstreams({ photon });
      const results = await (await POST(postRequest(query))).json() as { title: string; subtitle: string }[];
      return { asked: asked(fetchMock, PHOTON_HOST)[0].searchParams.get('q'), results };
    };

    const typed = await answers('Bahnhofstraße 5');
    const swiss = await answers('Bahnhofstrasse 5');
    // Photon and Geoapify read ß themselves.
    expect(typed.asked).toBe('Bahnhofstraße 5');
    expect(typed.results).toEqual(swiss.results);
    expect(typed.results.map(result => [result.title, result.subtitle])).toEqual([
      ['Bahnhofstrasse 5', '8001 Zürich'], ['Bahnhofstrasse 50', '8001 Zürich'], ['Bahnhofstrasse 5', '8840 Einsiedeln'],
    ]);
  });

  it('ranks a place written with œ for the same word typed with oe, and one with it only inside a word after', async () => {
    stubUpstreams({ photon: [
      [{ type: 'district', name: 'Recoeurbe', city: 'Lausanne', countrycode: 'CH' }, ...LAUSANNE],
      [{ type: 'house', housenumber: '1', street: 'Chemin du Cœur', postcode: '1003', city: 'Lausanne', countrycode: 'CH' }, ...LAUSANNE],
    ] });

    const results = await (await GET(request('Coeur'))).json() as { title: string }[];

    // A typing mistake the service forgave: after what starts a word with what was typed.
    expect(results.map(result => result.title)).toEqual(['Chemin du Cœur 1', 'Recoeurbe']);
  });

  it('puts places near the map centre first, then those with scooter data', async () => {
    const photon: PhotonRow[] = [
      [{ type: 'street', name: 'Bahnhofstrasse', city: 'Berlin', countrycode: 'DE' }, ...BERLIN],
      [{ type: 'street', name: 'Bahnhofstrasse', city: 'Paris', countrycode: 'FR' }, ...PARIS],
      [{ type: 'street', name: 'Bahnhofstrasse', city: 'Zürich', countrycode: 'CH' }, ...ZURICH],
    ];
    const towns = async (near?: [number, number]) => {
      stubUpstreams({ photon });
      return (await (await POST(postRequest('Bahnhofstrasse', 'de', near))).json() as { subtitle: string }[]).map(place => place.subtitle);
    };

    // Nowhere in particular, as on the first view of the map: Switzerland first.
    expect(await towns()).toEqual(['Zürich', 'Berlin', 'Paris']);
    expect(await towns(ZURICH)).toEqual(['Zürich', 'Berlin', 'Paris']);
    expect(await towns(PARIS)).toEqual(['Paris', 'Berlin', 'Zürich']);
  });

  it('puts the address near the map centre before better-known ones farther away', async () => {
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'Arth-Goldau', housenumber: '1', street: 'Bahnhofstrasse', postcode: '6410', city: 'Goldau', countrycode: 'CH' }, 47.0491, 8.5496],
      [{ type: 'house', housenumber: '1', street: 'Bahnhofstrasse', postcode: '7304', city: 'Maienfeld', countrycode: 'CH' }, 47.0098, 9.5303],
      [{ type: 'house', housenumber: '1', street: 'Bahnhofstrasse', postcode: '8001', city: 'Zürich', countrycode: 'CH' }, 47.3673, 8.5399],
    ] });

    const results = await (await POST(postRequest('Bahnhofstrasse 1', 'de', ZURICH))).json() as { subtitle: string }[];

    // Then the far ones: Goldau, in the Zug service area, before Maienfeld without scooters.
    expect(results.map(result => result.subtitle)).toEqual(['8001 Zürich', 'Bahnhofstrasse 1, 6410 Goldau', '7304 Maienfeld']);
  });

  it('ranks a town found by another of its names, or spelled without its letters, as typed by its name', async () => {
    const titles = async (query: string, town: PhotonRow) => {
      stubUpstreams({ photon: [[{ type: 'street', name: `${query}weg`, city: 'Zürich', countrycode: 'CH' }, ...ZURICH], town] });
      return (await (await GET(request(query))).json() as { title: string }[]).map(place => place.title);
    };

    expect(await titles('Mailand', [{ type: 'city', name: 'Milan', country: 'Italy' }, 45.4642, 9.1896])).toEqual(['Milan', 'Mailandweg']);
    expect(await titles('Lodz', [{ type: 'city', name: 'Łódź', country: 'Polska' }, 51.7592, 19.456])).toEqual(['Łódź', 'Lodzweg']);
    // Not what is found for a street of its name.
    expect(await titles('Rue de Lyon', [{ type: 'city', name: 'Lyon', country: 'France' }, 45.7578, 4.832])).toEqual(['Rue de Lyonweg', 'Lyon']);
  });

  it('puts the towns whose names start as typed after those typed in full, the nearest first', async () => {
    const lausanne: PhotonRow = [{ type: 'city', name: 'Lausanne', state: 'Waadt', country: 'Schweiz', countrycode: 'CH' }, ...LAUSANNE];
    const leMont: PhotonRow = [{ type: 'city', name: 'Le Mont-sur-Lausanne', state: 'Waadt', country: 'Schweiz', countrycode: 'CH' }, 46.5582, 6.6315];
    // In the Basel service area, but far from Lausanne.
    const lausen: PhotonRow = [{ type: 'city', name: 'Lausen', state: 'Basel-Landschaft', country: 'Schweiz', countrycode: 'CH' }, 47.4714, 7.7604];
    const lausannegasse: PhotonRow = [{ type: 'street', name: 'Lausannegasse', city: 'Zürich', countrycode: 'CH' }, ...ZURICH];
    const titles = async (query: string, near: [number, number], photon: PhotonRow[]) => {
      stubUpstreams({ photon });
      return (await (await POST(postRequest(query, 'de', near))).json() as { title: string }[]).map(place => place.title);
    };

    expect(await titles('Lausanne', LAUSANNE, [lausannegasse, leMont, lausanne])).toEqual(['Lausanne', 'Le Mont-sur-Lausanne', 'Lausannegasse']);
    expect(await titles('Laus', LAUSANNE, [lausannegasse, lausen, lausanne, leMont])).toEqual(['Lausanne', 'Le Mont-sur-Lausanne', 'Lausen', 'Lausannegasse']);
    // Bern and Berlin from our list first. Burgdorf is in the canton of Bern, not on the way to it.
    expect(await titles('Ber', ZURICH, [
      [{ type: 'city', name: 'Burgdorf', state: 'Bern', country: 'Schweiz', countrycode: 'CH' }, 47.0559, 7.6271],
      [{ type: 'city', name: 'Bergdietikon', state: 'Aargau', country: 'Schweiz', countrycode: 'CH' }, 47.3898, 8.3865],
      [{ type: 'street', name: 'Bernerstrasse', city: 'Zürich', countrycode: 'CH' }, 47.3889, 8.4986],
    ])).toEqual(['Berlin', 'Bern', 'Bergdietikon', 'Bernerstrasse', 'Burgdorf']);
  });
});

// Our own list of the cities with scooter data, and the towns Geoapify finds anywhere.
describe('cities and towns', () => {
  beforeEach(() => {
    inWorker({ GEOAPIFY_API_KEY: 'test-key' });
  });

  async function titles(response: Response) {
    return ((await response.json()) as { title: string }[]).map(place => place.title);
  }

  it('asks only for the towns of a city typed in full, and puts the city of our list first', async () => {
    const fetchMock = stubUpstreams({ geoapify: { towns: [
      [{ result_type: 'city', name: 'Freiburg', city: 'Freiburg', state: 'Freiburg', country: 'Schweiz', country_code: 'ch' }, 46.8065, 7.1619],
      [{ result_type: 'city', name: 'Freiburg im Breisgau', city: 'Freiburg im Breisgau', state: 'Baden-Württemberg', country: 'Deutschland', country_code: 'de' }, 47.9959, 7.8522],
    ] } });

    const response = await POST(postRequest('Freiburg', 'de', BERN));

    expect(asked(fetchMock, GEOAPIFY_HOST).map(geoapifyRequest)).toEqual(['towns']);
    expect(response.headers.get('x-geocoding-data-source')).toBe('Verified scooter city catalog, Geoapify, OpenStreetMap');
    // Fribourg too, which is Freiburg in German; Geoapify's Freiburg im Breisgau is the one of our list.
    expect(await shownRows(response)).toEqual([['Freiburg im Breisgau', 'Deutschland', true], ['Freiburg', 'Schweiz', false]]);
  });

  it('lists the cities a few letters could become first, then the towns they start, then places', async () => {
    const fetchMock = stubUpstreams({ geoapify: {
      towns: [
        [{ result_type: 'city', name: 'Beromünster', city: 'Beromünster', state: 'Luzern', country: 'Schweiz', country_code: 'ch' }, 47.2076, 8.1924],
        [{ result_type: 'city', name: 'Bern', city: 'Bern', state: 'Bern', country: 'Schweiz', country_code: 'ch' }, 46.9481, 7.4474],
        [{ result_type: 'city', name: 'Bergdietikon', city: 'Bergdietikon', state: 'Aargau', country: 'Schweiz', country_code: 'ch' }, 47.3898, 8.3865],
        // Found by another of its names: three letters are no name typed in full.
        [{ result_type: 'city', name: 'Bärschwil', city: 'Bärschwil', state: 'Solothurn', country: 'Schweiz', country_code: 'ch' }, 47.3819, 7.4728],
      ],
      nearby: [[{ result_type: 'street', name: 'Bernerstrasse', city: 'Zürich', country_code: 'ch' }, 47.3889, 8.4986]],
    } });

    const response = await POST(postRequest('Ber', 'de', ZURICH));

    expect(asked(fetchMock, GEOAPIFY_HOST).map(geoapifyRequest)).toEqual(['towns', 'nearby']);
    expect(await titles(response)).toEqual(['Berlin', 'Bern', 'Bergdietikon', 'Beromünster', 'Bernerstrasse']);
  });

  it('takes a town of the name typed close to a city of our list for that city, ranked as that town', async () => {
    stubUpstreams({ geoapify: {
      towns: [[{ result_type: 'city', name: 'Rom', city: 'Rom', state: 'Latium', country: 'Italien', country_code: 'it' }, 41.8933, 12.4829]],
      nearby: [],
      anywhere: [],
    } });

    // Rome, which "Rom" names in German, before Romanshorn, whose name it starts, close by.
    expect(await shownRows(await POST(postRequest('Rom', 'de', [47.555, 9.39])))).toEqual([
      ['Roma', 'Italien', true], ['Romanshorn', 'Schweiz', true],
    ]);
  });

  it('leaves out the hamlets, quarters and stations Geoapify finds for towns, and its near misses', async () => {
    stubUpstreams({ geoapify: {
      towns: [
        [{ result_type: 'city', name: 'Lausanne', city: 'Lausanne', state: 'Waadt', country: 'Schweiz', country_code: 'ch' }, ...LAUSANNE],
        [{ result_type: 'city', name: 'Lausanne', city: 'Loché-sur-Indrois', state: 'Centre-Loire', country: 'Frankreich', country_code: 'fr' }, 47.0889, 1.2208],
        [{ result_type: 'suburb', name: 'Lausanne', city: 'Ouchy', country: 'Schweiz', country_code: 'ch' }, 46.5076, 6.6268],
        [{ result_type: 'amenity', name: 'Lausanne', street: 'Place de la Gare', city: 'Lausanne', country_code: 'ch' }, 46.5168, 6.6291],
        [{ result_type: 'city', name: 'Laussonne', city: 'Laussonne', state: 'Auvergne-Rhône-Alpes', country: 'Frankreich', country_code: 'fr', rank: { confidence: 0.7 } }, 44.9694, 4.0517],
        [{ result_type: 'city', name: 'Le Mont-sur-Lausanne', city: 'Le Mont-sur-Lausanne', state: 'Waadt', country: 'Schweiz', country_code: 'ch' }, 46.5582, 6.6315],
      ],
      nearby: [],
      anywhere: [],
    } });

    expect(await titles(await POST(postRequest('Lausanne', 'de', ZURICH)))).toEqual(['Lausanne', 'Le Mont-sur-Lausanne']);
  });

  it('waits for towns as long as for places, and a second and a half at most', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const lausanne: GeoapifyRow = [{ result_type: 'city', name: 'Lausanne', city: 'Lausanne', country: 'Schweiz', country_code: 'ch' }, ...LAUSANNE];
    const answer = (rows: GeoapifyRow[], afterMs: number) => new Promise<Response>(resolve => setTimeout(() => resolve(
      new Response(JSON.stringify({ results: rows.map(([fields, lat, lon]) => ({ ...fields, lat, lon })) }))), afterMs));
    const search = (townsAfterMs: number, placesAfterMs: number) => {
      vi.stubGlobal('fetch', vi.fn(async (input: URL) => geoapifyRequest(input) === 'towns'
        ? answer([lausanne], townsAfterMs)
        : answer([[{ result_type: 'street', name: 'Lausannestrasse', city: 'Zürich', country_code: 'ch' }, 47.3712, 8.5391]], placesAfterMs)));
      let answered = false;
      const response = POST(postRequest('Lausanne', 'de', ZURICH)).then(async result => { answered = true; return titles(result); });
      return { response, answered: () => answered };
    };

    const late = search(60_000, 500);
    await vi.advanceTimersByTimeAsync(1_499);
    expect(late.answered()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await late.response).toEqual(['Lausannestrasse']);

    const slowPlaces = search(2_500, 3_000);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(await slowPlaces.response).toEqual(['Lausanne', 'Lausannestrasse']);
  });

  it('still shows the cities of our list when the services fail', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubUpstreams({ geoapify: 503, photon: 503 });

    const response = await POST(postRequest('Ber', 'de', ZURICH));

    expect(response.status).toBe(200);
    expect(response.headers.get('x-geocoding-data-source')).toBe('Verified scooter city catalog');
    expect(await titles(response)).toEqual(['Berlin', 'Bern']);
  });
});

describe('places where the app has cities', () => {
  it('asks Photon in Europe, without regions, in the language of the app where it has one, near the map centre', async () => {
    const fetchMock = stubUpstreams({});

    await POST(postRequest('Rue de Rivoli 10', 'fr', [48.856613, 2.352222]));
    await POST(postRequest('Via Roma 10', 'it', [45.0703, 7.6869]));

    const [paris, turin] = asked(fetchMock, PHOTON_HOST);
    expect(paris.origin + paris.pathname).toBe('https://photon.komoot.io/api/');
    expect(Object.fromEntries(paris.searchParams)).toEqual(expect.objectContaining({
      q: 'Rue de Rivoli 10', lang: 'fr', bbox: '-32,27,45,72', location_bias_scale: '0.1',
      // To about a kilometre: no more than is needed to favour a neighbourhood.
      lat: '48.86', lon: '2.35',
    }));
    expect(paris.searchParams.getAll('layer')).toEqual(['house', 'street', 'locality', 'district', 'city', 'other']);
    // Photon has no Italian names: places keep their own.
    expect(turin.searchParams.get('lang')).toBe('default');
  });

  it.each([['Paris'], [[48.86]], [[48.86, 2.35, 0]], [['48.86', '2.35']], [[95, 2.35]], [[48.86, null]], [{ lat: 48.86, lng: 2.35 }]])(
    'takes %j for no map centre',
    async near => {
      const fetchMock = stubUpstreams({});

      expect((await POST(postRequest('Rue de Rivoli 10', 'fr', near))).status).toBe(200);

      expect(asked(fetchMock, PHOTON_HOST)[0].searchParams.has('lat')).toBe(false);
    }
  );

  it.each<[properties: Record<string, unknown>, title: string, subtitle: string]>([
    [{ type: 'house', housenumber: '10', street: 'Kaiserstraße', postcode: '76131', city: 'Karlsruhe', countrycode: 'DE' }, 'Kaiserstraße 10', '76131 Karlsruhe'],
    [{ type: 'house', housenumber: '10', street: 'Rue de Rivoli', postcode: '75004', city: 'Paris', countrycode: 'FR' }, '10 Rue de Rivoli', '75004 Paris'],
    [{ type: 'house', housenumber: '221B', street: 'Baker Street', postcode: 'NW1 6XE', city: 'London', countrycode: 'GB' }, '221B Baker Street', 'NW1 6XE London'],
    [{ type: 'house', street: 'Rue de Bercy', postcode: '75012', city: 'Paris', countrycode: 'FR' }, 'Rue de Bercy', '75012 Paris'],
    [{ type: 'house', name: 'Gare de Lyon', street: 'Place Louis Armand', postcode: '75012', city: 'Paris', countrycode: 'FR' }, 'Gare de Lyon', 'Place Louis Armand, 75012 Paris'],
    [{ type: 'house', name: 'Migros', housenumber: '152', street: 'Limmatstrasse', postcode: '8005', city: 'Zürich', countrycode: 'CH' }, 'Migros', 'Limmatstrasse 152, 8005 Zürich'],
    [{ type: 'house', name: 'Tromsø lufthavn', postcode: '9016', locality: 'Langnes', countrycode: 'NO' }, 'Tromsø lufthavn', '9016 Langnes'],
    // A street has a postcode in each of its parts; it is named by its town alone.
    [{ type: 'street', name: 'Karl Johans gate', postcode: '0154', city: 'Oslo', district: 'Sentrum', countrycode: 'NO' }, 'Karl Johans gate', 'Oslo'],
    [{ type: 'city', name: 'Épinay-sur-Orge', postcode: '91360', county: 'Essonne', state: 'Île-de-France', country: 'France' }, 'Épinay-sur-Orge', 'Île-de-France, France'],
    [{ type: 'city', name: 'Tromsø', county: 'Troms', country: 'Norge' }, 'Tromsø', 'Troms, Norge'],
    [{ type: 'city', name: 'Oslo', county: 'Oslo', country: 'Norge' }, 'Oslo', 'Norge'],
    [{ type: 'locality', name: 'Alexanderplatz', city: 'Berlin', district: 'Mitte' }, 'Alexanderplatz', 'Berlin'],
    [{ type: 'district', name: 'Kreuzberg', city: 'Berlin' }, 'Kreuzberg', 'Berlin'],
    [{ type: 'other', name: "L'Yon", county: 'Vendée', state: 'Pays de la Loire', country: 'France' }, "L'Yon", 'Vendée'],
    [{ type: 'other', name: 'Mont Blanc', state: 'Auvergne-Rhône-Alpes', country: 'France' }, 'Mont Blanc', 'Auvergne-Rhône-Alpes, France'],
    [{ type: 'somethingNew', name: '  Two\n lines ' }, 'Two lines', ''],
  ])('reads Photon place %j as "%s" and "%s"', async (properties, title, subtitle) => {
    stubUpstreams({ photon: [[properties, ...PARIS]] });

    await expect((await GET(request('anything'))).json()).resolves.toEqual([{
      lat: PARIS[0],
      lng: PARIS[1],
      // Split at its first comma by app versions that predate title and subtitle.
      display_name: subtitle ? `${title}, ${subtitle}` : title,
      title,
      subtitle,
      covered: false,
    }]);
  });

  it('leaves out Photon places without a name or a position', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ features: [
      null,
      {},
      { properties: { type: 'city', name: 'Nowhere' } },
      { properties: { type: 'city', name: 'Nowhere' }, geometry: { coordinates: 'here' } },
      { properties: { type: 'street', name: 'Rue de Rivoli' }, geometry: { coordinates: [200, 48.86] } },
      { properties: { type: 'street', name: 'Rue de Rivoli' }, geometry: { coordinates: [2.35, null] } },
      { properties: { type: 'house', housenumber: '10' }, geometry: { coordinates: [2.35, 48.86] } },
      { properties: 'Rue de Rivoli', geometry: { coordinates: [2.35, 48.86] } },
      { geometry: { coordinates: [2.35, 48.86] } },
      { properties: { type: 'street', name: 'Rue de Rivoli', city: 'Paris' }, geometry: { coordinates: [2.35, 48.86] } },
    ] }))));

    const results = await (await POST(postRequest('Rue de Rivoli', 'fr', PARIS))).json() as { title: string; subtitle: string }[];

    expect(results.map(result => [result.title, result.subtitle])).toEqual([['Rue de Rivoli', 'Paris']]);
  });

  it('lists a street once, not each of its parts, and a station once, not with its building, platforms and stops', async () => {
    stubUpstreams({ photon: [
      [{ type: 'street', name: 'Karl Johans gate', postcode: '0154', city: 'Oslo' }, 59.9119, 10.7465],
      [{ type: 'street', name: 'Karl Johans gate', postcode: '0162', city: 'Oslo' }, 59.9142, 10.7375],
      [{ type: 'street', name: 'Karl Johans gate', postcode: '1707', city: 'Sarpsborg' }, 59.2846, 11.111],
      [{ type: 'house', name: 'Gare de Lyon-Diderot', street: 'Boulevard Diderot', postcode: '75012', city: 'Paris' }, 48.8457, 2.3715],
      [{ type: 'house', name: 'Gare de Lyon - Diderot', street: 'Rue de Lyon', postcode: '75012', city: 'Paris' }, 48.846, 2.3721],
      // The same name a kilometre away is another place.
      [{ type: 'house', name: 'Gare de Lyon-Diderot', street: 'Rue de Lyon', postcode: '75012', city: 'Paris' }, 48.8547, 2.3715],
    ] });

    const results = await (await POST(postRequest('anything', 'en', PARIS))).json() as { title: string; subtitle: string }[];

    expect(results.map(result => [result.title, result.subtitle])).toEqual([
      ['Gare de Lyon-Diderot', 'Boulevard Diderot, 75012 Paris'],
      ['Gare de Lyon-Diderot', 'Rue de Lyon, 75012 Paris'],
      ['Karl Johans gate', 'Oslo'],
      ['Karl Johans gate', 'Sarpsborg'],
    ]);
  });

  it.each<[geoapify: number | null, photon: number | 'invalid', status: number, retryAfter: string | null]>([
    [null, 503, 502, '30'],
    [null, 429, 503, '60'],
    [null, 500, 502, '30'],
    [null, 'invalid', 502, null],
    // Photon's failure is the search's: Geoapify's was stood in for.
    [503, 429, 503, '60'],
    [429, 503, 502, '30'],
  ])('fails only when every service asked fails (Geoapify %s, Photon %s)', async (geoapify, photon, status, retryAfter) => {
    if (geoapify !== null) inWorker({ GEOAPIFY_API_KEY: 'test-key' });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async (input: URL) => {
      const answer = input.hostname === GEOAPIFY_HOST ? geoapify : photon;
      return answer === 'invalid' ? new Response('{"results":[]}') : new Response('', { status: answer ?? 200 });
    }));

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(response.status).toBe(status);
    expect(response.headers.get('retry-after')).toBe(retryAfter);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('answers that the search timed out when every service asked did', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('The operation timed out.', 'TimeoutError'); }));

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({ error: 'Address search timed out.' });
  });
});

// Geoapify where the Worker has its key, and Photon standing in for it.
describe('Geoapify', () => {
  const RIVOLI: PhotonRow = [{ type: 'house', housenumber: '10', street: 'Rue de Rivoli', postcode: '75004', city: 'Paris', countrycode: 'FR' }, 48.8556, 2.3594];

  beforeEach(() => {
    inWorker({ GEOAPIFY_API_KEY: 'test-key' });
  });

  /** Geoapify answering with a status, a page, or an error, after it has taken some time; Photon with Rivoli. */
  function stubGeoapify(geoapify: number | string | Error, takesMs = 0) {
    const fetchMock = vi.fn(async (input: URL) => {
      if (input.hostname !== GEOAPIFY_HOST) {
        return new Response(JSON.stringify({ features: [{ properties: RIVOLI[0], geometry: { coordinates: [RIVOLI[2], RIVOLI[1]] } }] }));
      }
      vi.setSystemTime(Date.now() + takesMs);
      if (geoapify instanceof Error) throw geoapify;
      return typeof geoapify === 'number' ? new Response('', { status: geoapify }) : new Response(geoapify);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  async function titles(response: Response) {
    return ((await response.json()) as { title: string }[]).map(place => place.title);
  }

  it('asks Geoapify alone for places within 50 km of the map centre, in the language of the app', async () => {
    const fetchMock = stubUpstreams({ geoapify: [[{ result_type: 'street', name: 'Karl Johans gate', city: 'Oslo', country_code: 'no' }, 59.9119, 10.7465]] });

    await POST(postRequest('Rue de Rivoli 10', 'fr', [48.856613, 2.352222]));
    const response = await POST(postRequest('Karl Johans gate', 'nb', [59.91, 10.75]));

    const [paris, ...oslo] = asked(fetchMock, GEOAPIFY_HOST);
    expect(paris.origin + paris.pathname).toBe('https://api.geoapify.com/v1/geocode/autocomplete');
    expect(Object.fromEntries(paris.searchParams)).toEqual({
      text: 'Rue de Rivoli 10',
      lang: 'fr',
      limit: '20',
      // To about a kilometre, longitude first.
      bias: 'proximity:2.35,48.86',
      filter: 'circle:2.35,48.86,50000',
      format: 'json',
      apiKey: 'test-key',
    });
    // Geoapify names places, and towns, in every language of the app.
    expect(oslo.map(url => [geoapifyRequest(url), url.searchParams.get('lang')])).toEqual([['towns', 'nb'], ['nearby', 'nb']]);
    expect(asked(fetchMock, PHOTON_HOST)).toEqual([]);
    expect(response.headers.get('x-geocoding-data-source')).toBe('Geoapify, OpenStreetMap');
    expect(await titles(response)).toEqual(['Karl Johans gate']);
  });

  it('asks Geoapify for a postcode when only a number is typed, with its town or without', async () => {
    const fetchMock = stubUpstreams({ geoapify: [[{ result_type: 'postcode', postcode: '8004', city: 'Zürich', country_code: 'ch' }, 47.3769, 8.5232]] });

    await POST(postRequest('8004', 'de', ZURICH));
    await POST(postRequest('8004 Zürich', 'de', ZURICH));
    await POST(postRequest('Langstrasse 120', 'de', ZURICH));

    expect(asked(fetchMock, GEOAPIFY_HOST).map(url => [url.searchParams.get('text'), url.searchParams.get('type')])).toEqual([
      ['8004', 'postcode'], ['8004', 'postcode'], ['Langstrasse 120', null],
    ]);
  });

  it('asks for places anywhere, still near the map centre, when none within 50 km of it is what was typed', async () => {
    const zurichHb: GeoapifyRow = [{ result_type: 'amenity', name: 'Zürich HB', street: 'Bahnhofplatz', postcode: '8001', city: 'Zürich', country_code: 'ch' }, 47.3779, 8.5403];
    // Geoapify's near misses: what it found for some of what was typed.
    const zurichstrasse: GeoapifyRow = [{ result_type: 'street', name: 'Zürichstrasse', city: 'Münchenbuchsee', country_code: 'ch', rank: { confidence: 0 } }, 47.0215, 7.4513];
    const search = async (nearby: GeoapifyRow[]) => {
      const fetchMock = stubUpstreams({ geoapify: { towns: [], nearby, anywhere: [zurichHb] } });
      const response = await POST(postRequest('Zürich HB', 'de', BERN));
      return {
        asked: asked(fetchMock, GEOAPIFY_HOST).map(url => [geoapifyRequest(url), url.searchParams.get('bias')]),
        titles: await titles(response),
      };
    };

    expect(await search([])).toEqual({
      asked: [['towns', 'proximity:7.45,46.95'], ['nearby', 'proximity:7.45,46.95'], ['anywhere', 'proximity:7.45,46.95']],
      titles: ['Zürich HB'],
    });
    // After what was found for what was typed.
    expect((await search([zurichstrasse])).titles).toEqual(['Zürich HB', 'Zürichstrasse']);
    expect((await search([zurichHb])).asked.map(([request]) => request)).toEqual(['towns', 'nearby']);
  });

  it('asks for the towns of the name typed anywhere, but not for an address or a postcode', async () => {
    const fetchMock = stubUpstreams({ geoapify: [[{ result_type: 'street', name: 'Langstrasse', city: 'Zürich', country_code: 'ch' }, ...ZURICH]] });

    await POST(postRequest('Lausanne', 'de', ZURICH));
    await GET(request('Lausanne', 'de'));
    await POST(postRequest('Langstrasse 120', 'de', ZURICH));
    await POST(postRequest('8004', 'de', ZURICH));
    await POST(postRequest('Kolosseum, Roma', 'de', ZURICH));

    expect(asked(fetchMock, GEOAPIFY_HOST).filter(url => geoapifyRequest(url) === 'towns').map(url => Object.fromEntries(url.searchParams))).toEqual([
      { text: 'Lausanne', lang: 'de', limit: '20', bias: 'proximity:8.54,47.37', type: 'city', format: 'json', apiKey: 'test-key' },
      { text: 'Lausanne', lang: 'de', limit: '20', bias: 'countrycode:ch', type: 'city', format: 'json', apiKey: 'test-key' },
    ]);
  });

  it('looks for an address typed with a city of our list in that city, without its name, wherever the map is', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const biel: GeoapifyRow = [{ result_type: 'building', housenumber: '10', street: 'Bahnhofstrasse', postcode: '2501', city: 'Biel/Bienne', country_code: 'ch', rank: { confidence: 0.75 } }, 47.1334, 7.2425];
    const lyss: GeoapifyRow = [{ result_type: 'building', housenumber: '10', street: 'Bahnhofstrasse', postcode: '3250', city: 'Lyss', country_code: 'ch' }, 47.0745, 7.3065];
    const asks = (fetchMock: ReturnType<typeof vi.fn>, host: string, ...params: string[]) =>
      asked(fetchMock, host).map(url => params.map(param => url.searchParams.get(param)));

    const inBiel = stubUpstreams({ geoapify: { nearby: [lyss, biel] } });
    const response = await POST(postRequest('Bahnhofstrasse 10, Biel', 'de', ZURICH));
    // No towns for an address.
    expect(asks(inBiel, GEOAPIFY_HOST, 'text', 'bias', 'filter')).toEqual([
      ['Bahnhofstrasse 10', 'proximity:7.2468,47.1368', 'circle:7.2468,47.1368,15000'],
    ]);
    // The one in Biel first: its town was typed.
    expect((await shownRows(response)).map(([, subtitle]) => subtitle)).toEqual(['2501 Biel/Bienne', '3250 Lyss']);

    // Nothing in Biel: anywhere, near it, with its name.
    const anywhere = stubUpstreams({ geoapify: { nearby: [], anywhere: [biel] } });
    await POST(postRequest('Bahnhofstrasse 10 Biel', 'de'));
    expect(asks(anywhere, GEOAPIFY_HOST, 'text', 'bias', 'filter')).toEqual([
      ['Bahnhofstrasse 10', 'proximity:7.2468,47.1368', 'circle:7.2468,47.1368,15000'],
      ['Bahnhofstrasse 10 Biel', 'proximity:7.2468,47.1368', null],
    ]);

    // And so Photon, when it stands in.
    const photon = stubUpstreams({ geoapify: 503 });
    await POST(postRequest('Bahnhofstrasse 10 Biel', 'de', ZURICH));
    expect(asks(photon, PHOTON_HOST, 'q', 'lat', 'lon')).toEqual([['Bahnhofstrasse 10 Biel', '47.1368', '7.2468']]);
  });

  it('asks Geoapify for places in Switzerland first without a map centre', async () => {
    const fetchMock = stubUpstreams({});

    await GET(request('Bahnhofstrasse 1', 'de'));
    await POST(postRequest('Bahnhofstrasse 1', 'de'));

    expect(asked(fetchMock, GEOAPIFY_HOST).map(url => url.searchParams.get('bias'))).toEqual(['countrycode:ch', 'countrycode:ch']);
  });

  it.each<[fields: Record<string, unknown>, title: string, subtitle: string]>([
    [{ result_type: 'building', housenumber: '120', street: 'Langstrasse', postcode: '8004', city: 'Zürich', suburb: 'Kreis 4', country_code: 'ch' }, 'Langstrasse 120', '8004 Zürich'],
    [{ result_type: 'building', housenumber: '10', street: 'Rue de Rivoli', postcode: '75004', city: 'Paris', country_code: 'fr' }, '10 Rue de Rivoli', '75004 Paris'],
    [{ result_type: 'amenity', name: 'Don Leone', housenumber: '31', street: 'Bäckerstrasse', postcode: '8004', city: 'Zürich', country_code: 'ch' }, 'Don Leone', 'Bäckerstrasse 31, 8004 Zürich'],
    // A street has a postcode in each of its parts; it is named by its town alone.
    [{ result_type: 'street', name: 'Karl Johans gate', street: 'Karl Johans gate', postcode: '0154', city: 'Oslo', suburb: 'Sentrum', country_code: 'no' }, 'Karl Johans gate', 'Oslo'],
    [{ result_type: 'city', name: 'Colonia', city: 'Colonia', state: 'Renania Settentrionale-Vestfalia', country: 'Germania', country_code: 'de' }, 'Colonia', 'Renania Settentrionale-Vestfalia, Germania'],
    // A hamlet, by the town it is part of.
    [{ result_type: 'city', name: 'Mailand', city: 'Leutkirch im Allgäu', state: 'Baden-Württemberg', country: 'Deutschland', country_code: 'de' }, 'Mailand', 'Leutkirch im Allgäu'],
    // A quarter and a postcode are named in their own fields.
    [{ result_type: 'suburb', suburb: 'Kreis 4', city: 'Zürich', country_code: 'ch' }, 'Kreis 4', 'Zürich'],
    [{ result_type: 'district', district: 'Mitte', city: 'Berlin', country_code: 'de' }, 'Mitte', 'Berlin'],
    [{ result_type: 'postcode', postcode: '8004', city: 'Zürich', country_code: 'ch' }, '8004', 'Zürich'],
    [{ result_type: 'unknown', name: 'Uetliberg', state: 'Zürich', country: 'Schweiz', country_code: 'ch' }, 'Uetliberg', 'Zürich, Schweiz'],
  ])('reads Geoapify place %j as "%s" and "%s"', async (fields, title, subtitle) => {
    stubUpstreams({ geoapify: [[fields, ...PARIS]] });

    await expect((await GET(request('anything'))).json()).resolves.toEqual([{
      lat: PARIS[0],
      lng: PARIS[1],
      display_name: subtitle ? `${title}, ${subtitle}` : title,
      title,
      subtitle,
      covered: false,
    }]);
  });

  it('leaves out counties, regions, countries, places outside Europe and North America and places without a name or a position', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: [
      null,
      'Springfield',
      { result_type: 'county', name: 'Springfield', country: 'United States', country_code: 'us', lat: 39.8, lon: -89.65 },
      { result_type: 'state', name: 'Springfield', country: 'Österreich', country_code: 'at', lat: 47.5, lon: 14.5 },
      { result_type: 'country', name: 'Springfield', country_code: 'xx', lat: 47.5, lon: 14.5 },
      { result_type: 'city', name: 'Springfield', state: 'Illinois', country: 'United States', country_code: 'us', lat: 39.7989, lon: -89.6544 },
      { result_type: 'city', name: 'Springfield', state: 'Western Cape', country: 'South Africa', country_code: 'za', lat: -33.9, lon: 18.6 },
      { result_type: 'city', name: 'Springfield', country_code: 'gb' },
      { result_type: 'city', name: 'Springfield', country_code: 'gb', lat: '51.7', lon: '0.5' },
      { result_type: 'building', housenumber: '1', country_code: 'gb', lat: 51.7, lon: 0.5 },
      { name: 'Springfield', country_code: 'gb', lat: 51.7, lon: 0.5 },
      { result_type: 'city', name: 'Springfield', state: 'England', country: 'United Kingdom', country_code: 'gb', lat: 51.7486, lon: 0.4625 },
    ] }))));

    const results = await (await GET(request('Springfield'))).json() as { title: string; subtitle: string }[];

    expect(results.map(result => [result.title, result.subtitle])).toEqual([
      ['Springfield', 'Illinois, United States'], ['Springfield', 'England, United Kingdom'],
    ]);
  });

  it('ranks a town found by another of its names as typed by it, but not one found for a near miss of it', async () => {
    const titles = async (query: string, geoapify: GeoapifyRow[]) => {
      stubUpstreams({ geoapify });
      return (await (await POST(postRequest(query, 'de', ZURICH))).json() as { title: string }[]).map(place => place.title);
    };

    expect(await titles('Rheinfall', [
      [{ result_type: 'city', name: 'Rheinwald', state: 'Graubünden', country: 'Schweiz', country_code: 'ch', rank: { confidence: 0.7 } }, 46.5317, 9.2579],
      [{ result_type: 'city', name: 'Neuhausen am Rheinfall', state: 'Schaffhausen', country: 'Schweiz', country_code: 'ch', rank: { confidence: 1 } }, 47.6812, 8.6197],
    ])).toEqual(['Neuhausen am Rheinfall', 'Rheinwald']);
    expect(await titles('Lodz', [
      [{ result_type: 'street', name: 'Lodzweg', city: 'Zürich', country_code: 'ch', rank: { confidence: 1 } }, ...ZURICH],
      [{ result_type: 'city', name: 'Łódź', state: 'Woiwodschaft Łódź', country: 'Polen', country_code: 'pl', rank: { confidence: 1 } }, 51.7592, 19.456],
    ])).toEqual(['Łódź', 'Lodzweg']);
    expect(await titles('Mailand', [
      [{ result_type: 'street', name: 'Mailandweg', city: 'Zürich', country_code: 'ch' }, ...ZURICH],
      [{ result_type: 'city', name: 'Milan', state: 'Lombardei', country: 'Italien', country_code: 'it', rank: { confidence: 1 } }, 45.4642, 9.1896],
    ])).toEqual(['Milan', 'Mailandweg']);
  });

  it('ranks the quarter of a postcode above the town whose postcode starts with it', async () => {
    stubUpstreams({ geoapify: [
      [{ result_type: 'city', name: 'Pompei', postcode: '80045', city: 'Pompei', state: 'Campania', country: 'Italia', country_code: 'it' }, 40.7491, 14.5009],
      [{ result_type: 'suburb', name: 'Werd', postcode: '8004', city: 'Zürich', suburb: 'Werd', country_code: 'ch' }, 47.3726, 8.5262],
    ] });

    const results = await (await POST(postRequest('8004', 'de', ZURICH))).json() as { title: string }[];

    expect(results.map(result => result.title)).toEqual(['Werd', 'Pompei']);
  });

  it.each<[geoapify: number | string | Error, failure: string]>([
    // Out of the day's credits, or a key it no longer takes.
    [429, 'rateLimited'],
    [401, 'unavailable'],
    [503, 'unavailable'],
    ['{"results":"none"}', 'invalid'],
    [new TypeError('Network connection lost.'), 'unavailable'],
    [new DOMException('The operation timed out.', 'TimeoutError'), 'timedOut'],
  ])('asks Photon when Geoapify answers %s', async (geoapify, failure) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubGeoapify(geoapify);

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(asked(fetchMock, GEOAPIFY_HOST)).toHaveLength(1);
    expect(asked(fetchMock, PHOTON_HOST)[0].searchParams.get('q')).toBe('Rue de Rivoli 10');
    expect(response.headers.get('x-geocoding-data-source')).toBe('Photon, OpenStreetMap');
    expect(await titles(response)).toEqual(['10 Rue de Rivoli']);
    expect(warn).toHaveBeenCalledWith(JSON.stringify({ event: 'geoapify_fallback', failure }));
  });

  it('gives Geoapify five seconds, and Photon the rest of the ten one search has', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeouts = vi.spyOn(AbortSignal, 'timeout');
    stubGeoapify(new DOMException('The operation timed out.', 'TimeoutError'), 5_000);

    await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(timeouts.mock.calls).toEqual([[5_000], [5_000]]);
  });

  it('gives the search anywhere five seconds too, and Photon what the two left', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeouts = vi.spyOn(AbortSignal, 'timeout');
    const fetchMock = vi.fn(async (input: URL) => {
      if (input.hostname !== GEOAPIFY_HOST) return new Response(JSON.stringify({ features: [] }));
      vi.setSystemTime(Date.now() + (geoapifyRequest(input) === 'nearby' ? 3_000 : 5_000));
      if (geoapifyRequest(input) === 'nearby') return new Response(JSON.stringify({ results: [] }));
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });
    vi.stubGlobal('fetch', fetchMock);

    await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(asked(fetchMock, GEOAPIFY_HOST).map(geoapifyRequest)).toEqual(['nearby', 'anywhere']);
    expect(timeouts.mock.calls).toEqual([[5_000], [5_000], [2_000]]);
  });

  it('leaves our own Photon three seconds of what Geoapify left, and the public one the rest', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    inWorker({ GEOAPIFY_API_KEY: 'test-key', PHOTON_API_URL: 'https://photon.example.ch/api/' });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeouts = vi.spyOn(AbortSignal, 'timeout');
    vi.stubGlobal('fetch', vi.fn(async (input: URL) => {
      vi.setSystemTime(Date.now() + (input.hostname === GEOAPIFY_HOST ? 4_000 : 3_000));
      throw new DOMException('The operation timed out.', 'TimeoutError');
    }));

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(timeouts.mock.calls).toEqual([[5_000], [3_000], [3_000]]);
    expect(response.status).toBe(504);
  });
});

// Our own Photon where the Worker names one, and komoot's public one standing in for it.
describe('our own Photon', () => {
  const OWN_PHOTON = 'https://photon.example.ch/api/';
  const PUBLIC_PHOTON = 'https://photon.komoot.io/api/';
  const TOKEN = { PHOTON_ACCESS_CLIENT_ID: 'id.access', PHOTON_ACCESS_CLIENT_SECRET: 'secret' };
  const RIVOLI: PhotonRow = [{ type: 'house', housenumber: '10', street: 'Rue de Rivoli', postcode: '75004', city: 'Paris', countrycode: 'FR' }, 48.8556, 2.3594];

  /** Our own Photon answering with a status, a page, or an error, after it has taken some time; the public one with Rivoli. */
  function stubOwnPhoton(own: number | string | Error, takesMs = 0) {
    const fetchMock = vi.fn(async (input: URL) => {
      if (input.hostname !== new URL(OWN_PHOTON).hostname) {
        return new Response(JSON.stringify({ features: [{ properties: RIVOLI[0], geometry: { coordinates: [RIVOLI[2], RIVOLI[1]] } }] }));
      }
      vi.setSystemTime(Date.now() + takesMs);
      if (own instanceof Error) throw own;
      return typeof own === 'number' ? new Response('', { status: own }) : new Response(own);
    });
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
  }

  /** Each Photon asked, in order, with the Access token it was sent. */
  function photonsAsked(fetchMock: ReturnType<typeof vi.fn>) {
    return fetchMock.mock.calls
      .map(([input, init]) => [new URL(String(input)), new Headers((init as RequestInit).headers)] as const)
      .map(([url, headers]) => [url.origin + url.pathname, headers.get('CF-Access-Client-Id'), headers.get('CF-Access-Client-Secret')]);
  }

  async function titles(response: Response) {
    return ((await response.json()) as { title: string }[]).map(place => place.title);
  }

  it.each<[url: string | undefined, id: string | undefined, secret: string | undefined, photon: (string | null)[]]>([
    [OWN_PHOTON, 'id.access', 'secret', [OWN_PHOTON, 'id.access', 'secret']],
    // Half a token is none.
    [OWN_PHOTON, 'id.access', '', [OWN_PHOTON, null, null]],
    [OWN_PHOTON, undefined, 'secret', [OWN_PHOTON, null, null]],
    // The public one never sees the token.
    ['http://photon.example.ch/api/', 'id.access', 'secret', [PUBLIC_PHOTON, null, null]],
    ['', 'id.access', 'secret', [PUBLIC_PHOTON, null, null]],
    [undefined, 'id.access', 'secret', [PUBLIC_PHOTON, null, null]],
  ])('asks the Photon set in PHOTON_API_URL only over HTTPS, with the Access token only if whole (%s)', async (url, id, secret, photon) => {
    inWorker({ PHOTON_API_URL: url, PHOTON_ACCESS_CLIENT_ID: id, PHOTON_ACCESS_CLIENT_SECRET: secret });
    const fetchMock = stubUpstreams({ photon: [RIVOLI] });

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(photonsAsked(fetchMock)).toEqual([photon]);
    expect(asked(fetchMock, new URL(String(photon[0])).hostname)[0].searchParams.get('q')).toBe('Rue de Rivoli 10');
    expect(await titles(response)).toEqual(['10 Rue de Rivoli']);
    expect(response.headers.get('x-geocoding-data-source')).toBe('Photon, OpenStreetMap');
  });

  it.each<[own: number | string | Error, failure: string]>([
    [502, 'unavailable'],
    // Cloudflare Access's sign-in page, for a token it no longer takes.
    ['<!DOCTYPE html><title>Sign in ・ Cloudflare Access</title>', 'unavailable'],
    [new TypeError('Network connection lost.'), 'unavailable'],
    [new DOMException('The operation timed out.', 'TimeoutError'), 'timedOut'],
  ])('asks the public Photon when ours answers %s', async (own, failure) => {
    inWorker({ PHOTON_API_URL: OWN_PHOTON, ...TOKEN });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchMock = stubOwnPhoton(own);

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(photonsAsked(fetchMock)).toEqual([[OWN_PHOTON, 'id.access', 'secret'], [PUBLIC_PHOTON, null, null]]);
    expect(await titles(response)).toEqual(['10 Rue de Rivoli']);
    expect(warn).toHaveBeenCalledWith(JSON.stringify({ event: 'photon_fallback', failure }));
  });

  it('gives ours three seconds, and the public one the rest of the ten one search has', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    inWorker({ PHOTON_API_URL: OWN_PHOTON, ...TOKEN });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeouts = vi.spyOn(AbortSignal, 'timeout');
    stubOwnPhoton(new DOMException('The operation timed out.', 'TimeoutError'), 3_000);

    await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(timeouts.mock.calls).toEqual([[3_000], [7_000]]);
  });

  it('does not send the public Photon what ours turned away as too many', async () => {
    inWorker({ PHOTON_API_URL: OWN_PHOTON, ...TOKEN });
    const fetchMock = stubOwnPhoton(429);

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(photonsAsked(fetchMock)).toEqual([[OWN_PHOTON, 'id.access', 'secret']]);
    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('60');
  });
});

type ShownRow = [title: string, subtitle: string, covered: boolean];
const NO_DATA = false;
const DATA = true;

// The rows a rider sees across Europe, answered as Photon answered them.
describe('recorded Photon answers', () => {
  it.each<[query: string, language: string, near: [number, number], rows: ShownRow[]]>([
    // Fifteen rows: the station, its building, its platforms, its stops. Paris has no rental scooters.
    ['Gare de Lyon', 'fr', [48.86, 2.35], [
      ['Gare de Lyon', 'Place Louis Armand, 75012 Paris', NO_DATA],
      ['Gare de Lyon - Van Gogh', 'Rue de Bercy, 75012 Paris', NO_DATA],
      ['Gare de Lyon-Diderot', 'Boulevard Diderot, 75012 Paris', NO_DATA],
    ]],
    // The square, as a place, a street, a station and its entrances.
    ['Alexanderplatz', 'de', [52.52, 13.4], [['Alexanderplatz', 'Berlin', DATA]]],
    // The street in seven parts, then the shops on it before the streets of the same name in other towns.
    ['Karl Johans gate', 'nb', [59.91, 10.75], [
      ['Karl Johans gate', 'Oslo', DATA],
      ['PARADIS Gelateria Karl Johans gate', 'Karl Johans gate, 0153 Oslo', DATA],
      ['7-Eleven Karl Johans gate', 'Karl Johans gate, 0153 Oslo', DATA],
      ['Krogh Optikk Karl Johansgate 2', 'Karl Johans gate, 0154 Oslo', DATA],
      ['Karl Johan hotell', 'Karl Johans gate, 0162 Oslo', DATA],
    ]],
    // The one in Paris first, although the suburbs have scooters and Paris has none.
    ['Rue de Rivoli 10', 'fr', [48.86, 2.35], [
      ['10 Rue de Rivoli', '75004 Paris', NO_DATA],
      ['Rivoli Collection', 'Rue du Château Landon, 75010 Paris', NO_DATA],
      ['10 Rue de Rivoli', '78450 Villepreux', DATA],
      ['10 Rue de Rivoli', '91360 Épinay-sur-Orge', NO_DATA],
      ['10 Rue de Rivoli', '76600 Le Havre', DATA],
    ]],
    // Fifteen platforms, stops and entrances of the one station.
    ['Hauptbahnhof', 'de', [48.14, 11.57], [['Hauptbahnhof', 'Bahnhofplatz, 80335 München', DATA]]],
  ])('answers "%s" with the places a rider would choose', async (query, language, near, rows) => {
    stubUpstreams({ photon: RECORDED_PHOTON_ANSWERS[query] });

    const response = await POST(postRequest(query, language, near));
    const results = await response.json() as { title: string; subtitle: string; covered: boolean }[];

    expect(response.headers.get('x-geocoding-data-source')).toBe('Photon, OpenStreetMap');
    expect(results.map(result => [result.title, result.subtitle, result.covered])).toEqual(rows);
  });
});

// The rows a rider sees, answered as Geoapify answered them.
describe('recorded Geoapify answers', () => {
  beforeEach(() => {
    inWorker({ GEOAPIFY_API_KEY: 'test-key' });
  });

  it.each<[query: string, language: string, near: [number, number] | undefined, requests: GeoapifyRequest[], rows: ShownRow[]]>([
    // The station and its entrances, each under its own name.
    ['Gare de Lyon', 'fr', [48.86, 2.35], ['towns', 'nearby'], [
      ['Gare de Lyon', 'Place Louis Armand, 75012 Paris', NO_DATA],
      ['Gare de Lyon-Diderot', 'Boulevard Diderot, 75012 Paris', NO_DATA],
      ['Gare de Lyon - Place Louis Armand', 'Place Louis Armand, 75012 Paris', NO_DATA],
      ['Gare de Lyon - Van Gogh', 'Quai de la Rapée, 75012 Paris', NO_DATA],
      ['Gare de Lyon - Chalon', 'Rue de Chalon, 75012 Paris', NO_DATA],
    ]],
    // Not the squares of the same name in four other German towns, 200 km and more away.
    ['Alexanderplatz', 'de', [52.52, 13.4], ['towns', 'nearby'], [['Alexanderplatz', 'Berlin', DATA]]],
    ['Karl Johans gate', 'nb', [59.91, 10.75], ['towns', 'nearby'], [['Karl Johans gate', 'Oslo', DATA]]],
    // The one in Paris, then its street, before the same address in the towns around.
    ['Rue de Rivoli 10', 'fr', [48.86, 2.35], ['nearby'], [
      ['10 Rue de Rivoli', '75004 Paris', NO_DATA],
      ['Rue de Rivoli', 'Paris', NO_DATA],
      ['10 Rue de Rivoli', '78450 Villepreux', DATA],
      ['10 Rue de Rivoli', '91360 Épinay-sur-Orge', NO_DATA],
      ['10 Rue de Rivoli', '78950 Gambais', NO_DATA],
    ]],
    // Turin's first, before the Via Roma 10 of the towns around it.
    ['Via Roma 10', 'it', [45.07, 7.69], ['nearby'], [
      ['Via Roma 10', '10123 Torino', NO_DATA],
      ['Via Romagnano 10', '10145 Torino', NO_DATA],
      ['Via Roma', 'Torino', NO_DATA],
      ['Via Roma 10', '10099 Torino', NO_DATA],
      ['Via Roma 10', '10025 Pino Torinese', NO_DATA],
    ]],
    // The address, then the hotel and the bakery at it. No towns for an address.
    ['Langstrasse 120', 'de', [47.37, 8.54], ['nearby'], [
      ['Langstrasse 120', '8004 Zürich', DATA],
      ['Nani City Hotel', 'Langstrasse 120, 8004 Zürich', DATA],
      ['happybeck', 'Langstrasse 120, 8004 Zürich', DATA],
      ['Langstrasse', 'Zürich', DATA],
      ['Langstrasse 120', '8966 Lieli', DATA],
    ]],
    // A restaurant by its name, only those close to the map.
    ['Don Leone', 'de', [47.37, 8.54], ['towns', 'nearby'], [
      ['Don Leone', 'Bäckerstrasse 31, 8004 Zürich', DATA],
      ['Don Leone', 'Waffenplatzstrasse 15, 8002 Zürich', DATA],
      ['Don Leone Delivery', 'Gotthardstrasse 40, 8800 Thalwil', DATA],
    ]],
    // Zürich's postcode, not those elsewhere that start with it.
    ['8004', 'de', [47.37, 8.54], ['nearby'], [['8004', 'Zürich', DATA]]],
    // The town at the falls, then the streets named after them, not the towns Geoapify found for a near miss of the name.
    ['Rheinfall', 'de', [47.37, 8.54], ['towns', 'nearby'], [
      ['Neuhausen am Rheinfall', 'Schaffhausen, Schweiz', DATA],
      ['Rheinfallweg 3', '8447 Dachsen', DATA],
      ['Rheinfallweg 11', '8447 Dachsen', DATA],
      ['Rheinfallweg 17', '8447 Dachsen', DATA],
      ['Rheinfallstrasse 20', '8447 Dachsen', DATA],
    ]],
    // Of twenty across the world, the American ones Geoapify knows best, none of them nearer Switzerland than another.
    ['Springfield', 'en', undefined, ['towns', 'anywhere'], [
      ['Springfield', 'Missouri, United States', NO_DATA],
      ['Springfield', 'Illinois, United States', NO_DATA],
      ['Springfield', 'Massachusetts, United States', NO_DATA],
      ['Springfield', 'Oregon, United States', NO_DATA],
      ['Springfield', 'Ohio, United States', NO_DATA],
    ]],
    // Munich's, not the quarters of the name in Stuttgart and Saarbrücken found for towns.
    ['Hauptbahnhof', 'de', [48.14, 11.56], ['towns', 'nearby'], [['München Hauptbahnhof', 'Arnulfstraße, 80335 München', DATA]]],
    // Nothing of the name within 50 km of Zürich: Lausanne, the towns that bear its name, a township in Pennsylvania.
    ['Lausanne', 'de', [47.37, 8.54], ['towns', 'nearby', 'anywhere'], [
      ['Lausanne', 'Waadt, Schweiz', NO_DATA],
      ['Le Mont-sur-Lausanne', 'Waadt, Schweiz', NO_DATA],
      ['Cheseaux-sur-Lausanne', 'Waadt, Schweiz', NO_DATA],
      ['Romanel-sur-Lausanne', 'Waadt, Schweiz', NO_DATA],
      ['Lausanne Township', 'Pennsylvania, Vereinigte Staaten von Amerika', NO_DATA],
    ]],
    // Milan, which "Mailand" names in German, before the street of the name close by.
    ['Mailand', 'de', [47.37, 8.54], ['towns', 'nearby'], [
      ['Mailand', 'Lombardei, Italien', NO_DATA],
      ['Im Mailand 10', '79802 Baltersweil', DATA],
      ['Im Mailand 12', '79802 Baltersweil', DATA],
      ['Im Mailand', 'Baltersweil', DATA],
      ['Im Mailand 3', '79802 Baltersweil', DATA],
    ]],
    // Nothing within 50 km of Zürich: the one in Rome.
    ['Kolosseum Rom', 'de', [47.37, 8.54], ['towns', 'nearby', 'anywhere'], [['Kolosseum', 'Piazza del Colosseo, 00184 Rom', DATA]]],
    // From Bern, the station in Zürich, not the Zürichstrasse close by.
    ['Zürich HB', 'de', [46.95, 7.44], ['towns', 'nearby', 'anywhere'], [
      ['Zürich HB', 'Walchebrücke, 8021 Zürich', DATA],
      ['Zürich HB SZU Süd', 'Militärbrücke, 8004 Zürich', DATA],
      ['Taxistand Zürich HB', 'Bahnhofpassage, 8021 Zürich', DATA],
      ['Sihlpost/HB', 'Kasernenstrasse, 8004 Zürich', DATA],
      ['Avia Service HB', 'Ausstellungsstrasse, 8021 Zürich', DATA],
    ]],
    // In Biel, wherever the map is, then in the towns around it.
    ['Bahnhofstrasse 10 Biel', 'de', [47.37, 8.54], ['nearby'], [
      ['Bahnhofstrasse 10', '2501 Biel', DATA],
      ['Bahnhofstrasse 10', '3292 Lyss', DATA],
      ['Bahnhofstrasse 10', '3293 Dotzigen', DATA],
      ['Bahnhofstrasse 10', '2542 Pieterlen', DATA],
      ['Bahnhofstrasse 10', '3250 Lyss', DATA],
    ]],
    // The city of our list, then the other towns of the name, for one request.
    ['Freiburg', 'de', [46.95, 7.44], ['towns'], [
      ['Freiburg im Breisgau', 'Deutschland', DATA],
      ['Freiburg', 'Schweiz', NO_DATA],
      ['Freiburg', 'Grand Est, Frankreich', NO_DATA],
      ['Freiburg (Elbe)', 'Niedersachsen, Deutschland', NO_DATA],
    ]],
    // The cities of our list it may become, then the towns it starts close by.
    ['Ber', 'de', [47.37, 8.54], ['towns', 'nearby'], [
      ['Berlin', 'Deutschland', DATA],
      ['Bern', 'Schweiz', DATA],
      ['Bergdietikon', 'Aargau, Schweiz', DATA],
      ['Berikon', 'Aargau, Schweiz', DATA],
      ['Berg am Irchel', 'Zürich, Schweiz', DATA],
    ]],
    // Rome, which "Rom" names in German, before Romanshorn, whose name it starts.
    ['Rom', 'de', [47.37, 8.54], ['towns', 'nearby'], [
      ['Roma', 'Italien', DATA],
      ['Romanshorn', 'Schweiz', DATA],
      ['Romont', 'Freiburg, Schweiz', DATA],
      ['Romanel-sur-Lausanne', 'Waadt, Schweiz', NO_DATA],
      ['Römerswil', 'Luzern, Schweiz', NO_DATA],
    ]],
    // On its way to Lausanne, then to Lausen, farther.
    ['Laus', 'fr', [46.52, 6.63], ['towns', 'nearby'], [
      ['Lausanne', 'Vaud, Suisse', NO_DATA],
      ['Lausen', 'Bâle-Campagne, Suisse', DATA],
      ['Route de Lausanne', 'Rolle', DATA],
      ['Route de Lausanne', 'Villette (Lavaux)', NO_DATA],
      ['Route de Lausanne', 'Prangins', DATA],
    ]],
  ])('answers "%s" with the places a rider would choose', async (query, language, near, requests, rows) => {
    const fetchMock = stubRecordedAnswer(query);

    const response = await POST(postRequest(query, language, near));
    const results = await response.json() as { title: string; subtitle: string; covered: boolean }[];

    expect(asked(fetchMock, GEOAPIFY_HOST).map(geoapifyRequest)).toEqual(requests);
    expect(asked(fetchMock, PHOTON_HOST)).toEqual([]);
    expect(response.headers.get('x-geocoding-data-source')).toBe(['Freiburg', 'Ber', 'Rom'].includes(query)
      ? 'Verified scooter city catalog, Geoapify, OpenStreetMap'
      : 'Geoapify, OpenStreetMap');
    expect(results.map(result => [result.title, result.subtitle, result.covered])).toEqual(rows);
  });
});

it('rate limits malformed bodies before attempting to read them', async () => {
  rateLimitAllows.mockResolvedValue(false);
  const req = new NextRequest('https://example.com/api/geocode', { method: 'POST', body: '{' });
  const response = await POST(req);
  expect(response.status).toBe(429);
  expect(req.bodyUsed).toBe(false);
  expect(rateLimitAllows).toHaveBeenCalledOnce();
});

it('caps streamed bodies without a Content-Length, counting UTF-8 bytes', async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(encoder.encode('{"q":"Zurich","extra":"'));
    controller.enqueue(encoder.encode('é'.repeat(2100)));
    controller.enqueue(encoder.encode('"}'));
    controller.close();
  } });
  const req = new NextRequest('https://example.com/api/geocode', { method: 'POST', body: stream });
  expect((await POST(req)).status).toBe(413);
  expect(rateLimitAllows).toHaveBeenCalledOnce();
});
