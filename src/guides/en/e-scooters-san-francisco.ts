import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-san-francisco',
  topic: 'san-francisco',
  name: 'E-scooters in San Francisco',
  title: 'San Francisco scooter apps 2026: Lime, Spin, costs and rules',
  description: 'Lime and Spin are San Francisco’s scooter apps. Lime lists $1 to unlock, $0.55 a minute; Spin’s price is in its app. The 18+, helmet and sidewalk rules, BART.',
  headline: 'E-scooters in San Francisco: Lime and Spin, what a ride costs, the rules, and where you can’t ride',
  lede: 'E-scooters in San Francisco come from two companies, Lime and Spin, the only ones with SFMTA permits, which run to 30 June 2027. Lime’s SFMTA permit application gives $1 to unlock and $0.55 a minute; Spin shows its price only in the app. Lime and Spin require you to be 18, state law asks for a driving licence, scooters top out at 15 mph, sidewalks are off-limits, and you lock the scooter to a bike rack where there is one. You can’t ride on the Embarcadero Promenade or across the Golden Gate Bridge, shared scooters can’t board Muni or BART, and there are none at SFO.',
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
            '**The permits.** After a board vote on 5 May 2026, SFMTA extended both by a year, to 30 June 2027, though its programme page still said 30 June 2026 on 17 October. The board lets SFMTA extend them again, up to 30 June 2028, without a new application.',
            '**The fleets.** Up to 3,250 scooters each, and Lime’s may include up to 500 seated LimeGliders. For Dreamforce, Fleet Week and other autumn events, SFMTA lets each company run up to 3,750 until 26 November 2026.',
            '**The area.** Each company serves an area SFMTA approves, with no more than 40% of its fleet downtown and scooters spread across the Richmond, the Sunset, the Mission, the southeast and other neighbourhoods.',
            '**Which app for Spin?** Spin has belonged to Bird since 2023 but keeps its own brand, and its website sends you to the Spin app. Its open data, which names Bird as operator, links to the Bird app instead, but neither company’s website says the Bird app rents Spin’s scooters.',
          ],
        },
        'On the evening of 16 October 2026 the [map of San Francisco](map:us:ca:San Francisco) showed about 3,050 Spin and 3,000 Lime scooters: what’s on the map, not the fleets. SFMTA counted 2,618 Lime and 2,120 Spin scooters out on an average day in 2025.',
        '**Visiting?** Get the app before you go; Lime and Spin both take a debit or credit card. State law asks for “a valid driver’s license or instruction permit”. Carry yours. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in San Francisco?',
      blocks: [
        'Lime’s published price is the one in its May 2024 permit application, which its SFMTA permit takes in; the app shows today’s, with any fees. Spin publishes none, so check its app, and neither company puts prices in its open data.',
        {
          table: {
            caption: 'Lime’s prices in its SFMTA permit application, May 2024',
            head: ['Option', 'What you pay'],
            rows: [
              ['Standard ride', '$1 to unlock, then $0.55 a minute'],
              ['10-minute ride', '$6.50'],
              ['20-minute ride', '$12.00'],
              ['LimePrime and passes', '$5.99 a month for free unlocks; 30 minutes for $7.99, 60 minutes for $14.99'],
              ['Lime Access', '50% off for eligible riders on low incomes'],
            ],
          },
        },
        '**Riders on low incomes.** SFMTA makes both companies offer a plan with no deposit and at least 50% off, or unlimited rides under 30 minutes, to people earning up to twice the federal poverty level. CalFresh, PG&E CARE or Muni Lifeline eligibility can show you qualify. Both must also offer a way to pay in cash.',
      ],
    },
    {
      heading: 'San Francisco scooter rules: age, licence, helmets, speed and sidewalks',
      blocks: [
        'Most rules come from the California Vehicle Code (CVC), which gives a scooter rider a driver’s duties; San Francisco’s Transportation Code and SFMTA’s permits set what Lime and Spin must do, and their terms add the rest.',
        {
          table: {
            caption: 'Shared e-scooter rules in San Francisco on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to ride Lime or Spin', 'Lime’s and Spin’s terms'],
              ['Licence', 'A valid driving licence or instruction permit', 'CVC § 21235'],
              ['Helmet', 'Required under 18; recommended for adults', 'CVC § 21235'],
              ['Speed', '15 mph at most, even where the posted limit is higher', 'CVC § 22411; SFMTA permit'],
              ['Which streets', 'Not on streets posted above 25 mph unless you ride in a bike lane or protected bike lane', 'CVC § 21235'],
              ['Bike lanes', 'Ride in the bike lane where there is one, otherwise close to the right curb', 'CVC §§ 21228 and 21229'],
              ['Left turns', 'On a two-way street, get off and walk the scooter across the crosswalk', 'CVC § 21228'],
              ['Sidewalks', 'Banned, except to enter or leave an adjacent property; shared scooters detect it and warn you', 'CVC § 21235; SF Transportation Code § 916'],
              ['Passengers', 'One rider only', 'CVC § 21235'],
              ['Hands and ears', 'Keep at least one hand on the handlebars; no earphones in both ears', 'CVC §§ 21235 and 27400'],
              ['Phone', 'Don’t use one while riding', 'Lime’s and Spin’s terms'],
              ['Alcohol', 'Riding under the influence of alcohol or drugs is illegal', 'CVC § 21221.5'],
            ],
          },
        },
        { note: '**Ride on a sidewalk and the scooter tells you.** Since 1 September 2023 the Transportation Code has made every shared scooter in San Francisco detect sidewalk riding and play a message such as “No Sidewalk Riding”. In October 2025 the Board of Supervisors urged SFMTA and the police to treat it as a moving violation.' },
        'SFMTA can fine the companies up to $500 per offence, and their permits make them deter sidewalk riding with warnings, fines or account suspensions.',
      ],
    },
    {
      heading: 'Where you can’t ride or park: the Embarcadero, the Golden Gate Bridge and the parks',
      blocks: [
        'SFMTA sets some zones, and the companies add their own in the apps. On 17 October 2026:',
        {
          list: [
            '**The Embarcadero Promenade.** SFMTA bans riding on the waterfront promenade from Third Street at Oracle Park to the entrance of Pier 45 at Fisherman’s Wharf. Ride in the street or the bike lane.',
            '**Parking on the Embarcadero.** Since 1 October 2025 SFMTA lets you end a ride on Port land between Taylor and Howard Streets only at the bike racks by Piers 43, 41, 31, 27 and 9, the Pier ½ corral north of the Ferry Building and the corral by Ferry Plaza. Pier 40 and Bayfront Park are no-parking too.',
            '**Fisherman’s Wharf.** SFMTA bans parking on Port land north of Jefferson Street and west of Taylor Street, around Pier 45, Al Scoma Way and the Hyde Street Pier.',
            '**Chinatown** is an SFMTA no-parking zone, roughly between Broadway, Kearny Street, California Street and Powell Street.',
            '**The Golden Gate Bridge.** The bridge district doesn’t allow e-scooters on the bridge sidewalks, though e-bikes may cross, and Spin’s app makes the bridge a no-ride zone.',
            '**Spin’s app zones.** No riding at Fort Mason, Japantown’s Peace Plaza or Stonestown Galleria. You may ride through but not park in the Presidio and Crissy Field, in Golden Gate Park and the Panhandle, on the Embarcadero from the Ferry Building to Pier 39, in Chinatown and at Coit Tower.',
            '**Yerba Buena Gardens.** The Park Code bans riding bicycles and e-scooters in the Gardens, as the Board of Supervisors confirmed in 2024.',
          ],
        },
        'Lime publishes no zones, so check its app map too.',
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
        '**Caltrain** takes your own scooter, folded under the seat or, if it doesn’t fold, in the bike car. Its rules say nothing about shared scooters.',
        '**SFO.** There are no shared scooters at the airport: on 17 October neither Lime’s nor Spin’s open data showed one within 6 miles of the terminals. Take BART from the International Terminal: about 29 minutes to Powell Street for Union Square, 28 to Civic Center and 33 to Embarcadero, then pick up a scooter.',
      ],
    },
    {
      heading: 'Hills, fog, night rides and Oakland',
      blocks: [
        {
          list: [
            '**Hills.** Lime’s terms say weather and road conditions can drain a battery, and make checking the charge your job: do it before a long climb.',
            '**Fog and wet streets.** Spin’s terms say not to ride when weather or the road surface makes it unsafe.',
            '**Night.** The permits set no curfew. After dark state law requires a white front light and reflectors, which SFMTA makes the companies fit.',
            '**Oakland.** Across the bay, the [Oakland map](map:us:ca:Oakland) showed about 310 Lime scooters on the evening of 16 October.',
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
      answer: 'Only if you’re under 18, under California law. Lime and Spin riders must be 18, so for them a helmet is recommended, not required.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in San Francisco?',
      answer: 'No. State law allows it only to enter or leave an adjacent property, and every shared scooter in the city must detect sidewalk riding and warn you.',
    },
    {
      question: 'How much does a Lime scooter cost in San Francisco?',
      answer: '$1 to unlock and $0.55 a minute, the price Lime gave SFMTA in its 2024 permit application; the app shows today’s, with any fees. LimePrime, at $5.99 a month, makes unlocking free.',
    },
    {
      question: 'Can you ride a scooter across the Golden Gate Bridge?',
      answer: 'No. The bridge district doesn’t allow e-scooters on the bridge sidewalks, and Spin’s app makes the bridge a no-ride zone. E-bikes may cross.',
    },
    {
      question: 'Can you take a Lime or Spin scooter on BART or Muni?',
      answer: 'No. BART bans shared scooters from its stations and trains, and SFMTA from Muni vehicles and platforms. A folding scooter of your own may come aboard folded.',
    },
    {
      question: 'Are there scooters at SFO?',
      answer: 'No. Neither Lime’s nor Spin’s open data shows scooters near the airport. BART from the International Terminal reaches Powell Street in about 29 minutes.',
    },
  ],
  sources: [
    { title: 'SFMTA: Powered Scooter Share Permit Program', url: 'https://www.sfmta.com/projects/powered-scooter-share-permit-program' },
    { title: 'SFMTA: Lime’s permit to 30 June 2027, with the parking rules (PDF)', url: 'https://www.sfmta.com/media/45283/download' },
    { title: 'SFMTA: temporary fleet expansion to 26 November 2026, 27 August 2026 (PDF)', url: 'https://www.sfmta.com/media/45745/download' },
    { title: 'SFMTA: no-parking zones on the waterfront and in Chinatown, September 2025 (PDF)', url: 'https://www.sfmta.com/media/43308/download' },
    { title: 'SFMTA Board: scooter share permit extension, 5 May 2026 (PDF)', url: 'https://www.sfmta.com/media/44948/download' },
    { title: 'SFMTA Board: sidewalk riding detection, Resolution 230418-034, 18 April 2023 (PDF)', url: 'https://www.sfmta.com/media/35095/download' },
    { title: 'SFMTA: Lime’s permit application, 1 May 2024 (PDF)', url: 'https://www.sfmta.com/media/39705/download' },
    { title: 'Board of Supervisors Ordinance 228-24: Yerba Buena Gardens (PDF)', url: 'https://sfbos.archive.sf.gov/sites/default/files/o0228-24.pdf' },
    { title: 'Board of Supervisors Resolution 540-25: sidewalk riding (PDF)', url: 'https://sfbos.archive.sf.gov/sites/default/files/r0540-25.pdf' },
    { title: 'UCLA Transportation: California e-scooter laws', url: 'https://transportation.ucla.edu/micromobility/safety' },
    { title: 'Spin: terms of use', url: 'https://www.spin.app/policies/terms-us' },
    { title: 'Spin: Spin joins Bird, September 2023', url: 'https://www.spin.app/blog-posts/spin-joins-bird-will-continue-to-operate-as-independent-subsidiary-under-spin-brand' },
    { title: 'Spin: San Francisco open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/san_francisco/gbfs' },
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
