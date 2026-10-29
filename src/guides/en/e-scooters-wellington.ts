import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-wellington',
  topic: 'wellington',
  name: 'Renting an e-scooter in Wellington, New Zealand',
  title: 'Wellington e-scooters: Flamingo and Lime, prices and rules',
  description: 'Flamingo charges NZ$1 + 55c a minute in Wellington, so 10 minutes costs $6.50; Lime’s price is in its app. No licence needed, and cycle lanes are now allowed.',
  headline: 'E-scooters in Wellington, New Zealand: Flamingo and Lime, prices, the rules, the hills and the airport',
  lede: 'You can rent an e-scooter in Wellington, Te Whanganui-a-Tara, from Flamingo or Lime. Flamingo charges NZ$1 to unlock plus 55c a minute, 24 hours a day (published rate, 23 October 2026), so a 10-minute ride costs $6.50; Lime shows its price in its app. You need no driving licence, and no law requires a helmet, though Flamingo’s terms do. You may ride on the footpath with care, on shared paths, on the road and, since 1 October 2026, in cycle lanes; Flamingo keeps its riders on the road along the Golden Mile and out of Cuba Mall.',
  published: '2026-10-23',
  updated: '2026-10-26',
  city: 'nz:wgn:Wellington',
  sections: [
    {
      heading: 'Which e-scooter apps work in Wellington?',
      blocks: [
        'Two companies rent e-scooters on Wellington’s streets in 2026: **Flamingo** and **Lime**. On 20 January 2026 Wellington City Council awarded its shared micromobility tender to both, to follow licences due to expire on 1 March 2026. Flamingo has run here since 2019; Lime launched its e-scooters in March 2026.',
        'Early on the morning of 23 October 2026 the [map of Wellington](map:nz:wgn:Wellington) showed about 430 Flamingo scooters: a snapshot of what was on the map, not the fleet. **Lime runs in Wellington too**, and since 26 October 2026 our map shows its scooters as well. Flamingo also rents e-bikes, and Lime planned to add its own from April 2026; our map shows e-scooters only.',
        '**How many are allowed?** The council has agreed to raise the number of shared e-scooters and e-bikes from 1,300 to up to 2,000, split evenly between Lime and Flamingo, RNZ reported on 2 July 2026, when 1,000 e-scooters and 300 e-bikes were in use. We couldn’t confirm when the increase takes effect or when the licences end.',
        '**Porirua and Tawa.** Flamingo runs a separate area to the north, “Porirua City (and Tawa)”, at the same price, so Tawa’s scooters belong to that area; the [Porirua map](map:nz:wgn:Porirua) showed about 50 early on 23 October.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Wellington?',
      blocks: [
        'Flamingo’s Wellington rate is NZ$1 to unlock and 55c a minute, 24 hours a day; on 23 October 2026 its open data listed that single plan, for scooters and e-bikes alike.',
        {
          table: {
            caption: 'Flamingo in Wellington (published rate, 23 October 2026)',
            head: ['Ride', 'Price'],
            rows: [
              ['5 minutes', '$3.75'],
              ['10 minutes', '$6.50'],
              ['15 minutes', '$9.25'],
              ['20 minutes', '$12'],
              ['30 minutes', '$17.50'],
            ],
          },
        },
        '**Discounts.** Flamingo offers up to 50% off to students at an accredited higher education institution with a valid ID, to SuperGold, Community Services, Total Mobility and Hāpai Access card holders, and to holders of the council’s LeisureCard, on standard ride rates only.',
        '**Free minutes.** AA members who link their membership get 30 free minutes to use in their first 30 days, then 15 free minutes a month; the unlock fee still applies. Parking in a Ruru Rack or a Drop Zone, the marked spots on Flamingo’s map, earns ride credit.',
        '**Charges.** Flamingo’s terms allow charges of up to $50, or more, for riding outside its area, parking in a no-parking zone or in the way, or an unclear end-of-ride photo.',
        'Lime’s price shows in its app. New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'E-scooter rules in Wellington: national law, the council and the operators',
      blocks: [
        'The riding rules are national, in the Land Transport (Road User) Rule 2004, as Greater Wellington Regional Council’s e-scooter guide explains; the same rules apply in [Auckland](guide:auckland). Flamingo’s local rules are below; Lime’s are in its app.',
        {
          table: {
            caption: 'E-scooter rules in Wellington on 23 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Licence and registration', 'None for e-scooters of up to 300 W', 'National (NZTA)'],
              ['Minimum age', 'Flamingo 18, or 12 on a parent’s account', 'Operator'],
              ['Helmet', 'Not required by law; required by Flamingo’s terms', 'National; operator'],
              ['Footpath', 'Allowed: ride carefully and considerately, at a speed that is no hazard, and give way to people walking and using mobility devices', 'National'],
              ['Golden Mile', 'Ride on the road, not the footpath, along Lambton Quay, Willis Street, Manners Street and Courtenay Place', 'Flamingo, which calls it a Wellington requirement'],
              ['Shared path', 'Allowed, with the same care', 'National'],
              ['Cycle lane', 'Allowed since 1 October 2026', 'National'],
              ['Road', 'Keep as near to the edge as you can', 'National'],
              ['Speed', 'Never a speed that endangers others; Flamingo tops out at 25 km/h, 15 km/h in its slow zones', 'National; operator'],
              ['Cuba Mall', 'No riding between Manners Street and Ghuznee Street', 'Operator (Flamingo)'],
              ['Courtenay Precinct', '“Restricted” 9pm to 6am, Thursday to Saturday and on public holiday eves; Flamingo doesn’t say how', 'Unclear: only Flamingo’s city page states it'],
              ['Alcohol', 'Flamingo bans riding after drinking; careless riding is an offence', 'Operator; national'],
              ['Weather', 'No riding in strong wind, heavy rain or electrical storms', 'Operator (Flamingo’s terms)'],
              ['Parking', 'Side of the footpath, clear of entrances, not in a no-parking zone; end-of-ride photo', 'Operator'],
              ['Passengers', 'One rider only', 'Operator'],
              ['Number of devices', 'Flamingo and Lime; up to 2,000 e-scooters and e-bikes in all, as RNZ reported in July 2026', 'Council'],
            ],
          },
        },
        '**No licence.** NZTA, the national transport agency, has declared e-scooters of up to 300 W not to be motor vehicles, so you need no driving licence or registration, visitor or not. It renewed that declaration in September 2023 for five years, to 2028.',
        { note: '**No helmet law, but Flamingo requires one.** NZTA strongly recommends a helmet, and Flamingo’s terms say you must wear an approved bicycle helmet. Account holders can order a free Flamingo helmet, paying $10 for delivery.' },
        '**Cycle lanes are new.** A change to the national road rules opened them to e-scooters on 1 October 2026; until then, riding in one was illegal. Since the same day, a driver passing you in the same lane must leave at least 1.5 m.',
        '**There’s no 15 km/h footpath limit.** The Ministry of Transport consulted on one in 2020, in a package called Accessible Streets, but it was never brought in, and the 2026 changes didn’t add one. The 15 km/h you’ll meet is Flamingo’s slow-zone limit.',
      ],
    },
    {
      heading: 'Where to ride and park: the Golden Mile, Cuba Mall and the waterfront',
      blocks: [
        'Flamingo’s app colours its zones: orange for low speed, yellow for no parking, red for no riding. Lime said at launch it would set no-ride and slow zones and parking bays in busy areas: check its app.',
        '**The Golden Mile.** Flamingo keeps you off the footpaths of Lambton Quay, Willis Street, Manners Street and Courtenay Place, and you can’t end a ride on any of them. Late at night, check the app before riding into the Courtenay Precinct.',
        '**Cuba Mall and Civic Square.** Flamingo’s no-ride zones cover Cuba Mall, between Manners and Ghuznee streets, and Civic Square with the City to Sea Bridge.',
        '**The waterfront and Oriental Bay.** Flamingo slows its scooters to 15 km/h on the waterfront and asks you to keep left and keep to the posted limit. Frank Kitts Park and Waitangi Park are no-ride zones, and you can’t end a ride outside Te Papa. On Oriental Parade, Flamingo asks you to use the cycle path, also at 15 km/h. It has marked parking spots at Queens Wharf, Taranaki Wharf and Shed 13.',
        '**Parks.** Flamingo’s data makes the Botanic Gardens a no-ride zone, apart from a cycle path at 10 km/h, and also Bolton Street Cemetery, Otari-Wilton’s Bush and the Southern Walkway. It’s 15 km/h around Parliament and 10 km/h at Wellington Hospital, with no parking at either.',
        '**Parking.** Leave the scooter at the side of the footpath, ideally by street furniture, without blocking the walkway or an entrance. Flamingo told RNZ it checks every rider’s parking photo and moves from education to fines and bans. Report a badly parked Flamingo in its app or on 0800 352 646.',
      ],
    },
    {
      heading: 'Wellington’s hills and wind on an e-scooter',
      blocks: [
        '**Hills.** Greater Wellington’s e-scooter guide advises avoiding steps and steep inclines where you can; on steeper ones you may have to push with your foot or walk the scooter. Flamingo says its scooters govern their speed downhill.',
        '**Kelburn and the university.** The Wellington Cable Car climbs 119 m over 609 m from Lambton Quay to Kelburn, in 4 to 5 minutes, with cars every 10 minutes. A one-way adult fare is $7, or $4 at the ticket box with a New Zealand student ID, SuperGold or Community Services card. Te Herenga Waka Victoria University asks riders to take particular care on the hilly streets around Kelburn and to walk scooters through campus, where they can’t be parked.',
        '**Wind.** Spring is consistently Wellington’s windiest season, NIWA says: in an average October, gusts top 60 km/h at the airport on about half the days. Flamingo’s terms bar riding in strong wind, heavy rain or electrical storms, so plan around them.',
        '**To the Hutt.** Te Ara Tupua, a 4.5 km walking and cycling path along the harbour from Ngā Ūranga to Pito-One (Petone), opened in May 2026. Flamingo’s data showed no zones or scooters along it beyond Ngā Ūranga, and Lower Hutt isn’t on our map: check the app’s service area first.',
      ],
    },
    {
      heading: 'Metlink buses and trains, and the airport',
      blocks: [
        '**Metlink.** A scooter you can carry by hand, folded where possible, travels free on buses and trains as luggage, if there’s room. A shared scooter stays outside: end your ride before you board. Don’t ride on railway platforms. Wellington Station itself is a no-ride zone for Flamingo, and the stations of the Johnsonville line are no-parking zones.',
        '**Wellington Airport.** Flamingo puts the ride from the CBD at about 30 minutes and about $20. Its parking area is at the bike parking in the car park building: follow the signs to Covered parking, then the lane marked “Loading Dock”. Arriving, cross the taxi and pick-up lanes from the ground floor and turn left. Few scooters waited there on the evening of 23 October; the Airport Express bus, from Door E, reaches Wellington Station in 25 to 35 minutes.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Wellingtonians took more than 2.3 million Flamingo rides** between its 2019 launch and November 2023, the company says.',
            '**Flamingo’s Gen 5 scooters arrived in Wellington in November 2023** with an onboard camera, partly to spot riding on the Golden Mile’s footpaths.',
            '**The cable car passes through three tunnels and over three bridges** on its 609 m run, and has carried passengers for more than 120 years.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How much is a Flamingo scooter per minute in Wellington?',
      answer: '55c a minute plus NZ$1 to unlock, 24 hours a day: 10 minutes cost $6.50 (published rate, 23 October 2026). Students, SuperGold and Community Services card holders can get up to 50% off.',
    },
    {
      question: 'Which e-scooter companies operate in Wellington?',
      answer: 'Flamingo and Lime, both chosen by the council in January 2026. Our [Wellington map](map:nz:wgn:Wellington) shows both: Flamingo’s, about 430 scooters early on 23 October 2026, and since 26 October Lime’s.',
    },
    {
      question: 'Can you ride an e-scooter on the footpath in Wellington?',
      answer: 'Yes, carefully, at a speed that is no hazard, giving way to people walking. On the Golden Mile (Lambton Quay, Willis Street, Manners Street and Courtenay Place), Flamingo tells you to ride on the road, which it says Wellington requires.',
    },
    {
      question: 'Is a helmet compulsory on an e-scooter in New Zealand?',
      answer: 'Not by law, though NZTA strongly recommends one. Flamingo’s terms require an approved bicycle helmet.',
    },
    {
      question: 'Are e-scooters allowed in cycle lanes in New Zealand?',
      answer: 'Yes, since 1 October 2026; before that it was illegal. A driver passing you in the same lane must leave at least 1.5 m.',
    },
    {
      question: 'Can you ride a Flamingo scooter to Wellington Airport?',
      answer: 'Yes. It takes about 30 minutes from the CBD and costs about $20, Flamingo says. Park in its marked area in the car park building.',
    },
  ],
  sources: [
    { title: 'GETS: council micromobility tender, awarded 20 January 2026', url: 'https://www.gets.govt.nz/WCC/ExternalTenderDetails.htm?id=32630894' },
    { title: 'RNZ: E-scooter numbers to rise in Wellington (2 July 2026)', url: 'https://www.rnz.co.nz/news/regions_wellington/652281/don-t-be-a-d-e-scooter-numbers-to-rise-in-wellington' },
    { title: 'FutureFive: Lime launches in Wellington (6 March 2026)', url: 'https://futurefive.co.nz/story/lime-rolls-out-shared-e-scooters-e-bikes-in-wellington' },
    { title: 'Greater Wellington: e-scooter guide (2024)', url: 'https://kurakete.gw.govt.nz/assets/Uploads/Road-safety/Scooter-Ready-e-scooter-guide-2024.pdf' },
    { title: 'Christchurch City Council: micromobility report (11 December 2024)', url: 'https://christchurch.infocouncil.biz/Open/2024/12/CNCL_20241211_AGN_10401_AT.htm' },
    { title: 'RNZ: The rules that apply to electric scooters (23 May 2024)', url: 'https://www.rnz.co.nz/news/environment_climate/517651/the-rules-that-apply-to-electric-scooters-what-you-need-to-know' },
    { title: 'RNZ: Calls to get e-scooters off the footpath (25 March 2024)', url: 'https://www.rnz.co.nz/news/politics/512646/calls-to-get-e-scooters-off-the-footpath-as-injuries-soar' },
    { title: 'RNZ: Coroner’s findings on helmets and e-scooters (21 July 2026)', url: 'https://www.rnz.co.nz/news/community/755675/man-killed-in-lime-scooter-crash-wasn-t-wearing-helmet-had-been-drinking' },
    { title: 'RNZ: road rules changing on 1 October (1 October 2026)', url: 'https://www.rnz.co.nz/news/community/1662993/explainer-what-you-need-to-know-about-road-rules-changing-on-1-october' },
    { title: 'Flamingo: Wellington prices, hours and rules', url: 'https://rideflamingo.com/city/wellington' },
    { title: 'Flamingo: Porirua', url: 'https://rideflamingo.com/city/porirua' },
    { title: 'Flamingo: riding to Wellington Airport', url: 'https://rideflamingo.com/wlg' },
    { title: 'Flamingo: community and student discounts', url: 'https://rideflamingo.com/discounts' },
    { title: 'Flamingo: AA member benefit', url: 'https://rideflamingo.com/aa' },
    { title: 'Flamingo: AA partnership (August 2026)', url: 'https://rideflamingo.com/news/aa-partnership' },
    { title: 'Flamingo: Gen 5 scooters in Wellington (November 2023)', url: 'https://rideflamingo.com/news/flamingo-gen-5' },
    { title: 'Flamingo: free helmets', url: 'https://rideflamingo.com/helmets' },
    { title: 'Flamingo: terms of use (January 2023)', url: 'https://rideflamingo.com/terms' },
    { title: 'Metlink: bikes and scooters', url: 'https://www.metlink.org.nz/getting-started/apps-maps-and-guides/bikes-and-scooters' },
    { title: 'Wellington Cable Car: FAQ', url: 'https://www.wellingtoncablecar.co.nz/faq' },
    { title: 'Wellington Cable Car: timetable and fares', url: 'https://www.wellingtoncablecar.co.nz/timetable-fares' },
    { title: 'Victoria University of Wellington: getting to campus', url: 'https://www.wgtn.ac.nz/students/student-life/our-campuses/getting-to-campus' },
    { title: 'Wellington Airport: Airport Express', url: 'https://www.wellingtonairport.co.nz/transport/airport-express-bus/' },
    { title: 'NIWA: Fear of flying into Wellington (December 2013)', url: 'https://niwa.co.nz/water-atmosphere/water-atmosphere-9-december-2013/fear-flying-wellington' },
    { title: 'Waatea News: Te Ara Tupua opens (17 May 2026)', url: 'https://waateanews.com/2026/05/17/regional-te-ara-tupua-opens-linking-wellington-and-hutt-valley-in-major-coastal-project/' },
  ],
};

export default guide;
