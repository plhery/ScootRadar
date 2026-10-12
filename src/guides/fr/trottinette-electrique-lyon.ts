import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-electrique-lyon',
  topic: 'lyon',
  name: 'Louer une trottinette électrique à Lyon',
  title: 'Trottinette électrique à Lyon en 2026 : casque, Dott, prix',
  description: 'Trottinette électrique à Lyon : casque et gilet obligatoires dans le Rhône, prix de Dott, où se garer, zones lentes, Villeurbanne et Vélo’v.',
  headline: 'Trottinette électrique à Lyon : casque obligatoire, Dott, prix et stationnement en 2026',
  lede: 'Pour louer une trottinette électrique à Lyon, il n’y a plus qu’un opérateur autorisé, Dott : 18 ans minimum, 1 € pour déverrouiller puis 0,29 € la minute, soit 3,90 € les 10 minutes (tarif publié le 12 octobre 2026). Depuis le 28 septembre 2026, le casque et un gilet haute visibilité sont obligatoires dans tout le Rhône, de jour comme de nuit : 135 € d’amende sans casque, 35 € sans gilet. La location se termine uniquement sur un emplacement indiqué dans l’app, et Villeurbanne n’a pas de trottinettes en libre-service.',
  published: '2026-10-12',
  updated: '2026-10-12',
  city: 'fr:Lyon',
  sections: [
    {
      heading: 'Casque obligatoire en trottinette à Lyon et dans le Rhône',
      blocks: [
        'Depuis le **lundi 28 septembre 2026**, l’arrêté préfectoral n° 69-2026-09 impose le casque et le gilet haute visibilité à tout conducteur de trottinette électrique dans **tout le département du Rhône**, Métropole de Lyon comprise. Il vise aussi les gyropodes, monoroues et hoverboards, mais pas les vélos.',
        {
          list: [
            '**Qui** : tout le monde, sur une trottinette personnelle comme sur une Dott louée.',
            '**Où et quand** : sur toutes les voies ouvertes à la circulation, **pistes cyclables comprises**, de jour comme de nuit.',
            '**Quoi** : un casque aux normes et attaché, et un gilet haute visibilité ou un équipement rétroréfléchissant.',
            '**Combien** : **135 €** sans casque, **35 €** sans gilet.',
          ],
        },
        'La préfecture a annoncé une période de pédagogie avant des contrôles stricts, sans en donner la fin. L’arrêté cite un chiffre qui parle : dans le Rhône, la nuit concentre 38 % des accidents de trottinettes et d’engins semblables, mais 64 % des morts.',
        { note: 'Ne comptez pas sur Dott pour le casque : selon l’opérateur, les boîtes à casque essayées ailleurs coûtaient cher, servaient peu et se faisaient voler. Prenez le vôtre, et un gilet.' },
      ],
    },
    {
      heading: 'Location de trottinette à Lyon : Dott, seul opérateur, et ses prix',
      blocks: [
        'La Ville avait retenu Dott et Tier en 2020. Les deux ont fusionné, et depuis le **1er janvier 2025**, seul **Dott** est autorisé, avec environ 3 500 trottinettes. Ses conditions : **18 ans minimum**, âge vérifié dans l’app, vitesse bridée à **20 km/h**, trottinettes immatriculées et usagers assurés par l’opérateur.',
        {
          table: {
            caption: 'Trottinette Dott à Lyon : tarif publié par Dott le 12 octobre 2026 et conditions',
            head: ['Dott à Lyon', 'Au 12 octobre 2026'],
            rows: [
              ['Déverrouillage', '1 €'],
              ['Prix à la minute', '0,29 €'],
              ['Trajet de 10 minutes', '3,90 €'],
              ['Trajet de 20 minutes', '6,80 €'],
              ['Âge minimum', '18 ans'],
              ['Vitesse maximale', '20 km/h, moins dans les zones lentes'],
              ['Fin de la location', 'Uniquement sur un emplacement Dott indiqué dans l’app'],
            ],
          },
        },
        'Ce tarif vient du flux de données public de Dott, hors pass et promotions ; l’app affiche le prix final. Pour la marche à suivre, lisez notre guide [louer une trottinette électrique](guide:how-to-rent).',
        'Le 12 octobre 2026, ScootRadar affichait environ 3 500 trottinettes Dott sur la [carte autour de Lyon](map:fr:Lyon) ; un bouton ouvre l’app Dott, où vous déverrouillez et payez.',
        '**Et après février 2027 ?** L’autorisation de Dott arrive à échéance fin février 2027, selon Laurent Bosetti, adjoint au maire chargé des mobilités. La Ville a annoncé un nouvel appel à projets, prévu selon lui entre septembre et décembre 2026 ; au 12 octobre 2026, nous ne l’avions pas vu publié. L’opérateur peut donc changer en 2027.',
      ],
    },
    {
      heading: 'Où garer sa trottinette électrique à Lyon',
      blocks: [
        'À Lyon, pas question de laisser la trottinette n’importe où : vous terminez la location **uniquement sur un emplacement Dott**, signalé par un P dans l’app. Le 12 octobre 2026, Dott en publiait 1 366, dont 1 177 dans Lyon. Ils sont inégalement répartis : repérez-en un avant de partir.',
        {
          list: [
            '**Gare de la Part-Dieu** : une demi-douzaine seulement à moins de 400 m.',
            '**Jean-Macé** : 27 à moins de 400 m.',
            '**Bellecour, Terreaux, Saint-Jean, Croix-Rousse** : quatre ou cinq à moins de 200 m.',
            '**Entrée principale du parc de la Tête d’Or** : aucun à moins de 200 m.',
          ],
        },
        'Mal se garer coûte cher. Tant que la location n’est pas correctement terminée, le compteur tourne. Les conditions de Dott prévoient aussi jusqu’à **300 €** de frais de récupération si vous ne suivez pas ses consignes de stationnement, **50 €** de pénalité pour toute violation des conditions, et la refacturation de vos amendes avec **50 €** de frais. Côté police, le stationnement gênant coûte 35 €, fourrière possible.',
      ],
    },
    {
      heading: 'Zones lentes et zones interdites : où rouler à Lyon',
      blocks: [
        'La trottinette est bridée à 20 km/h, et l’app la ralentit ou l’arrête à certains endroits. Ces zones changent souvent : **l’app fait foi**. Quelques exemples relevés le 12 octobre 2026, parmi plus d’une centaine de zones lentes et 90 zones interdites :',
        {
          table: {
            caption: 'Zones lentes et interdites dans l’app Dott à Lyon (exemples relevés le 12 octobre 2026)',
            head: ['Dans l’app Dott', 'Exemples'],
            rows: [
              ['7 km/h au plus', 'Place Bellecour, place des Terreaux, rue de la République aux Cordeliers, place Carnot, rue Saint-Jean dans le Vieux Lyon, et beaucoup de petites places et rues piétonnes'],
              ['10 km/h au plus', 'Parc de la Tête d’Or, parc Sergent-Blandan'],
              ['Interdit d’y rouler', 'Hôtel-Dieu, pôle de loisirs de Confluence, abords des théâtres romains de Fourvière'],
              ['20 km/h, sans zone particulière', 'Berges du Rhône, quais de Saône à Saint-Paul, Part-Dieu, Perrache, plateau de la Croix-Rousse'],
            ],
          },
        },
        'L’app ne remplace pas le Code de la route : dans une aire piétonne, roulez au pas, quoi que permette l’app ; sur le trottoir, c’est interdit (135 €). Prenez la piste cyclable s’il y en a une, sinon une rue limitée à 50 km/h au plus. Lyon est « Ville 30 » depuis le 30 mars 2022 : dans les rues à 30 km/h, vous pouvez rouler à contresens comme un vélo, sauf panneau contraire.',
      ],
    },
    {
      heading: 'Amendes en trottinette à Lyon : les règles qui coûtent cher',
      blocks: [
        'Les contrôles se multiplient : selon la Ville, environ 1 300 amendes ont visé des usagers de trottinettes et d’engins semblables de janvier à août 2026, et 232 engins ont fini en fourrière en juillet et août.',
        {
          table: {
            caption: 'Les amendes les plus courantes en trottinette à Lyon (octobre 2026)',
            head: ['Infraction', 'Amende'],
            rows: [
              ['Sans casque, partout dans le Rhône', '135 €'],
              ['Sans gilet ni équipement rétroréfléchissant, de jour comme de nuit', '35 €'],
              ['Rouler sur le trottoir', '135 €'],
              ['À deux sur la trottinette', '135 €'],
              ['Écouteurs ou téléphone en main', '135 €'],
              ['Feu rouge grillé', '135 €'],
              ['Alcool de 0,5 à moins de 0,8 g/l', '135 €'],
              ['Stationnement gênant', '35 €, fourrière possible'],
            ],
          },
        },
        'Rouler à deux est l’infraction propre aux trottinettes la plus relevée en France. À Lyon, 1 000 trottinettes de la nouvelle flotte Dott testent un détecteur de passager : la trottinette ralentit et un message invite le passager à louer la sienne. Le reste des règles nationales est dans notre guide de la [réglementation de la trottinette électrique en France](guide:french-rules).',
      ],
    },
    {
      heading: 'Trottinette à Villeurbanne et dans les communes voisines',
      blocks: [
        '**Villeurbanne n’a pas de trottinettes en libre-service.** Un arrêté municipal de 2019 y interdit de les laisser sur les trottoirs et dans les espaces piétons ; Lime en a retiré les siennes la même année, et le maire, Cédric Van Styvendael, entend s’y tenir. Pour aller aux Gratte-Ciel ou sur le campus de la Doua, terminez la location sur un emplacement côté Lyon, puis continuez à pied, en Vélo’v ou en TCL.',
        'Dott roule aussi à Caluire-et-Cuire, Rillieux-la-Pape, La Mulatière et Sathonay-Camp, avec la même règle de stationnement. Pour trouver la trottinette la plus proche, ouvrez la [carte de Lyon](map:fr:Lyon).',
      ],
    },
    {
      heading: 'Vélo’v ou trottinette : l’alternative à Lyon',
      blocks: [
        'Là où la trottinette ne va pas, ou sans casque sous la main, prenez un **Vélo’v**, le vélo en libre-service de la Métropole : l’arrêté du préfet ne concerne pas les vélos. Tarifs sur le site de Vélo’v au 12 octobre 2026 :',
        {
          list: [
            '**Ticket occasionnel** : à partir de 1,80 € pour un trajet ou une journée.',
            '**Vélo’v Classique** : à partir de 15 € par an, les 30 ou 45 premières minutes de chaque trajet gratuites en vélo mécanique.',
            '**Vélo’v Plus** : à partir de 49,20 € par an, jusqu’à six trajets électriques par jour, les 30 premières minutes gratuites.',
            '**Offre Découverte Mobilités** : trois mois gratuits pour les adultes de la Métropole qui n’ont pas été abonnés depuis trois ans.',
          ],
        },
        'À comparer avec 5,35 € pour 15 minutes en trottinette Dott.',
      ],
    },
    {
      heading: 'Collines, tram, aéroport : conseils pour rouler à Lyon',
      blocks: [
        {
          list: [
            '**Les collines.** Fourvière et la Croix-Rousse sont dans la zone Dott, avec des emplacements en haut, dont un à 55 m de la basilique. Dans les descentes, freinez tôt.',
            '**Les rails du tram.** Traversez-les le plus perpendiculairement possible, surtout sous la pluie.',
            '**L’aéroport et le stade.** Lyon-Saint-Exupéry est bien au-delà de la zone Dott : prenez le Rhônexpress à la gare Part-Dieu. Pour le Groupama Stadium, à Décines, vérifiez dans l’app : le 12 octobre 2026, la zone publiée par Dott pour Lyon ne l’incluait pas.',
          ],
        },
      ],
    },
    {
      heading: 'Trottinettes à Lyon : le saviez-vous ?',
      blocks: [
        {
          list: [
            'En 2019, Voi lançait ses trottinettes à Lyon à **1 € plus 0,15 € la minute**, presque deux fois moins cher qu’aujourd’hui à la minute.',
            'À l’automne 2019, des citoyens, plongeurs compris, ont repêché **212 trottinettes** dans le Rhône et la Saône en un peu plus d’un mois.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Le casque est-il obligatoire en trottinette électrique à Lyon ?',
      answer: 'Oui, depuis le 28 septembre 2026, dans tout le Rhône, pour les trottinettes louées comme personnelles, de jour comme de nuit et pistes cyclables comprises. Il faut aussi un gilet haute visibilité ou un équipement rétroréfléchissant. Sans casque, l’amende est de 135 € ; sans gilet, de 35 €.',
    },
    {
      question: 'Peut-on louer une trottinette à Lyon avant 18 ans ?',
      answer: 'Non : la Ville impose 18 ans en libre-service, et l’app de Dott vérifie votre âge. La loi fixe l’âge minimum à 14 ans : avant 18 ans, à Lyon, vous ne pouvez donc rouler que sur une trottinette personnelle.',
    },
    {
      question: 'Combien coûte une trottinette Dott à Lyon ?',
      answer: '1 € pour déverrouiller, puis 0,29 € la minute, selon le tarif publié par Dott le 12 octobre 2026 : 3,90 € pour 10 minutes, 6,80 € pour 20 minutes. L’app affiche le prix final.',
    },
    {
      question: 'Lime ou Tier sont-ils encore à Lyon ?',
      answer: 'Non. Tier a fusionné avec Dott, seul opérateur autorisé par la Ville depuis le 1er janvier 2025, et les comptes Tier sont passés dans l’app Dott. Lime n’a plus de trottinettes à Lyon depuis que la Ville a choisi Dott et Tier en 2020.',
    },
    {
      question: 'Peut-on prendre une trottinette dans le métro à Lyon ?',
      answer: 'Pas une Dott : elle ne se plie pas, et le règlement des TCL, tel que la presse le citait en 2019, n’admet que les trottinettes pliables et pliées, sans rouler dans le réseau. Terminez la location sur un emplacement près de la station, puis prenez le métro ou le funiculaire.',
    },
    {
      question: 'Que deviennent les trottinettes à Lyon après février 2027 ?',
      answer: 'L’autorisation de Dott arrive à échéance fin février 2027, selon l’adjoint au maire chargé des mobilités, et la Ville a annoncé un nouvel appel à projets, que nous n’avions pas vu publié au 12 octobre 2026. L’opérateur peut donc changer.',
    },
  ],
  sources: [
    { title: 'Préfecture du Rhône : arrêté n° 69-2026-09 du 28 septembre 2026 imposant le casque et le gilet haute visibilité aux conducteurs d’EDPM (copie publiée par la commune de Ternay)', url: 'https://www.ternay.fr/wp-content/uploads/2026/09/ap_signe_port_casque_gilet_haute_visibilite_edpm_rhone.pdf' },
    { title: 'Ville de Lyon : Plus de sécurité pour les usagers de l’espace public (28 septembre 2026)', url: 'https://www.lyon.fr/actualite/mobilites/plus-de-securite-pour-les-usagers-de-lespace-public' },
    { title: 'Ville de Lyon : Renforcement des contrôles des trottinettes électriques (3 juillet 2026)', url: 'https://www.lyon.fr/node/939328' },
    { title: 'Dott : conditions générales d’utilisation en France (mises à jour le 23 septembre 2025)', url: 'https://ridedott.com/fr/conditions-generales/france/' },
    { title: 'Dott : flux de données public (GBFS) de Lyon, tarif, emplacements et zones', url: 'https://gbfs.api.ridedott.com/public/v2/lyon/' },
    { title: 'Vélo’v (Métropole de Lyon) : offres et tarifs', url: 'https://velov.grandlyon.com/fr/offers/groups' },
    { title: 'Visit Lyon : la trottinette Dott, communes desservies et stationnement', url: 'https://www.visiterlyon.com/sejourner/venir-et-se-deplacer-a-lyon/transport-et-transfert/dott' },
    { title: 'Tribune de Lyon : Dott, la sécurité des trottinettes et la fin de l’autorisation en 2027 (7 mai 2026)', url: 'https://tribunedelyon.fr/transports/lyon-dott-trottinettes-securite/' },
    { title: 'Lyon Capitale : la Ville de Lyon conserve un opérateur unique de trottinettes en libre-service (19 décembre 2024)', url: 'https://www.lyoncapitale.fr/actualite/trottinettes-en-libre-service-la-ville-de-lyon-conserve-un-operateur-unique-sans-nouvel-appel-a-projets' },
    { title: 'LyonMag : Villeurbanne garde son interdiction des trottinettes en libre-service (28 août 2026)', url: 'https://www.lyonmag.com/article/153741/' },
  ],
};

export default guide;
