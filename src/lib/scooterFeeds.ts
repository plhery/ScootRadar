import {
  isAbandonedStatus, isEmptyUndatedStatus, statusObservedAt, validateDiscovery, validateRegistry, validateStations, validateTypes, validateVehicleStatus,
} from './feedValidation';
import { VEHICLE_MAX_AGE_MS } from './dataFreshness';
import { PRICES_BEFORE_TAX } from '@/generated/countries';
import {
  coverageForRegionNames,
  coverageIntersects,
  HOPP_SWISS_TOWNS,
  knownSystemCoverage,
  LEFT_OUT_SWISS_SYSTEMS,
  PUBLIBIKE_FREE_FLOATING_COVERAGE,
  PUBLIBIKE_STATION_COVERAGE,
  SWISS_MOBILITY_BOUNDS,
} from '@/lib/feedCoverage';
import { boundsContainPoint, boundsIntersection, haversineM } from '@/lib/geo';
import { COUNTRY_SOURCES, REGIONAL_SCOOTER_SYSTEMS, regionalSource, serviceAreas, type RegionalScooterSystem, type ScooterCountry } from '@/lib/regionalScooterSystems';
import { skippedSources, type FeedSourceStatus, type ScooterSource } from '@/lib/scooterSources';
import { feedPaused } from '@/lib/seasonalPauses';
import { isElectricScooter, type GbfsVehicleType } from '@/lib/scooterTypes';
import { systemServesPoint } from '@/lib/townOutlines';
import type { MapBounds, Vehicle } from '@/lib/types';
import { legacyRentalLink, normalizeRentalUris } from '@/lib/rentalLinks';
import { upstreamJsonCache, UpstreamHttpError, type CachedJson } from '@/lib/upstreamJsonCache';
import {
  providerKeyForSystemId,
  type ProviderKey,
} from '@/generated/providers';

const NATIONAL_V23_REGISTRY_URL = 'https://sharedmobility.ch/v2/gbfs';
const SPATIAL_IDENTIFY_URL = 'https://api.sharedmobility.ch/v1/sharedmobility/identify';
const PUBLIBIKE_FREE_FLOATING_URL =
  'https://velospot.info/customer/public/api/pbvsng/freeFloating';
const PUBLIBIKE_STATIONS_URL = 'https://velospot.info/customer/public/api/pbvsng/stations';
const PUBLIBIKE_ESCOOTER_TYPE = 5;
// Far above any real station; bounds the markers a malformed count can create.
const STATION_MAX_SCOOTERS = 50;

const STATUS_REVALIDATE_SECONDS = 30;
const METADATA_REVALIDATE_SECONDS = 3600;
const STATUS_STALE_IF_ERROR_SECONDS = VEHICLE_MAX_AGE_MS / 1000;
const METADATA_STALE_IF_ERROR_SECONDS = 86400;
const FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_AUTH_EMAIL = 'hello@scootradar.com';

type AvailabilityFlag = boolean | 0 | 1;

interface RawVehicle {
  lat?: number;
  lon?: number;
  lng?: number;
  current_fuel_percent?: number;
  current_range_meters?: number;
  hopp_battery_level?: number;
  hopp_deeplink?: string;
  bike_id?: string;
  vehicle_id?: string;
  vehicle_type_id?: string;
  pricing_plan_id?: string;
  id?: string;
  is_reserved?: AvailabilityFlag;
  is_disabled?: AvailabilityFlag;
  rental_uris?: { ios?: string; android?: string; web?: string };
}

interface PubliBikeFreeFloatingVehicle {
  id?: string;
  latitude?: number;
  longitude?: number;
  type?: number;
}

interface PubliBikeStation {
  id?: string;
  latitude?: number;
  longitude?: number;
  out_of_service?: boolean;
  available_vehicles?: { count?: number; type?: number }[];
}

interface VehicleType extends GbfsVehicleType {
  default_pricing_plan_id?: string;
  max_range_meters?: number;
}

// No standing scooter goes this far on a charge. ATOM Mobility gives each scooter its type's
// maximum range scaled by its charge, and Elerent sets that maximum to 1,000 km: its range is
// only the charge, so it is shown as one.
const MAX_SCOOTER_RANGE_M = 200_000;

interface StatusFeed {
  last_updated?: number | string;
  data?: {
    bikes?: RawVehicle[];
    vehicles?: RawVehicle[];
  };
}

interface VehicleTypesFeed {
  data?: {
    vehicle_types?: VehicleType[];
  };
}

interface StationInformationFeed {
  data?: {
    stations?: { station_id?: string; lat?: number; lon?: number; rental_uris?: RawVehicle['rental_uris'] }[];
  };
}

interface StationStatusFeed {
  last_updated?: number | string;
  data?: {
    stations?: {
      station_id?: string;
      is_installed?: AvailabilityFlag;
      is_renting?: AvailabilityFlag;
      vehicle_types_available?: { vehicle_type_id?: string; count?: number }[];
    }[];
  };
}

interface PerMinutePrice {
  end?: number;
  start?: number;
  rate?: number;
  interval?: number;
}

interface PricingPlan {
  plan_id?: string;
  name?: string | Array<{ language: string; text: string }>;
  currency?: string;
  // GBFS says a number; Lyft writes "1.00".
  price?: number | string;
  description?: string | Array<{ language: string; text: string }>;
  per_min_pricing?: PerMinutePrice[];
  per_km_pricing?: unknown[];
  // GBFS says boolean; Bike Share Toronto, SoBi Hamilton and others write 1 and 0.
  is_taxable?: boolean | number;
  // Hopp currently publishes this singular key instead of the GBFS key above.
  per_min_price?: PerMinutePrice[];
}

interface PricingPlansFeed {
  ttl?: number;
  data?: {
    plans?: PricingPlan[];
    pricing_plans?: PricingPlan[];
  };
}

type VehiclePricing = NonNullable<Vehicle['pricing']>;

interface PlanPrices {
  /** The price of each plan the app can show. */
  pricing: ReadonlyMap<string, VehiclePricing>;
  /** Every plan the feed lists, priced or not. */
  listed: ReadonlySet<string>;
  /** The name of each priced plan that gives one, in English where it is translated. */
  names: ReadonlyMap<string, string>;
}

interface PlanOptions {
  authenticated?: boolean;
  source: string;
  country: string;
  wholeUnitPrice?: boolean;
}

interface PricingPlans extends PlanPrices {
  /** Where the plans came from, to fetch them again; absent when the feed has none or they failed. */
  from?: { url: string; options: PlanOptions; fetchedAt: number; ttlSeconds: number };
}

const NO_PLANS: PricingPlans = { pricing: new Map(), listed: new Set(), names: new Map() };

interface RegistryFeed {
  systems?: Array<{
    id: string;
    url: string;
  }>;
}

interface DiscoveryFeedEntry {
  name: string;
  url: string;
}

interface DiscoveryFeed {
  data?: {
    feeds?: DiscoveryFeedEntry[];
    [language: string]: unknown;
  };
}

interface SystemRegionsFeed {
  data?: {
    regions?: Array<{
      name?: string;
    }>;
  };
}

interface SpatialFeature {
  properties?: {
    provider?: {
      id?: string;
    };
  };
}

type SpatialResponse = SpatialFeature[] | {
  geoJsonSearchInformations?: SpatialFeature[];
};

export interface FeedQuery {
  /** Legacy distance origin. New clients calculate distance locally. */
  origin?: [number, number] | null;
  bounds: MapBounds;
  minBattery: number;
  providers?: Set<string>;
  outsideCoverage?: boolean;
}

export type { FeedSourceStatus, ScooterSource } from '@/lib/scooterSources';

export interface ScooterFetchMetadata {
  expiresAt?: string;
  partial: boolean;
  stale: boolean;
  failedSources: string[];
  sources: Record<ScooterSource, FeedSourceStatus>;
}

