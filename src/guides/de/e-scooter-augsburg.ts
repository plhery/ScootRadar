import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-augsburg',
  topic: 'augsburg',
  name: 'E-Scooter Augsburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Augsburg 2026: Anbieter, Preise, Parken, Tram',
  description: 'E-Scooter Augsburg: wer verleiht, was eine Fahrt kostet, wo du fahren und parken darfst, was in Innenstadt und Parks gilt und warum die Tram tabu ist.',
  headline: 'E-Scooter Augsburg: Anbieter, Preise, Parken und Regeln',
  lede: 'E-Scooter in Augsburg leihst du bei Voi, Lime oder Bolt, ohne Führerschein und erst ab 18: Das verlangen die Anbieter, das Gesetz erlaubt einen eigenen E-Scooter schon ab 14. Auch Hopp führt Augsburg auf seiner Website, fehlt aber auf unserer Karte. Den Preis von Voi, Lime und Bolt zeigt die App; Hopp nennt 0,50 € zum Start und 0,20 € pro Minute (Stand 25. Oktober 2026). Du fährst auf dem Radweg, nicht auf dem Gehweg und nicht durch die Fussgängerzone. In der Innenstadt stellst du Leih-Scooter nur auf markierten Flächen ab. In Tram und Bus darf kein E-Scooter mit, auch zusammengeklappt nicht, und durch städtische Parks fährst du nach unserer Lesart der Grünanlagensatzung nicht.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'de:Augsburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Augsburg?',
      blocks: [
        'In Augsburg verleihen **Voi** und **Lime** E-Scooter; im April 2025 zählte Voi Augsburg zu seinen sieben Städten in Bayern, und Lime führt Augsburg auf seiner Städteseite. **Bolt** nennt auf seiner Augsburg-Seite unter «Verfügbare Dienste in Augsburg» «E-Scooter auf Abruf». **Hopp** führt auf seiner Standortseite den Franchise-Betrieb «Hopp Augsburg» mit E-Scootern; der Eintrag wurde im Juni 2026 zuletzt geändert. Dott, früher TIER, führt Augsburg nicht unter seinen Standorten (alle gelesen am 25. Oktober 2026).',
        'Eine Anbieterliste, Obergrenze, Gebühr oder Erlaubnispflicht der Stadt haben wir nicht gefunden; Umparkaufträge schickt sie «an alle Anbieter». Wie das Mieten geht: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Die [Karte von Augsburg](map:de:Augsburg) zeigt Voi und seit dem 25. Oktober 2026 auch Lime und Bolt. Von Voi standen dort am Samstag, 24. Oktober, kurz vor 16 Uhr rund 680 Scooter, in der Nacht darauf kurz nach Mitternacht knapp 690. Das sind Momentaufnahmen, keine Flottengrösse. Die Zahl schliesst Nachbarorte wie Friedberg, Stadtbergen, Neusäss und Königsbrunn ein, dort stand aber kaum einer: Am Sonntagmorgen gegen 9 Uhr waren es 6 von rund 680. Am Sonntag, 25. Oktober, zeigte die Karte gegen 7 Uhr rund 960 Lime-Scooter in Limes Fahrgebiet und um 14 Uhr rund 790 Bolt-Scooter.',
        'Die Karte zeigt, wo die Scooter stehen, bei Voi und Lime auch den Akkustand, aber keine Preise, Abstellflächen oder Verbotszonen; die zeigen die Apps. **Hopp fehlt auf unserer Karte:** Seine Scooter siehst du nur in der Hopp-App.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Augsburg?',
      blocks: [
        'Einen offenen Augsburger Tarif fanden wir bei Voi, Lime und Bolt nicht; verbindlich ist der Preis, den die App vor dem Entsperren zeigt. Hopp nennt auf seiner Standortseite für Augsburg 0,50 € zum Start und 0,20 € pro Minute (Stand 25. Oktober 2026); eine Fahrt von 15 Minuten kostet damit 3,50 €. Teuer wird es, wenn du falsch parkst:',
        {
          table: {
            caption: 'Preise und Gebühren fürs Falschparken (Stand 25. Oktober 2026)',
            head: ['Anbieter', 'Fahrt', 'Falsch geparkt'],
            rows: [
              ['Voi', 'Nur in der App', 'Nicht offen veröffentlicht gefunden'],
              ['Bolt', 'Nur in der App', '15 €, wenn der Scooter falsch steht und kein deutliches Foto am Fahrtende das Gegenteil zeigt; bis 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs (Bedingungen seit 2023, auch ab 1. Dezember 2026)'],
              ['Hopp', '0,50 € Start, 0,20 € pro Minute', 'Auf der Website nicht genannt'],
            ],
          },
        },
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
        'Für Züge verweist der AVV auf den Deutschlandtarif und den Tarif der Bayerischen Regiobahn (BRB). Nach dem Deutschlandtarif (Stand Juni 2026) darfst du einen eigenen E-Scooter zusammengeklappt als Handgepäck kostenlos mitnehmen, einen pro Person; der Akku bleibt drin und wird nur geladen, wo ein Schild im Zug es erlaubt. Das gilt in den Regionalzügen von DB Regio, BRB und Arverio Bayern. Die BRB nimmt E-Scooter nur mit fest verbautem Akku mit und lässt sie nicht an den Steckdosen im Zug laden.',
        'Im Fernverkehr der Deutschen Bahn fährt dein eigener E-Scooter zusammengeklappt und sicher verstaut kostenlos als Handgepäck mit. Den Akku darfst du nicht herausnehmen oder laden. Lässt er sich nicht klappen, gilt er als Traglast und darf nur mit, wenn du ihn sicher unterbringst, etwa im Gepäckregal.',
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt vor der Haltestelle oder dem Bahnhof und miete am Ziel neu. Fährst du weiter nach München: [E-Scooter in München](guide:munich).',
      ],
    },
    {
      heading: 'Hauptbahnhof, Königsplatz, Uni und WWK Arena: Tipps',
      blocks: [
        'Wo am Sonntag, 25. Oktober 2026, gegen 9 Uhr Voi-Scooter standen:',
        {
          list: [
            '**Königsplatz:** rund 40 im Umkreis von 500 m.',
            '**Hauptbahnhof:** nur 2 im Umkreis von 300 m, 20 im Umkreis von 500 m; am Bahnhof Oberhausen 13 im Umkreis von 300 m.',
            '**Technische Hochschule:** 16 im Umkreis von 300 m.',
            '**Universität:** 7 im Umkreis von 300 m.',
            '**WWK Arena:** keiner im Umkreis von 500 m.',
          ],
        },
        'Steht kein Scooter in der Nähe, gibt es **swabi**, das Leihrad der swa: rund 700 Räder und 320 E-Bikes an über 500 Standorten, ab 8 Cent pro Minute plus 10 Cent fürs Entsperren (Stand 25. Oktober 2026).',
        'Freie Voi-, Lime- und Bolt-Scooter in deiner Nähe zeigt die [Live-Karte von Augsburg](map:de:Augsburg).',
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter gibt es in Augsburg?',
      answer: 'Voi und Lime verleihen E-Scooter; Bolt nennt auf seiner Augsburg-Seite «E-Scooter auf Abruf», Hopp führt «Hopp Augsburg» mit E-Scootern (Stand 25. Oktober 2026). Dott führt Augsburg nicht. Unsere [Live-Karte](map:de:Augsburg) zeigt Voi, Lime und Bolt; Hopp fehlt dort.',
    },
    {
      question: 'Was kostet ein E-Scooter in Augsburg?',
      answer: 'Bei Voi, Lime und Bolt zeigt den Preis nur die App, verbindlich vor dem Entsperren. Hopp nennt auf seiner Website 0,50 € zum Start und 0,20 € pro Minute (Stand 25. Oktober 2026).',
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
      answer: 'Nein. Der AVV-Tarif schliesst E-Tretroller in Strassenbahnen, Stadt- und Regionalbussen aus, ohne Ausnahme für zusammengeklappte. In Regionalzügen und im Fernverkehr der Bahn darf ein eigener E-Scooter zusammengeklappt als Handgepäck mit. Leih-Scooter lassen sich nicht zusammenklappen.',
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
    { title: 'Deutsche Bahn: E-Scooter im Fernverkehr', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Bayerische Regiobahn: Fahrradmitnahme', url: 'https://www.brb.de/de/tickets/fahrradmitnahme' },
    { title: 'Lime: Locations (gelesen am 25. Oktober 2026)', url: 'https://www.li.me/locations' },
    { title: 'Voi: Voi startet in Regensburg (29. April 2025, PDF)', url: 'https://storage.mfn.se/7985fb60-e679-4774-acb8-42a86e1b5711/e-scooter-anbieter-voi-startet-in-regensburg.pdf' },
    { title: 'Bolt: Augsburg', url: 'https://bolt.eu/de-de/cities/augsburg/' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Hopp: Locations (englisch)', url: 'https://hopp.bike/locations' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
  ],
};

export default guide;
