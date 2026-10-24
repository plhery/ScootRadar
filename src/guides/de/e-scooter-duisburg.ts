import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-duisburg',
  topic: 'duisburg',
  name: 'E-Scooter Duisburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Duisburg 2026: Anbieter, Preise, Sperrzonen',
  description: 'E-Scooter Duisburg: fünf Anbieter, was Voi pro Minute kostet, wo Voi die Rückgabe sperrt und was laut ADAC für Scooter in Bus und Bahn der DVG gilt.',
  headline: 'E-Scooter Duisburg: Anbieter, Preise, Parken, Sperrzonen und was bei der DVG gilt',
  lede: 'Einen E-Scooter in Duisburg leihst du ab 18 und ohne Führerschein bei Voi, Dott, Bolt, Lime oder Ryde. Voi verlangt in Duisburg laut seinem veröffentlichten Tarif 0,18 € pro Minute und nichts fürs Entsperren, zehn Minuten kosten also 1,80 € (Stand 24. Oktober 2026); die anderen zeigen ihren Preis in der App. Die Stadt lässt Leih-Scooter wie Fahrräder abstellen, doch Voi sperrt die Rückgabe in der Fussgängerzone rund um die Königstrasse, am Innenhafen und im Landschaftspark. In Bussen und Bahnen der DVG sind E-Scooter laut ADAC seit dem 1. März 2024 verboten.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Duisburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Duisburg?',
      blocks: [
        'Fünf Anbieter vermieten 2026 E-Scooter in Duisburg: **Voi**, **Dott** (früher Tier), **Bolt**, **Lime** und **Ryde**. Dott, Bolt, Lime und Ryde nennt die Stadt auf ihrer Seite zum E-Scooter-Verleih (Stand Juli 2026). Voi fehlt dort, fährt aber laut eigener Mitteilung seit dem 1. August 2025 in Duisburg und Oberhausen. Dott und Ryde führen Duisburg auf ihren Websites (Stand 24. Oktober 2026); NRW.Mobidrom, das Mobilitätsdatenportal des Landes, führt seit Juli 2026 Bolt als Anbieter in Essen und Duisburg.',
        'Dott und Bolt fahren laut Stadt (Juli 2026) in der Innenstadt und den Vierteln ringsum, von Neuenkamp bis Wanheimerort und Buchholz und links des Rheins etwa in Rheinhausen; Lime reicht weiter. Vois Gebiet umfasst laut Karte den grössten Teil der rechten Rheinseite von Walsum bis Buchholz, dazu Homberg, aber nicht Rheinhausen (Stand 24. Oktober 2026).',
        'Gemietet wird in der App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Auf der [Karte von Duisburg](map:de:Duisburg) zeigt ScootRadar Voi und Dott: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 1030 Voi- und 300 Dott-Scooter, zusammen rund 1330. Die Zahl umfasst das ganze Stadtgebiet mit Rheinhausen und Homberg, aber nicht Oberhausen, Mülheim oder Moers. Das ist eine Momentaufnahme, keine Flottengrösse; die Stadt sprach im Oktober 2025 von mehr als 2000 Leih-Scootern. Für Voi zeigt die Karte auch Preis, Abstellverbote, Parkplätze und Fahrgebiet, für Dott nur die Standorte. Bolt, Lime und Ryde fehlen auf der Karte; ihre Scooter findest du nur in ihren Apps. E-Bikes und Leihräder zeigt die Karte nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Duisburg?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Duisburg (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (veröffentlichter Tarif, 24. Oktober 2026)', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
              ['Dott, Bolt, Lime, Ryde', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Bei Voi kostet eine Viertelstunde damit 2,70 €, in Oberhausen gilt derselbe Tarif. Verbindlich ist immer der Preis, den die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'E-Scooter in Duisburg parken: Innenstadt, Hauptbahnhof, Innenhafen',
      blocks: [
        'Einen E-Scooter stellst du in Duisburg ab wie ein Fahrrad, solange er niemanden behindert oder gefährdet: «Wie Fahrräder dürfen sie so gut wie überall abgestellt werden», schreibt die Stadt (Stand Juli 2026). Feste Parkzonen der Stadt gibt es nicht. Stattdessen sperren die Anbieter nach einer Vereinbarung mit der Stadt Bereiche, in denen du die Fahrt nicht beenden kannst; nach Beschwerden kamen laut Stadt (Oktober 2025) viele dazu.',
        'Bei Voi beendest du die Fahrt laut Karte nicht (Stand 24. Oktober 2026):',
        {
          list: [
            '**in der Innenstadt:** in der Fussgängerzone mit Königstrasse, König-Heinrich-Platz, Kuhstrasse, Sonnenwall und Münzstrasse, auf dem Dellplatz und im Kantpark;',
            '**am Wasser:** auf einem breiten Streifen entlang von Rhein, Ruhr und Häfen, vom Rheinpark in Hochfeld über den Innenhafen bis zum Landschaftspark Duisburg-Nord;',
            '**im Grünen:** in den Botanischen Gärten in Duissern und Hamborn, im Stadtwald Hamborn und im Angerpark mit Tiger & Turtle.',
          ],
        },
        'Rund um den Hauptbahnhof zeigt die Karte 18 Voi-Parkplätze auf beiden Seiten der Gleise, die Voi als Pflicht markiert: In ihrer Zone stellst du den Voi nur auf einem davon ab (Stand 24. Oktober 2026). Wie weit die Pflicht reicht, zeigt die App; die Plätze siehst du auch auf der [Live-Karte von Duisburg](map:de:Duisburg).',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Sperrzone, und die Miete läuft weiter. Schieb den Scooter aus der Fussgängerzone hinaus oder fahr ein Stück vom Ufer weg und versuch es dort.',
        },
        'Wo Dott, Bolt, Lime und Ryde das Abstellen sperren, zeigen nur ihre Apps.',
      ],
    },
    {
      heading: 'Wo darf man in Duisburg mit dem E-Scooter fahren? Sperrzonen',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, auch mit ausgeschaltetem Motor, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; durch die Fussgängerzone der Königstrasse schiebst du also. Gegen die Fahrtrichtung einer Einbahnstrasse mit «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt dich mitfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es dort erlaubt. Diese Regeln setzt der Bund. Die Stadt Duisburg schreibt, gegen die Fahrtrichtung sei es auch dort verboten, wo Radfahrende dürfen.',
        'Neben falsch abgestellten Scootern nennt die Stadt das Fahren in der Fussgängerzone der Innenstadt als Missstand (Oktober 2025); kontrolliert wird es von der Polizei. Eine technische Fahrsperre lässt das Kraftfahrt-Bundesamt laut Stadt nicht zu, und Voi sperrt dort nur das Abstellen. Das Verbot einhalten musst du selbst.',
        '**Parks und Ufer:** Die Sicherheits- und Ordnungsverordnung der Stadt gilt für alle öffentlich zugänglichen Grün-, Erholungs- und Sportflächen, Wälder, Friedhöfe und Gewässer samt Ufern, gleich wem sie gehören. Dort ist verboten, Rasen zu befahren und Wege mit Fahrzeugen, «soweit sie nicht durch Hinweisschilder als Fahrwege gekennzeichnet sind». Ohne solches Schild schiebst du also.',
        'Ausserhalb des Voi-Gebiets liegen laut Karte (Stand 24. Oktober 2026):',
        {
          list: [
            'der Sportpark Wedau mit dem MSV-Stadion, der Regattabahn, dem Bertasee und der Sechs-Seen-Platte;',
            'der Zoo und der Kaiserberg;',
            'die Mühlenweide und die Mercatorinsel in Ruhrort.',
          ],
        },
        'Drei Bezirksvertretungen haben die Verwaltung um weitere Fahrverbote gebeten: Meiderich/Beeck im Juni 2026 für Leih-Scooter auf der Von-der-Mark-Strasse, Hamborn im September 2026 für alle E-Scooter auf Jägerstrasse, Holtener Strasse und Kaiser-Wilhelm-Strasse, Walsum für den Kometenplatz, dort als Prüfauftrag. Eine Umsetzung hat die Stadt bis zum 24. Oktober 2026 nicht veröffentlicht, und Voi zeigte dort keine Fahrverbotszone; achte vor Ort auf Schilder.',
        'Eine nächtliche Sperrzeit oder Regeln für Feste nennt die Stadt nicht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Duisburg: Bussgelder und Alkohol',
      blocks: [
        'In Duisburg gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'E-Scooter in Bus und Bahn: Was bei DVG und VRR gilt',
      blocks: [
        'Laut ADAC nimmt die DVG seit dem 1. März 2024 in all ihren Bussen und Bahnen keine E-Scooter mehr mit (Stand November 2025). Die Betriebe folgen einer Empfehlung ihres Verbands VDV, Grund ist die Brandgefahr der Akkus. Auf ihrer eigenen Website nennt die DVG das Verbot nicht (Stand 24. Oktober 2026); ihr Flyer zur «E-Scooter-Nutzung im Bus» meint Elektromobile, nicht E-Tretroller.',
        'In S-Bahn und Regionalzug zählt dein zusammengeklappter Scooter laut VRR als Handgepäck, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen (Stand Juli 2026). Leih-Scooter stellst du vor dem Bahnhof ab.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand Oktober 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Innenhafen, Landschaftspark, Uni: Tipps für Duisburg',
      blocks: [
        '**Innenhafen:** Die Promenade an der Marina, der Garten der Erinnerung und das Museum Küppersmühle liegen laut Karte in Vois Abstellverbotszone am Wasser. Beende die Fahrt vorher und geh die letzten Meter.',
        '**Landschaftspark Duisburg-Nord:** Der Park ist laut Betreiber das ganze Jahr rund um die Uhr offen, Eintritt frei; abends leuchtet die Lichtinstallation. Eine eigene Regel für E-Scooter nennt der Park nicht, einen Voi stellst du dort laut Karte aber nicht ab.',
        '**MSV-Spiele und Zoo:** Stadion und Zoo liegen ausserhalb des Voi-Gebiets. Mit Voi beendest du die Fahrt also vorher. Aufs Zoogelände darfst du laut Zooordnung keinen E-Scooter mitnehmen.',
        '**Universität Duisburg-Essen:** Die Gebäude an Lotharstrasse und Bismarckstrasse in Neudorf liegen laut Karte im Voi-Gebiet, ohne Abstellverbot (Stand 24. Oktober 2026).',
        '**Oberhausen und Mülheim:** Voi hat für Duisburg und Oberhausen ein gemeinsames Gebiet: Von Meiderich oder Hamborn fährst du ohne neue Miete bis zum Centro. Mülheim liegt ausserhalb. Freie Voi- und Dott-Scooter in Oberhausen zeigt die [Karte von Oberhausen](map:de:Oberhausen). Wie es in Essen läuft, steht in [E-Scooter in Essen](guide:essen).',
      ],
    },
    {
      heading: 'Was die Stadt Duisburg für Leih-Scooter regelt',
      blocks: [
        'Eine Sondernutzungserlaubnis oder Gebühr für Leih-Scooter gibt es in Duisburg bisher nicht; die Sondernutzungssatzung der Stadt nennt sie nicht (Stand Oktober 2026). Eine Obergrenze hat die Stadt nicht veröffentlicht; die Zahl der Voi-Scooter legte Voi laut eigener Mitteilung mit den Städten fest. Feste Parkzonen lehnte die Stadt im Oktober 2025 ab: Für das Abstellen gälten die Regeln für Fahrräder, und feste Zonen kosteten viel Platz und Geld.',
        'Das könnte sich ändern. Am 2. Juli 2026 beauftragte der Rat einstimmig die Verwaltung zu prüfen, ob gewerbliche E-Scooter in die Sondernutzungssatzung aufgenommen werden können, und, soweit rechtlich möglich, kurzfristig eine Änderung vorzulegen. Ziel des Antrags sind Abstellbereiche am Hauptbahnhof und an stark genutzten Knotenpunkten sowie eine moderate Gebühr pro Scooter und Jahr, gestaffelt nach Kernzone und Aussenbezirken. Die Antragsteller berufen sich auf die Novelle der Strassenverkehrs-Ordnung, nach der das gewerbliche Aufstellen von Leih-Scootern kein Parken ist; diese Regel gilt ab 1. März 2027. Eine Vorlage der Verwaltung war bis zum 24. Oktober 2026 nicht veröffentlicht, in Kraft ist nichts davon.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Duisburg nutzen?',
      answer: 'Die von Voi, Dott, Bolt, Lime und Ryde (Stand 2026). Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Voi- und Dott-Scooter zeigt auch die ScootRadar-Karte, die von Bolt, Lime und Ryde nur deren Apps.',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Duisburg?',
      answer: 'Bei Voi 1,80 €: 0,18 € pro Minute, Entsperren gratis, laut Vois veröffentlichtem Duisburger Tarif vom 24. Oktober 2026. Bei Dott, Bolt, Lime und Ryde zeigt dir die App den Preis.',
    },
    {
      question: 'Warum kann ich meine Fahrt auf der Königstrasse oder am Innenhafen nicht beenden?',
      answer: 'Weil Voi dort die Rückgabe sperrt: laut Karte in der Fussgängerzone der Innenstadt, am Innenhafen und auf einem Streifen entlang von Rhein und Häfen (Stand 24. Oktober 2026). Die Stadt selbst verbietet das Abstellen dort nicht; die anderen Anbieter zeigen ihre Sperrbereiche in der App. Schieb den Scooter hinaus und beende die Fahrt dort, sonst läuft die Miete weiter.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Bahn der DVG mitnehmen?',
      answer: 'Laut ADAC nicht: Seit dem 1. März 2024 sind E-Scooter in allen Bussen und Bahnen der DVG verboten (Stand November 2025). In S-Bahn und Regionalzug darf ein zusammengeklappter Scooter laut VRR als Handgepäck mit, sofern das Verkehrsunternehmen ihn nicht ausschliesst.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter von Duisburg nach Oberhausen fahren?',
      answer: 'Mit Voi ja: Duisburg und Oberhausen bilden ein gemeinsames Voi-Gebiet, du fährst etwa von Meiderich bis zum Centro (Stand 24. Oktober 2026). Bei den anderen Anbietern zeigt die App, wo die Fahrt enden darf.',
    },
  ],
  sources: [
    { title: 'Stadt Duisburg: E-Scooter-Verleih in Duisburg (Stand Juli 2026)', url: 'https://www.duisburg.de/microsites/pbv/verkehr/e-scooter/e-scooter-spin' },
    { title: 'Stadt Duisburg, Rat: Antrag 26-0978 zur Sondernutzungssatzung (2. Juli 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20139411' },
    { title: 'Stadt Duisburg, Ausschuss für Stadtentwicklung und Verkehr: Niederschrift vom 2. Oktober 2025 (PDF)', url: 'https://sessionnet.owl-it.de/duisburg/bi/getfile.asp?id=1768508&type=do' },
    { title: 'Stadt Duisburg, BV Meiderich/Beeck: Antrag 26-0725 (11. Juni 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20138166' },
    { title: 'Stadt Duisburg, BV Hamborn: Antrag 26-1154 (3. September 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20139607' },
    { title: 'Stadt Duisburg, BV Walsum: Antrag 26-1259 (3. September 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20140712' },
    { title: 'Voi: Start in Duisburg und Oberhausen (31. Juli 2025, PDF)', url: 'https://storage.mfn.se/56928c26-f54c-49bf-9449-ddd1b655915f/e-scooter-anbieter-voi-startet-in-duisburg-und-oberhausen.pdf' },
    { title: 'NRW.Mobidrom: Mobilitätsdatenportal NRW', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Ryde: Standorte', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Stadt Duisburg: Sicherheits- und Ordnungsverordnung (PDF)', url: 'https://www.duisburg.de/rathaus/rathausundpolitik/ortsrecht/Sicherheits_und_Ordnungsverordnung.pdf' },
    { title: 'Zoo Duisburg: Zooordnung', url: 'https://zoo-duisburg.de/zooordnung' },
    { title: 'ADAC: Mitnahmeverbot im Nahverkehr (Stand November 2025)', url: 'https://www.adac.de/news/verkehr-e-scooter-mitnahmeverbot-nahverkehr/' },
    { title: 'DVG: Mobilitätsgarantie NRW', url: 'https://www.dvg-duisburg.de/kundenservice/fahrgastrechte-und-garantien/mobilitaetsgarantie-nrw' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Landschaftspark Duisburg-Nord: Häufig gestellte Fragen', url: 'https://www.landschaftspark.de/haufig-gestellte-fragen/haufig-gestellte-fragen/' },
  ],
};

export default guide;
