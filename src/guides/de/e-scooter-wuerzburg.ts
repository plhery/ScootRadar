import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wuerzburg',
  topic: 'wuerzburg',
  name: 'E-Scooter Würzburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Würzburg 2026: Preise, Parken, Altstadt',
  description: 'E-Scooter Würzburg: was Zeus pro Minute kostet, wo du in Altstadt, am Main und an der Residenz nicht fahren oder parken darfst und ob er in die Tram darf.',
  headline: 'E-Scooter Würzburg: Preise, Fahrverbot in der Fussgängerzone und was an Main, Residenz und Uni gilt',
  lede: 'Einen E-Scooter in Würzburg leihst du ab 18 und ohne Führerschein; unsere Karte zeigt Zeus und Voi. Laut Datenfeed kostete eine Zeus-Fahrt am Abend des 23. Oktober 2026 1 € fürs Entsperren und 0,25 € pro Minute, zehn Minuten also 3,50 €. Du fährst auf dem Radweg oder der Fahrbahn, nie durch die Fussgängerzone der Altstadt, über die Alte Mainbrücke, auf Gehwegen oder auf Wegen in Parks. Abstellen darfst du wie ein Fahrrad, aber nicht in der Fussgängerzone, in Grünanlagen und an Haltestellen; Zeus lässt dich zudem am Mainufer, am Residenzplatz und im Hofgarten keine Fahrt beenden. In Bus und Strassenbahn darf kein E-Scooter mit.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Würzburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Würzburg?',
      blocks: [
        'Auf ihrer undatierten E-Scooter-Seite nennt die Stadt zwei Anbieter, die ihre Selbstverpflichtung unterschrieben haben: **Zeus** und **Voi**. Voi meldete seinen Start in Würzburg zum 28. März 2025. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Würzburg](map:de:Würzburg) zeigt Zeus und seit dem 24. Oktober 2026 auch Voi: An jenem Samstag kurz vor 16 Uhr waren es rund 170 Zeus- und 230 Voi-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'Im November 2025 meldete ein Stadtrat Beschwerden über herumstehende Roller eines insolventen Anbieters. Im März und April 2026 sagte Bürgermeisterin Vorlová, die ungenutzten grünen Roller würden nach und nach weggeräumt, von einer anderen Firma als dem Anbieter.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Würzburg?',
      blocks: [
        'Zeus nennt im Datenfeed für Würzburg fünf Tarife, die am Abend des 23. Oktober 2026 alle gleich viel kosteten: 1 € fürs Entsperren und 0,25 € pro Minute. Für den Tarif, auf dem alle Scooter im Feed liefen, nennt er einen Höchstpreis von 42 € pro Fahrt.',
        {
          table: {
            caption: 'Zeus-Preise in Würzburg laut Datenfeed vom 23. Oktober 2026',
            head: ['Fahrtdauer', 'Entsperren', 'Minuten', 'Gesamt'],
            rows: [
              ['5 Minuten', '1,00 €', '1,25 €', '2,25 €'],
              ['10 Minuten', '1,00 €', '2,50 €', '3,50 €'],
              ['20 Minuten', '1,00 €', '5,00 €', '6,00 €'],
              ['30 Minuten', '1,00 €', '7,50 €', '8,50 €'],
            ],
          },
        },
        'Vom Hauptbahnhof zur Residenz ist es gut 1 km, zur Mensa am Hubland rund 4 km: Rechne grob mit 5 und 15 Minuten. Ob Zeus in Würzburg Pässe oder Rabatte anbietet, steht nicht im Feed. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Preise von Voi konnten wir nicht prüfen.',
      ],
    },
    {
      heading: 'Wo darfst du in Würzburg mit dem E-Scooter fahren?',
      blocks: [
        'So fasst die Stadt das Bundesrecht zusammen, ergänzt um ihre Fahrverbotszonen und den Hofgarten:',
        {
          list: [
            '**Radweg nehmen**, wo es einen gibt, auch wenn er für Radfahrer nicht vorgeschrieben ist und nur ein Fahrrad-Piktogramm trägt. Schutzstreifen auf der Fahrbahn nutzt du ebenfalls, sonst fährst du auf der Fahrbahn.',
            '**Keine Fussgängerzone**, und dazu zählt in Würzburg die **Alte Mainbrücke**: Beide hat die Stadt für E-Scooter nicht freigegeben. Das Schild «Elektrokleinstfahrzeuge frei» hängt laut Stadt bisher nirgends in Würzburg.',
            '**Keine Gehwege** und keine Fusswege in Grünanlagen, auch nicht mit «Fahrrad frei»: Das gilt bis Ende Februar 2027 nur für Fahrräder. Gemeinsame Geh- und Radwege mit blauem Schild nimmst du dagegen.',
            '**Kein Hofgarten:** Die Bayerische Schlösserverwaltung verbietet in Hofgarten und Rosenbachpark, «Wege mit dem Fahrrad oder sonstigen Fahrzeugen – ausgenommen Krankenrollstühle und Kinderwagen – zu befahren» (Anlagenvorschriften vom 3. März 2026). Offen ist der Hofgarten laut Residenz täglich bis zum Einbruch der Dunkelheit, längstens bis 20 Uhr.',
            '**Einbahnstrassen**, die für Radfahrer in Gegenrichtung freigegeben sind, darfst du laut Stadt und Strassenverkehrs-Ordnung auch mit dem E-Scooter in beide Richtungen fahren. Die E-Scooter-Verordnung verlangt dafür bis Ende Februar 2027 allerdings das Schild «Elektrokleinstfahrzeuge frei»; ab 1. März 2027 ist es eindeutig erlaubt.',
          ],
        },
        'Zeus setzt das Fahrverbot technisch um: Laut Datenfeed darfst du mit einem Zeus-Scooter durch den Kern der Fussgängerzone nicht einmal durchfahren. Die Zone reicht vom Marktplatz und Unteren Markt über Schmalzmarkt, Domstrasse, Schönbornstrasse, Kürschnerhof, Eichhornstrasse und Spiegelstrasse bis zum Dominikanerplatz und Sternplatz. Zur Fussgängerzone zählt die im April 2026 beschlossene Satzung der Stadt aber auch Strassen, auf denen Zeus das Fahren nicht sperrt, etwa die Kaiserstrasse mit dem Kaiserplatz und den Pleicherkirchplatz; massgeblich ist das Schild. Auch die Alte Mainbrücke ist im Feed fast nur fürs Abstellen gesperrt, das Fahrverbot der Stadt gilt trotzdem: Schieb den Scooter hinüber, oder nimm die Ludwigsbrücke oder die Friedensbrücke.',
        'Ab 1. März 2027 gilt «Radverkehr frei» auch für E-Scooter: Auf so beschilderten Gehwegen und in Fussgängerzonen fährst du dann im Schritttempo. Die Stadt kann E-Scooter per Schild trotzdem ausschliessen, und die Sperrzone von Zeus bleibt, solange Zeus sie nicht ändert.',
      ],
    },
    {
      heading: 'Wo stellst du einen E-Scooter in Würzburg ab?',
      blocks: [
        'Ausserhalb der Fussgängerzone stellst du einen E-Scooter laut Stadt ab wie ein Fahrrad: Auf dem Gehweg bleiben mindestens 1,6 m frei, Haltestellen, Blindenleitsysteme, Rettungswege und Einfahrten bleiben frei. Für Leih-Scooter nennt die Selbstverpflichtung von 2020 weitere Tabu-Flächen: alle Grünanlagen und Parks samt Wegen, Kleingärten, Friedhöfe, Feuerwehrzufahrten, Fahrrad- und Motorradstellplätze, Halteverbote, Rampen, Zugänge zu Privatgrundstücken und Gehwege unter 1,50 m. Die wichtigsten Sperrzonen liefert die Stadt den Anbietern als Geodaten; dort müssen sie Start und Ende einer Fahrt sperren.',
        {
          table: {
            caption: 'Wo du einen Leih-Scooter in Würzburg abstellst und wer das festlegt (Stand Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer das festlegt'],
            rows: [
              ['Fussgängerzone, auch Kaiserstrasse und Pleicherkirchplatz', 'Weder fahren noch abstellen', 'Stadt Würzburg; Zeus sperrt das Fahren nur im Kern'],
              ['Alte Mainbrücke', 'Fahrverbot; laut Feed kein Fahrtende', 'Stadt Würzburg; Zeus (Fahrtende)'],
              ['Mainufer auf beiden Seiten, Alter Kranen, Mainkai', 'Laut Feed kein Fahrtende', 'Zeus'],
              ['Residenzplatz, Hofgarten, Ringpark', 'Laut Feed kein Fahrtende; im Hofgarten Fahrverbot', 'Zeus; Stadt (Grünanlagen); Schlösserverwaltung (Hofgarten)'],
              ['Festung Marienberg', 'Laut Feed kein Fahrtende', 'Zeus'],
              ['Grünanlagen, Friedhöfe, Haltestellen, Radständer', 'Kein Abstellen', 'Stadt Würzburg (Selbstverpflichtung)'],
              ['Übrige Stadt', 'Wie ein Fahrrad, ohne jemanden zu behindern', 'Bundesrecht (StVO)'],
            ],
          },
        },
        'Feste Abstellflächen gibt es in Würzburg nicht. Keine Sperrzone setzt der Feed etwa am Sanderring und in den meisten Wohnstrassen der Stadtteile von der Zellerau bis Heidingsfeld; die Regeln der Stadt gelten dort trotzdem.',
        {
          note: 'Lässt dich die App nicht abschliessen, stehst du in einer Sperrzone. Schieb den Scooter weiter, aus der Altstadt etwa an den Sanderring, vom Mainufer eine Strasse landeinwärts: Bis du die Fahrt beendest, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln und Bussgelder in Würzburg',
      blocks: [
        'Die Verkehrsregeln setzt der Bund, nicht Bayern oder die Stadt. E-Scooter fährst du ab 14 ohne Führerschein, höchstens 20 km/h und immer allein; Leih-Scooter vermieten die Anbieter erst ab 18. Eine Helmpflicht gibt es nicht; die Stadt empfiehlt den Helm sehr.',
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
      heading: 'Mit dem E-Scooter zur Uni, zur THWS und zum Hauptbahnhof',
      blocks: [
        'Eigene Regeln für E-Scooter haben wir weder bei der **Julius-Maximilians-Universität** noch bei der **THWS** gefunden. Was gilt, legt Zeus im Feed fest: Am Campus Hubland Nord ist ein Teil des Geländes für das Fahrtende gesperrt, an der Mensa Hubland Süd und an der Campusbrücke nicht. An der Neuen Universität am Sanderring und an den THWS-Gebäuden in der Münzstrasse und am Sanderheinrichsleitenweg stellst du ab wie überall in der Stadt.',
        'Am **Hauptbahnhof** sperrt der Feed das Abstellen auf dem Bahnhofsvorplatz und rund um den Bahnhofplatz. Ausgespart sind kleine Flächen, etwa am Bussteig 14 des Busbahnhofs. Den Bereich um den Bahnhof sollen die Anbieter laut Selbstverpflichtung mehrmals täglich kontrollieren.',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Zug',
      blocks: [
        'In Würzburgs Strassenbahnen und Bussen darf kein E-Scooter mit, auch kein eigener, zusammengeklappter: Die Beförderungsbedingungen des Nahverkehrs Mainfranken (NVM, gültig ab 1. August 2026) verbieten Elektrokleinstfahrzeuge wegen der Brandgefahr der Akkus. In Regionalzügen und ihren Ersatzbussen gelten die Regeln des jeweiligen Bahnunternehmens; laut WVV ist die Mitnahme nur dort möglich.',
        'Im Fernverkehr der Deutschen Bahn fährt ein eigener E-Scooter zusammengeklappt kostenlos als Handgepäck mit. Einen Leih-Scooter stellst du vor der Fahrt ab.',
      ],
    },
    {
      heading: 'Wie Würzburg E-Scooter regelt: Bund, Bayern, Stadt, Zeus',
      blocks: [
        {
          list: [
            '**Bund:** Verkehrsregeln, Alter, Tempo und Bussgelder.',
            '**Bayern:** Das Aufstellen von Leih-Scootern gilt bisher als Gemeingebrauch; eine Genehmigung der Stadt braucht ein Anbieter dafür laut Stadt nicht.',
            '**Stadt Würzburg:** freiwillige Selbstverpflichtung (Stand September 2020) mit Obergrenze, Fahrverbots- und Abstellverbotszonen; Fussgängerzonensatzung (April 2026).',
            '**Bayerische Schlösserverwaltung:** Fahrverbot in Hofgarten und Rosenbachpark.',
            '**Zeus:** weitere Sperrzonen im eigenen Feed, etwa am Mainufer und an der Festung Marienberg.',
            '**WVV und NVM:** kein E-Scooter in Strassenbahn und Bus.',
          ],
        },
        'Die Selbstverpflichtung begrenzt jeden Anbieter auf «zunächst 100» Scooter im Stadtgebiet; mit Zustimmung der Stadt darf es mehr sein. Einen späteren Beschluss dazu haben wir in den Ratsunterlagen nicht gefunden. An einem Standort stehen höchstens vier Scooter, wobei Teilstandorte unter 50 m Abstand als einer zählen; ab fünf braucht der Anbieter eine Sondernutzungserlaubnis. Soweit E-Scooter-Sharing als Sondernutzung gilt, verlangt die Stadt laut ihrer 2023 geänderten Gebührensatzung 30 € je Stellplatz und Monat, auf anderen öffentlichen Flächen 2,50 bis 20 € je Quadratmeter und Monat.',
        'Ab 1. März 2027 gilt das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung nicht mehr als Parken. Die Städte dürfen es dann nur unter Auflagen erlauben, etwa auf ausgewiesenen Flächen, und können das in Sondernutzungsvereinbarungen regeln. Zwei Stadtratsanträge, auf eine Regelung für E-Scooter und auf Abstellflächen, sind laut Liste der offenen Anträge (Stand 10. Juli 2026) noch nicht erledigt: Die Verwaltung will die Änderung des Bundes abwarten und plant die Bearbeitung 2026. Wie Abstellflächen in einer bayerischen Stadt funktionieren, zeigt [Regensburg](guide:regensburg).',
        'Ein Nachtverbot oder eine Winterpause nennen weder die Stadt noch Zeus; der Feed gibt als Öffnungszeit rund um die Uhr an. Zeus fährt in Unterfranken auch in [Schweinfurt](map:de:Schweinfurt).',
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Würzburg?',
      answer: 'Bei Zeus laut Datenfeed vom 23. Oktober 2026 1 € fürs Entsperren und 0,25 € pro Minute: zehn Minuten 3,50 €, zwanzig Minuten 6 €. Den verbindlichen Preis zeigt die App vor dem Entsperren. Preise von Voi, das die Stadt ebenfalls nennt, konnten wir nicht prüfen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über die Alte Mainbrücke fahren?',
      answer: 'Nein. Die Stadt zählt die Brücke zur Fussgängerzone, und die ist für E-Scooter nicht freigegeben. Schieb den Scooter hinüber oder nimm die Ludwigsbrücke oder die Friedensbrücke. Abstellen kannst du einen Zeus-Scooter auf der Brücke laut Feed ebenfalls nicht.',
    },
    {
      question: 'Warum kann ich meine Fahrt am Main oder an der Residenz nicht beenden?',
      answer: 'Weil Zeus das Mainufer auf beiden Seiten, den Residenzplatz mit Hofgarten und Ringpark, die Festung und die Altstadt-Fussgängerzone in seinem Feed fürs Fahrtende sperrt. Schieb den Scooter ein Stück weiter, aus der Altstadt etwa an den Sanderring, vom Ufer eine Strasse landeinwärts; bis dahin läuft die Miete.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Würzburger Strassenbahn mitnehmen?',
      answer: 'Nein, auch nicht zusammengeklappt: In Strassenbahnen und Bussen im NVM sind E-Scooter wegen der Brandgefahr verboten. Erlaubt ist die Mitnahme laut WVV nur in Regionalzügen und deren Ersatzbussen.',
    },
    {
      question: 'Gibt es in Würzburg ein Nachtverbot für E-Scooter?',
      answer: 'Nein. Weder die Stadt noch Zeus nennen ein Nachtverbot oder eine Winterpause (Stand Oktober 2026). Nur der Hofgarten schliesst bei Einbruch der Dunkelheit, spätestens um 20 Uhr, und dort darfst du ohnehin nicht fahren.',
    },
    {
      question: 'Welche E-Scooter-App brauche ich in Würzburg?',
      answer: 'Die von Zeus oder Voi, den beiden Anbietern, die die Stadt nennt; beide zeigt auch die [Live-Karte von Würzburg](map:de:Würzburg). Du musst 18 sein, einen Führerschein brauchst du nicht.',
    },
  ],
  sources: [
    { title: 'Stadt Würzburg: Elektrifizierung der Mobilität, E-Scooter (abgerufen 23. Oktober 2026)', url: 'https://www.wuerzburg.de/themen/verkehr--mobilitaet/saubermobil/elektrifizierung-der-mobilitaet' },
    { title: 'Stadt Würzburg: Freiwillige Selbstverpflichtung für Mietroller (Stand September 2020)', url: 'https://www.wuerzburg.de/m_567845_dl' },
    { title: 'Stadt Würzburg: Fussgängerzonensatzung (Stadtrat, 16. April 2026)', url: 'https://www.wuerzburg.sitzung-online.de/BI/vo020.asp?VOLFDNR=23804' },
    { title: 'Stadt Würzburg: Änderung der Sondernutzungsgebührensatzung (Stadtrat, 23. März 2023)', url: 'https://www.wuerzburg.sitzung-online.de/BI/vo020.asp?VOLFDNR=20227' },
    { title: 'Stadt Würzburg: Liste der offenen Stadtratsanträge (Stand 10. Juli 2026)', url: 'https://www.wuerzburg.sitzung-online.de/BI/vo020.asp?VOLFDNR=23783' },
    { title: 'Stadt Würzburg: Anfrage im Stadtrat zum insolventen Anbieter (13. November 2025)', url: 'https://www.wuerzburg.sitzung-online.de/BI/to020.asp?TOLFDNR=52917' },
    { title: 'Stadt Würzburg: Anfrage im Planungsausschuss zu den grünen Scootern (24. März 2026)', url: 'https://www.wuerzburg.sitzung-online.de/BI/to020.asp?TOLFDNR=54001' },
    { title: 'Stadt Würzburg: Anfrage im Stadtrat zur E-Scooter-Regelung (16. April 2026)', url: 'https://www.wuerzburg.sitzung-online.de/BI/to020.asp?TOLFDNR=54142' },
    { title: 'Bayerische Schlösserverwaltung: Anlagenvorschriften Hofgarten der Residenz Würzburg (3. März 2026)', url: 'https://www.schloesser.bayern.de/deutsch/garten/objekte/anlagenvorschriften/wuerzburg_avo.pdf' },
    { title: 'Residenz Würzburg: Öffnungszeiten', url: 'https://www.residenz-wuerzburg.de/deutsch/tourist/oeffnung.htm' },
    { title: 'WVV: Kleingedrucktes, Mitnahme von E-Scootern', url: 'https://www.wvv.de/mobil-b2c/kleingedrucktes/' },
    { title: 'NVM: Tarifbestimmungen und Beförderungsbedingungen (ab 1. August 2026)', url: 'https://www.wvv.de/media-wvv/mobilitaet/dokumente/fahrkarten/nvm-tarifbestimmungen-und-befoerderungsbedingungen.pdf' },
    { title: 'Zeus: Datenfeed Würzburg (GBFS über MobiData BW)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_wurzburg/gbfs' },
    { title: 'Voi: Voi startet Sharing-Angebot in Würzburg (26. März 2025)', url: 'https://storage.mfn.se/af8783f4-61fb-4c73-b4bb-d05ec501368e/e-scooter-anbieter-voi-startet-in-wurzburg.pdf' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2 (Verkehrszeichen)', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'Bundesgesetzblatt 2026 I Nr. 32: Änderung der StVO und der eKFV', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesverkehrsministerium: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
  ],
};

export default guide;
