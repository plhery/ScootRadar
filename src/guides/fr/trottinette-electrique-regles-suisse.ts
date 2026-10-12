import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-electrique-regles-suisse',
  topic: 'swiss-rules',
  name: 'Loi suisse sur la trottinette électrique',
  title: 'Trottinette électrique : loi suisse 2026, âge et amendes',
  description: 'Trottinette électrique et loi suisse en 2026 : âge et permis M, casque, alcool, trottoir, piste cyclable, amendes d’ordre, train CFF et libre-service.',
  headline: 'Trottinette électrique : ce que dit la loi suisse en 2026, de l’âge aux amendes',
  lede: 'La loi suisse traite la trottinette électrique comme un cyclomoteur léger : un moteur de 0,5 kW au plus, qui ne vous pousse pas au-delà de 20 km/h, et les règles des cyclistes sur la route. Vous pouvez rouler dès 14 ans avec un permis de catégorie M et sans permis dès 16 ans ; les opérateurs de libre-service exigent 18 ans. Le casque n’est pas obligatoire, mais les feux doivent être allumés de jour comme de nuit. Interdits : le trottoir (CHF 40 d’amende), les passagers et un taux d’alcool de 0,5 ‰ ou plus.',
  published: '2026-10-12',
  updated: '2026-10-12',
  sections: [
    {
      heading: 'Ce que dit la loi suisse sur la trottinette électrique',
      blocks: [
        'Pour la loi, une trottinette électrique sans selle est un **cyclomoteur léger** (art. 18 OETV) : son moteur l’assiste jusqu’à **20 km/h** au plus, avec une puissance de **0,5 kW** au maximum. C’est un véhicule à moteur, mais vous suivez les règles des cyclistes.',
        'Pas de plaque, pas de vignette, pas d’assurance obligatoire. Si vous causez un dommage, vous en répondez vous-même : vérifiez que votre assurance responsabilité civile privée couvre la trottinette.',
        {
          table: {
            caption: 'Âge et permis pour une trottinette électrique en Suisse',
            head: ['Âge', 'Votre trottinette', 'En libre-service'],
            rows: [
              ['Moins de 14 ans', 'Interdit', 'Interdit'],
              ['14 et 15 ans', 'Avec un permis de catégorie M (ou G)', 'Non, les opérateurs exigent 18 ans'],
              ['16 et 17 ans', 'Sans permis', 'Non, 18 ans minimum'],
              ['18 ans et plus', 'Sans permis', 'Oui'],
            ],
          },
        },
        'Les permis des catégories A, B, C, D, A1, B1, F et G incluent la catégorie M. Rouler sans le permis requis est un délit (art. 95 LCR). Avant 15 ans, aucune amende d’ordre n’est possible : l’enfant est dénoncé et relève du droit pénal des mineurs.',
        'Les cyclomoteurs légers ne sont pas soumis à la réception par type : les modèles en vente ne sont donc pas tous autorisés sur la route. Une trottinette débridée n’est plus un cyclomoteur léger, et la conduire est une infraction pénale. En avril 2026, la police cantonale fribourgeoise en a saisi une qui pouvait atteindre 127 km/h.',
      ],
    },
    {
      heading: 'Casque, feux et passager : ce qui est obligatoire',
      blocks: [
        '**Le casque n’est pas obligatoire** (art. 3b OCR), mais le BPA le recommande vivement. Dans ses conditions, Voi range pourtant le casque parmi les mesures de sécurité exigées, et Dott prévient qu’une blessure à la tête subie sans casque pourrait ne pas être couverte.',
        {
          list: [
            '**Feux allumés en permanence**, de jour comme de nuit, depuis le 1er avril 2022 : blanc fixe à l’avant, rouge fixe à l’arrière. Sans feux de jour, l’amende est de CHF 20.',
            '**Une sonnette** et **un catadioptre arrière** fixe.',
            '**Deux freins** indépendants.',
          ],
        },
        'Selon le TCS, deux tiers des conducteurs de trottinette électrique n’allument pas leurs feux de jour. C’est pourtant l’amende la plus facile à éviter.',
        '**Pas de passager, jamais**, pas même un enfant. Depuis le 1er juillet 2025, l’ordonnance l’écrit noir sur blanc : « Il est interdit de transporter des personnes sur les cycles et les cyclomoteurs dépourvus de place assise pour le conducteur » (art. 63 OCR). La presse parle d’une amende de CHF 20, mais la liste officielle des amendes ne prévoit pas encore clairement ce cas.',
      ],
    },
    {
      heading: 'Trottoir ou piste cyclable : où rouler et où stationner',
      blocks: [
        'Là où il y a une piste ou une bande cyclable, vous devez l’emprunter. Sinon, roulez sur la chaussée.',
        {
          list: [
            '**Trottoir :** interdit (CHF 40), sauf si un signal autorise les cycles ; vous cédez alors le passage aux piétons.',
            '**Zone piétonne :** interdite, sauf si une plaque complémentaire autorise les cycles ; roulez alors au pas.',
            '**Zone de rencontre :** autorisée, à 20 km/h au plus ; les piétons ont la priorité.',
            '**Sens unique :** depuis le 1er juillet 2025, là où une plaque autorise les vélos à contresens, vous pouvez y rouler aussi.',
            '**« Circulation interdite aux cyclomoteurs » :** ce signal ne vous concerne plus depuis la même date. « Circulation interdite aux cycles et cyclomoteurs », si.',
            '**Feu rouge :** vous ne pouvez tourner à droite que si une plaque jaune avec un vélo et une flèche le permet.',
            '**Autoroutes, semi-autoroutes et gares :** interdites. En gare, quais et passages souterrains compris, les CFF interdisent de rouler : poussez la trottinette.',
          ],
        },
        '**Stationner :** sur le trottoir, seulement s’il reste au moins **1,50 m** libre pour les piétons (art. 41 OCR). Depuis le 1er juillet 2025, vous pouvez aussi parquer votre trottinette en zone de rencontre et en zone piétonne, selon les règles générales. Ne bloquez ni une entrée, ni un passage pour piétons, ni une ligne de guidage pour malvoyants : CHF 20.',
      ],
    },
    {
      heading: 'Alcool : la limite de 0,5 ‰',
      blocks: [
        'La limite est de **0,5 ‰** dans le sang (0,25 mg/l dans l’air expiré). Il n’y a **pas de règle spéciale pour les moins de 21 ans**. Et le 0,1 ‰ du permis à l’essai ne s’applique pas : l’ordonnance l’exclut « lors de courses avec des véhicules des catégories spéciales F, G et M ».',
        'Pour les drogues (THC, cocaïne, amphétamines…), c’est tolérance zéro, sauf prescription médicale.',
        {
          list: [
            '**De 0,5 à 0,79 ‰ :** une amende fixée dans une procédure pénale ordinaire, pas une amende d’ordre.',
            '**Dès 0,8 ‰ :** une peine privative de liberté de trois ans au plus ou une peine pécuniaire, et une interdiction de circuler d’au moins un mois avec les véhicules à moteur qui ne demandent pas de permis, trottinette comprise.',
          ],
        },
        'Si vous avez un permis de conduire, une course en trottinette avec trop d’alcool peut aussi entraîner son retrait : l’autorité cantonale décide au cas par cas.',
      ],
    },
    {
      heading: 'Les amendes d’ordre en trottinette électrique',
      blocks: [
        'Fixés par la Confédération, les montants sont les mêmes dans toute la Suisse et n’ont pas changé depuis 2024.',
        {
          table: {
            caption: 'Amendes d’ordre pour une trottinette électrique, en vigueur en octobre 2026',
            head: ['Infraction', 'Amende'],
            rows: [
              ['Rouler sur le trottoir', 'CHF 40'],
              ['Ne pas laisser passer un piéton sur un passage pour piétons', 'CHF 40'],
              ['Téléphoner sans kit mains libres en roulant', 'CHF 40'],
              ['Brûler un feu rouge', 'CHF 60'],
              ['Rouler sans feux de jour', 'CHF 20'],
              ['Rouler sans feux de nuit', 'CHF 40 (rue éclairée) ou 60 (rue non éclairée)'],
              ['Ne pas prendre la piste ou la bande cyclable', 'CHF 30'],
              ['Entrer dans une zone piétonne ou sur un chemin pour piétons', 'CHF 30'],
              ['Dépasser la limite de vitesse', 'CHF 30'],
              ['Tourner à gauche sans le signaler de la main', 'CHF 30'],
              ['Mal stationner (moins de 1,50 m libre, entrée bloquée…)', 'CHF 20'],
              ['Pas de sonnette / pas de catadioptre arrière', 'CHF 20 / 40'],
            ],
          },
        },
        'Vous payez sur place ou dans les 30 jours, sans frais ; sans domicile en Suisse, tout de suite ou en versant une caution. Vous pouvez aussi refuser l’amende d’ordre : la procédure ordinaire s’applique alors. Au-delà de CHF 600 d’amendes cumulées, ou si quelqu’un a été mis en danger ou blessé, c’est d’office la procédure pénale ordinaire, comme pour l’alcool, le débridage ou la conduite sans permis.',
      ],
    },
    {
      heading: 'Trottinette électrique dans le train CFF',
      blocks: [
        'Votre trottinette, électrique ou non, voyage **gratuitement** si sa plus grande roue mesure moins de **12 pouces (30,5 cm)** de diamètre. Pliez-la si la place manque. Dès 12 pouces, elle compte comme un vélo : il lui faut un billet vélo et, si nécessaire, une réservation. Le personnel peut la refuser si le train est plein.',
        'Selon les CFF, la règle vaut dans les transports publics en général ; aux heures de pointe, certaines entreprises de bus et de trams peuvent avoir leurs propres règles.',
        'Une trottinette en libre-service, elle, ne vous suit pas dans le train : terminez la course à la gare et louez-en une autre à l’arrivée. La garder coûte cher : si elle n’est pas rendue dans les 48 heures, Lime peut facturer jusqu’à CHF 1540 et Bolt jusqu’à CHF 500.',
      ],
    },
    {
      heading: 'Libre-service, touristes et frontaliers',
      blocks: [
        'Lime, Bolt, Voi, Dott, Bird et PubliBike exigent tous **18 ans** dans leurs conditions suisses, et une seule personne par trottinette.',
        'L’assurance responsabilité civile incluse passe **après la vôtre** : chez Lime, Bolt et Voi, elle est subsidiaire à votre RC privée et, selon la dernière attestation publiée par Dott (valable jusqu’au 30 juin 2026), son assurance ne payait qu’en complément de la vôtre. PubliBike n’en inclut aucune. Les passagers ne sont jamais couverts.',
        'L’app vous montre où terminer la course et où la trottinette ralentit ou s’arrête. Les frais de l’opérateur s’ajoutent aux amendes : Voi peut facturer CHF 25 pour un mauvais stationnement, après des avertissements, et Bolt jusqu’à CHF 100 pour récupérer une trottinette laissée hors zone.',
        'Pour trouver la plus proche, tous opérateurs confondus, ouvrez [la carte](/map) ; un bouton ouvre ensuite l’app de l’opérateur, où vous déverrouillez et payez. À [Bienne](map:ch:biel), par exemple, elle montre les trottinettes de Voi et de PubliBike.',
        '**Touristes :** dès 16 ans, aucun permis n’est exigé, quelle que soit votre nationalité. À 14 et 15 ans, il faut le permis suisse de catégorie M ; nous n’avons pas pu confirmer qu’un permis étranger suffise, alors mieux vaut s’abstenir. Les conditions des opérateurs ne demandent pas de domicile en Suisse.',
        '**Frontaliers :** de l’autre côté de la frontière, les règles changent. Avant de rouler en France, lisez [les règles de la trottinette électrique en France](guide:french-rules).',
      ],
    },
    {
      heading: 'Nouvelle loi 2026 ? Ce qui a changé et ce qui se prépare',
      blocks: [
        'Le dernier grand changement date du **1er juillet 2025** :',
        {
          list: [
            'la limite reste de 20 km/h sans selle, et les modèles avec selle peuvent aller jusqu’à 25 km/h ;',
            'les passagers sont interdits, et la trottinette ne peut plus avoir de place pour eux ;',
            'les plaques avec un vélo valent aussi pour les trottinettes, et « Circulation interdite aux cyclomoteurs » ne les vise plus ;',
            'on peut parquer en zone de rencontre et en zone piétonne.',
          ],
        },
        '**Au 12 octobre 2026, aucune nouvelle règle fédérale n’est entrée en vigueur cette année** pour les trottinettes. Les débats, eux, continuent :',
        {
          list: [
            '**Casque :** le 30 avril 2026, le Conseil national a rejeté, par 122 voix contre 33, une motion qui voulait rendre le casque et le permis obligatoires pour les scooters électriques et les véhicules similaires. Le 19 août 2026, le Conseil fédéral s’est dit prêt à mettre en consultation un casque obligatoire pour les trottinettes électriques, lors d’une prochaine révision de l’ordonnance, sans projet ni date à ce jour.',
            '**Immatriculation et assurance :** la motion 26.3637 veut les rendre obligatoires. Le 19 août 2026, le Conseil fédéral a proposé de la rejeter ; le Parlement n’a pas encore voté.',
            '**Débridage :** le Conseil fédéral veut préciser les règles.',
            '**Train :** le syndicat du personnel des transports SEV demande un billet pour les trottinettes ; le tarif des CFF n’a pas changé.',
          ],
        },
      ],
    },
    {
      heading: 'Genève et Lausanne : contrôles et libre-service',
      blocks: [
        'À Genève, les contrôles sont renforcés depuis le **1er octobre 2026**, selon Léman Bleu (7 octobre 2026). La chaîne relevait qu’en douze mois, il n’y avait eu que 16 amendes, mais 551 trottinettes saisies. Les amendes restent celles de la liste fédérale : CHF 40 sur le trottoir, CHF 20 sans feux de jour.',
        'Nous n’avons pas pu confirmer quels opérateurs de libre-service sont autorisés à Genève et à Lausanne. ScootRadar n’affichait aucun véhicule autour de Genève et de Lausanne le 12 octobre 2026, ce qui ne veut pas dire qu’aucun opérateur n’y circule.',
      ],
    },
  ],
  faq: [
    {
      question: 'Faut-il un permis pour conduire une trottinette électrique en Suisse ?',
      answer: 'Dès 16 ans, non. À 14 et 15 ans, il faut un permis de catégorie M (ou G) ; avant 14 ans, c’est interdit. Pour louer une trottinette en libre-service, il faut avoir 18 ans.',
    },
    {
      question: 'Le casque est-il obligatoire en Suisse ?',
      answer: 'Non, il est seulement recommandé. En août 2026, le Conseil fédéral s’est dit prêt à mettre en consultation un casque obligatoire pour les trottinettes électriques, mais il n’y a encore ni projet ni date.',
    },
    {
      question: 'Quelle est la vitesse maximale d’une trottinette électrique ?',
      answer: 'Le moteur ne doit pas vous pousser au-delà de 20 km/h. En descente, aller plus vite n’est pas interdit en soi, mais les limitations de vitesse s’appliquent : CHF 30 d’amende en cas d’excès.',
    },
    {
      question: 'Y a-t-il une nouvelle loi sur les trottinettes électriques en 2026 ?',
      answer: 'Pas en Suisse : au 12 octobre 2026, le dernier changement date du 1er juillet 2025. Les articles sur une « nouvelle loi 2026 » parlent surtout de la France et d’autres pays voisins.',
    },
    {
      question: 'Faut-il une assurance ou une vignette pour une trottinette électrique ?',
      answer: 'Non. En Suisse, une trottinette électrique n’a ni plaque, ni vignette, ni assurance obligatoire. Si vous causez un dommage, c’est en général votre RC privée qui paie, si vous en avez une : vérifiez qu’elle couvre la trottinette.',
    },
    {
      question: 'Combien coûte l’amende pour rouler sur le trottoir ?',
      answer: 'CHF 40, partout en Suisse. Stationner sur le trottoir est permis s’il reste 1,50 m libre pour les piétons ; sinon, c’est CHF 20.',
    },
  ],
  sources: [
    { title: 'Ordonnance sur les règles de la circulation routière (OCR), RS 741.11', url: 'https://www.fedlex.admin.ch/eli/cc/1962/1364_1409_1420/fr' },
    { title: 'Ordonnance concernant les exigences techniques requises pour les véhicules routiers (OETV), RS 741.41', url: 'https://www.fedlex.admin.ch/eli/cc/1995/4425_4425_4425/fr' },
    { title: 'Ordonnance réglant l’admission des personnes et des véhicules à la circulation routière (OAC), RS 741.51', url: 'https://www.fedlex.admin.ch/eli/cc/1976/2423_2423_2423/fr' },
    { title: 'Ordonnance sur les amendes d’ordre (OAO) et sa liste des amendes, RS 314.11', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/fr' },
    { title: 'Loi sur les amendes d’ordre (LAO), RS 314.1', url: 'https://www.fedlex.admin.ch/eli/cc/2017/725/fr' },
    { title: 'Ordonnance de l’Assemblée fédérale concernant les taux limites d’alcool admis en matière de circulation routière, RS 741.13', url: 'https://www.fedlex.admin.ch/eli/cc/2015/493/fr' },
    { title: 'CFF : le vélo et la trottinette comme bagage à main', url: 'https://www.sbb.ch/fr/informations-voyages/besoins-individuels/voyager-avec-velo/velo-bagage-main.html' },
    { title: 'Parlement : motion 26.3637, immatriculation et assurance obligatoires pour les trottinettes électriques', url: 'https://www.parlament.ch/fr/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20263637' },
    { title: 'Parlement : motion 26.3010, casque et permis pour les scooters électriques et les véhicules similaires', url: 'https://www.parlament.ch/fr/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20263010' },
    { title: 'Léman Bleu : trottinettes sur les trottoirs, des amendes rares (7 octobre 2026)', url: 'https://www.lemanbleu.ch/fr/Actualites/Geneve/Trottinettes-sur-les-trottoirs-des-amendes-rares.html' },
  ],
};

export default guide;
