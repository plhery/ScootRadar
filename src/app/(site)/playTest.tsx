'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import PlayTestSteps, { PlayTestDismiss } from '@/components/PlayTestSteps';
import { isIPhone } from '@/lib/appStore';
import { PLAY_TEST_ATTRIBUTE, playTestInvitation } from '@/lib/playTest';
import type { PlayTestCopy } from '@/lib/playTestCopy';
import { playTest, usePlayTestAudience, usePlayTestMemory, type PlayTestPlace } from '@/lib/usePlayTest';

// The invitation to test the Android app on the pages of the site
// (src/lib/playTest.ts): a guide's card, shown by the attribute the head's
// script sets, the landing page's button, shown to all but an iPhone, and the
// sheet of steps both open, once a page.

// The card and the button ask the page's sheet to open: nothing is kept, so a sheet mounted later does not open by itself.
const openers = new Set<() => void>();
function openSheet() {
  openers.forEach(open => open());
}

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
          <button
            type="button"
            className="play-card-open"
            aria-haspopup="dialog"
            onClick={() => { playTest.opened('guide'); openSheet(); }}
          >
            {copy.getEarly}
          </button>
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

/** The landing page's button, beside the iPhone app's: in its place on Android, and not on an iPhone. */
export function PlayTestButton({ copy }: { copy: PlayTestCopy }) {
  return (
    <span className="play-android">
      <button
        type="button"
        className="btn btn--line"
        aria-haspopup="dialog"
        onClick={() => { playTest.opened('landing'); openSheet(); }}
      >
        <Icon name="phone" size={20} />
        {copy.landing}
        <span className="play-badge">{copy.early}</span>
      </button>
      <small>{copy.landingNote}</small>
    </span>
  );
}

/**
 * The sheet of steps, once a page, and what decides whether the page's card or
 * button is shown: until the browser has answered, the head's script decides.
 */
export function PlayTestSite({ copy, place }: { copy: PlayTestCopy; place: Extract<PlayTestPlace, 'guide' | 'landing'> }) {
  const audience = usePlayTestAudience();
  const memory = usePlayTestMemory();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (audience === null) return;
    const root = document.documentElement;
    let offer = false;
    if (audience) {
      offer = playTestInvitation(memory, Date.now(), 'site') === 'offer';
      root.setAttribute(PLAY_TEST_ATTRIBUTE, offer ? 'offer' : 'quiet');
    } else {
      root.removeAttribute(PLAY_TEST_ATTRIBUTE);
    }
    // The landing page's button is there for all but an iPhone, whatever was answered before; a guide's card only while it offers.
    if (place === 'landing' ? !isIPhone(navigator.userAgent) : offer) playTest.viewed(place);
  }, [audience, memory, place]);

  useEffect(() => {
    const open = () => {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) dialog.showModal();
    };
    openers.add(open);
    return () => { openers.delete(open); };
  }, []);

  const close = () => dialogRef.current?.close();
  return (
    <dialog
      ref={dialogRef}
      className="play-sheet"
      aria-labelledby={titleId}
      // A tap beside the sheet, on the backdrop, closes it.
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <div className="play-sheet-inner">
        <div className="play-sheet-head">
          {/* eslint-disable-next-line @next/next/no-img-element -- The icon of the app, an SVG. */}
          <img src="/icon.svg" alt="" width={56} height={56} />
          <div>
            <h2 id={titleId}>{copy.title}</h2>
            <p>{copy.sheetPitch}</p>
          </div>
          <button type="button" className="play-sheet-close" aria-label={copy.close} onClick={close}>
            <Icon name="close" size={16} strokeWidth={2.6} />
          </button>
        </div>
        <PlayTestSteps copy={copy} place={place} />
        <PlayTestDismiss copy={copy} place={place} onDone={close} />
      </div>
    </dialog>
  );
}