export interface ScooterFetchResult {
  vehicles: Vehicle[];
  meta: ScooterFetchMetadata;
}

interface SourceVehicles {
  observedAt?: number;
  vehicles: Vehicle[];
  stale: boolean;
  skipped?: boolean;
  failedSources?: string[];
}

export interface CollectableScooterFeed {
  id: string;
  source: keyof ScooterFetchMetadata['sources'];
  provider: ProviderKey;
  coverage: MapBounds[];
  collect: () => Promise<SourceVehicles>;
  host: string;
}

// The persistent collector refreshes each system independently. A failing
// operator must not discard another city's last successful snapshot.
export async function discoverCollectableFeeds(): Promise<CollectableScooterFeed[]> {
  const query: FeedQuery = { bounds: SWISS_MOBILITY_BOUNDS, minBattery: 0 };
  const registry = await fetchJson<RegistryFeed>(NATIONAL_V23_REGISTRY_URL, {
    validate: validateRegistry,
    authenticated: true, revalidate: METADATA_REVALIDATE_SECONDS,
  });
  return [
    ...(registry.data.systems ?? []).flatMap(entry => {
      const system = registrySystem(entry.id, entry.url);
      return system ? [{
        id: `national:${system.id}`,
        host: new URL(system.discoveryUrl).hostname,
        source: 'national' as const,
        provider: system.provider,
        coverage: knownSystemCoverage(system.id) ?? [SWISS_MOBILITY_BOUNDS],
        collect: () => fetchSystemVehicles(system, query),
      }] : [];
    }),
    ...independentCollectableFeeds(),
  ];
}

export function independentCollectableFeeds(): CollectableScooterFeed[] {
  const query: FeedQuery = { bounds: SWISS_MOBILITY_BOUNDS, minBattery: 0 };
  return [
    ...HOPP_SWISS_TOWNS.map(town => ({
      id: `hopp:${town.id}`, host: new URL(town.discoveryUrl).hostname, source: 'hopp' as const, provider: 'hopp' as const,
      coverage: [town.coverage],
      collect: () => fetchHoppTownVehicles(town, query),
    })),
    { id: 'publibike', host: new URL(PUBLIBIKE_FREE_FLOATING_URL).hostname, source: 'publibike', provider: 'publibike',
      coverage: [PUBLIBIKE_FREE_FLOATING_COVERAGE],
      collect: () => fetchPubliBikeFreeFloatingVehicles(query) },
    { id: 'publibike-stations', host: new URL(PUBLIBIKE_STATIONS_URL).hostname, source: 'publibike', provider: 'publibike',
      coverage: PUBLIBIKE_STATION_COVERAGE,
      collect: () => fetchPubliBikeStationVehicles(query) },
    ...REGIONAL_SCOOTER_SYSTEMS.map(system => ({
      host: new URL(system.discoveryUrl).hostname,
      id: `${regionalSource(system)}:${system.id}`, source: regionalSource(system), provider: system.provider,
      coverage: serviceAreas(system).map(area => area.bounds),
      collect: () => fetchRegionalSystemVehicles(system, { bounds: system.bounds, minBattery: 0 }),
    })),
  ];
}

interface NationalSystem {
  id: string;
  provider: ProviderKey;
  discoveryUrl: string;
  baseUrl: string;
}

export class ScooterFeedsUnavailableError extends Error {
  readonly failedSources: string[];

  constructor(failedSources: string[]) {
    super('Every configured scooter feed failed');
    this.name = 'ScooterFeedsUnavailableError';
    this.failedSources = failedSources;
  }
}

function sharedMobilityHeaders(): Record<string, string> {
  return {
    Accept: 'application/json',
    Authorization: process.env.SHAREDMOBILITY_AUTH_EMAIL ?? DEFAULT_AUTH_EMAIL,
    'User-Agent': 'scootradar/2.0 (scootradar.com)',
  };
}

// Entur, Norway's open mobility API, answers only clients that name themselves
// as "<company>-<application>" (developer.entur.no/docs/getting-started).
export const HOST_HEADERS: Record<string, Record<string, string>> = {
  'api.entur.io': { 'ET-Client-Name': 'scootradar-map' },
};

// Lime's servers sometimes take 12 to 26 seconds before sending a big city's
// vehicles (Chicago, Seattle: about 3 MB), and answer in about a second otherwise.
export const HOST_TIMEOUTS_MS: Record<string, number> = {
  'data.lime.bike': 40_000,
};

export async function fetchJson<T>(
  url: string,
  options: { authenticated?: boolean; revalidate: number; validate?: (value: unknown) => void; maxAgeSeconds?: number }
): Promise<CachedJson<T>> {
  const host = new URL(url).hostname;
  const headers = {
    ...(options.authenticated
      ? sharedMobilityHeaders()
      : { Accept: 'application/json', 'User-Agent': 'scootradar/2.0 (scootradar.com)' }),
    ...HOST_HEADERS[host],
  };

  return upstreamJsonCache.fetch<T>(url, {
    headers,
    validate: options.validate,
    freshSeconds: options.revalidate,
    staleIfErrorSeconds: options.revalidate === STATUS_REVALIDATE_SECONDS
      ? STATUS_STALE_IF_ERROR_SECONDS
      : METADATA_STALE_IF_ERROR_SECONDS,
    timeoutMs: HOST_TIMEOUTS_MS[host] ?? FETCH_TIMEOUT_MS,
    maxAgeSeconds: options.maxAgeSeconds,
  });
}

function rawVehicles(feed: StatusFeed): RawVehicle[] {
  return feed.data?.bikes ?? feed.data?.vehicles ?? [];
}

function isSet(value: AvailabilityFlag | undefined): boolean {
  return value === true || value === 1;
}

