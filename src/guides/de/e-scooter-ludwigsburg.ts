import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'de',
  slug: 'e-scooter-ludwigsburg',
  topic: 'ludwigsburg',
  name: 'E-Scooter Ludwigsburg: Anbieter, Preise, Parken',
  title: 'E-Scooter Ludwigsburg 2026: Dott, Zeus, ab 2027 Lime und Voi',
  description: 'E-Scooter in Ludwigsburg leihen: Dott oder Zeus ab 18, ab 2027 Lime und Voi. Preise, Hubs mit Bonus, Verbotszonen am Schloss und was in Bus und S-Bahn gilt.',
  headline: 'E-Scooter Ludwigsburg: Dott und Zeus bis Silvester, Hubs mit Bonus und kein Scooter im Blühenden Barock',
  lede: 'Einen E-Scooter in Ludwigsburg leihst du bis 31. Dezember 2026 bei Dott oder Zeus, ab 18 und ohne Führerschein; ab 1. Januar 2027 werden laut Stadt Lime und Voi die Leih-Scooter stellen. Du fährst auf dem Radweg, sonst auf der Fahrbahn, nie auf dem Gehweg; über Markt- und Rathausplatz darfst du, wenn dort kein Markt ist. Abstellen kannst du an den Hubs der Stadt, die einen Bonus bringen, oder am Gehwegrand, wenn 2 m frei bleiben.',
  published: '2026-11-24',
  updated: '2026-11-24',
  city: 'de:Ludwigsburg',
  sections: [
    {
      heading: 'Welche E-Scooter-Anbieter gibt es in Ludwigsburg?',
      blocks: [
        'In Ludwigsburg vermieten bis Ende 2026 **Dott**, früher TIER, und **Zeus** E-Scooter. Ihre Verträge mit der Stadt laufen zum Jahresende aus; ab 1. Januar 2027 werden laut Stadt **Lime** und **Voi** die Leih-Scooter stellen.',
        'Am Mittwoch, 25. November 2026, um 7:27 Uhr zeigte die [Karte von Ludwigsburg](map:de:Ludwigsburg) innerhalb der Stadtgrenze rund 160 Dott- und 30 Zeus-Scooter, die zu diesem Zeitpunkt frei waren. Die meisten standen in den Wohnvierteln; rund um Marktplatz und Bahnhof waren es nur wenige.',
        'Gemietet wird in der App. Schritt für Schritt: [So mietest du einen E-Scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Was kostet ein E-Scooter in Ludwigsburg?',
      blocks: [
        'Beide Anbieter berechnen eine Gebühr zum Entsperren und einen Preis pro Minute; die App zeigt beides, bevor du entsperrst.',
        {
          table: {
            caption: 'E-Scooter-Preise in Ludwigsburg (Stand 25. November 2026)',
            head: ['Anbieter', 'Entsperren', 'Pro Minute', '10 Minuten', '20 Minuten'],
            rows: [
              ['Dott', '1 €', '0,47 €', '5,70 €', '10,40 €'],
              ['Zeus', '0 €, 0,50 € oder 1 €, je nach Scooter', '0,23 €', '2,30 € bis 3,30 €', '4,60 € bis 5,60 €'],
            ],
          },
        },
        'Teuer wird Falschparken: Dott kann laut seinen Bedingungen (23. September 2025) bis zu 300 € für die Rückgabe verlangen, wenn du Park- und Sperranweisungen nicht befolgst; Zeus laut seinen (14. April 2023) 120 €, wenn du ihn ausserhalb des Geschäftsgebiets abstellst.',
      ],
    },
    {
      heading: 'E-Scooter in Ludwigsburg abstellen: Hubs, Verbotszonen und 2 m Gehweg',
      blocks: [
        'Laut der Seite der Stadt stellst du einen Leih-Scooter am besten an einem ihrer E-Scooter-Hubs ab, etwa am Bahnhof, an der Wilhelm-Galerie, am Marstall-Center oder in den Stadtteilen. Dafür bekommst du einen Bonus.',
        {
          list: [
            '**Frei abstellen** darfst du auch, solange der Scooter niemanden behindert und 2 m Gehweg frei bleiben. In Grünflächen ist Abstellen verboten.',
            '**Verbotszonen:** Die Karte der Stadt mit Fahr- und Abstellverbotszonen (Stand Dezember 2021) ist laut Stadt in den Apps hinterlegt. Bei Dott beendest du eine Fahrt etwa nicht auf Markt- und Rathausplatz (Stand November 2026); bei Zeus zeigt die App die Zonen.',
          ],
        },
        {
          note: 'Lässt dich die App die Fahrt nicht beenden, stehst du meist in einer Verbotszone, und die Miete läuft weiter. Fahr zum nächsten Hub, den die App zeigt.',
        },
        'Steht ein Leih-Scooter im Weg, meldest du ihn beim Anbieter (Dott: support@ridedott.com, Zeus: support@zeusscooters.com) oder im Mängelmelder der Stadt unter «E-Scooter».',
      ],
    },
    {
      heading: 'Wo darf man in Ludwigsburg mit dem E-Scooter fahren? Innenstadt und Marktplatz',
      blocks: [
        'Du fährst auf dem Radweg, dem Radfahrstreifen oder dem Schutzstreifen und nur dort, wo es nichts davon gibt, auf der Fahrbahn. Gehwege und Fussgängerzonen sind tabu; schieben darfst du.',
        {
          list: [
            '**Markt- und Rathausplatz:** Wie mit dem Fahrrad darfst du laut der Seite der Stadt über beide Plätze fahren, solange dort kein Markt und keine Veranstaltung ist. Der Wochenmarkt ist dienstags und donnerstags von 7 bis 13 Uhr und samstags von 7 bis 14 Uhr; vom 17. November bis 26. Dezember 2026 weicht er auf den Rathaushof aus.',
            '**Barock-Weihnachtsmarkt:** Bis 22. Dezember 2026 belegt er täglich ab 11 Uhr Marktplatz und Arsenalplatz. Seine Hausordnung (Stand November 2023) verbietet, Fahrräder, Roller und Ähnliches mitzunehmen: Stell den Scooter vorher ab.',
            '**Fussgängerzone:** Heute öffnet sie für E-Scooter nur das Zusatzzeichen «Elektrokleinstfahrzeuge frei». Ab 1. März 2027 wird bundesweit auch «Radverkehr frei» genügen, dann im Schritttempo. Was gilt, zeigt das Schild an der Einfahrt.',
          ],
        },
        'Dott hat das Gelände von Residenzschloss und Blühendem Barock als Fahrverbotszone eingetragen und begrenzt seine Scooter im übrigen Gebiet auf 19 km/h (Stand November 2026).',
      ],
    },
    {
      heading: 'Bahnhof Ludwigsburg: Hausordnung der Bahn und Hubs',
      blocks: [
        'Im Bahnhof Ludwigsburg gilt die Hausordnung der Deutschen Bahn (Stand Oktober 2026): Mit dem E-Scooter fährst du dort nicht, du schiebst oder trägst ihn. An Zugängen, auf Bahnsteigen und ausserhalb der dafür ausgewiesenen Flächen stellst du ihn nicht ab, sonst kann die DB ihn auf deine Kosten entfernen.',
        'Draussen liegt ein Hub der Stadt, in der Dott-App «Hub Bahnhof I» und «Hub Bahnhof II»; entlang der Gleise beendest du keine Dott-Fahrt.',
        'Hier halten die S4 (Backnang–Marbach–Stuttgart) und die S5 (Bietigheim-Bissingen–Stuttgart); bis Stuttgart Hauptbahnhof sind es laut Tourismus & Events Ludwigsburg 12 Minuten, zum Marktplatz gehst du rund 10.',
      ],
    },
    {
      heading: 'E-Scooter im Bus und in der S-Bahn: was der VVS erlaubt',
      blocks: [
        'Ludwigsburg gehört zum VVS. Zusammengeklappt gilt ein E-Tretroller dort als Sache und fährt jederzeit kostenlos mit. Nicht zusammengeklappt gilt er als Fahrrad: höchstens 2 m lang und 40 kg schwer, mit den Zeiten der Fahrradmitnahme.',
        {
          list: [
            '**S-Bahn und Regionalzug:** Montag bis Freitag vor 6 und nach 9 Uhr sowie am Wochenende und an Feiertagen ganztags kostenlos; werktags von 6 bis 9 Uhr brauchst du dafür ein Kinderticket.',
            '**Busse im Landkreis Ludwigsburg:** Montag bis Freitag ab 18:30 Uhr, am Wochenende und an Feiertagen rund um die Uhr, bis zu zwei pro Bus, festgehalten im Stehplatzbereich an der zweiten Tür. Rollstuhl und Kinderwagen haben Vorrang, im Zweifel entscheidet der Fahrer.',
            '**Gar nicht** mit darf er in Kleinbusse, Linien- und Ruftaxis und Ersatzbusse für die S-Bahn.',
          ],
        },
        'Einen Leih-Scooter kannst du nicht zusammenklappen: Beende die Fahrt an einem Hub vor dem Bahnhof und miete am Ziel neu.',
      ],
    },
    {
      heading: 'Schloss, Blühendes Barock, PH und Filmakademie: Tipps für Ludwigsburg',
      blocks: [
        {
          list: [
            '**Residenzschloss und Blühendes Barock:** Laut Parkordnung sind Fahrräder, Roller, Skateboards, Segways und Ähnliches im Park nicht erlaubt. Beende die Fahrt vorher, etwa am Hub am Marstall-Center.',
            '**Favoritepark:** Das Naturschutzgebiet betrittst du laut ForstBW nur in den Bereichen, die seine Karte zeigt; Hunde bleiben draussen. Auf der Karte der Stadt ist der Park Fahrverbotszone.',
            '**Pädagogische Hochschule:** Die PH an der Reuteallee 46 liegt laut Hochschule rund 3 Minuten zu Fuss von der S-Bahn-Station Favoritepark (S4); vom Busbahnhof fährt der Bus 424 Richtung IKEA hin. Auf dem grössten Teil des Geländes beendest du keine Dott-Fahrt; Dotts Platz «Favoritenpark» liegt an der S-Bahn-Station.',
            '**Filmakademie:** Sie teilt sich den Akademien-Campus am Akademiehof, gleich südlich des Rathausplatzes, mit der Akademie für Darstellende Kunst. Auf dem Campus beendest du keine Dott-Fahrt.',
          ],
        },
      ],
    },
    {
      heading: 'Über die Stadtgrenze: Kornwestheim, Stuttgart und die Nachbarorte',
      blocks: [
        'Wo deine Fahrt enden darf, legt jeder Anbieter mit seinem Gebiet fest. Dotts Gebiet folgte im November 2026 weitgehend der Stadtgrenze und reichte weder nach Kornwestheim noch nach Stuttgart; verlässt du es, kann Dott den Scooter laut seinen Bedingungen abschalten.',
        'Prüf vor einer Fahrt nach Asperg, Tamm, Möglingen oder Remseck in der App, ob dein Ziel im Gebiet liegt. Nach Kornwestheim und Stuttgart nimmst du die S4 oder S5: [E-Scooter in Stuttgart](guide:stuttgart).',
      ],
    },
    {
      heading: 'E-Scooter-Regeln in Ludwigsburg: Alter, Helm, Alkohol, Bussgelder',
      blocks: [
        'In Ludwigsburg gelten die deutschen Regeln: Einen eigenen E-Scooter fährst du ab 14 ohne Führerschein, einen Leih-Scooter bei Dott und Zeus laut ihren Bedingungen ab 18. Einen Helm empfiehlt die Stadt, Pflicht ist er nicht. Auf einem Scooter fährt nur eine Person, bauartbedingt höchstens 20 km/h. Ein eigener Scooter braucht eine Versicherungsplakette.',
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
      heading: 'Was die Stadt Ludwigsburg für Leih-Scooter regelt',
      blocks: [
        'Leih-Scooter regelt Ludwigsburg über Verträge mit den Anbietern; die mit Dott und Zeus laufen zum Jahresende aus. Laut Stadt ist die Zahl im Stadtgebiet auf 400 Leih-Scooter begrenzt, bei höchstens zwei Anbietern mit je bis zu 200 (Stand November 2026). Die rund 160 Dott- und 30 Zeus-Scooter oben sind eine Momentaufnahme (Zählung der Karte, nicht die Flotte).',
        'Die Hubs und die Karte mit den Verbotszonen stammen von der Stadt. Beschwerden aus dem Mängelmelder leitet sie an den Anbieter weiter.',
      ],
    },
    {
      heading: 'Was sich am 1. Januar 2027 ändert: Lime und Voi',
      blocks: [
        'Ab 1. Januar 2027 werden **Lime** und **Voi** die Leih-Scooter stellen; sie haben laut Stadt das Auswahlverfahren gewonnen (16. November 2026). Die Obergrenze wird bei 400 Scootern bleiben, höchstens 200 je Anbieter. Laut Stadt wird bei beiden gelten:',
        {
          list: [
            '**Foto zum Schluss:** Eine Fahrt wirst du nur beenden können, wenn du ein Foto des richtig geparkten Scooters schickst; die Fotos werden mit KI geprüft.',
            '**Zonen und Hubs:** In Parkverbotszonen wird sich die Miete nicht beenden lassen; für das Abstellen an Hubs wird es einen finanziellen Anreiz geben.',
            '**Schulung:** Vor der ersten Fahrt werden eine Schulung und ein Sicherheitsquiz Pflicht sein.',
            '**Umstellen:** Falsch abgestellte Scooter werden die Anbieter zeitnah umstellen müssen.',
          ],
        },
        'Guthaben, Freifahrten und Abos von Dott und Zeus wirst du nicht übertragen können. Die Preise werden Lime und Voi in ihrer App zeigen; das Mindestalter legen laut Stadt die Anbieter fest, in der Regel 18.',
      ],
    },
    {
      heading: 'Schon gewusst? Ludwigsburg und die E-Scooter',
      blocks: [
        {
          list: [
            '**Über 180.000 Fahrten im Jahr.** So viele Fahrten mit Leih-Scootern zählt die Stadt jährlich (November 2026).',
            '**«Radverkehr frei» reicht noch nicht.** Ein Mann fuhr mit dem E-Scooter auf einem so beschilderten Gehweg, dann auf die Strasse, wo ihn ein Auto erfasste. Das Amtsgericht Ludwigsburg verweigerte ihm Prozesskostenhilfe für eine Klage: Das Schild gebe den Gehweg nur für Fahrräder frei, die Schuld liege bei ihm (berichtet im März 2026).',
            '**Endstation Ludwigsburg.** Die S-Bahnen der heutigen S4 fuhren zunächst nur bis Ludwigsburg; 1980 kam Marbach dazu, im Dezember 2012 Backnang.',
            '**Hirsche aus Indien.** Im Favoritepark lebt Axiswild, eine indische Hirschart, 1811 eingesetzt. Das Gelände der heutigen PH gehörte einst zum Park; es wurde im 18. Jahrhundert wegen Schulden verkauft.',
            '**Vom Kasernenhof zum Filmcampus.** Wo Anfang der 1990er-Jahre verlassene Kasernenhöfe und Parkplatzbrachen lagen, steht heute der Akademien-Campus mit der Filmakademie.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Welche E-Scooter-Apps kann ich in Ludwigsburg nutzen?',
      answer: 'Bis 31. Dezember 2026 die von Dott und Zeus, ab 18 und ohne Führerschein; ab 1. Januar 2027 werden es Lime und Voi sein. Freie Scooter zeigt auch die [Live-Karte von Ludwigsburg](map:de:Ludwigsburg).',
    },
    {
      question: 'Was kostet ein E-Scooter in Ludwigsburg?',
      answer: 'Zehn Minuten kosteten am 25. November 2026 bei Dott 5,70 € (1 € plus 0,47 € pro Minute), bei Zeus je nach Scooter 2,30 € bis 3,30 € (0 bis 1 € plus 0,23 € pro Minute).',
    },
    {
      question: 'Wo darf ich in Ludwigsburg einen Leih-Scooter abstellen?',
      answer: 'Am besten an einem Hub der Stadt, etwa am Bahnhof, an der Wilhelm-Galerie oder am Marstall-Center; dafür gibt es einen Bonus. Sonst am Gehwegrand, wenn 2 m frei bleiben, nicht in Grünflächen und Verbotszonen.',
    },
    {
      question: 'Darf ich mit dem E-Scooter über den Ludwigsburger Marktplatz fahren?',
      answer: 'Laut Stadt ja, wie mit dem Fahrrad, solange dort kein Markt und keine Veranstaltung ist; bis 22. Dezember 2026 steht dort der Barock-Weihnachtsmarkt. Eine Dott-Fahrt beendest du auf dem Marktplatz nicht.',
    },
    {
      question: 'Darf ich einen E-Scooter in Bus und S-Bahn mitnehmen?',
      answer: 'Zusammengeklappt jederzeit kostenlos. Sonst gilt er beim VVS als Fahrrad: in der S-Bahn werktags von 6 bis 9 Uhr nur mit Kinderticket, im Bus werktags erst ab 18:30 Uhr, am Wochenende jederzeit.',
    },
    {
      question: 'Was ändert sich 2027 in Ludwigsburg?',
      answer: 'Ab 1. Januar 2027 werden Lime und Voi die Leih-Scooter stellen; Fahrten wirst du dann nur mit Foto beenden können. Ab 1. März 2027 wird bundesweit auch «Radverkehr frei» Gehwege und Fussgängerzonen für E-Scooter öffnen, im Schritttempo.',
    },
  ],
  sources: [
    { title: 'Stadt Ludwigsburg: E-Scooter (undatiert, gelesen am 25. November 2026)', url: 'https://www.ludwigsburg.de/start/leben+in+ludwigsburg/e-scooter.html' },
    { title: 'Stadt Ludwigsburg: Neue Anbieter für E-Scooter-Sharing ab 2027 (16. November 2026)', url: 'https://www.ludwigsburg.de/start/rathaus+und+service/neue+anbieter+fuer+e-scooter-sharing+ab+2027.html' },
    { title: 'Stadt Ludwigsburg: Geschäftsgebiet mit Fahr- und Abstellverbotszonen und E-Scooter-Hubs (Stand 1. Dezember 2021, PDF)', url: 'https://www.ludwigsburg.de/site/Ludwigsburg-Internet-2020/get/documents_E-1896512480/lb/dictionaries/NachhaltigeMobilit%C3%A4t/20220118_%20Empfohlene%20Scoote_2.pdf' },
    { title: 'Stuttgarter Zeitung: Ludwigsburg setzt auf zwei neue Anbieter beim E-Scooter-Verleih (16. November 2026)', url: 'https://www.stuttgarter-zeitung.de/lokales/ludwigsburg/wechsel-zum-neuen-jahr-ludwigsburg-setzt-auf-zwei-neue-anbieter-beim-e-scooter-verleih-79705845.html' },
    { title: 'Dott: Allgemeine Geschäftsbedingungen Deutschland (23. September 2025)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Dott: offener Datenfeed für Ludwigsburg (GBFS: Tarif, Zonen, Stationen)', url: 'https://gbfs.api.ridedott.com/public/v2/ludwigsburg/gbfs.json' },
    { title: 'Zeus: Allgemeine Geschäftsbedingungen (14. April 2023)', url: 'https://zeusscooters.com/terms-and-conditions/' },
    { title: 'Zeus: offener Datenfeed für Ludwigsburg (GBFS: Tarif)', url: 'https://zeus.city/api/v1/mds/gbfs/ludwigsburg/gbfs.json' },
    { title: 'Deutsche Bahn: Hausordnung der Bahnhöfe (Stand Oktober 2026, PDF)', url: 'https://www.bahnhof.de/cms/downloads/e53df3cd-1990-4504-9219-18ddd141396b/HausordnungDE.pdf' },
    { title: 'VVS: Fahrradmitnahme und E-Tretroller in Bus und Bahn', url: 'https://www.vvs.de/fahrradmitnahme' },
    { title: 'S-Bahn Stuttgart: Fahrpläne und Liniennetz', url: 'https://www.s-bahn-stuttgart.de/s-stuttgart/fahrplaene_und_liniennetz/Fahrplaene-und-Liniennetz-S-Bahn-Stuttgart-7553636' },
    { title: 'Tourismus & Events Ludwigsburg: Ludwigsburger Wochenmarkt', url: 'https://visit.ludwigsburg.de/start/events/ludwigsburger+wochenmarkt.html' },
    { title: 'Tourismus & Events Ludwigsburg: Ludwigsburger Barock-Weihnachtsmarkt 2026', url: 'https://visit.ludwigsburg.de/start/events/ludwigsburger+barock-weihnachtsmarkt.html' },
    { title: 'Tourismus & Events Ludwigsburg: Hausordnung des Barock-Weihnachtsmarkts (22. November 2023, PDF, verlinkt auf der Seite von 2026)', url: 'https://visit.ludwigsburg.de/site/Ludwigsburg-Tourismus/get/params_E-1260463479/21750591/231122_WM-Hausordnung_A4.pdf' },
    { title: 'Blühendes Barock Ludwigsburg: Parkordnung', url: 'https://www.blueba.de/de/Parkordnung.html' },
    { title: 'ForstBW: Favoritepark Ludwigsburg (PDF)', url: 'https://www.forstbw.de/fileadmin/user_upload/ForstBW_Favoritepark_LB.pdf' },
    { title: 'Pädagogische Hochschule Ludwigsburg: Directions and maps (englisch)', url: 'https://www.ph-ludwigsburg.de/en/directions-maps' },
    { title: 'Filmakademie Baden-Württemberg: Kontakt und Anfahrt', url: 'https://www.filmakademie.de/de/kontakt-anfahrt' },
    { title: 'Filmakademie Baden-Württemberg: Der Campus', url: 'https://www.filmakademie.de/de/ueber-die-fabw/der-campus' },
    { title: 'echo24 (dpa): Gericht: «Radverkehr frei» gilt nicht für E-Scooter (Amtsgericht Ludwigsburg, Az. 3 C 2052/24, 27. März 2026)', url: 'https://www.echo24.de/leben/auto/gericht-radverkehr-frei-gilt-nicht-fuer-scooter-zr-94237817.html' },
    { title: 'Gesetze im Internet: Elektrokleinstfahrzeuge-Verordnung (eKFV)', url: 'https://www.gesetze-im-internet.de/ekfv/BJNR075610019.html' },
    { title: 'Gesetze im Internet: Bussgeldkatalog-Verordnung, Anlage', url: 'https://www.gesetze-im-internet.de/bkatv_2013/anlage.html' },
    { title: 'Kraftfahrt-Bundesamt: Tatbestandskatalog (Stand 8. Oktober 2026)', url: 'https://www.kba.de/DE/Themen/ZentraleRegister/FAER/BT_KAT_OWI/btkat_node.html' },
  ],
};

export default guide;
