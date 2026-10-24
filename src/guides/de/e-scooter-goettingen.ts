import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-goettingen',
  topic: 'goettingen',
  name: 'E-Scooter Göttingen: Anbieter, Preise, Parkverbote',
  title: 'E-Scooter Göttingen 2026: Yoio, Qick, Preise, Parkzonen',
  description: 'E-Scooter Göttingen: was Yoio pro Minute kostet, wo du in der Innenstadt fahren darfst, wo du am Wall und am Bahnhof parkst und was im Bus gilt.',
  headline: 'E-Scooter Göttingen: Yoio, Preise, Parkverbotszonen und was in der Innenstadt gilt',
  lede: 'Einen E-Scooter in Göttingen leihst du ab 18 und ohne Führerschein bei Yoio, einem Anbieter aus Göttingen, oder Qick; auch Bolt führt die Stadt auf seiner Website mit E-Scootern. Laut Yoios Datenfeed vom 23. Oktober 2026 kostet das Entsperren 1 € und die Minute je nach Scooter 0,25 € oder 0,21 €; zehn Minuten kosten also 3,50 € oder 3,10 €. Du fährst auf dem Radweg oder der Fahrbahn, nie auf dem Gehweg und nie in der Fussgängerzone um Weender Strasse und Markt. Eine Yoio-Fahrt beendest du im Gebiet der App, aber nicht in der Fussgängerzone, auf weiten Teilen des Walls, im Leinepark und direkt vor dem Bahnhofsgebäude.',
  published: '2026-10-24',
  updated: '2026-10-25',
  city: 'de:Göttingen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Göttingen?',
      blocks: [
        'Im Oktober 2026 vermietet **Yoio** E-Scooter in Göttingen. Yoio gehört der YourCar GmbH mit Sitz in Göttingen; ausser hier fährt Yoio laut Website in Freiburg und [Erfurt](guide:erfurt). Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '**Bolt** führt Göttingen auf seiner Website mit der Kategorie «E-Scooter» (Stand 23. Oktober 2026). Die Stadt nennt keine Anbieter, einen offenen Bolt-Datenfeed für Göttingen gibt es nicht. Ob Bolt-Scooter in deiner Nähe stehen und was sie kosten, zeigt nur die Bolt-App.',
        '**Qick** aus Schweden hat ebenfalls E-Scooter in Göttingen. Die [Karte von Göttingen](map:de:Göttingen) zeigt Yoio und seit dem 24. Oktober 2026 auch Qick: in der Nacht zum 25. Oktober rund 250 Yoio- und 340 Qick-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Qicks Preis zeigt nur die App; Bolt fehlt auf der Karte. Weitere Anbieter konnten wir nicht prüfen.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Göttingen?',
      blocks: [
        'Yoio veröffentlicht seine Tarife im offenen Datenfeed. Am Abend des 23. Oktober 2026 listete der Feed für jeden Scooter 1 € fürs Entsperren, den Minutenpreis aber je Scooter: 0,25 € für 154 Scooter, 0,21 € für 113. Beide Preise fanden wir bei beiden Scootermodellen und überall im Gebiet; warum, erklärt Yoio nicht. Seine Gebührenordnung nennt keine Fahrpreise. Laut Yoios Hilfe kann der Minutenpreis variieren und steht in der App auf dem Button «Fahrt starten».',
        {
          table: {
            caption: 'E-Scooter-Preise in Göttingen (Yoio-Datenfeed, 23. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Yoio, die meisten Scooter', '1,00 €', '0,25 €', '3,50 €', '6,00 €'],
              ['Yoio, rund zwei von fünf Scootern', '1,00 €', '0,21 €', '3,10 €', '5,20 €'],
            ],
          },
        },
        'Bei Yoio zählt laut AGB jede angefangene Minute. Mehr als 19,99 € kostet eine Fahrt laut Feed nicht. Mit einer Jahreskarte des örtlichen Nahverkehrs gibt es laut Yoios Gebührenordnung (Stand 2021) 25 € Guthaben im Jahr. Verbindlich ist der Preis, den die App vor dem Start zeigt.',
      ],
    },
    {
      heading: 'Wo darf man in Göttingen mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Wo eine Fussgängerzone beginnt und endet, legt die Stadt mit ihren Verkehrsschildern fest; die Schilder vor Ort gehen jeder Karte vor.',
        '**Innenstadt:** Laut Stadtplan der Stadt für Radfahrende (Stand 2020) dürfen in der Fussgängerzone I nicht einmal Fahrräder fahren: Weender Strasse etwa ab der Jacobikirche, Markt, Kornmarkt und Kurze Strasse. Dort schiebst du. In der übrigen Innenstadt dürfen Fahrräder laut Stadt fast überall fahren, in vielen Gassen nur in einer Richtung. Ob das auch für dich gilt, hängt am Schild.',
        '**Achtung bei «Radverkehr frei»:** Yoios Hilfe schreibt auf einer Seite, das Schild «Fahrräder frei» gelte auch für E-Scooter. Heute stimmt das höchstens in Einbahnstrassen: Lässt ein Zusatzschild Radfahrende gegen die Fahrtrichtung fahren, darfst du das laut Strassenverkehrs-Ordnung auch mit dem E-Scooter, die E-Scooter-Verordnung verlangt dafür aber bis Ende Februar 2027 «Elektrokleinstfahrzeuge frei». Gehwege und Fussgängerzonen, die nur für den Radverkehr frei sind, bleiben für dich bis zum 28. Februar 2027 tabu. **Ab 1. März 2027** gilt «Radverkehr frei» dort und auf Busspuren auch für E-Scooter, auf Gehwegen und in Fussgängerzonen im Schritttempo. Laut Bundesverkehrsministerium können Kommunen E-Scooter dort aber eigens verbieten; ob Göttingen das vorhat, hat die Stadt nicht gesagt (Stand Oktober 2026).',
        '**Radschnellweg und Fahrradstrassen:** Der Radschnellweg führt laut Stadt vom Bahnhof zum Universitätsklinikum und zu den grossen Uni-Einrichtungen. In Fahrradstrassen wie der Gosslerstrasse sind laut Stadt Fahrräder und Elektrokleinstfahrzeuge zugelassen.',
        '**Sparkassen-Arena:** Auf einer kleinen Fläche an der Halle darfst du mit Yoio laut Datenfeed vom 23. Oktober 2026 weder starten noch beenden noch durchfahren. Diese Sperre setzt Yoio in seiner App.',
      ],
    },
    {
      heading: 'E-Scooter in Göttingen abstellen: Innenstadt, Wall, Bahnhof, Campus',
      blocks: [
        'Wo du eine Yoio-Fahrt beenden darfst, legt Yoio in der App fest: im grünen Gebiet, nicht in den roten Parkverbotszonen. Nach unserer Auswertung des Datenfeeds vom 23. Oktober 2026 ist das Fahrtende gesperrt in der Fussgängerzone I und am Wilhelmsplatz, auf weiten Teilen des Walls mit Cheltenhampark und Albaniplatz, im Leinepark und entlang der Leine, vor dem Bahnhofsgebäude und auf dem Platz vor der SUB zum Nikolausberger Weg hin. In manchen Gassen der Innenstadt lässt die App das Fahrtende zu; Yoios Regeln verbieten das Abstellen in jeder Fussgängerzone trotzdem. Die genauen Grenzen zeigt dir nur die App.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung des Yoio-Datenfeeds, 23. Oktober 2026)',
            head: ['Ort', 'Fahrt mit Yoio beenden?'],
            rows: [
              ['Weender Strasse, Markt mit Gänseliesel, Kornmarkt', 'Nein, Parkverbotszone'],
              ['Wall, Cheltenhampark, Albaniplatz', 'Auf weiten Teilen nein, Parkverbotszone'],
              ['Bahnhof', 'Nein vor dem Empfangsgebäude und an den Gleisen; ja weiter östlich auf dem Bahnhofsplatz Richtung Berliner Strasse und auf der Westseite an der Bahnhofsallee'],
              ['Leinepark', 'Nein, Parkverbotszone oder ausserhalb des Gebiets'],
              ['Zentralcampus am Platz der Göttinger Sieben, Nordcampus', 'Ja'],
              ['Universitätsmedizin (UMG), Robert-Koch-Strasse', 'Ja'],
              ['Neues Rathaus, PFH, Badeparadies Eiswiese', 'Ja'],
              ['Grone, Holtenser Berg, Rosdorf, Bovenden', 'Ja, in Teilgebieten; in Bovenden nicht am Rathausplatz'],
              ['Kiessee, Kauf Park, Kehr am Hainberg', 'Nein, ausserhalb des Geschäftsgebiets'],
            ],
          },
        },
        'Die Stadt markiert eigene Flächen. Am 1. Juli 2026 meldete sie eine neue auf dem Bahnhofsvorplatz: am nordöstlichen Ende, auf der kleinen Freifläche östlich der Pergola, wo der Radschnellweg ankommt; daneben bleibt ein 2,5 m breiter Fussweg frei. Seit November 2025 gibt es drei Mobilitätsstationen mit Fahrradbügeln und eigenen E-Scooter-Flächen: Goethe-Allee/Prinzenstrasse vor dem historischen Gebäude der Universitätsbibliothek, Gosslerstrasse/Beyerstrasse und Friedländer Weg an der Arnoldi-Schule. Weitere Flächen prüft die Stadt. Auf dem Zentralcampus weist das Gebäudemanagement der Universität laut einer undatierten Uni-Seite eigene E-Scooter-Plätze aus, damit die Fahrradständer frei bleiben.',
        'Auch ausserhalb markierter Flächen musst du laut Stadtbaurat Frithjof Look so parken, dass niemand behindert oder gefährdet wird. Auf dem Gehweg bleiben laut Yoio mindestens 2 m frei, höchstens drei Scooter stehen nebeneinander. Tabu sind laut Yoio auch Blindenleitstreifen, Bahnhofseingänge, Bussteige, Parks, Grünstreifen und öffentliche Fahrradständer. Am Ende fotografierst du den Scooter in der App; die Ortung kann laut Yoio bis zu 30 m danebenliegen.',
        'Stellst du ausserhalb des Gebiets ab, berechnet Yoio laut Gebührenordnung (Stand 2021) nach Aufwand mindestens 50 €; parkt Yoio einen falsch abgestellten Scooter um, kostet das 50 €. Einen störenden Yoio-Scooter meldest du unter 0551 2887 9614.',
      ],
    },
    {
      heading: 'Wer regelt was? Bund, Niedersachsen, Stadt, Uni und Yoio',
      blocks: [
        {
          list: [
            '**Bund:** Verkehrsregeln und Bussgelder. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Stadt kann es dann als Sondernutzung genehmigen.',
            '**Land Niedersachsen:** das Niedersächsische Strassengesetz, Grundlage der städtischen Sondernutzungssatzungen.',
            '**Stadt Göttingen:** Fussgängerzone, Fahrradstrassen, Verkehrsschilder und die markierten Abstellflächen.',
            '**Universität und Universitätsmedizin:** die E-Scooter-Plätze auf dem Zentralcampus und die Hausordnung auf dem Klinikgelände.',
            '**Yoio und Qick:** Geschäftsgebiet, Park- und Fahrverbotszonen in der App, Preise und Gebühren.',
            '**Verkehrsverbund Süd-Niedersachsen (VSN):** die Mitnahme in Bus und Bahn, auch in den Bussen der GöVB.',
          ],
        },
        'Eine Obergrenze, eine Gebühr, eine Vereinbarung mit den Anbietern oder eine Ausschreibung für Leih-E-Scooter nennt die Stadt auf ihren Internetseiten nicht (Stand 23. Oktober 2026). Ihre Sondernutzungssatzung und die Gebührensatzung, beide in der Fassung ab 1. Januar 2025, erwähnen E-Scooter nicht. Wer Yoios Parkverbotszonen festlegt und was die Stadt ab März 2027 plant, ist nicht veröffentlicht. Beschlüsse im Ratsinformationssystem konnten wir nicht prüfen.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Göttingen: Bussgelder und Alkohol',
      blocks: [
        'In Göttingen gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Falsch abgestellt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'Auf Geh- oder Radweg 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0. Yoio verbietet in seinen AGB jeden Alkohol und empfiehlt auf seiner Website einen Helm.',
        'Alles Weitere steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Bus, Bahnhof, Uni und Klinikum: Tipps für Göttingen',
      blocks: [
        '**Bus:** In den Bussen der GöVB und allen anderen Bussen im VSN fährt ein E-Scooter, der kleiner als ein Fahrrad ist, kostenlos mit, wenn Platz ist (Beförderungsbedingungen, Stand August 2025). Ersatzakkus sind verboten. In den Regionalzügen im VSN fährt er zusammengeklappt als Gepäck kostenlos mit, sonst zählt er als Fahrrad und kostet.',
        '**Vom Bahnhof zur Uni:** Über den Radschnellweg kommst du zum Klinikum und zum Nordcampus; an der UMG und am Nordcampus beendest du die Fahrt direkt. Auf den Verkehrsflächen der UMG gilt laut ihrer Hausordnung die Strassenverkehrs-Ordnung: Halte Rettungswege frei, falsch abgestellte Fahrzeuge lässt die UMG abschleppen, und in die Klinikgebäude darf kein Fahrzeug.',
        '**Ausflüge:** Kiessee, Kauf Park und die Kehr am Hainberg liegen laut Datenfeed ausserhalb des Gebiets; dort beendest du keine Fahrt. Yoio vermietet laut Datenfeed rund um die Uhr; eine Nachtsperre oder Wintersaison nennen weder Stadt noch Yoio. Bei schlechtem Wetter kann Yoio die Nutzung laut AGB einschränken.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Göttingen',
      blocks: [
        {
          list: [
            '**Das Gänseliesel wurde 2026 125 Jahre alt**, so Göttingen Tourismus zum Gänseliesel-Fest im September. Den Markt rund um den Brunnen sperrt Yoio fürs Abstellen.',
            '**Göttingen fährt Rad:** Laut Stadt fahren 36 Prozent der Einwohner regelmässig Rad. Den Radschnellweg räumt sie im Winter bevorzugt, und bei viel Radverkehr gibt es dort eine grüne Welle.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Göttingen?',
      answer: 'Yoio oder Qick; freie Scooter beider zeigt auch die [Live-Karte von Göttingen](map:de:Göttingen). Bolt führt Göttingen auf seiner Website ebenfalls mit E-Scootern, ob dort welche stehen, zeigt nur die Bolt-App. Du musst 18 sein, einen Führerschein brauchst du nicht.',
    },
    {
      question: 'Was kostet Yoio in Göttingen pro Minute?',
      answer: '1 € fürs Entsperren und je nach Scooter 0,25 € oder 0,21 € pro Minute, laut Yoios Datenfeed vom 23. Oktober 2026. Zehn Minuten kosten damit 3,50 € oder 3,10 €, eine Fahrt höchstens 19,99 €. Den Minutenpreis des Scooters zeigt dir die App vor dem Start.',
    },
    {
      question: 'Wo kann ich in Göttingen einen E-Scooter abstellen?',
      answer: 'Bei Yoio im grünen Gebiet der App, auf dem Gehweg mit 2 m Platz für Fussgänger, am besten auf den markierten Flächen der Stadt am Bahnhof und an den Mobilitätsstationen. Gesperrt sind laut Yoios Datenfeed unter anderem Weender Strasse, Markt, Kornmarkt, weite Teile des Walls, der Leinepark und der Platz direkt vor dem Bahnhofsgebäude.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Weender Strasse fahren?',
      answer: 'Nicht zwischen Jacobikirche und Markt: Dieser Abschnitt gehört laut Stadtplan der Stadt (Stand 2020) zur Fussgängerzone I, in der nicht einmal Fahrräder fahren dürfen. Massgeblich sind die Schilder vor Ort. Daran ändert auch der 1. März 2027 nichts, solange dort keine Freigabe für Fahrräder gilt.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus mitnehmen?',
      answer: 'Ja, deinen eigenen: In den Bussen der GöVB fährt ein E-Scooter, der kleiner als ein Fahrrad ist, laut den Bedingungen des VSN kostenlos mit, wenn Platz ist. Ersatzakkus darfst du nicht mitnehmen. Eine Leih-Fahrt beendest du vor dem Einsteigen.',
    },
  ],
  sources: [
    { title: 'Stadt Göttingen: Stadt markiert E-Scooter-Abstellflächen (1. Juli 2026)', url: 'https://www.goettingen.de/portal/meldungen/stadt-markiert-e-scooter-abstellflaechen-900005209-25480.html' },
    { title: 'Stadt Göttingen: Erste Mobilitätsstationen (17. November 2025)', url: 'https://www.goettingen.de/portal/meldungen/stadt-goettingen-richtet-erste-mobilitaetsstationen-ein-900004559-25480.html' },
    { title: 'Stadt Göttingen: Radfahren, mit Stadtplan für Radfahrende (Stand 2020)', url: 'https://www.goettingen.de/portal/seiten/radfahren-900000042-25480.html' },
    { title: 'Stadt Göttingen: Sondernutzungsgebührensatzung, Fassung ab 1. Januar 2025 (PDF)', url: 'https://www.goettingen.de/downloads/datei/N2Q2YTMwNTBhNDQwNWQ1Nk5td1VLZmdWSDh2aUZVVTZPSEVMVGtXeDNoQ2pMMU9nbGFjQkNvQUozZDZZZ05zZFI3U0x3OXBNWlVpYUFjNHZMQmp2OXA1Q0FFNXhMZFBQS3BpTnhRRGRwUTNjWm45bU1VVW1HaXR0RDU1ZWtjdDlsS0kxWFIzTG5uM2h6RnJUOEtYNkt4c3BHY2RWeU5qcHBFWmFLeWtxQzgxZ240aTROc2RkTXVjc3VBTVZFV2pCcUhhZlU2RU80dk5ORVVCcTVzTVFHWGNYaGVhZlpxOFJ3V2hOaVlNS2lrMlZ4KytUMkdNcHlnbVNMV2diNTBJK2I0ejRaYUJiWkMwTURGMHM5eHA2Q3pPQW1vZnkzMWEvU2tDZUU0YjhkRFA1QlpVSXZncTVZdkZneXUwPQ' },
    { title: 'Universität Göttingen: Elektromobilität', url: 'https://www.uni-goettingen.de/de/668179.html' },
    { title: 'Universitätsmedizin Göttingen: Hausordnung, Kurzfassung vom 23. April 2019 (PDF)', url: 'https://www.umg.eu/fileadmin/user_upload/UMG-HAUSORDNUNG_Kurzfassung__2__Hausschrift__003_.pdf' },
    { title: 'Yoio: Datenfeed für Göttingen (GBFS)', url: 'https://yoio.rideatom.com/gbfs/9/v3.0/gbfs' },
    { title: 'Yoio: E-Scooter-Sharing in Göttingen, Freiburg und Erfurt', url: 'https://yoio.app/' },
    { title: 'Yoio: Gebührenordnung (PDF)', url: 'https://yourcar-carsharing.de/images/Yoio-Gebuehrenordnung.pdf' },
    { title: 'Yoio: Allgemeine Geschäftsbedingungen (PDF)', url: 'https://yourcar-carsharing.de/images/Yoio-AGB.pdf' },
    { title: 'Yoio-Hilfe: Wie viel kostet es?', url: 'https://yourcar.freshdesk.com/support/solutions/articles/44001876940' },
    { title: 'Yoio-Hilfe: Was ist beim Parken wichtig?', url: 'https://yourcar.freshdesk.com/support/solutions/articles/44001892115' },
    { title: 'Yoio-Hilfe: Welche Verkehrsregeln muss ich einhalten?', url: 'https://yourcar.freshdesk.com/support/solutions/articles/44001892127' },
    { title: 'Bolt: Göttingen', url: 'https://bolt.eu/de-de/cities/gottingen/' },
    { title: 'VSN: Tarifbestimmungen und Beförderungsbedingungen, Stand 1. August 2025 (PDF)', url: 'https://www.goevb.de/fileadmin/user_upload/Downloads/VSN_Tarifbestimmungen_Befoerderungsbedingungen.pdf' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2: Einbahnstrassen und Verbot der Einfahrt', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Göttingen Tourismus: Das Gänseliesel-Fest feiert ein Doppeljubiläum', url: 'https://www.goettingen-tourismus.de/top-post/goettingen-geht-auf-zeitreise-das-gaenseliesel-fest-feiert-ein-doppeljubilaeum/' },
  ],
};

export default guide;
