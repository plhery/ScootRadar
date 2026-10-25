import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-bonn',
  topic: 'bonn',
  name: 'E-Scooter Bonn: Anbieter, Preise, Parken',
  title: 'E-Scooter Bonn 2026: Anbieter, Preise, Parken, Rheinaue',
  description: 'E-Scooter Bonn: die Anbieter, was zehn Minuten bei Voi kosten, wo du am Rhein, im Hofgarten und in der Rheinaue nicht parkst und was die SWB verbietet.',
  headline: 'E-Scooter Bonn: Anbieter, Preise, Parkverbote und was in Parks, am Rhein und in Bus und Bahn gilt',
  lede: 'Einen E-Scooter in Bonn leihst du ohne Führerschein und in der Regel ab 18 bei Dott, Lime, RideMovi, Ryde oder Voi. Zehn Minuten kosten bei Voi nach seinem veröffentlichten Bonner Tarif (Stand 24. Oktober 2026) 1,80 €, bei den anderen zeigt die App den Preis. Du fährst auf dem Radweg oder der Fahrbahn, durch Grünanlagen wie Hofgarten und Rheinaue nur, wo es ausdrücklich erlaubt ist. Abstellen darfst du nicht in der Fussgängerzone rund um Markt und Münsterplatz, am Rheinufer, in Hofgarten, Stadtgarten und Rheinaue und auf Friedhöfen. In Bahnen und Bussen der SWB sind E-Scooter seit März 2024 verboten.',
  published: '2026-10-24',
  updated: '2026-10-25',
  city: 'de:Bonn',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Bonn?',
      blocks: [
        'Laut Stadt vermieten fünf Anbieter in Bonn E-Scooter: **Dott**, **Lime**, **RideMovi**, **Ryde** und **Voi**. Dott und Ryde führen Bonn auch auf ihren eigenen Websites; für Lime und RideMovi ist die Liste der Stadt unsere Quelle. **Bolt** nennt Bonn auf seiner Website als E-Scooter-Stadt, steht aber nicht auf der Liste der Stadt; ob dort Bolt-Scooter stehen, zeigt nur die Bolt-App.',
        'Du leihst den Scooter in der App des Anbieters, laut deren Bedingungen ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Nur RideMovi lässt laut seinen deutschen AGB auch Jugendliche ab 16 fahren, wenn ein Elternteil das Konto für sie anlegt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte rund um Bonn](map:de:Bonn) seit dem 24. Oktober 2026 Dott und Voi und seit dem 25. Oktober Lime: am Samstag, 24. Oktober, kurz vor 16 Uhr rund 700 Dott- und 1450 Voi-Scooter, fast alle im Bonner Stadtgebiet, am Sonntagmorgen, 25. Oktober, rund 920 Lime-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. RideMovi, Ryde und Bolt findest du nur in ihren Apps.',
        'Auch im Umland findest du dieselben Apps: Dott vermietet laut eigener Website in Sankt Augustin, Siegburg, Troisdorf und Hennef, Voi laut seinem Datenfeed in Sankt Augustin und Siegburg. Die Karte zählt diese Orte getrennt, etwa [Siegburg](map:de:Siegburg).',
        'Mit «E-Roller» sind in Bonn oft die roten Elektroroller zum Sitzen gemeint, laut Stadt 50 Stück, die SWB Bus und Bahn als Clara-Sharing vermietet. Für die brauchst du einen Führerschein; um sie geht es hier nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Bonn?',
      blocks: [
        'Voi veröffentlicht seinen Bonner Tarif in seinem offenen Datenfeed bei NRW.Mobidrom, dem Mobilitätsdatenportal des Landes.',
        {
          table: {
            caption: 'E-Scooter-Preise in Bonn (Vois veröffentlichter Bonner Tarif, Stand 24. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
              ['Dott, Lime, RideMovi, Ryde', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde kostet bei Voi damit 2,70 €. Das ist deutlich weniger als in Köln, wo Voi am selben Tag 0,30 € pro Minute verlangte. Laut Datenfeed gilt der Bonner Tarif auch in Sankt Augustin und Siegburg. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Mit einem VRS-Abo, auch einem Deutschlandticket mit VRS-Chipkarte, fährst du kurze Wege oft billiger mit dem Leihrad Welo: Mit dem normalen Rad sind die ersten 30 Minuten dann gratis (siehe unten). Den nächsten Dott, Voi oder Lime und für Voi eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Bonn](map:de:Bonn).',
      ],
    },
    {
      heading: 'Wo darf man in Bonn mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in einer Fahrradstrasse und nur dort, wo es keinen Radweg gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch rund um Markt, Münsterplatz und Friedensplatz: Steig am Rand ab und schieb.',
        '**Einbahnstrassen:** Gegen die Fahrtrichtung fährst du nur, wo ein Zusatzschild es erlaubt: «Elektrokleinstfahrzeuge frei» auf jeden Fall, «Radverkehr frei» laut Strassenverkehrs-Ordnung auch, laut E-Scooter-Verordnung erst ab 1. März 2027. Die Stadt Bonn schreibt, «Radverkehr frei» gelte für E-Scooter nicht.',
        '**Parks und Ufer:** Die Bonner Strassenordnung verbietet, «Anlagen» zu befahren, «soweit nichts Gegenteiliges bestimmt ist»; dazu zählt sie Grünanlagen, Gärten, Friedhöfe und die Ufer von Gewässern. Wer eine Anlage mit einem Kraftfahrzeug befährt, und das ist ein E-Scooter rechtlich, riskiert ein Bussgeld bis 1000 €. Für die **Rheinaue** schreibt die Stadt ausdrücklich, dass der Park nicht mit Kraftfahrzeugen befahren werden darf. Durch **Hofgarten**, **Stadtgarten** und Rheinaue schiebst du also, wenn kein Schild etwas anderes erlaubt. Am Rheinufer fährst du nur auf dem Radweg, wo es einen gibt, nie auf dem Fussweg.',
        'Die deutschen Regeln, kurz: ab 14 ohne Führerschein, Leih-Scooter in der Regel ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Einen Helm legt dir die Stadt trotzdem ans Herz: Schon bei langsamen Stürzen drohen schwere Kopfverletzungen.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0. Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bonn parken: Verbotszonen und Parkflächen',
      blocks: [
        'Für alle Leihfahrzeuge, also auch für Leihräder, gelten laut Stadt Parkverbotszonen, unter anderem:',
        {
          list: [
            'die Fussgängerzone der Innenstadt rund um Markt, Münster- und Friedensplatz;',
            'ein 10 bis 15 m breiter Streifen entlang des Rheinufers;',
            'Hofgarten und Stadtgarten;',
            'die Rheinaue mit dem Kunst!Rasen und das Gelände rund ums WCCB;',
            'die Botanischen Gärten der Universität und alle Friedhöfe;',
            'die Friedrich-Breuer-Strasse in Beuel.',
          ],
        },
        'Vois eigene Parkverbotszonen, die auch die Karte zeigt, decken etwa die Fussgängerzone von Markt und Münsterplatz bis zum Busbahnhof ab, dazu den Hofgarten, das Rheinufer, den Alten Friedhof und Teile der Fussgängerzone in Bad Godesberg. Die Verbote der Stadt gelten aber auch dort, wo dich eine App abstellen lässt.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Stadt Bonn und Vois Zonen, Stand 24. Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Markt, Münsterplatz, Friedensplatz', 'Gar nicht (Fussgängerzone)'],
              ['Hofgarten vor dem Uni-Hauptgebäude, Stadtgarten, Alter Friedhof', 'Gar nicht'],
              ['Rheinufer am Brassertufer und Alten Zoll, Rheinaue, Kunst!Rasen, WCCB', 'Gar nicht'],
              ['Friedrich-Breuer-Strasse in Beuel', 'Gar nicht'],
              ['Hauptbahnhof, Rückseite (Quantiusstrasse/Meckenheimer Allee)', 'Bei Voi nur auf der markierten Parkfläche'],
            ],
          },
        },
        'Im Dezember 2024 hat der Rat beschlossen, in engen Strassen und an viel genutzten Orten nach Bedarf Abstellflächen für E-Scooter und Leihräder nach einheitlichem Standard zu markieren, etwa am Hauptbahnhof, am Busbahnhof oder am Bertha-von-Suttner-Platz. Rund um jede Fläche gilt dann ein Parkverbot, und die Anbieter müssen dich darüber informieren. Voi führt in seinen Daten schon eigene Pflicht-Parkflächen, etwa hinter dem Hauptbahnhof (Stand 24. Oktober 2026).',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Parkverbotszone oder neben statt auf der Parkfläche. Schieb den Scooter ein Stück weiter: Solange die Fahrt läuft, zahlst du.',
        },
        'Ausserhalb der Zonen darfst du auf dem Gehweg abstellen, solange niemand behindert oder gefährdet wird: aufrecht und ohne Eingänge, Haltestellen oder Blindenleitstreifen zu versperren. Die Zonen ändern sich, schau vor dem Abstellen auf die Karte in deiner App.',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: SWB, VRS und Welo',
      blocks: [
        'Seit dem 1. März 2024 darfst du keine E-Tretroller mehr in den Bahnen von **SWB Bus und Bahn** mitnehmen, seit dem 13. März 2024 auch nicht in den Bussen. Damit hat sich die SWB der einheitlichen Regel im Verkehrsverbund Rhein-Sieg (VRS) angeschlossen. Grund ist laut SWB die Brandgefahr der Akkus; das Verbot gilt «vorerst», Pedelecs, E-Bikes und Elektrorollstühle sind ausgenommen.',
        'Leih-Scooter darfst du ohnehin nie mitnehmen: Fahrt vor der Haltestelle beenden, am Ziel einen neuen mieten. Ob dein eigener E-Scooter in S-Bahn und Regionalzug mitdarf, entscheidet laut VRS jedes Verkehrsunternehmen für seine eigenen Linien; frag vor der Fahrt nach. Im Fernverkehr der Deutschen Bahn fährt er zusammengeklappt als Handgepäck mit.',
        '**Welo**, das Leihrad von Bonn und Rhein-Sieg-Kreis, fährt laut Stadt seit dem 1. September 2025 mit Technik von nextbike. Das normale Rad gibst du an Stationen und in nicht eingefärbten Zonen gratis zurück; in der gelben Zone kostet es 1 € extra, anderswo 20 €. E-Bikes gibst du an E-Bike-Stationen zurück, sonst kostet es ebenfalls 20 €.',
        {
          table: {
            caption: 'Welo: Tarife (Stand 24. Oktober 2026)',
            head: ['Tarif', 'Fahrrad', 'E-Bike'],
            rows: [
              ['Basistarif', '1 € pro 15 Minuten, höchstens 15 € in 24 Stunden', '2 € pro 30 Minuten, höchstens 18 €; von 19 bis 7 Uhr höchstens 5 €'],
              ['Mit VRS-Abo (auch Deutschlandticket) auf VRS-Chipkarte oder als Studierende kooperierender Hochschulen', 'erste 30 Minuten gratis, dann 1 € pro 15 Minuten, höchstens 9 €', '1 € pro 30 Minuten, höchstens 12 €'],
              ['Monats-Abo', '12 € im Monat, erste 30 Minuten jeder Fahrt inklusive', '18 € im Monat, jede Fahrt 1 € pro 30 Minuten'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Gebühren, Obergrenze, Feste: So regelt Bonn E-Scooter',
      blocks: [
        'Wer in Bonn Leihfahrzeuge ohne feste Station auf öffentliche Strassen stellt, braucht eine Sondernutzungserlaubnis der Stadt. Laut Gebührentarif zur Sondernutzungssatzung (gültig seit 28. März 2024) zahlt ein Anbieter im ganzen Stadtgebiet 6,22 € pro E-Scooter und Monat. Für ein Leihrad sind es 0,49 €, für einen E-Roller zum Sitzen 2,42 €.',
        'Eine Obergrenze für E-Scooter, ein Auswahlverfahren, wie es [Köln](guide:cologne) für 2027 plant, oder eine Nachtsperre haben wir in den Veröffentlichungen der Stadt nicht gefunden (Stand 24. Oktober 2026). Auch für Pützchens Markt oder Rhein in Flammen fanden wir keine eigenen E-Scooter-Regeln: Achte dann auf gesperrte Zonen in der App.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Bonn',
      blocks: [
        {
          list: [
            '**Ein E-Scooter kostet die Anbieter fast 13-mal so viel Gebühr wie ein Leihrad.** 6,22 € pro Monat zahlen sie der Stadt für jeden Scooter, 0,49 € für jedes Fahrrad.',
            '**Weniger Verunglückte, gegen den Landestrend.** 2020 verunglückten im Gebiet der Polizei Bonn, zu dem auch Orte im Rhein-Sieg-Kreis gehören, 33 E-Scooter-Fahrende, 2024 waren es 94, 13 davon schwer, einer tödlich. Gegenüber 2023 waren das aber 3 weniger, während die Zahl in ganz NRW um 21,3 % stieg.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Bonn?',
      answer: 'Laut Stadt vermieten Dott, Lime, RideMovi, Ryde und Voi E-Scooter in Bonn; Bolt nennt Bonn auf seiner Website, die Stadt listet Bolt nicht. Du mietest in der App, ohne Führerschein und in der Regel ab 18.',
    },
    {
      question: 'Was kostet ein E-Scooter in Bonn?',
      answer: 'Bei Voi kosten zehn Minuten 1,80 €: Entsperren gratis, dann 0,18 € pro Minute (veröffentlichter Bonner Tarif, Stand 24. Oktober 2026). Dott, Lime, RideMovi und Ryde zeigen ihren Preis in der App.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Rheinaue oder den Hofgarten fahren?',
      answer: 'In der Regel nicht. Die Bonner Strassenordnung verbietet, Grünanlagen und Ufer mit Kraftfahrzeugen zu befahren, «soweit nichts Gegenteiliges bestimmt ist», und ein E-Scooter ist rechtlich ein Kraftfahrzeug; das Bussgeld kann bis 1000 € betragen. Abstellen darfst du dort auch nicht.',
    },
    {
      question: 'Wo darf ich in Bonn keinen E-Scooter abstellen?',
      answer: 'Laut Stadt nicht in der Fussgängerzone rund um Markt, Münster- und Friedensplatz, nicht 10 bis 15 m entlang des Rheinufers, nicht in Hofgarten, Stadtgarten, Rheinaue, rund ums WCCB, in den Botanischen Gärten, auf Friedhöfen und in der Friedrich-Breuer-Strasse in Beuel.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus und Bahn in Bonn mitnehmen?',
      answer: 'Nicht bei SWB Bus und Bahn: In den Bahnen sind E-Tretroller seit dem 1. März 2024 verboten, in den Bussen seit dem 13. März 2024. In S-Bahn und Regionalzug entscheidet jedes Verkehrsunternehmen selbst. Leih-Scooter darfst du nie mitnehmen.',
    },
    {
      question: 'Gibt es in Bonn eine Obergrenze für E-Scooter?',
      answer: 'In den Veröffentlichungen der Stadt haben wir keine gefunden (Stand 24. Oktober 2026). Die Anbieter brauchen eine Sondernutzungserlaubnis und zahlen 6,22 € pro Scooter und Monat. Im Dezember 2024 hat der Rat zudem beschlossen, nach Bedarf feste Abstellflächen zu markieren, etwa am Hauptbahnhof.',
    },
  ],
  sources: [
    { title: 'Bundesstadt Bonn: E-Scooter', url: 'https://www.bonn.de/themen-entdecken/verkehr-mobilitaet/e-scooter.php' },
    { title: 'Bundesstadt Bonn: Stadt wird Abstellen von E-Scootern und Leihrädern regeln (13. Dezember 2024)', url: 'https://www.bonn.de/pressemitteilungen/dezember-2024/stadt-wird-abstellen-von-e-scootern-und-leihraedern-regeln.php' },
    { title: 'Bundesstadt Bonn: Gebührentarif zur Sondernutzungssatzung, ab 28. März 2024 (PDF)', url: 'https://www.bonn.de/medien-global/amt-30/ortsrecht/bauen/60-6-Gebuehrentarif-zur-Sondernutzungssatzung-ab-28-03-2024.pdf' },
    { title: 'Bundesstadt Bonn: Strassenordnung', url: 'https://www.bonn.de/service-bieten/stadtpolitik-ortsrecht/ortsrecht/recht-sicherheit/strassenordnung.php' },
    { title: 'Bundesstadt Bonn: Grillen im Freien (Regeln für die Rheinaue)', url: 'https://www.bonn.de/bonn-erleben/aktiv-und-unterwegs/grillen-im-freien.php' },
    { title: 'Bundesstadt Bonn: E-Roller (Clara)', url: 'https://www.bonn.de/themen-entdecken/verkehr-mobilitaet/e-roller.php' },
    { title: 'Bundesstadt Bonn: Leihfahrräder (Welo)', url: 'https://www.bonn.de/themen-entdecken/verkehr-mobilitaet/leihfahrraeder.php' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung, § 12', url: 'https://www.gesetze-im-internet.de/ekfv/__12.html' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2 (Verkehrszeichen)', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'BGBl. 2026 I Nr. 32: Regeln ab 1. März 2027', url: 'https://www.recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'SWB Bus und Bahn: Mitnahme von E-Tretrollern in Bahnen nicht mehr gestattet', url: 'https://www.swb-busundbahn.de/aktuelle-meldungen/details/mitnahme-von-e-tretrollern-in-bahnen-nicht-mehr-gestattet/' },
    { title: 'VRS: Mitnahmeregeln und Services', url: 'https://www.vrs.de/tickets/ticketwissen/mitnahmeregeln-und-services' },
    { title: 'Welo: Tarife und Rückgabe', url: 'https://www.welo-bike.de/de/' },
    { title: 'NRW.Mobidrom: Mobilitätsdaten NRW', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Ryde: Locations', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Geschäftsbedingungen für Deutschland', url: 'https://www.ryde-technology.com/terms-conditions-germany' },
    { title: 'RideMovi: Allgemeine Geschäftsbedingungen', url: 'https://www.ridemovi.com/de/information-und-allgemeine-geschaeftsbedingungen/' },
    { title: 'Polizei Bonn: Verkehrsunfallstatistik 2024 (PDF)', url: 'https://bonn.polizei.nrw/sites/default/files/2025-03/handout_vu-statistik_2024.pdf' },
  ],
};

export default guide;
