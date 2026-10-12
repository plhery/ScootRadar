import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-mieten',
  topic: 'how-to-rent',
  name: 'E-Scooter mieten: Schritt für Schritt',
  title: 'E-Scooter mieten (E-Trottinett): Anleitung, Kosten, Parken',
  description: 'E-Scooter mieten in der Schweiz und in Deutschland: App, Alter und Zahlung, was eine Fahrt kostet, Pässe, richtig abstellen, Unfall und Miete im Ausland.',
  headline: 'E-Scooter mieten: So funktioniert’s, von der App bis zum Ende der Fahrt',
  lede: 'E-Scooter mieten funktioniert in der Schweiz und in Deutschland fast überall gleich: App des Anbieters laden, mit Handynummer und Zahlungsmittel registrieren, QR-Code am Lenker scannen und losfahren, am Ziel in einer erlaubten Zone abstellen und die Fahrt mit einem Foto beenden. Die grossen Anbieter vermieten in beiden Ländern erst ab 18; einen Führerausweis oder Führerschein brauchst du nicht. Du zahlst eine Entsperrgebühr und einen Minutenpreis: Voi veröffentlichte am 12. Oktober 2026 für Bern CHF 1.– plus 42 Rappen pro Minute und für Stuttgart 0,49 € plus 0,24 € pro Minute; zehn Minuten kosten also CHF 5.20 oder 2,89 €.',
  published: '2026-10-12',
  updated: '2026-10-12',
  sections: [
    {
      heading: 'E-Scooter oder E-Trottinett mieten: Schritt für Schritt',
      blocks: [
        'Jeder Anbieter hat seine eigene App, und du brauchst ein Konto bei dem, dessen E-Scooter oder E-Trottinett du fahren willst. Die Schritte sind fast überall gleich:',
        {
          steps: [
            '**App laden und registrieren**, mit Handynummer und SMS-Code oder mit E-Mail; bei Lime und Voi auch mit einem Apple- oder Google-Konto.',
            '**Zahlungsart hinterlegen**, meist eine Karte, und einen Ausweis scannen, wenn die App danach fragt: In manchen Städten musst du dein Alter so bestätigen.',
            '**Preis prüfen:** Tippe in der App auf den Scooter, um Entsperrgebühr und Minutenpreis zu sehen.',
            '**QR-Code am Lenker scannen** oder die Nummer darunter eintippen.',
            '**Bremsen, Reifen, Licht und Akku prüfen.** Ist der Scooter defekt, melde ihn sofort in der App; bei Voi und Dott zahlst du dann nichts.',
            '**Allein losfahren.** Wer neu ist, fährt gedrosselt: Bolt begrenzt deine ersten fünf Fahrten auf 15 km/h, bei Voi kann dein Konto mit rund 15 km/h beginnen.',
            '**In einer erlaubten Zone abstellen, die Fahrt beenden und das Foto machen.** Bezahlt wird, bis die App das Ende bestätigt.',
            '**Beleg prüfen:** Der blockierte Betrag auf deiner Karte wird freigegeben, der Endpreis erscheint.',
          ],
        },
        'Bei Bolt kann zu Stosszeiten vor dem Entsperren ein kurzer Reaktionstest kommen; wer fünfmal scheitert, kann drei Stunden lang nicht mieten.',
      ],
    },
    {
      heading: 'Was brauchst du zum Mieten? Alter, Ausweis, Zahlung',
      blocks: [
        'Ein Smartphone mit mobilen Daten und ein Zahlungsmittel. Die grossen Anbieter vermieten in der Schweiz und in Deutschland erst **ab 18**, obwohl das Gesetz ein eigenes E-Trottinett in der Schweiz ab 16 und einen eigenen E-Scooter in Deutschland ab 14 erlaubt. Einen Führerausweis oder Führerschein brauchst du in keinem der beiden Länder.',
        {
          table: {
            caption: 'Was die Anbieter in der Schweiz und in Deutschland verlangen, Stand Oktober 2026',
            head: ['Anbieter', 'Alter und Ausweis', 'Zahlungsarten'],
            rows: [
              ['Lime', '18; in manchen Städten Ausweis-Scan', 'Kredit-, Debit- und Prepaid-Karte; an ausgewählten Orten Apple Pay, Google Pay, PayPal, Klarna'],
              ['Voi', '18; Führerschein-Scan nur, wo vorgeschrieben', 'Karte, Apple Pay, Google Pay, PayPal, Klarna'],
              ['Bolt', '18; kann ein Foto von Führerschein oder Ausweis verlangen', 'Visa, Mastercard, American Express nur in Euro-Ländern; in Deutschland auch PayPal und Klarna'],
              ['Dott', '18; Ausweis nur auf Anfrage', 'Karte, PayPal, Apple Pay, Revolut Pay; je nach Ort weitere, darunter TWINT'],
              ['Bird', '18; Ausweis auf Anfrage', 'Karte; in manchen Städten Apple Pay, Google Pay, PayPal'],
              ['Zeus (Deutschland)', '18', 'PayPal, Visa, Mastercard, American Express; mindestens 3 € Guthaben'],
              ['PubliBike (Schweiz)', '18', 'nicht veröffentlicht; Mieten per SwissPass geht nicht'],
            ],
          },
        },
        '**TWINT** nennt unter den grossen Anbietern nur Dott, und zwar als Zahlungsart, die es je nach Ort gibt; bei Lime, Voi und Bolt haben wir es nicht gefunden.',
        'Was beim Fahren gilt, steht in den [E-Trottinett-Regeln für die Schweiz](guide:swiss-rules) und den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter mieten: Was kostet eine Fahrt?',
      blocks: [
        'Du zahlst fürs Entsperren und für jede Minute, in der der Scooter entsperrt ist, ob er fährt oder steht. Lime, Voi und Dott runden auf die nächste volle Minute auf, und die Tarife wechseln von Stadt zu Stadt.',
        {
          table: {
            caption: 'Veröffentlichte Tarife vom 12. Oktober 2026 und was eine Fahrt damit kostet (PubliBike: Preisliste, Oktober 2026)',
            head: ['Anbieter und Ort', 'Tarif', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi, Bern', 'CHF 1.– + 42 Rp./Min.', 'CHF 5.20', 'CHF 9.40'],
              ['Bolt, Basel', 'CHF 1.– + 45 Rp./Min.', 'CHF 5.50', 'CHF 10.–'],
              ['PubliBike, Zürich und Biel', 'CHF 1.– + 20 Rp./Min.', 'CHF 3.–', 'CHF 5.–'],
              ['Voi, Stuttgart', '0,49 € + 0,24 €/Min.', '2,89 €', '5,29 €'],
              ['Bolt und Voi, Reutlingen und Tübingen', '0 € + 0,20 €/Min.', '2,00 €', '4,00 €'],
            ],
          },
        },
        '**Ein Rechenbeispiel:** Du fährst mit Voi in Bern 9 Minuten und 20 Sekunden. Berechnet werden 10 Minuten: CHF 1.– + 10 × 42 Rappen = CHF 5.20. Suchst du danach noch zwei Minuten einen erlaubten Abstellplatz, sind es 12 Minuten und CHF 6.04.',
        'Wo kein Tarif veröffentlicht ist, etwa bei Lime, Bird und Dott, zeigt die App den Preis vor dem Entsperren. Alle Schweizer Tarife nach Stadt: [E-Trottinett-Preise in der Schweiz](guide:swiss-prices).',
      ],
    },
    {
      heading: 'Pässe, Abos und der blockierte Betrag auf der Karte',
      blocks: [
        'Wer oft fährt, zahlt die Entsperrgebühr jedes Mal neu. Dagegen helfen Pässe; was es in deiner Stadt gibt und zu welchem Preis, zeigt die App:',
        {
          list: [
            '**Minutenpakete:** LimePass mit Gratis-Entsperrungen, höchstens 30 Tage gültig; Voi mit 30 bis 300 Minuten, in der Schweiz auch 750, Entsperrungen inbegriffen; Dott in manchen Städten.',
            '**Tagespässe** für 24 Stunden bei Voi und Dott.',
            '**Monatsabos:** LimePrime mit Festpreis für Fahrten bis 20 Minuten, der Voi Pass mit beliebig vielen Entsperrungen, jederzeit kündbar, und Bolt-Pässe für unbegrenzte Entsperrungen, laut deutscher Website «ab 0,99 €» im Monat.',
          ],
        },
        '**Der blockierte Betrag:** Zu Beginn einer Fahrt blockiert die App einen kleinen Betrag auf deiner Karte, bei Dott CHF 3.– in der Schweiz und 2,50 € in Deutschland, bei Voi je nach Land 4 bis 7,50 €; in der Schweiz reserviert Voi schon bei der Anmeldung CHF 5.–. Lime und Bolt nennen keinen Betrag. Nach der Fahrt wird er freigegeben, deine Bank zeigt das aber womöglich erst Tage später.',
      ],
    },
    {
      heading: 'Kann man einen E-Scooter reservieren oder die Fahrt pausieren?',
      blocks: [
        'Reservieren ist teils gratis, Pausieren fast nie: Die Minuten laufen weiter.',
        {
          list: [
            '**Lime:** 10 Minuten gratis reservieren, mit LimePrime oder LimePass 30; bis 15 Minuten pausieren, kostenpflichtig.',
            '**Dott:** 10 Minuten gratis reservieren, laut Dott (Mai 2025) in über 400 Städten; bis 30 Minuten pausieren, zum normalen Minutenpreis.',
            '**Voi:** Eine Pause hält dir den Scooter bis zu zwei Stunden; du zahlst weiter, teils zu einem günstigeren Tarif. Die Schweizer Bedingungen begrenzen eine Miete allerdings auf eine Stunde.',
            '**Bird:** bis 30 Minuten reservieren und bis 75 Minuten sperren, beides pro Minute bezahlt.',
            '**Bolt:** Reservieren geht, Dauer und Preis zeigt die App; pausieren nur auf blauen Abstellplätzen, pro Minute bezahlt.',
          ],
        },
        'Geh nie weg, ohne zu pausieren oder zu beenden: Wird der Scooter gestohlen, kannst du laut Lime für die zusätzliche Zeit haften.',
      ],
    },
    {
      heading: 'Fahrt beenden: E-Scooter richtig abstellen',
      blocks: [
        'Die App zeigt Zonen, meist in ähnlichen Farben: **Rot** für Fahr- oder Parkverbot (in einer Fahrverbotszone bremst der Scooter bis zum Stillstand), **Gelb** für langsam fahren, **Blau**, oft mit P, für Abstellplätze, die du benutzen musst. Ausserhalb des Gebiets bremst er ebenfalls.',
        {
          note: 'In einer Parkverbotszone oder ausserhalb des Gebiets lässt dich die App die Fahrt meist nicht beenden, und die Minuten laufen weiter, bis du einen erlaubten Platz erreichst.',
        },
        'Stell den Scooter aufrecht auf den Ständer, ohne Trottoir oder Gehweg, Eingänge oder Einfahrten zu versperren, beende die Fahrt und mach das Foto. Es wird geprüft: Bei Dott sucht eine Software nach versperrten Gehwegen und umgekippten Scootern, bei Voi sichtet ein «Parking Assistant» die Fotos.',
        'Welche Zone wo gilt, bestimmen Stadt und Anbieter. In Zürich ist etwa der Europaplatz beim Hauptbahnhof Parkverbotszone, in Basel der Centralbahnplatz, und in Berlin darfst du den Scooter im Umkreis von mindestens 100 m um eine Jelbi-Station nur dort abstellen.',
        {
          table: {
            caption: 'Was Anbieter fürs falsche Abstellen verlangen, meist nach Verwarnungen, Stand Oktober 2026',
            head: ['Anbieter', 'Falsch abgestellt', 'Weitere Gebühren'],
            rows: [
              ['Voi', 'Schweiz: CHF 25.–, nach mehreren Verwarnungen', 'Gebühr für wiederholt schlechte Parkfotos'],
              ['Bolt', 'Deutschland: 15 € (Bedingungen ab 1. November 2026)', 'Abholen ausserhalb des Gebiets: bis CHF 100.– oder 100 €'],
              ['Dott', 'bis 300 € laut Hilfe-Seite', 'Weitergeleitetes Bussgeld: plus 50 € Bearbeitung'],
              ['Lime', 'Strafgebühr, Betrag nicht veröffentlicht', 'Schweiz: Abholung und Bearbeitung je bis CHF 125.–'],
            ],
          },
        },
        'Dazu kommen Bussen der Polizei; landen sie beim Anbieter, gibt er sie an dich weiter. In der Schweiz kostet ein Scooter, der auf dem Trottoir weniger als 1,50 m frei lässt, CHF 20.–; in Deutschland kostet Falschparken auf Geh- oder Radweg ab 1. März 2027 55 €.',
      ],
    },
    {
      heading: 'Unfall oder Schaden: was tun?',
      blocks: [
        {
          steps: [
            'Bring dich und andere in Sicherheit und wähle bei Verletzten den Notruf 112.',
            'Tausche mit den Beteiligten Kontaktdaten aus und fotografiere Unfallstelle, Scooter-Nummer und Schäden.',
            'Melde den Unfall in der App. Dott nennt dafür auch Telefonnummern: +41 43 505 16 18 für die Schweiz, +49 30 46690493 für Deutschland.',
            'Informiere bei Verletzten oder Schäden die Polizei; Bolt verlangt das in seinen Bedingungen.',
            'Gib vor Ort keine Schuld zu, rät Dott.',
          ],
        },
        '**Versicherung:** Eine Haftpflicht ist im Mietpreis inbegriffen, mit Grenzen. In der Schweiz zahlt sie bei Lime, Bolt und Voi erst nach deiner eigenen Privathaftpflicht, und PubliBike versichert gar nichts. In Deutschland trägt der Anbieter die Versicherungsplakette, Lime und Bolt legen eine Unfallversicherung dazu. Wer zu zweit fährt, verliert bei Dott den Versicherungsschutz, und Kopfverletzungen ohne Helm deckt Dott nicht.',
        'Schäden am Scooter, die du verursachst, zahlst du selbst, bei Lime in der Schweiz bis CHF 1540.–.',
      ],
    },
    {
      heading: 'E-Scooter im Ausland ausleihen: Pässe, Guthaben, Regeln',
      blocks: [
        'Dein Konto reist mit, deine Pässe und dein Guthaben meist nicht:',
        {
          list: [
            '**Pässe gelten in einem Land:** LimePass, LimePrime und die Pässe von Voi und Dott nur im Land, in dem du sie gekauft hast, ein Bolt-Pass nur in seiner Stadt. Ein Schweizer Voi-Paket hilft dir in Stuttgart nicht.',
            '**Guthaben gilt in einer Währung:** Bird, Dott und Bolt führen es pro Währung getrennt. Mit Franken-Guthaben zahlst du keine Fahrt in Euro.',
          ],
        },
        {
          table: {
            caption: 'Was beim Mieten im Ausland anders ist, Stand Oktober 2026',
            head: ['Land', 'Alter', 'Ausweis oder Führerschein', 'Gut zu wissen'],
            rows: [
              ['Frankreich', '18, bei Pony 16', 'Dott in Lyon: Ausweis', 'Pony: rückzahlbares Depot bis 25 €'],
              ['Italien', '18', 'Dott etwa in Rom und Mailand: Ausweis', 'Helmpflicht, eigenen Helm mitbringen; Parkfoto gesetzlich vorgeschrieben'],
              ['Belgien', '18; bei Voi in Antwerpen, Hoppy und Pony 16', 'Brüssel: einmaliger Ausweis-Scan', 'Bancontact bei Dott'],
              ['Norwegen', '16 bei Bolt und Voi, 15 bei Ryde', 'Bolt kann ein Ausweisfoto verlangen', 'Vipps bei Ryde; in Oslo keine Miete von 23 bis 5 Uhr'],
              ['Grossbritannien', '18', 'Führerschein Pflicht; ausländische nur unter Bedingungen', 'Beryl: Postleitzahl der Karte muss zur Rechnungsadresse passen'],
            ],
          },
        },
        'Helmpflicht, Promillegrenze und Gehweg-Regeln sind in jedem Land anders. Richte Konto und Zahlung vor der Reise ein.',
      ],
    },
    {
      heading: 'Den nächsten E-Scooter finden, egal von welchem Anbieter',
      blocks: [
        'Die App eines Anbieters zeigt nur seine eigenen Scooter. Mehrere Anbieter auf einmal zeigen dir zwei Arten von Apps:',
        {
          list: [
            '**Karten, die dich zur App des Anbieters weiterleiten.** [ScootRadar](/map) zeigt auf einer Karte die Scooter aller Anbieter, die offene Daten veröffentlichen: mit Gehzeit, Akku und Reichweite, wo angegeben, und einer Preisschätzung aus den veröffentlichten Tarifen. Gratis, ohne Konto und ohne Werbung, im Browser oder als iPhone-App. Reservieren oder entsperren kann sie nicht: Ein Button öffnet die App des Anbieters, und die Standorte können einige Minuten alt sein. Auch Google Maps zeigt in manchen Städten Scooter mit Preis und leitet zur App weiter.',
            '**Apps, in denen du direkt buchst.** Lime kannst du in manchen Städten über die Uber-App mieten, in Zürich zum Beispiel. In Berlin buchst du in der BVG-App Jelbi Scooter von Voi, Lime und Bolt, aber noch nicht von Dott; in München in der MVGO-App Scooter von Voi und Dott.',
          ],
        },
        'In einer Buchungs-App gelten deine Pässe beim Anbieter oft nicht; die Osloer Ruter-App schliesst sie ausdrücklich aus. [Öffne die Karte](/map) und sieh nach, wer in deiner Nähe einen Scooter hat.',
      ],
    },
  ],
  faq: [
    {
      question: 'Kann man einen E-Scooter ohne Kreditkarte mieten?',
      answer: 'Meist ja. Die meisten Anbieter nehmen auch Debitkarten, Lime zudem Prepaid-Karten, und Lime, Voi, Dott, Bird und Zeus bieten PayPal an, Lime und Bird nur an ausgewählten Orten. Bolt nimmt PayPal nur in Deutschland.',
    },
    {
      question: 'Ab welchem Alter kann man einen E-Scooter ausleihen?',
      answer: 'In der Schweiz und in Deutschland bei allen grossen Anbietern ab 18. Wer sein Konto Jüngeren überlässt, verstösst gegen die Bedingungen; Zeus verlangt fürs Teilen des Logins 300 €.',
    },
    {
      question: 'Braucht man einen Führerschein, um einen E-Scooter zu mieten?',
      answer: 'In der Schweiz und in Deutschland nicht. Manche Apps verlangen aber einen Ausweis-Scan, um dein Alter zu prüfen. In Grossbritannien brauchst du dagegen einen Führerschein, den du in der App scannst.',
    },
    {
      question: 'Kann ich mehrere E-Scooter mit einem Konto mieten?',
      answer: 'Ja, mit einer Gruppenfahrt: bei Lime und Voi bis zu fünf Scooter, bei Dott meist drei, bei Bird bis zu vier zusätzliche. Du zahlst für alle und trägst die Verantwortung, und alle müssen mindestens 18 sein.',
    },
    {
      question: 'Die Fahrt lässt sich nicht beenden oder das Handy ist leer: Was tun?',
      answer: 'Ohne App endet die Fahrt nicht, die Minuten können weiterlaufen. Voi beendet eine Fahrt selbst, wenn der Scooter 10 Minuten stillsteht, Dott nach 10 bis 30 Minuten ohne Nutzung. Stell den Scooter korrekt ab, ausserhalb jeder Parkverbotszone, und melde dich beim Support, sobald dein Handy wieder läuft.',
    },
  ],
  sources: [
    { title: 'Lime Help Center: Fahrtkosten und Tarife (englisch)', url: 'https://help.li.me/hc/en-us/articles/115004914208' },
    { title: 'Voi Hilfe: Reservierte oder ausstehende Zahlungen (englisch)', url: 'https://www.voi.com/help/accounts-and-payments/why-do-i-see-a-reserved-or-pending-payment-from-voi' },
    { title: 'Voi: Preise und Pässe (englisch)', url: 'https://www.voi.com/pricing-and-passes' },
    { title: 'Voi: Nutzungsbestimmungen Schweiz', url: 'https://www.voi.com/de/rechtliche-hinweise/nutzungsbestimmungen/schweiz' },
    { title: 'Dott Hilfe: Zahlungsarten (englisch)', url: 'https://help.ridedott.com/en/articles/209' },
    { title: 'Dott: Fahrzeug gratis reservieren (englisch)', url: 'https://ridedott.com/reservations/' },
    { title: 'Bolt: E-Scooter mieten', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Jelbi (BVG): Häufige Fragen (englisch)', url: 'https://www.jelbi.de/en/faq/' },
    { title: 'MVG: MVGO, die Mobilitäts-App für München', url: 'https://www.mvg.de/services/mobile-services/mvgo.html' },
  ],
};

export default guide;
