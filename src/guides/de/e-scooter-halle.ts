import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-halle',
  topic: 'halle',
  name: 'E-Scooter Halle: Anbieter, Preise, Parken',
  title: 'E-Scooter Halle 2026: Bolt, Preise, Parken, Regeln',
  description: 'E-Scooter Halle: Bolt ist der einzige Anbieter, den die Stadt nennt. Was die Fahrt kostet, wo du fährst und parkst und warum kein Scooter in Tram und Bus darf.',
  headline: 'E-Scooter Halle (Saale): Bolt, Preise, markierte Abstellflächen und das Verbot in Tram und Bus',
  lede: 'E-Scooter in Halle (Saale) leihst du ab 18 und ohne Führerschein bei Bolt, dem einzigen Anbieter, den die Stadt nennt; den Preis zeigt die Bolt-App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch Fussgängerzonen wie die Leipziger Strasse. Frei abstellen ist laut Stadt nicht vorgesehen: Leih-Scooter gehören auf beantragte Flächen, die der Betreiber farbig markiert. In Strassenbahnen und Bussen der HAVAG darfst du seit Mai 2024 keinen E-Scooter mitnehmen, auch keinen eigenen.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Halle (Saale)',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Halle?',
      blocks: [
        'Als Verleiher von E-Scootern (auch E-Roller genannt) nennt die Stadt Halle (Saale) nur **Bolt**. Den Anbietern waren laut Stadt die beantragten Stellflächen «mit Sondernutzungsbescheid» bis 30. Juni 2024 genehmigt; im April 2024 sprach sie «mit dem verbleibenden Anbieter Bolt» über einen neuen Antrag ab 1. Juli 2024. Nach dem Mindestalter bei den kommerziellen Verleihern gefragt, nannte die Verwaltung im April 2026 nur Bolt: ab 18. Von Juli 2024 bis Juni 2025 waren 549 Roller genehmigt; «von Juli 2025 bis Juni 2028 sind derzeit 600 Roller genehmigt». 44 weitere Standorte waren in Prüfung.',
        'Auf seiner Seite für Halle nennt Bolt E-Scooter (gelesen am 26. Oktober 2026). Dott (früher Tier) führt Halle nicht unter seinen Standorten (Stand 13. Juli 2026), und dass Voi, Lime, Zeus oder Bird in Halle vermieten, nennt keine offizielle Quelle. Du leihst den Scooter in der Bolt-App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Halle (Saale)](map:de:Halle (Saale)) zeigt die freien Bolt-Scooter mit Standort und Akkustand, keine Preise, Zonen oder Abstellflächen. Am Montag, 26. Oktober 2026, zeigte sie gegen 16.40 Uhr rund 530 Bolt-Scooter. Nach den amtlichen Verwaltungsgrenzen des Landesamts für Vermessung und Geoinformation Sachsen-Anhalt (LVermGeo) standen 433 in Halle, 93 in Merseburg und einer in Leuna, keiner in Schkopau. Nach den Stadtteilgrenzen derselben Quelle standen die meisten in der Nördlichen Innenstadt (62), der Nördlichen Neustadt (43) und der Südlichen Innenstadt (41); 22 der 43 Stadtteile hatten mindestens einen. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'Die Karte deckt allerdings nicht die ganze Stadt ab: Reideburg und Dölau fehlen fast ganz, vom Gewerbegebiet Neustadt zwei Drittel, von Nietleben, Lettin, Seeben, Tornau und der Dölauer Heide 40 bis 55 Prozent. Ob dort Bolt-Scooter stehen, siehst du in der Bolt-App.',
        'Leihräder von nextbike stehen laut Stadt etwa an der Mobilitätsstation am Steintor (September 2024); die Karte zeigt keine Leihräder.',
      ],
    },
    {
      heading: 'E-Scooter mieten in Halle: Was kostet die Fahrt?',
      blocks: [
        'Den Preis zeigt dir die Bolt-App vor dem Entsperren; laut Bolts Nutzungsbedingungen gehört «die geltende Gebührentabelle, wie sie in der App angezeigt wird» zum Vertrag. Die Stadt nennt keinen Tarif. Ihre Sondernutzungsgebühr «hängt von der Anzahl der Scooter ab und nicht von den Aufstellflächen», schrieb sie im April 2026, ohne einen Betrag zu nennen. Teuer wird es für dich, wenn du falsch abstellst:',
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
      heading: 'Wo darf man in Halle mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        {
          list: [
            '**Leipziger Strasse:** Die Stadt spricht von der «Fussgängerzone der Leipziger Strasse» (Pressemitteilung vom 11. Mai 2023), ebenso im März 2026. Ohne Schild «Elektrokleinstfahrzeuge frei» steigst du dort ab und schiebst. Das Fahren dort regeln laut Stadt eKFV und StVO, nicht ihre Erlaubnis für die Anbieter: «Eine Einschränkung über die Sondernutzung ist nicht möglich» (April 2023).',
            '**Parks und Grünanlagen:** In den Grünanlagen der Stadt gilt die Grünflächensatzung vom 23. Februar 2005, zuletzt geändert am 26. Oktober 2022. Die Anlagen «dürfen nur benutzt werden» von Fussgängern und Radfahrern, mit Kinderwagen, Versehrten-, Kinderspiel- und Pflegefahrzeugen sowie zum Reiten auf freigegebenen Wegen; untersagt ist, «Vegetationsflächen zu befahren bzw. dort Kraftfahrzeuge abzustellen oder zu parken». Die Gefahrenabwehrverordnung der Stadt von 2017 verbietet in öffentlichen Anlagen «das Befahren, das Abstellen und das Parken von Kraftfahrzeugen». E-Scooter nennen beide nicht; rechtlich sind sie aber Kraftfahrzeuge (§ 1 eKFV). Nach unserer Lesart fährst und parkst du dort keinen E-Scooter.',
            '**Nachts und im Winter:** Eine nächtliche Sperrzeit oder Winterpause nennen weder die Stadt noch Bolt (Stand 26. Oktober 2026).',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter in Halle abstellen: nur auf markierten Flächen',
      blocks: [
        'Die Verwaltung schrieb dem Stadtrat am 16. April 2026: «Ein freies Abstellen ist nicht vorgesehen. Die geeigneten Flächen sind zu beantragen und werden durch den Betreiber farblich markiert.» Beende die Fahrt also auf einer solchen Fläche. Bolts Bedingungen verlangen einen zulässigen Parkbereich, für den auch die «in der App angegebenen Parkanweisungen» gelten: «Insbesondere darf das E-Fahrzeug nicht in den in der App ausgewiesenen roten Bereichen geparkt werden.»',
        'Fürs Parken gelten bundesweit die Regeln für Fahrräder: Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO, und Falschparken auf Geh- oder Radweg kostet dann ab 55 €. Wo Leih-Scooter stehen dürfen, regelt aber die Stadt, in Halle über die markierten Flächen.',
        {
          table: {
            caption: 'Wo in Halle eigene Regeln gelten und wer sie setzt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es regelt'],
            rows: [
              ['Ganzes Stadtgebiet', 'Leih-Scooter nur auf beantragten, vom Betreiber farbig markierten Flächen; kein freies Abstellen', 'Stadt (Sondernutzungserlaubnis je Standort)'],
              ['Rote Bereiche in der App', 'Nicht abstellen', 'Bolt (Nutzungsbedingungen)'],
              ['Leipziger Strasse', 'Fussgängerzone: nur schieben, ausser ein Schild erlaubt das Fahren', 'Stadt (Beschilderung), Bund (eKFV, StVO)'],
              ['Städtische Parks und Grünanlagen', 'Nach unserer Lesart weder fahren noch abstellen', 'Stadt (Grünflächensatzung von 2005, geändert 2022; Gefahrenabwehrverordnung von 2017)'],
            ],
          },
        },
        {
          list: [
            '**Hauptbahnhof und andere Haltestellen:** An den movemix-Stationen der HAVAG gibt es laut Stadt (Februar 2025) auch Stellplätze für E-Scooter: am Hauptbahnhof 20, am S-Bahnhof Neustadt rund 20, am Steintor, in Trotha, in Büschdorf und in der Südstadt je rund 15, am Reileck 10, an der Haltestelle Heide-Universitätsklinikum rund sechs und weitere am Moritzburgring. Ob du dort eine Bolt-Fahrt beenden kannst, zeigt die App.',
            '**An der Saale:** Gefragt, wie Roller aus Gewässern ferngehalten werden, schrieb die Verwaltung im April 2023, als noch mehrere Anbieter in Halle waren: «Die Anbieter haben sogenannte Verbotszonen eingerichtet.» Darin stellten sie keine E-Scooter bereit. Eine aktuelle Liste nennt die Stadt nicht; was heute gilt, zeigt die Bolt-App.',
            '**Wenn es Ärger gibt:** Bei Verstössen fordert die Stadt den Betreiber auf, sie zeitnah zu beheben. «Erweist sich ein Standort als besonders kritisch oder gibt es vermehrt Beschwerden, besteht die Möglichkeit, die Sondernutzungserlaubnis für den Standort zu entziehen.» Beschwerden über E-Scooter zählte die Stadt 35 im Jahr 2024, 36 im Jahr 2025 und 14 bis Mitte April 2026.',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Halle: Bussgelder und Alkohol',
      blocks: [
        'In Halle gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
        'Laut Stadt wurden 2024 und 2025 im Stadtgebiet 109 Unfälle mit E-Scootern registriert. Kontrollen sind Sache der Polizei, schrieb die Verwaltung im April 2026.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Zug: HAVAG, MDV und DB',
      blocks: [
        'In Bussen und Strassenbahnen der Halleschen Verkehrs-AG (HAVAG) dürfen seit dem 1. Mai 2024 «vorerst keine E-Tretroller» mehr mitgenommen werden, auch nicht in den movemix-shuttles. Die HAVAG folgte damit einer Empfehlung des Verbands Deutscher Verkehrsunternehmen, der die Sicherheitsanforderungen an die Akkus als zu gering bemängelte. Wieder zugelassen werden sollen E-Tretroller, «sobald die Hersteller die Risiken beseitigt haben». Pedelecs, Elektrorollstühle und vierrädrige Elektromobile für mobilitätseingeschränkte Menschen dürfen weiter mit.',
        'Die Beförderungsbedingungen des Mitteldeutschen Verkehrsverbunds (MDV), gültig seit 1. August 2026, halten das fest: «In den Fahrzeugen der Leipziger Verkehrsbetriebe (LVB) GmbH und der Halleschen Verkehrs-AG (HAVAG) ist abweichend zu Teil A die Mitnahme von elektrischen Tretrollern ausgeschlossen.» Eine Ausnahme für zusammengeklappte Roller nennen weder die HAVAG noch der MDV.',
        {
          list: [
            '**S-Bahn und Regionalzug ab Halle Hbf:** In den Zügen im MDV ist die Mitnahme zusammengeklappter elektrischer Tretroller gestattet, «wenn die Voraussetzungen zur Beförderung dazu gegeben sind». Zusammengeklappt gelten sie laut MDV-Tarif als Traglast, die du kostenlos mitnimmst, solange du dein Gepäck allein tragen kannst. Einen Anspruch hast du nicht: «Das Betriebspersonal entscheidet im Einzelfall, ob Sachen zur Beförderung zugelassen werden».',
            '**IC und ICE der Deutschen Bahn:** Zusammengeklappt und sicher verstaut fährt dein eigener E-Scooter dort kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Miete in der Nähe der Haltestelle, ohne den Zugang zu versperren, und leih dir am Ziel einen neuen.',
      ],
    },
    {
      heading: 'E-Scooter rund um Halle: Merseburg und Leipzig',
      blocks: [
        '**Merseburg:** Die [Karte von Merseburg](map:de:Merseburg) zeigt dort ebenfalls Bolt; am 26. Oktober standen in Merseburg 93 Bolt-Scooter und in Leuna einer. Auch für Merseburg nennt Bolt auf seiner Website E-Scooter. Ob du eine Fahrt aus Halle dort beenden darfst, zeigt die Bolt-App.',
        '**Leipzig:** Dort verleihen Dott und Voi, und abstellen darfst du nur an markierten Stationen; mehr steht in [E-Scooter in Leipzig](guide:leipzig), die freien Scooter zeigt die [Karte von Leipzig](map:de:Leipzig). In Strassenbahnen und Bussen der LVB gilt dasselbe Mitnahmeverbot wie bei der HAVAG.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter kann ich in Halle mieten?',
      answer: 'Als Verleiher nennt die Stadt nur Bolt (Stand April 2026). Du musst mindestens 18 sein, einen Führerschein brauchst du nicht. Die ScootRadar-Karte zeigt Bolt mit Standort und Akkustand.',
    },
    {
      question: 'Was kostet ein E-Scooter in Halle?',
      answer: 'Den Preis zeigt dir die Bolt-App vor dem Entsperren; die Stadt nennt keinen Tarif. Teuer wird Falschparken: 15 € ohne klares Abstellfoto, bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs.',
    },
    {
      question: 'Wo darf ich in Halle einen Leih-Scooter abstellen?',
      answer: 'Nur auf Flächen, die der Anbieter bei der Stadt beantragt und farbig markiert hat; frei abstellen ist laut Stadt nicht vorgesehen. Stellplätze für E-Scooter gibt es auch an den movemix-Stationen der HAVAG, etwa am Hauptbahnhof. In städtischen Parks nach unserer Lesart der Grünflächensatzung und Gefahrenabwehrverordnung nicht.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Leipziger Strasse fahren?',
      answer: 'Nein, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo: Die Stadt nennt sie eine Fussgängerzone. Ab 1. März 2027 genügt auch «Radverkehr frei».',
    },
    {
      question: 'Darf ich einen E-Scooter in Strassenbahn oder Bus der HAVAG mitnehmen?',
      answer: 'Nein, seit 1. Mai 2024 nicht, auch keinen eigenen; die MDV-Bedingungen schliessen elektrische Tretroller in HAVAG-Fahrzeugen aus und nennen keine Ausnahme für zusammengeklappte. In S-Bahn und Regionalzug im MDV darf ein eigener Scooter zusammengeklappt mit, wenn das Personal ihn zulässt.',
    },
  ],
  sources: [
    { title: 'Stadt Halle (Saale): Antwort der Verwaltung zur Nutzung von E-Scootern im Stadtgebiet, VIII/2026/02552 (16. April 2026, PDF)', url: 'https://buergerinfo.halle.de/getfile.asp?id=336677&type=do' },
    { title: 'Stadt Halle (Saale): Stellungnahme der Verwaltung zu VII/2021/02613, Sondernutzungserlaubnis für E-Tretroller (18. April 2024, PDF)', url: 'https://buergerinfo.halle.de/getfile.asp?id=309174&type=do' },
    { title: 'Stadt Halle (Saale): Antwort der Verwaltung zur aktuellen E-Scooter-Situation, VII/2023/05482 (20. April 2023, PDF)', url: 'https://buergerinfo.halle.de/getfile.asp?id=285838&type=do' },
    { title: 'Stadt Halle (Saale): HAVAG, Mitnahme von E-Tretrollern ab 1. Mai 2024 untersagt (Pressemitteilung, 16. April 2024)', url: 'https://halle.de/verwaltung-stadtrat/presseportal/nachrichten/nachricht/havag-mitnahme-von-e-tretrollern-ab-1-mai-2024-in-bahnen-bussen-und-movemix-shuttles-untersagt' },
    { title: 'Stadt Halle (Saale): HAVAG eröffnet weitere Mobilitätsstation am Betriebshof Freiimfelder Strasse (Pressemitteilung, 11. Februar 2025)', url: 'https://halle.de/verwaltung-stadtrat/presseportal/nachrichten/nachricht/havag-eroeffnet-weitere-mobilitaetsstation-fuer-halle-am-betriebshof-freiimfelder-strasse' },
    { title: 'Stadt Halle (Saale): Neue HAVAG-Mobilitätsstation am Steintor (Pressemitteilung, 11. September 2024)', url: 'https://halle.de/verwaltung-stadtrat/presseportal/nachrichten/nachricht/buergermeister-eroeffnet-neue-havag-mobilitaetsstation-am-steintor-mobilitaetsfest-am-samstag' },
    { title: 'Stadt Halle (Saale): Gegen Diebstahl, Stadt, Polizei und Weisser Ring starten Kampagne (Pressemitteilung, 11. Mai 2023)', url: 'https://halle.de/verwaltung-stadtrat/presseportal/nachrichten/nachricht/gegen-diebstahl-stadt-polizei-und-weisser-ring-starten-kampagne' },
    { title: 'Stadt Halle (Saale): In der oberen Leipziger Strasse gibt es wieder eine Spieloase (Pressemitteilung, 26. März 2026)', url: 'https://halle.de/verwaltung-stadtrat/presseportal/nachrichten/nachricht/innenstadt-in-der-oberen-leipziger-strasse-gibt-es-wieder-eine-spieloase' },
    { title: 'Stadt Halle (Saale): Grünflächensatzung (Benutzungssatzung für öffentliche Anlagen, Spielplätze und Grünanlagen) vom 23. Februar 2005, Lesefassung vom 26. Oktober 2022 (PDF)', url: 'https://halle.de/fileadmin/Binaries/Verwaltung/Stadtpolitik_und_Ortsrecht/Satzungen_und_Verordnungen/GB_II_Stadtentwicklung_Umwelt/FB_Umwelt/SR_302-01_Lesefassung.pdf' },
    { title: 'Stadt Halle (Saale): Gefahrenabwehrverordnung vom 27. September 2017 (Amtsblatt Nr. 21 vom 21. November 2017, PDF)', url: 'https://halle.de/fileadmin/Binaries/Verwaltung/Stadtpolitik_und_Ortsrecht/Satzungen_und_Verordnungen/GB_OB/FB_Sicherheit/SR_301-1_Gefahrenabwehrverordnung.pdf' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung (eKFV), § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'MDV: Beförderungsbedingungen und Tarifbestimmungen, gültig ab 1. August 2026 (PDF)', url: 'https://www.mdv.de/media/file/aa3ecdcc' },
    { title: 'MDV: Anlage 2, Sonderregelungen, gültig ab 1. August 2026 (PDF)', url: 'https://www.mdv.de/media/file/f68fe637' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. August 2023 bis 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicle-old/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Bolt: Bolt in Halle', url: 'https://bolt.eu/de-de/cities/halle/' },
    { title: 'Bolt: Bolt in Merseburg', url: 'https://bolt.eu/de-de/cities/merseburg/' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'LVermGeo Sachsen-Anhalt: DVG, Digitale Verwaltungsgrenzen', url: 'https://www.lvermgeo.sachsen-anhalt.de/de/gdp-dvg-lsa.html' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Deutsche Bahn: Beförderungsbedingungen (Stand 26. Oktober 2026), A.7.1', url: 'https://www.bahn.de/agb' },
  ],
};

export default guide;
