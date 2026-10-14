// The countries of data/countries.json, expanded for the web (src/generated/countries.ts and
// countryCatalogs.ts) and for iOS (ScooterCountryCatalog in ProviderCatalog.generated.swift) by
// scripts/generate-provider-catalog.mjs. Pure functions of the data, so tests can feed them fixtures.

// The languages the apps are shown in, as GEOCODE_LANGUAGES in src/app/api/geocode/cities.ts.
export const LANGUAGES = ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'];
export const CONTINENTS = ['europe', 'north-america'];
// The feed sources that are not a country's catalog.
const OTHER_SOURCES = ['national', 'hopp', 'publibike'];

const lower = country => country.code.toLowerCase();

// A state or province: "OR", "ON", or ISO 3166-2's "CMX" for Mexico City.
const REGION_CODE = /^[A-Z]{2,3}$/;

/**
 * The regions of a country that has them, by code. A country lists them when two of its towns
 * share a name, as Portland, Oregon and Portland, Maine do: every service area of its catalog
 * then names its region, and its cities' ids include it.
 */
function regionsOf(country) {
  if (country.regions === undefined) return null;
  const { list, showInCityNames } = country.regions;
  if (!Array.isArray(list) || !list.length || typeof showInCityNames !== 'boolean') {
    throw new Error(`${country.code}: regions need a list and showInCityNames`);
  }
  const regions = new Map();
  for (const region of list) {
    if (!REGION_CODE.test(region.code) || regions.has(region.code) || !region.name) {
      throw new Error(`${country.code}: region ${region.code} needs an unrepeated code of two or three capitals and a name`);
    }
    regions.set(region.code, region);
  }
  return regions;
}

