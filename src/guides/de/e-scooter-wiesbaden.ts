import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-wiesbaden',
  topic: 'wiesbaden',
  name: 'E-Scooter Wiesbaden: Anbieter, Preise, Parken',
  title: 'E-Scooter Wiesbaden 2026: Anbieter, Preise, Parkzonen',
  description: 'E-Scooter Wiesbaden: Bolt, Dott und Voi, was eine Fahrt kostet, wo du fährst und parkst und was im Fünfeck, im Kurpark, in Mainz und im ESWE-Bus gilt.',
  headline: 'E-Scooter Wiesbaden: Anbieter, Preise, Parkzonen und Verbote',
  lede: 'E-Scooter in Wiesbaden leihst du bei Bolt, Dott oder Voi, ab 18 und ohne Führerschein. Einen Wiesbadener Tarif veröffentlicht keiner der drei: Bolt wirbt deutschlandweit mit «ab 0,15 € pro Minute» plus Freischaltgebühr, bei Dott und Voi zeigt die App den Preis (Stand 24. Oktober 2026). Du fährst auf Radweg oder Fahrbahn, nicht durch die Fussgängerzone und nicht durch den Kurpark. Am Hauptbahnhof und im Historischen Fünfeck beendest du die Fahrt nur auf einer markierten Abstellfläche, sonst meist am Rand des Gehwegs.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'de:Wiesbaden',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Wiesbaden?',
      blocks: [
        'In Wiesbaden verleihen laut Stadt «aktuell» drei Anbieter E-Scooter: **Bolt**, **Dott** und **Voi** (undatierte Seite, gelesen am 24. Oktober 2026). Lime steht nicht darauf. Gemietet wird in der App des Anbieters, laut deren Bedingungen erst ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Jeder Anbieter braucht eine Sondernutzungserlaubnis der Stadt, die er laut Stadt «quartalsweise» beantragt und die an Auflagen gebunden ist. Dafür zahlt er laut Gebührenverzeichnis der Sondernutzungssatzung (Fassung seit 1. Januar 2024) für die «gewerbliche Nutzung von E-Tretrollern» 7,50 € «pro Quartal und Roller». Eine feste Obergrenze für die Zahl der Scooter nennt die Stadt nicht.',
        'Die [Karte von Wiesbaden](map:de:Wiesbaden) zeigt Dott und Voi, mit Standort und Akkustand: am Samstag, 24. Oktober 2026, kurz vor 16 Uhr rund 1650 Scooter, gut 1200 von Dott und rund 400 von Voi. Das ist eine Momentaufnahme, keine Flottengrösse. Die Zahl umfasst Wiesbaden samt Kastel, Kostheim und Amöneburg und kaum Scooter aus Mainz, mit einer Ausnahme: Die Voi-Scooter in Kastel und Kostheim zählt die Karte bei Mainz mit, am Abend rund 90. Preise, Zonen und Abstellflächen zeigt nur die App des Anbieters; Bolt findest du nur in seiner App.',
        'Nicht verwechseln: Die «Wies-e»-Roller von Süwag2GO sind Elektro-Mopeds bis 45 km/h, für die du einen Führerschein der Klasse B oder AM brauchst.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Wiesbaden?',
      blocks: [
        'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Bolt wirbt für Deutschland mit «ab 0,15 € pro Minute», einer kleinen Freischaltgebühr und einem Abo mit unbegrenzten Freischaltungen ab 0,99 € im Monat; der Minutenpreis hängt laut Bolt vom Ort ab. Was Falschparken kostet, steht in den deutschen Bedingungen der Anbieter:',
        {
          table: {
            caption: 'E-Scooter-Anbieter in Wiesbaden: Preis, Gebühren und Hotline (Stand 24. Oktober 2026)',
            head: ['Anbieter', 'Preis', 'Falsch geparkt (laut Bedingungen)', 'Hotline laut Stadt'],
            rows: [
              ['Bolt', 'ab 0,15 € pro Minute plus Freischaltgebühr (für Deutschland)', '15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist; bis 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs (Bedingungen seit 2023, auch ab 1. Dezember 2026)', '+49 30 568 373 989'],
              ['Dott', 'in der App', 'bis 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst; 50 € Verwaltungsgebühr, wenn Dott ein Bussgeld für dich zahlt (Bedingungen vom September 2025)', '+49 30 466 90 493'],
              ['Voi', 'in der App', 'in den Bedingungen in der Voi-App', '+49 157 35993270'],
            ],
          },
        },
        'Bussgelder der Behörden kommen dazu.',
      ],
    },
    {
      heading: 'Wo darf man in Wiesbaden mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen und Radfahrstreifen, auf Geh- und Radwegen, in Fahrradstrassen und auf den Wiesbadener Umweltspuren; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg, Fussgängerzone und Busspur sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Gegen die Fahrtrichtung einer Einbahnstrasse darfst du mit «Elektrokleinstfahrzeuge frei». Bei «Radverkehr frei» ist es bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt dich mitfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei», und so schreibt es auch die Stadt. Ab 1. März 2027 ist es erlaubt, wo «Radverkehr frei» die Einbahnstrasse öffnet. Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Wiesbaden was gilt (Stand 24. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzone, etwa die Langgasse', 'Absteigen und schieben. Ein Schild «Radverkehr frei» gilt dort bis Ende Februar 2027 nicht für E-Scooter', 'Bund; Stadt- und Landespolizei kontrollieren'],
              ['Kurpark', '«Elektroroller» ohne gesonderte Erlaubnis weder fahren noch abstellen', 'TriWiCon, Eigenbetrieb der Stadt, in der Kurparkordnung (Stand Juni 2021)'],
              ['Hauptbahnhof und Historisches Fünfeck', 'Fahrt nur auf einer markierten Abstellfläche beenden', 'Stadt'],
              ['Park- und Grünflächen', 'Nicht abstellen', 'Stadt'],
            ],
          },
        },
        'Ein Nachtfahrverbot oder eine Winterpause für Leih-Scooter nennt die Stadt nicht (Stand 24. Oktober 2026).',
      ],
    },
    {
      heading: 'E-Scooter in Wiesbaden parken: Hauptbahnhof und Historisches Fünfeck',
      blocks: [
        'Am Hauptbahnhof und im **Historischen Fünfeck**, der Kerninnenstadt, gibst du einen Leih-Scooter laut Stadt «ausschliesslich» auf den farbig markierten Abstellflächen zurück, die sie eingerichtet hat; ausserhalb davon lässt sich die Miete nicht beenden. Das Fünfeck liegt zwischen Rheinstrasse, Schwalbacher Strasse, Röderstrasse, Taunusstrasse und Wilhelmstrasse. Die ersten Flächen entstanden 2023 am Hauptbahnhof, Ende 2024 kamen rund 30 im Fünfeck dazu.',
        'Es wirkt: Die Beschwerden über falsch abgestellte Scooter in den Zonen sind laut Magistrat «nahezu vollständig zurückgegangen» (Antwort auf eine Anfrage der SPD, September 2025).',
        'Ausserhalb der Zonen parkst du frei, meist auf dem Gehweg, parallel am Rand, sodass niemand behindert wird; Bolt verlangt laut seinen Bedingungen (seit 2023, auch ab 1. Dezember 2026) mindestens 1,60 m freien Gehweg. Nicht abstellen darfst du laut Stadt:',
        {
          list: [
            'auf Radwegen, an Kreuzungen und in Ein- und Ausfahrten;',
            'vor Fluchtwegen und Feuerwehrzufahrten;',
            'unmittelbar an Haltestellen und an Baustellen;',
            'auf Blindenleitsystemen;',
            'in Park- und Grünflächen; im Kurpark verbietet es auch die Kurparkordnung.',
          ],
        },
        'Zum Fahrtende fotografierst du den Scooter in der App. Steht dir ein Scooter im Weg, meldest du ihn an der Hotline des Anbieters oder für alle drei auf scooter-melder.de.',
        {
          note: 'Lässt dich die App am Hauptbahnhof oder im Fünfeck die Fahrt nicht beenden, stehst du neben statt auf einer Abstellfläche. Fahr zur nächsten, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Kontrollen und Bussgelder in Wiesbaden',
      blocks: [
        'Stadtpolizei und Landespolizei kontrollieren gemeinsam. Am 25. Juni 2026 zählten sie 34 Verstösse: 12 Fahrende in der Fussgängerzone, 3 auf dem Gehweg, 4 Scooter mit mehreren Personen und 3 Verstösse gegen die Versicherungspflicht. In der Langgasse und am Michelsberg, so die Stadtpolizei, muss man auf Scooter nicht lange warten; die Kontrollen gehen weiter.',
        'Am 30. September 2026 stoppte die Stadtpolizei in der Klarenthaler Strasse einen E-Scooter ohne Versicherungskennzeichen, der getunt bis zu 50 km/h schaffte. So ein Fahrzeug gilt laut Stadt als Motorroller oder Motorrad: Ohne Führerschein der Klasse AM oder A1 ist die Fahrt eine Straftat.',
        'Sonst gelten die deutschen Regeln: keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden; ab 1. März 2027 25 €, bis 40 €.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €. **Ohne Versicherungsplakette:** 40 €.',
            '**Rote Ampel:** 60 € und ein Punkt, länger als 1 Sekunde rot 100 € und ein Punkt. **Handy in der Hand:** 100 € und ein Punkt.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot; ab 1,1 Promille eine Straftat; unter 21 oder in der Probezeit 0,0 Promille. Bolt verbietet jeden Alkohol.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Über den Rhein: Kastel, Kostheim und Mainz',
      blocks: [
        'Mainz-Kastel, Mainz-Kostheim und Mainz-Amöneburg gehören trotz ihres Namens zu Wiesbaden; dort gelten die Wiesbadener Regeln. Jenseits der Theodor-Heuss-Brücke beginnt Mainz, und dort gelten andere.',
        'Mainz begrenzt Leih-Scooter laut seiner Richtlinie vom 2. Juli 2025 auf höchstens 1200; seit dem 1. März 2026 verleihen dort drei Anbieter, mit Genehmigungen für 24 Monate. In der Innenstadt, also Alt- und Neustadt, dürfen Leih-Scooter nur auf 25 Abstellflächen stehen, zusammen höchstens 300; in Teilen der Altstadt ist das Abstellen ganz verboten. Welche Anbieter fahren, nennt die Stadt Mainz nicht; Bolt und Dott führen Mainz auf ihren Websites.',
        'Ob ein in Wiesbaden geliehener Scooter nach Mainz darf und die Fahrt dort enden kann, sagt kein Anbieter offen; Bolt und Dott verbieten in ihren Bedingungen, das Gebiet zu verlassen, das die App zeigt. Die [Karte von Mainz](map:de:Mainz) zeigt nur Voi, am 24. Oktober kurz vor 16 Uhr rund 470 Scooter, die Voi-Scooter in Kastel und Kostheim eingeschlossen.',
      ],
    },
    {
      heading: 'E-Scooter im Bus und Leihräder: ESWE, RMV, nextbike, meinRad',
      blocks: [
        'Wiesbaden gehört zum RMV, und dort gilt: «E-Scooter werden wie Fahrräder behandelt.» In Bus, S-Bahn und Regionalzug fahren sie kostenlos mit, ein Anspruch besteht aber nicht; Fahrgäste mit Rollstuhl oder Kinderwagen haben Vorrang, und bei wenig Platz entscheidet das Personal. Zusammengeklappte Tretroller gelten als Gepäck und dürfen jederzeit mit. Den Akku darfst du unterwegs weder herausnehmen noch laden. In ESWE-Bussen dürfen laut den Beförderungsbedingungen des Verkehrsverbunds Mainz-Wiesbaden (ab 1. Januar 2026) höchstens vier Fahrräder mit; im Zweifel entscheidet das Fahrpersonal.',
        'Ein Verbot wie bei der VGF in Frankfurt, die E-Scooter seit Oktober 2024 aus U-Bahn und Strassenbahn verbannt, haben weder ESWE noch RMV veröffentlicht (Stand 24. Oktober 2026). Einen Leih-Scooter kannst du nicht zusammenklappen, und RMV und ESWE regeln ihn nicht eigens: Beende die Fahrt vor der Haltestelle, aber nicht unmittelbar an ihr, und miete am Ziel neu. Wer nach Frankfurt pendelt: [E-Scooter in Frankfurt](guide:frankfurt).',
        'Lieber Fahrrad? Die Stadt nennt mehrere Leihsysteme:',
        {
          list: [
            '**nextbike:** rund 200 Räder; Studierende der Hochschule RheinMain fahren pro Ausleihe bis zu 60 Minuten gratis.',
            '**meinRad** aus Mainz, auch in Kastel, Kostheim und Amöneburg: 1,20 € pro 30 Minuten, höchstens 9 € in 24 Stunden (Stand 1. April 2026).',
            '**DB Call a Bike** am Hauptbahnhof.',
          ],
        },
      ],
    },
    {
      heading: 'Kurhaus, Neroberg und Theatrium: Tipps für Besucher',
      blocks: [
        '**Kurhaus und Kurpark:** Hinter dem Kurhaus zieht sich der Kurpark über 5 km bis nach Sonnenberg. Den Scooter stellst du ausserhalb ab und gehst zu Fuss weiter. Der Park ist von Mai bis September von 5 bis 23 Uhr offen, von Oktober bis April von 5 bis 20 Uhr.',
        '**Neroberg:** Die Nerobergbahn fährt seit 1888 mit Wasserballast hinauf; Fahrräder nimmt sie aus Sicherheitsgründen nicht mit, RMV-Tickets gelten dort nicht. Oben sind die Wege laut ESWE durchweg mit Kopfsteinpflaster belegt, für die kleinen Räder eines Scooters keine gute Strecke.',
        '**Theatrium:** Beim Wilhelmstrassenfest, das nächste Mal vom 11. bis 13. Juni 2027, wird die Wilhelmstrasse zur kilometerlangen Festmeile. Eine eigene Scooter-Regel nennt die Stadt dafür nicht; durch die Menge schiebst du.',
        '**Hauptbahnhof:** Die Fahrt endet nur auf einer markierten Fläche. Freie Dott- und Voi-Scooter zeigt die [Live-Karte von Wiesbaden](map:de:Wiesbaden).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Wiesbaden?',
      answer: 'Bolt, Dott und Voi: Diese drei Anbieter nennt die Stadt (Stand Oktober 2026). Du mietest in ihrer App, ab 18 und ohne Führerschein. Dott und Voi zeigt auch unsere Live-Karte, Bolt nur seine App.',
    },
    {
      question: 'Was kostet ein E-Scooter in Wiesbaden?',
      answer: 'Einen Wiesbadener Tarif veröffentlicht keiner der drei. Bolt wirbt deutschlandweit mit ab 0,15 € pro Minute plus Freischaltgebühr; Dott und Voi zeigen den Preis in der App. Verbindlich ist, was die App vor dem Entsperren anzeigt.',
    },
    {
      question: 'Wo parke ich einen E-Scooter in der Wiesbadener Innenstadt?',
      answer: 'Im Historischen Fünfeck und am Hauptbahnhof nur auf einer der markierten Abstellflächen, im Fünfeck gibt es rund 30. Daneben lässt dich die App die Fahrt nicht beenden, und die Miete läuft weiter.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Langgasse fahren?',
      answer: 'Nein, sie ist Fussgängerzone: absteigen und schieben. Fahren kostet 15 €, ab 1. März 2027 25 €, und Stadt- und Landespolizei kontrollieren dort.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Kurpark fahren?',
      answer: 'Nein. Die Kurparkordnung der städtischen TriWiCon verbietet, ohne gesonderte Erlaubnis mit Elektrorollern zu fahren oder sie abzustellen. Auch die Stadt erlaubt kein Abstellen in Park- und Grünflächen.',
    },
    {
      question: 'Kann ich mit dem E-Scooter nach Mainz fahren?',
      answer: 'Bolt und Dott verbieten, das Gebiet zu verlassen, das ihre App zeigt; ob Mainz dazugehört und ob die Fahrt dort enden darf, siehst du dort. In der Mainzer Innenstadt geht das seit März 2026 nur an einer von 25 Abstellflächen. Kastel und Kostheim gehören ohnehin zu Wiesbaden.',
    },
    {
      question: 'Darf ich meinen E-Scooter im ESWE-Bus mitnehmen?',
      answer: 'Ja, wenn Platz ist: Der RMV behandelt E-Scooter wie Fahrräder, zusammengeklappte Tretroller gelten als Gepäck. Ein Verbot hat ESWE nicht veröffentlicht. Einen Anspruch hast du aber nicht, Rollstühle und Kinderwagen haben Vorrang, und im Zweifel entscheidet das Fahrpersonal.',
    },
  ],
  sources: [
    { title: 'Stadt Wiesbaden: E-Tretroller in Wiesbaden', url: 'https://www.wiesbaden.de/leben-wohnen/mobilitaet/sharing-dienst/e-tretroller' },
    { title: 'Stadt Wiesbaden: Sondernutzungssatzung mit Gebührenverzeichnis (PDF)', url: 'https://www.wiesbaden.de/medien/downloads/rathaus/6-6.1-Sondernutzungssatzung.pdf' },
    { title: 'Stadt Wiesbaden: Fussgängerzone für Tretroller tabu (26. Juni 2026)', url: 'https://www.wiesbaden.de/pressemitteilungen/pressereferat/juni/fussgaengerzone-fuer-tretroller-tabu-stadt-und-landespolizei-setzen-e-scooter-kontrollen-fort' },
    { title: 'Stadt Wiesbaden: Stadtpolizei kontrolliert E-Scooter (16. Oktober 2026)', url: 'https://www.wiesbaden.de/pressemitteilungen/pressereferat/oktober/stadtpolizei-wiesbaden-kontrolliert-e-scooter' },
    { title: 'Merkurist: Neue Regelung für E-Scooter im Fünfeck (10. Dezember 2024)', url: 'https://merkurist.de/wiesbaden/neue-regelung-stadt-wiesbaden-greift-bei-e-scootern-durch_YrkU' },
    { title: 'Wiesbadenaktuell: Abstellchaos passé dank Zonen (27. September 2025)', url: 'https://wiesbadenaktuell.de/2025/09/27/e-scooter-in-wiesbaden-abstellchaos-passe-dank-smarter-zonen/' },
    { title: 'TriWiCon: Kurparkordnung, Stand Juni 2021 (PDF)', url: 'https://kurhaus.wiesbaden.de/downloads/kurpark/20210618_Kurparkordnung.pdf' },
    { title: 'Stadt Mainz: Neuordnung der Parkregelung für E-Tretroller (27. Februar 2026)', url: 'https://www.mainz.de/pressemeldungen/Mainz/2026/februar/neuordnung-der-parkregelegung-fuer-e-tretroller' },
    { title: 'RMV: Mitnahme von Fahrrädern, E-Scootern und Co.', url: 'https://www.rmv.de/c/de/tickets/regeln/tarifinformationen/mitnahme-von-fahrraedern-e-scootern-und-co' },
    { title: 'ESWE Verkehr: Besondere Beförderungsbedingungen VMW (PDF)', url: 'https://www.eswe-verkehr.de/fileadmin/Rechtliches/Besondere_Befoerderungsbedingungen_VMW.pdf' },
    { title: 'ESWE Verkehr: Häufige Fragen', url: 'https://www.eswe-verkehr.de/faq.html' },
    { title: 'Bolt: E-Scooter in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Stadt Wiesbaden: Bikesharing', url: 'https://www.wiesbaden.de/leben-wohnen/mobilitaet/sharing-dienst/bikesharing' },
  ],
};

export default guide;
