import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-electrique-lille',
  topic: 'lille',
  name: 'Louer une trottinette électrique autour de Lille',
  title: 'Trottinette électrique à Lille en 2026 : Lime, casque, prix',
  description: 'Trottinette électrique à Lille : aucune en libre-service en ville, des Lime dans la métropole. Prix, stations, casque obligatoire dans le Nord et V’Lille.',
  headline: 'Trottinette électrique à Lille : pas de libre-service en ville, des Lime dans la métropole, casque et prix en 2026',
  lede: 'Pour louer une trottinette électrique à Lille, il faut sortir de la ville, qui n’autorise en libre-service que les vélos électriques : dans Lille même, prenez un V’Lille ou un vélo Lime. **Lime**, seul opérateur, a environ un millier de trottinettes dans le reste de la métropole, surtout à Roubaix, Villeneuve-d’Ascq, Wattrelos, Hem et Lambersart. Comptez 1 € pour déverrouiller, puis 0,18 à 0,22 € la minute selon les pages des communes ; l’app affiche le prix exact. La location se termine dans une station, et le casque est obligatoire dans tout le Nord depuis le 1er septembre 2026.',
  published: '2026-10-13',
  updated: '2026-10-13',
  city: 'fr:Lille Métropole',
  sections: [
    {
      heading: 'Trottinette électrique à Lille : pourquoi pas de libre-service en ville ?',
      blocks: [
        'En 2023, la Métropole européenne de Lille (MEL) a ouvert le libre-service à ses communes, chacune choisissant d’accueillir trottinettes et vélos électriques, ou les vélos seulement. Lille s’en est tenue aux vélos : « pour des raisons de sécurité, le choix a été fait de n’autoriser que les vélos à assistance électrique et pas les trottinettes ».',
        'Pas de trottinette, donc, sur la Grand’Place, dans le Vieux-Lille, à Euralille ni aux gares Lille-Flandres et Lille-Europe. Le soir du 13 octobre 2026, les données publiques de Lime montraient 827 vélos dans Lille, et seulement douze trottinettes dans ses limites, en lisière d’Hellemmes et de Lomme.',
        'Notre carte ne montre que les trottinettes, ni les V’Lille ni les vélos Lime : au centre de Lille, elle paraîtra vide, et c’est normal.',
      ],
    },
    {
      heading: 'Où trouver une trottinette Lime dans la métropole lilloise',
      blocks: [
        '**Lime** est le seul opérateur de trottinettes de la MEL : Tier, retenu avec lui en 2023, s’est retiré en 2024. Le matin du 13 octobre 2026, ScootRadar en affichait environ 1 060 sur la [carte de la métropole lilloise](map:fr:Lille Métropole), et à peu près autant le soir, dans 45 communes : un relevé, pas la taille de la flotte. Un bouton ouvre l’app Lime, où vous déverrouillez et payez.',
        {
          table: {
            caption: 'Les communes qui comptaient le plus de trottinettes Lime, le soir du 13 octobre 2026 (données publiques de Lime)',
            head: ['Commune', 'Trottinettes Lime'],
            rows: [
              ['Roubaix', '299'],
              ['Villeneuve-d’Ascq', '119'],
              ['Wattrelos', '108'],
              ['Hem', '92'],
              ['Lambersart', '75'],
              ['Leers', '43'],
              ['Lesquin', '33'],
              ['Neuville-en-Ferrain', '26'],
              ['Bondues', '25'],
              ['Armentières', '19'],
              ['Croix, Halluin, Lannoy', '17 chacune'],
            ],
          },
        },
        {
          list: [
            '**Roubaix**, à moins de 500 m : 21 autour de la gare, 22 autour du musée La Piscine, 17 autour de la Grand-Place. [Roubaix sur la carte](map:fr:Roubaix).',
            '**Villeneuve-d’Ascq** : près du LaM, de la Cité scientifique et du stade Pierre-Mauroy.',
            '**Lambersart** : le secteur le plus commode depuis le centre de Lille, de l’autre côté du parc de la Citadelle.',
            '**Tourcoing** : huit trottinettes seulement, aucune à moins de 500 m de la Grand-Place. N’y comptez pas.',
          ],
        },
        '**Et en 2027 ?** L’autorisation de 2023 valait trois ans au plus ; nous ne savons pas sur quelle base Lime roule depuis l’été 2026. Selon la presse, la MEL veut ensuite confier le service à **un seul opérateur** dès le premier trimestre 2027. La délibération était à l’ordre du jour du conseil métropolitain du 9 octobre 2026, mais son adoption n’était pas confirmée au 13 octobre.',
      ],
    },
    {
      heading: 'Tarif Lime à Lille : minute, LimePass et LimePrime',
      blocks: [
        'Lime ne publie pas son tarif lillois dans ses données, donc notre carte ne l’estime pas. Les pages des communes, non datées, donnent **1 € pour déverrouiller**, puis de **0,18 €** (Armentières) à **0,22 € la minute** (Hem). Seul compte le prix affiché dans l’app avant le départ.',
        {
          table: {
            caption: 'Prix indicatifs d’une trottinette Lime (pages des communes ; pass et LimePrime selon la presse)',
            head: ['Formule', 'Prix'],
            rows: [
              ['Déverrouillage, puis prix à la minute', '1 €, puis 0,18 à 0,22 €'],
              ['Trajet de 10 minutes', '2,80 à 3,20 €'],
              ['Trajet de 20 minutes', '4,60 à 5,40 €'],
              ['LimePass de 30, 60, 200 ou 300 minutes (annoncés en septembre 2025)', '2,99 €, 5,99 €, 19,99 € ou 29,99 €'],
              ['LimePrime, sans frais de déverrouillage (lancé en mars 2026)', '3,99 € par mois'],
            ],
          },
        },
        'Au-delà d’une dizaine de minutes, un pass revient souvent moins cher : comparez dans l’app. Pour la marche à suivre, lisez notre guide [louer une trottinette électrique](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Stations Lime : où garer sa trottinette dans la MEL',
      blocks: [
        'Pas de stationnement libre : selon la MEL, vous devez **impérativement** garer la trottinette dans une station, et vous payez tant qu’elle n’y est pas correctement garée. Il en existe **près de 1 400** ; l’app les montre, notre carte non.',
        'Vous roulez vers Lille ? Avant de partir, trouvez dans l’app une station où rendre la trottinette : nous n’avons pas pu vérifier que c’est possible en ville.',
        '**Mal se garer peut coûter cher.** La MEL a prévu dès 2023 des sanctions de l’opérateur, jusqu’au blocage du compte à la troisième infraction, et Lime vous refacture amendes et frais de fourrière. Côté police, le stationnement gênant coûte 35 €, fourrière possible. Une Lime mal garée ? Écrivez à signalement-MEL@li.me.',
      ],
    },
    {
      heading: 'Casque obligatoire dans le Nord : âge, vitesse et amendes',
      blocks: [
        '**Le casque.** Depuis le **1er septembre 2026**, un arrêté du préfet du Nord impose un casque aux normes et attaché à tout conducteur de trottinette électrique ou d’engin semblable, **trottinettes Lime comprises**, selon la presse et la Ville de Lille. Les vélos électriques ne sont pas concernés. Selon le SAMU du Nord, la réanimation neurochirurgicale du CHU de Lille reçoit « au moins un patient par semaine » après un accident de trottinette.',
        'L’amende annoncée varie : 135 € selon la Ville de Lille, 35 € selon La Voix du Nord ; nous n’avons pas pu lire l’arrêté.',
        { note: 'Selon la MEL, les trottinettes Lime ont un casque intégré, mais nous n’avons pas pu vérifier qu’il y en a un sur chacune : prenez le vôtre.' },
        '**L’âge et la vitesse.** Selon Lime, ses trottinettes sont réservées aux majeurs ; la page de la MEL indique 16 ans. L’app fait foi. Une trottinette personnelle, elle, se conduit dès 14 ans. Selon la MEL, les Lime sont bridées à 20 km/h, et à 6 km/h dans certaines zones très fréquentées ; l’app affiche les zones lentes et interdites.',
        {
          table: {
            caption: 'Les principales amendes en trottinette autour de Lille (octobre 2026)',
            head: ['Infraction', 'Amende'],
            rows: [
              ['Sans casque, dans tout le Nord', '135 € selon la Ville de Lille, 35 € selon la presse'],
              ['Rouler sur le trottoir', '135 €'],
              ['Rouler dans une rue piétonne de Lille aux heures de pied à terre', '135 €'],
              ['À deux sur la trottinette', '135 €'],
              ['Écouteurs ou téléphone en main', '135 €'],
              ['Sans gilet ni équipement réfléchissant, la nuit ou par mauvaise visibilité', '35 €'],
              ['Stationnement gênant', '35 €, fourrière possible'],
            ],
          },
        },
        'Prenez la piste cyclable s’il y en a une, sinon une rue limitée à 50 km/h au plus. Alcool, feux rouges, assurance : le reste est dans notre guide de la [réglementation de la trottinette électrique en France](guide:french-rules).',
      ],
    },
    {
      heading: 'Rues piétonnes de Lille : pied à terre et Grand’Place au pas',
      blocks: [
        'Ces règles valent pour votre trottinette personnelle, ou une Lime venue d’une commune voisine. Depuis le 9 octobre 2023, vélos et trottinettes doivent **mettre pied à terre** (horaires de la Ville, octobre 2026) :',
        {
          list: [
            '**Tous les jours de 11 h à 19 h** dans les aires piétonnes permanentes : rue de Béthune, rue Neuve, place Rihour, place Richebé…',
            '**Le samedi de 11 h à 19 h** dans le Vieux-Lille et autour : rue Esquermoise, rue de la Monnaie, place Louise-de-Bettignies, rue des Chats-Bossus…',
            '**La Grand’Place**, piétonne depuis le 12 janvier 2026 : on peut la traverser « en roulant au pas », les piétons restant prioritaires, sauf le samedi de 11 h à 19 h, où l’on descend.',
          ],
        },
        'Sur les pavés du Vieux-Lille, glissants sous la pluie, ralentissez.',
      ],
    },
    {
      heading: 'Métro, gares, aéroport : conseils pour circuler à Lille',
      blocks: [
        {
          list: [
            '**Métro, tram et bus.** Ilévia n’admet les trottinettes que « repliées dès l’entrée sur le réseau ». Une Lime ne se plie pas : rendez-la dans une station près de l’arrêt.',
            '**Lille-Flandres et Lille-Europe.** Aucune trottinette à la descente du TGV ou de l’Eurostar : le 13 octobre 2026, la plus proche était à 1,8 km. Prenez un V’Lille, à moins de 100 m de chacune des deux gares, ou un vélo Lime : ce soir-là, 85 attendaient à moins de 500 m de Lille-Flandres.',
            '**Aéroport de Lille-Lesquin.** Aucune trottinette devant l’aérogare : les plus proches étaient à 1,2 km environ. La navette rejoint les gares en une vingtaine de minutes, pour 7,99 € en ligne ou 9 € à bord ; le bus Ilévia 68 va jusqu’au métro 4 Cantons-Stade Pierre-Mauroy.',
            '**Marché de Noël.** Il s’installe place Rihour du 18 novembre au 30 décembre 2026 : on y met pied à terre tous les jours de 11 h à 19 h.',
          ],
        },
      ],
    },
    {
      heading: 'V’Lille ou vélo Lime : l’alternative dans Lille',
      blocks: [
        '**V’Lille**, le vélo classique en libre-service d’Ilévia, compte 266 stations dans 21 communes, accessibles jour et nuit dès 14 ans. Tarifs d’Ilévia au 13 octobre 2026 :',
        {
          list: [
            '**Formules** : 1,90 € les 24 heures, 8,30 € les 7 jours, 43 € l’année.',
            '**Chaque trajet** : 30 premières minutes gratuites, puis 1,20 € la demi-heure supplémentaire.',
            '**Gratuit** pour les moins de 18 ans qui habitent la MEL ; caution de 200 € pour les usagers occasionnels.',
          ],
        },
        'Les **vélos électriques Lime** se louent dans l’app Lime, se garent sur des emplacements dédiés et se paient comme les trottinettes : pour 20 minutes, comptez 4,60 à 5,40 €, contre 1,90 € la journée en V’Lille.',
      ],
    },
    {
      heading: 'Trottinettes à Lille : le saviez-vous ?',
      blocks: [
        {
          list: [
            '**La MEL a dit oui quand Paris disait non.** En 2023, l’année où Paris votait la fin des trottinettes en libre-service, le président de la MEL, Damien Castelain, lançait : « Face aux collectivités qui préfèrent interdire ces solutions de déplacements, la MEL fait le choix d’un déploiement qui sera raisonné et responsable. »',
            '**Votre station était peut-être une place de voiture.** La MEL a placé ses stations de préférence dans les 5 m qui précèdent les passages piétons, que la loi impose de libérer des voitures d’ici fin 2026.',
            '**53 km de stands.** La Braderie 2026, les 5 et 6 septembre, a attiré plus de 2,5 millions de visiteurs et 5 425 exposants, sur 53 km de rues.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Peut-on louer une trottinette électrique en libre-service à Lille ?',
      answer: 'Pas dans Lille même, où la Ville n’autorise que les vélos électriques en libre-service. Les trottinettes Lime roulent dans les autres communes de la métropole, comme Roubaix ou Villeneuve-d’Ascq : notre [carte de la métropole lilloise](map:fr:Lille Métropole) les montre. Dans Lille, prenez un V’Lille ou un vélo Lime.',
    },
    {
      question: 'Quels sont les tarifs de Lime à Lille ?',
      answer: 'Les pages des communes donnent 1 € pour déverrouiller, puis 0,18 à 0,22 € la minute, soit 4,60 à 5,40 € pour 20 minutes ; selon la presse, un LimePass de 30 minutes coûte 2,99 €. L’app affiche le prix exact avant le départ.',
    },
    {
      question: 'Le casque est-il obligatoire en trottinette dans le Nord ?',
      answer: 'Oui, depuis le 1er septembre 2026, pour tout conducteur de trottinette électrique, location comprise, selon la presse et la Ville de Lille. L’amende annoncée varie : 135 € selon la Ville de Lille, 35 € selon La Voix du Nord. Les vélos électriques ne sont pas concernés.',
    },
    {
      question: 'Peut-on prendre une trottinette dans le métro à Lille ?',
      answer: 'Seulement si elle est pliée dès l’entrée dans le réseau Ilévia, métro, tram et bus compris. Une Lime ne se plie pas : terminez la location dans une station près de l’arrêt.',
    },
    {
      question: 'Combien coûte un V’Lille ?',
      answer: '1,90 € les 24 heures, 8,30 € les 7 jours, 43 € l’année, selon Ilévia au 13 octobre 2026. Chaque trajet est gratuit 30 minutes, puis coûte 1,20 € la demi-heure supplémentaire.',
    },
  ],
  sources: [
    { title: 'Ville de Lille : vélos électriques en libre-service, sans trottinettes', url: 'https://www.lille.fr/Actualites/Velos-electriques-en-libre-service' },
    { title: 'Métropole européenne de Lille : des trottinettes et des VAE en libre-service', url: 'https://www.lillemetropole.fr/des-trottinettes-et-des-vae-en-libre-service' },
    { title: 'MEL : « Dès cet été, tous en vélo et trottinette électrique avec la MEL » (1er juin 2023)', url: 'https://www.lillemetropole.fr/communique-de-presse/des-cet-ete-tous-en-velo-et-trottinette-electrique-avec-la-mel' },
    { title: 'MEL : déploiement des trottinettes et vélos électriques en juillet 2023 (30 juin 2023)', url: 'https://www.lillemetropole.fr/communique-de-presse/en-juillet-deploiement-operationnel-des-trottinettes-et-velos-electriques-dans' },
    { title: 'Ville de Hem : tarifs des vélos et trottinettes en libre-service', url: 'https://www.ville-hem.fr/cadre-de-vie/vlille/' },
    { title: 'Ville d’Armentières : tarifs et abonnements', url: 'https://www.ville-armentieres.fr/tarifs-et-abonnements' },
    { title: 'Ville de Lille : « Cyclistes, pied à terre »', url: 'https://www.lille.fr/Actualites/Cyclistes-pied-a-terre' },
    { title: 'Ville de Lille : la Grand’Place piétonne', url: 'https://www.lille.fr/Actualites/Grand-Place-pietonne-info-commercants' },
    { title: 'Ville de Lille : « À pied, à vélo : plus de sécurité » (2026)', url: 'https://www.lille.fr/Actualites/A-pied-a-velo-plus-de-securite' },
    { title: 'La Voix du Nord : le casque sera obligatoire pour tous les usagers de trottinettes (8 juillet 2026)', url: 'https://www.lavoixdunord.fr/1719726/article/2026-07-08/trottinettes-electriques-le-port-du-casque-sera-obligatoire-pour-tous-les' },
    { title: 'La Voix du Nord : casque obligatoire au 1er septembre, quels véhicules sont visés (26 août 2026)', url: 'https://www.lavoixdunord.fr/1731867/article/2026-08-26/casque-obligatoire-au-1er-septembre-outre-les-trottinettes-quels-vehicules-sont' },
    { title: 'La Tribune : la MEL veut pérenniser trottinettes et vélos en libre-service (8 octobre 2026)', url: 'https://www.latribune.fr/article/departements/nord/36649662139535/la-metropole-de-lille-souhaite-perenniser-le-service-de-trottinettes-et-velos-en-libre-service' },
    { title: 'actu.fr : Lime annonce 1 000 vélos et trottinettes électriques de plus dans la métropole (30 septembre 2025)', url: 'https://actu.fr/hauts-de-france/lille_59350/metropole-de-lille-lime-annonce-larrivee-de-1000-velos-et-trottinettes-electriques-supplementaires_63234891.html' },
    { title: 'Ilévia : vélos et trottinettes à bord du métro, du tram et du bus', url: 'https://www.ilevia.fr/faq/pendant-mon-voyage' },
    { title: 'Ilévia : V’Lille, offres et tarifs', url: 'https://www.ilevia.fr/boutique/v-lille' },
  ],
};

export default guide;
