import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-austin',
  topic: 'austin',
  name: 'E-scooters in Austin, Texas',
  title: 'E-scooters in Austin 2026: Lime, Bird, rules and parking',
  description: 'E-scooters in Austin: Lime and Bird, what a ride costs, sidewalks and helmets, downtown, the Butler Trail and Capitol bans, UT’s walk zone and CapMetro.',
  headline: 'E-scooters in Austin: Lime and Bird, the rules, downtown and where to park',
  lede: 'E-scooters in Austin come from Lime and Bird, the two companies on the City’s list of permitted operators (updated 1 October 2026); the City says prices are in their apps. No City rule sets riding hours, and you may ride on sidewalks if you do it safely and yield to people walking. Riders under 18 must wear a helmet; scooters are banned from the Butler Hike-and-Bike Trail and the Capitol grounds, and since August 2026 the heart of the UT Austin campus is walk-only.',
  published: '2026-10-28',
  updated: '2026-10-28',
  city: 'us:tx:Austin',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Austin?',
      blocks: [
        'Electric scooter rental in Austin runs on six-month City licences under Chapter 14-9 of the City Code, and on its Director Rules, filed on 8 August 2025.',
        'The City’s list of permitted companies (updated 1 October 2026) names two: **Bird**, allowed up to 3,000 stand-up scooters, and **Lime**, up to 3,700 stand-up scooters and 180 e-bikes. Its Shared Mobility page splits Lime’s 3,880 differently, as 3,205 scooters and 675 seated “gliders”. These are maximums, not what stands on the street. In May 2024 the City stopped licensing new companies, keeping two, and cut the citywide limit from 8,700 to 6,700 scooters, and the downtown limit from 4,500 to 2,250.',
        'At 3:50 p.m. on Wednesday 28 October 2026 the [Austin map](map:us:tx:Austin) showed about 5,800 scooters: roughly 3,300 Lime and 2,500 Bird, both as last counted, so some may have moved since. A snapshot, not the fleets. The map has no outline for Austin: its total is what the two companies’ Austin areas hold, and those also take in Sunset Valley and, for Lime, Rollingwood, small cities of their own where Austin’s City Code doesn’t apply.',
        'For Bird the map shows each scooter’s position, charge and range; for Lime, position and charge. Scooters on a ride aren’t shown, and the map draws no zones in Austin: the apps have the final word. **First ride?** See [how to rent an e-scooter](guide:how-to-rent).',
        '**Not everything is on the map.** ScootRadar shows e-scooters only, Lime’s seated gliders among them: Lime’s e-bikes aren’t on it, nor is CapMetro Bikeshare (see below).',
      ],
    },
    {
      heading: 'How much does a Lime or Bird scooter cost in Austin?',
      blocks: [
        'The City doesn’t publish the fares: “All service fees, including promotions, costs per minute, trip and unlock fees can be found in provider-specific applications,” its page says. Neither company publishes an Austin price we could check, so look in the app before you unlock.',
        'The Director Rules ask each company for an affordable programme: riders with an income at or below 80% of Austin’s median household income pay no more than half the usual price. The City’s page names them **Lime Access** and **Bird’s Community Pricing**. The rules also ask them to offer rentals without a smartphone and cash payment: ask Lime (888-546-3345) or Bird (866-205-2442).',
        'Bird’s US rental agreement (updated 30 August 2024) says riders must be at least 18. The City’s rules set no rental age; Lime’s app gives its own.',
      ],
    },
    {
      heading: 'Austin scooter rules: sidewalks, helmets, speed and phones',
      blocks: [
        'Texas sets few rules. Chapter 551 of the Transportation Code lets a “motor-assisted scooter” use streets posted at 35 mph or less, bike paths and sidewalks, applies the bicycle rules to it, and lets cities ban it from streets and sidewalks. Austin didn’t ban sidewalks: in May 2019 the City Council rewrote Chapter 12-2 of the City Code, “Micro-Mobility Devices and Bicycles”, to allow them.',
        {
          table: {
            caption: 'E-scooter rules in Austin and who sets them (City Code sections as amended in May 2019; the City’s page and Director Rules as of 28 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Sidewalks', 'Allowed “in a reasonable and prudent manner”; yield to people on sidewalks and in crosswalks, and don’t hinder anyone with limited mobility', 'City Code § 12-2-13; Texas Transportation Code § 551.352(d)'],
              ['Streets', 'With the traffic, never against it in a bike lane; only on streets posted at 35 mph or less, though you may cross faster ones at an intersection', 'Texas Transportation Code § 551.352(a); City Code § 12-2-12'],
              ['Helmet', 'Required under 18; Texas’s scooter law requires none', 'City Code § 12-2-31; City page'],
              ['Age', 'No rental age in the City’s rules; Bird says 18', 'Bird’s rental agreement'],
              ['Speed', 'A shared scooter’s motor assists up to 15 mph; slow zones, where set, show in the app', 'Director Rules § 2.K'],
              ['Phone', 'Don’t hold or use one while riding; hands-free calls and a mounted map are allowed', 'City Code § 12-1-34'],
              ['Passengers', 'One person per scooter', 'City Code § 12-2-34'],
              ['Alcohol', 'Ride sober', 'City page'],
              ['Hours', 'None: no City rule stops rentals at night', 'Director Rules (none set)'],
            ],
          },
        },
        'Breaking Chapter 12-2 is a Class C misdemeanour; the 2019 ordinance set the fine at up to $20 for a first conviction and $40 after.',
      ],
    },
    {
      heading: 'Scooters in downtown Austin: Sixth Street, Rainey Street and Congress Avenue',
      blocks: [
        'In May 2024 the City cut the number of shared scooters allowed downtown (the Downtown Austin Project Coordination Zone) from 4,500 to 2,250, and gave the companies staging areas to bring them back to, its December 2024 memo says.',
        {
          list: [
            '**Sixth Street and Rainey Street.** Among the May 2024 changes the City listed a 10 mph top speed, down from 15, from 10 p.m. to 5 a.m. in the main entertainment districts. In December 2024 it said it was still collecting data on the Rainey Street and East Sixth Street slow zones. We found no later City source saying they still apply: the app shows any slow zone.',
            '**Congress Avenue.** In 2024 the City installed parking boxes along Congress Avenue and began working with the companies on “force park” technology, which limits ending a ride outside designated spots.',
          ],
        },
        'For Austin’s larger events, such as the ACL Festival, the companies usually ask the City for corralling space, the City said in 2024: check the app for where to park.',
      ],
    },
    {
      heading: 'Parking a Lime or Bird scooter in Austin',
      blocks: [
        'The City’s page asks you to keep at least 3 feet of sidewalk clear, to park off bridges and away from creeks and rivers, and to stay off private property. The best places are its **parking boxes** (tape or stencilled outlines on the ground) and **micromobility corrals** (bike racks with markings for scooters and bikes).',
        'The City Code (§ 12-2-15, as amended in 2019) bans parking a scooter:',
        {
          list: [
            'where it blocks people walking or traffic, or in a car parking space, unless marked for scooters;',
            'so that it blocks a transit stop, shelter or platform, or on or near railroad tracks;',
            'on an accessibility ramp, or anywhere it restricts people with disabilities;',
            'in loading or valet zones, or blocking a hydrant, a doorway or a driveway, or on private property without consent.',
          ],
        },
        'The companies may not place scooters within 30 feet of a bus stop or on curb corners, and must clear any left outside their areas by 6 a.m. To report a scooter in the way, call 3-1-1 or use its app.',
      ],
    },
    {
      heading: 'Lady Bird Lake, Zilker Park and the Capitol',
      blocks: [
        {
          list: [
            '**The Butler Hike-and-Bike Trail.** The trail around Lady Bird Lake is City parkland, and the City’s parks rules (City Code §§ 8-1-31 and 8-1-32) govern motor vehicles on it. The Trail Conservancy, the nonprofit that works on the trail, puts it plainly: “Motorized vehicles, including electric scooters and one-wheeled skateboards, are not permitted”; e-bikes may ride under 10 mph. You may cross the lake on the Pfluger Pedestrian Bridge, the South 1st Street bridge and the Ann W. Richards Congress Avenue Bridge.',
            '**Zilker Park and other parks.** The Director Rules bar the companies from letting customers ride in parks unless a separate agreement allows it, and the City’s page says scooters aren’t allowed in certain park areas and trails.',
            '**The Capitol.** The State Preservation Board, not the City, runs the grounds: “Motorized scooters, excluding Americans with Disabilities Act (ADA) approved devices, will no longer be allowed to operate within the Capitol Grounds effective December 31, 2018.” The City’s Director Rules also keep the companies off State-owned land.',
          ],
        },
      ],
    },
    {
      heading: 'Scooters at UT Austin: the Pedestrian Friendly Zone',
      blocks: [
        'The University of Texas sets its own rules on campus. Since 24 August 2026 its **Pedestrian Friendly Zone**, from San Jacinto Boulevard to Guadalupe Street and from 21st to 24th Street, is walk-only for e-scooters and e-bikes: “Upon entering the zone, Lime and Bird electric scooters will power off, bringing the motor to a safe, gradual stop.” Locking is disabled there: walk it out before you end the ride. San Jacinto, Guadalupe and 21st Street stay open to scooters.',
        'Elsewhere on campus, UT’s Parking and Transportation Services says scooters ride only where bicycles may, at up to 15 mph, or 5 mph in geofenced zones. Park only at bike racks or in the scooter areas on its Scooter Map; a badly parked scooter may be impounded, for a $75 fee, or $150 during University events, for blocking ADA access, doors, ramps or stairways, or on Speedway or the Main Mall. Access may be limited on football game days.',
      ],
    },
    {
      heading: 'CapMetro, bike share and the airport',
      blocks: [
        {
          list: [
            '**CapMetro buses and trains.** “Folding bikes/scooters may be brought on board if they don’t block the aisle”, CapMetro’s rider guide says. A shared scooter doesn’t fold: end the ride and park it before you board.',
            '**CapMetro Bikeshare.** CapMetro’s docked e-assist bikes are returning in phases after a suspension, fully by the end of 2026, it expects. A single trip costs $2.50 plus $0.25 a minute, a day pass $10 (unlimited 30-minute rides), and riders must be 18 (as of 28 October 2026).',
            '**Austin-Bergstrom airport (AUS).** Neither Lime’s nor Bird’s area reaches the terminal. CapMetro’s Route 20 runs to downtown in about 35 minutes, every 15 to 30 minutes, for $1.25, from the stop outside baggage claim on the lower level.',
          ],
        },
        'Elsewhere in Texas, see [e-scooters in Dallas](guide:dallas) or [San Antonio](guide:san-antonio). Down the road, the [San Marcos map](map:us:tx:San Marcos) shows Lime around Texas State University.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Austin rode 5.7 million scooter trips in 2019**, the peak year in the City’s open data, which ran from 2018 to 2022.',
            '**Fewer scooters, busier ones.** After the 2024 cuts, each Austin scooter made 1.37 trips a day from April to September, up from 1.04 a year earlier, the City reported.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an e-scooter on the sidewalk in Austin?',
      answer: 'Yes. Unlike Dallas and San Antonio, Austin’s City Code allows it “in a reasonable and prudent manner”. Yield to people walking, and keep off the Butler Trail, the Capitol grounds and UT’s walk-only zone.',
    },
    {
      question: 'How much does an electric scooter rental cost in Austin?',
      answer: 'The City says fares are in the companies’ apps, and neither Lime nor Bird publishes an Austin price we could check, so look in the app before you unlock. Riders on lower incomes can apply for Lime Access or Bird’s Community Pricing, at no more than half the usual price.',
    },
    {
      question: 'Do you need a helmet to ride a scooter in Austin?',
      answer: 'Only if you are under 18, under the City Code. Texas law requires none, but the City recommends one.',
    },
    {
      question: 'Can you ride a Lime or Bird scooter at night in Austin?',
      answer: 'Yes. The City sets no riding hours. In 2024 it slowed scooters to 10 mph from 10 p.m. to 5 a.m. on Sixth Street and Rainey Street, and no later City source says whether that still applies: the app shows any slow zone.',
    },
    {
      question: 'Can you ride scooters on the UT Austin campus?',
      answer: 'Only outside the core. Since 24 August 2026 the area from San Jacinto Boulevard to Guadalupe Street and 21st to 24th Street is walk-only, and Lime and Bird scooters power off there. Elsewhere, park at bike racks or marked scooter areas.',
    },
  ],
  sources: [
    { title: 'City of Austin: Shared Mobility', url: 'https://www.austintexas.gov/transportation-public-works/divisions/shared-mobility' },
    { title: 'City of Austin: Shared Mobility Regulations and License Application', url: 'https://www.austintexas.gov/transportation-public-works/shared-mobility-regulations-and-license-application' },
    { title: 'City of Austin: Director Rules for dockless transportation systems, filed 8 August 2025 (PDF)', url: 'https://austin.widen.net/content/hw2nuackkh/original/20250808_FINAL_Dockless_Director_Rules.pdf' },
    { title: 'City of Austin: Ordinance 20190523-059, micro-mobility devices on sidewalks and roadways (PDF)', url: 'https://services.austintexas.gov/edims/document.cfm?id=322524' },
    { title: 'City of Austin: Six-month update on micromobility program changes, 13 December 2024 (PDF)', url: 'https://services.austintexas.gov/edims/pio/document.cfm?id=443121' },
    { title: 'City of Austin: Permitted ground transportation service providers', url: 'https://www.austintexas.gov/transportation-public-works/permitted-ground-transportation-service-providers' },
    { title: 'Texas Transportation Code, Chapter 551', url: 'https://statutes.capitol.texas.gov/Docs/TN/htm/TN.551.htm' },
    { title: 'The Trail Conservancy: Trail rules and FAQs', url: 'https://thetrailconservancy.org/visit/faqs/' },
    { title: 'Texas State Preservation Board: Motorized Scooter Policy (PDF)', url: 'https://www.tspb.texas.gov/spb/policies/doc/Motorized_Scooters_Policy.pdf' },
    { title: 'UT Austin Parking and Transportation: Pedestrian Friendly Zone', url: 'https://parking.utexas.edu/transportation/mobility' },
    { title: 'UT Austin Parking and Transportation: Electric scooters', url: 'https://parking.utexas.edu/transportation/electric-scooters' },
    { title: 'CapMetro: Get ready to ride (PDF)', url: 'https://www.capmetro.org/docs/default-source/plan-your-trip-docs/destination-schedule-book-docs/get-ready-to-ride.pdf?sfvrsn=25d7d659_18' },
    { title: 'CapMetro: Bikeshare', url: 'https://www.capmetro.org/bikeshare' },
    { title: 'CapMetro: Airport service', url: 'https://www.capmetro.org/airport' },
    { title: 'Bird: Rental agreement, United States', url: 'https://bird.co/rental-agreements/united-states/' },
    { title: 'City of Austin open data: Shared Micromobility Vehicle Trips, 2018–2022', url: 'https://data.austintexas.gov/Transportation-and-Mobility/Shared-Micromobility-Vehicle-Trips-2018-2022-/7d8e-dm7r' },
  ],
};

export default guide;
