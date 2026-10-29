import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-hartford',
  topic: 'hartford',
  name: 'E-scooters in Hartford, Connecticut',
  title: 'E-scooters in Hartford 2026: Veo scooters and CT rules',
  description: 'E-scooters in Hartford: renting Veo, what a ride costs, the City’s no-ride zones and Connecticut’s rules on helmets, sidewalks, lights and parking.',
  headline: 'E-scooters in Hartford: renting a Veo scooter, Connecticut’s rules, and where you can ride',
  lede: 'E-scooters in Hartford come from Veo, brought in by the City and the Capitol Region Council of Governments (CRCOG) in August 2024 after the Link scooters left; it is the only company our Hartford map counts. Veo’s published rate on 29 October 2026 was $1 to unlock and 36 cents a minute, plus tax, and the City set the riding age at 18. Connecticut law treats you much like a cyclist, with a helmet under 18 and a light after dark, and the City’s 2024 plan made Pratt Street, the Riverwalk and the CTfastrak busway no-ride zones.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'us:ct:Hartford',
  sections: [
    {
      heading: 'Electric scooter rental in Hartford: who runs it?',
      blocks: [
        '**Veo** has rented stand-up scooters in Hartford since 28 August 2024. From 2021 to 2023 the City and the Capitol Region Council of Governments (CRCOG) hosted Link scooters, run by Superpedestrian, until the company stopped its US operations at the end of 2023. CRCOG then reviewed other companies and chose Veo; as a member town, Hartford hosts Veo under CRCOG’s regional agreement.',
        'The City set this out in its text of 28 August 2024, which the Hartford Chamber of Commerce reposted on 10 December 2024. Its plan began with 220 stand-up scooters downtown, then up to 600 across the city from late September; from December to February the fleet would shrink with the weather and demand, and in spring return to up to 600, perhaps with bikes. We found no later agreement, cap or end date, so these 2024 figures may have changed.',
        'At 2:06 p.m. on Thursday 29 October 2026 the [Hartford map](map:us:ct:Hartford) showed about 760 Veo scooters at that moment: a snapshot, not a fleet size. The total is not a count within the city limits: it takes in a few scooters just over the line in West Hartford and Bloomfield, but not the 8 to 10 that stand at one spot in an industrial park in East Hartford, across the river, most likely a depot.',
        'The map shows each scooter’s position, range and price. Scooters on a ride aren’t shown, nor Veo’s zones or parking spots, nor any Veo bikes. We found no other company with a City agreement in 2026. **First ride?** See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a Veo scooter cost in Hartford?',
      blocks: [
        'Veo publishes its Hartford rate in its open data. On 29 October 2026 it was $1 to unlock and $0.36 a minute, plus tax. The Veo app shows your final price before you unlock.',
        {
          table: {
            caption: 'Veo’s published prices in Hartford, 29 October 2026, before tax',
            head: ['Ride', 'Price'],
            rows: [
              ['Unlock', '$1'],
              ['Per minute', '$0.36'],
              ['10-minute ride', '$4.60'],
              ['20-minute ride', '$8.20'],
              ['30-minute ride', '$11.80'],
            ],
          },
        },
        '**Low-income plan.** At the launch, Mayor Arunan Arulampalam described a $5-a-month subscription for low-income residents that gives 30 minutes of riding a day, WFSB reported on 30 August 2024. Check in the app whether it still runs and whether you qualify.',
        '**Age.** Riders must be 18, the City’s 2024 text said. We found no minimum age in Connecticut law.',
      ],
    },
    {
      heading: 'Scooter rules in Connecticut: what applies in Hartford',
      blocks: [
        'Connecticut allowed e-scooters on 1 October 2019 (Public Act 19-162), giving riders the rights and duties of cyclists and letting towns add their own rules. The law now calls them “electric scooters”: two or three wheels and handlebars, standing or seated, no faster than 20 mph, and up to 110 lb since 1 October 2026 (100 lb before). On the road you have a driver’s rights and duties.',
        {
          table: {
            caption: 'E-scooter rules in Hartford on 29 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to ride a Veo; no state minimum found', 'City of Hartford (2024)'],
              ['Helmet', 'Under 18s must wear one on any road and in any park, since 1 October 2025. Not an offence: police may warn a parent. Recommended for everyone', 'CGS § 14-286d'],
              ['Where to ride', 'When slower than traffic, keep as far right as is safe, except to pass, turn left, avoid hazards or use a bike lane; on a one-way street you may keep left. No more than two abreast, within one lane', 'CGS § 14-286b'],
              ['Sidewalks and crosswalks', 'Allowed unless a town ordinance or a state traffic rule bans it; give way to people walking and warn them before you pass', 'CGS § 14-286'],
              ['Passengers', 'None, unless the scooter is built for one', 'CGS § 14-286b'],
              ['Hands', 'At least one hand on the handlebars; carry nothing that stops you using both', 'CGS § 14-286b'],
              ['Hitching a ride', 'Never hold on to a moving vehicle', 'CGS § 14-286b'],
              ['Lights', 'From half an hour after sunset to half an hour before sunrise, and in rain, snow, fog or poor light: a white front light seen from 500 feet. A rear reflector, reflective material on both sides and a working brake at all times', 'CGS §§ 14-288 and 14-96a'],
              ['Alcohol', 'No rule written for e-scooters found; on the road you have a driver’s duties, so don’t ride after drinking', 'No e-scooter rule found; CGS § 14-286a'],
              ['Penalties', 'Breaking the riding, sidewalk, parking or lighting rules is an infraction', 'CGS §§ 14-286, 14-286b, 14-288'],
            ],
          },
        },
        { note: '**Hartford’s no-ride zones.** The City’s plan of August 2024 made highway ramps, the CTfastrak busway, Pratt Street, parking garages, Heaven Skate Park and the Riverwalk no-ride zones for shared scooters, and parks and Constitution Plaza slow-ride zones. Any of these can also be no-parking, so end your ride outside. The Veo app shows the zones in force now.' },
        'We found no night curfew. The City’s 2024 plan expected a smaller fleet in winter rather than a pause.',
      ],
    },
    {
      heading: 'Can you ride on the sidewalk, in Bushnell Park or by the river?',
      blocks: [
        '**Sidewalks: best not.** State law allows riding on a sidewalk unless the town bans it, as long as you give way to people walking and warn them before passing. We found no Hartford rule either way; the City’s 2024 text tells Veo riders to follow the standard rules of the road, so use the street or a bike lane.',
        {
          list: [
            '**Bushnell Park**: the Bushnell Park Foundation allows bikes on the park’s paths, with care and giving way to people on foot, and on the Bushnell promenade along its northern edge. Its page sets no rule for scooters. The City’s 2024 plan made parks slow-ride zones. Bike racks stand by the Pump House, the Carousel and Corning Fountain.',
            '**The Riverwalk and Riverfront Recapture’s parks**: the City’s 2024 plan made the Riverwalk a no-ride zone. Riverfront Recapture’s rules ban unauthorised motorized vehicles on every path and walkway, tell cyclists to give way to people walking, and open the parks from sunrise to sunset.',
            '**Constitution Plaza**: slow-ride; **Pratt Street** and **Heaven Skate Park**: no-ride, in the City’s 2024 plan.',
            '**Trinity College**: we found no college rule on e-scooters on its campus.',
            '**UConn Hartford**: since 31 August 2023 UConn has banned storing, charging or servicing lithium-ion scooters and e-bikes in its buildings, at every campus. Leave a Veo outside.',
          ],
        },
      ],
    },
    {
      heading: 'Where to park a Veo in Hartford',
      blocks: [
        'State law lets you park an e-scooter on a sidewalk if it doesn’t block people walking or other traffic, and no town ordinance or state traffic rule forbids it there. In 2024 the City said it would add or refresh scooter parking downtown and in other busy areas.',
        {
          list: [
            '**End-of-ride photo.** Veo’s app asks for one, and its parking coach tells you how to fix a badly parked scooter before you can end the ride, the City said in 2024.',
            '**Not in a no-ride zone**: these can be no-parking too, so the app may make you move on.',
            '**Report a problem** scooter to Hartford 311, at 860-757-9311.',
            '**Find one**: the [Hartford map](map:us:ct:Hartford) shows the nearest Veo and the walk to it.',
          ],
        },
      ],
    },
    {
      heading: 'CTtransit buses, Union Station and the Hartford Line',
      blocks: [
        '**CTtransit.** Folding scooters and bikes may ride on board: folded, held by you, out of the aisles and exits, and not in the wheelchair area. Non-folding ones may not, and the outside racks take only two-wheeled bikes up to 55 lb, so a Veo stays on the street.',
        '**Union Station.** Hartford Union Station stands across the street from Bushnell Park and serves CTrail’s Hartford Line and CTfastrak routes 101, 102 and 128. Don’t ride on the busway: the City’s 2024 plan made it a no-ride zone. We found no rule from the station on scooters.',
        '**Hartford Line trains.** CTrail’s trains take standard bikes in their bike areas, as the conductor directs, and folding bikes folded, space permitting; its rules name no scooters, so ask the conductor before boarding with your own. Amtrak’s trains on the line need a bike reservation. Bike lockers stand in the Spruce Street lot, on the station’s west side.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Nearly half a million rides.** Riders took more than 450,000 trips on Hartford’s Link scooters from 2021 to 2023, the City said in 2024.',
            '**Car-free homes.** About 30% of Hartford households have no car, the City said in 2024.',
            '**A quick start.** Riders took 96,168 Veo trips in Hartford between August 2024 and April 2025, and 68% of Veo’s Hartford riders had a household income below $50,000: figures Veo gave New Haven’s alders, the New Haven Independent reported on 23 April 2025.',
            '**Drivers pay double.** A driver fined for failing to give way to someone on an e-scooter at an intersection, a turn or a driveway pays twice the usual fine, under state law.',
            '**From Maine to Florida.** Bushnell Park is part of the East Coast Greenway, a trail planned to run from Maine to Florida, the Bushnell Park Foundation says.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which scooter companies operate in Hartford?',
      answer: 'Veo, which Hartford has hosted since August 2024 under the Capitol Region Council of Governments’ agreement, the City said that month; the Hartford map counts Veo alone. We found no other company with a City agreement in 2026. The Link scooters left at the end of 2023.',
    },
    {
      question: 'How much does a Veo scooter cost in Hartford?',
      answer: '$1 to unlock and $0.36 a minute plus tax, Veo’s published rate on 29 October 2026, so a 10-minute ride costs $4.60 before tax. The app shows the final price. In August 2024 the mayor described a $5-a-month plan for low-income residents; check the app for what it offers now.',
    },
    {
      question: 'Do you need a helmet to ride an e-scooter in Connecticut?',
      answer: 'Only under 18, since 1 October 2025, on the road and in any park. It isn’t an offence: police may warn a parent. Veo’s riders must be 18 anyway, but a helmet is wise for everyone.',
    },
    {
      question: 'Can you ride an e-scooter on the sidewalk in Hartford?',
      answer: 'State law allows it unless a town bans it, provided you give way to people walking and warn them before passing. We found no Hartford rule either way, and the City’s 2024 text tells Veo riders to follow the rules of the road, so stay in the street or a bike lane.',
    },
    {
      question: 'Can I take an e-scooter on a CTtransit bus?',
      answer: 'Your own, if it folds: fold it, hold it, and keep it out of the aisles and the wheelchair area. A Veo can’t board, and the bike racks take only bikes.',
    },
    {
      question: 'Do Veo scooters run in winter in Hartford?',
      answer: 'The City’s plan of August 2024 kept them running in winter, but expected fewer from December to February, depending on the weather and demand, and more again in spring. We found no newer plan, and no night curfew.',
    },
  ],
  sources: [
    { title: 'Hartford Chamber of Commerce: Micromobility: 2024 Summary Overview, 10 December 2024 (the City of Hartford’s text of 28 August 2024)', url: 'https://www.hartfordchamberct.com/chamber-updates/blog-post-title-three-xka9n' },
    { title: 'WFSB: Electric scooters are back in Hartford, 30 August 2024', url: 'https://www.wfsb.com/2024/08/30/electric-scooters-are-back-hartford/' },
    { title: 'Connecticut Public: Scooter share program leaving Hartford at year’s end, 26 December 2023', url: 'https://www.ctpublic.org/news/2023-12-26/scooter-share-program-leaving-hartford-at-years-end' },
    { title: 'New Haven Independent: E-scooter rentals are coming to town, 23 April 2025', url: 'https://www.newhavenindependent.org/2025/04/23/e_scooter_rentals_are_coming_to_town/' },
    { title: 'Veo: Hartford open data (GBFS), 29 October 2026', url: 'https://cluster-prod.veoride.com/api/shares/name/hrt/gbfs' },
    { title: 'Connecticut General Assembly: Public Act 19-162, An Act Regulating Electric Foot Scooters (PDF)', url: 'https://www.cga.ct.gov/2019/act/pa/pdf/2019PA-00162-R00HB-07141-PA.pdf' },
    { title: 'Connecticut General Statutes, chapter 248, 2026 Supplement (§§ 14-212c, 14-286 to 14-289)', url: 'https://www.cga.ct.gov/2026/sup/chap_248.htm' },
    { title: 'Connecticut General Statutes, chapter 246, 2026 Supplement (§§ 14-1 and 14-96a)', url: 'https://www.cga.ct.gov/2026/sup/chap_246.htm' },
    { title: 'Office of Legislative Research: Public Act 25-65 summary (PDF)', url: 'https://www.cga.ct.gov/2025/SUM/PDF/2025SUM00065-R02SB-01377-SUM.PDF' },
    { title: 'Connecticut General Assembly: Public Act 26-24, section 4, effective 1 October 2026 (PDF)', url: 'https://www.cga.ct.gov/2026/ACT/PA/PDF/2026PA-00024-R00SB-00413-PA.PDF' },
    { title: 'CTtransit: Bikes on Board', url: 'https://www.cttransit.com/how-ride/bikes-board' },
    { title: 'CTrail Hartford Line: FAQs', url: 'https://hartfordline.com/faqs-news/faqs/' },
    { title: 'Bushnell Park Foundation: Getting here', url: 'https://bushnellpark.org/information/getting-here' },
    { title: 'Riverfront Recapture: Park rules and regulations', url: 'https://riverfront.org/parkrules/' },
    { title: 'University of Connecticut: Lithium-ion battery MPTV policy, effective 31 August 2023', url: 'https://policy.uconn.edu/2023/07/11/lithium-ion-mptv-policy/' },
  ],
};

export default guide;
