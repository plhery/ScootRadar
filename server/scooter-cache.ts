import { RydeBroker } from './rydeBridge';
import { RydeWatchedViews } from './rydeWatchedViews';
import { loadRydeRuntimeConfig, withRydeAppCollectors, type RydeArea } from './rydeApp';
import rydeAreas from '../data/ryde-bridge-areas.json';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { discoverCollectableFeeds, independentCollectableFeeds, listedNationalFeeds, planRefreshCounts,
  type CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { buildCityOverview, cityOverviewSteps, joinCityOverviews, LAST_SEEN_MAX_AGE_MS, overviewDue, refreshedOverview, showsPositions, VEHICLE_MAX_AGE_MS, type FeedSnapshot,
  type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapFeed, isAppMapSystem, regionalSource } from '../src/lib/regionalScooterSystems';
import { APP_MAP_WIDE_INTERVAL_MS } from './appMapCadence';
import type { MapBounds, Vehicle } from '../src/lib/types';
import { feedCurfewEnds, feedCurfewed, feedPaused, snapshotPaused } from '../src/lib/seasonalPauses';
import { withListedPricing } from '../src/lib/listedPrices';
import { upstreamCacheEntriesFor, upstreamJsonCache, UpstreamHttpError } from '../src/lib/upstreamJsonCache';
import { fetchRegionalParking } from '../src/lib/parkingFeeds';
import { statusAge } from '../src/lib/feedValidation';
import { FeedScheduler, type CollectionAttention } from './feedScheduler';
import { withinCollection } from './sweeps';
import { COLD_WAIT_MS, createSnapshotServer } from './snapshotServer';
import { readFeedStates, readSnapshot, saveAtomically, writeFeedStates, writeSnapshot } from './snapshotFile';
import { collectSnapshotFeed } from './collectFeed';
import { createFeedStateLog, expiredBeside, expiredReportDelay, feedState, restoredFailures, stalledAt, waitOutCurfew, type FeedCadence,
  type FeedFailure, type FeedStateEntry } from './feedStateLog';
import { createSnapshotMetrics } from './metrics';
import { createVisitorLedger } from './visitorLedger';
import { createPublicVehicleIds, readPublicVehicleIds, writePublicVehicleIds } from './publicVehicleIds';
import { discoverOnceMore, registerFeedDefinitions } from './feedDefinitions';
import { initErrorReporting, reportDiscoveryFailing, reportedWorkerSilence, reportError, reportFeedExpired, reportWorkerSilent,
  restoreWorkerSilence } from './errorReporting';
import { cadenceFromEnv, ownIdleExpiries, RETENTION_CAPS_MS, retained, retentionCaps, withRetentionCaps } from './cadence';
import { answerZones, createZoneStore } from './zoneStore';
import { createStrayHold } from './strayHold';
import { runInSlices } from './inSlices';
import { watchStalls } from './stallLog';
import { dottMapRequests, withDottAppCollectors } from './dottApp';
import { voiMapRequests, withVoiAppCollectors } from './voiApp';
import { atomMapRequests, withAtomAppCollectors } from './atomApp';
import { luupMapRequests, withLuupAppCollectors } from './luupApp';
import { jetMapRequests, withJetAppCollectors } from './jetApp';
import { whooshMapRequests, withWhooshAppCollectors } from './whooshApp';
import { beamMapRequests, withBeamAppCollectors } from './beamApp';
import { limeAccountRequests, limeAddressHeld, limeMapRequests, withLimeAppCollectors } from './limeApp';
import { binbinMapRequests, withBinbinAppCollectors } from './binbinApp';
import { birdMapRequests, sweepScope, withBirdAppCollectors } from './birdApp';
import { restoreBirdSupplements, savedBirdSupplements, withBirdSupplements } from './birdSupplement';
import { gcooMapRequests, withGcooAppCollectors } from './gcooApp';
import { kickgoingMapRequests, withKickgoingAppCollectors } from './kickgoingApp';
import { swingMapRequests, withSwingAppCollectors } from './swingApp';
import { boltMapRequests, withBoltAppCollectors } from './boltApp';
import { alpacaMapRequests, withAlpacaAppCollectors } from './alpacaApp';
import { dartMapRequests, withDartAppCollectors } from './dartApp';
import { skyssMapRequests, withSkyssAppCollectors } from './skyssApp';
import { ridemoviMapRequests, withRidemoviAppCollectors } from './ridemoviApp';
import { readsSwissAppMap, standingDown, withLimeStandby, withSwissAppMaps } from './swissAppMaps';

const rydeConfig=loadRydeRuntimeConfig();
const rydeBridge=rydeConfig ? new RydeBroker(rydeConfig.token) : undefined;
const rydeViews=rydeBridge && rydeConfig ? new RydeWatchedViews(rydeBridge, rydeAreas.areas as unknown as RydeArea[],
  rydeConfig.areas, REGIONAL_SCOOTER_SYSTEMS) : undefined;
const RYDE_WORKER = 'Ryde bridge';
/** The Ryde bridge worker's silence once Sentry has heard of it, saved with the feed states for a restart to go on with. */
function workerSilences(now: number): Record<string, number> | undefined {
  const since = rydeBridge?.silentSince(now);
  return since !== undefined && reportedWorkerSilence(RYDE_WORKER) === since ? { [RYDE_WORKER]: since } : undefined;
}
const withAppCollectors = (feeds: CollectableScooterFeed[]) => [
  withDottAppCollectors, withVoiAppCollectors, withAtomAppCollectors, withLuupAppCollectors,
  withJetAppCollectors, withWhooshAppCollectors, withLimeAppCollectors, withBeamAppCollectors,
  // BinBin's and Bird's sweeps start from where their scooters stood at the last one.
  (current: CollectableScooterFeed[], systems: typeof REGIONAL_SCOOTER_SYSTEMS) =>
    withBinbinAppCollectors(current, systems, id => records.get(id)?.vehicles),
  (current: CollectableScooterFeed[], systems: typeof REGIONAL_SCOOTER_SYSTEMS) =>
    withBirdAppCollectors(current, systems, id => records.get(id)?.vehicles),
  // Rome's public Bird feed, with the scooters Bird's map shows within 4.5 km of the centre and the feed leaves out.
  withBirdSupplements,
  (current: CollectableScooterFeed[], systems: typeof REGIONAL_SCOOTER_SYSTEMS) =>
    withRidemoviAppCollectors(current, systems, id => records.get(id)?.vehicles),
  withGcooAppCollectors, withKickgoingAppCollectors, withSwingAppCollectors, withAlpacaAppCollectors, withDartAppCollectors,
  withSkyssAppCollectors, withBoltAppCollectors, withSwissAppMaps,
  (current: CollectableScooterFeed[]) => withRydeAppCollectors(current,rydeBridge,rydeConfig?.areas,undefined,REGIONAL_SCOOTER_SYSTEMS,rydeConfig?.productionPilot),
  (current: CollectableScooterFeed[]) => withLimeStandby(current, id => records.get(id)),
].reduce((current, wrap) => wrap(current, REGIONAL_SCOOTER_SYSTEMS), feeds);

initErrorReporting();
upstreamJsonCache.paceHost('gbfs.api.ridedott.com', 150);
// NRW.Mobidrom serves Voi's, Bolt's and Lime's 18 feeds of North Rhine-Westphalia from one host.
upstreamJsonCache.paceHost('www.mobilitaetsdaten.nrw', 150);
// ATOM Mobility hosts its operators (Hoppy, Ride Mobility, Yoio) under rideatom.com and refuses
// bursts, so each of its hosts gets at most two requests a second, cold starts included.
for (const host of new Set(REGIONAL_SCOOTER_SYSTEMS.map(system => new URL(system.discoveryUrl).hostname))) {
  if (host.endsWith('.rideatom.com')) upstreamJsonCache.paceHost(host, 500);
}
// Bird's, Spin's and Bolt's vehicles are not kept, nor served stale, past their licences' 15 minutes.
for (const [host, capMs] of RETENTION_CAPS_MS) upstreamJsonCache.capHost(host, capMs);
const snapshotPath = process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json';
// Each save is written to a temporary file and renamed over the snapshot. The temporary file sits in
// its own folder beside the snapshot, on the same volume so the rename stays atomic, which lets the
// host's backup skip it: one vanishing while restic read it failed the backup on 19 Oct 2026.
const temporaryDirectory = join(dirname(snapshotPath), 'tmp');
// Each feed's state, and any expiry Sentry is still to hear of, saved beside the snapshot with it
// and restored after a restart (createFeedStateLog).
const feedStatesPath = join(dirname(snapshotPath), 'feed-states.json');
// The last sweep of each Bird supplement, Rome's (birdSupplement.ts), saved beside the snapshot with it and
// restored after a restart: its additions stand across a deploy, until too old, rather than none until a new
// sweep has ended, by night until someone looks.
const birdSupplementsPath = join(dirname(snapshotPath), 'bird-supplements.json');
// The ids the answers give scooters (publicVehicleIds.ts), saved beside the snapshot with it and restored
// after a restart: a deploy renames no scooter.
const publicIdsPath = join(dirname(snapshotPath), 'public-ids.json');
// The snapshot is saved a feed at a time (snapshotFile.ts), at most once a minute and on shutdown:
// a restart loses at most a minute of collections, which it makes again. Saved whole every five
// seconds, 150,000 vehicles took 0.6 s of every five, and 300,000 a gigabyte of memory each time.
const SAVE_EVERY_MS = 60_000;
// The snapshot's checks run every five seconds; each drops the capped data that would pass its cap
// before the next.
const TICK_MS = 5_000;
let snapshot: MobilitySnapshot | undefined;
let stopping = false;
// Stopped by a deploy, and answering until DRAIN_MS has passed.
let draining = false;
let dirty = false;
let persisting: Promise<void> | undefined;
let savedAt = 0;
let lastHealthLogAt = 0;
const records = new Map<string, FeedSnapshot>();
// The last collection error of each failing feed, for its state changes and its Sentry report should it expire,
// and how long that waits (stalledAt). Saved with the feed states, and restored with them (restoredFailures).
const lastErrors = new Map<string, FeedFailure>();
const regionalSystems = new Map(REGIONAL_SCOOTER_SYSTEMS.map(system => [`${regionalSource(system)}:${system.id}`, system]));
// The feeds collected now, whose zones are read when someone asks for them.
let collectable: CollectableScooterFeed[] = [];
// The worker each feed collected through one is collected through, as the Ryde bridge's (setDefinitions).
let workerOf = new Map<string, NonNullable<CollectableScooterFeed['worker']>>();
// The host each feed is collected from (setDefinitions); a feed without one is out of the catalog.
let hostOf = new Map<string, string>();
/** Whether the feed is collected through a worker that has stopped asking for jobs, as the Ryde bridge's paused on its Mac. */
const workerSilent = (feedId: string, now: number) => workerOf.get(feedId)?.silentSince(now) !== undefined;
/**
 * Whether the feed is expected to stop: in its seasonal pause or closed for the season (snapshotPaused),
 * or collected through a silent worker. Sentry hears of the worker's silence once for all its feeds
 * (reportRydeWorkerSilent), /health leaves them out of its failed feeds, and scootradar_feed_paused
 * keeps them from the feed-stopped and feed-empty alerts until the worker asks again.
 */
const pausedNow = (feed: { id: string; seasonOver?: boolean }, now: number) => snapshotPaused(feed, now) || workerSilent(feed.id, now);
const zoneStore = createZoneStore({ onError: (feed, error) => console.warn(JSON.stringify({ event: 'zones_feed_failed', feed,
  error: (error instanceof Error ? error.message : String(error)).slice(0, 300) })) });
const stalls = watchStalls(console.warn);

// Validate configuration before doing any network collection.
const schedule = cadenceFromEnv();
// Always-fast sources every minute; the others every idle interval, and every minute while someone looks.
// The national feeds read from rider maps are collected as the app maps are (swissAppMaps.ts).
const scheduler = new FeedScheduler(collect, { ...schedule,
  alwaysFast: feed => schedule.alwaysFastSources.has(feed.source) && !readsSwissAppMap(feed),
  // After a restart, a feed collected recently waits for its turn rather than everyone at once.
  lastCollectedAt: feed => {
    const record = records.get(feed.id);
    return record && !record.failed ? record.collectedAt ?? (record.attemptedAt || undefined) : undefined;
  },
  // A feed collected in a night ban, when its operator may hide its scooters, is collected again when it ends.
  curfewEnds: (feed, time) => feedCurfewEnds(feed.id, time),
  // What a wide view keeps shown is what the answers show (querySnapshot), not what the scheduler last started.
  showsPositions: (feed, now) => { const record = records.get(feed.id); return record !== undefined && showsPositions(record, now); },
  onStart: (_feed, reason) => metrics.recordCollectionStart(reason),
  // A group a visitor only panned past, whose watch lapsed before it started: its wait is no visitor's.
  onLapse: feed => metrics.recordRefreshLapsed(feed.id) });
// The expiry of the feeds collected less often on purpose (Lime, BinBin, GCOO), from their definitions.
let ownIdleExpiry = ownIdleExpiries([]);
// How old a feed's last positions may stand faded, of the feeds that say (Ryde's).
let ownLastSeenMaxAge: (id: string) => number | undefined = () => undefined;
// How long the data of Bird's, Spin's and Bolt's own feeds may be kept, from their definitions.
let retentionCap = retentionCaps([]);
// Their systems, which name their scooters `<system>:<id>` (scooterFeeds.ts), whose public ids are kept only
// minutes out of the answers (PUBLIC_ID_CAPPED_KEPT_MS).
let cappedSystems = new Set<string>();
const vehicleIds = createPublicVehicleIds({ capped: vehicleId => cappedSystems.has(vehicleId.slice(0, vehicleId.indexOf(':'))) });
const cadence: FeedCadence = { fastSince: (id, now) => scheduler.fastSince(id, now), idleExpiryMs: schedule.idleExpiryMs,
  idleExpiryMsForFeed: id => ownIdleExpiry(id) };
// A scooter a feed puts far away for a while, as 3electra puts Kyiv's in Lima, keeps its last place
// for ten minutes, or until the feed's next collection when that is later.
const holdStrays = createStrayHold((id, now) => scheduler.fastSince(id, now) === undefined
  ? schedule.idleIntervalMs : schedule.activeIntervalMs, undefined, id => retentionCap(id) === undefined);
// City totals count the feeds collected on time, whatever the age of their positions.
const countedAt = (now: number) => (feed: FeedSnapshot) => feedState(feed, now, cadence) !== 'expired';
// Each visitor's requests and areas of the quarter hour, by a salted hash: metrics, and a limit on a sweep.
const visitors = createVisitorLedger();
const metrics = createSnapshotMetrics(process.env.SOURCE_COMMIT, { cadence, visitors: now => visitors.counts(now),
  paused: (feedId, now) => feedPaused(feedId, now) || workerSilent(feedId, now),
  cadenceModes: now => scheduler.modes(now), upstreamRequests: () => ({
    status: upstreamJsonCache.requests.status + dottMapRequests.status + voiMapRequests.status + atomMapRequests.status + luupMapRequests.status + jetMapRequests.status + whooshMapRequests.status + limeMapRequests.status +
      binbinMapRequests.status + beamMapRequests.status + gcooMapRequests.status + kickgoingMapRequests.status + swingMapRequests.status +
      alpacaMapRequests.status + dartMapRequests.status + skyssMapRequests.status + boltMapRequests.status + birdMapRequests.status + ridemoviMapRequests.status,
    metadata: upstreamJsonCache.requests.metadata + voiMapRequests.metadata + atomMapRequests.metadata + luupMapRequests.metadata + whooshMapRequests.metadata + limeMapRequests.metadata + beamMapRequests.metadata +
      boltMapRequests.metadata + birdMapRequests.metadata,
  }),
  planRefreshes: () => planRefreshCounts,
  limeAccountRequests, limeAddressHeld,
  upstreamCache: () => ({ entries: upstreamJsonCache.size, capacity: upstreamJsonCache.capacity,
    evictions: upstreamJsonCache.evictions }) });
const server = createSnapshotServer({ rydeBridge, rydeViews, snapshot: () => snapshot,
  token: process.env.SCOOTER_SNAPSHOT_API_TOKEN, production: process.env.NODE_ENV === 'production',
  version: process.env.SOURCE_COMMIT, metrics, metricsToken: process.env.METRICS_TOKEN, cadence, refresher: scheduler, visitors, vehicleIds,
  zones: query => answerZones(zoneStore, collectable, query, COLD_WAIT_MS), retention: id => retentionCap(id),
  // A slow feed's last positions stand faded until it is due again while nobody looks: Lime's for three days.
  lastSeenMaxAgeMs: id => ownLastSeenMaxAge(id) ?? Math.max(LAST_SEEN_MAX_AGE_MS, ownIdleExpiry(id) ?? 0), draining: () => draining,
  paused: pausedNow });
// The city totals, built in two parts (cityOverview): those of the feeds without a retention cap, and
// those of the capped feeds. The file keeps the first only.
let baseOverview: MobilitySnapshot['overview'] | undefined;
let cappedOverview: MobilitySnapshot['overview'] | undefined;
// Whether the first are being built again (rebuildBaseOverview), in slices of about this long.
let baseRebuilding = false;
const OVERVIEW_SLICE_MS = 20;
try {
  const persisted = await readSnapshot(snapshotPath);
  if (persisted) {
    // Its capped feeds' data past its cap goes as soon as their definitions say which they are (setDefinitions).
    snapshot = persisted;
    baseOverview = persisted.overview;
    for (const feed of persisted.feeds) records.set(feed.id, feed);
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.error('Snapshot restore failed', error);
    reportError('restore', error);
  }
}
// A feed expired before the restart, as Dott's in Trondheim taken down for the night ban, is still
// reported when its wait ends, and one already reported is not again. States saved too long before
// are left (FEED_STATES_MAX_AGE_MS): each feed's first state is then its baseline.
let restoredFeedStates: Record<string, FeedStateEntry> = {};
// When the feed catalog was last discovered, saved with the feed states, so that a restart doesn't
// reset the "feed discovery stale" alert's clock to its own start.
let discoveredAt: number | undefined;
try {
  const saved = await readFeedStates(feedStatesPath, Date.now());
  if (saved) {
    restoredFeedStates = saved.feeds;
    // Until each failing feed's first collection ends: an NRW.Mobidrom stall expired before the restart waits
    // out its 3 hours, not 5 minutes.
    for (const [id, failure] of restoredFailures(saved.feeds)) lastErrors.set(id, failure);
    discoveredAt = saved.discoveredAt;
    if (discoveredAt) metrics.recordDiscovery(discoveredAt);
    // The Ryde bridge's worker, silent and reported before the restart, is silent still until it asks:
    // its groups are not reported one by one, nor its silence again (workerSilences).
    const silence = saved.workerSilences?.[RYDE_WORKER];
    if (silence !== undefined && rydeBridge) {
      rydeBridge.restoreSilence(silence);
      restoreWorkerSilence(RYDE_WORKER, silence);
    }
    console.log(JSON.stringify({ event: 'feed_states_restored', feeds: Object.keys(saved.feeds).length,
      ageSeconds: Math.round(saved.ageMs / 1000),
      discoveryAgeSeconds: discoveredAt ? Math.round((Date.now() - discoveredAt) / 1000) : null,
      rydeWorkerSilentSince: silence !== undefined && rydeBridge ? new Date(silence).toISOString() : null }));
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.error('Feed state restore failed', error);
    reportError('restore:feed-states', error);
  }
}
try {
  restoreBirdSupplements(JSON.parse(await readFile(birdSupplementsPath, 'utf8')), Date.now());
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.error('Bird supplement restore failed', error);
    reportError('restore:bird-supplements', error);
  }
}
try {
  vehicleIds.restore(await readPublicVehicleIds(publicIdsPath), Date.now());
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.error('Public id restore failed', error);
    reportError('restore:public-ids', error);
  }
}

