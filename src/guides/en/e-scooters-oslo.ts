import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-oslo',
  topic: 'oslo',
  name: 'Renting an e-scooter in Oslo',
  title: 'E-scooter Oslo 2026: prices, rules and the night curfew',
  description: 'Rent an e-scooter in Oslo: Bolt, Ryde and Voi prices and age limits, the 11 pm to 5 am curfew, where you can’t ride or park, and the NOK 900 parking fee.',
  headline: 'E-scooters in Oslo: operators, prices, the night curfew and where to ride',
  lede: 'To rent an e-scooter in Oslo, use the app of Bolt, Ryde or Voi, the three companies with city permits, or Ruter’s public transport app. Unlocking costs NOK 10 (NOK 10.90 with Ryde), then NOK 2.50 a minute, so ten minutes come to about NOK 35 (published rates on 12 October 2026). You must be 16 to rent from any of them, and nobody can rent between 11 pm and 5 am. Many squares, parks and stations ban riding or parking, and bad parking can cost NOK 900.',
  published: '2026-10-13',
  updated: '2026-10-17',
  city: 'no:Oslo',
  sections: [
    {
      heading: 'Renting an e-scooter in Oslo: Bolt, Ryde and Voi',
      blocks: [
        'Oslo grants e-scooter permits to three companies: **Bolt, Ryde and Voi**. All three have held permits since 2024; the current ones run for two years from 1 April 2025, so until spring 2027. Who rents scooters after that hasn’t been decided (October 2026); Dott says it will bid.',
        'The city allows **16,000** small electric vehicles in all, rental e-bikes included, split equally: about 5,300 per company. At most 1,200 may stand inside Ring 1, the inner ring road around the centre. Riders made over 20 million trips in 2025, 80% more than the year before.',
        'On 12 October 2026 the [map around Oslo](map:no:Oslo) showed about 15,000 Voi, Bolt and Ryde vehicles; its area reaches beyond the city limits, so that figure can’t be compared with the cap. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
        'Norwegian law sets the minimum age at 12, but each company sets its own, and the city tells you not to rent one if you’re under 15, or for anyone under 15.',
        {
          table: {
            caption: 'Minimum age to rent in Oslo (October 2026)',
            head: ['Service', 'Minimum age'],
            rows: [
              ['Ryde', '16'],
              ['Bolt', '16'],
              ['Voi', '16'],
              ['Oslo City Bike', '18'],
            ],
          },
        },
        'Ruter still lists 15 for Ryde, but Ryde’s terms for Norway require 16 (17 October 2026). Bolt may ask for ID, and at peak times you must pass a short reaction test to unlock; Ryde tests riders on weekend evenings. On 5 October 2026 the government proposed raising the national minimum age to 16; it is **not law yet**.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Oslo?',
      blocks: [
        'You pay to unlock, then by the minute; the app shows the final price.',
        {
          table: {
            caption: 'E-scooter prices in Oslo, published rates on 12 October 2026',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Voi', 'NOK 10', 'NOK 2.50', 'NOK 35', 'NOK 60'],
              ['Bolt', 'NOK 10', 'NOK 2.50', 'NOK 35', 'NOK 60'],
              ['Ryde', 'NOK 10.90', 'NOK 2.50', 'NOK 35.90', 'NOK 60.90'],
            ],
          },
        },
        'Bolt’s rate above comes from its own data feed; Ruter, though, lists Bolt as charging by the kilometre, so check the price in the Bolt app before you unlock. An average Oslo ride lasts about seven minutes and costs about NOK 27.50 with Voi or Bolt. Riding a lot? Voi sells minute packs and a Voi Pass, and Bolt has weekly and monthly passes, priced in the apps.',
        '**The Ruter app**, Oslo’s public transport app, unlocks all three brands and Oslo City Bike. You pay ride by ride, at the same price as in each company’s app, but their passes don’t work there.',
      ],
    },
    {
      heading: 'Can you ride e-scooters at night in Oslo?',
      blocks: [
        'No new rentals: you can’t rent an e-scooter in Oslo between **11 pm and 5 am**, every night, weekends included. The city government may shorten or lift this curfew, but hadn’t as of October 2026.',
        'The curfew began in September 2021, and in its first month scooter injuries recorded at night fell to 8, from just under 100 in August.',
        'Neighbouring municipalities set their own hours. According to Ruter, Ryde and Voi run around the clock in [Bærum](map:no:Bærum), west of Oslo, and in Lørenskog and Lillestrøm you can rent all night on most weeknights. In Oslo itself, Oslo City Bike runs until 1 am.',
        '**Constitution Day (17 May) and big events:** the city can switch scooters off in the centre. For the World Cup quarter-final between Norway and England on 11 July 2026, riding was banned from Jernbanetorget to Uranienborg and from Tjuvholmen to Hausmannskvartalet, the same zones as on 17 May. The app shows the zones each time.',
      ],
    },
    {
      heading: 'Where can you ride an e-scooter in Oslo?',
      blocks: [
        'Use the cycle lane or cycle track where there is one, otherwise the road. On pavements, pedestrian streets, parks and squares, the city asks you to ride at walking pace or push. Motorways, expressways and roads signed closed to cyclists, including many tunnels and some bridges, are off limits.',
        'In some zones the scooter slows down by itself or won’t ride at all; zones change often, so check the app and the [city’s zone map](https://experience.arcgis.com/experience/e77cffa7119144f3bf9cb57c294cbcef) (in Norwegian). Examples as of October 2026:',
        {
          list: [
            '**No riding:** cemeteries such as Vår Frelsers gravlund; Marka, the forest around the city, Sognsvann included; the roof and plaza of the Opera House; the Botanical Garden at Tøyen; the square in front of Oslo S, the central station; school yards on weekdays.',
            '**10 km/h:** Spikersuppa by Karl Johans gate, the Munch Museum and Sukkerbiten, Olaf Ryes plass and along the Akerselva, among others. The city also has 12 km/h zones, and Slottsplassen, in front of the Royal Palace, is a slow zone of its own.',
            '**The companies’ own zones:** Ryde bans riding at stadiums such as Bislett and Ullevaal, Voi at Holmenkollen, and Bolt slows you to 15 km/h on Aker Brygge.',
          ],
        },
        '**Karl Johans gate**, the main street, has no riding ban on the city’s map, but where it’s a pedestrian street, keep to walking pace, never above 6 km/h.',
        '**Pavement riding** is allowed when few people are about and you’re no danger or obstacle; pass pedestrians at walking pace, never above 6 km/h, and keep off where a sign bans e-scooters. The city government wants to ban pavement riding once the law allows it, and on 13 January 2026 the Storting, Norway’s parliament, asked the government to allow such bans. As of October 2026 the ban is planned, not in force.',
      ],
    },
    {
      heading: 'E-scooter parking in Oslo and the NOK 900 fee',
      blocks: [
        'Park in a marked bay, against a wall or in a bike rack, but never in an Oslo City Bike dock. The pavement is fine if the scooter doesn’t block people, benches or bins. Parking is banned:',
        {
          list: [
            'at tram stops and T-bane (metro) stations, except in the marked bays some have;',
            'at schools, nurseries, sports grounds, building sites and key buildings such as Akershus Fortress;',
            'in many squares, pedestrian streets and parks, such as Stortorvet, Youngstorget, Rådhusplassen (City Hall Square) and Frogner Park, except in marked bays;',
            'in a cycle lane, within 2.5 m of the tactile guide lines for blind people, and within 5 m of a junction or crossing.',
          ],
        },
        { note: 'Bad parking can cost NOK 900. The app may let you end the ride where parking is still banned: check that the pavement is clear, and take the photo when the app asks.' },
        'The city charges the fee to the operator; Ryde said in 2024 that it passes half, NOK 450, to customers at fault. Ryde also took the city to court over 20 of these fees and won six: what counts is whether the scooter is an “unnecessary obstruction or inconvenience”.',
      ],
    },
    {
      heading: 'E-scooter rules in Norway: the essentials and the fines',
      blocks: [
        'Norway’s traffic rules apply to visitors too, and fines are the same nationwide:',
        {
          table: {
            caption: 'E-scooter rules and fines in Norway, October 2026',
            head: ['Rule', 'What applies', 'Fine'],
            rows: [
              ['Age', '12 by law; 15 or 16 to rent in Oslo', '–'],
              ['Helmet', 'Required under 15, recommended for all', '–'],
              ['Alcohol', 'Limit 0.2‰ (0.02%), as for car drivers', 'About NOK 15,000 at 0.8‰, if confessed (Supreme Court, 2023)'],
              ['Where to ride', 'Cycle lane or road; pavement only when quiet, at most 6 km/h past people; never a motorway', 'NOK 1,950 where a sign bans you, or on a motorway'],
              ['Passengers', 'One rider only', 'NOK 3,000'],
              ['Red light', 'Stop, as a car would', 'NOK 1,950'],
              ['Phone', 'Don’t hold it while riding', 'NOK 10,750'],
              ['Parking', 'Never where it obstructs or is banned', 'NOK 900'],
            ],
          },
        },
        '**Helmets:** of riders hurt on rental e-scooters in Oslo in 2023, just 1.4% wore one, says the Norwegian Public Roads Administration. **Pedestrian crossings:** ride across and cars needn’t stop for you; walk the scooter across and they must.',
        'The [Public Roads Administration](https://www.vegvesen.no/en/traffic-information/traffic-safety/norwegian-traffic-rules/traffic-rules-for-electric-scooters/) explains the rules in English.',
      ],
    },
    {
      heading: 'Winter, tram rails, Oslo S and the airport',
      blocks: [
        {
          list: [
            '**Winter:** the city has no winter break and no studded-tyre rule, so the companies decide. In January 2026 Bolt closed for a while and Ryde scaled back, because scooters were in the way of snow clearing.',
            '**Tram rails:** cross them as close to a right angle as you can, so the wheel can’t drop into the groove.',
            '**Oslo S, T-bane and trams:** end your ride a little way off, since parking is banned at stations and stops. Riding is banned in front of Oslo S, so walk the scooter around it.',
            '**Hills:** the climbs to St. Hanshaugen, Ekeberg and Holmenkollen are steep, and Marka is closed to rental scooters.',
            '**Oslo Airport, Gardermoen:** it lies outside Ruter’s scooter area, and no shared e-scooter service publishes data there. Take Flytoget, the Airport Express Train, to Oslo S, then find the nearest scooter on the [map of Oslo](map:no:Oslo).',
          ],
        },
      ],
    },
    {
      heading: 'Oslo City Bike: the alternative after 11 pm',
      blocks: [
        'Oslo City Bike (Oslo Bysykkel) has 266 stations and runs all year from 5 am to 1 am, two hours longer than the scooters; in winter there are fewer bikes, with studded tyres. You must be 18. Prices as of October 2026:',
        {
          list: [
            '**Single trip:** NOK 8 to unlock, then NOK 1 a minute on a regular bike (blue) or NOK 2 on an e-bike (white), plus a one-time NOK 3 registration fee.',
            '**Passes:** 30 days NOK 179, 365 days NOK 599, or the three-day “Opplev Oslo” pass, NOK 119.',
          ],
        },
        'Ten minutes on a city e-bike come to about NOK 28, against about NOK 35 on an e-scooter.',
      ],
    },
    {
      heading: 'Did you know? Oslo e-scooter facts',
      blocks: [
        {
          list: [
            '**Nine brands were shut out in one day.** When Oslo first picked its operators, on 31 March 2022, Dott, Lime, Bird and Ryde were among the nine that lost out. Ryde was back by 2024.',
            '**The city can switch the centre off.** For King Harald’s funeral on 9 September 2026, scooters stopped working in the central pedestrian zone until 9 pm.',
            '**Most pedestrians hit were on the pavement.** Of 31 pedestrians hit by e-scooters in Oslo in 2023, more than half were on the pavement.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent an e-scooter in Oslo?',
      answer: 'Yes. Sign up in the Bolt, Ryde or Voi app, or unlock through the Ruter app; you must be 16. No renting from 11 pm to 5 am.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Norway?',
      answer: 'Only if you’re under 15, though the Public Roads Administration recommends one for everyone. A helmet requirement for all riders is being studied, but nothing has been decided (October 2026).',
    },
    {
      question: 'Can I ride an e-scooter on the pavement in Oslo?',
      answer: 'Yes, when few people are about; pass them at walking pace, never above 6 km/h, and not where a sign bans e-scooters. The city wants to ban pavement riding, but the ban isn’t in force (October 2026).',
    },
    {
      question: 'Can I take an e-scooter on the T-bane or the tram?',
      answer: 'Not a rental: end the ride away from the station and rent another later. Ruter’s conditions have no rule for private e-scooters; staff decide whether a carried item is in the way.',
    },
    {
      question: 'Can I rent an e-scooter in Oslo in winter?',
      answer: 'Usually: the city has no winter break, but companies may close or cut back in snow, as Bolt and Ryde did in January 2026. Oslo City Bike runs all year.',
    },
  ],
  sources: [
    { title: 'Lovdata: Oslo’s regulation on renting small electric vehicles (Norwegian)', url: 'https://lovdata.no/dokument/LF/forskrift/2024-11-20-2821' },
    { title: 'City of Oslo: renting e-scooters and e-bikes (Norwegian)', url: 'https://www.oslo.kommune.no/gate-transport-og-parkering/sykkel/leie-av-elsparkesykler-og-elsykler/' },
    { title: 'Ruter: opening hours (Norwegian)', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/apningstider' },
    { title: 'Ruter: operators, prices and age limits (Norwegian)', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer' },
    { title: 'Ruter: renting in the Ruter app (Norwegian)', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/kjore-i-appen' },
    { title: 'Ruter: parking an e-scooter (Norwegian)', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/parkering' },
    { title: 'Voi: Oslo prices and age limit (Norwegian)', url: 'https://www.voi.com/nb/by/oslo' },
    { title: 'Oslo City Bike', url: 'https://oslobysykkel.no/' },
    { title: 'Norwegian Public Roads Administration: traffic rules for electric scooters', url: 'https://www.vegvesen.no/en/traffic-information/traffic-safety/norwegian-traffic-rules/traffic-rules-for-electric-scooters/' },
    { title: 'Lovdata: on-the-spot fines in road traffic (Norwegian)', url: 'https://lovdata.no/dokument/SF/forskrift/1990-06-29-492' },
    { title: 'Norwegian Public Roads Administration: e-scooter injuries in Oslo, January 2026 (Norwegian)', url: 'https://www.vegvesen.no/om-oss/presse/aktuelt/2026/01/flere-skader-seg-pa-elsparkesykkel-i-oslo/' },
    { title: 'Ryde: terms and conditions for Norway', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
  ],
};

export default guide;
