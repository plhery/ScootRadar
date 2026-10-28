import { SWISS_SCOOTER_AREAS, coverageIntersects } from '@/lib/feedCoverage';
import {
  REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, COUNTRY_SOURCES, collectsParking, isAppMapFeed, isLimeGroupFeed, isRegionalSource,
  regionalCityId, serviceAreas,
} from '@/lib/regionalScooterSystems';
import { boundsCenter, boundsContainPoint, crossesDateLine, haversineM } from '@/lib/geo';
import { CITY_OVERVIEW_MAX_ZOOM, providersForViewport } from '@/lib/mapCoverage';
import { PARKING_MAX_AGE_MS, PARKING_MIN_ZOOM, type ParkingSnapshot } from '@/lib/parking';
import { scooterResponse } from '@/lib/scooterResponse';
import { snapshotPaused } from '@/lib/seasonalPauses';
import { skippedSources } from '@/lib/scooterSources';
import { outlinedTown } from '@/lib/townOutlines';
import { ScooterFeedsUnavailableError, type FeedQuery, type FeedSourceStatus, type ScooterFetchMetadata } from '@/lib/scooterFeeds';
import type { MapBounds, ScooterCluster, ScooterResponse, ScooterResponseMeta, Vehicle } from '@/lib/types';
import { LAST_SEEN_MAX_AGE_MS, VEHICLE_MAX_AGE_MS } from './dataFreshness';

export { LAST_SEEN_MAX_AGE_MS, VEHICLE_MAX_AGE_MS } from './dataFreshness';
export const OVERVIEW_REFRESH_MS = 60 * 60_000;
const OVERVIEW_MAX_AGE_MS = 3 * OVERVIEW_REFRESH_MS;
/**
 * A failed feed that recovers rebuilds the city totals at most this often. On 25 October 2026, as
 * Italy's 188 Lime groups each came in for the first time, every one rebuilt them, seconds over 935,000
 * scooters, and the cache spent most of its processor on it while other operators' requests timed out.
 */
export const OVERVIEW_RECOVERY_MS = 5 * 60_000;
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
  /** How long its successful collections take, smoothed (collectFeed.ts); absent until one is timed. */
  collectionMs?: number;
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
  // feedIds lists the feeds the city totals were built from. keepUntil: when the oldest data they
  // count of a feed whose data may be kept only so long passes its cap (buildCityOverview).
  overview: { generatedAt: number; feedIds: string[]; cities: CityTotals[]; keepUntil?: number };
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
 * A feed whose collection takes longer than a request can wait for it (COLD_WAIT_MS in
 * server/snapshotServer.ts), as an app map's sweep of a whole town: Lime's, Whoosh's or BinBin's
 * take from 25 seconds to 3 minutes, Dott's or a GBFS feed's under one. Until a collection is timed,
 * an app map's is taken to be.
 */
export const SLOW_COLLECTION_MS = 3_000;
export const collectsSlowly = (feed: FeedSnapshot) =>
  feed.collectionMs !== undefined ? feed.collectionMs > SLOW_COLLECTION_MS : isAppMapFeed(feed);

/**
 * Whether a slow feed's last positions stand, faded, where its scooters were last seen: those too
 * old to show, of `maxAgeMs` at most, while a request has it collected again. Its sweep would
 * otherwise leave the map empty of it for up to minutes. A feed quick to collect is waited for
 * instead. A Lime group a wide view leaves idle (idleInView), which nothing collects for it, shows so
 * whatever its pace.
 */
