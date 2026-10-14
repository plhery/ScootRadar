import { describe, expect, it, vi } from 'vitest';

// A country with states, as data/countries.json would list the United States, and a catalog
// with two towns of one name: Portland, Oregon and Portland, Maine. The generated modules are
// what scripts/generate-provider-catalog.mjs would write for them.
const fixture = vi.hoisted(() => {
  const portlandMaine = { city: 'Portland', region: 'ME', center: [43.66, -70.26] as [number, number],
    bounds: { south: 43.62, west: -70.33, north: 43.72, east: -70.2 } };
  return {
    systems: [
      { id: 'lime_portland', provider: 'lime', country: 'US' as const, city: 'Portland', region: 'OR', center: [45.52, -122.68] as [number, number],
        bounds: { south: 45.43, west: -122.84, north: 45.65, east: -122.47 }, aliases: ['PDX'],
        discoveryUrl: 'https://data.lime.bike/api/partners/v2/gbfs/portland/gbfs.json' },
      { id: 'lime_maine', provider: 'lime', country: 'US' as const, ...portlandMaine,
        areas: [portlandMaine, { city: 'South Portland', region: 'ME', center: [43.63, -70.29] as [number, number],
          bounds: { south: 43.6, west: -70.36, north: 43.65, east: -70.22 } }],
        discoveryUrl: 'https://data.lime.bike/api/partners/v2/gbfs/maine/gbfs.json' },
    ],
    regions: { US: { showInCityNames: true, list: [{ code: 'ME', name: 'Maine' }, { code: 'OR', name: 'Oregon' }] } },
    names: { en: 'United States', de: 'USA', fr: 'États-Unis', it: 'Stati Uniti', nl: 'Verenigde Staten', nb: 'USA',
      pt: 'Estados Unidos', es: 'Estados Unidos', is: 'Bandaríkin' },
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
    COUNTRY_CODES: [...original.COUNTRY_CODES, 'US'],
    COUNTRY_SOURCES: { ...original.COUNTRY_SOURCES, US: 'unitedstates' },
    COUNTRY_CONTINENTS: { ...original.COUNTRY_CONTINENTS, US: 'north-america' },
    COUNTRY_NAMES: { ...original.COUNTRY_NAMES, US: fixture.names },
    COUNTRY_SEARCH_WORDS: { ...original.COUNTRY_SEARCH_WORDS, US: ['usa'] },
    COUNTRY_ANCHORS: { ...original.COUNTRY_ANCHORS, US: [39.8, -98.6] },
    COUNTRY_REGIONS: fixture.regions,
  };
});

const { COVERED_CITIES, isPointCovered } = await import('@/lib/coveredCities');
const { REGIONAL_SCOOTER_CITIES, mergeCities, searchRegionalScooterCities } = await import('@/lib/regionalScooterSystems');
type RegionalScooterSystem = import('@/lib/regionalScooterSystems').RegionalScooterSystem;
const { groupCityTotals } = await import('@/lib/clustering');

describe('the towns of a country with states', () => {
  it('are told apart by their state, in their id and in their name', () => {
    expect(COVERED_CITIES.filter(city => city.country === ('US' as string)).map(({ id, city }) => ({ id, city }))).toEqual([
      { id: 'us:or:Portland', city: 'Portland, OR' },
      { id: 'us:me:Portland', city: 'Portland, ME' },
      { id: 'us:me:South Portland', city: 'South Portland, ME' },
    ]);
    // Each keeps its own bounds rather than one box across the continent.
    const maine = COVERED_CITIES.find(city => city.id === 'us:me:Portland')!;
    expect(maine.bounds).toEqual({ south: 43.62, west: -70.33, north: 43.72, east: -70.2 });
    expect(isPointCovered(45.52, -122.68)).toBe(true);
    expect(isPointCovered(41.88, -87.63)).toBe(false);
    // The town's own name stays one it is found by, besides its aliases.
    expect(REGIONAL_SCOOTER_CITIES.find(city => city.id === 'us:or:Portland')).toMatchObject({ region: 'OR', aliases: ['PDX', 'Portland'] });
  });

  it('are both offered when a rider types the shared name', () => {
    expect(searchRegionalScooterCities('Portland').map(city => city.display_name))
      .toEqual(['Portland, ME, United States', 'Portland, OR, United States', 'South Portland, ME, United States']);
  });

  it('keep the state out of the name where the country does', () => {
    // The fixture's country is not one of data/countries.json, so the types do not know it.
    const cities = mergeCities(fixture.systems as unknown as RegionalScooterSystem[],
      { US: { ...fixture.regions.US, showInCityNames: false } } as never);
    expect(cities.map(({ id, city, aliases }) => ({ id, city, aliases }))).toEqual([
      { id: 'us:or:Portland', city: 'Portland', aliases: ['PDX'] },
      { id: 'us:me:Portland', city: 'Portland', aliases: [] },
      { id: 'us:me:South Portland', city: 'South Portland', aliases: [] },
    ]);
  });

  it('are counted in their country when zoomed out', () => {
    const total = (id: string, lat: number, lng: number, count: number) => ({ id: `city:${id}`, lat, lng, count, providers: { lime: count } });
    expect(groupCityTotals([total('us:or:Portland', 45.52, -122.68, 900), total('us:me:Portland', 43.66, -70.26, 100),
      total('fr:Lyon', 45.76, 4.84, 500)], 3).map(({ id, count }) => ({ id, count })))
      .toEqual([{ id: 'country:us', count: 1000 }, { id: 'country:fr', count: 500 }]);
  });
});
