import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-hamm',
  topic: 'hamm',
  name: 'E-Scooter Hamm: Anbieter, Preise, Parken',
  title: 'E-Scooter Hamm 2026: Dott, Preise, Parken, Regeln',
  description: 'E-Scooter Hamm: Dott verleiht, den Preis zeigt die App. Wo du fährst und parkst, was Verstösse kosten und was in Bus, Bahn und am Hauptbahnhof gilt.',
  headline: 'E-Scooter Hamm: Anbieter, Preise, Parken und was in Bus, Bahn und am Hauptbahnhof gilt',
  lede: 'E-Scooter in Hamm verleiht Dott: Du mietest ab 18 und ohne Führerschein, den Preis zeigt dir die App vor dem Entsperren. Andere Anbieter nennt keine offizielle Quelle. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone an Weststrasse und Bahnhofstrasse. Abstellen darfst du wie ein Fahrrad, solange du niemanden behinderst.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Hamm',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Hamm?',
      blocks: [
        'In Hamm verleiht **Dott** (früher Tier) E-Scooter, auch E-Roller genannt: Dott führt Hamm auf seiner Website unter seinen Standorten (Stand 26. Oktober 2026). Die Stadt nennt keinen Anbieter. Nach ihrer Sondernutzungssatzung, zuletzt 2022 geändert, braucht jeder Verleiher eine Sondernutzungserlaubnis, und die Stadt kann die Zahl der Scooter und der Anbieter beschränken. Wie viele Scooter sie heute erlaubt, sagt sie nicht.',
        'Die [Karte von Hamm](map:de:Hamm) zeigt die freien Dott-Scooter, aber nur ihren Standort: keinen Akkustand, keine Preise, Zonen oder Abstellflächen. Am Montag, 26. Oktober 2026, waren es gegen 16.40 Uhr rund 360. Nach der amtlichen Gemeindegrenze (Geobasis NRW) standen alle bis auf einen in Hamm; einer stand 62 m hinter der Grenze in Ahlen. Auf die Stadtbezirke verteilt: Mitte 117, Heessen 73, Bockum-Hövel 62, Herringen 46, Uentrop 39, Pelkum 14 und Rhynern 6. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'Ganz Hamm deckt die Karte allerdings nicht ab: Es fehlt der grösste Teil von Pelkum und Rhynern im Süden, dazu Ränder von Herringen, Uentrop, Heessen und Bockum-Hövel. Nach den amtlichen Gebäudeadressen (Geobasis NRW) liegt rund ein Fünftel aller Adressen der Stadt ausserhalb, in Pelkum 70 und in Rhynern 64 Prozent. Ob dort Dott-Scooter stehen, siehst du in der Dott-App.',
        'Dass Bolt, Voi, Lime, Zeus oder Bird in Hamm vermieten, nennt keine offizielle Quelle; Scooter anderer Anbieter fändest du nur in deren Apps. Wie das Mieten geht, steht in [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Leihräder gibt es beim metropolradruhr, laut Stadt etwa am Hauptbahnhof, am Rathaus und am Campus der Hochschule Hamm-Lippstadt. Räder zeigt die ScootRadar-Karte nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Hamm?',
      blocks: [
        'Den Preis zeigt dir die Dott-App vor dem Entsperren. So steht es in Dotts Geschäftsbedingungen: «Die Gebühren werden in Ihrem Benutzerkonto … angezeigt, bevor Sie ein Fahrzeug freischalten.» Einen Tarif für Hamm nennt die Stadt nicht. Sie selbst verlangt laut Gebührentarif ihrer Sondernutzungssatzung 30 € pro Scooter und Jahr; das zahlt der Verleiher, nicht du. Teuer wird es für dich, wenn du falsch abstellst:',
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
      ],
    },
    {
      heading: 'Wo darf man in Hamm mit dem E-Scooter fahren? Innenstadt, Grünanlagen, Kanal',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Hamm eigene Regeln gelten und wer sie setzt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es regelt'],
            rows: [
              ['Fussgängerzone an Weststrasse und Bahnhofstrasse', 'Nicht fahren, solange kein Schild es erlaubt', 'Bund (eKFV)'],
              ['Gehwege in Grünanlagen und Alleen', 'Befahren nur mit Krankenfahrstuhl, Kinderwagen oder Kinderfahrzeug; nach unserer Lesart gilt das Verbot auch für E-Scooter', 'Stadt (Strassen- und Anlagenordnung von 2021)'],
              ['Betriebswege am Datteln-Hamm-Kanal', 'Frei nur für Fussgänger und Fahrräder; nach unserer Lesart ist der E-Scooter als Kraftfahrzeug ausgeschlossen', 'Bund (Wasserstrassen-Betriebsanlagenverordnung)'],
              ['Hauptbahnhof', 'Im Bahnhof und auf den Vorplätzen der DB nur schieben oder tragen', 'DB (Hausordnung, Stand Oktober 2026)'],
              ['Hochschule Hamm-Lippstadt', 'StVO und Schrittgeschwindigkeit auf dem Gelände; E-Roller in den Gebäuden nur in einer Tasche', 'Hochschule (Hausordnung, zuletzt geändert am 20. Januar 2025)'],
            ],
          },
        },
        {
          list: [
            '**Fussgängerzone:** Die Sondernutzungssatzung nennt sie «die Fussgängerzone im Bereich der Weststrasse und der Bahnhofstrasse»; eine Freigabe für E-Scooter nennt die Stadt nicht. Hier steigst du ab und schiebst. Am 14. Oktober 2026 kontrollierte die Polizei Hamm in der Fussgängerzone, auf der Martin-Luther-Strasse und rund um das Beisenkamp-Gymnasium und stellte insgesamt 99 Verstösse fest, «vor allem bei jungen E-Scooter-Fahrenden»: auf der falschen Strassenseite, gegen die Fahrtrichtung auf Gehwegen, zu mehreren auf einem Fahrzeug. Weitere Kontrollen hat sie angekündigt.',
            '**Grünanlagen:** Die Strassen- und Anlagenordnung der Stadt vom 14. Dezember 2021 verbietet, «die Gehwege in den Anlagen mit anderen Fahrzeugen als Krankenfahrstühlen, Kinderwagen oder Kinderfahrzeugen (Roller, Dreirad, Skateboard, Kinderfahrrad, Rollschuhe u.ä.) zu befahren». Als Anlagen zählt sie unter anderem die allgemein zugänglichen Grünanlagen und Alleen, die Wälder der Stadt, Friedhöfe und Spielplätze. E-Scooter nennt die Verordnung nicht; nach unserer Lesart gilt das Verbot auch für sie.',
            '**Datteln-Hamm-Kanal:** Der Kanal ist eine Wasserstrasse des Bundes. Auf den bundeseigenen Ufergrundstücken und Betriebswegen verbietet die Wasserstrassen-Betriebsanlagenverordnung das «Befahren mit Kraftfahrzeugen»; erlaubt sind nur Fussgänger und auf den Betriebswegen Fahrräder. E-Scooter nennt sie nicht, sie sind aber Kraftfahrzeuge: Nach unserer Lesart fährst du dort nicht.',
            '**Hochschule Hamm-Lippstadt:** Laut Hausordnung, zuletzt am 20. Januar 2025 geändert, fährst du in den Gebäuden nicht mit dem E-Roller; dort ist er «in einer Tasche zu transportieren». Auf dem Gelände gilt die StVO, und «es ist Schrittgeschwindigkeit einzuhalten». Abstellen dürfen «Kraftfahrzeuge und Fahrräder» nur auf gekennzeichneten Flächen; nach unserer Lesart gilt das auch für E-Scooter.',
            '**Nachts und im Winter:** Eine nächtliche Sperrzeit oder Winterpause für Hamm nennen weder die Stadt noch Dott (Stand 26. Oktober 2026).',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter in Hamm parken: Innenstadt, Hauptbahnhof, Tierpark',
      blocks: [
        'Abstellen darfst du wie ein Fahrrad: auf dem Gehweg, solange niemand behindert oder gefährdet wird; ab 1. März 2027 steht das ausdrücklich in der StVO. Feste Abstellflächen für Leih-Scooter nennt die Stadt nicht.',
        'In ihrem Antragsformular für Verleiher verlangt die Stadt, dass der Anbieter «durch technische Vorkehrungen» das Abstellen in der Fussgängerzone, in öffentlichen Grünanlagen («Gärten, Wald, Parkanlagen, Uferbereiche usw.»), auf schmalen Gehwegen, an Gleisanlagen und vor stark besuchten Einrichtungen verhindert, «z. B. HBF und Tierpark». Dazu soll er den Plan der Stadt mit diesen Rückgabeverbotszonen in seine Buchungs-Software einbauen. Auf Geh- und Radwegen sollen 1,50 m frei bleiben, Rettungswege, Einfahrten und Bushaltestellen ganz, und bei Veranstaltungen soll der Anbieter auf Verlangen von Stadt oder Polizei Bereiche freihalten.',
        {
          list: [
            '**Hauptbahnhof:** Am 26. Oktober 2026 zeigte die Karte gegen 16.40 Uhr 17 Dott-Scooter im Umkreis von 300 m um den Willy-Brandt-Platz 1 am Hauptbahnhof. Die Hausordnung der DB (Stand Oktober 2026) verbietet «in unseren Bahnhöfen und auf unseren Vorplätzen», Kleinstfahrzeuge «an Zugängen, auf Bahnsteigen und ausserhalb der dafür ausgewiesenen Flächen» abzustellen.',
          ],
        },
        {
          note: 'Lässt dich die App die Miete nicht beenden, läuft sie weiter. Schieb den Scooter aus der Fussgängerzone oder dem Park hinaus und versuch es dort noch einmal.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Hamm: Bussgelder und Alkohol',
      blocks: [
        'In Hamm gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'E-Scooter in Bus und Bahn: Stadtwerke Hamm, Westfalentarif und DB',
      blocks: [
        'Für ihre Busse verweisen die Stadtwerke Hamm auf die Beförderungsbedingungen des Westfalentarifs. Das sind die Beförderungsbedingungen für Nahverkehr in NRW (gültig ab 1. Januar 2026); sie gelten in allen Verbund- und Gemeinschaftstarifen in NRW, auch in den Nahverkehrszügen.',
        {
          list: [
            '**Bus der Stadtwerke Hamm:** Dein eigener E-Scooter zählt als Handgepäck, wenn er «handelsüblich vollständig im kleinstmöglichen Packmass gefaltet bzw. zusammengeklappt» ist. Jedes Verkehrsunternehmen darf E-Tretroller aber per Hausrecht ausschliessen, auch zusammengeklappte. Ein solches Verbot nennen die Stadtwerke Hamm nicht (Stand 26. Oktober 2026); ihre «Regelung zu E-Scootern» betrifft Elektromobile und Elektro-Rollstühle.',
            '**Regionalzug:** Zusammengeklappt gilt dasselbe. Aufgeklappt zählt ein E-Tretroller wie ein Fahrrad und fährt nur im gekennzeichneten Abstellbereich mit, wenn dort Platz ist. Auch hier darf ihn jedes Verkehrsunternehmen per Hausrecht ausschliessen.',
            '**IC und ICE der Deutschen Bahn:** Zusammengeklappt und sicher verstaut fährt dein eigener E-Scooter dort kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Miete in der Nähe der Haltestelle, ohne den Zugang zu versperren, und leih dir am Ziel einen neuen.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Nahverkehrszug an deiner Einstiegshaltestelle mindestens 20 Minuten später ab als geplant, darfst du laut den NRW-Beförderungsbedingungen auf ein Sharing-Angebot umsteigen, ausdrücklich auch «E-Tretroller-Sharing». Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19.59 Uhr, sonst bis zu 60 €, gegen Fahrschein und Beleg. Den Antrag stellst du binnen 14 Kalendertagen beim Verkehrsunternehmen, das die Verspätung verursacht hat.',
      ],
    },
    {
      heading: 'E-Scooter rund um Hamm: Dortmund und die Nachbarorte',
      blocks: [
        {
          list: [
            '**Dortmund:** Die [Karte von Dortmund](map:de:Dortmund) zeigt Voi, Dott, Bolt und Lime (Stand 26. Oktober 2026). Was in Dortmund gilt, auch in Bus und Bahn von DSW21, steht in [E-Scooter in Dortmund](guide:dortmund).',
            '**Nachbarorte:** In Ahlen, Ascheberg, Bergkamen, Bönen, Drensteinfurt, Kamen, Lippetal, Unna, Welver, Werl und Werne zeigte die Karte am 26. Oktober 2026 keine Scooter, bis auf den einen Dott-Scooter in Ahlen.',
          ],
        },
        'Ob du eine Fahrt jenseits der Stadtgrenze beenden darfst, zeigt die Dott-App.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Hamm?',
      answer: 'Die von Dott (Stand Oktober 2026). Du musst 18 sein, einen Führerschein brauchst du nicht. Dass Bolt, Voi, Lime, Zeus oder Bird in Hamm vermieten, nennt keine offizielle Quelle.',
    },
    {
      question: 'Was kostet ein E-Scooter in Hamm?',
      answer: 'Den Preis zeigt dir die Dott-App vor dem Entsperren; die Stadt nennt keinen Tarif. Teuer wird Falschparken: Befolgst du Dotts Park- und Sperranweisungen nicht, kann Dott bis zu 300 € für die Rückholung berechnen.',
    },
    {
      question: 'Wo darf ich in Hamm einen Leih-Scooter abstellen?',
      answer: 'Wie ein Fahrrad, ohne jemanden zu behindern. Im Antragsformular für Verleiher nennt die Stadt Zonen, in denen keine Miete enden soll, etwa die Fussgängerzone an Weststrasse und Bahnhofstrasse, Grünanlagen, Uferbereiche und die Eingänge von Hauptbahnhof und Tierpark. Lässt dich die Dott-App die Miete nicht beenden, schieb den Scooter ein Stück weiter.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Weststrasse fahren?',
      answer: 'Nein, nicht in der Fussgängerzone an Weststrasse und Bahnhofstrasse, solange kein Zusatzschild es erlaubt; eine Freigabe für E-Scooter nennt die Stadt nicht. Das kostet heute 15 bis 30 €, ab 1. März 2027 25 bis 40 €. Am 14. Oktober 2026 kontrollierte die Polizei Hamm unter anderem dort und stellte insgesamt 99 Verstösse fest, vor allem bei jungen E-Scooter-Fahrenden.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus der Stadtwerke Hamm mitnehmen?',
      answer: 'Einen eigenen, vollständig zusammengeklappten ja: Nach den Beförderungsbedingungen für Nahverkehr in NRW zählt er als Handgepäck. Jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen, ein solches Verbot nennen die Stadtwerke Hamm aber nicht. Einen Leih-Scooter kannst du nicht zusammenklappen.',
    },
  ],
  sources: [
    { title: 'Stadt Hamm: Elektro-Tretroller (Mobilstation Hauptbahnhof)', url: 'https://www.hamm.de/verkehr/ueberblick-mobilstation/mobilstation-hauptbahnhof/elektro-tretroller' },
    { title: 'Stadt Hamm: Sondernutzungssatzung mit Gebührenordnung, 3. Änderung von 2022 (PDF)', url: 'https://www.hamm.de/fileadmin/user_upload/Medienarchiv_neu/Dokumente/Tiefbau_und_Gruenflaechenamt/Sondernutzungssatzung.pdf' },
    { title: 'Stadt Hamm: Antrag auf Ausbringung und Nutzung von E-Scootern, mit Checkliste (PDF)', url: 'https://www.hamm.de/fileadmin/user_upload/Medienarchiv_neu/Dokumente/Tiefbau_und_Gruenflaechenamt/Antrag-E_Scooter.pdf' },
    { title: 'Stadt Hamm: Strassen- und Anlagenordnung vom 14. Dezember 2021, geändert am 7. Juni 2023', url: 'https://www.hamm.de/satzungen/satzungen/detail/291' },
    { title: 'Stadt Hamm: metropolradruhr', url: 'https://www.hamm.de/metropolradruhr' },
    { title: 'Stadt Hamm: Stadtbezirksgrenzen (open.nrw, aktualisiert am 11. März 2025)', url: 'https://open.nrw/dataset/a7741fc1-5ac6-4f0d-978a-20c7c0fe8a97' },
    { title: 'Geobasis NRW: Digitale Verwaltungsgrenzen NW (open.nrw)', url: 'https://open.nrw/dataset/0c283d9d-523d-4c84-87c1-b12375db2903' },
    { title: 'Geobasis NRW: Gebäudereferenzen NW (open.nrw, Stand 1. Juli 2026)', url: 'https://open.nrw/dataset/172a0ba8-d470-47c1-ac89-b85f8190ac7e' },
    { title: 'Dott: Unsere Standorte (Stand 26. Oktober 2026)', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Polizei Hamm: «Zweiradfahren im Blick», 99 Verstösse (15. Oktober 2026)', url: 'https://www.presseportal.de/blaulicht/pm/65844/6371645' },
    { title: 'Hochschule Hamm-Lippstadt: 3. Änderung der Hausordnung vom 20. Januar 2025 (PDF)', url: 'https://www.hshl.de/assets/02-Hochschule/Veroeffentlichungen/Hausordnung/250127_Verkuendungsblatt-Nr.-03_25_JG-17_3.-Aenderung-der-Hausordnung-der-Hochschule-Hamm-Lippstadt-vom-10.06.2010-vom-20.01.2025.pdf' },
    { title: 'Wasserstrassen-Betriebsanlagenverordnung (WaStrBAV), § 2', url: 'https://www.gesetze-im-internet.de/wastrbav/BJNR704350016.html' },
    { title: 'Bundeswasserstrassengesetz, Anlage 1: Binnenwasserstrassen des Bundes', url: 'https://www.gesetze-im-internet.de/wastrg/anlage_1.html' },
    { title: 'WSA Westdeutsche Kanäle: Datteln-Hamm-Kanal', url: 'https://www.wsa-westdeutsche-kanaele.wsv.de/Webs/WSA/Westdeutsche-Kanaele/DE/Wasserstrassen/DHK-Allgemein.html' },
    { title: 'Stadtwerke Hamm: Downloads, Tarifbestimmungen und Beförderungsbedingungen', url: 'https://www.stadtwerke-hamm.de/privatkunden/verkehr/service/downloads' },
    { title: 'Stadtwerke Hamm: FAQ zum Busverkehr', url: 'https://www.stadtwerke-hamm.de/privatkunden/verkehr/faq' },
    { title: 'Westfalentarif: Beförderungsbedingungen für Nahverkehr in NRW (gültig ab 1. Januar 2026, PDF)', url: 'https://www.westfalentarif.de/fileadmin/documents/Tarifbestimmungen_und_Bef%C3%B6rderungsbedingungen_Preise/BB_Nahverkehr_NRW_zum_01.01.2026.pdf' },
    { title: 'Deutsche Bahn: Beförderungsbedingungen (Stand 26. Oktober 2026), A.7.1', url: 'https://www.bahn.de/agb' },
    { title: 'Deutsche Bahn: Hausordnung der Bahnhöfe (Stand Oktober 2026)', url: 'https://www.bahnhof.de/hausordnung' },
  ],
};

export default guide;
