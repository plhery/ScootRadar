import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-fayetteville',
  topic: 'fayetteville',
  name: 'E-scooters in Fayetteville, Arkansas',
  title: 'E-scooters in Fayetteville, AR: Veo, Spin, prices, rules',
  description: 'E-scooters in Fayetteville, AR: renting from Veo and Spin, what a ride costs, the sidewalk and trail rules, and parking at the University of Arkansas.',
  headline: 'E-scooters in Fayetteville, Arkansas: Veo and Spin, what a ride costs, and where to ride and park',
  lede: 'E-scooters in Fayetteville are rented from Veo and Spin, the two operators the University of Arkansas names for the city and its campus. Veo charges $1 to unlock plus $0.38 a minute plus tax (its published rate on 26 October 2026); Spin publishes no price, so check its app. Arkansas law holds e-scooters to 15 mph and riders to 16 or over, Spin requires 18, and no one may ride on a sidewalk that abuts a building.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'us:ar:Fayetteville',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Fayetteville?',
      blocks: [
        'Fayetteville has allowed shared e-scooters since November 2019, under Chapter 75 of the City Code, passed on 16 July 2019. Each operator needs a City permit, which runs for six months. A City permit doesn’t cover the University of Arkansas campus, where the University’s approval is needed too.',
        {
          list: [
            '**Spin** started in November 2019 with 250 scooters, and has belonged to Bird since September 2023. It still trades as Spin, though its open data names Bird Rides as the operator and links the Bird app.',
            '**Veo** ran 440 bikes from autumn 2018 and added 250 e-scooters in March 2020, University news reported.',
            '**Fleet size.** The City first allowed 500 shared scooters. By December 2020 the two operators had 1,000 between them, City staff told the Council, and since January 2021 the City may let an operator add up to 250 at each renewal. The Council’s records give no later total.',
          ],
        },
        'On the evening of Sunday 25 October 2026 the [Fayetteville map](map:us:ar:Fayetteville) showed about 860 scooters, roughly 650 Veo and 210 Spin: what stood there at that moment, not the fleets. An hour later every scooter on the map stood inside the city limits as the Census Bureau draws them, none in Springdale, Johnson or Farmington, and about 240 stood on the University of Arkansas campus as the Bureau maps it.',
        '**Veo rents more than stand-up scooters.** On 26 October Veo’s open data listed about 220 vehicles it classes as electric bikes, besides about 660 stand-up scooters. The map shows standing e-scooters only, so open the Veo app to find one of the others.',
        '**First ride?** Get the Veo or Spin app and scan the scooter’s QR code. See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a Veo or Spin scooter cost in Fayetteville?',
      blocks: [
        'Since January 2021 the City Code has required every price an operator charges, promotions included, to be approved by the City. Veo publishes its rates in its open data, the same for every vehicle; Spin publishes none, so check its app before you unlock.',
        {
          table: {
            caption: 'Veo’s published prices in Fayetteville, 26 October 2026 (plus tax)',
            head: ['Ride', 'Any Veo vehicle'],
            rows: [
              ['Unlock', '$1'],
              ['Per minute', '$0.38'],
              ['10 minutes', '$4.80'],
              ['20 minutes', '$8.60'],
            ],
          },
        },
        'In autumn 2021 the average ride lasted about 10 minutes and cost about $3, University news reported, at the prices of the time.',
      ],
    },
    {
      heading: 'Fayetteville e-scooter rules: age, helmet, speed and sidewalks',
      blocks: [
        'Arkansas’s Act 1015 of 2019 sets the basics for every e-scooter and lets cities add reasonable rules. The University of Arkansas sets out the City’s rider and parking rules in its own traffic regulations, which match the City’s so that riders follow one set of rules on and off campus, the University said in 2019. The operators add theirs.',
        {
          table: {
            caption: 'E-scooter rules in Fayetteville, and who sets them (as published by 26 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '16 or over; Spin requires 18. Check Veo’s terms in its app', 'Ark. Code § 27-51-1903; Spin'],
              ['Insurance', 'The operators must carry it', 'Ark. Code § 27-51-1904'],
              ['Helmet', 'Not required, but the University strongly recommends one', 'The state’s scooter law sets none; University'],
              ['Speed', '15 mph at most; shared scooters slow to 6 mph in slow zones, such as the campus core', 'Ark. Code § 27-51-1903; University'],
              ['Where to ride', 'Where bikes may: bike lanes, paved trails and the right-hand side of the road, with the traffic', 'City Code § 71.170; City rules as the University sets them out'],
              ['Sidewalks', 'Allowed, but not on one that abuts a building, where riding would endanger people walking, or where a sign forbids it. Yield and give an audible signal before you pass', 'City rule as the University sets it out'],
              ['Crosswalks', 'Yield to cars and people walking; to have a pedestrian’s rights, get off and walk', 'City rule as the University sets it out'],
              ['Phone and headphones', 'No phone, headphones or earbuds while riding', 'University'],
              ['Hands', 'Carry nothing that stops you keeping one hand on the handlebars', 'City rule as the University sets it out'],
              ['Passengers and alcohol', 'Only the renter may ride, and never while impaired', 'Spin’s terms'],
            ],
          },
        },
        'The University also bans riding inside its buildings and charging a scooter anywhere on its property.',
      ],
    },
    {
      heading: 'Where you can ride a shared scooter in Fayetteville',
      blocks: [
        'Each app draws its own service area. Spin’s open data also marks 18 no-ride zones, most of them small and seven on the campus, where its terms say a scooter can be slowed to 0 mph. Zoomed in to the streets, the map draws Spin’s no-ride and no-parking zones; Veo publishes no zones, so check its app before you set off.',
        {
          list: [
            '**Streets and bike lanes.** Keep to the right-hand lane, as far right as is safe; you may move out to pass, turn left or avoid a hazard. Where a bike lane runs, you may ride in it.',
            '**Trails.** The City Code allows e-scooters on the City’s shared-use paved trails “only when their use does not create a safety hazard for other trail users”. Along a trail, park only at a trailhead or another spot set aside for it.',
            '**The Razorback Greenway**, 40 miles of paved trail through seven communities from Fayetteville to Bella Vista, has a 15 mph limit, and its website lists scooting among the ways to use it. The map showed shared scooters in Fayetteville only, so plan to end your ride in town.',
            '**The campus core** is a slow zone, where scooters drop to 6 mph.',
          ],
        },
        '**A proposal, not yet law.** An ordinance from Mayor Molly Rawn and Council Member Sarah Bunch, on the City Council’s agenda session of 27 October 2026 for its meeting of 5 November, would bar from sidewalks and paved trails any device able to exceed 28 mph or rated at 750 watts or more, and allow “only Class 1 electric bicycles” on soft-surface trails. Its text would still allow e-scooters, as Arkansas law defines them, on the City’s paved trails.',
      ],
    },
    {
      heading: 'Parking a Veo or Spin scooter in Fayetteville',
      blocks: [
        'The University’s regulations set out the parking rules, which match the City’s:',
        {
          list: [
            '**Upright**, leaving at least 48 inches of sidewalk clear, and never where it would block people walking, wheelchair access or traffic.',
            '**Not on a street or in a parking lot** without permission, and not within 5 feet of a crosswalk or curb ramp.',
            '**Never blocking** a transit stop, loading zone, disabled parking, bench, building entrance or driveway.',
            '**On trails**, only at trailheads or at other spots set aside for parking.',
          ],
        },
        'The University’s own reminders add: don’t park on private property, in front of doors or in the flow of traffic. Report a badly parked scooter through its operator’s app.',
      ],
    },
    {
      heading: 'Scooters at the University of Arkansas, on the buses and beyond',
      blocks: [
        'Spin and Veo both run on the campus, under the University’s own rules: leave a scooter only near a bike rack or in a designated area, such as the marked corrals the apps show, and never on a street or in a parking lot without the University’s permission. This forced parking began as a pilot in spring 2022. Spin’s open data marks most of the central campus, about 0.6 square miles, as a zone you may ride through but not park in.',
        { note: '**Don’t take a shared scooter onto a bus.** Ozark Regional Transit’s conduct policy of April 2026 bars “the boarding, operating, riding or other use of any wheeled transportation device” in its buses and facilities, mobility devices aside. Razorback Transit’s rider guide has no scooter rule but bars any object too large to fit between the seats or that blocks the aisle. End your ride before you board.' },
        'Both bus networks are fare-free: ORT’s fixed routes cost “$0 Fare for now”, and anyone may ride Razorback Transit, on the campus and around town, free. The [Fayetteville map](map:us:ar:Fayetteville) shows the scooters nearest your stop.',
        'That evening no shared scooter stood beyond Fayetteville’s city limits, so none waits at Northwest Arkansas National Airport. Farther afield, the map shows Veo in [Norman](map:us:ok:Norman) and Spin in [Stillwater](map:us:ok:Stillwater), Oklahoma. Columbus, Ohio, has both operators too: see [e-scooters in Columbus](guide:columbus).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Gamedays are the busiest.** In autumn 2021 riders averaged 2,000 to 2,500 scooter trips a day, and 5,000 to 8,000 on gamedays, University news reported.',
            '**Scooter fees help paint bike lanes.** Since 2021 operators have paid the City $30 a scooter for each six-month permit, up from $20. The money runs the programme, then pays for parking areas, signs and bike lane painting, City staff told the Council in December 2020.',
            '**Two fees, not one.** The University charged operators its own $25 a scooter every six months in 2020, on top of the City’s fee, City staff told the Council in the same memo.',
            '**The Razorback Greenway links three major hospitals, 23 schools and the University of Arkansas**, its website says, as well as the headquarters of Walmart.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an e-scooter on the sidewalk in Fayetteville?',
      answer: 'On most, but not on one that abuts a building, where riding would endanger people walking, or where a sign forbids it, under the City’s rules as the University sets them out. Yield and give an audible signal before passing. Streets, bike lanes and paved trails are the better choice.',
    },
    {
      question: 'How much is a Veo scooter in Fayetteville?',
      answer: '$1 to unlock plus $0.38 a minute plus tax, Veo’s published rate on 26 October 2026, so a 10-minute ride costs $4.80 before tax. Its other vehicles cost the same. Spin publishes no price, so check its app before you unlock.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Fayetteville?',
      answer: '16, under Arkansas law. Spin requires riders to be 18; check Veo’s terms in its app. The state’s scooter law sets no helmet rule, but the University strongly recommends one.',
    },
    {
      question: 'Can you ride a scooter on the Razorback Greenway?',
      answer: 'Yes. The City Code allows e-scooters on Fayetteville’s paved trails, and the Greenway has a 15 mph limit. Park along a trail only at a trailhead, and end your ride in Fayetteville, where the map showed every shared scooter.',
    },
    {
      question: 'Where can you park a scooter at the University of Arkansas?',
      answer: 'Only near a bike rack or in a designated area such as a marked scooter corral, and never on a street or in a parking lot without the University’s permission. The apps show the campus parking spots, and scooters slow to 6 mph in the campus core.',
    },
    {
      question: 'Is there a curfew for e-scooters in Fayetteville?',
      answer: 'No. Arkansas’s scooter law sets no riding hours, and neither do the rules the University sets out, which match the City’s. The app shows whether scooters are available late at night.',
    },
  ],
  sources: [
    { title: 'Arkansas: Act 1015 of 2019, electric motorized scooters (PDF)', url: 'https://arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2019R%2FPublic%2FACT1015.pdf' },
    { title: 'City of Fayetteville: City Council agenda packet, 19 January 2021, with Ordinance 6406 and City Code § 75.10 (PDF)', url: 'https://fayettevillear.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=5668,plainText=false)' },
    { title: 'City of Fayetteville: City Council minutes, 19 January 2021 (PDF)', url: 'https://fayettevillear.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=5669,plainText=false)' },
    { title: 'City of Fayetteville: City Council agenda packet, 27 October 2026, with City Code § 71.170 (PDF)', url: 'https://fayettevillear.api.civicclerk.com/v1/Meetings/GetMeetingFileStream(fileId=5985,plainText=false)' },
    { title: 'University of Arkansas: traffic and parking regulations', url: 'https://parking.uark.edu/policies-and-requests/rules-and-regulations.php' },
    { title: 'University of Arkansas: e-scooter safety', url: 'https://safety.uark.edu/e-scooter-safety.php' },
    { title: 'University of Arkansas: campus e-scooter slow zone map (PDF)', url: 'https://safety.uark.edu/eScooter-slow-zone-campus.pdf' },
    { title: 'University of Arkansas: Office for Sustainability, alternatives to driving', url: 'https://sustainability.uark.edu/transportation/alternatives.php' },
    { title: 'University of Arkansas News: two e-scooter vendors launch locally, 13 November 2019', url: 'https://news.uark.edu/articles/50599' },
    { title: 'University of Arkansas News: e-scooter programme expanded, 18 March 2020', url: 'https://news.uark.edu/articles/52562' },
    { title: 'University of Arkansas News: new corrals and e-scooter safety reminders, 21 September 2020', url: 'https://news.uark.edu/articles/54706' },
    { title: 'University of Arkansas News: e-scooter programmes two years in, 28 October 2021', url: 'https://news.uark.edu/articles/58125/e-scooter-programs-lessons-learned-two-years-in' },
    { title: 'University of Arkansas News: new scooter parking plan on campus, 19 January 2022', url: 'https://news.uark.edu/articles/58687/new-scooter-parking-plan-on-campus' },
    { title: 'University of Arkansas: Razorback Transit rider guide (PDF)', url: 'https://parking.uark.edu/_resources/pdf/transit-rider-guide.pdf' },
    { title: 'Ozark Regional Transit: passenger and visitor standard of conduct, April 2026 (PDF)', url: 'https://www.ozark.org/_files/ugd/55d1f9_a590af3db1ca439b952761a76595694f.pdf' },
    { title: 'Ozark Regional Transit: frequently asked questions', url: 'https://www.ozark.org/frequently-asked-questions' },
    { title: 'Razorback Greenway: about the trail', url: 'https://razorbackgreenway.org/about/' },
    { title: 'Veo: Fayetteville open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/fay/gbfs' },
    { title: 'Spin: Fayetteville open data (GBFS)', url: 'https://gbfs.spin.pm/api/gbfs/v2_3/fayetteville/gbfs' },
    { title: 'Spin: US terms of use, updated 23 March 2024', url: 'https://www.spin.app/policies/terms-us' },
    { title: 'Spin: Spin joins Bird, September 2023', url: 'https://www.spin.app/blog-posts/spin-joins-bird-will-continue-to-operate-as-independent-subsidiary-under-spin-brand' },
    { title: 'US Census Bureau: TIGERweb, places and colleges', url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb' },
  ],
};

export default guide;