function publish() {
  const now = Date.now();
  const feeds = [...records.values()];
  // Once built, the city totals are rebuilt on the tick (persistenceTimer).
  snapshot = { version: 1, updatedAt: now, feeds, overview: cappedOverview && snapshot ? snapshot.overview : cityOverview(feeds, now) };
  dirty = true;
}

/**
 * The city totals, rebuilt in the parts that need it. Those of the feeds without a retention cap take
 * seconds over a million scooters: rebuilt hourly, or when a failed feed recovers, at most every five
 * minutes (overviewNeedsRefresh), a slice at a time (rebuildBaseOverview); the totals built before
 * stand meanwhile.
 * Those of the capped feeds, a tenth of a second for some 66,000, are rebuilt as well on the last tick
 * before the oldest data they count passes its cap: two or three times a minute, as one feed or another
 * comes to it. No feed without a cap lists Bird's, Spin's or Bolt's scooters in a country where their
 * own feeds do, so none counts twice.
 */
function cityOverview(feeds: FeedSnapshot[], now: number): MobilitySnapshot['overview'] {
  const baseFeeds = feeds.filter(feed => retentionCap(feed.id) === undefined);
  // The first totals, with none saved to stand meanwhile, are built at once.
  const base = baseOverview ?? buildCityOverview(baseFeeds, now, countedAt(now), retentionCap);
  if (baseOverview && !baseRebuilding && overviewDue(baseOverview, baseFeeds, now, countedAt(now), TICK_MS)) {
    void rebuildBaseOverview(baseFeeds, now);
  }
  const capped = refreshedOverview(cappedOverview, feeds.filter(feed => retentionCap(feed.id) !== undefined), now,
    countedAt(now), retentionCap, TICK_MS);
  if (snapshot && base === baseOverview && capped === cappedOverview) return snapshot.overview;
  baseOverview = base;
  cappedOverview = capped;
  return joinCityOverviews(base, capped);
}

