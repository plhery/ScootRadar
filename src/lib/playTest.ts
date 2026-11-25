// The Android app on Google Play, and the site's invitations to install it, in
// the places the user chose on 3 November 2026 for all Android visitors. Until
// 25 November 2026 the app was in a closed test, and each invitation led
// through three steps (join the testers' Google Group, accept the test, install);
// since it is out on Google Play, each is a link to the app's page there.
//
// The words are in playTestCopy.ts. The map shows a chip, after the visitor's
// first touch, and a row in Settings › About; a guide shows a card under its
// headline. The landing page names both apps to everyone (the user's choice on
// 9 November 2026), and a phone only its own: on Android the iPhone app's
// button gives way, on an iPhone the Android app's.

import { SITE } from '@/lib/site';

/** The switch: off, the site names no Android app anywhere. On where the deployment names it (ANDROID_APP_ID, src/lib/siteSettings.ts). */
export const PLAY_TEST_ON = SITE.ANDROID_APP_ID !== '';

/** Where a link to Google Play sits, for Play Console's acquisition report (its UTM campaigns), as appStore.ts's campaigns. */
export type PlayStoreCampaign = 'web-map' | 'web-guide' | 'web-landing' | 'web-map-settings';

/** The app's page on Google Play. */
export const PLAY_STORE_PAGE = `https://play.google.com/store/apps/details?id=${SITE.ANDROID_APP_ID}`;

/** The app's page on Google Play, from this place on the site. */
export function playStoreUrl(campaign: PlayStoreCampaign): string {
  const referrer = encodeURIComponent(`utm_source=website&utm_medium=link&utm_campaign=${campaign}`);
  return `${PLAY_STORE_PAGE}&referrer=${referrer}`;
}

/** The oldest Android the app installs on: its minSdk, 31. */
export const MIN_ANDROID = 12;

/** The app opens its links in the browser with this referrer: who has the app is not asked to install it. */
const APP_REFERRER = `android-app://${SITE.ANDROID_APP_ID}`;

/**
 * What the browser's user agent says of Android. Chrome and Samsung Internet
 * give every phone as "Android 10; K" since 2023, whatever it runs: that says
 * nothing of the version. Firefox and older browsers give the real one.
 */
export function androidInUserAgent(userAgent: string): 'no' | 'yes' | 'unknown' {
  if (!/\bAndroid\b/.test(userAgent)) return 'no';
  if (/\bAndroid 10; K\)/.test(userAgent)) return 'unknown';
  const major = Number(/\bAndroid (\d+)/.exec(userAgent)?.[1]);
  if (!major) return 'unknown';
  return major >= MIN_ANDROID ? 'yes' : 'no';
}

interface UserAgentHints {
  platform?: string;
  platformVersion?: string;
}
interface HintingNavigator {
  userAgent: string;
  userAgentData?: { getHighEntropyValues?: (hints: string[]) => Promise<UserAgentHints> };
}

/** The major version of Android from the browser's client hints, where it gives them (Chrome, Samsung Internet, Edge). */
export async function androidVersionFromHints(nav: HintingNavigator): Promise<number | null> {
  try {
    const hints = await nav.userAgentData?.getHighEntropyValues?.(['platformVersion']);
    if (hints?.platform !== 'Android') return null;
    const major = parseInt(hints.platformVersion ?? '', 10);
    return Number.isFinite(major) ? major : null;
  } catch {
    return null;
  }
}

/**
 * Whether this visitor is invited: the switch is on, the browser is on Android
 * 12 or later, or on an Android whose version it does not say, and the visit
 * does not come from the app itself. The client hints decide where there are
 * any; otherwise the user agent.
 */
export async function seesPlayTest(nav: HintingNavigator, referrer: string, on = PLAY_TEST_ON): Promise<boolean> {
  if (!on || referrer.startsWith(APP_REFERRER)) return false;
  const told = androidInUserAgent(nav.userAgent);
  if (told === 'no') return false;
  const version = await androidVersionFromHints(nav);
  return version === null || version >= MIN_ANDROID;
}

/** What this browser remembers of the invitation, in localStorage and nowhere else. */
export interface PlayTestMemory {
  /** Hidden until then (ms since 1970), after ×. */
  until?: number;
  /** "Never show": nothing more, in this browser. */
  never?: boolean;
  /** Its link to Google Play was followed: not offered again. */
  followed?: boolean;
}