function batteryPercent(vehicle: RawVehicle): number | null {
  if (vehicle.hopp_battery_level != null && Number.isFinite(vehicle.hopp_battery_level)) {
    return Math.max(0, Math.min(100, Math.round(vehicle.hopp_battery_level)));
  }

  if (vehicle.current_fuel_percent == null || !Number.isFinite(vehicle.current_fuel_percent)) {
    return null;
  }

  const value = vehicle.current_fuel_percent <= 1
    ? vehicle.current_fuel_percent * 100
    : vehicle.current_fuel_percent;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function vehicleId(systemId: string, vehicle: RawVehicle): string | null {
  const id = vehicle.bike_id ?? vehicle.vehicle_id ?? vehicle.id;
  if (typeof id !== 'string' || !id) return null;
  return id.startsWith(`${systemId}:`) ? id : `${systemId}:${id}`;
}

function toVehicle(
  systemId: string,
  provider: ProviderKey,
  raw: RawVehicle,
  query: Pick<FeedQuery, 'origin'>,
  plans: PlanPrices,
  type?: VehicleType,
  scooterPlanId?: string,
  unlisted?: Set<string>
): Vehicle | null {
  const lat = raw.lat;
  const lng = raw.lon ?? raw.lng;
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const reported = raw.current_range_meters != null ? Number(raw.current_range_meters) : NaN;
  const range = Number.isFinite(reported) && reported >= 0 ? reported : null;
  const maxRange = type?.max_range_meters;
  const rangeIsCharge = range !== null && maxRange != null && maxRange > MAX_SCOOTER_RANGE_M && range <= maxRange;
  const rentalUris = normalizeRentalUris(
    provider,
    raw.rental_uris,
    raw.hopp_deeplink
  );

  const distance = query.origin
    ? Math.round(haversineM(query.origin[0], query.origin[1], lat, lng) * 10) / 10
    : null;
  const planId = raw.pricing_plan_id ?? type?.default_pricing_plan_id ?? scooterPlanId;
  const pricing = planId ? plans.pricing.get(planId) : undefined;
  if (planId && !plans.listed.has(planId)) unlisted?.add(planId);

  return {
    provider,
    lat,
    lng,
    battery: batteryPercent(raw) ?? (rangeIsCharge ? Math.round(range / maxRange * 100) : null),
    range_m: range !== null && range <= MAX_SCOOTER_RANGE_M ? Math.round(range) : null,
    vehicle_id: vehicleId(systemId, raw),
    deep_link: legacyRentalLink(rentalUris),
    rental_uris: rentalUris,
    distance_m: distance,
    ...(pricing ? { pricing } : {}),
  };
}

function filterVehicles(
  systemId: string,
  vehicles: RawVehicle[],
  types: Map<string, VehicleType>,
  query: FeedQuery,
  plans: PlanPrices = NO_PLANS,
  scooterPlanId?: string,
  unlisted?: Set<string>
): Vehicle[] {
  const provider = providerKeyForSystemId(systemId);
  if (!provider || (query.providers && !query.providers.has(provider))) return [];

  const filtered: Vehicle[] = [];
  for (const raw of vehicles) {
    if (isSet(raw.is_disabled) || isSet(raw.is_reserved)) continue;
    if (!raw.vehicle_type_id || !isElectricScooter(types.get(raw.vehicle_type_id), provider)) continue;

    const lat = raw.lat;
    const lng = raw.lon ?? raw.lng;
    if (
      lat == null || lng == null ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      !boundsContainPoint(query.bounds, lat, lng)
    ) continue;

    const vehicle = toVehicle(systemId, provider, raw, query, plans, types.get(raw.vehicle_type_id), scooterPlanId, unlisted);
    if (!vehicle) continue;
    filtered.push(vehicle);
  }
  return filtered;
}

/**
 * The plans some operators publish for their scooters without linking them from the scooters or
 * their type. Lyft lists bike and scooter plans side by side in Chicago and Portland, and names
 * none on its vehicles; its scooters' is SCOOTER_SINGLE_RIDE, "SCOOTER SINGLE RIDE". Beryl lists
 * a "Pay As You Ride" plan for its bikes, e-bikes and scooters in each town, beside bundles and
 * passes, and numbers them by town: its scooters' is 59-escooter in Norwich, 1150-escooter in
 * Leeds. Its scooters' type is "scooter", which the plans' minute prices call "escooter".
 */
const UNLINKED_SCOOTER_PLANS: Partial<Record<ProviderKey, (planId: string, name?: string) => boolean>> = {
  lyft: planId => planId === 'SCOOTER_SINGLE_RIDE',
  beryl: (planId, name) => planId.endsWith('-escooter') && name === 'Pay As You Ride',
};

/**
 * That plan, where it can only be the scooters': the feed prices one such plan, and has one type
 * of standing scooter that names no plan of its own. With two scooter types, it could be either's.
 */
export function unlinkedScooterPlan(
  provider: ProviderKey,
  types: ReadonlyMap<string, VehicleType>,
  plans: Pick<PlanPrices, 'pricing' | 'names'>
): string | undefined {
  const isScooterPlan = UNLINKED_SCOOTER_PLANS[provider];
  const scooters = [...types.values()].filter(type => isElectricScooter(type, provider));
  if (!isScooterPlan || scooters.length !== 1 || scooters[0].default_pricing_plan_id) return undefined;
  const planIds = [...plans.pricing.keys()].filter(planId => isScooterPlan(planId, plans.names.get(planId)));
  return planIds.length === 1 ? planIds[0] : undefined;
}

/**
 * The scooters docked at a feed's stations, which its station status counts by type, without ids.
 * Each one is a vehicle at its station, with the station's link, numbered so that a count dropping
 * from 3 to 2 removes only the third. A station not installed or not renting has none to hire.
 */
function dockedScooters(
  information: StationInformationFeed,
  status: StationStatusFeed,
  isScooter: (typeId: string) => boolean
): RawVehicle[] {
  const places = new Map((information.data?.stations ?? []).map(station => [station.station_id, station]));
  const docked: RawVehicle[] = [];
  for (const station of status.data?.stations ?? []) {
    const place = places.get(station.station_id);
    if (!place || !isSet(station.is_installed) || !isSet(station.is_renting)) continue;
    let index = 0;
    for (const { vehicle_type_id, count } of station.vehicle_types_available ?? []) {
      if (!vehicle_type_id || !isScooter(vehicle_type_id) ||
        !Number.isInteger(count) || count! <= 0 || count! > STATION_MAX_SCOOTERS) continue;
      for (let docks = 0; docks < count!; docks++) {
        docked.push({ vehicle_id: `station:${station.station_id}:${++index}`, vehicle_type_id,
          lat: place.lat, lon: place.lon, rental_uris: place.rental_uris });
      }
    }
  }
  return docked;
}

function typeMap(feed: VehicleTypesFeed): Map<string, VehicleType> {
  return new Map((feed.data?.vehicle_types ?? []).map(type => [type.vehicle_type_id, type]));
}

function minorUnits(value: number | string | undefined): number | null {
  // A price written as a string, as Lyft's "1.00", counts when it is a plain decimal number.
  if (typeof value === 'string') value = /^\d+(?:\.\d+)?$/.test(value.trim()) ? Number(value) : undefined;
  if (value == null || !Number.isFinite(value) || value < 0) return null;
  const minor = Math.round((value + Number.EPSILON) * 100);
  return Number.isSafeInteger(minor) ? minor : null;
}

function describedMinorUnits(
  description: PricingPlan['description'],
  currency: string,
  priceContext: 'unlock' | 'minute'
): number | null {
  if (Array.isArray(description)) {
    description = description.find(value => value.language === 'en')?.text;
  }
  if (typeof description !== 'string') return null;
  const suffix = priceContext === 'unlock' ? 'to\\s+unlock' : 'per\\s+minute';
  const match = description.match(new RegExp(
    `([0-9]+(?:[.,][0-9]+)?)\\s*${currency}\\s+${suffix}`,
    'i'
  )) ?? (DOLLAR_CURRENCIES.has(currency) ? description.match(new RegExp(
    // "$1.00 unlock fee, $0.41 per minute." (Lyft), "$2.50 to unlock + $0.25 per minute" (MetroBike).
    `\\$\\s*([0-9]+(?:\\.[0-9]+)?)\\s+(?:${priceContext === 'unlock' ? 'unlock\\s+fee|' : ''}${suffix})`,
    'i'
  )) : null);
  if (!match) return null;
  return minorUnits(Number(match[1].replace(',', '.')));
}

/** Currencies North American feeds write with a bare "$" in their descriptions. */
const DOLLAR_CURRENCIES = new Set(['USD', 'CAD', 'MXN']);

/**
 * A minute band holds for every ride the app prices when it runs to the
 * longest of them: RIDE_DURATIONS in ridePrice.ts and RideEstimateDuration on
 * iOS, which the cache does not build from.
 */
const LONGEST_PRICED_RIDE_MINUTES = 30;

/**
 * The fee of every minute, and what is charged once on top of the plan's
 * price, where the minute bands come to one flat price a minute:
 * - one band from minute 0 or 1, billed by the minute;
 * - the same, split into bands that follow on with one rate (a table of 30
 *   minute rows reads as one band);
 * - a first minute at its own rate, then one rate a minute, as Bike Share
 *   Toronto, MetroBike Austin and Chattanooga publish an unlock fee: $1.12 for
 *   minute 0 and $0.12 from minute 1 is $1 once and $0.12 for each minute.
 * A band may end, as many North American ones do at the longest trip, as long
 * as it runs through every ride the app prices. Anything else, such as minutes
 * included before the rate starts or billing by the quarter hour, is not a flat
 * minute price and gets no estimate.
 */
function minuteTariff(bands: readonly PerMinutePrice[]): { onceMinorUnits: number; minuteMinorUnits: number } | null {
  const merged: PerMinutePrice[] = [];
  for (const band of [...bands].sort((a, b) => (a.start ?? 0) - (b.start ?? 0))) {
    const last = merged.at(-1);
    if (last && last.end !== undefined && last.end === band.start && last.rate === band.rate && last.interval === band.interval) {
      merged[merged.length - 1] = { ...last, end: band.end };
    } else {
      merged.push({ ...band });
    }
  }
  const lasts = (band: PerMinutePrice) => band.interval === 1 && (band.end === undefined || band.end >= LONGEST_PRICED_RIDE_MINUTES);
  const [first, second] = merged;
  // Dott, Ryde and Pony start their band at minute 1, yet their descriptions
  // say "1 EUR to unlock and 0.37 EUR per minute": every minute is charged. Read
  // to the letter, the first minute would be free, so the estimate is at most
  // one minute's fee above it, never below.
  if (merged.length === 1 && (first.start === 0 || first.start === 1) && lasts(first)) {
    const minute = minorUnits(first.rate);
    return minute == null ? null : { onceMinorUnits: 0, minuteMinorUnits: minute };
  }
  if (merged.length === 2 && first.start === 0 && first.end === 1 && first.interval === 1 && second.start === 1 && lasts(second)) {
    const firstMinute = minorUnits(first.rate);
    const minute = minorUnits(second.rate);
    if (firstMinute == null || minute == null || firstMinute < minute) return null;
    return { onceMinorUnits: firstMinute - minute, minuteMinorUnits: minute };
  }
  return null;
}

/**
 * A plan's price as the app shows it, an unlock fee and one minute price, or null where it cannot
 * be one. The plan's country says whether is_taxable adds tax on top (PRICES_BEFORE_TAX).
 */
export function vehiclePricing(plan: PricingPlan, country: string, wholeUnitPrice = false): VehiclePricing | null {
  const currency = plan.currency?.trim().toUpperCase();
  const minuteBands = plan.per_min_pricing?.length
    ? plan.per_min_pricing
    : plan.per_min_price;
  // The wire contract models an unlock fee and one uniform minute price. Do not
  // flatten tariffs with introductory periods, interval billing or distance charges.
  if (!minuteBands?.length || plan.per_km_pricing?.length) return null;
  const tariff = minuteTariff(minuteBands);
  const price = minorUnits(plan.price);
  if (!currency?.match(/^[A-Z]{3}$/) || price == null || !tariff) return null;
  let unlockFee = price + tariff.onceMinorUnits;
  const minuteFee = tariff.minuteMinorUnits;

  // Descriptions are never used as the tariff source, but they can expose a
  // contradictory canonical value. In that case omitting the estimate is safer.
  const describedUnlockFee = describedMinorUnits(plan.description, currency, 'unlock');
  const describedMinuteFee = describedMinorUnits(plan.description, currency, 'minute');
  // Except for the cents sharedmobility.ch drops: its copy cuts the unlock fee
  // to whole francs, so Dott's CHF 0.95 in Basel, as Dott's own feed and the
  // description have it, arrives as 0, and St. Gallen's 1.20 as 1.
  if (wholeUnitPrice && describedUnlockFee != null && describedUnlockFee - describedUnlockFee % 100 === unlockFee) {
    unlockFee = describedUnlockFee;
  }
  if (
    (describedUnlockFee != null && describedUnlockFee !== unlockFee) ||
    (describedMinuteFee != null && describedMinuteFee !== minuteFee)
  ) {
    return null;
  }

  return {
    currency,
    unlock_fee_minor_units: unlockFee,
    minute_fee_minor_units: minuteFee,
    // US and Canadian prices are given before sales tax, which the rider pays on top. Elsewhere
    // they include VAT or GST, which is all is_taxable means there: Flamingo's in New Zealand.
    ...(PRICES_BEFORE_TAX.has(country) && (plan.is_taxable === true || plan.is_taxable === 1) ? { plus_tax: true } : {}),
  };
}

function pricingPlanMap(feed: PricingPlansFeed, country: string, wholeUnitPrice: boolean): PlanPrices {
  const plans = feed.data?.plans ?? feed.data?.pricing_plans ?? [];
  const pricing = new Map<string, VehiclePricing>();
  const listed = new Set<string>();
  const names = new Map<string, string>();
  for (const plan of plans) {
    const planId = plan.plan_id?.trim();
    if (!planId) continue;
    listed.add(planId);
    const price = vehiclePricing(plan, country, wholeUnitPrice);
    if (!price) continue;
    pricing.set(planId, price);
    const name = Array.isArray(plan.name) ? plan.name.find(value => value.language === 'en')?.text : plan.name;
    if (typeof name === 'string' && name.trim()) names.set(planId, name.trim());
  }
  return { pricing, listed, names };
}

async function loadPricingPlans(url: string, options: PlanOptions, maxAgeSeconds?: number): Promise<PricingPlans> {
  const result = await fetchJson<PricingPlansFeed>(url, {
    authenticated: options.authenticated,
    revalidate: METADATA_REVALIDATE_SECONDS,
    maxAgeSeconds,
  });
  const ttl = Number(result.data.ttl);
  return {
    ...pricingPlanMap(result.data, options.country, options.wholeUnitPrice ?? false),
    from: { url, options, fetchedAt: result.fetchedAt, ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : 0 },
  };
}

async function fetchPricingPlans(url: string | null, options: PlanOptions): Promise<PricingPlans> {
  if (!url) return NO_PLANS;

  try {
    return await loadPricingPlans(url, options);
  } catch (error) {
    // Pricing enriches availability and must never make otherwise-valid scooters disappear.
    logFallback(`${options.source}:system_pricing_plans`, error);
    return NO_PLANS;
  }
}

/**
 * The soonest a feed's plans are fetched again for a scooter naming a plan they don't list, or
 * the plans' own ttl where it is longer.
 */
const PLAN_REFRESH_SECONDS = 120;

interface PlanRefresh {
  at: number;
  /** The plan ids scooters named that the refresh did not find. */
  unlisted: ReadonlySet<string>;
  /** Refreshes in a row that left one unlisted. */
  misses: number;
}

// By plans URL: one entry a feed at most, changed only when its plans are fetched again.
const planRefreshes = new Map<string, PlanRefresh>();

/** Refreshes of a feed's plans by outcome: listed (every plan the scooters named is now) or unlisted. */
export const planRefreshCounts = { listed: 0, unlisted: 0 };

/** For tests: forgets past refreshes. */
export function forgetPlanRefreshes(): void {
  planRefreshes.clear();
  planRefreshCounts.listed = 0;
  planRefreshCounts.unlisted = 0;
}

/**
 * The feed's scooters, priced from its plans. Plans are kept an hour, positions a minute, so when
 * an operator puts its scooters on new plans, as Lime does each time its rate changes through
 * the day, they would go unpriced until the hour is up. A scooter naming a plan the plans don't
 * list has them fetched again, at most every two minutes (or their ttl, if longer), and the
 * scooters priced from them in the same collection. A plan the refresh doesn't find stays
 * unpriced; it is looked for again after 2, 4, 8… minutes, up to the hour after which the plans
 * are fetched anyway. A plan id not seen before is looked for after two minutes.
 */
async function pricedScooters(
  plans: PricingPlans,
  scooters: (plans: PlanPrices, unlisted?: Set<string>) => Vehicle[]
): Promise<Vehicle[]> {
  const unlisted = new Set<string>();
  const vehicles = scooters(plans, unlisted);
  const from = plans.from;
  if (!from || !unlisted.size) return vehicles;

  const now = Date.now();
  const last = planRefreshes.get(from.url);
  const novel = [...unlisted].some(id => !last?.unlisted.has(id));
  const waitSeconds = Math.min(METADATA_REVALIDATE_SECONDS,
    Math.max(PLAN_REFRESH_SECONDS, from.ttlSeconds) * (novel || !last ? 1 : 2 ** (last.misses - 1)));
  if (now - Math.max(from.fetchedAt, last?.at ?? 0) < waitSeconds * 1000) return vehicles;

  let refreshed: PricingPlans = plans;
  try {
    refreshed = await loadPricingPlans(from.url, from.options, waitSeconds);
  } catch (error) {
    logFallback(`${from.options.source}:system_pricing_plans`, error);
  }
  const still = new Set([...unlisted].filter(id => !refreshed.listed.has(id)));
  planRefreshCounts[still.size ? 'unlisted' : 'listed']++;
  // A plan missing for the first time starts the doubling again.
  const misses = !still.size ? 0 : !last || [...still].some(id => !last.unlisted.has(id)) ? 1 : last.misses + 1;
  planRefreshes.set(from.url, { at: now, unlisted: still, misses });
  return refreshed === plans ? vehicles : scooters(refreshed);
}

function registrySystem(systemId: string, systemUrl: string): NationalSystem | null {
  try {
    const url = new URL(systemUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'sharedmobility.ch') return null;
    if (!url.pathname.endsWith('/gbfs')) return null;

    const provider = providerKeyForSystemId(systemId);
    // Hopp and Velospot come from their own feeds: sharedmobility.ch's copy of
    // Velospot runs 15 to 75 minutes behind, its snapshots varying by request.
    if (!provider || provider === 'hopp' || systemId === 'velospot') return null;
    // Systems for towns their operator has left, until rechecked (LEFT_OUT_SWISS_SYSTEMS).
    if (LEFT_OUT_SWISS_SYSTEMS.has(systemId)) return null;

    const discoveryUrl = url.toString();
    url.pathname = url.pathname.slice(0, -'/gbfs'.length);
    url.search = '';
    url.hash = '';
    return {
      id: systemId,
      provider,
      discoveryUrl,
      baseUrl: url.toString().replace(/\/$/, ''),
    };
  } catch {
    return null;
  }
}

export function discoveryFeedEntries(feed: DiscoveryFeed): DiscoveryFeedEntry[] {
  const data = feed.data;
  if (!data) return [];
  if (Array.isArray(data.feeds)) return data.feeds;

  for (const value of Object.values(data)) {
    if (
      value &&
      typeof value === 'object' &&
      'feeds' in value &&
      Array.isArray(value.feeds)
    ) {
      return value.feeds as DiscoveryFeedEntry[];
    }
  }
  return [];
}

function trustedFeedUrl(rawUrl: string | undefined, trustedBaseUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    const base = new URL(trustedBaseUrl);
    const basePath = base.pathname.replace(/\/$/, '');
    if (
      url.protocol !== 'https:' ||
      url.origin !== base.origin ||
      url.username || url.password ||
      !url.pathname.startsWith(`${basePath}/`)
    ) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function discoveredFeedUrl(
  entries: DiscoveryFeedEntry[],
  name: string,
  trustedBaseUrl: string
): string | null {
  return trustedFeedUrl(entries.find(entry => entry.name === name)?.url, trustedBaseUrl);
}

function hasElectricScooter(types: Map<string, VehicleType>, provider: string | null): boolean {
  return [...types.values()].some(type => isElectricScooter(type, provider));
}

// Entur lists only the types of the vehicles a feed holds now: under Oslo's night ban Voi's list names no
// scooter, and that copy, kept for an hour, hid Oslo's scooters until 05:30 or later after the ban ended.
// A list without a scooter is fetched again once it is SCOOTERLESS_TYPES_MAX_AGE_SECONDS old.
const SCOOTERLESS_TYPES_MAX_AGE_SECONDS = 300;

async function fetchScooterTypes(
  url: string,
  provider: string | null,
  authenticated?: boolean
): Promise<{ byId: Map<string, VehicleType>; hasScooter: boolean; stale: boolean }> {
  const options = { validate: validateTypes, authenticated, revalidate: METADATA_REVALIDATE_SECONDS };
  let types = await fetchJson<VehicleTypesFeed>(url, options);
  if (!hasElectricScooter(typeMap(types.data), provider)) {
    types = await fetchJson<VehicleTypesFeed>(url, { ...options, maxAgeSeconds: SCOOTERLESS_TYPES_MAX_AGE_SECONDS });
  }
  const byId = typeMap(types.data);
  return { byId, hasScooter: hasElectricScooter(byId, provider), stale: types.stale };
}

function spatialFeatures(response: SpatialResponse): SpatialFeature[] {
  return Array.isArray(response) ? response : response.geoJsonSearchInformations ?? [];
}

function spatialQueryUrl(systemId: string, bounds: MapBounds): string {
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLng = (bounds.west + bounds.east) / 2;
  const radiusM = Math.ceil(Math.max(
    haversineM(centerLat, centerLng, bounds.south, bounds.west),
    haversineM(centerLat, centerLng, bounds.south, bounds.east),
    haversineM(centerLat, centerLng, bounds.north, bounds.west),
    haversineM(centerLat, centerLng, bounds.north, bounds.east)
  ) + 250);
  const url = new URL(SPATIAL_IDENTIFY_URL);
  url.searchParams.append('filters', 'ch.bfe.sharedmobility.vehicle_type=E-Scooter');
  url.searchParams.append('filters', `ch.bfe.sharedmobility.provider.id=${systemId}`);
  url.searchParams.set('Geometry', `${centerLng},${centerLat}`);
  url.searchParams.set('Tolerance', String(radiusM));
  url.searchParams.set('offset', '0');
  url.searchParams.set('geometryFormat', 'geojson');
  return url.toString();
}

async function spatialSystemMayServe(
  systemId: string,
  bounds: MapBounds
): Promise<{ mayServe: boolean; stale: boolean }> {
  const result = await fetchJson<SpatialResponse>(spatialQueryUrl(systemId, bounds), {
    revalidate: STATUS_REVALIDATE_SECONDS,
  });
  const mayServe = spatialFeatures(result.data).some(feature => (
    feature.properties?.provider?.id === systemId
  ));
  return { mayServe, stale: result.stale };
}

async function unresolvedSystemMayServe(
  system: NationalSystem,
  entries: DiscoveryFeedEntry[],
  query: FeedQuery
): Promise<{ mayServe: boolean; stale: boolean }> {
  // Velospot regions mix many vehicle modes, so region membership cannot prove
  // that e-scooters are offered there. Use the spatial API for it directly.
  const regionsUrl = system.id === 'velospot'
    ? null
    : discoveredFeedUrl(entries, 'system_regions', system.baseUrl);

  if (regionsUrl) {
    try {
      const regions = await fetchJson<SystemRegionsFeed>(regionsUrl, {
        authenticated: true,
        revalidate: METADATA_REVALIDATE_SECONDS,
      });
      const names = (regions.data.data?.regions ?? [])
        .map(region => region.name)
        .filter((name): name is string => Boolean(name));
      const coverage = coverageForRegionNames(names);
      if (coverageIntersects(coverage.bounds, query.bounds)) {
        return { mayServe: true, stale: regions.stale };
      }
      if (coverage.complete) {
        return { mayServe: false, stale: regions.stale };
      }
    } catch (error) {
      logFallback(`${system.id}:system_regions`, error);
    }
  }

  try {
    return await spatialSystemMayServe(system.id, query.bounds);
  } catch (error) {
    // Coverage discovery must never hide valid scooters during an API outage.
    // Fetching one extra GBFS system is the conservative failure mode.
    logFallback(`${system.id}:spatial_coverage`, error);
    return { mayServe: true, stale: true };
  }
}

async function fetchSystemVehicles(
  system: NationalSystem,
  query: FeedQuery
): Promise<SourceVehicles> {
  const knownCoverage = knownSystemCoverage(system.id);
  if (knownCoverage && !coverageIntersects(knownCoverage, query.bounds)) {
    return { vehicles: [], stale: false, skipped: true };
  }

  const discovery = await fetchJson<DiscoveryFeed>(system.discoveryUrl, {
    validate: validateDiscovery,
    authenticated: true,
    revalidate: METADATA_REVALIDATE_SECONDS,
  });
  const entries = discoveryFeedEntries(discovery.data);
  const statusUrl = discoveredFeedUrl(entries, 'free_bike_status', system.baseUrl);
  const typesUrl = discoveredFeedUrl(entries, 'vehicle_types', system.baseUrl);
  const pricingUrl = discoveredFeedUrl(entries, 'system_pricing_plans', system.baseUrl);
  if (!statusUrl || !typesUrl) {
    return { vehicles: [], stale: discovery.stale, skipped: true };
  }

  const types = await fetchScooterTypes(typesUrl, providerKeyForSystemId(system.id), true);
  const typesById = types.byId;
  if (!types.hasScooter) {
    return { vehicles: [], stale: discovery.stale || types.stale, skipped: true };
  }

  let coverageStale = false;
  if (!knownCoverage) {
    const coverage = await unresolvedSystemMayServe(system, entries, query);
    coverageStale = coverage.stale;
    if (!coverage.mayServe) {
      return {
        vehicles: [],
        stale: discovery.stale || types.stale || coverageStale,
        skipped: true,
      };
    }
  }

  const [status, plans] = await Promise.all([
    fetchJson<StatusFeed>(statusUrl, {
      validate: value => { if (!isAbandonedStatus(value)) validateVehicleStatus(value); },
      authenticated: true,
      revalidate: STATUS_REVALIDATE_SECONDS,
    }),
    fetchPricingPlans(pricingUrl, { authenticated: true, source: system.id, country: 'CH', wholeUnitPrice: true }),
  ]);
  // An operator that has left the city, or never sends positions, is not failing.
  if (isAbandonedStatus(status.data)) {
    return { vehicles: [], stale: discovery.stale || types.stale || coverageStale, skipped: true };
  }

  return {
    observedAt: statusObservedAt(status.data),
    vehicles: await pricedScooters(plans, (prices, unlisted) => filterVehicles(
      system.id,
      rawVehicles(status.data),
      typesById,
      query,
      prices,
      undefined,
      unlisted
    )),
    stale: discovery.stale || types.stale || coverageStale || status.stale,
  };
}

async function fetchNationalVehicles(query: FeedQuery): Promise<SourceVehicles> {
  const registry = await fetchJson<RegistryFeed>(NATIONAL_V23_REGISTRY_URL, {
    validate: validateRegistry,
    authenticated: true,
    revalidate: METADATA_REVALIDATE_SECONDS,
  });

  const systems =
    (registry.data.systems ?? [])
      .map(system => registrySystem(system.id, system.url))
      .filter((system): system is NationalSystem => (
        system !== null &&
        (!query.providers || query.providers.has(system.provider))
      ));

  if (systems.length === 0) {
    return { vehicles: [], stale: registry.stale, skipped: true };
  }

  const results = await Promise.allSettled(
    systems.map(system => fetchSystemVehicles(system, query))
  );

  const availableResults: SourceVehicles[] = [];
  const fulfilledResults: SourceVehicles[] = [];
  const failedSources: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      fulfilledResults.push(result.value);
      if (!result.value.skipped) availableResults.push(result.value);
      return;
    }

    failedSources.push(`national:${systems[index].id}`);
    logFallback(systems[index].id, result.reason);
  });

  if (availableResults.length === 0) {
    if (failedSources.length > 0) {
      throw new Error('Every relevant national GBFS system failed or was unavailable');
    }
    return {
      vehicles: [],
      stale: registry.stale || fulfilledResults.some(result => result.stale),
      skipped: true,
    };
  }

  return {
    observedAt: Math.min(...availableResults.map(result => result.observedAt ?? Date.now())),
    vehicles: availableResults.flatMap(result => result.vehicles),
    stale: registry.stale || availableResults.some(result => result.stale),
    failedSources,
  };
}

