import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { RECORDED_GEOAPIFY_ANSWERS, RECORDED_WORLD_PHOTON_ANSWERS, type RecordedSearch } from '@/app/api/geocode/recordedAnswers';
import { searchText } from '@/lib/searchText';

// Australia as a country catalog may list it, with its states. The generated modules are what
// scripts/generate-provider-catalog.mjs would write for it, beside the real countries of Europe, North
// America, West Asia and Oceania: the United Arab Emirates, Saudi Arabia, Israel (Tel Aviv with the
// other names its catalog gives it, in English and in its own scripts) and New Zealand are the
// catalog's own.
const fixture = vi.hoisted(() => {
  const box = (lat: number, lng: number) => ({ center: [lat, lng] as [number, number],
    bounds: { south: lat - 0.1, west: lng - 0.1, north: lat + 0.1, east: lng + 0.1 } });
  type Country = 'AU';
  const system = (id: string, country: Country, city: string, region: string, at: [number, number]) => ({
    id, provider: 'lime', country, city, region, ...box(...at),
    discoveryUrl: `https://data.lime.bike/api/partners/v2/gbfs/${id}/gbfs.json`,
  });
  return {
    countries: ['AU'],
    systems: [
      system('sydney', 'AU', 'Sydney', 'NSW', [-33.8688, 151.2093]),
      system('melbourne', 'AU', 'Melbourne', 'VIC', [-37.8136, 144.9631]),
    ],
    regions: { showInCityNames: false, totals: true, list: [
      { code: 'NSW', name: 'New South Wales' }, { code: 'QLD', name: 'Queensland' }, { code: 'VIC', name: 'Victoria' },
    ] },
    searchWords: {
      AU: ['australia', 'australien', 'australie'],
    },
    names: (en: string) => ({ en, de: en, fr: en, it: en, nl: en, nb: en, pt: en, es: en, is: en }),
  };
});

vi.mock('@/generated/countryCatalogs', async importOriginal => {
  const original = await importOriginal<typeof import('@/generated/countryCatalogs')>();
  return { CATALOG_SYSTEMS: [...original.CATALOG_SYSTEMS, ...fixture.systems] };
});
vi.mock('@/generated/countries', async importOriginal => {
  const original = await importOriginal<typeof import('@/generated/countries')>();
  return {
    ...original,
    COUNTRY_CODES: [...original.COUNTRY_CODES, ...fixture.countries],
    COUNTRY_SOURCES: { ...original.COUNTRY_SOURCES, AU: 'australia' },
    COUNTRY_CONTINENTS: { ...original.COUNTRY_CONTINENTS, AU: 'oceania' },
    COUNTRY_NAMES: { ...original.COUNTRY_NAMES, AU: fixture.names('Australia') },
    COUNTRY_SEARCH_WORDS: { ...original.COUNTRY_SEARCH_WORDS, ...fixture.searchWords },
    COUNTRY_ANCHORS: { ...original.COUNTRY_ANCHORS, AU: [-25, 134] },
    COUNTRY_REGIONS: { ...original.COUNTRY_REGIONS, AU: fixture.regions },
  };
});

const rateLimitAllows = vi.hoisted(() => vi.fn());
const getCloudflareContext = vi.hoisted(() => vi.fn());
vi.mock('@/lib/rateLimit', () => ({ rateLimitAllows }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext }));

const { cityOfAddress, namedCities } = await import('@/app/api/geocode/cities');
const { COVERED_CITIES } = await import('@/lib/coveredCities');
const { searchRegionalScooterCities } = await import('@/lib/regionalScooterSystems');
const { POST } = await import('@/app/api/geocode/route');

const titles = (query: string) => namedCities(query).map(({ city }) => city.title);
const countries = (query: string) => namedCities(query).map(({ country }) => country);
const centreOf = (id: string) => COVERED_CITIES.find(city => city.id === id)!.center;

const AUCKLAND: [number, number] = [-36.85, 174.76];
const SYDNEY: [number, number] = [-33.87, 151.21];
const TEL_AVIV: [number, number] = [32.07, 34.78];
const DUBAI: [number, number] = [25.2, 55.27];
const RIYADH: [number, number] = [24.71, 46.68];
const NICOSIA: [number, number] = [35.17, 33.36];
const AUSTIN: [number, number] = [30.27, -97.74];
const TOKYO: [number, number] = [35.68, 139.69];
const TAMARINDO: [number, number] = [10.3, -85.84];
const KRALENDIJK: [number, number] = [12.15, -68.27];
const ZURICH: [number, number] = [47.37, 8.54];
const GEOAPIFY_HOST = 'api.geoapify.com';
const PHOTON_HOST = 'photon.komoot.io';

type Row = [fields: Record<string, unknown>, lat: number, lon: number];

/** Which of a search's requests Geoapify is asked: for towns, for places close by, or for places anywhere. */
function geoapifyRequest(url: URL): keyof RecordedSearch {
  return url.searchParams.get('type') === 'city' ? 'towns' : url.searchParams.has('filter') ? 'nearby' : 'anywhere';
}

