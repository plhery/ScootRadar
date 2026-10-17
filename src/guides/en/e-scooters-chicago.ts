import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-chicago',
  topic: 'chicago',
  name: 'E-scooters in Chicago',
  title: 'E-scooters in Chicago 2026: Lime, Divvy, prices and rules',
  description: 'E-scooters in Chicago: Lime and Divvy, what a ride costs, the age and sidewalk rules, parking, and why you can’t ride on the Lakefront Trail or The 606.',
  headline: 'E-scooters in Chicago: Lime and Divvy, what a ride costs, the rules, and where you can’t ride',
  lede: 'E-scooters in Chicago come from two apps: Lime, the one company with a City scooter-sharing licence, and Divvy, the City’s bike-share system, run by Lyft. A Divvy scooter costs $1 to unlock plus $0.44 a minute plus tax (published rate, 17 October 2026); Lime shows its price only in the app. Shared scooters top out at 15 mph, run all year and must keep off sidewalks, the Lakefront Trail, The 606 and the Riverwalk. Divvy’s can be rented at any hour, Lime’s from 5 am to midnight.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'us:il:Chicago',
  sections: [
    {
      heading: 'Which scooter apps work in Chicago?',
      blocks: [
        'Two scooter services run in Chicago in October 2026:',
        {
          list: [
            '**Lime**, the only company the City lists with a scooter-sharing licence; the City’s records show it renewed to 15 June 2028. The code caps licensed scooters at 12,500 in all. Few stand downtown: City rules let a licensee keep no more than 4% of its scooters in the central core and 1% in the Central Business District.',
            '**Divvy**, the City-owned bike-share system, which Lyft runs under contract. Its scooters unlock in the Divvy or Lyft app, dock at stations or lock to a rack, and fall outside the licence caps.',
          ],
        },
        'Spin’s City licence ran out on 15 June 2026 and wasn’t renewed, and Superpedestrian left in 2023, so the City lists no third company.',
        'On the evening of 16 October 2026 the [map of Chicago](map:us:il:Chicago) showed about 11,300 Lime scooters and 920 Divvy scooters left outside a station: what’s on the map, not the fleets. **Since 17 October it also shows the Divvy scooters standing in a dock**, each at its station: 928 more that morning, at 353 stations.',
        '**Visiting?** Get Lime or the Divvy app before you go. Lime asks for a debit or credit card with its expiry date and billing postal code, and may put a temporary hold on it. Divvy sells single rides in the app; its kiosks sell classic-bike rides only. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Chicago?',
      blocks: [
        'Divvy publishes its scooter rates; Lime shows its price only in the app. City rules make Lime charge at least 50% less per minute for rides that start or end in the City’s Equity Priority Area.',
        {
          table: {
            caption: 'Divvy scooter prices in Chicago before tax, 17 October 2026',
            head: ['Ride', 'Single ride', 'Day Pass, $19.90', 'Divvy Annual, $143.90 a year'],
            rows: [
              ['Unlock', '$1', 'Free', 'Free'],
              ['Per minute', '$0.44', '$0.44', '$0.34'],
              ['10 minutes', '$5.40', '$4.40', '$3.40'],
              ['20 minutes', '$9.80', '$8.80', '$6.80'],
            ],
          },
        },
        'Divvy waives the unlock fee in some zones, adds tax and rounds each ride up to the next minute. New members could join Divvy Annual for $99 a year on 17 October 2026, a limited-time offer; Divvy for Everyone costs qualifying residents $5 a year.',
        '**Where you leave a Divvy scooter matters.** Docking at a Divvy station is free, and so is locking it at one of the over 600 public racks the app lists. Anywhere else that’s legal costs an extra fee, up to $3 on Divvy’s pages in October 2026, and its scooter page puts a parking violation at $25.',
      ],
    },
    {
      heading: 'Chicago scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Most rules come from the Chicago Municipal Code, whose bicycle chapter also covers scooters, and the City’s rules for its licensee, Lime. Illinois’s own scooter section (18 and over, no roads posted above 35 mph) is written for scooters that top out at 10 mph, and Chicago’s shared ones reach 15; a new state law replaces it in 2027.',
        {
          table: {
            caption: 'Shared e-scooter rules in Chicago on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'Lime: 18. Divvy: 16 and over. The City: 18, or 16 and 17 with a parent’s or guardian’s consent', 'Operators’ terms; City rules'],
              ['Driving licence', 'Not asked for: City rules set only an age', 'City rules'],
              ['Helmet', 'Advised; neither the state’s scooter law nor the City code requires one', 'City; operators'],
              ['Speed', '15 mph at most; 10 mph on your first ride', 'City rules'],
              ['Hours', 'Divvy: any hour. Lime: 5 am to midnight', 'Operators; City page'],
              ['Where to ride', 'Bike lanes and paths; the street where there’s no bike lane; never Lake Shore Drive', 'Municipal Code 9-103-130 and 9-52-020'],
              ['Sidewalks', 'Banned, except a sidewalk marked as a bike route or the short way to the street, a bike path or a bike-share station. Fine: $50 to $200', 'Municipal Code 9-52-020 and 9-52-010'],
              ['Passengers', 'One rider only', 'City; Municipal Code 9-52-090'],
              ['Phone', 'Hands-free only; $20 to $50 for a first offence', 'Municipal Code 9-52-110'],
              ['Alcohol', 'Don’t ride drunk or high: Lime’s terms forbid it, as state law will from 2027', 'Lime; Illinois from 2027'],
            ],
          },
        },
        { note: '**Ride on a sidewalk and the scooter tells you off.** Lime’s scooters must detect sidewalk riding and say “EXIT THE SIDEWALK”, or beep, every 5 seconds. The City sets what follows: two warnings, a final warning, then a $1 compliance fee at Lime, 48-hour suspensions from the 5th time and a permanent ban at the 10th.' },
      ],
    },
    {
      heading: 'Where you can’t ride: the Lakefront Trail, The 606 and Navy Pier',
      blocks: [
        'Shared scooters stop when they enter a no-ride zone. The City’s scooter page bars them from the Lakefront Trail, The 606 and the Riverwalk, and its April 2025 rules make four zones permanent, for riding and parking alike:',
        {
          list: [
            '**The Lakefront Trail.**',
            '**The 606**, or Bloomingdale Trail.',
            '**The Chicago Riverwalk.**',
            '**O’Hare Airport.**',
          ],
        },
        'Since July 2026 a fifth zone covers **Sheridan Road from Devon Avenue to Bryn Mawr Avenue** in Edgewater, street and sidewalks, the Sun-Times reported: use the Winthrop and Kenmore avenue greenways instead. Riding on the Sheridan Road sidewalk between Ardmore Avenue and 6400 North also carries a $200 fine for adults under the Municipal Code.',
        '**Navy Pier**’s guest code bans unauthorised personal transportation devices, and bike riding on its South Dock and East End Plaza. Divvy has a station and racks by the pier: end your ride there and walk.',
        '**The parks.** The Chicago Park District is preparing rules for e-scooters and e-bikes on its bike paths and trails, to go with the 2027 state law; WTTW reports it aims to take them to its board in November 2026.',
      ],
    },
    {
      heading: 'Parking a scooter in Chicago',
      blocks: [
        'Chicago is a lock-to city: a trip ends only when the scooter is locked to a fixed object. Use a bike rack, a retired parking meter, a street sign or a light pole, keep the scooter upright, leave a clear path at least 5 feet wide on the sidewalk, and take the photo the app asks for. Divvy riders can also dock at a Divvy station.',
        {
          list: [
            '**Never lock to** a private fence, a bus shelter, a bus stop sign, a disabled parking sign or anything inside a CTA ‘L’ station.',
            '**Keep clear of** building fronts, fire hydrants, bus stops, ‘L’ entrances and loading zones.',
            '**Bad parking** follows the same steps as sidewalk riding, with a $2 compliance fee at Lime.',
          ],
        },
        'Report a scooter in the way to 311: the operator has two hours to move it.',
      ],
    },
    {
      heading: 'The CTA, Union Station and the airports',
      blocks: [
        '**No shared scooters on the CTA.** Divvy and other bike-share bikes and scooters aren’t allowed on CTA trains or buses, or in the paid areas of stations, so end your ride outside. Your own e-scooter may come aboard, folded at rush hour or when it’s crowded. An ‘L’ ride costs $2.50, and you can tap a contactless bank card or a phone at the gates.',
        '**Union Station and Ogilvie.** Divvy stations stand at Canal and Jackson and at Clinton and Jackson by Union Station, and at Clinton and Washington by Ogilvie.',
        '**O’Hare.** Scooters are geofenced out of the airport. The CTA Blue Line runs 24 hours from a station linked to Terminals 1, 2 and 3 and reaches downtown in 40 to 45 minutes; the fare from O’Hare is $5.',
        '**Midway** isn’t on the City’s list of no-ride zones. Divvy has a station at the Midway Orange Line stop, and Lime scooters stood nearby on the night of 16 October 2026. The Orange Line takes 20 to 25 minutes to the Loop but doesn’t run overnight.',
      ],
    },
    {
      heading: 'Winter, night rides and what changes in 2027',
      blocks: [
        {
          list: [
            '**Winter.** Scooters run all year: riders took about 180,000 trips on Lime and Divvy in January 2025, the City’s open data shows. City rules let it order Lime’s scooters off the streets in bad weather.',
            '**Night.** The City’s trip data to the end of 2025 shows Divvy rides at every hour but next to no Lime trips between midnight and 5 am, in line with the City’s scooter page. City rules would let Lime run all night only with an in-app impairment test.',
            '**A new state law from 1 January 2027.** Under Public Act 104-0854 (SB 3484, signed in August 2026), e-scooter riders must be 16 and may use streets, bike lanes and bike paths, but not sidewalks, interstates or roads posted above 35 mph without a bike lane. No passengers, alcohol or drugs; no driving licence needed; police may impound. Park districts may set rules for their own paths; other local governments may regulate only as the act allows.',
            '**Divvy’s contract.** In September 2026 the mayor proposed extending Lyft’s Divvy deal into 2033, with half-price non-member rides on the South and West Sides and a bigger core area, the Sun-Times reported. On 17 October 2026 the City Clerk listed the ordinance as held in committee; Lime says it could push the company out of Chicago.',
          ],
        },
        'The [Chicago map](map:us:il:Chicago) shows the nearest Lime or Divvy scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**The City calls Divvy the first docked bike and scooter share system in the country**: since May 2022 its scooters lock into the same stations as its bikes.',
            '**Riders took about 9.3 million shared scooter trips in Chicago in 2025**, 6.1 million on Lime and 3.2 million on Divvy, the City’s open data shows.',
            '**A licensed operator must fish a scooter out of the Chicago River** or other City waters within 24 hours.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride a scooter on the Lakefront Trail in Chicago?',
      answer: 'Not a shared one. The City bars Lime and Divvy scooters from the Lakefront Trail, The 606 and the Riverwalk, and they stop if you ride on.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in Chicago?',
      answer: 'No, except on a sidewalk marked as a bike route or for the short way to the street, a bike path or a bike-share station. The Municipal Code sets fines of $50 to $200, and Lime’s scooters sound an alarm when they detect a sidewalk.',
    },
    {
      question: 'How old do you have to be to ride a scooter in Chicago?',
      answer: 'Lime rents only to riders of 18 and over. Divvy says 16 and over, and the City allows 16 and 17 with a parent’s or guardian’s consent. From 1 January 2027 state law sets the minimum at 16.',
    },
    {
      question: 'How much does a scooter ride cost in Chicago?',
      answer: 'A Divvy single ride costs $1 to unlock plus $0.44 a minute, so 10 minutes comes to $5.40 before tax (published rate, 17 October 2026). Lime shows its Chicago price only in the app.',
    },
    {
      question: 'Are Chicago scooters available at night and in winter?',
      answer: 'Divvy scooters run at all hours; Lime’s rides stop between midnight and 5 am. Both run all winter, unless the City orders scooters off the streets in bad weather.',
    },
    {
      question: 'Can you take a Divvy scooter on the ‘L’?',
      answer: 'No. The CTA bans Divvy and other bike-share scooters on its trains and buses and in the paid areas of stations, so end your ride before you go in.',
    },
  ],
  sources: [
    { title: 'City of Chicago: scooter sharing in Chicago', url: 'https://www.chicago.gov/city/en/depts/cdot/supp_info/escooter-share-pilot-project.html' },
    { title: 'City of Chicago: scooter sharing rules, April 2025 (PDF)', url: 'https://www.chicago.gov/content/dam/city/depts/cdot/Misc/EScooters/2025/Chicago%20Scooter%20License%20Rules%20and%20Regulations%20-%202025%20Update%20(04-15-25).pdf' },
    { title: 'City of Chicago open data: business licences', url: 'https://data.cityofchicago.org/Community-Economic-Development/Business-Licenses/r5kz-chrr' },
    { title: 'Municipal Code of Chicago, chapter 9-103: scooter sharing', url: 'https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2647816' },
    { title: 'Municipal Code of Chicago, 9-52-020: riding on sidewalks', url: 'https://codelibrary.amlegal.com/codes/chicago/latest/chicago_il/0-0-0-2645812' },
    { title: 'Illinois Vehicle Code, 625 ILCS 5/11-1518: low-speed electric scooters', url: 'https://www.ilga.gov/documents/legislation/ilcs/documents/062500050K11-1518.htm' },
    { title: 'Illinois Public Act 104-0854 (SB 3484), from 1 January 2027', url: 'https://www.ilga.gov/documents/legislation/PublicActs/104/104-0854.htm' },
    { title: 'Divvy: pricing', url: 'https://divvybikes.com/pricing' },
    { title: 'Divvy: how scooters work', url: 'https://divvybikes.com/how-it-works/scooter' },
    { title: 'Lime: user agreement (US)', url: 'https://www.li.me/en-us/legal/user-agreement' },
    { title: 'Lime: Chicago', url: 'https://www.li.me/locations/chicago' },
    { title: 'CTA: Bike & Ride', url: 'https://www.transitchicago.com/bikeandride/' },
    { title: 'City of Chicago open data: e-scooter trips', url: 'https://data.cityofchicago.org/Transportation/E-Scooter-Trips/2i5w-ykuw' },
    { title: 'Navy Pier: guest code of conduct', url: 'https://navypier.com/plan-your-visit/guest-safety/guest-code-of-conduct/' },
    { title: 'WTTW: the Park District’s first town hall on e-scooters and e-bikes, 30 September 2026', url: 'https://news.wttw.com/2026/09/30/speed-and-enforcement-are-top-issues-raised-chicago-park-district-s-first-town-hall' },
    { title: 'Chicago Sun-Times: City bans shared e-scooters from Sheridan Road, 27 July 2026', url: 'https://chicago.suntimes.com/transportation/2026/07/27/divvy-lime-scooter-sheridan-sidewalk-edgewater' },
    { title: 'Chicago Sun-Times: Lime warns Divvy deal could push company from Chicago, 5 October 2026', url: 'https://chicago.suntimes.com/transportation/2026/10/05/lime-scooter-divvy-expansion' },
  ],
};

export default guide;
