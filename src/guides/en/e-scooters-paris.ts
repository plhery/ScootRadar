import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-paris',
  topic: 'paris',
  name: 'E-scooters in Paris',
  title: 'E-scooter Paris 2026: the ban and what to ride instead',
  description: 'Can you rent an e-scooter in Paris? Not since 2023. What Vélib’ and Lime, Dott and Voi e-bikes cost, the nearest shared scooters, and rules for your own.',
  headline: 'E-scooters in Paris: why you can’t rent one, and what to ride instead',
  lede: 'You can’t rent a shared e-scooter in Paris: the city ended the service on 1 September 2023, after a vote on 2 April 2023 in which 89.03% said no, on a turnout of 7.46%. Ride a Vélib’ (€3 for 45 minutes) or a Lime, Dott or Voi e-bike instead (Voi: €0.29 a minute, no unlock fee, published rate on 12 October 2026). The nearest shared e-scooters are in the outer suburbs, around Versailles, in Saint-Quentin-en-Yvelines and near Disneyland Paris, where helmets are compulsory. Your own e-scooter is allowed in Paris, with a helmet and a high-visibility vest at all hours since 7 August 2026.',
  published: '2026-10-12',
  updated: '2026-10-13',
  city: 'fr:Versailles Grand Parc',
  sections: [
    {
      heading: 'Can you rent an e-scooter in Paris?',
      blocks: [
        'No. On 12 October 2026 the public data feeds of Dott, Lime and Voi for Paris held nothing but e-bikes. As far as we know, no return of shared e-scooters has been announced, not even since Emmanuel Grégoire became mayor on 29 March 2026.',
        '**Is Lime in Paris?** Yes, with e-bikes. Lime, Dott and Voi each run 3,000 to 6,000 of them under a four-year agreement with the city that began on 1 October 2025. Hiring an e-scooter from a shop is still legal: the ban covers only shared scooters left on the street.',
      ],
    },
    {
      heading: 'Why Paris banned shared e-scooters',
      blocks: [
        'On Sunday 2 April 2023 the city asked its residents one question: “For or against shared e-scooters?” Voting was in person only, at 203 polling stations.',
        {
          table: {
            caption: 'Results of the Paris vote on shared e-scooters, 2 April 2023 (City of Paris)',
            head: ['Result', 'Votes', 'Share'],
            rows: [
              ['Against', '91,385', '89.03% of valid votes'],
              ['For', '11,256', '10.97%'],
              ['Blank or void', '443', '–'],
              ['Turnout', '103,084 of 1,382,322 registered voters', '7.46%'],
            ],
          },
        },
        'Clément Beaune, then transport minister, called the turnout “humiliating”. The vote was only advisory, but the city followed it and let the street-use agreements of Dott, Lime and Tier expire at midnight on 31 August 2023. Each had been allowed up to 5,000 scooters, 15,000 in all.',
      ],
    },
    {
      heading: 'What to ride instead: Vélib’ and shared e-bikes',
      blocks: [
        '**Vélib’ Métropole** has 20,000 docked bikes, about 40% of them electric, at a little under 1,500 stations in Paris and 66 nearby towns. In Paris there is one every 300 metres.',
        {
          table: {
            caption: 'Vélib’ tickets and passes for visitors (velib-metropole.fr, 12 October 2026)',
            head: ['Ticket or pass', 'Price', 'What you get'],
            rows: [
              ['Ticket-V', '€3', 'One 45-minute ride on a classic or electric bike'],
              ['Pass 24h Classique', '€5', '24 hours; classic bikes free for 30 minutes a ride; electric bikes €2 a ride'],
              ['Pass 24h Électrique', '€10', '24 hours; classic bikes free for 60 minutes a ride; five free 45-minute electric rides'],
              ['Pass 3 jours', '€20', '72 hours, with the same rides as the Pass 24h Électrique'],
            ],
          },
        },
        'Beyond the time included, you pay €1 (classic) or €2 (electric) per 30 minutes. Buy them on the Vélib’ website or app, or in the Île-de-France Mobilités app, which then lets you unlock with a Navigo card; passes are also sold in the Bonjour RATP app.',
        '**Lime, Dott and Voi** e-bikes are dockless: unlock one in the app and end the ride at a bike bay.',
        {
          table: {
            caption: 'Shared bikes in Paris: what a ride costs (published rates on 12 October 2026)',
            head: ['Service', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Voi', '€0', '€0.29', '€2.90', '€5.80'],
              ['Dott', '€1', '€0.35', '€4.50', '€8.00'],
              ['Lime', 'Not published', 'Not published', 'See the app', 'See the app'],
              ['Vélib’ (Ticket-V)', '€3 a ride', '45 min included', '€3', '€3'],
            ],
          },
        },
        'Lime publishes no Paris rates, so check its app before you unlock; with every operator, the app shows the final price. Since 1 October 2025, shared bikes may only be left in bike bays without racks or at racks with at least four hoops, never on the pavement.',
      ],
    },
    {
      heading: 'Shop rentals, tours and mopeds',
      blocks: [
        'Hiring an e-scooter from a shop by the hour or the day, or joining a guided e-scooter tour, is legal. You then ride under the rules for your own scooter below, so ask the shop for a helmet and a vest.',
        'A language trap: in French, a “scooter” is a moped, and an e-scooter is a “trottinette électrique”. The shared mopeds of **Yego** and **Cooltra** are motor vehicles: check in their app which driving licence they require.',
      ],
    },
    {
      heading: 'The nearest shared e-scooters to Paris',
      blocks: [
        'There are none in Paris, and as far as we know none in the three départements around it: no operator publishes shared e-scooter data there. At about 10:45 on 12 October 2026, the map showed about 1,650 in the outer suburbs, in five areas. In the evening the nearest to Notre-Dame was about 14 km away as the crow flies, in Bougival.',
        {
          table: {
            caption: 'The nearest shared e-scooters to Paris: published rates and scooters on the map, 12 October 2026',
            head: ['Area', 'Operator', 'Published rate', '10 / 20 minutes', 'On the map at 10:45'],
            rows: [
              ['Around Versailles (La Celle-Saint-Cloud, Le Chesnay-Rocquencourt, Bougival)', 'Dott', '€1 + €0.25/min', '€3.50 / €6.00', 'About 100'],
              ['Saint-Quentin-en-Yvelines (Montigny-le-Bretonneux, Guyancourt, Trappes…)', 'Voi', '€0.49 + €0.25/min', '€2.99 / €5.49', 'About 680'],
              ['Grand Paris Seine & Oise (Poissy, Conflans-Sainte-Honorine, Mantes-la-Jolie…)', 'Voi', '€0.49 + €0.23/min', '€2.79 / €5.09', 'About 540'],
              ['Marne-la-Vallée (Lagny-sur-Marne, Bussy-Saint-Georges, Montévrain)', 'Dott', '€1 + €0.29/min', '€3.90 / €6.80', 'About 180'],
              ['Évry-Courcouronnes', 'Pony', '€1 + €0.23/min', '€3.30 / €5.60', 'About 150'],
            ],
          },
        },
        'The counts are a snapshot of the map, not fleet sizes, and the app shows the final price.',
        {
          list: [
            '**Around Versailles**: none in the town itself. At about 6 pm on 12 October 2026, the nearest Dott to the Château was about 1.4 km away, in Le Chesnay-Rocquencourt. The [map around Versailles](map:fr:Versailles Grand Parc) also shows Voi scooters from the Saint-Quentin service.',
            '**Saint-Quentin-en-Yvelines**: Voi, across the area’s 12 towns; you pick up and return scooters at stations. [See Saint-Quentin on the map](map:fr:Saint-Quentin-en-Yvelines).',
            '**Grand Paris Seine & Oise**: Voi since 4 May 2026, in three separate clusters, so you can’t ride from Poissy to Meulan. Riders must be 18, scooters slow to 10 km/h near schools and bridges, and the meter runs until you park in a station. [See Seine & Oise on the map](map:fr:Grand Paris Seine et Oise).',
            '**Marne-la-Vallée**: Dott, but none in Chessy or Serris on 12 October 2026; at about 6 pm, the nearest to Disneyland Paris was about 1.1 km away, in Montévrain. [See Marne-la-Vallée on the map](map:fr:Marne-la-Vallée (SIEMU)).',
            '**Évry-Courcouronnes**: Pony, since March 2022.',
          ],
        },
        { note: 'Bring a helmet. In the Yvelines (around Versailles, Saint-Quentin, Seine & Oise), a helmet and a vest or reflective gear have been compulsory at all hours since 15 September 2026, and a Seine-et-Marne order of 2 July 2026 requires a helmet and reflective gear around Marne-la-Vallée. Essonne, where Évry is, followed on 5 October 2026: a helmet and a vest or reflective gear at all hours, bike lanes included.' },
        'The minimum age is 18 in Seine & Oise; elsewhere, check the app. First time on a shared scooter? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Riding your own e-scooter in Paris: the rules',
      blocks: [
        'Your own e-scooter is legal in Paris from age 14, if it is insured and built for no more than 25 km/h. Since 7 August 2026, an order of the Paris police prefect has also required a helmet and a high-visibility vest or reflective gear at all hours, in Paris and the three départements around it. It covers e-scooters and similar devices, not bikes.',
        {
          table: {
            caption: 'The e-scooter rules that cost the most in Paris (12 October 2026)',
            head: ['Rule', 'What to do', 'Fine'],
            rows: [
              ['Helmet', 'Wear one at all hours, bike lanes included', '€135'],
              ['Vest', 'Vest or reflective gear, at all hours', '€35'],
              ['Pavement', 'Never ride on it; get off and push', '€135'],
              ['Passenger', 'One rider only', '€135'],
              ['Earphones, phone in hand', 'Not even one earbud', '€135'],
              ['Red light', 'Stop, like any driver', '€135'],
              ['Insurance', 'Third-party liability cover', '€500 (criminal offence)'],
            ],
          },
        },
        'Use the bike lane where there is one, otherwise a road limited to 50 km/h or less. Almost all of Paris has been limited to 30 km/h since 30 August 2021, so nearly every street is open to you, but never ride the Périphérique ring road. In pedestrian areas, go at walking pace; in parks, get off and push.',
      ],
    },
    {
      heading: 'Parking and taking your e-scooter on the metro',
      blocks: [
        'Since a mayoral order of 30 July 2019, e-scooters may not park on the pavement, in pedestrian areas or on the road. Use the motorbike and moped bays, where e-scooters park for free. Leave it anywhere else and you can be fined; the city does not publish the amount.',
        'On the RATP network (the metro, the RATP-run parts of the RER, buses, trams and the Montmartre funicular), a folding e-scooter must stay folded and held in your hand at all times on board. Riding it anywhere in the network, or keeping it unfolded on board, costs €150, plus €50 in fees if you don’t pay on the spot. On SNCF trains, do the same and check SNCF’s conditions.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Not one district voted to keep them.** Even the most pro-scooter, Paris Centre, gave “for” just 14.23%.',
            '**Paris once expected 40,000.** In June 2019 the city counted nearly 20,000 shared e-scooters and said there could be 40,000 by the end of the year.',
            '**Many only moved to the suburbs.** Tier planned to keep a third of its Paris fleet in the region, around Marne-la-Vallée or Saint-Germain-en-Laye, AFP reported. Dott, which absorbed Tier, still runs scooters around Marne-la-Vallée.',
            '**In Évry you could own a shared scooter.** When Pony launched there in 2022, residents could buy one and receive 50% of the revenue from its rides.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Is Lime still in Paris?',
      answer: 'Yes, but only with e-bikes, alongside Dott and Voi, under a four-year agreement that began on 1 October 2025. Lime doesn’t publish its Paris rates, so check the price in its app.',
    },
    {
      question: 'Will shared e-scooters come back to Paris?',
      answer: 'Not as far as we know: as of 12 October 2026, no return has been announced. Some rental guides still list Lime, Bird or Dott scooters in Paris, so check their date.',
    },
    {
      question: 'How much is a Vélib’ day pass?',
      answer: '€5 for the Pass 24h Classique, with free 30-minute rides on classic bikes and electric rides at €2 each. The €10 Pass 24h Électrique includes five 45-minute electric rides, and three days cost €20.',
    },
    {
      question: 'Do I need a helmet on a Vélib’ or a Lime e-bike?',
      answer: 'Not as an adult. The Paris order of 7 August 2026 covers e-scooters and similar devices, not bikes or e-bikes.',
    },
    {
      question: 'Are there shared e-scooters at Versailles or Disneyland Paris?',
      answer: 'Not in the town of Versailles, nor in Chessy or Serris, as of 12 October 2026. Dott runs next door: in Le Chesnay-Rocquencourt and Bougival near Versailles, and in Montévrain and Bussy-Saint-Georges near Disneyland. Both areas require a helmet.',
    },
  ],
  sources: [
    { title: 'City of Paris: end of shared e-scooters on 31 August 2023, vote results (French)', url: 'https://www.paris.fr/pages/pour-ou-contre-les-trottinettes-en-libre-service-23231' },
    { title: 'City of Paris: the shared e-scooter vote, results by district (French)', url: 'https://www.paris.fr/pages/interdiction-des-trottinettes-en-libre-service-les-parisiens-voteront-22954' },
    { title: 'City of Paris: shared bikes, a third operator from 1 October 2025 (French)', url: 'https://www.paris.fr/pages/velo-en-libre-service-bientot-un-troisieme-operateur-a-paris-31482' },
    { title: 'City of Paris: e-scooter traffic rules, updated 10 August 2026 (French)', url: 'https://www.paris.fr/pages/trottinettes-electriques-de-nouvelles-regles-de-circulation-7249' },
    { title: 'Paris police prefecture: order 2026-00969 of 7 August 2026 on helmets and vests (PDF, French)', url: 'https://cdn.paris.fr/paris/2026/08/10/arrete-2026_00969_07082026-1-nPt1.pdf' },
    { title: 'Vélib’ Métropole: tickets, passes and subscriptions', url: 'https://www.velib-metropole.fr/offers' },
    { title: 'RATP: can I take my bike or scooter on the network? (French)', url: 'https://www.ratp.fr/aide-contact/questions/preparer-mon-trajet/voyage-en-regle/emporter-velo-trottinette' },
    { title: 'RATP: travelling the network with a scooter (French)', url: 'https://www.ratp.fr/services-aux-voyageurs/services-de-mobilite/le-reseau-en-trottinette' },
    { title: 'Meulan-en-Yvelines: Voi e-scooters in Grand Paris Seine & Oise (French)', url: 'https://ville-meulan.fr/print/pdf/node/2348' },
    { title: 'Yvelines prefecture: order 78-2026-09-07-00004 on helmets and vests, copy published by Bois-d’Arcy (PDF, French)', url: 'https://www.boisdarcy.fr/arrete-pref.pdf' },
    { title: 'Vauhallan town hall: new rules for e-scooters across Essonne, 12 October 2026 (French)', url: 'https://www.vauhallan.fr/actualites/de-nouvelles-regles-pour-les-trottinettes-electriques-en-essonne-4675' },
  ],
};

export default guide;
