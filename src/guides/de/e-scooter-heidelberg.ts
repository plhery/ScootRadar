import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-heidelberg',
  topic: 'heidelberg',
  name: 'E-Scooter Heidelberg: Anbieter, Preise, Parken',
  title: 'E-Scooter Heidelberg 2026: Anbieter, Preise, Abstellflächen',
  description: 'E-Scooter Heidelberg: Dott, Voi und Bolt, was zehn Minuten kosten, wo du in der Altstadt abstellen darfst und was in Strassenbahn und Bergbahn gilt.',
  headline: 'E-Scooter Heidelberg: Anbieter, Preise, Abstellflächen und Verbotszonen von der Altstadt bis ins Neuenheimer Feld',
  lede: 'Einen E-Scooter in Heidelberg leihst du ab 18 und ohne Führerschein bei Dott, Voi oder Bolt, den drei Anbietern mit einer Erlaubnis der Stadt bis März 2028. Voi kostet 0,25 € pro Minute ohne Entsperrgebühr, Dott 1 € plus 0,31 € pro Minute (Stand 17. Oktober 2026). In der Altstadt beendest du die Fahrt nur auf markierten Abstellflächen, auf der Neckarwiese gar nicht. In Strassenbahn, Bus und Bergbahn nimmst du keinen Leih-Scooter mit.',
  published: '2026-10-17',
  updated: '2026-10-24',
  city: 'de:Heidelberg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Heidelberg?',
      blocks: [
        'Seit 1. April 2026 dürfen in Heidelberg nur noch drei Anbieter Leih-Scooter aufstellen: **Dott**, das früher TIER hiess, **Bolt** und, neu in der Stadt, **Voi**. Die Stadt hat sie in einem Auswahlverfahren bestimmt; ihre Erlaubnisse laufen bis 31. März 2028. Gemietet wird in der App des Anbieters; Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'ScootRadar zeigt auf der [Karte von Heidelberg](map:de:Heidelberg) Dott und seit dem 24. Oktober 2026 auch Voi: An jenem Samstag kurz vor 16 Uhr standen dort rund 360 Dott- und 300 Voi-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse.',
        '**Bolt fehlt auf unserer Karte.** Für Heidelberg veröffentlicht Bolt keinen offenen Datenfeed, in Baden-Württemberg nur für Karlsruhe, Stuttgart und Reutlingen/Tübingen. Wo seine Scooter stehen, siehst du nur in seiner App.',
        '**Lime und Zeus** gehören seit April 2026 nicht mehr zu den Heidelberger Anbietern, auch wenn ihre Websites die Stadt noch nennen. Zeus-Scooter stehen laut dem offenen Datenfeed von Zeus südlich von Heidelberg, vor allem in Leimen: Die [Karte von Leimen](map:de:Leimen) zeigte am selben Nachmittag rund 70 Scooter, 60 davon von Zeus, den Rest von Dott, dessen Heidelberger Gebiet bis in den Norden Leimens reicht. Weitere Zeus-Scooter standen in Walldorf und Wiesloch.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Heidelberg?',
      blocks: [
        {
          table: {
            caption: 'E-Scooter-Preise in Heidelberg (Stand und Quelle in der ersten Spalte)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi (Website, 17. Oktober 2026)', '0,00 €', '0,25 €', '2,50 €', '5,00 €'],
              ['Dott (Datenfeed, 17. Oktober 2026)', '1,00 €', '0,31 €', '4,10 €', '7,20 €'],
              ['Bolt', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'In Leimen kostet Zeus laut Datenfeed 1 € plus 0,25 € pro Minute, höchstens 45 € pro Fahrt. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Günstiger ist **VRNnextbike**, das Leihrad im Verkehrsverbund Rhein-Neckar: 1 € pro 15 Minuten, höchstens 12 € in 24 Stunden. Im Monats-Abo für 10 € sind die ersten 30 Minuten jeder Fahrt inklusive. In Heidelberg gab es laut Stadt im März 2026 42 Stationen mit rund 360 Rädern. Der Vertrag mit nextbike läuft Ende Februar 2027 aus; die Stadt will das Leihrad ab März 2027 nahtlos weiterführen.',
      ],
    },
    {
      heading: 'Wo darf man in Heidelberg mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur, wo es keinen gibt, auf der Fahrbahn. Auf Gehwegen und in Fussgängerzonen fährst du nicht, ausser ein Schild «Elektrokleinstfahrzeuge frei» erlaubt es. Ein Nachtverbot gibt es nicht: Laut Stadt kannst du rund um die Uhr mieten.',
        '**Hauptstrasse:** Die Einkaufsstrasse der Altstadt ist Fussgängerzone. Dort steigst du ab und schiebst. Ob du ab 1. März 2027 dort fahren darfst, hängt von den Schildern ab: Ein «Radverkehr frei» gilt dann auch für E-Scooter, im Schritttempo.',
        '**Alte Brücke und Philosophenweg:** Beide liegen laut Datenfeed ausserhalb von Dotts Gebiet, ebenso der Zoo, Ziegelhausen, Emmertsgrund, Boxberg, das Patrick-Henry-Village und der Königstuhl. Dort beendest du keine Dott-Fahrt. Die Dott-Station «Alte Brücke» liegt am Altstadt-Ende der Brücke.',
        '**Schloss:** Am Schloss endet keine Dott-Fahrt: Es liegt in einer Zone, in der du nur an Stationen abstellst, und dort gibt es keine. Die nächsten liegen in der Altstadt nahe dem Kornmarkt, etwa in der Heiliggeiststrasse und der Neuen Schlossstrasse. Vom Kornmarkt fährt die Bergbahn hinauf.',
        '**Zur Uni:** Im Neuenheimer Feld mit Uniklinikum und Mathematikon stellst du Dott-Scooter frei ab, nur nicht auf den Sportflächen; am Universitätsplatz in der Altstadt nimmst du die Station in der Grabengasse.',
        'Nach Mannheim kommst du mit Dott nicht: Sein Heidelberger Gebiet endet im Westen bei Wieblingen und am Rand von Eppelheim. In Mannheim fahren Voi, Dott und Bolt mit eigenen Regeln, siehe [E-Scooter in Mannheim](guide:mannheim) und die [Karte rund um Mannheim](map:de:Mannheim).',
      ],
    },
    {
      heading: 'E-Scooter in Heidelberg abstellen: Abstellflächen und Verbotszonen',
      blocks: [
        'Die Stadt ordnet das Abstellen von innen nach aussen. In der **Altstadt** hat sie 2024 insgesamt 15 markierte Abstellflächen für je rund zwölf Scooter eingerichtet, etwa an Neckarstaden, Marstallstrasse, Karlstor, Akademiestrasse, Grabengasse, Seminarstrasse, Krahnenplatz und Oberer Neckarstrasse. Dort beendest du die Fahrt nur auf einer dieser Flächen.',
        'So soll es nach und nach in der ganzen Kernzone werden, mit bis zu 90 Flächen. Ist ein Stadtteil umgestellt, gilt dort laut Stadt ausserhalb der Flächen Abstellverbot: Die Fahrt lässt sich nicht beenden, und die Miete läuft weiter. Im November 2025 stellte die Stadt rund 25 Flächen für Bergheim und rund 15 für die Bahnstadt vor, im April 2026 kündigte sie die nächsten bis zu 15 in Bergheim, Weststadt, Bahnstadt und Neuenheim an. Fertig gemeldet hat sie bis Mitte Oktober 2026 keinen weiteren Stadtteil.',
        'Dott hat in seiner App eigene Zonen, auch rund um Bismarckplatz, Weststadt und Gadamerplatz. Laut Datenfeed gilt:',
        {
          table: {
            caption: 'Dotts Zonen in der App an bekannten Orten (Datenfeed von Dott, Stand 17. Oktober 2026)',
            head: ['Ort', 'Was gilt'],
            rows: [
              ['Altstadt vom Bismarckplatz bis zum Karlstor, mit Hauptstrasse, Universitätsplatz, Marktplatz, Kornmarkt und Schlossberg', 'Nur an Stationen'],
              ['Bismarckplatz, Seegarten, Kurfürsten-Anlage, Römerkreis', 'Nur an Stationen'],
              ['Gadamerplatz in der Bahnstadt, S-Bahnhof Weststadt/Südstadt', 'Nur an Stationen'],
              ['Vorplatz des Hauptbahnhofs', 'Verbotszone, ausser an der Station am Taxistand'],
              ['Neckarwiese, Neckarufer, Theodor-Heuss- und Ernst-Walz-Brücke', 'Verbotszone'],
              ['Zollhofgarten, Botanischer Garten, Sportflächen im Neuenheimer Feld', 'Verbotszone'],
              ['Alte Brücke, Philosophenweg, Zoo, Königstuhl', 'Ausserhalb des Gebiets'],
              ['Neuenheimer Feld, Handschuhsheim, Rohrbach, Kirchheim, Wieblingen', 'Frei abstellen, ohne zu behindern'],
            ],
          },
        },
        'Die Regeln der Stadt gelten für alle drei Anbieter; die Zonen von Voi und Bolt zeigt aber nur ihre App. Wo du frei abstellst, darfst du niemanden behindern oder gefährden. Tabu sind laut VRN ausserdem Fussgängerzonen, Grünanlagen und Strassenbegleitgrün, die Rampen von Bahnabgängen und öffentliche Fahrradständer.',
        'Zum **Weihnachtsmarkt** vom 23. November bis 22. Dezember 2026 stehen laut Stadt rund 140 Buden und Stände auf sechs Plätzen der Altstadt. Stell den Scooter dann am Rand der Altstadt ab, etwa nahe dem Bismarckplatz oder am Karlstor, und geh zu Fuss weiter.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du neben einer festen Fläche statt darauf, in einer Verbotszone oder ausserhalb des Gebiets. Fahr zur nächsten Fläche oder Station, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Heidelberg: Bussgelder und Promille',
      blocks: [
        'In Heidelberg gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter. Ein eigener Scooter braucht eine Versicherungsplakette. Die Verkehrsregeln sind Bundesrecht; die Stadt regelt, wie viele Leih-Scooter es gibt und wo sie stehen dürfen.',
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
        'Anders als oft zu lesen, gelten neue Verkehrsregeln und Bussgelder erst ab 1. März 2027. Seit 1. April 2026 gelten neue Bauvorschriften, aber nur für neue Fahrzeuge. Mehr in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter in Strassenbahn, Bus und Bergbahn',
      blocks: [
        'Die rnv wendet in ihren Bahnen und Bussen die Beförderungsbedingungen des VRN an (Stand Oktober 2026). Nach deren Anlage 3 fährt ein E-Tretroller nur zusammengeklappt mit, unter 15 kg, kürzer als 115 cm und mit Rädern bis 9 Zoll. Dann zählt er als Handgepäck und fährt laut VRN kostenlos mit; laden darfst du ihn unterwegs nicht. Die «E-Scooter»-Regeln der rnv betreffen dagegen Elektromobile für Menschen mit eingeschränkter Mobilität.',
        '**Leih-Scooter** erfüllen das nicht: Ein Dott-Scooter wiegt laut VRN 23 kg und lässt sich nicht klappen. Beende die Fahrt also vor der Haltestelle und miete am Ziel einen neuen.',
        '**Bergbahn:** Die Bahn vom Kornmarkt über Schloss und Molkenkur zum Königstuhl hat eigene Beförderungsbedingungen (gültig seit 1. April 2021) und einen eigenen Tarif, nicht den der rnv. Mit darf nur, was leicht tragbar und nicht sperrig ist; Fahrräder sind ausser Klapprädern ausgeschlossen. Einen Leih-Scooter nimmst du also nicht mit hinauf.',
      ],
    },
    {
      heading: 'Wie Heidelberg E-Scooter regelt: Auswahlverfahren, Obergrenze, Gebühr',
      blocks: [
        'Seit 1. April 2026 brauchen die Anbieter eine Sondernutzungserlaubnis nach dem Strassenrecht. Die Stadt hat sie in ihrem ersten Auswahlverfahren an Dott, Bolt und Voi vergeben, für zwei Jahre bis 31. März 2028. Das Konzept dazu beschloss der Gemeinderat am 14. November 2024.',
        'Erlaubt sind das ganze Jahr über 1200 Leih-Scooter; jeder Anbieter darf bis zu 400 gleichzeitig aufstellen. Zuvor standen rund 1700 Scooter von vier Anbietern in der Stadt. Jeder Anbieter zahlt 72 € pro Scooter und Jahr und muss reagieren, wenn Scooter behindernd oder gefährdend abgestellt sind. Die Gebühr dürfen die Anbieter laut Stadt an ihre Kunden weitergeben.',
        'Beschwerden nimmt das Amt für Mobilität unter nahmobilitaet@heidelberg.de an.',
      ],
    },
    {
      heading: 'Schon gewusst? Drais, Bergbahn und Hauptstrasse',
      blocks: [
        {
          list: [
            '**Der Erfinder des Laufrads studierte in Heidelberg.** Karl Drais, aus dessen Laufrad von 1817 das Fahrrad wurde, studierte von 1803 bis 1805 an der Universität Heidelberg Mathematik, Physik und Baukunst.',
            '**Die Bergbahn fährt seit 1890.** Die untere Strecke vom Kornmarkt zur Molkenkur eröffnete 1890, die obere zum Königstuhl 1907; noch heute fahren Original-Wagen von 1907. Die untere Strecke steigt bis zu 43 %.',
            '**Die Hauptstrasse ist Deutschlands vielfältigste Einkaufsstrasse.** Auf 1,4 km reihen sich 230 Geschäfte, mehr als in jeder anderen der rund 30 meistbesuchten Einkaufsstrassen Deutschlands, so eine Studie, über die die Stadt im April 2025 berichtete.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App brauche ich in Heidelberg?',
      answer: 'Die von Dott, Voi oder Bolt; TIER heisst heute Dott. Lime und Zeus gehören seit April 2026 nicht mehr dazu. Du musst 18 sein, einen Führerschein brauchst du nicht. Die [Live-Karte von Heidelberg](map:de:Heidelberg) zeigt Dott und Voi; Bolt siehst du nur in seiner App.',
    },
    {
      question: 'Was kostet ein E-Scooter in Heidelberg?',
      answer: 'Bei Voi 0,25 € pro Minute ohne Entsperrgebühr, zehn Minuten also 2,50 €; bei Dott 1 € plus 0,31 € pro Minute, zehn Minuten 4,10 € (Stand 17. Oktober 2026). Bolt zeigt den Preis nur in der App.',
    },
    {
      question: 'Warum kann ich in der Altstadt die Fahrt nicht beenden?',
      answer: 'Weil die Fahrt dort nur auf einer der markierten Abstellflächen endet, etwa in der Grabengasse, der Akademiestrasse oder am Karlstor. Fahr zur nächsten Fläche, die die App zeigt; bis dahin läuft die Miete weiter.',
    },
    {
      question: 'Komme ich mit dem Leih-Scooter zum Schloss oder auf den Philosophenweg?',
      answer: 'Am Schloss gibt es keine Dott-Station; stell den Scooter in der Altstadt nahe dem Kornmarkt ab und nimm die Bergbahn. Alte Brücke und Philosophenweg liegen ausserhalb von Dotts Gebiet: Dort beendest du keine Dott-Fahrt.',
    },
    {
      question: 'Darf ich einen E-Scooter in Strassenbahn oder Bergbahn mitnehmen?',
      answer: 'In Bahnen und Bussen der rnv nur einen eigenen, zusammengeklappten Scooter unter 15 kg, kürzer als 115 cm und mit Rädern bis 9 Zoll. In die Bergbahn darf nur, was leicht tragbar und nicht sperrig ist. Leih-Scooter bleiben draussen.',
    },
    {
      question: 'Wo melde ich einen falsch abgestellten E-Scooter?',
      answer: 'Beim Anbieter: Dott unter heidelberg@ridedott.com, Bolt unter heidelberg-micromobility@bolt.eu, Voi über «Einen Voi melden» auf voi.com. Oder beim Amt für Mobilität der Stadt unter nahmobilitaet@heidelberg.de.',
    },
  ],
  sources: [
    { title: 'Stadt Heidelberg: E-Tretroller in Heidelberg: Auswahlverfahren für Anbieter abgeschlossen (22. April 2026)', url: 'https://www.heidelberg.de/HD/Presse/22_04_2026+e-tretroller+in+heidelberg_+auswahlverfahren+fuer+anbieter+abgeschlossen.html' },
    { title: 'Stadt Heidelberg: E-Tretroller', url: 'https://www.heidelberg.de/HD/Leben/e-tretroller.html' },
    { title: 'Stadt Heidelberg: Neue Abstellflächen für Miet-E-Tretroller in Bergheim geplant (5. November 2025)', url: 'https://www.heidelberg.de/7071_34581_34869_284696_1219308_5769484_5769176.html' },
    { title: 'Stadt Heidelberg: Abstellflächen für Miet-E-Tretroller in der Bahnstadt (27. November 2025)', url: 'https://www.heidelberg.de/HD/Presse/27_11_2025+stadt+heidelberg+plant+abstellflaechen+fuer+miet-e-tretroller+in+der+bahnstadt.html' },
    { title: 'Stadt Heidelberg: Neue Gebühren für Anbieter von E-Tretrollern (10. April 2025)', url: 'https://www.heidelberg.de/7071_34581_34869_284696_1219308_5668136_5667961.html' },
    { title: 'Stadt Heidelberg: Regeln für den E-Scooter (26. September 2019)', url: 'https://www.heidelberg.de/26_09_2019+regeln+fuer+den+e-scooter.html' },
    { title: 'MobiData BW: Datenfeed von Dott in Heidelberg (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/dott_heidelberg/gbfs' },
    { title: 'MobiData BW: Datenfeed von Zeus (GBFS)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/zeus_leimen_walldorf_wiesloch/gbfs' },
    { title: 'Voi: E-Scooter in Heidelberg', url: 'https://www.voi.com/de/city/heidelberg' },
    { title: 'Bolt: Heidelberg', url: 'https://bolt.eu/de-de/cities/heidelberg/' },
    { title: 'rnv: Beförderungsbedingungen', url: 'https://www.rnv-online.de/fahrtinfo/sicher-unterwegs/befoerderungsbedingungen/' },
    { title: 'VRN: Beförderungsbedingungen, Anlage 3: Mitnahme von E-Tretrollern', url: 'https://www.vrn.de/tickets/tarifsystem/befoerderungsbedingungen/artikel/011912/index.html' },
    { title: 'VRN: E-Tretroller von Dott', url: 'https://www.vrn.de/mobilitaet/e-tretroller/dott/index.html' },
    { title: 'Heidelberger Bergbahnen: Beförderungsbedingungen', url: 'https://www.bergbahn-heidelberg.de/de/Hinweise/Befoerderungsbedingungen/' },
    { title: 'Heidelberger Bergbahnen: Chronik', url: 'https://www.bergbahn-heidelberg.de/de/Technik__Geschichte/Chronik-auf-einen-Blick/' },
    { title: 'VRNnextbike: Tarife', url: 'https://www.vrnnextbike.de/de/' },
    { title: 'Stadt Heidelberg: Heidelberg erweitert VRNnextbike-Angebot (5. März 2026)', url: 'https://www.heidelberg.de/HD/Presse/05_03_2026+heidelberg+erweitert+zusammen+mit+nachbarkommunen+vrnnextbike-angebot.html' },
    { title: 'Stadt Heidelberg: Fahrradvermietsystem ab 2027 (30. Juli 2025)', url: 'https://www.heidelberg.de/HD/Presse/30_07_2025+gemeinderat+beschliesst+fortfuehrung+des+regionalen+fahrradvermietsystems+ab+2027.html' },
    { title: 'Stadt Heidelberg: Veranstaltungen und Festivals', url: 'https://www.heidelberg.de/HD/Leben/Veranstaltungen%20_%20Festivals.html' },
    { title: 'Stadt Heidelberg: Hauptstrasse auf Platz eins der vielfältigsten Einkaufsstrassen (22. April 2025)', url: 'https://www.heidelberg.de/HD/Presse/22_04_2025+heidelberger+hauptstrasse+deutschlandweit+auf+platz+eins+der+vielfaeltigsten+einkaufsstrassen.html' },
    { title: 'Universität Heidelberg: Karl Freiherr von Drais', url: 'https://www.uni-heidelberg.de/en/node/11162' },
  ],
};

export default guide;
