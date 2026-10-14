import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-preise-schweiz',
  topic: 'swiss-prices',
  name: 'E-Trottinett-Preise in der Schweiz',
  title: 'E-Trottinett-Preise Schweiz 2026: Was eine Fahrt kostet',
  description: 'E-Trottinett-Preise in der Schweiz: Entsperrgebühr und Minutenpreis je Anbieter und Stadt, was 5, 10 und 20 Minuten kosten, Abos und teure Zusatzgebühren.',
  headline: 'E-Trottinett-Preise in der Schweiz: So viel kostet ein Sharing-Trottinett, Stadt für Stadt',
  lede: 'Die E-Trottinett-Preise in der Schweiz setzen sich fast immer gleich zusammen: CHF 1.– fürs Entsperren, dann 39 bis 48 Rappen pro Minute, so die Tarife, die Bolt, Hopp und Voi am 12. Oktober 2026 veröffentlichten. Zehn Minuten kosten damit CHF 4.90 bis CHF 5.80. Günstiger fährst du mit PubliBike in Zürich und Biel: CHF 1.– plus 20 Rappen pro Minute laut Preisliste, Stand Oktober 2026. Dott verlangt je nach Ort 95 Rappen bis CHF 1.50 fürs Entsperren, Bird veröffentlicht keine Tarife, und bei allen Anbietern zeigt die App den Endpreis, bevor du entsperrst.',
  published: '2026-10-12',
  updated: '2026-10-13',
  sections: [
    {
      heading: 'Was kostet es, ein E-Trottinett zu mieten?',
      blocks: [
        'Fast jedes Sharing-E-Trottinett in der Schweiz wird gleich abgerechnet: eine Gebühr fürs Entsperren, dann ein Preis für jede Minute, in der es entsperrt ist. Die Uhr läuft also auch, wenn du am Rotlicht wartest oder einen Abstellplatz suchst.',
        'Die Tarife gelten nicht landesweit. Derselbe Anbieter verlangt in Basel einen anderen Minutenpreis als in Bern, und Lime wie Voi schreiben, dass sich ihre Preise auch je nach Tageszeit ändern können. Lime rundet zudem jede Fahrt auf die nächste volle Minute auf und verrechnet, bis die App das Ende der Fahrt bestätigt, nicht bis du absteigst.',
      ],
    },
    {
      heading: 'E-Trottinett-Preise nach Anbieter und Stadt',
      blocks: [
        'Bolt, Hopp, Voi und Zeus veröffentlichen ihre Tarife in den offenen Datenfeeds, aus denen auch die Karte liest. Am Morgen des 12. Oktober 2026 standen dort diese Preise. Die Basler Tarife von Lime und Dott stammen aus ihren eigenen Datenfeeds (gelesen am Abend desselben Tages), ihre übrigen Schweizer Tarife aus den offenen Daten vom 13. Oktober, der Tarif von PubliBike aus seiner eigenen Preisliste:',
        {
          table: {
            caption: 'Veröffentlichte Tarife vom 12. Oktober 2026 (Dott und Lime ausserhalb Basels: 13. Oktober): Entsperrgebühr und Preis pro Minute',
            head: ['Gebiet', 'Anbieter', 'Entsperren', 'Pro Minute'],
            rows: [
              ['Region Zürich', 'Voi', 'CHF 1.–', '42 Rappen (einzelne 39 Rappen)'],
              ['Region Zürich', 'Bolt', 'CHF 1.–', '42 Rappen (einzelne 48 Rappen)'],
              ['Region Zürich', 'Hopp', 'CHF 1.–', '40 Rappen (Kloten: 42 Rappen)'],
              ['Region Zürich', 'Dott', '95 Rappen', '41 Rappen'],
              ['Region Zürich', 'Lime', 'CHF 1.–', '49 Rappen (einzelne 42 Rappen)'],
              ['Winterthur', 'Voi', 'CHF 1.–', '42 Rappen'],
              ['Bern', 'Voi', 'CHF 1.–', '42 Rappen'],
              ['Basel', 'Voi', 'CHF 1.–', '39 Rappen'],
              ['Basel', 'Bolt', 'CHF 1.–', '45 Rappen'],
              ['Basel', 'Hopp', 'CHF 1.–', '45 Rappen'],
              ['Basel', 'Lime (eigener Datenfeed)', 'CHF 1.–', '46 Rappen'],
              ['Basel', 'Dott (eigener Datenfeed)', '95 Rappen', '39 Rappen'],
              ['Basel', 'Bird', 'nicht veröffentlicht', 'in der App'],
              ['Biel/Bienne', 'Voi', 'CHF 1.–', '39 Rappen'],
              ['St. Gallen und Rorschach', 'Dott', 'CHF 1.20', '45 Rappen'],
              ['Romanshorn und Amriswil', 'Dott', 'CHF 1.50', '45 Rappen'],
              ['Region Zug', 'Bolt', 'CHF 1.–', '48 Rappen'],
              ['Schaffhausen', 'Voi', 'keine', '39 Rappen'],
              ['Singen (Deutschland), jenseits der Grenze bei Schaffhausen', 'Zeus', '1 Euro', '25 Cent'],
              ['Zürich und Biel/Bienne', 'PubliBike (Preisliste, Oktober 2026)', 'CHF 1.–', '20 Rappen'],
              ['Region Zürich und weitere', 'Bird', 'nicht veröffentlicht', 'in der App'],
            ],
          },
        },
        'Voi verlangt also in Basel und Biel 39 Rappen pro Minute, in Bern 42 Rappen, Bolt je nach Gebiet 42, 45 oder 48 Rappen, und fürs Entsperren verlangt Dott in Basel und Zürich 95 Rappen, in Romanshorn CHF 1.50. Selbst innerhalb eines Gebiets fahren einzelne Trottinette zu einem anderen Tarif. Massgebend ist darum der Preis in der App.',
        'In Schaffhausen zeigte der Feed von Voi gar keine Entsperrgebühr; zehn Minuten kämen so auf CHF 3.90. Die Zeus-Trottinette, die die Karte bei Schaffhausen zeigt, stehen jenseits der Grenze in Singen (Deutschland) und werden in Euro abgerechnet.',
        'Der Standardtarif von PubliBike (B-Quick National) beträgt für die E-Scooter in Zürich und Biel/Bienne CHF 1.– plus 20 Rappen pro Minute, Stand Oktober 2026. Im Tessin kannst du sie mit diesem Tarif nicht ausleihen: Du brauchst das Abo B-Fit Local Tessin (CHF 69.– pro Jahr), dann kosten je 15 Minuten CHF 3.–.',
      ],
    },
    {
      heading: 'So viel kosten 5, 10 und 20 Minuten',
      blocks: [
        'Minuten mal Minutenpreis, plus Entsperrgebühr: CHF 1.– + 10 × 42 Rappen = CHF 5.20 für zehn Minuten mit Voi in Bern. Die Tabelle rechnet in ganzen Minuten, ohne Zuschläge für Zonen oder andere Gebühren.',
        {
          table: {
            caption: 'Was eine Fahrt zu den Tarifen vom 12. Oktober 2026 kostet (Dott und Lime ausserhalb Basels: 13. Oktober; PubliBike: Preisliste, Oktober 2026)',
            head: ['Tarif (wo)', '5 Minuten', '10 Minuten', '20 Minuten'],
            rows: [
              ['PubliBike, CHF 1.– + 20 Rp. (Zürich, Biel)', 'CHF 2.–', 'CHF 3.–', 'CHF 5.–'],
              ['Dott, 95 Rp. + 39 Rp. (Basel)', 'CHF 2.90', 'CHF 4.85', 'CHF 8.75'],
              ['Voi, CHF 1.– + 39 Rp. (Basel, Biel)', 'CHF 2.95', 'CHF 4.90', 'CHF 8.80'],
              ['Hopp, CHF 1.– + 40 Rp. (Region Zürich)', 'CHF 3.–', 'CHF 5.–', 'CHF 9.–'],
              ['Dott, 95 Rp. + 41 Rp. (Zürich)', 'CHF 3.–', 'CHF 5.05', 'CHF 9.15'],
              ['Voi oder Bolt, CHF 1.– + 42 Rp. (Zürich; Voi auch in Winterthur und Bern)', 'CHF 3.10', 'CHF 5.20', 'CHF 9.40'],
              ['Bolt oder Hopp, CHF 1.– + 45 Rp. (Basel)', 'CHF 3.25', 'CHF 5.50', 'CHF 10.–'],
              ['Lime, CHF 1.– + 46 Rp. (Basel)', 'CHF 3.30', 'CHF 5.60', 'CHF 10.20'],
              ['Dott, CHF 1.20 + 45 Rp. (St. Gallen, Rorschach)', 'CHF 3.45', 'CHF 5.70', 'CHF 10.20'],
              ['Bolt, CHF 1.– + 48 Rp. (Region Zug)', 'CHF 3.40', 'CHF 5.80', 'CHF 10.60'],
              ['Lime, CHF 1.– + 49 Rp. (Region Zürich)', 'CHF 3.45', 'CHF 5.90', 'CHF 10.80'],
              ['Dott, CHF 1.50 + 45 Rp. (Romanshorn)', 'CHF 3.75', 'CHF 6.–', 'CHF 10.50'],
            ],
          },
        },
        'Eine Mietfahrt dauert in Zürich im Schnitt etwa zehn Minuten, sagt der Chef der städtischen Verkehrssicherheit. Bei kurzen Fahrten fällt die Entsperrgebühr am stärksten ins Gewicht: Von den CHF 3.10 für fünf Minuten mit Voi in Bern entfällt ein Franken aufs Entsperren. Bei langen Fahrten entscheidet der Minutenpreis: 20 Minuten mit Lime in der Region Zürich kosten CHF 2.– mehr als mit Voi in Basel.',
      ],
    },
    {
      heading: 'Abos und Pässe für E-Trottinette',
      blocks: [
        'Wer oft fährt, spürt zuerst die Entsperrgebühr: Zwei Fahrten pro Tag an 20 Arbeitstagen machen CHF 40.– im Monat, nur fürs Entsperren.',
        {
          list: [
            '**Lime:** Die Minutenpakete von LimePass bringen Gratis-Entsperrungen und einen tieferen Minutenpreis. Sie gelten höchstens 30 Tage und nur im Land, in dem du sie gekauft hast. Ob es sie in der Schweiz gibt, sagt die Hilfeseite von Lime nicht; falls ja, zeigt die App sie an.',
            '**Voi:** Die Preisseite nennt Abos mit beliebig vielen Entsperrungen, mit oder ohne Minuten, und vorausbezahlte Minutenpakete mit inbegriffenen Entsperrungen. Was es davon in deiner Stadt gibt, zeigt die App.',
            '**Dott:** Die Schweizer Nutzungsbedingungen sehen Abos vor, zahlbar nur mit Kreditkarte.',
            '**PubliBike:** Das Abo B-Fit Local (CHF 69.– pro Jahr) senkt den E-Scooter-Tarif in Zürich und Biel nicht, und die Tageskarte für CHF 29.– gilt nur für Velos und E-Bikes.',
            '**Bolt, Bird und Hopp:** Ein Schweizer Abo haben wir auf keiner offiziellen Seite gefunden.',
          ],
        },
        'Schweizer Preise für Abos und Pakete haben wir auf den Websites der Anbieter nicht gefunden; sie stehen in den Apps. Ein Abo mit Gratis-Entsperrungen lohnt sich, wenn es weniger kostet als einen Franken für jede Fahrt, die du bis zu seinem Ablauf machst. Ein Minutenpaket lohnt sich nur, wenn du die Minuten aufbrauchst, bevor sie verfallen.',
      ],
    },
    {
      heading: 'Zusatzkosten: Parkieren, Gebühren und Bussen',
      blocks: [
        {
          note: 'In einer Parkverbotszone kannst du die Fahrt nicht beenden, und die Minuten laufen weiter, bis du einen Platz findest, an dem die App das Abstellen erlaubt. In Zürich gilt das zum Beispiel auf dem Europaplatz beim Hauptbahnhof und auf dem Sechseläutenplatz.',
        },
        'Schau vor der Fahrt in der App nach, wo du abstellen darfst. Wo die Zonen rund um den Zürcher Hauptbahnhof und die Altstadt liegen, steht im Ratgeber [E-Trottinett in Zürich](guide:zurich).',
        {
          table: {
            caption: 'Gebühren in den Schweizer Nutzungsbedingungen und Preislisten der Anbieter, Stand Oktober 2026',
            head: ['Anbieter', 'Falsch abgestellt oder ausserhalb des Gebiets', 'Busse, die an den Anbieter geht'],
            rows: [
              ['Voi', 'CHF 25.–, nach Verwarnungen', 'nicht angegeben'],
              ['Bolt', 'Abholgebühr bis CHF 100.–', 'weiterverrechnet, plus bis CHF 30.–'],
              ['Lime', 'Strafgebühr, Betrag nicht angegeben; Abholung und Bearbeitung je bis CHF 125.–', 'weiterverrechnet, plus «angemessene» Gebühr'],
              ['Dott', 'bis 300 Euro fürs Zurückholen, wenn du Park- oder Sperranweisungen missachtest; Gebühr fürs Verlassen des Gebiets ohne Betrag', 'weiterverrechnet, plus 50 Euro'],
              ['Bird', 'Kosten fürs Umstellen weiterverrechnet', 'weiterverrechnet'],
              ['PubliBike', 'CHF 30.–, ab dem zweiten Mal CHF 50.–', 'nicht angegeben'],
            ],
          },
        },
        'Die Polizei kann dich auch direkt büssen. Wer ein Trottinett auf dem Trottoir abstellt und weniger als 1,50 m für Fussgänger frei lässt oder es dort parkiert, wo Parkieren verboten ist, zahlt CHF 20.–; Fahren auf dem Trottoir kostet CHF 40.–. Die übrigen Bussen stehen in den [Regeln für E-Trottinette in der Schweiz](guide:swiss-rules).',
        'Rechne auch mit einer Reservation auf deiner Karte: Voi reserviert bei der Anmeldung CHF 5.–, Bolt und Bird können vorübergehend einen Betrag blockieren. Lime begrenzt eine Miete auf CHF 195.– pro 24 Stunden, und bei PubliBike dauert eine Miete höchstens 24 Stunden.',
      ],
    },
    {
      heading: 'So fährst du günstiger',
      blocks: [
        {
          list: [
            '**Vergleiche, bevor du losläufst.** Das nächste Trottinett spart dir Weg, nicht Geld. In Basel kosteten zehn Minuten zu den Tarifen vom 12. Oktober 2026 mit Voi CHF 4.90 und mit Bolt CHF 5.50. Die [Karte von Basel](map:ch:basel) zeigt beide, jedes mit seiner Schätzung.',
            '**Halte in Zürich und Biel Ausschau nach PubliBike.** Zehn Minuten kosten dort CHF 3.–, bei 42 Rappen pro Minute dagegen CHF 5.20. Auf der [Karte von Zürich](map:ch:zurich) stehen die E-Scooter von PubliBike zwischen den anderen.',
            '**Nimm ein geladenes Trottinett.** Ist der Akku unterwegs leer, kostet das nächste eine zweite Entsperrung.',
            '**Plane, wo du abstellst.** Knapp ausserhalb einer Parkverbotszone anzuhalten ist günstiger, als mit laufender Uhr um sie herumzufahren.',
          ],
        },
      ],
    },
    {
      heading: 'So funktioniert die Preisschätzung auf der Karte',
      blocks: [
        'ScootRadar liest die veröffentlichte Entsperrgebühr und den Minutenpreis jedes Anbieters aus seinem offenen Datenfeed und rechnet wie oben, für eine Fahrt von 5, 10, 15, 20 oder 30 Minuten; voreingestellt sind 10. Für Bird und PubliBike findet die Karte keinen Tarif, den sie verwenden kann, und Lime kennzeichnet seine Tarife im Feed als Preise ohne Steuern; ihre Trottinette zeigen darum keine Schätzung.',
        'In der iPhone-App kannst du ein Abo oder Paket eintragen, das du bei einem Anbieter hast, mit Gratis-Entsperrungen, Gratis-Minuten und Ablaufdatum, und die Schätzung rechnet es ein. Diese Angaben bleiben auf deinem iPhone.',
        'Die Feeds können einige Minuten alt sein, und Tarife können je nach Zone oder Zeit abweichen. Die Schätzung hilft beim Vergleichen, ein verbindliches Angebot ist sie nicht. Der Button bei jedem Trottinett öffnet die App des Anbieters, und dort siehst du den Endpreis, bevor du entsperrst. [Öffne die Karte](/map) und vergleiche.',
      ],
    },
  ],
  faq: [
    {
      question: 'Gibt es ein Monatsabo für E-Trottinette?',
      answer: 'Die Schweizer Nutzungsbedingungen von Dott sehen Abos vor, und Voi und Lime beschreiben auf ihren Websites Pässe: bei Voi Abos mit beliebig vielen Entsperrungen oder vorausbezahlte Minuten, bei Lime Minutenpakete mit Gratis-Entsperrungen, die bis zu 30 Tage gelten. Schweizer Preise nennt keiner davon; was es bei dir gibt, zeigt die App. Das Jahresabo von PubliBike für CHF 69.– senkt den E-Scooter-Tarif in Zürich und Biel nicht.',
    },
    {
      question: 'Warum war meine Fahrt teurer als geschätzt?',
      answer: 'Meist liegt es an Zeit und Ort. Lime rundet jede Fahrt auf die nächste volle Minute auf und verrechnet, bis die App das Ende bestätigt, Tarife können sich je nach Zone oder Tageszeit ändern, und laut Lime kommen an manchen Orten eine städtische Bewilligungsgebühr oder lokale Kosten dazu. Auch die Minuten, in denen du ausserhalb einer Parkverbotszone einen Platz suchst, zählen mit.',
    },
    {
      question: 'Ist eine Versicherung im Mietpreis inbegriffen?',
      answer: 'Lime, Bolt, Voi und Dott schliessen eine Haftpflichtversicherung im Preis ein, sie zahlt aber erst nach deiner eigenen Privathaftpflicht. PubliBike schliesst keine Versicherung ein und überlässt Unfall- und Haftpflichtdeckung dir. Mitfahrende sind nie versichert, und alle Anbieter erlauben nur eine Person pro Trottinett.',
    },
    {
      question: 'Kann ich ein E-Trottinett mit TWINT bezahlen?',
      answer: 'Von den grossen Anbietern nennt nur Dott TWINT, in seiner allgemeinen Hilfe, als Zahlungsart, die je nach Ort erscheinen kann; bei Lime, Voi und Bolt haben wir im Oktober 2026 keinen Hinweis darauf gefunden. Alle nehmen Kredit- und Debitkarten, Lime nennt zudem Apple Pay, Google Pay, PayPal und Klarna an ausgewählten Orten. Welche Zahlungsart geht, siehst du in der App, wenn du sie hinterlegst.',
    },
  ],
  sources: [
    { title: 'PubliBike: Preise & Abos', url: 'https://www.publibike.ch/de/abos' },
    { title: 'Lime Help Center: Fahrtkosten und Tarife (englisch)', url: 'https://help.li.me/hc/en-us/articles/115004914208' },
    { title: 'Lime Help Center: Was ist LimePass? (englisch)', url: 'https://help.li.me/hc/en-us/articles/21280766615963-What-is-LimePass' },
    { title: 'Lime: Nutzungsvereinbarung Schweiz', url: 'https://www.li.me/de-ch/user-agreement' },
    { title: 'Voi: Preise und Pässe (englisch)', url: 'https://www.voi.com/pricing-and-passes' },
    { title: 'Voi: Nutzungsbestimmungen Schweiz', url: 'https://www.voi.com/de/rechtliche-hinweise/nutzungsbestimmungen/schweiz' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen E-Fahrzeuge Schweiz', url: 'https://bolt.eu/de-ch/legal/micromobility/terms-for-e-vehicles-pdf/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Schweiz', url: 'https://ridedott.com/de/allgemeine/schweiz/' },
    { title: 'Stadt Zürich: Weisung zu Sharing-Fahrzeugen und ihren Zonen (GR Nr. 2025/210)', url: 'https://www.gemeinderat-zuerich.ch/dokumente/9c8a7ffaed6e4f3ca6234611a78f2946-332' },
    { title: 'Ordnungsbussenverordnung (OBV), Anhang 1: Bussenliste', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