async function fetchHoppVehicles(query: FeedQuery): Promise<SourceVehicles> {
  if (query.providers && !query.providers.has('hopp')) {
    return { vehicles: [], stale: false, skipped: true };
  }

  const towns = HOPP_SWISS_TOWNS.filter(town => coverageIntersects([town.coverage], query.bounds));
  if (towns.length === 0) {
    return { vehicles: [], stale: false, skipped: true };
  }

  const results = await Promise.allSettled(towns.map(town => fetchHoppTownVehicles(town, query)));
  const served: SourceVehicles[] = [];
  const failedSources: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (!result.value.skipped) served.push(result.value);
      return;
    }
    failedSources.push(`hopp:${towns[index].id}`);
    logFallback(towns[index].id, result.reason);
  });
  if (served.length === 0) {
    if (failedSources.length > 0) throw new ScooterFeedsUnavailableError(failedSources);
    return { vehicles: [], stale: false, skipped: true };
  }
  return {
    observedAt: Math.min(...served.map(result => result.observedAt ?? Date.now())),
    vehicles: served.flatMap(result => result.vehicles),
    stale: served.some(result => result.stale),
    failedSources,
  };
}

async function fetchHoppTownVehicles(
  town: (typeof HOPP_SWISS_TOWNS)[number],
  query: FeedQuery
): Promise<SourceVehicles> {
  const discovery = await fetchJson<DiscoveryFeed>(town.discoveryUrl, {
    validate: validateDiscovery,
    revalidate: METADATA_REVALIDATE_SECONDS,
  });
  const entries = discoveryFeedEntries(discovery.data);
  const baseUrl = new URL('.', town.discoveryUrl).toString();
  const statusUrl = discoveredFeedUrl(entries, 'free_bike_status', baseUrl);
  const typesUrl = discoveredFeedUrl(entries, 'vehicle_types', baseUrl);
  const pricingUrl = discoveredFeedUrl(entries, 'system_pricing_plans', baseUrl);
  if (!statusUrl || !typesUrl) {
    throw new Error(`${town.id} discovery contains no supported scooter feeds`);
  }

  const [status, types, plans] = await Promise.all([
    fetchJson<StatusFeed>(statusUrl, { validate: validateVehicleStatus, revalidate: STATUS_REVALIDATE_SECONDS }),
    fetchScooterTypes(typesUrl, 'hopp'),
    fetchPricingPlans(pricingUrl, { source: town.id, country: 'CH' }),
  ]);
  const typesById = types.byId;
  if (!types.hasScooter) {
    return { vehicles: [], stale: discovery.stale || types.stale, skipped: true };
  }

  return {
    observedAt: statusObservedAt(status.data),
    // Hopp's bike ids are UUIDs, unique across its towns, so they keep the plain "hopp" prefix.
    vehicles: await pricedScooters(plans, (prices, unlisted) => filterVehicles(
      'hopp',
      rawVehicles(status.data),
      typesById,
      query,
      prices,
      undefined,
      unlisted
    )),
    stale: discovery.stale || status.stale || types.stale,
  };
}

