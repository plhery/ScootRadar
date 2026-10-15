import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-stuttgart',
  topic: 'stuttgart',
  name: 'E-Scooter Stuttgart: Anbieter, Preise, Parken',
  title: 'E-Scooter Stuttgart 2026: Anbieter, Preise, Parken, Wasen',
  description: 'E-Scooter Stuttgart: die vier Anbieter, was zehn Minuten kosten, wo du in der City parkst, was auf dem Wasen gilt und welcher Scooter in Bus und Bahn darf.',
  headline: 'E-Scooter Stuttgart: Anbieter, Preise, Parkzonen und was auf dem Wasen gilt',
  lede: 'Einen E-Scooter in Stuttgart leihst du ab 18 und ohne Führerschein bei Voi, Dott (früher TIER), Lime oder Bolt. Zehn Minuten kosten nach den veröffentlichten Tarifen (Stand 13. Oktober 2026) zwischen 2,89 € bei Voi und 3,29 € bei Dott. In der City beendest du die Fahrt nur an markierten Flächen, in Fussgängerzonen, in Parks, am Flughafen und an der Messe gar nicht. Deinen eigenen Scooter nimmst du zusammengeklappt jederzeit kostenlos in Bus und Bahn des VVS mit, einen Leih-Scooter nie.',
  published: '2026-10-13',
  updated: '2026-10-14',
  city: 'de:Stuttgart',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Stuttgart?',
      blocks: [
        'In Stuttgart vermieten vier Anbieter E-Scooter, alle mit einer Erlaubnis der Stadt: **Voi**, **Dott**, **Lime** und **Bolt**. Dott hiess früher TIER; wer TIER fuhr, nutzt seit Oktober 2024 die Dott-App. Die Seiten der Stadt nennen noch «Tier» oder «TIER/DOTT», gemeint ist derselbe Anbieter.',
        'Gemietet wird in der App des Anbieters, ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'ScootRadar zeigt alle vier auf der [Karte rund um Stuttgart](map:de:Stuttgart): Am Vormittag des 13. Oktober 2026 standen dort rund 5200 Scooter. Das ist eine Momentaufnahme der offenen Datenfeeds, keine Flottengrösse; erlaubt sind höchstens 6000.',
        'Mit «E-Roller» sind oft auch Elektro-Mopeds gemeint, wie sie etwa stella vermietet: Für die brauchst du Führerschein und Helm, um sie geht es hier nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Stuttgart?',
      blocks: [
        'Voi nennt seinen Stuttgarter Tarif auf seiner Website, Dott, Bolt und Lime nur in ihren offenen Datenfeeds.',
        {
          table: {
            caption: 'E-Scooter-Preise in Stuttgart (veröffentlichte Tarife, Stand 13. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,49 €', '0,24 €', '2,89 €', '5,29 €'],
              ['Bolt', '0,99 €', '0,22 €', '3,19 €', '5,39 €'],
              ['Lime (nur laut Datenfeed)', '1,00 €', '0,22 €', '3,20 €', '5,40 €'],
              ['Dott', '0,99 €', '0,23 €', '3,29 €', '5,59 €'],
            ],
          },
        },
        'Bis etwa 25 Minuten ist Voi wegen der niedrigen Entsperrgebühr am günstigsten, bei längeren Fahrten sind es Bolt und Lime mit 0,22 € pro Minute. Laut Stadt zählt jede angefangene Minute. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Wo der nächste Scooter steht, zeigt die [Live-Karte von Stuttgart](map:de:Stuttgart).',
      ],
    },
    {
      heading: 'Wo darf man in Stuttgart mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. «Gehwege und Fussgängerzonen sind tabu», schreibt die Stadt.',
        '**Königstrasse:** Die grosse Einkaufsstrasse ist Fussgängerzone, ebenso Nebenstrassen wie Schulstrasse und Calwer Strasse. Laut den Anbieterdaten sperrt keine App sie oder bremst dich dort. Absteigen und schieben musst du trotzdem, sonst kostet es 15 bis 30 €.',
        '**Parks:** Im Schlossgarten, im Rosensteinpark und in anderen Grünanlagen darfst du keinen Scooter abstellen. Fahren darfst du dort laut Polizeiverordnung der Stadt nur auf freigegebenen und gekennzeichneten Wegen.',
        '**Kessel:** «Den Kessel und die Halbhöhe verbinden unzählige Treppen», schreibt die Stadt, und über die Stäffele kommst du mit keinem Scooter. Nach Degerloch oder in die Halbhöhe fährst du deshalb auf Umwegen über die Strasse. Schau vorher auf den Akku, nimm dir bergauf Zeit und brems bergab früh. Dott begrenzt seine Scooter laut Datenfeed auf 19 km/h.',
      ],
    },
    {
      heading: 'E-Scooter in Stuttgart abstellen: City, Hauptbahnhof, Parks',
      blocks: [
        'In stark besuchten Bereichen stellst du den Scooter laut Stadt nur auf gekennzeichneten Flächen ab. In der City liegen sie laut den Daten der Anbieter etwa in der Kronprinz-, Gymnasium- oder Marktstrasse. In Limes Datenfeed sind fast die ganze Königstrasse und der Schillerplatz Parkverbotszone, der Marktplatz nicht.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung der Daten der vier Anbieter, Stand 13. Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Königstrasse, Schillerplatz, Marktplatz, Theodor-Heuss-Strasse', 'Nur an markierten Flächen'],
              ['Hauptbahnhof, Vorplatz (Arnulf-Klett-Platz)', 'Nicht auf dem Vorplatz; markierte Flächen rund 170 bis 230 m entfernt, etwa in der Kriegsberg- und der Kronenstrasse'],
              ['Bahnhof Bad Cannstatt', 'An markierten Flächen, etwa in der Frösner- und der Seelbergstrasse'],
              ['Schlossgarten, Rosensteinpark, Wilhelma, Killesberg', 'Gar nicht'],
              ['König-Karls- und Rosensteinbrücke, Wasen-Festplatz', 'Gar nicht, bei Voi nur an Stationen'],
              ['Flughafen, Messe, Fernsehturm', 'Gar nicht: ausserhalb der Gebiete aller vier Anbieter'],
            ],
          },
        },
        'Sonst stellst du den Scooter frei ab, solange niemand behindert wird; auf dem Gehweg bleiben mindestens 2 m frei. Mitte 2025 zählte die Stadt 36 Abstellflächen und 47 Verbotszonen. Jeder Anbieter setzt die Zonen selbst um: Massgeblich ist die Karte in deiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder neben statt auf einer markierten Fläche. Fahr zur nächsten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Behindert ein abgestellter Scooter andere, kann die Stadt ihn entfernen, und dem Verursacher droht eine Strafgebühr oder ein Bussgeld. Dazu kommen die Gebühren der Anbieter laut ihren deutschen Bedingungen: Dott bis 300 € fürs Einsammeln, Voi 25 €, Bolt 15 € ohne klares Abstellfoto; Lime gibt Bussgelder und Abschleppkosten weiter.',
        'Steht dir ein Scooter im Weg, darfst du ihn laut Stadt ein paar Meter umstellen oder an der Hotline melden, die auf dem Scooter steht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Stuttgart: Bussgelder, Alkohol, Unfälle',
      blocks: [
        'In Stuttgart gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht (Stadt und Polizei raten zum Helm), bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        '2024 zählte die Polizei in Stuttgart 147 Unfälle mit E-Scootern und ähnlichen Elektrokleinstfahrzeugen. 106 verursachten deren Fahrer, 33 davon unter Alkohol oder Drogen. Ein Unfall in Bad Cannstatt endete tödlich.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter zum Cannstatter Wasen: Volksfest und Frühlingsfest',
      blocks: [
        'Beim **Cannstatter Volksfest** vom 25. September bis 11. Oktober 2026 konntest du laut Stuttgarter Zeitung auf dem Festgelände und drumherum bei keinem der vier Anbieter eine Fahrt beenden. Abstellen ging nur ausserhalb dieser Zone oder an vier Flächen, die die Anbieter mit der Stadt vereinbart hatten:',
        {
          list: [
            'Benzstrasse, wenige Meter von der Mercedesstrasse;',
            'Schönestrasse, Ecke König-Karl-Strasse;',
            'Eisenbahnstrasse;',
            'Frösnerstrasse am Bahnhof Bad Cannstatt.',
          ],
        },
        'Von 22 bis 5 Uhr gab es Scooter nur nach einem Reaktionstest in der App, und Lime sperrte nach drei Fehlversuchen das Konto für zwei Stunden. Laut Lime verdoppelten sich während des Volksfests die Fahrten ab dem Bahnhof Bad Cannstatt.',
        'Auch beim **Frühlingsfest** 2026 konntest du Leih-Scooter laut Stuttgarter Zeitung vor Ort nur an vier festen Stationen abgeben und ausleihen, nachts nur nach einem Reaktionstest. Rechne beim nächsten Fest auf dem Wasen wieder damit und prüf die Zonen vorher in der App.',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: VVS, Zacke, Flughafen und RegioRad',
      blocks: [
        'Anders als in München, Köln oder Frankfurt sind E-Scooter in Stuttgarts Stadtbahnen und Bussen nicht verboten. Für deinen eigenen gilt beim VVS:',
        {
          list: [
            '**Zusammengeklappt** gilt er als «Sache» und fährt jederzeit kostenlos in S-Bahn, Stadtbahn und Bus mit.',
            '**Nicht zusammengeklappt** zählt er als Fahrrad: nicht in der Stadtbahn montags bis freitags von 6 bis 8:30 und von 16 bis 18:30 Uhr (ausser an Feiertagen), nie in SSB-Bussen oder in der Seilbahn.',
            '**Leih-Scooter** lassen sich nicht klappen und dürfen laut Stadt nie mit: Fahrt vor der Haltestelle beenden, am Ziel einen neuen mieten.',
          ],
        },
        'Die **Zacke** vom Marienplatz nach Degerloch schiebt bergauf einen Wagen für Fahrräder; «andere Fahrzeuge scheiden aus», schreibt die SSB. Ein E-Scooter kommt also nicht auf den Radwagen. Oben in Degerloch beendest du laut den Daten der Anbieter eine Fahrt bei Bolt, Lime und Voi, nicht aber bei Dott.',
        '**Flughafen und Messe** liegen ausserhalb der Gebiete aller vier Anbieter: Dort endet keine Fahrt, und ein Voi bremst an der Gebietsgrenze ab. Nimm die S-Bahn oder die Stadtbahn.',
        '**RegioRadStuttgart**, das Leihrad von DB Connect, ist für kurze Wege günstiger (Fahrrad, Stand 13. Oktober 2026):',
        {
          list: [
            '**Light:** ohne Grundgebühr 0,10 € pro Minute, höchstens 9 € pro Tag und Fahrt.',
            '**Basis:** 3 € im Jahr und 0,04 € pro Minute.',
            '**polygoCard:** 3 € im Jahr als Fahrtguthaben, die ersten 30 Minuten jeder Fahrt gratis, dann 0,04 € pro Minute. Die Karte bestellst du kostenlos, auch ohne VVS-Abo.',
          ],
        },
        'Eine Viertelstunde kostet damit 1,50 €, 0,60 € oder nichts. Pedelecs kosten mehr.',
      ],
    },
    {
      heading: 'Obergrenze und Erlaubnis: Wer verleiht ab 2027 in Stuttgart E-Scooter?',
      blocks: [
        'Seit einem Beschluss des Gemeinderats vom 22. Juni 2023 brauchen die Anbieter eine Sondernutzungserlaubnis der Stadt. Erlaubt sind höchstens 6000 Leih-Scooter, 1500 je Anbieter, davon je Anbieter höchstens 100 in der Kernstadt. Pro Scooter und angefangenem Monat zahlen sie laut dem seit Januar 2026 geltenden Gebührenverzeichnis 7,50 € in der Kernstadt, 6 € in den übrigen Innenstadtbezirken und 4,50 € im Rest der Stadt, damit die Scooter auch in die Stadtteile kommen.',
        'Die aktuellen Erlaubnisse vergab die Stadt im Dezember 2024 nach einem Auswahlverfahren; sie gelten vom 1. Januar 2025 bis zum 31. Dezember 2026. Danach vergibt die Stadt sie laut einer Antwort an den Landtag vom September 2025 in einem neuen Auswahlverfahren, bei dem sich bisherige und neue Anbieter aus ganz Deutschland bewerben können. Eine Ausschreibung oder Gewinner hatte die Stadt bis zum 14. Oktober 2026 nicht veröffentlicht: Wer ab 2027 in Stuttgart E-Scooter verleiht, ist noch offen.',
        'Ab 1. März 2027 gilt das gewerbliche Aufstellen von Leih-Scootern bundesweit als Sondernutzung; Stuttgart behandelt es schon heute so.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Stuttgart',
      blocks: [
        {
          list: [
            '**Wie viele Stäffele Stuttgart hat, weiss niemand.** Die Stadt zählt «mehr als 400 Freilufttreppen», aber: «Ganz genau weiss die Anzahl niemand.» Ihre Tourismusseite nennt rund 20 Kilometer Stufen, eine Meldung der Stadt von 2025 rund 30.',
            '**Die Zacke ist keine Touristenbahn.** Laut Stadt ist sie die einzige Zahnradbahn in Deutschland, die nicht touristischen Zwecken dient. Ab Dezember 2026 soll sie dauerhaft bis kurz vor 23 Uhr fahren.',
            '**147 Unfälle, zweimal.** 2021 zählte die Polizei in Stuttgart 147 Unfälle mit E-Scootern, rund 80 Prozent davon verursacht von den Fahrenden. 2024 waren es wieder genau 147.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche App brauche ich für einen E-Scooter in Stuttgart?',
      answer: 'Die von Voi, Dott (früher TIER), Lime oder Bolt, den vier Anbietern mit einer Erlaubnis der Stadt. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Scooter aller vier zeigt die [Live-Karte von Stuttgart](map:de:Stuttgart).',
    },
    {
      question: 'Welcher E-Scooter-Anbieter ist in Stuttgart am günstigsten?',
      answer: 'Für Fahrten bis etwa 25 Minuten Voi: 0,49 € fürs Entsperren und 0,24 € pro Minute, zehn Minuten kosten also 2,89 € (Stand 13. Oktober 2026). Bei längeren Fahrten sind Bolt und Lime mit 0,22 € pro Minute günstiger. Noch billiger fährst du mit dem Leihrad RegioRad.',
    },
    {
      question: 'Was kostet Lime in Stuttgart?',
      answer: 'Auf seiner Stuttgart-Seite nennt Lime keinen Preis. Sein offener Datenfeed nennt am 13. Oktober 2026 für fast alle Scooter 1,00 € fürs Entsperren und 0,22 € pro Minute, zehn Minuten kämen also auf 3,20 €. Verbindlich ist der Preis in der Lime-App.',
    },
    {
      question: 'Darf ich einen E-Scooter in der S-Bahn in Stuttgart mitnehmen?',
      answer: 'Einen eigenen ja: Zusammengeklappt gilt er beim VVS als «Sache» und fährt jederzeit kostenlos in S-Bahn, Stadtbahn und Bus mit. Sonst zählt er als Fahrrad, mit dessen Sperrzeiten. Leih-Scooter lassen sich nicht klappen und dürfen nie mit.',
    },
    {
      question: 'Gibt es Leih-E-Scooter am Stuttgarter Flughafen?',
      answer: 'Nein. Flughafen und Messe liegen ausserhalb der Gebiete aller vier Anbieter, dort kannst du keine Fahrt beenden. Nimm die S-Bahn in die Stadt und steig dort auf einen Scooter um.',
    },
  ],
  sources: [
    { title: 'Stadt Stuttgart: E-Scooter ausleihen', url: 'https://www.stuttgart.de/leben/mobilitaet/elektromobilitaet/e-scooter/' },
    { title: 'Stadt Stuttgart: Häufige Fragen zu E-Scootern', url: 'https://www.stuttgart.de/leben/mobilitaet/elektromobilitaet/e-scooter/faqs-e-scooter' },
    { title: 'Stadt Stuttgart: Neue Massnahmen für E-Scooter (16. Januar 2025)', url: 'https://www.stuttgart.de/pressemitteilungen/2025/januar/e-scooter-in-stuttgart-neue-massnahmen-fuer-mehr-verkehrssicherheit' },
    { title: 'Gemeinderat Stuttgart, GRDrs 760/2022: Sondernutzungserlaubnisse für E-Scooter (PDF)', url: 'https://www.domino1.stuttgart.de/web/ksd/ksdRedSystem.nsf/0/350AA0B9CA670B13C12589CD005861D1/$File/04C74C52FD177BE1C12588EF00446ED2.pdf' },
    { title: 'Landtag Baden-Württemberg, Drucksache 17/9326: E-Scooter in Stuttgart (September 2025, PDF)', url: 'https://www.landtag-bw.de/files/live/sites/LTBW/files/dokumente/WP17/Drucksachen/9000/17_9326_D.pdf' },
    { title: 'Stuttgarter Zeitung: E-Scooter beim Cannstatter Volksfest (25. September 2026)', url: 'https://www.stuttgarter-zeitung.de/lokales/stuttgart/cannstatter-volksfest-e-scooter-sollen-nicht-zur-stolperfalle-werden-wasen-wird-wieder-verbotszone-79046921.html' },
    { title: 'VVS: Fahrradmitnahme', url: 'https://www.vvs.de/fahrradmitnahme' },
    { title: 'SSB: Regeln für die Zahnradbahn (PDF)', url: 'https://www.ssb-ag.de/fileadmin/Images/News/Presse/Regeln_Zahnradbahn.pdf' },
    { title: 'RegioRadStuttgart: Tarife', url: 'https://www.regioradstuttgart.de/de/start' },
    { title: 'Voi: E-Scooter in Stuttgart', url: 'https://www.voi.com/de/city/stuttgart' },
  ],
};

export default guide;
