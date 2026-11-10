'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { track } from '@/lib/analytics';
import {
  androidInUserAgent,
  androidVersionFromHints,
  MIN_ANDROID,
  PLAY_TEST_ON,
  PLAY_TEST_SNOOZE_MS,
  PLAY_TEST_STORAGE_KEY,
  readPlayTestMemory,
  rememberPlayTest,
  seesPlayTest,
  type PlayTestMemory,
} from '@/lib/playTest';

// The invitation's state in the page, src/lib/playTest.ts: what the browser
// remembers, shared by every part of it on the page, and what each part does.

/** Where the invitation is shown, or its steps were opened from. */
export type PlayTestPlace = 'map' | 'guide' | 'landing' | 'settings';

const listeners = new Set<() => void>();
let raw: string | null | undefined;
let memory: PlayTestMemory = {};
const NOTHING: PlayTestMemory = {};

function subscribe(listener: () => void) {
  listeners.add(listener);
  // What another tab of the site remembers counts here too.
  const changed = (event: StorageEvent) => { if (event.key === PLAY_TEST_STORAGE_KEY) listener(); };
  window.addEventListener('storage', changed);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', changed);
  };
}

/** The same object for as long as what is stored stays the same. */
function snapshot(): PlayTestMemory {
  let stored: string | null = null;
  try { stored = localStorage.getItem(PLAY_TEST_STORAGE_KEY); } catch { /* Nothing stored, then. */ }
  if (stored !== raw) {
    raw = stored;
    memory = readPlayTestMemory();
  }
  return memory;
}

/** What this browser remembers of the invitation; nothing on the server and until the page has hydrated. */
export function usePlayTestMemory(): PlayTestMemory {
  return useSyncExternalStore(subscribe, snapshot, () => NOTHING);
}

function remember(change: PlayTestMemory) {
  rememberPlayTest(change);
  listeners.forEach(listener => listener());
}

/** Whether this visitor is invited at all; null while the browser is asked. */
export function usePlayTestAudience(): boolean | null {
  const [audience, setAudience] = useState<boolean | null>(PLAY_TEST_ON ? null : false);
  useEffect(() => {
    if (!PLAY_TEST_ON) return;
    let live = true;
    void seesPlayTest(navigator, document.referrer, PLAY_TEST_ON).then(invited => { if (live) setAudience(invited); });
    return () => { live = false; };
  }, []);
  return audience;
}

export { OLDER_ANDROID_ATTRIBUTE } from '@/lib/playTest';

/**
 * Whether the browser says it runs an Android older than the app installs on (MIN_ANDROID): as its client hints say
 * where it gives them, for Chrome and Samsung Internet give every phone as "Android 10; K" in the user agent, and
 * else as its user agent says, as Firefox's does. Null while the browser is asked; false where neither says.
 */
export function useOlderAndroid(): boolean | null {
  const [older, setOlder] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void androidVersionFromHints(navigator).then(version => {
      if (!live) return;
      const agent = navigator.userAgent;
      setOlder(version !== null ? version < MIN_ANDROID : /\bAndroid\b/.test(agent) && androidInUserAgent(agent) === 'no');
    });
    return () => { live = false; };
  }, []);
  return older;
}

const STEP_EVENTS = ['invite_group', 'invite_optin', 'invite_install'] as const;
const viewed = new Set<PlayTestPlace>();

/** What the visitor does with the invitation: each is remembered, where it changes anything, and counted. */
export const playTest = {
  /** Shown: counted once a page. */
  viewed(place: PlayTestPlace) {
    if (viewed.has(place)) return;
    viewed.add(place);
    track('invite_view', { place });
  },
  opened(place: PlayTestPlace) {
    track('invite_open', { place });
  },
  /** A step's link was followed: the next one is the one offered. */
  stepped(step: 1 | 2 | 3, place: PlayTestPlace) {
    remember({ step: Math.max(readPlayTestMemory().step ?? 0, step) });
    track(STEP_EVENTS[step - 1], { place });
  },
  /** × or "Not now": hidden for a week. */
  dismissed(place: PlayTestPlace) {
    remember({ until: Date.now() + PLAY_TEST_SNOOZE_MS });
    track('invite_dismiss', { place });
  },
  /** "Never show" or "Don't ask again". */
  never(place: PlayTestPlace) {
    remember({ never: true });
    track('invite_never', { place });
  },
  /** The thanks after step 3 has been shown: once. */
  thanked() {
    remember({ thanked: true });
  },
};

/** For tests: forget which places were counted as shown. */
export function resetPlayTestViews() {
  viewed.clear();
}
