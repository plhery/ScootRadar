import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  catalogSystems, countryCreditLinks, scooterCities, swiftCountries, typescriptCatalogs, typescriptCountries,
  validateCountries,
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
const fixtures = { 'data/canadian-scooter-feeds.json': canadianCatalog };
const read = path => fixtures[path] ?? readJson(path);

function generate(data) {
  const systems = catalogSystems(data.countries, read);
  validateCountries(data, read, scooterCities(swissAreas, systems));
  return { typescript: typescriptCountries(data), catalogs: typescriptCatalogs(data.countries), swift: swiftCountries(data.countries) };
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

  it('keeps each system in the country of its catalog', () => {
    const misplaced = { systems: [{ ...canadianCatalog.systems[0], country: 'US' }] };
    expect(() => catalogSystems([canada], () => misplaced)).toThrow('bird_toronto is in US, not CA');
  });
});
