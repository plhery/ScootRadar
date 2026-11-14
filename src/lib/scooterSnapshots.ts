import { SWISS_SCOOTER_AREAS, coverageIntersects } from '@/lib/feedCoverage';
import {
  REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, COUNTRY_SOURCES, collectsParking, isAppMapFeed, isLimeGroupFeed, isRydeGroupFeed, isRegionalSource,
  regionalCityId, serviceAreas,
} from '@/lib/regionalScooterSystems';
import { boundsCenter, boundsContainPoint, crossesDateLine, haversineM } from '@/lib/geo';
import { CITY_OVERVIEW_MAX_ZOOM, providersForViewport } from '@/lib/mapCoverage';
import { PARKING_MAX_AGE_MS, PARKING_MIN_ZOOM, type ParkingSnapshot } from '@/lib/parking';
import { scooterResponse } from '@/lib/scooterResponse';
import { snapshotPaused } from '@/lib/seasonalPauses';
import { effectiveRange, passesMinimums, reportsBatteryOnly } from '@/lib/range';
import { addBatteryRanges, batteryFullRange } from '@/lib/batteryFullRanges';
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
   * Of a feed read over many minutes, as a Bird area's sweep (birdApp.ts): when each vehicle was read. Its
   * observedAt is then its first part's time, which a vehicle not named in it takes.
   */
  reads?: PositionReads;
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

/** When the positions of a feed read over many minutes were read (FeedSnapshot.reads). */
export interface PositionReads {
  /** When its last part was read. */
  lastAt: number;
  /** When each vehicle was read, by its vehicle_id. */
  at: Record<string, number>;
}

/**
 * The range minimums the city totals count exactly, in metres: every step of the filters' sliders, whole
 * kilometres up to 30 and whole miles up to 20 as the clients send them, 3 mi as 4,828 m (rangeSlider.ts,
 * the apps' ScooterRangeFilter), and every whole kilometre up to the API's 100 km (scooterQuery.ts). The
 * city totals count each app's scooters between one step and the next, and a minimum from its own step.
 */
export const REACH_STEPS = [
  ...Array.from({ length: 101 }, (_, kilometres) => kilometres * 1000),
  // A mile as the clients convert it (walking.ts's METERS_PER_MILE, a website file the cache leaves out).
  ...Array.from({ length: 20 }, (_, miles) => Math.round((miles + 1) * 1609.344)),
].sort((a, b) => a - b);
// Where each whole kilometre's step stands among them, to find a scooter's bin at once.
const KILOMETRE_STEPS = Array.from({ length: 101 }, (_, kilometres) => REACH_STEPS.indexOf(kilometres * 1000));

/** The bin of the city totals' reaches that counts a scooter going `reach` metres: that of the last step it attains. */
function reachBin(reach: number): number {
  const bin = KILOMETRE_STEPS[Math.min(100, Math.max(0, Math.floor(reach / 1000)))];
  // A kilometre holds at most one step in miles, after its own.
  return REACH_STEPS[bin + 1] <= reach ? bin + 1 : bin;
}

