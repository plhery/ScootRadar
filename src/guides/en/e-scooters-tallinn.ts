import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-tallinn',
  topic: 'tallinn',
  name: 'Renting an e-scooter in Tallinn',
  title: 'E-scooters Tallinn 2026: Bolt, prices, rules and parking',
  description: 'E-scooters in Tallinn: Bolt, what a ride costs, Estonia’s age and helmet rules, where to ride and park in the Old Town, and winter.',
  headline: 'E-scooters in Tallinn: Bolt, what a ride costs, Estonia’s rules and where to park in the Old Town',
  lede: 'E-scooters in Tallinn are rented from Bolt, which calls the city its hometown. It advertises scooters in Estonia from €0.15 a minute plus an unlock fee shown in the app, and rents only to riders of 18 and over. Estonian law lets e-scooters use cycle tracks and pavements, at walking pace near pedestrians. In the Old Town and the city centre you can end a ride only in a marked parking area, and the Old Town is limited to 10 km/h.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'ee:Tallinn',
  sections: [
    {
      heading: 'E-scooters in Tallinn: Bolt and the other apps',
      blocks: [
        'Bolt rents stand-up e-scooters; other apps rent other vehicles:',
        {
          list: [
            '**Bolt**, in the same app as its taxis. New riders are capped at 15 km/h for their first five rides. Before some unlocks the app asks for a short reaction test: at peak hours, says Bolt’s English page, or when more people drink, such as weekend evenings, says its Estonian one. Bolt also rents e-bikes in Tallinn.',
            '**Ride Mobility**, a Latvian company, has rented small seated e-mopeds in Tallinn since spring 2025, to riders of 18 and over. In September 2025 Tuul, the Estonian scooter company, sold its business to Ride and closed its own service. Ride’s website lists Tallinn but doesn’t say whether stand-up scooters run there.',
            '**Rekola** lists Tallinn for its shared bikes.',
          ],
        },
        'The map shows Bolt. At 20:59 on Sunday 25 October 2026 the [map of Tallinn](map:ee:Tallinn) showed 4,032 Bolt scooters: a count of what’s on the map, not the fleet. Ride’s and Rekola’s vehicles, and Bolt’s e-bikes, are only in their own apps.',
        'That count reaches past the city limits. In a night count from 01:04 to 01:14 on Monday 26 October, 3,793 of 4,148 scooters stood inside Tallinn’s eight districts (by the official boundaries of Maa- ja Ruumiamet, Estonia’s land board), 1,255 of them in Kesklinn, the centre. The other 355 stood in neighbouring Rae, Saue, Viimsi, Maardu, Harku, Saku and Jõelähtme.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a Bolt scooter cost in Tallinn?',
      blocks: [
        'Bolt publishes no Tallinn price. Its Estonian website advertises scooters “starting from €0.15 per minute”, a national figure; each ride also has an unlock fee, and the rate “may vary depending on your location”, so check the app before you start.',
        {
          table: {
            caption: 'Bolt’s advertised scooter prices in Estonia and Tallinn’s public transport tickets (26 October 2026)',
            head: ['Option', 'Price'],
            rows: [
              ['Bolt scooter, pay as you go', 'From €0.15 a minute, plus an unlock fee shown in the app'],
              ['Bolt Unlimited unlocks', 'From €0.99 a month'],
              ['Bolt passes', 'Weekly and monthly passes of minutes, priced in the app'],
              ['Tram, bus or trolleybus, 1 hour', '€2'],
              ['Public transport, 24 hours', '€5.50'],
              ['Public transport, 72 hours', '€9'],
              ['Registered Tallinn residents', 'Free, with a personal Ühiskaart and ID'],
            ],
          },
        },
        'Bolt’s terms, in force since 1 January 2026, add a €6 fee for bad parking or a missing end-of-ride photo, up to €100 if it has to fetch a scooter left outside a permitted parking area, up to €120 to search for one and up to €500 if a scooter isn’t returned within 48 hours. If the city fines Bolt over your ride, Bolt passes the fine on with an admin fee of up to €30. Its new terms from 1 December 2026 keep the same fees.',
      ],
    },
    {
      heading: 'Estonia’s e-scooter rules: age, helmet and where to ride',
      blocks: [
        'Estonian law calls a stand-up e-scooter a kergliikur (light personal vehicle); in everyday Estonian it’s an elektritõukeratas. It is electric, for one person, without a seat, built for at most 25 km/h with a motor of up to 1 kW. The rules are in the Traffic Act (liiklusseadus). From 16 you need no licence of any kind.',
        {
          table: {
            caption: 'E-scooter rules in Estonia on 26 October 2026 (Traffic Act, version in force from 1 October 2026)',
            head: ['Rule', 'What applies', 'Fine'],
            rows: [
              ['Speed', '25 km/h at most (§ 15)', '–'],
              ['Where to ride', 'Cycle lane, cycle track, shared path, footpath or pavement, in no set order; the right edge of the road or the verge only where those are missing or very hard to use (§ 32)', 'Up to €120 (§ 259)'],
              ['Pedestrians', 'Pass them at about walking pace (§ 32). Cross the road at walking pace; on a zebra crossing you have no priority over drivers, except those turning into the road you’re crossing (§ 32¹)', 'Up to €120'],
              ['Age and licence', 'No age limit off the road. On the carriageway, alone from 10, with a cycling licence until 16; from 8 under an adult’s direct supervision (§ 148, § 148¹)', 'Up to €120'],
              ['Helmet', 'A fastened bicycle helmet under 16 (§ 31)', 'Up to €120'],
              ['Passengers', 'None: a kergliikur carries one person (§ 2, § 31)', 'Up to €120'],
              ['Hands and phone', 'At least one hand on the handlebar; no phone in your hand while moving (§ 31, § 33)', 'Up to €120'],
              ['Lights', 'White at the front and red at the back in the dark or poor visibility (§ 87)', 'Up to €120'],
              ['Alcohol', 'Below 0.5 mg per gram of blood or 0.25 mg per litre of breath (§ 69)', 'Up to €400 (§ 224²)'],
            ],
          },
        },
        'Fines are counted in fine units of €8 each (Penal Code, § 47): 15 units, €120, for most scooter offences. The police can settle one on the spot with a fixed €40 fine (§ 262¹). Over the alcohol limit, or if you hurt someone or cause damage or danger, the maximum is €800 (§ 259).',
        '**The pavement is allowed**, whatever Bolt’s scooter pages say: the Traffic Act lists it among the places a kergliikur may ride.',
      ],
    },
    {
      heading: 'Where to ride slowly and park in Tallinn’s Old Town',
      blocks: [
        'Tallinn’s rules for rental scooters are a City Government regulation of 15 April 2025, in its current form since 1 July 2025. It sets speeds and parking areas under the Traffic Act (§§ 190¹³–190¹⁵), which gives cities no power to issue permits or cap fleets; it sets no fees or night ban either. The Municipal Police enforce it.',
        {
          list: [
            '**Old Town (Vanalinn): 10 km/h**, Toompea included.',
            '**City centre: 20 km/h** in the zone south and east of the Old Town, roughly from Paldiski maantee, Luise and Suur-Ameerika to Pronksi and Narva maantee, and on Gonsiori.',
            '**Parks, schools and kindergartens: 15 km/h**, Kadriorg Park included; near schools on weekdays from 07:30 to 18:00.',
            '**Bus and tram shelters: 10–25 km/h** within 10 metres, as the city sets each one.',
            '**Friday and Saturday nights: 17 km/h** everywhere from 21:00 to 07:00, parks and schools included, and 10 km/h in the Old Town.',
          ],
        },
        '**Parking.** In a zone covering the Old Town, the city centre, Balti jaam station, Telliskivi Creative City and western Kadriorg up to the palace, you may end a ride only in a parking area marked on the street and shown in the app. Most of Kalamaja, north of Kopli street, lies outside the zone.',
        'Everywhere else, don’t park within 10 metres of a bus or tram shelter. Never park in the marked area of a junction, on a pavement or path narrower than 1.7 metres, or on a bridge, a viaduct or in a tunnel unless there’s a parking area. A badly parked scooter can be reported to its operator, which must move it within 3 hours between 08:00 and 22:00.',
      ],
    },
    {
      heading: 'The airport, the harbour, trams, trains and campuses',
      blocks: [
        '**Tallinn Airport.** We found no e-scooter rule on its pages (26 October 2026). In the night count, three Bolt scooters stood within 200 metres of the passenger terminal. Tram 2 runs from there to the Old City Harbour and Kopli, and tram 4 to Tondi.',
        '**The Old City Harbour (Vanasadam).** The Port of Tallinn’s port rules and passenger pages say nothing about e-scooters (26 October 2026). In the night count, about 60 Bolt scooters stood within 400 metres of terminal D, at Uus-Sadama 24. The [Tallinn map](map:ee:Tallinn) shows the nearest one and the walk to it.',
        '**Trams and buses.** TLT, the city’s transport company, lets you bring a kick scooter on board if it is properly packed, but not “bicycles, balance boards or other vehicles with an auxiliary motor” (its FAQ, updated May 2025). We read that as barring e-scooters, rented or your own.',
        '**Elron trains.** Elron allows a kick scooter in the C area of the train, or folded anywhere, but you may not stand or ride on it or charge an e-scooter or e-bike on board.',
        '**Campuses.** TalTech allows rentals to start and end on its Mustamäe campus, which has Bolt scooter charging stations by its building entrances (page updated January 2026). Tallinn University’s Narva maantee buildings are inside the city’s parking-area zone.',
        '**Kadriorg Park.** The city agency that runs it gives pedestrians priority on park paths and, without its written permission, bans “driving and parking motorised vehicles on park paths and green areas” (2024 rules; Kalamaja Cemetery Park’s say the same). We read that as covering e-scooters, though the city’s park speed limit and parking zone reach into Kadriorg: ride on the streets through it and walk the scooter on the paths.',
      ],
    },
    {
      heading: 'Night riding and winter in Tallinn',
      blocks: [
        '**No night ban.** Neither the law nor the city stops rentals at night. The only night rule is the 17 km/h cap on Friday and Saturday nights.',
        '**Winter.** In November 2024 Tallinn agreed with Bolt, Tuul and Rekola to take rental scooters and bikes off the streets from 1 December, ERR News reported, and they returned on 1 March 2025 after a three-month break. That was an agreement, not part of the regulation, and by 26 October 2026 we had found no plan for this winter. Check the app from late November. Bolt’s terms forbid riding in snow, ice, sleet or freezing rain.',
        'Travelling on? See our guides to [Helsinki](guide:helsinki), where the season runs, in principle, to 30 November, and [Riga](guide:riga), where Ride runs the former Tuul scooters.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Tallinn is Bolt’s hometown**, its city page says, and in March 2026 Bolt told ERR the city was one of its best and most heavily used cities in Europe.',
            '**Tallinn is one of five European cities with Bolt’s charging docks so far**; each dock holds up to ten scooters or e-bikes, other brands included.',
            '**Tuul’s Estonian-made scooters covered more than 15 million kilometres** in five years before Ride bought them.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter apps work in Tallinn?',
      answer: 'Bolt rents stand-up e-scooters across Tallinn, and [our map](map:ee:Tallinn) shows them. Ride Mobility rents seated e-mopeds, and Rekola shared bikes; their vehicles are only in their own apps.',
    },
    {
      question: 'How much does a Bolt scooter cost in Tallinn?',
      answer: 'Bolt advertises scooters in Estonia from €0.15 a minute, plus an unlock fee; the app shows the exact price for Tallinn before you start.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Tallinn?',
      answer: '18 to rent one from Bolt. Estonian law sets no age limit off the road; on the carriageway children ride alone from 10, and 10–15-year-olds need a cycling licence.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Estonia?',
      answer: 'Only under 16: younger riders must wear a fastened bicycle helmet. For adults it’s advised, not compulsory.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Tallinn?',
      answer: 'Yes. The Traffic Act lets e-scooters use pavements, footpaths and cycle tracks, and the road only where those are missing or very hard to use. Pass pedestrians at about walking pace.',
    },
    {
      question: 'Can you rent an e-scooter in Tallinn in winter?',
      answer: 'Not always. In winter 2024–25 rental scooters were off the streets from 1 December to 1 March by agreement with the city; by 26 October 2026 we had found no plan for this winter. Check the app.',
    },
  ],
  sources: [
    { title: 'Riigi Teataja: Traffic Act (liiklusseadus), version in force from 1 October 2026 (Estonian)', url: 'https://www.riigiteataja.ee/akt/111072026045' },
    { title: 'Riigi Teataja: Penal Code, § 47 on the fine unit (Estonian)', url: 'https://www.riigiteataja.ee/akt/109072026028' },
    { title: 'Riigi Teataja: Tallinn regulation no. 12 of 15 April 2025 on rental scooters, with maps (Estonian)', url: 'https://www.riigiteataja.ee/akt/418042025002' },
    { title: 'Riigi Teataja: Tallinn public transport fares (Estonian)', url: 'https://www.riigiteataja.ee/akt/428062026013' },
    { title: 'Maa- ja Ruumiamet: administrative and settlement division, 2 September 2026 (Estonian)', url: 'https://geoportaal.maaruum.ee/est/Ruumiandmed/Haldus-ja-asustusjaotus-p119.html' },
    { title: 'Bolt: scooters in Estonia', url: 'https://bolt.eu/en-ee/scooters/' },
    { title: 'Bolt: Tallinn', url: 'https://bolt.eu/en-ee/cities/tallinn/' },
    { title: 'Bolt: E-Vehicles terms of service, effective 1 January 2026', url: 'https://bolt.eu/en-ee/legal/micromobility/terms-for-bolt-e-vehicles/' },
    { title: 'Bolt: E-Vehicles terms of service, effective 1 December 2026', url: 'https://bolt.eu/en-ee/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Bolt: charging docks', url: 'https://bolt.eu/en-ee/cities/charging-docks/' },
    { title: 'Ride Mobility: Estonia (Estonian)', url: 'https://ridemobility.eu/ee/' },
    { title: 'Ride Mobility: frequently asked questions (Estonian)', url: 'https://ridemobility.eu/kkk/' },
    { title: 'Rekola (Czech)', url: 'https://www.rekola.cz/' },
    { title: 'ERR News: Tuul sells its scooter business to Ride, 12 September 2025', url: 'https://news.err.ee/1609798302/estonia-s-tuul-sells-scooter-rental-business-to-latvian-company' },
    { title: 'ERR: Bolt on Tallinn and the two scooter bills, 12 March 2026 (Estonian)', url: 'https://www.err.ee/1609965170/riigikokku-jouab-kaks-kergliikurite-eelnou' },
    { title: 'ERR News: rental scooters off Tallinn’s streets from 1 December, 12 November 2024', url: 'https://news.err.ee/1609519495/rental-bikes-e-scooters-removed-for-winter-from-december-1' },
    { title: 'ERR News: e-scooters return to Tallinn’s streets from 1 March, 26 February 2025', url: 'https://news.err.ee/1609616135/e-scooters-rental-bikes-return-to-tallinn-s-streets-from-march-1' },
    { title: 'Tallinn Airport: public transport', url: 'https://airport.ee/en/public-transport/' },
    { title: 'Port of Tallinn: terminal D (Estonian)', url: 'https://www.ts.ee/d-terminal/' },
    { title: 'TLT: frequently asked questions (Estonian)', url: 'https://tlt.ee/ettevottest/korduma-kippuvad-kusimused/' },
    { title: 'Elron: frequently asked questions (Estonian)', url: 'https://elron.ee/uldinfo/korduma-kippuvad-kusimused' },
    { title: 'Kadriorg Park: park rules', url: 'https://kadriorupark.ee/visitor-information/park-rules' },
    { title: 'TalTech: transport and parking on the Mustamäe campus (Estonian)', url: 'https://taltech.ee/linnakud/mustamae/transport-ja-parkimine' },
  ],
};

export default guide;
