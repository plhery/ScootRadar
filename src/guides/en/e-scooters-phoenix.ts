import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-phoenix',
  topic: 'phoenix',
  name: 'E-scooters in Phoenix, Arizona',
  title: 'E-scooters in Phoenix 2026: Spin, Lime, rules and parking',
  description: 'E-scooters in Phoenix: Spin and Lime, what a ride costs, the age and sidewalk rules, downtown parking, ASU, the canals, light rail and Sky Harbor.',
  headline: 'E-scooters in Phoenix: Spin and Lime, prices, the rules, and where to ride and park',
  lede: 'E-scooters in Phoenix come from Spin and Lime, the two companies with City contracts, which run to January 2028. Neither publishes a Phoenix price in its open data, so the app shows it before you unlock, and both rent only to riders 18 or over, although City Code lets you ride from 16. Phoenix bans scooters from sidewalks, and downtown you must end your ride in a designated parking spot.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'us:az:Phoenix',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Phoenix?',
      blocks: [
        'Phoenix’s shared scooters run under City contracts: the Council picked two companies on 14 December 2022, and the City’s page still names both:',
        {
          list: [
            '**Spin**: in the Spin app. Since May 2024 Bird Rides, Inc. has held its contract.',
            '**Lime**: in the Lime app.',
          ],
        },
        'Both contracts cover e-scooters, e-bikes, pedal bikes and adaptive vehicles. At 4:14 pm on Friday 23 October 2026 the [Phoenix map](map:us:az:Phoenix) showed about 400 Spin scooters: what was on the map at that moment, not the fleet. It shows no Lime, because Lime publishes no open data for Phoenix: open the Lime app to find its scooters there.',
        '**Visiting?** Install the Spin or Lime app and add a way to pay before you set out. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Phoenix?',
      blocks: [
        'Neither company publishes a Phoenix price in its open data and the City lists no fares, so check the app before you unlock. Two discounts are worth knowing:',
        {
          list: [
            '**30% off** for people who get federal, state or local support, such as Medicaid, SNAP, Social Security, Housing Authority help or a Reduced Transit Pass, the City says. Apply with Lime or Spin.',
            '**Spin Access** offers cheaper rides to people on limited incomes, and lets people with an Access code unlock by text message, without a smartphone.',
          ],
        },
        'Spin’s US terms ask you to end every ride inside the service zone, or Spin may charge a pick-up fee of up to $100.',
      ],
    },
    {
      heading: 'Phoenix e-scooter rules: age, sidewalks, speed and helmets',
      blocks: [
        'Arizona law gives an e-scooter rider the rights and duties of a cyclist, asks for no licence, registration or insurance, sets no age or helmet rule, and lets cities add their own. Phoenix has: City Code bans e-scooters from sidewalks and, after a Council vote on 18 December 2024, lets anyone 16 or over ride on public streets, down from 18. Spin and Lime kept 18 for renters, so the change mostly matters for scooters people own.',
        {
          table: {
            caption: 'E-scooter rules in Phoenix in October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '16 or over to ride on public streets; 18 or over to rent a Spin or a Lime', 'City Code § 36-308; Spin and Lime'],
              ['Licence, registration, insurance', 'None needed', 'Arizona, A.R.S. § 28-819(B)'],
              ['Helmet', 'Not required by law; the City asks you to wear one', 'Arizona; City of Phoenix'],
              ['Sidewalks', 'Banned: ride in the street or a bike lane, with the traffic', 'City Code § 36-304; City of Phoenix'],
              ['Multi-use paths', 'Allowed, unless the authority that runs the path bans them', 'Arizona, A.R.S. § 28-819(D)'],
              ['Speed', 'A scooter built for 20 mph at most; ride no faster than is “reasonable and prudent”', 'Arizona, A.R.S. § 28-101; City Code'],
              ['Passengers', 'None: one rider per scooter', 'Arizona, A.R.S. § 28-813; City of Phoenix'],
              ['Lights at night', 'A white front light visible from 500 feet and a red rear reflector', 'Arizona, A.R.S. § 28-817'],
              ['Phones', 'Don’t text and ride; Spin bans any phone use while riding, hands-free included', 'City of Phoenix; Spin (terms)'],
              ['Alcohol', 'Never ride intoxicated or impaired', 'City of Phoenix; Spin (terms)'],
              ['Parking', 'Upright, in a designated area, with at least 5 feet clear for people walking', 'City of Phoenix'],
            ],
          },
        },
        { note: '**Stay off the sidewalk.** Phoenix City Code § 36-304 bans e-scooters from sidewalks, shared or your own. Use the bike lane where there is one, or ride in the street with the traffic.' },
        'Phoenix Police’s rules page lists Arizona’s DUI law as “not applicable” to e-scooters (October 2026), as state law doesn’t count them as vehicles. The City and Spin still forbid riding intoxicated or impaired.',
      ],
    },
    {
      heading: 'The City’s scooter programme: area, hours and caps',
      blocks: [
        'Phoenix began with a downtown pilot in September 2019 and launched its Shared Micromobility Program on 20 January 2023. An automatic three-year renewal runs both contracts to 20 January 2028, the Council’s December 2024 papers say.',
        'The service area was 35 square miles until the City added 13 more across Central Phoenix, taking in the Phoenix Art Museum, the Heard Museum and Steele Indian School Park, with 103 new parking corrals and up to 300 more e-bikes and e-scooters, its page says. On 23 October 2026 Spin’s ride area ran roughly from Dobbins Road, a mile south of Baseline, north to Camelback Road, and east to the 44th Street PHX Sky Train station; the app shows the exact edge.',
        'Scooters run 24 hours a day, seven days a week: the Council made that permanent on 18 December 2024, after a six-month trial from March to August 2024 brought more riding “without an increase in incidents”, City staff said. Before the trial, scooters stopped between midnight and 5 am.',
        'At launch each company could run up to 1,500 vehicles, at least a fifth of them bikes, Smart Cities Dive reported in January 2023. The programme costs the City nothing: each company pays it a yearly minimum plus a fee per trip, set in 2022 at $15,000 and up to 25 cents.',
      ],
    },
    {
      heading: 'Downtown Phoenix, ASU and Roosevelt Row: where you can’t ride or park',
      blocks: [
        'Downtown has kept marked parking corrals since the pilot. On 23 October 2026 Spin’s open data made the downtown core, roughly 7th Avenue to 7th Street from Chase Field north to McDowell Road, an area you can ride through but can’t end a ride in, except at the designated spots the app shows.',
        {
          list: [
            '**No-ride spots downtown.** Inside the core, Spin’s data marked Chase Field, Footprint Center, parts of CityScape, City Hall, the courts and county buildings, and Heritage and Science Park as no-ride.',
            '**ASU Downtown Phoenix.** ASU’s Campus Transportation Code applies to anyone on university property and bans motorised scooters from the campus and its buildings. Spin’s data marked the Beus Center for Law and Society, the Cronkite building, Gordon Commons and the Mercado as no-ride. Public streets through the campus, such as Central Avenue, follow state and City rules.',
            '**Roosevelt Row.** The arts district lies inside the downtown core, so end your ride in a corral. Its monthly First Friday Art Walk and A.R.T.S. Market draws over 20,000 people, the district says.',
            '**Grand Avenue.** The diagonal avenue’s downtown end, from 7th Avenue and Van Buren Street, lies inside the core. Further northwest Spin’s data set no zone on it.',
          ],
        },
        'The [live map](map:us:az:Phoenix) shows where Spin scooters stand now. These zones are our reading of Spin’s open data on 23 October 2026, not City rules, and can change: the app shows the exact edges.',
      ],
    },
    {
      heading: 'Parks and canal paths',
      blocks: [
        'City parks keep posted hours, and the Parks and Recreation code of conduct bans e-bikes and other motorised vehicles on trails and off the park roads in desert parks and mountain preserves. Spin’s data adds no-ride zones over Hance Park, Civic Space Park, Encanto Park and the Phoenix Art Museum grounds; Papago Park and the zoo lie outside its service area. It marked no zone in Steele Indian School Park.',
        'Salt River Project (SRP) operates the canals, and the 12-mile Grand Canalscape along the Grand Canal is a City path for walking and cycling, built with SRP. Arizona law lets e-scooters use multi-use paths unless the authority in charge bans them. On 23 October 2026 Spin’s data marked the Grand Canalscape no-ride from the west edge of its area to about 20th Street, street crossings apart, but left the stretch from 24th Street to 44th Street open. Check the app, and obey the signs on any canal bank.',
      ],
    },
    {
      heading: 'Light rail, buses and Phoenix Sky Harbor Airport',
      blocks: [
        '**Valley Metro.** We couldn’t read Valley Metro’s rules, so our advice: end a shared scooter ride before you board. ASU’s transport office says a folded scooter of your own may ride the light rail under the seat; that is ASU’s note, not a Valley Metro rule.',
        '**Sky Harbor (PHX).** The terminals lie outside Spin’s service area. Ride to the 44th Street PHX Sky Train station at 44th and Washington streets, on the area’s eastern edge, end the ride where the app allows, and take the free Sky Train, which runs 24 hours a day to the terminals and the Rental Car Center. At 7:16 pm on 23 October 2026 Spin’s open data showed just one rentable scooter within a mile of that station, so the light rail is the surer bet.',
      ],
    },
    {
      heading: 'Riding in the summer heat',
      blocks: [
        'The City of Phoenix’s heat office says to plan time outdoors for the coolest part of the day, drink more water than usual, and avoid drinks with sugar, alcohol and caffeine. Its Heat Relief Network offers free water and cool indoor places.',
      ],
    },
    {
      heading: 'Tempe next door',
      blocks: [
        'Tempe runs its own scheme with Lime and Bird: at 4:14 pm on 23 October 2026 the [Tempe map](map:us:az:Tempe) showed about 1,570 of their scooters. Its rules differ: Tempe sets speed limits for sidewalks and paths, where Phoenix bans sidewalk riding outright. Spin’s area stops around 44th Street: in Tempe, use Lime or Bird, and see [e-scooters in Tempe](guide:tempe).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**It started downtown.** Phoenix’s scooter pilot began in September 2019 and logged over 328,000 trips before the new programme replaced it in January 2023.',
            '**Spin belongs to Bird.** Bird Rides, Inc. ranked third in the City’s 2022 tender, but Spin has been its subsidiary since September 2023, and Spin’s Phoenix contract has been in Bird Rides’ name since May 2024.',
            '**The age vote was 8 to 1.** When the Council lowered the riding age to 16 in December 2024, the one councilmember who voted no wanted 14, KJZZ reported.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'How much does a scooter cost in Phoenix?',
      answer: 'Neither Spin nor Lime publishes a Phoenix price in its open data, so the app shows the price before you unlock. People on Medicaid, SNAP or other public support can get 30% off, the City says, and Spin Access offers cheaper rides on a limited income.',
    },
    {
      question: 'Are there Lime scooters in Phoenix?',
      answer: 'Yes. Lime holds one of the City’s two contracts, with Spin, until January 2028. ScootRadar’s map doesn’t show Lime in Phoenix because Lime publishes no open data there, so use the Lime app to find one.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Phoenix?',
      answer: '16, on public streets, under City Code since December 2024. Spin and Lime still rent only to riders 18 or over, so at 16 or 17 you can ride only a privately owned scooter.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in Phoenix?',
      answer: 'No. Phoenix City Code § 36-304 bans e-scooters from sidewalks. Ride in the bike lane where there is one, or in the street with the traffic, and park with at least 5 feet clear for people walking.',
    },
    {
      question: 'Do you need a licence for an electric scooter in Arizona?',
      answer: 'No. Arizona law asks for no driving licence, registration or insurance for an e-scooter, and gives its rider a cyclist’s rights and duties.',
    },
    {
      question: 'Can you ride a scooter to Sky Harbor Airport?',
      answer: 'Not to the terminals: they lie outside Spin’s service area. End the ride near the 44th Street PHX Sky Train station and take the free train, which runs 24 hours a day.',
    },
  ],
  sources: [
    { title: 'City of Phoenix: Shared micromobility program', url: 'https://www.phoenix.gov/administration/departments/streets/requests-services/active-transportation/shared-micromobility-program.html' },
    { title: 'Phoenix Police: E-bikes, e-scooters and motor-driven cycles', url: 'https://www.phoenix.gov/administration/departments/police/community-resources/laws-ordinances/e-bikes.html' },
    { title: 'Phoenix Police: Know the rules, 5 June 2025', url: 'https://www.phoenix.gov/newsroom/police-department-news/know-the-rules--e-bikes--e-scooters-and-motor-driven-cycles-.html' },
    { title: 'Phoenix City Council: Lime and Spin agreements (Ordinance S-49256), 14 December 2022', url: 'https://phoenix.legistar.com/LegislationDetail.aspx?ID=5962386&GUID=7B71D31C-C1F3-43BC-B07C-FA97456A2E66' },
    { title: 'Phoenix City Council: Micromobility program update, January 2024', url: 'https://phoenix.legistar.com/LegislationDetail.aspx?ID=6469856&GUID=BF8499C7-15BA-4C52-A711-31AC2CD39C74' },
    { title: 'Phoenix City Council: Spin contract to Bird Rides (Ordinance S-50934), 29 May 2024', url: 'https://phoenix.legistar.com/LegislationDetail.aspx?ID=6704035&GUID=D5AED91B-F116-421B-9915-3896B3A652E2' },
    { title: 'Phoenix City Council: Hours and boundaries (Ordinance S-51540), 18 December 2024', url: 'https://phoenix.legistar.com/LegislationDetail.aspx?ID=7047591&GUID=187FFE6B-E253-4285-AF06-A915D472735E' },
    { title: 'Phoenix City Council: Minimum age (Ordinance G-7334), 18 December 2024', url: 'https://phoenix.legistar.com/LegislationDetail.aspx?ID=7048601&GUID=34E524B9-C899-4676-BEA3-68F812AD6AB5' },
    { title: 'Phoenix City Council: Grand Canalscape update, 2021', url: 'https://phoenix.legistar.com/LegislationDetail.aspx?ID=4971934&GUID=0417E255-A718-4720-BD82-5D4A2BCC141A' },
    { title: 'City of Phoenix Parks and Recreation: Code of conduct', url: 'https://www.phoenix.gov/administration/departments/parks/about-us/code-of-conduct.html' },
    { title: 'City of Phoenix: Heat safety', url: 'https://www.phoenix.gov/administration/departments/heat/heat-response-programs/heat-safety.html' },
    { title: 'Arizona Revised Statutes § 28-819: Electric bicycles; electric standup scooters', url: 'https://www.azleg.gov/ars/28/00819.htm' },
    { title: 'Arizona Revised Statutes § 28-101: Definitions', url: 'https://www.azleg.gov/ars/28/00101.htm' },
    { title: 'Arizona Revised Statutes § 28-813: Riding on bicycles', url: 'https://www.azleg.gov/ars/28/00813.htm' },
    { title: 'Arizona Revised Statutes § 28-817: Bicycle equipment', url: 'https://www.azleg.gov/ars/28/00817.htm' },
    { title: 'Arizona Revised Statutes § 28-1381: Driving under the influence', url: 'https://www.azleg.gov/ars/28/01381.htm' },
    { title: 'Arizona State University: Campus Transportation Code (PDP 207-01)', url: 'https://public.powerdms.com/ASU/documents/1559153' },
    { title: 'Arizona State University: Bike and scooter', url: 'https://cfo.asu.edu/bike' },
    { title: 'Phoenix Sky Harbor: PHX Sky Train', url: 'https://www.skyharbor.com/ground-transportation/phx-sky-train/' },
    { title: 'Spin: Terms of use (US)', url: 'https://www.spin.app/policies/terms-us' },
    { title: 'Spin: Spin Access', url: 'https://www.spin.app/spin-access' },
    { title: 'Spin: Phoenix open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/phoenix/gbfs' },
    { title: 'Roosevelt Row Arts District: First Friday', url: 'https://rooseveltrow.org/' },
    { title: 'KJZZ: Phoenix lowers age requirement for riding e-scooters from 18 to 16, 19 December 2024', url: 'https://www.kjzz.org/kjzz-news/2024-12-19/phoenix-lowers-age-requirement-for-riding-e-scooters-from-18-to-16' },
    { title: 'Smart Cities Dive: Lime and Spin in Phoenix, 24 January 2023', url: 'https://www.smartcitiesdive.com/news/lime-spin-phoenix-shared-micromobility-ebikes-scooters/641074/' },
  ],
};

export default guide;
