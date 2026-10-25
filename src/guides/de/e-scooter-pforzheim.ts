import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-pforzheim',
  topic: 'pforzheim',
  name: 'E-Scooter Pforzheim: Voi, Lime, Preise, Parken',
  title: 'E-Scooter Pforzheim 2026: Voi, Lime, Preise, Parken',
  description: 'E-Scooter Pforzheim: Voi kostet laut Datenfeed 0,49 € plus 0,24 € pro Minute. Wo du seit 21. September in der Innenstadt abstellen darfst und was im Bus gilt.',
  headline: 'E-Scooter Pforzheim: Preise, Abstellflächen und Sperrzonen von der Innenstadt bis an Enz und Nagold',
  lede: 'Einen E-Scooter in Pforzheim leihst du ab 18 und ohne Führerschein bei Voi oder Lime, den beiden Anbietern, die die Stadt nennt. Laut Vois Datenfeed kostete eine Fahrt am 23. Oktober 2026 0,49 € fürs Entsperren plus 0,24 € pro Minute, zehn Minuten also 2,89 €. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone. In der Innenstadt beendest du die Fahrt seit 21. September 2026 nur auf einer der markierten Abstellflächen, sonst läuft die Uhr weiter.',
  published: '2026-10-24',
  updated: '2026-10-25',
  city: 'de:Pforzheim',
  sections: [
    {
      heading: 'Welche E-Scooter gibt es in Pforzheim?',
      blocks: [
        'Laut Stadt bieten in Pforzheim derzeit **Voi** und **Lime** E-Scooter an. Die ersten Leih-Scooter brachte im Dezember 2020 Zeus. Im Oktober 2024 nannte die Verwaltung vier Betreiber: Tier-Dott (bis 10. November 2024), Lime, Voi und Zeus; im Juli 2025 waren es Lime, Voi und Bolt mit zusammen rund 450 Scootern. Gemietet wird in der App des Anbieters: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '[Auf der ScootRadar-Karte](map:de:Pforzheim) standen am Freitag, 23. Oktober 2026, um 15:18 Uhr rund 190 Voi-Scooter in Pforzheim, am Sonntagmittag, 25. Oktober, rund 200 Lime-Scooter. Das ist eine Momentaufnahme der freien Fahrzeuge, nicht die Grösse der Flotte.',
        '**Lime zeigt die Karte seit dem 25. Oktober 2026**, obwohl in Limes offenem Feed im Landesportal MobiData BW am 23. Oktober kein Fahrzeug in der Stadt stand. Dass Lime hier fährt, sagen auch die Seite der Stadt und ein Bericht der Pforzheimer Zeitung vom 2. September 2026. Bolt, das in [Karlsruhe](map:de:Karlsruhe) fährt, und Dott führen Pforzheim nicht unter ihren Städten, und das Landesportal zeigte von beiden dort kein Fahrzeug.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Pforzheim?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preis in Pforzheim (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (Datenfeed bei MobiData BW, 23. Oktober 2026)', '0,49 €', '0,24 €', '2,89 €', '5,29 €'],
              ['Lime', 'nur in der App', 'nur in der App', '–', '–'],
            ],
          },
        },
        'Den Tarif nennt Voi selbst in seinem offenen Datenfeed im Landesportal; die Stadt nennt keinen Preis. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Derselbe Feed nannte am selben Tag für [Stuttgart](map:de:Stuttgart) ebenfalls 0,49 € plus 0,24 € pro Minute, für Karlsruhe 0,99 € plus 0,25 € (mehr im [Ratgeber für Karlsruhe](guide:karlsruhe)).',
      ],
    },
    {
      heading: 'Wo darf man in Pforzheim mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und in Fahrradstrassen; nur wo es keinen Radweg gibt, auf der Fahrbahn. Gehwege sind tabu, ausser das Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei»; dann fährst du im Schritttempo. Ob du Einbahnstrassen, die «Radverkehr frei» für Radfahrende in Gegenrichtung öffnet, schon heute mit dem E-Scooter gegen die Einbahnrichtung fahren darfst, regelt der Bund widersprüchlich: Die Strassenverkehrs-Ordnung erlaubt es, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es eindeutig erlaubt.',
        '**Fussgängerzone:** Hier fährst du heute nur, wo das Zusatzschild «Elektrokleinstfahrzeuge frei» es erlaubt; ab 1. März 2027 genügt «Radverkehr frei», im Schritttempo und sofern die Stadt E-Scooter nicht eigens ausschliesst. Sonst steigst du ab und schiebst. Die Freigabe von Bahnhof- und Leopoldstrasse für Fahrräder und Busse auf E-Scooter zu erweitern, hat der Jugendgemeinderat im November 2025 nur beantragt; eine Entscheidung fanden wir nicht. Das Fahren kontrolliert laut Stadt die Verkehrspolizei.',
        '**An Enz und Nagold:** Laut Vois Datenfeed vom 23. Oktober 2026 liegen die Flussläufe der Innenstadt samt Ufern und Brücken wie Rossbrücke und Altstädter Brücke ausserhalb des Geschäftsgebiets, ebenso der Stadtgarten: Dort endet keine Fahrt. Ob du über die Brücken weiterfahren kannst, geht aus dem Feed nicht eindeutig hervor; das zeigt dir die App.',
        '**Geschäftsgebiet:** Laut Feed vom 23. Oktober 2026 deckt es die Kernstadt mit Brötzingen, Wilferdinger Höhe, Buckenberg, Haidach und Teilen von Eutingen ab. Dillweissenstein, Huchenfeld, Würm, Büchenbronn, Sonnenhof, Wildpark und Enzauenpark liegen ausserhalb: Dort beginnst und beendest du keine Fahrt.',
        '**Tempo und Zeiten:** Vois Feed setzt überall die bauartbedingten 20 km/h, Langsamzonen enthält er nicht. Ein nächtliches Fahrverbot oder eine Winterpause nennen weder die Stadt noch Voi, der Feed gibt «24/7» an.',
      ],
    },
    {
      heading: 'Wo darf man E-Scooter in Pforzheim abstellen?',
      blocks: [
        'Seit Montag, 21. September 2026, beendest du eine Fahrt mit dem Leih-Scooter in der Innenstadt nur noch auf einer markierten **Abstellfläche**. Die Zone reicht laut Stadt vom Bahnhof im Norden bis zur Enz im Süden und von der Theaterstrasse im Osten bis zum Messplatz im Westen; dazu kommt ein Bereich um das Landratsamt in der Nordstadt. Stellst du ausserhalb ab, läuft laut Stadt «die Uhr für die Nutzungskosten» weiter, bis der Scooter auf einer Fläche steht. Die Flächen legt die Stadt fest, die Anbieter setzen sie in ihren Apps um.',
        'Die Karte der Stadt zeigt 16 Standorte mit 18 Flächen, meist 1,80 m breit, etwa an der Westlichen Bahnhofunterführung (Güterstrasse), am Leopoldplatz/Bahnhofstrasse, am Technischen Rathaus und am CCP am Waisenhausplatz. Weitere Flächen im übrigen Stadtgebiet plant das Grünflächen- und Tiefbauamt.',
        {
          table: {
            caption: 'Abstellen in Pforzheim: was wo gilt (Stadtkarte vom 18. September 2026, Datenfeed von Voi vom 23. Oktober 2026)',
            head: ['Ort', 'Abstellen', 'Wer es regelt'],
            rows: [
              ['Innenstadt mit Fussgängerzone, Marktplatz, Leopoldplatz und Platz der Synagoge', 'Nur auf den markierten Flächen', 'Stadt, umgesetzt von Voi und Lime'],
              ['Hauptbahnhof', 'Nur auf den Flächen, am nächsten an der Westlichen Bahnhofunterführung, rund 100 bis 200 m vom Bahnhofsvorplatz', 'Stadt, Anbieter'],
              ['Ufer von Enz und Nagold, Brücken, Stadtgarten mit Schmuckmuseum', 'Verboten: Sperrzone der Stadt, ausserhalb von Vois Geschäftsgebiet', 'Stadt, Voi'],
              ['Weststadtpark, Oststadtpark, viele Schulen', 'Verboten: Sperrzonen der Stadt', 'Stadt'],
              ['Hochschule, Tiefenbronner Strasse und Holzgartenstrasse', 'Auf der Strasse erlaubt, wenn niemand behindert wird', 'Bundesrecht, Voi; eine Campusregel der Hochschule fanden wir nicht'],
              ['Hochschule, Studiengang Mode, Östliche Karl-Friedrich-Strasse', 'Nur auf den Flächen, etwa am Technischen Rathaus nebenan', 'Stadt, Anbieter'],
            ],
          },
        },
        'Überall gilt laut Stadt: Auf dem Gehweg bleiben mindestens 1,60 m frei. Tabu sind Fussgängerzonen, öffentliche Grünanlagen und Strassenbegleitgrün, der Platz vor den Rampen von Bahnabgängen und öffentliche Fahrradständer. Insgesamt zeigt die Stadtkarte 61 Sperrzonen.',
        {
          note: 'Massgeblich ist die Karte in der App mit Abstellflächen und Sperrzonen. Lässt sie dich die Fahrt nicht beenden, fahr zur nächsten Fläche.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Pforzheim: Bussgelder und Promille',
      blocks: [
        'In Pforzheim gelten die deutschen Regeln: eigener Scooter ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die Stadt rät zum Helm.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Seit 1. Oktober 2026 haftet bei Unfällen der Halter auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Neue Verkehrsregeln und Bussgelder gelten erst ab 1. März 2027, die neuen Bauvorschriften seit 1. April 2026 nur für neue Fahrzeuge: mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: was im VPE gilt',
      blocks: [
        'In Pforzheim gilt der Gemeinschaftstarif des Verkehrsverbunds Pforzheim-Enzkreis (VPE), gültig ab 14. Dezember 2025; auch der Karlsruher Verbund KVV verweist für Züge im VPE-Gebiet auf ihn. Darin steht: «Nicht selbstbalancierende, einspurige Fahrzeuge, die den Anforderungen des § 2 eKFV entsprechen (E-Roller), werden wie Fahrräder behandelt.»',
        '**Im Bus** gilt für Fahrräder und damit für deinen Scooter: «Montags bis freitags ab 19 Uhr, samstags, sonn- und feiertags ohne zeitliche Einschränkung unentgeltlich (max. 2 Fahrräder im Fahrzeug), soweit Platz vorhanden ist.» Er gehört in den Stehbereich an der zweiten Tür. Im Anruf-Sammeltaxi und im Nachttaxi bleibt er immer draussen.',
        '**In Zug und Stadtbahn** fährt er kostenlos mit; nur montags bis freitags von 6 bis 9 Uhr brauchst du für ihn einen Einzelfahrschein für Erwachsene über zwei Zonen. Einen Anspruch auf Mitnahme hast du nicht.',
        '**Leih-Scooter** nimmst du nicht mit in Bus oder Bahn. Am Hauptbahnhof beendest du die Fahrt auf einer Fläche, etwa an der Westlichen Bahnhofunterführung, und mietest am Ziel neu.',
      ],
    },
    {
      heading: 'Wie Pforzheim E-Scooter regelt: Selbstverpflichtung statt Vertrag',
      blocks: [
        'Eine Ausschreibung, Sondernutzungserlaubnis oder Gebühr für Leih-Scooter hat Pforzheim nicht veröffentlicht. Laut einer Vorlage der Verwaltung von 2020 ist das Abstellen nach einem Urteil des Oberverwaltungsgerichts Hamburg «zweckmässiger Gemeingebrauch», den Kommunen «grundsätzlich nicht untersagen» können. Deshalb unterschreiben die Anbieter seit Dezember 2020 eine **Selbstverpflichtungserklärung** der Stadt zu Höchstzahl, Geschäftsgebiet, Verkehrssicherheit und Abstellen; ihren Text hat die Stadt nicht veröffentlicht. Die Vorlage nahm ein Ausschuss nur zur Kenntnis, einen Ratsbeschluss dazu fanden wir nicht.',
        'Im Oktober 2024 nannte die Verwaltung dem Planungs- und Umweltausschuss höchstens 175 Scooter pro Betreiber; eine neuere Obergrenze hat die Stadt nicht veröffentlicht. Die ersten Abstellflächen markierte sie im ersten Halbjahr 2026, seit 21. September 2026 gelten sie. Beschwerden über falsch abgestellte Scooter richtest du laut Stadt direkt an den Anbieter.',
        {
          list: [
            '**Bund:** Verkehrsregeln und Bussgelder. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Stadt kann es dann als Sondernutzung genehmigen.',
            '**Land Baden-Württemberg:** das Strassengesetz für Sondernutzungen; eigene Landesregeln für Leih-Scooter fanden wir nicht.',
            '**Stadt Pforzheim:** Selbstverpflichtung, Abstellflächen, Sperrzonen und Angebotsgebiet; die Anbieter setzen sie in ihren Apps um.',
            '**Voi und Lime:** Preise, Geschäftsgebiet und Sperrzonen in der App.',
            '**VPE:** die Mitnahme in Bus und Bahn.',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Pforzheim',
      blocks: [
        {
          list: [
            '**Scooter in der Enz.** Die Bergung von E-Scootern aus den Flüssen zahlt die Stadt, weil sich nicht nachweisen lässt, wer sie hineingeworfen hat, sagte die Verwaltung im Juli 2025 im Ausschuss. Lime nannte dort Parkverbotszonen von 50 bis 75 m um Gewässer.',
            '**Das Schmuckmuseum liegt ausserhalb.** Die Goldstadt ist laut Stadt das Zentrum der deutschen Schmuck- und Uhrenindustrie. Ihr Schmuckmuseum im Reuchlinhaus steht aber im Stadtgarten, ausserhalb von Vois Geschäftsgebiet.',
            '**Der Platz der Synagoge.** Laut PZ standen ab Mai 2026 immer wieder Lime-Scooter direkt vor dem Mahnmal am Platz der Synagoge. Der Platz liegt heute in der Zone, in der nur noch auf markierten Flächen abgestellt wird.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Pforzheim?',
      answer: 'Bei Voi laut dessen Datenfeed im Landesportal MobiData BW am 23. Oktober 2026 0,49 € zum Entsperren plus 0,24 € pro Minute, zehn Minuten also 2,89 €. Den Preis von Lime zeigt nur die Lime-App. Verbindlich ist, was die App vor dem Entsperren zeigt.',
    },
    {
      question: 'Welche E-Scooter-Anbieter gibt es in Pforzheim?',
      answer: 'Laut Stadt Voi und Lime; unsere Karte zeigt seit dem 25. Oktober 2026 beide. Bolt und Dott führen Pforzheim nicht unter ihren Städten (Stand 23. Oktober 2026).',
    },
    {
      question: 'Wo darf ich in der Pforzheimer Innenstadt einen E-Scooter abstellen?',
      answer: 'Seit 21. September 2026 nur auf einer markierten Abstellfläche; die Stadt nennt 16 zwischen Bahnhof, Enz, Theaterstrasse und Messplatz, etwa am Leopoldplatz, am Technischen Rathaus oder an der Westlichen Bahnhofunterführung. Ausserhalb kannst du die Fahrt nicht beenden und zahlst weiter.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Fussgängerzone fahren?',
      answer: 'Nur wo das Zusatzschild «Elektrokleinstfahrzeuge frei» es erlaubt, dann im Schritttempo; ab 1. März 2027 auch bei «Radverkehr frei», sofern die Stadt E-Scooter nicht ausschliesst. Sonst steigst du ab und schiebst. Fahren ohne Freigabe kostet heute ab 15 €, ab März 2027 ab 25 €.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus mitnehmen?',
      answer: 'Einen eigenen, der den Bauvorschriften entspricht, ja, wie ein Fahrrad: montags bis freitags ab 19 Uhr, am Wochenende und an Feiertagen ganztägig, kostenlos und nur, wenn Platz ist. In Zug und Stadtbahn kostenlos, montags bis freitags von 6 bis 9 Uhr aber nur mit Einzelfahrschein über zwei Zonen.',
    },
    {
      question: 'Gibt es in Pforzheim ein Nachtfahrverbot für E-Scooter?',
      answer: 'Nein. Weder die Stadt noch Voi nennen ein nächtliches Fahrverbot oder eine Winterpause; Vois Feed gibt «24/7» an (Stand 23. Oktober 2026).',
    },
  ],
  sources: [
    { title: 'Stadt Pforzheim: E-Scooter', url: 'https://www.pforzheim.de/stadt/mobilitaet/e-scooter.html' },
    { title: 'Stadt Pforzheim: Karte der Abstellflächen und Sperrzonen', url: 'https://www.pforzheim.de/escooter-sharing' },
    { title: 'Stadt Pforzheim: Abstellflächen für Leih-Scooter in der Innenstadt definiert (18. September 2026)', url: 'https://www.pforzheim.de/stadt/aktuelles/pressemeldungen/s1/article/detail/News/abstellflaechen-fuer-leih-scooter-in-der-innenstadt-definiert.html' },
    { title: 'Stadt Pforzheim: Künftig 50 E-Scooter von Zeus (17. Dezember 2020)', url: 'https://www.pforzheim.de/stadt/aktuelles/pressemeldungen/s1/article/detail/News/kuenftig-50-e-scooter-von-zeus-fuer-die-weiterentwicklung-der-mobilitaet-in-pforzheim.html' },
    { title: 'Stadt Pforzheim: Vorlage R 0485 zu Leih-E-Tretrollern (30. Oktober 2020)', url: 'https://allris.pforzheim.de/vo020?VOLFDNR=1004174' },
    { title: 'Planungs- und Umweltausschuss Pforzheim: E-Scooter (23. Oktober 2024)', url: 'https://allris.pforzheim.de/to020?TOLFDNR=1044231' },
    { title: 'Planungs- und Umweltausschuss Pforzheim: E-Scooter (16. Juli 2025)', url: 'https://allris.pforzheim.de/to020?TOLFDNR=1047127' },
    { title: 'Jugendgemeinderat Pforzheim: Antrag zur Freigabe für E-Scooter (13. November 2025)', url: 'https://allris.pforzheim.de/to020?TOLFDNR=2000903' },
    { title: 'Stadt Pforzheim: Tourismus', url: 'https://www.pforzheim.de/freizeit/tourismus.html' },
    { title: 'MobiData BW: Tarife von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans' },
    { title: 'MobiData BW: Zonen von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones' },
    { title: 'MobiData BW: Verzeichnis der Sharing-Datenfeeds', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'Bolt: Städte in Deutschland', url: 'https://bolt.eu/de-de/cities/' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'VPE: Gemeinschaftstarif, gültig ab 14. Dezember 2025 (PDF)', url: 'https://vpe.de/pdf/tarif/gemeinschaftstarif.pdf' },
    { title: 'KVV: Gemeinschaftstarif (PDF)', url: 'https://www.kvv.de/fileadmin/user_upload/kvv/Dateien/Flyer/2026-07-15_KVV_brs_Gemeinschaftstarif_A5_bf.pdf' },
    { title: 'Hochschule Pforzheim: Anfahrt und Standorte', url: 'https://www.hs-pforzheim.de/hochschule/kontakt/anfahrtskizze' },
    { title: 'Pforzheimer Zeitung: Lime-Roller am Synagogen-Mahnmal (2. September 2026)', url: 'https://www.pz-news.de/pforzheim_artikel,-Lime-Roller-ausgerechnet-am-Pforzheimer-Synagogen-Mahnmal-Betreiber-nennt-das-nicht-akzeptabel-_arid,2366824.html' },
    { title: 'Verordnung zur Änderung der eKFV, BGBl. 2026 I Nr. 32', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Bussgeldkatalog-Verordnung (BKatV)', url: 'https://www.gesetze-im-internet.de/bkatv_2013/BJNR049800013.html' },
    { title: 'Strassenverkehrsgesetz § 8: Halterhaftung seit 1. Oktober 2026', url: 'https://www.gesetze-im-internet.de/stvg/__8.html' },
    { title: 'StVO Anlage 2: Vorschriftzeichen und Zusatzzeichen', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
  ],
};

export default guide;
