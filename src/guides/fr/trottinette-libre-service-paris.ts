import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-libre-service-paris',
  topic: 'paris',
  name: 'Trottinette en libre-service à Paris',
  title: 'Trottinette libre-service à Paris : que louer en 2026 ?',
  description: 'Trottinette libre-service à Paris : interdite depuis 2023. Prix des Vélib’ et des vélos Lime, Dott, Voi, trottinettes les plus proches, règles pour la vôtre.',
  headline: 'Trottinette en libre-service à Paris : interdite depuis 2023, que louer à la place ?',
  lede: 'Il n’y a plus de trottinette en libre-service à Paris depuis le 1er septembre 2023 : à la votation du 2 avril 2023, 89,03 % des votants ont dit « contre », avec 7,46 % de participation. À la place, prenez un Vélib’ (3 € le trajet de 45 minutes) ou un vélo électrique Lime, Dott ou Voi (0,29 € la minute chez Voi, sans frais de déverrouillage, tarif publié le 12 octobre 2026). Les trottinettes en libre-service les plus proches roulent en grande banlieue, autour de Versailles, à Saint-Quentin-en-Yvelines ou à Marne-la-Vallée, casque obligatoire. Votre propre trottinette reste permise dans Paris, avec casque et gilet à toute heure depuis le 7 août 2026.',
  published: '2026-10-12',
  updated: '2026-10-13',
  city: 'fr:Versailles Grand Parc',
  sections: [
    {
      heading: 'Pourquoi les trottinettes en libre-service sont interdites à Paris',
      blocks: [
        'Le dimanche 2 avril 2023, la Ville de Paris a posé une seule question à ses habitants : « Pour ou contre les trottinettes en libre-service ? » On votait sur place uniquement, dans 203 bureaux.',
        {
          table: {
            caption: 'Résultats de la votation du 2 avril 2023 (Ville de Paris)',
            head: ['Résultat', 'Voix', 'Part'],
            rows: [
              ['Contre', '91 385', '89,03 % des suffrages exprimés'],
              ['Pour', '11 256', '10,97 %'],
              ['Blancs ou nuls', '443', '–'],
              ['Participation', '103 084 votants sur 1 382 322 inscrits', '7,46 %'],
            ],
          },
        },
        'Le ministre des Transports de l’époque, Clément Beaune, a jugé ce taux de participation « humiliant ». La votation n’était qu’une consultation, mais la Ville l’a suivie : les conventions de Dott, Lime et Tier ont pris fin le 31 août 2023 à minuit. Chacun pouvait en déployer 5 000 au plus, soit 15 000 en tout.',
        'Au 12 octobre 2026, aucun retour n’a été annoncé à notre connaissance, pas même depuis l’élection d’Emmanuel Grégoire à la mairie, le 29 mars 2026.',
      ],
    },
    {
      heading: 'Vélib’ et vélos électriques en libre-service : les prix à Paris',
      blocks: [
        '**Vélib’ Métropole**, ce sont 20 000 vélos, dont environ 40 % électriques, dans un peu moins de 1 500 stations à Paris et dans 66 communes voisines. À Paris, il y en a une tous les 300 mètres.',
        {
          table: {
            caption: 'Tarifs Vélib’ Métropole au 12 octobre 2026',
            head: ['Offre', 'Prix', 'Ce qui est inclus'],
            rows: [
              ['Ticket-V', '3 €', 'Un trajet de 45 min, vélo mécanique ou électrique'],
              ['Pass 24h Classique', '5 €', '24 h ; vélo mécanique gratuit 30 min par trajet ; vélo électrique à 2 € le trajet'],
              ['Pass 24h Électrique', '10 €', '24 h ; vélo mécanique gratuit 60 min par trajet ; 5 trajets électriques de 45 min offerts'],
              ['Pass 3 jours', '20 €', '72 h, comme le Pass 24h Électrique'],
            ],
          },
        },
        'Au-delà du temps compris, comptez 1 € (mécanique) ou 2 € (électrique) par demi-heure. Tickets et passes s’achètent sur le site ou l’app Vélib’, ou dans l’app Île-de-France Mobilités, qui permet ensuite de déverrouiller le vélo avec un passe Navigo ; les passes, aussi dans Bonjour RATP.',
        '**Lime, Dott et Voi** font chacun rouler 3 000 à 6 000 vélos électriques sans station, sous une convention de quatre ans entrée en vigueur le 1er octobre 2025.',
        {
          table: {
            caption: 'Vélo en libre-service à Paris : prix d’un trajet (tarifs publiés au 12 octobre 2026)',
            head: ['Service', 'Déverrouillage', 'Par minute', '10 min', '20 min'],
            rows: [
              ['Voi', '0 €', '0,29 €', '2,90 €', '5,80 €'],
              ['Dott', '1 €', '0,35 €', '4,50 €', '8 €'],
              ['Lime', 'Non publié', 'Non publié', 'Voir l’app', 'Voir l’app'],
              ['Vélib’ (Ticket-V)', '3 € le trajet', '45 min incluses', '3 €', '3 €'],
            ],
          },
        },
        'Depuis le 1er octobre 2025, un vélo partagé se gare sur un emplacement vélo sans arceaux ou à un groupe d’au moins quatre arceaux, jamais sur le trottoir.',
      ],
    },
    {
      heading: 'Location de trottinette électrique à Paris : magasins et scooters',
      blocks: [
        'Louer une trottinette électrique en magasin, à l’heure ou à la journée, ou suivre une balade guidée reste légal : l’interdiction ne vise que le libre-service. Les règles sont alors celles d’une trottinette personnelle ; demandez au loueur un casque et un gilet.',
        'Pour avancer sans pédaler, il reste les scooters électriques en libre-service de **Yego** et de **Cooltra**. Ce sont des deux-roues motorisés : vérifiez dans l’app le permis demandé.',
      ],
    },
    {
      heading: 'Où trouver une trottinette en libre-service près de Paris ?',
      blocks: [
        'Pas dans Paris, ni, à notre connaissance, en petite couronne : aucun opérateur n’y publie de données de trottinettes. Le 12 octobre 2026 vers 10 h 45, la carte en montrait environ 1 650 en grande banlieue ; le soir, la plus proche de Notre-Dame était à environ 14 km à vol d’oiseau, à Bougival.',
        {
          table: {
            caption: 'Trottinettes en libre-service près de Paris : tarifs publiés et relevé de la carte, le 12 octobre 2026',
            head: ['Secteur', 'Opérateur', 'Tarif publié', '10 min / 20 min', 'Sur la carte à 10 h 45'],
            rows: [
              ['Autour de Versailles (La Celle-Saint-Cloud, Le Chesnay-Rocquencourt, Bougival)', 'Dott', '1 € + 0,25 €/min', '3,50 € / 6 €', 'Environ 100'],
              ['Saint-Quentin-en-Yvelines (Montigny-le-Bretonneux, Guyancourt, Trappes…)', 'Voi', '0,49 € + 0,25 €/min', '2,99 € / 5,49 €', 'Environ 680'],
              ['Grand Paris Seine et Oise (Poissy, Conflans-Sainte-Honorine, Mantes-la-Jolie…)', 'Voi', '0,49 € + 0,23 €/min', '2,79 € / 5,09 €', 'Environ 540'],
              ['Marne-la-Vallée (Lagny-sur-Marne, Bussy-Saint-Georges, Montévrain)', 'Dott', '1 € + 0,29 €/min', '3,90 € / 6,80 €', 'Environ 180'],
              ['Évry-Courcouronnes', 'Pony', '1 € + 0,23 €/min', '3,30 € / 5,60 €', 'Environ 150'],
            ],
          },
        },
        'Ce relevé n’est pas la taille des flottes, et le prix final est celui de l’app.',
        {
          list: [
            '**Autour de Versailles** : aucune dans la commune même. Vers 18 h, la Dott la plus proche du château était à environ 1,4 km, au Chesnay-Rocquencourt. [La carte autour de Versailles](map:fr:Versailles Grand Parc) montre aussi des Voi de Saint-Quentin.',
            '**Saint-Quentin-en-Yvelines** : Voi, dans les 12 communes de l’agglomération ; on prend et on rend la trottinette en station. [Saint-Quentin-en-Yvelines sur la carte](map:fr:Saint-Quentin-en-Yvelines).',
            '**Grand Paris Seine et Oise** : Voi depuis le 4 mai 2026, en trois pôles séparés : impossible d’aller de Poissy à Meulan. Il faut avoir 18 ans, la vitesse tombe à 10 km/h près des écoles et des ponts, et la location court jusqu’à ce que la trottinette soit garée en station. [Le Grand Paris Seine et Oise sur la carte](map:fr:Grand Paris Seine et Oise).',
            '**Marne-la-Vallée** : Dott, mais aucune à Chessy ou à Serris le 12 octobre 2026 ; vers 18 h, la plus proche de Disneyland Paris était à environ 1,1 km, à Montévrain. [Marne-la-Vallée sur la carte](map:fr:Marne-la-Vallée (SIEMU)).',
            '**Évry-Courcouronnes** : Pony, depuis mars 2022.',
          ],
        },
        { note: 'Prévoyez votre casque. Dans les Yvelines (environs de Versailles, Saint-Quentin, Seine et Oise), le casque et le gilet ou un équipement réfléchissant sont obligatoires à toute heure depuis le 15 septembre 2026 ; en Seine-et-Marne, un arrêté du 2 juillet 2026 impose le casque et un équipement réfléchissant. L’Essonne a suivi le 5 octobre 2026 : casque et gilet ou équipement rétroréfléchissant, de jour comme de nuit, pistes cyclables comprises.' },
        'Ailleurs qu’en Seine et Oise, vérifiez l’âge minimum dans l’app. Première location ? Voyez [comment louer une trottinette en libre-service](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Casque, gilet, trottoir : rouler avec sa trottinette à Paris',
      blocks: [
        'Votre trottinette électrique reste permise à Paris dès 14 ans, si elle est assurée et construite pour ne pas dépasser 25 km/h. Depuis le 7 août 2026, un arrêté du préfet de police y impose le casque et le gilet à toute heure, comme en petite couronne ; les vélos ne sont pas concernés.',
        {
          table: {
            caption: 'Trottinette électrique à Paris : les règles qui coûtent le plus cher (12 octobre 2026)',
            head: ['Règle', 'Ce qu’il faut faire', 'Amende'],
            rows: [
              ['Casque', 'À toute heure, pistes cyclables comprises', '135 €'],
              ['Gilet', 'Ou équipement réfléchissant, à toute heure', '35 €'],
              ['Trottoir', 'Ne jamais y rouler : poussez', '135 €'],
              ['Passager', 'Une seule personne à bord', '135 €'],
              ['Écouteurs, téléphone en main', 'Pas même une oreillette', '135 €'],
              ['Feu rouge', 'S’arrêter, comme tout conducteur', '135 €'],
              ['Assurance', 'Responsabilité civile obligatoire', '500 € (délit)'],
            ],
          },
        },
        'Prenez la piste cyclable s’il y en a une, sinon la chaussée d’une rue limitée à 50 km/h ou moins. Paris étant limité à 30 km/h presque partout depuis le 30 août 2021, la quasi-totalité des rues vous est ouverte, mais jamais le périphérique. Dans une aire piétonne, roulez au pas ; dans les parcs et jardins, poussez.',
        'Le reste (alcool, débridage, toutes les amendes) est dans notre guide de la [réglementation de la trottinette électrique en France](guide:french-rules).',
      ],
    },
    {
      heading: 'Où garer sa trottinette électrique à Paris ?',
      blocks: [
        'Depuis un arrêté du maire publié le 30 juillet 2019, une trottinette ne se gare ni sur le trottoir, ni dans une aire piétonne, ni sur la chaussée : utilisez les places pour deux-roues motorisés, où elle stationne gratuitement. Garée ailleurs, elle peut vous valoir une amende, dont la Ville ne publie pas le montant.',
      ],
    },
    {
      heading: 'Trottinette dans le métro, le RER, le bus et le tram',
      blocks: [
        'Sur tout le réseau RATP (métro, RER sur ses tronçons RATP, bus, tram, funiculaire de Montmartre), une trottinette pliante doit rester pliée et tenue à la main en permanence dans les véhicules. Rouler dans un couloir, une correspondance ou sur un quai, ou la garder dépliée à bord, coûte 150 €, plus 50 € de frais de dossier sans paiement immédiat. « Un engin déplié, même immobile, n’est pas en règle », prévient la RATP.',
        'Dans les trains SNCF, faites de même et vérifiez les conditions de la SNCF avant de partir.',
      ],
    },
    {
      heading: 'Le saviez-vous ?',
      blocks: [
        {
          list: [
            '**Aucun arrondissement n’a voté pour.** Même Paris Centre, le plus favorable, n’a donné que 14,23 % au « pour ».',
            '**Paris en attendait 40 000.** En juin 2019, la Ville en comptait près de 20 000 et prévoyait jusqu’à 40 000 à la fin de l’année.',
            '**Beaucoup sont restées en banlieue.** Selon l’AFP, Tier comptait garder un tiers de sa flotte parisienne autour de Marne-la-Vallée ou de Saint-Germain-en-Laye. Dott, qui a absorbé Tier, roule toujours autour de Marne-la-Vallée.',
            '**À Évry, on pouvait posséder une trottinette en libre-service.** Au lancement de Pony, en 2022, les habitants pouvaient en acheter une et toucher 50 % des recettes de ses trajets.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Les trottinettes Lime vont-elles revenir à Paris ?',
      answer: 'Rien ne l’annonce au 12 octobre 2026, à notre connaissance. Lime est toujours à Paris, mais avec des vélos électriques seulement, comme Dott et Voi, sous une convention de quatre ans entrée en vigueur le 1er octobre 2025.',
    },
    {
      question: 'Peut-on encore louer une trottinette électrique à Paris ?',
      answer: 'Pas en libre-service. En magasin, à l’heure ou à la journée, c’est légal, avec casque et gilet à toute heure. Les trottinettes en libre-service les plus proches sont en grande banlieue, par exemple autour de Versailles ou à Saint-Quentin-en-Yvelines.',
    },
    {
      question: 'Quelle est l’amende sans casque en trottinette à Paris ?',
      answer: '135 € depuis le 7 août 2026, à toute heure et même sur piste cyclable, à Paris et en petite couronne. Sans gilet ni équipement réfléchissant, c’est 35 €. Les Vélib’ et les vélos électriques ne sont pas concernés.',
    },
    {
      question: 'Combien coûte un Vélib’ pour une journée ?',
      answer: '5 € avec le Pass 24h Classique : trajets en vélo mécanique gratuits pendant 30 minutes, vélo électrique à 2 € le trajet. Le Pass 24h Électrique, à 10 €, inclut cinq trajets électriques de 45 minutes.',
    },
    {
      question: 'Y a-t-il des trottinettes en libre-service à Versailles ?',
      answer: 'Pas dans la commune même, au 12 octobre 2026. Des Dott roulent juste à côté, au Chesnay-Rocquencourt, à La Celle-Saint-Cloud et à Bougival. Dans les Yvelines, casque et gilet sont obligatoires à toute heure depuis le 15 septembre 2026.',
    },
  ],
  sources: [
    { title: 'Ville de Paris : Fin des trottinettes en libre-service à Paris le 31 août 2023 (résultats de la votation)', url: 'https://www.paris.fr/pages/pour-ou-contre-les-trottinettes-en-libre-service-23231' },
    { title: 'Ville de Paris : Interdiction des trottinettes en libre-service, les Parisiens voteront (résultats par secteur)', url: 'https://www.paris.fr/pages/interdiction-des-trottinettes-en-libre-service-les-parisiens-voteront-22954' },
    { title: 'Ville de Paris : Vélo en libre-service, bientôt un troisième opérateur à Paris (1er octobre 2025)', url: 'https://www.paris.fr/pages/velo-en-libre-service-bientot-un-troisieme-operateur-a-paris-31482' },
    { title: 'Ville de Paris : Trottinettes électriques, de nouvelles règles de circulation (mise à jour du 10 août 2026)', url: 'https://www.paris.fr/pages/trottinettes-electriques-de-nouvelles-regles-de-circulation-7249' },
    { title: 'Préfecture de police : arrêté n° 2026-00969 du 7 août 2026 (casque et gilet à Paris et en petite couronne)', url: 'https://cdn.paris.fr/paris/2026/08/10/arrete-2026_00969_07082026-1-nPt1.pdf' },
    { title: 'Vélib’ Métropole : offres et tarifs', url: 'https://www.velib-metropole.fr/offers' },
    { title: 'RATP : Puis-je emporter mon vélo ou ma trottinette ?', url: 'https://www.ratp.fr/aide-contact/questions/preparer-mon-trajet/voyage-en-regle/emporter-velo-trottinette' },
    { title: 'RATP : Le réseau en trottinette', url: 'https://www.ratp.fr/services-aux-voyageurs/services-de-mobilite/le-reseau-en-trottinette' },
    { title: 'Ville de Meulan-en-Yvelines : les trottinettes Voi dans le Grand Paris Seine et Oise', url: 'https://ville-meulan.fr/print/pdf/node/2348' },
    { title: 'Préfecture des Yvelines : arrêté n° 78-2026-09-07-00004 sur le casque et le gilet (copie publiée par Bois-d’Arcy)', url: 'https://www.boisdarcy.fr/arrete-pref.pdf' },
    { title: 'Commune de Vauhallan : De nouvelles règles pour les trottinettes électriques en Essonne (12 octobre 2026)', url: 'https://www.vauhallan.fr/actualites/de-nouvelles-regles-pour-les-trottinettes-electriques-en-essonne-4675' },
  ],
};

export default guide;
