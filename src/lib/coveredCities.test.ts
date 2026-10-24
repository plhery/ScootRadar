import { readdirSync, readFileSync } from 'node:fs';
import { COUNTRY_CODES } from '@/generated/countries';
import { SWISS_PROVIDER_KEYS } from '@/generated/providers';
import { describe, expect, it } from 'vitest';
import {
  COVERED_CITIES, COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL, COVERED_PROVIDER_TOTAL, isPointCovered, nearestCoveredCities,
} from '@/lib/coveredCities';
import { SWISS_SCOOTER_AREAS } from '@/lib/feedCoverage';
import { boundsContainPoint } from '@/lib/geo';
import { providersForViewport } from '@/lib/mapCoverage';
import {
  REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, regionalCityId, regionalSource, serviceAreas,
} from '@/lib/regionalScooterSystems';

const PARADEPLATZ: [number, number] = [47.369, 8.539];
const LUNGERN: [number, number] = [46.7741, 8.1558];
const LAUSANNE: [number, number] = [46.5197, 6.6323];

function viewportAround([lat, lng]: [number, number]) {
  return { south: lat - 0.001, west: lng - 0.001, north: lat + 0.001, east: lng + 0.001 };
}

describe('covered cities', () => {
  it('lists the Swiss areas, then every regional city once', () => {
    expect(COVERED_CITIES).toHaveLength(SWISS_SCOOTER_AREAS.length + REGIONAL_SCOOTER_CITIES.length);
    expect(new Set(COVERED_CITIES.map(city => city.id)).size).toBe(COVERED_CITIES.length);
    expect(COVERED_CITIES.slice(0, SWISS_SCOOTER_AREAS.length).every(city => city.country === 'CH')).toBe(true);
    // Every country of data/countries.json has cities, and no city is elsewhere.
    expect(new Set(COVERED_CITIES.map(city => city.country))).toEqual(new Set(COUNTRY_CODES));
    expect(COUNTRY_CODES).toEqual(expect.arrayContaining(['CH', 'FR', 'DE', 'IT', 'BE', 'NO', 'GB', 'PT', 'ES', 'IS', 'SE', 'LV', 'PL', 'HU', 'GR', 'CY', 'FI', 'HR', 'UA']));
    expect(COVERED_CITIES).toEqual(expect.arrayContaining([
      {
        id: 'ch:zurich',
        city: 'Zürich',
        country: 'CH',
        center: [47.3769, 8.5417],
        bounds: { south: 47.27, west: 8.34, north: 47.49, east: 8.73 },
      },
      expect.objectContaining({ id: 'fr:Lyon', city: 'Lyon', country: 'FR', center: [45.7578, 4.832] }),
      expect.objectContaining({ id: 'de:München', city: 'München', country: 'DE' }),
      expect.objectContaining({ id: 'it:Roma', city: 'Roma', country: 'IT' }),
    ]));
  });

  it('gives a city with several operators one entry enclosing all of them', () => {
    const bordeaux = COVERED_CITIES.filter(city => city.city === 'Bordeaux');

    expect(bordeaux).toHaveLength(1);
    // Dott reaches further south, north and east than Pony, Pony further west.
    expect(bordeaux[0].bounds).toEqual({ south: 44.7393, west: -0.7866, north: 44.9989, east: -0.3947 });
  });

  it('keeps every city centre inside its own bounds and inside coverage', () => {
    for (const city of COVERED_CITIES) {
      expect(boundsContainPoint(city.bounds, ...city.center), city.id).toBe(true);
      expect(isPointCovered(...city.center), city.id).toBe(true);
    }
  });

  it.each<[place: string, point: [number, number], covered: boolean]>([
    ['Zürich Paradeplatz', PARADEPLATZ, true],
    ['Marseille', [43.2965, 5.3698], true],
    ['Berlin', [52.52, 13.405], true],
    ['Roma', [41.9028, 12.4964], true],
    ['Lungern', LUNGERN, false],
    ['Lausanne', LAUSANNE, false],
    ['Paris', [48.8566, 2.3522], false],
    // Washington's boxes stop at the Potomac (docs/american-scooter-feeds.md); Alexandria has GCOO's own.
    ['the White House', [38.8977, -77.0365], true],
    ['Hains Point, Washington', [38.8558, -77.0213], true],
    ['Old Town Alexandria, Virginia', [38.8048, -77.0469], true],
    ['the Alexandria waterfront', [38.8046, -77.0395], true],
    ['National Harbor, Maryland', [38.7826, -77.017], false],
    ['the Atlantic', [0, -30], false],
  ])('knows whether %s has scooter data', (_place, point, covered) => {
    expect(isPointCovered(...point)).toBe(covered);
    // "No data" in search must agree with what the map offers once you get there.
    expect(providersForViewport(viewportAround(point)).length > 0).toBe(covered);
  });

  it('follows operator envelopes rather than the merged city box', () => {
    // North-east corner of the Freiburg box: north of Zeus's area and east of Yoio's.
    const corner: [number, number] = [48.06, 7.925];
    const freiburg = COVERED_CITIES.find(city => city.id === 'de:Freiburg im Breisgau')!;

    expect(boundsContainPoint(freiburg.bounds, ...corner)).toBe(true);
    expect(isPointCovered(...corner)).toBe(false);
    expect(providersForViewport(viewportAround(corner))).toEqual([]);
  });
});

