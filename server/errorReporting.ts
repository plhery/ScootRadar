import * as Sentry from '@sentry/node';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';
import type { FeedStateChange } from './feedStateLog';

const REPORT_INTERVAL_MS = 3600_000;
const lastReportedAt = new Map<string, number>();

/**
 * Sentry, enabled only with SENTRY_DSN. A failing request keeps its method and
 * URL, query included: the map bounds, zoom and filters that reproduce it. Its
 * headers are dropped: they hold the Worker's token and the visitor's address.
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
    includeLocalVariables: true,
    beforeSend(event) {
      if (event.request) {
        const { method, url, query_string } = event.request;
        event.request = { method, url, query_string };
      }
      delete event.user;
      return event;
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
 * One issue per feed, with at most one event an hour, so a feed that keeps
 * expiring between updates stays quiet.
 */
export function reportFeedExpired(change: FeedStateChange, feed: FeedSnapshot, lastError: string | undefined, now = Date.now()) {
  if (!due(`expired:${feed.id}`, now)) return;
  Sentry.withScope(scope => {
    scope.setLevel('warning');
    scope.setFingerprint(['snapshot-feed-expired', feed.id]);
    scope.setTags({ feed: feed.id, source: feed.source, provider: feed.provider });
    scope.setContext('feed', { ...change,
      lastError: feed.failed ? lastError ?? 'unknown' : 'none: the last collection succeeded, and its data has since passed the age limit' });
    Sentry.captureMessage(`Feed stopped being served: ${feed.id}`);
  });
}
