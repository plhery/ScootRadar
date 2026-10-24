import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-reutlingen',
  topic: 'reutlingen',
  name: 'E-Scooter Reutlingen: Voi, Bolt, Preise, Parken',
  title: 'E-Scooter Reutlingen 2026: Voi, Bolt, Preise, Parken',
  description: 'E-Scooter Reutlingen: Voi und Bolt kosten laut Datenfeed 0,20 € pro Minute ohne Entsperrgebühr. Wo du in der Altstadt abstellen darfst und was im Bus gilt.',
  headline: 'E-Scooter Reutlingen: Preise, Sperrzonen und Abstellregeln von der Wilhelmstrasse bis zur Pomologie',
  lede: 'Einen E-Scooter in Reutlingen leihst du ab 18 und ohne Führerschein bei Voi, Bolt oder Dott. Voi und Bolt verlangten laut ihren Datenfeeds am 23. und 24. Oktober 2026 keine Entsperrgebühr und 0,20 € pro Minute, zehn Minuten kosten also 2,00 €. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone. In der Altstadt rund um Wilhelmstrasse und Marktplatz, in Pomologie und Volkspark beendest du keine Fahrt, am Hauptbahnhof schon.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Reutlingen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Reutlingen?',
      blocks: [
        'Leih-Scooter gibt es in Reutlingen laut Stadt seit Mitte Dezember 2020. Heute vermieten hier **Voi** und **Bolt**, beide mit offenem Datenfeed im Landesportal MobiData BW. Voi kam laut eigener Mitteilung am 21. März 2025 dazu. Gemietet wird in der App des Anbieters: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '[Auf der ScootRadar-Karte](map:de:Reutlingen) standen am Freitag, 23. Oktober 2026, um 15:18 Uhr rund 340 freie Scooter in Reutlingen: rund 180 von Voi und rund 165 von Bolt. Das ist eine Momentaufnahme, nicht die Grösse der Flotten. Die Selbstverpflichtung der Anbieter nennt «zunächst höchstens 150» Scooter je Anbieter, mehr nur «in beiderseitigem Einvernehmen»; im Januar 2026 nannte die Verwaltung eine «Obergrenze von 150 Rollern je Verleihfirma». Eine Anhebung hat die Stadt nicht veröffentlicht.',
        'Im Januar 2026 schrieb die Verwaltung dem Gemeinderat: «Aktuell gibt es in Reutlingen fünf Anbieter mit insgesamt bis zu 750 E-Scootern»; welche, sagt sie nicht. **Dott** führt Reutlingen und Pfullingen in seiner Standortliste, hat hier aber keinen offenen Datenfeed. Unsere Karte zeigt seine Scooter seit dem 24. Oktober 2026: an diesem Samstag um 13:26 Uhr rund 140. Den Preis zeigt nur die Dott-App.',
        '**Zeus** hat einen Datenfeed für Reutlingen, doch keiner der 17 Scooter darin war am 24. Oktober 2026 mietbar; die letzte Meldung stammt vom Juni 2025. Limes Feed bei MobiData BW zeigte am selben Tag kein Fahrzeug in der Stadt.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Reutlingen?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Reutlingen (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (Datenfeed bei MobiData BW, 23. Oktober 2026)', '0,00 €', '0,20 €', '2,00 €', '4,00 €'],
              ['Bolt (Datenfeed bei MobiData BW, 24. Oktober 2026)', '0,00 €', '0,20 €', '2,00 €', '4,00 €'],
            ],
          },
        },
        'Die Seite der Stadt nennt noch einen Euro Startgebühr, die Feeds nennen keine. Voi warb zum Start im März 2025 mit «Tarifen ab 17 Cent pro Minute» und Pässen ab 4,99 €. Pässe und den verbindlichen Preis zeigt die App.',
        'In [Tübingen](map:de:Tübingen) nannten die Feeds von Voi und Bolt am 23. und 24. Oktober 2026 denselben Tarif, in [Stuttgart](map:de:Stuttgart) Vois Feed am 23. Oktober dagegen 0,49 € plus 0,24 € pro Minute.',
      ],
    },
    {
      heading: 'Wo darf man in Reutlingen mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und in Fahrradstrassen; nur wo es keinen Radweg gibt, auf der Fahrbahn. Gehwege sind tabu, ausser das Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei»; dann fährst du im Schritttempo. Einbahnstrassen, die «Radverkehr frei» für Radfahrende in Gegenrichtung öffnet, darfst du schon heute auch mit dem E-Scooter gegen die Einbahnrichtung fahren. Das ist Bundesrecht.',
        '**Fussgängerzone:** Fahrräder dürfen laut Stadt von 19 bis 10 Uhr im Schritttempo durch die Fussgängerzone der Altstadt; das Zusatzschild, das die Stadt dazu zeigt, gilt nur für Fahrräder. Die Selbstverpflichtung der Anbieter erlaubt E-Scootern in Wilhelmstrasse, Katharinenstrasse, Marktplatz, Nikolaiplatz, Albtorplatz und Weibermarkt dieselben Zeiten, «analog» zu Fahrrädern. Nach Bundesrecht gilt die Freigabe für Fahrräder heute aber nicht für E-Scooter, wie auch das Faltblatt der Stadt schreibt: Ohne «Elektrokleinstfahrzeuge frei» schiebst du. Ab 1. März 2027 gilt sie auch für dich, im Schritttempo, sofern die Stadt E-Scooter nicht eigens ausschliesst.',
        '**Parks:** In Grünanlagen fährst du laut Stadt nur auf beschilderten Radwegen.',
        '**Geschäftsgebiet:** So lesen wir die Zonen in den Feeds vom 23. und 24. Oktober 2026: Voi und Bolt decken die Kernstadt, Betzingen, Orschel-Hagen, Sondelfingen und das Industriegebiet West ab, Bolt zusätzlich Rommelsbach. Die meisten Bezirksgemeinden wie Ohmenhausen, Gönningen, Altenburg und Mittelstadt liegen ausserhalb, ebenso Pfullingen und Eningen. Ausserhalb seines Gebiets lässt Voi laut Feed nicht einmal das Weiterfahren zu. Die genauen Grenzen zeigt die App.',
        '**Nach Tübingen:** Zwischen den Gebieten liegen Kilometer; mit Voi kommst du laut Feed nicht in einer Fahrt hinüber. Mehr im [Ratgeber für Tübingen](guide:tubingen).',
        '**Tempo und Zeiten:** Vois Feed setzt überall die bauartbedingten 20 km/h, Bolts Feed enthält keine Langsamzonen. Ein Nachtfahrverbot oder eine Winterpause nennen weder die Stadt noch die Anbieter; beide Feeds geben «24/7» an.',
      ],
    },
    {
      heading: 'Wo darf man E-Scooter in Reutlingen abstellen?',
      blocks: [
        'Die Grundregeln stehen in der Selbstverpflichtung, die alle Anbieter der Stadt gegeben haben: Keine Fahrt endet in Fussgängerzonen und in Grün- und Parkanlagen. Frei bleiben Rettungswege, Einfahrten, Bahnsteige, Bushaltestellen, Brücken und Schulgelände. Auf dem Gehweg bleiben mindestens 2 m frei.',
        {
          table: {
            caption: 'Fahrt beenden in Reutlingen: unsere Auswertung der Datenfeeds von Voi (23. Oktober) und Bolt (24. Oktober 2026)',
            head: ['Ort', 'Abstellen', 'Wer es regelt'],
            rows: [
              ['Altstadt: Wilhelmstrasse, Marktplatz, Katharinenstrasse, Nikolaiplatz, Weibermarkt', 'Verboten bei Voi und Bolt, nur einzelne Seitengassen sind frei', 'Stadt, umgesetzt von den Anbietern'],
              ['Pomologie, Volkspark, Stadtgarten', 'Im Kern verboten bei beiden; Voi sperrt mehr Fläche als Bolt', 'Stadt, Anbieter'],
              ['Echaz in der Innenstadt', 'Bolt sperrt die Ufer weitgehend, Voi in Abschnitten; Brücken immer frei lassen', 'Anbieter, Stadt'],
              ['Hauptbahnhof', 'Am Bahnhofsvorplatz erlaubt; den Listplatz mit den Bushaltestellen sperrt Bolt ganz, Voi zum Teil', 'Anbieter, Stadt'],
              ['Hochschule Reutlingen, Alteburgstrasse', 'Mit Voi erlaubt; mit Bolt nicht, der Campus ist Sperrzone oder ausserhalb', 'Anbieter; eine Campusregel der Hochschule fanden wir nicht'],
            ],
          },
        },
        'Steht ein Scooter im Weg, darfst du ihn laut Stadt ein paar Meter zur Seite stellen. Beschwerden gehen an den Anbieter, dessen kostenlose Hotline auf jedem Scooter steht; laut Selbstverpflichtung stellt er gemeldete Scooter binnen sechs Stunden um.',
        {
          note: 'Massgeblich ist die Karte in der App. Lässt sie dich die Fahrt nicht beenden, such den nächsten erlaubten Platz.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Reutlingen: Bussgelder und Promille',
      blocks: [
        'In Reutlingen gelten die deutschen Regeln: eigener Scooter ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die Stadt empfiehlt den Helm ausdrücklich.',
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
        'Falsches Abstellen können Polizei und Ordnungsamt laut Verwaltung (Januar 2026) nur ahnden, wenn Zeugen es sehen oder du es zugibst. Seit 1. Oktober 2026 haftet bei Unfällen der Halter auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Neue Verkehrsregeln und Bussgelder gelten erst ab 1. März 2027: mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: was bei RSV und naldo gilt',
      blocks: [
        'Reutlingen gehört zum Verkehrsverbund naldo. Laut dessen Beförderungsbedingungen (Stand 1. April 2026) fährt ein eigener E-Scooter als Handgepäck kostenlos mit, wenn er zusammengeklappt ist, weniger als 15 kg wiegt und kürzer als 1,15 m ist. Ein schwererer, längerer oder nicht geklappter Scooter wird wie ein Fahrrad behandelt. Ob Fahrräder in den Bus dürfen, entscheidet das Verkehrsunternehmen, im Einzelfall das Fahrpersonal.',
        '**Stadtbus (RSV):** Laut Reutlinger Stadtverkehr fahren Fahrräder auf allen RSV-Linien kostenlos mit, höchstens zwei je Stellfläche, im Kleinbus eines. Montags bis freitags von 7 bis 10 Uhr nehmen die Stadtbusse und der Schnellbus eXpresso keine Fahrräder mit, und Kinderwagen, Rollstühle und Rollatoren haben immer Vorrang. Für einen grossen Scooter gilt dasselbe.',
        '**Zug:** Mit naldo-Fahrschein fährt ein Fahrrad und damit ein grosser Scooter im Zug kostenlos mit; nur montags bis freitags von 6 bis 9 Uhr brauchst du dafür einen Kinderfahrschein.',
        '**Leih-Scooter** nennen naldo und RSV nicht eigens; laut Verbraucherzentrale werden sie im Nahverkehr nicht mitgenommen. Beende die Fahrt am Bahnhofsvorplatz und miete am Ziel neu. Zur Hochschule fahren vom Listplatz vor dem Bahnhof die Buslinien 4 und 8.',
      ],
    },
    {
      heading: 'Wie Reutlingen E-Scooter regelt: Selbstverpflichtung statt Sondernutzung',
      blocks: [
        'Eine Sondernutzungserlaubnis oder Gebühr verlangt Reutlingen bisher nicht; eine Sondernutzung behält sich die Stadt nur vor. Stattdessen geben die Anbieter ihr seit Dezember 2020 eine freiwillige Selbstverpflichtung; die Fassung vom November 2025 stimmt mit der von 2020 überein. Darin sagen sie zu, bei der täglichen Verteilung höchstens fünf Scooter an einen Ort zu stellen, mit mindestens 50 m Abstand zum nächsten.',
        'Im Januar 2026 beantragten alle Bezirksgemeinden einjährige Verträge, Abstellen nur auf ausgewiesenen Flächen, eine Jahresgebühr je Scooter und ein Angebot im ganzen Stadtgebiet. Die Verwaltung antwortete, der Antrag werde «ausserhalb des Haushalts weiterverfolgt»; sie werde «neue Rahmenbedingungen erarbeiten und anschliessend auf die entsprechenden Vertragspartner zugehen». Am 26. März 2026 stellte der Gemeinderat fest, dass der Antrag so weiterverfolgt wird. Erste Pläne für Abstellflächen nannte die Verwaltung im Januar; einen Beschluss über Verträge, Flächen oder Gebühren fanden wir bis 24. Oktober 2026 nicht.',
        {
          list: [
            '**Bund:** Verkehrsregeln und Bussgelder. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Stadt kann es dann als Sondernutzung genehmigen.',
            '**Land Baden-Württemberg:** das Strassengesetz für Sondernutzungen; eigene Landesregeln für Leih-Scooter fanden wir nicht.',
            '**Stadt Reutlingen:** Selbstverpflichtung mit Höchstzahl, Sperrzonen in Fussgängerzonen und Grünanlagen und Regeln zum Abstellen.',
            '**Voi und Bolt:** Preise, Geschäftsgebiet und Sperrzonen in der App.',
            '**naldo und RSV:** die Mitnahme in Bus und Bahn.',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Reutlingen',
      blocks: [
        {
          list: [
            '**Apfelgarten mit Parkverbot.** 1860 gründete Eduard Lucas in Reutlingen eine Lehranstalt für Obstkultur und Pomologie; 1984 war die Pomologie mit dem Volkspark Gelände der Landesgartenschau. Heute wachsen dort laut Stadt über 50 Apfelsorten, und beide Anbieter sperren den Kern des Parks für das Ende einer Fahrt.',
            '**Sperrzonen mit Namen.** Vois Feed führt in Reutlingen Zonen wie «Beschwerde» oder «bewegungseingeschränkte Person wohnt dort». Auch dort endet keine Fahrt.',
            '**Stürze ohne Gegner.** Das Polizeipräsidium Reutlingen registrierte 2024 laut Verwaltung 37 Unfälle mit Elektrokleinstfahrzeugen; bei allen drei mit Schwerverletzten stürzten die Fahrer allein.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Reutlingen?',
      answer: 'Bei Voi und Bolt laut ihren Datenfeeds im Landesportal MobiData BW (23. und 24. Oktober 2026) 0,20 € pro Minute ohne Entsperrgebühr, zehn Minuten also 2,00 €. Verbindlich ist, was die App vor dem Entsperren zeigt.',
    },
    {
      question: 'Welche E-Scooter-Anbieter gibt es in Reutlingen?',
      answer: 'Voi, Bolt und Dott, alle drei auf der Karte. Die Stadt sprach im Januar 2026 von fünf Anbietern, ohne sie zu nennen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Wilhelmstrasse fahren?',
      answer: 'Heute nicht: Die Stadt gibt die Fussgängerzone von 19 bis 10 Uhr nur für Fahrräder frei, ohne «Elektrokleinstfahrzeuge frei» schiebst du. Ab 1. März 2027 gilt diese Freigabe auch für E-Scooter, im Schritttempo, sofern die Stadt sie nicht eigens ausschliesst. Fahren ohne Freigabe kostet heute ab 15 €, ab März 2027 ab 25 €.',
    },
    {
      question: 'Wo darf ich in Reutlingen einen E-Scooter abstellen?',
      answer: 'Wo auf dem Gehweg 2 m frei bleiben, etwa am Bahnhofsvorplatz. Nicht in der Fussgängerzone der Altstadt, in Pomologie, Volkspark oder Stadtgarten, an Haltestellen, auf Brücken oder an Schulen. Die App zeigt die Sperrzonen.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus mitnehmen?',
      answer: 'Einen eigenen, zusammengeklappten unter 15 kg und kürzer als 1,15 m als Handgepäck. Grössere gelten als Fahrrad: im RSV-Stadtbus kostenlos, aber nicht montags bis freitags von 7 bis 10 Uhr. Leih-Scooter werden laut Verbraucherzentrale nicht mitgenommen.',
    },
    {
      question: 'Gibt es in Reutlingen ein Nachtfahrverbot für E-Scooter?',
      answer: 'Nein. Weder die Stadt noch Voi oder Bolt nennen ein nächtliches Fahrverbot oder eine Winterpause; beide Feeds geben «24/7» an (Stand 24. Oktober 2026).',
    },
  ],
  sources: [
    { title: 'Stadt Reutlingen: E-Scooter', url: 'https://www.reutlingen.de/E-Scooter' },
    { title: 'Stadt Reutlingen: Radfahren in der Fussgängerzone', url: 'https://www.reutlingen.de/reutlingen-radelt/Radfahren-in-der-Fussgaengerzone' },
    { title: 'Stadt Reutlingen: Freiwillige Selbstverpflichtung der Anbieter (Dezember 2020)', url: 'https://www.reutlingen.de/ceasy/resource/?id=45339&download=1' },
    { title: 'Stadt Reutlingen: Faltblatt E-Scooter (Dezember 2020)', url: 'https://www.reutlingen.de/ceasy/resource/?id=45384&download=1' },
    { title: 'Stadt Reutlingen: Mitteilungsvorlage 26/007/01, Situation E-Scooter (8. Januar 2026)', url: 'https://ris.reutlingen.de/programme/RIS/ris_web.nsf/xsp/download?documentId=2D809406ADF41BD9C1258D86005166C5&file=26/007/01_Situation_E-Scooter_in_Reutlingen_%E2%80%93_Anfrage_der_Fraktion_DieLinkePARTEI_vom_11.03.2025.pdf' },
    { title: 'Stadt Reutlingen: Selbstverpflichtung, Stand November 2025 (Anlage zu 26/007/01)', url: 'https://ris.reutlingen.de/programme/RIS/ris_web.nsf/xsp/download?documentId=FE049764AF032DD9C1258D86005166D3&file=Anlage%20-%20Selbstverpflichtung%20-%20Stand%2011-2025.pdf' },
    { title: 'Stadt Reutlingen: Haushaltsanträge 2026/2027 mit Stellungnahme der Verwaltung, Antrag 29', url: 'https://ris.reutlingen.de/programme/RIS/ris_web.nsf/xsp/download?documentId=CEBE202D9ACE212AC1258DC4004AF238&file=Gesamtliste_HH-Antr%C3%A4ge_2026_2027%20mit%20Stellungnahme%20Verwaltung%2C%20Stand_21.01.2026.pdf' },
    { title: 'Stadt Reutlingen: Kurzprotokoll des Gemeinderats vom 26. März 2026', url: 'https://ris.reutlingen.de/programme/RIS/ris_web.nsf/xsp/download?documentId=8AF7E843FED9FCFAC1258DCC0043D757&file=GR%202026.03.26%20-%20Kurzprotokoll%20OE.pdf' },
    { title: 'Stadt Reutlingen: Pomologie', url: 'https://www.reutlingen.de/pomologie' },
    { title: 'MobiData BW: Tarife von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans' },
    { title: 'MobiData BW: Zonen von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones' },
    { title: 'MobiData BW: Tarife von Bolt (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_reutlingen_tuebingen/system_pricing_plans' },
    { title: 'MobiData BW: Zonen von Bolt (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_reutlingen_tuebingen/geofencing_zones' },
    { title: 'MobiData BW: Verzeichnis der Sharing-Datenfeeds', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'Zeus: Datenfeed für Reutlingen (GBFS)', url: 'https://zeus.city/api/v1/mds/gbfs/reutlingen/gbfs.json' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Voi: Voi startet E-Scooter-Sharing in Reutlingen (18. März 2025)', url: 'https://storage.mfn.se/b7b13d6e-917b-4600-bc2b-4665f96ff08c/e-scooter-anbieter-voi-startet-in-reutlingen.pdf' },
    { title: 'naldo: Anlagen zu den Beförderungsbedingungen (1. April 2026)', url: 'https://www.naldo.de/fileadmin/media/tickets/TB-BB/2026-04-01-Anlagen_Befoerderungsbedingungen.pdf' },
    { title: 'naldo: Tarifbestimmungen (1. August 2026)', url: 'https://www.naldo.de/fileadmin/media/tickets/TB-BB/2026-08-01-Tarifbestimmungen.pdf' },
    { title: 'Reutlinger Stadtverkehr: Fahrkarten und Mitnahme', url: 'https://reutlinger-stadtverkehr.de/fahrkarten' },
    { title: 'Hochschule Reutlingen: Kontakt und Anfahrt', url: 'https://www.reutlingen-university.de/hochschule/kontakt-und-anfahrt' },
    { title: 'Verbraucherzentrale: Regeln für E-Scooter (15. April 2026)', url: 'https://www.verbraucherzentrale.de/wissen/energie/emobilitaet/escooter-diese-regeln-gelten-fuer-elektrotretroller-35716' },
    { title: 'Verordnung zur Änderung der eKFV, BGBl. 2026 I Nr. 32', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Bussgeldkatalog-Verordnung (BKatV)', url: 'https://www.gesetze-im-internet.de/bkatv_2013/BJNR049800013.html' },
    { title: 'Strassenverkehrsgesetz § 8: Halterhaftung seit 1. Oktober 2026', url: 'https://www.gesetze-im-internet.de/stvg/__8.html' },
    { title: 'StVO Anlage 2: Vorschriftzeichen und Zusatzzeichen', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
  ],
};

export default guide;
