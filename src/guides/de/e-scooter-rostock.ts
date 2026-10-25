import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-rostock',
  topic: 'rostock',
  name: 'E-Scooter Rostock: Anbieter, Preise, Parken',
  title: 'E-Scooter Rostock 2026: Anbieter, Preise, Parken, RSAG',
  description: 'E-Scooter Rostock: Voi, Dott und MOIN, was über Preise bekannt ist, wo du fährst und parkst und was in Warnemünde, in Parks und in der Strassenbahn gilt.',
  headline: 'E-Scooter Rostock: drei Anbieter, Sperrzonen am Wasser und was in Warnemünde gilt',
  lede: 'E-Scooter in Rostock leihst du bei Voi, Dott oder MOIN; alle drei vermieten erst ab 18, einen Führerschein brauchst du nicht. Unsere Karte zeigt Voi und Dott, MOIN fehlt dort. Einen Rostocker Tarif nennt keiner der drei offen, den Preis zeigt die App vor dem Entsperren. Du fährst auf dem Radweg, nicht auf dem Gehweg und nicht durch die Fussgängerzonen der Innenstadt. In Parks, am Warnowufer und in Fussgängerzonen lässt sich die Fahrt laut Stadt nicht beenden; durch städtische Parks und den IGA Park schiebst du nach unserer Lesart, am Strand ist Fahren verboten. Zusammengeklappt fährt dein eigener Scooter in Strassenbahn, Bus, S-Bahn und Fähre kostenlos mit.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Rostock',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Rostock?',
      blocks: [
        'In Rostock verleihen drei Anbieter E-Scooter: **Voi**, **Dott** und **MOIN**. Die Stadt schliesst mit ihnen freiwillige Vereinbarungen, etwa über Parkverbotszonen und höchstens fünf Scooter je Standort.',
        '**MOIN** ist ein Angebot der MIR Solutions GmbH aus Rostock. Laut einem Bericht der Stadt vom Mai 2022 startete es 2020; laut eigener Seite (Stand November 2025) fährt es auch in Schwerin, Greifswald, Stralsund und Neubrandenburg. **Dott** führt Rostock auf seiner Standortliste; Vertragspartner ist laut AGB die TIER Mobility SE, und TIER kam laut demselben Bericht 2021. **Voi** zählte laut eigener Mitteilung bis Mai 2025 rund eine Million Fahrten in Rostock. Bolt und Ryde führen Rostock nicht unter ihren Städten (gelesen am 25. Oktober 2026).',
        'Wie du per App leihst, zeigt Schritt für Schritt [E-Scooter mieten](guide:how-to-rent).',
        'Die [Karte von Rostock](map:de:Rostock) zeigt Voi und Dott: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 790 Scooter, etwa 450 Voi und 340 Dott. Am Sonntag gegen 6:30 Uhr standen alle rund 820 in der Stadt, rund 75 davon in Warnemünde und Diedrichshagen. Das sind Momentaufnahmen, keine Flottengrössen. **MOIN fehlt auf unserer Karte**; seine Scooter zeigt nur die MOIN-App. Die Karte zeigt Standort und bei Voi den Akkustand; Preise, Sperrzonen und Abstellflächen zeigt nur die App des Anbieters.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Rostock?',
      blocks: [
        'Einen Rostocker Tarif nennt keiner der drei Anbieter offen. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Offen stehen nur Gebühren:',
        {
          table: {
            caption: 'Was die Anbieter offen nennen (gelesen am 25. Oktober 2026)',
            head: ['Anbieter', 'Fahrpreis', 'Gebühren laut Bedingungen', 'Auf der Karte'],
            rows: [
              ['Voi', 'Nur in der App', 'Nicht offen angegeben', 'Ja'],
              ['Dott', 'Nur in der App, nach Dauer, eventuell plus Freischaltgebühr', 'Bis zu 300 € Rückholkosten, wenn du falsch parkst oder nicht richtig sperrst; ein Bussgeld, das Dott für dich zahlt, plus 50 € Verwaltungsgebühr (AGB, letzte Aktualisierung 23. September 2025)', 'Ja'],
              ['MOIN', 'Entsperrgebühr und Minutenpreis «siehe App», minutengenau abgerechnet', '«Scooter falsch geparkt, kein Foto am Fahrtende gemacht»: 35 €; Abstellen ausserhalb des Nutzungsgebiets: 70 €; Abschleppen: 100 € plus Kosten der Abschleppfirma; Bussgeld plus 29,75 € Bearbeitung', 'Nein'],
            ],
          },
        },
        'Eine nicht beendete MOIN-Fahrt deckelt die Gebührenordnung auf «Max. 29,00€». Bei einem Schaden trägst du eine Selbstbeteiligung von «Max. 300,00€» und dazu 100 € Bearbeitungsgebühr.',
      ],
    },
    {
      heading: 'Wo darf man in Rostock mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, Radfahr- oder Schutzstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Auf gemeinsamen Geh- und Radwegen haben Fussgänger Vorrang. Gehwege sind tabu, ebenso Fussgängerzonen, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; ab 1. März 2027 reicht auch «Radverkehr frei», dann im Schritttempo. Diese Regeln setzt der Bund.',
        '**Innenstadt:** Die Kröpeliner Strasse und ihr Umfeld sind Fussgängerzone (Zonenkarte der Stadt, Stand Juli 2021); dort schiebst du.',
        '**Einbahnstrassen:** Bei «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die StVO lässt dich mitfahren, die eKFV verlangt «Elektrokleinstfahrzeuge frei». Die Stadt schreibt knapp, «Rad frei» gelte nicht für E-Tretroller. Ab 1. März 2027 ist die Gegenrichtung erlaubt, wo «Radverkehr frei» sie öffnet.',
        '**Parks:** Die Grünflächensatzung von 2009 verbietet in städtischen Grün- und Parkanlagen, sie «mit Kraftfahrzeugen zu befahren» und Fahrzeuge abzustellen (§ 4), bei 5 bis 1000 € Geldbusse (§ 11). E-Scooter nennt sie nicht, laut eKFV sind sie aber Kraftfahrzeuge. Für uns heisst das: In den Wallanlagen und anderen städtischen Parks schiebst du, auch auf den Wegen.',
        '**IGA Park:** Die Parkordnung (Februar 2025) verbietet «das Befahren mit Kraftfahrzeugen sowie das Abstellen dieser auf Wegen und Grünflächen»; «das Fahrradfahren erfolgt auf eigene Gefahr». Bei Verstössen darf das Personal ein «erhöhtes Nutzungsentgelt» von 20 € kassieren. Auch hier schiebst du nach unserer Lesart.',
        '**Strand:** Die Strandsatzung von 2026 verbietet an den Stränden von Diedrichshagen, Warnemünde, Hohe Düne, Markgrafenheide und der Rostocker Heide «das Abstellen und Fahren von Fahrzeugen, auch von Fahrrädern und Booten», bei bis zu 1000 € Geldbusse. Für Strandpromenade und Alten Strom fanden wir keine eigene E-Scooter-Regel; dort gelten die Schilder.',
        '**Nacht, Saison, Campus:** Ein Nachtfahrverbot, eine Saisonpause oder eine Campusregel der Universität fanden wir nicht.',
      ],
    },
    {
      heading: 'E-Scooter in Rostock abstellen: Sperrzonen, Abstellflächen, Obergrenzen',
      blocks: [
        'Laut Stadt sperren die Anbieter das Fahrtende per Geofencing in Parkverbotszonen, etwa in Grün- und Parkanlagen, an den Uferbereichen der Warnow und in den Fussgängerzonen. Im März 2026 arbeitete die Stadt laut Nordkurier an Abstellverbotszonen an stark genutzten Haltestellen. Welche gelten, zeigt die App.',
        '**Feste Abstellflächen:** Im Oktober 2025 gab es laut Stadt acht markierte Flächen, etwa am Neuen Markt; rund 20 in der Innenstadt sollten noch 2025 entstehen (Nordkurier, 16. Oktober 2025). Im März 2026 entstanden sie unter anderem an Mobilpunkten, weitere sollten 2026 folgen, auch in Warnemünde (Nordkurier, 18. März 2026). Den Stand vom Oktober 2026 fanden wir nicht. Wo eine Gemeinde Parkplätze ausweist, parkst du laut Dotts Bedingungen nur dort.',
        'Sonst gelten die Regeln für Fahrräder: Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird.',
        {
          table: {
            caption: 'Wo du in Rostock keinen E-Scooter abstellst (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Parks, Warnowufer, Fussgängerzonen; geplant: belebte Haltestellen', 'Die Fahrt lässt sich nicht beenden', 'Stadt, Vereinbarung mit den Anbietern'],
              ['Gehweg', 'Mindestens 1,80 m frei lassen, am Rand abstellen', 'Stadt'],
              ['Blindenleitstreifen, Bordsteinabsenkungen, Zebrastreifen, Fussgängerfurten, Ampelquerungen', 'Freihalten', 'Stadt'],
              ['Haltestellen, schwer einsehbare Kurven, Werbeanlagen wie Litfasssäulen', 'Nicht abstellen', 'Stadt'],
              ['Strand und Dünen', 'Kein Abstellen und kein Fahren', 'Strandsatzung der Stadt'],
              ['IGA Park, Wege und Grünflächen', 'Kein Abstellen und kein Fahren', 'Parkordnung des IGA Parks'],
            ],
          },
        },
        '**Obergrenzen:** Laut Stadt dürfen seit dem Winter 2021 höchstens 2000 Leih-Scooter in Rostock stehen, je Anbieter 660, in der Innenstadt zusammen 500 und in Warnemünde 120, höchstens fünf je Anbieter an einem Ort.',
        '**Kontrolle:** Laut Stadt ahnden Ordnungsdienst und Polizei Verstösse gegen die StVO; für die Parkverbotszonen sind die Anbieter selbst verantwortlich. Blockiert ein Scooter den Gehweg, muss der Anbieter ihn sofort entfernen, sonst lässt ihn die Stadt kostenpflichtig wegräumen. Im Oktober 2025 nahm die Bürgerschaft einen Antrag an, der laut Nordkurier unter anderem Pflicht-Abstellfotos in den Apps und klare Eingriffsmöglichkeiten des Ordnungsdienstes vorsieht. Eine neue Satzung fanden wir bis Oktober 2026 nicht.',
        {
          note: 'MOIN verlangt am Fahrtende ein vollständiges Foto des korrekt geparkten Scooters, Dott kann eines anfordern. Mach es deutlich.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Rostock: Bussgelder und Alkohol',
      blocks: [
        'In Rostock gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, die Stadt rät aber dringend zum Helm; bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Leih-Scooter bekommst du bei den Anbietern erst ab 18.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Nebeneinander gefahren', '15 €, bis 30 €', 'Erlaubt, wenn niemand behindert wird'],
              ['Zu zweit gefahren', '10 €', '25 €'],
              ['Rote Ampel', '60 € und 1 Punkt; länger als 1 Sekunde rot: 100 € und 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 € und 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Unzulässig auf Geh- oder Radweg geparkt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', '55 €, mit Behinderung 70 €'],
            ],
          },
        },
        '**Alkohol:** Es gelten die Grenzen fürs Auto. Ab 0,5 Promille drohen 500 €, 2 Punkte und ein Monat Fahrverbot, auch fürs Auto; wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall. Unter 21 oder in der Probezeit gilt 0,0 Promille. Alles Weitere steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus, S-Bahn und Fähre: RSAG und VVW',
      blocks: [
        'In den Strassenbahnen und Bussen der RSAG, in S-Bahn und Regionalzug und auf den Warnowfähren gilt der Tarif des Verkehrsverbunds Warnow (VVW), gültig ab 1. Dezember 2025. Anders als in [Kiel](guide:kiel), wo Busse und Fördefähren keine E-Scooter mehr mitnehmen, darf dein eigener Scooter hier mit:',
        {
          list: [
            '**Zusammengeklappt:** Ein E-Tretroller ohne Sitz zählt dann als Traglast; neben dem Handgepäck fährt eine Traglast kostenlos mit.',
            '**Nicht zusammengeklappt:** Du brauchst eine Fahrradkarte, in der Zone Rostock 2,30 € für 90 Minuten, für eine Fährüberfahrt 1,40 €, fürs ganze Netz des VVW 4,50 €. Mit darf er nur, wenn Platz ist.',
            '**Ausgeschlossen:** E-Tretroller mit Sitz, und in der Bäderbahn Molli fährt gar kein E-Tretroller mit.',
            '**Immer:** In Fahrzeugen und auf Bahn- und Fähranlagen fährst du nicht. Einen Anspruch auf Mitnahme hast du nicht, im Zweifel entscheidet das Personal.',
          ],
        },
        '**Leih-Scooter** lassen sich nicht zusammenklappen. Beende die Fahrt vor der Haltestelle und halte die Zugänge frei. Im Fernverkehr der Deutschen Bahn fährt dein eigener Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit; lässt er sich nicht klappen, gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst.',
      ],
    },
    {
      heading: 'Warnemünde, Hanse Sail, Ostseestadion und Kurioses',
      blocks: [
        '**Warnemünde:** Auch auf der Warnowfähre der Weissen Flotte nach Hohe Düne gilt der VVW-Tarif: Zusammengeklappt fährt dein eigener Scooter kostenlos mit.',
        '**Hanse Sail:** Die nächste läuft vom 5. bis 8. August 2027 in Rostock und Warnemünde. Im August 2024 bat die Tourismuszentrale, Räder und E-Scooter ausserhalb des Veranstaltungsgeländes jenseits der L22 abzustellen; was in Fluchtwegen steht, wird entfernt. Eine E-Scooter-Regel fanden wir nicht.',
        '**Ostseestadion:** Die Stadionordnung vom August 2025 verbietet, ohne Erlaubnis der Stadiongesellschaft oder des Veranstalters «das Stadiongelände mit Fahrzeugen aller Art zu befahren». Freie Scooter nach dem Abpfiff zeigt die [Live-Karte von Rostock](map:de:Rostock).',
        {
          list: [
            '**Rekord im Warnstreik:** Am 17. März 2025, einem Tag mit Warnstreik bei den Rostocker Verkehrsbetrieben, zählte Voi laut eigener Mitteilung rund 2500 Fahrten binnen 24 Stunden.',
            '**Quer durch die Stadt:** Eine Voi-Fahrt am 1. Mai 2024 mass 32,3 km, von Toitenwinkel über die Innenstadt nach Warnemünde, und endete nach über zwei Stunden.',
            '**Strom von der Ostsee:** MOIN lädt seine Rostocker Scooter laut eigener Seite mit «grünem Ostsee-Strom» der Stadtwerke Rostock.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Rostock?',
      answer: 'Voi, Dott und MOIN. Die ScootRadar-Karte zeigt Voi und Dott; MOIN findest du nur in seiner App. Bolt und Ryde führen Rostock nicht unter ihren Städten.',
    },
    {
      question: 'Was kostet ein E-Scooter in Rostock?',
      answer: 'Einen Rostocker Tarif nennt kein Anbieter offen; verbindlich ist der Preis in der App. Falschparken kann bei Dott bis zu 300 € Rückholkosten bringen; MOIN nennt 35 € für «falsch geparkt, kein Foto am Fahrtende gemacht».',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Kröpeliner Strasse fahren?',
      answer: 'In der Fussgängerzone bis 28. Februar 2027 nur mit dem Schild «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 darfst du, wo und wann «Radverkehr frei» gilt, im Schritttempo fahren. Beenden lässt sich die Fahrt dort laut Stadt nicht.',
    },
    {
      question: 'Darf ich in Warnemünde am Strand E-Scooter fahren?',
      answer: 'Nein. Die Strandsatzung verbietet am Strand das Fahren und Abstellen von Fahrzeugen, auch von Fahrrädern, bei bis zu 1000 € Geldbusse. Auf der Promenade gelten die Schilder; auf Gehwegen schiebst du.',
    },
    {
      question: 'Darf ich einen E-Scooter in Strassenbahn oder S-Bahn mitnehmen?',
      answer: 'Zusammengeklappt ja, kostenlos als Traglast, auch auf den Warnowfähren. Sonst brauchst du eine Fahrradkarte, in der Zone Rostock 2,30 €, und es muss Platz sein. Leih-Scooter lassen sich nicht klappen.',
    },
    {
      question: 'Warum kann ich meine Fahrt nicht beenden?',
      answer: 'Du stehst in einer Parkverbotszone, etwa in einem Park, am Warnowufer oder in einer Fussgängerzone, oder ausserhalb des Gebiets. Fahr ein Stück weiter; solange die Fahrt läuft, zahlst du.',
    },
  ],
  sources: [
    { title: 'Stadt Rostock: E-Tretroller und Elektrokleinstfahrzeuge in Rostock', url: 'https://rathaus.rostock.de/de/leih_e_scooter/323713' },
    { title: 'Stadt Rostock: Nutzerbefragung Leih-E-Tretroller, Bericht vom Mai 2022 (PDF)', url: 'https://rathaus.rostock.de/sixcms/media.php/rostock_01.a.4984.de/datei/Bericht%20Nutzerbefragung%20Leih-E-Tretroller%20Rostock%202021.pdf' },
    { title: 'Nordkurier: Wildes Abstellen von E-Scootern: Rostock will Gefahr eindämmen (16. Oktober 2025)', url: 'https://www.nordkurier.de/regional/rostock/wildes-abstellen-von-e-scootern-rostock-will-gefahr-eindaemmen-4011927' },
    { title: 'Nordkurier: Ärger rund um E-Roller: So will Rostock gegensteuern (18. März 2026)', url: 'https://www.nordkurier.de/regional/rostock/immer-wieder-sorgen-e-scooter-fuer-aerger-so-soll-fuer-sichere-nutzung-gesorgt-werden-4442114' },
    { title: 'Stadt Rostock: Abstellverbotszonen für E-Tretroller, Innenstadt, Juli 2021 (PDF)', url: 'https://rathaus.rostock.de/media/rostock_01.a.4984.de/datei/Zonen%20e-Tretroller-Verleiher%20-%20Innenstadt%20-%20Juli21.pdf' },
    { title: 'Stadt Rostock: Grünflächensatzung von 2009 (PDF)', url: 'https://rathaus.rostock.de/sixcms/media.php/rostock_01.a.1107.de/datei/7_04.46475.pdf' },
    { title: 'Stadt Rostock: Strandsatzung von 2026 (PDF)', url: 'https://rathaus.rostock.de/sixcms/media.php/rostock_01.a.1107.de/datei/3%2003%20%28P005382930%29.pdf' },
    { title: 'Stadt Rostock: Unbeschwert zur 33. Hanse Sail (2. August 2024)', url: 'https://rathaus.rostock.de/de/aktuelles_medien/verkehr_und_sicherheit/374361' },
    { title: 'IGA Park Rostock: Parkordnung, Februar 2025 (PDF)', url: 'https://iga-park-rostock.de/wp-content/uploads/2025/02/Parkordnung-IGA-Park.pdf' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung (eKFV), § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'VVW: Verbundtarif, gültig ab 1. Dezember 2025 (PDF)', url: 'https://www.rsag-online.de/fileadmin/media/PDF_Download/Verbundtarif_g%C3%BCltig_ab_01.12.2025.pdf' },
    { title: 'RSAG: Mitnahme von Sachen', url: 'https://www.rsag-online.de/tickets/mitnahme-von-sachen' },
    { title: 'Weisse Flotte: Fahrpreise Warnow-Fähre', url: 'https://www.frs-weisse-flotte.de/fahrpreise/warnow-faehre' },
    { title: 'MOIN. Scooters & Cars', url: 'https://moin-sharing.app/' },
    { title: 'MOIN. Scooters: Gebührenordnung, AGB und Datenschutz', url: 'https://moin-sharing.app/gebuehrenordnung-agb-moin-scooters' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Voi: Pressemitteilung zu Rostock, 14. Mai 2025 (PDF)', url: 'https://storage.mfn.se/eb7643d5-5917-445f-974f-f0bfc3b35122/3-jahre-voi-in-rostock.pdf' },
    { title: 'Bolt: Städte', url: 'https://bolt.eu/de-de/cities/' },
    { title: 'Ryde: Locations', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Hanse Sail Rostock 2027', url: 'https://www.hansesail.com/' },
    { title: 'Ostseestadion: Stadionordnung, August 2025 (PDF)', url: 'https://www.fch.de/files/pdf/Sicherheit/Stadionordnung_August%202025.pdf' },
  ],
};

export default guide;