/** Answers Geoapify, every request alike or each as recorded, and Photon with these places, and keeps what each was asked. */
function stubUpstreams(rows: { geoapify?: Row[] | RecordedSearch; photon?: Row[] }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const geoapify = Array.isArray(rows.geoapify) ? rows.geoapify : rows.geoapify?.[geoapifyRequest(url)];
    const body = url.hostname === GEOAPIFY_HOST
      ? { results: (geoapify ?? []).map(([fields, lat, lon]) => ({ ...fields, lat, lon })) }
      : { features: (rows.photon ?? []).map(([properties, lat, lon]) => ({ properties, geometry: { coordinates: [lon, lat] } })) };
    return new Response(JSON.stringify(body), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return (host: string) => fetchMock.mock.calls.map(([input]) => new URL(String(input))).filter(url => url.hostname === host);
}

function search(q: string, extra: Record<string, unknown> = {}) {
  return POST(new NextRequest('https://example.com/api/geocode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, lang: 'en', ...extra }),
  }));
}

async function rows(response: Response) {
  return (await response.json() as { title: string; subtitle: string }[]).map(({ title, subtitle }) => [title, subtitle]);
}

function inWorker(env: Record<string, unknown>) {
  getCloudflareContext.mockResolvedValue({ env });
}

beforeEach(() => {
  rateLimitAllows.mockResolvedValue(true);
  getCloudflareContext.mockRejectedValue(new Error('outside the Worker'));
});

afterEach(() => vi.unstubAllGlobals());

describe('the fixture', () => {
  it('writes its countries\' words as the search reads them, as data/countries.json must', () => {
    for (const words of Object.values(fixture.searchWords)) for (const word of words) expect(searchText(word)).toBe(word);
  });
});

