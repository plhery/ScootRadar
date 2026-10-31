import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-dunedin',
  topic: 'dunedin',
  name: 'Renting an e-scooter in Dunedin, New Zealand',
  title: 'Dunedin e-scooters: Flamingo, prices and the rules',
  description: 'E-scooter hire in Dunedin: Flamingo charges NZ$1 + 45c a minute, $5.50 for 10 minutes. No licence needed; no helmet law, but Flamingo requires one.',
  headline: 'E-scooters in Dunedin, New Zealand: Flamingo, prices, the rules, the University and Baldwin Street',
  lede: 'You can rent an e-scooter in Dunedin, New Zealand, from Flamingo, which won the city council’s 2024 tender to be its sole e-scooter operator. Flamingo charges NZ$1 to unlock plus 45c a minute, 24 hours a day (published rate, 31 October 2026), so a 10-minute ride costs $5.50. You need no driving licence, and no law requires a helmet, though Flamingo’s terms do. You may ride on the footpath with care, on shared paths and on the road, and since 1 October 2026 in cycle lanes, but Flamingo keeps its scooters off Baldwin Street, the Botanic Garden and the heart of the University of Otago’s campus.',
  published: '2026-10-31',
  updated: '2026-10-31',
  city: 'nz:ota:Dunedin',
  sections: [
    {
      heading: 'Which e-scooter apps work in Dunedin?',
      blocks: [
        'One company runs shared e-scooters in Ōtepoti Dunedin in 2026: **Flamingo**. Since 2021 a scooter-share company has needed a permit to trade on Dunedin’s streets under the council’s Trading in Public Places Bylaw. In March 2024 the Dunedin City Council asked for one operator to be the city’s sole provider from 1 July 2024, and on 30 May 2024 it awarded the permit to Flamingo.',
        'At 12.03pm on Saturday 31 October 2026 the [map of Dunedin](map:nz:ota:Dunedin) showed 346 Flamingo scooters free to rent at that moment. That total covers Flamingo’s whole Dunedin area, which reaches from the St Clair and St Kilda beaches up to hill suburbs such as Halfway Bush and Māori Hill, and out to Green Island and Port Chalmers: it has marked parking spots in each. The map shows each scooter’s place, its range and Flamingo’s price; zoom in and it also draws Flamingo’s zones and marked spots, but the app has the final word.',
        '**Lime, Neuron and Beam don’t rent shared scooters here.** Lime brought the first ones in January 2019 and left in June 2021, when it chose not to apply for a new permit. Neuron, which arrived in February 2021 and was the sole operator from July 2021, ran until 30 June 2024, and Flamingo took over the next day.',
      ],
    },
    {
      heading: 'How much does a Flamingo scooter cost in Dunedin?',
      blocks: [
        'Flamingo’s Dunedin rate is NZ$1 to unlock and 45c a minute, 24 hours a day, every day. It publishes that single plan for the city, and the price shows on each scooter on the map.',
        {
          table: {
            caption: 'Flamingo in Dunedin (published rate, 31 October 2026)',
            head: ['Ride', 'Price'],
            rows: [
              ['5 minutes', '$3.25'],
              ['10 minutes', '$5.50'],
              ['15 minutes', '$7.75'],
              ['20 minutes', '$10'],
              ['30 minutes', '$14.50'],
            ],
          },
        },
        '**Discounts.** Flamingo gives up to 50% off its standard ride rates to tertiary students with a valid ID and to SuperGold, Community Services, Total Mobility and Hāpai Access card holders. The discount doesn’t apply to its ride passes.',
        '**Free minutes.** AA members who link their membership get 30 free minutes to use in their first 30 days, then 15 free minutes a month; the unlock fee still applies. Parking at one of Flamingo’s marked spots earns ride credit.',
        '**Charges.** Flamingo’s terms allow charges of up to NZ$50, or more, for riding outside its area, parking in a no-parking zone or parking unsafely, or an unclear end-of-ride photo. New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Do you need a licence or a helmet? New Zealand’s e-scooter rules',
      blocks: [
        'The riding rules are national, the same as in [Christchurch](guide:christchurch). NZTA, the national transport agency, has declared e-scooters with a power output of up to 300 W not to be motor vehicles, so you can ride one without a driving licence or registration, visitor or not. It renewed that declaration in September 2023 for five years, to 2028. The council adds its permit; Flamingo and the University of Otago add their own rules.',
        {
          table: {
            caption: 'E-scooter rules in Dunedin on 31 October 2026',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Licence and registration', 'None for e-scooters of up to 300 W', 'National (NZTA)'],
              ['Minimum age', 'Flamingo 18, or 12 on a parent’s account', 'Operator'],
              ['Helmet', 'Not required by law; required by Flamingo’s terms', 'National; operator'],
              ['Footpath', 'Allowed: ride carefully and considerately, at a speed that is no hazard, and give way to people walking and using mobility devices', 'National'],
              ['Shared path', 'Allowed, with the same care', 'National'],
              ['Cycle lane', 'Allowed since 1 October 2026', 'National'],
              ['Road', 'Keep as near to the edge as you can', 'National'],
              ['Speed', 'Never a speed that endangers others; Flamingo tops out at 25 km/h, 15 km/h on George Street and at the Bus Hub, 10 km/h on Pilkington and Grater streets', 'National; operator'],
              ['Alcohol', 'Flamingo bans riding under the influence; careless riding is an offence', 'Operator; national'],
              ['Weather', 'No riding in heavy rain, electrical storms or strong wind; the service may pause in severe winter conditions', 'Operator'],
              ['No-ride and slow zones', 'Shown in the app; the scooter slows or stops', 'Operator'],
              ['Parking', 'Not blocking a path or entrance, not in a no-parking zone; end-of-ride photo', 'Operator'],
              ['Passengers', 'One rider only', 'Operator'],
              ['University of Otago', 'Dismount on the central Dunedin campus', 'University'],
              ['Shared scooter companies', 'One permit, Flamingo’s, since 1 July 2024', 'Council (Trading in Public Places Bylaw)'],
            ],
          },
        },
        { note: '**Flamingo’s terms require a helmet.** No law asks e-scooter riders for one, though NZTA strongly recommends it; Flamingo’s rental contract says you must wear an approved bicycle helmet. Account holders can order a free Flamingo helmet, paying NZ$10 for delivery.' },
        '**Cycle lanes are new.** A change to the national road rules opened them to e-scooters on 1 October 2026; until then, riding in one was illegal. Since the same day, a driver passing you in the same lane must leave at least 1.5 m.',
        '**There’s no 15 km/h footpath limit.** A footpath speed limit was proposed in 2020, in a government package called Accessible Streets, and never became law. The 15 km/h you’ll meet on George Street is Flamingo’s slow-zone limit.',
        '**Drinking.** Police say e-scooter riders can be charged under the Land Transport Act 1998, with careless driving for instance. Flamingo asks you not to drink before or while riding.',
      ],
    },
    {
      heading: 'Where to ride and park: the Octagon, George Street and the University',
      blocks: [
        'Flamingo’s app colours its zones: orange for low speed, yellow for no parking, red for no riding. Flamingo runs 24 hours a day.',
        '**The Octagon.** The city’s central square has a marked Flamingo spot. A stretch of Moray Place, the street that rings the centre, and the Moray Place car park are no-parking zones.',
        '**George Street.** The main shopping street is a 15 km/h slow zone from about Moray Place to London Street, with marked spots at its corners with St Andrew, Hanover and London streets. The Meridian Mall is a no-ride zone.',
        '**Buses and trains.** Flamingo also slows scooters to 15 km/h at the Bus Hub, and has marked spots at the bus terminal and by the train station. The Dunedin Railway Station and the Steamer Basin are no-parking zones.',
        '**University of Otago.** The university treats e-scooters like bicycles: all riders must dismount on the central Dunedin campus, and scooters can’t be taken into buildings or charged on campus. Flamingo’s no-ride zones cover the heart of the campus, around the Clocktower and the Union lawn, and other University blocks, and you can’t end a ride in any of them. Its marked spots are at the North Entrance, the Information Services Building and Unipol.',
        'Staff and students can borrow a bike helmet free at the Marsh Study Centre, the Staff Club, Te Mātiti Café, Unipol and the Visitors’ Centre.',
        '**The Botanic Garden and the Town Belt.** The Dunedin Botanic Garden, a stretch of the Town Belt and part of Queens Drive are no-ride zones, and the banks of the Water of Leith are no-parking.',
        '**Parking.** Leave the scooter at the side of the footpath, ideally by street furniture, clear of the walkway and entrances, and take the end-of-ride photo.',
      ],
    },
    {
      heading: 'Hills, beaches and the harbour: Baldwin Street, St Clair, Port Chalmers',
      blocks: [
        '**Baldwin Street**, in North East Valley, is a Flamingo no-ride zone. Elsewhere, Dunedin’s hills are steep: Flamingo asks riders to take care and keep a safe speed going downhill, and to take extra care on wet or icy surfaces. It may pause the service when winter conditions are severe.',
        '**St Clair and St Kilda.** Flamingo has marked spots at St Clair, St Clair Beach and St Kilda Beach. Second Beach, past the St Clair pool, the Ocean Beach Domain and Tomahawk Beach are no-ride zones, and John Wilson Ocean Drive is no-parking.',
        '**Port Chalmers.** You can ride the harbour cycleway out to Port Chalmers, but Flamingo bars parking along it: end your ride at the marked spot in Port Chalmers.',
        '**The Otago Peninsula.** Flamingo bars parking along Portobello Road as far as about Macandrew Bay, and has no marked spot on the Peninsula: check the service area in the app before you head for Portobello.',
        '**South-west.** Green Island and Fairfield have marked spots, but the motorway sections of State Highway 1 are no-ride zones, so take the local roads.',
      ],
    },
    {
      heading: 'Orbus buses and Forsyth Barr Stadium',
      blocks: [
        '**Orbus.** The Otago Regional Council’s buses take scooters carried on by hand, folded where possible; one that doesn’t fold is at the driver’s discretion. Mobility and motorised scooters aren’t allowed, so ask the driver before you bring your own e-scooter aboard. A shared Flamingo stays outside: end your ride before you board.',
        '**Forsyth Barr Stadium.** The stadium’s conditions of entry set no scooter rule. Logan Park, beside it, is a Flamingo no-ride zone. The nearest marked spot is at Unipol, next to the stadium.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Baldwin Street is the world’s steepest street again.** Guinness World Records reinstated it on 8 April 2020, measuring a gradient of 34.8% against 28.6% for Ffordd Pen Llech in Wales, which had held the title since June 2019.',
            '**Lime put Dunedin’s first 300 shared e-scooters on the streets on 10 January 2019.** By June 2021 more than 90,000 users had taken over 750,000 trips, the Otago Daily Times reported.',
            '**Six weeks after launch, Lime pulled its scooters off Dunedin’s streets** for a time over a brake fault that locked wheels: Lime reported 12 incidents in the city, three with injuries.',
            '**Neuron’s riders travelled close to 690,000 km in Dunedin** between February 2021 and June 2024, Neuron said.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How much is a Flamingo scooter per minute in Dunedin?',
      answer: '45c a minute plus NZ$1 to unlock, 24 hours a day: 10 minutes cost $5.50 (published rate, 31 October 2026). Tertiary students and SuperGold, Community Services, Total Mobility and Hāpai Access card holders get up to 50% off.',
    },
    {
      question: 'Which e-scooter companies operate in Dunedin?',
      answer: 'Only Flamingo, the council’s sole permit holder since 1 July 2024. At 12.03pm on 31 October 2026 the [Dunedin map](map:nz:ota:Dunedin) showed 346 Flamingo scooters free to rent at that moment.',
    },
    {
      question: 'Do you need a helmet to ride an e-scooter in Dunedin?',
      answer: 'Not by law, though NZTA strongly recommends one. Flamingo’s terms, though, require an approved bicycle helmet.',
    },
    {
      question: 'Can you ride an e-scooter on the footpath in Dunedin?',
      answer: 'Yes, carefully and considerately, at a speed that is no hazard, giving way to people walking. There’s no set 15 km/h limit; that was a 2020 proposal.',
    },
    {
      question: 'Can you ride an e-scooter up Baldwin Street?',
      answer: 'Not a Flamingo: the street is one of its no-ride zones. Walk it instead.',
    },
    {
      question: 'Can you ride an e-scooter on the University of Otago campus?',
      answer: 'No: the university asks all riders to dismount on the central Dunedin campus, and its heart is a Flamingo no-ride zone.',
    },
    {
      question: 'Can you take an e-scooter on an Orbus bus in Dunedin?',
      answer: 'A scooter carried on by hand, folded where possible, yes, though mobility and motorised scooters aren’t allowed: ask the driver about your own e-scooter. End a shared ride before you board.',
    },
  ],
  sources: [
    { title: 'Dunedin City Council: Micromobility (e-scooter) Operator, Permit to Operate in Dunedin (GETS tender 29071836, 2024)', url: 'https://www.gets.govt.nz/DCC/ExternalTenderDetails.htm?id=29071836' },
    { title: 'Flamingo: Dunedin prices, hours and zones', url: 'https://rideflamingo.com/city/dunedin' },
    { title: 'Flamingo: community and student discounts', url: 'https://rideflamingo.com/discounts' },
    { title: 'Flamingo: AA member benefit', url: 'https://rideflamingo.com/aa' },
    { title: 'Flamingo: free helmets', url: 'https://rideflamingo.com/helmets' },
    { title: 'Flamingo: terms of use (January 2023)', url: 'https://rideflamingo.com/terms' },
    { title: 'RNZ: What you need to know about road rules changing on 1 October (1 October 2026)', url: 'https://www.rnz.co.nz/news/community/1662993/explainer-what-you-need-to-know-about-road-rules-changing-on-1-october' },
    { title: 'RNZ: The rules that apply to electric scooters (23 May 2024)', url: 'https://www.rnz.co.nz/news/environment_climate/517651/the-rules-that-apply-to-electric-scooters-what-you-need-to-know' },
    { title: 'RNZ: Coroner’s findings on helmets and e-scooters (21 July 2026)', url: 'https://www.rnz.co.nz/news/community/755675/man-killed-in-lime-scooter-crash-wasn-t-wearing-helmet-had-been-drinking' },
    { title: 'Christchurch City Council: Shared Micromobility report, Council agenda 11 December 2024 (national rules)', url: 'https://christchurch.infocouncil.biz/Open/2024/12/CNCL_20241211_AGN_10401_AT.htm' },
    { title: 'University of Otago: E-scooters on campus (March 2026)', url: 'https://ask.otago.ac.nz/knowledgebase/article/KA-10002733' },
    { title: 'Orbus (Otago Regional Council): What can you take on the bus', url: 'https://www.orc.govt.nz/orbus/travel-with-us/using-the-bus/what-can-you-take-on-the-bus' },
    { title: 'Otago Daily Times: New fleet of e-scooters for Dunedin (8 June 2024)', url: 'https://www.odt.co.nz/news/dunedin/new-fleet-of-e-scooters-for-dunedin-pdk4oxo8' },
    { title: 'Otago Daily Times: Going forth on a Flamingo (2 July 2024)', url: 'https://www.odt.co.nz/news/dunedin/going-forth-on-a-flamingo-mrbesitz' },
    { title: 'Otago Daily Times: Lime to quit city as Neuron fires up (18 June 2021)', url: 'https://www.odt.co.nz/news/dunedin/lime-to-quit-city-as-neuron-fires-up-d5nzsckb' },
    { title: 'Otago Daily Times: Lime time here for Dunedin (10 January 2019)', url: 'https://www.odt.co.nz/news/dunedin/lime-time-here-for-dunedin-ju0l33i4' },
    { title: 'Otago Daily Times: Scooters off streets in Dunedin (23 February 2019)', url: 'https://www.odt.co.nz/news/dunedin/scooters-off-streets-in-dunedin-qq3auz7u' },
    { title: 'Guinness World Records: Baldwin Street reinstated as the world’s steepest street (8 April 2020)', url: 'https://www.guinnessworldrecords.com/news/2020/4/baldwin-street-in-new-zealand-reinstated-as-the-worlds-steepest-street-614287.html' },
  ],
};

export default guide;
