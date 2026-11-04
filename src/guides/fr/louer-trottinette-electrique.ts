import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'fr',
  slug: 'louer-trottinette-electrique',
  topic: 'how-to-rent',
  name: 'Comment louer une trottinette électrique',
  title: 'Louer une trottinette électrique : mode d’emploi et prix',
  description: 'Louer une trottinette électrique en libre-service : app, âge, paiement, prix, pause, fin de location et frais, en Suisse, en France et en Belgique.',
  headline: 'Louer une trottinette électrique en libre-service : le mode d’emploi, de l’app à la photo de fin',
  lede: 'Pour louer une trottinette électrique en libre-service, il vous faut l’app de l’opérateur, un moyen de paiement et, chez la plupart des opérateurs, 18 ans, mais aucun permis en Suisse, en France ni en Belgique. Vous scannez le QR code du guidon, roulez, garez la trottinette dans une zone autorisée et terminez la location dans l’app, souvent avec une photo. Comptez un déverrouillage puis la minute : CHF 1 plus CHF 0.42 chez Voi à Zurich (novembre 2026), 0,99 € plus 0,31 € chez Bolt à Bruxelles (tarif publié le 12 octobre 2026).',
  published: '2026-10-12',
  updated: '2026-10-12',
  sections: [
    {
      heading: 'Comment louer une trottinette électrique, étape par étape',
      blocks: [
        'Le parcours est le même chez tous les opérateurs, à quelques détails près. La première fois, créez votre compte avant de marcher jusqu’à la trottinette.',
        {
          steps: [
            '**Installez l’app de l’opérateur** et créez un compte avec votre numéro de téléphone ou votre e-mail.',
            '**Vérifiez votre âge** si l’app le demande : à Bruxelles, ou chez Dott à Lyon, il faut scanner une pièce d’identité.',
            '**Ajoutez un moyen de paiement.**',
            '**Regardez le prix** : touchez la trottinette sur la carte de l’app, et le déverrouillage et la minute s’affichent.',
            '**Déverrouillez** en scannant le QR code du guidon, ou tapez le numéro imprimé dessous.',
            '**Vérifiez la trottinette** : freins, pneus, batterie, feux. Si elle ne marche pas, signalez-le tout de suite : Dott ne vous facture rien.',
            '**Roulez seul**, selon le code de la route du pays.',
            '**Garez-la dans une zone autorisée**, terminez la location dans l’app et prenez la photo demandée.',
            '**Vérifiez le reçu** : la somme bloquée au départ est libérée et le prix final s’affiche.',
          ],
        },
        '**Premiers trajets.** Chez Bolt, vos 5 premiers trajets sont bridés à 15 km/h, et aux heures de pointe l’app peut vous imposer un test de réaction : après 5 échecs, plus de location pendant 3 heures.',
      ],
    },
    {
      heading: 'Âge, pièce d’identité et paiement : ce qu’il faut pour louer',
      blocks: [
        'Aucun permis n’est demandé pour louer en Suisse, en France ou en Belgique. Ce qui compte, c’est l’âge fixé par l’opérateur.',
        {
          table: {
            caption: 'Âge minimum et contrôle d’identité chez les opérateurs (octobre 2026)',
            head: ['Où', 'Opérateurs', 'Âge minimum', 'Contrôle'],
            rows: [
              ['Suisse', 'Bolt, Voi, Dott, Bird, PubliBike', '18 ans', 'Scan d’une pièce d’identité là où c’est requis'],
              ['France', 'Dott, Bird', '18 ans', 'Pièce d’identité exigée chez Dott à Lyon'],
              ['Bruxelles', 'Bolt, Dott', '18 ans', 'Scan d’une pièce d’identité avant le premier trajet, depuis décembre 2025'],
              ['France et Belgique', 'Pony', '16 ans (18 à Bordeaux)', 'Caution de 0 à 25 € selon la ville, remboursable'],
            ],
          },
        },
        '**Le paiement.** Tous les grands opérateurs acceptent les cartes de crédit et de débit. Apple Pay, Google Pay et PayPal sont courants, mais pas partout : Bolt, par exemple, ne prend PayPal qu’en Allemagne. Dott accepte **TWINT** en Suisse et **Bancontact** en Belgique.',
      ],
    },
    {
      heading: 'Prix d’une trottinette en libre-service : déverrouillage, minute et pass',
      blocks: [
        'Vous payez en général **un déverrouillage**, de 0 à 1 franc ou euro environ, puis **la minute** ; chez Dott, toute minute entamée est due. Le prix varie selon la ville, parfois selon l’heure, et l’app l’affiche avant le départ.',
        {
          table: {
            caption: 'Exemples de tarifs (Voi : novembre 2026 ; Bolt : publiés le 12 octobre 2026), et le prix d’un trajet',
            head: ['Ville et opérateur', 'Déverrouillage + minute', '10 minutes', '20 minutes'],
            rows: [
              ['Zurich, Berne (Voi)', 'CHF 1 + 0.42', 'CHF 5.20', 'CHF 9.40'],
              ['Bâle (Bolt)', 'CHF 1 + 0.45', 'CHF 5.50', 'CHF 10.00'],
              ['Bienne (Voi)', 'CHF 1 + 0.39', 'CHF 4.90', 'CHF 8.80'],
              ['Marseille (Voi)', '1 € + 0,27 €', '3,70 €', '6,40 €'],
              ['Grenoble (Voi)', '0,49 € + 0,25 €', '2,99 €', '5,49 €'],
              ['Bruxelles (Bolt)', '0,99 € + 0,31 €', '4,09 €', '7,19 €'],
            ],
          },
        },
        'Les tarifs de Dott changent d’une ville à l’autre : en général de 0,17 à 0,55 € la minute. Seul le prix affiché dans l’app fait foi.',
        '**La somme bloquée sur votre carte.** Au départ, l’opérateur réserve un petit montant : chez Dott, CHF 3 en Suisse, 2,50 € en France et 3 € en Belgique. Il est libéré à la fin du trajet, mais votre banque peut mettre plusieurs jours à l’afficher.',
        '**Pass et forfaits.** Si vous roulez souvent, un paquet de minutes (le Minute Pass de Dott, dans certaines villes), un pass 24 heures (Pony, dès 4 €) ou un abonnement à déverrouillages gratuits (pass Bolt, Pony dès 8,50 € les 30 jours) revient moins cher. En France, Dott a aussi un tarif solidaire, de 60 à 75 % moins cher.',
      ],
    },
    {
      heading: 'Réserver ou mettre en pause une trottinette : ce que ça coûte',
      blocks: [
        'Réserver garde la trottinette pour vous le temps de la rejoindre ; la pause la verrouille pendant un arrêt, sans terminer la location, et elle est presque toujours payante.',
        {
          table: {
            caption: 'Réservation et pause selon l’aide en ligne des opérateurs (octobre 2026)',
            head: ['Opérateur', 'Réservation', 'Pause'],
            rows: [
              ['Dott', '10 minutes gratuites, dans certaines villes', 'Jusqu’à 30 minutes, à la minute'],
              ['Bolt', 'Possible, durée et prix dans l’app', 'Sur une place bleue, à la minute'],
              ['Bird', 'Jusqu’à 30 minutes, à la minute', 'Jusqu’à 75 minutes, à la minute'],
            ],
          },
        },
        'Ne vous éloignez jamais sans pause ni fin de location. Dott termine d’office la location après 10 à 30 minutes sans utilisation.',
      ],
    },
    {
      heading: 'Terminer la location : où se garer, la photo et les frais',
      blocks: [
        'C’est l’étape qui coûte cher quand on la rate. L’app dessine des zones sur sa carte, avec des couleurs qui varient d’un opérateur à l’autre :',
        {
          list: [
            '**zone interdite** (souvent rouge) : la trottinette s’arrête ; sortez-en à pied ;',
            '**zone lente** (souvent jaune) : la vitesse est bridée ;',
            '**stationnement interdit** : impossible d’y terminer la location, et le compteur tourne ;',
            '**stationnement obligatoire** (souvent bleu, avec un « P ») : dans certaines villes, le seul endroit où terminer ;',
            '**hors de la zone de service** : la trottinette s’arrête, et vous ne pouvez terminer qu’en y revenant.',
          ],
        },
        'Garez la trottinette debout, béquille baissée, sans bloquer le trottoir ni une entrée, puis prenez la photo : Dott la fait analyser par une intelligence artificielle. Dans la métropole lilloise, une Lime doit être rendue dans l’une des près de 1 400 stations ; à Bruxelles, dans une dropzone.',
        { note: 'Tant que l’app n’a pas confirmé la fin de la location, vous payez. Avant de vous éloigner, vérifiez que l’écran indique bien que le trajet est terminé.' },
        {
          table: {
            caption: 'Ce que les opérateurs peuvent facturer pour un mauvais stationnement (octobre 2026)',
            head: ['Opérateur', 'Frais possibles'],
            rows: [
              ['Bolt', 'En Suisse, jusqu’à CHF 100 pour récupérer une trottinette laissée hors zone, et CHF 500 si elle n’est pas rendue dans les 48 heures'],
              ['Dott', 'Jusqu’à 300 € selon ses conditions générales, plus 50 € de frais s’il vous transmet une amende'],
              ['Pony', '15 € hors emplacement, 25 € hors zone, 50 € en zone rouge'],
            ],
          },
        },
        'L’amende de la police s’y ajoute : en Suisse, CHF 20 si vous ne laissez pas 1,50 m aux piétons sur le trottoir ([règles suisses](guide:swiss-rules)) ; en France, 35 € pour un stationnement gênant ([règles françaises](guide:french-rules)).',
      ],
    },
    {
      heading: 'Accident, panne ou dégât : que faire ?',
      blocks: [
        {
          steps: [
            '**Mettez-vous en sécurité**, et appelez le 112 si quelqu’un est blessé.',
            '**Photographiez** les lieux, les véhicules, le numéro de la trottinette et les dégâts, et échangez vos coordonnées.',
            '**Signalez l’accident dans l’app**, avec la date, le lieu et le numéro du trajet.',
            '**Prévenez la police** s’il y a des blessés, des dégâts ou un vol ; Pony le demande dans les 24 heures.',
          ],
        },
        '**L’assurance.** Les grands opérateurs incluent une responsabilité civile. En Suisse, celle de Bolt ne passe qu’après votre RC privée, et PubliBike n’en inclut aucune. En France et en Belgique, Dott et Pony y ajoutent une assurance accident ; chez Dott, rouler à deux annule la couverture.',
      ],
    },
    {
      heading: 'Louer une trottinette à l’étranger : pass, solde et règles',
      blocks: [
        'Votre compte vous suit d’un pays à l’autre, votre argent beaucoup moins : les pass Dott ne valent que dans le pays d’achat, un pass Bolt que dans sa ville, et chez Dott, Bird et Bolt, un solde en francs ne paie pas un trajet en euros.',
        'Les règles, elles, changent à la frontière :',
        {
          list: [
            '**Suisse** : 18 ans chez tous les opérateurs, feux allumés de jour comme de nuit, casque recommandé mais pas obligatoire.',
            '**France** : plus de trottinettes en libre-service à Paris depuis le 1er septembre 2023 ([où en trouver autour de Paris](guide:paris)) ; casque obligatoire dans plusieurs départements, dont le Rhône, où Lyon n’autorise plus que Dott ([guide de Lyon](guide:lyon)).',
            '**Belgique** : scan d’identité à Bruxelles, où les trottinettes partagées doivent disparaître après le 31 décembre 2026 ([guide de Bruxelles](guide:brussels)).',
            '**Italie** : casque obligatoire pour tous, même en libre-service, et les opérateurs n’en fournissent en général pas.',
            '**Royaume-Uni** : il faut un permis de conduire, scanné dans l’app.',
          ],
        },
      ],
    },
    {
      heading: 'Quelle application pour louer une trottinette électrique ?',
      blocks: [
        'Pour louer, il vous faut l’app de l’opérateur (Lime, Dott, Voi, Bolt, Bird, Pony…), et chacune ne montre que sa propre flotte.',
        'Pour les voir toutes, [ScootRadar](/map) réunit sur une seule carte les trottinettes de plusieurs opérateurs, avec la batterie quand l’opérateur la publie, le temps de marche et une estimation du prix d’après les tarifs publiés. Il est gratuit, sans compte ni pub, et marche dans le navigateur comme sur iPhone. Il ne déverrouille rien : un bouton ouvre l’app de l’opérateur, où vous payez. Les positions peuvent dater de quelques minutes.',
        'Google Maps montre aussi le véhicule le plus proche dans les villes qu’il couvre. Et avec l’app Uber, vous pouvez louer une Lime, à Zurich par exemple ; vos pass d’opérateur n’y comptent en général pas.',
      ],
    },
  ],
  faq: [
    {
      question: 'Peut-on louer une trottinette électrique sans carte de crédit ?',
      answer: 'Souvent, oui : beaucoup d’opérateurs prennent les cartes de débit, Apple Pay, Google Pay ou PayPal, mais pas dans toutes les villes. En Suisse, Dott accepte TWINT ; en Belgique, Bancontact.',
    },
    {
      question: 'Faut-il un permis pour louer une trottinette en libre-service ?',
      answer: 'Non, ni en Suisse, ni en France, ni en Belgique : il faut l’âge exigé par l’opérateur, 18 ans en général, 16 ans chez Pony (18 ans à Bordeaux). Au Royaume-Uni, en revanche, le permis de conduire est exigé.',
    },
    {
      question: 'Peut-on louer plusieurs trottinettes avec un seul compte ?',
      answer: 'Oui : jusqu’à cinq chez Bird et Pony, en général trois chez Dott. Le titulaire du compte paie tous les trajets et répond des dégâts, et chaque personne doit avoir l’âge exigé.',
    },
    {
      question: 'Que faire si l’app refuse de terminer la location ?',
      answer: 'Vous êtes sans doute en zone de stationnement interdit ou hors de la zone de service. Rejoignez la zone autorisée la plus proche sur la carte de l’app et réessayez : tant que la fin n’est pas confirmée, le compteur tourne. Si rien n’y fait, contactez l’aide depuis l’app.',
    },
    {
      question: 'Pourquoi de l’argent reste-t-il bloqué après le trajet ?',
      answer: 'C’est la préautorisation prise au départ. L’opérateur la libère à la fin du trajet, mais votre banque peut mettre plusieurs jours à l’afficher : jusqu’à 14 jours selon Bolt.',
    },
  ],
  sources: [
    { title: 'MobiData BW : tarifs de Voi en Suisse (GBFS, Datenlizenz Deutschland – Namensnennung – Version 2.0)', url: 'https://api.mobidata-bw.de/sharing/gbfs/v3/voi_ch/system_pricing_plans' },
    { title: 'Voi : tarif et zones de Marseille (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/66/netex.xml' },
    { title: 'Voi : tarif et zones de Grenoble (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/358/netex.xml' },
    { title: 'Ville de Winterthour : offres de partage, dont l’âge minimum de Voi (en allemand)', url: 'https://stadt.winterthur.ch/themen/mobilitaet/oev-taxi-sharing/sharing-angebote' },
    { title: 'Dott : quel est le prix d’un trajet ?', url: 'https://help.ridedott.com/fr/articles/189' },
    { title: 'Dott : moyens de paiement', url: 'https://help.ridedott.com/fr/articles/209' },
    { title: 'Bolt : trottinettes électriques, prix et sécurité (en anglais)', url: 'https://bolt.eu/en/scooters/' },
    { title: 'Pony : centre d’aide', url: 'https://ponybikes.notion.site/ponybikes/Centre-d-Aide-Pony-13171070975549a7b69be9e5249bd916' },
  ],
};

export default guide;