describe('the search in Oceania and West Asia', () => {
  it('searches South America and Central Asia when viewing the new Whoosh countries', async () => {
    const asked = stubUpstreams({});
    await search('Main Street', { near: [-33.44, -70.65] });
    await search('Main Street', { near: [43.25, 76.93] });
    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('bbox')))
      .toEqual(['-82,-56,-34,13', '40,34,89,56']);
    expect(countries('São Paulo Brazil')).toContain('BR');
    expect(countries('Almaty Kazakhstan')).toContain('KZ');
  });

  it('asks Photon within the part of the world the map shows', async () => {
    const asked = stubUpstreams({});

    for (const near of [TEL_AVIV, DUBAI, RIYADH, AUCKLAND, SYDNEY, NICOSIA, AUSTIN, TOKYO]) await search('Main Street', { near });

    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('bbox'))).toEqual([
      '34,12,60,34', '34,12,60,34', '34,12,60,34',
      '110,-48,180,-9', '110,-48,180,-9',
      // Cyprus is in Europe's, north of West Asia's.
      '-32,27.5,45,72',
      '-170,14,-50,72',
      // Japan brings East Asia into the catalog.
      '95,-11,150,46',
    ]);
  });

  it('leaves out Egypt, Libya and the Sahara from Europe\'s part of the world, but not the Canaries, Cyprus or Israel\'s neighbours', async () => {
    stubUpstreams({ photon: [
      [{ type: 'city', name: 'Cairo', country: 'Egypt', countrycode: 'EG' }, 30.0444, 31.2357],
      [{ type: 'city', name: 'Alexandria', country: 'Egypt', countrycode: 'EG' }, 31.1992, 29.8952],
      [{ type: 'city', name: 'Tripoli', country: 'Libya', countrycode: 'LY' }, 32.8967, 13.1778],
      [{ type: 'city', name: 'Marrakesh', country: 'Morocco', countrycode: 'MA' }, 31.6295, -7.9811],
      [{ type: 'city', name: 'Laayoune', country: 'Western Sahara', countrycode: 'EH' }, 27.1536, -13.2033],
      [{ type: 'city', name: 'Puerto del Carmen', state: 'Canary Islands', country: 'Spain', countrycode: 'ES' }, 28.9236, -13.663],
      [{ type: 'city', name: 'Larnaca', country: 'Cyprus', countrycode: 'CY' }, 34.9229, 33.6233],
      [{ type: 'city', name: 'Tripoli', state: 'North Governorate', country: 'Lebanon', countrycode: 'LB' }, 34.4374, 35.8349],
      [{ type: 'city', name: 'Sharm El Sheikh', state: 'South Sinai', country: 'Egypt', countrycode: 'EG' }, 27.9158, 34.33],
      [{ type: 'city', name: 'Amman', country: 'Jordan', countrycode: 'JO' }, 31.9539, 35.9106],
    ] });

    const found = await rows(await search('anything', { near: NICOSIA }));

    expect(found.map(([title, subtitle]) => `${title}, ${subtitle}`).sort()).toEqual([
      'Amman, Jordan', 'Larnaca, Cyprus', 'Puerto del Carmen, Canary Islands, Spain', 'Sharm El Sheikh, South Sinai, Egypt', 'Tripoli, North Governorate, Lebanon',
    ]);
  });

  it('finds the Dubai Mall in Dubai for a rider at home in the Emirates, and leaves out what is outside the parts of the world the app covers', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Dubai Mall'] });

    // The Dubai Mall is named "Dubai Mall": first.
    expect(await rows(await search('Dubai Mall', { country: 'AE' }))).toEqual([
      ['The Dubai Mall', 'Financial Center Street, Dubai'],
      ['Dubai Mall Expansion', 'Dubai'],
      ['Dubai Mall Chinatown Bridge', 'Sheikh Mohammed bin Rashid Boulevard, Dubai'],
      ['Dubai Mall Metro Bus Stop Landside 1', 'Metro access : Burj Khalifa / Dubai Mall station, Dubai'],
      ['Dubai Mall Zaabeel Parking Garage', 'Financial Center Road (Upper Level), Dubai'],
    ]);
    // Photon's first two, named just so, come after those with scooter data, or not at all: Kuwait's is in West Asia, Kerala's is not.
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Dubai Mall'].slice(0, 2) });
    expect(await rows(await search('Dubai Mall', { country: 'AE' }))).toEqual([['Dubai Mall', 'Street 14, 63008 Mangaf - Block 4']]);
  });

  it('finds the Dubai Mall first near Dubai, where Geoapify lists its shops and stops before it', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS['Dubai Mall'] });

    // Once: its bus stop of the same name, 300 m from it, is inside its outline. Without the Makani numbers OpenStreetMap gives as postcodes.
    expect((await rows(await search('Dubai Mall', { near: DUBAI }))).slice(0, 3)).toEqual([
      ['The Dubai Mall', 'Financial Center Street, Dubai'],
      ['Dubai Mall Metro Bus Stop Landside 1', 'Metro access : Burj Khalifa / Dubai Mall station, Dubai'],
      ['Burj Khalifa / Dubai Mall', 'Metro access : Burj Khalifa / Dubai Mall station, Dubai'],
    ]);
  });

  it('puts the places named Rothschild near Tel Aviv before Rothschild, Wisconsin, unless Wisconsin is typed', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS.Rothschild });
    const nearTelAviv = await rows(await search('Rothschild', { near: TEL_AVIV }));
    stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS['Rothschild Wisconsin'] });
    const wisconsin = await rows(await search('Rothschild Wisconsin', { near: TEL_AVIV }));

    // The two named so first, then those whose names hold it: Rothschild, Wisconsin, comes after them all.
    expect(nearTelAviv).toEqual([
      ['Rothschild', '22 Sderot Rothschild, 6688218 Tel-Aviv'],
      ['Rothschild', '45 Amishav, 6767589 Givatayim'],
      ['The Rothschild Hotel', '96 Sderot Rothschild, 6527401 Tel-Aviv'],
      ['the rothschild 71', '71 Sderot Rothschild, 6511604 Tel-Aviv'],
      ['65 Rothschild Av./ Nachmami St.', 'Sderot Rothschild, 6511604 Tel-Aviv'],
    ]);
    expect(wisconsin[0]).toEqual(['Rothschild', 'Wisconsin, United States']);
  });

  it('finds the places named Rothschild in Israel after Rothschild, Wisconsin, for a rider there without a map centre', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    const asked = stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS['Rothschild in Israel'] });

    const found = await rows(await search('Rothschild', { country: 'IL' }));

    // Asked anywhere, Geoapify finds the town alone; asked in Israel, the boulevard's places and
    // those of its name in the towns around.
    expect(asked(GEOAPIFY_HOST).map(url => [url.searchParams.get('type'), url.searchParams.get('filter')]))
      .toEqual([['city', null], [null, 'countrycode:il'], [null, null]]);
    expect(found).toEqual([
      ['Rothschild', 'Wisconsin, United States'],
      ['Rothschild', '6806546 Bat Yam'],
      ['Rothschild', '22 Sderot Rothschild, 6688218 Tel-Aviv'],
      ['Rothschild', '45 Amishav, 6767589 Givatayim'],
      ['Rothschild 48', '48 Sderot Rothschild, 6578103 Tel-Aviv'],
    ]);
  });

  it('finds Austin, Texas, first for "Austin TX" over Portland, though no service calls Texas TX', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS['Austin TX'] });

    const found = await rows(await search('Austin TX', { near: [45.52, -122.68] }));

    // Then what is named Austin in Texas, with its town and state: a quarter of Mesquite, by Dallas, with
    // scooter data, then a street of Austin and a place on another.
    expect(found).toEqual([
      ['Austin', 'Texas, United States'],
      ['Austin', 'Mesquite, TX'],
      ['Austin', 'Austin, TX'],
      ['Austin', 'West 3rd Street, Austin, TX 78701'],
      ['Northwest Austin', 'Austin, TX'],
    ]);
  });

  it('finds Queen Street in Auckland near Auckland', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Queen Street'] });

    expect(await rows(await search('Queen Street', { near: AUCKLAND }))).toEqual([
      ['Queen Street', 'Waitematā'],
      ['Queen Street', 'Kaipātiki'],
    ]);
  });

  it('finds New York\'s Times Square after those of Germany for a rider there without a map centre', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS['Times Square in Germany'] });

    const found = await rows(await search('Times Square', { lang: 'de', country: 'DE' }));

    // Asked in Germany, Geoapify finds a street of Dresden and a café of Kaufbeuren, the
    // café twice; asked anywhere, New York's square first, its piece of street and its
    // postcode, then Dresden's again, and London's.
    expect(found).toEqual([
      ['Times Square', 'Dresden'],
      ['Times Square Musikcafe', 'Sudetenstraße 121, 87600 Kaufbeuren'],
      ['Times Square', 'Groß-London'],
      ['Times Square', 'Throwley Way, SM1 4AE Groß-London'],
      ['Times Square', 'New York, NY'],
    ]);
  });

  it('finds Rothschild Boulevard in Tel Aviv first near Tel Aviv, and the streets of its name in Israel for a rider at home there', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS.Rothschild });

    const nearTelAviv = await rows(await search('Rothschild', { near: TEL_AVIV }));
    const atHome = await rows(await search('Rothschild', { country: 'IL' }));

    expect(nearTelAviv).toEqual([
      ['Rothschild', 'Sderot Rothschild, 6688218 Tel Aviv'],
      ['Rothschild', '6806546 Bat Yam'],
      ['Rothschild', 'Bat Yam'],
      ['Rothschild', 'Holon'],
      // Photon's קרית אונו, by the catalog's name for it.
      ['Rothschild', 'Kiryat Ono'],
    ]);
    // In Photon's order: all in Israel, so all at home.
    expect(atHome.map(([, subtitle]) => subtitle)).toEqual(['6806546 Bat Yam', 'Bat Yam', 'Holon', 'Kiryat Ono', 'Sderot Rothschild, 6688218 Tel Aviv']);
  });

  it('finds King Fahd Road in Riyadh near Riyadh', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['King Fahd Road'] });

    // Its eleven pieces, one street.
    expect(await rows(await search('King Fahd Road', { near: RIYADH }))).toEqual([['King Fahd Road', 'Riyadh']]);
  });

  it('takes a town found by another of its names for a town in Israel, for a rider at home there', async () => {
    // Akko is Acre: Israel is in Asia, as its country is, though inside Europe's box too.
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'Akko Port', street: 'HaHagana', city: 'Acre', country: 'Israel', countrycode: 'IL' }, 32.9203, 35.0682],
      [{ type: 'city', name: 'Acre', state: 'North District', country: 'Israel', countrycode: 'IL' }, 32.9281, 35.0756],
    ] });

    expect((await rows(await search('Akko', { country: 'IL' })))[0]).toEqual(['Acre', 'North District, Israel']);
  });
});

