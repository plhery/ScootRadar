import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-brussels',
  topic: 'brussels',
  name: 'Renting an e-scooter in Brussels',
  title: 'E-scooter Brussels 2026: Bolt and Dott prices, 2027 ban',
  description: 'Rent a Bolt or Dott e-scooter in Brussels until 31 December 2026: €0.31 a minute on Bolt, €0.37 on Dott. 18+ with an ID scan; end rides in a drop zone.',
  headline: 'E-scooters in Brussels: renting until 31 December 2026, prices, drop zones and the 2027 ban',
  lede: 'You can still rent an e-scooter in Brussels until 31 December 2026, from Bolt (€0.99 to unlock, then €0.31 a minute) or Dott (€1, then €0.37 a minute), under a transitional arrangement (rates published on 30 October 2026). You must be 18, scan an ID document in the app and end every ride in a drop zone. The Brussels government has decided there will be no shared e-scooters from 1 January 2027, only shared bikes; your own e-scooter stays legal.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'be:Bruxelles',
  sections: [
    {
      heading: 'Can you still rent an e-scooter in Brussels?',
      blocks: [
        'Yes, until 31 December 2026, from **Bolt** and **Dott**, the two operators the region chose at the end of 2023, under a transitional arrangement announced on 21 August 2026.',
        { note: 'The last day is 31 December 2026: the Brussels government has decided there will be no shared e-scooters in the Brussels-Capital Region from 1 January 2027.' },
        'At 13:36 on 30 October 2026 the [map around Brussels](map:be:Bruxelles) showed about 5,750 free to rent at that moment, not the whole fleet: some 3,100 from Dott and 2,650 from Bolt. To rent one:',
        {
          steps: [
            'Find the nearest scooter on the map: ScootRadar shows Bolt and Dott together.',
            'Open the operator’s app, create an account and scan your ID document.',
            'Scan the QR code on the scooter and ride on the cycle lane or the road.',
            'Park it upright in a drop zone and end the ride.',
          ],
        },
        'Every step in detail: [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'The Brussels e-scooter ban from 1 January 2027: what was decided',
      blocks: [
        'On 11 June 2026 the Brussels government decided to grant no more licences for shared e-scooters after 2026. It pointed to 666 people injured in e-scooter accidents in the region in 2025 (all e-scooters, not only shared ones; 26% more than in 2024), to blocked pavements and to crime: the Brussels prosecutor said shared scooters had been used in 25 shootings over the previous year.',
        'On 29 July 2026, ruling on appeals by Lime, the Council of State annulled every Brussels licence for shared scooters and free-floating bikes, Bolt’s and Dott’s included. Brussels Mobility first told the operators to clear the streets by 1 September; then, on 21 August, the government announced a transitional arrangement: shared scooters may stay until 31 December 2026, while the end on 1 January 2027 stands.',
        'The decision still stood on 30 October 2026; a petition to keep the scooters, signed by over 1,000 Brussels residents, is to be heard by Parliament’s mobility committee. Only **shared** scooters go. Your **own e-scooter** stays legal, though from 1 June 2027 no e-scooter may go faster than 20 km/h anywhere in the Brussels Region.',
        '**Shared bikes** take over: under the transitional arrangement, up to 2,500 free-floating bikes per operator until May 2028, then two licences of 4,800 bikes each, awarded by tender.',
      ],
    },
    {
      heading: 'Bolt or Dott: e-scooter prices in Brussels',
      blocks: [
        'You pay to unlock, then by the minute; the app shows the final price.',
        {
          table: {
            caption: 'Published rates in Brussels on 30 October 2026',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Bolt, e-scooter', '€0.99', '€0.31', '€4.09', '€7.19'],
              ['Dott, e-scooter', '€1.00', '€0.37', '€4.70', '€8.40'],
              ['Bolt, e-bike', 'Free', '€0.25', '€2.50', '€5.00'],
              ['Dott, e-bike', '€1.00', '€0.32', '€4.20', '€7.40'],
            ],
          },
        },
        'Ride passes and subscriptions are priced only in the apps.',
      ],
    },
    {
      heading: 'Age and ID: who can rent an e-scooter in Brussels?',
      blocks: [
        'Belgian law lets you ride an e-scooter from 16, but Bolt and Dott rent only to over-18s in Belgium. At 16 or 17 you may ride your own scooter, not a shared one.',
        'Since **3 December 2025**, both operators have made every Brussels user scan an identity document in the app before the first unlock. Bolt and Dott agreed to it with Brussels mayors and the public prosecutor, who had linked the scooters to drug dealing.',
        'Dott accepts a national ID card, driving licence, passport or residence permit in Brussels; Bolt’s terms mention a driving licence or another official ID. Just arrived and still waiting for your Belgian residence card? Use your passport with Dott.',
      ],
    },
    {
      heading: 'Drop zones: where to park an e-scooter in Brussels',
      blocks: [
        'Since **1 February 2024** you can end a ride only in a **drop zone**. Anywhere else the app won’t lock the scooter, and the meter keeps running.',
        'A drop zone is either a box painted on the ground or an area that exists only in the app. The City of Brussels alone lists **400**, 226 of them in the Pentagon, the old centre inside the inner ring. Find the nearest in the app before you arrive, and leave the scooter upright. On protest days the Region can have the Pentagon cleared: from 22 to 24 October 2026 you couldn’t end a ride there.',
        {
          list: [
            '**Uccle** has no drop zones on its own municipal streets, only on regional roads, and in the south of the commune you can neither ride nor park a Dott.',
            '**Brussels Airport** is in Zaventem, outside the region: you can’t end a ride there.',
          ],
        },
        'Bad parking costs money, on top of any police fine:',
        {
          table: {
            caption: 'What Bolt and Dott charge for bad parking in Belgium',
            head: ['Operator', 'What you may pay'],
            rows: [
              ['Bolt (terms in force from 1 December 2026)', '€20 automatic fee if you leave it outside an authorised area; up to €100 to collect the scooter, up to €120 to search for it, up to €500 if it isn’t back within 48 hours; fines passed on, plus up to €30 in fees'],
              ['Dott (terms of 23 September 2025)', 'Up to €300 to recover a badly parked scooter; €50 per breach of the terms; fines passed on, plus €50 in fees'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Speed limits and no-go zones: Grand-Place, parks and stations',
      blocks: [
        'Shared e-scooters are limited to **20 km/h** across the region and, under Brussels rules, to **8 km/h** in pedestrian zones and parks. The app enforces this by GPS, slowing or stopping the scooter, and Bolt’s and Dott’s limits differ.',
        'The city-centre pedestrian zone, the piétonnier, covers Boulevard Anspach, the Bourse, the Grand-Place and the streets around them. The semi-pedestrian stretch of Chaussée d’Ixelles, between Chaussée de Wavre and Place Fernand Cocq, is 8 km/h too. By law you ride at walking pace in a pedestrian zone and give way to people on foot, or risk a €191 fine.',
        'The City of Brussels plans to close the piétonnier’s north–south axis to bikes and e-scooters outside 4:00–11:00. Announced for early 2026, it still had no date on 16 October 2026, La DH reported: follow the signs.',
        {
          table: {
            caption: 'Zones in the apps on 12 October 2026 (the app shows the current ones)',
            head: ['Place', 'What the app does'],
            rows: [
              ['Galeries Royales Saint-Hubert', 'No riding'],
              ['Gare du Midi (Brussels-Midi), the Eurostar and TGV station', 'No riding and no ending rides around the station'],
              ['Central Station (Gare Centrale)', 'Ride through, no parking'],
              ['Gare du Nord (Brussels-North)', 'No ending rides on Bolt'],
              ['Brussels Park (Parc de Bruxelles), by the Royal Palace', 'No riding on Dott'],
              ['Parc Léopold, in the European Quarter', 'No riding on Dott; slow, no parking on Bolt'],
              ['Parc du Cinquantenaire', 'Ride through, no parking on Dott'],
              ['Bois de la Cambre', 'Slow; no parking on Bolt'],
              ['Parks in Saint-Gilles and Forest', 'Mostly no riding'],
            ],
          },
        },
        'If the scooter stops, push it out of the zone. Catching a Eurostar or TGV at Brussels-Midi, or just off one? Start and end your ride in a drop zone outside the station area.',
      ],
    },
    {
      heading: 'E-scooter rules in Belgium: what gets you fined',
      blocks: [
        'Under Belgian law an e-scooter rider counts as a cyclist. The essentials:',
        {
          table: {
            caption: 'Belgian e-scooter rules in October 2026 (on-the-spot fines, plus a €10.67 administrative fee)',
            head: ['Rule', 'What applies'],
            rows: [
              ['Age', '16 to ride your own; 18 to rent from Bolt or Dott'],
              ['Where to ride', 'The cycle lane or path if there is one, otherwise the road; never the pavement in built-up areas'],
              ['Speed', 'Shared scooters 20 km/h; your own built for 25 km/h at most, and 20 km/h anywhere in the Brussels Region from 1 June 2027'],
              ['Passengers', 'Banned: one person per scooter'],
              ['Helmet', 'Required since 1 September 2026 if your scooter can go faster than 20 km/h, so not on a shared one; €64 if you ride without'],
              ['Phone in your hand', '€191'],
              ['Pedestrian zone', 'Only where a sign allows it, and at walking pace: €191 if you go faster'],
              ['Alcohol', 'Under 0.5 g/l, as for drivers; above that, from €197 and a 12-hour riding ban'],
            ],
          },
        },
        'Between the lower town (the Bourse, the Grand-Place) and the upper town (Mont des Arts, the Sablon), the streets climb steeply, often over cobblestones, and the scooter can stop dead in the Galeries Royales or Brussels Park. Cross tram rails as close to a right angle as you can. In the metro, STIB asks you not to ride in corridors or on platforms, and to leave shared scooters at street level.',
        '**New Year’s Eve.** From noon on 31 December 2025 to 9:00 on 1 January 2026, every e-scooter, private ones included, was banned across the region. By 30 October 2026 no ban had been announced for 31 December 2026, the last day of shared scooters.',
      ],
    },
    {
      heading: 'Alternatives to e-scooters in Brussels: shared e-bikes and Villo!',
      blocks: [
        'Bolt’s and Dott’s **shared e-bikes** stay after 31 December 2026. At 14:02 on 30 October 2026, about 1,750 Bolt and 1,850 Dott e-bikes were free to rent at that moment, not the whole fleet; Bolt had just added 500 on 6 October, La Libre reported. Voi rents shared bikes too. You park them in drop zones.',
        '**Villo!**, JCDecaux’s docked bike network, has 360 stations (30 October 2026) and runs until September 2028, before a new station-based e-bike network. It works by subscription; prices are on [villo.be](https://www.villo.be).',
        'One last scooter ride before 1 January? Find the nearest Bolt or Dott on the [map of Brussels](map:be:Bruxelles).',
      ],
    },
    {
      heading: 'Did you know? Brussels e-scooter facts',
      blocks: [
        {
          list: [
            'Brussels got its first shared e-scooters in 2018: Troty at the end of June, then Bird in September, at €1 plus €0.15 a minute, half what Bolt charges per minute today.',
            'On 1 February 2024 Brussels went from seven operators to two, and from about 20,000 shared scooters to 8,000.',
            'When Lime’s licence ran out on 2 July 2025, its scooters and bikes left the streets; 3,500 of its scooters returned on 8 July on another operator’s licence, until 29 August. A year later, Lime’s appeal brought down Bolt’s and Dott’s licences too.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Are shared e-scooters banned in Brussels?',
      answer: 'Not yet: Bolt and Dott rent them until 31 December 2026. The Brussels government has decided they go from 1 January 2027; shared e-bikes and Villo! stay.',
    },
    {
      question: 'Can I still ride my own e-scooter in Brussels after 2027?',
      answer: 'Yes: only shared scooters go. From 1 June 2027, though, no e-scooter, yours included, may go faster than 20 km/h in the Brussels Region.',
    },
    {
      question: 'Do I need a helmet on a shared e-scooter in Brussels?',
      answer: 'No. Since 1 September 2026 a helmet is compulsory only on e-scooters that can go faster than 20 km/h, and shared ones in Brussels are capped at 20 km/h. If your own scooter does 25 km/h, wear one: riding without it costs €64.',
    },
    {
      question: 'Can tourists rent an e-scooter in Brussels?',
      answer: 'Yes, from 18, in the Bolt or Dott app. You scan an ID document before the first ride: Dott accepts a passport, Bolt a driving licence or another official ID.',
    },
    {
      question: 'Which is cheaper in Brussels, Bolt or Dott?',
      answer: 'Bolt, on the rates published on 30 October 2026: a 15-minute scooter ride costs about €5.64, against €6.55 with Dott. Bolt’s e-bike is cheaper still, with no unlock fee and €0.25 a minute. The app shows the final price.',
    },
    {
      question: 'Can I take a shared e-scooter to Brussels Airport?',
      answer: 'No. The airport is in Zaventem, outside the Brussels-Capital Region, where Bolt’s and Dott’s areas stop.',
    },
  ],
  sources: [
    { title: 'VRT NWS: Brussels bans shared e-scooters from 2027 (11 June 2026, Dutch)', url: 'https://www.vrt.be/vrtnws/nl/2026/06/11/brussel-verbiedt-deelsteps-vanaf-2027/' },
    { title: 'BRUZZ: Brussels’ transitional arrangement for shared bikes and scooters (21 August 2026, Dutch)', url: 'https://www.bruzz.be/actua/mobiliteit/deelfietsen-blijven-beschikbaar-na-1-september-brussel-heeft-overgangsregeling-klaar-2026-08-21' },
    { title: 'democratie.brussels: petition to keep shared e-scooters in Brussels (French)', url: 'https://democratie.brussels/initiatives/i-271?locale=fr' },
    { title: 'BRUZZ: shared scooters barred from the city centre again ahead of a pupils’ protest (22 October 2026, Dutch)', url: 'https://www.bruzz.be/actua/mobiliteit/opnieuw-stepverbod-stadscentrum-vanwege-aangekondigd-scholierenprotest-2026-10-22' },
    { title: 'La DH: no date yet for the ban on bikes and scooters in the piétonnier (16 October 2026, French)', url: 'https://www.dhnet.be/regions/bruxelles/bruxelles-mobilite/2026/10/16/a-quand-linterdiction-des-velos-sur-le-pietonnier-de-bruxelles-la-mesure-annoncee-pour-janvier-dernier-peine-a-se-concretiser-STP4637UTZH6TOTYP2RYNI7V5Y/' },
    { title: 'La Libre: Bolt is already preparing for life after scooters in Brussels (6 October 2026, French)', url: 'https://www.lalibre.be/economie/entreprises-startup/2026/10/06/bolt-prepare-deja-lapres-trottinette-a-bruxelles-F2OGCLOIUBHITDRHIAMV5W5A6U/' },
    { title: 'Brussels government decree of 13 July 2023 on shared vehicles (wegcode.be, Dutch)', url: 'https://www.wegcode.be/nl/regelgeving/2023043869~u3gajpiwqf' },
    { title: 'City of Brussels open data: drop zones for free-floating shared vehicles (French)', url: 'https://opendata.bruxelles.be/explore/assets/dropzones-vbx/' },
    { title: 'BX1: ID checks compulsory for shared e-scooters in Brussels (3 December 2025, French)', url: 'https://bx1.be/categories/news/verification-didentite-obligatoire-pour-les-trottinettes-partagees-a-bruxelles-des-aujourdhui/' },
    { title: 'VRT NWS: shared-scooter users in Brussels must now scan their ID, against drug dealing (3 December 2025, French)', url: 'https://www.vrt.be/vrtnws/fr/2025/12/03/lutte-contre-le-narcotrafic-les-utilisateurs-de-trottinettes-p/' },
    { title: 'BRUZZ: Lime’s scooters stay in Brussels on a taken-over licence (8 July 2025, Dutch)', url: 'https://www.bruzz.be/actua/mobiliteit/lime-vecht-terug-steps-blijven-brussel-met-overgenomen-licentie-2025-07-08' },
    { title: 'BRUZZ: Lime’s shared scooters unavailable in Brussels for now (30 August 2025, Dutch)', url: 'https://www.bruzz.be/actua/mobiliteit/deelsteps-lime-voorlopig-onbeschikbaar-brussel-2025-08-30' },
    { title: 'Dott Help: why do I need to verify my ID? (documents accepted in Brussels)', url: 'https://help.ridedott.com/en/articles/187' },
    { title: 'Bolt: terms for e-vehicles in Belgium, in force from 1 December 2026 (French)', url: 'https://bolt.eu/fr-be/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Dott: terms and conditions for Belgium, 23 September 2025 (French)', url: 'https://ridedott.com/fr/conditions-generales/belgique/' },
    { title: 'The Brussels Times: helmet requirement for e-scooters in Belgium takes effect (1 September 2026)', url: 'https://www.brusselstimes.com/belgium/2296512/helmet-requirement-for-e-scooters-in-belgium-takes-effect' },
    { title: 'wegcode.be: traffic offences by degree, 2026 fines (Dutch)', url: 'https://www.wegcode.be/nl/verkeersovertredingen/overtredingen-per-graad' },
    { title: 'wegcode.be: what the new road code changes for e-scooter riders from 1 June 2027 (Dutch)', url: 'https://www.wegcode.be/nl/code-van-de-openbare-weg/wat-verandert-er-voor-jou/wat-verandert-er-voor-steppers' },
    { title: 'Villo! (JCDecaux): station list, open data', url: 'https://api.cyclocity.fr/contracts/bruxelles/gbfs/v2/station_information.json' },
  ],
};

export default guide;
