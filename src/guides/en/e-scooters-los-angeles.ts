import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-los-angeles',
  topic: 'los-angeles',
  name: 'E-scooters in Los Angeles',
  title: 'Scooter rental in Los Angeles 2026: Bird, Veo, Lime, costs',
  description: 'LA has Bird, Lime, Veo and GCOO scooters. Veo is $1 to unlock plus $0.50 a minute plus tax; the others show prices in their apps. 18+, $197 sidewalk fine.',
  headline: 'E-scooters in Los Angeles: Bird, Veo and Lime, what a ride costs, the rules, and where you can’t ride',
  lede: 'E-scooters in Los Angeles come from Bird, Veo, Lime and GCOO, under permits from LADOT, the city’s transportation department. Veo charges $1 to unlock plus $0.50 a minute plus tax (as of November 2026); the others show their prices in the app. LADOT and the operators require you to be 18, state law asks for a driving licence, scooters top out at 15 mph, and LADOT puts the sidewalk fine at $197. You can’t ride on the Venice Beach boardwalk or inside Metro stations, and Bird’s app blocks riding around the LAX terminals.',
  published: '2026-10-17',
  updated: '2026-10-26',
  city: 'us:ca:Los Angeles',
  sections: [
    {
      heading: 'Which scooter apps work in Los Angeles?',
      blocks: [
        'LADOT runs a yearly permit programme for dockless scooters and bikes, set in the Municipal Code. Its page lists four providers: Bird, Lime, GCOO and Veo. Spin, now Bird’s, has all but gone: on 3 November 2026 its LA open data listed one disabled e-bike, last reported on 7 October.',
        {
          list: [
            '**Bird**, by far the biggest, across the city, almost all with stand-up scooters.',
            '**Veo**, on the west side: Santa Monica and, next door in LA, Venice, Mar Vista and West LA. That fleet is mostly seated Cosmo e-bikes, with about 650 stand-up scooters in its open data on 3 November 2026.',
            '**Lime**, which added e-bikes in April 2025 and announced seated LimeGliders that October. On the night of 25 to 26 October 2026, our map showed about 10,000 of its scooters free to rent at that moment, from the Valley to Venice and Downtown.',
            '**GCOO**: at 4 pm on Saturday 24 October 2026, about 1,700 of its scooters were free to rent at that moment, most of them Downtown, in Hollywood, in Koreatown and around USC.',
          ],
        },
        'On the evening of 16 October 2026 the [map of Los Angeles](map:us:ca:Los Angeles) showed about 7,400 Bird and 600 Veo scooters free to rent at that moment, neighbouring cities such as Santa Monica and Culver City included.',
        'Each operator may deploy 500 to 6,000 vehicles under a permit of up to a year, which costs it $20,000 plus a fee per trip.',
        '**Visiting?** Get the app before you go: you need a smartphone with data to unlock and end a ride. State law asks for “a valid driver’s license or instruction permit”. LADOT’s page asks for “a valid California driver’s license”, but its permit rules just say “Driver’s License”. Carry yours. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Los Angeles?',
      blocks: [
        'Veo publishes its LA rate in its open data, the same for its scooters and Cosmo e-bikes. Bird, Lime and GCOO show their prices in their apps.',
        {
          table: {
            caption: 'Published rates in Los Angeles as of November 2026, with Metro Bike for comparison',
            head: ['Ride', 'Veo scooter or Cosmo', 'Metro Bike classic, single ride'],
            rows: [
              ['Unlock', '$1', 'None'],
              ['Rate', '$0.50 a minute plus tax', '$1.75 per 30 minutes'],
              ['10 minutes', '$6.00 plus tax', '$1.75'],
              ['20 minutes', '$11.00 plus tax', '$1.75'],
              ['40 minutes', '$21.00 plus tax', '$3.50'],
            ],
          },
        },
        '**Metro Bike**, the county’s bike share, has classic and electric bikes round the clock; an electric one costs $1 to unlock on a single ride. A 30-day pass costs $17 and a year $150, each with rides of up to 30 minutes free ([prices](https://bikeshare.metro.net/) as of November 2026).',
        '**Low-income riders.** LADOT makes every operator offer unlimited trips under 30 minutes, with no deposit and a cash option, to riders with incomes at or below 200% of the federal poverty line, and a way to ride without a smartphone.',
      ],
    },
    {
      heading: 'Los Angeles scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Most rules come from the California Vehicle Code (CVC), which gives a scooter rider a driver’s duties; LADOT adds its permit rules.',
        {
          table: {
            caption: 'Shared e-scooter rules in Los Angeles on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to ride a shared scooter', 'LADOT permit rules; Bird’s terms'],
              ['Licence', 'A valid driving licence or instruction permit', 'CVC § 21235; LADOT'],
              ['Helmet', 'Required under 18; recommended for adults', 'CVC § 21235; LADOT'],
              ['Speed', '15 mph at most, even where the posted limit is higher', 'CVC § 22411; LADOT'],
              ['Which streets', 'Not on streets posted above 25 mph unless you ride in a bike lane or protected bike lane', 'CVC § 21235'],
              ['Bike lanes', 'Ride in the bike lane where there is one, otherwise close to the right curb', 'CVC §§ 21228 and 21229'],
              ['Left turns', 'On a two-way street, get off and walk the scooter across the crosswalk', 'CVC § 21228'],
              ['Passengers', 'One rider only', 'CVC § 21235'],
              ['Hands and ears', 'Keep at least one hand on the handlebars; no earphones in both ears', 'CVC §§ 21235 and 27400'],
              ['Phone', 'Don’t use one while riding', 'Bird’s terms'],
              ['Alcohol', 'Riding under the influence of alcohol or drugs is illegal', 'CVC § 21221.5'],
            ],
          },
        },
        { note: '**No riding on sidewalks.** State law allows it only to enter or leave an adjacent property. LAPD tickets sidewalk riders, and LADOT puts the fine at $197.' },
      ],
    },
    {
      heading: 'Where you can’t ride: Venice Beach, Hollywood and the parks',
      blocks: [
        {
          list: [
            '**Venice Beach.** Ocean Front Walk is for pedestrians only, and e-scooters are “not legal to ride on the beach bike path or Ocean Front Walk”, in the words of a 2021 City Council motion; since 2022 rental shops nearby must tell their customers so. Bird’s app also marks the Venice beachfront and the Venice Canals as no-ride zones.',
            '**Hollywood Walk of Fame.** Bird’s app blocks riding on Hollywood Boulevard from La Brea Avenue to about Vine Street, and parking further east towards Gower Street. Walk the stars.',
            '**Beverly Hills and West Hollywood.** Bird’s app marks both cities as no-ride zones, so you can’t ride a Bird into either. West Hollywood runs its own scooter programme, operated by Lime; since 7 August 2026 Lime riders there must end their trips in parking areas shown in the app.',
            '**Parks.** Bird’s app marks Elysian Park as no-ride.',
            '**Campuses.** UCLA has a contract with Bird: other operators’ scooters may cross on campus roads but are impounded if parked there. Bird’s app marks USC’s University Park campus as no-ride.',
          ],
        },
        'State law lets scooters use bike paths, trails and bikeways unless they’re banned there, and Bird’s app allows the LA River path through Elysian Valley. The 25 mph rule keeps you off freeways and off big boulevards without a bike lane.',
      ],
    },
    {
      heading: 'Parking a scooter in Los Angeles',
      blocks: [
        'LADOT wants scooters upright in the furniture zone, the strip between curb and walkway with trees and poles, ideally at a bike rack, leaving 6 feet of sidewalk clear. Never park:',
        {
          list: [
            'in front of driveways, crosswalks or transit stops;',
            'near ADA ramps or fire hydrants, or along blue, yellow or red curbs;',
            'on grass, or on a sidewalk less than 3 feet wide.',
          ],
        },
        '**Downtown** has LADOT “Parking Zones”, shown in the apps. Bird’s app bars parking across most of Downtown, from Grand Park to Crypto.com Arena, and at Union Station, Little Tokyo, The Grove and Dodger Stadium.',
        'Report a badly parked scooter to MyLA311: the operator must deal with it within two hours, 7 am to 10 pm. One left unmoved for five days can be impounded.',
      ],
    },
    {
      heading: 'Metro, Union Station and LAX',
      blocks: [
        '**Metro.** Its code of conduct bans riding any wheeled device, kick scooters included, in stations and on trains and buses, so end a shared ride outside the station. A ride costs $1.75 when you tap a bank card or phone, with free transfers for two hours and caps of $5 a day and $18 over seven days.',
        '**Union Station.** The B and D lines start here. Bird’s app bars parking at the station, so end your ride a block away.',
        '**LAX.** Bird’s app blocks riding around the terminals. The LAX/Metro Transit Center at Aviation Boulevard and 96th Street, open since June 2025, lies outside that zone: it serves the C and K lines and has a bike hub, and airport shuttles run from it to the terminals. LAX’s SkyLink train has been delayed again, to January 2027, so take the shuttle.',
      ],
    },
    {
      heading: 'Crossing into Santa Monica and Culver City',
      blocks: [
        'Both cities run their own programmes, with their own rules.',
        {
          list: [
            '**Santa Monica.** On the evening of 16 October 2026 the [Santa Monica map](map:us:ca:Santa Monica) showed about 1,400 Bird and 540 Veo scooters free to rent at that moment. The City’s rules, updated in November 2025, make shared scooters shut off or slow to 1 mph on the Pier and Pier Bridge, Third Street Promenade, city parks, the beach bike path, Ocean Front Walk and the rest of the beach. End your ride in a drop zone shown in the app, and the operator must take $1 off; otherwise use the furniture zone.',
            '**Culver City.** Bird is the City’s operator, under an agreement that caps scooters at 15 mph and has them shut off or slow to 1 mph in areas the City picks. That evening the [Culver City map](map:us:ca:Culver City) showed about 1,250 Bird and 60 Veo scooters free to rent at that moment.',
          ],
        },
      ],
    },
    {
      heading: 'Heat and night rides',
      blocks: [
        {
          list: [
            '**Heat.** Metro warns that the sun is strongest from 10 am to 4 pm: carry water.',
            '**Night.** LADOT’s rules make rental scooters keep their front and back lights on.',
          ],
        },
        'The [Los Angeles map](map:us:ca:Los Angeles) shows the nearest Bird, Veo, Lime or GCOO scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**LADOT calls its pilot the largest dockless programme in the country.** Launched in March 2019, it permitted some 37,000 vehicles.',
            '**Rental shops near Ocean Front Walk must hand over their bikes and scooters at least 300 feet inland**, under a 2022 city ordinance that spares the shared operators LADOT permits.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an electric scooter on the sidewalk in Los Angeles?',
      answer: 'No. California law bans it except to enter or leave a property, and LAPD tickets riders: LADOT puts the fine at $197. Use the street or a bike lane.',
    },
    {
      question: 'Do you need a driving licence to ride a scooter in LA?',
      answer: 'Yes. State law requires a valid driving licence or instruction permit, and LADOT and the operators also require you to be 18. Carry your licence when you ride.',
    },
    {
      question: 'Can you ride a scooter on the Venice Beach boardwalk?',
      answer: 'No. Ocean Front Walk is for pedestrians only, and the City says e-scooters may not be ridden on it or on the beach bike path. Bird’s app also marks the Venice beachfront as a no-ride zone.',
    },
    {
      question: 'Do you need a helmet on a scooter in California?',
      answer: 'Only under 18, under state law. LA’s shared scooters are for adults, so LADOT recommends a helmet but doesn’t require one.',
    },
    {
      question: 'Can you ride a scooter to LAX?',
      answer: 'Not to the terminals: Bird’s app blocks riding around them. End your ride at the LAX/Metro Transit Center, on the C and K lines, and take the airport shuttle from there to your terminal.',
    },
    {
      question: 'Is Lime in Los Angeles?',
      answer: 'Yes. Lime is on LADOT’s list of providers, with scooters and e-bikes, and the [Los Angeles map](map:us:ca:Los Angeles) shows its scooters.',
    },  ],
  sources: [
    { title: 'LADOT: Micromobility', url: 'https://ladot.lacity.gov/projects/transportation-services/shared-mobility/micromobility' },
    { title: 'LADOT: On-Demand Mobility Rules and Guidelines (PDF)', url: 'https://ladot.lacity.gov/sites/default/files/2026-04/final-year-two-rules-and-guidelines-updated-sla.pdf' },
    { title: 'UCLA Transportation: California e-scooter laws', url: 'https://transportation.ucla.edu/micromobility/safety' },
    { title: 'CHP: motorcycles and similar vehicles', url: 'https://www.chp.ca.gov/programs-services/programs/california-motorcyclist-safety/motorcycles-and-similar-vehicles/' },
    { title: 'LA City Council motion on Ocean Front Walk rentals, 5 October 2021 (PDF)', url: 'https://cityclerk.lacity.org/onlinedocs/2021/21-1119_mot_10-05-21.pdf' },
    { title: 'LA Ordinance 187667: rentals at Venice Beach, 2022 (PDF)', url: 'https://cityclerk.lacity.org/onlinedocs/2021/21-1119_ord_187667_12-19-22.pdf' },
    { title: 'Bird: Los Angeles open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/los-angeles/gbfs.json' },
    { title: 'Veo: Los Angeles open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/xla/gbfs' },
    { title: 'Spin: Los Angeles open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/los_angeles/gbfs' },
    { title: 'Spin: Spin joins Bird, 21 September 2023', url: 'https://www.spin.app/blog-posts/spin-joins-bird-will-continue-to-operate-as-independent-subsidiary-under-spin-brand' },
    { title: 'Bird: US rental agreement', url: 'https://bird.co/rental-agreements/united-states/' },
    { title: 'NBC Los Angeles: Lime to introduce LimeGliders in Los Angeles, 24 October 2025', url: 'https://www.nbclosangeles.com/news/local/lime-to-introduce-limegliders-in-los-angeles/3795604/' },
    { title: 'Metro Bike Share: passes and prices', url: 'https://bikeshare.metro.net/' },
    { title: 'Metro Bike Share: Electric Metro Bike', url: 'https://bikeshare.metro.net/how-it-works/electric/' },
    { title: 'Metro: Customer Code of Conduct (PDF)', url: 'https://media.metro.net/about_us/ethics/images/codeofconduct_customer.pdf' },
    { title: 'Metro: biking with Metro', url: 'https://www.metro.net/riding/biking-on-metro/' },
    { title: 'Metro: LAX/Metro Transit Center opens', url: 'https://www.metro.net/about/media-relations/now-boarding-metros-lax-metro-transit-center-station-officially-opens-connecting-communities-bringing-faster-easier-travel-for-angelenos-visitors/' },
    { title: 'NBC Los Angeles: LAX people mover delayed to 2027, 24 September 2026', url: 'https://www.nbclosangeles.com/news/local/lax-automated-people-mover-opening-2027/3947154/' },
    { title: 'Santa Monica: shared mobility rules, November 2025 (PDF)', url: 'https://www.santamonica.gov/media/SM-AdminGuidelines_Fall2025Update.pdf' },
    { title: 'Culver City: operating agreement with Bird, July 2026 to June 2027 (PDF)', url: 'https://culver-city.legistar1.com/culver-city/attachments/568c9f8a-1c97-4317-b103-96ed9a4ea1a5.pdf' },
    { title: 'City of West Hollywood: Dockless Mobility', url: 'https://engage.weho.org/dockless-mobility' },
    { title: 'UCLA Transportation: approved scooter and bike vendors', url: 'https://transportation.ucla.edu/content/approved-electric-scooter-and-electric-bike-vendors' },
  ],
};

export default guide;
