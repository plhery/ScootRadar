import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-warsaw',
  topic: 'warsaw',
  name: 'Renting an e-scooter in Warsaw',
  title: 'E-scooters Warsaw 2026: Bolt, Dott, Lime, parking and rules',
  description: 'E-scooters in Warsaw: Bolt, Dott and Lime, where you may ride and park, the 12 km/h streets, the no-go Old Town and Łazienki, and Poland’s fines.',
  headline: 'E-scooters in Warsaw: Bolt, Dott and Lime, and where you may ride and park',
  lede: 'To rent an e-scooter in Warsaw, use the Bolt, Dott or Lime app: the three companies in the city’s e-scooter agreement of May 2026. Check the fare and the company’s minimum age in its app before you unlock. Ride on the cycle path at no more than 20 km/h, on the pavement only at walking pace where there’s no other way, and park at a marked rack or the pavement’s outer edge, never in the Old Town or Łazienki Park.',
  published: '2026-10-25',
  updated: '2026-11-03',
  city: 'pl:Warszawa',
  sections: [
    {
      heading: 'Bolt, Dott and Lime: who rents e-scooters in Warsaw',
      blocks: [
        'No law lets Warsaw set binding rules for e-scooters, says its roads authority, Zarząd Dróg Miejskich (ZDM), so the city relies on voluntary agreements: since 2021, and since 22 May 2026 new ones with **Bolt, Dott and Lime**, the three renting here. The companies accept slow and no-go zones, parking places and penalties.',
        'At 13:50 on Sunday 25 October 2026 the [map of Warsaw](map:pl:Warszawa) showed about 11,700 Dott and Bolt e-scooters free to rent at that moment.',
        'Check the fare, and the company’s minimum age for renting, in its app before you unlock. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Where can you ride an e-scooter in Warsaw?',
      blocks: [
        'Polish law, the Prawo o ruchu drogowym (Road Traffic Act), treats an e-scooter as a vehicle that may go no faster than **20 km/h**. Where you ride follows a strict order:',
        {
          steps: [
            'The cycle path or cycle lane, where there’s one for your direction.',
            'Otherwise the road, but only where the speed limit is 30 km/h or less.',
            'The pavement only where it runs beside a road with a limit above 30 km/h and there’s no cycle path or lane. Then ride at close to walking pace and give way to pedestrians.',
          ],
        },
        'The agreement also has the companies build zones into their scooters (ZDM, 22 May 2026):',
        {
          list: [
            '**No riding or parking:** the Old Town (Stare Miasto), Krasiński Garden (Ogród Krasińskich), Łazienki Park, and since May 2026 Park Sowińskiego and Lasek na Kole. Follow the no-entry signs there, the city’s page says.',
            '**12 km/h:** Krakowskie Przedmieście and Nowy Świat when they’re pedestrianised, the pedestrian part of Chmielna, the Vistula boulevards where there’s no separate cycle path, and since May 2026 Złota, Zgoda, Bracka, Plac Centralny and the pedestrian and cycle bridge over the Vistula.',
          ],
        },
        'Our [Warsaw map](map:pl:Warszawa) draws them from zoom 14, credited to ZDM, on OpenStreetMap’s outlines and streets: the Old Town as its World Heritage site, without the paths along the Wisłostrada below it, and Złota and Bracka only where they’re pedestrian or living streets. Krakowskie Przedmieście and Nowy Świat aren’t drawn, as ZDM doesn’t give the hours they’re pedestrianised, nor the boulevards, as it doesn’t say which stretches.',
        'In September 2026 the mayor said more places had been added, unnamed (Notes from Poland): check the app before you set off.',
      ],
    },
    {
      heading: 'E-scooter parking in Warsaw and what bad parking costs',
      blocks: [
        'By law you may leave an e-scooter on the pavement in a place marked for it or, if there’s none, at the edge farthest from the road, parallel to it, with at least **1.5 m** left clear for pedestrians.',
        'The city has stickered about **12,500 racks** at 2,900 places for e-scooters, Veturilo city-bike stations included, and there are 133 parking zones (strefy postoju) in Śródmieście, Żoliborz, Wola and Bielany. Under the May 2026 agreement you can’t end a ride on a bridge, in a tunnel, in a home zone (strefa zamieszkania), on a street whose pavement is too narrow to park on legally, or in a park where scooters are banned.',
        { note: 'A scooter left in the way can be towed at its owner’s cost: in 2026, PLN 179 plus PLN 35 a day in the pound (city council resolution of 18 September 2025). For a rental that’s the company: check its terms in the app for what it may charge you.' },
        'In September 2026 the mayor said joint patrols of the municipal police and ZDM had towed more than 140 scooters in a few days (Notes from Poland, 17 September 2026).',
      ],
    },
    {
      heading: 'E-scooter rules in Poland: age, helmets, alcohol and fines',
      blocks: [
        {
          table: {
            caption: 'E-scooter rules and fines in Poland (October 2026)',
            head: ['Rule', 'What applies', 'Fine'],
            rows: [
              ['Age', '13 or over since 3 March 2026 (10 before); under 13 only in a home zone, with an adult', '–'],
              ['Under 18', 'Carry a bicycle card (karta rowerowa) or an AM, A1, B1, B or T licence', '–'],
              ['Helmet', 'Required under 16 since 3 June 2026', 'Up to PLN 100, for the parent or carer'],
              ['Cycle path', 'Use it where there is one', 'PLN 100'],
              ['Pavement', 'Only beside a road over 30 km/h with no cycle path or lane', 'PLN 200'],
              ['On the pavement', 'Walking pace, give way, don’t obstruct', 'PLN 300 each'],
              ['Riding', 'One rider; no animal, load or towing; not side by side on the road; a hand on the handlebar', 'PLN 50 for side by side or no hands'],
              ['Phone', 'Don’t hold it while riding', 'PLN 500'],
              ['Alcohol, 0.2‰ to 0.5‰', '“After drinking” (stan po użyciu alkoholu)', 'PLN 1,000 ticket; in court up to PLN 5,000 or arrest, and possibly a riding ban'],
              ['Alcohol, over 0.5‰', '“Drunk” (stan nietrzeźwości)', 'PLN 2,500 ticket; in court up to PLN 5,000 or arrest, and possibly a riding ban'],
            ],
          },
        },
        'Tickets follow the national fines tariff of 1 January 2022; the helmet fine and court penalties, the Code of Petty Offences. The city’s [e-scooter page](https://warszawa19115.pl/-/elektryczne-hulajnogi) sums up the rules in Polish and lists each company’s contact for reporting a badly parked scooter.',
      ],
    },
    {
      heading: 'Łazienki Park and the airport',
      blocks: [
        '**Łazienki Park.** The Łazienki Królewskie Museum, the state body that runs it, rules out cycling, scooters and rollerblades in the Gardens: “In the Gardens it is not allowed: to cycle, ride a scooter, rollerblade…” (Gardens Rules). The park is one of the city’s no-go zones as well.',
        '**Chopin Airport.** SKM trains S2 and S3 and bus 175 link it with the city, the airport’s page says.',
      ],
    },
    {
      heading: 'Taking an e-scooter on the metro, trams, buses and trains',
      blocks: [
        'The city council’s rules for ZTM’s metro, trams and buses let you carry an e-scooter as luggage if it doesn’t block the aisle, endanger other passengers or their property or block the driver’s view, the city’s 19115 page says; you may not use one on board. It doesn’t say the scooter must be folded. SKM’s suburban trains run under the same rules.',
        'Koleje Mazowieckie’s regional trains carry “a folded scooter, including an electric one” free as hand luggage, but not on replacement buses or the Modlin station–Modlin Airport bus (§ 17 of its rules, in force since 1 June 2026).',
      ],
    },
    {
      heading: 'Did you know? Warsaw e-scooter facts',
      blocks: [
        {
          list: [
            '**The word is a little story.** Hulajnoga, Polish for scooter, came third (5.99%) in the University of Warsaw’s internet vote for Word of the Year 2019. The university explains it as hula(j)-, from East Slavic ‘to stroll, ride, make merry’, plus noga, the leg that pushes off.',
            '**Warsaw went first,** ZDM says: the first Polish city to sign agreements with scooter companies, in 2021, and the first to make them pay for parking zones, about PLN 1 million a year.',
            '**A small share, many crashes.** Scooters were 7.8% of the traffic counted on Warsaw’s cycle routes, ZDM said in May 2026, yet in 2025 their riders were in 66 accidents and caused 39; 73 people were hurt.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Is Lime in Warsaw?',
      answer: 'Yes, one of the three companies in the city’s May 2026 agreement; its scooters are on the [Warsaw map](map:pl:Warszawa). Its app shows the price and parking rules.',
    },
    {
      question: 'Can I ride an e-scooter on the pavement in Warsaw?',
      answer: 'Only beside a road with a limit above 30 km/h where there’s no cycle path or lane, and then at close to walking pace, giving way to pedestrians. Otherwise it’s a PLN 200 fine, and PLN 300 for riding too fast there.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Poland?',
      answer: 'Only if you’re under 16, since 3 June 2026; the parent or carer can be fined up to PLN 100. The law asks no helmet of riders aged 16 or over.',
    },
    {
      question: 'Can I take an e-scooter on the Warsaw metro?',
      answer: 'Yes, your own, as luggage, if it doesn’t block the aisle, put other passengers at risk or block the driver’s view; you can’t ride it on board. Koleje Mazowieckie’s regional trains take it free if it’s folded.',
    },
    {
      question: 'How old do you have to be to ride an e-scooter in Warsaw?',
      answer: '13 under Polish law since 3 March 2026, with a bicycle card or a licence until 18. Each company sets its own minimum age for renting: check it in the app.',
    },
    {
      question: 'What happens if I leave a rental scooter in the wrong place?',
      answer: 'If it’s in the way, it can be towed for PLN 179 plus PLN 35 a day (2026), charged to the company; check its terms in the app for what it may charge you.',
    },
  ],
  sources: [
    { title: 'ZDM: new rules for rental e-scooters, 22 May 2026 (Polish)', url: 'https://zdm.waw.pl/aktualnosci/warszawa-wprowadza-nowe-zasady-dla-e-hulajnog-na-wynajem/' },
    { title: 'Warszawa 19115: e-scooters, 3 June 2026 (Polish)', url: 'https://warszawa19115.pl/-/elektryczne-hulajnogi' },
    { title: 'ZDM: vehicle removal and 2026 fees (Polish)', url: 'https://zdm.waw.pl/sprawy/usuwanie-pojazdow/' },
    { title: 'Dziennik Ustaw: Road Traffic Act, 2024 (Polish)', url: 'https://dziennikustaw.gov.pl/D2024000125101.pdf' },
    { title: 'Dziennik Ustaw: amending act of 17 October 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/DU/2025/1676' },
    { title: 'Dziennik Ustaw: Act on vehicle drivers, 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/D2025000122601.pdf' },
    { title: 'Dziennik Ustaw: Code of Petty Offences, 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/D2025000073401.pdf' },
    { title: 'Dziennik Ustaw: fines tariff from 1 January 2022 (Polish)', url: 'https://dziennikustaw.gov.pl/D2021000248401.pdf' },
    { title: 'Dziennik Ustaw: sobriety act (Polish)', url: 'https://dziennikustaw.gov.pl/D2023000215101.pdf' },
    { title: 'Łazienki Królewskie: Gardens Rules', url: 'https://www.lazienki-krolewskie.pl/en/regulamin-ogrodow' },
    { title: 'SKM Warszawa: public transport rules (Polish)', url: 'https://skm.warszawa.pl/przepisy-wtp/' },
    { title: 'Koleje Mazowieckie: carriage rules (Polish)', url: 'https://www.mazowieckie.com.pl/pl/przepisy-i-taryfy/regulamin-przewozu-osob-rzeczy-i-zwierzat' },
    { title: 'Warsaw Chopin Airport: to and from the airport', url: 'https://lotnisko-chopina.pl/en/to-and-from-the-airport/' },
    { title: 'Notes from Poland: parking patrols, 17 September 2026', url: 'https://notesfrompoland.com/2026/09/17/warsaw-launches-patrols-to-crack-down-on-improperly-parked-electric-scooters/' },
    { title: 'University of Warsaw: Word of the Year 2019 (Polish)', url: 'https://www.uw.edu.pl/wyniki-plebiscytu-slowo-roku-2019/' },
  ],
};

export default guide;
