import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const rateLimitAllows = vi.hoisted(() => vi.fn());
const getCloudflareContext = vi.hoisted(() => vi.fn());

vi.mock('@/lib/rateLimit', () => ({ rateLimitAllows }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext }));

import { GET, POST } from '@/app/api/geocode/route';
import { RECORDED_ANSWERS, RECORDED_PHOTON_ANSWERS } from '@/app/api/geocode/recordedAnswers';

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

const GEOADMIN_HOST = 'api3.geo.admin.ch';
const PHOTON_HOST = 'photon.komoot.io';

type GeoAdminRow = [origin: string | undefined, label: string | undefined, lat: number, lon: number];
type PhotonRow = [properties: Record<string, unknown>, lat: number, lon: number];

/** Answers swisstopo with its rows and each Photon with its features, or with a status for a service that fails. */
function stubUpstreams({ swisstopo = [], photon = [] }: { swisstopo?: unknown[] | number; photon?: PhotonRow[] | number }) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const answer = new URL(String(input)).hostname !== GEOADMIN_HOST
      ? typeof photon === 'number' ? photon : {
        type: 'FeatureCollection',
        features: photon.map(([properties, lat, lon]) => ({ type: 'Feature', properties, geometry: { type: 'Point', coordinates: [lon, lat] } })),
      }
      : typeof swisstopo === 'number' ? swisstopo : { results: swisstopo };
    return typeof answer === 'number' ? new Response('', { status: answer }) : new Response(JSON.stringify(answer), { status: 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The URLs one service was asked. */
function asked(fetchMock: ReturnType<typeof vi.fn>, host: string): URL[] {
  return fetchMock.mock.calls.map(([input]) => new URL(String(input))).filter(url => url.hostname === host);
}

function stubGeoAdmin(rows: GeoAdminRow[]) {
  return stubUpstreams({ swisstopo: rows.map(([origin, label, lat, lon]) => ({ attrs: { origin, label, lat, lon } })) });
}

/** Answers as swisstopo, and Photon if it was recorded too, did when the query was recorded. */
function stubRecordedAnswer(query: string) {
  return stubUpstreams({
    swisstopo: (RECORDED_ANSWERS[query] ?? []).map(([origin, objectclass, label, lat, lon]) => ({
      attrs: { origin, objectclass, label, lat, lon, x: lon, y: lat },
    })),
    photon: RECORDED_PHOTON_ANSWERS[query] ?? [],
  });
}

// Inside the Zürich service area, and outside every service area.
const ZURICH: [number, number] = [47.3695, 8.5389];
const LAUSANNE: [number, number] = [46.5231, 6.6292];

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
  ])('finds %s without a Swiss geocoding request', async (query, name, title, subtitle) => {
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

    expect(response.headers.get('x-geocoding-data-source')).toBe('Verified European scooter city catalog');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual([
      { lat: 47.1368, lng: 7.2468, display_name: 'Biel/Bienne, Switzerland', title: 'Biel/Bienne', subtitle: 'Switzerland', covered: true },
    ]);
    // The centre of the city, not of its canton or district as swisstopo also offers.
    await expect((await GET(request('Zürich'))).json()).resolves.toEqual([
      { lat: 47.3769, lng: 8.5417, display_name: 'Zürich, Switzerland', title: 'Zürich', subtitle: 'Switzerland', covered: true },
    ]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('includes French scooter cities in searches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"results":[]}')));
    const result = await POST(postRequest('Marseille', 'fr'));
    expect(result.status).toBe(200);
    await expect(result.json()).resolves.toEqual([
      { lat: 43.2965, lng: 5.3698, display_name: 'Marseille, France', title: 'Marseille', subtitle: 'France', covered: true },
    ]);
  });

  it('can still navigate to French cities when Swiss address search fails', async () => {
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
    const expected = [
      { lat: 52.52, lng: 13.405, display_name: 'Berlin, Germany', title: 'Berlin', subtitle: germany, covered: true },
      { lat: 46.948, lng: 7.4474, display_name: 'Bern, Switzerland', title: 'Bern', subtitle: switzerland, covered: true },
    ];

    await expect((await GET(request('Ber', language))).json()).resolves.toEqual(expected);
    await expect((await POST(postRequest('Ber', language))).json()).resolves.toEqual(expected);
  });

  it('asks in English when the language sent is not text', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const [munich] = await (await POST(postRequest('München', 7))).json() as { subtitle: string }[];
    expect(munich.subtitle).toBe('Germany');
  });

  it('validates query length before contacting GeoAdmin', async () => {
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

  it('filters malformed upstream entries from a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      results: [
        { attrs: { lat: 47.377, lon: 8.54, label: 'haltestellen_ <b>Zürich HB</b>' } },
        { attrs: { lat: 'not-a-number', lon: 8.55, label: 'Invalid' } },
      ],
    }), { status: 200 })));

    const response = await GET(request('Zurich HB'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual([
      { lat: 47.377, lng: 8.54, display_name: 'Zürich HB', title: 'Zürich HB', subtitle: '', covered: true },
    ]);
  });

  it('accepts address text in a non-cacheable POST body', async () => {
    stubUpstreams({});

    const response = await POST(postRequest('Bern Bahnhof', 'de'));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('x-geocoding-data-source')).toBe('swisstopo geo.admin.ch, Photon, OpenStreetMap');
  });

  it('rejects malformed POST bodies without contacting GeoAdmin', async () => {
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

  it('requests Swiss geocoding results in the selected language', async () => {
    const fetchMock = stubUpstreams({});

    await GET(request('Lausanne Gare', 'fr'));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: GEOADMIN_HOST,
        pathname: '/rest/services/api/SearchServer',
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Accept-Language': 'fr-CH,fr;q=0.9,en;q=0.6',
        }),
      })
    );
    const [url] = asked(fetchMock, GEOADMIN_HOST);
    expect(url.searchParams.get('searchText')).toBe('Lausanne Gare');
    expect(url.searchParams.get('lang')).toBe('fr');
  });
});

