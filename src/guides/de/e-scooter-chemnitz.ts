import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-chemnitz',
  topic: 'chemnitz',
  name: 'E-Scooter Chemnitz: Anbieter, Preise, Parken',
  title: 'E-Scooter Chemnitz 2026: Dott, Preise, Parken, Regeln',
  description: 'E-Scooter Chemnitz: Dott verleiht, den Preis zeigt die App. Wo du fährst und parkst, was Verstösse kosten und warum Tram und Bus der CVAG tabu sind.',
  headline: 'E-Scooter Chemnitz: Anbieter, Preise, Parken und was in Strassenbahn, Bus und Zug gilt',
  lede: 'E-Scooter in Chemnitz verleiht Dott: Du mietest ab 18 und ohne Führerschein, den Preis zeigt dir die App vor dem Entsperren. Andere Anbieter nennt keine offizielle Quelle. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg, und stellst den Scooter ab wie ein Fahrrad, ohne jemanden zu behindern. In Strassenbahnen und Bussen der CVAG darfst du keinen E-Scooter mitnehmen, auch keinen zusammengeklappten.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Chemnitz',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Chemnitz?',
      blocks: [
        'In Chemnitz verleiht **Dott** (früher Tier) E-Scooter, auch E-Roller genannt: Dott führt Chemnitz auf seiner Website unter seinen Standorten (Stand 26. Oktober 2026). Mieten darfst du laut Dotts Geschäftsbedingungen ab 18 Jahren, einen Führerschein brauchst du nicht.',
        'Die [Karte von Chemnitz](map:de:Chemnitz) zeigt die freien Dott-Scooter, aber nur ihren Standort: keinen Akkustand, keine Preise, Zonen oder Abstellflächen. Am Montag, 26. Oktober 2026, waren es gegen 17.30 Uhr knapp 30. Nach den amtlichen Grenzen (GeoSN) standen alle in Chemnitz selbst: 18 in der Gemarkung Chemnitz, zu der auch der Hauptbahnhof gehört, 3 in Reichenhain, je 2 in Altchemnitz und Adelsberg, je einer in Gablenz und Altendorf. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'Ganz Chemnitz deckt die Karte allerdings nicht ab. Nach den amtlichen Gemarkungsgrenzen (GeoSN) liegen gut 70 Prozent der Stadtfläche ausserhalb ihres Gebiets: ganz oder fast ganz Grüna, Mittelbach, Reichenbrand, Siegmar, Neustadt sowie Ober- und Niederrabenstein im Westen, Röhrsdorf, Wittgensdorf, Heinersdorf, Glösa, Draisdorf und Ebersdorf im Norden, Euba, Kleinolbersdorf und Altenhain im Osten, Einsiedel, Harthau, Berbisdorf und Klaffenbach im Süden, dazu der grösste Teil von Rottluff und Adelsberg. Ob dort Dott-Scooter stehen, siehst du in der Dott-App.',
        'Dass Bolt, Voi, Lime, Zeus oder Bird in Chemnitz vermieten, nennt keine offizielle Quelle; Scooter anderer Anbieter fändest du nur in deren Apps. Wie das Mieten geht, steht in [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Chemnitz?',
      blocks: [
        'Den Preis zeigt dir die Dott-App vor dem Entsperren. So steht es in Dotts Geschäftsbedingungen: «Die Gebühren werden in Ihrem Benutzerkonto … angezeigt, bevor Sie ein Fahrzeug freischalten.» Einen Tarif für Chemnitz nennt keine offizielle Quelle. Teuer wird es für dich, wenn du falsch abstellst oder Dott ein Bussgeld für dich zahlt:',
        {
          table: {
            caption: 'Gebühren laut Dotts Geschäftsbedingungen für Deutschland (Stand 23. September 2025)',
            head: ['Fall', 'Was Dott berechnen kann'],
            rows: [
              ['Park- und Sperranweisungen nicht befolgt', 'bis zu 300 € für die Rückholung des Scooters'],
              ['Dott zahlt ein Bussgeld für dich', 'das Bussgeld und 50 € Verwaltungsgebühr'],
            ],
          },
        },
        'Wird wegen eines Verstosses ein Bussgeld fällig, darf Dott laut denselben Bedingungen «angeforderte oder benötigte Daten» von dir an die örtlichen Behörden weitergeben.',
      ],
    },
    {
      heading: 'Wo darf man in Chemnitz mit dem E-Scooter fahren? Hauptbahnhof und TU',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Chemnitz eigene Regeln gelten und wer sie setzt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es regelt'],
            rows: [
              ['Hauptbahnhof', 'Im Bahnhof und auf den Vorplätzen der DB nur schieben oder tragen', 'DB (Hausordnung, Stand Oktober 2026)'],
              ['Gelände der TU Chemnitz', 'StVO auf dem ganzen Gelände; in den Gebäuden und auf ausgewiesenen Flächen nicht fahren; nach unserer Lesart nicht auf Fusswegen, vor Hydranten und auf Grünanlagen abstellen', 'TU Chemnitz (Hausordnung vom 4. März 2026)'],
              ['Strassenbahnen und Busse der CVAG', 'Kein E-Scooter, auch nicht zusammengeklappt', 'VMS (Beförderungsbedingungen, gültig ab 1. April 2026)'],
            ],
          },
        },
        {
          list: [
            '**Hauptbahnhof:** Chemnitz Hbf ist ein Bahnhof der DB. Ihre Hausordnung (Stand Oktober 2026) verbietet «in unseren Bahnhöfen und auf unseren Vorplätzen» das «Fahren, Rollen mit … E-Scootern»: «Nur das Schieben oder Tragen ist erlaubt.»',
            '**TU Chemnitz:** Laut Hausordnung der Universität vom 4. März 2026 gilt die StVO «auf dem gesamten Gelände der TUC». Unzulässig ist «das Benutzen von Rollschuhen, Inline-Skates, Skateboards, Rollern, E-Scootern u. ä. in den Universitätsgebäuden und auf ausgewiesenen Flächen».',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter in Chemnitz parken: Dott, Hauptbahnhof, TU',
      blocks: [
        'Abstellen darfst du wie ein Fahrrad: auf dem Gehweg, solange niemand behindert oder gefährdet wird; ab 1. März 2027 steht das ausdrücklich in der StVO.',
        'Dotts Geschäftsbedingungen verlangen mehr: Hat eine Stadt Parkplätze für die Scooter ausgewiesen, parkst du nur dort, sonst so, dass du keine Gebäudeeingänge blockierst und weder Fussgänger noch Verkehr behinderst. Dott kann beim Beenden der Fahrt ein Foto verlangen, und fahren darfst du nur im Betriebsgebiet, das dir die Dott-App auf einer Karte zeigt.',
        {
          list: [
            '**Hauptbahnhof:** Die Hausordnung der DB verbietet, Kleinstfahrzeuge «an Zugängen, auf Bahnsteigen und ausserhalb der dafür ausgewiesenen Flächen» abzustellen. Sonst behält sich die DB «die sofortige Entfernung» vor und stellt die Kosten in Rechnung.',
            '**TU Chemnitz:** Die Hausordnung untersagt «das Abstellen von Fahrrädern und Fahrzeugen aller Art auf Fusswegen, vor Hydranten und auf den Grünanlagen». Widerrechtlich und verkehrsbehindernd abgestellte «Fahrzeuge jeglicher Art» kann die Universität auf Kosten des Halters abschleppen lassen. E-Scooter nennt sie dabei nicht; nach unserer Lesart gilt beides auch für sie.',
          ],
        },
        {
          note: 'Lässt dich die App die Miete nicht beenden, läuft sie weiter. Schieb den Scooter ein Stück weiter und versuch es dort noch einmal.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Chemnitz: Bussgelder und Alkohol',
      blocks: [
        'In Chemnitz gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Zug: CVAG, VMS und DB',
      blocks: [
        'Für ihre Strassenbahnen und Busse verweist die CVAG auf die Beförderungsbedingungen des Verkehrsverbunds Mittelsachsen (VMS, gültig ab 1. April 2026). Ihr allgemeiner Teil, «Einheitliche Beförderungsbedingungen des MDV, VMS, VVO, VVV und ZVON», erlaubt zusammengeklappte elektrische Tretroller, «wenn die Voraussetzungen zur Beförderung dazu gegeben sind». Für Busse und Strassenbahnen macht der VMS davon aber eine Ausnahme.',
        {
          list: [
            '**Strassenbahn und Bus der CVAG:** In den Fahrzeugen der Bus- und Strassenbahnunternehmen, die der VMS in seiner Anlage 1 aufzählt, ist «abweichend zu Teil A die Mitnahme von E-Tretrollern ausgeschlossen». Dazu gehören die CVAG, REGIOBUS Mittelsachsen, der Regionalverkehr Erzgebirge, der Regionalverkehr Westsachsen und die Städtischen Verkehrsbetriebe Zwickau. Laut CVAG gilt das seit dem 1. August 2024: «In Bussen und Strassenbahnen im VMS dürfen keine E-Tretroller (bzw. E-Roller/ E-Scooter) mehr mitgenommen werden.» Elektro-Rollstühle, E-Bikes und Pedelecs sowie vierrädrige Elektromobile für Menschen mit eingeschränkter Mobilität betrifft das Verbot nicht.',
            '**Regionalzug:** Die Eisenbahnunternehmen führt der VMS in Anlage 1 eigens auf, darunter DB Regio, die Erzgebirgsbahn und die Mitteldeutsche Regiobahn; für sie gilt das Verbot nicht. Auch laut CVAG werden zusammengeklappte E-Tretroller im Schienenpersonennahverkehr «weiterhin» befördert. Dein eigener darf dort also zusammengeklappt mit, wenn die Voraussetzungen gegeben sind; «das Betriebspersonal entscheidet im Einzelfall». Den eingebauten Akku darfst du laut VMS während der Fahrt weder herausnehmen noch laden.',
            '**City-Bahn Chemnitz:** Der VMS führt sie in Anlage 1 bei den Eisenbahnunternehmen, sein Verbot nennt nur die Bus- und Strassenbahnunternehmen. Die CVAG schreibt dagegen allgemein von «Bussen und Strassenbahnen im VMS» und nennt die City-Bahn nicht. Frag im Zweifel das Personal; laut VMS entscheidet es ohnehin im Einzelfall, was mitfährt.',
            '**IC und ICE der Deutschen Bahn:** Zusammengeklappt und sicher verstaut fährt dein eigener E-Scooter dort kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Miete in der Nähe der Haltestelle, ohne den Zugang zu versperren, und leih dir am Ziel einen neuen.',
      ],
    },
    {
      heading: 'E-Scooter rund um Chemnitz: Zwickau, Leipzig, Dresden',
      blocks: [
        {
          list: [
            '**Zwickau:** Dott führt auch Zwickau unter seinen Standorten (Stand 26. Oktober 2026), und die [Karte von Zwickau](map:de:Zwickau) zeigte am selben Montag gegen 17.30 Uhr knapp 20 Dott-Scooter. Die Städtischen Verkehrsbetriebe Zwickau zählt der VMS zu den Bus- und Strassenbahnunternehmen: In ihren Strassenbahnen und Bussen darf kein E-Scooter mit.',
            '**Drahtseilbahn Augustusburg und Fichtelbergbahn:** Zusammengeklappt fährt dein eigener E-Scooter dort laut CVAG weiterhin mit.',
            '**Leipzig:** Dort verleihen Dott und Voi, und abstellen darfst du nur an markierten Stationen; die [Karte von Leipzig](map:de:Leipzig) zeigt beide. In Strassenbahnen und Bussen der LVB darf seit dem 1. Mai 2024 kein E-Scooter mehr mit. Mehr steht in [E-Scooter in Leipzig](guide:leipzig).',
            '**Dresden:** Laut Stadt verleihen dort RideMovi und Bolt, Voi soll «ab Herbst 2026» dazukommen; die [Karte von Dresden](map:de:Dresden) zeigt Bolt. Im VVO rund um Dresden fährt dein eigener E-Scooter zusammengeklappt auch in Strassenbahn und Bus mit.',
          ],
        },
        'Ob du eine Dott-Fahrt jenseits der Stadtgrenze beenden darfst, zeigt dir die Dott-App.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Chemnitz?',
      answer: 'Die von Dott (Stand Oktober 2026). Du musst 18 sein, einen Führerschein brauchst du nicht. Dass Bolt, Voi, Lime, Zeus oder Bird in Chemnitz vermieten, nennt keine offizielle Quelle.',
    },
    {
      question: 'Was kostet ein E-Scooter in Chemnitz?',
      answer: 'Den Preis zeigt dir die Dott-App vor dem Entsperren. Teuer wird Falschparken: Befolgst du Dotts Park- und Sperranweisungen nicht, kann Dott bis zu 300 € für die Rückholung berechnen.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Strassenbahn in Chemnitz mitnehmen?',
      answer: 'In Strassenbahnen und Bussen der CVAG nicht, auch keinen zusammengeklappten: Die Beförderungsbedingungen des VMS schliessen E-Tretroller dort aus, laut CVAG seit dem 1. August 2024. Im Regionalzug darf dein eigener zusammengeklappt mit, wenn das Personal ihn zulässt. Die City-Bahn führt der VMS bei den Eisenbahnunternehmen, die CVAG spricht dagegen von «Bussen und Strassenbahnen im VMS»: Frag dort im Zweifel das Personal. Einen Leih-Scooter kannst du nicht zusammenklappen.',
    },
    {
      question: 'Wo darf ich in Chemnitz einen Leih-Scooter abstellen?',
      answer: 'Wie ein Fahrrad, ohne jemanden zu behindern. Hat die Stadt Parkplätze für Leih-Scooter ausgewiesen, verlangt Dott, dass du dort parkst. Am Hauptbahnhof nicht an Zugängen und auf Bahnsteigen, auf dem Gelände der TU nach unserer Lesart ihrer Hausordnung nicht auf Fusswegen, vor Hydranten und auf Grünanlagen.',
    },
    {
      question: 'Zeigt die Karte alle E-Scooter in Chemnitz?',
      answer: 'Nein. Sie zeigt nur die Standorte der freien Dott-Scooter, und gut 70 Prozent der Stadtfläche liegen ausserhalb ihres Gebiets, etwa Grüna, Wittgensdorf, Einsiedel und Euba. Was dort steht, siehst du in der Dott-App.',
    },
  ],
  sources: [
    { title: 'Dott: Unsere Standorte (Stand 26. Oktober 2026)', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'GeoSN: ALKIS-WFS, Verwaltungseinheiten und Gemarkungen (Stand 15. Oktober 2026)', url: 'https://www.geodaten.sachsen.de/alkis-wfs-4968.html' },
    { title: 'CVAG: Häufige Fragen zu Mitnahmeregelungen', url: 'https://www.cvag.de/faq/haeufige-fragen-zu-mitnahmeregelungen' },
    { title: 'CVAG: Beförderungsbedingungen', url: 'https://www.cvag.de/fahrtinfo/befoerderungsbedingungen' },
    { title: 'VMS: Beförderungsbedingungen und Tarifbestimmungen, gültig ab 1. April 2026 (PDF)', url: 'https://www.vms.de/wp-content/uploads/2026/09/BR-BefBedTarifbestimmungen-VMS-Tarif-09_2026-WEB.pdf' },
    { title: 'TU Chemnitz: Hausordnung vom 4. März 2026 (PDF)', url: 'https://www.tu-chemnitz.de/verwaltung/technik/documents/public/Hausordnung.pdf' },
    { title: 'Deutsche Bahn: Chemnitz Hbf', url: 'https://www.bahnhof.de/chemnitz-hbf' },
    { title: 'Deutsche Bahn: Hausordnung der Bahnhöfe (Stand Oktober 2026)', url: 'https://www.bahnhof.de/hausordnung' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern (FAQ)', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Deutsche Bahn: Beförderungsbedingungen (Stand 26. Oktober 2026), A.7.1', url: 'https://www.bahn.de/agb' },
  ],
};

export default guide;
