import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-porto-alegre',
  topic: 'porto-alegre',
  name: 'Renting an e-scooter in Porto Alegre',
  title: 'E-scooters Porto Alegre 2026: JET, Whoosh, prices and rules',
  description: 'E-scooters in Porto Alegre: JET and Whoosh, what a ride costs in R$, where you may ride and park, and the city’s new rules for riders from July 2026.',
  headline: 'E-scooters in Porto Alegre: JET and Whoosh, what a ride costs, where to ride and where to park',
  lede: 'You can rent an e-scooter in Porto Alegre from Whoosh or from JET, whose app in Brazil is Go Jet. Each app shows its price before you ride; the last rate the city published, Whoosh’s in July 2024, was R$2 to unlock plus R$0.80 a minute. You must be 18. Since July 2026 a city decree lets you ride on cycle lanes at 20 km/h, on the Orla do Guaíba at 10 km/h and on pavements at walking pace, and you may park only at the spots your app shows.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'br:Porto Alegre',
  sections: [
    {
      heading: 'Which e-scooter apps work in Porto Alegre?',
      blocks: [
        'Two operators rent out stand-up e-scooters in Porto Alegre:',
        {
          list: [
            '**Whoosh**, with yellow scooters, running since late October 2023. You sign up with a phone number, an e-mail address and a card or a Pix top-up; its terms say it may also ask for your CPF, Brazil’s taxpayer number.',
            '**JET**, with blue scooters, running since 6 April 2024, when the Prefeitura (the city government) authorised about 650 of them, with some 120 digital stations in the Centro Histórico, Praia de Belas, Menino Deus and Cristal. In Brazil you rent them in the **Go Jet** app.',
          ],
        },
        'A third firm the city had authorised by April 2024, Adventure, a start-up from Rio Grande do Sul with orange scooters, had stopped running in Porto Alegre by July 2025, the Jornal do Comércio reported.',
        'Whoosh and JET came in under a 2019 city decree. Decree 23.782 of 19 May 2026 replaced it: every operator now needs accreditation (credenciamento) from the urban mobility department, the Secretaria Municipal de Mobilidade Urbana (SMMU), and the city’s transport and traffic company, EPTC (Empresa Pública de Transporte e Circulação). The call, announced on 8 October 2026, stays open for 60 months, and firms already running must sign up; by 25 October the city had named no accredited firm. The decree sets no cap on scooters and leaves the price to each operator.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does electric scooter rental in Porto Alegre cost?',
      blocks: [
        'Each app shows the price before you start, and neither operator publishes a Porto Alegre rate on its website. Prices change with demand, and JET charges paused time like riding time.',
        'The last figure the city published is Whoosh’s pay-as-you-go rate, in an EPTC notice of 17 July 2024: R$2 to unlock plus R$0.80 a minute, or R$10 for a 10-minute ride. That is over two years old. Whoosh adds accident insurance unless you switch it off. A Whoosh Pass (7 days, 30 days or a year) removes the unlock fee, not the per-minute price.',
        {
          table: {
            caption: 'What Whoosh charges in Brazil when a ride goes wrong (terms updated 21 March 2025)',
            head: ['What happens', 'Whoosh charges'],
            rows: [
              ['Ending a ride away from a “P” parking point', 'R$40'],
              ['Two people on one scooter, or letting someone under 18 ride', 'R$40'],
              ['Carrying the scooter in a car, bus or taxi', 'R$40'],
              ['Taking the scooter on the metro or into a building', 'R$80'],
              ['Letting the battery run flat', 'R$80'],
              ['Damage that can be repaired', 'R$800'],
              ['Losing the scooter', 'R$7,500'],
            ],
          },
        },
        'Go Jet’s terms (revised August 2026) make you liable for fines, seizures and removal costs, but set no amounts.',
      ],
    },
    {
      heading: 'Where can you ride an e-scooter in Porto Alegre?',
      blocks: [
        'Decree 23.848 of 9 July 2026 sets where e-scooters, rented or your own, may go. It applies Brazil’s national rule, CONTRAN Resolution 996 of 2023, which prevails wherever the two conflict.',
        {
          table: {
            caption: 'Where a stand-up e-scooter may ride in Porto Alegre (Decree 23.848 of 9 July 2026; CONTRAN Resolution 996)',
            head: ['Where', 'Allowed?', 'Top speed'],
            rows: [
              ['Cycle track (ciclovia) or cycle lane (ciclofaixa)', 'Yes', '20 km/h'],
              ['Orla do Guaíba', 'Yes', '10 km/h'],
              ['Special areas set by EPTC and SMMU', 'Yes', '10 km/h'],
              ['Pavement or pedestrian street (calçadão)', 'Yes', '6 km/h, walking pace'],
              ['Parks and squares', 'Yes', '6 km/h'],
              ['Street with a speed limit of 40 km/h or less', 'Yes, at the edge, with the traffic', '30 km/h on local streets, 32 km/h on collector streets'],
              ['Street with a limit above 40 km/h', 'No', '–'],
            ],
          },
        },
        'Pedestrians always have priority, and on the road you obey the traffic lights. Both operators limit their scooters to 20 km/h, and Whoosh slows its scooters to 9–15 km/h in restricted areas its app marks in orange.',
        { note: '**Get off and push across pedestrian crossings.** The decree requires it. EPTC’s agents may stop you, warn you and hold the scooter for a while, and they report a shared scooter’s rider to the operator.' },
        'EPTC goes further: in April 2025 it advised against riding on the road at all, and told riders to use the pavement, at no more than 6 km/h, where there is no cycle lane.',
      ],
    },
    {
      heading: 'Where to park a JET or Whoosh scooter',
      blocks: [
        'You may leave a shared scooter only at a place the operator has set and EPTC has approved. These virtual stations (estações virtuais) are marked spots, not docks.',
        {
          list: [
            '**Whoosh:** end the ride at a “P” on its map and take a photo of the parked scooter. Whoosh aims to keep one within 200–300 metres. Anywhere else costs R$40.',
            '**JET:** end the ride at one of its parking places (estacionamentos). Go Jet’s terms tell you to follow the parking rules the app shows and to send a photo when it asks.',
          ],
        },
        'The city bans parking where a scooter blocks pavements, crossings, dropped kerbs, entrances, hydrants or bins, on the carriageway outside a marked bay, and under a bus shelter. Once the city or a passer-by reports a badly parked scooter, the operator must remove it within an hour in the central area (from the waterfront out to the 3ª Perimetral and the Nonoai, Campos Velho and Pedro Américo Leal avenues) and within two hours elsewhere.',
      ],
    },
    {
      heading: 'Age, helmets and the other rules',
      blocks: [
        {
          table: {
            caption: 'E-scooter rules in Porto Alegre on 25 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Who sets it'],
            rows: [
              ['Minimum age', '18 on streets and pavements; 14 inside parks and squares. JET and Whoosh rent only to adults, and JET refuses under-18s even with a parent’s consent', 'City (Decree 23.848); JET and Whoosh'],
              ['Driving licence', 'Not needed', 'EPTC; JET'],
              ['Helmet', 'Not compulsory, but EPTC recommends one, with gloves and knee pads', 'EPTC'],
              ['Passengers and loads', 'One rider only, no loads', 'City (Decree 23.848)'],
              ['Alcohol and drugs', 'Banned while riding', 'City (Decree 23.848)'],
              ['At night', 'Lights on; something reflective recommended', 'City (Decree 23.848)'],
              ['Riding style', 'No racing, stunts or riding that threatens pedestrians or drivers', 'City (Decree 23.848)'],
              ['The scooter', 'Up to 1,000 W and 32 km/h by design, at most 70 cm wide, with a speed display or limiter, a bell and lights at the front, rear and sides', 'National (CONTRAN Resolution 996)'],
              ['Registration and plates', 'None needed', 'National (CONTRAN Resolution 996)'],
              ['Hours', 'None set: no night ban, and EPTC said in July 2024 that JET’s scooters run 24 hours a day', 'City decrees; EPTC (July 2024)'],
            ],
          },
        },
        'CONTRAN puts e-scooter riders under the same traffic rules as cyclists, and the city decree lets EPTC apply the traffic-code penalties CONTRAN names for riding where you may not. Operators must also warn, fine, block or ban riders who break the rules.',
      ],
    },
    {
      heading: 'Where to find JET and Whoosh scooters in Porto Alegre',
      blocks: [
        'At 12:51 local time on Sunday 25 October 2026 the [map of Porto Alegre](map:br:Porto Alegre) showed about 3,100 standing scooters: 1,700 JET and 1,400 Whoosh. That is a snapshot, not the size of either fleet, and scooters on a ride don’t appear.',
        'On the Prefeitura’s official bairro (district) boundaries, every one stood inside the city, in 33 of its 94 bairros, and none in Canoas, Alvorada, Viamão or Cachoeirinha. More than two in five stood in the Centro Histórico (about 700) and Praia de Belas (610); then came Cidade Baixa (180), Moinhos de Vento and Cristal (150 each), Rio Branco (140) and Menino Deus (130). Whoosh reached further north-east: about 130 of its scooters in Boa Vista, Jardim Europa, Três Figueiras, Cristo Redentor and Passo da Areia, against four of JET’s.',
        'The map shows Go Jet and Whoosh: each Whoosh scooter’s charge and range, and each JET scooter’s charge. It shows no prices, stations, zones or hours; the apps do. At the end of the Trensurb line it also shows JET in [Novo Hamburgo](map:br:Novo Hamburgo). Both operators run in São Paulo too: see [e-scooters in São Paulo](guide:sao-paulo).',
      ],
    },
    {
      heading: 'The Orla, the Trensurb and the city’s bikes',
      blocks: [
        'The Orla do Guaíba is the waterfront park along Avenida Edvaldo Pereira Paiva. Its first stretch, the Orla Moacyr Scliar, runs 1.3 km from the Usina do Gasômetro to the Rótula das Cuias with a cycle track and a footway; in 2021 the city handed it, with Parque Harmonia, to GAM3 Parks on a 35-year concession. The Orla’s limit is 10 km/h; in parks such as Parque Farroupilha (Redenção) and Parcão (Parque Moinhos de Vento) it is 6 km/h, and riders must be at least 14. We found no park or concessionaire with stricter rules.',
        'Trensurb’s metro line, from Mercado in the centre to Novo Hamburgo, takes your own e-scooter on the same terms as a bike: on weekdays 05:00–05:30, 09:00–16:00 and 19:00–23:00, all day at weekends and on holidays, in the second car; folded, at any time. Not a shared one: Whoosh charges R$80 for taking its scooter on the metro.',
        'BikePOA, the city’s docked bike share, is run by Tembici: you rent its bikes in the Bike Itaú app or, since June 2023, the Uber app. In October 2023 it reached 100 stations and 1,000 bikes, half of them e-bikes assisted up to 25 km/h. The map doesn’t show it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**The 2024 floods stopped the scooters.** They were taken off the streets in May 2024; Whoosh was back with about 1,000 in June, and JET with 100 in mid-July.',
            '**Scooter fares help pay for cycle lanes.** Under the 2026 decree, operators must put 5% of their gross takings in Porto Alegre into cycle lanes, pavements, signs and paint the city chooses.',
            '**A million rides in 18 months.** Whoosh counted more than 1 million rides and 160,000 users in Porto Alegre between October 2023 and April 2025.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which companies rent e-scooters in Porto Alegre?',
      answer: 'Whoosh and JET, in its Go Jet app. The map shows both. A third authorised firm, Adventure, had left by July 2025.',
    },
    {
      question: 'How much does an e-scooter cost in Porto Alegre?',
      answer: 'The app shows the price before you ride, and it changes with demand. The last rate the city published, in July 2024, was Whoosh’s R$2 to unlock plus R$0.80 a minute; JET publishes no Porto Alegre rate.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Porto Alegre?',
      answer: 'Yes, at walking pace (6 km/h), giving way to pedestrians, and you must get off and push across pedestrian crossings. On cycle lanes you may ride at 20 km/h, and on the Orla do Guaíba at 10 km/h.',
    },
    {
      question: 'Do you need a helmet or a driving licence?',
      answer: 'Neither: EPTC recommends a helmet but doesn’t require one, and no licence is needed. You must be 18 to rent.',
    },
    {
      question: 'Where can you park a JET or Whoosh scooter?',
      answer: 'Only at a point your own app shows: a “P” in Whoosh, an approved station in Go Jet. Never on the pavement where it blocks people, at a crossing or under a bus shelter; Whoosh charges R$40 for a ride ended anywhere else.',
    },
    {
      question: 'Can you take an e-scooter on the Trensurb?',
      answer: 'Your own, yes: folded at any time, or unfolded outside the weekday rush hours and all day at weekends, in the second car. Not a shared one: Whoosh charges R$80 for taking its scooter on the metro.',
    },
  ],
  sources: [
    { title: 'Decree 23.782 of 19 May 2026: shared bikes and scooters, Portuguese', url: 'https://dopaonlineupload.procempa.com.br/dopaonlineupload/6046_ce_611731_1.pdf' },
    { title: 'Decree 23.848 of 9 July 2026: rules for e-scooter riders, Portuguese', url: 'https://dopaonlineupload.procempa.com.br/dopaonlineupload/6096_ce_618741_1.pdf' },
    { title: 'SMMU: operators’ accreditation opens (8 October 2026), Portuguese', url: 'https://prefeitura.poa.br/smmu/noticias/prefeitura-abre-credenciamento-para-servico-de-bicicletas-e-patinetes-compartilhados' },
    { title: 'Prefeitura: 650 JET scooters from 6 April 2024, Portuguese', url: 'https://prefeitura.poa.br/gp/noticias/capital-tera-mais-650-patinetes-eletricos-compartilhados-partir-deste-sabado' },
    { title: 'EPTC: e-scooters back after the floods, with Whoosh’s price (17 July 2024), Portuguese', url: 'https://prefeitura.poa.br/eptc/noticias/patinetes-eletricas-voltam-operar-apos-enchente' },
    { title: 'EPTC: three authorised operators (10 April 2024), Portuguese', url: 'https://prefeitura.poa.br/eptc/noticias/treinamento-gratuito-orienta-usuarios-sobre-conducao-de-patinetes' },
    { title: 'EPTC: guidance for riders on the Orla (26 November 2023), Portuguese', url: 'https://prefeitura.poa.br/eptc/noticias/eptc-orienta-frequentadores-da-orla-para-uso-correto-dos-patinetes-eletricos' },
    { title: 'EPTC: riding advice on the Orla (16 November 2024), Portuguese', url: 'https://prefeitura.poa.br/eptc/noticias/atividade-educativa-na-orla-orienta-sobre-uso-de-patinetes-eletricas' },
    { title: 'SMMU: riding school with Whoosh (3 April 2025), Portuguese', url: 'https://prefeitura.poa.br/smmu/noticias/escola-de-direcao-de-patinetes-destaca-educacao-e-seguranca-no-uso-dos-equipamentos' },
    { title: 'Jornal do Comércio: e-scooters change Porto Alegre’s mobility (15 July 2025), Portuguese', url: 'https://www.jornaldocomercio.com/colunas/pensar-a-cidade/2025/07/1209610-patinetes-eletricas-mudam-cenario-da-mobilidade-urbana-de-porto-alegre.html' },
    { title: 'CONTRAN Resolution 996 of 15 June 2023, Portuguese', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao9962023.pdf' },
    { title: 'JET Brazil: cities, FAQ and riding rules', url: 'https://jetshr.com/br' },
    { title: 'Go Jet Brazil: rental terms, revised August 2026, Portuguese', url: 'https://static.jetshr.com/jet_website/docs/pdfs/Termos%20Condicoes%20Locacao%20GoJet%20Brasil%20-%20Revisado%20%28Ago26%29.pdf' },
    { title: 'Whoosh Brazil: FAQ, Portuguese', url: 'https://whoosh.bike/faq/br' },
    { title: 'Whoosh Brazil: terms and fines (updated 21 March 2025)', url: 'https://whoosh.bike/terms_br/pt' },
    { title: 'Whoosh Brazil: parking rules, Portuguese', url: 'https://whoosh.bike/parking_rules/br' },
    { title: 'Whoosh Brazil: Whoosh Pass, Portuguese', url: 'https://whoosh.bike/whooshpass/br' },
    { title: 'SMAMUS: Orla Moacyr Scliar, the Orla’s first stretch, Portuguese', url: 'https://prefeitura.poa.br/smamus/orla-moacyr-scliar' },
    { title: 'Prefeitura: Parque Harmonia and Orla concession (11 March 2021), Portuguese', url: 'https://prefeitura.poa.br/gp/noticias/assinada-concessao-do-parque-harmonia-e-trecho-1-da-orla-do-guaiba' },
    { title: 'Trensurb: bikes and scooters on the metro (15 October 2025), Portuguese', url: 'https://www.gov.br/trensurb/pt-br/servicos/servicos-especiais/ciclista-trensurb' },
    { title: 'SMMU: BikePOA reaches 100 stations with 500 e-bikes (21 October 2023), Portuguese', url: 'https://prefeitura.poa.br/smmu/noticias/capital-recebe-500-bikes-eletricas-e-chega-100-estacoes' },
    { title: 'SMMU: BikePOA bikes in the Uber app (5 June 2023), Portuguese', url: 'https://prefeitura.poa.br/smmu/noticias/bicicletas-compartilhadas-poderao-ser-alugadas-por-aplicativo' },
    { title: 'Porto Alegre open data: official bairro boundaries', url: 'https://dadosabertos.poa.br/dataset/bairros-lc-12-112-16' },
  ],
};

export default guide;
