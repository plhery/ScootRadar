import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-st-gallen',
  topic: 'st-gallen',
  name: 'E-Trottinett St. Gallen: Dott, Preise, Zonen',
  title: 'E-Trottinett St. Gallen 2026: Dott, Preise, Zonen, Parkieren',
  description: 'E-Trottinett St. Gallen: Nur Dott (früher Tier) fährt hier. Was zehn Minuten kosten, was in der Altstadt gilt, wo du parkierst und was die Mühleggbahn erlaubt.',
  headline: 'E-Trottinett St. Gallen: E-Scooter von Dott mieten, Preise, Altstadt und Mühleggbahn',
  lede: 'Ein E-Trottinett in St. Gallen mietest du bei Dott, dem früheren Tier: Nur dieser Anbieter hat eine Bewilligung, und laut Stadt stehen 300 E-Trottinette und 200 E-Bikes bereit. Du musst mindestens 18 sein und zahlst CHF 1.20 fürs Entsperren plus 45 Rappen pro Minute, zehn Minuten kosten also CHF 5.70 (veröffentlichter Tarif vom 13. Oktober 2026). Durch die Altstadt darfst du fahren: Marktplatz, Bohl, Marktgasse und Gallusplatz sind Begegnungszonen mit Tempo 20 und Vortritt für Fussgänger, und beenden kannst du die Fahrt dort nur auf einem Dott-Platz.',
  published: '2026-10-13',
  updated: '2026-10-14',
  city: 'ch:st-gallen',
  sections: [
    {
      heading: 'E-Trottinett in St. Gallen mieten: Dott ist der einzige Anbieter',
      blocks: [
        'Lime, Voi, Bolt oder Bird suchst du in St. Gallen vergeblich. Seit 2020 lässt die Stadt nur Tier zu, das heute Dott heisst. 2022 schrieb sie die Bewilligung zusammen mit Gossau, Wittenbach, Gaiserwald und Berg öffentlich aus, und Tier gewann gegen zwei andere Angebote. Die Bewilligung lief ab dem 1. April 2023 für drei Jahre, mit Option auf zwei weitere, also längstens bis Ende März 2028. Ob die Stadt die Option gezogen hat, hat sie bis Oktober 2026 nicht veröffentlicht; Dott fährt weiter.',
        'Die [Karte von St. Gallen](map:ch:st-gallen) zeigt dir die freien Dott-Trottis; die E-Bikes findest du nur in der Dott-App. Am Morgen des 13. Oktober 2026 zeigte sie etwa 880, weit über die Stadt hinaus: von Gossau und Flawil über [Rorschach](map:ch:rorschach) bis ins Rheintal und nach Romanshorn. Innerhalb der Stadtgrenze waren es in der Nacht auf den 14. Oktober gut 300, ungefähr so viele, wie die Stadt nennt. So kommst du zu deinem Trotti:',
        {
          steps: [
            'Das nächste Dott-Trotti auf der [Live-Karte](map:ch:st-gallen) suchen.',
            'Die Dott-App öffnen, dich registrieren und ein Zahlungsmittel hinterlegen. Dott verlangt mindestens 18 Jahre.',
            'QR-Code scannen, entsperren und auf dem Velostreifen oder der Strasse losfahren.',
            'Die Fahrt dort beenden, wo die App es erlaubt. Dott kann ein Foto des parkierten Trottis verlangen.',
          ],
        },
        'Jeden Schritt im Detail erklärt der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in St. Gallen?',
      blocks: [
        'Dott verlangt in St. Gallen CHF 1.20 fürs Entsperren und 45 Rappen pro Minute, für E-Trottinette und E-Bikes gleich, so der offene Datenfeed von Dott vom 13. Oktober 2026. Massgebend ist der Preis, den dir die App vor dem Entsperren zeigt.',
        {
          table: {
            caption: 'Dott in und um St. Gallen: veröffentlichte Tarife vom 13. Oktober 2026 (offener Datenfeed)',
            head: ['Gebiet', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten', '30 Minuten'],
            rows: [
              ['Stadt St. Gallen, Gossau, Wittenbach, Gaiserwald, Flawil, Uzwil, Rorschach, Goldach, Rheintal', 'CHF 1.20', '45 Rappen', 'CHF 5.70', 'CHF 10.20', 'CHF 14.70'],
              ['Romanshorn und Amriswil (Thurgau)', 'CHF 1.50', '45 Rappen', 'CHF 6.–', 'CHF 10.50', 'CHF 15.–'],
            ],
          },
        },
        'Zeigt dir die Karte ein Trotti mit CHF 1.50 Entsperrgebühr, steht es nicht in St. Gallen, sondern im Thurgau. Um [Romanshorn](map:ch:romanshorn) und Amriswil betreibt Dott ein eigenes Gebiet mit diesem Tarif, und die Karte von St. Gallen reicht bis dorthin.',
        'Abos und Pässe sehen Dotts Schweizer Bedingungen vor; ob es einen Pass für St. Gallen gibt und was er kostet, zeigt nur die App.',
      ],
    },
    {
      heading: 'Altstadt, Marktplatz, Stiftsbezirk: Wo du in St. Gallen fahren darfst',
      blocks: [
        'Anders als in Bern oder Basel ist die Altstadt keine Sperrzone. Für E-Trottinette gelten laut Stadt dieselben Regeln wie für Velos, und die zentralen Plätze und Gassen sind **Begegnungszonen**: höchstens 20 km/h, Fussgänger haben Vortritt. Das gilt auf dem Marktplatz und dem Bohl, in Marktgasse, Spisergasse und Multergasse, im Stiftsbezirk mit Klosterhof und Gallusplatz, auf dem Bahnhofplatz und im westlichen Teil der Vadianstrasse.',
        'Dazu kommen Dotts Zonen in der App. Laut Dotts Hilfe-Center darfst du in roten Bereichen weder fahren noch parkieren, in grauen nicht parkieren, in gelben drosselt das Trotti, und in hellblauen beendest du die Fahrt nur an einem blauen «P», einem Dott-Platz. Die Tabelle zeigt, was Dotts offener Datenfeed für die Trottis festlegt; massgebend ist die App.',
        {
          table: {
            caption: 'Dotts Zonen für E-Trottinette in St. Gallen (unsere Auswertung von Dotts Datenfeed vom 14. Oktober 2026)',
            head: ['Zone', 'Was gilt', 'Wo, zum Beispiel'],
            rows: [
              ['Altstadt', 'Fahrt nur auf einem Dott-Platz beenden', 'Marktplatz, Bohl, Marktgasse, Klosterhof, Gallusplatz, Talstation der Mühleggbahn'],
              ['Parkverbot', 'Durchfahren ja, Fahrt beenden nein', 'Bahnhofplatz, Hauptgebäude der HSG, OLMA-Gelände, Kantonsspital, Stadtpark, Kreuzbleiche'],
              ['Parkverbot mit Tempo 10', 'Höchstens 10 km/h, kein Parkieren', 'Notkerstrasse'],
              ['Fahrverbot', 'Nicht fahren, nicht durchfahren, nicht parkieren', 'Drei Weieren; rundherum bis zum Freudenberg Parkverbot'],
              ['Stadion', 'Fahrt nur auf einem Dott-Platz beenden', 'Berit Sitterstadion'],
            ],
          },
        },
        { note: 'Die Züge der Appenzeller Bahnen fahren wie ein Tram durch die Stadt: vom Bahnhof über Bahnhofstrasse und Marktplatz zum Brühltor, auf Rillenschienen in der Strasse. Quere die Schienen möglichst rechtwinklig, fahr nie in der Rille und lass dem Zug den Vortritt, auch in der Begegnungszone.' },
      ],
    },
    {
      heading: 'E-Trottinett parkieren in St. Gallen: Dott-Plätze, Bahnhof, Trottoir',
      blocks: [
        'Laut Stadt parkierst du ein Sharing-Trotti auf allen Zweiradabstellplätzen und auf eigens markierten Abstellplätzen; in Zonen, die die Stadt festlegt, nur an offiziellen Veloabstellplätzen. Dazu gilt:',
        {
          list: [
            'auf dem Trottoir nur, wenn für Fussgänger 1,50 m frei bleiben, sonst kostet es CHF 20.– Busse;',
            'nie vor Eingängen, auf dem Fussgängerstreifen oder auf Blindenleitlinien;',
            'nie, wo die App Parkverbot zeigt, auch wenn das Gesetz seit dem 1. Juli 2025 Parkieren in Begegnungszonen erlaubt.',
          ],
        },
        '**In und um die Altstadt** heissen Dotts Plätze «Bonusparken»: beim Kloster, am Gallusplatz, am Blumenmarkt und am Brühltor, weiter westlich an der Vadianstrasse, am Roten Platz und am Neumarkt. Worin der Bonus besteht, erklärt Dott weder in seinen Bedingungen noch im Hilfe-Center.',
        '**Am Hauptbahnhof** ist der Bahnhofplatz in Dotts Zonen Parkverbotszone; Dott-Plätze gibt es auf der Nordseite an der Rosenbergstrasse und auf der Stadtseite beim Rathaus. Im Bahnhof steigst du ab: Die SBB verbietet das Fahren auf ihrem Areal. In der Nacht auf den 14. Oktober stand im Umkreis von 300 m um den Bahnhofplatz nur ein Trotti, um den Marktplatz 21.',
        'Befolgst du Dotts Park- und Sperranweisungen nicht, kann Dott laut seinen Schweizer Bedingungen bis zu 300 Euro verlangen, um das Trotti zurückzuholen. Landet eine Busse bei Dott, gibt Dott sie an dich weiter, plus 50 Euro Bearbeitungsgebühr. Steht ein Trotti im Weg, melde es auf [trotti-melder.ch](https://trotti-melder.ch).',
      ],
    },
    {
      heading: 'Hügel, Mühleggbahn, Bus und Zug: unterwegs in St. Gallen',
      blocks: [
        'Die Stadt erstreckt sich laut Velostadtplan von 500 bis 1075 m ü. M. Vom Marktplatz (668 m) sind es zur Universität rund 70 Höhenmeter, zu den Drei Weieren gut 100 und auf den Freudenberg 220. Der Motor hilft nur bis 20 km/h, und lange Steigungen leeren den Akku: Nimm für den Berg ein gut geladenes Trotti; die Karte zeigt den Akkustand.',
        {
          list: [
            '**Universität (HSG):** rund 1 km vom Hauptbahnhof. Vor dem Hauptgebäude gilt in Dotts Zonen Parkverbot; Dott-Plätze gibt es rund um den Campus.',
            '**Drei Weieren:** In Dotts Zonen gilt hier Fahrverbot (Tabelle oben). Beende die Fahrt vorher und geh zu Fuss, oder nimm die Mühleggbahn.',
            '**Mühleggbahn:** Die Standseilbahn fährt in rund 90 Sekunden von der Altstadt nach St. Georgen, täglich von 5.40 bis 0.50 Uhr. Ein E-Trottinett fährt für CHF 2.30 mit, du selbst für CHF 2.50. Der Tarif unterscheidet nicht zwischen eigenen und Miet-Trottis, doch bei Dott liefen die Minuten weiter: Beende die Dott-Fahrt besser unten, etwa am Gallusplatz; oben an der Bergstation hat Dott wieder einen Abstellplatz. Vom 9. bis 13. November 2026 steht die Bahn wegen Revision still.',
            '**Bus:** In den Bussen der VBSG braucht ein Velo oder ein ähnliches Fahrgerät mit mehr als 30 cm Raddurchmesser ein Billett zum reduzierten Tarif. Velos nimmt der Bus von 6 bis 8, 11 bis 14 und 17 bis 19 Uhr nicht mit, und im Zweifel entscheidet das Personal. Ein Dott-Trotti lässt du besser draussen: Beende die Fahrt, bevor du einsteigst.',
            '**Zug:** Dein eigenes E-Trottinett fährt bei der SBB gratis mit, wenn das grösste Rad kleiner als 12 Zoll ist, sonst brauchst du ein Velobillett. Dasselbe gilt laut Ostwind-Tarif in den Appenzeller Bahnen.',
          ],
        },
      ],
    },
    {
      heading: 'OLMA, Kinderfest, FC St. Gallen: E-Scooter an Anlässen',
      blocks: [
        {
          table: {
            caption: 'Grosse Anlässe in St. Gallen',
            head: ['Anlass', 'Wann', 'Was du wissen musst'],
            rows: [
              ['OLMA, auf dem Gelände der Olma Messen', 'Jedes Jahr im Oktober, 2026 vom 8. bis 18. Oktober', 'Auf dem Gelände gilt in Dotts Zonen Parkverbot, Dott-Plätze gibt es rundherum. Vom Bahnhof St. Fiden gehst du fünf Minuten, ab Hauptbahnhof fahren die Busse 3, 4 und 6'],
              ['FC St. Gallen im Berit Sitterstadion (früher Kybunpark)', 'Heimspiele laut Spielplan', 'Das Stadion liegt rund 5 km westlich des Hauptbahnhofs. Jedes Matchticket gilt 3 Stunden vor und nach dem Spiel als Fahrausweis im ganzen OSTWIND-Verbund, und vom Bahnhof Winkeln gehst du zu Fuss'],
              ['St. Galler Fest, in der Altstadt', '2026 am 14. und 15. August; das Datum 2027 ist noch offen', 'Die Altstadt ist bis spät in die Nacht voll: Beende die Fahrt am Rand und geh zu Fuss'],
              ['Kinderfest', 'Nächstes Mal 2028; das Datum steht frühestens im Mai 2027 fest', 'Rund 40 000 Besucherinnen und Besucher; temporäre Zonen zeigt die App'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Regeln und Bussen: was in St. Gallen kontrolliert wird',
      blocks: [
        'Die Unfälle mit E-Bikes und E-Trottinetten blieben 2025 laut Stadt «auf hohem Niveau», und die Stadtpolizei kontrolliert gezielt. Anfang September 2026 stürzten auf der Bahnhofstrasse zwei Männer, die gemeinsam auf einem Trotti standen. Das gilt für dich:',
        {
          list: [
            '**Ab 18** bei Dott. Das Gesetz: ab 16 ohne Führerausweis, mit 14 und 15 nur mit dem Ausweis der Kategorie M.',
            '**Velostreifen oder Veloweg**, sonst der rechte Fahrbahnrand. **Nie aufs Trottoir**: CHF 40.–.',
            '**Fussgängerzone** nur mit Zusatztafel für Velos und im Schritttempo, sonst CHF 30.–.',
            '**Nur eine Person** pro Trotti, auch kein Kind.',
            '**Licht an**, auch am Tag: Ohne kostet es tagsüber CHF 20.–.',
            '**Rotlicht**: CHF 60.–. **Handy in der Hand**: CHF 40.–.',
            '**Helm** empfohlen, keine Pflicht. **0,5 Promille** sind die Grenze; ab da droht ein Strafverfahren statt einer Ordnungsbusse.',
          ],
        },
        'Wer jünger als 15 ist, bekommt keine Ordnungsbusse, sondern wird verzeigt. Alle Bussen und Altersgrenzen findest du in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Dott-E-Bike, Gratisvelo, Carvelo: Alternativen zum Trotti',
      blocks: [
        'PubliBike, Velospot oder nextbike gibt es in St. Gallen nicht. Die Alternativen:',
        {
          list: [
            '**Dott-E-Bikes:** laut Stadt 200, in derselben App und zum selben Tarif wie die Trottis, und am Berg bequemer.',
            '**Gratisvelo:** In der Velostation unter der Fachhochschule beim Hauptbahnhof leihst du gratis ein Velo, gegen Ausweis und Depot; reservieren kannst du nicht.',
            '**Carvelo:** elektrische Lastenvelos, die du bei Gastgebern wie Cafés oder Restaurants abholst.',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? Drei Fakten aus St. Gallen',
      blocks: [
        {
          list: [
            '**Dotts Schweizer Firma sitzt in St. Gallen.** Die Tier Mobility Suisse GmbH, mit der du in der ganzen Schweiz deinen Mietvertrag schliesst, zog 2025 von Schlieren an die Davidstrasse 45.',
            '**100 Trottis, drei Monate, 50 000 Fahrten:** So endete im Sommer 2019 der Versuch mit Voi. Danach liess St. Gallen nur noch einen Anbieter zu und war damit «lange ein Sonderfall», wie SRF 2023 schrieb.',
            '**Die Mühleggbahn fuhr mit Wasser.** St. Gallens erste innerstädtische Verkehrsverbindung, 1893 eröffnet, lief mit Schwerkraft und Wassertanks im Wagenboden.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Gibt es in St. Gallen noch Tier-Trottinette?',
      answer: 'Ja, unter dem Namen Dott: Tier gehört heute zu Dott, und seit 2025 heissen die Trottis auch in St. Gallen so. Du mietest sie in der Dott-App, nicht mehr in der Tier-App.',
    },
    {
      question: 'Fahren die Dott-Trottis in St. Gallen auch im Winter?',
      answer: 'Ja. Die erste Bewilligung von 2020 erlaubte den Betrieb nur von März bis Oktober, doch im letzten Winter blieben die Trottis draussen: Dotts Datenfeed zeigte am 26. November 2025 190 und am 8. Februar 2026 258 Trottis in der Stadt. Die E-Bikes dagegen fehlten an beiden Tagen. Rechne mit Schnee und Eis: Die Stadt reicht bis auf 1075 m ü. M.',
    },
    {
      question: 'Wo melde ich ein falsch parkiertes E-Trottinett in St. Gallen?',
      answer: 'Auf trotti-melder.ch, auf das die Stadt verweist, oder direkt bei Dott: per Mail an stgallen@ridedott.com oder unter +41 43 505 16 18. Den Kundendienst erreichst du laut Stadt rund um die Uhr.',
    },
    {
      question: 'Ab welchem Alter kann ich in St. Gallen ein E-Trottinett mieten?',
      answer: 'Ab 18, das verlangt Dott. Ein eigenes E-Trottinett darfst du ab 16 ohne Führerausweis fahren, mit 14 und 15 nur mit dem Ausweis der Kategorie M, unter 14 gar nicht.',
    },
  ],
  sources: [
    { title: 'Stadt St. Gallen: Velos, E-Bikes und E-Trottinette', url: 'https://www.stadt.sg.ch/home/mobilitaet-verkehr/velo-fussverkehr/e-bikes-e-trottinette.html' },
    { title: 'Stadt St. Gallen: Begegnungszonen', url: 'https://www.stadt.sg.ch/home/mobilitaet-verkehr/verkehrsregeln/begegnungszonen.html' },
    { title: 'Stadt St. Gallen: Ausschreibung E-Trottinette, Zuschlag an Tier (12. Dezember 2022)', url: 'https://www.stadt.sg.ch/news/stsg_medienmitteilungen/2022/12/ausschreibung-e-trottinette-im-selbstverleih--tier-erhaelt-zusch.html' },
    { title: 'Stadt St. Gallen: Velostadtplan 2024 (PDF)', url: 'https://www.stadt.sg.ch/content/dam/dokument_library/dpb/tba/Verkehr/Velostadtplan%202024%20definitiv%20GzD%2024.02.2025.pdf' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Schweiz', url: 'https://ridedott.com/de/allgemeine/schweiz/' },
    { title: 'Dott: offener Datenfeed St. Gallen (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/st.-gallen/gbfs.json' },
    { title: 'Mühleggbahn: Fahrgastinfo', url: 'https://www.muehleggbahn.ch/Fahrgastinfo.htm' },
    { title: 'VBSG: Tarife', url: 'https://www.vbsg.ch/home/tickets-preise/tarife.html' },
    { title: 'FC St. Gallen: Stadionbesuch', url: 'https://www.fcsg.ch/pages/stadionbesuch' },
    { title: 'OLMA: Anreise', url: 'https://olma.ch/de/anreise' },
  ],
};

export default guide;
