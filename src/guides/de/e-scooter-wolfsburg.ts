import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wolfsburg',
  topic: 'wolfsburg',
  name: 'E-Scooter Wolfsburg: Anbieter, Parken, Regeln',
  title: 'E-Scooter Wolfsburg 2026: Anbieter, Parken, Autostadt',
  description: 'E-Scooter Wolfsburg: Dott und Bolt, wo du fährst und parkst, die mobiSTATIONEN, was in Autostadt und Allerpark gilt und wann der Scooter in den Bus darf.',
  headline: 'E-Scooter Wolfsburg: Anbieter, Parken und was in Autostadt und Allerpark gilt',
  lede: 'E-Scooter in Wolfsburg leihst du bei Dott oder Bolt; beide nennt die Stadt an ihren mobiSTATIONEN (Stand August 2026). Einen Führerschein brauchst du nicht; Mindestalter und Preis zeigt dir die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone der Porschestrasse, in Grünanlagen laut Stadt nur auf ausgewiesenen Radwegen. Dein eigener Scooter fährt zusammengeklappt kostenlos im Bus mit, ein Leih-Scooter nicht.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Wolfsburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Wolfsburg?',
      blocks: [
        'In Wolfsburg fahren **Dott** und **Bolt**. «Die e-Scooter-Dienste von Bolt und Dott findest du im markierten Parkbereich», schreibt die Stadt auf ihrer Seite zu den mobiSTATIONEN (neueste Meldung dort vom 17. August 2026). Mindestalter und Preis zeigt dir die App vor dem Entsperren. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '**TIER** ist mit Dott fusioniert: Laut regionalHeute vom 1. Oktober 2024 sollten alle TIER-Scooter in den folgenden Wochen das Dott-Logo bekommen.',
        'Am Sonntag, 25. Oktober 2026, standen rund um Wolfsburg kurz vor 9 Uhr rund 600 Dott-Scooter und kurz vor 14 Uhr rund 430 von Bolt, die zu diesem Zeitpunkt frei waren. Wo gerade einer steht, siehst du auf der [Karte von Wolfsburg](map:de:Wolfsburg).',
        'Der Betrieb eines Verleihs ist laut Stadt «grundsätzlich» nicht genehmigungspflichtig. Geschäftsgebiet und Parkverbotszonen legen die Anbieter laut Stadt mit ihr fest. Dazu hat die Stadt eine freiwillige Selbstverpflichtung für die Anbieter formuliert (Vorlage von 2020): Eine Erhöhung der Flotte «bedarf der Absprache mit der Stadt Wolfsburg», und falsch abgestellte Scooter soll der Anbieter binnen 24 Stunden umstellen oder entfernen. Diese Pflichten treffen die Anbieter, nicht dich.',
      ],
    },
    {
      heading: 'Wo darf man in Wolfsburg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, Radfahr- und Schutzstreifen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; ab 1. März 2027 reicht auch «Radverkehr frei», dann im Schritttempo. Diese Regeln setzt der Bund.',
        '**Parks:** Die Verordnung über die öffentliche Sicherheit der Stadt (seit 25. Januar 2019) verbietet, öffentliche Anlagen «mit Kraftfahrzeugen aller Art» zu befahren, «es sei denn, die Wege sind dazu durch eine entsprechende Beschilderung freigegeben», und dort Kraftfahrzeuge ausserhalb ausgewiesener Flächen abzustellen (§ 3 Abs. 2 Nr. 1 und 2), bei bis zu 5000 € Bussgeld. E-Scooter sind laut eKFV Kraftfahrzeuge, also gilt das nach unserer Lesart auch für sie. Die E-Mobilitäts-Seite der Stadt sagt es so: In Grünanlagen wird nicht gefahren und nicht geparkt, «ausgenommen ausgewiesene Radwege».',
        '**Allerpark:** Hier gilt zusätzlich eine eigene Ordnung, vom Rat am 17. Juni 2026 beschlossen und im Amtsblatt vom 26. Juni 2026 bekannt gemacht; sie gilt seit dem Tag danach und ersetzt die von 2009. Ihr § 4 Abs. 3: «Rennräder, E-Roller und andere Fortbewegungsmittel mit hoher Geschwindigkeit dürfen im Allerpark nur unter Berücksichtigung der Sicherheit aller Besucher benutzt werden.» Dass «E-Roller» auch E-Scooter meint, ist unsere Lesart.',
        {
          table: {
            caption: 'Wo in Wolfsburg was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzone Porschestrasse', 'Absteigen und schieben, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt das Fahren; ab 1. März 2027 auch «Radverkehr frei»', 'Bund'],
              ['Parks, Grünanlagen, Ufer, Strassenbegleitgrün', 'Fahren nur auf freigegebenen Radwegen, nicht abstellen; bis 5000 €', 'Stadt: Verordnung über die öffentliche Sicherheit und E-Mobilitäts-Seite'],
              ['Allerpark mit Allersee', 'Dazu: E-Roller nur «unter Berücksichtigung der Sicherheit aller Besucher»; die StVO gilt, Rettungszufahrten bleiben frei', 'Stadt: Allerparkordnung von 2026'],
              ['Spiel- und Bolzplätze, öffentlich zugängliche Schulhöfe', 'Weder fahren noch abstellen', 'Stadt: Verordnung über die öffentliche Sicherheit, § 7'],
              ['Autostadt: Parkgelände, Stadtbrücke, Promenade', 'Fahren verboten; auf Promenade und Stadtbrücke «schiebend zu führen», in den Parkbereich nicht einmal mitnehmen', 'Autostadt: Hausordnung, Stand Februar 2026'],
              ['Durchfahrtsverbotszonen', 'Die Stadt kann sie festlegen, die Anbieter sollen dort den Motor abschalten oder drosseln', 'Stadt, Vorlage der Selbstverpflichtung (für die Anbieter)'],
            ],
          },
        },
        '**Winter:** Bei Glätte, Schnee oder Sturm darf ein Anbieter laut Vorlage der Selbstverpflichtung den Verleih ohne Absprache mit der Stadt einstellen.',
      ],
    },
    {
      heading: 'E-Scooter in Wolfsburg abstellen: Regeln und mobiSTATIONEN',
      blocks: [
        'Du stellst den Scooter so ab, dass er niemanden behindert oder gefährdet und nicht umkippt; am Gehwegrand sollen laut Stadt mindestens 1,60 m frei bleiben. Freihalten musst du laut Stadt ausserdem:',
        {
          list: [
            'Grünanlagen, Spielplätze, Schulhöfe und Fahrradbügel;',
            'Zugänge und Aufzüge von Haltestellen;',
            'abgesenkte Bordsteine, Rollstuhlrampen und Leitsysteme für Blinde;',
            'Überwege, Mittelinseln, Aufstellflächen an Ampeln und Zufahrten, vor allem für Feuerwehr und Rettungsdienst.',
          ],
        },
        'Grünanlagen, Spielplätze und Schulhöfe sperrt auch die Verordnung über die öffentliche Sicherheit.',
        'An den vier **mobiSTATIONEN** der Stadt gibt es markierte Parkbereiche für Bolt und Dott: am Brandenburger Platz, in Vorsfelde an der Langen Strasse (Haltestelle Obere Tor), in Westhagen am Dresdener Ring (Haltestelle Jenaer Strasse) und am Bahnhof Fallersleben. In Fallersleben (seit August 2026) gibt es auch auf der Südseite des Bahnhofs eine Abstellfläche.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Parkverbotszone oder ausserhalb des Gebiets. Fahr ein Stück weiter oder zur nächsten mobiSTATION; solange die Fahrt läuft, zahlst du. Verlangt die App ein Foto, mach es deutlich.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Wolfsburg: Bussgelder und Alkohol',
      blocks: [
        'In Wolfsburg gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Nebeneinander gefahren', '15 €, bis 30 €', 'erlaubt, wenn niemand behindert wird'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot 100 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 €', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto. Wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall; der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0 Promille.',
        'Ab 1. März 2027 gilt: Stellt ein Anbieter seine Leih-Scooter auf, ist das kein Parken; stellst du einen nach der Fahrt ab, schon. Alles Weitere steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Zug: WVG, VRB und Bahn',
      blocks: [
        'In den WVG-Bussen gelten die Beförderungsbedingungen des Verkehrsverbunds Region Braunschweig (VRB, Stand 1. Juli 2026), wie im ganzen Verbundgebiet.',
        {
          list: [
            '**Zusammengeklappt:** Dein eigener E-Scooter fährt kostenlos mit, wenn er Sicherheit und Ordnung nicht gefährdet. Einen Anspruch hast du nicht; im Einzelfall entscheidet das Fahrpersonal.',
            '**Nicht klappbar oder nicht geklappt:** Dann gilt er wie ein Fahrrad und braucht eine Fahrradtageskarte, 3,20 € im ganzen VRB (Preis seit 1. Januar 2026). Fahrgäste, Kinderwagen und Rollstühle haben Vorrang.',
            '**Akku:** Er bleibt fest montiert; laden darfst du ihn nicht, einen Ersatzakku nicht mitnehmen.',
          ],
        },
        '**Leih-Scooter** lassen sich nicht zusammenklappen und dürfen deshalb laut Stadt nicht in den Bus. Beende die Fahrt vor der Haltestelle und halte die Zugänge frei.',
        '**ICE und IC ab Wolfsburg Hauptbahnhof:** Laut Deutscher Bahn fährt dein eigener E-Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit. Nicht zusammengeklappt gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst. Den Akku darfst du nicht herausnehmen, laden oder als Powerbank nutzen.',
        '**Weiter nach Hannover:** Dort nimmt die ÜSTRA E-Tretroller seit 1. April 2024 in Stadtbahn und Bus nicht mehr mit, auch zusammengeklappt; mehr im Guide für [Hannover](guide:hanover).',
      ],
    },
    {
      heading: 'Hauptbahnhof, Autostadt, Arena und Gifhorn',
      blocks: [
        '**Hauptbahnhof und phaeno:** Das phaeno liegt «direkt neben dem Hauptbahnhof»; zur Autostadt führt die Stadtbrücke, auf der du laut Hausordnung schiebst.',
        '**Volkswagen Arena:** Laut Vorlage der Selbstverpflichtung kann die Stadt bei Grossveranstaltungen wie Fussballspielen zeitweise Regeln fürs Abstellen und Fahren festlegen. Nach Heimspielen fahren laut WVG Sonderbusse ab der Haltestelle PlazaBrücke in die Stadtteile.',
        '**Gifhorn:** Am Sonntagmorgen, 25. Oktober 2026, standen dort rund 85 Scooter, die zu diesem Zeitpunkt frei waren; wo gerade einer steht, zeigt die [Karte von Gifhorn](map:de:Gifhorn).',
        '**Drei Anbieter in 15 Monaten:** Nach TIER (März 2020) und Lime (November 2020) sollte Bolt am 1. Juni 2021 mit bis zu 300 Scootern folgen; die Stadt zählte damals rund 1000 Ausleihen am Tag (regionalHeute, 28. Mai 2021).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Wolfsburg?',
      answer: 'Dott und Bolt; beide nennt die Stadt an ihren mobiSTATIONEN (August 2026). Wo gerade ein freier Scooter steht, zeigt die [Karte von Wolfsburg](map:de:Wolfsburg).',
    },
    {
      question: 'Darf ich mit dem E-Scooter in die Autostadt?',
      answer: 'Fahren darfst du dort nicht: Auf Promenade und Stadtbrücke schiebst du, in den Parkbereich darfst du ihn laut Hausordnung (Stand Februar 2026) nicht einmal mitnehmen. Aufbewahren kannst du ihn in Schliessfach oder Garderobe im Untergeschoss der Piazza oder am Fahrradständer.',
    },
    {
      question: 'Darf ich im Allerpark E-Scooter fahren?',
      answer: 'Nach unserer Lesart ja, auf freigegebenen Radwegen und mit Rücksicht: Laut Allerparkordnung von 2026 dürfen E-Roller dort «nur unter Berücksichtigung der Sicherheit aller Besucher» benutzt werden. Abstellen auf Grünflächen ist tabu.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus mitnehmen?',
      answer: 'Deinen eigenen ja: zusammengeklappt kostenlos, sonst mit Fahrradtageskarte für 3,20 €, wenn das Fahrpersonal zustimmt. Leih-Scooter lassen sich nicht klappen und dürfen laut Stadt nicht mit.',
    },
  ],
  sources: [
    { title: 'Stadt Wolfsburg: Elektromobilität in Wolfsburg', url: 'https://www.wolfsburg.de/mobilitaetverkehr/e-mobilitaet' },
    { title: 'Stadt Wolfsburg: Freiwillige Selbstverpflichtung E-Tretroller (PDF)', url: 'https://www.wolfsburg.de/-/media/wolfsburg/statistik_daten_fakten/mobilitaet/20200206-an-wolfsburg-freiwillige-selbstverpflichtung-etretroller.pdf' },
    { title: 'Stadt Wolfsburg: mobiSTATIONEN', url: 'https://www.wolfsburg.de/mobistation' },
    { title: 'Stadt Wolfsburg: Verordnung über die öffentliche Sicherheit (PDF)', url: 'https://www.wolfsburg.de/-/media/wolfsburg/statistik_daten_fakten/satzungen_verordnungen/recht_sicherheit_ordnung/30_verordnung-oeffentliche-sicherheit.pdf' },
    { title: 'Stadt Wolfsburg: Amtsblatt Nr. 25 vom 26. Juni 2026 mit der Allerparkordnung (PDF)', url: 'https://www.wolfsburg.de/-/media/wolfsburg/statistik_daten_fakten/amtsblatt/2026/amtsblatt_25_2026.pdf' },
    { title: 'Stadt Wolfsburg: Porschestrasse', url: 'https://www.wolfsburg.de/wirtschaft/leben-und-einkaufen/porschestrasse' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung, § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'Autostadt: Hausordnung', url: 'https://www.autostadt.de/footer/rechtliches/hausordnung' },
    { title: 'VRB: Beförderungsbedingungen, Stand 1. Juli 2026 (PDF)', url: 'https://www.vrb-online.de/files/media/tickets/tarifbestimmungen-befoerderungsbedingungen/vrb-befoerderungsbedingungen.pdf' },
    { title: 'VRB: Fahrradtageskarte', url: 'https://www.vrb-online.de/de/tickets/ticketuebersicht/details/fahrradtageskarte' },
    { title: 'VRB: Rad, E-Roller und Co.', url: 'https://www.vrb-online.de/de/service/rad-e-roller-co' },
    { title: 'WVG: Fahrpläne VfL Wolfsburg', url: 'https://www.wvg.de/netz-plaene/fahrplaene-vfl-wolfsburg' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'phaeno: Anreise und Parken', url: 'https://www.phaeno.de/anreise-parken/' },
    { title: 'regionalHeute: Wolfsburg weitet Angebot für Elektro-Tretroller aus (28. Mai 2021)', url: 'https://regionalheute.de/wolfsburg/wolfsburg-weitet-angebot-fuer-elektro-tretroller-aus-wolfsburg-1622193562/' },
    { title: 'regionalHeute: Keine TIER-Scooter mehr (1. Oktober 2024)', url: 'https://regionalheute.de/das-koennte-das-stadtbild-veraendern-keine-e-scooter-der-marke-tier-mehr-braunschweig-gifhorn-goslar-harz-helmstedt-peine-salzgitter-wolfenbuettel-wolfsburg-1727811096/' },
  ],
};

export default guide;
