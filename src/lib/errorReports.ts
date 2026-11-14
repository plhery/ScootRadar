/**
 * Reports of the website's own errors in the browser (docs/OBSERVABILITY.md, "Browser errors").
 * From the start of the page, before it renders (src/instrumentation-client.ts), it listens for
 * errors thrown through the site's scripts, and reports the first few of a page load: to Umami
 * while analytics is on (src/lib/analytics.ts), and to Sentry, with more detail, where
 * SENTRY_BROWSER_DSN names a project. Sentry's SDK lives in a chunk of its own, downloaded once an
 * error is to be reported: most visits never fetch it, and none while the DSN is empty.
 */

import {
  ANALYTICS_HOST, ANALYTICS_WEBSITE, analyticsEnabled, analyticsPlatform, countedPath, sendErrorReport,
} from './analytics';
import { RELEASE_META, SENTRY_BROWSER_DSN } from './errorReportsConfig';
import { extensionStack, ignoredError, ownScripts, scrubText } from './errorScrub';

/** An error of the page's own, as both destinations take it. */
export interface PendingReport {
  error: unknown;
  kind: 'onerror' | 'onunhandledrejection';
  /** Where an uncaught error was thrown, for one whose stack does not say. */
  message?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  /** The page as analytics counts it (countedPath): never its query or fragment. */
  page: string;
  platform: 'web' | 'pwa';
  /** The commit the page was built from, or '' where the build did not know it. */
  release: string;
}

/** Past this many a page is broken in a way the first ones already tell. */
export const MAX_REPORTS = 5;

const reported = new Set<string>();
let sentry: ((report: PendingReport) => void) | undefined;
let sentryState: 'idle' | 'loading' | 'off' = 'idle';
let heldForSentry: PendingReport[] = [];

function release(): string {
  return document.querySelector<HTMLMetaElement>(`meta[name="${RELEASE_META}"]`)?.content.slice(0, 100) ?? '';
}

/**
 * The error's name, message and stack, as the browser gave them. Of a thrown value that is no
 * error, only a string is read: an object may hold anything.
 */
function errorText({ error, message, filename, lineno, colno }: PendingReport): { name: string; message: string; stack: string } {
  // Where the browser said it was thrown, for a stack that does not, as a script that does not parse.
  const thrownAt = filename ? `    at ${filename}:${lineno ?? 0}:${colno ?? 0}` : '';
  if (error instanceof Error) return { name: error.name || 'Error', message: error.message, stack: error.stack || thrownAt };
  return { name: 'Error', message: typeof error === 'string' ? error : message || 'Non-Error exception', stack: thrownAt };
}

/** The report Umami keeps, its fields within the lengths it accepts. */
export function umamiPayload(report: PendingReport, now = Date.now()) {
  const { name, message, stack } = errorText(report);
  return {
    version: 1 as const,
    website: ANALYTICS_WEBSITE,
    eventId: crypto.randomUUID(),
    timestamp: now,
    name: scrubText(name).slice(0, 200) || 'Error',
    message: scrubText(message).slice(0, 2000),
    stack: scrubText(stack).slice(0, 16_000),
    handled: false,
    url: report.page,
    release: report.release,
    environment: 'production',
    language: (navigator.language || '').slice(0, 35),
    tags: { platform: report.platform },
  };
}

function toSentry(report: PendingReport): void {
  if (sentry) {
    sentry(report);
    return;
  }
  if (!SENTRY_BROWSER_DSN || sentryState === 'off') return;
  heldForSentry.push(report);
  if (sentryState === 'loading') return;
  sentryState = 'loading';
  import('./errorReporter').then(({ startSentryReports }) => {
    sentry = startSentryReports({
      dsn: SENTRY_BROWSER_DSN, environment: 'production', ...(report.release ? { release: report.release } : {}),
    });
    for (const held of heldForSentry.splice(0)) sentry(held);
  }).catch(() => {
    // Error reports must never add an error of their own.
    sentryState = 'off';
    heldForSentry = [];
  });
}

/**
 * Reports an error the page's own scripts threw, unless it is network noise (IGNORED_ERRORS),
 * ran through an extension, was reported already by its message, or MAX_REPORTS were.
 */
function report(error: unknown, kind: PendingReport['kind'], at: Partial<ErrorEvent> = {}): void {
  try {
    if (reported.size >= MAX_REPORTS || (!analyticsEnabled() && !SENTRY_BROWSER_DSN)) return;
    const pending: PendingReport = {
      error, kind, message: at.message, filename: at.filename, lineno: at.lineno, colno: at.colno,
      page: countedPath(), platform: analyticsPlatform(), release: release(),
    };
    const { name, message, stack } = errorText(pending);
    if (ignoredError(name, message) || extensionStack(stack)) return;
    const key = scrubText(`${name}: ${message}`);
    if (reported.has(key)) return;
    reported.add(key);
    if (analyticsEnabled()) sendErrorReport(umamiPayload(pending));
    toSentry(pending);
  } catch {
    // Neither does the reporting of one.
  }
}

/**
 * Listens for the page's uncaught errors and unhandled rejections, on scootradar.com only. An
 * extension's, another site's or an inline script's are left alone, as is "Script error." from
 * a script of another origin, a rejection that is no error, and one whose stack never went
 * through the site's scripts.
 */
export function watchBrowserErrors(target: Window = window): void {
  if (window.location.hostname !== ANALYTICS_HOST) return;
  const scripts = ownScripts(window.location.origin);
  target.addEventListener('error', event => {
    if (typeof event.filename !== 'string' || !event.filename.startsWith(scripts)) return;
    report(event.error ?? undefined, 'onerror', event);
  });
  target.addEventListener('unhandledrejection', event => {
    const reason: unknown = event.reason;
    if (reason instanceof Error && reason.stack?.includes(scripts)) report(reason, 'onunhandledrejection');
  });
}
