import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-koeln',
  topic: 'cologne',
  name: 'E-Scooter Köln: Anbieter, Preise, Parken',
  title: 'E-Scooter Köln 2026: Anbieter, Preise, Parken, Karneval',
  description: 'E-Scooter Köln: die sechs Anbieter, was zehn Minuten kosten, wo du in der Altstadt parkst, was an Karneval gilt und warum die KVB keine Scooter mitnimmt.',
  headline: 'E-Scooter Köln: Anbieter, Preise, Parkzonen und was an Karneval gilt',
  lede: 'Einen E-Scooter in Köln leihst du ab 18 und ohne Führerschein bei Bolt, Dott, Lime, RideMovi, Ryde oder Voi. Zehn Minuten kosten nach den veröffentlichten Tarifen (Stand 13. Oktober 2026) bei Dott 4 € und bei Voi 3 €, bei den anderen zeigt die App den Preis. In der Altstadt beendest du die Fahrt nur an Stationen, am Rheinufer, auf Brücken und in Parks gar nicht, und an Karneval sperrt die Stadt Ausleihe und Rückgabe in den Feierzonen. In Bahnen und Bussen der KVB sind E-Scooter verboten.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'de:Köln',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Köln?',
      blocks: [
        'Sechs Anbieter vermieten in Köln E-Scooter: **Bolt**, **Dott**, **Lime**, **RideMovi**, **Ryde** und **Voi**, laut Stadt 2026 zusammen fast 20 000 Scooter. Tier heisst heute Dott: Wer früher Tier fuhr, nutzt seit Oktober 2024 die Dott-App.',
        'Du leihst den Scooter in der App des Anbieters, laut Stadt ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte rund um Köln](map:de:Köln) Dott, seit dem 24. Oktober 2026 auch Voi und seit dem 25. Oktober Lime und Bolt: am Samstag, 24. Oktober, kurz nach 15 Uhr rund 2850 Dott- und 4100 Voi-Scooter, am Sonntagmittag rund 4700 Lime- und 1900 Bolt-Scooter. RideMovi und Ryde fehlen darauf.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Köln?',
      blocks: [
        'Einen Kölner Tarif veröffentlichen nur Dott und Voi.',
        {
          table: {
            caption: 'E-Scooter-Preise in Köln (veröffentlichte Tarife, Stand 13. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', '1,00 €', '0,30 €', '4,00 €', '7,00 €'],
              ['Voi', '0,00 €', '0,30 €', '3,00 €', '6,00 €'],
              ['Bolt, Lime, RideMovi, Ryde', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde kostet damit 5,50 € bei Dott und 4,50 € bei Voi. Verbindlich ist der Preis in der App. Günstiger für kurze Wege: KVB-Rad mit 1 € pro 15 Minuten (siehe unten). Den nächsten Dott oder Voi und eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Köln](map:de:Köln).',
      ],
    },
    {
      heading: 'Wo darf man in Köln mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch **Domplatte**, **Hohe Strasse** und **Schildergasse**. Dotts App sperrt sie nicht, erlaubt ist das Fahren trotzdem nicht: Steig am Rand ab und schieb.',
        'In Parks wie Rheinpark oder Volksgarten ist das Abstellen verboten; ein ausdrückliches Fahrverbot für Kölner Parks haben wir nicht gefunden. Strassenbahnschienen querst du am besten im rechten Winkel, damit das Vorderrad nicht in die Rille rutscht.',
        'Die deutschen Regeln, kurz: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Daran halten sich viele nicht: 2023 zählte die Kölner Polizei über 580 Fälle mit zwei Personen auf einem Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, mit Behinderung oder Gefährdung mehr', '25 €, mit Behinderung oder Gefährdung mehr'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd: 15 € (Stadt Köln)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in der Kölner Altstadt parken: nur an Stationen',
      blocks: [
        'In der Altstadt und im Kolumbaviertel beendest du eine Fahrt nur an einer Rückgabestation; im November 2025 hat die Stadt die Zone vergrössert. Ihre Karte vom November 2024 zeigt 16 Stationen, Dotts Datenfeed am 13. Oktober 2026 allein 39 Dott-Stationen in der Zone, etwa am Breslauer Platz.',
        'Rund um den Dom darf seit 2019 ganztägig kein Scooter stehen: Die Fläche bleibt als Rettungs- und Evakuierungsfläche frei.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Zonen der Stadt und von Dott, Stand 13. Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Roncalliplatz, Hauptbahnhof, Breslauer Platz, Eigelstein', 'Nur an einer Station'],
              ['Hohe Strasse, Schildergasse, Neumarkt, Appellhofplatz', 'Nur an einer Station'],
              ['Alter Markt, Heumarkt, Gross St. Martin, Waidmarkt', 'Nur an einer Station'],
              ['Rheinauhafen, Rheinboulevard Deutz, Rheinpark', 'Gar nicht'],
              ['Hohenzollern-, Deutzer, Severins- und Zoobrücke', 'Gar nicht'],
              ['Volksgarten, Stadtgarten, Mediapark, Stadtwald', 'Gar nicht'],
              ['Ringe von Friesenplatz bis Rudolfplatz, Zülpicher Strasse, Belgisches Viertel', 'Nicht Freitag- und Samstagnacht (20 bis 6 Uhr)'],
            ],
          },
        },
        'Die offizielle Abstellfläche vor dem Hauptbahnhof ist laut WDR (August 2026) oft überfüllt. Die Zonen ändern sich; massgeblich ist die Karte in deiner App.',
      ],
    },
    {
      heading: 'E-Scooter in Köln abstellen: Rhein, Brücken, Parks und Wochenendnächte',
      blocks: [
        'Seit dem 10. August 2021 beendest du in ganz Köln an diesen Stellen keine Fahrt:',
        {
          list: [
            'in den Fussgängerzonen links des Rheins;',
            'auf den Rheinbrücken;',
            'am Rheinufer und in einem 30 m breiten Streifen dahinter;',
            'an Seen, Weihern und anderen Gewässern und ihren Ufern;',
            'in allen Grünanlagen.',
          ],
        },
        '**Freitag- und Samstagnacht** (20 bis 6 Uhr) kommen laut Stadt die Ringe zwischen Friesen- und Rudolfplatz, die Zülpicher Strasse, das Belgische Viertel und die Altstadt dazu. Ob jede App das umsetzt, haben wir nicht geprüft; stell den Scooter dann besser ausserhalb ab.',
        'Seit November 2025 richtet die Stadt auch rund um ihre Mobilstationen Parkverbote ein, ohne einen Radius zu nennen: Lässt dich die App neben einer Station die Fahrt nicht beenden, fahr auf die Fläche. Sonst darfst du auf dem Gehweg parken, wenn niemand behindert wird, mindestens 1,50 m frei bleiben und du weder Bordsteinkante noch Blindenleitstreifen blockierst.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Stations- oder Verbotszone. Fahr zur nächsten Station oder aus der Zone hinaus: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Neben dem Bussgeld berechnen die Anbieter laut ihren deutschen Bedingungen eigene Gebühren: Dott bis 300 € fürs Einsammeln, Voi 25 €, Bolt 15 € bei falschem Abstellen ohne klares Foto; Lime gibt Bussgelder und Abschleppkosten weiter. Ein Foto vom abgestellten Scooter schützt dich.',
      ],
    },
    {
      heading: 'E-Scooter an Karneval, am 11.11. und bei Grossveranstaltungen',
      blocks: [
        'Bei grossen Festen schaltet die Stadt in den Feierzonen Ausleihe und Rückgabe aller Leihfahrzeuge ab. Durchfahren bleibt erlaubt. Wer dort ein KVB-Rad abgibt, zahlt 20 € extra.',
        {
          table: {
            caption: 'Zonen ohne Ausleihe und Rückgabe: Beispiele aus 2025 und 2026 (Stadt Köln und KVB)',
            head: ['Anlass', 'Zeitraum', 'Gesperrte Zonen'],
            rows: [
              ['11.11.2025', '10. und 11. November', 'Altstadt, Kwartier Latäng, Zülpicher Strasse, Uni-Wiese, Friesenstrasse und Friesenplatz, Severinsviertel'],
              ['Weihnachtsmärkte 2025', 'bis 23. Dezember', 'Roncalliplatz, Alter Markt, Heumarkt, Neumarkt, Rudolfplatz'],
              ['Silvester 2025', '31. Dezember bis Neujahrsmorgen', 'Altstadt vom Hauptbahnhof bis zu den Museen, Rheinboulevard Deutz, Deutzer und Severinsbrücke'],
              ['Strassenkarneval 2026', '12. bis 17. Februar', 'Alter Markt, Heumarkt, Dom, Zülpicher Strasse, Kwartier Latäng, Severinstrasse, Rudolfplatz und mehr'],
              ['CSD 2026', '3. bis 5. Juli', 'Alter Markt, Heumarkt, Schaafenstrasse'],
              ['gamescom city festival 2026', '28. bis 30. August', 'Rudolfplatz, Hohenzollernring zwischen Brabanter Strasse und Friesenwall'],
            ],
          },
        },
        'Für den **11.11.2026**, einen Mittwoch, waren die Zonen am 13. Oktober noch nicht veröffentlicht (2025 kamen sie am 28. Oktober). Rechne wieder mit Sperren in Altstadt, Kwartier Latäng und rund um die Zülpicher Strasse, ebenso zu den Weihnachtsmärkten und an Karneval 2027 (Weiberfastnacht ist am 4. Februar).',
        'Auch nach dem Kölsch gelten auf dem Scooter die Promillegrenzen fürs Auto: ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0. 2023 standen laut Polizei 83 der 400 in Köln verletzten E-Scooter-Fahrer unter Alkohol.',
        'Zum Spiel ins RheinEnergieStadion: Rund ums Stadion liegt in Dotts Daten eine grosse Parkverbotszone, und die KVB hat dort im Juli 2026 fünf KVB-Rad-Stationen eingerichtet.',
      ],
    },
    {
      heading: 'E-Scooter und KVB: Mitnahmeverbot, KVB-Rad, Flughafen',
      blocks: [
        'Seit dem 1. März 2024 darfst du E-Tretroller nicht mehr in Stadtbahnen und Bussen der KVB mitnehmen, auch nicht zusammengeklappt, weil ihre Akkus brennen können. Mit dem Leih-Scooter heisst das: vor der Haltestelle abstellen, am Ziel einen neuen mieten.',
        '**Zum Flughafen Köln/Bonn:** Terminals und Flughafenbahnhof liegen ausserhalb des Gebiets von Dott; die anderen Anbieter haben wir nicht geprüft. Nimm die Bahn und steig erst in der Stadt auf einen Scooter um.',
        '**KVB-Rad**, das Leihradsystem der KVB mit nextbike, ist für kurze Wege oft günstiger. Gratis zurückgeben kannst du das Rad an Stationen und in nicht eingefärbten Strassen und Zonen; in der gelben Zone kostet es 1 € extra, anderswo 20 €.',
        {
          table: {
            caption: 'KVB-Rad: Tarife (Stand 13. Oktober 2026)',
            head: ['Tarif', 'Preis'],
            rows: [
              ['Basistarif', '1 € pro 15 Minuten, höchstens 15 € in 24 Stunden'],
              ['Mit VRS-Chipkarte, für Studierende von Partnerhochschulen oder mit digitalem Deutschlandticket oder VRS-Abo der KVB', 'erste 30 Minuten gratis, dann 1 € pro halbe Stunde'],
              ['Monats-Abo (10 €) oder Jahres-Abo (60 €)', 'erste 30 Minuten jeder Fahrt inklusive, dann 1 € pro halbe Stunde'],
              ['Tages-, 3-Tage- und Wochenpass', '1,79 €, 3,29 € und 5,99 € für 30, 60 und 120 Minuten Fahrzeit'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Ab 2027 nur noch drei Anbieter? Was die Stadt plant',
      blocks: [
        'Seit 2022 brauchen die Anbieter in Köln eine Sondernutzungserlaubnis und zahlen laut Satzung (Stand 2024) 7,10 bis 10,80 € pro Scooter und Monat. Trotzdem wuchs die Flotte von 10 000 bis 12 500 Scootern (2019 bis 2024) auf fast 20 000. Für 2027 plant die Verwaltung deshalb ein Auswahlverfahren:',
        {
          list: [
            'höchstens 9000 bis 10 000 Scooter, rund die Hälfte von heute;',
            'voraussichtlich drei Anbieter, ausgewählt nach Punkten etwa für Personal, Beschwerden und Parken;',
            'Genehmigungen ab 1. Januar 2027 für ein bis zwei Jahre, ohne neue Anbieter in dieser Zeit.',
          ],
        },
        'Veröffentlicht werden sollte das Verfahren Ende September 2026. Der WDR meldete im August, es laufe bereits; der Mobilitätsausschuss des Rats vertagte das Thema am 22. September. Wer ab 2027 in Köln E-Scooter vermietet, steht noch nicht fest (Stand 13. Oktober 2026). In Frankfurt verleihen nach einem solchen Verfahren seit Juli 2026 nur noch drei Anbieter: [E-Scooter in Frankfurt](guide:frankfurt). Ein komplettes Verbot hält die Stadt nach dem Fahrrad- und Nahmobilitätsgesetz von NRW für rechtlich nicht möglich (Stand 2023).',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Köln',
      blocks: [
        {
          list: [
            '**Im Rhein landen immer noch Scooter.** 2021 fand der WDR Hunderte im Fluss, vor allem an der Hohenzollernbrücke; seitdem gilt das Parkverbot am Ufer. Im Juli 2026 zogen Freiwillige der Initiative K.R.A.K.E. bei Niedrigwasser am Altstadtufer trotzdem 18 heraus. Einer von ihnen hat nach eigenen Worten in fünf Jahren etwa 260 geborgen, «Tendenz steigend».',
            '**Die Polizei warnt auf Bierdeckeln.** Mit der Brauerei Malzmühle druckte sie 15 000 Deckel mit Sprüchen aus dem Kölschen Grundgesetz wie «Et hätt noch immer jot jejange». Seit August 2026 legen die Mühlen-Brauhäuser über 25 000 neue Deckel aus: «Drinkste ene met? – Dann lass den E-Scooter stehen».',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App kann ich in Köln nutzen?',
      answer: 'Die von Bolt, Dott, Lime, RideMovi, Ryde oder Voi: Diese sechs Anbieter vermieten laut Stadt in Köln E-Scooter. Einen Führerschein brauchst du nicht, aber du musst 18 sein. Freie Dott-, Voi-, Lime- und Bolt-Scooter zeigt auch die [Live-Karte von Köln](map:de:Köln).',
    },
    {
      question: 'Wie viel kosten zehn Minuten E-Scooter in Köln?',
      answer: 'Bei Dott 4 € (1 € Entsperren plus 0,30 € pro Minute), bei Voi 3 € (0,30 € pro Minute, Entsperren gratis), nach den veröffentlichten Tarifen vom 13. Oktober 2026. Bolt, Lime, RideMovi und Ryde zeigen ihren Preis in der App.',
    },
    {
      question: 'Gibt es in Köln ein E-Scooter-Verbot?',
      answer: 'Nein, ein komplettes Verbot hält die Stadt für rechtlich nicht möglich. Sie will die Flotte aber ab 2027 auf 9000 bis 10 000 Scooter von drei Anbietern halbieren; wer das ist, steht noch nicht fest. Verboten sind E-Scooter in Bahnen und Bussen der KVB.',
    },
    {
      question: 'Darf ich an Karneval mit dem E-Scooter fahren?',
      answer: 'Durchfahren ja, aber in den Feierzonen kannst du weder ausleihen noch zurückgeben, 2026 vom 12. bis 17. Februar etwa am Alter Markt, am Dom und an der Zülpicher Strasse. Die Zonen für den 11.11.2026 gibt die Stadt erfahrungsgemäss kurz vorher bekannt. Auf dem Scooter gelten die Promillegrenzen fürs Auto.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bahn und Bus der KVB mitnehmen?',
      answer: 'Nein. Seit dem 1. März 2024 sind E-Tretroller in Stadtbahnen und Bussen der KVB verboten, auch zusammengeklappt, wegen der Brandgefahr der Akkus. Leih-Scooter darfst du ohnehin nie mitnehmen.',
    },
  ],
  sources: [
    { title: 'Stadt Köln: Häufig gestellte Fragen zu E-Scootern', url: 'https://www.stadt-koeln.de/artikel/68437/index.html' },
    { title: 'Stadt Köln, Mitteilung 1701/2026: E-Scooter-Sharing ab 2027 (PDF)', url: 'https://ratsinformation.stadt-koeln.de/getfile.asp?id=1099681&type=do' },
    { title: 'Stadt Köln: Grössere Abstellverbotszonen in der Altstadt (21. November 2025)', url: 'https://www.stadt-koeln.de/politik-und-verwaltung/presse/mitteilungen/28061/index.html' },
    { title: 'Stadt Köln: Sondernutzungssatzung, Fassung vom 10. Juni 2024 (PDF)', url: 'https://www.stadt-koeln.de/mediaasset/content/satzungen/sondernutzungssatzung_10_06_2024.pdf' },
    { title: 'KVB: Keine E-Tretroller in Bahnen und Bussen', url: 'https://www.kvb.koeln/service/spielregeln/etretroller.html' },
    { title: 'KVB: Leihfahrzeuge zum Strassenkarneval 2026', url: 'https://www.kvb.koeln/unternehmen/presse/pressemitteilungen.html?view=1502' },
    { title: 'KVB-Rad: Tarife', url: 'https://www.kvb-rad.de/koeln/de/' },
    { title: 'Dott: Tarif für Köln im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/cologne/system_pricing_plans.json' },
    { title: 'Voi: E-Scooter in Köln', url: 'https://www.voi.com/city/cologne' },
    { title: 'WDR: E-Scooter aus dem Rhein geborgen (18. Juli 2026)', url: 'https://www1.wdr.de/nrw/koeln/e-scooter-koeln-rhein-bergung-100.html' },
  ],
};

export default guide;
