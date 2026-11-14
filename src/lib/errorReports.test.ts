// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingReport } from './errorReports';

const mocks = vi.hoisted(() => ({
  dsn: '',
  imported: vi.fn(),
  startSentryReports: vi.fn(),
  sent: [] as PendingReport[],
}));
// The chunk that downloads Sentry's SDK: the factory runs only if it is imported.
vi.mock('./errorReporter', () => {
  mocks.imported();
  return { startSentryReports: mocks.startSentryReports };
});
vi.mock('./errorReportsConfig', async importOriginal => ({
  ...await importOriginal<typeof import('./errorReportsConfig')>(),
  get SENTRY_BROWSER_DSN() { return mocks.dsn; },
}));

const origin = 'https://scootradar.com';
const scripts = `${origin}/_next/static/chunks`;
const location = { hostname: 'scootradar.com', origin, pathname: '/map', search: '?origin=47.3769,8.5417', hash: '#walk' };
const commit = '049fbe0e3c1d2b4a5f6e7d8c9b0a1f2e3d4c5b6a';

/** An error thrown in the site's scripts, with a stack as Chrome writes it. */
function ownError(message: string, Type: ErrorConstructor = TypeError): Error {
  const error = new Type(message);
  error.stack = `${error.name}: ${message}\n    at render (${scripts}/0a1b2c3d4e5f.js:1:2045)\n    at ${scripts}/9f8e7d6c5b4a.js:2:30`;
  return error;
}

function thrown(error: unknown, filename = `${scripts}/0a1b2c3d4e5f.js`): ErrorEvent {
  return new ErrorEvent('error', { error, message: `Uncaught ${String(error)}`, filename, lineno: 1, colno: 2045 });
}

function rejection(reason: unknown): Event {
  return Object.assign(new Event('unhandledrejection'), { reason });
}

function answer(body: unknown = {}, status = 200, headers: Record<string, string> = {}) {
  return { ok: status >= 200 && status < 300, status, headers: new Headers(headers), json: async () => body };
}

/** A fresh watcher, on a target of its own. */
async function watch() {
  vi.resetModules();
  const reports = await import('./errorReports');
  const analytics = await import('./analytics');
  const target = new EventTarget() as Window;
  reports.watchBrowserErrors(target);
  return { ...reports, ...analytics, target };
}

