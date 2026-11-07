import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wels',
  topic: 'wels',
  name: 'E-Scooter Wels: Dott, Lime und der Verhaltenskodex der Stadt',
  title: 'E-Scooter Wels 2026: Dott, Lime, Abstellverbote und Regeln',
  description: 'E-Scooter in Wels: Dott und Lime, wie du mietest, was der Verhaltenskodex zu Abstellen und Tempo festlegt und die StVO-Regeln seit Mai 2026.',
  headline: 'E-Scooter Wels: der Verhaltenskodex der Stadt, die Abstellverbote und die Regeln seit Mai 2026',
  lede: 'In Wels leihst du E-Scooter von Dott und Lime in deren App: Konto anlegen, Zahlungsmittel hinterlegen, QR-Code am Lenker scannen. Dott vermietet laut seinen Bedingungen für Österreich ab 18, den Preis zeigt die App vor dem Entsperren. Für die Verleihfirmen gibt es einen Verhaltenskodex, laut Amtsblatt vom April 2021 eine verbindliche Vereinbarung mit der Stadt. Danach dürfen Leih-Scooter etwa nicht auf Gehsteigen unter 2,5 Meter Breite, auf Radwegen oder in Haltestellen stehen, die Firmen sperren die Rückgabe in Burggarten, Pollheimerpark und mehreren Fussgängerzonen und drosseln ihre Roller in den Fussgängerzonen auf 10 km/h. Seit dem 1. Mai 2026 gelten in ganz Österreich eine Helmpflicht unter 16 und eine Grenze von 0,5 Promille.',
  published: '2026-11-03',
  updated: '2026-11-03',
  city: 'at:Wels',
  sections: [
    {
      heading: 'E-Scooter mieten in Wels: Dott und Lime',
      blocks: [
        'Am Dienstag, 3. November 2026, zeigte die [Karte rund um Wels](map:at:Wels) um 4:49 Uhr rund 200 Dott-Scooter, die zu diesem Zeitpunkt frei waren, und rund 90 Lime-Scooter nach der letzten Zählung.',
        '**Dott** führt Wels, Thalheim bei Wels und Gunskirchen in seiner Standortliste (Stand November 2026). Laut seinen Bedingungen für Österreich mietest du ab 18; zum Preis nach Fahrzeit kann eine Freischaltgebühr kommen, und wer falsch parkt oder den Roller nicht richtig sperrt, zahlt bis zu 300 € für die Rückholung.',
        {
          steps: [
            'Einen freien Scooter auf der [Live-Karte von Wels](map:at:Wels) suchen und die App des Anbieters öffnen.',
            'Konto anlegen und ein Zahlungsmittel hinterlegen.',
            'QR-Code am Lenker scannen, losfahren und die Fahrt ausserhalb der Verbotszonen beenden. Ausführlich erklärt das der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
          ],
        },
      ],
    },
    {
      heading: 'Der Welser E-Scooter-Verhaltenskodex',
      blocks: [
        'Die Regeln für den Verleih hat Wels in einem Verhaltenskodex festgehalten. Im April 2021 meldete das Amtsblatt der Stadt, er sei in Kraft getreten: eine verbindliche vertragliche Vereinbarung zwischen der Stadt und den Verleihfirmen, nach Linzer Vorbild ausgearbeitet. Den Anstoss gaben laut Amtsblatt Klagen über Roller, die Geh- und Radwege blockierten, und über zu schnelles Fahren, nachdem im Frühjahr 2019 der erste Verleih in Wels gestartet war.',
        'Der Kodex ist ein Vertrag mit den Firmen. Was er von ihnen verlangt, setzen sie laut Amtsblatt über App und Roller bei den Fahrern durch: In bestimmten Zonen lässt sich die Fahrt nicht beenden, und das Höchsttempo ist einprogrammiert. Am 10. August 2023 schrieb die Stadt, dass sich alle damals in Wels tätigen Verleihfirmen zum Kodex bekennen. Weitere Pflichten der Firmen nach dem Amtsblatt von 2021:',
        {
          list: [
            '**Technik und Wartung:** Jede Firma muss belegen, dass ihre Roller den gesetzlichen Vorgaben genügen, und ist für deren Wartung selbst verantwortlich.',
            '**Helm und Verkehrsregeln:** Die Firmen raten ihren Kunden deutlich zum Helm und dazu, sich an die Verkehrsregeln zu halten, nicht zuletzt den Fussgängern zuliebe.',
            '**Richtig abstellen:** Die Firmen erklären ihren Kunden, wie man einen Roller abstellt, ohne jemanden zu gefährden oder zu stören, und auf möglichst wenig Platz. Wer das immer wieder missachtet, kann von der Nutzung ausgeschlossen werden.',
          ],
        },
        'Was in Linz für Verleih-Scooter gilt, steht im Ratgeber [E-Scooter in Linz](guide:linz).',
      ],
    },
    {
      heading: 'E-Scooter abstellen in Wels: wo es verboten ist',
      blocks: [
        'Laut Amtsblatt vom April 2021 zählt der Kodex Orte im ganzen Stadtgebiet auf, an denen kein Leih-Scooter stehen darf, und Zonen, in denen die App die Rückgabe sperrt. Diese Zonen galten damals «einstweilen»; machen andere Orte Probleme, kann die Liste länger werden. Im August 2023 führte die Stadt die gesperrten Zonen und die Abstellverbote erneut als Teil des Kodex an. Prüfe vor dem Abstellen in der App, ob du die Fahrt dort beenden kannst.',
        {
          table: {
            caption: 'Abstellverbote für Leih-E-Scooter in Wels laut Verhaltenskodex (Amtsblatt April 2021)',
            head: ['Wo', 'Was gilt'],
            rows: [
              ['Burggarten und Pollheimerpark', 'Parkverbotszone, Rückgabe in der App gesperrt'],
              ['Fussgängerzonen Bäckergasse, Schmidtgasse und Hafergasse', 'Parkverbotszone, Rückgabe in der App gesperrt'],
              ['Burggasse', 'Parkverbotszone, Rückgabe in der App gesperrt'],
              ['Radabstellanlagen', 'Abstellen verboten'],
              ['Vor Zugängen und Einfahrten', 'Abstellen verboten'],
              ['Haltestellen', 'Abstellen verboten'],
              ['Radwege und Gehwege', 'Abstellen verboten'],
              ['Gehsteige unter 2,5 Meter Breite', 'Abstellen verboten'],
              ['Bodenleitsysteme für blinde und hochgradig sehbehinderte Menschen', 'Abstellen verboten'],
            ],
          },
        },
        'Wird ein falsch abgestellter Leih-Scooter gemeldet, hat die Firma laut Kodex drei Stunden Zeit, ihn wegzubringen. Damit klar ist, welcher Roller zu welcher Firma gehört, bekam 2021 jede Firma eine eigene Farbe. Droht Gefahr oder ist die Frist verstrichen, kann die Stadt den Roller jederzeit selbst entfernen lassen, und die Firma zahlt. Die Drei-Stunden-Pflicht nannte die Stadt im August 2023 erneut und schrieb zugleich, die Beschwerden nähmen trotzdem zu.',
        'Für jeden E-Scooter, auch einen eigenen, gelten beim Abstellen über § 68a Abs. 1 die Regeln für Fahrräder (§ 68 Abs. 4 StVO): Der Roller muss sicher stehen und darf den Verkehr nicht behindern. Auf den Gehsteig gehört er nur, wenn dieser mehr als 2,5 Meter breit ist, und dann platzsparend, ohne Fussgänger zu behindern; im Haltestellenbereich nur, wo Fahrradständer stehen.',
      ],
    },
    {
      heading: 'Wo und wie schnell fährst du in Wels?',
      blocks: [
        'Für E-Scooter hat die Strassenverkehrsordnung (StVO) seit dem 1. Mai 2026 einen eigenen Paragrafen, § 68a. Er gilt für elektrisch betriebene Klein- und Miniroller: einspurig, mit Lenkstange und Trittbrett, ohne Sitz, mit höchstens 600 Watt Leistung, höchstens 25 km/h Bauartgeschwindigkeit und Felgen von höchstens 300 mm Aussendurchmesser (§ 2 Abs. 1 Z 22a StVO). Wer so einen Roller fährt, hält sich an alle Verhaltensregeln für Radfahrer. Der Roller selbst gilt nach § 1 Abs. 2b KFG nicht als Kraftfahrzeug.',
        'Ist eine **Radfahranlage** da, etwa ein Radweg, ein Geh- und Radweg, ein Radfahrstreifen oder ein Mehrzweckstreifen, fährst du dort, und zwar in der Richtung, die für sie gilt; fehlt sie, nimmst du die Fahrbahn. Den **Gehsteig** und Gehwege entlangzufahren ist verboten. Ausserdem darfst du andere weder in Gefahr bringen noch aufhalten (§ 68a Abs. 1 StVO).',
        'Regeln weder Ampel noch Armzeichen den Verkehr an einer **Radfahrerüberfahrt**, fährst du mit höchstens 10 km/h auf sie zu. Hinüber fährst du nicht knapp vor einem Fahrzeug, dessen Lenker damit nicht rechnet, ausser es ist gerade kein Kraftfahrzeug in der Nähe unterwegs (§ 68 Abs. 3a StVO).',
        '**Tempo der Leih-Scooter:** Nach dem Kodex, wie ihn das Amtsblatt im April 2021 beschrieb, dürfen die Firmen ihre Roller auf höchstens 25 km/h einstellen, in den Fussgängerzonen Bäckergasse, Schmidtgasse, Stadtplatz, Burggasse und Hafergasse auf höchstens 10 km/h; dort gelten laut Amtsblatt sonst dieselben Regeln wie für Fahrräder. Das ist eine Pflicht der Firmen aus dem Vertrag, kein Tempolimit der StVO.',
        'Ob du in eine **Fussgängerzone** überhaupt hineinfahren darfst, regelt die StVO. Fahrzeuge sind dort grundsätzlich verboten; ein Fahrrad zu schieben ist erlaubt. Öffnet die Behörde eine Zone per Verordnung für Räder und E-Scooter, fährst du nur an den dafür bestimmten Stellen hinein, hältst seitlich genug Abstand zu Häusern, Bänken, Bäumen und Ähnlichem und fährst Schritttempo (§ 76a StVO). Das gilt auch, wenn dein Roller dort schneller fahren könnte.',
        'Auch in einer **Wohnstrasse** ist Schritttempo die Grenze, und Fussgänger wie Radfahrer darfst du weder behindern noch gefährden (§ 76b StVO). In einer **Begegnungszone** sind 20 km/h erlaubt, 30 km/h nur, wenn die Behörde das verordnet hat; Fussgänger dürfen durch dich weder in Gefahr geraten noch aufgehalten werden (§ 76c StVO).',
      ],
    },
    {
      heading: 'Was die Stadt Wels noch plant',
      blocks: [
        'Im August 2023 arbeitete die Stadt nach eigenen Angaben an einem neuen Vertrag, der den Kodex ergänzen sollte: Leih-Scooter sollten in der Innenstadt und an Brennpunkten der Stadtteile nur noch auf markierten Flächen abgestellt werden. Wer anderswo abstellt, könnte die Fahrt dann nicht beenden und müsste weiterzahlen. Mobilitätsstadtrat Stefan Ganzert befürwortete damals ausserdem eine Kennzeichenpflicht, wie sie laut Stadt gerade in Wien eingeführt worden war. Beides war ein Plan, keine Regel.',
        'In der Sitzung des Gemeinderats vom 16. März 2026 sagte Stadtrat Ganzert: «Wir haben begonnen mit den Scooter-Abstellflächen.»',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Österreich: Helm, Alter, Promille',
      blocks: [
        'Was du auf dem Roller beachten musst, gilt in ganz Österreich gleich und steht in der StVO. Die Novelle BGBl. I Nr. 17/2026 brachte am 1. Mai 2026 den § 68a; der bisherige § 88b trat laut § 103 StVO am selben Tag ausser Kraft. Die wichtigsten Regeln:',
        {
          table: {
            caption: 'E-Scooter-Regeln in Österreich (StVO, Fassung vom 3. November 2026)',
            head: ['Regel', 'Was gilt', 'Wo es steht'],
            rows: [
              ['Alter', 'Kinder unter 12 fahren auf öffentlichen Strassen nur unter Aufsicht einer Person ab 16, ausser sie haben einen Radfahrausweis', '§ 68a Abs. 4 StVO'],
              ['Helm', 'Pflicht für alle unter 16, ausser der Körperbau lässt keinen Helm zu; wer ein Kind unter 12 beaufsichtigt, muss darauf achten, dass es ihn richtig trägt', '§ 68a Abs. 7 StVO'],
              ['Alkohol', 'Weniger als 0,5 Promille im Blut oder 0,25 mg/l in der Atemluft', '§ 68a Abs. 3 StVO'],
              ['Handy', 'Beim Fahren telefonierst du nur mit Freisprecheinrichtung', '§ 68 Abs. 3 StVO'],
              ['Fahrweise', 'Nicht freihändig fahren, dich nicht von einem anderen Fahrzeug ziehen lassen, keine Wettfahrten', '§ 68 Abs. 3 StVO'],
              ['Mitfahrer und Gepäck', 'Keine zweite Person; Güter nur in einem Behältnis für Helm oder Kleinkram, kein Anhänger, keine Tasche und kein Rucksack am Lenker', '§ 68a Abs. 2 StVO'],
              ['Ausrüstung', 'Wirksame Bremse, eine Vorrichtung für akustische Warnzeichen wie eine Klingel, Rückstrahler weiss nach vorn, rot nach hinten und gelb zur Seite, gelbe Blinker an den Lenkerenden; bei Dunkelheit und schlechter Sicht ein weisser Scheinwerfer und ein rotes Rücklicht', '§ 68a Abs. 5 StVO'],
            ],
          },
        },
        'Für die meisten Verstösse gegen die StVO liegt die Strafe bei höchstens 726 € (§ 99 Abs. 3). Teurer wird Alkohol: Ab 0,8 Promille gilt man jedenfalls als beeinträchtigt (§ 5 Abs. 1), und § 99 sieht dann 800 bis 3700 € vor (Abs. 1b), ab 1,2 Promille 1200 bis 4400 € (Abs. 1a) und ab 1,6 Promille oder bei verweigertem Alkotest 1600 bis 5900 € (Abs. 1). Bei bestimmten Übertretungen, die sie selbst feststellen, können Polizisten und ermächtigte Aufsichtsorgane die Geldstrafe mit einer Organstrafverfügung selbst einheben (§ 50 Verwaltungsstrafgesetz).',
        'Wie eine Stadt die Verleihfirmen per Verordnung bindet, zeigt der Ratgeber [E-Scooter in Klagenfurt](guide:klagenfurt).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Wels?',
      answer: 'Auf der Karte rund um Wels stehen Dott und Lime: am Dienstag, 3. November 2026, um 4:49 Uhr rund 200 Dott-Scooter, die zu diesem Zeitpunkt frei waren, und rund 90 Lime-Scooter nach der letzten Zählung. Dott vermietet laut seinen Bedingungen ab 18.',
    },
    {
      question: 'Wo darf ich in Wels einen Leih-Scooter nicht abstellen?',
      answer: 'Nach dem Verhaltenskodex, wie ihn das Amtsblatt im April 2021 beschrieb, nicht in Radabstellanlagen, vor Zugängen und Einfahrten, in Haltestellen, auf Rad- und Gehwegen, auf Gehsteigen unter 2,5 Meter Breite und auf Blindenleitsystemen. Im Burggarten, im Pollheimerpark, in der Burggasse und in den Fussgängerzonen Bäcker-, Schmidt- und Hafergasse sperrten die Firmen damals die Rückgabe. Ob du die Fahrt beenden kannst, prüfst du in der App.',
    },
    {
      question: 'Wie schnell fahren Leih-Scooter in Wels?',
      answer: 'Laut Amtsblatt vom April 2021 dürfen die Firmen ihre Roller nach dem Kodex auf höchstens 25 km/h einstellen, in den Fussgängerzonen Bäckergasse, Schmidtgasse, Stadtplatz, Burggasse und Hafergasse auf höchstens 10 km/h. Ist eine Fussgängerzone für E-Scooter geöffnet, verlangt die StVO dort Schritttempo (§ 76a).',
    },
    {
      question: 'Gilt in Wels eine Helmpflicht auf dem E-Scooter?',
      answer: 'Ja, für alle unter 16, seit dem 1. Mai 2026 in ganz Österreich (§ 68a Abs. 7 StVO). Ab 16 entscheidest du selbst; nach dem Kodex, wie ihn das Amtsblatt 2021 beschrieb, raten die Verleihfirmen zum Helm.',
    },
    {
      question: 'Darf ich in Wels mit dem E-Scooter auf dem Gehsteig fahren?',
      answer: 'Nein, Gehsteige und Gehwege entlangzufahren ist verboten (§ 68a Abs. 1 StVO). Gibt es einen Radweg oder eine andere Radfahranlage, nimmst du die; sonst fährst du auf der Fahrbahn.',
    },
    {
      question: 'Was passiert mit einem falsch abgestellten Leih-Scooter in Wels?',
      answer: 'Laut Kodex muss die Verleihfirma ihn innerhalb von drei Stunden nach einer Meldung wegbringen; das schrieb die Stadt 2021 und erneut 2023. Danach, oder sofort bei Gefahr, darf die Stadt ihn laut Amtsblatt von 2021 auf Kosten der Firma entfernen lassen. Dort steht auch, dass Kunden, die wiederholt falsch abstellen, von der Nutzung ausgeschlossen werden können.',
    },
  ],
  sources: [
    { title: 'Stadt Wels, Amtsblatt April 2021, S. 15: E-Scooter: Verhaltenskodex für den Verleih und Verkehr in Kraft getreten (PDF)', url: 'https://www.wels.gv.at/fileadmin/data/Pressecorner/Amtsblatt/2021/Amtsblatt_April_2021.pdf' },
    { title: 'Stadt Wels: Wels für Kennzeichenpflicht und Abstellzonen für E-Scooter (10.8.2023)', url: 'https://www.wels.gv.at/news/detail/wels-fuer-kennzeichenpflicht-und-abstellzonen-fuer-e-scooter/' },
    { title: 'Stadt Wels: Verhandlungsschrift der 43. Sitzung des Gemeinderates vom 16.3.2026 (PDF)', url: 'https://www.wels.gv.at/fileadmin/data/Politik/Gemeinderat/TOP_und_Gemeinderatsprotokolle/TOP_und_Gemeinderatsprotokolle_2026/43._Gemeinderatssitzung_16032026_Protokoll.pdf' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Österreich', url: 'https://ridedott.com/de/allgemeine/oesterreich/' },
    { title: 'RIS: Strassenverkehrsordnung 1960, geltende Fassung', url: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10011336' },
    { title: 'RIS: Kraftfahrgesetz 1967, § 1 (Anwendungsbereich)', url: 'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10011384&Paragraf=1' },
    { title: 'RIS: Verwaltungsstrafgesetz 1991, § 50 (Organstrafverfügungen)', url: 'https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10005770&Paragraf=50' },
  ],
};

export default guide;
