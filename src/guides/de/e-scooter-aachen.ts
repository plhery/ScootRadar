import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-aachen',
  topic: 'aachen',
  name: 'E-Scooter Aachen: Anbieter, Preise, Parken',
  title: 'E-Scooter Aachen 2026: Anbieter, Preise, Parken, Grenze',
  description: 'E-Scooter Aachen: vier Anbieter, was zehn Minuten kosten, wo du an Dom und Hauptbahnhof parkst und was im ASEAG-Bus und in Vaals oder Kelmis gilt.',
  headline: 'E-Scooter Aachen: Anbieter, Preise, Abstellflächen, ASEAG-Bus und die Grenze zu Vaals und Kelmis',
  lede: 'Einen E-Scooter in Aachen leihst du ab 18 und ohne Führerschein bei Dott, Voi, RideMovi oder Ryde, laut Stadt je 500 Stück (Stand Oktober 2026). Zehn Minuten kosten bei Voi im Standardtarif 2,89 €, bei Dott 4,30 €. Rund um Dom, Markt und Elisenbrunnen endet eine Dott-Fahrt nur an einer Station, sonst läuft die Miete weiter. Nach Vaals oder Kelmis kommst du mit Dott nicht: Das Gebiet endet noch auf Aachener Seite.',
  published: '2026-10-17',
  updated: '2026-10-24',
  city: 'de:Aachen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Aachen?',
      blocks: [
        'Vier Anbieter vermieten im Oktober 2026 E-Scooter in Aachen, laut Stadt jeweils 500, zusammen 2000:',
        {
          list: [
            '**Voi**, seit Oktober 2019;',
            '**Dott**, seit Februar 2020, bis Oktober 2024 unter dem Namen TIER;',
            '**RideMovi**, seit 30. April 2024;',
            '**Ryde**, seit März 2026.',
          ],
        },
        'Bolt fährt in Aachen laut Website nur mit Auto und Taxi, Lime gar nicht (Stand 17. Oktober 2026).',
        'Gemietet wird in der App des Anbieters: [So mietest du einen E-Scooter](guide:how-to-rent). Laut Stadt kannst du die E-Scooter aller Anbieter auch in der App movA buchen, zusammen mit Bus und Bahn.',
        'Auf der [Karte von Aachen](map:de:Aachen) zeigt ScootRadar Dott und seit dem 24. Oktober 2026 auch Voi: an jenem Samstag kurz nach 15 Uhr rund 430 Dott- und 450 Voi-Scooter, die zu diesem Zeitpunkt frei waren. Zoomst du hinein, zeichnet sie die 23 eingerichteten Abstellflächen der Stadt Aachen und die Abstellverbotszonen um sie herum (offene Daten, DL-DE BY 2.0). RideMovi und Ryde fehlen auf der Karte; ihre Scooter siehst du nur in ihren Apps.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Aachen?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Aachen (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi, Standardtarif (Website, 17. Oktober 2026)', '0,49 €', '0,24 €', '2,89 €', '5,29 €'],
              ['Dott (Datenfeed, 24. Oktober 2026)', '1,00 €', '0,33 €', '4,30 €', '7,60 €'],
            ],
          },
        },
        'Voi verkauft daneben Minutenpakete und einen Voi Pass. RideMovi und Ryde nennen auf ihren Websites keinen Preis für Aachen, ihren Tarif zeigt die App. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'E-Scooter in Aachen parken: Abstellflächen und Verbotszonen',
      blocks: [
        'Abstellen darfst du laut Stadt wie ein Fahrrad, ohne jemanden zu behindern: nicht vor Einfahrten, auf Blindenleitsystemen, an Bushaltestellen oder auf Privatgrund. Die Qualitätsvereinbarung der Stadt mit den Anbietern verlangt 2 m freien Gehweg und schliesst Parks, Grünanlagen und Grünstreifen aus. Die Abstellverbotszonen zeigt die Stadt in ihrem Geoportal.',
        'In der Innenstadt richtet die Stadt markierte Abstellflächen ein, meist auf früheren Pkw-Parkplätzen. Auf der Fahrbahn erkennst du sie am blauen Parken-Schild mit Zusatzzeichen für E-Tretroller, auf dem Gehweg an markierten Ecken und einem Piktogramm am Boden. Im Umkreis von 150 bis 200 m darfst du den Scooter nur auf der Fläche abstellen. Die Zonen stimmt die Stadt mit den Anbietern ab, die sie in ihren Apps umsetzen. Stellst du den Scooter daneben ab, läuft die Mietzeit laut Stadt «kostenpflichtig» weiter.',
        'Im Frühjahr 2025 waren zehn Flächen markiert, etwa an der Schanz, am Hauptbahnhof, am Karlsgraben 25, am Templergraben 51 und zweimal an der Pontstrasse. 28 weitere wurden im Mai 2025 beschlossen. Ziel ist eine Fläche etwa alle 200 m.',
        'Bei Dott sieht das so aus:',
        {
          table: {
            caption: 'Parken mit Dott in Aachen laut Datenfeed (Stand 17. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wo du die Fahrt beendest'],
            rows: [
              ['Dom, Markt, Elisenbrunnen, Pontstrasse bis Ponttor, SuperC', 'Nur an Stationen', 'z. B. «Chio Elisenbrunnen», 40 m vom Elisenbrunnen'],
              ['Hauptbahnhof, Bahnhofsvorplatz', 'Nur an Stationen', '«HBF Vorplatz 2»'],
              ['Kaiserplatz, Theaterplatz', 'Nur an Stationen', 'Kaiserplatz: «Steffensplatz», rund 190 m'],
              ['Westpark, Kurpark Burtscheid, FH an der Eupener Strasse, Königshügel', 'Parkverbot', 'ausserhalb der Zone'],
              ['Lousberg, Hangeweiher, Frankenberger Park', 'Ausserhalb des Gebiets', 'am Rand davor'],
              ['Campus Melaten, Uniklinik, Audimax, Tivoli, Reitstadion', 'Frei abstellen', 'vor Ort, nach den Regeln oben'],
            ],
          },
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder neben der Fläche. Schieb den Scooter zur nächsten Station, die die App zeigt. Falsch abgestellte Scooter meldest du in der App des Anbieters oder im Mängelmelder der Stadt (maengelmelder.aachen.de).',
        },
      ],
    },
    {
      heading: 'Wo darf man in Aachen fahren? Regeln und Bussgelder',
      blocks: [
        'In Aachen gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette. Du fährst auf dem Radweg, dem gemeinsamen Geh- und Radweg, dem Radfahr- oder Schutzstreifen oder in der Fahrradstrasse. Nur wo es nichts davon gibt, fährst du auf der Fahrbahn. Auf Gehwegen und in Fussgängerzonen fährst du nicht, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, und dann im Schritttempo. Ab 1. März 2027 gilt das auch, wo «Radverkehr frei» steht. Und du fährst allein.',
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
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
        'Eine nächtliche Sperrzeit nennen weder die Stadt noch Dotts Datenfeed; Voi vermietet laut Website rund um die Uhr. Langsamfahrzonen enthält Dotts Datenfeed keine.',
      ],
    },
    {
      heading: 'Obergrenze und Ausschreibung: Was die Stadt beschlossen hat',
      blocks: [
        'Grundlage ist bislang eine Qualitätsvereinbarung, die jeder Anbieter mit der Stadt unterschreibt (Fassung von 2020). Prüft ein Anbieter eine Beschwerde nicht binnen 24 Stunden, entfernt die Stadt die Scooter auf seine Kosten.',
        'Am 4. September 2025 hat der Mobilitätsausschuss neue Sharing-Leitlinien beschlossen, einstimmig bei zwei Enthaltungen:',
        {
          list: [
            'höchstens 2250 Scooter in der ganzen Stadt, davon 300 innerhalb des Alleenrings;',
            'höchstens drei Anbieter mit je 750 Scootern, ausgewählt über eine Ausschreibung;',
            'innerhalb des Alleenrings Abstellen nur noch auf markierten Flächen;',
            'eine gebührenpflichtige Erlaubnis für vier Jahre statt der Vereinbarung, in den Aussenbezirken bis 40 % günstiger;',
            'von 22 bis 6 Uhr stellen die Anbieter keine Scooter um und warten keine; fahren darfst du weiter.',
          ],
        },
        'In Kraft ist das noch nicht: Zuerst passt die Stadt die Gebühren an, dann folgt die Ausschreibung. Im März 2026 sagte die Verwaltung im Ausschuss, der Prozess ziehe sich noch hin. Im Oktober 2026 nennt die Website der Stadt weiter die Qualitätsvereinbarung und vier Anbieter mit je 500 Scootern. Mit der Ausschreibung kann sich ändern, wer in Aachen vermietet.',
      ],
    },
    {
      heading: 'E-Scooter im Bus: Was bei ASEAG und AVV gilt',
      blocks: [
        'In den Bussen der ASEAG fährt dein eigener E-Scooter zusammengeklappt jederzeit und ohne Ticket mit, als Handgepäck. Lässt er sich nicht klappen, behandelt die ASEAG ihn wie ein Fahrrad: Du brauchst ein Ticket und steigst nur an Wochentagen nach 19 Uhr, samstags ab 15 Uhr und an Sonn- und Feiertagen ganztägig ein, wenn Platz ist. Rollstühle und Kinderwagen haben Vorrang; wird es eng, entscheidet das Fahrpersonal. Die Regel vom März 2024 steht im Oktober 2026 weiter online; anders als die KVB in Köln nimmt die ASEAG E-Scooter also mit.',
        'Für Regionalzüge ab Aachen Hbf oder Aachen West schrieb der AVV 2019: zusammengeklappt kostenlos als Gepäck, sonst wie ein Fahrrad mit Ticket. Die Mitteilung steht heute im Archiv: Frag im Zweifel beim AVV nach. Über die Grenze fährst du mit dem euregioticket, einem Tagesticket für Bus und Bahn in der ganzen Euregio Maas-Rhein.',
        'Im Fernverkehr der Deutschen Bahn, etwa im ICE ab Aachen Hbf, fährt dein Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden. Lässt er sich nicht klappen, gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst, etwa im Gepäckregal.',
        'Leih-Scooter lassen sich nicht zusammenklappen. Mit ihnen beendest du die Fahrt an der Haltestelle und steigst ohne Scooter ein.',
      ],
    },
    {
      heading: 'Mit dem E-Scooter nach Vaals oder Kelmis?',
      blocks: [
        'Mit Dott nicht: Das Gebiet endet laut Datenfeed noch auf Aachener Seite, an der Vaalser Strasse rund 750 m vor der Grenze und etwa 1,5 km vor dem Ortskern von Vaals. Bis Kelmis fehlen rund 6 km. Schon Vaalserquartier und Seffent liegen ausserhalb. Bei Voi, RideMovi und Ryde prüfst du die Zone in der App, bevor du losfährst.',
        'Für den eigenen Scooter gelten jenseits der Grenze andere Regeln:',
        {
          list: [
            '**Niederlande (Vaals):** Eine E-Step ohne Tretunterstützung darf laut Rijksoverheid nur auf die Strasse, wenn die RDW das Modell genehmigt hat; die meisten Modelle sind nicht genehmigt. Seit 1. Juli 2026 braucht sie laut RDW zudem ein Kennzeichen. Sonst kann die Polizei ein Bussgeld verhängen oder den Roller beschlagnahmen. Eine Ausnahme für Scooter aus Deutschland nennen beide Stellen nicht.',
            '**Belgien (Kelmis, Wallonie):** Seit Juli 2022 E-Scooter erst ab 16, jüngere nur etwa auf dem RAVeL-Netz oder in Spielstrassen. Gehwege sind tabu, Fussgängerzonen nur, wo ein Schild es erlaubt, und dann im Schritttempo. Mitfahrer sind verboten.',
          ],
        },
        'Kommst du aus den Niederlanden oder Belgien nach Aachen, gelten hier die deutschen Regeln: Leih-Scooter ab 18, höchstens 20 km/h, kein Gehweg.',
      ],
    },
    {
      heading: 'Hauptbahnhof, Aachen West, RWTH, Soers: Tipps für Aachen',
      blocks: [
        '**Hauptbahnhof:** Am Vorplatz hat die Stadt eine markierte Fläche; eine Dott-Fahrt endet dort nur an der Station «HBF Vorplatz 2».',
        '**Aachen West:** Nur der Gleisbereich liegt ausserhalb von Dotts Gebiet, auf den Strassen zu beiden Seiten beendest du die Fahrt frei.',
        '**RWTH:** SuperC und Kármán-Auditorium liegen in der Zone, in der die Fahrt nur an Stationen endet, etwa «Eilfschornstr.» oder «Pontdriesch». Am Audimax, an der Mensa Academica, auf dem Campus Melaten und an der Uniklinik stellst du bei Dott frei ab.',
        '**Soers und CHIO:** Das Reitstadion und der Tivoli liegen in Dotts Gebiet, ohne Parkverbot (Stand Oktober 2026). Der nächste CHIO Aachen läuft vom 25. Juni bis 4. Juli 2027. Der CHIO empfiehlt ab Hauptbahnhof die ASEAG-Linie 51 bis «Sportpark Soers», zum Turnier auch den Shuttle C; Fahrräder parkst du am Vorplatz und am Soerser Weg. Zu E-Scootern sagt der CHIO nichts.',
        '**Verlautenheide:** Seit 2. Juni 2026 reicht das Gebiet der vier Anbieter bis zur Haltestelle Verlautenheide Endstrasse, mit einer virtuellen Abstellzone neben der Pedelec-Station (Pilotversuch).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Aachen nutzen?',
      answer: 'Die von Dott, Voi, RideMovi und Ryde, Stand Oktober 2026. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Dott- und Voi-Scooter zeigt auch die [Live-Karte von Aachen](map:de:Aachen), die von RideMovi und Ryde nur deren Apps.',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Aachen?',
      answer: 'Bei Voi im Standardtarif 2,89 € (0,49 € Entsperren plus 0,24 € pro Minute), bei Dott 4,30 € (1 € Entsperren plus 0,33 € pro Minute), Stand 24. Oktober 2026. RideMovi und Ryde zeigen ihren Preis in der App.',
    },
    {
      question: 'Warum kann ich meine Fahrt am Dom oder am Elisenbrunnen nicht beenden?',
      answer: 'Rund um die markierten Abstellflächen der Stadt darfst du nur auf der Fläche abstellen. Bei Dott endet die Fahrt rund um Dom, Markt, Elisenbrunnen und Pontstrasse nur an einer Station, etwa «Chio Elisenbrunnen»; sonst läuft die Miete weiter.',
    },
    {
      question: 'Darf ich einen E-Scooter im ASEAG-Bus mitnehmen?',
      answer: 'Ja. Zusammengeklappt fährt dein eigener Scooter jederzeit kostenlos als Handgepäck mit. Lässt er sich nicht klappen, brauchst du ein Ticket und darfst nur an Wochentagen nach 19 Uhr, samstags ab 15 Uhr und sonn- und feiertags einsteigen, wenn Platz ist (Stand März 2024).',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter nach Vaals oder Kelmis fahren?',
      answer: 'Mit Dott nicht: Das Gebiet endet laut Datenfeed noch in Aachen, etwa 1,5 km vor dem Ortskern von Vaals und rund 6 km vor Kelmis. Bei Voi, RideMovi und Ryde zeigt die App, wie weit die Zone reicht.',
    },
  ],
  sources: [
    { title: 'Stadt Aachen: Sharing, E-Tretroller in Aachen', url: 'https://www.aachen.de/in-aachen-leben/mobilitaet-verkehr/mobilitaetsangebote/sharing/' },
    { title: 'Stadt Aachen: Abstellflächen und Verbotszonen für E-Tretroller im Geoportal (offene Daten, Datenlizenz Deutschland – Namensnennung 2.0)', url: 'https://geoportal.aachen.de/extern/?lang=de&basemap=web61482881ca3e4ky73o&blop=1&x=294513.5&y=5627463.5&zl=13&hl=0&layers=abstellverbotszonenfuere-tretroller6800dcc02f4cftv3eg|abstellflaechenfueretretroller6800dcc02f477wfems' },
    { title: 'Stadt Aachen: Qualitätsvereinbarung für E-Tretroller-Verleihsysteme (Stand 1. November 2020, PDF)', url: 'https://www.aachen.de/in-aachen-leben/mobilitaet-verkehr/mobilitaetsangebote/sharing/qualitaetsvereinbarung-stadt-aachen-e-tretrollerverleihsystemen.pdf?cid=utd' },
    { title: 'Stadt Aachen: Mobilitätsangebote für Neubürger (Dezember 2025, PDF)', url: 'https://www.aachen.de/in-aachen-leben/mobilitaet-verkehr/mobilitaetskonzepte/mobilitaet-fuer-neubuerger-innen/mobilitaetsangebote-in-aachen-fuer-neubuergerinnen-de.pdf' },
    { title: 'Stadt Aachen, Vorlage FB 68/0107/WP18: Abstellflächen für E-Tretroller (September 2024, PDF)', url: 'https://ratsinfo.aachen.de/public/wicket/resource/org.apache.wicket.Application/doc1016761.pdf' },
    { title: 'Stadt Aachen, Vorlage FB 68/0182/WP18: weitere Abstellflächen für E-Tretroller (Mai 2025)', url: 'https://ratsinfo.aachen.de/public/vo020?VOLFDNR=1001819&refresh=false&TOLFDNR=1013367' },
    { title: 'Stadt Aachen, Vorlage FB 68/0250/WP18: Anpassung der Sharing-Leitlinien (Juli 2025, PDF)', url: 'https://ratsinfo.aachen.de/public/wicket/resource/org.apache.wicket.Application/doc1421017.pdf' },
    { title: 'Stadt Aachen: Niederschrift des Mobilitätsausschusses vom 4. September 2025 (PDF)', url: 'https://ratsinfo.aachen.de/public/wicket/resource/org.apache.wicket.Application/doc1437763.pdf' },
    { title: 'Stadt Aachen: Mobilitätsausschuss am 19. März 2026, Bericht zu E-Tretrollern', url: 'https://ratsinfo.aachen.de/public/to020?TOLFDNR=1022162&SILFDNR=1000464' },
    { title: 'Stadt Aachen: E-Tretroller fahren nun bis nach Verlautenheide (8. Juni 2026)', url: 'https://www.aachen.de/services/presse/pressemitteilungen/2026/juni/080626-verlautenheide-e-tretroller' },
    { title: 'Dott: offener Datenfeed für Aachen (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/aachen/gbfs.json' },
    { title: 'Voi: E-Scooter in Aachen', url: 'https://www.voi.com/de/city/aachen' },
    { title: 'NRW.Mobidrom: Mobilitätsdaten des Landes NRW, mit Vois offenen Datenfeeds', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'ASEAG: Das gilt für E-Tretroller in den Bussen der ASEAG (20. März 2024)', url: 'https://www.aseag.de/aktuelles/detail/e-tretroller' },
    { title: 'AVV: E-Tretroller dürfen in Bus und Bahn transportiert werden (17. Juli 2019)', url: 'https://avv.de/de/aktuelles/neuigkeiten/e-tretroller-duerfen-in-bus-und-bahn-transportiert-werden' },
    { title: 'Deutsche Bahn: E-Scooter im Fernverkehr', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Rijksoverheid: Regels voor elektrische steps (e-steps)', url: 'https://www.rijksoverheid.nl/themas/verkeer-en-vervoer/voertuigen-op-de-weg/bijzondere-bromfiets/elektrische-step' },
    { title: 'RDW: Bijzondere bromfietsen met kenteken de weg op (18. Juni 2026)', url: 'https://www.rdw.nl/nieuws/2026/bijzondere-bromfietsen-met-kenteken-de-weg-op' },
    { title: 'Wallonie: Trottinettes électriques, nouvelles règles en vigueur (Juli 2022)', url: 'https://www.wallonie.be/fr/actualites/trottinettes-electriques-nouvelles-regles-en-vigueur' },
    { title: 'CHIO Aachen: Noch 300 Tage bis zur Eröffnungsfeier 2027 (2. September 2026)', url: 'https://www.chioaachen.de/de/news/der-chio-aachen-2027-noch-300-tage-bis-zur-eroeffnungsfeier/' },
    { title: 'CHIO Aachen: Anfahrt', url: 'https://www.chioaachen.de/informationen-fuer-besucher/anfahrt' },
  ],
};

export default guide;
