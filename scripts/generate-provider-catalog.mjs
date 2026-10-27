import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { transform } from 'esbuild';
import {
  binbinAreasProblem, catalogSystems, coverageAreas, curfewZoneProblem, kotlinCountries, scooterCities, swiftCityFeeds, swiftCityPauses, swiftCountries,
  townOutlinesProblem,
  typescriptCatalogs, typescriptCountries, validateCountries,
} from './country-catalog.mjs';

const root = process.cwd();
const sourcePath = resolve(root, 'data/providers.json');
const typescriptPath = resolve(root, 'src/generated/providers.ts');
const swiftPath = resolve(root, 'ios/ScootRadar/Models/ProviderCatalog.generated.swift');
// The Android app's build runs this with --android=<directory> (android/core/build.gradle.kts): it then
// checks the catalog as ever but writes only the Android app's files, into its build directory, so
// they are never stale and the website's checks never see them.
const androidDirectory = process.argv.find(argument => argument.startsWith('--android='))?.slice('--android='.length);
const checkOnly = process.argv.includes('--check');

const readJson = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));
// A catalog's Lime market is one entry there, and a system for each of its refresh groups
// everywhere else, as src/lib/regionalScooterSystems.ts reads it.
const { code: limeGrid } = await transform(readFileSync(resolve(root, 'src/lib/limeGrid.ts'), 'utf8'), { loader: 'ts', format: 'esm' });
const { limeGridGroups } = await import(`data:text/javascript;base64,${Buffer.from(limeGrid).toString('base64')}`);
const readCatalog = path => {
  const catalog = readJson(path);
  return { ...catalog, systems: catalog.systems.flatMap(limeGridGroups) };
};
const providers = JSON.parse(readFileSync(sourcePath, 'utf8'));
const swissAreas = readJson('data/swiss-scooter-areas.json');
const countriesPath = resolve(root, 'src/generated/countries.ts');
const catalogsPath = resolve(root, 'src/generated/countryCatalogs.ts');
const { landingFirst, countries } = readJson('data/countries.json');
// Every catalog's systems, in the order of data/countries.json, each with its country.
const regionalSystems = catalogSystems(countries, readCatalog);
const curfews = readJson('data/rental-curfews.json').curfews;
const ruleZones = readJson('data/rule-zones.json').zones;

function validateCatalog() {
  if (!Array.isArray(providers) || providers.length === 0) {
    throw new Error('Provider catalog must contain at least one provider');
  }

  const keys = new Set();
  for (const provider of providers) {
    if (!/^[a-z][a-z0-9_]*$/.test(provider.key)) {
      throw new Error(`Invalid provider key: ${provider.key}`);
    }
    if (keys.has(provider.key)) throw new Error(`Duplicate provider key: ${provider.key}`);
    keys.add(provider.key);
    if (!provider.name || !provider.initial || !/^#[0-9a-f]{6}$/i.test(provider.color)) {
      throw new Error(`Invalid display metadata for provider: ${provider.key}`);
    }
    if (provider.switzerland !== undefined && provider.switzerland !== true) {
      throw new Error(`Provider ${provider.key}: switzerland is true or left out`);
    }
    const matchers = provider.systemIds ?? {};
    if (!(matchers.exact?.length || matchers.prefixes?.length)) {
      throw new Error(`Provider ${provider.key} needs a system ID matcher`);
    }
    // The operator's app, for scooters whose feed gives no link: a universal link the app claims,
    // whose page sends a phone without the app to its store, and the app's App Store id. Spin's is
    // the exception: no Spin host is claimed, so its link is its site, whose page links both stores,
    // and the iPhone opens its App Store page (the user's choice, 23 October 2026). BinBin's app
    // claims all of binbin.tech on Android, and on the iPhone only paths below its root, as /scooter:
    // there its link opens the App Store page too.
    if (provider.app !== undefined && !(
      /^https:\/\/[a-z0-9.-]+\/$/.test(provider.app.link) && Number.isInteger(provider.app.appStoreId) && provider.app.appStoreId > 0
    )) {
      throw new Error(`Provider ${provider.key}: app needs an https link to a site's root and an App Store id`);
    }
  }
}

