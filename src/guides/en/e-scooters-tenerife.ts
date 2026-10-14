import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-tenerife',
  topic: 'tenerife',
  name: 'Renting an e-scooter in Tenerife',
  title: 'E-scooter Tenerife 2026: Bird, Hopp, prices and helmet law',
  description: 'E-scooter Tenerife guide: Bird and Hopp from Los Cristianos to Costa Adeje and Golf del Sur, prices, the new helmet law and the promenades you can’t ride.',
  headline: 'E-scooters in Tenerife: Bird and Hopp in the south, what a ride costs, and the promenades you can’t ride',
  lede: 'You can rent an e-scooter in Tenerife from Bird or Hopp in the south of the island: along the coast from Los Cristianos through Playa de las Américas to Costa Adeje and La Caleta, and with Hopp also in Golf del Sur. Hopp charges €0.95 to unlock and €0.25 a minute, so 10 minutes cost €3.45; Bird shows its price only in its app. You must be 18 to rent, and since 1 October 2026 a helmet is compulsory in Spain: neither operator supplies one, so bring your own. Stay off the seafront promenade between Los Cristianos and Las Américas, where scooters are banned and the police check.',
  published: '2026-10-13',
  updated: '2026-10-13',
  city: 'es:Playa de las Américas',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Tenerife?',
      blocks: [
        'This guide, like our map, covers shared e-scooters: the stand-up kind you find on the street, unlock with an app and pay for by the minute. It doesn’t cover mobility scooters or mopeds, though that’s what most searches for “scooter hire” in Tenerife turn up: shops hire mobility scooters by the week, and a moped needs a driving licence.',
        'As of October 2026, our map shows two operators in the south:',
        {
          list: [
            '**Bird**, on one strip from Los Cristianos through Playa de las Américas to Costa Adeje and La Caleta.',
            '**Hopp**, an Icelandic brand run here by a local franchise, on almost the same strip, plus a small separate area in **Golf del Sur**, further east in San Miguel de Abona.',
          ],
        },
        'On the morning of 13 October 2026 the [map of Playa de las Américas](map:es:Playa de las Américas) showed about 500 Bird and 30 Hopp scooters, and the [map of Golf del Sur](map:es:Golf del Sur) another 16 Hopps, about 45 in all: a snapshot of the operators’ open data, not their fleet sizes.',
        'We found no published licence scheme, tender or fleet cap for rental scooters in Arona, Adeje or San Miguel de Abona, the three towns concerned; the police enforce Spain’s rules and each town’s bylaws.',
        'Two other apps have no public data feed and aren’t on our map. Dott has run shared scooters in Santa Cruz, the capital, since 2024, free for registered residents according to the city (January 2025); its website also lists the south, but we found no other sign of Dott there. ISLA Ride, an app launched in December 2025, advertises e-scooter rental in Tenerife; we couldn’t confirm where it runs or what it costs.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Tenerife?',
      blocks: [
        'Hopp publishes its price, the same in both its areas. Bird publishes no Tenerife price, so check its app before you unlock.',
        {
          table: {
            caption: 'E-scooter prices in the south of Tenerife (published rates, 13 October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes', 'Where your ride ends'],
            rows: [
              ['Hopp', '€0.95', '€0.25', '€3.45', '€5.95', 'Anywhere sensible inside its two areas, with a photo'],
              ['Bird', 'In the app', 'In the app', 'In the app', 'In the app', 'Only at one of its 199 parking spots'],
            ],
          },
        },
        'You pay for every minute the scooter is unlocked, moving or not; the app has the final price. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
        'For a whole day of sightseeing the bus is cheaper. TITSA’s one-day tourist pass costs €10 (plus €2 for the ten+ card) for 24 hours of unlimited buses and trams; 40 minutes on a Hopp cost €10.95.',
      ],
    },
    {
      heading: 'Where you can’t ride: the promenades of Los Cristianos and Las Américas',
      blocks: [
        'Arona, the municipality that covers Los Cristianos and Playa de las Américas, has banned bikes, segways and scooters on 98 promenades and pedestrian streets since 2016. They include the seafront between Los Cristianos and Las Américas (Paseo Marítimo, Paseo de Las Vistas and Paseo Francisco Andrade Fumero), the pedestrian old town of Los Cristianos, and the promenades of Palm-Mar and Las Galletas.',
        { note: 'Neither Bird nor Hopp blocks these promenades: the app will let you ride along the Paseo Marítimo; the police won’t. Walk the scooter there, or use the road.' },
        'Arona’s police do check. They removed 5,259 scooters from the town’s streets in 2024, and in one operation in April 2026 they filed 92 reports and immobilised 81 scooters, for riding in pedestrian areas, missing the compulsory registration and parking where it isn’t allowed. The fines go to the rental companies, which can pass them on to you.',
        'In Costa Adeje, the town hall tells riders to keep off pavements and pedestrian zones, and to get off and walk across zebra crossings. We found no list of banned promenades there like Arona’s, so treat the seafront walk as a pedestrian zone and walk the scooter.',
        'On 28 April 2026 Adeje’s council also gave initial approval to a new traffic ordinance. It takes effect only once the provincial bulletin publishes its full text, and we found no such publication up to 13 October. The version on the town hall’s website, dated August 2026, counts riding across a zebra crossing as a reckless manoeuvre and requires rental firms to hold a municipal licence and track every scooter live.',
      ],
    },
    {
      heading: 'Where to park: Bird’s 199 spots and Hopp’s zones',
      blocks: [
        '**Bird.** It uses fixed parking spots across its whole area: a ride can end only at one of those shown in the app (its open data lists 199). Find the nearest one before you set off: you pay until the ride ends.',
        '**Hopp.** Park anywhere sensible inside its two areas, off the promenade and out of pedestrians’ way, then take the end-of-ride photo. In a few zones in the upper part of Costa Adeje, around San Eugenio Alto for example, you can ride through but can’t start or end a ride, and riding is banned in three small zones, among them the Puerto Colón marina. Check the app’s map.',
        {
          table: {
            caption: 'What the operators charge in Spain for bad parking and other breaches (their terms, October 2026)',
            head: ['Operator', 'Bad parking or breaking the rules', 'Other charges'],
            rows: [
              ['Bird', 'A warning the first time, then €5, then €20; at the fourth, Bird can end your contract', 'Up to €120 if you can’t bring the scooter back to a valid area and Bird has to collect it'],
              ['Hopp', '€30 if you skip the end-of-ride photo', '€50 to collect a scooter left outside the area within 20 km; up to €500 further away or on private land'],
            ],
          },
        },
        'Town-hall fines come on top. Arona’s police report scooters parked where they shouldn’t be, and Adeje asks you to park in a marked zone without blocking the way.',
      ],
    },
    {
      heading: 'Spain’s e-scooter rules for visitors',
      blocks: [
        'Spain’s rules changed on 1 October 2026 and apply in Tenerife as everywhere else in the country. You need no licence, but you must be 18 to rent (the law’s minimum age is 15). The operator registers and insures the scooter; the rest is up to you.',
        {
          table: {
            caption: 'E-scooter rules and fines in Spain, as of 13 October 2026',
            head: ['Rule', 'What to do', 'Fine'],
            rows: [
              ['Helmet', 'Compulsory for every rider since 1 October 2026, rental scooters included: certified and fastened. Bring your own', '€200, and the police may immobilise the scooter'],
              ['At night or in poor visibility', 'Wear at least one certified reflective or luminous item, visible at 150 m (Spain’s traffic authority, the DGT, speaks of a vest)', '€200'],
              ['Pavements and pedestrian zones', 'Never on pavements, and in pedestrian zones only where the town allows it; otherwise walk the scooter. Ride on the road, in the middle of the lane, or in a bike lane where allowed', 'Set by the town; €200 for pavements before October 2026'],
              ['Out of town', 'Not on motorways such as the TF-1, or on interurban roads', 'No published amount'],
              ['Passengers', 'One rider only', '€100'],
              ['Phone and headphones', 'No phone in your hand, and no headphones, not even one earbud', '€200 each'],
              ['Alcohol', 'Limit 0.5 g/l in the blood (0.25 mg/l in breath), as for drivers', '€500; €1,000 above double the limit or for a repeat within a year'],
            ],
          },
        },
        'Fines are halved if you pay within 20 days, and according to the DGT you lose no licence points on an e-scooter.',
      ],
    },
    {
      heading: 'Heat, hills, buses and the airport',
      blocks: [
        {
          list: [
            '**Heat.** At Tenerife South airport the average daily high is 28.4 °C in August and still 26.8 °C in October (AEMET, 1981–2010), with only about 15 rainy days a year. Carry water and ride early or late in summer: the helmet rule applies in the heat too.',
            '**Hills.** The seafront from Los Cristianos to Puerto Colón is fairly flat. Costa Adeje climbs steeply inland, around San Eugenio Alto and Torviscas Alto.',
            '**Between resorts.** You can’t ride from Los Cristianos to Hopp’s Golf del Sur area, El Médano or the airport: the TF-1 is a motorway, and interurban roads are closed to e-scooters.',
            '**The airport.** No scooter area reaches Tenerife South. Take TITSA bus 40, which runs from Costa Adeje bus station through Los Cristianos to the airport in about 40 minutes, roughly every half hour from 05:30 to 21:40, or night line 711.',
            '**Buses and the tram.** A shared scooter can’t go on a bus or tram. The tram between Santa Cruz and La Laguna bans e-scooters on board; TITSA’s bus rules don’t mention them.',
          ],
        },
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**The promenades closed before Spain had a scooter law.** Arona’s ban dates from 2016; Spain first defined the e-scooter in law in a decree that took effect in January 2021.',
            '**In Arona, almost every scooter the police seize is a rental.** After the April 2026 operation, the Canary public broadcaster RTVC put the share at 99.9%.',
            '**The Hopps in Las Américas come from Iceland.** Hopp started in Reykjavík in 2019 and grew through franchises, the first abroad in Orihuela Costa, Spain, in 2020. Hopp Tenerife’s open data gives its start date as 28 March 2022, and the same app works in Reykjavík.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'What is the best e-scooter app in Tenerife?',
      answer: 'There isn’t one app for all: Bird and Hopp each have their own, and you need the one whose scooter you want to ride. Hopp publishes its price and lets you park anywhere sensible in its areas; Bird’s rides end only at its parking spots. [Our map](map:es:Playa de las Américas) shows both, and a button opens the right app.',
    },
    {
      question: 'How much are Hopp (“Hoppy”) scooters in Tenerife?',
      answer: '€0.95 to unlock plus €0.25 a minute, as published on 13 October 2026: 10 minutes cost €3.45 and 20 minutes €5.95. The scooters in Las Américas are Hopp; Hoppy is a different company, not in Tenerife.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Tenerife?',
      answer: 'Yes. Since 1 October 2026 every e-scooter rider in Spain must wear a certified helmet, on rental scooters too; the fine is €200, and the police may immobilise the scooter. Neither Bird nor Hopp lends helmets, so pack one.',
    },
    {
      question: 'Can you ride an e-scooter on the promenade in Los Cristianos or Las Américas?',
      answer: 'No. Since 2016 Arona has banned scooters, bikes and segways on the seafront and on 98 promenades and pedestrian streets in all, and the police seize scooters there. The apps don’t stop you, so walk the scooter or use the road.',
    },
    {
      question: 'Do I need a licence to rent a scooter in Tenerife?',
      answer: 'Not for a shared e-scooter: you need to be 18, with a phone and a payment card. A moped is different: you need a driving licence and a moped-hire firm.',
    },
    {
      question: 'Can I ride an e-scooter to Tenerife South airport?',
      answer: 'No. Neither operator’s area reaches the airport, and the direct road, the TF-1, is a motorway closed to e-scooters. Take bus 40 from Costa Adeje or Los Cristianos, or the 711 at night.',
    },
  ],
  sources: [
    { title: 'DGT: personal mobility vehicles (VMP), updated 8 October 2026 (Spanish)', url: 'https://www.dgt.es/nuestros-servicios/tu-vehiculo/vehiculos-de-movilidad-personal-vmp/' },
    { title: 'Arona Town Hall: the 2016 ban on 98 promenades and pedestrian streets (PDF, Spanish)', url: 'https://www.arona.org/Portals/0/documentos/0_37129_1.pdf' },
    { title: 'Arona Town Hall: scooters removed in 2024 and 2025, 23 July 2025 (Spanish)', url: 'https://www.arona.org/Tu-Ayuntamiento/Prensa/Noticias/ctl/Ver/mid/422?id=92916' },
    { title: 'Arona Town Hall: 92 scooters reported and 81 immobilised, 6 April 2026 (Spanish)', url: 'https://www.arona.org/Tu-Ayuntamiento/Prensa/Noticias/ctl/Ver/mid/422?id=94385' },
    { title: 'RTVC: town halls step up checks on e-scooters, 6 April 2026 (Spanish)', url: 'https://rtvc.es/ayuntamientos-endurecen-control-patinetes-electricos-6-abril-2026/' },
    { title: 'Adeje Town Hall: the new traffic ordinance, August 2026 text (PDF, Spanish)', url: 'https://www.adeje.es/website/descargas.asp?doc=14314&k=14314-ordenanza-circulacion.pdf' },
    { title: 'Hopp: locations and prices', url: 'https://hopp.bike/locations' },
    { title: 'Bird: open data for the south of Tenerife (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/adeje/gbfs.json' },
    { title: 'TITSA: buses to Tenerife South airport (Spanish)', url: 'https://titsa.com/index.php/tenerife-en-guagua/lineas-de-aeropuertos/aeropuerto-tenerife-sur' },
    { title: 'Metrotenerife: tram user guide (Spanish)', url: 'https://metrotenerife.com/guia-del-usuario/' },
    { title: 'AEMET: climate normals at Tenerife South airport (Spanish)', url: 'https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=C429I&k=coo' },
  ],
};

export default guide;
