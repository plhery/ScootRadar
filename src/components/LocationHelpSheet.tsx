'use client';

import { useState } from 'react';
import { useI18n, type TranslationKey } from '@/lib/i18n';
import { locationHelp } from '@/lib/locationHelp';
import { appStoreUrl, isIPhone } from '@/lib/appStore';
import ModalSheet from './ModalSheet';

interface LocationHelpSheetProps {
  open: boolean;
  onClose: () => void;
}

/** How to turn location back on after it was refused: the steps for this browser and this device. */
export default function LocationHelpSheet({ open, onClose }: LocationHelpSheetProps) {
  const { t } = useI18n();
  // Worked out when the sheet first opens: the server does not know the browser.
  const [help, setHelp] = useState<{ steps: TranslationKey[]; iPhone: boolean } | null>(null);
  if (open && !help) {
    setHelp({ steps: locationHelp(navigator.userAgent, navigator.maxTouchPoints).steps, iPhone: isIPhone(navigator.userAgent) });
  }
  // On an iPhone, the app is the other way: its link sits where the line names it.
  const [beforeApp, afterApp = ''] = t('help.app').split('{app}');

  return (
    <ModalSheet open={open} title={t('help.title')} onClose={onClose}>
      {/* Without bullets a list is not announced as one everywhere: the role says it again, and the numbers are read. */}
      <ol className="help-steps" role="list">
        {help?.steps.map((step, index) => (
          <li key={step}>
            <span className="help-step-number">{index + 1}</span>
            <span>{t(step)}</span>
          </li>
        ))}
      </ol>
      <p className="help-after">{t('help.after')}</p>
      {help?.iPhone && (
        <p className="help-after help-app">
          {beforeApp}
          <a href={appStoreUrl('web-map-location')}>{t('help.appLink')}</a>
          {afterApp}
        </p>
      )}
    </ModalSheet>
  );
}
