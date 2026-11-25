// The words of the invitation to install the Android app, src/lib/playTest.ts,
// in every language of the site, for the map and the pages alike. Until
// 25 November 2026 they invited to its closed test ("Try our Android app", in
// German "Teste unsere Android-App"); since then the app is on Google Play.

import type { LandingLocale } from '@/lib/landingCopy';

export interface PlayTestCopy {
  /** The chip on the map and the card in a guide. */
  title: string;
  /** Under the guide's card title. */
  pitch: string;
  /** The card's button, to Google Play. */
  install: string;
  /** The landing page's button, under the iPhone app's (landingCopy's iphoneApp). */
  landing: string;
  /** × on the chip and the card. */
  notNow: string;
  /** What × leaves, with "Never show" beside it. */
  hidden: string;
  neverShow: string;
  /** The row in Settings › About, beside the iPhone app's. */
  app: string;
}

export const PLAY_TEST_COPY: Record<LandingLocale, PlayTestCopy> = {
  en: {
    title: 'Get our Android app',
    pitch: 'Free on Google Play, for Android 12 or later.',
    install: 'Install',
    landing: 'Get the Android app',
    notNow: 'Not now',
    hidden: 'Hidden for a week',
    neverShow: 'Never show',
    app: 'Android app',
  },

  de: {
    title: 'Hol dir unsere Android-App',
    pitch: 'Kostenlos auf Google Play, ab Android 12.',
    install: 'Installieren',
    landing: 'Android-App laden',
    notNow: 'Nicht jetzt',
    hidden: 'Eine Woche ausgeblendet',
    neverShow: 'Nie mehr zeigen',
    app: 'Android-App',
  },

  fr: {
    title: 'Téléchargez notre app Android',
    pitch: 'Gratuite sur Google Play, pour Android 12 ou plus récent.',
    install: 'Installer',
    landing: 'Télécharger l’app Android',
    notNow: 'Pas maintenant',
    hidden: 'Masqué pour une semaine',
    neverShow: 'Ne plus afficher',
    app: 'App Android',
  },

  it: {
    title: 'Scarica la nostra app Android',
    pitch: 'Gratis su Google Play, da Android 12 in poi.',
    install: 'Installa',
    landing: 'Scarica l’app per Android',
    notNow: 'Non ora',
    hidden: 'Nascosto per una settimana',
    neverShow: 'Non mostrare più',
    app: 'App per Android',
  },

  nl: {
    title: 'Download onze Android-app',
    pitch: 'Gratis op Google Play, voor Android 12 of nieuwer.',
    install: 'Installeren',
    landing: 'Download de Android-app',
    notNow: 'Niet nu',
    hidden: 'Een week verborgen',
    neverShow: 'Nooit meer tonen',
    app: 'Android-app',
  },

  nb: {
    title: 'Last ned Android-appen vår',
    pitch: 'Gratis på Google Play, for Android 12 eller nyere.',
    install: 'Installer',
    landing: 'Last ned Android-appen',
    notNow: 'Ikke nå',
    hidden: 'Skjult i en uke',
    neverShow: 'Vis aldri',
    app: 'Android-app',
  },

  pt: {
    title: 'Descarregue a nossa app Android',
    pitch: 'Grátis no Google Play, para Android 12 ou mais recente.',
    install: 'Instalar',
    landing: 'Descarregar a app para Android',
    notNow: 'Agora não',
    hidden: 'Oculto durante uma semana',
    neverShow: 'Não mostrar mais',
    app: 'App para Android',
  },

  es: {
    title: 'Descarga nuestra app para Android',
    pitch: 'Gratis en Google Play, para Android 12 o posterior.',
    install: 'Instalar',
    landing: 'Descargar la app para Android',
    notNow: 'Ahora no',
    hidden: 'Oculto durante una semana',
    neverShow: 'No mostrar más',
    app: 'App para Android',
  },

  is: {
    title: 'Sæktu Android-appið okkar',
    pitch: 'Ókeypis á Google Play, fyrir Android 12 eða nýrra.',
    install: 'Setja upp',
    landing: 'Sækja Android-appið',
    notNow: 'Ekki núna',
    hidden: 'Falið í viku',
    neverShow: 'Aldrei sýna',
    app: 'Android-app',
  },
};
