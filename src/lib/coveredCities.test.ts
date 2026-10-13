import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  COVERED_CITIES, COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL, isPointCovered, nearestCoveredCities,
} from '@/lib/coveredCities';
import { SWISS_SCOOTER_AREAS } from '@/lib/feedCoverage';
import { boundsContainPoint } from '@/lib/geo';
import { providersForViewport } from '@/lib/mapCoverage';
import { REGIONAL_SCOOTER_CITIES } from '@/lib/regionalScooterSystems';

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
    expect(new Set(COVERED_CITIES.map(city => city.country))).toEqual(new Set(['CH', 'FR', 'DE', 'IT', 'BE', 'NO', 'GB', 'PT', 'ES', 'IS', 'SE', 'LV', 'PL', 'HU', 'GR', 'CY', 'FI', 'HR']));
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
    // Dott reaches further north and east than Pony.
    expect(bordeaux[0].bounds).toEqual({ south: 44.66, west: -0.86, north: 45.07, east: -0.32 });
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

    expect(nearest.map(city => [city.city, city.country])).toEqual([['Zug', 'CH'], ['Bern', 'CH'], ['Wädenswil', 'CH']]);
    expect(nearest[0]).toEqual({
      id: 'ch:zug',
      city: 'Zug',
      country: 'CH',
      center: [47.1724, 8.5174],
      bounds: { south: 47.03, west: 8.32, north: 47.31, east: 8.74 },
      distanceM: expect.closeTo(52_098, 0),
    });
    expect(Math.round(nearest[1].distanceM / 1000)).toBe(57);
  });

  it('crosses borders and starts with the city you are in', () => {
    expect(nearestCoveredCities(LAUSANNE, 6).map(city => city.city))
      .toEqual(['Bulle', 'Nyon', 'Bern', 'Biel/Bienne', 'Grenchen', 'Tignes']);
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
    for (const file of readdirSync('data').filter(name => name.endsWith('-scooter-feeds.json'))) {
      // The French catalog alone has no country on its systems.
      for (const system of JSON.parse(readFileSync(`data/${file}`, 'utf8')).systems) {
        const country: string = system.country ?? 'FR';
        countries.add(country);
        for (const { city } of system.areas ?? [system]) cities.add(`${country.toLowerCase()}:${city}`);
      }
    }
    return { cities: cities.size, countries: countries.size };
  }

  it('counts every Swiss area and every town of the catalogs once, and their countries', () => {
    expect({ cities: COVERED_CITY_TOTAL, countries: COVERED_COUNTRY_TOTAL }).toEqual(fromCatalogs());
    expect(COVERED_CITY_TOTAL).toBe(COVERED_CITIES.length);
    expect(COVERED_COUNTRY_TOTAL).toBe(new Set(COVERED_CITIES.map(city => city.country)).size);
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
      `bounds: GeoBounds\\(south: ${number}, west: ${number}, north: ${number}, east: ${number}\\)\\)`,
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

  it('is generated with the same count of cities and countries', () => {
    const swift = readFileSync('ios/ScootRadar/Models/ProviderCatalog.generated.swift', 'utf8');
    expect(swift).toContain(`static let cityCount = ${COVERED_CITY_TOTAL}\n`);
    expect(swift).toContain(`static let countryCount = ${COVERED_COUNTRY_TOTAL}\n`);
  });
});