describe('nearest covered cities', () => {
  it('returns the closest cities first with their distance in metres', () => {
    const nearest = nearestCoveredCities(LUNGERN, 3);

    expect(nearest.map(city => [city.city, city.country])).toEqual([['Bern', 'CH'], ['Wädenswil', 'CH'], ['Zürich', 'CH']]);
    expect(nearest[0]).toEqual({
      id: 'ch:bern',
      city: 'Bern',
      country: 'CH',
      center: [46.948, 7.4474],
      bounds: { south: 46.82, west: 7.2, north: 47.08, east: 7.7 },
      distanceM: expect.closeTo(57_227, 0),
    });
    expect(Math.round(nearest[1].distanceM / 1000)).toBe(64);
  });

  it('crosses borders and starts with the city you are in', () => {
    expect(nearestCoveredCities(LAUSANNE, 6).map(city => city.city))
      .toEqual(['Bern', 'Biel/Bienne', 'Tignes', 'Basel', 'Lyon', 'Grenoble']);
    expect(nearestCoveredCities([47.3769, 8.5417], 1)).toEqual([
      expect.objectContaining({ city: 'Zürich', distanceM: 0 }),
    ]);
  });

  it('never returns more than asked for, or more than there are', () => {
    expect(nearestCoveredCities(LUNGERN, 0)).toEqual([]);
    expect(nearestCoveredCities(LUNGERN, -2)).toEqual([]);
    const all = nearestCoveredCities(LUNGERN, 10_000);
    expect(all).toHaveLength(COVERED_CITIES.length);
    expect(all.every((city, index) => index === 0 || all[index - 1].distanceM <= city.distanceM)).toBe(true);
  });
});

describe('the count of covered cities and countries', () => {
  // Read from the catalogs themselves, so a catalog the app does not read, or a
  // town it drops, changes one count and not the other.
  function fromCatalogs() {
    const cities = new Set<string>(JSON.parse(readFileSync('data/swiss-scooter-areas.json', 'utf8')).map(({ id }: { id: string }) => id));
    const countries = new Set(['CH']);
    // A catalog data/countries.json does not list counts as a country of its own.
    const listed = new Map((JSON.parse(readFileSync('data/countries.json', 'utf8')).countries as { code: string; catalog?: string }[])
      .map(({ code, catalog }) => [catalog, code]));
    for (const file of readdirSync('data').filter(name => name.endsWith('-scooter-feeds.json'))) {
      for (const system of JSON.parse(readFileSync(`data/${file}`, 'utf8')).systems) {
        const country: string = listed.get(`data/${file}`) ?? `unlisted ${file}`;
        countries.add(country);
        for (const { city, region = system.region } of system.areas ?? [system]) {
          cities.add([country, region, city].filter(Boolean).map((part, index, parts) =>
            index < parts.length - 1 ? part.toLowerCase() : part).join(':'));
        }
      }
    }
    return { cities: cities.size, countries: countries.size };
  }

  it('counts every Swiss area and every town of the catalogs once, and their countries', () => {
    expect({ cities: COVERED_CITY_TOTAL, countries: COVERED_COUNTRY_TOTAL }).toEqual(fromCatalogs());
    expect(COVERED_CITY_TOTAL).toBe(COVERED_CITIES.length);
    expect(COVERED_COUNTRY_TOTAL).toBe(new Set(COVERED_CITIES.map(city => city.country)).size);
  });

  it('counts the providers of the catalogs by the name riders see', () => {
    // Bolt's Hopp in Washington is named Hopp, as the Icelandic Hopp is: one name, counted once.
    const providers = new Map<string, string>((JSON.parse(readFileSync('data/providers.json', 'utf8')) as { key: string; name: string }[])
      .map(({ key, name }) => [key, name]));
    const names = new Set(SWISS_PROVIDER_KEYS.map(key => providers.get(key)));
    for (const file of readdirSync('data').filter(name => name.endsWith('-scooter-feeds.json'))) {
      for (const { provider } of JSON.parse(readFileSync(`data/${file}`, 'utf8')).systems) names.add(providers.get(provider));
    }
    expect(names).not.toContain(undefined);
    expect(COVERED_PROVIDER_TOTAL).toBe(names.size);
  });

  it('counts each town of a feed shared by several, and a town with several operators once', () => {
    // Dott runs one feed for Wołomin, Kobyłka and Radzymin; Voi and Bolt both run Reutlingen and Tübingen.
    for (const id of ['pl:Wołomin', 'pl:Kobyłka', 'pl:Radzymin', 'de:Reutlingen', 'de:Tübingen', 'fr:Bordeaux']) {
      expect(COVERED_CITIES.filter(city => city.id === id), id).toHaveLength(1);
    }
  });
});

