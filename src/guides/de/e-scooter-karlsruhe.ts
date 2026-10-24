import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-karlsruhe',
  topic: 'karlsruhe',
  name: 'E-Scooter Karlsruhe: Anbieter, Preise, Parken',
  title: 'E-Scooter Karlsruhe 2026: Anbieter, Preise, Parken, KVV',
  description: 'E-Scooter Karlsruhe: Voi, Bolt und Dott, was zehn Minuten kosten, wo du an Kaiserstrasse und Hauptbahnhof parkst und welcher Scooter in Bahn und Bus darf.',
  headline: 'E-Scooter Karlsruhe: Anbieter, Preise, Abstellflächen und warum du auf der Kaiserstrasse schiebst',
  lede: 'Einen E-Scooter in Karlsruhe leihst du ab 18 und ohne Führerschein bei Voi, Bolt oder Dott. Zehn Minuten kosten nach den veröffentlichten Tarifen (Stand 14. Oktober 2026) 3,29 € bei Bolt und 3,49 € bei Voi. Auf der Kaiserstrasse zwischen Europaplatz und Kronenplatz und auf dem Marktplatz darfst du nicht fahren, und rund um die Kaiserstrasse und am Hauptbahnhof stellst du nur auf markierten Flächen ab. Im KVV zählt dein eigener Scooter als Fahrrad; einen Leih-Scooter stellst du vor der Fahrt mit Bus oder Bahn ab.',
  published: '2026-10-14',
  updated: '2026-10-24',
  city: 'de:Karlsruhe',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Karlsruhe?',
      blocks: [
        'Die Stadt nennt drei Anbieter: **Voi**, **Bolt** und **Dott**, das früher TIER hiess. Gemietet wird in der App des Anbieters, ab 18. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte von Karlsruhe](map:de:Karlsruhe) alle drei Anbieter: am Samstag, 24. Oktober 2026, um 13:26 Uhr rund 1900 Scooter, je rund 620 von Voi, Bolt und Dott. Das ist eine Momentaufnahme, keine Flottengrösse.',
        '**Dott ohne Preis auf der Karte.** Dott hat seinen offenen Datenfeed für Karlsruhe im September 2026 abgeschaltet. Seit dem 24. Oktober 2026 zeigt unsere Karte seine Scooter trotzdem, aber keinen Preis: Was eine Fahrt bei Dott kostet, siehst du nur in der App.',
        '**Lime** gibt es in Karlsruhe nicht mehr: Die Stadt fehlt auf Limes Städteliste, und sein Datenfeed zeigte dort am 14. Oktober 2026 keinen Scooter.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Karlsruhe?',
      blocks: [
        'Voi nennt seinen Tarif auf seiner Website, Bolt in seinem Datenfeed; Dott nennt keinen.',
        {
          table: {
            caption: 'E-Scooter-Preise in Karlsruhe (veröffentlichte Tarife, Stand 14. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Bolt', '0,99 €', '0,23 €', '3,29 €', '5,59 €'],
              ['Voi', '0,99 €', '0,25 €', '3,49 €', '5,99 €'],
              ['Dott', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Bolt ist bei jeder Fahrtlänge etwas günstiger, eine Viertelstunde kostet 4,44 € statt 4,74 €. In Stuttgart, Mannheim und Pforzheim entsperrt Voi für 0,49 €, in Karlsruhe für 0,99 €. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Für kurze Wege ist das Leihrad KVV.nextbike mit 1 € pro halbe Stunde günstiger. Den nächsten Scooter und eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Karlsruhe](map:de:Karlsruhe).',
      ],
    },
    {
      heading: 'Wo darf man in Karlsruhe mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Auf dem Gehweg fährst du nicht, auch nicht mit ausgeschaltetem Motor.',
        '**Kaiserstrasse und Marktplatz:** Beide sind laut Stadt «auch für E-Tretroller verbotene Zonen». Zwischen Europaplatz und Kronenplatz ist die Kaiserstrasse Fussgängerzone, gesperrt auch für Fahrräder; die Strassenbahn fährt dort seit 2021 im Tunnel. Keine App sperrt oder bremst dich dort: Die Regel ist die der Stadt, durchgesetzt von Ordnungsdienst und Polizei. Steig ab und schieb. Östlich vom Kronenplatz ist die Kaiserstrasse eine normale Strasse mit Strassenbahn.',
        '**Andere Fussgängerzonen** sind ebenfalls tabu, auch wenn ein Schild Fahrräder durchlässt. Ab 1. März 2027 gilt «Radverkehr frei» auch für E-Scooter, im Schritttempo; auf Kaiserstrasse und Marktplatz, wo kein Fahrrad fahren darf, ändert das nichts.',
        '**Parks:** In städtischen Grünanlagen wie Stadtgarten, Günther-Klotz-Anlage oder Otto-Dullenkopf-Park fährst du nur auf Wegen, die dafür ausgeschildert sind.',
        '**Durlach und Turmberg:** Am Durlacher Marktplatz kannst du bei Voi und Bolt die Fahrt beenden, am Bahnhof Durlach nur bei Voi. Der Turmberg liegt ausserhalb von Bolts Gebiet, bei Voi hält der Scooter dort an. Hinauf bringt dich auch die Turmbergbahn nicht, selbst wenn Voi sie noch empfiehlt: Sie fährt seit Ende 2024 nicht mehr. Laut VBK beginnt der Neubau voraussichtlich Ende 2026 und dauert 15 bis 18 Monate.',
        '**Stadtrand:** Knielingen und Neureut liegen nur im Gebiet von Voi, der Rheinhafen nur in dem von Bolt. Die Messe in Rheinstetten, der KIT Campus Nord, Ettlingen und Rüppurr liegen ausserhalb beider; ein Voi hält an der Gebietsgrenze an.',
      ],
    },
    {
      heading: 'E-Scooter in Karlsruhe abstellen: Kaiserstrasse, Hauptbahnhof, Schloss',
      blocks: [
        'Rund um die Fussgängerzone Kaiserstrasse und am Hauptbahnhof stellst du nur auf markierten Abstellflächen ab, erkennbar an Schildern oder Bodenmarkierungen. Im Umkreis von 100 m um jede Fläche lässt dich die App nur auf der Fläche abstellen; stellst du daneben ab, läuft laut Stadt die Uhr weiter. Massgeblich ist die Karte in deiner App.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung der Datenfeeds, Stand 14. Oktober 2026)',
            head: ['Ort', 'Bolt', 'Voi'],
            rows: [
              ['Kaiserstrasse (Europaplatz bis Adlerstrasse), Marktplatz, Friedrichsplatz, Stephanplatz, Ettlinger Tor', 'Nur auf markierten Flächen', 'Nur auf markierten Flächen'],
              ['Hauptbahnhof, Nordseite (Bahnhofplatz)', 'Nur auf markierten Flächen', 'Nur auf markierten Flächen'],
              ['Hauptbahnhof, Südausgang (Victor-Gollancz-Strasse); Durlacher Tor, KIT Campus Süd', 'Frei', 'Frei'],
              ['Kronenplatz, ZKM', 'Frei', 'Nur an Stationen'],
              ['Schlossplatz, Schlossgarten, Wildparkstadion', 'Gar nicht: ausserhalb des Gebiets', 'Nur an Stationen'],
              ['Günther-Klotz-Anlage, Europahalle', 'Gar nicht: Verbotszone', 'Nur an Stationen'],
            ],
          },
        },
        'Ausserhalb dieser Zonen stellst du frei ab, solange niemand behindert wird und auf dem Gehweg mindestens 1,60 m frei bleiben. Tabu sind laut Stadt Fussgängerzonen, Grünflächen, Haltestellen und stark besuchte Flächen der Innenstadt.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du im 100-m-Umkreis einer Abstellfläche, aber nicht auf ihr, oder in einer Verbotszone. Fahr zur nächsten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Für falsches Abstellen verlangen die Anbieter laut ihren deutschen Bedingungen eigene Gebühren: Voi 25 €, Bolt 15 € ohne klares Abstellfoto, Dott bis 300 € fürs Einsammeln.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Karlsruhe: Bussgelder, Alkohol, Unfälle',
      blocks: [
        'In Karlsruhe gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        '2025 zählte die Polizei in Stadt und Landkreis Karlsruhe 138 Unfälle mit E-Scootern und anderen Elektrokleinstfahrzeugen, nach 92 im Jahr 2024. In 90 Fällen hatten die Fahrer den Unfall selbst verursacht. Elf Fahrer wurden schwer verletzt, getötet wurde niemand.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter zum Christkindlesmarkt, zu DAS FEST und zum KSC',
      blocks: [
        'Der nächste **Christkindlesmarkt** läuft vom 23. November bis 23. Dezember 2026 auf Marktplatz, Friedrichsplatz und Stephanplatz, alle in der Zone mit markierten Abstellflächen. 2019 richteten die Anbieter für den Markt zusätzliche Parkverbotszonen ein; ob es wieder welche gibt, zeigt die App.',
        '**DAS FEST** in der Günther-Klotz-Anlage findet jeden Sommer statt, das nächste Mal vom 22. bis 25. Juli 2027. Dort beendest du bei Bolt das ganze Jahr keine Fahrt, bei Voi nur an Stationen. Der Veranstalter empfiehlt Bahn und Bus (das Ticket gilt im KVV), das Fahrrad oder 20 Minuten zu Fuss vom Hauptbahnhof.',
        'Die **Schlosslichtspiele** bespielen seit 2015 jeden Sommer die rund 170 m lange Fassade des Schlosses, das nächste Mal vom 12. August bis 13. September 2027.',
        'Am Schlossplatz und am Wildparkstadion des **KSC** beendest du bei Bolt keine Fahrt, bei Voi nur an Stationen. In Sonderverkehren zum Stadion und im Messe-Express nimmt der KVV keine Fahrräder und damit auch keine E-Scooter mit.',
      ],
    },
    {
      heading: 'E-Scooter im KVV: Strassenbahn, Bus und KVV.nextbike',
      blocks: [
        'Anders als in Köln oder Düsseldorf sind E-Scooter im KVV nicht verboten. Nach den seit 1. August 2026 geltenden Beförderungsbedingungen zählt dein eigener E-Scooter als Fahrrad, einer pro Person, wenn Platz ist:',
        {
          list: [
            '**Strassenbahn, Stadtbahn, Zug:** kostenlos, ausser montags bis freitags von 6 bis 9 Uhr, Feiertage ausgenommen. Dann brauchst du eine Fahrradkarte für 3,70 €.',
            '**Bus:** montags bis freitags von 6 bis 9 Uhr gar nicht, sonst kostenlos in grossen Bussen, nie in Kleinbussen, Ruftaxis oder im Schienenersatzverkehr. Wer es zur Sperrzeit trotzdem versucht, zahlt 20 € und muss aussteigen.',
            '**Klein und zusammengeklappt**, unter 15 kg, kürzer als 115 cm und mit Rädern unter 9 Zoll, gilt er nicht als Fahrrad; die Sperrzeiten gelten dann nicht.',
            '**Ohne Strassenzulassung** fährt kein E-Scooter mit.',
          ],
        },
        '**Leih-Scooter** nennen die Bedingungen nicht eigens. Sie lassen sich nicht klappen, und die Miete liefe weiter: Beende die Fahrt ein Stück vor der Haltestelle (an ihr selbst darfst du nicht abstellen) und miete am Ziel einen neuen.',
        '**KVV.nextbike**, das Leihrad des KVV, hat in Karlsruhe rund 640 Räder, die du in der Flexzone an jeder Strassenkreuzung abstellst.',
        'Ein normales Rad kostet 1 € pro 30 Minuten, höchstens 9 € am Tag. Mit Monats-Abo (10 €) oder Jahres-Abo (48 €) sind die ersten 30 Minuten jeder Fahrt inklusive, Studierende der beteiligten Hochschulen fahren sie gratis. Der Vertrag läuft bis Februar 2027; einen Nachfolger schreibt der KVV aus.',
      ],
    },
    {
      heading: 'Sondernutzungserlaubnis und Gebühr: Wie Karlsruhe E-Scooter regelt',
      blocks: [
        'Von November 2022 bis zum 31. Oktober 2025 regelte ein öffentlich-rechtlicher Vertrag mit den Anbietern das Verleihen. Inzwischen verleihen die Anbieter mit einer Sondernutzungserlaubnis der Stadt und zahlen 70 € pro Scooter und Jahr; diese Gebühr beschloss der Gemeinderat am 16. Dezember 2025.',
        'Ab 1. Januar 2027 soll sie als eigener Posten in der Gebührensatzung stehen, mit einem Rahmen von 50 bis 130 € je Leih-Scooter und Jahr. In der Vorlage für den Gemeinderat am 20. Oktober 2026 schreibt die Verwaltung: «Die Gebühr für E-Scooter beträgt weiterhin 70 Euro.»',
        'Unter dem Vertrag durfte jeder Anbieter höchstens 300 Scooter in der Innenstadt und den Stadtteilen drumherum und 100 in der Durlacher Altstadt aufstellen, höchstens fünf an einer Stelle. Welche Auflagen die neue Erlaubnis enthält, hat die Stadt nicht veröffentlicht.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Karlsruhe',
      blocks: [
        {
          list: [
            '**32 Strassen laufen auf das Schloss zu.** Es ist der Mittelpunkt des «Fächers», daher der Name Fächerstadt.',
            '**Die Strassenbahn auf Eisenbahngleisen stammt aus Karlsruhe.** 1992 fuhr die erste Zweisystem-Stadtbahn im Mischverkehr mit der Eisenbahn nach Bretten-Gölshausen, weltweit bekannt als «Karlsruher Modell». Schienen querst du deshalb oft: am besten im rechten Winkel.',
            '**Karlsruhes Scooterfahrten sind erforscht.** Forscher von Fraunhofer und der ETH Zürich werteten 118 047 Fahrten aus dem Winterhalbjahr 2020/21 aus: Sie waren im Schnitt 1,4 km lang, sonntags gab es deutlich weniger. Mehr als ein Drittel der Fahrten hätte man laut einer zweiten Studie auch mit Bus oder Bahn machen können.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Karlsruhe?',
      answer: 'Die von Voi, Bolt oder Dott, früher TIER. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Scooter aller drei zeigt auch die [Live-Karte von Karlsruhe](map:de:Karlsruhe).',
    },
    {
      question: 'Wie viel kostet Voi in Karlsruhe?',
      answer: '0,99 € fürs Entsperren und 0,25 € pro Minute, zehn Minuten also 3,49 € (Stand 14. Oktober 2026). Bolt ist mit 0,23 € pro Minute etwas günstiger.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Kaiserstrasse fahren?',
      answer: 'Nicht zwischen Europaplatz und Kronenplatz und nicht über den Marktplatz: Dort ist auch Radfahren verboten. Die Apps hindern dich nicht daran, aber Ordnungsdienst und Polizei kontrollieren.',
    },
    {
      question: 'Gibt es ein E-Scooter-Verbot im KVV?',
      answer: 'Nein. Deinen eigenen E-Scooter behandelt der KVV wie ein Fahrrad: montags bis freitags von 6 bis 9 Uhr nur mit Fahrradkarte in der Bahn und gar nicht im Bus. Einen Leih-Scooter stellst du vorher ab, sonst läuft die Miete weiter.',
    },
    {
      question: 'Darf man in Karlsruhe nachts E-Scooter fahren?',
      answer: 'Ja, Voi und Bolt vermieten laut ihren Angaben rund um die Uhr. Die Website der Stadt nennt zwar noch eine Mietsperre in den Nächten auf Samstag und Sonntag von 23 bis 6 Uhr. Dem Gemeinderat sagte die Stadt aber schon 2021, diese Nachtsperre sei seit der Corona-Pandemie ausgesetzt.',
    },
  ],
  sources: [
    { title: 'Stadt Karlsruhe: Verkehrsregeln für E-Scooter', url: 'https://www.karlsruhe.de/mobilitaet-stadtbild/mobilitaet/verkehrsregeln-fuer-e-scooter' },
    { title: 'Stadt Karlsruhe: Abstellflächen für E-Tretroller in der Innenstadt (7. August 2024)', url: 'https://www.karlsruhe.de/stadt-rathaus/aktuelles/meldungen/ausweisung-von-abstellplaetzen-fuer-e-tretroller-in-der-innenstadt-abgeschlossen' },
    { title: 'Stadt Karlsruhe, Beschlussvorlage 2025/1118: Sondernutzungsgebühr für E-Scooter (PDF)', url: 'https://web1.karlsruhe.de/ris/oparl/bodies/0001/downloadfiles/00672012.pdf' },
    { title: 'Stadt Karlsruhe, Beschlussvorlage 2026/0605: Änderung der Sondernutzungsgebührensatzung (PDF)', url: 'https://web1.karlsruhe.de/ris/oparl/bodies/0001/downloadfiles/00680539.pdf' },
    { title: 'KVV: Gemeinschaftstarif und Beförderungsbedingungen, gültig ab 1. August 2026 (PDF)', url: 'https://www.kvv.de/fileadmin/user_upload/kvv/Dateien/Flyer/2026-07-15_KVV_brs_Gemeinschaftstarif_A5_bf.pdf' },
    { title: 'KVV.nextbike: Tarife', url: 'https://www.kvv-nextbike.de/de/' },
    { title: 'Polizeipräsidium Karlsruhe: Verkehrsstatistik 2025 (PDF)', url: 'https://ppkarlsruhe.polizei-bw.de/wp-content/uploads/sites/5/2026/02/Verkehrsstatistik-2025_Polizeipraesidium-Karlsruhe_Final.pdf' },
    { title: 'Voi: E-Scooter in Karlsruhe', url: 'https://www.voi.com/de/city/karlsruhe' },
    { title: 'Bolt: Tarif für Karlsruhe im offenen Datenfeed (GBFS, MobiData BW)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/bolt_karlsruhe/system_pricing_plans' },
    { title: 'DAS FEST: Anreise', url: 'https://www.dasfest.de/info/anreise' },
  ],
};

export default guide;
