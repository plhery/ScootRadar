import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-calgary',
  topic: 'calgary',
  name: 'Renting an e-scooter in Calgary',
  title: 'E-scooter Calgary 2026: Bird, Lime, rules, fines and season',
  description: 'E-scooter Calgary guide: Bird and Lime, where you may ride (sidewalk, bike lane, pathway, road), the fines, the season, the CTrain, YYC and the Stampede.',
  headline: 'E-scooters in Calgary: Bird and Lime, where you may ride, the fines and winter riding',
  lede: 'You can rent an e-scooter in Calgary from Bird or Lime, which took over Neuron’s scooters in 2026; both show their prices in the app. You must be 18, a helmet is optional, and you ride at up to 20 km/h on sidewalks, bike lanes, pathways and quiet roads without lane markings. The City has published no season dates for 2026–27: its 2021 rules allowed winter riding only at its discretion, so check the app from November.',
  published: '2026-10-16',
  updated: '2026-10-16',
  city: 'ca:ab:Calgary',
  sections: [
    {
      heading: 'Which e-scooter apps work in Calgary, and what do they cost?',
      blocks: [
        'Two companies hold the City of Calgary’s permits for shared e-scooters and e-bikes in October 2026:',
        {
          list: [
            '**Bird**, run by Bird Canada, in the Bird app. Bird Canada has held a City permit since 2021.',
            '**Lime**, in the Lime app, under the five-year permit the City awarded to Neuron in May 2026. Lime Canada bought Neuron Mobility Canada, the City’s other operator since 2021, in July 2026 and took over its Calgary and Airdrie operations; by September the City listed Lime in Neuron’s place.',
          ],
        },
        'Neither publishes a Calgary price outside its app, which shows the fare before you unlock; the City leaves fares to each operator. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
        '**Free 10-minute rides at CTrain stations.** From 15 May 2026 the operators fund free 10-minute trips from dedicated parking at eight LRT stations: Bird at Heritage, Southland, 45th Street and Crowfoot; Neuron, now Lime, at Barlow/Max Bell, Franklin, Rundle and Saddletowne. After 10 minutes the normal rate applies. Neither the City nor Lime has said whether Neuron’s four stations carried over: check the app.',
        'Around midday on 16 October 2026 the [map of Calgary](map:ca:ab:Calgary) showed about 960 Bird and 820 Lime scooters: a map count, not the fleet size. Both companies also rent e-bikes, which our map doesn’t show. Lime also runs in **Airdrie**, the separate city just north, under that city’s own rules: about 240 of its scooters were on the [Airdrie map](map:ca:ab:Airdrie) that day.',
      ],
    },
    {
      heading: 'Calgary’s e-scooter programme: permits, caps and what changed',
      blocks: [
        'Alberta’s Traffic Safety Act treats an e-scooter as a motor vehicle, and without a provincial exemption it may not use roads or sidewalks. Shared e-scooters have one, the City says: their speed and where they ride are controlled, and each operator must be insured.',
        'A two-year shared e-bike and e-scooter pilot, from October 2018 to October 2020, logged 1.9 million trips with Lime, Bird Canada and Roll. In 2021 Bird Canada and Neuron got five-year permits. Since then:',
        {
          list: [
            '**July 2024:** a trial banned riding on 17 Avenue S.W. between 4 and 8 Street S.W. and allowed parking there only in corrals. We found no later City update, and Bird’s open data showed no zone there in October 2026: check the app.',
            '**15 May 2026:** Bird Canada and Neuron won new five-year permits through a competitive request for proposals, and the free station rides began.',
            '**September 2026:** a City memo, quoted on the [Ward 2 councillor’s page](https://www.calgary.ca/council/ward-2/articles/an-update-on-e-mobility-.html), counted 210 pathway speeding tickets in a month, 45 of them to riders of private e-scooters. A bylaw review is expected to report to Council in early 2027.',
          ],
        },
        'The 2026 permits’ fleet caps haven’t been published. The City’s page still quotes the 2021 cap of 750 scooters per operator, below Bird’s count on our map.',
      ],
    },
    {
      heading: 'E-scooter rules in Calgary and Alberta in 2026',
      blocks: [
        'Alberta decides whether e-scooters may use roads and sidewalks at all; the City’s bylaws and permits say where and how you ride, and set most fines; Canada’s Criminal Code covers impaired riding.',
        {
          table: {
            caption: 'Rules for shared e-scooters in Calgary on 16 October 2026',
            head: ['Rule', 'What applies', 'Set by', 'Fine'],
            rows: [
              ['Age', '18 or over', 'City permit rules', '–'],
              ['Licence', 'None in the City’s rules', 'City', '–'],
              ['Helmet', 'Encouraged, not required; compulsory at any age on an e-bike', 'City; Alberta for e-bikes', '–'],
              ['Speed', '20 km/h, built in; 15 km/h in slow zones', 'City permit rules', '–'],
              ['Pathway speed', '20 km/h unless signed', 'City Parks and Pathways Bylaw', 'C$150 up to 10 km/h over, C$400 beyond'],
              ['Sidewalk', 'Allowed unless a sign says no; keep to the road side, don’t get in people’s way', 'City Traffic Bylaw', 'C$75 where signed; C$150 for getting in the way'],
              ['Road', 'Only roads without lane markings, near the right edge; on a marked road, only in a bike lane', 'City Traffic Bylaw', 'C$25'],
              ['Crosswalk', 'Walk across, or stop, yield and ride across on WALK', 'City Traffic Bylaw', 'C$25'],
              ['Lights at night', 'In a bike lane from half an hour after sunset; on pathways from sunset to sunrise', 'City bylaws', 'C$100 in a bike lane, C$250 on a pathway'],
              ['Passengers', 'One rider only', 'City Traffic Bylaw', 'C$75'],
              ['Reckless riding, collisions', 'Riding recklessly, or failing to avoid hitting someone on the sidewalk or street', 'City Traffic Bylaw', 'C$400 each'],
              ['Transit', 'No riding on buses or trains, at stations and on platforms, or in the 7 Avenue transit corridor', 'City Transit Bylaw', 'C$250'],
              ['Alcohol and drugs', 'Impaired to any degree, or 80 mg of alcohol per 100 mL of blood', 'Canada’s Criminal Code', 'Criminal charge'],
            ],
          },
        },
        { note: '**Never ride on a road with painted lane markings unless you’re in a bike lane.** Busy roads like Macleod Trail are off limits: use the sidewalk, a bike lane or a pathway.' },
        '**Alcohol.** Alberta’s roadside sanctions for impaired drivers leave out a one-person e-scooter at up to 30 km/h, but the [Criminal Code](https://laws-lois.justice.gc.ca/eng/acts/C-46/section-320.14.html) counts any vehicle with a motor, and the City says impaired riding is punishable “to the full extent of the Canadian Law”.',
      ],
    },
    {
      heading: 'Where can you ride: sidewalks, bike lanes and pathways',
      blocks: [
        'The City’s advice: ride in bike lanes, on pathways, on empty sidewalks and on quieter roads such as 13 Avenue S.W., not on busy ones like Macleod Trail.',
        {
          list: [
            '**Sidewalks.** Keep to the road side; people on foot come first.',
            '**Roads and bike lanes.** Ride only on roads without lane markings, near the right edge, or in a bike lane on any road. Yield when you come off a sidewalk or pathway onto a road.',
            '**Pathways.** The regional pathways along the Bow and Elbow rivers and beyond are open at 20 km/h. Keep right and give an audible signal before you pass. Along the Bow River pathway, keep off the pedestrian path and the walk-only zone: use the bike path or the signed detour.',
            '**Slow zones.** The scooters slow to 15 km/h on 4 Street S.W. in Mission, 9 Avenue S.E. in Inglewood, 8 Avenue S.W. downtown, Stephen Avenue included, and 10 Street N.W. and Kensington Road in Kensington.',
          ],
        },
        'A 2019 City bylaw poster marks Stephen Avenue as open to shared e-scooters. In parks such as Prince’s Island, ride only on the pathways.',
        '**No riding** in the 7 Avenue transit corridor, where the CTrain crosses downtown between 4 Street S.E. and 11 Street S.W., sidewalks and platforms included, or at CTrain stations and other transit property. The City’s 2021 permit rules also rule out bus zones, buildings, the +15 skyways and City parkades.',
      ],
    },
    {
      heading: 'Where to park a rental scooter in Calgary',
      blocks: [
        'Park upright in the sidewalk’s furniture zone, in line with the trees, bike racks and bins, or in a painted share-and-go zone. Where there’s no furniture zone, leave at least 2 m of sidewalk clear. The operators may fine you for bad parking.',
        'Bird’s open data lists 241 no-parking zones, where you can ride through but not end a ride, none of them named. Testing landmarks on 16 October 2026, we found these inside: Stampede Park, the BMO Centre included; the riverbank through East Village, St. Patrick’s Island and the Calgary Zoo; Nose Hill Park; and the City Hall and Calgary Tower blocks. The app shows the rest.',
        'Lime publishes no zone data, so check its app before you end the ride.',
      ],
    },
    {
      heading: 'When is e-scooter season in Calgary, and what about winter?',
      blocks: [
        'The City hasn’t published season dates for 2026–27. Its 2021 permit rules ran the season from 16 March to 31 October, and let operators run from 1 November to 15 March only “if weather permits, and at the discretion of The City”. A 2024 City information sheet says the programme offers e-scooters and e-bikes year-round. From November, check the app.',
        'The City clears snow from about 400 km of paved regional pathways, usually within 24 hours of a snowfall.',
        '**When the scooters are gone.** Bird and Lime also rent e-bikes, which follow bicycle rules: any road a bike may use except Deerfoot Trail, and a helmet is compulsory. All year, an adult Calgary Transit fare is C$4.00 for 90 minutes.',
      ],
    },
    {
      heading: 'CTrain, YYC airport and the Calgary Stampede',
      blocks: [
        '**On the CTrain.** Riding an e-scooter at a station, on a platform or aboard a bus or train can cost C$250 under the Transit Bylaw. The bylaw doesn’t ban carrying one aboard, but the City’s 2021 permit rules allowed shared scooters on trains only off-peak. End your ride outside the station, or in the scooter parking at the eight free-ride stations.',
        '**YYC Calgary International Airport.** Scooters don’t reach it: the terminal lies outside Bird’s service area, and on 16 October 2026 neither company had a scooter within 4 km of it. Take [Route 100](https://www.yyc.com/en-us/transportation/public-transit) to Saddletowne station on the Blue Line, or the Route 500 express downtown.',
        '**The Calgary Stampede**, next held 9–18 July 2027. In 2026 there was scooter-only parking at 13 Avenue and Stampede Trail, at the north end, and bike and scooter parking at Lot 7/8 and Lot 10/11. CTrains ran 24 hours a day to Erlton/Stampede and Victoria Park/Stampede stations.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**For tickets, the scooter company counts as the owner.** Under the Traffic Bylaw, Bird or Lime is liable for an offence with its scooter unless it shows who rode it; the rider can be charged too.',
            '**The City calls Calgary’s pathways the most extensive urban pathway and bikeway network in North America:** about 1,000 km of regional pathways and 290 km of on-street bikeways.',
            '**Calgary lets rental scooters ride the sidewalk.** Edmonton banned e-scooters from its sidewalks during its own pilot.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an e-scooter on the sidewalk in Calgary?',
      answer: 'Yes, a rental one, unless a sign forbids it. Keep to the side nearest the road and don’t get in people’s way: the fines are C$75 where a sign forbids it and C$150 for getting in the way. Private e-scooters may not use sidewalks.',
    },
    {
      question: 'How much does a Lime or Bird scooter cost in Calgary?',
      answer: 'Neither company publishes a Calgary price outside its app, which shows the unlock fee and the rate per minute before you start. From 15 May 2026 the operators offered free 10-minute rides from eight CTrain stations.',
    },
    {
      question: 'Do you need a helmet or a licence for a rental e-scooter in Calgary?',
      answer: 'No. The City’s rules require riders to be 18 or over, encourage a helmet without requiring one and set no licence requirement. Alberta law makes a helmet compulsory on an e-bike, shared ones included.',
    },
    {
      question: 'Can you ride an e-scooter drunk in Alberta?',
      answer: 'No. Alberta’s roadside sanctions leave e-scooters out, but the Criminal Code’s impaired-operation offences, including the 80 mg limit, cover any vehicle with a motor.',
    },
    {
      question: 'Are e-scooters available in Calgary in winter?',
      answer: 'No dates have been published for 2026–27. The City’s 2021 rules ran the season from 16 March to 31 October, with winter riding only if the weather and the City allow; a 2024 City sheet says the programme runs year-round. Check the app from November.',
    },
    {
      question: 'Can I ride my own e-scooter in Calgary?',
      answer: 'Only on the City’s pathways, at up to 20 km/h. Alberta’s exemption covers only shared scooters, so a private one may not use roads or sidewalks.',
    },
  ],
  sources: [
    { title: 'City of Calgary: shared e-scooters and e-bikes', url: 'https://www.calgary.ca/bike-walk-roll/electric-scooters.html' },
    { title: 'City of Calgary: free trips at Calgary Transit stations (15 May 2026)', url: 'https://newsroom.calgary.ca/companies-funding-free-e-scooter-and-e-bike-trips-at-select-calgary-transit-stations/' },
    { title: 'City of Calgary: using e-bikes and e-scooters, rules and fines', url: 'https://www.calgary.ca/roads/safety/escooter-safety.html' },
    { title: 'Calgary Traffic Bylaw 26M96', url: 'https://publicaccess.calgary.ca/lldm01/livelink.exe?func=ccpa.general&msgID=SyAccKqKqW&msgAction=Download' },
    { title: 'Calgary Parks and Pathways Bylaw 11M2019', url: 'https://publicaccess.calgary.ca/lldm01/livelink.exe?func=ccpa.general&msgID=GTTAeyAcAcD&msgAction=Download' },
    { title: 'Calgary Transit Bylaw 4M81', url: 'https://publicaccess.calgary.ca/lldm01/livelink.exe?func=ccpa.general&msgID=PyAccATqyZ&msgAction=Download' },
    { title: 'City of Calgary: e-scooter program framework, appendices (2021)', url: 'https://www.calgary.ca/content/dam/www/transportation/tp/documents/cycling/cycling-strategy/electric-scooter-program-framework-appendices.pdf' },
    { title: 'City of Calgary: electric micromobility information sheet (2024)', url: 'https://www.calgary.ca/content/dam/www/uep/esm/publishingimages/electric-mobility/electric-micromobility-info-sheet.pdf' },
    { title: 'Alberta Traffic Safety Act', url: 'https://kings-printer.alberta.ca/documents/Acts/T06.pdf' },
    { title: 'Global News: Lime to take over Neuron in Canada (6 July 2026)', url: 'https://globalnews.ca/news/11954622/lime-to-take-over-some-e-scooter-operations-in-canada-from-neuron-amid-acquisition/' },
    { title: 'Calgary Stampede: getting to Stampede 2026', url: 'https://news.calgarystampede.com/releases/fast-track-to-fun-your-guide-to-getting-to-stampede-2026' },
    { title: 'Bird: open data for Calgary (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/calgary/gbfs.json' },
  ],
};

export default guide;
