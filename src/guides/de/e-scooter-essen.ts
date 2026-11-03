import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-essen',
  topic: 'essen',
  name: 'E-Scooter Essen: Anbieter, Regeln, Parken',
  title: 'E-Scooter Essen 2026: Anbieter, Regeln, Abstellflächen',
  description: 'E-Scooter Essen: fünf Anbieter, wo du in der Innenstadt parkst, welche Stadtteile folgen und warum Scooter nicht in Bus und Bahn der Ruhrbahn dürfen.',
  headline: 'E-Scooter Essen: Anbieter, Abstellflächen, Sperrzonen und was in der Ruhrbahn gilt',
  lede: 'Einen E-Scooter in Essen leihst du ohne Führerschein bei Dott, Bolt, Lime, Voi oder Ryde. Was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. In der Innenstadt beendest du die Fahrt seit Anfang 2026 nur auf einer der 54 gekennzeichneten Parkflächen, sonst läuft die Miete weiter. In Bussen und Bahnen der Ruhrbahn ist die Mitnahme von E-Scootern seit dem 1. März 2024 untersagt.',
  published: '2026-10-17',
  updated: '2026-10-26',
  city: 'de:Essen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Essen?',
      blocks: [
        'Mindestens fünf Anbieter vermieten 2026 E-Scooter in Essen: **Dott** (früher TIER), **Bolt**, **Lime**, **Voi** und **Ryde** aus Norwegen. Dott, Bolt und Lime gaben Radio Essen im Oktober 2026 Auskunft, Voi war im Januar 2026 beim Parktest des Senders dabei. Ryde fährt laut Radio Bochum spätestens seit Juni 2026 auch in Essen.',
        'Radio Essen sprach im Januar 2026 von rund 3800 Leih-Scootern, im Oktober 2026 von mehr als 2000.',
        'Gemietet wird in der App des Anbieters; dort siehst du vor dem Entsperren auch den Preis. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz nach 15 Uhr zeigte die [Karte von Essen](map:de:Essen) rund 400 Dott- und 1250 Voi-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntagvormittag, 25. Oktober, rund 1650 Lime-Scooter nach der letzten Zählung.',
      ],
    },
    {
      heading: 'E-Scooter in Essen parken: Abstellflächen in der Innenstadt',
      blocks: [
        'Seit Anfang 2026 endet eine Fahrt mit dem Leih-Scooter in der Innenstadt laut Radio Essen nur noch auf einer der 54 gekennzeichneten Parkflächen rund um die Innenstadt. Du erkennst sie an blauen Schildern und weissen Linien am Boden.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du neben statt auf der Abstellfläche, und die Miete läuft weiter. Laut Stadt lässt die GPS-Ungenauigkeit etwas Spielraum; im Test von Radio Essen (Januar 2026) klappte es im Umkreis von rund 20 m, weiter weg meist nicht mehr.',
        },
        'Weitere Stadtteile folgen laut Radio Essen (Oktober 2026) nach und nach: in diesem Herbst Holsterhausen und Frohnhausen, danach Südviertel, Rüttenscheid und Huttrop, dann Altendorf, Altenessen-Süd, Steele und Kray und zuletzt die Stadtteilzentren von Borbeck, Bochold, Stoppenberg und Freisenbruch.',
        'Ausserhalb der Innenstadt stellst du den Scooter bis dahin frei ab: laut Stadt am Fahrbahnrand, am Rand des Gehwegs oder neben Fahrradständern, mit mindestens 2 m freiem Gehweg. Nicht erlaubt sind Radwege, der Platz vor Ein- und Ausfahrten und die Fahrradständer selbst.',
        'Wer die Regeln missachtet, riskiert laut Dott «Strafzahlungen bis hin zu Kontosperrungen» (gegenüber Radio Essen, Oktober 2026). Störende Scooter meldest du über scooter-melder.de, auf das auch die Stadt verweist.',
      ],
    },
    {
      heading: 'Wo darf man in Essen mit dem E-Scooter fahren? Sperrzonen',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, laut Stadt auch mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. In den Fussgängerzonen der Innenstadt, etwa auf der Kettwiger und der Limbecker Strasse, steigst du also ab und schiebst.',
        'Dazu kommen laut Stadt verschiedene Sperrzonen für E-Scooter im Stadtgebiet; wo sie liegen, zeigt dir die App des Anbieters.',
        'Einen Antrag, Leih-Scooter in Fussgängerzonen wie der Kettwiger Strasse per Geofencing zu stoppen und an Schulen, Kitas und Bahnhöfen auf 6 km/h zu drosseln, lehnte der Rat laut Radio Essen am 16. September 2026 ab. Rechtlich sei das nicht möglich, sagen auch Dott, Lime und Bolt. Fussgängerzonen und Sperrzonen einzuhalten, liegt also bei dir. Eine nächtliche Sperrzeit nennt die Stadt nicht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Essen: Bussgelder und Alkohol',
      blocks: [
        'In Essen gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Was bei der Ruhrbahn gilt',
      blocks: [
        'Seit dem 1. März 2024 nimmt die Ruhrbahn in Bus, Strassenbahn und U-Bahn in Essen und Mülheim keine E-Scooter mehr mit. Grund ist die Brandgefahr der Akkus: «Bis es eindeutige Sicherheitsstandards gibt, ist die Mitnahme von E-Tretrollern untersagt.» Eine Ausnahme für zusammengeklappte Scooter nennt die Ruhrbahn nicht. Pedelecs und Elektro-Rollstühle sind nicht betroffen. Anders lautende Angaben in der FAQ der Stadt von 2020 sind überholt.',
        'Ob ein eigener E-Scooter in S-Bahn und Regionalzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach. In U-Bahn und Strassenbahn der Ruhrbahn darf er nicht mit, auch zusammengeklappt nicht.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters. Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, auch online über mobil.nrw.',
      ],
    },
    {
      heading: 'Mülheim und Bochum: E-Scooter in den Nachbarstädten',
      blocks: [
        'Auch in den Nachbarstädten fährst du Leih-Scooter, mit eigenen Regeln:',
        {
          list: [
            '**Mülheim an der Ruhr:** Leih-Scooter seit März 2021, laut Ruhrbahn im Juli 2026 unter anderem von Dott. Die Stadt erlaubt höchstens 1000 Scooter insgesamt. Im Zentrum und in den Stadtteilzentren mietest du nur an Stationen und gibst dort auch zurück; in Sperrzonen wie der MüGa beendest du keine Fahrt. Mehr dazu in [E-Scooter in Mülheim an der Ruhr](guide:muelheim).',
            '**Bochum:** Dort startete laut Radio Bochum am 1. Juni 2026 auch Ryde. Mehr dazu in [E-Scooter in Bochum](guide:bochum).',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Essen',
      blocks: [
        {
          list: [
            '**Ohne Erlaubnis kein Verleih:** Seit einem Beschluss des Oberverwaltungsgerichts Münster vom November 2020 gilt das Aufstellen von Leih-Scootern in NRW als Sondernutzung der Strasse. Essen verlangt dafür seit einem Ratsbeschluss vom Juni 2023 (Vorlage 0818/2023/6) 5 € pro Scooter und Monat, Mülheim 30 € im Jahr.',
            '**Feuer im Tunnel:** Die Ruhrbahn begründet ihr Verbot mit E-Scootern, die sich in U-Bahnen in Barcelona und London selbst entzündet hatten.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Essen nutzen?',
      answer: 'Die von Dott, Bolt, Lime, Voi und Ryde (Stand 2026). Einen Führerschein brauchst du nicht; ab welchem Alter du mieten darfst und was die Fahrt kostet, zeigt dir die App. Freie Scooter zeigt auch die [Live-Karte von Essen](map:de:Essen).',
    },
    {
      question: 'Wo melde ich einen falsch abgestellten E-Scooter in Essen?',
      answer: 'Beim Anbieter, am einfachsten über scooter-melder.de, auf das auch die Stadt verweist. So kann der Anbieter den Scooter umstellen lassen.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Essener Innenstadt nicht beenden?',
      answer: 'Seit Anfang 2026 endet eine Fahrt mit dem Leih-Scooter in der Innenstadt nur auf einer der 54 gekennzeichneten Parkflächen mit blauem Schild und weissen Linien am Boden. Sonst läuft die Miete weiter: Schieb den Scooter zur nächsten Fläche, die die App zeigt.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus, Strassenbahn oder U-Bahn mitnehmen?',
      answer: 'Nicht bei der Ruhrbahn: Seit dem 1. März 2024 ist die Mitnahme von E-Scootern in ihren Bussen und Bahnen in Essen und Mülheim untersagt, eine Ausnahme für zusammengeklappte nennt sie nicht. Ob ein eigener Scooter in S-Bahn oder Regionalzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Essener Fussgängerzone fahren?',
      answer: 'Nein, laut Stadt auch nicht mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Auf der Kettwiger und der Limbecker Strasse steigst du also ab und schiebst.',
    },
  ],
  sources: [
    { title: 'Stadt Essen: Mobil in Essen, unterwegs mit dem E-Scooter', url: 'https://www.essen.de/leben/mobilitaet/escooter_in_essen.de.html' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Ruhrbahn: Ab 1. März keine E-Tretroller mehr in Bus und Bahn (23. Februar 2024)', url: 'https://www.ruhrbahn.de/essen/aktuelles/meldung/ab-1-maerz-keine-e-tretroller-mehr-in-bus-und-bahn' },
    { title: 'Radio Essen: Leih-E-Scooter in Essen, wie gut funktionieren die Parkzonen? (13. Oktober 2026)', url: 'https://www.radioessen.de/artikel/leih-e-scooter-in-essen-wie-gut-funktionieren-die-parkzonen-2765055' },
    { title: 'Radio Essen: E-Scooter-Parkplätze in Essen im Test (30. Januar 2026)', url: 'https://www.radioessen.de/artikel/e-scooter-parkplaetze-in-essen-im-test-2558688' },
    { title: 'Radio Bochum: Neuer E-Scooter-Anbieter in Bochum gestartet (16. Juni 2026)', url: 'https://www.radiobochum.de/artikel/neuer-e-scooter-anbieter-in-bochum-gestartet-2670400' },
    { title: 'Stadt Mülheim an der Ruhr: E-Scooter-Sharing', url: 'https://cms.muelheim-ruhr.de/rathaus/aemter-und-einrichtungen/ordnungsamt/strassenverkehrsbehoerde/sondernutzung-oeffentlicher/e' },
  ],
};

export default guide;
