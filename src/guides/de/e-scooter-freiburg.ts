import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-freiburg',
  topic: 'freiburg',
  name: 'E-Scooter Freiburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Freiburg 2026: Zeus, Yoio, Preise, Altstadt',
  description: 'E-Scooter Freiburg: was Zeus und Yoio kosten, warum du in der Altstadt weder fährst noch parkst, was an der Dreisam gilt und wann dein Scooter in die Bahn darf.',
  headline: 'E-Scooter Freiburg: Zeus und Yoio, Preise, Parkzonen und was in der Altstadt gilt',
  lede: 'Einen E-Scooter in Freiburg im Breisgau leihst du ab 18 und ohne Führerschein bei Zeus oder Yoio. Zehn Minuten kosten nach den Tarifen in ihren offenen Datenfeeds (Stand 14. Oktober 2026) 3,50 € bei Zeus und 3,59 € oder 3,99 € bei Yoio, je nach Scooter. In der Fussgängerzone der Altstadt darfst du nicht fahren, und beenden kannst du die Fahrt dort ebenso wenig wie in Parks oder näher als 50 m an der Dreisam. Deinen eigenen E-Scooter nimmt die VAG in Strassenbahn und Bus sogar aufgeklappt mit, einen Leih-Scooter nie.',
  published: '2026-10-14',
  updated: '2026-10-23',
  city: 'de:Freiburg im Breisgau',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Freiburg?',
      blocks: [
        'Die Stadt nennt zwei Anbieter von E-Scootern: **Zeus** und **Yoio**. Yoio von der YourCar GmbH aus Göttingen kam im Dezember 2020 als erster, mit 150 Scootern; mehr erlaubte die Stadt damals nicht. Zeus folgte im April 2023. Roxy Mobility, 2022 noch dabei, steht nicht mehr auf der Liste der Stadt.',
        'Gemietet wird in der App des Anbieters, ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'ScootRadar zeigt beide auf der [Karte rund um Freiburg](map:de:Freiburg im Breisgau): Am Nachmittag des 14. Oktober 2026 standen dort rund 530 Scooter, knapp 290 von Zeus und gut 240 von Yoio. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'Der dritte Anbieter auf der Liste der Stadt, **Freib-e** von Süwag, verleiht Elektro-Motorroller, für die du Führerschein und Helm brauchst. Unsere Karte zeigt sie nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Freiburg?',
      blocks: [
        'Beide Anbieter veröffentlichen ihre Tarife in offenen Datenfeeds; bei Yoio hängt der Minutenpreis vom Scooter ab.',
        {
          table: {
            caption: 'E-Scooter-Preise in Freiburg (Datenfeeds, Stand 14. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Zeus', '1,00 €', '0,25 €', '3,50 €', '6,00 €'],
              ['Yoio, die meisten Scooter', '1,09 €', '0,25 €', '3,59 €', '6,09 €'],
              ['Yoio, übrige Scooter', '1,09 €', '0,29 €', '3,99 €', '6,89 €'],
            ],
          },
        },
        'Eine Viertelstunde kostet damit 4,75 € bei Zeus und 4,84 € oder 5,44 € bei Yoio. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Laut Yoios Gebührenordnung (Stand 2021) gibt es mit einer Jahreskarte des örtlichen Nahverkehrs 25 € Guthaben im Jahr.',
        'Günstiger für kurze Wege ist das Leihrad Frelo (siehe unten). Den nächsten Scooter und eine Preisschätzung zeigt die [Live-Karte von Freiburg](map:de:Freiburg im Breisgau).',
      ],
    },
    {
      heading: 'Wo darf man in Freiburg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege sind tabu, laut Stadt ausserdem «Fussgängerzonen, weitere Teile der Innenstadt sowie die Ortschaften westlich der Autobahn».',
        '**Altstadt:** Rund um Münsterplatz, Bertoldsbrunnen und Augustinerplatz sowie auf der Kaiser-Joseph-Strasse, der KaJo, ist Fussgängerzone.',
        {
          note: 'Die Apps lassen dich durch die Altstadt fahren und sperren dort nur das Abstellen. Das Fahrverbot steht auf den Schildern: In der Fussgängerzone steigst du ab und schiebst. Wer fährt, zahlt heute 15 bis 30 €, ab März 2027 25 bis 40 €.',
        },
        'Radfahrer dürfen durch manche Gassen und über die KaJo, dort werktags von 20 bis 9 Uhr und sonn- und feiertags; für dich gilt das heute nicht. Ab 1. März 2027 gibt ein Schild «Radverkehr frei» eine Fussgängerzone auch für E-Scooter frei, im Schritttempo. Welche Schilder in der Altstadt stehen, hat die Stadt nicht veröffentlicht.',
        '**Gleise und Bächle:** Die Strassenbahn fährt mitten durch die Altstadt, und in vielen Gassen laufen die Bächle, die offenen Wasserrinnen, teils direkt neben den Gleisen. Quere Schienen möglichst im rechten Winkel: Ein kleines Vorderrad in Rille oder Bächle bringt dich schnell zu Fall.',
        '**Parks:** In Stadtgarten, Colombipark, Seepark, Dietenbachpark, in der Grünanlage Moosweiher und im Park am Sandfang erlaubt die Parkanlagensatzung nur Inliner, Skateboards und Kinderfahrzeuge, nach ihrem Wortlaut also keine E-Scooter. Fahr dort nur auf ausgeschilderten Radwegen, sonst schieb.',
        '**Schlossberg und Stadtrand:** Den Schlossberg (456 m) direkt über der Altstadt sparen beide Anbieter aus, ebenso Günterstal, Kappel, den Mundenhof und die Ortschaften westlich der A5 wie Opfingen und Tiengen.',
      ],
    },
    {
      heading: 'E-Scooter in Freiburg abstellen: Altstadt, Hauptbahnhof, Dreisam',
      blocks: [
        'Für alle Anbieter gelten die Regeln der Stadt:',
        {
          list: [
            'auf dem Gehweg nur am Rand und nur, wenn daneben mindestens **2 m** frei bleiben;',
            'nie in Parks, im Strassenbegleitgrün, an Bahnhofseingängen, auf Bus- und Stadtbahnsteigen oder auf Leitstreifen für Blinde;',
            'immer mindestens **50 m** Abstand zu Gewässern wie der Dreisam.',
          ],
        },
        'Beide Apps ziehen deshalb ein Parkverbotsband entlang der Dreisam, und die Altstadt ist bei beiden Parkverbotszone. Yoio verlangt am Ende der Fahrt ein Foto vom abgestellten Scooter.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung der Datenfeeds, Stand 14. Oktober 2026)',
            head: ['Ort', 'Zeus', 'Yoio'],
            rows: [
              ['Münsterplatz, Bertoldsbrunnen, Rathausplatz, Martinstor, Schwabentor', 'Nein', 'Nein'],
              ['Hauptbahnhof', 'Nein; markierte Flächen rund 100 m östlich an der Bismarckallee', 'Nur auf einer kleinen Fläche östlich des Bahnhofs; westlich der Gleise im Stühlinger ja'],
              ['Kollegiengebäude I, Universitätsbibliothek', 'Nein; kleine markierte Flächen in der Nähe', 'Nein'],
              ['Uniklinik, Vauban (Paula-Modersohn-Platz), Rieselfeld', 'Ja', 'Ja'],
              ['Messe (Neuer Messplatz)', 'Ja', 'Nein: ausserhalb der Zonen'],
              ['Europa-Park Stadion', 'Nur im Bereich der Haltestelle', 'Nein: ausserhalb der Zonen'],
              ['Seepark, Dreisamufer in der Innenstadt', 'Nein', 'Nein'],
              ['Schlossberg, Günterstal, Kappel, Mundenhof, Ortschaften westlich der A5', 'Nein: Fahrverbotszone', 'Nein: ausserhalb der Zonen, am Mundenhof Fahrverbot'],
            ],
          },
        },
        'Lässt dich die App die Fahrt nicht beenden, fahr zur nächsten erlaubten Fläche: Solange die Fahrt läuft, zahlst du weiter. Die Zonen ändern sich; massgeblich ist die Karte in deiner App.',
        'Behindert der abgestellte Scooter andere, kostet das 20 € Bussgeld, gefährdet er sie, 30 €. Dazu kommen Gebühren der Anbieter: Yoio berechnet 50 € fürs Umparken und mindestens 50 € ausserhalb seiner Zonen, Zeus kann 120 € ausserhalb seines Geschäftsgebiets verlangen. Abschleppkosten geben beide weiter. Störende Scooter meldest du laut Stadt bei Yoio unter 0551 2887 9614 und bei Zeus unter +49 157 359 81123.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Freiburg: Bussgelder, Alkohol, Unfälle',
      blocks: [
        'In Freiburg gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0. Yoio verbietet in seinen Bedingungen jeden Alkohol (0,0 Promille), Zeus das Fahren unter Alkoholeinfluss.',
        '2025 zählte die Polizei in der Stadt Freiburg 82 Unfälle mit E-Scootern und anderen Elektrokleinstfahrzeugen, fast doppelt so viele wie 2024 (47). Getötet wurde auf ihnen seit 2021 niemand.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn und Bus: VAG und Frelo',
      blocks: [
        'Anders als in München, Köln oder Düsseldorf darfst du deinen eigenen E-Scooter in Freiburg mitnehmen: Laut den Beförderungsbedingungen der VAG fährt er in Strassenbahn und Bus als Handgepäck mit, sogar aufgeklappt, wenn Platz ist und niemand gefährdet oder belästigt wird. Einen Anspruch darauf hast du nicht, und den Akku darfst du unterwegs weder herausnehmen noch laden.',
        '**Leih-Scooter** nimmst du nicht mit: Fahrt vor der Haltestelle beenden, nicht auf dem Bahnsteig, und am Ziel einen neuen mieten. Fahrräder dürfen dagegen nur in einem Testlauf bis 31. März 2027 mit, ab 22 Uhr und nur in der Strassenbahn.',
        '**Frelo**, das Leihrad der VAG, buchst du in der App von nextbike. Zurück gibst du es an einer Station, sonst kostet es 20 € Servicegebühr.',
        {
          table: {
            caption: 'Frelo: Tarife (Stand 14. Oktober 2026)',
            head: ['Tarif', 'Preis'],
            rows: [
              ['Einzelfahrt', '1 € pro 30 Minuten, höchstens 15 € in 24 Stunden'],
              ['Abo für 3 Tage, einen Monat, ein Jahr', '5 €, 10 €, 30 €; erste 30 Minuten jeder Fahrt inklusive'],
              ['Mit RVF-Abo, etwa dem Deutschland-Ticket im Abo, oder als Studierende von Uni, PH, Musikhochschule, EH und KH', 'erste 30 Minuten jeder Fahrt gratis'],
            ],
          },
        },
        'Eine Viertelstunde Frelo kostet also 1 € oder nichts, eine Viertelstunde E-Scooter mindestens 4,75 €. E-Frelo und Lastenfrelo kosten mehr.',
      ],
    },
    {
      heading: 'E-Scooter bei Herbstmess, SC-Spielen, Weihnachtsmarkt und ZMF',
      blocks: [
        '**Freiburger Herbstmess**, jeden Herbst auf dem Neuen Messplatz, 2026 vom 16. bis 26. Oktober: Mit Zeus stellst du an der Messe ab, mit Yoio nicht. Die VAG fährt die Linie 4 dann ab 21 Uhr bis Messeschluss alle 15 Minuten.',
        '**Heimspiele des SC Freiburg:** Am Europa-Park Stadion beendest du eine Fahrt bei Zeus nur im Bereich der Haltestelle, bei Yoio gar nicht. Nach dem Spiel fahren Sonderzüge der VAG, etwa am Abend des 25. Oktober 2026.',
        '**Weihnachtsmarkt**, jedes Jahr vor Weihnachten, 2026 vom 19. November bis 23. Dezember: Seine neun Plätze in und um die Altstadt liegen alle in den Parkverbotszonen. Stell den Scooter am Rand ab und geh zu Fuss.',
        '**Zelt-Musik-Festival (ZMF)**, jeden Sommer am Mundenhof, 2027 vom 14. Juli bis 1. August: Dort sperren beide Anbieter das Fahren. Das ZMF empfiehlt das Fahrrad, mit virtueller Frelo-Station, oder die Strassenbahnlinien 3 und 5 und einen Sonderbus.',
      ],
    },
    {
      heading: 'Wie Freiburg E-Scooter regelt: Vereinbarung statt Ausschreibung',
      blocks: [
        'Freiburg vergibt keine Erlaubnisse in einem Auswahlverfahren. Seit einem Beschluss des Gemeinderats vom 30. Juni 2020 schliesst die Stadt mit jedem Anbieter eine freiwillige Vereinbarung über Geschäftsgebiet, Parkverbotszonen, Zahl der Scooter je Stadtteil, Laden mit Ökostrom und Daten.',
        'Obergrenzen und Laufzeit dieser Vereinbarungen hat die Stadt bis zum 14. Oktober 2026 nicht veröffentlicht. Im Doppelhaushalt 2025/2026 plante der Gemeinderat eine Gebühr von 10 € pro Scooter und Monat ein; der Antrag dazu verweist auf [Stuttgart](guide:stuttgart), wo die Anbieter schon pro Scooter zahlen. Ob Freiburg die Gebühr erhebt, ist offen: Die geltende Gebührensatzung nennt E-Scooter nicht.',
        'Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Städte können es dann als Sondernutzung erlauben und an Auflagen knüpfen. Ob Freiburg danach etwas ändert, hat die Stadt nicht angekündigt.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Freiburg',
      blocks: [
        {
          list: [
            '**Fussgängerzone und Weihnachtsmarkt sind gleich alt.** Die Fussgängerzone rund um die Kaiser-Joseph-Strasse gibt es seit dem 22. November 1973, den Weihnachtsmarkt ebenfalls seit 1973.',
            '**Wer ins Bächle tritt, heiratet eine Freiburgerin oder einen Freiburger,** sagt die Legende. Die Wasserrinnen der Altstadt sind zusammen 15,9 km lang, 6,4 km davon unterirdisch.',
            '**Yoios Firmenadresse ist eine Hochschule.** Die YourCar GmbH sitzt bei der PFH Private Hochschule Göttingen und verleiht Scooter ausser in Freiburg nur in Göttingen und Erfurt.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Freiburg?',
      answer: 'Zeus und Yoio, die beiden Anbieter, die die Stadt für E-Scooter nennt. Lime, Voi, Bolt und Dott stehen nicht auf ihrer Liste, und die Datenfeeds von Lime und Voi zeigten am 14. Oktober 2026 keinen Scooter in Freiburg. Freie Scooter von Zeus und Yoio zeigt die [Live-Karte von Freiburg](map:de:Freiburg im Breisgau).',
    },
    {
      question: 'Was kostet Yoio in Freiburg?',
      answer: '1,09 € fürs Entsperren und je nach Scooter 0,25 € oder 0,29 € pro Minute, laut Yoios Datenfeed vom 14. Oktober 2026. Zehn Minuten kosten damit 3,59 € oder 3,99 €.',
    },
    {
      question: 'Darf man mit dem E-Scooter durch die Freiburger Altstadt fahren?',
      answer: 'Nein. Die Fussgängerzone ist für E-Scooter gesperrt, auch wenn die Apps dich fahren lassen: Dort steigst du ab und schiebst. Ab 1. März 2027 darfst du im Schritttempo fahren, wo ein Schild den Radverkehr freigibt. Abstellen kannst du in der Altstadt bei beiden Anbietern nicht.',
    },
    {
      question: 'Darf ich meinen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'Deinen eigenen ja: Laut VAG fährt er in Strassenbahn und Bus als Handgepäck mit, auch aufgeklappt, wenn Platz ist. Den Akku darfst du unterwegs weder laden noch herausnehmen. Leih-Scooter von Zeus und Yoio nimmst du nicht mit.',
    },
  ],
  sources: [
    { title: 'Stadt Freiburg: E-Roller-Sharing', url: 'https://www.freiburg.de/pb/2045706.html' },
    { title: 'Stadt Freiburg: Ortsrecht (Parkanlagensatzung, Fussgängerbereich)', url: 'https://www.freiburg.de/pb/,Lde/206280.html' },
    { title: 'Zeus: Datenfeed für Freiburg (GBFS, MobiData BW)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_freiburg/gbfs' },
    { title: 'Yoio: Datenfeed für Freiburg (GBFS, MobiData BW)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/yoio_freiburg/gbfs' },
    { title: 'Yoio: Gebührenordnung (PDF)', url: 'https://yourcar-carsharing.de/images/Yoio-Gebuehrenordnung.pdf' },
    { title: 'Zeus: Allgemeine Geschäftsbedingungen', url: 'https://zeusscooters.com/terms-and-conditions/' },
    { title: 'VAG Freiburg: Beförderungsbedingungen', url: 'https://www.vag-freiburg.de/befoerderungsbedingungen-vag' },
    { title: 'Frelo: Tarife', url: 'https://www.frelo.de/de/' },
    { title: 'visit.freiburg.de: Top-Events in Freiburg', url: 'https://visit.freiburg.de/events/top-10-events' },
    { title: 'Bundesgesetzblatt 2026 I Nr. 32: Änderung der StVO und der eKFV', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesverkehrsministerium: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Polizeipräsidium Freiburg: Unfallbarometer 2025, Stadtkreis Freiburg (PDF)', url: 'https://www.presseportal.de/download/document/6995b7d5270000fd2cbf70e0-unfallbarometer2025freiburg.pdf' },
  ],
};

export default guide;
