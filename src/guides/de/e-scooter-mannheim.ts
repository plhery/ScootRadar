import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-mannheim',
  topic: 'mannheim',
  name: 'E-Scooter Mannheim: Anbieter, Preise, Parken',
  title: 'E-Scooter Mannheim 2026: Anbieter, Preise, Parken, rnv',
  description: 'E-Scooter Mannheim: Voi, Dott und Bolt, was zehn Minuten kosten, wo du an Hauptbahnhof und Wasserturm parkst und warum der Leih-Scooter nicht in die Bahn darf.',
  headline: 'E-Scooter Mannheim: Anbieter, Preise, feste Abstellflächen und Verbotszonen von den Quadraten bis Ludwigshafen',
  lede: 'Einen E-Scooter in Mannheim leihst du ab 18 und ohne Führerschein bei Voi, Dott oder Bolt, den drei Anbietern mit einer Erlaubnis der Stadt bis Ende 2026. Voi kostet 0,49 € fürs Entsperren und 0,22 € pro Minute, zehn Minuten also 2,69 € (Stand 17. Oktober 2026). Rund um Hauptbahnhof und Wasserturm stellst du nur auf markierten Flächen ab, auf Brücken, am Neckarufer und in Parks gar nicht. In Strassenbahn und Bus nimmst du nur einen kleinen, zusammengeklappten Scooter mit, keinen Leih-Scooter.',
  published: '2026-10-17',
  updated: '2026-10-24',
  city: 'de:Mannheim',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Mannheim?',
      blocks: [
        'Die Stadt hat zum 1. Januar 2025 drei Anbieter zugelassen: **Dott**, das früher TIER hiess, **Voi** und **Bolt**. Ihre Erlaubnisse laufen bis Ende 2026. Gemietet wird in der App des Anbieters, ab 18 und ohne Führerschein. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte rund um Mannheim](map:de:Mannheim) Voi und Dott. Der Kartenausschnitt reicht über den Rhein bis Ludwigshafen; am Samstag, 24. Oktober 2026, kurz vor 16 Uhr standen darin rund 650 Voi- und 780 Dott-Scooter, davon rund 500 Voi- und 650 Dott-Scooter auf der Mannheimer Seite. Das ist eine Momentaufnahme, keine Flottengrösse.',
        '**Bolt fehlt auf unserer Karte.** Bolt veröffentlicht in Deutschland nur für Karlsruhe, Stuttgart und Reutlingen/Tübingen einen offenen Datenfeed, führt Mannheim aber auf seiner Website. Wo seine Scooter stehen, siehst du nur in der Bolt-App.',
        '**Lime** gibt es in Mannheim nicht; die Stadt fehlt auf Limes Städteliste. Nebenan zeigt die [Karte von Heidelberg](map:de:Heidelberg) Dott und Voi.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Mannheim?',
      blocks: [
        'Nur Voi veröffentlicht seinen Mannheimer Tarif.',
        {
          table: {
            caption: 'E-Scooter-Preise in Mannheim (veröffentlichte Tarife, Stand 17. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,49 €', '0,22 €', '2,69 €', '4,89 €'],
              ['Dott', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Bolt', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde mit Voi kostet 3,79 €. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Günstiger ist **VRNnextbike**, das Leihrad im Verkehrsverbund Rhein-Neckar: 1 € pro 15 Minuten, höchstens 12 € am Tag. Im Monats-Abo für 10 € sind die ersten 30 Minuten jeder Fahrt inklusive. Das Rad gibst du an einer offiziellen Station zurück, sonst kostet es 20 €. Der Vertrag mit nextbike endet im Februar 2027; ab März 2027 soll das Nachfolgesystem «VRNrad» fahren.',
      ],
    },
    {
      heading: 'Wo darf man in Mannheim mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur, wo es keinen gibt, auf der Fahrbahn. Auf Gehwegen und in Fussgängerzonen fährst du nicht, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Der Ordnungsdienst der Stadt achtet bei seinen täglichen Kontrollen in der Innenstadt auch auf E-Scooter.',
        '**Die Quadrate:** In der Innenstadt tragen die Blöcke statt Strassennamen Buchstabe und Zahl, etwa A 1, N 2 oder O 7.',
        '**Planken und Breite Strasse:** Die beiden Einkaufsstrassen gehören zur Fussgängerzone Innenstadt, durch die auch die Strassenbahn fährt. Dort ist das Fahren mit E-Scootern laut Stadt verboten: Steig ab und schieb. Fahrräder dürfen dort laut Satzung der Stadt von 20 bis 8 Uhr und an Sonn- und Feiertagen fahren. Ab 1. März 2027 gilt ein Schild «Radverkehr frei» auch für E-Scooter, im Schritttempo.',
        '**Über den Rhein nach Ludwigshafen:** Voi führt Mannheim und Ludwigshafen in seinem Datenfeed als ein Gebiet. In Ludwigshafen stellst du Leih-Scooter laut Wochenblatt seit 1. Januar 2024 nur auf festgelegten Abstellflächen ab, die die App anzeigt. Stehst du nicht auf oder direkt an einer, lässt sich die Fahrt nicht beenden, und die Miete läuft weiter. Im Datenfeed von Voi sind es rund 190 Flächen (Stand 17. Oktober 2026). Die [Karte von Ludwigshafen](map:de:Ludwigshafen am Rhein) zeigte in derselben Nacht rund 150, Mannheims Rheinufer eingeschlossen.',
      ],
    },
    {
      heading: 'E-Scooter in Mannheim abstellen: feste Flächen, Verbotszonen, Foto',
      blocks: [
        'Am Ende jeder Fahrt fotografierst du den abgestellten Scooter: Ohne Foto lässt sich die Miete nicht beenden. So verlangt es die Stadt seit 2025.',
        'An zehn Orten hat die Stadt **feste Abstellflächen** eingerichtet; die neueren sind auf dem Boden markiert und mit Parkschild ausgeschildert. Im Umkreis von rund 200 m um jede Fläche darfst du Leih-Scooter nur dort abstellen und ausleihen:',
        {
          list: [
            'Seit Dezember 2023 die Mobilstationen **A 1** an der Bismarckstrasse, **E 4** an der Kunststrasse und **N 2** am Dalbergplatz.',
            'Seit Juni 2025 drei Flächen am **Hauptbahnhof** (Haupteingang, Stadtbahnsteig D, Tourist-Information), dazu Schlossgartenstrasse 1 am Intercity Hotel, der Lindenhofplatz, Tattersallstrasse 43 bei Kunsthalle und Parkhotel und **O 7** am Plankenkopf beim Wasserturm.',
          ],
        },
        {
          table: {
            caption: 'Abstellen an bekannten Orten (Stadtplan der Stadt Mannheim, Stand 17. Oktober 2026)',
            head: ['Ort', 'Was gilt'],
            rows: [
              ['Hauptbahnhof mit Willy-Brandt-Platz, Lindenhofplatz, Ehrenhof des Schlosses', 'Nur auf den markierten Flächen'],
              ['Wasserturm, Friedrichsplatz, Planken, Paradeplatz, Kapuzinerplanken', 'Verbotszone'],
              ['Breite Strasse vom Paradeplatz bis zur Kurpfalzbrücke, Marktplatz (G 1)', 'Verbotszone'],
              ['Kurpfalzbrücke, Konrad-Adenauer-, Kurt-Schumacher- und Ebertbrücke', 'Verbotszone'],
              ['Neckarufer an der Kurpfalzbrücke, Neckarvorland, Stephanienufer am Rhein, Waldpark', 'Verbotszone'],
              ['SAP Arena, Maimarktgelände, Spinelli-Park und Feudenheimer Au (BUGA 2023)', 'Verbotszone'],
            ],
          },
        },
        'Ausserhalb dieser Zonen beendest du die Fahrt am Ziel, aber nur unter den Auflagen der Stadt. Auf dem Gehweg müssen mindestens 1,60 m frei bleiben; ist er schmaler, stellst du dort gar nicht ab. Niemand darf behindert werden. Frei bleiben laut Leitlinie der Stadt ausserdem 10 m rund um Haltestellen, Brücken, Unterführungen, Radwege, Grünflächen und Parks, Ufer, Spielplätze, Zufahrten und Blindenleitsysteme. Alle Zonen zeigt der [Stadtplan der Stadt Mannheim](https://www.gis-mannheim.de/mannheim/index.php?lang=de&zl=28&x=462809&y=5482106&bl=stadtplan_grau&bo=1&lo=0.3,0.3,0.3,0.6,0.6,0.3,1&layers=ekf_zone1,ekf_zone2,ekf_zone3,ekf_pverbot,ekf_pverbot_tmp,ekf_pverbot_pmobils,ekf_station&service=mannheim), massgeblich ist die Karte in deiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder im 200-m-Umkreis einer festen Fläche, aber nicht auf ihr. Fahr aus der Zone hinaus oder zur nächsten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Mannheim: Bussgelder und Promille',
      blocks: [
        'In Mannheim gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Mit dem E-Scooter zur Uni, zur SAP Arena und zum Maimarkt',
      blocks: [
        '**Universität im Schloss:** Die Universität Mannheim sitzt im Barockschloss mit seiner 440 m langen Fassade. Vor dem Ehrenhof stellst du nur auf festen Flächen ab, am nächsten an der Mobilstation A 1 in der Bismarckstrasse.',
        '**SAP Arena:** Rund um die Arena ist Verbotszone. Jede Eintrittskarte ist ein VRN-Kombi-Ticket für Hin- und Rückfahrt mit Bus, Strassenbahn und S-Bahn im ganzen VRN, und ab etwa zwei Stunden vor Beginn fährt die Linie 6 alle zehn Minuten bis vor die Eingänge.',
        '**Maimarkt:** Der nächste läuft vom 24. April bis 4. Mai 2027 auf dem Maimarktgelände, täglich von 9 bis 18 Uhr. Auch dort ist Verbotszone; die S-Bahn hält an der Station Mannheim ARENA/Maimarkt.',
        'Für Veranstaltungen, Versammlungen und Baustellen kann die Stadt kurzfristig vorübergehende Verbotszonen einrichten.',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn und Bus: was bei rnv und VRN gilt',
      blocks: [
        'In Bahnen und Bussen der rnv gelten die Beförderungsbedingungen des VRN. Nach deren Anlage 3 fährt ein E-Tretroller nur mit, wenn er zusammengeklappt ist, unter 15 kg wiegt, kürzer als 115 cm ist und Räder von höchstens 9 Zoll hat. Dann zählt er als Handgepäck und fährt laut VRN kostenlos mit; laden darfst du ihn unterwegs nicht.',
        '**Leih-Scooter** erfüllen das nicht: Ein Dott-Scooter wiegt laut VRN 23 kg und lässt sich nicht klappen. Beende die Fahrt also ein Stück vor der Haltestelle, mindestens 10 m entfernt, und miete am Ziel einen neuen.',
        'Grössere eigene Scooter gelten auch nicht als Fahrrad; das sind im VRN nur Fahrräder, Pedelecs und E-Bikes. Die «E-Scooter» in den Regeln von rnv und VRN sind vierrädrige Elektromobile für Menschen mit eingeschränkter Mobilität.',
      ],
    },
    {
      heading: 'Wie Mannheim E-Scooter regelt: Obergrenze, Gebühr, Auswertung',
      blocks: [
        'Seit 1. Januar 2025 ist das Verleihen von E-Scootern in Mannheim eine Sondernutzung der Strasse nach dem Strassengesetz Baden-Württemberg; der Gemeinderat beschloss das Konzept am 14. Mai 2024. Die Anbieter zahlen 6 € pro Scooter und Monat.',
        'Stadtweit sind höchstens 2000 Leih-Scooter erlaubt, ein gutes Drittel weniger als zuvor: Je nach Saison standen bis dahin 3000 bis 3500 in der Stadt. Die Anbieter dürfen höchstens 25 % ihrer Flotte in der Innenstadt samt Jungbusch aufstellen und 40 % in den Stadtteilen drumherum, in den Vororten ohne Grenze. An einer Stelle stehen höchstens fünf Scooter eines Anbieters, und defekte holt er binnen sechs Stunden ab.',
        'Die Erlaubnisse laufen bis Ende 2026. Auf eine Anfrage aus dem Gemeinderat zog die Verwaltung am 18. März 2026 ein «positives Zwischenfazit»: Die Beschwerden hätten deutlich abgenommen, vor der Auswertung Ende 2026 seien keine weiteren Regeln geplant. Wie es ab 2027 weitergeht, hat die Stadt bis zum 17. Oktober 2026 nicht veröffentlicht.',
      ],
    },
    {
      heading: 'Schon gewusst? Zweiräder und Verbote in Mannheim seit 1817',
      blocks: [
        {
          list: [
            '**Die Geschichte des Fahrrads beginnt in Mannheim.** Am 12. Juni 1817 fuhr Karl Drais mit seiner Laufmaschine von seinem Haus in den Quadraten zum Schwetzinger Relaishaus im heutigen Rheinau, rund 7 km weit.',
            '**Das Gehwegverbot ist so alt wie das Fahrrad.** Die Strassen waren von Fuhrwerken zerfurcht, also wichen die Fahrer auf die Gehwege aus und waren dort zu schnell. Schon im Dezember 1817 verbot Mannheim die Laufmaschine auf den Bürgersteigen.',
            '**Auch einen Verleih gab es früh.** 1820 eröffnete ein Carl Helmlin im Schlossgarten einen Verleih für Laufmaschinen; 1822 wurde das Fahren auch dort verboten. Die ersten Leih-E-Scooter kamen im August 2019.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Mannheim?',
      answer: 'Die von Voi, Dott oder Bolt; TIER heisst heute Dott. Du musst 18 sein, einen Führerschein brauchst du nicht. Die [Live-Karte rund um Mannheim](map:de:Mannheim) zeigt Voi und Dott; Bolt siehst du nur in seiner App.',
    },
    {
      question: 'Was kostet Voi in Mannheim?',
      answer: '0,49 € fürs Entsperren und 0,22 € pro Minute, zehn Minuten also 2,69 € (Stand 17. Oktober 2026). Dott und Bolt zeigen ihren Preis nur in der App.',
    },
    {
      question: 'Warum kann ich am Hauptbahnhof oder am Wasserturm die Fahrt nicht beenden?',
      answer: 'Weil dort im Umkreis von rund 200 m nur die markierten Abstellflächen erlaubt sind; am Wasserturm und auf den Planken gilt zudem eine Verbotszone. Fahr zur nächsten Fläche, die die App zeigt, etwa am Haupteingang des Bahnhofs oder in O 7 am Plankenkopf.',
    },
    {
      question: 'Darf ich durch die Planken fahren?',
      answer: 'Nein. Planken und Breite Strasse sind Fussgängerzone, in der du laut Stadt nicht fahren darfst. Steig ab und schieb; abstellen darfst du dort auch nicht.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'Nur einen eigenen, zusammengeklappten Scooter unter 15 kg, kürzer als 115 cm und mit Rädern bis 9 Zoll. Leih-Scooter sind schwerer und lassen sich nicht klappen: Stell sie mindestens 10 m vor der Haltestelle ab.',
    },
    {
      question: 'Kann ich mit dem Leih-Scooter nach Ludwigshafen fahren?',
      answer: 'Mit Voi ja: Mannheim und Ludwigshafen bilden bei Voi ein Gebiet. In Ludwigshafen beendest du die Fahrt aber nur an einer der festen Abstellflächen, die die App zeigt.',
    },
    {
      question: 'Wo melde ich einen falsch abgestellten E-Scooter?',
      answer: 'Beim Anbieter, mit Kennzeichen, Ort und Foto: Dott unter support@ridedott.com, Voi unter support@voiapp.io, Bolt unter rentals-germany@bolt.eu. In schweren Fällen hilft der Fachbereich Sicherheit und Ordnung der Stadt, Telefon 0621 293-2933.',
    },
  ],
  sources: [
    { title: 'Stadt Mannheim: E-Scooter', url: 'https://www.mannheim.de/de/service-bieten/verkehr/e-scooter' },
    { title: 'Stadt Mannheim: Neue Regelungen für E-Scooter (19. Dezember 2024)', url: 'https://www.mannheim.de/de/nachrichten/neue-regelungen-fuer-e-scooter' },
    { title: 'Stadt Mannheim: Stadt erweitert Abstellflächen für E-Tretroller (30. Juni 2025)', url: 'https://www.mannheim.de/de/presse/geordnete-mobilitaet-auf-kurzen-distanzen-stadt-mannheim-erweitert-abstellflaechen-fuer-e-tretroller' },
    { title: 'Stadt Mannheim, Beschlussvorlage V218/2024: Regeln für Leih-E-Scooter', url: 'https://buergerinfo.mannheim.de/buergerinfo/vo0050.asp?__kvonr=232862' },
    { title: 'Stadt Mannheim: Leitlinie EKF-Vermietsysteme (Anlage 1 zu V218/2024, PDF)', url: 'https://buergerinfo.mannheim.de/buergerinfo/getfile.asp?id=8204290&type=do' },
    { title: 'Stadt Mannheim, Informationsvorlage V141/2026: Zwischenfazit zu E-Scootern (18. März 2026)', url: 'https://buergerinfo.mannheim.de/buergerinfo/vo0050.asp?__kvonr=236020' },
    { title: 'Stadt Mannheim: Satzung über Sondernutzungen in der Fussgängerzone Innenstadt (PDF)', url: 'https://www.mannheim.de/sites/default/files/2025-11/s06-10.pdf' },
    { title: 'VRN: Beförderungsbedingungen, Anlage 3: Mitnahme von E-Tretrollern', url: 'https://www.vrn.de/tickets/tarifsystem/befoerderungsbedingungen/artikel/011912/index.html' },
    { title: 'VRN: E-Tretroller von Dott', url: 'https://www.vrn.de/mobilitaet/e-tretroller/dott/index.html' },
    { title: 'Voi: E-Scooter in Mannheim', url: 'https://www.voi.com/de/city/mannheim' },
    { title: 'Wochenblatt Ludwigshafen: Stadt markiert Abstellflächen für E-Roller (25. März 2024)', url: 'https://www.wochenblatt-reporter.de/ludwigshafen/c-lokales/stadt-beendet-abstellchaos-bei-e-rollern-und-markiert-abstellflaechen_a543395' },
    { title: 'SAP Arena: Anreise und Parken', url: 'https://saparena.de/besucherservice/anreise-parken/' },
    { title: 'Maimarkt Mannheim: Termine 2027', url: 'https://www.maimarkt.de/' },
    { title: 'Universität Mannheim: Schloss Mannheim', url: 'https://www.uni-mannheim.de/campus/schloss-mannheim/' },
    { title: 'VRNnextbike: Tarife', url: 'https://www.vrnnextbike.de/de/' },
    { title: 'Heidelberg24: VRNrad löst VRNnextbike ab (10. Dezember 2025)', url: 'https://www.heidelberg24.de/region/neues-jahr-neues-mietradsystem-vrnnextbike-ende-2025-um-verleih-rhein-neckar-kreis-fahrrad-94077470.html' },
    { title: 'Stadt Mannheim: Faltblatt Drais-Route (PDF)', url: 'https://www.mannheim.de/sites/default/files/page/220/drais_flyer_web.pdf' },
  ],
};

export default guide;