describe('iOS city catalogue', () => {
  // scripts/generate-provider-catalog.mjs repeats the merge in plain JavaScript;
  // the iOS app must offer exactly the cities the web app does.
  it('is generated with the same cities, in the same order', () => {
    const swift = readFileSync('ios/ScootRadar/Models/ProviderCatalog.generated.swift', 'utf8');
    const text = '("(?:[^"\\\\]|\\\\.)*")';
    const number = '(-?[\\d.]+)';
    const pattern = new RegExp(
      `ScooterCity\\(id: ${text}, name: ${text}, countryCode: ${text}, ` +
      `center: GeoPoint\\(latitude: ${number}, longitude: ${number}\\), ` +
      `bounds: GeoBounds\\(south: ${number}, west: ${number}, north: ${number}, east: ${number}\\)` +
      // A town with a winter pause, Ottawa's, lists it after its bounds, then a town of the
      // catalogs its feeds.
      `(?:, pauses: \\[[^\\]]*\\])?(?:, feeds: \\[[^\\]]*\\])?\\)`,
      'g'
    );
    const cities = [...swift.matchAll(pattern)].map(([, id, name, country, lat, lng, south, west, north, east]) => ({
      id: JSON.parse(id),
      city: JSON.parse(name),
      country: JSON.parse(country),
      center: [Number(lat), Number(lng)],
      bounds: { south: Number(south), west: Number(west), north: Number(north), east: Number(east) },
    }));

    expect(cities).toEqual(COVERED_CITIES);
  });

  // The app tells a town whose operators have all closed its season as closedForSeason does
  // in seasonalPauses.ts: from each feed with a service area there, and that area's pause.
  it('is generated with the feeds of each town, and their pauses', () => {
    const swift = readFileSync('ios/ScootRadar/Models/ProviderCatalog.generated.swift', 'utf8');
    const feed = /ScooterCityFeed\(id: "([^"]+)"(?:, pause: ScooterSeasonalPause\(from: "([^"]+)", until: "([^"]+)", timeZone: "([^"]+)"\))?\)/g;
    const generated = new Map([...swift.matchAll(/ScooterCity\(id: ("(?:[^"\\]|\\.)*")[^\n]*?, feeds: \[([^\]]*)\]\)/g)]
      .map(([, id, feeds]) => [JSON.parse(id) as string, [...feeds.matchAll(feed)]
        .map(([, feedId, from, until, timeZone]) => (from ? { id: feedId, pause: { from, until, timeZone } } : { id: feedId }))]));
    type Feed = { id: string; pause?: { from: string; until: string; timeZone: string } };
    const same = (a: Feed, b: Feed) => a.id === b.id && a.pause?.from === b.pause?.from
      && a.pause?.until === b.pause?.until && a.pause?.timeZone === b.pause?.timeZone;
    const expected = new Map<string, Feed[]>();
    for (const system of REGIONAL_SCOOTER_SYSTEMS) {
      for (const area of serviceAreas(system)) {
        const id = regionalCityId(system, area);
        const pause = area.seasonal ?? system.seasonal;
        const entry: Feed = { id: `${regionalSource(system)}:${system.id}`,
          ...(pause ? { pause: { from: pause.from, until: pause.until, timeZone: pause.timeZone } } : {}) };
        const feeds = expected.get(id) ?? [];
        if (!feeds.some(other => same(other, entry))) expected.set(id, [...feeds, entry]);
      }
    }

    expect(generated).toEqual(expected);
    // Jet runs in Almaty besides Whoosh.
    expect(generated.get('kz:Almaty')).toEqual([{ id: 'kazakhstan:jet_kz_almaty' }, { id: 'kazakhstan:whoosh_kz_ala' }]);
  });

  it('is generated with the same count of cities and countries', () => {
    const swift = readFileSync('ios/ScootRadar/Models/ProviderCatalog.generated.swift', 'utf8');
    expect(swift).toContain(`static let cityCount = ${COVERED_CITY_TOTAL}\n`);
    expect(swift).toContain(`static let countryCount = ${COVERED_COUNTRY_TOTAL}\n`);
  });
});
