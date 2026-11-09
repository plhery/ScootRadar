// The words of the invitation to test the Android app, src/lib/playTest.ts, in
// every language of the site, for the map and the pages alike. Short, as the
// user wrote them: "Try our Android app", in German "Teste unsere Android-App"
// and "Vorab testen". Google's own buttons are quoted in English only, where
// their words are known; the other languages say what to do instead.

import type { LandingLocale } from '@/lib/landingCopy';

export interface PlayTestStepCopy {
  title: string;
  hint: string;
  /** The step's button, which follows its link. */
  action: string;
}

export interface PlayTestCopy {
  /** The chip on the map, the card in a guide and the sheet. */
  title: string;
  /** The badge beside it. */
  early: string;
  /** Under the guide's card title. */
  pitch: string;
  /** The card's button. */
  getEarly: string;
  /** Under the sheet's title. */
  sheetPitch: string;
  /** Under the landing page's button (app, below), where it stands alone, on Android. */
  landingNote: string;
  steps: readonly [PlayTestStepCopy, PlayTestStepCopy, PlayTestStepCopy];
  /** Read after a step whose link was followed. */
  done: string;
  /** Under the steps. */
  note: string;
  notNow: string;
  /** In the sheet: no more invitations. */
  never: string;
  /** What × leaves, with "Never show" beside it. */
  hidden: string;
  neverShow: string;
  /** Once, on the map, after step 3. */
  thanks: string;
  close: string;
  /** The row in Settings › About, beside the iPhone app's, and the landing page's button, under the iPhone app's. */
  app: string;
}

