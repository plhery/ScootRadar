import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-erlangen',
  topic: 'erlangen',
  name: 'E-Scooter Erlangen: Voi, Dott, Bolt, Parken, Regeln',
  title: 'E-Scooter Erlangen 2026: Voi, Dott, Bolt, Parken, Regeln',
  description: 'E-Scooter in Erlangen leihen: Voi, Dott und Bolt, Parkzonen und Abstellverbote der Stadt, Schlossgarten, Bergkirchweih und was in Bus und Bahn gilt.',
  headline: 'E-Scooter Erlangen: Voi, Dott und Bolt, die Regeln der Stadt und die Bergkirchweih',
  lede: 'Einen E-Scooter in Erlangen leihst du ab 18 und ohne Führerschein bei Voi, Dott (früher Tier) oder Bolt: Diese drei Anbieter nennt die Stadt. Du fährst auf Radweg oder Fahrbahn, nie auf dem Gehweg, auch nicht, wenn er für Radfahrer freigegeben ist. Am Schlossplatz, Hugenottenplatz und Rathausplatz, im Schlossgarten und in den Parks kannst du die Fahrt nicht beenden. Auf dem Gelände der Bergkirchweih sind E-Scooter verboten, und in Bus und U-Bahn des VGN darf laut dpa seit Mai 2024 keiner mit.',
  published: '2026-11-01',
  updated: '2026-11-01',
  city: 'de:Erlangen',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Erlangen?',
      blocks: [
        'In Erlangen sind laut Stadt drei Anbieter aktiv: **Voi**, **Dott** (früher Tier) und **Bolt** (Stand 18. August 2026). Dott führt Erlangen unter seinen Standorten, und Bolts Seite «Bolt in Erlangen» nennt E-Scooter unter den verfügbaren Kategorien (beides gelesen am 1. November 2026). Du leihst in der App des Anbieters, ab 18 und ohne Führerschein. Schritt für Schritt: [E-Scooter mieten](guide:how-to-rent).',
        'Auf der [Karte von Erlangen](map:de:Erlangen) zeigt ScootRadar alle drei. Am Sonntag, 1. November 2026, um 1:04 Uhr standen dort rund 400 Scooter, die zu diesem Zeitpunkt frei waren: rund 180 von Dott und 220 von Bolt. Die Zahl nimmt auch die paar Scooter mit, die gleich hinter der Stadtgrenze in Buckenhof und Spardorf stehen.',
        'Voi steckt nicht in dieser Zahl: Vois Nürnberger Gebiet reicht bis Erlangen, und herausgezoomt rechnet die Karte seine Scooter zu [Nürnberg](map:de:Nürnberg). Zoomst du hinein, siehst du sie: Um 1:17 Uhr standen in Erlangen rund 300 freie Voi-Scooter. Preise, Zonen und Parkflächen zeigt die Karte in Erlangen nicht: Die stehen in der App.',
        '**Lime** nennt die Stadt nicht, und die Karte zeigt in Erlangen keinen Lime-Scooter; Lime fährst du in [Nürnberg](guide:nuremberg) und [Fürth](guide:fuerth).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Erlangen?',
      blocks: [
        'Einen Tarif für Erlangen nennen Dott und Bolt auf ihren Seiten nicht; den Preis zeigt dir die App vor dem Entsperren, auch bei Voi. Dott schreibt: «In der Dott-App siehst du den Preis, der in deiner Region gilt.» Bei Bolt gehört «die geltende Gebührentabelle, wie sie in der App angezeigt wird» zum Vertrag. Teuer wird falsches Parken:',
        {
          table: {
            caption: 'Gebühren laut den Bedingungen der Anbieter',
            head: ['Anbieter', 'Falsch abgestellt', 'Wenn der Anbieter ein Bussgeld für dich bearbeitet', 'Stand'],
            rows: [
              ['Bolt', '15 €, wenn der Scooter falsch steht und kein deutliches Abstellfoto da ist; bis zu 100 € Abholgebühr ausserhalb des zulässigen Parkbereichs', 'höchstens 30 € Verwaltungsgebühr', 'seit 1. August 2023, gleich ab 1. Dezember 2026'],
              ['Dott', 'bis zu 300 € für die Rückholung, wenn du Park- und Sperranweisungen nicht befolgst', '50 € Verwaltungsgebühr', '23. September 2025'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Wo darf man in Erlangen mit dem E-Scooter fahren?',
      blocks: [
        'Innerorts musst du laut Stadt Radwege und Radfahrstreifen nehmen, auch wenn sie für Radfahrer nicht benutzungspflichtig sind, dazu gemeinsame Geh- und Radwege und Fahrradstrassen. Gibt es keinen Radweg, fährst du auf der Strasse. Gehwege und Fussgängerzonen sind tabu, ausser das Zusatzzeichen «Elektrokleinstfahrzeuge frei» erlaubt es.',
        '**«Radverkehr frei» gilt nicht für dich:** Ist ein Gehweg mit diesem Zusatzzeichen für Radfahrer freigegeben, darfst du dort laut Stadt nicht fahren. Ausnahme: Dürfen Radfahrer eine Einbahnstrasse mit «Radverkehr frei» in Gegenrichtung befahren, darfst du es mit dem E-Scooter ebenfalls. Ab 1. März 2027 gibt «Radverkehr frei» bundesweit auch Gehweg und Fussgängerzone für E-Scooter frei, dann im Schritttempo.',
        '**Parks:** In Grünanlagen fährst du laut dem Mustervertrag der Stadt von 2020 nur auf ausgewiesenen Radwegen. Auch die Grünanlagensatzung verbietet dort Kraftfahrzeuge ausserhalb der zugelassenen Wege, und E-Scooter sind laut Stadt Kraftfahrzeuge.',
        '**Schlossgarten:** Er gehört der Universität Erlangen-Nürnberg, die Stadt betreibt ihn. Seine Satzung ist eindeutig: «Das Befahren der Wege im Schlossgarten mit Fahrrädern und motorisierten Fahrzeugen sowie das Einbringen von motorisierten Fahrzeugen in den Schlossgarten sind nicht gestattet».',
      ],
    },
    {
      heading: 'E-Scooter in Erlangen abstellen: Parkzonen und Verbotszonen',
      blocks: [
        'Die Stadt hat mit den Anbietern **Abstellverbotszonen** vereinbart. Dort lässt dich die App die Fahrt nicht beenden, erst ausserhalb kannst du den Scooter zurückgeben. In der Innenstadt gehören laut Stadt unter anderem dazu:',
        {
          list: [
            'Bahnhofsvorplatz und Schlossgarten',
            'Schlossplatz, Hugenottenplatz und Altstädter Kirchenplatz',
            'Neustädter Kirchenplatz, Bohlenplatz und Rathausplatz',
            'Nürnberger Strasse und Hauptstrasse vom Rathausplatz bis zur Wasserturm- und Heuwaagstrasse',
          ],
        },
        'Ausserhalb der Innenstadt sind es vor allem Grün- und Wasserflächen, etwa der Röthelheimpark mit dem Exerzierplatz und die Brucker Lache. Die Anbieter dürfen eigene Zonen hinzufügen. Gehwege ganz zu sperren, geht laut Stadt nicht, weil GPS nur auf 5 bis 10 Meter genau ist.',
        '**Parkzonen:** Am Bahnhofsvorplatz, in der Nürnberger Strasse gegenüber dem Rathausplatz und an vielen Mobilpunkten hat die Stadt Flächen für E-Scooter eingerichtet, am Boden mit einem E-Scooter-Symbol markiert. Der Bahnhofsvorplatz selbst ist Abstellverbotszone: Dort stellst du den Scooter nur auf der markierten Fläche ab. Manche Anbieter belohnen das laut Stadt mit Freiminuten. Die Übersichtskarte der Stadt (Stand November 2024) zeigt zehn Parkzonen, zwei davon am Bahnhof.',
        '**Überall sonst** stellst du den Scooter am Rand von Gehweg oder Platz ab, und es müssen immer zwei Meter Durchgang bleiben; reicht der Platz nicht, darfst du dort nicht abstellen. Rettungswege, Einfahrten, Feuerwehrzufahrten, Bushaltestellen, Flächen für die Barrierefreiheit und Grünflächen bleiben frei. Höchstens vier Scooter stehen nebeneinander, mit 50 Metern bis zur nächsten Gruppe.',
        'Dazu kommen die Anbieter: Hat eine Gemeinde Parkplätze ausgewiesen, parkst du laut Dotts Geschäftsbedingungen nur dort, und Dott kann ein Foto verlangen. Bolt verbietet das Parken in den roten Bereichen seiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Abstellverbotszone oder ausserhalb des Betriebsgebiets: Fahr weiter, denn solange die Fahrt läuft, zahlst du.',
        },
        '**Falsch geparkt oder kaputt?** Zuständig ist der Anbieter, nicht die Stadt: Auf behindernde oder gefährliche Scooter reagiert er unverzüglich, auf defekte oder falsch abgestellte binnen sechs Stunden. Die Kontakte stehen auf der E-Scooter-Seite der Stadt.',
      ],
    },
    {
      heading: 'Was die Stadt Erlangen regelt: Kooperationsvertrag und 975 Scooter',
      blocks: [
        'Eine Erlaubnis brauchen die Anbieter in Erlangen nicht: Vermieten und Abstellen gelten laut Stadt als nicht genehmigungspflichtiger Gemeingebrauch. Die Stadt hat deshalb mit ihnen einen freiwilligen **Kooperationsvertrag** geschlossen und begrenzt die Zahl der Scooter in drei Zonen, insgesamt auf 975:',
        {
          table: {
            caption: 'Höchstzahl der Leih-Scooter in Erlangen laut Stadt (Stand 18. August 2026)',
            head: ['Zone', 'Je Anbieter', 'Insgesamt'],
            rows: [
              ['Kerngebiet (Innenstadt, Bruck)', '150', '450'],
              ['Ausweitung 1 (Alterlangen, Büchenbach)', '100', '300'],
              ['Ausweitung 2 (Eltersdorf, Tennenlohe)', '75', '225'],
            ],
          },
        },
        'Laut dem Mustervertrag vom Februar 2020, den die Stadt bis heute verlinkt, bleiben beim Abstellen an Haltestellen 20 Meter frei. Für Flächen, die nicht der Stadt gehören, aber öffentlich zugänglich sind, etwa den Siemens Campus, braucht es die Zustimmung der Eigentümer.',
        '**Die FAU:** Die Friedrich-Alexander-Universität nennt in ihrem Mobilitätskonzept (Kurzfassung, Dezember 2024) den «Ausbau von E-Scooter-Abstellanlagen» als Massnahme. Den Katalog nennt die FAU «Arbeitsgrundlage und Absichtserklärung»; eine Regel für Leih-Scooter auf ihrem Gelände steht nicht darin.',
      ],
    },
    {
      heading: 'E-Scooter im Bus und am Bahnhof: ESTW, VGN, DB',
      blocks: [
        '**Stadtbusse der ESTW:** Eine eigene Regel für E-Scooter nennen die Erlanger Stadtwerke auf ihren Stadtbus-Seiten nicht; in ihren Bussen gilt der Tarif des VGN, Erlangen ist Tarifzone C. Im Innenstadtbereich fahren die Busse noch bis 31. Dezember 2026 kostenlos. Laut dpa gab der VGN am 13. Mai 2024 bekannt, dass E-Scooter ab sofort nicht mehr in Bussen, U-Bahnen und Strassenbahnen mitgenommen werden dürfen, wegen eines erhöhten Brand- und Explosionsrisikos ihrer Akkus. E-Bikes, elektrische Rollstühle und Seniorenmobile betrifft es laut dpa nicht.',
        '**S-Bahn und Regionalzug:** Dort bleibt die Mitnahme laut derselben dpa-Meldung erlaubt. Einen Leih-Scooter stellst du vor der Fahrt ab, am Bahnhof auf einer der Parkzonen: Der übrige Bahnhofsvorplatz ist Abstellverbotszone.',
        '**Fernzüge:** In ICE und IC nimmt die Deutsche Bahn einen E-Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit; aufgeklappt gilt er als Traglast und darf nur mit, wenn er sicher untergebracht ist. Den eingebauten Akku darfst du unterwegs weder ausbauen noch laden noch als Powerbank nutzen.',
      ],
    },
    {
      heading: 'Bergkirchweih: kein E-Scooter auf dem Berg',
      blocks: [
        'Die Bergkirchweih beginnt laut Verordnung der Stadt jedes Jahr am Donnerstag vor Pfingsten und endet am übernächsten Montag; die 272. läuft vom 13. bis 24. Mai 2027. Während der Betriebszeiten sind auf dem Festgelände nach § 9 der Bergkirchweihverordnung (Fassung vom 22. Mai 2025) «der Verkehr und die Mitnahme von Fahrzeugen aller Art, insbesondere auch von Fahrrädern, Rollern und Segways verboten». In ihren Regeln für den Bergbesuch (Stand 21. Mai 2026) verbietet die Stadt ausdrücklich, E-Scooter mitzubringen und zu nutzen.',
        'Für Leih-Scooter kann die Stadt laut Mustervertrag Abstellverbotszonen auch vorübergehend ausweisen, «z.B. während der Erlanger Bergkirchweih». Wo du während des Festes parken darfst, zeigt dir die App.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Erlangen: Bussgelder, Alkohol, Helm',
      blocks: [
        'In Erlangen gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Nebeneinander gefahren', '15 €, bis 30 €', 'erlaubt, wenn niemand behindert wird'],
              ['Zu zweit auf einem Scooter', '10 € (Tatbestandskatalog des KBA)', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Einen Helm empfehlen die Stadt und Dott. Wo Dott eine Versicherung für eigene Verletzungen der Fahrer anbietet, sind Kopfverletzungen laut AGB nicht versichert, wenn du ohne Helm fährst. Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Erlangen',
      blocks: [
        {
          list: [
            '**Die Bergkirchweih ist Kulturerbe.** Seit 2026 ist sie offiziell als immaterielles Kulturerbe anerkannt, und für 2027 wurde erstmals eine Bergkönigin gewählt, die 21-jährige Leonie Ott.',
            '**Nachtschicht für leere Akkus.** Laut dem Mustervertrag von 2020 holen die Anbieter zu schwach geladene Scooter nach 22 Uhr von der Strasse und verteilen sie bis 6 Uhr neu. Mindestens 80 Prozent ihrer Scooter sollen fahrbereit sein, mit mindestens 20 Prozent Akku.',
            '**Leihräder boomen.** Im ersten Halbjahr 2026 zählte die Stadt rund 77.000 Ausleihen von VAG_Rad in Erlangen, 57 Prozent mehr als ein Jahr zuvor; der Juli 2026 war mit rund 32.000 der beste Monat seit dem Start. Stationen stehen etwa am Hugenottenplatz, am Waldkrankenhaus, am Siemens Campus und seit September in Alterlangen; in der Flexzone der Innenstadt gibst du das Rad auch auf öffentlichen Wegen und Plätzen zurück. Leihräder zeigt die ScootRadar-Karte nicht.',
            '**Vertragspartner ist noch Tier.** In der Tabelle der Stadt heisst Dott noch Tier, und wer einen Dott-Scooter leiht, schliesst den Vertrag laut Dotts AGB tatsächlich mit der TIER Mobility SE in Berlin.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter kann ich in Erlangen leihen?',
      answer: 'Die von Voi, Dott und Bolt, in der App des Anbieters, ab 18 und ohne Führerschein. Freie Scooter zeigt die [Live-Karte von Erlangen](map:de:Erlangen), die von Voi, wenn du hineinzoomst.',
    },
    {
      question: 'Wo darf ich einen Leih-Scooter in Erlangen abstellen?',
      answer: 'Am besten in einer Parkzone, etwa am Bahnhofsvorplatz oder in der Nürnberger Strasse gegenüber dem Rathausplatz, sonst am Rand von Gehweg oder Platz mit zwei Metern Durchgang. In den Abstellverbotszonen, etwa am Schlossplatz, Hugenottenplatz und Rathausplatz, im Schlossgarten und auf Grünflächen, lässt dich die App die Fahrt nicht beenden.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Schlossgarten fahren?',
      answer: 'Nein: Seine Satzung verbietet Fahrräder und motorisierte Fahrzeuge auf seinen Wegen, und abstellen kannst du dort auch nicht.',
    },
    {
      question: 'Darf ich mit dem E-Scooter zur Bergkirchweih?',
      answer: 'Nur bis vor das Festgelände: Während der Betriebszeiten sind dort Fahrzeuge aller Art verboten, E-Scooter ausdrücklich. Wo du einen Leih-Scooter abstellen darfst, zeigt die App.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus oder Zug mitnehmen?',
      answer: 'Nicht in Bus, U-Bahn und Strassenbahn: Laut dpa hat der VGN E-Scooter dort im Mai 2024 verboten, auch den eigenen. In S-Bahn und Regionalzug bleibt er erlaubt, in ICE und IC fährt er zusammengeklappt als Handgepäck mit.',
    },
  ],
  sources: [
    { title: 'Stadt Erlangen: E-Scooter in Erlangen (Stand 18. August 2026)', url: 'https://erlangen.de/aktuelles/e-scooter' },
    { title: 'Stadt Erlangen: Kooperationsvertrag E-Scooter (Februar 2020, PDF)', url: 'https://erlangen.de/uwao-api/faila/files/bypath/Dokumente/Bauen%20&%20Planen/Verkehr/e-scooter/613_t_Kooperationsvertrag_E-Scooter_in_Erlangen_mit_Anlagen_-_25.02.2020.pdf' },
    { title: 'Stadt Erlangen: Übersichtskarte E-Scooter-Betriebsgebiet (Stand November 2024, PDF)', url: 'https://erlangen.de/uwao-api/faila/files/bypath/Dokumente/Bauen%20&%20Planen/Verkehr/uebersichtskarte_e-scooter.pdf' },
    { title: 'Stadt Erlangen: Satzung für die Schlossgartenbenützung (Stand 7. November 2023)', url: 'https://erlangen.de/aktuelles/schlossgartensatzung' },
    { title: 'Stadt Erlangen: Grünanlagensatzung', url: 'https://erlangen.de/aktuelles/gruenanlagensatzung' },
    { title: 'Stadt Erlangen: Bergkirchweihverordnung (Fassung vom 22. Mai 2025)', url: 'https://erlangen.de/aktuelles/bergkirchweihverordnung' },
    { title: 'Stadt Erlangen: Infos zur Bergkirchweih (Stand 21. Mai 2026)', url: 'https://erlangen.de/aktuelles/info-bergkirchweih' },
    { title: 'Stadt Erlangen: Bergkirchweih 2026, eine Bilanz (Stand 5. Juni 2026)', url: 'https://erlangen.de/aktuelles/bergkirchweih-2026' },
    { title: 'Stadt Erlangen: Kostenloser Innenstadtbereich wird Ende 2026 eingestellt (Stand 1. Juli 2026)', url: 'https://erlangen.de/aktuelles/kostenloser-innenstadtbereich-wird-ende-2026-eingestellt' },
    { title: 'Stadt Erlangen: VAG_Rad: Angebot wird weiter ausgebaut (Stand 8. September 2026)', url: 'https://erlangen.de/aktuelles/vag_rad-angebot-wird-weiter-ausgebaut' },
    { title: 'Stadt Erlangen: VAG-Rad leihen (Stand 22. Juni 2026)', url: 'https://erlangen.de/aktuelles/radleihsystem-der-vag-auch-in' },
    { title: 'Erlanger Stadtwerke: Kostenloser Innenstadtbereich', url: 'https://stadtbus.estw.de/de/Tickets-Verbundpaesse/Kostenloser-Innenstadtbereich/' },
    { title: 'Bahnblogstelle (dpa): VGN verbietet E-Scooter in Bussen und Bahnen (13. Mai 2024)', url: 'https://bahnblogstelle.com/216320/vgn-verbietet-e-scooter-in-bussen-und-bahnen/' },
    { title: 'FAU: Fokuskonzept Mobilität, Kurzfassung (Dezember 2024, PDF)', url: 'https://www.green-office.fau.de/files/2024/12/Mobilitaetskonzept_Kurzfassung_deutsch.pdf' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Fahr mit uns', url: 'https://ridedott.com/de/fahr-mit-uns/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: Bolt in Erlangen', url: 'https://bolt.eu/de-de/cities/erlangen/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge (gültig seit 1. August 2023)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicle-old/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung (eKFV)', url: 'https://www.gesetze-im-internet.de/ekfv/BJNR075610019.html' },
    { title: 'Bussgeldkatalog-Verordnung, Anlage', url: 'https://www.gesetze-im-internet.de/bkatv_2013/anlage.html' },
    { title: 'Kraftfahrt-Bundesamt: Bundeseinheitlicher Tatbestandskatalog (Datenbank, Stand 8. Oktober 2026)', url: 'https://www.kba.de/DE/Themen/ZentraleRegister/FAER/BT_KAT_OWI/btkat_node.html' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern im Fernverkehr', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
  ],
};

export default guide;
