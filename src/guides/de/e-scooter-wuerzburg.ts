import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wuerzburg',
  topic: 'wuerzburg',
  name: 'E-Scooter Würzburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Würzburg 2026: Preise, Parken, Altstadt',
  description: 'E-Scooter Würzburg: was Zeus und Voi pro Minute kosten, wo du in Altstadt, am Main und an der Residenz nicht fährst oder parkst und ob er in die Tram darf.',
  headline: 'E-Scooter Würzburg: Preise, Fahrverbot in der Fussgängerzone und was an Main, Residenz und Uni gilt',
  lede: 'Einen E-Scooter in Würzburg leihst du ohne Führerschein bei Zeus oder Voi, bei Zeus ab 18. Zeus nimmt 1 € fürs Entsperren und 0,25 € pro Minute, Voi 0,49 € und 0,24 € pro Minute (Stand November 2026); zehn Minuten kosten also 3,50 € oder 2,89 €. Du fährst auf dem Radweg oder der Fahrbahn, nie durch die Fussgängerzone der Altstadt, über die Alte Mainbrücke, auf Gehwegen oder auf Wegen in Parks. Abstellen darfst du wie ein Fahrrad, aber nicht in der Fussgängerzone, in Grünanlagen und an Haltestellen; bei Zeus endet die Fahrt zudem nicht am Mainufer, am Residenzplatz und im Hofgarten. In Bus und Strassenbahn darf kein E-Scooter mit.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Würzburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Würzburg?',
      blocks: [
        'Auf ihrer undatierten E-Scooter-Seite nennt die Stadt zwei Anbieter, die ihre Selbstverpflichtung unterschrieben haben: **Zeus** und **Voi**. Voi meldete seinen Start in Würzburg zum 28. März 2025. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz vor 16 Uhr zeigte die [Karte von Würzburg](map:de:Würzburg) rund 170 Zeus- und 230 Voi-Scooter, die zu diesem Zeitpunkt frei waren.',
        'Im November 2025 meldete ein Stadtrat Beschwerden über herumstehende Roller eines insolventen Anbieters. Im März und April 2026 sagte Bürgermeisterin Vorlová, die ungenutzten grünen Roller würden nach und nach weggeräumt, von einer anderen Firma als dem Anbieter.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Würzburg?',
      blocks: [
        'Zeus nimmt in Würzburg 1 € fürs Entsperren und 0,25 € pro Minute und berechnet für eine Fahrt höchstens 42 €. Voi nimmt 0,49 € fürs Entsperren und 0,24 € pro Minute. Beides gilt Stand November 2026.',
        {
          table: {
            caption: 'E-Scooter-Preise in Würzburg (Stand November 2026)',
            head: ['Fahrtdauer', 'Zeus', 'Voi'],
            rows: [
              ['5 Minuten', '2,25 €', '1,69 €'],
              ['10 Minuten', '3,50 €', '2,89 €'],
              ['20 Minuten', '6,00 €', '5,29 €'],
              ['30 Minuten', '8,50 €', '7,69 €'],
            ],
          },
        },
        'Vom Hauptbahnhof zur Residenz ist es gut 1 km, zur Mensa am Hubland rund 4 km: Rechne grob mit 5 und 15 Minuten. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
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
        'Bei Zeus darfst du durch den Kern der Fussgängerzone nicht einmal durchfahren (Stand November 2026). Die Sperre reicht vom Marktplatz und Unteren Markt über Schmalzmarkt, Domstrasse, Schönbornstrasse, Kürschnerhof, Eichhornstrasse und Spiegelstrasse bis zum Dominikanerplatz, Sternplatz und Barbarossaplatz, dazu über fast die ganze Juliuspromenade. Zur Fussgängerzone zählt die im April 2026 beschlossene Fussgängerzonensatzung der Stadt aber auch Strassen, auf denen Zeus das Fahren nicht sperrt, etwa die Kaiserstrasse mit dem Kaiserplatz und den Pleicherkirchplatz; massgeblich ist das Schild. Auf der Alten Mainbrücke sperrt Zeus fast nur das Abstellen, das Fahrverbot der Stadt gilt trotzdem: Schieb den Scooter hinüber, oder nimm die Ludwigsbrücke oder die Friedensbrücke.',
        'Ab 1. März 2027 gilt «Radverkehr frei» auch für E-Scooter: Auf so beschilderten Gehwegen und in Fussgängerzonen fährst du dann im Schritttempo. Die Stadt kann E-Scooter per Schild trotzdem ausschliessen, und die Sperrzone von Zeus bleibt, solange Zeus sie nicht ändert.',
      ],
    },
    {
      heading: 'Wo stellst du einen E-Scooter in Würzburg ab?',
      blocks: [
        'Ausserhalb der Fussgängerzone stellst du einen E-Scooter laut Stadt ab wie ein Fahrrad: Auf dem Gehweg bleiben mindestens 1,6 m frei, Haltestellen, Blindenleitsysteme, Rettungswege und Einfahrten bleiben frei. Für Leih-Scooter nennt die Selbstverpflichtung von 2020 weitere Tabu-Flächen: alle Grünanlagen und Parks samt Wegen, Kleingärten, Friedhöfe, Feuerwehrzufahrten, Fahrrad- und Motorradstellplätze, Halteverbote, Rampen, Zugänge zu Privatgrundstücken und Gehwege unter 1,50 m. Die wichtigsten Sperrzonen liefert die Stadt den Anbietern als Geodaten; dort müssen sie Start und Ende einer Fahrt sperren.',
        {
          table: {
            caption: 'Wo du einen Leih-Scooter in Würzburg abstellst und wer das festlegt (Stand November 2026)',
            head: ['Ort', 'Was gilt', 'Wer das festlegt'],
            rows: [
              ['Fussgängerzone mit der Alten Mainbrücke, auch Kaiserstrasse und Pleicherkirchplatz', 'Weder fahren noch abstellen', 'Stadt Würzburg; Zeus sperrt das Fahren nur im Kern'],
              ['Mainufer auf beiden Seiten, etwa Oberer Mainkai und Mainwiesen', 'Bei Zeus kein Fahrtende', 'Zeus'],
              ['Residenzplatz, Hofgarten, grosse Teile des Ringparks', 'Bei Zeus kein Fahrtende', 'Zeus'],
              ['Festung Marienberg', 'Bei Zeus kein Fahrtende', 'Zeus'],
              ['Hofgarten und Rosenbachpark', 'Fahrverbot auf den Wegen', 'Bayerische Schlösserverwaltung'],
              ['Grünanlagen und Parks samt Wegen, Kleingärten, Friedhöfe, Haltestellen, Rad- und Motorradstellplätze', 'Kein Abstellen', 'Stadt Würzburg (Selbstverpflichtung)'],
              ['Übrige Stadt', 'Wie ein Fahrrad, ohne jemanden zu behindern', 'Bundesrecht (StVO)'],
            ],
          },
        },
        {
          note: 'Lässt dich die App nicht abschliessen, stehst du in einer Sperrzone. Schieb den Scooter weiter, aus der Fussgängerzone hinaus, vom Mainufer eine Strasse landeinwärts oder vom Park weg: Bis du die Fahrt beendest, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln und Bussgelder in Würzburg',
      blocks: [
        'Die Verkehrsregeln setzt der Bund, nicht Bayern oder die Stadt. E-Scooter fährst du ab 14 ohne Führerschein, höchstens 20 km/h und immer allein; Leih-Scooter vermietet Zeus erst ab 18. Eine Helmpflicht gibt es nicht; die Stadt empfiehlt den Helm sehr.',
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
        'Am **Campus Hubland Nord** lässt Zeus dich auf einem Teil des Geländes keine Fahrt beenden, an der Mensa Hubland Süd und an der Campusbrücke schon. An der **Neuen Universität** am Sanderring und an den **THWS**-Gebäuden in der Münzstrasse und am Röntgenring stellst du ab wie überall in der Stadt; auf dem THWS-Gelände am Sanderheinrichsleitenweg endet eine Zeus-Fahrt dagegen nicht (Stand November 2026).',
        'Am **Hauptbahnhof** sperrt Zeus das Fahrtende auf dem Bahnhofsvorplatz und rund um den Bahnhofplatz. Den Bereich um den Bahnhof sollen die Anbieter laut Selbstverpflichtung mehrmals täglich kontrollieren. Halte Haltestellen, Blindenleitsysteme und Eingänge frei, wenn du in der Nähe abstellst.',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Zug',
      blocks: [
        'In Würzburgs Strassenbahnen und Bussen darf kein E-Scooter mit, auch kein eigener, zusammengeklappter: Die Beförderungsbedingungen des Nahverkehrs Mainfranken (NVM, gültig ab 1. August 2026) verbieten Elektrokleinstfahrzeuge wegen der Brandgefahr der Akkus. In Regionalzügen und ihren Ersatzbussen gelten die Regeln des jeweiligen Bahnunternehmens; laut WVV ist die Mitnahme nur dort möglich.',
        'Im Fernverkehr der Deutschen Bahn fährt ein eigener E-Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit; den Akku darfst du unterwegs weder herausnehmen noch laden. Einen Leih-Scooter stellst du vor der Fahrt ab.',
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
            '**Zeus:** weitere Sperrzonen für das Fahrtende, etwa am Mainufer und an der Festung Marienberg.',
            '**WVV und NVM:** kein E-Scooter in Strassenbahn und Bus.',
          ],
        },
        'Die Selbstverpflichtung begrenzt jeden Anbieter auf «zunächst 100» Scooter im Stadtgebiet; mit Zustimmung der Stadt darf es mehr sein. An einem Standort stehen höchstens vier Scooter, wobei Teilstandorte unter 50 m Abstand als einer zählen; ab fünf braucht der Anbieter eine Sondernutzungserlaubnis. Soweit E-Scooter-Sharing als Sondernutzung gilt, verlangt die Stadt laut ihrer 2023 geänderten Gebührensatzung 30 € je Stellplatz und Monat, auf anderen öffentlichen Flächen 2,50 bis 20 € je Quadratmeter und Monat.',
        'Ab 1. März 2027 gilt das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung nicht mehr als Parken. Die Städte dürfen es dann nur unter Auflagen erlauben, etwa auf ausgewiesenen Flächen, und können das in Sondernutzungsvereinbarungen regeln. Zwei Stadtratsanträge, auf eine Regelung für E-Scooter und auf Abstellflächen, sind laut Liste der offenen Anträge (Stand 10. Juli 2026) noch nicht erledigt: Die Verwaltung will die Änderung des Bundes abwarten und plant die Bearbeitung 2026. Wie Abstellflächen in einer bayerischen Stadt funktionieren, zeigt [Regensburg](guide:regensburg).',
        'Zeus vermietet in Würzburg rund um die Uhr und fährt in Unterfranken auch in [Schweinfurt](map:de:Schweinfurt).',
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Würzburg?',
      answer: 'Bei Zeus 1 € fürs Entsperren und 0,25 € pro Minute, zehn Minuten also 3,50 €; bei Voi 0,49 € und 0,24 € pro Minute, zehn Minuten 2,89 € (Stand November 2026). Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
    },
    {
      question: 'Wo darf ich in Würzburg einen Leih-Scooter nicht abstellen?',
      answer: 'Nicht in der Fussgängerzone mit der Alten Mainbrücke und laut Selbstverpflichtung der Anbieter nicht in Grünanlagen und Parks samt Wegen, Kleingärten, auf Friedhöfen, an Haltestellen, auf Rad- und Motorradstellplätzen, in Halteverboten, auf Rampen und auf Gehwegen unter 1,50 m. Sonst stellst du ab wie ein Fahrrad und lässt auf dem Gehweg mindestens 1,6 m frei.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über die Alte Mainbrücke fahren?',
      answer: 'Nein. Die Stadt zählt die Brücke zur Fussgängerzone, und die ist für E-Scooter nicht freigegeben. Schieb den Scooter hinüber oder nimm die Ludwigsbrücke oder die Friedensbrücke. Abstellen darfst du ihn auf der Brücke ebenfalls nicht.',
    },
    {
      question: 'Warum kann ich meine Fahrt am Main oder an der Residenz nicht beenden?',
      answer: 'Weil Zeus das Mainufer auf beiden Seiten, den Residenzplatz mit Hofgarten und Ringpark, die Festung und die Fussgängerzone für das Fahrtende sperrt; die wichtigsten Sperrzonen gibt die Stadt den Anbietern ohnehin vor. Schieb den Scooter ein Stück weiter, aus der Fussgängerzone hinaus oder vom Ufer eine Strasse landeinwärts; bis dahin läuft die Miete.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Würzburger Strassenbahn mitnehmen?',
      answer: 'Nein, auch nicht zusammengeklappt: In Strassenbahnen und Bussen im NVM sind E-Scooter wegen der Brandgefahr verboten. Erlaubt ist die Mitnahme laut WVV nur in Regionalzügen und deren Ersatzbussen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Hofgarten fahren?',
      answer: 'Nein. Die Bayerische Schlösserverwaltung verbietet in Hofgarten und Rosenbachpark, Wege mit dem Fahrrad oder sonstigen Fahrzeugen zu befahren, ausgenommen Krankenrollstühle und Kinderwagen. Offen ist der Hofgarten täglich bis zum Einbruch der Dunkelheit, längstens bis 20 Uhr.',
    },
    {
      question: 'Welche E-Scooter-App brauche ich in Würzburg?',
      answer: 'Die von Zeus oder Voi, den beiden Anbietern, die die Stadt nennt. Einen Führerschein brauchst du nicht; Zeus vermietet ab 18, das Mindestalter bei Voi zeigt dir die App.',
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
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'MobiData BW: offene Daten von Zeus Würzburg (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_wurzburg/gbfs' },
    { title: 'Zeus Scooters: Allgemeine Geschäftsbedingungen', url: 'https://zeusscooters.com/terms-and-conditions/' },
    { title: 'Zeus: GBFS Schweinfurt', url: 'https://zeus.city/api/v1/mds/gbfs/schweinfurt/gbfs.json' },
    { title: 'Voi: Voi startet Sharing-Angebot in Würzburg (26. März 2025)', url: 'https://storage.mfn.se/af8783f4-61fb-4c73-b4bb-d05ec501368e/e-scooter-anbieter-voi-startet-in-wurzburg.pdf' },
    { title: 'Voi: Tarif und Zonen Würzburg (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/365/netex.xml' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2 (Verkehrszeichen)', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'Bundesgesetzblatt 2026 I Nr. 32: Änderung der StVO und der eKFV', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesverkehrsministerium: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
  ],
};

export default guide;