describe('address search results', () => {
  // swisstopo's answer to "Paradeplatz" (lang=en) on 3 October 2026.
  it('splits labels into two lines and lists places with scooter data first', async () => {
    stubGeoAdmin([
      ['gazetteer', '<i>Local name swisstopo</i> <b>Paradeplatz</b> (OW) - Lungern', 46.7741, 8.1558],
      ['gazetteer', '<i>Part of a ward</i> <b>Paradeplatz</b> (ZH) - Zürich', 47.3690, 8.5390],
      ['address', 'Paradeplatz 2 <b>8001 Zürich</b>', 47.3695, 8.5389],
      ['address', 'Paradeplatz 3 <b>8001 Zürich</b>', 47.3694, 8.5388],
      ['address', 'Paradeplatz 4 <b>8001 Zürich</b>', 47.3694, 8.5387],
    ]);

    const response = await GET(request('Paradeplatz'));

    await expect(response.json()).resolves.toEqual([
      { lat: 47.369, lng: 8.539, display_name: 'Part of a ward Paradeplatz (ZH) - Zürich', title: 'Paradeplatz', subtitle: 'Zürich ZH', covered: true },
      { lat: 47.3695, lng: 8.5389, display_name: 'Paradeplatz 2 8001 Zürich', title: 'Paradeplatz 2', subtitle: '8001 Zürich', covered: true },
      { lat: 47.3694, lng: 8.5388, display_name: 'Paradeplatz 3 8001 Zürich', title: 'Paradeplatz 3', subtitle: '8001 Zürich', covered: true },
      { lat: 47.3694, lng: 8.5387, display_name: 'Paradeplatz 4 8001 Zürich', title: 'Paradeplatz 4', subtitle: '8001 Zürich', covered: true },
      { lat: 46.7741, lng: 8.1558, display_name: 'Local name swisstopo Paradeplatz (OW) - Lungern', title: 'Paradeplatz', subtitle: 'Lungern OW', covered: false },
    ]);
  });

  it('asks swisstopo for thirty places and keeps its ranking within the five returned', async () => {
    const fetchMock = stubGeoAdmin([
      ['address', 'Rue A 1 <b>1003 Lausanne</b>', 46.5231, 6.6292],
      ['address', 'Rue B 1 <b>8001 Zürich</b>', 47.3701, 8.5381],
      ['address', 'Rue C 1 <b>1003 Lausanne</b>', 46.5232, 6.6293],
      ['address', 'Rue D 1 <b>8001 Zürich</b>', 47.3702, 8.5382],
      ['address', 'Rue E 1 <b>1003 Lausanne</b>', 46.5233, 6.6294],
      ['address', 'Rue F 1 <b>8001 Zürich</b>', 47.3703, 8.5383],
      ['address', 'Rue G 1 <b>1003 Lausanne</b>', 46.5234, 6.6295],
      ['address', 'Rue H 1 <b>8001 Zürich</b>', 47.3704, 8.5384],
      ['address', 'Rue I 1 <b>1003 Lausanne</b>', 46.5235, 6.6296],
      ['address', 'Rue J 1 <b>1003 Lausanne</b>', 46.5236, 6.6297],
    ]);

    const results = await (await GET(request('rue'))).json() as { title: string; covered: boolean }[];

    expect(asked(fetchMock, GEOADMIN_HOST)[0].searchParams.get('limit')).toBe('30');
    expect(results.map(result => result.title)).toEqual(['Rue B 1', 'Rue D 1', 'Rue F 1', 'Rue H 1', 'Rue A 1']);
    expect(results.map(result => result.covered)).toEqual([true, true, true, true, false]);
  });

  it.each<[origin: string | undefined, label: string, title: string, subtitle: string]>([
    ['address', 'Rue de l&#39;Ale 1 <b>1003 Lausanne</b>', "Rue de l'Ale 1", '1003 Lausanne'],
    ['address', 'Paradeplatz 2 8001 Zürich', 'Paradeplatz 2 8001 Zürich', ''],
    ['address', '<b>8001 Zürich</b>', '8001 Zürich', ''],
    ['address', 'Via Stazione # <b>6963 Pregassona</b>', 'Via Stazione', '6963 Pregassona'],
    ['gazetteer', '<i>Building</i> <b>Bau &amp; Hobby</b> (BE) - Bern', 'Bau & Hobby', 'Bern BE'],
    ['gazetteer', '<i>Exit</i> <b>Gossau</b> (SG) - Gossau (SG)', 'Gossau', 'Gossau SG'],
    ['gazetteer', '<i>Populated Place</i> <b>Gossau ZH</b> (ZH) - Gossau (ZH)', 'Gossau ZH', ''],
    ['gazetteer', '<b>Zürich\n</b> (ZH) - Dübendorf,Zollikon,Kilchberg (ZH),Zürich', 'Zürich', 'ZH'],
    ['gazetteer', '<b>St. Gallen</b> (SG,AR) - Teufen (AR),Wittenbach,St. Gallen', 'St. Gallen', 'SG, AR'],
    ['gazetteer', '<i>Local name swisstopo</i> Paradeplatz (OW) - Lungern', 'Paradeplatz (OW) - Lungern', ''],
    ['gg25', '<b>Lausanne (VD)</b>', 'Lausanne', 'VD'],
    ['gazetteer', '<b>Fribourg|Freiburg\n</b> (FR) - Fribourg,Düdingen,Tafers', 'Fribourg', 'FR'],
    ['gazetteer', '<i>Local name swisstopo</i> <b>Chur</b> () - Triesenberg', 'Chur', 'Triesenberg'],
    ['gazetteer', '<i>Island on a lake</i> <b>Lindau Insel (D)</b> () - ', 'Lindau Insel (D)', ''],
    ['zipcode', '<b>8001 - Zürich</b>', '8001 Zürich', ''],
    ['somethingNew', '<b>Kerzers</b> 8001 (CH 9077 9455 1086)', 'Kerzers', '8001 (CH 9077 9455 1086)'],
    ['haltestellen', '<i>train</i> <b>Zürich HB</b>', 'Zürich HB', 'Train'],
    ['haltestellen', '<i><i>haltestellen_</i></i> <b>Zürich HB Löwenstrasse</b>', 'Zürich HB Löwenstrasse', ''],
    ['haltestellen', '<i><i>haltestellen_bus / tram</i></i> <b>Bern, Bahnhof</b>', 'Bern, Bahnhof', 'Bus / tram'],
    ['somethingNew', '<b>Zürich</b> (ZH)', 'Zürich', 'ZH'],
    ['somethingNew', '<b>Name</b> - , elsewhere', 'Name', 'elsewhere'],
    [undefined, 'A &lt;plain&gt; label', 'A <plain> label', ''],
    [undefined, '<i>Only a category</i>', 'Only a category', ''],
  ])('reads %s label %j as "%s" and "%s"', async (origin, label, title, subtitle) => {
    stubGeoAdmin([[origin, label, ...LAUSANNE]]);

    await expect((await GET(request('anything'))).json()).resolves.toEqual([
      expect.objectContaining({ title, subtitle, covered: false }),
    ]);
  });

  it.each([
    ['<i>train</i> <b>Zürich HB</b>', 'train Zürich HB'],
    ['<i><i>haltestellen_</i></i> <b>Bern, Bahnhof (Vzw)</b>', 'Bern, Bahnhof (Vzw)'],
    ['<b>Zürich\n</b> (ZH) - Dübendorf,Zollikon', 'Zürich\n (ZH) - Dübendorf,Zollikon'],
    ['Rue de l&#39;Ale 1 <b>1003 Lausanne</b>', "Rue de l'Ale 1 1003 Lausanne"],
  ])('keeps display_name for %j exactly as older app versions expect', async (label, displayName) => {
    stubGeoAdmin([['gazetteer', label, ...ZURICH]]);

    const [result] = await (await GET(request('anything'))).json() as { display_name: string }[];

    expect(result.display_name).toBe(displayName);
  });

  it('drops entries without a usable label and never returns an empty title', async () => {
    stubGeoAdmin([
      ['address', '', ...ZURICH],
      ['address', undefined, ...ZURICH],
      ['gazetteer', '<i></i> <b> </b>', ...ZURICH],
      ['address', ' # <b>8001 Zürich</b>', ...ZURICH],
      ['gazetteer', '<b></b> (ZH) - Zürich', ...ZURICH],
    ]);

    const results = await (await GET(request('anything'))).json() as { title: string; subtitle: string }[];

    expect(results.map(result => [result.title, result.subtitle])).toEqual([
      ['8001 Zürich', ''],
      ['(ZH) - Zürich', ''],
    ]);
  });

  it('lists a place once when swisstopo returns it several times', async () => {
    stubGeoAdmin([
      ['gg25', '<b>Thun (BE)</b>', 46.7405, 7.6076],
      ['gazetteer', '<b>Thun\n</b> (BE) - Heimberg,Thierachern,Uetendorf,Thun', 46.7513, 7.6183],
      ['gazetteer', '<b>Thun</b> (BE) - Heimberg,Thierachern,Uetendorf,Thun', 46.7513, 7.6183],
      // The airfield in Thun, which would read "Thun / Thun BE" under the town itself.
      ['gazetteer', '<i>Airfield</i> <b>Thun</b> (BE) - Thun', 46.7561, 7.6006],
      ['gazetteer', '<i>Leisure park</i> <b>Thun-Panorama</b> (BE) - Thun', 46.7457, 7.6359],
    ]);

    const results = await (await GET(request('Thun'))).json() as { title: string; subtitle: string; lat: number }[];

    expect(results.map(result => [result.title, result.subtitle, result.lat])).toEqual([
      ['Thun', 'BE', 46.7405],
      ['Thun-Panorama', 'Thun BE', 46.7457],
    ]);
  });

  it('leaves out the centres of cantons and districts, land parcels and motorway exits', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ results: [
      { attrs: { origin: 'kantone', label: '<b>Luzern</b>', lat: 47.031, lon: 8.192 } },
      { attrs: { origin: 'district', label: '<b>Luzern-Stadt</b>', lat: 47.055, lon: 8.301 } },
      { attrs: { origin: 'parcel', label: '<b>Luzern</b> 8001 (CH 9077 9455 1086)', lat: 47.05, lon: 8.3 } },
      { attrs: { origin: 'gazetteer', objectclass: 'TLM_AUS_EINFAHRT', label: '<i>Exit</i> <b>Luzern-Zentrum</b> (LU) - Luzern', lat: 47.055, lon: 8.295 } },
      { attrs: { origin: 'gazetteer', objectclass: 'tlm_aus_einfahrt', label: '<i>Interchange</i> <b>Luzern-Süd</b> (LU) - Luzern', lat: 47.03, lon: 8.3 } },
      { attrs: { origin: 'gazetteer', objectclass: 'TLM_SIEDLUNGSNAME', label: '<i>Populated Place</i> <b>Luzernerhof</b> (LU) - Luzern', lat: 47.054, lon: 8.31 } },
    ] }))));

    const results = await (await GET(request('Luzern'))).json() as { title: string }[];

    expect(results.map(result => result.title)).toEqual(['Luzernerhof']);
  });

  it('puts a town typed by its name first, with scooter data or without', async () => {
    stubGeoAdmin([
      ['address', 'Lausannegasse 1 <b>8001 Zürich</b>', ...ZURICH],
      ['gg25', '<b>Lausanne (VD)</b>', ...LAUSANNE],
      ['address', 'Lausannegasse 2 <b>8001 Zürich</b>', ...ZURICH],
    ]);

    const results = await (await GET(request('lausanne'))).json() as { title: string; covered: boolean }[];

    expect(results.map(result => [result.title, result.covered])).toEqual([
      ['Lausanne', false], ['Lausannegasse 1', true], ['Lausannegasse 2', true],
    ]);
  });

  it('puts the place named as typed first among those with scooter data, in any word order and spelling', async () => {
    stubGeoAdmin([
      ['haltestellen', '<i>bus</i> <b>Zürich Flughafen, OPC</b>', ...ZURICH],
      ['haltestellen', '<i>train</i> <b>Zürich Flughafen</b>', ...ZURICH],
      ['haltestellen', '<i>bus</i> <b>Zürich Flughafen, Werft</b>', ...ZURICH],
    ]);

    const results = await (await GET(request('Flughafen Zuerich'))).json() as { title: string }[];

    expect(results.map(result => result.title)).toEqual(['Zürich Flughafen', 'Zürich Flughafen, OPC', 'Zürich Flughafen, Werft']);
  });

  it('puts stops with a transport mode before the operating points of the railway, and leaves those out', async () => {
    const rows: GeoAdminRow[] = [
      ['haltestellen', '<i><i>haltestellen_</i></i> <b>Basel SBB Tiefbahnhof</b>', 47.5471, 7.5888],
      ['haltestellen', '<i><i>haltestellen_</i></i> <b>Basel SBB GB West (Spw)</b>', 47.543, 7.605],
      ['haltestellen', '<i><i>haltestellen_</i></i> <b>Basel SBB</b>', 47.5474, 7.5896],
      ['haltestellen', '<i><i>haltestellen_bus / tram</i></i> <b>Basel, Bahnhof SBB</b>', 47.5483, 7.5903],
      ['haltestellen', '<i>train</i> <b>Basel SBB</b>', 47.5474, 7.5896],
    ];
    stubGeoAdmin(rows);
    const lines = async (query: string) =>
      (await (await GET(request(query))).json() as { title: string; subtitle: string }[]).map(result => [result.title, result.subtitle]);

    // The station first, although an operating point carries the very same name.
    expect(await lines('Basel SBB')).toEqual([['Basel SBB', 'Train'], ['Basel, Bahnhof SBB', 'Bus / tram']]);
    // Typed by its own name, an operating point is still found, and first: there is nothing better.
    expect((await lines('Basel SBB Tiefbahnhof'))[0]).toEqual(['Basel SBB Tiefbahnhof', '']);
    // And it comes before what has the text only inside its words.
    stubGeoAdmin([
      ['gazetteer', '<i>Populated Place</i> <b>Tiefbahnhofen</b> (BS) - Basel', 47.5471, 7.5888],
      ['gazetteer', '<i>Populated Place</i> <b>Untiefbahnhof</b> (BS) - Basel', 47.5471, 7.5888],
      rows[0],
    ]);
    expect(await lines('Tiefbahnhof')).toEqual([['Tiefbahnhofen', 'Basel BS']]);
    stubGeoAdmin([['gazetteer', '<i>Populated Place</i> <b>Untiefbahnhof</b> (BS) - Basel', 47.5471, 7.5888], rows[0]]);
    expect(await lines('Tiefbahnhof')).toEqual([['Basel SBB Tiefbahnhof', ''], ['Untiefbahnhof', 'Basel BS']]);
  });

  it('searches and ranks an address typed with ß as the same address typed with ss', async () => {
    // Einsiedeln starts with the "e" that is left of "Straße" when the ß is taken for a space.
    const rows: GeoAdminRow[] = [
      ['address', 'Bahnhofstrasse 5 <b>8840 Einsiedeln</b>', 47.1281, 8.7529],
      ['address', 'Bahnhofstrasse 5 <b>8001 Zürich</b>', ...ZURICH],
      ['address', 'Bahnhofstrasse 50 <b>8001 Zürich</b>', 47.3712, 8.5391],
    ];
    const answers = async (query: string) => {
      const fetchMock = stubGeoAdmin(rows);
      const results = await (await POST(postRequest(query))).json() as { title: string; subtitle: string }[];
      return { asked: asked(fetchMock, GEOADMIN_HOST)[0].searchParams.get('searchText'), results };
    };

    const typed = await answers('Bahnhofstraße 5');
    const swiss = await answers('Bahnhofstrasse 5');
    // swisstopo takes the ß for a separator and finds boundary stones named "5.A".
    expect(typed.asked).toBe('Bahnhofstrasse 5');
    expect(typed.results).toEqual(swiss.results);
    expect(typed.results.map(result => [result.title, result.subtitle])).toEqual([
      ['Bahnhofstrasse 5', '8001 Zürich'], ['Bahnhofstrasse 50', '8001 Zürich'], ['Bahnhofstrasse 5', '8840 Einsiedeln'],
    ]);
    expect((await answers('GROẞE STRAẞE')).asked).toBe('GROSSE STRASSE');
    expect((await answers('Rue du Vieux-Chœur, Cæsar')).asked).toBe('Rue du Vieux-Choeur, Caesar');
  });

  it('ranks a place written with œ for the same word typed with oe', async () => {
    stubGeoAdmin([
      ['address', 'Chemin du Cœur 1 <b>1003 Lausanne</b>', ...LAUSANNE],
      ['gazetteer', '<i>Populated Place</i> <b>Recoeurbe</b> (VD) - Lausanne', ...LAUSANNE],
    ]);
    const results = await (await GET(request('Coeur'))).json() as { title: string }[];
    // The address starts a word with what was typed; the hamlet only has it inside.
    expect(results.map(result => result.title)).toEqual(['Chemin du Cœur 1']);
  });

  it('shows matches inside words only when nothing starts with what was typed', async () => {
    const rows: GeoAdminRow[] = [
      ['gazetteer', '<i>Populated Place</i> <b>Uettligenfeld</b> (BE) - Wohlen bei Bern', ...ZURICH],
      ['gazetteer', '<i>School</i> <b>Deutsche Schule Genf</b> (GE) - Vernier', ...LAUSANNE],
      ['address', 'Chemin des Fleurs 1 <b>1200 Genf</b>', ...LAUSANNE],
    ];
    stubGeoAdmin(rows);
    const titles = async (query: string) =>
      (await (await GET(request(query))).json() as { title: string }[]).map(result => result.title);

    // "genf" starts a word of the title or of the second line.
    expect(await titles('Genf')).toEqual(['Deutsche Schule Genf', 'Chemin des Fleurs 1']);
    // A typing mistake that swisstopo forgave: better than nothing.
    stubGeoAdmin(rows.slice(0, 1));
    expect(await titles('Genf')).toEqual(['Uettligenfeld']);
  });
});

