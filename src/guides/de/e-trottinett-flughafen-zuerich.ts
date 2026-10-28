import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-flughafen-zuerich',
  topic: 'zurich-airport',
  name: 'E-Trottinett Flughafen Zürich, Kloten und Opfikon',
  title: 'E-Trottinett Flughafen Zürich 2026: Kloten, Opfikon, Zonen',
  description: 'E-Trottinett Flughafen Zürich: warum Miet-Trottis dort gesperrt sind, wer in Kloten und Opfikon fährt, was zehn Minuten kosten und wo du parkierst.',
  headline: 'E-Trottinett am Flughafen Zürich, in Kloten und Opfikon: Sperrzone, Anbieter, Preise und Parkieren',
  lede: 'Mit einem gemieteten E-Trottinett kommst du nicht bis an den Flughafen Zürich: Auf Verlangen der Flughafen Zürich AG ist er für Sharing-Trottis gesperrt, vom Bahnhof über Airport Center und Check-in bis The Circle. Rundherum fährst du: Am Mittag des 28. Oktober 2026 zeigte die Karte in Kloten rund 220 Trottis von Bolt, Lime, Bird, Hopp, Dott und Voi, in Opfikon-Glattbrugg rund 150 von Dott, Bolt, Voi und Lime. Meist zahlst du CHF 1.– fürs Entsperren und 41 oder 42 Rappen pro Minute, zehn Minuten kosten also CHF 5.10 bis 5.20 (veröffentlichte Tarife vom 22. Oktober 2026).',
  published: '2026-10-23',
  updated: '2026-10-28',
  city: 'ch:kloten',
  sections: [
    {
      heading: 'Darf man mit dem E-Trottinett zum Flughafen Zürich fahren?',
      blocks: [
        'Mit einem Miet-Trotti nicht. Der Stadtrat von Kloten hält in einem Beschluss vom 18. März 2025 fest, die Zufahrt zum Flughafen Zürich sei für E-Scooter «auf Verlangen der Flughafen Zürich AG gesperrt». Die Velos von PubliBike dürfen dagegen hinfahren.',
        'Die Sperrzone steckt in den Daten der Anbieter. Bei Bird, Bolt und Voi ist es dieselbe Fläche von gut einem halben Quadratkilometer. Laut unserer Auswertung vom 22. Oktober 2026 reicht sie vom Bahnhof Flughafen mit der Tram- und Bushaltestelle über das Airport Center und die Vorfahrten von Check-in 1 und 2 bis zu The Circle, zum Parkhaus P6, zur Haltestelle Fracht und zum Aussichtspunkt Butzenbüel. Auch Lime und Hopp sperren den Flughafen, und Dotts Gebiet endet vor dem Flughafen.',
        { note: 'In einer Fahrverbotszone fährt das Trotti nicht weiter, und beenden kannst du die Fahrt dort auch nicht: Die Minuten laufen weiter. Beende die Fahrt also vor der Sperrzone und nimm für das letzte Stück Bus, Tram oder Zug.' },
        'Das letzte Stück ist kurz: Ab Kloten Bahnhof fährt der Bus in rund 6 Minuten an den Flughafen, ab Glattbrugg das Tram 10 oder 12 in 5 bis 6 Minuten und ab Zürich Oerlikon der Zug in 4 bis 6 Minuten (Fahrplan, Oktober 2026).',
      ],
    },
    {
      heading: 'E-Scooter in Kloten und Opfikon: Anbieter und Regeln der Städte',
      blocks: [
        'Kloten und Opfikon entscheiden selbst, wer bei ihnen Trottis vermieten darf. Die Tabelle zeigt, was die [Karte von Kloten](map:ch:kloten) und die [Karte von Opfikon](map:ch:opfikon) am Mittag des 28. Oktober 2026 zeigten; die Zahlen sind eine Momentaufnahme, keine Flottengrössen.',
        {
          table: {
            caption: 'Wer in Kloten und Opfikon fährt und was die Städte vorschreiben (Karte vom Mittag des 28. Oktober 2026)',
            head: ['Stadt', 'Auf der Karte', 'Regeln der Stadt'],
            rows: [
              ['Kloten', 'Rund 220 Trottis: Bolt und Lime je rund 50, Bird, Hopp und Dott je rund 40, Voi 8', 'Betriebsbewilligung der Stadt (im März 2025 für CHF 300.–), höchstens 50 Trottis pro Anbieter, seit dem 1. September 2025 eine Gebühr von 20 Rappen pro Trotti und Tag'],
              ['Opfikon mit Glattbrugg und Glattpark', 'Rund 150 Trottis: Dott rund 45, Bolt, Voi und Lime je rund 35, dazu ein E-Trottinett aus dem Zürcher Angebot von PubliBike', 'Seit dem 1. Januar 2025 eine Vereinbarung mit der Stadt für drei Jahre, höchstens vier Anbieter und 160 Trottis insgesamt, keine Gebühr für den öffentlichen Grund'],
            ],
          },
        },
        'Opfikon hat alle vier Plätze vergeben, nennt die Anbieter aber nicht. Opfikons Zonen stehen in den Daten von Dott, Voi, Bolt und Lime; Hopp führt Opfikon in seinen Daten nicht als Gebiet.',
        'In Kloten nannte die Stadt im März 2025 Voi, Bird, Bolt, Lime und Dott. Hopp fehlt in dieser Liste. Limes Trottis in Kloten stehen in keinem offenen Datenfeed; seit dem 28. Oktober 2026 liest ScootRadar sie aus der Karte in Limes App. Alle anderen Anbieter liest ScootRadar aus ihren offenen Daten, und die Karte zeigt nur Trottis, keine E-Bikes. Bolt, Bird, Dott, Lime und Voi vermieten ab 18; gemietet wird in der App des Anbieters, jeden Schritt erklärt der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in Kloten und Opfikon?',
      blocks: [
        'Die Tabelle zeigt die Tarife aus den offenen Daten der Anbieter für Kloten und Opfikon vom Abend des 22. Oktober 2026. Massgebend ist der Preis, den dir die App vor dem Entsperren zeigt.',
        {
          table: {
            caption: 'Veröffentlichte Tarife in Kloten und Opfikon vom 22. Oktober 2026',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', 'CHF 1.–', '41 Rappen', 'CHF 5.10', 'CHF 9.20'],
              ['Bolt', 'CHF 1.–', '42 Rappen, einzelne Trottis 48', 'CHF 5.20', 'CHF 9.40'],
              ['Voi', 'CHF 1.–', '42 Rappen', 'CHF 5.20', 'CHF 9.40'],
              ['Hopp (Kloten)', 'CHF 1.–', '42 Rappen', 'CHF 5.20', 'CHF 9.40'],
              ['Lime (Opfikon)', 'CHF 1.–', 'Meist 49 Rappen, einzelne Trottis 42, ohne Steuern', 'in der App', 'in der App'],
              ['Lime (Kloten)', 'nicht veröffentlicht', 'in der App', 'in der App', 'in der App'],
              ['Bird (Kloten)', 'nicht veröffentlicht', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Die Minuten laufen, bis du die Fahrt beendest, auch am Rotlicht und in einer Parkverbotszone.',
      ],
    },
    {
      heading: 'Sperrzonen und Langsamfahrzonen: Flughafen, Bahnhöfe, Glatt',
      blocks: [
        'Kloten gibt den Anbietern seine Zonen über die Plattform Vianova vor, Opfikon mit einer eigenen Karte vom 21. September 2026. Die Tabelle fasst beides mit unserer Auswertung der Anbieterdaten vom 22. Oktober 2026 zusammen; massgebend sind die Farben in der App.',
        {
          table: {
            caption: 'Zonen rund um den Flughafen Zürich, Stand 22. Oktober 2026',
            head: ['Ort', 'Was gilt', 'Quelle'],
            rows: [
              ['Flughafen: Bahnhof, Airport Center, Check-in 1 und 2, The Circle, P6, Butzenbüel', 'Fahrverbot, Fahrt beenden nicht möglich', 'Stadt Kloten, Daten von Bird, Bolt, Voi, Lime und Hopp'],
              ['Bahnhof Kloten', 'Fahrverbot auf dem Perron; Parkverbot bei Dott und Hopp, bei Voi nur auf Voi-Plätzen; Bolt drosselt im Bahnhof auf 1 km/h', 'Daten der Anbieter'],
              ['Kloten Zentrum: Stadtplatz und Schluefweg', 'Parkverbot auf dem Stadtplatz und vor dem Eingang des Schluefwegs; am Stadtplatz 10 km/h', 'Stadt Kloten, Daten von Bolt, Dott, Lime und Voi'],
              ['Schulhäuser in Kloten, etwa Dorf, Feld und Nägelimoos', 'Bolt drosselt auf 5 km/h', 'Daten von Bolt'],
              ['Die Glatt durch ganz Opfikon', 'Fahrverbot', 'Karte der Stadt Opfikon'],
              ['Wald östlich von Opfikon', 'Fahrverbot', 'Karte der Stadt Opfikon'],
              ['Glattpark und Opfikerpark', 'Langsamfahrzone; im Opfikerpark 10 km/h bei Bolt, Dott und Lime, 5 km/h bei Voi', 'Karte der Stadt Opfikon, Daten der Anbieter'],
              ['Bahnhof Zürich Oerlikon', 'Parkverbot', 'Daten von Bird, Bolt, Dott, Hopp und Voi'],
            ],
          },
        },
        'Die Glatt zieht sich vom Opfikerpark bis Glattbrugg quer durch die Stadt, und der Streifen entlang des Flusses ist auf der ganzen Länge Fahrverbotszone. Hinüber kommst du auf den Brücken; parkieren darfst du dort nicht.',
      ],
    },
    {
      heading: 'E-Trottinett parkieren in Kloten und Opfikon',
      blocks: [
        '**Opfikon** hat seit 2025 ein Mischsystem. An acht Orten parkierst du nur in der markierten Parkierungszone, rundherum gilt ein Parkverbot:',
        {
          list: [
            'Stadthaus beim Spielplatz;',
            'Bahnhof Glattbrugg, Nord und Süd;',
            'Bahnhof Opfikon, Nord und Süd;',
            'Lindbergh-Platz und Lindbergh-Allee im Glattpark;',
            'Sirius-Platz im Opfikerpark.',
          ],
        },
        'Im übrigen Stadtgebiet stellst du das Trotti am Rand des Trottoirs ab, wenn 1,50 m für Fussgänger frei bleiben. Trottoirkante, Hydranten, Bushaltestellen, Ladezonen und Hauseingänge darf es nicht versperren.',
        'In **Kloten** gilt ein Parkverbot rund um die Bushaltestellen, auf regionalen Velowegen, auf dem Stadtplatz, vor dem Eingang des Schluefwegs und auf Privatgrund, wenn der Eigentümer es verlangt. Sonst gelten die Schweizer Regeln: auf dem Trottoir nur mit 1,50 m Platz, sonst CHF 20.– Busse.',
        'Ein falsch abgestelltes Trotti meldest du in Opfikon auf [trotti-melder.ch](https://trotti-melder.ch), die Meldung geht an den Anbieter. In Kloten schreibst du der Stadt eine E-Mail mit Anbieter, genauem Ort und Foto; die Adresse steht auf der [Seite der Stadt Kloten](https://www.kloten.ch/mobilitaetparkieren/57977). In Kloten müssen die Anbieter falsch abgestellte Trottis innert 48 Stunden einsammeln, in Opfikon störende in der Regel innert zwei bis fünf, höchstens zwölf Stunden.',
      ],
    },
    {
      heading: 'Unterwegs: The Circle, Glattpark, Oerlikon und Zürich',
      blocks: [
        {
          list: [
            '**Zur Arbeit am Flughafen und im Circle:** Mit dem Trotti bis vor die Sperrzone, etwa nach Kloten oder Glattbrugg, dann weiter mit Bus oder Tram.',
            '**Bahnhöfe:** Auf dem Bahnhofareal steigst du ab; die SBB verbietet das Fahren auf Perrons, Rampen und in Unterführungen.',
            '**Glattbrugg und Glattpark:** Das Tram 10 und das Tram 12 der Glattalbahn verbinden beide in 5 bis 9 Minuten mit dem Flughafen. Am Lindbergh-Platz und am Sirius-Platz parkierst du nur in der Zone.',
            '**Nach Oerlikon:** Bolt und Dott führen Kloten, Opfikon und die Stadt Zürich als ein Gebiet. Du kannst also von Glattbrugg (Luftlinie 2,4 km) oder vom Glattpark (1,4 km) nach Oerlikon fahren und die Fahrt dort beenden, nur nicht am Bahnhof Oerlikon: Dort gilt ein Parkverbot.',
            '**Weiter nach Zürich:** In der Stadt gelten Zürichs eigene Zonen; die stehen unter [E-Trottinett in Zürich](guide:zurich), die Trottis zeigt die [Karte von Zürich](map:ch:zurich). Vom Bahnhof Kloten bis Oerlikon sind es Luftlinie rund 5 km, die S7 braucht 7 Minuten.',
            '**Bird und Hopp** führen in ihren Daten nur Kloten als Gebiet: Mit ihnen beendest du die Fahrt wieder in Kloten.',
            '**Lime** führt Kloten und Opfikon in seinen Daten als getrennte Zonen: Prüfe in der App, bevor du über die Stadtgrenze fährst.',
          ],
        },
      ],
    },
    {
      heading: 'Regeln und Bussen für E-Trottinette rund um den Flughafen',
      blocks: [
        'Auf der Strasse gilt in Kloten und Opfikon das Schweizer Recht: Ein Trotti fährt wie ein Velo.',
        {
          list: [
            '**Ab 18** bei Bolt, Bird, Dott, Lime und Voi. Das Gesetz: ab 16 ohne Führerausweis, mit 14 und 15 nur mit dem Ausweis der Kategorie M.',
            '**Bis 20 km/h** unterstützt der Motor; in Langsamfahrzonen drosselt ihn der Anbieter.',
            '**Velostreifen oder Veloweg**, sonst die Strasse. **Nie aufs Trottoir**: CHF 40.–.',
            '**Fussgängerzone** nur mit Zusatztafel für Velos und im Schritttempo, sonst CHF 30.–.',
            '**Nur eine Person** pro Trotti.',
            '**Licht an**, auch am Tag: Ohne kostet es tagsüber CHF 20.–.',
            '**Rotlicht**: CHF 60.–. **Handy in der Hand**: CHF 40.–.',
            '**Helm** empfohlen, keine Pflicht. Ab **0,5 Promille** droht ein Strafverfahren statt einer Ordnungsbusse.',
          ],
        },
        'Alle Bussen und Altersgrenzen stehen in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'PubliBike und Velo: Alternativen am Flughafen',
      blocks: [
        'Ans Terminal kommst du mit dem Velo. PubliBike darf laut Kloten an den Flughafen fahren, und laut den Daten von PubliBike steht eine Station direkt beim Bahnhof Flughafen. Opfikon hat sieben PubliBike-Stationen, etwa an den Bahnhöfen Glattbrugg und Opfikon, am Sirius-Platz und beim Hotel Hilton Zurich Airport. Zurückgeben kannst du das Velo an jeder Station in Opfikon, Zürich, Kloten, Wallisellen oder Dübendorf.',
        'Für dein eigenes Velo hat der Flughafen an fünf Orten Gratis-Abstellplätze: am Ringweg und auf der Vorfahrt von The Circle, bei der Busstation und beim Parkhaus P6. Wer am Flughafen arbeitet, bestellt über den Arbeitgeber eine Dauerkarte für die abschliessbaren Veloräume in P3, P6 und am Ringweg beim Circle. Velos, die länger als zwölf Wochen stehen, räumt der Flughafen laut Parkingordnung ohne Verwarnung weg und kann dafür CHF 50.– verlangen.',
      ],
    },
    {
      heading: 'Warum Kloten und Opfikon die Zahl der Trottis begrenzen',
      blocks: [
        'Im März 2025 zählte Kloten täglich rund 160 E-Scooter und 40 Züri Velos in der Stadt. Neben der Obergrenze setzt die Stadt auf Gebühren: Für jedes Trotti ab dem 61. zahlt ein Anbieter einen Franken pro Tag, und stehen Trottis trotz Aufforderung nach 48 Stunden noch da, kann die Stadt sie für CHF 80.– pro Stück einsammeln.',
        'Bis Ende 2024 hatte Opfikon Vereinbarungen mit Bolt, Lime, Tier und Voi und kündigte alle auf diesen Termin, weil Trottis immer wieder an unerwünschten Orten standen. Seit dem 1. Januar 2025 setzt die Stadt auf höchstens vier Anbieter und feste Parkierungszonen.',
      ],
    },
  ],
  faq: [
    {
      question: 'Kann ich ein Miet-Trotti am Flughafen Zürich abstellen?',
      answer: 'Nein. Der ganze Flughafenkopf vom Bahnhof über Check-in 1 und 2 bis The Circle und Parkhaus P6 ist für Miet-Trottis eine Fahrverbotszone. Beende die Fahrt vorher, etwa in Kloten oder Glattbrugg, und nimm Bus oder Tram.',
    },
    {
      question: 'Welche E-Scooter gibt es in Kloten?',
      answer: 'Am Mittag des 28. Oktober 2026 zeigte die Karte in Kloten Trottis von Bolt, Lime, Bird, Hopp, Dott und Voi. Jeder Anbieter braucht eine Bewilligung der Stadt und darf höchstens 50 Trottis aufstellen.',
    },
    {
      question: 'Welche Anbieter dürfen in Opfikon und Glattbrugg vermieten?',
      answer: 'Höchstens vier Anbieter mit einer Vereinbarung; laut Stadt sind alle Plätze vergeben. Die Namen nennt sie nicht, Opfikons Zonen stehen aber in den Daten von Dott, Voi, Bolt und Lime.',
    },
    {
      question: 'Kann ich mit dem Trotti von Glattbrugg nach Zürich Oerlikon fahren?',
      answer: 'Ja, mit Bolt oder Dott: Ihr Gebiet reicht über die Stadtgrenze, du kannst die Fahrt in Zürich beenden. Am Bahnhof Oerlikon selbst gilt aber ein Parkverbot.',
    },
    {
      question: 'Warum lässt mich die App die Fahrt nicht beenden?',
      answer: 'Du stehst in einer Park- oder Fahrverbotszone oder ausserhalb des Gebiets deines Anbieters: etwa am Flughafen, an den Bahnhöfen Glattbrugg und Opfikon neben den Parkierungszonen oder mit Bird und Hopp ausserhalb von Kloten. Die Minuten laufen weiter, bis du einen erlaubten Platz erreichst; die App zeigt dir die Zonen.',
    },
  ],
  sources: [
    { title: 'Stadtrat Kloten: Beschluss 89-2025, Gebühr für E-Scooter (PDF)', url: 'https://www.kloten.ch/_rte/dokument/5617204' },
    { title: 'Stadt Kloten: Gebührenreglement SRS 6.4-1.9, Art. 24', url: 'https://kloten.tlex.ch/app/de/texts_of_law/6.4-1.9' },
    { title: 'Stadt Kloten: E-Scooter und Shared Mobility', url: 'https://www.kloten.ch/mobilitaetparkieren/57977' },
    { title: 'Stadt Opfikon: Reglement über E-Scooter-Sharing (PDF)', url: 'https://www.opfikon.ch/_rte/dokument/5332909' },
    { title: 'Stadt Opfikon: Karte der Zonen vom 21. September 2026 (PDF)', url: 'https://www.opfikon.ch/_rte/dokument/7259647' },
    { title: 'Stadt Opfikon: E-Scooter', url: 'https://www.opfikon.ch/dienstleistungen/110935' },
    { title: 'Stadtrat Opfikon: Beschluss 2024-229 (PDF)', url: 'https://www.opfikon.ch/_rte/dokument/5311654' },
    { title: 'Stadt Opfikon: Sharing-Angebote', url: 'https://www.opfikon.ch/mobilitaet/27956' },
    { title: 'Flughafen Zürich: Mit dem Velo an den Flughafen', url: 'https://www.flughafen-zuerich.ch/de/zrh-staff/arbeitsweg-und-sicherheit/arbeitsweg/velo' },
    { title: 'Flughafen Zürich AG: Parkingordnung Fahrradabstellplätze (PDF)', url: 'https://www.flughafen-zuerich.ch/-/jssmedia/airport/portal/dokumente/passagiere/praktisches/parkieren-und-transport/parkingordnung_fahrradabstellpltze-fzag-2018_de.pdf?vs=1' },
  ],
};

export default guide;
