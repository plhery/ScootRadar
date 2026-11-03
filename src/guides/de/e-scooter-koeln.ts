import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-koeln',
  topic: 'cologne',
  name: 'E-Scooter Köln: Anbieter, Parken, Karneval',
  title: 'E-Scooter Köln 2026: Anbieter, Parken, Karneval, KVB',
  description: 'E-Scooter Köln: die sechs Anbieter, wo du in der Altstadt parkst, wo du keine Fahrt beendest, was an Karneval gilt und warum die KVB keine Scooter mitnimmt.',
  headline: 'E-Scooter Köln: Anbieter, Parkzonen und was an Karneval gilt',
  lede: 'Einen E-Scooter in Köln leihst du ab 18 und ohne Führerschein bei Bolt, Dott, Lime, RideMovi, Ryde oder Voi; den Preis zeigt dir die App vor dem Entsperren. In der Altstadt beendest du die Fahrt nur an Stationen, am Rheinufer, auf Brücken und in Parks gar nicht, und an Karneval sperrt die Stadt Ausleihe und Rückgabe in den Feierzonen. In Bahnen und Bussen der KVB sind E-Scooter verboten.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'de:Köln',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Köln?',
      blocks: [
        'Laut Stadt vermieten sechs Anbieter in Köln E-Scooter: **Bolt**, **Dott**, **Lime**, **RideMovi**, **Ryde** und **Voi**.',
        'Du leihst den Scooter in der App des Anbieters, laut Stadt ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'Am Freitag, 30. Oktober 2026, um 5:27 Uhr standen rund um Köln rund 2900 Dott-, 4200 Voi- und 1900 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 4400 Lime-Scooter nach der letzten Zählung. Wo gerade einer steht, siehst du auf der [Karte rund um Köln](map:de:Köln).',
      ],
    },
    {
      heading: 'Wo darf man in Köln mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch **Domplatte**, **Hohe Strasse** und **Schildergasse**: Steig am Rand ab und schieb.',
        'In Grünanlagen wie Rheinpark oder Volksgarten ist das Abstellen verboten.',
        'Die deutschen Regeln, kurz: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Trotzdem ahndete die Kölner Polizei 2023 über 580 Fahrten zu zweit.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, mit Behinderung oder Gefährdung mehr', '25 €, mit Behinderung oder Gefährdung mehr'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt'],
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
        'In der Altstadt und im Kolumbaviertel beendest du eine Fahrt nur an einer Rückgabestation; im November 2025 hat die Stadt die Zone vergrössert. Ihre Karte vom November 2024 zeigt 16 Stationen.',
        'Die Zonen ändern sich; massgeblich ist die Karte in deiner App.',
      ],
    },
    {
      heading: 'E-Scooter in Köln abstellen: Rhein, Brücken, Parks und Wochenendnächte',
      blocks: [
        'Seit dem 10. August 2021 beendest du in ganz Köln an diesen Stellen keine Fahrt:',
        {
          list: [
            'in den Fussgängerzonen links des Rheins;',
            'auf Brücken;',
            'am Rheinufer und in einem 30 m breiten Streifen dahinter;',
            'an Seen, Weihern und anderen Gewässern und ihren Ufern;',
            'in allen Grünanlagen.',
          ],
        },
        '**Freitag- und Samstagnacht** (20 bis 6 Uhr) kommen laut Stadt die Ringe zwischen Friesen- und Rudolfplatz, die Zülpicher Strasse, das Belgische Viertel und die Altstadt dazu. Stell den Scooter in diesen Nächten ausserhalb dieser Gebiete ab, auch wenn deine App dort das Beenden zulässt.',
        'Seit November 2025 richtet die Stadt auch rund um ihre Mobilstationen Parkverbote ein: Lässt dich die App neben einer Station die Fahrt nicht beenden, fahr auf die Fläche. Sonst darfst du auf dem Gehweg parken, wenn niemand behindert wird, mindestens 1,50 m frei bleiben und du weder Bordsteinkante noch Blindenleitstreifen blockierst.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Stations- oder Verbotszone. Fahr zur nächsten Station oder aus der Zone hinaus: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Mach nach dem Abstellen ein Foto vom Scooter: Es schützt dich, falls jemand ihn später umstösst.',
      ],
    },
    {
      heading: 'E-Scooter an Karneval, am 11.11. und bei Grossveranstaltungen',
      blocks: [
        'Bei grossen Festen schaltet die Stadt in den Feierzonen Ausleihe und Rückgabe aller Leihfahrzeuge ab. Durchfahren bleibt erlaubt.',
        {
          table: {
            caption: 'Zonen ohne Ausleihe und Rückgabe: Beispiele aus 2025 und 2026 (Stadt Köln und KVB)',
            head: ['Anlass', 'Zeitraum', 'Gesperrte Zonen'],
            rows: [
              ['11.11.2025', '10. und 11. November', 'Altstadt, Kwartier Latäng, Zülpicher Strasse, Uni-Wiese, Friesenstrasse und Friesenplatz, Severinsviertel'],
              ['Weihnachtsmärkte 2025', 'bis 23. Dezember', 'Roncalliplatz, Alter Markt, Heumarkt, Neumarkt, Rudolfplatz'],
              ['Silvester 2025', '31. Dezember bis Neujahrsmorgen', 'Altstadt vom Hauptbahnhof bis zu den Museen, Rheinboulevard Deutz, Deutzer und Severinsbrücke'],
              ['Strassenkarneval 2026', '12. bis 17. Februar', 'Alter Markt, Heumarkt, Dom, Zülpicher Strasse, Kwartier Latäng, Severinstrasse, Rudolfplatz und mehr'],
              ['gamescom city festival 2026', '28. bis 30. August', 'Rudolfplatz, Hohenzollernring zwischen Brabanter Strasse und Friesenwall'],
            ],
          },
        },
        'Rechne am **11.11.2026**, einem Mittwoch, wieder mit Sperren in Altstadt, Kwartier Latäng und rund um die Zülpicher Strasse, ebenso zu den Weihnachtsmärkten und an Karneval 2027 (Weiberfastnacht ist am 4. Februar).',
        'Auch nach dem Kölsch gelten auf dem Scooter die Promillegrenzen fürs Auto: ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0. 2023 standen laut Polizei 83 der 400 in Köln verletzten E-Scooter-Fahrer unter Alkohol.',
      ],
    },
    {
      heading: 'E-Scooter und KVB: Mitnahmeverbot und KVB-Rad',
      blocks: [
        'Seit dem 1. März 2024 darfst du E-Tretroller nicht mehr in Stadtbahnen und Bussen der KVB mitnehmen, auch nicht zusammengeklappt, weil ihre Akkus brennen können. Mit dem Leih-Scooter heisst das: vor der Haltestelle abstellen, am Ziel einen neuen mieten.',
        'Für kurze Wege gibt es auch **KVB-Rad**, das Leihradsystem der KVB.',
      ],
    },
    {
      heading: 'Sondernutzung und Landesrecht: was die Stadt regeln darf',
      blocks: [
        'Die Anbieter brauchen in Köln eine Sondernutzungserlaubnis und zahlen laut Satzung (Fassung vom 10. Juni 2024) 7,10 bis 10,80 € pro Scooter und Monat. Ein komplettes Verbot liesse das Landesrecht kaum zu: Nach dem Fahrrad- und Nahmobilitätsgesetz von NRW sollen kommunale Satzungen E-Scooter nicht so einschränken, dass ihr Angebot dadurch verhindert wird. Frankfurt hat die Zahl der Anbieter mit einem Auswahlverfahren begrenzt: [E-Scooter in Frankfurt](guide:frankfurt).',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Köln',
      blocks: [
        '**Die Polizei warnt auf Bierdeckeln.** Mit der Brauerei Malzmühle druckte sie 15 000 Deckel mit Sprüchen aus dem Kölschen Grundgesetz wie «Et hätt noch immer jot jejange». Seit August 2026 legen die Mühlen-Brauhäuser über 25 000 neue Deckel aus: «Drinkste ene met? – Dann lass den E-Scooter stehen».',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App kann ich in Köln nutzen?',
      answer: 'Die von Bolt, Dott, Lime, RideMovi, Ryde oder Voi: Diese sechs Anbieter vermieten laut Stadt in Köln E-Scooter. Einen Führerschein brauchst du nicht, aber du musst 18 sein. Wo gerade ein freier Scooter steht, zeigt die [Live-Karte von Köln](map:de:Köln).',
    },
    {
      question: 'Gibt es in Köln ein E-Scooter-Verbot?',
      answer: 'Nein, und ein komplettes Verbot liesse das NRW-Landesrecht kaum zu. Verboten sind E-Scooter in Bahnen und Bussen der KVB.',
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
    { title: 'Stadt Köln: Ausweitung der Abstellverbotszonen und feste Rückgabeorte (9. August 2021)', url: 'https://www.stadt-koeln.de/politik-und-verwaltung/presse/mitteilungen/23694/index.html' },
    { title: 'Stadt Köln: Netz von Mobilstationen vergrössert und verdichtet (21. November 2025)', url: 'https://www.stadt-koeln.de/politik-und-verwaltung/presse/mitteilungen/28061/index.html' },
    { title: 'Stadt Köln: Sondernutzungssatzung, Fassung vom 10. Juni 2024 (PDF)', url: 'https://www.stadt-koeln.de/mediaasset/content/satzungen/sondernutzungssatzung_10_06_2024.pdf' },
    { title: 'KVB: Keine E-Tretroller in Bahnen und Bussen', url: 'https://www.kvb.koeln/service/spielregeln/etretroller.html' },
    { title: 'KVB: Leihfahrzeuge zum Strassenkarneval 2026', url: 'https://www.kvb.koeln/unternehmen/presse/pressemitteilungen.html?view=1502' },
    { title: 'Polizei Köln: Bierdeckel-Kampagne und Zahlen für 2023 (Englisch)', url: 'https://koeln.polizei.nrw/en/have-a-drink-then-leave-the-e-scooter' },
    { title: 'about-drinks: Kampagne von Mühlen Kölsch und Polizei (14. August 2026)', url: 'https://www.about-drinks.com/muehlen-koelsch-und-polizei-koeln-werben-fuer-mehr-verkehrssicherheit-bei-e-scootern/' },
    { title: 'Fahrrad- und Nahmobilitätsgesetz NRW, § 30', url: 'https://recht.nrw.de/lrgv/gesetz/01012022-fahrrad-und-nahmobilitaetsgesetz-des-landes-nordrhein-westfalen-fahrrad-und/' },
  ],
};

export default guide;
