import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-essen',
  topic: 'essen',
  name: 'E-Scooter Essen: Anbieter, Preise, Parken',
  title: 'E-Scooter Essen 2026: Anbieter, Preise, Abstellflächen',
  description: 'E-Scooter Essen: fünf Anbieter, was zehn Minuten bei Dott kosten, wo du in der Innenstadt die Fahrt beendest und warum Scooter nicht in die Ruhrbahn dürfen.',
  headline: 'E-Scooter Essen: Anbieter, Preise, Abstellflächen, Sperrzonen und was in der Ruhrbahn gilt',
  lede: 'Einen E-Scooter in Essen leihst du ohne Führerschein bei Dott, Bolt, Lime, Voi oder Ryde, bei Dott, Bolt und Ryde laut deren AGB ab 18. Zehn Minuten kosten bei Dott laut Datenfeed 3,50 € (Stand November 2026); die anderen zeigen ihren Preis in der App. In der Innenstadt beendest du die Fahrt seit dem 1. Januar 2026 nur auf einer der rund 54 markierten Abstellflächen, sonst läuft die Miete weiter. In Bussen und Bahnen der Ruhrbahn ist die Mitnahme von E-Scootern seit dem 1. März 2024 untersagt.',
  published: '2026-10-17',
  updated: '2026-10-26',
  city: 'de:Essen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Essen?',
      blocks: [
        'Mindestens fünf Anbieter vermieten 2026 E-Scooter in Essen: **Dott** (früher TIER), **Bolt**, **Lime**, **Voi** und **Ryde** aus Norwegen. Dott, Bolt und Lime gaben Radio Essen im Oktober 2026 Auskunft, Voi war im Januar 2026 beim Parktest des Senders dabei. Dott und Ryde führen Essen auf ihren Websites (Stand November 2026). Ryde fährt laut Radio Bochum spätestens seit Juni 2026 auch in Essen. Im Dezember 2024 nannte die Stadt als Anbieter noch **Ridemovi** mit 400 Scootern.',
        'Ende 2024 waren laut Stadt 3100 Leih-Scooter zugelassen, im November 2025 knapp 3800. Radio Essen sprach im Oktober 2026 von mehr als 2000.',
        'Gemietet wird in der App des Anbieters. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz nach 15 Uhr zeigte die [Karte von Essen](map:de:Essen) rund 400 Dott- und 1250 Voi-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntagvormittag, 25. Oktober, rund 1650 Lime-Scooter nach der letzten Zählung.',
        'Im Süden endet Dotts Gebiet laut Datenfeed auf Höhe der Messe; Bredeney, Werden, Kettwig und der Baldeneysee liegen ausserhalb.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Essen?',
      blocks: [
        'Dott verlangt in Essen laut seinem Datenfeed 1 € fürs Entsperren und 0,25 € pro Minute: Zehn Minuten kosten 3,50 €, zwanzig 6,00 € (Stand November 2026).',
        'Bei Bolt, Lime, Voi und Ryde siehst du den Essener Preis in der App. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'E-Scooter in Essen parken: Abstellflächen in der Innenstadt',
      blocks: [
        'Seit dem 1. Januar 2026 endet eine Fahrt mit dem Leih-Scooter in der Innenstadt nur noch auf einer markierten Abstellfläche. Das gilt im Stadtkern und in angrenzenden Teilen von Nord-, West-, Ost- und Südviertel, auf rund 54 Flächen. Du erkennst sie am blauen Schild «Parken» mit Zusatzzeichen für E-Scooter und an weissen Eckmarkierungen am Boden.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du neben statt auf der Abstellfläche, und die Miete läuft weiter. Laut Stadt lässt die GPS-Ungenauigkeit etwas Spielraum; im Test von Radio Essen (Januar 2026) klappte es im Umkreis von rund 20 m, weiter weg meist nicht mehr.',
        },
        'Die übrigen Stadtteile folgen in Phasen. Die Pflicht gilt dort jeweils erst, wenn alle Flächen der Phase stehen.',
        {
          table: {
            caption: 'Abstellflächen für Leih-Scooter in Essen: die fünf Phasen (laut Stadt und Radio Essen, Stand Oktober 2026)',
            head: ['Phase', 'Stadtteile', 'Stand'],
            rows: [
              ['1', 'Stadtkern, angrenzende Teile von Nord-, West-, Ost- und Südviertel', 'Seit 1. Januar 2026 verbindlich, rund 54 Flächen'],
              ['2', 'Holsterhausen, Frohnhausen', 'Laut Radio Essen für Herbst 2026 angekündigt'],
              ['3', 'Südviertel, Rüttenscheid, Huttrop', 'Danach'],
              ['4', 'Altendorf, Altenessen-Süd, Steele, Kray', 'Später'],
              ['5', 'Zentren von Borbeck, Bochold, Stoppenberg, Freisenbruch', 'Zuletzt'],
            ],
          },
        },
        'Ausserhalb der Innenstadt stellst du den Scooter bis dahin frei ab: laut Stadt am Fahrbahnrand, am Rand des Gehwegs oder neben Fahrradständern, mit mindestens 2 m freiem Gehweg. Nicht erlaubt sind Radwege, der Platz vor Ein- und Ausfahrten und die Fahrradständer selbst.',
        'Wer die Regeln missachtet, riskiert laut Dott «Strafzahlungen bis hin zu Kontosperrungen» (gegenüber Radio Essen, Oktober 2026). Störende Scooter meldest du über scooter-melder.de, auf das auch die Stadt verweist.',
      ],
    },
    {
      heading: 'Wo darf man in Essen mit dem E-Scooter fahren? Sperrzonen',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, laut Stadt auch mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. In den Fussgängerzonen der Innenstadt, etwa auf der Kettwiger und der Limbecker Strasse, steigst du also ab und schiebst.',
        'Dazu kommen Sperrzonen, in denen E-Scooter laut Stadt nicht fahren dürfen. Ihre Liste (Stand Oktober 2021) nennt:',
        {
          list: [
            'Strassen und Plätze im Stadtkern, darunter Kettwiger Strasse, Limbecker Strasse, Burgplatz und Viehofer Strasse;',
            'Marktplätze in Stadtteilen wie Altenessen, Borbeck und Kupferdreh;',
            'Strassen und Plätze in Steele und Werden;',
            'das Umfeld des Baldeneysees und die gesamte Ruhr samt Kettwiger Stausee;',
            'alle Grünanlagen und Parks, alle Friedhöfe, Waldflächen und Brücken.',
          ],
        },
        'Bei Dott kannst du die Fahrt laut Datenfeed ausserdem im Stadtgarten und rund um den S-Bahnhof Steele nicht beenden.',
        'Einen Antrag, Leih-Scooter in Fussgängerzonen wie der Kettwiger Strasse per Geofencing zu stoppen und an Schulen, Kitas und Bahnhöfen auf 6 km/h zu drosseln, lehnte der Rat am 16. September 2026 ab. Laut Stadt lässt das Kraftfahrt-Bundesamt solche Sperren bisher nicht zu; rechtlich sei das nicht möglich, sagen auch Dott, Lime und Bolt. Fussgängerzonen und Sperrzonen einzuhalten, liegt also bei dir.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Essen: Bussgelder und Alkohol',
      blocks: [
        'In Essen gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter bei Dott, Bolt und Ryde ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'E-Scooter in Bus und Bahn: Was bei Ruhrbahn und VRR gilt',
      blocks: [
        'Seit dem 1. März 2024 nimmt die Ruhrbahn in Bus, Strassenbahn und U-Bahn in Essen und Mülheim keine E-Scooter mehr mit. Grund ist die Brandgefahr der Akkus: «Bis es eindeutige Sicherheitsstandards gibt, ist die Mitnahme von E-Tretrollern untersagt.» Eine Ausnahme für zusammengeklappte Scooter nennt die Ruhrbahn nicht. Pedelecs und Elektro-Rollstühle sind nicht betroffen. Anders lautende Angaben in der FAQ der Stadt von 2020 sind überholt.',
        'In S-Bahn und Regionalzug zählt dein zusammengeklappter Scooter laut VRR als Handgepäck, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen (Stand Juli 2026). Am Hauptbahnhof heisst das: Leih-Scooter auf einer Abstellfläche abstellen, den eigenen zusammenklappen und damit höchstens in den Zug, nicht in die U-Bahn.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters. Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, auch online über mobil.nrw.',
      ],
    },
    {
      heading: 'Hauptbahnhof, Messe, Hafenstrasse: Tipps für Essen',
      blocks: [
        '**Hauptbahnhof:** Er liegt mitten in der Zone mit Abstellpflicht; Flächen gibt es laut Dott-Feed am Europaplatz, an der Freiheit und am Willy-Brandt-Platz.',
        '**Messe und Grugahalle:** Zur SPIEL, das nächste Mal vom 21. bis 24. Oktober 2027, wird es voll. Das Dott-Gebiet endet laut Feed rund 100 m vor Messe und Grugahalle, auf Höhe der Haltestelle Messe Ost/Gruga. Beende die Fahrt vorher und geh das letzte Stück.',
        '**Stadion an der Hafenstrasse:** Das Dott-Gebiet endet laut Feed rund 200 m vor dem Stadion von Rot-Weiss Essen.',
        '**Zeche Zollverein und Baldeneysee:** Beide liegen rund 2 km ausserhalb des Dott-Gebiets; am See gilt zudem die Sperrzone der Stadt. Ob andere Anbieter dorthin fahren, zeigen ihre Apps.',
        '**Rüttenscheid:** Die Rü und der Rüttenscheider Stern liegen im Dott-Gebiet. Städtische Abstellflächen kommen hier erst mit Phase 3; Dott führt am Stern schon eine eigene Abstellzone.',
      ],
    },
    {
      heading: 'Mülheim und Bochum: E-Scooter in den Nachbarstädten',
      blocks: [
        'Die Zentren von Mülheim, Oberhausen, Gelsenkirchen und Bochum liegen ausserhalb des Dott-Gebiets von Essen. Mit Dott beendest du die Fahrt also in Essen und mietest drüben neu, falls es dort Scooter gibt. Dort gelten eigene Regeln:',
        {
          list: [
            '**Mülheim an der Ruhr:** Leih-Scooter seit März 2021, laut Ruhrbahn im Juli 2026 unter anderem von Dott. Die Stadt erlaubt höchstens 1000 Scooter insgesamt. Im Zentrum und in den Stadtteilzentren mietest du nur an Stationen und gibst dort auch zurück; in Sperrzonen wie der MüGa beendest du keine Fahrt. Mehr dazu in [E-Scooter in Mülheim an der Ruhr](guide:muelheim).',
            '**Bochum:** Dort startete laut Radio Bochum am 1. Juni 2026 auch Ryde, nach eigenen Angaben mit rund 900 Scootern. Mehr dazu in [E-Scooter in Bochum](guide:bochum).',
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
            '**Ein Wabenraster für Scooter:** Für die Abstellflächen hat die Stadt Essen ihr Gebiet in 290 Waben von etwa 300 m geteilt. Bis zur nächsten Fläche sollen es höchstens 300 m sein, und jede Fläche soll mindestens 6 Scooter fassen.',
            '**Mehr als die Hälfte:** Bei einer gemeinsamen Kontrolle von Ordnungsamt und Polizei auf der Kettwiger Strasse gingen 37 von 71 Verwarnungen an E-Scooter-Fahrer, der Rest an Radfahrer. Das berichtete die Stadt dem Rechtsausschuss des Rates am 2. September 2026.',
            '**Feuer im Tunnel:** Die Ruhrbahn begründet ihr Verbot mit E-Scootern, die sich in U-Bahnen in Barcelona und London selbst entzündet hatten.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Essen nutzen?',
      answer: 'Die von Dott, Bolt, Lime, Voi und Ryde (Stand 2026). Einen Führerschein brauchst du nicht; Dott, Bolt und Ryde vermieten laut ihren AGB ab 18, bei Lime und Voi zeigt dir die App das Mindestalter. Freie Scooter zeigt auch die [Live-Karte von Essen](map:de:Essen).',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Essen?',
      answer: 'Bei Dott 3,50 €: 1 € fürs Entsperren plus 0,25 € pro Minute, laut Datenfeed (Stand November 2026). Bei Bolt, Lime, Voi und Ryde zeigt dir die App den Preis.',
    },
    {
      question: 'Wo melde ich einen falsch abgestellten E-Scooter in Essen?',
      answer: 'Beim Anbieter, am einfachsten über scooter-melder.de, auf das auch die Stadt verweist. So kann der Anbieter den Scooter umstellen lassen.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Essener Innenstadt nicht beenden?',
      answer: 'Seit dem 1. Januar 2026 endet eine Fahrt mit dem Leih-Scooter im Stadtkern und in den angrenzenden Teilen der Nachbarviertel nur auf einer der rund 54 Abstellflächen mit blauem Parken-Schild und weissen Eckmarkierungen. Sonst läuft die Miete weiter: Schieb den Scooter zur nächsten Fläche, die die App zeigt.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus, Strassenbahn oder U-Bahn mitnehmen?',
      answer: 'Nicht bei der Ruhrbahn: Seit dem 1. März 2024 ist die Mitnahme von E-Scootern in ihren Bussen und Bahnen in Essen und Mülheim untersagt, eine Ausnahme für zusammengeklappte nennt sie nicht. In S-Bahn und Regionalzug darf ein zusammengeklappter Scooter laut VRR als Handgepäck mit, sofern das Verkehrsunternehmen ihn nicht ausschliesst.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Essener Fussgängerzone fahren?',
      answer: 'Nein, laut Stadt auch nicht mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Auf der Kettwiger und der Limbecker Strasse steigst du also ab und schiebst.',
    },
    {
      question: 'Darf ich mit dem Leih-Scooter in den Grugapark oder an den Baldeneysee?',
      answer: 'Nein. Parks und Grünanlagen, das Umfeld des Baldeneysees und die gesamte Ruhr gehören zu den Sperrzonen der Stadt, in denen E-Scooter nicht fahren dürfen.',
    },
  ],
  sources: [
    { title: 'Stadt Essen: Mobil in Essen, unterwegs mit dem E-Scooter', url: 'https://www.essen.de/leben/mobilitaet/escooter_in_essen.de.html' },
    { title: 'Stadt Essen: Sperrzonen für E-Scooter, Liste (Stand 11. Oktober 2021, PDF)', url: 'https://media.essen.de/media/wwwessende/aemter/0115_1/E_Scooter_Sperrzonen_Essen_Liste.pdf' },
    { title: 'Stadt Essen, Vorlage 1791/2024/6: Regelung zum Abstellen von E-Scootern (PDF)', url: 'https://ris.essen.de/sdnetrim/UGhVM0hpd2NXNFdFcExjZe2U9bd3dNfu_UQh29mbOrBDc2tmVdiHN_jdVTD9WQYO/Vorlage_1791-2024-6_2._Nachtrag.pdf' },
    { title: 'Stadt Essen, Vorlage 1814/2025/6: Abstellflächen im Stadtkern und Nordviertel (November 2025, PDF)', url: 'https://ris.essen.de/sdnetrim/UGhVM0hpd2NXNFdFcExjZXl84Y_iPtuGpYewWYoq6COFaS26hXQwrWlBvPYc8oFH/Vorlage_1814-2025-6.pdf' },
    { title: 'Stadt Essen, Vorlage 0818/2023/6: Sondernutzungsgebühr für Leih-E-Scooter (PDF)', url: 'https://ris.essen.de/sdnetrim/UGhVM0hpd2NXNFdFcExjZY8S7awRoMUTaGGcdBsPNgWYrbyIJyI7ObCxndHluzIO/Vorlage_0818-2023-6.pdf' },
    { title: 'Stadt Essen, Vorlage 1016/2026/3: Gefährdung durch E-Scooter auf Gehwegen (Juni 2026, PDF)', url: 'https://ris.essen.de/sdnetrim/UGhVM0hpd2NXNFdFcExjZYD9LJxeVY7kc72Rcy3P_MYBwaoxDvNv8VPgtU1WBalg/Vorlage_1016-2026-3.pdf' },
    { title: 'Rat der Stadt Essen: Beschluss zum Antrag 1268/2026, Geofencing (16. September 2026, PDF)', url: 'https://ris.essen.de/sdnetrim/UGhVM0hpd2NXNFdFcExjZWvXExFJnQere68AKl5EjYLnvUL9Y3nSPwZr0d31vlT3/Beschlusstext_1268-2026-EBB-FDP_-oeffentlich-_Rat_der_Stadt_Essen_16.09.2026.pdf' },
    { title: 'Stadt Essen: Niederschrift des Rechtsausschusses (2. September 2026, PDF)', url: 'https://ris.essen.de/sdnetrim/UGhVM0hpd2NXNFdFcExjZVdgTTLOyWm8oJ4sjNHWJg80b48uRbyFZZhPAZEoYlaQ/Oeffentliche_Niederschrift_Ausschuss_fuer_Recht-_oeffentliche_Sicherheit_und_Ordnung_02.09.2026.pdf' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Ruhrbahn: Ab 1. März keine E-Tretroller mehr in Bus und Bahn (23. Februar 2024)', url: 'https://www.ruhrbahn.de/essen/aktuelles/meldung/ab-1-maerz-keine-e-tretroller-mehr-in-bus-und-bahn' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'Dott: offener Datenfeed für Essen mit Tarif und Zonen (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/essen/gbfs.json' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Allgemeine Geschäftsbedingungen für E-Fahrzeuge', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Ryde: Standorte', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Geschäftsbedingungen Deutschland', url: 'https://www.ryde-technology.com/terms-conditions-germany' },
    { title: 'Radio Essen: Leih-E-Scooter in Essen, wie gut funktionieren die Parkzonen? (13. Oktober 2026)', url: 'https://www.radioessen.de/artikel/leih-e-scooter-in-essen-wie-gut-funktionieren-die-parkzonen-2765055' },
    { title: 'Radio Essen: E-Scooter-Parkplätze in Essen im Test (30. Januar 2026)', url: 'https://www.radioessen.de/artikel/e-scooter-parkplaetze-in-essen-im-test-2558688' },
    { title: 'Radio Bochum: Neuer E-Scooter-Anbieter in Bochum gestartet (16. Juni 2026)', url: 'https://www.radiobochum.de/artikel/neuer-e-scooter-anbieter-in-bochum-gestartet-2670400' },
    { title: 'Stadt Mülheim an der Ruhr: E-Scooter-Sharing', url: 'https://cms.muelheim-ruhr.de/rathaus/aemter-und-einrichtungen/ordnungsamt/strassenverkehrsbehoerde/sondernutzung-oeffentlicher/e' },
    { title: 'SPIEL Essen: 21. bis 24. Oktober 2027', url: 'https://www.spiel-essen.de/de/' },
  ],
};

export default guide;
