import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-sindelfingen',
  topic: 'sindelfingen',
  name: 'E-Scooter Sindelfingen und Böblingen: Voi, Dott, Lime, Parken',
  title: 'E-Scooter Sindelfingen und Böblingen 2026: Voi, Dott, Lime',
  description: 'E-Scooter Sindelfingen und Böblingen: Voi kostet laut Datenfeed 0,49 € plus 0,24 € pro Minute. Wo Dott und Lime fahren und wo du nicht abstellen darfst.',
  headline: 'E-Scooter Sindelfingen und Böblingen: Preise, Sperrzonen und Abstellregeln vom Marktplatz bis zum Flugfeld',
  lede: 'Einen E-Scooter in Sindelfingen und Böblingen leihst du ab 18 und ohne Führerschein bei Voi, Dott oder Lime. Voi verlangte laut seinem Datenfeed am 28. Oktober 2026 0,49 € fürs Entsperren und 0,24 € pro Minute, zehn Minuten kosten also 2,89 €; bei Dott und Lime zeigt die App den Preis. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nie auf dem Gehweg, in Sindelfingen auch nicht durch Parks und Wald. Am Marktplatz, am Wettbachplatz und direkt am Bahnhof Sindelfingen beendest du keine Fahrt, in Böblingen nicht an Haltestellen und Bahnhofszugängen.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'de:Sindelfingen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Sindelfingen und Böblingen?',
      blocks: [
        'Die Stadt Sindelfingen nennt auf ihrer E-Scooter-Seite drei Anbieter: **Lime**, **Dott** und **Voi**. In Böblingen startete das E-Scooter-Sharing laut Stadt am 1. Februar 2022. Gemietet wird in der App des Anbieters: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Mittwoch, 28. Oktober 2026, um 23:50 Uhr zählte unsere Karte [für Sindelfingen](map:de:Sindelfingen) rund 160 Scooter von Dott und 90 von Voi, dazu rund 90 von Lime nach unserer letzten Zählung, die einige Tage alt sein kann. [Für Böblingen](map:de:Böblingen) waren es rund 110 von Voi und, ebenfalls nach letzter Zählung, 100 von Lime. Die Summen folgen der Zuordnung in den Daten der Anbieter, nicht genau den Stadtgrenzen, und sind Momentaufnahmen, keine Flottengrössen.',
        '**Dott in Böblingen:** Dott führt Böblingen in seiner Standortliste, doch unsere Karte zählt Dotts Scooter aus beiden Städten unter Sindelfingen: Die rund 160 schliessen Böblingen ein, in Böblingens Summe fehlt Dott.',
        'Die Seite der Stadt Böblingen nennt noch TIER und Bolt. TIER heisst heute Dott; in Dotts deutschen Geschäftsbedingungen (23. September 2025) ist die TIER Mobility SE Vertragspartner. Bolts Datenfeed für die Region Stuttgart zeigte am 28. Oktober 2026 in beiden Städten keinen Scooter, und **Zeus** fährt laut seinem Feed nur im nahen Renningen. Leih-Räder und Pedelecs gibt es in Böblingen laut Stadt bei RegioRadStuttgart; unsere Karte zeigt nur E-Scooter.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Sindelfingen?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Sindelfingen und Böblingen (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (Datenfeed bei MobiData BW, 28. Oktober 2026)', '0,49 €', '0,24 €', '2,89 €', '5,29 €'],
              ['Dott', 'nur in der App', 'nur in der App', '–', '–'],
              ['Lime', 'nur in der App', 'nur in der App', '–', '–'],
            ],
          },
        },
        'Das ist derselbe Tarif wie in [Stuttgart](guide:stuttgart): Vois Scooter hier gehören in seinem Feed zur Region Stuttgart. Für Dott und Lime fanden wir keinen offenen, datierten Tarif; Dott bietet auch Pässe für Tag, Woche und Monat.',
        'Die Böblinger Stadtseite nennt, ohne Datum, noch 1 € Grundgebühr und 0,19 bis 0,25 € pro Minute. Verbindlich ist, was die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'Wo darf man in Sindelfingen und Böblingen mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und in Fahrradstrassen; nur wo es keinen Radweg gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser das Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei»; dann fährst du im Schritttempo. Laut Stadt Böblingen gilt das Verbot auch mit ausgeschaltetem Motor.',
        '**Einbahnstrassen:** Öffnet das Zusatzschild «Radfahrer frei» unter dem Schild «Verbot der Einfahrt» eine Einbahnstrasse in Gegenrichtung, gilt das laut Stadt Sindelfingen auch für E-Scooter. Das Bundesrecht ist hier bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt E-Scooter mit diesem Schild einfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es eindeutig erlaubt.',
        '**Parks und Wald:** In Sindelfingen ist das Fahren in allen öffentlichen Grünanlagen und im Wald verboten, «auch dann, wenn der Weg wie ein öffentlicher Radweg aussieht», schreibt die Stadt. Das gilt am Klostersee, im Sommerhofenpark und im Stadthallenpark. Für Böblingen fanden wir eine solche Fahrregel nicht; abstellen darfst du in Parks aber auch dort nicht.',
        '**Geschäftsgebiet:** Laut Vois Feed vom 28. Oktober 2026 reicht sein Gebiet von Maichingen über beide Innenstädte und das Flugfeld bis zur Hulb. Darmsheim und Dagersheim liegen ausserhalb, bei Voi wie laut Limes App (Stand 24. Oktober 2026) bei Lime; das Krankenhaus Sindelfingen liegt nur bei Lime im Gebiet, Maichingen nur bei Voi.',
        '**Nach Stuttgart:** Vois Gebiet ist hier laut Feed vom Stuttgarter getrennt, und dazwischen lässt Voi nicht weiterfahren. Nimm die S-Bahn; die [Karte von Stuttgart](map:de:Stuttgart) zeigt die Scooter dort.',
        '**Tempo und Zeiten:** Vois Feed setzt überall die bauartbedingten 20 km/h. Ein Nachtfahrverbot oder eine Winterpause nennt keine der beiden Städte; Böblingen schreibt «rund um die Uhr», Vois Feed «24/7».',
      ],
    },
    {
      heading: 'Wo darf man E-Scooter in Sindelfingen und Böblingen abstellen?',
      blocks: [
        '**Sindelfingen:** Laut Stadt stellst du im öffentlichen Raum ab, aber nicht auf Fahrbahn oder Radweg. Auf dem Gehweg bleiben mindestens 1,60 m und die Leitstreifen für Sehbehinderte frei; zu Bushaltestellen und Fussgängerquerungen hältst du 10 m Abstand, zu Einmündungen 5 m. Verboten ist das Abstellen in Fussgängerzonen und auf Grünflächen, auch neben der Strasse, sowie auf dem Marktplatz, dem Wettbachplatz, im unmittelbaren Umfeld des Bahnhofs und auf dem Busbahnhof (ZOB) an der Mercedesstrasse.',
        '**Böblingen:** Laut Stadt stellst du ab wie ein Fahrrad, ohne jemanden zu behindern: Gehwege, Zugänge, Haltestellen und Fussgängerüberwege bleiben frei, Grünflächen, Parks, Gärten und Wälder sind tabu, und in stark besuchten Fussgängerbereichen endet keine Fahrt. Die Selbstverpflichtung von 2022 verlangte zudem 2 m freien Gehweg und schloss eigens Fussgängerzonen, Spielplätze, Friedhöfe, die Zugänge zu S-Bahn, Schönbuchbahn und Regionalbahn, die Fussgängerunterführung am Bahnhof und Fahrradständer aus.',
        {
          table: {
            caption: 'Fahrt beenden: Regeln der Städte und unsere Auswertung von Vois Datenfeed vom 28. Oktober 2026',
            head: ['Ort', 'Abstellen', 'Wer es regelt'],
            rows: [
              ['Marktplatz und Wettbachplatz, Sindelfingen', 'Verboten laut Stadt; Voi sperrt den Marktplatz selbst, nicht alle Gassen daneben', 'Stadt, umgesetzt von den Anbietern'],
              ['Bahnhof und ZOB Sindelfingen', 'Verboten laut Stadt; Voi sperrt das Umfeld weitgehend', 'Stadt, Anbieter'],
              ['Bahnhof Böblingen', 'Nicht an Haltestellen, Zugängen und in der Unterführung; Voi sperrt die Haltestelle «Böblingen Bf» weitgehend, an «Böblingen Bahnhof (Flugfeld)» ist mehr frei', 'Stadt, Anbieter'],
              ['Elbenplatz und Postplatz, Innenstadt Böblingen', 'Elbenplatz bei Voi weitgehend gesperrt, Postplatz weitgehend frei', 'Stadt (Obergrenze von 2022), Anbieter'],
              ['Flugfeld und Motorworld', 'Mit Voi meist erlaubt, am Graf-Zeppelin-Platz weitgehend gesperrt', 'Anbieter; eine Regel des Zweckverbands Flugfeld oder der Motorworld fanden wir nicht'],
              ['Mercedes-Benz-Werk, Tor 1', 'Mit Voi davor fast überall erlaubt; 10 m Abstand zur Haltestelle verlangt die Stadt', 'Anbieter, Stadt; eine Regel von Mercedes-Benz fanden wir nicht'],
            ],
          },
        },
        'Steht ein Scooter im Weg, darfst du ihn laut Stadt Böblingen ein paar Meter zur Seite stellen. Falsch abgestellte Scooter meldest du in beiden Städten dem Anbieter, mit der Nummer oder dem QR-Code am Scooter; in Böblingen sagten die Anbieter 2022 zu, sie binnen vier Stunden umzustellen.',
        {
          note: 'Massgeblich ist die Karte in der App. Lässt sie dich die Fahrt nicht beenden, such den nächsten erlaubten Platz.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Sindelfingen und Böblingen: Bussgelder und Promille',
      blocks: [
        'In beiden Städten gelten die deutschen Regeln: eigener Scooter ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Seit 1. Oktober 2026 haftet bei Unfällen der Halter auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Neue Verkehrsregeln und Bussgelder gelten erst ab 1. März 2027: mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in S-Bahn und Bus: was beim VVS gilt',
      blocks: [
        'Beide Städte gehören zum Verkehrsverbund VVS. Die S1 hält in Böblingen und am Goldberg, die S60 fährt von Böblingen über Sindelfingen und Maichingen bis Stuttgart-Schwabstrasse. Für deinen eigenen E-Scooter gilt beim VVS:',
        {
          list: [
            '**Zusammengeklappt** gilt er als «Sache» und fährt jederzeit kostenlos in S-Bahn, Zug und Bus mit.',
            '**Nicht zusammengeklappt** zählt er als Fahrrad: In S-Bahn und Regionalzug brauchst du montags bis freitags von 6 bis 9 Uhr ein Kinderticket, sonst fährt er kostenlos. Die Busse im Landkreis Böblingen nehmen Fahrräder montags bis freitags erst ab 18:30 Uhr mit, am Wochenende und an Feiertagen ganztags, höchstens zwei je Bus und nicht in Kleinbussen, Ruftaxis oder Ersatzbussen.',
          ],
        },
        '**Leih-Scooter** nennt der VVS nicht eigens; laut Verbraucherzentrale werden sie im Nahverkehr nicht mitgenommen. Am Bahnhof Sindelfingen und an den Böblinger Bahnhofszugängen darfst du nicht abstellen: Beende die Fahrt ein Stück davor und miete am Ziel neu.',
      ],
    },
    {
      heading: 'Wie Sindelfingen und Böblingen E-Scooter regeln: Selbstverpflichtung statt Sondernutzung',
      blocks: [
        'In Böblingen legte die Selbstverpflichtungserklärung, die die Stadt zum Start 2022 aufsetzte und die Anbieter unterschrieben, Geschäftsgebiet und Sperrzonen fest, dazu eine Obergrenze: höchstens 100 Scooter je Anbieter zu Beginn jedes Geschäftstags, in der Innenstadt 50, mehr nur mit Zustimmung der Stadt. Eine erste Auswertung war zum 1. Juli 2022 vorgesehen. Sie ersetzte ausdrücklich keine Sondernutzungserlaubnis, sollte hinfällig werden, sobald die Stadt eine Sondernutzungspflicht feststellt, und keine Seite konnte ein Entgelt verlangen. Die Stadt verlinkt sie noch; eine neuere Fassung fanden wir nicht.',
        'In Sindelfingen verpflichteten sich die Anbieter laut Stadt selbst, für ordentliches Abstellen zu sorgen; den Text, eine Sondernutzungserlaubnis, Gebühr oder Höchstzahl fanden wir nicht.',
        {
          list: [
            '**Bund:** Verkehrsregeln und Bussgelder. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Städte können es dann als Sondernutzung genehmigen.',
            '**Städte:** Sindelfingen sperrt Parks und Wald und regelt das Abstellen; Böblingen regelt das Abstellen und legte 2022 Geschäftsgebiet, Sperrzonen und Höchstzahlen fest.',
            '**Voi, Dott und Lime:** Preise, Geschäftsgebiet und Sperrzonen in der App.',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Sindelfingen und Böblingen',
      blocks: [
        {
          list: [
            '**Mit Ökostrom geladen.** In der Böblinger Selbstverpflichtung von 2022 sagten die Anbieter zu, ihre Scooter mit zertifiziertem Ökostrom zu laden.',
            '**Dampfbahn statt Scooter.** Durch den Sommerhofenpark, angelegt zur Landesgartenschau 1990, fährt laut Stadt von April bis Oktober fast jeden Sonn- und Feiertag eine Dampfbahn; E-Scooter dürfen dort nicht fahren.',
            '**Ein Tunnel mit eigener Regel.** Die Böblinger Selbstverpflichtung von 2022 nennt eigens die Fussgängerunterführung am Bahnhof: Dort sollte kein Scooter stehen.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Sindelfingen?',
      answer: 'Bei Voi laut Datenfeed im Landesportal MobiData BW (28. Oktober 2026) 0,49 € fürs Entsperren und 0,24 € pro Minute, zehn Minuten also 2,89 €, wie in Stuttgart. Bei Dott und Lime zeigt die App den Preis vor dem Entsperren.',
    },
    {
      question: 'Welche E-Scooter-Anbieter gibt es in Sindelfingen und Böblingen?',
      answer: 'Voi, Dott und Lime, alle drei auf der Karte, Dott für beide Städte unter Sindelfingen. Die Böblinger Stadtseite nennt noch TIER, heute Dott, und Bolt, dessen Feed am 28. Oktober 2026 in beiden Städten keinen Scooter zeigte.',
    },
    {
      question: 'Darf ich mit dem E-Scooter am Klostersee fahren?',
      answer: 'Nicht im Park: Sindelfingen verbietet E-Scooter in allen öffentlichen Grünanlagen und im Wald, auch auf Wegen, die wie Radwege aussehen. Abstellen darfst du dort ebenfalls nicht.',
    },
    {
      question: 'Wo darf ich in Sindelfingen einen E-Scooter abstellen?',
      answer: 'Am Gehwegrand, wenn 1,60 m frei bleiben und du 10 m Abstand zu Bushaltestellen und Fussgängerquerungen hältst. Nicht auf Marktplatz und Wettbachplatz, nicht direkt am Bahnhof, nicht auf dem ZOB und nicht auf Grünflächen. Die App zeigt die Sperrzonen.',
    },
    {
      question: 'Darf ich einen E-Scooter in der S-Bahn mitnehmen?',
      answer: 'Einen eigenen zusammengeklappt jederzeit kostenlos; beim VVS gilt er dann als «Sache». Nicht geklappt zählt er als Fahrrad und darf in die Busse im Landkreis Böblingen werktags erst ab 18:30 Uhr. Leih-Scooter werden laut Verbraucherzentrale nicht mitgenommen.',
    },
    {
      question: 'Gibt es in Sindelfingen oder Böblingen ein Nachtfahrverbot für E-Scooter?',
      answer: 'Nein. Keine der beiden Städte nennt ein Nachtfahrverbot oder eine Winterpause; Vois Feed gibt «24/7» an (Stand 28. Oktober 2026).',
    },
  ],
  sources: [
    { title: 'Stadt Sindelfingen: E-Scooter', url: 'https://www.sindelfingen.de/verkehr-mobilitaet/fahrzeuge-teilen/e-scooter' },
    { title: 'Stadt Sindelfingen: Parks', url: 'https://www.sindelfingen.de/kultur-freizeit/naherholung/gruenanlagen/parks' },
    { title: 'Stadt Böblingen: Fuss und Rad, mit Fragen und Antworten zu E-Scootern', url: 'https://www.boeblingen.de/mobilitaet--klima/mobilitaet--verkehr/fuss--rad' },
    { title: 'Stadt Böblingen: Selbstverpflichtungserklärung der Anbieter mit Anlagen (PDF)', url: 'https://www.boeblingen.de/site/Boeblingen-Internet/get/params_E-497274273/25086993/Selbstverpflichtungserkl%C3%A4rung%20Stadt%20B%C3%B6blingen%20mit%20Anlagen.pdf' },
    { title: 'MobiData BW: Tarife von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_pricing_plans' },
    { title: 'MobiData BW: Zonen von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/geofencing_zones' },
    { title: 'MobiData BW: Systeminformation von Voi (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/system_information' },
    { title: 'MobiData BW: Fahrzeuge von Bolt in der Region Stuttgart (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_stuttgart/vehicle_status' },
    { title: 'MobiData BW: Verzeichnis der Sharing-Datenfeeds', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Fahr mit uns', url: 'https://ridedott.com/de/fahr-mit-uns/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'VVS: Fahrradmitnahme', url: 'https://www.vvs.de/fahrradmitnahme' },
    { title: 'Verbraucherzentrale: Regeln für E-Scooter (15. April 2026)', url: 'https://www.verbraucherzentrale.de/wissen/energie/emobilitaet/escooter-diese-regeln-gelten-fuer-elektrotretroller-35716' },
    { title: 'Verordnung zur Änderung der eKFV, BGBl. 2026 I Nr. 32', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Bussgeldkatalog-Verordnung (BKatV)', url: 'https://www.gesetze-im-internet.de/bkatv_2013/BJNR049800013.html' },
    { title: 'Strassenverkehrsgesetz § 8: Halterhaftung seit 1. Oktober 2026', url: 'https://www.gesetze-im-internet.de/stvg/__8.html' },
    { title: 'StVO Anlage 2: Vorschriftzeichen und Zusatzzeichen', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'eKFV § 12: Verkehrsverbote und Zusatzzeichen', url: 'https://www.gesetze-im-internet.de/ekfv/__12.html' },
  ],
};

export default guide;
