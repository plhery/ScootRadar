import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-regensburg',
  topic: 'regensburg',
  name: 'E-Scooter Regensburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Regensburg 2026: Preise, Parken, Altstadt',
  description: 'E-Scooter Regensburg: was Zeus pro Minute kostet, wo du in Altstadt und Stadtamhof abstellen musst und was an Uni, OTH, Bahnhof und im RVV-Bus gilt.',
  headline: 'E-Scooter Regensburg: Preise, Abstellflächen in der Altstadt und was an Uni und Bahnhof gilt',
  lede: 'Einen E-Scooter in Regensburg leihst du ab 18 und ohne Führerschein, laut Stadt (Stand November 2025) bei Lime, Voi, Dott oder Zeus; unsere Karte zeigt Zeus und Dott. Zeus verlangte laut Datenfeed am 23. Oktober 2026 je nach Scooter 0 €, 0,50 € oder 1 € fürs Entsperren und immer 0,23 € pro Minute. In der Altstadt, auf den Wöhrden, in Stadtamhof und am Bahnhof stellst du einen Leih-Scooter seit Juli 2024 nur auf einer der rund 40 markierten Abstellflächen ab, und durch die Fussgängerzone fährst du bis Ende Februar 2027 nicht. Ein Nachtverbot nennen weder die Stadt noch Zeus.',
  published: '2026-10-23',
  updated: '2026-10-24',
  city: 'de:Regensburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Regensburg?',
      blocks: [
        'Leih-Scooter gibt es in Regensburg seit 2019. Laut Stadt stellen vier Firmen zusammen über 1100 Scooter auf: **Lime**, **Voi**, **Dott** (früher TIER) und **Zeus**. Diese Liste ist vom November 2025. Zeus fährt hier laut einer Vorlage der Stadt seit 2020, Voi laut eigener Mitteilung seit 1. Mai 2025, zum Start mit rund 250 Scootern. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Regensburg](map:de:Regensburg) zeigt Zeus und seit dem 24. Oktober 2026 auch Dott: An diesem Samstag standen dort um 13:26 Uhr rund 250 Dott- und rund 190 Zeus-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse.',
        'Lime und Voi fehlen auf der Karte, weil wir für Regensburg keine offenen Daten von ihnen finden: Ihre Scooter und Preise siehst du nur in ihren Apps. Dotts öffentlicher Datenfeed kennt Regensburg nicht; seine Scooter zeigt unsere Karte trotzdem, seinen Preis nur die Dott-App.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Regensburg?',
      blocks: [
        'Zeus rechnet in Regensburg laut Datenfeed mit drei Tarifen ab, die sich nur beim Entsperren unterscheiden; jedem Scooter ist einer davon zugeordnet. Am Nachmittag des 23. Oktober kostete das Entsperren bei knapp der Hälfte 0,50 €, bei rund 40 % 1 € und bei gut jedem achten nichts.',
        {
          table: {
            caption: 'Zeus-Preise in Regensburg laut Datenfeed vom 23. Oktober 2026',
            head: ['Tarif im Feed', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Simple rate gold', '0,00 €', '0,23 €', '2,30 €', '4,60 €'],
              ['Simple rate silver', '0,50 €', '0,23 €', '2,80 €', '5,10 €'],
              ['Simple rate standard', '1,00 €', '0,23 €', '3,30 €', '5,60 €'],
            ],
          },
        },
        'Auf seiner Website wirbt Zeus mit «Golden Scooters»: Sie tragen in der App ein goldenes Symbol, und die Fahrt kostet 20 % weniger (Beiträge vom September und Oktober 2025). Ob der Tarif «gold» im Feed genau das ist und was «silver» bedeutet, erklärt Zeus nicht. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Pässe nennt Zeus auf seiner Website ab 4,99 €, ohne Datum und für alle Städte; ob es sie in Regensburg gibt, zeigt die App. Voi startete im Mai 2025 laut eigener Mitteilung mit 0,17 € pro Minute ohne Entsperrgebühr; ob das noch gilt, konnten wir nicht prüfen.',
      ],
    },
    {
      heading: 'E-Scooter in der Regensburger Altstadt abstellen',
      blocks: [
        'Seit Juli 2024 gilt ungefähr in der ganzen Welterbe-Schutzzone ein Abstellverbot für Leih-Scooter und Leih-Räder: in der Altstadt, auf dem Oberen und Unteren Wöhrd, in Stadtamhof und rund um den Bahnhof. Beschlossen hat das der Ausschuss für Stadtplanung, Verkehr und Wohnungsfragen des Stadtrats am 19. September 2023. In dieser Zone beendest du eine Fahrt nur auf einer der markierten Abstellflächen, erkennbar an grünen Schildern und Piktogrammen am Boden.',
        'Zum Start gab es 38 Flächen, im Herbst 2025 kamen vier dazu. Sie liegen wie ein Ring um die Altstadtmitte; die Planliste der Stadt nennt etwa Bismarckplatz, Ägidienplatz, Emmeramsplatz, Fischmarkt, Thundorferstrasse, Maximilianstrasse und Bahnhofsvorplatz, in Stadtamhof die Andreasstrasse. Wo genau sie liegen, zeigt das Geoportal der Stadt. Rund um **Dom, Altes Rathaus, Haidplatz und Neupfarrplatz** gibt es bewusst keine: So soll auch niemand durch die Fussgängerzone fahren. Laut Geoportal gibt es auch Flächen ausserhalb der Verbotszone, etwa am Universitätsklinikum.',
        {
          table: {
            caption: 'Wo du einen Leih-Scooter in Regensburg abstellst und wer das festlegt (Stand Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer das festlegt'],
            rows: [
              ['Altstadt, Wöhrde, Stadtamhof, Bahnhofsumfeld', 'Nur auf markierten Abstellflächen', 'Stadt Regensburg'],
              ['Dom, Altes Rathaus, Haidplatz, Neupfarrplatz', 'Keine Fläche, nächste am Ring nehmen', 'Stadt Regensburg'],
              ['Steinerne Brücke', 'In der Verbotszone, keine Fläche', 'Stadt Regensburg'],
              ['Stadtpark, Jahnstadion', 'Laut Datenfeed kein Fahrtende', 'Zeus'],
              ['Mitte des Uni-Campus, Universitätsstrasse am Eisbuckel, Teil des OTH-Campus an der Seybothstrasse', 'Laut Datenfeed kein Fahrtende', 'Zeus'],
              ['Übrige Stadt', 'Frei abstellen, ohne jemanden zu behindern', 'Bundesrecht (StVO)'],
            ],
          },
        },
        'Die Anbieter hinterlegen die Flächen laut Stadt in ihren Apps. Weil GPS in den engen Gassen ungenau ist, steht ein Scooter manchmal neben der Fläche. Für einen eigenen E-Scooter gilt die Pflicht nicht: Du stellst ihn ab, wo es erlaubt ist und niemanden behindert.',
        {
          note: 'Lässt dich die App in der Altstadt nicht abschliessen, stehst du nicht auf einer Abstellfläche. Schieb den Scooter zur nächsten: Bis du die Fahrt beendest, zahlst du weiter. Stellst du falsch ab, kann Zeus laut AGB bis zu 24 Stunden weiterrechnen; lässt du den Scooter ausserhalb des Geschäftsgebiets stehen, kann Zeus 120 € verlangen.',
        },
      ],
    },
    {
      heading: 'Wo darfst du in Regensburg mit dem E-Scooter fahren?',
      blocks: [
        'So fasst die Stadt das Bundesrecht für Regensburg zusammen (Stand November 2025):',
        {
          list: [
            '**Radweg nehmen**, wo es einen gibt, auch wenn er für Radfahrer nicht vorgeschrieben ist, etwa am Hochweg, in der Puricellistrasse und an der Konrad-Adenauer-Allee. Gibt es einen Schutz- oder Radfahrstreifen, fährst du darauf, sonst auf der Fahrbahn, nie auf dem Gehweg.',
            '**Keine Fussgängerzone:** Die Zusatzschilder «Radfahrer frei» in der Altstadt erlauben nur Fahrräder.',
            '**Wege in Grünanlagen** sind in der Regel tabu: Sie sind als Fussweg mit «Radfahrer frei» oder als für Kraftfahrzeuge gesperrt beschildert.',
            '**Einbahnstrassen**, die für Radfahrer in Gegenrichtung freigegeben sind, darfst du nach der Strassenverkehrs-Ordnung auch mit dem E-Scooter gegen die Fahrtrichtung fahren, auch wenn die Stadt auf ihrer Seite noch das Gegenteil schreibt.',
            '**Wohnverkehrsstrassen** wie die Gesandtenstrasse sind als gemeinsame Geh- und Radwege beschildert: Dort darfst du fahren, musst aber die Einbahnregeln beachten, etwa in Ludwigstrasse, Gesandtenstrasse und Rote-Hahnen-Gasse.',
          ],
        },
        'Zur Steinernen Brücke sagt die Stadt auf dieser Seite nichts: Fahren darfst du dort, wenn die Schilder es erlauben. Einen Leih-Scooter stellst du auf der Brücke nicht ab, denn sie liegt in der Verbotszone und hat keine Fläche.',
        'Ab 1. März 2027 gilt «Radverkehr frei» auch für E-Scooter: Auf so beschilderten Gehwegen und in Fussgängerzonen fährst du dann im Schritttempo. Die Stadt kann E-Scooter per Schild trotzdem ausschliessen. Den Radweg musst du dann nur noch nehmen, wo ein blaues Radwegschild steht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln und Bussgelder in Regensburg',
      blocks: [
        'Die Verkehrsregeln setzt der Bund, nicht Bayern oder die Stadt. E-Scooter fährst du ab 14 ohne Führerschein, höchstens 20 km/h und immer allein; Leih-Scooter vermieten die Anbieter erst ab 18. Eine Helmpflicht gibt es nicht; die Stadt rät dringend zum Helm, die Uni bittet darum.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt; länger als 1 Sekunde rot: 100 €, 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Falsch abgestellt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'Unzulässig auf Geh- oder Radweg 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, und der Führerschein ist in der Regel weg; wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar. Unter 21 oder in der Probezeit gilt 0,0. Zeus verbietet in seinen AGB das Fahren unter Alkohol- oder Drogeneinfluss.',
        'Seit 1. Oktober 2026 haftet der Halter bei Unfällen auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Die Seite der Stadt sagt noch das Gegenteil; in diesem Punkt ist sie überholt. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Mit dem E-Scooter zur Uni, zur OTH und zum Hauptbahnhof',
      blocks: [
        'Laut **Universität Regensburg** eignen sich E-Scooter für kurze Wege, etwa vom Bahnhof zum Campus oder vom Campus zum Standort Bajuwarenstrasse. Sie bittet, Parkzonen und Abstellverbote einzuhalten und nie barrierefreie Eingänge zuzustellen. Eine Zeus-Fahrt beendest du am Rand des Campus, in der Mitte laut Datenfeed nicht.',
        'An der **OTH Regensburg** beendest du laut Zeus-Feed in einem Teil des Campus an der Seybothstrasse keine Fahrt. In den Gebäuden der OTH sind Roller und Ähnliches laut Hausordnung vom Juli 2025 tabu; Fahrräder gehören an die dafür vorgesehenen Plätze, nicht in oder vor die Eingänge.',
        'Der **Hauptbahnhof** liegt in der Abstellverbotszone. Flächen gibt es laut Planliste der Stadt am Bahnhofsvorplatz und an der Maximilianstrasse, laut Geoportal auch südlich der Gleise, etwa an der Friedenstrasse bei den Arcaden.',
      ],
    },
    {
      heading: 'E-Scooter im RVV-Bus und in der Bahn',
      blocks: [
        'In den Bussen des Regensburger Verkehrsverbunds (RVV) gelten zusammengeklappte E-Tretroller als Handgepäck (Beförderungsbedingungen, Stand 1. Januar 2026). Ein Leih-Scooter lässt sich in der Regel nicht klappen; stell ihn vor der Fahrt auf einer Fläche ab.',
        'Im Fernverkehr der Deutschen Bahn fährt ein eigener E-Scooter zusammengeklappt kostenlos als Handgepäck mit.',
      ],
    },
    {
      heading: 'Wie Regensburg E-Scooter regelt: Bund, Bayern, Stadt',
      blocks: [
        'Die Abstellflächen sind eine Sondernutzung: Nur die Anbieter bekommen dafür eine Erlaubnis und zahlen eine Gebühr, deren Höhe die Stadt nicht veröffentlicht. Eine Obergrenze für Scooter oder Anbieter hat Regensburg nicht festgelegt, schreibt das Münchner Mobilitätsreferat am 1. Juli 2026.',
        'Das liegt am Landesrecht: In Bayern gilt das Aufstellen von Leih-Scootern bisher als genehmigungsfreier Gemeingebrauch, verbindliche Obergrenzen sind rechtlich unsicher. Ab 1. März 2027 gilt das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung nicht mehr als Parken. Die Städte dürfen es dann nur unter Auflagen erlauben, etwa auf ausgewiesenen Flächen, und können das in Sondernutzungsvereinbarungen regeln. Wie München damit umgeht: [E-Scooter in München](guide:munich).',
        'Am 18. Februar 2025 beauftragte derselbe Ausschuss die Verwaltung, die Abstellregel mit den Anbietern auf bestehende Brennpunkte im übrigen Stadtgebiet auszuweiten. Ein Nachtverbot oder eine Winterpause nennen weder die Stadt noch Zeus in seinen AGB.',
      ],
    },
    {
      heading: 'Schon gewusst? Solarstationen und eine gespaltene Stadt',
      blocks: [
        {
          list: [
            '**Zeus lud mit Sonnenstrom.** Im Forschungsprojekt ZISteM mit Stadt, RVV, Zeus und Siemens wurden an den Arcaden, an der TechBase und am Bahnhof Burgweinting solarbetriebene Ladestationen für je bis zu 10 Scooter aufgestellt. Das Projekt endete im Juni 2024.',
            '**Die Stadt ist gespalten.** In einer Bürgerumfrage des Projekts im Sommer 2023 lehnten rund zwei Drittel E-Scooter-Sharing ab oder eher ab. Zugleich ersetzte laut Auswertung jede siebte Scooterfahrt eine Autofahrt.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Regensburg?',
      answer: 'Die von Zeus, Lime, Voi oder Dott: Diese vier nennt die Stadt (Stand November 2025). Die [Live-Karte von Regensburg](map:de:Regensburg) zeigt Zeus und Dott; Lime und Voi siehst du nur in ihren Apps. Du musst 18 sein, einen Führerschein brauchst du nicht.',
    },
    {
      question: 'Was kostet ein Zeus-Scooter in Regensburg?',
      answer: 'Laut Datenfeed vom 23. Oktober 2026 je nach Scooter 0 €, 0,50 € oder 1 € fürs Entsperren und 0,23 € pro Minute. Zehn Minuten kosten also 2,30 € bis 3,30 €. Den verbindlichen Preis zeigt die App vor dem Entsperren.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Regensburger Altstadt fahren?',
      answer: 'Auf den Strassen ja, durch die Fussgängerzone nicht: «Radfahrer frei» gilt dort bis Ende Februar 2027 nur für Fahrräder. In Wohnverkehrsstrassen wie der Gesandtenstrasse darfst du fahren, musst aber die Einbahnregeln beachten.',
    },
    {
      question: 'Warum kann ich meine Fahrt am Haidplatz nicht beenden?',
      answer: 'Weil du in der Altstadt nur auf den markierten Abstellflächen abstellen darfst und es rund um Dom, Altes Rathaus, Haidplatz und Neupfarrplatz keine gibt. Die nächsten liegen am Ring, etwa am Bismarckplatz oder am Fischmarkt. Bis du dort abschliesst, läuft die Miete.',
    },
    {
      question: 'Gibt es in Regensburg ein Nachtverbot für E-Scooter?',
      answer: 'Nein. Weder die Stadt noch Zeus nennen ein Nachtverbot oder eine Winterpause (Stand Oktober 2026).',
    },
    {
      question: 'Darf ich einen E-Scooter im RVV-Bus mitnehmen?',
      answer: 'Einen eigenen, zusammengeklappten ja: Er gilt als Handgepäck. Einen Leih-Scooter in der Regel nicht, weil er sich nicht klappen lässt: Stell ihn vorher ab.',
    },
  ],
  sources: [
    { title: 'Stadt Regensburg: E-Roller / E-Scooter (Stand November 2025)', url: 'https://www.regensburg.de/leben/verkehr-u-mobilitaet/elektromobilitaet/e-roller-e-scooter' },
    { title: 'Stadt Regensburg: Neue Parkregelung für Sharing-Scooter (Juli 2024)', url: 'https://www.regensburg.de/regensburg-507/kurz-knapp/neue-parkregelung-fuer-sharing-scooter-und-bikes-in-der-innenstadt' },
    { title: 'Stadt Regensburg: Ausschussbeschluss Abstellplätze Innenstadt (19. September 2023)', url: 'https://srv19.regensburg.de/bi/to020.asp?TOLFDNR=59517' },
    { title: 'Stadt Regensburg: Ausschussbeschluss Hotspots (18. Februar 2025)', url: 'https://srv19.regensburg.de/bi/to020.asp?TOLFDNR=62718' },
    { title: 'Stadt Regensburg: Umfrage zu Mobilität, Ergebnisse (ZISteM)', url: 'https://www.regensburg.de/leben/verkehr-u-mobilitaet/elektromobilitaet/e-roller-e-scooter/umfrage-zu-mobilitaet-ergebnisse' },
    { title: 'Mobilitätsreferat München: Antwort zu «E-Scooter-Chaos beenden» (1. Juli 2026)', url: 'https://risi.muenchen.de/risi/dokument/v/9788061' },
    { title: 'Bundesgesetzblatt 2026 I Nr. 32: Änderung der StVO und der eKFV', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesverkehrsministerium: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2 (Vorschriftzeichen), aktuelle Fassung', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'Zeus: Datenfeed Regensburg (GBFS)', url: 'https://zeus.city/api/v1/mds/gbfs/regensburg/gbfs.json' },
    { title: 'Zeus: Preise und Pässe', url: 'https://zeusscooters.com/' },
    { title: 'Zeus: Golden Scooters (September 2025)', url: 'https://zeusscooters.com/2025/09/make-every-hour-golden-with-zeus-scooters/' },
    { title: 'Zeus: Allgemeine Geschäftsbedingungen', url: 'https://zeusscooters.com/terms-and-conditions/' },
    { title: 'Voi: E-Scooter-Anbieter Voi startet in Regensburg (April 2025)', url: 'https://storage.mfn.se/7985fb60-e679-4774-acb8-42a86e1b5711/e-scooter-anbieter-voi-startet-in-regensburg.pdf' },
    { title: 'Dott: Standorte', url: 'https://ridedott.com/de/locations' },
    { title: 'Universität Regensburg: Sharing-Angebote', url: 'https://www.uni-regensburg.de/universitaet/organisation/kontakt/sharing-angebote' },
    { title: 'OTH Regensburg: Hausordnung (9. Juli 2025)', url: 'https://www.oth-regensburg.de/fileadmin/Bereiche/Organisation/Rechtliche_Grundlagen/Satzungen_Ordnungen/2025/Hausordnung_der_OTH_Regensburg_09_07_2025_final.pdf' },
    { title: 'RVV: Beförderungsbedingungen (Stand 1. Januar 2026)', url: 'https://www.rvv.de/12288-befoerderung-tarif-2026-01-01' },
  ],
};

export default guide;
