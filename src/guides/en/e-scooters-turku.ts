import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-turku',
  topic: 'turku',
  name: 'E-scooters in Turku, Finland',
  title: 'E-scooters Turku 2026: Voi, Ryde, night ban and parking',
  description: 'E-scooters in Turku: Voi and Ryde under the City’s licence, the weekend night ban, no-ride areas, parking in the centre and the season to 31 October.',
  headline: 'E-scooters in Turku: Voi and Ryde, the weekend night ban, where to park and when the season ends',
  lede: 'E-scooters in Turku are rented from Voi and Ryde, and since 2026 every company needs the City’s micromobility licence; each app shows its price, and our map shows Voi, not Ryde. No one may ride a rental scooter from 00:00 to 05:00 on Friday and Saturday nights. The licence’s season runs from 1 April to 31 October: from 1 November the scooters must be off the streets unless the City agrees in writing to more time. From 15 you ride on the cycle path or the road, never the pavement, and in the centre you park only in a marked bay.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'fi:Turku',
  sections: [
    {
      heading: 'E-scooters in Turku: Voi and Ryde',
      blocks: [
        'Since 1 January 2026 renting out e-scooters in Turku has required the City’s micromobility licence (mikroliikennelupa). The City grants it for a year at a time, for a fee of €200, and its terms set no cap on the number of scooters. It publishes no list of licence holders.',
        {
          table: {
            caption: 'E-scooter companies in Turku and what the map shows, October 2026',
            head: ['Company', 'In Turku in 2026', 'On the ScootRadar map'],
            rows: [
              ['Voi', 'Yes: back on 18 March, before the season, by agreement with the City (Yle)', 'Yes, with battery'],
              ['Ryde', 'Yes: back on 18 March with Voi (Yle)', 'No: check the Ryde app'],
              ['Dott', 'Had applied by March 2026; Turku isn’t on Dott’s list of towns (July 2026)', 'No'],
            ],
          },
        },
        '**Ryde isn’t on our map**, so look for its scooters in its own app, and don’t read the map’s total as every scooter in town. At 05:51 Turku time on Thursday 29 October 2026 the [Turku map](map:fi:Turku) showed about 2,400 Voi scooters as they stood at that moment: a snapshot, not a fleet size. Scooters on a ride aren’t shown, nor prices, zones or parking. The map’s Turku area isn’t cut to the city limits and may take in parts of Kaarina and Raisio.',
      ],
    },
    {
      heading: 'Electric scooter rental in Turku: what it costs',
      blocks: [
        '**The app shows the price** before you unlock: we found no Turku price on an open official or company page (29 October 2026). New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
        'Bad parking can cost more. The licence lets the City move a wrongly parked scooter and bill the company; from March 2026 the fees are €20 for a short move or €40 to the depot, plus €25 in handling costs and €15 a week in storage, Yle reported on 24 February 2026. The company may pass this on to the rider who parked it.',
      ],
    },
    {
      heading: 'When can you ride? The night ban, night speeds and the season',
      blocks: [
        { note: '**No riding from midnight to 05:00 on Friday and Saturday nights.** The City’s licence bans rental scooter rides from 00:00 to 05:00 on the nights from Friday to Saturday and from Saturday to Sunday, and on public holidays that fall on a weekday, “such as” Vappu Eve and May Day (30 April and 1 May), Midsummer Eve, Midsummer Day and New Year’s Eve; the City’s page says the ban holds on “at least” these.' },
        {
          table: {
            caption: 'Night rules, speed limits and the season for rental e-scooters in Turku, 2026',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Night ban', 'No riding 00:00–05:00 on Friday and Saturday nights and on the holidays above', 'City licence, clause 2.5'],
              ['Top speed', '20 km/h', 'City licence'],
              ['Weekend evenings', '15 km/h from 22:00 to midnight on Friday and Saturday nights', 'City licence'],
              ['Other nights', '15 km/h from 00:00 to 05:00', 'City licence'],
              ['Slow areas', '10 or 15 km/h, shown in the apps', 'City licence'],
              ['Season', '1 April to 31 October; outside it only with the City’s written consent', 'City licence'],
            ],
          },
        },
        'From midnight on Friday and Saturday nights the [map](map:fi:Turku) marks the night ban in Turku and says when renting starts again. It marks the nights that start on 30 April, 1 May and 31 December too; the licence names its holidays “such as”, so on other holiday nights check the app. The ban is Turku’s own: Raisio’s infrastructure committee voted 9–2 against one on 18 November 2025.',
        '**The season.** From 1 November to 31 March the licence keeps the scooters off the streets, in storage. Running outside the season needs the City’s written consent, which let Voi and Ryde start on 18 March 2026, Yle reported. In such extra time the City can order the scooters off on 72 hours’ notice if the weather turns for good, and the service must stop once frost makes riding dangerous. Whether any scooter runs after 31 October is the City’s decision; it had announced no extra time by 29 October 2026.',
        'When the scooters are gone, Föli’s 700 city bikes (föllärit) run until 22 December 2026 from more than 200 stations, rented in the Donkey Republic app for €2.00 an hour or €46 for the season. Our map shows standing e-scooters only, not bikes.',
      ],
    },
    {
      heading: 'No-ride and slow areas: the Market Square, parks and the river',
      blocks: [
        'Beyond the pavement, which is off limits by law, the City marks out no-ride areas where a rental scooter may not be ridden at all. The licence’s examples: the Market Square (Kauppatori), several parks, sports fields, skate parks and, case by case, school or nursery yards.',
        'The slow areas, at 10 or 15 km/h, cover busy places on foot such as the banks of the Aura, the pedestrian street, home zones (pihakadut), several bridges and some busy junctions. The scooters slow down there by GPS, and the exact areas are on the City’s [service map](https://palvelukartta.turku.fi/en/mobility/scooters) and in the apps.',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Turku',
      blocks: [
        '**In the centre, only in a marked area.** Central Turku has fixed parking: you may end your ride only in a painted bay or at an e-scooter rack, the City says. In 2026 it painted bays at 15 new sites in the centre, at Kupittaa and near the main bus lines; about 120 sites now hold up to 1,000 scooters (8 June 2026).',
        '**No-parking areas.** In the centre and at Kupittaa some places are off limits, such as bridges and certain junctions. The apps and the City’s service map show both.',
        '**Elsewhere,** use a bay if there is one; if not, leave the scooter at the very edge of the pavement, cycle path or road, parallel to it, where it is in nobody’s way.',
        '**The photo.** The licence makes every app ask for a photo of the parked scooter, and the companies must penalise clearly wrong parking.',
      ],
    },
    {
      heading: 'Finland’s e-scooter rules in Turku',
      blocks: [
        'A rental e-scooter, built for at most 25 km/h, counts as a light electric vehicle (kevyt sähköajoneuvo) under the Road Traffic Act (Tieliikennelaki 729/2018), and its rider follows the rules for cyclists. Act 304/2025, in force since 17 June 2025, added a minimum age and a drink limit. In Finnish, search “sähköpotkulauta Turku”. The same national rules apply as in [Helsinki](guide:helsinki) and [Tampere](guide:tampere).',
        {
          table: {
            caption: 'E-scooter rules in Turku on 29 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Who sets it'],
            rows: [
              ['Minimum age', '15; handing a scooter to someone younger can cost €60', 'Road Traffic Act §§ 17 and 164 a'],
              ['Company’s age', 'Voi and Ryde in their apps', 'Each company’s terms'],
              ['Where to ride', 'Cycle path or lane, else the road; not the pavement', 'Road Traffic Act §§ 18 and 52; City licence'],
              ['Alcohol and drugs', '0.5‰ in the blood or 0.22 mg/l in the breath is too much; no narcotics; €200 fee', 'Road Traffic Act §§ 17 a and 164'],
              ['Passengers', 'One rider only', 'Road Traffic Act § 147'],
              ['Helmet', 'You should generally wear one, and the City recommends it; there’s no fee', 'Road Traffic Act § 92; City of Turku'],
              ['Lights', 'White at the front, red at the back in the dark', 'The law, as the Road Safety Council (Liikenneturva) explains it'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Föli buses, trains and the ferries to Stockholm',
      blocks: [
        'Föli runs the Turku region’s buses. Its rules for your own scooter (29 October 2026):',
        {
          list: [
            '**Free:** a folding e-scooter, folded, or a small scooter.',
            '**€3.20:** a large e-scooter that won’t fold, charged as a bike is, with two hours of transfers. The driver decides whether it fits, and minibuses have no room for one.',
            '**Never:** an electric moped or a mobility scooter.',
          ],
        },
        'On VR’s trains from Turku station, small or foldable scooters travel free as hand luggage; a large one that won’t fold needs a paid, booked bike space, and you mustn’t charge it on board. With a hire scooter, end the ride near the station or stop before you board.',
        'Viking Line and Tallink Silja sail from the harbour to Stockholm. Tallink Silja treats a scooter, electric too, as a vehicle that needs a ticket: it boards through the cyclists’ lane and stays on the car deck, and you can’t charge it on board. A scooter that folds needs no ticket and goes through the pedestrian check-in. For Viking Line, check its rule when you book. Tallink Silja also sails from Turku to Åland, where the map shows Hopp’s scooters in [Mariehamn](map:fi:Mariehamn).',
      ],
    },
    {
      heading: 'The station, the universities and the harbour',
      blocks: [
        'Campuses and other landowners may restrict the scooters on their land, and the companies must respect that, the licence says. We found no current scooter rule from the University of Turku, Åbo Akademi or the Port of Turku (29 October 2026).',
        'At 06:26 on 29 October the map showed about 250 Voi scooters, as they stood at that moment, between the railway station and the Market Square, in an area of about 1.0 by 1.5 km, and at 06:31 about 600 round Åbo Akademi, the University of Turku’s main campus and Kupittaa, in about 1.3 by 1.4 km.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**The oldest in service.** Föri, the free ferry across the Aura, built in 1903 and in service since 1904, is the oldest vehicle in daily professional service in Finland, the City says. It carries up to 75 passengers and has run on electric motors since 2017.',
            '**7,000 at the peak.** In the busiest months of recent years Turku had up to 7,000 rental scooters on its streets, the City said in November 2025, before the licence came in.',
            '**Bikes with names.** Every Fölläri city bike gets a name of its own, Föli says.',
            '**One of five.** Of Finland’s seven largest cities, five, Turku among them, ban rental scooter rides on weekend nights, and Turku (at weekends) and Jyväskylä start their night speed limit as early as 22:00, Yle reported on 28 May 2026.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooters can you rent in Turku?',
      answer: 'Voi and Ryde; since 1 January 2026 every company needs the City’s micromobility licence. [Our map](map:fi:Turku) shows Voi; Ryde’s scooters are only in its app.',
    },
    {
      question: 'Can you ride an e-scooter at night in Turku?',
      answer: 'Not on weekend nights: rental scooters may not be ridden from 00:00 to 05:00 on Friday and Saturday nights, nor on holidays that fall on a weekday, such as Vappu Eve and May Day. On other nights they slow to 15 km/h from midnight, and on Friday and Saturday nights from 22:00.',
    },
    {
      question: 'When does the e-scooter season end in Turku?',
      answer: 'The licence’s season runs from 1 April to 31 October. From 1 November to 31 March the scooters must be off the streets unless the City consents in writing to more time, and it had announced none for autumn 2026 by 29 October.',
    },
    {
      question: 'Where can you park an e-scooter in central Turku?',
      answer: 'Only in a painted bay or at an e-scooter rack: parking in the centre is fixed, the City says. The apps and the City’s service map show the bays.',
    },
    {
      question: 'Can you take an e-scooter on a Föli bus?',
      answer: 'Yes, if it folds: a folded e-scooter or a small scooter travels free. A large one that won’t fold costs €3.20, as a bike does, if the driver has room; electric mopeds aren’t carried.',
    },
  ],
  sources: [
    { title: 'City of Turku: Electric scooters (updated 23 December 2025)', url: 'https://www.turku.fi/en/traffic-streets-and-maintenance/electric-scooters' },
    { title: 'City of Turku: Micromobility licence terms, adopted 11 November 2025 (Finnish, PDF)', url: 'https://www.turku.fi/sites/default/files/document/turun-kaupungin-mikroliikenneluvan-lupaehdot_2026.pdf' },
    { title: 'City of Turku: The licence from 2026, 12 November 2025 (Finnish)', url: 'https://www.turku.fi/ajankohtaista/sahkopotkulautayritykset-toimivat-ensi-vuodesta-alkaen-mikroliikenneluvan-ehdoilla' },
    { title: 'City of Turku: New painted parking bays, 8 June 2026 (Finnish)', url: 'https://www.turku.fi/ajankohtaista/turussa-ohjataan-sahkopotkulautojen-pysakointia-skuuttiruutujen-maalauksilla' },
    { title: 'City of Turku: Föri, the Aura river ferry (updated 11 March 2026, Finnish)', url: 'https://turku.fi/en/fori' },
    { title: 'City of Raisio: Infrastructure committee on its licence terms, 18 November 2025 (Finnish, PDF)', url: 'https://julkaisut.raisio.fi/dynasty10/kokous/2025622-5.PDF' },
    { title: 'Yle: Scooters back early in Turku, 17 March 2026 (Finnish)', url: 'https://yle.fi/a/74-20215828' },
    { title: 'Yle: Turku to charge for moving scooters, 24 February 2026 (Finnish)', url: 'https://yle.fi/a/74-20211959' },
    { title: 'Yle: How e-scooter rules differ from city to city, 28 May 2026 (Finnish)', url: 'https://yle.fi/a/74-20228186' },
    { title: 'Road Traffic Act 729/2018, consolidated (Finnish)', url: 'https://www.finlex.fi/fi/lainsaadanto/2018/729' },
    { title: 'Act 304/2025 amending the Road Traffic Act (Finnish)', url: 'https://www.finlex.fi/fi/lainsaadanto/saadoskokoelma/2025/304' },
    { title: 'Liikenneturva: Ride right, e-scooter tips', url: 'https://www.liikenneturva.fi/en/campaigns/ride-right/' },
    { title: 'Föli: Tickets and transport fees (Finnish)', url: 'https://www.foli.fi/fi/liput' },
    { title: 'Föli: Föli bikes', url: 'https://www.foli.fi/en/f%C3%B6li-bikes' },
    { title: 'VR: Bikes and scooters on trains', url: 'https://www.vr.fi/en/facilities-and-services/bikes-on-trains' },
    { title: 'Tallink Silja: Vehicle, bicycle and scooter', url: 'https://www.tallink.com/good-to-know/vehicle-bicycle-scooter' },
    { title: 'Tallink Silja: Ferries to Åland', url: 'https://www.tallink.com/travelling/one-way/aland-ferry' },
    { title: 'Port of Turku: Passenger traffic from Turku to Stockholm', url: 'https://www.portofturku.fi/en/passenger-traffic/' },
    { title: 'Dott: Locations (updated 16 July 2026)', url: 'https://ridedott.com/locations/' },
  ],
};

export default guide;
