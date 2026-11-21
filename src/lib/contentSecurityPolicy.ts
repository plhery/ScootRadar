import { SENTRY_BROWSER_DSN, sentryIngestOrigin } from './errorReportsConfig';
import { SITE } from './site';

const policy = (directives: string[]): string => `${directives.join('; ')};`;

const MAP_TILES_ORIGIN = 'https://tiles.openfreemap.org';
// Cloudflare Turnstile, which gives the web map its pass (src/lib/mapPassClient.ts): its script, which the map
// loads under 'strict-dynamic' with the page's nonce (the host is for browsers without it), and its frame.
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

export function documentContentSecurityPolicy({
  nonce,
  development,
  upgradeInsecureRequests = !development,
  sentryDsn = SENTRY_BROWSER_DSN,
  analyticsUrl = SITE.ANALYTICS_URL,
}: {
  nonce: string;
  development: boolean;
  upgradeInsecureRequests?: boolean;
  sentryDsn?: string;
  /** Umami's address for events, where the deployment counts visits (ANALYTICS_URL). */
  analyticsUrl?: string;
}): string {
  const nonceSource = `'nonce-${nonce}'`;
  const analytics = !development && analyticsUrl ? new URL(analyticsUrl).origin : null;
  // Where the page's error reports go once the website has a Sentry project (src/lib/errorReports.ts).
  const sentry = development ? null : sentryIngestOrigin(sentryDsn);

  return policy([
    "default-src 'self'",
    `script-src 'self' ${nonceSource} 'strict-dynamic' ${TURNSTILE_ORIGIN}${development ? " 'unsafe-eval'" : ''}`,
    "script-src-attr 'none'",
    // CSP2 fallback. Modern browsers use the narrower style-src-elem and
    // style-src-attr directives below.
    "style-src 'self' 'unsafe-inline'",
    `style-src-elem 'self' ${nonceSource}${development ? " 'unsafe-inline'" : ''}`,
    "style-src-attr 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data:",
    // The map's vector tiles, which the page draws itself, the analytics, and Sentry once set.
    `connect-src 'self' ${MAP_TILES_ORIGIN}${development ? ' ws: wss:' : ''}${analytics ? ` ${analytics}` : ''}${sentry ? ` ${sentry}` : ''}`,
    `worker-src 'self'${development ? ' blob:' : ''}`,
    "child-src 'self'",
    `frame-src ${TURNSTILE_ORIGIN}`,
    "media-src 'none'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(upgradeInsecureRequests ? ['upgrade-insecure-requests'] : []),
  ]);
}

export const API_CONTENT_SECURITY_POLICY = policy([
  "default-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'sandbox',
]);

export const SERVICE_WORKER_CONTENT_SECURITY_POLICY = policy([
  "default-src 'none'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "connect-src 'self'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
]);