async function fetchPubliBikeFreeFloatingVehicles(
  query: FeedQuery
): Promise<SourceVehicles> {
  if (query.providers && !query.providers.has('publibike')) {
    return { vehicles: [], stale: false, skipped: true };
  }

  if (!coverageIntersects([PUBLIBIKE_FREE_FLOATING_COVERAGE], query.bounds)) {
    return { vehicles: [], stale: false, skipped: true };
  }

  const result = await fetchJson<unknown>(PUBLIBIKE_FREE_FLOATING_URL, {
    revalidate: STATUS_REVALIDATE_SECONDS,
  });
  if (!Array.isArray(result.data)) {
    throw new Error('PubliBike free-floating response is not an array');
  }

  const vehicles: Vehicle[] = [];
  for (const raw of result.data as PubliBikeFreeFloatingVehicle[]) {
    const lat = raw.latitude;
    const lng = raw.longitude;
    if (
      raw.type !== PUBLIBIKE_ESCOOTER_TYPE ||
      typeof raw.id !== 'string' || raw.id.length === 0 ||
      lat == null || lng == null ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      !boundsContainPoint(PUBLIBIKE_FREE_FLOATING_COVERAGE, lat, lng) ||
      !boundsContainPoint(query.bounds, lat, lng)
    ) continue;

    const distance = query.origin
      ? Math.round(haversineM(query.origin[0], query.origin[1], lat, lng) * 10) / 10
      : null;
    vehicles.push({
      provider: 'publibike',
      lat,
      lng,
      battery: null,
      range_m: null,
      vehicle_id: `publibike-freefloating:${raw.id}`,
      deep_link: null,
      rental_uris: { ios: null, android: null, web: null },
      distance_m: distance,
    });
  }

  return { vehicles, stale: result.stale, observedAt: result.fetchedAt };
}

