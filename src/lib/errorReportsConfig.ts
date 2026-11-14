/**
 * The public key (DSN) of the Sentry project that the website's browser errors go to,
 * `scootradar-web` (docs/OBSERVABILITY.md). Empty until that project exists: no report goes
 * to Sentry, its SDK is never downloaded, the content security policy names no Sentry host,
 * and /privacy says nothing of it. Filling it in turns on all four.
 */
export const SENTRY_BROWSER_DSN = '';

/** The meta tag in which each root layout names the commit its page was built from. */
export const RELEASE_META = 'scootradar-release';

/** The address a DSN's reports are sent to, by its origin alone, or null for anything that is not a DSN. */
export function sentryIngestOrigin(dsn: string = SENTRY_BROWSER_DSN): string | null {
  try {
    const url = new URL(dsn);
    return url.protocol === 'https:' && url.username && /^\/\d+$/.test(url.pathname) ? url.origin : null;
  } catch {
    return null;
  }
}