export const PLAY_TEST_STORAGE_KEY = 'scooters-android-test';
/** How long × hides the invitation. */
export const PLAY_TEST_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function readPlayTestMemory(): PlayTestMemory {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PLAY_TEST_STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return {};
    const { until, never, followed, steps, step, thanked } = saved as Record<string, unknown>;
    // A tester who took all three steps of the closed test has the app: `steps`, or until 18 November 2026 (eb049011)
    // `step` 3 with `thanked`. Read as the link followed, so that they are not invited again. PLAY_TEST_SCRIPT reads
    // it the same way.
    const tested = Array.isArray(steps) ? [1, 2, 3].every(n => steps.includes(n)) : step === 3 && thanked === true;
    return {
      ...(typeof until === 'number' && Number.isFinite(until) ? { until } : {}),
      ...(never === true ? { never } : {}),
      ...(followed === true || tested ? { followed: true } : {}),
    };
  } catch {
    return {};
  }
}

/** Adds to what is remembered, and returns all of it. */
export function rememberPlayTest(change: PlayTestMemory, previous = readPlayTestMemory()): PlayTestMemory {
  const memory = { ...previous, ...change };
  try { localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify(memory)); } catch { /* Private mode: it asks again next time. */ }
  return memory;
}

/**
 * Whether an invited visitor is offered the app by the map's chip and a guide's card. The landing page's button and
 * the row in Settings stay whatever this says: they replace or join what is already there, and ask nothing.
 */
export function playTestInvitation(memory: PlayTestMemory, now: number): 'offer' | 'quiet' {
  if (memory.never || memory.followed) return 'quiet';
  if (memory.until !== undefined && memory.until > now) return 'quiet';
  return 'offer';
}

/** The attribute of the site's <html> that shows the invitation's parts there: "offer" or "quiet". */
export const PLAY_TEST_ATTRIBUTE = 'data-android-test';

/** The attribute of the site's <html> on an iPhone, where the landing page's Android button gives way (appStore.ts's isIPhone). */
export const IPHONE_ATTRIBUTE = 'data-iphone';

/** The attribute of the site's <html> where the browser says it runs an Android the app does not install on: the landing page's two app buttons give way, and the map is the way in. */
export const OLDER_ANDROID_ATTRIBUTE = 'data-older-android';

/**
 * Runs in the head of every page of the site, before the first paint: the guide's
 * card and the landing page's two app buttons are in the page as built, and this
 * shows each to whom it is for, so that nothing moves when the page has loaded. It follows seesPlayTest(), and
 * readPlayTestMemory() and playTestInvitation() (the test keeps them in step), and the client hints, which come
 * later, can only take it back.
 * Written as text because it is not part of any bundle; the Worker gives it the
 * nonce of the response like every other script of the page.
 */
export const PLAY_TEST_SCRIPT = `(function () {
  try {
    var agent = navigator.userAgent;
    if (/\\biPhone\\b/.test(agent)) document.documentElement.setAttribute(${JSON.stringify(IPHONE_ATTRIBUTE)}, '');
    if (!/\\bAndroid\\b/.test(agent) || document.referrer.indexOf(${JSON.stringify(APP_REFERRER)}) === 0) return;
    var told = /\\bAndroid 10; K\\)/.test(agent) ? 0 : Number((/\\bAndroid (\\d+)/.exec(agent) || [])[1]);
    if (told && told < ${MIN_ANDROID}) { document.documentElement.setAttribute(${JSON.stringify(OLDER_ANDROID_ATTRIBUTE)}, ''); return; }
    var memory = null;
    try { memory = JSON.parse(localStorage.getItem(${JSON.stringify(PLAY_TEST_STORAGE_KEY)}) || 'null'); } catch (error) {}
    if (!memory || typeof memory !== 'object') memory = {};
    var followed = memory.followed === true || (Array.isArray(memory.steps)
      ? [1, 2, 3].every(function (n) { return memory.steps.includes(n); }) : memory.step === 3 && memory.thanked === true);
    var quiet = memory.never === true || followed || (typeof memory.until === 'number' && memory.until > Date.now());
    var root = document.documentElement;
    root.setAttribute(${JSON.stringify(PLAY_TEST_ATTRIBUTE)}, quiet ? 'quiet' : 'offer');
    var hints = navigator.userAgentData;
    if (hints && hints.getHighEntropyValues) hints.getHighEntropyValues(['platformVersion']).then(function (given) {
      var major = parseInt(given.platformVersion, 10);
      if (given.platform === 'Android' && major < ${MIN_ANDROID}) {
        root.removeAttribute(${JSON.stringify(PLAY_TEST_ATTRIBUTE)});
        root.setAttribute(${JSON.stringify(OLDER_ANDROID_ATTRIBUTE)}, '');
      }
    }, function () {});
  } catch (error) {}
})();`;
