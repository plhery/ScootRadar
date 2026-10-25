import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'trottinette-electrique-charleroi',
  topic: 'charleroi',
  name: 'Louer une trottinette électrique à Charleroi',
  title: 'Trottinette électrique Charleroi : Dott, Pony, prix, zones',
  description: 'Trottinette électrique à Charleroi : Dott, Pony et Bolt, prix, où se garer, Ville Basse au ralenti, gare, aéroport et règles belges.',
  headline: 'Trottinette électrique à Charleroi : Dott, Pony et Bolt, prix, stationnement, zones lentes et aéroport en 2026',
  lede: 'Pour louer une trottinette électrique à Charleroi, vous avez **Dott**, **Pony** et **Bolt**, tous trois cités par la Ville et la Région et visibles sur notre carte. Le 17 octobre 2026, Dott affichait 1 € au déverrouillage et 0,35 € la minute, Pony 0,50 € et 0,26 €. Chez Dott, la location se termine sur un de ses emplacements ; dans plusieurs rues de la Ville Basse, les apps brident les trottinettes à 7 ou 8 km/h, et Dott interdit de rouler autour de la gare de Charleroi-Central et des terminaux de l’aéroport.',
  published: '2026-10-17',
  updated: '2026-10-25',
  city: 'be:Charleroi',
  sections: [
    {
      heading: 'Quelles trottinettes partagées à Charleroi en 2026 ?',
      blocks: [
        'Sur sa page trottinette, mise à jour en août 2024, la Ville de Charleroi cite trois opérateurs autorisés : **Dott**, présent depuis juin 2021, **Pony** et **Bolt**. Tous trois détiennent une licence wallonne, et la carte du cyclopartage du SPW Mobilité (données de janvier 2026) les place toujours à Charleroi. La charte de la Ville limite le total à 1 500 engins partagés, vélos compris, et à 500 par opérateur.',
        'Vers 3 h 30 dans la nuit du 17 octobre 2026, notre [carte de Charleroi](map:be:Charleroi) montrait environ 660 trottinettes garées, dont quelque 430 Dott et 230 Pony : un relevé d’une seule nuit, pas la taille des flottes.',
        { note: 'Depuis le 25 octobre 2026, la carte montre aussi Bolt, avec l’emplacement et le niveau de batterie de chaque trottinette : environ 120 ce dimanche-là vers 13 h 50, là encore un simple relevé. Ses prix et ses zones ne se voient que dans son app.' },
        'Pour louer une trottinette :',
        {
          steps: [
            'Repérez-en une sur la carte ; un bouton ouvre l’app de l’opérateur.',
            'Dans l’app, créez un compte, ajoutez un moyen de paiement et scannez le QR code de la trottinette.',
            'Roulez sur la piste cyclable ou sur la chaussée, jamais sur le trottoir.',
            'Garez-la debout à un emplacement autorisé, puis terminez la location dans l’app.',
          ],
        },
        'Toutes les étapes en détail : [comment louer une trottinette](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Dott ou Pony : combien coûte une trottinette à Charleroi ?',
      blocks: [
        'Vous payez le déverrouillage, puis la minute. Pony est le moins cher des deux :',
        {
          table: {
            caption: 'Tarifs publiés dans les données ouvertes des opérateurs le 17 octobre 2026',
            head: ['Opérateur', 'Déverrouillage', 'Par minute', '10 minutes', '20 minutes'],
            rows: [
              ['Dott', '1,00 €', '0,35 €', '4,50 €', '8,00 €'],
              ['Pony', '0,50 €', '0,26 €', '3,10 €', '5,70 €'],
            ],
          },
        },
        'Ces prix excluent pass et promotions ; seul compte le prix affiché dans l’app avant le déverrouillage. Bolt ne publie pas ses tarifs pour Charleroi : consultez-les dans son app. À [Bruxelles](guide:brussels), où les trottinettes partagées disparaîtront le 1er janvier 2027, Dott facture 0,37 € la minute.',
        'La loi autorise la trottinette dès 16 ans, mais Dott et Bolt ne louent qu’à partir de **18 ans** en Belgique. Pony, selon ses conditions belges du 21 août 2025, loue dès **16 ans**.',
      ],
    },
    {
      heading: 'Où garer une trottinette partagée à Charleroi ?',
      blocks: [
        'Chez **Dott**, la location ne se termine que sur un de ses emplacements : ses données ouvertes en comptent 1 078 sur le territoire de la Ville, de Gosselies à Marcinelle, dont près d’une centaine à moins d’un kilomètre du centre. **Pony** en publie 83, tous dans le centre-ville ; ailleurs, son app vous indique où laisser la trottinette.',
        'La charte communale du 30 mai 2022 fixe les règles de stationnement que les opérateurs doivent faire respecter :',
        {
          list: [
            'Garez la trottinette parallèlement au trottoir si possible, en laissant au moins **1,50 m** aux piétons.',
            'Ne bloquez ni les entrées de garage ou de maison, ni les quais des arrêts de bus et de métro, ni les passages pour piétons.',
            'Laissez libres les dalles podotactiles des malvoyants et le passage des services de secours.',
          ],
        },
        'Le 23 mars 2026, le conseil communal a aussi réservé 36 emplacements aux trottinettes et vélos partagés rue de l’Ancre, près du Grand Palais et de la sortie « Porte des Palais » du Ring.',
        'Mal se garer coûte cher : les conditions belges de Dott (23 septembre 2025) prévoient jusqu’à **300 €** de frais de récupération et 50 € par manquement, et les amendes vous sont répercutées avec 50 € de frais en plus. Chez Pony, une trottinette laissée en zone rouge entraîne d’office des frais de ramassage, dont le montant figure dans l’app.',
        'Une trottinette vous bloque le passage ? La charte oblige l’opérateur à la déplacer dans la journée qui suit un signalement. Les numéros publiés par la Ville : Dott 078/48 37 97, Pony 078/251 152, Bolt 02/886 03 04.',
      ],
    },
    {
      heading: 'Ville Basse, gare, parcs : où la trottinette ralentit ou s’arrête',
      blocks: [
        'Ce sont les apps qui ralentissent ou arrêtent la trottinette par GPS, selon leurs propres zones, et une Dott ne dépasse jamais 20 km/h à Charleroi. Ces zones changent : l’app fait foi.',
        {
          table: {
            caption: 'Zones des apps Dott et Pony, selon leurs données ouvertes du 17 octobre 2026',
            head: ['Lieu', 'Dott', 'Pony'],
            rows: [
              ['Gare de Charleroi-Central', 'Circulation interdite', '8 km/h, stationnement interdit'],
              ['Place Verte et rue de Dampremy', '7 km/h ; pas de fin de location place Verte', '8 km/h ; stationnement interdit place Verte'],
              ['Rive Gauche', 'Circulation interdite dans une petite zone', '8 km/h, stationnement interdit'],
              ['Place de la Digue', '7 à 10 km/h, pas de fin de location', '8 km/h'],
              ['Parc Reine Astrid', '10 km/h, pas de fin de location', '8 km/h, stationnement interdit'],
              ['Hôtel de Ville et place du Manège', '20 km/h', '8 km/h'],
              ['Parc de la Serna, à Jumet', '7 km/h', '8 km/h, stationnement interdit'],
              ['Terminaux de l’aéroport', 'Circulation interdite', 'Stationnement interdit'],
            ],
          },
        },
        'Le long de la Sambre, certains tronçons du RAVeL sont aussi interdits chez Dott, notamment à Marcinelle et à Couillet. Si la trottinette s’arrête, poussez-la hors de la zone.',
        'Dans les parcs, jardins, aires de jeux, cimetières et stades communaux, le règlement général de police de la Ville n’admet les trottinettes électriques qu’**au pas**, soit 5 km/h. Dans un parc clos, on ne roule que sur les allées aménagées et signalées pour cela.',
        'Dans une zone piétonne, la loi belge ne vous laisse rouler que si un panneau y admet les cyclistes, et alors au pas : ne pas rouler au pas y coûte 191 €.',
      ],
    },
    {
      heading: 'Aéroport de Charleroi : peut-on y aller en trottinette ?',
      blocks: [
        'Brussels South Charleroi Airport, à Gosselies, se trouve à environ 7 km à vol d’oiseau du centre, dans la zone de Dott. Mais d’après les données ouvertes des deux opérateurs, les terminaux sont dans une zone où Dott interdit de rouler et où Pony interdit de se garer : impossible d’aller jusqu’aux portes avec une Dott ou d’y laisser une Pony.',
        'Dott a des emplacements à environ 250 m au nord du terminal 1, près des parkings, où des trottinettes étaient garées le 17 octobre 2026 : voyez la [carte](map:be:Charleroi).',
        'Avec des bagages, prenez plutôt le bus. Selon l’aéroport, il est à 20 minutes de la gare de Charleroi-Central, que la ligne **A1** du TEC relie aux terminaux quatre fois par heure, de 4 h 30 à 23 h 30. La SNCB vend un billet combiné train et bus.',
      ],
    },
    {
      heading: 'Gare, bus TEC et campus : la trottinette au quotidien',
      blocks: [
        'Avant de prendre le train, le bus ou le métro léger, terminez la location à un emplacement. La gare de Charleroi-Central est interdite de circulation chez Dott, mais Dott et Pony ont chacun un emplacement à une centaine de mètres.',
        'Avec votre propre trottinette, le [dépliant « Vélo et Bus, mode d’emploi » du TEC](https://cdn.uc.assets.prezly.com/d55d1ce8-fb0d-44d5-b8ec-57adeccf25b8/-/inline/no/D%C3%A9pliant%20V%C3%A9lo%20et%20Bus%20_Mode%20d%27emploi.pdf) (2022) précise que les trottinettes pliantes restent avec le voyageur à bord du bus ; seuls les vélos standards vont dans les soutes et sur les porte-vélos. Pour le métro léger, ou une règle plus récente, renseignez-vous auprès du TEC.',
        'Étudiant au CampusUCharleroi, boulevard Solvay, dans la Ville Haute ? Dott et Pony y ont chacun un emplacement à moins de 50 m. À la HELHa de Gilly et à la Haute École Condorcet de Marcinelle, Dott a un emplacement à moins de 100 m ; Pony n’y en a pas, mais ces campus sont dans sa zone.',
      ],
    },
    {
      heading: 'Règles belges et wallonnes : ce qui s’applique à Charleroi',
      blocks: [
        'Pour la loi belge, vous êtes assimilé à un cycliste. L’essentiel :',
        {
          table: {
            caption: 'Règles belges de la trottinette électrique en octobre 2026 (amendes en perception immédiate)',
            head: ['Règle', 'Ce qui s’applique'],
            rows: [
              ['Âge', '16 ans au moins ; pour louer, 18 ans chez Dott et Bolt, 16 ans chez Pony'],
              ['Où rouler', 'Piste cyclable, sinon la chaussée ; jamais sur le trottoir en agglomération'],
              ['Zone piétonne', 'Seulement si un panneau admet les cyclistes, et au pas'],
              ['Passager', 'Interdit : une personne par trottinette'],
              ['Casque', 'Obligatoire depuis le 1er septembre 2026 si la trottinette peut, par construction, dépasser 20 km/h ; une Dott est bridée à 20 km/h, pour Pony et Bolt voyez l’app'],
              ['GSM en main en roulant', '191 €'],
              ['Alcool', 'Moins de 0,5 g/l, comme en voiture ; au-delà, 197 € ou plus'],
            ],
          },
        },
        'En Wallonie, les opérateurs de trottinettes et de vélos partagés ont besoin d’une licence de la Région (décret du 8 juillet 2021, arrêté du 28 août 2023), et chaque commune fixe les conditions d’exploitation sur son territoire. Les règles de conduite restent fédérales : nous n’avons trouvé aucune règle wallonne qui change l’âge, la vitesse ou les amendes.',
        'Charleroi encadre les opérateurs par sa charte de 2022 : chacun déclare son activité, la Ville rend un avis reconduit chaque année, et l’opérateur assure la responsabilité civile des usagers pendant leurs trajets. Le 25 juillet 2026, La DH titrait que Charleroi ne voulait pas interdire les trottinettes partagées, contrairement à Bruxelles ; son chapô, sur un point fait avec l’échevine de la Mobilité, Alicia Monard, ajoutait que « les règles doivent évoluer ». Au 17 octobre 2026, le conseil communal n’avait adopté aucun règlement remplaçant la charte.',
      ],
    },
    {
      heading: 'Le saviez-vous ?',
      blocks: [
        {
          list: [
            'Dott est arrivé le 22 juin 2021 avec une centaine de trottinettes bridées à 18 km/h, à l’intérieur du Ring seulement, à 0,20 € la minute sans frais de déverrouillage.',
            'La charte de 2022 voulait deux tiers des engins partagés hors du Ring ; la page de la Ville, mise à jour en août 2024, tolère 25 % de chaque flotte à l’intérieur.',
            'Selon la charte, les opérateurs doivent retirer de la rue toute trottinette qui n’a pas servi depuis plus de 7 jours.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Quelles trottinettes partagées peut-on louer à Charleroi ?',
      answer: 'Dott, Pony et Bolt, cités par la Ville (2024) et la Région (janvier 2026) et visibles sur notre carte, Bolt depuis le 25 octobre 2026. Dott et Bolt demandent 18 ans, Pony 16 ans.',
    },
    {
      question: 'Combien coûte une trottinette à Charleroi ?',
      answer: 'Le 17 octobre 2026, 20 minutes coûtaient 8,00 € chez Dott (1 € puis 0,35 € la minute) et 5,70 € chez Pony (0,50 € puis 0,26 € la minute), hors pass et promotions.',
    },
    {
      question: 'Peut-on aller à l’aéroport de Charleroi en trottinette partagée ?',
      answer: 'Pas jusqu’aux terminaux : Dott y interdit la circulation et Pony le stationnement. Dott a des emplacements à environ 250 m au nord du terminal 1. Le bus A1 du TEC relie la gare de Charleroi-Central à l’aéroport quatre fois par heure.',
    },
    {
      question: 'Le casque est-il obligatoire sur une trottinette à Charleroi ?',
      answer: 'Seulement si la trottinette peut, par construction, dépasser 20 km/h, depuis le 1er septembre 2026. Une Dott est bridée à 20 km/h à Charleroi ; pour Pony et Bolt, regardez la vitesse maximale dans l’app.',
    },
    {
      question: 'Charleroi va-t-elle interdire les trottinettes partagées comme Bruxelles ?',
      answer: 'Rien ne l’annonce. Le 25 juillet 2026, La DH titrait que Charleroi ne voulait pas les interdire, tout en notant que les règles devaient évoluer. Au 17 octobre 2026, la charte de 2022 restait en vigueur.',
    },
  ],
  sources: [
    { title: 'Ville de Charleroi : se déplacer en trottinette (août 2024)', url: 'https://www.charleroi.be/vivre/mobilite/en-trottinette' },
    { title: 'Ville de Charleroi : charte du cyclopartage en libre-service (30 mai 2022)', url: 'https://www.charleroi.be/assets/files/2022_CRL-Charte-cyclopartage-en-libre-service-2022.pdf' },
    { title: 'Ville de Charleroi : règlement général de police (juillet 2024)', url: 'https://www.charleroi.be/assets/files/RGP-2024.pdf' },
    { title: 'Conseil communal de Charleroi : règlement de la rue de l’Ancre (23 mars 2026)', url: 'https://www.deliberations.be/charleroi/decisions/23-mars-2026-18-30/tec-vo-mob-rc-2026-02-circulation-routiere-reglement-complementaire-section-de-charleroi-rue-de-lancre-dans-son-troncon-compris-entre-la-rue-des-allies-et-le-rond-point-situe-au-debouche-de-la-sortie-ndeg1-porte-des-palais-du-ring-r9-circulation-et' },
    { title: 'SPW Mobilité : licences de cyclopartage en flotte libre en cours de validité', url: 'https://mobilite.wallonie.be/home/politiques-de-mobilite/mobilite-partagee/evolution-de-la-legislation/licence-cyclopartage-en-flotte-libre.html' },
    { title: 'SPW Mobilité : état des lieux de la mobilité partagée (cartes de février 2026)', url: 'https://mobilite.wallonie.be/files/politiques-mobilite/Etat-des-lieux-mobilite-partagee-202602.pdf' },
    { title: 'Dott : Conditions générales Belgique (23 septembre 2025)', url: 'https://ridedott.com/fr/conditions-generales/belgique/' },
    { title: 'Pony : Conditions générales de location Belgique (21 août 2025)', url: 'https://ponybikes.notion.site/Conditions-g-n-rales-de-location-BELGIQUE-9dc071de4f354cdea559e02cfa6abf14' },
    { title: 'Brussels South Charleroi Airport : accès et parking', url: 'https://www.brussels-charleroi-airport.com/fr/parking-access' },
    { title: 'La DH : les trottinettes en free floating arrivent à Charleroi (22 juin 2021)', url: 'https://www.dhnet.be/archives-journal/2021/06/22/les-trottinettes-en-free-floating-arrivent-a-charleroi-GGTZEGTYZNC3LMGJSFBN44RNHU/' },
    { title: 'La DH : Charleroi ne veut pas interdire les trottinettes partagées (25 juillet 2026)', url: 'https://www.dhnet.be/regions/charleroi/2026/07/25/contrairement-a-bruxelles-charleroi-ne-veut-pas-interdire-les-trottinettes-partagees-ca-penaliserait-les-gens-pour-3-tocards-qui-se-comportent-mal-UU7YDGYVNZB57FCTHCWNS4DOKE/' },
  ],
};

export default guide;