// The PubliBike app's station list counts the e-scooters docked at each
// station, without vehicle IDs. Each one becomes a marker at its station,
// numbered so that a count dropping from 3 to 2 removes only the third.
async function fetchPubliBikeStationVehicles(
  query: FeedQuery
): Promise<SourceVehicles> {
  if (query.providers && !query.providers.has('publibike')) {
    return { vehicles: [], stale: false, skipped: true };
  }

  if (!coverageIntersects(PUBLIBIKE_STATION_COVERAGE, query.bounds)) {
    return { vehicles: [], stale: false, skipped: true };
  }

  const result = await fetchJson<unknown>(PUBLIBIKE_STATIONS_URL, {
    revalidate: STATUS_REVALIDATE_SECONDS,
  });
  if (!Array.isArray(result.data)) {
    throw new Error('PubliBike stations response is not an array');
  }

  const vehicles: Vehicle[] = [];
  for (const station of result.data as PubliBikeStation[]) {
    const lat = station.latitude;
    const lng = station.longitude;
    const count = station.available_vehicles?.find(entry => entry.type === PUBLIBIKE_ESCOOTER_TYPE)?.count;
    if (
      station.out_of_service !== false ||
      typeof station.id !== 'string' || station.id.length === 0 ||
      !Number.isInteger(count) || count! <= 0 || count! > STATION_MAX_SCOOTERS ||
      lat == null || lng == null ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      !PUBLIBIKE_STATION_COVERAGE.some(bounds => boundsContainPoint(bounds, lat, lng)) ||
      !boundsContainPoint(query.bounds, lat, lng)
    ) continue;

    const distance = query.origin
      ? Math.round(haversineM(query.origin[0], query.origin[1], lat, lng) * 10) / 10
      : null;
    for (let index = 1; index <= count!; index++) {
      vehicles.push({
        provider: 'publibike',
        lat,
        lng,
        battery: null,
        range_m: null,
        vehicle_id: `publibike-station:${station.id}:${index}`,
        deep_link: null,
        rental_uris: { ios: null, android: null, web: null },
        distance_m: distance,
      });
    }
  }

  return { vehicles, stale: result.stale, observedAt: result.fetchedAt };
}

