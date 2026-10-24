import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-villingen-schwenningen',
  topic: 'villingen-schwenningen',
  name: 'E-Scooter Villingen-Schwenningen: Zeus, Preise, Parken',
  title: 'E-Scooter Villingen-Schwenningen 2026: Preise, Parken',
  description: 'E-Scooter Villingen-Schwenningen: was Zeus pro Minute kostet, wo du in Altstadt, Muslen und Parks fahren und parken darfst und ob der Scooter in den Bus darf.',
  headline: 'E-Scooter Villingen-Schwenningen: Preise, Abstellen in beiden Innenstädten und was in Parks, Bus und Hochschule gilt',
  lede: 'Einen E-Scooter in Villingen-Schwenningen leihst du ab 18 und ohne Führerschein bei Zeus, dem einzigen Anbieter der Doppelstadt. Laut Datenfeed vom 24. Oktober 2026 kostet eine Fahrt 1 € fürs Entsperren und 0,25 € pro Minute, zehn Minuten also 3,50 €. Du fährst auf dem Radweg oder der Fahrbahn, nicht durch die Fussgängerzonen, nicht auf Gehwegen und nicht auf Parkwegen. Abstellen darfst du wie ein Fahrrad; am Münsterplatz, an der Ringanlage um die Villinger Altstadt und in den Parks lässt dich Zeus laut Feed aber keine Fahrt beenden, an beiden Bahnhöfen schon. In Bus und Bahn darf nur ein eigener Scooter.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Villingen-Schwenningen',
  sections: [
    {
      heading: 'Welche E-Scooter gibt es in Villingen-Schwenningen?',
      blocks: [
        'Auf ihrer E-Scooter-Seite nennt die Stadt einen Anbieter: **Zeus**, gebucht über die Zeus-App. Zeus fährt hier seit März 2021, anfangs mit 100 Scootern in einem Pilotprojekt mit der Stadt. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Villingen-Schwenningen](map:de:Villingen-Schwenningen) zeigte am 23. Oktober 2026 um 15:18 Uhr rund 340 Zeus-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Andere Anbieter fanden wir nicht: Im Landesportal MobiData BW hat hier nur Zeus einen Datenfeed, und in den Städtelisten von Bolt und Dott fehlt die Stadt (Stand 24. Oktober 2026).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Villingen-Schwenningen?',
      blocks: [
        'Zeus nennt im Datenfeed für Villingen-Schwenningen fünf Tarife, alle zum selben Preis: 1 € fürs Entsperren und 0,25 € pro Minute (Stand 24. Oktober 2026). Der Tarif, dem alle Scooter im Feed zugeordnet waren, deckelt eine Fahrt bei 42 €.',
        {
          table: {
            caption: 'Zeus-Preise in Villingen-Schwenningen laut Datenfeed vom 24. Oktober 2026',
            head: ['Fahrtdauer', 'Entsperren', 'Minuten', 'Gesamt'],
            rows: [
              ['5 Minuten', '1,00 €', '1,25 €', '2,25 €'],
              ['10 Minuten', '1,00 €', '2,50 €', '3,50 €'],
              ['20 Minuten', '1,00 €', '5,00 €', '6,00 €'],
              ['30 Minuten', '1,00 €', '7,50 €', '8,50 €'],
            ],
          },
        },
        'Im ersten Jahr dauerte eine Fahrt laut Stadt im Schnitt 14 Minuten und war 2,2 km lang; das wären heute 4,50 €. Für die gut 5 km Luftlinie von Bahnhof zu Bahnhof schätzen wir 20 bis 25 Minuten, also 6 bis 7,25 €. Pässe nennt der Feed nicht; verbindlich ist der Preis in der App vor dem Entsperren.',
      ],
    },
    {
      heading: 'Wo darfst du in Villingen-Schwenningen mit dem E-Scooter fahren?',
      blocks: [
        'So fasste die Stadt die Regeln 2021 zusammen, dazu kommen ihre Verordnungen und Satzungen:',
        {
          list: [
            '**Radweg nehmen:** Radwege, Radfahrstreifen, Fahrradstrassen und gemeinsame Geh- und Radwege. Nur wo es nichts davon gibt, fährst du auf der Fahrbahn.',
            '**Keine Fussgängerzone:** Fahren darfst du dort nur, wo ein Zusatzschild E-Scooter zulässt. 2022 schrieb die Stadt dazu: «Dieses Zusatzzeichen gibt es in Villingen und Schwenningen derzeit nicht.» Zur Fussgängerzone zählt auch der Marktplatz am Schwenninger Rathaus.',
            '**Keine Gehwege**, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; «Radverkehr frei» gilt dort bis Ende Februar 2027 nur für Fahrräder. Für Einbahnstrassen, die «Radverkehr frei» in Gegenrichtung öffnet, widersprechen sich bis Ende Februar 2027 Strassenverkehrs-Ordnung und E-Scooter-Verordnung; eindeutig erlaubt ist das Fahren gegen die Einbahnrichtung erst ab 1. März 2027.',
            '**Keine Parkwege:** Polizeiverordnung (2021) und Benutzungsordnung für Grünanlagen (2023) der Stadt verbieten, Parkwege und Rasen in öffentlichen Grünanlagen mit Kraftfahrzeugen oder Fahrrädern zu befahren oder dort abzustellen; ein E-Scooter ist ein Kraftfahrzeug. Als Parks nennt die Stadt etwa die Ringanlagen um die Villinger Altstadt, das Hubenloch, den Mauthepark und die Möglingshöhe.',
            '**Kein Markt:** Auf dem Wochenmarkt, auf dem Münsterplatz und in der Schwenninger Muslen, ist Fahrrad- und E-Scooter-Fahren verboten, mit Bussgeld bis 1.000 €. Markt ist samstags und von der Karwoche bis Dezember auch mittwochs, meist von 6:30 bis 12:45 Uhr.',
          ],
        },
        'Laut OpenStreetMap sind Obere und Niedere Strasse, Riet- und Bickenstrasse in Villingen für Radfahrende freigegeben. Ab 1. März 2027 gilt «Radverkehr frei» auch für E-Scooter: Dort fährst du dann im Schritttempo, sofern die Stadt E-Scooter nicht eigens ausschliesst. Massgeblich ist das Schild vor Ort.',
        'So lesen wir den Zeus-Feed vom 24. Oktober 2026: Zwischen den Stadtbezirken sind die Felder um den Natzentalweg und die Bertholdshöfe sogar fürs Durchfahren gesperrt, die Schwenninger Strasse nicht. Die genauen Grenzen zeigt die App.',
      ],
    },
    {
      heading: 'Wo stellst du einen E-Scooter in Villingen-Schwenningen ab?',
      blocks: [
        'Ausserhalb der Sperrzonen stellst du einen E-Scooter ab wie ein Fahrrad, ohne jemanden zu behindern. Laut Kooperationsvertrag mit der Stadt (2021) bleiben auf dem Gehweg 2 m frei, wo er breit genug ist; umgeworfene Scooter stellt Zeus laut Stadt nach Meldung in der Regel binnen sechs Stunden um. Falsch abgestellte Scooter meldest du direkt Zeus.',
        {
          table: {
            caption: 'Fahrt beenden in Villingen-Schwenningen: unsere Auswertung des Zeus-Feeds vom 24. Oktober 2026 und die Regeln der Stadt',
            head: ['Ort', 'Was gilt', 'Wer das festlegt'],
            rows: [
              ['Münsterplatz (Villingen)', 'Laut Feed kein Fahrtende; an Markttagen Fahrverbot', 'Zeus; Stadt (Wochenmarktsatzung)'],
              ['Übrige Fussgängerzonen, etwa Obere und Niedere Strasse, In der Muslen', 'Fahrverbot; Rückgabe laut Stadt (2022) nicht zulässig, im Feed nicht gesperrt', 'Bund (Fahren); Stadt (Rückgabe)'],
              ['Ringanlagen, Hubenloch, Mauthepark, Bürkpark, Neckarpark, Möglingshöhe', 'Laut Feed kein Fahrtende; auf Parkwegen weder fahren noch abstellen', 'Zeus; Stadt (Polizeiverordnung, Benutzungsordnung)'],
              ['Bahnhof Villingen, Bahnhof und Busbahnhof Schwenningen', 'Fahrtende möglich, in Villingen auf dem Vorplatz, nicht an den Bahnsteigen', 'Zeus'],
              ['Obereschach, Weilersbach, Schwenninger Moos', 'Laut Feed kein Fahrtende', 'Zeus'],
              ['Übrige Stadt', 'Wie ein Fahrrad, 2 m Gehweg bleiben frei', 'Bund (StVO); Stadt und Zeus (Kooperationsvertrag)'],
            ],
          },
        },
        'Laut Stadt war die Rückgabe in den Fussgängerzonen 2022 «nicht zulässig»; ob das noch gilt, sagt sie nicht, und der Feed vom 24. Oktober 2026 sperrt dort nur den Münsterplatz. Hineinfahren darfst du ohnehin nicht: Stell den Scooter etwa am Bahnhof Villingen ab, keine 500 m Luftlinie vom Latschariplatz.',
        {
          note: 'Lässt dich die App nicht abschliessen, stehst du in einer Sperrzone. Schieb den Scooter weiter, aus dem Park auf die nächste Strasse: Bis du die Fahrt beendest, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln und Bussgelder in Villingen-Schwenningen',
      blocks: [
        'Die Verkehrsregeln setzt der Bund, nicht Baden-Württemberg oder die Stadt. E-Scooter fährst du ab 14 ohne Führerschein, bauartbedingt höchstens 20 km/h und immer allein; Leih-Scooter vermietet Zeus erst ab 18. Eine Helmpflicht gibt es nicht; die Stadt empfiehlt den Helm.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Falsch abgestellt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'Unzulässig auf Geh- oder Radweg 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, und der Führerschein ist in der Regel weg; wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar. Unter 21 oder in der Probezeit gilt 0,0.',
        'Seit 1. Oktober 2026 haftet der Halter bei Unfällen auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Mit dem E-Scooter zur HFU, zur DHBW und zum Bahnhof',
      blocks: [
        'Eigene E-Scooter-Regeln fanden wir weder bei der **Hochschule Furtwangen** (HFU) noch bei der **DHBW**. Der HFU-Campus Schwenningen in der Jakob-Kienzle-Strasse liegt laut Hochschule wenige Meter vom Bahnhof Schwenningen. Laut Feed lässt Zeus dort an allen Gebäuden, auch an Bibliothek und Mensa, das Fahrtende zu, an der DHBW in der Friedrich-Ebert-Strasse fast überall.',
        'Die **Bahnhöfe** sind die wichtigsten Startpunkte: Im ersten Jahr begannen laut Stadt rund 35.000 Fahrten nahe einer Bus- oder Bahnhaltestelle, rund 6.000 allein am Bahnhof Villingen. Dort beendest du die Fahrt laut Feed auf dem Vorplatz, nicht an den Bahnsteigen und nicht im Grünzug an der Brigach. In Schwenningen geht es am Bahnhof und am Busbahnhof, ausserdem am Schwarzwald-Baar-Klinikum.',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: StadtBus, SBG und Ringzug im Move-Verbund',
      blocks: [
        'Für StadtBus, SBG SüdbadenBus, Ringzug und Regionalzüge gelten die Beförderungsbedingungen des Verkehrsverbunds Move (Stand 1. April 2026): Ein E-Scooter wird «zusammengeklappt wie Handgepäck, ansonsten wie Fahrräder behandelt».',
        {
          list: [
            '**Zusammengeklappt** fährt dein eigener Scooter kostenlos als Handgepäck mit.',
            '**Aufgeklappt** brauchst du für ihn ein FahrradTicket für 5,20 € pro Fahrt. In Zügen fährt er montags bis freitags vor 6 und ab 9 Uhr kostenlos mit, am Wochenende und an Feiertagen ganztägig.',
            '**Einen Anspruch** auf Mitnahme hast du nicht, das Personal entscheidet; den Akku darfst du an Bord weder herausnehmen noch laden. Im Ringzug sind an Schultagen einzelne Züge morgens und mittags auf manchen Abschnitten für Fahrräder gesperrt.',
          ],
        },
        'Einen **Leih-Scooter** nimmst du nicht mit: Laut Verbraucherzentrale werden Leih-Scooter nicht im Nahverkehr befördert. Beende die Fahrt am Bahnhof und miete am Ziel neu.',
      ],
    },
    {
      heading: 'Wie Villingen-Schwenningen E-Scooter regelt: Kooperationsvertrag mit Zeus',
      blocks: [
        'Zeus startete im März 2021 mit einem **Kooperationsvertrag** mit der Stadt: laut Stadt Sammelflächen mit höchstens zehn Scootern, ohne Kosten für die Stadt. 2022 plante die Verwaltung, die Testphase zu verlängern und den Ratsgremien Kriterien für Verträge oder Sondernutzungen zum Beschluss vorzulegen, etwa zu Zahl der Scooter, Gebühren und Abstellflächen.',
        'Im Energiepolitischen Arbeitsprogramm 2023 bis 2026 steht als Massnahme ein Auswahlverfahren mit Sondernutzungssatzung und festen E-Scooter-Parkplätzen; Stand Dezember 2025: «Prozess gestartet». Eine solche Satzung, eine Gebühr oder eine aktuelle Obergrenze fanden wir in den Ratsunterlagen nicht (Stand 24. Oktober 2026). Wie Obergrenze und Gebühr anderswo aussehen, zeigt [Konstanz](guide:konstanz).',
        {
          list: [
            '**Bund:** Verkehrsregeln, Alter, Tempo und Bussgelder. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Stadt kann es dann als Sondernutzung genehmigen.',
            '**Land Baden-Württemberg:** das Strassengesetz für Sondernutzungen; eigene Landesregeln für Leih-Scooter fanden wir nicht.',
            '**Stadt Villingen-Schwenningen:** Kooperationsvertrag mit Zeus, Fahrverbot auf Parkwegen und auf dem Wochenmarkt.',
            '**Zeus:** Preis, Geschäftsgebiet und Sperrzonen in App und Feed.',
            '**Move:** die Mitnahme in Bus und Bahn.',
          ],
        },
        'Ein Nachtverbot oder eine Winterpause nennen weder die Stadt noch Zeus; der Feed nennt «24/7». Zeus fährt in der Region auch in [Singen](map:de:Singen) und [Tuttlingen](map:de:Tuttlingen).',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Villingen-Schwenningen',
      blocks: [
        {
          list: [
            '**50.276 Fahrten im ersten Jahr.** So viele nannte die Stadt für die ersten 368 Tage des Pilotprojekts. Knapp ein Drittel fiel auf die Zeit zwischen 16 und 20 Uhr.',
            '**Der Campus in der Uhrenfabrik.** Der 1988 gegründete Campus Schwenningen der HFU liegt auf dem Gelände der ehemaligen Uhrenfabrik Kienzle.',
            '**Am Neckarursprung endet keine Fahrt.** Die historische Neckarquelle liegt im Stadtpark Möglingshöhe hinter dem Schwenninger Bahnhof, auf dem Gelände der Landesgartenschau 2010; von hier fliesst der Neckar laut Stadt 360 km bis in den Rhein. Zeus sperrt den Park laut Feed fürs Fahrtende.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Villingen-Schwenningen?',
      answer: 'Bei Zeus laut Datenfeed vom 24. Oktober 2026 1 € fürs Entsperren und 0,25 € pro Minute: zehn Minuten 3,50 €, zwanzig Minuten 6 €, höchstens 42 € pro Fahrt. Den verbindlichen Preis zeigt die App vor dem Entsperren.',
    },
    {
      question: 'Welche E-Scooter-App brauche ich in Villingen-Schwenningen?',
      answer: 'Die von Zeus, dem einzigen Anbieter, den die Stadt nennt und den die [Live-Karte von Villingen-Schwenningen](map:de:Villingen-Schwenningen) zeigt. Du musst 18 sein, einen Führerschein brauchst du nicht.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Villinger Altstadt fahren?',
      answer: 'Nicht durch die Fussgängerzone: Ein Schild, das E-Scooter zulässt, gab es dort laut Stadt 2022 nicht, und Fahren kostet heute ab 15 €. Ab 1. März 2027 darfst du dort im Schritttempo fahren, wo «Radverkehr frei» steht, sofern die Stadt E-Scooter nicht ausschliesst. Die Strassen rund um die Altstadt nimmst du schon heute.',
    },
    {
      question: 'Wo kann ich in Villingen-Schwenningen keine Fahrt beenden?',
      answer: 'Laut Zeus-Feed vom 24. Oktober 2026 nicht am Münsterplatz, an der Ringanlage um die Villinger Altstadt, in Parks wie Hubenloch, Mauthepark und Möglingshöhe und in Ortsteilen wie Obereschach und Weilersbach. An beiden Bahnhöfen, an der HFU und am Klinikum geht es. Massgeblich ist die App.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus mitnehmen?',
      answer: 'Einen eigenen ja: zusammengeklappt als Handgepäck, sonst wie ein Fahrrad mit FahrradTicket für 5,20 €, und nur, wenn das Personal zustimmt. Einen Leih-Scooter nimmst du laut Verbraucherzentrale nicht mit.',
    },
    {
      question: 'Gibt es in Villingen-Schwenningen ein Nachtverbot für E-Scooter?',
      answer: 'Nein. Weder die Stadt noch Zeus nennen ein Nachtverbot oder eine Winterpause; Zeus gibt im Feed «24/7» an (Stand 24. Oktober 2026).',
    },
  ],
  sources: [
    { title: 'Stadt Villingen-Schwenningen: Mit dem E-Scooter (abgerufen 24. Oktober 2026)', url: 'https://www.villingen-schwenningen.de/verkehr-natur/mobilitaet/mit-dem-e-scooter/' },
    { title: 'Stadt Villingen-Schwenningen: Informationsvorlage E-Scooter-Flotte für Villingen-Schwenningen (29. März 2021)', url: 'https://ris.villingen-schwenningen.de/api.php?document_type_id=4&document_relation_id=82903100762&submission_id=82903100762&id=69&json=1&platform=web&system=ris' },
    { title: 'Stadt Villingen-Schwenningen: Informationsvorlage E-Scooter, Rückschau der Testphase und Ausblick (2. März 2022)', url: 'https://ris.villingen-schwenningen.de/api.php?document_type_id=4&document_relation_id=80302101128&submission_id=80302101128&id=69&json=1&platform=web&system=ris' },
    { title: 'Stadt Villingen-Schwenningen: Sachstandsbericht Energiepolitisches Arbeitsprogramm 2.0 (Technischer Ausschuss, 27. Januar 2026)', url: 'https://ris.villingen-schwenningen.de/api.php?document_type_id=13&document_relation_id=90110100422%7C20260112202734-0.pdf%7C&submission_attachment_id=90110100422%7C20260112202734-0.pdf%7C&id=69&json=1&platform=web&system=ris' },
    { title: 'Stadt Villingen-Schwenningen: Polizeiverordnung (in Kraft seit 1. Oktober 2021)', url: 'https://www.villingen-schwenningen.de/fileadmin/VS/01_Rathaus_Leben/Unsere_Stadt/Bekanntmachungen/2020-2025/2021/29.09.2021_Polizeiverordnung.pdf' },
    { title: 'Stadt Villingen-Schwenningen: Benutzungsordnung Grün- und Erholungsanlagen (24. Mai 2023)', url: 'https://www.villingen-schwenningen.de/fileadmin/VS/01_Rathaus_Leben/Unsere_Stadt/Bekanntmachungen/2020-2025/2023/11.07.2023_Satzung_%C3%BCber_die_Benutzung_der_%C3%B6ffentlichen_Gr%C3%BCn-_und_Erholungsanlagen_im_Stadtgebiet_Villingen-Schwenningen_mit_Anlage.pdf' },
    { title: 'Stadt Villingen-Schwenningen: Wochenmarktsatzung (in Kraft seit 1. Januar 2025)', url: 'https://www.villingen-schwenningen.de/fileadmin/VS/01_Rathaus_Leben/Unsere_Stadt/Ortsrecht/2025/20.12.2024_Amtliche_Bekanntmachung_Wochenmarktsatzung.pdf' },
    { title: 'Stadt Villingen-Schwenningen: Zu Fuss, Fussgängerzonen', url: 'https://www.villingen-schwenningen.de/verkehr-natur/mobilitaet/zu-fuss/' },
    { title: 'Stadt Villingen-Schwenningen: Park- und Grünanlagen', url: 'https://www.villingen-schwenningen.de/tourismus-freizeit/freizeit-erholung/park-und-gruenanlagen/' },
    { title: 'Stadt Villingen-Schwenningen: Stadtbezirk Schwenningen', url: 'https://www.villingen-schwenningen.de/tourismus-erleben/vs-erleben/stadtbezirk-schwenningen/' },
    { title: 'Stadt Villingen-Schwenningen: Bahnhofsareal Schwenningen', url: 'https://www.villingen-schwenningen.de/tourismus-erleben/vs-erleben/stadtbezirk-schwenningen/bahnhofsareal/' },
    { title: 'MobiData BW: Datenfeed von Zeus in Villingen-Schwenningen (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_villingen_schwenningen/gbfs' },
    { title: 'MobiData BW: Zonen von Zeus in Villingen-Schwenningen (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_villingen_schwenningen/geofencing_zones' },
    { title: 'MobiData BW: Verzeichnis der Sharing-Datenfeeds', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'Bolt: Städte in Deutschland', url: 'https://bolt.eu/de-de/cities/' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Move: Beförderungsbedingungen (ab 1. April 2026)', url: 'https://mein-move.de/wp-content/uploads/2026/03/20260401_BB_Move.pdf' },
    { title: 'Move: Tarifbestimmungen (ab 1. April 2026)', url: 'https://mein-move.de/wp-content/uploads/2026/03/20260401_TB_Move.pdf' },
    { title: 'Verbraucherzentrale: E-Scooter, diese Regeln gelten (Stand 15. April 2026)', url: 'https://www.verbraucherzentrale.de/wissen/energie/emobilitaet/escooter-diese-regeln-gelten-fuer-elektrotretroller-35716' },
    { title: 'Hochschule Furtwangen: Standorte und Anfahrt', url: 'https://www.hs-furtwangen.de/warum-hfu/standorte-anfahrt' },
    { title: 'DHBW Villingen-Schwenningen: Anfahrt', url: 'https://www.dhbw-vs.de/en/university/contact/how-to-find-us.html' },
    { title: 'OpenStreetMap', url: 'https://www.openstreetmap.org/' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2 (Verkehrszeichen)', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'Bussgeldkatalog-Verordnung (BKatV)', url: 'https://www.gesetze-im-internet.de/bkatv_2013/BJNR049800013.html' },
    { title: 'Bundesgesetzblatt 2026 I Nr. 32: Änderung der StVO und der eKFV', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesverkehrsministerium: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
  ],
};

export default guide;