// The languages the apps are shown in, as GEOCODE_LANGUAGES in src/app/api/geocode/cities.ts.
// Longest prefixes first, so that "hoppy_be_kortrijk" is Hoppy's and not Hopp's.
const longestPrefix = provider => Math.max(0, ...(provider.systemIds?.prefixes ?? []).map(prefix => prefix.length));
const matcherOrder = [...providers].sort((a, b) => longestPrefix(b) - longestPrefix(a));

function typescriptCatalog() {
  const entries = providers.map(provider => (
    `  ${provider.key}: { name: ${JSON.stringify(provider.name)}, color: ${JSON.stringify(provider.color)}, initial: ${JSON.stringify(provider.initial)}`
    + `${provider.app ? `, app: { link: ${JSON.stringify(provider.app.link)}, appStoreId: ${provider.app.appStoreId} }` : ''} },`
  )).join('\n');
  const matchers = matcherOrder.map(provider => (
    `  ${provider.key}: ${JSON.stringify(provider.systemIds ?? {})},`
  )).join('\n');

  return `// Generated by scripts/generate-provider-catalog.mjs. Do not edit directly.

export interface ProviderConfig {
  name: string;
  color: string;
  initial: string;
  /** The operator's app, for scooters whose feed gives no link: a universal link the app claims, whose page sends a phone without the app to its store. Spin's site is the one link no app claims. */
  app?: { link: string; appStoreId: number };
}

const PROVIDER_DEFINITIONS = {
${entries}
} as const;

export type ProviderKey = keyof typeof PROVIDER_DEFINITIONS;

export const PROVIDERS: Record<string, ProviderConfig> = PROVIDER_DEFINITIONS;

export const PROVIDER_KEYS = Object.keys(PROVIDER_DEFINITIONS) as ProviderKey[];

/** The providers the Swiss open data names; the others run scooters only abroad. */
export const SWISS_PROVIDER_KEYS: readonly ProviderKey[] = ${JSON.stringify(providers.filter(provider => provider.switzerland).map(provider => provider.key))};

const SYSTEM_ID_MATCHERS: Record<ProviderKey, { exact?: string[]; prefixes?: string[] }> = {
${matchers}
};

export function providerKeyForSystemId(systemId: string): ProviderKey | null {
  const normalized = systemId.toLowerCase();
  for (const provider of Object.keys(SYSTEM_ID_MATCHERS) as ProviderKey[]) {
    const matcher = SYSTEM_ID_MATCHERS[provider];
    if (matcher.exact?.includes(normalized)) return provider;
    if (matcher.prefixes?.some(prefix => normalized.startsWith(prefix))) return provider;
  }
  return null;
}
`;
}

function swiftColor(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ].map(component => (component / 255).toFixed(6));
}