// Zürich's free-floating scooters and the station scooters of Biel and Locarno
// come from two endpoints of the same app; their areas do not overlap.
async function fetchPubliBikeVehicles(query: FeedQuery): Promise<SourceVehicles> {
  const results = await Promise.all([fetchPubliBikeFreeFloatingVehicles(query), fetchPubliBikeStationVehicles(query)]);
  const available = results.filter(result => !result.skipped);
  if (!available.length) return { vehicles: [], stale: false, skipped: true };
  return {
    observedAt: Math.min(...available.map(result => result.observedAt ?? Date.now())),
    vehicles: available.flatMap(result => result.vehicles),
    stale: available.some(result => result.stale),
  };
}

async function fetchRegionalSystemVehicles(
  system: RegionalScooterSystem,
  query: FeedQuery
): Promise<SourceVehicles> {
  const bounds = boundsIntersection(system.bounds, query.bounds);
  if (!bounds) return { vehicles: [], stale: false, skipped: true };
  return fetchRegionalSystemFeeds(system, query, bounds).catch(skipPausedDottRegion);
}

async function fetchRegionalSystemFeeds(
  system: RegionalScooterSystem,
  query: FeedQuery,
  bounds: MapBounds
): Promise<SourceVehicles> {
  const baseUrl = new URL('.', system.discoveryUrl).toString();
  const discovery = await fetchJson<DiscoveryFeed>(system.discoveryUrl, {
    validate: validateDiscovery,
    revalidate: METADATA_REVALIDATE_SECONDS,
  });
  const entries = discoveryFeedEntries(discovery.data);
  const statusUrl = discoveredFeedUrl(entries, 'vehicle_status', baseUrl) ??
    discoveredFeedUrl(entries, 'free_bike_status', baseUrl);
  const typesUrl = discoveredFeedUrl(entries, 'vehicle_types', baseUrl);
  if (!statusUrl || !typesUrl) {
    throw new Error(`${system.id} discovery contains no supported scooter feeds`);
  }

  const types = await fetchScooterTypes(typesUrl, system.provider);
  const typesById = types.byId;
  if (!types.hasScooter) {
    return { vehicles: [], stale: discovery.stale || types.stale, skipped: true };
  }

  const [status, plans, docked] = await Promise.all([
    fetchJson<StatusFeed>(statusUrl, {
      validate: value => { if (!isEmptyUndatedStatus(value)) validateVehicleStatus(value); },
      revalidate: STATUS_REVALIDATE_SECONDS,
    }),
    // Another operator's feed prices the ride at its own fares, not the ones the provider's riders pay.
    fetchPricingPlans(system.feedOperator ? null : discoveredFeedUrl(entries, 'system_pricing_plans', baseUrl), {
      source: system.id,
      country: system.country,
    }),
    system.stationScooters ? fetchDockedScooters(system, entries, baseUrl, typesById) : undefined,
  ]);
  if (!Array.isArray(status.data.data?.bikes) && !Array.isArray(status.data.data?.vehicles)) {
    throw new Error(`${system.id} status contains no vehicle array`);
  }
  // No scooter out and no time: Bird's town out of season or under snow is empty, not failing.
  if (isEmptyUndatedStatus(status.data)) {
    return { vehicles: [], stale: discovery.stale || types.stale || status.stale, skipped: true };
  }

  const raw = docked ? [...rawVehicles(status.data), ...docked.vehicles] : rawVehicles(status.data);
  return {
    observedAt: Math.min(statusObservedAt(status.data), docked?.observedAt ?? Infinity),
    vehicles: (await pricedScooters(plans, (prices, unlisted) => filterVehicles(system.id, raw, typesById, {
      ...query,
      bounds,
    }, prices, unlinkedScooterPlan(system.provider, typesById, prices), unlisted)))
      .filter(vehicle => systemServesPoint(system, vehicle.lat, vehicle.lng)),
    stale: discovery.stale || types.stale || status.stale || Boolean(docked?.stale),
  };
}

