import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-berlin',
  topic: 'berlin',
  name: 'E-Scooter Berlin: Anbieter, Parken, Regeln',
  title: 'E-Scooter Berlin 2026: Lime, Bolt, Voi, Dott, Zeus, Parken',
  description: 'E-Scooter in Berlin mietest du bei Lime, Bolt, Voi, Dott und in zwei Bezirken bei Zeus. Wo du parkst, was die BVG verbietet und was nach März 2027 kommt.',
  headline: 'E-Scooter Berlin: Anbieter, Parkzonen, Regeln und was du wissen musst',
  lede: 'E-Scooter in Berlin mietest du bei Lime, Bolt, Voi oder Dott, in Spandau und Reinickendorf auch bei Zeus: App laden, ohne Führerschein registrieren, QR-Code scannen. Mindestalter und Preis zeigt dir die App vor dem Entsperren. Du fährst auf dem Radweg, nie auf dem Gehweg oder durch Parks, und rund um die Sehenswürdigkeiten in Mitte beendest du die Fahrt nur an markierten Flächen wie den Jelbi-Punkten.',
  published: '2026-10-12',
  updated: '2026-10-25',
  city: 'de:Berlin',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Berlin?',
      blocks: [
        'Fünf Unternehmen vermieten in Berlin E-Scooter, alle mit einer Genehmigung des Senats bis zum 31. März 2027:',
        {
          list: [
            '**Lime**, **Bolt** und **Voi**: in der ganzen Stadt, auch über die BVG-App Jelbi buchbar.',
            '**Dott**: in der ganzen Stadt, ebenfalls über Jelbi buchbar. Tier und Dott haben fusioniert; wer früher Tier fuhr, nutzt seit Oktober 2024 die Dott-App.',
            '**Zeus**: nur in Spandau und Reinickendorf.',
          ],
        },
        'Im S-Bahn-Ring dürfen höchstens 19 000 Leih-Scooter stehen, gleichmässig verteilt auf die vier Anbieter der Innenstadt; ausserhalb gibt es derzeit keine Obergrenze.',
        'Am Ende jeder Fahrt fotografierst du den abgestellten Scooter: Einen solchen Nachweis verlangt die Berliner Genehmigung. Alles Schritt für Schritt erklärt der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
        'Die [Karte rund um Berlin](map:de:Berlin) zeigte am Freitag, 30. Oktober 2026, um 16:03 Uhr rund 4700 Dott-, 14 100 Voi- und 8900 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 14 500 Lime-Scooter nach der letzten Zählung.',
      ],
    },
    {
      heading: 'Wo darf man mit dem E-Scooter in Berlin fahren?',
      blocks: [
        'Du fährst auf dem Radweg, Radfahrstreifen oder Schutzstreifen, und nur wo es keinen gibt, auf der Fahrbahn. Auf dem Gehweg ist Fahren verboten (15 €, ab 1. März 2027 25 €), ebenso in Fussgängerzonen, ausser ein Schild erlaubt es.',
        '**Parks sind tabu.** In Berlins öffentlichen Grünanlagen ist Fahren und Parken mit Kraftfahrzeugen verboten, und ein E-Scooter zählt als Kraftfahrzeug. Du erkennst sie am **Tulpenschild** am Eingang, einem dreieckigen Schild mit grünem Rand und einer Tulpe. Das kann ein Verwarnungsgeld bis 55 € kosten: So viel zahlte laut Berliner Zeitung (März 2024) Jan Böhmermann, als er mit dem E-Scooter durch den Tiergarten fuhr. Auf dem Tempelhofer Feld sind Kraftfahrzeuge nach Angaben von Grün Berlin ebenfalls verboten.',
        'Auf Kopfsteinpflaster fährst du besser langsamer, und Tramschienen überquerst du möglichst quer.',
        'Die Regeln für ganz Deutschland, kurz:',
        {
          list: [
            'Ab 14 ohne Führerschein, keine Helmpflicht. Nur eine Person pro Scooter: 2025 zählte die Berliner Polizei 1087 Verstösse, weil zwei oder mehr Personen auf einem Scooter fuhren, mehr als Rotlichtverstösse (1012).',
            'Rote Ampel: 60 € und 1 Punkt. Handy in der Hand: heute 100 € und 1 Punkt.',
            'Alkohol: Grenzen wie im Auto. Ab 0,5 Promille 500 €, 2 Punkte und 1 Monat Fahrverbot, auch fürs Auto; ab 1,1 Promille eine Straftat, und der Führerschein ist in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0 Promille.',
            'Versicherung: Jeder E-Scooter braucht eine Versicherungsplakette; den Leih-Scooter versichert der Anbieter.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Berlin parken: Jelbi-Punkte, Verbotszonen, Gehweg',
      blocks: [
        'Für alle Anbieter gelten dieselben Auflagen. Gibt es eine markierte Abstellfläche, gehört der Scooter dorthin: an einen Jelbi-Punkt oder eine Jelbi-Station der BVG oder auf eine Fläche des Bezirks. Rund um jede liegt eine Parkverbotszone von mindestens 100 m, in der die App das Beenden der Fahrt sperrt. Im April 2026 war innerhalb des S-Bahn-Rings fast ein Drittel der Fläche Verbotszone: 28 von 88 km².',
        'Ohne Fläche in der Nähe darfst du auf dem Gehweg parken, wenn 2,30 m für Fussgänger frei bleiben. Tabu sind diese Stellen, und vor und nach jeder bleiben mindestens 1,5 m frei:',
        {
          list: [
            'an Bus- und Tramhaltestellen: 25 m vor und nach dem Haltestellenschild, so die Genehmigungen seit April 2025 (manche Seiten nennen noch die alten 15 m);',
            'vor Hauseingängen und den Eingängen von U- und S-Bahnhöfen;',
            'an Fussgängerüberwegen, Einfahrten und Feuerwehrzufahrten und näher als 10 m an Kreuzungen;',
            'auf Radwegen, Blindenleitstreifen und in Fussgängerzonen;',
            'in Grünanlagen, auf Friedhöfen und Baumscheiben;',
            'auf Brücken, die Fussgänger nutzen, ausser an markierten Flächen.',
          ],
        },
        '**Tipp:** Du darfst den Scooter auch auf einem Parkplatz für Autos am Fahrbahnrand abstellen, und zwar kostenlos: Eine Änderung der Berliner Parkgebührenordnung von 2022 befreit E-Scooter von Parkgebühren, damit sie vom Gehweg verschwinden. Das geht überall, wo die App das Beenden zulässt. Bei Veranstaltungen und an Baustellen kannst du zeitweise keine Fahrt beenden; die Anbieter müssen dich in der App darauf hinweisen.',
        { note: 'In einer Parkverbotszone lässt dich die App die Fahrt nicht beenden, und die Minuten laufen weiter. Schau deshalb schon vor dem Ziel in der App nach, wo die nächste Abstellfläche liegt.' },
      ],
    },
    {
      heading: 'Brandenburger Tor, Alexanderplatz & Co.: nur an markierten Flächen parken',
      blocks: [
        'Seit dem 11. März 2024 ist ein 3,5 km² grosses Gebiet in Mitte Parkverbotszone für Leihfahrzeuge, etwa so gross wie das Tempelhofer Feld. Abstellen kannst du dort nur an markierten Flächen, ungefähr alle 200 m, etwa am Alexanderplatz, Unter den Linden und am Brandenburger Tor; zum Start waren es rund 70 Jelbi-Punkte und 30 ausgeschilderte Flächen. In den Zonen der Stadt vom Oktober 2026 gehören auch der Hauptbahnhof und der Potsdamer Platz zum Parkverbotsgebiet.',
        {
          table: {
            caption: 'Parken an bekannten Orten, Stand 30. Oktober 2026',
            head: ['Ort', 'Parken'],
            rows: [
              ['Brandenburger Tor, Pariser Platz, Reichstag, Holocaust-Mahnmal', 'Nur an markierter Fläche'],
              ['Unter den Linden, Gendarmenmarkt, Museumsinsel, Alexanderplatz', 'Nur an markierter Fläche'],
              ['Hauptbahnhof, Potsdamer Platz, Checkpoint Charlie, Grosser Stern', 'Nur an markierter Fläche'],
              ['East Side Gallery, Warschauer Strasse, Kottbusser Tor, Spandauer Altstadt', 'Nur an markierter Fläche'],
              ['Tempelhofer Feld, Mauerpark, Volkspark Friedrichshain, Treptower Park', 'Gar nicht'],
            ],
          },
        },
        'Jeder Anbieter überträgt die Zonen der Stadt selbst in seine App, und sie ändern sich oft: Wo du die Fahrt beenden darfst, entscheidet am Ende deine App.',
      ],
    },
    {
      heading: 'Was kostet Falschparken mit dem E-Scooter in Berlin?',
      blocks: [
        'Falsch abgestellte Scooter sind vor allem ein Problem in Mitte: Von 35 026 Anzeigen wegen falsch geparkter E-Scooter im Jahr 2025 entfielen 31 577 auf diesen Bezirk.',
        {
          table: {
            caption: 'Falschparken mit dem E-Scooter in Berlin: die Folgen',
            head: ['Verstoss', 'Folge'],
            rows: [
              ['Behindernd oder gefährdend abgestellt', '20 bis 30 € Bussgeld (Regelsatz)'],
              ['Ab 1. März 2027: unzulässig auf Geh- oder Radweg geparkt', '55 €, mit Behinderung 70 €'],
              ['In einer Grünanlage geparkt oder gefahren', 'Verwarnungsgeld 5 bis 55 €, Bussgeld bis 5000 €'],
              ['Scooter steht im Weg', 'Polizei oder Ordnungsamt setzen ihn um, seit 24. Juli 2025 auf Kosten des Anbieters'],
            ],
          },
        },
        'Steht dir ein Scooter im Weg, meldest du ihn bei [Jelbi](https://www.jelbi.de/falschparker-melden/), auf scooter-melder.de oder über die Hotline auf dem Scooter. Tagsüber muss der Anbieter ihn innerhalb von vier Stunden wegräumen.',
      ],
    },
    {
      heading: 'BVG und Jelbi: E-Scooter und Nahverkehr',
      blocks: [
        'Seit dem 1. Mai 2024 verbietet die BVG E-Tretroller in all ihren Fahrzeugen und Bahnhöfen, auch zusammengeklappt: in U-Bahn, Tram, Bus und Fähre. Mit dem Leih-Scooter heisst das: Fahrt vor dem Bahnhof beenden und am Ziel einen neuen mieten.',
        '**Jelbi** ist die Mobilitäts-App der BVG: Darin kaufst du VBB-Tickets und buchst E-Scooter von Lime, Bolt, Voi und Dott, mit einem eigenen Jelbi-Konto. Am Hauptbahnhof liegt der Jelbi-Punkt S+U Hauptbahnhof/Heidestrasse.',
        '**Lieber Fahrrad fahren?** Fahrräder verleihen in Berlin nextbike und DB Call a Bike, dazu Lime, Bolt und Voi.',
      ],
    },
    {
      heading: 'E-Scooter-Verbot in Berlin? Was nach März 2027 geplant ist',
      blocks: [
        'Die Genehmigungen aller fünf Anbieter enden am 31. März 2027. Im Juli 2026 schrieb der Senat dem Abgeordnetenhaus, er bereite eine strikte Pflicht vor, Leihfahrzeuge nur an Stationen abzustellen.',
        'Langfristig gibt es einen Plan: die Sharing-Strategie 2035, die die Senatsverkehrsverwaltung am 6. Mai 2026 vorgestellt hat. Bis 2035 sollen Gebiet für Gebiet rund 3000 feste Mobilitätsstandorte entstehen, mit Parkverbotszonen dazwischen; Mieten und Abstellen ginge dann nur noch dort. Das ist ein Plan, noch keine Regel, und kein Verbot, auch wenn Schlagzeilen im März 2026 so klangen. Ganz verbieten kann das Land Berlin E-Scooter laut Senat gar nicht.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Berlin',
      blocks: [
        {
          list: [
            'Rund 850 E-Scooter im Jahr werden nach Schätzung des Senats aus Berliner Gewässern gefischt. Die Genehmigung verpflichtet die Anbieter dazu.',
            'Jeder Leih-Scooter muss die Nummer der Beschwerde-Hotline auch in Blindenschrift am Lenker tragen.',
            'Eine Fahrt ist im Schnitt kurz: 1,6 km und 6,5 Minuten im ersten Quartal 2026.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Wo darf man in Berlin E-Scooter abstellen?',
      answer: 'Gibt es eine markierte Fläche wie einen Jelbi-Punkt, dann dort: Im Umkreis von mindestens 100 m darum gilt Parkverbot. Sonst darfst du auf dem Gehweg parken, wenn 2,30 m für Fussgänger frei bleiben, oder kostenlos auf einem Parkplatz am Fahrbahnrand, aber nie an Haltestellen, auf Radwegen, auf Brücken oder in Parks.',
    },
    {
      question: 'Werden E-Scooter in Berlin verboten?',
      answer: 'Ein Verbot ist nicht beschlossen, und ganz verbieten kann das Land Berlin E-Scooter laut Senat nicht. Die Genehmigungen laufen bis zum 31. März 2027. Nach einem Plan des Senats, der Sharing-Strategie 2035, sollen Leih-Scooter bis 2035 Gebiet für Gebiet nur noch an festen Stationen stehen.',
    },
    {
      question: 'Darf ich einen E-Scooter in U-Bahn, Tram oder Bus mitnehmen?',
      answer: 'Nein, die BVG verbietet E-Tretroller seit dem 1. Mai 2024, auch zusammengeklappt. Einen eigenen, zusammengeklappten Scooter darfst du in S-Bahn und Regionalzug mitnehmen; Leih-Scooter bleiben auf der Strasse.',
    },
    {
      question: 'Ab wie viel Jahren darf man in Berlin E-Scooter fahren?',
      answer: 'Laut Gesetz ab 14, ohne Führerschein. Mindestalter und Preis fürs Mieten zeigt dir die App vor dem Entsperren.',
    },
    {
      question: 'Bin ich auf einem Leih-Scooter versichert?',
      answer: 'Ja, für Schäden, die du anderen zufügst: Der Anbieter versichert jeden Scooter, das zeigt die Plakette hinten.',
    },
  ],
  sources: [
    { title: 'Senatsverwaltung für Mobilität: Stationslose Mikromobilität, Genehmigungen', url: 'https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/dienste-und-genehmigungen/stationslose-mikromobilitaet/' },
    { title: 'Abgeordnetenhaus Berlin, Schriftliche Anfrage S19-26660: Abstellen von E-Scootern und Genehmigungsauflagen (Juli 2026)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-26660.pdf' },
    { title: 'Abgeordnetenhaus Berlin, Schriftliche Anfrage S19-26583: Regeln, Kontrollen und Unfälle (Juli 2026)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-26583.pdf' },
    { title: 'Abgeordnetenhaus Berlin, Schriftliche Anfrage S19-25543: Falsch geparkte E-Scooter (März 2026)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-25543.pdf' },
    { title: 'Abgeordnetenhaus Berlin, Schriftliche Anfrage S19-25594: E-Scooter im öffentlichen Raum regulieren (April 2026)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-25594.pdf' },
    { title: 'Geoportal Berlin: Parkverbotszonen für Leihfahrzeuge der Mikromobilität (Karte)', url: 'https://gdi.berlin.de/view/parkverbot_mikromob' },
    { title: 'Bericht des Senats an den Hauptausschuss zu Sharing-Angeboten (Juni 2026)', url: 'https://www.parlament-berlin.de/adosservice/19/Haupt/vorgang/h19-2915-v.pdf' },
    { title: 'Bezirksamt Mitte: Virtuelle Parkverbotszone für Leihfahrzeuge (März 2024)', url: 'https://www.berlin.de/ba-mitte/aktuelles/pressemitteilungen/2024/pressemitteilung.1426019.php' },
    { title: 'Senatsverwaltung für Mobilität: Sharing-Strategie 2035', url: 'https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/verkehrsplanung/geteilte-mobilitaet/sharing-strategie-2035/' },
    { title: 'BVG: Verbot von E-Tretrollern', url: 'https://www.bvg.de/de/service-und-kontakt/e-tretroller-verbot' },
    { title: 'Jelbi (BVG): Häufige Fragen', url: 'https://www.jelbi.de/faq-de/' },
    { title: 'Bezirksamt Tempelhof-Schöneberg: Grünanlagen und Tulpenschild', url: 'https://www.berlin.de/ba-tempelhof-schoeneberg/politik-und-verwaltung/aemter/strassen-und-gruenflaechenamt/unsere-fachbereiche/strassen-und-gruenflaechenverwaltung/artikel.349752.php' },
  ],
};

export default guide;
