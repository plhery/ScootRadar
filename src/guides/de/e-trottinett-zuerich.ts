import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-zuerich',
  topic: 'zurich',
  name: 'E-Trottinett Zürich: Anbieter, Preise, Zonen',
  title: 'E-Trottinett Zürich 2026: Preise, Sperrzonen, Parkieren',
  description: 'E-Trottinett Zürich: welche Anbieter es gibt, was zehn Minuten kosten, wo du nicht fahren oder parkieren darfst und worauf du bei Tramschienen achtest.',
  headline: 'E-Trottinett Zürich: Anbieter, Preise, Sperrzonen und wo du parkierst',
  lede: 'Ein E-Trottinett in Zürich mietest du in der App von Lime, Bolt, Bird, Voi, Dott, Hopp oder PubliBike: QR-Code scannen, entsperren und auf dem Velostreifen losfahren, mit höchstens 20 km/h. Zehn Minuten kosten bei PubliBike CHF 3.– (CHF 1.– plus 20 Rappen pro Minute, Stand Oktober 2026), bei Bolt und Voi CHF 5.20 (CHF 1.– plus 42 Rappen, veröffentlichte Tarife vom 12. Oktober 2026). In der Altstadt und auf dem Bahnhofplatz kannst du die Fahrt nicht beenden: Parkiere in einer Parkierzone der App oder ausserhalb der Parkverbotszone.',
  published: '2026-10-12',
  updated: '2026-10-13',
  city: 'ch:zurich',
  sections: [
    {
      heading: 'Welche E-Scooter kannst du in Zürich mieten?',
      blocks: [
        'ScootRadar zeigt in Zürich E-Trottinette von sieben Marken: Bird, Bolt, Dott, Hopp, Lime, Voi und PubliBike. Eine Liste der Anbieter veröffentlicht die Stadt nicht; im März 2025 zählte sie sieben Anbieter mit Bewilligung, E-Trottinette, E-Bikes und E-Mopeds zusammengenommen. Gut zu wissen bei vier von ihnen:',
        {
          list: [
            '**Lime**: In Zürich kannst du Lime auch über die Uber-App mieten.',
            '**Dott** hat 2024 mit Tier fusioniert; wer früher Tier fuhr, nutzt heute die Dott-App.',
            '**Hopp** (Island, arbeitet mit lokalen Franchisenehmern): Schweizer Bedingungen stehen nicht auf der Website, Mindestalter und Versicherung prüfst du darum in der App.',
            '**PubliBike**, die Schweizer Firma hinter Züri Velo: seit dem 26. Februar 2026 mit E-Trottinetten unterwegs, bewilligt sind bis zu 400. An Züri-Velo-Stationen darfst du sie nicht abstellen.',
          ],
        },
        'Am 12. Oktober 2026 zeigte die [Karte rund um Zürich](map:ch:zurich) etwa 5200 Fahrzeuge dieser sieben Marken, die Agglomeration eingerechnet. So kommst du zu deinem Trotti:',
        {
          steps: [
            'Das nächste Trotti, egal von welchem Anbieter, auf der [Live-Karte von Zürich](map:ch:zurich) suchen.',
            'Antippen, die App des Anbieters öffnen, dich registrieren und eine Kredit- oder Debitkarte hinterlegen. Lime, Bolt, Bird, Voi, Dott und PubliBike verlangen laut ihren Schweizer Bedingungen, dass du mindestens 18 bist.',
            'QR-Code scannen, entsperren und auf dem Velostreifen oder der Strasse losfahren.',
            'Die Fahrt dort beenden, wo die App es zulässt, und das verlangte Foto machen.',
          ],
        },
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in Zürich?',
      blocks: [
        'Du zahlst eine Gebühr fürs Entsperren und einen Minutenpreis. Bolt, Hopp, Voi, Dott und Lime veröffentlichen ihre Tarife in offenen Datenfeeds; die Tabelle zeigt sie mit Stand vom 12. Oktober 2026 (Dott und Lime vom 13. Oktober), dazu den Tarif von PubliBike aus seiner eigenen Preisliste. Je nach Zone und Tageszeit können die Preise abweichen; den Endpreis zeigt die App vor der Fahrt.',
        {
          table: {
            caption: 'Veröffentlichte Tarife für E-Trottinette in Zürich (Feeds vom 12. und 13. Oktober 2026; PubliBike: publibike.ch, Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten'],
            rows: [
              ['PubliBike (publibike.ch, Oktober 2026)', 'CHF 1.–', '20 Rappen', 'CHF 3.–'],
              ['Hopp', 'CHF 1.–', '40 Rappen', 'CHF 5.–'],
              ['Dott', '95 Rappen', '41 Rappen', 'CHF 5.05'],
              ['Bolt', 'CHF 1.–', '42 Rappen (einzelne zu 48 Rappen)', 'CHF 5.20'],
              ['Voi', 'CHF 1.–', '42 Rappen (einige zu 39 Rappen)', 'CHF 5.20'],
              ['Lime', 'CHF 1.–', '49 Rappen (einige zu 42 Rappen)', 'CHF 5.90'],
              ['Bird', 'nicht veröffentlicht', 'nicht veröffentlicht', 'Tarif in der App'],
            ],
          },
        },
        'Bird veröffentlicht keine Tarife: Den Preis siehst du in der App, bevor du entsperrst. Lime kennzeichnet seine Tarife im Feed als Preise ohne Steuern, darum schätzt die Karte bei Lime keinen Preis; den Endpreis zeigt die App. Das Jahresabo von PubliBike für CHF 69.– macht seine E-Trottinette nicht günstiger. Eine durchschnittliche Fahrt ist in Zürich rund 1,5 km lang und dauert etwa 10 Minuten, sagt der Chef der städtischen Verkehrssicherheit. Wie Zürich im Vergleich zu anderen Städten abschneidet, steht unter [E-Trottinett-Preise in der Schweiz](guide:swiss-prices).',
      ],
    },
    {
      heading: 'Bewilligung und Obergrenzen: So regelt Zürich das Sharing',
      blocks: [
        'Wer in Zürich mehr als 30 Zweiräder ohne feste Stationen vermietet, braucht seit dem 1. April 2019 eine Bewilligung der Stadt. Sie gilt für höchstens 800 Fahrzeuge desselben Typs und kostet CHF 10.– pro Fahrzeug und Monat, dazu kommen CHF 50.– Kaution pro Fahrzeug und eine Kontrollgebühr von CHF 1500.– im Jahr.',
        'Falsch parkierte Trottis müssen die Anbieter innert 24 Stunden wegräumen, solche, die behindern, sofort. Ausserdem müssen sie der Stadt ihre Nutzungsdaten liefern. Eine Obergrenze für die Zahl der Anbieter gibt es noch nicht: Wer die Auflagen erfüllt, bekommt eine Bewilligung. Am 26. August 2026 waren laut Stadt 7350 Sharing-Fahrzeuge unterwegs, E-Bikes und E-Mopeds eingerechnet.',
      ],
    },
    {
      heading: 'Der Plan der Stadt: drei Anbieter, 3000 Fahrzeuge',
      blocks: [
        'Am 26. August 2026 legte der Stadtrat im Gemeinderat seinen Plan dar: drei Anbieter und insgesamt 3000 Sharing-Fahrzeuge, vergeben per öffentlicher Ausschreibung. In der Innenstadt, am Hauptbahnhof und an anderen belebten Orten würdest du dann nur noch an festen, markierten Stationen parkieren; anderswo bliebe Free-Floating erlaubt. Zuerst braucht es dafür neue Regeln und die Ausschreibung.',
        'Ein offizielles Datum gibt es noch nicht. Im Gemeinderat war von einer Ausschreibung im Herbst 2026 und einem Neustart im Frühling 2027 die Rede; bis das neue System gilt, bleiben die heutigen Regeln und Zonen. Als Vorbild nennt die Stadt Winterthur, wo laut SRF seit Anfang 2026 nur noch Voi unterwegs ist.',
      ],
    },
    {
      heading: 'Sperrzonen: Wo du in Zürich nicht fahren oder parkieren darfst',
      blocks: [
        'Die Stadt legt drei Arten von GPS-Zonen fest, veröffentlicht sie als Open Data und verpflichtet alle Anbieter, sie in der App anzuzeigen. Das Trotti setzt sie per GPS selbst durch.',
        {
          table: {
            caption: 'Die Sharing-Zonen der Stadt Zürich',
            head: ['Zone', 'Was passiert', 'Beispiele'],
            rows: [
              ['Fahrverbotszone', 'Das Trotti fährt nur noch Schritttempo, beenden kannst du die Fahrt hier nicht', 'Altstadt beidseits der Limmat, grösstenteils die Bahnhofstrasse zwischen HB und Paradeplatz, Platzspitz, Arboretum'],
              ['Parkverbotszone', 'Durchfahren ja, Fahrt beenden nein', 'Bahnhofplatz, Europaplatz, Sechseläutenplatz, Stadelhofen, Oerlikon, Polyterrasse der ETH'],
              ['Parkierzone', 'Hier beendest du die Fahrt, oft gibt es dafür Guthaben oder Freiminuten', 'Sechseläutenplatz (am Rand), Bürkliplatz, Löwenplatz, Stadelhofen, Enge, drei Plätze rund um den HB'],
            ],
          },
        },
        'Am See sind das Arboretum am General-Guisan-Quai und die Stadthausanlage beim Bürkliplatz Fahrverbotszonen; an den übrigen Quais gilt: weg von Fusswegen und Trottoir, auf den Velostreifen oder die Strasse. Fast alle Schulareale und Friedhöfe sind für Fahren und Parkieren gesperrt, und für Anlässe wie Street Parade oder Sechseläuten kommen temporäre Zonen dazu, die die Apps vorher anzeigen. In Fussgängerzonen darfst du nicht fahren, ausser eine Zusatztafel erlaubt Velos, und im SBB-Bahnhof wird gestossen.',
        { note: 'In einer Fahr- oder Parkverbotszone lässt dich die App die Fahrt nicht beenden, und die Minuten laufen weiter, bis du einen erlaubten Ort erreichst. Auf dem Sechseläutenplatz etwa parkierst du nur in den Parkierzonen am Rand des Platzes.' },
      ],
    },
    {
      heading: 'Wo du dein E-Trottinett in Zürich parkierst',
      blocks: [
        'Parkierzonen gibt es nur in der App, auf der Strasse ist nichts markiert. Schau an belebten Orten also nach, bevor du ankommst.',
        'Am Hauptbahnhof sind Bahnhofplatz und Europaplatz Parkverbotszonen. Nimm stattdessen eine der drei Parkierzonen in der Nähe: am Bahnhofquai auf der Limmatseite, bei der Kasernenstrasse oder auf der Nordwestseite beim Sihlquai.',
        'Überall sonst parkierst du wie ein Velo:',
        {
          list: [
            'auf dem Trottoir nur, wenn 1,5 m für Fussgänger frei bleiben, sonst gibt es CHF 20.– Busse;',
            'nie auf den taktilen Leitlinien für Blinde und Sehbehinderte;',
            'ausserhalb von Veloparkplätzen höchstens zwei Sharing-Fahrzeuge zusammen, mit mindestens 50 m bis zum nächsten Paar.',
          ],
        },
        'Falsch parkieren kostet auch dich: Voi darf nach Verwarnungen CHF 25.– verlangen, PubliBike beim ersten Mal CHF 30.– und danach CHF 50.–, Bolt bis CHF 100.–, wenn ein Trotti ausserhalb des Gebiets abgeholt werden muss. Steht eines im Weg, melde es auf [trotti-melder.ch](https://trotti-melder.ch) oder der Stadt über die App «Züri wie neu».',
      ],
    },
    {
      heading: 'Tramschienen, Steigungen und andere Gefahren in Zürich',
      blocks: [
        'Die Stadt sagt es selbst: Ihre Infrastruktur ist für E-Trottinette «nicht ausreichend fehlerverzeihend», wie zahlreiche Stürze an Randsteinen und auf Tramschienen zeigen. Mit kleinen Rädern und hohem Schwerpunkt kippen die Trottis zudem leicht.',
        'Unser Rat bei 15 Tramlinien in der Stadt: Schienen möglichst rechtwinklig queren und nie in der Rille fahren.',
        'Zürich ist steiler, als es vom See aus wirkt: Die Seilbahn Rigiblick fährt laut ZVV mit durchschnittlich über 25 Prozent Steigung auf den Zürichberg. Der Motor eines Miet-Trottis leistet höchstens 0,5 kW und hilft nur bis 20 km/h: Bergauf wirst du langsamer, bergab bremst du früh.',
        'Die Polizei registrierte 2025 in der Stadt 130 Unfälle mit E-Trottinetten, nach 101 im Vorjahr, und rund 60 Prozent davon waren Selbstunfälle. Laut Stadt ist dabei meist Alkohol im Spiel, und in Wochenendnächten wird oft angetrunken gefahren.',
      ],
    },
    {
      heading: 'Die Regeln in 60 Sekunden',
      blocks: [
        {
          list: [
            '**Ab 18** bei allen Anbietern, deren Schweizer Bedingungen wir geprüft haben. Das Gesetz selbst: ab 16 ohne Führerausweis, ab 14 mit Führerausweis der Kategorie M.',
            '**Velostreifen oder Veloweg**, wo es einen gibt, sonst die Strasse. **Nie aufs Trottoir**: CHF 40.– Busse.',
            '**Nur eine Person**, niemand fährt mit.',
            '**Licht an**, auch am Tag: Ohne kostet es tagsüber CHF 20.–.',
            '**Helm** empfohlen, aber keine Pflicht.',
            '**0,5 Promille** sind die Grenze, auch für Neulenkende mit Führerausweis auf Probe.',
            '**Handy in der Hand**: CHF 40.–. **Rotlicht**: CHF 60.–.',
          ],
        },
        'Alle Bussen, Altersgrenzen und die Änderungen von 2025 findest du in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
  ],
  faq: [
    {
      question: 'Können Touristen in Zürich ein E-Trottinett mieten?',
      answer: 'Ja, ab 18. Keine der Schweizer Anbieterbedingungen, die wir gelesen haben, verlangt einen Wohnsitz in der Schweiz: Du registrierst dich in der App und zahlst mit Karte. Ohne Wohnsitz in der Schweiz musst du eine Ordnungsbusse allerdings sofort bezahlen oder eine Kaution hinterlegen.',
    },
    {
      question: 'Bin ich auf einem Miet-Trotti versichert?',
      answer: 'Lime, Bolt, Voi und Dott haben eine Haftpflichtversicherung im Preis, sie zahlt aber erst nach deiner eigenen Privathaftpflicht. Bird schreibt in seinen Bedingungen, die Trottis seien haftpflichtversichert, nennt aber keine Beträge. PubliBike versichert nichts: Laut AGB ist die Versicherung Sache der Kundschaft. Mitfahrende sind nie gedeckt.',
    },
    {
      question: 'Gilt in Zürich eine Helmpflicht für E-Trottinette?',
      answer: 'Nein, in der Schweiz gibt es für E-Trottinette keine Helmpflicht. Die BFU empfiehlt aber nachdrücklich einen Helm, und Dott warnt, dass Kopfverletzungen ohne Helm womöglich nicht gedeckt sind. Im August 2026 erklärte sich der Bundesrat bereit, eine Helmpflicht für E-Trottinette bei der nächsten Verordnungsanpassung in die Vernehmlassung zu geben; einen Entwurf oder ein Datum gibt es noch nicht.',
    },
    {
      question: 'Wie viele E-Trottinette gibt es in Zürich?',
      answer: 'Rund 5000 Miet-Trottis, sagte der Chef der städtischen Verkehrssicherheit im September 2026. Mit E-Bikes und E-Mopeds zählte die Stadt im August 2026 insgesamt 7350 Sharing-Fahrzeuge; diese Zahl will sie auf 3000 senken.',
    },
    {
      question: 'Darf ich ein Miet-Trotti ins Tram oder in den Zug mitnehmen?',
      answer: 'Praktisch nicht: Die Fahrt muss im Gebiet des Anbieters enden, und Voi begrenzt eine Miete auf eine Stunde. Beende die Fahrt beim Bahnhof, in einer Parkierzone oder ausserhalb der Parkverbotszone, und miete am Ziel ein neues.',
    },
  ],
  sources: [
    { title: 'Stadt Zürich: Stationsloser Fahrzeugverleih (Bewilligung)', url: 'https://www.stadt-zuerich.ch/de/stadtleben/veranstaltungen-und-bewilligungen/gewerbe-und-maerkte/andere-nutzungsarten/stationsloser-fahrzeugverleih.html' },
    { title: 'Stadtratsbeschluss Nr. 168/2019: Bewilligung und Gebühren für stationslosen Verleih (PDF)', url: 'https://www.stadt-zuerich.ch/dam/web/de/politik-verwaltung/politik-recht/stadtratsbeschluesse/2019/Mrz/StZH_STRB_2019_0168.pdf' },
    { title: 'Weisung GR Nr. 2025/210 des Stadtrats zur Regulierung der Sharing-Mikromobilität', url: 'https://www.gemeinderat-zuerich.ch/dokumente/9c8a7ffaed6e4f3ca6234611a78f2946-332' },
    { title: 'Gemeinderat Zürich: Protokoll der Sitzung vom 26. August 2026', url: 'https://www.gemeinderat-zuerich.ch/dokumente/d2565cda09634f2fbdfc8e781ba347a4-332' },
    { title: 'Stadt Zürich, Open Data: Sharing-Zonen (Fahrverbots-, Parkverbots- und Parkierzonen)', url: 'https://www.stadt-zuerich.ch/geodaten/download/Sharing_Zonen' },
    { title: 'Stadt Zürich: Elektro-Trendfahrzeuge, was gilt', url: 'https://www.stadt-zuerich.ch/de/mobilitaet/verkehrssicherheit/sicher-auf-dem-velo/elektro-trendfahrzeuge.html' },
    { title: 'Stadtratsbeschluss Nr. 1828/2026 zu den E-Trottinetten von PubliBike (PDF)', url: 'https://www.stadt-zuerich.ch/content/dam/web/de/politik-verwaltung/politik-recht/stadtratsbeschluesse/2026/05/stzh-strb-2026-1828.pdf' },
    { title: 'PubliBike: Preise & Abos', url: 'https://www.publibike.ch/de/abos' },
    { title: 'Stadt Zürich, Kampagne Street Smart: E-Trottinett', url: 'https://www.stadt-zuerich.ch/artikel/de/kampagne/street-smart/e-trottinett.html' },
    { title: 'TCS Zürich: Interview mit dem Chef der städtischen Verkehrssicherheit, September 2026', url: 'https://www.tcs.ch/de/der-tcs/sektionen/zuerich/news/verkehrssicherheit-10-26.php' },
    { title: 'Ordnungsbussenverordnung (OBV), Bussenliste', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
