import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-detroit',
  topic: 'detroit',
  name: 'E-scooters in Detroit',
  title: 'E-scooters in Detroit 2026: Lime, Spin, rules and RiverWalk',
  description: 'E-scooters in Detroit: Lime and Spin, the Michigan and City rules, sidewalks, the RiverWalk and Belle Isle, curfews, parking, the QLINE, DTW and Windsor.',
  headline: 'E-scooters in Detroit: Lime and Spin, the rules, the RiverWalk and where you can’t ride',
  lede: 'Detroit’s shared e-scooters come from Lime and from Spin, which Bird runs through its own app. Neither company’s open data gives Detroit prices, so check the app before you unlock. Michigan law lets you ride on the sidewalk if you yield to people on foot, and riders under 19 must wear a helmet. Spin’s data bars riding in the middle of Campus Martius Park, and the RiverWalk’s rules bar e-scooters going over 7 mph.',
  published: '2026-10-18',
  updated: '2026-10-23',
  city: 'us:mi:Detroit',
  sections: [
    {
      heading: 'Which scooter apps work in Detroit?',
      blocks: [
        'The City’s Office of Mobility Innovation (OMI) runs Detroit’s dockless e-scooter programme, and the Department of Public Works (DPW) issues the permits under Chapter 47 of the City Code. The City’s 2026–2027 permit round set a two-year term, from 15 April 2026 to 14 April 2028, with up to three permits, no more than 4,000 scooters in all, at least 1,000 out even in the slow seasons and at least 4% of each company’s scooters in each of the seven Council districts. We found no published list of the winners.',
        {
          list: [
            '**Lime**: in the Lime app you unlock a scooter by scanning its QR code or entering its plate number.',
            '**Spin**: its open data names Bird Rides as the operator and sends riders to the Bird app, so that is the app you need.',
            '**Bird**: the City’s page, written before the 2026 permit round, names “Lime, Bird, and Spin”. Bird’s own Detroit open data listed no scooters on 17 October 2026: the Bird-run scooters we can see are Spin’s.',
          ],
        },
        'At 15:25 on 17 October 2026 the [Detroit map](map:us:mi:Detroit) showed about 1,960 Lime and 295 Spin scooters: what was on the map at that moment, not the fleets. The map shows only companies with open data. The Bird scooters you may see across the river are in [Windsor, Ontario](map:ca:on:Windsor): another country, with its own scheme.',
        '**Prices** appear only in the apps. All three companies offer cheaper rides to residents on low incomes, OMI says, each with its own programme.',
        '**Visiting?** Get the Lime or Bird app before you set out; Bird’s terms say riders must be “over the age of 18”. With that slow-season minimum, scooters stay out through the winter. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Detroit scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Michigan’s Vehicle Code calls a stand-up e-scooter an “electric skateboard”. It isn’t a motor vehicle, so you need no licence, registration or insurance, but on the road you take on a driver’s duties. Detroit’s 2023 scooter ordinance adds parking, conduct and operating standards for shared scooters. Breaking the state’s riding rules is generally a civil infraction, the Michigan State Police said in 2018, but its drunk-driving law covers you too.',
        {
          table: {
            caption: 'Shared e-scooter rules in Detroit on 23 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'Over 18 to rent with the Bird app; under-12s may not ride on a street', 'Bird’s terms; Michigan, MCL 257.658(9)'],
              ['Licence, registration, insurance', 'None: an electric skateboard isn’t a motor vehicle', 'Michigan, MCL 257.13f and 257.33'],
              ['Helmet', 'Required under 19', 'Michigan, MCL 257.658(4)'],
              ['Speed', 'The City sets the companies’ top speeds and slower zones through geofencing; no e-scooters “over 7mph” on the RiverWalk', 'City (DPW permit terms, OMI); Detroit Riverfront Conservancy’s rules'],
              ['Where to ride', 'As near the right side of the road as you can, no more than two abreast', 'Michigan, MCL 257.660'],
              ['Sidewalks', 'Allowed: yield to pedestrians and sound a warning before you pass', 'Michigan, MCL 257.660, which lets cities regulate sidewalk riding'],
              ['Passengers', 'None: one rider per scooter', 'Michigan, MCL 257.658(3)'],
              ['Lights', 'A white front light visible from 500 feet and a red rear reflector', 'Michigan, MCL 257.662(1)'],
              ['Alcohol and drugs', 'Michigan’s drunk-driving law covers e-scooters, a 2015 appeals court ruling held', 'Michigan, MCL 257.625'],
              ['Night', 'The City’s geofencing includes “safety curfews”, but no hours are published', 'City (OMI)'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Downtown, the RiverWalk and Belle Isle: where you can’t ride',
      blocks: [
        {
          list: [
            '**The RiverWalk and the Dequindre Cut.** The Detroit Riverfront Conservancy runs them and nearby parks such as Cullen Plaza. Its rules prohibit “E-scooters, e-bikes, & other electric personal transporters over 7mph”, so keep to 7 mph or less there, or walk. The riverfront is open from 6 am to 10 pm.',
            '**Belle Isle** has been a state park, run by the Michigan DNR, since February 2014. The DNR can regulate scooters off the island’s roads, which are state highways, the Detroit Greenways Coalition notes. Spin’s open data lets you ride through but not start or end a ride there, yet at 18:34 on 17 October 2026 Lime’s showed about a dozen scooters parked there. We couldn’t reach the DNR’s current rules: follow the park’s signs.',
            '**Wayne State, Greektown and the stadiums.** On 17 October 2026 Spin’s open data marked dozens of small no-ride blocks across Wayne State’s campus in Midtown and downtown: around Campus Martius, Greektown, Ford Field and Comerica Park, Little Caesars Arena and the riverfront east of the Renaissance Center. Near Michigan Central in Corktown you can ride a Spin through but not end there. These are Spin’s own zones, not City Code rules; Lime shows its zones only in its app.',
            '**Game days and events.** The City’s permit terms make the companies follow its geofencing requests for special events. We found no fixed game-day rule, and Spin’s data had no zone at Eastern Market.',
          ],
        },
      ],
    },
    {
      heading: 'Is there a scooter curfew in Detroit?',
      blocks: [
        'OMI says the City’s geofencing includes “safety curfews”, but it publishes no hours. In May 2022 Detroit police announced a curfew from 9 pm to 6 am on Friday and Saturday nights in the Central Business District, inside the Lodge, I-75, I-375 and the river. Outlier Media reported then that the City hadn’t decided how long it would last; we found nothing since on whether it still applies.',
        'Police can also have scooters locked at short notice. On 12 August 2026 Lime’s were locked downtown from about 7 pm, a one-off precaution after social media posts urged teenagers to gather near Campus Martius, ClickOnDetroit reported. Our map shows no night ban for Detroit because no official hours are published: if a scooter won’t start downtown after dark, a curfew may be why.',
      ],
    },
    {
      heading: 'Parking a scooter in Detroit',
      blocks: [
        'Detroit’s 2023 ordinance set parking standards for shared scooters and made abandoning one a violation, Council President Mary Sheffield’s newsletter said when it passed. We couldn’t read its current text. Lime asks riders to park clear of walkways, driveways and access ramps, and the City’s permit asks each company how it will cut clutter on sidewalks and keep the clearance the ADA requires. Spin’s data also marks places where you can’t end a ride, such as Belle Isle, so check the app before you park.',
      ],
    },
    {
      heading: 'QLINE, People Mover, buses and DTW airport',
      blocks: [
        '**The QLINE** streetcar is free and runs along Woodward Avenue between downtown and New Center, from 8 am to midnight Monday to Saturday and from 8 am to 9 pm on Sundays. It takes personal scooters that can be stowed in the car, but not hung on the bike racks, and no shared Lime, Bird or Spin scooters: end your rental before you board. QLINE also asks riders to cross the tracks at a right angle, and never in front of a moving streetcar.',
        '**The People Mover**, with 13 stations downtown, is free too; we found no rule on scooters aboard.',
        '**Detroit Metro Airport (DTW).** No shared scooter reaches it: on 17 October 2026 neither Lime nor Spin had one within 3 miles. The Detroit Air Xpress (DAX) bus runs direct to downtown throughout the day, the City says.',
      ],
    },
    {
      heading: 'Windsor and Ann Arbor',
      blocks: [
        {
          list: [
            '**Windsor**, across the river, is in Canada, with Bird scooters under its own scheme. The Ambassador Bridge’s sidewalk closed after the 9/11 attacks. Since 5 August 2026 the new Gordie Howe International Bridge has had a path for walking and cycling, which opened with summer hours of 8 am to 8 pm (last entry 7 pm). Bring a passport or other border documents. E-bikes were barred for its first weeks and we couldn’t confirm that e-scooters are allowed, so plan to walk.',
            '**Ann Arbor** has its own scheme and rules. At 15:25 on 17 October 2026 the [Ann Arbor map](map:us:mi:Ann Arbor) showed about 290 Spin scooters. The D2A2 express bus links downtown Detroit and Ann Arbor.',
          ],
        },
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**In Michigan law an e-scooter is an “electric skateboard”.** Its definition now says an electric skateboard “may have handlebars”; the version the City Council’s staff quoted in October 2018 didn’t mention them.',
            '**In May 2022 five companies ran scooters in Detroit**: Lime, Bird, Spin, Superpedestrian’s LINK and Boaz Bikes, Outlier Media reported. The 2026 permits allow no more than three.',
            '**The City earns a fee on every ride.** Under the 2026–27 permit terms, a company pays $0.25 for each trip that starts or ends in the City’s “High Frequency Area”, and $0.05 for others.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which scooter apps work in Detroit?',
      answer: 'Lime, and Spin, which Bird runs through the Bird app. On 17 October 2026 the map showed about 1,960 Lime and 295 Spin scooters in Detroit.',
    },
    {
      question: 'How much does a scooter cost in Detroit?',
      answer: 'Neither Lime’s nor Spin’s open data gives Detroit prices, so check the rate in the app before you unlock. Each offers cheaper rides to residents on low incomes.',
    },
    {
      question: 'Can you ride an e-scooter on the sidewalk in Detroit?',
      answer: 'Yes, Michigan law allows it, though it lets cities limit sidewalk riding: yield to pedestrians and sound a warning before you pass. Spin’s data bars riding in the middle of Campus Martius Park.',
    },
    {
      question: 'Do you need a helmet to ride a scooter in Michigan?',
      answer: 'Only if you are under 19. Under-12s may not ride on a street, and Bird’s terms require riders to be over 18. You need no licence, registration or insurance.',
    },
    {
      question: 'Can you ride a scooter on the Detroit RiverWalk or Belle Isle?',
      answer: 'On the RiverWalk, yes, but slowly: its rules bar e-scooters going over 7 mph. On Belle Isle, a state park, Spin lets you ride through but not end a ride; follow the park’s signs.',
    },
    {
      question: 'Is there a scooter curfew in downtown Detroit?',
      answer: 'The City’s geofencing includes “safety curfews”, but no hours are published. Police set a 9 pm to 6 am weekend curfew downtown in May 2022; we found nothing saying whether it still applies.',
    },
  ],
  sources: [
    { title: 'City of Detroit, Office of Mobility Innovation: Micro-mobility', url: 'https://detroitmi.gov/government/mayors-office/office-mobility-innovation/micro-mobility' },
    { title: 'City of Detroit DPW: 2026–2027 Dockless Electric Scooter Permit Application (PDF)', url: 'https://detroitmi.gov/sites/detroitmi.localhost/files/2025-12/FINAL%202026-2027%20Dockless%20Electric%20Scooter%20Permit%20Application%20.pdf' },
    { title: 'Detroit City Council President Mary Sheffield: Newsletter, March 2023 (PDF)', url: 'https://detroitmi.gov/sites/detroitmi.localhost/files/2023-03/March%202023%20Newsletter_0.pdf' },
    { title: 'Detroit City Council, Legislative Policy Division: Electric scooters, 15 August 2022, with its October 2018 report (PDF)', url: 'https://detroitmi.gov/sites/detroitmi.localhost/files/2022-08/Report%20on%20Electronic%20Scooter%20Ordinance.pdf' },
    { title: 'Michigan State Police: Legal Update No. 134, October 2018 (PDF)', url: 'https://www.michigan.gov/-/media/Project/Websites/msp/legal-archive-02/msp_legal_update_no_134.pdf' },
    { title: 'Michigan Judicial Institute: Criminal Proceedings Benchbook, glossary', url: 'https://www.courts.michigan.gov/4a8152/siteassets/publications/benchbooks/criminal/crimpttresponsivehtml5.zip/Crim_PTT/Glossary/Glossary.htm' },
    { title: 'Michigan Judicial Institute: Traffic Benchbook, § 9.4 Operating While Intoxicated', url: 'https://www.courts.michigan.gov/4a816c/siteassets/publications/benchbooks/tbb/tbbresponsivehtml5.zip/TBB/Ch_9_Section_625_Offenses/Operating_While_Intoxicated_(OWI)Section_625(1)-u103a.htm' },
    { title: 'Bird: Terms of service, 28 October 2024', url: 'https://www.bird.co/terms/' },
    { title: 'Lime: Lime on the App Store', url: 'https://apps.apple.com/us/app/lime-ridegreen/id1199780189' },
    { title: 'Lime: Detroit open data (GBFS)', url: 'https://data.lime.bike/api/partners/v2/gbfs/detroit/gbfs.json' },
    { title: 'Spin: Detroit open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/detroit/gbfs' },
    { title: 'Bird: Detroit open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/detroit/gbfs.json' },
    { title: 'Detroit Riverfront Conservancy: Rules and guidelines', url: 'https://www.detroitriverfront.org/plan-your-visit/visitor-info/rules-guidelines' },
    { title: 'Detroit Greenways Coalition: Motorized skateboards and scooters', url: 'https://detroitgreenways.org/laws/motorized-scooters/' },
    { title: 'Michigan DNR: Recreation Passport for Belle Isle vehicles, 23 December 2014', url: 'https://content.govdelivery.com/accounts/MIDNR/bulletins/e50a82' },
    { title: 'QLINE Detroit: Frequently asked questions', url: 'https://qlinedetroit.com/faq/' },
    { title: 'QLINE Detroit: Rules of the rail', url: 'https://www.qlinedetroit.com/rules-of-the-rail/' },
    { title: 'Detroit People Mover', url: 'https://www.thepeoplemover.com/' },
    { title: 'City of Detroit: How to ride the bus in Detroit with DDOT, SMART', url: 'https://detroitmi.gov/node/107141' },
    { title: 'Outlier Media: Detroit imposes weekend scooter curfew downtown, 26 May 2022', url: 'https://outliermedia.org/detroit-scooter-curfew-downtown-weekend/' },
    { title: 'ClickOnDetroit: Detroit police shut down Lime scooters, 13 August 2026', url: 'https://www.clickondetroit.com/news/local/2026/08/13/detroit-police-shut-down-lime-scooters-amid-reports-of-possible-teen-takeover/' },
    { title: 'Michigan Public: Gordie Howe bridge to give Detroit a walkable link, 6 January 2026', url: 'https://www.michiganpublic.org/transportation-infrastructure/2026-01-06/gordie-howe-bridge-to-give-detroit-a-walkable-bikeable-link-to-canada' },
    { title: 'CP24: Gordie Howe bridge pedestrian path opens Wednesday, 3 August 2026', url: 'https://www.cp24.com/news/canada/2026/08/03/gordie-howe-international-bridge-pedestrian-path-officially-opens-wednesday/' },
    { title: 'AM800 CKLW: First trips on the Gordie Howe bridge path, 5 August 2026', url: 'https://www.am800cklw.com/news/historic-crossing-hundreds-take-first-trip-on-the-multi-use-pathway-across-the-gordie-howe-international-bridge/' },
  ],
};

export default guide;
