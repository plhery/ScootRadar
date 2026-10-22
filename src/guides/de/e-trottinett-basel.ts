import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-basel',
  topic: 'basel',
  name: 'E-Trottinett Basel: Anbieter, Preise, Zonen',
  title: 'E-Trottinett Basel 2026: Anbieter, Preise, Sperrzonen',
  description: 'E-Trottinett Basel: sechs Anbieter, was zehn Minuten kosten, wo das Trotti in der Altstadt stoppt, warum du am Rhein nicht parkierst und was an Anlässen gilt.',
  headline: 'E-Trottinett Basel: Anbieter, Preise, Sperrzonen und Parkieren am Rhein',
  lede: 'Ein E-Trottinett in Basel mietest du in der App von Lime, Voi, Dott, Bird, Bolt oder Hopp: QR-Code scannen, entsperren und auf dem Velostreifen losfahren. Zehn Minuten kosten CHF 4.90 bis 5.60: CHF 1.– fürs Entsperren plus 39 bis 46 Rappen pro Minute (veröffentlichte Tarife vom 23. Oktober 2026). In der Altstadt, etwa auf dem Marktplatz oder in der Freien Strasse, bremst das Trotti bis zum Stillstand, und auf den Rheinbrücken kannst du die Fahrt nicht beenden. Nach Deutschland, nach Frankreich und an den EuroAirport kommst du damit nicht.',
  published: '2026-10-12',
  updated: '2026-10-23',
  city: 'ch:basel',
  sections: [
    {
      heading: 'Welche E-Trottinett-Anbieter gibt es in Basel?',
      blocks: [
        'In Basel mietest du E-Trottinette von sechs Marken: Lime, Voi, Dott (früher Tier), Bird, Bolt und seit dem 17. März 2026 auch Hopp. ScootRadar zeigt alle sechs. Schweizer Nutzungsbedingungen von Hopp haben wir nicht gefunden; Mindestalter und Versicherung prüfst du darum in der Hopp-App.',
        'Eine Bewilligung braucht in Basel kein Anbieter, und Gebühren zahlt keiner. Seit Oktober 2025 muss sich aber jeder an die Nutzungsordnung des Kantons halten: im Monatsmittel höchstens **200 Velos oder Trottis pro Anbieter** auf öffentlichem Grund der Stadt und ein Foto des parkierten Trottis am Ende jeder Fahrt. Wer die Regeln wiederholt bricht, riskiert, dass der Kanton die ganze Flotte vom öffentlichen Grund verbannt.',
        'Am Morgen des 12. Oktober 2026 zeigte die [Karte rund um Basel](map:ch:basel) etwa 1300 Fahrzeuge von Lime, Voi, Dott, Bird und Bolt, Riehen und die Vororte eingerechnet; dazu kamen rund 220 von Hopp. So kommst du zu deinem Trotti:',
        {
          steps: [
            'Das nächste Trotti auf der [Live-Karte von Basel](map:ch:basel) suchen und die App des Anbieters öffnen.',
            'Registrieren und eine Kredit- oder Debitkarte hinterlegen. Lime, Voi, Dott, Bird und Bolt verlangen laut ihren Schweizer Bedingungen, dass du mindestens 18 bist.',
            'QR-Code scannen und losfahren. Am Ziel dort parkieren, wo die App es zulässt, und das Foto machen: Ohne Foto endet in Basel keine Fahrt. Jeden Schritt im Detail erklärt der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
          ],
        },
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in Basel?',
      blocks: [
        'Du zahlst eine Gebühr fürs Entsperren und einen Minutenpreis. Fünf der sechs Anbieter veröffentlichen ihre Basler Tarife in offenen Datenfeeds. Je nach Zone und Tageszeit können sie abweichen; Bolt nennt seinen Minutenpreis selbst variabel. Den Endpreis zeigt dir die App, bevor du entsperrst.',
        {
          table: {
            caption: 'Veröffentlichte Tarife für E-Trottinette in Basel (Datenfeeds der Anbieter vom 23. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', 'CHF 1.–', '39 Rappen', 'CHF 4.90', 'CHF 8.80'],
              ['Voi', 'CHF 1.–', '39 Rappen', 'CHF 4.90', 'CHF 8.80'],
              ['Bolt', 'CHF 1.–', '45 Rappen', 'CHF 5.50', 'CHF 10.–'],
              ['Hopp', 'CHF 1.–', '45 Rappen', 'CHF 5.50', 'CHF 10.–'],
              ['Lime', 'CHF 1.–', '46 Rappen', 'CHF 5.60', 'CHF 10.20'],
              ['Bird', 'nicht veröffentlicht', 'nicht veröffentlicht', 'Tarif in der App', 'Tarif in der App'],
            ],
          },
        },
        'An diesem Tag waren Dott und Voi am günstigsten und Lime am teuersten; nach 20 Minuten macht das CHF 1.40 aus. Bolt verkauft Wochen- und Monatspässe und verlangt laut eigener Website zu Stosszeiten vor dem Entsperren einen kurzen Reaktionstest. Ob die anderen in Basel Pässe anbieten, siehst du in ihrer App.',
      ],
    },
    {
      heading: 'Sperrzonen: Wo das E-Trottinett in Basel stoppt',
      blocks: [
        'Der Kanton legt zwei Arten von Zonen fest und zeigt sie auf seiner Karte; die Anbieter müssen sie in ihre Apps übernehmen. In einer **Sperrzone** bremst das Trotti bis zum Stillstand; schiebst du es hinaus, fährt es wieder. Durch eine **Parkverbotszone** darfst du fahren, beenden kannst du die Fahrt dort aber nicht.',
        {
          table: {
            caption: 'Zonen für E-Trottinette in Basel, Stand Oktober 2026',
            head: ['Zone', 'Was gilt', 'Wo, zum Beispiel'],
            rows: [
              ['Sperrzone in Altstadt und Zentrum', 'Kein Fahren, kein Parkieren: Das Trotti bremst auf 0 km/h', 'Marktplatz, Freie Strasse und ein Teil des Barfüsserplatzes, Gerbergasse und Spalenberg, Münsterplatz, Rheinsprung, Schifflände, Steinenvorstadt, Petersplatz, Centralbahnplatz vor dem Bahnhof SBB'],
              ['Sperrzone in Parks und Sportanlagen', 'Ebenso', 'Kannenfeldpark, Schützenmattpark, Bäumlihof, Eglisee, Sportanlagen St. Jakob'],
              ['Parkverbotszone', 'Durchfahren ja, Fahrt beenden nein', 'Rhein und Brücken von der Dreirosen- bis zur Schwarzwaldbrücke, Bahnhof Süd, Solitude beim Museum Tinguely, Elisabethenanlage, St. Johanns-Park, Lange Erlen'],
              ['Fussgängerzone', 'Nur schieben, sonst CHF 30.– Busse', '48 Abschnitte, darunter Freie Strasse, Gerbergasse, Streitgasse, Schneidergasse, Spalenberg, Münsterberg, Nadelberg'],
            ],
          },
        },
        'Willst du zum Münster oder auf den Marktplatz, beendest du die Fahrt also vorher und gehst die letzten Minuten zu Fuss. Die Anbieter können eigene Zonen ergänzen, Bolt sperrt etwa auch die Kohlenberggasse. Verbindlich ist die Karte in der App.',
        { note: 'In einer Sperr- oder Parkverbotszone lässt dich die App die Fahrt nicht beenden, und die Minuten laufen weiter. Plane den Halt darum vor der Fahrt: ausserhalb der Altstadt-Zonen und weg vom Rhein.' },
      ],
    },
    {
      heading: 'Parkieren in Basel: Rhein, Bahnhof SBB und Trottoir',
      blocks: [
        '**Am Rhein:** Von der Dreirosen- bis zur Schwarzwaldbrücke sind der Fluss und seine Brücken eine einzige Parkverbotszone, die ganze Mittlere Brücke eingeschlossen. Darüberfahren darfst du auf der Strasse oder dem Velostreifen, die Fahrt beenden aber weder auf einer Brücke noch unten am Wasser; wo die Zone entlang der Rheinwege endet, zeigt die App. Der Grund: 2021 wurde laut Regierung im Schnitt jede Woche ein E-Trottinett aus einem Gewässer geborgen.',
        '**Am Bahnhof SBB:** Der Centralbahnplatz ist Sperr- und Parkverbotszone, und auch beim Bahnhof Süd beendest du keine Fahrt. Dafür hat der Kanton am Bahnhof zwei kleine markierte Sharing-Zonen eingerichtet; wo genau, zeigt die App. Im Bahnhof selbst schiebst du: Die SBB verbietet das Fahren auf ihrem Areal.',
        'Überall sonst parkierst du wie ein Velo und nach der Nutzungsordnung:',
        {
          list: [
            'auf dem Trottoir nur, wenn 1,50 m für Fussgänger frei bleiben, sonst kostet es CHF 20.–;',
            'höchstens zwei Sharing-Fahrzeuge pro Standort, also im Umkreis von 50 m;',
            'nie in einer Durchfahrt oder so, dass es den Verkehr behindert: Solche Trottis werden ohne Vorwarnung abgeschleppt, «wie bei Privaten auch».',
          ],
        },
        'Falsch parkieren kostet auch dich. Die Polizei ermittelt über den Anbieter, wer gefahren ist, und die Busse landet bei dir, oft samt Bearbeitungsgebühr (Bolt höchstens CHF 30.–, Dott 50 Euro). Dazu kommen Gebühren der Anbieter, von CHF 25.– bei Voi bis zu je CHF 125.– fürs Abholen und für die Bearbeitung bei Lime. Steht ein Trotti im Weg, melde es auf [trotti-melder.ch](https://trotti-melder.ch) oder bei der Hotline des Anbieters.',
      ],
    },
    {
      heading: 'Grenze, EuroAirport, Tramschienen: Tipps für Basel',
      blocks: [
        '**Nicht über die Grenze.** Die Gebiete der Anbieter enden an der Landesgrenze, und Bolt bremst dort bis zum Stillstand. Nach Weil am Rhein, Huningue oder Saint-Louis kommst du mit dem Miet-Trotti also nicht: Beende die Fahrt auf der Schweizer Seite. Auch mit dem eigenen Trotti lässt du es besser bleiben: Deutschland lässt ausländische E-Scooter seit dem 1. April 2026 nur mit gleichwertiger EU- oder EWR-Genehmigung und Versicherung zu, und Frankreich verlangt eine Haftpflichtversicherung. Was drüben gilt, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
        '**Nicht an den EuroAirport.** Der Flughafen ist binational, mit einem Schweizer und einem französischen Sektor, doch kein Basler Anbieter fährt bis dorthin. Nimm den öffentlichen Verkehr.',
        '**Tramschienen.** Der Velostadtplan des Kantons markiert 74 Gefahrenstellen, darunter gefährliche Kreuzungen am Aeschenplatz, an der Heuwaage, am Wettsteinplatz und am Bundesplatz. Heikel sind auch Kaphaltestellen, an denen du im Gleisbereich fährst, etwa beim Bankverein, beim Kirschgarten und an der Rheingasse. Unser Rat: Schienen möglichst rechtwinklig queren, nie in der Rille fahren und bei Nässe doppelt vorsichtig sein.',
        '**Steigungen.** Die steilen Altstadtgassen wie Spalenberg, Münsterberg und Rheinsprung liegen ohnehin in Fussgänger- oder Sperrzonen.',
      ],
    },
    {
      heading: 'Herbstmesse, Fasnacht, Art Basel: Trottis an Grossanlässen',
      blocks: [
        'Bei Grossanlässen mit Strassensperren richtet der Kanton temporäre Sperrzonen ein, in denen du Miet-Trottis nicht abstellen kannst; genannt hat er die Fasnacht, Em Bebbi sy Jazz und die Parade des Basel Tattoo. An der Fasnacht 2023, der ersten mit solchen Zonen, wurden die Trottis im Zentrum sogar bis zum Stillstand abgebremst, und Voi setzte zusätzlich einen Reaktionstest gegen Fahren unter Alkohol ein. Welche Zonen gerade gelten, zeigt die App.',
        {
          table: {
            caption: 'Die nächsten Grossanlässe in Basel',
            head: ['Anlass', 'Datum', 'Was du wissen musst'],
            rows: [
              ['Herbstmesse', '24. Oktober bis 8. November 2026, auf dem Petersplatz bis 10. November', 'Der Petersplatz ist ohnehin Sperrzone; weitere Zonen zeigt die App'],
              ['Fasnacht', 'Morgestraich am Montag, 15. Februar 2027, um 4 Uhr', 'Temporäre Sperrzonen im Zentrum: Parkieren geht dort nicht, Fahren womöglich auch nicht'],
              ['Art Basel', '17. bis 20. Juni 2027', 'Am Messeplatz gilt keine feste Zone; allfällige temporäre zeigt die App'],
            ],
          },
        },
      ],
    },
    {
      heading: 'E-Trottinett-Regeln in 60 Sekunden',
      blocks: [
        {
          list: [
            '**Ab 18** bei Lime, Voi, Dott, Bird und Bolt; bei Hopp prüfst du es in der App. Gesetzlich gilt: ab 16 ohne Führerausweis, mit 14 und 15 mit Ausweis der Kategorie M.',
            '**Velostreifen oder Veloweg**, wo es einen gibt, sonst die Strasse. **Nie aufs Trottoir**: CHF 40.– Busse.',
            '**In der Fussgängerzone schieben**, sonst CHF 30.–.',
            '**Nur eine Person**, niemand fährt mit.',
            '**Licht an**, auch am Tag: Ohne kostet es tagsüber CHF 20.–.',
            '**Helm** empfohlen, aber keine Pflicht.',
            '**0,5 Promille** sind die Grenze, auch für Neulenkende mit Führerausweis auf Probe.',
            '**Handy in der Hand**: CHF 40.–. **Rotlicht**: CHF 60.–.',
          ],
        },
        'Ohne Wohnsitz in der Schweiz zahlst du eine Ordnungsbusse sofort oder hinterlegst eine Sicherheit. Alle Bussen und Altersgrenzen findest du in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Velospot und andere Alternativen zum Trotti',
      blocks: [
        {
          list: [
            '**Velospot** von PubliBike ist das Bikesharing, das der Kanton bestellt: Velos und E-Bikes, das ganze Jahr. Mit dem Code RIDEBASEL bekommst du ein Monatsabo gratis, 30 Tage gültig im Netz Basel-Hochrhein: Mit dem Velo sind die ersten 30 Minuten jeder Fahrt gratis, mit dem E-Bike kosten die ersten 15 Minuten CHF 2.– und die nächsten 15 CHF 1.– (Stand Oktober 2026). Entsperren kannst du per App oder SwissPass; fahren darfst du in Basel schon ab 14, mit Mofa-Ausweis (Kategorie M) und Einwilligung der Eltern.',
            '**Pick-e-Bike** vermietet E-Bikes und E-Scooter mit Sitz, die eher E-Mopeds sind; welchen Ausweis du dafür brauchst, zeigt die App.',
            '**Carvelo** vermietet Cargo-Velos.',
          ],
        },
        'E-Trottinette hat PubliBike in Basel keine.',
      ],
    },
    {
      heading: 'Schon gewusst? Drei Basler Trotti-Geschichten',
      blocks: [
        {
          list: [
            'Lime startete im Oktober 2018 mit rund 50 Trottis in Basel. Drei Monate später holte die Firma ihre Schweizer Flotten von der Strasse, in Basel 250 Stück: Ein Softwarefehler schaltete die Displays aus und löste während der Fahrt die Vorderbremse aus.',
            'Am 14. Oktober 2021 zählte der Kanton 1008 E-Trottinette von sechs Firmen, bei einem theoretischen Maximum von 1200. Ob er wisse, warum ein Anbieter Basel verlassen habe? Die ganze Antwort der Regierung: «Nein.»',
            'Die vier Rheinfähren Wild Maa, Leu, Vogel Gryff und Ueli haben keinen Motor: Sie hängen an einem Stahlseil, und die Strömung treibt sie ans andere Ufer. Ein Velo fährt für 80 Rappen mit. Ob ein Trotti mitdarf, sagt keine Quelle, die wir gefunden haben: Beende die Fahrt vorher auf der Strasse und geh zu Fuss an Bord.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Wo melde ich ein falsch parkiertes E-Trottinett in Basel?',
      answer: 'Auf trotti-melder.ch, auf das auch der Kanton verweist, oder bei der Hotline des Anbieters, die täglich von 7 bis 19 Uhr erreichbar sein muss. Der Anbieter muss Beschwerden innert 12 Stunden erledigen. Versperrt ein Trotti eine Durchfahrt oder behindert es den Verkehr, wird es ohne Vorwarnung abgeschleppt.',
    },
    {
      question: 'Kann ich mit dem Miet-Trotti nach Weil am Rhein oder Saint-Louis fahren?',
      answer: 'Nein. Die Gebiete der Anbieter enden an der Grenze, und Bolt bremst seine Trottis dort bis zum Stillstand ab. Beende die Fahrt auf der Schweizer Seite und geh zu Fuss oder mit dem öffentlichen Verkehr weiter.',
    },
    {
      question: 'Darf ich an der Fasnacht E-Trottinett fahren?',
      answer: 'Grundsätzlich ja, aber im Zentrum gelten temporäre Sperrzonen, in denen du nicht parkieren kannst; 2023 wurden die Trottis dort auch beim Fahren gestoppt. Welche Zonen rund um den Morgestraich vom 15. Februar 2027 gelten, zeigt die App. Die Grenze von 0,5 Promille gilt auch an der Fasnacht.',
    },
    {
      question: 'Bin ich auf einem Miet-Trotti versichert?',
      answer: 'Lime, Bolt und Voi schliessen eine Haftpflichtversicherung im Preis ein, sie zahlt aber erst nach deiner eigenen Privathaftpflicht. Dotts zuletzt veröffentlichte Deckung zahlte nur, was deine anderen Versicherungen nicht deckten. Bird nennt keine Beträge, und für Hopp haben wir keine Schweizer Bedingungen gefunden. Mitfahrende sind nie versichert.',
    },
  ],
  sources: [
    { title: 'Kanton Basel-Stadt: Nutzungsordnung für bewilligungsfreie Sharing-Angebote im Bereich der Mikromobilität (Version vom 1.9.2025, PDF)', url: 'https://media.bs.ch/original_file/b735d5668e92ceb7f855291962d54dbcb3f62b7f/2025-09-01-nutzungsordnung-bewilligungsfreie-sharingangebote.pdf' },
    { title: 'Kanton Basel-Stadt: Shared Mobility, mit Karte der Sperr- und Parkverbotszonen', url: 'https://www.bs.ch/bvd/mobilitaet/shared-mobility' },
    { title: 'Kanton Basel-Stadt: Leihfahrzeuge in Basel', url: 'https://www.bs.ch/themen/mobilitaet/fahren-und-parkieren/oev-und-leihfahrzeuge/leihfahrzeug-finden' },
    { title: 'Grosser Rat Basel-Stadt: Bericht 22.5513.02 zum Anzug gegen das Wildparken von E-Trottinetten (2024, PDF)', url: 'https://grosserrat.bs.ch/dokumente/100408/000000408531.pdf' },
    { title: 'Grosser Rat Basel-Stadt: Antwort des Regierungsrats 21.5664.02 zu E-Trottinetten (2021, PDF)', url: 'https://grosserrat.bs.ch/dokumente/100395/000000395878.pdf' },
    { title: 'Kanton Basel-Stadt, Open Data: Velostadtplan, Hinweise und Gefahrenstellen', url: 'https://data.bs.ch/explore/dataset/100404/' },
    { title: 'Kanton Basel-Stadt, Open Data: Velostadtplan, Fussgängerzonen', url: 'https://data.bs.ch/explore/dataset/100440/' },
    { title: 'Herbstmesse Basel: Daten 2026', url: 'https://www.herbstmesse.ch/' },
    { title: 'PubliBike: Velospot in Basel', url: 'https://www.publibike.ch/de/basel' },
    { title: 'Ordnungsbussenverordnung (OBV), Bussenliste', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