function swiftCatalog() {
  const cases = providers.map(provider => `    case ${provider.key}`).join('\n');
  const matchers = matcherOrder.map(provider => (
    `        (.${provider.key}, ${JSON.stringify(provider.systemIds?.exact ?? [])}, ${JSON.stringify(provider.systemIds?.prefixes ?? [])}),`
  )).join('\n');
  const names = providers.map(provider => (
    `        case .${provider.key}: ${JSON.stringify(provider.name)}`
  )).join('\n');
  const initials = providers.map(provider => (
    `        case .${provider.key}: ${JSON.stringify(provider.initial)}`
  )).join('\n');
  const apps = providers.filter(provider => provider.app).map(provider => (
    `        case .${provider.key}: OperatorApp(link: URL(string: ${JSON.stringify(provider.app.link)})!, `
    + `appStore: URL(string: "https://apps.apple.com/app/id${provider.app.appStoreId}")!)`
  )).join('\n');
  const colors = providers.map(provider => {
    const [red, green, blue] = swiftColor(provider.color);
    return `        case .${provider.key}: UIColor(red: ${red}, green: ${green}, blue: ${blue}, alpha: 1)`;
  }).join('\n');

  return `// Generated by scripts/generate-provider-catalog.mjs. Do not edit directly.

import SwiftUI
import UIKit

enum ScooterProvider: String, CaseIterable, Identifiable, Sendable {
${cases}

    var id: String { rawValue }

    var name: String {
        switch self {
${names}
        }
    }

    var shortName: String {
        switch self {
${initials}
        }
    }

    /// The operator's app, for scooters whose feed gives no link: a universal link the app claims
    /// and its App Store page. Spin's site is the one link no app claims, so its App Store page opens.
    struct OperatorApp: Equatable, Sendable {
        let link: URL
        let appStore: URL
    }

    var app: OperatorApp? {
        switch self {
${apps}
        default: nil
        }
    }

    var color: Color { Color(uiColor: uiColor) }

    var uiColor: UIColor {
        switch self {
${colors}
        }
    }

    private static let systemIDMatchers: [(provider: ScooterProvider, exact: [String], prefixes: [String])] = [
${matchers}
    ]

    /// The provider behind a feed or system ID such as "lime_zurich", like providerKeyForSystemId on the web.
    static func provider(forSystemID systemID: String) -> ScooterProvider? {
        let normalized = systemID.lowercased()
        return systemIDMatchers.first { matcher in
            matcher.exact.contains(normalized) || matcher.prefixes.contains { normalized.hasPrefix($0) }
        }?.provider
    }
}
`;
}

function writeOrCheck(path, expected) {
  if (checkOnly) {
    let actual = '';
    try {
      actual = readFileSync(path, 'utf8');
    } catch {}
    if (actual !== expected) {
      console.error(`${path} is out of date. Run npm run generate:providers.`);
      process.exitCode = 1;
    }
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, expected);
}

const swiftBounds = b => `GeoBounds(south: ${b.south}, west: ${b.west}, north: ${b.north}, east: ${b.east})`;

function swiftCoverage() {
  return `
enum ScooterProviderCoverage {
    private static let swissAreas: [GeoBounds] = [
${swissAreas.map(area => `        ${swiftBounds(area.bounds)},`).join('\n')}
    ]
    private static let regionalSystems: [(ScooterProvider, GeoBounds)] = makeRegionalSystems()

    // A statement an area, as ScooterCityCatalog's cities: one literal of them all is costly to type-check.
    private static func makeRegionalSystems() -> [(ScooterProvider, GeoBounds)] {
        var systems: [(ScooterProvider, GeoBounds)] = []
${coverageAreas(regionalSystems).map(area => `        systems.append((.${area.provider}, ${swiftBounds(area.bounds)}))`).join('\n')}
        return systems
    }

    /// The providers the Swiss open data names; the others run scooters only abroad.
    static let swissProviders: [ScooterProvider] = [${providers.filter(provider => provider.switzerland).map(provider => `.${provider.key}`).join(', ')}]

    static func providers(in viewport: GeoBounds) -> [ScooterProvider] {
        var available = Set<ScooterProvider>()
        if swissAreas.contains(where: { $0.intersects(viewport) }) {
            available.formUnion(swissProviders)
        }
        for (provider, bounds) in regionalSystems where bounds.intersects(viewport) {
            available.insert(provider)
        }
        return ScooterProvider.allCases.filter { available.contains($0) }
    }

    static func contains(latitude: Double, longitude: Double) -> Bool {
        swissAreas.contains { $0.contains(latitude: latitude, longitude: longitude) } ||
            regionalSystems.contains { $0.1.contains(latitude: latitude, longitude: longitude) }
    }
}
`;
}

