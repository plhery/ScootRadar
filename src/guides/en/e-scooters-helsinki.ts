import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-helsinki',
  topic: 'helsinki',
  name: 'Renting an e-scooter in Helsinki',
  title: 'Helsinki e-scooters 2026: Voi, Dott, Ryde and the night ban',
  description: 'Rent Voi, Dott or Ryde in Helsinki: the law says 15, Dott says 18. No rides on Friday and Saturday nights 23:00–05:00; the season normally ends on 30 November.',
  headline: 'E-scooters in Helsinki: Voi, Dott and Ryde, the weekend night ban, where to park and when the season ends',
  lede: 'E-scooters in Helsinki (Helsingfors) are rented from Voi, Dott and Ryde, the three companies holding the City’s micromobility licence in 2026, and each app shows its price. Finnish law lets you ride from 15, but Dott rents only to over-18s. The scooters are switched off on Friday and Saturday nights from 23:00 to 05:00, in the inner city you may park only in a marked bay, and the season runs, in principle, until 30 November.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'fi:Helsinki',
  sections: [
    {
      heading: 'E-scooters in Helsinki: Voi, Dott and Ryde',
      blocks: [
        'Since 2026 only companies with the City’s micromobility licence may rent out e-scooters in Helsinki. Three hold one this season:',
        {
          list: [
            '**Voi**, with the most scooters on the map on 25 October 2026.',
            '**Dott**, whose Finnish terms are with TIER Mobility Finland Oy.',
            '**Ryde**. Its scooters are only in its app: our map doesn’t show them.',
          ],
        },
        'Five companies rented out scooters in Helsinki in 2025 and three in 2026. Since late July 2026 Donkey Republic has also rented out pedal bikes under the licence.',
        'Between 18:45 and 19:00 on Sunday 25 October 2026 the map showed about 4,000 scooters free to rent at that moment within Helsinki’s city limits (about 2,300 Voi and 1,700 Dott) and about 2,300 more in Espoo. Zoomed out, the [Helsinki map](map:fi:Helsinki) counts Voi’s Espoo scooters in Helsinki’s total, about 5,800 at 14:50 that day. It shows Voi’s scooters with their battery level, and Dott’s positions only; zoomed in, it draws the City of Helsinki’s e-scooter bays (CC BY 4.0).',
        'New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Helsinki?',
      blocks: [
        'Each app shows the unlock fee and the rate per minute before you start.',
        'Dott’s terms for Finland do set the extra fees it can charge:',
        {
          table: {
            caption: 'Extra fees in Dott’s terms for Finland (read 25 October 2026)',
            head: ['Fee', 'When'],
            rows: [
              ['Up to €300', 'Recovering a scooter you parked or locked against its instructions'],
              ['€50', 'Any breach of its terms, on top of any fine'],
              ['€50', 'Admin fee if Dott pays a fine for you'],
              ['Official charges', 'Fines and impounding costs for bad parking or riding are yours'],
            ],
          },
        },
        'Voi’s and Ryde’s websites refused our requests: check their fees and age limits in their apps.',
      ],
    },
    {
      heading: 'When can you ride? The night ban, the speed limits and the season',
      blocks: [
        '**The weekend night ban.** The City’s licence has every rental scooter switched off from 23:00 to 05:00 on the nights from Friday to Saturday and from Saturday to Sunday, and on the Vappu night, from 30 April to 1 May. Nobody can start a ride then.',
        '**Speed.** From Monday to Friday the licence caps rental scooters at 20 km/h from 05:00 to 23:00 and at 15 km/h from 23:00 to 05:00. In the slow zones the cap is 10 km/h every day and at every hour. The limits apply downhill too, and the scooters keep to them by GPS. The licence sets no weekend daytime limit outside the slow zones; the City’s page gives 20 km/h by day.',
        '**The season.** The 2026 season began on 17 March. The licence sets it, in principle, from 1 April to 30 November and lets the City lengthen or shorten it for the weather, with at least a week’s notice; the operators must then clear every scooter from the streets within 48 hours of the City’s notice. In winter no rental scooters are used or kept on the streets. We found no end date for 2026 on the City’s pages on 25 October.',
        'Espoo (Esbo) and Vantaa (Vanda) license their own operators: 20 km/h by day, 15 km/h on weekday nights, and no scooters on weekend nights from 00:00 to 05:00, an hour later than Helsinki. Vantaa’s licence adds the Vappu night and the same season in principle.',
      ],
    },
    {
      heading: 'Where can you ride in Helsinki? Cycle lanes, slow zones and no-go areas',
      blocks: [
        'An e-scooter rider follows the rules for cyclists: ride on the cycle path or cycle lane, and where there is none, on the road or its shoulder. **Riding on the pavement isn’t allowed**, the City says; the law lets only children under 12 cycle there. The City works with the police against pavement riding, speeding and two people on one scooter.',
        '**10 km/h zones.** The City’s map of July 2026 marks the busiest pedestrian areas:',
        {
          list: [
            '**The centre:** Railway Square (Rautatientori), Senate Square (Senaatintori), Aleksanterinkatu and Pohjoisesplanadi, the Market Square (Kauppatori) and Eteläranta, Narinkka square in Kamppi, Iso Roobertinkatu, Hakaniemi market square, Kasarmitori and Hietalahdentori.',
            '**The southern seafront** from Eiranranta to Kaivopuisto.',
            '**Local centres:** Munkkivuori shopping centre, Sitratori, the Ylä-Malmi and Ala-Malmi squares, Pihlajamäki shopping centre, Tallinnanaukio and the Itäkeskus bus terminal, Kontula shopping centre and Mosaiikkitori.',
          ],
        },
        '**No-riding zones.** Wherever cycling is banned, and in cemeteries, large nature reserves and on artificial turf pitches, the scooters won’t run. The City’s map shows the island of Seurasaari, Hietaniemi and Malmi cemeteries and the Vanhankaupunginlahti nature reserve by Viikki among them.',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Helsinki',
      blocks: [
        '**In the inner city, only in a marked bay.** The rule covers the centre, Taka-Töölö, Pasila, Kallio and Kalasatama, almost the whole inner city, and since July–August 2026 the centres of Puotila, Tapanila and Vuosaari. Bays are also compulsory near metro and train stations and at places such as schools, day-care centres, playgrounds, health stations, tram stops, bridges and underpasses. Bays are painted on the ground and shown in the apps.',
        '**Elsewhere,** leave the scooter upright on its stand at the edge of the pavement or path, parallel to it, with at least 1.8 metres free on a pavement and 2.5 metres on other paths. Never on a pedestrian crossing or at a junction, at a bus or tram stop, in front of stairs, ramps, lifts or doors, or where it gets in the way of a city bike station.',
        '**The photo.** The app makes you photograph the parked scooter before it ends the ride, and in the bay-only areas it won’t end the ride outside a bay. The operators check the photos and sanction riders who parked badly.',
        '**Removal.** The City’s parking inspectors move badly parked scooters: €80 to move one nearby, or €100 to take it to storage plus €15 for every seven days started there (fees since 1 January 2026). The City charges the operator, which owns the scooter; rental scooters and bikes had been moved about 3,000 times by the end of August 2026. What reaches you is up to the operator: Dott’s terms leave official charges to you and allow a recovery fee of up to €300.',
      ],
    },
    {
      heading: 'Finland’s e-scooter rules in 2026',
      blocks: [
        'A rental e-scooter, built for at most 25 km/h, counts as a light electric vehicle (kevyt sähköajoneuvo), and the Road Traffic Act (Tieliikennelaki 729/2018) sets its rules. Act 304/2025, in force since 17 June 2025, added a minimum age and a drink limit.',
        {
          table: {
            caption: 'E-scooter rules in Helsinki on 25 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Who sets it'],
            rows: [
              ['Minimum age', '15; handing a scooter to someone younger can cost €60', 'Road Traffic Act §§ 17 and 164 a'],
              ['Operator’s age', 'Dott 18; Ryde and Voi in their apps', 'Each operator’s terms'],
              ['Where to ride', 'Cycle path or lane, else the road; not the pavement', 'Road Traffic Act §§ 18 and 52; City of Helsinki'],
              ['Alcohol and drugs', '0.5‰ in the blood or 0.22 mg/l in the breath is too much; no narcotics; €200 fee', 'Road Traffic Act §§ 17 a and 164'],
              ['Passengers', 'One rider only', 'Road Traffic Act § 147'],
              ['Helmet', 'You should generally wear one; there’s no fee', 'Road Traffic Act § 92'],
              ['Lights', 'White at the front, red at the back in the dark', 'The law, as the Road Safety Council (Liikenneturva) explains it'],
              ['Speed', '20 km/h by day and 15 km/h at night, Monday to Friday; 10 km/h in slow zones at all times', 'City licence'],
              ['Night ban', 'Friday and Saturday nights and the Vappu night, 23:00–05:00', 'City licence'],
              ['Season', 'In principle 1 April to 30 November', 'City licence'],
              ['Parking', 'Bays in the inner city, near stations and in three suburbs; elsewhere at the edge', 'City licence'],
            ],
          },
        },
        { note: '**The drink limit is 0.5‰:** at 0.5‰ or more in the blood, or 0.22 mg/l in the breath, you can be fined €200. Narcotics in the blood are banned too, unless they come from a medicine you may lawfully take.' },
      ],
    },
    {
      heading: 'Espoo, Vantaa, the airport and Suomenlinna',
      blocks: [
        '**Espoo (Esbo).** Since 1 January 2026 renting out scooters there has needed a city licence; the city names Dott, Ryde and Voi. It has its own 10 km/h, parking and no-use zones on its map service, and counted more than 2 million scooter trips in 2025. About 1,700 Voi scooters stood in Espoo on the evening of 25 October, the biggest clusters around Otaniemi and Matinkylä: the [map around Espoo](map:fi:Espoo) shows them beside Dott’s.',
        '**Vantaa (Vanda).** About 540 scooters stood there that evening, nearly all Dott ([Vantaa map](map:fi:Vantaa)). Its licence has slow zones, bay-only zones and no-parking zones, shown in the apps.',
        '**Helsinki Airport** is in Vantaa. On the evening of 25 October the map showed no scooter within a kilometre of the terminal and 18 Dott within two, so don’t count on one.',
        '**Suomenlinna**, the sea fortress a short ferry ride from the Market Square, had no scooters on the map that evening.',
        '**Your own scooter on a train.** On VR’s trains, “small or foldable scooters can be taken on trains free of charge as hand luggage”; a large one that won’t fold needs a paid, booked bike space, and you mustn’t attach it to the train or charge it on board. We couldn’t check HSL’s rules for its buses, trams, metro, local trains and the Suomenlinna ferry: its website refused our request.',
      ],
    },
    {
      heading: 'City bikes in Helsinki and Espoo',
      blocks: [
        'Helsinki and Espoo share one docked city bike scheme, with sign-up on HSL’s website; its season runs from the beginning of April to the end of October, the City of Espoo says. Our map shows standing e-scooters only, not city bikes or Donkey Republic’s bikes.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Helsinki’s riders took 3.3 million rental scooter rides in spring and summer 2026**, down from 3.8 million the year before, the City reported on 2 October 2026.',
            '**The inner city may hold at most 4,700 rental e-scooters**, split equally between the licence holders.',
            '**Helsinki’s night ban covers only weekends.** [Oslo’s](guide:oslo) stops new rentals every night from 23:00 to 05:00.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooters can you rent in Helsinki?',
      answer: 'Voi, Dott and Ryde, the three companies with the City’s 2026 licence. [Our map](map:fi:Helsinki) shows Voi and Dott; Ryde’s scooters are only in its app.',
    },
    {
      question: 'How much does an e-scooter cost in Helsinki?',
      answer: 'The app shows it: check the unlock fee and the rate per minute before you start.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Finland?',
      answer: '15, by law since 17 June 2025. Dott rents only to riders of 18 and over; Ryde and Voi show their limits in their apps.',
    },
    {
      question: 'Can you ride an e-scooter at night in Helsinki?',
      answer: 'Not on Friday and Saturday nights, nor on the Vappu night: the scooters are switched off from 23:00 to 05:00. On weekday nights you can ride at up to 15 km/h.',
    },
    {
      question: 'Are there e-scooters in Helsinki in winter?',
      answer: 'No. The licence season runs, in principle, from 1 April to 30 November, and the City can move its end for the weather. In winter no rental scooters are on the streets.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Helsinki?',
      answer: 'No. Ride on the cycle path or lane, and where there is none, on the road.',
    },
  ],
  sources: [
    { title: 'City of Helsinki: electric scooters (modified 21 October 2026)', url: 'https://www.hel.fi/en/urban-environment-and-traffic/cycling/electric-scooters' },
    { title: 'City of Helsinki: sähköpotkulaudat, with the zone maps (Finnish)', url: 'https://www.hel.fi/fi/kaupunkiymparisto-ja-liikenne/pyoraily/sahkopotkulaudat' },
    { title: 'Helsinki Region Infoshare: Parking places in Helsinki, with the e-scooter bays (CC BY 4.0)', url: 'https://hri.fi/data/en_GB/dataset/helsingin-kantakaupungin-ja-asukaspysakointivyohykkeiden-pysakointipaikat' },
    { title: 'City of Helsinki: 2026 micromobility licence terms, 2 December 2025 (Finnish, PDF)', url: 'https://ahjojulkaisu.hel.fi/CF797207-A9AA-C8A6-906D-9AE871400002.pdf' },
    { title: 'City of Helsinki: removal fees, 18 December 2025 (Finnish)', url: 'https://paatokset.hel.fi/fi/asia/hel-2025-018726' },
    { title: 'City of Helsinki: scooter use fell in 2026, 2 October 2026 (Finnish)', url: 'https://www.hel.fi/fi/uutiset/sahkopotkulautojen-kaytto-vaheni-helsingissa' },
    { title: 'City of Helsinki: the season starts on 17 March (Finnish)', url: 'https://www.hel.fi/fi/uutiset/sahkopotkulautakausi-alkaa-17-maaliskuuta' },
    { title: 'Road Traffic Act 729/2018, consolidated (Finnish)', url: 'https://www.finlex.fi/fi/lainsaadanto/2018/729' },
    { title: 'Act 304/2025 amending the Road Traffic Act (Finnish)', url: 'https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2025/304' },
    { title: 'Liikenneturva: Ride right, e-scooter tips', url: 'https://www.liikenneturva.fi/en/campaigns/ride-right/' },
    { title: 'City of Espoo: sustainable forms of transport', url: 'https://www.espoo.fi/en/transport-and-streets/sustainable-forms-transport' },
    { title: 'City of Vantaa: micromobility licence terms 2026 (Finnish, PDF)', url: 'https://www.vantaa.fi/sites/default/files/document/Vantaa-mikroliikennelupa-ehdot-2026.pdf' },
    { title: 'Dott: terms and conditions for Finland', url: 'https://ridedott.com/terms-and-conditions/finland/' },
    { title: 'VR: bikes and scooters on trains', url: 'https://www.vr.fi/en/facilities-and-services/bikes-on-trains' },
  ],
};

export default guide;
