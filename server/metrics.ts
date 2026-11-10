import { createHash, randomBytes } from 'node:crypto';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { COUNTRY_NAMES } from '../src/generated/countries';
import { standbyNationalFeed } from '../src/lib/feedCoverage';
import { COUNTRY_SOURCES, collectsParking } from '../src/lib/regionalScooterSystems';
import type { MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { feedCurfewed, feedPaused } from '../src/lib/seasonalPauses';
import { ALWAYS_FAST, feedState, parkingUp, type FeedCadence, type FeedState } from './feedStateLog';
import type { CollectionReason, FeedCadenceMode } from './feedScheduler';
import type { VisitorCounts } from './visitorLedger';

interface FeedLabels { id: string; source: string; provider: string }
type Labels = Record<string, string>;

const FEED_STATES: FeedState[] = ['ok', 'failing', 'expired'];
// The country of each catalog's source; the others (national, hopp, publibike) are Swiss.
const COUNTRY_OF_SOURCE = new Map<string, string>(Object.entries(COUNTRY_SOURCES)
  .map(([country, source]) => [source, COUNTRY_NAMES[country as keyof typeof COUNTRY_SOURCES].en]));
const countryOf = (source: string) => COUNTRY_OF_SOURCE.get(source) ?? COUNTRY_NAMES.CH.en;
const EVENT_LOOP_RESOLUTION_MS = 20;
const LIME_WAKE_WINDOW_MS = 15 * 60_000;
// The visitors of a window by the Lime refreshes they set off in it: up to 1, 3, 7, 15, and more.
const LIME_WAKE_BUCKETS: [string, number][] = [['1', 1], ['2-3', 3], ['4-7', 7], ['8-15', 15], ['16+', Infinity]];
const LIME_WAKE_MAX_CLIENTS = 10_000;
/** The bounds, in seconds, of the buckets of the refreshes' times. */
export const REFRESH_BUCKETS = [1, 2, 3, 5, 7.5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300, 600, 1200];
/** A refresh asked for whose collection has not ended after this is forgotten. */
const REFRESH_FORGET_MS = 60 * 60_000;
/**
 * How long a visitor waited, from the request that asked for the feed: for its collection to start
 * (a slot on its host or account), for its first scooters to be published (a sweep's nearest the
 * view, or all of them), and for it to end.
 */
type RefreshPhase = 'start' | 'first' | 'done';

interface MetricsSources {
  /** How often each feed is meant to be collected, which its state is judged by. */
  cadence?: FeedCadence;
  /** How many feeds are on each cadence now. */
  cadenceModes?: (now: number) => Record<FeedCadenceMode, number>;
  /** Requests sent to operators since the start, by kind. */
  upstreamRequests?: () => Record<string, number>;
  /** Lime requests by a manifest's non-secret account id, including idle accounts at zero. */
  limeAccountRequests?: () => readonly { account: string; status: number; metadata: number }[];
  /** Pricing plans fetched again for scooters naming plans they did not list, by outcome. */
  planRefreshes?: () => Record<string, number>;
  /** How full the cache of operators' documents is, and how many it dropped to make room. */
  upstreamCache?: () => { entries: number; capacity: number; evictions: number };
  /**
   * Whether the feed is in its seasonal pause; feedPaused from the catalogs by default. A feed whose operator says
   * its season is over is paused too, and in the cache one collected through a silent worker (scooter-cache.ts).
   */
  paused?: (feedId: string, now: number) => boolean;
  /** Whether a night ban holds at every service area of the feed; feedCurfewed by default. */
  curfewed?: (feedId: string, now: number) => boolean;
  /** The visitors of the closed quarter hours by requests and areas (visitorLedger.ts). */
  visitors?: (now: number) => VisitorCounts;
}

/**
 * Prometheus metrics of the snapshot server, in the text exposition format.
 * Labels hold feed ids, sources, providers, routes and status codes only:
 * never a map URL, coordinates or a caller's address. Feed states come from
 * the snapshot at scrape time; collections and requests are counted as they
 * happen, from zero since the process started.
 */
export function createSnapshotMetrics(version = 'local', sources: MetricsSources = {}) {
  const cadence = sources.cadence ?? ALWAYS_FAST;
  const paused = sources.paused ?? feedPaused;
  const curfewed = sources.curfewed ?? feedCurfewed;
  const collections = new Map<string, { labels: Labels; ok: number; failed: number; seconds: number }>();
  const starts = new Map<CollectionReason, number>();
  const waits = { collected: 0, timeout: 0 };
  const requests = new Map<string, { labels: Labels; count: number }>();
  const requestSeconds = new Map<string, { count: number; seconds: number }>();
  let geoapifyRequests = 0;
  let loweredZooms = 0;
  let discoveredAt = 0;
  const eventLoop = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS });
  eventLoop.enable();
  // The Lime refreshes each visitor set off in the current 15 minutes (UTC quarter hours), by a hash of
  // their address salted afresh by each process: no address is kept, and the hashes go when the window
  // closes, into the buckets' counts. They tell whether a few visitors take most of Lime's accounts'
  // requests, for a cap on each visitor, or everyone, for a fourth account.
  const salt = randomBytes(16);
  let limeWindow = 0;
  const limeWakesOf = new Map<string, number>();
  const limeWakeClients = new Map(LIME_WAKE_BUCKETS.map(([bucket]) => [bucket, 0]));
  const limeWakes = new Map(LIME_WAKE_BUCKETS.map(([bucket]) => [bucket, 0]));
  // The refreshes requests asked for, by feed, until their collection ends; and their times and outcomes, by kind.
  const asked = new Map<string, { labels: Labels; at: number; startedAt?: number; firstAt?: number }>();
  const refreshTimes = new Map<string, { labels: Labels; buckets: number[]; seconds: number; count: number }>();
  const refreshOutcomes = new Map<string, { labels: Labels; count: number }>();
  const observeRefresh = (labels: Labels, phase: RefreshPhase, ms: number) => {
    const key = `${labels.provider} ${labels.map} ${labels.kind} ${phase}`;
    const entry = refreshTimes.get(key) ?? { labels: { ...labels, phase }, buckets: REFRESH_BUCKETS.map(() => 0), seconds: 0, count: 0 };
    const seconds = Math.max(0, ms) / 1000;
    REFRESH_BUCKETS.forEach((bound, index) => { if (seconds <= bound) entry.buckets[index]++; });
    entry.seconds += seconds;
    entry.count++;
    refreshTimes.set(key, entry);
  };
  const closeLimeWindow = (now: number) => {
    const window = Math.floor(now / LIME_WAKE_WINDOW_MS);
    if (window === limeWindow) return;
    for (const count of limeWakesOf.values()) {
      const [bucket] = LIME_WAKE_BUCKETS.find(([, most]) => count <= most)!;
      limeWakeClients.set(bucket, limeWakeClients.get(bucket)! + 1);
      limeWakes.set(bucket, limeWakes.get(bucket)! + count);
    }
    limeWakesOf.clear();
    limeWindow = window;
  };

  return {
    recordCollection(feed: FeedLabels, failed: boolean, seconds: number) {
      const entry = collections.get(feed.id)
        ?? { labels: { feed: feed.id, source: feed.source, provider: feed.provider }, ok: 0, failed: 0, seconds: 0 };
      if (failed) entry.failed++; else entry.ok++;
      entry.seconds += seconds;
      collections.set(feed.id, entry);
    },
    recordRequest(route: string, status: number, seconds: number) {
      const key = `${route} ${status}`;
      const entry = requests.get(key) ?? { labels: { route, status: String(status) }, count: 0 };
      entry.count++;
      requests.set(key, entry);
      const timing = requestSeconds.get(route) ?? { count: 0, seconds: 0 };
      timing.count++;
      timing.seconds += seconds;
      requestSeconds.set(route, timing);
    },
    recordDiscovery(at = Date.now()) { discoveredAt = at; },
    recordCollectionStart(reason: CollectionReason) { starts.set(reason, (starts.get(reason) ?? 0) + 1); },
    /** A request waited for the collection of feeds whose positions had expired. */
    recordWait(collected: boolean) { waits[collected ? 'collected' : 'timeout']++; },
    /** Requests an address search on the Worker sent to Geoapify. */
    recordGeoapifyRequests(count: number) { geoapifyRequests += count; },
    /** A request for scooters whose box was too large for its zoom, answered at a lower one (scooterAnswerZoom). */
    recordLoweredZoom() { loweredZooms++; },
    /**
     * A request asked for the feed to be collected again, as its data was over a minute old: `cold` when it
     * had no position recent enough to show, so the visitor waits for its scooters, else `warm`. The first
     * request times the refresh; the others asking meanwhile join it.
     */
    recordRefreshAsked(feed: FeedLabels, app: boolean, cold: boolean, now = Date.now()) {
      for (const [id, entry] of asked) if (now - entry.at > REFRESH_FORGET_MS) asked.delete(id);
      if (asked.has(feed.id)) return;
      asked.set(feed.id, { labels: { provider: feed.provider, map: app ? 'app' : 'feed', kind: cold ? 'cold' : 'warm' }, at: now });
    },
    /**
     * Nobody asks for the feed any more: its watch lapsed before its collection started, which then goes on
     * as an idle one (FeedScheduler's onLapse). Its wait is no visitor's, so it is not counted; a request
     * asking for the feed again times a refresh of its own.
     */
    recordRefreshLapsed(id: string) { asked.delete(id); },
    /** The feed's collection started; one under way when the request came answers it from then. */
    recordRefreshStarted(id: string, now = Date.now()) {
      const entry = asked.get(id);
      if (entry && entry.startedAt === undefined) entry.startedAt = now;
    },
    /** A sweep of the feed published the scooters it had found so far. */
    recordRefreshProgress(id: string, now = Date.now()) {
      const entry = asked.get(id);
      if (entry && entry.firstAt === undefined) entry.firstAt = now;
    },
    /** The feed's collection ended and its scooters were published, or it failed. */
    recordRefreshEnded(id: string, failed: boolean, now = Date.now()) {
      const entry = asked.get(id);
      if (!entry) return;
      asked.delete(id);
      const outcome = failed ? 'failed' : 'ok';
      const key = `${entry.labels.provider} ${entry.labels.map} ${entry.labels.kind} ${outcome}`;
      const counted = refreshOutcomes.get(key) ?? { labels: { ...entry.labels, outcome }, count: 0 };
      counted.count++;
      refreshOutcomes.set(key, counted);
      if (failed) return;
      observeRefresh(entry.labels, 'start', (entry.startedAt ?? entry.at) - entry.at);
      observeRefresh(entry.labels, 'first', (entry.firstAt ?? now) - entry.at);
      observeRefresh(entry.labels, 'done', now - entry.at);
    },
    /** A visitor's request (`client`, its address) set off the refresh of `count` Lime rider-map feeds. */
    recordLimeWakes(client: string, count: number, now = Date.now()) {
      if (!count) return;
      closeLimeWindow(now);
      const id = createHash('sha256').update(salt).update(client).digest('base64url');
      if (!limeWakesOf.has(id) && limeWakesOf.size >= LIME_WAKE_MAX_CLIENTS) return;
      limeWakesOf.set(id, (limeWakesOf.get(id) ?? 0) + count);
    },
    /**
     * countersOnly: the counters alone, for Prometheus's scrape of each container by its address, whose
     * job keeps only them (summed across the two containers of a deploy); the scrape by name reads the
     * gauges. It skips the per-feed gauges, most of a render's work, and leaves the event loop's delay
     * to the scrape by name, which then reads it over the 30 s since its own previous scrape rather
     * than the 15 s since the other job's.
     */
    render(snapshot: MobilitySnapshot | undefined, now = Date.now(), countersOnly = false): string {
      const out: string[] = [];
      const metric = (name: string, type: string, help: string, samples: [Labels, number][]) => {
        out.push(`# HELP ${name} ${help}`, `# TYPE ${name} ${type}`);
        for (const [labels, value] of samples) out.push(`${name}${formatLabels(labels)} ${value}`);
      };
      // As in the feed state log, a feed not attempted yet has no state to speak of.
      const attempted = (snapshot?.feeds ?? []).filter(feed => feed.attemptedAt > 0);
      const feeds = attempted.filter(feed => !feed.skipped);
      // A skipped feed, whose operator lists nothing at all (Bird out of season, a Dott region it
      // has paused), has no state either, but holds no scooter, which the empty-feed alert counts.
      // Not the Swiss systems sharedmobility.ch keeps listing after their operator stopped: they are
      // skipped as inactive for good. Nor Lime's groups standing by for a national feed that serves.
      const counted = attempted.filter(feed => !feed.skipped || (feed.source !== 'national' && !standbyNationalFeed(feed.id)));
      const labelsOf = (feed: FeedLabels): Labels => ({ feed: feed.id, source: feed.source, provider: feed.provider });
      // A feed retired from the catalog stops counting.
      if (snapshot) {
        const catalog = new Set(snapshot.feeds.map(feed => feed.id));
        for (const id of collections.keys()) if (!catalog.has(id)) collections.delete(id);
      }

      if (!countersOnly) {
        metric('scootradar_build_info', 'gauge', 'The running commit.', [[{ version }, 1]]);
        metric('scootradar_snapshot_updated_timestamp_seconds', 'gauge', 'When a collection last changed the snapshot.',
          snapshot ? [[{}, seconds(snapshot.updatedAt)]] : []);
        metric('scootradar_overview_generated_timestamp_seconds', 'gauge', 'When the city totals were last rebuilt.',
          snapshot ? [[{}, seconds(snapshot.overview.generatedAt)]] : []);
        metric('scootradar_discovery_success_timestamp_seconds', 'gauge', 'When the feed catalog was last discovered.',
          discoveredAt ? [[{}, seconds(discoveredAt)]] : []);
        metric('scootradar_feed_state', 'gauge',
          'ok: served. failing: the last collection failed, the previous positions are still served. expired: nothing is served and the map says the provider is not sharing data.',
          feeds.flatMap(feed => {
            const state = feedState(feed, now, cadence);
            return FEED_STATES.map((candidate): [Labels, number] => [{ ...labelsOf(feed), state: candidate }, candidate === state ? 1 : 0]);
          }));
        metric('scootradar_feed_paused', 'gauge',
          'Whether every service area of the feed is in its seasonal pause, as Montréal each winter, or its operator says its season is over, as Whoosh in Almaty: it may serve nothing, the map says the town is paused for the season, and the feed-stopped and feed-empty alerts ignore it. In the cache, a feed collected through a worker that has stopped asking for jobs, as the Ryde bridge paused on its Mac, is paused too until the worker asks again, though the map does not say so.',
          counted.map(feed => [labelsOf(feed), feed.seasonOver || paused(feed.id, now) ? 1 : 0]));
        metric('scootradar_feed_curfewed', 'gauge',
          'Whether a night ban holds at every service area of the feed, as in Trondheim on Friday and Saturday nights: its operator may take the feed down until morning, and the feed-stopped alert waits for the ban to end.',
          counted.map(feed => [labelsOf(feed), curfewed(feed.id, now) ? 1 : 0]));
        metric('scootradar_feed_vehicles', 'gauge', 'Available standing scooters held for the feed, 0 once it has expired or while its operator lists none.',
          counted.map(feed => [labelsOf(feed), feedState(feed, now, cadence) === 'expired' ? 0 : feed.vehicles.length]));
        metric('scootradar_feed_priced_vehicles', 'gauge', 'Of those, the scooters with a price: the rest name no plan, a plan the feed does not list, or one the app cannot show.',
          counted.map(feed => [labelsOf(feed), feedState(feed, now, cadence) === 'expired' ? 0
            : feed.vehicles.reduce((count, vehicle) => vehicle.pricing ? count + 1 : count, 0)]));
        metric('scootradar_feed_info', 'gauge', 'The country of the feed, in English, for the alerts to name.',
          counted.map(feed => [{ ...labelsOf(feed), country: countryOf(feed.source) }, 1]));
        metric('scootradar_feed_observation_timestamp_seconds', 'gauge', 'The source timestamp of the positions held for the feed.',
          feeds.filter(feed => feed.observedAt > 0).map(feed => [labelsOf(feed), seconds(feed.observedAt)]));
        metric('scootradar_feed_attempt_timestamp_seconds', 'gauge', 'When the feed was last collected, successfully or not.',
          feeds.map(feed => [labelsOf(feed), seconds(feed.attemptedAt)]));
        metric('scootradar_feed_parking_up', 'gauge', 'Whether the feed\'s parking availability is as fresh as its cadence promises, for the regional feeds that collect parking (not the app maps).',
          feeds.filter(collectsParking).map(feed => [labelsOf(feed), parkingUp(feed, now, cadence) ? 1 : 0]));
        if (sources.cadenceModes) {
          metric('scootradar_feeds_by_cadence', 'gauge',
            'Feeds by cadence: always (collected every minute), watched (someone looked recently, every minute), idle.',
            Object.entries(sources.cadenceModes(now)).map(([mode, count]) => [{ cadence: mode }, count]));
        }
      }
      metric('scootradar_collections_started_total', 'counter',
        'Collections started, by reason: always, watched, wake (a request found the data over a minute old), idle, retry (an idle feed that failed).',
        [...starts].map(([reason, count]) => [{ reason }, count]));
      metric('scootradar_request_waits_total', 'counter',
        'Requests that waited for feeds whose positions had expired, by whether their collection finished in time.',
        Object.entries(waits).map(([outcome, count]) => [{ outcome }, count]));
      if (sources.upstreamRequests) {
        metric('scootradar_upstream_requests_total', 'counter',
          'Requests sent to operators, by kind: status (positions, parking) or metadata (kept an hour or more).',
          Object.entries(sources.upstreamRequests()).map(([kind, count]) => [{ kind }, count]));
      }
      if (sources.limeAccountRequests) {
        metric('scootradar_lime_account_requests_total', 'counter',
          'Lime requests sent by independently paced production account and request kind.',
          sources.limeAccountRequests().flatMap(row => (['status', 'metadata'] as const).map((kind): [Labels, number] => [{ account: row.account, kind }, row[kind]])));
      }
      if (sources.planRefreshes) {
        metric('scootradar_pricing_plan_refreshes_total', 'counter',
          'Pricing plans fetched again because a scooter named a plan they did not list, by outcome: listed (they list it now) or unlisted (still not, or the fetch failed).',
          Object.entries(sources.planRefreshes()).map(([outcome, count]) => [{ outcome }, count]));
      }
      if (sources.upstreamCache) {
        const cache = sources.upstreamCache();
        if (!countersOnly) {
          metric('scootradar_upstream_cache_entries', 'gauge',
            'Operators\' documents held in memory (used) and the most the cache holds (capacity), sized from the feed count.',
            [[{ kind: 'used' }, cache.entries], [{ kind: 'capacity' }, cache.capacity]]);
        }
        metric('scootradar_upstream_cache_evictions_total', 'counter',
          'Documents dropped, least recently used first, to make room while they could still be served.',
          [[{}, cache.evictions]]);
      }
      closeLimeWindow(now);
      metric('scootradar_lime_wake_clients_total', 'counter',
        'Visitors whose requests set off refreshes of Lime rider-map feeds, counted as each 15-minute window closes, by how many they set off in it (refreshes: 1, 2-3, 4-7, 8-15, 16+).',
        [...limeWakeClients].map(([refreshes, count]) => [{ refreshes }, count]));
      metric('scootradar_lime_wakes_total', 'counter',
        'The Lime rider-map refreshes those visitors set off, by the same buckets.',
        [...limeWakes].map(([refreshes, count]) => [{ refreshes }, count]));
      metric('scootradar_scooter_zoom_lowered_total', 'counter',
        'Requests for scooters whose box no screen shows at their zoom, answered at the highest zoom it fits: clusters or the city totals instead of every scooter.',
        [[{}, loweredZooms]]);
      if (sources.visitors) {
        const visitors = sources.visitors(now);
        metric('scootradar_visitors_total', 'counter',
          'Visitors of each closed UTC quarter hour, told apart by a hash of their address salted by each process and kept only that quarter hour (an IPv6 one by its /64), by the requests for scooters they made in it.',
          visitors.byRequests.map(([requests, count]) => [{ requests }, count]));
        metric('scootradar_visitor_areas_total', 'counter',
          'The same visitors, by the areas (cells of half a degree) their requests at a zoom past the city totals asked for. A map is looked at in one or a few; a scraper sweeping a country asks for dozens.',
          visitors.byAreas.map(([areas, count]) => [{ areas }, count]));
        metric('scootradar_unwatched_requests_total', 'counter',
          'Requests for scooters answered from what the cache holds without collecting their view again: their visitor had already asked for 32 other areas that quarter hour.',
          [[{}, visitors.unwatched]]);
        if (!countersOnly) {
          metric('scootradar_visitor_max_requests', 'gauge', 'The most requests for scooters one visitor made in the last closed quarter hour.',
            [[{}, visitors.lastWindow.requests]]);
          metric('scootradar_visitor_max_areas', 'gauge', 'The most areas one visitor asked for in the last closed quarter hour, up to 64.',
            [[{}, visitors.lastWindow.areas]]);
        }
      }
      // By build: during a deploy the old and the new container both answer for a minute,
      // and one count read from each in turn would look reset again and again.
      metric('scootradar_geoapify_requests_total', 'counter',
        'Requests address searches sent to Geoapify, as the Worker reports them: its free plan allows 3,000 a day.',
        [[{ version }, geoapifyRequests]]);
      metric('scootradar_refreshes_total', 'counter',
        'Collections requests asked for, as the feed\'s data was over a minute old, by provider, map (app: a rider app\'s map; feed: a public feed), kind (cold: no position recent enough to show; warm: the map still showed its scooters) and outcome.',
        [...refreshOutcomes.values()].map(entry => [entry.labels, entry.count]));
      metric('scootradar_refresh_seconds', 'histogram',
        'Of those that succeeded, the seconds from the request that asked for them until their collection started (phase start), published its first scooters (first: a sweep\'s nearest the view) and ended (done). The map asks again every 3 seconds while a feed refreshes.',
        []);
      for (const entry of refreshTimes.values()) {
        REFRESH_BUCKETS.forEach((bound, index) => out.push(`scootradar_refresh_seconds_bucket${formatLabels({ ...entry.labels, le: String(bound) })} ${entry.buckets[index]}`));
        out.push(`scootradar_refresh_seconds_bucket${formatLabels({ ...entry.labels, le: '+Inf' })} ${entry.count}`,
          `scootradar_refresh_seconds_sum${formatLabels(entry.labels)} ${round(entry.seconds)}`,
          `scootradar_refresh_seconds_count${formatLabels(entry.labels)} ${entry.count}`);
      }
      metric('scootradar_feed_collections_total', 'counter', 'Feed collections by outcome.',
        [...collections.values()].flatMap(entry => [
          [{ ...entry.labels, outcome: 'ok' }, entry.ok] as [Labels, number],
          [{ ...entry.labels, outcome: 'failed' }, entry.failed] as [Labels, number]]));
      metric('scootradar_feed_collection_duration_seconds', 'summary', 'Time spent collecting the feed.', []);
      for (const entry of collections.values()) {
        out.push(`scootradar_feed_collection_duration_seconds_sum${formatLabels(entry.labels)} ${round(entry.seconds)}`,
          `scootradar_feed_collection_duration_seconds_count${formatLabels(entry.labels)} ${entry.ok + entry.failed}`);
      }
      metric('scootradar_http_requests_total', 'counter', 'Requests answered, by route and status.',
        [...requests.values()].map(entry => [entry.labels, entry.count]));
      metric('scootradar_http_request_duration_seconds', 'summary', 'Time spent answering requests, by route.', []);
      for (const [route, timing] of requestSeconds) {
        out.push(`scootradar_http_request_duration_seconds_sum${formatLabels({ route })} ${round(timing.seconds)}`,
          `scootradar_http_request_duration_seconds_count${formatLabels({ route })} ${timing.count}`);
      }

      const cpu = process.cpuUsage();
      metric('process_cpu_seconds_total', 'counter', 'User and system CPU time spent.', [[{}, round((cpu.user + cpu.system) / 1e6)]]);
      if (countersOnly) return `${out.join('\n')}\n`;
      const memory = process.memoryUsage();
      metric('process_start_time_seconds', 'gauge', 'When the process started.',
        [[{}, Math.round(performance.timeOrigin / 1000)]]);
      metric('process_resident_memory_bytes', 'gauge', 'Resident memory size.', [[{}, memory.rss]]);
      metric('nodejs_heap_used_bytes', 'gauge', 'V8 heap in use.', [[{}, memory.heapUsed]]);
      // Over the time since the previous scrape. Each sample spans the sampling interval too.
      const lag = (nanoseconds: number) => round(Math.max(0, nanoseconds / 1e6 - EVENT_LOOP_RESOLUTION_MS) / 1000);
      metric('nodejs_eventloop_lag_p99_seconds', 'gauge', 'The 99th percentile of event loop delay.',
        [[{}, lag(eventLoop.percentile(99))]]);
      metric('nodejs_eventloop_lag_max_seconds', 'gauge', 'The longest event loop delay.', [[{}, lag(eventLoop.max)]]);
      eventLoop.reset();
      return `${out.join('\n')}\n`;
    },
  };
}

export type SnapshotMetrics = ReturnType<typeof createSnapshotMetrics>;

const seconds = (milliseconds: number) => round(milliseconds / 1000);
const round = (value: number) => Math.round(value * 1000) / 1000;

function formatLabels(labels: Labels): string {
  const entries = Object.entries(labels);
  if (!entries.length) return '';
  return `{${entries.map(([key, value]) => `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`).join(',')}}`;
}
