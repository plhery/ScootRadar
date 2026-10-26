import { isIP } from 'node:net';
import * as Sentry from '@sentry/node';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';
import type { FeedStateChange } from './feedStateLog';

const REPORT_INTERVAL_MS = 3600_000;
const lastReportedAt = new Map<string, number>();

/**
 * Sentry, enabled only with SENTRY_DSN. A failing request keeps its method and
 * URL, query included: the map bounds, zoom and filters that reproduce it. Its
 * headers are dropped: they hold the Worker's token and the visitor's address.
 * Stack frames go without their local variables, and any IP address in the event
 * is replaced before it leaves (see withoutIps).
 * Routine feed failures are not reported, only a feed that stops being served for
 * a while (see reportFeedExpired); Prometheus and the logs cover the rest.
 */
export function initErrorReporting(env: Record<string, string | undefined> = process.env): boolean {
  const dsn = env.SENTRY_DSN?.trim();
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: env.SENTRY_ENVIRONMENT?.trim() || env.NODE_ENV || 'development',
    release: env.SOURCE_COMMIT?.trim() || undefined,
    dataCollection: { userInfo: false, httpBodies: [] },
    // Reading them opens Node's inspector on a 127.0.0.1 port ("Debugger listening" at start)
    // and pauses the cache at every exception, caught ones included, while a worker reads them.
    includeLocalVariables: false,
    // Google's token endpoint carries its client API key in the URL. Keep authentication
    // requests out of HTTP breadcrumbs; their status is reported by the collector itself.
    beforeBreadcrumb(breadcrumb) {
      const url = breadcrumb.data?.url;
      if (typeof url === 'string' && url.startsWith('https://securetoken.googleapis.com/')) return null;
      return breadcrumb;
    },
    beforeSend(event) {
      if (event.request) {
        const { method, url, query_string } = event.request;
        event.request = { method, url, query_string };
      }
      delete event.user;
      return withoutIps(event);
    },
    // Sentry 11 attaches stack traces to messages, which then arrive as untyped exceptions.
    attachStacktrace: false,
    // Otherwise every request to an operator's feed carries Sentry's trace headers.
    tracePropagationTargets: [],
    // Sentry only warns by default; Node exits on an unhandled rejection, and so does the cache.
    integrations: [Sentry.onUnhandledRejectionIntegration({ mode: 'strict' })],
  });
  return true;
}

const IPV6_CANDIDATE = /(?:[0-9a-f]{0,4}:){2,}[0-9a-f.]*/gi;
const IPV4_CANDIDATE = /\d{1,3}(?:\.\d{1,3}){3}/g;

function scrubText(text: string) {
  const replace = (match: string) => (isIP(match) ? '[ip]' : match);
  return text.replace(IPV6_CANDIDATE, replace).replace(IPV4_CANDIDATE, replace);
}

function scrub(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === 'string') return scrubText(value);
  if (!value || typeof value !== 'object' || seen.has(value)) return value;
  seen.add(value);
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    // A key that is an address (a map keyed by client, say) goes with its value.
    if (scrubText(key) !== key) delete record[key];
    else record[key] = scrub(record[key], seen);
  }
  return value;
}

/**
 * The event with every IPv4 and IPv6 address replaced by "[ip]", in messages,
 * stack frame variables, breadcrumbs and contexts alike. A visitor's address
 * reaches the cache as a header and becomes the rate limiter's key, so it can
 * sit in the variables of any frame that handled the request.
 */
export function withoutIps<T extends object>(event: T): T {
  const seen = new WeakSet<object>();
  const record = event as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    // SDK bookkeeping, never sent, and it may hold the live request.
    if (key !== 'sdkProcessingMetadata') record[key] = scrub(record[key], seen);
  }
  return event;
}

/** Whether `key` was not reported in the last hour, and now counts as reported. */
function due(key: string, now: number) {
  if (now - (lastReportedAt.get(key) ?? -Infinity) < REPORT_INTERVAL_MS) return false;
  lastReportedAt.set(key, now);
  return true;
}

/**
 * An unexpected error. Each `key` is reported at most once an hour, so a
 * failure that repeats every few seconds (a full disk, say) stays one event
 * an hour while the logs keep every occurrence.
 */
export function reportError(key: string, error: unknown, now = Date.now()) {
  if (!due(key, now)) return;
  Sentry.withScope(scope => {
    scope.setTag('operation', key.split(':')[0]);
    scope.setFingerprint(['{{ default }}', key]);
    Sentry.captureException(error);
  });
}

/**
 * A feed that expired (see feedState) and stayed so for a while (scooter-cache.ts):
 * the map tells people the provider is not sharing data, or would as soon as
 * someone looked. Being idle is not enough: an idle feed expires only after its
 * interval and ten minutes (half an hour by default) without a successful collection.
 * One issue per host the feed is collected from, as an outage there stops its feeds
 * together: Voi's twelve feeds from NRW.Mobidrom stopped between 22:21 and 22:37
 * UTC on 25 October 2026, each its own issue then. Each feed is an event of its host's,
 * tagged with the feed, at most one an hour, so a feed that keeps expiring between
 * updates stays quiet; `alsoExpired` lists the host's other feeds expired by then.
 */
export function reportFeedExpired(change: FeedStateChange, feed: FeedSnapshot, lastError: string | undefined,
  host: string, alsoExpired: string[], now = Date.now()) {
  if (!due(`expired:${feed.id}`, now)) return;
  Sentry.withScope(scope => {
    scope.setLevel('warning');
    scope.setFingerprint(['snapshot-feed-expired', host]);
    scope.setTags({ feed: feed.id, source: feed.source, provider: feed.provider, host });
    scope.setContext('feed', { ...change,
      lastError: feed.failed ? lastError ?? 'unknown' : 'none: the last collection succeeded, and its data has since passed the age limit' });
    scope.setContext('host', { host, alsoExpired: alsoExpired.length ? alsoExpired : 'none' });
    Sentry.captureMessage(`Feeds stopped being served from ${host}`);
  });
}
