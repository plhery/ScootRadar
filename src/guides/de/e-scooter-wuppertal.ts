import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wuppertal',
  topic: 'wuppertal',
  name: 'E-Scooter Wuppertal: Anbieter, Preise, Parken',
  title: 'E-Scooter Wuppertal 2026: Lime, Voi, Ryde, Ridemovi, Parken',
  description: 'E-Scooter in Wuppertal mieten: Lime, Voi, Ridemovi oder Ryde, ab 18 ohne Führerschein. 10 Minuten Voi: 1,80 €. Nie an Schwebebahnhöfen oder in Parks abstellen.',
  headline: 'E-Scooter Wuppertal: Anbieter, Preise, Parkzonen, Schwebebahn und Nordbahntrasse',
  lede: 'Einen E-Scooter in Wuppertal leihst du ab 18 und ohne Führerschein bei Lime, Voi, Ridemovi oder Ryde. Zehn Minuten kosten bei Voi laut Datenfeed 1,80 € (Stand 24. Oktober 2026), bei Ryde laut Presse vom Juli 2026 ebenso viel; Lime zeigt seinen Preis nur in der App. In Fussgängerzonen, Parks, auf Brücken und rund um die Schwebebahnhöfe beendest du keine Fahrt. In Bussen und in der Schwebebahn der WSW sind E-Scooter seit dem 18. März 2024 verboten.',
  published: '2026-10-16',
  updated: '2026-10-26',
  city: 'de:Wuppertal',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Wuppertal?',
      blocks: [
        'Im Oktober 2026 vermieten vier Anbieter E-Scooter in Wuppertal: **Lime** seit Oktober 2023, **Voi** seit April 2024, **Ridemovi** aus Mailand seit dem 9. Juni 2026 und **Ryde** aus Oslo seit Juli 2026. Eine Liste veröffentlicht die Stadt nicht; Lime, Voi und Ryde führen Wuppertal auf ihren Websites, Ridemovi nennt bisher nur die Lokalpresse. Dott und Bolt haben laut Wuppertaler Rundschau 2025 aufgehört, Dott laut Presseamt der Stadt zum 31. August 2025; Dotts Standortliste führt Wuppertal aber noch (Stand 26. Oktober 2026).',
        'Gemietet wird in der App des Anbieters, ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Auf der [Karte von Wuppertal](map:de:Wuppertal) zeigt ScootRadar Lime und seit dem 24. Oktober 2026 auch Voi: an jenem Samstag kurz nach 15 Uhr rund 950 Lime- und 1000 Voi-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Die Scooter von Ridemovi und Ryde findest du nur in deren Apps.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Wuppertal?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Wuppertal (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (Datenfeed, 24. Oktober 2026)', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
              ['Ryde (Presse, Juli 2026)', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
              ['Ridemovi (Presse, Juni 2026)', 'nicht genannt', '0,19 €', 'ab 1,90 €', 'ab 3,80 €'],
              ['Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Lime nennt für Wuppertal keinen Preis, weder auf der Website noch im Datenfeed. Laut Lime-Hilfe zahlst du eine Entsperrgebühr plus einen Minutenpreis, der nach Ort und Tageszeit schwanken kann; jede angefangene Minute zählt. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'Wo darf man in Wuppertal mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu.',
        '**«Radverkehr frei» gilt nicht für dich:** Unter dem Schild Gehweg oder Fussgängerzone erlaubt dieses Zusatzzeichen nur Fahrräder. Einen Bürgerantrag, solche Stellen stadtweit auch für E-Scooter freizugeben, lehnte der Verkehrsausschuss im Juni 2024 ab; die Stadt prüft nur im Einzelfall. Ab dem 1. März 2027 darfst du dort mit Schrittgeschwindigkeit fahren.',
        '**Elberfeld und Barmen:** Zur Fussgängerzone gehören laut Stadt in Elberfeld unter anderem Poststrasse, Alte Freiheit, Herzogstrasse, Kerstenplatz und Willy-Brandt-Platz, in Barmen Werth, Alter Markt, Rolingswerth und Johannes-Rau-Platz, dazu der Wupperfelder Markt. Dort steigst du ab und schiebst.',
        '**Nordbahntrasse:** Die Stadt beschreibt sie als rund 23 km langen, autofreien und nahezu kreuzungsfreien Fuss-, Rad- und Skateweg von Vohwinkel bis Schee, eröffnet am 19. Dezember 2014. Laut dem Verein Wuppertalbewegung ist sie für nichtmotorisierten Verkehr und Pedelecs gewidmet; ein E-Scooter ist rechtlich ein Kraftfahrzeug. Zu E-Scootern sagt die Stadt auf ihrer Trassen-Seite nichts (Stand Oktober 2026). Halte dich an die Schilder an den Zugängen. Fährst du, dann langsam und auf dem Asphalt, nicht auf dem Pflaster für Fussgänger: Innerstädtisch ist die Trasse laut Wuppertalbewegung stark genutzt und eher zu eng.',
        '**Steile Strassen:** Vom Tal auf die Höhen, etwa zur Uni auf dem Grifflenberg, geht es steil hinauf, und bergauf leert sich der Akku schneller. Laut Lime-Datenfeed hatte am Abend des 16. Oktober 2026 gut die Hälfte der Lime-Scooter weniger als 6 km Restreichweite. Die [Live-Karte](map:de:Wuppertal) zeigt die Reichweite jedes Lime- und Voi-Scooters, bevor du losgehst.',
      ],
    },
    {
      heading: 'E-Scooter in Wuppertal parken: Abstellflächen und Sperrzonen',
      blocks: [
        'Die Auflagen der Stadt für alle Anbieter verbieten, die Fahrt in **Parks und Grünanlagen, Fussgängerzonen, Wäldern und Schutzgebieten, auf Spielplätzen, Friedhöfen, Brücken und unbefestigten Wupperufern** zu beginnen oder zu beenden.',
        'In dichten Vierteln gilt ein Stationsprinzip: Dort beendest du die Fahrt nur an einer Abstellfläche, die die App zeigt, bei Lime als blaues P. Laut Stadt gab es im Juni 2026 über 200 solche Flächen, die meisten nur digital; 12 sind markiert und beschildert, 12 weitere in Abstimmung.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Stadt Wuppertal 2023 und 2024, WSW 2024)',
            head: ['Ort', 'Was gilt'],
            rows: [
              ['Hauptbahnhof (Elberfeld), Vorplatz Stadion/Zoo (Elberfeld-West)', 'Markierte Abstellfläche (Liste der Stadt, 2024)'],
              ['Alter Markt, Barmer Bahnhof, Friedrich-Engels-Allee, Schluchtstrasse (Barmen)', 'Markierte Abstellfläche (Liste der Stadt, 2024)'],
              ['Bruch, Kaiserstrasse, Vohwinkeler Strasse, Am Stationsgarten (Vohwinkel)', 'Markierte Abstellfläche (Liste der Stadt, 2024)'],
              ['Schwebebahnstationen und ihre Zugänge', 'Gar nicht: Abstellen verboten, auch in den Verteilerebenen'],
              ['Fussgängerzonen in Elberfeld und Barmen, Parks, Friedhöfe, Brücken', 'Gar nicht'],
              ['Arrenberg, Nordstadt, Rott, rund um den Zoo', 'Feste Abstellorte mit Sperrzonen drumherum (seit 2023): nur dort beenden, wo die App es erlaubt'],
            ],
          },
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Sperrzone oder neben statt auf der Abstellfläche. Solange die Fahrt läuft, zahlst du weiter. Ein Foto am Ende jeder Fahrt ist laut Stadt Pflicht.',
        },
        'Sonst stellst du aufrecht ab und lässt mindestens 2 m Gehweg frei. Tabu sind laut Stadt Gehwege unter 2 m, gemeinsame Geh- und Radwege unter 2,5 m, Blindenleitstreifen samt 60 cm daneben, Einfahrten und Eingänge, 15 m vor und hinter Haltestellen von Bus und Bahn sowie 5 m vor und hinter Kreuzungen.',
        'Falschparken kann teuer werden: Voi darf laut seinen deutschen Bedingungen 25 € berechnen, in der Regel erst nach einer Mahnung. Ryde kann bis zu 50 € verlangen, wenn der Scooter am Ende ausserhalb seines Gebiets steht. Das Ordnungsamt leitete 2025 wegen falsch abgestellter E-Scooter 1242 Bussgeldverfahren ein. Störende Scooter meldest du über scooter-melder.de oder die kostenlose Hotline, die laut Auflagen gut sichtbar auf jedem Scooter stehen muss.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Wuppertal: Bussgelder und Alkohol',
      blocks: [
        'In Wuppertal gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter und Schwebebahn: Was in Bus und Bahn gilt',
      blocks: [
        'Seit dem 18. März 2024 sind E-Scooter in den Bussen und der Schwebebahn der WSW verboten, wegen der Brandgefahr ihrer Lithium-Ionen-Akkus. Das gilt bis auf Weiteres, auch für deinen eigenen Scooter. Ausgenommen sind Pedelecs, Elektrorollstühle und Elektromobile für Menschen mit Gehbehinderung; nur um Letztere geht es in der WSW-Broschüre «Mit dem E-Scooter sicher unterwegs in Bus und Schwebebahn».',
        'Laut Hausordnung darfst du an den Schwebebahnstationen weder fahren noch abstellen. Die Verteilerebenen, die als öffentlicher Weg dienen, darfst du durchqueren, aber nur schiebend.',
        'Mit einem Leih-Scooter beendest du die Fahrt also vor der Station und mietest am Ziel einen neuen. Deinen eigenen Scooter darfst du im VRR zusammengeklappt in S-Bahn und Regionalzug mitnehmen, doch jedes Verkehrsunternehmen darf ihn ausschliessen. Mit der S8 bist du in Düsseldorf, wo andere Zonen gelten: [E-Scooter in Düsseldorf](guide:dusseldorf).',
      ],
    },
    {
      heading: 'Uni, Stadion, Feste: Tipps für Wuppertal',
      blocks: [
        '**Uni Grifflenberg:** Am Abend des 16. Oktober 2026 standen laut Lime-Datenfeed rund 60 Lime-Fahrzeuge im Umkreis von 1 km um den Campus. Wer den Berg nicht hinauffahren will, nimmt ab Hauptbahnhof die Linien 615 oder 645 oder ab der Historischen Stadthalle den Uni-Express.',
        '**Ronsdorf und Cronenberg:** Im Umkreis von 2 km um den Ronsdorfer Markt und um Cronenberg-Mitte stand am selben Abend kein Lime-Scooter, am Nachmittag des 24. Oktober auch kein Voi. Ob Ridemovi oder Ryde dort fahren, zeigen nur deren Apps.',
        '**Stadion am Zoo:** Hier spielt der Wuppertaler SV. Am Vorplatz Stadion/Zoo gibt es eine markierte Abstellfläche, die Schwebebahn hält an der Station Zoo/Stadion.',
        '**Feste und Baustellen:** Bei genehmigten Veranstaltungen müssen die Anbieter ihre Scooter laut Auflagen binnen 3 Stunden aus dem Bereich holen. Dort kannst du dann keine Fahrt beginnen oder beenden; die App sagt es dir.',
        '**Lieber Rad:** Lime und laut Datenfeed auch Voi vermieten in Wuppertal E-Bikes; die Karte zeigt sie nicht. An der Nordbahntrasse leihst du laut Wuppertalbewegung in Dorp und an der Mirke Fahrräder, Lastenräder und Pedelecs.',
      ],
    },
    {
      heading: 'Gebühr, Obergrenze, Auswahlverfahren: Wie Wuppertal E-Scooter regelt',
      blocks: [
        'Verbieten darf Wuppertal Leih-Scooter nicht: Nach dem Fahrrad- und Nahmobilitätsgesetz NRW kann die Stadt nur Auflagen machen. Diese beschloss der Rat im September 2023; Lime bekam seine Sondernutzungserlaubnis ab 1. Oktober 2023 für 500 Fahrzeuge.',
        'Laut Stadt hatten alle Anbieter zusammen zum 1. Juni 2024 1930 Fahrzeuge beantragt, 2025 waren es 3600 und 2026 3100. Im Februar 2026 beschloss der Rat eine höhere Gebühr (5 € pro Fahrzeug und Monat statt 10 € im Jahr), mehr Pflicht-Abstellflächen, eine Obergrenze und eine Quote von 10 % Fahrrädern, die laut Stadt ab 1. Oktober 2026 gelten sollte.',
        'Am 28. September 2026 nahm der Rat Gebühr, Quote (10 % Pedelecs je Anbieter) und eine mögliche Obergrenze in die neue Sondernutzungssatzung auf. Die Höhe der Obergrenze legt die Fachverwaltung fest; eine Zahl war bis Mitte Oktober 2026 nicht veröffentlicht.',
        'Schon am 15. September 2026 hatte der Verkehrsausschuss mit 13 zu 4 Stimmen die Verwaltung beauftragt, ein Auswahlverfahren für die Anbieter vorzubereiten, das 2027 laufen soll: unter anderem mit Ausweiskontrolle beim Ausleihen, einer Obergrenze für E-Scooter und mindestens 10 % Leihfahrrädern. Die Kriterien soll die Verwaltung zur nächsten Sitzung vorlegen, laut Kalender am 3. November 2026.',
        'Laut polizeilicher Unfallstatistik wurden 2025 in Wuppertal bei Unfällen mit E-Scootern, privaten wie geliehenen, 111 Menschen leicht und 13 schwer verletzt, nach 82 und 14 im Jahr 2024.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Wuppertal',
      blocks: [
        {
          list: [
            '**Rund 1,6 Millionen Fahrten** gab es 2025 laut Stadt allein mit Leihfahrzeugen; Fahrten mit privaten Scootern erfasst niemand.',
            '**Farbige Tunnel:** Auf der Nordbahntrasse leuchtet der Tunnel Dorrenberg rot, Engelberg blau, Dorp gelb und der Rotter Tunnel pink. So weiss die Notrufzentrale sofort, wo Hilfe gebraucht wird.',
            '**Nachts kein Piepen:** Zwischen 22 und 6 Uhr dürfen die Anbieter ihre Scooter in Wohngebieten nicht per Tonsignal orten.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Wuppertal nutzen?',
      answer: 'Die von Lime, Voi, Ridemovi und Ryde, Stand Oktober 2026. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Lime- und Voi-Scooter zeigt auch die [Live-Karte von Wuppertal](map:de:Wuppertal), die von Ridemovi und Ryde nur deren Apps.',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Wuppertal?',
      answer: 'Bei Voi 1,80 € (0,18 € pro Minute, Entsperren gratis, Stand 24. Oktober 2026), bei Ryde laut Presse vom Juli 2026 ebenso viel. Ridemovi kostete beim Start im Juni 2026 laut Presse 0,19 € pro Minute. Lime zeigt seinen Preis nur in der App.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Schwebebahn mitnehmen?',
      answer: 'Nein. Seit dem 18. März 2024 sind E-Scooter in der Schwebebahn und in den Bussen der WSW verboten, auch dein eigener, wegen der Brandgefahr. An den Stationen darfst du auch nicht fahren oder abstellen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter auf der Nordbahntrasse fahren?',
      answer: 'Das ist nicht eindeutig geregelt: Laut Wuppertalbewegung ist die Trasse für nichtmotorisierten Verkehr und Pedelecs gewidmet, die Stadt hat zu E-Scootern nichts veröffentlicht (Stand Oktober 2026). Achte auf die Schilder an den Zugängen und fahr langsam auf dem Asphalt. Auf Brücken und Viadukten beendest du keine Fahrt.',
    },
  ],
  sources: [
    { title: 'Stadt Wuppertal: Abstellflächen, E-Bike-Quote, Fahrzeugzahlen (VO/0711/26/1-A, Juni 2026, PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=366006&type=do' },
    { title: 'Stadt Wuppertal: Auflagen für Leih-Scooter (Anlage zu VO/0354/23, PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=311803&type=do' },
    { title: 'Rat der Stadt Wuppertal: Änderung der Auflagen (VO/0799/23/1-Neuf., PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=316727&type=do' },
    { title: 'Stadt Wuppertal: Abstellflächen für E-Scooter (VO/1104/24, PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=337146&type=do' },
    { title: 'Rat der Stadt Wuppertal: Niederschrift vom 23. Februar 2026 (PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=360655&type=do' },
    { title: 'Stadt Wuppertal: Sondernutzungssatzung, Neufassung (VO/1097/26, beschlossen am 28. September 2026, PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=370711&type=do' },
    { title: 'Ausschuss für Verkehr: Auswahlverfahren für E-Scooter-Verleih (VO/1098/26, 15. September 2026)', url: 'https://ris.wuppertal.de/to0050.asp?__ktonr=141672' },
    { title: 'Stadt Wuppertal: Unfälle mit E-Scootern (VO/0857/26/1-A, Juli 2026, PDF)', url: 'https://ris.wuppertal.de/getfile.asp?id=367721&type=do' },
    { title: 'WSW: E-Tretroller in Bussen und Schwebebahn verboten (8. März 2024)', url: 'https://schwebebahn.de/neuigkeiten/wsw-verbieten-e-tretroller' },
    { title: 'WSW: Hausordnung der Schwebebahn (PDF)', url: 'https://www.wsw-online.de/fileadmin/Dokumente/Mobilit%C3%A4t/Services/Schwebebahn/WSW-Schwebebahn-Hausordnung.pdf' },
    { title: 'Stadt Wuppertal: Nordbahntrasse', url: 'https://www.wuppertal.de/rathaus-buergerservice/verkehr/mobil_sein/nordbahntrasse.php' },
    { title: 'Wuppertalbewegung: FAQ zur Nordbahntrasse', url: 'https://www.wuppertalbewegung.de/faq' },
    { title: 'Voi: E-Scooter in Wuppertal', url: 'https://www.voi.com/de/city/wuppertal' },
    { title: 'NRW.Mobidrom: Mobilitätsdaten des Landes NRW, mit Vois offenen Datenfeeds', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Dott: Unsere Standorte (Stand 26. Oktober 2026)', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Wuppertaler Rundschau: «Dott» verlässt Wuppertal (18. August 2025)', url: 'https://www.wuppertaler-rundschau.de/lokales/e-scooter-anbieter-dott-verlaesst-wuppertal_aid-133176211' },
    { title: 'Wuppertaler Rundschau: Ein neuer E-Scooter-Anbieter in Wuppertal (13. Juni 2026)', url: 'https://www.wuppertaler-rundschau.de/lokales/ein-neuer-e-scooter-anbieter-in-wuppertal_aid-149815559' },
    { title: 'WZ: «Ryde», weiterer E-Scooter-Anbieter in Wuppertal (11. Juli 2026)', url: 'https://www.wz.de/nrw/wuppertal/ryde-weiterer-e-scooter-anbieter-in-wuppertal_aid-151344003' },
    { title: 'Wuppertaler Rundschau: Weiterer E-Scooter-Anbieter in Wuppertal gestartet (18. Juli 2026)', url: 'https://www.wuppertaler-rundschau.de/lokales/weiterer-e-scooter-anbieter-in-wuppertal-gestartet_aid-151691979' },
  ],
};

export default guide;
