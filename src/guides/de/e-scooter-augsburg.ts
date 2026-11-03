import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-augsburg',
  topic: 'augsburg',
  name: 'E-Scooter Augsburg: Anbieter, Regeln, Parken',
  title: 'E-Scooter Augsburg 2026: Anbieter, Parken, Tram',
  description: 'E-Scooter Augsburg: wer verleiht, wo du fahren und parken darfst, was in Innenstadt und Parks gilt und warum die Tram für E-Scooter tabu ist.',
  headline: 'E-Scooter Augsburg: Anbieter, Parken, Parks und Regeln',
  lede: 'E-Scooter in Augsburg leihst du ohne Führerschein bei Voi, Lime oder Bolt; was die Fahrt kostet und ab welchem Alter du mieten darfst, zeigt dir die App vor dem Entsperren. Einen eigenen E-Scooter darfst du ab 14 fahren. Du fährst auf dem Radweg, nicht auf dem Gehweg und nicht durch die Fussgängerzone. In der Innenstadt stellst du Leih-Scooter nur auf markierten Flächen ab. In Tram und Bus darf kein E-Scooter mit, auch zusammengeklappt nicht, und durch städtische Parks fährst du nach unserer Lesart der Grünanlagensatzung nicht.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Augsburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Augsburg?',
      blocks: [
        'In Augsburg verleihen **Voi**, **Lime** und **Bolt** E-Scooter: Am Samstag, 24. Oktober 2026, kurz vor 16 Uhr zeigte die [Karte von Augsburg](map:de:Augsburg) rund 680 Voi-Scooter, die zu diesem Zeitpunkt frei waren, am Sonntag gegen 14 Uhr rund 790 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, und am Sonntagmorgen rund 960 Lime-Scooter nach der letzten Zählung.',
        'Steht ein Scooter falsch, schickt die Stadt laut eigener Seite Umparkaufträge «an alle Anbieter». Den Preis zeigt dir die App vor dem Entsperren; verbindlich ist, was sie dort anzeigt. Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Wo darf man in Augsburg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf Radwegen, Radfahr- und Schutzstreifen und in Fahrradstrassen; nur wo es nichts davon gibt, auf der Fahrbahn. Gehweg und Fussgängerzone sind tabu, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es, ab 1. März 2027 auch «Radverkehr frei», dann im Schritttempo. Gegen die Fahrtrichtung einer Einbahnstrasse ist es bei «Radverkehr frei» bis Ende Februar 2027 widersprüchlich: Die Strassenverkehrs-Ordnung (StVO) lässt dich mitfahren, die Elektrokleinstfahrzeuge-Verordnung (eKFV) verlangt «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 ist es erlaubt, wo «Radverkehr frei» die Einbahnstrasse öffnet. Diese Regeln setzt der Bund.',
        'Die Stadt sagt es kurz: «Bleib auf dem Radweg oder der Fahrbahn. Gehwege und die Fussgängerzone sind tabu» (26. Mai 2026). Radfahrer dürfen durch Annastrasse, Philippine-Welser-Strasse, Martin-Luther-Platz und Steingasse abends und morgens fahren, über Königsplatz, Bürgermeister-Fischer-Strasse und «kurze Maximilianstrasse» jederzeit im Schritttempo. Für dich zählt bis Ende Februar 2027 nur ein Schild «Elektrokleinstfahrzeuge frei»: Halte dich an das Schild vor Ort.',
        {
          table: {
            caption: 'Wo in Augsburg was gilt (Stand 25. Oktober 2026)',
            head: ['Ort', 'Was gilt', 'Wer es festlegt'],
            rows: [
              ['Fussgängerzone um Annastrasse und Philippine-Welser-Strasse, Stadtmarkt, Rathausplatz', 'Absteigen und schieben, bis Ende Februar 2027 auch zu den Zeiten, in denen Radfahrer fahren dürfen', 'Bund; Stadt mit ihren Schildern'],
              ['Königsplatz, Bürgermeister-Fischer-Strasse, «kurze Maximilianstrasse»', 'Radfahrer im Schritttempo; für dich gilt, was das Schild erlaubt', 'Stadt mit ihren Schildern; Bund'],
              ['Städtische Parks, laut Stadt etwa Wittelsbacher Park, Siebentischanlagen, Rote-Torwall-Anlagen, Gögginger Park, Lech- und Wertachauen', 'Verboten ist «das Fahren, Parken oder Abstellen von Kraftfahrzeugen», ausser auf Wegen und Flächen, die ein Schild freigibt; bei Vorsatz droht eine Geldbusse', 'Stadt, Grünanlagensatzung vom 16. Juli 2008'],
              ['Botanischer Garten', 'Scooter dürfen nicht mit hinein, (E-)Roller nicht benutzt werden', 'Stadt, Besucherordnung vom Juni 2024'],
              ['Gelände der WWK Arena', 'Ohne Erlaubnis des FCA nicht mit Fahrzeugen befahren; Fahrzeuge und «sonstige Transportmittel» nur auf den dafür vorgesehenen Plätzen abstellen', 'FC Augsburg mit seinem Hausrecht, Stadionordnung vom Mai 2026'],
            ],
          },
        },
        'Die Satzung gilt für Parks und Grünflächen der Stadt samt ihren Wegen, nicht für Wald, Zoo, Friedhöfe, Sport- und Schulgelände oder Grün an Strassen. E-Scooter nennt sie nicht eigens, nach § 1 eKFV sind sie aber Kraftfahrzeuge. Für uns heisst das: In einem städtischen Park schiebst du, auch auf den Wegen, ausser ein Schild gibt den Weg frei, und stellst keinen Scooter ab; an Lech und Wertach gilt das, soweit die Ufer städtische Anlagen sind.',
        'Eine eigene E-Scooter-Regel für Plärrer, Universität, Technische Hochschule oder Maximilianstrasse und eine Sperrzeit oder Winterpause haben wir weder bei der Stadt noch bei den Anbietern gefunden.',
      ],
    },
    {
      heading: 'E-Scooter in Augsburg parken: Abstellflächen in der Innenstadt',
      blocks: [
        '«In der Augsburger Innenstadt dürfen E-Scooter nur innerhalb von speziell markierten und ausgewiesenen Flächen abgestellt werden», schreibt die Stadt über Leih-Scooter. Das Abstellkonzept hat sie mit den Anbietern entwickelt und 2023 umgesetzt; dazu kommt eine freiwillige Selbstverpflichtung der Anbieter, etwa keine Blindenleitsysteme zu versperren (Behindertenbeirat, November 2023). Gebunden sind damit die Anbieter, dich trifft es über die App: Ausserhalb einer Fläche «laufen die Gebühren weiter».',
        'Die Flächen sind markiert, die App zeigt sie. Die Stadt überwacht sie mit Live-Daten aller Anbieter; ist eine überfüllt, bekommen die Anbieter einen Auftrag zum Umparken. Auch private E-Scooter dürfen auf die Flächen.',
        'Ausserhalb der Innenstadt gelten die Regeln für Fahrräder: Auf dem Gehweg darfst du abstellen, solange niemand behindert oder gefährdet wird. Die Stadt bittet dich, den Scooter «am besten parallel zur Hauswand» abzustellen und «idealerweise» 2 m frei zu lassen, und schreibt: «Verboten ist das Abstellen auf der Fahrbahn und vor Ampeln im Wartebereich.» Das gilt für dich als Fahrer. Ab 1. März 2027 steht das Abstellen ausdrücklich in der StVO; stellt ein Anbieter seine Leih-Scooter auf, gilt das dann nicht als Parken, stellst du einen nach der Fahrt ab, schon. Nicht abstellen darfst du:',
        {
          list: [
            'einen Leih-Scooter in der Innenstadt ausserhalb der markierten Flächen;',
            'auf der Fahrbahn und im Wartebereich vor Ampeln (Stadt);',
            'in städtischen Parks (unsere Lesart der Grünanlagensatzung) und auf dem Gelände der WWK Arena ausserhalb der vorgesehenen Plätze (FCA);',
            'so, dass Fussgänger, Rollstühle oder das Blindenleitsystem behindert werden.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, fahr zur nächsten Fläche, die sie erlaubt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Regeln und Bussgelder für E-Scooter in Augsburg',
      blocks: [
        'Es gelten die deutschen Regeln: keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Kopfhörer sind nicht verboten, solange du den Verkehr noch hörst; sonst kostet es 10 €. Die wichtigsten Bussgelder:',
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
      heading: 'E-Scooter in Tram, Bus und Zug: was AVV, swa und Bahn erlauben',
      blocks: [
        'In den Trams und Bussen der Stadtwerke Augsburg (swa) und in den Regionalbussen des Augsburger Verkehrs- und Tarifverbunds (AVV) fährt kein E-Scooter mit. Der AVV-Gemeinschaftstarif sagt in § 11 Abs. 5: «Die Mitnahme von Elektro-Tretroller und Erwachsenen-Roller ist in Regional-, Stadtbussen und Strassenbahnen ausgeschlossen.» Eine Ausnahme für zusammengeklappte E-Scooter nennt er nicht. So steht es seit der Tarifänderung vom 1. Januar 2025 im Tarif (Stand August 2025).',
        'Für Züge verweist der AVV auf den Deutschlandtarif und den Tarif der Bayerischen Regiobahn (BRB). Nach dem Deutschlandtarif (Stand Juni 2026) darfst du einen eigenen E-Scooter zusammengeklappt als Handgepäck kostenlos mitnehmen, einen pro Person; der Akku bleibt drin und wird nur geladen, wo ein Schild im Zug es erlaubt. Das gilt in den Regionalzügen von DB Regio, BRB und Arverio Bayern.',
        'Ob ein eigener E-Scooter im Fernzug mitfahren darf, fragst du vor der Fahrt beim Verkehrsunternehmen der Linie nach.',
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor der Haltestelle oder dem Bahnhof und miete am Ziel neu. Fährst du weiter nach München: [E-Scooter in München](guide:munich).',
      ],
    },
    {
      heading: 'Kein Scooter in der Nähe? swabi, das Leihrad der swa',
      blocks: [
        'Steht kein Scooter in der Nähe, nimm **swabi**, das Leihrad der Stadtwerke Augsburg: rund 700 Räder und 320 E-Bikes an über 500 Standorten, ab 8 Cent pro Minute plus 10 Cent fürs Entsperren (Stand 25. Oktober 2026).',
        'Freie Scooter in deiner Nähe zeigt die [Live-Karte von Augsburg](map:de:Augsburg).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Augsburg?',
      answer: 'Die von Voi, Lime und Bolt (Stand Oktober 2026). Einen Führerschein brauchst du nicht; das Mindestalter und den Preis zeigt dir die App vor dem Entsperren.',
    },
    {
      question: 'Darf ich mit dem E-Scooter in die WWK Arena?',
      answer: 'Nicht aufs Gelände, ohne Erlaubnis des FCA: Die Stadionordnung vom Mai 2026 verbietet, das Gelände der WWK Arena mit Fahrzeugen zu befahren, und Fahrzeuge und «sonstige Transportmittel» stellst du dort nur auf den dafür vorgesehenen Plätzen ab. Beende die Fahrt vorher; freie Scooter für den Heimweg zeigt die [Live-Karte von Augsburg](map:de:Augsburg).',
    },
    {
      question: 'Wo darf ich den E-Scooter in der Augsburger Innenstadt abstellen?',
      answer: 'Einen Leih-Scooter nur auf den markierten Abstellflächen, sonst laufen laut Stadt die Gebühren weiter. Ausserhalb der Innenstadt darfst du auf dem Gehweg abstellen, wenn niemand behindert wird, aber nicht auf der Fahrbahn oder im Wartebereich vor Ampeln.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Annastrasse fahren?',
      answer: 'Nein, sie gehört zur Fussgängerzone: absteigen und schieben, auch wenn Radfahrer dort gerade fahren dürfen. Ab 1. März 2027 darfst du fahren, wo und wann ein Schild «Radverkehr frei» gilt, im Schritttempo. Fahren ohne Freigabe kostet heute 15 €, ab 1. März 2027 25 €.',
    },
    {
      question: 'Darf ich meinen E-Scooter in Tram oder Bus mitnehmen?',
      answer: 'Nein. Der AVV-Tarif schliesst E-Tretroller in Strassenbahnen, Stadt- und Regionalbussen aus, ohne Ausnahme für zusammengeklappte. In Regionalzügen darf ein eigener E-Scooter nach dem Deutschlandtarif zusammengeklappt als Handgepäck mit; für den Fernzug fragst du vor der Fahrt nach. Leih-Scooter lassen sich nicht zusammenklappen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch den Wittelsbacher Park oder an der Wertach fahren?',
      answer: 'Nach unserer Lesart nein. Die Grünanlagensatzung verbietet in städtischen Parks, Kraftfahrzeuge zu fahren oder abzustellen, und E-Scooter sind rechtlich Kraftfahrzeuge; das gilt auch in den Lech- und Wertachauen, soweit sie städtische Anlagen sind. Ausgenommen sind Wege, die ein Schild freigibt.',
    },
  ],
  sources: [
    { title: 'Stadt Augsburg: E-Scooter (26. Mai 2026)', url: 'https://www.augsburg.de/buergerservice-rathaus/verkehr/fair-im-verkehr/e-scooter' },
    { title: 'Stadt Augsburg, Behindertenbeirat: Bericht vom 23. November 2023 (PDF)', url: 'https://www.augsburg.de/fileadmin/user_upload/buergerservice_rathaus/rathaus/beiraete/behindertenbeirat/protokolle_2023_11/Prot_Versam__2023_Bericht_Anlage_2.pdf' },
    { title: 'Stadt Augsburg: Smarte Projekte, E-Scooter-Monitoring (3. August 2026)', url: 'https://www.augsburg.de/buergerservice-rathaus/smart-digital/smarte-projekte' },
    { title: 'Stadt Augsburg: Smart City Index 2026 (17. September 2026)', url: 'https://www.augsburg.de/aktuelles-aus-der-stadt/detail/augsburg-steigt-im-smart-city-index-2026-auf-platz-18' },
    { title: 'Stadt Augsburg: Gut zu wissen für Radler (12. Mai 2026)', url: 'https://www.augsburg.de/buergerservice-rathaus/verkehr/radverkehr/gut-zu-wissen' },
    { title: 'Stadt Augsburg: Parkanlagen', url: 'https://www.augsburg.de/freizeit/ausflugsziele/parkanlagen' },
    { title: 'Stadt Augsburg: Grünanlagensatzung vom 16. Juli 2008 (PDF)', url: 'https://www.augsburg.de/fileadmin/user_upload/freizeit/ausflugsziele/parkanlagen/downloads/Gr%C3%BCnanlagensatzung_Augsburg-3.pdf' },
    { title: 'Botanischer Garten Augsburg: Besucherordnung, Juni 2024 (PDF)', url: 'https://www.augsburg.de/fileadmin/user_upload/freizeit/ausflugsziele/botanischer_garten/download/240522-Besucherordnung-2024_web.pdf' },
    { title: 'FC Augsburg: Stadionordnung WWK ARENA (Mai 2026, PDF)', url: 'https://www.fcaugsburg.de/stadionordnung' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung, § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'AVV: Gemeinschaftstarif, Stand 1. August 2025 (PDF)', url: 'https://www.sw-augsburg.de/fileadmin/content/6_pdf_Downloadcenter/3_Mobilitaet/Gemeinschaftstarif/AVV_Gemeinschaftstarif_Stand_01.08.2025_inkl._Deutschlandticket_und_bayer._Ermaessigungsticket.pdf' },
    { title: 'swa: swabi, das Leihrad', url: 'https://www.sw-augsburg.de/privatkunden/mobilitaet/swabi' },
    { title: 'Deutschlandtarif: Tarifbedingungen, Teil A, Stand 14. Juni 2026 (PDF)', url: 'https://www.deutschlandtarifverbund.de/wp-content/uploads/2026/06/20260528_A-1-TB-DT-Grundsaetze_Juni2026.pdf' },
  ],
};

export default guide;
