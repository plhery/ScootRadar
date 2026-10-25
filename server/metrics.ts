import { monitorEventLoopDelay } from 'node:perf_hooks';
import { COUNTRY_NAMES } from '../src/generated/countries';
import { COUNTRY_SOURCES, collectsParking } from '../src/lib/regionalScooterSystems';
import type { MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { feedCurfewed, feedPaused } from '../src/lib/seasonalPauses';
import { ALWAYS_FAST, feedState, parkingUp, type FeedCadence, type FeedState } from './feedStateLog';
import type { CollectionReason, FeedCadenceMode } from './feedScheduler';

interface FeedLabels { id: string; source: string; provider: string }
type Labels = Record<string, string>;

const FEED_STATES: FeedState[] = ['ok', 'failing', 'expired'];
// The country of each catalog's source; the others (national, hopp, publibike) are Swiss.
const COUNTRY_OF_SOURCE = new Map<string, string>(Object.entries(COUNTRY_SOURCES)
  .map(([country, source]) => [source, COUNTRY_NAMES[country as keyof typeof COUNTRY_SOURCES].en]));
const countryOf = (source: string) => COUNTRY_OF_SOURCE.get(source) ?? COUNTRY_NAMES.CH.en;
const EVENT_LOOP_RESOLUTION_MS = 20;

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
  /** Whether the feed is in its seasonal pause; feedPaused from the catalogs by default. A feed whose operator says its season is over is paused too. */
  paused?: (feedId: string, now: number) => boolean;
  /** Whether a night ban holds at every service area of the feed; feedCurfewed by default. */
  curfewed?: (feedId: string, now: number) => boolean;
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
  let discoveredAt = 0;
  const eventLoop = monitorEventLoopDelay({ resolution: EVENT_LOOP_RESOLUTION_MS });
  eventLoop.enable();

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
    render(snapshot: MobilitySnapshot | undefined, now = Date.now()): string {
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
      // skipped as inactive for good.
      const counted = attempted.filter(feed => !feed.skipped || feed.source !== 'national');
      const labelsOf = (feed: FeedLabels): Labels => ({ feed: feed.id, source: feed.source, provider: feed.provider });
      // A feed retired from the catalog stops counting.
      if (snapshot) {
        const catalog = new Set(snapshot.feeds.map(feed => feed.id));
        for (const id of collections.keys()) if (!catalog.has(id)) collections.delete(id);
      }

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
        'Whether every service area of the feed is in its seasonal pause, as Montréal each winter, or its operator says its season is over, as Whoosh in Almaty: it may serve nothing, the map says the town is paused for the season, and the feed-stopped and feed-empty alerts ignore it.',
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
        metric('scootradar_upstream_cache_entries', 'gauge',
          'Operators\' documents held in memory (used) and the most the cache holds (capacity), sized from the feed count.',
          [[{ kind: 'used' }, cache.entries], [{ kind: 'capacity' }, cache.capacity]]);
        metric('scootradar_upstream_cache_evictions_total', 'counter',
          'Documents dropped, least recently used first, to make room while they could still be served.',
          [[{}, cache.evictions]]);
      }
      // By build: during a deploy the old and the new container both answer for a minute,
      // and one count read from each in turn would look reset again and again.
      metric('scootradar_geoapify_requests_total', 'counter',
        'Requests address searches sent to Geoapify, as the Worker reports them: its free plan allows 3,000 a day.',
        [[{ version }, geoapifyRequests]]);
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

      const memory = process.memoryUsage();
      const cpu = process.cpuUsage();
      metric('process_start_time_seconds', 'gauge', 'When the process started.',
        [[{}, Math.round(performance.timeOrigin / 1000)]]);
      metric('process_cpu_seconds_total', 'counter', 'User and system CPU time spent.', [[{}, round((cpu.user + cpu.system) / 1e6)]]);
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
