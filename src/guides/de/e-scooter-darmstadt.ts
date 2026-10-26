import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-darmstadt',
  topic: 'darmstadt',
  name: 'E-Scooter Darmstadt: Anbieter, Preise, Parken',
  title: 'E-Scooter Darmstadt 2026: Anbieter, Preise, Parkzonen',
  description: 'E-Scooter Darmstadt: Bolt, Dott, Lime und Voi, was eine Fahrt kostet, wo du fährst und parkst und was in Fussgängerzone, Parks und Strassenbahn gilt.',
  headline: 'E-Scooter Darmstadt: Anbieter, Preise, Parkzonen und Verbote',
  lede: 'E-Scooter in Darmstadt leihst du bei Bolt, Dott, Lime oder Voi, ab 18 und ohne Führerschein. Den Preis zeigt die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht durch die Fussgängerzone am Luisenplatz und nach unserer Lesart auch nicht durch die städtischen Parks. Dort lässt dich die App die Fahrt nicht beenden, am Hauptbahnhof laut Stadt nur auf den Abstellflächen an der Ost- und der Westseite.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Darmstadt',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Darmstadt?',
      blocks: [
        'In Darmstadt verleihen vier Anbieter E-Scooter: **Bolt**, **Dott** (früher TIER), **Lime** und **Voi**. So nennen es die Stadt (gelesen am 26. Oktober 2026) und das städtische Verkehrsunternehmen HEAG mobilo (September 2026); RideMovi, 2024 angekündigt, steht auf keiner der beiden Listen. Du mietest in der App, laut den Bedingungen ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Eine Genehmigung brauchen die Anbieter nicht, schrieb der Magistrat im Mai 2023, und auch die Sondernutzungssatzung der Stadt in ihrer Fassung vom Juli 2026 nennt Leih-Scooter nicht. Die Stadt hat mit den Anbietern Absichtserklärungen geschlossen, «nicht rechtlich bindend», über Verteilung, Parken, freizuhaltende Flächen und Kontrollen. Eine Obergrenze ist nur für Bolt in Wixhausen bekannt: «maximal 40 Roller» (2023). HEAG mobilo nennt 370 Fahrzeuge je Anbieter und bis zu 60 000 Fahrten im Monat (September 2026).',
        'Die [Karte von Darmstadt](map:de:Darmstadt) zeigt alle vier mit Standort und, ausser bei Dott, mit Akkustand, sofern Bolt ihn nicht ausblendet. Am Sonntag, 25. Oktober 2026, kurz vor 23 Uhr zeigte sie rund 260 Scooter von Dott, 270 von Voi und 310 von Bolt. Limes Scooter zählt sie getrennt: Der letzte volle Durchlauf durch Limes Gebiet, beendet am selben Sonntag um 9.24 Uhr, fand rund 530. Das sind Momentaufnahmen, keine Flottengrössen. In der Nacht zum Montag gegen 1 Uhr standen alle Dott- und Voi-Scooter, die die Karte bei Darmstadt zählt, in der Stadt, Dott nur in der Kernstadt; von Bolts rund 310 standen rund 10 in Griesheim.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Darmstadt?',
      blocks: [
        'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Bolt wirbt für Deutschland mit «ab 0,15 € pro Minute», einer kleinen Freischaltgebühr und einem Abo mit unbegrenzten Freischaltungen ab 0,99 € im Monat; der Minutenpreis hängt laut Bolt vom Ort ab (Stand 26. Oktober 2026). Was Falschparken kostet, steht in den deutschen Bedingungen der Anbieter:',
        {
          table: {
            caption: 'E-Scooter-Anbieter in Darmstadt: Preis und Gebühren (Stand 26. Oktober 2026)',
            head: ['Anbieter', 'Preis', 'Falsch geparkt (laut Bedingungen)'],
            rows: [
              ['Bolt', 'ab 0,15 € pro Minute plus Freischaltgebühr (für Deutschland)', '15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist; bis 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs (Bedingungen seit 2023, auch ab 1. Dezember 2026)'],
              ['Dott', 'in der App', 'bis 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst; 50 € Verwaltungsgebühr, wenn Dott ein Bussgeld für dich zahlt (Bedingungen vom September 2025)'],
              ['Lime', 'in der App', 'in den Bedingungen in der Lime-App'],
              ['Voi', 'in der App', 'in den Bedingungen in der Voi-App'],
            ],
          },
        },
        'Bussgelder der Behörden kommen dazu. Die Hotlines der Anbieter nennt HEAG mobilo, die von Bolt, Dott und Lime auch die Stadt auf ihrer Seite zur Shared Mobility.',
      ],
    },
    {
      heading: 'Wo darf man in Darmstadt mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen und Radfahrstreifen, auf Geh- und Radwegen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Diese Regeln setzt der Bund.',
        '«Die Nutzung von E-Scootern ist in der Fussgängerzone nicht gestattet», schreibt die Stadt; dazu gehören der Luisenplatz und die Wilhelminenstrasse. Viele Teile davon hat sie für Räder freigegeben, manche nur zu bestimmten Zeiten. Für E-Scooter gilt das bis Ende Februar 2027 nicht; ab 1. März 2027 dürfen sie laut Bundesrecht im Schritttempo hinein, wo «Radverkehr frei» die Fussgängerzone öffnet.',
        {
          table: {
            caption: 'Wo in Darmstadt was gilt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzone, etwa Luisenplatz und Wilhelminenstrasse', 'Absteigen und schieben; die Fahrt lässt sich dort nicht beenden', 'Bund (Fahren); Parkverbotszone in den Apps aller Anbieter (laut Stadt, Juli 2025)'],
              ['Öffentliche Grünanlagen, etwa Herrngarten, Orangerie, Mathildenhöhe und Rosenhöhe', 'Kraftfahrzeuge verboten, nach unserer Lesart auch E-Scooter; Räder nur auf beschilderten Wegen im Schritttempo. Die Fahrt lässt sich nicht beenden', 'Stadt: Grünanlagensatzung von 1976, zuletzt 2002 geändert'],
              ['Prinz-Georg-Garten', 'Das Fahrverbot für Räder «umfasst auch andere Formen von Freizeitmobilität wie E-Scooter»: schieben oder draussen abstellen, ausser auf offiziellen Radwegen', 'Land Hessen: Besuchsordnung der Staatlichen Schlösser und Gärten (August 2026)'],
              ['Hauptbahnhof', 'Fahrt nur auf den Abstellflächen an der Ost- und der Westseite beenden', 'Die Anbieter mit der Stadt (laut Magistrat, Mai 2023)'],
              ['17 Call-a-Bike-Stationen', 'Im Umkreis von etwa 100 m nur an der Station abstellen', 'Stadt und HEAG mobilo (seit Juni 2024)'],
            ],
          },
        },
        'Ein Nachtfahrverbot oder eine Winterpause für Leih-Scooter nennen weder die Stadt noch HEAG mobilo (Stand 26. Oktober 2026).',
      ],
    },
    {
      heading: 'E-Scooter in Darmstadt parken: Hauptbahnhof, Fussgängerzone, Call-a-Bike-Stationen',
      blocks: [
        'Am **Hauptbahnhof** haben die Anbieter laut Magistrat (Mai 2023) auf der Ost- und der Westseite virtuelle Abstellflächen eingerichtet; rundherum liegt eine Parkverbotszone, «in der kein Beenden der Ausleihe möglich ist». Weitere nannte er an Zugängen zum Bürgerpark, an der Strassenbahn-Endhaltestelle Böllenfalltor (seit März 2023) und am Bahnhof Arheilgen, wo es seit September 2022 einen Bonus fürs Abstellen gab. Ob alle noch gelten, zeigt die App.',
        'Seit Juni 2024 darfst du auch an 17 Call-a-Bike-Stationen abstellen, die der Stadtatlas und die Apps zeigen; im Umfeld jeder Station liegt eine Parkverbotszone. In der **Fussgängerzone** und in Grün- und Parkanlagen lässt sich die Miete laut Stadt und HEAG mobilo nicht beenden (Juli 2024).',
        'Sonst gelten die Regeln für Fahrräder: Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO, und Falschparken auf Geh- oder Radweg kostet dann ab 55 €. Ein Foto nach dem Abstellen verlangten laut Stadt und HEAG mobilo im Juli 2024 Bolt, Lime und TIER, heute Dott. Steht ein Scooter im Weg, melde ihn bei der Hotline des Anbieters oder auf scooter-melder.de, der Meldeseite der Anbieter, auf die HEAG mobilo verweist.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Parkverbotszone, etwa am Hauptbahnhof neben statt auf der Abstellfläche. Fahr zur nächsten erlaubten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Kontrollen und Bussgelder in Darmstadt',
      blocks: [
        'Laut Stadt (Juli 2025) kontrolliert die Stadtpolizei das Fahrverbot in der Fussgängerzone auf ihren täglichen Streifen, montags bis samstags von 6 bis 24 Uhr, sonntags von 9.30 bis 18 Uhr, und bei Schwerpunktaktionen wie am 20. Mai 2025 mit der Landespolizei in der Wilhelminenstrasse. Laut Stadt (August 2026) sind zwei Fahrradstreifen vor allem in Parks, Fussgängerzonen und der Innenstadt unterwegs. Falsch geparkte Scooter ahndete die Stadtpolizei 2023 nicht, zwei Personen auf einem Scooter schon.',
        'Sonst gilt Bundesrecht: keine Helmpflicht, höchstens 20 km/h. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden; ab 1. März 2027 25 €, bis 40 €.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €. **Ohne Versicherungsplakette:** 40 €.',
            '**Rote Ampel:** 60 € und ein Punkt, länger als 1 Sekunde rot 100 € und ein Punkt. **Handy in der Hand:** heute 100 € und ein Punkt.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot; ab 1,1 Promille eine Straftat; unter 21 oder in der Probezeit 0,0 Promille. Bolt verbietet jeden Alkohol.',
            '**In einer öffentlichen Grünanlage:** laut Grünanlagensatzung der Stadt 5 bis 1000 €.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Griesheim und Weiterstadt: mit Bolt über die Stadtgrenze',
      blocks: [
        'Über die Stadtgrenze hinaus verleiht laut HEAG mobilo Bolt. In **Griesheim** startete am 10. Juli 2025 ein Pilotprojekt mit 130 Scootern und 20 E-Bikes; du pendelst zwischen Griesheim und Darmstadt und parkst in beiden Städten. Es läuft inzwischen dauerhaft, mit rund 5300 Scooter-Fahrten im Monat (September 2026).',
        'In **Weiterstadt** kamen im Dezember 2025 170 Bolt-Scooter dazu, als Pilotprojekt bis Ende Mai 2026; parken durftest du überall ausser in Bereichen, die die App markiert, etwa Grünflächen und Schulwege. Ob der Versuch weiterläuft, sagt HEAG mobilo im September 2026 nicht.',
        'Die [Karte von Weiterstadt](map:de:Weiterstadt) zeigte am Sonntagabend rund 60 Bolt-Scooter, und die standen in der Nacht zum Montag alle in Griesheim: Die Karte zählt die meisten Griesheimer Bolt-Scooter bei Weiterstadt, rund 10 bei Darmstadt. In Weiterstadt, Mühltal, Pfungstadt und Rossdorf stand kein Scooter von Bolt, Dott oder Voi (abgeglichen mit den amtlichen Verwaltungsgrenzen Hessens).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Bahn: HEAG mobilo, RMV und DB',
      blocks: [
        'Darmstadt gehört zum RMV, und dort gilt: «E-Scooter werden wie Fahrräder behandelt.» Sie fahren kostenlos mit, ohne Anspruch; Rollstuhl und Kinderwagen haben Vorrang, und jedes Verkehrsunternehmen darf die Mitnahme einschränken oder ausschliessen. Zusammengeklappt gelten Tretroller als Gepäck. Den Akku darfst du unterwegs weder herausnehmen noch laden.',
        'Für Strassenbahnen und Busse der **HEAG mobilo** schrieb die Stadt im Juli 2025: «Derzeit ist es in den Fahrzeugen der HEAG mobilo nicht gestattet einen E-Tretroller mit sich zu führen.» Auf ihrer eigenen Website nennt HEAG mobilo dazu keine Regel (Stand 26. Oktober 2026).',
        'In S-Bahn und Regionalzug gilt die RMV-Regel. Im Fernverkehr der Deutschen Bahn fährt dein eigener Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit. Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor dem Bahnhof und miete am Ziel neu. In Frankfurt verbietet die VGF E-Tretroller seit dem 1. Oktober 2024 in U-Bahn und Strassenbahn: [E-Scooter in Frankfurt](guide:frankfurt).',
        'Leihräder zeigt unsere Karte nicht: weder Bolts E-Bikes noch Call a Bike, laut HEAG mobilo an knapp 50 Standorten, noch die Lastenräder von Heinerbike und Sigo, die die Stadt nennt.',
      ],
    },
    {
      heading: 'Heinerfest, Böllenfalltor und Hochschulen: Tipps',
      blocks: [
        '**Heinerfest:** 2026 lief es vom 2. bis 6. Juli, mit Sperrungen unter anderem in Landgraf-Georg-Strasse, Schlossgraben und Holzstrasse. Eine Scooter-Regel nannte die Stadt nicht; den Termin 2027 nennt das Heinerfest noch nicht.',
        '**Böllenfalltor:** Der SV Darmstadt 98 schickt Radfahrende zum VOBA-Bikepark vor der Böllenfalltorhalle, und Roller dürfen laut Stadionordnung (Stand 8. Juli 2026) nicht ins Stadion. Eine Scooter-Regel für Spieltage nennen weder Stadt noch Verein; nutz die Abstellfläche an der Endhaltestelle, wenn die App sie noch zeigt.',
        '**TU Darmstadt und Hochschule Darmstadt** nennen auf ihren Seiten keine eigene Scooter-Regel für ihre Campus (Stand 26. Oktober 2026). Freie Scooter in deiner Nähe zeigt die [Live-Karte von Darmstadt](map:de:Darmstadt).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Darmstadt?',
      answer: 'Bolt, Dott, Lime und Voi: Diese vier nennen die Stadt und HEAG mobilo. Du mietest in ihrer App, ab 18 und ohne Führerschein.',
    },
    {
      question: 'Was kostet ein E-Scooter in Darmstadt?',
      answer: 'Verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Bolt wirbt deutschlandweit mit ab 0,15 € pro Minute plus Freischaltgebühr; einen Darmstädter Tarif veröffentlichen Bolt und Dott nicht.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über den Luisenplatz fahren?',
      answer: 'Nein, er gehört zur Fussgängerzone: absteigen und schieben. Fahren kostet 15 €, ab 1. März 2027 25 €. Beenden lässt sich die Fahrt dort auch nicht.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Herrngarten fahren?',
      answer: 'Nach unserer Lesart nein: Laut Grünanlagensatzung dürfen öffentliche Grünanlagen «nicht mit Kraftfahrzeugen» befahren werden, und ein E-Scooter ist laut § 1 der E-Scooter-Verordnung eines. Ausdrücklich sagt die Stadt das nicht. Beenden kannst du die Fahrt im Park nicht.',
    },
    {
      question: 'Darf ich meinen E-Scooter in der Strassenbahn mitnehmen?',
      answer: 'In Strassenbahnen und Bussen der HEAG mobilo laut Stadt derzeit nicht. In S-Bahn und Regionalzug behandelt der RMV E-Scooter wie Fahrräder: kostenlos, aber ohne Anspruch.',
    },
    {
      question: 'Kann ich mit dem E-Scooter nach Griesheim oder Weiterstadt fahren?',
      answer: 'Mit Bolt nach Griesheim ja, dort darfst du auch parken. In Weiterstadt lief ein Pilotprojekt bis Ende Mai 2026; in der Nacht zum 26. Oktober 2026 stand dort kein Bolt-Scooter. Ob es weiterläuft, zeigt die Bolt-App.',
    },
    {
      question: 'Kann ich in Darmstadt nachts einen E-Scooter mieten?',
      answer: 'Ja: Ein Nachtfahrverbot nennen weder Stadt noch HEAG mobilo, und unsere Karte zeigt auch nachts Hunderte Scooter.',
    },
  ],
  sources: [
    { title: 'Stadt Darmstadt: Shared Mobility', url: 'https://www.darmstadt.de/leben/mobilitaet/shared-mobility' },
    { title: 'Stadt Darmstadt: Radverkehr', url: 'https://www.darmstadt.de/leben/mobilitaet/radverkehr' },
    { title: 'Magistrat: Antwort zu E-Scootern (15. Mai 2023)', url: 'https://darmstadt.gremien.info/petition?id=1913' },
    { title: 'Magistrat: Antwort zu Scootern in Fussgängerzonen (1. Juli 2025)', url: 'https://darmstadt.gremien.info/petition?id=2114' },
    { title: 'Stadt Darmstadt: Sondernutzungssatzung (PDF)', url: 'https://www.darmstadt.de/fileadmin/Dateistruktur2024/04_RATHAUS/04_Stadtrecht-Satzungen/Alphabetisches_Sachregister/600_bis_699/630_neu.pdf' },
    { title: 'Stadt Darmstadt: Grünanlagensatzung (PDF)', url: 'https://www.darmstadt.de/fileadmin/Dateistruktur2024/04_RATHAUS/04_Stadtrecht-Satzungen/Alphabetisches_Sachregister/300_bis_399/340.pdf' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung (eKFV), § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'Stadt Darmstadt: Die grossen 5', url: 'https://www.darmstadt.de/leben/freizeit/parks-und-gaerten/die-grossen-5' },
    { title: 'Schlösser und Gärten Hessen: Besuchsordnung (PDF)', url: 'https://www.schloesser-hessen.de/files/misc/SG-Besuchsordnung.pdf' },
    { title: 'HEAG mobilo: E-Tretroller an Call-a-Bike-Stationen (9. Juli 2024)', url: 'https://www.heagmobilo.de/pressemeldungen/mikromobilitat-gestalten-e-tretroller-konnen-ab-sofort-auch-an-call-a-bike-stationen-abgestellt-werden/' },
    { title: 'HEAG mobilo: Integrierte Mobilität', url: 'https://www.heagmobilo.de/wer-wir-sind/integrierte-mobilitaet/' },
    { title: 'HEAG mobilo: Griesheim (8. Juli 2025)', url: 'https://www.heagmobilo.de/pressemeldungen/e-tretroller-und-e-bikes-in-griesheim/' },
    { title: 'HEAG mobilo: Weiterstadt (1. Dezember 2025)', url: 'https://www.heagmobilo.de/pressemeldungen/pilotprojekt-mit-shared-mobility-in-weiterstadt-waechst-bolt-ergaenzt-angebot-um-170-e-tretroller/' },
    { title: 'Stadt Darmstadt: Fahrradstreifen der Stadtpolizei (13. August 2026)', url: 'https://www.darmstadt.de/presseportal/pressemitteilungen/einzelansicht/stadtpolizei-der-wissenschaftsstadt-darmstadt-setzt-auf-fahrradstreifen' },
    { title: 'Stadt Darmstadt: Sperrungen zum Heinerfest 2026', url: 'https://www.darmstadt.de/presseportal/pressemitteilungen/einzelansicht/verkehrssperrungen-und-umleitungen' },
    { title: 'RMV: Mitnahme von Fahrrädern, E-Scootern und Co.', url: 'https://www.rmv.de/c/de/tickets/regeln/tarifinformationen/mitnahme-von-fahrraedern-e-scootern-und-co' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'SV Darmstadt 98: Anreise', url: 'https://www.sv98.de/stadion/stadionbesuch/anreise/' },
    { title: 'SV Darmstadt 98: Stadionordnung', url: 'https://www.sv98.de/stadion/stadionbesuch/stadionordnung/' },
    { title: 'Bolt: E-Scooter', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Dott: AGB Deutschland', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'HVBG: Verwaltungsgrenzen Hessen', url: 'https://gds.hessen.de/INTERSHOP/web/WFS/HLBG-Geodaten-Site/de_DE/-/EUR/ViewDownloadcenter-Start?path=Liegenschaftskataster/Verwaltungsgrenzen%20Hessen' },
  ],
};

export default guide;
