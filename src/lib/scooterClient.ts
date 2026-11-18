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