function swiftCities() {
  const covered = scooterCities(swissAreas, regionalSystems, countries);
  const cities = covered.map(city => {
    if (!countries.some(country => country.code === city.country) || !city.center.every(Number.isFinite)) {
      throw new Error(`Invalid covered city: ${city.id}`);
    }
    return `        cities.append(ScooterCity(id: ${JSON.stringify(city.id)}, name: ${JSON.stringify(city.name)}, countryCode: ${JSON.stringify(city.country)}, ` +
      `center: GeoPoint(latitude: ${city.center[0]}, longitude: ${city.center[1]}), bounds: ${swiftBounds(city.bounds)}${swiftCityPauses(city)}${swiftCityFeeds(city)}))`;
  }).join('\n');

  return `
struct ScooterCity: Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    /// CH, FR, DE, IT, BE, NO or GB.
    let countryCode: String
    let center: GeoPoint
    let bounds: GeoBounds
    /// The seasonal pauses of its service areas when every one has one, like pauses on the web.
    var pauses: [ScooterSeasonalPause] = []
    /// The feeds of its service areas, each with the area's pause: it is off season once their
    /// operators have all closed its season or are in their pause, as closedForSeason on the web.
    var feeds: [ScooterCityFeed] = []
}

/// A feed with a service area in a city, by the id meta.seasonOver names it with.
struct ScooterCityFeed: Equatable, Sendable {
    /// "kazakhstan:whoosh_kz_nqz": the country's source, then the system's id.
    let id: String
    /// The seasonal pause of its service area there, if it has one.
    var pause: ScooterSeasonalPause? = nil
}

struct ScooterCityDistance: Identifiable, Equatable, Sendable {
    let city: ScooterCity
    let distanceMeters: Double

    var id: String { city.id }
}

/// Every city with scooter data, one entry per city, like COVERED_CITIES on the web.
enum ScooterCityCatalog {
    static let cities: [ScooterCity] = makeCities()

    // A statement a city: as one array literal, the cities with their feeds took Swift's type
    // checker over 30 GB, and CI's Macs, which have 7, killed the compiler (24 Oct 2026).
    private static func makeCities() -> [ScooterCity] {
        var cities: [ScooterCity] = []
        cities.reserveCapacity(${covered.length})
${cities}
        return cities
    }

    /// How many cities the app covers, and in how many countries, for the card outside coverage:
    /// the entries above and their countries, as COVERED_CITY_TOTAL and COVERED_COUNTRY_TOTAL count them on the web.
    static let cityCount = ${covered.length}
    static let countryCount = ${new Set(covered.map(city => city.country)).size}

    /// Cities by distance from the point to their centre, nearest first.
    static func nearest(to point: GeoPoint, count: Int) -> [ScooterCityDistance] {
        let distances = cities.map { city in
            ScooterCityDistance(city: city, distanceMeters: distanceMeters(from: point, to: city.center))
        }
        return Array(distances.sorted { $0.distanceMeters < $1.distanceMeters }.prefix(max(0, count)))
    }

    /// Whether the point is inside an operator's service area, like isPointCovered on the web.
    static func contains(latitude: Double, longitude: Double) -> Bool {
        ScooterProviderCoverage.contains(latitude: latitude, longitude: longitude)
    }

    static func contains(_ point: GeoPoint) -> Bool {
        contains(latitude: point.latitude, longitude: point.longitude)
    }

    // haversineM from src/lib/geo.ts, so both apps show the same distances.
    private static func distanceMeters(from origin: GeoPoint, to destination: GeoPoint) -> Double {
        let radians = Double.pi / 180
        let latitudeDelta = (destination.latitude - origin.latitude) * radians
        let longitudeDelta = (destination.longitude - origin.longitude) * radians
        let a = pow(sin(latitudeDelta / 2), 2) +
            cos(origin.latitude * radians) * cos(destination.latitude * radians) * pow(sin(longitudeDelta / 2), 2)
        return 2 * 6_371_000 * asin(min(1, a.squareRoot()))
    }
}
`;
}

