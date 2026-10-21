import { MAP_PATH } from '@/lib/mapAddress';

// First-party, cookie-free Umami collection. Never accept arbitrary URLs or data.
export const ANALYTICS_ENDPOINT = 'https://u.plhery.com/api/send';
export const ANALYTICS_WEBSITE = '6e60b4ab-b4ee-4785-9699-a7f32127b358';
export const ANALYTICS_HOST = 'scootradar.com';
export type AnalyticsEvent =
  | 'search_open' | 'search_close' | 'search_results' | 'search_error' | 'search_select' | 'search_clear'
  | 'filters_open' | 'settings_open' | 'panel_close' | 'provider_filter' | 'providers_all' | 'filters_reset'
  | 'battery_filter' | 'map_style' | 'zones_toggle' | 'language_change' | 'locate' | 'location_result'
  | 'vehicle_select' | 'vehicle_dismiss' | 'cluster_select' | 'parking_select' | 'directions_open' | 'rental_open'
  | 'route_result' | 'route_arrived'
  | 'map_zoom' | 'compass_reset' | 'refresh' | 'refresh_result' | 'data_error' | 'data_expired'
  | 'app_install' | 'app_open' | 'map_open';
export interface AnalyticsData {
  provider?: string; enabled?: boolean; source?: 'quick' | 'filters';
  value?: number; count?: number; result?: string; style?: string;
  language?: string; target?: 'vehicle' | 'parking'; direction?: 'in' | 'out';
}
const keys = new Set(['provider', 'enabled', 'source', 'value', 'count', 'result', 'style', 'language', 'target', 'direction']);

export function safeAnalyticsData(data: AnalyticsData): Record<string, string | number | boolean> {
  return Object.fromEntries(Object.entries(data).filter(([key, value]) => keys.has(key) && (
    typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) ||
    (typeof value === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(value))
  )));
}

export function analyticsEnabled(): boolean {
  if (typeof window === 'undefined' || window.location.hostname !== ANALYTICS_HOST) return false;
  if (navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false;
  try { return !localStorage.getItem('umami.disabled'); } catch { return false; }
}

// The pages of the app, with the title each is counted under, and the landing
// page, one per language, English at "/": src/lib/landingCopy.ts. The pages of
// the site (the landing page, the guides and their lists) give theirs: PageView.
const PUBLIC_PAGES = new Map([
  [MAP_PATH, 'ScootRadar'],
  ['/privacy', 'Privacy — ScootRadar'],
  ['/', 'About — ScootRadar'],
  ['/de', 'About — ScootRadar'],
  ['/fr', 'About — ScootRadar'],
  ['/it', 'About — ScootRadar'],
  ['/nl', 'About — ScootRadar'],
  ['/nb', 'About — ScootRadar'],
  ['/pt', 'About — ScootRadar'],
  ['/es', 'About — ScootRadar'],
  ['/is', 'About — ScootRadar'],
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
let disabledByServer = false;
let pending = 0;
let chain = Promise.resolve();

export function track(event?: AnalyticsEvent, data: AnalyticsData = {}, page?: CountedPage): void {
  if (!analyticsEnabled() || disabledByServer || pending >= 30) return;
  const counted = page && SITE_PATH.test(page.path) ? page : undefined;
  const platform = window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone ? 'pwa' : 'web';
  const source = !event && landing ? visitSource(document.referrer, window.location.search) : undefined;
  if (!event) landing = false;
  const payload = {
    website: ANALYTICS_WEBSITE, hostname: ANALYTICS_HOST,
    // Only these public screens exist. Exclude even unknown paths, fragments and every query but the
    // first view's campaign tags: what is not one of them is counted as the map, which sends every
    // event but the page views.
    url: (counted?.path ?? (PUBLIC_PAGES.has(window.location.pathname) ? window.location.pathname : MAP_PATH)) +
      (source?.query ?? ''),
    title: counted?.title.slice(0, 120) ?? PUBLIC_PAGES.get(window.location.pathname) ?? 'ScootRadar',
    referrer: source?.referrer ?? '', language: navigator.language, tag: platform,
    ...(event ? { name: event, data: { ...safeAnalyticsData(data), platform } } : {}),
  };
  pending++;
  chain = chain.then(async () => {
    if (!analyticsEnabled() || disabledByServer) return;
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
      signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/json', ...(cache ? { 'x-umami-cache': cache } : {}) },
      body: JSON.stringify({ type: 'event', payload }),
    });
    if (!response.ok) return;
    const result = await response.json();
    if (!result || typeof result !== 'object') return;
    if ('cache' in result && typeof result.cache === 'string') cache = result.cache;
    disabledByServer = 'disabled' in result && result.disabled === true;
  }).catch(() => { /* Analytics must never interrupt the map or navigation. */ }).finally(() => { pending--; });
}
