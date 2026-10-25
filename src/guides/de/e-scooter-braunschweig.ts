import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-braunschweig',
  topic: 'braunschweig',
  name: 'E-Scooter Braunschweig: Anbieter, Preise, Parken',
  title: 'E-Scooter Braunschweig 2026: Anbieter, Preise, Parken',
  description: 'E-Scooter Braunschweig: die vier Anbieter, was über Preise bekannt ist, Stationen in der Okerumflut, Fahren im Park und die Mitnahme in Bus und Tram.',
  headline: 'E-Scooter Braunschweig: Anbieter, Preise und warum du in der Innenstadt nur an Stationen parkst',
  lede: 'E-Scooter in Braunschweig leihst du ab 18 und ohne Führerschein bei Bolt, Dott, Ryde oder Voi. Einen Braunschweiger Tarif fanden wir bei keinem der vier offen; den Preis zeigt die App vor dem Entsperren. Du fährst auf dem Radweg, nicht auf dem Gehweg und nicht durch die Fussgängerzone; auf den Wegen der städtischen Parks erlaubt die Parksatzung E-Scooter ausdrücklich, Fussgänger haben dort Vorrang. Innerhalb der Okerumflut stellst du den Scooter nur an markierten Stationen ab. Zusammengeklappt fährt dein eigener Scooter kostenlos in Bus und Tram mit.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Braunschweig',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Braunschweig?',
      blocks: [
        'Laut Stadt Braunschweig (undatierte Seite, gelesen am 25. Oktober 2026) sind vier Verleiher im Stadtgebiet tätig: **Bolt**, **Ryde**, **TIER**, das heute Dott heisst, und **Voi**. Bolt, Dott und Ryde führen Braunschweig auch auf ihren eigenen Seiten. Voi kam laut seiner Mitteilung vom März 2025 am 1. April 2025 mit rund 800 Scootern dazu, «bis in die Aussenbezirke». Lime steht nicht auf der Liste der Stadt.',
        'Du leihst den Scooter in der App des Anbieters, ab 18 und ohne Führerschein. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte von Braunschweig](map:de:Braunschweig) Dott und Voi: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 1150 Scooter, knapp 600 von Dott und gut 550 von Voi. Sie standen im ganzen Stadtgebiet, in den äusseren Stadtbezirken dünner; in Wolfenbüttel stand in der Nacht darauf keiner. Das ist eine Momentaufnahme, keine Flottengrösse. Die Karte zeigt nur, wo die Scooter stehen, keine Preise, Zonen oder Stationen. Bolt und Ryde fehlen; ihre Scooter findest du nur in ihren Apps.',
        'Eine Genehmigung der Stadt braucht ein Verleih laut Stadt grundsätzlich nicht. Stattdessen sollen Anbieter und Stadt eine Qualitätsvereinbarung unterzeichnen (Vorlage von Dezember 2021), laut ihrem § 12 «für keine Partei verbindlich». Sie sieht höchstens 100 Scooter je Anbieter innerhalb der Okerumflut (Zone A1) vor und höchstens fünf je Standort (100 m Umkreis), wenn der Anbieter sie aufstellt. Liegen seine Scooter ein Jahr lang unter 2 bis 3 Fahrten am Tag, soll er ihre Zahl anpassen.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Braunschweig?',
      blocks: [
        'Einen Braunschweiger Tarif nennt kein Anbieter offen; den Preis zeigt die App vor dem Entsperren.',
        {
          table: {
            caption: 'Was die Anbieter offen zu Preisen sagen (gelesen am 25. Oktober 2026)',
            head: ['Anbieter', 'Preis laut offener Quelle', 'Pässe', 'Auf der ScootRadar-Karte'],
            rows: [
              ['Bolt', 'Bundesweit «ab 0,15 € pro Minute» plus Freischaltgebühr, je nach Ort verschieden', 'Wochen- und Monatspässe; unbegrenzt Freischalten ab 0,99 € im Monat', 'Nein, nur in der Bolt-App'],
              ['Dott', 'Nur in der App', 'Pässe laut AGB, Preise in der App', 'Ja'],
              ['Ryde', 'Nur in der App; angefangene Minuten zählen voll', 'Gilt nur in der Stadt, in der du ihn kaufst', 'Nein, nur in der Ryde-App'],
              ['Voi', 'Nur in der App', 'Laut Startmitteilung vom März 2025: Tages-, Wochen- und Monatspässe ab 3,49 €', 'Ja'],
            ],
          },
        },
        'Teuer wird Falschparken. Bolt verlangt laut seinen Bedingungen (seit 2023, auch ab 1. Dezember 2026) 15 € Parkgebühr, wenn der Scooter falsch steht und kein deutliches Foto am Fahrtende das Gegenteil belegt, und bis zu 100 € Abholgebühr ausserhalb des zulässigen Parkbereichs. Dott kann laut AGB vom September 2025 bis zu 300 € für die Rückholung berechnen, wenn du seine Park- und Sperranweisungen nicht befolgst; wo eine Gemeinde Parkplätze ausweist, parkst du nur dort. Bei Ryde trägst du laut AGB die Kosten, wenn dein Parkfoto fehlt und eine Behörde Ryde dafür ein Verwarnungs- oder Bussgeld auferlegt.',
        'Auch das Stationssystem kann Geld kosten: Stellst du den Scooter innerhalb der Okerumflut ausserhalb einer Station ab, «läuft die Berechnung der Nutzungsentgelte weiter», schrieb die Stadt zum Start im Oktober 2022.',
      ],
    },
    {
      heading: 'Wo darf man in Braunschweig mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, Radfahr- oder Schutzstreifen oder in der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Auf gemeinsamen Geh- und Radwegen haben Fussgänger Vorrang. Gehwege sind tabu (15 €, ab 1. März 2027 25 €), ebenso Fussgängerzonen, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es; ab 1. März 2027 reicht auch «Radverkehr frei», dann im Schritttempo. Diese Regeln setzt der Bund.',
        '**Fussgängerzone:** In der Parkverbotszone «Fussgängerzone» der Stadt liegen unter anderem Schuhstrasse, Hutfiltern, Kohlmarkt, Sack, Damm, Neue Strasse, Burgplatz und Domplatz. Ob du dort fahren darfst, entscheidet das Schild an der Einfahrt; ohne Freigabe schiebst du.',
        '**Parks:** Die Park- und Grünanlagensatzung der Stadt vom 27. Juni 2023 erlaubt auf den Wegen in Park- und Grünanlagen ausdrücklich Elektrokleinstfahrzeuge, «zum Beispiel E-Scooter»; dem Fussgängerverkehr ist «Vorrang einzuräumen». Das gilt etwa im Bürgerpark, Prinz-Albrecht-Park, Theaterpark und in Viewegs Garten. Abseits der Wege ist das Fahren mit Kraftfahrzeugen, laut Stadt auch E-Scooter, verboten, ebenso das Abstellen ausserhalb ausgewiesener Flächen. Verstösse kann die Stadt mit bis zu 5000 € ahnden.',
        '**Ringgleis:** Rund um die Kernstadt führt laut Stadt das Ringgleis, ein 22,5 km langer kombinierter Fuss- und Radweg auf oder nahe der früheren Industriebahntrasse. Piktogramme der Stadt mahnen dort «Gemeinsam mit Rücksicht».',
        '**Einbahnstrassen:** Bei «Radverkehr frei» ist die Lage bis Ende Februar 2027 widersprüchlich: Die StVO lässt dich mitfahren, die eKFV verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist die Gegenrichtung erlaubt, wo «Radverkehr frei» sie öffnet.',
        '**Tempo und Nacht:** Eigene Tempo- oder Fahrverbotszonen der Stadt für E-Scooter und ein Nachtfahrverbot haben wir nicht gefunden. Was ein Anbieter per Geofencing sperrt oder bremst, zeigt seine App.',
      ],
    },
    {
      heading: 'E-Scooter in Braunschweig abstellen: Okerumflut, Hauptbahnhof, Parks',
      blocks: [
        'Seit Oktober 2022 gilt in der Innenstadt innerhalb der Okerumflut ein Stationssystem: Abstellen geht laut Stadt nur auf Flächen, die in den Apps und vor Ort markiert sind. Zum Start waren es 27 für je etwa 10 bis 30 Scooter, am Rand breiter Gehwege oder auf früheren Autostellplätzen. Weitere Parkzonen gibt es laut Stadt am Bahnhofsvorplatz und vereinzelt ausserhalb der Okerumflut.',
        'Sonst stellst du den Scooter frei ab, ohne jemanden zu behindern oder zu gefährden, und so, dass er nicht umkippt. Nach der unverbindlichen Vereinbarung der Stadt mit den Verleihern sollen 1,60 m Gehweg frei bleiben.',
        {
          table: {
            caption: 'Wo du in Braunschweig nicht oder nur an Stationen abstellst (Auswahl aus 55 Parkverbotszonen der Stadt seit 1. Oktober 2025 und aus der unverbindlichen Vereinbarung)',
            head: ['Ort', 'Was gilt'],
            rows: [
              ['Innenstadt innerhalb der Okerumflut', 'Nur an den markierten Stationen'],
              ['Bahnhofsvorplatz am Hauptbahnhof', 'Nur auf den markierten Parkzonen'],
              ['Fussgängerzone, Schlossplatz, Schlosspassage, Platz der Deutschen Einheit, Vorplatz des Staatstheaters', 'Kein Abstellen'],
              ['Bürgerpark, Prinz-Albrecht-Park, Stadtpark, Viewegs Garten, Botanischer Garten, Gaussberg, Hauptfriedhof und sieben weitere Friedhöfe', 'Kein Abstellen'],
              ['Oker: 15 Zonen an Brücken, das Ufer am Juteweg und eine eigene Oker-Schutzzone; Dowesee, Ölper See, Teile des Ringgleises', 'Kein Abstellen'],
              ['Eintracht-Stadion (West-, Süd- und Osteingang), Stadthalle, Messegelände', 'Kein Abstellen'],
              ['Blindenleitstreifen, Zugänge zu Bus und Tram, Ampeln und Überwege, Fahrradbügel, Schulhöfe, Spielplätze', 'Freihalten (unverbindliche Vereinbarung)'],
            ],
          },
        },
        'Die Verbotszonen legt die Stadt fest. Durchsetzen sollen sie laut der unverbindlichen Vereinbarung die Anbieter, etwa per Geofencing in ihren Apps, und falsch abgestellte Scooter binnen 24 Stunden umverteilen.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder ausserhalb des Gebiets. Fahr zur nächsten Station oder erlaubten Stelle; solange die Fahrt läuft, zahlst du. Verlangt die App ein Foto, mach es deutlich.',
        },
        'Für rücksichtslos geparkte E-Scooter kündigt die Stadt Ordnungswidrigkeitsverfahren an; die Parkraumüberwachung achtet auch auf sie. Laut Stadt gilt: «Adressat einer Verwarnung ist nicht der Halter eines Fahrzeugs (also hier die Verleihfirma), sondern derjenige, der das Fahrzeug rücksichtslos abgestellt hat.»',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Braunschweig: Bussgelder und Alkohol',
      blocks: [
        'In Braunschweig gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Nebeneinander gefahren', '15 €, bis 30 €', 'erlaubt, wenn niemand behindert wird'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot 100 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 €', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto. Wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall; der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        'Ab 1. März 2027 gilt: Stellt ein Anbieter seine Leih-Scooter auf, ist das kein Parken; stellst du einen nach der Fahrt ab, schon. Alles Weitere steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Bus, Tram und Zug: BSVG und VRB',
      blocks: [
        'In Bus, Tram und Zug gelten die Beförderungsbedingungen des Verkehrsverbunds Region Braunschweig (VRB). Anders als die ÜSTRA in [Hannover](guide:hanover), die E-Tretroller seit 1. April 2024 auch zusammengeklappt ausschliesst, nimmt die BSVG sie laut ihren FAQ mit (gelesen am 25. Oktober 2026).',
        {
          list: [
            '**Zusammengeklappt:** Dein eigener E-Scooter fährt kostenlos mit wie ein Gepäckstück, wenn er Sicherheit und Ordnung nicht gefährdet und Platz ist. Einen Anspruch hast du nicht; im Einzelfall entscheidet das Fahrpersonal.',
            '**Nicht klappbar oder nicht geklappt:** Dann gilt er wie ein Fahrrad und braucht eine Fahrradtageskarte, 3,20 € im ganzen VRB (Preis seit 1. Januar 2026). Einen Platz garantiert die BSVG nicht.',
            '**Akku:** Er bleibt während der ganzen Fahrt fest montiert; laden darfst du ihn nicht, einen Ersatzakku nicht mitnehmen (Bedingungen vom 1. Juli 2026).',
          ],
        },
        '**Leih-Scooter** lassen sich nicht zusammenklappen. Beende die Fahrt vor der Haltestelle und halte die Zugänge zu Bus und Tram frei.',
        '**VELOLEO:** Das Leihrad von nextbike kostet 1 € pro 30 Minuten, höchstens 10 € je 24 Stunden. Studierende der TU Braunschweig fahren mit CAMPUSbike die ersten 30 Minuten gratis. Zurück gibst du das Rad an einer der rund 185 Stationen, sonst kostet es 20 €. Auf der ScootRadar-Karte ist VELOLEO nicht zu sehen.',
      ],
    },
    {
      heading: 'Eintracht, Schoduvel und Kurioses',
      blocks: [
        '**Eintracht-Stadion:** Eine eigene Spieltagsregel für E-Scooter fanden wir weder bei der Stadt noch beim Verein. West-, Süd- und Osteingang sind aber immer Parkverbotszonen; beende die Fahrt ein Stück entfernt. Den nächsten Dott oder Voi zeigt die [Live-Karte von Braunschweig](map:de:Braunschweig).',
        '**Grossveranstaltungen:** Bei Ereignissen wie dem Karnevalsumzug Schoduvel sollen die Anbieter laut der unverbindlichen Vereinbarung auf Wunsch von Stadt oder Polizei weitere Flächen freihalten und dort die Rückgabe sperren.',
        {
          list: [
            '**Scooter in der Oker:** Seit 1. Oktober 2025 gilt entlang der Oker eine eigene Parkverbotszone der Stadt, «gegen Vandalismus bzgl. Scooter-Funde in der Oker».',
            '**Mehr Anbieter:** 2022 zählte die Stadt rund 2000 Leih-Scooter von drei Anbietern, heute nennt sie vier.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Braunschweig?',
      answer: 'Laut Stadt Bolt, Ryde, Dott (früher TIER) und Voi. Die ScootRadar-Karte zeigt Dott und Voi; Bolt und Ryde findest du nur in ihren Apps.',
    },
    {
      question: 'Was kostet ein E-Scooter in Braunschweig?',
      answer: 'Einen Braunschweiger Tarif fanden wir bei keinem Anbieter offen. Bolt wirbt bundesweit mit «ab 0,15 € pro Minute» plus Freischaltgebühr (Stand 25. Oktober 2026), Voi nannte zum Start 2025 Pässe ab 3,49 €. Verbindlich ist die App.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Innenstadt nicht beenden?',
      answer: 'Innerhalb der Okerumflut darfst du Leih-Scooter nur an markierten Stationen abstellen; die Apps zeigen sie. Ausserhalb einer Station läuft laut Stadt die Berechnung weiter.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Bürgerpark fahren?',
      answer: 'Ja, auf den Wegen: Die Park- und Grünanlagensatzung nennt «E-Scooter» dort ausdrücklich, Fussgänger haben Vorrang. Abstellen darfst du im Bürgerpark nicht.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus und Tram mitnehmen?',
      answer: 'Ja, im VRB: zusammengeklappt kostenlos, sonst mit Fahrradtageskarte für 3,20 €, wenn Platz ist und das Fahrpersonal zustimmt. Leih-Scooter lassen sich nicht klappen.',
    },
    {
      question: 'Gibt es Leih-Scooter in Wolfenbüttel?',
      answer: 'Auf der ScootRadar-Karte stand in der Nacht zum 25. Oktober 2026 kein Dott oder Voi in Wolfenbüttel. Dott und Ryde führen die Stadt nicht unter ihren Standorten, Bolt hat keine Seite für sie.',
    },
  ],
  sources: [
    { title: 'Stadt Braunschweig: E-Tretrollersharing', url: 'https://www.braunschweig.de/leben/stadtplan_verkehr/sharing_Angebote/e-tretrollersharing.php' },
    { title: 'Stadt Braunschweig: Elektrokleinstfahrzeuge', url: 'https://www.braunschweig.de/leben/stadtplan_verkehr/e-mobilitaet/elektrokleinstfahrzeuge.php' },
    { title: 'Stadt Braunschweig: Qualitätsvereinbarung E-Scooter (PDF)', url: 'https://www.braunschweig.de/leben/stadtplan_verkehr/sharing_Angebote/E-Scooter_Qualitaetsvereinbarung.pdf' },
    { title: 'Stadt Braunschweig: Presseinformation 790/2022, Stationssystem (PDF)', url: 'https://www.braunschweig.de/politik_verwaltung/ob/textarchiv/textarchiv-2022/790_E_Scooter_stationsbasiertes-System_2610.pdf' },
    { title: 'Open Data Braunschweig: E-Tretroller Parkverbotszonen', url: 'https://opendata.braunschweig.de/dataset/e-tretroller-parkverbotszonen' },
    { title: 'Stadt Braunschweig: Park- und Grünanlagensatzung vom 27. Juni 2023 (PDF)', url: 'https://www.braunschweig.de/politik_verwaltung/politik/stadtrecht/3_03_Park-und-Gruenanlagensatzung.pdf' },
    { title: 'Stadt Braunschweig: Ringgleis', url: 'https://www.braunschweig.de/leben/im_gruenen/ringgleis/index.php' },
    { title: 'Stadt Braunschweig: Karneval in der Löwenstadt', url: 'https://www.braunschweig.de/leben/innenstadt/veranstaltungen/karneval/karneval.php' },
    { title: 'VRB: Beförderungsbedingungen, Stand 1. Juli 2026 (PDF)', url: 'https://www.vrb-online.de/files/media/tickets/tarifbestimmungen-befoerderungsbedingungen/vrb-befoerderungsbedingungen.pdf' },
    { title: 'VRB: Fahrradtageskarte', url: 'https://www.vrb-online.de/de/tickets/ticketuebersicht/details/fahrradtageskarte' },
    { title: 'BSVG: Häufige Fragen', url: 'https://www.bsvg.net/faq' },
    { title: 'Bolt in Braunschweig', url: 'https://bolt.eu/de-de/cities/braunschweig/' },
    { title: 'Bolt: E-Scooter in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge in Deutschland', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Ryde: Locations', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://www.ryde-technology.com/terms-conditions-germany' },
    { title: 'Voi: Start in Braunschweig (27. März 2025, PDF)', url: 'https://storage.mfn.se/b4f30dee-4cbc-4ca6-bee9-f80beae58514/e-scooter-anbieter-voi-startet-in-braunschweig.pdf' },
    { title: 'VELOLEO (nextbike): Tarife', url: 'https://www.nextbike.de/veloleo/de/' },
    { title: 'VELOLEO: CAMPUSbike', url: 'https://www.nextbike.de/veloleo/de/campusbike/' },
  ],
};

export default guide;
