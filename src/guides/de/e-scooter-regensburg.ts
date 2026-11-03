import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-regensburg',
  topic: 'regensburg',
  name: 'E-Scooter Regensburg: Anbieter, Regeln, Parken',
  title: 'E-Scooter Regensburg 2026: Parken, Altstadt, Uni',
  description: 'E-Scooter Regensburg: die vier Anbieter, wo du in Altstadt und Stadtamhof abstellen musst und was an Uni, OTH, Bahnhof und im RVV-Bus gilt.',
  headline: 'E-Scooter Regensburg: Abstellflächen in der Altstadt und was an Uni und Bahnhof gilt',
  lede: 'Einen E-Scooter in Regensburg leihst du ohne Führerschein, laut Stadt (Stand November 2025) bei Lime, Voi, Dott oder Zeus; was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. In der Altstadt, auf den Wöhrden, in Stadtamhof und am Bahnhof stellst du einen Leih-Scooter seit Juli 2024 nur auf einer der rund 40 markierten Abstellflächen ab, und durch die Fussgängerzone fährst du bis Ende Februar 2027 nicht.',
  published: '2026-10-23',
  updated: '2026-10-25',
  city: 'de:Regensburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Regensburg?',
      blocks: [
        'Leih-Scooter gibt es in Regensburg seit 2019. Laut Stadt stellen vier Firmen zusammen über 1100 Scooter auf: **Lime**, **Voi**, **Dott** (früher TIER) und **Zeus**. Diese Liste ist vom November 2025. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Samstag, 24. Oktober 2026, kurz vor 16 Uhr zeigte die [Karte von Regensburg](map:de:Regensburg) rund 190 Zeus-, 250 Dott- und 290 Voi-Scooter, die zu diesem Zeitpunkt frei waren, am Sonntagmittag, 25. Oktober, rund 300 Lime-Scooter.',
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
              ['Übrige Stadt', 'Frei abstellen, ohne jemanden zu behindern', 'Bundesrecht (StVO)'],
            ],
          },
        },
        'Die Anbieter hinterlegen die Flächen laut Stadt in ihren Apps. Weil GPS in den engen Gassen ungenau ist, steht ein Scooter manchmal neben der Fläche. Für einen eigenen E-Scooter gilt die Pflicht nicht: Du stellst ihn ab, wo es erlaubt ist und niemanden behindert.',
        {
          note: 'Lässt dich die App in der Altstadt nicht abschliessen, stehst du nicht auf einer Abstellfläche. Schieb den Scooter zur nächsten: Bis du die Fahrt beendest, zahlst du weiter.',
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
            '**Einbahnstrassen**, die für Radfahrer in Gegenrichtung freigegeben sind: Nach der Strassenverkehrs-Ordnung darfst du dort auch mit dem E-Scooter gegen die Fahrtrichtung fahren, die E-Scooter-Verordnung verlangt dafür bis Ende Februar 2027 aber das Schild «Elektrokleinstfahrzeuge frei», und die Stadt schreibt auf ihrer Seite, es sei verboten. Ab 1. März 2027 ist es eindeutig erlaubt.',
            '**Wohnverkehrsstrassen** wie die Gesandtenstrasse sind als gemeinsame Geh- und Radwege beschildert: Dort darfst du fahren, musst aber die Einbahnregeln beachten, etwa in Ludwigstrasse, Gesandtenstrasse und Rote-Hahnen-Gasse.',
          ],
        },
        'Auf der Steinernen Brücke fährst du, wo die Schilder es erlauben. Einen Leih-Scooter stellst du auf der Brücke nicht ab, denn sie liegt in der Verbotszone und hat keine Fläche.',
        'Ab 1. März 2027 gilt «Radverkehr frei» auch für E-Scooter: Auf so beschilderten Gehwegen und in Fussgängerzonen fährst du dann im Schritttempo. Die Stadt kann E-Scooter per Schild trotzdem ausschliessen. Den Radweg musst du dann nur noch nehmen, wo ein blaues Radwegschild steht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln und Bussgelder in Regensburg',
      blocks: [
        'Die Verkehrsregeln setzt der Bund, nicht Bayern oder die Stadt. E-Scooter fährst du ab 14 ohne Führerschein, höchstens 20 km/h und immer allein. Eine Helmpflicht gibt es nicht; die Stadt rät dringend zum Helm, die Uni bittet darum.',
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
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, und der Führerschein ist in der Regel weg; wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar. Unter 21 oder in der Probezeit gilt 0,0.',
        'Seit 1. Oktober 2026 haftet der Halter bei Unfällen auch ohne Verschulden, beim Leih-Scooter also der Anbieter. Die Seite der Stadt sagt noch das Gegenteil; in diesem Punkt ist sie überholt. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Mit dem E-Scooter zur Uni, zur OTH und zum Hauptbahnhof',
      blocks: [
        'Laut **Universität Regensburg** eignen sich E-Scooter für kurze Wege, etwa vom Bahnhof zum Campus oder vom Campus zum Standort Bajuwarenstrasse. Sie bittet, Parkzonen und Abstellverbote einzuhalten und nie barrierefreie Eingänge zuzustellen. Wo du auf dem Campus abstellen darfst, zeigt die App.',
        'An der **OTH Regensburg** sind Roller und Ähnliches in den Gebäuden laut Hausordnung vom Juli 2025 tabu; Fahrräder gehören an die dafür vorgesehenen Plätze, nicht in oder vor die Eingänge.',
        'Der **Hauptbahnhof** liegt in der Abstellverbotszone. Flächen gibt es laut Planliste der Stadt am Bahnhofsvorplatz und an der Maximilianstrasse, laut Geoportal auch südlich der Gleise, etwa an der Friedenstrasse bei den Arcaden.',
      ],
    },
    {
      heading: 'E-Scooter im RVV-Bus und in der Bahn',
      blocks: [
        'In den Bussen des Regensburger Verkehrsverbunds (RVV) gelten zusammengeklappte E-Tretroller als Handgepäck (Beförderungsbedingungen, Stand 1. Januar 2026). Ein Leih-Scooter lässt sich in der Regel nicht klappen; stell ihn vor der Fahrt auf einer Fläche ab.',
        'Ob ein eigener E-Scooter in Regional- oder Fernzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
      ],
    },
    {
      heading: 'Wie Regensburg E-Scooter regelt: Sondernutzung und Abstellflächen',
      blocks: [
        'Die Abstellflächen sind eine Sondernutzung: Nur die Anbieter bekommen dafür laut Stadt eine Erlaubnis und zahlen für dieses exklusive Nutzungsrecht eine Sondernutzungsgebühr. Für private E-Scooter gelten die Flächen deshalb nicht.',
        'Ab 1. März 2027 gilt das gewerbliche Aufstellen von Leih-Scootern laut Strassenverkehrs-Ordnung nicht mehr als Parken. Die Städte dürfen es dann nur unter Auflagen erlauben, etwa auf ausgewiesenen Flächen, und können das in Sondernutzungsvereinbarungen regeln. Wie München damit umgeht: [E-Scooter in München](guide:munich).',
        'Am 18. Februar 2025 beauftragte derselbe Ausschuss die Verwaltung, die Abstellregel mit den Anbietern auf bestehende Brennpunkte im übrigen Stadtgebiet auszuweiten.',
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
      answer: 'Die von Zeus, Lime, Voi oder Dott: Diese vier nennt die Stadt (Stand November 2025). Einen Führerschein brauchst du nicht; das Mindestalter und den Preis zeigt dir die App vor dem Entsperren. Freie Scooter zeigt die [Live-Karte von Regensburg](map:de:Regensburg).',
    },
    {
      question: 'Wo stelle ich einen Leih-Scooter am Hauptbahnhof ab?',
      answer: 'Nur auf einer markierten Fläche, denn der Bahnhof liegt in der Abstellverbotszone. Flächen gibt es laut Planliste der Stadt am Bahnhofsvorplatz und an der Maximilianstrasse, laut Geoportal auch südlich der Gleise an der Friedenstrasse bei den Arcaden.',
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
      question: 'Muss ich meinen eigenen E-Scooter in der Altstadt auf einer Fläche abstellen?',
      answer: 'Nein: Die Pflicht gilt nur für Leih-Scooter und Leih-Räder. Deinen eigenen stellst du ab, wo es nicht verboten ist und niemanden behindert.',
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
    { title: 'Bundesgesetzblatt 2026 I Nr. 32: Änderung der StVO und der eKFV', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesverkehrsministerium: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Strassenverkehrs-Ordnung, Anlage 2 (Vorschriftzeichen), aktuelle Fassung', url: 'https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html' },
    { title: 'Universität Regensburg: Sharing-Angebote', url: 'https://www.uni-regensburg.de/universitaet/organisation/kontakt/sharing-angebote' },
    { title: 'OTH Regensburg: Hausordnung (9. Juli 2025)', url: 'https://www.oth-regensburg.de/fileadmin/Bereiche/Organisation/Rechtliche_Grundlagen/Satzungen_Ordnungen/2025/Hausordnung_der_OTH_Regensburg_09_07_2025_final.pdf' },
    { title: 'RVV: Beförderungsbedingungen (Stand 1. Januar 2026)', url: 'https://www.rvv.de/12288-befoerderung-tarif-2026-01-01' },
  ],
};

export default guide;
