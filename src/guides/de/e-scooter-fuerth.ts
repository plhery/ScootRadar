import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-fuerth',
  topic: 'fuerth',
  name: 'E-Scooter Fürth: Anbieter, Preise, Parken',
  title: 'E-Scooter Fürth 2026: Voi, Bolt, Dott, Lime, Preise',
  description: 'E-Scooter Fürth: Leih-Scooter von Voi, Bolt, Dott und Lime. Was die Fahrt kostet, wo du fährst und parkst und was in U-Bahn, Bus und Zug gilt.',
  headline: 'E-Scooter Fürth: Voi, Bolt, Dott und Lime, Preise, Parken und was in U-Bahn, Bus und Zug gilt',
  lede: 'Einen E-Scooter in Fürth leihst du ab 18 und ohne Führerschein bei Voi, Bolt, Dott oder Lime; Scooter aller vier zeigt die ScootRadar-Karte in der Stadt. Den Preis zeigt dir die App vor dem Entsperren. Du fährst auf Radweg oder Fahrbahn, nicht auf dem Gehweg und nicht durch Fussgängerzonen, und stellst den Scooter so ab, dass niemand behindert wird.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'de:Fürth',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Fürth?',
      blocks: [
        'In Fürth stehen E-Scooter, auch E-Roller genannt, von **Voi**, **Bolt**, **Dott** (früher Tier) und **Lime**. Bolts Seite «Bolt in Fürth» nennt E-Scooter unter den verfügbaren Kategorien, und Dott führt Fürth unter seinen Standorten (beides gelesen am 26. Oktober 2026). Für Voi und Lime spricht die Karte: Sie zeigt Scooter beider Anbieter in der Stadt. Dass auch Zeus oder Bird in Fürth vermieten, nennt keine offizielle Quelle. Du leihst in der App des Anbieters, ab 18 und ohne Führerschein. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Auf der [Karte von Fürth](map:de:Fürth) zeigt ScootRadar alle vier: bei Dott nur den Standort, bei Voi und Lime auch den Akkustand, bei Bolt ebenfalls, sofern Bolt ihn nicht ausblendet. Preise, Zonen oder Abstellflächen zeigt sie nicht. Am Montag, 26. Oktober 2026, standen zwischen 21.20 und 21.35 Uhr innerhalb der amtlichen Stadtgrenze des Landesamts für Digitalisierung, Breitband und Vermessung (LDBV) rund 510 Voi-, 170 Bolt- und 100 Dott-Scooter. Nach den Ortslagen im amtlichen Landschaftsmodell des LDBV standen gut zwei Drittel davon in der Kernstadt, rund 70 in Poppenreuth, 65 in Stadeln, 20 in Dambach und 10 in Burgfarrnbach, dort nur Bolt; in Vach stand keiner. Lime ist eine eigene Zählung für Limes Region Nürnberg, die auch einen grossen Teil von Fürth einschliesst: rund 1130 Scooter, abgeschlossen am Sonntag, 25. Oktober, um 13.27 Uhr. Eine Zahl nur für Fürth gibt sie nicht her. Das sind Momentaufnahmen, keine Flottengrössen.',
        'Zoomst du heraus, steht über Fürth eine Zahl, die nur Bolt-Scooter zählt, und nicht einmal alle: Die übrigen Scooter in Fürth rechnet die Karte Nürnberg zu. Zoomst du hinein, siehst du jeden an seinem Standort.',
        'Ganz Fürth deckt die Karte aber nicht für jeden Anbieter ab. Nach der Stadtgrenze und den Hausumringen des LDBV fehlt bei Dott gut die Hälfte der Stadtfläche mit knapp einem Drittel der Gebäude: Burgfarrnbach, Vach, Bislohe, Mannhof, Herboldshof, Flexdorf und Ritzmannshof ganz, Stadeln und Sack grösstenteils, Atzenhof zur Hälfte. Bei Lime fehlen zwei Fünftel der Gebäude: dieselben Orte, dazu ganz Atzenhof, Sack und Kronach und der grösste Teil von Oberfürberg und Unterfarrnbach. Bei Bolt fehlt nur ein schmaler Streifen an der Grenze zu Seukendorf und Veitsbronn mit 3 Gebäuden, bei Voi nichts. Ob dort Scooter stehen, siehst du in der App des Anbieters.',
      ],
    },
    {
      heading: 'E-Scooter mieten in Fürth: Was kostet die Fahrt?',
      blocks: [
        'Den Preis zeigt dir die App, bevor du losfährst; einen Tarif für Fürth nennen weder Bolt noch Dott auf ihren Seiten. Bei Dott werden die Gebühren laut seinen Bedingungen «in Ihrem Benutzerkonto … angezeigt, bevor Sie ein Fahrzeug freischalten»; bei Bolt gehört «die geltende Gebührentabelle, wie sie in der App angezeigt wird» zum Vertrag. Teuer wird es, wenn du falsch abstellst:',
        {
          table: {
            caption: 'Gebühren laut den Bedingungen der Anbieter (Stand in der letzten Spalte)',
            head: ['Anbieter', 'Falsch abgestellt', 'Weitere Gebühr', 'Stand'],
            rows: [
              ['Bolt', '15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist', 'bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs', 'seit 2023, auch ab 1. Dezember 2026'],
              ['Dott', 'bis zu 300 € für die Rückholung des Scooters, wenn du Park- und Sperranweisungen nicht befolgst', '50 € Verwaltungsgebühr, wenn Dott ein Bussgeld für dich zahlt', '23. September 2025'],
            ],
          },
        },
        'Zahlt Bolt für dich ein Bussgeld, kommen laut denselben Bedingungen höchstens 30 € Verwaltungsgebühr dazu, seit 2023 wie ab 1. Dezember 2026. Alkohol ist auf Bolts Scootern ganz tabu: «Es gilt ein striktes Alkoholverbot von 0,0‰.»',
      ],
    },
    {
      heading: 'Wo darf man in Fürth mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Diese Regeln setzt der Bund.',
        {
          list: [
            '**Fussgängerzone in der Innenstadt:** Als Fussgängerzone führt das amtliche Landschaftsmodell des LDBV (ATKIS Basis-DLM) unter anderem Abschnitte der Schwabacher Strasse, der Rudolf-Breitscheid-Strasse, der Alexanderstrasse und der Hallstrasse sowie den Hallplatz und den Marktplatz. Was dort gilt, zeigen die Schilder: Ohne «Elektrokleinstfahrzeuge frei» steigst du ab und schiebst.',
            '**Betriebsgebiet:** Fahren darfst du laut Dotts Bedingungen nur im Betriebsgebiet, das dir die Dott-App auf einer Karte zeigt.',
            '**Nachts und im Winter:** Eine nächtliche Sperrzeit oder Winterpause nennen weder Bolt noch Dott in ihren Bedingungen (Stand 26. Oktober 2026).',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter in Fürth abstellen: Wo die Fahrt enden darf',
      blocks: [
        'Fürs Parken gelten bundesweit die Regeln für Fahrräder: Abstellen auf dem Gehweg ist erlaubt, solange niemand behindert oder gefährdet wird. Ab 1. März 2027 steht das ausdrücklich in der StVO, und Falschparken auf Geh- oder Radweg kostet dann ab 55 €. Wo du die Miete beenden darfst, zeigt die App. Bolt verlangt einen zulässigen Parkbereich: «Insbesondere darf das E-Fahrzeug nicht in den in der App ausgewiesenen roten Bereichen geparkt werden.» Dotts Geschäftsbedingungen verlangen mehr: Hat eine Stadt Parkplätze für die Scooter ausgewiesen, parkst du nur dort, sonst so, dass du keine Gebäudeeingänge blockierst und weder Fussgänger noch Verkehr behinderst. Dott kann beim Beenden der Fahrt ein Foto verlangen.',
        '**Fürth (Bay) Hbf:** Die Hausordnung der DB (Stand Oktober 2026) verbietet «in unseren Bahnhöfen und auf unseren Vorplätzen», mit E-Scootern zu fahren («Nur das Schieben oder Tragen ist erlaubt»), und Kleinstfahrzeuge «an Zugängen, auf Bahnsteigen und ausserhalb der dafür ausgewiesenen Flächen» abzustellen.',
        {
          table: {
            caption: 'Wo in Fürth eigene Regeln gelten und wer sie setzt (Stand 26. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es regelt'],
            rows: [
              ['Fussgängerzone in der Innenstadt', 'Nur schieben, ausser ein Schild erlaubt das Fahren', 'Bund (eKFV, StVO), Stadt (Beschilderung)'],
              ['Fürth (Bay) Hbf', 'Im Bahnhof und auf den Vorplätzen der DB nur schieben oder tragen; nicht an Zugängen und auf Bahnsteigen abstellen', 'DB (Hausordnung, Stand Oktober 2026)'],
              ['U-Bahn, Busse und U-Bahnhöfe der VAG', 'Kein E-Scooter, auch kein eigener', 'VAG'],
              ['Rote Bereiche in der Bolt-App', 'Nicht abstellen', 'Bolt (Nutzungsbedingungen)'],
            ],
          },
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Fürth: Bussgelder und Alkohol',
      blocks: [
        'In Fürth gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit gefahren', '10 €', '25 €'],
              ['Rote Ampel', '60 € und 1 Punkt; länger als 1 Sekunde rot: 100 € und 1 Punkt', 'Unverändert'],
              ['Handy in der Hand', '100 € und 1 Punkt', 'Neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'Unverändert'],
              ['Unzulässig auf Geh- oder Radweg geparkt', 'Behindernd 20 €, gefährdend 30 € (§ 1 StVO)', '55 €, mit Behinderung 70 €'],
              ['Ohne gültige Versicherungsplakette', '40 €', 'Unverändert'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Wer unsicher fährt, macht sich schon ab 0,3 Promille strafbar, ab 1,1 Promille in jedem Fall, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0 Promille.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in U-Bahn, Bus und Zug: VAG, infra fürth, VGN und DB',
      blocks: [
        'Fürth gehört zum Verkehrsverbund Grossraum Nürnberg (VGN). Laut dpa gab der VGN am 13. Mai 2024 bekannt, dass E-Tretroller ab sofort nicht mehr in Bussen, U-Bahnen und Strassenbahnen mitfahren dürfen. Was die Verkehrsunternehmen und die Bahn selbst schreiben:',
        {
          list: [
            '**U-Bahn und Busse der VAG:** Die VAG, deren U-Bahn auch in Fürth fährt, schreibt: «… aufgrund der erhöhten Brand- und Explosionsgefahr ist die Mitnahme von E-Scootern (E-Rollern) in unseren Bussen und Bahnen sowie das Mitführen an U-Bahnhöfen untersagt.»',
            '**Busse der infra fürth:** In ihren Bussen gelten laut infra fürth «die Tarifbestimmungen und Beförderungsbedingungen des Verkehrsverbund Grossraum Nürnberg». Ein eigenes Verbot für E-Scooter nennt die infra fürth auf ihrer Website nicht.',
            '**S-Bahn und Regionalzug:** Für deinen eigenen E-Tretroller gilt: Im VGN rund um Nürnberg ist er in S-Bahn und Regionalzug erlaubt.',
            '**IC und ICE der Deutschen Bahn:** Zusammengeklappt und sicher verstaut fährt dein eigener E-Scooter dort kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Miete in der Nähe der Haltestelle, ohne den Zugang zu versperren, und leih dir am Ziel einen neuen.',
        '**VAG_Rad:** Laut VAG_Rad stehen 2550 Fahrräder an über 100 Stationen und in Flexzonen in Nürnberg, Fürth, Erlangen und Schwabach bereit (gelesen am 26. Oktober 2026). Leihräder zeigt die ScootRadar-Karte nicht.',
      ],
    },
    {
      heading: 'E-Scooter rund um Fürth: Nürnberg, Zirndorf und Erlangen',
      blocks: [
        '**Nürnberg:** Die [Karte von Nürnberg](map:de:Nürnberg) zeigt Voi, Dott, Lime und Bolt. In der Altstadt und überall innerhalb des Bundesstrassenrings beendest du die Fahrt dort nur an einem markierten Sammelparkplatz; mehr steht in [E-Scooter in Nürnberg](guide:nuremberg).',
        '**Zirndorf und Oberasbach:** Am selben Montagabend standen nach der amtlichen Grenze in Zirndorf rund 80 Voi-Scooter und ein Dott-Scooter, in Oberasbach ein Voi-Scooter. Ob du eine Fahrt aus Fürth dort beenden darfst, zeigt dir die App.',
        '**Erlangen:** Die [Karte von Erlangen](map:de:Erlangen) zeigt dort Dott, Bolt und Voi; Dott führt auch Erlangen unter seinen Standorten.',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter kann ich in Fürth mieten?',
      answer: 'Die von Voi, Bolt, Dott und Lime: Scooter aller vier zeigt die ScootRadar-Karte in Fürth (Stand 26. Oktober 2026), bei Dott nur mit Standort, bei den anderen auch mit Akkustand. Du musst 18 sein, einen Führerschein brauchst du nicht.',
    },
    {
      question: 'Was kostet ein E-Scooter in Fürth?',
      answer: 'Den Preis zeigt dir die App vor dem Entsperren; einen Tarif für Fürth nennen weder Bolt noch Dott auf ihren Seiten. Teuer wird Falschparken: bei Bolt 15 € ohne klares Abstellfoto und bis zu 100 € Abholgebühr, bei Dott bis zu 300 € Rückholkosten.',
    },
    {
      question: 'Wo darf ich in Fürth einen Leih-Scooter abstellen?',
      answer: 'Wo die App das Fahrtende erlaubt und so, dass niemand behindert wird; bei Bolt nicht in den roten Bereichen der App. Am Hauptbahnhof laut DB nicht an Zugängen und auf Bahnsteigen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Fussgängerzone in Fürth fahren?',
      answer: 'Nein, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, dann im Schritttempo; ab 1. März 2027 genügt auch «Radverkehr frei». Als Fussgängerzone führt das amtliche Landschaftsmodell etwa Abschnitte der Schwabacher Strasse und der Rudolf-Breitscheid-Strasse.',
    },
    {
      question: 'Darf ich einen E-Scooter in U-Bahn oder Bus in Fürth mitnehmen?',
      answer: 'In U-Bahn und Bussen der VAG nicht: Die VAG untersagt E-Scooter in ihren Bussen und Bahnen und an U-Bahnhöfen. Für die Busse der infra fürth gelten laut infra die Beförderungsbedingungen des VGN; laut dpa hat der VGN E-Tretroller am 13. Mai 2024 aus Bus, U-Bahn und Strassenbahn verbannt. In S-Bahn und Regionalzug darf dein eigener Scooter im VGN mit, im IC und ICE zusammengeklappt als Handgepäck.',
    },
    {
      question: 'Gibt es E-Scooter in Burgfarrnbach und Vach?',
      answer: 'Am Montagabend, 26. Oktober 2026, zeigte die Karte in Burgfarrnbach 10 Bolt-Scooter und in Vach keinen. Dott- und Lime-Scooter zeigt sie in beiden Orten nicht; ob dort welche stehen, siehst du in der Dott- oder der Lime-App.',
    },
  ],
  sources: [
    { title: 'Bolt: Bolt in Fürth (gelesen am 26. Oktober 2026)', url: 'https://bolt.eu/de-de/cities/furth/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. August 2023 bis 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicle-old/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Dott: Unsere Standorte (gelesen am 26. Oktober 2026)', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (letztes Update 23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'VAG: FAQ Sicherheit, Mitnahme von E-Scootern', url: 'https://www.vag.de/ihre-vag/service/faq/kategorien/anlagen-und-fahrzeuge/sicherheit' },
    { title: 'infra fürth: Tickets und Preise für Bus und U-Bahn in Fürth', url: 'https://www.infra-fuerth.de/mobilitaet/oepnv/unser-oepnv-angebot' },
    { title: 'infranken.de (dpa): VGN verbietet E-Scooter in Bus, U-Bahn und Tram (13. Mai 2024)', url: 'https://www.infranken.de/lk/nuernberg/nuernberg-vgn-verbietet-e-scooter-in-bus-u-bahn-und-tram-mit-ungewoehnlicher-begruendung-art-5869423' },
    { title: 'VAG_Rad: Fahrradverleih in Nürnberg, Fürth, Erlangen und Schwabach', url: 'https://www.vagrad.de/de/' },
    { title: 'Deutsche Bahn: Bahnhof Fürth (Bay) Hbf', url: 'https://www.bahnhof.de/fuerth-bay-hbf' },
    { title: 'Deutsche Bahn: Hausordnung der Bahnhöfe (Stand Oktober 2026)', url: 'https://www.bahnhof.de/hausordnung' },
    { title: 'Deutsche Bahn: Beförderungsbedingungen (Stand 26. Oktober 2026), A.7.1', url: 'https://www.bahn.de/agb' },
    { title: 'LDBV: ALKIS-Verwaltungsgebiete (Open Data, CC BY 4.0)', url: 'https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=verwaltung' },
    { title: 'LDBV: Hausumringe (Open Data, CC BY 4.0)', url: 'https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=hausumringe' },
    { title: 'LDBV: ATKIS Basis-DLM (Open Data, CC BY 4.0)', url: 'https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=atkis_basis_dlm' },
  ],
};

export default guide;
