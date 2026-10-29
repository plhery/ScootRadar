import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-orlando',
  topic: 'orlando',
  name: 'E-scooters in Orlando, Florida',
  title: 'E-scooters in Orlando 2026: Lime, Bird and the rules',
  description: 'E-scooters in Orlando: renting Lime and Bird, the price, Florida and City rules, sidewalks, the Orange Avenue weekend ban, Lake Eola, LYNX and SunRail.',
  headline: 'E-scooters in Orlando: Lime and Bird, the rules, and where you can’t ride',
  lede: 'You can rent e-scooters in Orlando from Lime and Bird, two of the three companies the City of Orlando lists in its scooter share programme; the third, Veo, rents e-bikes. The map shows Lime’s scooters but not Bird’s, and no open source gives either company’s price, so check the app before you unlock. Florida law requires no driver’s licence, and a helmet only for riders under 16; the City holds stand-up scooters to 10 mph, and from 8 p.m. to 4 a.m. on Fridays, Saturdays and Sundays you may not ride or park a shared scooter on Orange Avenue downtown.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'us:fl:Orlando',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Orlando?',
      blocks: [
        'Electric scooter rental in Orlando means **Lime** or **Bird**. The City of Orlando lets companies rent dockless bikes and scooters under permits, and regulates them under Chapter 10 of its City Code. Its Bike Share & Scooter Share page, read on 29 October 2026, lists three companies: Lime, Bird and Veo.',
        'Lime and Bird rent stand-up e-scooters. Veo’s open data listed only e-bikes in Orlando on 29 October 2026, no scooters: rent those in the Veo app.',
        'At 4:23 p.m. on Thursday 29 October 2026 the [Orlando map](map:us:fl:Orlando) showed about 750 Lime scooters as last counted, so some may have moved since: the map’s count, not Lime’s fleet. The total covers Lime’s whole Orlando area, which reaches past the city line: it includes Lime’s scooters on International Drive, in unincorporated Orange County, which runs a scooter programme of its own there.',
        'For Lime scooters the map shows each one’s position and charge, but no price. **Bird’s scooters aren’t on the map**, and nor are Veo’s e-bikes: open the Bird or Veo app to find them. **First ride?** See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Orlando?',
      blocks: [
        'No open official source gives Lime’s or Bird’s current Orlando prices: the app shows the unlock fee and the rate per minute before you start. Veo publishes its e-bike price in its open data.',
        {
          table: {
            caption: 'Who rents in Orlando and what it costs (checked on 29 October 2026)',
            head: ['Company', 'What it rents in Orlando', 'Price', 'On the map'],
            rows: [
              ['Lime', 'Stand-up e-scooters', 'The Lime app shows it', 'Yes: position and charge'],
              ['Bird', 'Stand-up e-scooters', 'The Bird app shows it', 'No'],
              ['Veo', 'E-bikes', '$1 to unlock plus $0.42 a minute, plus tax, in Veo’s open data', 'No'],
            ],
          },
        },
        'The City charges the companies a fee on every ride, for enforcement, scooter parking areas and sidewalk and bike path work: $0.25, its FAQ said on 29 October 2026, though Orlando Weekly reported on 9 November 2021 that it was rising to 30 cents.',
        'For riders on a low income, MetroPlan Orlando, the region’s transportation planning agency, wrote in November 2025, citing the City, that Orlando requires the companies to offer reduced rates to people who receive SNAP food assistance and to keep 20% of their fleets in areas of higher need such as Parramore. The City’s own page doesn’t mention it, so ask the company in its app.',
      ],
    },
    {
      heading: 'Scooter rules in Florida and Orlando',
      blocks: [
        'Florida law gives a scooter rider a cyclist’s rights and duties and lets cities add their own rules for streets and sidewalks. The City runs the programme; the companies’ terms come on top. [E-scooters in Tampa](guide:tampa) covers the same state law.',
        {
          table: {
            caption: 'E-scooter rules in Orlando on 29 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'Florida sets no minimum age, but since 1 July 2025 lets cities set one; the City’s page sets none. The apps set their own', 'Florida: Fla. Stat. § 316.2128(7); City of Orlando'],
              ['Licence', 'None: no driver’s licence, registration or insurance', 'Florida: § 316.2128(2)–(3)'],
              ['Helmet', 'Riders under 16 must wear a properly fitted bicycle helmet, fastened with its strap, that meets the federal safety standard. The City strongly encourages one for everyone', 'Florida: §§ 316.2128(1) and 316.2065(3)(d); City of Orlando'],
              ['Speed', 'The City holds stand-up scooters to 10 mph; under Florida’s definition a motorized scooter can’t go faster than 20 mph', 'City of Orlando; Florida: § 316.003(48)'],
              ['On the street', 'Obey all traffic laws and ride with traffic, in the bike lane or as close to the right-hand curb as practicable, no more than two abreast', 'City of Orlando; Florida: § 316.2065(5)–(6)'],
              ['Sidewalks', 'Stand-up scooters may use them unless a sign or rule says otherwise; seated scooters only if held to 10 mph. Yield to people walking and give an audible warning before you pass', 'City of Orlando; Florida: § 316.2065(9)–(10)'],
              ['Passengers', 'One rider per scooter', 'Florida: § 316.2065(3)(a)'],
              ['Lights', 'From sunset to sunrise, a white light in front and a red one behind', 'Florida: § 316.2065(7)'],
              ['Alcohol and drugs', 'Never ride under the influence. Florida’s DUI law covers anyone driving a vehicle, which state law defines as any device that carries a person on a street', 'City of Orlando; Florida: §§ 316.003(109) and 316.193'],
              ['Hours', 'No rental curfew. Orange Avenue downtown is a no-ride, no-park zone for shared bikes and scooters from 8 p.m. to 4 a.m. on Fridays, Saturdays and Sundays', 'City of Orlando'],
              ['Fines', 'Breaking Florida’s bicycle rules is a noncriminal infraction with a $15 penalty', 'Florida: §§ 316.2065(19) and 318.18(1)(b)'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Orange Avenue, Church Street and Lake Eola',
      blocks: [
        {
          list: [
            '**Orange Avenue on weekend nights.** From 8 p.m. to 4 a.m. on Fridays, Saturdays and Sundays the Orange Avenue corridor of the Downtown Entertainment District is a no-ride and no-park zone for every shared bike and scooter, the City says: a ride may not begin on Orange Avenue, continue into it or end there. The companies send notices in their apps downtown, so watch for them.',
            '**Church Street.** The City sets no scooter rule of its own for Church Street: its general rules apply. Ride with traffic, and park in a marked area or near a rack, as everywhere downtown.',
            '**Lake Eola Park.** Scooters and bikes are banned in some city parks, Lake Eola among them, the City says, and its park rules ban bike riding in any city park except on a posted bike trail. Park outside and walk the 0.9-mile path around the lake; the park is open from 6 a.m. to 11:59 p.m.',
          ],
        },
        'The map draws no zones in Orlando. The City says any other places where scooters are banned are shown on the maps in each company’s app, so check it before you set off.',
      ],
    },
    {
      heading: 'Where to park a scooter in Orlando',
      blocks: [
        'Downtown, the City has set out parking areas for dockless bikes and scooters: painted boxes on the pavement, signed two-wheeler spaces and racks. Use one, or park near a rack. Everywhere, park upright and leave at least five feet of sidewalk clear. Never block:',
        {
          list: [
            'a sidewalk, a curb ramp, a wheelchair ramp or a bus stop;',
            'a fire hydrant, a call box or other emergency equipment;',
            'a driveway, a parking space or the entrance to a building or home.',
          ],
        },
        'And never park in the street, in a loading zone, in a parking garage, inside a transit facility, on a train platform, or on or beside railroad tracks and crossings. To report a badly parked scooter, contact the company or use the City’s online form.',
      ],
    },
    {
      heading: 'LYNX, SunRail, the arena, the stadium and the campuses',
      blocks: [
        {
          list: [
            '**LYNX buses.** On 7 August 2019 LYNX said Lime’s e-bikes, with their lithium batteries, may not go inside its buses or on their bike racks, and that e-scooters with lithium batteries would be banned inside too. End your ride before you board.',
            '**SunRail.** Its rules of conduct say bicycles, skateboards and unpowered scooters must be carried and kept under control on its trains and property; they don’t mention e-scooters. A shared scooter stays outside: end your ride near the station, off the platform.',
            '**Kia Center and Camping World Stadium.** Both bar cycles, skates and skateboards inside, and neither names scooters. End your ride outside and park it by the rules above.',
            '**UCF.** The main campus lies east of Lime’s Orlando area, and the map shows no scooters on it. UCF’s scooter page dates from its partnership with Spin: it kept scooters inside the campus, with 10 mph zones in busy areas and a curfew from 11 p.m. to 5 a.m., so check the app for today’s rules. UCF’s parking regulation bans leaving any scooter on a sidewalk, a crosswalk or a disabled ramp.',
            '**Valencia College’s Downtown Campus** is shared with UCF Downtown, and Valencia’s micromobility policy, amended on 13 March 2025, leaves the vehicle rules there to UCF.',
            '**International Drive.** It lies outside the city, in Orange County’s own scooter programme with Lime and Bird, which the County launched in July 2024 for riders over 18. Spectrum News 13 reported that the County renewed both contracts on 13 October 2026 and holds scooters on the drive to 10 mph, and that a County ordinance passed on 29 September 2026 sets 10 mph on sidewalks and shared-use paths, 20 mph elsewhere, and $100 citations.',
          ],
        },
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Launched on a parking ramp.** Lime’s Orlando scooters went live on 21 January 2020 with safety tutorials on a parking ramp at the Amway Center downtown, Orlando Weekly reported, held to 10 mph from the start.',
            '**26 times the rides.** Shared bike and scooter trips in Orlando grew from about 16,900 in 2018 to more than 435,600 in 2023, MetroPlan Orlando says.',
            '**Six classes a year.** The City requires each scooter share permit holder to hold six safety training classes a year.',
            '**Hurricanes clear the streets.** Florida law makes rental companies secure every scooter in an area under a tropical storm or hurricane warning from the National Weather Service.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which scooter companies operate in Orlando?',
      answer: 'Lime and Bird rent e-scooters, and Veo rents e-bikes: the City of Orlando’s scooter share page lists all three. The [Orlando map](map:us:fl:Orlando) shows Lime’s scooters; Bird’s and Veo’s are in their own apps.',
    },
    {
      question: 'Can you ride a scooter on Orange Avenue at night?',
      answer: 'Not on weekend nights. From 8 p.m. to 4 a.m. on Fridays, Saturdays and Sundays the Orange Avenue corridor of the Downtown Entertainment District is a no-ride and no-park zone for shared bikes and scooters: you may not start, ride through or end a ride there.',
    },
    {
      question: 'Can you ride an e-scooter on the sidewalk in Orlando?',
      answer: 'Yes, on a stand-up scooter, unless signs say otherwise, the City says; seated scooters only if held to 10 mph. Florida law has you yield to people walking and give an audible warning before you pass.',
    },
    {
      question: 'Can you ride a scooter around Lake Eola?',
      answer: 'No. The City bans scooters and bikes in Lake Eola Park, and its park rules ban bike riding in city parks except on posted bike trails. Park outside the park and walk the 0.9-mile path.',
    },
    {
      question: 'Do you need a licence or a helmet for an e-scooter in Florida?',
      answer: 'Florida law asks for no driver’s licence, registration or insurance. Riders under 16 must wear a properly fitted and fastened bicycle helmet, and the City of Orlando strongly encourages one for everyone. Florida sets no minimum age, though since July 2025 it lets cities set one.',
    },
  ],
  sources: [
    { title: 'City of Orlando: Bike Share / Scooter Share Program (E-bikes and Scooters)', url: 'https://www.orlando.gov/Initiatives/Bike-Share-Scooter-Share-Program' },
    { title: 'City of Orlando: Park rules', url: 'https://www.orlando.gov/Parks-the-Environment/City-of-Orlando-Park-Rules' },
    { title: 'City of Orlando: Lake Eola Park', url: 'https://www.orlando.gov/Parks-the-Environment/Directory/Lake-Eola-Park' },
    { title: 'Florida Statutes § 316.2128: Micromobility devices, motorized scooters and miniature motorcycles', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0316/Sections/0316.2128.html' },
    { title: 'Florida Statutes § 316.2065: Bicycle regulations', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0316/Sections/0316.2065.html' },
    { title: 'Florida Statutes § 316.003: Definitions', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0316/Sections/0316.003.html' },
    { title: 'Florida Statutes § 316.193: Driving under the influence', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0316/Sections/0316.193.html' },
    { title: 'Florida Statutes § 318.18: Amount of penalties', url: 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0300-0399/0318/Sections/0318.18.html' },
    { title: 'The Florida Senate: CS/CS/CS/SB 462 (2025), Transportation, chapter 2025-149', url: 'https://www.flsenate.gov/Session/Bill/2025/462' },
    { title: 'Veo: Orlando open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/orl/gbfs' },
    { title: 'MetroPlan Orlando: E-Micromobility White Paper, November 2025 (PDF)', url: 'https://metroplanorlando.gov/wp-content/uploads/E-Micromobility_WhitePaper_FINAL_2025-11-4-2.pdf' },
    { title: 'LYNX: Safety notice about electric bikes and scooters on LYNX buses, 7 August 2019', url: 'https://www.golynx.com/news-events/safety-notice-about-electric-bikes-and-scooters-on-lynx-buses.stml' },
    { title: 'SunRail: Rules of conduct', url: 'https://sunrail.com/legal-policies/rules-of-conduct' },
    { title: 'Kia Center: A-Z guide', url: 'https://www.kiacenter.com/a-z-guide' },
    { title: 'Camping World Stadium: A-Z guide', url: 'https://www.campingworldstadium.com/plan-your-visit/a-z-guide' },
    { title: 'UCF Parking Services: Electric scooters', url: 'https://parking.ucf.edu/transportation/electric-scooters/' },
    { title: 'UCF Regulation 6.007: Traffic and parking regulation and enforcement (PDF)', url: 'https://regulations.ucf.edu/wp-content/uploads/sites/22/6.007-Traffic_Parking-FINAL-June25.pdf' },
    { title: 'Valencia College: Policy 6Hx28:10-07.2, Micromobility and non-motorized vehicles on campus, 13 March 2025 (PDF)', url: 'https://valenciacollege.edu/about/board-of-trustees/documents/2025-03-13-policy-adoption-10-07.2-micromobility-and-non-motorized-vehicles-on-campus.pdf' },
    { title: 'Orange County Government: Orange County launches micromobility program, 10 July 2024', url: 'https://newsroom.ocfl.net/media-advisories/press-releases/2024/07/orange-county-launches-micromobility-program/' },
    { title: 'Spectrum News 13: Some I-Drive business owners voice concern about e-scooters, 13 October 2026', url: 'https://mynews13.com/fl/orlando/news/2026/10/13/many-i-drive-business-owners-want-a-ban-on-e-scooters' },
    { title: 'Spectrum News 13: Orange County passes ordinance to regulate e-scooters and e-bikes, 30 September 2026', url: 'https://mynews13.com/fl/orlando/news/2026/09/30/orange-county-passes-ordinance-to-regulate-e-scooters-and-e-bikes' },
    { title: 'Orlando Weekly: Lime rental scooters are finally unleashed upon Orlando, 21 January 2020', url: 'https://www.orlandoweekly.com/news/lime-rental-scooters-are-finally-unleashed-upon-orlando-26678668/' },
    { title: 'Orlando Weekly: Orlando alters e-scooter rules to allow riding on the sidewalk, 9 November 2021', url: 'https://www.orlandoweekly.com/news/orlando-alters-e-scooter-rules-to-allow-riding-on-the-sidewalk-30279746-2/' },
  ],
};

export default guide;
