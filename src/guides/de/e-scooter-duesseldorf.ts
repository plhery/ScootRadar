import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-duesseldorf',
  topic: 'dusseldorf',
  name: 'E-Scooter Düsseldorf: Anbieter, Preise, Parken',
  title: 'E-Scooter-Sharing Düsseldorf 2026: Anbieter, Preise, Parken',
  description: 'E-Scooter in Düsseldorf: Bolt, Dott, Lime oder Voi. Was eine Fahrt kostet, warum du in der Altstadt nur an Sharingstationen parkst, was in der Rheinbahn gilt.',
  headline: 'E-Scooter Düsseldorf: Anbieter, Preise, Sharingstationen und was an Karneval und zur Kirmes gilt',
  lede: 'Einen E-Scooter in Düsseldorf leihst du ohne Führerschein bei Bolt, Dott (früher TIER), Lime oder Voi; bei Bolt und Dott musst du 18 sein. Diese vier nennt die Stadt auch am 3. November 2026; ihre Konzession sieht künftig höchstens drei vor. Zehn Minuten kosten bei Voi 3 € und bei Dott 4,20 € (Stand November 2026), bei Bolt und Lime zeigt die App den Preis. In Altstadt, Carlstadt, Stadtmitte und auf der Kö beendest du die Fahrt nur an einer markierten Sharingstation, sonst zahlst du weiter. In Bussen und Bahnen der Rheinbahn sind E-Scooter seit dem 1. März 2024 verboten.',
  published: '2026-10-13',
  updated: '2026-10-26',
  city: 'de:Düsseldorf',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Düsseldorf?',
      blocks: [
        'Laut Connected Mobility Düsseldorf (CMD), der städtischen Mobilitätsgesellschaft, vermieten am 30. Oktober 2026 vier Anbieter E-Scooter: **Bolt**, **Dott**, **Lime** und **Voi**. Dott hiess früher TIER; wer TIER fuhr, nutzt seit Oktober 2024 die Dott-App.',
        'Gemietet wird in der App des Anbieters, bei Bolt und Dott ab 18, obwohl das Gesetz E-Scooter schon ab 14 erlaubt; welches Mindestalter Lime und Voi verlangen, prüfst du in der App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
        'Am Freitag, 30. Oktober 2026, um 13:36 Uhr zeigte die [Karte rund um Düsseldorf](map:de:Düsseldorf) rund 1600 Dott-, 2100 Voi- und 1800 Bolt-Scooter, die zu diesem Zeitpunkt frei waren, dazu rund 1900 Lime-Scooter nach der letzten Zählung. Die Stadt erlaubt allen Anbietern zusammen bis zu 8400 Fahrzeuge.',
        'Mit «E-Roller» sind oft auch Elektro-Mopeds zum Sitzen gemeint: Die brauchen Führerschein und Helm, um sie geht es hier nicht.',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Düsseldorf?',
      blocks: [
        'Voi und Dott nennen ihren Düsseldorfer Tarif:',
        {
          table: {
            caption: 'E-Scooter-Preise in Düsseldorf (Stand November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', '0,00 €', '0,30 €', '3,00 €', '6,00 €'],
              ['Dott', '1,00 €', '0,32 €', '4,20 €', '7,40 €'],
              ['Bolt, Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
            ],
          },
        },
        'Eine Viertelstunde kostet damit 4,50 € bei Voi und 5,80 € bei Dott. Bolt nennt für Deutschland Minutenpreise ab 0,15 € plus eine kleine Freischaltgebühr; der Minutentarif hängt vom Ort ab. Dazu verkauft Bolt Wochen- und Monatspässe und ein Abo mit unbegrenzten Freischaltungen ab 0,99 € im Monat. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Günstiger für kurze Wege ist das Leihrad Düsselbike mit 1 € pro 15 Minuten (siehe unten). Den nächsten Dott oder Voi und was er für 5 bis 30 Minuten kostet, zeigt die [Live-Karte von Düsseldorf](map:de:Düsseldorf).',
      ],
    },
    {
      heading: 'Wo darf man in Düsseldorf mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu.',
        '**Altstadt:** Grosse Teile sind Fussgängerzone. Wo das Schild steht, steigst du ab und schiebst, auch wenn die App dich weiterfahren lässt: Dotts Zonen etwa regeln in Düsseldorf nur, wo du abstellst, nicht, wo du fährst.',
        '**Rheinuferpromenade:** Fahr nur, wo ein Radweg ausgeschildert ist, sonst schieb.',
        '**Rheinbrücken:** Über die Oberkasseler Brücke, die Rheinkniebrücke und die Theodor-Heuss-Brücke fährst du auf dem Radweg. Auf den Brücken selbst endet bei Dott und Voi keine Fahrt.',
        '**Parks:** Im Hofgarten, im Volksgarten, im Südpark und im Nordpark endet bei Dott und Voi keine Fahrt; nur am Rand von Hofgarten und Südpark gibt es je eine Station. Die Strassenordnung der Stadt verbietet zudem, mit Kraftfahrzeugen, also auch E-Scootern, durch Grünanlagen zu fahren.',
        '**Stadtgrenze:** Dotts Düsseldorfer Gebiet reicht nicht nach Neuss, Ratingen, Meerbusch oder Hilden; Neuss, Meerbusch und Hilden führt Dott als eigene Standorte (Stand November 2026). Voi rechnet Neuss zum selben Tarifgebiet wie Düsseldorf. Was in Neuss gilt, steht in [E-Scooter in Neuss](guide:neuss).',
      ],
    },
    {
      heading: 'E-Scooter in Düsseldorf parken: Sharingstationen in der Innenstadt',
      blocks: [
        'In **Altstadt, Carlstadt und Stadtmitte** beendest du die Fahrt nur an einer Sharingstation, erkennbar an der weissen Bodenmarkierung «SharingStation». Auf der **Königsallee** gilt das seit dem 5. Oktober 2022: Wer dort woanders abstellen will, wird laut Stadt «feststellen, dass dies digital unterbunden wird», und der Bezahlvorgang läuft weiter.',
        'Am 30. Oktober 2026 zählte CMD 357 Sharingstationen; bis 2030 sollen es rund 600 werden. Rund um die Stationen liegen Parkverbotszonen, stadtweit etwa 12 km², laut Stadt so viel wie 1680 Fussballfelder.',
        {
          table: {
            caption: 'Fahrt beenden an bekannten Orten (Zonen von Dott, Stand November 2026)',
            head: ['Ort', 'Fahrt beenden'],
            rows: [
              ['Altstadt (Burgplatz, Marktplatz, Carlsplatz), Kö, Schadowstrasse, Rheinuferpromenade', 'Nur an einer Sharingstation'],
              ['Hauptbahnhof, Vorplatz (Konrad-Adenauer-Platz); Worringer Platz, Immermannstrasse', 'Nur an einer Sharingstation'],
              ['Messe, Merkur Spiel-Arena, Heinrich-Heine-Universität; Flughafen vor dem Terminal', 'Nur an einer Sharingstation'],
              ['Oberkasseler, Rheinknie- und Theodor-Heuss-Brücke; Rheinwiesen in Oberkassel', 'Gar nicht, ausser an temporären Stationen zur Rheinkirmes'],
              ['Volksgarten, Südpark, Zoopark, PSD Bank Dome; Hauptbahnhof, Rückseite (Bertha-von-Suttner-Platz)', 'Gar nicht'],
              ['Medienhafen am Neuen Zollhof (Gehry-Bauten), Rheinturm, Landtag', 'Bei Dott gar nicht: ausserhalb des Gebiets'],
              ['Fernbahnhof am Flughafen, Schloss Benrath, Kaiserswerth', 'Bei Dott gar nicht: ausserhalb des Gebiets'],
            ],
          },
        },
        'Lime, Voi und Bolt nutzen dieselben Sharingstationen, und ihre Apps zeigen sie an. Massgeblich ist die Karte in deiner App.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du in einer Parkverbotszone oder neben statt auf der Station. Am Rand einer Station kann auch das GPS danebenliegen: Schieb den Scooter ein Stück weiter auf die Fläche. Solange die Fahrt läuft, zahlst du weiter.',
        },
        'Ausserhalb der Zonen stellst du frei ab, aufrecht und ohne Geh- oder Radweg, Zebrastreifen, Haltestellen oder Eingänge zu versperren. Steht dir ein Scooter im Weg, melde ihn über scooter-melder.de oder bei der Hotline, deren Nummer auf dem Scooter steht.',
        'Falsch abstellen kostet: Bolt verlangt laut seinen Nutzungsbedingungen (Fassung ab 1. Dezember 2026) 15 €, wenn der Scooter falsch steht und kein deutliches Foto vom Ende der Fahrt da ist, und bis zu 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs. Dott berechnet laut seinen Bedingungen vom September 2025 bis zu 300 € Rückholkosten, wenn du Park- und Sperranweisungen nicht befolgst.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Düsseldorf: Bussgelder und Alkohol',
      blocks: [
        'In Düsseldorf gelten die deutschen Regeln: ab 14 ohne Führerschein, Leih-Scooter bei Bolt und Dott ab 18, keine Helmpflicht, bauartbedingt höchstens 20 km/h, nur eine Person pro Scooter.',
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
        'Bei grossen Festen sperrt CMD einzelne Sharingstationen und kündigt Ausweichflächen vorher auf cmd.nrw an.',
        '**Karneval:** 2026 waren vom 9. bis 18. Februar aus Sicherheitsgründen einzelne Stationen gesperrt. CMD empfahl:',
        {
          list: [
            'zu Altweiber (12. Februar, 11:11 Uhr am Rathaus) die Stationen Reuterkaserne I und II oder die Ausweichflächen am Martin-Luther-Platz und am Gustaf-Gründgens-Platz;',
            'zum Kinder- und Jugendumzug (14. Februar) und zum Kö-Treiben (15. Februar) Martin-Luther-Platz, Berliner Allee (Zurheide II) und Graf-Adolf-Platz.',
          ],
        },
        'Für den 11.11.2026 und für Karneval 2027 (Altweiber ist am 4. Februar) prüfst du die Stationen vorher in der App oder bei CMD.',
        '**Rheinkirmes:** Auf den Oberkasseler Rheinwiesen endet bei Dott und Voi sonst keine Fahrt. Zur Kirmes richtet CMD dort und im Viertel temporäre Stationen ein; 2026 waren es laut CMD zwölf, vom 14. bis 27. Juli, etwa an der Rheinallee und am Barbarossaplatz. 2025 zählte CMD in den zehn Kirmestagen 209 466 Sharing-Fahrten, am Freitag, dem 18. Juli, allein 28 204: so viele wie an keinem anderen Tag des Jahres. Die nächste Rheinkirmes läuft laut Veranstalter vom 16. bis 25. Juli 2027.',
      ],
    },
    {
      heading: 'E-Scooter in Bus und Bahn: Rheinbahn, Flughafen, Düsselbike',
      blocks: [
        'Seit dem 1. März 2024 darfst du E-Scooter nicht mehr in Bussen, Strassenbahnen und U-Bahnen der **Rheinbahn** mitnehmen: Sie schliesst sie «aus Brandschutzgründen» aus. Ausgenommen sind Pedelecs, Elektro-Rollstühle und vierrädrige Elektromobile für Menschen mit eingeschränkter Mobilität.',
        'Deinen eigenen Scooter nimmst du laut VRR-Handbuch (Stand 1. Juli 2026) in S-Bahn und Regionalzug vollständig zusammengeklappt als Handgepäck mit, sonst wie ein Fahrrad in den gekennzeichneten Abstellbereichen. Jedes Verkehrsunternehmen darf E-Tretroller aber per Hausrecht ausschliessen, auch zusammengeklappte. In ICE und IC fährt ein zusammengeklappter Scooter laut Deutscher Bahn kostenlos als Handgepäck mit; den Akku darfst du unterwegs weder herausnehmen noch laden.',
        '**Flughafen:** Am **DUSsharing hub**, laut Flughafen zwei Gehminuten vom Terminal neben dem Mietwagenzentrum am P7 (Zufahrt über die Towerstrasse), stehen E-Scooter von Lime, Bolt und Voi; weitere Abhol- und Abstellzonen gibt es in der Airport City und an P13 und P24. Mit Dott beendest du die Fahrt vor dem Terminal nur an Dotts Station «Flughafen»; der Fernbahnhof liegt ausserhalb von Dotts Gebiet (Stand November 2026).',
        '**Düsselbike**, das Leihrad der Stadt, fährt seit dem 1. Juli 2026, seit September mit rund 2500 Rädern. Du buchst in der App von Donkey Republic oder in redy, der App der Rheinbahn, und gibst das Rad nur an Sharingstationen oder Düsselbike-Stationen zurück.',
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
        'Im Juni 2026 schrieb die Stadt die Konzession für E-Scooter und Leih-Pedelecs europaweit aus: höchstens drei Anbieter, drei Jahre ab 1. November 2026. Auf ihrer E-Scooter-Seite nennt die Stadt am 3. November 2026 weiter alle vier, Lime, Voi, Bolt und Dott, mit zusammen 8400 Scootern.',
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
      answer: 'Die von Bolt, Dott (früher TIER), Lime oder Voi; diese vier nennt die Stadt am 3. November 2026, ihre Konzession sieht künftig höchstens drei vor. Einen Führerschein brauchst du nicht; bei Bolt und Dott musst du 18 sein. Freie Scooter zeigt auch die [Live-Karte von Düsseldorf](map:de:Düsseldorf).',
    },
    {
      question: 'Wie viel kosten zehn Minuten E-Scooter in Düsseldorf?',
      answer: 'Bei Voi 3 € (0,30 € pro Minute, Entsperren gratis), bei Dott 4,20 € (1 € Entsperren plus 0,32 € pro Minute), Stand November 2026. Bolt nennt für Deutschland Minutenpreise ab 0,15 €; den Düsseldorfer Preis von Bolt und Lime zeigt die App.',
    },
    {
      question: 'Warum kann ich meine Fahrt in der Altstadt nicht beenden?',
      answer: 'Weil du in Altstadt, Carlstadt, Stadtmitte und auf der Kö nur an einer markierten Sharingstation abstellen darfst; daneben sperrt die App das Beenden. Fahr zur nächsten Station, die die App zeigt: Bis dahin zahlst du weiter.',
    },
    {
      question: 'Gibt es E-Scooter am Düsseldorfer Flughafen?',
      answer: 'Ja, am DUSsharing hub zwei Gehminuten vom Terminal: E-Scooter von Lime, Bolt und Voi. Mit Dott beendest du die Fahrt vor dem Terminal nur an Dotts Station «Flughafen»; der Fernbahnhof liegt ausserhalb seines Gebiets (Stand November 2026).',
    },
    {
      question: 'Darf ich einen E-Scooter in der Rheinbahn mitnehmen?',
      answer: 'Nein. Seit dem 1. März 2024 schliesst die Rheinbahn E-Scooter aus Brandschutzgründen von der Mitnahme in ihren Bussen, Strassenbahnen und U-Bahnen aus. In ICE und IC der Deutschen Bahn fährt ein zusammengeklappter Scooter dagegen kostenlos als Handgepäck mit.',
    },
  ],
  sources: [
    { title: 'CMD: Sharingstationen in Düsseldorf', url: 'https://www.cmd.nrw/mobilitaetsangebote/sharingstation' },
    { title: 'Stadt Düsseldorf: 300. Sharingstation eröffnet (13. Juli 2026)', url: 'https://www.duesseldorf.de/aktuelles/news/detailansicht/newsdetail/300-sharingstation-eroeffnet-1' },
    { title: 'Stadt Düsseldorf: E-Scooter-Parken auf der Kö (2022)', url: 'https://www.duesseldorf.de/aktuelles/news/detailansicht/newsdetail/neue-regeln-schraenken-e-scooter-parken-auf-der-koe-ein-1' },
    { title: 'Stadt Düsseldorf: Gebührentarif zur Sondernutzungssatzung', url: 'https://www.duesseldorf.de/stadtrecht/6/66/66-101-1' },
    { title: 'Landeshauptstadt Düsseldorf: E-Scooter', url: 'https://www.duesseldorf.de/verkehrsmanagement/mobil-in-duesseldorf/clever-unterwegs/e-scooter' },
    { title: 'Landeshauptstadt Düsseldorf: Konzessionsvergabe E-Scooter- und Pedelec-Sharing, EU-Bekanntmachung 461064-2026 (6. Juli 2026, PDF)', url: 'https://ted.europa.eu/de/notice/461064-2026/pdf' },
    { title: 'Voi: Tarif- und Zonendatei für Düsseldorf und Neuss (NeTEx, Stand 4. November 2026)', url: 'https://api.voiapp.io/gbfs/open/v1/174/netex.xml' },
    { title: 'Dott: Tarif, Zonen und Stationen in Düsseldorf (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/dusseldorf/gbfs.json' },
    { title: 'Dott: Unsere Standorte', url: 'https://ridedott.com/de/unsere-standorte/' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: E-Scooter mieten in Deutschland', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Bolt: Allgemeine Nutzungsbedingungen für E-Fahrzeuge (gültig ab 1. Dezember 2026)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'CMD: Sharingstationen an Karneval 2026', url: 'https://www.cmd.nrw/blog/duesseldorf-helau-so-kommt-ihr-zu-euren-karnevalsveranstaltungen' },
    { title: 'Rheinbahn: Fragen und Antworten rund um die Fahrt', url: 'https://www.rheinbahn.de/service/faq/rund-um-die-fahrt' },
    { title: 'Rheinbahn: Sicherheit in Bus und Bahn', url: 'https://www.rheinbahn.de/fahren/gut-zu-wissen/sicherheit' },
    { title: 'VRR: Handbuch Tarif und Vertrieb (Stand 1. Juli 2026, PDF)', url: 'https://www.vrr.de/fileadmin/user_upload/pdf/service/downloads/Tarifhandbuch/VRR_Handbuch_2026.pdf' },
    { title: 'Deutsche Bahn: Mitnahme von E-Tretrollern und E-Scootern', url: 'https://www.bahn.de/faq/15was-muss-ich-bei-der-mitnahme-meines-e-tretrollers-oder-e-scooter-beachten' },
    { title: 'Flughafen Düsseldorf: DUSsharing hub', url: 'https://www.dus.com/de-de/anreisen/dussharing-hub' },
    { title: 'CMD: Düsselbike, Tarife', url: 'https://www.cmd.nrw/duesselbike' },
  ],
};

export default guide;
