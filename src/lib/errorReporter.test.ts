// @vitest-environment jsdom
import { addBreadcrumb, getCurrentScope, getIsolationScope, type Event } from '@sentry/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PendingReport } from './errorReports';
import { reportable, safeBreadcrumb, scrubEvent, startSentryReports } from './errorReporter';

type Transport = ReturnType<NonNullable<Parameters<typeof startSentryReports>[1]>>;
type Envelope = Parameters<Transport['send']>[0];

// jsdom's page is http://localhost/; nothing here leaves the test.
const origin = 'http://localhost';
const scripts = `${origin}/_next/static/chunks`;
const config = { dsn: 'https://0123456789abcdef@o1.ingest.de.sentry.io/42', release: '049fbe0e', environment: 'production' };

/** An error thrown in the site's scripts, with a stack as Chrome writes it. */
function ownError(message: string, Type: ErrorConstructor = TypeError): Error {
  const error = new Type(message);
  error.stack = `${error.name}: ${message}\n    at render (${scripts}/0a1b2c3d4e5f.js:1:2045)\n    at ${scripts}/9f8e7d6c5b4a.js:2:30`;
  return error;
}

function report(error: unknown, extra: Partial<PendingReport> = {}): PendingReport {
  return { error, kind: 'onerror', page: '/map', platform: 'web', release: config.release, ...extra };
}

function capture() {
  const envelopes: Envelope[] = [];
  const transport = () => ({
    send: async (envelope: Envelope) => {
      envelopes.push(envelope);
      return {};
    },
    flush: async () => true,
  });
  const events = () => envelopes.flatMap(([, items]) => items.map(([, payload]) => payload as Event));
  const send = startSentryReports(config, transport);
  // The breadcrumbs of the tests before, as a page starts with none.
  getCurrentScope().clearBreadcrumbs();
  getIsolationScope().clearBreadcrumbs();
  return { envelopes, events, send };
}

afterEach(() => {
  history.replaceState(null, '', '/');
});

