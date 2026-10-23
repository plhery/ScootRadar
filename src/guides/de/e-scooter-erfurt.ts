import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-erfurt',
  topic: 'erfurt',
  name: 'E-Scooter Erfurt: Anbieter, Preise, Parkverbote',
  title: 'E-Scooter Erfurt 2026: Yoio, Dott, Preise, Parkverbote',
  description: 'E-Scooter Erfurt: was Yoio pro Minute kostet, warum Dott auf der Karte fehlt, wo du in der Altstadt weder fährst noch parkst und was in der Strassenbahn gilt.',
  headline: 'E-Scooter Erfurt: Yoio und Dott, Preise, Parkverbotszonen und was in der Altstadt gilt',
  lede: 'Einen E-Scooter in Erfurt leihst du ab 18 und ohne Führerschein bei Yoio oder bei Dott, das früher Tier hiess. Laut Yoios Datenfeed vom 23. Oktober 2026 kostet das Entsperren 1,09 € und die Minute 0,25 €, bei einzelnen Scootern 0,21 €; zehn Minuten kosten also 3,59 € oder 3,19 €. Du fährst auf dem Radweg oder der Fahrbahn, nie auf dem Gehweg und nie in der Fussgängerzone der Altstadt. Abstellen darfst du im Gebiet der App, aber nicht am Anger, auf der Krämerbrücke, am Fischmarkt, Wenigemarkt, Domplatz und Benediktsplatz und in «Venedig». In Strassenbahn und Bus der EVAG darf kein E-Scooter mit.',
  published: '2026-10-23',
  updated: '2026-10-23',
  city: 'de:Erfurt',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Erfurt?',
      blocks: [
        'Im Oktober 2026 vermieten zwei Anbieter E-Scooter in Erfurt: **Yoio** und **Dott**. Yoio gehört der YourCar GmbH aus Göttingen und kam laut Stadt im Mai 2021, angekündigt mit rund 200 Scootern. Tier folgte im Mai 2022 mit rund 150. Tier heisst heute Dott: Im Oktober 2024 kündigte das Unternehmen an, alle Tier-Scooter auf die Dott-App umzustellen, und Dott führt Erfurt auf seiner Städteliste. Bolt bietet in Erfurt laut eigener Website nur Fahrten mit Fahrer und Taxis an. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Zur Flottengrösse sagt die Stadt nur: 2025 nannte sie für die beiden Anbieter 130 und 280 Fahrzeuge im durchschnittlichen täglichen Einsatz.',
        '**Dott fehlt auf unserer Karte.** ScootRadar zeigt auf der [Karte von Erfurt](map:de:Erfurt) nur Yoio, weil Dott für Erfurt keinen offenen Datenfeed veröffentlicht. Am Freitag, 23. Oktober 2026, standen dort um 15:18 Uhr rund 200 Yoio-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Dott-Scooter zeigt dir in Erfurt nur die Dott-App; in Städten mit offenem Feed, etwa [Leipzig](map:de:Leipzig), siehst du sie auch bei uns.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Erfurt?',
      blocks: [
        'Yoio veröffentlicht seine Tarife im offenen Datenfeed. Am 23. Oktober 2026 listete der Feed für jeden Scooter 1,09 € fürs Entsperren, den Minutenpreis aber je Scooter: 0,25 € für rund 180, 0,21 € für 20. Was die zwei Stufen bedeuten, erklärt Yoio nicht; seine Gebührenordnung nennt gar keine Minutenpreise und verweist auf die App. Laut Yoios Hilfe kann der Minutenpreis variieren und steht in der App auf dem Button «Fahrt starten».',
        {
          table: {
            caption: 'E-Scooter-Preise in Erfurt (Yoio-Datenfeed, 23. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Yoio, die meisten Scooter', '1,09 €', '0,25 €', '3,59 €', '6,09 €'],
              ['Yoio, einzelne Scooter', '1,09 €', '0,21 €', '3,19 €', '5,29 €'],
              ['Dott', 'Nur in der App', 'Nur in der App', 'Nur in der App', 'Nur in der App'],
            ],
          },
        },
        'Bei Yoio zählt laut AGB jede angefangene Minute. Mehr als 19,99 € kostet eine Fahrt laut Feed nicht; bei 0,25 € pro Minute ist das nach gut 75 Minuten erreicht. Mit einer Jahreskarte des örtlichen Nahverkehrs gibt es laut Yoios Gebührenordnung (Stand 2021) 25 € Guthaben im Jahr. Verbindlich ist bei beiden Anbietern der Preis, den die App vor dem Start zeigt.',
      ],
    },
    {
      heading: 'Wo darf man in Erfurt mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Eigene Fahrregeln für E-Scooter haben weder Thüringen noch Erfurt.',
        '**Altstadt:** Die Fussgängerzone reicht laut Stadt vom Anger über Bahnhofstrasse und Schlösserstrasse, Fischmarkt und Marktstrasse bis zum Domplatz, zum Wenigemarkt und zur Krämerbrücke. Mit den verkehrsberuhigten Gassen ringsum nennt die Stadt das Gebiet «Begegnungszone», ein Arbeitstitel, kein Verkehrszeichen. Fahrräder dürfen über den Anger montags bis samstags von 18:30 bis 9 Uhr und sonntags fahren, im westlichen Anger bis zur Borngasse rund um die Uhr. Für E-Scooter gilt diese Freigabe heute nicht: Steig ab und schieb.',
        '**Ab 1. März 2027** gilt eine Freigabe mit dem Zusatzschild «Radverkehr frei» laut Bundesverkehrsministerium auch für E-Scooter, im Schritttempo. Die Kommunen können E-Scooter aber eigens verbieten. Ob Erfurt das am Anger tut, hat die Stadt bisher nicht gesagt (Stand Oktober 2026); sonst dürftest du dort zu denselben Zeiten fahren wie Fahrräder.',
        '**Skateparks:** In den Skateparks im Nordpark, am Alten Nordhäuser Bahnhof (Domizil) und im Südpark sowie auf einer kleinen Fläche an der Rosa-Luxemburg-Strasse darfst du mit Yoio laut Datenfeed weder starten noch beenden noch durchfahren.',
        '**egapark:** Die Parkordnung der Betreiberin, der Erfurter Garten- und Ausstellungs gGmbH, sagt unter Punkt 4.6: «Das Mitbringen und Nutzen von Fahrzeugen, Fahrrädern und Fortbewegungsmitteln jeglicher Art ist im egapark nicht gestattet.» Auch hineinschieben darfst du einen E-Scooter also nicht.',
      ],
    },
    {
      heading: 'E-Scooter in Erfurt abstellen: wo die App das Fahrtende sperrt',
      blocks: [
        'Laut Stadt gilt nach einer freiwilligen Selbstverpflichtung aller Anbieter ein Abstellverbot in historisch sensiblen Bereichen, etwa am Anger, auf der Krämerbrücke, in «Venedig», am Fischmarkt, am Domplatz, am Wenigemarkt und am Benediktsplatz. Dort lässt sich die Miete technisch nicht beenden (Stand 2025). Die meisten dieser Plätze gehören zur Fussgängerzone, dort fährst du ohnehin nicht.',
        'Yoios Datenfeed vom 23. Oktober 2026 zeigt weitere Parkverbotszonen: entlang der Gera und ihrer Arme durch die Altstadt, am Petersberg, entlang der Gleise am Hauptbahnhof und im Stadtpark. Den Domplatz deckte die Verbotszone nur zu etwa drei Vierteln ab. Halte dich an die Liste der Stadt, auch wenn die App am Rand des Platzes das Fahrtende erlaubt.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung des Yoio-Datenfeeds, 23. Oktober 2026)',
            head: ['Ort', 'Fahrt mit Yoio beenden?'],
            rows: [
              ['Anger, Fischmarkt, Wenigemarkt, Krämerbrücke', 'Nein, Parkverbotszone'],
              ['Domplatz', 'Nein laut Stadt; im Feed zu etwa drei Vierteln gesperrt'],
              ['Hauptbahnhof', 'Ja auf dem Willy-Brandt-Platz vor dem Bahnhof, nein entlang der Gleise'],
              ['Zitadelle Petersberg', 'Nein, die nächste erlaubte Stelle liegt knapp 200 m entfernt'],
              ['Universität (Nordhäuser Strasse 63)', 'Ja'],
              ['FH Erfurt, Altonaer Strasse 25 und Schlüterstrasse 1', 'Ja'],
              ['FH Erfurt, Leipziger Strasse 77', 'Nein, ausserhalb; erlaubt rund 100 m weiter'],
              ['egapark, Messe Erfurt', 'Nein, ausserhalb; erlaubt rund 100 bis 130 m entfernt'],
              ['Thüringer Zoopark, Nordstrand, Flughafen', 'Nein, ausserhalb des Geschäftsgebiets'],
            ],
          },
        },
        'Auf dem Gehweg müssen laut Yoio mindestens 2 m frei bleiben, und höchstens drei Scooter dürfen nebeneinanderstehen. Tabu sind Blindenleitstreifen, Bahnhofseingänge, Bus- und Strassenbahnsteige, Parks und Grünstreifen. Am Ende fotografierst du den Scooter in der App. Die Ortung kann laut Yoio bis zu 30 m danebenliegen: Halte am Rand einer Zone etwas Abstand.',
        'Stellst du ausserhalb des Gebiets ab, berechnet Yoio laut Gebührenordnung (Stand 2021) nach Aufwand mindestens 50 €; parkt Yoio einen falsch abgestellten Scooter um, kostet das 50 €. Einen störenden Yoio-Scooter meldest du unter 0551 2887 9614.',
      ],
    },
    {
      heading: 'Wer regelt was? Bund, Thüringen, Stadt und Yoio',
      blocks: [
        'Die Verkehrsregeln setzt der Bund. Wo Leih-Scooter stehen dürfen, entscheiden laut Bundesverkehrsministerium die Kommunen. Ihre Satzung über die Sondernutzung öffentlicher Strassen stützt die Stadt auf das Thüringer Strassengesetz. Gebiet, Zonen, Preise und Gebühren legt der Anbieter fest; die Verbotszonen der Altstadt sperrt er auf Wunsch der Stadt in der App.',
        'Erfurt behandelt den Verleih bisher als Gemeingebrauch, also ohne Erlaubnis, und regelt ihn über eine freiwillige Selbstverpflichtung, die alle Anbieter unterschrieben haben: Gebiet, Flottengrösse, Parkverbotszonen. Für die Innenstadt nannte die Stadt 2025 eine «bisherige Obergrenze von 100 E-Scootern». Die Obergrenze für das ganze Stadtgebiet, 2021 mit dem Stadtratsausschuss festgelegt, hat sie nicht veröffentlicht. Das Abstellen kontrolliert der Vollzugsdienst der städtischen Ordnungsbehörde, das Fahren die Polizei.',
        'Die Wirkung der Selbstverpflichtung nennt die Stadt «mässig» (2025). Sie bevorzugt eine Regelung als Sondernutzung, mit festen Abstellflächen in der Innenstadt und freiem Abstellen im übrigen Stadtgebiet; rund 60 mögliche Standorte hat sie vorgeprüft. Die Sondernutzungsgebühr für gewerbliche E-Scooter liegt laut Stadt bei 0 €, ausgewiesen ist bisher keine Fläche.',
        'Am 18. Dezember 2025 beschloss der Stadtrat, dass die Stadt mit den Anbietern, der EVAG und dem City-Management markierte Abstellzonen in der Altstadt prüft und den Ausschuss bis Ende September 2026 informiert. Diesen Bericht und eine Vorlage zu Sondernutzung und Vergabe, die die Verwaltung für das erste Quartal 2026 angekündigt hatte, fanden wir im Ratsinformationssystem bis zum 23. Oktober 2026 nicht. Feste Abstellflächen, Gebühren oder eine Auswahl der Anbieter sind also nicht beschlossen.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Erfurt: Bussgelder und Alkohol',
      blocks: [
        'In Erfurt gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
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
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Strassenbahn, Hauptbahnhof, Uni: Tipps für Erfurt',
      blocks: [
        '**Strassenbahn und Bus:** Die EVAG schliesst E-Scooter von der Mitnahme aus, weil sie versicherungspflichtig sind; das gilt auch für deinen eigenen. Fahrräder dürfen mit, ausser montags bis freitags von 7 bis 10 und von 14 bis 18 Uhr. Wo die Beförderungsbedingungen «E-Scooter» mit Siegel erlauben, meinen sie rollstuhlähnliche Elektromobile.',
        '**Ankunft am Hauptbahnhof:** Auf dem Willy-Brandt-Platz vor dem Bahnhof beendest du eine Yoio-Fahrt, aber nicht direkt am Eingang.',
        '**Uni, FH, egapark und Messe:** An der Universität und am FH-Hauptcampus endest du direkt. Am FH-Standort Leipziger Strasse, am egapark und an der Messe stellst du gut 100 m entfernt ab.',
        '**Ausflüge:** Thüringer Zoopark, Nordstrand und Flughafen liegen ausserhalb des Gebiets. Eine Fahrt dorthin könntest du nicht beenden. Yoio vermietet laut Datenfeed rund um die Uhr; eine Nachtsperre oder Wintersaison nennen weder Stadt noch Yoio.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Erfurt',
      blocks: [
        {
          list: [
            '**Die Krämerbrücke ist Parkverbotszone auf ganzer Länge.** Sie ist laut Erfurt Tourismus die längste durchgehend mit Häusern bebaute und bewohnte Brücke Europas: 120 m, heute 32 Häuser, aus Stein seit 1325.',
            '**Strassenbahn mitten in der Fussgängerzone:** Am Anger kreuzen sich laut Stadt alle Stadtbahnlinien, und Fussgängerzone ist er seit den 1970er-Jahren.',
            '**Yoio gibt es nur in drei Städten:** Ausser in Erfurt verleiht die YourCar GmbH E-Scooter nur in Göttingen und [Freiburg](guide:freiburg).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Erfurt?',
      answer: 'Yoio und Dott, das früher Tier hiess. Du brauchst die App des Anbieters und musst 18 sein, einen Führerschein brauchst du nicht. Freie Yoio-Scooter zeigt auch die [Live-Karte von Erfurt](map:de:Erfurt), Dott-Scooter nur die Dott-App.',
    },
    {
      question: 'Was kostet Yoio in Erfurt?',
      answer: '1,09 € fürs Entsperren und je nach Scooter 0,25 € oder 0,21 € pro Minute, laut Yoios Datenfeed vom 23. Oktober 2026. Zehn Minuten kosten damit 3,59 € oder 3,19 €, eine Fahrt höchstens 19,99 €. Den Minutenpreis des Scooters zeigt dir die App vor dem Start.',
    },
    {
      question: 'Wo kann ich in Erfurt einen E-Scooter abstellen?',
      answer: 'Im grünen Gebiet der App, auf dem Gehweg mit 2 m Platz für Fussgänger. Gesperrt sind unter anderem Anger, Krämerbrücke, Fischmarkt, Wenigemarkt, Domplatz, Benediktsplatz und «Venedig», bei Yoio auch die Ufer der Gera, der Petersberg und der Stadtpark.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über den Anger fahren?',
      answer: 'Nein, er ist Fussgängerzone. Fahrräder dürfen dort montags bis samstags von 18:30 bis 9 Uhr und sonntags fahren, E-Scooter heute nicht. Ab 1. März 2027 gilt eine Freigabe für Fahrräder grundsätzlich auch für E-Scooter, im Schritttempo, sofern die Stadt sie nicht eigens ausschliesst.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'Nein. Die EVAG schliesst E-Scooter in Strassenbahnen und Bussen von der Mitnahme aus, auch deinen eigenen. Ein Fahrrad darf mit, ausser montags bis freitags von 7 bis 10 und von 14 bis 18 Uhr.',
    },
  ],
  sources: [
    { title: 'Stadt Erfurt: E-Scooter-Verleih von Yoio startet (17. Mai 2021)', url: 'https://www.erfurt.de/ef/de/service/aktuelles/pm/2021/138403.html' },
    { title: 'Stadt Erfurt: Tier startet E-Scooter-Verleih (20. Mai 2022)', url: 'https://www.erfurt.de/ef/de/service/aktuelles/pm/2022/141535.html' },
    { title: 'Stadt Erfurt: Antwort auf die Anfrage DS 1204/25 zu E-Scootern (2025, PDF)', url: 'https://buergerinfo.erfurt.de/getfile.asp?id=952588&type=do' },
    { title: 'Stadt Erfurt: Antrag DS 2626/25, E-Roller-Abstellzonen in der Innenstadt', url: 'https://buergerinfo.erfurt.de/vo0050.asp?__kvonr=63019' },
    { title: 'Stadt Erfurt: Niederschrift der Stadtratssitzung vom 18. Dezember 2025 (PDF)', url: 'https://buergerinfo.erfurt.de/getfile.asp?id=993706&type=do' },
    { title: 'Stadt Erfurt: Begegnungszone', url: 'https://www.erfurt.de/ef/de/leben/planen/verkehr/begegnungszone/index.html' },
    { title: 'Stadt Erfurt: Sondernutzungssatzung (PDF)', url: 'https://www.erfurt.de/mam/ef/rathaus/stadtrecht/6/6814.pdf' },
    { title: 'Yoio: Datenfeed für Erfurt (GBFS)', url: 'https://yoio.rideatom.com/gbfs/159/v3.0/gbfs' },
    { title: 'Yoio: E-Scooter-Sharing in Göttingen, Freiburg und Erfurt', url: 'https://yoio.app/' },
    { title: 'Yoio: Gebührenordnung (PDF)', url: 'https://yourcar-carsharing.de/images/Yoio-Gebuehrenordnung.pdf' },
    { title: 'Yoio: Allgemeine Geschäftsbedingungen (PDF)', url: 'https://yourcar-carsharing.de/images/Yoio-AGB.pdf' },
    { title: 'Yoio-Hilfe: Was ist beim Parken wichtig?', url: 'https://yourcar.freshdesk.com/support/solutions/articles/44001892115' },
    { title: 'Yoio-Hilfe: Warum kann ich meine Fahrt nicht beenden?', url: 'https://yourcar.freshdesk.com/support/solutions/articles/44001892125' },
    { title: 'Yoio-Hilfe: Wie viel kostet es?', url: 'https://yourcar.freshdesk.com/support/solutions/articles/44001876940' },
    { title: 'Dott: Standorte', url: 'https://ridedott.com/locations/' },
    { title: 'Dott: TIER wird zu Dott (1. Oktober 2024)', url: 'https://ridedott.com/press-release/tier-becomes-dott/' },
    { title: 'Bolt: Erfurt', url: 'https://bolt.eu/de-de/cities/erfurt/' },
    { title: 'EVAG: Fahrrad, Hund und Co., was darf mit?', url: 'https://www.evag-erfurt.de/evag/home/tickets_abos_tarife/mitnahmeregelungen' },
    { title: 'egapark Erfurt: Parkordnung', url: 'https://www.egapark-erfurt.de/pb/egapark/Home/Kontakt/Parkordnung' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Erfurt Tourismus: Krämerbrücke', url: 'https://www.erfurt-tourismus.de/sehenswertes/kraemerbruecke' },
  ],
};

export default guide;
