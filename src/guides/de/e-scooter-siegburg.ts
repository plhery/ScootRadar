import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-siegburg',
  topic: 'siegburg',
  name: 'E-Scooter Siegburg: Dott, Voi, Stationen, Fussgängerzone',
  title: 'E-Scooter Siegburg 2026: Dott, Voi, Stationen, Regeln',
  description: 'E-Scooter in Siegburg leihen bei Dott oder Voi: Zehn Minuten Voi kosten 1,80 €. Wo die Fahrt in der Innenstadt endet und was in Bahn und Bus gilt.',
  headline: 'E-Scooter Siegburg: Anbieter, Preise, Stationen in der Innenstadt und was am Bahnhof, auf dem Michaelsberg und in der Linie 66 gilt',
  lede: 'Einen E-Scooter in Siegburg leihst du ohne Führerschein bei Dott oder Voi, bei Dott laut AGB ab 18. Bei Voi kosten zehn Minuten 1,80 € (Stand November 2026), bei Dott zeigt die App den Preis. In der Innenstadt beginnt und endet eine Fahrt nur an markierten Stationen; in der Fussgängerzone, auf dem Michaelsberg, in Grünflächen und am Wasser endet sie gar nicht. Durch die Fussgängerzone schiebst du. In die Linie 66 und die Busse von SWB Bus und Bahn darf kein E-Tretroller mit.',
  published: '2026-11-24',
  updated: '2026-11-24',
  city: 'de:Siegburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Siegburg?',
      blocks: [
        'In Siegburg vermieten **Dott** und **Voi** E-Scooter. Die Stadt nennt beide auf ihrer Seite zu den Elektrotretrollern: Dott mit türkisen, Voi mit lachsfarbenen Rollern. Für den Dauerbetrieb ausgewählt hatte sie 2024 TIER und Voi; TIER heisst heute Dott. Gemietet wird in der App des Anbieters, ohne Führerschein, bei Dott laut AGB erst ab 18. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Mittwoch, 25. November 2026, um 5:03 Uhr zeigte die [Karte von Siegburg](map:de:Siegburg) im Stadtgebiet rund 160 Dott- und rund 150 Voi-Scooter, die zu diesem Zeitpunkt frei waren. Knapp zwei Drittel standen im Umkreis von anderthalb Kilometern um den Bahnhof, vor allem in der Innenstadt.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Siegburg?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Siegburg (Stand November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,18 €', '1,80 €', '3,60 €'],
              ['Dott', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine halbe Stunde mit Voi kostet 5,40 €. Es ist derselbe Tarif wie in Bonn und Sankt Augustin: Voi fasst die drei Städte zu einer Zone zusammen. Bei Dott zeigt die App den Preis. Verbindlich ist bei beiden der Preis, den die App vor dem Entsperren zeigt.',
      ],
    },
    {
      heading: 'E-Scooter in Siegburg abstellen: Stationen und Verbotszonen',
      blocks: [
        'In der Innenstadt geht Leihen und Zurückgeben laut Stadt (Oktober 2024) nur an markierten und beschilderten Stationen. Der Bereich reicht laut der Karte der Stadt (Stand August 2024) etwa von den Gleisen am Bahnhof bis an den Michaelsberg; die genaue Grenze zeigt dir die App.',
        'Die ersten 15 Stationen markierte die Stadt 2024, im August 2025 kam eine an der Bahnhofstrasse vor der Einmündung Ringstrasse dazu, ausdrücklich, um Fahrten durch die Fussgängerzone abzufangen. Voi führt in der Innenstadt unter anderem Stationen am Busbahnhof, an der Bahnhofstrasse, am Kreishaus, am Friedensplatz, am Rhein-Sieg-Forum und an der Holzgasse/Kleiberg.',
        '**Verbotszonen**, in denen keine Fahrt endet, sind laut der Seite der Stadt unter anderem der Michaelsberg, Grünflächen, Friedhöfe, Flächen in Gewässernähe und die ganze Fussgängerzone. Laut Vereinbarung mit den Anbietern gehören auch Spielplätze, Brücken, die unbefestigten Ufer der Sieg, Wald- und Schutzgebiete und das Grün am Strassenrand dazu (Stand November 2023).',
        'Ausserhalb der Innenstadt stellst du fast im ganzen Stadtgebiet frei ab, laut der Vereinbarung mit den Anbietern aber nicht in Grünstreifen, an sozialen Einrichtungen, in Einfahrten, an Eingängen, auf Rettungswegen, vor Querungsstellen, in Fahrradabstellanlagen und auf Blindenleitsystemen.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder in der Innenstadt neben einer Station, aber nicht darauf. Fahr weiter, bis die App das Abstellen erlaubt: Solange die Fahrt läuft, zahlst du.',
        },
        '**Falsch abgestellt?** Erster Ansprechpartner ist laut Stadt der Anbieter: Dott unter +49 30 46690493 oder service@ridedott.com, Voi unter +49 800 0002709 oder support@voiapp.io; für alle Anbieter geht es auch über Scooter-Melder.de. Der Stadt meldest du einen Scooter werktags an mobilitaet@siegburg.de, am Wochenende unter 02241 102 3232. Die Anbieter müssen ihn dann wegräumen; tun sie es nicht, kann die Stadt das nach 48 Stunden auf Kosten der Anbieter selbst tun (Stand November 2024).',
      ],
    },
    {
      heading: 'Wo darf man in Siegburg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder in der Fahrradstrasse; wo es nichts davon gibt, auf der Fahrbahn oder im verkehrsberuhigten Bereich. Gehwege sind tabu, so steht es auch auf der Seite der Stadt.',
        '**Fussgängerzone:** Seit 1. September 2021 dürfen Radfahrer ganztägig durch die ganze Fussgängerzone fahren. Für E-Scooter gilt das nicht: Bis Ende Februar 2027 brauchen sie ein Schild «Elektrokleinstfahrzeuge frei», und laut Stadt ist ihnen die ganze Fussgängerzone gesperrt. Viele hätten die Freigabe für Räder falsch verstanden, schrieb die Stadt im Juni 2026. Bei einer Kontrolle am Markt im September 2024 mussten fünf E-Scooter-Fahrer absteigen und schieben; im Normalfall kostet das 15 €.',
        '**Michaelsberg:** Der Berg ist Verbotszone, oben endet keine Fahrt. Stell den Scooter vorher ab und geh zu Fuss hinauf; auf Fusswegen fährst du ohnehin nicht.',
        '**Siegaue und Sieg:** Am Wasser, auf den unbefestigten Ufern und auf Brücken endet keine Fahrt. In der Aue fährst du auf Radwegen und Strassen, nicht auf Wiesen und reinen Fusswegen.',
      ],
    },
    {
      heading: 'Was ab März 2027 in der Fussgängerzone kommen soll',
      blocks: [
        'Ab 1. März 2027 wird bundesweit auch «Radverkehr frei» für E-Scooter genügen, dann im Schritttempo. In Siegburg würden E-Scooter damit durch die ganze Fussgängerzone fahren dürfen. Der Mobilitätsausschuss hat am 9. September 2026 mit 10 zu 6 Stimmen bei einer Enthaltung beschlossen, das einzuschränken:',
        {
          list: [
            '**Markt, Holzgasse und Kaiserstrasse** zwischen Holzgasse und Ringstrasse sollen für Räder und E-Scooter nur noch von 18:30 bis 11 Uhr offen sein, an allen sieben Tagen.',
            '**Europaplatz, Neue Poststrasse, Nogenter Platz** und die übrige Kaiserstrasse sollen für Räder offen bleiben, ab 1. März 2027 dann auch für E-Scooter.',
          ],
        },
        'Die genaue Abgrenzung will der Ausschuss noch festlegen; massgeblich werden die Schilder vor Ort sein. Am Europaplatz vor dem Bahnhof zählte die Stadt sechs Unfälle in 32 Monaten mit Fussgängern, Rad- und E-Scooter-Fahrern. Das Hauptproblem sieht die Polizei laut Stadt darin, dass viele Rad- und E-Scooter-Fahrer das Schritttempo nicht einhalten.',
      ],
    },
    {
      heading: 'Bahnhof Siegburg/Bonn, Linie 66 und Busse',
      blocks: [
        'Am Bahnhof Siegburg/Bonn hält die Linie 66 unterirdisch an den Gleisen 11 und 12, die Züge der DB darüber. Zum Abstellen nimmst du eine Station, etwa am Busbahnhof oder an der Bahnhofstrasse; der Europaplatz vor dem Bahnhof gehört zur Fussgängerzone und ist Verbotszone.',
        {
          list: [
            '**Linie 66 und SWB-Busse:** Seit 1. März 2024 nimmst du keine E-Tretroller mehr in die Bahnen von SWB Bus und Bahn mit, seit 13. März 2024 auch nicht in ihre Busse. Grund ist laut SWB die Brandgefahr der Akkus; das Verbot gilt «vorerst».',
            '**RSVG-Busse:** Die RSVG gehört zum Verkehrsverbund Rhein-Sieg (VRS). Laut VRS nehmen dessen Verkehrsunternehmen seit 1. März 2024 keine E-Tretroller mehr mit, in Bussen ebenso wie in Bahnen, wegen der Brandgefahr der Akkus.',
            '**Was in NRW gilt:** Nach den Beförderungsbedingungen für den Nahverkehr in NRW (Stand 1. Januar 2026) zählt ein vollständig zusammengeklappter E-Tretroller als Handgepäck, doch jedes Verkehrsunternehmen darf ihn per Hausrecht ausschliessen, auch zusammengeklappt. Aufgeklappt fährt er in Bus und Stadtbahn gar nicht mit, im Regionalzug und in der S-Bahn nur in den gekennzeichneten Bereichen, etwa im Mehrzweckabteil.',
            '**ICE und IC:** Zusammengeklappt fährt ein E-Scooter laut DB kostenlos als Handgepäck mit; den Akku darfst du unterwegs weder herausnehmen noch laden.',
          ],
        },
        'Ein Leih-Scooter lässt sich nicht zusammenklappen. Stell ihn vorher an einer Station ab und miete am Ziel einen neuen.',
        '**Mobilitätsgarantie NRW:** Fährt dein Bus oder Zug mindestens 20 Minuten zu spät ab oder fällt er aus, darfst du auf ein Sharing-Angebot umsteigen, auch auf einen Leih-Scooter. Erstattet werden bis zu 30 € bei geplanter Abfahrt zwischen 5 und 19:59 Uhr, sonst bis zu 60 €. Den Antrag stellst du binnen 14 Tagen beim Verkehrsunternehmen der Linie, online über mobil.nrw.',
      ],
    },
    {
      heading: 'Über die Stadtgrenze: Sankt Augustin, Bonn, Troisdorf und Hennef',
      blocks: [
        'Wo eine Fahrt enden darf, legt jeder Anbieter mit seinem Gebiet fest. Prüf vor einer Fahrt über die Stadtgrenze in der App, ob dein Ziel noch darin liegt.',
        {
          list: [
            '**Sankt Augustin und Bonn:** Beide liegen in Vois Zone mit Siegburg, und auch Dott führt beide Städte unter seinen Standorten. Was dort gilt: [E-Scooter in Sankt Augustin](guide:sankt-augustin) und [E-Scooter in Bonn](guide:bonn). Wer zur Hochschule Bonn-Rhein-Sieg will: Ihr Campus Sankt Augustin liegt in der Nachbarstadt.',
            '**Troisdorf und Hennef:** Dott führt beide Städte unter seinen Standorten; wie weit du kommst, zeigt die App.',
            '**Braschoss und Schreck:** Diese beiden Ortsteile liegen laut Stadt ausserhalb des Gebiets, in dem die Anbieter Scooter aufstellen.',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Siegburg: Alter, Helm, Alkohol, Bussgelder',
      blocks: [
        'In Siegburg gelten die deutschen Regeln: Einen eigenen E-Scooter fährst du ab 14 ohne Führerschein, einen Leih-Scooter bei Dott laut AGB ab 18. Eine Helmpflicht gibt es nicht, die Stadt empfiehlt den Helm aber dringend. Auf einem Scooter fährt nur eine Person, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'unzulässig auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto. Strafbar machst du dich schon ab 0,3 Promille, wenn du durch Ausfallerscheinungen auffällst, ab 1,1 Promille in jedem Fall. Unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert: [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Was die Stadt Siegburg für Leih-Scooter regelt',
      blocks: [
        'Siegburg regelt die Leih-Scooter mit Kooperationsvereinbarungen, die die Anbieter unterschreiben mussten. Nach einem Pilotprojekt mit drei Anbietern ab Mai 2021 beschloss der Rat am 30. Oktober 2023 ein Auswahlverfahren für den Dauerbetrieb: höchstens zwei Anbieter mit je 150 Scootern, zusammen 300. Die rund 160 Dott- und 150 Voi-Scooter oben sind eine Momentaufnahme (Zählung der Karte, nicht die Flotte). Angelegt war der Dauerbetrieb auf 24 Monate, mit Option auf zwölf weitere.',
        'Zu den Pflichten, die die Stadt 2023 für die Anbieter festlegte, gehören:',
        {
          list: [
            'Falsch abgestellte Scooter werden binnen 24 Stunden umgestellt; verlangen Stadt, Polizei, Ordnungsamt oder Feuerwehr es, binnen höchstens 6 Stunden.',
            'Eine Service-Nummer ist rund um die Uhr erreichbar.',
          ],
        },
        'Gesperrt ist in den Verbotszonen nur das Beenden der Fahrt: In Fahrten einzugreifen, sei rechtlich weiterhin nicht möglich, schrieb die Stadt im Oktober 2024.',
      ],
    },
    {
      heading: 'Schon gewusst? Siegburg und die E-Scooter',
      blocks: [
        {
          list: [
            '**8 Minuten, 1,5 Kilometer.** So lang war eine Leihfahrt im Pilotprojekt im Schnitt, laut der Auswertung der Stadt von 2023 recht konstant.',
            '**40.300 Autokilometer** haben die Leih-Scooter im Pilotprojekt bis 2023 laut einer Schätzung der Stadt mindestens ersetzt.',
            '**Mehr als 85 %** der Scooter standen laut einer groben Auswertung der Stadt richtig und störten niemanden.',
            '**500 zu 271 Punkte.** TIER erreichte im Auswahlverfahren 2024 die volle Punktzahl, Voi 271. Den Ausschlag gaben laut Stadt TIERs günstigere Angebote für Arbeitgeber und ÖPNV-Kunden und dass TIER schon in Nachbarstädten fuhr.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Siegburg nutzen?',
      answer: 'Die von Dott und Voi, ohne Führerschein; Dott vermietet laut AGB ab 18. Freie Scooter zeigt auch die [Live-Karte von Siegburg](map:de:Siegburg).',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Siegburg?',
      answer: 'Bei Voi 1,80 €: kein Entsperrpreis, 0,18 € pro Minute (Stand November 2026), wie in Bonn und Sankt Augustin. Bei Dott zeigt die App den Preis vor dem Entsperren.',
    },
    {
      question: 'Wo kann ich in der Siegburger Innenstadt einen Leih-Scooter abstellen?',
      answer: 'Nur an den markierten Stationen, etwa am Busbahnhof, an der Bahnhofstrasse oder am Friedensplatz. In der Fussgängerzone und auf dem Michaelsberg endet keine Fahrt.',
    },
    {
      question: 'Darf ich mit dem E-Scooter durch die Fussgängerzone fahren?',
      answer: 'Nein, dort schiebst du, auch wenn Radfahrer durchfahren dürfen. Ab 1. März 2027 soll sich das laut Beschluss des Mobilitätsausschusses ändern: am Europaplatz und in der Neuen Poststrasse ganztägig, an Markt und Holzgasse und in der Kaiserstrasse zwischen Holzgasse und Ringstrasse nur von 18:30 bis 11 Uhr.',
    },
    {
      question: 'Darf ich einen E-Scooter in die Linie 66 mitnehmen?',
      answer: 'Nein. SWB Bus und Bahn nimmt seit März 2024 keine E-Tretroller mehr mit, weder in den Bahnen noch in den Bussen. Einen Leih-Scooter stellst du an einer Station am Bahnhof ab.',
    },
  ],
  sources: [
    { title: 'Kreisstadt Siegburg: Elektrotretroller', url: 'https://siegburg.de/stadtleben-aktuelles/unterwegs-in-siegburg/elektrotretroller/' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: Elektrotretroller, Auswahlverfahren, Vorlage 2605/VIII (13. September 2023, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=69397&type=do' },
    { title: 'Kreisstadt Siegburg, Rat: Elektrotretroller, Auswahlverfahren für den Dauerbetrieb, Vorlage 2722/VIII (30. Oktober 2023, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=70107&type=do' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: Elektrotretroller, Auswahlverfahren, Vorlage 2873/VIII (30. November 2023, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=71042&type=do' },
    { title: 'Kreisstadt Siegburg, Rat: Mitteilung über das Auswahlverfahren E-Tretroller, Vorlage 3230/VIII (13. Mai 2024, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=73744&type=do' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: E-Tretroller, Stationen und Verkehrssicherheitsaktion, Vorlage 3590/VIII (9. Oktober 2024, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=76216&type=do' },
    { title: 'Kreisstadt Siegburg: E-Tretroller-Bedienbereich mit Stationen und Verbotszone (Stand August 2024, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=76217&type=do' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: Schwerpunktkontrollen Fussgängerzone, Vorlage 3603/VIII (9. Oktober 2024, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=76262&type=do' },
    { title: 'Kreisstadt Siegburg, Haupt-, Finanz- und Beschwerdeausschuss: Verkehrsbehinderndes Abstellen von E-Rollern, Vorlage 3710/VIII (27. November 2024, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=76993&type=do' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: Stadtmobiliar, Sachstand, Vorlage 0201/IX (4. Februar 2026, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=83722&type=do' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: Fussgängerzone und neue Verordnung für E-Tretroller, Vorlage 0525/IX (17. Juni 2026, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=85795&type=do' },
    { title: 'Kreisstadt Siegburg, Mobilitätsausschuss: Fussgängerzone, Beschluss, Vorlage 0685/IX (9. September 2026, PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=87957&type=do' },
    { title: 'Kreisstadt Siegburg: Niederschrift des Mobilitätsausschusses vom 9. September 2026 (PDF)', url: 'https://sessionnet.owl-it.de/siegburg/bi/getfile.asp?id=89642&type=do' },
    { title: 'Voi: Tarif, Zonen und Stationen für Bonn, Sankt Augustin und Siegburg (NeTEx, Stand November 2026)', url: 'https://api.voiapp.io/gbfs/open/v1/279/netex.xml' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'SWB Bus und Bahn: Mitnahme von E-Tretrollern in Bahnen nicht mehr gestattet (26. Februar 2024)', url: 'https://www.swb-busundbahn.de/aktuelle-meldungen/details/mitnahme-von-e-tretrollern-in-bahnen-nicht-mehr-gestattet/' },
    { title: 'SWB Bus und Bahn: Siegburg Bahnhof bekommt neue Aufzüge (17. November 2026)', url: 'https://www.swb-busundbahn.de/aktuelle-meldungen/details/siegburg-bahnhof-bekommt-neue-aufzuege/' },
    { title: 'VRS: Mitnahmeverbot für E-Tretroller in Bussen und Bahnen (28. Februar 2024)', url: 'https://www.vrs.de/presse-medien/news/details/mitnahmeverbot-fuer-e-tretroller-in-bussen-und-bahnen' },
    { title: 'VRS: Gemeinschaftstarif, Tarifbestimmungen (gültig ab 1. Januar 2026, PDF)', url: 'https://www.vrs.de/fileadmin/01_Tickets/Downloads_und_Informationen/VRS_Gemeinschaftstarif_01012026.pdf' },
    { title: 'Beförderungsbedingungen Nahverkehr NRW (gültig ab 1. Januar 2026, PDF)', url: 'https://www.westfalentarif.de/fileadmin/documents/Tarifbestimmungen_und_Bef%C3%B6rderungsbedingungen_Preise/BB_Nahverkehr_NRW_zum_01.01.2026.pdf' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'mobil.nrw: Mobilitätsgarantie NRW', url: 'https://www.mobil.nrw/fahren/mobigarantie.html' },
    { title: 'Gesetze im Internet: Elektrokleinstfahrzeuge-Verordnung (eKFV)', url: 'https://www.gesetze-im-internet.de/ekfv/BJNR075610019.html' },
    { title: 'Gesetze im Internet: Bussgeldkatalog-Verordnung, Anlage', url: 'https://www.gesetze-im-internet.de/bkatv_2013/anlage.html' },
    { title: 'Kraftfahrt-Bundesamt: Tatbestandskatalog (Stand 8. Oktober 2026)', url: 'https://www.kba.de/DE/Themen/ZentraleRegister/FAER/BT_KAT_OWI/btkat_node.html' },
  ],
};

export default guide;