describe('what a Sentry report may say', () => {
  it('counts an error as the page\'s when its stack runs through the site\'s scripts, and no extension', () => {
    const at = (...files: string[]): Event => ({ exception: { values: [{ stacktrace: { frames: files.map(filename => ({ filename })) } }] } });
    expect(reportable(at(`${scripts}/a.js`), origin)).toBe(true);
    expect(reportable(at(`${scripts}/a.js`, 'chrome-extension://abc/content.js'), origin)).toBe(false);
    expect(reportable(at(`${scripts}/a.js`, 'safari-web-extension://abc/content.js'), origin)).toBe(false);
    expect(reportable(at('https://cdn.example/_next/a.js'), origin)).toBe(false);
    expect(reportable({ message: 'Script error.' }, origin)).toBe(false);
  });

  it('keeps the pages opened and the site\'s own requests, by their path, and no click, console line or other site', () => {
    const at = { timestamp: 1 };
    expect(safeBreadcrumb({ ...at, category: 'navigation', data: { from: '/map?origin=47.3769,8.5417', to: '/privacy#top' } }, origin))
      .toEqual({ ...at, category: 'navigation', data: { from: '/map', to: '/privacy' } });
    // The map writes its place into its address as it moves.
    expect(safeBreadcrumb({ category: 'navigation', data: { from: '/map?origin=1.1,2.2', to: '/map?origin=1.2,2.3' } }, origin)).toBeNull();
    expect(safeBreadcrumb({ ...at, category: 'fetch', level: 'warning', data: { method: 'GET', url: '/api/scooters?bbox=8.53,47.36,8.55,47.38', status_code: 503, request_body_size: 10 } }, origin))
      .toEqual({ ...at, category: 'fetch', type: 'http', level: 'warning', data: { method: 'GET', url: '/api/scooters', status_code: 503 } });
    expect(safeBreadcrumb({ category: 'fetch', data: { method: 'POST', url: `${origin}/api/geocode` } }, origin)?.data)
      .toEqual({ method: 'POST', url: '/api/geocode' });
    for (const breadcrumb of [
      { category: 'fetch', data: { method: 'GET', url: 'https://tiles.openfreemap.org/planet/1/8580/5735.pbf' } },
      { category: 'fetch', data: { method: 'POST', url: 'https://u.plhery.com/api/send' } },
      { category: 'fetch', data: { method: 'GET', url: '/_next/static/chunks/a.js' } },
      { category: 'ui.click', message: 'button.result[aria-label="Bahnhofstrasse 1, Zürich"]' },
      { category: 'console', message: 'Located at 47.3769, 8.5417' },
      { category: 'navigation', data: { from: '/map', to: 'https://elsewhere.example/' } },
    ]) {
      expect(safeBreadcrumb(breadcrumb, origin), JSON.stringify(breadcrumb)).toBeNull();
    }
  });

  it('keeps of the request the page\'s counted path and the browser, and drops who sent it', () => {
    const event = scrubEvent({
      message: 'Lost at 47.3769',
      tags: { page: '/map', platform: 'pwa' },
      user: { ip_address: '203.0.113.9' },
      extra: { place: '47.3769,8.5417' },
      transaction: '/map?origin=47.3769,8.5417',
      breadcrumbs: [{ category: 'console', message: '47.3769' }, { category: 'navigation', data: { from: '/', to: '/map?origin=1.1,2.2' } }],
      request: { url: `${origin}/map?origin=47.3769,8.5417#walk`, headers: { 'User-Agent': 'Firefox', Referer: 'https://mail.example/?q=me' } },
      exception: { values: [{ type: 'Error', value: 'No route for "Bahnhofstrasse 1" from 47.3769', stacktrace: { frames: [
        { filename: `${scripts}/a.js?v=1`, abs_path: `${origin}/map?origin=47.3769,8.5417` },
      ] } }] },
    }, origin);
    expect(event).toEqual({
      message: 'Lost at [Filtered]',
      tags: { page: '/map', platform: 'pwa' },
      breadcrumbs: [{ category: 'navigation', data: { from: '/', to: '/map' } }],
      request: { url: `${origin}/map`, headers: { 'User-Agent': 'Firefox' } },
      exception: { values: [{ type: 'Error', value: 'No route for "[Filtered]" from [Filtered]', stacktrace: { frames: [
        { filename: `${scripts}/a.js`, abs_path: `${origin}/map` },
      ] } }] },
    });
  });
});