// Inside the Berlin service area, and in Paris, which has none.
const BERLIN: [number, number] = [52.52, 13.405];
const PARIS: [number, number] = [48.8566, 2.3522];

describe('places across Europe', () => {
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
    // swisstopo knows Switzerland only, and is not asked about Paris or Turin.
    expect(asked(fetchMock, GEOADMIN_HOST)).toEqual([]);
  });

  it('asks swisstopo as well with the map in or near Switzerland, or nowhere in particular', async () => {
    const fetchMock = stubUpstreams({});

    await POST(postRequest('Bahnhofstrasse 1', 'de', ZURICH));
    // Geneva's French side.
    await POST(postRequest('Rue de Genève 1', 'fr', [46.19, 6.24]));
    await POST(postRequest('Bahnhofstrasse 1', 'de'));
    await GET(request('Bahnhofstrasse 1', 'de'));

    expect(asked(fetchMock, GEOADMIN_HOST)).toHaveLength(4);
    expect(asked(fetchMock, PHOTON_HOST).map(url => url.searchParams.get('lat'))).toEqual(['47.37', '46.19', null, null]);
  });

  it.each([['Paris'], [[48.86]], [[48.86, 2.35, 0]], [['48.86', '2.35']], [[95, 2.35]], [[48.86, null]], [{ lat: 48.86, lng: 2.35 }]])(
    'takes %j for no map centre',
    async near => {
      const fetchMock = stubUpstreams({});

      expect((await POST(postRequest('Rue de Rivoli 10', 'fr', near))).status).toBe(200);

      expect(asked(fetchMock, PHOTON_HOST)[0].searchParams.has('lat')).toBe(false);
      expect(asked(fetchMock, GEOADMIN_HOST)).toHaveLength(1);
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

  it('puts places near the map centre first, then those with scooter data', async () => {
    const swisstopo = [{ attrs: { origin: 'address', label: 'Bahnhofstrasse 1 <b>8001 Zürich</b>', lat: ZURICH[0], lon: ZURICH[1] } }];
    const photon: PhotonRow[] = [
      [{ type: 'street', name: 'Bahnhofstrasse', city: 'Berlin', countrycode: 'DE' }, ...BERLIN],
      [{ type: 'street', name: 'Bahnhofstrasse', city: 'Paris', countrycode: 'FR' }, ...PARIS],
    ];
    const titles = async (near?: [number, number]) => {
      stubUpstreams({ swisstopo, photon });
      return (await (await POST(postRequest('Bahnhofstrasse', 'de', near))).json() as { subtitle: string }[]).map(place => place.subtitle);
    };

    // Nowhere in particular, as on the first view of the map: Switzerland first.
    expect(await titles()).toEqual(['8001 Zürich', 'Berlin', 'Paris']);
    expect(await titles(ZURICH)).toEqual(['8001 Zürich', 'Berlin', 'Paris']);
    expect(await titles(PARIS)).toEqual(['Paris', 'Berlin']);
  });

  it("adds Photon's Swiss places to swisstopo's, but not its towns or the places swisstopo lists already", async () => {
    stubUpstreams({
      swisstopo: [
        { attrs: { origin: 'gg25', label: '<b>Genf (GE)</b>', lat: 46.2046, lon: 6.1425 } },
        { attrs: { origin: 'address', label: 'Rue du Rhône 1 <b>1204 Genève</b>', lat: 46.2035, lon: 6.1461 } },
      ],
      photon: [
        [{ type: 'city', name: 'Geneva', state: 'Geneva', country: 'Switzerland', countrycode: 'CH' }, 46.2018, 6.1466],
        [{ type: 'house', housenumber: '1', street: 'Rue du Rhône', postcode: '1204', city: 'Genève', countrycode: 'CH' }, 46.2036, 6.1462],
        [{ type: 'house', name: "Jet d'Eau", postcode: '1207', city: 'Genève', countrycode: 'CH' }, 46.2073, 6.1557],
      ],
    });

    const results = await (await GET(request('Genf'))).json() as { title: string; subtitle: string }[];

    // The address has "genf" nowhere: a last resort, left out beside better places.
    expect(results.map(result => [result.title, result.subtitle])).toEqual([['Genf', 'GE'], ["Jet d'Eau", '1207 Genève']]);
  });

  it("finds the address near the map centre among Photon's when swisstopo's thirty are elsewhere", async () => {
    stubUpstreams({
      swisstopo: [{ attrs: { origin: 'address', label: 'Bahnhofstrasse 1 <b>7304 Maienfeld</b>', lat: 47.0098, lon: 9.5303 } }],
      photon: [
        [{ type: 'house', name: 'Arth-Goldau', housenumber: '1', street: 'Bahnhofstrasse', postcode: '6410', city: 'Goldau', countrycode: 'CH' }, 47.0491, 8.5496],
        [{ type: 'house', housenumber: '1', street: 'Bahnhofstrasse', postcode: '8001', city: 'Zürich', countrycode: 'CH' }, 47.3673, 8.5399],
      ],
    });

    const results = await (await POST(postRequest('Bahnhofstrasse 1', 'de', ZURICH))).json() as { subtitle: string }[];

    // Then the far ones: Goldau, in the Zug service area, before Maienfeld without scooters.
    expect(results.map(result => result.subtitle)).toEqual(['8001 Zürich', 'Bahnhofstrasse 1, 6410 Goldau', '7304 Maienfeld']);
  });

  it('ranks a town found by another of its names, or spelled without its letters, as typed by its name', async () => {
    const lines = async (query: string, photon: PhotonRow[]) => {
      stubUpstreams({ swisstopo: [{ attrs: { origin: 'address', label: `${query}weg 1 <b>8001 Zürich</b>`, lat: ZURICH[0], lon: ZURICH[1] } }], photon });
      return (await (await GET(request(query))).json() as { title: string }[]).map(place => place.title);
    };

    expect(await lines('Mailand', [[{ type: 'city', name: 'Milan', country: 'Italy' }, 45.4642, 9.1896]])).toEqual(['Milan', 'Mailandweg 1']);
    expect(await lines('Lodz', [[{ type: 'city', name: 'Łódź', country: 'Polska' }, 51.7592, 19.456]])).toEqual(['Łódź', 'Lodzweg 1']);
    // Not what is found for a street of its name.
    expect(await lines('Rue de Lyon', [[{ type: 'city', name: 'Lyon', country: 'France' }, 45.7578, 4.832]])).toEqual(['Rue de Lyonweg 1', 'Lyon']);
  });

  it('answers from the service that answered when the other fails', async () => {
    const swisstopo = [{ attrs: { origin: 'address', label: 'Paradeplatz 2 <b>8001 Zürich</b>', lat: ZURICH[0], lon: ZURICH[1] } }];
    const photon: PhotonRow[] = [[{ type: 'street', name: 'Paradeplatz', city: 'Konstanz', countrycode: 'DE' }, 47.66, 9.17]];

    stubUpstreams({ swisstopo: 503, photon });
    let response = await GET(request('Paradeplatz'));
    expect(response.headers.get('x-geocoding-data-source')).toBe('Photon, OpenStreetMap');
    expect((await response.json() as { subtitle: string }[]).map(place => place.subtitle)).toEqual(['Konstanz']);

    stubUpstreams({ swisstopo, photon: 429 });
    response = await GET(request('Paradeplatz'));
    expect(response.headers.get('x-geocoding-data-source')).toBe('swisstopo geo.admin.ch');
    expect((await response.json() as { subtitle: string }[]).map(place => place.subtitle)).toEqual(['8001 Zürich']);
  });

  it.each<[swisstopo: number | null, photon: number | 'invalid', status: number, retryAfter: string | null]>([
    [503, 503, 502, '30'],
    [429, 503, 503, '60'],
    [503, 429, 502, '30'],
    [null, 429, 503, '60'],
    [null, 500, 502, '30'],
    [null, 'invalid', 502, null],
  ])('fails only when every service asked fails (swisstopo %s, Photon %s)', async (swisstopo, photon, status, retryAfter) => {
    vi.stubGlobal('fetch', vi.fn(async (input: URL) => {
      const answer = input.hostname === PHOTON_HOST ? photon : swisstopo;
      return answer === 'invalid' ? new Response('{"results":[]}') : new Response('', { status: answer ?? 200 });
    }));

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', swisstopo === null ? PARIS : undefined));

    expect(response.status).toBe(status);
    expect(response.headers.get('retry-after')).toBe(retryAfter);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it("waits for a slow Photon only a second longer than for swisstopo's place near the map", async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    // Photon answers after five seconds, or not at all once given up on.
    const stubSlowPhoton = (swisstopo: unknown[]) => vi.stubGlobal('fetch', vi.fn((input: URL, init: RequestInit) => input.hostname === PHOTON_HOST
      ? new Promise<Response>((resolve, reject) => {
        const answer = setTimeout(() => resolve(new Response(JSON.stringify({ features: [
          [{ type: 'street', name: 'Paradeplatz', city: 'Konstanz', countrycode: 'DE' }, 47.66, 9.17],
        ].map(([properties, lat, lon]) => ({ properties, geometry: { coordinates: [lon, lat] } })) }))), 5_000);
        init.signal?.addEventListener('abort', () => { clearTimeout(answer); reject(init.signal?.reason); });
      })
      : Promise.resolve(new Response(JSON.stringify({ results: swisstopo })))));
    const zurich = { attrs: { origin: 'address', label: 'Paradeplatz 2 <b>8001 Zürich</b>', lat: ZURICH[0], lon: ZURICH[1] } };
    const lungern = { attrs: { origin: 'address', label: 'Paradeplatz 2 <b>6078 Lungern</b>', lat: 46.7741, lon: 8.1558 } };
    const settled = (response: Promise<Response>) => {
      let done = false;
      void response.then(() => { done = true; });
      return () => done;
    };

    stubSlowPhoton([zurich]);
    let response = POST(postRequest('Paradeplatz', 'en', ZURICH));
    let done = settled(response);
    await vi.advanceTimersByTimeAsync(999);
    expect(done()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done()).toBe(true);
    expect((await response).headers.get('x-geocoding-data-source')).toBe('swisstopo geo.admin.ch');

    // swisstopo's place is far from the map: Photon may have a nearer one.
    stubSlowPhoton([lungern]);
    response = POST(postRequest('Paradeplatz', 'en', ZURICH));
    done = settled(response);
    await vi.advanceTimersByTimeAsync(4_999);
    expect(done()).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(((await (await response).json()) as { subtitle: string }[]).map(place => place.subtitle)).toEqual(['Konstanz', '6078 Lungern']);
  });

  it('answers that the search timed out when every service asked did', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('The operation timed out.', 'TimeoutError'); }));

    const response = await POST(postRequest('Rue de Rivoli 10', 'fr', PARIS));

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({ error: 'Address search timed out.' });
  });
});