// Built whole, the totals of the feeds without a cap held the event loop for 6 to 8 seconds on the
// server, every five minutes by day on 26 October 2026, and the map's requests waited behind them.
async function rebuildBaseOverview(feeds: FeedSnapshot[], now: number) {
  baseRebuilding = true;
  try {
    const base = await runInSlices(cityOverviewSteps(feeds, now, countedAt(now), retentionCap), OVERVIEW_SLICE_MS);
    if (stopping) return;
    baseOverview = base;
    if (snapshot && cappedOverview) {
      snapshot = { ...snapshot, overview: joinCityOverviews(base, cappedOverview) };
      dirty = true;
    }
  } catch (error) {
    console.error('City totals rebuild failed', error);
    reportError('overview', error);
  } finally {
    baseRebuilding = false;
  }
}

/**
 * Drops the capped feeds' data that would pass its cap before the next tick, and a Lime standby
 * group's once its national feed serves again: whether it dropped any.
 */
function dropExpiredData(now: number) {
  let dropped = false;
  for (const [id, record] of records) {
    const kept = standingDown(retained(record, now + TICK_MS, retentionCap(id)), other => records.get(other), now);
    if (kept === record) continue;
    records.set(id, kept);
    dropped = true;
  }
  return dropped;
}

async function collect(definition: CollectableScooterFeed, attention: CollectionAttention) {
  const system = regionalSystems.get(definition.id);
  let failed = false;
  let running = true;
  const startedAt = Date.now();
  metrics.recordRefreshStarted(definition.id, startedAt);
  // An app map's scooters carry no price: they get the one listed for their system, if any.
  const priced = (vehicles: Vehicle[]) => system ? withListedPricing(system, vehicles, Date.now()) : vehicles;
  // What an app map's sweep has found so far, shown until it ends (sweeps.ts): the record it ends
  // with has no sweep. A Bird sweep tells when it began, and when it read each scooter it ends with.
  const scope = sweepScope(attention, startedAt, (vehicles: Vehicle[], swept: MapBounds[], sweptSince: number) => {
    const record = records.get(definition.id);
    if (!running || stopping || !record) return;
    records.set(definition.id, { ...record, sweep: { startedAt: sweptSince, vehicles: priced(vehicles), swept } });
    publish();
    metrics.recordRefreshProgress(definition.id);
  });
  const timed = async () => {
    const started = performance.now();
    try {
      const result = await withinCollection(scope, () => definition.collect()).finally(() => { running = false; });
      metrics.recordCollection(definition, false, (performance.now() - started) / 1000);
      lastErrors.delete(definition.id);
      return holdStrays(definition.id, { ...result, vehicles: priced(result.vehicles) }, records.get(definition.id), Date.now());
    } catch (error) {
      failed = true;
      metrics.recordCollection(definition, true, (performance.now() - started) / 1000);
      lastErrors.set(definition.id, { message: (error instanceof Error ? error.message : String(error)).slice(0, 300),
        ...statusAge(error), ...(error instanceof UpstreamHttpError ? { httpStatus: error.status } : {}) });
      throw error;
    }
  };
  await collectSnapshotFeed({ ...definition, collect: timed }, records.get(definition.id), record => {
    // Removed definitions may still have requests finishing in the background.
    if (stopping || !records.has(definition.id)) return;
    // A failed collection keeps the scooters it had, and when they were read.
    const reads = record.failed ? records.get(definition.id)!.reads : scope.reads();
    records.set(definition.id, reads ? { ...record, reads } : record);
    publish();
  }, system && !isAppMapSystem(system) ? () => fetchRegionalParking(system) : undefined)
    .catch(error => { failed = true; throw error; })
    .finally(() => { stalls.ended(definition.id); metrics.recordRefreshEnded(definition.id, failed); });
  return { failed };
}

