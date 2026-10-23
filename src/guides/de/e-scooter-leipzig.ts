import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-leipzig',
  topic: 'leipzig',
  name: 'E-Scooter Leipzig: Anbieter, Preise, Stationen',
  title: 'E-Scooter Leipzig 2026: Anbieter, Preise, Stationen, LVB',
  description: 'E-Scooter Leipzig: Dott und Voi, was zehn Minuten kosten, warum du nur an Mobilitätsstationen abstellst und warum kein Scooter in die Strassenbahn darf.',
  headline: 'E-Scooter Leipzig: Dott und Voi, Preise, Mobilitätsstationen und was in Innenstadt und Strassenbahn gilt',
  lede: 'Einen E-Scooter in Leipzig leihst du ab 18 und ohne Führerschein bei Dott, früher TIER, oder bei Voi, in deren Apps oder in LeipzigMOVE, der App der Leipziger Verkehrsbetriebe (LVB). In LeipzigMOVE kostet jeder Scooter 1 € fürs Entsperren und 0,22 € pro Minute, in der Dott-App ebenso; zehn Minuten kosten also 3,20 € (Stand 17. Oktober 2026). Abstellen darfst du nur an markierten Stationen, meist Mobilitätsstationen der LVB, und innerhalb des Promenadenrings um die Innenstadt gibt es kaum welche. In Strassenbahnen und Bussen der LVB darf seit dem 1. Mai 2024 kein E-Scooter mehr mit, auch kein eigener.',
  published: '2026-10-17',
  updated: '2026-10-23',
  city: 'de:Leipzig',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Leipzig?',
      blocks: [
        'Im Oktober 2026 vermieten zwei Anbieter E-Scooter in Leipzig: **Dott**, das früher TIER hiess, und **Voi**. Die LVB hatten das Angebot 2021 an TIER und Voi vergeben; wie lange die Vereinbarung läuft, sagen weder LVB noch Stadt. Du mietest in der App des Anbieters oder in **LeipzigMOVE**, wo du mit einem Konto auch Fahrkarten, nextbike-Räder und Taxis buchst. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '**Bolt gibt es in Leipzig nur als Fahrdienst.** Laut seiner Website bietet Bolt in Leipzig Fahrten mit Fahrer und Taxis an, aber keine E-Scooter.',
        '**Voi fehlt auf unserer Karte.** ScootRadar zeigt auf der [Karte von Leipzig](map:de:Leipzig) nur Dott, weil nur Dott für Leipzig offene Standortdaten veröffentlicht: am Abend des 16. Oktober 2026 und in der Nacht darauf jeweils rund 300 Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Wo Voi-Scooter stehen, zeigen nur die Voi-App und LeipzigMOVE.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Leipzig?',
      blocks: [
        'Dott und die LVB in LeipzigMOVE veröffentlichen denselben Tarif; in LeipzigMOVE gilt er für Dott und Voi. Was Voi in der eigenen App verlangt, zeigt dir die Voi-App.',
        {
          table: {
            caption: 'E-Scooter-Preise in Leipzig (veröffentlichte Tarife, Stand 17. Oktober 2026)',
            head: ['Wo du mietest', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott-App', '1,00 €', '0,22 €', '3,20 €', '5,40 €'],
              ['LeipzigMOVE (Dott und Voi)', '1,00 €', '0,22 €', '3,20 €', '5,40 €'],
            ],
          },
        },
        'Jede angefangene Minute zählt. In LeipzigMOVE endet eine Miete laut LVB nach spätestens 60 Minuten, Pausen eingerechnet. Sie endet auch von selbst, wenn du einen Voi-Scooter 10 Minuten oder einen Dott-Scooter länger als 30 Minuten nicht bewegst. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        '**Günstiger mit dem Rad:** nextbike hat laut LVB 1500 Räder in Leipzig; in LeipzigMOVE kostet jede angefangene Viertelstunde 1 €. Zurückgeben kannst du das Rad gratis an jeder Mobilitätsstation und in der blauen Zone der App, in der pinken Zone für 1 € extra; ausserhalb kostet es mindestens 20 €.',
        'Den nächsten Dott-Scooter mit Akkustand und eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Leipzig](map:de:Leipzig).',
      ],
    },
    {
      heading: 'E-Scooter in Leipzig abstellen: nur an Stationen',
      blocks: [
        'Leipzig lässt E-Scooter nur an festen Stationen verleihen. Einen Verleih ohne Stationen nennt die Stadt «nicht genehmigungsfähig», weil sich Auflagen dann kaum kontrollieren und durchsetzen liessen. Scooter-Stationen innerhalb des Promenadenrings lehnt sie ab. Dotts Datenfeed zeigt dort im Oktober 2026 nur eine, an der Markgrafenstrasse am Südende der Petersstrasse.',
        'Du beendest jede Fahrt also auf einer markierten E-Scooter-Fläche; in LeipzigMOVE erkennst du sie am lila Scooter-Symbol. Woanders lässt sich die Fahrt nicht beenden, die Minuten laufen weiter, und LeipzigMOVE berechnet 25 € Strafgebühr. Das gilt laut LVB für alle Fahrten mit Leipziger E-Scootern.',
        {
          note: 'Liegt dein Ziel in der Altstadt, endet die Fahrt meist am Ring, etwa am Hauptbahnhof, am Augustusplatz oder am Goerdelerring. Den Rest gehst du zu Fuss. Such dir die Station vor dem Losfahren aus, sonst bezahlst du die Suche nach einem freien Platz mit.',
        },
        'Am 17. Oktober 2026 nannte Dotts Datenfeed 137 Abstellorte, 120 davon an LVB-Mobilitätsstationen. Dazu kommen 15 Flächen etwa an der Media City, an der Arena Leipzig, an der DHfK oder an OBI-Märkten sowie 2 vorübergehende. Stationen auf eigenem Grund konnten Firmen und Privatleute laut Stadt schon zum Start bei den Anbietern anfragen.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung des Dott-Datenfeeds, 17. Oktober 2026)',
            head: ['Ort', 'Nächster Dott-Abstellort (Plätze)'],
            rows: [
              ['Hauptbahnhof', 'Westseite (12) und Ostseite (6)'],
              ['Markt, Thomaskirche, Grimmaische Strasse', 'Markgrafenstrasse (5), gut 400 m vom Markt; sonst Goerdelerring (6) oder Thomasiusstrasse (3)'],
              ['Augustusplatz mit Uni und Gewandhaus', 'Augustusplatz (3) und Georgiring/Schützenstrasse (3)'],
              ['Zoo Leipzig', 'Station Zoo (6)'],
              ['Red Bull Arena', 'Wettiner Strasse (3), gut 300 m; Arena Leipzig (20), gut 500 m'],
              ['Völkerschlachtdenkmal', 'Station Völkerschlachtdenkmal (6)'],
              ['Neue Messe', 'Keiner in der Nähe, der nächste gut 2 km entfernt'],
              ['Flughafen Leipzig/Halle, Cospudener See', 'Keiner, beide liegen ausserhalb von Dotts Gebiet'],
            ],
          },
        },
        'Fahrradbügel sind laut Stadt den Fahrrädern vorbehalten; auch einen eigenen Scooter sollst du dort nicht abstellen. Das Netz wächst: Bis 2030 sollen laut LVB 400 weitere Mobilitätsstationen dazukommen, vor allem in den Stadtvierteln, an Knotenpunkten von Bus und Bahn und am Stadtrand.',
      ],
    },
    {
      heading: 'Wo darf man in Leipzig mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es.',
        '**Innenstadt:** Die Achsen Hainstrasse–Markt–Petersstrasse und Thomasgasse–Markt–Grimmaische Strasse sind Fussgängerzonen. Radfahren erlaubt die Stadt nur von 20 bis 11 Uhr, und zwar in der Petersstrasse zwischen Markt und Peterskirchhof, der Hainstrasse, der Nikolaistrasse zwischen Brühl und Nikolaikirchhof und der Grimmaischen Strasse zwischen Markt und Augustusplatz. Für E-Scooter gilt diese Freigabe heute nicht: Steig ab und schieb.',
        '**Ab 1. März 2027** gilt jedes Verkehrsschild mit Fahrrad-Symbol auch für E-Scooter, also auch die Freigabe einer Fussgängerzone für den Radverkehr; dort fährst du dann im Schritttempo. Städte dürfen E-Scooter aber eigens ausschliessen. Ob Leipzig das in der Innenstadt tut, hat die Stadt bisher nicht gesagt (Stand Oktober 2026); sonst dürftest du dort zu denselben Zeiten fahren wie Fahrräder.',
        '**Merseburger Strasse:** In Lindenau ist sie zwischen Karl-Heine-Strasse und Aurelienstrasse seit dem 9. September 2024 Fussgängerzone. Auch dort schiebst du.',
        '**Parks:** Eine eigene Leipziger Regel für E-Scooter in Parks gibt es nicht, auch nicht in der Polizeiverordnung der Stadt. Es gelten die deutschen Regeln: Im Park darfst du nur auf ausgeschilderten Radwegen oder gemeinsamen Geh- und Radwegen fahren, und Fussgänger haben dort Vorrang. Auf den Splittwegen der Parks, etwa im Johannapark, lösen schwere E-Bikes und E-Roller laut Amt für Stadtgrün und Gewässer besonders schnell Material und wirbeln Staub auf (2025).',
        '**Auwald:** Im Wald gilt das sächsische Waldgesetz. Radfahren ist dort nur auf Strassen und Wegen erlaubt, nicht auf Fusswegen. Das Fahren mit Motorfahrzeugen gehört nicht zum freien Betreten des Waldes und braucht die Erlaubnis des Waldbesitzers. Ob ein E-Scooter als Motorfahrzeug in diesem Sinn gilt, sagt das Gesetz nicht ausdrücklich, rechtlich ist er aber ein Kraftfahrzeug. Bleib deshalb auf ausgeschilderten Radwegen und Strassen.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Leipzig: Bussgelder und Alkohol',
      blocks: [
        'In Leipzig gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Eigene Verkehrsregeln für E-Scooter haben weder Sachsen noch Leipzig.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0. LeipzigMOVE verbietet das Fahren unter Alkohol, Drogen oder Medikamenten ganz und empfiehlt einen Helm.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn und Bus: Was bei LVB und MDV gilt',
      blocks: [
        'Seit dem 1. Mai 2024 darfst du in Bussen, Strassenbahnen und Flexa-Fahrzeugen der LVB keinen E-Scooter mehr mitnehmen, wegen der Brandgefahr der Akkus. Die Beförderungsbedingungen des Mitteldeutschen Verkehrsverbunds (MDV), gültig seit 1. August 2026, schliessen E-Scooter in den Fahrzeugen der LVB und der HAVAG in Halle weiterhin aus. Erlaubt bleiben Pedelecs, Elektrorollstühle und vierrädrige Elektromobile für mobilitätseingeschränkte Menschen.',
        'In S-Bahn und Regionalzügen im MDV darfst du deinen eigenen E-Scooter dagegen zusammengeklappt mitnehmen, wenn Platz ist.',
        'Mit dem Leih-Scooter ist der Umstieg einfach: Viele Mobilitätsstationen liegen direkt an Haltestellen. Du beendest die Fahrt dort und fährst mit der Strassenbahn weiter, in LeipzigMOVE mit demselben Konto.',
      ],
    },
    {
      heading: 'Hauptbahnhof, Messe, Red Bull Arena: Tipps für Leipzig',
      blocks: [
        '**Ankunft am Hauptbahnhof:** Die Mobilitätsstation Nr. 4 auf der Westseite entstand 2015 als eine der ersten der Stadt und bekam beim Ausbau 2022 Platz für 24 E-Scooter. Mit Fragen kannst du dich persönlich an das LVB-Mobilitätszentrum am Hauptbahnhof (Willy-Brandt-Platz) wenden.',
        '**Red Bull Arena:** Die meisten Dott-Plätze in der Nähe hat die Arena Leipzig (20), gut 500 m vom Stadion. An der näheren Wettiner Strasse sind es nur 3.',
        '**Messe:** An der Neuen Messe im Norden gibt es keinen Dott-Abstellort. Zur Leipziger Buchmesse, das nächste Mal vom 18. bis 21. März 2027, nimmst du besser die Strassenbahn 16 ab Hauptbahnhof: 2026 fuhr sie zur Buchmesse alle fünf Minuten, und die Eintrittskarte galt als Fahrkarte in der Tarifzone 110 (Leipzig).',
        '**Uni und HTWK:** Die Stationen Augustusplatz und Richard-Lehmann-Strasse (HTWK) haben laut Dotts Datenfeed nur je 3 Plätze.',
        '**Flughafen und Seen:** Der Flughafen Leipzig/Halle und der Cospudener See liegen ausserhalb von Dotts Gebiet, und dort gibt es keine Station. Eine Fahrt dorthin könntest du nicht beenden.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Leipzig',
      blocks: [
        {
          list: [
            '**Knapp zweieinhalb Jahre Verspätung:** E-Scooter dürfen in Deutschland seit dem 15. Juni 2019 fahren, Leih-Scooter gibt es in Leipzig erst seit dem 1. November 2021. Damals starteten TIER und Voi an 35 Mobilitätsstationen, für 1 € plus 0,19 € pro Minute.',
            '**Rad schlägt Roller:** In den ersten fünf Jahren von LeipzigMOVE, bis Juni 2025, liefen über die App laut LVB mehr als eine Million Fahrten mit Leihrädern, aber nur gut 52 000 mit E-Scootern. Fahrten in den Apps von Dott und Voi zählen da nicht mit.',
            '**Autoarm seit 1993:** So alt ist das Leipziger Konzept für eine autoarme Innenstadt. Fast ein Drittel aller Wege legen die Leipziger laut Stadt zu Fuss zurück.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Leipzig?',
      answer: 'Die von Dott oder Voi, oder LeipzigMOVE der LVB, das beide Anbieter zeigt. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Dott-Scooter zeigt auch die [Live-Karte von Leipzig](map:de:Leipzig), Voi-Scooter nur die Voi-App und LeipzigMOVE.',
    },
    {
      question: 'Gibt es TIER noch in Leipzig?',
      answer: 'TIER heisst heute Dott. Die Scooter stehen weiter an den Mobilitätsstationen der LVB, und du mietest sie in der Dott-App oder in LeipzigMOVE, für 1 € plus 0,22 € pro Minute (Stand Oktober 2026).',
    },
    {
      question: 'Wo kann ich in Leipzig einen E-Scooter abstellen?',
      answer: 'Nur auf den markierten Flächen der Stationen, die die App zeigt, meist Mobilitätsstationen der LVB. Woanders lässt sich die Fahrt nicht beenden, und LeipzigMOVE berechnet 25 € Strafgebühr. Innerhalb des Promenadenrings lehnt die Stadt Stationen ab; Dott hat dort nur eine, an der Markgrafenstrasse (Stand Oktober 2026).',
    },
    {
      question: 'Darf ich einen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'Nein. In Strassenbahnen, Bussen und Flexa-Fahrzeugen der LVB sind E-Scooter seit dem 1. Mai 2024 verboten, auch dein eigener; die MDV-Bedingungen von August 2026 bestätigen das. In S-Bahn und Regionalzug darf ein eigener Scooter zusammengeklappt mit, wenn Platz ist.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Grimmaische Strasse fahren?',
      answer: 'Nein, sie ist Fussgängerzone. Fahrräder dürfen dort von 20 bis 11 Uhr fahren, E-Scooter heute nicht. Ab dem 1. März 2027 gilt eine Freigabe für Fahrräder grundsätzlich auch für E-Scooter, im Schritttempo, sofern die Stadt sie nicht eigens ausschliesst.',
    },
  ],
  sources: [
    { title: 'Stadt Leipzig: E-Scooter in Leipzig (Fragen und Antworten für Nutzer und Verleiher)', url: 'https://www.leipzig.de/leben-in-leipzig/verkehr/e-scooter' },
    { title: 'Stadt Leipzig: E-Scooter-Verleih startet in Leipzig (1. November 2021)', url: 'https://www.leipzig.de/newsarchiv/news/e-scooter-verleih-startet-in-leipzig' },
    { title: 'Stadt Leipzig: Mobilitätsstation am Hauptbahnhof wird deutlich erweitert (13. Oktober 2022)', url: 'https://www.leipzig.de/newsarchiv/news/mobilitaetsstation-am-hauptbahnhof-wird-deutlich-erweitert' },
    { title: 'Stadt Leipzig: Verkehrskonzept Autoarme Innenstadt', url: 'https://www.leipzig.de/leben-in-leipzig/verkehr/verkehrsplanung/verkehrskonzepte/verkehrskonzept-autoarme-innenstadt' },
    { title: 'Stadt Leipzig: Fussgängerzone auf Merseburger Strasse ab 9. September 2024', url: 'https://www.leipzig.de/newsarchiv/news/merseburger-strasse-wird-ab-9-september-2024-zur-fussgaengerzone' },
    { title: 'Stadt Leipzig: Polizeiverordnung über öffentliche Sicherheit und Ordnung (2020, PDF)', url: 'https://www.leipzig.de/service-portal/satzungen/details/satzung/3-01/download' },
    { title: 'LeipzigMOVE (LVB): E-Scooter von Voi und Dott, Preise und Abstellen', url: 'https://leipzig-move.de/sharing-funktionen/' },
    { title: 'LeipzigMOVE (LVB): Mobilitätsstationen', url: 'https://leipzig-move.de/mobilitaetsstationen/' },
    { title: 'LeipzigMOVE (LVB): Über uns, Kontakt und Servicestellen', url: 'https://leipzig-move.de/ueber-uns/' },
    { title: 'Leipziger Zeitung: Gefährliche Akkus, keine E-Tretroller mehr in LVB-Fahrzeugen ab 1. Mai (16. April 2024)', url: 'https://www.l-iz.de/wirtschaft/mobilitaet/2024/04/gefahrliche-akkus-mitnahme-e-tretroller-lvb-fahrzeuge-1-mai-nicht-gestattet-585404' },
    { title: 'MDV: Beförderungsbedingungen und Tarifbestimmungen, gültig ab 1. August 2026 (PDF)', url: 'https://www.mdv.de/media/file/aa3ecdcc' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Dott: Tarif und Abstellorte für Leipzig im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/leipzig/gbfs.json' },
    { title: 'Waldgesetz für den Freistaat Sachsen (SächsWaldG), § 11', url: 'https://www.revosax.sachsen.de/vorschrift/5405-SaechsWaldG' },
    { title: 'Leipziger Zeitung: Scooter und E-Fahrräder haben auf Parkwegen nichts zu suchen (September 2025)', url: 'https://www.l-iz.de/politik/leipzig/2025/09/der-stadtrat-tagte-scooter-e-fahrrader-parkwege-video-632706' },
    { title: 'Leipziger Zeitung: LeipzigMOVE, LVB melden 570 000 registrierte Nutzer in fünf Jahren (Juni 2025)', url: 'https://www.l-iz.de/wirtschaft/mobilitaet/2025/06/mobilitatsapp-leipzigmove-lvb-570-000-registrierte-nutzer-fun-jahren-626475' },
    { title: 'Leipziger Zeitung: Mit den LVB auf die Leipziger Buchmesse (März 2026)', url: 'https://www.l-iz.de/melder/verkehrsmelder/2026/03/mit-den-lvb-auf-die-leipziger-buchmesse-650312' },
    { title: 'Leipziger Buchmesse: 18. bis 21. März 2027', url: 'https://www.leipziger-buchmesse.de/' },
    { title: 'Bolt: Leipzig', url: 'https://bolt.eu/de-de/cities/leipzig/' },
  ],
};

export default guide;
