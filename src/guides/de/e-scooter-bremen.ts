import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-bremen',
  topic: 'bremen',
  name: 'E-Scooter Bremen: Anbieter, Preise, Parken',
  title: 'E-Scooter Bremen 2026: Anbieter, Preise, Parken, BSAG',
  description: 'E-Scooter Bremen: wer verleiht, was eine Fahrt kostet, wo du fährst und parkst, warum der Bürgerpark tabu ist und was in Bahn und Bus der BSAG gilt.',
  headline: 'E-Scooter Bremen: Anbieter, Preise, Parken und die Regeln der Stadt',
  lede: 'E-Scooter in Bremen leihst du ab 18 und ohne Führerschein. Die Stadt lässt höchstens zwei Anbieter zu und hat die Erlaubnisse im Juni 2025 für drei Jahre ab 1. August 2025 verlost: an Tier Mobility, heute Dott, und an LimeBike Germany. Den Preis zeigt die App. Du fährst auf dem Radweg, nicht durch Bürgerpark und Stadtwald, und in Grünanlagen kannst du die Fahrt nicht beenden. In Strassenbahn und Bus der BSAG darf kein E-Scooter mit, auch kein zusammengeklappter.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Bremen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Bremen?',
      blocks: [
        'Wer in Bremen Leih-Scooter auf die Strasse stellt, braucht eine Sondernutzungserlaubnis des Ordnungsamts. Seit einem Konzept von 2021 vergibt die Stadt höchstens zwei. Nach dem neuen Konzept, das der Senat im Oktober 2024 beschloss, entscheidet unter den geeigneten Bewerbern das Los. Am 5. Juni 2025 zog die Stadt laut Senat unter sechs geeigneten Bewerbern **Tier Mobility** und **LimeBike Germany**. Ihre Erlaubnisse gelten drei Jahre ab dem 1. August 2025. Neu vergeben wird laut Innenbehörde erst im Sommer 2028 (Landesteilhabebeirat, 19. November 2025).',
        'Im April 2025 waren es noch **Bolt** und **Lime** (Beirat Neustadt). **Lime** bot im Oktober 2025 dem Beirat Hemelingen ein Gespräch an.',
        'Tier ist mit Dott fusioniert; Dotts Bedingungen nennen die TIER Mobility SE als Vertragspartner. ScootRadar zeigt auf der [Karte von Bremen](map:de:Bremen) beide: am Sonntag, 25. Oktober 2026, um 7:47 Uhr rund 650 Dott-Scooter, die zu diesem Zeitpunkt frei waren, dazu gegen 9 Uhr rund 1250 Lime-Scooter nach der letzten Zählung.',
        'Gemietet wird in der App, bei Dott laut Bedingungen erst ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Wie viele E-Scooter erlaubt Bremen, und wo stehen sie?',
      blocks: [
        'Die Stadt teilt ihr Gebiet in drei Zonen und begrenzt jede. So beschloss es der Senat am 15. Oktober 2024, und so gilt es laut Senat für die Erlaubnisse ab 1. August 2025:',
        {
          table: {
            caption: 'Höchstzahl der Leih-Scooter in Bremen (Erlaubnisse ab 1. August 2025)',
            head: ['Zone', 'Je Anbieter', 'Zusammen'],
            rows: [
              ['Kernstadtzone', '500', '1000'],
              ['Ausserhalb der Kernstadtzone', '500', '1000'],
              ['Bremen-Nord', '350', '700'],
              ['Ganze Stadt', '1350', '2700'],
            ],
          },
        },
        'Für Bremen-Nord hob die Stadt die Grenze um 200 Scooter an, weil Scooter dort «insbesondere in den Abendstunden» gut als Anschluss an Bus und Bahn angenommen würden und Bremen-Nord «bisher nicht vollständig erschlossen» sei.',
        'Wo in deinem Stadtteil gerade ein Scooter steht und wo du die Fahrt beenden darfst, zeigt die App des Anbieters. Bremerhaven ist eine eigene Stadt und zählt nicht zu Bremen: mehr im [Ratgeber für Bremerhaven](guide:bremerhaven).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Bremen?',
      blocks: [
        'Dott nennt seinen Preis in der App: «In der Dott-App siehst du den Preis, der in deiner Region gilt» (Stand 25. Oktober 2026). Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Laut Dotts Bedingungen für Deutschland zahlst du nach Dauer, je nach Tarif eventuell plus Freischaltgebühr; dazu kommen Pässe und Abos. Was sonst noch kosten kann:',
        {
          table: {
            caption: 'Dott in Deutschland: Gebühren laut Bedingungen (letzte Aktualisierung 23. September 2025)',
            head: ['Fall', 'Was Dott verlangt'],
            rows: [
              ['Fahrt', 'Preis in der App, nach Dauer, je nach Tarif mit Freischaltgebühr'],
              ['Scooter falsch geparkt oder nicht richtig gesperrt', 'bis zu 300 € Rückholkosten'],
              ['Bussgeld, das Dott für dich zahlt', 'das Bussgeld plus 50 € Verwaltungsgebühr'],
              ['Verstoss gegen die Bedingungen', 'Dott kann 50 € verlangen'],
            ],
          },
        },
        'Dazu kommen die Sanktionen, die die Stadt den Anbietern fürs Falschparken vorschreibt (siehe unten), und die Bussgelder der Behörden.',
      ],
    },
    {
      heading: 'Wo darf man in Bremen mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, gemeinsamen Geh- und Radwegen, Radfahr- und Schutzstreifen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Bremen was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Bürgerpark und Stadtwald', 'Mit E-Scootern «auf allen Wegen grundsätzlich nicht gestattet»; Radfahren nur auf freigegebenen Wegen', 'Bürgerparkverein, Parkordnung vom August 2025, in Übereinstimmung mit der Stadt'],
              ['Alle Grünanlagen', 'Fahrt beenden oder pausieren nicht möglich, ausser der Verantwortliche lässt das Abstellen zu', 'Stadt, Erlaubnis der Anbieter'],
              ['Innenstadt', 'Parkverbotszonen («Negativzonen») laut Protokoll des Beirats Hemelingen vom Oktober 2025; wo genau, zeigt die App', 'Stadt, Erlaubnis der Anbieter'],
              ['Flughafen', 'Abstellverbot laut Beirat Neustadt, der im April 2025 eine Ausnahme nahe Terminal 1 forderte; ob es sie gibt, zeigt die App', 'Ordnungsamt und Mobilitätsbehörde (laut Beirat)'],
              ['Fussgängerzone', 'Absteigen und schieben, ausser ein Schild erlaubt das Fahren', 'Bund'],
            ],
          },
        },
        'Wo ein Ort als Grünanlage gilt, lässt dich die App die Fahrt dort nicht beenden. Weitere Verbotszonen kann die Stadt laut Mustererlaubnis nachträglich festlegen, auch nur vorübergehend; welche gerade gelten, zeigt die App.',
      ],
    },
    {
      heading: 'E-Scooter in Bremen parken: Regeln der Stadt und Abstellflächen',
      blocks: [
        'Leih-Scooter dürfen in Bremen weiterhin «frei abgestellt» werden, schrieb der Landesbehindertenbeauftragte im August 2025. Die Stadt schreibt den Anbietern aber vor, dich zu Folgendem zu verpflichten (Mustererlaubnis ab 1. August 2025):',
        {
          list: [
            'nicht auf Radwegen, Querungshilfen, Rettungswegen, in Einfahrten, an Bus- und Tramhaltestellen und Bahnhaltepunkten, an Rampen, im Kreuzungsbereich und an Ampeln abstellen;',
            'nicht vor Gebäudeeingängen und nicht mitten auf dem Gehweg;',
            'auf dem Gehweg parallel zur Fahrbahn und so, dass 1,80 m frei bleiben;',
            'nach der Fahrt ein Foto des abgestellten Scooters machen.',
          ],
        },
        {
          table: {
            caption: 'Sanktionen der Anbieter bei Falschparken, wie die Stadt sie vorschreibt',
            head: ['Verstoss', 'Folge'],
            rows: [
              ['1.', 'Verwarnung'],
              ['2.', '15 €'],
              ['3.', '15 € und eine Woche gesperrt'],
              ['4.', '15 € und vier Wochen gesperrt'],
              ['5.', 'dauerhaft gesperrt'],
            ],
          },
        },
        'Die 15 € verlangt der Anbieter, nicht die Stadt. Nach fünf korrekt abgestellten Fahrten stufen dich die Anbieter wieder eine Stufe zurück. Ein Bussgeld fürs Falschabstellen verhängt die Stadt laut Protokoll des Beirats Hemelingen (Oktober 2025) nicht: «Es gibt keine Ordnungsgelder bei falsch abgestellten E-Scootern.» Blockiert ein Scooter Gehweg, Radweg oder Haltestelle, muss der Anbieter ihn nach einer Meldung zwischen 6 und 22 Uhr binnen drei Stunden umstellen, nachts binnen sechs.',
        'Im Übrigen gelten die Regeln für Fahrräder: Auf dem Gehweg darfst du abstellen, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der Strassenverkehrs-Ordnung.',
        'Feste Abstellflächen gibt es erst wenige. Im Oktober 2024 war in der Neustadt ein Pilotprojekt in Arbeit: Flächen, markiert mit Fahrradbügeln und einem Schild mit dem E-Scooter-Sharing-Symbol; Burglesum, Horn-Lehe und Vahr hatten Interesse an eigenen bekundet. Flächendeckend sei das nicht möglich, sagte die Mobilitätsbehörde im November 2025; sie plant Flächen an «Hotspots» mit mehr als 3000 Ausleihen in zwölf Monaten.',
        {
          note: 'In einer Grünanlage oder Parkverbotszone lässt dich die App die Fahrt nicht beenden. Fahr weiter zu einer erlaubten Stelle: Solange die Fahrt läuft, zahlst du.',
        },
      ],
    },
    {
      heading: 'Regeln und Bussgelder für E-Scooter in Bremen',
      blocks: [
        'Es gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden; ab 1. März 2027 25 €, bis 40 €.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €. **Ohne Versicherungsplakette:** 40 €.',
            '**Rote Ampel:** 60 € und ein Punkt, länger als 1 Sekunde rot 100 € und ein Punkt. **Handy in der Hand:** 100 € und ein Punkt.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot; ab 1,1 Promille eine Straftat; unter 21 oder in der Probezeit 0,0 Promille.',
            '**Unzulässig auf Geh- oder Radweg geparkt:** laut Bussgeldkatalog behindernd 20 €, gefährdend 30 €; ab 1. März 2027 55 €, mit Behinderung 70 €.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Zug: was der VBN erlaubt',
      blocks: [
        'Für BSAG, Regionalbusse und Nahverkehrszüge gelten die Beförderungsbedingungen des Verkehrsverbunds Bremen/Niedersachsen (VBN, gültig ab 1. Januar 2026, Stand 23. April 2026). Sie lassen Elektrokleinstfahrzeuge zu, «mit der Ausnahme, dass E-Tretroller ausschliesslich in Zügen mitgenommen werden dürfen».',
        {
          list: [
            '**Strassenbahn und Bus der BSAG:** kein E-Scooter, auch nicht zusammengeklappt. Zusammengeklappt kostenlos fahren Falträder und Tretroller ohne Motor mit, E-Scooter nicht. Genauso streng ist die ÜSTRA in [Hannover](guide:hanover).',
            '**Regionalzug und Regio-S-Bahn:** E-Scooter dürfen mit, ins Fahrrad- oder Mehrzweckabteil, mit einem FahrradTicket für jede Fahrt und nur, solange Platz ist. Bei der NordWestBahn gehören sie auch zusammengeklappt in den Mehrzweckbereich.',
            '**IC und EC:** Für die Mitnahme gelten laut VBN die Bestimmungen und Preise der Deutschen Bahn.',
            '**Akku:** nur ein vom Hersteller freigegebener mit CE-Zeichen, nicht sichtbar beschädigt; laden ist verboten.',
          ],
        },
        'Einen Anspruch auf Mitnahme hast du nicht. Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor der Haltestelle, nicht an ihr, und miete am Ziel neu.',
      ],
    },
    {
      heading: 'Uni, Constructor University, Hauptbahnhof und Flughafen: Tipps',
      blocks: [
        {
          list: [
            '**Universität, Constructor University, Hauptbahnhof, Marktplatz, Weserstadion:** Ob du dort abstellen darfst, zeigt dir die App vor dem Beenden der Fahrt.',
            '**Flughafen:** Laut Beirat Neustadt gilt am Flughafen ein Abstellverbot; beende die Fahrt vorher.',
          ],
        },
        'Freie Dott- und Lime-Scooter in deiner Nähe zeigt die [Live-Karte von Bremen](map:de:Bremen).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Bremen?',
      answer: 'Die Stadt hat ihre zwei Erlaubnisse ab 1. August 2025 für drei Jahre an Tier Mobility, heute Dott, und LimeBike Germany verlost.',
    },
    {
      question: 'Was kostet ein E-Scooter in Bremen?',
      answer: 'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Wer falsch parkt, riskiert laut Dotts Bedingungen bis zu 300 € Rückholkosten und ab dem zweiten Verstoss 15 €, die der Anbieter nach Vorgabe der Stadt verlangt.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Bürgerpark fahren?',
      answer: 'Nein. Die Parkordnung des Bürgerparkvereins vom August 2025 verbietet E-Scooter auf allen Wegen von Bürgerpark und Stadtwald. Radfahren ist dort nur auf freigegebenen Wegen erlaubt.',
    },
    {
      question: 'Darf ich meinen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'Nein, in Strassenbahn und Bus der BSAG sind E-Tretroller laut VBN-Bedingungen ausgeschlossen, auch zusammengeklappt. In Regionalzügen darf er mit, mit FahrradTicket und solange Platz ist.',
    },
    {
      question: 'Wo darf ich einen Leih-Scooter in Bremen abstellen?',
      answer: 'Meist frei auf dem Gehweg, parallel zur Fahrbahn und mit 1,80 m Platz, aber nicht an Haltestellen, Einfahrten, Kreuzungen, vor Hauseingängen oder auf Radwegen. In Grünanlagen und Parkverbotszonen, etwa in der Innenstadt, lässt die App das Beenden nicht zu.',
    },
    {
      question: 'Gibt es in Bremen-Nord E-Scooter?',
      answer: 'Ja, die Stadt erlaubt dort bis zu 700. Wo in Burglesum, Vegesack oder Blumenthal gerade einer steht, zeigt dir die App des Anbieters.',
    },
  ],
  sources: [
    { title: 'Senat der Freien Hansestadt Bremen: Anpassung des Sondernutzungskonzepts für E-Scooter-Verleihsysteme (15. Oktober 2024, PDF)', url: 'https://www.rathaus.bremen.de/sixcms/media.php/13/top%2012_20241015_Anpassung_Sondernutzungskonzept_nach_Landesstrassengesetz.pdf' },
    { title: 'Pressestelle des Senats: Zwei Anbieter für E-Scooter-Verleih in Bremen ausgelost (5. Juni 2025)', url: 'https://www.senatspressestelle.bremen.de/pressemitteilungen/zwei-anbieter-fuer-e-scooter-verleih-in-bremen-ausgelost-469708' },
    { title: 'Ordnungsamt Bremen: Muster-Sondernutzungserlaubnis für E-Tretroller, ab 1. August 2025 (Amtliche Bekanntmachungen, PDF)', url: 'https://amtliche-bekanntmachungen.bremen.de/sixcms/media.php/216/Anlagen.pdf' },
    { title: 'Landesteilhabebeirat Bremen: Protokoll der 48. Sitzung (19. November 2025, PDF)', url: 'https://www.teilhabebeirat.bremen.de/sixcms/media.php/13/Protokoll_der_48_Sitzung_des_Landesteilhabebeirates.pdf' },
    { title: 'Landesbehindertenbeauftragter: Schreiben zu E-Scootern (19. August 2025, PDF)', url: 'https://www.teilhabebeirat.bremen.de/sixcms/media.php/13/2025-08-19%20Schreiben%20des%20Landesbehindertenbeauftragten%20an%20den%20Senator%20f%C3%BCr%20Inneres%20E-Scooter.pdf' },
    { title: 'Beirat Neustadt: Abstellmöglichkeiten für E-Scooter am Flughafen (3. April 2025, PDF)', url: 'https://www.ortsamt-woltmershausen.bremen.de/sixcms/media.php/13/250403_FA_MobS_Scooter_Abstellfl%C3%A4che_Flughafen.pdf' },
    { title: 'Ortsamt Hemelingen: Protokoll des Fachausschusses vom 6. Oktober 2025 (PDF)', url: 'https://www.ortsamt-hemelingen.bremen.de/sixcms/media.php/13/2025-10-06_Protokoll%20FA%20StadtteilentwWirtschaftMobilit.docx.pdf' },
    { title: 'Bürgerparkverein: Parkordnung für den Bremer Bürgerpark und Stadtwald (August 2025, PDF)', url: 'https://www.buergerpark-bremen.de/bilder/Parkordnung.pdf' },
    { title: 'VBN: Tarifbestimmungen und Beförderungsbedingungen 2026 (PDF)', url: 'https://www.vbn.de/fileadmin/content/_Tickets/Tarifbestimmungen/Tarifbestimmungen_und_Befoerderungsbedingungen_2026.pdf' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Dott: Fahr mit uns', url: 'https://ridedott.com/de/fahr-mit-uns/' },
  ],
};

export default guide;
