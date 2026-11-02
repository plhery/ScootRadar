import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-tallinn',
  topic: 'tallinn',
  name: 'Renting an e-scooter in Tallinn',
  title: 'E-scooters Tallinn 2026: Bolt, prices, rules and parking',
  description: 'E-scooters in Tallinn: Bolt, Estonia’s age and helmet rules, where to ride slowly and park in the Old Town, trams and trains, and winter.',
  headline: 'E-scooters in Tallinn: Bolt, Estonia’s rules, the Old Town’s speed limits and where to park',
  lede: 'E-scooters in Tallinn are rented from Bolt: check the price in its app before you unlock. Estonian law lets e-scooters use cycle tracks and pavements, at walking pace near pedestrians, and asks for a helmet only under 16. In the Old Town and the city centre you can end a ride only in a marked parking area, and the Old Town is limited to 10 km/h.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'ee:Tallinn',
  sections: [
    {
      heading: 'E-scooters in Tallinn: Bolt and the other apps',
      blocks: [
        'Bolt rents stand-up e-scooters across the city, and two other apps list Tallinn:',
        {
          list: [
            '**Bolt**, in the same app as its taxis.',
            '**Ride**, which calls itself an e-bike sharing service. Its Estonian page (read 25 October 2026) lists Tallinn among its cities without saying which vehicles it has there, and its FAQ sets 18 as the minimum age. Open the Ride app to see what stands near you.',
            '**Rekola** lists Tallinn for its shared bikes.',
          ],
        },
        'At 20:59 on Sunday 25 October 2026 the [map of Tallinn](map:ee:Tallinn) showed 4,032 Bolt scooters free to rent at that moment.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a Bolt scooter cost in Tallinn?',
      blocks: [
        'Bolt shows its price in the app, so check it before you unlock. Tallinn’s public transport fares, for comparison:',
        {
          table: {
            caption: 'Tallinn’s public transport tickets (the city’s fares regulation, 26 October 2026)',
            head: ['Ticket', 'Price'],
            rows: [
              ['Tram, bus or trolleybus, 1 hour', '€2'],
              ['Public transport, 24 hours', '€5.50'],
              ['Public transport, 72 hours', '€9'],
              ['Registered Tallinn residents', 'Free, with a personal Ühiskaart and ID'],
            ],
          },
        },
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
        '**The pavement is allowed**: the Traffic Act lists it among the places a kergliikur may ride.',
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
        '**Tallinn Airport.** Before you count on a scooter, check in the app whether you can end a ride at the terminal. Tram 2 runs from the airport to the Old City Harbour and Kopli, and tram 4 to Tondi.',
        '**The Old City Harbour (Vanasadam).** The Port of Tallinn’s port rules and passenger pages say nothing about e-scooters (26 October 2026): end your ride where the app allows before you walk to terminal D, at Uus-Sadama 24.',
        '**Trams and buses.** TLT, the city’s transport company, lets you bring a kick scooter on board if it is properly packed, but not “bicycles, balance boards or other vehicles with an auxiliary motor” (its FAQ, updated May 2025): ask TLT before you take an e-scooter of your own on board.',
        '**Elron trains.** Elron allows a kick scooter in the C area of the train, or folded anywhere, but you may not stand or ride on it or charge an e-scooter or e-bike on board.',
        '**Campuses.** TalTech allows rentals to start and end on its Mustamäe campus, which has Bolt scooter charging stations by its building entrances (page updated January 2026). Tallinn University’s Narva maantee buildings are inside the city’s parking-area zone.',
        '**Kadriorg Park.** The city agency that runs it gives pedestrians priority on park paths and, without its written permission, bans “driving and parking motorised vehicles on park paths and green areas” (2024 rules; Kalamaja Cemetery Park’s say the same). The city’s park speed limit and parking zone reach into Kadriorg too, but to be safe, ride on the streets through it and walk the scooter on the paths.',
      ],
    },
    {
      heading: 'Night riding and winter in Tallinn',
      blocks: [
        '**No night ban.** Neither the law nor the city stops rentals at night. The only night rule is the 17 km/h cap on Friday and Saturday nights.',
        '**Winter.** Neither the law nor the city’s regulation sets a winter break. Check the app from late November to see whether scooters still run, and slow down on icy paths.',
        'Travelling on? See our guides to [Tartu](guide:tartu), [Helsinki](guide:helsinki), where the season runs, in principle, to 30 November, and [Riga](guide:riga), where Ride and Bolt both run.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Under-18s face half the maximum fine**: since 2025 Estonia’s Penal Code has based a minor’s fine on half the usual maximum, so €60 rather than €120 for most scooter offences (§ 47).',
            '**An e-scooter counts as a vehicle in Estonian law**, so in the Pirita river valley landscape reserve, in Pirita and Lasnamäe, you ride only on its roads: its protection rules allow vehicles off them only for work such as rescue or forestry (§ 6).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter apps work in Tallinn?',
      answer: 'Bolt rents stand-up e-scooters across Tallinn, and [our map](map:ee:Tallinn) shows them. Ride lists Tallinn among its cities, and Rekola lists it for shared bikes: open their apps to see what stands near you.',
    },
    {
      question: 'How much does a Bolt scooter cost in Tallinn?',
      answer: 'Bolt shows its price in the app: check it before you unlock. For comparison, a one-hour public transport ticket costs €2.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Tallinn?',
      answer: 'Estonian law sets no age limit off the road; on the carriageway children ride alone from 10, and 10–15-year-olds need a cycling licence. Ride rents only to riders of 18 and over; Bolt’s app shows its own limit.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Estonia?',
      answer: 'Only under 16: younger riders must wear a fastened bicycle helmet. For adults it isn’t compulsory.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Tallinn?',
      answer: 'Yes. The Traffic Act lets e-scooters use pavements, footpaths and cycle tracks, and the road only where those are missing or very hard to use. Pass pedestrians at about walking pace.',
    },
    {
      question: 'Can you rent an e-scooter in Tallinn in winter?',
      answer: 'Neither the law nor the city’s scooter regulation sets a winter break, but check the app from late November to see whether scooters still run.',
    },
  ],
  sources: [
    { title: 'Riigi Teataja: Traffic Act (liiklusseadus), version in force from 1 October 2026 (Estonian)', url: 'https://www.riigiteataja.ee/akt/111072026045' },
    { title: 'Riigi Teataja: Penal Code, § 47 on the fine unit and minors’ fines (Estonian)', url: 'https://www.riigiteataja.ee/akt/109072026028' },
    { title: 'Riigi Teataja: Tallinn regulation no. 12 of 15 April 2025 on rental scooters, with maps (Estonian)', url: 'https://www.riigiteataja.ee/akt/418042025002' },
    { title: 'Riigi Teataja: Tallinn public transport fares (Estonian)', url: 'https://www.riigiteataja.ee/akt/428062026013' },
    { title: 'Riigi Teataja: Pirita river valley landscape reserve, protection rules (Estonian)', url: 'https://www.riigiteataja.ee/akt/130042019007' },
    { title: 'Ride Mobility: Estonia (Estonian)', url: 'https://ridemobility.eu/ee/' },
    { title: 'Ride Mobility: frequently asked questions (Estonian)', url: 'https://ridemobility.eu/kkk/' },
    { title: 'Rekola (Czech)', url: 'https://www.rekola.cz/' },
    { title: 'Tallinn Airport: public transport', url: 'https://airport.ee/en/public-transport/' },
    { title: 'Port of Tallinn: terminal D (Estonian)', url: 'https://www.ts.ee/d-terminal/' },
    { title: 'TLT: frequently asked questions (Estonian)', url: 'https://tlt.ee/ettevottest/korduma-kippuvad-kusimused/' },
    { title: 'Elron: frequently asked questions (Estonian)', url: 'https://elron.ee/uldinfo/korduma-kippuvad-kusimused' },
    { title: 'Kadriorg Park: park rules', url: 'https://kadriorupark.ee/visitor-information/park-rules' },
    { title: 'TalTech: transport and parking on the Mustamäe campus (Estonian)', url: 'https://taltech.ee/linnakud/mustamae/transport-ja-parkimine' },
  ],
};

export default guide;
