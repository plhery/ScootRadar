import { SERVICE_NAME, SERVICE_ORIGIN } from './serviceIdentity';

/**
 * Who a request for scooters comes from, as the Worker makes it out (scooterProxy.ts) and tells the cache in
 * SCOOTER_CLIENT_HEADER, which only an authenticated Worker may set:
 *
 * - verified: a map holding a pass, which Turnstile gave a browser, App Attest or Play Integrity an app (mapPass.ts);
 * - map: one of our maps naming its view (X-Scooter-View), the web map before it holds a pass, and the iPhone
 *   and Android apps since 8 and 12 November 2026;
 * - app: our iPhone or Android app too old to name its view, told by its user agent;
 * - other: none of these, as a script. The Worker refuses it (403) wherever passes are signed; the cache, should one
 *   reach it, answers it from what it holds, collecting nothing.
 *
 * A script can send any of these headers: map and app are what it claims, which the cache counts against its
 * network (server/visitorLedger.ts) and the daily check reads (docs/OBSERVABILITY.md, "Scraping").
 */
export type ScooterClient = 'verified' | 'map' | 'app' | 'other';

export const SCOOTER_CLIENTS: readonly ScooterClient[] = ['verified', 'map', 'app', 'other'];

export const SCOOTER_CLIENT_HEADER = 'X-Scooter-Client';

/** The iPhone app's (ScootRadar/… CFNetwork/…) and the Android app's (okhttp/…) user agents. */
export const isAppUserAgent = (agent: string | null | undefined) => !!agent && /^(ScootRadar|okhttp)\//.test(agent);

/**
 * A browser's user agent, as every engine's reads: `Mozilla/5.0 (` and its platform, then WebKit's or Blink's
 * `AppleWebKit/…` (Safari, Chrome, Edge, Samsung, in-app web views) or Gecko's `Gecko/…` (Firefox). Not a script's:
 * curl's, Python's, Node's, `PiHomeSystem/1.0`, the bare `Mozilla/5.0` of the script that polled Mainz and Wiesbaden
 * in November 2026, nor a crawler's `Mozilla/5.0 AppleWebKit/…; compatible; …`, which names no platform. From 13 to 20
 * November 2026 every request for scooters whose user agent was neither this nor our apps' was a script's.
 */
export const isBrowserUserAgent = (agent: string | null | undefined) =>
  !!agent && /^Mozilla\/5\.0 \(/.test(agent) && /AppleWebKit\/|Gecko\//.test(agent);

/** What the Worker answers, 403, a request for the scooter data it refuses (scooterProxy.ts, scooterBans.ts). */
export const NOT_OURS_MESSAGE = `The scooter data is only for the ${SERVICE_NAME} map and apps.`;

/**
 * What a request says it is by its user agent, which the Worker tells the cache in SCOOTER_AGENT_HEADER: our
 * iPhone or Android app (any build of it, the F-Droid one too), or a browser, as anything else is taken to be.
 * The cache holds a browser without a pass to its day's allowance (server/visitorLedger.ts), not an app yet.
 */
export type ScooterAgent = 'browser' | 'app';

export const SCOOTER_AGENT_HEADER = 'X-Scooter-Agent';

export const scooterAgent = (userAgent: string | null | undefined): ScooterAgent => isAppUserAgent(userAgent) ? 'app' : 'browser';

/** The agent a request to the cache names; none from a Worker that predates the header, which holds no one. */
export const parseScooterAgent = (value: string | string[] | null | undefined): ScooterAgent | null =>
  value === 'browser' || value === 'app' ? value : null;

/**
 * What kind of referrer a request for scooters carries, which the Worker tells the cache in SCOOTER_REFERRER_HEADER,
 * never the referrer itself: own for a page of ours (https://scootradar.com/…, whose map's requests carry it under
 * its Referrer-Policy, strict-origin-when-cross-origin), other for any other, none for none, as the apps send. The
 * cache counts them by agent, for a week of figures before deciding whether a browser without our referrer is
 * answered from what the cache holds (docs/OBSERVABILITY.md, "Scraping"). It holds no one by it: any client can send
 * our referrer.
 */
export type ScooterReferrer = 'own' | 'other' | 'none';

export const SCOOTER_REFERRERS: readonly ScooterReferrer[] = ['own', 'other', 'none'];

export const SCOOTER_REFERRER_HEADER = 'X-Scooter-Referrer';

// The website's origin, the deployment's SITE_URL (serviceIdentity.ts). Its www. host and scootradar.com's legacy
// hosts lead their pages there, so the map's requests never carry theirs.
const OWN_ORIGIN = SERVICE_ORIGIN;

export function scooterReferrer(referrer: string | null | undefined): ScooterReferrer {
  if (!referrer) return 'none';
  try {
    return new URL(referrer).origin === OWN_ORIGIN ? 'own' : 'other';
  } catch {
    return 'other';
  }
}

/**
 * The Worker sets it to `turnstile` on a browser's request for scooters without a pass where Turnstile could give it
 * one: passes are signed, Turnstile has its secret, and the page is the site's own host, which alone the widget lists
 * (DEPLOY.md, "Map passes"). The cache then answers such a browser, past a few answers of the day, only once it holds
 * a pass (server/visitorLedger.ts, PASS_GRACE_REQUESTS); without it, as on a preview or a local `wrangler dev`, as
 * before. Believed only with the Worker's token.
 */
export const SCOOTER_PASS_CHECK_HEADER = 'X-Scooter-Pass-Check';

export const parseScooterPassCheck = (value: string | string[] | null | undefined): boolean => value === 'turnstile';

/**
 * Our own scripts' requests for scooters (the daily live contract, the performance check, audits) carry the Worker
 * secret SCOOTER_AUDIT_TOKEN in it, and count as a verified client's: without it, a script is none of our maps and
 * apps, which the Worker refuses (scooterProxy.ts).
 */
export const SCOOTER_AUDIT_HEADER = 'X-Scooter-Audit';

/** The kind of referrer a request to the cache names; none from a Worker that predates the header, which is not counted. */
export const parseScooterReferrer = (value: string | string[] | null | undefined): ScooterReferrer | null =>
  SCOOTER_REFERRERS.find(referrer => referrer === value) ?? null;

export function scooterClient({ pass, view, userAgent }: { pass: boolean; view: boolean; userAgent: string | null }): ScooterClient {
  if (pass) return 'verified';
  if (view) return 'map';
  return isAppUserAgent(userAgent) ? 'app' : 'other';
}

/**
 * The client a request to the cache names. Without the header, from a Worker that predates it (the minute of a
 * deploy) or a request from inside the container, a map, as every request was before.
 */
export function parseScooterClient(value: string | string[] | null | undefined): ScooterClient {
  return SCOOTER_CLIENTS.find(client => client === value) ?? 'map';
}
