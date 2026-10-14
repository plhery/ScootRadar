import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-hannover',
  topic: 'hanover',
  name: 'E-Scooter Hannover: Anbieter, Preise, Parken',
  title: 'E-Scooter Hannover 2026: Anbieter, Preise, Parken, ÜSTRA',
  description: 'E-Scooter Hannover: die fünf Anbieter, was zehn Minuten kosten, wo du in der City parkst, warum die ÜSTRA keine Scooter mitnimmt und was der Rat neu regelt.',
  headline: 'E-Scooter Hannover: Anbieter, Preise, Parkzonen und was die neuen Regeln ändern',
  lede: 'Einen E-Scooter in Hannover leihst du ab 18 und ohne Führerschein bei Bolt, Dott (früher Tier), Lime, Voi oder Ryde. Zehn Minuten kosten im Standardtarif bei Voi 2,20 € und bei Dott 3,90 € (Stand Oktober 2026); verbindlich ist der Preis in der App. In der Innenstadt parkst du auf markierten Abstellflächen, in Parks wie der Eilenriede und am Maschsee gar nicht. In Stadtbahnen und Bussen der ÜSTRA sind E-Scooter seit dem 1. April 2024 verboten, auch zusammengeklappt.',
  published: '2026-10-13',
  updated: '2026-10-13',
  city: 'de:Hannover',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Hannover?',
      blocks: [
        'Laut Stadt vermieten fünf Anbieter in Hannover E-Scooter: **Bolt**, **Dott**, **Lime**, **Voi** und **Ryde**. Dott hiess früher Tier; wer Tier fuhr, nutzt heute die Dott-App. Ryde aus Norwegen ist laut HAZ erst seit Mai 2026 in der Stadt.',
        'Du leihst den Scooter in der App des Anbieters, laut Stadt ab 18, obwohl das Gesetz eigene E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte rund um Hannover](map:de:Hannover) nur Dott, weil es in Hannover nur von Dott offene Standortdaten bekommt: am Vormittag des 13. Oktober 2026 rund 2100 Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Bolt, Lime, Voi und Ryde fehlen auf der Karte; ihre Scooter findest du in ihren eigenen Apps.',
        'Dotts Gebiet reicht über die Stadtgrenze hinaus bis Langenhagen, Laatzen und Garbsen; Voi fährt laut eigener Mitteilung auch in Garbsen und Ronnenberg.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Hannover?',
      blocks: [
        'Einen Tarif für Hannover veröffentlichen Voi auf seiner Website und Dott in seinem offenen Datenfeed. Die Preise von Lime, Ryde und Bolt stammen aus einem Test der HAZ (Stand 25. September 2026).',
        {
          table: {
            caption: 'E-Scooter-Preise in Hannover im Standardtarif (Voi und Dott: Stand 13. Oktober 2026; Lime, Ryde und Bolt laut HAZ: Stand 25. September 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,22 €', '2,20 €', '4,40 €'],
              ['Lime (laut HAZ)', '0,00 €', '0,22 €', '2,20 €', '4,40 €'],
              ['Ryde (laut HAZ)', '0,00 €', '0,22 €', '2,20 €', '4,40 €'],
              ['Bolt (laut HAZ)', '0,25 €', '0,25 €', '2,75 €', '5,25 €'],
              ['Dott', '1,00 €', '0,29 €', '3,90 €', '6,80 €'],
            ],
          },
        },
        'Ausgerechnet Dott, der Anbieter auf unserer Karte, ist damit im Standardtarif der teuerste: Für zehn Minuten zahlst du dort mehr als anderthalbmal so viel wie bei Voi.',
        'Wer oft fährt, spart laut HAZ mit Abo oder Pass: Mit Dotts 30-Tage-Abo «Flex» für 0,99 € kostet jede Fahrt bis 30 Minuten 1,60 €. Voi und Ryde verkaufen Monatspässe mit bis zu 300 Minuten für 24,99 €, Bolt einen 30-Tage-Pass mit 150 Minuten für 12,99 €.',
        'Die Anbieter ändern ihre Preise oft; verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Den nächsten Dott und eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Hannover](map:de:Hannover).',
      ],
    },
    {
      heading: 'Wo darf man in Hannover mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehwege sind tabu.',
        '**Fussgängerzonen:** Auch die Fussgängerzonen der Innenstadt sind tabu, etwa Bahnhofstrasse, Georgstrasse und Lister Meile. Die Dott-App bremst dich dort nicht aus, trotzdem gilt: absteigen und schieben.',
        '**Parks:** In der Eilenriede, im Maschpark und im Georgengarten fährst du nach den Vorgaben der Stadt nur auf ausgeschilderten Radwegen, nie über Wiesen oder Grünstreifen. Den Grossen Garten und den Berggarten in Herrenhausen besuchst du am besten zu Fuss.',
        '**Tempo und Schienen:** Langsamfahr- oder Fahrverbotszonen gibt es in Dotts Daten für Hannover nicht; Dotts Scooter fahren überall höchstens 19 km/h. Die Stadtbahn fährt vielerorts auf der Strasse: Schienen querst du am besten im rechten Winkel, damit das Vorderrad nicht in die Rille rutscht.',
      ],
    },
    {
      heading: 'E-Scooter in Hannover abstellen: Innenstadt, Hauptbahnhof, Parks',
      blocks: [
        'In der Innenstadt hat die Stadt 2024 und 2025 rund 60 feste Abstellflächen markiert, jede für mindestens 20 Scooter. Sonst darfst du auf dem Gehweg parken, wenn niemand behindert wird: Laut der Vereinbarung der Stadt mit den Anbietern müssen mindestens 2 m frei bleiben; die Stadt rät zu 2,5 m. Zum Wartebereich von Haltestellen hältst du 10 m Abstand. Tabu sind Radwege, Kreuzungen, Ampeln und Überwege, abgesenkte Bordsteine, Blindenleitstreifen und Grünanlagen.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung von Dotts Datenfeed, Stand Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Hauptbahnhof und Ernst-August-Platz, Bahnhofstrasse, Kröpcke, Raschplatz', 'Nur an markierten Flächen, etwa am «Mobility HUB» am Ernst-August-Platz oder in der Kurt-Schumacher-Strasse'],
              ['Marktkirche, Neues Rathaus, Steintor, Klagesmarkt', 'Nur an markierten Flächen'],
              ['Opernplatz, Ballhofplatz, mittlere Lister Meile', 'Gar nicht'],
              ['Eilenriede mit Zoo und Lister Turm, Maschsee-Ufer, Maschpark', 'Gar nicht'],
              ['Grosser Garten, Berggarten, Georgengarten, Limmerstrasse, Ihme-Zentrum', 'Gar nicht'],
              ['Heinz-von-Heiden-Arena, Schützenplatz, Messegelände', 'Gar nicht'],
              ['Expo Plaza, Bahnhof Hannover Messe/Laatzen', 'Ja, wenn niemand behindert wird'],
              ['Flughafen Hannover-Langenhagen', 'Gar nicht: ausserhalb von Dotts Gebiet'],
            ],
          },
        },
        'Andere Anbieter ziehen ihre Zonen womöglich anders: Massgeblich ist die Karte in deiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder neben statt auf einer markierten Fläche. Fahr zur nächsten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Wer behindernd parkt, zahlt laut Stadt 20 €, wer andere gefährdet, 30 €. Dazu kommen die Anbieter: Laut ihrer Vereinbarung mit der Stadt müssen sie am Fahrtende ein Foto verlangen und bei Verstössen mindestens 20 € berechnen oder das Konto sperren.',
        'Steht dir ein Scooter im Weg, melde ihn dem Anbieter, am besten mit Foto und genauem Ort. Die Kontakte nennt die Stadt auf ihrer E-Scooter-Seite; für Bolt, Lime und Voi geht es auch über scooter-melder.de.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Hannover: Bussgelder, Alkohol, Unfälle',
      blocks: [
        'In Hannover gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht (die Polizei Hannover rät zum Helm), bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Nebeneinander gefahren', '15 €, bis 30 €', 'erlaubt, wenn niemand behindert wird'],
              ['Zu zweit auf einem Scooter', '5 € (laut Verkehrsministerium)', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (Stadt Hannover)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        '2025 verunglückten in Stadt und Region Hannover laut Polizei 355 Menschen auf E-Scootern, auf geliehenen wie eigenen, ein Fünftel mehr als im Vorjahr. 23 wurden schwer verletzt, und erstmals kamen zwei ums Leben.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Maschseefest, Schützenfest, Messe: E-Scooter bei Grossveranstaltungen',
      blocks: [
        'Eigene Scooter-Regeln für Feste haben wir bei der Stadt nicht gefunden. Schützenplatz, Arena, Maschsee-Ufer und Messegelände liegen aber das ganze Jahr in Dotts Parkverbotszonen: Dort beendest du keine Dott-Fahrt. Stell den Scooter vorher ab, lauf das letzte Stück und prüf vor dem Fest die Zonen in der App.',
        {
          table: {
            caption: 'Grosse Termine in Hannover (laut Stadt und Veranstaltern) und wo du die Fahrt beendest (laut Dotts Daten)',
            head: ['Veranstaltung', 'Nächster Termin', 'Fahrt beenden'],
            rows: [
              ['Weihnachtsmarkt in der Altstadt', '23. November bis 22. Dezember 2026', 'An der Marktkirche nur an markierten Flächen'],
              ['Frühlingsfest, Schützenplatz', '27. März bis 18. April 2027', 'Ausserhalb des Schützenplatzes'],
              ['Hannover Messe; Agritechnica', '5. bis 8. April 2027; 14. bis 20. November 2027', 'Am Bahnhof Hannover Messe/Laatzen oder an der Expo Plaza'],
              ['Schützenfest, Schützenplatz', '2. bis 11. Juli 2027', 'Ausserhalb des Schützenplatzes'],
              ['Maschseefest', '28. Juli bis 15. August 2027', 'Abseits der Ufer'],
              ['Heimspiele von Hannover 96', 'laut Spielplan', 'Ausserhalb von Arena und Schützenplatz'],
            ],
          },
        },
      ],
    },
    {
      heading: 'E-Scooter und ÜSTRA: Mitnahmeverbot, S-Bahn, Flughafen, sprintRad',
      blocks: [
        'Seit dem 1. April 2024 darfst du E-Tretroller nicht mehr in Stadtbahnen und Bussen der **ÜSTRA** und der **regiobus** mitnehmen, auch nicht zusammengeklappt; Grund ist die Brandgefahr der Akkus. Elektromobile für Menschen mit Behinderung sind etwas anderes und dürfen unter Bedingungen mit.',
        'In S-Bahn und Regionalzügen gilt ein eigener, zusammengeklappter E-Tretroller laut GVH-Tarif als Handgepäck. Leih-Scooter lassen sich nicht klappen und dürfen nie mit: Fahrt vor der Haltestelle beenden, am Ziel einen neuen mieten.',
        '**Zum Flughafen:** Er liegt ausserhalb von Dotts Gebiet; für die anderen Anbieter schau in deren App. Nimm die S5 ab Hauptbahnhof: Sie fährt alle 30 Minuten und braucht etwa 15 bis 18 Minuten.',
        '**sprintRad**, das Leihrad von ÜSTRA und GVH, läuft seit März 2024 über die App von Donkey Republic: rund 1100 Fahrräder in Hannover und Ronnenberg, ausgeliehen und zurückgegeben an Stationen.',
        {
          list: [
            '**Ohne Abo:** 1 € pro angefangene 15 Minuten, höchstens 15 € in 24 Stunden.',
            '**Mit ÜSTRA-Abo, Deutschlandticket, Jobticket oder Deutschland-Semesterticket:** die ersten 30 Minuten jeder Fahrt gratis, so oft du willst.',
          ],
        },
        'Eine Viertelstunde kostet damit 1 € oder nichts, mit dem E-Scooter von Voi 3,30 €.',
      ],
    },
    {
      heading: 'Neue E-Scooter-Regeln: Ab wann nur noch drei Anbieter in Hannover?',
      blocks: [
        'Heute regelt eine freiwillige Vereinbarung von 2023 zwischen Stadt und Anbietern das Leihgeschäft, ohne Obergrenze und ohne Gebühr. Am 24. September 2026 hat der Rat einstimmig beschlossen:',
        {
          list: [
            '**drei Anbieter**, die die Stadt nach Qualität auswählt, mit Verträgen über drei Jahre;',
            '**höchstens 2500 Scooter je Anbieter, 7500 insgesamt**. Die Verwaltung hatte 6000 vorgeschlagen; diese Zahl, die noch auf der Website der Stadt steht, ist überholt;',
            'erstmals eine **Gebühr** pro Scooter und Monat, einheitlich für die ganze Stadt; die Höhe berechnet die Verwaltung noch;',
            'in der **Innenstadt** Fahrtende nur noch auf markierten Flächen; im übrigen Stadtgebiet kommen nach und nach Flächen dazu, im Umkreis von meist 150 m parkst du dann nur dort.',
          ],
        },
        'Die Ausschreibung soll laut Stadt noch folgen. Einen Starttermin, Bewerber oder Gewinner haben wir bis Mitte Oktober 2026 nicht gefunden: Welche drei Anbieter bleiben und ab wann, ist offen. Bis auf Weiteres vermieten alle fünf.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Hannover',
      blocks: [
        {
          list: [
            '**Fünf Millionen Voi-Fahrten in gut drei Jahren.** Voi startete im Juni 2022 in Hannover; Anfang November 2025 endete die fünfmillionste Fahrt.',
            '**Die meisten Voi-Fahrten hängen an Bus und Bahn.** Laut Voi werden rund 60 Prozent seiner Fahrten in Hannover mit Bus oder Bahn kombiniert.',
            '**Mehr Scooter als die künftige Obergrenze.** Im Juli 2025 zählte die Stadt rund 8000 Leih-Scooter von vier Anbietern, mehr als die 7500, die drei Anbieter künftig zusammen aufstellen dürfen.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App kann ich in Hannover nutzen?',
      answer: 'Die von Bolt, Dott, Lime, Voi oder Ryde: Diese fünf Anbieter vermieten laut Stadt in Hannover E-Scooter. Du musst mindestens 18 sein, einen Führerschein brauchst du nicht. Freie Dott-Scooter zeigt auch die [Live-Karte von Hannover](map:de:Hannover).',
    },
    {
      question: 'Welcher E-Scooter-Anbieter ist in Hannover am günstigsten?',
      answer: 'Im Standardtarif Voi, Lime und Ryde: keine Entsperrgebühr und 0,22 € pro Minute, zehn Minuten also 2,20 € (Voi Stand Oktober, Lime und Ryde laut HAZ Ende September 2026). Am teuersten ist Dott mit 1 € plus 0,29 € pro Minute; mit Dotts Abo «Flex» kostet aber jede Fahrt bis 30 Minuten 1,60 €.',
    },
    {
      question: 'Darf ich meinen E-Scooter in der ÜSTRA mitnehmen?',
      answer: 'Nein. Seit dem 1. April 2024 sind E-Tretroller in Stadtbahnen und Bussen der ÜSTRA und der regiobus verboten, auch zusammengeklappt. In der S-Bahn darf ein eigener, zusammengeklappter Scooter als Handgepäck mit, ein Leih-Scooter nie.',
    },
    {
      question: 'Gibt es in Hannover ein E-Scooter-Verbot?',
      answer: 'Nein, aber neue Regeln: Der Rat hat am 24. September 2026 beschlossen, künftig nur noch drei Anbieter mit zusammen höchstens 7500 Scootern zuzulassen. Wer bleibt und ab wann, steht noch nicht fest. Verboten sind das Fahren auf Gehwegen und in Fussgängerzonen sowie die Mitnahme in Stadtbahnen und Bussen der ÜSTRA.',
    },
    {
      question: 'Kann ich mit dem E-Scooter zum Flughafen Hannover fahren?',
      answer: 'Mit einem Dott nicht: Der Flughafen liegt ausserhalb seines Gebiets, dort kannst du keine Fahrt beenden. Nimm die S5 ab Hauptbahnhof und steig erst in der Stadt auf einen Scooter um.',
    },
  ],
  sources: [
    { title: 'Stadt Hannover: E-Scooter in Hannover (29. Juli 2026)', url: 'https://www.hannover.de/Service/Presse-Medien/Hannover.de/Aktuelles/Service-2019/E-Scooter-in-Hannover' },
    { title: 'Rat der Stadt Hannover, Drucksache 1366/2026: E-Scooter-Betrieb im Stadtgebiet', url: 'https://e-government.hannover-stadt.de/lhhsimwebre.nsf/DS/1366-2026' },
    { title: 'Rat der Stadt Hannover, Drucksache 1893/2026: Änderungsantrag zu Flottengrösse und Gebühr', url: 'https://e-government.hannover-stadt.de/lhhsimwebre.nsf/DS/1893-2026' },
    { title: 'Stadt Hannover: Vereinbarung zum Verleihbetrieb für E-Scooter (6. Januar 2023, PDF)', url: 'https://www.hannover.de/content/download/915068/file/Vereinbarung%20zum%20Verleihbetrieb%20f%C3%BCr%20E-Scooter%2006.01.2023.pdf' },
    { title: 'GVH: Beförderungsbedingungen und Tarifbestimmungen (Stand 1. Mai 2026, PDF)', url: 'https://www.uestra.de/fileadmin/user_upload/PDF/Tarif_und_Bef%C3%B6rderungsbedingungen/GVH_ABB_und_Tarifbestimmungen.pdf' },
    { title: 'ÜSTRA: sprintRad', url: 'https://www.uestra.de/service-und-mobilitaet/mobilitaetsangebote/sprintrad/' },
    { title: 'Polizeidirektion Hannover: Verkehrssicherheitsbericht 2025', url: 'https://www.pd-h.polizei-nds.de/verkehr/verkehrssicherheitsbericht-2025-der-polizeidirektion-hannover-116779.html' },
    { title: 'Dott: Tarif für Hannover im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/hannover/system_pricing_plans.json' },
    { title: 'Voi: E-Scooter in Hannover', url: 'https://www.voi.com/de/city/hanover' },
    { title: 'HAZ: Der grosse E-Scooter-Test in Hannover (30. September 2026)', url: 'https://www.haz.de/lokales/hannover/e-scooter-test-hannover-welcher-anbieter-hat-die-besten-roller-CWR4WBB7CFFWFEHX3L2XQ7NNMQ.html' },
  ],
};

export default guide;
