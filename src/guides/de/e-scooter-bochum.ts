import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-bochum',
  topic: 'bochum',
  name: 'E-Scooter Bochum: Anbieter, Regeln, Parken',
  title: 'E-Scooter Bochum 2026: Anbieter, Regeln, Parkverbote',
  description: 'E-Scooter Bochum: Voi, Dott, Bolt, Lime und Ryde, wo du in City und Stadtpark nicht fährst oder parkst, was die Stadt vorgibt und was bei der BOGESTRA gilt.',
  headline: 'E-Scooter Bochum: Anbieter, Parkverbote, Parks und was bei der BOGESTRA gilt',
  lede: 'Einen E-Scooter in Bochum leihst du ohne Führerschein bei Voi, Dott, Bolt, Lime oder Ryde. Was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. In der Fussgängerzone der City fährst du nicht, in Parks laut Stadt nur auf ausgeschilderten Radwegen, und in Parks, Grünanlagen und Wäldern darf die Miete nicht enden. In Bussen und Bahnen der BOGESTRA sind E-Scooter laut ADAC seit dem 1. April 2024 verboten.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Bochum',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Bochum?',
      blocks: [
        'Fünf Anbieter vermieten im Oktober 2026 E-Scooter in Bochum: **Voi**, **Dott** (früher Tier), **Bolt**, **Lime** und **Ryde** aus Norwegen, der laut Radio Bochum am 1. Juni 2026 startete.',
        'Wie das Mieten in der App geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'In der Nacht auf Montag, 26. Oktober 2026, zeigte die [Karte von Bochum](map:de:Bochum) um 4:24 Uhr rund 220 Dott-, 320 Voi- und 310 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 520 Lime-Scooter nach der letzten Zählung.',
        'Leihräder gibt es beim metropolradruhr, das laut Regionalverband Ruhr seit dem 1. April 2026 Donkey Republic betreibt.',
      ],
    },
    {
      heading: 'E-Scooter in Bochum parken: was die Stadt vorgibt',
      blocks: [
        'Seit 2019 gibt die Stadt den Anbietern Anforderungen vor. Auf dem Gehweg gilt: «Eine nutzbare Restgehwegbreite von mindestens 2,0 m muss eingehalten werden.» Radwege, Rettungswege, Einfahrten und Wartebereiche von Bus und Bahn bleiben frei; beim Verteilen stellt ein Anbieter höchstens vier Scooter an einen Standort. In Parks, Grünanlagen und Wäldern und wo viele Menschen zu Fuss gehen, darf die Miete nicht enden. Wo nicht abgestellt werden soll, legen die Anbieter «in Abstimmung mit der Stadt» fest.',
        'Feste Abstellflächen gibt es bisher nicht. Laut Radio Bochum beschloss der Rat im Februar 2026, das Abstellen stärker zu regeln, etwa nach dem Vorbild von [Essen](guide:essen); im September 2026 berichtete der Sender, die Stadt wolle feste Flächen schrittweise einführen.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone, und die Miete läuft weiter. Fahr ein Stück weiter: Die App zeigt, wo du abstellen darfst.',
        },
        'Falsch abgestellte Leih-Scooter kannst du laut Radio Bochum im Mängelmelder der Stadt unter «E-Scooter (Leihfahrzeuge)» melden; die Stadt gibt die Hinweise an den Anbieter weiter.',
      ],
    },
    {
      heading: 'Wo darf man in Bochum mit dem E-Scooter fahren? Fussgängerzone und Parks',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Für die City schrieb die Stadt 2019: «die komplette Fussgängerzone ist für E-Tretroller tabu». Auf der Kortumstrasse zwischen Südring und Brückstrasse steigst du also ab und schiebst.',
        'Grünanlagen zu befahren, verbietet die Bochumer Sicherheitsverordnung (Fassung vom 20. Mai 2026) grundsätzlich, gleich wem die Fläche gehört; ausgenommen ist unter anderem «das Radfahren auf dafür bestimmten und entsprechend gekennzeichneten Wegen». Verstösse kosten bis zu 1000 €. E-Scooter nennt die Verordnung nicht, nach unserer Lesart gilt das Verbot aber auch für sie. Den Anbietern schrieb die Stadt 2019 vor, dass in Parks nur auf Wegen mit blauem Radwegschild (Zeichen 237, 240 und 241) gefahren werden darf. Im Stadtpark und im Westpark bleibst du also auf diesen Wegen oder schiebst.',
        'Leih-Scooter fahren nur in einem Teil der Stadt; wo genau, zeigt die App.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Bochum: Bussgelder und Alkohol',
      blocks: [
        'In Bochum gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'E-Scooter in Bus und Bahn: Was bei der BOGESTRA gilt',
      blocks: [
        'Laut ADAC (November 2025) gilt bei der BOGESTRA seit dem 1. April 2024 ein Mitnahmeverbot für E-Scooter in Bussen und Bahnen.',
        'Ob ein eigener E-Scooter in S-Bahn, Regional- oder Fernzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand Oktober 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Ruhrstadion, Ruhr-Uni, Bochum Total: Tipps für Bochum',
      blocks: [
        '**VfL-Heimspiele im Ruhrstadion:** Am bequemsten ist die Strassenbahn: Die Linien 308 und 316 fahren laut VfL in drei Minuten vom Hauptbahnhof zur Haltestelle Ruhrstadion an der Castroper Strasse, und mit der Eintrittskarte fährst du im ganzen VRR kostenlos.',
        '**Hochschule Bochum:** Ihre Hausordnung vom 18. September 2014 verbietet, Roller und Fahrräder «in den Hochschulgebäuden» zu benutzen.',
        '**Bochum Total:** Im Juli 2026 lief das Festival laut Stadt zum letzten Mal im Bermuda3Eck: «2027 steigt das Festival im Westpark, rund um die altehrwürdige Jahrhunderthalle». Im Park fährst du dann nur auf Wegen mit blauem Radwegschild.',
        '**Nachts:** Eine nächtliche Sperrzeit oder Winterpause nennt die Stadt nicht.',
      ],
    },
    {
      heading: 'Herne, Witten, Gelsenkirchen: E-Scooter in den Nachbarstädten',
      blocks: [
        'Auch in den Nachbarstädten fährst du Leih-Scooter, im Oktober 2026 etwa:',
        {
          list: [
            '**Herne:** Am 26. Oktober 2026 um 4:24 Uhr zeigte die [Karte von Herne](map:de:Herne) rund 250 Voi- und 240 Dott-Scooter, die zu diesem Zeitpunkt frei waren, und rund 170 Lime-Scooter nach der letzten Zählung.',
            '**Witten:** Zur selben Zeit zeigte die [Karte von Witten](map:de:Witten) rund 70 Voi-Scooter, die zu diesem Zeitpunkt frei waren, und rund 140 Lime-Scooter nach der letzten Zählung.',
            '**Gelsenkirchen:** Leih-Scooter gibt es dort laut ADAC nicht (Stand November 2025).',
          ],
        },
      ],
    },
    {
      heading: 'Was die Stadt Bochum für Leih-Scooter regelt',
      blocks: [
        'Leih-Scooter auf öffentlichen Strassen sind in Bochum eine Sondernutzung nach dem Strassen- und Wegegesetz NRW: Die Anbieter brauchen eine Erlaubnis der Stadt und zahlen laut Gebührentarif der Sondernutzungssatzung (Fassung vom 23. Januar 2025) für die «Gewerbliche Nutzung von E-Scootern» 3,86 € pro Scooter und Monat.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Bochum nutzen?',
      answer: 'Die von Voi, Dott, Bolt, Lime und Ryde (Stand Oktober 2026). Einen Führerschein brauchst du nicht; ab welchem Alter du mieten darfst und was die Fahrt kostet, zeigt dir die App. Freie Scooter zeigt auch die [Live-Karte von Bochum](map:de:Bochum).',
    },
    {
      question: 'Wo melde ich einen falsch abgestellten Leih-Scooter in Bochum?',
      answer: 'Laut Radio Bochum im Mängelmelder der Stadt unter «E-Scooter (Leihfahrzeuge)». Die Stadt gibt die Hinweise an den Anbieter weiter.',
    },
    {
      question: 'Warum kann ich meine Fahrt in Bochum nicht beenden?',
      answer: 'Dann stehst du in einer Zone, in der der Anbieter das Abstellen sperrt, etwa in einem Park: In Parks, Grünanlagen und Wäldern darf die Miete laut den Vorgaben der Stadt nicht enden. Fahr ein Stück weiter; die App zeigt, wo du abstellen darfst.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Bahn der BOGESTRA mitnehmen?',
      answer: 'Nein. Laut ADAC schliesst die BOGESTRA E-Scooter seit dem 1. April 2024 aus Bussen und Bahnen aus. Ob ein eigener Scooter in S-Bahn oder Zug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
    },
    {
      question: 'Darf ich im Stadtpark mit dem E-Scooter fahren?',
      answer: 'Laut den Vorgaben der Stadt für die Anbieter (2019) nur auf Wegen mit blauem Radwegschild. Die Sicherheitsverordnung verbietet, Grünanlagen zu befahren, ausser beim Radfahren auf gekennzeichneten Wegen (bis 1000 € Bussgeld); dass das auch für E-Scooter gilt, ist unsere Lesart. Einen Leih-Scooter abstellen darfst du in Parks laut den Vorgaben der Stadt nicht.',
    },
    {
      question: 'Wie komme ich zu einem VfL-Spiel ins Ruhrstadion?',
      answer: 'Am bequemsten mit der Strassenbahn 308 oder 316 ab Hauptbahnhof: Laut VfL braucht sie drei Minuten, und mit der Eintrittskarte fährst du im ganzen VRR kostenlos.',
    },
  ],
  sources: [
    { title: 'Stadt Bochum: E-Scooter (2019)', url: 'https://www.bochum.de/E-Scooter' },
    { title: 'Stadt Bochum: Anforderungen und Empfehlungen für Anbieter stationsloser E-Tretroller-Verleiher (25. September 2019, PDF)', url: 'https://www.bochum.de/C125830C0042AB74/vwContentByKey/W2BJ2E2S298BOCMDE/$File/Anlage%202_Anforderungen_E_Tretroller_Verleiher_2.pdf' },
    { title: 'Stadt Bochum: Sondernutzungssatzung mit Gebührentarif (8. Änderung vom 23. Januar 2025, PDF)', url: 'https://www.bochum.de/C125830C0042AB74/vwContentByKey/N26R26U3212HGILDE/$File/sondernutzungs_satzung.pdf' },
    { title: 'Stadt Bochum: Bochumer Sicherheitsverordnung mit Lageplänen (Fassung vom 20. Mai 2026, PDF)', url: 'https://www.bochum.de/C125830C0042AB74/vwContentByKey/N26R26QP189HGILDE/$File/bosvo.pdf' },
    { title: 'Stadt Bochum: Bochum Total feiert Abschied vom Bermuda3Eck (4. Juli 2026)', url: 'https://www.bochum.de/Pressemeldungen/4-Juli-2026/Bochum-Total-feiert-Abschied-vom-Bermuda3Eck' },
    { title: 'Radio Bochum: Bochum plant neues Konzept für E-Scooter (6. Februar 2026)', url: 'https://www.radiobochum.de/artikel/bochum-plant-neues-konzept-fuer-e-scooter-2566496' },
    { title: 'Radio Bochum: Neuer E-Scooter-Anbieter in Bochum gestartet (16. Juni 2026)', url: 'https://www.radiobochum.de/artikel/neuer-e-scooter-anbieter-in-bochum-gestartet-2670400' },
    { title: 'Radio Bochum: Bochum plant feste Abstellflächen für E-Scooter (29. September 2026)', url: 'https://www.radiobochum.de/artikel/bochum-plant-feste-abstellflaechen-fuer-e-scooter-2765660' },
    { title: 'ADAC: E-Scooter im Nahverkehr, wo die Mitnahme verboten ist (17. November 2025)', url: 'https://www.adac.de/news/verkehr-e-scooter-mitnahmeverbot-nahverkehr/' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'VfL Bochum 1848: Anreise und Parken', url: 'https://www.vfl-bochum.de/stadion/anreise-parken/' },
    { title: 'Hochschule Bochum: Hausordnung (18. September 2014, PDF)', url: 'https://www.hochschule-bochum.de/fileadmin/public/Die-BO_Hochschule/Hochschulrecht/190_Hausordnung.pdf' },
    { title: 'Regionalverband Ruhr: Neuer Betriebspartner für das Metropolradruhr (18. Dezember 2025)', url: 'https://www.rvr.ruhr/news/startseite-news/news/metropolradruhr-neuer-betriebspartner-des-fahrradverleihsystems-steht-fest/' },
  ],
};

export default guide;
