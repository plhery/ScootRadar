import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-electrique-grenoble',
  topic: 'grenoble',
  name: 'Louer une trottinette électrique à Grenoble',
  title: 'Trottinette électrique à Grenoble en 2026 : Voi, prix, zones',
  description: 'Trottinette électrique à Grenoble : Voi, seul opérateur, 0,49 € le déverrouillage puis 0,25 € la minute. Où se garer, zones lentes, tram, Bastille, Mvélo+.',
  headline: 'Trottinette électrique à Grenoble : Voi, prix, zones lentes et stationnement en 2026',
  lede: 'Pour louer une trottinette électrique à Grenoble, il n’y a qu’un opérateur : **Voi**, qui a remplacé Dott le 1er juillet 2025 dans 17 communes de l’agglomération. Comptez 0,49 € pour déverrouiller, puis 0,25 € la minute, soit 2,99 € les 10 minutes ; il faut avoir 18 ans. Vous ne terminez la location que sur un emplacement marqué au sol, et la trottinette, bridée à 20 km/h, ralentit d’elle-même dans le centre piéton.',
  published: '2026-10-14',
  updated: '2026-10-14',
  city: 'fr:Grenoble',
  sections: [
    {
      heading: 'Trottinette électrique à Grenoble : Voi, seul opérateur depuis 2025',
      blocks: [
        'Depuis le **1er juillet 2025**, **Voi** est le seul opérateur de trottinettes et de vélos électriques en libre-service de l’agglomération. Le SMMAG, le syndicat des mobilités de l’aire grenobloise, l’a retenu pour 17 communes, l’Université Grenoble Alpes et le CHU. Selon la presse, c’est pour **quatre ans**, avec 1 300 trottinettes et 1 300 vélos au départ ; nous n’avons pas trouvé de date de fin officielle.',
        '**Et Dott ?** Il a exploité le service de juillet 2022 au 30 juin 2025 : une page qui vous parle encore de Dott à Grenoble, ou d’un déverrouillage à 1 €, est périmée.',
        'Outre Grenoble, le service couvre seize communes, dont Échirolles, Saint-Martin-d’Hères, Fontaine, Meylan, Eybens, La Tronche et Saint-Égrève ; les données de Voi montrent aussi quelques emplacements dans le Grésivaudan (Saint-Ismier, Saint-Nazaire-les-Eymes, Biviers).',
        'Le 14 octobre 2026 à 14 h 40, la [carte de Grenoble](map:fr:Grenoble) de ScootRadar affichait **près de 1 000 trottinettes Voi** : un relevé, pas la taille de la flotte ; les vélos n’y figurent pas. Un bouton ouvre l’app Voi, où vous déverrouillez et payez.',
      ],
    },
    {
      heading: 'Prix Voi à Grenoble : tarif, pass et réductions',
      blocks: [
        'La page grenobloise de Voi et ses données publiques donnent le même tarif, en trottinette comme en vélo électrique : **0,49 € pour déverrouiller, puis 0,25 € la minute**. Ce déverrouillage bas n’est pas une erreur.',
        {
          table: {
            caption: 'Prix d’un trajet Voi à Grenoble, au 14 octobre 2026',
            head: ['Trajet', 'Prix'],
            rows: [
              ['Déverrouillage', '0,49 €'],
              ['Chaque minute', '0,25 €'],
              ['10 minutes', '2,99 €'],
              ['20 minutes', '5,49 €'],
              ['Forfaits de minutes, Pass Voi', 'Prix dans l’app'],
            ],
          },
        },
        'Pour rouler souvent, Voi vend des **forfaits de minutes** et un **Pass Voi** aux déverrouillages illimités, dont les prix ne s’affichent que dans l’app. Trois offres sont propres à Grenoble :',
        {
          list: [
            '**Voi 4 All** : une réduction sur l’abonnement et les forfaits de 30 jours pour les bénéficiaires du RSA, ou sur les trajets à la minute pour les ayants droit du tarif solidaire des transports (attestation de quotient familial de la CAF).',
            '**Voi 4 Students** : une réduction sur les trajets à la minute pour les boursiers du CROUS.',
            '**G-PASS** : le pass touristique de Grenoble Alpes offre deux trajets aux nouveaux clients Voi.',
          ],
        },
        'Les réductions se demandent dans l’app (Menu, Aide, Chat) ; Voi n’en publie pas le montant. Première fois ? Voyez [comment louer une trottinette électrique](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Où garer sa trottinette Voi à Grenoble',
      blocks: [
        'Pas de stationnement libre : vous terminez la location **uniquement sur un emplacement marqué au sol**, que l’app vous montre ; ailleurs, elle refuse, et le compteur tourne. Les données de Voi en recensaient **647** l’après-midi du 14 octobre 2026, 630 le soir. D’après nos calculs :',
        {
          list: [
            '**Où ils abondent** : 9 à moins de 200 m de l’arrêt de tram Gares, 7 près du quai Claude Bernard, et un à moins de 80 m de la place Vaucanson, du Musée de Grenoble et du Musée dauphinois.',
            '**Où ils manquent** : aucun à moins de 200 m de la place Grenette (le plus proche à 300 m environ), de la Grande Rue ni de la place Saint-André ; ni au cœur du campus (voir plus bas).',
          ],
        },
        { note: 'Avant de partir, repérez dans l’app un emplacement près de votre destination : sans emplacement, pas de fin de location.' },
      ],
    },
    {
      heading: 'Zones lentes et zones interdites : où rouler en trottinette à Grenoble',
      blocks: [
        'Les trottinettes Voi roulent à **20 km/h** au plus. Dans les zones lentes, l’app réduit la vitesse automatiquement (10 km/h dans les données de Voi) ; dans les zones interdites, vous ne pouvez pas rouler, même pour traverser. Exemples relevés le 14 octobre 2026 et situés par nos soins :',
        {
          table: {
            caption: 'Zones lentes et interdites de Voi autour de Grenoble, exemples du 14 octobre 2026',
            head: ['Dans l’app', 'Exemples'],
            rows: [
              ['Vitesse réduite, centre piéton', 'Place Grenette, place Notre-Dame, place Saint-André, place aux Herbes, Grande Rue, rue de la République, Jardin de Ville'],
              ['Vitesse réduite, ailleurs', 'Place Victor Hugo, Parc Paul Mistral (Stade des Alpes, Palais des Sports), abords de la gare, Caserne de Bonne, Alpexpo, CHU Michallon'],
              ['Interdit d’y rouler', 'Jardin des Plantes, parc Jean Verlhac (Villeneuve), parc de l’Île Verte, cimetière Saint-Roch, rue Edgar Quinet, hauts de Corenc, nombreux terrains scolaires et sportifs'],
              ['Hors zone', 'Le fort de la Bastille'],
            ],
          },
        },
        'Les zones changent : **l’app fait foi**. Et dans la zone piétonne, la règle est plus stricte que l’app : on y roule « au pas », rappelle la Ville. Sa police municipale y a dressé 2 400 verbalisations en 2024 et 1 500 par vidéo, toutes infractions confondues, en promettant de surveiller « la vitesse des cycles ».',
      ],
    },
    {
      heading: 'Âge, casque, amendes : les règles à Grenoble',
      blocks: [
        '**L’âge.** Voi exige **18 ans** à Grenoble et vérifie votre pièce d’identité à l’inscription. La loi, elle, autorise la trottinette personnelle dès 14 ans.',
        '**Le soir.** Le vendredi et le samedi soir, l’app vous soumet à un test de réactivité ; si vous échouez, la location est bloquée un moment. Selon Saint-Martin-d’Hères, Voi détecte et sanctionne aussi la conduite à deux et la circulation sur les trottoirs.',
        '**Le casque.** Au 14 octobre 2026, nous n’avons pas trouvé d’arrêté préfectoral imposant le casque en Isère, contrairement au Rhône voisin, sans pouvoir l’exclure : vérifiez sur le site de la [préfecture de l’Isère](https://www.isere.gouv.fr/). Il reste fortement recommandé.',
        {
          table: {
            caption: 'Trottinette électrique à Grenoble : les règles nationales qui coûtent le plus cher (octobre 2026)',
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
        'Assurance, débridage, équipement : le reste est dans notre guide de la [réglementation de la trottinette électrique en France](guide:french-rules).',
      ],
    },
    {
      heading: 'Trottinette dans le tram et le bus à Grenoble (M réso)',
      blocks: [
        'Sur le réseau M réso, l’ex-TAG, les trottinettes ne montent qu’**en position pliée**, sous peine d’amende : la vôtre, pliée, passe ; une Voi, qui ne se plie pas, reste dehors. Terminez la location près de l’arrêt : il y a 9 emplacements autour de l’arrêt Gares, et plusieurs autour d’Alsace-Lorraine, de Chavant ou de Notre-Dame – Musée.',
      ],
    },
    {
      heading: 'Campus, Bastille, matchs : conseils pour rouler à Grenoble',
      blocks: [
        {
          list: [
            '**Le campus.** Au Domaine universitaire, aucun emplacement Voi à moins de 480 m des arrêts de tram Université : ils sont en lisière, au sud côté avenue Gabriel Péri et à l’est vers Gières – Gare – Universités et Plaine des Sports. Les terrains de sport sont interdits.',
            '**La Bastille.** Le fort est hors zone, et le téléphérique n’accepte ni vélos ni trottinettes. Garez la Voi près de la station basse, quai Stéphane Jay (2 emplacements à moins de 200 m), puis montez dans les « bulles » : 9,80 € l’aller-retour, 6,60 € l’aller simple en 2026.',
            '**Les soirs de match.** Le GF38 joue à domicile au Stade des Alpes, en zone lente dans le Parc Paul Mistral. Le 14 octobre 2026, les 2 emplacements à moins de 200 m du stade avaient disparu des données de Voi en soirée ; restait un emplacement temporaire de 50 places près du Palais des Sports. Les soirs d’affluence, vérifiez dans l’app où rendre la trottinette.',
            '**Le marché de Noël.** Il revient place Victor Hugo, en zone lente, du vendredi 20 novembre au jeudi 24 décembre 2026.',
            '**La Maison Voi.** Ouverte début avril 2026 au 11 rue de la Liberté, près de la place Vaucanson, elle répond aux questions des usagers et distribue des casques gratuits, selon la presse.',
          ],
        },
      ],
    },
    {
      heading: 'Mvélo+ : l’alternative à la trottinette à Grenoble',
      blocks: [
        '**Mvélo+**, l’ancien Métrovélo, loue des vélos en agence, notamment à la gare et sur le campus, d’une journée à un an : ce n’est pas du libre-service. Tarifs depuis le 1er avril 2026 :',
        {
          list: [
            '**Vélo classique ou pliant** : 5 € la journée, 28 € le mois (16 € en tarif réduit), 145 € l’année ; 250 € de dépôt de garantie.',
            '**Vélo électrique « Découverte »** : 11 € la journée, 57 € le mois (32 € en tarif réduit), trois mois au plus ; 1 500 € de dépôt de garantie.',
            '**Tarif réduit** pour les moins de 18 ans, les étudiants de 18 à 25 ans ou les abonnés M réso, entre autres ; une semaine gratuite en cas d’alerte pollution de niveau 2.',
          ],
        },
        'Un trajet Voi de 20 minutes coûte 5,49 €, une journée de vélo Mvélo+ 5 €, et un mois 28 €, moins que six trajets.',
      ],
    },
    {
      heading: 'Trottinettes à Grenoble : le saviez-vous ?',
      blocks: [
        {
          list: [
            '**Une flotte changée en une nuit.** Dans la nuit du 30 juin au 1er juillet 2025, Dott a retiré ses véhicules et Voi a déployé les siens, après l’échec du recours de Dott devant le tribunal administratif.',
            '**31 000 trajets en un mois, dans une seule commune.** En août 2025, deuxième mois de Voi, Saint-Martin-d’Hères a compté à elle seule 31 000 trajets en trottinette et en vélo, après plus de 26 000 en juillet.',
            '**Des « bulles » de 50 ans.** Le téléphérique de la Bastille date de 1934, et ses célèbres cabines rondes de 1976 : elles ont eu 50 ans en 2026.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Combien coûte une trottinette Voi à Grenoble ?',
      answer: '0,49 € pour déverrouiller, puis 0,25 € la minute, selon Voi au 14 octobre 2026 : 2,99 € les 10 minutes, 5,49 € les 20 minutes. Le G-PASS touristique offre deux trajets aux nouveaux clients.',
    },
    {
      question: 'Y a-t-il encore des trottinettes Dott à Grenoble ?',
      answer: 'Non. Dott a quitté l’agglomération le 30 juin 2025 ; Voi, retenu par le SMMAG, l’a remplacé le lendemain.',
    },
    {
      question: 'Où trouver une trottinette Voi à Grenoble ?',
      answer: 'Dans l’app Voi, ou sur notre [carte de Grenoble](map:fr:Grenoble), qui ouvre l’app. Les trottinettes attendent sur des emplacements marqués au sol, nombreux autour de la gare, rares dans le centre piéton et sur le campus.',
    },
    {
      question: 'Le casque est-il obligatoire en trottinette à Grenoble ?',
      answer: 'Pas à notre connaissance au 14 octobre 2026 : nous n’avons pas trouvé d’arrêté préfectoral en Isère, mais vérifiez auprès de la préfecture. La loi nationale ne l’impose que sur les routes à 80 km/h ouvertes aux trottinettes. La nuit ou par mauvaise visibilité, le gilet ou un équipement réfléchissant est obligatoire (35 €).',
    },
    {
      question: 'Peut-on prendre le tram avec une trottinette à Grenoble ?',
      answer: 'Seulement pliée : M réso n’admet les trottinettes dans le tram et le bus qu’en position pliée. Une Voi ne se plie pas : terminez la location sur un emplacement près de l’arrêt.',
    },
    {
      question: 'Peut-on monter à la Bastille en trottinette ?',
      answer: 'Non : le fort est hors de la zone Voi, et le téléphérique n’accepte ni vélos ni trottinettes. Garez la trottinette près de la station basse, quai Stéphane Jay, puis montez en téléphérique ou à pied.',
    },
  ],
  sources: [
    { title: 'SMMAG : délibérations du comité syndical du 14 novembre 2024', url: 'https://smmag.fr/wp-content/uploads/2024/12/Jeudi-14-novembre-2024-Deliberations.pdf' },
    { title: 'Saint-Martin-d’Hères : trottinettes et vélos en libre-service (23 février 2026)', url: 'https://www.saintmartindheres.fr/trottinettes-et-velos-electrique-libre-service-informations-et-bonnes-pratiques/' },
    { title: 'Voi à Grenoble : tarifs et règles', url: 'https://www.voi.com/fr/ville/grenoble' },
    { title: 'Voi : accès équitable', url: 'https://www.voi.com/fr/acces-equitable' },
    { title: 'Voi : flux de données public (GBFS) de Grenoble', url: 'https://api.voiapp.io/gbfs/fr/6bb6b5dc-1cda-4da7-9216-d3023a0bc54a/v2/358/gbfs.json' },
    { title: 'G-PASS : deux trajets Voi offerts', url: 'https://www.grenoblepass.com/fr/prestation/151-voi' },
    { title: 'Ville de Grenoble : la zone piétonne (22 novembre 2024)', url: 'https://grenoble.fr/uploads/Presse/pse_fichier/0c/2047_977_CP-plateau-pieton.pdf' },
    { title: 'M réso : bien voyager', url: 'https://www.reso-m.fr/83-bien-voyager.htm' },
    { title: 'Téléphérique de la Bastille : questions fréquentes', url: 'https://bastille-grenoble.fr/faq/' },
    { title: 'Téléphérique de la Bastille : tarifs', url: 'https://bastille-grenoble.fr/tarifs-individuels/' },
    { title: 'Mvélo+ : abonnements et tarifs', url: 'https://www.veloplus-m.fr/560-abonnements-et-tarifs.htm' },
    { title: 'Ville de Grenoble : marché de Noël 2026', url: 'https://www.grenoble.fr/uploads/AnnonceFichier/anf_fichier/7c/119_639_Appel-petit-format-artistique_Marche_Noel_2026.pdf' },
    { title: 'TGplus : Voi remplace Dott à Grenoble (1er juillet 2025)', url: 'https://tgplus.fr/article/grenoble-voi-remplace-dott-2600-velos-et-trottinettes-rouges-des-mardi/' },
    { title: 'L’Essentiel : la Maison Voi à Grenoble (8 avril 2026)', url: 'https://www.lessentiel.fr/grenoble/bonnes-adresses/2026-04-08/un-lieu-dedie-la-location-de-deux-roues-grenoble-19415' },
  ],
};

export default guide;
