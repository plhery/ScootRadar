import { mkdir, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { discoverCollectableFeeds, independentCollectableFeeds, planRefreshCounts, type CollectableScooterFeed } from '../src/lib/scooterFeeds';
import { buildCityOverview, overviewNeedsRefresh, VEHICLE_MAX_AGE_MS, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { REGIONAL_SCOOTER_SYSTEMS, regionalSource } from '../src/lib/regionalScooterSystems';
import { feedPaused } from '../src/lib/seasonalPauses';
import { upstreamCacheEntriesFor, upstreamJsonCache } from '../src/lib/upstreamJsonCache';
import { fetchRegionalParking } from '../src/lib/parkingFeeds';
import { FeedScheduler } from './feedScheduler';
import { createSnapshotServer } from './snapshotServer';
import { readSnapshot, writeSnapshot } from './snapshotFile';
import { collectSnapshotFeed } from './collectFeed';
import { createFeedStateLog, feedState, type FeedCadence } from './feedStateLog';
import { createSnapshotMetrics } from './metrics';
import { initErrorReporting, reportError, reportFeedExpired } from './errorReporting';
import { cadenceFromEnv } from './cadence';

initErrorReporting();
upstreamJsonCache.paceHost('gbfs.api.ridedott.com', 150);
// ATOM Mobility hosts its operators (Hoppy, Ride Mobility, Yoio) under rideatom.com and refuses
// bursts, so each of its hosts gets at most two requests a second, cold starts included.
for (const host of new Set(REGIONAL_SCOOTER_SYSTEMS.map(system => new URL(system.discoveryUrl).hostname))) {
  if (host.endsWith('.rideatom.com')) upstreamJsonCache.paceHost(host, 500);
}
const snapshotPath = process.env.SCOOTER_SNAPSHOT_PATH ?? '/data/scooters.json';
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
const cadence: FeedCadence = { fastSince: (id, now) => scheduler.fastSince(id, now), idleExpiryMs: schedule.idleExpiryMs };
// City totals count the feeds collected on time, whatever the age of their positions.
const countedAt = (now: number) => (feed: FeedSnapshot) => feedState(feed, now, cadence) !== 'expired';
const metrics = createSnapshotMetrics(process.env.SOURCE_COMMIT, { cadence,
  cadenceModes: now => scheduler.modes(now), upstreamRequests: () => upstreamJsonCache.requests,
  planRefreshes: () => planRefreshCounts,
  upstreamCache: () => ({ entries: upstreamJsonCache.size, capacity: upstreamJsonCache.capacity,
    evictions: upstreamJsonCache.evictions }) });
const server = createSnapshotServer({ snapshot: () => snapshot,
  token: process.env.SCOOTER_SNAPSHOT_API_TOKEN, production: process.env.NODE_ENV === 'production',
  version: process.env.SOURCE_COMMIT, metrics, metricsToken: process.env.METRICS_TOKEN, cadence, refresher: scheduler });
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
      return result;
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
  }, system ? () => fetchRegionalParking(system) : undefined);
  return { failed };
}

function setDefinitions(definitions: CollectableScooterFeed[], retireMissing: boolean) {
  if (retireMissing) {
    const active = new Set(definitions.map(feed => feed.id));
    for (const id of records.keys()) if (!active.has(id)) records.delete(id);
    for (const id of lastErrors.keys()) if (!active.has(id)) lastErrors.delete(id);
  }
  for (const definition of definitions) if (!records.has(definition.id)) {
    records.set(definition.id, { id: definition.id, source: definition.source, provider: definition.provider,
      coverage: definition.coverage, vehicles: [], observedAt: 0, attemptedAt: 0,
      stale: true, failed: true, skipped: false });
  }
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
    const modes = scheduler.modes(now);
    console.log(JSON.stringify({ event: 'snapshot_health', feeds: relevant.length,
      failedFeeds: relevant.filter(feed => feed.failed).length,
      expiredFeeds: relevant.filter(feed => feedState(feed, now, cadence) === 'expired').length,
      servedFeeds: relevant.filter(feed => now - feed.observedAt <= VEHICLE_MAX_AGE_MS).length,
      alwaysFeeds: modes.always, watchedFeeds: modes.watched, idleFeeds: modes.idle,
      oldestObservationAgeSeconds: relevant.length
        ? Math.round(Math.max(...relevant.map(feed => Date.now() - feed.observedAt)) / 1000) : null }));
  }
  if (!final && now - savedAt < SAVE_EVERY_MS) return;
  dirty = false;
  savedAt = now;
  const saved = snapshot;
  persisting = (async () => {
    const temporaryPath = `${snapshotPath}.${randomUUID()}.tmp`;
    try {
      await mkdir(dirname(snapshotPath), { recursive: true });
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
    const definitions = await discoverCollectableFeeds();
    if (!stopping) setDefinitions(definitions, true);
    metrics.recordDiscovery();
  } catch (error) {
    retryMs = 60_000;
    console.error('Feed discovery failed; retaining the previous catalog', error);
    reportError('discovery', error);
  }
  if (!stopping) discoveryTimer = setTimeout(() => void discover(), retryMs);
}
setDefinitions(independentCollectableFeeds(), false);
scheduler.start();
void discover();
// Sentry hears of a feed still expired after 5 minutes: not of a blip, as Voi's of
// 105 seconds on 16 October 2026. Grafana's "feed stopped" waits 10.
const EXPIRED_REPORT_DELAY_MS = 5 * 60_000;
const logFeedStates = createFeedStateLog(console.log, undefined, cadence, { afterMs: EXPIRED_REPORT_DELAY_MS,
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
