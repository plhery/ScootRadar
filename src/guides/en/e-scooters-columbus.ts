import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-columbus',
  topic: 'columbus',
  name: 'E-scooters in Columbus, Ohio',
  title: 'E-scooters in Columbus, Ohio 2026: Veo, Spin, prices, rules',
  description: 'E-scooters in Columbus, Ohio: Veo and Spin, what a ride costs, the Ohio and City rules, the Short North, the Scioto Mile, Ohio State, COTA and winter.',
  headline: 'E-scooters in Columbus, Ohio: Veo and Spin, what a ride costs, the rules and where you can’t ride',
  lede: 'E-scooters in Columbus come from two companies, Veo and Spin, which have run the City’s shared programme since spring 2025. On 17 October 2026 a Veo cost $1 to unlock and $0.39 a minute plus tax, stand-up or seated; Spin publishes no prices, so check its app. You must be 18 to rent, the City bans riding on the sidewalk, and on the Scioto Mile you ride slowly by day and not at all at night.',
  published: '2026-10-18',
  updated: '2026-10-18',
  city: 'us:oh:Columbus',
  sections: [
    {
      heading: 'Which scooter apps work in Columbus?',
      blocks: [
        'The City’s Department of Public Service runs the programme, and the City Code lets its director set the rules for shared scooters and bikes. In spring 2025 the City signed near-identical contracts with Veo, new to Columbus, and Spin, which it kept on. Each may run up to 2,000 vehicles, at least half of them seated, the City said in February 2026.',
        {
          list: [
            '**Veo**: stand-up and seated scooters, e-bikes and pedal bikes, all in the Veo app. It launched on 14 March 2025.',
            '**Spin**, which has joined forces with Bird: Spin’s website and Experience Columbus point you to the Spin app, though Spin’s open data names Bird Rides as the operator and lists the Bird app.',
            '**Lime and Bird** ran scooters here until the start of 2025, when the new agreements replaced them, so older guides naming them are out of date.',
          ],
        },
        'At 15:25 on 17 October 2026 the [Columbus map](map:us:oh:Columbus) showed about 880 Veo and 700 Spin scooters: what was on the map at that moment, not the fleets. The map shows stand-up scooters only, so Veo’s seated scooters, which its open data lists as bicycles, aren’t on it; that evening Veo listed more seated scooters than stand-up ones.',
        '**Visiting?** Get the Veo or Spin app before you set out: both require riders to be 18. The City says Spin also appears in the Lyft app, and Veo in the Transit app. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Columbus?',
      blocks: [
        'On 17 October 2026 Veo’s open data gave one rate for its stand-up and seated scooters: $1 to unlock and $0.39 a minute, plus tax. Spin’s gives no Columbus prices, so check the Spin app before you unlock.',
        {
          table: {
            caption: 'Veo scooter prices in Columbus on 17 October 2026, before tax',
            head: ['Ride', 'Veo, stand-up or seated'],
            rows: [
              ['Unlock', '$1'],
              ['Rate', '$0.39 a minute'],
              ['10 minutes', '$4.90'],
              ['20 minutes', '$8.80'],
              ['30 minutes', '$12.70'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Columbus scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Ohio law calls an e-scooter a “low-speed micromobility device” and doesn’t count it as a vehicle. Section 4511.514 of the Revised Code sets the basics and lets cities regulate or ban scooters on their streets, sidewalks and paths. Columbus adds Chapter 2173 of its City Code, and Ohio State has its own rules on campus. Most breaches are minor misdemeanours, and police may impound the scooter for up to 30 days.',
        {
          table: {
            caption: 'Shared e-scooter rules in Columbus on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to rent a Veo or Spin; Ohio bars renting to under-16s, and the City lets under-16s ride only on shared-use paths', 'The City’s programme policy; Ohio, ORC 4511.514(C); City Code § 2173.02(A)'],
              ['Driver’s licence', 'Required on Ohio State’s campus', 'Ohio State'],
              ['Helmet', 'Required under 18, with a fine of up to $25; Ohio State urges everyone to wear one', 'City Code § 2173.02(B) and (C); Ohio State'],
              ['Speed', '20 mph at most; slower in the Scioto Mile’s daytime slow zone', 'Ohio, ORC 4511.514(D); City Code § 2173.02(A); City zones'],
              ['Where to ride', 'In the bike lane or the traffic lane, no more than two abreast; keep off streets posted over 35 mph unless you’re in a bike lane or on a shared-use path', 'City Code §§ 2173.02(A) and 2173.04'],
              ['Sidewalks', 'Banned, except to reach a property or to park; Ohio State bans them on campus, the Oval included', 'City Code § 2173.10, as Ohio lets cities decide (ORC 4511.514(F)); Ohio State'],
              ['Pedestrians', 'Yield to them at all times, and warn them before you pass', 'Ohio, ORC 4511.514(B); City Code § 2173.07'],
              ['Passengers', 'No more riders than the scooter is built for; Ohio State bars passengers altogether on campus', 'City Code § 2173.02(A); Ohio State'],
              ['Hands and ears', 'At least one hand on the handlebars; no headphones or earbuds on campus', 'City Code §§ 2173.02(A) and 2173.08; Ohio State'],
              ['Alcohol and drugs', 'Spin bans riding under the influence of drugs, alcohol or medication', 'Spin’s terms'],
              ['Parks', 'Open from 7 am to 11 pm; no scooters in nature preserves', 'City Code §§ 919.05 and 919.27'],
              ['Night', 'No riding on the Scioto Mile at night; the City publishes no hours', 'City (Department of Public Service)'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Short North, Scioto Mile and Ohio State: where you can’t ride',
      blocks: [
        {
          list: [
            '**The Short North.** In September 2021 the City geofenced scooters off High Street between 5th Avenue and Goodale Boulevard, citing crime. In summer 2026 it began trying a looser rule: you may ride on High Street but not on its sidewalks, and officials said in August they would keep adjusting it.',
            '**The Scioto Mile.** The City’s zones make it a slow zone by day, a no-ride zone at night and a no-parking zone around the clock. Columbus Recreation and Parks bans scooters in Bicentennial Park and the fountain area. On the evening of 17 October 2026 Spin’s data also marked no-ride blocks around Civic Center Drive and Columbus Commons.',
            '**Ohio State.** Keep off sidewalks and the Oval, a walk zone, and park next to a bike rack, never in a car space or on an ADA ramp. On football game days a scooter parking zone at the RPAC tennis courts, south of Ohio Stadium, opens 4 hours before kickoff and closes 1 hour after; you may not ride or park near the stadium gates.',
            '**Parks and trails.** Columbus Recreation and Parks has more than 230 miles of regional trails, such as the Olentangy Trail from Worthington to downtown. Its trail rules say “Motorized vehicles are not permitted” without saying whether that covers e-scooters, which Ohio law doesn’t count as vehicles: follow the signs. The City’s 2025 checks list Goodale Park as a no-ride zone, and Spin’s data marked Schiller Park in German Village and Franklin Park as no-parking.',
            '**Easton and events.** Spin’s data marked Easton Town Center a no-ride zone. The City sets temporary zones for big events, ten in 2025, such as Comfest at Goodale Park and Red, White & Boom downtown.',
          ],
        },
        'Veo publishes no zones in its open data, so check the map in its app before you set off.',
      ],
    },
    {
      heading: 'Parking a scooter in Columbus',
      blocks: [
        'The City Code bans parking on the sidewalk where a scooter gets in people’s way, including on ADA ramps, by building entrances and at transit stops, and anywhere on the street, parking spaces and loading zones included.',
        {
          list: [
            '**Ride hubs**, which replaced the old CoGo bike docks, are approved places to end a trip, the City says.',
            '**Corrals**: twenty along High Street in the Short North since early 2026, and others downtown and in Harrison West, East Franklinton, Old Town East and German Village.',
          ],
        },
        'City checks in 2025 found about 7% of parked scooters and bikes breaking ADA rules. The companies can penalise riders, and the City gets 75% of those penalties.',
      ],
    },
    {
      heading: 'COTA buses, CMAX and John Glenn airport (CMH)',
      blocks: [
        '**COTA** doesn’t allow shared scooters on its buses or their bike racks, and bans motorised scooters aboard, so end your ride before you board. A two-hour pass costs $2.00 and a day pass $4.50, in the Transit app or on a Smartcard. **CMAX**, COTA’s bus rapid transit line, runs 15.6 miles along Cleveland Avenue between downtown and Westerville.',
        '**John Glenn International Airport (CMH)** is about 10 minutes from downtown, Experience Columbus says, but no shared scooters wait there: at 20:34 on 17 October 2026 neither Veo nor Spin had one within a mile of the terminal. COTA has a ticket machine in arrivals.',
      ],
    },
    {
      heading: 'Do Columbus scooters run in winter?',
      blocks: [
        'Mostly. Veo took all its vehicles off the streets from 27 December 2025 to 16 February 2026, during record-breaking weather, and says its agreement allows seasonal adjustments. Spin cut its fleet in January and February but kept some out. The City said in February 2026 it would work out winter service with both; by mid-October 2026 we found no plan announced for winter 2026–27. If there’s no Veo in midwinter, try Spin or COTA.',
      ],
    },
    {
      heading: 'Dublin, Upper Arlington and other Ohio cities',
      blocks: [
        'On the evening of 17 October 2026 there were no scooters within a mile of central Worthington, Westerville or Upper Arlington, and only a handful in Dublin. Spin’s data let you ride through Grandview Heights, Upper Arlington and Whitehall but not end a ride there.',
        'Elsewhere in Ohio, at 15:25 that day the [Cleveland map](map:us:oh:Cleveland) showed about 320 Bird and 220 Veo scooters, [Toledo](map:us:oh:Toledo) about 580 Veo and [Akron](map:us:oh:Akron) about 385 Spin.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Seated scooters are Columbus’s favourite.** In 2025 Veo’s seated scooter was the programme’s most-ridden vehicle, with about 319,000 rides, and 67% of Veo trips were on seated vehicles.',
            '**The City charges the companies $90 a year for each stand-up scooter, but $20 for a seated one**, plus 5 cents a trip, split 3 cents and 2 cents when a ride crosses onto Ohio State’s campus.',
            '**Spin is here because it sued.** It went to federal court in December 2024, saying the City hadn’t followed its own criteria in choosing Veo; its place is part of the settlement.',
            '**Riders took 812,577 trips in 2025**, down from 1,002,905 in 2024, when Bird, Lime, Spin and CoGo bikes shared the streets.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which scooter companies operate in Columbus, Ohio?',
      answer: 'Veo and Spin, under agreements with the City since spring 2025. At 15:25 on 17 October 2026 the map showed about 880 Veo and 700 Spin scooters.',
    },
    {
      question: 'How much is a Veo scooter in Columbus?',
      answer: 'On 17 October 2026 Veo’s open data gave $1 to unlock and $0.39 a minute, plus tax, for stand-up and seated scooters alike: $4.90 for 10 minutes. Spin publishes no Columbus prices, so check its app.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in Columbus?',
      answer: 'No. The City Code bans it, except to reach a property or to park, and Ohio State bans it on campus. Ride in the bike lane or the traffic lane.',
    },
    {
      question: 'Do you need a helmet to ride a scooter in Columbus?',
      answer: 'Only under 18, under the City Code, with a fine of up to $25. You must be 18 to rent a Veo or Spin, but Ohio State urges every rider to wear one.',
    },
    {
      question: 'Can you take a scooter to an Ohio State game?',
      answer: 'Yes, as far as the scooter parking zone at the RPAC tennis courts, south of Ohio Stadium, open from 4 hours before kickoff to 1 hour after. You may not ride or park near the stadium gates.',
    },
    {
      question: 'Can you take a Veo or Spin scooter on a COTA bus?',
      answer: 'No. COTA bans shared scooters on its buses and their bike racks, so end your ride at the stop.',
    },
  ],
  sources: [
    { title: 'City of Columbus: Shared Mobility, State of the Program 2025 (PDF), February 2026', url: 'https://www.columbus.gov/files/sharedassets/city/v/1/public-service/state-of-mobility-annual-report_final_2-accessible.pdf' },
    { title: 'City of Columbus: Shared Mobility, State of the Program 2025, appendix (PDF)', url: 'https://www.columbus.gov/files/sharedassets/city/v/1/public-service/appendix-state-of-program-2025_2_accessible.pdf' },
    { title: 'Columbus City Codes, Chapter 2173: Bicycles, Motorcycles and Mobility Devices', url: 'https://library.municode.com/oh/columbus/codes/code_of_ordinances?nodeId=TIT21TRCO_CH2173BIMOMODE' },
    { title: 'Columbus City Codes, Chapter 2105, § 2105.28: Shared Mobility Devices', url: 'https://library.municode.com/oh/columbus/codes/code_of_ordinances?nodeId=TIT21TRCO_CH2105SEDIPODU' },
    { title: 'Columbus City Codes, Chapter 919: Park Rules', url: 'https://library.municode.com/oh/columbus/codes/code_of_ordinances?nodeId=TIT9STPAPUPRCO_CH919PARURE' },
    { title: 'Ohio Revised Code § 4511.514', url: 'https://codes.ohio.gov/ohio-revised-code/section-4511.514' },
    { title: 'Ohio State: Scooters', url: 'https://ttm.osu.edu/scooters' },
    { title: 'Ohio State Athletics: Ohio Stadium A–Z guide, 2026', url: 'https://ohiostatebuckeyes.com/sports/2026/8/26/Ohio+Stadium+az-guide' },
    { title: 'Columbus Recreation and Parks: Trails', url: 'https://columbusrecparks.com/facilities/trails/' },
    { title: 'Columbus Recreation and Parks: Central Ohio Greenways', url: 'https://columbusrecparks.com/facilities/trails/central-ohio-greenways/' },
    { title: 'Scioto Mile Fountain', url: 'https://www.sciotomile.com/explore/scioto-mile-fountain/' },
    { title: 'Veo: Columbus open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/cbs/gbfs' },
    { title: 'Spin: Columbus open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/columbus/gbfs' },
    { title: 'Spin', url: 'https://www.spin.app/' },
    { title: 'Spin: Terms of use', url: 'https://www.spin.app/legal' },
    { title: 'Experience Columbus: Get around', url: 'https://www.experiencecolumbus.com/travel-tools/get-around-cbus' },
    { title: 'COTA: Bike & Ride', url: 'https://cota.com/riding-cota/bike-and-ride/' },
    { title: 'COTA: Codes and policies', url: 'https://www.cota.com/about-us/codes-policies' },
    { title: 'COTA: Fares', url: 'https://www.cota.com/fares/' },
    { title: 'COTA: CMAX', url: 'https://www.cota.com/services/cmax/' },
    { title: 'WOSU: Columbus prohibits scooters in Short North, 21 September 2021', url: 'https://wosu.org/news/2021-09-21/columbus-prohibits-scooters-in-short-north' },
    { title: 'WOSU: Report on shared mobility, 19 February 2026', url: 'https://www.wosu.org/politics-government/2026-02-19/columbus-dept-of-public-service-releases-report-on-shared-mobility-services' },
    { title: 'Spectrum News 1: Veo launches new fleet of bikes and scooters in Columbus, 18 March 2025', url: 'https://spectrumnews1.com/oh/columbus/news/2025/03/18/veoride-launches-new-bikes--scooters' },
    { title: 'Axios Columbus: Veo launches, 27 March 2025', url: 'https://www.axios.com/local/columbus/2025/03/28/veo-scooter-bike-vendor-rental-ohio' },
    { title: 'Axios Columbus: Columbus fine-tunes micromobility deal, 26 August 2026', url: 'https://www.axios.com/local/columbus/2026/08/26/scooter-bike-ebike-veo-spin-rental-cost-where' },
  ],
};

export default guide;
