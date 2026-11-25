import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-germering',
  topic: 'germering',
  name: 'E-Scooter Germering: Dott, Lime, S-Bahn, Abstellen',
  title: 'E-Scooter Germering 2026: Dott, Lime, Preise, Regeln',
  description: 'E-Scooter in Germering leihen bei Lime oder Dott: Zehn Minuten Dott kosten 2,99 €. Wo du abstellst und was am Kleinen Stachus und in S-Bahn und Bus gilt.',
  headline: 'E-Scooter Germering: Anbieter, Preise, Abstellen am Kleinen Stachus und an den S-Bahnhöfen und was in S-Bahn und Bus gilt',
  lede: 'Einen E-Scooter in Germering leihst du ohne Führerschein bei Lime oder Dott, laut MVV ab 18. Zehn Minuten kosten bei Dott 2,99 € (Stand 25. November 2026), bei Lime zeigt die App den Preis. Rund um den Kleinen Stachus, vor der Stadthalle und in einigen Parks endet keine Fahrt, mit Lime auch nicht an den beiden S-Bahnhöfen. Leih-Scooter dürfen weder in die S-Bahn noch in den Bus.',
  published: '2026-11-24',
  updated: '2026-11-24',
  city: 'de:Germering',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Germering?',
      blocks: [
        'In Germering vermieten **Lime** und **Dott**, das früher TIER hiess, E-Scooter; beide nennt die Stadt auf ihrer Seite zu den E-Scootern. Gemietet wird in der App des Anbieters, ohne Führerschein und laut MVV ab 18. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Mittwoch, 25. November 2026, um 7:27 Uhr zeigte die [Karte von Germering](map:de:Germering) im Stadtgebiet nur zwei Dott-Scooter, die zu diesem Zeitpunkt frei waren, dazu Scooter von Lime. Die meisten anderen Dott-Scooter der Umgebung standen jenseits der Stadtgrenze in Freiham und Aubing, wo auch Voi und Bolt vermieten; was das für Fahrten über die Stadtgrenze heisst, steht weiter unten.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Germering?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Germering im Standardtarif (Stand 25. November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', '0,49 €', '0,25 €', '2,99 €', '5,49 €'],
              ['Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine halbe Stunde mit Dott kostet 7,99 €. Bei Lime zeigt die App den Preis. Verbindlich ist bei beiden der Preis, den die App vor dem Entsperren anzeigt.',
      ],
    },
    {
      heading: 'E-Scooter in Germering abstellen: Gehweg, Haltestellen, Verbotszonen',
      blocks: [
        'Du beendest die Fahrt am Strassenrand, wo die App es erlaubt. Worauf du dabei achtest, steht auf der Seite der Stadt:',
        {
          list: [
            '**Gehweg, Radweg, Eingänge:** Sie bleiben frei.',
            '**Niemand wird behindert:** weder Fussgänger noch Menschen im Rollstuhl, mit Kinderwagen oder eingeschränkter Mobilität.',
            '**Nicht an sensiblen Orten:** An Bushaltestellen, Kreuzungen und Zebrastreifen, vor Feuerwehrzufahrten und vor öffentlichen Einrichtungen stellst du nicht ab.',
            '**Standsicher:** möglichst am Rand des Gehwegs oder auf einer freien Fläche.',
          ],
        },
        '**Verbotszonen** (Stand 25. November 2026): Weder bei Dott noch bei Lime endet eine Fahrt rund um den Kleinen Stachus, auf dem Platz vor der Stadthalle, am Friedhof St. Martin, im Erikapark, im Pappelpark und am Hallenbad. Lime sperrt ausserdem das Umfeld der beiden S-Bahnhöfe, den Waldfriedhof, den Golfplatz und eine Reihe kleiner Flächen vor einzelnen Adressen. Die App zeigt dir die Zonen.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Verbotszone oder ausserhalb des Gebiets, und die Miete läuft weiter. Fahr ein Stück weiter, bis die App das Abstellen erlaubt.',
        },
        'Teuer wird Falschparken: Dott kann laut seinen Bedingungen (23. September 2025) bis zu 300 € für die Rückholung verlangen, wenn du Park- und Sperranweisungen nicht befolgst. Steht dir ein Leih-Scooter im Weg, melde ihn dem Anbieter; Ansprechpartner bei der Stadt ist der Mobilitätsbeauftragte im Stadtbauamt, Telefon (089) 89 419-411.',
      ],
    },
    {
      heading: 'Wo darf man in Germering mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder der Fahrradstrasse und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu, auch mit ausgeschaltetem Motor; schieben darfst du. Für E-Scooter öffnet ein Zusatzzeichen für Radfahrer eine Fussgängerzone heute nicht, nur «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 wird bundesweit auch «Radverkehr frei» genügen, dann im Schritttempo.',
        'Dotts Gebiet umfasst die Stadtmitte mit beiden S-Bahnhöfen, dem Kleinen Stachus, der Stadthalle und dem Rathaus. Der Germeringer See, das Wellenfreibad mit dem Polarium und der Waldfriedhof liegen ausserhalb (Stand 25. November 2026): Dort endet keine Dott-Fahrt. Lime hat für Germering ein eigenes Gebiet, das die Stadtmitte ebenfalls abdeckt; wo es am Stadtrand endet, zeigt dir die App.',
      ],
    },
    {
      heading: 'Kleiner Stachus und Stadthalle: E-Scooter in der Stadtmitte',
      blocks: [
        'Am **Kleinen Stachus** mit seinen Bushaltestellen, ein paar Schritte südlich des S-Bahnhofs Germering-Unterpfaffenhofen, und auf dem Platz vor der **Stadthalle** beendest du weder bei Dott noch bei Lime eine Fahrt. Stell den Scooter vorher in einer Seitenstrasse ab, wo die App es erlaubt und der Gehweg frei bleibt, und geh das letzte Stück zu Fuss.',
      ],
    },
    {
      heading: 'S-Bahnhöfe Harthaus und Germering-Unterpfaffenhofen',
      blocks: [
        'Germering hat zwei S-Bahnhöfe: **Harthaus** im Osten und **Germering-Unterpfaffenhofen** in der Mitte. Beide liegen an der S8 zwischen Herrsching und dem Flughafen München. In den Hauptverkehrszeiten an Werktagen kommt die S5 dazu, und es fährt alle zehn Minuten eine S-Bahn, sonst alle 20 Minuten. An beiden Bahnhöfen gibt es P+R-Plätze und Fahrradabstellanlagen.',
        'Eine **Dott**-Fahrt darfst du am Bahnhof beenden, wenn Gehweg und Zugänge frei bleiben. **Lime** sperrt das Umfeld beider Bahnhöfe: Dort endet keine Lime-Fahrt (Stand 25. November 2026).',
        'In Germering-Unterpfaffenhofen ist der Aufzug zu den Bahnsteigen laut der Seite der Stadt defekt. Die Buslinie 857 hält deshalb seit 1. September 2026 zusätzlich an «Germering (S) West», näher am barrierefreien Zugang.',
      ],
    },
    {
      heading: 'E-Scooter in S-Bahn und Bus: was MVV und MVG erlauben',
      blocks: [
        {
          list: [
            '**Leih-Scooter:** Modelle von Dott, Lime, Voi oder Bolt dürfen laut MVV in kein Verkehrsmittel mit. Beende die Fahrt vor dem Bahnhof und miete am Ziel neu.',
            '**Eigener Scooter in S-Bahn, Regionalzug und Regionalbus:** Zusammengeklappt fährt er laut MVV kostenlos mit, wenn er höchstens 90 × 80 cm misst, höchstens 25 kg wiegt und der Akku fest verbaut oder sicher eingerastet ist (Stand April 2024). Im Bahnhof und an der Haltestelle trägst du ihn zusammengeklappt; schieben reicht nicht.',
            '**Busse in Germering:** Die Stadt nennt zwölf Linien: 157, X208, 260, X850, 851 bis 853 und 856 bis 860. Die 157 fährt die MVG, und in allen Fahrzeugen der MVG ist jeder E-Tretroller verboten, egal welches Modell. Für die übrigen Linien gelten die Regeln für den Regionalbus.',
          ],
        },
      ],
    },
    {
      heading: 'Über die Stadtgrenze: Freiham, Aubing, Puchheim und Gilching',
      blocks: [
        'Wo deine Fahrt enden darf, legt jeder Anbieter mit seinem Gebiet fest. Prüf vor einer Fahrt über die Stadtgrenze in der App, ob dein Ziel darin liegt.',
        {
          list: [
            '**Freiham, Neuaubing und Aubing:** Dotts Gebiet reicht über die Stadtgrenze bis nach Freiham, Neuaubing und Aubing; der Übergang ist schmal, prüf ihn in der App (Stand 25. November 2026). Ob du mit Lime aus Germering nach Freiham kommst, zeigt ebenfalls die App. In München gelten Münchens Regeln: [E-Scooter in München](guide:munich).',
            '**Voi und Bolt:** Beide haben Scooter in Freiham und Aubing. Germering gehört nicht zu Vois Gebiet, eine Voi-Fahrt endet also vor der Stadtgrenze (Stand 25. November 2026). Wie weit Bolts Gebiet nach Westen reicht, zeigt die App.',
            '**Puchheim:** Dotts Gebiet reicht im Norden nach Puchheim hinein (Stand 25. November 2026). Puchheim hat die Selbstverpflichtung der Anbieter mit Germering ausgehandelt, siehe unten.',
            '**Geisenbrunn und Gilching:** Im Westen endet Dotts Gebiet vor Geisenbrunn, Gilching liegt ausserhalb. Wo Limes Gebiet endet, zeigt die App.',
          ],
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Germering: Alter, Helm, Alkohol, Bussgelder',
      blocks: [
        'In Germering gelten die deutschen Regeln: Einen eigenen E-Scooter fährst du ab 14 ohne Führerschein, einen Leih-Scooter von Dott oder Lime laut MVV ab 18. Eine Helmpflicht gibt es nicht; der MVV empfiehlt einen Helm. Auf einem Scooter fährt nur eine Person, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'Was die Stadt Germering für Leih-Scooter regelt',
      blocks: [
        'Eine Genehmigung brauchen die Anbieter laut Stadt nicht: Sie dürfen ihre Scooter grundsätzlich ohne Zustimmung der Stadt im öffentlichen Raum aufstellen. Germering, Fürstenfeldbruck, Puchheim und Olching haben deshalb, angeführt vom Landratsamt Fürstenfeldbruck, mit den Anbietern eine gemeinsame, freiwillige Selbstverpflichtungserklärung ausgehandelt. Sie ist laut Stadt derzeit der einzige Weg, den Betrieb zu steuern. Darin sind das Geschäftsgebiet, die Parkverbotszonen, Aufstellflächen und die Zahl der Scooter je Anbieter festgelegt.',
        'Als die Erklärung 2023 angepasst wurde, blieb es in Germering laut einer Vorlage für den Umwelt- und Stadtentwicklungsausschuss (März 2023) bei 40 Scootern je Anbieter. Die Anbieter wollten der Stadt damals ein Dashboard mit Zahl und Standort ihrer Scooter bereitstellen und eine direkte Kontaktstelle für Stadt, Ordnungsamt und Polizei einrichten. Kunden, die falsch abstellen, sollten sie mit Geldstrafen belegen und bei wiederholtem Fehlverhalten sperren.',
      ],
    },
    {
      heading: 'Was in Germering geplant ist: Abstellflächen an den S-Bahnhöfen',
      blocks: [
        'Die CSU-Fraktion beantragte im Juni 2026 ein Abstellkonzept mit markierten Sammelflächen für E-Scooter. Am 23. Juli 2026 beschloss der Umwelt- und Stadtentwicklungsausschuss einstimmig, dass die Verwaltung den Antrag weiter bearbeitet. Für seine Sitzung am 8. Oktober 2026 schlug sie drei erste Flächen vor:',
        {
          list: [
            'am P+R-Platz am Bahnhof **Harthaus**, bei den Fahrradabstellanlagen',
            'am Bahnhof **Germering-Unterpfaffenhofen**',
            'an der **Münchener Strasse**, Ecke Birnbaumsteig',
          ],
        },
        'Die Flächen sollen eine Bodenmarkierung, ein E-Scooter-Piktogramm und ein Schild bekommen und in den Apps der Anbieter hinterlegt werden. Im Umkreis von 100 m um jede Fläche soll eine Fahrt dann nur noch auf der Fläche selbst enden können. Eine Fläche an der Unteren Bahnhofstrasse und eine am Freibad in der Bertha-von-Suttner-Strasse sind für später vorgemerkt. Bis die Flächen in der App stehen, gelten die heutigen Verbotszonen.',
      ],
    },
    {
      heading: 'Schon gewusst? Germering und die E-Scooter',
      blocks: [
        {
          list: [
            '**Bird kam zuerst.** Am 24. Juni 2021 stellte Bird die ersten Leih-Scooter in Germering auf. Die Firma hat sich inzwischen zurückgezogen; heute vermieten Lime und Dott.',
            '**40 Scooter zum Start.** Lime brachte ab 15. Juni 2022 je 40 Scooter nach Germering und Fürstenfeldbruck und trat als zweiter Anbieter der gemeinsamen Selbstverpflichtung bei. In Fürstenfeldbruck gab es damals schon zehn markierte und beschilderte Abstellflächen.',
            '**Ausgezeichnet fürs Rad.** 2025 wurde Germering nach den Kriterien der AGFK als «Fahrradfreundliche Kommune» ausgezeichnet. Für die nächste Zertifizierung plant die Stadt 14 Mobilitätsstationen mit Leihrädern.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Germering nutzen?',
      answer: 'Die von Lime und Dott, ohne Führerschein und laut MVV ab 18. Freie Scooter zeigt auch die [Live-Karte von Germering](map:de:Germering).',
    },
    {
      question: 'Was kosten zehn Minuten E-Scooter in Germering?',
      answer: 'Bei Dott 2,99 €: 0,49 € zum Entsperren plus 0,25 € pro Minute (Stand 25. November 2026). Bei Lime zeigt die App den Preis vor dem Entsperren.',
    },
    {
      question: 'Darf ich den Leih-Scooter am S-Bahnhof abstellen?',
      answer: 'Mit Dott ja, wenn Gehweg und Zugänge frei bleiben. Lime sperrt das Umfeld der Bahnhöfe Harthaus und Germering-Unterpfaffenhofen; dort endet keine Lime-Fahrt (Stand 25. November 2026). An beiden Bahnhöfen plant die Stadt markierte Abstellflächen.',
    },
    {
      question: 'Darf ich einen E-Scooter in die S-Bahn mitnehmen?',
      answer: 'Einen Leih-Scooter nie. Deinen eigenen nimmst du zusammengeklappt kostenlos in S-Bahn, Regionalzug und Regionalbus mit, wenn er höchstens 90 × 80 cm misst und 25 kg wiegt. In die Busse der MVG, in Germering die Linie 157, darf kein E-Tretroller.',
    },
    {
      question: 'Komme ich mit dem Leih-Scooter von Germering nach Freiham?',
      answer: 'Mit Dott ja: Sein Gebiet reicht über die Stadtgrenze bis Freiham, Neuaubing und Aubing (Stand 25. November 2026). Bei Lime prüfst du in der App, ob dein Ziel im Gebiet liegt. Eine Voi-Fahrt aus Freiham endet vor der Stadtgrenze.',
    },
  ],
  sources: [
    { title: 'Stadt Germering: Einführung von E-Scootern in der Stadt Germering', url: 'https://www.germering.de/germering/site.nsf/id/pa_escooter.html' },
    { title: 'Stadt Germering: Hinweis zum ordnungsgemässen Abstellen von E-Scootern', url: 'https://www.germering.de/germering/site.nsf/id/li_abstellen_escooter.html' },
    { title: 'Stadt Germering, Umwelt- und Stadtentwicklungsausschuss: E-Scooter in Germering, freiwillige Selbstverpflichtungserklärung, Vorlage 2023/0077 (28. März 2023, PDF)', url: 'https://buergerinfo-germering.digitalfabrix.de/getfile.asp?id=53817&type=do' },
    { title: 'CSU-Fraktion im Stadtrat Germering: Antrag auf ein Abstellkonzept für E-Scooter (26. Juni 2026, PDF)', url: 'https://buergerinfo-germering.digitalfabrix.de/getfile.asp?id=65209&type=do' },
    { title: 'Stadt Germering: Niederschrift des Umwelt- und Stadtentwicklungsausschusses vom 23. Juli 2026 (PDF)', url: 'https://buergerinfo-germering.digitalfabrix.de/getfile.asp?id=65636&type=do' },
    { title: 'Stadt Germering, Umwelt- und Stadtentwicklungsausschuss: Abstellkonzept für E-Scooter, Vorlage 2026/0307 (8. Oktober 2026, PDF)', url: 'https://buergerinfo-germering.digitalfabrix.de/getfile.asp?id=65677&type=do' },
    { title: 'Stadt Germering: Abstellflächen für E-Scooter, Standortübersicht zur Vorlage 2026/0307 (PDF)', url: 'https://buergerinfo-germering.digitalfabrix.de/getfile.asp?id=65681&type=do' },
    { title: 'Landratsamt Fürstenfeldbruck: E-Scooter in Germering und Fürstenfeldbruck, neuer Anbieter tritt der Selbstverpflichtungserklärung bei (10. Juni 2022)', url: 'https://www.lra-ffb.de/aktuelles/aktuelles/e-scooter-in-germering-und-fuerstenfeldbruck-auch-neuer-anbieter-schliesst-sich-selbstverpflichtungserklaerung-fuer-leihangebote-im-landkreis-an' },
    { title: 'Stadt Germering: Öffentlicher Nahverkehr (ÖPNV)', url: 'https://www.germering.de/germering/site.nsf/id/pa_isssda5dsg.html' },
    { title: 'Stadt Germering: Buslinie 857, neue Haltestelle Germering (S) West', url: 'https://www.germering.de/germering/site.nsf/id/li_bushaltestelle857.html' },
    { title: 'Stadt Germering: Radfahren in Germering', url: 'https://www.germering.de/germering/site.nsf/id/pa_de_radfahren.html' },
    { title: 'Bayerisches Staatsministerium für Wohnen, Bau und Verkehr: Neustart der S5 und Teilung der S7 (24. April 2024)', url: 'https://stmb.bayern.de/med/pressemitteilungen/pressearchiv/2024/47/index.php' },
    { title: 'MVV: Scootersharing und Mitnahme von E-Tretrollern in Bus und Bahn', url: 'https://www.mvv-muenchen.de/vernetzte-mobilitaet/shared-mobility/scootersharing/' },
    { title: 'Dott: offener Datenfeed für München und Germering mit Tarif und Zonen (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/munich/gbfs.json' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Lime: Zonen für München und Germering', url: 'https://assets.lime.bike/zones_attributes/Munich_9229_exclude_new_type.json' },
    { title: 'Voi: Zonen für München in den offenen Daten (NeTEx, Stand 25. November 2026)', url: 'https://api.voiapp.io/gbfs/open/v1/150/netex.xml' },
    { title: 'Gesetze im Internet: Elektrokleinstfahrzeuge-Verordnung (eKFV)', url: 'https://www.gesetze-im-internet.de/ekfv/BJNR075610019.html' },
    { title: 'Gesetze im Internet: Bussgeldkatalog-Verordnung, Anlage', url: 'https://www.gesetze-im-internet.de/bkatv_2013/anlage.html' },
    { title: 'Kraftfahrt-Bundesamt: Tatbestandskatalog (Stand 8. Oktober 2026)', url: 'https://www.kba.de/DE/Themen/ZentraleRegister/FAER/BT_KAT_OWI/btkat_node.html' },
  ],
};

export default guide;
