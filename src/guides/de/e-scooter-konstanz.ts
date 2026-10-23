import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-konstanz',
  topic: 'konstanz',
  name: 'E-Scooter Konstanz: Anbieter, Preise, Parken',
  title: 'E-Scooter Konstanz 2026: Anbieter, Preise, Verbotszonen',
  description: 'E-Scooter Konstanz: Hopp, Lime und Zeus, was zehn Minuten kosten, wo du an Altstadt und Seeufer nicht abstellst und was an der Grenze zu Kreuzlingen gilt.',
  headline: 'E-Scooter Konstanz: Anbieter, Preise und Verbotszonen zwischen Altstadt, Uni und Schweizer Grenze',
  lede: 'Einen E-Scooter in Konstanz leihst du ab 18 und ohne Führerschein bei Hopp, Lime oder Zeus. Alle drei verlangen laut ihren Datenfeeds 1 € fürs Entsperren, dazu 0,25 € pro Minute bei Hopp und Zeus und 0,31 € bei Lime (Stand 22. Oktober 2026). Im Kern der Altstadt, am Bahnhof, an der Seestrasse und auf der Alten Rheinbrücke und der Fahrradbrücke beendest du laut den Feeds bei keinem eine Fahrt, an der Laube am Rand der Altstadt bei allen dreien. In Kreuzlingen endet keine Leih-Fahrt, und ein Nachtverbot ist nicht bekannt.',
  published: '2026-10-22',
  updated: '2026-10-23',
  city: 'de:Konstanz',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Konstanz?',
      blocks: [
        'Im Oktober 2026 vermieten **Hopp**, **Lime** und **Zeus** E-Scooter in Konstanz; Zeus fährt hier seit November 2020. Hopp ist ein Franchise-System aus Island; im Datenfeed heisst das Konstanzer System «Hopp Konstanz» und läuft seit 16. Januar 2025. Wer es betreibt, nennt Hopp nicht, und auf Hopps eigener Standortliste fehlt Konstanz (Stand 22. Oktober 2026). Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am 22. Oktober 2026 um 10:01 Uhr zeigte die [Karte von Konstanz](map:de:Konstanz) rund 290 Scooter: rund 110 von Hopp, rund 90 von Lime und rund 90 von Zeus. Das ist eine Momentaufnahme der offenen Datenfeeds, keine Flottengrösse. Laut Stadt darf jeder Anbieter höchstens 150 Scooter aufstellen (Mitteilung vom Januar 2024).',
        '**Bolt, Voi und Dott** fanden wir in Konstanz nicht: Bolt und Dott nennen die Stadt nicht auf ihren Standortlisten, und Voi hat laut Datenfeed kein Gebiet dort (Stand 23. Oktober 2026). Auch MobiData BW, die Datenplattform des Landes, führt für Konstanz nur Hopp, Lime und Zeus. Zeus vermietet auch in Singen: Die [Karte von Singen](map:de:Singen) zeigte am selben Morgen rund 270 Zeus-Scooter.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Konstanz?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Konstanz (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Hopp (Datenfeed, 22. Oktober 2026)', '1,00 €', '0,25 €', '3,50 €', '6,00 €'],
              ['Lime (Datenfeed, 22. Oktober 2026)', '1,00 €', '0,31 €', '4,10 €', '7,20 €'],
              ['Zeus (Datenfeed, 22. Oktober 2026)', '1,00 €', '0,25 €', '3,50 €', '6,00 €'],
            ],
          },
        },
        'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Preise ändern sich kurzfristig: Lime verlangte am 17. Oktober noch 0,29 € pro Minute. Zeus nennt auf seiner Website, ohne Datum und für alle Städte, «etwa 1,50 €» fürs Entsperren und Pässe ab 4,99 €. Ob es die Pässe in Konstanz gibt, zeigt die App.',
        'Für längere Wege ist oft **konrad** günstiger, das Leihrad der Stadtwerke: 1,25 € für die ersten 30 Minuten, höchstens 10 € am Tag, und im Monatstarif für 20 € sind bei jeder Fahrt 30 Minuten frei. Stationen gibt es unter anderem am Bahnhof, an Universität und HTWG, an der Mainau und am Fährhafen Staad.',
      ],
    },
    {
      heading: 'E-Scooter in Konstanz abstellen: Altstadt, Seeufer und Brücken',
      blocks: [
        'Die Stadt macht den Anbietern Auflagen, so ihre Mitteilung vom Januar 2024; eine neuere Fassung konnten wir nicht prüfen. Die Scooter sollen Fussgängerzone, Friedhof und Uferpromenade nicht befahren und dort, im Umfeld von Schulen, auf Brücken und auf 250 Metern zum Ufer nicht abgestellt werden. Auf dem Gehweg müssen 2,5 Meter frei bleiben, an Haltestellen 3 Meter.',
        'Die Anbieter setzen das in ihren Apps unterschiedlich um. Hopp sperrt im Kern der Altstadt, rund um Konzil, Hafen und Stadtgarten und am Strandbad Horn sogar das Fahren. Zeus und Lime sperren dort nur das Abstellen, dafür in einem grösseren Gebiet. Zeus führt darin feste Abstellflächen, etwa am Fischmarkt und an der Laube. Laut den Datenfeeds gilt:',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Datenfeeds von Hopp, Zeus und Lime, Stand 22. Oktober 2026)',
            head: ['Ort', 'Hopp', 'Zeus', 'Lime'],
            rows: [
              ['Marktstätte, Münster, Niederburg, Obermarkt, Rosgartenstrasse', 'Fahrverbot', 'Verbotszone', 'Verbotszone'],
              ['Konzil, Hafen, Stadtgarten', 'Fahrverbot', 'Verbotszone, ausser an den festen Flächen am Fischmarkt und an der Konzilstrasse', 'Verbotszone'],
              ['Obere und Untere Laube, Paradies', 'Erlaubt', 'Erlaubt', 'Erlaubt'],
              ['Bahnhof, Bahnhofplatz, LAGO', 'Verbotszone, auf dem Bahnhofplatz Fahrverbot', 'Verbotszone', 'Verbotszone'],
              ['Seestrasse', 'Verbotszone', 'Verbotszone', 'Verbotszone'],
              ['Strandbad Horn', 'Fahrverbot', 'Verbotszone, eine feste Fläche am Hörnle', 'Verbotszone'],
              ['Alte Rheinbrücke, Fahrradbrücke, Herosé-Park', 'Verbotszone', 'Verbotszone', 'Verbotszone'],
              ['Universität auf dem Giesberg', 'Auf dem Campus erlaubt', 'Meist Verbotszone, eine feste Fläche an der Universitätsstrasse', 'Fast überall Verbotszone'],
              ['HTWG, Bahnhof Petershausen', 'Erlaubt', 'Erlaubt', 'Verbotszone'],
              ['Petershausen, Wollmatingen, Egg', 'Meist erlaubt', 'Meist erlaubt', 'Meist erlaubt'],
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
        'Die **Universität** liegt auf dem Giesberg über Egg. Laut den Datenfeeds lässt dich Hopp auf dem Campus abstellen. Zeus sperrt den grössten Teil, hat aber eine feste Fläche an der Universitätsstrasse. Lime sperrt fast den ganzen Campus; dann hilft konrad mit seiner Station an der Uni.',
        'Die **HTWG** liegt direkt am Seerhein. Hopp und Zeus erlauben das Abstellen dort. Lime sperrt das Ufer des Seerheins samt HTWG; mit Lime suchst du dir einen Platz in den Strassen dahinter im Paradies.',
        'Am **Bahnhof Konstanz** beendet keiner der drei eine Fahrt, auf dem Bahnhofplatz sperrt Hopp sogar das Fahren. Stell den Scooter vorher ab, etwa an der Oberen Laube, keine zehn Gehminuten entfernt. Am **Bahnhof Petershausen** auf der anderen Rheinseite geht es bei Hopp und Zeus, bei Lime nicht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Konstanz: wo du fährst, Bussgelder, Promille',
      blocks: [
        'Es gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur, wo es keinen gibt, auf der Fahrbahn. Auf Gehwegen und in der Fussgängerzone der Altstadt fährst du nicht; die Uferpromenade sollen Leih-Scooter laut Stadt (Januar 2024) ebenfalls meiden.',
        'Manche Gassen öffnet ein Zusatzschild für den Radverkehr. Für E-Scooter gilt es heute nicht. Ab 1. März 2027 gibt «Radverkehr frei» auch E-Scooter frei, im Schritttempo; Hopp sperrt den Kern der Altstadt laut Datenfeed aber unabhängig davon. Ein Nachtverbot oder eine Winterpause nennt die Stadt in ihrer Mitteilung von 2024 nicht, und laut Datenfeeds vermieten alle drei rund um die Uhr.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
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
        'Kreuzlingen in der Schweiz grenzt direkt an Paradies und Altstadt. Laut den Datenfeeds sperrt Lime auf Schweizer Seite das Fahren, Zeus drosselt dort auf 1 km/h, und Hopps Gebiet reicht nicht über die Grenze. Beenden kannst du eine Fahrt drüben bei keinem der drei.',
        'Leih-Scooter in Kreuzlingen selbst fanden wir nicht: Bolt und Dott nennen die Stadt nicht, und MobiData BW, die auch Schweizer Systeme wie das von Voi führt, hat dort keinen Scooter-Anbieter (Stand Oktober 2026). Donkey Republic verleiht in Kreuzlingen Fahrräder, E-Bikes und E-Lastenräder an Stationen.',
        'Fährst du einen eigenen E-Scooter über die Grenze, gelten drüben die Schweizer Regeln. Das E-Trottinett ist dort ein Leicht-Motorfahrrad, das du ab 16 ohne Führerausweis fährst, mit 14 und 15 nur mit Ausweis der Kategorie M. Das Licht brennt auch am Tag, auf dem Trottoir, also dem Gehweg, fährst du nicht (CHF 40.–), und die Grenze von 0,5 Promille gilt für alle, auch unter 21. Mehr in den [E-Trottinett-Regeln der Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'E-Scooter im Bus, auf der Fähre und auf der Mainau',
      blocks: [
        '**Bus:** Im Verkehrsverbund Hegau-Bodensee (VHB), also auch im Roten Arnold der Stadtwerke, fährt ein eigener E-Scooter kostenlos als Handgepäck mit, wenn er zusammengeklappt ist und du ihn trägst oder über oder unter dem Sitz verstaust. Der Akku muss fest verbaut sein, laden darfst du ihn an Bord nicht (Stand 1. März 2026). Leih-Scooter lassen sich nicht klappen und bleiben draussen.',
        '**Fähre nach Meersburg:** Die Autofähre der Stadtwerke legt rund um die Uhr am Fährhafen Staad ab. Ein eigener E-Scooter gilt dort als Fahrrad: 7 € einfach samt Erwachsenem, 13,30 € hin und zurück (Tarif 2026); zusammengeklappt und verpackt fährt er kostenlos. Mit einem Leih-Scooter geht das nicht: In Staad beendest du keine Fahrt, in Meersburg vermietet keiner der drei.',
        '**Mainau:** Auf die Blumeninsel darfst du keinen E-Scooter mitnehmen, auch kein Fahrrad; am Eingang gibt es Fahrradständer und kostenpflichtige Schliessfächer. Einen Leih-Scooter stellst du dort nicht ab, ein konrad-Rad an der Station schon.',
      ],
    },
    {
      heading: 'Wie Konstanz E-Scooter regelt: Sondernutzungserlaubnis und Obergrenze',
      blocks: [
        'Seit 1. Januar 2024 braucht jeder Anbieter eine Sondernutzungserlaubnis, um Scooter auf öffentliche Flächen zu stellen. So teilte es die Stadt im Januar 2024 mit: Jeder darf höchstens 150 Scooter aufstellen und zahlt 120 € pro Scooter und Jahr. Falsch abgestellte Scooter soll er binnen zwei Stunden umstellen, ungenutzte spätestens nach 36 Stunden.',
        'Im Paradies und am Altstadtring wollte die Stadt damals als Pilot Abstellflächen markieren; bewähren sie sich, sollen sie in der ganzen Stadt folgen. Ob sich an Obergrenze, Gebühr oder Abstellflächen seither etwas geändert hat, konnten wir nicht prüfen: Auf der Website der Stadt fanden wir dazu im Oktober 2026 keine aktuelle Seite.',
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
      answer: 'Die von Hopp, Lime oder Zeus. Du musst 18 sein, einen Führerschein brauchst du nicht. Alle drei zeigt die [Live-Karte von Konstanz](map:de:Konstanz); Bolt, Voi und Dott fanden wir in Konstanz nicht (Stand Oktober 2026).',
    },
    {
      question: 'Was kostet ein E-Scooter in Konstanz?',
      answer: 'Laut Datenfeeds 1 € fürs Entsperren und 0,25 € pro Minute bei Hopp und Zeus, 0,31 € bei Lime (Stand 22. Oktober 2026). Zehn Minuten kosten also 3,50 € oder 4,10 €. Verbindlich ist der Preis in der App.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter nach Kreuzlingen fahren?',
      answer: 'Nein. Laut den Datenfeeds sperrt Lime die Schweizer Seite, Zeus drosselt dort auf 1 km/h, und Hopps Gebiet reicht nicht hinüber; drüben beendest du bei keinem eine Fahrt. In Kreuzlingen selbst fanden wir keine Leih-Scooter.',
    },
    {
      question: 'Wo darf ich in der Konstanzer Altstadt abstellen?',
      answer: 'Im Kern der Altstadt und am Bahnhof bei keinem der drei, so ihre Datenfeeds vom 22. Oktober 2026. An der Laube und im Paradies geht es bei allen dreien; Zeus hat ausserdem feste Flächen, etwa am Fischmarkt beim Konzil. In der Fussgängerzone fährst du mit keinem E-Scooter.',
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
    { title: 'MobiData BW: Datenfeed von Hopp Konstanz (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/hopp_konstanz/gbfs' },
    { title: 'MobiData BW: Datenfeed von Zeus Konstanz (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_konstanz/gbfs' },
    { title: 'MobiData BW: Datenfeed von Lime in Baden-Württemberg (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/lime_bw/gbfs' },
    { title: 'MobiData BW: Datenfeed von Donkey Republic Kreuzlingen (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/donkey_kreuzlingen/gbfs' },
    { title: 'Zeus: ZEUS Is Now In Konstanz (20. November 2020)', url: 'https://zeusscooters.com/2020/11/zeus-is-now-in-konstanz/' },
    { title: 'Zeus: Städte', url: 'https://zeusscooters.com/cities/' },
    { title: 'Zeus: Preise und Pässe', url: 'https://zeusscooters.com/' },
    { title: 'Hopp: Standorte', url: 'https://hopp.bike/locations' },
    { title: 'Hopp: Nutzungsbedingungen für Deutschland', url: 'https://hopp.bike/tos?group=389FGQfb9eqWNoxBiQlENu' },
    { title: 'Hopp: E-Scooter und E-Bikes, Preise', url: 'https://hopp.bike/two-wheels' },
    { title: 'MobiData BW: Verzeichnis der Sharing-Datenfeeds (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'MobiData BW: Datenfeed von Voi in Deutschland (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_de/gbfs' },
    { title: 'Bolt: Städte', url: 'https://bolt.eu/de-de/cities/' },
    { title: 'Dott: Standorte', url: 'https://ridedott.com/de/locations' },
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