/** The bodies sent to Umami. */
function sent(fetcher: ReturnType<typeof vi.fn>) {
  return fetcher.mock.calls.map(([, request]) => JSON.parse(request.body));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = ['version', 'website', 'eventId', 'timestamp', 'name', 'message', 'stack', 'handled', 'url', 'release',
  'environment', 'tags', 'fingerprint', 'id', 'salt', 'language', 'screen'];

/** What Umami 3.5's errorPayloadSchema (src/lib/errors/schema.ts) refuses of a payload. */
function schemaProblems(payload: Record<string, unknown>): string[] {
  const text = (value: unknown, min: number, max: number) => typeof value === 'string' && value.length >= min && value.length <= max;
  const tags = payload.tags as Record<string, unknown>;
  const checks: [string, boolean][] = [
    ['version', payload.version === 1],
    ['website', typeof payload.website === 'string' && UUID.test(payload.website)],
    ['eventId', typeof payload.eventId === 'string' && UUID.test(payload.eventId)],
    ['timestamp', Number.isInteger(payload.timestamp) && (payload.timestamp as number) > 0],
    ['name', text(payload.name, 1, 200)],
    ['message', text(payload.message, 0, 2000)],
    ['stack', payload.stack === undefined || text(payload.stack, 0, 16_000)],
    ['handled', payload.handled === undefined || typeof payload.handled === 'boolean'],
    ['url', text(payload.url, 0, 2000)],
    ['release', payload.release === undefined || text(payload.release, 0, 100)],
    ['environment', payload.environment === undefined || text(payload.environment, 0, 50)],
    ['tags', tags === undefined || (typeof tags === 'object' && Object.keys(tags).length <= 20 &&
      Object.entries(tags).every(([key, value]) => text(key, 0, 50) && text(value, 0, 200)))],
    ['fingerprint', payload.fingerprint === undefined || (Array.isArray(payload.fingerprint) &&
      payload.fingerprint.length >= 1 && payload.fingerprint.length <= 5 && payload.fingerprint.every(value => text(value, 1, 200)))],
    ['id', payload.id === undefined || text(payload.id, 0, 50)],
    ['salt', payload.salt === undefined || text(payload.salt, 0, 100)],
    ['language', payload.language === undefined || text(payload.language, 0, 35)],
    ['screen', payload.screen === undefined || text(payload.screen, 0, 11)],
    ['no other field', Object.keys(payload).every(key => FIELDS.includes(key))],
  ];
  return checks.filter(([, valid]) => !valid).map(([field]) => field);
}

beforeEach(() => {
  mocks.dsn = '';
  mocks.sent = [];
  mocks.imported.mockReset();
  mocks.startSentryReports.mockReset().mockImplementation(() => (report: PendingReport) => mocks.sent.push(report));
  localStorage.clear();
  vi.stubGlobal('location', location);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  const meta = document.createElement('meta');
  meta.name = 'scootradar-release';
  meta.content = commit;
  document.head.appendChild(meta);
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.head.querySelectorAll('meta').forEach(meta => meta.remove());
});

describe('the page\'s error reports to Umami', () => {
  it('report the page\'s own error in the session of its page views, as Umami\'s schema takes it, scrubbed', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer({ cache: 'session-cache' }));
    vi.stubGlobal('fetch', fetcher);
    const { target, track } = await watch();
    track();
    target.dispatchEvent(thrown(ownError('No route from 47.3769,8.5417 for "Bahnhofstrasse 1" (reading \'map\')')));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    const [url, request] = fetcher.mock.calls[1];
    expect(url).toBe('https://u.plhery.com/api/send');
    expect(request).toMatchObject({ method: 'POST', credentials: 'omit', keepalive: true, referrerPolicy: 'no-referrer' });
    expect(request.headers).toEqual({ 'Content-Type': 'application/json', 'x-umami-cache': 'session-cache' });
    const { type, payload } = JSON.parse(request.body);
    expect(type).toBe('error');
    expect(schemaProblems(payload)).toEqual([]);
    expect(payload).toMatchObject({
      website: '6e60b4ab-b4ee-4785-9699-a7f32127b358', name: 'TypeError',
      message: 'No route from [Filtered],[Filtered] for "[Filtered]" (reading \'map\')',
      handled: false, url: '/map', release: commit, environment: 'production', language: navigator.language,
      tags: { platform: 'web' },
    });
    expect(payload.stack).toContain(`at render (${scripts}/0a1b2c3d4e5f.js:1:2045)`);
    expect(request.body).not.toMatch(/47\.37|8\.54|Bahnhof|walk|session-cache/);
  });

  it('count an error under the page of the site it happened on, and a page unknown as the map', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('location', { ...location, pathname: '/guides/e-scooters-bristol' });
    const { target, track } = await watch();
    target.dispatchEvent(thrown(ownError('before the page was counted')));
    track(undefined, {}, { path: '/guides/e-scooters-bristol', title: 'E-scooter hire in Bristol — ScootRadar' });
    target.dispatchEvent(rejection(ownError('after')));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
    const [before, , after] = sent(fetcher);
    expect(before.payload.url).toBe('/map');
    expect(after.payload).toMatchObject({ url: '/guides/e-scooters-bristol', message: 'after' });
    expect(schemaProblems(after.payload)).toEqual([]);
  });

  it('place an error whose stack names no place where the browser said it was thrown', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    const { target } = await watch();
    target.dispatchEvent(new ErrorEvent('error', { message: 'Uncaught SyntaxError: Unexpected token', filename: `${scripts}/broken.js`, lineno: 1, colno: 5 }));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    const { payload } = sent(fetcher)[0];
    expect(payload).toMatchObject({ name: 'Error', message: 'Uncaught SyntaxError: Unexpected token', stack: `    at ${scripts}/broken.js:1:5` });
    expect(schemaProblems(payload)).toEqual([]);
  });

  it('leave alone extensions\' and other sites\' errors, "Script error.", network noise and rejections that are no error', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    const { target } = await watch();
    target.dispatchEvent(thrown(new Error('x'), 'chrome-extension://abc/content.js'));
    target.dispatchEvent(new ErrorEvent('error', { message: 'Script error.', filename: '' }));
    target.dispatchEvent(thrown(ownError('y'), 'https://ads.example/_next/tag.js'));
    target.dispatchEvent(thrown(ownError('inline'), `${origin}/map`));
    const injected = ownError('z is undefined');
    injected.stack += '\n    at chrome-extension://abc/content.js:1:1';
    target.dispatchEvent(thrown(injected));
    const masked = ownError('w is undefined');
    masked.stack += '\n    at webkit-masked-url://hidden/:1:1';
    target.dispatchEvent(rejection(masked));
    target.dispatchEvent(rejection(ownError('Failed to fetch')));
    target.dispatchEvent(rejection(ownError('signal timed out', Error)));
    target.dispatchEvent(rejection(ownError('ResizeObserver loop completed with undelivered notifications.', Error)));
    target.dispatchEvent(rejection('a string'));
    const elsewhere = new Error('elsewhere');
    elsewhere.stack = 'Error: elsewhere\n    at https://ads.example/tag.js:1:1';
    target.dispatchEvent(rejection(elsewhere));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('report each message once, and five errors of a page load at most', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    const { target } = await watch();
    target.dispatchEvent(thrown(ownError('the same')));
    target.dispatchEvent(rejection(ownError('the same')));
    for (const failure of 'abcdefgh') target.dispatchEvent(thrown(ownError(`failure ${failure}`)));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(5));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(sent(fetcher).map(body => body.payload.message)).toEqual(['the same', 'failure a', 'failure b', 'failure c', 'failure d']);
  });

  it('wait as long as Umami\'s Retry-After says after a 429, and never throw into the page', async () => {
    let now = Date.parse('2026-11-14T20:00:00Z');
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetcher = vi.fn()
      .mockResolvedValueOnce(answer({ error: { message: 'Error quota exceeded.' } }, 429, { 'Retry-After': '30' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    const { target, track } = await watch();
    target.dispatchEvent(thrown(ownError('first')));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await new Promise(resolve => setTimeout(resolve, 20));
    target.dispatchEvent(thrown(ownError('held back')));
    // The page's events go on: Umami holds back errors alone.
    track('refresh');
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    now += 30_000;
    target.dispatchEvent(thrown(ownError('after the wait')));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
    expect(sent(fetcher).map(body => body.payload.message ?? body.payload.name)).toEqual(['first', 'refresh', 'after the wait']);
  });

  it('drop a report larger than Umami takes', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    const { target } = await watch();
    const heavy = ownError('heavy');
    heavy.stack = `TypeError: heavy\n    at render (${scripts}/0a1b2c3d4e5f.js:1:2045)\n${'€'.repeat(16_000)}`;
    target.dispatchEvent(thrown(heavy));
    target.dispatchEvent(thrown(ownError('light')));
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(sent(fetcher)[0].payload.message).toBe('light');
  });

  it('send nothing while analytics is off, nor on another host', async () => {
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    for (const off of [() => localStorage.setItem('umami.disabled', '1'), () => vi.stubGlobal('navigator', { doNotTrack: '1', language: 'de' }),
      () => vi.stubGlobal('navigator', { globalPrivacyControl: true, language: 'de' }),
      () => vi.stubGlobal('location', { ...location, hostname: 'preview.workers.dev', origin: 'https://preview.workers.dev' })]) {
      off();
      const { target } = await watch();
      target.dispatchEvent(thrown(ownError('unseen')));
      localStorage.clear();
      vi.stubGlobal('navigator', window.navigator);
      vi.stubGlobal('location', location);
    }
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fetcher).not.toHaveBeenCalled();
    expect(mocks.imported).not.toHaveBeenCalled();
  });
});

