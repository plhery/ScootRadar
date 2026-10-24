import { SWISS_SCOOTER_AREAS, coverageIntersects } from '@/lib/feedCoverage';
import {
  REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, COUNTRY_SOURCES, collectsParking, isAppMapFeed, isRegionalSource, regionalCityId,
  serviceAreas,
} from '@/lib/regionalScooterSystems';
import { boundsContainPoint, haversineM } from '@/lib/geo';
import { CITY_OVERVIEW_MAX_ZOOM, providersForViewport } from '@/lib/mapCoverage';
import { PARKING_MAX_AGE_MS, PARKING_MIN_ZOOM, type ParkingSnapshot } from '@/lib/parking';
import { scooterResponse } from '@/lib/scooterResponse';
import { snapshotPaused } from '@/lib/seasonalPauses';
import { skippedSources } from '@/lib/scooterSources';
import { outlinedTown } from '@/lib/townOutlines';
import { ScooterFeedsUnavailableError, type FeedQuery, type ScooterFetchMetadata } from '@/lib/scooterFeeds';
import type { MapBounds, ScooterCluster, ScooterResponse, ScooterResponseMeta, Vehicle } from '@/lib/types';
import { LAST_SEEN_MAX_AGE_MS, VEHICLE_MAX_AGE_MS } from './dataFreshness';

export { LAST_SEEN_MAX_AGE_MS, VEHICLE_MAX_AGE_MS } from './dataFreshness';
export const OVERVIEW_REFRESH_MS = 60 * 60_000;
const OVERVIEW_MAX_AGE_MS = 3 * OVERVIEW_REFRESH_MS;
/** The delay a response suggests while the feeds it asked for are being collected again. */
export const REFRESHING_RETRY_SECONDS = 3;

export interface FeedSnapshot {
  parking?: ParkingSnapshot;
  id: string;
  source: keyof ScooterFetchMetadata['sources'];
  provider: string;
  coverage: MapBounds[];
  vehicles: Vehicle[];
  observedAt: number;
  /**
   * An app map's sweep under way: the scooters it has found since it started, and the parts of
   * the area it has finished. The map shows them before the sweep ends; its end replaces them.
   */
  sweep?: { startedAt: number; vehicles: Vehicle[]; swept: MapBounds[] };
  attemptedAt: number;
  /** When the last successful collection finished; absent from snapshots saved before it existed. */
  collectedAt?: number;
  stale: boolean;
  failed: boolean;
  skipped: boolean;
  /**
   * The operator says the feed's season is over (Whoosh's seasonIsOver): a pause it declares,
   * which ends when it says the season is open again (seasonalPauses.ts).
   */
  seasonOver?: boolean;
}

interface CityTotals {
  id: string;
  city: string;
  lat: number;
  lng: number;
  // Bins 0..100 hold known battery percentages; bin 101 is unknown.
  batteries: Record<string, number[]>;
  sources: ScooterFetchMetadata['sources'];
  failedSources: string[];
}

export interface MobilitySnapshot {
  version: 1;
  updatedAt: number;
  feeds: FeedSnapshot[];
  // feedIds lists the feeds the city totals were built from.
  overview: { generatedAt: number; feedIds: string[]; cities: CityTotals[] };
}

function emptyHealth(): ScooterFetchMetadata {
  return { partial: false, stale: false, failedSources: [],
    sources: skippedSources() };
}

/** One scooter, whichever feeds list it. */
const vehicleKey = (vehicle: Vehicle) => `${vehicle.provider}:${vehicle.vehicle_id ?? `${vehicle.lat}:${vehicle.lng}`}`;

/** Whether a feed's positions are recent enough to show on the map. */
export const showsPositions = (feed: FeedSnapshot, now: number) => now - feed.observedAt <= VEHICLE_MAX_AGE_MS;

/** The sweep under way that the map shows, of a feed whose last positions are too old to. */
const shownSweep = (feed: FeedSnapshot, now: number) =>
  !showsPositions(feed, now) && feed.sweep && now - feed.sweep.startedAt <= VEHICLE_MAX_AGE_MS ? feed.sweep : undefined;

/**
 * Whether an app map's last positions stand, faded, where its scooters were last seen: those too
 * old to show, of three hours at most, while a request has it collected again. Its slow sweeps
 * would otherwise leave the map empty of it for minutes. Only the app maps, which no licence
 * binds to fifteen minutes.
 */
