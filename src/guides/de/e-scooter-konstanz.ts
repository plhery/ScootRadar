import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-konstanz',
  topic: 'konstanz',
  name: 'E-Scooter Konstanz: Anbieter, Preise, Parken',
  title: 'E-Scooter Konstanz 2026: Hopp, Lime, Zeus, Preise, Zonen',
  description: 'E-Scooter Konstanz: Hopp, Lime und Zeus, was zehn Minuten kosten, wo du an Altstadt und Seeufer nicht abstellst und was in Kreuzlingen gilt.',
  headline: 'E-Scooter Konstanz: Anbieter, Preise und Verbotszonen zwischen Altstadt, Uni und Schweizer Grenze',
  lede: 'Einen E-Scooter in Konstanz leihst du ohne Führerschein in der App von Hopp, Lime oder Zeus und entsperrst ihn per QR-Code; Hopp und Zeus vermieten ab 18. Hopp und Zeus verlangen 1 € fürs Entsperren und 0,25 € pro Minute, zehn Minuten kosten also 3,50 €; Lime nennt 1 € plus 0,29 € oder 0,31 € pro Minute, zzgl. MwSt. (Stand November 2026). Seit 2024 braucht jeder Anbieter eine Erlaubnis der Stadt und darf höchstens 150 Scooter aufstellen. Durch Fussgängerzone, Friedhof und Uferpromenade sollen Leih-Scooter nicht fahren, und abgestellt werden sie dort nicht, auch nicht auf Brücken, im Umfeld von Schulen und auf den 250 Metern zum Ufer.',
  published: '2026-10-22',
  updated: '2026-10-23',
  city: 'de:Konstanz',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Konstanz?',
      blocks: [
        'Leih-E-Scooter gibt es in Konstanz seit 2020, Zeus ist seit November 2020 dabei. Hopp ist ein Franchise-System aus Island; sein Konstanzer System «Hopp Konstanz» läuft seit 16. Januar 2025. Am 22. Oktober 2026 um 10:01 Uhr standen rund 290 Scooter: rund 110 von **Hopp** und rund 90 von **Zeus**, die zu diesem Zeitpunkt frei waren, und rund 90 von **Lime** nach der letzten Zählung. Wo gerade einer steht, siehst du auf der [Karte von Konstanz](map:de:Konstanz); wie das Mieten geht, erklärt der Ratgeber [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Zeus vermietet auch in Singen: mehr im [Ratgeber für Singen](guide:singen).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Konstanz?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Konstanz (Stand November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Hopp', '1,00 €', '0,25 €', '3,50 €', '6,00 €'],
              ['Lime (zzgl. MwSt.)', '1,00 €', '0,29 € oder 0,31 €', '3,90 € oder 4,10 €', '6,80 € oder 7,20 €'],
              ['Zeus', '1,00 €', '0,25 €', '3,50 €', '6,00 €'],
            ],
          },
        },
        'Hopp und Zeus sind damit gleich günstig, Lime kostet bei jeder Fahrtlänge mehr. Zeus bietet laut seiner Website auch Pässe ab 4,99 € an (Stand November 2026); welche es in Konstanz gibt, zeigt die App.',
        'Für längere Wege ist oft **konrad** günstiger, das Leihrad der Stadtwerke: 1,25 € für die ersten 30 Minuten, höchstens 10 € am Tag, und im Monatstarif für 20 € sind bei jeder Fahrt 30 Minuten frei (Stand November 2026). Stationen gibt es unter anderem am Bahnhof, an der Universität auf dem Giesberg und an der HTWG am Seerhein, an der Mainau und am Fährhafen Staad.',
      ],
    },
    {
      heading: 'E-Scooter in Konstanz abstellen: Altstadt, Seeufer und Brücken',
      blocks: [
        'Bis Ende 2023 galt eine Vereinbarung zwischen der Stadt und den Anbietern. Sie reichte nicht, so die Stadt im Januar 2024: Es gab immer mehr Streit zwischen Scooter-Fahrern, Fussgängern und Radfahrern, und viele Roller standen auf dem Gehweg. Seitdem macht die Stadt den Anbietern Auflagen:',
        {
          list: [
            '**Nicht fahren** sollen Leih-Scooter in der Fussgängerzone, auf dem Friedhof und an der Uferpromenade.',
            '**Nicht abstellen** darfst du sie in der Fussgängerzone, auf dem Friedhof, im Umfeld von Schulen, auf Brücken und auf den 250 Metern zum Ufer.',
            '**Auf dem Gehweg** müssen 2,5 Meter frei bleiben, an Haltestellen 3 Meter.',
            '**Falsch abgestellte Scooter** soll der Anbieter binnen zwei Stunden umstellen, ungenutzte spätestens nach 36 Stunden.',
          ],
        },
        'Im Paradies und am Altstadtring wollte die Stadt als Pilot Abstellflächen markieren; bewähren sie sich, sollen sie in der ganzen Stadt folgen.',
        'Die Anbieter setzen die Auflagen in ihren Apps unterschiedlich um. Hopp sperrt im Kern der Altstadt, rund um Konzil, Hafen und Stadtgarten und am Strandbad Horn sogar das Fahren. Zeus sperrt dort nur das Abstellen, dafür in einem grösseren Gebiet, und führt darin feste Abstellflächen, etwa am Fischmarkt und an der Laube. Lime sperrt vor allem Ufer, Brücken und Uni und lässt das Fahrtende in der Altstadt zu; in die Fussgängerzone stellst du den Scooter trotzdem nicht.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Hopp, Zeus und Lime, Stand November 2026)',
            head: ['Ort', 'Hopp', 'Zeus', 'Lime'],
            rows: [
              ['Marktstätte, Münster, Niederburg, Obermarkt, Rosgartenstrasse', 'Fahrverbot', 'Verbotszone', 'Erlaubt'],
              ['Konzil, Hafen, Stadtgarten', 'Fahrverbot', 'Verbotszone, ausser an den festen Flächen am Fischmarkt und an der Konzilstrasse', 'Am Hafen und im Stadtgarten Verbotszone, am Konzil erlaubt'],
              ['Obere und Untere Laube', 'Erlaubt', 'Erlaubt', 'Erlaubt'],
              ['Paradies', 'Meist erlaubt', 'Meist erlaubt', 'Zur Altstadt hin erlaubt, im Westen Verbotszone'],
              ['Bahnhof, Bahnhofplatz, LAGO', 'Verbotszone, am Bahnhof selbst Fahrverbot', 'Verbotszone', 'Erlaubt'],
              ['Uferpromenade an der Seestrasse', 'Verbotszone', 'Verbotszone', 'Verbotszone'],
              ['Strandbad Horn', 'Fahrverbot', 'Verbotszone, eine feste Fläche am Hörnle', 'Verbotszone'],
              ['Alte Rheinbrücke, Fahrradbrücke, Herosé-Park', 'Verbotszone', 'Verbotszone', 'Verbotszone'],
              ['Universität auf dem Giesberg', 'Auf dem Campus erlaubt', 'Meist Verbotszone, eine feste Fläche an der Universitätsstrasse', 'Fast überall Verbotszone'],
              ['HTWG, Bahnhof Petershausen', 'Meist erlaubt', 'Erlaubt', 'Verbotszone'],
              ['Petershausen, Wollmatingen', 'Meist erlaubt', 'Meist erlaubt', 'Meist erlaubt'],
              ['Fährhafen Staad, Insel Mainau, Litzelstetten', 'Ausserhalb des Gebiets', 'Verbotszone', 'Verbotszone'],
            ],
          },
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder ausserhalb des Gebiets. Schieb den Scooter aus der Altstadt oder vom Ufer weg, bis die App das Abstellen erlaubt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Mit dem E-Scooter zur Uni, zur HTWG und zum Bahnhof',
      blocks: [
        'Die **Universität** liegt auf dem Giesberg über Egg. Hopp lässt dich auf dem Campus abstellen. Zeus sperrt den grössten Teil, hat aber eine feste Fläche an der Universitätsstrasse. Lime sperrt fast den ganzen Campus; dann hilft konrad mit seiner Station an der Uni.',
        'Die **HTWG** liegt direkt am Seerhein. Hopp und Zeus erlauben das Abstellen dort. Lime sperrt das Ufer des Seerheins samt HTWG; mit Lime suchst du dir einen Platz in den Strassen dahinter im Paradies, etwa in der Zasiusstrasse.',
        'Am **Bahnhof Konstanz** beendest du bei Hopp und Zeus keine Fahrt, am Bahnhof selbst sperrt Hopp sogar das Fahren. Stell den Scooter vorher ab, etwa an der Oberen Laube, keine zehn Gehminuten entfernt; Lime lässt das Fahrtende am Bahnhof zu. Am **Bahnhof Petershausen** auf der anderen Rheinseite geht es bei Hopp und Zeus, bei Lime nicht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Konstanz: wo du fährst, Bussgelder, Promille',
      blocks: [
        'Es gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter bei Hopp und Zeus ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur, wo es keinen gibt, auf der Fahrbahn. Auf Gehwegen und in der Fussgängerzone der Altstadt fährst du nicht; die Uferpromenade sollen Leih-Scooter laut Stadt (Januar 2024) ebenfalls meiden.',
        'Manche Gassen öffnet ein Zusatzschild für den Radverkehr. Für E-Scooter gilt es heute nicht. Ab 1. März 2027 gibt «Radverkehr frei» auch E-Scooter frei, im Schritttempo; Hopp sperrt im Kern der Altstadt das Fahren aber unabhängig davon. Alle drei Anbieter vermieten rund um die Uhr.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'Neu geregelt'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Falsch abgestellt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'Unzulässig auf Geh- oder Radweg 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Mit dem E-Scooter nach Kreuzlingen?',
      blocks: [
        'Kreuzlingen in der Schweiz grenzt direkt an Paradies und Altstadt. Lime sperrt auf Schweizer Seite das Fahren, Zeus drosselt im Zentrum von Kreuzlingen auf 1 km/h, und Hopps Gebiet reicht nicht über die Grenze; eine Fahrt mit Hopp oder Lime beendest du drüben nicht. Donkey Republic verleiht in Kreuzlingen Fahrräder, E-Bikes und E-Lastenräder an Stationen.',
        'Fährst du einen eigenen E-Scooter über die Grenze, gelten drüben die Schweizer Regeln. Das E-Trottinett ist dort ein Leicht-Motorfahrrad, das du ab 16 ohne Führerausweis fährst, mit 14 und 15 nur mit Ausweis der Kategorie M. Das Licht brennt auch am Tag, auf dem Trottoir, also dem Gehweg, fährst du nicht (CHF 40.–), und die Grenze von 0,5 Promille gilt für alle, auch unter 21. Mehr in den [E-Trottinett-Regeln der Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'E-Scooter im Bus, auf der Fähre und auf der Mainau',
      blocks: [
        '**Bus:** Im Verkehrsverbund Hegau-Bodensee (VHB), also auch im Roten Arnold der Stadtwerke, gilt ein eigener E-Scooter laut Tarifbestimmungen als kostenloses Handgepäck, «wenn das E-Kfz zusammengeklappt getragen wird, es über- oder unter dem Sitz verstaut wird»: zusammengeklappt, getragen und am Sitz verstaut. Der Akku muss fest verbaut sein, laden darfst du ihn an Bord nicht (Stand 1. März 2026). Einen Anspruch auf Mitnahme hast du nicht; im Einzelfall entscheidet das Personal. Leih-Scooter lassen sich nicht klappen und bleiben draussen.',
        '**Fähre nach Meersburg:** Die Autofähre der Stadtwerke legt rund um die Uhr am Fährhafen Staad ab. Ein eigener E-Scooter gilt dort als Fahrrad: 7 € einfach samt Erwachsenem, 13,30 € hin und zurück (Tarif 2026); zusammengeklappt und verpackt fährt er kostenlos. Einen Leih-Scooter stellst du vorher ab: Am Fährhafen Staad beendest du bei keinem der drei eine Fahrt.',
        '**Mainau:** Auf die Blumeninsel darfst du keinen E-Scooter mitnehmen, auch kein Fahrrad; am Eingang gibt es Fahrradständer und kostenpflichtige Schliessfächer. Einen Leih-Scooter stellst du vorher ab; konrad hat an der Mainau eine Station.',
      ],
    },
    {
      heading: 'Wie Konstanz E-Scooter regelt: Sondernutzungserlaubnis und Obergrenze',
      blocks: [
        'Seit 1. Januar 2024 braucht jeder Anbieter eine Sondernutzungserlaubnis, um Scooter auf öffentliche Flächen zu stellen. So teilte es die Stadt im Januar 2024 mit: Jeder darf höchstens 150 Scooter aufstellen und zahlt 120 € pro Scooter und Jahr. Die Erlaubnis gibt der Stadt mehr Möglichkeiten, die Scooter zu regeln und zu kontrollieren.',
      ],
    },
    {
      heading: 'Schon gewusst? Roter Arnold und die Fähre von 1928',
      blocks: [
        {
          list: [
            '**Der Rote Arnold ist rot wegen der SPD.** Die Stadtbusse fahren seit 1927 und heissen nach Fritz Arnold, dem damaligen Leiter der technischen Werke; die rote Farbe geht laut Stadtwerken auf seine SPD-Mitgliedschaft zurück.',
            '**Die Fähre fährt seit 1928, auch nachts.** Seit September 1928 verbindet die Autofähre der Stadtwerke Staad mit Meersburg. Die Überfahrt dauert 15 Minuten, nachts legt die Fähre stündlich ab.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Konstanz?',
      answer: 'Die von Hopp, Lime oder Zeus. Bei Hopp und Zeus musst du 18 sein, bei Lime zeigt dir die App das Mindestalter; einen Führerschein brauchst du nicht. Wo gerade einer frei ist, zeigt die [Live-Karte von Konstanz](map:de:Konstanz).',
    },
    {
      question: 'Was kostet ein E-Scooter in Konstanz?',
      answer: '1 € fürs Entsperren und 0,25 € pro Minute bei Hopp und Zeus, zehn Minuten kosten also 3,50 €; Lime nennt 1 € plus 0,29 € oder 0,31 € pro Minute, zzgl. MwSt. (Stand November 2026). Am günstigsten fährst du mit Hopp oder Zeus.',
    },
    {
      question: 'Welche Regeln gelten mit dem E-Scooter in Kreuzlingen?',
      answer: 'Die Schweizer: Ein E-Trottinett fährst du dort ab 16 ohne Führerausweis, mit 14 und 15 nur mit Ausweis der Kategorie M. Das Licht brennt auch am Tag, auf dem Trottoir fährst du nicht, und die Grenze von 0,5 Promille gilt für alle. Mit einem Leih-Scooter kommst du kaum hinüber: Lime sperrt die Schweizer Seite, Zeus drosselt im Zentrum von Kreuzlingen auf 1 km/h, und Hopps Gebiet endet an der Grenze.',
    },
    {
      question: 'Wo darf ich in der Konstanzer Altstadt abstellen?',
      answer: 'Nicht in der Fussgängerzone und nicht am Ufer: Dort und auf Brücken, im Umfeld von Schulen und auf den 250 Metern zum Ufer dürfen Leih-Scooter laut Stadt (Januar 2024) nicht stehen. Auf dem Gehweg müssen 2,5 Meter frei bleiben, an Haltestellen 3 Meter. Hopp und Zeus sperren den Kern der Altstadt und den Bahnhof; an der Laube geht es bei allen dreien, und Zeus hat feste Flächen, etwa am Fischmarkt beim Konzil.',
    },
    {
      question: 'Darf ich einen E-Scooter auf die Fähre nach Meersburg mitnehmen?',
      answer: 'Einen eigenen ja: Er gilt als Fahrrad und kostet einfach 7 € samt Erwachsenem, zusammengeklappt und verpackt nichts. Einen Leih-Scooter stellst du am Fährhafen Staad nicht ab.',
    },
    {
      question: 'Darf ich mit dem E-Scooter auf die Insel Mainau?',
      answer: 'Nein. E-Scooter, Fahrräder und Skateboards dürfen nicht auf die Insel; am Eingang gibt es Fahrradständer und Schliessfächer.',
    },
  ],
  sources: [
    { title: 'seemoz: Miet-E-Scooter: Betreiber brauchen nun Sondernutzungserlaubnis (Mitteilung der Stadt, 15. Januar 2024)', url: 'https://www.seemoz.de/miet-e-scooter-betreiber-brauchen-nun-sondernutzungserlaubnis/' },
    { title: 'MobiData BW: offene Daten von Hopp Konstanz (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/hopp_konstanz/gbfs' },
    { title: 'MobiData BW: offene Daten von Zeus Konstanz (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_konstanz/gbfs' },
    { title: 'MobiData BW: offene Daten von Lime in Baden-Württemberg (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/lime_bw/gbfs' },
    { title: 'MobiData BW: offene Daten von Donkey Republic Kreuzlingen (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/donkey_kreuzlingen/gbfs' },
    { title: 'Zeus: ZEUS Is Now In Konstanz (20. November 2020)', url: 'https://zeusscooters.com/2020/11/zeus-is-now-in-konstanz/' },
    { title: 'Zeus: Städte', url: 'https://zeusscooters.com/cities/' },
    { title: 'Zeus: Preise und Pässe', url: 'https://zeusscooters.com/' },
    { title: 'Zeus: Allgemeine Geschäftsbedingungen (14. April 2023)', url: 'https://zeusscooters.com/terms-and-conditions/' },
    { title: 'Hopp: Standorte', url: 'https://hopp.bike/locations' },
    { title: 'Hopp: Nutzungsbedingungen für Deutschland', url: 'https://hopp.bike/tos?group=389FGQfb9eqWNoxBiQlENu' },
    { title: 'Hopp: E-Scooter und E-Bikes, Preise', url: 'https://hopp.bike/two-wheels' },
    { title: 'Stadtwerke Konstanz: Fahrradmietsystem konrad', url: 'https://www.stadtwerke-konstanz.de/fahrrad/fahrradmietsystem/' },
    { title: 'Stadtwerke Konstanz: Stadtbus, Infos', url: 'https://www.stadtwerke-konstanz.de/bus/infos/' },
    { title: 'Stadtwerke Konstanz: Besondere Beförderungsbedingungen Stadtbus', url: 'https://www.stadtwerke-konstanz.de/public/uploads/bus/doc/swk-bus-besondere-befoerderungsbedingungen.pdf' },
    { title: 'VHB: Tarifbestimmungen und Beförderungsbedingungen (1. März 2026)', url: 'https://www.vhb-info.de/fileadmin/Seiten/Downloads/Tarif_und_Befoerderung/2026_03_01_VHB-TBBB.pdf' },
    { title: 'Stadtwerke Konstanz: Fähre Konstanz–Meersburg, Infos', url: 'https://www.stadtwerke-konstanz.de/faehre/infos/' },
    { title: 'Stadtwerke Konstanz: Fähre Konstanz–Meersburg, Tarife 2026', url: 'https://www.stadtwerke-konstanz.de/faehre/tarife/' },
    { title: 'Stadtwerke Konstanz: Beförderungsbedingungen Fähre Konstanz–Meersburg (Mai 2025)', url: 'https://www.stadtwerke-konstanz.de/public/uploads/mobilitaet/doc/2025-05-befoerderungsbedingungen-ohne-preise.pdf' },
    { title: 'Insel Mainau: Besucherfragen', url: 'https://www.mainau.de/de/besucherfragen.html' },
  ],
};

export default guide;
