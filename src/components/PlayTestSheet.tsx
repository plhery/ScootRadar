'use client';

import { useI18n } from '@/lib/i18n';
import { PLAY_TEST_COPY } from '@/lib/playTestCopy';
import ModalSheet from './ModalSheet';
import PlayTestSteps, { PlayTestDismiss } from './PlayTestSteps';

/** The steps to test the Android app, over the map, from its chip (src/lib/playTest.ts). */
export default function PlayTestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { locale } = useI18n();
  const copy = PLAY_TEST_COPY[locale];
  return (
    <ModalSheet
      open={open}
      title={copy.title}
      onClose={onClose}
      footer={<PlayTestDismiss copy={copy} place="map" onDone={onClose} />}
    >
      <div className="play-intro">
        {/* eslint-disable-next-line @next/next/no-img-element -- The app's own icon, kept offline with the map. */}
        <img src="/icon-180.png" alt="" width={56} height={56} />
        <p>{copy.sheetPitch}</p>
      </div>
      <PlayTestSteps copy={copy} place="map" />
    </ModalSheet>
  );
}