export const showsLastSeen = (feed: FeedSnapshot, now: number, refreshing?: ReadonlySet<string>) =>
  !feed.skipped && isAppMapFeed(feed) && !showsPositions(feed, now) && now - feed.observedAt <= LAST_SEEN_MAX_AGE_MS &&
  feed.vehicles.length > 0 && refreshing?.has(feed.id) === true;

/**
 * Whether the operator's feed failed its last collection (an error, a missing
 * file, an old timestamp), unlike one the cache has yet to collect.
 */
const failedAtOperator = (feed: FeedSnapshot) => feed.failed && feed.attemptedAt > 0;

/**
 * A feed in its seasonal pause that serves nothing and is not on its way is expected to be quiet:
 * neither failed nor served, as if it had not been asked (seasonalPauses.ts).
 */
function quietInPause(feed: FeedSnapshot, now: number, usable: (feed: FeedSnapshot) => boolean,
  refreshing?: ReadonlySet<string>): boolean {
  return !usable(feed) && (feed.failed || !refreshing?.has(feed.id)) && snapshotPaused(feed, now);
}

/**
 * The feeds in view whose operator says their season is over, whichever providers are shown: the
 * dock shows their town paused for the season (seasonalPauses.ts).
 */
function seasonOverIn(snapshot: MobilitySnapshot, bounds: MapBounds): Pick<ScooterResponseMeta, 'seasonOver'> {
  const seasonOver = snapshot.feeds.filter(feed => feed.seasonOver && coverageIntersects(feed.coverage, bounds))
    .map(feed => feed.id).sort();
  return seasonOver.length ? { seasonOver } : {};
}

/**
 * `usable` decides which feeds count. `refreshing` lists feeds being collected
 * again for this request: one whose last collection succeeded and whose
 * positions are merely old, or one not collected yet, is on its way, not
 * failed, and makes its source stale.
 */
function healthFor(feeds: FeedSnapshot[], now: number, usable: (feed: FeedSnapshot) => boolean = feed => showsPositions(feed, now),
  refreshing?: ReadonlySet<string>): ScooterFetchMetadata {
  const meta = emptyHealth();
  for (const source of Object.keys(meta.sources) as Array<keyof typeof meta.sources>) {
    const relevant = feeds.filter(feed => feed.source === source && !feed.skipped && !quietInPause(feed, now, usable, refreshing));
    if (!relevant.length) continue;
    const served = relevant.filter(usable);
    const coming = relevant.filter(feed => !usable(feed) && !failedAtOperator(feed) && refreshing?.has(feed.id));
    const failed = relevant.filter(feed => (feed.failed || !usable(feed)) && !coming.includes(feed));
    // A successfully collected feed is not a fallback just because its provider
    // publishes every few minutes. Observation age still controls hard expiry.
    const stale = served.some(feed => feed.stale || feed.failed) || coming.length > 0;
    meta.sources[source] = served.length + coming.length === 0 ? 'failed' : failed.length ? 'partial' : stale ? 'stale' : 'fresh';
    meta.failedSources.push(...failed.map(feed => feed.id));
    meta.stale ||= stale;
  }
  meta.partial = meta.failedSources.length > 0;
  return meta;
}

const regionalCities = REGIONAL_SCOOTER_CITIES;

/**
 * `counts` decides which feeds the city totals count. By default those whose
 * positions the map shows; the cache also counts an idle feed whose positions
 * are older but whose collections are on time, as totals are not positions.
 */
export function overviewNeedsRefresh(snapshot: MobilitySnapshot | undefined, feeds: FeedSnapshot[], now: number,
  counts: (feed: FeedSnapshot) => boolean = feed => showsPositions(feed, now)): boolean {
  if (!snapshot || snapshot.overview.cities.length !== regionalCities.length + SWISS_SCOOTER_AREAS.length ||
    now - snapshot.overview.generatedAt >= OVERVIEW_REFRESH_MS) return true;
  // A feed discovered or retired since the totals were built would be missing from them or linger.
  // Totals saved before feedIds existed list none, so they refresh once.
  const built = new Set(snapshot.overview.feedIds);
  if (built.size !== feeds.length || feeds.some(feed => !built.has(feed.id))) return true;
  const recovered = new Set(feeds.filter(feed => !feed.failed && counts(feed)).map(feed => feed.id));
  return snapshot.overview.cities.some(city => city.failedSources.some(id => recovered.has(id)));
}

