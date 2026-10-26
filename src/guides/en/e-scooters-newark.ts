import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-newark',
  topic: 'newark',
  name: 'E-scooters in Newark, New Jersey',
  title: 'E-scooters in Newark, NJ 2026: Bird, Veo, prices, rules',
  description: 'E-scooters in Newark, NJ: where Bird and Veo run, what a ride costs, the sidewalk, speed and parking rules, and why you can’t take one into Penn Station.',
  headline: 'E-scooters in Newark, New Jersey: Bird and Veo, what a ride costs, and where to ride and park',
  lede: 'E-scooters in Newark are rented from Bird and Veo, the two companies holding the City’s NewarkGo permits since 2024. Veo charges $1 to unlock plus $0.45 a minute plus tax (its published rate, 25 October 2026); Bird publishes no price, so check its app. City rules hold shared scooters to 15 mph and keep them off most sidewalks, and Bird requires riders to be 18.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'us:nj:Newark',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Newark?',
      blocks: [
        'Newark’s shared scooters and bikes run under NewarkGo, the City’s dockless vehicle programme. It began as a pilot in July 2021 with up to 2,000 scooters and bikes from Bird and Veo, ABC7 reported, and became permanent with a city ordinance adopted on 2 August 2023.',
        {
          list: [
            '**Two permits at most**, one each to two companies chosen by competitive application. Each puts out 500 to 900 vehicles, or up to 1,100 if at least 100 are bikes or e-bikes.',
            '**Bird and Veo.** The City Council approved Veo’s permit on 7 February 2024 and Bird’s on 10 April 2024. Each runs two years and can be renewed for two more; both were running in October 2026.',
          ],
        },
        'On the afternoon of Sunday 25 October 2026 the [Newark map](map:us:nj:Newark) showed about 900 scooters, roughly 590 Bird and 320 Veo: what stood there at that moment, not the fleets. That evening, all but a handful stood inside the city: about 360 in the Central Ward, 210 in the East Ward, 110 each in the North and West Wards and 100 in the South Ward, by the Census Bureau’s 2020 ward lines.',
        '**Veo also rents e-bikes.** That evening Veo’s open data listed about 820 vehicles in Newark that it classes as electric bikes, against about 320 stand-up scooters. ScootRadar shows standing e-scooters only, so Veo’s e-bikes aren’t on the map: open the Veo app to find one.',
        '**First ride?** Get the Bird or Veo app and scan the QR code on the handlebars; you need no driving licence. See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a Bird or Veo scooter cost in Newark?',
      blocks: [
        'The City doesn’t set fares, but its 2023 ordinance makes each operator tell the City before raising prices and give riders 30 days’ notice. Veo publishes its Newark rates in its open data; Bird publishes none there, so its app shows the price before you unlock.',
        {
          table: {
            caption: 'Veo’s published prices in Newark, 25 October 2026 (plus tax)',
            head: ['Ride', 'Veo scooter', 'Veo e-bike'],
            rows: [
              ['Unlock', '$1', '$1'],
              ['Per minute', '$0.45', '$0.50'],
              ['10 minutes', '$5.50', '$6'],
              ['20 minutes', '$10', '$11'],
            ],
          },
        },
        '**Low-income plans and cash.** The City’s 2021 rules make each operator offer a low-income plan to anyone who shows proof of low income, such as local, state or federal assistance, and at least one place to pay in cash in each deployment zone. Bird’s Access programme discounts rides for people aged 65 or over, US veterans and people on state or federal assistance, and in some regions lets you top up in cash at a shop.',
      ],
    },
    {
      heading: 'Newark e-scooter rules: age, helmet, speed and sidewalks',
      blocks: [
        'Three levels of rules apply. New Jersey law, since a 2019 act, treats a low-speed electric scooter much like a bicycle. The City’s NewarkGo rules, issued by its Department of Engineering in April 2021, add limits for shared vehicles, which the operators must enforce. The companies add their own.',
        {
          table: {
            caption: 'E-scooter rules in Newark, and who sets them (as published by 25 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'No minimum in state law; Bird requires 18 and checks your age in the app', 'State law, as NJ Highway Traffic Safety sums it up; Bird'],
              ['Licence, insurance, registration', 'None needed', 'N.J.S.A. 39:4-14.16'],
              ['Helmet', 'Required under 17; Bird tells every rider to wear one', 'N.J.S.A. 39:4-10.1, cited in the City’s 2021 rules; Bird'],
              ['Speed', 'A scooter must be unable to reach 19 mph. Shared scooters are held to 15 mph, and to 8 mph around Newark Penn Station and Broad Street Station', 'N.J.S.A. 39:1-1; City rules, 2021'],
              ['Where to ride', 'Streets, roadways and bike paths, with cyclists’ rights and duties', 'N.J.S.A. 39:4-14.16'],
              ['Sidewalks', 'Not on a sidewalk, unless the street beside it is posted at 30 mph or more, and then at 6 mph at most. Bird says use the bike lane or the road', 'City rules, 2021; Bird'],
              ['Passengers', 'One rider only', 'City rules, 2021; Bird'],
              ['Lights', 'A headlight after dusk and before dawn', 'City rules, 2021'],
              ['Hands', 'Carry nothing that stops you keeping both hands on the handlebars', 'City rules, 2021'],
              ['Alcohol', 'Never ride impaired: Bird has zero tolerance', 'Bird'],
            ],
          },
        },
        'Bird says its scooters detect sidewalk riding and can slow you down or stop the ride. Since July 2026, under a state law signed in January, e-scooter riders hurt in a crash can claim personal injury protection (PIP) from no-fault car insurance, the Jersey Vindicator reported. The law’s new licence rules cover e-bikes, not e-scooters, Rutgers’ Bloustein School notes.',
      ],
    },
    {
      heading: 'Where you can ride a shared scooter in Newark',
      blocks: [
        'NewarkGo stops at the city line, which the operators enforce with geofencing. Their permits cover the City’s streets and sidewalks only. To put scooters in county or state parks, plazas, parking lots, private property or transit stations, an operator needs the owner’s permission first.',
        {
          list: [
            '**Slow zones.** Under the City’s 2021 rules, shared scooters drop to 8 mph around Newark Penn Station (between Raymond Plaza West and East, Market Street and Raymond Boulevard) and Broad Street Station (between Orange Street, University Avenue, Martin Luther King Jr. Boulevard and State Street).',
            '**Championship Plaza**, beside the Prudential Center, is a no-ride zone, where scooters slow to walking speed.',
            '**No-ride ground in Bird’s data.** Bird’s zone data marks Port Newark and the industrial streets around Doremus Avenue as areas a scooter won’t even ride through. Ivy Hill Park and the terminals of Newark Liberty International Airport lie outside its service area.',
          ],
        },
        'Veo publishes no zone data, so check the map in its app before you set off.',
      ],
    },
    {
      heading: 'Parking a Bird or Veo scooter in Newark',
      blocks: [
        'State law lets you park an e-scooter on a sidewalk as long as it doesn’t get in the way of people walking. The City’s 2021 rules are stricter for shared scooters:',
        {
          list: [
            '**Corrals and racks first.** Use a corral, a bike-share parking area or a public bike rack where there is one. The rules list corral sites at busy places such as Newark Penn Station, Broad Street Station, the Prudential Center, Military Park, NJPAC, NJIT and Rutgers.',
            '**Otherwise, the furnishing zone.** Park upright on a hard surface in the strip of sidewalk by the curb, where trees, signs and bus shelters stand, and leave at least six feet clear for people walking.',
            '**Never** within 60 feet of a bus stop sign on the bus’s approach side; in a bus, light rail, taxi, loading or disabled parking zone; on a corner or on grass or plants; or blocking a crosswalk, curb ramp, driveway, bike lane, building entrance or station.',
          ],
        },
        'Bird ends each ride with a parking photo, checked by AI, and charges a fee for bad parking. Operators must move a badly parked scooter within two hours of a City notice or six hours of a public report. Report one through the operator’s app or helpline, which the City’s rules make each run in English, Spanish, Portuguese and French.',
      ],
    },
    {
      heading: 'Parks, NJIT and Newark Penn Station',
      blocks: [
        '**Branch Brook Park**, Essex County’s 360 acres in the North Ward, was the first county park opened to the public in the United States and is known for its cherry blossoms. Bird’s zone data lets you ride through most of it but not end a ride there. **Weequahic Park**, 311 acres with an 80-acre lake in the South Ward, has no Bird zone. Essex County Parks’ pages give no scooter rule for either: follow the signs.',
        'Bird’s data also bars ending a ride in Independence Park, Jesse Allen Park, Hayes Park West and Founders Park, across much of the NJIT campus, and in a small area at Newark Penn Station.',
        { note: '**Don’t take a shared scooter into a station or onto a train.** NJ Transit bars Bird and other shared or rented vehicles from all its trains, buses, light rail and property, and PATH’s rules ban riding a scooter anywhere in its system. End the ride outside, clear of entrances and bus stops.' },
        {
          list: [
            '**NJ Transit**, including Newark Light Rail: riding any personal electric vehicle in its stations is banned. Your own e-scooter may travel if it is switched off, folded if it folds and no heavier than 100 lb; folded, it can go on any train, bus or light rail vehicle at any time.',
            '**PATH**, to Jersey City and Manhattan: the Port Authority counts the lithium-ion batteries of e-scooters among the hazardous materials barred from the system, so leave your own scooter at home too.',
          ],
        },
        'The [Newark map](map:us:nj:Newark) shows the nearest Bird or Veo scooter to the station and the walk to it. The map also shows Veo in [New Brunswick](map:us:nj:New Brunswick), and Bird, Lime and Veo in New York City’s [Bronx](map:us:ny:Bronx): see [e-scooters in New York City](guide:new-york).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**About 3.6 million trips** were taken on NewarkGo’s scooters and bikes from August 2021 to September 2026, the City’s data dashboard, run by Ride Report, shows.',
            '**Newark ranked among the top ten US cities for trips per resident** during the pilot, ahead of San Francisco, Patch reported in May 2023.',
            '**15% of each fleet must stand in the City’s equity zones** every day, so scooters reach neighbourhoods beyond downtown.',
            '**Your ride helps pay for streets.** Each operator pays the City $125,000 for its two-year permit and 25 cents a ride. A council resolution of March 2024 set up a trust for these fees, which pays for monitoring the programme, with what’s left going to street improvement projects.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an e-scooter on the sidewalk in Newark?',
      answer: 'As a rule, no. The City’s 2021 rules ban it on shared scooters unless the street beside it is posted at 30 mph or more, and then cap it at 6 mph. State law lists streets, roadways and bike paths, not sidewalks, and Bird tells riders to use the bike lane or the road.',
    },
    {
      question: 'How much is a Veo scooter in Newark?',
      answer: '$1 to unlock plus $0.45 a minute plus tax, Veo’s published rate on 25 October 2026, so a 10-minute ride costs about $5.50 before tax. Veo’s e-bikes cost $0.50 a minute. Bird publishes no Newark price, so check its app before you unlock.',
    },
    {
      question: 'How old do you have to be to ride a Bird scooter in Newark?',
      answer: 'Bird requires riders to be 18 and checks your age in the app. New Jersey law sets no minimum age for e-scooters, so check Veo’s terms in its app. Under state law, riders under 17 must wear a helmet.',
    },
    {
      question: 'Can I take a Bird or Veo scooter on NJ Transit or PATH?',
      answer: 'No. NJ Transit bars shared vehicles such as Bird from all its vehicles and property, and PATH bans riding a scooter in its system. End your ride outside the station, clear of entrances and bus stops.',
    },
    {
      question: 'Is there a curfew for e-scooters in Newark?',
      answer: 'Neither the City’s 2023 ordinance nor its 2021 rules set a curfew: the rules leave hours of operation to each operator’s plan, so the app shows whether you can ride late at night.',
    },
    {
      question: 'Can you ride a shared scooter from Newark to the airport or Jersey City?',
      answer: 'No. NewarkGo is geofenced to the city limits, and the terminals of Newark Liberty International Airport lie outside Bird’s service area. For Jersey City, ride to Newark Penn Station, park outside and take PATH.',
    },
  ],
  sources: [
    { title: 'City of Newark: ordinance 6PSF-f, permanent dockless vehicle programme, adopted 2 August 2023 (PDF)', url: 'https://legistar1.granicus.com/Newark/attachments/3d493bee-8595-4ba5-82c9-8ac0daae5e27.pdf' },
    { title: 'City of Newark: Dockless Vehicle Provider Share System Program Regulations, version 1.0, April 2021 (Word)', url: 'https://legistar1.granicus.com/Newark/attachments/e554998e-ab21-4601-a62a-9ca638b260b9.docx' },
    { title: 'City of Newark: resolution 24-0185, Bird Rides permit, 10 April 2024 (PDF)', url: 'https://legistar1.granicus.com/Newark/attachments/223206a4-5327-4cfd-b144-711d0e81f12c.pdf' },
    { title: 'City of Newark: resolution 24-0073, Veoride permit, 7 February 2024 (Legistar)', url: 'https://webapi.legistar.com/v1/newark/matters/1607562' },
    { title: 'City of Newark: resolution 23-2035, Shared Dockless Vehicles Trust, 20 March 2024 (PDF)', url: 'https://legistar1.granicus.com/Newark/attachments/be3116ce-c71b-40e8-835d-194c8b882932.pdf' },
    { title: 'City of Newark: micromobility dashboard (Ride Report)', url: 'https://public.ridereport.com/newark' },
    { title: 'New Jersey: P.L.2019, c.121, low-speed electric bicycles and scooters (NJ State Library)', url: 'https://repo.njstatelib.org/server/api/core/bitstreams/075ef95b-bf4a-4545-b4af-70d094ccc383/content' },
    { title: 'NJ Division of Highway Traffic Safety: micromobility operating rules and regulations (PDF)', url: 'https://www.nj.gov/oag/hts/downloads/Micromobility-Operating-Rules-and-Regulations.pdf' },
    { title: 'Veo: Newark open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/nwk/gbfs' },
    { title: 'Bird: Newark open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/newark/gbfs.json' },
    { title: 'Bird: safety', url: 'https://bird.co/safety/' },
    { title: 'Bird: Access and cash payment', url: 'https://bird.co/access/' },
    { title: 'NJ Transit: bikes, e-bikes, scooters and more', url: 'https://www.njtransit.com/Services/bikes-and-other-services' },
    { title: 'PATH: rules and regulations, effective 20 December 2015 (PDF)', url: 'https://www.panynj.gov/content/dam/path/documents/path-rules-regulations.pdf' },
    { title: 'Port Authority: PATH reminds riders of its rules on wheeled vehicles, 17 May 2019', url: 'https://www.panynj.gov/port-authority/en/press-room/press-release-archives/2019_press_releases/travel_advisory_-ase-scootersrollintohobokenpathremindsridersofi.html' },
    { title: 'Essex County Parks: Branch Brook Park', url: 'https://essexcountyparks.org/parks/branch-brook-park' },
    { title: 'Essex County Parks: Weequahic Park', url: 'https://essexcountyparks.org/parks/weequahic-park' },
    { title: 'US Census Bureau: TIGERweb, 2020 voting districts', url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Legislative/MapServer/15' },
    { title: 'ABC7: Newark launches NewarkGo pilot, 13 July 2021', url: 'https://abc7ny.com/post/newark-newarkgo-bird-rides-veoride/10884768/' },
    { title: 'Patch: e-scooters and bikeshare are here to stay in Newark, 22 May 2023', url: 'https://patch.com/new-jersey/newarknj/newark-plans-make-shared-e-scooter-bike-program-permanent' },
    { title: 'Jersey Vindicator: Murphy signs New Jersey e-bike law, 20 January 2026', url: 'https://jerseyvindicator.org/2026/01/20/murphy-signs-sweeping-new-jersey-e-bike-law-expanding-insurance-and-licensing-rules/' },
    { title: 'Rutgers Bloustein School: New Jersey’s new e-bike laws', url: 'https://bloustein.rutgers.edu/njspl-new-jerseys-new-e-bike-laws/' },
  ],
};

export default guide;
