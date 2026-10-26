import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-dresden',
  topic: 'dresden',
  name: 'E-Scooter Dresden: Anbieter, Preise, Parken',
  title: 'E-Scooter Dresden 2026: Bolt, Preise, Parken, Rote Zonen',
  description: 'E-Scooter Dresden: RideMovi und Bolt verleihen, Voi soll folgen; den Preis zeigt die App. Wo du fährst, wo die Roten Zonen liegen und was in Tram und Bus gilt.',
  headline: 'E-Scooter Dresden: Anbieter, Preise, Rote Zonen und was in Tram, Bus und Fähre gilt',
  lede: 'E-Scooter in Dresden verleihen laut Stadt RideMovi und Bolt; Voi soll «ab Herbst 2026» dazukommen. Bei Bolt mietest du ab 18 und ohne Führerschein, den Preis zeigt die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg, und stellst Leih-Scooter nicht in den 15 Roten Zonen der Stadt ab, etwa am Neumarkt, am Altmarkt, an der Prager Strasse und auf mehreren Elbbrücken. Einen eigenen E-Scooter darfst du zusammengeklappt kostenlos in Strassenbahn und Bus mitnehmen.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Dresden',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Dresden?',
      blocks: [
        'Wer in Dresden E-Scooter (auch E-Roller genannt) verleiht, braucht laut Stadt eine Sondernutzungserlaubnis und zahlt Gebühren. Nach einer Ausschreibung mit sechs Bewerbern und einem Losverfahren «erhielten BOLT, VOI und RideMovi am 18. Juli 2025 eine Sondernutzungserlaubnis für jeweils bis zu 833 Fahrzeuge», für drei Jahre ab dem 1. August 2025 (Pressemitteilung vom 28. Juli 2025). Heute nennt die Stadt für E-Scooter «RideMovi (seit August 2025), BOLT (seit März 2026) und Voi (ab Herbst 2026) – insgesamt 2.500 E-Scooter möglich» (Stand 29. September 2026). Lime, dessen E-Scooter laut derselben Pressemitteilung «durch die neuen Angebote ersetzt» werden sollten, führt die Stadt heute nur noch bei den E-Bikes (seit August 2025).',
        'Die [Karte von Dresden](map:de:Dresden) zeigt die freien Bolt-Scooter mit Standort und Akkustand, keine Preise, Zonen oder Abstellflächen; sie deckt das ganze Stadtgebiet ab. Am 26. Oktober 2026 zeigte sie zwischen 14:50 und 15 Uhr rund 515 Bolt-Scooter. Nach den amtlichen Grenzen (GeoSN) standen 514 in Dresden und einer in Radebeul, 16 m hinter der Stadtgrenze; gut 200 davon in den Gemarkungen Altstadt I und II und Neustadt, keiner in Loschwitz, Pillnitz oder Langebrück. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'RideMovi und, sobald es startet, Voi zeigt die Karte nicht, ebenso wenig E-Bikes und Leihräder; die findest du in den Apps der Anbieter. Dass Dott, Zeus oder Bird in Dresden vermieten, nennt keine offizielle Quelle. Wie das Mieten geht, steht in [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Dazu kommt MOBIbike, das städtische Leihrad, betrieben von den Dresdner Verkehrsbetrieben (DVB), laut Stadt mit «rund 2.000 Fahrrädern (Stand Juli 2025)». Mit DVB-Abo oder Deutschlandticket und dem Zusatzprodukt «MOBI» kannst du es «bis zu 30 Minuten kostenfrei nutzen – und das mehrmals täglich».',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Dresden?',
      blocks: [
        'Den Preis zeigt dir die App vor dem Entsperren; bei Bolt gehört laut Nutzungsbedingungen «die geltende Gebührentabelle, wie sie in der App angezeigt wird» zum Vertrag. Die Stadt nennt keinen Tarif. Sie selbst verlangt vom Anbieter laut Sondernutzungssatzung (Stand 17. Juli 2023) 3,35 € je E-Scooter und Monat. Teuer wird es für dich, wenn du falsch abstellst:',
        {
          table: {
            caption: 'Gebühren laut Bolts Nutzungsbedingungen',
            head: ['Anbieter', 'Falsch abgestellt', 'Weitere Gebühr', 'Stand'],
            rows: [
              ['Bolt', '15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist', 'bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs', 'seit 2023, auch ab 1. Dezember 2026'],
            ],
          },
        },
        'Zahlt Bolt für dich ein Bussgeld, kommen laut denselben Bedingungen höchstens 30 € Verwaltungsgebühr dazu, seit 2023 wie ab 1. Dezember 2026. Alkohol ist auf Bolts Scootern ganz tabu: «Es gilt ein striktes Alkoholverbot von 0,0‰.»',
      ],
    },
    {
      heading: 'Wo darf man in Dresden mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Dresden eigene Regeln gelten und wer sie setzt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es regelt'],
            rows: [
              ['Hauptstrasse in der Inneren Neustadt', 'Gehweg oder Fussgängerzone mit «Rad frei»: heute nicht fahren, ab 1. März 2027 im Schritttempo', 'Stadt (Beschilderung), Bund (eKFV, StVO)'],
              ['15 Rote Zonen rund um Altstadt und Neustadt', 'Leih-Scooter nicht abstellen, teils ganzjährig, teils zu Markt- und Veranstaltungszeiten', 'Stadt (Sharing-Leitlinien, Erlaubnis)'],
              ['Städtische Grünanlagen', 'Befahren mit «Kraftfahrzeugen aller Art» und Abstellen nur mit Genehmigung; nach unserer Lesart gilt das auch für E-Scooter', 'Stadt (Grünanlagensatzung von 2011)'],
              ['Gelände der TU Dresden', 'Es gilt die StVO; E-Scooter nicht in Gebäuden und nicht an Geländern oder Handläufen der Eingänge abstellen', 'TU Dresden (Hausordnung von 2026)'],
              ['HTW Dresden', '«Kraftfahrzeuge dürfen nur auf den dafür vorgesehenen und markierten Flächen abgestellt werden»; nach unserer Lesart gilt das auch für E-Scooter', 'HTW Dresden (Hausordnung, gültig ab 10. Februar 2012)'],
            ],
          },
        },
        {
          list: [
            '**Hauptstrasse:** Die Stadt kündigte am 22. Oktober 2025 an: «Statt wie bisher als Fussweg mit der Zusatzbezeichnung ‹Rad frei› wird die Hauptstrasse als Fussgängerzone mit ‹Rad frei› ausgewiesen.» Ob Gehweg oder Fussgängerzone: Für E-Scooter gilt «Rad frei» erst ab 1. März 2027, dann im Schritttempo; bis dahin schiebst du.',
            '**Grünanlagen:** In den Grünanlagen im Verzeichnis der Stadt braucht laut Grünanlagensatzung vom 27. Januar 2011 «das Befahren mit Kraftfahrzeugen aller Art oder das Abstellen derselben» eine Genehmigung. E-Scooter nennt sie nicht; nach unserer Lesart gilt das auch für sie.',
            '**TU Dresden:** Ihre Hausordnung vom 3. September 2026 nennt E-Scooter ausdrücklich: «Elektrokleinstfahrzeuge dürfen nicht in Gebäuden, an Geländern und Handläufen der Gebäudezugänge abgestellt werden.» In gekennzeichneten Abstellräumen und auf gekennzeichneten Flächen dürfen nur E-Scooter mit abnehmbarem Akku stehen, und den Akku nimmst du ab; laden darfst du ihn an der TU nicht. Auf dem Gelände gilt die StVO.',
            '**Nachts und im Winter:** Eine nächtliche Sperrzeit oder Winterpause nennen weder die Stadt noch Bolt (Stand 26. Oktober 2026).',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter in Dresden parken: Rote Zonen in Altstadt und Neustadt',
      blocks: [
        'Die Stadt bittet: «Halten Sie Gehwege, abgesenkte Bordsteine, Engstellen, Haltestellen und Rampen stets frei. Stellen Sie die Fahrzeuge nicht auf Grünflächen oder vor Eingängen ab.» In Bolts Bedingungen heisst es: «Für das Parken von E-Scootern gelten die für Fahrräder geltenden Parkvorschriften entsprechend»; in den roten Bereichen der App stellst du nicht ab. Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO.',
        'Die Sharing-Leitlinien der Stadt legen 15 «Rote Zonen mit Abstellverbot» fest; laut der Ausschreibung von 2025 gelten sie für die heutigen Anbieter. Dazu gehören Altmarkt, Neumarkt, Fürstenzug, Schlossplatz, Schlossstrasse, Theaterplatz und Zwinger, die Brühlsche Terrasse, Neustädter Markt und Hauptstrasse, die Prager Strasse, Lennéstrasse und Lingnerallee sowie die Marien-, Augustus- und Albertbrücke. Rot markierte Flächen sind «ganzjährig» gesperrt, schraffierte «zu Zeiten von bestimmten Märkten & Veranstaltungen». Auf der Karte der Stadt ist etwa der Neustädter Markt ganzjährig gesperrt, die Hauptstrasse nur zu diesen Zeiten.',
        'Die Karte (Ausgabe vom 22. Dezember 2021) ist laut eigenem Vermerk «nicht rechtsverbindlich»; was gerade gesperrt ist, zeigt die App. Erweitert die Stadt die Verbotszonen, muss jeder Anbieter sie binnen vier Wochen in seiner App umsetzen.',
        {
          list: [
            '**Foto:** Die Stadt verlangt von den Anbietern, dass am Ende jeder Fahrt ein Foto vom abgestellten Scooter entsteht und die Position mit den Verbotszonen abgeglichen wird.',
            '**Abstand:** Die Anbieter müssen laut Leitlinien dafür sorgen, dass an Haltestellen 20 m frei bleiben, auf dem Gehweg mindestens 2 m Platz bleibt und höchstens vier Fahrzeuge an einer Stelle stehen, mit 50 m Abstand zur nächsten. Freihalten müssen sie auch Brücken, Parks und Grünflächen.',
            '**Hauptbahnhof und Bahnhof Neustadt:** Eigene Abstellregeln nennt die Stadt für beide nicht; Bahnsteige und Haltestellen müssen die Anbieter auch dort freihalten.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, läuft die Miete weiter: Fahr aus der Roten Zone hinaus. Blockiert ein Leih-Scooter den Gehweg, meldest du das über die App oder die Website des Anbieters; für Bolt und Voi nennt die Stadt auch scooter-melder.de.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Dresden: Bussgelder, Alkohol, Polizei',
      blocks: [
        'In Dresden gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit gefahren', '10 €', '25 €'],
              ['Rote Ampel', '60 € und 1 Punkt; länger als 1 Sekunde rot: 100 € und 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 € und 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Unzulässig auf Geh- oder Radweg geparkt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', '55 €, mit Behinderung 70 €'],
              ['Ohne gültige Versicherungsplakette', '40 €', 'Unverändert'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0 Promille.',
        'Ende August 2026 kontrollierte die Polizeidirektion Dresden gezielt den Radverkehr: Am 24. und 25. August ahndete sie im Stadtgebiet 65 Verstösse, 57 davon von Radfahrern; «22 Radfahrer und ein E-Scooter-Fahrer» fuhren auf dem Radweg in der falschen Richtung.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus, Fähre und Zug: DVB, VVO und DB',
      blocks: [
        'Im Verkehrsverbund Oberelbe (VVO), also in Strassenbahn und Bus der DVB wie in S-Bahn und Regionalzug, erlauben die Beförderungsbedingungen (Stand 1. August 2026) zusammengeklappte elektrische Tretroller, «wenn die Voraussetzungen zur Beförderung dazu gegeben sind». Nicht zusammengeklappte versicherungspflichtige Fahrzeuge sind «grundsätzlich von der Beförderung ausgeschlossen». Kostenlos fährt laut VVO-Tarif «ein zusammengeklappter elektrischer Tretroller» mit.',
        {
          list: [
            '**Strassenbahn und Bus der DVB:** Für sie machen die VVO-Bedingungen keine Ausnahme, anders als in Leipzig, wo seit dem 1. Mai 2024 kein E-Scooter mehr in Strassenbahnen und Busse der LVB darf. Einen Anspruch auf Mitnahme hast du aber nicht: «Das Betriebspersonal entscheidet im Einzelfall, ob Sachen zur Beförderung zugelassen werden».',
            '**Elbfähren:** Dort werden laut VVO auch versicherungspflichtige Fahrzeuge «grundsätzlich befördert, sofern die Bauart des Fahrzeugs und der Fähre sowie der Fähranleger die Beförderung zulassen»; nach unserer Lesart gehört ein E-Scooter dazu. Es entscheidet das Fährpersonal.',
            '**IC und ICE der Deutschen Bahn:** Zusammengeklappt und sicher verstaut fährt dein eigener E-Scooter dort kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Miete in der Nähe der Haltestelle, ohne den Zugang zu versperren, und leih dir am Ziel einen neuen.',
      ],
    },
    {
      heading: 'Leipzig und das Umland: E-Scooter in der Nähe',
      blocks: [
        'In Leipzig verleihen Dott und Voi, und abstellen darfst du nur an markierten Stationen; mehr steht in [E-Scooter in Leipzig](guide:leipzig), die freien Scooter zeigt die [Karte von Leipzig](map:de:Leipzig). Ob du eine Dresdner Fahrt in Radebeul, Freital oder Heidenau beenden darfst, zeigt die App.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter kann ich in Dresden mieten?',
      answer: 'Laut Stadt die von RideMovi und Bolt; Voi soll «ab Herbst 2026» dazukommen (Stand 29. September 2026). Bei Bolt musst du mindestens 18 sein, einen Führerschein brauchst du nicht. Unsere Karte zeigt nur Bolt.',
    },
    {
      question: 'Was kostet ein E-Scooter in Dresden?',
      answer: 'Den Preis zeigt dir die App vor dem Entsperren; die Stadt nennt keinen Tarif. Bei Bolt wird Falschparken teuer: 15 € ohne klares Abstellfoto, bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs.',
    },
    {
      question: 'Wo darf ich in der Dresdner Altstadt einen Leih-Scooter abstellen?',
      answer: 'Nicht in den 15 Roten Zonen der Stadt, etwa auf Alt- und Neumarkt, Schlossplatz, Theaterplatz, Brühlscher Terrasse, Prager Strasse und mehreren Elbbrücken; manche Flächen sind nur zu Markt- und Veranstaltungszeiten gesperrt. Ausserhalb stellst du ihn so ab, dass Gehweg, Haltestelle und Rampe frei bleiben. Was gerade gesperrt ist, zeigt die App.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über die Hauptstrasse fahren?',
      answer: 'Heute nicht. Ob Gehweg oder, wie die Stadt im Oktober 2025 angekündigt hat, Fussgängerzone: «Rad frei» gilt dort bis Ende Februar 2027 nur für Radfahrende. Ab 1. März 2027 darfst du im Schritttempo fahren.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'Deinen eigenen ja, zusammengeklappt und wenn das Personal ihn zulässt; im VVO fährt er dann kostenlos mit. Nicht zusammengeklappte versicherungspflichtige Fahrzeuge schliessen die Bedingungen «grundsätzlich» aus, und Leih-Scooter lassen sich nicht zusammenklappen.',
    },
  ],
  sources: [
    { title: 'Landeshauptstadt Dresden: Multimobil & Sharing (29. September 2026)', url: 'https://www.dresden.de/de/stadtraum/verkehr/sharing.php' },
    { title: 'Landeshauptstadt Dresden: Neue E-Scooter und E-Bikes für Dresden (Pressemitteilung, 28. Juli 2025)', url: 'https://www.dresden.de/de/rathaus/aktuelles/pressemitteilungen/07/Pm_037.php' },
    { title: 'Landeshauptstadt Dresden: Aufruf zur Interessenbekundung E-Scooter-Sharing (Mai 2025, PDF)', url: 'https://www.dresden.de/media/pdf/Strassenbau/Sharing_2025-05-06_Interessenbekundung_E-Scooter.pdf' },
    { title: 'Landeshauptstadt Dresden: Leitlinien für eine geteilte Mobilität (Stadtratsbeschluss vom 14. Juli 2022, PDF)', url: 'https://dresden.de/media/pdf/verkehr/Sharingleitlinien-Mobilitaet-Dresden-5.pdf' },
    { title: 'Landeshauptstadt Dresden: Sharing-Leitlinien, Anlage B: Rote Zonen mit Abstellverbot (22. Dezember 2021, PDF)', url: 'https://www.dresden.de/media/pdf/verkehr/Sharingleitlinien_Mobilitaet_Rote_Zonen_mit_Abstellverbot.pdf' },
    { title: 'Landeshauptstadt Dresden: Sharing-Leitlinien, Anlage D: Stationen und Abstellen ausserhalb (21. Februar 2022, PDF)', url: 'https://www.dresden.de/media/pdf/verkehr/Sharingleitlinien_Vorgaben_Stationen_und_Abstellen_ausserhalb.pdf' },
    { title: 'Landeshauptstadt Dresden: Sondernutzungssatzung, zuletzt geändert am 17. Juli 2023 (PDF)', url: 'https://www.dresden.de/media/pdf/verkehr/satzung_sondernutzung.pdf' },
    { title: 'Landeshauptstadt Dresden: Grünanlagensatzung vom 27. Januar 2011 (PDF)', url: 'https://www.dresden.de/media/pdf/gruenflaechen/Satzung_sondernutzung_gruenanlagen.pdf' },
    { title: 'Landeshauptstadt Dresden: Neue Piktogramme auf der Hauptstrasse (Pressemitteilung, 22. Oktober 2025)', url: 'https://www.dresden.de/de/rathaus/aktuelles/pressemitteilungen/10/Pm_048.php' },
    { title: 'GeoSN: ALKIS-WFS, Verwaltungseinheiten und Gemarkungen (Stand 15. Oktober 2026)', url: 'https://www.geodaten.sachsen.de/alkis-wfs-4968.html' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. August 2023 bis 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicle-old/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'TU Dresden: Hausordnung vom 3. September 2026 (Amtliche Bekanntmachungen Nr. 11/2026, PDF)', url: 'https://www.verw.tu-dresden.de/AmtBek/PDF-Dateien/2026-11/20_AB26_208_Hausordnung.pdf' },
    { title: 'HTW Dresden: Hausordnung, gültig ab 10. Februar 2012 (PDF)', url: 'https://www.htw-dresden.de/fileadmin/HTW/Zentrale_Dokumente/Externe_Dokumente/Ordnungen/Hausordnung_HTWD.pdf' },
    { title: 'Polizeidirektion Dresden: Medieninformation Nr. 419|26 (26. August 2026)', url: 'https://medienservice.sachsen.de/medien/news/1099568' },
    { title: 'VVO: Das Kleingedruckte, Beförderungsbedingungen und Tarif (Stand 1. August 2026, PDF)', url: 'https://www.vvo-online.de/doc/VVO-Broschuere-VVO-Kleingedrucktes.pdf' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Deutsche Bahn: Beförderungsbedingungen (Stand 26. Oktober 2026), A.7.1', url: 'https://www.bahn.de/agb' },
  ],
};

export default guide;
