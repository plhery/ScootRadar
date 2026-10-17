import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-atlanta',
  topic: 'atlanta',
  name: 'E-scooters in Atlanta',
  title: 'E-scooters in Atlanta 2026: Bird, Lime, rules and curfew',
  description: 'E-scooters in Atlanta: Bird and Lime, the 2 am to 4 am shutdown, the sidewalk and BeltLine rules, parking, MARTA, and where you can’t ride.',
  headline: 'E-scooters in Atlanta: Bird and Lime, the night shutdown, the rules, and where you can’t ride',
  lede: 'E-scooters in Atlanta come from Bird and Lime, the two operators listed by ATLDOT, the City’s transportation department. Neither publishes its prices: you see them in the app. You can’t rent a scooter from 2 am to 4 am, both companies require you to be 18, scooters top out at 15 mph, and the sidewalk is off-limits. Centennial Olympic Park, MARTA stations and the highways are no-ride areas, while the BeltLine is open to scooters, with a 12 mph limit on the Eastside Trail in the evenings and at weekends.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'us:ga:Atlanta',
  sections: [
    {
      heading: 'Which scooter apps work in Atlanta?',
      blocks: [
        'ATLDOT lists two operators, Bird and Lime, both permitted since July 2021. On 18 August 2025 the City Council rewrote the scooter article of the City’s code: operators now need a contract with the City instead of a permit. The City advertised a contract in 2025, but in May 2026 the Atlanta Regional Commission (ARC) and Georgia Tech reported that the scooters still ran under ATLDOT permits, and we found no public record of an award by 17 October 2026. For riders, nothing has changed.',
        {
          list: [
            '**Bird**, with stand-up scooters across the city and some e-bikes.',
            '**Lime**, in Atlanta since 2018, with stand-up scooters, seated scooters and e-bikes.',
          ],
        },
        'On the morning of 17 October 2026 the [map of Atlanta](map:us:ga:Atlanta) showed about 2,200 Bird and 2,200 Lime scooters inside the city limits: what was on the map at that moment, not the fleets. E-bikes aren’t counted.',
        'Both services stay inside the City of Atlanta: on 17 October 2026 the companies’ open data placed almost no scooters outside it. Decatur, next door, had Lime only for a pilot from 25 June to 20 July 2026, and has made no decision on a permanent programme.',
        '**Visiting?** Get the app before you go: you need a smartphone with data to unlock and end a ride. Your first ride in Atlanta is held to 10 mph all the way, even if you have ridden in other cities. Lime also lets you pay cash and unlock a scooter by text message. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Atlanta?',
      blocks: [
        'Bird and Lime publish no Atlanta prices: each shows its rate in the app before you unlock. The City sets no price, but its code makes every operator offer a way to pay without a credit card, and discounted prices under an equity plan. Lime runs its discount programme, Lime Access, in Atlanta.',
      ],
    },
    {
      heading: 'Atlanta scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Georgia has no law written for e-scooters. SB 159, a 2019–20 bill that would have defined them and let cities regulate them, passed the state Senate in February 2020 but never came to a vote in the House. So the riding rules come from the City’s Code of Ordinances, which also covers your own e-scooter, and ATLDOT’s Administrative Regulations, last updated in November 2024, add speed and parking rules that the apps enforce.',
        {
          table: {
            caption: 'Shared e-scooter rules in Atlanta on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'No City minimum; Bird and Lime require 18', 'ATLDOT; operators’ terms'],
              ['Licence', 'None in the City’s rules', 'Atlanta Code; ATLDOT'],
              ['Helmet', 'Strongly encouraged; “not required by law for adults over the age of 16”, the City says', 'ATLDOT'],
              ['Speed', '15 mph at most; 10 mph for your whole first ride in Atlanta', 'Atlanta Code § 150-403(a); ATLDOT regulations § IV(l)'],
              ['Slow zones', '10 mph in all of Piedmont Park. 12 mph within 50 feet of the BeltLine’s Eastside Trail, Monroe Drive to DeKalb Avenue, from 6 pm to 4 am Monday to Thursday, from 6 pm Friday to 4 am Monday, and on state holidays', 'ATLDOT regulations § VI(d)(2)'],
              ['Where to ride', 'Travel lanes, bike lanes and shared-use paths, and city parks, the BeltLine included. Yield to pedestrians in all cases', 'Atlanta Code § 150-405'],
              ['Sidewalks', 'Banned, like any space just for pedestrians; a conviction can bring a fine of up to $1,000', 'Atlanta Code §§ 150-405(b), 1-8'],
              ['Passengers', 'One rider only', 'Atlanta Code § 150-403(c)'],
              ['Phone', 'Don’t hold one while riding', 'Atlanta Code § 150-403(d)'],
              ['Alcohol', '“Scoot sober”, ATLDOT’s safety flyer asks; the City’s scooter rules say nothing more', 'ATLDOT'],
              ['Night', 'No rentals from 2 am to 4 am; scooters stop working from 2:20 am', 'ATLDOT regulations § VI(d)(1)(i)'],
            ],
          },
        },
        { note: '**No riding on the sidewalk.** The City’s code bans it, and every shared scooter must say so. Atlanta police tell riders to use LIT lanes, their name for bike lanes, or the right-hand lane of the street. The code sets no fixed fine: a conviction can bring up to $1,000, up to six months in jail, or both.' },
      ],
    },
    {
      heading: 'The BeltLine, Piedmont Park and Centennial Olympic Park',
      blocks: [
        {
          list: [
            '**The BeltLine.** The City’s code says shared and personal e-scooters may be ridden in city parks, “including along the Atlanta BeltLine”, and aren’t motorised vehicles under the park rules. Older articles saying scooters are banned there are out of date. Mind the 12 mph slow zone in the evenings and at weekends, and yield to walkers.',
            '**Piedmont Park.** ATLDOT holds scooters to 10 mph across the whole park, a rule in force since November 2024, and riders must park in the park’s designated parking areas.',
            '**Centennial Olympic Park.** The park, run by the Georgia World Congress Center Authority, bans “electric scooters/bikes”. Bird’s own zones block riding there too, and on the blocks of the Georgia Aquarium and the World of Coca-Cola next door.',
          ],
        },
      ],
    },
    {
      heading: 'Where else you can’t ride in Atlanta',
      blocks: [
        {
          list: [
            '**Highways** and their ramps have been a no-ride zone since August 2021.',
            '**MARTA stations** are no-ride, no-parking areas for shared scooters, so they aren’t taken through the fare gates.',
            '**Mercedes-Benz Stadium and the Georgia World Congress Center.** Bird’s zones block riding there, and parking around State Farm Arena, so on game days plan to walk the last few blocks. The World Congress Center, Atlantic Station and Emory can set their own zones on their private roads, ATLDOT says, and Bird’s zones also block riding in Atlantic Station.',
            '**Events.** Organisers can ask ATLDOT for no-ride, slow and no-parking zones. On 25 August 2026 Bird and Lime, working with ATLDOT and the police, blocked renting and riding in parts of downtown to stop a planned “scooter takeover”; Bird said it would suspend or close the accounts of riders taking part.',
            '**Campuses.** At Georgia Tech, ride wherever a bike may, park near (not at) bike racks, and never take a scooter into a building; Bird’s zones make the campus a no-parking area, and block riding around Morehouse and Spelman in the Atlanta University Center.',
          ],
        },
      ],
    },
    {
      heading: 'Parking a scooter in Atlanta',
      blocks: [
        'Park upright on the sidewalk, at a bike rack, against a building or at the curb, leaving at least 5 feet clear for pedestrians, or in a corral marked by the City. If you end a ride within 100 feet of a corral, you must use it. Never park:',
        {
          list: [
            'on grass or planted areas, or on grates and manhole covers;',
            'in a loading zone, a driveway, a travel lane, a bike lane or on a shared-use path;',
            'where it blocks a curb ramp, a building entrance, a bench or a pay station;',
            'in a bus stop’s clear zone, within 5 feet of a bike-share station, or where it blocks a fire hydrant.',
          ],
        },
        '**The BeltLine** is a no-parking zone except in its official parking areas; leave a scooter elsewhere along it and the operator charges you $5, though it may waive your first time. **At MARTA**, park only in the station’s marked area within 100 feet. Bird’s zones also bar parking in a strip through Midtown, from North Avenue to the Arts Center, and around Lenox Square.',
        'Report a badly parked scooter to the company or to ATL311: the operator must respond within two hours, and the City can impound it.',
      ],
    },
    {
      heading: 'MARTA and the airport',
      blocks: [
        '**On MARTA.** Its code of conduct says “No skateboarding, rollerblading, skating, or riding scooters”, and ATLDOT keeps shared scooters out of the stations: end your ride in the station’s marked area. A ride costs $2.50, with up to four free transfers in three hours, when you tap a bank card, a phone or a Breeze card; a one-day pass is $9. Trains run from 4:45 am on weekdays and 6 am at weekends until 1 am.',
        '**Hartsfield-Jackson airport.** Bird’s service area stops miles short of it, and on 17 October 2026 neither company’s open data showed a scooter within 2 miles of the terminals. MARTA’s Airport Station is inside the Domestic Terminal, between the North and South baggage claims, and the Red and Gold lines run from there to downtown and Midtown.',
      ],
    },
    {
      heading: 'Riding at night in Atlanta',
      blocks: [
        'No shared scooter can be rented from 2 am to 4 am, and those still out stop working at 2:20 am. The City set these hours on 13 November 2024. On 17 October 2026 ATLDOT’s web page and Lime’s Atlanta page still gave midnight to 4 am, the rule from December 2022. Your own scooter isn’t affected, and rental scooters keep their lights on for the whole ride.',
        'The [Atlanta map](map:us:ga:Atlanta) shows the nearest Bird or Lime scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Atlanta’s police call bike lanes “LIT lanes”**, for “Lite Individual Transportation”. Parking a car in one costs $100; a delivery truck, $1,000.',
            '**Bird arrived without a permit in May 2018.** The City’s first permits, in January 2019, had no cap: up to nine companies and 12,700 devices. After serious crashes and deaths that year, the mayor brought in a 9 pm curfew.',
            '**Riders took 2.1 million trips in 2023**, a median of 0.8 miles each, busiest from 5 to 6 pm and in September; 30% replaced a car trip, ATLDOT’s survey found. In 2025 they took 3.7 million, a post-Covid record, ARC and Georgia Tech reported.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What time do scooters shut off in Atlanta?',
      answer: 'Shared scooters can’t be rented from 2 am to 4 am, and those still out stop working from 2:20 am, under ATLDOT’s rules since November 2024. Older pages that say midnight are out of date.',
    },
    {
      question: 'Can you ride scooters on the BeltLine?',
      answer: 'Yes. The City’s code allows e-scooters along the BeltLine. The Eastside Trail has a 12 mph limit in the evenings and at weekends, and you may park only in its marked parking areas, or pay the operator $5.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in Atlanta?',
      answer: 'No. The City’s code bans it, and a conviction can bring a fine of up to $1,000. Ride in the bike lane (LIT lane), in the right-hand lane of the street or on a shared-use path, and yield to pedestrians.',
    },
    {
      question: 'How old do you have to be to ride a scooter in Atlanta?',
      answer: 'The City sets no minimum age, but Bird and Lime both require riders to be 18. The City recommends a helmet but says it isn’t required by law for adults over 16.',
    },
    {
      question: 'Can you take a scooter on MARTA?',
      answer: 'Not a shared one. ATLDOT makes every MARTA station a no-ride, no-parking zone for shared scooters, so they aren’t taken through the fare gates: end your ride in the station’s marked parking area. MARTA’s code of conduct also bans riding scooters.',
    },
    {
      question: 'Can you ride a scooter from Atlanta’s airport?',
      answer: 'No. Bird’s service area doesn’t reach Hartsfield-Jackson, and on 17 October 2026 no Bird or Lime scooter stood within 2 miles of the terminals. Take MARTA’s Red or Gold line from the Airport Station in the Domestic Terminal and pick up a scooter in the city.',
    },
  ],
  sources: [
    { title: 'ATLDOT: Shareable Bikes and Scooters', url: 'https://atldot.atlantaga.gov/services-2/bikes-and-scooters/' },
    { title: 'ATLDOT: Administrative Regulations, November 2024 (PDF)', url: 'https://atldot.atlantaga.gov/wp-content/uploads/2025/11/Administrative-Regulations-November-2024.pdf' },
    { title: 'ATLDOT: Shareable Dockless Devices FAQ, 2024 (PDF)', url: 'https://atldot.atlantaga.gov/wp-content/uploads/2025/11/Shareable-Dockless-Devices-FAQ_2024.pdf' },
    { title: 'ATLDOT: Shared Micromobility Program overview to City Council, June 2024 (PDF)', url: 'https://atldot.atlantaga.gov/wp-content/uploads/2025/09/ATLDOT-Shared-Micromobility-Program_City-Council.pdf' },
    { title: 'ATLDOT: Scoot Smart flyer (PDF)', url: 'https://atldot.atlantaga.gov/wp-content/uploads/2025/11/Scoot-Smart-Flyer-2021.pdf' },
    { title: 'Atlanta Code of Ordinances, Chapter 150, Article X: Shareable Mobility Devices', url: 'https://library.municode.com/ga/atlanta/codes/code_of_ordinances?nodeId=COORATGEVOII_CH150TRVE_ARTXSHMODE' },
    { title: 'Atlanta Code of Ordinances, § 1-8: General penalty', url: 'https://library.municode.com/ga/atlanta/codes/code_of_ordinances?nodeId=PTIICOORENOR_CH1GEPR_S1-8GEPECOVI' },
    { title: 'Georgia General Assembly: SB 159 (2019–20), status history', url: 'https://www.legis.ga.gov/legislation/55312' },
    { title: 'Atlanta Police Department: E-Scooters Safety', url: 'https://www.atlantapd.org/community/e-scooters-safety' },
    { title: 'Atlanta Police Department: LIT Lanes', url: 'https://www.atlantapd.org/community/lit-lanes' },
    { title: 'Bird: Atlanta open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/atlanta/gbfs.json' },
    { title: 'Lime: Atlanta open data (GBFS)', url: 'https://data.lime.bike/api/partners/v2/gbfs/atlanta/gbfs.json' },
    { title: 'Lime: Atlanta', url: 'https://www.li.me/locations/atlanta' },
    { title: 'Bird: Terms of Service', url: 'https://bird.co/terms/' },
    { title: 'Centennial Olympic Park: Plan your visit', url: 'https://centennialpark.com/plan-your-visit/' },
    { title: 'Georgia Tech Parking and Transportation: Scooters', url: 'https://www.pts.gatech.edu/commute/commute-options/scooters' },
    { title: 'MARTA: Ride with Respect', url: 'https://www.itsmarta.com/marta-ride-with-respect.aspx' },
    { title: 'MARTA: Getting to the airport', url: 'https://www.itsmarta.com/getting-to-airport.aspx' },
    { title: 'MARTA: Fares and transfers', url: 'https://itsmarta.com/ride/how-to-pay/fares-and-transfers' },
    { title: 'City of Decatur: Lime Pilot Program', url: 'https://www.decaturga.com/publicworks/page/lime-pilot-program' },
    { title: 'ARC and Georgia Tech: Micromobility in the Atlanta Region, May 2026 (PDF)', url: 'https://urbanresearch.iac.gatech.edu/sites/default/files/2026-07/Micromobility%20Symposium_Summary_Final-compressed.pdf' },
    { title: 'Civic Atlanta: Transportation Committee favors scooter permit extension, 29 June 2025', url: 'https://civicatlanta.org/blog/2025-06-29-transportation-committee-favors-scooter-permit-extension' },
    { title: 'Atlanta News First: Bird, Lime restrict scooters in downtown Atlanta to block planned takeover, 27 August 2026', url: 'https://www.atlantanewsfirst.com/2026/08/28/bird-lime-restrict-scooters-downtown-atlanta-tuesday-block-planned-takeover/' },
  ],
};

export default guide;