export const showsLastSeen = (feed: FeedSnapshot, now: number,
  { refreshing, idle }: { refreshing?: ReadonlySet<string>; idle?: ReadonlySet<string> }, maxAgeMs = LAST_SEEN_MAX_AGE_MS) =>
  !feed.skipped && !showsPositions(feed, now) && now - feed.observedAt <= maxAgeMs && feed.vehicles.length > 0 &&
  (idle?.has(feed.id) === true || (collectsSlowly(feed) && refreshing?.has(feed.id) === true));

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
export function overviewNeedsRefresh(snapshot: Pick<MobilitySnapshot, 'overview'> | undefined, feeds: FeedSnapshot[], now: number,
  counts: (feed: FeedSnapshot) => boolean = feed => showsPositions(feed, now)): boolean {
  if (!snapshot || snapshot.overview.cities.length !== regionalCities.length + SWISS_SCOOTER_AREAS.length ||
    now - snapshot.overview.generatedAt >= OVERVIEW_REFRESH_MS) return true;
  // A feed discovered or retired since the totals were built would be missing from them or linger.
  // Totals saved before feedIds existed list none, so they refresh once.
  const built = new Set(snapshot.overview.feedIds);
  if (built.size !== feeds.length || feeds.some(feed => !built.has(feed.id))) return true;
  if (now - snapshot.overview.generatedAt < OVERVIEW_RECOVERY_MS) return false;
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

// The towns whose box holds a point are found through a grid of tenth-degree cells, each listing the
// towns whose box meets it in their order: the city totals ask for every scooter, among up to a few
// hundred towns a country. None for a list with a town across the 180° line: all are tested.
const TOWN_GRIDS = new WeakMap<readonly OverviewTown[], Map<number, OverviewTown[]> | null>();
const GRID_CELLS_PER_DEGREE = 10;
const cellOf = (degrees: number) => Math.floor(degrees * GRID_CELLS_PER_DEGREE);
// Unique for every latitude and for longitudes within 500° either side; undefined past them, or for NaN.
function cellKey(lat: number, lng: number): number | undefined {
  const [row, column] = [cellOf(lat), cellOf(lng)];
  return Math.abs(row) < 1000 && Math.abs(column) < 5000 ? (row + 1000) * 10_000 + column + 5000 : undefined;
}

function townGrid(towns: readonly OverviewTown[]): Map<number, OverviewTown[]> | null {
  if (towns.some(town => crossesDateLine(town.bounds) || cellKey(town.bounds.south, town.bounds.west) === undefined ||
    cellKey(town.bounds.north, town.bounds.east) === undefined)) return null;
  const grid = new Map<number, OverviewTown[]>();
  for (const town of towns) {
    for (let row = cellOf(town.bounds.south); row <= cellOf(town.bounds.north); row++) {
      for (let column = cellOf(town.bounds.west); column <= cellOf(town.bounds.east); column++) {
        const key = (row + 1000) * 10_000 + column + 5000;
        grid.set(key, [...grid.get(key) ?? [], town]);
      }
    }
  }
  return grid;
}

/** The towns whose box holds the point, in their order: as filtering them all would give them. */
function townsHolding<T extends OverviewTown>(towns: readonly T[], lat: number, lng: number): T[] {
  let grid = TOWN_GRIDS.get(towns);
  if (grid === undefined) TOWN_GRIDS.set(towns, grid = townGrid(towns));
  const key = cellKey(lat, lng);
  const candidates = grid && key !== undefined ? (grid.get(key) ?? []) as T[] : towns;
  return candidates.filter(town => boundsContainPoint(town.bounds, lat, lng));
}

// Switzerland's open data and its catalog's app maps, which count in the same towns, its areas.
const isSwissSource = (source: string) => !isRegionalSource(source) || source === COUNTRY_SOURCES.CH;

// Each catalog source's towns, the same list each time, so its grid is built once.
const TOWNS_OF_SOURCE = new Map<string, typeof regionalCities>();
const townsOfSource = (source: string) => TOWNS_OF_SOURCE.get(source) ?? TOWNS_OF_SOURCE.set(source,
  regionalCities.filter(city => COUNTRY_SOURCES[city.country] === source)).get(source)!;

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
  const holding = townsHolding(towns, vehicle.lat, vehicle.lng);
  const owned = holding.filter(town => own.has(town.id));
  return nearestTown(vehicle, owned.length ? owned : holding.length ? holding : towns);
}

/**
 * `retention` gives the cap of a feed whose data may be kept only so long (server/cadence.ts): the
 * totals say, as keepUntil, when the oldest data they count of such a feed passes it.
 */
