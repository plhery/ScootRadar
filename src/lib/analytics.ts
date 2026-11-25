import { MAP_PATH } from '@/lib/mapAddress';
import { SITE, SITE_HOST, SITE_NAME } from '@/lib/site';

// First-party, cookie-free Umami collection. Never accept arbitrary URLs or data. Where and as which
// website: the deployment's ANALYTICS_URL and ANALYTICS_WEBSITE_ID (src/lib/siteSettings.ts); without
// them nothing is sent. Only the site's own host counts, never a copy of a page served elsewhere.
export const ANALYTICS_ENDPOINT = SITE.ANALYTICS_URL;
export const ANALYTICS_WEBSITE = SITE.ANALYTICS_WEBSITE_ID;
export const ANALYTICS_HOST = SITE_HOST;
export type AnalyticsEvent =
  | 'search_open' | 'search_close' | 'search_results' | 'search_error' | 'search_select' | 'search_clear' | 'search_forget'
  | 'filters_open' | 'settings_open' | 'panel_close' | 'provider_filter' | 'providers_all' | 'filters_reset'
  | 'range_filter' | 'map_style' | 'zones_toggle' | 'language_change' | 'units_change' | 'locate' | 'location_result'
  | 'vehicle_select' | 'vehicle_dismiss' | 'cluster_select' | 'parking_select' | 'directions_open' | 'rental_open'
  | 'route_result' | 'route_arrived'
  | 'map_zoom' | 'compass_reset' | 'refresh' | 'refresh_result' | 'data_error' | 'data_expired' | 'zones_error'
  | 'app_install' | 'app_open' | 'map_open'
  // The invitation to install the Android app (src/lib/playTest.ts): shown, its link to Google Play followed,
  // hidden for a week, never again. Each says where: the map's chip, a guide's card, the landing page's
  // button, or the map's Settings. Until 25 November 2026, the closed test's: also invite_open (its steps opened),
  // invite_group and invite_optin (the first two steps' links followed).
  | 'invite_view' | 'invite_install' | 'invite_dismiss' | 'invite_never';
export interface AnalyticsData {
  provider?: string; enabled?: boolean; source?: 'quick' | 'filters';
  value?: number; count?: number; result?: string; style?: string;
  language?: string; target?: 'vehicle' | 'parking'; direction?: 'in' | 'out';
  place?: 'map' | 'guide' | 'landing' | 'settings';
}
const keys = new Set(['provider', 'enabled', 'source', 'value', 'count', 'result', 'style', 'language', 'target', 'direction', 'place']);

export function safeAnalyticsData(data: AnalyticsData): Record<string, string | number | boolean> {
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => keys.has(key) && (
    typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(value))
  )));
}

export function analyticsEnabled(): boolean {
  if (!ANALYTICS_ENDPOINT || !ANALYTICS_WEBSITE) return false;
  if (typeof window === 'undefined' || window.location.hostname !== ANALYTICS_HOST) return false;
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  try { return !localStorage.getItem('umami.disabled'); } catch { return false; }
}

// The pages of the app, with the title each is counted under, and the landing
// page, one per language, English at "/": src/lib/landingCopy.ts. The pages of
// the site (the landing page, the guides and their lists) give theirs: PageView.
const PUBLIC_PAGES = new Map([
  [MAP_PATH, `${SITE_NAME}`],
  ['/privacy', `Privacy — ${SITE_NAME}`],
  ['/accessibility', `Accessibility — ${SITE_NAME}`],
  ['/', `About — ${SITE_NAME}`],
  ['/de', `About — ${SITE_NAME}`],
  ['/fr', `About — ${SITE_NAME}`],
  ['/it', `About — ${SITE_NAME}`],
  ['/nl', `About — ${SITE_NAME}`],
  ['/nb', `About — ${SITE_NAME}`],
  ['/pt', `About — ${SITE_NAME}`],
  ['/es', `About — ${SITE_NAME}`],
  ['/is', `About — ${SITE_NAME}`],
]);

/** A page of the site, counted under its address and title as its layout gives them. */
export interface CountedPage { path: string; title: string }
// The form of every address of the site (src/lib/sitePages.ts): what isn't is counted as below.
export const SITE_PATH = /^\/[a-z0-9/-]{0,160}$/;

// Where a visit came from, sent with the first page view of a page load only, as Umami counts
// sources: the website that linked here, by its origin alone (browsers send no more by default),
// or, where the link gave none, the AI assistant its campaign names (ChatGPT's links carry
// utm_source=chatgpt.com and no referrer); and the link's campaign tags, each a short code.
// Nothing else of either address.
const CAMPAIGN_TAGS = ['utm_source', 'utm_medium', 'utm_campaign'];
const CAMPAIGN_VALUE = /^[a-zA-Z0-9._-]{1,60}$/;
const ASSISTANTS = new Map([
  ['chatgpt.com', 'chatgpt.com'], ['chatgpt', 'chatgpt.com'], ['chat.openai.com', 'chatgpt.com'],
  ['perplexity.ai', 'perplexity.ai'], ['perplexity', 'perplexity.ai'],
  ['copilot.microsoft.com', 'copilot.microsoft.com'], ['copilot.com', 'copilot.microsoft.com'], ['copilot', 'copilot.microsoft.com'],
  ['gemini.google.com', 'gemini.google.com'], ['gemini', 'gemini.google.com'],
  ['claude.ai', 'claude.ai'], ['claude', 'claude.ai'],
]);

