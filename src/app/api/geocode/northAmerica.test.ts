import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// North America as country catalogs may list it: the US and Canada with their states and
// provinces, Mexico without, and cities with the other names their catalogs give them. The
// generated modules are what scripts/generate-provider-catalog.mjs would write for them.
const fixture = vi.hoisted(() => {
  const box = (lat: number, lng: number) => ({ center: [lat, lng] as [number, number],
    bounds: { south: lat - 0.1, west: lng - 0.1, north: lat + 0.1, east: lng + 0.1 } });
  const system = (id: string, country: 'US' | 'CA' | 'MX', city: string, region: string | undefined, at: [number, number], aliases?: string[]) => ({
    id, provider: 'lime', country, city, ...(region ? { region } : {}), ...box(...at), ...(aliases ? { aliases } : {}),
    discoveryUrl: `https://data.lime.bike/api/partners/v2/gbfs/${id}/gbfs.json`,
  });
  return {
    systems: [
      system('austin', 'US', 'Austin', 'TX', [30.2672, -97.7431]),
      system('portland', 'US', 'Portland', 'OR', [45.5152, -122.6784]),
      system('maine', 'US', 'Portland', 'ME', [43.6591, -70.2568]),
      system('new_york', 'US', 'New York', 'NY', [40.7128, -74.006],
        ['NYC', 'New York City', 'Manhattan', 'Brooklyn', 'Queens', 'The Bronx', 'Staten Island']),
      system('washington_dc', 'US', 'Washington', 'DC', [38.9072, -77.0369], ['Washington DC', 'District of Columbia']),
      system('kansas_city', 'US', 'Kansas City', 'MO', [39.0997, -94.5786]),
      system('toronto', 'CA', 'Toronto', 'ON', [43.6532, -79.3832]),
      system('montreal', 'CA', 'Montréal', 'QC', [45.5019, -73.5674]),
      system('mexico_city', 'MX', 'Ciudad de México', undefined, [19.4326, -99.1332], ['CDMX', 'Mexico City']),
    ],
    regions: {
      US: { showInCityNames: true, totals: true, list: [
        { code: 'DC', name: 'District of Columbia' }, { code: 'DE', name: 'Delaware' }, { code: 'KS', name: 'Kansas' },
        { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MO', name: 'Missouri' },
        { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'OR', name: 'Oregon' },
        { code: 'RI', name: 'Rhode Island' }, { code: 'TX', name: 'Texas' }, { code: 'WA', name: 'Washington' },
      ] },
      CA: { showInCityNames: true, totals: true, list: [
        { code: 'ON', name: 'Ontario' }, { code: 'QC', name: 'Quebec', names: { fr: 'Québec' } },
      ] },
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
    COUNTRY_CODES: [...original.COUNTRY_CODES, 'US', 'CA', 'MX'],
    COUNTRY_SOURCES: { ...original.COUNTRY_SOURCES, US: 'unitedstates', CA: 'canada', MX: 'mexico' },
    COUNTRY_CONTINENTS: { ...original.COUNTRY_CONTINENTS, US: 'north-america', CA: 'north-america', MX: 'north-america' },
    COUNTRY_NAMES: { ...original.COUNTRY_NAMES, US: fixture.names('United States'), CA: fixture.names('Canada'), MX: fixture.names('Mexico') },
    COUNTRY_SEARCH_WORDS: { ...original.COUNTRY_SEARCH_WORDS, US: ['usa', 'america'], CA: ['canada'], MX: ['mexico'] },
    COUNTRY_ANCHORS: { ...original.COUNTRY_ANCHORS, US: [39.8, -98.6], CA: [50, -85], MX: [23.6, -102.5] },
    COUNTRY_REGIONS: fixture.regions,
  };
});

const rateLimitAllows = vi.hoisted(() => vi.fn());
const getCloudflareContext = vi.hoisted(() => vi.fn());
vi.mock('@/lib/rateLimit', () => ({ rateLimitAllows }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext }));

const { cityOfAddress, namedCities } = await import('@/app/api/geocode/cities');
const { COVERED_CITIES } = await import('@/lib/coveredCities');
const { POST } = await import('@/app/api/geocode/route');

const titles = (query: string) => namedCities(query).map(({ city }) => city.title);
const centreOf = (id: string) => COVERED_CITIES.find(city => city.id === id)!.center;

const AUSTIN: [number, number] = [30.27, -97.74];
const PARIS: [number, number] = [48.86, 2.35];
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

beforeEach(() => {
  rateLimitAllows.mockResolvedValue(true);
  getCloudflareContext.mockRejectedValue(new Error('outside the Worker'));
});

afterEach(() => vi.unstubAllGlobals());

describe('cities named with their state or country', () => {
  it('reads a state or a country after the city, with or without a comma', () => {
    expect(titles('Austin TX')).toEqual(['Austin, TX']);
    expect(titles('Austin, Texas')).toEqual(['Austin, TX']);
    expect(titles('Portland, OR')).toEqual(['Portland, OR']);
    expect(titles('Portland Maine')).toEqual(['Portland, ME']);
    expect(titles('Portland, OR, USA')).toEqual(['Portland, OR']);
    expect(titles('Portland, OR, Canada')).toEqual([]);
    expect(titles('Toronto ON')).toEqual(['Toronto, ON']);
    expect(titles('Montreal, Québec')).toEqual(['Montréal, QC']);
    expect(titles('Portland Texas')).toEqual([]);
  });

  it('finds both towns of a shared name, and reads initials with full stops', () => {
    expect(titles('Portland')).toEqual(['Portland, ME', 'Portland, OR']);
    expect(titles('Washington, D.C.')).toEqual(['Washington, DC']);
    expect(titles('Washington DC')).toEqual(['Washington, DC']);
  });

  it('finds a city by the other names its catalog gives it', () => {
    for (const [query, title] of [['NYC', 'New York, NY'], ['New York City', 'New York, NY'], ['Brooklyn', 'New York, NY'],
      ['Brooklyn, New York', 'New York, NY'], ['New York, NY', 'New York, NY'], ['Manhattan NY', 'New York, NY'],
      ['CDMX', 'Ciudad de México'], ['Mexico City', 'Ciudad de México'], ['Ciudad de Mexico', 'Ciudad de México'],
      ['Montreal', 'Montréal, QC'], ['District of Columbia', 'Washington, DC']]) {
      expect(titles(query)[0], query).toBe(title);
    }
  });

  it('takes a state name alone for the city of that name, which is no state then', () => {
    expect(titles('Washington')).toEqual(['Washington, DC']);
    expect(titles('New York')).toEqual(['New York, NY']);
    expect(namedCities('Washington')[0].exact).toBe(true);
  });

  it('reads no country or state inside a name', () => {
    // Iceland is "island" in its own language, and in German; England is a country of the United Kingdom.
    expect(titles('Staten Island')).toEqual(['New York, NY']);
    expect(titles('Staten Island NY')).toEqual(['New York, NY']);
    expect(titles('New England')).toEqual([]);
    expect(titles('Rhode Island')).toEqual([]);
    expect(titles('New Mexico')).toEqual([]);
    expect(titles('Kansas City')).toEqual(['Kansas City, MO']);
    expect(titles('Kansas City, MO')).toEqual(['Kansas City, MO']);
    // Kansas City in Kansas is not one of the cities, so the words are read whole: the one next door.
    expect(titles('Kansas City Kansas')).toEqual(['Kansas City, MO']);
  });

  it('reads a state code that is also a short word as one only where a city of the state starts like what comes before', () => {
    // "la" is Louisiana's code, "de" Delaware's.
    expect(titles('Pilar de la')).toEqual(['Pilar de la Horadada']);
    expect(titles('Caleta de')).toEqual(['Caleta de Fuste']);
  });
});

describe('addresses typed with their city', () => {
  it.each<[query: string, address: string, city: string]>([
    ['1100 Congress Ave, Austin, TX 78701', '1100 Congress Ave', 'us:tx:Austin'],
    ['1100 Congress Ave Austin TX 78701-1234', '1100 Congress Ave', 'us:tx:Austin'],
    ['1100 Congress Ave, Austin', '1100 Congress Ave', 'us:tx:Austin'],
    ['290 Bremen St, Toronto, ON M5V 2T6', '290 Bremen St', 'ca:on:Toronto'],
    ['290 Bremen St, Toronto ON M5V2T6', '290 Bremen St', 'ca:on:Toronto'],
    // Two towns of the name: the state says which.
    ['1 Congress St, Portland, ME 04101', '1 Congress St', 'us:me:Portland'],
    ['1 SW 6th Ave, Portland, OR', '1 SW 6th Ave', 'us:or:Portland'],
    ['1600 Pennsylvania Ave NW, Washington, D.C. 20500', '1600 Pennsylvania Ave NW', 'us:dc:Washington'],
    ['1600 Pennsylvania Ave NW, Washington', '1600 Pennsylvania Ave NW', 'us:dc:Washington'],
    ['White House, Washington, DC', 'White House', 'us:dc:Washington'],
    ['350 5th Ave, Manhattan', '350 5th Ave', 'us:ny:New York'],
    ['Times Square, NYC', 'Times Square', 'us:ny:New York'],
  ])('finds "%s" as "%s" in %s', (query, address, id) => {
    expect(cityOfAddress(query)).toEqual({ address, center: centreOf(id) });
  });

  it.each([
    // Portland alone could be either.
    '1 Congress St, Portland',
    // The state of Washington, not the city.
    'Seattle, Washington', 'Pennsylvania Ave, Washington',
    // A town of another state.
    '1 Main St, Portland, TX',
  ])('leaves "%s" to the search everywhere', query => {
    expect(cityOfAddress(query)).toBeNull();
  });
});

describe('the search in North America', () => {
  it('asks Photon within North America near Austin, and within Europe for "Lyon" near Paris', async () => {
    const asked = stubUpstreams({});

    await search('Congress Ave', { near: AUSTIN });
    await search('Gare de Lyon', { near: PARIS });

    const [austin, paris] = asked(PHOTON_HOST);
    expect(austin.searchParams.get('bbox')).toBe('-170,14,-50,72');
    expect(paris.searchParams.get('bbox')).toBe('-32,27,45,72');
    expect((await rows(await search('Lyon', { near: PARIS })))[0]).toEqual(['Lyon', 'France']);
  });

  it('asks Photon anywhere without a centre, and leaves out what is outside the parts of the world the app covers', async () => {
    const asked = stubUpstreams({ photon: [
      [{ type: 'city', name: 'Lima', state: 'Lima', country: 'Peru', countrycode: 'PE' }, -12.05, -77.04],
      [{ type: 'city', name: 'Lima', state: 'Ohio', country: 'United States', countrycode: 'US' }, 40.74, -84.11],
      [{ type: 'city', name: 'Lima', state: 'Dalarna', country: 'Sweden', countrycode: 'SE' }, 60.93, 13.25],
    ] });

    const found = await rows(await search('Lima'));

    expect(asked(PHOTON_HOST)[0].searchParams.has('bbox')).toBe(false);
    // After them, the cities of the catalog whose names start so: Limassol.
    expect(found.filter(([title]) => title === 'Lima')).toEqual([['Lima', 'Ohio, United States'], ['Lima', 'Dalarna, Sweden']]);
  });

  it('favours the country of the device\'s time zone without a centre, and Switzerland where none is sent', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    const asked = stubUpstreams({});

    await search('Congress Ave', { country: 'us' });
    await search('Congress Ave', { country: 'US', near: AUSTIN });
    await search('Congress Ave', { country: 'United States' });
    await search('Congress Ave');

    expect(asked(GEOAPIFY_HOST).filter(url => url.searchParams.get('type') !== 'city').map(url => url.searchParams.get('bias')))
      .toEqual(['countrycode:us', 'proximity:-97.74,30.27', 'proximity:-97.74,30.27', 'countrycode:ch', 'countrycode:ch']);
  });

  it('ranks the towns of the visitor\'s country first without a centre', async () => {
    const paris = (country: string) => {
      stubUpstreams({ photon: [
        [{ type: 'city', name: 'Paris', state: 'Île-de-France', country: 'France', countrycode: 'FR' }, 48.8566, 2.3522],
        [{ type: 'city', name: 'Paris', state: 'Texas', country: 'United States', countrycode: 'US' }, 33.6609, -95.5555],
      ] });
      return search('Paris', { country });
    };

    expect((await rows(await paris('US')))[0]).toEqual(['Paris', 'Texas, United States']);
    expect((await rows(await paris('FR')))[0]).toEqual(['Paris', 'Île-de-France, France']);
  });

  it('puts the Portland nearest the map first', async () => {
    stubUpstreams({});

    const oregon = await rows(await search('Portland', { near: [45.5, -122.6] }));
    const maine = await rows(await search('Portland', { near: [43.6, -70.2] }));

    expect(oregon.map(([title]) => title)).toEqual(['Portland, OR', 'Portland, ME']);
    expect(maine.map(([title]) => title)).toEqual(['Portland, ME', 'Portland, OR']);
  });

  it('writes a US or Canadian address as it is written there', async () => {
    stubUpstreams({ photon: [
      [{ type: 'house', housenumber: '1100', street: 'Congress Avenue', postcode: '78701', city: 'Austin', state: 'Texas', countrycode: 'US' }, 30.2747, -97.7404],
      [{ type: 'house', name: 'CN Tower', housenumber: '290', street: 'Bremner Boulevard', postcode: 'M5V 3L9', city: 'Toronto', state: 'Ontario', countrycode: 'CA' }, 43.6426, -79.3871],
      [{ type: 'house', housenumber: '1', street: 'Congress Street', postcode: '04101', city: 'Portland', state: 'Maine', countrycode: 'US' }, 43.66, -70.25],
      // Photon names Quebec in French when asked in French.
      [{ type: 'house', housenumber: '1', street: 'Rue Sainte-Catherine', postcode: 'H2X 1K4', city: 'Montréal', state: 'Québec', countrycode: 'CA' }, 45.5, -73.56],
    ] });

    expect(await rows(await search('anything', { near: AUSTIN }))).toEqual([
      ['1100 Congress Avenue', 'Austin, TX 78701'],
      ['CN Tower', '290 Bremner Boulevard, Toronto, ON M5V 3L9'],
      ['1 Congress Street', 'Portland, ME 04101'],
      ['1 Rue Sainte-Catherine', 'Montréal, QC H2X 1K4'],
    ]);
  });

  it('takes the state\'s code from Geoapify where it gives one', async () => {
    inWorker({ GEOAPIFY_API_KEY: 'key' });
    stubUpstreams({ geoapify: [
      [{ result_type: 'building', housenumber: '1100', street: 'Congress Avenue', postcode: '78701', city: 'Austin', state: 'Texas', state_code: 'TX', country_code: 'us' }, 30.2747, -97.7404],
      [{ result_type: 'building', housenumber: '1', street: 'Rue Sainte-Catherine', postcode: 'H2X 1K4', city: 'Montréal', state: 'Québec', state_code: 'QC', country_code: 'ca' }, 45.5, -73.56],
    ] });

    expect(await rows(await search('anything', { near: AUSTIN }))).toEqual([
      ['1100 Congress Avenue', 'Austin, TX 78701'],
      ['1 Rue Sainte-Catherine', 'Montréal, QC H2X 1K4'],
    ]);
  });
});

function inWorker(env: Record<string, unknown>) {
  getCloudflareContext.mockResolvedValue({ env });
}
