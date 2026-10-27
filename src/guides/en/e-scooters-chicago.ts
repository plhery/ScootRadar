import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-chicago',
  topic: 'chicago',
  name: 'E-scooters in Chicago',
  title: 'Chicago e-scooters 2026: Lime hours, Divvy prices, rules',
  description: 'Lime runs 5 am to midnight, Divvy at any hour. Divvy: $1 to unlock plus $0.44 a minute; Lime’s price is in its app. 15 mph max, no sidewalks or Lakefront Trail.',
  headline: 'E-scooters in Chicago: Lime and Divvy, what a ride costs, the rules, and where you can’t ride',
  lede: 'E-scooters in Chicago come from two apps: Lime, the one company with a City scooter-sharing licence, and Divvy, the City’s bike-share system, run by Lyft. A Divvy scooter costs $1 to unlock plus $0.44 a minute plus tax (published rate, 17 October 2026); Lime shows its price only in the app. Shared scooters top out at 15 mph, run all year and must keep off sidewalks, the Lakefront Trail, The 606 and the Riverwalk. Divvy’s can be rented at any hour, Lime’s from 5 am to midnight.',
  published: '2026-10-17',
  updated: '2026-10-23',
  city: 'us:il:Chicago',
  sections: [
    {
      heading: 'Which scooter apps work in Chicago?',
      blocks: [
        'Two scooter services run in Chicago in October 2026:',
        {
          list: [
            '**Lime**, the only company the City lists with a scooter-sharing licence; the City’s records show it renewed to 15 June 2028. The code caps licensed scooters at 12,500 in all. Few stand downtown: the City keeps Lime out of the Central Business District, where only Divvy operates, the Sun-Times reported.',
            '**Divvy**, the City-owned bike-share system, which Lyft runs under contract. Its scooters unlock in the Divvy or Lyft app, dock at stations or lock to a rack, and fall outside the licence caps.',
          ],
        },
        'Spin’s City licence ran out on 15 June 2026 and wasn’t renewed, and Superpedestrian left in 2023, so the City lists no third company.',
        'On the evening of 16 October 2026 the [map of Chicago](map:us:il:Chicago) showed about 11,300 Lime scooters and 920 Divvy scooters left outside a station: what’s on the map, not the fleets. **Since 17 October it also shows the Divvy scooters standing in a dock**, each at its station: 928 more that morning, at 353 stations.',
        '**Visiting?** Get Lime or the Divvy app before you go. Divvy sells single rides in the app; its kiosks sell classic-bike rides only. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Chicago?',
      blocks: [
        'Divvy publishes its scooter rates; Lime shows its price only in the app. The City requires its licensee to offer low-cost options to Chicagoans with financial barriers: ask Lime in the app.',
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
        'Divvy adds tax to these prices. New members could join Divvy Annual for $99 a year on 17 October 2026, a limited-time offer; Divvy for Everyone costs qualifying residents $5 a year.',
        '**Where you leave a Divvy scooter matters.** Docking at a Divvy station is free, and so is locking it at one of the over 600 public racks the app lists. Anywhere else that’s legal costs an extra fee, up to $3 on Divvy’s pages in October 2026, and its scooter page puts a parking violation at $25.',
      ],
    },
    {
      heading: 'Chicago scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Most rules come from the Chicago Municipal Code, whose bicycle chapter also covers scooters, and the City’s rules for its licensee, Lime. Illinois’s current scooter law, which sets a minimum age of 18, is written for scooters that top out at 10 mph, and Chicago’s shared ones reach 15; a new state law changes the rules in 2027.',
        {
          table: {
            caption: 'Shared e-scooter rules in Chicago on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', 'The City: 18, or 16 and 17 with a parent’s or guardian’s consent. Divvy: 16 and over. Lime: check its app', 'City; Divvy'],
              ['Driving licence', 'Not asked for: the City sets only an age', 'City'],
              ['Helmet', 'Advised: the City says always wear one', 'City; operators'],
              ['Speed', '15 mph at most; 10 mph on your first ride', 'City'],
              ['Hours', 'Divvy: any hour. Lime: 5 am to midnight', 'Operators; City page'],
              ['Where to ride', 'Bike lanes and paths; the street where there’s no bike lane; never Lake Shore Drive', 'Municipal Code 9-103-130 and 9-52-020'],
              ['Sidewalks', 'Banned, except a sidewalk marked as a bike route or the short way to the street, a bike path or a bike-share station', 'Municipal Code 9-52-020'],
              ['Passengers', 'One rider only', 'City; Divvy'],
            ],
          },
        },
        { note: '**Ride on a sidewalk and the scooter can tell.** The City’s licence makes Lime fit sidewalk-riding detection to its whole fleet, and Divvy’s newer scooters spot sidewalks with a vision system, the City says.' },
      ],
    },
    {
      heading: 'Where you can’t ride: the Lakefront Trail, The 606 and Navy Pier',
      blocks: [
        'Shared scooters stop when they enter a no-ride zone. The City’s scooter page bars them from the Lakefront Trail, The 606 and the Riverwalk, and geofences have kept them off The 606, the Riverwalk and O’Hare for years, the Sun-Times reported:',
        {
          list: [
            '**The Lakefront Trail.**',
            '**The 606**, or Bloomingdale Trail.',
            '**The Chicago Riverwalk.**',
            '**O’Hare Airport.**',
          ],
        },
        'Since July 2026 a fifth zone covers **Sheridan Road from Devon Avenue to Bryn Mawr Avenue** in Edgewater, street and sidewalks, the Sun-Times reported: use the Winthrop and Kenmore avenue greenways instead.',
        '**Navy Pier**’s guest code bans unauthorised personal transportation devices, and bike riding on its South Dock and East End Plaza. Divvy has a station and racks by the pier: end your ride there and walk.',
        '**The parks.** The Chicago Park District is gathering ideas for rules on e-scooters and e-bikes on its bike paths and trails, to go with the state law that takes effect on 1 January 2027.',
      ],
    },
    {
      heading: 'Parking a scooter in Chicago',
      blocks: [
        'Chicago is a lock-to city: a trip ends only when the scooter is locked to a fixed object. Use a bike rack, a retired parking meter, a street sign or a light pole, keep the scooter upright, and leave a clear path at least 5 feet wide on the sidewalk. Divvy riders can also dock at a Divvy station.',
        {
          list: [
            '**Never lock to** a private fence, a bus shelter, a bus stop sign, a disabled parking sign or anything inside a CTA ‘L’ station.',
            '**Keep clear of** building fronts, fire hydrants, bus stops, ‘L’ entrances and loading zones.',
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
        '**Midway.** Divvy has a station at the Midway Orange Line stop, and Lime scooters stood nearby on the night of 16 October 2026. The Orange Line takes 20 to 25 minutes to the Loop but doesn’t run overnight.',
      ],
    },
    {
      heading: 'Winter, night rides and what changes in 2027',
      blocks: [
        {
          list: [
            '**Winter.** Scooters run all year: riders took about 180,000 trips on Lime and Divvy in January 2025, the City’s open data shows.',
            '**Night.** The City’s trip data to the end of 2025 shows Divvy rides at every hour but next to no Lime trips between midnight and 5 am, in line with the City’s scooter page.',
            '**A new state law from 1 January 2027.** SB 3484, signed in August 2026, brings one set of e-scooter rules to the whole state in place of a patchwork of local ones, the Sun-Times reported. Riders must be at least 16, down from 18, and may use roads, bike lanes and paths; police may fine those who break the rules and impound their scooters, Capitol News Illinois reported.',
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
      answer: 'No, except on a sidewalk marked as a bike route or for the short way to the street, a bike path or a bike-share station, under the Municipal Code. The City’s licence also makes Lime fit its scooters with sidewalk-riding detection.',
    },
    {
      question: 'How old do you have to be to ride a scooter in Chicago?',
      answer: 'The City allows riders of 18 and over, and of 16 and 17 with a parent’s or guardian’s consent. Divvy says 16 and over; check Lime’s app for its own minimum. From 1 January 2027 state law sets the minimum at 16, the Sun-Times reported.',
    },
    {
      question: 'How much does a scooter ride cost in Chicago?',
      answer: 'A Divvy single ride costs $1 to unlock plus $0.44 a minute, so 10 minutes comes to $5.40 before tax (published rate, 17 October 2026). Lime shows its Chicago price only in the app.',
    },
    {
      question: 'Are Chicago scooters available at night and in winter?',
      answer: 'Divvy scooters run at all hours; Lime’s rides stop between midnight and 5 am. Both run all winter: riders took about 180,000 trips in January 2025.',
    },
    {
      question: 'Can you take a Divvy scooter on the ‘L’?',
      answer: 'No. The CTA bans Divvy and other bike-share scooters on its trains and buses and in the paid areas of stations, so end your ride before you go in.',
    },
  ],
  sources: [
    { title: 'City of Chicago: scooter sharing in Chicago', url: 'https://www.chicago.gov/city/en/depts/cdot/supp_info/escooter-share-pilot-project.html' },
    { title: 'City of Chicago open data: business licences', url: 'https://data.cityofchicago.org/Community-Economic-Development/Business-Licenses/r5kz-chrr' },
    { title: 'Chicago City Council: scooter sharing ordinance SO2021-2861, chapter 9-103, passed 14 October 2021 (PDF)', url: 'https://occprodstoragev1.blob.core.usgovcloudapi.net/lsmatterattachmentspublic/0769d1f4-aa71-4748-85c0-5e2f4994d7f6.pdf' },
    { title: 'Chicago City Council: scooter sharing licence ordinance O2024-0008378, passed 17 April 2024 (PDF)', url: 'https://occprodstoragev1.blob.core.usgovcloudapi.net/matterattachmentspublic/bf20719b-53fc-4bd7-b28a-27fe477bddfd.pdf' },
    { title: 'Chicago City Council: proposed ordinance O2025-0015514, with the text of Municipal Code 9-52-020 (PDF)', url: 'https://occprodstoragev1.blob.core.usgovcloudapi.net/matterattachmentspublic/2b2d05dd-ea25-419d-a769-677ba9e9e11f.pdf' },
    { title: 'City of Chicago: new Divvy e-scooters with sidewalk detection, June 2023', url: 'https://www.chicago.gov/city/en/depts/cdot/provdrs/future_projects_andconcepts/news/2023/june/cdot-and-lyft--new-divvy-e-scooters-rolling-out-in-chicago-with-.html' },
    { title: 'Village of Lombard: e-scooter rules under Illinois law', url: 'https://www.villageoflombard.org/565/E-Bikes-Scooter-Safety' },
    { title: 'Chicago Park District: micromobility in the parks', url: 'https://www.chicagoparkdistrict.com/micromobility-parks' },
    { title: 'Divvy: pricing', url: 'https://divvybikes.com/pricing' },
    { title: 'Divvy: how it works', url: 'https://divvybikes.com/how-it-works' },
    { title: 'Divvy: how scooters work', url: 'https://divvybikes.com/how-it-works/scooter' },
    { title: 'CTA: Bike & Ride', url: 'https://www.transitchicago.com/bikeandride/' },
    { title: 'City of Chicago open data: e-scooter trips', url: 'https://data.cityofchicago.org/Transportation/E-Scooter-Trips/2i5w-ykuw' },
    { title: 'Navy Pier: guest code of conduct', url: 'https://navypier.com/plan-your-visit/guest-safety/guest-code-of-conduct/' },
    { title: 'Chicago Sun-Times: City bans shared e-scooters from Sheridan Road, 27 July 2026', url: 'https://chicago.suntimes.com/transportation/2026/07/27/divvy-lime-scooter-sheridan-sidewalk-edgewater' },
    { title: 'Chicago Sun-Times: Pritzker signs e-bike regulation bill into law, 26 August 2026', url: 'https://chicago.suntimes.com/transportation/2026/08/26/pritzker-signs-e-bike-moto-regulation' },
    { title: 'Capitol News Illinois: new Illinois law establishes rules for e-bikes, scooters, 26 August 2026', url: 'https://capitolnewsillinois.com/news/new-illinois-law-establishes-rules-for-electronic-bikes-scooters/' },
    { title: 'Chicago Sun-Times: Lime warns Divvy deal could push company from Chicago, 5 October 2026', url: 'https://chicago.suntimes.com/transportation/2026/10/05/lime-scooter-divvy-expansion' },
  ],
};

export default guide;
