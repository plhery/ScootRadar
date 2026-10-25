import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-ulm',
  topic: 'ulm',
  name: 'E-Scooter Ulm: Anbieter, Preise, Parken',
  title: 'E-Scooter Ulm 2026: Dott, Preise, Parken, Neu-Ulm',
  description: 'E-Scooter Ulm: Dott fährt in Ulm und Neu-Ulm, laut den Städten für 0,20 € pro Minute. Wo du fahren und parken darfst und was in Bus und Zug gilt.',
  headline: 'E-Scooter Ulm: Anbieter, Preise, Parken und Regeln in Ulm und Neu-Ulm',
  lede: 'E-Scooter in Ulm und Neu-Ulm leihst du bei Dott, ohne Führerschein und laut Dotts Bedingungen erst ab 18: Seit Juli 2026 hat Dott die Konzession beider Städte, einen anderen Anbieter haben wir nicht gefunden. Laut den Städten (1. Juli 2026) kostet die Minute 0,20 € ohne Freischaltgebühr, und unter anderem ÖPNV-Abonnenten zahlen die Hälfte; den aktuellen Preis zeigt die App. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch die Fussgängerzone. In beiden Innenstädten führen die Städte schrittweise Parkverbotszonen ein: Dort beendest du die Fahrt dann nur noch auf ausgewiesenen Parkinseln, die die App zeigt.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Ulm',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Ulm und Neu-Ulm?',
      blocks: [
        'In Ulm und Neu-Ulm verleiht **Dott** E-Scooter und E-Bikes. Laut ihrer gemeinsamen Mitteilung vom 1. Juli 2026 haben beide Städte erstmals eine Konzession für E-Scooter- und E-Bike-Sharing vergeben: «Den Zuschlag erhielt erneut Dott.» Sie ersetzt die frühere Kooperationsvereinbarung. Laut der Konzession darf Dott in Ulm bis zu 600 E-Scooter und 200 Pedelecs einsetzen, in Neu-Ulm bis zu 300 E-Scooter und 100 Pedelecs. Eine Laufzeit nennen die Städte nicht. Neu-Ulms Sondernutzungsgebührensatzung (in Kraft seit 6. Juni 2026) setzt 30 € pro Leih-E-Scooter und Jahr an; die Gebühr und die eigenen Regeln der Stadt Ulm konnten wir nicht prüfen.',
        'Dott führt Ulm und Neu-Ulm auf seiner Standortseite, Bolt nennt die Städte in seiner Liste nicht, und in den offenen Sharing-Daten des Landes (MobiData BW) stand um Ulm weder ein Voi- noch ein Lime-Scooter (alles Stand 25. Oktober 2026). Leih-Scooter gibt es hier laut Stadt Neu-Ulm seit Juli 2020; die früheren TIER-Fahrzeuge mietest du laut Schwäbischer Zeitung seit Oktober 2024 nur noch in der Dott-App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Ulm](map:de:Ulm) zeigt, wo freie Dott-Scooter stehen: am Sonntag, 25. Oktober 2026, um 8:47 Uhr rund 600. Das ist eine Momentaufnahme, keine Flottengrösse. Sie schliesst das bayerische Neu-Ulm ein, für das die Karte keine eigene Summe zeigt: Von rund 590 Scootern gegen 13:30 Uhr standen nach amtlichen Gemeindegrenzen rund 370 in Ulm, gut 200 in Neu-Ulm, knapp 15 im ebenfalls bayerischen Elchingen und einer in Blaustein.',
        'Die Karte zeigt nur die Positionen der Dott-Scooter: keine Preise, Verbotszonen, Parkinseln oder Reichweiten und keine E-Bikes oder Pedelecs. Das alles zeigt die Dott-App.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Ulm?',
      blocks: [
        'Die Preise haben die Städte mit der Konzession vereinbart (Mitteilung vom 1. Juli 2026): Die Freischaltgebühr «entfällt vollständig», die Minute kostet 0,20 € statt bisher 0,38 €, und «unter anderem ÖPNV-Abonnentinnen und -Abonnenten» bekommen 50 % Rabatt. Wer sonst noch Rabatt bekommt und wie du ihn nachweist, schreiben die Städte nicht. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        {
          table: {
            caption: 'Fahrpreise laut den Städten, ohne Freischaltgebühr (1. Juli 2026)',
            head: ['Fahrt', 'Normalpreis', 'Mit 50 % Rabatt'],
            rows: [
              ['10 Minuten', '2,00 €', '1,00 €'],
              ['20 Minuten', '4,00 €', '2,00 €'],
              ['30 Minuten', '6,00 €', '3,00 €'],
            ],
          },
        },
        'Was sonst noch kosten kann, steht in Dotts Bedingungen:',
        {
          table: {
            caption: 'Dott in Deutschland: Gebühren laut Bedingungen (23. September 2025)',
            head: ['Fall', 'Was Dott verlangt'],
            rows: [
              ['Scooter falsch geparkt oder nicht richtig gesperrt', 'bis zu 300 € Rückholkosten'],
              ['Bussgeld, das Dott für dich zahlt', 'das Bussgeld plus 50 € Verwaltungsgebühr'],
              ['Verstoss gegen die Bedingungen', 'Dott kann 50 € verlangen'],
              ['Scooter aus dem Betriebsgebiet gefahren', 'Dott kann ihn deaktivieren und eine Gebühr verlangen, wenn du ihn nicht zurückbringst'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Wo darf man in Ulm mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, Radfahr- und Schutzstreifen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei», dann im Schritttempo. Gegen die Fahrtrichtung einer Einbahnstrasse darfst du mit «Elektrokleinstfahrzeuge frei». Bei «Radverkehr frei» ist es bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung lässt dich mitfahren, die E-Scooter-Verordnung verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es erlaubt, wo «Radverkehr frei» die Einbahnstrasse öffnet. Diese Regeln setzt der Bund.',
        {
          table: {
            caption: 'Wo in Ulm und Neu-Ulm was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzone', 'Absteigen und schieben, ausser ein Schild erlaubt das Fahren', 'Bund; Stadt mit ihren Schildern'],
              ['Innenstädte von Ulm und Neu-Ulm', 'Parkverbotszonen, schrittweise eingeführt: Fahrt dort nur auf ausgewiesenen Parkinseln beenden', 'Städte Ulm und Neu-Ulm, Konzession'],
              ['Münsterplatz', 'Ausschlusszone: Die App lässt dich die Fahrt hier nicht beenden (undatierte Seite der Stadt Neu-Ulm)', 'Städte Ulm und Neu-Ulm'],
              ['Grünanlagen in Neu-Ulm, etwa das Glacis und Flächen am Donauufer', 'Verboten, «Kraftfahrzeuge zu fahren, zu parken, abzustellen», ausser auf Wegen und Flächen, die ein Schild freigibt; bei Vorsatz Geldbusse', 'Stadt Neu-Ulm, Grünanlagensatzung, zuletzt geändert am 9. Juli 2026'],
              ['Hirschstrasse, Fischerviertel, Friedrichsau, Ulmer Donauufer', 'Eine eigene Regel der Stadt Ulm konnten wir nicht prüfen: Achte auf die Schilder und die App', 'Stadt Ulm'],
              ['Schwörmontag, Nabada, Weihnachtsmarkt', 'Eine eigene Scooter-Regel haben wir nicht gefunden', '–'],
              ['Nachts', 'Keine Sperrzeit gefunden, weder bei den Städten noch bei Dott', '–'],
            ],
          },
        },
        'Neu-Ulms Grünanlagensatzung (§ 4 Abs. 3 Nr. 12) nennt E-Scooter nicht eigens; nach § 1 der E-Scooter-Verordnung sind sie aber Kraftfahrzeuge. Für uns heisst das: Durch Neu-Ulmer Grünanlagen wie das Glacis schiebst du, auch auf den Wegen, ausser ein Schild gibt den Weg frei, und abstellen darfst du dort nicht. Welche Flächen dazugehören, zeigt der Übersichtslageplan vom 27. April 2026. Ulms eigene Parkregeln konnten wir nicht prüfen.',
      ],
    },
    {
      heading: 'E-Scooter in Ulm parken: Parkinseln, Verbotszonen und Foto',
      blocks: [
        'In den Innenstädten von Ulm und Neu-Ulm führen die Städte laut ihrer Mitteilung vom 1. Juli 2026 schrittweise Parkverbotszonen ein. «Das Abstellen der Fahrzeuge wird dort künftig ausschliesslich auf ausgewiesenen Parkinseln möglich sein», schreiben sie; ausserhalb der Innenstädte bleibt das freie Abstellen. Welche Strassen dazugehören und wo die Parkinseln liegen, haben wir nicht gefunden: Wo du die Fahrt beenden kannst, zeigt die Dott-App.',
        'Die Seite der Stadt Neu-Ulm zu E-Tretrollern ist undatiert und älter als die Konzession: Sie erlaubt das Abstellen «fast überall», auch in Fussgängerzonen; für die Innenstädte gilt die neuere Mitteilung. Laut der Seite haben beide Städte Ausschlusszonen festgelegt, um das Abstellen «an ungewünschten Plätzen wie beispielsweise dem Münsterplatz» zu verhindern. Gehwege und Hofeinfahrten lassen sich wegen der ungenauen GPS-Ortung nicht sperren; dort achtest du selbst darauf, niemanden zu behindern.',
        'Am Ende jeder Fahrt lädst du ein Foto des abgestellten Scooters hoch, das laut den Städten automatisch in Echtzeit geprüft wird. Verstösse werden «dokumentiert und sanktioniert – von Verwarnungen und Strafgebühren bis hin zur Sperrung des Benutzerkontos».',
        'Ausserhalb der Innenstädte gelten die Regeln für Fahrräder: Auf dem Gehweg darfst du abstellen, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der Strassenverkehrs-Ordnung; stellt ein Anbieter seine Leih-Scooter auf, gilt das dann nicht als Parken, stellst du einen nach der Fahrt ab, schon. Nicht abstellen darfst du:',
        {
          list: [
            'in den Parkverbots- und Ausschlusszonen der App, ausser auf den Parkinseln;',
            'in Neu-Ulmer Grünanlagen wie dem Glacis (Grünanlagensatzung);',
            'vor Hauseingängen und Hofeinfahrten und so, dass Fussgänger oder der Verkehr behindert werden; das verbieten auch Dotts Bedingungen.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, fahr zu einer Fläche, die sie erlaubt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Regeln und Bussgelder für E-Scooter in Ulm',
      blocks: [
        'Es gelten die deutschen Regeln: ab 14 ohne Führerschein, keine Helmpflicht, die Stadt Neu-Ulm rät aber zum Helm; bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden; ab 1. März 2027 25 €, bis 40 €.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €. **Ohne Versicherungsplakette:** 40 €.',
            '**Rote Ampel:** 60 € und ein Punkt, länger als 1 Sekunde rot 100 € und ein Punkt. **Handy in der Hand:** 100 € und ein Punkt; ab März 2027 neu geregelt, der Betrag ist noch nicht offiziell erläutert.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot; ab 1,1 Promille eine Straftat; unter 21 oder in der Probezeit 0,0 Promille.',
            '**Falsch geparkt auf Geh- oder Radweg:** behindernd 20 €, gefährdend 30 €; ab 1. März 2027 55 €, mit Behinderung 70 €.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Zug: DING, Arverio und DB',
      blocks: [
        'In Strassenbahn und Bus gelten die Regeln des Donau-Iller-Nahverkehrsverbunds (DING), gelesen am 25. Oktober 2026: Leichte, kleine E-Tretroller unter 15 kg und unter 115 cm «gelten zusammengeklappt als Handgepäck» und fahren kostenlos mit, wenn Platz ist; ob es klappt, entscheidet das Fahrpersonal. Grössere, schwerere oder nicht zusammengeklappte Roller behandelt der DING wie Fahrräder. Für die kostenpflichtige Fahrradmitnahme nennt er die Fahrrad-Tageskarte für 7,10 € im Gesamtnetz oder für eine einzelne Fahrt einen Einzelfahrschein Kind. Kinderwagen und Rollatoren haben immer Vorrang.',
        'Fährst du mit dem Regionalzug über den DING hinaus, gilt bei **Arverio** (früher Go-Ahead) und **DB Regio** der Deutschlandtarif (Stand 14. Juni 2026): Einen eigenen E-Scooter darfst du zusammengeklappt als Handgepäck kostenlos mitnehmen, einen pro Person. Fahren darfst du im Zug nicht; der Akku bleibt drin und wird nur geladen, wo ein Schild im Zug es erlaubt.',
        'Im **Fernverkehr der Deutschen Bahn** fährt dein eigener E-Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden. Lässt er sich nicht klappen, gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst, etwa im Gepäckregal.',
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor der Haltestelle oder dem Bahnhof und miete am Ziel neu. Fährst du weiter nach Stuttgart: [E-Scooter in Stuttgart](guide:stuttgart).',
      ],
    },
    {
      heading: 'Hauptbahnhof, Münsterplatz und Universität: Tipps',
      blocks: [
        'Wo am Sonntag, 25. Oktober 2026, gegen 13:30 Uhr Dott-Scooter standen (eine Momentaufnahme):',
        {
          list: [
            '**Hauptbahnhof:** rund 10 im Umkreis von 200 m um den Bahnhofplatz, rund 35 im Umkreis von 500 m.',
            '**Münsterplatz und Hirschstrasse:** In der Mitte des Platzes stand keiner, an seinem Rand Gruppen von bis zu acht Scootern, rund 20 im Umkreis von 200 m; an der Hirschstrasse keiner näher als rund 30 m an einem Haus.',
            '**Universität:** Um die Albert-Einstein-Allee 11 standen im Umkreis von 500 m nur 2, im Umkreis von 1 km 4.',
            '**Friedrichsau:** im Umkreis von 200 m keiner, im Umkreis von 500 m 9.',
          ],
        },
        'Freie Dott-Scooter in deiner Nähe zeigt die [Live-Karte von Ulm](map:de:Ulm).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Ulm?',
      answer: 'Dott: Ulm und Neu-Ulm haben Dott im Juli 2026 die Konzession gegeben; einen anderen Anbieter haben wir nicht gefunden. Du mietest in der Dott-App, ab 18 und ohne Führerschein. Unsere Live-Karte zeigt die freien Dott-Scooter.',
    },
    {
      question: 'Was kostet ein E-Scooter in Ulm?',
      answer: 'Laut den Städten (Mitteilung vom 1. Juli 2026) 0,20 € pro Minute ohne Freischaltgebühr, also 2 € für 10 Minuten; unter anderem ÖPNV-Abonnenten zahlen die Hälfte. Verbindlich ist der Preis in der App.',
    },
    {
      question: 'Fahren die E-Scooter auch in Neu-Ulm?',
      answer: 'Ja. Die Konzession gilt für beide Städte, und am 25. Oktober 2026 stand gut ein Drittel der Dott-Scooter auf unserer Karte in Neu-Ulm. Durch Neu-Ulmer Grünanlagen wie das Glacis schiebst du nach unserer Lesart der Grünanlagensatzung, ausser ein Schild gibt den Weg frei.',
    },
    {
      question: 'Wo darf ich in der Ulmer Innenstadt parken?',
      answer: 'Laut den Städten künftig nur auf ausgewiesenen Parkinseln; die Parkverbotszonen führen sie laut ihrer Mitteilung vom 1. Juli 2026 schrittweise ein. Wo du die Fahrt beenden kannst, zeigt die Dott-App. Den Münsterplatz nennt die Stadt Neu-Ulm als Beispiel einer Ausschlusszone.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Fussgängerzone fahren?',
      answer: 'Nein, absteigen und schieben, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei», dann im Schritttempo. Fahren kostet heute 15 €, ab 1. März 2027 25 €.',
    },
    {
      question: 'Darf ich meinen E-Scooter in Bus und Strassenbahn mitnehmen?',
      answer: 'Einen eigenen ja, wenn er unter 15 kg wiegt, kürzer als 115 cm und zusammengeklappt ist: Dann gilt er im DING als Handgepäck und fährt kostenlos mit, wenn Platz ist. Grössere behandelt der DING wie Fahrräder. Leih-Scooter lassen sich nicht zusammenklappen.',
    },
  ],
  sources: [
    { title: 'Stadt Neu-Ulm: Ulm und Neu-Ulm regeln E-Scooter-Sharing neu, Dott erhält Zuschlag (1. Juli 2026)', url: 'https://nu.neu-ulm.de/aktuelles/aktuell-detail/article/ulm-und-neu-ulm-regeln-e-scooter-sharing-neu' },
    { title: 'Stadt Neu-Ulm: E-Tretroller', url: 'https://nu.neu-ulm.de/buerger-service/leben-in-neu-ulm/verkehr/e-tretroller' },
    { title: 'Stadt Neu-Ulm: Stadtrecht (Grünanlagensatzung, Sondernutzungsgebührensatzung)', url: 'https://nu.neu-ulm.de/stadt-politik/rathaus/stadtrecht' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung, § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'DING: E-Tretroller', url: 'https://ding.eu/service/e-tretroller' },
    { title: 'DING: Fahrradmitnahme', url: 'https://ding.eu/service/fahrradmitnahme' },
    { title: 'Deutschlandtarif: Tarifbedingungen, Teil A, Stand 14. Juni 2026 (PDF)', url: 'https://www.deutschlandtarifverbund.de/wp-content/uploads/2026/06/20260528_A-1-TB-DT-Grundsaetze_Juni2026.pdf' },
    { title: 'Arverio, früher Go-Ahead', url: 'https://www.arverio.de/' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Bolt: Städte', url: 'https://bolt.eu/de-de/cities/' },
    { title: 'MobiData BW: Sharing-Daten (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/manifest.json' },
    { title: 'Schwäbische Zeitung: Tier-E-Scooter in Ulm und Neu-Ulm künftig nur noch über die Dott-App (28. Oktober 2024)', url: 'https://www.schwaebische.de/regional/ulm-alb-donau/ulm/xs-ul-tier-e-scooter-und-e-bikes-in-ulm-und-neu-ulm-ab-morgen-ueber-dott-verfuegbar-3025025' },
    { title: 'LGL Baden-Württemberg: Open GeoData', url: 'https://opengeodata.lgl-bw.de/' },
    { title: 'Bayern: Open Data, Verwaltungsgebiete', url: 'https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=verwaltung' },
  ],
};

export default guide;
