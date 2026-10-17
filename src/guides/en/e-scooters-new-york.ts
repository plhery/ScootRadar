import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-new-york',
  topic: 'new-york',
  name: 'E-scooters in New York City',
  title: 'E-scooters in New York City 2026: Lime, Bird, Veo, rules',
  description: 'E-scooters in New York City: where Lime, Bird and Veo run in the Bronx and Queens, what a ride costs, the age and sidewalk rules, and why Manhattan has none.',
  headline: 'E-scooters in New York City: where to ride in the Bronx and Queens, what it costs, and the rules',
  lede: 'E-scooters in New York City can be rented only in the East Bronx and eastern Queens, from Bird, Lime and Veo, under an NYC DOT programme that runs until 2029. Manhattan, Brooklyn and Staten Island have no shared scooters. Lime charges $1 to unlock plus $0.45 to $0.50 a minute and Veo $1 plus $0.42 or $0.45 a minute plus tax (published rates, 17 October 2026); Bird shows its price in the app. DOT’s programme sets the minimum age at 18, and state law caps e-scooters at 15 mph and keeps them off the sidewalk.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'us:ny:Bronx',
  sections: [
    {
      heading: 'Where can you rent an e-scooter in New York City?',
      blocks: [
        'NYC DOT’s E-Scooter Share programme has three operators, Bird, Lime and Veo, and all three serve the same two areas. DOT plans the zones and oversees the contracts; the companies run the scooters, set the prices and handle customer service.',
        {
          list: [
            '**The East Bronx**: 22 square miles from Eastchester and Co-op City down to Throggs Neck and Soundview, home to 590,000 people. Scooters arrived here in August 2021 for a two-year pilot, which DOT then turned into a long-term programme running until 2029.',
            '**Eastern Queens**: 23 square miles from Flushing and Auburndale south to Rochdale Village and Springfield Gardens, taking in downtown Jamaica, home to 600,000 people. Service started on 17 June 2024.',
          ],
        },
        '**Manhattan, Brooklyn and Staten Island have no shared e-scooters.** State law bars shared scooter systems from Manhattan, and DOT’s programme doesn’t cover Brooklyn or Staten Island. Elsewhere, shared rides mean Citi Bike, Lyft’s docked bike share; neither scooter zone overlaps its service area, Streetsblog reported in April 2026.',
        'On the evening of 16 October 2026 the [Bronx map](map:us:ny:Bronx) showed about 3,300 Lime, 1,050 Bird and 55 Veo scooters, and the [Queens map](map:us:ny:Queens) about 1,950 Lime, 270 Bird and 260 Veo: what was on the map that evening, not the fleets. Most of Veo’s New York fleet is its seated Cosmo scooters, which Veo’s open data lists as e-bikes, so the map doesn’t show them. At the edge of the Bronx view you’ll also see Veo’s separate service in New Rochelle, in Westchester.',
        '**Visiting?** Get the Bird, Lime or Veo app before you go. You need no driving licence, but DOT makes the operators check your age, and new riders take a short safety quiz in the app. Your first three rides are held to 10 mph and can’t start overnight. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in NYC?',
      blocks: [
        'DOT doesn’t set prices. Lime and Veo publish theirs; Bird shows its price only in the app.',
        {
          table: {
            caption: 'Published e-scooter prices in New York City, 17 October 2026 (Veo adds tax)',
            head: ['Ride', 'Lime', 'Veo, Bronx', 'Veo, Queens'],
            rows: [
              ['Unlock', '$1', '$1', '$1'],
              ['Per minute', '$0.45 to $0.50', '$0.42', '$0.45'],
              ['10 minutes', '$5.50 to $6', '$5.20', '$5.50'],
              ['20 minutes', '$10 to $11', '$9.40', '$10'],
            ],
          },
        },
        '**Discounts.** Bird, Lime and Veo each run a reduced-fare membership: if you get SNAP, live in NYCHA housing or are on Fair Fares, DOT says you may qualify for Bird Access, Lime Access or Veo Access, and you can join one, two or all three.',
        '**No card or no smartphone?** Lime takes PayPal and prepaid cards, and cash through PayNearMe at over 1,000 shops in the city, such as 7-Eleven, Walgreens and CVS, with no surcharge. Once money is on your Lime account, you can unlock a scooter by text message.',
      ],
    },
    {
      heading: 'New York e-scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Three layers of rules apply. New York State’s Vehicle and Traffic Law (VTL) defines an e-scooter as under 100 lb and no faster than 20 mph, and sets most riding rules. The city gives scooter riders cyclists’ rights and duties and repeats the 15 mph limit; DOT’s programme adds stricter rules for shared scooters.',
        {
          table: {
            caption: 'E-scooter rules in New York City on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 for a shared scooter; 16 for your own', 'NYC DOT programme; VTL § 1282'],
              ['Driving licence', 'Not needed', 'NYC DOT'],
              ['Helmet', 'Required at 16 and 17, with a fine of up to $50; advised for everyone', 'VTL § 1286; NYC DOT'],
              ['Speed', '15 mph at most; 10 mph on your first three shared rides and in the slow areas on Parks greenways', 'VTL § 1282; NYC traffic rules § 4-06; NYC DOT programme'],
              ['Where to ride', 'Bike lanes and streets posted at 30 mph or less. Use the bike lane where there is one, otherwise keep near the right-hand curb, in single file', 'VTL §§ 1282 and 1284'],
              ['Sidewalks', 'Banned, with a civil fine of up to $50. The city code fines sidewalk cycling up to $100, more if it endangers someone, and gives scooter riders cyclists’ duties', 'VTL § 1282; NYC Admin Code §§ 19-176 and 19-176.2'],
              ['Passengers', 'One rider only', 'VTL § 1282'],
              ['Alcohol', 'Riding impaired: up to $300, 15 days in jail or both. At 0.08% or more, drunk or on drugs: a misdemeanour, up to $500, a year in jail or both. Enforced only after a crash', 'VTL § 1289'],
              ['Hands and ears', 'At least one hand on the handlebars; one earphone at most, as for cyclists', 'VTL § 1282; NYC Admin Code § 19-176.2'],
              ['Lights', 'A white light in front and a red one behind after dark, and a bell', 'VTL § 1285'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Where you can’t ride a shared scooter in NYC',
      blocks: [
        'A shared ride must start and end inside its zone: DOT’s maps make everything outside a no-ride, no-park zone. They also mark no-ride zones inside, and slow areas where scooters are held to 10 mph, all on Parks Department greenways.',
        {
          list: [
            '**Parks**: in eastern Queens, DOT rules out riding or parking in parks, cemeteries and golf courses and on NYCHA campuses, and Flushing Meadows Corona Park lies outside the zone. In the Bronx, DOT’s pilot report puts the slow areas on greenways in public parks, and Bird’s zone data marks Pelham Bay Park as no-ride.',
            '**Outside the zones** lie JFK, LaGuardia, Yankee Stadium and Citi Field, Bird’s zone data shows.',
            '**On your own scooter**: DOT allows park drives and greenways under a Parks-led pilot, and bridges only in their bike lanes.',
          ],
        },
        { note: '**Ride out of the zone and the motor powers down.** DOT warns that you’re still charged until you’re back inside the service area, so check the zone map in the app before you set off.' },
      ],
    },
    {
      heading: 'Parking a scooter in NYC: the furniture zone and corrals',
      blocks: [
        'Most of each zone is free-floating: park upright in the furniture zone, the strip of sidewalk nearest the road where trees, parking signs and bike racks stand. Lime asks you to leave 6 feet clear for people walking.',
        {
          list: [
            '**Never block** ramps, curb cuts, driveways, bus stops, subway entrances or fire hydrants, and don’t park on grass, on private property or in the roadway.',
            '**Corral zones**: on busy shopping streets, such as downtown Flushing and downtown Jamaica, a trip ends only inside a corral, a box painted on the sidewalk or the road; some exist only in the app. In the Bronx, corrals line White Plains Road and stand around Westchester Square, among other places.',
            '**Lime’s fees**: two warnings, then $5 for a third bad parking job, with a 48-hour suspension on top for the fourth and a 30-day one for the fifth.',
          ],
        },
        'Report a scooter in the way on the phone number printed on it, through the operator’s app, or on 311.',
      ],
    },
    {
      heading: 'The subway, buses and the airports',
      blocks: [
        '**No shared scooters on trains or buses.** A ride must end inside the zone, and Lime tells riders not to take its scooters on transit. End the trip near the station or bus stop, clear of the entrance and the stop.',
        '**Your own scooter** counts as a bike for the MTA: it may go on the subway, and on local and Select Bus Service buses only if it folds, but never inside an express bus. On the LIRR and Metro-North, the railroads’ bike rules apply.',
        'The Bronx zone takes in 26 subway stops and the Queens zone seven, Streetsblog reported in April 2026.',
        '**JFK.** Both airports lie outside the zones. From the Queens zone, ride to downtown Jamaica, leave the scooter in a corral, and take the AirTrain from Jamaica station: $8.75 one way, paid by tapping a contactless bank card, a phone or an OMNY card.',
        '**LaGuardia.** The Q90 bus links the airport with Flushing-Main St, in the Queens zone. The free Q70 LaGuardia Link runs to Jackson Heights, outside it.',
      ],
    },
    {
      heading: 'Winter, night rides and what comes next',
      blocks: [
        {
          list: [
            '**Winter.** Scooters run all year: riders took about 181,000 trips in January 2026 and 128,000 in February, against about 549,000 in August and 539,000 in September, DOT’s reports show. DOT has restricted riding in bad weather before, during Hurricane Henri in 2021 and a snowstorm in January 2022.',
            '**Night.** Lime says it runs round the clock in New York, though a new rider’s first three trips can’t start overnight.',
            '**Expansion.** Lime wants to push the zones west, towards Fordham, Yankee Stadium and Citi Field, Streetsblog reported in April 2026; the Mamdani administration has no plans to cut the programme back but wouldn’t say whether it will grow. By 17 October 2026 DOT had announced no new areas.',
          ],
        },
        'The [Bronx](map:us:ny:Bronx) and [Queens](map:us:ny:Queens) maps show the nearest Bird, Lime or Veo scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**State law keeps shared scooters out of Manhattan by its population.** The VTL bars shared scooter systems from any county with a 2010 census population between 1,585,000 and 1,587,000. Manhattan, which is New York County, counted 1,585,873.',
            '**Riders have taken over 11 million trips** since the programme began in 2021, DOT says.',
            '**The operators can’t use gig workers**: DOT requires them to employ their staff.',
            '**Wheelchair-accessible vehicles** are part of the programme: Bird Adaptive, Lime Assist and Veo Adaptive can be delivered to your home or a partner site.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Are there rental scooters in Manhattan?',
      answer: 'No. State law bars shared e-scooter systems from Manhattan, and NYC DOT’s programme covers only the East Bronx and eastern Queens, so Brooklyn and Staten Island have none either. In Manhattan, the shared option is Citi Bike.',
    },
    {
      question: 'Can you ride an e-scooter on the sidewalk in NYC?',
      answer: 'No. State law bans it, with a civil fine of up to $50, and the city code gives scooter riders the same duties as cyclists, who face up to $100. Park a shared scooter only in the sidewalk’s furniture zone or in a corral.',
    },
    {
      question: 'How old do you have to be to ride a Lime scooter in New York?',
      answer: 'You must be 18 to ride a shared Bird, Lime or Veo scooter, and the apps check your age. State law lets 16- and 17-year-olds ride their own e-scooters, with a helmet.',
    },
    {
      question: 'How much is a Lime scooter in NYC?',
      answer: 'Lime charges $1 to unlock plus $0.45 to $0.50 a minute in New York (published rate, 17 October 2026), so 10 minutes costs $5.50 to $6. Riders on SNAP, NYCHA residents and Fair Fares members may qualify for Lime Access discounts, DOT says.',
    },
    {
      question: 'Can you take a shared scooter on the subway in New York?',
      answer: 'No. Rides must end inside the zone, and Lime tells riders not to bring its scooters on public transit. Park near the station, clear of the entrance.',
    },
    {
      question: 'Can you ride a scooter to JFK or LaGuardia?',
      answer: 'No: both airports lie outside the zones. Ride to downtown Jamaica and take the AirTrain to JFK for $8.75, or take the Q90 bus from Flushing-Main St to LaGuardia.',
    },
  ],
  sources: [
    { title: 'NYC DOT: E-Scooter Share', url: 'https://nycdotscootershare.info/' },
    { title: 'NYC DOT E-Scooter Share: frequently asked questions', url: 'https://nycdotscootershare.info/faq' },
    { title: 'NYC DOT E-Scooter Share: maps and plans', url: 'https://nycdotscootershare.info/maps_plans' },
    { title: 'NYC DOT: E-Scooter Share report, first quarter of 2026 (PDF)', url: 'https://nycdotscootershare.info/sites/default/files/2026-07/E%20Scooter%20Compliance%20Report%20Q1%2026%20%28Accessible%29.pdf' },
    { title: 'NYC DOT: E-Scooter Share report, third quarter of 2026 (PDF)', url: 'https://nycdotscootershare.info/sites/default/files/2026-10/EScooterComplianceReport_q3_2026-final.pdf' },
    { title: 'NYC DOT: e-scooter share arrives in eastern Queens, 17 June 2024', url: 'https://www.nyc.gov/html/dot/html/pr2024/e-scooter-share-eastern-queens.shtml' },
    { title: 'NYC DOT: briefing to Queens Community Board 8, January 2025 (PDF)', url: 'https://nycdotscootershare.info/sites/default/files/2025-02/E-Scooter%20Share%20Program%20-%20CB%208%20TC%20Briefing%201-30-25_Accessible_0.pdf' },
    { title: 'NYC DOT: East Bronx shared e-scooter pilot report, 2022 (PDF)', url: 'https://www.nyc.gov/html/dot/downloads/pdf/east-bronx-shared-e-scooter-pilot-report.pdf' },
    { title: 'NYC DOT: electric bicycles and more', url: 'https://www.nyc.gov/html/dot/html/bicyclists/ebikes.shtml' },
    { title: 'NYC DOT: bicycle rules, March 2026 (PDF)', url: 'https://www.nyc.gov/html/dot/downloads/pdf/bicyclerules-english.pdf' },
    { title: 'NYC Rules: e-bike and e-scooter speed limits, 2025', url: 'https://rules.cityofnewyork.us/rule/speed-limits-for-e-bikes-e-scooters-and-pedal-assist-commercial-bicycles/' },
    { title: 'New York Vehicle and Traffic Law § 1282: operating electric scooters', url: 'https://www.nysenate.gov/legislation/laws/VAT/1282' },
    { title: 'New York Vehicle and Traffic Law § 1284: where to ride', url: 'https://www.nysenate.gov/legislation/laws/VAT/1284' },
    { title: 'New York Vehicle and Traffic Law § 1286: helmets', url: 'https://www.nysenate.gov/legislation/laws/VAT/1286' },
    { title: 'New York Vehicle and Traffic Law § 1289: alcohol and drugs', url: 'https://www.nysenate.gov/legislation/laws/VAT/1289' },
    { title: 'NYC Administrative Code §§ 19-176 and 19-176.2: sidewalks and scooters', url: 'https://codelibrary.amlegal.com/codes/newyorkcity/latest/NYCadmin/0-0-0-31165' },
    { title: 'Lime: e-scooter rentals in New York', url: 'https://www.li.me/locations/new-york' },
    { title: 'Veo: Bronx open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/nyc/gbfs' },
    { title: 'Bird: New York open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/new-york/gbfs.json' },
    { title: 'MTA: personal electric vehicle policy', url: 'https://www.mta.info/safety-and-security/personal-electric-vehicle-policy' },
    { title: 'MTA: bikes on public transit', url: 'https://www.mta.info/guides/bikes' },
    { title: 'JFK Airport: AirTrain', url: 'https://www.jfkairport.com/to-from-airport/air-train' },
    { title: 'LaGuardia Airport: public transportation', url: 'https://www.laguardiaairport.com/to-from-airport/public-transportation' },
    { title: 'NYC Open Data: population by borough', url: 'https://data.cityofnewyork.us/City-Government/New-York-City-Population-by-Borough-1950-2040/xywu-7bv9' },
    { title: 'Streetsblog NYC: Lime wants to bring more e-scooters to New York City, 30 April 2026', url: 'https://nyc.streetsblog.org/2026/04/30/lime-wants-to-bring-more-e-scooters-to-new-york-city' },
  ],
};

export default guide;