export function buildCityOverview(feeds: FeedSnapshot[], now: number,
  counts: (feed: FeedSnapshot) => boolean = feed => showsPositions(feed, now),
  retention?: (feedId: string) => number | undefined): MobilitySnapshot['overview'] {
  const steps = cityOverviewSteps(feeds, now, counts, retention);
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

/**
 * buildCityOverview a step at a time: a town's sources, then a feed's scooters. Over a million
 * scooters the whole build takes seconds, which the cache spends between steps on the map's requests.
 */
export function* cityOverviewSteps(feeds: FeedSnapshot[], now: number, counts: (feed: FeedSnapshot) => boolean,
  retention?: (feedId: string) => number | undefined): Generator<void, MobilitySnapshot['overview']> {
  const totals = new Map<string, CityTotals>();
  for (const city of [...regionalCities, ...SWISS_SCOOTER_AREAS]) {
    const country = regionalCities.find(candidate => candidate.id === city.id)?.country;
    const countrySource = country ? COUNTRY_SOURCES[country] : null;
    const relevant = feeds.filter(feed => (countrySource ? feed.source === countrySource : isSwissSource(feed.source)) && coverageIntersects(feed.coverage, city.bounds));
    const health = healthFor(relevant, now, counts);
    totals.set(city.id, { id: city.id, city: city.city, lat: city.center[0], lng: city.center[1],
      batteries: {}, sources: health.sources, failedSources: health.failedSources });
    yield;
  }
  const seen = new Set<string>();
  let keepUntil = Infinity;
  for (const feed of feeds) {
    if (feed.skipped || !counts(feed)) continue;
    const cities = isSwissSource(feed.source) ? SWISS_SCOOTER_AREAS : townsOfSource(feed.source);
    if (!cities.length) continue;
    const cap = feed.vehicles.length ? retention?.(feed.id) : undefined;
    if (cap !== undefined) keepUntil = Math.min(keepUntil, feed.observedAt + cap);
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
    yield;
  }
  return { generatedAt: now, feedIds: feeds.map(feed => feed.id), cities: [...totals.values()].sort((a, b) => a.id.localeCompare(b.id)),
    ...(keepUntil < Infinity ? { keepUntil } : {}) };
}

/**
 * The city totals `built` before, or built again when they need it (overviewNeedsRefresh), or when the
 * oldest data they count of a feed with a retention cap would pass it within `aheadMs`.
 */
export function refreshedOverview(built: MobilitySnapshot['overview'] | undefined, feeds: FeedSnapshot[], now: number,
  counts: (feed: FeedSnapshot) => boolean, retention: (feedId: string) => number | undefined, aheadMs: number): MobilitySnapshot['overview'] {
  return built && !overviewDue(built, feeds, now, counts, aheadMs) ? built : buildCityOverview(feeds, now, counts, retention);
}

/** Whether the city totals `built` need building again, as refreshedOverview decides. */
export function overviewDue(built: MobilitySnapshot['overview'], feeds: FeedSnapshot[], now: number,
  counts: (feed: FeedSnapshot) => boolean, aheadMs: number): boolean {
  return overviewNeedsRefresh({ overview: built }, feeds, now, counts) || (built.keepUntil ?? Infinity) <= now + aheadMs;
}

/** A source's state over two cities, or two sets of feeds, from each one's: as healthFor would give it over both. */
function joinStatus(previous: FeedSourceStatus, status: FeedSourceStatus): FeedSourceStatus {
  return previous === 'skipped' || previous === status ? status
    : status === 'skipped' ? previous
      : previous === 'failed' || status === 'failed' || previous === 'partial' || status === 'partial' ? 'partial'
        : previous === 'stale' || status === 'stale' ? 'stale' : 'fresh';
}

/**
 * The city totals of two sets of feeds built apart, joined: the same as built together, provided no
 * scooter is listed in both sets. As old as the older.
 */
export function joinCityOverviews(a: MobilitySnapshot['overview'], b: MobilitySnapshot['overview']): MobilitySnapshot['overview'] {
  const others = new Map(b.cities.map(city => [city.id, city]));
  const keepUntil = Math.min(a.keepUntil ?? Infinity, b.keepUntil ?? Infinity);
  return { generatedAt: Math.min(a.generatedAt, b.generatedAt), feedIds: [...a.feedIds, ...b.feedIds],
    cities: a.cities.map(city => {
      const other = others.get(city.id);
      if (!other) return city;
      const batteries = { ...city.batteries };
      for (const [provider, bins] of Object.entries(other.batteries)) {
        batteries[provider] = batteries[provider]?.map((count, bin) => count + bins[bin]) ?? bins;
      }
      const sources = { ...city.sources };
      for (const source of Object.keys(sources) as Array<keyof typeof sources>) {
        sources[source] = joinStatus(sources[source], other.sources[source] ?? 'skipped');
      }
      return { ...city, batteries, sources, failedSources: [...city.failedSources, ...other.failedSources] };
    }),
    ...(keepUntil < Infinity ? { keepUntil } : {}) };
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
      meta.sources[source] = joinStatus(meta.sources[source], city.sources[source] ?? 'skipped');
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

/**
 * How many of Lime's refresh groups a request collects again: those nearest the middle of the view,
 * which cover a phone's view at zoom 14. A request keeps its groups collected every minute, at four
 * or five Lime requests each, and Lime's accounts make 36 a minute for every Lime town. On 25
 * October 2026 a view of Berlin asked for its 128 groups: the other Lime towns people looked at
 * waited a quarter of an hour for theirs, and expired, and new towns' first collections stalled.
 */
export const LIME_GROUPS_PER_REQUEST = 6;

/** How far the feed's coverage is from a point, in degrees of latitude: 0 for one that holds it. */
function offPoint(feed: FeedSnapshot, [lat, lng]: [number, number]): number {
  const scale = Math.cos(lat * Math.PI / 180);
  return Math.min(...feed.coverage.map(area => Math.hypot(Math.max(area.south - lat, lat - area.north, 0),
    Math.max(area.west - lng, lng - area.east, 0) * scale)));
}

/**
 * The feeds in view that a request collects again: all but the Lime groups past the
 * LIME_GROUPS_PER_REQUEST nearest the middle of the view. Those stay idle, and the answer shows them
 * as they are (idleInView).
 */
export function demandedFeeds(feeds: FeedSnapshot[], bounds: MapBounds): FeedSnapshot[] {
  const groups = feeds.filter(isLimeGroupFeed);
  if (groups.length <= LIME_GROUPS_PER_REQUEST) return feeds;
  const middle = boundsCenter(bounds);
  const nearest = new Set(groups.map((feed, index) => ({ feed, index, off: offPoint(feed, middle) }))
    .sort((a, b) => a.off - b.off || a.index - b.index).slice(0, LIME_GROUPS_PER_REQUEST).map(({ feed }) => feed));
  return feeds.filter(feed => !isLimeGroupFeed(feed) || nearest.has(feed));
}

/**
 * Until when an answer to the query may be kept (X-Scooter-Keep-Seconds): until the oldest data
 * it holds of a feed whose data may be kept only so long (`retention`, server/cadence.ts) passes
 * its cap; for the zoomed-out map, that of the city totals. undefined for an answer holding none.
 */
export function answerKeepUntil(snapshot: MobilitySnapshot, query: FeedQuery, zoom: number | null, now: number,
  retention: (feedId: string) => number | undefined): number | undefined {
  if (query.outsideCoverage) return undefined;
  if (zoom !== null && zoom <= CITY_OVERVIEW_MAX_ZOOM) return snapshot.overview.keepUntil;
  const until = feedsForQuery(snapshot, query, zoom).flatMap(feed => {
    const cap = retention(feed.id);
    return cap !== undefined && !feed.skipped && feed.vehicles.length && showsPositions(feed, now) ? [feed.observedAt + cap] : [];
  });
  return until.length ? Math.min(...until) : undefined;
}

export interface SnapshotQueryOptions {
  /**
   * Feeds being collected again for this request, which the response did not
   * wait for. It says so with meta.refreshing and asks to be polled again soon.
   */
  refreshing?: ReadonlySet<string>;
  /**
   * Feeds in view the request left idle (demandedFeeds). One whose positions are too old to show
   * stands faded where its scooters were last seen, and counts neither as served nor as failed.
   */
  idleInView?: ReadonlySet<string>;
  /**
   * Of the feeds refreshing, those quick to collect with no positions to show yet: the response
   * asks to be polled again at once (followUpMs 0), and the next request waits for them.
   */
  comingSoon?: ReadonlySet<string>;
  /** How old a slow feed's last positions may be to stand faded: LAST_SEEN_MAX_AGE_MS when not given. */
  lastSeenMaxAgeMs?: (feedId: string) => number | undefined;
}

export function querySnapshot(snapshot: MobilitySnapshot, query: FeedQuery, zoom: number | null, now = Date.now(),
  options: SnapshotQueryOptions = {}): ScooterResponse {
  if (query.outsideCoverage) return scooterResponse({ vehicles: [], meta: emptyHealth() }, zoom, { availableProviders: [] });
  if (zoom !== null && zoom <= CITY_OVERVIEW_MAX_ZOOM) return overviewResponse(snapshot, query, zoom, now);
  const relevant = feedsForQuery(snapshot, query, zoom);
  const counted = relevant.filter(feed => !options.idleInView?.has(feed.id) || showsPositions(feed, now));
  const meta = healthFor(counted, now, undefined, options.refreshing);
  const refreshing = relevant.some(feed => !feed.skipped && options.refreshing?.has(feed.id));
  // A city whose every feed is in its seasonal pause has nothing to show, which is no failure.
  const asked = counted.filter(feed => !feed.skipped && !quietInPause(feed, now, candidate => showsPositions(candidate, now), options.refreshing));
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
  const fading = { refreshing: options.refreshing, idle: options.idleInView };
  for (const feed of relevant) {
    if (!showsLastSeen(feed, now, fading, options.lastSeenMaxAgeMs?.(feed.id))) continue;
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
    ...(refreshing ? { refreshing: true, followUpMs: relevant.some(feed => options.comingSoon?.has(feed.id))
      ? 0 : REFRESHING_RETRY_SECONDS * 1000 } : {}),
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
