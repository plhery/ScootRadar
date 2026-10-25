import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-duesseldorf',
  topic: 'dusseldorf',
  name: 'E-Scooter Düsseldorf: Anbieter, Preise, Parken',
  title: 'E-Scooter Düsseldorf 2026: Anbieter, Preise, Parken, Kirmes',
  description: 'E-Scooter Düsseldorf: die vier Anbieter, was zehn Minuten kosten, wo du in der Altstadt parkst, wer zum Flughafen fährt und was die Rheinbahn verbietet.',
  headline: 'E-Scooter Düsseldorf: Anbieter, Preise, Sharingstationen und was an Karneval und zur Kirmes gilt',
  lede: 'Einen E-Scooter in Düsseldorf leihst du ab 18 und ohne Führerschein bei Bolt, Dott (früher TIER), Lime oder Voi. Zehn Minuten kosten nach den veröffentlichten Tarifen (Stand 24. Oktober 2026) bei Voi 3 € und bei Dott 4,20 €, bei Lime und Bolt zeigt die App den Preis. In Altstadt, Carlstadt, Stadtmitte und auf der Kö beendest du die Fahrt nur an einer markierten Sharingstation, sonst zahlst du weiter. In Bussen und Bahnen der Rheinbahn sind E-Scooter seit dem 1. März 2024 verboten, auch zusammengeklappt.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'de:Düsseldorf',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Düsseldorf?',
      blocks: [
        'Laut Connected Mobility Düsseldorf (CMD), der städtischen Mobilitätsgesellschaft, vermieten vier Anbieter E-Scooter: **Bolt**, **Dott**, **Lime** und **Voi**. Dott hiess früher TIER; wer TIER fuhr, nutzt seit Oktober 2024 die Dott-App.',
        'Gemietet wird in der App des Anbieters, ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Auf der [Karte rund um Düsseldorf](map:de:Düsseldorf) zeigt ScootRadar Dott, seit dem 24. Oktober 2026 auch Voi und seit dem 25. Oktober Lime: am Samstag, 24. Oktober, kurz nach 15 Uhr rund 1700 Dott- und 2000 Voi-Scooter, am Sonntagvormittag, 25. Oktober, rund 2000 Lime-Scooter. Das ist eine Momentaufnahme, keine Flottengrösse; die Stadt erlaubt allen Anbietern zusammen bis zu 8400. Bolt findest du nur in seiner App.',
        'Mit «E-Roller» sind oft auch Elektro-Mopeds zum Sitzen gemeint: Für die brauchst du Führerschein und Helm, um sie geht es hier nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Düsseldorf?',
      blocks: [
        'Einen Tarif für Düsseldorf veröffentlichen Voi und Dott, beide in offenen Datenfeeds.',
        {
          table: {
            caption: 'E-Scooter-Preise in Düsseldorf (veröffentlichte Tarife, Stand 24. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,30 €', '3,00 €', '6,00 €'],
              ['Dott', '1,00 €', '0,32 €', '4,20 €', '7,40 €'],
              ['Bolt, Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde kostet damit 4,50 € bei Voi und 5,80 € bei Dott. Voi verkauft ausserdem Minutenpakete und den Voi Pass. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Günstiger für kurze Wege ist das Leihrad Düsselbike mit 1 € pro 15 Minuten (siehe unten). Den nächsten Dott oder Voi und eine Preisschätzung für deinen Weg zeigt die [Live-Karte von Düsseldorf](map:de:Düsseldorf).',
      ],
    },
    {
      heading: 'Wo darf man in Düsseldorf mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu.',
        '**Altstadt:** Grosse Teile sind Fussgängerzone. Wo das Schild steht, steigst du ab und schiebst, auch wenn die App dich fahren lässt: Dott hat laut seinem Datenfeed nirgends eine Fahrverbotszone. Langsamfahrzonen gibt es nicht: Ein für 2024 geplanter Versuch scheiterte laut CMD an rechtlichen Hürden.',
        '**Rheinuferpromenade:** Fahr nur, wo ein Radweg ausgeschildert ist, sonst schieb.',
        '**Rheinbrücken:** Über die Oberkasseler Brücke, die Rheinkniebrücke und die Theodor-Heuss-Brücke fährst du auf dem Radweg. Auf den Brücken selbst beginnst und beendest du keine Fahrt.',
        '**Parks:** Im Hofgarten, im Volksgarten, im Südpark und im Nordpark darfst du keinen Scooter abstellen. Die Strassenordnung der Stadt verbietet zudem, mit Kraftfahrzeugen, also auch E-Scootern, durch Grünanlagen zu fahren.',
        '**Stadtgrenze:** Mit Dott beendest du keine Fahrt in Neuss, Ratingen, Meerbusch oder Hilden: Die Nachbarstädte liegen ausserhalb seines Gebiets.',
      ],
    },
    {
      heading: 'E-Scooter in Düsseldorf parken: Sharingstationen in der Innenstadt',
      blocks: [
        'In **Altstadt, Carlstadt und Stadtmitte** beendest du die Fahrt nur an einer Sharingstation, erkennbar an der weissen Bodenmarkierung «SharingStation». Auf der **Königsallee** gilt das seit dem 5. Oktober 2022: Wer dort woanders abstellen will, wird laut Stadt «feststellen, dass dies digital unterbunden wird», und der Bezahlvorgang läuft weiter.',
        'Im Oktober 2026 zählte CMD 333 Sharingstationen; bis 2030 sollen es rund 600 werden. Rund um die Stationen liegen Parkverbotszonen, stadtweit etwa 12 km², laut Stadt so viel wie 1680 Fussballfelder.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (unsere Auswertung des Dott-Datenfeeds, Stand 13. Oktober 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Altstadt (Burgplatz, Marktplatz, Carlsplatz), Kö, Schadowstrasse, Rheinuferpromenade', 'Nur an einer Sharingstation'],
              ['Hauptbahnhof, Vorplatz (Konrad-Adenauer-Platz); Worringer Platz, Immermannstrasse', 'Nur an einer Sharingstation'],
              ['Messe, Merkur Spiel-Arena, Heinrich-Heine-Universität', 'Nur an einer Sharingstation'],
              ['Oberkasseler, Rheinknie- und Theodor-Heuss-Brücke; Rheinwiesen in Oberkassel', 'Gar nicht, ausser an temporären Stationen zur Rheinkirmes'],
              ['Volksgarten, Südpark, Zoopark, PSD Bank Dome; Hauptbahnhof, Rückseite (Bertha-von-Suttner-Platz)', 'Gar nicht'],
              ['Medienhafen am Neuen Zollhof (Gehry-Bauten), Rheinturm, Landtag', 'Bei Dott gar nicht: ausserhalb des Gebiets'],
              ['Flughafen, Schloss Benrath, Kaiserswerth', 'Bei Dott gar nicht: ausserhalb des Gebiets'],
            ],
          },
        },
        'Zu den Gehry-Bauten gehst du mit Dott also das letzte Stück zu Fuss. Lime, Voi und Bolt nutzen dieselben Sharingstationen. Das Netz wächst laufend: Massgeblich ist die Karte in deiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Parkverbotszone oder neben statt auf der Station. Am Rand einer Station kann auch das GPS danebenliegen: Schieb den Scooter ein Stück weiter auf die Fläche. Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Ausserhalb der Zonen stellst du frei ab, aufrecht und ohne Geh- oder Radweg, Zebrastreifen, Haltestellen oder Eingänge zu versperren. Lime verlangt mindestens 2 m freien Gehweg, 15 m Abstand zu Haltestellen und ein Foto am Ende der Fahrt.',
        'Für einen Scooter in einer Parkverbotszone berechnet Lime eine Strafgebühr, nennt aber keinen Betrag. Steht dir ein Scooter im Weg, melde ihn über scooter-melder.de oder bei der Hotline, deren Nummer auf dem Scooter steht.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Düsseldorf: Bussgelder und Alkohol',
      blocks: [
        'In Düsseldorf gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
        {
          table: {
            caption: 'Bussgelder für E-Scooter-Fahrer (Regelsätze, Stand Oktober 2026)',
            head: ['Verstoss', 'Heute', 'Ab 1. März 2027'],
            rows: [
              ['Auf Gehweg oder in Fussgängerzone gefahren', '15 €, bis 30 € mit Behinderung, Gefährdung oder Schaden', '25 €, bis 40 €'],
              ['Zu zweit auf einem Scooter', '10 €', '25 €'],
              ['Rote Ampel', '60 €, 1 Punkt', 'unverändert'],
              ['Handy in der Hand', '100 €, 1 Punkt', 'neu geregelt, Betrag noch offen'],
              ['Ab 0,5 Promille', '500 €, 2 Punkte, 1 Monat Fahrverbot, auch fürs Auto', 'unverändert'],
              ['Falsch abgestellt', 'behindernd 20 €, gefährdend 30 € (§ 1 StVO)', 'auf Geh- oder Radweg: 55 €, mit Behinderung 70 €'],
            ],
          },
        },
        'Auf dem Scooter gelten die Promillegrenzen fürs Auto: Ab 1,1 Promille ist es eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit gilt 0,0.',
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter an Karneval und zur Rheinkirmes',
      blocks: [
        'Bei grossen Festen sperrt CMD einzelne Sharingstationen und richtet Ausweichflächen ein; angekündigt wird das vorher auf cmd.nrw.',
        '**Karneval:** 2026 waren vom 9. bis 18. Februar aus Sicherheitsgründen einzelne Stationen gesperrt. CMD empfahl:',
        {
          list: [
            'zu Altweiber (12. Februar, 11:11 Uhr am Rathaus) die Stationen Reuterkaserne I und II oder die Ausweichflächen am Martin-Luther-Platz und am Gustaf-Gründgens-Platz;',
            'zum Kinder- und Jugendumzug (14. Februar) und zum Kö-Treiben (15. Februar) Martin-Luther-Platz, Berliner Allee (Zurheide II) und Graf-Adolf-Platz.',
          ],
        },
        'Für den 11.11.2026 und für Karneval 2027 (Altweiber ist am 4. Februar) hatte CMD bis zum 14. Oktober noch nichts angekündigt.',
        '**Rheinkirmes:** Auf den Oberkasseler Rheinwiesen darfst du sonst nicht abstellen. Zur Kirmes richtet CMD dort und im Viertel temporäre Stationen ein; 2026 waren es laut CMD zwölf, vom 14. bis 27. Juli, etwa an der Rheinallee und am Barbarossaplatz. 2025 zählte CMD in den zehn Kirmestagen 209 466 Sharing-Fahrten, am Freitag, dem 18. Juli, allein 28 204: so viele wie an keinem anderen Tag des Jahres. Die nächste Rheinkirmes läuft laut Veranstalter vom 16. bis 25. Juli 2027.',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Rheinbahn, Flughafen, Düsselbike',
      blocks: [
        'Seit dem 1. März 2024 darfst du E-Scooter nicht mehr in Bussen, Strassenbahnen und U-Bahnen der **Rheinbahn** mitnehmen, auch nicht zusammengeklappt: «aus Brandschutzgründen», schreibt die Rheinbahn. Das Verbot gilt bis auf Weiteres; Pedelecs und Elektrorollstühle sind ausgenommen.',
        'Leih-Scooter lassen sich nicht klappen und dürfen ohnehin nie mit: Fahrt vor der Haltestelle beenden, am Ziel einen neuen mieten. Deinen eigenen Scooter nimmst du laut VRR-Tarif in S-Bahn und Regionalzug zusammengeklappt als Handgepäck mit, sonst wie ein Fahrrad; jedes Verkehrsunternehmen darf ihn aber ausschliessen.',
        '**Flughafen:** Am **DUSsharing hub**, laut Flughafen zwei Gehminuten vom Terminal neben dem Mietwagenzentrum am P7 (Zufahrt über die Towerstrasse), stehen E-Scooter von Lime, Bolt und Voi; weitere Abhol- und Abstellzonen gibt es in der Airport City und an P13 und P24. Mit Dott kannst du am Flughafen keine Fahrt beenden: Terminal und Fernbahnhof liegen nach unserer Auswertung ausserhalb seines Gebiets.',
        '**Düsselbike**, das Leihrad der Stadt, fährt seit dem 1. Juli 2026 mit rund 2500 Rädern. Du buchst in der App von Donkey Republic oder in redy, der App der Rheinbahn, und gibst das Rad nur an Sharingstationen oder Düsselbike-Stationen zurück.',
        {
          table: {
            caption: 'Düsselbike: Tarife (Stand 13. Oktober 2026)',
            head: ['Tarif', 'Preis'],
            rows: [
              ['Einzelfahrt', '1 € pro 15 Minuten'],
              ['4-Stunden-Pass, Tagespass', '5 €, 10 €'],
              ['Monatsabo, Jahresabo', '10 €, 60 €'],
              ['Studierende von Hochschule Düsseldorf, Kunstakademie und Robert Schumann Hochschule mit Semesterpass (seit 1. Oktober 2026)', '60 Minuten gratis, dann 0,50 € pro angefangene halbe Stunde, höchstens 4,50 € am Tag'],
            ],
          },
        },
        'Daneben fährt weiter **nextbike**: 1,50 € für die ersten 15 Minuten, dann 1 € je 15 Minuten.',
      ],
    },
    {
      heading: 'Obergrenze, Gebühren, Vergabe: Wie Düsseldorf E-Scooter regelt',
      blocks: [
        'Seit 2022 brauchen die Anbieter eine Sondernutzungserlaubnis nach der Sondernutzungssatzung vom Dezember 2021. Im August 2021 fuhren fünf Anbieter mit 12 700 Scootern; heute gilt eine Obergrenze von 8400, davon 1800 in Altstadt, Carlstadt und Stadtmitte, wo nur Stationen erlaubt sind.',
        'Pro Scooter und Jahr zahlen die Anbieter 50 € in der Innenstadt und den Stadtteilen drumherum (Zonen A und B) und 30 € im Rest der Stadt (Zone C), so der Gebührentarif in der seit 1. Januar 2026 geltenden Fassung. Bis 2021 waren es überall 20 €.',
        'Im Januar 2024 kündigte die Stadt an, nur noch drei Anbieter zuzulassen. Im Juni 2026 schrieb sie die Konzession europaweit aus: höchstens drei Anbieter, drei Jahre ab 1. November 2026. Wer den Zuschlag bekommt, hatte sie bis zum 14. Oktober 2026 nicht veröffentlicht.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Düsseldorf',
      blocks: [
        {
          list: [
            '**Von einer auf 300 Stationen in viereinhalb Jahren.** Die erste Sharingstation eröffnete im Februar 2022 am Horionplatz, die 100. im August 2023 am Gustaf-Gründgens-Platz, die 300. im Juli 2026 an der Blücherstrasse in Pempelfort.',
            '**An der «längsten Theke der Welt» parkst du nur an Stationen.** So heisst die Altstadt wegen ihrer rund 300 Kneipen und Restaurants. Nach dem Altbier lässt du den Scooter ohnehin besser stehen.',
            '**Wenn die Bahnen streiken, rollen die Scooter.** Am Streiktag im Nahverkehr, dem 21. Februar 2025, wurden geteilte E-Scooter und Räder laut CMD etwa 2,3-mal so oft genutzt wie am Freitag davor und legten 50 227 statt 13 469 Kilometer zurück.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-App kann ich in Düsseldorf nutzen?',
      answer: 'Die von Bolt, Dott (früher TIER), Lime oder Voi, den vier Anbietern in der Stadt. Du musst 18 sein, einen Führerschein brauchst du nicht. Freie Dott-, Voi- und Lime-Scooter zeigt auch die [Live-Karte von Düsseldorf](map:de:Düsseldorf), die von Bolt nur seine App.',
    },
    {
      question: 'Wie viel kosten zehn Minuten E-Scooter in Düsseldorf?',
      answer: 'Bei Voi 3 € (0,30 € pro Minute, Entsperren gratis), bei Dott 4,20 € (1 € Entsperren plus 0,32 € pro Minute), nach den veröffentlichten Tarifen vom 24. Oktober 2026. Lime und Bolt zeigen ihren Preis in der App.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Altstadt nicht beenden?',
      answer: 'Weil du in Altstadt, Carlstadt, Stadtmitte und auf der Kö nur an einer markierten Sharingstation abstellen darfst; daneben sperrt die App das Beenden. Fahr zur nächsten Station, die die App zeigt: Bis dahin zahlst du weiter.',
    },
    {
      question: 'Gibt es E-Scooter am Düsseldorfer Flughafen?',
      answer: 'Ja, am DUSsharing hub zwei Gehminuten vom Terminal: E-Scooter von Lime, Bolt und Voi. Mit Dott kannst du am Flughafen keine Fahrt beenden; Terminal und Fernbahnhof liegen nach unserer Auswertung ausserhalb seines Gebiets.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Rheinbahn mitnehmen?',
      answer: 'Nein. Seit dem 1. März 2024 sind E-Scooter in Bussen, Strassenbahnen und U-Bahnen der Rheinbahn verboten, auch zusammengeklappt, wegen der Brandgefahr. Leih-Scooter darfst du ohnehin nie mitnehmen.',
    },
  ],
  sources: [
    { title: 'CMD: Sharingstationen in Düsseldorf', url: 'https://www.cmd.nrw/mobilitaetsangebote/sharingstation' },
    { title: 'Stadt Düsseldorf: 300. Sharingstation eröffnet (13. Juli 2026)', url: 'https://www.duesseldorf.de/aktuelles/news/detailansicht/newsdetail/300-sharingstation-eroeffnet-1' },
    { title: 'Stadt Düsseldorf: E-Scooter-Parken auf der Kö (2022)', url: 'https://www.duesseldorf.de/aktuelles/news/detailansicht/newsdetail/neue-regeln-schraenken-e-scooter-parken-auf-der-koe-ein-1' },
    { title: 'Stadt Düsseldorf: Gebührentarif zur Sondernutzungssatzung', url: 'https://www.duesseldorf.de/stadtrecht/6/66/66-101-1' },
    { title: 'Dott: offener Datenfeed für Düsseldorf (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/dusseldorf/gbfs.json' },
    { title: 'Voi: E-Scooter in Düsseldorf', url: 'https://www.voi.com/de/city/dusseldorf' },
    { title: 'NRW.Mobidrom: Mobilitätsdaten des Landes NRW, mit Vois offenen Datenfeeds', url: 'https://www.mobilitaetsdaten.nrw' },
    { title: 'CMD: Sharingstationen an Karneval 2026', url: 'https://www.cmd.nrw/blog/duesseldorf-helau-so-kommt-ihr-zu-euren-karnevalsveranstaltungen' },
    { title: 'Rheinbahn: Sicherheit in Bus und Bahn', url: 'https://www.rheinbahn.de/fahren/gut-zu-wissen/sicherheit' },
    { title: 'Flughafen Düsseldorf: DUSsharing hub', url: 'https://www.dus.com/de-de/anreisen/dussharing-hub' },
    { title: 'CMD: Düsselbike, Tarife', url: 'https://www.cmd.nrw/duesselbike' },
  ],
};

export default guide;
