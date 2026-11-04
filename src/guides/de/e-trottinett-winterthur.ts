import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-trottinett-winterthur',
  topic: 'winterthur',
  name: 'E-Trottinett Winterthur: Voi, Preise, Zonen',
  title: 'E-Trottinett Winterthur 2026: Voi, Preise, Zonen, Parkieren',
  description: 'E-Trottinett Winterthur: Nur Voi fährt hier. Was zehn Minuten kosten, wo du am HB parkierst, was in der Altstadt gilt und was sich ab 2028 ändern soll.',
  headline: 'E-Trottinett Winterthur: E-Scooter von Voi mieten, Preise, Zonen und Parkieren am HB',
  lede: 'Ein E-Trottinett in Winterthur mietest du bei Voi: Seit 2026 ist Voi laut Stadt der einzige Anbieter, mit 450 E-Scootern und 100 E-Bikes und einem Vertrag bis Ende 2027. Du musst mindestens 18 sein und zahlst CHF 1.– fürs Entsperren plus 42 Rappen pro Minute, zehn Minuten kosten also CHF 5.20 (Stand November 2026). Rund um den Hauptbahnhof parkierst du nur auf den roten Feldern, die für Voi markiert sind, und die Altstadt ist Fussgängerzone: Fahren darfst du dort nur, wo eine Zusatztafel Velos erlaubt. Auf Hügeln wie dem Goldenberg oder dem Eschenberg endet bei Voi die Fahrt nicht.',
  published: '2026-10-13',
  updated: '2026-10-14',
  city: 'ch:winterthur',
  sections: [
    {
      heading: 'E-Trottinett in Winterthur mieten: Voi ist der einzige Anbieter',
      blocks: [
        'Die Stadt vergibt das Recht, hier E-Scooter zu vermieten, per Konzession, und seit Anfang 2026 hat nur noch Voi eine: für 450 E-Trottinette und 100 E-Bikes, verteilt über die ganze Stadt und rund um die Uhr verfügbar.',
        'Am Abend des 13. Oktober 2026 zeigte die [Karte von Winterthur](map:ch:winterthur) in der Stadt rund 390 Voi-Trottis, die zu diesem Zeitpunkt frei waren. So kommst du zu deinem Trotti:',
        {
          steps: [
            'Das nächste Voi-Trotti auf der [Live-Karte von Winterthur](map:ch:winterthur) suchen.',
            'Die Voi-App öffnen, dich registrieren und eine Karte hinterlegen. Voi verlangt mindestens 18 Jahre.',
            'QR-Code scannen, entsperren und auf dem Velostreifen oder der Strasse losfahren.',
            'Die Fahrt dort beenden, wo die App es erlaubt, und das Schlussfoto machen. Die Stadt schreibt es vor; daran sieht Voi, ob du richtig parkiert hast.',
          ],
        },
        'Jeden Schritt im Detail erklärt der Ratgeber [E-Scooter mieten](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Trottinett in Winterthur?',
      blocks: [
        'Voi verlangt in Winterthur CHF 1.– fürs Entsperren und 42 Rappen pro Minute, für E-Trottinette und E-Bikes gleich (Stand November 2026). Die Minuten laufen, bis die Fahrt beendet ist, auch am Rotlicht. Massgebend ist der Tarif, den dir die App vor dem Entsperren zeigt.',
        {
          table: {
            caption: 'Voi in Winterthur, Stand November 2026',
            head: ['Fahrzeug', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten', '30 Minuten'],
            rows: [
              ['Voi, E-Trottinett oder E-Bike', 'CHF 1.–', '42 Rappen', 'CHF 5.20', 'CHF 9.40', 'CHF 13.60'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Altstadt, Schulen, Hügel: Zonen für E-Scooter in Winterthur',
      blocks: [
        'Die Zonen legen Stadt und Voi fest, und sie ändern sich; massgebend sind die Farben in der Voi-App.',
        {
          table: {
            caption: 'Vois Zonen in Winterthur, Stand November 2026',
            head: ['Zone', 'Was bei Voi gilt', 'Wo, zum Beispiel'],
            rows: [
              ['Hauptbahnhof', 'Parkverbot rund um den Bahnhof, Fahrt nur auf den roten Voi-Feldern beenden', 'Bahnhofplatz, Archplatz, Rudolfstrasse beim HB Nord'],
              ['Altstadt', 'Voi drosselt das Trotti, in Marktgasse und Untertor kein Parkieren', 'Marktgasse, Untertor, Steinberggasse, Neumarkt, Kirchplatz, Unterer Graben'],
              ['Schulareale', 'Voi drosselt noch stärker, kein Parkieren', 'Viele Schulhäuser, etwa in Hegi, Oberseen und Wallrüti'],
              ['Weitere Parkverbotszonen', 'Durchfahren ja, Fahrt beenden nur auf einem Voi-Platz', 'Stadtgarten, Schützenwiese, Brühlberg, Kantonsspital, Bahnhöfe Oberwinterthur, Grüze, Hegi, Seen und Wallrüti'],
              ['Ausserhalb von Vois Gebiet', 'Keine Fahrt beenden', 'Goldenberg, Lindberg, Wolfensberg, Eschenberg, Wildpark Bruderhaus, Römerholz, Reutlingen, Hard, Sennhof'],
              ['Normale Zone', 'Parkieren nach den Regeln der Stadt', 'Technorama, Eulachpark, Lagerplatz, Zentrum Töss, Bahnhof Wülflingen'],
            ],
          },
        },
        'Vois Drosselung ist kein erlaubtes Tempo: Die ganze Altstadt ist Fussgängerzone. Fahren darfst du dort nur, wo eine Zusatztafel Velos erlaubt, im Schritttempo und mit Vortritt für die Fussgänger, sonst kostet es CHF 30.–. Erlaubt ist das fast überall, etwa am Neumarkt, in der Steinberggasse und im Obertor. In der Marktgasse und im Untertor dagegen zeigt der Veloplan der Stadt ein Fahrverbot für Velos: Steig dort ab und stoss.',
        'Willst du auf den Goldenberg, zum Wildpark Bruderhaus oder zur Sammlung Oskar Reinhart am Römerholz, beende die Fahrt am Rand von Vois Gebiet und geh das letzte Stück zu Fuss. Über den Brühlberg im Westen fährst du bei Voi durch, parkieren darfst du dort aber nicht.',
        { note: 'Bei Voi endet die Fahrt nicht ausserhalb seines Gebiets, in einer Parkverbotszone nur auf einem Voi-Platz und am Hauptbahnhof nur auf den roten Feldern. Bis dahin laufen die Minuten weiter: Such dir den Abstellplatz in der App, bevor du am Ziel bist.' },
      ],
    },
    {
      heading: 'E-Trottinett parkieren in Winterthur: Hauptbahnhof und rote Felder',
      blocks: [
        'Richtig parkierst du laut Stadt an drei Orten:',
        {
          list: [
            'auf offiziellen Veloabstellplätzen;',
            'in den rot markierten Feldern für E-Scooter und E-Bikes;',
            'auf dem Trottoir nur, wenn mindestens 1,50 m für Fussgänger frei bleiben, sonst kostet es CHF 20.– Busse.',
          ],
        },
        'Im Stadtzentrum gilt ein grosses Parkverbotsgebiet, in den Quartieren gibt es kleinere. Rund um den **Hauptbahnhof** parkierst du nur auf den roten Feldern, die für Voi markiert sind. Voi hat in der Stadt rund 250 eigene Abstellplätze, auch bei den Bahnhöfen Oberwinterthur, Hegi, Seen, Wallrüti und Grüze (Stand November 2026).',
        'Falsch abgestellte Trottis zieht Voi oder die Stadtpolizei ein. Wer wiederholt falsch parkiert, zahlt laut Stadt eine Umtriebsentschädigung und wird gesperrt.',
        'Steht ein Voi im Weg, melde es über das [Formular der Stadt](https://stadt.winterthur.ch/services/falsch-parkierte-e-scooter-und-e-bikes-melden). Die Meldung geht direkt an Voi, das Fahrzeug wird an Werktagen tagsüber innert weniger Stunden eingezogen. Am schnellsten geht es mit der Nummer: vier Zahlen oder Buchstaben auf dem Lenker unter dem QR-Code.',
      ],
    },
    {
      heading: 'Unterwegs in Winterthur: Bahnhof, Technorama, Zürich und Flughafen',
      blocks: [
        {
          list: [
            '**Hauptbahnhof:** Abstellen darfst du nur auf den roten Feldern; Voi-Plätze gibt es etwa an der Rudolfstrasse beim HB Nord und am Salzhausplatz.',
            '**Technorama und Oberwinterthur:** Beim Technorama gibt es einen Voi-Parkplatz gleichen Namens; am Bahnhof Oberwinterthur parkierst du nur auf den markierten Voi-Plätzen.',
            '**Eulachpark:** bei Voi normale Zone, mit dem Voi-Parkplatz «Eulachpark KM» nahe dem Bahnhof Hegi.',
            '**Zürich:** Direkte Züge brauchen 19 bis 28 Minuten bis Zürich HB (SBB-Fahrplan, Oktober 2026). In Zürich mietest du ein neues Trotti; welche Anbieter und Zonen dort gelten, steht unter [E-Trottinett in Zürich](guide:zurich).',
            '**Flughafen Zürich:** Direkte Züge brauchen 13 bis 17 Minuten. Das Voi-Trotti taugt dafür nicht: Ausserhalb von Vois Gebiet endet die Fahrt nicht. Am Flughafen sperren Voi, Bird und Hopp den Bahnhof, Check-in 1 und 2 und The Circle fürs Fahren und Parkieren. Bei Lime gilt das auch, ausser im Nordteil von The Circle: Dort parkierst du nur auf Limes Plätzen.',
          ],
        },
      ],
    },
    {
      heading: 'Musikfestwochen: E-Scooter an Anlässen',
      blocks: [
        'An den **Musikfestwochen**, vom 11. bis 22. August 2027 rund um Steinberggasse, Kirchplatz und Viehmarkt, stehen «Fahrräder / E-Scooter» auf der Liste der Gegenstände, die auf dem Festivalgelände verboten sind.',
        'Die Musikfestwochen bitten dich, mit dem öffentlichen Verkehr, zu Fuss oder mit dem Velo anzureisen; vom Bahnhof sind es fünf Minuten. Beende die Fahrt also ausserhalb der Altstadt.',
      ],
    },
    {
      heading: 'Regeln und Bussen: was in Winterthur kontrolliert wird',
      blocks: [
        'Die Stadtpolizei kontrolliert gezielt und hat weitere Kontrollen angekündigt. Allein am 30. September 2026 verzeigte sie eine unter 16-Jährige ohne Führerausweis und zwei Jugendliche, die während der Fahrt das Handy benutzten, und in Wülflingen büsste sie drei Lenkende, die jemanden mitfahren liessen. Das gilt für dich:',
        {
          list: [
            '**Ab 18** bei Voi. Das Gesetz: ab 16 ohne Führerausweis, mit 14 und 15 nur mit dem Ausweis der Kategorie M.',
            '**Velostreifen oder Veloweg**, sonst die Strasse. **Nie aufs Trottoir**: CHF 40.–. Die Kampagne von Stadtbus und Stadtpolizei sagt es so: «Hey E-Scooter, fahre nie auf dem Trottoir».',
            '**Fussgängerzone**, auch in der Altstadt: nur mit Zusatztafel für Velos und im Schritttempo, sonst CHF 30.–.',
            '**Nur eine Person** pro Trotti, auch kein Kind.',
            '**Licht an**, auch am Tag: Ohne kostet es tagsüber CHF 20.–.',
            '**Rotlicht**: CHF 60.–. **Handy in der Hand**: CHF 40.–.',
            '**Helm** empfohlen, keine Pflicht. **0,5 Promille** sind die Grenze; ab da droht ein Strafverfahren statt einer Ordnungsbusse.',
          ],
        },
        'Wer jünger als 15 ist, bekommt keine Ordnungsbusse, sondern wird verzeigt. Alle Bussen und Altersgrenzen findest du in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Voi-E-Bike, Carvelo und Rent-a-Bike: Alternativen zum Trotti',
      blocks: [
        'Die Alternativen:',
        {
          list: [
            '**Voi-E-Bikes:** 100 im ganzen Stadtgebiet, in derselben App und zum selben Tarif wie die Trottis.',
            '**Carvelo:** elektrische Lastenvelos für bis zu 100 kg Waren oder zwei Kinder, an sieben Standorten. Ohne Abo kosten sie CHF 5.– Grundgebühr plus CHF 4.50 pro Stunde, höchstens CHF 60.– für 24 Stunden; mit Abo die Hälfte (Stand November 2026).',
            '**Rent-a-Bike** vermietet Velos am Bahnhof Winterthur.',
          ],
        },
      ],
    },
    {
      heading: 'Warum nur Voi? Winterthurs Konzession und der Plan für 2028',
      blocks: [
        '2019 verlangte Winterthur von den Anbietern keine Gebühren, setzte aber Grenzen: höchstens 400 Trottis insgesamt und nicht mehr als zwei eines Anbieters am selben Ort. 2022 hatten sieben Firmen eine Bewilligung für je 150 Trottis, und ab 2023 zahlten die Anbieter für den öffentlichen Grund CHF 5.– pro Trotti und Monat.',
        'Weil die vielen Anbieter der Stadt viel Aufwand und wenig Ordnung brachten, schrieb der Stadtrat 2023 zwei exklusive Konzessionen aus, mit höchstens 40 Trottis pro Anbieter in der Innenstadt und einer Gebühr von mindestens CHF 18 000.– im Jahr. Ab 2024 fuhren Tier und Voi. Der Vertrag mit Tier endete Ende 2025, der mit Voi läuft bis zum 31. Dezember 2027.',
        'Geplant sind bis Ende 2026 eine Strategie, 2027 eine neue Ausschreibung und ab 2028 ein neues System, laut Stadt wohl mit mehr Abstellstationen und weniger freiem Parkieren. Der Hintergrund: In einer Umfrage von gfs.bern fanden 2025 nur 31 Prozent der Befragten in Winterthur ein E-Trottinett-Verleihangebot sinnvoll, einen Veloverleih 64 Prozent, und 56 Prozent zogen Stationen vor. Wer die Trottis nutzt, will allerdings mehrheitlich frei parkieren.',
      ],
    },
  ],
  faq: [
    {
      question: 'Gibt es in Winterthur auch Lime, Bolt oder PubliBike?',
      answer: 'Nein. Seit 2026 ist Voi laut Stadt der einzige Anbieter von E-Scootern und E-Bikes in Winterthur.',
    },
    {
      question: 'Kann ich mit dem Voi-Trotti nach Zürich oder an den Flughafen fahren?',
      answer: 'Praktisch nicht. Bei Voi endet die Fahrt nicht ausserhalb seines Gebiets in Winterthur, die Minuten laufen weiter, und am Flughafen sperrt Voi Bahnhof, Check-in und The Circle. Der Zug ist schneller: direkt 13 bis 17 Minuten zum Flughafen und 19 bis 28 Minuten nach Zürich HB.',
    },
    {
      question: 'Wo melde ich ein falsch parkiertes E-Trottinett in Winterthur?',
      answer: 'Über das Formular der Stadt, das direkt an Voi geht. Gib die Nummer auf dem Lenker an oder die Adresse; ein Foto hilft, das Trotti zu finden und die fahrende Person zu sanktionieren. Eingezogen wird an Werktagen tagsüber innert weniger Stunden.',
    },
    {
      question: 'Ab welchem Alter kann ich in Winterthur ein E-Trottinett mieten?',
      answer: 'Ab 18, das verlangt Voi. Ein eigenes E-Trottinett darfst du ab 16 ohne Führerausweis fahren, mit 14 und 15 nur mit dem Ausweis der Kategorie M.',
    },
    {
      question: 'Darf ich ein E-Trottinett in Bus oder Zug mitnehmen?',
      answer: 'Ein Voi-Trotti nicht: Bei Voi endet die Fahrt nur in seinem Gebiet. Dein eigenes fährt im Zug gratis mit, wenn das grösste Rad kleiner als 12 Zoll ist, sonst brauchst du ein Velobillett. Im Stadtbus gilt laut ZVV-Tarif dieselbe Regel; Velos nimmt der Bus nur mit, wenn Platz ist.',
    },
  ],
  sources: [
    { title: 'Stadt Winterthur: Sharing-Angebote, aktualisiert am 28. August 2026', url: 'https://stadt.winterthur.ch/themen/mobilitaet/oev-taxi-sharing/sharing-angebote' },
    { title: 'Stadt Winterthur: Falsch parkierte E-Scooter und E-Bikes melden', url: 'https://stadt.winterthur.ch/services/falsch-parkierte-e-scooter-und-e-bikes-melden' },
    { title: 'Stadtrat Winterthur: Beschluss 2025/258, Reduktion der Anbieter und Ausblick', url: 'https://stadt.winterthur.ch/stadtratsbeschluesse/2025-06-25/2025258' },
    { title: 'Stadtrat Winterthur: Beschluss SR.23.616-1, Ausschreibung von zwei Konzessionen', url: 'https://stadt.winterthur.ch/stadtratsbeschluesse/2023-08-23/sr23616-1' },
    { title: 'Stadt Winterthur: Veloplan im Stadtplan', url: 'https://stadtplan.winterthur.ch/?topic=Veloplan' },
    { title: 'MobiData BW: offene Daten von Voi Schweiz (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_ch/gbfs' },
    { title: 'Stadtbus Winterthur: Sicherheit, Kampagne «Hey E-Scooter» mit der Stadtpolizei', url: 'https://stadtbus.winterthur.ch/fahrerlebnis/sicherheit' },
    { title: 'Stadtpolizei Winterthur: Kurzmeldungen vom 30. September 2026', url: 'https://stadt.winterthur.ch/polizeimeldung/kurzmeldungen-vom-mittwoch-30-september-2026' },
    { title: 'Musikfestwochen Winterthur: Festivalinfos', url: 'https://musikfestwochen.ch/infos/festivalalinfos/' },
    { title: 'Bird: offener Datenfeed für Kloten mit Zonen (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/kloten/gbfs.json' },
    { title: 'Hopp: offener Datenfeed für Kloten mit Zonen (GBFS)', url: 'https://api.hopp.bike/gbfs/ch-kloten/gbfs.json' },
    { title: 'Lime: Zonen für Kloten', url: 'https://assets.lime.bike/zones_attributes/Kloten_5536_exclude_new_type.json' },
    { title: 'Carvelo: Tarife', url: 'https://www.carvelo.ch/de/preise/' },
  ],
};

export default guide;