describe('the search in Central America and the Caribbean', () => {
  // Bonaire's places, and Curaçao's, as Photon gives them: in the Netherlands.
  const KAYA_GRANDI: Row[] = [
    [{ type: 'street', name: 'Kaya Grandi', city: 'Kralendijk', district: 'Kralendijk', state: 'Nederland', country: 'Nederland', countrycode: 'NL' }, 12.1525, -68.2772],
    [{ type: 'house', name: 'Bonaire Handmakers', street: 'Kaya Grandi', city: 'Kralendijk', state: 'Nederland', country: 'Nederland', countrycode: 'NL' }, 12.1509, -68.2768],
    [{ type: 'house', housenumber: '22', street: 'Kaya Gusanio', locality: 'Katoentuin', district: 'Seru Grandi', state: 'Curaçao', country: 'Nederland', countrycode: 'NL' }, 12.0998, -68.847],
  ];
  const CARTAGENA: Row[] = [
    [{ type: 'city', name: 'Cartagena', county: 'Campo de Cartagena y Mar Menor', state: 'Región de Murcia', country: 'España', countrycode: 'ES' }, 37.6155, -0.9875],
    [{ type: 'city', name: 'Cartagena de Indias', county: 'Dique', state: 'Bolívar', country: 'Colombia', countrycode: 'CO' }, 10.4266, -75.5442],
    [{ type: 'city', name: 'Cartagena', county: 'Provincia de San Antonio', state: 'Región de Valparaíso', country: 'Chile', countrycode: 'CL' }, -33.5468, -71.6032],
    [{ type: 'street', name: 'Cartagena', postcode: '78253', county: 'Bexar', state: 'Texas', country: 'United States', countrycode: 'US' }, 29.4828, -98.7215],
  ];

  it('asks Photon within Central America near Tamarindo, and around Bonaire and Curaçao near Kralendijk', async () => {
    const asked = stubUpstreams({});

    for (const near of [TAMARINDO, KRALENDIJK, AUSTIN]) await search('Calle Central', { near });

    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('bbox'))).toEqual(['-92.5,7,-77.2,14', '-69.25,11.95,-68.1,12.45', '-170,14,-50,72']);
  });

  it('includes covered Medellín while searching Central America and the Caribbean', async () => {
    stubUpstreams({ photon: [
      [{ type: 'city', name: 'San José', state: 'San José', country: 'Costa Rica', countrycode: 'CR' }, 9.9326, -84.0796],
      [{ type: 'city', name: 'Panamá', state: 'Panamá', country: 'Panamá', countrycode: 'PA' }, 8.9714, -79.5342],
      [{ type: 'city', name: 'Turbo', state: 'Antioquia', country: 'Colombia', countrycode: 'CO' }, 8.0926, -76.7282],
      [{ type: 'city', name: 'Cartagena de Indias', state: 'Bolívar', country: 'Colombia', countrycode: 'CO' }, 10.4266, -75.5442],
      [{ type: 'city', name: 'Medellín', state: 'Antioquia', country: 'Colombia', countrycode: 'CO' }, 6.2443, -75.5736],
      [{ type: 'city', name: 'Punto Fijo', state: 'Falcón', country: 'Venezuela', countrycode: 'VE' }, 11.6956, -70.1997],
      [{ type: 'city', name: 'Coro', state: 'Falcón', country: 'Venezuela', countrycode: 'VE' }, 11.4045, -69.6734],
      [{ type: 'city', name: 'Oranjestad', country: 'Aruba', countrycode: 'AW' }, 12.5186, -70.0358],
      [{ type: 'city', name: 'Willemstad', state: 'Curaçao', country: 'Nederland', countrycode: 'NL' }, 12.1084, -68.9335],
      [{ type: 'city', name: 'Rincon', state: 'Nederland', country: 'Nederland', countrycode: 'NL' }, 12.2443, -68.3289],
    ] });

    const found = await rows(await search('anything', { near: TAMARINDO }));

    expect(found.map(([title]) => title).sort()).toEqual(['Medellín', 'Panamá', 'Rincon', 'San José', 'Willemstad']);
  });

  it('can find the Cartagenas of South America alongside Spain and Texas', async () => {
    stubUpstreams({ photon: CARTAGENA });

    const nearAustin = await rows(await search('Cartagena', { near: AUSTIN }));
    const atHome = await rows(await search('Cartagena', { country: 'US' }));
    const inCostaRica = await rows(await search('Cartagena', { country: 'CR' }));

    // Towns precede the street of Texas; the new continent also admits Chile and Colombia.
    const expected = [['Cartagena', 'Región de Murcia, España'], ['Cartagena', 'Región de Valparaíso, Chile'],
      ['Cartagena de Indias', 'Bolívar, Colombia'], ['Cartagena', 'Bexar, TX']];
    expect(nearAustin).toEqual(expected);
    expect(atHome).toEqual(expected);
    expect(inCostaRica).toEqual(nearAustin);
  });

  it('finds Tamarindo, typed in full, without asking for places, from near it, from home in Costa Rica or from the US', async () => {
    const asked = stubUpstreams({});

    for (const from of [{ near: TAMARINDO }, { country: 'CR' }, { country: 'US' }, { near: AUSTIN }]) {
      expect(await rows(await search('Tamarindo', from)), JSON.stringify(from)).toEqual([['Tamarindo', 'Costa Rica']]);
    }
    expect(asked(PHOTON_HOST)).toEqual([]);
  });

  it('finds the places of a street of Tamarindo typed with the town, from anywhere, and writes their postcode after the town', async () => {
    const asked = stubUpstreams({ photon: [
      [{ type: 'house', name: 'Farmacia Tamarindo', street: 'Calle Central', postcode: '50309', locality: 'Tamarindo', county: 'Santa Cruz', state: 'Guanacaste', country: 'Costa Rica', countrycode: 'CR' }, 10.3043, -85.8381],
      [{ type: 'house', name: 'Best Western Tamarindo', street: 'Calle Central', postcode: '50309', city: 'Tamarindo', locality: 'Tamarindo', county: 'Santa Cruz', state: 'Guanacaste', country: 'Costa Rica', countrycode: 'CR' }, 10.3044, -85.8371],
    ] });

    const found = await rows(await search('Calle Central, Tamarindo', { country: 'US' }));

    expect(asked(PHOTON_HOST)[0].searchParams.get('bbox')).toBe('-92.5,7,-77.2,14');
    expect(found).toEqual([
      ['Farmacia Tamarindo', 'Calle Central, Tamarindo 50309'],
      ['Best Western Tamarindo', 'Calle Central, Tamarindo 50309'],
    ]);
  });

  it('finds Kaya Grandi in Kralendijk near it, before a street of Curaçao for a rider at home on Bonaire, and typed with the town from anywhere', async () => {
    const asked = stubUpstreams({ photon: KAYA_GRANDI });

    const nearKralendijk = await rows(await search('Kaya Grandi', { near: KRALENDIJK }));
    const atHome = await rows(await search('Kaya Grandi', { country: 'BQ' }));
    const withTown = await rows(await search('Kaya Grandi, Kralendijk', { country: 'US' }));
    const withIsland = await rows(await search('Kaya Grandi, Bonaire', { country: 'US' }));

    expect(nearKralendijk).toEqual([
      ['Kaya Grandi', 'Kralendijk'],
      ['Bonaire Handmakers', 'Kaya Grandi, Kralendijk'],
      ['Kaya Gusanio 22', 'Katoentuin'],
    ]);
    expect(atHome).toEqual(nearKralendijk);
    expect(withTown).toEqual(nearKralendijk);
    // "Bonaire" names the island's country, not Curaçao's.
    expect(withIsland.slice(0, 2)).toEqual(nearKralendijk.slice(0, 2));
    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('bbox'))).toEqual(['-69.25,11.95,-68.1,12.45', null, '-69.25,11.95,-68.1,12.45', null]);
  });
});

