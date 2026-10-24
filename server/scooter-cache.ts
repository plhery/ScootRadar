import { mkdir, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { discoverCollectableFeeds, independentCollectableFeeds, planRefreshCounts, type CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { buildCityOverview, overviewNeedsRefresh, VEHICLE_MAX_AGE_MS, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { REGIONAL_SCOOTER_SYSTEMS, isAppMapSystem, regionalSource } from '../src/lib/regionalScooterSystems';
import { feedCurfewed, feedPaused } from '../src/lib/seasonalPauses';
import { upstreamCacheEntriesFor, upstreamJsonCache } from '../src/lib/upstreamJsonCache';
import { fetchRegionalParking } from '../src/lib/parkingFeeds';
import { FeedScheduler } from './feedScheduler';
import { COLD_WAIT_MS, createSnapshotServer } from './snapshotServer';
import { readSnapshot, writeSnapshot } from './snapshotFile';
import { collectSnapshotFeed } from './collectFeed';
import { createFeedStateLog, expiredReportDelay, feedState, waitOutCurfew, type FeedCadence } from './feedStateLog';
import { createSnapshotMetrics } from './metrics';
import { registerFeedDefinitions } from './feedDefinitions';
import { initErrorReporting, reportError, reportFeedExpired } from './errorReporting';
import { cadenceFromEnv, ownIdleExpiries } from './cadence';
import { answerZones, createZoneStore } from './zoneStore';
import { createStrayHold } from './strayHold';
import { dottMapRequests, withDottAppCollectors } from './dottApp';
import { voiMapRequests, withVoiAppCollectors } from './voiApp';
import { atomMapRequests, withAtomAppCollectors } from './atomApp';
import { luupMapRequests, withLuupAppCollectors } from './luupApp';
import { jetMapRequests, withJetAppCollectors } from './jetApp';
import { whooshMapRequests, withWhooshAppCollectors } from './whooshApp';
import { beamMapRequests, withBeamAppCollectors } from './beamApp';
import { limeMapRequests, withLimeAppCollectors } from './limeApp';
import { binbinMapRequests, withBinbinAppCollectors } from './binbinApp';
import { gcooMapRequests, withGcooAppCollectors } from './gcooApp';
import { kickgoingMapRequests, withKickgoingAppCollectors } from './kickgoingApp';
import { swingMapRequests, withSwingAppCollectors } from './swingApp';

const withAppCollectors = (feeds: CollectableScooterFeed[]) => [
  withDottAppCollectors, withVoiAppCollectors, withAtomAppCollectors, withLuupAppCollectors,
  withJetAppCollectors, withWhooshAppCollectors, withLimeAppCollectors, withBeamAppCollectors,
  // BinBin's sweeps start from where its scooters stood at the last one.
  (current: CollectableScooterFeed[], systems: typeof REGIONAL_SCOOTER_SYSTEMS) =>
    withBinbinAppCollectors(current, systems, id => records.get(id)?.vehicles),
  withGcooAppCollectors, withKickgoingAppCollectors, withSwingAppCollectors,
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
const snapshotPath = process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json';
// Each save is written to a temporary file and renamed over the snapshot. The temporary file sits in
// its own folder beside the snapshot, on the same volume so the rename stays atomic, which lets the
// host's backup skip it: one vanishing while restic read it failed the backup on 19 Oct 2026.
const temporaryDirectory = join(dirname(snapshotPath), 'tmp');
// The snapshot is saved a feed at a time (snapshotFile.ts), at most once a minute and on shutdown:
// a restart loses at most a minute of collections, which it makes again. Saved whole every five
// seconds, 150,000 vehicles took 0.6 s of every five, and 300,000 a gigabyte of memory each time.
const SAVE_EVERY_MS = 60_000;
let snapshot: MobilitySnapshot | undefined;
let stopping = false;
let dirty = false;
let persisting: Promise<void> | undefined;
let savedAt = 0;
let lastHealthLogAt = 0;
const records = new Map<string, FeedSnapshot>();
// The last collection error of each failing feed, for its Sentry report should it expire.
const lastErrors = new Map<string, string>();
const regionalSystems = new Map(REGIONAL_SCOOTER_SYSTEMS.map(system => [`${regionalSource(system)}:${system.id}`, system]));
// The feeds collected now, whose zones are read when someone asks for them.
let collectable: CollectableScooterFeed[] = [];
const zoneStore = createZoneStore({ onError: (feed, error) => console.warn(JSON.stringify({ event: 'zones_feed_failed', feed,
  error: (error instanceof Error ? error.message : String(error)).slice(0, 300) })) });

// Validate configuration before doing any network collection.
const schedule = cadenceFromEnv();
// Always-fast sources every minute; the others every idle interval, and every minute while someone looks.
const scheduler = new FeedScheduler(collect, { ...schedule,
  alwaysFast: feed => schedule.alwaysFastSources.has(feed.source),
  // After a restart, a feed collected recently waits for its turn rather than everyone at once.
  lastCollectedAt: feed => {
    const record = records.get(feed.id);
    return record && !record.failed ? record.collectedAt ?? (record.attemptedAt || undefined) : undefined;
  },
  onStart: (_feed, reason) => metrics.recordCollectionStart(reason) });
// The expiry of the feeds collected less often on purpose (Lime, BinBin, GCOO), from their definitions.
let ownIdleExpiry = ownIdleExpiries([]);
const cadence: FeedCadence = { fastSince: (id, now) => scheduler.fastSince(id, now), idleExpiryMs: schedule.idleExpiryMs,
  idleExpiryMsForFeed: id => ownIdleExpiry(id) };
// A scooter a feed puts far away for a while, as 3electra puts Kyiv's in Lima, keeps its last place
// for ten minutes, or until the feed's next collection when that is later.
const holdStrays = createStrayHold((id, now) => scheduler.fastSince(id, now) === undefined
  ? schedule.idleIntervalMs : schedule.activeIntervalMs);
// City totals count the feeds collected on time, whatever the age of their positions.
const countedAt = (now: number) => (feed: FeedSnapshot) => feedState(feed, now, cadence) !== 'expired';
const metrics = createSnapshotMetrics(process.env.SOURCE_COMMIT, { cadence,
  cadenceModes: now => scheduler.modes(now), upstreamRequests: () => ({
    status: upstreamJsonCache.requests.status + dottMapRequests.status + voiMapRequests.status + atomMapRequests.status + luupMapRequests.status + jetMapRequests.status + whooshMapRequests.status + limeMapRequests.status +
      binbinMapRequests.status + beamMapRequests.status + gcooMapRequests.status + kickgoingMapRequests.status + swingMapRequests.status,
    metadata: upstreamJsonCache.requests.metadata + voiMapRequests.metadata + atomMapRequests.metadata + luupMapRequests.metadata + whooshMapRequests.metadata + limeMapRequests.metadata + beamMapRequests.metadata,
  }),
  planRefreshes: () => planRefreshCounts,
  upstreamCache: () => ({ entries: upstreamJsonCache.size, capacity: upstreamJsonCache.capacity,
    evictions: upstreamJsonCache.evictions }) });
const server = createSnapshotServer({ snapshot: () => snapshot,
  token: process.env.SCOOTER_SNAPSHOT_API_TOKEN, production: process.env.NODE_ENV === 'production',
  version: process.env.SOURCE_COMMIT, metrics, metricsToken: process.env.METRICS_TOKEN, cadence, refresher: scheduler,
  zones: query => answerZones(zoneStore, collectable, query, COLD_WAIT_MS) });
try {
  const persisted = await readSnapshot(snapshotPath);
  if (persisted) {
    snapshot = persisted;
    for (const feed of persisted.feeds) records.set(feed.id, feed);
  }
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.error('Snapshot restore failed', error);
    reportError('restore', error);
  }
}

function publish() {
  const now = Date.now();
  const feeds = [...records.values()];
  snapshot = { version: 1, updatedAt: now, feeds,
    overview: snapshot?.overview ?? buildCityOverview(feeds, now, countedAt(now)) };
  dirty = true;
}

async function collect(definition: CollectableScooterFeed) {
  const system = regionalSystems.get(definition.id);
  let failed = false;
  const timed = async () => {
    const started = performance.now();
    try {
      const result = await definition.collect();
      metrics.recordCollection(definition, false, (performance.now() - started) / 1000);
      lastErrors.delete(definition.id);
      return holdStrays(definition.id, result, records.get(definition.id), Date.now());
    } catch (error) {
      failed = true;
      metrics.recordCollection(definition, true, (performance.now() - started) / 1000);
      lastErrors.set(definition.id, (error instanceof Error ? error.message : String(error)).slice(0, 300));
      throw error;
    }
  };
  await collectSnapshotFeed({ ...definition, collect: timed }, records.get(definition.id), record => {
    // Removed definitions may still have requests finishing in the background.
    if (stopping || !records.has(definition.id)) return;
    records.set(definition.id, record);
    publish();
  }, system && !isAppMapSystem(system) ? () => fetchRegionalParking(system) : undefined);
  return { failed };
}

function setDefinitions(definitions: CollectableScooterFeed[], retireMissing: boolean) {
  collectable = definitions;
  ownIdleExpiry = ownIdleExpiries(definitions);
  if (retireMissing) {
    const active = new Set(definitions.map(feed => feed.id));
    for (const id of records.keys()) if (!active.has(id)) records.delete(id);
    for (const id of lastErrors.keys()) if (!active.has(id)) lastErrors.delete(id);
  }
  registerFeedDefinitions(records, definitions);
  publish();
  // Every feed's documents stay in memory between its collections, however many countries are added.
  upstreamJsonCache.reserve(upstreamCacheEntriesFor(definitions.length));
  scheduler.setFeeds(definitions);
}

async function persist(final = false) {
  if (persisting) return persisting;
  if (!snapshot || !dirty) return;
  const now = Date.now();
  if (overviewNeedsRefresh(snapshot, snapshot.feeds, now, countedAt(now))) {
    snapshot = { ...snapshot, overview: buildCityOverview(snapshot.feeds, now, countedAt(now)) };
  }
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
  const saved = snapshot;
  persisting = (async () => {
    const temporaryPath = join(temporaryDirectory, `scooters.${randomUUID()}.json.tmp`);
    try {
      await mkdir(temporaryDirectory, { recursive: true });
      await writeSnapshot(temporaryPath, saved);
      await rename(temporaryPath, snapshotPath);
    } catch (error) {
      dirty = true;
      console.error('Snapshot persistence failed', error);
      reportError('persist', error);
    } finally {
      await rm(temporaryPath, { force: true }).catch(() => {});
    }
  })();
  try { await persisting; } finally { persisting = undefined; }
}

let discoveryTimer: ReturnType<typeof setTimeout>;
async function discover() {
  let retryMs = 3600_000;
  try {
    const definitions = withAppCollectors(await discoverCollectableFeeds());
    if (!stopping) setDefinitions(definitions, true);
    metrics.recordDiscovery();
  } catch (error) {
    retryMs = 60_000;
    console.error('Feed discovery failed; retaining the previous catalog', error);
    reportError('discovery', error);
  }
  if (!stopping) discoveryTimer = setTimeout(() => void discover(), retryMs);
}
setDefinitions(withAppCollectors(independentCollectableFeeds()), false);
scheduler.start();
void discover();
// Sentry hears of a feed still expired after 5 minutes, or 15 for Voi's Swiss feed (expiredReportDelay).
const logFeedStates = createFeedStateLog(console.log, undefined, cadence, { afterMs: expiredReportDelay,
  // Under a night ban, an operator may take its feed down until morning, as Dott did in Trondheim
  // on 16 October 2026: Sentry hears of it only if it is not back 15 minutes after the ban.
  wait: waitOutCurfew(feedCurfewed),
  report: (change, feed) => {
    // In its seasonal pause, a feed is expected to stop; the log still says it did.
    if (!feedPaused(feed.id, Date.now())) reportFeedExpired(change, feed, lastErrors.get(feed.id));
  } });
const persistenceTimer = setInterval(() => {
  if (snapshot) logFeedStates(snapshot.feeds);
  void persist();
}, 5_000);
server.listen(Number(process.env.PORT ?? 3001), '0.0.0.0', () => console.log('Scooter snapshot API listening'));
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    stopping = true;
    scheduler.stop();
    clearTimeout(discoveryTimer);
    clearInterval(persistenceTimer);
    server.close();
    void (async () => { await persisting; await persist(true); })();
  });
}
