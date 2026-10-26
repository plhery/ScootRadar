import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-oldenburg',
  topic: 'oldenburg',
  name: 'E-Scooter Oldenburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Oldenburg 2026: Bolt, Preise, Parken, VWG',
  description: 'E-Scooter Oldenburg: Bolt verleiht, den Preis zeigt die App. Wo du fährst und parkst, was Falschparken kostet und warum kein E-Scooter in den VWG-Bus darf.',
  headline: 'E-Scooter Oldenburg (Oldb.): Bolt, Preise, Parken und was in Bus und Bahn gilt',
  lede: 'E-Scooter in Oldenburg (Oldb.) leihst du ab 18 und ohne Führerschein bei Bolt, dem einzigen Anbieter, den die Stadt nennt; den Preis zeigt die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone. Die mit Bolt vereinbarten Fahr- und Parkverbotszonen betreffen laut Stadt vor allem Grünanlagen, Friedhöfe und Parkhäuser. In die Busse der VWG darf seit dem 1. Juni 2024 kein E-Scooter, in Züge schon.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Oldenburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Oldenburg?',
      blocks: [
        'Gemeint ist Oldenburg (Oldb.) in Niedersachsen, nicht Oldenburg in Holstein. Leih-Scooter gibt es hier laut Stadt seit dem 25. September 2020. «Aktuell hat die Firma Bolt Kleinstfahrzeuge zur Ausleihe bereitgestellt», schreibt sie (Stand 17. Juli 2026). Sie verweist auf eine Sondernutzungserlaubnis, eine «Vereinbarung zwischen der Stadt und dem Anbieter», die das Abstellen und «weitere Aspekte einer geordneten und sicheren Nutzung» regelt; abgestimmt wurde sie auch mit dem Behindertenbeirat. Eine Obergrenze, eine Gebühr oder eine Laufzeit nennt die Stadt nicht. Auch Bolts Seite für Oldenburg führt E-Scooter (undatiert, gelesen am 26. Oktober 2026).',
        'Die [Karte von Oldenburg](map:de:Oldenburg) zeigt die freien Bolt-Scooter mit Standort und Akkustand, keine Preise, Zonen oder Abstellflächen. Am Montag, 26. Oktober 2026, zeigte sie zwischen 13 und 13:10 Uhr rund 830 Bolt-Scooter. Nach der amtlichen Gemeindegrenze (LGLN) standen rund 820 davon in der Stadt Oldenburg und 14 knapp dahinter in der Gemeinde Wiefelstede, höchstens rund 500 m von der Stadtgrenze entfernt. Das ist eine Momentaufnahme, keine Flottengrösse. Die Karte reicht allerdings nicht über die ganze Stadt: Der Osten von Ohmstede und Osternburg und der Westrand von Eversten fehlen. Ob dort Bolt-Scooter stehen, siehst du in der Bolt-App.',
        'Dass Voi, Dott (früher Tier), Lime, Bird oder Zeus in Oldenburg vermieten, nennt keine offizielle Quelle; die Karte zeigt nur Bolt. Wie das Mieten geht, steht in [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Ein öffentliches Leihradsystem gibt es derzeit nicht: «Seit Januar 2026 gibt es keine OLi-Bikes mehr in Oldenburg», schreibt die Stadt; ob wieder eines kommt, prüft sie (Stand 17. Juli 2026).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter von Bolt in Oldenburg?',
      blocks: [
        'Den Preis zeigt dir die Bolt-App vor dem Entsperren; verbindlich ist laut Bolts Bedingungen die Gebührentabelle, die sie anzeigt. Weder die Stadt noch die VWG nennen einen Tarif für Oldenburg. Teuer wird es, wenn du falsch abstellst:',
        {
          table: {
            caption: 'Gebühren laut Bolts Nutzungsbedingungen',
            head: ['Anbieter', 'Falsch abgestellt', 'Weitere Gebühr', 'Stand'],
            rows: [
              ['Bolt', '15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist', 'bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs', 'seit 2023, auch ab 1. Dezember 2026'],
            ],
          },
        },
        'Zahlt Bolt für dich ein Bussgeld, kommen laut denselben Bedingungen höchstens 30 € Verwaltungsgebühr dazu, seit 2023 wie ab 1. Dezember 2026. Alkohol ist auf Bolts Scootern ganz tabu: «Es gilt ein striktes Alkoholverbot von 0,0‰.»',
      ],
    },
    {
      heading: 'Wo darf man in Oldenburg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        'In Oldenburg zählt das besonders: Laut Stadt gibt es Gehwege mit «Radverkehr frei», und mit einer Ausnahme sind alle Einbahnstrassen für Radfahrende in Gegenrichtung freigegeben (Stand 17. Juli 2026). In der Einbahnstrasse gegen die Richtung ist es bei «Radverkehr frei» heute widersprüchlich: Die StVO lässt dich mitfahren, die eKFV verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist die Gegenrichtung erlaubt, wo «Radverkehr frei» sie öffnet.',
        {
          table: {
            caption: 'Wo in Oldenburg eigene Regeln gelten und wer sie setzt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es regelt'],
            rows: [
              ['Fussgängerzone der Innenstadt', 'Nicht fahren, ausser mit «Elektrokleinstfahrzeuge frei»; ab 1. März 2027 auch mit «Radverkehr frei», im Schritttempo', 'Bund (eKFV, StVO)'],
              ['Promenade am Alten Stadthafen', 'Seit 15. März 2024 reine Fussgängerzone ohne «Radfahrer frei»: nicht fahren', 'Stadt (Beschilderung)'],
              ['Grünanlagen, Friedhöfe, Parkhäuser', 'Vor allem dort liegen die vereinbarten Fahr- und Parkverbotszonen; wo genau, sagt die Stadt nicht', 'Stadt und Bolt (Vereinbarung)'],
              ['Dobbenanlagen', 'Rasen und begehbare Anlagenteile nicht mit Kraftfahrzeugen befahren; nach unserer Lesart auch nicht mit dem E-Scooter', 'Stadt (Satzung von 2022)'],
              ['Marktplätze während der Marktzeit', 'Keine «Fahrzeuge aller Art», weder gefahren noch mitgeführt; nach unserer Lesart auch kein E-Scooter', 'Stadt (Marktordnung)'],
              ['Campus Haarentor und Wechloy', 'Schrittgeschwindigkeit, wo nichts anderes ausgeschildert ist; abstellen nur an den vorgesehenen Plätzen, in Gebäuden nur im Fahrradkeller', 'Universität (Hausordnung seit 1. Juli 2026)'],
              ['Schlossgarten, Eversten Holz', 'Die Landesmuseen nennen keine Regel zu Rädern oder E-Scootern', 'Niedersächsische Landesmuseen Oldenburg'],
            ],
          },
        },
        {
          list: [
            '**Innenstadt:** Am 1. August 1967 sperrte die Stadt 13 Hektar der Innenstadt für den Kraftfahrzeugverkehr. Ohne Freigabe durch ein Schild steigst du in der Fussgängerzone ab und schiebst.',
            '**Hafen:** Die Promenade am Alten Stadthafen ist laut Stadt seit dem 15. März 2024 «eine reine Fussgängerzone»; dort fährst du auch nach dem 1. März 2027 nicht.',
            '**Dobben:** Die Satzung über die Dobbenanlagen zwischen Rummelweg, Lasiusstrasse, Tappenbeckstrasse und Hindenburgstrasse verbietet, «Rasenflächen und sonstige begehbare Anlagenteile mit Kraftfahrzeugen zu befahren». E-Scooter nennt sie nicht; nach unserer Lesart gilt das auch für sie.',
            '**Schlossgarten und Eversten Holz:** Beide gehören laut den Landesmuseen zum Betrieb Niedersächsische Landesmuseen Oldenburg, der für beide keine Regel zu Rädern oder E-Scootern nennt.',
            '**Universität:** Ihre Hausordnung gilt seit dem 1. Juli 2026 auf dem ganzen Gelände: «Für Fahrzeuge aller Art gilt Schrittgeschwindigkeit», und «Fahrräder, Pedelecs und E-Scooter sind an den dafür vorgesehenen Plätzen abzustellen». Der Botanische Garten am Philosophenweg gehört zur Universität; nach unserer Lesart gilt die Hausordnung auch dort.',
            '**Jade Hochschule:** In ihrer Rechtssammlung nennt sie keine Regel zu E-Scootern.',
            '**Märkte und Kramermarkt:** Die Marktordnung verbietet auf den Wochenmärkten, dem Kramermarkt und dem Lamberti-Markt, «während der Marktzeit die Marktplätze mit Fahrzeugen aller Art zu befahren oder Fahrzeuge aller Art mitzuführen»; nach unserer Lesart gilt das auch für E-Scooter. Der Kramermarkt an den Weser-Ems-Hallen findet das nächste Mal vom 1. bis 10. Oktober 2027 statt.',
            '**Nachts und im Winter:** Eine nächtliche Sperrzeit oder Winterpause nennen weder die Stadt noch Bolt (Stand 26. Oktober 2026).',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter in Oldenburg parken: Innenstadt, Schlossplatz, Hauptbahnhof',
      blocks: [
        'Laut Stadt kann ein Leih-Scooter «an jedem beliebigen Ort innerhalb eines definierten Gebietes in Oldenburg abgestellt werden, sofern der Abstellplatz den Regeln der Strassenverkehrsordnung und den Regeln der Sondernutzungserlaubnis entspricht». In den vereinbarten Verbotszonen dürfen die Scooter weder fahren noch stehen: «Das betrifft vor allem Grünanlagen, Friedhöfe und Parkhäuser.»',
        'In Bolts Bedingungen heisst es: «Für das Parken von E-Scootern gelten die für Fahrräder geltenden Parkvorschriften entsprechend»; in den roten Bereichen der App stellst du nicht ab. Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO, und Falschparken auf Geh- oder Radweg kostet dann ab 55 €.',
        'Eigene Abstellregeln für den Schlossplatz, die Innenstadt oder den Hauptbahnhof nennt die Stadt nicht (Stand 26. Oktober 2026); dort gilt, was Strassenverkehrsordnung und App erlauben.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, läuft die Miete weiter: Fahr aus der Verbotszone hinaus. Blockiert ein Leih-Scooter den Gehweg, meldest du das laut Stadt direkt bei Bolt, etwa über die App oder Bolts Website.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Oldenburg: Bussgelder, Alkohol, Polizei',
      blocks: [
        'In Oldenburg gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
        'Die Polizeiinspektion Oldenburg-Stadt/Ammerland zählte 2025 in der Stadt, ohne Autobahn, 62 Verkehrsunfälle mit E-Scootern (2024: 63); vier Menschen wurden schwer und 46 leicht verletzt. Sie kontrolliert auch E-Scooter: Am 29. September 2026 fiel ihr in der Huntestrasse einer auf, der «augenscheinlich deutlich schneller als die zulässige Höchstgeschwindigkeit unterwegs war». Gegen den 16-jährigen Fahrer leitete sie Ermittlungsverfahren wegen Fahrens ohne Fahrerlaubnis und eines Verstosses gegen das Pflichtversicherungsgesetz ein.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Zug: VWG, VBN, NordWestBahn und DB',
      blocks: [
        'Laut Stadt lassen der Verkehrsverbund Bremen/Niedersachsen (VBN) und damit auch die Verkehr und Wasser GmbH (VWG) «seit dem 1. Juni 2024 aus brandschutztechnischen Gründen keine Elektro-Tretroller in ihre Busse». Die VBN-Bedingungen (gültig ab 1. Januar 2026, Stand 23. April 2026) lassen Elektrokleinstfahrzeuge zu, «mit der Ausnahme, dass E-Tretroller ausschliesslich in Zügen mitgenommen werden dürfen».',
        {
          list: [
            '**VWG-Bus:** kein E-Scooter, auch nicht zusammengeklappt.',
            '**Regionalzug ab Oldenburg Hbf:** E-Scooter dürfen ins Fahrrad- oder Mehrzweckabteil, mit einem FahrradTicket für jede Fahrt und nur, solange Platz ist. Das FahrradTicket kostet als TagesTicket laut VBN 2,50 € (Preisstufen I, A, B und S), im Gesamtnetz 4,90 €.',
            '**NordWestBahn:** Dort dürfen E-Scooter laut VBN «auch im zusammengeklappten Zustand aus Sicherheitsgründen nur im Mehrzweckbereich» mit. «Ein Anspruch auf Mitnahme besteht nicht», heisst es in den Beförderungsbedingungen der NordWestBahn (gültig ab 1. August 2026).',
            '**Akku:** nur ein vom Hersteller freigegebener mit CE-Prüfzeichen, nicht sichtbar beschädigt; Laden im Zug ist verboten.',
            '**IC und ICE der Deutschen Bahn:** Zusammengeklappt und sicher verstaut fährt dein eigener E-Scooter dort kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Miete in der Nähe der Haltestelle, ohne den Zugang zu versperren, und leih dir am Ziel einen neuen.',
      ],
    },
    {
      heading: 'Bremen und das Umland: E-Scooter in der Nähe',
      blocks: [
        'In Bremen verleihen Dott und Lime; was dort gilt, steht in [E-Scooter in Bremen](guide:bremen), die freien Scooter zeigt die [Karte von Bremen](map:de:Bremen). Ob du eine Fahrt jenseits der Oldenburger Stadtgrenze beenden darfst, zeigt die App.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter kann ich in Oldenburg mieten?',
      answer: 'Die von Bolt, dem einzigen Anbieter, den die Stadt nennt (Stand 17. Juli 2026). Du musst mindestens 18 sein, einen Führerschein brauchst du nicht. Dass Voi, Dott, Lime, Bird oder Zeus in Oldenburg vermieten, nennt keine offizielle Quelle.',
    },
    {
      question: 'Was kostet ein E-Scooter von Bolt in Oldenburg?',
      answer: 'Den Preis zeigt dir die App vor dem Entsperren; weder die Stadt noch die VWG nennen einen Tarif. Teuer wird Falschparken: 15 € ohne klares Abstellfoto, bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs.',
    },
    {
      question: 'Wo darf ich in Oldenburg einen Leih-Scooter abstellen?',
      answer: 'Laut Stadt überall im festgelegten Gebiet, wo Strassenverkehrsordnung und Sondernutzungserlaubnis es erlauben; laut Bolt gelten die Parkregeln für Fahrräder. Tabu sind die mit Bolt vereinbarten Verbotszonen, vor allem Grünanlagen, Friedhöfe und Parkhäuser, und die roten Bereiche in der App.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Schlossgarten oder die Dobben fahren?',
      answer: 'Für Schlossgarten und Eversten Holz nennen die Landesmuseen keine Regel zu Rädern oder E-Scootern; welche Grünanlagen zu den mit Bolt vereinbarten Fahrverbotszonen gehören, sagt die Stadt nicht. In den Dobbenanlagen verbietet eine Satzung der Stadt, Rasen und begehbare Anlagenteile mit Kraftfahrzeugen zu befahren, nach unserer Lesart auch mit dem E-Scooter.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus der VWG mitnehmen?',
      answer: 'Nein, seit dem 1. Juni 2024 nicht, auch nicht zusammengeklappt. In Regionalzügen darf er mit FahrradTicket mit, solange Platz ist; in Fernzügen der Deutschen Bahn fährt ein eigener, zusammengeklappter E-Scooter kostenlos als Handgepäck mit.',
    },
  ],
  sources: [
    { title: 'Stadt Oldenburg: Elektro-Tretroller (17. Juli 2026)', url: 'https://www.oldenburg.de/startseite/stadtraum/verkehr-mobilitaet/elektromobilitaet/elektro-tretroller.html' },
    { title: 'Stadt Oldenburg: Weitere Regelungen für den Radverkehr (17. Juli 2026)', url: 'https://www.oldenburg.de/startseite/stadtraum/verkehr-mobilitaet/radverkehr/radfahren/weitere-regelungen-fuer-den-radverkehr.html' },
    { title: 'Stadt Oldenburg: Neue Regelung am Stadthafen (17. Juli 2026)', url: 'https://www.oldenburg.de/startseite/stadtraum/verkehr-mobilitaet/radverkehr/radfahren/neue-regelung-am-stadthafen.html' },
    { title: 'Stadt Oldenburg: Geschichte der Fussgängerzone (31. August 2026)', url: 'https://www.oldenburg.de/startseite/kultur/stadtportrait/zeitgeschichte/geschichte-der-fussgaengerzone.html' },
    { title: 'Stadt Oldenburg: Satzung über die Benutzung der Dobbenanlagen vom 28. Februar 2022 (PDF)', url: 'https://www.oldenburg.de/fileadmin/oldenburg/Benutzer/Dateien/22_Rechtsamt/7.50_28.02.2022_K_b.pdf' },
    { title: 'Stadt Oldenburg: Marktordnung vom 20. Juni 2000, Fassung vom 15. April 2024 (PDF)', url: 'https://www.oldenburg.de/fileadmin/oldenburg/Benutzer/Dateien/22_Rechtsamt/7.31_20240415_K_b.pdf' },
    { title: 'Stadt Oldenburg: Allgemeine Informationen zum Kramermarkt (16. September 2026)', url: 'https://www.oldenburg.de/startseite/kultur/veranstaltungen/veranstaltungshoehepunkte/kramermarkt/allgemeine-informationen-zum-kramermarkt.html' },
    { title: 'Stadt Oldenburg: Öffentliches Fahrradverleihsystem OLi-Bike (17. Juli 2026)', url: 'https://www.oldenburg.de/startseite/stadtraum/verkehr-mobilitaet/radverkehr/oeffentliches-fahrradverleihsystem/oli-bike.html' },
    { title: 'LGLN: OpenGeoData Niedersachsen, ALKIS Verwaltungsgrenzen (Daten von September 2023)', url: 'https://ni-lgln-opengeodata.hub.arcgis.com/pages/alkis-verwaltungsgrenzen' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. August 2023 bis 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicle-old/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Bolt: Oldenburg', url: 'https://bolt.eu/de-de/cities/oldenburg/' },
    { title: 'Niedersächsische Landesmuseen Oldenburg', url: 'https://www.landesmuseenoldenburg.de/' },
    { title: 'Schlossgarten Oldenburg: Besuch', url: 'https://www.schlossgarten-ol.de/besuch-1' },
    { title: 'Universität Oldenburg: Hausordnung (in Kraft seit 1. Juli 2026)', url: 'https://uol.de/hausordnung' },
    { title: 'Universität Oldenburg: Kontakt und Standorte (Stand 19. September 2026)', url: 'https://uol.de/kontakt' },
    { title: 'Universität Oldenburg: Botanischer Garten (Stand 19. September 2026)', url: 'https://uol.de/botgarten/oeffnungszeiten' },
    { title: 'Jade Hochschule: Rechtssammlung', url: 'https://www.jade-hs.de/ueber-uns/organisation/einrichtungen/personal-recht/rechtssammlung/' },
    { title: 'Polizei Oldenburg-Stadt/Ammerland: Verkehrsunfallstatistik 2025 (14. April 2026)', url: 'https://www.presseportal.de/blaulicht/pm/68440/6254684' },
    { title: 'Polizei Oldenburg-Stadt/Ammerland: Mehrere Verstösse bei Verkehrskontrollen festgestellt (30. September 2026)', url: 'https://www.presseportal.de/blaulicht/pm/68440/6361748' },
    { title: 'VBN: Tarifbestimmungen und Beförderungsbedingungen, gültig ab 1. Januar 2026, Stand 23. April 2026 (PDF)', url: 'https://www.vbn.de/fileadmin/content/_Tickets/Tarifbestimmungen/Tarifbestimmungen_und_Befoerderungsbedingungen_2026.pdf' },
    { title: 'NordWestBahn: Beförderungsbedingungen (gültig ab 1. August 2026)', url: 'https://www.nordwestbahn.de/de/befoerderungsbedingungen' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Deutsche Bahn: Beförderungsbedingungen (Stand 26. Oktober 2026), A.7.1', url: 'https://www.bahn.de/agb' },
  ],
};

export default guide;
