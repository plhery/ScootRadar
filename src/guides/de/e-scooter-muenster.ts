import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-muenster',
  topic: 'munster',
  name: 'E-Scooter Münster: Anbieter, Preise, Parken',
  title: 'E-Scooter Münster 2026: Anbieter, Preise, Parkzonen',
  description: 'E-Scooter Münster: die vier Anbieter, was zehn Minuten kosten, wo du in der Innenstadt parkst, ob du auf der Promenade fahren darfst und was im Bus gilt.',
  headline: 'E-Scooter Münster: Anbieter, Preise, Parkzonen und was auf der Promenade gilt',
  lede: 'Einen E-Scooter in Münster leihst du ab 18 und ohne Führerschein bei Dott (früher TIER), Bolt, Voi oder Qick. Zehn Minuten kosten nach den veröffentlichten Tarifen (Stand 24. Oktober 2026) bei Voi 2,50 € und bei Dott 4 €, bei Bolt und Qick zeigt die App den Preis. Innerhalb der Promenade, am Ring und an den grossen Ausfallstrassen beendest du die Fahrt nur in einer der 433 ausgewiesenen Parkzonen, sonst zahlst du weiter. Auf der Promenade musst du bis Ende Februar 2027 wohl schieben, und in die Stadtbusse darf kein E-Scooter, auch kein zusammengeklappter.',
  published: '2026-10-14',
  updated: '2026-10-25',
  city: 'de:Münster',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Münster?',
      blocks: [
        'Laut Stadt vermieten vier Anbieter in Münster E-Scooter: **Dott**, **Bolt**, **Voi** und **Qick**. Dott hiess früher TIER; wer TIER fuhr, nutzt heute die Dott-App. Qick aus Schweden ist seit März 2026 mit gelben Scootern in der Stadt und wird oft «Quick» geschrieben. Lime hat sich laut Stadt zurückgezogen, Bird ist ebenfalls weg.',
        'Du leihst den Scooter in der App des Anbieters, ab 18, obwohl das Gesetz eigene E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte rund um Münster](map:de:Münster) Dott und seit dem 24. Oktober 2026 auch Voi und Qick: an jenem Samstag kurz nach 15 Uhr rund 1300 Dott- und 1050 Voi-Scooter, kurz nach Mitternacht rund 1750 Qick-Scooter. Das sind Momentaufnahmen, keine Flottengrössen. Bolt-Scooter siehst du nur in der App.',
        'Handorf, Wolbeck, Roxel, Amelsbüren und das Zentrum von Kinderhaus liegen laut Dotts Datenfeed ausserhalb seines Gebiets; ob die anderen dort fahren, zeigt nur deren App.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Münster?',
      blocks: [
        'Einen Tarif für Münster veröffentlichen Dott und Voi in ihren offenen Datenfeeds; Bolt und Qick zeigen ihre Preise nur in der App.',
        {
          table: {
            caption: 'E-Scooter-Preise in Münster (veröffentlichte Tarife, Stand 24. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,25 €', '2,50 €', '5,00 €'],
              ['Dott', '1,00 €', '0,30 €', '4,00 €', '7,00 €'],
              ['Bolt, Qick', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde kostet damit 3,75 € bei Voi und 5,50 € bei Dott; bei Dott zählt jede angefangene Minute voll. Pässe und Abos gibt es nur in den Apps; verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Den nächsten Dott oder Voi und eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Münster](map:de:Münster).',
      ],
    },
    {
      heading: 'Wo darf man in Münster mit dem E-Scooter fahren?',
      blocks: [
        'Laut Stadt fährst du nur auf Radwegen, Radfahrstreifen und Fahrradstrassen und, wo es nichts davon gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu.',
        '**Altstadt:** Ludgeristrasse, Salzstrasse, Windthorststrasse, Stubengasse und Teile der Rothenburg sind laut OpenStreetMap Fussgängerzone: absteigen und schieben. Die nächtliche Freigabe für Fahrräder in Ludgeri- und Salzstrasse (laut OpenStreetMap 20 bis 9 Uhr) gilt für E-Scooter erst ab 1. März 2027, dann im Schritttempo. Die Dott-App bremst dich dort nicht: Fahrverbots- oder Langsamfahrzonen hat Dott in Münster laut Datenfeed keine.',
        '**Domplatz:** Mittwochs und samstags von 7 bis 14:30 Uhr ist Wochenmarkt; Fahrräder sind dort laut Stadt nicht erlaubt. Lass auch den Scooter draussen.',
        '**Radwege:** 77 Prozent der Münsteraner fahren laut Stadt täglich oder mehrmals pro Woche Rad. Lass schnellere Radfahrer überholen, und fahr bis Ende Februar 2027 nicht nebeneinander: Das kostet 15 bis 30 €.',
      ],
    },
    {
      heading: 'Darf man mit dem E-Scooter auf der Promenade fahren?',
      blocks: [
        'Wahrscheinlich nicht, jedenfalls bis Ende Februar 2027. Die Promenade, der rund 4,5 km lange autofreie Ring um die Altstadt, ist laut OpenStreetMap überwiegend mit «Verbot für Fahrzeuge aller Art» und dem Zusatzzeichen «Radverkehr frei» beschildert. Unter diesem Verbot darfst du einen E-Scooter laut eKFV nur schieben, und «Radverkehr frei» gilt für E-Scooter erst ab 1. März 2027.',
        'Eine Regel der Stadt dazu haben wir nicht gefunden und auch kein Foto, auf dem das Zusatzzeichen lesbar ist. Massgeblich ist deshalb, was am Zugang steht:',
        {
          list: [
            '**Nur «Radverkehr frei»:** bis 28. Februar 2027 schieben, ab 1. März 2027 fahren.',
            '**«Elektrokleinstfahrzeuge frei»:** fahren erlaubt.',
            '**Blaues Radwegschild:** fahren erlaubt; einige kurze Abschnitte sind laut OpenStreetMap Radwege.',
          ],
        },
        'Für den **Prinzipalmarkt** gilt dasselbe: Laut OpenStreetMap ist er für Fahrzeuge gesperrt, Busse und Fahrräder ausgenommen. Mit dem Scooter schiebst du dort also wohl ebenfalls.',
      ],
    },
    {
      heading: 'E-Scooter in Münster parken: nur in Parkzonen',
      blocks: [
        'Seit dem 24. April 2023 beendest du innerhalb der Promenade und an der Weseler Strasse eine Fahrt nur in einer ausgewiesenen Parkzone. Bis Januar 2024 kamen der Ring und Abschnitte der Ausfallstrassen dazu, etwa Steinfurter, Grevener, Warendorfer, Wolbecker und Hammer Strasse und Albersloher Weg.',
        'Alle anderen öffentlichen Flächen dort sind Parkverbotszone: Die App lässt dich die Fahrt nicht beenden, und laut Stadt «läuft die Kostenrechnung solange weiter». Die Zonenkarte der Stadt zeigt 433 Parkzonen (Stand 9. Oktober 2026); du siehst sie auch in der App.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Zonenkarte der Stadt, Stand 9. Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Prinzipalmarkt, Rathaus, Lamberti, Domplatz, Kiepenkerl, Ludgeri- und Salzstrasse', 'Nur in einer Parkzone; vom Domplatz rund 270 m bis zur nächsten von Dott'],
              ['Hauptbahnhof (Berliner Platz und Bremer Platz)', 'Nur in einer Parkzone; Dotts Zone «HBF» liegt rund 60 m vom Eingang'],
              ['Schlossplatz, Botanischer Garten, Aaseeterrassen, Preussenstadion, Uniklinik', 'Nur in einer Parkzone'],
              ['Hafenweg und Kreativkai', 'Gar nicht'],
              ['Kreuzviertel, Hafenmarkt, Leonardo-Campus, Halle Münsterland, Bahnhof Hiltrup', 'Ja, wenn niemand behindert wird'],
              ['Allwetterzoo, LWL-Naturkundemuseum, Handorf, Wolbeck, Flughafen FMO', 'Bei Dott gar nicht: ausserhalb des Gebiets'],
            ],
          },
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Parkverbotszone oder neben statt in der Parkzone. Fahr zur nächsten Parkzone, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Ausserhalb dieser Bereiche stellst du den Scooter laut Stadt wie ein Fahrrad auf dem Gehweg ab, so dass niemand behindert wird. Grünanlagen wie Schlossgarten, Aasee, Südpark und Wienburgpark sind Parkverbotszone, ebenso die Kanalpromenade.',
        'Wer behindernd parkt, zahlt 20 €, wer andere gefährdet, 30 €. Entfernt die Stadt einen falsch geparkten Qick, darf Qick laut seinen Bedingungen bis zu 150 € von dir verlangen. Steht dir ein Scooter im Weg, melde ihn dem Anbieter; die Kontakte nennt die Stadt auf ihrer E-Scooter-Seite.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Münster: Bussgelder, Alkohol, Unfälle',
      blocks: [
        'In Münster gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto, auch nach Send oder Glühwein: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Die Polizei Münster zählte 2025 148 Unfälle mit E-Scootern, 37 mehr als im Vorjahr, und 107 verletzte Fahrerinnen und Fahrer, 16 davon schwer. Bei 25 Unfällen war Alkohol die Hauptursache.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Send, Weihnachtsmarkt, Preussen: E-Scooter bei Grossveranstaltungen',
      blocks: [
        'Eigene Scooter-Regeln für Send, Weihnachtsmärkte oder Spieltage hat die Stadt nicht veröffentlicht. Die Orte liegen aber alle in der Parkzonen-Pflicht: Fahr zur nächsten Parkzone, stell dort ab und lauf das letzte Stück.',
        {
          table: {
            caption: 'Grosse Termine in Münster (laut Stadt und Spielplan) und wo du die Fahrt beendest',
            head: ['Veranstaltung', 'Nächster Termin', 'Fahrt beenden'],
            rows: [
              ['Herbstsend, Schlossplatz', '24. Oktober bis 1. November 2026, Feuerwerk am 30. Oktober von 21 bis 21:30 Uhr', 'Nur in einer Parkzone; die nächste von Dott liegt rund 240 m vom Schlossplatz'],
              ['Sechs Weihnachtsmärkte, vom Rathausinnenhof bis zum Harsewinkelplatz', '23. November bis 23. Dezember 2026', 'Nur in einer Parkzone'],
              ['Heimspiele von Preussen Münster (3. Liga), Preussenstadion', 'Sonntag, 25. Oktober 2026, 16:30 Uhr, gegen Fortuna Köln, mitten im Herbstsend', 'Nur in einer Parkzone; Dott hat welche direkt an der Hammer Strasse'],
            ],
          },
        },
      ],
    },
    {
      heading: 'E-Scooter im Bus, Mobilitätsgarantie NRW, Flughafen und Leihräder',
      blocks: [
        'In den Stadtbussen der **Stadtwerke Münster** darfst du keinen E-Scooter mitnehmen, auch nicht zusammengeklappt: Die Stadtwerke folgen wegen der Brandgefahr der Akkus einer Empfehlung des Verbands Deutscher Verkehrsunternehmen. Leih-Scooter dürfen ohnehin nie mit: Fahrt vor der Haltestelle beenden, am Ziel einen neuen mieten.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten später ab als geplant, darfst du auf einen Leih-Scooter umsteigen und bekommst die Fahrt erstattet.',
        {
          list: [
            'Bis 30 € bei planmässiger Abfahrt zwischen 5 und 19:59 Uhr, bis 60 € zwischen 20 und 4:59 Uhr.',
            'Du steigst innerhalb von 60 Minuten um. Mit Ticket für die Strecke bekommst du bis zur Obergrenze alles zurück, ohne Ticket höchstens die Obergrenze minus den Ticketpreis.',
            'Den Beleg mit Name, Datum, Uhrzeit und Strecke reichst du binnen 14 Tagen beim verspäteten Verkehrsunternehmen ein, auch online über mobil.nrw.',
            'Bei Streik, Unwetter, Naturgewalten oder Bombendrohung gilt die Garantie nicht.',
          ],
        },
        '**Flughafen Münster/Osnabrück (FMO):** Dort stehen keine Dott-Scooter; Dotts nächster Abstellpunkt liegt rund 15 km entfernt. Zum Hauptbahnhof fahren die Busse S50 (Schnellbus) und R51.',
        '**Leihräder:** Ein öffentliches Leihradsystem hat Münster nicht. Räder, E-Bikes und Lastenräder verleiht die Radstation am Hauptbahnhof, E-Bikes auch Bolt; ScootRadar zeigt keine E-Bikes.',
      ],
    },
    {
      heading: 'Gebühr statt Obergrenze: Wie Münster E-Scooter regelt',
      blocks: [
        'Anstoss war ein Eilantrag des Blinden- und Sehbehindertenvereins Westfalen gegen die Leih-Scooter. Einen Anspruch auf ein Verbot sah das Verwaltungsgericht Münster am 9. Februar 2022 nicht, verpflichtete die Stadt aber, neu zu entscheiden: Freiwillige Zusagen der Anbieter reichten nicht. Die Stadt setzte auf Regeln:',
        {
          list: [
            'Seit März 2022 brauchen die Anbieter eine Sondernutzungserlaubnis, die sie jedes Quartal neu beantragen.',
            'Seit 1. April 2022 zahlen sie 12,50 € pro Scooter und Quartal.',
            'Auf Beschwerden müssen sie binnen zwölf Stunden reagieren.',
            'Eine Obergrenze für die Flotte gibt es nicht.',
          ],
        },
        'Von zeitweise rund 7200 Scootern blieben laut Stadt Anfang 2024 noch 4150, und die Verfahren wegen Falschparkens sanken von 3201 im Jahr 2022 auf 1492 im Jahr 2023.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Münster',
      blocks: [
        {
          list: [
            '**433 Parkzonen, zusammen rund 2,2 Hektar.** Die Parkverbotsflächen um sie herum messen rund 20 km², nach unserer Auswertung der Zonenkarte der Stadt.',
            '**Kaum ein Hügel.** Ganz Münster liegt zwischen 44 m an der Ems und 97 m am Mühlenberg.',
            '**Wieder Fahrradstadt Nummer eins.** Im ADFC-Fahrradklima-Test 2024 lag Münster unter den Städten über 200 000 Einwohnern vorn, vor Freiburg und Karlsruhe.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Münster?',
      answer: 'Die von Dott (früher TIER), Bolt, Voi oder Qick, den vier Anbietern laut Stadt; die gelben Scooter gehören zu Qick. Freie Dott-, Voi- und Qick-Scooter zeigt auch die [Live-Karte von Münster](map:de:Münster), die von Bolt nur dessen App.',
    },
    {
      question: 'Wie viel kosten zehn Minuten E-Scooter in Münster?',
      answer: 'Bei Voi 2,50 € (0,25 € pro Minute, Entsperren gratis), bei Dott 4 € (1 € Entsperren plus 0,30 € pro Minute), nach den veröffentlichten Tarifen vom 24. Oktober 2026. Bolt und Qick zeigen ihren Preis nur in der App.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Innenstadt nicht beenden?',
      answer: 'Weil du innerhalb der Promenade, am Ring und an den grossen Ausfallstrassen nur in einer ausgewiesenen Parkzone abstellen darfst; überall sonst sperrt die App dort das Beenden. Fahr zur nächsten Parkzone, die die App zeigt: Bis dahin läuft der Preis weiter.',
    },
    {
      question: 'Ist die Promenade für E-Scooter gesperrt?',
      answer: 'Zum Fahren wohl ja, bis Ende Februar 2027. Laut OpenStreetMap gilt dort meist «Verbot für Fahrzeuge aller Art» mit «Radverkehr frei», und diese Freigabe gilt für E-Scooter erst ab 1. März 2027. Bis dahin schiebst du, ausser ein Schild erlaubt ausdrücklich Elektrokleinstfahrzeuge.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus in Münster mitnehmen?',
      answer: 'Nein. In den Stadtbussen der Stadtwerke Münster sind E-Scooter verboten, auch zusammengeklappt, wegen der Brandgefahr der Akkus. Leih-Scooter darfst du ohnehin nie mitnehmen.',
    },
  ],
  sources: [
    { title: 'Stadt Münster: Elektro-Tretroller', url: 'https://www.stadt-muenster.de/ordnungsamt/elektro-tretroller' },
    { title: 'Stadt Münster: Karte der Park- und Parkverbotszonen für E-Scooter', url: 'https://geo.stadt-muenster.de/sperrzonen_emobility/' },
    { title: 'Stadt Münster, Vorlage V/0031/2024: Digitales Parkraummanagement für E-Scooter (PDF)', url: 'https://oparl.stadt-muenster.de/bodies/0001/downloadfiles/00541103.pdf' },
    { title: 'Stadt Münster: Gebühren für Sondernutzungen', url: 'https://www.stadt-muenster.de/ordnungsamt/sondernutzung-an-oeffentlichen-strassen/gebuehren.html' },
    { title: 'Dott: offener Datenfeed für Münster (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/munster/gbfs.json' },
    { title: 'NRW.Mobidrom: Mobilitätsdaten des Landes NRW, mit Vois offenen Datenfeeds', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung (eKFV), § 12', url: 'https://www.gesetze-im-internet.de/ekfv/BJNR075610019.html' },
    { title: 'Stadtwerke Münster: Fragen rund um Mobilität', url: 'https://www.stadtwerke-muenster.de/hilfe/mobilitaet/faq-rund-um-mobilitaet' },
    { title: 'Beförderungsbedingungen Nahverkehr NRW ab 1. Januar 2026, Mobilitätsgarantie (PDF)', url: 'https://www.westfalentarif.de/fileadmin/documents/Tarifbestimmungen_und_Bef%C3%B6rderungsbedingungen_Preise/BB_Nahverkehr_NRW_zum_01.01.2026.pdf' },
    { title: 'Polizei Münster: Verkehrsunfallstatistik 2025 (PDF)', url: 'https://muenster.polizei.nrw/sites/default/files/2026-03/Infobroschuere_VUS_2025_Polizei_Muenster.pdf' },
    { title: 'Flughafen Münster/Osnabrück: Anreise', url: 'https://www.fmo.de/anreise' },
  ],
};

export default guide;
