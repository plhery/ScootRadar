import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-hannover',
  topic: 'hanover',
  name: 'E-Scooter Hannover: Anbieter, Parken, Regeln',
  title: 'E-Scooter Hannover 2026: Anbieter, Parken, Regeln, ÜSTRA',
  description: 'E-Scooter Hannover: die fünf Anbieter, wo du in der City parkst, was fürs Fahren gilt, warum die ÜSTRA keine Scooter mitnimmt und was der Rat neu regelt.',
  headline: 'E-Scooter Hannover: Anbieter, Parkzonen und was die neuen Regeln ändern',
  lede: 'Einen E-Scooter in Hannover leihst du ab 18 und ohne Führerschein bei Bolt, Dott (früher Tier), Lime, Voi oder Ryde; den Preis zeigt dir die App vor dem Entsperren. In der Innenstadt parkst du auf markierten Abstellflächen, in Parks wie der Eilenriede und am Maschsee gar nicht. In Stadtbahnen und Bussen der ÜSTRA sind E-Scooter seit dem 1. April 2024 verboten, auch zusammengeklappt.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'de:Hannover',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Hannover?',
      blocks: [
        'Laut Stadt vermieten fünf Anbieter in Hannover E-Scooter: **Bolt**, **Dott**, **Lime**, **Voi** und **Ryde**. Dott hiess früher Tier; wer Tier fuhr, nutzt heute die Dott-App. Ryde aus Norwegen ist erst seit Mai 2026 in der Stadt.',
        'Du leihst den Scooter in der App des Anbieters, laut Stadt ab 18, obwohl das Gesetz eigene E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'Am Freitag, 30. Oktober 2026, um 8:27 Uhr standen rund um Hannover rund 2100 Dott-, 2800 Voi- und 900 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 2200 Lime-Scooter nach der letzten Zählung. Wo gerade einer steht, siehst du auf der [Karte rund um Hannover](map:de:Hannover).',
      ],
    },
    {
      heading: 'Wo darf man in Hannover mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehwege sind tabu.',
        '**Fussgängerzonen:** Auch die Fussgängerzonen der Innenstadt sind tabu, etwa Bahnhofstrasse, Georgstrasse zwischen Steintor und Ständehausstrasse und Lister Meile ab dem Weisskreuzplatz. Dort gilt: absteigen und schieben.',
        '**Parks:** In der Eilenriede, im Maschpark und im Georgengarten fährst du nach den Vorgaben der Stadt nur auf ausgeschilderten Radwegen, nie über Wiesen oder Grünstreifen. Den Grossen Garten und den Berggarten in Herrenhausen besuchst du am besten zu Fuss.',
        '**Schienen:** Die Stadtbahn fährt vielerorts auf der Strasse: Schienen querst du am besten im rechten Winkel, damit das Vorderrad nicht in die Rille rutscht.',
      ],
    },
    {
      heading: 'E-Scooter in Hannover abstellen: Innenstadt, Gehweg, Bussgeld',
      blocks: [
        'In der Innenstadt hat die Stadt 2024 und 2025 rund 60 feste Abstellflächen markiert, jede für mindestens 20 Scooter. Sonst darfst du auf dem Gehweg parken, wenn niemand behindert wird: Laut der Vereinbarung der Stadt mit den Anbietern müssen mindestens 2 m frei bleiben; die Stadt rät zu 2,5 m. Zum Wartebereich von Haltestellen hältst du 10 m Abstand. Tabu sind Radwege, Kreuzungen, Ampeln und Überwege, abgesenkte Bordsteine, Blindenleitstreifen und Grünanlagen.',
        'Wo du die Fahrt beenden darfst, zeigt die Karte in deiner App.',
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
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (Stadt Hannover)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        '2025 verunglückten in Stadt und Region Hannover laut Polizei 355 Menschen auf E-Scootern, ein Fünftel mehr als im Vorjahr. 23 wurden schwer verletzt, und erstmals kamen zwei ums Leben.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Maschseefest, Schützenfest, Messe: E-Scooter bei Grossveranstaltungen',
      blocks: [
        'Bei den grossen Terminen rund um Schützenplatz, Arena, Maschsee-Ufer und Messegelände stellst du den Scooter am besten vorher ab, läufst das letzte Stück und prüfst vor dem Fest die Zonen in der App.',
        {
          table: {
            caption: 'Grosse Termine in Hannover (laut Stadt und Veranstaltern)',
            head: ['Veranstaltung', 'Nächster Termin'],
            rows: [
              ['Weihnachtsmarkt in der Altstadt', '23. November bis 22. Dezember 2026'],
              ['Frühlingsfest, Schützenplatz', '27. März bis 18. April 2027'],
              ['Hannover Messe; Agritechnica', '5. bis 8. April 2027; 14. bis 20. November 2027'],
              ['Schützenfest, Schützenplatz', '2. bis 11. Juli 2027'],
              ['Maschseefest', '28. Juli bis 15. August 2027'],
              ['Heimspiele von Hannover 96', 'laut Spielplan'],
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
        '**Zum Flughafen:** Nimm die S5 ab Hauptbahnhof: Laut Flughafen braucht sie etwa 18 Minuten bis zur Station unter Terminal C.',
        '**sprintRad**, das Leihrad der ÜSTRA, läuft über die App von Donkey Republic: laut ÜSTRA 1100 Fahrräder in Hannover und Ronnenberg. Den Preis zeigt die App.',
      ],
    },
    {
      heading: 'Neue E-Scooter-Regeln: Ab wann nur noch drei Anbieter in Hannover?',
      blocks: [
        'Heute regelt eine freiwillige Vereinbarung von 2023 zwischen Stadt und Anbietern das Leihgeschäft, ohne Obergrenze und ohne Gebühr. Am 24. September 2026 hat der Rat einstimmig beschlossen:',
        {
          list: [
            '**drei Anbieter**, die die Stadt nach Qualität auswählt, mit Verträgen über drei Jahre;',
            '**höchstens 2500 Scooter je Anbieter, 7500 insgesamt**. Die Verwaltung hatte 6000 vorgeschlagen;',
            'erstmals eine **Gebühr** pro Scooter und Monat, einheitlich für die ganze Stadt; die Höhe berechnet die Verwaltung noch;',
            'in der **Innenstadt** Fahrtende nur noch auf markierten Flächen; im übrigen Stadtgebiet kommen nach und nach Flächen dazu, im Umkreis von meist 150 m parkst du dann nur dort.',
          ],
        },
        'Wer bleibt und ab wann, ist offen; bis auf Weiteres vermieten alle fünf.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Hannover',
      blocks: [
        {
          list: [
            '**Laden mit Sonnenstrom.** Laut Ratsbeschluss vom 24. September 2026 entwickelt die Verwaltung bis zum Sommer 2027 ein Konzept, um solarbetriebene Mobility Hubs mit Lademöglichkeiten für E-Scooter zu erproben.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App kann ich in Hannover nutzen?',
      answer: 'Die von Bolt, Dott, Lime, Voi oder Ryde: Diese fünf Anbieter vermieten laut Stadt in Hannover E-Scooter. Du musst mindestens 18 sein, einen Führerschein brauchst du nicht. Wo gerade ein freier Scooter steht, zeigt die [Live-Karte von Hannover](map:de:Hannover).',
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
      question: 'Wie komme ich vom Flughafen Hannover in die Stadt?',
      answer: 'Mit der S5: Laut Flughafen braucht sie etwa 18 Minuten zwischen der Station unter Terminal C und dem Hauptbahnhof. Auf einen Scooter steigst du erst in der Stadt.',
    },
  ],
  sources: [
    { title: 'Stadt Hannover: E-Scooter in Hannover (29. Juli 2026)', url: 'https://www.hannover.de/Service/Presse-Medien/Hannover.de/Aktuelles/Service-2019/E-Scooter-in-Hannover' },
    { title: 'Rat der Stadt Hannover, Drucksache 1366/2026: E-Scooter-Betrieb im Stadtgebiet', url: 'https://e-government.hannover-stadt.de/lhhsimwebre.nsf/DS/1366-2026' },
    { title: 'Rat der Stadt Hannover, Drucksache 1893/2026: Änderungsantrag zu Flottengrösse und Gebühr', url: 'https://e-government.hannover-stadt.de/lhhsimwebre.nsf/DS/1893-2026' },
    { title: 'Stadt Hannover: Vereinbarung zum Verleihbetrieb für E-Scooter (6. Januar 2023, PDF)', url: 'https://www.hannover.de/content/download/915068/file/Vereinbarung%20zum%20Verleihbetrieb%20f%C3%BCr%20E-Scooter%2006.01.2023.pdf' },
    { title: 'GVH: Beförderungsbedingungen und Tarifbestimmungen (Stand 1. Mai 2026, PDF)', url: 'https://www.uestra.de/fileadmin/user_upload/PDF/Tarif_und_Bef%C3%B6rderungsbedingungen/GVH_ABB_und_Tarifbestimmungen.pdf' },
    { title: 'ÜSTRA: sprintRad', url: 'https://www.uestra.de/service-und-mobilitaet/mobilitaetsangebote/sprintrad/' },
    { title: 'Flughafen Hannover: Anreise mit der S-Bahn', url: 'https://www.hannover-airport.de/verkehrsanbindung/anreise/' },
    { title: 'Polizeidirektion Hannover: Verkehrssicherheitsbericht 2025', url: 'https://www.pd-h.polizei-nds.de/verkehr/verkehrssicherheitsbericht-2025-der-polizeidirektion-hannover-116779.html' },
  ],
};

export default guide;
