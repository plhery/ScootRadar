import {
  BrowserClient,
  breadcrumbsIntegration,
  dedupeIntegration,
  defaultStackParser,
  eventFiltersIntegration,
  eventFromException,
  getCurrentScope,
  httpContextIntegration,
  linkedErrorsIntegration,
  makeFetchTransport,
  type Breadcrumb,
  type Event,
  type StackFrame,
} from '@sentry/browser';
import { MAX_REPORTS, type PendingReport } from './errorReports';
import { EXTENSION, IGNORED_ERRORS, ownScripts, scrubAddress, scrubText } from './errorScrub';

/** What the page tells Sentry's client. */
export interface SentryConfig {
  dsn: string;
  release?: string;
  environment: string;
}

function frames(event: Event): StackFrame[] {
  return event.exception?.values?.flatMap(value => value.stacktrace?.frames ?? []) ?? [];
}

/**
 * Whether an error is the page's own: its stack goes through the site's scripts, and no
 * extension's code is anywhere in it.
 */
export function reportable(event: Event, origin: string): boolean {
  const files = frames(event).map(frame => frame.filename ?? '');
  return files.some(file => file.startsWith(ownScripts(origin))) && !files.some(file => EXTENSION.test(file));
}

/** An address of the site, relative or absolute, by its path alone, or null for another site's. */
function ownPath(address: unknown, origin: string): string | null {
  if (typeof address !== 'string') return null;
  try {
    const url = new URL(address, origin);
    return url.origin === origin ? scrubAddress(url.pathname) : null;
  } catch {
    return null;
  }
}

/**
 * The breadcrumbs a report may carry: the pages opened, and the site's own API requests (`GET
 * /api/scooters`, with the status of the answer), each by its path, without its query or body,
 * where the map's bounds and coordinates travel. None of a click, which can name a place in the
 * search, of the console, or of a request to another site, as the map's tiles.
 */
export function safeBreadcrumb(breadcrumb: Breadcrumb, origin: string): Breadcrumb | null {
  const data = breadcrumb.data ?? {};
  if (breadcrumb.category === 'navigation') {
    const from = ownPath(data.from, origin);
    const to = ownPath(data.to, origin);
    // The map writes its place into its address as it moves: the same page.
    if (!from || !to || from === to) return null;
    return { category: 'navigation', timestamp: breadcrumb.timestamp, data: { from, to } };
  }
  if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
    const url = ownPath(data.url, origin);
    if (!url?.startsWith('/api/')) return null;
    return {
      category: breadcrumb.category, type: 'http', level: breadcrumb.level, timestamp: breadcrumb.timestamp,
      data: {
        method: typeof data.method === 'string' ? data.method : 'GET', url,
        ...(typeof data.status_code === 'number' ? { status_code: data.status_code } : {}),
      },
    };
  }
  return null;
}

/**
 * What a report keeps: the error and its causes, their stacks, the page's address by the path
 * analytics counts it under (its `page` tag), the browser's user agent and the safe breadcrumbs,
 * its messages scrubbed (scrubText).
 */
export function scrubEvent<T extends Event>(event: T, origin: string): T {
  const userAgent = event.request?.headers?.['User-Agent'];
  const page = typeof event.tags?.page === 'string' ? event.tags.page : '/';
  return {
    ...event,
    message: event.message && scrubText(event.message),
    logentry: undefined,
    user: undefined,
    extra: undefined,
    transaction: undefined,
    breadcrumbs: event.breadcrumbs?.flatMap(breadcrumb => safeBreadcrumb(breadcrumb, origin) ?? []),
    request: {
      url: origin + page,
      ...(userAgent ? { headers: { 'User-Agent': userAgent } } : {}),
    },
    exception: event.exception && {
      ...event.exception,
      values: event.exception.values?.map(value => ({
        ...value,
        value: value.value && scrubText(value.value),
        stacktrace: value.stacktrace && {
          ...value.stacktrace,
          frames: value.stacktrace.frames?.map(frame => ({
            ...frame,
            filename: frame.filename && scrubAddress(frame.filename),
            abs_path: frame.abs_path && scrubAddress(frame.abs_path),
          })),
        },
      })),
    },
  };
}

/** A stack that names no place, as a script that does not parse: the place the browser named instead. */
function withInitialFrame(event: Event, { filename, lineno, colno }: PendingReport): Event {
  const values = event.exception?.values ?? [{}];
  if (!filename || values[0]?.stacktrace?.frames?.length) return event;
  const [first, ...rest] = values;
  return {
    ...event,
    exception: { values: [{ ...first, stacktrace: { frames: [{ filename, lineno, colno, function: '?', in_app: true }] } }, ...rest] },
  };
}

/**
 * Starts Sentry's client for the page, and returns how to send it a report. Nothing of the
 * visitor goes with it: no IP address is inferred (`userInfo: false`), and no cookie, header but
 * the user agent, query or body is collected.
 */
export function startSentryReports(config: SentryConfig, transport = makeFetchTransport): (report: PendingReport) => void {
  const origin = window.location.origin;
  let reports = 0;
  const client = new BrowserClient({
    ...config,
    transport,
    stackParser: defaultStackParser,
    // Not the SDK's defaults: no global handlers (src/lib/errorReports.ts listens), no console, no
    // clicks, no session, no tracing.
    integrations: [
      eventFiltersIntegration(), linkedErrorsIntegration(), dedupeIntegration(), httpContextIntegration(),
      breadcrumbsIntegration({ dom: false, fetch: true, history: true, sentry: false, xhr: false }),
    ],
    allowUrls: [new RegExp(`^${ownScripts(origin).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)],
    ignoreErrors: IGNORED_ERRORS,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpBodies: [],
      urlQueryParams: false,
      httpHeaders: { request: { allow: ['User-Agent'] }, response: false },
    },
    // Leaves the page's own failed requests' messages as they are.
    enhanceFetchErrorMessages: false,
    sendClientReports: false,
    maxBreadcrumbs: 30,
    beforeBreadcrumb: breadcrumb => safeBreadcrumb(breadcrumb, origin),
    beforeSend(event) {
      if (reports >= MAX_REPORTS || !reportable(event, origin)) return null;
      reports += 1;
      return scrubEvent(event, origin);
    },
  });
  const scope = getCurrentScope();
  scope.setClient(client);
  client.init();
  return report => {
    // Of a thrown value that is no error, only a string is read, as for Umami: an object may hold anything.
    const thrown = report.error instanceof Error || typeof report.error === 'string' ? report.error : report.message || 'Non-Error exception';
    void eventFromException(defaultStackParser, thrown, undefined, false).then(event => {
      scope.captureEvent({ ...withInitialFrame(event, report), level: 'error', tags: { platform: report.platform, page: report.page } }, {
        originalException: report.error,
        mechanism: { type: report.kind, handled: false },
      });
    });
  };
}