export const PLAY_TEST_COPY: Record<LandingLocale, PlayTestCopy> = {
  en: {
    title: 'Try our Android app',
    early: 'Early',
    pitch: 'Before anyone else. Free, in a minute.',
    getEarly: 'Get it early',
    sheetPitch: 'Before anyone else. Free, about a minute, with your Google account.',
    landingNote: 'Before anyone else, on Google Play',
    steps: [
      { title: 'Join the testers’ group', hint: 'Tap “Join group”, then come back.', action: 'Join' },
      { title: 'Become a tester', hint: 'On Google Play: “Become a tester”.', action: 'Open' },
      { title: 'Install, keep it two weeks', hint: '12 testers for 14 days opens it to all.', action: 'Install' },
    ],
    done: 'done',
    note: 'Needs Android 12 or later. Leave the test any time, on the same Google Play page.',
    notNow: 'Not now',
    never: 'Don’t ask again',
    hidden: 'Hidden for a week',
    neverShow: 'Never show',
    thanks: 'Thanks for testing',
    close: 'Close',
    app: 'Android app',
  },

  de: {
    title: 'Teste unsere Android-App',
    early: 'Vorab',
    pitch: 'Vor allen anderen. Kostenlos, in einer Minute.',
    getEarly: 'Vorab testen',
    sheetPitch: 'Vor allen anderen. Kostenlos, in etwa einer Minute, mit deinem Google-Konto.',
    landingNote: 'Vor allen anderen, auf Google Play',
    steps: [
      { title: 'Der Testgruppe beitreten', hint: 'Mit deinem Google-Konto beitreten, dann zurückkommen.', action: 'Beitreten' },
      { title: 'Tester werden', hint: 'Auf Google Play die Teilnahme am Test bestätigen.', action: 'Öffnen' },
      { title: 'Installieren, zwei Wochen behalten', hint: '12 Tester während 14 Tagen machen sie für alle frei.', action: 'Installieren' },
    ],
    done: 'erledigt',
    note: 'Ab Android 12. Du kannst den Test jederzeit verlassen, auf derselben Seite von Google Play.',
    notNow: 'Nicht jetzt',
    never: 'Nicht mehr fragen',
    hidden: 'Eine Woche ausgeblendet',
    neverShow: 'Nie mehr zeigen',
    thanks: 'Danke fürs Testen',
    close: 'Schliessen',
    app: 'Android-App',
  },

  fr: {
    title: 'Essayez notre app Android',
    early: 'Bêta',
    pitch: 'Avant tout le monde. Gratuit, en une minute.',
    getEarly: 'Tester en avant-première',
    sheetPitch: 'Avant tout le monde. Gratuit, en une minute environ, avec votre compte Google.',
    landingNote: 'Avant tout le monde, sur Google Play',
    steps: [
      { title: 'Rejoindre le groupe des testeurs', hint: 'Rejoignez-le avec votre compte Google, puis revenez.', action: 'Rejoindre' },
      { title: 'Devenir testeur', hint: 'Sur Google Play, acceptez de tester l’app.', action: 'Ouvrir' },
      { title: 'Installer, la garder deux semaines', hint: '12 testeurs pendant 14 jours l’ouvrent à tous.', action: 'Installer' },
    ],
    done: 'fait',
    note: 'Android 12 ou plus récent. Vous pouvez quitter le test à tout moment, sur la même page de Google Play.',
    notNow: 'Pas maintenant',
    never: 'Ne plus demander',
    hidden: 'Masqué pour une semaine',
    neverShow: 'Ne plus afficher',
    thanks: 'Merci de tester',
    close: 'Fermer',
    app: 'App Android',
  },

  it: {
    title: 'Prova la nostra app Android',
    early: 'Beta',
    pitch: 'Prima di tutti. Gratis, in un minuto.',
    getEarly: 'Provala in anteprima',
    sheetPitch: 'Prima di tutti. Gratis, in circa un minuto, con il tuo account Google.',
    landingNote: 'Prima di tutti, su Google Play',
    steps: [
      { title: 'Entra nel gruppo dei tester', hint: 'Unisciti con il tuo account Google, poi torna qui.', action: 'Entra' },
      { title: 'Diventa tester', hint: 'Su Google Play, accetta di provare l’app.', action: 'Apri' },
      { title: 'Installala, tienila due settimane', hint: '12 tester per 14 giorni la aprono a tutti.', action: 'Installa' },
    ],
    done: 'fatto',
    note: 'Serve Android 12 o successivo. Puoi lasciare il test quando vuoi, dalla stessa pagina di Google Play.',
    notNow: 'Non ora',
    never: 'Non chiedere più',
    hidden: 'Nascosto per una settimana',
    neverShow: 'Non mostrare più',
    thanks: 'Grazie di provarla',
    close: 'Chiudi',
    app: 'App per Android',
  },

  nl: {
    title: 'Probeer onze Android-app',
    early: 'Bèta',
    pitch: 'Eerder dan iedereen. Gratis, in een minuut.',
    getEarly: 'Nu al testen',
    sheetPitch: 'Eerder dan iedereen. Gratis, in ongeveer een minuut, met je Google-account.',
    landingNote: 'Eerder dan iedereen, op Google Play',
    steps: [
      { title: 'Word lid van de testgroep', hint: 'Word lid met je Google-account en kom dan terug.', action: 'Lid worden' },
      { title: 'Word tester', hint: 'Bevestig op Google Play dat je wilt testen.', action: 'Openen' },
      { title: 'Installeer, houd hem twee weken', hint: '12 testers gedurende 14 dagen maken hem vrij voor iedereen.', action: 'Installeren' },
    ],
    done: 'klaar',
    note: 'Vanaf Android 12. Je kunt altijd stoppen met testen, op dezelfde pagina van Google Play.',
    notNow: 'Niet nu',
    never: 'Niet meer vragen',
    hidden: 'Een week verborgen',
    neverShow: 'Nooit meer tonen',
    thanks: 'Bedankt voor het testen',
    close: 'Sluiten',
    app: 'Android-app',
  },

  nb: {
    title: 'Prøv Android-appen vår',
    early: 'Beta',
    pitch: 'Før alle andre. Gratis, på et minutt.',
    getEarly: 'Test den tidlig',
    sheetPitch: 'Før alle andre. Gratis, på omtrent et minutt, med Google-kontoen din.',
    landingNote: 'Før alle andre, på Google Play',
    steps: [
      { title: 'Bli med i testgruppen', hint: 'Meld deg inn med Google-kontoen din, og kom så tilbake.', action: 'Bli med' },
      { title: 'Bli tester', hint: 'Bekreft på Google Play at du vil teste.', action: 'Åpne' },
      { title: 'Installer, behold den i to uker', hint: '12 testere i 14 dager åpner den for alle.', action: 'Installer' },
    ],
    done: 'ferdig',
    note: 'Krever Android 12 eller nyere. Du kan forlate testen når som helst, på den samme siden i Google Play.',
    notNow: 'Ikke nå',
    never: 'Ikke spør igjen',
    hidden: 'Skjult i en uke',
    neverShow: 'Vis aldri',
    thanks: 'Takk for at du tester',
    close: 'Lukk',
    app: 'Android-app',
  },

  pt: {
    title: 'Experimente a nossa app Android',
    early: 'Beta',
    pitch: 'Antes de todos. Grátis, num minuto.',
    getEarly: 'Testar já',
    sheetPitch: 'Antes de todos. Grátis, em cerca de um minuto, com a sua conta Google.',
    landingNote: 'Antes de todos, no Google Play',
    steps: [
      { title: 'Aderir ao grupo de testadores', hint: 'Adira com a sua conta Google e depois volte aqui.', action: 'Aderir' },
      { title: 'Tornar-se testador', hint: 'No Google Play, confirme que quer testar.', action: 'Abrir' },
      { title: 'Instalar, manter duas semanas', hint: '12 testadores durante 14 dias abrem-na a todos.', action: 'Instalar' },
    ],
    done: 'feito',
    note: 'Requer Android 12 ou posterior. Pode sair do teste quando quiser, na mesma página do Google Play.',
    notNow: 'Agora não',
    never: 'Não perguntar mais',
    hidden: 'Oculto durante uma semana',
    neverShow: 'Não mostrar mais',
    thanks: 'Obrigado por testar',
    close: 'Fechar',
    app: 'App para Android',
  },

  es: {
    title: 'Prueba nuestra app para Android',
    early: 'Beta',
    pitch: 'Antes que nadie. Gratis, en un minuto.',
    getEarly: 'Probarla ya',
    sheetPitch: 'Antes que nadie. Gratis, en un minuto más o menos, con tu cuenta de Google.',
    landingNote: 'Antes que nadie, en Google Play',
    steps: [
      { title: 'Únete al grupo de probadores', hint: 'Únete con tu cuenta de Google y vuelve aquí.', action: 'Unirme' },
      { title: 'Hazte probador', hint: 'En Google Play, confirma que quieres probarla.', action: 'Abrir' },
      { title: 'Instálala, quédatela dos semanas', hint: '12 probadores durante 14 días la abren a todos.', action: 'Instalar' },
    ],
    done: 'hecho',
    note: 'Necesita Android 12 o posterior. Puedes dejar la prueba cuando quieras, en la misma página de Google Play.',
    notNow: 'Ahora no',
    never: 'No volver a preguntar',
    hidden: 'Oculto durante una semana',
    neverShow: 'No mostrar más',
    thanks: 'Gracias por probarla',
    close: 'Cerrar',
    app: 'App para Android',
  },

  is: {
    title: 'Prófaðu Android-appið okkar',
    early: 'Beta',
    pitch: 'Á undan öllum öðrum. Ókeypis, á einni mínútu.',
    getEarly: 'Prófa strax',
    sheetPitch: 'Á undan öllum öðrum. Ókeypis, á um það bil mínútu, með Google-reikningnum þínum.',
    landingNote: 'Á undan öllum öðrum, á Google Play',
    steps: [
      { title: 'Gakktu í prófunarhópinn', hint: 'Skráðu þig með Google-reikningnum þínum og komdu svo aftur.', action: 'Skrá mig' },
      { title: 'Gerstu prófari', hint: 'Staðfestu á Google Play að þú viljir prófa.', action: 'Opna' },
      { title: 'Settu það upp, haltu því í tvær vikur', hint: '12 prófarar í 14 daga opna það fyrir öllum.', action: 'Setja upp' },
    ],
    done: 'lokið',
    note: 'Þarf Android 12 eða nýrra. Þú getur hætt í prófuninni hvenær sem er, á sömu síðu Google Play.',
    notNow: 'Ekki núna',
    never: 'Ekki spyrja aftur',
    hidden: 'Falið í viku',
    neverShow: 'Aldrei sýna',
    thanks: 'Takk fyrir að prófa',
    close: 'Loka',
    app: 'Android-app',
  },
};