// Our own Photon where the Worker names one, and komoot's public one standing in for it.
describe('our own Photon', () => {
  const OWN_PHOTON = 'https://photon.example.ch/api/';
  const PUBLIC_PHOTON = 'https://photon.komoot.io/api/';
  const TOKEN = { PHOTON_ACCESS_CLIENT_ID: 'id.access', PHOTON_ACCESS_CLIENT_SECRET: 'secret' };
  const RIVOLI: PhotonRow = [{ type: 'house', housenumber: '10', street: 'Rue de Rivoli', postcode: '75004', city: 'Paris', countrycode: 'FR' }, 48.8556, 2.3594];

  function inWorker(env: Record<string, unknown>) {
    getCloudflareContext.mockResolvedValue({ env });
  }

  /** Our own Photon answering with a status, a page, or an error; the public one with Rivoli. */
  function stubOwnPhoton(own: number | string | Error) {
    const fetchMock = vi.fn(async (input: URL) => {
      if (input.hostname !== new URL(OWN_PHOTON).hostname) {
        return new Response(JSON.stringify({ features: [{ properties: RIVOLI[0], geometry: { coordinates: [RIVOLI[2], RIVOLI[1]] } }] }));
      }
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
      .filter(([url]) => url.hostname !== GEOADMIN_HOST)
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
    inWorker({ PHOTON_API_URL: OWN_PHOTON, ...TOKEN });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const timeouts = vi.spyOn(AbortSignal, 'timeout');
    stubOwnPhoton(new DOMException('The operation timed out.', 'TimeoutError'));

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

  it('does not ask the public Photon once the search has stopped waiting for ours', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    inWorker({ PHOTON_API_URL: OWN_PHOTON, ...TOKEN });
    const zurich = { attrs: { origin: 'address', label: 'Paradeplatz 2 <b>8001 Zürich</b>', lat: ZURICH[0], lon: ZURICH[1] } };
    // Ours answers only once given up on.
    const fetchMock = vi.fn((input: URL, init: RequestInit) => input.hostname === GEOADMIN_HOST
      ? Promise.resolve(new Response(JSON.stringify({ results: [zurich] })))
      : new Promise<Response>((_, reject) => init.signal?.addEventListener('abort', () => reject(init.signal?.reason))));
    vi.stubGlobal('fetch', fetchMock);

    const response = POST(postRequest('Paradeplatz', 'en', ZURICH));
    await vi.advanceTimersByTimeAsync(1_000);

    expect((await response).headers.get('x-geocoding-data-source')).toBe('swisstopo geo.admin.ch');
    expect(photonsAsked(fetchMock)).toEqual([[OWN_PHOTON, 'id.access', 'secret']]);
  });
});

// The rows a rider sees across Europe, answered as Photon answered them.
describe('recorded Photon answers', () => {
  const NO_DATA = false;
  const DATA = true;

  it.each<[query: string, language: string, near: [number, number], rows: [title: string, subtitle: string, covered: boolean][]]>([
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
      ['10 Rue de Rivoli', '91360 Épinay-sur-Orge', DATA],
      ['10 Rue de Rivoli', '78450 Villepreux', DATA],
      ['10 Rue de Rivoli', '76600 Le Havre', DATA],
    ]],
    // Fifteen platforms, stops and entrances of the one station.
    ['Hauptbahnhof', 'de', [48.14, 11.57], [['Hauptbahnhof', 'Bahnhofplatz, 80335 München', DATA]]],
  ])('answers "%s" with the places a rider would choose', async (query, language, near, rows) => {
    const fetchMock = stubRecordedAnswer(query);

    const response = await POST(postRequest(query, language, near));
    const results = await response.json() as { title: string; subtitle: string; covered: boolean }[];

    expect(asked(fetchMock, GEOADMIN_HOST)).toEqual([]);
    expect(response.headers.get('x-geocoding-data-source')).toBe('Photon, OpenStreetMap');
    expect(results.map(result => [result.title, result.subtitle, result.covered])).toEqual(rows);
  });
});

