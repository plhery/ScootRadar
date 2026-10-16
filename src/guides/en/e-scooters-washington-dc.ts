import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-washington-dc',
  topic: 'washington-dc',
  name: 'Scooter rental in Washington, DC',
  title: 'Scooter rental Washington DC 2026: Hopp, Lime, Veo, rules',
  description: 'Scooter rental in Washington, DC: Hopp, Lime and Veo, what a ride costs, the 18+ rule, the downtown sidewalk ban and where to ride on the National Mall.',
  headline: 'Scooter rental in Washington, DC: Hopp, Lime and Veo, what a ride costs, the rules and where you can ride on the National Mall',
  lede: 'Scooter rental in Washington, DC works through three apps with a DDOT permit: Hopp, Lime and Veo. Hopp charges $1 to unlock plus $0.16 a minute and Veo $1 plus $0.46 a minute plus tax (published rates, 16 October 2026); Lime shows its price in the app. You must be 18, shared scooters are capped at 10 mph and you can’t ride on downtown sidewalks. On the National Mall, since 11 September 2026, you keep to the sidewalks along the roads and the trails, at 8 mph at most.',
  published: '2026-10-16',
  updated: '2026-10-16',
  city: 'us:dc:Washington',
  sections: [
    {
      heading: 'Which scooter apps work in Washington, DC?',
      blocks: [
        'DDOT, the District’s transport department, has given permits for dockless scooters and e-bikes to three companies. Spin and Lyft, permit holders in 2024, have gone, and Bird has no permit: its scooters near DC are in Arlington.',
        {
          list: [
            '**Hopp**, Bolt’s scooter brand, in its own Hopp app. DDOT caps it at 2,290 scooters.',
            '**Lime**, in DC since 2017, with up to 5,000 scooters and 3,775 e-bikes, the e-bikes also in the Uber app. **Our map doesn’t show Lime’s DC scooters**: Lime’s DC data feed returns an error, so look for one in the Lime app.',
            '**Veo**, mostly seated, throttle-powered Cosmo and Apollo e-bikes (DDOT counts them as bikes), plus a few hundred stand-up scooters in its open data.',
          ],
        },
        'On the afternoon of 16 October 2026 the [map of Washington](map:us:dc:Washington) showed about 1,300 Hopp and 270 Veo scooters inside the District: what’s on the map, not the fleets. E-bikes aren’t shown. The Washington view also takes in Arlington, Virginia, across the Potomac, and College Park, Maryland, to the north-east. Its Lime and Bird scooters are all but a handful on the Virginia side, and the Veo scooters at $0.32 a minute are College Park’s, not DC’s.',
        'The 2025–2026 permits end on 31 December 2026. DDOT tells applicants for 2027–2028 by 30 November, so the line-up may change in January.',
        '**Visiting?** Get the app before you go. You need no driving licence: DDOT doesn’t make operators check one, as that can shut out foreign visitors. Expect an age check instead, which DDOT says now covers all users. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in DC?',
      blocks: [
        'Hopp and Veo publish their DC rates; Lime shows its price only in the app.',
        {
          table: {
            caption: 'Published rates in Washington, DC on 16 October 2026, with Capital Bikeshare for comparison',
            head: ['Ride', 'Hopp scooter', 'Veo scooter or Cosmo', 'Capital Bikeshare e-bike'],
            rows: [
              ['Unlock', '$1', '$1', '$1'],
              ['Per minute', '$0.16', '$0.46 plus tax', '$0.35'],
              ['10 minutes', '$2.60', '$5.60 plus tax', '$4.50'],
              ['20 minutes', '$4.20', '$10.20 plus tax', '$8.00'],
            ],
          },
        },
        '**Capital Bikeshare**, the docked system, is the main alternative: $1 to unlock plus $0.15 a minute on a classic bike or $0.35 on an e-bike, or $10 for a day pass ([prices](https://capitalbikeshare.com/pricing) on 16 October 2026). Riders of 16 and 17 need a parent’s consent and stick to classic bikes.',
        '**Low-income riders.** Each operator must offer unlimited trips under 30 minutes, with no deposit and a cash option, to people at or below 200% of the federal poverty line. Hopp for All costs $5 a month; Lime Access and Veo Access take proof of benefits such as SNAP.',
      ],
    },
    {
      heading: 'DC scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'The table shows who sets each rule: the DC Code (mainly § 50-2201.03c), DDOT, the National Park Service or the operators. A rental e-scooter isn’t a motor vehicle in DC law, so you need no licence, registration or insurance.',
        {
          table: {
            caption: 'Shared e-scooter rules in Washington, DC on 16 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to rent; nobody under 16 may ride a shared scooter', 'DDOT and the operators’ terms; DC Code'],
              ['Helmet', 'Advised for adults; required under 16, and under 18 on electric devices, DDOT says', 'DC Code; DDOT'],
              ['Speed', 'Capped at 10 mph; 8 mph on the National Mall', 'DDOT regulations; National Park Service'],
              ['Sidewalks', 'Banned in the Central Business District; elsewhere legal but best avoided, and pedestrians come first', 'DC Code; DDOT'],
              ['Bike lanes', 'Use a protected bike lane where there is one and it’s safe', 'DC Code'],
              ['Stop signs', 'Treat as a yield sign; right on red after a full stop', 'DC Code'],
              ['Passengers', 'One rider only', 'DC Code'],
              ['Hands and ears', 'Carry nothing that keeps a hand off the handlebars; no headphones in both ears', 'DC Code'],
              ['Phone', 'Don’t use one while riding', 'Lime’s and Hopp’s terms'],
              ['Alcohol', 'DUI law applies to scooter riders', 'DC Code; federal rules on park land'],
            ],
          },
        },
        { note: '**No riding on sidewalks downtown.** The Central Business District is bounded by Massachusetts Avenue, 23rd Street NW, Constitution Avenue NW, 14th Street, D Street SW/SE and 2nd Street NE/SE. It takes in downtown, Penn Quarter, the White House area, the Mall east of 14th Street and the Capitol.' },
      ],
    },
    {
      heading: 'Can you ride a scooter on the National Mall?',
      blocks: [
        'Yes, on some paths. The Mall, the memorials and the Tidal Basin are National Park Service land, and since 11 September 2026 a federal rule bans e-scooters in national parks except where a park allows them. On the Mall:',
        {
          list: [
            '**Allowed:** the sidewalks along the roads, the multi-use trails, and the North and South Elm Walks beside the Reflecting Pool.',
            '**Speed:** 8 mph at most.',
            '**Not allowed:** anywhere else, the grass included. Even cyclists must walk through the memorials and along the Tidal Basin walks.',
            '**Parking:** next to one of the park’s bike racks.',
          ],
        },
        'East of 14th Street you’re also inside the downtown sidewalk ban. Hopp blocks riding at the main memorials, the Washington Monument and both sides of the Tidal Basin: you can’t start, end or ride through, so walk the last stretch.',
        'The **US Capitol** grounds are off-limits: the Capitol Police Board’s traffic rules ban scooters there, DDOT doesn’t require operators to serve them, and Hopp blocks them.',
        '**Scooter tours** sold by private firms must keep to the same routes, the park’s rules say.',
      ],
    },
    {
      heading: 'Parking, and riding in Georgetown, the Wharf and Navy Yard',
      blocks: [
        'Every shared scooter in DC has a lock, and DC law says you must use it. Lock it upright to a bike rack, signpost or other fixed post, leaving at least 3 feet of sidewalk clear (DDOT asks for 4). Never to a bus stop, parking meter, disabled parking sign or private fence, and keep clear of entrances, ramps and Capital Bikeshare stations. The app wants a photo to end the ride, and the operator can warn, fine or suspend you for bad parking. Report a blocking scooter to 311: the operator must move it within two hours.',
        'Hopp’s zones on 16 October 2026:',
        {
          list: [
            '**Union Station, Audi Field (by Navy Yard) and RFK:** end your ride only in the marked parking.',
            '**The Wharf:** no riding on the waterfront, and 8 mph in a slow zone around it.',
            '**Georgetown:** no riding in Georgetown Waterfront Park, and no riding or 3 mph on Georgetown University’s lawns and plazas.',
            '**Key Bridge and Arlington Memorial Bridge:** no riding, so a Hopp can’t take you into Virginia.',
          ],
        },
        'Lime and Veo show their own zones in their apps.',
      ],
    },
    {
      heading: 'Metro, Union Station and the airports',
      blocks: [
        '**Metro** welcomes bikes and electric scooters on trains at no extra cost if they’re smaller than 80 by 48 by 22 inches; use the elevators and wide fare gates. Its page says nothing about shared scooters, and you pay until the ride ends and the scooter is locked, so end a shared ride near the station.',
        '**Union Station and BWI.** MARC’s Penn Line runs from there to BWI Marshall Rail Station, with a free 24-hour shuttle to the terminal.',
        '**Reagan National (DCA).** Don’t plan to scoot there. E-scooters are banned on the Mount Vernon Trail and the rest of the George Washington Memorial Parkway, Hopp blocks the bridges, and the airport’s bike and scooter racks take no shared equipment. Its Metro station connects to Terminal 2, and a Capital Bikeshare dock sits in Garage 2, level CG, by the trail.',
        '**Dulles (IAD)** is far outside DC: take the Silver Line to the airport’s own Metro station.',
      ],
    },
    {
      heading: 'Scooters across the river in Arlington, Virginia',
      blocks: [
        '[Arlington County](https://www.arlingtonva.us/Government/Programs/Transportation/Scooters-and-Dockless-Bikeshare) issues its own permits, now to Bird, Lime and GCOO. On 16 October 2026 the [Arlington map](map:us:va:Arlington) showed about 470 Lime and 300 Bird scooters on the Virginia side (the Hopp and Veo ones there are in DC); GCOO isn’t on it.',
        'The county’s rules also say 18, but sidewalks and paved trails are allowed, at 6 mph or less when passing people, unless a protected bike lane runs the same way. County code allows 15 mph on streets and trails; the Mount Vernon Trail, federal land, stays off-limits.',
      ],
    },
    {
      heading: 'Cherry blossoms, the Fourth of July, weather and night rides',
      blocks: [
        {
          list: [
            '**The National Cherry Blossom Festival** runs from 20 March to 11 April 2027, with Petalpalooza at Navy Yard on 3 April and the parade on 10 April. The trees ring the Tidal Basin, a Hopp no-ride zone: park by a rack and walk in.',
            '**The Fourth of July** fireworks over the Mall, held every year, fall next on Sunday 4 July 2027. DDOT can order event zones where scooters slow to 6 or 3 mph, stop, or must park in set spots.',
            '**Weather.** DDOT can have scooters taken off the streets in extreme weather, such as winds over 30 mph, snow or ice storms and flood warnings.',
            '**Night.** There’s no curfew: DDOT encourages round-the-clock service and Hopp runs 24/7, but East Potomac Park closes to everyone from 1 to 5 am. DDOT’s draft operator agreement for 2027–2028, open for comment until 2 November 2026, would add in-app sobriety tests from midnight to 4 am.',
          ],
        },
        'The [Washington map](map:us:dc:Washington) shows the nearest Hopp or Veo scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**DC’s shared bikes and scooters have made over 30 million trips since 2019**, and covered more than 11 million miles in 2024 alone, DDOT says.',
            '**Washington was Hopp’s first US city.** Bolt’s scooter brand launched there on 28 January 2025 with over 700 scooters.',
            '**The Park Service’s 2026 rule calls the National Mall and Memorial Parks “filled with e-scooters on a daily basis.”**',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How old do you have to be to ride a Lime scooter in DC?',
      answer: '18: DDOT and all three operators rent only to adults, and DDOT has every app check riders’ ages. DC law also bars anyone under 16 from riding a shared scooter.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in DC?',
      answer: 'Not in the Central Business District, which covers downtown, the White House area and the Capitol. Elsewhere it’s legal, but DDOT asks you to use bike lanes and always give way to pedestrians.',
    },
    {
      question: 'Are scooters allowed on the National Mall?',
      answer: 'Since 11 September 2026, only on the sidewalks along the roads, the multi-use trails and the Elm Walks by the Reflecting Pool, at up to 8 mph. Never on the grass or at the memorials.',
    },
    {
      question: 'Is Bird still in Washington, DC?',
      answer: 'Not in the District: DDOT’s current permits went to Hopp, Lime and Veo. Bird runs across the river in Arlington, Virginia.',
    },
    {
      question: 'Can you ride a scooter to Reagan National Airport?',
      answer: 'Not in practice. E-scooters are banned on the Mount Vernon Trail and the rest of the George Washington Memorial Parkway, and the airport’s racks take no shared equipment. Take Metro or a Capital Bikeshare bike.',
    },
    {
      question: 'How much is a scooter ride in DC?',
      answer: 'Hopp charges $1 plus $0.16 a minute, so 10 minutes costs $2.60; Veo charges $1 plus $0.46 a minute plus tax (published rates, 16 October 2026). Lime shows its price in the app.',
    },
  ],
  sources: [
    { title: 'DDOT: Shared Mobility DC', url: 'https://sharedmobilitydc-dcgis.hub.arcgis.com/' },
    { title: 'DDOT: 2027–2028 shared fleet device permits', url: 'https://sharedmobilitydc-dcgis.hub.arcgis.com/pages/2025-2026-permits' },
    { title: 'DC Code § 50-2201.03c: operation of shared fleet devices', url: 'https://code.dccouncil.gov/us/dc/council/code/sections/50-2201.03c' },
    { title: 'DDOT: Central Business District sidewalk map (PDF)', url: 'https://ddotwiki.atlassian.net/wiki/download/attachments/2069268277/Central%20Business%20District%20-%20No%20Bicycle%20Riding%20Sidewalk%20Map.pdf?api=v2' },
    { title: 'Federal Register: NPS rule on powered micromobility, 12 August 2026', url: 'https://www.federalregister.gov/d/2026-16388' },
    { title: 'National Mall and Memorial Parks: Superintendent’s Compendium, 11 September 2026', url: 'https://www.nps.gov/nama/learn/management/superintendent-s-compendium.htm' },
    { title: 'George Washington Memorial Parkway: Superintendent’s Compendium', url: 'https://www.nps.gov/gwmp/learn/management/superintendent-s-compendium.htm' },
    { title: 'Capitol Police Board: Capitol Grounds traffic regulations (PDF)', url: 'https://www.uscp.gov/sites/evo-subsites/uscp.house.gov/files/evo-media-document/CTR-Amended-February-2025-with-Appendices.pdf' },
    { title: 'Hopp: Washington, DC open data (GBFS)', url: 'https://mds.bolt.eu/gbfs/3/23/gbfs' },
    { title: 'Veo: Washington, DC open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/xdc/gbfs' },
    { title: 'WMATA: bikes and scooters on Metrorail', url: 'https://www.wmata.com/ride/guides/bikes/bikes-on-rail.html' },
    { title: 'Reagan National Airport: biking and walking', url: 'https://www.flyreagan.com/parking-transportation/biking-walking' },
  ],
};

export default guide;