/** The scooters docked at the stations of a system whose catalog entry has stationScooters. */
async function fetchDockedScooters(
  system: RegionalScooterSystem,
  entries: DiscoveryFeedEntry[],
  baseUrl: string,
  types: Map<string, VehicleType>
): Promise<{ vehicles: RawVehicle[]; observedAt: number; stale: boolean }> {
  const informationUrl = discoveredFeedUrl(entries, 'station_information', baseUrl);
  const statusUrl = discoveredFeedUrl(entries, 'station_status', baseUrl);
  if (!informationUrl || !statusUrl) {
    throw new Error(`${system.id} discovery contains no station feeds`);
  }
  const [information, status] = await Promise.all([
    fetchJson<StationInformationFeed>(informationUrl, { validate: validateStations, revalidate: METADATA_REVALIDATE_SECONDS }),
    fetchJson<StationStatusFeed>(statusUrl, {
      validate: value => { validateStations(value); statusObservedAt(value); },
      revalidate: STATUS_REVALIDATE_SECONDS,
    }),
  ]);
  return {
    vehicles: dockedScooters(information.data, status.data, typeId => isElectricScooter(types.get(typeId), system.provider)),
    observedAt: statusObservedAt(status.data),
    stale: information.stale || status.stale,
  };
}

// Dott pauses a region out of season, as Tignes until the snow, and answers
// 403 ERR_REGION_OFFLINE until it reopens: no scooters there, not a broken feed.
function skipPausedDottRegion(error: unknown): SourceVehicles {
  if (
    error instanceof UpstreamHttpError && error.status === 403 &&
    error.host === 'gbfs.api.ridedott.com' && error.code === 'ERR_REGION_OFFLINE'
  ) return { vehicles: [], stale: false, skipped: true };
  throw error;
}

async function fetchRegionalVehicles(query: FeedQuery, country: ScooterCountry): Promise<SourceVehicles> {
  const systems = REGIONAL_SCOOTER_SYSTEMS.filter(system => (
    system.country === country && (!query.providers || query.providers.has(system.provider)) &&
    coverageIntersects(serviceAreas(system).map(area => area.bounds), query.bounds)
  ));
  if (systems.length === 0) return { vehicles: [], stale: false, skipped: true };

  const available: SourceVehicles[] = [];
  const failedSources: string[] = [];
  // Country-level views should not open dozens of concurrent upstream requests.
  let nextSystem = 0;
  await Promise.all(Array.from({ length: Math.min(4, systems.length) }, async () => {
    while (nextSystem < systems.length) {
      const system = systems[nextSystem++];
      try {
        available.push(await fetchRegionalSystemVehicles(system, query));
      } catch (error) {
        const id = `${regionalSource(system)}:${system.id}`;
        // In its seasonal pause, an operator is expected to be quiet (seasonalPauses.ts).
        if (!feedPaused(id, Date.now())) failedSources.push(id);
        logFallback(system.id, error);
      }
    }
  }));

  const served = available.filter(result => !result.skipped);
  if (served.length === 0 && failedSources.length > 0) {
    throw new ScooterFeedsUnavailableError(failedSources.sort());
  }
  return {
    observedAt: Math.min(...served.map(result => result.observedAt ?? Date.now())),
    vehicles: served.flatMap(result => result.vehicles),
    stale: served.some(result => result.stale),
    skipped: served.length === 0,
    failedSources: failedSources.sort(),
  };
}

function nationalSourceIsRelevant(query: FeedQuery): boolean {
  if (!coverageIntersects([SWISS_MOBILITY_BOUNDS], query.bounds)) return false;
  if (!query.providers) return true;
  return [...query.providers].some(provider => !['hopp', 'pony', 'zeus'].includes(provider));
}

function sourceStatus(result: PromiseSettledResult<SourceVehicles>): FeedSourceStatus {
  if (result.status === 'rejected') return 'failed';
  if (result.value.skipped) return 'skipped';
  if (result.value.failedSources?.length) return 'partial';
  return result.value.stale ? 'stale' : 'fresh';
}

function compareVehicles(a: Vehicle, b: Vehicle): number {
  if (a.distance_m !== null && b.distance_m !== null && a.distance_m !== b.distance_m) {
    return a.distance_m - b.distance_m;
  }
  if (a.distance_m !== null) return -1;
  if (b.distance_m !== null) return 1;

  return a.provider.localeCompare(b.provider) ||
    (a.vehicle_id ?? '').localeCompare(b.vehicle_id ?? '') ||
    a.lat - b.lat ||
    a.lng - b.lng;
}

function logSourceFailure(source: string, reason: unknown): void {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.error(JSON.stringify({ event: 'scooter_feed_failure', source, message }));
}

function logFallback(source: string, reason: unknown): void {
  const message = reason instanceof Error ? reason.message : String(reason);
  console.warn(JSON.stringify({ event: 'scooter_feed_fallback', source, message }));
}

export async function fetchScooters(query: FeedQuery): Promise<ScooterFetchResult> {
  if (query.outsideCoverage) {
    return {
      vehicles: [],
      meta: {
        partial: false,
        stale: false,
        failedSources: [],
        sources: skippedSources(),
      },
    };
  }

  const countries = Object.keys(COUNTRY_SOURCES) as ScooterCountry[];
  const [nationalResult, hoppResult, publibikeResult, ...countryResults] = await Promise.allSettled([
    nationalSourceIsRelevant(query)
      ? fetchNationalVehicles({
        ...query,
        bounds: boundsIntersection(query.bounds, SWISS_MOBILITY_BOUNDS)!,
      })
      : Promise.resolve<SourceVehicles>({ vehicles: [], stale: false, skipped: true }),
    fetchHoppVehicles(query),
    fetchPubliBikeVehicles(query),
    ...countries.map(country => fetchRegionalVehicles(query, country)),
  ]);

  const sourceResults: Array<readonly [ScooterSource, PromiseSettledResult<SourceVehicles>]> = [
    ['national', nationalResult],
    ['hopp', hoppResult],
    ['publibike', publibikeResult],
    ...countries.map((country, index) => [COUNTRY_SOURCES[country], countryResults[index]] as const),
  ];
  const failedSources: string[] = [];
  let rejectedSourceCount = 0;
  for (const [source, result] of sourceResults) {
    if (result.status === 'rejected') {
      rejectedSourceCount++;
      logSourceFailure(source, result.reason);
      failedSources.push(...(result.reason instanceof ScooterFeedsUnavailableError
        ? result.reason.failedSources
        : [source]));
    }
  }

  const attemptedSourceCount = sourceResults.filter(([, result]) => (
    result.status === 'rejected' || !result.value.skipped
  )).length;
  if (attemptedSourceCount > 0 && rejectedSourceCount === attemptedSourceCount) {
    throw new ScooterFeedsUnavailableError(failedSources);
  }

  for (const [, result] of sourceResults) {
    if (result.status === 'fulfilled') {
      failedSources.push(...(result.value.failedSources ?? []));
    }
  }

  const vehicles = sourceResults.flatMap(([, result]) => (
    result.status === 'fulfilled' ? result.value.vehicles : []
  ));

  const unique = new Map<string, Vehicle>();
  for (const vehicle of vehicles) {
    const key = vehicle.vehicle_id
      ? `${vehicle.provider}:${vehicle.vehicle_id}`
      : `${vehicle.provider}:${vehicle.lat}:${vehicle.lng}`;
    unique.set(key, vehicle);
  }

  const filtered = [...unique.values()]
    .filter(vehicle => (
      query.minBattery === 0 ||
      (vehicle.battery !== null && vehicle.battery >= query.minBattery)
    ))
    .sort(compareVehicles);

  const sources = Object.fromEntries(sourceResults.map(([source, result]) => [source, sourceStatus(result)])) as
    Record<ScooterSource, FeedSourceStatus>;
  return {
    vehicles: filtered,
    meta: {
      expiresAt: new Date(Math.min(Date.now(), ...sourceResults.flatMap(([, result]) =>
        result.status === 'fulfilled' && !result.value.skipped && result.value.observedAt !== undefined
          ? [result.value.observedAt] : [])) + VEHICLE_MAX_AGE_MS).toISOString(),
      partial: failedSources.length > 0,
      stale: sourceResults.some(([, result]) => result.status === 'fulfilled' && result.value.stale),
      failedSources,
      sources,
    },
  };
}