interface CityTotals {
  id: string;
  city: string;
  lat: number;
  lng: number;
  // Bins 0..100 hold known battery percentages; bin 101 is unknown. The older apps' minBattery reads them.
  batteries: Record<string, number[]>;
  // How far each can go as the range minimum judges it (range.ts): its range, or else its battery times its
  // app's full battery range. Bin i holds from REACH_STEPS[i] to the next step; the last step's, 100 km or
  // more; one more, neither. Totals saved before they were counted so have none, those counted by whole
  // kilometres alone none either, and are built again (overviewNeedsRefresh).
  reaches?: Record<string, number[]>;
  // The apps with a scooter here that says its battery and not its range, for the answer's batteryRanges,
  // in alphabetical order, so that totals built apart and joined are those built together.
  batteryOnly?: string[];
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

/** When a feed's vehicle was read: its feed's time, or its own part's of a feed read over many minutes. */
const readAt = (feed: FeedSnapshot, vehicle: Vehicle) =>
  (vehicle.vehicle_id ? feed.reads?.at[vehicle.vehicle_id] : undefined) ?? feed.observedAt;
/** Whether a vehicle's position is recent enough to show on the map. */
const shows = (feed: FeedSnapshot, vehicle: Vehicle, now: number) => now - readAt(feed, vehicle) <= VEHICLE_MAX_AGE_MS;

/**
 * Whether a feed's positions are recent enough to show on the map: of a feed read over many minutes, those
 * of its last parts, those of its first standing faded once too old (readAt). A Bird area's sweep may take
 * longer than a position may be shown, as Austin's of 46 requests, 22 minutes (docs/bird-app-map.md): until
 * 10 November 2026 it came in whole as old as its start, every scooter faded (week review, finding 2.3).
 */
export const showsPositions = (feed: FeedSnapshot, now: number) => now - (feed.reads?.lastAt ?? feed.observedAt) <= VEHICLE_MAX_AGE_MS;

/** When the oldest of a feed's positions the map shows were read, of one that shows them. */
const oldestShown = (feed: FeedSnapshot, now: number) => !feed.reads ? feed.observedAt
  : feed.vehicles.reduce((oldest, vehicle) => shows(feed, vehicle, now) ? Math.min(oldest, readAt(feed, vehicle)) : oldest, feed.reads.lastAt);
/**
 * The read of a feed whose positions the map shows: when its last collection was, of one read over many minutes when
 * its last part was. It moves only when the feed is read again, where its oldest position shown (oldestShown) moves
 * on as its first parts grow too old to show: a walk took that for a new read of its scooter's app, and said a scooter
 * one Bird sweep of Austin's missed was taken a minute and a half later instead of after another (Android review of
 * 14 November 2026, S2).
 */
const lastRead = (feed: FeedSnapshot) => feed.reads?.lastAt ?? feed.observedAt;

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
 * A feed in its seasonal pause that serves nothing is expected to be quiet: neither failed nor served,
 * as if it had not been asked (seasonalPauses.ts). So is one collected again for a request, which
 * catches an operator back early: until it brings positions to show, the map shows the pause, not
 * "refreshing" over the faded scooters it last listed, which in Red Deer on 2 November 2026 were
 * Lime's of 31 October, the evening before its pause.
 */
function quietInPause(feed: FeedSnapshot, now: number, usable: (feed: FeedSnapshot) => boolean): boolean {
  return !usable(feed) && snapshotPaused(feed, now);
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
    const relevant = feeds.filter(feed => feed.source === source && !feed.skipped && !quietInPause(feed, now, usable));
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
  // Totals saved before the reaches were counted could not answer a range minimum, those by whole
  // kilometres alone not one in miles.
  if (snapshot.overview.cities.some(city => !city.reaches || !city.batteryOnly)) return true;
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
 *
 * A feed in its seasonal pause counts only while the map shows its positions: an operator who brings
 * its scooters back early, as one until the streets are clear may, is counted. Its older ones are not,
 * though `counts` takes them: Lime's groups nobody looks at are swept every three days (limeAreas.ts),
 * and Red Deer's, paused from 1 November 2026, still counted 151 scooters read on 31 October the
 * next morning. Not counted, it is quiet in the town's health (quietInPause), neither failed nor stale.
 */
export function* cityOverviewSteps(feeds: FeedSnapshot[], now: number, countsUnpaused: (feed: FeedSnapshot) => boolean,
  retention?: (feedId: string) => number | undefined): Generator<void, MobilitySnapshot['overview']> {
  const counts = (feed: FeedSnapshot) => countsUnpaused(feed) && (showsPositions(feed, now) || !snapshotPaused(feed, now));
  const totals = new Map<string, CityTotals>();
  for (const city of [...regionalCities, ...SWISS_SCOOTER_AREAS]) {
    const country = regionalCities.find(candidate => candidate.id === city.id)?.country;
    const countrySource = country ? COUNTRY_SOURCES[country] : null;
    const relevant = feeds.filter(feed => (countrySource ? feed.source === countrySource : isSwissSource(feed.source)) && coverageIntersects(feed.coverage, city.bounds));
    const health = healthFor(relevant, now, counts);
    totals.set(city.id, { id: city.id, city: city.city, lat: city.center[0], lng: city.center[1],
      batteries: {}, reaches: {}, batteryOnly: [], sources: health.sources, failedSources: health.failedSources });
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
      const reaches = total.reaches![vehicle.provider] ??= Array<number>(REACH_STEPS.length + 1).fill(0);
      const reach = effectiveRange(vehicle, batteryFullRange(vehicle.provider));
      reaches[reach === null ? REACH_STEPS.length : reachBin(reach)]++;
      if (reportsBatteryOnly(vehicle) && !total.batteryOnly!.includes(vehicle.provider)) total.batteryOnly!.push(vehicle.provider);
    }
    yield;
  }
  for (const total of totals.values()) total.batteryOnly!.sort();
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
      const joinBins = (mine: Record<string, number[]>, theirs: Record<string, number[]>) => {
        const joined = { ...mine };
        for (const [provider, bins] of Object.entries(theirs)) {
          joined[provider] = joined[provider]?.map((count, bin) => count + bins[bin]) ?? bins;
        }
        return joined;
      };
      const batteries = joinBins(city.batteries, other.batteries);
      // Without the reaches of either, the two together have none.
      const counted = city.reaches && other.reaches && city.batteryOnly && other.batteryOnly;
      const reaches = counted ? joinBins(city.reaches!, other.reaches!) : undefined;
      const batteryOnly = counted ? [...new Set([...city.batteryOnly!, ...other.batteryOnly!])].sort() : undefined;
      const sources = { ...city.sources };
      for (const source of Object.keys(sources) as Array<keyof typeof sources>) {
        sources[source] = joinStatus(sources[source], other.sources[source] ?? 'skipped');
      }
      return { ...city, batteries, reaches, batteryOnly, sources, failedSources: [...city.failedSources, ...other.failedSources] };
    }),
    ...(keepUntil < Infinity ? { keepUntil } : {}) };
}

