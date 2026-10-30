import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-frankfurt',
  topic: 'frankfurt',
  name: 'E-Scooter Frankfurt: Anbieter, Preise, Parken',
  title: 'E-Scooter Frankfurt 2026: Anbieter, Preise, Parkzonen',
  description: 'E-Scooter Frankfurt: die drei Anbieter seit Juli 2026, was eine Fahrt kostet, wo du parkst und was auf Mainbrücken, Zeil, Messe und in der U-Bahn gilt.',
  headline: 'E-Scooter Frankfurt: Anbieter, Preise, Parkzonen und Verbote',
  lede: 'E-Scooter in Frankfurt leihst du seit dem 1. Juli 2026 nur noch bei Bolt, Lime und Voi, ab 18 und ohne Führerschein. Was eine Fahrt kostet, zeigt bei allen dreien die App. In der Innenstadt, im Bahnhofsviertel, in Bockenheim, in Höchst und an der Berger Strasse beendest du die Fahrt nur auf einer markierten Abstellfläche, auf den Mainbrücken, in Fussgängerzonen und in Parks gar nicht. In U-Bahn und Strassenbahn sind E-Scooter seit Oktober 2024 verboten.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'de:Frankfurt',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Frankfurt seit Juli 2026?',
      blocks: [
        'Seit dem 1. Juli 2026 verleihen in Frankfurt nur noch drei Anbieter E-Scooter: **Bolt** (dunkelgrün), **Lime** (grün-weiss) und **Voi** (rot). Die Stadt hat die Genehmigungen in einem Auswahlverfahren vergeben, befristet bis zum 30. Juni 2028. Wer den Zuschlag bekam, sagte die Stadt im Juli 2026 nicht, mit Verweis auf laufende verwaltungsrechtliche Verfahren; alle drei Anbieter bestätigten der hessenschau, dass sie eine Genehmigung haben.',
        'Jeder Anbieter darf im Tagesdurchschnitt höchstens 3500 Scooter aufstellen, zusammen also 10 500 statt bisher 12 000, davon je höchstens 800 im zentralen Innenstadtbereich. Dott, Ryde und RideMovi gingen leer aus und haben den Verleih eingestellt. Tier heisst heute Dott und ist damit ebenfalls weg.',
        'ScootRadar zeigt auf der [Karte von Frankfurt](map:de:Frankfurt) Lime, Voi und Bolt: am Freitag, 30. Oktober 2026, um 9:27 Uhr rund 3300 Lime-, 3100 Voi- und 3000 Bolt-Scooter, die zu diesem Zeitpunkt frei waren. Bei Lime zeigt die Karte auch die Reichweite, bei Voi und Bolt den Akkustand.',
        'Gemietet wird in der App des Anbieters, laut den Bedingungen aller drei erst ab 18, obwohl das Gesetz E-Scooter ab 14 erlaubt. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Frankfurt?',
      blocks: [
        'Den Frankfurter Tarif zeigen Voi und Lime in ihrer App; Bolt nennt nur einen Ab-Preis für ganz Deutschland.',
        {
          table: {
            caption: 'E-Scooter-Preise in Frankfurt (veröffentlichte Tarife, Stand 30. Oktober 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Voi', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Lime', 'in der App', 'in der App', 'in der App', 'in der App'],
              ['Bolt', 'kleine Gebühr, Betrag nicht genannt', 'ab 0,15 € (für Deutschland)', 'in der App', 'in der App'],
            ],
          },
        },
        'Lime rechnet laut seinen deutschen Bedingungen jede angefangene Minute voll ab. Verbindlich ist der Preis, den die App vor dem Entsperren zeigt.',
        'Wer oft fährt, kann mit Paketen und Abos sparen: Voi bietet Minutenpakete und den Voi Pass, Bolt hat ein Abo mit unbegrenzten Freischaltungen ab 0,99 € im Monat (Preis für Deutschland).',
      ],
    },
    {
      heading: 'Wo darf man in Frankfurt mit dem E-Scooter fahren?',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahr- oder Schutzstreifen und nur dort, wo es keinen gibt, auf der Fahrbahn. Gehwege sind tabu, ebenso Fussgängerzonen, ausser ein Schild erlaubt es. Was das in Frankfurt heisst:',
        {
          list: [
            '**Zeil und Fressgass:** Beide sind Fussgängerzonen. Zwischen Hauptwache und Konstablerwache und in der Grossen Bockenheimer Strasse steigst du ab und schiebst. Die Stadtpolizei kontrolliert dort: Im Juni 2026 prüfte sie an einem Dienstag 66 Fahrzeuge; 25 Fahrer waren unerlaubt in der Fussgängerzone unterwegs.',
            '**Römerberg und Altstadt:** Die Altstadt rund um den Römerberg ist meist Fussgängerbereich. Achte auf die Sperrzonen in der App und schieb im Zweifel.',
            '**Mainbrücken:** Darüber fährst du auf Radweg oder Fahrbahn, starten oder beenden kannst du dort aber keine Fahrt. Über den Eisernen Steg, eine Fussgängerbrücke, schiebst du besser.',
            '**Parks, Wallanlagen und Mainufer:** Die Grünanlagensatzung der Stadt gilt für 45 Parks, die Wallanlagen und beide Mainufer. Sie verbietet dort, mit Kraftfahrzeugen zu fahren, sie abzustellen oder zu schieben, und ein E-Scooter ist nach der eKFV ein Kraftfahrzeug. Eine Fahrt beenden kannst du dort ohnehin nicht. Am Museumsufer nimmst du besser den Schaumainkai als die Uferpromenade.',
          ],
        },
        'Unser Rat: Quere Strassenbahnschienen möglichst im rechten Winkel, damit das Vorderrad nicht in die Rille rutscht.',
      ],
    },
    {
      heading: 'E-Scooter in Frankfurt parken: Parkverbotszonen und Abstellflächen',
      blocks: [
        'In mehreren Vierteln gilt für Leih-Scooter ein Parkverbot mit Ausnahmen: Dort beendest du die Fahrt nur auf einer markierten Abstellfläche, sonst lässt dich die App die Fahrt nicht beenden. Im Juni 2026 gab es in der Stadt 263 solche Flächen:',
        {
          table: {
            caption: 'Parkverbotszonen und Abstellflächen in Frankfurt (traffiQ, Stand Juni 2026)',
            head: ['Gebiet', 'Abstellflächen'],
            rows: [
              ['Innenstadt und Bahnhofsviertel, innerhalb des Anlagenrings', '126'],
              ['Bockenheim', '12'],
              ['Höchster Innenstadt, zwischen Main und Bahnhof (Zone neu 2026)', '12'],
              ['Berger Strasse, vom Nordend bis Bornheim (Zone neu 2026)', '35'],
              ['Einzelne Flächen im übrigen Stadtgebiet', '78'],
              ['Zusammen', '263'],
            ],
          },
        },
        'Dazu kommt die **100-Meter-Regel**: Im Umkreis von 100 m um jede Abstellfläche, auch ausserhalb der Zonen, parkst du nur auf der Fläche selbst. Ist eine Fläche voll, beendest du die Fahrt auch dort nicht.',
        'An diesen Stellen kannst du eine Miete weder starten noch beenden:',
        {
          list: [
            'in Fussgängerzonen wie Zeil und Fressgass;',
            'auf den Mainbrücken und anderen Strassenbrücken;',
            'in Parks und Grünanlagen, auch an den Mainufern und in den Wallanlagen, und auf dem Grünstreifen am Strassenrand;',
            'in Wäldern, Natur- und Landschaftsschutzgebieten wie dem Stadtwald;',
            'auf Spielplätzen und Friedhöfen.',
          ],
        },
        'Ausserhalb der Zonen darfst du auf dem Gehweg parken, wenn mindestens 1,50 m frei bleiben. Lime bittet, den Scooter parallel an die Bordsteinkante zu stellen statt an die Hauswand, an der sich blinde Menschen orientieren, und ihn nicht näher als 15 m an Bus- und Strassenbahnhaltestellen abzustellen. Bei Lime gehört ein Foto des abgestellten Scooters zum Beenden der Fahrt.',
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du neben statt auf einer Abstellfläche, in deren 100-Meter-Umkreis, an einer vollen Fläche, auf einer Brücke oder in einer Grünanlage. Fahr zur nächsten Fläche, die die App zeigt: Solange die Fahrt läuft, zahlst du weiter.',
        },
      ],
    },
    {
      heading: 'Falsch geparkter E-Scooter in Frankfurt: Kosten und Melden',
      blocks: [
        'Behinderst du mit dem abgestellten Scooter andere, können Stadt oder Polizei nach dem Bussgeldkatalog des Bundes 20 € verlangen, gefährdest du sie, 30 €. Ab 1. März 2027 kostet unzulässiges Parken auf Geh- oder Radweg ab 55 €. Dazu kommt, was die Anbieter laut ihren deutschen Nutzungsbedingungen berechnen:',
        {
          list: [
            '**Voi:** 25 € bei einem Verstoss gegen die Parkregeln; Bussgelder der Behörden gibt Voi an dich weiter.',
            '**Bolt:** 15 €, wenn der Scooter falsch steht und kein klares Abstellfoto da ist; bis 100 € Abholgebühr ausserhalb des erlaubten Parkbereichs (Bedingungen gültig ab 1. Dezember 2026).',
            '**Lime:** erst eine Verwarnung, dann eine Strafgebühr, bei Wiederholung die Sperre; Bussgelder und Abschleppkosten gibt Lime weiter.',
          ],
        },
        'Wie teuer schon ein paar Meter sind: Die Stadt liess einen Scooter, der in der Goethestrasse auf einem Blindenleitsystem stand, umsetzen, stellte dem Anbieter dafür 74 € in Rechnung, und das Verwaltungsgericht Frankfurt gab ihr im Juli 2024 recht.',
        'Steht dir ein Scooter im Weg, meldest du ihn in der App oder an der Hotline des Anbieters, auf scooter-melder.de oder in der Falschparker-App von Nivel, die die Stadt nutzt. Laut traffiQ ist eine Beschwerde im Schnitt nach zweieinhalb Stunden erledigt.',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Frankfurt: Alkohol, Nachtregel und Bussgelder',
      blocks: [
        'Die Genehmigung verlangt von den Anbietern an den Tagen Donnerstag bis Sonntag, jeweils von 18 bis 6 Uhr am nächsten Morgen, technische oder softwareseitige Massnahmen gegen Fahrten unter Alkohol- und Drogeneinfluss. Die Stadt nannte einen Reaktionstest vor dem Ausleihen als ein mögliches Mittel.',
        '2025 zählte das Polizeipräsidium Frankfurt in seinem Gebiet, Autobahnen eingeschlossen, 487 Unfälle mit E-Scootern, fast ein Drittel aller in Hessen; Alkohol nannte es als eine der Hauptursachen.',
        'Sonst gelten die deutschen Regeln: keine Helmpflicht (ein Helm ist trotzdem ratsam), nur eine Person pro Scooter. Die wichtigsten Bussgelder:',
        {
          list: [
            '**Gehweg oder Fussgängerzone:** 15 €, ab 1. März 2027 25 €, mit Behinderung oder Gefährdung mehr.',
            '**Zu zweit:** 10 €, ab 1. März 2027 25 €.',
            '**Rote Ampel:** 60 € und ein Punkt in Flensburg. **Handy in der Hand:** 100 € und ein Punkt.',
            '**Alkohol:** ab 0,5 Promille 500 €, zwei Punkte und ein Monat Fahrverbot, auch fürs Auto; ab 1,1 Promille eine Straftat, der Führerschein ist dann in der Regel weg; unter 21 oder in der Probezeit 0,0 Promille. Bolt verbietet laut seinem Vertrag jeden Alkohol.',
          ],
        },
        'Alles Weitere, auch was sich am 1. März 2027 ändert, steht in den [E-Scooter-Regeln für Deutschland](guide:german-rules).',
      ],
    },
    {
      heading: 'E-Scooter-Verbot in U-Bahn und Strassenbahn: VGF, RMV und Call a Bike',
      blocks: [
        'Seit dem 1. Oktober 2024 verbietet die VGF wegen der Brand- und Explosionsgefahr ihrer Akkus E-Tretroller in U-Bahn und Strassenbahn. Das gilt auch für deinen eigenen Scooter; E-Bikes, E-Rollstühle und Seniorenmobile sind nicht betroffen.',
        'In S-Bahn und Regionalzügen behandelt der RMV einen eigenen E-Scooter wie ein Fahrrad: Er fährt kostenlos mit, wenn Platz ist, einen Anspruch darauf hast du aber nicht, und den Akku darfst du an Bord weder ausbauen noch laden. Für Leih-Scooter hat der RMV keine eigene Regel: Beende die Fahrt am besten vor dem Bahnhof und miete am Ziel einen neuen.',
        'Lieber Fahrrad? **DB Call a Bike** hat in Frankfurt Stationen, an denen du die Räder ausleihst und zurückgibst:',
        {
          list: [
            '**Starter:** 1 € fürs Entsperren und 0,12 € pro Minute, höchstens 13 € am Tag pro Fahrt.',
            '**Member Plus:** 8 € im Monat, pro Fahrt 30 Minuten gratis, danach 0,10 € pro Minute.',
          ],
        },
      ],
    },
    {
      heading: 'Messe, Hauptbahnhof und Flughafen: Tipps für Besucher',
      blocks: [
        '**Messe Frankfurt:** Die Hausordnung verbietet das Fahren mit E-Scootern während Veranstaltungen in den Hallen und in den Veranstaltungsbereichen im Freigelände; auf dem übrigen Gelände gilt die Strassenverkehrsordnung. Bei Veranstaltungen kann die Stadt die Anbieter anweisen, Ansammlungen von Scootern binnen drei Stunden wegzuräumen. Zur Buchmesse im Oktober und zu anderen grossen Messen kommst du am bequemsten mit U4 oder S-Bahn.',
        '**Hauptbahnhof:** Er liegt in der Parkverbotszone des Bahnhofsviertels, dort parkst du nur auf markierten Flächen. Wo gerade Scooter von Lime, Voi und Bolt stehen, zeigt die [Live-Karte von Frankfurt](map:de:Frankfurt).',
        '**Flughafen:** Am 30. Oktober 2026 um 10:05 Uhr stand im Umkreis von einem Kilometer um Terminal 1, Terminal 2, Gateway Gardens und The Squaire ein einziger freier Scooter, ein Lime bei Terminal 1; Voi und Bolt hatten dort keinen. Rechne am Flughafen also nicht mit einem Leih-Scooter und nimm vom Regionalbahnhof unter Terminal 1 die S8 oder S9: In rund zwölf Minuten bist du am Hauptbahnhof.',
      ],
    },
    {
      heading: 'Schon gewusst? E-Scooter-Fakten aus Frankfurt',
      blocks: [
        {
          list: [
            'In Frankfurt rollten die ersten Leih-E-Scooter Hessens: Am Samstag, dem 22. Juni 2019, stellte Tier 400 Scooter an 80 Standorten auf, für 15 Cent pro Minute.',
            'Rund 10,49 Millionen Fahrten mit Leih-E-Scootern zählte die Stadt im Jahr 2025.',
            'Im «Shared Micromobility City Performance Index» von ScooP2City, einem Vergleich von 41 Städten und Regionen, kam Frankfurt 2026 auf Platz 1 in Deutschland und Platz 2 in Europa, hinter Antwerpen.',
            'Am Streiktag, dem 2. Februar 2024, als U-Bahn und Strassenbahn stillstanden, zählte allein Voi 12 000 Fahrten in Frankfurt, so viele wie sonst nur in der Hochsaison.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Warum gibt es Dott in Frankfurt nicht mehr?',
      answer: 'Dott ist im Auswahlverfahren der Stadt leer ausgegangen, ebenso Ryde und RideMovi. Seit dem 1. Juli 2026 verleihen nur noch Bolt, Lime und Voi, mit Genehmigungen bis zum 30. Juni 2028.',
    },
    {
      question: 'Wie viele E-Scooter gibt es in Frankfurt?',
      answer: 'Erlaubt sind höchstens 10 500 Leih-Scooter, 3500 pro Anbieter, davon je höchstens 800 in der Innenstadt. Am 30. Oktober 2026 um 9:27 Uhr zeigte unsere Karte rund 3300 Lime-, 3100 Voi- und 3000 Bolt-Scooter, die zu diesem Zeitpunkt frei waren.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über die Zeil fahren?',
      answer: 'Nein, die Zeil ist wie die Fressgass Fussgängerzone: absteigen und schieben. Fahren kostet 15 €, ab 1. März 2027 25 €, und die Polizei kontrolliert dort.',
    },
    {
      question: 'Darf ich einen E-Scooter in der Frankfurter S-Bahn mitnehmen?',
      answer: 'Einen eigenen ja: Der RMV behandelt ihn wie ein Fahrrad und nimmt ihn kostenlos mit, wenn Platz ist. In U-Bahn und Strassenbahn verbietet die VGF E-Scooter seit dem 1. Oktober 2024. Für Leih-Scooter hat der RMV keine eigene Regel; beende die Fahrt am besten vor dem Bahnhof.',
    },
    {
      question: 'Gibt es Leih-E-Scooter am Frankfurter Flughafen?',
      answer: 'Rechne nicht damit: Am 30. Oktober 2026 um 10:05 Uhr stand im Umkreis von einem Kilometer um die Terminals ein einziger freier Scooter, ein Lime. Nimm die S8 oder S9 in die Stadt und steig dort um.',
    },
  ],
  sources: [
    { title: 'Stadt Frankfurt: Auswahlverfahren E-Scooter-Sharing 2026 (PDF)', url: 'https://frankfurt.de/-/media/frankfurtde/frankfurt-themen/verkehr/pdf/e-scooter/e-scooter_ibv.pdf?dmc=1' },
    { title: 'traffiQ: Frankfurt reguliert E-Scooter-Verleih stärker (26. Februar 2026)', url: 'https://www.traffiq.de/traffiq/medien/presse-informationen/presse-information/mehr-ordnung-und-sicherheit-frankfurt-reguliert-e-scooter-verleih-staerker.html' },
    { title: 'traffiQ: Neue Abstellflächen und Parkverbotszonen (Juni 2026, PDF)', url: 'https://www.traffiq.de/fileadmin/user_upload/pdfs/Presse/2026/traffiQ_2026-113_E-Scooter-Stellplaetze.pdf' },
    { title: 'hessenschau: Nur noch drei E-Scooter-Verleiher in Frankfurt (Juli 2026)', url: 'https://www.hessenschau.de/wirtschaft/nur-noch-drei-e-scooter-verleiher-in-frankfurt-v2,scooter-frankfurt-verleiher-100.html' },
    { title: 'Stadt Frankfurt: Grünanlagensatzung (PDF)', url: 'https://media.frag-den-staat.de/files/foi/487672/Gruenanlagensatzung.pdf' },
    { title: 'VGF: Mitnahmeverbot für E-Tretroller in U-Bahn und Strassenbahn', url: 'https://www.vgf-ffm.de/de/fahrtinfo/mitnahme-verbot-e-tretroller' },
    { title: 'RMV: Mitnahme von Fahrrädern, E-Scootern und Co.', url: 'https://www.rmv.de/c/de/tickets/regeln/tarifinformationen/mitnahme-von-fahrraedern-e-scootern-und-co' },
    { title: 'Messe Frankfurt: Hausordnung, Stand Juni 2025 (PDF)', url: 'https://eurobike.com/content/dam/messefrankfurt-fairnamic/2026/documents/de/eurobike-2026-hausordnung.pdf' },
    { title: 'Voi: E-Scooter in Frankfurt', url: 'https://www.voi.com/de/city/frankfurt' },
    { title: 'DB Call a Bike: Preise', url: 'https://www.callabike.de/de/preise' },
    { title: 'Bolt: Nutzungsbedingungen für E-Fahrzeuge, gültig ab 1. Dezember 2026', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Bussgeldkatalog-Verordnung (BKatV), Anlage', url: 'https://www.gesetze-im-internet.de/bkatv_2013/anlage.html' },
    { title: 'Elektrokleinstfahrzeuge-Verordnung (eKFV), § 1', url: 'https://www.gesetze-im-internet.de/ekfv/__1.html' },
    { title: 'Journal Frankfurt: Kontrolle auf Zeil und Fressgass (11. Juni 2026)', url: 'https://www.journal-frankfurt.de/journal_news/stadtleben-2/Kontrolle-in-Frankfurt-Polizei-stoppt-schnelle-E-Scooter-45781.html' },
    { title: 'Journal Frankfurt: Verkehrsunfallstatistik 2025 der Polizei Frankfurt (11. Juni 2026)', url: 'https://www.journal-frankfurt.de/journal_news/wohnenverkehr-153/Verkehrsunfallstatistik-Frankfurt-E-Scooter-immer-haeufiger-in-Unfaelle-verwickelt-45783.html' },
    { title: 'VG Frankfurt, 3. Juli 2024, 12 K 138/24.F (anwaltonline)', url: 'https://www.anwaltonline.com/verkehrsrecht/urteile/36770/kostenbescheid-wegen-umsetzen-von-elektro-scooter-ist-rechtmaessig' },
    { title: 'hessenschau: Erster E-Scooter-Anbieter ist in Frankfurt gestartet (22. Juni 2019)', url: 'https://www.hessenschau.de/wirtschaft/erster-e-scooter-anbieter-ist-in-frankfurt-gestartet,e-scooter-verleih-100.html' },
    { title: 'hessenschau: Studie: Frankfurt top bei E-Scootern und Leihrädern (4. Juni 2026)', url: 'https://www.hessenschau.de/wirtschaft/studie-frankfurt-top-bei-e-scootern-und-leihraedern--umland-bleibt-schwachstelle-v1,roller-frankfurt-102.html' },
    { title: 'Journal Frankfurt: E-Scooter-Boom wegen Streiks (Februar 2024)', url: 'https://www.journal-frankfurt.de/journal_news/Urbanes-Frankfurt-58/E-Scooter-in-Frankfurt-E-Scooter-Boom-in-Frankfurt-wegen-Streiks-41951.html' },
  ],
};

export default guide;
