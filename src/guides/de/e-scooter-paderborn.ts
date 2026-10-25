import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-paderborn',
  topic: 'paderborn',
  name: 'E-Scooter Paderborn: Anbieter, Preise, Parken',
  title: 'E-Scooter Paderborn 2026: Voi, Dott, Bolt, Preise, Parken',
  description: 'E-Scooter Paderborn: Voi, Dott und Bolt, was Voi pro Minute kostet, wo du in Innenstadt und Parks nicht parkst und warum der Roller nicht in den Bus darf.',
  headline: 'E-Scooter Paderborn: Anbieter, Preise, Parken und Verbote',
  lede: 'E-Scooter in Paderborn leihst du laut Stadt bei Voi, Dott und Bolt; sie vermieten erst ab 18, einen Führerschein brauchst du nicht. Voi verlangt laut seinem veröffentlichten Tarif 0,49 € fürs Entsperren und 0,24 € pro Minute, zehn Minuten kosten also 2,89 € (Stand 25. Oktober 2026); Dott und Bolt zeigen ihren Preis in der App. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone um Westernstrasse und Marienplatz. Abstellen dürfen die Verleiher laut Stadt nicht in Fussgängerzonen und Parks, an Haltestellen, auf Brücken und auf dem Vorplatz des Hauptbahnhofs; im Inneren Ring gelten die Abstellzonen der App. In die Busse von PaderSprinter darfst du seit 1. April 2024 keinen E-Scooter mehr mitnehmen.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Paderborn',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Paderborn?',
      blocks: [
        'Die Stadt nennt auf ihrer Seite «Mobilitätsangebote in Paderborn» (Stand 8. April 2026) drei Anbieter: **TIER**, das heute **Dott** heisst, seit Dezember 2019; **Bolt** seit Dezember 2021, in der Kernstadt und in Schloss Neuhaus; **Voi** seit April 2025. «Insgesamt dürfen 1.200 E-Scooter in Paderborn fahren», schreibt sie; ihr Serviceportal nennt Tier/Dott, Bolt und Voi. Voi startete laut eigener Mitteilung am 10. April 2025 mit rund 400 Scootern. Bolt nennt auf seiner Paderborn-Seite als Kategorien «E-Scooter» und «E-Scooter auf Abruf», keine E-Bikes. Lime nannte die Stadt im Januar 2024 noch, heute nicht mehr.',
        'Gemietet wird in der App des Anbieters, laut deren Bedingungen erst ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die Sondernutzungssatzung der Stadt (Fassung ab 1. März 2026) verlangt von Verleihern eine Erlaubnis und begrenzt die Zahl der Leih-Scooter im Stadtgebiet «auf maximal 1.200» (§ 2); je Scooter und angefangenem Kalendermonat zahlt der Anbieter 3,80 € (Gebührentarif Nr. 15). Obergrenze und Gebühr binden die Anbieter, nicht dich.',
        'Die [Karte von Paderborn](map:de:Paderborn) zeigt Voi und Dott: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 710 freie Scooter, rund 420 von Voi und knapp 300 von Dott, kurz nach Mitternacht knapp 700. Das ist eine Momentaufnahme, keine Flottengrösse. Am Sonntagmorgen standen alle in der Stadt: rund 600 in der Kernstadt, gut 80 in Schloss Neuhaus, gut 20 in Elsen. Für Voi zeigt die Karte auch Fahrgebiet, Parkverbots- und Abstellzonen, für Dott nur Standorte. **Bolt fehlt auf unserer Karte**; seine Scooter siehst du nur in der Bolt-App.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Paderborn?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Paderborn (Stand 25. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (veröffentlichter Tarif)', '0,49 €', '0,24 €', '2,89 €', '5,29 €'],
              ['Dott, Bolt', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Verbindlich ist immer der Preis, den die App vor dem Entsperren zeigt.',
        {
          table: {
            caption: 'Was beim Mieten extra kosten kann (Stand 25. Oktober 2026)',
            head: ['Fall', 'Dott (Bedingungen vom 23. September 2025)', 'Bolt (Bedingungen seit 2023, auch ab 1. Dezember 2026)'],
            rows: [
              ['Falsch geparkt', 'bis zu 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst', '15 €, wenn der Scooter falsch steht und kein deutliches Abstellfoto da ist'],
              ['Bussgeld, das der Anbieter für dich zahlt', 'das Bussgeld plus 50 € Verwaltungsgebühr', 'das Bussgeld plus bis zu 30 € Verwaltungsgebühr'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Wo darf man in Paderborn mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, Radfahrstreifen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei». Gegen die Fahrtrichtung einer Einbahnstrasse darfst du mit «Elektrokleinstfahrzeuge frei». Bei «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die StVO lässt dich mitfahren, die eKFV verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist die Gegenrichtung erlaubt, wo «Radverkehr frei» sie öffnet. Diese Regeln setzt der Bund. «Radfahrer frei» bedeute nicht automatisch «E-Scooter frei», schreibt die Stadt.',
        {
          table: {
            caption: 'Wo in Paderborn was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzone mit Westernstrasse, Königsplatz, Marienplatz, Rathausplatz, Schildern, Kamp und Markt', 'Absteigen und schieben; Leih-Scooter nicht abstellen', 'Bund; Stadt, Auflagen für Verleiher (2023)'],
              ['Paderquellgebiet, Inselspitzweg, Geisselscher Garten, Haxthausenhof, Belleville-Promenade, Bürgerpark, Fischteiche, Wilhelmsberg, Schützenplatz', 'Leih-Scooter nicht abstellen', 'Stadt, Auflagen für Verleiher (2023)'],
              ['Alle übrigen Parks und Grünanlagen', 'Fahren «ausschliesslich auf den für Radfahrer gekennzeichneten Wegen»; Leih-Scooter nicht abstellen', 'Stadt, Auflagen für Verleiher (2023)'],
              ['Ausserhalb von Vois Fahrgebiet, etwa Marienloh, Benhausen, Neuenbeken, Dahl, Bad Lippspringe, Flughafen', 'Mit Voi nicht fahren und keine Fahrt beenden', 'Voi, laut Karte'],
            ],
          },
        },
        'Die «Detaillierten Regelungen zum Abstellen von E-Scootern» (September 2023) sind Auflagen der Stadt für die Verleiher, auch die Zeile zu den Parks; eine Satzung oder Verordnung, die dir das Fahren in Parks regelt, fanden wir nicht. Wo Dott und Bolt fahren und parken, zeigen ihre Apps. Eine Scooter-Regel für den Uni-Campus fanden wir nicht.',
      ],
    },
    {
      heading: 'E-Scooter in Paderborn parken: Innenstadt, Bahnhof, Parks',
      blocks: [
        'Nach Bundesrecht darfst du auf dem Gehweg abstellen, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO; stellt ein Anbieter seine Leih-Scooter auf, ist das kein Parken, stellst du einen nach der Fahrt ab, schon. Von den Verleihern verlangt die Stadt mehr: Der Scooter steht aufrecht, auf Gehwegen längs, nicht neben einem anderen, an der von der Fahrbahn abgewandten Seite und «grundsätzlich nur in hinreichend beleuchteten Bereichen»; mindestens **1,50 m** bleiben frei. Verboten ist das Abstellen:',
        {
          list: [
            'in allen Fussgängerzonen und in Parks und Grünanlagen;',
            'an Haltestellen und in ihren Wartebereichen, auf dem Vorplatz des Hauptbahnhofs und am Busbereich daneben;',
            'auf Radwegen, Radfahr- und Schutzstreifen und auf Fahrbahnen mit mehreren Spuren je Richtung ohne Radweg oder mit mehr als 50 km/h;',
            'auf Blindenleitsystemen und bis 1 m daneben, an Schildern und Ampeln, auf Rettungswegen, vor Einfahrten und Eingängen;',
            'auf Brücken.',
          ],
        },
        'Wo die Anbieter Scooter aufstellen, stehen «maximal 5 E-Roller», 50 m vom nächsten Standort entfernt. Im Inneren Ring musst du laut Stadt die Abstellzonen der App einhalten. Bei Voi ist laut [Karte](map:de:Paderborn) die ganze Innenstadt zwischen Westerntor, Dom, Paderquellgebiet und Maspernplatz Parkverbotszone, ebenso der Hauptbahnhof; dort beendest du die Fahrt nur in einer der gut 20 Voi-Abstellzonen, etwa am Westerntor, am Marienplatz oder an der Zone Hauptbahnhof Nord. Weitere Voi-Parkverbotszonen liegen in den Paderauen, im Schlosspark von Schloss Neuhaus, am Lippesee, im Bürgerpark und am Sportgelände der Universität. Das sind Vois eigene Regeln, Stand 25. Oktober 2026.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, fahr zur nächsten Abstellzone: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Falsch abgestellte Scooter meldest du über «Sag’s Paderborn» (anliegen.udh-pb.de) oder beim Anbieter über die Nummer am Scooter. Laut Stadt (Januar 2024) geht das auch in der App Citykey, und behindert ein Scooter den Verkehr, muss der Anbieter ihn unverzüglich wegräumen, sonst spätestens nach 24 Stunden.',
      ],
    },
    {
      heading: 'Regeln und Bussgelder für E-Scooter in Paderborn',
      blocks: [
        'Es gelten die deutschen Regeln: keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Für E-Scooter gelten laut Stadt dieselben Promillegrenzen wie fürs Auto: Strafbar machst du dich schon ab 0,3 Promille, wenn du unsicher fährst, und unter 21 oder in der Probezeit gilt 0,0 Promille; Bolt verbietet in seinen Bedingungen jeden Alkohol. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden; ab 1. März 2027 25 €, bis 40 €.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €.',
            '**Rote Ampel:** 60 € und ein Punkt, länger als 1 Sekunde rot 100 € und ein Punkt. **Handy in der Hand:** 100 € und ein Punkt; ab März 2027 neu geregelt, der Betrag ist noch nicht offiziell erläutert.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot; ab 1,1 Promille eine Straftat.',
            '**Falsch geparkt auf Geh- oder Radweg:** behindernd 20 €, gefährdend 30 €; ab 1. März 2027 55 €, mit Behinderung 70 €.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter im PaderSprinter-Bus und im Zug',
      blocks: [
        '«Ab dem 01.04.2024 ist die Mitnahme von Elektrotretrollern in unseren Bussen untersagt», schreibt PaderSprinter, laut Stadt (März 2024) wegen der Brandgefahr der Akkus und bis auf Weiteres. Eine Ausnahme für zusammengeklappte Roller nennen beide nicht.',
        'Die Beförderungsbedingungen für Nahverkehr in NRW (gültig ab 1. Januar 2026) zählen einen vollständig zusammengeklappten E-Tretroller als Handgepäck, einen aufgeklappten wie ein Fahrrad. Jedes Verkehrsunternehmen darf E-Tretroller aber per Hausrecht ausschliessen, auch zusammengeklappt; das tut PaderSprinter. In den Zügen der eurobahn fährt dein Roller zusammengeklappt als Handgepäck mit, aufgeklappt im Fahrradbereich, wenn Platz ist; im Ersatzbus kann ihn das Busunternehmen ablehnen. Im Fernverkehr der Deutschen Bahn fährt er zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit; den Akku darfst du nicht herausnehmen oder laden. Lässt er sich nicht klappen, gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst, etwa im Gepäckregal.',
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor der Haltestelle und miete am Ziel neu. Verspätet sich dein Bus oder Nahverkehrszug an der Abfahrtshaltestelle um mindestens 20 Minuten, erstattet die Mobilitätsgarantie NRW laut PaderSprinter auch E-Scooter-Sharing, bis 30 € zwischen 5 und 19:59 Uhr, sonst bis 60 € (Stand 25. Oktober 2026).',
      ],
    },
    {
      heading: 'E-Scooter Paderborn: Tipps für Uni, Libori und SCP07',
      blocks: [
        'Freie Voi- und Dott-Scooter am Sonntagmorgen, 25. Oktober 2026:',
        {
          list: [
            '**Hauptbahnhof:** gut 60 Scooter im Umkreis von 500 m; auf dem Vorplatz dürfen die Verleiher nicht abstellen.',
            '**Universität:** gut 30 Scooter im Umkreis von 500 m um den Campus an der Warburger Strasse; dort zeigt die Karte kein Voi-Parkverbot. Vom Hauptbahnhof fahren laut Uni die Buslinien 1, 4, 6 und 100.',
            '**Schloss Neuhaus:** knapp 20 Scooter im Umkreis von 1 km ums Schloss. Im Schlosspark beendest du laut Karte keine Voi-Fahrt.',
            '**Libori:** Das grosse Fest füllt vom 23. Juli bis 1. August 2027 die Innenstadt, mit Kirmes und Pottmarkt. Eine Scooter-Regel dafür nennen weder Stadt noch PaderSprinter.',
            '**Home Deluxe Arena:** Die Stadionordnung verbietet, das Gelände ohne Erlaubnis mit Kraftfahrzeugen zu befahren; E-Scooter nennt sie nicht eigens. Die Arena hat 2000 Fahrradstellplätze, und die Eintrittskarte gilt zwei Stunden vor und nach dem Spiel in den Bussen von PaderSprinter.',
            '**Flughafen Paderborn/Lippstadt:** rund 20 km entfernt, ausserhalb von Vois Gebiet; zum Hauptbahnhof fahren laut Uni die Busse S60 und 460.',
          ],
        },
        'Wie es in Bielefeld mit Dott und Bolt läuft, steht im Ratgeber [E-Scooter in Bielefeld](guide:bielefeld). Freie Voi- und Dott-Scooter in deiner Nähe zeigt die [Live-Karte von Paderborn](map:de:Paderborn).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Paderborn?',
      answer: 'Laut Stadt Voi, Dott (früher TIER) und Bolt, jeweils in der App des Anbieters, ab 18 und ohne Führerschein. Unsere Live-Karte zeigt Voi und Dott, Bolt nur die Bolt-App.',
    },
    {
      question: 'Was kostet ein E-Scooter in Paderborn?',
      answer: 'Bei Voi 0,49 € fürs Entsperren und 0,24 € pro Minute, zehn Minuten also 2,89 €, laut Vois veröffentlichtem Tarif vom 25. Oktober 2026. Bei Dott und Bolt zeigt dir die App den Preis.',
    },
    {
      question: 'Wo darf ich in Paderborn einen E-Scooter abstellen?',
      answer: 'Aufrecht und längs am Gehwegrand, mit 1,50 m Platz; das verlangt die Stadt von den Verleihern. Nicht in Fussgängerzonen und Parks, an Haltestellen, auf Brücken und auf dem Bahnhofsvorplatz; im Inneren Ring nur in einer Abstellzone der App.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Paderauen oder den Schlosspark fahren?',
      answer: 'Eine Satzung, die das für dich regelt, fanden wir nicht. In ihren Auflagen für die Verleiher schreibt die Stadt, in Parks sei das Fahren «ausschliesslich auf den für Radfahrer gekennzeichneten Wegen gestattet»; halte dich daran. Eine Voi-Fahrt beendest du dort laut Karte nicht.',
    },
    {
      question: 'Darf ich meinen E-Scooter im PaderSprinter-Bus mitnehmen?',
      answer: 'Nein. Seit 1. April 2024 verbietet PaderSprinter E-Tretroller in seinen Bussen, eine Ausnahme für zusammengeklappte nennt es nicht. In den Zügen der eurobahn fährt ein zusammengeklappter Roller als Handgepäck mit.',
    },
    {
      question: 'Kann ich in Paderborn nachts einen E-Scooter mieten?',
      answer: 'Eine Nachtsperre hat die Stadt nicht veröffentlicht, und kurz nach Mitternacht am 25. Oktober 2026 zeigte die Karte knapp 700 freie Scooter. Ob sich einer entsperren lässt, zeigt die App.',
    },
  ],
  sources: [
    { title: 'Stadt Paderborn: Mobilitätsangebote in Paderborn', url: 'https://www.paderborn.de/wohnen-soziales/mobilitaet/neue-mobilitaetsangebote.php' },
    { title: 'Stadt Paderborn, Serviceportal: Elektroroller in Paderborn', url: 'https://mein-digiport.de/suche/-/vr-bis-detail/dienstleistung/147822/show' },
    { title: 'Stadt Paderborn: Detaillierte Regelung zum Abstellen von E-Scootern (September 2023, PDF)', url: 'https://mein-digiport.de/suche/-/vr-bis-detail/dokument/1276711/download?_19_WAR_vrportlet_priv_r_p_action=vr-bis-detail-dienstleistung-show' },
    { title: 'Stadt Paderborn: Sondernutzungssatzung, Fassung ab 1. März 2026 (PDF)', url: 'https://www.paderborn.de/rathaus-service/stadtverwaltung/satzungen/oeffentliche-ordnung.php.media/316104/Satzung-ueber-Erlaubnisse-und-Gebuehren-fuer-Sondernutzungen-an-oeffentlichen-Strassen-ab-01.03.2026.pdf' },
    { title: 'Stadt Paderborn: Neue Funktion zum Melden von störenden E-Scootern (25. Januar 2024)', url: 'https://www.paderborn.de/pressearbeit/pressemitteilungen/2024/januar/109010100000273906.php' },
    { title: 'Stadt Paderborn: Mitnahmeverbot von Elektro-Tretrollern in den PaderSprinter-Bussen (15. März 2024)', url: 'https://www.paderborn.de/pressearbeit/pressemitteilungen/2024/maerz/109010100000276695.php' },
    { title: 'Stadt Paderborn: Libori 2027', url: 'https://www.paderborn.de/veranstaltungen/events/2027_07_23_Libori.php' },
    { title: 'Voi: Start in Paderborn (April 2025, PDF)', url: 'https://storage.mfn.se/1eecc5e2-9a12-4fa1-8e61-b5afd6e5182a/e-scooter-anbieter-voi-startet-in-paderborn.pdf' },
    { title: 'NRW.Mobidrom: Mobilitätsdatenportal NRW', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Bolt in Paderborn', url: 'https://bolt.eu/de-de/cities/paderborn/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'PaderSprinter: Service und Mitnahme', url: 'https://www.padersprinter.de/service/' },
    { title: 'PaderSprinter: Mobilitätsgarantie NRW', url: 'https://www.padersprinter.de/service/mobilitaetsgarantie/' },
    { title: 'Beförderungsbedingungen Nahverkehr NRW, gültig ab 1. Januar 2026 (PDF)', url: 'https://www.westfalentarif.de/fileadmin/documents/Tarifbestimmungen_und_Bef%C3%B6rderungsbedingungen_Preise/BB_Nahverkehr_NRW_zum_01.01.2026.pdf' },
    { title: 'eurobahn: Mitnahme von Fahrrädern, Gepäck und Tieren', url: 'https://www.eurobahn.de/services/mitnahme-von-fahrraedern-gepaeck-und-tieren/' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Universität Paderborn: Anreise und Lageplan', url: 'https://www.uni-paderborn.de/universitaet/anreise-lageplan' },
    { title: 'SC Paderborn 07: Home Deluxe Arena', url: 'https://www.scp07.de/Arena/Home-Deluxe-Arena/' },
  ],
};

export default guide;
