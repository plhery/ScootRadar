// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isIPhone } from './appStore';
import {
  IPHONE_ATTRIBUTE,
  OLDER_ANDROID_ATTRIBUTE,
  PLAY_TEST_ATTRIBUTE,
  PLAY_TEST_LINKS,
  PLAY_TEST_SCRIPT,
  PLAY_TEST_STORAGE_KEY,
  androidInUserAgent,
  androidVersionFromHints,
  playTestInvitation,
  readPlayTestMemory,
  rememberPlayTest,
  seesPlayTest,
  type PlayTestMemory,
} from './playTest';

const AGENTS = {
  // Chrome and Samsung Internet since 2023: every phone is "Android 10; K".
  chrome: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
  samsung: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  firefox14: 'Mozilla/5.0 (Android 14; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
  firefox11: 'Mozilla/5.0 (Android 11; Mobile; rv:144.0) Gecko/144.0 Firefox/144.0',
  // Chrome before the reduction, which named the version and the model.
  oldChrome9: 'Mozilla/5.0 (Linux; Android 9; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 Mobile Safari/537.36',
  oldChrome12: 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 Mobile Safari/537.36',
  noVersion: 'Mozilla/5.0 (Linux; Android; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
  iPhone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
  mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
};

/** A browser that gives its version through client hints. */
function hinting(userAgent: string, hints?: { platform: string; platformVersion: string } | Error) {
  return {
    userAgent,
    userAgentData: hints === undefined ? undefined : {
      getHighEntropyValues: async () => {
        if (hints instanceof Error) throw hints;
        return hints;
      },
    },
  };
}

beforeEach(() => localStorage.clear());

describe('who is invited', () => {
  it('reads Android from the user agent, and its version only where the browser still gives it', () => {
    expect(androidInUserAgent(AGENTS.chrome)).toBe('unknown');
    expect(androidInUserAgent(AGENTS.samsung)).toBe('unknown');
    expect(androidInUserAgent(AGENTS.noVersion)).toBe('unknown');
    expect(androidInUserAgent(AGENTS.firefox14)).toBe('yes');
    expect(androidInUserAgent(AGENTS.oldChrome12)).toBe('yes');
    expect(androidInUserAgent(AGENTS.firefox11)).toBe('no');
    expect(androidInUserAgent(AGENTS.oldChrome9)).toBe('no');
    expect(androidInUserAgent(AGENTS.iPhone)).toBe('no');
    expect(androidInUserAgent(AGENTS.mac)).toBe('no');
  });

  it('reads the real version from the client hints, and nothing from other systems or a refusal', async () => {
    expect(await androidVersionFromHints(hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '14.0.0' }))).toBe(14);
    expect(await androidVersionFromHints(hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '11' }))).toBe(11);
    expect(await androidVersionFromHints(hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '' }))).toBeNull();
    expect(await androidVersionFromHints(hinting(AGENTS.mac, { platform: 'macOS', platformVersion: '15.0.0' }))).toBeNull();
    expect(await androidVersionFromHints(hinting(AGENTS.chrome, new Error('refused')))).toBeNull();
    expect(await androidVersionFromHints(hinting(AGENTS.firefox14))).toBeNull();
  });

  it('invites Android 12 and later, and every Android whose version the browser does not say', async () => {
    const sees = (nav: ReturnType<typeof hinting>, referrer = '') => seesPlayTest(nav, referrer, true);
    expect(await sees(hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '12.0.0' }))).toBe(true);
    expect(await sees(hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '16.0.0' }))).toBe(true);
    expect(await sees(hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '11.0.0' }))).toBe(false);
    expect(await sees(hinting(AGENTS.chrome, new Error('refused')))).toBe(true);
    expect(await sees(hinting(AGENTS.chrome))).toBe(true);
    expect(await sees(hinting(AGENTS.firefox14))).toBe(true);
    expect(await sees(hinting(AGENTS.firefox11))).toBe(false);
    expect(await sees(hinting(AGENTS.iPhone))).toBe(false);
    expect(await sees(hinting(AGENTS.mac, { platform: 'macOS', platformVersion: '15.0.0' }))).toBe(false);
  });

  it('invites no one while the switch is off, nor whoever comes from the app itself', async () => {
    const android14 = hinting(AGENTS.chrome, { platform: 'Android', platformVersion: '14.0.0' });
    expect(await seesPlayTest(android14, '', false)).toBe(false);
    expect(await seesPlayTest(android14, 'android-app://com.plhery.scootradar/', true)).toBe(false);
    expect(await seesPlayTest(android14, 'android-app://com.google.android.googlequicksearchbox/', true)).toBe(true);
  });

  it('leads to this app on Google Play, and to its group', () => {
    const gradle = readFileSync('android/app/build.gradle.kts', 'utf8');
    const app = /applicationId = "([^"]+)"/.exec(gradle)?.[1];
    expect(app).toBe('com.plhery.scootradar');
    expect(PLAY_TEST_LINKS.optIn).toBe(`https://play.google.com/apps/testing/${app}`);
    expect(PLAY_TEST_LINKS.install).toBe(`https://play.google.com/store/apps/details?id=${app}`);
    expect(PLAY_TEST_LINKS.group).toMatch(/^https:\/\/groups\.google\.com\/g\/[a-z0-9-]+$/);
  });
});