function overviewResponse(snapshot: MobilitySnapshot, query: FeedQuery, zoom: number, now: number): ScooterResponse {
  if (now - snapshot.overview.generatedAt > OVERVIEW_MAX_AGE_MS) {
    throw new ScooterFeedsUnavailableError(['city-overview']);
  }
  const clusters: ScooterCluster[] = [];
  const providers: Record<string, number> = {};
  const batteryRanges: Record<string, number> = {};
  const meta = emptyHealth();
  const minRange = query.minRange ?? 0;
  // From the minimum's own step, exact in kilometres and in miles, as at street zoom. One between two steps,
  // which only the API may send, counts from the next: what surely reaches it, perhaps short of the street's;
  // one past the last, which the API refuses, none.
  const fromStep = minRange > REACH_STEPS.at(-1)! ? REACH_STEPS.length : REACH_STEPS.findIndex(step => step >= minRange);
  const sum = (bins: number[], from: number, to: number) => bins.slice(from, to).reduce((a, b) => a + b, 0);
  for (const city of snapshot.overview.cities) {
    if (!boundsContainPoint(query.bounds, city.lat, city.lng)) continue;
    // Totals saved before the reaches were counted are built again within seconds: a range
    // minimum is not answered with none meanwhile, as when the totals are too old.
    if (minRange > 0 && !city.reaches) throw new ScooterFeedsUnavailableError(['city-overview']);
    // Of every app, whichever the provider filter keeps.
    for (const provider of city.batteryOnly ?? []) batteryRanges[provider] = batteryFullRange(provider);
    const counts: Record<string, number> = {};
    for (const [provider, bins] of Object.entries(city.batteries)) {
      if (query.providers && !query.providers.has(provider)) continue;
      const charged = sum(bins, query.minBattery, query.minBattery > 0 ? 101 : 102);
      // With both minimums, which the clients never ask for, the fewer of the two: no more than pass both.
      const count = minRange > 0 ? Math.min(charged, sum(city.reaches?.[provider] ?? [], fromStep, REACH_STEPS.length)) : charged;
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
    ...(Object.keys(batteryRanges).length ? { batteryRanges } : {}),
    meta: { ...meta, generatedAt: new Date(snapshot.overview.generatedAt).toISOString(),
      expiresAt: new Date(snapshot.overview.generatedAt + OVERVIEW_MAX_AGE_MS).toISOString(),
      truncated: false, totalVehicles: Object.values(providers).reduce((a, b) => a + b, 0),
      mode: 'clusters', zoom, overview: true, refreshAfterSeconds: 3600,
      availableProviders: providersForViewport(query.bounds), ...seasonOverIn(snapshot, query.bounds) },
  };
}

/**
 * The answer's batteryRanges at street zoom: of each app with a scooter in view that says its battery
 * and not its range, `observations` with the feeds, whichever the provider filter and the minimum keep,
 * so the filters say what battery each app's need as soon as it is switched on again.
 */
function batteryRangesIn(snapshot: MobilitySnapshot, bounds: MapBounds, observations: readonly FeedSnapshot[] = []): Record<string, number> {
  const ranges: Record<string, number> = {};
  for (const feed of [...snapshot.feeds.filter(feed => coverageIntersects(feed.coverage, bounds)), ...observations]) {
    if (feed.skipped) continue;
    addBatteryRanges(ranges, feed.vehicles, bounds);
    if (feed.sweep) addBatteryRanges(ranges, feed.sweep.vehicles, bounds);
  }
  return ranges;
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
/** Native Ryde reads share one worker; a wide map must not queue a whole town ahead of its street view. */
export const RYDE_GROUPS_PER_REQUEST = 2;

/**
 * How far from the middle of the view a feed a request collects again may be, in degrees of latitude
 * (about 80 km). A 1920 by 1080 screen's view at zoom 11, or a 4K one's at 12, fits in it whole but within
 * 8° of the equator, and none centred on a town of the catalog leaves a feed out. A visitor is charged for the area the middle
 * of their view is in (server/visitorLedger.ts), and a box as wide as a country, which no screen shows
 * but which is answered at zoom 11 as clusters (scooterAnswerZoom), otherwise had every feed in it
 * collected every minute: 181 in one such box checked in November 2026, 122 of them operators' rider apps.
 */
export const DEMAND_REACH_DEGREES = 0.75;

/** How far the feed's coverage is from a point, in degrees of latitude: 0 for one that holds it. */
function offPoint(feed: FeedSnapshot, [lat, lng]: [number, number]): number {
  const scale = Math.cos(lat * Math.PI / 180);
  return Math.min(...feed.coverage.map(area => Math.hypot(Math.max(area.south - lat, lat - area.north, 0),
    Math.max(area.west - lng, lng - area.east, 0) * scale)));
}

/**
 * The feeds in view that a request collects again: those within DEMAND_REACH_DEGREES of its middle, of
 * which only the nearest few Lime and Ryde groups. The others stay idle and the answer shows them as they are.
 */
export function demandedFeeds(feeds: FeedSnapshot[], bounds: MapBounds, now = Date.now()): FeedSnapshot[] {
  const middle = boundsCenter(bounds);
  let selected = feeds.filter(feed => offPoint(feed, middle) <= DEMAND_REACH_DEGREES);
  for (const [matches, limit] of [[isLimeGroupFeed, LIME_GROUPS_PER_REQUEST], [isRydeGroupFeed, RYDE_GROUPS_PER_REQUEST]] as const) {
    const groups = selected.filter(matches);
    if (groups.length <= limit) continue;
    // Once a Ryde batch is fresh, move on to the faded groups still in view rather
    // than refreshing the same centre forever. Pending/partial batches retain their
    // old feed timestamp, so polling does not enqueue the whole city at once.
    const nearest = new Set(groups.map((feed, index) => ({ feed, index, off: offPoint(feed, middle),
      fresh: matches === isRydeGroupFeed && showsPositions(feed, now) ? 1 : 0 }))
      .sort((a, b) => a.fresh - b.fresh || a.off - b.off || a.index - b.index).slice(0, limit).map(({ feed }) => feed));
    selected = selected.filter(feed => !matches(feed) || nearest.has(feed));
  }
  return selected;
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

/** The id of a feed's reads of the viewport, among the observations (rydeWatchedViews.ts). */
export const viewReadsOf = (feedId: string) => `${feedId}_view`;

/**
 * A circle a read listed every scooter of some feeds in, at `at`: their positions seen there before it
 * are gone, live or faded. In Augsburg on 7 November 2026 Ryde's read of the view drew its scooters
 * where they now were, and their old positions stood faded beside them.
 */
export interface ListedArea {
  feeds: ReadonlySet<string>;
  at: number;
  lat: number;
  lng: number;
  radiusM: number;
}

export interface SnapshotQueryOptions {
  /** Recent positive observations of the viewport; never full-feed replacements. */
  observations?: FeedSnapshot[];
  /** Where the observations listed every scooter: the only absence they claim. */
  listedAreas?: readonly ListedArea[];
  /**
   * Feeds being collected again for this request, which the response did not
   * wait for. It says so with meta.refreshing and asks to be polled again soon.
   */
  refreshing?: ReadonlySet<string>;
  /** First reads of a new viewport: recent observations elsewhere must not delay their follow-up. */
  awaitingView?: ReadonlySet<string>;
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
  const relevant = [...feedsForQuery(snapshot, query, zoom), ...(options.observations ?? [])];
  const counted = relevant.filter(feed => !options.idleInView?.has(feed.id) || showsPositions(feed, now));
  const meta = healthFor(counted, now, undefined, options.refreshing);
  const showing = (feed: FeedSnapshot) => showsPositions(feed, now);
  // Collected again for this request, but quiet in its pause: it is not said to be on its way. Nor is a slow
  // feed whose positions still show: its sweep shows nothing until it ends, and the next request at the
  // usual pace finds it. Watched, it is collected again every minute, so said to be on its way, it kept a
  // map left open on Zürich from 23:37 UTC on 31 October 2026 asking every 3 seconds for 14 hours,
  // about 1,250 requests an hour, by Lime's, Bolt's, Dott's and Bird's rider maps there.
  const coming = relevant.filter(feed => !feed.skipped && options.refreshing?.has(feed.id) && !quietInPause(feed, now, showing) &&
    !(collectsSlowly(feed) && showsPositions(feed, now) && !options.awaitingView?.has(feed.id)));
  const refreshing = coming.length > 0;
  // A city whose every feed is in its seasonal pause has nothing to show, which is no failure.
  const asked = counted.filter(feed => !feed.skipped && !quietInPause(feed, now, showing));
  // Nothing to show is unavailable only while the cache is behind or starting. When an operator's
  // feed fails, the answer names it, and the map says who is not sharing data rather than
  // that it could not refresh.
  if (asked.length > 0 && !refreshing && asked.every(feed => !showsPositions(feed, now) && !failedAtOperator(feed))) {
    throw new ScooterFeedsUnavailableError(meta.failedSources);
  }
  const pick = (into: Map<string, Vehicle>, vehicles: Vehicle[], skip?: (vehicle: Vehicle, key: string) => boolean) => {
    for (const vehicle of vehicles) {
      if (!boundsContainPoint(query.bounds, vehicle.lat, vehicle.lng)) continue;
      if (!passesMinimums(vehicle, query, batteryFullRange)) continue;
      const key = vehicleKey(vehicle);
      if (skip?.(vehicle, key)) continue;
      into.set(key, query.origin ? { ...vehicle,
        distance_m: Math.round(haversineM(...query.origin, vehicle.lat, vehicle.lng) * 10) / 10,
      } : vehicle);
    }
  };
  // A position seen before a read that listed its spot without it.
  const gone = (feed: FeedSnapshot, at: number, vehicle: Vehicle) => options.listedAreas?.some(area =>
    area.feeds.has(feed.id) && at < area.at && haversineM(area.lat, area.lng, vehicle.lat, vehicle.lng) <= area.radiusM) === true;
  const unique = new Map<string, Vehicle>();
  // Only viewport-observed identities need reconciliation with the full feeds. An observation
  // outside the box can still confirm that its old marker in the box has moved away.
  const newest = new Map<string, number>();
  for (const feed of options.observations ?? []) {
    if (feed.skipped || !showsPositions(feed, now)) continue;
    for (const vehicle of feed.vehicles) {
      const key = vehicleKey(vehicle);
      newest.set(key, Math.max(feed.observedAt, newest.get(key) ?? -Infinity));
    }
  }
  if (newest.size) for (const feed of relevant) {
    if (feed.skipped) continue;
    const sweep = shownSweep(feed, now);
    if (!showsPositions(feed, now) && !sweep) continue;
    for (const vehicle of sweep?.vehicles ?? feed.vehicles) {
      const key = vehicleKey(vehicle);
      if (newest.has(key)) newest.set(key, Math.max(sweep?.startedAt ?? readAt(feed, vehicle), newest.get(key)!));
    }
  }
  // When each feed's positions shown were seen: its last collection's, the oldest shown of one read over many
  // minutes, or its sweep's under way. Per app, the oldest of them, and the oldest of its feeds' reads (lastRead).
  const shownSince: number[] = [];
  const oldestShownByProvider = new Map<string, number>();
  const readByProvider = new Map<string, number>();
  const earliest = (times: Map<string, number>, provider: string, at: number) =>
    times.set(provider, Math.min(times.get(provider) ?? Infinity, at));
  for (const feed of relevant) {
    if (feed.skipped) continue;
    const sweep = shownSweep(feed, now);
    if (showsPositions(feed, now)) shownSince.push(oldestShown(feed, now));
    else if (sweep) shownSince.push(sweep.startedAt);
    else continue;
    earliest(oldestShownByProvider, feed.provider, shownSince.at(-1)!);
    earliest(readByProvider, feed.provider, sweep?.startedAt ?? lastRead(feed));
    const at = (vehicle: Vehicle) => sweep?.startedAt ?? readAt(feed, vehicle);
    pick(unique, sweep?.vehicles ?? feed.vehicles, (vehicle, key) => (!sweep && !shows(feed, vehicle, now)) ||
      at(vehicle) < (newest.get(key) ?? -Infinity) || gone(feed, at(vehicle), vehicle));
  }
  // Each scooter last seen where the sweep under way has yet to look, unless it has been seen since.
  const lastSeen = new Map<string, Vehicle>();
  const lastSeenTimes: number[] = [];
  // Per app, when its were seen and whether a collection on its way for this view replaces them: an idle
  // feed's stand as they are until a visit has it collected, which the map says rather than that they are coming.
  const lastSeenProviders = new Map<string, { seenAt: number; updating: boolean }>();
  const comingIds = new Set(coming.map(feed => feed.id));
  const fading = { refreshing: options.refreshing, idle: options.idleInView };
  for (const feed of relevant) {
    // Of a feed read over many minutes whose last parts show, its first parts' too old to show stand faded, whatever
    // collects it: they are its last, and a scooter a walk heads for does not leave the map as its part grows old.
    const firstParts = !feed.skipped && feed.reads !== undefined && showsPositions(feed, now);
    const maxAgeMs = options.lastSeenMaxAgeMs?.(feed.id);
    if (!(firstParts || showsLastSeen(feed, now, fading, maxAgeMs)) || quietInPause(feed, now, showing)) continue;
    const swept = shownSweep(feed, now)?.swept ?? [];
    const before = lastSeen.size;
    let seenAt = Infinity;
    pick(lastSeen, feed.vehicles, (vehicle, key) => {
      const at = readAt(feed, vehicle);
      if (now - at <= VEHICLE_MAX_AGE_MS || now - at > (maxAgeMs ?? LAST_SEEN_MAX_AGE_MS) || unique.has(key) || newest.has(key) ||
        swept.some(part => boundsContainPoint(part, vehicle.lat, vehicle.lng)) || gone(feed, at, vehicle)) return true;
      seenAt = Math.min(seenAt, at);
      return false;
    });
    if (lastSeen.size === before) continue;
    lastSeenTimes.push(seenAt);
    const known = lastSeenProviders.get(feed.provider);
    const updating = comingIds.has(feed.id) || comingIds.has(viewReadsOf(feed.id));
    lastSeenProviders.set(feed.provider, {
      seenAt: Math.min(known?.seenAt ?? Infinity, seenAt),
      updating: (known?.updating ?? false) || updating,
    });
  }
  const vehicles = [...unique.values()];
  const previous = [...lastSeen.values()];
  if (query.origin) for (const list of [vehicles, previous]) list.sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
  const observedAt = Math.min(now, ...shownSince);
  const byApp = (times: Map<string, number>, apps?: Set<string>) => Object.fromEntries([...times]
    .filter(([provider]) => !apps || apps.has(provider))
    .map(([provider, at]) => [provider, new Date(Math.min(now, at)).toISOString()]));
  // Each app with positions shown, with when they were read, in every answer: it moves only when the app is read
  // again (lastRead). generatedAt holds the oldest position of every app's, so it stays put while one app in view is
  // late or mid-sweep: a walk told a new read of its scooter's app from the same one served again by generatedAt, and
  // never said a scooter was taken.
  const shownSinceByApp = byApp(readByProvider);
  // The apps that make the answer stale (healthFor) and have positions shown, with the oldest's time:
  // the map names the one late app, where in Augsburg on 7 November 2026 it said "Data delayed" without
  // saying whose positions were 14 minutes old.
  const staleApps = new Set(counted.filter(feed => !feed.skipped && !quietInPause(feed, now, showing) &&
    (showsPositions(feed, now) ? feed.stale || feed.failed : !failedAtOperator(feed) && options.refreshing?.has(feed.id) === true))
    .map(feed => feed.provider));
  const staleProviders = byApp(oldestShownByProvider, staleApps);
  const batteryRanges = batteryRangesIn(snapshot, query.bounds, options.observations);
  const response = scooterResponse({ vehicles, meta, batteryRanges }, zoom, {
    ...(meta.stale ? { staleProviders } : {}),
    ...(readByProvider.size ? { shownSince: shownSinceByApp } : {}),
    generatedAt: new Date(observedAt).toISOString(),
    expiresAt: new Date(observedAt + VEHICLE_MAX_AGE_MS).toISOString(),
    refreshAfterSeconds: refreshing ? REFRESHING_RETRY_SECONDS : 60,
    ...(refreshing ? { refreshing: true, followUpMs: coming.some(feed => options.comingSoon?.has(feed.id))
      ? 0 : REFRESHING_RETRY_SECONDS * 1000 } : {}),
    ...(lastSeenTimes.length ? { lastSeenAt: new Date(Math.min(...lastSeenTimes)).toISOString() } : {}),
    availableProviders: providersForViewport(query.bounds),
    ...seasonOverIn(snapshot, query.bounds),
  }, previous, Object.fromEntries([...lastSeenProviders].map(([provider, { seenAt, updating }]) =>
    [provider, { seenAt: new Date(seenAt).toISOString(), updating }])));
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
