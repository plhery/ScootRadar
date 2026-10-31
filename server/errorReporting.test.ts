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

it('omits Google authentication URLs containing a runtime API key from breadcrumbs', () => {
  initErrorReporting({ SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1' });
  const options = vi.mocked(Sentry.init).mock.calls[0][0]!;
  expect(options.beforeBreadcrumb!({ category: 'fetch', data: {
    url: 'https://securetoken.googleapis.com/v1/token?key=private-test-key', status_code: 200,
  } }, {})).toBeNull();
  const portRead = { category: 'fetch', data: { url: 'https://asia-northeast1-luup-prod.cloudfunctions.net/mobileApiDBReader-ports/by-location' } };
  expect(options.beforeBreadcrumb!(portRead, {})).toEqual(portRead);
});

it('stays off without a DSN, and sends a request\'s URL but never its headers', () => {
  expect(initErrorReporting({})).toBe(false);
  expect(Sentry.init).not.toHaveBeenCalled();
  expect(initErrorReporting({ SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1', NODE_ENV: 'production', SOURCE_COMMIT: 'abc123' })).toBe(true);
  const options = vi.mocked(Sentry.init).mock.calls[0][0]!;
  expect(options).toMatchObject({ environment: 'production', release: 'abc123', tracePropagationTargets: [] });
  // Without Dedupe, which would drop all but the first of a host's feeds expiring one after another.
  const integrations = options.integrations as (defaults: { name: string }[]) => { name: string }[];
  expect(integrations([{ name: 'Dedupe' }, { name: 'Http' }])).toEqual([{ name: 'Http' },
    { name: 'OnUnhandledRejection', options: { mode: 'strict' } }]);
  expect(options).toMatchObject({ includeLocalVariables: false, dataCollection: { userInfo: false } });
  const event = { request: { method: 'GET', url: 'http://localhost/api/scooters', query_string: 'south=47.3&zoom=16',
    headers: { 'x-scooter-client-ip': '192.0.2.1', authorization: 'Bearer secret' }, cookies: { a: 'b' } },
  user: { ip_address: '192.0.2.1' }, message: 'failed', type: undefined } satisfies ErrorEvent;
  expect(options.beforeSend!(event, {})).toEqual({ message: 'failed', type: undefined,
    request: { method: 'GET', url: 'http://localhost/api/scooters', query_string: 'south=47.3&zoom=16' } });
  const withoutRequest = { message: 'failed', type: undefined } satisfies ErrorEvent;
  expect(options.beforeSend!(withoutRequest, {})).toEqual({ message: 'failed', type: undefined });
});

it('replaces every IP address before an event leaves, frame variables included', () => {
  initErrorReporting({ SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1' });
  const options = vi.mocked(Sentry.init).mock.calls[0][0]!;
  const frame = { function: 'handle', vars: { forwarded: '203.0.113.7', key: '[Filtered]', remote: '::ffff:198.51.100.4',
    v6: '2001:db8::1', parsed: { zoom: 16, client: '192.0.2.1' }, list: ['192.0.2.1:443', 'ok'],
    started: '2026-10-16T08:00:00.000Z', version: '11.6.0', url: '<URL>' } };
  const event = { type: undefined, message: 'rate limit for 203.0.113.7',
    exception: { values: [{ type: 'Error', value: 'failed for [2001:db8::1]:443', stacktrace: { frames: [frame] } }] },
    breadcrumbs: [{ message: 'from 203.0.113.7', data: { '192.0.2.1': { count: 3 }, south: 47.3 } }],
    request: { method: 'GET', url: 'http://localhost/api/scooters', query_string: 'south=47.3&zoom=16' },
    sdkProcessingMetadata: { normalizedRequest: { headers: { 'x-scooter-client-ip': '203.0.113.7' } } } } satisfies ErrorEvent;
  const sent = options.beforeSend!(event, {}) as typeof event;
  expect(sent.message).toBe('rate limit for [ip]');
  expect(sent.exception.values[0].value).toBe('failed for [[ip]]:443');
  expect(sent.exception.values[0].stacktrace.frames[0].vars).toEqual({ forwarded: '[ip]', key: '[Filtered]', remote: '[ip]',
    v6: '[ip]', parsed: { zoom: 16, client: '[ip]' }, list: ['[ip]:443', 'ok'],
    started: '2026-10-16T08:00:00.000Z', version: '11.6.0', url: '<URL>' });
  expect(sent.breadcrumbs).toEqual([{ message: 'from [ip]', data: { south: 47.3 } }]);
  expect(sent.request).toEqual({ method: 'GET', url: 'http://localhost/api/scooters', query_string: 'south=47.3&zoom=16' });
  expect(JSON.stringify({ ...sent, sdkProcessingMetadata: undefined })).not.toMatch(/203\.0\.113|198\.51|192\.0\.2|2001:db8/);
});

it('reports a repeating error once an hour per key', () => {
  const error = new Error('disk full');
  reportError('persist-test', error, 0);
  reportError('persist-test', error, 5_000);
  reportError('discovery-test', error, 5_000);
  reportError('persist-test', error, 3600_000);
  expect(Sentry.captureException).toHaveBeenCalledTimes(3);
});

it('groups the expiries of a host\'s feeds, one event an hour for each, and says why each expired', () => {
  const feed = { id: 'national:voiscooters.com', source: 'national' as const, provider: 'voi', coverage: [], vehicles: [],
    observedAt: 0, attemptedAt: 0, stale: false, failed: false, skipped: false };
  const change = { event: 'snapshot_feed_state' as const, feed: feed.id, state: 'expired' as const, previous: 'ok' as const,
    secondsInPrevious: 35, observationAgeSeconds: 905, attemptAgeSeconds: 35 };
  const host = 'api.sharedmobility.ch';
  reportFeedExpired(change, feed, undefined, host, [], 0);
  // A feed that keeps expiring between updates is one event an hour.
  reportFeedExpired(change, feed, undefined, host, [], 600_000);
  // Another feed of the host is another event of the same issue.
  reportFeedExpired({ ...change, feed: 'national:bolt_zurich' }, { ...feed, id: 'national:bolt_zurich', provider: 'bolt' }, undefined,
    host, ['national:voiscooters.com'], 600_000);
  reportFeedExpired(change, { ...feed, failed: true }, 'GBFS request failed with HTTP 503', host, ['national:bolt_zurich'], 3600_000);
  expect(scope.setLevel).toHaveBeenCalledWith('warning');
  expect(scope.setFingerprint.mock.calls).toEqual(Array(3).fill([['snapshot-feed-expired', host]]));
  expect(scope.setTags.mock.calls.map(([tags]) => tags.feed)).toEqual(['national:voiscooters.com', 'national:bolt_zurich', 'national:voiscooters.com']);
  const contexts = (name: string) => scope.setContext.mock.calls.filter(([key]) => key === name).map(([, context]) => context);
  expect(contexts('feed').map(context => context.lastError)).toEqual([
    'none: the last collection succeeded, and its data has since passed the age limit',
    'none: the last collection succeeded, and its data has since passed the age limit',
    'GBFS request failed with HTTP 503',
  ]);
  expect(contexts('host').map(context => context.alsoExpired)).toEqual(['none', ['national:voiscooters.com'], ['national:bolt_zurich']]);
  expect(Sentry.captureMessage).toHaveBeenCalledWith('Feeds stopped being served from api.sharedmobility.ch');
  expect(Sentry.captureMessage).toHaveBeenCalledTimes(3);
});

it('says when an expired feed is out of the catalog, which nothing collects', () => {
  const feed = { id: 'national:dott_rorschach', source: 'national' as const, provider: 'dott', coverage: [], vehicles: [],
    observedAt: 0, attemptedAt: 0, stale: false, failed: false, skipped: false };
  const change = { event: 'snapshot_feed_state' as const, feed: feed.id, state: 'expired' as const, previous: 'ok' as const,
    secondsInPrevious: 240610, observationAgeSeconds: 1804, attemptAgeSeconds: 1802 };
  reportFeedExpired(change, feed, undefined, undefined, ['national:dott_basel'], 0);
  expect(scope.setFingerprint).toHaveBeenCalledWith(['snapshot-feed-expired', 'unknown']);
  expect(scope.setContext).toHaveBeenCalledWith('feed', { ...change, lastError: 'none: the feed is not in the catalog, so nothing collects it' });
  expect(scope.setContext).toHaveBeenCalledWith('host', { host: 'unknown', alsoExpired: ['national:dott_basel'] });
  expect(Sentry.captureMessage).toHaveBeenCalledWith('Feeds stopped being served from unknown');
});
