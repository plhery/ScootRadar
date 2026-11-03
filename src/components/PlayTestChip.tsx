'use client';

import { useEffect, useState } from 'react';
import { selectionFeedback } from '@/lib/feedback';
import { useI18n } from '@/lib/i18n';
import { playTestInvitation, readPlayTestMemory, type PlayTestMemory } from '@/lib/playTest';
import { PLAY_TEST_COPY } from '@/lib/playTestCopy';
import { playTest, usePlayTestAudience, usePlayTestMemory } from '@/lib/usePlayTest';
import Icon from './Icon';
import './playTest.css';

/** How long "Hidden for a week" stays, with "Never show" beside it. */
const TOAST_MS = 6000;

/**
 * The invitation to test the Android app on the map, under the search bar
 * (src/lib/playTest.ts): a chip, from the visitor's first touch of the page,
 * that opens the steps. × hides it for a week and offers "Never show" for a
 * moment. A tester back after the last step is thanked, once.
 */
export default function PlayTestChip({ onOpen }: { onOpen: () => void }) {
  const { locale } = useI18n();
  const copy = PLAY_TEST_COPY[locale];
  const audience = usePlayTestAudience();
  const memory = usePlayTestMemory();
  // Decided at the first touch, with what was remembered then.
  const [arrival, setArrival] = useState<{ shown: 'offer' | 'thanks' | 'quiet'; memory: PlayTestMemory } | null>(null);
  const [toast, setToast] = useState(false);
  const [thanksClosed, setThanksClosed] = useState(false);

  useEffect(() => {
    if (!audience || arrival) return;
    const touched = () => {
      const remembered = readPlayTestMemory();
      setArrival({ shown: playTestInvitation(remembered, Date.now(), 'map'), memory: remembered });
    };
    const options = { capture: true, passive: true } as const;
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    events.forEach(event => window.addEventListener(event, touched, options));
    return () => events.forEach(event => window.removeEventListener(event, touched, options));
  }, [audience, arrival]);

  // Until it is hidden here, or by the sheet: "Not now", "Don't ask again", or the last step taken.
  const offer = arrival?.shown === 'offer' && !memory.never && (memory.step ?? 0) < 3 &&
    memory.until === arrival.memory.until;
  const thanks = arrival?.shown === 'thanks' && !thanksClosed;

  useEffect(() => {
    if (offer) playTest.viewed('map');
  }, [offer]);
  useEffect(() => {
    if (thanks) playTest.thanked();
  }, [thanks]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(false), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {offer && (
        <div className="play-chip glass">
          <button
            type="button"
            className="play-chip-open"
            aria-haspopup="dialog"
            onClick={(event) => {
              // Safari does not focus a button that is tapped: the sheet returns the focus here when it closes.
              event.currentTarget.focus({ preventScroll: true });
              selectionFeedback();
              playTest.opened('map');
              onOpen();
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- The app's own icon, kept offline with the map. */}
            <img className="play-chip-icon" src="/icon-180.png" alt="" width={30} height={30} />
            <span>{copy.title}</span>
            <span className="play-badge">{copy.early}</span>
          </button>
          <span className="play-chip-rule" aria-hidden="true" />
          <button
            type="button"
            className="play-chip-close"
            aria-label={copy.notNow}
            onClick={() => { selectionFeedback(); playTest.dismissed('map'); setToast(true); }}
          >
            <Icon name="close" size={14} strokeWidth={2.6} />
          </button>
        </div>
      )}
      {thanks && (
        <div className="play-chip glass">
          <span className="play-thanks-mark" aria-hidden="true"><Icon name="check" size={15} strokeWidth={3} /></span>
          <span className="play-chip-words">{copy.thanks}</span>
          <button
            type="button"
            className="play-chip-close"
            aria-label={copy.close}
            onClick={() => { selectionFeedback(); setThanksClosed(true); }}
          >
            <Icon name="close" size={14} strokeWidth={2.6} />
          </button>
        </div>
      )}
      {/* Always there while the chip may be, so that what comes to stand in it is read out. */}
      <div className="play-chip-status" role="status">
        {toast && (
          <div className="play-chip play-toast glass">
            <span className="play-chip-words">{copy.hidden}</span>
            <button
              type="button"
              className="play-toast-never"
              onClick={() => { selectionFeedback(); playTest.never('map'); setToast(false); }}
            >
              {copy.neverShow}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
