import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-richmond',
  topic: 'richmond',
  name: 'E-scooters in Richmond, Virginia',
  title: 'E-scooters in Richmond, VA 2026: Bird, Spin, Lime, rules',
  description: 'E-scooters in Richmond, VA: Bird, Spin and Lime, prices and discounts, the 1 a.m. curfew, sidewalks and parking, VCU, the Capital Trail, GRTC and RIC.',
  headline: 'E-scooters in Richmond, Virginia: Bird, Spin and Lime, the night rule, and where to ride and park',
  lede: 'E-scooters in Richmond come from Bird, Spin and Lime, the three companies the City lists as permit holders (26 October 2026). Check the price in the app before you unlock: Bird and Spin publish none for Richmond. The City Code allows rides only from 5 a.m. to 1 a.m., the City asks you to keep off sidewalks and trails, and Bird and Spin require riders to be 18.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'us:va:Richmond',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Richmond?',
      blocks: [
        'Electric scooter rental in Richmond runs on City permits. The City’s E-Scooter Program page, read on 26 October 2026, lists three permit holders: **Bird**, for e-scooters and e-bikes, and **Lime** and **Spin**, for e-scooters. Each starts with a cap of 500 devices. A City release of March 2025 calls Spin a subsidiary of Bird.',
        'At 12:29 p.m. on Monday 26 October 2026 the [Richmond map](map:us:va:Richmond) showed about 565 scooters: roughly 270 Spin and 185 Bird as they stood at that moment, and 115 Lime as last counted. That is a snapshot, not the fleets. At 1:06 p.m. all but one of Bird’s and Spin’s available scooters stood inside the city, by the Census Bureau’s boundaries; the other was just over the line in Henrico County.',
        'For Bird and Spin the map shows each scooter’s position, charge and range, and their zones (see below); for Lime, position and charge. Scooters on a ride aren’t shown. **First ride?** See [how to rent an e-scooter](guide:how-to-rent).',
        '**Bikes aren’t on the map.** ScootRadar shows standing e-scooters only. Bird’s permit covers e-bikes too, though its open data listed none in Richmond on 26 October. **RVA Bike Share**, which the City’s public works department runs with Wegoshare, says it has 22 stations and 220 bikes, open around the clock.',
      ],
    },
    {
      heading: 'How much does a Bird, Spin or Lime scooter cost in Richmond?',
      blocks: [
        'On 26 October 2026 neither Bird’s nor Spin’s open data held a Richmond price, and the City’s page gives none: check the rate in the app before you unlock, as for Lime. Two programmes halve the fare:',
        {
          list: [
            '**Equity Zone Program.** Since March 2025, residents of Fairfield Court, Gilpin Court, Hillside Court, Mosby Court and Whitcomb Court get 50% off rides they start in their neighbourhood, registered or not. Those who register in the app, through Bird’s Community Pricing or Spin Access, get 50% off every ride in the city.',
            '**Bird Community Pricing.** A Bird flyer the City posted in June 2024 offers 50% off to non-profit employees, people in a state or federal assistance programme, Pell Grant recipients, seniors and US veterans, on rides of up to 30 minutes.',
          ],
        },
        'For a bike instead, RVA Bike Share sells these passes; dock within 45 minutes to avoid overage fees:',
        {
          table: {
            caption: 'RVA Bike Share passes in Richmond (rvabikes.com, 26 October 2026)',
            head: ['Pass', 'Price'],
            rows: [
              ['Go Pass', '$1.75 a ride'],
              ['Day Pass', '$6 for 24 hours'],
              ['Monthly', '$18'],
              ['Annual', '$96'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Richmond scooter rules: hours, sidewalks, speed and age',
      blocks: [
        'The Code of Virginia defines a motorized scooter (under 100 pounds, no faster than 20 mph on its motor), says it isn’t a motor vehicle and sets where it may go. Richmond’s City Code mostly binds the companies, and the City’s page tells riders what it expects.',
        {
          table: {
            caption: 'E-scooter rules in Richmond, and who sets them (as published on 26 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Hours', 'Shared scooters may be ridden only from 5 a.m. to 1 a.m. The City’s FAQ still says 5 a.m. to 9 p.m., the rule before February 2023', 'City Code § 24-131(3), Ord. 2023-029; City FAQ'],
              ['Speed', 'Shared scooters are limited to 15 mph; state law caps every motorized scooter at 20 mph', 'City Code § 24-128; Code of Virginia § 46.2-908.1'],
              ['Where to ride', 'The City says ride in the bike lane or the traffic lane, “but not on sidewalks or trails”. State law allows sidewalks unless a city bans them, and a 2006 City ordinance does where signs say so. On a sidewalk, yield to people on foot and warn them before you pass', 'City page and FAQ; Code of Virginia §§ 46.2-903, 46.2-904; Ord. 2006-207-229'],
              ['On the road', 'When slower than traffic, keep as far right as is safe; no more than two abreast, and never between two lanes going the same way. Crosswalks are allowed unless signs say no; Interstates are not', 'Code of Virginia §§ 46.2-904, 46.2-905, 46.2-907, 46.2-908.1'],
              ['Age', '18 to ride a Bird, checked in the app, or a Spin; check Lime’s terms in its app. State law lets under-14s ride only under the immediate supervision of someone 18 or older', 'Bird; Spin; Code of Virginia § 46.2-908.1'],
              ['Helmet', 'Required only up to age 14, under the same 2006 ordinance; the City tells everyone to wear one', 'Ord. 2006-207-229; City page'],
              ['Licence', 'None under the City Code, though a company may ask for one', 'City FAQ'],
              ['Fines', 'Riding where signs ban scooters, not yielding to people on foot, or parking in their way: a civil penalty of up to $50', 'Code of Virginia § 46.2-904'],
            ],
          },
        },
        { note: '**Scooters stop at 1 a.m.** Since February 2023 the City Code has let shared scooters be ridden only from 5 a.m. to 1 a.m. Open the map between 1 and 5 a.m. and it tells you why Richmond’s scooters can’t be rented.' },
        'A DMV work group on e-bike and scooter safety must report to state lawmakers by 1 November 2026, so the state rules may change.',
      ],
    },
    {
      heading: 'Parking a scooter in Richmond, and the zones on the map',
      blocks: [
        'Richmond’s permit is, in the City Code’s words, for the “parking of shared mobility devices on sidewalks”, so a ride ends on the sidewalk. The City’s page and the Code ask for:',
        {
          list: [
            '**Upright on the sidewalk, by the curb**, leaving the walkway clear.',
            '**Nothing blocked:** not travel lanes, driveways, fire hydrants, curb ramps, pedestrian call buttons or bus stops, nor building entrances with their ramp railings and ADA door push buttons.',
            '**Never in a park or on a path.** Every permit bans parking on shared-use paths, in City parks and athletic fields, and on park benches, the City Code says.',
            '**Not on private property**, and never in a bike lane or traffic lane.',
          ],
        },
        'Bird and Spin published the same zones in their open data on 26 October 2026: 16 no-ride and 32 no-parking zones, which the map draws at street zoom. Matched to the City’s park and parcel maps, the no-parking zones take in Capitol Square, most of Brown’s Island, nearly all of Maymont, part of Byrd Park, and land at the Virginia Museum of Fine Arts and Main Street Station, among others; most no-ride zones are small patches of VCU land. The map doesn’t show Lime’s zones: check its app.',
        'A company must fix a badly parked or broken scooter within two hours of being told. Call Bird on 1-866-205-2442, Lime on 1-888-546-3345 or Spin on 1-888-249-9698; the number is on the scooter too.',
      ],
    },
    {
      heading: 'Scooters at VCU and the University of Richmond',
      blocks: [
        {
          list: [
            '**VCU.** Its Off Campus Transportation page, updated on 28 May 2026, says “electric scooters are only permitted in dedicated bike lanes or on the street. Charging and storing electric scooters in campus buildings is not permitted.”',
            '**VCU’s zones.** Thirteen of Bird’s and Spin’s 16 no-ride zones lie on land owned by VCU, its health system or its real estate foundation, in and around the Monroe Park and MCV campuses. At 1:06 p.m. on 26 October about 85 Bird and Spin scooters stood on those two campuses, by the Census Bureau’s boundaries.',
            '**University of Richmond.** Its parking rules cover riders’ own mopeds and scooters, which must be registered, and say nothing of shared ones. Most of the campus lies inside Bird’s and Spin’s service area, but none of their scooters stood on it at 1:06 p.m.',
          ],
        },
      ],
    },
    {
      heading: 'The James River Park System and the Capital Trail',
      blocks: [
        'The City’s FAQ keeps shared scooters off trails, and every permit bans parking them in City parks. The **James River Park System**, which the City owns, is open from sunrise to sunset; its City page sets no scooter rule of its own.',
        'The **Virginia Capital Trail** is a paved, 51.7-mile multi-use trail from Jamestown Settlement to the floodwall in Richmond, where one of its trailheads is Great Shiplock Park. The Virginia Capital Trail Foundation’s trail rules say “No unauthorized motorized vehicles”, support Class 1 and 2 e-bikes and recommend speeds of no more than 20 mph. They don’t list scooters.',
      ],
    },
    {
      heading: 'GRTC, the Pulse and Richmond International Airport',
      blocks: [
        {
          list: [
            '**GRTC buses and the Pulse.** All GRTC buses are free under its Zero Fare policy. Its rules of riding say every personal item must fit in your lap or at your feet, and that this “includes, but is not limited to, e-scooters and share scooters”; bicycles, electric or not, go on the front racks.',
            '**The Pulse.** GRTC’s rapid bus line between Willow Lawn and Rocketts Landing comes every 10 minutes at weekday peaks, every 15 to 30 at other times.',
            '**Richmond International Airport.** The airport lies in Henrico County, outside Bird’s and Spin’s service area; at 1:06 p.m. on 26 October the nearest scooter stood about 5 km away. GRTC routes 7A and 7B leave the upper departure deck every 15 minutes for the Downtown Transfer Station, free.',
          ],
        },
        'Elsewhere in Virginia, see the [Norfolk map](map:us:va:Norfolk) and [e-scooters in Norfolk](guide:norfolk).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**It passed 6 to 3.** City Council adopted the scooter permit programme on 28 January 2019 by six votes to three.',
            '**The Southside gets extra.** A company may run 20% more scooters than its permit allows, at no extra fee, if every extra one stands south of the James River.',
            '**Scooters help pay for bikes.** Each company pays the City $56,250 a year, the fee for 201 to 500 scooters, and the Department of Public Works told The Richmonder in July 2025 that the fees help pay for RVA Bike Share.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What time do scooters stop in Richmond?',
      answer: 'At 1 a.m.: since February 2023 the City Code has let shared scooters run only from 5 a.m. to 1 a.m. The City’s FAQ still gives the old 5 a.m. to 9 p.m.',
    },
    {
      question: 'Can you ride a scooter on the sidewalk in Richmond?',
      answer: 'The City asks you not to: ride in the bike lane or the street, and walk the scooter on the sidewalk. Virginia law allows sidewalk riding unless a city bans it, and Richmond bans it wherever signs say so.',
    },
    {
      question: 'How much does a Bird or Spin scooter cost in Richmond?',
      answer: 'Neither published a Richmond price on 26 October 2026, so check the app before you unlock, as for Lime. Residents of five equity zones can get 50% off, and Bird offers the same to seniors, veterans and other groups.',
    },
    {
      question: 'Do you need a licence to ride an electric scooter in Richmond?',
      answer: 'Not under the City Code, though a company may ask for one. Bird and Spin require riders to be 18, and Virginia law lets under-14s ride only under the immediate supervision of someone 18 or older.',
    },
    {
      question: 'Can you take a scooter on a GRTC bus?',
      answer: 'Only if it fits in your lap or at your feet: GRTC’s rules apply that to e-scooters and share scooters. Bikes go on the front rack, and every GRTC bus, the Pulse included, is free.',
    },
    {
      question: 'Can you ride a scooter at VCU?',
      answer: 'Only in bike lanes or on the street, VCU says, and you may not charge or store one in a campus building. Bird and Spin also have no-ride zones on VCU land in and around the Monroe Park and MCV campuses.',
    },
  ],
  sources: [
    { title: 'City of Richmond: E-Scooter Program', url: 'https://www.rva.gov/public-works/e-scooter-program' },
    { title: 'City of Richmond: Equity Zone Program, 12 March 2025', url: 'https://www.rva.gov/press-releases-and-announcements/news/richmonds-new-equity-zone-program-offers-50-scooter-rides' },
    { title: 'City of Richmond: Bird Community Pricing flyer, June 2024 (PDF)', url: 'https://www.rva.gov/sites/default/files/2024-06/Bird%20Community%20Pricing%20flyer.pdf' },
    { title: 'Richmond Ordinance 2006-207-229, adopted 11 September 2006 (PDF)', url: 'https://legistar2.granicus.com/richmondva/attachments/06c504c4-5371-466f-b237-9fd1c1feefa9.pdf' },
    { title: 'Richmond Ordinance 2018-288, adopted 28 January 2019 (PDF)', url: 'https://legistar2.granicus.com/richmondva/attachments/f1a9ca45-f510-4bca-aca5-57ab1f4c1de9.pdf' },
    { title: 'Richmond Ordinance 2023-029, adopted 13 February 2023 (PDF)', url: 'https://legistar2.granicus.com/richmondva/attachments/87666009-0d3e-4a81-b6c7-8d74ec1700c1.pdf' },
    { title: 'Code of Virginia § 46.2-100', url: 'https://law.lis.virginia.gov/vacode/title46.2/chapter1/section46.2-100/' },
    { title: 'Code of Virginia § 46.2-903', url: 'https://law.lis.virginia.gov/vacode/title46.2/chapter8/section46.2-903/' },
    { title: 'Code of Virginia § 46.2-904', url: 'https://law.lis.virginia.gov/vacode/title46.2/chapter8/section46.2-904/' },
    { title: 'Code of Virginia § 46.2-905', url: 'https://law.lis.virginia.gov/vacode/title46.2/chapter8/section46.2-905/' },
    { title: 'Code of Virginia § 46.2-907', url: 'https://law.lis.virginia.gov/vacode/title46.2/chapter8/section46.2-907/' },
    { title: 'Code of Virginia § 46.2-908.1', url: 'https://law.lis.virginia.gov/vacode/title46.2/chapter8/section46.2-908.1/' },
    { title: '2026 Acts of Assembly, chapter 737: DMV work group', url: 'https://law.lis.virginia.gov/uncodifiedacts/2026/session1/chapter737/' },
    { title: 'Bird: Richmond open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/richmond/gbfs.json' },
    { title: 'Spin: Richmond open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/richmond_va/gbfs' },
    { title: 'Bird: safety', url: 'https://bird.co/safety/' },
    { title: 'Spin: safety', url: 'https://www.spin.app/safety' },
    { title: 'VCU Parking and Transportation: Off Campus Transportation', url: 'https://parking.vcu.edu/off-campus-transportation/' },
    { title: 'University of Richmond: bicycles, mopeds and scooters', url: 'https://parking.richmond.edu/parking/regulations/bicycles-mopeds-scooters/index.html' },
    { title: 'City of Richmond: James River Park System', url: 'https://www.rva.gov/parks-recreation/james-river-park-system-0' },
    { title: 'Virginia Capital Trail Foundation: trail etiquette', url: 'https://www.virginiacapitaltrail.org/trail-rules' },
    { title: 'Virginia Capital Trail Foundation: FAQs', url: 'https://www.virginiacapitaltrail.org/faqs' },
    { title: 'GRTC: rules of riding', url: 'https://www.ridegrtc.com/rider-guide/rules-of-riding/' },
    { title: 'GRTC: Pulse', url: 'https://www.ridegrtc.com/grtc-services/pulse-brt/' },
    { title: 'GRTC: airport connection', url: 'https://www.ridegrtc.com/grtc-services/airport-connection/' },
    { title: 'RVA Bike Share', url: 'https://rvabikes.com/' },
    { title: 'RVA Bike Share: about', url: 'https://rvabikes.com/about' },
    { title: 'The Richmonder: e-scooters and bike share, 15 July 2025', url: 'https://www.richmonder.org/e-scooters-are-used-more-than-richmonds-bike-share-but-the-city-views-both-as-important-transport-options/' },
    { title: 'City of Richmond: parcels (GIS)', url: 'https://services1.arcgis.com/k3vhq11XkBNeeOfM/arcgis/rest/services/Parcels/FeatureServer/0' },
    { title: 'US Census Bureau: TIGERweb boundaries', url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb' },
  ],
};

export default guide;