describe('the Sentry reporter', () => {
  it('sends the page\'s errors with their stack, release, platform and page, without who saw them', async () => {
    history.replaceState(null, '', '/map?origin=47.3769,8.5417#walk');
    const { envelopes, events, send } = capture();
    const cause = new RangeError('Invalid LatLng object: (47.3769, NaN)');
    cause.stack = `RangeError: Invalid LatLng object: (47.3769, NaN)\n    at toLatLng (${scripts}/9f8e7d6c5b4a.js:3:40)`;
    const error = ownError('Cannot read properties of undefined (reading \'lat\')');
    error.cause = cause;
    send(report(error, { platform: 'pwa' }));
    await vi.waitFor(() => expect(envelopes).toHaveLength(1));
    expect(envelopes[0][0]).toMatchObject({ trace: { public_key: '0123456789abcdef', release: '049fbe0e', environment: 'production' } });
    const [event] = events();
    expect(event).toMatchObject({
      level: 'error', release: '049fbe0e', environment: 'production',
      tags: { platform: 'pwa', page: '/map' },
      request: { url: `${origin}/map` },
      sdk: { settings: { infer_ip: 'never' } },
    });
    expect(event.user).toBeUndefined();
    const [linked, exception] = event.exception!.values!;
    expect(exception).toMatchObject({ type: 'TypeError', value: 'Cannot read properties of undefined (reading \'lat\')', mechanism: { type: 'onerror', handled: false } });
    expect(exception.stacktrace!.frames!.map(frame => frame.filename)).toEqual([`${scripts}/9f8e7d6c5b4a.js`, `${scripts}/0a1b2c3d4e5f.js`]);
    // The error that caused it, its coordinate filtered.
    expect(linked).toMatchObject({ type: 'RangeError', value: 'Invalid LatLng object: ([Filtered], NaN)' });
    expect(JSON.stringify(event)).not.toMatch(/47\.37|8\.54|walk/);
  });

  it('carries the pages opened and the site\'s requests since it started, by their path, and nothing else', async () => {
    history.replaceState(null, '', '/map?origin=47.3769,8.5417');
    const { envelopes, events, send } = capture();
    history.pushState(null, '', '/privacy?from=47.3769');
    history.pushState(null, '', '/map?origin=47.3769,8.5417');
    history.replaceState(null, '', '/map?origin=47.3801,8.5402');
    addBreadcrumb({ category: 'fetch', type: 'http', data: { method: 'GET', url: '/api/scooters?bbox=8.53,47.36,8.55,47.38', status_code: 503 } });
    addBreadcrumb({ category: 'fetch', type: 'http', data: { method: 'GET', url: 'https://tiles.openfreemap.org/planet/1/14/8580/5735.pbf' } });
    addBreadcrumb({ category: 'ui.click', message: 'button[aria-label="Bahnhofstrasse 1"]' });
    addBreadcrumb({ category: 'console', message: 'Located at 47.3769, 8.5417' });
    send(report(ownError('x is undefined')));
    await vi.waitFor(() => expect(envelopes).toHaveLength(1));
    const [event] = events();
    expect(event.breadcrumbs?.map(({ category, data }) => ({ category, data }))).toEqual([
      { category: 'navigation', data: { from: '/map', to: '/privacy' } },
      { category: 'navigation', data: { from: '/privacy', to: '/map' } },
      { category: 'fetch', data: { method: 'GET', url: '/api/scooters', status_code: 503 } },
    ]);
    expect(JSON.stringify(event)).not.toMatch(/47\.3|8\.5|Bahnhof|tiles/);
  });

  it('sends neither noise, nor an extension\'s or another site\'s errors, nor one twice', async () => {
    const { envelopes, events, send } = capture();
    send(report(ownError('Failed to fetch'), { kind: 'onunhandledrejection' }));
    const injected = ownError('x is undefined');
    injected.stack += '\n    at chrome-extension://abc/content.js:1:1';
    send(report(injected));
    const foreign = new TypeError('y is undefined');
    foreign.stack = 'TypeError: y is undefined\n    at https://ads.example/tag.js:1:1';
    send(report(foreign));
    const twice = ownError('z is undefined');
    send(report(twice));
    send(report(twice));
    send(report(ownError('the last one'), { kind: 'onunhandledrejection' }));
    await vi.waitFor(() => expect(envelopes).toHaveLength(2));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(events().map(event => event.exception!.values![0].value)).toEqual(['z is undefined', 'the last one']);
    expect(events()[1].exception!.values![0].mechanism).toMatchObject({ type: 'onunhandledrejection', handled: false });
  });

  it('stops after a few reports from one page', async () => {
    const { envelopes, send } = capture();
    for (const failure of 'abcdefgh') send(report(ownError(`failure ${failure}`)));
    await vi.waitFor(() => expect(envelopes).toHaveLength(5));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(envelopes).toHaveLength(5);
  });

  it('places an error whose stack names no place where the browser said it was thrown', async () => {
    const { envelopes, events, send } = capture();
    send(report(undefined, { message: 'Uncaught SyntaxError: Unexpected token', filename: `${scripts}/broken.js`, lineno: 1, colno: 5 }));
    await vi.waitFor(() => expect(envelopes).toHaveLength(1));
    expect(events()[0].exception!.values![0].stacktrace!.frames).toEqual([
      expect.objectContaining({ filename: `${scripts}/broken.js`, lineno: 1, colno: 5 }),
    ]);
  });
});