describe('the search in Hebrew, Arabic and Greek', () => {
  it('ranks a Hebrew name with the word typed before one without it, near the map centre', async () => {
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'בית רוטמן', street: 'אחד העם', city: 'Tel Aviv', countrycode: 'IL' }, 32.0645, 34.7745],
      [{ type: 'street', name: 'שדרות רוטשילד', city: 'Tel Aviv', countrycode: 'IL' }, 32.0637, 34.7734],
      [{ type: 'street', name: 'רוטשילד', city: 'Bat Yam', countrycode: 'IL' }, 32.0273, 34.7488],
    ] });

    expect(await rows(await search('רוטשילד', { near: TEL_AVIV }))).toEqual([
      ['שדרות רוטשילד', 'Tel Aviv'],
      ['בית רוטמן', 'אחד העם, Tel Aviv'],
      ['רוטשילד', 'Bat Yam'],
    ]);
  });

  it('keeps two places of different Hebrew names 100 m apart as two rows, and one of the same name as one', async () => {
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'נחלת בנימין 105', city: 'Tel Aviv', countrycode: 'IL' }, 32.0612, 34.7725],
      [{ type: 'house', name: 'רוטשילד 22', city: 'Tel Aviv', countrycode: 'IL' }, 32.0621, 34.7725],
      [{ type: 'house', name: 'רוטשילד 22', street: 'שדרות רוטשילד', city: 'Tel Aviv', countrycode: 'IL' }, 32.0622, 34.7726],
    ] });

    expect((await rows(await search('22', { near: TEL_AVIV }))).map(([title]) => title)).toEqual(['רוטשילד 22', 'נחלת בנימין 105']);
  });

  it('finds the Dubai Mall typed in Arabic near Dubai', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['دبي مول'] });

    const found = await rows(await search('دبي مول', { near: DUBAI }));

    // The names with both words first, then the others near the map, in Photon's order.
    expect(found.slice(0, 3)).toEqual([
      ['دبي مول / برج خليفة', 'Metro access : Burj Khalifa / Dubai Mall station, Dubai'],
      ['مول دبي حمامات +تواليت', 'Financial Center Street, Dubai'],
      ['The Dubai Mall', 'Financial Center Street, Dubai'],
    ]);
  });

  it('finds the Dubai Mall typed in Arabic over Zürich, from Photon asked anywhere when Geoapify finds nothing', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    const asked = stubUpstreams({ geoapify: RECORDED_GEOAPIFY_ANSWERS['دبي مول over Zürich'], photon: RECORDED_WORLD_PHOTON_ANSWERS['دبي مول over Zürich'] });

    const response = await search('دبي مول', { near: ZURICH });

    expect(asked(GEOAPIFY_HOST).map(geoapifyRequest)).toEqual(['towns', 'nearby', 'anywhere']);
    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('bbox'))).toEqual([null]);
    expect(response.headers.get('x-geocoding-data-source')).toBe('Geoapify, Photon, OpenStreetMap');
    // As near the map: those named with both words first, then the others in Photon's order.
    expect((await rows(response)).slice(0, 3)).toEqual([
      ['دبي مول / برج خليفة', 'Metro access : Burj Khalifa / Dubai Mall station, Dubai'],
      ['مول دبي حمامات +تواليت', 'Financial Center Street, Dubai'],
      ['The Dubai Mall', 'Financial Center Street, Dubai'],
    ]);
  });

  it('shows Tel Aviv at once for "תל אב", without asking Photon after Geoapify', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    const asked = stubUpstreams({ geoapify: [] });

    const found = await rows(await search('תל אב', { near: ZURICH }));

    expect(asked(PHOTON_HOST)).toEqual([]);
    expect(found).toEqual([['Tel Aviv', 'Israel']]);
  });

  it('asks for a number typed in Arabic-Indic digits in 0-9, and finds the address it ends', async () => {
    const asked = stubUpstreams({});

    await search('طريق الملك فهد ٢٢', { near: RIYADH });
    await search('طريق الملك فهد ٢٢، الرياض ١٢٢٧١', { near: DUBAI });

    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('q'))).toEqual(['طريق الملك فهد 22', 'طريق الملك فهد 22، الرياض 12271']);
    // The second in Riyadh, wherever the map is.
    expect(asked(PHOTON_HOST)[1].searchParams.get('lat')).toBe(String(centreOf('sa:Riyadh')[0]));
  });

  it('finds Thessaloniki typed in Greek, by its English name', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    stubUpstreams({ geoapify: [
      [{ result_type: 'street', street: 'Θεσσαλονίκης', city: 'Kalamaria', country: 'Greece', country_code: 'gr' }, 40.5823, 22.9504],
      [{ result_type: 'city', name: 'Thessaloniki', city: 'Thessaloniki', state: 'Macedonia and Thrace', country: 'Greece', country_code: 'gr' }, 40.6403, 22.9353],
    ] });

    expect((await rows(await search('Θεσσαλονίκη', { country: 'GR' })))[0]).toEqual(['Thessaloniki', 'Greece']);
  });

  it('reads the Greek names Photon finds as the words they are', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Θεσσαλονίκη'] });

    // The inflected street name is not the covered city name. Each road is a row of its own.
    expect((await rows(await search('Θεσσαλονίκης', { country: 'GR' }))).map(([title]) => title)).toEqual([
      'Θεσσαλονίκης - Καβάλας', 'Thessaloniki', 'Thessaloniki', 'Θεσσαλονίκη - Προμαχώνας', 'Θεσσαλονίκη - Προμαχώνας',
    ]);
  });
});

