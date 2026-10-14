import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  catalogSystems, cityKm, countryCreditLinks, scooterCities, swiftCountries, typescriptCatalogs, typescriptCountries,
  validateCityWidths, validateCountries,
} from './country-catalog.mjs';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const europe = readJson('data/countries.json');
const swissAreas = readJson('data/swiss-scooter-areas.json');

// Canada as a country agent would add it: one entry, one catalog.
const canada = {
  code: 'CA', continent: 'north-america', catalog: 'data/canadian-scooter-feeds.json', source: 'canada',
  names: { en: 'Canada', de: 'Kanada', fr: 'Canada', it: 'Canada', nl: 'Canada', nb: 'Canada', pt: 'Canadá', es: 'Canadá', is: 'Kanada' },
  searchWords: ['canada', 'kanada', 'canade'],
  anchor: [50, -85], anchorNote: 'In Ontario, between Toronto and Winnipeg.',
  featuredCities: ['ca:Toronto'],
  credits: { attribution: 'Canada: Bird, Neuron GBFS', gbfs: ['Bird', 'Neuron'],
    links: [{ label: 'CA: City of Toronto · OGL Toronto', href: 'https://open.toronto.ca/open-data-license/' }] },
};
const canadianCatalog = { systems: [{ id: 'bird_toronto', provider: 'bird', city: 'Toronto', center: [43.65, -79.38],
  bounds: { south: 43.58, west: -79.64, north: 43.86, east: -79.11 }, discoveryUrl: 'https://mds.bird.co/gbfs/v2/public/toronto/gbfs.json' }] };
// The United States, whose towns share names across states: one Portland in Oregon, one in Maine.
const unitedStates = {
  code: 'US', continent: 'north-america', catalog: 'data/american-scooter-feeds.json', source: 'unitedstates',
  names: { en: 'United States', de: 'USA', fr: 'États-Unis', it: 'Stati Uniti', nl: 'Verenigde Staten', nb: 'USA', pt: 'Estados Unidos',
    es: 'Estados Unidos', is: 'Bandaríkin' },
  searchWords: ['usa'],
  anchor: [39.8, -98.6],
  regions: { showInCityNames: true, list: [{ code: 'ME', name: 'Maine' }, { code: 'OR', name: 'Oregon' }] },
  featuredCities: ['us:or:Portland'],
  credits: { attribution: 'United States: Lime GBFS', gbfs: ['Lime'] },
};
const portlandOregon = { city: 'Portland', center: [45.52, -122.68], bounds: { south: 45.43, west: -122.84, north: 45.65, east: -122.47 } };
const portlandMaine = { city: 'Portland', center: [43.66, -70.26], bounds: { south: 43.62, west: -70.33, north: 43.72, east: -70.2 } };
const americanCatalog = { systems: [
  { id: 'lime_portland', provider: 'lime', region: 'OR', ...portlandOregon, discoveryUrl: 'https://data.lime.bike/api/partners/v2/gbfs/portland/gbfs.json' },
  // A feed shared by two towns of Maine, each area naming its state.
  { id: 'lime_maine', provider: 'lime', city: 'Portland', center: portlandMaine.center, bounds: portlandMaine.bounds,
    areas: [{ ...portlandMaine, region: 'ME' }, { city: 'South Portland', region: 'ME', center: [43.63, -70.29],
      bounds: { south: 43.6, west: -70.36, north: 43.65, east: -70.22 } }],
    discoveryUrl: 'https://data.lime.bike/api/partners/v2/gbfs/maine/gbfs.json' },
] };
const fixtures = { 'data/canadian-scooter-feeds.json': canadianCatalog, 'data/american-scooter-feeds.json': americanCatalog };
const read = path => fixtures[path] ?? readJson(path);

function generate(data, readCatalog = read) {
  const systems = catalogSystems(data.countries, readCatalog);
  const cities = scooterCities(swissAreas, systems, data.countries);
  validateCountries(data, readCatalog, cities);
  return { cities, typescript: typescriptCountries(data), catalogs: typescriptCatalogs(data.countries), swift: swiftCountries(data.countries) };
}