// data/rental-curfews.json, which src/lib/rentalCurfews.ts reads as it is.
function swiftCurfews() {
  const time = value => {
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) throw new Error(`Invalid curfew time: ${value}`);
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };
  // Calendar's weekdays: 1 is Sunday.
  const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const night = ({ days, from, until }) => {
    if (days !== undefined && (days.length === 0 || !days.every(day => weekdays.includes(day)))) {
      throw new Error(`Invalid curfew days: ${days}`);
    }
    const evenings = days ? `[${days.map(day => weekdays.indexOf(day) + 1).join(', ')}]` : 'nil';
    return `RentalCurfew.Night(evenings: ${evenings}, fromMinute: ${time(from)}, untilMinute: ${time(until)})`;
  };
  // Each city's rings go in a property of their own, as bare numbers. One list
  // holding a GeoPoint call for every corner took Swift's type checker more
  // than 20 minutes on CI once the American bans had doubled the corners.
  const areasName = id => {
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid curfew id: ${id}`);
    return `${id.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase())}Areas`;
  };
  const names = new Set();
  const areas = [];
  const entries = curfews.map(curfew => {
    if (!curfew.nights.length) throw new Error(`Curfew without nights: ${curfew.id}`);
    if (!curfew.areas.length || curfew.areas.some(area => area.length < 3 ||
      !area.every(point => point.length === 2 && point.every(Number.isFinite)))) {
      throw new Error(`Invalid curfew area: ${curfew.id}`);
    }
    const zoneProblem = curfewZoneProblem(curfew, regionalSystems);
    if (zoneProblem) throw new Error(zoneProblem);
    const name = areasName(curfew.id);
    if (names.has(name)) throw new Error(`Duplicate curfew id: ${curfew.id}`);
    names.add(name);
    areas.push(`    private static let ${name}: [[Double]] = [${curfew.areas.map(area => `[${area.flat().join(', ')}]`).join(', ')}]`);
    return `        RentalCurfew(\n            city: ${JSON.stringify(curfew.city)}, timeZone: ${JSON.stringify(curfew.timeZone)},\n` +
      `            nights: [${curfew.nights.map(night).join(', ')}],\n            areas: rings(${name})\n        ),`;
  }).join('\n');

  return `
/// Cities that ban renting shared scooters at night, as src/lib/rentalCurfews.ts reads them.
extension RentalCurfew {
    static let all: [RentalCurfew] = [
${entries}
    ]

    /// Each ring as latitude, longitude, latitude, longitude…
    private static func rings(_ coordinates: [[Double]]) -> [[GeoPoint]] {
        coordinates.map { ring in
            stride(from: 0, to: ring.count, by: 2).map { GeoPoint(latitude: ring[$0], longitude: ring[$0 + 1]) }
        }
    }

${areas.join('\n')}
}
`;
}

function swiftRuleZones() {
  const time = value => {
    if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) throw new Error(`Invalid rule zone time: ${value}`);
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  };
  // Each street's lines go in a property of their own, as bare numbers, as the curfews' rings do.
  const linesName = id => `${id.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase())}Lines`;
  const ids = new Set();
  const lines = [];
  const entries = ruleZones.map(zone => {
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(zone.id) || ids.has(zone.id)) throw new Error(`Invalid rule zone id: ${zone.id}`);
    ids.add(zone.id);
    if (zone.rule !== 'noRide') throw new Error(`Unknown rule: ${zone.rule} (${zone.id})`);
    if (!/^\d{4}-\d\d-\d\d$/.test(zone.from)) throw new Error(`Invalid rule zone start: ${zone.id}`);
    if (!/^https:\/\//.test(zone.source?.url) || !zone.authority) throw new Error(`Rule zone without a source: ${zone.id}`);
    if (!zone.lines.length || zone.lines.some(line => line.length < 2 ||
      !line.every(point => point.length === 2 && point.every(Number.isFinite)))) {
      throw new Error(`Invalid rule zone line: ${zone.id}`);
    }
    const hours = (zone.hours ?? []).map(({ from, until }) => `.init(fromMinute: ${time(from)}, untilMinute: ${time(until)})`);
    lines.push(`    private static let ${linesName(zone.id)}: [[Double]] = [${zone.lines.map(line => `[${line.flat().join(', ')}]`).join(', ')}]`);
    return `        CityRuleZone(\n            id: ${JSON.stringify(zone.id)}, authority: ${JSON.stringify(zone.authority)},\n` +
      `            timeZone: ${JSON.stringify(zone.timeZone)}, firstDay: ${JSON.stringify(zone.from)}, hours: [${hours.join(', ')}],\n` +
      `            source: URL(string: ${JSON.stringify(zone.source.url)})!,\n            lines: points(${linesName(zone.id)})\n        ),`;
  }).join('\n');

  return `
