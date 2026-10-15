import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-fuerteventura',
  topic: 'fuerteventura',
  name: 'Renting an e-scooter in Fuerteventura',
  title: 'E-scooter Fuerteventura 2026: Hoppy, Bird, prices, rules',
  description: 'E-scooter Fuerteventura guide: Hoppy and Bird in Caleta de Fuste, Corralejo, Costa Calma and Morro Jable, their prices, the helmet law and where you can’t ride.',
  headline: 'E-scooters in Fuerteventura: Hoppy and Bird in four resorts, what a ride costs, and where you can’t ride',
  lede: 'You can rent an e-scooter in Fuerteventura in four resorts: from Hoppy and Bird in Caleta de Fuste, from Hoppy in Corralejo, and from Bird in Costa Calma and Morro Jable. Ten minutes on a Hoppy cost €4.20–4.90; Bird shows its price only in its app. You must be 18 to rent, and since 1 October 2026 Spanish law requires a helmet, which neither operator lends, so bring your own. The scooters stay inside the resorts: you can’t ride them on the promenades, to the airport, into the Corralejo dunes or onto the Lanzarote ferry.',
  published: '2026-10-14',
  updated: '2026-10-15',
  city: 'es:Caleta de Fuste',
  sections: [
    {
      heading: 'Which e-scooter app works in Fuerteventura?',
      blocks: [
        'This guide, like our map, covers shared e-scooters: the stand-up kind you unlock with an app and pay for by the minute, not mopeds or mobility scooters. Two operators run them, each with its own app, and which you need depends on the resort:',
        {
          table: {
            caption: 'Shared e-scooters in Fuerteventura by resort (our map, afternoon of 14 October 2026)',
            head: ['Resort (municipality)', 'Operators', 'Scooters on our map'],
            rows: [
              ['[Caleta de Fuste](map:es:Caleta de Fuste) (Antigua)', 'Hoppy and Bird', '314: 167 Hoppy, 147 Bird'],
              ['[Corralejo](map:es:Corralejo) (La Oliva)', 'Hoppy', '194'],
              ['[Costa Calma](map:es:Costa Calma) (Pájara)', 'Bird', '65'],
              ['[Morro Jable](map:es:Morro Jable) (Pájara)', 'Bird', '62'],
              ['Puerto del Rosario, the capital', 'None found', '–'],
            ],
          },
        },
        'The counts are a snapshot of the operators’ open data, not fleet sizes. In Caleta de Fuste you need both apps to see every scooter.',
        'Shops renting e-scooters by the hour or day publish no data, so they aren’t on our map.',
      ],
    },
    {
      heading: 'Signing up: foreign phone, card, licence and age',
      blocks: [
        'A foreign phone and card should work: neither Hoppy’s nor Bird’s Spanish terms ask for a Spanish number or card.',
        {
          list: [
            '**Hoppy** (Hoppy Mobility on Google Play) signs you up with your mobile number and a code by text, and its terms forbid registering a number that isn’t yours. It takes credit and debit cards, topping up your balance automatically unless you turn that off.',
            '**Bird** emails you a sign-in code or link. It takes cards, and Apple Pay, Google Pay or PayPal in some cities.',
          ],
        },
        'Hoppy doesn’t say whether every foreign number gets its text: sign up at home, while there’s time to fix a problem.',
        'You need **no driving licence and no ID scan**: you confirm in the app that you’re 18, the age both operators require, although Spanish law lets you ride from 15. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Fuerteventura?',
      blocks: [
        'Hoppy’s prices differ by resort and by scooter, and most of its scooters are in the top band; the app shows the rate of the one you scan. Bird publishes no price for Fuerteventura: check it in its app.',
        {
          table: {
            caption: 'E-scooter prices in Fuerteventura (published rates, 14 October 2026)',
            head: ['Operator and resort', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Hoppy, Caleta de Fuste', '€1', '€0.32–0.37, mostly €0.37', '€4.20–4.70', '€7.40–8.40'],
              ['Hoppy, Corralejo', '€1.20', '€0.35–0.37, mostly €0.37', '€4.70–4.90', '€8.20–8.60'],
              ['Bird, Caleta de Fuste, Costa Calma and Morro Jable', 'In the app', 'In the app', 'In the app', 'In the app'],
            ],
          },
        },
        'You pay for every minute the scooter is unlocked, moving or not; the app has the final price.',
      ],
    },
    {
      heading: 'Can you ride on the promenade? Caleta, Corralejo and Morro Jable',
      blocks: [
        'No. Antigua’s and Pájara’s bylaws ban scooters from pavements, squares and any other space reserved for pedestrians, promenades included. In Corralejo, where Spain’s national rules apply, Hoppy’s app blocks the seafront.',
        {
          list: [
            '**Caleta de Fuste.** The Paseo Marítimo along the beach is pedestrian space, even where the apps let you ride. Where a stretch is signed as a cycle path, follow the signs; otherwise walk the scooter.',
            '**Corralejo.** Hoppy won’t let you ride through, start or end a ride on the Avenida Marítima, around the harbour, or on the pedestrian part of Avenida Nuestra Señora del Carmen, the main shopping street. In the old fishing quarter around Calle La Milagrosa it slows you to 10 km/h.',
            '**Costa Calma and Morro Jable.** Pájara’s bylaw keeps scooters off promenades, Morro Jable’s beachfront included, and off ordinary roads too: you may ride only on 30 km/h streets and in cycle lanes, as signed, and at 5 km/h on cycle routes through pedestrian areas. Bird’s open data are unclear on where its app stops you: trust the app’s map.',
          ],
        },
      ],
    },
    {
      heading: 'Where to park: Hoppy’s spots, Bird’s zones',
      blocks: [
        '**Hoppy.** A ride can start and end only at one of its marked spots: 98 in Caleta de Fuste and 34 in Corralejo, in its open data. Find the nearest before you set off: you pay until the ride ends.',
        '**Bird.** No fixed spots here: park inside its zone, upright and out of people’s way, where the app’s map lets you end the ride.',
        'The bylaws add their own limits: Antigua bans parking on pavements, and Pájara allows it only in spaces meant for scooters or bikes.',
        {
          table: {
            caption: 'What the operators charge in Spain for bad parking and other breaches (their terms, October 2026)',
            head: ['Operator', 'Bad parking or a no-ride zone', 'Other charges'],
            rows: [
              ['Hoppy', 'Up to €50 for riding in a prohibited zone, and €100 to collect a scooter left there', '€150 if you abandon it; up to €1,290 if you destroy it; an insurance excess of up to €1,000'],
              ['Bird', 'A warning, then €5, then €20; a fourth breach can end your contract', 'Up to €120 if Bird has to collect it; up to €100 per 24 hours if you don’t end the ride'],
            ],
          },
        },
      ],
    },
    {
      heading: 'The airport, the dunes, the Lanzarote ferry and the buses',
      blocks: [
        'Interurban roads, here the FV-1 and FV-2, are closed to e-scooters, and each app’s area ends at the resort’s edge, so you can’t ride between resorts.',
        {
          list: [
            '**The airport.** No scooter area reaches it: the nearest scooter is about 4 km away in Caleta de Fuste, and the FV-2 between them is closed to e-scooters. Take Tiadhe bus 03, which stops at the airport between Puerto del Rosario and Caleta de Fuste every 15–30 minutes from about 06:00 to 23:00, Monday to Saturday, less often on Sundays (€1.45 from Puerto to Caleta), or a taxi.',
            '**The dunes.** Hoppy’s Corralejo area ends at the southern edge of town. The Parque Natural de Corralejo lies beyond it, and the FV-1 through the park is closed to e-scooters.',
            '**The Lanzarote ferry.** The Armas, Fred. Olsen and Líneas Romero terminals in Corralejo’s harbour lie inside a Hoppy no-ride zone, 500–700 m from the nearest spot, and a shared scooter can’t go on board.',
            '**Buses.** Tiadhe has banned e-scooters on all its buses since 27 March 2024. Line 06 links Corralejo’s harbour with Puerto del Rosario (€3.40), where you change to line 03 for the airport; line 05 links Costa Calma and Morro Jable (€2.70). Pay cash, or buy a BtF card on board for €5 and get 10% off.',
          ],
        },
      ],
    },
    {
      heading: 'Spain’s e-scooter rules for visitors',
      blocks: [
        'Spain’s rules changed on 1 October 2026 and apply here as everywhere else; the Canary Islands have no e-scooter law of their own. On a rental, the operator handles registration and insurance.',
        { note: 'A helmet has been compulsory for every e-scooter rider in Spain since 1 October 2026, on rental scooters too: €200, and the police may immobilise the scooter. Neither Hoppy nor Bird lends one in Fuerteventura, so pack your own.' },
        {
          table: {
            caption: 'E-scooter rules and fines in Spain, October 2026',
            head: ['Rule', 'What to do', 'Fine'],
            rows: [
              ['Helmet', 'Certified and fastened, at any age, on every ride', '€200, and the scooter may be immobilised'],
              ['Licence and age', 'No licence. Legal minimum age 15; Hoppy and Bird rent only to over-18s', '–'],
              ['After dark or in poor visibility', 'A certified reflective or luminous item visible at 150 m; Pájara’s bylaw asks for a reflective vest', '€200'],
              ['Pavements and pedestrian areas', 'Never on pavements; in pedestrian areas only where the town allows it, which Antigua and Pájara don’t', 'Set by the town; €200 for pavements before October 2026'],
              ['Between resorts', 'Not on interurban roads or motorways, such as the FV-1 and FV-2', 'No published amount'],
              ['Passengers', 'One rider only', '€100'],
              ['Phone and headphones', 'No phone in your hand, and no headphones, not even one earbud', '€200 each'],
              ['Alcohol', 'Limit 0.5 g/l in the blood (0.25 mg/l in breath), the general limit for drivers', '€500; €1,000 above double the limit or for a repeat within a year'],
            ],
          },
        },
        'Fines are halved if you pay within 20 days, and according to Spain’s traffic authority, the DGT, you lose no licence points on an e-scooter.',
        'The towns add their own bylaws: Antigua’s of 2019 and Pájara’s of 2022 are in force. La Oliva, which covers Corralejo, approved a draft in February 2026, but as of 15 October 2026 its final text hadn’t been published, so it isn’t in force yet.',
      ],
    },
    {
      heading: 'Do the scooters run all year? Season, sun and wind',
      blocks: [
        {
          list: [
            '**All year.** Neither operator publishes a winter break, and Hoppy’s open data give its hours as 24/7. Winter numbers aren’t published, so check the map before you go.',
            '**Sun.** At Fuerteventura airport the average daily high ranges from 20.6 °C in January to 27.8 °C in August, with 2,836 hours of sunshine and about 16 rainy days a year (AEMET, 1981–2010).',
            '**Wind.** The trade wind usually blows hardest in summer and picks up during the day, which is why Sotavento, next to Costa Calma, hosts a windsurf and wingfoil World Cup; its 38th edition ran from 17 July to 1 August 2026. Ride in the morning, and expect a headwind one way.',
            '**Hills.** Caleta de Fuste and Corralejo are flat; Morro Jable climbs steeply from the seafront.',
            '**Kites.** Corralejo’s 39th International Kite Festival runs from 9 to 15 November 2026 on the Grandes Playas, in the dunes park beyond Hoppy’s area. Bus 06 stops by the Riu hotels there.',
          ],
        },
        'Visiting Tenerife too? See [e-scooters in Tenerife](guide:tenerife).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Caleta de Fuste had scooter rules before Spain did.** Antigua published its bylaw in July 2019, 17 months before Spain’s first national e-scooter rules took effect in January 2021.',
            '**242 scooters in one day.** On 17 September 2024 La Oliva’s police removed 242 rental scooters from Corralejo’s streets, because the companies running them had no permit.',
            '**200 in a weekend.** In May 2023 Pájara removed 200 badly parked e-scooters from Costa Calma, and named Morro Jable as the area with the most problems.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which app do I need for e-scooters in Fuerteventura?',
      answer: 'Hoppy for Caleta de Fuste and Corralejo, Bird for Caleta de Fuste, Costa Calma and Morro Jable. ScootRadar’s map shows both, and a button opens the right app, where you unlock and pay.',
    },
    {
      question: 'How much is a Hoppy scooter in Fuerteventura?',
      answer: 'In Caleta de Fuste, €1 to unlock plus €0.32–0.37 a minute; in Corralejo, €1.20 plus €0.35–0.37, as published on 14 October 2026. Ten minutes cost €4.20–4.90. Bird shows its prices only in its app.',
    },
    {
      question: 'Do I need a helmet to ride an e-scooter in Fuerteventura?',
      answer: 'Yes. Since 1 October 2026 every e-scooter rider in Spain must wear a certified helmet, on rental scooters too; the fine is €200. Neither Hoppy nor Bird lends helmets, so pack one.',
    },
    {
      question: 'Do I need a driving licence to rent an e-scooter in Fuerteventura?',
      answer: 'No. You need to be 18, with a payment card and a phone: Hoppy texts you a code, Bird emails one. The apps ask you to confirm your age but don’t scan any ID. A moped is different: it needs a driving licence.',
    },
    {
      question: 'Can I ride an e-scooter from Fuerteventura airport to Caleta de Fuste?',
      answer: 'No. The nearest scooter area is about 4 km from the terminal, and the FV-2 in between is closed to e-scooters. Take Tiadhe bus 03, which stops at the airport on its way to Caleta de Fuste, or a taxi.',
    },
  ],
  sources: [
    { title: 'BOE: Royal Decree 518/2026, reform of Spain’s General Traffic Regulations (Spanish)', url: 'https://www.boe.es/eli/es/rd/2026/06/24/518' },
    { title: 'DGT: personal mobility vehicles (VMP), updated 8 October 2026 (Spanish)', url: 'https://www.dgt.es/nuestros-servicios/tu-vehiculo/vehiculos-de-movilidad-personal-vmp/' },
    { title: 'Provincial bulletin (BOP) of Las Palmas, 29 July 2019: Antigua’s e-scooter bylaw (PDF, Spanish)', url: 'https://www.boplaspalmas.net/boletines/2019/29-7-19/29-7-19.pdf' },
    { title: 'Pájara Town Hall: bylaw no. 51 on personal mobility vehicles (Spanish)', url: 'https://www.pajara.es/51-ordenanza-sobre-el-uso-y-la-circulacion-de-vehiculos-de-movilidad-personal-y-de-bicicletas-de-pedales-con-pedaleo-asistido-del-municipio-de-pajara/' },
    { title: 'Provincial bulletin (BOP) of Las Palmas, 16 March 2026: La Oliva’s draft bylaw, initial approval (PDF, Spanish)', url: 'https://www.boplaspalmas.net/boletines/2026/16-3-26/16-3-26.pdf' },
    { title: 'Tiadhe: notice banning e-scooters on buses from 27 March 2024 (PDF, Spanish)', url: 'https://tiadhe.com/docs/AVISO%20PATINETAS.pdf' },
    { title: 'Tiadhe: line 03, Puerto del Rosario, airport, Caleta de Fuste and Las Salinas (Spanish)', url: 'https://tiadhe.com/linea-03/' },
    { title: 'Hoppy: open data for Caleta de Fuste (GBFS)', url: 'https://hoppy.rideatom.com/gbfs/1188/v3.0/gbfs' },
    { title: 'Bird: open data for Pájara (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/pajara/gbfs.json' },
    { title: 'Hoppy: terms and conditions for Spain (Spanish)', url: 'https://behoppy.eu/es/terminos-y-condiciones/' },
    { title: 'Fuerteventura Digital: La Oliva removes 242 scooters from Corralejo, 22 September 2024 (Spanish)', url: 'https://www.fuerteventuradigital.com/municipios/oliva-retira-242-patinetas-calles-corralejo-inicia-expediente-sancionador-empresa/20240922091941003077.html' },
    { title: 'AEMET: climate normals at Fuerteventura airport (Spanish)', url: 'https://www.aemet.es/es/serviciosclimaticos/datosclimatologicos/valoresclimatologicos?l=C249I&k=coo' },
  ],
};

export default guide;
