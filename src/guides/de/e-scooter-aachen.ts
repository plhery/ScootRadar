import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-aachen',
  topic: 'aachen',
  name: 'E-Scooter Aachen: Anbieter, Parken, Regeln',
  title: 'E-Scooter Aachen 2026: Anbieter, Parken, Bus, Regeln',
  description: 'E-Scooter Aachen: vier Anbieter, wo du abstellst, was im ASEAG-Bus und im ICE gilt, welche Bussgelder drohen und was für den eigenen Scooter in Vaals gilt.',
  headline: 'E-Scooter Aachen: Anbieter, Abstellflächen, Regeln, ASEAG-Bus und die Grenze zu Vaals',
  lede: 'Einen E-Scooter in Aachen leihst du ohne Führerschein bei Dott, Voi, RideMovi oder Ryde, laut Stadt je 500 Stück (Stand Oktober 2026). Mindestalter und Preis zeigt dir die App vor dem Entsperren. Abstellen darfst du wie ein Fahrrad, ohne jemanden zu behindern; in der Innenstadt und in den Stadtbezirken richtet die Stadt eigene Abstellzonen ein. Dein eigener Scooter fährt zusammengeklappt kostenlos im ASEAG-Bus mit.',
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
        'Gemietet wird in der App des Anbieters: [So mietest du einen E-Scooter](guide:how-to-rent). Laut Stadt kannst du die E-Scooter aller Anbieter auch in der App movA buchen, zusammen mit Bus und Bahn.',
        'Am Samstag, 24. Oktober 2026, kurz nach 15 Uhr zeigte die [Karte von Aachen](map:de:Aachen) rund 430 Dott- und 450 Voi-Scooter, die zu diesem Zeitpunkt frei waren.',
      ],
    },
    {
      heading: 'E-Scooter in Aachen parken: Abstellflächen und Verbotszonen',
      blocks: [
        'Abstellen darfst du laut Stadt wie ein Fahrrad, ohne jemanden zu behindern: nicht vor Einfahrten, auf Blindenleitsystemen, an Bushaltestellen oder auf Privatgrund. Gibt es eine ausgewiesene Abstellfläche, stellst du ihn dort ab; die Flächen zeigt auch die App.',
        'Um das Abstellen weiter zu regeln, richtet die Stadt in der Innenstadt und in den Stadtbezirken eigene Abstellzonen ein. Weitere plant sie dort, wo E-Scooter besonders oft im Weg stehen, etwa vor Bahnhöfen, Krankenhäusern und Hochschulen. Die Abstellverbotszonen zeigt die Stadt in ihrem Geoportal.',
        'Für die Anbieter gilt bislang eine Qualitätsvereinbarung, die jeder mit der Stadt unterschreibt (Fassung von 2020). Sie verlangt 2 m freien Gehweg und schliesst Parks, Grünanlagen und Grünstreifen aus. Prüft ein Anbieter eine Beschwerde nicht binnen 24 Stunden, entfernt die Stadt die Scooter auf seine Kosten.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, schieb den Scooter aus der Verbotszone oder zur nächsten Abstellfläche, die sie zeigt. Falsch abgestellte Scooter meldest du in der App des Anbieters oder im Mängelmelder der Stadt (maengelmelder.aachen.de).',
        },
      ],
    },
    {
      heading: 'Wo darf man in Aachen fahren? Regeln und Bussgelder',
      blocks: [
        'In Aachen gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette. Du fährst auf dem Radweg, dem gemeinsamen Geh- und Radweg, dem Radfahr- oder Schutzstreifen oder in der Fahrradstrasse. Nur wo es nichts davon gibt, fährst du auf der Fahrbahn. Auf Gehwegen und in Fussgängerzonen fährst du nicht, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, und dann im Schritttempo. Ab 1. März 2027 gilt das auch, wo «Radverkehr frei» steht. Und du fährst allein.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: ASEAG und Deutsche Bahn',
      blocks: [
        'In den Bussen der ASEAG fährt dein eigener E-Scooter zusammengeklappt jederzeit und ohne Ticket mit, als Handgepäck. Lässt er sich nicht klappen, behandelt die ASEAG ihn wie ein Fahrrad: Du brauchst ein Ticket und steigst nur an Wochentagen nach 19 Uhr, samstags ab 15 Uhr und an Sonn- und Feiertagen ganztägig ein, wenn Platz ist. Rollstühle und Kinderwagen haben Vorrang; wird es eng, entscheidet das Fahrpersonal. Die Regel vom März 2024 steht im Oktober 2026 weiter online; anders als die KVB in Köln nimmt die ASEAG E-Scooter also mit.',
        'Im Fernverkehr der Deutschen Bahn, etwa im ICE ab Aachen Hbf, fährt dein Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden. Lässt er sich nicht klappen, gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst, etwa im Gepäckregal.',
        'Leih-Scooter lassen sich nicht zusammenklappen. Mit ihnen beendest du die Fahrt an der Haltestelle und steigst ohne Scooter ein.',
      ],
    },
    {
      heading: 'Mit dem eigenen E-Scooter nach Vaals?',
      blocks: [
        'Jenseits der Grenze gelten andere Regeln. In den Niederlanden darf eine E-Step ohne Tretunterstützung laut Rijksoverheid nur auf die Strasse, wenn die RDW das Modell genehmigt hat; die meisten Modelle sind nicht genehmigt. Seit 1. Juli 2026 braucht sie laut RDW zudem ein Kennzeichen. Sonst kann die Polizei ein Bussgeld verhängen oder den Roller beschlagnahmen.',
        'Kommst du aus den Niederlanden oder Belgien nach Aachen, gelten hier die deutschen Regeln: höchstens 20 km/h, kein Gehweg.',
      ],
    },
    {
      heading: 'Soers und Verlautenheide: Tipps für Aachen',
      blocks: [
        '**Soers und CHIO:** Der nächste CHIO Aachen läuft vom 25. Juni bis 4. Juli 2027. Der CHIO empfiehlt ab Hauptbahnhof die ASEAG-Linie 51 bis «Sportpark Soers», zum Turnier auch den Shuttle C.',
        '**Verlautenheide:** Seit 2. Juni 2026 reicht das Gebiet der vier Anbieter bis zur Haltestelle Verlautenheide Endstrasse, mit einer virtuellen Abstellzone neben der Pedelec-Station (Pilotversuch).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Aachen nutzen?',
      answer: 'Die von Dott, Voi, RideMovi und Ryde, Stand Oktober 2026. Einen Führerschein brauchst du nicht; Mindestalter und Preis zeigt dir die App vor dem Entsperren. Freie Dott- und Voi-Scooter siehst du auch auf der [Live-Karte von Aachen](map:de:Aachen).',
    },
    {
      question: 'Wo darf ich in Aachen einen Leih-Scooter abstellen?',
      answer: 'Wie ein Fahrrad, ohne jemanden zu behindern: nicht vor Einfahrten, auf Blindenleitsystemen, an Bushaltestellen oder auf Privatgrund. Gibt es eine ausgewiesene Abstellfläche, stellst du ihn dort ab; die Flächen zeigt auch die App.',
    },
    {
      question: 'Darf ich einen E-Scooter im ASEAG-Bus mitnehmen?',
      answer: 'Ja. Zusammengeklappt fährt dein eigener Scooter jederzeit kostenlos als Handgepäck mit. Lässt er sich nicht klappen, brauchst du ein Ticket und darfst nur an Wochentagen nach 19 Uhr, samstags ab 15 Uhr und sonn- und feiertags einsteigen, wenn Platz ist (Stand März 2024).',
    },
  ],
  sources: [
    { title: 'Stadt Aachen: Sharing, E-Tretroller in Aachen', url: 'https://www.aachen.de/in-aachen-leben/mobilitaet-verkehr/mobilitaetsangebote/sharing/' },
    { title: 'Stadt Aachen: Abstellflächen und Verbotszonen für E-Tretroller im Geoportal (offene Daten, Datenlizenz Deutschland – Namensnennung 2.0)', url: 'https://geoportal.aachen.de/extern/?lang=de&basemap=web61482881ca3e4ky73o&blop=1&x=294513.5&y=5627463.5&zl=13&hl=0&layers=abstellverbotszonenfuere-tretroller6800dcc02f4cftv3eg|abstellflaechenfueretretroller6800dcc02f477wfems' },
    { title: 'Stadt Aachen: Qualitätsvereinbarung für E-Tretroller-Verleihsysteme (Stand 1. November 2020, PDF)', url: 'https://www.aachen.de/in-aachen-leben/mobilitaet-verkehr/mobilitaetsangebote/sharing/qualitaetsvereinbarung-stadt-aachen-e-tretrollerverleihsystemen.pdf?cid=utd' },
    { title: 'Stadt Aachen: Mobilitätsangebote für Neubürger (Dezember 2025, PDF)', url: 'https://www.aachen.de/in-aachen-leben/mobilitaet-verkehr/mobilitaetskonzepte/mobilitaet-fuer-neubuerger-innen/mobilitaetsangebote-in-aachen-fuer-neubuergerinnen-de.pdf' },
    { title: 'Stadt Aachen: E-Tretroller fahren nun bis nach Verlautenheide (8. Juni 2026)', url: 'https://www.aachen.de/services/presse/pressemitteilungen/2026/juni/080626-verlautenheide-e-tretroller' },
    { title: 'ASEAG: Das gilt für E-Tretroller in den Bussen der ASEAG (20. März 2024)', url: 'https://www.aseag.de/aktuelles/detail/e-tretroller' },
    { title: 'Deutsche Bahn: E-Scooter im Fernverkehr', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Rijksoverheid: Regels voor elektrische steps (e-steps)', url: 'https://www.rijksoverheid.nl/themas/verkeer-en-vervoer/voertuigen-op-de-weg/bijzondere-bromfiets/elektrische-step' },
    { title: 'RDW: Bijzondere bromfietsen met kenteken de weg op (18. Juni 2026)', url: 'https://www.rdw.nl/nieuws/2026/bijzondere-bromfietsen-met-kenteken-de-weg-op' },
    { title: 'CHIO Aachen: Noch 300 Tage bis zur Eröffnungsfeier 2027 (2. September 2026)', url: 'https://www.chioaachen.de/de/news/der-chio-aachen-2027-noch-300-tage-bis-zur-eroeffnungsfeier/' },
    { title: 'CHIO Aachen: Anfahrt', url: 'https://www.chioaachen.de/de/informationen-fuer-besucher/anfahrt/' },
  ],
};

export default guide;