/// Streets where a city forbids riding, as src/lib/ruleZones.ts reads data/rule-zones.json.
extension CityRuleZone {
    static let all: [CityRuleZone] = [
${entries}
    ]

    /// Each line as latitude, longitude, latitude, longitude…
    private static func points(_ coordinates: [[Double]]) -> [[GeoPoint]] {
        coordinates.map { line in
            stride(from: 0, to: line.count, by: 2).map { GeoPoint(latitude: line[$0], longitude: line[$0 + 1]) }
        }
    }

${lines.join('\n')}
}
`;
}

// The Android app names the providers as the iPhone app does, in Kotlin's casing (BoltHopp), and reads
// the rest of the catalog from catalog.json: as Kotlin code, its thousands of areas and cities would pass
// the JVM's limit of 64 KB of code a method. android/core's CatalogParityTest checks both apps hold the
// same catalog.
const kotlinCase = key => key.replace(/(?:^|_)([a-z0-9])/g, (_, letter) => letter.toUpperCase());
const kotlinString = value => JSON.stringify(value).replace(/\$/g, '\\$');

function kotlinCatalog() {
  const names = new Set(providers.map(provider => kotlinCase(provider.key)));
  if (names.size !== providers.length) throw new Error('Two providers share a Kotlin name');
  const list = values => values.map(kotlinString).join(', ');
  const entries = providers.map(provider => (
    `    ${kotlinCase(provider.key)}(${kotlinString(provider.key)}, ${kotlinString(provider.name)}, ` +
    `${kotlinString(provider.initial)}, 0xFF${provider.color.slice(1).toUpperCase()}, ` +
    `${provider.app ? `OperatorApp(${kotlinString(provider.app.link)})` : 'null'}),`
  )).join('\n');
  const matchers = matcherOrder.map(provider => (
    `            SystemIDMatcher(${kotlinCase(provider.key)}, listOf(${list(provider.systemIds?.exact ?? [])}), ` +
    `listOf(${list(provider.systemIds?.prefixes ?? [])})),`
  )).join('\n');
  const swiss = providers.filter(provider => provider.switzerland).map(provider => kotlinCase(provider.key)).join(', ');

  return `// Generated by scripts/generate-provider-catalog.mjs. Do not edit directly.

package com.plhery.scootradar.core.generated

