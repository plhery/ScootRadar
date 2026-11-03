// The Android app's closed test on Google Play, and the site's invitation to
// join it (the user's choice on 3 November 2026: all Android visitors, in the
// places of the product). A personal developer account may only apply for
// production once 12 testers have stayed opted in for 14 days in a row, and
// most of the site's Android visitors land on a guide, not on the map.
//
// A tester takes three steps, each a link here: join the Google Group that
// Play's closed test admits, accept the test on Google Play with the same
// Google account, and install. The site cannot see Play's side: Play Console
// counts the testers, the site only the links followed (analytics.ts).
//
// The words are in playTestCopy.ts. The map shows a chip, after the visitor's
// first touch, and a row in Settings › About; a guide shows a card under its
// headline; the landing page's iPhone button becomes an Android one.

/** The switch: off, the site says nothing of the test anywhere. */
export const PLAY_TEST_ON = false;

/** Where each step leads. */
export const PLAY_TEST_LINKS = {
  /** The group "ScootRadar Android testers", which anyone may join. */
  group: 'https://groups.google.com/g/scootradar-android-testers',
  /** Play's page that makes a member of the group a tester. */
  optIn: 'https://play.google.com/apps/testing/com.plhery.scootradar',
  /** The app on Google Play, which shows a tester the test's build. */
  install: 'https://play.google.com/store/apps/details?id=com.plhery.scootradar',
} as const;

export const PLAY_TEST_STEPS = ['group', 'optIn', 'install'] as const;
export type PlayTestStep = (typeof PLAY_TEST_STEPS)[number];

/** The oldest Android the app installs on: its minSdk, 31. */
export const MIN_ANDROID = 12;

/** The app opens its links in the browser with this referrer: who has the app is not asked to test it. */
const APP_REFERRER = 'android-app://com.plhery.scootradar';

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
  /** Hidden until then (ms since 1970), after × or "Not now". */
  until?: number;
  /** "Never show" or "Don't ask again": nothing more, in this browser. */
  never?: boolean;
  /** The last step whose link was followed, 1 to 3. */
  step?: number;
  /** The thanks after step 3 has been shown. */
  thanked?: boolean;
}

export const PLAY_TEST_STORAGE_KEY = 'scooters-android-test';
/** How long × hides the invitation. */
export const PLAY_TEST_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export function readPlayTestMemory(): PlayTestMemory {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PLAY_TEST_STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return {};
    const { until, never, step, thanked } = saved as Record<string, unknown>;
    return {
      ...(typeof until === 'number' && Number.isFinite(until) ? { until } : {}),
      ...(never === true ? { never } : {}),
      ...(typeof step === 'number' && step >= 1 && step <= 3 ? { step: Math.floor(step) } : {}),
      ...(thanked === true ? { thanked } : {}),
    };
  } catch {
    return {};
  }
}

/** Adds to what is remembered, and returns all of it. */
export function rememberPlayTest(change: PlayTestMemory): PlayTestMemory {
  const memory = { ...readPlayTestMemory(), ...change };
  try { localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify(memory)); } catch { /* Private mode: it asks again next time. */ }
  return memory;
}

/**
 * What an invited visitor is shown where it would be offered: the offer, the
 * thanks of a tester back after step 3 (on the map, once), or nothing.
 * The landing page's button and the row in Settings stay whatever this says:
 * they replace or join what is already there, and ask nothing.
 */
export function playTestInvitation(memory: PlayTestMemory, now: number, place: 'map' | 'site'): 'offer' | 'thanks' | 'quiet' {
  if (memory.never) return 'quiet';
  if ((memory.step ?? 0) >= 3) return place === 'map' && !memory.thanked ? 'thanks' : 'quiet';
  if (memory.until !== undefined && memory.until > now) return 'quiet';
  return 'offer';
}

/** The attribute of the site's <html> that shows the invitation's parts there: "offer" or "quiet". */
export const PLAY_TEST_ATTRIBUTE = 'data-android-test';

/**
 * Runs in the head of every page of the site, before the first paint: the guide's
 * card and the landing page's Android button are in the page as built, hidden,
 * and this shows them to whom they are for, so that nothing moves when the page
 * has loaded. It follows seesPlayTest() and playTestInvitation() (the test keeps
 * them in step), and the client hints, which come later, can only take it back.
 * Written as text because it is not part of any bundle; the Worker gives it the
 * nonce of the response like every other script of the page.
 */
export const PLAY_TEST_SCRIPT = `(function () {
  try {
    var agent = navigator.userAgent;
    if (!/\\bAndroid\\b/.test(agent) || document.referrer.indexOf(${JSON.stringify(APP_REFERRER)}) === 0) return;
    var told = /\\bAndroid 10; K\\)/.test(agent) ? 0 : Number((/\\bAndroid (\\d+)/.exec(agent) || [])[1]);
    if (told && told < ${MIN_ANDROID}) return;
    var memory = null;
    try { memory = JSON.parse(localStorage.getItem(${JSON.stringify(PLAY_TEST_STORAGE_KEY)}) || 'null'); } catch (error) {}
    if (!memory || typeof memory !== 'object') memory = {};
    var quiet = memory.never === true || (typeof memory.step === 'number' && memory.step >= 3) ||
      (typeof memory.until === 'number' && memory.until > Date.now());
    var root = document.documentElement;
    root.setAttribute(${JSON.stringify(PLAY_TEST_ATTRIBUTE)}, quiet ? 'quiet' : 'offer');
    var hints = navigator.userAgentData;
    if (hints && hints.getHighEntropyValues) hints.getHighEntropyValues(['platformVersion']).then(function (given) {
      var major = parseInt(given.platformVersion, 10);
      if (given.platform === 'Android' && major < ${MIN_ANDROID}) root.removeAttribute(${JSON.stringify(PLAY_TEST_ATTRIBUTE)});
    }, function () {});
  } catch (error) {}
})();`;