function setDefinitions(collected: CollectableScooterFeed[], retiresMissing: (feed: FeedSnapshot) => boolean) {
  // Capped feeds are collected every 13 minutes while nobody looks, but expire as the others do.
  // A view of groups of scooters has an app map collected every ten minutes, not every one: but a Bird
  // area, whose sweeps have an interval of their own, sized to its quota and to how long one takes.
  const definitions = withRetentionCaps(collected, schedule.idleIntervalMs).map(feed =>
    feed.activeIntervalMs === undefined && (isAppMapFeed(feed) || readsSwissAppMap(feed)) ? { ...feed, wideIntervalMs: APP_MAP_WIDE_INTERVAL_MS } : feed);
  collectable = definitions;
  workerOf = new Map(definitions.flatMap(feed => feed.worker ? [[feed.id, feed.worker] as const] : []));
  hostOf = new Map(definitions.map(feed => [feed.id, feed.host]));
  ownIdleExpiry = ownIdleExpiries(definitions, schedule.idleExpiryMs);
  const lastSeenAges = new Map(definitions.flatMap(feed => feed.lastSeenMaxAgeMs ? [[feed.id, feed.lastSeenMaxAgeMs] as const] : []));
  ownLastSeenMaxAge = id => lastSeenAges.get(id);
  retentionCap = retentionCaps(definitions);
  cappedSystems = new Set(definitions.filter(feed => retentionCap(feed.id) !== undefined).map(feed => feed.id.slice(feed.id.indexOf(':') + 1)));
  const active = new Set(definitions.map(feed => feed.id));
  for (const [id, feed] of records) if (!active.has(id) && retiresMissing(feed)) records.delete(id);
  for (const id of lastErrors.keys()) if (!active.has(id) && !records.has(id)) lastErrors.delete(id);
  registerFeedDefinitions(records, definitions);
  dropExpiredData(Date.now());
  publish();
  // Every feed's documents stay in memory between its collections, however many countries are added.
  upstreamJsonCache.reserve(upstreamCacheEntriesFor(definitions.length));
  scheduler.setFeeds(definitions);
}