describe('cities named in their own script, or with their country', () => {
  it('finds a city by its name in Hebrew or Arabic, with or without its vowel marks', () => {
    for (const [query, title] of [['תל אביב', 'Tel Aviv'], ['תֵּל אָבִיב', 'Tel Aviv'], ['תל אביב-יפו', 'Tel Aviv'], ['תל־אביב', 'Tel Aviv'],
      ['دبي', 'Dubai'], ['أبو ظبي', 'Abu Dhabi'], ['ابو ظبي', 'Abu Dhabi'], ['الرياض', 'Riyadh'], ['جدة', 'Jeddah'], ['جده', 'Jeddah']]) {
      expect(titles(query), query).toEqual([title]);
    }
  });

  it('reads a country named in several words after a city', () => {
    for (const [query, title] of [['Auckland New Zealand', 'Auckland'], ['Auckland, NZ', 'Auckland'],
      ['Dubai United Arab Emirates', 'Dubai'], ['Dubai, UAE', 'Dubai'], ['Jeddah Saudi Arabia', 'Jeddah'], ['Riyadh KSA', 'Riyadh'],
      ['Tel Aviv Israel', 'Tel Aviv'], ['Tel Aviv-Yafo, Israel', 'Tel Aviv'],
      ['תל אביב ישראל', 'Tel Aviv'], ['دبي الإمارات', 'Dubai'], ['جدة السعودية', 'Jeddah']]) {
      expect(titles(query), query).toEqual([title]);
    }
    expect(titles('Dubai Saudi Arabia')).toEqual([]);
    expect(titles('Auckland Australia')).toEqual([]);
  });

  it('tells the Christchurches of New Zealand and England apart by their country', () => {
    expect(countries('Christchurch').sort()).toEqual(['GB', 'NZ']);
    expect(countries('Christchurch New Zealand')).toEqual(['NZ']);
    expect(countries('Christchurch, United Kingdom')).toEqual(['GB']);
    expect(countries('Christchurch England')).toEqual(['GB']);
    expect(searchRegionalScooterCities('Christchurch New Zealand').map(({ display_name }) => display_name)).toEqual(['Christchurch, New Zealand']);
    expect(searchRegionalScooterCities('Christchurch Great Britain').map(({ display_name }) => display_name)).toEqual(['Christchurch, United Kingdom']);
  });

  it('lists first the Christchurch nearer the map, or in the rider\'s country', async () => {
    stubUpstreams({});
    const BOURNEMOUTH: [number, number] = [50.72, -1.88];
    expect(await rows(await search('Christchurch', { near: AUCKLAND }))).toEqual([
      ['Christchurch', 'New Zealand'], ['Christchurch', 'United Kingdom'],
    ]);
    expect(await rows(await search('Christchurch', { near: BOURNEMOUTH }))).toEqual([
      ['Christchurch', 'United Kingdom'], ['Christchurch', 'New Zealand'],
    ]);
    expect((await rows(await search('Christchurch', { country: 'NZ' })))[0]).toEqual(['Christchurch', 'New Zealand']);
  });

  it('reads New South Wales as an Australian state, not as Wales', () => {
    expect(titles('Sydney, New South Wales')).toEqual(['Sydney']);
    expect(titles('Sydney NSW')).toEqual(['Sydney']);
    expect(titles('Melbourne Victoria')).toEqual(['Melbourne']);
    expect(titles('Sydney Victoria')).toEqual([]);
    expect(titles('Bath New South Wales')).toEqual([]);
    expect(titles('Bath Wales')).toEqual(['Bath']);
  });
});

