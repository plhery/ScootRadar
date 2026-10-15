// The countries of data/countries.json, expanded for the web (src/generated/countries.ts and
// countryCatalogs.ts) and for iOS (ScooterCountryCatalog in ProviderCatalog.generated.swift) by
// scripts/generate-provider-catalog.mjs. Pure functions of the data, so tests can feed them fixtures.
import { readFileSync } from 'node:fs';

// The languages the apps are shown in, as GEOCODE_LANGUAGES in src/app/api/geocode/cities.ts.
export const LANGUAGES = ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'];
// The Middle East is Asia's. South America comes with its first country.
export const CONTINENTS = ['europe', 'north-america', 'asia', 'oceania'];
// The feed sources that are not a country's catalog.
const OTHER_SOURCES = ['national', 'hopp', 'publibike'];

const lower = country => country.code.toLowerCase();

// A state or province: "OR", "ON", or ISO 3166-2's "CMX" for Mexico City.
const REGION_CODE = /^[A-Z]{2,3}$/;

const isPoint = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite);

/**
 * The regions of a country that has them, by code. A country lists them when two of its towns
 * share a name, as Portland, Oregon and Portland, Maine do: every service area of its catalog
 * then names its region, and its cities' ids include it. Where `totals`, zoomed out, the country
 * shows one total per region, at the region's anchor, rather than one for the whole country.
 */
function regionsOf(country) {
  if (country.regions === undefined) return null;
  const { list, showInCityNames, totals } = country.regions;
  if (!Array.isArray(list) || !list.length || typeof showInCityNames !== 'boolean' || typeof totals !== 'boolean') {
    throw new Error(`${country.code}: regions need a list, showInCityNames and totals`);
  }
  const regions = new Map();
  for (const region of list) {
    if (!REGION_CODE.test(region.code) || regions.has(region.code) || !region.name) {
      throw new Error(`${country.code}: region ${region.code} needs an unrepeated code of two or three capitals and a name`);
    }
    // Its name where a language of the apps writes it otherwise: "Colombie-Britannique".
    if (Object.entries(region.names ?? {}).some(([language, name]) => !LANGUAGES.includes(language) || typeof name !== 'string' || !name)) {
      throw new Error(`${country.code}: region ${region.code} has names in ${LANGUAGES.join(', ')} only`);
    }
    if (totals ? !isPoint(region.anchor) : region.anchor !== undefined) {
      throw new Error(`${country.code}: region ${region.code} needs an anchor${totals ? '' : ' only where the country has totals'}`);
    }
    regions.set(region.code, region);
  }
  return regions;
}

// A local date, "MM-DD", of a year of 365 days.
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const isMonthDay = date => /^\d\d-\d\d$/.test(date ?? '')
  && Number(date.slice(3)) >= 1 && Number(date.slice(3)) <= (DAYS_IN_MONTH[Number(date.slice(0, 2)) - 1] ?? 0);
function isTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone });
    return typeof timeZone === 'string';
  } catch {
    return false;
  }
}

/**
 * Why a seasonal pause is not one, or null. A pause is the part of the year a service area has
 * no scooters, as Montréal each winter: from its first day without them until the first day
 * they are back, local dates in its time zone (src/lib/seasonalPauses.ts).
 */
export function seasonalProblem(pause) {
  const keys = Object.keys(pause ?? {}).sort().join(',');
  if (keys !== 'from,timeZone,until') return 'needs from, until and timeZone, and nothing else';
  if (!isMonthDay(pause.from) || !isMonthDay(pause.until) || pause.from === pause.until) {
    return 'needs from and until as two different dates, "MM-DD"';
  }
  return isTimeZone(pause.timeZone) ? null : `has no time zone ${pause.timeZone}`;
}

/** A service area's seasonal pause: its own, or its system's. */
export const areaSeasonal = (system, area) => area.seasonal ?? system.seasonal;

/** A service area's time zone: its own, or its system's. */
export const areaTimeZone = (system, area) => area.timeZone ?? system.timeZone;

/**
 * The zones of src/generated/timeZones.ts, every one of IANA's zone.tab, each with its country,
 * and the older names that stand for them: US/Eastern, Canada/Eastern, Asia/Tel_Aviv.
 */
