/**
 * Who a request for scooters comes from, as the Worker makes it out (scooterProxy.ts) and tells the cache in
 * SCOOTER_CLIENT_HEADER, which only an authenticated Worker may set:
 *
 * - verified: a map holding a pass, which Turnstile gave a browser, App Attest or Play Integrity an app (mapPass.ts);
 * - map: one of our maps naming its view (X-Scooter-View), the web map before it holds a pass, and the iPhone
 *   and Android apps since 8 and 12 November 2026;
 * - app: our iPhone or Android app too old to name its view, told by its user agent;
 * - other: none of these, as a script. The cache answers it from what it holds, collecting nothing.
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

// The website's origin (SITE_URL in site.ts, which the cache is not built with). www.scootradar.com and the legacy
// hosts lead their pages there, so the map's requests never carry theirs.
const OWN_ORIGIN = 'https://scootradar.com';

export function scooterReferrer(referrer: string | null | undefined): ScooterReferrer {
  if (!referrer) return 'none';
  try {
    return new URL(referrer).origin === OWN_ORIGIN ? 'own' : 'other';
  } catch {
    return 'other';
  }
}

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
