import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-biel',
  topic: 'biel',
  name: 'E-Trottinett Biel: Voi, PubliBike, Preise, Zonen',
  title: 'E-Trottinett Biel/Bienne 2026: Voi, PubliBike, Preise, Zonen',
  description: 'E-Trottinett Biel: Voi und PubliBike im Vergleich, was 10 Minuten kosten, wo Fahrverbot und Tempo 10 gelten und wo du in Biel/Bienne parkierst.',
  headline: 'E-Trottinett Biel/Bienne: Voi und PubliBike mieten, Preise, Sperrzonen und Parkieren',
  lede: 'Ein E-Trottinett in Biel/Bienne mietest du bei Voi oder bei PubliBike, bei beiden ab 18. Voi stellt seit dem 30. März 2026 mit einer Bewilligung der Stadt bis zu 160 Trottis frei im Stadtgebiet auf und verlangt CHF 1.– plus 39 Rappen pro Minute, zehn Minuten kosten also CHF 4.90 (offener Datenfeed von Voi, 24. Oktober 2026). Die 80 E-Scooter von PubliBike leihst du an einer Velostation aus, für CHF 1.– plus 20 Rappen pro Minute. Am Bahnhof, im Stadtpark, im Elfenaupark und auf den Friedhöfen gilt für Voi Fahr- und Parkverbot; in der Altstadt, der Innenstadt, auf der Schüssinsel und am Strandboden fährst du höchstens 10 km/h und parkierst nur auf Veloplätzen.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'ch:biel',
  sections: [
    {
      heading: 'E-Trottinett in Biel mieten: Voi und PubliBike',
      blocks: [
        'Seit 2021 fuhren hier die Trottis von Zisch und JM Fleets, zusammen 160; ihre Bewilligung lief Ende 2025 aus. Seit März 2026 lässt die Stadt nur noch einen Anbieter ohne feste Stationen zu, und im öffentlichen Verfahren setzte sich Voi durch. Die Bewilligung gilt drei Jahre ab dem Start, also bis im Frühling 2029; hält Voi die Vorgaben der Stadt ein, kann sie um zwei Jahre verlängert werden.',
        'Dazu kommt PubliBike Velospot, das in Biel die Leihvelos betreibt. Seit dem 3. November 2025 stehen an seinen Stationen auch 80 E-Scooter, gedacht vor allem für Pendlerinnen und Pendler. Die Stadt zahlt nichts daran: Das Angebot finanziert sich über die Tarife und gehört zum Leistungsvertrag mit PubliBike. Ende 2026 will die Stadt es auswerten.',
        {
          table: {
            caption: 'Voi und PubliBike in Biel/Bienne im Überblick (Stand 24. Oktober 2026)',
            head: ['Frage', 'Voi', 'PubliBike Velospot'],
            rows: [
              ['System', 'Frei abstellen im bewilligten Gebiet', 'Ausleihen und zurückgeben an einer Station'],
              ['Anzahl laut Stadt', 'Höchstens 160', '80'],
              ['Höchsttempo', '20 km/h, in den Langsamzonen 10 km/h', '20 km/h'],
              ['Fahrt beenden', 'Im Gebiet; im Zentrum und am See nur auf Veloplätzen', 'Nur an einer Station, die E-Scooter nimmt'],
            ],
          },
        },
        'Am Samstag, 24. Oktober 2026, um 11.13 Uhr zeigte die [Karte von Biel/Bienne](map:ch:biel) gut 200 E-Trottinette, rund 140 von Voi und rund 70 von PubliBike. Velos und E-Bikes von PubliBike zeigt ScootRadar nicht. So kommst du zu deinem Trotti:',
        {
          steps: [
            'Auf der [Live-Karte](map:ch:biel) das nächste Trotti von Voi oder PubliBike und die Gehzeit dorthin suchen.',
            'Antippen, die App des Anbieters öffnen, dich registrieren und ein Zahlungsmittel hinterlegen. Die E-Scooter von PubliBike entsperrst du nur mit der App, nicht mit dem SwissPass.',
            'Den QR-Code am Lenker scannen und auf dem Velostreifen oder der Strasse losfahren.',
            'Bei Voi die Fahrt dort beenden, wo die App es erlaubt, und das verlangte Schlussfoto machen; bei PubliBike das Trotti an eine Station zurückbringen.',
          ],
        },
        'Mehr zum Ablauf: [So mietest du ein E-Trottinett](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in Biel?',
      blocks: [
        'Voi verlangt in Biel CHF 1.– fürs Entsperren und 39 Rappen pro Minute, so steht es im offenen Datenfeed von Voi vom 24. Oktober 2026. PubliBike nennt auf seiner Preisliste (Stand 24. Oktober 2026) für E-Scooter in Zürich und Biel/Bienne CHF 1.– Freischaltgebühr und 20 Rappen pro Minute, auch ohne Abo. Den Endpreis zeigt jeweils die App.',
        {
          table: {
            caption: 'E-Trottinett und Leihvelo in Biel im Vergleich (Voi: Datenfeed vom 24. Oktober 2026; PubliBike: publibike.ch, 24. Oktober 2026)',
            head: ['Angebot', 'Grundpreis', 'Danach pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi, E-Trottinett', 'CHF 1.– fürs Entsperren', '39 Rappen', 'CHF 4.90', 'CHF 8.80'],
              ['PubliBike, E-Scooter (mit oder ohne Abo)', 'CHF 1.– fürs Entsperren', '20 Rappen', 'CHF 3.–', 'CHF 5.–'],
              ['PubliBike, Velo ohne Abo', 'CHF 3.– für 30 Minuten', '10 Rappen', 'CHF 3.–', 'CHF 3.–'],
              ['PubliBike, E-Bike ohne Abo', 'CHF 5.– für 30 Minuten', '20 Rappen', 'CHF 5.–', 'CHF 5.–'],
              ['PubliBike, E-Bike mit Jahresabo Biel/Bienne (CHF 69.–)', 'CHF 2.– für 15 Minuten, CHF 1.– für die nächsten 15', '20 Rappen', 'CHF 2.–', 'CHF 3.–'],
            ],
          },
        },
        'Eine halbe Stunde kostet bei Voi CHF 12.70, bei PubliBike CHF 7.–. Das Jahresabo B-Fit Local Biel/Bienne für CHF 69.– macht die E-Scooter nicht billiger, nur Velo (die ersten 30 Minuten gratis) und E-Bike.',
        'Pässe, Pakete und Gebühren von Voi zeigt die App. In [Bern](map:ch:bern) verlangt Voi laut demselben Feed 42 Rappen pro Minute. Alle Tarife im Überblick: [E-Trottinett-Preise in der Schweiz](guide:swiss-prices).',
      ],
    },
    {
      heading: 'Wo darf ich in Biel fahren? Sperrzonen und Tempo 10',
      blocks: [
        'Die Zonen legt die Stadt fest: Fahrverbot und Tempo 10 im Plan vom 18. März 2026, die Parkverbotszonen in der Bewilligung. Sie darf sie während der Laufzeit ändern. Voi setzt sie per GPS um, in den Langsamzonen bremst das Trotti von selbst ab. Massgebend ist die Karte in der Voi-App.',
        {
          table: {
            caption: 'Zonen für Voi in Biel/Bienne (Plan der Stadt vom 18. März 2026; unsere Auswertung der offenen Daten von Voi vom 24. Oktober 2026)',
            head: ['Zone', 'Was gilt', 'Wo'],
            rows: [
              ['Fahr- und Parkverbot', 'Nicht fahren, nicht durchfahren, nicht parkieren', 'Bahnhof Biel/Bienne mit Bahnhofplatz, Stadtpark, Elfenaupark, Bahnhof Mett, Friedhöfe Mett, Bözingen und Madretsch'],
              ['Tempo 10', 'Höchstens 10 km/h, parkieren nur auf öffentlichen Veloabstellplätzen', 'Altstadt mit Ring, Burgplatz, Obergasse und Untergasse; Nidaugasse und Innenstadt; Schüssinsel; Strandboden und Seeufer'],
              ['Parkverbotszonen', 'Durchfahren ja, Fahrt beenden nur auf einem Voi-Parkplatz', 'Zentrum rund um Bahnhof, Zentralplatz, Altstadt und Seevorstadt; Tissot Arena; laut Voi auch die Talstation der Magglingenbahn'],
              ['Ausserhalb des Gebiets', 'Durchfahren ja, keine Fahrt beenden', 'Nidau, Port, Ipsach, Brügg, Orpund, Leubringen, Magglingen'],
            ],
          },
        },
        'Die Stadt nennt 10 km/h; in den Daten von Voi stehen für diese Zonen sogar 7 km/h, auf einem kleinen Stück der Schüssinsel 5 km/h. Umgekehrt beim Friedhof Mett: Der Plan der Stadt sperrt ihn, in den Daten von Voi stand dort am 24. Oktober nur eine Langsamzone. Das Gesetz ist strenger: In einer Fussgängerzone darfst du nur fahren, wenn eine Zusatztafel Velos erlaubt, und dann im Schritttempo.',
        { note: 'Am Bahnhof Biel/Bienne kannst du eine Voi-Fahrt weder beenden noch hindurchfahren, und die Minuten laufen weiter, solange die App das Parkieren verweigert. Beende die Fahrt vorher auf einem Voi-Parkplatz und geh zu Fuss weiter. PubliBike hat eine Station «Bahnhof Biel».' },
        'PubliBike hat eigene Zonen: Erlaubt ist das Gebiet innerhalb der gepunkteten Linie in der App, Sperrzonen sind violett. Fährst du in eine hinein, schaltet sich der E-Scooter ab.',
      ],
    },
    {
      heading: 'E-Trottinett parkieren in Biel: Veloplätze, Stationen, Schlussfoto',
      blocks: [
        'Im Zentrum und am Seeufer parkierst du ein Voi-Trotti nur auf einem öffentlichen Veloabstellplatz; die App zeigt diese Plätze als Voi-Parkplätze. In den Daten von Voi zählten wir am 24. Oktober 267 in Biel, 175 davon im Zentrum. Laut den Auflagen der Stadt darf Voi höchstens zehn Prozent der Plätze eines Standorts belegen, mindestens aber einen.',
        'Im übrigen Gebiet stellst du das Trotti wie ein Velo ab: auf dem Trottoir nur, wenn 1,50 m für Fussgänger frei bleiben (sonst CHF 20.– Busse), nie vor Eingängen, auf dem Fussgängerstreifen oder auf Blindenleitlinien. Zum Schluss verlangt die App ein Foto, das automatisch geprüft wird.',
        'Störend abgestellte Trottis muss Voi laut Bewilligung in der Regel innert eines halben Arbeitstages wegräumen. Steht eines im Weg, melde es dem Kundendienst von Voi.',
        'Die E-Scooter von PubliBike gibst du nur an einer Station zurück, die auch E-Scooter nimmt; die App zeigt sie. Stellst du einen anderswo ab, verrechnet PubliBike CHF 30.–, ab dem zweiten Mal CHF 50.–.',
      ],
    },
    {
      heading: 'Mit dem Trotti durch Biel: See, Nidau, Magglingen, Hochschulen',
      blocks: [
        {
          list: [
            '**Bahnhof:** Die SBB verbietet das Fahren im ganzen Bahnhof, auch auf Perrons und in Unterführungen. Für Voi ist zudem der ganze Bahnhofbereich gesperrt.',
            '**See und Strandboden:** Am Ufer gilt Tempo 10, parkiert wird nur auf Veloplätzen. PubliBike hat Stationen am Parkplatz Strandboden und beim Gymnasium Strandboden.',
            '**Nidau, Port, Ipsach:** eigene Gemeinden, für die die Bewilligung der Stadt Biel nicht gilt. Laut den Daten von Voi darfst du hindurchfahren, die Fahrt dort aber nicht beenden.',
            '**Magglingen und Leubringen:** Die Standseilbahnen fahren hinauf, die Dörfer oben liegen ausserhalb des Gebiets. An beiden Talstationen beendest du die Fahrt nur auf einem Voi-Parkplatz.',
            '**Hochschulen:** Die BFH Technik und Informatik liegt in der Parkverbotszone im Zentrum: Fahrt nur auf einem Voi-Parkplatz beenden.',
            '**Tissot Arena:** Parkverbotszone für Voi; PubliBike hat dort zwei Stationen.',
            '**Markttage:** Samstags von 7 bis 12 Uhr ist Gemüsemarkt in der Altstadt, etwa auf Burgplatz und Mühlebrücke. Dort schiebst du besser.',
          ],
        },
      ],
    },
    {
      heading: 'Bus, Zug, Standseilbahn: Darf das Trotti mit?',
      blocks: [
        'Die Verkehrsbetriebe Biel (VB) betreiben die Stadtbusse und seit 2014 auch die Standseilbahnen nach Magglingen und Leubringen. In ihren häufigen Fragen (Stand 24. Oktober 2026) steht: «Trottinetts und E-Trottinetts mit Rädern unter 30 cm (12 Zoll) Durchmesser dürfen gratis mitgenommen werden – egal ob zusammenklappbar oder nicht.» Ein Billett brauchst du nur für dich. Mit grösseren Rädern gilt das Trotti als Velo und braucht ein ermässigtes Billett; der Velo-Jahrespass der SBB gilt auch. Mitnehmen darfst du es nur, wenn genug Platz ist, denn die Fahrgäste haben Vorrang.',
        'Bei der SBB gilt dieselbe Grenze von 12 Zoll; ein grösseres Trotti braucht ein Velobillett. Ein Trotti von Voi oder PubliBike bleibt draussen: Fahrt vor dem Bahnhof beenden und am Ziel ein neues mieten.',
      ],
    },
    {
      heading: 'Regeln und Bussen in Biel: das Wichtigste',
      blocks: [
        {
          list: [
            '**Ab 18** bei Voi und PubliBike. Das Gesetz: ab 16 ohne Führerausweis, mit 14 und 15 nur mit dem Ausweis der Kategorie M.',
            '**Velostreifen, Veloweg oder Strasse.** Aufs Trottoir nur, wo ein Signal Velos erlaubt, sonst CHF 40.–.',
            '**Fussgängerzonen** nur mit Zusatztafel für Velos und im Schritttempo, sonst CHF 30.–.',
            '**Licht an**, auch am Tag; bei den Sharing-Trottis brennt es immer. Ohne Licht kostet es am Tag CHF 20.–.',
            '**Rotlicht:** CHF 60.–. **Handy** in der Hand: CHF 40.–.',
            '**Nur eine Person** pro Trotti. **Helm** dringend empfohlen, aber keine Pflicht.',
            '**0,5 Promille** sind die Grenze; ab da droht ein Strafverfahren statt einer Ordnungsbusse.',
          ],
        },
        'Voi belohnt laut Stadt freiwillige «Helm-Selfies» in der App mit Fahrguthaben. Alle Bussen und Altersgrenzen: [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Schon gewusst? Vier Fakten zu Biels Trottis',
      blocks: [
        {
          list: [
            '**Zweisprachig auch im Kundendienst:** Biel/Bienne ist die grösste zweisprachige Stadt der Schweiz, und die Bewilligung schreibt dem Anbieter einen Kundendienst auf Deutsch und Französisch vor, werktags zu Bürozeiten und am Wochenende von 9 bis 12 und 13 bis 16 Uhr.',
            '**In der Schüss versenkt:** Kann der Anbieter ein Trotti nicht selbst bergen, etwa «in der Schüss versenkte E-Trottinettes», darf die Stadt es entsorgen und ihm die Rechnung schicken.',
            '**Miete für den Boden:** Der Anbieter zahlt der Stadt CHF 2.– pro Quadratmeter und Woche. Die Stadt rechnet mit einem Quadratmeter pro Trotti, für 160 Trottis also mit CHF 16 640.– im Jahr.',
            '**Sonnenstrom am Hang:** Seit 2019 trägt die Magglingenbahn Solarmodule und gewinnt Bremsenergie zurück. Dafür gab es den Europäischen Solarpreis.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Trottinett-Anbieter gibt es in Biel?',
      answer: 'Voi, seit dem 30. März 2026 der einzige Anbieter ohne feste Stationen, mit einer Bewilligung der Stadt bis im Frühling 2029, und PubliBike mit 80 E-Scootern an seinen Velostationen.',
    },
    {
      question: 'Brauche ich ein Abo für die E-Scooter von PubliBike?',
      answer: 'Nein. Ohne Abo zahlst du nach dem Tarif B-Quick National CHF 1.– fürs Entsperren und 20 Rappen pro Minute, und das Jahresabo für Biel macht die E-Scooter nicht billiger. Du brauchst die App von PubliBike, denn mit dem SwissPass lassen sich die E-Scooter nicht entsperren, und du musst mindestens 18 sein.',
    },
    {
      question: 'Kann ich mit dem Trotti nach Nidau oder Magglingen fahren?',
      answer: 'Hindurchfahren ja, aber mit Voi kannst du dort keine Fahrt beenden: Die Bewilligung gilt nur in der Stadt Biel, und laut den Daten von Voi vom 24. Oktober 2026 liegen Nidau, Port, Ipsach, Brügg, Leubringen und Magglingen ausserhalb des Gebiets. Nach Magglingen und Leubringen fährst du ohnehin bequemer mit der Standseilbahn.',
    },
    {
      question: 'Wie viele E-Trottinette gibt es in Biel?',
      answer: 'Laut Stadt 240: höchstens 160 von Voi, mehr erlaubt die Bewilligung nicht, und 80 von PubliBike. Am 24. Oktober 2026 um 11.13 Uhr zeigte die Karte in Biel/Bienne gut 200, rund 140 von Voi und rund 70 von PubliBike.',
    },
    {
      question: 'Darf ich mein eigenes E-Trottinett im Bus mitnehmen?',
      answer: 'Ja, wenn die Räder kleiner als 30 cm (12 Zoll) sind: Dann fährt es bei den Verkehrsbetrieben Biel gratis mit, zusammenklappbar oder nicht. Mit grösseren Rädern gilt es als Velo und braucht ein ermässigtes Billett. Ist der Bus voll, haben die Fahrgäste Vorrang.',
    },
  ],
  sources: [
    { title: 'Stadt Biel: Voi-E-Trottinette starten Ende März in Biel, 27. März 2026', url: 'https://www.biel-bienne.ch/de/news.html/29/news/6204/newsarchive/1' },
    { title: 'Stadt Biel: Verkehrsbeschränkungszonen für E-Trottinetts von Voi Technology, 18. März 2026 (PDF)', url: 'https://www.biel-bienne.ch/public/upload/assets/38711/1/Plan_E-Trottinetts_de.pdf' },
    { title: 'Stadt Biel: E-Trottinette, Stadt Biel erteilt Betriebsbewilligung an Voi, 6. Februar 2026', url: 'https://www.biel-bienne.ch/de/news.html/29/news/6142/newsarchive/1' },
    { title: 'Stadt Biel: Stadt Biel organisiert das E-Trottinett-Verleihsystem neu, 29. Oktober 2025', url: 'https://www.biel-bienne.ch/de/news.html/29/news/5900/newsarchive/1' },
    { title: 'Stadt Biel: Bewilligungsverfahren E-Trottinett-Verleihsystem, Unterlagen und Fragen und Antworten, Oktober und November 2025 (ZIP)', url: 'https://www.biel-bienne.ch/e-trottinetts/bewilligung' },
    { title: 'sharedmobility.ch (Bundesamt für Energie): offener Datenfeed von Voi mit Tarifen, Zonen und Parkplätzen', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/gbfs' },
    { title: 'PubliBike Velospot: Preise & Abos', url: 'https://www.publibike.ch/de/abos' },
    { title: 'PubliBike Velospot: E-Scooter fahren', url: 'https://www.publibike.ch/de/e-scooter' },
    { title: 'Verkehrsbetriebe Biel: Häufige Fragen', url: 'https://vb-tpb.ch/de/kontakt/faq' },
    { title: 'Verkehrsbetriebe Biel: Geschichte und Zukunft', url: 'https://vb-tpb.ch/de/ueber-uns/geschichte-und-zukunft' },
  ],
};

export default guide;
