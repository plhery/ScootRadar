import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-heilbronn',
  topic: 'heilbronn',
  name: 'E-Scooter Heilbronn: Dott, Preise, Parken',
  title: 'E-Scooter Heilbronn 2026: Dott, Preise, Stationen, Parken',
  description: 'E-Scooter Heilbronn: Dott nannte im Oktober 2026 1 € plus 0,43 € pro Minute. Wo du in der Innenstadt abstellen darfst und was in Stadtbahn und Bus gilt.',
  headline: 'E-Scooter Heilbronn: Preise, Sharingstationen und Parkverbote von der Innenstadt bis zum Neckarbogen',
  lede: 'Einen E-Scooter in Heilbronn leihst du ab 18 und ohne Führerschein bei Dott, laut Stadt derzeit dem einzigen Anbieter. Laut Datenfeed von Dott kostete eine Fahrt am 23. Oktober 2026 1 € plus 0,43 € pro Minute, zehn Minuten also 5,30 €. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nicht auf dem Gehweg. In der Innenstadt, am Hauptbahnhof und im Neckarbogen beendest du die Fahrt nur an einer der blau markierten Sharingstationen.',
  published: '2026-10-23',
  updated: '2026-10-23',
  city: 'de:Heilbronn',
  sections: [
    {
      heading: 'Welche E-Scooter gibt es in Heilbronn?',
      blocks: [
        'Laut Stadt bietet in Heilbronn derzeit nur **Dott** E-Scooter und E-Bikes an; Dott hiess früher TIER. Leih-Scooter gibt es in der Stadt seit 2020. Als 2023 strengere Auflagen der Stadt kamen, blieb laut echo24 vom 11. Juli 2023 nur einer von vier Anbietern: Lime, Zeus und Bird gingen, TIER blieb. Gemietet wird in der Dott-App, ab 18 und ohne Führerschein: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '[Auf der ScootRadar-Karte](map:de:Heilbronn) standen am Freitag, 23. Oktober 2026, um 15:18 Uhr rund 340 Dott-Scooter in Heilbronn, Neckarsulm und weiteren Nachbarorten, dazu 10 in Weinsberg. Das ist eine Momentaufnahme der freien Fahrzeuge, nicht die Grösse der Flotte. Die Karte zeigt nur E-Scooter, nicht die E-Bikes von Dott: Im offenen Datenfeed standen um 17:36 Uhr 351 Scooter und 144 E-Bikes.',
        'Auch im Datenportal des Landes, MobiData BW, stand am 23. Oktober 2026 kein Fahrzeug von Lime, Voi, Bolt oder Zeus in Heilbronn.',
        'Das Geschäftsgebiet von Dott reicht laut Datenfeed über die Stadtgrenze nach **Neckarsulm** und **Weinsberg**. Neckarsulm verlangt keine Erlaubnis; Dott hat dort eine freiwillige Selbstverpflichtung abgegeben: höchstens 75 Fahrzeuge je Anbieter, kein Abstellen in Grünanlagen und an Haltestellen. Verlässt du das Geschäftsgebiet, darf Dott den Scooter laut AGB abschalten und eine Gebühr verlangen, wenn du ihn nicht zurückbringst.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Heilbronn?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preis in Heilbronn (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott (Datenfeed, 23. Oktober 2026)', '1,00 €', '0,43 €', '5,30 €', '9,60 €'],
            ],
          },
        },
        'Für die E-Bikes von Dott nannte der Feed denselben Tarif. Auf seiner Website nennt Dott keinen Preis für Heilbronn, sondern schreibt: «In der Dott-App siehst du den Preis, der in deiner Region gilt.» Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Pässe und Abos gibt es laut AGB nur in einigen Städten, ebenfalls in der App.',
        'Heilbronn ist für Dott-Kunden teuer: Am selben Tag nannte der Feed in [Stuttgart](map:de:Stuttgart) 0,99 € plus 0,24 € pro Minute und in [Heidelberg](map:de:Heidelberg) 1 € plus 0,31 €. Eine Viertelstunde kostet in Heilbronn 7,45 €, in Stuttgart 4,59 €.',
        'Teuer wird auch falsches Abstellen: Holt Dott einen falsch abgestellten Scooter zurück, kann das laut AGB bis zu 300 € kosten; zahlt Dott ein Bussgeld für dich, kommen 50 € Bearbeitungsgebühr dazu.',
      ],
    },
    {
      heading: 'Wo darf man in Heilbronn mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen, in Fahrradstrassen und Fahrradzonen und nur, wo es keinen Radweg gibt, auf der Fahrbahn. Auf Gehwegen und in Fussgängerzonen fährst du nicht, ausser das Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo. Das ist Bundesrecht; die Stadt wiederholt es auf ihrer Seite und rät zum Helm.',
        '**Fussgängerzone:** Ein Schild, das nur Fahrräder freigibt, gilt heute nicht für E-Scooter, auch wenn die Mobilitätsbroschüre der Stadt beide in einem Satz nennt. Ab 1. März 2027 gibt auch «Radverkehr frei» die Zone für E-Scooter frei, im Schritttempo, sofern die Stadt sie dort nicht eigens ausschliesst. Ohne Freigabe steigst du ab und schiebst.',
        '**Am Neckar:** Wo der Weg am Ufer ein gemeinsamer Geh- und Radweg ist, fährst du dort, mit Rücksicht auf Fussgänger. Reine Fusswege in Parks und Grünanlagen sind tabu, und auf den Neckarbrücken und an unbefestigten Ufern endet laut Stadt keine Fahrt.',
        '**Tempo:** Dott hinterlegt für Heilbronn im Datenfeed 19 km/h. Zonen, in denen der Scooter abbremst oder nicht fährt, enthielt der Feed am 23. Oktober 2026 nicht: Die Zonen von Dott regeln in Heilbronn nur das Abstellen. Ein nächtliches Fahrverbot oder eine Winterpause nennen weder die Stadt noch Dott.',
      ],
    },
    {
      heading: 'Wo darf man E-Scooter in Heilbronn abstellen?',
      blocks: [
        'In der Innenstadt stellst du an einer **Sharingstation** ab: einer Fläche mit blauer Bodenmarkierung und Schild, meist an einer Haltestelle; die App zeigt sie ebenfalls. Im Mai 2024 richtete die Stadt 22 Stationen ein, ihre Stadtkarte zeigte am 23. Oktober 2026 schon 28. Rund um die Stationen unterbindet Dott laut Stadt im Umkreis von 100 m das Abstellen per GPS. Die Stationen legt die Stadt fest, die Sperrzonen setzt Dott in der App um.',
        {
          table: {
            caption: 'Abstellen in Heilbronn: was wo gilt (Seite und Mustervertrag der Stadt, Datenfeed von Dott, Stand 23. Oktober 2026)',
            head: ['Ort', 'Abstellen', 'Wer es regelt'],
            rows: [
              ['Innenstadt: Marktplatz, Kiliansplatz, Kaiserstrasse, Fleiner und Sülmer Strasse', 'Nur an Sharingstationen, etwa Berliner Platz/Theater, Harmonie oder Wollhaus', 'Stadt, umgesetzt von Dott'],
              ['Hauptbahnhof', 'Nur an der Station am Bahnhof', 'Stadt, Dott'],
              ['Unbefestigtes Neckarufer, Neckarbrücken, Hafen und Neckarinsel', 'Verboten', 'Stadt'],
              ['experimenta', 'Verboten: Parkverbotszone im Feed', 'Dott'],
              ['Neckarbogen, das Gelände der Bundesgartenschau 2019', 'Nur an den Stationen Bleichinselbrücke und Quartiersgarage', 'Stadt, Dott'],
              ['Bildungscampus', 'Verboten', 'Stadt, Dott'],
              ['Hochschule, Campus Sontheim', 'Verboten', 'Stadt, Dott'],
              ['Theresienwiese, Wertwiesenpark, Pfühlpark, Stadtpark', 'Verboten', 'Stadt'],
              ['Frankenstadion', 'Nur an der Station Theresienstrasse/Frankenstadion', 'Stadt, Dott'],
              ['Wohnstrassen in Böckingen, Sontheim, Horkheim und anderen Stadtteilen', 'Erlaubt, wenn niemand behindert wird', 'Bundesrecht, Dott'],
            ],
          },
        },
        'Gesperrt sind laut Stadt ausserdem Fussgängerzonen, die Bereiche vor Kitas und Schulen, private Flächen, Radwege, Kreuzungen, Parks, Wald und die Eingänge öffentlicher Gebäude. Der Mustervertrag der Stadt nennt dazu Friedhöfe, Kliniken, Spielplätze sowie Bus- und Bahnsteige. Weitere Stationen in den Stadtteilen sollen laut Stadt «mittelfristig» dazukommen.',
        {
          note: 'Massgeblich ist die Karte in der Dott-App: Sie zeigt Stationen und Sperrzonen. Lässt sie dich die Fahrt nicht beenden, fahr zur nächsten Station, denn solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Heilbronn: Bussgelder und Promille',
      blocks: [
        'In Heilbronn gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Dazu kommt laut Stadt seit September 2023: Wer wiederholt rücksichtslos oder betrunken fährt oder Scooter beschädigt, dem drohen Sanktionen bis zur Sperrung seines Kontos beim Anbieter.',
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Stadtbahn und Bus: was im HNV gilt',
      blocks: [
        'In Stadtbahn und Bus gelten die Beförderungsbedingungen des Heilbronner Verbunds HNV; auf sie verweist auch die Albtal-Verkehrs-Gesellschaft (AVG), die die Stadtbahn betreibt.',
        '**In der Stadtbahn** nimmst du laut HNV einen E-Tretroller mit wie ein Fahrrad: am Wochenende und an Feiertagen ganztägig kostenlos, montags bis freitags von 6 bis 9 Uhr nur mit einer HNV-Fahrradkarte für 2,60 €, sonst kostenlos. Er gehört in den Bereich für Fahrräder. Einen Anspruch auf Mitnahme hast du nicht, Rollstühle und Kinderwagen haben Vorrang.',
        '**Im Bus** ist die Mitnahme grundsätzlich ausgeschlossen. Zusammengeklappte kleine Roller unter 15 kg und kürzer als 115 cm nimmst du aber in Bus und Bahn kostenlos als Handgepäck mit.',
        '**Leih-Scooter:** Eine eigene Regel dafür nennen weder der HNV noch Dott. Am einfachsten beendest du die Fahrt an einer Sharingstation nahe der Haltestelle, etwa am Hauptbahnhof, und mietest am Ziel neu.',
      ],
    },
    {
      heading: 'Wie Heilbronn E-Scooter regelt: Vertrag, Obergrenze, Gebühren',
      blocks: [
        'Das Verleihen von E-Scootern auf öffentlichen Flächen behandelt Heilbronn als **Sondernutzung** nach dem Strassengesetz Baden-Württemberg und der Sondernutzungssatzung der Stadt. 2023 schrieb die Stadt die Erlaubnis für zwei Anbieter aus; seit September 2023 gelten laut Stadt strengere Auflagen. Laut Mustervertrag lief der Vertrag bis 31. August 2025 und verlängert sich um ein Jahr, wenn keine Seite drei Monate vorher kündigt. Den unterschriebenen Vertrag hat die Stadt nicht veröffentlicht, auch nicht, ob und wie lange er verlängert wurde (Stand 23. Oktober 2026); ihre Seite nennt Dott als Anbieter.',
        'Die Zahlen stammen aus dem Mustervertrag: je Anbieter höchstens 400 E-Scooter und 200 E-Bikes, innerhalb des Innenstadtrings höchstens 150 Scooter. Der Anbieter zahlt einmalig 360 € und je Jahr 12,50 € pro E-Scooter und 20 € pro E-Bike. Er stellt höchstens drei Fahrzeuge an einen Ort, lässt auf dem Gehweg 2,50 m frei und räumt falsch abgestellte Fahrzeuge fristgerecht weg, sonst kann die Stadt 15 € pro Fahrzeug verlangen.',
        {
          list: [
            '**Bund:** Verkehrsregeln und Bussgelder. Ab 1. März 2027 stellt die StVO klar, dass das gewerbliche Aufstellen von Leih-Scootern kein Parken ist; Städte dürfen es an Auflagen knüpfen, wie Heilbronn es schon tut.',
            '**Land Baden-Württemberg:** das Strassengesetz, auf dem die Erlaubnis der Stadt beruht.',
            '**Stadt Heilbronn:** Vertrag, Obergrenzen, Stationen, Sperrflächen und Schilder.',
            '**Stadt Neckarsulm:** die freiwillige Vereinbarung mit Dott.',
            '**Dott:** Preis, Sperrzonen in der App, Gebühren.',
            '**HNV:** die Mitnahme in Stadtbahn und Bus.',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Heilbronn',
      blocks: [
        {
          list: [
            '**Der Neckarbogen war eine Bahnbrache.** 2005 kaufte die Stadt das 25 Hektar grosse Areal der Deutschen Bahn ab, 2019 fand dort die Bundesgartenschau statt. Jetzt wird es ein autoarmes Quartier für bis zu 3500 Menschen, erschlossen über Radwege und Fahrradzonen.',
            '**Die Buga-Brücke heisst «Blitz».** Den Namen trägt sie wegen ihrer gezackten Linie. Die Fuss- und Radbrücke über die Gleise am Hauptbahnhof ist 190 m lang, 4,5 m breit und am höchsten Punkt 26 m hoch.',
            '**Grüne Hauptstadt Europas.** Die Europäische Kommission hat Heilbronn zur European Green Capital 2027 gekürt. Die Stadt nennt dazu neue Wege für Rad- und Fussverkehr und eine geplante urbane Seilbahn.',
            '**Deutschlands grösstes Science Center** nennt sich die experimenta. Direkt davor gilt laut Dott-Feed Parkverbot: Die letzten Meter gehst du von einer Station zu Fuss.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Heilbronn?',
      answer: 'Laut Datenfeed von Dott am 23. Oktober 2026 1 € zum Entsperren plus 0,43 € pro Minute, zehn Minuten also 5,30 €. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
    },
    {
      question: 'Welche E-Scooter-Anbieter gibt es in Heilbronn?',
      answer: 'Laut Stadt nur Dott, das früher TIER hiess. Im Landesportal MobiData BW stand am 23. Oktober 2026 kein Fahrzeug von Lime, Voi, Bolt oder Zeus in Heilbronn.',
    },
    {
      question: 'Wo darf ich in der Heilbronner Innenstadt einen E-Scooter abstellen?',
      answer: 'Nur an einer Sharingstation mit blauer Bodenmarkierung, etwa am Hauptbahnhof oder am Berliner Platz. Rund um die Stationen, in Fussgängerzonen, an unbefestigten Neckarufern und auf den Neckarbrücken lässt sich die Fahrt nicht beenden.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Fussgängerzone fahren?',
      answer: 'Nur wo das Zusatzschild «Elektrokleinstfahrzeuge frei» es erlaubt, dann im Schritttempo; ab 1. März 2027 auch bei «Radverkehr frei», sofern die Stadt E-Scooter nicht ausschliesst. Sonst steigst du ab und schiebst. Fahren ohne Freigabe kostet heute ab 15 €, ab März 2027 ab 25 €.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Stadtbahn mitnehmen?',
      answer: 'Deinen eigenen im HNV ja, wie ein Fahrrad: montags bis freitags von 6 bis 9 Uhr mit Fahrradkarte für 2,60 €, sonst kostenlos, aber ohne Anspruch auf Mitnahme. Im Bus nur zusammengeklappt, unter 15 kg und kürzer als 115 cm.',
    },
    {
      question: 'Ab welchem Alter darf man in Heilbronn E-Scooter fahren?',
      answer: 'Einen eigenen ab 14 ohne Führerschein, einen Leih-Scooter von Dott ab 18. Einen Helm schreibt das Gesetz nicht vor, die Stadt rät aber dazu.',
    },
  ],
  sources: [
    { title: 'Stadt Heilbronn: E-Scooter und E-Bikes', url: 'https://www.heilbronn.de/umwelt-mobilitaet/mobilitaet/e-scooter.html' },
    { title: 'Stadt Heilbronn: Stadtplan mit den Sharingstationen', url: 'https://karten.heilbronn.de/heilbronn/mod_mobile/index.php?lang=de&zl=37&x=515920.53436353&y=5442979.9436651&bl=stadtplan&bo=&lo=1&layers=escooter&service=heilbronn' },
    { title: 'Stadt Heilbronn: Stadtzeitung vom 29. Mai 2024, Neue Sharingstationen (PDF)', url: 'https://www.heilbronn.de/fileadmin/daten/stadtheilbronn/formulare/rathaus/aktuelles/stadtzeitung/2024/Heilbronner-Stadtzeitung-1124.pdf' },
    { title: 'Stadt Heilbronn: Mustervertrag für E-Scooter-Verleihsysteme, 2023 (PDF)', url: 'https://www.heilbronn.de/fileadmin/daten/stadtheilbronn/formulare/umwelt_mobilitaet/mobilitaet/escooter/Anlage_1_OEffentlich-rechtlicher_Vertrag.docx.pdf' },
    { title: 'Stadt Heilbronn: Auswahlverfahren 2023, Mindest- und Zuschlagskriterien (PDF)', url: 'https://www.heilbronn.de/fileadmin/daten/stadtheilbronn/formulare/umwelt_mobilitaet/mobilitaet/escooter/Anlage_3_Mindest-_und_Zuschlagskriterien.docx.pdf' },
    { title: 'Stadt Heilbronn: Mobilitätsbroschüre (April 2024, PDF)', url: 'https://heilbronn.de/fileadmin/daten/stadtheilbronn/formulare/umwelt_mobilitaet/mobilitaet/Mobilita_tsbroschu_re-DEEN-DIN_A4-20240408.pdf' },
    { title: 'Stadt Heilbronn: Stadtquartier Neckarbogen', url: 'https://www.heilbronn.de/bauen-wohnen/stadtquartier-neckarbogen.html' },
    { title: 'Stadt Heilbronn: Neckarbogen, Erschliessung und Verkehr', url: 'https://www.heilbronn.de/bauen-wohnen/stadtquartier-neckarbogen/erschliessung-und-verkehr.html' },
    { title: 'Stadt Heilbronn: Grüne Hauptstadt Europas 2027', url: 'https://www.heilbronn.de/umwelt-mobilitaet/european-green-capital-award-2027.html' },
    { title: 'Stadt Neckarsulm: E-Scooter', url: 'https://www.neckarsulm.de/e-scooter' },
    { title: 'Dott: Tarif und Zonen für Heilbronn im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/heilbronn/gbfs.json' },
    { title: 'MobiData BW: Datenfeed von Dott in Heilbronn (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/dott_heilbronn/gbfs' },
    { title: 'MobiData BW: Verzeichnis der Sharing-Datenfeeds', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'Dott: Fahr mit uns', url: 'https://ridedott.com/de/fahr-mit-uns/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'HNV: Hilfe und FAQ, Mitnahme', url: 'https://www.mein-hnv.de/service-und-kontakt/hilfe-faq/mitnahme/' },
    { title: 'HNV: Gemeinschaftstarif, gültig ab 1. Mai 2026 (PDF)', url: 'https://www.mein-hnv.de/fileadmin/pdf/tarif/gemeinschaftstarif.pdf' },
    { title: 'AVG: Beförderungsbedingungen', url: 'https://www.avg.info/unternehmen/rechtliche-hinweise/befoerderungsbedingungen.html' },
    { title: 'echo24: E-Scooter-Anbieter verlassen Heilbronn (11. Juli 2023)', url: 'https://www.echo24.de/heilbronn/scooter-anbieter-elektro-roller-fussgaenger-zone-innenstadt-stadt-verkehr-parken-miete-92394765.html' },
    { title: 'experimenta: Deutschlands grösstes Science Center', url: 'https://www.experimenta.science/' },
    { title: 'Verordnung zur Änderung der eKFV, BGBl. 2026 I Nr. 32', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Bussgeldkatalog-Verordnung (BKatV)', url: 'https://www.gesetze-im-internet.de/bkatv_2013/BJNR049800013.html' },
  ],
};

export default guide;
