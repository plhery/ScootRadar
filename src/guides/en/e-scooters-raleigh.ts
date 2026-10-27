import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-raleigh',
  topic: 'raleigh',
  name: 'E-scooters in Raleigh, North Carolina',
  title: 'E-scooters in Raleigh, NC 2026: Spin, Lime, rules',
  description: 'E-scooters in Raleigh, NC: Spin and Lime, the NC State price, the 11 p.m. stop, no sidewalks, downtown parking corrals, Dix Park, greenways and GoRaleigh.',
  headline: 'E-scooters in Raleigh, North Carolina: Spin and Lime, the 11 p.m. stop, and where to ride and park',
  lede: 'E-scooters in Raleigh come from Spin and Lime, the two companies with City agreements (September 2026). NC State says Spin’s scooters are available to ride from 6 a.m. to 11 p.m. A 2018 City ordinance keeps scooters off sidewalks and greenway trails, and downtown you end your ride in a painted corral. NC State lists Spin’s price for rides that start on campus; elsewhere, check the app.',
  published: '2026-10-27',
  updated: '2026-10-27',
  city: 'us:nc:Raleigh',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Raleigh?',
      blocks: [
        'Electric scooter rental in Raleigh runs under agreements with the City. A City Manager’s Update of 4 September 2026 names the two companies: **Lime** and **Spin**. NC State’s student paper, the Technician, reported on 11 September 2026 that Spin is the university’s contracted provider, while Lime works through its agreement with the City. A new shared micromobility agreement, from a request for proposals issued in March 2026, is on track to start by 1 January 2027, the City says, so the line-up may change.',
        'At 12:29 p.m. on Monday 26 October 2026 the [Raleigh map](map:us:nc:Raleigh) showed 577 Spin scooters as they stood at that moment; Lime’s count at 10:05 p.m. on Sunday 25 October was 566. Each is a snapshot, not a fleet. At 10:33 p.m. on 26 October every one of Spin’s 554 available scooters stood inside the city of Raleigh, by the Census Bureau’s boundaries.',
        'For Spin the map shows each scooter’s position, charge and range, and Spin’s zones (see below); for Lime, position and charge. Scooters on a ride aren’t shown. **First ride?** See [how to rent an e-scooter](guide:how-to-rent).',
        '**Bikes aren’t on the map.** ScootRadar shows standing e-scooters only. Spin and Lime also rent e-bikes in Raleigh: the Downtown Raleigh Alliance describes the City’s dockless bikeshare pilot as more than 200 electric-assist bikes with Spin and Lime, and Spin’s open data listed 133 available e-bikes at 10:33 p.m. on 26 October.',
      ],
    },
    {
      heading: 'How much does a Spin or Lime scooter cost in Raleigh?',
      blocks: [
        'NC State’s Transportation department lists the “NC State Rate” for Spin rides that start on campus, and on 11 September 2026 the Technician quoted a university planner giving the same $1 to unlock and 30 cents a minute. Spin’s open data held no Raleigh price on 27 October 2026, so for rides that start off campus, and for Lime, check the rate in the app before you unlock.',
        {
          table: {
            caption: 'Spin’s NC State Rate, for rides that start on NC State’s campus (NC State Transportation; page updated 12 August 2022, prices “subject to change”)',
            head: ['Option', 'Price'],
            rows: [
              ['Pay as you go', '$1 to unlock + $0.30 a minute'],
              ['Spin Access', '$0.50 to unlock + $0.10 a minute'],
              ['Monthly pass', '$5.99 a month, then $0 to unlock + $0.30 a minute'],
              ['24-hour pass', '$14.99'],
            ],
          },
        },
        '**Spin Access** is Spin’s programme for people without a smartphone, mobile location services or a credit card, with discounted fares for those who qualify, NC State’s page says.',
      ],
    },
    {
      heading: 'Raleigh scooter rules: hours, sidewalks, greenways and age',
      blocks: [
        'This guide doesn’t summarise North Carolina state law. The City’s riding rules below are as CBS 17 and ABC11 reported the ordinance the City Council passed on 20 November 2018, which moved scooters off sidewalks and into bike lanes; the parking rules are from the City’s own report of September 2026.',
        {
          table: {
            caption: 'E-scooter rules in Raleigh, and who sets them (as published by 27 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Hours', 'Spin: 6 a.m. to 11 p.m., seven days a week; check Lime’s in its app', 'NC State Transportation, for Spin'],
              ['Where to ride', 'In bike lanes, not on City sidewalks, greenway trails or multi-use paths. Yield to people on foot, and when entering or crossing a street', 'City ordinance, 20 November 2018, as CBS 17 and ABC11 reported it'],
              ['Sidewalk fine', 'Up to $50; ABC11 reported in 2019 that the citation carries no driver’s licence or insurance points', 'City ordinance, as reported'],
              ['Greenway trails', '“Motorized vehicles are prohibited on trails”; trails are open dawn to dusk, with a 10 mph speed limit', 'City greenway map, March 2018 (Parks, Recreation and Cultural Resources)'],
              ['Age', '18 to ride a Spin; check Lime’s terms in its app', 'Spin’s terms'],
              ['Helmet', 'Spin and NC State tell every rider to wear one', 'Spin; NC State Transportation'],
              ['Speed', 'Spin’s scooters at NC State top out at 15 mph', 'NC State Transportation'],
              ['Parking', 'Upright and out of the pedestrian path; downtown, in a painted corral if one is within 320 feet', 'City agreements with Lime and Spin'],
              ['Parking fines', 'Two warnings, then $15 for the third and fourth violations, then account review and possible suspension, issued in the app', 'City policy since January 2025, applied by the companies'],
            ],
          },
        },
        { note: '**Ride between 6 a.m. and 11 p.m.** NC State’s Spin page says “All scooters and e-bikes are available to ride from 6 a.m. to 11 p.m., seven days a week.” Open the map between 11 p.m. and 6 a.m. and it tells you Raleigh’s scooters can’t be rented until 6 a.m.' },
        'Riding drunk is a risk too: a former Wake County prosecutor told ABC11 in August 2019 that several people had already been charged with DWI on scooters in Wake County.',
      ],
    },
    {
      heading: 'Parking a scooter in Raleigh: corrals and the zones on the map',
      blocks: [
        'Under the City’s agreements, a scooter must be parked upright, out of the pedestrian path, and in a designated amenity or planting zone, or in a mandatory corral where there is one. The company must move a badly parked one within two hours of being told; report it through AskRaleigh, the City’s request portal, or in the company’s app.',
        {
          list: [
            '**Corrals downtown.** After a pilot on Glenwood South, the City is painting more than 70 mandatory corrals at the busiest downtown intersections by the end of 2026. Riders ending a trip within 320 feet (100 metres) of a painted corral must use it. CBS 17 reported on 16 September 2026 that the apps won’t let you end a ride there unless you are in one, and redirect you to one.',
            '**Elsewhere,** CBS 17 reported, you may park anywhere that doesn’t block a sidewalk or an ADA ramp, and never on private property.',
            '**Fines come from the companies.** Since January 2025 the third and fourth parking violations each cost $15, after two warnings, and a fifth brings an account review and possible suspension.',
          ],
        },
        'Spin published 74 no-ride and 41 no-parking zones in its open data on 27 October 2026, which the map draws at street zoom. Matched to Wake County’s parcel map, two no-parking zones cover the downtown core around Fayetteville Street and Glenwood South along Glenwood Avenue: there, a ride ends only in a corral, and the corrals themselves aren’t in Spin’s data. Another covers Dorothea Dix Park. No-ride zones take in Capitol Square, Moore Square, Nash Square, Pullen Park, land around Lake Johnson, Meredith College, William Peace University and parts of NC State’s Centennial Campus. The map doesn’t show Lime’s zones: check its app.',
      ],
    },
    {
      heading: 'Scooters at NC State and Raleigh’s other campuses',
      blocks: [
        {
          list: [
            '**NC State.** Spin deploys on North, Central, South and Centennial campuses, its Transportation department says, and shows the no-ride zones in its app. At 10:33 p.m. on 26 October, 263 of Spin’s 554 available scooters in Raleigh stood on NC State’s campus, by the Census Bureau’s boundaries.',
            '**Campus sidewalks.** NC State’s Parking and Transportation Ordinances, last revised in April 2026, make every sidewalk, pathway, plaza and walkway a pedestrian safety zone, where e-scooter riders “must either ride at the walking pace of nearby pedestrians or dismount”. They also bar e-scooters from the greenway, and no one may ride inside a building.',
            '**Spin or Lime?** The Technician found that Lime restricts parking between Main and Centennial campuses much more than Spin, and that Lime’s area doesn’t reach the Centennial Biomedical Campus, where Spin has a separate area.',
            '**Other colleges.** Spin’s no-ride zones cover most of the land of Meredith College, William Peace University and Saint Augustine’s University, on Wake County’s parcel map; a no-parking zone covers part of Shaw University’s.',
          ],
        },
      ],
    },
    {
      heading: 'Dix Park, the greenways and the Capitol',
      blocks: [
        'The **Capital Area Greenway** trails are off limits: the City’s greenway map (March 2018) says “Motorized vehicles are prohibited on trails”, and the 2018 ordinance, as reported, kept scooters off greenway trails and multi-use paths. Trails are open dawn to dusk.',
        '**Dorothea Dix Park** covers 308 acres; the City of Raleigh owns and runs it, and it is open from dawn until dusk, its website says. Spin’s data makes it a no-parking zone, so you can’t end a Spin ride there, and the Rocky Branch Greenway that runs past its Grove is a trail.',
        'Downtown, **Capitol Square**, **Moore Square** and **Nash Square**, all State land on Wake County’s parcel map, are mostly no-ride zones in Spin’s data. So is the City’s **Pullen Park**, west of downtown.',
      ],
    },
    {
      heading: 'GoRaleigh, GoTriangle and RDU airport',
      blocks: [
        {
          list: [
            '**GoRaleigh buses.** Its mobility device policy bars “Shared fleet e-scooters, such as Lime or Spin”, and shared e-bikes, from its buses and their bike racks. A personal e-scooter may come aboard only folded.',
            '**Raleigh-Durham International Airport (RDU)** lies outside the city, in unincorporated Wake County, by the Census Bureau’s boundaries. At 10:33 p.m. on 26 October the nearest available Spin scooter stood about 7 miles away. GoTriangle’s RDU Shuttle runs from the Regional Transit Center, Monday to Saturday from 6 a.m. to 6 p.m.; its Route 100 runs direct from downtown Raleigh after 6:30 p.m. on those days and all day on Sunday.',
          ],
        },
        'Durham has scooters of its own: see the [Durham map](map:us:nc:Durham). Further north, [e-scooters in Richmond](guide:richmond) covers another city with Spin and Lime and a night stop.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**A first in the state.** In January 2025 Raleigh became the first city in North Carolina with a citywide escalating parking violation policy for shared scooter and bike riders, the City says.',
            '**Parking as public art.** Eight local artists were chosen to paint the new downtown corrals, which will add 12,000 square feet of public art.',
            '**The pilot worked.** The City reports over 72% parking compliance from the Glenwood South corrals, the model for the 70 new ones.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What time do scooters stop in Raleigh?',
      answer: 'At 11 p.m. for Spin: NC State’s Spin page says scooters and e-bikes are available to ride from 6 a.m. to 11 p.m., seven days a week. Check Lime’s hours in its app.',
    },
    {
      question: 'Can you ride a scooter on the sidewalk in Raleigh?',
      answer: 'No. The City Council’s 2018 ordinance, as CBS 17 and ABC11 reported it, keeps scooters off City sidewalks, greenway trails and multi-use paths and allows them in bike lanes, with a fine of up to $50. On NC State’s campus, ride at walking pace on sidewalks and plazas or get off.',
    },
    {
      question: 'How much does a Spin scooter cost at NC State?',
      answer: 'For a ride that starts on campus, $1 to unlock and $0.30 a minute, NC State says; Spin Access riders pay $0.50 and $0.10 a minute. Off campus, and for Lime, check the price in the app.',
    },
    {
      question: 'Where do you park a scooter in downtown Raleigh?',
      answer: 'In a painted corral if one is within 320 feet; the apps steer you to one. Elsewhere, park upright, out of the walkway, and never on private property. Repeat violations bring $15 fines.',
    },
    {
      question: 'Are there Lime scooters in Raleigh?',
      answer: 'Yes: Lime and Spin both have agreements with the City. On NC State’s campus Spin is the university’s provider, and the Technician found Lime’s parking rules there stricter.',
    },
    {
      question: 'Can you take a scooter on a GoRaleigh bus?',
      answer: 'Not a shared one: GoRaleigh bars Lime and Spin scooters and e-bikes from its buses and bike racks. A personal e-scooter may come aboard folded.',
    },
  ],
  sources: [
    { title: 'City of Raleigh: Manager’s Update 2026-35, Shared Micromobility Responsibilities & Parking Compliance, 4 September 2026 (PDF)', url: 'https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR13/managers-update-2026-35.pdf' },
    { title: 'City of Raleigh: Capital Area Greenway map, March 2018 (PDF)', url: 'https://cityofraleigh0drupal.blob.core.usgovcloudapi.net/drupal-prod/COR24/raleigh-greenway-map.pdf' },
    { title: 'NC State Transportation: Spin E-Scooters & E-Bikes', url: 'https://transportation.ncsu.edu/spin-e-scooters-e-bikes/' },
    { title: 'NC State: POL 07.60.01, Parking and Transportation Ordinances', url: 'https://policies.ncsu.edu/policy/pol-07-60-01/' },
    { title: 'Technician: Park it here? E-bike and scooter rules differ across NC State, 11 September 2026', url: 'https://technicianonline.com/162505/news/park-it-here-e-bike-and-scooter-rules-differ-across-nc-state/' },
    { title: 'CBS 17: Raleigh approves ordinance aimed to get scooters off sidewalks, 20 November 2018', url: 'https://www.cbs17.com/news/local-news/wake-county-news/raleigh-approves-ordinance-aimed-to-get-scooters-off-sidewalks/' },
    { title: 'ABC11: Raleigh City Council allows motorized scooters in bike lanes, 21 November 2018', url: 'https://abc11.com/post/raleigh-city-council-allows-motorized-scooters-in-bike-lanes/4728140/' },
    { title: 'ABC11: riding scooters while drunk, 14 August 2019', url: 'https://abc11.com/post/riding-scooters-while-drunk-a-loophole-in-the-law/5467574/' },
    { title: 'CBS 17: Raleigh implements mandatory parking zones for bikes, scooters, 16 September 2026', url: 'https://www.cbs17.com/news/driving-you-crazy/whats-driving-you-crazy-raleigh-implements-mandatory-parking-zones-for-bike-scooters/' },
    { title: 'Spin: Raleigh open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/raleigh/gbfs' },
    { title: 'Spin: NC State open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/nc_state/gbfs' },
    { title: 'Spin: terms of use (US)', url: 'https://www.spin.app/policies/terms-us' },
    { title: 'Spin: safety', url: 'https://www.spin.app/safety' },
    { title: 'Downtown Raleigh Alliance: alternative modes', url: 'https://downtownraleigh.org/getting-around/alternative-modes' },
    { title: 'Dix Park', url: 'https://dixpark.org/' },
    { title: 'Dix Park: visit', url: 'https://dixpark.org/visit/' },
    { title: 'GoRaleigh: Bikes on Buses and Mobility Devices', url: 'https://goraleigh.org/bikes-on-buses-and-mobility-devices/' },
    { title: 'GoTriangle: RDU Shuttle', url: 'https://gotriangle.org/rdu-shuttle/' },
    { title: 'Wake County: parcels (GIS)', url: 'https://maps.wake.gov/arcgis/rest/services/Property/Parcels/MapServer/0' },
    { title: 'US Census Bureau: TIGERweb boundaries', url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb' },
  ],
};

export default guide;