async function persist(final = false) {
  if (persisting) return persisting;
  if (!snapshot || !dirty) return;
  const now = Date.now();
  if (now - lastHealthLogAt >= 60_000) {
    lastHealthLogAt = now;
    const relevant = snapshot.feeds.filter(feed => !feed.skipped);
    // A feed not attempted yet, as one a deploy adds, is warming up rather than failed.
    const attempted = relevant.filter(feed => feed.attemptedAt > 0);
    // A feed with no observation would count its age from 1970 (1.79 billion seconds).
    const observed = relevant.filter(feed => feed.observedAt > 0);
    const modes = scheduler.modes(now);
    console.log(JSON.stringify({ event: 'snapshot_health', feeds: relevant.length,
      warmingFeeds: relevant.length - attempted.length,
      failedFeeds: attempted.filter(feed => feed.failed).length,
      expiredFeeds: attempted.filter(feed => feedState(feed, now, cadence) === 'expired').length,
      unobservedFeeds: relevant.length - observed.length,
      servedFeeds: relevant.filter(feed => now - feed.observedAt <= VEHICLE_MAX_AGE_MS).length,
      alwaysFeeds: modes.always, watchedFeeds: modes.watched, idleFeeds: modes.idle,
      oldestObservationAgeSeconds: observed.length
        ? Math.round(Math.max(...observed.map(feed => Date.now() - feed.observedAt)) / 1000) : null }));
  }
  if (!final && now - savedAt < SAVE_EVERY_MS) return;
  dirty = false;
  savedAt = now;
  // Saved at most every minute, the file holds no capped data that would pass its cap before the next
  // save, a minute and the time it takes later, could replace it; nor the capped feeds' city totals,
  // which a restart builds again from what it holds.
  const saved = { ...snapshot, overview: baseOverview ?? snapshot.overview,
    feeds: snapshot.feeds.map(feed => retained(feed, now + 2 * SAVE_EVERY_MS, retentionCap(feed.id))) };
  const states = logFeedStates.saved(), discovered = discoveredAt, silences = workerSilences(now), sweeps = savedBirdSupplements(),
    ids = vehicleIds.saved();
  persisting = (async () => {
    try {
      await saveAtomically(snapshotPath, temporaryDirectory, 'scooters', path => writeSnapshot(path, saved));
    } catch (error) {
      dirty = true;
      console.error('Snapshot persistence failed', error);
      reportError('persist', error);
    }
    try {
      await saveAtomically(feedStatesPath, temporaryDirectory, 'feed-states', path => writeFeedStates(path, states, now, discovered, silences));
    } catch (error) {
      console.error('Feed state persistence failed', error);
      reportError('persist:feed-states', error);
    }
    try {
      await saveAtomically(birdSupplementsPath, temporaryDirectory, 'bird-supplements',
        path => writeFile(path, `${JSON.stringify({ version: 1, savedAt: now, feeds: sweeps })}\n`));
    } catch (error) {
      console.error('Bird supplement persistence failed', error);
      reportError('persist:bird-supplements', error);
    }
    try {
      await saveAtomically(publicIdsPath, temporaryDirectory, 'public-ids', path => writePublicVehicleIds(path, ids, now));
    } catch (error) {
      console.error('Public id persistence failed', error);
      reportError('persist:public-ids', error);
    }
  })();
  try { await persisting; } finally { persisting = undefined; }
}

