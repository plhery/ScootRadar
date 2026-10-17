import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-kaiserslautern',
  topic: 'kaiserslautern',
  name: 'E-Scooter Kaiserslautern: Anbieter, Preise, Parken',
  title: 'E-Scooter Kaiserslautern 2026: Dott, Preise, Parken, Betze',
  description: 'E-Scooter Kaiserslautern: nur Dott, was zehn Minuten kosten, wo du parkst, was an FCK-Spieltagen gilt und warum der Leih-Scooter nicht in den Bus darf.',
  headline: 'E-Scooter Kaiserslautern: Dott, Preise, Verbotszonen, der Betzenberg und was in Bus und Bahn gilt',
  lede: 'Einen E-Scooter in Kaiserslautern leihst du ab 18 und ohne Führerschein bei Dott, dem einzigen Anbieter, den die Stadt nennt (Stand 17. Oktober 2026). Zehn Minuten kosten 5 €: 1 € fürs Entsperren und 0,40 € pro Minute. In der Fussgängerzone und in Parks darfst du laut Stadt nicht abstellen; rund um Hauptbahnhof und Fritz-Walter-Stadion endet eine Dott-Fahrt nur auf Dotts Abstellzonen. In den Bus darf der Leih-Scooter nicht. Ramstein und Landstuhl liegen ausserhalb von Dotts Gebiet.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'de:Kaiserslautern',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Kaiserslautern?',
      blocks: [
        'Im Oktober 2026 vermietet in Kaiserslautern nur **Dott** E-Scooter: Auf ihrer E-Scooter-Seite nennt die Stadt Dott als einzigen Anbieter. TIER heisst heute Dott; TIER fuhr seit Januar 2020 in der Stadt. **Bolt**, **Lime** und **Zeus** führen Kaiserslautern nicht auf ihren Städtelisten, und **Voi** hat für Kaiserslautern keine Seite (Stand 17. Oktober 2026). Früher fuhren laut Stadt zeitweise auch Zeus, Lime und Bird.',
        'Gemietet wird in der Dott-App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Dott veröffentlicht für Kaiserslautern einen offenen Datenfeed. Darum zeigt die [Karte von Kaiserslautern](map:de:Kaiserslautern) die freien Dott-Scooter der Stadt: am 17. Oktober 2026 gegen 19:25 Uhr rund 720. Das ist der Stand eines Abends, keine Flottengrösse. Einen zweiten Anbieter nennt die Stadt nicht, also fehlt auf der Karte auch keiner.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Kaiserslautern?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Kaiserslautern (Datenfeed von Dott, Stand 17. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', '1,00 €', '0,40 €', '5,00 €', '9,00 €'],
            ],
          },
        },
        'Eine halbe Stunde kostet damit 13 €. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Für längere Wege ist **VRNnextbike** günstiger, das Leihrad im Verkehrsverbund Rhein-Neckar (VRN). Es fährt seit Juni 2017 in Kaiserslautern, laut Stadt an 24 Stationen in der Innenstadt, etwa am Hauptbahnhof, an der Uni und am Volkspark. Es kostet 1 € pro 15 Minuten, höchstens 12 € in 24 Stunden. Im Monats-Abo für 10 € sind die ersten 30 Minuten jeder Fahrt inklusive. Das Rad gibst du an einer Station zurück, sonst kostet es 20 € Servicegebühr (Stand Oktober 2026). Laut Wochenblatt (31. August 2026) heisst das System ab März 2027 VRNrad, und die Flotte in Kaiserslautern soll dann fast doppelt so gross sein, mit mehr als 70 Pedelecs.',
      ],
    },
    {
      heading: 'E-Scooter in Kaiserslautern parken: Abstellzonen und Verbotszonen',
      blocks: [
        'Seit 1. Januar 2024 ist das Verleihen von E-Scootern in Kaiserslautern eine Sondernutzung der Strasse; die Satzung dazu beschloss der Stadtrat am 13. November 2023. Jeder Anbieter braucht eine Erlaubnis der Stadt. Darin stehen Mindeststandards und die Zonen, in denen du nicht parken darfst. Laut Satzung zahlt der Anbieter 4 € pro Scooter und Monat.',
        'In der Innenstadt stellst du den Leih-Scooter laut Stadt nur auf markierten Flächen ab, sobald die Stadt dort welche ausweist. Ausserhalb der Innenstadt stellst du ihn frei ab. Dotts Datenfeed zeigt 30 Abstellzonen, unter anderem am Hauptbahnhof, im Stadtpark, an der Maxstrasse, am Willy-Brandt-Platz, an der Neuen Stadtmitte und am Davenportplatz an der Uni (Stand 17. Oktober 2026).',
        'Als Parkverbotszonen nennt die Stadt Parks und Grünanlagen wie Stadtpark und Volkspark, die Fussgängerzone und das Umfeld von Kaiserpfalz und Fruchthalle. Dotts Feed zählt 56 Parkverbotszonen, darunter:',
        {
          list: [
            'den Stadtkern um Marktstrasse, Fackelstrasse, Schillerplatz, Rathaus und Pfalzgalerie, mit dem Japanischen Garten;',
            'den Bereich vom Hauptbahnhof bis zum Fritz-Walter-Stadion;',
            'Stadtpark, Volkspark, Kennedyplatz und Messeplatz;',
            'den Hauptfriedhof, den Jüdischen Friedhof, das Pfaff-Quartier und einen Teil der Gartenschau;',
            'den Uni-Sportplatz und den Davenportplatz an der RPTU.',
          ],
        },
        'In manchen dieser Zonen hat Dott eine Abstellzone, etwa am Bahnhof, im Stadtpark, am Messeplatz und am Davenportplatz. Nur dort endet dann die Fahrt.',
        {
          note: 'Dotts Parkverbotszonen sperren das Abstellen: Die App lässt dich dort die Fahrt nicht beenden, und die Miete läuft weiter. Fahr zur nächsten Abstellzone, die die App zeigt.',
        },
        'Auch wo du frei abstellst, gelten die Regeln der Stadt: Lass auf dem Gehweg mindestens 1,60 m frei. Stell den Scooter nie auf den Radweg, nie in eine Busbucht und nicht näher als 10 m an den Wartebereich einer Haltestelle. Halte Ein- und Ausfahrten, Rettungswege, abgesenkte Bordsteine, Blindenleitsysteme und Fussgängerüberwege frei. Öffentliche Fahrradständer darfst du nicht nutzen, und die Stationen von VRNnextbike und Call a Bike darfst du nicht behindern.',
        'Einen falsch geparkten Scooter meldest du laut Stadt direkt bei Dott: Telefon +49 30 46690493 oder kaiserslautern@ridedott.com.',
      ],
    },
    {
      heading: 'Wo darf man in Kaiserslautern mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem gemeinsamen Geh- und Radweg, dem Radfahr- oder Schutzstreifen oder in der Fahrradstrasse. Nur wo es nichts davon gibt, fährst du auf der Fahrbahn. Auf dem Gehweg fährst du nicht, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es.',
        '**Fussgängerzone:** In den Fussgängerzonen der Innenstadt dürfen E-Scooter laut Stadt weiterhin nicht fahren. Dort steigst du ab und schiebst.',
        '**Ab 1. März 2027** gilt das Zusatzschild «Radverkehr frei» auch für E-Scooter, etwa auf Gehwegen und in Fussgängerzonen; dort fährst du dann im Schritttempo. Auf ihrer Website nennt die Stadt dafür einen anderen Tag, den 1. April 2026. Die Fussgängerzonen und manche für Räder freigegebene Gehwege will die Stadt aber mit dem Schild «Verbot für Elektrokleinstfahrzeuge» für E-Scooter sperren.',
        '**Nachts:** Eine nächtliche Sperrzeit nennen weder die Stadt noch Dotts Datenfeed.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Kaiserslautern: Bussgelder und Promille',
      blocks: [
        'In Kaiserslautern gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Ein eigener Scooter braucht eine Versicherungsplakette.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch nicht offiziell erläutert'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, bei unsicherem Fahren schon ab 0,3, und der Führerschein ist dann in der Regel weg. Unter 21 oder in der Probezeit gilt 0,0.',
        '**Für Angehörige der US-Streitkräfte** kommt mehr dazu. Laut der Zeitung Kaiserslautern American (Mai 2022) setzt die US Army Europe and Africa den US-Forces-Führerschein für 90 Tage aus, wenn du mit mehr Alkohol als erlaubt E-Scooter fährst. Ab 0,8 Promille wird er entzogen, und Soldaten droht ein Verfahren nach dem Militärstrafrecht (UCMJ). Was heute gilt, sagt dir deine Einheit.',
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'Mit dem E-Scooter auf den Betzenberg: FCK-Heimspiele',
      blocks: [
        'In Dotts App liegen Hauptbahnhof und Fritz-Walter-Stadion in einer gemeinsamen Parkverbotszone. Dort endet die Fahrt nur auf Dotts Abstellzonen: am Bahnhof «Parkplatz HBF», «HBF Parkplatz 2» und «Mobility HUB», am Stadion drei Zonen mit «Betze» im Namen (Stand 17. Oktober 2026).',
        'An Heimspieltagen des 1. FC Kaiserslautern gibt es laut Stadt zwischen Bahnhof und Stadion zusätzlich vorübergehende Abstellverbotszonen. Plane Zeit für das letzte Stück zu Fuss ein.',
        'Oft bequemer ist der Bus: Deine FCK-Eintrittskarte gilt am Spieltag als Fahrschein im ganzen VRN. Die Shuttlebusse der SWK zum Stadion sind kostenlos und fahren ab 2,5 Stunden vor Anpfiff alle fünf bis zehn Minuten. Sie starten an der Kantstrasse (KL-Ost) und am Parkplatz Bremerstrasse/Dunkeltälchen; auf der Uni-Route halten sie laut SWK künftig an Uni Zentral, Uni Süd und Uni West. Der letzte Bus zum Stadion fährt bei Anpfiff, der letzte zurück 1,5 Stunden nach Spielende.',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: SWK, VRN und Deutsche Bahn',
      blocks: [
        'Die Busse der SWK fahren im Tarif des VRN, und es gelten dessen Beförderungsbedingungen. Danach darf ein E-Scooter in Bus und Bahn des Verbunds nur zusammengeklappt mit, wenn er weniger als 15 kg wiegt, kürzer als 115 cm ist und Räder von höchstens 9 Zoll hat. Dann zählt er als Handgepäck und fährt laut VRN kostenlos mit. Laden darfst du ihn unterwegs nicht.',
        '**Leih-Scooter** dürfen nicht mit: Ein Dott-Scooter wiegt laut VRN 23 kg und lässt sich nicht klappen. Beende die Fahrt also vor der Haltestelle, mindestens 10 m vom Wartebereich entfernt, und miete am Ziel einen neuen.',
        '**Im ICE und IC** nimmst du einen eigenen Scooter laut Deutscher Bahn zusammengeklappt kostenlos als Handgepäck mit. Lässt er sich nicht klappen, darf er nur mit, wenn du ihn sicher unterbringst, etwa im Gepäckregal. Den Akku darfst du unterwegs weder herausnehmen noch laden. Für die Weiterfahrt in Mannheim: [E-Scooter in Mannheim](guide:mannheim).',
        '**Nachts** fahren die SWK-Nachtbusse in den Nächten auf Samstag und Sonntag um 0:15, 1:15 und 2:15 Uhr in alle Stadtteile und die meisten Umlandgemeinden, in der Stadt für 3 €.',
      ],
    },
    {
      heading: 'Ramstein, Landstuhl, Vogelweh: Wo Dott fährt und wo nicht',
      blocks: [
        'Dotts Gebiet reicht laut Datenfeed im Westen bis Einsiedlerhof, im Norden bis Erlenbach und Morlautern und im Süden bis Hohenecken. **Landstuhl** mit dem Landstuhl Regional Medical Center, **Ramstein-Miesenbach** und die Ramstein Air Base liegen ausserhalb, ebenso **Enkenbach-Alsenborn**, Otterbach, Weilerbach und Siegelbach mit dem Zoo. Dort kannst du keine Dott-Fahrt beenden.',
        'In Kaiserslautern selbst sind die US-Standorte Vogelweh, Kapaun, Pulaski, Daenner und Kleber in Dotts App Parkverbotszonen. Am Wochenende kommst du nachts mit der Nachtlinie N1 bis Einsiedlerhof und Kindsbach, mit der Linie 10 nach Enkenbach-Alsenborn.',
        'Die nächsten Leih-Scooter auf unserer Karte stehen in [Neustadt an der Weinstrasse](map:de:Neustadt an der Weinstraße), bei Zeus.',
        'Fragen zu Ämtern und Alltag beantwortet das Deutsch-Amerikanische Bürgerbüro (German-American Community Office, GACO) in der Lauterstrasse 2, auf Deutsch und Englisch.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Kaiserslautern',
      blocks: [
        {
          list: [
            '**Die 30. Stadt:** TIER startete am 15. Januar 2020 in Kaiserslautern, als 30. Stadt in Deutschland, mit rund 200 Scootern. Die Minute kostete damals 15 Cent, heute bei Dott 40 Cent.',
            '**Amerika in der Pfalz:** Die Kaiserslautern Military Community (KMC) ist laut ihrem Kommandeur die grösste Gemeinschaft von Amerikanern ausserhalb der kontinentalen USA. Stadt und KMC eröffneten im Februar 2003 gemeinsam das Bürgerbüro GACO.',
            '**Ein Garten im Steinbruch:** Wo heute der Japanische Garten liegt, in Dotts App eine Parkverbotszone, wurde bis etwa 1870 Buntsandstein abgebaut. Ab etwa 1880 entstand dort der Villenpark «Am Abendsberg», den Garten gibt es seit 2000.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Kaiserslautern?',
      answer: 'Die von Dott, dem einzigen Anbieter, den die Stadt nennt (Stand Oktober 2026); TIER heisst heute Dott. Du musst 18 sein, einen Führerschein brauchst du nicht. Alle freien Dott-Scooter zeigt auch die [Live-Karte von Kaiserslautern](map:de:Kaiserslautern).',
    },
    {
      question: 'Was kostet ein E-Scooter in Kaiserslautern?',
      answer: '1 € fürs Entsperren und 0,40 € pro Minute, zehn Minuten also 5 € und zwanzig Minuten 9 € (Dott, Stand 17. Oktober 2026).',
    },
    {
      question: 'Darf ich durch die Fussgängerzone fahren?',
      answer: 'Nein. In den Fussgängerzonen der Innenstadt dürfen E-Scooter laut Stadt nicht fahren, und daran will sie auch ab März 2027 nichts ändern. Steig ab und schieb; abstellen darfst du dort auch nicht.',
    },
    {
      question: 'Kann ich mit dem E-Scooter zum Fritz-Walter-Stadion fahren?',
      answer: 'Ja, aber dort beendest du die Fahrt nur auf Dotts Abstellzonen «Betze», und an Heimspieltagen gibt es laut Stadt zwischen Bahnhof und Stadion zusätzlich Abstellverbotszonen. Einfacher: Deine FCK-Karte gilt am Spieltag im ganzen VRN, und die SWK-Shuttles zum Stadion sind kostenlos.',
    },
    {
      question: 'Darf ich einen E-Scooter im Bus mitnehmen?',
      answer: 'Nur einen eigenen, zusammengeklappten Scooter unter 15 kg, kürzer als 115 cm und mit Rädern bis 9 Zoll. Ein Dott-Scooter wiegt laut VRN 23 kg und lässt sich nicht klappen: Er bleibt draussen.',
    },
    {
      question: 'Gibt es E-Scooter in Ramstein oder Landstuhl?',
      answer: 'Nein, Stand Oktober 2026. Dotts Gebiet endet im Westen bei Einsiedlerhof. Ramstein-Miesenbach, die Air Base und Landstuhl liegen ausserhalb, und Bolt, Lime und Zeus führen sie nicht.',
    },
  ],
  sources: [
    { title: 'Stadt Kaiserslautern: Elektro-Tretroller / E-Scooter', url: 'https://www.kaiserslautern.de/sozial_leben_wohnen/verkehr_parken/e_tretroller/index.html.de' },
    { title: 'Stadt Kaiserslautern: Sondernutzungssatzung, gültig ab 1. Januar 2024 (PDF)', url: 'https://www.kaiserslautern.de/mb/themen/stadtverwaltung/ortsrecht/6_9_sondernutzungssatzung_ab_01.01.2024.pdf' },
    { title: 'Pressestelle der Stadt Kaiserslautern: Neue Regeln für E-Scooter (Wochenblatt, 15. November 2023)', url: 'https://www.wochenblatt-reporter.de/kaiserslautern/c-lokales/sondernutzungssatzung-erlaubt-gebuehren_a510762' },
    { title: 'Verordnung zur Änderung der eKFV, BGBl. 2026 I Nr. 32', url: 'https://recht.bund.de/bgbl/1/2026/32/VO.html' },
    { title: 'Bundesministerium für Verkehr: FAQ zur Novelle der Elektrokleinstfahrzeuge-Verordnung', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq-novelle.html' },
    { title: 'Stadt Kaiserslautern: Fahrradverleih', url: 'https://www.kaiserslautern.de/sozial_leben_wohnen/verkehr_parken/radverkehr/verleih/index.html.de' },
    { title: 'Dott: offener Datenfeed für Kaiserslautern (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/kaiserslautern/gbfs.json' },
    { title: 'Dott: Standorte', url: 'https://ridedott.com/de/locations' },
    { title: 'Bolt: Städte', url: 'https://bolt.eu/de-de/cities/' },
    { title: 'Zeus: Städte', url: 'https://zeusscooters.com/cities/' },
    { title: 'VRN: Beförderungsbedingungen, Anlage 3: Mitnahme von E-Tretrollern', url: 'https://www.vrn.de/tickets/tarifsystem/befoerderungsbedingungen/artikel/011912/index.html' },
    { title: 'VRN: E-Tretroller von Dott', url: 'https://www.vrn.de/mobilitaet/e-tretroller/dott/index.html' },
    { title: 'VRNnextbike: Tarife', url: 'https://www.vrnnextbike.de/de/' },
    { title: 'Wochenblatt: VRNrad Kaiserslautern, Flotte wird ab 2027 fast verdoppelt (31. August 2026)', url: 'https://www.wochenblatt-reporter.de/kaiserslautern/c-lokales/vrnrad-kaiserslautern-flotte-wird-ab-2027-fast-verdoppelt_a867814' },
    { title: 'SWK: Stadionshuttle', url: 'https://www.swk-kl.de/bus-traffic/stadionshuttle' },
    { title: 'SWK: Lautrer Nachtbus', url: 'https://www.swk-kl.de/bus-traffic/nachtbus' },
    { title: 'Deutsche Bahn: E-Scooter im Fernverkehr', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Kaiserslautern American: Operating e-scooters while drunk (6. Mai 2022)', url: 'https://www.kaiserslauternamerican.com/operating-e-scooters-while-drunk/' },
    { title: 'Stars and Stripes: Kaiserslautern marks eight new e-scooter parking zones in city center (20. August 2024)', url: 'https://www.stripes.com/ktown/2024-08-20/scooter-parking-spots-kaiserslautern-14920934.html' },
    { title: 'Wochenblatt: E-Scooter-Verleih in Kaiserslautern gestartet (15. Januar 2020)', url: 'https://www.wochenblatt-reporter.de/kaiserslautern/c-lokales/roller-sind-an-zentralen-verkehrsknotenpunkten-und-belebten-bereichen-zu-finden_a159739' },
    { title: 'GACO: German-American Community Office Kaiserslautern', url: 'https://gaco.kaiserslautern.de/welcome/' },
    { title: 'Japanischer Garten Kaiserslautern: Chronik', url: 'https://www.japanischergarten.de/mitmachen/chronik' },
  ],
};

export default guide;