describe('the countries of data/countries.json', () => {
  it('turns one more entry and its catalog into a covered country on the web and on iOS', () => {
    const { typescript, catalogs, swift } = generate({ ...europe, countries: [...europe.countries, canada] });
    expect(typescript).toMatch(/export const COUNTRY_CODES = \[.*"UA", "CA"\] as const;/);
    expect(typescript).toMatch(/export type CatalogCountry = .*'UA' \| 'CA';/);
    expect(typescript).toContain("  CA: 'canada',\n} as const;");
    expect(typescript).toContain('  // In Ontario, between Toronto and Winnipeg.\n  CA: [50, -85],');
    expect(typescript).toContain('  CA: { en: "Canada", de: "Kanada", fr: "Canada"');
    expect(typescript).toMatch(/LANDING_COUNTRY_ORDER: readonly CountryCode\[\] = \["CH", "DE", "FR", "IT", .*"UA", "CA"\];/);
    expect(typescript).toMatch(/COUNTRY_DATA_ATTRIBUTION = ".*; Ukraine: 3electra GBFS; Canada: Bird, Neuron GBFS";/);
    expect(catalogs).toContain("import canadianCatalog from '../../data/canadian-scooter-feeds.json';");
    expect(catalogs).toContain("  ...canadianCatalog.systems.map(system => ({ ...system, country: 'CA' as const })),");
    expect(swift).toContain('        // In Ontario, between Toronto and Winnipeg.\n        "ca": (50, -85),');
    // North America's feeds are credited on a line of their own, after Europe's.
    expect(countryCreditLinks([...europe.countries, canada]).map(link => link.label)).toEqual([
      'DE/IT/BE/UK/PT/ES/IS/SE/LV/PL/HU/GR/CY/FI/HR/UA: Dott, Bolt, Hopp, Lime, Voi, Zeus, Yoio, Bird, Elerent, Hoppy, Ride Mobility, 3electra',
      'CA: Bird, Neuron',
      'MobiData BW', 'BE: Pony · transportdata.be', 'NO: Entur AS · NLOD', 'NO: Kartverket boundaries · CC BY 4.0',
      'UK: Beryl · CDLA-Permissive-2.0', 'UK: ONS boundaries · OGL v3.0', 'PT: DGT boundaries · CC BY 4.0',
      'UA: OpenStreetMap boundaries · ODbL', 'CA: City of Toronto · OGL Toronto',
    ]);
  });

  it('refuses an entry the apps could not show', () => {
    const withCanada = changes => ({ ...europe, countries: [...europe.countries, { ...canada, ...changes }] });
    expect(() => generate(withCanada({ names: { ...canada.names, is: undefined } }))).toThrow('CA: names needs en, de');
    expect(() => generate(withCanada({ source: 'uk' }))).toThrow('CA: invalid or repeated source uk');
    expect(() => generate(withCanada({ code: 'GB' }))).toThrow('Invalid or repeated country code: GB');
    expect(() => generate(withCanada({ continent: 'america' }))).toThrow('CA: continent is one of');
    expect(() => generate(withCanada({ catalog: undefined }))).toThrow('every country but CH needs a catalog');
    expect(() => generate(withCanada({ searchWords: ['Canadá'] }))).toThrow('lower case words without accents');
    expect(() => generate(withCanada({ featuredCities: ['ca:Montréal'] }))).toThrow('CA: featured cities not in its catalog: ca:Montréal');
    expect(() => generate(withCanada({ credits: { ...canada.credits,
      links: [{ label: 'MobiData BW', href: 'https://www.mobidata-bw.de/' }] } }))).toThrow('share a label');
  });

  it('tells apart two towns of one name by their state, in their id and in their name', () => {
    const { cities, typescript } = generate({ ...europe, countries: [...europe.countries, unitedStates] });
    const american = cities.filter(city => city.country === 'US');
    expect(american.map(({ id, name, region }) => ({ id, name, region }))).toEqual([
      { id: 'us:or:Portland', name: 'Portland, OR', region: 'OR' },
      { id: 'us:me:Portland', name: 'Portland, ME', region: 'ME' },
      { id: 'us:me:South Portland', name: 'South Portland, ME', region: 'ME' },
    ]);
    expect(Math.max(...american.map(city => cityKm(city.bounds)))).toBeLessThan(40);
    expect(typescript).toContain('export const COUNTRY_REGIONS: Partial<Record<CountryCode, { showInCityNames: boolean; ' +
      'list: readonly CountryRegion[] }>> = {\n  US: { showInCityNames: true, list: [\n    { code: "ME", name: "Maine" },\n' +
      '    { code: "OR", name: "Oregon" },\n  ] },\n};');
    // A country whose names leave the region out still has it in its ids.
    const quiet = { ...unitedStates, regions: { ...unitedStates.regions, showInCityNames: false } };
    expect(generate({ ...europe, countries: [...europe.countries, quiet] }).cities.filter(city => city.country === 'US')
      .map(city => [city.id, city.name])).toEqual([['us:or:Portland', 'Portland'], ['us:me:Portland', 'Portland'], ['us:me:South Portland', 'South Portland']]);
  });

  it('refuses a city wider than a town, as two towns of one name without their state would be', () => {
    const withoutRegion = place => ({ ...place, region: undefined });
    const withoutRegions = { systems: americanCatalog.systems.map(system => ({ ...withoutRegion(system),
      ...(system.areas ? { areas: system.areas.map(withoutRegion) } : {}) })) };
    const readWithout = path => path === unitedStates.catalog ? withoutRegions : read(path);
    const noRegions = { ...unitedStates, regions: undefined };
    expect(() => generate({ ...europe, countries: [...europe.countries, { ...noRegions, featuredCities: ['us:Portland'] }] }, readWithout))
      .toThrow(/Cities wider than 150 km: us:Portland \(4\d{3} km\)/);
    // Every area of a country with regions names one of them, and only such a country's areas do.
    expect(() => generate({ ...europe, countries: [...europe.countries, unitedStates] }, readWithout))
      .toThrow("american-scooter-feeds.json: lime_portland in Portland needs one of US's regions, not undefined");
    const inWashington = { systems: [{ ...americanCatalog.systems[0], region: 'WA' }] };
    expect(() => generate({ ...europe, countries: [...europe.countries, unitedStates] }, path => path === unitedStates.catalog ? inWashington : read(path)))
      .toThrow("needs one of US's regions, not WA");
    const regionalCanada = { systems: [{ ...canadianCatalog.systems[0], region: 'ON' }] };
    expect(() => generate({ ...europe, countries: [...europe.countries, canada] }, path => path === canada.catalog ? regionalCanada : read(path)))
      .toThrow('bird_toronto in Toronto has a region, and CA has none');
    expect(() => generate({ ...europe, countries: [...europe.countries,
      { ...unitedStates, regions: { showInCityNames: true, list: [{ code: 'Oregon', name: 'Oregon' }] } }] }))
      .toThrow('US: region Oregon needs an unrepeated code of two or three capitals and a name');
  });

  it('lets a listed city be wider, and only one that is', () => {
    const cities = [{ id: 'us:Portland', bounds: { south: 43.6, west: -122.84, north: 45.65, east: -70.2 } },
      { id: 'fr:Lyon', bounds: { south: 45.7, west: 4.77, north: 45.81, east: 4.93 } }];
    expect(() => validateCityWidths(cities, { 'us:Portland': 'A fixture.' })).not.toThrow();
    expect(() => validateCityWidths(cities, { 'us:Portland': 'A fixture.', 'fr:Lyon': 'Not wide.' }))
      .toThrow('WIDE_CITIES lists cities that are not wider than 150 km: fr:Lyon');
    expect(() => validateCityWidths(cities, {})).toThrow('us:Portland (4166 km)');
  });

  it('keeps each system in the country of its catalog', () => {
    const misplaced = { systems: [{ ...canadianCatalog.systems[0], country: 'US' }] };
    expect(() => catalogSystems([canada], () => misplaced)).toThrow('bird_toronto is in US, not CA');
  });
});
