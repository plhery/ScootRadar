import { beforeEach, expect, it, vi } from 'vitest';
import type { ErrorEvent } from '@sentry/node';

const scope = { setLevel: vi.fn(), setFingerprint: vi.fn(), setTag: vi.fn(), setTags: vi.fn(), setContext: vi.fn() };
vi.mock('@sentry/node', () => ({
  init: vi.fn(),
  onUnhandledRejectionIntegration: vi.fn((options: unknown) => ({ name: 'OnUnhandledRejection', options })),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: (callback: (value: typeof scope) => void) => callback(scope),
}));
const Sentry = await import('@sentry/node');
const { initErrorReporting, reportError, reportFeedExpired } = await import('./errorReporting');

beforeEach(() => vi.clearAllMocks());

it('stays off without a DSN, and never sends the incoming request', () => {
  expect(initErrorReporting({})).toBe(false);
  expect(Sentry.init).not.toHaveBeenCalled();
  expect(initErrorReporting({ SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1', NODE_ENV: 'production', SOURCE_COMMIT: 'abc123' })).toBe(true);
  const options = vi.mocked(Sentry.init).mock.calls[0][0]!;
  expect(options).toMatchObject({ environment: 'production', release: 'abc123', tracePropagationTargets: [],
    integrations: [{ name: 'OnUnhandledRejection', options: { mode: 'strict' } }] });
  const event = { request: { url: '/api/scooters?south=47.3', headers: { 'x-scooter-client-ip': '192.0.2.1' } },
    user: { ip_address: '192.0.2.1' }, message: 'failed', type: undefined } satisfies ErrorEvent;
  expect(options.beforeSend!(event, {})).toEqual({ message: 'failed', type: undefined });
});

it('reports a repeating error once an hour per key', () => {
  const error = new Error('disk full');
  reportError('persist-test', error, 0);
  reportError('persist-test', error, 5_000);
  reportError('discovery-test', error, 5_000);
  reportError('persist-test', error, 3600_000);
  expect(Sentry.captureException).toHaveBeenCalledTimes(3);
});

it('groups the expiries of a feed, one event an hour, and says why it expired', () => {
  const feed = { id: 'national:voiscooters.com', source: 'national' as const, provider: 'voi', coverage: [], vehicles: [],
    observedAt: 0, attemptedAt: 0, stale: false, failed: false, skipped: false };
  const change = { event: 'snapshot_feed_state' as const, feed: feed.id, state: 'expired' as const, previous: 'ok' as const,
    secondsInPrevious: 35, observationAgeSeconds: 905, attemptAgeSeconds: 35 };
  reportFeedExpired(change, feed, undefined, 0);
  // A feed that keeps expiring between updates is one event an hour.
  reportFeedExpired(change, feed, undefined, 600_000);
  reportFeedExpired(change, { ...feed, failed: true }, 'GBFS request failed with HTTP 503', 3600_000);
  expect(scope.setLevel).toHaveBeenCalledWith('warning');
  expect(scope.setFingerprint).toHaveBeenCalledWith(['snapshot-feed-expired', 'national:voiscooters.com']);
  expect(scope.setContext.mock.calls.map(([, context]) => context.lastError)).toEqual([
    'none: the last collection succeeded, and its data has since passed the age limit',
    'GBFS request failed with HTTP 503',
  ]);
  expect(Sentry.captureMessage).toHaveBeenCalledWith('Feed stopped being served: national:voiscooters.com');
});