// The rows a rider sees for real queries, answered as swisstopo answered them.
describe('recorded swisstopo answers', () => {
  const NO_DATA = false;
  const DATA = true;

  it.each<[query: string, rows: [title: string, subtitle: string, covered: boolean][]]>([
    // A town without scooter data: itself, then what starts with its name. Not the
    // hamlets that merely contain the letters, which swisstopo ranks above the lake.
    ['Genf', [
      ['Genf', 'GE', NO_DATA],
      ['Genfersee', 'GE, VD, VS', NO_DATA],
      ['Deutsche Schule Genf', 'Vernier GE', NO_DATA],
    ]],
    // Without the district, the town repeated twice and four motorway exits.
    ['Lausanne', [
      ['Lausanne', 'VD', NO_DATA],
      ['Lausanne-La Blécherette', 'Lausanne VD', NO_DATA],
      ['Lausanne Vernand 300/50m', 'Romanel-sur-Lausanne VD', NO_DATA],
      ['Lausanne Vernand 25m', 'Romanel-sur-Lausanne VD', NO_DATA],
      ['Lausanne, Stade de Coubertin', 'Bus', NO_DATA],
    ]],
    // Without the canton and its two districts, which had no second line. The town
    // first, then its stops that lie inside a service area.
    ['Luzern', [
      ['Luzern', 'LU', NO_DATA],
      ['Luzern, Giseli', 'Bus', DATA],
      ['Luzern, Schönbühl', 'Bus', DATA],
      ['Luzern, Eggen', 'Bus', DATA],
      ['Luzern, Hermitage', 'Bus', DATA],
    ]],
    ['Baden', [
      ['Baden', 'AG', NO_DATA],
      ['Baden, Schlossbergplatz', 'Bus', NO_DATA],
      ['Baden, Grosse Bäder', 'Bus', NO_DATA],
      ['Baden, Römerstrasse', 'Bus', NO_DATA],
      ['Baden, Historisches Museum', 'Bus', NO_DATA],
    ]],
    // The canton, "Fribourg|Freiburg", five exits and a treatment plant called Fribourg are gone.
    ['Fribourg', [
      ['Fribourg', 'FR', NO_DATA],
      ['Fribourg, Jardin botanique', 'Bus', NO_DATA],
      ['Fribourg, Miséricorde', 'Bus', NO_DATA],
      ['Fribourg, Vuille', 'Bus', NO_DATA],
      ['Fribourg, Musy 4', 'Bus', NO_DATA],
    ]],
    ['Chur', [
      ['Chur', 'GR', NO_DATA],
      ['Chur', 'Triesenberg', NO_DATA],
      ['Chur (Brambrüeschbahn)', 'Chur GR', NO_DATA],
      ['Chur Rossboden 100/50m', 'Chur GR', NO_DATA],
      ['Chur Rossboden 400/300/200/100m', 'Chur GR', NO_DATA],
    ]],
    // The station itself is seventh in swisstopo's answer. Without "Museumstrasse",
    // "Nord", "SZU Süd (Spw)", "Cargo GV": operating points, not stops.
    ['Zürich HB', [
      ['Zürich HB', 'Train', DATA],
      ['Zürich HB SZU', 'Train', DATA],
    ]],
    // The station itself is twentieth, after nineteen depots, junctions and track groups.
    ['Basel SBB', [
      ['Basel SBB', 'Train', DATA],
      ['Basel, Bahnhof SBB', 'Bus / tram', DATA],
    ]],
    // The stop in front of the station, without "Bern, Bahnhof (Vzw)" beside it.
    ['Bern Bahnhof', [
      ['Bern, Bahnhof', 'Bus / tram', DATA],
      ['Bahnhofplatz 1', '3011 Bern', DATA],
      ['Bahnhofplatz 2', '3011 Bern', DATA],
      ['Bahnhofplatz 3', '3011 Bern', DATA],
      ['Bahnhofplatz 4', '3011 Bern', DATA],
    ]],
    // The railway station is eighth, after two motorway exits and five bus stops.
    ['Genève Aéroport', [
      ['Genève-Aéroport', 'Train', NO_DATA],
      ['Genève-Aéroport, WTC', 'Bus', NO_DATA],
      ['Genève-Aéroport, gare-Arena', 'Bus', NO_DATA],
      ['Genève-Aéroport, ICC', 'Bus', NO_DATA],
      ['Genève-Aéroport, Tour-de-Contrôle', 'Bus', NO_DATA],
    ]],
    ['Flughafen Zürich', [
      ['Zürich Flughafen', 'Train', DATA],
      ['Zürich Flughafen, OPC', 'Bus', DATA],
      ['Zürich Flughafen, Fracht', 'Bus / tram', DATA],
      ['Zürich Flughafen, Werft', 'Bus', DATA],
      ['Zürich Flughafen, Bahnhof', 'Bus / tram', DATA],
    ]],
    ['Bahnhofstrasse 1 Zürich', [
      ['Bahnhofstrasse 1', '8001 Zürich', DATA],
      ['Bahnhofstrasse 10', '8001 Zürich', DATA],
      ['Bahnhofstrasse 11', '8001 Zürich', DATA],
      ['Bahnhofstrasse 12', '8001 Zürich', DATA],
      ['Bahnhofstrasse 13', '8001 Zürich', DATA],
    ]],
    // Milan has no scooter data and swisstopo knows Switzerland only: Photon's Milan,
    // named in English, then one street in Chiasso, once without a house number, then its houses.
    ['Milano', [
      ['Milan', 'Lombardy, Italy', NO_DATA],
      ['Via Milano', '6830 Chiasso', NO_DATA],
      ['Via Milano 1', '6830 Chiasso', NO_DATA],
      ['Via Milano 5', '6830 Chiasso', NO_DATA],
      ['Via Milano 7', '6830 Chiasso', NO_DATA],
    ]],
    // Without nine land parcels numbered 8001.
    ['8001', [['8001 Zürich', '', DATA]]],
    // Without Röthenbach, Rüthi and St. Margrethen, which have "eth" inside.
    ['ETH', [
      ['ETH / Universität', 'Zürich ZH', DATA],
      ['ETH Hönggerberg', 'Zürich ZH', DATA],
    ]],
  ])('answers "%s" with the places a rider would choose', async (query, rows) => {
    const fetchMock = stubRecordedAnswer(query);

    const response = await GET(request(query));
    const results = await response.json() as { title: string; subtitle: string; covered: boolean }[];

    expect(asked(fetchMock, GEOADMIN_HOST)).toHaveLength(1);
    expect(response.headers.get('x-geocoding-data-source')).toBe('swisstopo geo.admin.ch, Photon, OpenStreetMap');
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
