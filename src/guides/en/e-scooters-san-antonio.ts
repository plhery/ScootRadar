import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-san-antonio',
  topic: 'san-antonio',
  name: 'E-scooters in San Antonio, Texas',
  title: 'E-scooters in San Antonio 2026: Bird, Veo, prices, rules',
  description: 'E-scooters in San Antonio: Bird and Veo, what a ride costs, the Texas and City rules, the River Walk and Alamo bans, VIA buses and the airport.',
  headline: 'E-scooters in San Antonio: Bird and Veo, what a ride costs, the rules and where you can’t ride',
  lede: 'E-scooters in San Antonio come from two companies, Bird and Veo, each allowed up to 1,000 vehicles under City contracts since October 2023; the City sought new bids in 2026, so the line-up may change. On 22 October 2026 a Veo cost $1 to unlock and $0.43 a minute plus tax, stand-up or seated; Bird publishes no prices, so check its app. The City Code sets the riding age at 16, bans riding on sidewalks and keeps scooters off the River Walk, Alamo Plaza, parks and trails.',
  published: '2026-10-22',
  updated: '2026-10-22',
  city: 'us:tx:San Antonio',
  sections: [
    {
      heading: 'Which e-scooter apps work in San Antonio?',
      blocks: [
        'The City’s Downtown Operations department runs the programme. Its contracts with Bird and Veo began on 1 October 2023 and cap each company at 1,000 vehicles, 2,000 in all; in November 2025 the City Council extended them by a year, to 30 September 2026, City staff said. In May 2026 the City sought new bids (RFP 26-077) from two operators with 1,000 vehicles each. We found no new contract on a Council agenda by 21 October, and both companies were still running on 22 October 2026: check the City’s dockless vehicles page for any change.',
        {
          list: [
            '**Bird**: stand-up scooters in the Bird app, under contract with the City since January 2020.',
            '**Veo**: stand-up and seated scooters, the Astro and the Cosmo, in the Veo app. It replaced Razor in October 2023.',
            '**Lime** pulled out in January 2020, days before its City contract began, after Lyft and Jump had gone.',
          ],
        },
        'At 14:25 on 17 October 2026 the [San Antonio map](map:us:tx:San Antonio) showed about 850 Bird and 295 Veo scooters: what was on the map at that moment, not the fleets. The map shows stand-up scooters only, so Veo’s seated scooters, which its open data lists as bicycles, aren’t on it; before dawn on 22 October Veo listed about 640 seated scooters and 310 stand-up ones.',
        '**Visiting?** Install the Bird or Veo app and add a payment card before you set out. If something goes wrong, the City lists both companies’ help lines: Bird 1-855-237-9944, Veo 1-855-836-2256. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in San Antonio?',
      blocks: [
        'On 22 October 2026 Veo’s open data gave one rate for its stand-up and seated scooters: $1 to unlock and $0.43 a minute, plus tax. Bird’s gives none, nor does its website, so check the Bird app before you unlock.',
        {
          table: {
            caption: 'Veo scooter prices in San Antonio on 22 October 2026, before tax',
            head: ['Ride', 'Veo, stand-up or seated'],
            rows: [
              ['Unlock', '$1'],
              ['Rate', '$0.43 a minute'],
              ['10 minutes', '$5.30'],
              ['20 minutes', '$9.60'],
              ['30 minutes', '$13.90'],
            ],
          },
        },
        'Both companies have cheaper plans for eligible riders, which the City listed on its dockless vehicles page on 22 October 2026:',
        {
          list: [
            '**Bird Community Pricing**: half price on the unlock and per-minute fees for people on low incomes, seniors, Pell Grant recipients, and staff of approved nonprofits.',
            '**Bird Access**: two free rides a day of up to 30 minutes each, paying only a $0.50 unlock fee.',
            '**Veo Access**: $5 a month for no unlock fees and 30 free minutes a day, then $0.20 a minute.',
          ],
        },
      ],
    },
    {
      heading: 'San Antonio scooter rules: age, helmets, sidewalks and speed',
      blocks: [
        'Texas sets few rules. Chapter 551 of the Transportation Code lets a “motor-assisted scooter” use streets posted at 35 mph or less, sidewalks and bike paths, applies the bicycle rules to it, and lets cities ban it from streets and sidewalks. San Antonio adds Article XIX of its City Code, and breaking it is a Class C misdemeanour with a fine of up to $500 for each offence.',
        {
          table: {
            caption: 'Shared e-scooter rules in San Antonio on 22 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '16 to ride; Bird’s terms say renters must be over 18; Texas sets no age', 'City Code § 19-661(a)(6); Bird’s terms'],
              ['Helmet', 'Encouraged, not required', 'City Code § 19-661(a)(9)'],
              ['Sidewalks', 'Banned. Texas would allow them, but lets cities say no', 'City Code § 19-661(a)(4); Texas Transportation Code § 551.352(b) and (d)'],
              ['Where to ride', 'In the bike lane when there is one; otherwise on streets posted at 35 mph or less, crossing faster roads only at intersections', 'City Code § 19-661(a)(2) and (3); Texas Transportation Code § 551.352(a)'],
              ['Pedestrians', 'Yield to them at all times', 'City Code § 19-661(a)(1)'],
              ['Passengers', 'None: one person per scooter', 'City Code § 19-661(a)(7)'],
              ['Phones', 'No using a phone or other wireless device while riding', 'City Code § 19-661(a)(8)'],
              ['Lights and bell', 'At night, a white front light visible from 500 feet and a red rear reflector or light; a working bell or horn at all times', 'City Code § 19-661(d)'],
              ['Parks, plazas and trails', 'No riding, though you may ride on the public streets that cross them', 'City Code § 19-661(a)(5)'],
              ['Alcohol and drugs', 'Never ride under the influence', 'Bird’s riding rules'],
              ['Speed', 'No top speed in Texas law or the City Code; in 2023 the City said geofencing would slow scooters near crowds', 'The companies, under their City contracts'],
              ['Night', 'No curfew since the City Council lifted it in December 2019', 'City Council'],
            ],
          },
        },
      ],
    },
    {
      heading: 'River Walk, the Alamo and Hemisfair: where you can’t ride',
      blocks: [
        {
          list: [
            '**The River Walk.** The City Code bans riding on it, the Museum Reach and Mission Reach included, and on the city’s trails and creekways: ride on the streets instead. On 22 October 2026 Bird’s open data marked stretches of the River Walk as no-parking zones.',
            '**Alamo Plaza and the old plazas.** The City Code names Alamo Plaza, La Villita, Main Plaza and Market Square; you may ride on the public streets that cross them. On 22 October 2026 Bird’s data also marked Travis Park and Plaza de Armas, among others, as no-parking.',
            '**Hemisfair.** Its conservancy bans scooters on the sidewalks of its three parks: ride on the district’s streets.',
            '**The Pearl.** “Pearl is scooter-free”, its FAQ says; its 2019 ban covered the heart of the complex, between West Josephine Street, Avenue A, Newell Avenue and East Elmira Street. Bird’s data showed no zone there on 22 October 2026, so the app may not warn you: park outside and walk in.',
            '**The missions.** On 22 October 2026 Mission Concepción lay just outside Bird’s area and the others further out: before dawn that day the nearest scooter was about 2 miles from Mission San José. San Antonio BCycle’s e-bikes, which run around the clock, link the Alamo with all four missions; a one-hour pass costs $15.',
            '**Where the areas end.** On 22 October 2026 Bird’s open data showed a main area from about a mile north of Trinity University to just short of Mission Concepción, plus a separate one around UTSA’s main campus. Veo publishes no zones, but almost all its scooters were in the same central area. The [live map](map:us:tx:San Antonio) shows where scooters are now.',
          ],
        },
        'Check the app’s map before you set off: you can’t end a ride in a no-parking zone.',
      ],
    },
    {
      heading: 'Parking a scooter in San Antonio',
      blocks: [
        'The City Code bans parking in the street except in spaces the City marks with paint, decals or signs. On the sidewalk, park upright, leave at least 3 feet clear, and keep away from:',
        {
          list: [
            'bus stops: the 15 feet behind the bus-stop pole, across the whole sidewalk;',
            'loading zones, disabled parking and building entrances: 8 feet;',
            'curb ramps, entryways and driveways: 5 feet;',
            'benches, pay stations and transit signs: 4 feet;',
            'trails, creekways, plazas and parks, the River Walk included, and bike-share docks.',
          ],
        },
        'A company must move a scooter parked in a banned spot or blocking an ADA ramp within an hour of being told, and fix other faults within two hours; after that the City may impound it and charge the company $100. Bird asks for a photo when you park and says blocking access “is subject to fees”. Report a scooter in the way to 311 (210-207-6000).',
      ],
    },
    {
      heading: 'VIA buses, the airport (SAT) and event days',
      blocks: [
        '**VIA** bans motorised scooters aboard its vehicles, and its bike racks don’t take rental or app-based e-bikes, so end your ride before you board. A bus ride costs $1.30 and a Day Pass $2.75.',
        '**San Antonio International Airport (SAT)** lay outside Bird’s area on 22 October 2026, and before dawn that day the nearest scooter was about 4 miles away. VIA’s Route 5 serves the airport about hourly from 5 am to 10:30 pm, and Express Route 7 reaches downtown in about 20 minutes, every 30 minutes on weekdays until 7 pm, for $2.60. The stop is on the lower level outside baggage claim at Terminal B.',
        '**Event days.** The Alamodome, where UTSA plays its home football games, lay inside Bird’s area but in a no-parking zone on 22 October 2026, so leave the scooter a few streets away; the City may also order scooters cleared for special events. The Frost Bank Center, on the East Side, lay outside Bird’s area, and the nearest scooters were about 1.4 miles away that morning.',
        '**Students.** On 22 October 2026 we found no Veo scooters in Bird’s separate area around UTSA’s main campus, and Bird’s data marked Trinity University’s campus as no-parking.',
      ],
    },
    {
      heading: 'Can you ride a scooter at night in San Antonio?',
      blocks: [
        'Yes. The City banned scooter rides between 11 pm and 6 am from February 2019 until December 2019, when the City Council lifted the curfew, at first for a trial, with the contracts that began in January 2020. Neither the City Code nor the City’s dockless vehicles page sets night hours today; at 4 am on 22 October 2026 Veo listed about 950 vehicles available, seated ones included, and Bird about 860 scooters.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Riders took 5,176,583 trips** from 1 January 2020 to 18 October 2026, the City’s dashboard says, and almost 90% of them started in Council District 1, which takes in downtown.',
            '**The river swallowed dozens of scooters.** When the City drained the downtown channel in January 2020, crews pulled “dozens” of sunken scooters from the riverbed.',
            '**San Antonio once had about 16,000 permitted scooters** from seven companies, in 2019. Today’s cap is 2,000.',
            '**In Texas law a scooter can have a seat.** The Transportation Code defines a motor-assisted scooter as having a deck to stand or sit on, which is why Veo’s seated Cosmo counts as one.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which scooter companies operate in San Antonio?',
      answer: 'Bird and Veo, each allowed up to 1,000 vehicles under City contracts since October 2023; the City sought new bids in 2026. At 14:25 on 17 October 2026 the map showed about 850 Bird and 295 Veo stand-up scooters.',
    },
    {
      question: 'How much is a Veo scooter in San Antonio?',
      answer: 'On 22 October 2026 Veo’s open data gave $1 to unlock and $0.43 a minute, plus tax, stand-up or seated: $5.30 for 10 minutes. Bird publishes no San Antonio prices, so check its app.',
    },
    {
      question: 'Can you ride a scooter on the River Walk?',
      answer: 'No. The City Code bans riding on the River Walk, in Alamo Plaza, La Villita, Main Plaza and Market Square, and on trails and in parks. Ride on the streets instead.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in San Antonio?',
      answer: 'No. Texas would allow it, but the City Code bans it. Use the bike lane, or a street posted at 35 mph or less.',
    },
    {
      question: 'How old do you have to be, and do you need a helmet?',
      answer: 'The City Code sets the riding age at 16, and Bird’s terms say renters must be over 18. Helmets are encouraged but not required.',
    },
    {
      question: 'Can you take a scooter on a VIA bus?',
      answer: 'No. VIA bans motorised scooters aboard its vehicles, so end your ride before you board.',
    },
  ],
  sources: [
    { title: 'City of San Antonio: Dockless Vehicles', url: 'https://www.sa.gov/Directory/Departments/DTOPS/Permits-Policies/Dockless-Vehicles' },
    { title: 'San Antonio City Code, Chapter 19, Article XIX: Motor-assisted scooters, electric bicycles and bicycles equipped with GPS', url: 'https://library.municode.com/tx/san_antonio/codes/code_of_ordinances?nodeId=PTIICO_CH19MOVETR_ARTXIXMOSISCELBIBIEQGP' },
    { title: 'City of San Antonio: City Council A Session, 13 November 2025, item 15', url: 'https://sanantoniotx.new.swagit.com/events/43093' },
    { title: 'City of San Antonio: RFP 26-077, Dockless Vehicle Operations on City Right-of-Way (PDF), May 2026', url: 'https://webapp1.sanantonio.gov/RFPFiles/RFP_6189_202605130658060.pdf' },
    { title: 'City of San Antonio: Audit and Accountability Committee, 6 May 2026 (video)', url: 'https://sanantoniotx.new.swagit.com/videos/386063' },
    { title: 'City of San Antonio: Micromobility public dashboard', url: 'https://app.populus.ai/san_antonio/public/routes' },
    { title: 'Texas Transportation Code, Chapter 551', url: 'https://statutes.capitol.texas.gov/Docs/TN/htm/TN.551.htm' },
    { title: 'Bird: Terms of service', url: 'https://www.bird.co/terms/' },
    { title: 'Bird: How to ride', url: 'https://www.bird.co/how/' },
    { title: 'Bird: Community and Access', url: 'https://www.bird.co/access/' },
    { title: 'Bird: San Antonio open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/san-antonio/gbfs.json' },
    { title: 'Veo: San Antonio open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/stx/gbfs' },
    { title: 'VIA Metropolitan Transit: How to ride', url: 'https://www.viainfo.net/how-to-ride/' },
    { title: 'VIA Metropolitan Transit: Fares', url: 'https://www.viainfo.net/rates/' },
    { title: 'VIA Metropolitan Transit: Park and Airport', url: 'https://www.viainfo.net/parkandairport/' },
    { title: 'Hemisfair: Frequently asked questions', url: 'https://hemisfair.org/visit/frequently-asked-questions/' },
    { title: 'Pearl: FAQ', url: 'https://atpearl.com/about/faq/' },
    { title: 'Alamodome', url: 'https://www.alamodome.com/' },
    { title: 'San Antonio BCycle: Pricing', url: 'https://sanantonio.bcycle.com/pricing/' },
    { title: 'San Antonio Report: Citing pedestrian safety, the Pearl bans scooters, 29 January 2019', url: 'https://sanantonioreport.org/citing-pedestrian-safety-the-pearl-bans-scooters/' },
    { title: 'TPR: San Antonio to lift ban on late-night scooter riding, 9 December 2019', url: 'https://www.tpr.org/technology-entrepreneurship/2019-12-09/san-antonio-to-lift-ban-on-late-night-scooter-riding-despite-safety-progress' },
    { title: 'San Antonio Report: Bird, Lime, Razor get exclusive contracts to operate in San Antonio, 12 December 2019', url: 'https://sanantonioreport.org/bird-lime-razor-get-exclusive-contracts-to-operate-in-san-antonio/' },
    { title: 'San Antonio Report: Snails, tilapia, scooters pulled from drained San Antonio River, 6 January 2020', url: 'https://sanantonioreport.org/snails-tilapia-scooters-pulled-from-drained-san-antonio-river/' },
    { title: 'San Antonio Report: Days before start of City contract, Lime says it’s leaving San Antonio, 9 January 2020', url: 'https://sanantonioreport.org/days-before-start-of-city-contract-lime-scooters-says-its-leaving-san-antonio/' },
    { title: 'San Antonio Report: Bird, Razor last companies standing as scooter craze dies down, 20 January 2020', url: 'https://sanantonioreport.org/bird-razor-last-companies-standing-as-scooter-craze-fades/' },
    { title: 'San Antonio Report: San Antonio re-ups with Bird, swaps Razor for long-ride scooters, 21 August 2023', url: 'https://sanantonioreport.org/san-antonio-escooter-contracts-veo-bird/' },
    { title: 'San Antonio Current: New electric scooter company Veo rolls into San Antonio, 3 October 2023', url: 'https://www.sacurrent.com/news/new-electric-scooter-company-veo-rolls-into-san-antonio-32772124/' },
  ],
};

export default guide;
