import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-neuss',
  topic: 'neuss',
  name: 'E-Scooter Neuss: Anbieter, Regeln, Parken',
  title: 'E-Scooter Neuss 2026: Anbieter, Regeln, Parken',
  description: 'E-Scooter Neuss: Voi, Dott, Bolt und Lime, wo du fährst und parkst, was in Parks gilt, was die Stadt den Anbietern vorgibt und der Weg nach Düsseldorf.',
  headline: 'E-Scooter Neuss: Anbieter, Parken, Regeln und der Weg nach Düsseldorf',
  lede: 'Einen E-Scooter in Neuss leihst du ohne Führerschein bei Voi, Dott, Bolt oder Lime. Was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg. Die Stadt erlaubt jedem Anbieter laut eigener Auskunft höchstens 200 Scooter und schreibt vor, auf welchen Flächen sie abgestellt werden dürfen; wo du die Fahrt beenden kannst, zeigt dir die App. In Parks stellst du nach der Grünanlagenordnung keine Fahrzeuge ab.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Neuss',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Neuss?',
      blocks: [
        'In Neuss vermieten **Voi**, **Dott** (früher Tier), **Bolt** und **Lime** E-Scooter: Am Montag, 26. Oktober 2026, zeigte die [Karte von Neuss](map:de:Neuss) um 7:08 Uhr rund 270 Dott-, 120 Voi- und 190 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntag, 25. Oktober, rund 400 Lime-Scooter nach der letzten Zählung.',
        'Wie das Mieten in der App geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Den Preis zeigt dir die App vor dem Entsperren; was Falschparken beim Anbieter kostet, steht in seinen Bedingungen in der App.',
        'Ausser den Leih-Scootern gibt es Sharing der Stadtwerke an ihren Mobilstationen: am Berliner Platz etwa «jeweils zwei E-Autos, zwei Elektroroller (sogenannte Scooter)» und zwei E-Fahrräder (Stadt Neuss, März 2026).',
      ],
    },
    {
      heading: 'E-Scooter in Neuss parken: was Stadt und App vorgeben',
      blocks: [
        'Fürs Parken gelten bundesweit die Regeln für Fahrräder: Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO, und Falschparken auf Geh- oder Radweg kostet dann ab 55 €.',
        'Leih-Scooter darf in Neuss nur aufstellen, wer eine Sondernutzungserlaubnis der Stadt hat. Laut Stadt (Januar 2022) schreibt sie Flächen vor, auf denen die Scooter angeboten und abgestellt werden dürfen. Welche das für deinen Anbieter sind, zeigt dir seine App: Dort endet die Fahrt, anderswo lässt sie dich nicht abschliessen.',
        'In Parks und anderen Grünanlagen ist das «Parken und Abstellen von Fahrzeugen» nach der Grünanlagenordnung der Stadt ohne ausdrückliche Erlaubnis nicht gestattet; nach unserer Lesart gilt das auch für E-Scooter. Beende die Fahrt am Rand des Parks.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du ausserhalb der Flächen, auf denen dein Anbieter abstellen lässt, und die Miete läuft weiter. Fahr ein Stück weiter: Die App zeigt, wo du abstellen darfst.',
        },
      ],
    },
    {
      heading: 'Wo darf man in Neuss mit dem E-Scooter fahren? Parks und Fussgängerzone',
      blocks: [
        'Innerorts nimmst du den Radweg, wo es einen gibt, auch Radfahr- und Schutzstreifen; nur wo nichts davon da ist, fährst du auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. «Radverkehr frei» reicht dafür erst ab dem 1. März 2027, dann im Schritttempo.',
        'Für Parks und andere Grünflächen gilt die Grünanlagenordnung der Stadt vom 29. März 2019, zuletzt geändert am 14. Juli 2025. «Radfahren ist grundsätzlich erlaubt, kann aber auf entsprechend gekennzeichneten Wegen untersagt werden», und «Fussgänger geniessen generell Vorrang». Das «Parken und Abstellen von Fahrzeugen» ist dort ohne ausdrückliche Erlaubnis nicht gestattet. E-Scooter nennt die Verordnung nicht. Ob die Erlaubnis zum Radfahren auch für sie gilt, lässt sie offen; nach unserer Lesart gilt das Abstellverbot auch für E-Scooter.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Neuss: Bussgelder und Alkohol',
      blocks: [
        'In Neuss gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Unzulässig auf Geh- oder Radweg geparkt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', '55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Rheinbahn und Stadtwerke Neuss',
      blocks: [
        'Die Rheinbahn fährt mit der U75 und der 709 ab dem Neusser Hauptbahnhof nach Düsseldorf. Ob und wie du einen eigenen E-Scooter in ihren Bahnen und Bussen mitnehmen darfst, fragst du vor der Fahrt bei ihr nach.',
        'In den Bussen der Stadtwerke Neuss gelten die Beförderungsbedingungen Nahverkehr NRW (gültig ab 1. Januar 2026): Danach zählt ein «vollständig im kleinstmöglichen Packmass» zusammengeklappter E-Tretroller als Handgepäck. Jedes Verkehrsunternehmen darf E-Tretroller aber per Hausrecht ausschliessen; frag vor der Fahrt bei den Stadtwerken nach. Leih-Scooter lassen sich nicht zusammenklappen und zählen damit nicht als Handgepäck.',
        'Ob ein eigener E-Scooter in S-Bahn, Regional- oder Fernzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
      ],
    },
    {
      heading: 'Mit dem E-Scooter von Neuss nach Düsseldorf: was über die Stadtgrenze gilt',
      blocks: [
        'Neuss und Düsseldorf liegen nah beieinander: Laut Stadt hatten 2021 bei einem einzigen Anbieter 7.500 Fahrten ihren Start oder ihr Ziel in Düsseldorf. Ob du eine Fahrt aus Neuss drüben beenden darfst und wo, zeigt dir die App deines Anbieters; jeder zieht die Grenze anders. Ohne Scooter kommst du mit der U75 und der 709 der Rheinbahn ab dem Neusser Hauptbahnhof hinüber.',
        'Was dich drüben erwartet, steht in [E-Scooter in Düsseldorf](guide:dusseldorf); freie Scooter zeigt die [Karte von Düsseldorf](map:de:Düsseldorf).',
      ],
    },
    {
      heading: 'Was die Stadt Neuss für Leih-Scooter regelt',
      blocks: [
        'Wer in Neuss Leih-Scooter anbietet, braucht laut Stadt (Januar 2022) eine Sondernutzungserlaubnis, die jeweils auf ein Jahr befristet ist. Sie begrenzt die Zahl auf höchstens 200 Geräte je Anbieter für das Stadtgebiet und schreibt die Flächen vor, auf denen die Scooter angeboten und abgestellt werden dürfen. Wie die Anbieter mit Beschwerden umgehen und wie schnell sie sie beseitigen, beeinflusst laut Stadt, ob die Erlaubnis verlängert wird.',
        'Die Sondernutzungssatzung (Fassung vom 21. Mai 2025) führt für «Aufbauten zum Zwecke der Mobilität ausserhalb von Mobilstationen», darunter E-Scooter, 3 € pro Quadratmeter und Jahr.',
        'Damals galt die Hauptkritik Scootern, die sich am Rand des Geschäftsgebiets häuften, etwa in Gnadental, Holzheim oder Grefrath. Gefragt waren sie trotzdem: Ein Anbieter zählte 2021 laut Stadt rund 100.000 Ausleihen; ein Scooter wurde im Schnitt 1,5-mal am Tag gemietet, eine Fahrt war im Schnitt 1,2 km lang.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Neuss nutzen?',
      answer: 'Die von Voi, Dott, Bolt und Lime (Stand Oktober 2026). Einen Führerschein brauchst du nicht; das Mindestalter und den Preis zeigt dir die App vor dem Entsperren.',
    },
    {
      question: 'Wie viele E-Scooter darf ein Anbieter in Neuss aufstellen?',
      answer: 'Laut Stadt (Januar 2022) höchstens 200 je Anbieter. So begrenzt die Sondernutzungserlaubnis, die jeweils für ein Jahr gilt, die Menge; sie schreibt auch die Flächen vor, auf denen Scooter angeboten und abgestellt werden dürfen.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Neusser Innenstadt nicht beenden?',
      answer: 'Dann stehst du ausserhalb der Flächen, auf denen dein Anbieter das Abstellen erlaubt, und die Miete läuft weiter. Die Sondernutzungserlaubnis der Stadt schreibt vor, wo Scooter abgestellt werden dürfen. Fahr ein Stück weiter; die App zeigt dir, wo du die Fahrt beenden kannst.',
    },
    {
      question: 'Darf ich einen E-Scooter in Rheinbahn oder Bus mitnehmen?',
      answer: 'In den Bussen der Stadtwerke Neuss zählt ein vollständig zusammengeklappter Scooter nach den Beförderungsbedingungen Nahverkehr NRW als Handgepäck. Ob die Rheinbahn ihn in U75, 709 und ihren Bussen mitnimmt, fragst du vor der Fahrt bei ihr nach.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter von Neuss nach Düsseldorf fahren?',
      answer: 'Ob du eine Fahrt in Düsseldorf beenden darfst und wo, zeigt dir die App deines Anbieters; jeder zieht die Grenze anders. In Düsseldorf gelten eigene Regeln, mehr in [E-Scooter in Düsseldorf](guide:dusseldorf).',
    },
    {
      question: 'Darf ich im Park mit dem E-Scooter fahren oder ihn dort abstellen?',
      answer: 'Die Grünanlagenordnung der Stadt erlaubt Radfahren grundsätzlich und verbietet, Fahrzeuge ohne Erlaubnis in Parks abzustellen. E-Scooter nennt sie nicht. Ob die Erlaubnis zum Radfahren auch für sie gilt, lässt sie offen; nach unserer Lesart gilt das Abstellverbot auch für E-Scooter.',
    },
  ],
  sources: [
    { title: 'Stadt Neuss: Wie fährt Neuss mit den E-Scootern? (31. Januar 2022)', url: 'https://www.neuss.de/news/2022/01/31/wie-faehrt-neuss-mit-den-e-scootern' },
    { title: 'Stadt Neuss: Grünanlagenordnung (29. März 2019, Fassung vom 14. Juli 2025)', url: 'https://www.neuss.de/rathaus/ortsrecht/67/04' },
    { title: 'Stadt Neuss: Sondernutzungssatzung (Fassung vom 21. Mai 2025)', url: 'https://www.neuss.de/rathaus/ortsrecht/69/02' },
    { title: 'Stadt Neuss: Stadtwerke haben weitere fünf Mobilstationen in Betrieb genommen (5. März 2026)', url: 'https://www.neuss.de/news/2026/03/05/stadtwerke-haben-weitere-fuenf-mobilstationen-in-neuss-in-betrieb-genommen' },
    { title: 'Stadt Neuss: Gleisarbeiten der Rheinbahn am Neusser Hauptbahnhof (12. März 2024)', url: 'https://www.neuss.de/news/2024/03/12/gleisarbeiten-der-rheinbahn-am-neusser-hauptbahnhof' },
    { title: 'Stadt Neuss: SB53 mit verkürztem Linienweg (4. August 2025)', url: 'https://www.neuss.de/presse/meldungen/2025/08/04/sb53-mit-verkuerztem-linienweg' },
    { title: 'Beförderungsbedingungen Nahverkehr NRW, gültig ab 1. Januar 2026 (PDF)', url: 'https://www.westfalentarif.de/fileadmin/documents/Tarifbestimmungen_und_Bef%C3%B6rderungsbedingungen_Preise/BB_Nahverkehr_NRW_zum_01.01.2026.pdf' },
  ],
};

export default guide;