interface OverviewTown {
  id: string;
  center: number[];
  bounds: MapBounds;
}

const areaKey = (bounds: MapBounds) => `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
// The town of each service area the catalogs review for a feed, found by its
// bounds, which the feed's snapshot keeps as its coverage. Not the Swiss areas:
// they are generous envelopes around towns, and a Swiss system is given one by
// its name, though Bolt Zürich, for one, also runs Opfikon and Kloten.
const TOWNS_OF_AREA = new Map<string, Set<string>>();
for (const system of REGIONAL_SCOOTER_SYSTEMS) {
  for (const area of serviceAreas(system)) {
    const key = areaKey(area.bounds);
    TOWNS_OF_AREA.set(key, (TOWNS_OF_AREA.get(key) ?? new Set()).add(regionalCityId(system, area)));
  }
}

/** The towns of the service areas a feed was reviewed for. */
function ownTowns(feed: FeedSnapshot): Set<string> {
  return new Set(feed.coverage.flatMap(bounds => [...TOWNS_OF_AREA.get(areaKey(bounds)) ?? []]));
}

function nearestTown<T extends OverviewTown>(vehicle: Vehicle, towns: T[]): T {
  return towns.reduce((nearest, candidate) => (
    haversineM(vehicle.lat, vehicle.lng, candidate.center[0], candidate.center[1]) <
    haversineM(vehicle.lat, vehicle.lng, nearest.center[0], nearest.center[1]) ? candidate : nearest
  ));
}

/**
 * The town a scooter counts under: the town whose outline holds it, where the
 * towns' bounds overlap too much to tell them apart, as around Tel Aviv or
 * Lille (townOutlines.ts); else the nearest centre among the towns whose bounds
 * hold it, those of its own feed first, or the nearest centre of all when none
 * does. The nearest centre alone is not enough: most of east Oslo is nearer
 * Lørenskog's, and much of Lisbon nearer Almada's across the river.
 */
function townOf<T extends OverviewTown>(vehicle: Vehicle, towns: T[], own: Set<string>): T {
  const outlined = outlinedTown(towns, vehicle.lat, vehicle.lng);
  if (outlined) return outlined;
  const holding = towns.filter(town => boundsContainPoint(town.bounds, vehicle.lat, vehicle.lng));
  const owned = holding.filter(town => own.has(town.id));
  return nearestTown(vehicle, owned.length ? owned : holding.length ? holding : towns);
}

export function buildCityOverview(feeds: FeedSnapshot[], now: number,
  counts: (feed: FeedSnapshot) => boolean = feed => showsPositions(feed, now)): MobilitySnapshot['overview'] {
  const totals = new Map<string, CityTotals>();
  for (const city of [...regionalCities, ...SWISS_SCOOTER_AREAS]) {
    const country = regionalCities.find(candidate => candidate.id === city.id)?.country;
    const countrySource = country ? COUNTRY_SOURCES[country] : null;
    const relevant = feeds.filter(feed => (countrySource ? feed.source === countrySource : !isRegionalSource(feed.source)) && coverageIntersects(feed.coverage, city.bounds));
    const health = healthFor(relevant, now, counts);
    totals.set(city.id, { id: city.id, city: city.city, lat: city.center[0], lng: city.center[1],
      batteries: {}, sources: health.sources, failedSources: health.failedSources });
  }
  const seen = new Set<string>();
  for (const feed of feeds) {
    if (feed.skipped || !counts(feed)) continue;
    const cities = isRegionalSource(feed.source)
      ? regionalCities.filter(city => COUNTRY_SOURCES[city.country] === feed.source) : SWISS_SCOOTER_AREAS;
    if (!cities.length) continue;
    const own = ownTowns(feed);
    for (const vehicle of feed.vehicles) {
      const key = vehicleKey(vehicle);
      if (seen.has(key)) continue;
      seen.add(key);
      // Assign each scooter once, including where neighbouring service areas overlap.
      const total = totals.get(townOf(vehicle, cities, own).id)!;
      const bins = total.batteries[vehicle.provider] ??= Array<number>(102).fill(0);
      bins[vehicle.battery ?? 101]++;
    }
  }
  return { generatedAt: now, feedIds: feeds.map(feed => feed.id), cities: [...totals.values()].sort((a, b) => a.id.localeCompare(b.id)) };
}

function overviewResponse(snapshot: MobilitySnapshot, query: FeedQuery, zoom: number, now: number): ScooterResponse {
  if (now - snapshot.overview.generatedAt > OVERVIEW_MAX_AGE_MS) {
    throw new ScooterFeedsUnavailableError(['city-overview']);
  }
  const clusters: ScooterCluster[] = [];
  const providers: Record<string, number> = {};
  const meta = emptyHealth();
  for (const city of snapshot.overview.cities) {
    if (!boundsContainPoint(query.bounds, city.lat, city.lng)) continue;
    const counts: Record<string, number> = {};
    for (const [provider, bins] of Object.entries(city.batteries)) {
      if (query.providers && !query.providers.has(provider)) continue;
      const count = bins.slice(query.minBattery, query.minBattery > 0 ? 101 : 102).reduce((a, b) => a + b, 0);
      if (count > 0) {
        counts[provider] = count;
        providers[provider] = (providers[provider] ?? 0) + count;
      }
    }
    const count = Object.values(counts).reduce((a, b) => a + b, 0);
    if (count) clusters.push({ id: `city:${city.id}`, city: city.city, lat: city.lat, lng: city.lng, count, providers: counts });
    for (const source of Object.keys(meta.sources) as Array<keyof typeof meta.sources>) {
      const status = city.sources[source] ?? 'skipped';
      const previous = meta.sources[source];
      if (status === 'skipped') continue;
      meta.sources[source] = previous === 'skipped' || previous === status ? status
        : previous === 'failed' || status === 'failed' || previous === 'partial' || status === 'partial' ? 'partial'
          : previous === 'stale' || status === 'stale' ? 'stale' : 'fresh';
    }
    meta.failedSources.push(...city.failedSources);
  }
  meta.failedSources = [...new Set(meta.failedSources)];
  meta.partial = meta.failedSources.length > 0;
  meta.stale = Object.values(meta.sources).some(source => source === 'stale') || now - snapshot.overview.generatedAt > OVERVIEW_REFRESH_MS + 120_000;
  const attempted = Object.values(meta.sources).filter(source => source !== 'skipped');
  // As at street zoom: an operator whose feed fails is named, so the map says it is not sharing data.
  const failing = new Set(snapshot.feeds.filter(failedAtOperator).map(feed => feed.id));
  if (attempted.length > 0 && attempted.every(source => source === 'failed') && !meta.failedSources.some(id => failing.has(id))) {
    throw new ScooterFeedsUnavailableError(meta.failedSources);
  }
  return {
    vehicles: [], clusters, providers,
    meta: { ...meta, generatedAt: new Date(snapshot.overview.generatedAt).toISOString(),
      expiresAt: new Date(snapshot.overview.generatedAt + OVERVIEW_MAX_AGE_MS).toISOString(),
      truncated: false, totalVehicles: Object.values(providers).reduce((a, b) => a + b, 0),
      mode: 'clusters', zoom, overview: true, refreshAfterSeconds: 3600,
      availableProviders: providersForViewport(query.bounds), ...seasonOverIn(snapshot, query.bounds) },
  };
}

/**
 * The feeds whose positions answer the query: none for the city totals of
 * the zoomed-out map, which are a snapshot of their own.
 */
export function feedsForQuery(snapshot: MobilitySnapshot, query: FeedQuery, zoom: number | null): FeedSnapshot[] {
  if (query.outsideCoverage || (zoom !== null && zoom <= CITY_OVERVIEW_MAX_ZOOM)) return [];
  return snapshot.feeds.filter(feed => (
    (!query.providers || query.providers.has(feed.provider)) && coverageIntersects(feed.coverage, query.bounds)
  ));
}

export interface SnapshotQueryOptions {
  /**
   * Feeds being collected again for this request, which the response did not
   * wait for. It says so with meta.refreshing and asks to be polled again soon.
   */
  refreshing?: ReadonlySet<string>;
}

export function querySnapshot(snapshot: MobilitySnapshot, query: FeedQuery, zoom: number | null, now = Date.now(),
  options: SnapshotQueryOptions = {}): ScooterResponse {
  if (query.outsideCoverage) return scooterResponse({ vehicles: [], meta: emptyHealth() }, zoom, { availableProviders: [] });
  if (zoom !== null && zoom <= CITY_OVERVIEW_MAX_ZOOM) return overviewResponse(snapshot, query, zoom, now);
  const relevant = feedsForQuery(snapshot, query, zoom);
  const meta = healthFor(relevant, now, undefined, options.refreshing);
  const refreshing = relevant.some(feed => !feed.skipped && options.refreshing?.has(feed.id));
  // A city whose every feed is in its seasonal pause has nothing to show, which is no failure.
  const asked = relevant.filter(feed => !feed.skipped && !quietInPause(feed, now, candidate => showsPositions(candidate, now), options.refreshing));
  // Nothing to show is unavailable only while the cache is behind or starting. When an operator's
  // feed fails, the answer names it, and the map says who is not sharing data rather than
  // that it could not refresh.
  if (asked.length > 0 && !refreshing && asked.every(feed => !showsPositions(feed, now) && !failedAtOperator(feed))) {
    throw new ScooterFeedsUnavailableError(meta.failedSources);
  }
  const pick = (into: Map<string, Vehicle>, vehicles: Vehicle[], skip?: (vehicle: Vehicle, key: string) => boolean) => {
    for (const vehicle of vehicles) {
      if (!boundsContainPoint(query.bounds, vehicle.lat, vehicle.lng)) continue;
      if (query.minBattery > 0 && (vehicle.battery === null || vehicle.battery < query.minBattery)) continue;
      const key = vehicleKey(vehicle);
      if (skip?.(vehicle, key)) continue;
      into.set(key, query.origin ? { ...vehicle,
        distance_m: Math.round(haversineM(...query.origin, vehicle.lat, vehicle.lng) * 10) / 10,
      } : vehicle);
    }
  };
  const unique = new Map<string, Vehicle>();
  // When each feed's positions shown were seen: its last collection's, or its sweep's under way.
  const shownSince: number[] = [];
  for (const feed of relevant) {
    if (feed.skipped) continue;
    const sweep = shownSweep(feed, now);
    if (showsPositions(feed, now)) shownSince.push(feed.observedAt);
    else if (sweep) shownSince.push(sweep.startedAt);
    else continue;
    pick(unique, sweep?.vehicles ?? feed.vehicles);
  }
  // Each scooter last seen where the sweep under way has yet to look, unless it has been seen since.
  const lastSeen = new Map<string, Vehicle>();
  const lastSeenTimes: number[] = [];
  for (const feed of relevant) {
    if (!showsLastSeen(feed, now, options.refreshing)) continue;
    const swept = shownSweep(feed, now)?.swept ?? [];
    const before = lastSeen.size;
    pick(lastSeen, feed.vehicles, (vehicle, key) => unique.has(key) ||
      swept.some(part => boundsContainPoint(part, vehicle.lat, vehicle.lng)));
    if (lastSeen.size > before) lastSeenTimes.push(feed.observedAt);
  }
  const vehicles = [...unique.values()];
  const previous = [...lastSeen.values()];
  if (query.origin) for (const list of [vehicles, previous]) list.sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
  const observedAt = Math.min(now, ...shownSince);
  const response = scooterResponse({ vehicles, meta }, zoom, {
    generatedAt: new Date(observedAt).toISOString(),
    expiresAt: new Date(observedAt + VEHICLE_MAX_AGE_MS).toISOString(),
    refreshAfterSeconds: refreshing ? REFRESHING_RETRY_SECONDS : 60,
    ...(refreshing ? { refreshing: true } : {}),
    ...(lastSeenTimes.length ? { lastSeenAt: new Date(Math.min(...lastSeenTimes)).toISOString() } : {}),
    availableProviders: providersForViewport(query.bounds),
    ...seasonOverIn(snapshot, query.bounds),
  }, previous);
  if (zoom !== null && zoom >= PARKING_MIN_ZOOM) {
    // The app maps' feeds collect no parking, so none of theirs is missing.
    const systems = relevant.filter(collectsParking);
    const available = systems.filter(feed => feed.parking && now - feed.parking.observedAt <= PARKING_MAX_AGE_MS);
    response.meta.parkingExpiresAt = new Date(Math.min(now, ...available.map(feed => feed.parking!.observedAt)) + PARKING_MAX_AGE_MS).toISOString();
    response.parking = available.flatMap(feed => feed.parking!.locations)
      .filter(location => boundsContainPoint(query.bounds, location.lat, location.lng));
    response.meta.parkingStatus = !systems.length ? 'skipped' : available.length === 0 ? 'failed'
      : available.length < systems.length ? 'partial' : available.some(feed => feed.parking!.stale) ? 'stale' : 'fresh';
  }
  return response;
}