let discoveryTimer: ReturnType<typeof setTimeout>;
// Since when every discovery has failed, for Sentry to hear of it only after a while (reportDiscoveryFailing).
let discoveryFailingSince: number | undefined;
async function discover() {
  let retryMs = 3600_000;
  try {
    const definitions = withAppCollectors(await discoverOnceMore(discoverCollectableFeeds, 5_000,
      error => console.warn('Feed discovery failed; trying once more in 5 seconds', error)));
    if (!stopping) setDefinitions(definitions, () => true);
    discoveredAt = Date.now();
    metrics.recordDiscovery(discoveredAt);
    discoveryFailingSince = undefined;
  } catch (error) {
    retryMs = 60_000;
    console.error('Feed discovery failed; retaining the previous catalog', error);
    discoveryFailingSince ??= Date.now();
    reportDiscoveryFailing(error, discoveryFailingSince);
  }
  if (!stopping) discoveryTimer = setTimeout(() => void discover(), retryMs);
}
// The national feeds the snapshot holds are collected from the start, as the registry listed them
// before, should it fail now (listedNationalFeeds); discovery replaces them with its catalog.
// The others come with the code, so one it no longer has goes now, whatever the registry answers:
// Dott's feed renamed Estepona on 31 October 2026 counted twice beside the old one's saved scooters.
const restoredNational = [...records.values()].filter(feed => feed.source === 'national')
  .map(feed => feed.id.slice(feed.id.indexOf(':') + 1));
