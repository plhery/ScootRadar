import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-newark',
  topic: 'newark',
  name: 'E-scooters in Newark, New Jersey',
  title: 'E-scooters in Newark, NJ 2026: Bird, Veo, prices, rules',
  description: 'E-scooters in Newark, NJ: where Bird and Veo run, what a ride costs, the sidewalk, speed and parking rules, and why you can’t take one into Penn Station.',
  headline: 'E-scooters in Newark, New Jersey: Bird and Veo, what a ride costs, and where to ride and park',
  lede: 'E-scooters in Newark are rented from Bird and Veo, the two companies holding the City’s NewarkGo permits since 2024. Veo charges $1 to unlock plus $0.45 a minute plus tax (its published rate, 25 October 2026); Bird publishes no price, so check its app. City rules keep shared scooters off most sidewalks, and Bird requires riders to be 18.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'us:nj:Newark',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Newark?',
      blocks: [
        'Newark’s shared scooters and bikes run under NewarkGo, the City’s dockless vehicle programme. It began as a pilot in July 2021 with up to 2,000 scooters and bikes from Bird and Veo, ABC7 reported, and became permanent with a city ordinance adopted on 2 August 2023. At its peak the pilot served up to 3,500 rides a day, and besides downtown its busiest areas were the Ironbound, University Heights and Lincoln Park, Patch reported.',
        {
          list: [
            '**Two permits at most**, one each to two companies chosen by competitive application. Each puts out 500 to 900 vehicles, or up to 1,100 if at least 100 are bikes or e-bikes.',
            '**Bird and Veo.** The City Council approved Veo’s permit on 7 February 2024 and Bird’s on 10 April 2024. Each runs two years and can be renewed for two more; both were running in October 2026.',
            '**Adaptive vehicles.** The 2023 ordinance encourages the operators to offer, where they can, vehicles adapted for people with disabilities, such as recumbent bikes, tricycles and hand cycles.',
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
        '**Low-income plans and cash.** The City’s 2023 ordinance aims to keep rides affordable on a low income and to let people without a credit card or bank account pay in cash, and calls for payment plans. For the pilot, the operators promised discounted rides for qualifying residents and ways to rent without a phone or credit card, Roads & Bridges reported in 2021; residents who qualified took 14,300 rides, city officials told Patch in May 2023. Bird’s Access programme discounts rides for people aged 65 or over, US veterans and people on state or federal assistance, and in some regions lets you top up in cash at a shop.',
      ],
    },
    {
      heading: 'Newark e-scooter rules: age, helmet, speed and sidewalks',
      blocks: [
        'Three levels of rules apply. New Jersey law, since a 2019 act, treats a low-speed electric scooter much like a bicycle. The City’s 2023 NewarkGo ordinance adds limits for shared vehicles, which the operators must spell out in their apps and enforce. The companies add their own.',
        {
          table: {
            caption: 'E-scooter rules in Newark, and who sets them (as published by 25 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'No minimum in state law; Bird requires 18 and checks your age in the app', 'State law, as NJ Highway Traffic Safety sums it up; Bird'],
              ['Licence, insurance, registration', 'None needed', 'N.J.S.A. 39:4-14.16'],
              ['Helmet', 'Required under 17; Bird tells every rider to wear one', 'N.J.S.A. 39:4-10.1, cited in the City’s 2023 ordinance; Bird'],
              ['Speed', 'A scooter must be unable to reach 19 mph', 'N.J.S.A. 39:1-1'],
              ['Where to ride', 'Streets, roadways and bike paths, with cyclists’ rights and duties', 'N.J.S.A. 39:4-14.16'],
              ['Sidewalks', 'Not on a sidewalk, unless the speed limit of the street beside it is over 35 mph. Bird says use the bike lane or the road', 'City ordinance, 2023; Bird'],
              ['Passengers', 'One rider only', 'Bird'],
              ['Alcohol', 'Never ride impaired: Bird has zero tolerance', 'Bird'],
            ],
          },
        },
        'Bird says its scooters detect sidewalk riding and can slow you down or stop the ride. Since July 2026, under a state law signed in January, e-scooter riders hurt in a crash can claim personal injury protection (PIP) from no-fault car insurance, the Jersey Vindicator reported. The law’s new licence rules cover e-bikes, not e-scooters, Rutgers’ Bloustein School notes. During the pilot, Bird and Veo gave away 1,300 free helmets at nearly 40 outreach events, city officials told Patch.',
      ],
    },
    {
      heading: 'Where you can ride a shared scooter in Newark',
      blocks: [
        'NewarkGo’s permits cover only the City’s own right-of-way: the streets, sidewalks, paths and other public ways “within the City of Newark’s control”, as its 2023 ordinance puts it.',
        '**No-ride ground in Bird’s data.** Bird’s zone data marks Port Newark and the industrial streets around Doremus Avenue as areas a scooter won’t even ride through. Ivy Hill Park and the terminals of Newark Liberty International Airport lie outside its service area.',
        'Veo publishes no zone data, so check the map in its app before you set off.',
      ],
    },
    {
      heading: 'Parking a Bird or Veo scooter in Newark',
      blocks: [
        'State law lets you park an e-scooter on a sidewalk as long as it doesn’t get in the way of people walking. For shared scooters, the City adds:',
        {
          list: [
            '**Corrals.** For the 2021 pilot, the City’s Department of Engineering set aside street and sidewalk space downtown and across the city as parking corrals for Bird and Veo bikes and scooters, Roads & Bridges reported in July 2021. The Bird and Veo apps have details of the corrals, Patch reported in 2023.',
            '**Spot checks.** Under the 2023 ordinance, code enforcement staff named by the Department of Engineering check parking and the programme’s other rules, through spot checks, reports and audits.',
            '**Clutter.** In May 2024 the City Council asked the City’s inspectors to step up their monitoring of Veo, for failing to collect discarded scooters as quickly as its contract requires.',
          ],
        },
        'Bird ends each ride with a parking photo, checked by AI, and charges a fee for bad parking.',
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
            '**Many riders have no car.** In Veo’s 2023 rider survey, 61% of its Newark riders didn’t own or have access to one, Patch reported.',
            '**At least 15% of each fleet had to stand in equity zones** during the 2021 pilot: parts of the city with lower incomes and long commutes, beyond a 10-minute walk of rapid rail transit, the Shared-Use Mobility Center reported.',
            '**Your data is covered.** If an operator suffers a data breach, the 2023 ordinance makes it tell the City within 24 hours and riders within seven days, and plan to give them at least three years of credit monitoring.',
            '**Your ride helps pay for streets.** Each operator pays the City $125,000 for its two-year permit and 25 cents a ride. A council resolution of March 2024 set up a trust for these fees, which pays for monitoring the programme, with what’s left going to street improvement projects.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an e-scooter on the sidewalk in Newark?',
      answer: 'As a rule, no. The City’s 2023 ordinance keeps shared-scooter riders off the sidewalk unless the speed limit of the street beside it is over 35 mph. State law lists streets, roadways and bike paths, not sidewalks, and Bird tells riders to use the bike lane or the road.',
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
      answer: 'The City’s 2023 ordinance sets no curfew. Check the Bird or Veo app for any hours of its own.',
    },
    {
      question: 'Can you ride a shared scooter from Newark to the airport or Jersey City?',
      answer: 'No. NewarkGo’s permits cover only the City’s own streets and sidewalks, and the terminals of Newark Liberty International Airport lie outside Bird’s service area. For Jersey City, ride to Newark Penn Station, park outside and take PATH.',
    },
  ],
  sources: [
    { title: 'City of Newark: ordinance 6PSF-f, permanent dockless vehicle programme, adopted 2 August 2023 (Legistar)', url: 'https://newark.legistar.com/LegislationDetail.aspx?ID=6269067&GUID=AB7D38E8-8C1D-4E9E-A2CE-9F1BB2913EEF&FullText=1' },
    { title: 'City of Newark: resolution 24-0185, Bird Rides permit, 10 April 2024 (Legistar)', url: 'https://newark.legistar.com/LegislationDetail.aspx?ID=6611088&GUID=E7910781-5CD9-45C7-87C2-5A3D5211C714&FullText=1' },
    { title: 'City of Newark: resolution 24-0073, Veoride permit, 7 February 2024 (Legistar)', url: 'https://newark.legistar.com/LegislationDetail.aspx?ID=6502879&GUID=DDA25D16-F1FE-4BC7-8A97-4CE8CFB0D985' },
    { title: 'City of Newark Municipal Council: motion 24-1104, monitoring of Veo, 22 May 2024 (Legistar)', url: 'https://newark.legistar.com/LegislationDetail.aspx?ID=6817807&GUID=A265A0DF-AC2E-4084-A4AD-A098F76B3AD7' },
    { title: 'City of Newark: resolution 23-2035, Shared Dockless Vehicles Trust, 20 March 2024 (Legistar)', url: 'https://newark.legistar.com/LegislationDetail.aspx?ID=6573690&GUID=65DBCCF8-AEC7-4EA7-B774-BD064E1E1564&FullText=1' },
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
    { title: 'Roads & Bridges: City of Newark launches shared dockless bike, e-scooter pilot program, 15 July 2021', url: 'https://www.roadsbridges.com/public-transportation/news/10654184/city-of-newark-nj-launches-shared-dockless-bike-e-scooter-pilot-program' },
    { title: 'Shared-Use Mobility Center: NewarkGo pilot launches for dockless bikeshare and e-scooters, 2021', url: 'https://learn.sharedusemobilitycenter.org/overview/newarkgo-pilot-launches-for-dockless-bikeshare-and-e-scooters-newark-nj-2021/' },
    { title: 'Jersey Vindicator: Murphy signs New Jersey e-bike law, 20 January 2026', url: 'https://jerseyvindicator.org/2026/01/20/murphy-signs-sweeping-new-jersey-e-bike-law-expanding-insurance-and-licensing-rules/' },
    { title: 'Rutgers Bloustein School: New Jersey’s new e-bike laws', url: 'https://bloustein.rutgers.edu/njspl-new-jerseys-new-e-bike-laws/' },
  ],
};

export default guide;
