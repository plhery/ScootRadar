import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-bochum',
  topic: 'bochum',
  name: 'E-Scooter Bochum: Anbieter, Preise, Parken',
  title: 'E-Scooter Bochum 2026: Anbieter, Preise, Parkverbote',
  description: 'E-Scooter Bochum: Voi, Dott, Bolt, Lime und Ryde, was eine Fahrt kostet, wo du in City und Stadtpark nicht fährst oder parkst und was bei der BOGESTRA gilt.',
  headline: 'E-Scooter Bochum: Anbieter, Preise, Parkverbote und was bei BOGESTRA und VRR gilt',
  lede: 'Einen E-Scooter in Bochum leihst du ab 18 und ohne Führerschein bei Voi, Dott, Bolt, Lime oder Ryde. Dott verlangt laut seinem Datenfeed 1 € fürs Entsperren und 0,29 € pro Minute, zehn Minuten kosten also 3,90 € (Stand 26. Oktober 2026); die anderen zeigen ihren vollen Preis in der App. In der Fussgängerzone der City fährst du nicht, in Parks laut Stadt nur auf ausgeschilderten Radwegen, und im Kern der Innenstadt markiert Voi Parkverbotszonen. In Bussen und Bahnen der BOGESTRA sind E-Scooter laut ADAC seit dem 1. April 2024 verboten.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Bochum',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Bochum?',
      blocks: [
        'Fünf Anbieter vermieten im Oktober 2026 E-Scooter in Bochum: **Voi**, **Dott** (früher Tier), **Bolt**, **Lime** und **Ryde** aus Norwegen. Dott und Bolt führen Bochum auf ihren Websites (Stand 26. Oktober 2026), Voi veröffentlicht seine Daten über NRW.Mobidrom, das Mobilitätsdatenportal des Landes. Ryde startete laut Radio Bochum am 1. Juni 2026, nach eigenen Angaben mit rund 900 Scootern.',
        'Wie das Mieten in der App geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Auf der [Karte von Bochum](map:de:Bochum) zeigt ScootRadar Dott und Voi, seit dem 25. Oktober 2026 auch Bolt und Lime, jeweils mit Standort und Akkustand. In der Nacht auf Montag, 26. Oktober, standen um 4:24 Uhr in Bochum rund 220 Dott-, 320 Voi- und 310 Bolt-Scooter. Lime ist eine eigene Zählung: rund 520 Scooter, abgeschlossen am Sonntag, 25. Oktober, um 8:54 Uhr. Das sind Momentaufnahmen, keine Flottengrössen.',
        'Ryde findest du nur in seiner App. Leihräder zeigt die Karte nicht, auch nicht die des metropolradruhr, das laut Regionalverband Ruhr seit dem 1. April 2026 Donkey Republic betreibt.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Bochum?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Bochum (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott (Datenfeed, 26. Oktober 2026)', '1,00 €', '0,29 €', '3,90 €', '6,80 €'],
              ['Voi (Datenfeed, 26. Oktober 2026)', 'in der App', '0,18 €', '1,80 € für die Minuten', '3,60 € für die Minuten'],
              ['Bolt', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Ryde', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Vois Datenfeed gibt 0,18 € pro Minute an, den vollen Preis zeigt dir die App. Verbindlich ist bei allen Anbietern, was die App vor dem Entsperren anzeigt.',
        'Teuer wird Falschparken. Bolt verlangt laut seinen Bedingungen (seit 2023, auch ab 1. Dezember 2026) 15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist, und bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs. Dott berechnet laut seinen Bedingungen vom September 2025 bis zu 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst, und 50 € Verwaltungsgebühr, wenn er ein Bussgeld für dich zahlt.',
      ],
    },
    {
      heading: 'E-Scooter in Bochum parken: City, Hauptbahnhof, Stadtpark',
      blocks: [
        'Seit 2019 gibt die Stadt den Anbietern Anforderungen vor. Auf dem Gehweg gilt: «Eine nutzbare Restgehwegbreite von mindestens 2,0 m muss eingehalten werden.» Radwege, Rettungswege, Einfahrten und Wartebereiche von Bus und Bahn bleiben frei; beim Verteilen stellt ein Anbieter höchstens vier Scooter an einen Standort. In Parks, Grünanlagen und Wäldern und wo viele Menschen zu Fuss gehen, darf die Miete nicht enden. Wo nicht abgestellt werden soll, legen die Anbieter «in Abstimmung mit der Stadt» fest; eine Liste haben wir nicht gefunden.',
        'Feste Abstellflächen gibt es bisher nicht. Laut Radio Bochum beschloss der Rat im Februar 2026, das Abstellen stärker zu regeln, etwa nach dem Vorbild von [Essen](guide:essen); im September 2026 berichtete der Sender, die Stadt wolle feste Flächen schrittweise einführen.',
        'Die Parkverbotszonen von Voi und Dott stehen in ihren Datenfeeds (Stand 26. Oktober 2026). Es sind Zonen der Anbieter, keine Vorschriften der Stadt:',
        {
          list: [
            '**City und Hauptbahnhof:** Voi markiert den Kern der Innenstadt als Parkverbotszone: grosse Teile der Kortumstrasse, Hue- und Massenbergstrasse, Dr.-Ruer-Platz, Husemannplatz und den Kurt-Schumacher-Platz vor dem Hauptbahnhof, dazu den Konrad-Adenauer-Platz mit Brüder- und Kreuzstrasse. Darin führt Voi sechs feste Abstellpunkte, die dir die App zeigt. Dotts Feed markiert in der City kein Parkverbot.',
            '**Stadtpark:** Voi und Dott sperren das Abstellen im Park zwischen Berg- und Klinikstrasse; bei Dott ist es die grösste von rund 150 Parkverbotszonen.',
            '**Westpark:** An der Jahrhunderthalle markiert Voi eine Parkverbotszone.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone, und die Miete läuft weiter. Fahr ein Stück weiter: Die App zeigt, wo du abstellen darfst, bei Bolt, Lime und Ryde nur sie.',
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
        'In Bochum gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'E-Scooter in Bus und Bahn: Was bei BOGESTRA, VRR und DB gilt',
      blocks: [
        'Laut ADAC (November 2025) gilt bei der BOGESTRA seit dem 1. April 2024 ein Mitnahmeverbot für E-Scooter in Bussen und Bahnen. Das Unternehmen begründete es laut halloherne (März 2024) mit der Brandgefahr der Akkus; eine Ausnahme für zusammengeklappte Scooter nennt der Bericht nicht. Auf ihrer eigenen Website nennt die BOGESTRA das Verbot nicht (Stand 26. Oktober 2026).',
        'Im VRR-Tarif zählt ein «vollständig im kleinstmöglichen Packmass» zusammengeklappter E-Scooter als Handgepäck, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen, auch zusammengeklappt (Tarifhandbuch, Stand 1. Juli 2026). In den Fernzügen der Deutschen Bahn fährt er zusammengeklappt kostenlos als Handgepäck mit; den Akku darfst du unterwegs weder herausnehmen noch laden.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand Oktober 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Ruhrstadion, Ruhr-Uni, Bochum Total: Tipps für Bochum',
      blocks: [
        '**VfL-Heimspiele im Ruhrstadion:** Rund ums Stadion an der Castroper Strasse 145 markiert Voi eine Parkverbotszone. Die Stadionadresse liegt laut Feed knapp ausserhalb von Dotts Gebiet; in der Nähe führt Dott die Station «Parking Zone Stadion». Bequemer ist die Strassenbahn: Die Linien 308 und 316 fahren laut VfL in drei Minuten vom Hauptbahnhof zur Haltestelle Ruhrstadion, und mit der Eintrittskarte fährst du im ganzen VRR kostenlos.',
        '**Ruhr-Universität:** Ob die Uni auf dem Campus eigene Regeln für Leih-Scooter hat, konnten wir nicht prüfen.',
        '**Hochschule Bochum:** Ihre Hausordnung vom 18. September 2014 verbietet, Roller und Fahrräder «in den Hochschulgebäuden» zu benutzen. Eine Regel für Leih-Scooter auf dem Gelände haben wir nicht gefunden (Stand 26. Oktober 2026).',
        '**Bochum Total:** Im Juli 2026 lief das Festival laut Stadt zum letzten Mal im Bermuda3Eck: «2027 steigt das Festival im Westpark, rund um die altehrwürdige Jahrhunderthalle». Dort markiert Voi schon heute eine Parkverbotszone.',
        '**Nachts:** Eine nächtliche Sperrzeit oder Winterpause nennen weder die Stadt noch die Datenfeeds von Voi und Dott.',
      ],
    },
    {
      heading: 'Herne, Witten, Gelsenkirchen: E-Scooter in den Nachbarstädten',
      blocks: [
        'Vois Bochumer Gebiet reicht laut Datenfeed bis nach Herne und Witten.',
        {
          list: [
            '**Herne:** Auf der [Karte von Herne](map:de:Herne) standen am 26. Oktober um 4:24 Uhr rund 250 Voi- und 240 Dott-Scooter; Dott führt Herne auch auf seiner Website. Lime (eigene Zählung): rund 170 Scooter am 25. Oktober, 12:01 Uhr.',
            '**Witten:** Auf der [Karte von Witten](map:de:Witten) waren es zur selben Zeit rund 70 Voi-Scooter. Lime (eigene Zählung): 135 Scooter am 25. Oktober, 14:10 Uhr.',
            '**Gelsenkirchen:** Leih-Scooter gibt es dort laut ADAC nicht (Stand November 2025), und auch die Karte zeigte am 26. Oktober keine.',
          ],
        },
      ],
    },
    {
      heading: 'Was die Stadt Bochum für Leih-Scooter regelt',
      blocks: [
        'Leih-Scooter auf öffentlichen Strassen sind in Bochum eine Sondernutzung nach dem Strassen- und Wegegesetz NRW: Die Anbieter brauchen eine Erlaubnis der Stadt und zahlen laut Gebührentarif der Sondernutzungssatzung (Fassung vom 23. Januar 2025) für die «Gewerbliche Nutzung von E-Scootern» 3,86 € pro Scooter und Monat. Eine Obergrenze für die Zahl der Scooter fanden wir dort nicht.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Bochum nutzen?',
      answer: 'Die von Voi, Dott, Bolt, Lime und Ryde (Stand Oktober 2026). Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Voi-, Dott-, Bolt- und Lime-Scooter zeigt auch die [Live-Karte von Bochum](map:de:Bochum), die von Ryde nur dessen App.',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Bochum?',
      answer: 'Bei Dott 3,90 €: 1 € fürs Entsperren plus 0,29 € pro Minute, laut seinem Datenfeed vom 26. Oktober 2026. Vois Feed nennt 0,18 € pro Minute, also 1,80 € für die zehn Minuten; den vollen Preis zeigt die App, wie bei Bolt, Lime und Ryde.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Bochumer City nicht beenden?',
      answer: 'Voi markiert den Kern der Innenstadt mit Kortumstrasse und Kurt-Schumacher-Platz sowie den Konrad-Adenauer-Platz als Parkverbotszonen und führt dort nur einige feste Abstellpunkte (Stand 26. Oktober 2026). Fahr ein Stück weiter; die App zeigt, wo du abstellen darfst.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Bahn der BOGESTRA mitnehmen?',
      answer: 'Nein. Laut ADAC schliesst die BOGESTRA E-Scooter seit dem 1. April 2024 aus Bussen und Bahnen aus; eine Ausnahme für zusammengeklappte nennt halloherne nicht. Sonst zählt im VRR ein vollständig zusammengeklappter E-Scooter als Handgepäck, doch jedes Verkehrsunternehmen darf ihn ausschliessen.',
    },
    {
      question: 'Darf ich im Stadtpark mit dem E-Scooter fahren?',
      answer: 'Laut den Vorgaben der Stadt für die Anbieter (2019) nur auf Wegen mit blauem Radwegschild. Die Sicherheitsverordnung verbietet, Grünanlagen zu befahren, ausser beim Radfahren auf gekennzeichneten Wegen (bis 1000 € Bussgeld); dass das auch für E-Scooter gilt, ist unsere Lesart. Abstellen kannst du im Stadtpark weder bei Voi noch bei Dott.',
    },
    {
      question: 'Komme ich mit dem Leih-Scooter zum Ruhrstadion?',
      answer: 'Bis in die Nähe: Ums Stadion markiert Voi eine Parkverbotszone, und die Stadionadresse liegt knapp ausserhalb von Dotts Gebiet; nahebei hat Dott die Station «Parking Zone Stadion». Einfacher ist die Strassenbahn 308 oder 316 ab Hauptbahnhof, mit der VfL-Eintrittskarte gratis.',
    },
  ],
  sources: [
    { title: 'Stadt Bochum: E-Scooter (2019)', url: 'https://www.bochum.de/E-Scooter' },
    { title: 'Stadt Bochum: Anforderungen und Empfehlungen für Anbieter stationsloser E-Tretroller-Verleiher (25. September 2019, PDF)', url: 'https://www.bochum.de/C125830C0042AB74/vwContentByKey/W2BJ2E2S298BOCMDE/$File/Anlage%202_Anforderungen_E_Tretroller_Verleiher_2.pdf' },
    { title: 'Stadt Bochum: Sondernutzungssatzung mit Gebührentarif (8. Änderung vom 23. Januar 2025, PDF)', url: 'https://www.bochum.de/C125830C0042AB74/vwContentByKey/N26R26U3212HGILDE/$File/sondernutzungs_satzung.pdf' },
    { title: 'Stadt Bochum: Bochumer Sicherheitsverordnung mit Lageplänen (Fassung vom 20. Mai 2026, PDF)', url: 'https://www.bochum.de/C125830C0042AB74/vwContentByKey/N26R26QP189HGILDE/$File/bosvo.pdf' },
    { title: 'Stadt Bochum: Bochum Total feiert Abschied vom Bermuda3Eck (4. Juli 2026)', url: 'https://www.bochum.de/Pressemeldungen/4-Juli-2026/Bochum-Total-feiert-Abschied-vom-Bermuda3Eck' },
    { title: 'Geobasis NRW: Gebäudereferenzen NW, amtliche Adressen (open.nrw)', url: 'https://open.nrw/dataset/172a0ba8-d470-47c1-ac89-b85f8190ac7e' },
    { title: 'Radio Bochum: Bochum plant neues Konzept für E-Scooter (6. Februar 2026)', url: 'https://www.radiobochum.de/artikel/bochum-plant-neues-konzept-fuer-e-scooter-2566496' },
    { title: 'Radio Bochum: Neuer E-Scooter-Anbieter in Bochum gestartet (16. Juni 2026)', url: 'https://www.radiobochum.de/artikel/neuer-e-scooter-anbieter-in-bochum-gestartet-2670400' },
    { title: 'Radio Bochum: Bochum plant feste Abstellflächen für E-Scooter (29. September 2026)', url: 'https://www.radiobochum.de/artikel/bochum-plant-feste-abstellflaechen-fuer-e-scooter-2765660' },
    { title: 'halloherne.de: Bogestra verbannt E-Scooter aus Bus und Bahn (18. März 2024)', url: 'https://www.halloherne.de/artikel/bogestra-verbannt-e-scooter-aus-bus-und-bahn-67418' },
    { title: 'ADAC: E-Scooter im Nahverkehr, wo die Mitnahme verboten ist (17. November 2025)', url: 'https://www.adac.de/news/verkehr-e-scooter-mitnahmeverbot-nahverkehr/' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Deutsche Bahn: Bochum Hbf (bahnhof.de)', url: 'https://www.bahnhof.de/bochum-hbf' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'VfL Bochum 1848: Anreise und Parken', url: 'https://www.vfl-bochum.de/stadion/anreise-parken/' },
    { title: 'Hochschule Bochum: Hausordnung (18. September 2014, PDF)', url: 'https://www.hochschule-bochum.de/fileadmin/public/Die-BO_Hochschule/Hochschulrecht/190_Hausordnung.pdf' },
    { title: 'Regionalverband Ruhr: Neuer Betriebspartner für das Metropolradruhr (18. Dezember 2025)', url: 'https://www.rvr.ruhr/news/startseite-news/news/metropolradruhr-neuer-betriebspartner-des-fahrradverleihsystems-steht-fest/' },
    { title: 'Dott: offener Datenfeed für Bochum (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/bochum/gbfs.json' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Bolt in Bochum', url: 'https://bolt.eu/de-de/cities/bochum/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'NRW.Mobidrom: Mobilitätsdatenportal des Landes NRW, mit Vois Datenfeeds', url: 'https://www.mobilitaetsdaten.nrw' },
  ],
};

export default guide;
