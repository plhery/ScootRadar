'use client';

import { useEffect, useState } from 'react';
import { selectionFeedback } from '@/lib/feedback';
import { useI18n } from '@/lib/i18n';
import { playStoreUrl, playTestInvitation, type PlayTestMemory } from '@/lib/playTest';
import { PLAY_TEST_COPY } from '@/lib/playTestCopy';
import { playTest, playTestSnapshot, usePlayTestAudience, usePlayTestMemory } from '@/lib/usePlayTest';
import Icon from './Icon';
import './playTest.css';

/** How long "Hidden for a week" stays, with "Never show" beside it. */
const TOAST_MS = 6000;

/**
 * The invitation to install the Android app on the map, under the search bar
 * (src/lib/playTest.ts): a chip, from the visitor's first touch of the page,
 * that leads to the app on Google Play. × hides it for a week and offers
 * "Never show" for a moment.
 */
export default function PlayTestChip() {
  const { locale } = useI18n();
  const copy = PLAY_TEST_COPY[locale];
  const audience = usePlayTestAudience();
  const memory = usePlayTestMemory();
  // Decided at the first touch, with what was remembered then.
  const [arrival, setArrival] = useState<{ shown: 'offer' | 'quiet'; memory: PlayTestMemory } | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!audience || arrival) return;
    const touched = () => {
      const remembered = playTestSnapshot();
      setArrival({ shown: playTestInvitation(remembered, Date.now()), memory: remembered });
    };
    const options = { capture: true, passive: true } as const;
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    events.forEach(event => window.addEventListener(event, touched, options));
    return () => events.forEach(event => window.removeEventListener(event, touched, options));
  }, [audience, arrival]);

  // Until it is hidden here or in another tab, or its link (or Settings' row) is followed.
  const offer = arrival?.shown === 'offer' && !memory.never && !memory.followed && memory.until === arrival.memory.until;

  useEffect(() => {
    if (offer) playTest.viewed('map');
  }, [offer]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(false), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <>
      {offer && (
        <div className="play-chip glass">
          <a
            className="play-chip-open"
            href={playStoreUrl('web-map')}
            onClick={() => { selectionFeedback(); playTest.followed('map'); }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- The app's own icon, kept offline with the map. */}
            <img className="play-chip-icon" src="/icon-180.png" alt="" width={30} height={30} />
            <span>{copy.title}</span>
          </a>
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