/** Every catalog's systems, in the order of data/countries.json, each with its country. */
export function catalogSystems(countries, readCatalog) {
  return countries.filter(country => country.catalog).flatMap(country => {
    const regions = regionsOf(country);
    return readCatalog(country.catalog).systems.map(system => {
      if (system.country !== undefined && system.country !== country.code) {
        throw new Error(`${country.catalog}: ${system.id} is in ${system.country}, not ${country.code}`);
      }
      for (const area of system.areas ?? [system]) {
        const region = areaRegion(system, area);
        if (regions ? !regions.has(region) : region !== undefined) {
          throw new Error(`${country.catalog}: ${system.id} in ${area.city} ${regions
            ? `needs one of ${country.code}'s regions, not ${region}` : `has a region, and ${country.code} has none`}`);
        }
      }
      return { ...system, country: country.code };
    });
  });
}

/** A service area's state or province: its own, or its system's. */
export const areaRegion = (system, area) => area.region ?? system.region;

/** The id of a town: "no:Oslo", or "us:or:Portland" where the country has regions. */
export function cityId(country, region, city) {
  return region ? `${country.toLowerCase()}:${region.toLowerCase()}:${city}` : `${country.toLowerCase()}:${city}`;
}

/**
 * The Swiss areas, then REGIONAL_SCOOTER_CITIES as src/lib/regionalScooterSystems.ts merges
 * them: one entry per city, its bounds enclosing every operator's envelope, its name saying its
 * region where the country's names do: "Portland, OR".
 */
export function scooterCities(swissAreas, systems, countries) {
  const cities = new Map(swissAreas.map(area => [area.id, {
    id: area.id, name: area.city, country: 'CH', center: area.center, bounds: area.bounds,
  }]));
  const namedWithRegion = new Set(countries.filter(country => country.regions?.showInCityNames).map(country => country.code));
  for (const system of systems) {
    for (const area of system.areas ?? [system]) {
      const region = areaRegion(system, area);
      const id = cityId(system.country, region, area.city);
      const previous = cities.get(id);
      cities.set(id, {
        id,
        name: region && namedWithRegion.has(system.country) ? `${area.city}, ${region}` : area.city,
        ...(region ? { region } : {}),
        country: system.country,
        center: previous?.center ?? area.center,
        bounds: previous ? {
          south: Math.min(previous.bounds.south, area.bounds.south),
          west: Math.min(previous.bounds.west, area.bounds.west),
          north: Math.max(previous.bounds.north, area.bounds.north),
          east: Math.max(previous.bounds.east, area.bounds.east),
        } : area.bounds,
      });
    }
  }
  return [...cities.values()];
}

// The widest a city may be, in km. Wider, a merged envelope is most likely two towns of one name
// in different regions, which the catalog should tell apart with a region. In Europe the widest
// is Perpignan, 57 km.
export const MAX_CITY_KM = 150;
// The cities that may be wider, by id, each with the reason. None so far.
export const WIDE_CITIES = {};

/** How wide a city's bounds are, in km, north to south or east to west, whichever is more. */
export function cityKm({ south, west, north, east }) {
  const kmPerDegree = 111.195;
  const middle = (south + north) / 2 * Math.PI / 180;
  return Math.max((north - south) * kmPerDegree, (east - west) * kmPerDegree * Math.cos(middle));
}

export function validateCityWidths(cities, wideCities = WIDE_CITIES) {
  const wide = cities.filter(city => !wideCities[city.id] && cityKm(city.bounds) > MAX_CITY_KM);
  if (wide.length) {
    throw new Error(`Cities wider than ${MAX_CITY_KM} km: ${wide.map(city => `${city.id} (${Math.round(cityKm(city.bounds))} km)`)
      .join(', ')}. Tell apart two towns of one name with their region, or list a city in WIDE_CITIES saying why.`);
  }
  const needless = Object.keys(wideCities).filter(id => !cities.some(city => city.id === id && cityKm(city.bounds) > MAX_CITY_KM));
  if (needless.length) throw new Error(`WIDE_CITIES lists cities that are not wider than ${MAX_CITY_KM} km: ${needless.join(', ')}`);
}

export function validateCountries({ countries, landingFirst }, readCatalog, cities, wideCities = WIDE_CITIES) {
  const codes = new Set();
  const sources = new Set(OTHER_SOURCES);
  for (const country of countries) {
    const { code } = country;
    if (!/^[A-Z]{2}$/.test(code) || codes.has(code)) throw new Error(`Invalid or repeated country code: ${code}`);
    codes.add(code);
    if (!CONTINENTS.includes(country.continent)) throw new Error(`${code}: continent is one of ${CONTINENTS.join(', ')}`);
    // Switzerland's cities are its open data's areas, data/swiss-scooter-areas.json; every other
    // country has a catalog of its own, data/<adjective>-scooter-feeds.json, and a source in meta.sources.
    if (code === 'CH' ? country.catalog || country.source : !country.catalog || !country.source) {
      throw new Error(`${code}: every country but CH needs a catalog and a source`);
    }
    if (country.catalog && !/^data\/[a-z-]+-scooter-feeds\.json$/.test(country.catalog)) {
      throw new Error(`${code}: catalog is data/<adjective>-scooter-feeds.json`);
    }
    if (country.catalog && !readCatalog(country.catalog).systems?.length) throw new Error(`${country.catalog} lists no system`);
    if (country.source !== undefined && (!/^[a-z]+$/.test(country.source) || sources.has(country.source))) {
      throw new Error(`${code}: invalid or repeated source ${country.source}`);
    }
    sources.add(country.source);
    if (!LANGUAGES.every(language => typeof country.names?.[language] === 'string' && country.names[language])) {
      throw new Error(`${code}: names needs ${LANGUAGES.join(', ')}`);
    }
    if (!country.searchWords?.length || country.searchWords.some(word => !/^[a-z0-9α-ωа-яёєіїґ]+$/.test(word))) {
      throw new Error(`${code}: searchWords are lower case words without accents`);
    }
    if (code === 'CH' && country.regions) throw new Error('CH: Switzerland\'s areas have no regions');
    regionsOf(country);
    if (country.anchor?.length !== 2 || !country.anchor.every(Number.isFinite)) throw new Error(`${code}: invalid anchor`);
    const credits = country.credits ?? {};
    if (!credits.attribution || (credits.gbfs ?? []).some(name => typeof name !== 'string' || !name) ||
      (credits.links ?? []).some(link => !link.label || !link.href?.startsWith('https://'))) {
      throw new Error(`${code}: credits need an attribution, and their links a label and an https address`);
    }
  }
  if (!landingFirst.every(code => codes.has(code))) throw new Error('landingFirst names a country that is not listed');
  // The credits are listed by their label, on the web and on iOS.
  const labels = countryCreditLinks(countries).map(link => link.label);
  if (new Set(labels).size !== labels.length) throw new Error('Two credits of data/countries.json share a label');
  const cityIds = new Set(cities.map(city => city.id));
  for (const country of countries) {
    const missing = (country.featuredCities ?? []).filter(id => !cityIds.has(id) || !id.startsWith(`${lower(country)}:`));
    if (missing.length) throw new Error(`${country.code}: featured cities not in its catalog: ${missing.join(', ')}`);
  }
  validateCityWidths(cities, wideCities);
}

/**
 * One line per continent for the GBFS feeds credited together, "DE/IT/…/UA: Dott, Bolt, …",
 * then each country's own links, in the order of data/countries.json.
 */
export function countryCreditLinks(countries) {
  const lines = CONTINENTS.flatMap(continent => {
    const crediting = countries.filter(country => country.continent === continent && country.credits?.gbfs?.length);
    if (!crediting.length) return [];
    const names = [...new Set(crediting.flatMap(country => country.credits.gbfs))];
    return [{ label: `${crediting.map(country => country.credits.code ?? country.code).join('/')}: ${names.join(', ')}`,
      href: 'https://github.com/MobilityData/gbfs' }];
  });
  return [...lines, ...countries.flatMap(country => country.credits?.links ?? [])];
}

// A note as comment lines of at most 100 characters.
function comment(note, indent) {
  if (!note) return '';
  const lines = [];
  let line = '';
  for (const word of note.split(' ')) {
    if (line && indent.length + 3 + line.length + word.length > 100) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  lines.push(line);
  return lines.map(text => `${indent}// ${text}\n`).join('');
}

const list = values => JSON.stringify(values).replace(/","/g, '", "');

export function typescriptCountries({ countries, landingFirst }) {
  const catalogs = countries.filter(country => country.catalog);
  const record = value => `{\n${countries.map(country => `  ${country.code}: ${value(country)},`).join('\n')}\n}`;
  const order = [...landingFirst, ...countries.map(country => country.code).filter(code => !landingFirst.includes(code))];
  return `// Generated by scripts/generate-provider-catalog.mjs from data/countries.json. Do not edit directly.
// The catalogs themselves are in countryCatalogs.ts, so that the pages that need only the
// countries' names or credits don't load every city.

/** Every country with scooter data, in the order of data/countries.json. */
export const COUNTRY_CODES = ${list(countries.map(country => country.code))} as const;
export type CountryCode = typeof COUNTRY_CODES[number];

/** The countries with a catalog of their own, data/<adjective>-scooter-feeds.json: all but Switzerland. */
export type CatalogCountry = ${catalogs.map(country => `'${country.code}'`).join(' | ')};

export type CountryNameLanguage = ${LANGUAGES.map(language => `'${language}'`).join(' | ')};

export type Continent = ${CONTINENTS.map(continent => `'${continent}'`).join(' | ')};

/** Where each catalog country's feeds are reported in meta.sources. */
export const COUNTRY_SOURCES = {
${catalogs.map(country => `  ${country.code}: '${country.source}',`).join('\n')}
} as const;

export const COUNTRY_CONTINENTS: Record<CountryCode, Continent> = ${record(country => `'${country.continent}'`)};

/** A table rather than Intl.DisplayNames, whose locale data is not a given on the server. */
export const COUNTRY_NAMES: Record<CountryCode, Readonly<Record<CountryNameLanguage, string>>> = ${record(country =>
    `{ ${LANGUAGES.map(language => `${language}: ${JSON.stringify(country.names[language])}`).join(', ')} }`)};

/** Typed beside a city to say which one is meant: "Lindau Deutschland". */
export const COUNTRY_SEARCH_WORDS: Record<CountryCode, readonly string[]> = ${record(country => list(country.searchWords))};

/** Where a country's total stands, zoomed out: inland and about the middle of the country. */
export const COUNTRY_ANCHORS: Record<CountryCode, readonly [number, number]> = {
${countries.map(country => `${comment(country.anchorNote, '  ')}  ${country.code}: [${country.anchor.join(', ')}],`).join('\n')}
};

/** A state or province of a country that has them. */
export interface CountryRegion { code: string; name: string }

/**
 * The states or provinces of the countries that list them. Their code is part of a city's id,
 * "us:or:Portland", and, where showInCityNames, of its name: "Portland, OR".
 */
export const COUNTRY_REGIONS: Partial<Record<CountryCode, { showInCityNames: boolean; list: readonly CountryRegion[] }>> = {${
  countries.filter(country => country.regions).map(country => `\n  ${country.code}: { showInCityNames: ${country.regions.showInCityNames}, list: [\n${
    country.regions.list.map(region => `    { code: ${JSON.stringify(region.code)}, name: ${JSON.stringify(region.name)} },\n`).join('')}  ] },`).join('')}${
  countries.some(country => country.regions) ? '\n' : ''}};

/** The cities the landing page names, by their id in the catalogue. */
export const FEATURED_CITIES: Record<CountryCode, readonly string[]> = ${record(country => list(country.featuredCities ?? []))};

/** The order of the countries on the landing page. */
export const LANDING_COUNTRY_ORDER: readonly CountryCode[] = ${list(order)};

/** Whose data the map shows, country by country, for the X-Mobility-Data-Source header. */
export const COUNTRY_DATA_ATTRIBUTION = ${JSON.stringify(countries.map(country => country.credits.attribution).join('; '))};

/** The countries' own credits, after Switzerland's and France's: their GBFS feeds, then their licences. */
export const COUNTRY_CREDIT_LINKS: readonly { label: string; href: string }[] = [
${countryCreditLinks(countries).map(link => `  { label: ${JSON.stringify(link.label)}, href: ${JSON.stringify(link.href)} },`).join('\n')}
];
`;
}

export function typescriptCatalogs(countries) {
  const catalogs = countries.filter(country => country.catalog);
  const name = country => `${country.catalog.match(/^data\/([a-z-]+)-scooter-feeds\.json$/)[1]
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Catalog`;
  return `// Generated by scripts/generate-provider-catalog.mjs from data/countries.json. Do not edit directly.

${catalogs.map(country => `import ${name(country)} from '../../${country.catalog}';`).join('\n')}

/** Every catalog's systems, each with its country, in the order of data/countries.json. */
export const CATALOG_SYSTEMS = [
${catalogs.map(country => `  ...${name(country)}.systems.map(system => ({ ...system, country: '${country.code}' as const })),`).join('\n')}
];
`;
}

export function swiftCountries(countries) {
  return `
/// The countries of data/countries.json, as src/generated/countries.ts has them on the web.
enum ScooterCountryCatalog {
    /// Where a country's total stands, zoomed out: inland and about the middle of the country.
    static let anchors: [String: (latitude: Double, longitude: Double)] = [
${countries.map(country => `${comment(country.anchorNote, '        ')}        "${lower(country)}": (${country.anchor.join(', ')}),`).join('\n')}
    ]

    /// The countries' own credits, after Switzerland's and France's: their GBFS feeds, then their licences.
    static let credits: [(title: String, url: String)] = [
${countryCreditLinks(countries).map(link => `        (${JSON.stringify(link.label)}, ${JSON.stringify(link.href)}),`).join('\n')}
    ]
}
`;
}
