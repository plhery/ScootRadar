import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-potsdam',
  topic: 'potsdam',
  name: 'E-Scooter Potsdam: Anbieter, Preise, Parken',
  title: 'E-Scooter Potsdam 2026: Preise, Parken, Sanssouci, Berlin',
  description: 'E-Scooter Potsdam: was Dott pro Minute kostet, wo du abstellen darfst, warum Sanssouci tabu ist und ob deine Fahrt in Berlin enden kann.',
  headline: 'E-Scooter Potsdam: Preise, Stationen, Verbot in den Schlossparks und was zwischen Potsdam und Berlin gilt',
  lede: 'Einen E-Scooter in Potsdam leihst du ab 18 und ohne Führerschein bei Dott, früher TIER, bei Voi oder bei Bolt; Preise veröffentlicht nur Dott: 1 € fürs Entsperren und 0,29 € pro Minute, zehn Minuten kosten also 3,90 € (Datenfeed von Dott, 23. Oktober 2026). Beenden kannst du eine Dott-Fahrt nur in der Kernstadt, von Potsdam West und dem Bornstedter Feld bis Babelsberg, und rund um die Jelbi-Stationen der Innenstadt nur an der Station. Du fährst auf Radweg oder Fahrbahn, nie auf dem Gehweg, und in den Schlossparks gar nicht: In Sanssouci, im Neuen Garten und im Park Babelsberg darfst du einen E-Scooter nicht einmal schieben. Dotts Potsdamer Gebiet endet am Griebnitzsee, in Berlin kannst du die Fahrt also nicht beenden. In Tram, Bus und Fähre der ViP darf kein E-Scooter mit.',
  published: '2026-10-23',
  updated: '2026-10-25',
  city: 'de:Potsdam',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Potsdam?',
      blocks: [
        'Unsere [Karte von Potsdam](map:de:Potsdam) zeigt **Dott**, das früher TIER hiess, seit dem 24. Oktober 2026 auch **Voi** und seit dem 25. Oktober Bolt: An jenem Samstag kurz vor 16 Uhr standen dort rund 330 Dott- und 670 Voi-Scooter, am Sonntag kurz vor 14 Uhr rund 560 von Bolt. Das sind Momentaufnahmen, keine Flottengrössen.',
        '**Bolt** nennt auf seiner Potsdamer Seite E-Scooter als verfügbares Angebot; was sie kosten, zeigt nur die Bolt-App.',
        '**Voi** kündigte laut den Potsdamer Neuesten Nachrichten im Februar 2025 an, ab 1. März 2025 mit mehreren hundert Scootern nach Potsdam zurückzukehren; seine Scooter zeigt heute unsere Karte, seinen Preis nur die Voi-App. Eine aktuelle Liste der Anbieter haben wir weder bei der Stadt noch bei der ViP gefunden.',
        '**Jelbi**, die Mobilitäts-App der Berliner BVG, betreibt die Potsdamer Stationen zusammen mit der Stadt und dem Verkehrsbetrieb ViP. Es ist dieselbe App wie in Berlin: Laut Jelbi buchst du darin E-Scooter von Bolt, Voi, Lime und Dott (Stand Oktober 2026). Welche davon in Potsdam fahren, sagt Jelbi nicht. Wie das Mieten Schritt für Schritt geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Potsdam?',
      blocks: [
        'Einen Potsdamer Tarif veröffentlicht nur Dott, in seinem offenen Datenfeed: Das Entsperren kostet mehr als in Berlin, die Minute gleich viel.',
        {
          table: {
            caption: 'E-Scooter-Preise in Potsdam (Datenfeed von Dott, 23. Oktober 2026)',
            head: ['Anbieter und Ort', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott in Potsdam', '1,00 €', '0,29 €', '3,90 €', '6,80 €'],
              ['Dott in Berlin, zum Vergleich', '0,75 €', '0,29 €', '3,65 €', '6,55 €'],
              ['Bolt, Voi', 'In der App', 'In der App', 'In der App', 'In der App'],
            ],
          },
        },
        'Pässe, etwa den Minuten-Pass, bietet Dott laut eigener Website nicht in jeder Stadt an; ob es sie in Potsdam gibt und was sie kosten, zeigt nur die Dott-App. Ein Pass gilt nur in der App, in der du ihn gekauft hast, also nicht in Jelbi. Verbindlich ist der Preis, den die App vor dem Entsperren nennt.',
      ],
    },
    {
      heading: 'E-Scooter in Potsdam abstellen: Stationen und Verbotszonen',
      blocks: [
        'Wo Leih-Scooter stehen dürfen, regeln die Stadt und der Anbieter. Schon in Betrieb sind die Jelbi-Punkte in der Dortustrasse, seit März 2024 als Pilot, und seit dem 3. September 2026 die Mobilitätsstation Bassinplatz/Charlottenstrasse mit Platz für 20 E-Scooter, E-Bikes und Leihräder von PotsdamRad. Geplant ist laut Stadt (September 2026), bis Ende 2026 weitere 39 Standorte in Babelsberg und am Hauptbahnhof einzurichten und die Innenstadt ganz auf Stationen umzustellen.',
        'Rund um jede Station liegt laut Stadt eine Abstellverbotszone: Dort beendest du die Fahrt nur an der Station. Im Datenfeed von Dott reichen diese Zonen am 23. Oktober 2026 meist 50 bis 100 m weit. Neue Regeln fürs Anbieten und Abstellen von E-Scootern erarbeitet die Verwaltung noch; ob es überall feste Stationen gibt oder in dünner besiedelten Vierteln weiter freies Abstellen, ist offen. Eine Obergrenze für Leih-Scooter hat die Stadt nicht veröffentlicht. Lizenzgebühren für E-Scooter sollen laut der Haushaltseinigung vom März 2026 eingeführt werden; eine Gebührenregel hat die Stadt bisher nicht veröffentlicht.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung des Datenfeeds von Dott, 23. Oktober 2026)',
            head: ['Ort', 'Was bei Dott gilt'],
            rows: [
              ['Brandenburger Strasse vom Brandenburger Tor bis zur Friedrich-Ebert-Strasse, Dortustrasse nördlich der Charlottenstrasse', 'Nur an den Jelbi-Punkten rund um die Dortustrasse'],
              ['Charlottenstrasse am Bassinplatz', 'Nur an der Mobilitätsstation Bassinplatz/Charlottenstrasse'],
              ['Volkspark', 'Nur an der Station am Eingang Esplanade, im Park kein Abstellen'],
              ['Alter Markt mit Landtag, Lustgarten', 'Kein Abstellen'],
              ['Filmpark Babelsberg', 'Kein Abstellen'],
              ['Hauptbahnhof, Holländisches Viertel, Luisenplatz, Brandenburger Tor, Schiffbauergasse', 'Abstellen erlaubt'],
              ['Bahnhöfe Babelsberg, Griebnitzsee und Charlottenhof, Campus Griebnitzsee, Fachhochschule', 'Abstellen erlaubt'],
              ['Sanssouci, Neuer Garten, Park Babelsberg, Pfingstberg', 'Ausserhalb des Gebiets, kein Fahrtende'],
              ['Campus Am Neuen Palais, Golm, Stern, Drewitz, Kirchsteigfeld, Bornim, Fahrland', 'Ausserhalb des Gebiets, kein Fahrtende'],
            ],
          },
        },
        'Zonen ändern sich oft, massgeblich ist die Karte in deiner App. Wo du frei abstellen darfst, gelten laut Stadt die Regeln für Fahrräder: Der Scooter darf auf dem Gehweg oder in der Fussgängerzone stehen, wenn er niemanden behindert oder gefährdet und keinen Rettungsweg versperrt.',
      ],
    },
    {
      heading: 'Sanssouci, Neuer Garten, Babelsberg: Schlossparks ohne E-Scooter',
      blocks: [
        'Die Schlossparks gehören der Stiftung Preussische Schlösser und Gärten (SPSG), und die setzt dort eigene Regeln. Ihre Stiftungsanlagenverordnung von 2006, gestützt auf das brandenburgische Denkmalschutzgesetz, untersagt in den Parks Sanssouci, Neuer Garten, Pfingstberg, Babelsberg, Lindstedt und Sacrow, «mit Kraftfahrzeugen … oder Fahrrädern zu fahren oder diese mitzuführen oder abzustellen». Ein E-Scooter ist rechtlich ein Kraftfahrzeug.',
        'Für Fahrräder macht die SPSG Ausnahmen auf einzelnen Wegen, etwa dem Ökonomieweg in Sanssouci, im Schritttempo bis 7 km/h und zu festen Tageszeiten. Für E-Scooter gilt keine davon: Du darfst einen E-Scooter in den Parks weder fahren noch schieben. Ein Verstoss kann laut Verordnung bis zu 10 000 € kosten.',
        {
          note: 'Beende die Fahrt vor dem Parktor, etwa am Luisenplatz oder am Brandenburger Tor, ein paar hundert Meter vom Eingang Grünes Gitter, und geh zu Fuss weiter. Dotts Gebiet spart die Parks ohnehin aus.',
        },
        'Auch im Wald ist der Scooter fehl am Platz: Das brandenburgische Waldgesetz verbietet, im Wald mit Kraftfahrzeugen zu fahren oder sie abzustellen. Öffentliche Strassen sind davon nicht betroffen.',
      ],
    },
    {
      heading: 'Wo darf man in Potsdam mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Dott begrenzt seine Scooter im ganzen Potsdamer Gebiet auf 19 km/h.',
        '**Brandenburger Strasse:** Sie ist vom Brandenburger Tor bis Am Bassin Fussgängerzone, der Abschnitt östlich der Friedrich-Ebert-Strasse seit März 2026. Fahrräder dürfen dort laut Stadt nur von 20 bis 10 Uhr fahren, E-Scooter heute gar nicht: Du steigst ab und schiebst. Ab dem 1. März 2027 gilt eine Freigabe für Fahrräder grundsätzlich auch für E-Scooter, im Schritttempo, sofern die Stadt sie nicht eigens ausschliesst. Ob Potsdam das tut, ist offen (Stand Oktober 2026); achte auf die Schilder.',
        '**Universität:** Der Campus Griebnitzsee liegt in Dotts Gebiet, die Campus Am Neuen Palais und Golm nicht. Nach Golm fährst du besser Bus oder Bahn.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Potsdam: wer was regelt, Bussgelder',
      blocks: [
        'Wer in Potsdam was für E-Scooter regelt:',
        {
          list: [
            '**Bund:** alle Verkehrsregeln und Bussgelder. Ab 14 ohne Führerschein, keine Helmpflicht, höchstens 20 km/h, nur eine Person pro Scooter.',
            '**Brandenburg:** kein eigenes Gesetz für E-Scooter-Verleih, aber das Fahrverbot im Wald.',
            '**Stadt Potsdam:** Fussgängerzonen und ihre Freigaben, Stationen, Abstellen auf öffentlichem Grund und die geplanten Lizenzgebühren.',
            '**SPSG:** das Verbot in den Schlossparks. **ViP:** das Mitnahmeverbot in Tram, Bus und Fähre.',
            '**Anbieter:** Leih-Scooter erst ab 18; bei Dott ausserdem sein Gebiet, die Verbotszonen und die 19 km/h.',
          ],
        },
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3. Unter 21 oder in der Probezeit gilt 0,0. Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Tram, Bus, Fähre und S-Bahn: E-Scooter im Nahverkehr',
      blocks: [
        'In Strassenbahnen, Bussen und auf der Fähre der ViP sind E-Tretroller wegen der Brand- und Explosionsgefahr ihrer Akkus ausgeschlossen, auch dein eigener. Die ViP folgt damit einer Empfehlung des Branchenverbands VDV. Im Bus erlaubt bleiben vierrädrige Elektromobile mit Piktogramm, für Menschen mit Merkzeichen G.',
        'In S-Bahn und Regionalzug im Verkehrsverbund Berlin-Brandenburg darfst du einen eigenen E-Scooter zusammengeklappt mitnehmen. Mit dem Leih-Scooter heisst das: Fahrt vor dem Bahnhof beenden, mit Bahn oder Tram weiter und am Ziel neu mieten.',
      ],
    },
    {
      heading: 'Von Berlin nach Potsdam: Tipps für Tagesgäste',
      blocks: [
        '**Keine Fahrt über die Stadtgrenze:** Dotts Potsdamer Gebiet endet im Osten am Bahnhof Griebnitzsee, sein Berliner Gebiet beginnt erst gut 11 km weiter in Zehlendorf (Datenfeeds von Dott, 23. Oktober 2026). Wannsee, die Glienicker Brücke und Kleinmachnow liegen in keinem der beiden. Einen Berliner Dott-Scooter kannst du in Potsdam also nicht abstellen und einen Potsdamer nicht in Berlin.',
        '**Mit S7 oder RE1 anreisen:** Am Hauptbahnhof darfst du laut Dotts Datenfeed frei abstellen; an der Südseite (Friedrich-Engels-Strasse) hat die ViP einen Mobilitätspunkt, weitere Standorte am Bahnhof plant die Stadt bis Ende 2026. Auch die S-Bahnhöfe Babelsberg und Griebnitzsee liegen in Dotts Gebiet.',
        '**Filmpark und Schlösser:** Am Filmpark Babelsberg und in den Schlossparks endet keine Dott-Fahrt. Plan den letzten Abschnitt zu Fuss oder mit Bus und Tram.',
        'Was in Berlin gilt, steht in unserem Ratgeber [E-Scooter in Berlin](guide:berlin); freie Scooter dort zeigt die [Karte rund um Berlin](map:de:Berlin).',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Potsdam',
      blocks: [
        {
          list: [
            '**Rollstuhl ja, Scooter nein:** Vom Fahrverbot für Kraftfahrzeuge in ihren Parks nimmt die Verordnung der SPSG ausdrücklich Krankenfahrstühle aus.',
            '**Eine App für zwei Städte:** Jelbi hatte Ende 2025 laut BVG rund 400 Standorte in Berlin, Potsdam und Kleinmachnow.',
            '**Zwei Stunden Rad gratis:** Ein ViP-Abo enthält täglich zwei Stunden PotsdamRad von nextbike.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Was kostet ein E-Scooter in Potsdam?',
      answer: 'Bei Dott 1 € fürs Entsperren und 0,29 € pro Minute, zehn Minuten also 3,90 € (Datenfeed, 23. Oktober 2026). Bolt und Voi zeigen ihre Preise nur in der App. Verbindlich ist der Preis in der App vor dem Entsperren. Freie Dott-, Voi- und Bolt-Scooter zeigt die [Live-Karte von Potsdam](map:de:Potsdam).',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Park Sanssouci fahren?',
      answer: 'Nein. Die SPSG verbietet in Sanssouci, im Neuen Garten, im Park Babelsberg und ihren anderen Potsdamer Parks, Kraftfahrzeuge zu fahren, zu schieben oder abzustellen, und ein E-Scooter ist eines. Die Ausnahmen für Fahrräder auf einzelnen Wegen gelten nicht für ihn.',
    },
    {
      question: 'Wo kann ich in Potsdam einen E-Scooter abstellen?',
      answer: 'In Dotts Gebiet überall dort, wo die App es erlaubt und der Scooter niemanden behindert. Rund um die Jelbi-Stationen, etwa in der Brandenburger Strasse zwischen Brandenburger Tor und Friedrich-Ebert-Strasse und an der Charlottenstrasse beim Bassinplatz, nur an der Station. Am Alten Markt, im Lustgarten, im Volkspark und am Filmpark Babelsberg gar nicht.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter von Potsdam nach Berlin fahren?',
      answer: 'Nicht mit Dott: Sein Potsdamer Gebiet endet am Bahnhof Griebnitzsee, das Berliner beginnt gut 11 km weiter in Zehlendorf (Stand 23. Oktober 2026). Nimm die S7 oder den RE1 und miete am Ziel neu.',
    },
    {
      question: 'Darf ich einen E-Scooter in Tram oder Bus mitnehmen?',
      answer: 'Nein, die ViP schliesst E-Tretroller in Strassenbahnen, Bussen und auf der Fähre aus, auch eigene. In S-Bahn und Regionalzug darf ein eigener Scooter zusammengeklappt mit.',
    },
    {
      question: 'Komme ich mit dem E-Scooter zur Uni Potsdam?',
      answer: 'Zum Campus Griebnitzsee ja, er liegt in Dotts Gebiet. Die Campus Am Neuen Palais und Golm liegen ausserhalb, dort kannst du keine Fahrt beenden.',
    },
  ],
  sources: [
    { title: 'Dott: Tarif, Gebiet und Zonen für Potsdam im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/potsdam/gbfs.json' },
    { title: 'Dott: Tarif für Berlin im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/berlin/system_pricing_plans.json' },
    { title: 'Dott: So fährst du mit Dott (Pässe)', url: 'https://ridedott.com/de/fahr-mit-uns/' },
    { title: 'Dott: Minuten-Pass (8. April 2025)', url: 'https://ridedott.com/de/launcht-minuten-pass/' },
    { title: 'Bolt: Potsdam', url: 'https://bolt.eu/de-de/cities/potsdam/' },
    { title: 'Potsdamer Neueste Nachrichten: Voi startet ab März mit hunderten Fahrzeugen (26. Februar 2025)', url: 'https://www.tagesspiegel.de/potsdam/landeshauptstadt/neuer-e-scooter-anbieter-in-potsdam-voi-startet-ab-marz-mit-hunderten-fahrzeugen-13279123.html' },
    { title: 'Jelbi: Häufige Fragen (buchbare Partner, Pässe)', url: 'https://www.jelbi.de/faq-de/' },
    { title: 'BVG: Jelbis sechstes Jahr (Pressemitteilung, 29. Dezember 2025)', url: 'https://www.bvg.de/de/unternehmen/medienportal/pressemitteilungen/20251223-pm-jelbi' },
    { title: 'Landeshauptstadt Potsdam: Mobilitätsstation am Bassinplatz eröffnet (Pressemitteilung Nr. 391, 3. September 2026)', url: 'https://www.potsdam.de/de/391-besser-mobil-besser-leben-mobilitaetsstation-am-bassinplatz-eroeffnet' },
    { title: 'Landeshauptstadt Potsdam: Bewertung zum Vorschlag «Feste Parkzonen für E-Roller», Bürgerhaushalt 2027/28', url: 'https://mitgestalten.potsdam.de/de/buergerhaushalt/2027-28/988' },
    { title: 'Landeshauptstadt Potsdam: Gemeinsame Pressemitteilung zum Haushalt 2026 mit den Fraktionen (März 2026)', url: 'https://www.potsdam.de/de/gemeinsame-pressemitteilung-der-landeshauptstadt-potsdam-mit-den-fraktionen-von-spd-cdu-buendnis' },
    { title: 'Landeshauptstadt Potsdam: Sanierung der Fussgängerzone Brandenburger Strasse geht weiter (Pressemitteilung Nr. 377, 3. September 2024)', url: 'https://www.potsdam.de/de/377-sanierung-der-fussgaengerzone-brandenburger-strasse-geht-weiter' },
    { title: 'Landeshauptstadt Potsdam: Weiterer Abschnitt der Fussgängerzone freigegeben (Pressemitteilung Nr. 109, 13. März 2026)', url: 'https://www.potsdam.de/de/109-weiterer-abschnitt-der-fussgaengerzone-freigegeben' },
    { title: 'Landeshauptstadt Potsdam: Schlagwortfibel zur Stadtordnung, Stichwort E-Roller (PDF)', url: 'https://www.potsdam.de/system/files/document/Schlagwortfibel%20zur%20Stadtordnung_0.pdf' },
    { title: 'ViP Verkehrsbetrieb Potsdam: Mobilitätsstationen', url: 'https://www.swp-potsdam.de/de/verkehr/mobilit%C3%A4tsprojekte/mobilit%C3%A4tsstationen/' },
    { title: 'ViP Verkehrsbetrieb Potsdam: Häufig gestellte Fragen (E-Tretroller, Fahrräder)', url: 'https://www.swp-potsdam.de/de/verkehr/h%C3%A4ufig-gestellte-fragen/' },
    { title: 'ViP Verkehrsbetrieb Potsdam: Mobil durch Potsdam (Elektromobile im Bus)', url: 'https://www.swp-potsdam.de/de/verkehr/mobilit%C3%A4tsangebote/' },
    { title: 'SPSG: Stiftungsanlagenverordnung', url: 'https://www.spsg.de/stiftung/stiftungsanlagenverordnung' },
    { title: 'SPSG: Verordnung über die Stiftungsanlagen (PDF)', url: 'https://www.spsg.de/fileadmin/user_upload/SPSG_Stiftungsanlagenverordnung.pdf' },
    { title: 'SPSG: Allgemeinverfügung zum Radfahren in den Parks, Fassung vom 12. Mai 2014 (PDF)', url: 'https://www.spsg.de/fileadmin/user_upload/SPSG_Allgemeinverfuegung_2014-05-12.pdf' },
    { title: 'Waldgesetz des Landes Brandenburg (LWaldG), § 16', url: 'https://bravors.brandenburg.de/gesetze/lwaldg' },
    { title: 'Bundesministerium für Verkehr: Fragen und Antworten zur eKFV-Novelle', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
  ],
};

export default guide;
