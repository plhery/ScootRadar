import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-sao-paulo',
  topic: 'sao-paulo',
  name: 'Renting an e-scooter in São Paulo',
  title: 'E-scooters São Paulo 2026: JET, Whoosh, prices and rules',
  description: 'E-scooters in São Paulo: JET and Whoosh, what a ride costs in R$, where you may ride and park, and the pavement ban enforced since 12 October 2026.',
  headline: 'E-scooters in São Paulo: JET and Whoosh, what a ride costs, where to ride and where to park',
  lede: 'You can rent an e-scooter in São Paulo from Whoosh or from JET, whose app is Go Jet: they are the two operators the city has accredited. Each app shows its own price; Whoosh’s launch price, in December 2024, was R$2 to unlock plus R$0.67 a minute. You must be 18, ride only on cycle lanes and on streets with a limit of 40 km/h or less, at up to 20 km/h, and end your ride at a marked station. Riding on the pavement is banned, and the city has enforced the rules since 12 October 2026.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'br:São Paulo',
  sections: [
    {
      heading: 'Which e-scooter apps work in São Paulo?',
      blocks: [
        'Only operators accredited by the Prefeitura, the city government, may rent out scooters on São Paulo’s streets. In October 2025 the city’s transport department, the Secretaria Municipal de Mobilidade Urbana e Transporte (SMT), named two:',
        {
          list: [
            '**Whoosh**, running since December 2024. Its app shows each scooter’s battery and price; you sign up with a phone number, an e-mail address and a payment method, and you can rent up to three scooters on one account.',
            '**JET**, running since January 2025 (accredited as Easyjet Mobilidade Ltda). For Brazil, JET’s website sends you to its newer app, **Go Jet**, run by JETSHR LTDA. JET says you need no driving licence.',
          ],
        },
        'Both rent only to adults. JET checks your age against a CPF, the Brazilian taxpayer number, when you sign up, and Whoosh’s terms list the CPF among the details it may ask for. Neither says what a visitor without one should do.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does electric scooter rental in São Paulo cost?',
      blocks: [
        'Both apps show the price before you start, and both may change it: Whoosh prices each scooter in the app, and JET says its rates vary by city, day of the week and demand. Neither publishes a São Paulo rate on its website.',
        'The one published figure is Whoosh’s launch price, which its chief executive gave when the Prefeitura announced the service on 13 December 2024: R$2 to unlock plus R$0.67 a minute, or R$8.70 for a 10-minute ride. That was nearly two years ago, so check the app for today’s rate. Whoosh may also add personal accident insurance to each ride’s price unless you switch it off before you start. A Whoosh Pass, for a week, a month or a year, removes the unlock fee but not the price per minute. Whoosh takes cards, Pix, Apple Pay and Google Pay. JET charges paused time like riding time.',
        {
          table: {
            caption: 'What Whoosh charges in Brazil when a ride goes wrong (terms updated 21 March 2025)',
            head: ['What happens', 'Whoosh charges'],
            rows: [
              ['Ending a ride away from a “P” parking point', 'R$40'],
              ['Two people on one scooter, or letting someone under 18 ride', 'R$40'],
              ['Carrying the scooter in a car, bus or taxi', 'R$40'],
              ['Leaving the ride zone and coming back within 30 minutes', 'R$40'],
              ['Staying outside the ride zone for more than 30 minutes', 'R$80'],
              ['Taking the scooter on the metro or into a building', 'R$80'],
              ['Letting the battery run flat', 'R$80'],
              ['Parking wrongly for the second time or more', 'R$80'],
              ['Damage that can be repaired', 'R$800'],
              ['Losing the scooter', 'R$7,500'],
            ],
          },
        },
        'JET’s Brazilian terms (revised August 2026) make you answer for fines, seizures and removal costs too, without fixed amounts; JET says every ride is insured.',
      ],
    },
    {
      heading: 'Where can you ride an e-scooter in São Paulo?',
      blocks: [
        'Since 28 August 2026 a city traffic order, Portaria SMT/SETRAM 23, sets where e-bikes and stand-up scooters may go. It applies Brazil’s national rule, CONTRAN Resolution 996 of 2023, and covers your own scooter as well as a rented one.',
        {
          table: {
            caption: 'Where a stand-up e-scooter may ride in São Paulo (Portaria SMT/SETRAM 23 of 13 August 2026)',
            head: ['Where', 'Allowed?', 'Top speed'],
            rows: [
              ['Cycle track (ciclovia), on-road cycle lane (ciclofaixa) or signed cycle route (ciclorrota)', 'Yes', '20 km/h'],
              ['Cycle lane on the pavement or central reservation, shared with pedestrians', 'Yes', '6 km/h'],
              ['Street with a speed limit of 40 km/h or less', 'Yes', '20 km/h'],
              ['Street with a limit above 40 km/h', 'No', '–'],
              ['Pavement, or a pavement or central reservation shared by cyclists and pedestrians', 'No', '–'],
              ['Pedestrian street or area', 'No', '–'],
            ],
          },
        },
        'The shared scooters top out at 20 km/h anyway. The city’s rules for them, Resolution 22 of the Municipal Road Use Committee (Comitê Municipal de Uso do Viário, CMUV), hold every new rider to 15 km/h for their first ten rides, and Whoosh slows its scooters to 9–15 km/h in busy areas, which its app marks in orange.',
        { note: '**Stay off the pavement, even at walking pace.** After an education campaign that began on 28 August, the city’s traffic engineering company, CET (Companhia de Engenharia de Tráfego), started enforcing these rules on 12 October 2026.' },
        'CONTRAN’s resolution sends riders who break it to two articles of the Brazilian Traffic Code (Código de Trânsito Brasileiro): riding where the authority doesn’t allow it, and riding on pavements. Both operators’ terms make you pay any fine that reaches them.',
      ],
    },
    {
      heading: 'Where to park: marked stations only',
      blocks: [
        'São Paulo lets you leave a shared scooter only at approved stations (estações) and shared parking bays (estacionamentos): marked bays at most 5 metres long and at least 200 metres apart, each approved by CET and the local subprefeitura (borough office). Since 2025 each station belongs to one operator, the first to apply for the spot, so end your ride at a point your own app shows.',
        {
          list: [
            '**Whoosh:** end the ride at a “P” on its map and take a photo of the parked scooter. Anywhere else costs R$40.',
            '**JET:** the Go Jet app asks for a photo of the scooter parked at an authorised point at the end of every ride.',
          ],
        },
        'The city bans stations and bays on cycle lanes, lawns and gardens, in front of pedestrian crossings and dropped kerbs, within 10 metres of a bus stop or 5 metres of a corner, on the pavement in front of metro and train station entrances, on pedestrian streets (calçadões), in bus lanes and wherever parking is banned. A scooter left in one of those places counts as an abandoned vehicle under municipal law, and the operator must move scooters on from a shared bay within 3 hours in central and inner districts, 6 hours further out.',
      ],
    },
    {
      heading: 'Age, helmets and the other rules',
      blocks: [
        {
          table: {
            caption: 'E-scooter rules in São Paulo on 25 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Who sets it'],
            rows: [
              ['Minimum age', '18 for shared scooters; JET refuses under-18s even with a parent’s consent', 'City (CMUV Resolution 22); JET and Whoosh'],
              ['Driving licence', 'Not needed', 'JET’s riding rules'],
              ['Helmet', 'Not compulsory, but recommended', 'City (SMT); JET'],
              ['Passengers and loads', 'One rider only; no passengers, animals or loads over 5 kg', 'City (CMUV Resolution 22)'],
              ['Alcohol', 'None before or during a ride', 'JET’s riding rules'],
              ['Speed', '20 km/h; 15 km/h on a new rider’s first ten rides; 6 km/h on shared pavement cycle lanes', 'City (Portaria 23; CMUV Resolution 22)'],
              ['The scooter', 'Up to 1,000 W and 32 km/h by design, at most 70 cm wide, with a speed display or limiter, a bell and lights at the front, rear and sides', 'National (CONTRAN Resolution 996)'],
              ['Registration and plates', 'None needed', 'National (CONTRAN Resolution 996)'],
              ['Hours', 'None set', '–'],
            ],
          },
        },
        'CONTRAN’s resolution puts scooter riders under the same traffic code rules as cyclists. JET also recommends wearing something reflective at night.',
      ],
    },
    {
      heading: 'Where to find JET and Whoosh scooters in São Paulo',
      blocks: [
        'Between 11:34 and 11:48 on Sunday 25 October 2026 the [map of São Paulo](map:br:São Paulo) showed about 6,300 standing scooters: 3,500 JET and 2,800 Whoosh. That is a snapshot, not the size of either fleet, and scooters on a ride don’t appear.',
        'Matched to the Prefeitura’s own boundaries (GeoSampa), nearly 6,000 stood in the city of São Paulo and about 340, all JET’s, over the boundary in Santo André, which the map counts with São Paulo. None stood in São Caetano do Sul or Diadema.',
        'The busiest districts were Pinheiros (about 870), Itaim Bibi (600), Moema (550), Bela Vista (350) and Santo Amaro (340). More than half of Whoosh’s scooters stood in the Subprefeitura de Pinheiros, which covers Pinheiros, Itaim Bibi, Jardim Paulista and Alto de Pinheiros; the rest spread from the centre and Vila Mariana to Barra Funda, Mooca, Tatuapé and the north. More than half of JET’s scooters in the city stood in the south, from Moema, Vila Mariana and Saúde to Santo Amaro and Ipiranga.',
        'The map shows Go Jet and Whoosh: each Whoosh scooter’s charge and range, and each JET scooter’s charge. It shows no prices, stations, zones or hours; the apps do. It also shows both operators in [Curitiba](map:br:Curitiba) and Whoosh in [Rio de Janeiro](map:br:Rio de Janeiro).',
      ],
    },
    {
      heading: 'The metro and the city’s bikes',
      blocks: [
        'The São Paulo Metro (Metrô) carries bicycles on weekdays from 10:00 to 16:00 and from 21:00 to closing, and all day at weekends and on holidays, at most four a train in the last car; folded bikes in a bag go at any time. Its rules say nothing about scooters. Line 4-Yellow, run by Motiva (formerly ViaQuatro), takes scooters at any hour only if they fold, and turns away any that don’t. Whoosh charges R$80 for taking its scooter on the metro, so leave it at a bay near the station, never on the pavement in front of the entrance.',
        'The city’s docked bike share, Bike Sampa, is run by Tembici and sponsored by Itaú, which brands it Bike Itaú; it added docked e-bikes in June 2022. The map doesn’t show it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Shared scooters came back in December 2024.** Whoosh launched its pilot at Largo da Batata, in Pinheiros, on 13 December 2024, with 1,000 scooters and 88 stations between Avenida Faria Lima and Avenida Paulista.',
            '**Operators pay the city for using its streets:** R$30 a scooter a month for their first three months, then R$0.20 for every trip.',
            '**They can’t serve only the centre.** The city’s rules make them place scooters in four groups of districts, the outer groups getting at least 20%, 10% and 5% of the number in the 16 central districts.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which companies rent e-scooters in São Paulo?',
      answer: 'Whoosh and JET, in its Go Jet app: the two operators the city has accredited. The map shows both.',
    },
    {
      question: 'How much does an e-scooter cost in São Paulo?',
      answer: 'The app shows the price before you ride. Whoosh charged R$2 to unlock plus R$0.67 a minute at its launch in December 2024; JET publishes no São Paulo rate.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in São Paulo?',
      answer: 'No, not even slowly. Ride on cycle lanes and on streets with a limit of 40 km/h or less; on a cycle lane laid on the pavement and shared with pedestrians, keep to 6 km/h. The city has enforced these rules since 12 October 2026.',
    },
    {
      question: 'Do you need a helmet or a driving licence?',
      answer: 'A helmet is recommended but not compulsory, and JET says you need no driving licence. You must be 18.',
    },
    {
      question: 'Where can you park a JET or Whoosh scooter?',
      answer: 'Only at a marked station or bay that your own app shows: a “P” in Whoosh, an authorised point in Go Jet. Both ask for a photo, and Whoosh charges R$40 for a ride ended anywhere else.',
    },
    {
      question: 'Can tourists rent e-scooters in São Paulo?',
      answer: 'If they are 18 or over, with a phone number and a payment method. JET checks your age against a CPF, the Brazilian taxpayer number, and Whoosh may ask for one; neither says what a visitor without a CPF should do.',
    },
  ],
  sources: [
    { title: 'Prefeitura de São Paulo: Decree 58.907 of 9 August 2019 on shared e-scooters, Portuguese', url: 'https://legislacao.prefeitura.sp.gov.br/leis/decreto-58907-de-9-de-agosto-de-2019' },
    { title: 'CMUV Resolution 22 of 29 October 2019, as amended (rules for shared e-scooters), Portuguese', url: 'https://legislacao.prefeitura.sp.gov.br/leis/resolucao-secretaria-municipal-de-mobilidade-e-transportes-smt-cmuv-22-de-29-de-outubro-de-2019' },
    { title: 'SMT/CMUV Resolution 37 of 5 December 2025 (fees, stations), Portuguese', url: 'https://legislacao.prefeitura.sp.gov.br/leis/resolucao-secretaria-municipal-de-mobilidade-urbana-e-transporte-smt-37-de-5-de-dezembro-de-2025' },
    { title: 'Portaria Conjunta SMT/SMSUB/SEMTRA 1 of 4 April 2025 (stations), Portuguese', url: 'https://legislacao.prefeitura.sp.gov.br/leis/portaria-conjunta-secretaria-municipal-das-subprefeituras-smsub-secretaria-municipal-de-mobilidade-urbana-e-transporte-smt-semtra-1-de-4-de-abril-de-2025' },
    { title: 'SMT: FAQ on the rules for shared e-scooters (9 October 2025), Portuguese', url: 'https://prefeitura.sp.gov.br/web/mobilidade/w/faqregrascompartilhamentopatinetes' },
    { title: 'Prefeitura de São Paulo: shared e-scooters return (13 December 2024), Portuguese', url: 'https://prefeitura.sp.gov.br/w/com-regras-claras-de-seguran%C3%A7a-prefeitura-permite-a-volta-de-patinetes-el%C3%A9tricas%C2%A0%C3%A0-cidade-de-s%C3%A3o-paulo' },
    { title: 'Portaria SMT/SETRAM 23 of 13 August 2026, as amended (where e-bikes and scooters may ride), Portuguese', url: 'https://legislacao.prefeitura.sp.gov.br/leis/portaria-secretaria-municipal-de-mobilidade-e-transito-smt-setram-23-de-13-de-agosto-de-2026' },
    { title: 'CET: e-bikes and autopropelidos, rules of circulation and enforcement from 12 October 2026, Portuguese', url: 'https://www.cetsp.com.br/consultas/bicicleta/bicicletas-eletricas-e-autopropelidos-regras-de-circulacao.aspx' },
    { title: 'CONTRAN Resolution 996 of 15 June 2023 (personal electric mobility devices), Portuguese', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao9962023.pdf' },
    { title: 'JET Brazil: cities, FAQ and riding rules, Portuguese', url: 'https://jetshr.com/br' },
    { title: 'Go Jet Brazil: rental terms, revised August 2026, Portuguese', url: 'https://static.jetshr.com/jet_website/docs/pdfs/Termos%20Condicoes%20Locacao%20GoJet%20Brasil%20-%20Revisado%20%28Ago26%29.pdf' },
    { title: 'JET press release on São Paulo’s new rules (29 August 2026), Portuguese', url: 'https://portal.saladanoticia.com.br/noticia/66471/jet-reforca-compromisso-com-as-novas-regras-de-circulacao-de-patinetes-em-sao-paulo' },
    { title: 'Whoosh Brazil: how it works, Portuguese', url: 'https://whoosh.bike/br' },
    { title: 'Whoosh Brazil: FAQ, Portuguese', url: 'https://whoosh.bike/faq/br' },
    { title: 'Whoosh Brazil: terms and fines (updated 21 March 2025)', url: 'https://whoosh.bike/terms_br/pt' },
    { title: 'Whoosh Brazil: parking rules, Portuguese', url: 'https://whoosh.bike/parking_rules/br' },
    { title: 'Whoosh Brazil: Whoosh Pass, Portuguese', url: 'https://whoosh.bike/whooshpass/br' },
    { title: 'Metrô: bicycles on the metro, Portuguese', url: 'https://www.metro.sp.gov.br/sua-viagem/bicicletas/bicicleta-metro/' },
    { title: 'Motiva, Line 4-Yellow: guide for passengers (bicycles and scooters), Portuguese', url: 'https://trilhos.motiva.com.br/linha-4-amarela/guia-de-uso/' },
    { title: 'Prefeitura de São Paulo: new Bike Sampa system, run by Tembici (30 January 2018), Portuguese', url: 'https://prefeitura.sp.gov.br/w/noticia/prefeitura-de-sao-paulo-inaugura-novo-sistema-do-bike-sampa-comecando-com-25-estacoes' },
    { title: 'Prefeitura de São Paulo: shared e-bikes join the system (3 June 2022), Portuguese', url: 'https://prefeitura.sp.gov.br/w/noticia/no-dia-mundial-da-bicicleta-cidade-inicia-projeto-com-modal-eletrico-compartilhado' },
    { title: 'CicloVivo: Bike Itaú turns 15 (13 October 2026), Portuguese', url: 'https://ciclovivo.com.br/arq-urb/mobilidade/bike-itau-completa-15-anos-de-mobilidade-sustentavel/' },
    { title: 'GeoSampa: district, subprefeitura and municipal boundaries (WFS)', url: 'https://wfs.geosampa.prefeitura.sp.gov.br/geoserver/wfs' },
  ],
};

export default guide;