enum class ScooterProvider(
    val rawValue: String,
    val displayName: String,
    val shortName: String,
    /** 0xAARRGGBB. */
    val color: Long,
    val app: OperatorApp?,
) {
${entries}
    ;

    val id: String get() = rawValue

    /**
     * The operator's app, for scooters whose feed gives no link: a link to a site's root that its app
     * claims. Spin's site is the one link no app claims.
     */
    data class OperatorApp(val link: String)

    private class SystemIDMatcher(val provider: ScooterProvider, val exact: List<String>, val prefixes: List<String>)

    companion object {
        /** The providers the Swiss open data names; the others run scooters only abroad. */
        val swissProviders: List<ScooterProvider> = listOf(${swiss})

        private val systemIDMatchers: List<SystemIDMatcher> by lazy {
            listOf(
${matchers}
            )
        }

        fun fromRawValue(rawValue: String): ScooterProvider? = entries.firstOrNull { it.rawValue == rawValue }

        /** The provider behind a feed or system ID such as "lime_zurich", like providerKeyForSystemId on the web. */
        fun forSystemID(systemID: String): ScooterProvider? {
            val normalized = systemID.lowercase()
            return systemIDMatchers.firstOrNull { matcher ->
                normalized in matcher.exact || matcher.prefixes.any { normalized.startsWith(it) }
            }?.provider
        }
    }
}
`;
}

function kotlinCatalogData() {
  const bounds = b => [b.south, b.west, b.north, b.east];
  const pause = p => ({ from: p.from, until: p.until, timeZone: p.timeZone });
  // The times and days were checked as the Swift catalog was written.
  const minute = value => value.split(':').map(Number).reduce((hours, minutes) => hours * 60 + minutes);
  const weekdays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  // One entry a line, to read when a test fails.
  const list = items => (items.length ? `[\n${items.map(item => JSON.stringify(item)).join(',\n')}\n]` : '[]');
  const cities = scooterCities(swissAreas, regionalSystems, countries).map(city => ({
    id: city.id,
    name: city.name,
    countryCode: city.country,
    center: city.center,
    bounds: bounds(city.bounds),
    ...(city.pauses ? { pauses: city.pauses.map(pause) } : {}),
    ...(city.feeds?.length ? { feeds: city.feeds.map(feed => ({ id: feed.id, ...(feed.pause ? { pause: pause(feed.pause) } : {}) })) } : {}),
  }));
  const sections = {
    swissAreas: list(swissAreas.map(area => bounds(area.bounds))),
    regionalSystems: list(coverageAreas(regionalSystems).map(area => [area.provider, ...bounds(area.bounds)])),
    cities: list(cities),
    curfews: list(curfews.map(curfew => ({
      city: curfew.city,
      timeZone: curfew.timeZone,
      nights: curfew.nights.map(({ days, from, until }) => ({
        ...(days ? { evenings: days.map(day => weekdays.indexOf(day) + 1) } : {}),
        fromMinute: minute(from),
        untilMinute: minute(until),
      })),
      areas: curfew.areas.map(area => area.flat()),
    }))),
    ruleZones: list(ruleZones.map(zone => ({
      id: zone.id,
      authority: zone.authority,
      timeZone: zone.timeZone,
      firstDay: zone.from,
      hours: (zone.hours ?? []).map(({ from, until }) => ({ fromMinute: minute(from), untilMinute: minute(until) })),
      source: zone.source.url,
      lines: zone.lines.map(line => line.flat()),
    }))),
    countries: JSON.stringify(kotlinCountries(countries), null, 1),
  };
  const data = `{\n${Object.entries(sections).map(([key, value]) => `${JSON.stringify(key)}: ${value}`).join(',\n')}\n}\n`;
  JSON.parse(data);
  return data;
}

validateCatalog();
validateCountries({ landingFirst, countries }, readCatalog, scooterCities(swissAreas, regionalSystems, countries));
// Read by src/lib/townOutlines.ts as it is; the apps have no copy.
const outlineProblem = townOutlinesProblem(readJson('data/town-outlines.json'), scooterCities(swissAreas, regionalSystems, countries));
if (outlineProblem) throw new Error(outlineProblem);
// Read by server/binbinApp.ts as it is.
const binbinProblem = binbinAreasProblem(regionalSystems, readJson('data/binbin-areas.json'));
if (binbinProblem) throw new Error(binbinProblem);
// Written in every case: writing it checks the curfews and rule zones.
const swift = swiftCatalog() + swiftCoverage() + swiftCities() + swiftCurfews() + swiftRuleZones() + swiftCountries(countries);
if (androidDirectory) {
  const generated = 'com/plhery/scootradar/core/generated';
  for (const [path, contents] of [
    [`kotlin/${generated}/ProviderCatalog.kt`, kotlinCatalog()],
    [`resources/${generated}/catalog.json`, kotlinCatalogData()],
  ]) {
    mkdirSync(dirname(resolve(androidDirectory, path)), { recursive: true });
    writeFileSync(resolve(androidDirectory, path), contents);
  }
} else {
  writeOrCheck(typescriptPath, typescriptCatalog());
  writeOrCheck(countriesPath, typescriptCountries({ landingFirst, countries }));
  writeOrCheck(catalogsPath, typescriptCatalogs(countries));
  writeOrCheck(swiftPath, swift);
}