setDefinitions(withAppCollectors([...listedNationalFeeds(restoredNational), ...independentCollectableFeeds()]), feed => feed.source !== 'national');
scheduler.start();
void discover();
// Sentry hears of a feed still expired after 5 minutes, 15 for Voi's Swiss feed, 30 for one swept
// slowly on purpose, as the app maps, 3 hours for NRW.Mobidrom's while it still answers, or an hour
// for a national feed Lime's groups stand by for while sharedmobility.ch still answers
// (expiredReportDelay). A restart goes on from the states saved before it (restoredFeedStates).
const logFeedStates = createFeedStateLog(console.log, undefined, cadence, { afterMs: feed => expiredReportDelay(feed,
  ownIdleExpiry(feed.id), stalledAt(feed, hostOf.get(feed.id), lastErrors.get(feed.id))),
  // Under a night ban, an operator may take its feed down until morning, as Dott did in Trondheim
  // on 16 October 2026: Sentry hears of it only if it is not back 30 minutes after the ban.
  wait: waitOutCurfew(feedCurfewed),
  report: (change, feed) => {
    // In its seasonal pause, closed by its operator for the season, or collected through a worker that
    // has stopped asking for jobs, whose one report stands for its feeds (reportRydeWorkerSilent), a feed
    // is expected to stop; the log still says it did.
    const now = Date.now();
    if (pausedNow(feed, now)) return;
    // Without one, the feed is out of the catalog, and so are the others listed with it.
    const host = hostOf.get(feed.id);
    const alsoExpired = (snapshot?.feeds ?? []).filter(other => other.id !== feed.id && hostOf.get(other.id) === host &&
      !pausedNow(other, now) && expiredBeside(other, now, cadence)).map(other => other.id).sort();
    reportFeedExpired(change, feed, lastErrors.get(feed.id)?.message, host, alsoExpired);
  } }, restoredFeedStates, id => lastErrors.get(id));
