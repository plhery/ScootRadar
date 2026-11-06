import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-bern',
  topic: 'bern',
  name: 'E-Trottinett Bern: Voi, Preise, Zonen',
  title: 'E-Trottinett Bern mieten 2026: Voi, Preise, Sperrzonen',
  description: 'E-Trottinett in Bern mieten: Nur Voi hat eine Bewilligung. Was 10 Minuten kosten, wo die Altstadt tabu ist, wo du parkierst und wann das Leihvelo günstiger ist.',
  headline: 'E-Trottinett Bern: E-Scooter von Voi mieten, Preise, Sperrzonen und Parkplätze',
  lede: 'Ein E-Trottinett in Bern mietest du bei Voi: Seit dem 1. Mai 2024 hat nur dieser Anbieter eine Bewilligung der Stadt, für fünf Jahre und höchstens 300 Trottis. Du musst mindestens 18 sein und zahlst CHF 1.– fürs Entsperren plus 42 Rappen pro Minute, zehn Minuten kosten also CHF 5.20 (Stand November 2026). In der Altstadt von der Spitalgasse bis zur Gerechtigkeitsgasse darfst du nicht fahren. In der übrigen Innenstadt, etwa am Bahnhof und auf dem Bundesplatz, beendest du die Fahrt nur auf einem Voi-Parkplatz, und in Köniz und auf dem Gurten gilt Fahrverbot.',
  published: '2026-10-12',
  updated: '2026-10-12',
  city: 'ch:bern',
  sections: [
    {
      heading: 'E-Trottinett in Bern mieten: Voi ist der einzige Anbieter',
      blocks: [
        'Lime, Bolt, Bird oder Dott suchst du in Bern vergeblich. Wer hier E-Trottinette vermieten will, braucht eine Bewilligung der Stadt, und seit dem 1. Mai 2024 gibt es nur eine: die von Voi, gültig für fünf Jahre, also bis im Frühling 2029. Voi darf höchstens 300 Trottis aufstellen und vermietet sie rund um die Uhr. PubliBike gibt es in Bern auch, aber mit Velos und E-Bikes, nicht mit Trottis.',
        'Am 12. Oktober 2026 zeigte die [Karte rund um Bern](map:ch:bern) etwa 280 Trottis, alle von Voi. So kommst du zu deinem Trotti:',
        {
          steps: [
            'Das nächste Trotti und die Gehzeit dorthin auf der [Live-Karte von Bern](map:ch:bern) nachschauen.',
            'Antippen, die Voi-App öffnen, dich registrieren und eine Karte hinterlegen. Beim ersten Mal erklärt dir die App die Berner Regeln fürs Fahren und Parkieren.',
            'QR-Code scannen, entsperren und auf dem Velostreifen oder der Strasse losfahren.',
            'Die Fahrt dort beenden, wo die App es erlaubt, und das verlangte Schlussfoto machen.',
          ],
        },
        'Wer Vois Online-Kurs RideSafe Academy absolvierte, bekam dafür 30 Gratisminuten, so der Gemeinderat in einem Bericht von 2025. Mehr zum Ablauf: [So mietest du ein E-Trottinett](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in Bern?',
      blocks: [
        'Voi verlangt in Bern CHF 1.– fürs Entsperren und 42 Rappen pro Minute (Stand November 2026); den Endpreis zeigt die App. Zum Vergleich die Leihvelos von Velo Region Bern:',
        {
          table: {
            caption: 'E-Trottinett und Leihvelo in Bern im Vergleich, Stand November 2026',
            head: ['Angebot', 'Grundpreis', 'Danach pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi, E-Trottinett', 'CHF 1.– fürs Entsperren', '42 Rappen', 'CHF 5.20', 'CHF 9.40'],
              ['PubliBike, E-Bike ohne Abo', 'CHF 5.– für 30 Minuten', '20 Rappen', 'CHF 5.–', 'CHF 5.–'],
              ['PubliBike, Velo ohne Abo', 'CHF 3.– für 30 Minuten', '10 Rappen', 'CHF 3.–', 'CHF 3.–'],
              ['PubliBike, E-Bike mit Jahresabo B-Fit Local Bern (CHF 69.–)', 'CHF 2.– für 15 Minuten, CHF 1.– für die nächsten 15', '20 Rappen', 'CHF 2.–', 'CHF 3.–'],
            ],
          },
        },
        'Fünf Minuten kosten CHF 3.10, eine halbe Stunde CHF 13.60. Eine Fahrt dauerte 2021 laut Stadt im Schnitt rund zehn Minuten, typischerweise vom Bahnhof in den Breitenrain oder in die Länggasse. In Basel und Biel kostet die Voi-Minute 39 Rappen (Stand November 2026): [E-Trottinett-Preise in der Schweiz](guide:swiss-prices).',
      ],
    },
    {
      heading: 'Altstadt, Gurten, Köniz: Wo du in Bern nicht fahren darfst',
      blocks: [
        'Die Zonen legen Voi und die Stadt fest. Sie ändern sich, an Anlässen auch kurzfristig; massgebend sind die Farben in der Voi-App.',
        {
          table: {
            caption: 'Vois Zonen in Bern, Stand November 2026',
            head: ['Zone', 'Was gilt', 'Wo'],
            rows: [
              ['Fahrverbotszone Altstadt', 'Nicht fahren, nicht durchfahren, nicht parkieren', 'Spitalgasse, Marktgasse, Zytglogge, Kramgasse, Gerechtigkeitsgasse, Münster und Münsterplattform'],
              ['Übrige Innenstadt (Stadtteil I)', 'Durchfahren ja, Fahrt beenden nur auf einem Voi-Parkplatz', 'Bahnhofplatz, Bubenbergplatz, Bundesplatz, Bärenplatz, Waisenhausplatz, Kornhausplatz, Casinoplatz, Rathaus, Matte'],
              ['Fahrverbotszone Köniz', 'Nicht fahren, nicht parkieren', 'Köniz, Liebefeld, Wabern, Talstation der Gurtenbahn und Gurten Kulm'],
              ['Parkverbotszonen', 'Durchfahren ja, Fahrt beenden nur auf einem Voi-Parkplatz', 'Marzili, Viktoriaplatz, Monbijoubrücke, Stadion Wankdorf, Dählhölzli, Zentrum Paul Klee, Westside'],
              ['Ausserhalb des Gebiets', 'Keine Fahrt beenden', 'Ostermundigen, Ittigen, Zollikofen, Bremgarten, Flughafen Bern-Belp'],
              ['Langsamzonen', 'Höchstens 5 oder 10 km/h', 'Stadion Wankdorf (5 km/h), ein Standort des Blinden- und Sehbehindertenverbands SBV (10 km/h)'],
            ],
          },
        },
        'Die Altstadt ist seit 1983 UNESCO-Weltkulturerbe, und ihre Lauben gehören den Fussgängern: Wer dort fährt, fährt auf einem Fussweg oder Trottoir, und das kostet CHF 30.– bis 40.– Busse. Trotzdem klagten Mitglieder des Stadtrats im Mai 2026 über Leute, die mit Trottinett und Velo «die Lauben hinunterrasen».',
        '2021 schrieb die Stadt, in den Sperrzonen werde das Trotti von 20 auf 5 km/h gedrosselt. Plane deine Route um die Altstadt herum. Auch Berns Hausberg, der Gurten, liegt in Köniz und ist tabu: Hinauf fährt die Gurtenbahn.',
        { note: 'In der Innenstadt und in den Parkverbotszonen beendest du die Fahrt nur auf einem Voi-Parkplatz, in einer Fahrverbotszone gar nicht, und bis dahin laufen die Minuten weiter. Such den nächsten Voi-Parkplatz in der App, bevor du am Ziel bist.' },
      ],
    },
    {
      heading: 'E-Trottinett parkieren in Bern: Bahnhof, Bundesplatz, Bärenplatz',
      blocks: [
        'Die Voi-Parkplätze zeigt dir die App: rund 500 in und um Bern, rund 90 davon in der Innenstadt (Stand November 2026). Die nächsten bei bekannten Orten:',
        {
          table: {
            caption: 'Voi-Parkplätze bei bekannten Orten, Stand November 2026',
            head: ['Ort', 'Voi-Parkplätze in der Nähe'],
            rows: [
              ['Bahnhof', '«Bahnhofplatz 2» (rund 90 m), «Bahnhofplatz», «Bollwerk», «Velostation PostParc», «Velostation Welle 7», «Velostation Schanzenbrücke»'],
              ['Bundesplatz und Bundeshaus', '«Bundesgasse 6», «Bundesgasse 8», «Schauplatzgasse 1», «Amthausgasse 28»'],
              ['Bärenplatz', '«Schauplatzgasse 1» (rund 50 m)'],
              ['Waisenhausplatz', '«Nägeligasse 13», «Predigergasse», «Zeughausgasse 41»'],
              ['Zytglogge und Kornhausplatz', '«Kornhausplatz 19», «Kornhausplatz»'],
              ['Casinoplatz', '«Casinoplatz», «Münzgraben 2», «Theaterplatz»'],
              ['Rathaus und Matte', '«Rathausplatz 1», «Rathausgasse 11», «Schifflaube 16», «Schifflaube»'],
              ['Marzili', '«Ländteweg 5», «Marzilibahn»'],
            ],
          },
        },
        'Anderswo parkierst du wie ein Velo: auf dem Trottoir nur, wenn 1,50 m für Fussgänger frei bleiben (sonst CHF 20.– Busse), nie auf Blindenleitlinien, vor Eingängen oder auf dem Fussgängerstreifen. Die Stationen von Velo Region Bern lässt du frei.',
        'Steht ein Trotti im Weg, melde es über [report.voi.com](https://report.voi.com/de) oder [trotti-melder.ch](https://trotti-melder.ch); gefährlich abgestellte räumt Voi laut Gemeinderat (2025) im Schnitt innert 30 Minuten weg.',
      ],
    },
    {
      heading: 'Mit dem E-Trottinett durch Bern: Bahnhof, Brücken, Steigungen, Flughafen',
      blocks: [
        {
          list: [
            '**Bahnhof:** Im ganzen Bahnhof verbietet die SBB das Fahren. Beende die Fahrt draussen auf einem Voi-Parkplatz und geh zu Fuss hinein.',
            '**Aare und Steigungen:** Matte und Marzili liegen unten an der Aare; hinauf zum Bundeshaus und in die Altstadt ist es steil. Bequemer sind die Marzilibahn und der Lift zur Münsterplattform.',
            '**Brücken:** Kirchenfeld-, Kornhaus-, Lorraine-, Nydegg- und Untertorbrücke liegen ausserhalb der Sperrzonen. Auf der Monbijoubrücke darfst du auch nach den neuen Signalregeln vom 1. Juli 2025 weiter den Velostreifen auf dem Trottoir benutzen, parkieren aber nicht.',
            '**Tramschienen:** möglichst rechtwinklig queren, nie in der Rille fahren.',
            '**Bärengraben:** BärenPark und Rosengarten liegen ausserhalb aller Zonen, gleich daneben ist der Voi-Parkplatz «Bärenpark». Der direkte Weg führt durch die gesperrte Altstadt: Fahr aussen herum.',
            '**Wankdorf:** Ums Stadion gelten Tempo 5 und Parkverbot, der Bahnhof Wankdorf liegt ausserhalb der Zonen. An Anlässen können temporäre Sperrzonen dazukommen.',
            '**Flughafen:** Bern-Belp liegt ausserhalb von Vois Gebiet; nimm Bus oder Zug.',
          ],
        },
        'Übernachtest du in der Stadt Bern, fährst du mit dem Bern-Ticket gratis Tram und Bus in den Libero-Zonen 100 und 101, dazu Gurtenbahn, Marzilibahn und den Lift zur Münsterplattform; am An- und Abreisetag gilt es bis zum Flughafen. Das Ticket bekommst du beim Check-in von der Unterkunft.',
      ],
    },
    {
      heading: 'Velo Region Bern: PubliBike als Alternative zum Trotti',
      blocks: [
        'Wo Voi nicht hinfährt, hilft das Leihvelo. Velo Region Bern, betrieben von PubliBike, startete am 16. Januar 2026 neu: über 300 Stationen in 17 Gemeinden, auch in Köniz, Ostermundigen, Ittigen, Zollikofen und Belp, und rund 70 Prozent E-Bikes. Die Stadt spricht vom dichtesten Leihvelo-Netz der Schweiz.',
        'Ausleihen kannst du mit der PubliBike-App oder dem SwissPass. Neben Einzelfahrten und dem Jahresabo B-Fit Local Bern für CHF 69.– gibt es eine Tageskarte für 24 Stunden zu CHF 29.–. Ab zehn Minuten ist das E-Bike auch ohne Abo günstiger als das Trotti.',
      ],
    },
    {
      heading: 'Regeln und Bussen: das Wichtigste in Kürze',
      blocks: [
        {
          list: [
            '**Ab 18** bei Voi. Das Gesetz: ab 16 ohne Führerausweis, ab 14 mit dem Ausweis der Kategorie M.',
            '**Velostreifen oder Veloweg**, sonst die Strasse. **Nie aufs Trottoir**: CHF 40.–.',
            '**Fussgängerzonen** nur, wenn eine Zusatztafel Velos erlaubt, sonst CHF 30.–.',
            '**Licht an**, auch am Tag. Ohne Licht kostet es am Tag CHF 20.–, nachts CHF 40.– auf beleuchteten und CHF 60.– auf unbeleuchteten Strassen.',
            '**Rotlicht**: CHF 60.–. **Handy in der Hand**: CHF 40.–.',
            '**Nur eine Person** pro Trotti. **Helm** empfohlen, keine Pflicht.',
            '**0,5 Promille** sind die Grenze; ab da droht ein Strafverfahren statt einer Ordnungsbusse.',
          ],
        },
        'Der Regierungsrat sah im Februar 2026 einen «klaren Aufwärtstrend» bei Unfällen mit E-Trottinetten und E-Rollern im Kanton Bern. Alle Bussen und Altersgrenzen findest du in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Schon gewusst? Drei Fakten zu Berns E-Trottinetten',
      blocks: [
        {
          list: [
            '**In der Aare versenkt:** Die Auflagen der Stadt von 2020 regeln, was mit Trottis geschieht, die der Anbieter nicht selbst bergen kann, «z.B. in der Aare versenkte E-Trottinette»: Die Stadt darf sie entsorgen und dem Anbieter verrechnen.',
            '**Keine Signalfarben:** Wegen des Weltkulturerbes sollen die Trottis keine Signalfarben tragen. 2023 fragte ein Bewerber, ob seine grünen Trottis schon als Signalfarbe gälten; die Stadt wollte es prüfen.',
            '**Mehr Fahrten, nicht mehr Klagen:** 2023 zählte Voi in Bern 116 380 Fahrten, 2024 schon 200 762. Meldungen über falsch parkierte Trottis gab es 2024 nur 76, etwa so viele wie im Vorjahr.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche App brauche ich für ein E-Trottinett in Bern?',
      answer: 'Die Voi-App: Seit dem 1. Mai 2024 vermietet in Bern nur Voi E-Trottinette. Du zahlst CHF 1.– fürs Entsperren plus 42 Rappen pro Minute, zehn Minuten kosten also CHF 5.20 (Stand November 2026). Wo die Trottis stehen, zeigt die [Live-Karte von Bern](map:ch:bern).',
    },
    {
      question: 'Warum gibt es in Bern keine Trottis von Lime oder Bolt?',
      answer: 'Weil das Vermieten von E-Trottinetten in Bern eine Bewilligung der Stadt braucht und seit dem 1. Mai 2024 nur Voi eine hat, für fünf Jahre. Der Gemeinderat hatte 2023 entschieden, statt zwei Anbietern nur noch einen zuzulassen, und Voi setzte sich gegen zwei andere Interessenten durch. Lime und Bolt fahren etwa in Zürich.',
    },
    {
      question: 'Brauche ich einen Führerausweis für ein Voi-Trotti in Bern?',
      answer: 'Nein. Du musst bei Voi mindestens 18 sein, einen Führerausweis verlangt das Gesetz ab 16 nicht. Auch Gäste aus dem Ausland registrieren sich in der App und zahlen mit Karte; eine Ordnungsbusse müssen sie aber sofort bezahlen oder eine Kaution hinterlegen.',
    },
    {
      question: 'Komme ich mit dem Trotti nach Ostermundigen, Köniz oder zum Flughafen?',
      answer: 'Mit Voi nicht. In Köniz, Wabern und auf dem Gurten gilt Fahrverbot, und in Ostermundigen, Ittigen, Zollikofen, Bremgarten und am Flughafen kannst du keine Fahrt beenden (Stand November 2026); die aktuellen Zonen zeigt die Voi-App. Nimm Bus oder Zug, oder ein Velo von Velo Region Bern.',
    },
    {
      question: 'Kann ich PubliBike in Bern mit dem SwissPass ausleihen?',
      answer: 'Ja, bei Velo Region Bern entsperrst du Velos und E-Bikes auch mit dem SwissPass, ohne Aufpreis. Bezahlt wird nach dem Tarif von PubliBike, ohne Abo also CHF 5.– für die ersten 30 Minuten auf dem E-Bike.',
    },
    {
      question: 'Wie viele E-Trottinette gibt es in Bern?',
      answer: 'Höchstens 300, so viele erlaubt die Bewilligung der Stadt. Am 12. Oktober 2026 zeigte die Karte rund um Bern etwa 280 Voi-Trottis. Angefangen hatte Bern 2021 mit höchstens 250, je 125 von Voi und Tier.',
    },
  ],
  sources: [
    { title: 'Gemeinderat der Stadt Bern: Bericht zum Postulat «E-Trottinetts dürfen kein Hindernis darstellen», 23. April 2025', url: 'https://ris.bern.ch/de/dokumente/67b2469b3610416eb307755ff94c94ce-332' },
    { title: 'Stadt Bern: Allgemeine Informationen zum Bewilligungsverfahren E-Trottinett-Verleihsystem, 2020 (PDF)', url: 'https://www.bern.ch/mediencenter/medienmitteilungen/aktuell_ptk/gemeinderat-will-e-trottinett-verleih-geordnet-zulassen/dokuemente/allgemeine-bestimmungen-zu-e-trottinett.pdf/download' },
    { title: 'Stadt Bern: Infoblatt E-Trottinett-Verleihsysteme, Mai 2021 (PDF)', url: 'https://www.bern.ch/velohauptstadt/partizipation/resultate/velo-offensive-dienstleistungs-foerdermassnahmen/20210707_InfoblattETrottinettVerleihsysteme.pdf' },
    { title: 'MobiData BW: offene Daten von Voi Schweiz (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_ch/gbfs' },
    { title: 'Stadt Winterthur: Sharing-Angebote, mit Vois Mindestalter von 18 Jahren', url: 'https://stadt.winterthur.ch/themen/mobilitaet/oev-taxi-sharing/sharing-angebote' },
    { title: 'Stadt Bern: Betriebsstart des dichtesten Leihvelo-Netzes der Schweiz', url: 'https://www.bern.ch/mediencenter/medienmitteilungen/aktuell_ptk/betriebsstart-des-dichtesten-leihvelo-netzes-der-schweiz' },
    { title: 'PubliBike: Preise & Abos', url: 'https://www.publibike.ch/de/abos' },
    { title: 'Bern Welcome: Factsheet Bern-Ticket für Beherbergungsbetriebe, 2026 (PDF)', url: 'https://a.storyblok.com/f/272028/x/796bec4fa1/2026_factsheet_bern-ticket-beherbergungsbetriebe.pdf' },
    { title: 'Stadt Bern: Unterwegs in Bern', url: 'https://www.bern.ch/zu-gast-in-bern/unterwegs-in-bern' },
    { title: 'Ordnungsbussenverordnung (OBV), Bussenliste', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