export function timeZoneTable(source) {
  const zones = new Map([...source.matchAll(/^ {2}'([^']+)': \{ country: '([A-Z]{2})'/gm)].map(([, name, country]) => [name, country]));
  const aliases = new Map([...source.matchAll(/^ {2}'([^']+)': '([^']+)',$/gm)].map(([, alias, zone]) => [alias, zone]));
  return { zones, aliases };
}
const TIME_ZONES = timeZoneTable(readFileSync(new URL('../src/generated/timeZones.ts', import.meta.url), 'utf8'));

/**
 * Why a service area's time zone is not its town's, or null. Feeds give theirs under older names
 * (US/Eastern, Canada/Pacific, Asia/Tel_Aviv), or wrongly: Veo says America/Chicago for every
 * town, Flamingo Etc/UTC. The app reads none of them; a town's zone is the catalog's, by its
 * canonical name.
 */
export function timeZoneProblem(timeZone, country, table = TIME_ZONES) {
  if (typeof timeZone !== 'string' || !timeZone) return 'needs its time zone, timeZone';
  if (table.aliases.has(timeZone)) return `has ${timeZone}, an older name of ${table.aliases.get(timeZone)}: write that`;
  const zoneCountry = table.zones.get(timeZone);
  if (!zoneCountry) return `has no time zone ${timeZone}`;
  return zoneCountry === country ? null : `has ${timeZone}, a time zone of ${zoneCountry}`;
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
        const pause = areaSeasonal(system, area);
        const problem = pause === undefined ? null : seasonalProblem(pause);
        if (problem) throw new Error(`${country.catalog}: the seasonal pause of ${system.id} in ${area.city} ${problem}`);
        // Every town outside Europe says its time zone, which its seasonal pause and night bans keep:
        // a country there may have several, as Australia, whose Brisbane keeps no summer time.
        const timeZone = areaTimeZone(system, area);
        const zoneProblem = country.continent !== 'europe' || timeZone !== undefined
          ? timeZoneProblem(timeZone, country.code) : null;
        if (zoneProblem) throw new Error(`${country.catalog}: ${system.id} in ${area.city} ${zoneProblem}`);
        if (pause && timeZone && pause.timeZone !== timeZone) {
          throw new Error(`${country.catalog}: the seasonal pause of ${system.id} in ${area.city} is in ${pause.timeZone}, the town in ${timeZone}`);
        }
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

/**
 * Why a night ban's time zone is not that of the towns it covers, or null: a ban is read by its
 * own zone, which must be the one the catalog gives the service areas around its middle.
 */
export function curfewZoneProblem(curfew, systems) {
  const points = curfew.areas.flat();
  const [lat, lng] = [0, 1].map(axis => points.reduce((sum, point) => sum + point[axis], 0) / points.length);
  const zones = new Set(systems.flatMap(system => (system.areas ?? [system])
    .filter(({ bounds }) => lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east)
    .map(area => areaTimeZone(system, area)).filter(Boolean)));
  return zones.size && !zones.has(curfew.timeZone)
    ? `The night ban of ${curfew.city} is in ${curfew.timeZone}, and the towns around it in ${[...zones].join(', ')}` : null;
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
      // As mergeCities: each pause once, and none where one area has scooters all year.
      const pause = areaSeasonal(system, area);
      const pauses = pause && (!previous || previous.pauses)
        ? [...previous?.pauses ?? [], pause].filter((entry, index, all) => all.findIndex(other =>
          other.from === entry.from && other.until === entry.until && other.timeZone === entry.timeZone) === index)
        : undefined;
      cities.set(id, {
        id,
        name: region && namedWithRegion.has(system.country) ? `${area.city}, ${region}` : area.city,
        ...(region ? { region } : {}),
        ...(pauses ? { pauses } : {}),
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

/** The pauses argument of a city's ScooterCity in Swift, after its bounds; none for most. */
export function swiftCityPauses(city) {
  if (!city.pauses) return '';
  const pauses = city.pauses.map(pause => `ScooterSeasonalPause(from: ${JSON.stringify(pause.from)}, ` +
    `until: ${JSON.stringify(pause.until)}, timeZone: ${JSON.stringify(pause.timeZone)})`);
  return `, pauses: [${pauses.join(', ')}]`;
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
    // Where ride prices are given before sales tax, as in the US and Canada; elsewhere they include it.
    if (country.pricesBeforeTax !== undefined && country.pricesBeforeTax !== true) {
      throw new Error(`${code}: pricesBeforeTax is true, or left out where prices include tax`);
    }
    if (!LANGUAGES.every(language => typeof country.names?.[language] === 'string' && country.names[language])) {
      throw new Error(`${code}: names needs ${LANGUAGES.join(', ')}`);
    }
    // As the search reads them (src/lib/searchText.ts, which searchText.test.ts holds every country's to):
    // "new zealand", "ελλαδα", "ישראל", "الامارات".
    if (!country.searchWords?.length || country.searchWords.some(word => !/^[\p{Ll}\p{Lo}\p{N}]+(?: [\p{Ll}\p{Lo}\p{N}]+)*$/u.test(word) ||
      /(?![\u3099\u309a])\p{Mn}/u.test(word.normalize('NFKD')))) {
      throw new Error(`${code}: searchWords are lower case words without accents, one space between two`);
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

/**
 * The countries whose ride prices are given before sales tax, which the rider pays on top, as in
 * the US and Canada: there a pricing plan's is_taxable shows the price "+ tax". Everywhere else
 * consumer prices include VAT or GST, whatever is_taxable says.
 */
export const PRICES_BEFORE_TAX: ReadonlySet<string> = new Set<CountryCode>(${list(countries.filter(country => country.pricesBeforeTax).map(country => country.code))});

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
export interface CountryRegion {
  code: string;
  name: string;
  /** Its name where a language of the apps writes it otherwise. */
  names?: Partial<Record<CountryNameLanguage, string>>;
  /** Where its total stands, zoomed out, where the country's totals are its regions'. */
  anchor?: readonly [number, number];
}

/**
 * The states or provinces of the countries that list them. Their code is part of a city's id,
 * "us:or:Portland", and, where showInCityNames, of its name: "Portland, OR". Where totals,
 * zoomed out, the country shows one total per region rather than one for the whole country.
 */
export const COUNTRY_REGIONS: Partial<Record<CountryCode, {
  showInCityNames: boolean; totals: boolean; list: readonly CountryRegion[];
}>> = {${countries.filter(country => country.regions).map(({ code, regions }) => `
  ${code}: { showInCityNames: ${regions.showInCityNames}, totals: ${regions.totals}, list: [
${regions.list.map(region => `${comment(region.anchorNote, '    ')}    { code: ${JSON.stringify(region.code)}, name: ${JSON.stringify(region.name)}${
    region.names ? `, names: { ${Object.entries(region.names).map(([language, name]) => `${language}: ${JSON.stringify(name)}`).join(', ')} }` : ''}${
    region.anchor ? `, anchor: [${region.anchor.join(', ')}]` : ''} },\n`).join('')}  ] },`).join('')}${
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

function swiftRegionTotals(countries) {
  const totals = countries.filter(country => country.regions?.totals);
  if (!totals.length) return ':';
  return `\n${totals.map(country => `        "${lower(country)}": [\n${country.regions.list.map(region =>
    `${comment(region.anchorNote, '            ')}            "${region.code.toLowerCase()}": ScooterRegion(name: ${JSON.stringify(region.name)}, ${
      region.names ? `names: [${Object.entries(region.names).map(([language, name]) => `"${language}": ${JSON.stringify(name)}`).join(', ')}], ` : ''
    }latitude: ${region.anchor[0]}, longitude: ${region.anchor[1]}),\n`).join('')}        ],\n`).join('')}    `;
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

    /// The countries whose totals, zoomed out, are their states' or provinces', and those by code.
    static let regionTotals: [String: [String: ScooterRegion]] = [${swiftRegionTotals(countries)}]
}

/// A state or province whose total stands apart, zoomed out.
struct ScooterRegion: Equatable, Sendable {
    let name: String
    /// Its name where a language of the app writes it otherwise: "Colombie-Britannique".
    var names: [String: String] = [:]
    let latitude: Double
    let longitude: Double
}
`;
}
