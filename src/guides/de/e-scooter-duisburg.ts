import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-duisburg',
  topic: 'duisburg',
  name: 'E-Scooter Duisburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Duisburg 2026: Anbieter, Preise, Sperrzonen',
  description: 'E-Scooter Duisburg: fünf Anbieter, was Voi pro Minute kostet, wo Voi die Rückgabe sperrt und was laut ADAC für Scooter in Bus und Bahn der DVG gilt.',
  headline: 'E-Scooter Duisburg: Anbieter, Preise, Parken, Sperrzonen und was bei der DVG gilt',
  lede: 'Einen E-Scooter in Duisburg leihst du ohne Führerschein bei Voi, Dott, Bolt, Lime oder Ryde: App laden, Konto anlegen, Scooter auf der Karte suchen, QR-Code scannen und losfahren. Dott, Bolt und Ryde vermieten ab 18. Voi verlangt in Duisburg 0,18 € pro Minute und nichts fürs Entsperren, zehn Minuten kosten also 1,80 € (Stand November 2026); bei den anderen zeigt die App den Preis vor dem Entsperren. Die Stadt lässt Leih-Scooter wie Fahrräder abstellen, doch Voi sperrt die Rückgabe in der Fussgängerzone rund um die Königstrasse, am Innenhafen und im Landschaftspark. In Bussen und Bahnen der DVG sind E-Scooter laut ADAC seit dem 1. März 2024 verboten.',
  published: '2026-10-25',
  updated: '2026-10-26',
  city: 'de:Duisburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Duisburg?',
      blocks: [
        'Fünf Anbieter vermieten E-Scooter in Duisburg: **Voi**, **Dott** (früher Tier), **Bolt**, **Lime** und **Ryde**. Dott, Bolt, Lime und Ryde nennt die Stadt auf ihrer Seite zum E-Scooter-Verleih (Stand November 2026). Voi fährt laut eigener Mitteilung seit dem 1. August 2025 in Duisburg und Oberhausen. Dott und Ryde führen Duisburg auf ihren Websites (Stand November 2026).',
        'Dott und Bolt fahren laut Stadt in der Innenstadt und den Vierteln ringsum, von Neuenkamp bis Wanheimerort und Buchholz und links des Rheins etwa in Rheinhausen; Lime reicht weiter. Ihr Gebiet passen die Anbieter laut Stadt nach ihrer Erfahrung an. Voi fährt auf der rechten Rheinseite von Walsum bis Huckingen und Grossenbaum, links des Rheins in Teilen von Homberg und Hochheide, aber nicht in Rheinhausen (Stand November 2026).',
        'Schritt für Schritt erklärt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz vor 16 Uhr zeigte die [Karte von Duisburg](map:de:Duisburg) rund 1030 Voi- und 300 Dott-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntagvormittag, 25. Oktober, rund 2650 Lime-Scooter nach der letzten Zählung.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Duisburg?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Duisburg (Stand November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
            ],
          },
        },
        'Bei Voi kostet eine Viertelstunde damit 2,70 €, in Oberhausen gilt derselbe Tarif.',
        'Teuer wird falsches Abstellen: Bolt berechnet 15 €, wenn der Scooter falsch steht und kein deutliches Foto am Ende der Fahrt da ist, und bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs. Dott kann bis zu 300 € Rückholkosten verlangen, wenn du seine Park- und Sperranweisungen nicht befolgst, und zahlt Dott ein Bussgeld für dich, kommen 50 € Verwaltungsgebühr dazu.',
      ],
    },
    {
      heading: 'E-Scooter in Duisburg parken: Innenstadt, Hauptbahnhof, Innenhafen',
      blocks: [
        'Einen E-Scooter stellst du in Duisburg ab wie ein Fahrrad, solange er niemanden behindert oder gefährdet: «Wie Fahrräder dürfen sie so gut wie überall abgestellt werden», schreibt die Stadt (Stand Juli 2026). Feste Parkzonen der Stadt gibt es nicht. Die Anbieter haben sich laut Stadt verpflichtet, Behinderungen und Gefährdungen zu vermeiden, und sagen dir, wo der Scooter am Ende der Miete stehen darf und wo nicht. Dazu sperren sie Bereiche, in denen du die Fahrt nicht beenden kannst; nach Beschwerden kamen laut Stadt (Oktober 2025) viele dazu. Weitere Beschwerden klären Stadt und Anbieter direkt miteinander.',
        'Bei Voi beendest du die Fahrt nicht (Stand November 2026):',
        {
          list: [
            '**in der Innenstadt:** im grössten Teil der Fussgängerzone mit Königstrasse, König-Heinrich-Platz, Kuhstrasse, Sonnenwall und Münzstrasse, auf dem Dellplatz und im Kantpark;',
            '**am Wasser:** im Rheinpark in Hochfeld, am Innenhafen mit dem Garten der Erinnerung und im Landschaftspark Duisburg-Nord;',
            '**im Grünen:** in den Botanischen Gärten in Duissern und Hamborn, im Stadtwald Hamborn und im Angerpark mit Tiger & Turtle.',
          ],
        },
        'Auch rund um den Hauptbahnhof sperrt Voi das Abstellen, vor allem auf der Seite zur Innenstadt. Dort stellst du den Voi auf einem seiner Abstellpunkte ab, die es auf beiden Seiten der Gleise gibt; die App zeigt sie.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Sperrzone, und die Miete läuft weiter. Schieb den Scooter aus der Fussgängerzone hinaus oder fahr ein Stück vom Ufer weg und versuch es dort.',
        },
        'Wo Dott, Bolt, Lime und Ryde das Abstellen sperren, zeigen ihre Apps.',
      ],
    },
    {
      heading: 'Wo darf man in Duisburg mit dem E-Scooter fahren? Sperrzonen',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, auch mit ausgeschaltetem Motor, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; durch die Fussgängerzone der Königstrasse schiebst du also. Gegen die Fahrtrichtung einer Einbahnstrasse mit «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt dich mitfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es dort erlaubt. Diese Regeln setzt der Bund. Die Stadt Duisburg schreibt, gegen die Fahrtrichtung sei es auch dort verboten, wo Radfahrende dürfen.',
        'Neben falsch abgestellten Scootern nennt die Stadt das Fahren in der Fussgängerzone der Innenstadt als Missstand (Oktober 2025); kontrolliert wird es von der Polizei. Eine technische Fahrsperre lässt das Kraftfahrt-Bundesamt laut Stadt nicht zu, und Voi sperrt dort nur das Abstellen. Das Verbot einhalten musst du selbst.',
        '**Parks und Ufer:** Die Sicherheits- und Ordnungsverordnung der Stadt gilt für alle öffentlich zugänglichen Grün-, Erholungs- und Sportflächen, Wälder, Friedhöfe und Gewässer samt Ufern, gleich wem sie gehören. Dort ist verboten, Rasen zu befahren und Wege mit Fahrzeugen, «soweit sie nicht durch Hinweisschilder als Fahrwege gekennzeichnet sind». Ohne solches Schild schiebst du also.',
        'Ausserhalb des Voi-Gebiets liegen (Stand November 2026):',
        {
          list: [
            'der Sportpark Wedau mit dem MSV-Stadion, der Regattabahn und dem Bertasee sowie die Sechs-Seen-Platte;',
            'der Zoo und der Kaiserberg;',
            'die Mercatorinsel und der grösste Teil der Mühlenweide in Ruhrort.',
          ],
        },
        'Drei Bezirksvertretungen haben die Verwaltung um weitere Fahrverbote gebeten: Meiderich/Beeck im Juni 2026 für Leih-Scooter auf der Von-der-Mark-Strasse, Hamborn im September 2026 für die Einkaufsstrassen Jägerstrasse, Holtener Strasse und Kaiser-Wilhelm-Strasse, Walsum für den Kometenplatz, dort als Prüfauftrag. Achte vor Ort auf Schilder.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Duisburg: Bussgelder und Alkohol',
      blocks: [
        'In Duisburg gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter bei Dott, Bolt und Ryde ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt'],
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
      heading: 'E-Scooter in Bus und Bahn: Was bei DVG, VRR und DB gilt',
      blocks: [
        'Laut ADAC nimmt die DVG seit dem 1. März 2024 in all ihren Bussen und Bahnen keine E-Scooter mehr mit (Stand November 2025). Die Betriebe folgen einer Empfehlung ihres Verbands VDV, Grund ist die Brandgefahr der Akkus.',
        'In S-Bahn und Regionalzug zählt dein Scooter laut VRR als Handgepäck, wenn er «vollständig im kleinstmöglichen Packmass» zusammengeklappt ist, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen, auch zusammengeklappt (Stand Juli 2026). In allen Fernzügen der Deutschen Bahn fährt er zusammengeklappt kostenlos als Handgepäck mit; den Akku darfst du unterwegs weder herausnehmen noch laden. Leih-Scooter stellst du vor dem Bahnhof ab.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand November 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Innenhafen, Landschaftspark, Uni: Tipps für Duisburg',
      blocks: [
        '**Innenhafen:** Die Promenade am Innenhafen und der Garten der Erinnerung liegen in einer Abstellverbotszone von Voi. Beende die Fahrt vorher und geh die letzten Meter.',
        '**Landschaftspark Duisburg-Nord:** Der Park ist laut Betreiber das ganze Jahr ohne zeitliche Einschränkung offen, Eintritt frei; ab der Dämmerung leuchtet die Lichtinstallation. Voi sperrt dort die Rückgabe.',
        '**MSV-Spiele und Zoo:** Stadion und Zoo liegen ausserhalb des Voi-Gebiets, mit Voi beendest du die Fahrt also vorher. Aufs Zoogelände darfst du laut Zooordnung keinen E-Scooter mitnehmen.',
        '**Universität Duisburg-Essen:** Die meisten Gebäude der Bereiche L und B an Lotharstrasse und Bismarckstrasse in Neudorf liegen in Vois Gebiet, ohne Abstellverbot. Der Ostrand des Campus mit LD, LE, LH, MA und MB liegt ausserhalb, und an den übrigen M-Gebäuden sperrt Voi das Abstellen (Stand November 2026).',
        '**Oberhausen, Mülheim und Essen:** Voi hat für Duisburg und Oberhausen ein gemeinsames Gebiet: Von Meiderich oder Hamborn fährst du ohne neue Miete bis zum Centro. Mülheim liegt ausserhalb (Stand November 2026). Was in den Nachbarstädten gilt, steht in [E-Scooter in Oberhausen](guide:oberhausen), [E-Scooter in Mülheim an der Ruhr](guide:muelheim) und [E-Scooter in Essen](guide:essen). Ob du bei den anderen Anbietern eine Fahrt jenseits der Stadtgrenze beenden darfst, zeigt die App.',
      ],
    },
    {
      heading: 'Was die Stadt Duisburg für Leih-Scooter regelt',
      blocks: [
        'Feste Parkzonen lehnte die Stadt im Oktober 2025 ab: Für das Abstellen gälten die Regeln für Fahrräder, und bei mehr als 2000 Leih-Scootern kosteten feste Zonen viel Platz und Geld. Die Zahl der Voi-Scooter legte Voi laut eigener Mitteilung mit den Städten fest.',
        'Das könnte sich ändern. Am 2. Juli 2026 beauftragte der Rat einstimmig die Verwaltung zu prüfen, ob gewerbliche E-Scooter in die Sondernutzungssatzung aufgenommen werden können, und, soweit rechtlich möglich, kurzfristig eine Änderung vorzulegen. Ziel des Antrags sind Abstellbereiche am Hauptbahnhof und an stark genutzten Knotenpunkten sowie eine moderate Gebühr pro Scooter und Jahr, gestaffelt nach Kernzone und Aussenbezirken. Die Antragsteller berufen sich auf die Novelle der Strassenverkehrs-Ordnung, nach der das gewerbliche Aufstellen von Leih-Scootern kein Parken ist; diese Regel gilt ab 1. März 2027.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Duisburg nutzen?',
      answer: 'Die von Voi, Dott, Bolt, Lime und Ryde. Einen Führerschein brauchst du nicht; Dott, Bolt und Ryde vermieten ab 18. Freie Scooter zeigt auch die [Live-Karte von Duisburg](map:de:Duisburg).',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Duisburg?',
      answer: 'Bei Voi 1,80 €: 0,18 € pro Minute, Entsperren gratis (Stand November 2026); 20 Minuten kosten 3,60 €.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch Parks und am Rhein fahren?',
      answer: 'Nur auf Wegen, die Hinweisschilder als Fahrwege kennzeichnen. Auf Grün- und Erholungsflächen, in Wäldern und an Gewässern samt Ufern verbietet die Sicherheits- und Ordnungsverordnung der Stadt, Wege sonst mit Fahrzeugen zu befahren; ohne Schild schiebst du.',
    },
    {
      question: 'Warum kann ich meine Fahrt auf der Königstrasse oder am Innenhafen nicht beenden?',
      answer: 'Weil Voi dort die Rückgabe sperrt, im grössten Teil der Fussgängerzone der Innenstadt, am Innenhafen und im Rheinpark (Stand November 2026). Die Stadt selbst verbietet das Abstellen dort nicht; die anderen Anbieter zeigen ihre Sperrbereiche in der App. Schieb den Scooter hinaus und beende die Fahrt dort, sonst läuft die Miete weiter.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Bahn der DVG mitnehmen?',
      answer: 'Laut ADAC nicht: Seit dem 1. März 2024 sind E-Scooter in allen Bussen und Bahnen der DVG verboten (Stand November 2025). In S-Bahn und Regionalzug darf ein zusammengeklappter Scooter laut VRR als Handgepäck mit, sofern das Verkehrsunternehmen ihn nicht ausschliesst; in den Fernzügen der Deutschen Bahn fährt er zusammengeklappt kostenlos mit.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter von Duisburg nach Oberhausen fahren?',
      answer: 'Mit Voi ja: Duisburg und Oberhausen bilden ein gemeinsames Voi-Gebiet, du fährst etwa von Meiderich bis zum Centro (Stand November 2026). Bei den anderen Anbietern zeigt die App, wo die Fahrt enden darf.',
    },
    {
      question: 'Wo kann ich in Duisburg einen Leih-Scooter abstellen?',
      answer: 'Laut Stadt wie ein Fahrrad so gut wie überall, solange er niemanden behindert oder gefährdet. Feste Parkzonen der Stadt gibt es nicht; wo ein Anbieter die Rückgabe sperrt, zeigt seine App.',
    },
  ],
  sources: [
    { title: 'Stadt Duisburg: E-Scooter-Verleih in Duisburg (Stand November 2026)', url: 'https://www.duisburg.de/microsites/pbv/verkehr/e-scooter/e-scooter-spin' },
    { title: 'Stadt Duisburg, Rat: Antrag 26-0978 zur Sondernutzungssatzung (2. Juli 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20139411' },
    { title: 'Stadt Duisburg, Ausschuss für Stadtentwicklung und Verkehr: Niederschrift vom 2. Oktober 2025 (PDF)', url: 'https://sessionnet.owl-it.de/duisburg/bi/getfile.asp?id=1768508&type=do' },
    { title: 'Stadt Duisburg, BV Meiderich/Beeck: Antrag 26-0725 (11. Juni 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20138166' },
    { title: 'Stadt Duisburg, BV Hamborn: Antrag 26-1154 (3. September 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20139607' },
    { title: 'Stadt Duisburg, BV Walsum: Antrag 26-1259 (3. September 2026)', url: 'https://sessionnet.owl-it.de/duisburg/bi/vo0050.asp?__kvonr=20140712' },
    { title: 'Voi: Start in Duisburg und Oberhausen (31. Juli 2025, PDF)', url: 'https://storage.mfn.se/56928c26-f54c-49bf-9449-ddd1b655915f/e-scooter-anbieter-voi-startet-in-duisburg-und-oberhausen.pdf' },
    { title: 'Voi: Tarif und Zonen für Duisburg und Oberhausen in den offenen Daten (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/383/netex.xml' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Ryde: Standorte', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Nutzungsbedingungen Deutschland', url: 'https://www.ryde-technology.com/terms-conditions-germany' },
    { title: 'Stadt Duisburg: Sicherheits- und Ordnungsverordnung (PDF)', url: 'https://www.duisburg.de/rathaus/rathausundpolitik/ortsrecht/Sicherheits_und_Ordnungsverordnung.pdf' },
    { title: 'Zoo Duisburg: Zooordnung', url: 'https://zoo-duisburg.de/zooordnung' },
    { title: 'ADAC: Mitnahmeverbot im Nahverkehr (Stand November 2025)', url: 'https://www.adac.de/news/verkehr-e-scooter-mitnahmeverbot-nahverkehr/' },
    { title: 'DVG: Mobilitätsgarantie NRW', url: 'https://www.dvg-duisburg.de/kundenservice/fahrgastrechte-und-garantien/mobilitaetsgarantie-nrw' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Landschaftspark Duisburg-Nord: Häufig gestellte Fragen', url: 'https://www.landschaftspark.de/haufig-gestellte-fragen/haufig-gestellte-fragen/' },
  ],
};

export default guide;
