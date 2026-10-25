import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-bielefeld',
  topic: 'bielefeld',
  name: 'E-Scooter Bielefeld: Anbieter, Preise, Parken',
  title: 'E-Scooter Bielefeld 2026: Dott, Bolt, Preise, Parken',
  description: 'E-Scooter Bielefeld: Dott und Bolt, Preise, wo du fährst und parkst, was in Parks und im Wald gilt und warum dein Roller nicht in die Stadtbahn darf.',
  headline: 'E-Scooter Bielefeld: Anbieter, Preise, Parken und Verbote',
  lede: 'E-Scooter in Bielefeld leihst du laut Stadt bei Dott und Bolt; beide vermieten erst ab 18, einen Führerschein brauchst du nicht. Unsere Karte zeigt nur Dott. Für Dott nennt moBiel, der städtische Verkehrsbetrieb und Partner von Dott, 1,20 € fürs Entsperren und 0,29 € pro Minute (Stand 25. Oktober 2026); verbindlich ist der Preis in der App, und Bolts Tarif zeigt nur die Bolt-App. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzonen um Bahnhofstrasse und Altstadt. Abstellen darfst du am Gehwegrand, wenn 1,80 m frei bleiben, aber nicht in den Verbotszonen der Stadt, zu denen Parks und der Teutoburger Wald gehören. Deinen eigenen E-Scooter darfst du seit 1. April 2024 nicht mehr in die Busse und die Stadtbahn von moBiel mitnehmen.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Bielefeld',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Bielefeld?',
      blocks: [
        'Die Stadt nennt auf ihrer Scooter-Seite zwei Anbieter: **Dott** mit «ca. 750» und **Bolt** mit «ca. 550 E-Scooter im Stadtgebiet» (Seite undatiert, Stand 25. Oktober 2026). Eine Obergrenze oder Gebühr für Leih-Scooter fanden wir bei der Stadt nicht, auch nicht in ihrer Sondernutzungssatzung (Fassung vom 24. März 2025). Gemietet wird in der App des Anbieters, laut den Bedingungen von Dott und Bolt erst ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt; einen Führerschein brauchst du nicht. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        '**Dott** führt Bielefeld auf seiner Standortseite und arbeitet mit moBiel zusammen: Standorte und Akkustände der Dott-Scooter zeigt auch die moBiel YOU App, und aus den früheren TIER-Rollern sind Dott-Roller geworden.',
        '**Bolt** fährt laut Radio Bielefeld (13. Mai 2026) seit 2021 mit E-Scootern in der Stadt. Bolts eigene Bielefeld-Seite nennt aber nur Fahrdienst und Taxi (Stand 25. Oktober 2026); ob Bolt-Scooter in deiner Nähe stehen, zeigt nur die Bolt-App. Weitere Anbieter nennt die Stadt nicht, und Ryde führt Bielefeld nicht unter seinen Standorten.',
        'Die [Karte von Bielefeld](map:de:Bielefeld) zeigt Dott: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 850 freie Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. In der Nacht zum Sonntag, gegen halb fünf, standen alle knapp 890 innerhalb der Stadtgrenze, gut die Hälfte im Bezirk Mitte; in Sennestadt, Senne und Jöllenbeck zusammen nur vier. Die Karte zeigt nur Standorte, keine Preise, Zonen, Parkregeln oder Reichweiten. **Bolt fehlt auf unserer Karte**, ebenso die Leihräder von meinSiggi.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Bielefeld?',
      blocks: [
        'Dott selbst nennt keinen Bielefelder Tarif: «In der Dott-App siehst du den Preis, der in deiner Region gilt.» Auf der Dott-Seite von moBiel (undatiert, Stand 25. Oktober 2026) stehen 1,20 € fürs Entsperren und 0,29 € pro Minute; zehn Minuten kosten danach 4,10 €. Mit **Dott Flex** für 4,99 € im Monat kostet laut moBiel jede Fahrt bis 20 Minuten 2,00 €, das Entsperren inklusive. Verbindlich ist, was die App vor dem Entsperren zeigt. Einen Bielefelder Preis für Bolt fanden wir nicht; ihn zeigt die Bolt-App.',
        {
          table: {
            caption: 'Was beim Mieten in Bielefeld extra kosten kann (Stand 25. Oktober 2026)',
            head: ['Fall', 'Dott (Bedingungen vom 23. September 2025)', 'Bolt (Bedingungen seit 2023, auch ab 1. Dezember 2026)'],
            rows: [
              ['Falsch geparkt', 'bis zu 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst', '15 €, wenn der Scooter falsch steht und kein deutliches Abstellfoto da ist'],
              ['Ausserhalb des erlaubten Gebiets abgestellt', 'Dott kann den Scooter deaktivieren und eine Gebühr verlangen, wenn du ihn nicht zurückbringst', 'bis zu 100 € Abholgebühr'],
              ['Bussgeld, das der Anbieter für dich zahlt', 'das Bussgeld plus 50 € Verwaltungsgebühr', 'das Bussgeld plus bis zu 30 € Verwaltungsgebühr'],
            ],
          },
        },
        'Verstösst du gegen Dotts Bedingungen, kann Dott ausserdem 50 € verlangen. Behördliche Bussgelder kommen dazu.',
      ],
    },
    {
      heading: 'Wo darf man in Bielefeld mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, Radfahrstreifen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. So schreibt es auch die Stadt. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei». Gegen die Fahrtrichtung einer Einbahnstrasse darfst du mit «Elektrokleinstfahrzeuge frei». Bei «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die StVO lässt dich mitfahren, die eKFV verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist die Gegenrichtung erlaubt, wo «Radverkehr frei» sie öffnet. Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Bielefeld was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzonen um Bahnhofstrasse und in der Altstadt', 'Absteigen und schieben; die Dott-App markiert sie laut moBiel gelb. Abstellen verboten', 'Bund; Stadt, Parkverbotskarte vom Februar 2025; Dott'],
              ['Parks, Gärten, Ufer und andere Anlagen, etwa Bürgerpark, Nordpark und Obersee', 'Verboten ist «das Befahren von Anlagen mit Fahrzeugen jeglicher Art»; ein Verstoss ist eine Ordnungswidrigkeit. Abstellen verboten', 'Stadt, Ordnungsbehördliche Verordnung (Fassung vom 12. Juni 2025), § 2; Parkverbotskarte'],
              ['Wald, etwa im Teutoburger Wald', 'Verboten ist das «Fahren im Wald», ausser Radfahren auf Strassen und festen Wegen; motorgetriebene Fahrzeuge nimmt das Gesetz davon aus. Geldbusse bis 25 000 €. Die Stadt markiert den Höhenzug fast durchgehend als Parkverbotszone', 'Land, Landesforstgesetz NRW, §§ 2, 3 und 70; Stadt, Parkverbotskarte'],
              ['Grau markierte Flächen in der Dott-App', 'Ausserhalb des Heimatgebiets: durchfahren ja, parken nein', 'Dott, laut moBiel'],
            ],
          },
        },
        'Die Verordnung nennt E-Scooter nicht, erfasst aber Fahrzeuge jeglicher Art, und nach § 1 der eKFV ist ein E-Scooter ein Kraftfahrzeug. Wir lesen § 2 deshalb so, dass du durch Parks nicht fahren darfst. Öffentliche Geh- und Radwege zählt die Verordnung aber zu den Verkehrsflächen, nicht zu den Anlagen; dort gelten die Schilder. Eine Scooter-Regel für den Uni-Campus fanden wir nicht.',
      ],
    },
    {
      heading: 'E-Scooter in Bielefeld parken: 1,80 m und Verbotszonen',
      blocks: [
        'Die Stadt schreibt: «Platzsparend am Gehweg-Rand (Restbreite von 1,80 m muss eingehalten werden)». An Stationen stellst du den Scooter «auf der markierten Fläche» ab. Die Dott-Seite von moBiel nennt noch 1,50 m; halte dich an die Stadt. Nach Bundesrecht darfst du auf dem Gehweg abstellen, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO; stellt ein Anbieter seine Leih-Scooter auf, ist das kein Parken, stellst du einen nach der Fahrt ab, schon.',
        'Wo du nicht abstellen darfst, zeigt die Karte «E-Scooter – Unzulässiger Bereich 2025» des Amts für Verkehr (Februar 2025):',
        {
          list: [
            'die Fussgängerzonen der Innenstadt und das Umfeld des Hauptbahnhofs;',
            'Parks und Grünzüge wie Bürgerpark, Nordpark, Gellershagenpark, den Obersee, den Botanischen Garten und den Tierpark Olderdissen;',
            'Friedhöfe, etwa Johannis-, Nicolai- und Sudbrackfriedhof;',
            'den Teutoburger Wald von Bethel und der Sparrenburg nach Südosten und grosse Wald- und Feldflächen am Stadtrand.',
          ],
        },
        'In der Dott-App sind Parkverbote laut moBiel rot, dort kannst du die Fahrt nicht beenden; blaue Flächen sind bevorzugte Parkplätze. Laut Dotts Bedingungen kann die App ein Foto verlangen. Falsch geparkte Scooter meldest du dem Anbieter oder über den Mängelmelder der Stadt.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, fahr zu einer erlaubten Fläche: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Regeln und Bussgelder für E-Scooter in Bielefeld',
      blocks: [
        'Es gelten die deutschen Regeln: keine Helmpflicht, die Stadt rät aber zum Helm; bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die Stadt nennt vereinfacht eine Grenze von 0,5 Promille. Strafbar machst du dich aber schon ab 0,3 Promille, wenn du unsicher fährst, und unter 21 oder in der Probezeit gilt 0,0 Promille; Bolt verbietet in seinen Bedingungen jeden Alkohol. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden; ab 1. März 2027 25 €, bis 40 €.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €.',
            '**Rote Ampel:** 60 € und ein Punkt, länger als 1 Sekunde rot 100 € und ein Punkt. **Handy in der Hand:** 100 € und ein Punkt; ab März 2027 neu geregelt, der Betrag ist noch nicht offiziell erläutert.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot; ab 1,1 Promille eine Straftat.',
            '**Falsch geparkt auf Geh- oder Radweg:** behindernd 20 €, gefährdend 30 €; ab 1. März 2027 55 €, mit Behinderung 70 €.',
          ],
        },
        '2025 verunglückten in Bielefeld laut Jahresbilanz der Polizei (März 2026) 93 E-Scooter-Fahrende, 2024 waren es 51. 13 wurden schwer verletzt, getötet wurde niemand; bei den 18- bis 24-Jährigen stieg die Zahl von 7 auf 22. Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Stadtbahn, Bus und Zug',
      blocks: [
        '«Ab dem 1. April 2024 ist die Mitnahme von E-Tretrollern in allen moBiel-Bussen, in den Bussen der moBiel-Subunternehmer und in unserer StadtBahn verboten», schreibt moBiel, wegen der Brandgefahr der Akkus. Eine Ausnahme für zusammengeklappte Roller nennt moBiel nicht. Die «E-Scooter», die laut moBiel weiter mitfahren, sind vierrädrige Elektromobile, nicht dein Tretroller.',
        'Die Beförderungsbedingungen für Nahverkehr in NRW (gültig ab 1. Januar 2026), die auch im Westfalentarif gelten, zählen einen vollständig zusammengeklappten E-Tretroller als Handgepäck, einen aufgeklappten wie ein Fahrrad. Jedes Verkehrsunternehmen darf E-Tretroller aber per Hausrecht ausschliessen, auch zusammengeklappt; das tut moBiel. Bei der eurobahn und im Fernverkehr der Deutschen Bahn fährt dein E-Tretroller zusammengeklappt als Handgepäck mit.',
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor der Haltestelle und miete am Ziel neu. Fährt dein Bus, deine Stadtbahn oder dein Nahverkehrszug mindestens 20 Minuten nach Fahrplan ab, erstattet die Mobilitätsgarantie NRW auch E-Scooter-Sharing, bis 30 € bei planmässiger Abfahrt zwischen 5 und 20 Uhr, sonst bis 60 €. Bei Streik und Unwetter gilt die Garantie nicht.',
      ],
    },
    {
      heading: 'Uni, Arminia, Leineweber-Markt und Herford: Tipps',
      blocks: [
        'Wo in der Nacht zum 25. Oktober 2026 Dott-Scooter standen, gibt einen Anhaltspunkt:',
        {
          list: [
            '**Hauptbahnhof:** rund 50 Scooter im Umkreis von 500 m. Das Bahnhofsumfeld selbst ist laut Stadt Parkverbotszone.',
            '**Jahnplatz und Altstadt:** je rund 80 im Umkreis von 500 m.',
            '**Universität:** knapp 20 im Umkreis von 500 m um das Hauptgebäude. Dorthin fahren auch die Stadtbahnlinie 4 und der Bus 31; mit den Leihrädern von meinSiggi haben Studierende von Uni und Hochschule laut moBiel bei jeder Ausleihe 60 Freiminuten.',
            '**Schüco-Arena:** Eine Scooter-Regel für Spieltage nennen weder moBiel noch die Stadt. Die Eintrittskarte für Arminia-Heimspiele gilt laut moBiel drei Stunden vor und nach dem Spiel in Bus und Stadtbahn, etwa mit der Linie 4.',
            '**Leineweber-Markt:** Das Stadtfest füllt vom 26. bis 30. Mai 2027 die Innenstadt; eine eigene Scooter-Regel fanden wir nicht.',
            '**Herford:** Dott führt die Stadt als eigenen Standort; die [Karte von Herford](map:de:Herford) zeigte am Samstagnachmittag rund 180 Scooter. Ob du von Bielefeld aus hinfahren und dort parken darfst, zeigt die App.',
          ],
        },
        'Wie es in Osnabrück mit Dott und Voi läuft, steht im Ratgeber [E-Scooter in Osnabrück](guide:osnabrueck). Freie Dott-Scooter in deiner Nähe zeigt die [Live-Karte von Bielefeld](map:de:Bielefeld).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Bielefeld?',
      answer: 'Laut Stadt Dott (rund 750) und Bolt (rund 550). Du mietest in der App des Anbieters, laut deren Bedingungen ab 18, ohne Führerschein. Unsere Live-Karte zeigt nur Dott; Bolt-Scooter siehst du nur in der Bolt-App.',
    },
    {
      question: 'Was kostet ein E-Scooter in Bielefeld?',
      answer: 'Für Dott nennt moBiel 1,20 € fürs Entsperren und 0,29 € pro Minute (Stand 25. Oktober 2026). Verbindlich ist der Preis in der App. Einen Bielefelder Tarif für Bolt fanden wir nicht.',
    },
    {
      question: 'Wo darf ich in Bielefeld einen E-Scooter abstellen?',
      answer: 'Am Gehwegrand, sodass 1,80 m frei bleiben. Nicht in den Verbotszonen der Stadt: Fussgängerzonen, Parks, Friedhöfe, Hauptbahnhof und Teutoburger Wald. In den roten Zonen der Dott-App kannst du die Fahrt nicht beenden.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Bürgerpark oder den Teutoburger Wald fahren?',
      answer: 'Nach unserer Lesart nein. Die Verordnung der Stadt verbietet das Befahren von Parks und Anlagen mit Fahrzeugen jeglicher Art, und das Landesforstgesetz NRW erlaubt im Wald nur das Radfahren auf Strassen und festen Wegen, ohne motorgetriebene Fahrzeuge.',
    },
    {
      question: 'Darf ich meinen E-Scooter in der Stadtbahn mitnehmen?',
      answer: 'Nein. Seit 1. April 2024 verbietet moBiel E-Tretroller in allen Bussen und in der Stadtbahn, eine Ausnahme für zusammengeklappte nennt es nicht. Bei der eurobahn fährt ein zusammengeklappter Roller als Handgepäck mit.',
    },
    {
      question: 'Kann ich in Bielefeld nachts einen E-Scooter mieten?',
      answer: 'Ja. Eine Nachtsperre gibt es nicht; laut moBiel kannst du die Dott-Scooter rund um die Uhr im Heimatgebiet nutzen.',
    },
  ],
  sources: [
    { title: 'Stadt Bielefeld: E-Scooter im Stadtgebiet', url: 'https://www.bielefeld.de/e-scooter' },
    { title: 'Stadt Bielefeld: E-Scooter – Unzulässiger Bereich 2025 (Februar 2025, PDF)', url: 'https://www.bielefeld.de/sites/default/files/datei/2025/Unzulaessiger-Parkbereich-E-Scooter-2025.pdf' },
    { title: 'Stadt Bielefeld: Ordnungsbehördliche Verordnung, Fassung vom 12. Juni 2025 (PDF)', url: 'https://www.bielefeld.de/sites/default/files/datei/2025/III-1-OBVO-Internet.pdf' },
    { title: 'Stadt Bielefeld: Sondernutzungssatzung, Fassung vom 24. März 2025 (PDF)', url: 'https://www.bielefeld.de/sites/default/files/datei/2025/VI-10-Sondernutzung-oeffentl-Verkehrsflaechen-Internet.pdf' },
    { title: 'Landesforstgesetz NRW, gültig ab 1. April 2025', url: 'https://recht.nrw.de/lrgv/gesetz/01042025-landesforstgesetz-fuer-das-land-nordrhein-westfalen-landesforstgesetz-lfog/' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung, § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'moBiel: Dott – E-Tretroller', url: 'https://www.mobiel.de/sharing/dott-e-tretroller/' },
    { title: 'moBiel: Mitnahmeverbot für E-Tretroller ab 1. April 2024', url: 'https://www.mobiel.de/aktuelles/aktuelle-news/mitnahmeverbot-fuer-e-tretroller/' },
    { title: 'moBiel: Arminia-Heimspiele', url: 'https://www.mobiel.de/freizeit/arminia-heimspiele/' },
    { title: 'moBiel: meinSiggi – Fahrrad', url: 'https://www.mobiel.de/sharing/meinsiggi-fahrrad/' },
    { title: 'Beförderungsbedingungen Nahverkehr NRW, gültig ab 1. Januar 2026 (PDF)', url: 'https://www.westfalentarif.de/fileadmin/documents/Tarifbestimmungen_und_Bef%C3%B6rderungsbedingungen_Preise/BB_Nahverkehr_NRW_zum_01.01.2026.pdf' },
    { title: 'eurobahn: Mitnahme von Fahrrädern, Gepäck und Tieren', url: 'https://www.eurobahn.de/services/mitnahme-von-fahrraedern-gepaeck-und-tieren/' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Polizei Bielefeld: Jahresbilanz Verkehr 2025 (11. März 2026, PDF)', url: 'https://bielefeld.polizei.nrw/sites/default/files/2026-03/260311_DirV_Jahresbilanz_Verkehr_2025_BI_Stadt-BAB.pdf' },
    { title: 'Universität Bielefeld: Mobilität', url: 'https://www.uni-bielefeld.de/studium/studierende/start-ins-studium/mobilitaet/' },
    { title: 'Bielefeld Marketing: Leineweber-Markt', url: 'https://www.bielefeld.jetzt/leineweber' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Fahr mit uns', url: 'https://ridedott.com/de/fahr-mit-uns/' },
    { title: 'Bolt: Bolt in Bielefeld', url: 'https://bolt.eu/de-de/cities/bielefeld/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Radio Bielefeld: Bolt startet Fahrdienst in Bielefeld (13. Mai 2026)', url: 'https://www.radiobielefeld.de/nachrichten/am-puls-der-stadt/bolt-startet-fahrdienst-in-bielefeld.html' },
    { title: 'Ryde: Locations', url: 'https://www.ryde-technology.com/Locations' },
  ],
};

export default guide;
