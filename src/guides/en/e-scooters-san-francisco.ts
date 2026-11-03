import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-san-francisco',
  topic: 'san-francisco',
  name: 'E-scooters in San Francisco',
  title: 'San Francisco scooter apps 2026: Lime, Spin, parking, rules',
  description: 'Lime and Spin are San Francisco’s scooter apps: their SFMTA permits, the licence, helmet and sidewalk rules, where to lock up, and BART and Muni.',
  headline: 'E-scooters in San Francisco: Lime and Spin, the rules, where to park, and where you can’t ride',
  lede: 'E-scooters in San Francisco come from two companies, Lime and Spin, the only ones with SFMTA permits, which run to 30 June 2027. Each app shows its price before you unlock. State law asks for a driving licence, scooters top out at 15 mph, sidewalks are off-limits, and you lock the scooter to a bike rack where there is one. You can’t ride on the Embarcadero Promenade or across the Golden Gate Bridge, and shared scooters can’t board Muni or BART.',
  published: '2026-10-17',
  updated: '2026-10-23',
  city: 'us:ca:San Francisco',
  sections: [
    {
      heading: 'Which scooter apps work in San Francisco?',
      blocks: [
        'Two companies run shared scooters in San Francisco in October 2026: **Lime** and **Spin**. Both work under the Powered Scooter Share Program of the San Francisco Municipal Transportation Agency (SFMTA), both have held a permit since 2019, and SFMTA names no other.',
        {
          list: [
            '**The permits.** After a board vote on 5 May 2026, SFMTA extended both by a year, to 30 June 2027. The board lets SFMTA extend them again, up to 30 June 2028, without a new application.',
            '**The fleets.** Up to 3,250 scooters each, and Lime’s may include up to 500 seated LimeGliders. For Dreamforce, Fleet Week and other autumn events, SFMTA lets each company run up to 3,750 until 26 November 2026.',
            '**The area.** Each company serves an area SFMTA approves, with no more than 40% of its fleet downtown and scooters spread across the Richmond, the Sunset, the Mission, the southeast and other neighbourhoods.',
          ],
        },
        'On the evening of 16 October 2026 about 3,050 Spin scooters were free to rent at that moment, and about 3,000 Lime as last counted; the [map of San Francisco](map:us:ca:San Francisco) shows where they stand. SFMTA counted 2,618 Lime and 2,120 Spin scooters out on an average day in 2025.',
        '**Riders on low incomes.** SFMTA makes both companies offer a plan with no deposit and at least 50% off, or unlimited rides under 30 minutes, to people earning up to twice the federal poverty level. CalFresh, PG&E CARE or Muni Lifeline eligibility can show you qualify. Both must also offer a way to pay in cash.',
        '**Visiting?** Get the app before you go. State law asks for “a valid driver’s license or instruction permit”. Carry yours. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'San Francisco scooter rules: age, licence, helmets, speed and sidewalks',
      blocks: [
        'Most rules come from the California Vehicle Code (CVC), which gives a scooter rider a driver’s duties; San Francisco’s Transportation Code and SFMTA’s permits set what Lime and Spin must do.',
        {
          table: {
            caption: 'Shared e-scooter rules in San Francisco on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'Each company sets its own minimum, and the app shows it before you unlock', 'Lime and Spin'],
              ['Licence', 'A valid driving licence or instruction permit', 'CVC § 21235'],
              ['Helmet', 'Required under 18; recommended for adults', 'CVC § 21235'],
              ['Speed', '15 mph at most, even where the posted limit is higher', 'CVC § 22411; SFMTA permit'],
              ['Which streets', 'Not on streets posted above 25 mph unless you ride in a bike lane or protected bike lane', 'CVC § 21235'],
              ['Bike lanes', 'Ride in the bike lane where there is one, otherwise close to the right curb', 'CVC §§ 21228 and 21229'],
              ['Left turns', 'On a two-way street, get off and walk the scooter across the crosswalk', 'CVC § 21228'],
              ['Sidewalks', 'Banned, except to enter or leave an adjacent property; shared scooters detect it and warn you', 'CVC § 21235; SF Transportation Code § 916'],
              ['Passengers', 'One rider only', 'CVC § 21235'],
              ['Hands and ears', 'Keep at least one hand on the handlebars; no earphones in both ears', 'CVC §§ 21235 and 27400'],
              ['Alcohol', 'Riding under the influence of alcohol or drugs is illegal', 'CVC § 21221.5'],
            ],
          },
        },
        { note: '**Ride on a sidewalk and the scooter tells you.** Since 1 September 2023 the Transportation Code has made every shared scooter in San Francisco detect sidewalk riding and play a message such as “No Sidewalk Riding”.' },
        'SFMTA can fine the companies up to $500 per offence, and their permits make them deter sidewalk riding with warnings, fines or account suspensions.',
      ],
    },
    {
      heading: 'Where you can’t ride or park: the Embarcadero, the Golden Gate Bridge and the parks',
      blocks: [
        'SFMTA sets some zones, and the companies add their own in the apps:',
        {
          list: [
            '**The Embarcadero Promenade.** SFMTA bans riding on the waterfront promenade from Third Street at Oracle Park to the entrance of Pier 45 at Fisherman’s Wharf. Ride in the street or the bike lane.',
            '**Parking on the Embarcadero.** Since 1 October 2025 SFMTA lets you end a ride on Port land between Taylor and Howard Streets only at the bike racks by Piers 43, 41, 31, 27 and 9, the Pier ½ corral north of the Ferry Building and the corral by Ferry Plaza. Pier 40 and Bayfront Park are no-parking too.',
            '**Fisherman’s Wharf.** SFMTA bans parking on Port land north of Jefferson Street and west of Taylor Street, around Pier 45, Al Scoma Way and the Hyde Street Pier.',
            '**Chinatown** is an SFMTA no-parking zone, roughly between Broadway, Kearny Street, California Street and Powell Street.',
            '**The Golden Gate Bridge.** The bridge district doesn’t allow e-scooters on the bridge sidewalks, though e-bikes may cross.',
          ],
        },
        '**Market Street is open.** SFMTA’s car-free rules have kept private cars off downtown Market Street since January 2020, but they let scooters through.',
      ],
    },
    {
      heading: 'Parking a scooter in San Francisco',
      blocks: [
        'Every shared scooter in San Francisco has a built-in lock, and SFMTA’s parking rules say where to lock it:',
        {
          steps: [
            'Lock it to a bike rack, upright and inside the rack’s footprint.',
            'No rack nearby? Lock it to a sign pole or a parking meter pole.',
            'No pole either? Park it upright in the furniture zone, the strip by the curb with trees, poles and signs.',
          ],
        },
        '**Never park** on a sidewalk narrower than 9 feet, at corners, curb ramps or crosswalks, against building fronts, in front of doors, driveways or stairs, at bus stops, in loading or blue zones, by fire hydrants, or locked to a tree.',
        '**If you don’t.** SFMTA investigators answer 311 reports and cite the company, and the City may remove a scooter left in one spot for more than 7 days. See a scooter in the way? Report it on 311 or the SF311 app.',
      ],
    },
    {
      heading: 'BART, Muni, cable cars, Caltrain and SFO',
      blocks: [
        '**BART.** Shared scooters such as Lime and Spin may not enter BART stations or trains: park outside the paid area. A folding scooter of your own may come aboard if you keep it folded and don’t ride it.',
        '**Muni.** SFMTA’s permits bar shared scooters from Muni vehicles and platforms. Your own folding scooter may come aboard folded and kept with you, off the seats. Cable cars take no bikes at all.',
        '**Caltrain** takes your own scooter, folded under the seat or, if it doesn’t fold, in the bike car.',
        '**SFO.** Take BART from the International Terminal: about 29 minutes to Powell Street for Union Square, 28 to Civic Center and 33 to Embarcadero, then pick up a scooter.',
      ],
    },
    {
      heading: 'Night rides and Oakland',
      blocks: [
        {
          list: [
            '**Night.** After dark state law requires a white front light and reflectors, which SFMTA makes the companies fit.',
            '**Oakland.** Across the bay, about 310 Lime scooters stood in [Oakland](map:us:ca:Oakland) on the evening of 16 October 2026, as last counted.',
          ],
        },
        'The [San Francisco map](map:us:ca:San Francisco) shows the nearest Lime or Spin scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Lime riders took 1.76 million trips in San Francisco in 2025**, and Spin riders about 707,000, SFMTA’s figures show.',
            '**October 2025 was a record month**: Lime riders took more than 260,000 trips, the most SFMTA has recorded for the programme, KQED reported.',
            '**Complaints doubled in a year**: 311 reports about scooter parking and riding rose from over 5,000 in 2024 to more than 11,000 in 2025, mostly from North Beach, KQED found.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Do you need a helmet to ride a scooter in San Francisco?',
      answer: 'Only if you’re under 18, under California law; for adults a helmet is recommended, not required.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in San Francisco?',
      answer: 'No. State law allows it only to enter or leave an adjacent property, and every shared scooter in the city must detect sidewalk riding and warn you.',
    },
    {
      question: 'Can you ride a scooter across the Golden Gate Bridge?',
      answer: 'No. The bridge district doesn’t allow e-scooters on the bridge sidewalks. E-bikes may cross.',
    },
    {
      question: 'Can you take a Lime or Spin scooter on BART or Muni?',
      answer: 'No. BART bans shared scooters from its stations and trains, and SFMTA from Muni vehicles and platforms. A folding scooter of your own may come aboard folded.',
    },
  ],
  sources: [
    { title: 'SFMTA: Powered Scooter Share Permit Program', url: 'https://www.sfmta.com/projects/powered-scooter-share-permit-program' },
    { title: 'SFMTA: Lime’s permit to 30 June 2027, with the parking rules (PDF)', url: 'https://www.sfmta.com/media/45283/download' },
    { title: 'SFMTA: temporary fleet expansion to 26 November 2026, 27 August 2026 (PDF)', url: 'https://www.sfmta.com/media/45745/download' },
    { title: 'SFMTA: no-parking zones on the waterfront and in Chinatown, September 2025 (PDF)', url: 'https://www.sfmta.com/media/43308/download' },
    { title: 'SFMTA Board: scooter share permit extension, 5 May 2026 (PDF)', url: 'https://www.sfmta.com/media/44948/download' },
    { title: 'SFMTA Board: sidewalk riding detection, Resolution 230418-034, 18 April 2023 (PDF)', url: 'https://www.sfmta.com/media/35095/download' },
    { title: 'UCLA Transportation: California e-scooter laws', url: 'https://transportation.ucla.edu/micromobility/safety' },
    { title: 'Golden Gate Bridge: bikes and pedestrians', url: 'https://www.goldengate.org/bridge/visiting-the-bridge/bikes-pedestrians/' },
    { title: 'SFMTA: car-free Market Street, 22 March 2021', url: 'https://www.sfmta.com/blog/creating-better-market-street-car-free-enforcement-resume' },
    { title: 'BART: bikes and scooters on BART', url: 'https://www.bart.gov/guide/bikes' },
    { title: 'SFMTA: bikes and scooters on Muni', url: 'https://www.sfmta.com/getting-around/bike/bikes-muni' },
    { title: 'Caltrain: scooters', url: 'https://www.caltrain.com/rider-information/scooter' },
    { title: 'SFO: day trips from SFO by BART', url: 'https://www.flysfo.com/passengers/travel-tips/day-trips-from-sfo' },
    { title: 'KQED: SF’s e-scooter complaints more than doubled, 6 May 2026', url: 'https://www.kqed.org/news/12082380/sfs-e-scooter-complaints-more-than-doubled-the-city-moves-to-extend-lime-spin-permits-anyway' },
  ],
};

export default guide;
