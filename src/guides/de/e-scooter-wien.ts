import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wien',
  topic: 'vienna',
  name: 'E-Scooter Wien: Anbieter, Abstellen, Regeln',
  title: 'E-Scooter Wien 2026: Anbieter, Abstellflächen, Regeln',
  description: 'E-Scooter Wien: wer verleiht, wo du fahren und abstellen darfst, was in Parks, U-Bahn und Bim gilt und welche Regeln seit Mai 2026 in Österreich gelten.',
  headline: 'E-Scooter Wien: Anbieter, Abstellflächen, Sperrzonen und die Regeln seit Mai 2026',
  lede: 'Einen E-Scooter in Wien leihst du im Oktober 2026 bei Voi, dessen Scooter in allen 23 Bezirken stehen, oder bei Lime; Konzessionen vergibt die Stadt nur noch an zwei Betreiber. Gefahren wird wie mit dem Fahrrad auf dem Radweg oder der Fahrbahn, nie auf dem Gehsteig. Abgestellt wird auf einer der rund 400 rot markierten Abstellflächen oder, weiter weg davon, in der Parkspur. Seit dem 1. Mai 2026 gelten in ganz Österreich eine Helmpflicht unter 16 und eine Grenze von 0,5 Promille.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'at:Wien',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Wien?',
      blocks: [
        'Leih-E-Scooter darf in Wien laut der E-Scooter-Verordnung des Magistrats, die seit dem 1. Juli 2023 gilt, nur aufstellen, wer mit der Stadt einen Konzessionsvertrag über höchstens drei Jahre hat. Ausgeschrieben werden die Konzessionen für die Bezirke 1 bis 9 und 20; anderswo bekommt jeder Betreiber, der die Bedingungen erfüllt, einen Vertrag. Laut ihrer Infoseite vergibt die Stadt Scooter-Konzessionen «nur noch an 2 ausgewählte Betreiber»; Namen nennt sie dort keine.',
        'Die Ausschreibung von 2023 gewannen laut dem Pressedienst der Stadt Bird, Lime, Link und Voi. Bird und Link schieden danach laut Presse aus; seit Februar 2024 sind laut «Standard» nur noch Lime und Voi übrig. Zuletzt nennt die «Autorevue» Lime, mit Stand April 2025; eine offizielle Bestätigung für Oktober 2026 fanden wir nicht, Limes App zeigte am 25. Oktober 2026 aber rund 1950 Scooter in Wien. Bolt bietet in Wien laut eigener Website nur Autofahrten an. Dott fährt laut eigener Seite im Umland, etwa in Mödling und Baden, nicht aber in Wien (beides Stand 25. Oktober 2026); seine Scooter siehst du auf der [Karte von Mödling](map:at:Mödling).',
        'ScootRadar zeigt auf der [Karte von Wien](map:at:Wien) Voi und Lime. Von Voi standen in der Nacht auf Sonntag, 25. Oktober 2026, um 1 Uhr rund 1860 Scooter auf der Karte, in allen 23 Bezirken, die meisten in der Donaustadt, in Floridsdorf und in Favoriten, in der Inneren Stadt nur rund 70; in Schwechat, Klosterneuburg und Vösendorf stand keiner. Von Lime waren es am Abend desselben Tages, gegen 19 Uhr, rund 1950 in seinem ganzen Wiener Fahrgebiet. Das sind Momentaufnahmen, keine Flottengrössen. Die Karte zeigt nur Standort und Akkustand, keine Preise, Zonen, Abstellflächen oder E-Bikes.',
        {
          steps: [
            'Den nächsten Scooter auf der [Live-Karte von Wien](map:at:Wien) suchen und die App des Anbieters öffnen.',
            'Registrieren und ein Zahlungsmittel hinterlegen. Laut Presseberichten musst du für ein Konto mindestens 18 sein; verbindlich sind die Bedingungen in der App.',
            'QR-Code scannen, losfahren und die Fahrt auf einer Abstellfläche beenden. Jeden Schritt erklärt der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
          ],
        },
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Wien?',
      blocks: [
        'Du zahlst eine Gebühr fürs Entsperren und einen Minutenpreis; laut Presse gibt es auch Pässe und Abos. Einen offenen Wiener Tarif fanden wir weder bei Voi noch bei Lime, und auch die Stadt nennt keine Preise. Verlässlich ist nur die App: Sie zeigt dir den Preis vor dem Entsperren.',
      ],
    },
    {
      heading: 'Wo darfst du mit dem E-Scooter in Wien fahren?',
      blocks: [
        'Seit dem 1. Mai 2026 regelt § 68a der Strassenverkehrsordnung (StVO) das «Rollerfahren». Ein E-Scooter mit höchstens 600 Watt und 25 km/h gilt als Klein- und Miniroller (§ 2 Abs. 1 Z 22a StVO), und für dich gelten die Regeln für Radfahrer. Ist er stärker oder schneller, gilt er als Moped.',
        'Gibt es eine **Radfahranlage**, musst du sie benützen. So heisst in Österreich alles, was für Räder gebaut ist, vom Radweg bis zum Radfahrstreifen. Sonst fährst du auf der Fahrbahn. Auf dem **Gehsteig**, wie der Gehweg an der Strasse in Österreich heisst, und auf reinen Gehwegen darfst du nicht fahren, und über den **Schutzweg**, den Zebrastreifen, schiebst du.',
        'In eine Fussgängerzone darfst du nur, wo die Behörde sie für Räder und E-Scooter geöffnet hat, und dann im Schritttempo; ebenso langsam fährst du in der Wohnstrasse. In einer **Begegnungszone**, einer Strasse, die sich alle teilen, gilt höchstens 20 km/h, und Fussgänger darfst du nicht gefährden. Bei Leih-Scootern setzt die Stadt das technisch durch:',
        {
          table: {
            caption: 'Zonen für Leih-E-Scooter in Wien (offene Daten der Stadt, Stand 25. Oktober 2026)',
            head: ['Zone', 'Was gilt', 'Wo, zum Beispiel'],
            rows: [
              ['Fahr- und Abstellverbot (899 Zonen)', 'Fahren und Fahrt beenden technisch gesperrt', '592 Parks, darunter der Stadtpark; 210 Anlagen von Wiener Wohnen; Fussgängerzonen wie Graben, Kärntner Strasse und Schwedenplatz; 25 Märkte wie Naschmarkt, Brunnenmarkt und Karmelitermarkt; das AKH; der Würstelprater'],
              ['Schrittgeschwindigkeit (271 Zonen)', 'Der Scooter bremst auf Schritttempo', '194 Wohnstrassen; Fussgängerzonen wie der Praterstern und die Mitte der Mariahilfer Strasse'],
              ['20 km/h (24 Zonen)', 'Begegnungszone: höchstens 20 km/h', 'Mariahilfer Strasse, Neubaugasse, Rotenturmstrasse, Herrengasse, Landstrasser Hauptstrasse, Petersplatz'],
            ],
          },
        },
        'Die Zonen ändern sich; was gilt, zeigt dir die App. Mit dem eigenen Scooter bremst dich keine Zone, die StVO gilt aber genauso.',
      ],
    },
    {
      heading: 'E-Scooter abstellen in Wien: Abstellflächen, Parkspur, Gehsteig',
      blocks: [
        'Für Leih-Scooter gelten seit dem 19. Mai 2023 eigene Abstellregeln. Seit dem 1. Juli 2023 stehen sie in § 4 der E-Scooter-Verordnung, zuletzt geändert 2025:',
        {
          steps: [
            '**Abstellfläche:** rot am Boden markiert, für 8 bis 10 Scooter, oft bei WienMobil-Stationen. Die offenen Daten der Stadt zählen 401 davon, etwa am Heldentor, am Karlsplatz, Am Hauptbahnhof und an der Schönbrunner Schlossbrücke. Im Umkreis von 100 Metern darfst du nur dort abstellen, laut Stadt auch nicht in Fahrradständern.',
            '**Parkspur:** weiter weg am Fahrbahnrand, platzsparend und so, dass der Scooter nicht umfällt.',
            '**Gehsteig:** nur, wenn er mindestens 4 Meter breit ist, und dann auf der Seite der Fahrbahn, im rechten Winkel zum Gehsteigrand.',
          ],
        },
        'Nicht abstellen darfst du einen Leih-Scooter in Grünanlagen, ausser in den Fahrradständern dort, und in fünf Abstellverbotszonen, ausser auf einer Abstellfläche: rund um die Staatsoper, auf Stephansplatz, Graben und Kärntner Strasse, auf dem Rathausplatz, bei der Albertina und vor dem Oberen Belvedere. Tabu sind laut Stadt auch die Bodenmarkierungen für Blinde.',
        { note: 'In einer Sperrzone kannst du die Fahrt nicht beenden, und die Minuten laufen weiter. Plane den Halt darum vorher, am besten auf einer Abstellfläche.' },
        'Kontrolliert wird von der Parkraumüberwachung der MA 67, den «Park-Sheriffs». Steht ein Leih-Scooter falsch, muss der Betreiber ihn laut Verordnung unverzüglich, spätestens nach 15 Minuten, wegbringen oder richtig abstellen. Die Stadt darf ihn ohne Verfahren entfernen und acht Wochen verwahren, auf Kosten des Betreibers. Der Betreiber muss dich in seinen Nutzungsbedingungen an die Abstellregeln binden; ob und was er dir weiterverrechnet, steht dort.',
        'Jeder Leih-Scooter trägt ein Nummernschild. Steht einer im Weg, meldest du ihn damit in der App «Sag’s Wien» oder beim Stadtservice Wien. Deinen eigenen Scooter stellst du wie ein Fahrrad ab: auf dem Gehsteig nur, wenn er breiter als 2,5 Meter ist, und an Haltestellen nur in Fahrradständern (§ 68 Abs. 4 StVO).',
      ],
    },
    {
      heading: 'E-Scooter in Parks: Schönbrunn, Belvedere, Augarten, Prater',
      blocks: [
        'Die Schlossgärten gehören zu den Österreichischen Bundesgärten. Im Schlosspark Schönbrunn, im Belvederegarten und im Augarten darfst du auf den Wegen nicht fahren und kein Fahrzeug abstellen. Radfahren ist verboten, und Sportgeräte mit Rollen wie Segways darfst du nicht einmal mitnehmen. Beende die Fahrt also vor dem Tor, in Schönbrunn etwa an der Abstellfläche an der Schlossbrücke. Für Burggarten und Volksgarten fanden wir auf der Seite der Bundesgärten keine Parkordnung (Stand 25. Oktober 2026).',
        'In den Parks der Stadt, etwa im Stadtpark, verbietet die Grünanlagenverordnung Fahrzeuge auf Wegen und Wiesen, und Rad fahren darfst du nur, wo es gekennzeichnet ist. Für Leih-Scooter sind 592 Parks Sperrzone.',
        'Im Prater ist der Würstelprater Sperrzone. Abstellflächen gibt es am Präuscherplatz und am Praterstern, über den du im Schritttempo rollst.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Österreich: Helmpflicht, Alter, Promille',
      blocks: [
        'Die Verkehrsregeln setzt der Bund in der StVO. Die Novelle BGBl. I Nr. 17/2026, die der Nationalrat am 25. März 2026 beschlossen hat, gilt seit dem 1. Mai 2026 und hat die alten E-Scooter-Regeln in § 88b durch § 68a ersetzt. Das Wichtigste:',
        {
          table: {
            caption: 'E-Scooter-Regeln in Österreich (StVO, Stand 25. Oktober 2026)',
            head: ['Regel', 'Was gilt', 'Wo es steht'],
            rows: [
              ['Alter', 'Unter 12 nur unter Aufsicht einer Person ab 16 oder mit Radfahrausweis', '§ 68a Abs. 4 StVO'],
              ['Helm', 'Pflicht unter 16, seit 1. Mai 2026', '§ 68a Abs. 7 StVO'],
              ['Alkohol', 'Unter 0,5 Promille (0,25 mg/l Atemluft), seit 1. Mai 2026; vorher 0,8', '§ 68a Abs. 3 StVO'],
              ['Handy', 'Telefonieren nur mit Freisprecheinrichtung', '§ 68 Abs. 3 StVO'],
              ['Mitfahren, Gepäck', 'Niemand fährt mit; keine Lasten, kein Anhänger, keine Taschen am Lenker', '§ 68a Abs. 2 StVO'],
              ['Ausrüstung', 'Bremse, Klingel, Rückstrahler, Blinker an den Lenkerenden, bei Dunkelheit und schlechter Sicht Licht', '§ 68a Abs. 5 StVO'],
            ],
          },
        },
        'Die Polizei kann dir ein **Organmandat** ausstellen, eine Strafe gleich an Ort und Stelle (§ 50 Verwaltungsstrafgesetz); feste Beträge für E-Scooter fanden wir bei Bund und Stadt nicht. Den Rahmen setzt § 99 StVO: bis 726 € für die meisten Verstösse. Ab 0,8 Promille giltst du als beeinträchtigt, dann kostet es 800 bis 3700 €, ab 1,2 Promille 1200 bis 4400 € und ab 1,6 Promille oder wenn du den Test verweigerst 1600 bis 5900 €.',
        'Wer aus Deutschland kommt, muss umdenken: Dort fährt man ab 14, und einen Helm schreibt das Gesetz nicht vor. Die deutschen Regeln stehen in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in U-Bahn, Bim und Bus: Wiener Linien und ÖBB',
      blocks: [
        'Seit dem 1. September 2026 gelten bei den Wiener Linien neue Beförderungsbedingungen, wie ORF Wien und der Pressedienst der Stadt am 30. August 2026 berichteten:',
        {
          list: [
            '**U-Bahn:** deinen eigenen E-Scooter nimmst du nur ausserhalb der Stosszeiten mit, Montag bis Freitag von 9 bis 15 Uhr und ab 18.30 Uhr bis Betriebsschluss, an Wochenenden und Feiertagen ganztags.',
            '**Bim und Bus:** keine E-Scooter mehr, auch nicht zusammengeklappt, und auch keine Falt-E-Bikes. «Bim» sagt man in Wien zur Strassenbahn.',
            '**Tretroller ohne Motor** darfst du zusammengeklappt jederzeit in allen Fahrzeugen mitnehmen.',
            '**Strafe:** 50 €. Wer am Bahnsteig fährt, kann ebenfalls gestraft werden.',
          ],
        },
        'Einen Leih-Scooter stellst du am besten auf einer Abstellfläche vor der Station ab; viele liegen an WienMobil-Stationen.',
        'In S-Bahnen und Regionalzügen der ÖBB fährt dein eigener Scooter laut ÖBB-Handbuch (gültig ab 15. Oktober 2026) zusammengeklappt kostenlos mit: bis 90 × 60 × 40 cm überall, bis 110 × 80 × 40 cm im Mehrzweckabteil; grössere gelten als Fahrrad. Der Akku muss fest montiert sein und darf im Zug nicht laden.',
        'Ohne Scooter kommst du mit WienMobil Rad weiter, dem Bikesharing der Wiener Linien, das laut Stadt Stationen in allen 23 Bezirken hat.',
      ],
    },
  ],
  faq: [
    {
      question: 'Gilt in Wien eine Helmpflicht auf dem E-Scooter?',
      answer: 'Ja, für alle unter 16, seit dem 1. Mai 2026 in ganz Österreich (§ 68a Abs. 7 StVO). Ab 16 ist der Helm freiwillig. Wer ein Kind unter 12 beim Rollerfahren beaufsichtigt, muss dafür sorgen, dass es den Helm trägt.',
    },
    {
      question: 'Darf ich mit dem E-Scooter auf dem Gehsteig fahren?',
      answer: 'Nein, das verbietet § 68a StVO seit Mai 2026 ausdrücklich, auch auf Gehwegen. Du fährst auf der Radfahranlage oder der Fahrbahn und schiebst über den Zebrastreifen. Einen Leih-Scooter darfst du auf dem Gehsteig nur abstellen, wenn er mindestens 4 Meter breit ist.',
    },
    {
      question: 'Darf ich meinen E-Scooter in die U-Bahn mitnehmen?',
      answer: 'Ja, aber laut ORF Wien seit dem 1. September 2026 nur ausserhalb der Stosszeiten: Montag bis Freitag von 9 bis 15 Uhr und ab 18.30 Uhr, am Wochenende und an Feiertagen ganztags. In Bim und Bus sind E-Scooter verboten, auch zusammengeklappt. Ein Verstoss kostet laut ORF 50 €.',
    },
    {
      question: 'Wie viel Promille sind auf dem E-Scooter in Österreich erlaubt?',
      answer: 'Weniger als 0,5 Promille, seit dem 1. Mai 2026; vorher waren es 0,8. Ab 0,8 Promille giltst du als beeinträchtigt, und die Strafe beginnt bei 800 €. Wer den Alkotest verweigert, zahlt wie bei 1,6 Promille 1600 bis 5900 €.',
    },
    {
      question: 'Gibt es in Wien ein Nachtfahrverbot für E-Scooter?',
      answer: 'Nein. Weder die E-Scooter-Verordnung noch die Infoseite der Stadt oder ihre Zonendaten nennen eines (Stand 25. Oktober 2026). Nachts gelten dieselben Regeln, dazu brauchst du Licht vorne und hinten.',
    },
    {
      question: 'Wie viele Leih-Scooter dürfen in der Wiener Innenstadt stehen?',
      answer: 'Laut E-Scooter-Verordnung höchstens 500 im 1. Bezirk und höchstens 1500 in den Bezirken 2 bis 9 und 20, Leih-Scooter und stationslose Leihräder zusammen. Die Infoseite der Stadt nennt dagegen 250 und 750 Scooter. Für die übrigen Bezirke nennt die Verordnung keine Obergrenze.',
    },
  ],
  sources: [
    { title: 'RIS: Strassenverkehrsordnung 1960, geltende Fassung', url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10011336' },
    { title: 'RIS: Verwaltungsstrafgesetz 1991, geltende Fassung', url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10005770' },
    { title: 'RIS: E-Scooter-Verordnung der Stadt Wien, Fassung ABl. 2025/19 (PDF)', url: 'https://www.ris.bka.gv.at/Dokumente/Gemeinderecht/GEMRE_WI_90101_W500_400_2025/GEMRE_WI_90101_W500_400_2025.pdf' },
    { title: 'Stadt Wien: Regeln für E-Scooter (aktualisiert 1.10.2026)', url: 'https://www.wien.gv.at/verkehr/scooter-roller-regeln' },
    { title: 'Stadt Wien, Presse: Scooter-Konzessionen an vier Betreiber (21.6.2023)', url: 'https://presse.wien.gv.at/presse/2023/06/21/sima-pipal-leixner-verwaltungsgericht-bestaetigt-stadt-wien-vergabe-der-scooter-konzessionen-an-vier-betreiber' },
    { title: 'Stadt Wien: WienMobil Rad', url: 'https://www.wien.gv.at/verkehr/wienmobil-rad' },
    { title: 'Stadt Wien, Open Data: Zonen für Leih-E-Scooter', url: 'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:ESCOOTPARKVERBOGD&srsName=EPSG:4326&outputFormat=json' },
    { title: 'Stadt Wien, Open Data: Abstellflächen für Leih-E-Scooter', url: 'https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:SCOOTERABSTELLOGD&srsName=EPSG:4326&outputFormat=json' },
    { title: 'BMIMI: StVO-Reform im Nationalrat beschlossen (25.3.2026)', url: 'https://www.bmimi.gv.at/service/presse/hanke/2026/0325-stvo.html' },
    { title: 'Bundesgärten: Parkordnung Schönbrunn (PDF, 2014)', url: 'https://www.bundesgaerten.at/dam/jcr:52ea76ae-8d3a-451c-973d-cd27a0923f4c/Sch%C3%B6nbrunn_Parkordnung.pdf' },
    { title: 'Bundesgärten: Parkordnung Belvedere (PDF, 2014)', url: 'https://www.bundesgaerten.at/dam/jcr:40067720-b549-4c10-8274-70e3bfac58ae/Belvedere_Parkordnung.pdf' },
    { title: 'Bundesgärten: Parkordnung Augarten (PDF, 2014)', url: 'https://www.bundesgaerten.at/dam/jcr:7def3e7e-b1e0-407a-a88c-dcb5b75c7160/Augarten_Parkordnung.pdf' },
    { title: 'RIS: Wiener Grünanlagenverordnung, ABl. 2008/28 (PDF)', url: 'https://www.ris.bka.gv.at/Dokumente/Gemeinderecht/GEMRE_WI_90101_L470_000_2008/GEMRE_WI_90101_L470_000_2008.pdf' },
    { title: 'ORF Wien: E-Scooter-Mitnahme eingeschränkt (30.8.2026)', url: 'https://wien.orf.at/stories/3369060/' },
    { title: 'Stadt Wien, Presse: Wiener Linien schränken E-Scooter-Mitnahme ein (30.8.2026)', url: 'https://presse.wien.gv.at/presse/2026/08/30/mehr-platz-in-den-oeffis-wiener-linien-schraenken-die-mitnahme-von-e-scootern-ein' },
    { title: 'ÖBB: Handbuch für Reisen in Österreich (gültig ab 15.10.2026)', url: 'https://www.oebb.at/static/tarife/de/handbuch_fuer_reisen_mit_den_oebb_in_oesterreich/index.html' },
    { title: 'Autorevue: E-Scooter in Wien, Anbieter im Vergleich', url: 'https://www.autorevue.at/ratgeber/e-scooter-wien-vergleich' },
    { title: 'Bolt: Wien', url: 'https://bolt.eu/de-at/cities/vienna/' },
    { title: 'Dott: Städte', url: 'https://ridedott.com/locations/' },
  ],
};

export default guide;
