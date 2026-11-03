import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-duisburg',
  topic: 'duisburg',
  name: 'E-Scooter Duisburg: Anbieter, Regeln, Parken',
  title: 'E-Scooter Duisburg 2026: Anbieter, Regeln, Parken',
  description: 'E-Scooter Duisburg: fünf Anbieter, wo du fährst und abstellst, was in Parks und an Ufern gilt und was laut ADAC für Scooter in Bus und Bahn der DVG gilt.',
  headline: 'E-Scooter Duisburg: Anbieter, Parken, Parks und Ufer und was bei der DVG gilt',
  lede: 'Einen E-Scooter in Duisburg leihst du ohne Führerschein bei Voi, Dott, Bolt, Lime oder Ryde. Was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. Die Stadt lässt Leih-Scooter wie Fahrräder abstellen; wo ein Anbieter die Rückgabe sperrt, zeigt seine App. In Bussen und Bahnen der DVG sind E-Scooter laut ADAC seit dem 1. März 2024 verboten.',
  published: '2026-10-25',
  updated: '2026-10-26',
  city: 'de:Duisburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Duisburg?',
      blocks: [
        'Fünf Anbieter vermieten 2026 E-Scooter in Duisburg: **Voi**, **Dott** (früher Tier), **Bolt**, **Lime** und **Ryde**. Dott, Bolt, Lime und Ryde nennt die Stadt auf ihrer Seite zum E-Scooter-Verleih (Stand Juli 2026).',
        'Dott und Bolt fahren laut Stadt (Juli 2026) in der Innenstadt und den Vierteln ringsum, von Neuenkamp bis Wanheimerort und Buchholz und links des Rheins etwa in Rheinhausen; Lime reicht weiter. Ihr Gebiet passen die Anbieter laut Stadt nach ihrer Erfahrung an.',
        'Gemietet wird in der App; dort siehst du vor dem Entsperren auch den Preis. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz vor 16 Uhr zeigte die [Karte von Duisburg](map:de:Duisburg) rund 1030 Voi- und 300 Dott-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntagvormittag, 25. Oktober, rund 2650 Lime-Scooter nach der letzten Zählung.',
      ],
    },
    {
      heading: 'E-Scooter in Duisburg parken: wie ein Fahrrad',
      blocks: [
        'Einen E-Scooter stellst du in Duisburg ab wie ein Fahrrad, solange er niemanden behindert oder gefährdet: «Wie Fahrräder dürfen sie so gut wie überall abgestellt werden», schreibt die Stadt (Stand Juli 2026). Feste Parkzonen der Stadt gibt es nicht. Die Anbieter haben sich laut Stadt verpflichtet, Behinderungen und Gefährdungen zu vermeiden, und sagen dir, wo der Scooter am Ende der Miete stehen darf und wo nicht. Beschwerden klären Stadt und Anbieter direkt miteinander.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Sperrzone des Anbieters, und die Miete läuft weiter. Fahr oder schieb ein Stück weiter; die App zeigt, wo du abstellen darfst.',
        },
      ],
    },
    {
      heading: 'Wo darf man in Duisburg mit dem E-Scooter fahren? Sperrzonen',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, auch mit ausgeschaltetem Motor, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; durch die Fussgängerzone der Königstrasse schiebst du also. Gegen die Fahrtrichtung einer Einbahnstrasse mit «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt dich mitfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es dort erlaubt. Diese Regeln setzt der Bund. Die Stadt Duisburg schreibt, gegen die Fahrtrichtung sei es auch dort verboten, wo Radfahrende dürfen.',
        '**Parks und Ufer:** Die Sicherheits- und Ordnungsverordnung der Stadt gilt für alle öffentlich zugänglichen Grün-, Erholungs- und Sportflächen, Wälder, Friedhöfe und Gewässer samt Ufern, gleich wem sie gehören. Dort ist verboten, Rasen zu befahren und Wege mit Fahrzeugen, «soweit sie nicht durch Hinweisschilder als Fahrwege gekennzeichnet sind». Ohne solches Schild schiebst du also.',
        'Eine nächtliche Sperrzeit oder Regeln für Feste nennt die Stadt nicht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Duisburg: Bussgelder und Alkohol',
      blocks: [
        'In Duisburg gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Was bei der DVG gilt',
      blocks: [
        'Laut ADAC nimmt die DVG seit dem 1. März 2024 in all ihren Bussen und Bahnen keine E-Scooter mehr mit (Stand November 2025). Die Betriebe folgen einer Empfehlung ihres Verbands VDV, Grund ist die Brandgefahr der Akkus.',
        'Ob ein eigener E-Scooter in S-Bahn und Regionalzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach. Leih-Scooter stellst du vor dem Bahnhof ab.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand Oktober 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Zoo und Nachbarstädte: Tipps für Duisburg',
      blocks: [
        '**Zoo:** Aufs Zoogelände darfst du laut Zooordnung keinen E-Scooter mitnehmen; stell den Leih-Scooter vorher ab.',
        '**Oberhausen, Mülheim und Essen:** Was in den Nachbarstädten gilt, steht in [E-Scooter in Oberhausen](guide:oberhausen), [E-Scooter in Mülheim an der Ruhr](guide:muelheim) und [E-Scooter in Essen](guide:essen). Ob du eine Fahrt jenseits der Stadtgrenze beenden darfst, zeigt die App.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Duisburg nutzen?',
      answer: 'Die von Voi, Dott, Bolt, Lime und Ryde (Stand 2026). Einen Führerschein brauchst du nicht; ab welchem Alter du mieten darfst und was die Fahrt kostet, zeigt dir die App. Freie Scooter zeigt auch die [Live-Karte von Duisburg](map:de:Duisburg).',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch Parks und am Rhein fahren?',
      answer: 'Nur auf Wegen, die Hinweisschilder als Fahrwege kennzeichnen. Auf Grün- und Erholungsflächen, in Wäldern und an Gewässern samt Ufern verbietet die Sicherheits- und Ordnungsverordnung der Stadt, Wege sonst mit Fahrzeugen zu befahren; ohne Schild schiebst du.',
    },
    {
      question: 'Warum kann ich meine Fahrt in Duisburg nicht beenden?',
      answer: 'Dann stehst du in einem Bereich, in dem der Anbieter die Rückgabe sperrt; die Stadt selbst lässt Scooter wie Fahrräder abstellen. Fahr oder schieb ein Stück weiter, sonst läuft die Miete weiter. Wo du die Fahrt beenden darfst, zeigt die App.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Bahn der DVG mitnehmen?',
      answer: 'Laut ADAC nicht: Seit dem 1. März 2024 sind E-Scooter in allen Bussen und Bahnen der DVG verboten (Stand November 2025). Ob ein eigener Scooter in S-Bahn oder Regionalzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
    },
    {
      question: 'Wo kann ich in Duisburg einen Leih-Scooter abstellen?',
      answer: 'Laut Stadt wie ein Fahrrad so gut wie überall, solange er niemanden behindert oder gefährdet. Feste Parkzonen der Stadt gibt es nicht; wo ein Anbieter die Rückgabe sperrt, zeigt seine App.',
    },
  ],
  sources: [
    { title: 'Stadt Duisburg: E-Scooter-Verleih in Duisburg (Stand Juli 2026)', url: 'https://www.duisburg.de/microsites/pbv/verkehr/e-scooter/e-scooter-spin' },
    { title: 'Stadt Duisburg: Sicherheits- und Ordnungsverordnung (PDF)', url: 'https://www.duisburg.de/rathaus/rathausundpolitik/ortsrecht/Sicherheits_und_Ordnungsverordnung.pdf' },
    { title: 'Zoo Duisburg: Zooordnung', url: 'https://zoo-duisburg.de/zooordnung' },
    { title: 'ADAC: Mitnahmeverbot im Nahverkehr (Stand November 2025)', url: 'https://www.adac.de/news/verkehr-e-scooter-mitnahmeverbot-nahverkehr/' },
    { title: 'DVG: Mobilitätsgarantie NRW', url: 'https://www.dvg-duisburg.de/kundenservice/fahrgastrechte-und-garantien/mobilitaetsgarantie-nrw' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
  ],
};

export default guide;