const persistenceTimer = setInterval(() => {
  const now = Date.now();
  if (dropExpiredData(now)) publish();
  upstreamJsonCache.evictExpired(TICK_MS);
  if (snapshot) {
    // Checked on every tick, saved or not, the capped feeds' city totals never outlive their data.
    const overview = cityOverview(snapshot.feeds, now);
    if (overview !== snapshot.overview) snapshot = { ...snapshot, overview };
    logFeedStates(snapshot.feeds);
    reportRydeWorkerSilent(now);
  }
  void persist();
}, TICK_MS);
/** Once the Ryde bridge's worker has stopped asking for jobs, one event for each silence (reportWorkerSilent). */
function reportRydeWorkerSilent(now: number) {
  const silentSince = rydeBridge?.silentSince(now);
  if (silentSince === undefined || !snapshot) return;
  const feeds = snapshot.feeds.filter(feed => workerOf.get(feed.id) === rydeBridge);
  reportWorkerSilent(RYDE_WORKER, silentSince, { total: feeds.length,
    expired: feeds.filter(feed => expiredBeside(feed, now, cadence)).length }, now);
}
server.listen(Number(process.env.PORT ?? 3001), '0.0.0.0', () => console.log('Scooter snapshot API listening'));
function shutDown() {
  if (stopping) return;
  stopping = true;
  scheduler.stop();
  clearTimeout(discoveryTimer);
  clearInterval(persistenceTimer);
  stalls.stop();
  server.close();
  // A collection still running, as LUUP's 90-second reads, would hold the process until Docker kills it.
  void (async () => { await persisting; await persist(true); process.exit(0); })();
}
// A deploy stops this container with SIGTERM once the new one is healthy, but Traefik sends it requests
// until Docker finds it unhealthy, after ten failed checks two seconds apart (DEPLOY.md). It goes on as
// before for DRAIN_MS while /health and /ready answer 503, then stops. Closed at once, it refused them:
// Traefik answered 46 with a 502 in the four days to 30 October 2026, up to 12 in a deploy.
const DRAIN_MS = 30_000;
process.on('SIGTERM', () => {
  if (draining) return;
  draining = true;
  console.log(JSON.stringify({ event: 'draining', seconds: DRAIN_MS / 1000 }));
  setTimeout(shutDown, DRAIN_MS);
});
process.on('SIGINT', shutDown);
