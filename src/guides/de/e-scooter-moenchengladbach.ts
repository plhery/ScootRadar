import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-moenchengladbach',
  topic: 'moenchengladbach',
  name: 'E-Scooter Mönchengladbach: Anbieter, Preise, Parken',
  title: 'E-Scooter Mönchengladbach 2026: Anbieter, Preise, Sperrzonen',
  description: 'E-Scooter Mönchengladbach: Voi, Dott und Bolt, was Voi pro Minute kostet, wo du in Parks nicht abstellst und was in den Bussen der NEW gilt.',
  headline: 'E-Scooter Mönchengladbach: Anbieter, Preise, Parken, Sperrzonen und was in Bus und Bahn gilt',
  lede: 'Einen E-Scooter in Mönchengladbach leihst du ab 18 und ohne Führerschein bei Voi, Dott oder Bolt. Voi verlangt in Mönchengladbach laut seinem veröffentlichten Tarif 0,49 € fürs Entsperren und 0,24 € pro Minute, zehn Minuten kosten also 2,89 € (Stand 25. Oktober 2026); Dott und Bolt zeigen ihren Preis in der App. In Parks und Grünanlagen verbietet die Stadt, Fahrzeuge abzustellen, und Voi sperrt die Rückgabe laut Karte unter anderem im Bunten Garten, hinter dem Hauptbahnhof und am Borussia-Park. Ein Mitnahmeverbot für E-Scooter hat die NEW für ihre Busse nicht veröffentlicht.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Mönchengladbach',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Mönchengladbach?',
      blocks: [
        'Drei Anbieter vermieten im Oktober 2026 E-Scooter in Mönchengladbach: **Voi**, **Dott** (früher Tier) und **Bolt**. Alle drei nennt die Stadt auf ihrer Seite mit den Beschwerdeadressen für E-Scooter. Voi fährt laut eigener Mitteilung seit dem 24. März 2025 in der Stadt, Dott führt Mönchengladbach auf seiner Standortliste, und Bolt nennt auf seiner Stadtseite E-Scooter als Angebot (Stand 25. Oktober 2026). NRW.Mobidrom, das Mobilitätsdatenportal des Landes, führt Voi in Mönchengladbach seit September 2025 und Bolt seit Juli 2026.',
        'Vois Gebiet umfasst laut Karte Gladbach und Rheydt mit den Vierteln ringsum, im Norden bis Neuwerk, im Süden bis Odenkirchen und Wickrath. Rheindahlen, Hardt, Wanlo und der Flughafen liegen ausserhalb, und über die Stadtgrenze reicht es nirgends (Stand 25. Oktober 2026). Wo du mit Dott und Bolt fahren darfst, zeigen ihre Apps.',
        'Gemietet wird in der App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Auf der [Karte von Mönchengladbach](map:de:Mönchengladbach) zeigt ScootRadar Voi und Dott: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 830 Voi- und 490 Dott-Scooter, zusammen gut 1300. Die Zahl umfasst das ganze Stadtgebiet mit Rheydt, Wickrath und Odenkirchen, aber nicht Neuss, Viersen oder Korschenbroich. Das ist eine Momentaufnahme, keine Flottengrösse. Für Voi zeigt die Karte auch Preis, Abstellverbote und Fahrgebiet, für Dott nur die Standorte. Bolt fehlt auf der Karte; seine Scooter findest du nur in der Bolt-App. E-Bikes und die Leihräder von nextbike zeigt die Karte nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Mönchengladbach?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Mönchengladbach (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (veröffentlichter Tarif, 25. Oktober 2026)', '0,49 €', '0,24 €', '2,89 €', '5,29 €'],
              ['Dott, Bolt', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde kostet bei Voi damit 4,09 €. Pässe und ihre Preise zeigt die App. Verbindlich ist immer der Preis, den die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'E-Scooter in Mönchengladbach parken: Innenstadt, Hauptbahnhof, Parks',
      blocks: [
        '«E-Scooter werden abgestellt wie Fahrräder, ohne Behinderung anderer Menschen», schreibt die Polizei Mönchengladbach (Juli 2025). Feste Parkzonen der Stadt gibt es bisher nicht (Stand 25. Oktober 2026).',
        '**Parks und Grünanlagen:** Hier gilt eine Regel der Stadt. Ihre Strassen- und Anlagenverordnung vom 17. Dezember 2015 erfasst alle öffentlich zugänglichen Park- und Grünanlagen, Gärten, Friedhöfe und Spielplätze, gleich wem sie gehören. Dort ist verboten, «Fahrzeuge abzustellen» und «ausserhalb der hierfür zugelassenen Wege zu fahren»; die Geldbusse reicht bis 1000 €. E-Scooter nennt die Verordnung nicht eigens, doch laut Polizei ist ein E-Scooter ein Kraftfahrzeug. Nach unserer Lesart gilt das Verbot also auch für ihn.',
        'Bei Voi beendest du die Fahrt laut [Live-Karte](map:de:Mönchengladbach) nicht (Stand 25. Oktober 2026):',
        {
          list: [
            '**am Hauptbahnhof:** im Bahnhofsbereich und auf dem Platz der Republik hinter dem Bahnhof; auf dem Europaplatz davor zeigt die Karte kein Verbot;',
            '**in den Parks der Innenstadt:** im Bunten Garten mit Botanischem Garten und Kaiserpark, im Geropark am Geroweiher, im Abteigarten und im Hans-Jonas-Park;',
            '**in Rheydt:** rund um Grenzlandstadion und Jahnstadion, im Hugo-Junkers-Park und im Schmölderpark;',
            '**am Borussia-Park** und im SparkassenPark nebenan;',
            '**im Süden:** im Schlosspark Wickrath und auf einem breiten Streifen entlang der Niers, der bis an den Bahnhof Wickrath reicht.',
          ],
        },
        'Kein Voi-Abstellverbot zeigt die Karte in der Fussgängerzone der Hindenburgstrasse, am Alten Markt, am Rheydter Marktplatz und am Hauptbahnhof Rheydt. Dort gilt die Regel für Fahrräder: Der Weg bleibt frei. Wo Dott und Bolt das Abstellen sperren, zeigen nur ihre Apps.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Sperrzone, und die Miete läuft weiter. Schieb den Scooter aus dem Park oder vom Platz hinter dem Bahnhof hinaus und versuch es dort.',
        },
      ],
    },
    {
      heading: 'Wo darf man in Mönchengladbach mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, auch mit ausgeschaltetem Motor, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; ohne ein solches Schild schiebst du durch die Fussgängerzonen der Hindenburgstrasse und der Rheydter Hauptstrasse. Gegen die Fahrtrichtung einer Einbahnstrasse mit «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt dich mitfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es dort erlaubt. Diese Regeln setzt der Bund. Die Polizei Mönchengladbach nennt Gehwege, Fussgängerzonen und Busspuren als verboten (Juli 2025).',
        'In Parks, Gärten und auf Friedhöfen fährst du nach der Anlagenverordnung der Stadt nur auf den dafür zugelassenen Wegen.',
        'Ausserhalb des Voi-Gebiets liegen nach Vois eigener Regel laut Karte (Stand 25. Oktober 2026):',
        {
          list: [
            'der Volksgarten;',
            'Schloss Rheydt mit seinem Park, der Zoppenbroicher Park und der grösste Teil des Rheydter Stadtwalds;',
            'Rheindahlen, Hardt und der Hardter Wald;',
            'der Hauptfriedhof, Wanlo und der Flughafen.',
          ],
        },
        'Eine nächtliche Sperrzeit für Leih-Scooter hat die Stadt nicht veröffentlicht, und die Karte zeigt keine (Stand 25. Oktober 2026).',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Mönchengladbach: Bussgelder und Alkohol',
      blocks: [
        'In Mönchengladbach gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Was bei NEW und VRR gilt',
      blocks: [
        'In den Stadtbussen der NEW gelten die Beförderungsbedingungen NRW, dieselben wie im VRR: Ein E-Tretroller, der «vollständig im kleinstmöglichen Packmass» zusammengeklappt ist, zählt als Handgepäck. Jedes Verkehrsunternehmen darf E-Tretroller aber per Hausrecht ausschliessen, «auch zusammengeklappte». Ein solches Verbot nennt die NEW auf ihren Seiten nicht (Stand 25. Oktober 2026), und auch die Liste des ADAC mit den Betrieben, die keine E-Scooter mehr mitnehmen, nennt sie nicht, anders als Rheinbahn, DVG oder DSW21 (seit 1. März 2024; Stand November 2025).',
        'In S-Bahn und Regionalzug zählt dein zusammengeklappter Scooter laut VRR als Handgepäck, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen (Stand Juli 2026). Leih-Scooter lassen sich nicht zusammenklappen und zählen damit nicht als Handgepäck; stell sie vor der Haltestelle ab. Fährst du weiter nach Düsseldorf: Die Rheinbahn nimmt laut ADAC seit dem 1. März 2024 keine E-Scooter mehr mit, mehr dazu in [E-Scooter in Düsseldorf](guide:dusseldorf).',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand Oktober 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Borussia-Park, Rheydt, Hochschule: Tipps für Mönchengladbach',
      blocks: [
        '**Borussia-Park:** Das Stadion heisst seit der Saison 2026/27 ista-Borussia-Park. Einen Voi stellst du laut Karte am Stadion nicht ab (Stand 25. Oktober 2026). Die Stadionordnung (Fassung vom 1. August 2026) verbietet, das umfriedete Stadiongelände ohne Erlaubnis mit Kraftfahrzeugen zu befahren oder dort ausserhalb der dafür ausgewiesenen Flächen zu parken; E-Scooter nennt sie nicht eigens, eine Spieltagsregel für E-Scooter auch die Stadt nicht. Der Stadion-Shuttle der NEW fährt laut NEW ab drei Stunden vor Spielbeginn alle fünf Minuten von beiden Hauptbahnhöfen, der letzte 20 Minuten vor Anpfiff; du brauchst ein gültiges Stadionticket. Am Gladbacher Hauptbahnhof hält er auf dem Platz der Republik hinter dem Bahnhof, in Vois Abstellverbotszone: Beende die Voi-Fahrt vorher, etwa auf dem Europaplatz.',
        '**Rheydt:** Hauptbahnhof, Marktplatz und Rathaus liegen laut Karte im Voi-Gebiet ohne Abstellverbot (Stand 25. Oktober 2026).',
        '**Wickrath:** Der Ortskern liegt im Voi-Gebiet. Im Schlosspark und entlang der Niers stellst du einen Voi laut Karte aber nicht ab, auch am Bahnhof nicht.',
        '**Hochschule Niederrhein:** Der Campus Mönchengladbach an Webschulstrasse und Richard-Wagner-Strasse liegt laut Karte im Voi-Gebiet, ohne Abstellverbot (Stand 25. Oktober 2026).',
      ],
    },
    {
      heading: 'Was die Stadt Mönchengladbach für Leih-Scooter regelt',
      blocks: [
        'Eine Sondernutzungserlaubnis oder Gebühr für Leih-Scooter gibt es in Mönchengladbach bisher nicht; die Sondernutzungssatzung der Stadt von 1994, zuletzt 2018 geändert, nennt sie nicht (Stand Oktober 2026). Eine Obergrenze hat die Stadt nicht veröffentlicht.',
        'Das könnte sich ändern. Am 29. März 2023 beauftragte der Rat mit Mehrheit die Verwaltung, ein Gesamtkonzept für den Platzbedarf von E-Scootern, Leihrädern, Car-Sharing und anderen Angeboten zu erstellen. Darauf aufbauend soll sie prüfen, wie der gewerbliche Verleih in die Sondernutzungssatzung aufgenommen werden kann, welche Gebühr pro Scooter und Jahr angemessen wäre und ob Scooter nur noch auf dafür vorgesehenen Flächen stehen dürfen.',
        'Im September 2025 beauftragten der Ausschuss für Feuerwehr, öffentliche Ordnung und Katastrophenschutz und der Ausschuss für Umwelt und Mobilität einstimmig die Verwaltung, ein Konzept für ein Netz von Stellflächen in der Innenstadt und den Aussenbezirken zu erarbeiten, ausgehend von Kernzellen. Ziel ist, dass Leih-Scooter nach der Fahrt verpflichtend dort abgestellt werden. Laut Begründung des Antrags sollen die Anbieter das Beenden der Fahrt per Geofencing nur dort zulassen, wie in Leipzig, Berlin oder Prag. Im Juni 2026 nannte die Verwaltung im Ausschuss für Umwelt und Mobilität ein E-Scooter-Konzept als laufendes Projekt. Veröffentlicht war es bis zum 25. Oktober 2026 nicht, und in Kraft ist nichts davon.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Mönchengladbach nutzen?',
      answer: 'Die von Voi, Dott und Bolt (Stand Oktober 2026). Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Voi- und Dott-Scooter zeigt auch die ScootRadar-Karte, die von Bolt nur die Bolt-App.',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Mönchengladbach?',
      answer: 'Bei Voi 2,89 €: 0,49 € fürs Entsperren und 0,24 € pro Minute, laut Vois veröffentlichtem Mönchengladbacher Tarif vom 25. Oktober 2026. Bei Dott und Bolt zeigt dir die App den Preis.',
    },
    {
      question: 'Darf ich den E-Scooter im Bunten Garten oder im Volksgarten abstellen?',
      answer: 'Nach unserer Lesart nicht. Die Strassen- und Anlagenverordnung der Stadt verbietet, in Parks und Grünanlagen «Fahrzeuge abzustellen», und ein E-Scooter ist laut Polizei ein Kraftfahrzeug. Voi sperrt zudem laut Karte die Rückgabe im Bunten Garten, und der Volksgarten liegt ganz ausserhalb des Voi-Gebiets (Stand 25. Oktober 2026). Beende die Fahrt vor dem Park.',
    },
    {
      question: 'Darf ich einen E-Scooter in den Bus der NEW mitnehmen?',
      answer: 'Zusammengeklappt zählt dein eigener E-Scooter nach den Beförderungsbedingungen als Handgepäck, und ein Verbot hat die NEW nicht veröffentlicht (Stand 25. Oktober 2026). Jedes Unternehmen darf E-Tretroller aber per Hausrecht ausschliessen. Leih-Scooter lassen sich nicht zusammenklappen und zählen damit nicht als Handgepäck.',
    },
    {
      question: 'Komme ich mit dem E-Scooter zum Borussia-Park?',
      answer: 'Ja, das Stadion liegt im Voi-Gebiet, doch direkt am Stadion beendest du eine Voi-Fahrt laut Karte nicht (Stand 25. Oktober 2026), und aufs umfriedete Stadiongelände darfst du laut Stadionordnung ohne Erlaubnis nicht mit Kraftfahrzeugen fahren. Stell den Scooter vorher ab und geh die letzten Meter, oder nimm an Spieltagen den Stadion-Shuttle der NEW.',
    },
  ],
  sources: [
    { title: 'Stadt Mönchengladbach: E-Scooter, Beschwerdeadressen', url: 'https://www.moenchengladbach.de/rathaus/buergerinfo-a-z/planen-bauen-mobilitaet-umwelt-dezernat-vi/fachbereich-stadtentwicklung-und-planung-61/abteilung-kommunale-verkehrsplanung-und-mobilitaetsplanung/mobilitaetsmanagement/elektrotretroller-in-moenchengladbach/e-scooter-beschwerdeadressen' },
    { title: 'Stadt Mönchengladbach: Strassen- und Anlagenverordnung vom 17. Dezember 2015 (PDF)', url: 'https://www.moenchengladbach.de/fileadmin/news_import/Ortsrecht/30-ff/32.1_-_Geltungsdauer_bis_Dezember_2035.pdf' },
    { title: 'Stadt Mönchengladbach: Sondernutzungssatzung (PDF)', url: 'https://www.moenchengladbach.de/fileadmin/news_import/Ortsrecht/60-ff/60.9.pdf' },
    { title: 'Stadt Mönchengladbach, Ratsinformation: Antrag 2163/X zum gewerblichen E-Scooter-Verleih, Ratsbeschluss vom 29. März 2023', url: 'https://ris-moenchengladbach.itk-rheinland.de/sessionnetmglbi/vo0050.asp?__kvonr=18215' },
    { title: 'Stadt Mönchengladbach, Ratsinformation: Antrag 4380/X zu Stellflächen für Miet-E-Roller (September 2025)', url: 'https://ris-moenchengladbach.itk-rheinland.de/sessionnetmglbi/vo0050.asp?__kvonr=20461' },
    { title: 'Stadt Mönchengladbach, Ratsinformation: Berichtsvorlage 0744/XI, 10 Jahre Zukunftsnetz Mobilität NRW (Juni 2026)', url: 'https://ris-moenchengladbach.itk-rheinland.de/sessionnetmglbi/vo0050.asp?__kvonr=21169' },
    { title: 'Polizei Mönchengladbach: Sicherheits-Tipps E-Scooter (Juli 2025, PDF)', url: 'https://hochsauerlandkreis.polizei.nrw/sites/default/files/2025-08/neu_v_flyer_e-scooter_mg.pdf' },
    { title: 'Voi: Start in Mönchengladbach (März 2025, PDF)', url: 'https://storage.mfn.se/600c0b23-8174-4920-a31a-77235a41f307/e-scooter-anbieter-voi-startet-in-monchengladbach.pdf' },
    { title: 'NRW.Mobidrom: Mobilitätsdatenportal NRW', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Bolt: Bolt in Mönchengladbach', url: 'https://bolt.eu/de-de/cities/monchengladbach/' },
    { title: 'NEW: Downloadcenter mit den Beförderungsbedingungen NRW', url: 'https://www.new.de/oepnv/service/downloadcenter' },
    { title: 'NEW: Stadion-Shuttle', url: 'https://www.new.de/oepnv/service/new-mobil-stadion-shuttle' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'ADAC: Mitnahmeverbot im Nahverkehr (Stand November 2025)', url: 'https://www.adac.de/news/verkehr-e-scooter-mitnahmeverbot-nahverkehr/' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Borussia Mönchengladbach: Fohlen spielen ab 2026/27 im ista-Borussia-Park', url: 'https://www.borussia.de/news/fohlen-spielen-ab-2026-27-im-ista-borussia-park' },
    { title: 'Borussia Mönchengladbach: Stadionordnung (Fassung vom 1. August 2026)', url: 'https://www.borussia.de/stadionordnung' },
  ],
};

export default guide;
