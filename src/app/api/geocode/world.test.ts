import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { RECORDED_WORLD_PHOTON_ANSWERS } from '@/app/api/geocode/recordedAnswers';
import { searchText } from '@/lib/searchText';

// New Zealand, Australia and Israel as country catalogs may list them: Australia with its states,
// cities with the other names their catalogs give them, in English and in their own script, and the
// countries with their words in both. The generated modules are what scripts/generate-provider-catalog.mjs
// would write for them, beside the real countries of Europe, North America and West Asia: the United
// Arab Emirates and Saudi Arabia are the catalog's own.
const fixture = vi.hoisted(() => {
  const box = (lat: number, lng: number) => ({ center: [lat, lng] as [number, number],
    bounds: { south: lat - 0.1, west: lng - 0.1, north: lat + 0.1, east: lng + 0.1 } });
  type Country = 'NZ' | 'AU' | 'IL';
  const system = (id: string, country: Country, city: string, region: string | undefined, at: [number, number], aliases?: string[]) => ({
    id, provider: 'lime', country, city, ...(region ? { region } : {}), ...box(...at), ...(aliases ? { aliases } : {}),
    discoveryUrl: `https://data.lime.bike/api/partners/v2/gbfs/${id}/gbfs.json`,
  });
  return {
    countries: ['NZ', 'AU', 'IL'],
    systems: [
      system('auckland', 'NZ', 'Auckland', undefined, [-36.8485, 174.7633]),
      system('christchurch', 'NZ', 'Christchurch', undefined, [-43.5321, 172.6362]),
      system('sydney', 'AU', 'Sydney', 'NSW', [-33.8688, 151.2093]),
      system('melbourne', 'AU', 'Melbourne', 'VIC', [-37.8136, 144.9631]),
      system('tel_aviv', 'IL', 'Tel Aviv', undefined, [32.0853, 34.7818],
        ['Tel Aviv-Yafo', 'Tel Aviv-Jaffa', 'Jaffa', 'Yafo', 'TLV', 'תל אביב', 'תל אביב-יפו']),
    ],
    regions: { showInCityNames: false, totals: true, list: [
      { code: 'NSW', name: 'New South Wales' }, { code: 'QLD', name: 'Queensland' }, { code: 'VIC', name: 'Victoria' },
    ] },
    searchWords: {
      NZ: ['new zealand', 'nz', 'neuseeland', 'nouvelle zelande', 'aotearoa'],
      AU: ['australia', 'australien', 'australie'],
      IL: ['israel', 'ישראל'],
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
    COUNTRY_SOURCES: { ...original.COUNTRY_SOURCES, NZ: 'newzealand', AU: 'australia', IL: 'israel' },
    COUNTRY_CONTINENTS: { ...original.COUNTRY_CONTINENTS, NZ: 'oceania', AU: 'oceania', IL: 'asia' },
    COUNTRY_NAMES: { ...original.COUNTRY_NAMES, NZ: fixture.names('New Zealand'), AU: fixture.names('Australia'),
      IL: fixture.names('Israel') },
    COUNTRY_SEARCH_WORDS: { ...original.COUNTRY_SEARCH_WORDS, ...fixture.searchWords },
    COUNTRY_ANCHORS: { ...original.COUNTRY_ANCHORS, NZ: [-41, 174], AU: [-25, 134], IL: [31.5, 34.9] },
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
const GEOAPIFY_HOST = 'api.geoapify.com';
const PHOTON_HOST = 'photon.komoot.io';

type Row = [fields: Record<string, unknown>, lat: number, lon: number];

/** Answers Geoapify and Photon alike with these places, and keeps what each was asked. */
function stubUpstreams(rows: { geoapify?: Row[]; photon?: Row[] }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    const body = url.hostname === GEOAPIFY_HOST
      ? { results: (rows.geoapify ?? []).map(([fields, lat, lon]) => ({ ...fields, lat, lon })) }
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
  it('asks Photon within the part of the world the map shows', async () => {
    const asked = stubUpstreams({});

    for (const near of [TEL_AVIV, DUBAI, RIYADH, AUCKLAND, SYDNEY, NICOSIA, AUSTIN, TOKYO]) await search('Main Street', { near });

    expect(asked(PHOTON_HOST).map(url => url.searchParams.get('bbox'))).toEqual([
      '34,12,60,34', '34,12,60,34', '34,12,60,34',
      '110,-48,180,-9', '110,-48,180,-9',
      // Cyprus is in Europe's, north of West Asia's.
      '-32,27,45,72',
      '-170,14,-50,72',
      // No country of the catalog in East Asia yet: anywhere.
      null,
    ]);
  });

  it('finds the Dubai Mall in Dubai for a rider at home in the Emirates, and leaves out what is outside the parts of the world the app covers', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Dubai Mall'] });

    expect(await rows(await search('Dubai Mall', { country: 'AE' }))).toEqual([
      ['Dubai Mall Expansion', 'Dubai'],
      ['Dubai Mall Chinatown Bridge', 'Sheikh Mohammed bin Rashid Boulevard, Dubai'],
      ['Dubai Mall Metro Bus Stop Landside 1', 'Metro access : Burj Khalifa / Dubai Mall station, Dubai'],
      ['Dubai Mall Zaabeel Parking Garage', 'Financial Center Road (Upper Level), Dubai'],
      ['The Dubai Mall', 'Financial Center Street, Dubai'],
    ]);
    // Photon's first two, named just so, come after those with scooter data, or not at all: Kuwait's is in West Asia, Kerala's is not.
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Dubai Mall'].slice(0, 2) });
    expect(await rows(await search('Dubai Mall', { country: 'AE' }))).toEqual([['Dubai Mall', 'Street 14, 63008 Mangaf - Block 4']]);
  });

  it('finds Queen Street in Auckland near Auckland', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Queen Street'] });

    expect(await rows(await search('Queen Street', { near: AUCKLAND }))).toEqual([
      ['Queen Street', 'Waitematā'],
      ['Queen Street', 'Kaipātiki'],
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
      ['Rothschild', 'קרית אונו'],
    ]);
    // In Photon's order: all in Israel, so all at home.
    expect(atHome.map(([, subtitle]) => subtitle)).toEqual(['6806546 Bat Yam', 'Bat Yam', 'Holon', 'קרית אונו', 'Sderot Rothschild, 6688218 Tel Aviv']);
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

    expect((await rows(await search('Θεσσαλονίκη', { country: 'GR' })))[0]).toEqual(['Thessaloniki', 'Macedonia and Thrace, Greece']);
  });

  it('reads the Greek names Photon finds as the words they are', async () => {
    stubUpstreams({ photon: RECORDED_WORLD_PHOTON_ANSWERS['Θεσσαλονίκη'] });

    // The roads named after the city start with what was typed; its English name does not. Each road is a row of its own.
    expect((await rows(await search('Θεσσαλονίκη', { country: 'GR' }))).map(([title]) => title)).toEqual([
      'Θεσσαλονίκη - Προμαχώνας', 'Θεσσαλονίκη - Προμαχώνας', 'Θεσσαλονίκη - Προμαχώνας', 'Θεσσαλονίκη - Προμαχώνας', 'Θεσσαλονίκης - Καβάλας',
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
    ['10 Queen Street, Auckland 1010', '10 Queen Street', 'nz:Auckland'],
    ['10 Queen Street Auckland', '10 Queen Street', 'nz:Auckland'],
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

    // As Photon names them in English, and in Hebrew where it has no English name.
    stubUpstreams({ photon: [
      [{ type: 'house', name: 'Rothschild 22', housenumber: '22', street: 'Sderot Rothschild', postcode: '6688218', city: 'Tel Aviv', countrycode: 'IL' }, 32.0628, 34.7717],
      [{ type: 'house', housenumber: '22', street: 'Sderot Rothschild', postcode: '6688218', city: 'Tel Aviv', countrycode: 'IL' }, 32.0629, 34.7716],
      [{ type: 'house', housenumber: '8', street: 'שדרות רוטשילד', postcode: '6688101', city: 'תל אביב-יפו', countrycode: 'IL' }, 32.0626, 34.7697],
    ] });
    expect(await rows(await search('anything', { near: TEL_AVIV }))).toEqual([
      ['Rothschild 22', '22 Sderot Rothschild, 6688218 Tel Aviv'],
      ['22 Sderot Rothschild', '6688218 Tel Aviv'],
      ['שדרות רוטשילד 8', '6688101 תל אביב-יפו'],
    ]);
  });
});
