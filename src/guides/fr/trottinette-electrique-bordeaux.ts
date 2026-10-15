import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-electrique-bordeaux',
  topic: 'bordeaux',
  name: 'Louer une trottinette électrique à Bordeaux',
  title: 'Trottinette électrique à Bordeaux en 2026 : Dott, Pony, prix',
  description: 'Trottinette électrique à Bordeaux : prix de Dott et Pony, où se garer, zones lentes, Talence, tram, aéroport, et Le Vélo by TBM comme alternative.',
  headline: 'Trottinette électrique à Bordeaux : Dott, Pony, prix, zones et stationnement en 2026',
  lede: 'Pour louer une trottinette électrique à Bordeaux, vous avez le choix entre **Dott** et **Pony**, que Bordeaux Métropole autorise à déployer 1 000 trottinettes chacun jusqu’en novembre 2029 ; il faut avoir 18 ans. Chez l’un comme chez l’autre, comptez 1 € pour déverrouiller puis 0,29 € la minute, soit 3,90 € les 10 minutes, selon leurs données publiques du 13 octobre 2026. La location se termine uniquement sur un emplacement marqué au sol, et à Talence, restée en dehors du dispositif, c’est presque partout impossible.',
  published: '2026-10-13',
  updated: '2026-10-14',
  city: 'fr:Bordeaux',
  sections: [
    {
      heading: 'Location de trottinette à Bordeaux : Dott, Pony et leurs prix',
      blocks: [
        'Retenus par Bordeaux Métropole à l’issue d’un appel à manifestation d’intérêt, **Dott** et **Pony** sont autorisés du **1er novembre 2025 au 1er novembre 2029**, avec au plus **1 000 trottinettes et 1 000 vélos chacun**. Leurs trottinettes sont bridées à 20 km/h.',
        {
          table: {
            caption: 'Prix d’un trajet à Bordeaux en trottinette ou en vélo, au 13 octobre 2026',
            head: ['Service', 'Déverrouillage', 'Par minute', '10 min', '20 min'],
            rows: [
              ['Dott (trottinette ou vélo électrique)', '1 €', '0,29 €', '3,90 €', '6,80 €'],
              ['Pony (trottinette ou vélo électrique)', '1 €', '0,29 €', '3,90 €', '6,80 €'],
              ['Le Vélo by TBM (vélo électrique en station)', '2 €, 30 premières minutes comprises', '0,10 € au-delà', '2 €', '2 €'],
            ],
          },
        },
        'Les prix de Dott et Pony sont ceux de leurs données publiques, hors pass et promotions. Le même jour, la page bordelaise de Pony affichait 0,26 € la minute : seul compte le prix que l’app indique avant le déverrouillage.',
        'Le 13 octobre 2026, la [carte de Bordeaux](map:fr:Bordeaux) de ScootRadar montrait environ 1 000 trottinettes Dott et autant de Pony : un relevé, pas la taille des flottes. Un bouton ouvre l’app de l’opérateur, où vous déverrouillez et payez. Première fois ? Voyez [comment louer une trottinette électrique](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Où garer sa trottinette électrique à Bordeaux',
      blocks: [
        'Vous terminez la location **uniquement sur un emplacement marqué au sol** (pictogramme de trottinette), que l’app vous indique : un « P » bleu chez Pony. Les arceaux sont réservés aux vélos. Les données ouvertes de la Métropole recensent **595** emplacements en octobre 2026, dont **556 pour les trottinettes** et 272 à Bordeaux même. Repérez-en un avant de partir (données des opérateurs, 13 octobre 2026) :',
        {
          list: [
            '**Place de la Comédie** : 9 emplacements de chaque opérateur à moins de 400 m ; **Quinconces** : 12.',
            '**Place Pey-Berland** et **quai Richelieu** : 3 de chaque à moins de 200 m.',
            '**Miroir d’eau** : aucun à moins de 200 m, et Pony interdit de se garer quai de la Douane ; visez le quai Richelieu.',
            '**Gare Saint-Jean** : 2 de chaque à moins de 200 m du parvis, où Pony interdit de se garer.',
          ],
        },
        '**Mal se garer coûte cher.** Hors emplacement, l’app refuse de terminer la location et le compteur tourne ; Pony demande en plus une photo à la fin. Les conditions de Dott prévoient jusqu’à **300 €** de frais de récupération si vous ne suivez pas ses consignes de stationnement, et **50 €** de pénalité pour toute violation de ses conditions. Côté police, le stationnement gênant coûte 35 €, fourrière possible.',
      ],
    },
    {
      heading: 'Zones lentes et zones interdites : où rouler à Bordeaux',
      blocks: [
        'Dott et Pony fixent chacun leurs zones, où l’app ralentit la trottinette, l’arrête ou refuse la fin de location. Elles changent : **l’app fait foi**. Exemples relevés dans leurs données le 13 octobre 2026 ; les zones n’y sont pas nommées, nous les avons situées d’après leurs coordonnées.',
        {
          table: {
            caption: 'Zones lentes et interdites de Dott et Pony à Bordeaux, exemples du 13 octobre 2026',
            head: ['Dans l’app', 'Exemples'],
            rows: [
              ['6 km/h chez Dott, 12 km/h chez Pony', 'Rue Sainte-Catherine, sur toute sa longueur'],
              ['15 km/h chez Dott', 'Pont de pierre'],
              ['Vitesse réduite', 'Rue de la Porte-Dijeaux, place de la Victoire, Quinconces, place Pey-Berland, Jardin public, Parc bordelais, quai des Queyries, abords de l’hôpital Pellegrin'],
              ['Interdit d’y rouler', 'Hippodrome du Bouscat, cimetière de la Chartreuse, Golf bordelais et voies ferrées de Saint-Jean chez Dott ; la plus grande partie de Villenave-d’Ornon chez les deux'],
              ['On roule, on ne se gare pas', 'Presque tout Talence, Blanquefort, Bordeaux-Lac et le Parc des Expositions ; chez Pony aussi, rue Sainte-Catherine, quai de la Douane, gare Saint-Jean et ponts de la Garonne'],
            ],
          },
        },
        'En revanche, Dott ne ralentit la trottinette ni sur les quais, ni au Miroir d’eau, ni place de la Bourse, malgré la foule : levez le pied. Dans une aire piétonne, roulez au pas, quoi que permette l’app.',
      ],
    },
    {
      heading: 'Dans quelles communes de la Métropole trouver une trottinette ?',
      blocks: [
        'Le service couvre **24 des 28 communes** de Bordeaux Métropole : **Talence, Ambès, Martignas-sur-Jalle et Saint-Vincent-de-Paul** n’y participent pas. Après Bordeaux, Mérignac (52 emplacements) et Pessac (48) sont les mieux équipées. La situation en octobre 2026 :',
        {
          list: [
            '**Talence et le campus.** Vous pouvez traverser Talence, mais Dott et Pony y refusent la fin de location presque partout, campus compris : terminez-la côté Pessac ou Bordeaux.',
            '**Blanquefort** a rejoint le dispositif en 2025 mais n’a aucun emplacement : on y passe, on ne s’y gare pas.',
            '**Villenave-d’Ornon, Artigues, Ambarès-et-Lagrave.** Les deux opérateurs y interdisent de rouler sur de grandes surfaces ; à Villenave, Dott n’a aucun emplacement, Pony en garde une vingtaine.',
          ],
        },
        'Pour trouver la trottinette la plus proche, Dott ou Pony, ouvrez la [carte de Bordeaux](map:fr:Bordeaux).',
      ],
    },
    {
      heading: 'Âge, casque, amendes : les règles à Bordeaux',
      blocks: [
        '**L’âge.** La Métropole impose **18 ans** en libre-service. La loi, elle, autorise la trottinette personnelle dès 14 ans.',
        '**Le casque.** Au 14 octobre 2026, ni la presse ni les actes préfectoraux que nous avons pu lire ne signalent d’arrêté imposant le casque en Gironde, comme à Paris, dans le Rhône ou le Nord. Faute d’avoir pu lire tout son recueil des actes, vérifiez sur le site de la [préfecture](https://www.gironde.gouv.fr/). Il reste fortement recommandé.',
        {
          table: {
            caption: 'Trottinette électrique à Bordeaux : les règles nationales qui coûtent le plus cher (octobre 2026)',
            head: ['Règle', 'Ce qu’il faut faire', 'Amende'],
            rows: [
              ['Trottoir', 'Ne jamais y rouler : poussez', '135 €'],
              ['Chaussée', 'Piste cyclable s’il y en a une, sinon rue limitée à 50 km/h au plus', '135 €'],
              ['Passager', 'Une seule personne à bord', '135 €'],
              ['Écouteurs, téléphone en main', 'Pas même une oreillette', '135 €'],
              ['Feu rouge', 'S’arrêter', '135 €'],
              ['Alcool', 'Rester sous 0,5 g/l ; à partir de 0,8 g/l, c’est un délit', '135 € de 0,5 à moins de 0,8 g/l'],
              ['Gilet', 'Gilet ou équipement réfléchissant la nuit ou par mauvaise visibilité', '35 €'],
              ['Stationnement gênant', 'Se garer sur un emplacement marqué', '35 €, fourrière possible'],
            ],
          },
        },
        'Le reste (assurance, débridage, équipement) est dans notre guide de la [réglementation de la trottinette électrique en France](guide:french-rules).',
      ],
    },
    {
      heading: 'Trottinette dans le tram, le bus et Le Bato (TBM)',
      blocks: [
        'Sur le réseau TBM, **une trottinette non pliée est interdite dans le tram et le bus** ; pliée et peu encombrante, elle passe partout. Une Dott ou une Pony ne se plie pas : terminez la location sur un emplacement près de l’arrêt.',
        '**Le Bato**, la navette fluviale, accepte les trottinettes, pliées ou non, dans la limite de 6 places partagées avec les vélos. Avec une Dott ou une Pony, la location continue de tourner pendant toute la traversée : c’est surtout utile avec une trottinette personnelle.',
        { note: 'Ne roulez pas sur les rails du tram. Sur une partie du réseau, le tram est alimenté par un rail central posé dans la chaussée : selon TBM, vous pouvez glisser dessus ou coincer une roue dans les rails latéraux. Traversez les voies le plus perpendiculairement possible. Et un tram de 50 tonnes a besoin de 50 m pour s’arrêter.' },
      ],
    },
    {
      heading: 'Pont de pierre, aéroport, marathon : conseils pour rouler à Bordeaux',
      blocks: [
        {
          list: [
            '**Le Pont de pierre.** En travaux depuis le 5 mai 2025, pour un peu plus de quatre ans, il n’offre qu’une voie, partagée par les vélos et les piétons : ne doublez pas, et ne vous y arrêtez pas. Pour l’éviter, la Ville suggère les ponts Chaban-Delmas ou Saint-Jean.',
            '**L’aéroport de Mérignac.** D’après nos calculs sur les données des opérateurs du 13 octobre 2026, seul Pony a un emplacement près de l’aérogare, à une centaine de mètres. Chez Dott, le plus proche est à environ 1,2 km, près de la station de tram Caroline Aigle, juste avant l’aéroport. Depuis le centre, le tram, qui dessert l’aéroport depuis avril 2023, est souvent plus simple.',
            '**Le marathon.** Selon la presse spécialisée, le marathon de Bordeaux revient le dimanche 8 novembre 2026, de jour, avec un départ rive droite : attendez-vous à des rues fermées et regardez l’app avant de partir.',
          ],
        },
      ],
    },
    {
      heading: 'Le Vélo by TBM : l’alternative à la trottinette',
      blocks: [
        'Le vélo en libre-service de la Métropole, **Le Vélo by TBM** (l’ancien V³), compte plus de 180 stations et 2 000 vélos, classiques ou électriques, accessibles à toute heure dès 15 ans. Tarifs sur le site de TBM au 13 octobre 2026 :',
        {
          list: [
            '**Sans abonnement** : 2 € le vélo électrique ou 1 € le vélo classique, 30 premières minutes comprises, puis 0,10 € la minute.',
            '**Abonnement annuel** : 30 € en classique, compris dans l’abonnement annuel TBM ; 75 € en électrique, 45 € pour les abonnés annuels TBM.',
          ],
        },
        'Pour 20 minutes, comptez 2 € en vélo électrique TBM, contre 6,80 € en trottinette. Dott et Pony louent aussi des vélos électriques, au prix de leurs trottinettes ; notre carte ne montre que les trottinettes.',
      ],
    },
    {
      heading: 'Trottinettes à Bordeaux : le saviez-vous ?',
      blocks: [
        {
          list: [
            '**Juste après Paris.** En septembre 2018, Lime lançait ses trottinettes en libre-service à Bordeaux, deuxième ville française à les accueillir après Paris.',
            '**Les vélos passent devant.** Au premier trimestre 2026, les trajets en trottinette en libre-service ont baissé de 30 % sur un an, et ceux à vélo ont bondi de 86 % : pour la première fois, les vélos ont dépassé les trottinettes.',
            '**Un pont qui s’enfonce.** Plus de 200 ans après sa construction, le Pont de pierre s’enfonce de quelques millimètres par an. Il voit passer 60 000 personnes par jour, dont 12 000 cyclistes.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Quel est le tarif d’une trottinette électrique à Bordeaux ?',
      answer: '1 € pour déverrouiller, puis 0,29 € la minute chez Dott comme chez Pony, selon leurs données publiques du 13 octobre 2026 : 3,90 € les 10 minutes, 6,80 € les 20 minutes, hors pass. L’app affiche le prix exact avant le déverrouillage.',
    },
    {
      question: 'Où trouver une trottinette en libre-service à Bordeaux ?',
      answer: 'Dans l’app de Dott ou de Pony, ou sur notre [carte de Bordeaux](map:fr:Bordeaux), qui montre les trottinettes des deux et ouvre la bonne app. Elles sont garées sur des emplacements marqués au sol.',
    },
    {
      question: 'Combien coûtent les pass Pony à Bordeaux ?',
      answer: 'Selon sa page bordelaise au 13 octobre 2026, Pony vend des pass de minutes : 30 minutes pour 5,99 €, 60 minutes pour 9,99 €, 300 minutes pour 31,99 €. Pour garder un véhicule rien que pour vous, comptez 14,99 € la demi-journée ou 29,99 € la journée.',
    },
    {
      question: 'Peut-on monter dans le tram avec une trottinette à Bordeaux ?',
      answer: 'Pas avec une Dott ou une Pony : TBM interdit les trottinettes non pliées dans le tram et le bus, et celles-ci ne se plient pas. Le Bato les accepte, mais la location continue de tourner pendant la traversée.',
    },
    {
      question: 'Le casque est-il obligatoire en trottinette à Bordeaux ?',
      answer: 'Pas à notre connaissance au 14 octobre 2026 : nous n’avons pas trouvé d’arrêté préfectoral en Gironde, mais vérifiez auprès de la préfecture. La nuit ou par mauvaise visibilité, le gilet ou un équipement réfléchissant est obligatoire partout (35 €).',
    },
    {
      question: 'Peut-on louer une trottinette à Bordeaux avant 18 ans ?',
      answer: 'Non : Bordeaux Métropole impose 18 ans en libre-service. Entre 14 et 18 ans, seule une trottinette personnelle est permise. Le Vélo by TBM, lui, est ouvert dès 15 ans.',
    },
  ],
  sources: [
    { title: 'Bordeaux Métropole : délibération n° 2025-183 du 4 avril 2025', url: 'https://www.bordeaux-metropole.fr/sites/MET-BXMETRO-DRUPAL/files/bm_actes/organismes/bordeaux-metropole/conseils/2025-04-04/Parapheur2025-183-1_0.pdf' },
    { title: 'Bordeaux Métropole : les opérateurs retenus, communiqué du 16 septembre 2025', url: 'https://www.bordeaux-metropole.fr/sites/MET-BXMETRO-DRUPAL/files/2025-09/COMMUNIQUE%20DE%20PRESSE%20-%20AMI%20freefloating_0.pdf' },
    { title: 'Bordeaux Métropole : les règles du free-floating (dépliant, octobre 2025)', url: 'https://sedeplacer.bordeaux-metropole.fr/sites/MET-BXMETRO-DRUPAL/files/2025-10/FreeFloating_FLYER_A5_2025_WEB.pdf' },
    { title: 'data.gouv.fr : emplacements free-floating de Bordeaux Métropole', url: 'https://www.data.gouv.fr/datasets/emplacement-freefloating-bordeaux-metropole-2' },
    { title: 'Bordeaux Métropole : baromètre des mobilités, 1er trimestre 2026', url: 'https://sedeplacer.bordeaux-metropole.fr/sites/MET-BXMETRO-DRUPAL/files/2026-04/Barom%C3%A8tre%20des%20mobilit%C3%A9s%201er%20trimestre%202026.pdf' },
    { title: 'Dott : flux de données public (GBFS) de Bordeaux', url: 'https://gbfs.api.ridedott.com/public/v2/bordeaux/gbfs.json' },
    { title: 'Pony : flux de données public (GBFS) de Bordeaux', url: 'https://proxy.transport.data.gouv.fr/resource/pony-bordeaux-gbfs/gbfs.json' },
    { title: 'Pony à Bordeaux : tarifs, pass et stationnement', url: 'https://getapony.com/cities/bordeaux' },
    { title: 'Dott : conditions générales d’utilisation en France (mises à jour le 23 septembre 2025)', url: 'https://ridedott.com/fr/conditions-generales/france/' },
    { title: 'TBM : vélos, rollers et trottinettes sur le réseau', url: 'https://aide.infotbm.com/?question=velos-rollers-trotinettes-ils-autorises-reseau-tbm' },
    { title: 'TBM : la sécurité aux abords du tram', url: 'https://www.infotbm.com/fr/securite' },
    { title: 'TBM : Le Vélo, mode d’emploi et tarifs', url: 'https://www.infotbm.com/fr/v3-comment-ca-marche.html' },
    { title: 'Bordeaux Métropole : dossier de presse de l’extension du tram A à l’aéroport (29 avril 2023)', url: 'https://www.bordeaux-metropole.fr/sites/MET-BXMETRO-DRUPAL/files/2023-05/05-Dossier-de-Presse-Extension-Tram-A_2023-04-29.pdf' },
    { title: 'Ville de Bordeaux : les travaux du Pont de pierre (2 juillet 2026)', url: 'https://www.bordeaux.fr/le-mag/pont-de-pierre-dindispensables-travaux-pour-solidifier-ledifice' },
    { title: 'Marathons.com : le retour du marathon de Bordeaux en 2026', url: 'https://www.marathons.com/fr/10-km/marathon-de-bordeaux-le-grand-retour-en-2026-sept-ans-apres_qy5v' },
    { title: 'Cleanrider : Lime lance ses trottinettes à Bordeaux (septembre 2018)', url: 'https://www.cleanrider.com/actus/libre-service-trottinettes-electriques-lime-lancement-bordeaux/' },
  ],
};

export default guide;
