import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-baltimore',
  topic: 'baltimore',
  name: 'E-scooters in Baltimore',
  title: 'E-scooters in Baltimore 2026: Spin, Lime, rules and zones',
  description: 'E-scooters in Baltimore: Spin and Lime, prices, Maryland and City rules, sidewalks, the Inner Harbor, stadium no-ride zones, parking, MTA and BWI.',
  headline: 'E-scooters in Baltimore: Spin and Lime, the rules, the Inner Harbor and where you can’t ride',
  lede: 'E-scooters in Baltimore come from Spin and Lime, the two companies holding permits from the Baltimore City Department of Transportation (BCDOT). Neither publishes its prices: the app shows them. Both require you to be 18; scooters are held to 15 mph, and to 8 mph on the waterfront from the Inner Harbor to Canton. You may ride on the sidewalk only beside a street posted at 30 mph or more, at 6 mph at most, and the scooters cut out around Camden Yards and M&T Bank Stadium at all times.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'us:md:Baltimore',
  sections: [
    {
      heading: 'Which apps rent e-scooters in Baltimore?',
      blocks: [
        'BCDOT lists two permit holders, Lime and Spin, both with scooters and e-bikes. Permits run for a year, from 1 July to 30 June, and can be renewed: in June 2024 BCDOT renewed Spin and brought Lime back. We found no 2026–27 announcement by 17 October 2026, but BCDOT’s page, updated in May 2026, still lists both.',
        {
          list: [
            '**Spin**, the orange scooters. Spin has joined forces with Bird. BCDOT and Spin’s website point to the Spin app, but Spin’s Baltimore open data names Bird as operator and links to Bird’s app.',
            '**Lime**, the green ones, which you can also book through the Uber app.',
          ],
        },
        'At 1:25 pm on 17 October 2026 the [map of Baltimore](map:us:md:Baltimore) showed about 1,900 Spin and 1,800 Lime scooters in the city: what was parked at that moment, not the fleets. E-bikes aren’t counted.',
        '**Visiting?** Get an app before you arrive: a ride normally takes a smartphone with data, and City rules make new riders pass a short in-app quiz before their third ride. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Baltimore?',
      blocks: [
        'Spin and Lime publish no Baltimore prices, on their websites or in their open data: the app shows the price before you unlock. The City sets no fare, but its permit rules make every company offer:',
        {
          list: [
            'a way to pay in cash, and a way to ride without a smartphone;',
            'a low-income plan for riders earning up to 200% of the federal poverty guideline, with no unlock fee and at least 80% off for at least four rides a day: Spin Access and Lime Access;',
            'a discount when you end your ride in a BCDOT parking corral.',
          ],
        },
        'Lime takes PayPal, prepaid debit cards and Uber gift cards bought for cash, at the same price, and unlocks by text message. Spin Access riders can unlock by text too, and buy credit with cash at Spin’s Baltimore office.',
      ],
    },
    {
      heading: 'Baltimore scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Since 1 October 2019 Maryland’s Transportation Article has treated an e-scooter, which it calls an “electric low speed scooter”, as a bicycle, not a motor vehicle: you ride by the rules for cyclists. The Baltimore City Code adds its own e-scooter rules, and BCDOT’s permit rules set the speeds the scooters enforce.',
        {
          table: {
            caption: 'Shared e-scooter rules in Baltimore on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'No state or City minimum; Spin and Lime require 18', 'Operators’ terms'],
              ['Licence', 'None: the state counts an e-scooter as a bicycle, not a motor vehicle', 'Maryland §§ 11-104, 11-135, 16-101'],
              ['Helmet', 'Required under 16. The state only gives a warning; the City can fine $20', 'Maryland § 21-1207.1; City Code Art. 31 § 38-18'],
              ['Speed', '15 mph at most; 8 mph in BCDOT’s slow zones', 'City Code § 38-18; BCDOT permit rules'],
              ['Where to ride', 'In the bike lane where there is a smooth one, otherwise near the right side of the road; never on an expressway, or on a road posted above 50 mph except on its shoulder', 'Maryland §§ 21-1205, 21-1205.1'],
              ['Sidewalks', 'Only beside a street posted at 30 mph or more, at 6 mph at most, yielding to pedestrians', 'City Code § 38-18; Maryland §§ 21-1103, 21-1202'],
              ['Passengers', 'One rider only', 'Maryland § 21-1203; City Code § 38-18'],
              ['Hands', 'Carry nothing that keeps a hand off the handlebars; ride one scooter at a time', 'City Code § 38-18'],
              ['Lights', 'A headlight after dusk and before dawn', 'City Code § 38-18'],
              ['Alcohol', 'The DUI law covers any vehicle, e-scooters included: a first offence can bring up to a year in jail, a $1,200 fine or both', 'Maryland §§ 11-117.2, 21-902'],
              ['Phone', 'No e-scooter rule: Maryland’s handheld and texting bans cover motor vehicles', 'Maryland §§ 21-1124.1, 21-1124.2'],
              ['Fines', '$20 for breaking the City’s riding rules, $20 for bad parking', 'City Code Art. 1 §§ 40-14, 41-14'],
              ['Night', 'No curfew', 'BCDOT permit rules'],
            ],
          },
        },
        { note: '**Mostly off the sidewalk.** Maryland leaves sidewalk riding to local law, and Baltimore’s is strict. Take the bike lane or the street, where state law makes drivers leave you 3 feet when passing.' },
      ],
    },
    {
      heading: 'The Inner Harbor, Fells Point and the parks',
      blocks: [
        {
          list: [
            '**The waterfront.** BCDOT’s Promenade Slow Ride Zone holds scooters to 8 mph on the walkways from the Inner Harbor through Harbor East, Harbor Point and Fells Point to Canton Waterfront Park, and you can’t end a ride along the water from the Science Center to Canton. No rule names e-scooters on the Inner Harbor’s brick promenade, from the World Trade Center round to Rash Field, but it is parkland: the Department of Recreation and Parks’ rules let you wheel a bicycle there, not ride it, and Maryland law counts an e-scooter as a bicycle. Walk it there. Farther along, a 2016 BCDOT pilot let bicycles ride the promenade slowly.',
            '**Fells Point and Harbor East.** Thirteen garages there and in Little Italy are no-parking zones too. Use the corrals at Broadway Square, Broadway and Aliceanna Street, or Thames Street Wharf.',
            '**Federal Hill Park, Patterson Park and other city parks.** BCDOT sets no scooter zone there, but the park rules ban riding bicycles on walks, paths and lawns, and from midnight to 6 am you may only pass through. Keep to the park roads or walk.',
            '**Fort McHenry** is a no-ride zone under the national monument’s rules; the free Circulator’s Banner route goes there.',
            '**The Jones Falls and Gwynns Falls trails.** We found no official e-scooter rule for them: follow the posted signs and give walkers room.',
          ],
        },
      ],
    },
    {
      heading: 'Camden Yards, M&T Bank Stadium and game days',
      blocks: [
        'BCDOT’s Stadium No Ride Zone covers Oriole Park at Camden Yards, M&T Bank Stadium and Ravens Walk, with no hours set: scooters lose power there every day, not only on game days, and you can’t end a ride around the stadiums. Park at one of BCDOT’s preferred spots, such as the Hamburg Street underpass, West Camden Street or Ostend Street, or at the Camden Yards light rail and MARC corral.',
      ],
    },
    {
      heading: 'Parking a scooter in Baltimore',
      blocks: [
        'Park upright on the sidewalk, leaving at least 4 feet for people on foot, or in one of BCDOT’s 60 or so painted corrals, which earn you a discount. Never park:',
        {
          list: [
            'in the street, unless the City has marked a spot for scooters;',
            'in a driveway, a sidewalk-dining area, a loading zone or an accessible-parking space;',
            'at a bus stop or shelter, on a curb ramp, or where it blocks a doorway or wheelchair access;',
            'on the waterfront, or on the Johns Hopkins Homewood and Loyola campuses, which are no-parking zones.',
          ],
        },
        'The apps ask for a photo of the parked scooter after each ride; three photos that don’t show where and how you parked get your account disabled. Report a badly parked scooter to 311 under “Scooter and E-Bike Parking”: the company must move it within six hours.',
      ],
    },
    {
      heading: 'Penn Station, light rail, Metro, MARC and the Circulator',
      blocks: [
        '**Can a scooter go on board?** The Maryland Transit Administration (MTA) allows personally owned e-scooters that fold and weigh under 50 pounds on its buses, Light RailLink, Metro SubwayLink and MARC trains. Its rules don’t mention rentals, so end your Spin or Lime ride before you board. No scooter may be ridden on MARC platforms or in its stations.',
        'BCDOT has corrals at Penn Station (Charles Street and St. Paul Street, for Amtrak and MARC), at the Camden Yards, Mt. Vernon and North Avenue light rail stops, and at Lexington Market and other Metro stations. A bus, Metro or light rail trip costs $2; a day pass, $4.60.',
        '**The Charm City Circulator** is BCDOT’s free bus: five routes, every 10 to 40 minutes, reaching 33rd Street, Johns Hopkins Hospital, Federal Hill, Harbor East, Fort McHenry and Cherry Hill.',
      ],
    },
    {
      heading: 'BWI airport and Washington DC',
      blocks: [
        '**BWI Marshall Airport** has no scooters: Spin’s zones mark the area south of the city, the airport included, as no-ride, and on 17 October 2026 neither company’s open data showed a scooter within 5 miles of the terminal. The light rail stops outside the terminal’s lower level, by Concourse E, and runs to Camden Yards and Lexington Market for $2; for Penn Station, change at Mt. Royal Avenue. The last train leaves at 12:40 am on weekdays, but at 8:40 pm on Sundays and holidays. MARC and Amtrak stop at BWI Marshall Rail Station, linked to the terminal by a free 24-hour shuttle.',
        '**Washington DC** is on the same MARC Penn Line, with its own companies and rules: see [scooter rental in Washington, DC](guide:washington-dc) and the [map of Washington](map:us:dc:Washington). Between the two cities, [College Park](map:us:md:College Park) has Veo: about 470 scooters on the map on 17 October 2026, at $1 to unlock and $0.32 a minute in its open data the day before.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Riders took 1,623,111 trips in 2024**, a record, BCDOT reported: the median trip was 0.83 mile, and the average lasted 10 minutes 40 seconds.',
            '**The companies pay the City $0.10 for every rental**, under BCDOT’s rules.',
            '**Lime Assist** brings an accessible vehicle to your door in Baltimore at no cost, and collects it 24 hours later.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride a scooter on the sidewalk in Baltimore?',
      answer: 'Only beside a street posted at 30 mph or more, at no more than 6 mph, yielding to pedestrians. Elsewhere the City Code bans it, with a $20 fine: use the bike lane or the street.',
    },
    {
      question: 'How much does a Lime or Spin scooter cost in Baltimore?',
      answer: 'Neither company publishes its Baltimore rates: the app shows the price before you unlock. On a low income, Spin Access or Lime Access waive the unlock fee and cut at least 80% off at least four rides a day, a City requirement, and ending a ride in a BCDOT corral earns a discount.',
    },
    {
      question: 'Do you need a helmet to ride an e-scooter in Maryland?',
      answer: 'Only under 16: Maryland law requires one, enforced with a warning, and Baltimore’s City Code adds a $20 fine. Spin and Lime rent only to riders of 18 or over, and no law makes adults wear one.',
    },
    {
      question: 'Can you ride a scooter at the Inner Harbor?',
      answer: 'Slowly, and not everywhere. BCDOT’s geofence holds scooters to 8 mph on the waterfront from the Inner Harbor to Canton, where you can’t park. On the Inner Harbor’s brick promenade, park rules bar riding a bicycle, and Maryland law counts an e-scooter as one: walk it there.',
    },
    {
      question: 'Why did my scooter stop near Camden Yards?',
      answer: 'Oriole Park at Camden Yards, M&T Bank Stadium and Ravens Walk sit in BCDOT’s Stadium No Ride Zone, where scooters lose power at all times. Park at a marked spot such as the Hamburg Street underpass or the Camden Yards light rail corral and walk in.',
    },
    {
      question: 'Are there scooters at BWI airport?',
      answer: 'No. Spin’s zones mark the airport as no-ride, and on 17 October 2026 no Spin or Lime scooter stood within 5 miles of the terminal. Take the light rail downtown for $2, or MARC, and pick up a scooter in the city.',
    },
  ],
  sources: [
    { title: 'Baltimore City Department of Transportation: Dockless Vehicles', url: 'https://transportation.baltimorecity.gov/bike-baltimore/dockless-vehicles' },
    { title: 'BCDOT: Dockless Vehicle rules, COBRA 14.02, effective 18 June 2025', url: 'https://codes.baltimorecity.gov/us/md/cities/baltimore/cobra/14.02' },
    { title: 'Baltimore City Code, Article 31, Subtitle 38: Dockless Vehicles', url: 'https://codes.baltimorecity.gov/us/md/cities/baltimore/code/31/38' },
    { title: 'Baltimore City Code, Article 1, § 41-14: Civil citation fines', url: 'https://codes.baltimorecity.gov/us/md/cities/baltimore/code/1/41-14' },
    { title: 'BCDOT: Baltimore City Policy API (zones, corrals and caps)', url: 'https://maps.populus.ai/baltimore/policies' },
    { title: 'City of Baltimore: Dockless Vehicle Program permit holders announced, 27 June 2024', url: 'https://www.baltimorecity.gov/transportation/news/city-of-baltimore-announces-dockless-vehicle-program-permit-holders' },
    { title: 'BCDOT: Dockless Vehicle Program, to the Baltimore Metropolitan Council, March 2025 (PDF)', url: 'https://www.baltometro.org/sites/default/files/bmc_documents/committee/presentations/bpag/BPAG250318pres_Baltimore-Dockless-Vehicle-Program.pdf' },
    { title: 'BCDOT: Promenade Bicycle Access Pilot Project, archived August 2023', url: 'https://web.archive.org/web/20230817024910/https://transportation.baltimorecity.gov/node/11028' },
    { title: 'Department of Recreation and Parks: Park Management and Use rules (PDF)', url: 'https://codes.baltimorecity.gov/us/md/cities/baltimore/cobra/attachments/22.08-Park_Management_and_Use.pdf' },
    { title: 'Maryland Transportation Article § 11-104: Bicycle', url: 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gtr&section=11-104&enactments=false' },
    { title: 'Maryland Transportation Article § 21-1207.1: Helmets', url: 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gtr&section=21-1207.1&enactments=false' },
    { title: 'Maryland Transportation Article § 21-902: Driving under the influence', url: 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gtr&section=21-902&enactments=false' },
    { title: 'Lime: Baltimore', url: 'https://www.li.me/locations/baltimore' },
    { title: 'Spin: Spin Access', url: 'https://www.spin.app/spin-access' },
    { title: 'MDOT MTA: Bikes, e-bikes and e-scooters on transit', url: 'https://www.mta.maryland.gov/bike' },
    { title: 'MDOT MTA: Bikes on MARC', url: 'https://www.mta.maryland.gov/MARCbikes' },
    { title: 'BCDOT: Charm City Circulator', url: 'https://transportation.baltimorecity.gov/charm-city-circulator' },
    { title: 'BWI Marshall Airport: MTA Light Rail', url: 'https://bwiairport.com/to-from-bwi/transportation/transit/mta-light-rail/' },
  ],
};

export default guide;