describe('the page\'s error reports to Sentry', () => {
  it('never download Sentry\'s SDK while the DSN is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer()));
    const { target } = await watch();
    target.dispatchEvent(thrown(ownError('first')));
    target.dispatchEvent(rejection(ownError('second')));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(mocks.imported).not.toHaveBeenCalled();
    expect(mocks.startSentryReports).not.toHaveBeenCalled();
  });

  it('with a DSN, hand the page\'s errors to Sentry, downloaded once, whatever Do Not Track says', async () => {
    mocks.dsn = 'https://0123456789abcdef@o1.ingest.de.sentry.io/42';
    const fetcher = vi.fn().mockResolvedValue(answer());
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('navigator', { doNotTrack: '1', language: 'de-CH' });
    const { target } = await watch();
    const first = ownError('first');
    target.dispatchEvent(thrown(first));
    target.dispatchEvent(rejection(ownError('second')));
    target.dispatchEvent(rejection(ownError('Failed to fetch')));
    await vi.waitFor(() => expect(mocks.sent).toHaveLength(2));
    expect(mocks.imported).toHaveBeenCalledTimes(1);
    expect(mocks.startSentryReports).toHaveBeenCalledTimes(1);
    expect(mocks.startSentryReports).toHaveBeenCalledWith({ dsn: mocks.dsn, environment: 'production', release: commit });
    expect(mocks.sent[0]).toMatchObject({ error: first, kind: 'onerror', page: '/map', platform: 'web', release: commit });
    expect(mocks.sent[1]).toMatchObject({ kind: 'onunhandledrejection', page: '/map' });
    // Umami, under Do Not Track, has nothing.
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('go quiet when Sentry\'s client fails to start', async () => {
    mocks.dsn = 'https://0123456789abcdef@o1.ingest.de.sentry.io/42';
    mocks.startSentryReports.mockImplementation(() => { throw new Error('blocked'); });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(answer()));
    const { target } = await watch();
    target.dispatchEvent(thrown(ownError('first')));
    await vi.waitFor(() => expect(mocks.startSentryReports).toHaveBeenCalledTimes(1));
    await new Promise(resolve => setTimeout(resolve, 20));
    target.dispatchEvent(thrown(ownError('second')));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(mocks.startSentryReports).toHaveBeenCalledTimes(1);
  });
});
