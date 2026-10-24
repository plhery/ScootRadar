import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-tuebingen',
  topic: 'tubingen',
  name: 'E-Scooter Tübingen: Anbieter, Preise, Parken',
  title: 'E-Scooter Tübingen 2026: Anbieter, Preise, Verbotszonen',
  description: 'E-Scooter Tübingen: Voi, Bolt und Dott, was zehn Minuten kosten, wo du an Altstadt, Neckar und Uni nicht abstellst und was im TüBus gilt.',
  headline: 'E-Scooter Tübingen: Anbieter, Preise und Verbotszonen von der Altstadt bis auf den Schnarrenberg',
  lede: 'Einen E-Scooter in Tübingen leihst du ab 18 und ohne Führerschein bei Voi, Bolt oder Dott. Voi und Bolt kosten laut ihren Datenfeeds 0,20 € pro Minute ohne Entsperrgebühr (Stand 17. Oktober 2026). In der Fussgängerzone der Altstadt fährst du nicht, und an Marktplatz, Holzmarkt, Neckarfront und Platanenallee beendest du keine Fahrt. Ein Nachtverbot gibt es nicht.',
  published: '2026-10-18',
  updated: '2026-10-24',
  city: 'de:Tübingen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Tübingen?',
      blocks: [
        'Seit Frühjahr 2022 stehen in Tübingen Leih-Scooter. Im Oktober 2026 vermieten **Voi**, **Bolt** und **Dott**, das früher TIER hiess, E-Scooter in der Stadt; alle drei nennt auch die Stadt. Jeder Anbieter darf laut Stadt höchstens 200 Scooter aufstellen, im Umkreis von 100 Metern höchstens fünf an einem Ort. Gemietet wird in der App des Anbieters; Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am 17. Oktober 2026 um 19:25 Uhr zeigte die [Karte von Tübingen](map:de:Tübingen) rund 380 Scooter: rund 200 von Voi und rund 180 von Bolt. Das ist eine Momentaufnahme der offenen Datenfeeds, keine Flottengrösse. Voi ist seit 20. März 2025 in der Stadt und startete mit 200 Scootern.',
        '**Dott auf unserer Karte.** Dott nennt Tübingen, Reutlingen und Pfullingen als Standorte, veröffentlicht für die Gegend aber keinen offenen Datenfeed. Seit dem 24. Oktober 2026 zeigt unsere Karte die Dott-Scooter trotzdem: an diesem Samstag um 13:26 Uhr rund 130 in Tübingen. Was sie kosten, siehst du nur in der App.',
        '**Zeus** nennt die Stadt ebenfalls (Stand Oktober 2026). Im Datenfeed von Zeus für Tübingen ist aber keiner der 51 Scooter mietbar, die letzte Meldung stammt vom Oktober 2025, und auf der Städteliste von Zeus fehlt Tübingen. Ein Ende hat Zeus nicht mitgeteilt, soweit wir sehen; auf unserer Karte erscheint Zeus nicht. **Lime** hat Tübingen laut Stadt Mitte 2023 verlassen.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Tübingen?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Tübingen (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (Datenfeed, 17. Oktober 2026)', '0,00 €', '0,20 €', '2,00 €', '4,00 €'],
              ['Bolt (Datenfeed, 17. Oktober 2026)', '0,00 €', '0,20 €', '2,00 €', '4,00 €'],
              ['Dott', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Bolt wirbt deutschlandweit mit «ab 0,15 € pro Minute», der Tarif variiert aber je nach Standort; für Tübingen und Reutlingen nennt sein Feed 0,20 €. Bolt verkauft laut Website auch Wochen- und Monatspässe. Voi nannte zum Start im März 2025 17 Cent pro Minute und Pässe ab 4,99 €. Was heute gilt, zeigt die App.',
      ],
    },
    {
      heading: 'E-Scooter in Tübingen abstellen: Altstadt, Neckar und Verbotszonen',
      blocks: [
        'Die Stadt gibt die Grundregeln vor: In Fussgängerzonen und Parkanlagen dürfen E-Scooter weder fahren noch abgestellt werden. Rettungswege, Einfahrten, Bushaltestellen, Brücken, Schulgelände sowie Natur- und Landschaftsschutzgebiete bleiben frei. Fast die ganze Altstadt ist Fussgängerzone.',
        'Seit 1. Oktober 2025 verbietet zudem die Polizeiliche Umweltschutzverordnung der Stadt, in Grünanlagen zu fahren oder Fahrzeuge abzustellen, wenn kein Verkehrszeichen etwas anderes regelt. Dazu zählen auch Rasen, Pflanzungen, Grünstreifen an Strassen sowie Spiel- und Sportplätze. Ein Verstoss kann 5 bis 5000 € kosten.',
        'Voi und Bolt setzen das mit Verbotszonen in ihren Apps um, in denen sich die Fahrt nicht beenden lässt. Laut ihren Datenfeeds gilt an bekannten Orten:',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Datenfeeds von Voi und Bolt, Stand 18. Oktober 2026)',
            head: ['Ort', 'Voi', 'Bolt'],
            rows: [
              ['Marktplatz, Holzmarkt, Kirchgasse, Neckargasse, Schloss Hohentübingen', 'Verbotszone', 'Verbotszone'],
              ['Eberhardsbrücke, Neckarfront mit Hölderlinturm, Platanenallee und Neckarinsel, Anlagensee', 'Verbotszone', 'Verbotszone'],
              ['Hauptbahnhof', 'Verbotszone, ausser an der Voi-Station auf dem Europaplatz', 'Erlaubt, nur nicht direkt am Bahnhofsgebäude'],
              ['Europaplatz mit ZOB', 'Im Westteil Verbotszone', 'Erlaubt'],
              ['Neue Aula, Universitätsbibliothek, Kupferbau, Mensa Wilhelmstrasse', 'Erlaubt', 'Verbotszone'],
              ['Morgenstelle, Universitätsklinikum und BG Klinik auf dem Schnarrenberg', 'Teils Verbotszone; an Mensa Morgenstelle, CRONA und BG Klinik erlaubt', 'Verbotszone'],
              ['Waldhäuser Ost, Sand, Lustnau, Derendingen, Südstadt', 'Meist erlaubt', 'Meist erlaubt'],
              ['Hagelloch, Pfrondorf, Bebenhausen, Hirschau, Unterjesingen', 'Ausserhalb des Gebiets', 'Ausserhalb des Gebiets'],
            ],
          },
        },
        'Kleinere Verbotszonen zeigt die App auch in Wohngebieten. Wo sie das Abstellen erlaubt, gelten trotzdem die Regeln der Stadt: nicht auf Rasen, an Haltestellen oder Einfahrten, und niemand darf behindert werden. Der Kommunale Ordnungsdienst verwarnt falsch oder behindernd abgestellte Scooter. Feste Abstellflächen gibt es kaum: Im April 2024 nannte die Stadt eine einzige, in der Zwehrenbühlstrasse, und Pflicht ist sie nicht.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder ausserhalb des Gebiets. Schieb den Scooter aus der Fussgängerzone oder vom Neckarufer weg, bis die App das Abstellen erlaubt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Mit dem E-Scooter zur Uni, auf den Berg und zum Bahnhof',
      blocks: [
        'Für Studierende der Eberhard Karls Universität zählt vor allem, wo die Fahrt enden darf. Das Universitätsgelände gehört nicht der Stadt, die es 2022 zu den Sperrflächen fürs Abstellen zählte. Heute sperrt Bolt das Fahrtende rund um Neue Aula, Universitätsbibliothek, Kupferbau und Mensa Wilhelmstrasse, Voi nicht.',
        'Die Morgenstelle, das Universitätsklinikum mit dem CRONA, die BG Klinik und Waldhäuser Ost liegen auf den Höhen nördlich der Altstadt. Bolt sperrt oben das Abstellen auf der Morgenstelle und an allen Kliniken, Voi nur Teile der Morgenstelle. In Waldhäuser Ost geht es bei beiden. Neue Bolt-Nutzer fahren laut Bolt die ersten fünf Fahrten mit höchstens 15 km/h.',
        'Am **Hauptbahnhof** stellst du einen Bolt fast überall ab, nur nicht direkt am Bahnhofsgebäude. Voi sperrt den Bahnhof und den Westteil des Europaplatzes, hat dort aber eine Station, die die App zeigt. Am ZOB gilt: nicht an die Bussteige, Haltestellen müssen laut Stadt frei bleiben.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Tübingen: wo du fährst, Bussgelder, Promille',
      blocks: [
        'Es gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur, wo es keinen gibt, auf der Fahrbahn. Auf Gehwegen und in der Fussgängerzone fährst du nicht. Der Kommunale Ordnungsdienst kontrolliert laut Stadt (Juni 2023) gezielt Räder und E-Scooter auf Gehwegen und darf dich anhalten und verwarnen; die Bussgelder legt aber der bundesweite Bussgeldkatalog fest.',
        'Manche Gassen der Altstadt öffnet ein Zusatzschild für den Radverkehr. Für E-Scooter gilt es heute nicht. Ab 1. März 2027 gibt «Radverkehr frei» auch E-Scooter frei, im Schritttempo: Ob du dann durch eine Altstadtgasse fahren darfst, hängt vom Schild ab. Ein Nachtverbot gibt es nicht: Laut Datenfeed vermieten beide rund um die Uhr.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter im TüBus und in naldo-Zügen',
      blocks: [
        'Im Verbund naldo, also im TüBus, in den Regionalbussen und Zügen, fährt ein eigener E-Scooter als Handgepäck kostenlos mit, wenn er zusammengeklappt ist, weniger als 15 kg wiegt und kürzer als 1,15 m ist (Beförderungsbedingungen, Stand 1. April 2026). Ein schwererer, längerer oder nicht geklappter Scooter wird wie ein Fahrrad behandelt: Er kostet dann einen Kinder-Einzelfahrschein, von 20 bis 5 Uhr nichts.',
        '**TüBus:** Fahrräder und damit grosse oder nicht geklappte Scooter nimmt er nur bergauf auf festen Abschnitten mit, höchstens zwei pro Mehrzweckabteil und im Stadtgebiet kostenlos, etwa auf Linie 5 von der Gmelinstrasse nach WHO Ahornweg oder auf den Linien 13 und 19 vom Parkhaus König zur BG Unfallklinik. An Schultagen gelten Sperrzeiten, meist am Morgen, auf Linie 5 von 7 bis 19 Uhr.',
        '**Leih-Scooter** nennen naldo und TüBus nicht eigens; laut Verbraucherzentrale werden sie im Nahverkehr ohnehin nicht mitgenommen. Beende die Fahrt also vor der Haltestelle, nicht an ihr, fahr mit dem Bus etwa auf den Schnarrenberg und miete oben einen neuen.',
      ],
    },
    {
      heading: 'Nach Reutlingen: zwei Gebiete, ein Bolt-Feed',
      blocks: [
        'Die [Karte von Reutlingen](map:de:Reutlingen) zeigte am 17. Oktober 2026 um 19:25 Uhr rund 320 Scooter, rund 170 von Voi und rund 150 von Bolt.',
        'Bolt führt Tübingen und Reutlingen in seinem Datenfeed als ein System mit einem Preis. Die beiden Gebiete liegen aber mehrere Kilometer auseinander, und eine Fahrt beendest du nur in einem von ihnen. Voi sperrt laut Feed sogar das Weiterfahren dazwischen, etwa bei Kusterdingen und Kirchentellinsfurt. Von Stadt zu Stadt nimmst du also Zug oder Bus und mietest drüben neu.',
        'In Stuttgart fahren neben Voi und Bolt auch Dott und Lime; in der City endet die Fahrt dort nur auf markierten Flächen: [E-Scooter in Stuttgart](guide:stuttgart).',
      ],
    },
    {
      heading: 'Wie Tübingen E-Scooter regelt: Kooperationsvertrag statt Sondernutzung',
      blocks: [
        'Tübingen vergibt keine Sondernutzungserlaubnis. 2022 unterschrieben alle damaligen Anbieter einen freiwilligen Kooperationsvertrag über Flottengrösse, Verteilung, Abstellen und Ansprechpartner; im April 2024 bestätigte die Verwaltung diese Vereinbarung. Eine Gebühr ist nicht geregelt: Laut einem Antrag aus dem Gemeinderat nutzten die Anbieter den öffentlichen Raum 2022 kostenfrei, und die Sondernutzungsrichtlinien der Stadt (Fassung März 2026) nennen E-Scooter nicht.',
        'Im April 2024 zog die Verwaltung Bilanz: Die Lage habe sich «ganz deutlich verbessert», es gebe weniger als 15 Beschwerden im Jahr. Die Verbotszonen legen die Anbieter auf Anweisung der Stadt fest. Einen eigenen Plan mit Sperrzonen und markierten Abstellflächen kündigte die Stadt im November 2022 an. Im April 2024 war er für empfindliche Stellen wie ZOB, Neckarbrücke und Mühlstrasse «in Arbeit», und im Oktober 2026 schreibt die Stadt, sie erarbeite ihn derzeit.',
      ],
    },
    {
      heading: 'Schon gewusst? Platanen und der ticketfreie Samstag',
      blocks: [
        {
          list: [
            '**Die Platanen kosteten 32 Gulden.** Die Bäume der Platanenallee wurden laut Stadt im Januar und Februar 1828 bei der «exotischen Baumschule Hohenheim» gekauft und «unter den Augen Friedrich Hölderlins» gepflanzt. Die Stadt nennt sie die älteste Platanenallee Deutschlands.',
            '**Samstags fährst du ohne Ticket.** Von Samstag 0 Uhr bis Sonntag 5 Uhr brauchst du in den TüBus-Linien im Stadtgebiet keinen Fahrschein, auch nicht im Nachtbus innerhalb der Stadt. Ausgenommen sind die Züge nach Derendingen und Lustnau und die Anmeldefahrten des Nacht-SAM; wer über die Stadtgrenze fährt, braucht weiter ein naldo-Ticket.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Tübingen?',
      answer: 'Die von Voi, Bolt oder Dott; TIER heisst heute Dott. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Scooter aller drei zeigt auch die [Live-Karte von Tübingen](map:de:Tübingen).',
    },
    {
      question: 'Was kostet ein E-Scooter in Tübingen?',
      answer: 'Bei Voi und Bolt laut Datenfeed 0,20 € pro Minute ohne Entsperrgebühr, zehn Minuten also 2 € (Stand 17. Oktober 2026). Dott zeigt seinen Preis in der App.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Tübinger Altstadt fahren?',
      answer: 'Fast die ganze Altstadt ist Fussgängerzone: Dort fährst du nicht und stellst nicht ab. Ab 1. März 2027 darfst du durch Gassen fahren, an denen ein Schild «Radverkehr frei» steht, dann im Schritttempo.',
    },
    {
      question: 'Komme ich mit dem Leih-Scooter von Tübingen nach Reutlingen?',
      answer: 'Nicht in einer Fahrt. Bolt beendet Fahrten nur innerhalb eines der beiden Gebiete, Voi sperrt das Fahren dazwischen. Nimm Zug oder Bus und miete in Reutlingen neu.',
    },
    {
      question: 'Darf ich einen E-Scooter im TüBus mitnehmen?',
      answer: 'Einen eigenen, zusammengeklappten Scooter unter 15 kg und kürzer als 1,15 m als Handgepäck. Grössere oder nicht geklappte gelten als Fahrrad und fahren nur bergauf auf festen Abschnitten mit. Leih-Scooter werden laut Verbraucherzentrale im Nahverkehr nicht mitgenommen.',
    },
    {
      question: 'Wo melde ich einen falsch abgestellten E-Scooter?',
      answer: 'Beim Anbieter: Bolt unter tuebingen-micromobility@bolt.eu, Voi unter support@voiapp.io, Dott unter support@ridedott.com.',
    },
  ],
  sources: [
    { title: 'Stadt Tübingen: Regelungen für E-Scooter in Tübingen', url: 'https://www.tuebingen.de/14113/36279.html' },
    { title: 'Stadt Tübingen: Fussgängerzone', url: 'https://www.tuebingen.de/40767/40768.html' },
    { title: 'Stadt Tübingen: Vorlage 148/2022, Umgang mit E-Tretrollern (27. April 2022)', url: 'https://www.tuebingen.de/gemeinderat/getfile.asp?id=79376&type=do' },
    { title: 'Stadt Tübingen: Vorlage 533/2022, Interfraktioneller Antrag zum Umgang mit E-Scootern (9. Mai 2022)', url: 'https://www.tuebingen.de/gemeinderat/getfile.asp?id=79776&type=do' },
    { title: 'Stadt Tübingen: Vorlage 533a/2022, Umgang mit E-Scootern (23. November 2022)', url: 'https://www.tuebingen.de/gemeinderat/getfile.asp?id=82586&type=do' },
    { title: 'Stadt Tübingen: Vorlage 528a/2023, E-Scooter (30. April 2024)', url: 'https://www.tuebingen.de/gemeinderat/getfile.asp?id=92948&type=do' },
    { title: 'Stadt Tübingen: Gehwege sind für Fahrräder und E-Scooter tabu (20. Juni 2023)', url: 'https://www.tuebingen.de/pressemitteilungen/38784/40091.html' },
    { title: 'Stadt Tübingen: Polizeiliche Umweltschutzverordnung (Fassung vom 29. September 2025)', url: 'https://www.tuebingen.de/verwaltung/formular/431.pdf' },
    { title: 'Stadt Tübingen: Sondernutzungsrichtlinien (Fassung vom 24. März 2026)', url: 'https://www.tuebingen.de/verwaltung/formular/440.pdf' },
    { title: 'MobiData BW: Datenfeed von Bolt in Reutlingen und Tübingen (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_reutlingen_tuebingen/gbfs' },
    { title: 'MobiData BW: Datenfeed von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/gbfs' },
    { title: 'Zeus: Datenfeed für Tübingen (GBFS)', url: 'https://zeus.city/api/v1/mds/gbfs/tubingen/gbfs.json' },
    { title: 'Zeus: Städte', url: 'https://zeusscooters.com/cities/' },
    { title: 'Dott: Standorte', url: 'https://ridedott.com/de/locations' },
    { title: 'Bolt: Tübingen', url: 'https://bolt.eu/de-de/cities/tubingen/' },
    { title: 'Bolt: E-Scooter mieten', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Voi: Voi startet E-Scooter-Sharing in Tübingen (18. März 2025)', url: 'https://storage.mfn.se/4931c250-01d7-4021-b9b4-5a4779445eae/e-scooter-anbieter-voi-startet-in-tubingen.pdf' },
    { title: 'naldo: Anlagen zu den Beförderungsbedingungen (1. April 2026)', url: 'https://www.naldo.de/fileadmin/media/tickets/TB-BB/2026-04-01-Anlagen_Befoerderungsbedingungen.pdf' },
    { title: 'naldo: Tarifbestimmungen (1. August 2026)', url: 'https://www.naldo.de/fileadmin/media/tickets/TB-BB/2026-08-01-Tarifbestimmungen.pdf' },
    { title: 'TüBus: Mitnahmeregeln', url: 'https://www.tuebus.de/tickets/mitnahmeregeln.html' },
    { title: 'TüBus: Ticketfreier Samstag im TüBus', url: 'https://www.tuebus.de/fahrgastinformationen/ticketfreier-samstag-im-tuebus.html' },
    { title: 'Verbraucherzentrale: E-Scooter, diese Regeln gelten für Elektrotretroller (15. April 2026)', url: 'https://www.verbraucherzentrale.de/wissen/energie/emobilitaet/escooter-diese-regeln-gelten-fuer-elektrotretroller-35716' },
    { title: 'Stadt Tübingen: Geschichte der Platanenallee', url: 'https://www.tuebingen.de/17634/25773.html' },
  ],
};

export default guide;