describe('what this browser remembers', () => {
  it('keeps only what it knows, and nothing that is not stored or not readable', () => {
    expect(readPlayTestMemory()).toEqual({});
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, '{not json');
    expect(readPlayTestMemory()).toEqual({});
    localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify({ until: 5, never: 'yes', step: 7, thanked: true, email: 'a@b.c' }));
    expect(readPlayTestMemory()).toEqual({ until: 5, thanked: true });
  });

  it('adds to what it remembers', () => {
    expect(rememberPlayTest({ step: 1 })).toEqual({ step: 1 });
    expect(rememberPlayTest({ until: 10 })).toEqual({ step: 1, until: 10 });
    expect(JSON.parse(localStorage.getItem(PLAY_TEST_STORAGE_KEY)!)).toEqual({ step: 1, until: 10 });
  });

  it('offers until × or "Not now" for a week, never after "Never", and thanks a tester back on the map once', () => {
    const now = 1_000_000;
    const shown = (memory: PlayTestMemory, place: 'map' | 'site' = 'map') => playTestInvitation(memory, now, place);
    expect(shown({})).toBe('offer');
    expect(shown({ step: 2 })).toBe('offer');
    expect(shown({ until: now + 1 })).toBe('quiet');
    expect(shown({ until: now })).toBe('offer');
    expect(shown({ never: true, step: 3 })).toBe('quiet');
    expect(shown({ step: 3 })).toBe('thanks');
    expect(shown({ step: 3, until: now + 1 })).toBe('thanks');
    expect(shown({ step: 3, thanked: true })).toBe('quiet');
    expect(shown({ step: 3 }, 'site')).toBe('quiet');
    expect(shown({}, 'site')).toBe('offer');
  });
});

describe('the script of the site, before the first paint', () => {
  const run = (userAgent: string, options: { memory?: PlayTestMemory; referrer?: string; hints?: { platform: string; platformVersion: string } } = {}) => {
    document.documentElement.removeAttribute(PLAY_TEST_ATTRIBUTE);
    document.documentElement.removeAttribute(IPHONE_ATTRIBUTE);
    document.documentElement.removeAttribute(OLDER_ANDROID_ATTRIBUTE);
    if (options.memory) localStorage.setItem(PLAY_TEST_STORAGE_KEY, JSON.stringify(options.memory));
    else localStorage.removeItem(PLAY_TEST_STORAGE_KEY);
    const nav = hinting(userAgent, options.hints);
    const page = { referrer: options.referrer ?? '', documentElement: document.documentElement };
    // The script reads the globals of the page: these stand in for them.
    new Function('navigator', 'document', PLAY_TEST_SCRIPT)(nav, page);
    return document.documentElement.getAttribute(PLAY_TEST_ATTRIBUTE);
  };
  afterEach(() => {
    document.documentElement.removeAttribute(PLAY_TEST_ATTRIBUTE);
    document.documentElement.removeAttribute(IPHONE_ATTRIBUTE);
    document.documentElement.removeAttribute(OLDER_ANDROID_ATTRIBUTE);
  });

  it('marks the page as playTestInvitation() and the user agent decide, for every browser and memory', () => {
    const now = Date.now();
    const memories: PlayTestMemory[] = [
      {}, { step: 1 }, { step: 2 }, { step: 3 }, { step: 3, thanked: true }, { never: true },
      { until: now + 60_000 }, { until: now - 60_000 }, { until: now + 60_000, step: 2 },
    ];
    for (const userAgent of Object.values(AGENTS)) {
      for (const memory of memories) {
        const expected = androidInUserAgent(userAgent) === 'no' ? null : playTestInvitation(memory, now, 'site');
        expect(run(userAgent, { memory }), `${userAgent} ${JSON.stringify(memory)}`).toBe(expected);
      }
    }
  });

  it('marks an iPhone, as isIPhone() decides, where the landing page’s Android button gives way', () => {
    for (const userAgent of Object.values(AGENTS)) {
      run(userAgent);
      expect(document.documentElement.hasAttribute(IPHONE_ATTRIBUTE), userAgent).toBe(isIPhone(userAgent));
    }
    expect(isIPhone(AGENTS.iPhone)).toBe(true);
  });

  it('says nothing to whoever comes from the app', () => {
    expect(run(AGENTS.chrome, { referrer: 'android-app://com.plhery.scootradar/' })).toBeNull();
  });

  it('takes it back when the client hints answer an Android older than 12', async () => {
    expect(run(AGENTS.chrome, { hints: { platform: 'Android', platformVersion: '11.0.0' } })).toBe('offer');
    await expect.poll(() => document.documentElement.getAttribute(PLAY_TEST_ATTRIBUTE)).toBeNull();
    expect(run(AGENTS.chrome, { hints: { platform: 'Android', platformVersion: '15.0.0' } })).toBe('offer');
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(document.documentElement.getAttribute(PLAY_TEST_ATTRIBUTE)).toBe('offer');
  });

  it('marks an Android the app does not install on before the first paint, where the landing page’s Android button gives way', async () => {
    const older = () => document.documentElement.hasAttribute(OLDER_ANDROID_ATTRIBUTE);
    // The user agent says so, as Firefox's and older Chrome's do.
    for (const userAgent of Object.values(AGENTS)) {
      run(userAgent);
      expect(older(), userAgent).toBe(userAgent === AGENTS.firefox11 || userAgent === AGENTS.oldChrome9);
    }
    // Chrome's client hints say so once they answer.
    run(AGENTS.chrome, { hints: { platform: 'Android', platformVersion: '11.0.0' } });
    await expect.poll(older).toBe(true);
    run(AGENTS.chrome, { hints: { platform: 'Android', platformVersion: '12.0.0' } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(older()).toBe(false);
  });
});
