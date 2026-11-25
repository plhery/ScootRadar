'use client';

import { useEffect, useId, useState } from 'react';
import Icon from '@/components/Icon';
import { isIPhone } from '@/lib/appStore';
import { PLAY_TEST_ATTRIBUTE, playStoreUrl, playTestInvitation } from '@/lib/playTest';
import type { PlayTestCopy } from '@/lib/playTestCopy';
import {
  OLDER_ANDROID_ATTRIBUTE,
  playTest,
  useOlderAndroid,
  usePlayTestAudience,
  usePlayTestMemory,
  type PlayTestPlace,
} from '@/lib/usePlayTest';
import '@/components/playTest.css';

// The invitation to install the Android app on the pages of the site
// (src/lib/playTest.ts): a guide's card, shown by the attribute the head's
// script sets, and the landing page's button, shown to all but an iPhone and an
// Android the app does not install on. Both lead to the app on Google Play.

/** A guide's card, under its headline: the offer, and × to hide it for a week. */
export function PlayTestCard({ copy }: { copy: PlayTestCopy }) {
  const titleId = useId();
  const [toast, setToast] = useState(false);
  return (
    <>
      <aside className="play-card" aria-labelledby={titleId}>
        {/* eslint-disable-next-line @next/next/no-img-element -- The icon of the app, an SVG. */}
        <img src="/icon.svg" alt="" width={44} height={44} />
        <div className="play-card-copy">
          <div>
            <h2 id={titleId}>{copy.title}</h2>
            <p>{copy.pitch}</p>
          </div>
          <a className="play-card-open" href={playStoreUrl('web-guide')} onClick={() => playTest.followed('guide')}>
            {copy.install}
          </a>
        </div>
        <button
          type="button"
          className="play-card-close"
          aria-label={copy.notNow}
          onClick={() => { playTest.dismissed('guide'); setToast(true); }}
        >
          <Icon name="close" size={15} strokeWidth={2.6} />
        </button>
      </aside>
      {toast && (
        <div className="play-toast-site" role="status">
          <span>{copy.hidden}</span>
          <button type="button" onClick={() => { playTest.never('guide'); setToast(false); }}>{copy.neverShow}</button>
        </div>
      )}
    </>
  );
}

/**
 * The landing page's button, under the iPhone app's: in its place on Android, and not on an iPhone, nor on an
 * Android the app does not install on once the browser has said so.
 */
export function PlayTestButton({ copy }: { copy: PlayTestCopy }) {
  return (
    <span className="play-android">
      <a className="btn btn--line" href={playStoreUrl('web-landing')} onClick={() => playTest.followed('landing')}>
        <Icon name="phone" size={20} />
        {copy.landing}
      </a>
    </span>
  );
}

/**
 * What decides, once a page, whether the page's card or button is shown: until the browser has answered, the head's
 * script decides.
 */
export function PlayTestSite({ place }: { place: Extract<PlayTestPlace, 'guide' | 'landing'> }) {
  const audience = usePlayTestAudience();
  const older = useOlderAndroid();
  const memory = usePlayTestMemory();

  useEffect(() => {
    if (audience === null || older === null) return;
    const root = document.documentElement;
    let offer = false;
    if (audience) {
      offer = playTestInvitation(memory, Date.now()) === 'offer';
      root.setAttribute(PLAY_TEST_ATTRIBUTE, offer ? 'offer' : 'quiet');
    } else {
      root.removeAttribute(PLAY_TEST_ATTRIBUTE);
    }
    root.toggleAttribute(OLDER_ANDROID_ATTRIBUTE, older);
    // The landing page's button is there for all but an iPhone and an Android the app does not install on, whatever
    // was answered before; a guide's card only while it offers.
    if (place === 'landing' ? !older && !isIPhone(navigator.userAgent) : offer) playTest.viewed(place);
  }, [audience, older, memory, place]);

  return null;
}
