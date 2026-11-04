import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-dortmund',
  topic: 'dortmund',
  name: 'E-Scooter Dortmund: Anbieter, Preise, Parken',
  title: 'E-Scooter Dortmund 2026: Anbieter, Preise, Parkzonen',
  description: 'E-Scooter Dortmund: fünf Anbieter, was Voi pro Minute kostet, wo du in der Innenstadt-West parkst und warum Scooter nicht in Bus und Stadtbahn von DSW21 dürfen.',
  headline: 'E-Scooter Dortmund: Anbieter, Preise, Parkzonen, Sperrzonen und was bei DSW21 gilt',
  lede: 'Einen E-Scooter in Dortmund leihst du ohne Führerschein bei Voi, Dott, Bolt, Lime oder Ryde; Dott, Bolt und Ryde vermieten ab 18. Voi verlangt in Dortmund 0,18 € pro Minute und nichts fürs Entsperren, zehn Minuten kosten also 1,80 € (Stand November 2026); bei den anderen zeigt die App den Preis. In der Innenstadt-West leihst du seit dem 1. Oktober 2026 nur noch auf einer der 86 markierten Parkzonen aus und gibst dort auch zurück. In Bussen und Stadtbahnen von DSW21 sind E-Scooter seit dem 1. März 2024 verboten.',
  published: '2026-10-24',
  updated: '2026-10-26',
  city: 'de:Dortmund',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Dortmund?',
      blocks: [
        'Fünf Anbieter vermieten im Oktober 2026 E-Scooter in Dortmund: **Voi**, **Dott** (früher Tier), **Bolt**, **Lime** und **Ryde** aus Norwegen. Dott, Bolt und Ryde führen Dortmund auf ihren Websites (Stand November 2026); Ryde ist laut Radio Bochum spätestens seit Juni 2026 in der Stadt unterwegs. Lime führt NRW.Mobidrom, das Mobilitätsdatenportal des Landes, seit April 2026 als E-Scooter-Anbieter in Dortmund.',
        'Im Dezember 2023 zählte die Stadt bei Bolt, Voi, Lime und Tier zusammen 3650 Leih-Scooter; jeder wurde im Schnitt zwei- bis dreimal am Tag ausgeliehen.',
        'Gemietet wird in der App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz vor 16 Uhr zeigte die [Karte von Dortmund](map:de:Dortmund) rund 1400 Voi- und 360 Dott-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntagvormittag, 25. Oktober, rund 1800 Lime-Scooter nach der letzten Zählung.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Dortmund?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Dortmund (Stand November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
              ['Dott', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Bolt', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Ryde', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Bei Voi kostet eine Viertelstunde damit 2,70 €. Verbindlich ist immer der Preis, den die App vor dem Entsperren zeigt.',
        'Teuer kann das Abstellen werden. Bolt berechnet laut seinen Bedingungen (gültig ab 1. Dezember 2026) 15 €, wenn dein Foto am Ende der Fahrt nicht deutlich zeigt, dass der Scooter nach seinen Regeln steht, und bis zu 100 € Abholgebühr, wenn du ausserhalb des erlaubten Parkbereichs abstellst. Dott verlangt laut seinen Bedingungen (September 2025) bis zu 300 € für das Zurückholen, wenn du seine Park- und Sperranweisungen nicht befolgst, und 50 € Verwaltungsgebühr, wenn er ein Bussgeld für dich zahlt.',
      ],
    },
    {
      heading: 'E-Scooter in Dortmund parken: Parkzonen in der Innenstadt-West',
      blocks: [
        'Seit dem 1. Oktober 2026 ist der ganze Stadtbezirk Innenstadt-West ausser Dorstfeld eine Abstellverbotszone für Leih-Scooter. Ausleihen und zurückgeben kannst du dort nur noch auf einer der 86 markierten Parkzonen. Sie liegen meist höchstens 300 m auseinander und nahe an wichtigen Haltestellen von Bus und Bahn. Ausserhalb verweigern die Apps die Rückgabe, so die Stadt am 28. September 2026. Zum Bezirk gehören die City innerhalb des Wallrings, das Kreuzviertel, das Dortmunder U, die Westfalenhallen und der Signal Iduna Park.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in der Verbotszone, und die Miete läuft weiter. Fahr zur nächsten Parkzone; die App zeigt sie dir.',
        },
        'Am Hauptbahnhof gilt das schon seit dem 1. Juli 2026. Südlich davon stehen drei Parkzonen: am Westende des Mitarbeiterparkplatzes am Deutschen Fussballmuseum (Königswall 42, gegenüber der Bahnhofstrasse), neben der Katharinentreppe und am Stadtbahn-Zugang am Ausgang Burgtor. Auf der Nordseite stellst du laut Stadt (Juli 2026) direkt gegenüber dem Eingang oder auf dem Platz von Xi’an vor dem Cinestar ab.',
        'Die Bezirke Innenstadt-Ost und Innenstadt-Nord sollen folgen. Ausserhalb der Innenstadt-West darfst du frei abstellen, aber nicht überall. Stadtweit sind laut den Auflagen der Stadt für die Anbieter (Stand September 2026) tabu:',
        {
          list: [
            'das Umfeld des Hauptbahnhofs und der Phoenix-See;',
            'Fussgängerzonen;',
            'Feuerwehr- und Rettungsflächen;',
            'Wartebereiche an Haltestellen;',
            'Grünanlagen und Wälder;',
            'Radwege und Zufahrten.',
          ],
        },
        'Auf dem Gehweg müssen mindestens 2 m frei bleiben. Auch Friedhöfe und das Umfeld des Stadions nannte die Stadt 2023 als Abstellverbotszonen.',
        'Die Parkzonen gelten nur für Leih-Scooter. Einen eigenen E-Scooter stellst du laut Stadt (Juni 2026) nach denselben Regeln ab wie ein Fahrrad.',
        'Für falsch abgestellte Leih-Scooter verlangt das Ordnungsamt laut Stadt (Dezember 2023) 20 €, wenn sie behindern, und 30 €, wenn sie gefährden. Das Knöllchen geht an den Anbieter, der es an dich weitergeben darf.',
      ],
    },
    {
      heading: 'Wo darf man in Dortmund mit dem E-Scooter fahren? Sperrzonen',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch mit ausgeschaltetem Motor, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Auf Westenhellweg und Ostenhellweg steigst du also ab und schiebst.',
        'Voi sperrt dort nur das Abstellen, nicht das Fahren (Stand November 2026); das Fahrverbot der Fussgängerzone gilt trotzdem.',
        'Dazu kommen die Regeln von Parks und Anbietern:',
        {
          list: [
            '**Westfalenpark:** Die Besuchsordnung der Stadt (Stand Oktober 2024) verbietet, Roller und Scooter zu nutzen oder auch nur mitzuführen. Bei Voi ist der Park eine Abstellverbotszone.',
            '**Botanischer Garten Rombergpark:** In ihren Verhaltensregeln bittet die Stadt, auf Zweiräder und ähnliche Fortbewegungsmittel zu verzichten; Radfahren ist dort nicht gestattet.',
            '**Phoenix-See:** Am See gilt laut Stadt ein Abstellverbot. Bei Voi umfasst die Abstellverbotszone See und Ufer bis zur Hörder Burg; beende die Fahrt ausserhalb.',
            '**Ausserhalb des Voi-Gebiets:** Rombergpark mit Zoo, Fredenbaumpark und Hauptfriedhof (Stand November 2026).',
          ],
        },
        'Wo Dott, Bolt, Lime und Ryde das Fahren oder Parken sperren, zeigt dir ihre App.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Dortmund: Bussgelder und Alkohol',
      blocks: [
        'In Dortmund gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter bei Dott, Bolt und Ryde ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'E-Scooter in Bus und Bahn: Was bei DSW21, VRR und DB gilt',
      blocks: [
        'Seit dem 1. März 2024 nimmt DSW21 in allen Bussen und Stadtbahnen in Dortmund keine E-Scooter mehr mit. Grund ist die Brandgefahr der Akkus. Wer trotzdem einen dabeihat, «wird des Fahrzeuges verwiesen». Eine Ausnahme für zusammengeklappte Scooter nennt DSW21 nicht; die H-Bahn an der TU kommt im Verbot nicht vor. Pedelecs und E-Rollstühle sind nicht betroffen.',
        'In S-Bahn und Regionalzug zählt dein Scooter laut VRR als Handgepäck, wenn er «vollständig im kleinstmöglichen Packmass» zusammengeklappt ist, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen, auch zusammengeklappt (Tarifhandbuch, Stand 1. Juli 2026). In den Fernzügen der Deutschen Bahn fährt er zusammengeklappt kostenlos als Handgepäck mit; den Akku darfst du unterwegs weder herausnehmen noch laden. Am Hauptbahnhof heisst das: Leih-Scooter auf einer Parkzone abstellen, den eigenen zusammenklappen und damit höchstens in den Zug, nicht in die Stadtbahn.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen E-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €, gegen dein Ticket und den Beleg des Anbieters (Stand Oktober 2026). Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Stadion, Westfalenhallen, TU: Tipps für Dortmund',
      blocks: [
        '**Signal Iduna Park:** Mit Leih-Scootern kommst du nicht direkt ans Stadion: «Rund um den Signal Iduna Park ist eine Sperrzone eingerichtet», schreibt die Stadt (August 2026), ohne zu sagen, ob sie das Fahren oder das Abstellen betrifft. Das Stadion liegt in der Innenstadt-West, zurückgeben kannst du also nur auf einer Parkzone; die nächste von Voi liegt rund 500 m entfernt (Stand November 2026). Den eigenen Scooter stellst du an einer der vier Fahrradwachen des ADFC ab, mit zusammen 1000 Plätzen: an der Strobelallee Ecke Rabenloh, gegenüber der Helmut-Körnig-Halle, neben den Rosenterrassen oder am Bolmker Weg Ecke Schwimmweg. Sie öffnen rund 100 Minuten vor Anpfiff und schliessen spätestens 60 Minuten nach Abpfiff.',
        '**Mit der Stadtbahn zum Spiel:** An Heimspieltagen fährt die U45 laut DSW21 ab rund 3 Stunden vor Anpfiff mindestens alle 5 Minuten vom Hauptbahnhof zum Stadion. Deine BVB-Eintrittskarte gilt am Spieltag als KombiTicket für Hin- und Rückfahrt mit Bus, Bahn und Nahverkehrszug in ganz NRW.',
        '**Westfalenhallen, Dortmunder U, Fussballmuseum:** Alle drei liegen in der Innenstadt-West; du gibst den Leih-Scooter also auf einer Parkzone zurück. Für das Fussballmuseum liegt die Zone am Königswall 42 direkt daneben.',
        '**TU und Fachhochschule:** Campus Nord, Campus Süd, die Fachhochschule an der Emil-Figge-Strasse und die S-Bahn-Station Dortmund Universität liegen in Vois Gebiet (Stand November 2026). Auf dem Campus Nord sperrt Voi das Abstellen rund um die Gebäude der Elektrotechnik und des Bio- und Chemieingenieurwesens, und das Sportinstitut liegt ausserhalb des Gebiets. Sonst stellst du frei ab, solange 2 m Gehweg frei bleiben.',
        '**Nachbarstädte:** Wie es nebenan läuft, steht in [E-Scooter in Bochum](guide:bochum) und für den Westen des Ruhrgebiets in [E-Scooter in Essen](guide:essen).',
      ],
    },
    {
      heading: 'Was die Stadt Dortmund für Leih-Scooter regelt',
      blocks: [
        'Seit einem Beschluss des Oberverwaltungsgerichts Münster vom November 2020 zu Leihrädern behandelt Dortmund das Aufstellen von Leih-Scootern als Sondernutzung der Strasse. Die Stadt erteilt den Anbietern dafür eine Sondernutzungserlaubnis mit Auflagen und schliesst mit ihnen eine Kooperationsvereinbarung; das hat der Rat am 31. März 2022 beschlossen. Die Auflagen enthalten die Abstellverbote. Seit dem 1. Januar 2024 kostet die Erlaubnis laut Sondernutzungssatzung der Stadt 5 € pro Scooter und Monat, statt bisher 50 € im Jahr.',
        'Das Mobilitätskonzept erlaubt jedem Anbieter höchstens 300 Scooter in den drei Innenstadtbezirken und sieht dort Ausleihe und Rückgabe nur an Parkzonen vor (Stand September 2026). In den äusseren Stadtbezirken gibt es laut Ratsvorlage von 2022 keine Obergrenze; am Ende jeder Fahrt sollen die Anbieter ein Foto des abgestellten Scooters verlangen.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Dortmund',
      blocks: [
        {
          list: [
            '**Der See war der Test:** Am Phoenix-See probierte die Stadt 2021 erstmals aus, Leih-Scooter nur in festen Zonen abstellen zu lassen. Nach dem Erfolg dort folgten der Hauptbahnhof und die Innenstadt-West.',
            '**Erste ihrer Art:** Die H-Bahn auf dem Campus der TU fährt seit dem 2. Mai 1984 vollautomatisch und gilt laut DSW21 als erste Anlage ihrer Art in Deutschland. Sie befördert bis zu 8000 Fahrgäste am Tag.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Dortmund nutzen?',
      answer: 'Die von Voi, Dott, Bolt, Lime und Ryde (Stand Oktober 2026). Einen Führerschein brauchst du nicht; Dott, Bolt und Ryde vermieten ab 18, bei Voi und Lime zeigt dir die App das Mindestalter. Freie Scooter zeigt auch die [Live-Karte von Dortmund](map:de:Dortmund).',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Dortmund?',
      answer: 'Bei Voi 1,80 €: 0,18 € pro Minute, Entsperren gratis (Stand November 2026). Bei Dott, Bolt, Lime und Ryde zeigt dir die App den Preis.',
    },
    {
      question: 'Wo darf ich in Dortmund nicht mit dem E-Scooter fahren?',
      answer: 'Nicht auf Gehwegen und in Fussgängerzonen wie Westen- und Ostenhellweg, ausser ein Zusatzschild «Elektrokleinstfahrzeuge frei» erlaubt es. Im Westfalenpark verbietet die Besuchsordnung der Stadt, Roller und Scooter zu nutzen oder mitzuführen.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Dortmunder City nicht beenden?',
      answer: 'Seit dem 1. Oktober 2026 ist die ganze Innenstadt-West ausser Dorstfeld eine Abstellverbotszone. Du gibst den Leih-Scooter nur auf einer der 86 markierten Parkzonen zurück, sonst läuft die Miete weiter. Die nächste Zone zeigt dir die App.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus oder Stadtbahn mitnehmen?',
      answer: 'Nicht bei DSW21: Seit dem 1. März 2024 sind E-Scooter in allen Bussen und Stadtbahnen in Dortmund verboten, eine Ausnahme für zusammengeklappte nennt DSW21 nicht. In S-Bahn und Regionalzug darf ein zusammengeklappter Scooter laut VRR als Handgepäck mit, sofern das Verkehrsunternehmen ihn nicht per Hausrecht ausschliesst, und in den Fernzügen der Bahn fährt er zusammengeklappt kostenlos mit.',
    },
    {
      question: 'Komme ich mit dem Leih-Scooter zum BVB-Stadion?',
      answer: 'Nicht direkt: Rund um den Signal Iduna Park ist laut Stadt eine Sperrzone für Leih-Scooter eingerichtet, und das Stadion liegt in der Innenstadt-West, wo du nur auf einer Parkzone zurückgibst. Beende die Fahrt dort und geh das letzte Stück, oder nimm die U45 ab Hauptbahnhof.',
    },
  ],
  sources: [
    { title: 'Stadt Dortmund: Abstellzonen für Leih-Scooter in der westlichen Innenstadt (28. September 2026)', url: 'https://www.dortmund.de/newsroom/presse-mitteilungen/was-sich-im-bahnhofsumfeld-bewaehrt-hat-wird-auf-die-westliche-innenstadt-ausgedehnt-abstellzonen-fuer-leih-scooter.html' },
    { title: 'Stadt Dortmund: Ausleihe und Abgabe nur hier, neue Zonen für E-Scooter (Oktober 2026)', url: 'https://www.dortmund.de/newsroom/nachrichten-dortmund.de/ausleihe-und-abgabe-nur-hier-neue-zonen-fuer-e-scooter.html' },
    { title: 'Stadt Dortmund: Gegen Leih-Scooter-Chaos, neue Parkzonen und Abstellverbote (Juli 2026)', url: 'https://www.dortmund.de/newsroom/nachrichten-dortmund.de/gegen-leih-scooter-chaos-neue-parkzonen-und-abstellverbote.html' },
    { title: 'Stadt Dortmund: Parkplätze für E-Scooter in der Innenstadt-West eingerichtet (24. Juni 2026)', url: 'https://www.dortmund.de/newsroom/nachrichten-dortmund.de/parkplaetze-fuer-e-scooter-in-der-innenstadt-west-eingerichtet.html' },
    { title: 'Stadt Dortmund: Ordnungsamt schreibt künftig Knöllchen für falschgeparkte E-Scooter (7. Dezember 2023)', url: 'https://www.dortmund.de/newsroom/nachrichten-dortmund.de/ordnungsamt-schreibt-kuenftig-knoellchen-fuer-falschgeparkte-e-scooter.html' },
    { title: 'Stadt Dortmund, Vorlage 23331-22: E-Roller als Teil des Mobilitätskonzeptes (März 2022, PDF)', url: 'https://rathaus.dortmund.de/dosys/gremrech.nsf/0/343D9EF333B05EFEC12587F9004F0534/$FILE/VorlageVG%2323331-22.doc.pdf' },
    { title: 'Stadt Dortmund: Sondernutzungssatzung mit Gebührentarif (Stand Dezember 2023, PDF)', url: 'https://www.dortmund.de/dortmund/projekte/rathaus/verwaltung/ordnungsamt/downloads/sondernutzung-und-veranstaltungsmanagement/satzung-ueber-erlaubnisse-und-gebuehren.pdf' },
    { title: 'Stadt Dortmund: Stadtbezirk Innenstadt-West', url: 'https://www.dortmund.de/themen/stadtbezirke/innenstadt-west/index-2.html' },
    { title: 'Stadt Dortmund: BVB startet in die Saison, Anreise zum Veranstaltungszentrum (25. August 2026)', url: 'https://www.dortmund.de/newsroom/presse-mitteilungen/super-tag-am-veranstaltungszentrum-der-bvb-startet-in-die-saison-der-westfalenpark-leuchtet.html' },
    { title: 'Stadt Dortmund: Besuchsordnung Westfalenpark (Stand Oktober 2024, PDF)', url: 'https://www.dortmund.de/dortmund/projekte/dortmund-erleben/westfalenpark/downloads/besuchsordnung-westfalenpark-stand-oktober-2024.pdf' },
    { title: 'Stadt Dortmund: Verhalten im Botanischen Garten Rombergpark (PDF)', url: 'https://www.dortmund.de/dortmund/projekte/dortmund-erleben/botanischer-garten-rombergpark/downloads/verhalten/de_verhalten-im-botanischen-garten-rombergpark.pdf' },
    { title: 'Stadt Dortmund: Botanischer Garten Rombergpark, Ihr Besuch', url: 'https://www.dortmund.de/themen/freizeit-und-kultur/parks-seen-und-zoo/botanischer-garten-rombergpark/ihr-besuch/' },
    { title: 'DSW21: Mitnahme-Verbot von E-Tretrollern in Bussen und Stadtbahnen ab 1. März 2024', url: 'https://www.bus-und-bahn.de/news-details/mitnahme-verbot-von-e-tretrollern-in-bussen-und-stadtbahnen-ab-1-maerz' },
    { title: 'DSW21: Häufige Fragen', url: 'https://www.bus-und-bahn.de/faq' },
    { title: 'DSW21: Mit Bus und Bahn zum BVB', url: 'https://www.bus-und-bahn.de/bvbfans' },
    { title: 'DSW21: H-Bahn', url: 'https://www.bus-und-bahn.de/h-bahn' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'NRW.Mobidrom: Mobilitätsdatenportal des Landes NRW', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'Radio Bochum: Neuer E-Scooter-Anbieter in Bochum gestartet (16. Juni 2026)', url: 'https://www.radiobochum.de/artikel/neuer-e-scooter-anbieter-in-bochum-gestartet-2670400' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Voi: Tarif und Zonen für Dortmund in den offenen Daten (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/186/netex.xml' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Bolt in Dortmund', url: 'https://bolt.eu/de-de/cities/dortmund/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Ryde: Standorte', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Nutzungsbedingungen Deutschland', url: 'https://www.ryde-technology.com/terms-conditions-germany' },
  ],
};

export default guide;
