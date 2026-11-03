import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-muenchen',
  topic: 'munich',
  name: 'E-Scooter München: Anbieter, Preise, Parken',
  title: 'E-Scooter mieten in München 2026: Anbieter, Preise, Wiesn',
  description: 'E-Scooter in München leihen: Dott, Lime, Voi, Bolt, ab 18 ohne Führerschein. Zehn Minuten kosten bei Voi 3,59 €, bei Dott 4 €. Tabu: Englischer Garten, U-Bahn.',
  headline: 'E-Scooter München: Anbieter, Preise, Abstellflächen und was auf der Wiesn gilt',
  lede: 'Einen E-Scooter in München mietest du ab 18 und ohne Führerschein bei Dott, Lime, Voi oder Bolt. Zehn Minuten kosten im Standardtarif bei Voi 3,59 € und bei Dott 4 € (Stand November 2026); bei Lime und Bolt zeigt die App den Preis. Innerhalb des Altstadtrings beendest du die Fahrt nur auf ausgewiesenen Abstellflächen, im Englischen Garten sind E-Scooter verboten, und in U-Bahn, Tram und Bus der MVG darfst du sie nicht mitnehmen.',
  published: '2026-10-12',
  updated: '2026-10-25',
  city: 'de:München',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in München?',
      blocks: [
        'In München vermieten **Dott**, **Lime**, **Voi** und **Bolt** E-Scooter; diese vier Anbieter nennen die Stadt und der Verkehrsverbund MVV. TIER heisst heute Dott.',
        'Am Freitag, 30. Oktober 2026, um 9:27 Uhr zeigte die [Karte rund um München](map:de:München) rund 3400 Dott-, 6700 Voi- und 3600 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 9400 Lime-Scooter nach der letzten Zählung.',
        'Gemietet wird in der App des Anbieters, bei Dott und Voi auch in der MVGO-App der MVG mit deinem M-Login: registrieren, Zahlungsart hinterlegen, QR-Code scannen. Alle vier vermieten laut MVV nur ab 18, so steht es auch in den Bedingungen von Dott und Bolt, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in München?',
      blocks: [
        'Du zahlst fürs Entsperren und pro Minute. Dott und Voi veröffentlichen ihren Münchner Standardtarif in offenen Daten, Bolt nennt einen Ab-Preis für ganz Deutschland, und Lime zeigt den Preis in der App.',
        {
          table: {
            caption: 'E-Scooter-Preise in München (Standardtarif laut Voi, Dott und Bolt, Stand November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,99 €', '0,26 €', '3,59 €', '6,19 €'],
              ['Dott', '1,00 €', '0,30 €', '4,00 €', '7,00 €'],
              ['Bolt', 'kleine Gebühr, Betrag in der App', 'ab 0,15 € (für Deutschland)', 'in der App', 'in der App'],
            ],
          },
        },
        'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Wer oft fährt, spart bei Bolt mit einem Abo für unbegrenzte Freischaltungen ab 0,99 € im Monat oder mit Minutenpässen (Preise für Deutschland).',
      ],
    },
    {
      heading: 'Wo darf man in München E-Scooter fahren? Altstadt, Englischer Garten, Parks',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch die zwischen Stachus und Marienplatz (Neuhauser Strasse und Kaufingerstrasse). Bei Dott sind sie und der Viktualienmarkt Fahrverbotszonen: Dort steigst du ab und schiebst.',
        'Im **Englischen Garten** sind E-Scooter als Kraftfahrzeuge nach der Landschaftsschutzverordnung der Stadt verboten. Das gilt laut Bayerischer Schlösserverwaltung «auch für abgestellte E-Scooter». Laut Stadt sind Fahren und Abstellen auch im Schlosspark Nymphenburg, im Hofgarten, in den Maximiliansanlagen und in allen Landschaftsschutzgebieten verboten.',
        'Dott sperrt auch den Olympiapark weitgehend fürs Fahren, und am Flaucher an der Isar kannst du einen Dott nicht abstellen (Stand November 2026). Jede App zeigt ihre eigenen Sperrzonen.',
        'Unser Rat: Quere Tramschienen möglichst im rechten Winkel, damit das kleine Vorderrad nicht in die Rille rutscht. München ist meist flach; bergauf geht es vor allem an den Isarhängen, etwa am Gasteig oder am Nockherberg.',
      ],
    },
    {
      heading: 'E-Scooter in München abstellen: Altstadtring und 100-Meter-Zonen',
      blocks: [
        'Innerhalb des **Altstadtrings** kannst du die Fahrt seit dem 5. August 2022 nur auf ausgewiesenen Abstellflächen beenden, etwa am Stachus, am Rindermarkt, am Sendlinger Tor oder in der Maximilianstrasse. Bei Veranstaltungen kann eine Fläche zeitweise aufgehoben sein; die App zeigt, welche gerade gilt.',
        'In der ganzen Stadt baut München Abstellflächen für Leih-Scooter aus: Im April 2024 gab es laut dpa 375, bis 2026 sollten es 675 werden. Dott zieht um viele Abstellflächen ausserhalb der Altstadt einen Kreis von 100 m: Darin beendest du die Fahrt nur auf der Fläche selbst (laut Dotts Zonen, Stand November 2026). Zoomst du auf der [Karte](map:de:München) hinein, siehst du die Abstellflächen, die Park- und Fahrverbotszonen der Stadt und die Zonen von Dott.',
        'Ausserhalb der Altstadt stellst du den Scooter frei ab, nach der Selbstverpflichtung der Anbieter so:',
        {
          list: [
            'Auf dem Gehweg lässt du mindestens 1,80 m frei.',
            'Nicht in der Fussgängerzone und nicht in Grünanlagen, auch nicht auf dem Grünstreifen am Strassenrand.',
            'Nicht auf Rampen zu S- und U-Bahn, nicht an Fahrradständern und nicht näher als 10 m an Bus- und Tramhaltestellen.',
            'Auf Brücken sind abgestellte Scooter unerwünscht.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in der Altstadt neben statt auf einer Abstellfläche, bei Dott im 100-Meter-Kreis um eine Fläche oder in einer Sperrzone des Anbieters. Fahr auf die nächste Fläche oder aus der Zone hinaus: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Mach am Ende ein Foto vom abgestellten Scooter, auch wenn die App keins verlangt: Es belegt, wie du ihn hinterlassen hast, falls der Anbieter später eine Gebühr verlangt.',
      ],
    },
    {
      heading: 'Was kostet Falschparken mit dem E-Scooter?',
      blocks: [
        'Behinderst du mit dem abgestellten Scooter andere, können die kommunale Verkehrsüberwachung oder die Polizei nach dem allgemeinen Bussgeldkatalog 20 € verlangen, gefährdest du sie, 30 €. Ab 1. März 2027 kostet unzulässiges Parken auf Geh- oder Radweg ab 55 €.',
        'Dazu kommt, was die Anbieter selbst berechnen:',
        {
          table: {
            caption: 'Was Dott und Bolt fürs Falschparken berechnen (deutsche Nutzungsbedingungen, Stand November 2026)',
            head: ['Anbieter', 'Was es kosten kann'],
            rows: [
              ['Dott', 'Bis 300 € fürs Zurückholen, wenn du die Anweisungen zum Abstellen oder Abschliessen missachtest; Bussgelder der Behörden plus 50 € Verwaltungsgebühr'],
              ['Bolt', '15 €, wenn der Scooter falsch steht und kein deutliches Abstellfoto da ist; bis 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs; Bussgelder plus bis 30 € Verwaltungsgebühr (Bedingungen gültig ab 1. Dezember 2026)'],
            ],
          },
        },
        'Was Voi und Lime berechnen, steht in ihren Bedingungen.',
      ],
    },
    {
      heading: 'E-Scooter und Oktoberfest: was rund um die Wiesn gilt',
      blocks: [
        'Die Wiesn 2026 lief vom 19. September bis 4. Oktober. Für Leih-Scooter galt rund um die Theresienwiese laut Stadt:',
        {
          list: [
            '**Innerhalb des Äusseren Sperrrings** um die Festwiese: Fahr- und Parkverbot wie für Autos. Zwölf Abstellflächen lagen am Ring.',
            '**Von 17 bis 6 Uhr:** kein Ausleihen und kein Abstellen bis rund einen Kilometer über den Ring hinaus, darunter Teile von Westend und Bahnhofsviertel und die Sonnenstrasse zwischen Sendlinger Tor und Stachus. Auf ausgewiesenen Abstellflächen durftest du weiter parken.',
            '**Von 15 bis 6 Uhr:** Ausleihen nur nach bestandenem Reaktionstest in der App.',
          ],
        },
        'Die offizielle Seite oktoberfest.de zählt Hackerbrücke, Hauptbahnhof und Stachus zur Sperrzone ab 17 Uhr und rät: «E-Scooter und Wiesn sind keine gute Kombination.» Rechne 2027 mit ähnlichen Regeln und prüf sie in der App, bevor du losfährst.',
        'Der Reaktionstest soll laut Stadt daran erinnern, dass auf dem E-Scooter dieselben Promillegrenzen gelten wie im Auto, mit Folgen auch für deinen Autoführerschein (siehe unten).',
      ],
    },
    {
      heading: 'E-Scooter in U-Bahn, Tram und S-Bahn: was MVG und MVV erlauben',
      blocks: [
        'In U-Bahn, Tram und Stadtbus der MVG darfst du laut MVV seit April 2024 keinen E-Scooter mitnehmen, auch zusammengeklappt nicht; Grund sind Akkubrände. Leih-Scooter dürfen auch nicht in S-Bahn und Regionalzug: Sie lassen sich nicht klappen und sind zu gross und zu schwer.',
        'Deinen eigenen E-Scooter darfst du zusammengeklappt kostenlos in S-Bahn, Regionalzug und Regionalbus mitnehmen, wenn er höchstens 90 × 80 cm misst und 25 kg wiegt. Mit dem Leih-Scooter heisst Umsteigen: Fahrt vor dem Bahnhof beenden und am Ziel einen neuen mieten.',
        'Zum Flughafen: Die Terminals liegen ausserhalb von Dotts Geschäftsgebiet (Stand November 2026), rechne dort also nicht mit einem Dott. Nimm zum Flughafen die S-Bahn und den Scooter für die Stadt.',
      ],
    },
    {
      heading: 'MyRadl und MVGO: Leihrad statt E-Scooter',
      blocks: [
        '**MyRadl** ist seit dem 7. Mai 2026 das Leihradsystem für München und 36 Orte im Umland, entstanden aus MVV, Stadt und Landkreisen und betrieben von nextbike. Du leihst die Räder an MyRadl-Stationen aus und gibst sie dort auch zurück.',
        {
          list: [
            '**Fahrrad:** 1 € für 30 Minuten, Tagestarif 9 € pro Fahrt.',
            '**E-Bike:** 3 € für 30 Minuten, Tagestarif 18 € pro Fahrt.',
            '**Mit MVG-Abo (nicht dem 365-Euro-Ticket für Schüler) oder einem Deutschlandticket aus der MVV-App:** die ersten 30 Minuten auf dem Fahrrad gratis, auf dem E-Bike für 1,50 €.',
          ],
        },
        'Gebucht wird in der MVV-App, der nextbike-App oder in **MVGO**, wo du mit deinem M-Login auch E-Scooter von Dott und Voi mietest; Lime und Bolt mietest du in ihren eigenen Apps. Wo Scooter von Dott, Voi, Lime und Bolt in deiner Nähe stehen, zeigt die [Live-Karte von München](map:de:München).',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in München: Bussgelder und Pläne für 2027',
      blocks: [
        'In München gelten die deutschen Regeln: keine Helmpflicht (ein Helm ist trotzdem ratsam), bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, ab 1. März 2027 25 €, mit Behinderung oder Gefährdung mehr.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €.',
            '**Rote Ampel:** 60 € und ein Punkt in Flensburg.',
            '**Handy in der Hand:** 100 € und ein Punkt; ab März 2027 neu geregelt, der Betrag ist noch nicht offiziell erläutert.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot, auch fürs Auto; ab 1,1 Promille eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit 0,0 Promille.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
        'Für die Anbieter gilt in München eine freiwillige Selbstverpflichtung, zuletzt in der Fassung vom April 2022: je Anbieter höchstens 100 Scooter in der Altstadt und 1000 weitere innerhalb des Mittleren Rings, höchstens vier an einem Standort im Umkreis von 100 m, falsch geparkte binnen 24 Stunden einsammeln.',
        'Am 19. April 2024 zählte das Mobilitätsreferat laut dpa 18 698 Leih-Scooter in der Stadt. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Stadt kann es dann als Sondernutzung genehmigen.',
      ],
    },
  ],
  faq: [
    {
      question: 'Ab welchem Alter kann ich in München einen E-Scooter mieten?',
      answer: 'Ab 18: So steht es laut MVV in den Bedingungen von Dott, Lime, Voi und Bolt. Das Gesetz erlaubt E-Scooter schon ab 14 und ohne Führerschein, mit 14 bis 17 fährst du aber nur einen eigenen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter zur Wiesn fahren?',
      answer: 'Nur bis zum Äusseren Sperrring um die Theresienwiese; innerhalb des Rings galt 2026 ein Fahr- und Parkverbot. Von 17 bis 6 Uhr durftest du bis rund einen Kilometer über den Ring hinaus weder ausleihen noch abseits der Abstellflächen parken, ab 15 Uhr nur nach einem Reaktionstest in der App ausleihen. Rechne 2027 mit ähnlichen Regeln.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Altstadt nicht beenden?',
      answer: 'Innerhalb des Altstadtrings geht das nur auf ausgewiesenen Abstellflächen, und bei Dott auch im Umkreis von 100 m um viele Flächen in der übrigen Stadt nur auf der Fläche selbst. Fahr zur nächsten Fläche, die die App zeigt; solange die Fahrt läuft, zahlst du.',
    },
    {
      question: 'Wo darf ich in München keinen E-Scooter abstellen?',
      answer: 'Nicht in der Fussgängerzone und nicht in Grünanlagen, nicht näher als 10 m an Bus- und Tramhaltestellen, nicht vor Rampen zu S- und U-Bahn und nicht an Fahrradbügeln. Auf dem Gehweg bleiben mindestens 1,80 m frei.',
    },
    {
      question: 'Darf man im Englischen Garten E-Scooter fahren?',
      answer: 'Nein. E-Scooter gelten als Kraftfahrzeuge und sind im Englischen Garten verboten, auch abgestellt. Stell deinen Scooter ausserhalb des Parks ab und geh zu Fuss weiter.',
    },
    {
      question: 'Darf ich einen E-Scooter in die Münchner U-Bahn mitnehmen?',
      answer: 'Nein. In U-Bahn, Tram und Stadtbus der MVG sind E-Scooter seit April 2024 verboten, auch zusammengeklappt. In die S-Bahn darf nur ein eigener, zusammengeklappter Scooter, nie ein Leih-Scooter.',
    },
  ],
  sources: [
    { title: 'Stadt München, Mobilitätsreferat: Elektrotretroller-Sharing', url: 'https://muenchenunterwegs.de/angebote/elektrotretroller-sharing' },
    { title: 'Stadt München: Sicherheit und Kontrollen auf dem Oktoberfest 2026', url: 'https://stadt.muenchen.de/news/oktoberfest-2026-sicherheit-und-kontrollen.html' },
    { title: 'oktoberfest.de: Mit dem E-Scooter zur Wiesn', url: 'https://www.oktoberfest.de/informationen/service-fuer-besucher/mit-dem-e-scooter-zur-wiesn' },
    { title: 'MVV: Scootersharing in München und Mitnahme in Bus und Bahn', url: 'https://www.mvv-muenchen.de/vernetzte-mobilitaet/shared-mobility/scootersharing/' },
    { title: 'Bayerische Schlösserverwaltung: Englischer Garten, Hinweise für Besucher (PDF)', url: 'https://www.schloesser.bayern.de/deutsch/service/infomat/screen-pdf/engl-garten_dt.pdf' },
    { title: 'muenchen.de: MyRadl, Leihfahrräder für die Region', url: 'https://www.muenchen.de/verkehr/aktuell/myradl-im-mvv-muenchen-leihfahrraeder-fuer-die-region' },
    { title: 'Stadt München: Freiwillige Selbstverpflichtungserklärung der Sharing-Anbieter, Stand 6. April 2022 (PDF)', url: 'https://muenchenunterwegs.de/content/113/download/weiterentwicklung-freiwillige-selbstverpflichtungserklarung-ekf-sharing-stand-06042022.pdf' },
    { title: 'dpa in inFranken.de: Nürnberg und München zu Leih-E-Scootern, 26. April 2024', url: 'https://www.infranken.de/lk/nuernberg/nuernberg-stadt-ergreift-massnahmen-wegen-e-scootern-kommt-ein-verbot-art-5860300,PRINT' },
    { title: 'MVG: MVGO, Sharing-Funktionen', url: 'https://www.mvg.de/services/unsere-apps/mvgo.html' },
    { title: 'Dott: offener Datenfeed für München mit Tarif und Zonen (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/munich/gbfs.json' },
    { title: 'Voi: Tarif für München in den offenen Daten (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/150/netex.xml' },
    { title: 'Bolt: E-Scooter in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen für Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge, gültig ab 1. Dezember 2026', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
  ],
};

export default guide;
