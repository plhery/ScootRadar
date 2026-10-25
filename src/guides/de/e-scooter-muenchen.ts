import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-muenchen',
  topic: 'munich',
  name: 'E-Scooter München: Anbieter, Preise, Parken',
  title: 'E-Scooter München 2026: Anbieter, Preise, Parken, Wiesn',
  description: 'E-Scooter München: wer vermietet, was zehn Minuten kosten, wo du in der Altstadt parkst, was im Englischen Garten, auf der Wiesn und in der U-Bahn gilt.',
  headline: 'E-Scooter München: Anbieter, Preise, Abstellflächen und was auf der Wiesn gilt',
  lede: 'Einen E-Scooter in München mietest du ab 18 und ohne Führerschein bei Dott, Lime, Voi oder Bolt. Zehn Minuten kosten nach den veröffentlichten Tarifen (Stand 12. Oktober 2026) bei Dott 4 € und bei Voi 3,59 €; bei Lime und Bolt zeigt die App den Preis. Innerhalb des Altstadtrings beendest du die Fahrt nur auf ausgewiesenen Abstellflächen, im Englischen Garten sind E-Scooter verboten, und in U-Bahn, Tram und Bus der MVG darfst du sie nicht mitnehmen.',
  published: '2026-10-12',
  updated: '2026-10-24',
  city: 'de:München',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in München?',
      blocks: [
        'In München vermieten **Dott**, **Lime**, **Voi** und **Bolt** E-Scooter; diese vier Anbieter nennen die Stadt und der Verkehrsverbund MVV. TIER heisst heute Dott.',
        'ScootRadar zeigt auf der [Karte rund um München](map:de:München) Dott und seit dem 24. Oktober 2026 auch Voi: an jenem Samstag kurz vor 16 Uhr rund 3600 Dott- und 6800 Voi-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse. Lime und Bolt sind ebenfalls in München unterwegs, fehlen aber auf der Karte.',
        'Gemietet wird in der App des Anbieters, bei Dott und Voi auch in der MVGO-App der MVG: registrieren, Zahlungsart hinterlegen, QR-Code scannen. Alle vier vermieten laut ihren Bedingungen nur ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in München?',
      blocks: [
        'Du zahlst fürs Entsperren und pro Minute. Dott veröffentlicht seinen Münchner Tarif in einem offenen Datenfeed, Voi auf seiner München-Seite. Lime und Bolt nennen für München keinen Preis; den zeigt dir ihre App.',
        {
          table: {
            caption: 'E-Scooter-Preise in München (veröffentlichte Tarife, Stand 12. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', '1,00 €', '0,30 €', '4,00 €', '7,00 €'],
              ['Voi', '0,99 €', '0,26 €', '3,59 €', '6,19 €'],
              ['Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Bolt', 'kleine Gebühr, Betrag nicht genannt', 'ab 0,15 € (für Deutschland)', 'in der App', 'in der App'],
            ],
          },
        },
        'Voi schreibt, dass Preise je nach Ort, Zeit und Fahrzeug abweichen können; Lime rechnet laut seinen deutschen Bedingungen jede angefangene Minute voll ab. Verbindlich ist der Preis in der App.',
        'Wer oft fährt, kann mit Paketen und Abos sparen, in denen das Entsperren inklusive ist: bei Voi Minutenpakete und der Voi Pass, bei Bolt ein Abo ab 0,99 € im Monat (Preis für Deutschland).',
      ],
    },
    {
      heading: 'Wo darf man in München E-Scooter fahren? Altstadt, Englischer Garten, Parks',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch die zwischen Stachus und Marienplatz (Neuhauser Strasse und Kaufingerstrasse). In Dotts Zonendaten sind sie und der Viktualienmarkt Fahrverbotszonen: Dort steigst du ab und schiebst.',
        'Im **Englischen Garten** sind E-Scooter als Kraftfahrzeuge nach der Landschaftsschutzverordnung der Stadt verboten. Das gilt laut Bayerischer Schlösserverwaltung «auch für abgestellte E-Scooter». Fahren und Abstellen verbietet die Stadt auch im Schlosspark Nymphenburg, im Hofgarten, in den Maximiliansanlagen und in allen Landschaftsschutzgebieten.',
        'Dotts Zonendaten (Stand 12. Oktober 2026) sperren auch den Olympiapark fürs Fahren, und am Flaucher an der Isar kannst du einen Dott nicht abstellen. Jede App zeigt ihre eigenen Sperrzonen.',
        'Unser Rat: Quere Tramschienen möglichst im rechten Winkel, damit das kleine Vorderrad nicht in die Rille rutscht. München ist meist flach; bergauf geht es vor allem an den Isarhängen, etwa am Gasteig oder am Nockherberg.',
      ],
    },
    {
      heading: 'E-Scooter in München abstellen: Altstadtring und 100-Meter-Zonen',
      blocks: [
        'Innerhalb des **Altstadtrings** kannst du die Fahrt seit dem 5. August 2022 nur auf ausgewiesenen Abstellflächen beenden, etwa am Stachus, am Rindermarkt, am Sendlinger Tor oder in der Maximilianstrasse. Bei Veranstaltungen kann eine Fläche zeitweise aufgehoben sein; die App zeigt, welche gerade gilt.',
        'In der ganzen Stadt entstehen geteilte Abstellflächen für Scooter und Leihräder, meist auf früheren Autoparkplätzen: Ende Juni 2026 gab es 365, geplant sind 675. Im Umkreis von 100 m um jede dieser Flächen beendest du die Fahrt nur auf der Fläche selbst.',
        'Überall sonst stellst du den Scooter frei ab:',
        {
          list: [
            'Auf dem Gehweg lässt du mindestens 1,80 m frei.',
            'Nicht in der Fussgängerzone und nicht in Grünanlagen, auch nicht auf dem Grünstreifen am Strassenrand.',
            'Nicht auf Rampen zu S- und U-Bahn, nicht an Fahrradständern und nicht näher als 10 m an Bus- und Tramhaltestellen.',
            'Auf Brücken sind abgestellte Scooter unerwünscht.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in der Altstadt neben statt auf einer Abstellfläche, im 100-Meter-Umkreis einer Fläche oder in einer Sperrzone des Anbieters. Fahr auf die nächste Fläche oder aus der Zone hinaus: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Mach am Ende ein Foto vom abgestellten Scooter, auch wenn die App keins verlangt: Es belegt, wie du ihn hinterlassen hast, falls der Anbieter später eine Gebühr verlangt.',
      ],
    },
    {
      heading: 'Was kostet Falschparken mit dem E-Scooter?',
      blocks: [
        'Behinderst du mit dem abgestellten Scooter andere, können die kommunale Verkehrsüberwachung oder die Polizei nach dem allgemeinen Bussgeldkatalog 20 € verlangen. Ab 1. März 2027 kostet unzulässiges Parken auf Geh- oder Radweg ab 55 €.',
        'Dazu kommt, was die Anbieter selbst berechnen:',
        {
          table: {
            caption: 'Was die Anbieter fürs Falschparken berechnen (deutsche Nutzungsbedingungen, Stand Oktober 2026)',
            head: ['Anbieter', 'Was es kosten kann'],
            rows: [
              ['Dott', 'Bis 300 € fürs Einsammeln, wenn du Anweisungen zum Abstellen oder Abschliessen missachtest; Bussgelder der Behörden plus 50 € Bearbeitungsgebühr'],
              ['Voi', '25 € bei einem Verstoss gegen die Parkregeln, wobei Voi möglichst zuerst mahnen will; Bussgelder und Gebühren der Behörden gibt Voi an dich weiter'],
              ['Bolt', '15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist; bis 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs; Bussgelder plus bis 30 € Bearbeitungsgebühr (Bedingungen seit 2023, auch ab 1. Dezember 2026)'],
              ['Lime', 'Keine feste Gebühr; Bussgelder, Abschlepp- und Verwahrkosten, die du verursachst, gibt Lime weiter'],
            ],
          },
        },
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
        'Die offizielle Seite oktoberfest.de zählt Hackerbrücke, Hauptbahnhof und Stachus zur Sperrzone ab 17 Uhr und rät: «E-Scooter und Wiesn sind keine gute Kombination.» Die Zonen und das Zeitfenster ab 17 Uhr gibt es seit 2019. Rechne 2027 mit ähnlichen Regeln und prüf sie in der App, bevor du losfährst.',
        'Bei Kontrollen rund um die Wiesn 2022 stellte die Polizei 314 Trunkenheitsfahrten mit E-Scootern fest, 2019 waren es 419. Auf dem Scooter gelten dieselben Promillegrenzen wie im Auto, mit Folgen auch für deinen Autoführerschein (siehe unten).',
      ],
    },
    {
      heading: 'E-Scooter in U-Bahn, Tram und S-Bahn: was MVG und MVV erlauben',
      blocks: [
        'Seit dem 2. April 2024 verbietet die MVG E-Scooter in U-Bahn, Tram und Stadtbus und in den U-Bahnhöfen, auch zusammengeklappt. Leih-Scooter dürfen auch nicht in S-Bahn und Regionalzug: Sie lassen sich nicht klappen, sind zu gross und zu schwer, und die Anbieter verbieten es.',
        'Deinen eigenen E-Scooter darfst du zusammengeklappt kostenlos in S-Bahn, Regionalzug und Regionalbus mitnehmen, wenn er höchstens 90 × 80 cm misst und 25 kg wiegt. Mit dem Leih-Scooter heisst Umsteigen: Fahrt vor dem Bahnhof beenden und am Ziel einen neuen mieten.',
        'Zum Flughafen: Laut Dotts Zonendaten liegen die Terminals ausserhalb seines Geschäftsgebiets, rechne dort also nicht mit einem Dott; die anderen Anbieter haben wir nicht geprüft. Nimm zum Flughafen die S-Bahn und den Scooter für die Stadt.',
      ],
    },
    {
      heading: 'MyRadl und MVGO: Leihrad statt E-Scooter',
      blocks: [
        '**MyRadl**, der Nachfolger von MVG Rad, ist seit dem 7. Mai 2026 das Leihradsystem für München und 36 Orte im Umland, betrieben von nextbike im MVV. Du leihst die Räder an MyRadl-Stationen aus und gibst sie dort auch zurück.',
        {
          list: [
            '**Fahrrad:** 1 € für 30 Minuten, Tagestarif 9 € pro Fahrt.',
            '**E-Bike:** 3 € für 30 Minuten, Tagestarif 18 € pro Fahrt.',
            '**Mit MVG-Abo (nicht dem 365-Euro-Ticket für Schüler) oder einem Deutschlandticket aus der MVV-App:** die ersten 30 Minuten auf dem Fahrrad gratis, auf dem E-Bike für 1,50 €.',
          ],
        },
        'Gebucht wird in der MVV-App, der nextbike-App oder in **MVGO**, wo du mit deinem M-Login auch Scooter von Dott und Voi mietest (Lime und Bolt nicht). Wo gerade ein Dott oder Voi in deiner Nähe steht, zeigt die [Live-Karte von München](map:de:München).',
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
        'In München brauchen die Anbieter bisher keine Genehmigung und zahlen der Stadt keine Gebühren; Nürnberg dagegen verlangt 50 € pro Scooter und Jahr. Alle haben die freiwillige Selbstverpflichtung in der Fassung vom April 2022 unterschrieben: je Anbieter höchstens 100 Scooter in der Altstadt und 1000 weitere innerhalb des Mittleren Rings, höchstens vier an einem Standort, falsch geparkte binnen 24 Stunden einsammeln.',
        'Die Flotte ist stark gewachsen: Laut Polizei waren es 2019 rund 4000 Leih-Scooter und 2022 rund 12 000; im April 2024 kam die Stadt laut Presse auf 18 698. Ab 1. März 2027 ist das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung kein Parken mehr; die Stadt kann es dann als Sondernutzung genehmigen. München will die freiwilligen Regeln dann in eine solche Sondernutzung mit Obergrenzen und Gebühren überführen. Einen Stadtratsbeschluss, Obergrenzen oder Gebührenbeträge dazu haben wir bis zum 12. Oktober 2026 nicht gefunden.',
      ],
    },
  ],
  faq: [
    {
      question: 'Ab welchem Alter kann ich in München einen E-Scooter mieten?',
      answer: 'Ab 18: So steht es in den Bedingungen von Dott, Lime, Voi und Bolt. Das Gesetz erlaubt E-Scooter schon ab 14 und ohne Führerschein, mit 14 bis 17 fährst du aber nur einen eigenen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter zur Wiesn fahren?',
      answer: 'Nur bis zum Äusseren Sperrring um die Theresienwiese; innerhalb des Rings galt 2026 ein Fahr- und Parkverbot. Von 17 bis 6 Uhr durftest du bis rund einen Kilometer über den Ring hinaus weder ausleihen noch abseits der Abstellflächen parken, ab 15 Uhr nur nach einem Reaktionstest in der App ausleihen. Rechne 2027 mit ähnlichen Regeln.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Altstadt nicht beenden?',
      answer: 'Innerhalb des Altstadtrings geht das nur auf ausgewiesenen Abstellflächen, und im Umkreis von 100 m um jede geteilte Abstellfläche in der Stadt nur auf der Fläche selbst. Fahr zur nächsten Fläche, die die App zeigt.',
    },
    {
      question: 'Kann ich E-Scooter in der MVGO-App ausleihen?',
      answer: 'Ja, Scooter von Dott und Voi und Räder von MyRadl, mit deinem M-Login. Lime und Bolt mietest du in ihren eigenen Apps.',
    },
    {
      question: 'Darf man im Englischen Garten E-Scooter fahren?',
      answer: 'Nein. E-Scooter gelten als Kraftfahrzeuge und sind im Englischen Garten verboten, auch abgestellt. Stell deinen Scooter ausserhalb des Parks ab und geh zu Fuss weiter.',
    },
    {
      question: 'Darf ich einen E-Scooter in die Münchner U-Bahn mitnehmen?',
      answer: 'Nein. Die MVG verbietet E-Scooter seit dem 2. April 2024 in U-Bahn, Tram und Stadtbus, auch zusammengeklappt. In die S-Bahn darf nur ein eigener, zusammengeklappter Scooter, nie ein Leih-Scooter.',
    },
  ],
  sources: [
    { title: 'Stadt München, Mobilitätsreferat: Elektrotretroller-Sharing', url: 'https://muenchenunterwegs.de/angebote/elektrotretroller-sharing' },
    { title: 'Mobilitätsreferat München: Antwort zu Abstellflächen und Sondernutzung, 30. Juni 2026', url: 'https://risi.muenchen.de/risi/dokument/v/9784088' },
    { title: 'Stadt München: Sicherheit und Kontrollen auf dem Oktoberfest 2026', url: 'https://stadt.muenchen.de/news/oktoberfest-2026-sicherheit-und-kontrollen.html' },
    { title: 'oktoberfest.de: Mit dem E-Scooter zur Wiesn', url: 'https://www.oktoberfest.de/informationen/service-fuer-besucher/mit-dem-e-scooter-zur-wiesn' },
    { title: 'MVV: Scootersharing in München und Mitnahme in Bus und Bahn', url: 'https://www.mvv-muenchen.de/vernetzte-mobilitaet/shared-mobility/scootersharing/' },
    { title: 'Bayerische Schlösserverwaltung: Englischer Garten, Hinweise für Besucher (PDF)', url: 'https://www.schloesser.bayern.de/deutsch/service/infomat/screen-pdf/engl-garten_dt.pdf' },
    { title: 'muenchen.de: MyRadl, Leihfahrräder für die Region', url: 'https://www.muenchen.de/verkehr/aktuell/myradl-im-mvv-muenchen-leihfahrraeder-fuer-die-region' },
    { title: 'Dott: Tarif für München im offenen Datenfeed (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/munich/system_pricing_plans.json' },
    { title: 'Voi: E-Scooter in München', url: 'https://www.voi.com/city/munich' },
    { title: 'Polizeipräsidium München: Wiesn-Abschlussbilanz 2022 (PDF)', url: 'https://www.polizei.bayern.de/mam/presse/pp-muenchen/pressebericht_sonderbeilage_abschlussbilanz_wiesn_2022.pdf' },
  ],
};

export default guide;
