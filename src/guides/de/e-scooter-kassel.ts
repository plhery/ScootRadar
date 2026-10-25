import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-kassel',
  topic: 'kassel',
  name: 'E-Scooter Kassel: Anbieter, Preise, Parken',
  title: 'E-Scooter Kassel 2026: Anbieter, Preise, Abstellregeln',
  description: 'E-Scooter Kassel: Qick, Bolt und Dott, was eine Fahrt kostet, wo du seit April 2026 parkst und was im Bergpark, in der Karlsaue und in der Tram gilt.',
  headline: 'E-Scooter Kassel: Anbieter, Preise und wo du seit April 2026 parken darfst',
  lede: 'E-Scooter in Kassel leihst du bei Qick, Bolt oder Dott, ab 18 und ohne Führerschein; auch Zeus steht auf der Anbieterliste der Stadt. Einen Kasseler Tarif veröffentlicht keiner der Anbieter: Den Preis zeigt die App vor dem Entsperren (Stand 25. Oktober 2026). Seit dem 1. April 2026 beendest du die Fahrt nur an einem Radbügel oder auf einer markierten Abstellfläche, innerhalb des Innenstadtrings nur auf einer von 27 Flächen. Du fährst auf Radweg oder Fahrbahn, nicht durch die Fussgängerzone der Königsstrasse und weder im Bergpark Wilhelmshöhe noch in der Karlsaue.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Kassel',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Kassel?',
      blocks: [
        'Seit dem 1. April 2026 lässt die Stadt Kassel nur noch Anbieter zu, die mit ihr einen Sondernutzungsvertrag haben. Als Ansprechpartner nennt sie vier: **Qick**, **Bolt**, **Dott** (früher TIER) und **Zeus**. Laut HNA waren im Juli 2026 rund 2950 Leih-Scooter von Bolt, Qick und Dott unterwegs; Zeus hatte nach Angaben der Stadt eine Erlaubnis, aber noch keine Scooter aufgestellt (HNA, 23. Juli 2026). Ob Zeus inzwischen fährt, wissen wir nicht.',
        'Qick kommt aus Schweden und verleiht auch in Göttingen: [E-Scooter in Göttingen](guide:goettingen). Bolt führt Kassel im Oktober 2026 auf seiner Stadtseite mit E-Scootern, Dott in seiner Liste der Standorte. Gemietet wird in der App des Anbieters, bei allen erst ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Kassel](map:de:Kassel) zeigt Qick und seit dem 25. Oktober 2026 auch Bolt, mit Standort und Akkustand: in der Nacht zum Sonntag, 25. Oktober, rund 1500 Qick-Scooter, um 0 und um 1 Uhr gezählt, am Sonntag kurz vor 14 Uhr rund 200 von Bolt. Das sind Momentaufnahmen, keine Flottengrössen. Preise, Zonen und Abstellorte zeigen nur die Apps; Dott und Zeus findest du nur dort.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Kassel?',
      blocks: [
        'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt; einen Kasseler Tarif nennt kein Anbieter. Bolt wirbt für ganz Deutschland mit «ab 0,15 € pro Minute» plus Freischaltgebühr (Stand 25. Oktober 2026); der Minutenpreis hängt laut Bolt vom Ort ab. Teuer wird es vor allem beim Parken:',
        {
          table: {
            caption: 'E-Scooter-Anbieter in Kassel: Preis und Gebühren (Stand 25. Oktober 2026)',
            head: ['Anbieter', 'Preis', 'Falsch geparkt (laut Bedingungen)'],
            rows: [
              ['Qick', 'in der App', 'bis 150 €, wenn die Stadt einen falsch geparkten Scooter entfernt; davor schützt ein Foto am Ende jeder Fahrt, das ihn am Fahrradständer oder auf einer Abstellfläche zeigt (Bedingungen ohne Datum)'],
              ['Bolt', 'bundesweit beworben: ab 0,15 € pro Minute plus Freischaltgebühr', '15 €, wenn der Scooter falsch steht und kein deutliches Abstellfoto da ist; bis 100 € Abholgebühr ausserhalb des zulässigen Parkbereichs (Bedingungen seit 2023, auch ab 1. Dezember 2026)'],
              ['Dott', 'in der App', 'bis 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst; 50 € Verwaltungsgebühr, wenn Dott ein Bussgeld für dich zahlt (Bedingungen vom 23. September 2025)'],
              ['Zeus', 'in der App', 'in den Bedingungen in der Zeus-App'],
            ],
          },
        },
        'Meldet Qick einen Schaden seiner Versicherung, zahlst du laut Bedingungen die Selbstbeteiligung von rund 600 €, wenn die Versicherung den Schaden deckt.',
      ],
    },
    {
      heading: 'E-Scooter in Kassel abstellen: nur am Radbügel oder auf markierten Flächen',
      blocks: [
        'Die Stadt schreibt: «Ausserhalb des Innenstadtrings dürfen ab dem 1. April 2026 Leih-E-Scooter nur noch an Radbügeln oder auf speziell markierten Abstellflächen im öffentlichen Strassenraum abgestellt werden.» Die Anbieter müssen ihre Apps so einstellen, dass eine Fahrt nur dort beginnen und enden kann. Anfang April 2026 zählte die Stadt knapp 2000 zulässige Abstellorte.',
        '**Innenstadt:** Innerhalb des Innenstadtrings parkst du nur auf einer der 27 markierten Flächen am Ring, etwa am Steinweg, am Ständeplatz oder am Scheidemannplatz. Sie liegen so, dass du nicht durch die Fussgängerzone musst. Die Stadt warnt: «E-Scooter ausserhalb der Flächen gelten als Behinderung. Die Stadt kann sie dann kostenpflichtig umstellen lassen.»',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, fehlt der Bügel womöglich in der Datenbank der Stadt, oder die Ortung des Handys ist ungenau. Fahr zum nächsten Abstellort, den die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Wo ein Scooter nie stehen darf, zählte die Stadt schon 2021 auf: an abgesenkten Bordsteinen, an Ampelfurten, unmittelbar an Zebrastreifen, auf dem Blindenleitsystem und in Wartebereichen und Zugängen von Haltestellen. Behindernd geparkt kostet 20 €, gefährdend 30 €; ab 1. März 2027 kostet Falschparken auf Geh- oder Radweg 55 €, mit Behinderung 70 €.',
      ],
    },
    {
      heading: 'Wo darf man in Kassel mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, Radfahr- und Schutzstreifen und, wo es nichts davon gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Solche Freigaben gibt es in Kassel laut Stadt nicht, und sie sind auch nicht vorgesehen; das schrieb sie 2021, Neueres haben wir nicht gefunden. Gegen die Fahrtrichtung einer Einbahnstrasse ist es bei «Radverkehr frei» widersprüchlich: Die StVO lässt dich mitfahren, die eKFV verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es erlaubt, wo «Radverkehr frei» sie öffnet. Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Kassel was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Obere und Untere Königsstrasse, Treppenstrasse', 'Fussgängerzone: absteigen und schieben. Lässt ein Schild dort Fahrräder zu, gilt das für E-Scooter erst ab 1. März 2027. Die Treppenstrasse ist nicht einmal für Fahrräder freigegeben', 'Bund; die Stadt ahndet Verstösse. Treppenstrasse: Niederschrift des Ortsbeirats Mitte, August 2026'],
              ['Innerhalb des Innenstadtrings', 'Fahrt nur auf einer der 27 markierten Flächen beenden', 'Stadt, über die Verträge mit den Anbietern'],
              ['Übrige Stadtteile', 'Fahrt nur an Radbügeln oder markierten Flächen beenden', 'Stadt, seit 1. April 2026'],
              ['Bergpark Wilhelmshöhe und Karlsaue', 'Nicht fahren; laut Stadt auch nicht abstellen', 'Hessen Kassel Heritage (Parkordnungen); Stadt (2021)'],
              ['Tram, Bus und RegioTram', 'Eigener Scooter nur zusammengeklappt; Leih-Scooter lassen sich nicht klappen', 'NVV (Beförderungsbedingungen)'],
            ],
          },
        },
        'Ein Nachtfahrverbot oder eine Winterpause nennt die Stadt nicht; laut Qick sind seine Scooter je nach Wetter und Saison nicht rund um die Uhr verfügbar.',
      ],
    },
    {
      heading: 'Bergpark Wilhelmshöhe und Karlsaue: E-Scooter verboten',
      blocks: [
        'Beide Parks unterhält das Land Hessen, verwaltet werden sie von Hessen Kassel Heritage. Ihre Parkordnungen (undatiert, PDFs von 2023) sagen: «Das Befahren der Wege und Strassen mit anderen als den hierfür zugelassenen Fahrzeugen ist nicht erlaubt», und «die Benutzung von Pedelecs und Segways usw.» ist verboten. Rad fahren darf man im Bergpark nur auf dem ausgewiesenen Herkules-Wartburg-Fernradweg, in der Karlsaue auch auf der Strasse «An der Karlsaue»; E-Scooter nennen die Parkordnungen dabei nicht. Verstösse können mit einem Bussgeld bis zu 10 000 € geahndet werden.',
        'Die Stadt schrieb 2021: «Verboten ist u.a. das Fahren oder Abstellen von E-Scootern im Bergpark Wilhelmshöhe oder in der Karlsaue.»',
        {
          list: [
            '**Zum Herkules und zum Schloss:** Der Bergpark liegt an einem steilen Hang: Stell den Scooter vorher an einem Radbügel ab und nimm ab dem Bahnhof Wilhelmshöhe die Tram 1 bis Wilhelmshöhe (Park) oder die Buslinie 24 der KVG: Seit Dezember 2025 fährt sie täglich von 10 bis 18 Uhr alle 30 Minuten bis zum Schloss Wilhelmshöhe.',
            '**Wasserspiele:** jedes Jahr vom 1. Mai bis 3. Oktober mittwochs, sonntags und feiertags ab 14:30 Uhr; die nächste Saison beginnt am 1. Mai 2027.',
            '**Karlsaue:** Der ebene Park an der Fulda grenzt an die Innenstadt: Scooter dort abstellen, wo die App es erlaubt, dann zu Fuss weiter.',
            '**documenta 16:** vom 12. Juni bis 19. September 2027. Eine eigene Scooter-Regel dafür hat die Stadt nicht veröffentlicht; am Fridericianum gilt heute die Innenstadtregel mit festen Flächen.',
          ],
        },
      ],
    },
    {
      heading: 'Kontrollen, Vertragsstrafen und Bussgelder in Kassel',
      blocks: [
        'Die Stadt erkennt Verstösse über ein Datenportal. Die Anbieter müssen mindestens einmal je Werktag für Ordnung sorgen und zahlen der Stadt seit April 1 € pro Scooter und Monat. Im Juli 2026 klagte ein Stadtsprecher, Scooter würden weiter «in erheblichem Umfang» abseits von Flächen und Radbügeln abgestellt; bis zum 30. Juni habe die Stadt 32 Vertragsstrafen von 25 bis 250 € pro Fall verhängt (HNA, 23. Juli 2026).',
        'Steht dir ein Scooter im Weg, wende dich zuerst an den Anbieter, mit Scooter-ID und Kennzeichen. Lässt sich das so nicht lösen, meldest du ihn der Stadt «vorzugsweise per E-Mail» an e-scooter-beschwerde@kassel.de, mit Foto, Ort, Anbieter und Kennzeichen; wer anrufen will, wählt die 115.',
        'Für dich als Fahrer gelten die deutschen Regeln: keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die wichtigsten Bussgelder:',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 € und 1 Punkt; länger als 1 Sekunde rot: 100 € und 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 € und 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
            ],
          },
        },
        'Ab 0,5 Promille drohen 500 €, 2 Punkte und 1 Monat Fahrverbot, das auch fürs Auto gilt; ab 1,1 Promille ist die Fahrt eine Straftat; unter 21 oder in der Probezeit gilt 0,0 Promille. Laut Polizei stieg die Zahl der E-Scooter-Unfälle in Kassel von 52 im Jahr 2024 auf 61 im Jahr 2025. Alles Weitere, auch was sich am 1. März 2027 ändert: [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Tram, Bus und RegioTram: KVG und NVV',
      blocks: [
        'Auf allen Linien des NVV gelten dessen Beförderungsbedingungen, also auch in den Trams, Bussen und RegioTrams der KVG; eigene E-Scooter-Regeln der KVG haben wir nicht gefunden. Dort steht (Stand 1. Januar 2026): Nach der eKFV zugelassene E-Scooter «dürfen mitgenommen werden, sofern sie zusammengeklappt sind». Die Akkus darfst du unterwegs weder herausnehmen noch laden noch als Powerbank nutzen. Ein Anspruch auf Mitnahme besteht nicht, das Personal entscheidet im Einzelfall; laut Tarifbestimmungen ist sie kostenlos.',
        'Einen Leih-Scooter kannst du nicht zusammenklappen, er darf also nicht mit: Beende die Fahrt an einem Radbügel nahe der Haltestelle und miete am Ziel neu.',
        'Lieber Fahrrad? **nextbike** verleiht in Kassel Räder an festen Stationen:',
        {
          list: [
            '**Basistarif:** 1 € pro 15 Minuten, höchstens 15 € in 24 Stunden; Rückgabe ausserhalb einer Station kostet 20 €.',
            '**Monats-Abo:** 10 €, die ersten 30 Minuten jeder Fahrt inklusive.',
            '**Studierende der Universität Kassel** fahren pro Ausleihe 60 Minuten gratis, ebenso Inhaber einer NVV-Jahreskarte oder eines JobTickets, nicht aber eines Deutschlandtickets.',
          ],
        },
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Kassel',
      blocks: [
        {
          list: [
            '**Seit September 2020** stehen Leih-Scooter in Kassel; im Frühjahr 2021 zählte die Stadt schon vier Anbieter.',
            '**950 Radbügel für 1800 Fahrräder** hat die Stadt bis Ende 2023 aufgestellt; bis 2028 sollen 800 weitere dazukommen.',
            '**Welterbe seit 2013.** Der Bergpark Wilhelmshöhe gehört seit Juni 2013 zum UNESCO-Welterbe.',
          ],
        },
        'Freie Qick- und Bolt-Scooter in deiner Nähe zeigt die [Live-Karte von Kassel](map:de:Kassel).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Kassel?',
      answer: 'Qick, Bolt und Dott; Zeus steht auf der Anbieterliste der Stadt, hatte laut HNA im Juli 2026 aber noch keine Scooter aufgestellt. Du mietest in der App, ab 18 und ohne Führerschein.',
    },
    {
      question: 'Wo darf ich in Kassel einen E-Scooter abstellen?',
      answer: 'Seit dem 1. April 2026 nur an einem Radbügel oder auf einer markierten Abstellfläche; innerhalb des Innenstadtrings nur auf einer der 27 markierten Flächen.',
    },
    {
      question: 'Was kostet ein E-Scooter in Kassel?',
      answer: 'Den Preis zeigt die App vor dem Entsperren. Bolt wirbt bundesweit mit ab 0,15 € pro Minute plus Freischaltgebühr (Stand Oktober 2026).',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Königsstrasse fahren?',
      answer: 'Nein. Die Obere und die Untere Königsstrasse sind Fussgängerzone: absteigen und schieben. Fahren kostet 15 €, ab 1. März 2027 25 €. Freigaben für E-Scooter gibt es in Kassel laut Stadt nicht (Stand 2021).',
    },
    {
      question: 'Darf ich mit dem E-Scooter in den Bergpark Wilhelmshöhe?',
      answer: 'Nein. Die Parkordnung erlaubt dort nur zugelassene Fahrzeuge, und laut Stadt sind Fahren und Abstellen im Bergpark und in der Karlsaue verboten. Zum Schloss bringt dich die KVG-Linie 24 ab dem Bahnhof Wilhelmshöhe.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Tram in Kassel mitnehmen?',
      answer: 'Einen eigenen ja, zusammengeklappt und kostenlos, wenn das Personal zustimmt; so steht es in den Bedingungen des NVV, die auch für die KVG gelten. Einen Leih-Scooter kannst du nicht zusammenklappen, er darf also nicht mit.',
    },
  ],
  sources: [
    { title: 'Stadt Kassel: Mit dem Miet-E-Scooter', url: 'https://www.kassel.de/buerger/verkehr_und_mobilitaet/mit-dem-e-scooter/miet-e-scooter.php' },
    { title: 'Stadt Kassel: Neuregelung Miet-E-Scooter (30. März 2026)', url: 'https://www.kassel.de/pressemitteilungen/maerz/neuregelung-miet-e-scooter.php' },
    { title: 'Stadt Kassel: E-Scooter, Rücksicht nehmen (31. März 2021)', url: 'https://www.kassel.de/pressemitteilungen/maerz/escooter-ruecksicht-kassel.php' },
    { title: 'Ortsbeirat Mitte: Niederschrift vom 19. August 2026 (PDF)', url: 'https://ratsinfo.kassel.de/sdnet4/sdnetrim/UGhVM0hpd2NXNFdFcExjZUYKDefTaCp-KjCt1nEniwgLdXeWnsLNMUJ0T2iGEnzC/Oeffentliche_Niederschrift_Ortsbeirat_Mitte_19.08.2026.pdf' },
    { title: 'HNA: Stadt verhängt Vertragsstrafen (23. Juli 2026)', url: 'https://www.hna.de/kassel/scooter-stehen-weiter-im-weg-stadt-verhaengt-vertragsstrafen-94410496.html' },
    { title: 'Hessen Kassel Heritage: Parkordnung Bergpark Wilhelmshöhe (PDF)', url: 'https://a.storyblok.com/f/96181/x/099a9189d9/parkordnung-bergpark.pdf' },
    { title: 'Hessen Kassel Heritage: Parkordnung Karlsaue (PDF)', url: 'https://a.storyblok.com/f/96181/x/c0934481f8/parkordnung-karlsaue.pdf' },
    { title: 'NVV: Beförderungsbedingungen, Stand 1. Januar 2026 (PDF)', url: 'https://www.nvv.de/fileadmin/nvv/data/3._Tickets/5._Tarifinfos/NVV-Befoerderungsbedingungen.pdf' },
    { title: 'KVG: Linie 24 zum Schloss Wilhelmshöhe (1. Dezember 2025)', url: 'https://www.kvg.de/nachricht/ihr-bus-direkt-zum-schloss-wilhelmshoehe/index.html' },
    { title: 'Polizeipräsidium Nordhessen: Unfallstatistik 2025 (28. Mai 2026, PDF)', url: 'https://www.polizei.hessen.de/sites/polizei.hessen.de/files/2026-05/pressemeldung_unfallstatistik_2025_nordhessen.pdf' },
    { title: 'Qick: Nutzungsbedingungen Deutschland', url: 'https://qickscooters.com/de/terms' },
    { title: 'Bolt: E-Scooter in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge in Deutschland', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Dott: AGB Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'nextbike Kassel: Tarife', url: 'https://www.nextbike.de/kassel/de/' },
  ],
};

export default guide;
