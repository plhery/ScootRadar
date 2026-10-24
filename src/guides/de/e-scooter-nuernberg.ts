import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-nuernberg',
  topic: 'nuremberg',
  name: 'E-Scooter Nürnberg: Anbieter, Preise, Parken',
  title: 'E-Scooter Nürnberg 2026: Anbieter, Preise, Sammelparkplätze',
  description: 'E-Scooter Nürnberg: wer vermietet, was eine Fahrt kostet, wo du innerhalb des Rings nur an Sammelparkplätzen abstellst und was in U-Bahn und Tram gilt.',
  headline: 'E-Scooter Nürnberg: Anbieter, Preise, Sammelparkplätze und was in Altstadt und U-Bahn gilt',
  lede: 'Einen E-Scooter in Nürnberg mietest du ab 18 und ohne Führerschein bei Voi, Dott, Lime oder Bolt; diese vier nennt die Stadt. Den Preis zeigt die App; offen nennt nur Bolt einen, für ganz Deutschland «ab 0,15 € pro Minute» (Stand 24. Oktober 2026). In der Altstadt und überall innerhalb des Bundesstrassenrings beendest du die Fahrt nur an einem markierten Sammelparkplatz, durch die Fussgängerzone fährst du nicht, und in U-Bahn, Tram und Bus darf kein E-Scooter mit. Ein Nachtverbot nennt die Stadt nicht.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Nürnberg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Nürnberg?',
      blocks: [
        'Betrieb und Abstellen regelt die Stadt in einem Sondernutzungsvertrag mit jedem Anbieter. Im April 2024 schloss sie solche Verträge mit den fünf Anbietern, die damals in Nürnberg vermieteten: Bolt, Lime, Superpedestrian, TIER und Voi. Heute nennt das Verkehrsplanungsamt vier Ansprechpartner: **Voi**, **Dott** (TIER heisst heute Dott), **Lime** und **Bolt**.',
        'Dott führt auf seiner Website neben Nürnberg auch Fürth und Erlangen, Bolt nennt E-Scooter auf seiner Nürnberg-Seite. Gemietet wird in der App des Anbieters, Voi auch in **NürnbergMOBIL**, der App der VAG. Alle vier vermieten laut ihren Bedingungen nur ab 18. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte rund um Nürnberg](map:de:Nürnberg) zeigt seit dem 24. Oktober 2026 Dott und Voi: am Samstag, 24. Oktober, kurz vor 16 Uhr zusammen rund 2500 Scooter. Die Zahl umfasst nicht nur die Stadt, sondern auch Fürth, Zirndorf und bei Voi Erlangen. Das ist eine Momentaufnahme, keine Flottengrösse. Die Dott-Scooter in Erlangen zeigt die [Karte von Erlangen](map:de:Erlangen). Preise, Zonen und Sammelparkplätze von Dott und Voi zeigen nur ihre Apps. Lime und Bolt fehlen auf der Karte, ihre Scooter siehst du nur in ihren Apps; Leihräder zeigt die Karte nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Nürnberg?',
      blocks: [
        'Du zahlst in der Regel fürs Entsperren und pro Minute. Einen offenen Nürnberger Tarif fanden wir bei keinem der vier Anbieter (Stand 24. Oktober 2026); verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        {
          table: {
            caption: 'E-Scooter-Preise in Nürnberg: was offen genannt wird (Stand 24. Oktober 2026)',
            head: ['Anbieter', 'Preis', 'Buchen in', 'Auf unserer Karte'],
            rows: [
              ['Voi', 'In der App; Freiminuten mit Deutschlandticket', 'Voi-App, NürnbergMOBIL', 'Ja'],
              ['Dott', 'In der App', 'Dott-App', 'Ja'],
              ['Bolt', 'Ab 0,15 € pro Minute plus kleine Entsperrgebühr (für Deutschland)', 'Bolt-App', 'Nein'],
              ['Lime', 'In der App', 'Lime-App', 'Nein'],
            ],
          },
        },
        'Bolt bietet in Deutschland ausserdem ein Abo mit unbegrenzten Freischaltungen ab 0,99 € im Monat. Mit dem Deutschlandticket (63 € im Monat) bekommst du in NürnbergMOBIL laut VAG jeden Monat 15 Voi-Freiminuten; die Startgebühr zahlst du extra. Ausserhalb des Rings belohnen die Anbieter laut Stadt das Abstellen an Sammelparkplätzen mit Gratisminuten oder Rabatten.',
      ],
    },
    {
      heading: 'E-Scooter in Nürnberg abstellen: Sammelparkplätze im Ring',
      blocks: [
        'Seit dem 1. Mai 2024 leihst du in der Altstadt (Zone A) nur an einem Sammelparkplatz aus und gibst den Scooter nur dort zurück, seit dem 19. November 2024 auch überall sonst innerhalb des Bundesstrassenrings (Zone B), samt Weststadt: rund 22 km². Abseits der Plätze kannst du die Fahrt nicht beenden, und die Miete läuft weiter. Festgelegt hat das die Stadt im Vertrag mit den Anbietern; für deinen eigenen E-Scooter gilt es nicht.',
        'Die Sammelparkplätze erkennst du am Schild «Parken», einer Randmarkierung und einem E-Scooter-Piktogramm. Geplant waren laut Stadt rund 300 in der ganzen Stadt, rund 50 davon in der Altstadt; dort sollen sie etwa alle 150 m liegen, ausserhalb der Altstadt alle 250 m, wo Platz ist. Die Zonen zeigt eine Karte der Stadt, die einzelnen Plätze nur die App.',
        {
          table: {
            caption: 'Wo du einen Leih-Scooter in Nürnberg abstellst und wer das festlegt (Zonenkarte der Stadt, Stand 24. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer das festlegt'],
            rows: [
              ['Altstadt (Zone A), etwa Hauptmarkt und Kaiserburg', 'Nur an Sammelparkplätzen, seit 1. Mai 2024', 'Stadt, im Vertrag mit den Anbietern'],
              ['Bis zum Bundesstrassenring (Zone B), etwa Hauptbahnhof, Plärrer, Gostenhof', 'Nur an Sammelparkplätzen, seit 19. November 2024', 'Stadt, im Vertrag mit den Anbietern'],
              ['Städtische Grünanlagen, etwa Stadtpark und Wöhrder Wiese', 'Weder fahren noch abstellen, ausser auf freigegebenen Wegen', 'Stadt, Grünanlagensatzung'],
              ['Ausserhalb des Rings, etwa Messe, Max-Morlock-Stadion, Tiergarten', 'Frei abstellen, wenn niemand behindert oder gefährdet wird; dazu Sammelparkplätze an Haltestellen', 'Bundesrecht (StVO) und Stadt'],
            ],
          },
        },
        'Ob ein Anbieter bis zur Messe, zum Tiergarten oder zum Flughafen fährt, zeigt seine App.',
        {
          note: 'Lässt dich die App innerhalb des Rings die Fahrt nicht beenden, stehst du nicht auf einem Sammelparkplatz. Fahr zum nächsten: Solange die Fahrt läuft, zahlst du weiter. Mach am Ende ein Foto vom abgestellten Scooter.',
        },
        'Steht ein Scooter im Weg, muss der Anbieter ihn laut Vertrag binnen sechs Stunden nach einer Beschwerde wegräumen; die Kontakte nennt die Stadt. Wer falsch abstellt, zahlt unter Umständen auch an den Anbieter. Laut den deutschen Bedingungen (Stand 24. Oktober 2026) verlangt Bolt 15 €, wenn der Scooter falsch steht und kein deutliches Abstellfoto da ist, Dott bis 300 € fürs Zurückholen, wenn du die Anweisungen zum Abstellen missachtest. Die Bedingungen von Voi und Lime konnten wir nicht prüfen.',
      ],
    },
    {
      heading: 'Wo darfst du in Nürnberg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse, nur wo es die nicht gibt auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Gegen die Fahrtrichtung einer Einbahnstrasse fährst du nur, wo das Zusatzschild «Radverkehr frei» sie für Radfahrende öffnet. Diese Regeln setzt der Bund.',
        'Die **Fussgängerzone** der Altstadt ist gross: die Breite Gasse, die Karolinen- und die Kaiserstrasse, dazu etwa Hallplatz, Luitpoldstrasse und Weissgerbergasse. Auch der Weg vom Hauptbahnhof über Königstrasse und Hauptmarkt hinauf zur Kaiserburg führt laut Stadt weitgehend durch Fussgängerzonen. Radfahrer dürfen in den zentralen Zonen während der Lieferzeit von 18.30 bis 10.30 Uhr (samstags bis 10 Uhr) fahren, E-Scooter nicht.',
        'Ab 1. März 2027 öffnet ein Schild «Radverkehr frei» Gehwege und Fussgängerzonen auch für E-Scooter, im Schritttempo. Was das für die Nürnberger Lieferzeiten heisst, hat die Stadt noch nicht gesagt.',
        'In den **Grünanlagen** der Stadt verbietet die Grünanlagensatzung, Kraftfahrzeuge zu bewegen oder abzustellen, ausser auf Wegen, die ein Schild dafür freigibt; das gilt auch für Wiesen und Wege an der Pegnitz, die dazugehören. E-Scooter sind laut Stadt Kraftfahrzeuge; bei Vorsatz drohen bis zu 2500 € Bussgeld. Eine eigene E-Scooter-Regel für die Pegnitz oder den Stadtpark nennt die Stadt nicht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln und Bussgelder in Nürnberg',
      blocks: [
        'Die Verkehrsregeln setzt der Bund. E-Scooter fährst du ab 14 ohne Führerschein, höchstens 20 km/h und immer allein. Eine Helmpflicht gibt es nicht, die Stadt empfiehlt aber einen Helm. Für Alkohol und Cannabis gelten die Grenzen fürs Auto; unter 21 oder in der Probezeit gilt 0,0 Promille.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille oder 3,5 ng/ml THC', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Falsch abgestellt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'Unzulässig auf Geh- oder Radweg 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Ab 1,1 Promille ist es eine Straftat, und der Führerschein ist in der Regel weg. Seit 1. Oktober 2026 haftet der Halter bei Unfällen auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Alles Weitere steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in U-Bahn, Tram und Bus: was VAG und VGN erlauben',
      blocks: [
        'Seit dem 13. Mai 2024 darfst du im ganzen Verkehrsverbund Grossraum Nürnberg (VGN) keinen E-Tretroller in U-Bahn, Strassenbahn und Bus mitnehmen, auch keinen eigenen. Grund ist die Brand- und Explosionsgefahr der Akkus. Die VAG verbietet ausserdem, E-Scooter in die U-Bahnhöfe mitzunehmen. E-Bikes, Pedelecs, E-Rollstühle und Seniorenmobile sind nicht betroffen.',
        'In **S-Bahn und Regionalzug** bleibt die Mitnahme laut VGN erlaubt. Das gilt für deinen eigenen Scooter; im Fernverkehr der Deutschen Bahn fährt er zusammengeklappt als Handgepäck mit. Leih-Scooter lassen sich nicht zusammenklappen: Beende die Fahrt vor dem Einsteigen an einem Sammelparkplatz an der Haltestelle; auch ausserhalb des Rings gibt es solche Plätze an Haltestellen.',
      ],
    },
    {
      heading: 'VAG_Rad: Leihrad statt E-Scooter',
      blocks: [
        '**VAG_Rad** verleiht laut VAG rund 2550 Fahrräder, E-Bikes und Lastenräder an über 100 Stationen und in Flexzonen in Nürnberg, Fürth, Erlangen und Schwabach. In NürnbergMOBIL kostet das Fahrrad 0,10 € Startgebühr plus 0,10 € pro Minute, das E-Bike 1 € plus 0,10 € pro Minute.',
        'Mit VGN-Abo oder Deutschlandticket bekommst du in NürnbergMOBIL 600 Freiminuten im Monat, die Startgebühr zahlst du trotzdem. Das E-Bike gibst du nur an einer Station zurück, sonst kostet es 20 €.',
      ],
    },
    {
      heading: 'Mit dem E-Scooter zum Christkindlesmarkt, zur Kaiserburg und zur Messe',
      blocks: [
        'Der **Christkindlesmarkt** 2026 läuft vom 27. November bis 24. Dezember, täglich von 10 bis 21 Uhr, an Heiligabend bis 14 Uhr; feierlich eröffnet wird er am Freitag, 27. November, um 17.30 Uhr. Der Hauptmarkt liegt in der Fussgängerzone und in Zone A: Stell den Scooter an einem Sammelparkplatz ausserhalb der Fussgängerzone ab und geh zu Fuss weiter. Eine eigene Scooter-Regel für den Markt nennt die Stadt nicht; sie empfiehlt die U1 bis Lorenzkirche.',
        'Auf dem Weg zur **Kaiserburg** ist auch ein Teil der Burgstrasse Fussgängerzone. Die **Messe** und das Max-Morlock-Stadion liegen ausserhalb des Rings: Dort stellst du frei ab, solange niemand behindert wird, aber nicht in einer Grünanlage.',
      ],
    },
    {
      heading: 'Wie Nürnberg E-Scooter regelt: Vertrag, Obergrenze und 2027',
      blocks: [
        'Den Rahmen hat der Verkehrsausschuss des Stadtrats am 7. Juli 2022 einstimmig beschlossen: feste Sammelparkplätze und ein Vertrag mit jedem Anbieter. Seit Mai 2024 will die Stadt das Konzept fünf Jahre lang testen; laut einer von dpa zitierten Mitteilung von Voi enden die Verträge am 30. April 2029. Laut Vertrag darf jeder Anbieter höchstens 800 Scooter aufstellen. Bei damals fünf Anbietern nannte die Stadt 4000 als Obergrenze, vorher waren mehr als 6000 unterwegs. Für jeden Scooter zahlt der Anbieter der Stadt 50 € im Jahr, so steht es in der Sondernutzungsgebührensatzung, die der Stadtrat zuletzt am 20. November 2025 geändert hat.',
        'Ausserhalb des Rings wollte die Stadt die Pflicht ausweiten, falls die Beschwerden dort nicht sinken. Im Januar 2025 berichtete sie dem Ausschuss, sie beobachte das System; einen späteren Beschluss haben wir bis zum 24. Oktober 2026 nicht gefunden. Ein Nachtverbot oder eine Winterpause nennt die Stadt nicht.',
        'Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; Städte können es dann als Sondernutzung regeln. Wie München das angehen will: [E-Scooter in München](guide:munich).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter kann ich in Nürnberg mieten?',
      answer: 'Die von Voi, Dott, Lime und Bolt; diese vier nennt die Stadt. Die [Live-Karte von Nürnberg](map:de:Nürnberg) zeigt Dott und Voi, Lime und Bolt siehst du nur in ihren Apps. Du musst 18 sein, einen Führerschein brauchst du nicht.',
    },
    {
      question: 'Wo darf ich in Nürnberg einen E-Scooter abstellen?',
      answer: 'In der Altstadt und innerhalb des Bundesstrassenrings nur an markierten Sammelparkplätzen, sonst läuft die Miete weiter. Ausserhalb des Rings stellst du ihn frei ab, solange du niemanden behinderst oder gefährdest.',
    },
    {
      question: 'Darf ich einen E-Scooter in die Nürnberger U-Bahn mitnehmen?',
      answer: 'Nein. In U-Bahn, Strassenbahn und Bus des VGN sind E-Tretroller seit Mai 2024 verboten, und die VAG verbietet auch, sie in U-Bahnhöfe mitzunehmen. In S-Bahn und Regionalzug darf dein eigener Scooter laut VGN mit, ein Leih-Scooter lässt sich nicht klappen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Fussgängerzone fahren?',
      answer: 'Nein, bis Ende Februar 2027 auch nicht während der Lieferzeit, in der Radfahrer dort fahren dürfen. Ab 1. März 2027 darfst du fahren, wo ein Schild «Radverkehr frei» die Zone öffnet, im Schritttempo.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Stadtpark fahren?',
      answer: 'Nur auf Wegen, die ein Schild für E-Scooter freigibt; sonst verbietet die Grünanlagensatzung der Stadt Fahren und Abstellen, mit einem Bussgeld bis 2500 €. Den Leih-Scooter gibst du am nächsten Sammelparkplatz zurück, denn der Stadtpark liegt im Ring.',
    },
  ],
  sources: [
    { title: 'Stadt Nürnberg: E-Scooter in Nürnberg (aktualisiert 9. Juli 2026)', url: 'https://www.nuernberg.de/internet/stadtportal/e_scooter.html' },
    { title: 'Verkehrsplanungsamt Nürnberg: Mit dem E-Scooter, Zonen und FAQ', url: 'https://www.nuernberg.de/internet/verkehrsplanung/escooter.html' },
    { title: 'Stadt Nürnberg: Pressemitteilung Nr. 437 zu Sammelparkplätzen, 25. April 2024', url: 'https://www.nuernberg.de/presse/mitteilungen/pm_23093.html' },
    { title: 'Stadt Nürnberg: Pressemitteilung Nr. 1272 zum Bundesstrassenring, 19. November 2024', url: 'https://www.nuernberg.de/presse/mitteilungen/pm_24420.html' },
    { title: 'Verkehrsausschuss Nürnberg: E-Scooter-Nutzung, 7. Juli 2022', url: 'https://online-service2.nuernberg.de/buergerinfo/to0050.asp?__ktonr=93584' },
    { title: 'Stadtrat Nürnberg: Sondernutzungsgebühren, 20. November 2025', url: 'https://online-service2.nuernberg.de/buergerinfo/to0050.asp?__ktonr=104885' },
    { title: 'Stadt Nürnberg: Grünanlagensatzung (PDF)', url: 'https://www.nuernberg.de/imperia/md/stadtrecht/dokumente/8/850/850_270.pdf' },
    { title: 'Verkehrsplanungsamt Nürnberg: Fussgängerzonen', url: 'https://www.nuernberg.de/internet/verkehrsplanung/fussgaengerzonen.html' },
    { title: 'infranken.de (dpa): Nürnberg ergreift Massnahmen wegen E-Scootern, 26. April 2024', url: 'https://www.infranken.de/lk/nuernberg/nuernberg-stadt-ergreift-massnahmen-wegen-e-scootern-kommt-ein-verbot-art-5860300' },
    { title: 'VGN: Mitnahmeverbot für E-Tretroller, 13. Mai 2024', url: 'https://www.vgn.de/presse/240513_mitnahme-escooter' },
    { title: 'VGN-Tarif: Beförderung von Sachen', url: 'https://www.vgn.de/produkte/gemeinschaftstarif/kapitel/01/01.11' },
    { title: 'VAG: Ihre Sicherheit', url: 'https://www.vag.de/ihre-vag/service/ihre-sicherheit' },
    { title: 'NürnbergMOBIL: App der VAG', url: 'https://nuernbergmobil.de/' },
    { title: 'VAG_Rad: Tarife und Rückgabe', url: 'https://www.vagrad.de/de/' },
    { title: 'Bolt in Nürnberg', url: 'https://bolt.eu/de-de/cities/nuremberg/' },
    { title: 'Bolt: E-Scooter in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge in Deutschland (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Dott: Standorte', url: 'https://ridedott.com/de/locations' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen für Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Stadt Nürnberg: Christkindlesmarkt 2026 (PDF)', url: 'https://www.nuernberg.de/imperia/md/kommunikation_stadtmarketing/dokumente/internet/ckm/ckm_26_ausblick.pdf' },
  ],
};

export default guide;
