import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-porto',
  topic: 'porto',
  name: 'E-scooters in Porto',
  title: 'E-scooter hire Porto 2026: Bird and Lime, rules, parking',
  description: 'Rent a Bird or Lime e-scooter in Porto: the app shows the price before you unlock. End every ride at a blue sharing point; no pavements, squares or bus lanes.',
  headline: 'E-scooters in Porto: Bird and Lime, where you can ride and where to park',
  lede: 'You can rent an e-scooter in Porto from Bird or Lime, the two companies the city licensed in 2025; both also rent out e-bikes in the same app. The app shows the price before you unlock. You must end every ride at a municipal sharing point, marked in blue on the ground, and may not ride on pavements, squares, pedestrian streets, bus lanes or the upper deck of the Dom Luís I bridge. Since November 2025 the service may run 24 hours a day.',
  published: '2026-10-13',
  updated: '2026-10-26',
  city: 'pt:Porto',
  sections: [
    {
      heading: 'Renting an e-scooter in Porto: Bird and Lime',
      blocks: [
        'In May 2025 Porto auctioned two licences for shared scooters and e-bikes, and **Bird** and **Lime** were the only bidders. Each lasts five years, can’t be renewed and covers 700 vehicles (up to 900 with the city’s written agreement), at least 40% of them e-bikes.',
        'Bird has run in Porto since the service began in 2020; Lime started in September 2025 with 700 scooters and e-bikes. Bolt ran scooters in Porto from 2022; its Porto page listed none on 13 October 2026, but our map showed about 550 on 25 October.',
        {
          table: {
            caption: 'E-scooters in Porto: who rents them and what they cost (13 October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 / 20 minutes', 'On our map'],
            rows: [
              ['Bird', 'Not published', 'Not published', 'Price in the app', 'Yes: about 480 scooters'],
              ['Lime', 'Not published', 'Not published', 'Price in the app', 'Yes, since 26 October 2026'],
            ],
          },
        },
        'ScootRadar shows Bird’s e-scooters with their battery level: about 480 on the [map around Porto](map:pt:Porto) on 13 October 2026, free to rent at that moment, in an area that spills into Matosinhos. Since 26 October the map also shows Lime’s, with their battery level: about 430 as last counted at 22:27 on 25 October, apart from Bird’s. Zoomed in, it draws the Câmara Municipal do Porto’s 230 sharing points. New to shared scooters? Read [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Where you can ride in Porto, and where you can’t',
      blocks: [
        'Shared scooters may use every road in the city except these, under Porto’s municipal code as amended in November 2025:',
        {
          list: [
            'pavements, pedestrian streets, squares and gardens, unless a sign allows it;',
            'bus lanes and the space reserved for trams and the metro;',
            'the Estrada da Circunvalação (EN12), the VCI ring road (A20, A28 and A1) and its junctions, and the Avenida AEP;',
            'the Arrábida and Freixo bridges, and the upper deck of the Dom Luís I bridge;',
            'tunnels.',
          ],
        },
        'Shared scooters are electronically limited to 25 km/h. On the streets of the old town’s restricted-traffic zones (ZAAC), such as Ribeira, Flores and Cedofeita, they slow to 10 km/h by themselves.',
        {
          table: {
            caption: 'Riding past Porto’s landmarks on a shared scooter: our reading of the rules (October 2026)',
            head: ['Place', 'What applies'],
            rows: [
              ['Ribeira', 'Streets at 10 km/h; no riding on the Cais da Ribeira or in Praça da Ribeira. Bird point on Rua do Infante D. Henrique'],
              ['Rua das Flores', '10 km/h where cars may go; it is full of walkers, so walk the scooter'],
              ['Rua de Santa Catarina', 'The shopping stretch is a pedestrian street: get off and push'],
              ['Avenida dos Aliados', 'Road lanes yes, bus lanes no; not across the central walkway or Praça da Liberdade'],
              ['Clérigos and Carmo', '10 km/h; never on the tram tracks, in Praça de Gomes Teixeira or the Cordoaria garden'],
              ['Parque da Cidade, Palácio de Cristal gardens', 'No riding; you can’t end a ride in the Parque da Cidade'],
              ['Foz and the seafront', 'The road, or a cycle path where there is one; never the promenade'],
            ],
          },
        },
        'Always check the signs on the spot and the app, which may block other places. Festivals and events can close more streets: on São João night (23 to 24 June), check the app before you set off.',
      ],
    },
    {
      heading: 'Crossing the Dom Luís I bridge to Gaia',
      blocks: [
        'The Dom Luís I bridge (Ponte Luís I) has two decks and two rules. The upper deck, which carries the metro and walkers, is closed to shared scooters. The lower deck is open: since 14 April 2023 it has carried only public transport, bikes, taxis and pedestrians, and an e-scooter counts as a bike in Portugal.',
        'Across the river, Vila Nova de Gaia has no scooter service to count on: it cancelled its tender in April 2026. On 13 October 2026 Bird’s public data still showed one parking point on the Gaia riverfront by the port-wine cellars, on Avenida de Ramos Pinto. Before you cross, check in the app that you can still end your ride there.',
      ],
    },
    {
      heading: 'Where to park a rental scooter in Porto',
      blocks: [
        'You may only end a ride at a municipal sharing point (ponto de partilha) with space. Look for blue markings on the ground and a sign on a post; the app shows them, and Bird’s won’t let you end a ride anywhere else. Lime, too, lets you park only in marked zones shown in its app.',
        'Even next to one, never leave a scooter on the pavement, a ramp or a zebra crossing, at a bus or tram stop or a taxi rank, or in a pay-parking, disabled or other reserved space.',
        { note: 'Sharing point full? Ride on to the next one. Since November 2025 Porto’s rules say you must park at a sharing point with space.' },
        '**Who pays for bad parking?** Porto fines the operator, not you, and the operator pays for towing. But Bird’s Portuguese terms pass fines and impound fees on to riders, and operators ask for a photo at the end of a ride.',
      ],
    },
    {
      heading: 'Portugal’s e-scooter rules in brief',
      blocks: [
        'In Portugal an e-scooter of up to 0.25 kW and 25 km/h counts as a bicycle: no licence needed and, for now, no helmet. The national rules that cost the most, as of October 2026:',
        {
          table: {
            caption: 'E-scooter rules and fines in Portugal (Código da Estrada, October 2026)',
            head: ['Rule', 'What to do', 'Fine'],
            rows: [
              ['Pavement', 'Never ride on it; use the road or a cycle lane', '€30–150'],
              ['Direction', 'Keep right, with the traffic', '€125–625 against it'],
              ['Phone and earphones', 'Phone away; one earbud at most', '€125–625'],
              ['Passenger', 'One rider only', '€60–300'],
              ['Alcohol', 'The drivers’ limit: under 0.5 g/l', '€125–1,250; a crime from 1.2 g/l'],
              ['Helmet', 'Not compulsory, but wear one', 'None today'],
              ['Age', 'No legal minimum; Bird requires 18', '–'],
            ],
          },
        },
        'The helmet may come back: on 30 September 2026 Parliament approved, at first reading, two bills making it compulsory (proposed fine: €30–150). They still need committee work and a final vote.',
        'Insurance isn’t compulsory for riders, and Porto obliges operators to insure their users. Lisbon has rules of its own: see [e-scooters in Lisbon](guide:lisbon).',
      ],
    },
    {
      heading: 'Night riding, events and what Porto may change',
      blocks: [
        'Since November 2025 Porto’s rules let the service run 24 hours a day. From 2020 until then, every shared scooter had to be off the street from 22:00 to 06:00, and many older guides still say so. The city can bring night closures back, for one operator or all of them, if crashes rise abnormally.',
        'In April 2026 a 25-year-old died in a collision between scooters in Porto, and on 21 April the city council voted unanimously for a study of scooter use and crashes, with no deadline. On 4 September 2026 the mayor, Pedro Duarte, called scooters “a problem in the city” and said he wanted to cut their use substantially in favour of other soft modes, in talks with the operators.',
        'No new restriction had been adopted by 13 October 2026. Check the app before you ride.',
      ],
    },
    {
      heading: 'Hills, trams, trains and the airport: Porto tips',
      blocks: [
        {
          list: [
            '**Hills and granite.** The centre climbs steeply from the Ribeira to the Sé, Batalha, Clérigos and Aliados, often on granite setts. On the steepest cobbled lanes, get off and push. The Funicular dos Guindais (Ribeira to Batalha) and the Elevador da Lada also do the climb.',
            '**Tram rails and rain.** You may not ride in the tram’s space. Cross rails at a wide angle, never let a wheel run in the groove, and slow right down on wet granite.',
            '**Trains.** End your ride before you enter São Bento or Campanhã station: Bird has sharing points near both, and nobody may ride inside a station. Your own scooter rides CP trains free, one per passenger, folded as hand luggage on the Alfa Pendular and Intercidades.',
            '**Metro.** A shared scooter never goes on board, and Metro do Porto’s conditions don’t mention e-scooters, so don’t count on taking your own.',
            '**The airport.** Francisco Sá Carneiro airport is in Maia, inside Bird’s zone there, but on the morning of 13 October 2026 only four Bird vehicles stood within 500 m of the terminal. The centre is about 11 km away and you must end at a Porto sharing point: take the metro in and ride from there.',
            '**Matosinhos and Maia.** Bird runs in both, with separate fleets: with parking points in [Matosinhos](map:pt:Matosinhos), as in Porto, and without them in [Maia](map:pt:Maia). From Foz, follow the seafront north past the Castelo do Queijo to Matosinhos beach; the Parque da Cidade on the way is not for riding. A Porto scooter can’t end its ride there: Bird’s open data for Porto lists no parking point in Matosinhos, so ride back to one in Porto.',
            '**Students.** The Asprela campus (FEUP, Hospital de São João) has Bird sharing points, though scooters there can be scarce.',
            '**No bike share.** Porto has no docked city bikes; rent a Bird or Lime e-bike in the same app instead.',
          ],
        },
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Porto wrote its rules before the scooters came.** The city says it was the first in Portugal with its own rules for shared scooters and bikes, written to head off the problems seen in Lisbon. The service started on 1 June 2020, delayed by the pandemic.',
            '**The parking fine goes to the company.** When the municipal police began fining in December 2022, an officer put it plainly: “the offender is the operator”. A towed scooter then cost €73: a €15 fine, €41 for removal and €17 for the pound.',
            '**The old town went from banned to slow.** In August 2022 a reporter from Lusa, Portugal’s news agency, counted at least a dozen scooters in about an hour in the restricted zones of Cedofeita, Ribeira and Santa Catarina, where they were banned. Since November 2025 they may ride there, at 10 km/h.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can I ride an e-scooter at night in Porto?',
      answer: 'Yes. Since November 2025 Porto’s rules let the service run 24 hours a day, and the 22:00 to 06:00 curfew of 2020 to 2025 is gone. The city can bring night closures back if crashes rise, so check the app.',
    },
    {
      question: 'Can I ride a scooter across the Dom Luís I bridge?',
      answer: 'Only on the lower deck, which since April 2023 has carried just public transport, bikes, taxis and pedestrians. The upper deck, with the metro, is closed to shared scooters, as are the Arrábida and Freixo bridges.',
    },
    {
      question: 'Do I need a helmet for an e-scooter in Portugal?',
      answer: 'Not as of October 2026: the helmet rule for e-scooters was dropped in January 2021. Parliament approved two bills to bring it back on 30 September 2026, with a proposed fine of €30–150, but they are not law yet. The GNR, Portugal’s national guard, strongly recommends wearing one.',
    },
    {
      question: 'Who pays if a rental scooter is badly parked in Porto?',
      answer: 'The city fines the operator, which also pays for towing. Operators pass penalties on to riders, though: Bird’s Portuguese terms charge you the fines and impound fees. End every ride at a blue sharing point with space, and take the photo the app asks for.',
    },
    {
      question: 'Is Porto going to ban e-scooters?',
      answer: 'Not as of 13 October 2026. The mayor wants far fewer scooters and more bikes, by agreement with the operators, and in April 2026 the council voted for a study of scooter use and crashes. Porto’s rules already let the city cut hours or close streets.',
    },
  ],
  sources: [
    { title: 'Diário da República: Regulamento n.º 1222/2025, Porto’s rules since November 2025 (Portuguese)', url: 'https://diariodarepublica.pt/dr/detalhe/regulamento/1222-2025-944874377' },
    { title: 'City of Porto: shared scooters and sharing points (Portuguese)', url: 'https://mobilidade.cm-porto.pt/modos-suaves/trotinetas' },
    { title: 'Câmara Municipal do Porto: sharing points, on Porto Digital’s urban platform', url: 'https://broker.fiware.urbanplatform.portodigital.pt/v2/entities?type=OnStreetParking&q=dataProvider==cmp&options=keyValues&limit=1000' },
    { title: 'City of Porto: the service starts, 31 May 2020 (Portuguese)', url: 'https://www.porto.pt/pt/noticia/regime-de-partilha-de-trotinetas-e-bicicletas-entra-amanha-em-funcionamento' },
    { title: 'Echo Boomer: Bird and Lime get Porto’s licences, August 2025 (Portuguese)', url: 'https://echoboomer.pt/?p=265398' },
    { title: 'Echo Boomer: Lime starts in Porto, September 2025 (Portuguese)', url: 'https://echoboomer.pt/lime-estreia-porto-700-trotinetes-bicicletas/' },
    { title: 'Observador: the mayor on scooters, 4 September 2026 (Portuguese)', url: 'https://observador.pt/2026/09/04/trotinetes-sao-um-problema-e-pedro-duarte-prefere-promover-bicicletas-no-porto/' },
    { title: 'Notícias ao Minuto/Lusa: the council’s scooter study, April 2026 (Portuguese)', url: 'https://www.noticiasaominuto.com/pais/2976749/camara-do-porto-vai-fazer-estudo-sobre-utilizacao-e-acidentes-com-trotinetes' },
    { title: 'Sábado/Lusa: Gaia and other towns end shared scooters, August 2026 (Portuguese)', url: 'https://www.sabado.pt/portugal/detalhe/municipios-acabam-com-trotinetes-mas-empresas-defendem-que-se-tem-adaptado-as-regras' },
    { title: 'Código da Estrada, Portugal’s Highway Code (Portuguese)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'Bird: rental agreement for Portugal (Portuguese)', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'CP: bikes and scooters on trains (Portuguese)', url: 'https://cp.pt/info/pt/w/transporte-bicicletas' },
  ],
};

export default guide;
