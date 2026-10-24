import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-lisbon',
  topic: 'lisbon',
  name: 'Renting an e-scooter in Lisbon',
  title: 'E-scooter Lisbon 2026: Lime, Bolt, Bird, rules and parking',
  description: 'Renting an e-scooter in Lisbon: Lime, Bolt or Bird, the 20 km/h cap, why rides end only at hotspots, the no-go zones, the airport, ferries and Gira bikes.',
  headline: 'E-scooters in Lisbon: Lime, Bolt and Bird, the no-go zones, and why your ride ends only at a hotspot',
  lede: 'You can rent an e-scooter in Lisbon from Lime, Bolt or Bird in their apps, which show the price before you unlock: none of them publishes a Lisbon rate. Shared scooters are capped at 20 km/h, banned from pavements, bus lanes, parks and big squares such as Praça do Comércio and Rossio, and a ride can only end at a designated parking spot, a “hotspot”. Free minutes with the Navegante pass are for Lisbon residents only; visitors pay the app price, or ride Gira bikes for €2 a day. On 21 October 2026 the city council voted to end shared e-scooters: the operators have 60 days to remove them.',
  published: '2026-10-13',
  updated: '2026-10-24',
  city: 'pt:Lisboa',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Lisbon?',
      blocks: [
        'As of October 2026, three operators run shared e-scooters in Lisbon: **Lime**, **Bolt** and **Bird**. Lime also rents e-bikes. LINK, still listed in many older guides, left Portugal in early 2024.',
        'Lisbon has no bylaw for them. Since 9 January 2023 the rules have come from a collaboration agreement between the city council and the operators, amended on 23 June 2025, which applies until the city adopts the regulation it began drafting in 2022. The agreement also caps each operator’s fleet by season: up to 1,750 vehicles from 1 April to 31 October and 1,500 from 1 November to 31 March.',
        'On the morning of 13 October 2026 the [map of Lisbon](map:pt:Lisboa) showed about 2,200 Lime and 1,350 Bird scooters, in an area reaching a little beyond the city limits: a snapshot, not official fleet sizes. Bolt publishes no open data and isn’t on the map: open the Bolt app.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Lisbon?',
      blocks: [
        'None of the three publishes Lisbon prices, online or in open data, so the map can’t estimate a fare here. Each app shows the price before you unlock.',
        {
          table: {
            caption: 'E-scooter prices in Lisbon, as the operators publish them (13 October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', 'Passes', 'On the map, 13 Oct 2026'],
            rows: [
              ['Bolt', 'A small fee, amount not published', 'From €0.15 (Bolt’s rate for Portugal, not a Lisbon rate)', 'Unlimited unlocks from €0.99 a month; weekly and monthly passes', 'Not shown: no open data'],
              ['Lime', 'In the app', 'In the app', 'Not published', 'About 2,200'],
              ['Bird', 'In the app', 'In the app', 'Not published', 'About 1,350'],
            ],
          },
        },
        'At certain hours Bolt may ask you to pass a reaction test before you unlock. Prices in older travel blogs are years out of date. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
        '**Free minutes for residents.** If you live in Lisbon, are 18 or over and hold a monthly Navegante transport pass, each operator gives you up to 66 free minutes a month, 200 in all across the three. Only the first 10 minutes of a ride are free; the rest is charged at the operator’s rate. You activate it in each app (for Lime, at [navegante.li.me](https://navegante.li.me/)). Bird asks for your Navegante card number and tax number (NIF), takes 5 to 10 working days to check them, allows up to 10 free rides a month, doesn’t carry unused minutes over, must be reactivated every month and charges rides that start or end outside Lisbon. Visitors can’t use it.',
      ],
    },
    {
      heading: 'Where you can’t ride an e-scooter in Lisbon',
      blocks: [
        'Shared scooters here are limited to **20 km/h**, below the 25 km/h the law allows for an e-scooter. Ride in the cycle lane where there is one, otherwise on the road, keeping right and never against the traffic. The agreement and its 2025 addendum keep shared scooters out of:',
        {
          list: [
            'pavements, pedestrian streets, squares, gardens and parks, unless a sign allows it;',
            'bus lanes;',
            'the roads the city plan classes as “second-level”, such as the central carriageway of Avenida da Liberdade;',
            'the areas around monuments and squares;',
            'tunnels, viaducts and road bridges.',
          ],
        },
        'The press has named Praça do Comércio, Rossio, the Castelo de São Jorge, Parque Eduardo VII, Jardim da Estrela, Campo Pequeno and Belém’s Praça do Império among the no-go areas, along with the central carriageway of Avenida D. João II and the areas around the Cais do Sodré, Entrecampos, Sete Rios and Oriente stations.',
        'Geofencing enforces this: in these zones the app stops you riding or ending your ride. Each app shows the zones on its map.',
      ],
    },
    {
      heading: 'E-scooter parking in Lisbon: rides end only at hotspots',
      blocks: [
        'A ride can only end at a hotspot, a designated parking spot marked in the app. Bird alone listed 1,754 of them in its open data on 13 October 2026. Parking is banned at Metro entrances, bus and tram stops, crossings, taxi ranks and monument entrances.',
        { note: 'If the app won’t let you end your ride, you are outside a hotspot or in a no-parking zone. Move to the nearest spot the app shows: since the ride can only end there, you keep paying by the minute until you get there.' },
        'The municipal police and EMEL, the city’s parking company, can remove badly parked scooters: in 2025 the police removed 5,505 scooters and bicycles, about 15 a day. The operator pays, but the agreement makes operators put penalties for bad parking and riding in their terms, and Bird passes fines and pound fees on to the rider. We found no published amounts.',
        'At the big stations, end the ride at a hotspot outside the station area and walk: Bird has 19 hotspots within 300 m of Cais do Sodré and 4 within 300 m of Santa Apolónia.',
      ],
    },
    {
      heading: 'Portugal’s e-scooter rules in one table',
      blocks: [
        'Portuguese law treats an e-scooter of up to 0.25 kW and 25 km/h as a bicycle. You need no licence, the law sets no minimum age (the operators require 18), and insurance isn’t compulsory. The traffic code, the Código da Estrada, applies as for cyclists:',
        {
          table: {
            caption: 'E-scooter rules and fines in Portugal (Código da Estrada, October 2026)',
            head: ['Rule', 'What to do', 'Fine'],
            rows: [
              ['Pavement', 'Never ride on it (only children up to 10 may); push the scooter', '€60–300'],
              ['Direction', 'Ride with the traffic, keeping right', '€250–1,250 for riding against it'],
              ['Phone, earphones', 'Don’t use your phone; one earbud at most', '€250–1,250'],
              ['Alcohol', 'Limit 0.5 g/l, as for drivers; 1.2 g/l or more is a crime', '€250–1,250 (0.5–0.8 g/l); €500–2,500 (0.8–1.2 g/l)'],
              ['Passenger', 'One rider only', '€60–300'],
              ['Lights', 'On from dusk to dawn and in poor visibility', '€30–150'],
              ['Helmet', 'Not compulsory, but strongly advised', 'None today; €30–150 proposed'],
            ],
          },
        },
        'A helmet was compulsory from 2014 until January 2021. Two bills that would bring it back passed a first vote in Parliament on 30 September 2026, but they are not law yet.',
      ],
    },
    {
      heading: 'Hills, tram rails, the airport and crossing the Tagus',
      blocks: [
        {
          list: [
            '**Hills and calçada.** Lisbon is steep and climbs are slow at 20 km/h. The black-and-white stone paving of the old town, the calçada portuguesa, is slippery when wet: slow down in the rain.',
            '**Tram rails.** Cross the rails of the 28 and the other tram lines as close to a right angle as you can: small wheels catch in the groove.',
            '**Airport.** Bird has hotspots by Terminal 1, on Rua Interior ao Aeroporto da Portela, and about 20 Lime and Bird scooters stood within 500 m of it on the morning of 13 October 2026. There was no Bird hotspot near Terminal 2.',
            '**Ferries to Cacilhas.** The TTSL ferries take scooters only if they fold and travel as hand luggage, so a shared one can’t board. End your ride near Cais do Sodré, cross to Cacilhas and look for Lime or Bird on the [map of Almada](map:pt:Almada). The 25 de Abril and Vasco da Gama bridges carry motorways and are off limits.',
            '**Metro and trains.** A shared scooter can’t go on the Metro or a CP train either: end the ride at a hotspot near the station and walk in.',
            '**Beyond the city.** Bird also runs in [Oeiras](map:pt:Oeiras) and [Cascais](map:pt:Cascais), with about 390 and 640 scooters on the map on the morning of 24 October 2026. Lime launched in Oeiras in 2024 but doesn’t show there on the map. Lisbon’s agreement and its free minutes don’t apply there. Heading north? See [e-scooters in Porto](guide:porto).',
          ],
        },
      ],
    },
    {
      heading: 'Gira: Lisbon’s bike share, from €2 a day',
      blocks: [
        'Gira, run by EMEL, has more than 200 stations and more than 2,000 bikes, most of them electric, which helps on the hills. It runs daily from 06:00 to 02:00, and bikes are picked up and returned at stations.',
        {
          table: {
            caption: 'Gira passes and prices (13 October 2026)',
            head: ['Pass', 'Price', 'Rides up to 45 min', '45 to 90 min', 'Each extra 45 min'],
            rows: [
              ['Day pass', '€2 (MB Way or credit card only)', 'Free', '+€2', '+€2'],
              ['Monthly pass', '€15', 'Free', '+€1', '+€2'],
              ['Annual pass', '€25', 'Free', '+€1', '+€2'],
              ['Gira Navegante (Lisbon residents aged 16+ with a monthly Navegante)', 'Free', 'Free', '+€1', '+€2'],
            ],
          },
        },
        'Some guides still give €10 for the day pass; it costs €2.',
      ],
    },
    {
      heading: 'Will Lisbon ban shared e-scooters?',
      blocks: [
        'Yes: they are due to go by the end of 2026. On 21 October 2026 the city council approved ending its 2023 agreement with the operators unilaterally, “for reasons of public interest”, and banning shared e-scooters from riding and parking anywhere in the municipality. The operators have 60 days to take every scooter off the streets, which the Lusa news agency puts at the end of the year; after that the council may remove them at the operators’ cost.',
        'The operators first get 10 days to respond in writing; without a response, the decision becomes final. The council cites rising complaints and incidents, such as riding against the traffic and on pavements, even with fewer scooters. Livre and the Liberal Initiative voted against; PS, BE and PCP abstained.',
        'The council also promises more Gira stations and bikes, and a draft regulation on soft mobility within a year, without saying whether shared scooters could come back. Until they go, the apps work as before, and the [map of Lisbon](map:pt:Lisboa) shows Lime’s and Bird’s scooters as long as they are on the street.',
        'In August 2026 the Automóvel Club de Portugal (ACP) had launched a petition for a local referendum on the same question: whether the city should stop authorising shared e-scooters.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Lisbon has cut its shared scooters by two-thirds.** “We went from 15,000 to about 5,000,” deputy mayor Gonçalo Reis said in April 2026. In 2020, nine companies ran more than 12,000.',
            '**Black, red and blue.** The 2023 agreement colour-codes the city: black zones ban riding and parking, red zones ban parking, and in blue zones you must park in an authorised spot.',
            '**The bridge you can’t ride shares the Golden Gate’s colour.** The 25 de Abril bridge opened on 6 August 1966, turned 60 this year and is painted the same International Orange.',
            '**Gira bikes have ridden about 70 million km**, more than 1,700 times round the Earth, according to EMEL.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Until when can you rent an e-scooter in Lisbon?',
      answer: 'Until about the end of 2026. The city council voted on 21 October 2026 to suspend shared e-scooters, and the operators have 60 days to remove them. Until then Lime, Bolt and Bird rent them as before.',
    },
    {
      question: 'How much does a Lime scooter cost in Lisbon?',
      answer: 'Lime doesn’t publish its Lisbon prices, and nor does Bird: the app shows the unlock fee and price per minute before you unlock. Bolt advertises minutes from €0.15 across Portugal, plus a small unlock fee.',
    },
    {
      question: 'Can I ride an e-scooter from Lisbon airport?',
      answer: 'Yes, from Terminal 1, where Bird has hotspots by the terminal. There was no Bird hotspot near Terminal 2, and with a suitcase the Metro red line is easier.',
    },
    {
      question: 'Why won’t the app let me end my ride?',
      answer: 'You are probably not at a hotspot, or you are in a zone where parking is banned, such as a park, a big square or a station forecourt. Open the app’s map, go to the nearest hotspot and try again.',
    },
    {
      question: 'Do I need a helmet on an e-scooter in Lisbon?',
      answer: 'Not by law, as of October 2026, though it is strongly advised. Two bills to make helmets compulsory, with a €30–150 fine, passed a first vote in Parliament on 30 September 2026 but are not law yet.',
    },
    {
      question: 'Can I ride a scooter across the 25 de Abril bridge to Almada?',
      answer: 'No: Lisbon’s rules ban shared scooters on road bridges, and the bridge carries a motorway. End your ride and take the ferry from Cais do Sodré to Cacilhas.',
    },
    {
      question: 'Can tourists get free minutes on Lisbon’s scooters?',
      answer: 'No. They are for Lisbon residents aged 18 or over with a monthly Navegante pass, who register with their pass and Portuguese tax number. Visitors pay the app price, or ride Gira bikes with a €2 day pass.',
    },
  ],
  sources: [
    { title: 'Lisbon City Council: collaboration agreement with the e-scooter operators, 9 January 2023 (PDF, Portuguese)', url: 'https://www.lisboa.pt/fileadmin/atualidade/noticias/user_upload/Acordo_de_Colaborac__a__o_OperdoresTrot_09_01_23.pdf' },
    { title: 'Lisbon City Council: new rules for e-scooters, 23 June 2025 (Portuguese)', url: 'https://informacao.lisboa.pt/noticias/detalhe/circulacao-de-trotinetas-com-novas-regras-em-lisboa' },
    { title: 'Bird: Lisbon Navegante pass benefit', url: 'https://help.bird.co/hc/en-us/articles/48029756932116-Lisbon-Navegante-Pass-Benefit-Help-Center-Article' },
    { title: 'Bolt: scooter rentals in Portugal (Portuguese)', url: 'https://bolt.eu/pt-pt/scooters/' },
    { title: 'Gira: passes and prices (Portuguese)', url: 'https://www.gira-bicicletasdelisboa.pt/passes-e-tarifarios/' },
    { title: 'TTSL: bikes and scooters on the Lisbon ferries (Portuguese)', url: 'https://ttsl.pt/passageiros/utilizacao-do-transporte-fluvial/' },
    { title: 'CP: bikes and scooters on trains', url: 'https://www.cp.pt/info/w/bikes-and-scooters' },
    { title: 'Portuguese Parliament: the PSD helmet bill, Projeto de Lei 622/XVII (Portuguese)', url: 'https://www.parlamento.pt/ActividadeParlamentar/Paginas/DetalheIniciativa.aspx?BID=356782' },
    { title: 'Código da Estrada, consolidated text (PGDL, Portuguese)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'ACP: the referendum petition on shared e-scooters in Lisbon (Portuguese)', url: 'https://trotinetessimounao.acp.pt' },
    { title: 'Observador: Lisbon council approves suspending shared e-scooters, 21 October 2026 (Portuguese)', url: 'https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/' },
  ],
};

export default guide;