export function visitSource(referrer: string, search: string): { referrer: string; query: string } {
  const given = new URLSearchParams(search);
  const tags = new URLSearchParams();
  for (const tag of CAMPAIGN_TAGS) {
    const value = given.get(tag)?.trim();
    if (value && CAMPAIGN_VALUE.test(value)) tags.set(tag, value);
  }
  let origin = '';
  try {
    const from = new URL(referrer);
    const own = from.hostname === ANALYTICS_HOST || from.hostname.endsWith(`.${ANALYTICS_HOST}`);
    // Android's apps, the Google app among them, give the app instead.
    if (/^https?:$/.test(from.protocol) && !own) origin = `${from.origin}/`;
    else if (from.protocol === 'android-app:' && from.hostname) origin = `android-app://${from.hostname}/`;
  } catch { /* No referrer, or not an address. */ }
  const assistant = ASSISTANTS.get(tags.get('utm_source')?.toLowerCase().replace(/^www\./, '') ?? '');
  if (!origin && assistant) origin = `https://${assistant}/`;
  const query = tags.toString();
  return { referrer: origin, query: query && `?${query}` };
}

let cache: string | undefined;
let landing = true;
// The page of the site last counted, under which its events are counted too.
let sitePage: CountedPage | undefined;
let disabledByServer = false;
let pending = 0;
let chain = Promise.resolve();
// Until when Umami asked for no more error reports: it takes only so many a minute from each website.
let errorsHeldUntil = 0;

/** The address a page is counted under: the page of the site given, or the app's page, or the map. */
export function countedPath(page: CountedPage | undefined = sitePage): string {
  if (page && SITE_PATH.test(page.path)) return page.path;
  return PUBLIC_PAGES.has(window.location.pathname) ? window.location.pathname : MAP_PATH;
}

/** `pwa` in the web app installed on a home screen, `web` in a browser. */
export function analyticsPlatform(): 'web' | 'pwa' {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone ? 'pwa' : 'web';
}

/** Sends to Umami after what was sent before, in the same session (its cache), and never throws. */
function send(type: 'event' | 'error', body: string): void {
  pending++;
  chain = chain.then(async () => {
    if (!analyticsEnabled() || disabledByServer || (type === 'error' && Date.now() < errorsHeldUntil)) return;
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', ...(cache ? { 'x-umami-cache': cache } : {}) },
      body,
    });
    if (type === 'error' && response.status === 429) {
      const seconds = Number(response.headers.get('Retry-After')) || 60;
      errorsHeldUntil = Date.now() + Math.max(1, Math.min(seconds, 300)) * 1000;
    }
    if (!response.ok) return;
    const result = await response.json();
    if (!result || typeof result !== 'object') return;
    if ('cache' in result && typeof result.cache === 'string') cache = result.cache;
    disabledByServer = 'disabled' in result && result.disabled === true;
  }).catch(() => { /* Analytics must never interrupt the map or navigation. */ }).finally(() => { pending--; });
}

export function track(event?: AnalyticsEvent, data: AnalyticsData = {}, page?: CountedPage): void {
  if (!event && page) sitePage = page;
  if (!analyticsEnabled() || disabledByServer || pending >= 30) return;
  const given = page ?? sitePage;
  const counted = given && SITE_PATH.test(given.path) ? given : undefined;
  const platform = analyticsPlatform();
  const source = !event && landing ? visitSource(document.referrer, window.location.search) : undefined;
  if (!event) landing = false;
  const payload = {
    website: ANALYTICS_WEBSITE, hostname: ANALYTICS_HOST,
    // Only these public screens exist. Exclude even unknown paths, fragments and every query but the
    // first view's campaign tags: what is not one of them is counted as the map, which sends every
    // event but the page views.
    url: countedPath(given) + (source?.query ?? ''),
    title: counted?.title.slice(0, 120) ?? PUBLIC_PAGES.get(window.location.pathname) ?? `${SITE_NAME}`,
    referrer: source?.referrer ?? '', language: navigator.language, tag: platform,
    ...(event ? { name: event, data: { ...safeAnalyticsData(data), platform } } : {}),
  };
  send('event', JSON.stringify({ type: 'event', payload }));
}

/** What Umami 3.5 keeps of an error (its `errorPayloadSchema`): src/lib/errorReports.ts. */
export interface ErrorReportPayload {
  version: 1; website: string; eventId: string; timestamp: number;
  name: string; message: string; stack: string; handled: boolean; url: string;
  release: string; environment: string; language?: string; tags: Record<string, string>;
}
// Umami refuses a larger one.
const MAX_ERROR_BYTES = 48_000;

/**
 * Sends a report of one of the page's own errors to Umami, in the session of its page views
 * and events, under the same rules: nothing while analytics is off. After a 429 nothing more
 * for the seconds its Retry-After says (a minute without one, five minutes at most).
 */
export function sendErrorReport(payload: ErrorReportPayload): void {
  if (!analyticsEnabled() || disabledByServer || pending >= 30 || Date.now() < errorsHeldUntil) return;
  const body = JSON.stringify({ type: 'error', payload });
  if (new TextEncoder().encode(body).byteLength > MAX_ERROR_BYTES) return;
  send('error', body);
}
