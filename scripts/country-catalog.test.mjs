import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  catalogSystems, cityKm, countryCreditLinks, curfewZoneProblem, scooterCities, seasonalProblem, swiftCityPauses, swiftCountries,
  timeZoneProblem, typescriptCatalogs, typescriptCountries, validateCityWidths, validateCountries,
} from './country-catalog.mjs';

const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
const countries = readJson('data/countries.json');
// The fixtures below stand for North America's countries, the real ones aside.
const europe = { ...countries, countries: countries.countries.filter(country => country.continent === 'europe') };
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
  bounds: { south: 43.58, west: -79.64, north: 43.86, east: -79.11 }, timeZone: 'America/Toronto',
  discoveryUrl: 'https://mds.bird.co/gbfs/v2/public/toronto/gbfs.json' }] };
// The United States, whose towns share names across states: one Portland in Oregon, one in Maine.
const unitedStates = {
  code: 'US', continent: 'north-america', catalog: 'data/american-scooter-feeds.json', source: 'unitedstates',
  names: { en: 'United States', de: 'USA', fr: 'États-Unis', it: 'Stati Uniti', nl: 'Verenigde Staten', nb: 'USA', pt: 'Estados Unidos',
    es: 'Estados Unidos', is: 'Bandaríkin' },
  searchWords: ['usa'],
  anchor: [39.8, -98.6],
  regions: { showInCityNames: true, totals: false, list: [{ code: 'ME', name: 'Maine' }, { code: 'OR', name: 'Oregon' }] },
  featuredCities: ['us:or:Portland'],
  credits: { attribution: 'United States: Lime GBFS', gbfs: ['Lime'] },
};
const portlandOregon = { city: 'Portland', center: [45.52, -122.68], bounds: { south: 45.43, west: -122.84, north: 45.65, east: -122.47 } };
const portlandMaine = { city: 'Portland', center: [43.66, -70.26], bounds: { south: 43.62, west: -70.33, north: 43.72, east: -70.2 } };
const americanCatalog = { systems: [
  { id: 'lime_portland', provider: 'lime', region: 'OR', ...portlandOregon, timeZone: 'America/Los_Angeles',
    discoveryUrl: 'https://data.lime.bike/api/partners/v2/gbfs/portland/gbfs.json' },
  // A feed shared by two towns of Maine, each area naming its state.
  { id: 'lime_maine', provider: 'lime', city: 'Portland', center: portlandMaine.center, bounds: portlandMaine.bounds, timeZone: 'America/New_York',
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
    // Its towns' zone is Britain's, so the code is what is refused.
    const inLondon = path => path === canada.catalog ? { systems: [{ ...canadianCatalog.systems[0], timeZone: 'Europe/London' }] } : read(path);
    expect(() => generate(withCanada({ code: 'GB' }), inLondon)).toThrow('Invalid or repeated country code: GB');
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
    expect(typescript).toContain('}>> = {\n  US: { showInCityNames: true, totals: false, list: [\n    { code: "ME", name: "Maine" },\n' +
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
      { ...unitedStates, regions: { showInCityNames: true, totals: false, list: [{ code: 'Oregon', name: 'Oregon' }] } }] }))
      .toThrow('US: region Oregon needs an unrepeated code of two or three capitals and a name');
  });

  it('gives each state its total, zoomed out, where the country asks for it', () => {
    const withTotals = { ...unitedStates, regions: { showInCityNames: true, totals: true, list: [
      { code: 'ME', name: 'Maine', anchor: [45.3, -69.2] },
      { code: 'OR', name: 'Oregon', names: { fr: 'Orégon' }, anchor: [43.9, -120.6], anchorNote: 'East of the Cascades.' },
    ] } };
    const { typescript, swift } = generate({ ...europe, countries: [...europe.countries, withTotals] });
    expect(typescript).toContain('  US: { showInCityNames: true, totals: true, list: [\n' +
      '    { code: "ME", name: "Maine", anchor: [45.3, -69.2] },\n' +
      '    // East of the Cascades.\n    { code: "OR", name: "Oregon", names: { fr: "Orégon" }, anchor: [43.9, -120.6] },\n  ] },');
    expect(swift).toContain('    static let regionTotals: [String: [String: ScooterRegion]] = [\n        "us": [\n' +
      '            "me": ScooterRegion(name: "Maine", latitude: 45.3, longitude: -69.2),\n' +
      '            // East of the Cascades.\n' +
      '            "or": ScooterRegion(name: "Oregon", names: ["fr": "Orégon"], latitude: 43.9, longitude: -120.6),\n        ],\n    ]');
    // A country without state totals, as Mexico, has none on iOS, where only totals need its regions.
    expect(generate({ ...europe, countries: [...europe.countries, unitedStates] }).swift)
      .toContain('static let regionTotals: [String: [String: ScooterRegion]] = [:]');

    const withRegions = regions => ({ ...europe, countries: [...europe.countries, { ...unitedStates, regions }] });
    expect(() => generate(withRegions({ ...withTotals.regions, list: [{ code: 'ME', name: 'Maine' }, withTotals.regions.list[1]] })))
      .toThrow('US: region ME needs an anchor');
    expect(() => generate(withRegions({ ...withTotals.regions, totals: false })))
      .toThrow('US: region ME needs an anchor only where the country has totals');
    expect(() => generate(withRegions({ ...withTotals.regions, list: [withTotals.regions.list[0],
      { ...withTotals.regions.list[1], names: { fr_CA: 'Orégon' } }] }))).toThrow('US: region OR has names in en, de');
    expect(() => generate(withRegions({ showInCityNames: true, list: withTotals.regions.list })))
      .toThrow('US: regions need a list, showInCityNames and totals');
  });

  it('lets a listed city be wider, and only one that is', () => {
    const cities = [{ id: 'us:Portland', bounds: { south: 43.6, west: -122.84, north: 45.65, east: -70.2 } },
      { id: 'fr:Lyon', bounds: { south: 45.7, west: 4.77, north: 45.81, east: 4.93 } }];
    expect(() => validateCityWidths(cities, { 'us:Portland': 'A fixture.' })).not.toThrow();
    expect(() => validateCityWidths(cities, { 'us:Portland': 'A fixture.', 'fr:Lyon': 'Not wide.' }))
      .toThrow('WIDE_CITIES lists cities that are not wider than 150 km: fr:Lyon');
    expect(() => validateCityWidths(cities, {})).toThrow('us:Portland (4166 km)');
  });

  it('keeps the seasonal pauses of a city\'s areas for iOS, and refuses one that is not a window of dates', () => {
    const winter = { from: '11-16', until: '04-15', timeZone: 'America/Toronto' };
    const early = { from: '12-01', until: '04-01', timeZone: 'America/Toronto' };
    const toronto = canadianCatalog.systems[0];
    const paused = { systems: [{ ...toronto, seasonal: winter },
      { ...toronto, id: 'lime_toronto', provider: 'lime', areas: [{ ...toronto, seasonal: early }, { ...toronto, city: 'Mississauga' }] },
      { ...toronto, id: 'neuron_toronto', provider: 'neuron', seasonal: winter }] };
    const { cities } = generate({ ...europe, countries: [...europe.countries, canada] }, path => path === canada.catalog ? paused : read(path));
    const city = id => cities.find(entry => entry.id === id);
    // Each pause once; none where an area has scooters all year.
    expect(city('ca:Toronto').pauses).toEqual([winter, early]);
    expect(city('ca:Mississauga')).not.toHaveProperty('pauses');
    expect(swiftCityPauses(city('ca:Toronto'))).toBe(', pauses: [ScooterSeasonalPause(from: "11-16", until: "04-15", ' +
      'timeZone: "America/Toronto"), ScooterSeasonalPause(from: "12-01", until: "04-01", timeZone: "America/Toronto")]');
    expect(swiftCityPauses(city('ca:Mississauga'))).toBe('');

    expect(seasonalProblem(winter)).toBeNull();
    expect(seasonalProblem({ ...winter, until: '02-29' })).toMatch('two different dates');
    expect(seasonalProblem({ ...winter, until: '11-16' })).toMatch('two different dates');
    expect(seasonalProblem({ ...winter, from: '4-15' })).toMatch('two different dates');
    expect(seasonalProblem({ from: '11-16', until: '04-15' })).toMatch('needs from, until and timeZone');
    expect(seasonalProblem({ ...winter, months: 5 })).toMatch('nothing else');
    expect(seasonalProblem({ ...winter, timeZone: 'America/Montreal_' })).toBe('has no time zone America/Montreal_');
    const wrong = { systems: [{ ...toronto, areas: [{ ...toronto, seasonal: { ...winter, until: '13-01' } }] }] };
    expect(() => catalogSystems([canada], () => wrong)).toThrow(
      'data/canadian-scooter-feeds.json: the seasonal pause of bird_toronto in Toronto needs from and until as two different dates, "MM-DD"');
  });

  it('gives each North American town its time zone, by its name today, whatever its feed says', () => {
    const toronto = canadianCatalog.systems[0];
    const withZone = timeZone => ({ systems: [{ ...toronto, timeZone }] });
    expect(() => catalogSystems([canada], () => withZone(undefined))).toThrow('bird_toronto in Toronto needs its time zone, timeZone');
    // Bird's and Lime's feeds give older names; some, as Canada/Pacific for a town of Alberta, are not even the town's.
    expect(() => catalogSystems([canada], () => withZone('Canada/Eastern')))
      .toThrow('bird_toronto in Toronto has Canada/Eastern, an older name of America/Toronto: write that');
    expect(() => catalogSystems([unitedStates], () => ({ systems: [{ ...americanCatalog.systems[0], timeZone: 'US/Pacific' }] })))
      .toThrow('lime_portland in Portland has US/Pacific, an older name of America/Los_Angeles: write that');
    // Veo gives America/Chicago for its towns of every zone, and a zone of Canada is not one of the US.
    expect(() => catalogSystems([canada], () => withZone('America/New_York'))).toThrow('has America/New_York, a time zone of US');
    expect(() => catalogSystems([canada], () => withZone('America/Toronto_'))).toThrow('has no time zone America/Toronto_');
    // An area keeps its system's zone, or gives its own.
    const twoZones = { systems: [{ ...toronto, areas: [{ ...toronto }, { ...toronto, city: 'Winnipeg', timeZone: 'America/Winnipeg' }] }] };
    expect(() => catalogSystems([canada], () => twoZones)).not.toThrow();
    // A seasonal pause is counted in its town's zone.
    const paused = { systems: [{ ...toronto, seasonal: { from: '11-16', until: '04-15', timeZone: 'America/Winnipeg' } }] };
    expect(() => catalogSystems([canada], () => paused))
      .toThrow('the seasonal pause of bird_toronto in Toronto is in America/Winnipeg, the town in America/Toronto');
    // Europe's towns need none, and the one they give is checked all the same.
    expect(timeZoneProblem(undefined, 'CH')).toBe('needs its time zone, timeZone');
    expect(timeZoneProblem('Europe/Zurich', 'CH')).toBeNull();
    expect(timeZoneProblem('Europe/Berlin', 'CH')).toBe('has Europe/Berlin, a time zone of DE');
  });

  it('refuses a night ban counted in another zone than its town\'s', () => {
    const curfew = { city: 'Toronto', timeZone: 'America/Toronto', areas: [[[43.6, -79.4], [43.7, -79.4], [43.7, -79.3]]] };
    expect(curfewZoneProblem(curfew, canadianCatalog.systems)).toBeNull();
    expect(curfewZoneProblem({ ...curfew, timeZone: 'America/Chicago' }, canadianCatalog.systems))
      .toBe('The night ban of Toronto is in America/Chicago, and the towns around it in America/Toronto');
    // Away from every town, there is none to compare with.
    expect(curfewZoneProblem({ ...curfew, timeZone: 'America/Chicago', areas: [[[10, 10], [10.1, 10], [10, 10.1]]] }, canadianCatalog.systems)).toBeNull();
  });

  it('keeps each system in the country of its catalog', () => {
    const misplaced = { systems: [{ ...canadianCatalog.systems[0], country: 'US' }] };
    expect(() => catalogSystems([canada], () => misplaced)).toThrow('bird_toronto is in US, not CA');
  });
});
