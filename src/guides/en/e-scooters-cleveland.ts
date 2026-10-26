import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-cleveland',
  topic: 'cleveland',
  name: 'E-scooters in Cleveland',
  title: 'E-scooters in Cleveland 2026: Bird, Veo, prices, rules',
  description: 'E-scooters in Cleveland: Bird and Veo, what a ride costs, the City rules, hub-only parking downtown and in University Circle, the Towpath and the RTA.',
  headline: 'E-scooters in Cleveland: Bird and Veo, what a ride costs, the rules and where to park',
  lede: 'E-scooters in Cleveland come from Bird and Veo, the two companies the City lists as permit holders (26 October 2026). A Veo costs $1 to unlock and $0.39 a minute plus tax; Bird publishes no price, so check its app. You must be 18 to ride a Bird, the City tells riders to keep off the sidewalk, and downtown, in Ohio City and in University Circle you must end your ride at a hub.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'us:oh:Cleveland',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Cleveland?',
      blocks: [
        'Electric scooter rental in Cleveland runs on three-year City permits under Chapter 517 of the Codified Ordinances and on vendor rules the City last published on 27 March 2026; the current permit cycle began in 2024. Its Shared Mobility page names two companies: **Bird** (silver and blue or black scooters, blue e-bikes) and **Veo** (black scooters and e-bikes with blue accents).',
        'At 11:41 a.m. on Monday 26 October 2026 the [Cleveland map](map:us:oh:Cleveland) showed about 540 scooters, roughly 330 Bird and 210 Veo: what stood there at that moment, not the fleets. It counted another 23 Veo scooters in [Cleveland Heights](map:us:oh:Cleveland Heights), 15 in South Euclid and 9 in University Heights, which it treats as towns of their own. Matched to the Census Bureau’s boundaries a quarter of an hour later, all but three of the Birds stood in the city of Cleveland; neither company had any in Lakewood.',
        'For Bird the map shows each scooter’s position, charge and range, and its zones (see below); for Veo, position and range. Scooters on a ride aren’t shown. **First ride?** See [how to rent an e-scooter](guide:how-to-rent).',
        '**Bikes aren’t on the map.** ScootRadar shows standing e-scooters only. That morning the two companies’ open data also listed about 320 Veo and 140 Bird e-bikes in and around Cleveland: open their apps to find one. The City’s page names no other bike share.',
      ],
    },
    {
      heading: 'How much does a Bird or Veo scooter cost in Cleveland?',
      blocks: [
        'On 26 October 2026 Veo’s open data gave one rate for scooters and e-bikes: $1 to unlock and $0.39 a minute, plus tax. Bird’s held none, so check the Bird app before you unlock. The City’s page says most rides cost $1 to start and then $0.40 to $0.50 a minute.',
        {
          table: {
            caption: 'What a Veo ride costs in Cleveland, before tax (Veo’s published rate, 26 October 2026)',
            head: ['Ride', 'Veo'],
            rows: [
              ['10 minutes', '$4.90'],
              ['20 minutes', '$8.80'],
              ['30 minutes', '$12.70'],
            ],
          },
        },
        'Both companies offer cheaper rides and ways to ride without a smartphone or credit card, the City says. Bird gives 70% off to riders on low incomes, Pell Grant students, seniors and veterans, and 50% off rides that start in its “equity areas”. **Veo Access**, free for people on SNAP, Medicaid, a discounted utility bill or a low income, halves the per-minute fee.',
      ],
    },
    {
      heading: 'Cleveland scooter rules: hours, speed, sidewalks and age',
      blocks: [
        'Cleveland’s riding rules are in Chapter 473 of its Codified Ordinances, which treats e-scooters as “mobility devices”, like bicycles; riding on a banned sidewalk or parking badly is a minor misdemeanour. The vendor rules set what the companies must do.',
        {
          table: {
            caption: 'E-scooter rules in Cleveland, and who sets them (as published on 26 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to ride a Bird, checked in the app; Cleveland State’s campus rules say 18 too. Check Veo’s terms in its app', 'Bird; Cleveland State'],
              ['Hours', 'Rentals allowed 24 hours a day under the rules in force since 3 April 2026; the City’s page, read on 26 October 2026, still says 3 a.m. to midnight. Check the app', 'Vendor rules, VIII(c); City page'],
              ['Speed', '15 mph at most on a scooter; shared e-bikes are held to 20 mph', 'City Code § 473.02(b)(6); vendor rules, VIII(d)'],
              ['Fast streets', 'The Code says you should not ride on streets posted over 35 mph, unless in a bike lane or on a shared-use path', 'City Code § 473.02(b)(5)'],
              ['Sidewalks', 'Banned in business districts and where signs say so; the City asks riders to stay off all sidewalks', 'City Code § 473.09; City page'],
              ['Passengers', 'One rider, standing on the footboard', 'City Code § 473.02(b); vendor rules'],
              ['Lights', 'A white front lamp and a red rear lamp and reflector at the times the Code requires lights', 'City Code § 473.05'],
              ['Helmet', 'The City Code requires none: its helmet rule covers motorcycles. The companies must urge you to wear one and give you one on request; the City hands them out free', 'City Code § 473.02(c); vendor rules, VIII(e) and (g); City page'],
              ['Phones, headphones, alcohol', 'The companies must warn you: no headphones, no phone, no riding after drugs or alcohol', 'Vendor rules, VIII(e)'],
            ],
          },
        },
        { note: '**Downtown, ride in the street.** The City Code bans sidewalk riding in business districts.' },
        '**Statewide rules are only proposed.** On 7 October 2026 13abc reported a bill just introduced in the Ohio Senate, not yet in the House. It would require helmets, bar under-14s from riding e-bikes or scooters and under-18s from using a rented one, and charge owners $25 to register a device. It isn’t law.',
      ],
    },
    {
      heading: 'Parking a Bird or Veo scooter in Cleveland: hubs only in Zone 1',
      blocks: [
        'The City splits Cleveland in two. **Zone 1** covers its planning areas of Downtown, Ohio City and University Circle, where “devices are required to be in either a physical or geofenced hub if not ridden”: end the ride at a hub the app shows. In **Zone 2**, the rest of the city, you may also park in the tree lawn or the furniture zone of the sidewalk, and the companies must reward riders who end at a hub.',
        'In 2025 the City installed more than 70 hubs, each with blue bike racks and a sign; other good spots are marked with two parallel white lines on the sidewalk. Wherever you park:',
        {
          list: [
            '**Upright, off the roadway** and not within 3 feet of the curb.',
            '**Clear of** hydrants (6 feet), driveways (5 feet), ADA curb ramps (3 feet), bus stops and shelters (5 feet), emergency exits and fire standpipes.',
            '**At least 5 feet of clear sidewalk** must be left for people walking; the City’s page asks for 6.',
          ],
        },
        'Bird’s open data held 18 no-ride and 34 no-parking zones on 26 October 2026, and the map draws them at street zoom. Downtown is one large no-parking zone with about 180 small spots where a ride may end, several near Public Square; about 3.9 km² around Case Western Reserve’s campus and 2.8 km² around the West Side Market are no-parking too. Thirteen small no-ride zones lie west of Public Square, between West 3rd Street and Old River Road; others cover the block between Carnegie Avenue, Ontario Street and East 9th Street, and parts of Case Western Reserve’s and John Carroll’s campuses. Veo publishes no zones, so check its app.',
        'A company must fix a badly parked device within two hours of being told. Call Bird on 1-866-205-2442 or Veo on 1-855-836-2256, or report it in the app.',
      ],
    },
    {
      heading: 'Scooters in University Circle, at Case Western and Cleveland State',
      blocks: [
        '**University Circle** is in Zone 1, so a ride there ends at a hub the app shows.',
        {
          list: [
            '**Case Western Reserve.** Since autumn 2023 no bikes or scooters may be ridden on the Quad, and Mather Quad joined it in autumn 2025: walk your wheels to a bike rack. The university says the City’s scooters “will throttle down” as they approach both quads. Park at or next to a CWRU bike rack, never in a building, and don’t charge a scooter on campus.',
            '**Cleveland State.** Its 2019 scooter rules, still linked in October 2026, keep scooters off sidewalks, lawns, the Student Center Plaza and garages; riders must be 18, with no passengers or headphones, and park at a bike rack or marked scooter zone. At 11:58 a.m. on 26 October about 18 scooters stood on its campus.',
          ],
        },
      ],
    },
    {
      heading: 'The Towpath, Public Square, the RTA and the airport',
      blocks: [
        {
          list: [
            '**Towpath Trail.** Canalway Partners, whose work supports the trail’s management, says electric scooters are allowed on the Towpath, as are Class 1 and 2 e-bikes in Cuyahoga County and in Cuyahoga Valley National Park, and that speeds should not exceed 15 mph.',
            '**Public Square.** Its own site gives park hours of 5 a.m. to midnight and states no scooter rule.',
            '**RTA trains and buses.** GCRTA lets a 100% electric e-bike or scooter onto its trains, in the area for ADA mobility devices, bikes and strollers, without blocking the aisle; passengers with disabilities come first. Its bus policy covers only folded e-bikes. End a shared ride before you board.',
            '**Cleveland Hopkins International Airport.** The airport says RTA’s Red Line reaches Tower City downtown in under 30 minutes, every 15 minutes for most of the day. Bird’s service area includes the airport, but at 11:58 a.m. on 26 October the nearest scooter, a Veo, stood about 8 km away.',
          ],
        },
      ],
    },
    {
      heading: 'Cleveland Heights, South Euclid and University Heights',
      blocks: [
        'Under a Cuyahoga County agreement, suburbs can opt in and are paid $0.15 for each trip that starts in them, with Cleveland alone issuing permits, Cleveland Heights’ 2021 ordinance says. Veo rents scooters in Cleveland Heights, South Euclid and University Heights; Bird’s data gives it service areas there and in East Cleveland too, though few of its scooters stood in them.',
        'Cleveland Heights’ 2021 ordinance lets you ride on any public sidewalk unless a sign forbids it, yielding to people on foot; the limit is 15 mph, and streets posted over 35 mph are off limits unless there is a bike lane or shared-use path.',
        'Elsewhere in Ohio, see [e-scooters in Columbus](guide:columbus); in Michigan, [e-scooters in Detroit](guide:detroit).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Every device must show its ID number in braille**, under the City’s rules.',
            '**Snow clears them away.** After a snowfall of more than two inches, the companies must take every device off the street and sidewalk within 24 hours.',
            '**The curfew has gone.** Scooters ran until 9 p.m. before January 2023, then 5 a.m. to 11 p.m.; the July 2024 rules barred only midnight to 3 a.m., and the 2026 rules allow rentals around the clock.',
            '**Five companies started it.** The programme began in August 2019 with five companies; riders had made more than 494,000 trips by June 2021, News 5 reported.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How much does an electric scooter rental cost in Cleveland?',
      answer: 'On 26 October 2026 Veo’s open data gave $1 to unlock and $0.39 a minute, plus tax: $4.90 for 10 minutes. Bird publishes no Cleveland price, so check its app.',
    },
    {
      question: 'Can you ride a scooter on the sidewalk in Cleveland?',
      answer: 'Not in a business district or where signs forbid it: the City Code makes that a minor misdemeanour, and the City asks riders to keep off sidewalks everywhere. Cleveland Heights’ 2021 ordinance allows sidewalk riding unless a sign says otherwise.',
    },
    {
      question: 'Can you ride a Bird or Veo scooter at night in Cleveland?',
      answer: 'The vendor rules in force since 3 April 2026 let companies rent scooters 24 hours a day, but the City’s Shared Mobility page, read on 26 October 2026, still says 3 a.m. to midnight, so check the app.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Cleveland?',
      answer: '18 to ride a Bird, which checks your age in the app; check Veo’s terms in its app. An Ohio Senate bill reported by 13abc on 7 October 2026 would bar under-18s from rented devices statewide, but it is only a proposal.',
    },
    {
      question: 'Where can you park a scooter in University Circle?',
      answer: 'Only at a hub the app shows: University Circle is in the City’s Zone 1, with Downtown and Ohio City. On Case Western Reserve’s campus, walk across the Quad and Mather Quad and park at a bike rack.',
    },
  ],
  sources: [
    { title: 'City of Cleveland: Shared Mobility', url: 'https://www.clevelandohio.gov/transportation-mobility/shared-mobility' },
    { title: 'The City Record, 27 March 2026: shared mobility vendor rules, pp. 140–152 (PDF)', url: 'https://www.clevelandcitycouncil.gov/sites/default/files/2026-03/City%20Record%203-27-26.pdf' },
    { title: 'The City Record, 5 July 2024: vendor rules, pp. 30–41 (PDF)', url: 'https://www.clevelandcitycouncil.gov/sites/default/files/2024-07/CITY%20RECORD%207-5-2024.pdf' },
    { title: 'Cleveland Ordinance 464-2019, mobility devices, 3 June 2019 (PDF)', url: 'https://cityofcleveland.legistar1.com/cityofcleveland/attachments/d9744004-212a-4be7-89d8-3f234aa05e45.pdf' },
    { title: 'Cleveland Ordinance 396-2020, 3 June 2020 (PDF)', url: 'https://cityofcleveland.legistar.com/View.ashx?M=F&ID=8577713&GUID=5054855A-D447-49A2-80AB-F5C7F9C6BA1E' },
    { title: 'City of Cleveland: E-scooter hours extended, 18 January 2023', url: 'https://www.clevelandohio.gov/news/e-scooter-hours-extended-city-cleveland-beginning-next-friday' },
    { title: 'Cleveland Heights Ordinance 103-2021, 2 August 2021 (PDF)', url: 'https://clevelandheights.gov/DocumentCenter/View/9564/Ordinance-103-2021' },
    { title: 'Bird: Cleveland open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/cleveland/gbfs.json' },
    { title: 'Veo: Cleveland open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/cle/gbfs' },
    { title: 'Bird: safety', url: 'https://bird.co/safety/' },
    { title: 'Case Western Reserve: transportation', url: 'https://case.edu/sustainability/campus/transportation' },
    { title: 'Case Western Reserve: e-scooters and e-bikes', url: 'https://case.edu/sustainability/campus/transportation/e-scooters-e-bikes' },
    { title: 'Cleveland State University: scooters on CSU campus, 2019 (PDF)', url: 'https://www.csuohio.edu/sites/default/files/Scooters_on_CSU_Campus.pdf' },
    { title: 'Canalway Partners: the Towpath Trail', url: 'https://www.canalwaypartners.com/discover/the-towpath-trail-connectors' },
    { title: 'Public Square: about the park', url: 'https://www.clevelandpublicsquare.com/about-the-park' },
    { title: 'GCRTA: Bike and Ride', url: 'https://www.riderta.com/bikenride' },
    { title: 'Cleveland Hopkins Airport: public transportation', url: 'https://www.clevelandairport.com/parking-transportation/ground-transportation/public-transportation' },
    { title: 'US Census Bureau: TIGERweb boundaries', url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb' },
    { title: 'News 5 Cleveland: City renews contracts for e-scooters and e-bikes, 22 June 2021', url: 'https://www.news5cleveland.com/news/local-news/cleveland-metro/city-of-cleveland-renews-contracts-for-e-scooters-and-e-bikes' },
    { title: '13abc: Ohio lawmakers propose statewide e-bike regulations, 7 October 2026', url: 'https://www.13abc.com/2026/10/08/ohio-lawmakers-propose-statewide-e-bike-regulations/' },
  ],
};

export default guide;
