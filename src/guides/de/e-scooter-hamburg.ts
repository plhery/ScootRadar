import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-hamburg',
  topic: 'hamburg',
  name: 'E-Scooter Hamburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Hamburg 2026: Anbieter, Preise, Parken, hvv',
  description: 'E-Scooter Hamburg: die fünf Anbieter, was über Preise bekannt ist, wo du in City, HafenCity und an der Alster parkst und welcher Scooter in Bus und Bahn darf.',
  headline: 'E-Scooter Hamburg: Anbieter, Preise, Parkverbotszonen und was im hvv gilt',
  lede: 'E-Scooter in Hamburg leihst du ab 18 und ohne Führerschein bei Bolt, Dott (früher Tier), Lime, Ryde oder Voi. Einen Hamburger Tarif fanden wir bei keinem der fünf; Bolt wirbt deutschlandweit mit «ab 0,15 € pro Minute» plus Entsperrgebühr, verbindlich ist die App. Du fährst auf dem Radweg, nie auf dem Gehweg. Am Jungfernstieg, am Hauptbahnhof, an der Elbphilharmonie und in Parks beendest du keine Fahrt; nimm die markierten oder digitalen Abstellflächen in der Nähe. In die U-Bahn darf kein E-Scooter.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Hamburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Hamburg?',
      blocks: [
        'Laut der Behörde für Verkehr und Mobilitätswende (BVM) vermieten fünf Anbieter in Hamburg E-Scooter: **Bolt**, **Dott**, **Lime**, **Ryde** und **Voi**. Dott hiess früher Tier; wer Tier fuhr, nutzt heute die Dott-App. Ryde ist neu: Im Februar 2025 nannte die Stadt erst vier Anbieter.',
        'Du leihst den Scooter in der App des Anbieters, laut ihren Bedingungen ab 18, obwohl das Gesetz eigene E-Scooter schon ab 14 erlaubt. Voi buchst du auch in **hvv switch**, der Mobilitäts-App der Hochbahn, in Hamburg und Pinneberg. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte von Hamburg](map:de:Hamburg) Dott und Voi: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 3500 Dott- und 6800 Voi-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Bolt, Lime und Ryde fehlen auf der Karte; ihre Scooter findest du nur in ihren eigenen Apps.',
        'Auch E-Bikes zeigt die Karte nicht. Bolt nennt auf seiner Hamburg-Seite neben E-Scootern auch E-Bikes; Leih-E-Bikes von Lime nennt eine ältere, undatierte Seite von hamburg.de.',
        'Laut Vertrag dürfen alle Anbieter zusammen innerhalb des Ring 2 höchstens 5000 E-Scooter und 5000 E-Bikes aufstellen. Die Stadt teilt sie gleichmässig auf: Bei vier Anbietern nennt der Vertrag je 1250, bei fünf wären es rechnerisch je 1000. Ausserhalb gibt es keine Obergrenze, und die Stadt wünscht sich ausdrücklich Scooter in Vierteln, in denen Bus und Bahn seltener fahren.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Hamburg?',
      blocks: [
        'Einen Tarif für Hamburg fanden wir bei keinem der fünf Anbieter auf einer offenen Seite. Den Preis zeigt die App vor dem Entsperren.',
        {
          table: {
            caption: 'Was die Anbieter offen zu Preisen und E-Bikes sagen (Stand 24. Oktober 2026)',
            head: ['Anbieter', 'Preis laut offener Quelle', 'E-Bikes in Hamburg', 'Buchen in'],
            rows: [
              ['Bolt', 'Deutschland: ab 0,15 € pro Minute plus kleine Entsperrgebühr; unbegrenzt Entsperren ab 0,99 € im Monat', 'Ja, laut Bolt', 'Bolt-App'],
              ['Dott', 'Entsperrgebühr plus Nutzungsgebühr, Höhe nur in der App', 'Nicht offen angegeben', 'Dott-App'],
              ['Lime', 'Nur in der App', 'Laut älterer Stadtseite ja', 'Lime-App'],
              ['Ryde', 'Nur in der App', 'Nicht offen angegeben', 'Ryde-App'],
              ['Voi', 'Entsperrgebühr plus Minutenpreis, Höhe nur in der App (laut hvv switch)', 'Nicht offen angegeben', 'Voi-App, hvv switch'],
            ],
          },
        },
        'Wer oft fährt, spart womöglich mit Pässen: Bolt nennt Wochen- und Monatspässe, Dott Pässe und Abos in einigen Städten.',
        'Teuer wird Falschparken. Ein Verwarnungsgeld der Stadt müssen die Anbieter laut ihrem Vertrag mit Hamburg voll an dich weitergeben. Lässt die Stadt einen Scooter umstellen oder abschleppen, zahlt der Anbieter 30 € oder 100 €; laut Verbraucherzentrale Hamburg verlangen die Anbieter das je nach Aufwand von dir zurück. Dott berechnet laut seinen Bedingungen bis zu 300 €, wenn er einen falsch abgestellten Scooter zurückholen muss.',
        'Den nächsten Dott oder Voi findest du auf der [Live-Karte von Hamburg](map:de:Hamburg).',
      ],
    },
    {
      heading: 'Wo darf man in Hamburg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, Radfahr- oder Schutzstreifen und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehwege sind tabu (15 €, ab 1. März 2027 25 €), ebenso Fussgängerzonen, ausser ein Schild erlaubt es.',
        '**Parks:** In Planten un Blomen ist Scooterfahren laut Parkordnung verboten; du schiebst oder lässt den Scooter am Eingang. In keiner Grünanlage und auf keiner Grünfläche am Ufer darfst du laut Vertrag eine Leihfahrt beenden, nur pausieren.',
        '**Alster und Elbe:** Auf einem Uferweg fährst du nur, wenn er ein Radweg ist oder ein Schild «Elektrokleinstfahrzeuge frei» ihn freigibt; «Radverkehr frei» reicht erst ab 1. März 2027. Abstellen ist an den Ufern ohnehin meist tabu: Die Stadt legt ihre Verbotszonen ausdrücklich auch in die Nähe von Gewässern.',
        '**Tempo und Zonen:** Eigene Tempo- oder Fahrverbotszonen der Stadt für E-Scooter haben wir nicht gefunden; was ein Anbieter zusätzlich sperrt oder bremst, zeigt seine App.',
        '**Nachts:** Ein Nachtfahrverbot gibt es in Hamburg nicht. Gegen Fahrten unter Alkohol schalten die Anbieter laut Stadt bei Grossveranstaltungen oder nachts teils einen Reaktionstest vor die Fahrt; bei einzelnen Veranstaltungen schreibt ihr Vertrag das vor.',
      ],
    },
    {
      heading: 'E-Scooter in Hamburg abstellen: Innenstadt, HafenCity, Alster, Parks',
      blocks: [
        'Leih-Scooter darfst du laut Stadt auf dem Gehweg oder am Fahrbahnrand abstellen, wenn mindestens 1,60 m Gehweg frei bleiben. Tabu sind laut Vertrag unter anderem Feuerwehrzufahrten, Zugänge zu Bus und Bahn, Radwege, Blindenleitstreifen, Fussgängerüberwege, Ampeln und Spielplätze.',
        'Dazu kommen 3043 Parkverbotszonen, in der App rot: laut Stadt etwa Grünanlagen, belebte Orte der Innenstadt und Bereiche am Wasser. Wo es geht, liegt daneben eine markierte Abstellfläche, meist an Bahnhaltestellen, in der App mit einem P.',
        'Seit März 2026 gibt es rund 370 digitale Abstellflächen an 100 Haltestellen von U-Bahn, S-Bahn und Bus, etwa an den Landungsbrücken. Sie sind nicht auf dem Boden markiert, und neben ihnen beendest du an diesen Haltestellen keine Fahrt mehr. Mit den 54 festen Flächen sind es 424.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung der offenen Daten der Stadt, Stand 24. Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Jungfernstieg, Rathausmarkt, Ballindamm', 'Nur ausserhalb der Verbotszone, etwa am Neuen Wall 5 oder auf den Flächen der Haltestellen Jungfernstieg und Rathaus'],
              ['Hauptbahnhof: Hachmannplatz, Steintorplatz, Kirchenallee', 'Nur auf den markierten Flächen an Kirchenallee, Steintorplatz, Steintorwall und Steintorbrücke'],
              ['Elbphilharmonie, Marco-Polo-Terrassen', 'Gar nicht; nächste Flächen Am Kaiserkai 1, Grosser Grasbrook 12 und an der Haltestelle Baumwall'],
              ['Speicherstadt', 'Ausserhalb der Verbotszonen ja; markierte Fläche am Teerhof (Wandrahmsteg)'],
              ['Landungsbrücken', 'Nur auf den digitalen Flächen der Haltestelle'],
              ['Reeperbahn, Spielbudenplatz, Grosse Freiheit', 'Gar nicht; Flächen in der Hein-Hoyer-Strasse, der Seilerstrasse, an der Reeperbahn 1 und an der Haltestelle Reeperbahn'],
              ['Schanzenviertel, Schulterblatt', 'Nur auf markierten Flächen, etwa Schulterblatt Ecke Altonaer Strasse, Lagerstrasse oder gegenüber der U Sternschanze'],
              ['Planten un Blomen', 'Gar nicht; Flächen an den Haltestellen Dammtor und Stephansplatz'],
              ['Stadtpark', 'Gar nicht; Flächen an den Haltestellen Borgweg und Saarlandstrasse'],
              ['Bahnhof Altona', 'Nur auf den Flächen am Paul-Nevermann-Platz, in der Präsident-Krahn-Strasse und der Max-Brauer-Allee'],
            ],
          },
        },
        'Anbieter ziehen ihre Zonen womöglich weiter als die Stadt: Massgeblich ist die Karte in deiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder neben statt auf einer Fläche. Fahr zur nächsten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter. Am Ende verlangt die App ein Foto vom abgestellten Scooter.',
        },
        'Steht dir ein Scooter im Weg, melde ihn dem Anbieter. Die Kontakte nennt die Stadt in ihren FAQ; für Bolt, Lime und Voi geht es über scooter-melder.de. Laut Vertrag stellen die Anbieter einen falsch geparkten Scooter binnen 24 Stunden um oder räumen ihn weg, an Wochenenden und Feiertagen binnen 48.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Hamburg: Bussgelder, Alkohol, Unfälle',
      blocks: [
        'In Hamburg gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf dem Gehweg gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Nebeneinander gefahren', '15 €, bis 30 €', 'erlaubt, wenn niemand behindert wird'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 €; der Anbieter gibt es an dich weiter', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        '2025 verletzten sich in Hamburg laut Innenbehörde 612 Menschen auf E-Scootern, nach 538 im Vorjahr. Fast drei Viertel der Unfälle verursachten die Scooter-Fahrer selbst, und ihre Unfälle unter Alkohol nahmen um 19,2 Prozent zu.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter im hvv: U-Bahn, S-Bahn, Bus, Fähre und StadtRAD',
      blocks: [
        '**U-Bahn:** E-Tretroller dürfen laut hvv nicht mit, auch nicht zusammengeklappt.',
        '**S-Bahn, AKN, Bus und Fähre:** Einen zusammengeklappten E-Scooter darfst du als Handgepäck immer mitnehmen, auch auf die Hafenfähren. Für nicht zusammengeklappte gilt die Fahrradregel: in S-Bahn und AKN nicht montags bis freitags von 6 bis 9 und von 16 bis 18 Uhr; frei am Wochenende, an Feiertagen und in den Hamburger Sommerferien; auf Autobahnabschnitten einiger Buslinien nie. Am Ende entscheidet das Personal.',
        '**Leih-Scooter:** Sie lassen sich nicht klappen. In die U-Bahn dürfen sie nie, und in S-Bahn oder Bus liefe die Miete weiter. Einfacher: Fahrt vor der Haltestelle beenden, an vielen Stationen auf einer digitalen Fläche, und am Ziel einen neuen mieten.',
        '**hvv switch:** Dort buchst du hvv-Tickets, Carsharing und Voi-Scooter, aber nur einen pro Konto. Die Stellplätze an den hvv-switch-Punkten sind dem Carsharing vorbehalten.',
        '**StadtRAD:** Der Radverleih nennt rund 4200 Räder und 56 Lastenpedelecs in Hamburg (Oktober 2026), rund um die Uhr buchbar in der StadtRAD-App oder, ohne Lastenpedelecs, in hvv switch.',
      ],
    },
    {
      heading: 'Was sich ändert: Vertrag bis 2027, neue Bundesregeln',
      blocks: [
        'Seit dem 1. Januar 2025 ist das Verleihen von E-Scootern auf Hamburgs Strassen eine Sondernutzung. Wer vermieten will, braucht einen Vertrag mit der BVM; der jetzige läuft bis zum 31. Dezember 2027. Jeder Anbieter zahlt 2 € pro Fahrzeug und Monat, innerhalb des Ring 2 weitere 4,50 €. Das Geld deckt unter anderem den Bau von Abstellflächen.',
        'Die digitalen Flächen an Haltestellen sind ein Pilot: Langfristig will die Stadt sie auch baulich sichtbar machen. Am 1. März 2027 ändern sich bundesweit Regeln und Bussgelder, etwa fürs Fahren auf dem Gehweg und fürs Falschparken; Hamburgs Vorgaben für Leih-Scooter gelten daneben weiter.',
      ],
    },
    {
      heading: 'Schon gewusst?',
      blocks: [
        {
          list: [
            '**Blindenschrift:** Hamburgs Vertrag verlangt an jedem Leih-Scooter Aufkleber in Blindenschrift, ersatzweise Warnsignale per App.',
            '**Scooter im Wasser:** Landet einer in Alster, Elbe oder einem Fleet, muss der Anbieter ihn binnen 24 Stunden abholen, sobald er davon weiss.',
            '**Kurze Wege:** Ein Leih-Scooter fährt laut Stadt zwei- bis dreimal am Tag, im Schnitt unter 2 km und unter zehn Minuten. Am meisten gefahren wird in Neustadt, Altstadt, HafenCity, St. Georg und St. Pauli.',
            '**Schulen und Sportplätze:** Unter den 3043 Parkverbotszonen der Stadt liegen 608 an Schulen, Hochschulen und Instituten und 419 an Sportanlagen.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Hamburg?',
      answer: 'Bolt, Dott (früher Tier), Lime, Ryde und Voi, laut Stadt. Voi buchst du auch in hvv switch. Die ScootRadar-Karte zeigt Dott und Voi; die anderen findest du in ihren Apps.',
    },
    {
      question: 'Was kostet ein E-Scooter in Hamburg?',
      answer: 'Einen Hamburger Tarif fanden wir bei keinem Anbieter offen; Bolt wirbt deutschlandweit mit ab 0,15 € pro Minute plus Entsperrgebühr (Stand Oktober 2026). Verbindlich ist die App.',
    },
    {
      question: 'Wo darf ich in Hamburg einen E-Scooter abstellen?',
      answer: 'Auf dem Gehweg oder am Fahrbahnrand, wenn 1,60 m frei bleiben, aber nicht in den roten Verbotszonen der App, etwa am Jungfernstieg, am Hauptbahnhof, an der Elbphilharmonie, in Parks und an Ufern. Dort nutzt du die Abstellflächen in der Nähe.',
    },
    {
      question: 'Darf ich einen E-Scooter in die U-Bahn mitnehmen?',
      answer: 'Nein, auch nicht zusammengeklappt. In S-Bahn, AKN, Bus und Fähre darf ein eigener, zusammengeklappter Scooter als Handgepäck mit. Einen Leih-Scooter stellst du vor der Haltestelle ab.',
    },
    {
      question: 'Darf ich durch Planten un Blomen oder an der Alster fahren?',
      answer: 'In Planten un Blomen nicht: Dort schiebst du. An der Alster nur auf Radwegen oder wo ein Schild E-Scooter erlaubt. Eine Leihfahrt beendest du in keiner Grünanlage und auf keiner Grünfläche am Ufer.',
    },
    {
      question: 'Gibt es in Hamburg ein Nachtfahrverbot für E-Scooter?',
      answer: 'Nein. Bei Grossveranstaltungen und teils nachts schalten die Anbieter laut Stadt vor der Fahrt einen Reaktionstest in der App.',
    },
  ],
  sources: [
    { title: 'Behörde für Verkehr und Mobilitätswende: FAQs zu den E-Scootern in Hamburg', url: 'https://www.hamburg.de/politik-und-verwaltung/behoerden/bvm/935518-935518' },
    { title: 'BVM: Klare Regelungen für E-Scooter- und E-Bike-Sharing (Februar 2025)', url: 'https://www.hamburg.de/politik-und-verwaltung/behoerden/bvm/aktuelles/pressemeldungen/klare-regelungen-fuer-e-scooter-und-e-bike-sharing-1023452' },
    { title: 'Transparenzportal Hamburg: Rahmenvertrag Sondernutzung Sharing-E-Scooter und -E-Bikes', url: 'https://suche.transparenz.hamburg.de/dataset/2025-01-01-oeffentl-rechtl-rahmenvertrag-sondernutzung-sharing-e-scooter-und-e-bikes-blankovers' },
    { title: 'BVM: Digitale Lösung für E-Roller-Abstellflächen in Hamburg (März 2026)', url: 'https://www.hamburg.de/politik-und-verwaltung/behoerden/bvm/aktuelles/pressemeldungen/neue-parkzonen-an-100-haltestellen-1158442' },
    { title: 'Transparenzportal Hamburg: Abstellflächen und Parkverbotszonen E-Scooter', url: 'https://suche.transparenz.hamburg.de/dataset/abstellflaechen-und-parkverbotszonen-e-scooter-hamburg6' },
    { title: 'hvv: Fragen und Antworten zu Scootern', url: 'https://www.hvv.de/de/service/fragen-und-antworten/scooter' },
    { title: 'hvv switch: FAQ E-Scooter', url: 'https://www.hvv-switch.de/de/faq/kategorie/e-scooter/' },
    { title: 'StadtRAD Hamburg', url: 'https://stadtrad.hamburg.de' },
    { title: 'Planten un Blomen: Parkordnung', url: 'https://plantenunblomen.hamburg.de/park-service/parkordnung-622780' },
    { title: 'Bolt: E-Scooter in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Verbraucherzentrale Hamburg: E-Scooter fahren', url: 'https://www.vzhh.de/themen/umwelt-nachhaltigkeit/mobilitaet/e-scooter-fahren-das-sollten-sie-wissen' },
    { title: 'Behörde für Inneres und Sport: Verkehrssicherheitsbilanz 2025', url: 'https://www.hamburg.de/politik-und-verwaltung/behoerden/behoerde-fuer-inneres-und-sport/presseservice/pressemeldungen/verkehrssicherheitsbilanz-2025-1148718' },
  ],
};

export default guide;
