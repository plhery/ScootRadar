import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-san-diego',
  topic: 'san-diego',
  name: 'E-scooters in San Diego, California',
  title: 'E-scooters in San Diego 2026: Spin, prices, where to ride',
  description: 'E-scooters in San Diego: Spin at UC San Diego and SDSU, what a ride costs, why rentals left the city, the boardwalk ban, sidewalks and parking.',
  headline: 'E-scooters in San Diego: Spin on campus, what a ride costs, and where you can’t ride',
  lede: 'E-scooters in San Diego are for rent on two campuses only, as far as we could find: Spin runs them at UC San Diego and San Diego State, and the City’s contractors had all pulled out by November 2023. At UC San Diego a ride costs $1 to unlock plus $0.30 a minute with a campus email; others see the price in the app. State law asks for a driving licence and caps scooters at 15 mph, sidewalks are off limits, and the City bans every motorised scooter, rented or owned, from its beach boardwalks.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'us:ca:San Diego',
  sections: [
    {
      heading: 'Where can you rent e-scooters in San Diego?',
      blocks: [
        'Since 27 July 2022 the City’s code has required a scooter company to sign a contract with the City and pay an annual operator fee, a daily fee per scooter and a Climate Equity Fee. That July four companies were allowed to run up to 8,000 devices. On 8 November 2023 NBC 7 reported that Bird, the last of them, was pulling out, at least for a while; the City said its programme was “not concluding”.',
        'A plan to soften the rules was withdrawn in January 2024, and in April 2026 the City’s Mobility Board was still urging the Council to waive operator fees and ease the geofencing and parking rules. We found no citywide operator, and no new City contract, in October 2026. The campus fleets carry on:',
        {
          list: [
            '**UC San Diego**: about 800 Spin scooters and 24 e-bikes, meant for students, faculty and staff on campus. Take one off campus and bring it back the same day.',
            '**San Diego State**: “Spin @ SDSU”, with its own prices and parking spots.',
          ],
        },
        'At 4:14 p.m. on Friday 23 October 2026 the [San Diego map](map:us:ca:San Diego) showed about 670 Spin scooters, all on and around the UC San Diego campus: what was on the map at that moment, not the fleet. ScootRadar shows standing scooters from companies with a public data feed, with positions that can be a few minutes old, and can’t book or unlock one. Spin’s SDSU scooters aren’t in its open data: look for them in the app.',
        '**Which app?** Spin has belonged to Bird since September 2023. UC San Diego says to sign up in the Spin app with your @ucsd.edu address; SDSU points to the “Bird/Spin app”. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
        { note: '**No rental scooters downtown or at the beaches.** On 23 October 2026 Spin’s open data placed every scooter around UC San Diego and marked most of the city as an area you may ride through but not end a ride in. For the Gaslamp, Balboa Park or Pacific Beach, take the trolley, a bus or your own scooter.' },
      ],
    },
    {
      heading: 'How much does a Spin scooter cost in San Diego?',
      blocks: [
        {
          table: {
            caption: 'Spin prices on the campuses’ own pages (UC San Diego, updated 6 October 2026; SDSU, updated 17 June 2026)',
            head: ['Ride', 'UC San Diego (@ucsd.edu account)', 'San Diego State'],
            rows: [
              ['Unlock', '$1', 'From $0.50'],
              ['Per minute', '$0.30', '$0.34'],
              ['10 minutes', '$4', 'From $3.90'],
              ['20 minutes', '$7', 'From $7.30'],
              ['Unlock pass', '$3 for 30 days', '$5 a month'],
              ['Spin Access (low income)', '$0.50 to unlock, $0.10 a minute', 'Discounted fares if you qualify'],
            ],
          },
        },
        'UC San Diego’s rates are for @ucsd.edu accounts, e-bikes included; new students get $5 off with the code TRITON5. Spin Access covers Pell Grant and CalFresh recipients, among others, and lets you unlock without a smartphone. At SDSU, $0.25 comes off a ride when you park correctly and another $0.25 for a helmet selfie, and Admissions gives visitors ride credits.',
        'Spin publishes no price in its open data or on its website: the app shows yours before you ride.',
      ],
    },
    {
      heading: 'San Diego scooter rules: age, licence, helmet, speed and sidewalks',
      blocks: [
        'The California Vehicle Code (CVC) sets the basics. The City’s code adds rules for riders and for its contractors, the Port rules its bayfront land, each university its campus, and Spin’s terms add the rest.',
        {
          table: {
            caption: 'E-scooter rules in San Diego in October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to ride a Spin; under 16, no motorised scooter at all on Port land', 'Spin’s terms; Port (§ 8.07)'],
              ['Licence', 'A valid driving licence or instruction permit', 'CVC § 21235'],
              ['Helmet', 'Required under 18', 'CVC § 21235; Port'],
              ['Speed', '15 mph at most, even where the posted limit is higher', 'CVC § 22411'],
              ['Which streets', 'Not on streets posted above 25 mph unless you ride in a bike lane or protected bike lane', 'CVC § 21235'],
              ['Left turns', 'On a two-way street, get off and walk the scooter across the crosswalk', 'CVC § 21228'],
              ['Sidewalks', 'No riding, except across a driveway', 'City (SDMC § 84.04); CVC § 21235'],
              ['Beach boardwalks', 'No motorised device of any kind, rented or owned', 'City (SDMC § 84.18)'],
              ['Passengers', 'One rider only', 'CVC § 21235; Port'],
              ['Hands and ears', 'Keep at least one hand on the handlebars; no earphones in both ears', 'CVC §§ 21235 and 27400'],
              ['Phone', 'Don’t use a phone or music player while riding, even hands-free', 'Spin’s terms'],
              ['Alcohol and drugs', 'Riding under the influence is illegal', 'CVC § 21221.5; Port; Spin’s terms'],
              ['Night', 'The City’s contractors may not let scooters be reserved or started from midnight to 2:30 a.m.', 'City (SDMC § 83.0308)'],
            ],
          },
        },
        'The night rule has bound the City’s contractors since 27 July 2022; UC San Diego, SDSU and Spin don’t say whether the campus fleets follow it.',
      ],
    },
    {
      heading: 'Where you can’t ride: beach boardwalks, the Embarcadero and slow zones',
      blocks: [
        {
          list: [
            '**The beach boardwalks.** Since 29 February 2020 no motorised scooter, e-bike or other motorised device, rented or owned, may ride on Ocean Front Walk from the South Mission Beach Jetty to Law Street in Pacific Beach, on Bayside Walk along west Mission Bay, on the east Mission Bay walkway from De Anza Road to South Shores, or on the La Jolla Shores boardwalk to Kellogg Park. People with disabilities using a mobility device are exempt. The City’s parks code also limits anything on wheels to 8 mph on Mission Bay Park’s paths at Bonita Cove, Ventura Cove, Bahia Point and Sail Bay.',
            '**The Embarcadero and the bayfront.** The Port of San Diego runs the tidelands round the bay. Since December 2023 its code has kept motorised scooters, shared or owned, off its sidewalks, promenades, multi-use paths, nature trails, piers, plazas, parking garages and parks: ride on its roads, parking lots and bike lanes.',
            '**Slow zones for the City’s contractors.** A company under contract with the City must slow its scooters to 3 mph, and stop rides ending, on the North and South Embarcadero walk, the Martin Luther King Promenade, Little Italy’s Piazza della Famiglia, Ellen Browning Scripps Park’s walkway and the Children’s Pool plaza in La Jolla. On the walkways of Balboa Park, Liberty Station’s NTC Park and Spanish Landing, and around Petco Park, the limit is 8 mph. No company held such a contract in October 2026, as far as we could find.',
          ],
        },
        'The boardwalk, parks and Port rules bind every rider, on a rented scooter or your own. In the Gaslamp, as everywhere, keep off the sidewalks.',
      ],
    },
    {
      heading: 'Riding and parking at UC San Diego and San Diego State',
      blocks: [
        '**UC San Diego.** End your ride in one of the 400 designated parking spots shown in the Spin app; every campus bike rack counts. End it elsewhere and Spin emails a warning, then may fine you. Campus police set 8 mph on shared-use paths, and their list of places closed to skateboards and scooters alike includes Library Walk and the Geisel Library Forum, Price Center Plaza, Warren Mall and building interiors.',
        '**Your own scooter at UCSD.** New for fall 2026, you must register it before riding or parking on campus: a safety quiz and a helmet selfie, free.',
        '**San Diego State.** Scooters may ride only on designated bike paths and on Aztec Circle Drive, Hilltop Way, Scripps Terrace and the Avenue of Arts; elsewhere, get off and walk. The campus limit is 8 mph. End a Spin ride in a designated parking spot; scooters attached to railings can be impounded.',
      ],
    },
    {
      heading: 'Parking on City streets and Port land',
      blocks: [
        'Under the City’s code, a company under contract may line up its scooters only in corrals, at most four in each, at least 6 feet from a bus or trolley stop and with a 48-inch path left clear. It must also stop them being ridden, parked or ending a ride on a City sidewalk. The City can impound a scooter that blocks the way; the company must move one within an hour of notice.',
        'On Port land, nobody may leave a scooter, rented or owned, on a sidewalk, promenade, path, pier or plaza, or in a park.',
      ],
    },
    {
      heading: 'The trolley, buses and San Diego airport',
      blocks: [
        'The UC San Diego Blue Line trolley serves the La Jolla campus, the Green Line San Diego State. MTS’s website didn’t answer us, so we couldn’t confirm its rules for scooters aboard: ask MTS before you bring your own.',
        '**San Diego International Airport (SAN).** Spin’s open data showed no scooters near the airport on 23 October 2026, and the trolley doesn’t reach it. MTS Route 992 stops at Terminals 1 and 2 every 15 minutes from 4:15 a.m. to midnight, and the free San Diego Flyer shuttle runs to Old Town Transit Center, where the Blue Line leaves for UC San Diego.',
        'Heading north? Our [Los Angeles guide](guide:los-angeles) and the [Los Angeles map](map:us:ca:Los Angeles) cover the scooters there.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**A licence check every three months.** The City’s contractors must make riders upload a valid driving licence at least every three months.',
            '**It says so on the scooter.** The same code makes them label every scooter, in 40-point type: “Riding and parking on sidewalks is prohibited. One person allowed per device.”',
            '**No bike share either.** In April 2026 the City’s Mobility Board called San Diego “one of the largest metropolitan regions in the United States without a modern, integrated bike share system”.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Are there Bird or Lime scooters in San Diego?',
      answer: 'Not citywide. Bird, the City’s last contractor, pulled out in November 2023, and we found no return by October 2026. Spin, owned by Bird, runs scooters at UC San Diego and San Diego State.',
    },
    {
      question: 'How much does a Spin scooter cost at UC San Diego?',
      answer: '$1 to unlock and $0.30 a minute for @ucsd.edu accounts, on UCSD’s page updated 6 October 2026: 10 minutes cost $4. A 30-day unlock pass costs $3. Other riders see the price in the app.',
    },
    {
      question: 'Can you ride an e-scooter on the Pacific Beach or Mission Beach boardwalk?',
      answer: 'No. Since 29 February 2020 the City has banned every motorised device, rented or owned, on Ocean Front Walk from the South Mission Beach Jetty to Law Street, on both Mission Bay walkways and on the La Jolla Shores boardwalk.',
    },
    {
      question: 'Can you ride a scooter on the sidewalk in San Diego?',
      answer: 'No. The City’s code bans riding any vehicle on a sidewalk except across a driveway, and state law bans it too, except to enter or leave an adjacent property. On Port land round the bay, promenades and multi-use paths are off limits too.',
    },
    {
      question: 'Do you need a licence or a helmet to ride an e-scooter in San Diego?',
      answer: 'A licence, yes: California asks for a valid driving licence or instruction permit. A helmet only under 18, and Spin rents only to riders 18 or over.',
    },
    {
      question: 'Can you rent a scooter at San Diego airport?',
      answer: 'No: on 23 October 2026 there were no shared scooters near the airport. Take MTS Route 992, or the free San Diego Flyer to the trolley at Old Town.',
    },
  ],
  sources: [
    { title: 'City of San Diego: Micromobility', url: 'https://www.sandiego.gov/transportation/programs/micromobility' },
    { title: 'San Diego Municipal Code, Ch. 8 Art. 3 Div. 3: Shared Mobility Devices (PDF)', url: 'https://docs.sandiego.gov/municode/MuniCodeChapter08/Ch08Art03Division03.pdf' },
    { title: 'San Diego Municipal Code, Ch. 8 Art. 4: Miscellaneous Driving Rules (PDF)', url: 'https://docs.sandiego.gov/municode/MuniCodeChapter08/Ch08Art04Division00.pdf' },
    { title: 'San Diego Municipal Code, Ch. 6 Art. 3 Div. 1: Parks and beaches (PDF)', url: 'https://docs.sandiego.gov/municode/MuniCodeChapter06/Ch06Art03Division01.pdf' },
    { title: 'City of San Diego: Mobility Board letter on bike share, 9 April 2026 (PDF)', url: 'https://www.sandiego.gov/sites/default/files/2026-04/san-diego-mobility-board-letter-bike-share-04.09.26.pdf' },
    { title: 'UC San Diego Transportation: Shared Scooters and Bikes', url: 'https://transportation.ucsd.edu/campus/shared.html' },
    { title: 'UC San Diego Police: Bicycle, Skateboard and Scooter Guidelines', url: 'https://police.ucsd.edu/resources/bike-skate.html' },
    { title: 'UC San Diego Transportation: E-Scooter Registration', url: 'https://transportation.ucsd.edu/micromobility/scooter-registration.html' },
    { title: 'UC San Diego Transportation: Transit', url: 'https://transportation.ucsd.edu/commute/transit/index.html' },
    { title: 'SDSU Transportation Services: Micromobility On Campus', url: 'https://transportation.sdsu.edu/commuting/micromobility' },
    { title: 'SDSU Transportation Services: Parking Rules & Regulations', url: 'https://transportation.sdsu.edu/permits/rules-and-regulations' },
    { title: 'SDSU Transportation Services: Metropolitan Transit System (MTS)', url: 'https://transportation.sdsu.edu/commuting/mts' },
    { title: 'Port of San Diego: Pedicabs and motorised mobility devices', url: 'https://www.portofsandiego.org/pedicabs' },
    { title: 'Port of San Diego: Port Code § 8.07, Ordinance 3111, 14 November 2023 (PDF)', url: 'https://pantheonstorage.blob.core.windows.net/public-safety/pedicab-port-code-8.07.pdf' },
    { title: 'San Diego International Airport: Public transportation', url: 'https://www.san.org/before-you-go-travel-tips/public-transportation/' },
    { title: 'California DMV: Motorcycles, mopeds, and scooters', url: 'https://www.dmv.ca.gov/portal/vehicle-registration/new-registration/motorcycles-mopeds-and-scooters/' },
    { title: 'California Highway Patrol: Motorcycles and similar vehicles', url: 'https://www.chp.ca.gov/programs-services/programs/california-motorcyclist-safety/motorcycles-and-similar-vehicles/' },
    { title: 'UCLA Transportation: California e-scooter laws', url: 'https://transportation.ucla.edu/micromobility/safety' },
    { title: 'Spin: Terms of use (US)', url: 'https://www.spin.app/policies/terms-us' },
    { title: 'Spin: Spin joins Bird, September 2023', url: 'https://www.spin.app/blog-posts/spin-joins-bird-will-continue-to-operate-as-independent-subsidiary-under-spin-brand' },
    { title: 'Spin: San Diego open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/san_diego/gbfs' },
    { title: 'NBC 7 San Diego: Bird, last operator of e-scooter fleet in San Diego, flies the coop, 8 November 2023', url: 'https://www.nbcsandiego.com/news/local/bird-last-operator-of-e-scooter-fleet-in-san-diego-flies-the-coop-but-return-flight-is-possible/3350166/' },
    { title: 'NBC 7 San Diego: Port of San Diego bans electric vehicles from Embarcadero, 16 November 2023', url: 'https://www.nbcsandiego.com/news/local/port-of-san-diego-bans-electric-vehicles-from-embarcadero/3357570/' },
    { title: 'GovTech (San Diego Union-Tribune): San Diego’s scooter rule rollback to start from scratch, 23 January 2024', url: 'https://www.govtech.com/transportation/san-diegos-scooter-rule-rollback-to-start-from-scratch' },
  ],
};

export default guide;