describe('addresses written as they are in Oceania and West Asia', () => {
  it.each<[query: string, address: string, city: string]>([
    ['10 Queen Street, Auckland 1010', '10 Queen Street', 'nz:auk:Auckland'],
    ['10 Queen Street Auckland', '10 Queen Street', 'nz:auk:Auckland'],
    ['George St, Sydney NSW 2000', 'George St', 'au:nsw:Sydney'],
    ['1 George St, Sydney, New South Wales 2000', '1 George St', 'au:nsw:Sydney'],
    ['Rothschild 22, Tel Aviv 6688218', 'Rothschild 22', 'il:Tel Aviv'],
    ['Rothschild 22, Tel Aviv-Yafo', 'Rothschild 22', 'il:Tel Aviv'],
    ['שדרות רוטשילד 22, תל אביב', 'שדרות רוטשילד 22', 'il:Tel Aviv'],
    ['King Fahd Road, Riyadh 12271', 'King Fahd Road', 'sa:Riyadh'],
    ['Sheikh Zayed Road, Dubai, UAE', 'Sheikh Zayed Road', 'ae:Dubai'],
    ['شارع الشيخ زايد، دبي', 'شارع الشيخ زايد', 'ae:Dubai'],
  ])('finds "%s" as "%s" in %s', (query, address, id) => {
    expect(cityOfAddress(query)).toEqual({ address, center: centreOf(id) });
  });

  it('writes an address found as the country writes it', async () => {
    stubUpstreams({ photon: [
      [{ type: 'house', housenumber: '10', street: 'Queen Street', postcode: '1010', city: 'Auckland', state: 'Auckland', countrycode: 'NZ' }, -36.8485, 174.7633],
      [{ type: 'house', housenumber: '1', street: 'George Street', postcode: '2000', city: 'Sydney', state: 'New South Wales', countrycode: 'AU' }, -33.8698, 151.2069],
      [{ type: 'house', housenumber: '2', street: 'King Fahd Road', postcode: '12271', city: 'Riyadh', countrycode: 'SA' }, 24.7091, 46.6734],
      [{ type: 'house', housenumber: '1', street: 'Sheikh Mohammed bin Rashid Boulevard', city: 'Dubai', countrycode: 'AE' }, 25.1972, 55.2744],
    ] });
    expect(await rows(await search('anything'))).toEqual([
      ['10 Queen Street', 'Auckland 1010'],
      ['1 George Street', 'Sydney NSW 2000'],
      ['2 King Fahd Road', 'Riyadh 12271'],
      ['1 Sheikh Mohammed bin Rashid Boulevard', 'Dubai'],
    ]);

    // As Photon names them in English, and in Hebrew where it has no English name: its town by the catalog's name.
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'Rothschild 22', housenumber: '22', street: 'Sderot Rothschild', postcode: '6688218', city: 'Tel Aviv', countrycode: 'IL' }, 32.0628, 34.7717],
      [{ type: 'house', housenumber: '22', street: 'Sderot Rothschild', postcode: '6688218', city: 'Tel Aviv', countrycode: 'IL' }, 32.0629, 34.7716],
      [{ type: 'house', housenumber: '8', street: 'שדרות רוטשילד', postcode: '6688101', city: 'תל אביב-יפו', countrycode: 'IL' }, 32.0626, 34.7697],
    ] });
    expect(await rows(await search('anything', { near: TEL_AVIV }))).toEqual([
      ['Rothschild 22', '22 Sderot Rothschild, 6688218 Tel Aviv'],
      ['22 Sderot Rothschild', '6688218 Tel Aviv'],
      ['שדרות רוטשילד 8', '6688101 Tel Aviv'],
    ]);
  });

  it('writes a town Photon names in Hebrew or Arabic as the apps\' languages do', async () => {
    stubUpstreams({ photon: [
      // An alias of a town of the catalog, and a quarter inside one's outline.
      [{ type: 'house', name: 'Mall of The Emirates', housenumber: '1', street: 'Al Seedaf 1 Street', city: 'دبي', locality: 'Al Barsha 1', district: 'Al Barsha 1', countrycode: 'AE' }, 25.118, 55.2004],
      [{ type: 'street', name: 'כצנלסון', locality: 'שינקין', county: 'Tel Aviv Subdistrict', countrycode: 'IL' }, ...centreOf('il:Givatayim')],
      // Outside the catalog's towns: its quarter in Latin letters, or as Photon gives it, not its county.
      [{ type: 'street', name: 'Al Wasl Road', city: 'الشارقة', locality: 'Al Majaz', countrycode: 'AE' }, 25.3263, 55.3889],
      [{ type: 'street', name: 'Θεσσαλονίκη - Προμαχώνας', city: 'Καμαρωτό', county: 'Serres Regional Unit', countrycode: 'GR' }, 41.1975, 23.3849],
      // Written in Latin letters already: as given.
      [{ type: 'street', name: 'Ibn Gabirol', city: 'Tel Aviv-Yafo', countrycode: 'IL' }, 32.08, 34.78],
    ] });

    // Those in the catalog's towns first.
    expect(await rows(await search('anything'))).toEqual([
      ['Mall of The Emirates', '1 Al Seedaf 1 Street, Dubai'],
      ['כצנלסון', 'Givatayim'],
      ['Ibn Gabirol', 'Tel Aviv-Yafo'],
      ['Al Wasl Road', 'Al Majaz'],
      ['Θεσσαλονίκη - Προμαχώνας', 'Καμαρωτό'],
    ]);
  });
});
