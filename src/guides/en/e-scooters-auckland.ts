import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-auckland',
  topic: 'auckland',
  name: 'Renting an e-scooter in Auckland',
  title: 'E-scooter Auckland 2026: Flamingo, Lime, rules and prices',
  description: 'E-scooter hire in Auckland: Flamingo and Lime, what a ride costs, NZ helmet, footpath and cycle-lane rules, where to park, ferries and the airport.',
  headline: 'E-scooters in Auckland: Flamingo and Lime, prices, New Zealand’s rules, parking and the ferries',
  lede: 'You can rent an e-scooter in Auckland from Flamingo or Lime, the two companies Auckland Council and Auckland Transport license. Flamingo charges NZ$1 to unlock plus NZ$0.45 a minute (published rate, 16 October 2026); Lime shows its price in the app. New Zealand law asks for no licence, sets no minimum age and doesn’t require a helmet, though Flamingo’s terms do. You may ride on the footpath with care, on shared paths and on the road, and since 1 October 2026 in cycle lanes.',
  published: '2026-10-16',
  updated: '2026-10-16',
  city: 'nz:auk:Auckland',
  sections: [
    {
      heading: 'Which e-scooter apps work in Auckland?',
      blocks: [
        'Two companies hold licences for shared e-scooters in Auckland: **Flamingo** and **Lime**. Auckland Council and Auckland Transport (AT) license them under their respective bylaws, with conditions set in the council’s [code of practice](https://www.aucklandcouncil.govt.nz/content/dam/ac/docs/licence-and-compliance/rental-micromobility-code-of-practice.pdf).',
        'On 16 October 2026 the [map of Auckland](map:nz:auk:Auckland) showed about 1,300 Flamingo scooters, from Albany to Onehunga and from Avondale to St Heliers: a count of what’s on the map, not the fleet. **Lime runs in Auckland too but isn’t on our map**, because it publishes no open data there; open the Lime app to find its scooters.',
        'The licences began on 4 November 2024 for two years, with the cap kept at 3,000 scooters: up to 1,600 for Lime and 1,400 for Flamingo. They expire in November 2026. The council isn’t inviting new applicants; it will let Flamingo and Lime re-apply, to keep service steady through the network changes around the City Rail Link. No decision had been published by 16 October 2026.',
        '**Visiting?** Get the apps before you land; you need no driving licence. Flamingo also runs in [Wellington](map:nz:wgn:Wellington) and [Christchurch](map:nz:can:Christchurch). New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Auckland?',
      blocks: [
        'Flamingo publishes its Auckland rate, NZ$1 to unlock and NZ$0.45 a minute, and runs 24 hours a day. Lime shows its price in its app.',
        {
          table: {
            caption: 'Flamingo in Auckland (published rate, 16 October 2026)',
            head: ['Ride', 'Price'],
            rows: [
              ['5 minutes', 'NZ$3.25'],
              ['10 minutes', 'NZ$5.50'],
              ['15 minutes', 'NZ$7.75'],
              ['20 minutes', 'NZ$10'],
              ['30 minutes', 'NZ$14.50'],
            ],
          },
        },
        'Flamingo gives up to 50% off to students and to SuperGold, Community Services, Total Mobility and Hāpai Access card holders, and ride credit for parking in a marked spot. Its terms allow charges of up to NZ$50, or more, for riding outside the area, bad parking or an unclear end-of-ride photo.',
      ],
    },
    {
      heading: 'Do you need a licence or a helmet for an e-scooter in New Zealand?',
      blocks: [
        'No licence. NZTA, the national transport agency, declares e-scooters with motors of up to 300 W not to be motor vehicles, so you need no driving licence, registration or plate, visitor or not. The current declaration runs until 30 September 2028.',
        'No helmet law either: the helmet rule covers bicycles only, and Auckland Council only recommends one.',
        { note: '**Flamingo’s terms require a helmet.** Its rental contract says you must wear an approved bicycle helmet when you ride, even though the law doesn’t ask for one.' },
        'The law sets no minimum age. Flamingo rents from 18; a parent or guardian may let a child of 12 or older ride on their account, supervised and wearing a helmet. Lime’s age rule is in its app.',
      ],
    },
    {
      heading: 'New Zealand’s e-scooter rules and fines in 2026',
      blocks: [
        'The riding rules are national: the Land Transport (Road User) Rule 2004 treats an e-scooter as a “wheeled recreational device”, like a skateboard. The council and AT add parking conditions through the licences; the companies add zones and curfews.',
        {
          table: {
            caption: 'E-scooter rules in Auckland on 16 October 2026',
            head: ['Rule', 'What applies', 'Set by', 'Fine'],
            rows: [
              ['Licence and registration', 'None for e-scooters of up to 300 W', 'National (NZTA)', '–'],
              ['Minimum age', 'None in law; Flamingo 18, or 12 on a parent’s account', 'Operator', '–'],
              ['Helmet', 'Not required by law; required by Flamingo’s terms', 'National; operator', '–'],
              ['Footpath', 'Allowed, with care, at no hazardous speed, giving way to people walking and mobility devices', 'National', 'NZ$100 careless or too fast; NZ$50 not giving way'],
              ['Shared path', 'Allowed, at a speed that is no hazard', 'National', 'NZ$100'],
              ['Cycle lane', 'Allowed since 1 October 2026', 'National', '–'],
              ['Road', 'Keep as near to the edge as you can', 'National', '–'],
              ['Speed', 'The road’s speed limit; Flamingo tops out at 25 km/h, 15 km/h in its slow zones', 'National; operator', '–'],
              ['Phone', 'No use while riding, except hands-free calls or a phone in a fixed mount', 'National', 'NZ$150'],
              ['Alcohol', 'No set limit, but careless riding is an offence; Flamingo bans riding under the influence', 'National; operator', 'Up to NZ$3,000 in court'],
              ['Passengers', 'No rule in law; Flamingo allows one rider only', 'Operator', '–'],
              ['Parking', 'Don’t obstruct the footpath; by the kerb, 1.8 m clear; end-of-ride photo', 'National; licence conditions', 'Flamingo charges up to NZ$50'],
            ],
          },
        },
        '**Cycle lanes are new.** The Land Transport (Road User) Amendment Rule 2026 opened them to e-scooters on 1 October 2026, and drivers turning across a cycle lane must give way to e-scooter riders in it. Since the same day, a motorist overtaking you in the same lane must leave at least 1.5 m.',
        '**There’s no 15 km/h footpath limit.** That was a 2020 government proposal, Accessible Streets, that never became law. The 15 km/h you’ll meet is Flamingo’s slow-zone limit.',
        '**Phone.** The rule forbids a driver to use a phone while driving, except for hands-free calls or a phone in a fixed mount, and counts an e-scooter rider as a driver: on that wording, the NZ$150 fee applies to you.',
        '**Alcohol: no limit doesn’t mean legal.** The Land Transport Act’s breath and blood-alcohol limits cover motor vehicles, which e-scooters legally are not. But riding any vehicle carelessly or without reasonable consideration for others is an offence under the same Act: a fine of up to NZ$3,000, and if you injure someone, up to three months in prison and a driving ban of six months or more. Flamingo’s terms ban riding under the influence.',
      ],
    },
    {
      heading: 'Where to ride and park in Auckland’s city centre',
      blocks: [
        'Flamingo’s app colours its zones: orange for low speed, yellow for no parking, red for no riding. Lime’s zones show in its app.',
        '**Slow zones.** The city centre and suburb centres are 15 km/h zones for Flamingo, including Karangahape Road, Ponsonby, Parnell, Newmarket, Devonport, Takapuna and Onehunga.',
        '**Queen Street.** Ride only on the shared path, and park only in the marked white boxes (a P on the map).',
        '**The waterfront: ride, but don’t park.** Wynyard Quarter, the Viaduct Basin, the waterfront, Britomart, Tāmaki Drive and Devonport Wharf are no-parking zones for Flamingo, except at marked spots such as the Downtown Ferry Terminal, Te Komititanga and Karanga Plaza.',
        '**No-ride zones.** Flamingo bans riding on the maunga (volcanic cones) such as Maungawhau / Mount Eden, Maungakiekie / One Tree Hill and Maungauika / North Head; in the Auckland Domain, Victoria Park and Western Springs; on the university campus; on motorways; and on Takapuna Beach.',
        '**Late at night.** Flamingo restricts its curfew areas from 10pm on Fridays and Saturdays, and Wynyard Quarter from 10pm every night; the app shows where. The council’s licence conditions let it order such curfews against drink-riding and noise.',
        '**Elsewhere**, the council’s conditions put scooters by the kerb, with 1.8 m of footpath clear, away from intersections, bus stops, driveways and dropped kerbs. Report a blocking scooter to Flamingo (0800 352 646) or Lime (0800 467 001): they must move it within 75 minutes in and near the centre, 90 in the suburbs.',
      ],
    },
    {
      heading: 'Two rides: Tāmaki Drive and the Lightpath',
      blocks: [
        '**City to Bays.** AT calls it the city’s most popular cycling route: 10 km from the Downtown Ferry Terminal along Tāmaki Drive to Mission Bay and St Heliers. Mind the port entrances, and don’t end your ride on Tāmaki Drive itself: it’s a no-parking zone.',
        '**Te Ara I Whiti, the Lightpath.** This magenta shared path on an old motorway off-ramp runs from Upper Queen Street over the lit Canada Street Bridge to Nelson Street. Ride it, but don’t park on it.',
      ],
    },
    {
      heading: 'Ferries, trains, buses and Auckland Airport',
      blocks: [
        '**Ferries.** AT and Fullers360 carry bikes and scooters free with a fare-paying passenger on most ferries, space permitting. E-scooters go on the back deck because of their batteries, and no scooter may sail to conservation islands such as Rangitoto. A shared scooter stays in its area, so end your ride at the Downtown Ferry Terminal and pick up another across the water: on 16 October 2026 Flamingo’s data showed about 40 around Devonport and none on Waiheke.',
        '**Trains and the City Rail Link.** The CRL opened on 13 September 2026, with new stations at Te Waihorotiu and Karanga-a-Hape and a rebuilt Maungawhau. All three sit in Flamingo no-parking zones, with marked spots at Te Waihorotiu and Maungawhau. AT’s rules cover bikes on trains, not e-scooters: end a shared ride outside the station.',
        '**Buses.** Non-folding scooters, electric ones included, can’t go on AT buses. Pay your fare with a contactless card or AT HOP.',
        '**The airport.** On 16 October 2026 the nearest Flamingo scooter was about 9 km from Auckland Airport. Take the AirportLink bus to Puhinui Station (every 10 minutes, 4.30am–12.40am) and the train, or bus 38 to Onehunga, where Flamingo’s area begins.',
      ],
    },
    {
      heading: 'Weather and hills in Tāmaki Makaurau',
      blocks: [
        'NIWA calls Auckland’s climate subtropical: warm, humid summers, mild winters and plentiful rain all year. Expect wet footpaths in any month and brake early on downhills; the steepest climbs, the maunga, are no-ride zones anyway.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Without NZTA’s declaration, e-scooters could be ridden only on private property.** The agency renewed it in 2023 for five years.',
            '**Auckland Council cancelled Beam’s licence on the spot in August 2024**, after an analysis for the council indicated it had run almost 40% more scooters than allowed in the city centre and fringe, hidden by misleading data.',
            '**More than two million train trips** were taken in the City Rail Link’s first month, AT said on 14 October 2026.',
            '**The Nelson Street cycleway, which the Lightpath joins, was designed with Māori artist Katz Maihi and iwi**, and includes a large koru pattern.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Auckland?',
      answer: 'Flamingo and Lime, licensed by Auckland Council and AT until November 2026. Our [Auckland map](map:nz:auk:Auckland) shows Flamingo only, about 1,300 scooters on 16 October 2026; find Lime’s in its app.',
    },
    {
      question: 'Is a helmet compulsory on an e-scooter in New Zealand?',
      answer: 'Not by law: the helmet rule covers bicycles, and Auckland Council only recommends one. Flamingo’s terms, though, require an approved bicycle helmet.',
    },
    {
      question: 'Can you ride an e-scooter on the footpath in NZ?',
      answer: 'Yes, carefully, at a speed that is no hazard, giving way to people walking. Riding carelessly or too fast costs NZ$100, not giving way NZ$50. There’s no 15 km/h limit.',
    },
    {
      question: 'Are e-scooters allowed in cycle lanes in New Zealand?',
      answer: 'Yes, since 1 October 2026. Drivers turning across a cycle lane must give way to e-scooter riders in it, and a motorist overtaking you in the same lane must leave at least 1.5 m.',
    },
    {
      question: 'Can you ride an e-scooter after drinking in New Zealand?',
      answer: 'Don’t. The alcohol limits are written for motor vehicles, not e-scooters, but careless riding is an offence on any vehicle, with a fine of up to NZ$3,000. Flamingo’s terms ban riding under the influence.',
    },
    {
      question: 'How old do you have to be to hire an e-scooter in Auckland?',
      answer: 'The law sets no minimum age. Flamingo rents from 18, or from 12 on a parent’s account, supervised and helmeted. Lime’s rule is in its app.',
    },
    {
      question: 'Can you take an e-scooter on the ferry to Devonport?',
      answer: 'Your own, yes: it travels free on most ferries, on the back deck. A shared scooter stays in its area, so end the ride at the Downtown Ferry Terminal and take another in Devonport.',
    },
  ],
  sources: [
    { title: 'Auckland Council: e-scooter licences and regulations in Auckland', url: 'https://www.aucklandcouncil.govt.nz/en/licences-regulations/e-scooter-licences-regulations-auckland.html' },
    { title: 'Auckland Council: two operators selected for new e-scooter licences (23 September 2024)', url: 'https://ourauckland.aucklandcouncil.govt.nz/news/2024/09/two-operators-selected-for-new-e-scooter-licences-in-auckland/' },
    { title: 'Auckland Council: Beam’s e-scooter licence cancelled (27 August 2024)', url: 'https://ourauckland.aucklandcouncil.govt.nz/news/2024/08/beam-s-e-scooter-licence-cancelled-following-serious-compliance-breach/' },
    { title: 'Land Transport (Road User) Rule 2004, as at 1 October 2026', url: 'https://www.legislation.govt.nz/regulation/public/2004/0427/latest/whole.html' },
    { title: 'Land Transport (Offences and Penalties) Regulations 1999, as at 1 October 2026', url: 'https://www.legislation.govt.nz/regulation/public/1999/0099/latest/whole.html' },
    { title: 'Land Transport Act 1998', url: 'https://www.legislation.govt.nz/act/public/1998/0110/latest/whole.html' },
    { title: 'NZTA: e-scooter declaration renewal decision (2023)', url: 'https://www.nzta.govt.nz/regulatory/e-scooter-declaration-renewal-decision/' },
    { title: 'NZTA: road code updates from 1 October 2026', url: 'https://www.nzta.govt.nz/driving-skills/learn-to-drive/roadcode/general-road-code/overview/updates-to-the-general-road-code' },
    { title: 'Auckland Transport: bikes and scooters on public transport', url: 'https://at.govt.nz/bus-train-ferry/luggage-bikes-animals/bikes-public-transport' },
    { title: 'Fullers360: your bicycles and scooters on board', url: 'https://www.fullers.co.nz/travel-information/before-you-go/your-bicycles-and-scooters-onboard/' },
    { title: 'Flamingo: Auckland prices, zones and parking', url: 'https://rideflamingo.com/city/auckland' },
    { title: 'Flamingo: terms of use (January 2023)', url: 'https://rideflamingo.com/terms' },
  ],
};

export default guide;
