import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-recife',
  topic: 'recife',
  name: 'Renting an e-scooter in Recife',
  title: 'E-scooters Recife 2026: JET, Whoosh, rules and parking',
  description: 'E-scooters in Recife: JET and Whoosh in the city’s pilot, how they charge, where you may ride and park, and the rules for riders in 2026.',
  headline: 'E-scooters in Recife: JET and Whoosh, how they charge, where to ride and where to park',
  lede: 'You can rent an e-scooter in Recife from JET, whose app in Brazil is Go Jet, or from Whoosh: the two firms in the Prefeitura’s 12-month pilot, which began on 22 March 2026. Each app shows its price before you ride, and you must be 18. Under the pilot’s rules, as the Diario de Pernambuco reported them, you ride on cycle lanes and on streets with a limit of 40 km/h or less at up to 20 km/h, slow to 6 km/h where people walk, and park only at the points your app shows.',
  published: '2026-10-25',
  updated: '2026-10-26',
  city: 'br:Recife',
  sections: [
    {
      heading: 'Which e-scooter apps work in Recife?',
      blocks: [
        'Two operators rent out stand-up e-scooters in Recife:',
        {
          list: [
            '**JET**, which you rent in Brazil in the **Go Jet** app.',
            '**Whoosh**, which you rent in its own app.',
          ],
        },
        'The Prefeitura (the city government) launched the service on Sunday 22 March 2026 as an experiment it would follow for 12 months, the Diario de Pernambuco and Folha de Pernambuco reported. Both firms were chosen through EITA! Labs, the Prefeitura’s innovation programme, and accredited to run it at their own cost, with the city only setting the rules. At the launch there were about 90 parking points in 19 bairros (districts): Bairro do Recife, Boa Viagem, Pina, Santo Antônio, São José, Boa Vista, Santo Amaro, Graças, Aflitos, Espinheiro, Casa Forte, Santana, Poço da Panela, Parnamirim, Jaqueira, Torre, Madalena, Derby and Paissandu. In May 2026 the Prefeitura told a court the scheme could grow to more than 400 points and about 4,000 scooters, the Diario reported.',
        'Those rules are the pilot’s, not a city law. In its Technical Note 002/2026, signed on 30 April 2026, Pernambuco’s state traffic council, CETRAN-PE, found no complete municipal regulation of shared scooters around Recife and recommended that the state’s towns write one. A councillor asked a court to suspend the pilot; on 13 May 2026 the judge refused, and the case goes on.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does electric scooter rental in Recife cost?',
      blocks: [
        'Each app shows the price before you start, and neither operator publishes a Recife rate. JET says its rates vary by city, day of the week and demand, and it charges paused time like riding time. A Whoosh Pass (7 days, 30 days or a year) removes Whoosh’s unlock fee but not the per-minute price, which also moves with demand. Whoosh may hold up to R$25 on your card when you start.',
        {
          table: {
            caption: 'What Whoosh charges in Brazil when a ride goes wrong (terms updated 21 March 2025)',
            head: ['What happens', 'Whoosh charges'],
            rows: [
              ['Ending a ride away from a “P” parking point', 'R$40'],
              ['Two people on one scooter, or letting someone under 18 ride', 'R$40'],
              ['Carrying the scooter in a car, bus or taxi', 'R$40'],
              ['Riding out of the zone for more than 30 minutes', 'R$80'],
              ['Taking the scooter on the metro or into a building', 'R$80'],
              ['Letting the battery run flat', 'R$80'],
              ['Damage that can be repaired', 'R$800'],
              ['Losing the scooter', 'R$7,500'],
            ],
          },
        },
        'Go Jet’s terms (revised August 2026) let JET charge you for damage, loss, removal, seizure and fines, but set no amounts.',
      ],
    },
    {
      heading: 'Where can you ride an e-scooter in Recife?',
      blocks: [
        'The rules below are those CTTU and the Prefeitura gave for the pilot, as the Diario de Pernambuco reported them on 6 April 2026, under Brazil’s national rule, CONTRAN Resolution 996 of 2023. CONTRAN puts e-scooter riders under the same traffic rules as cyclists.',
        {
          table: {
            caption: 'Where a shared e-scooter may ride in Recife (CTTU and the Prefeitura, as reported on 6 April 2026; CONTRAN Resolution 996)',
            head: ['Where', 'Allowed?', 'Top speed'],
            rows: [
              ['Cycle track (ciclovia), cycle lane (ciclofaixa) or signed cycle route (ciclorrota)', 'Yes', '20 km/h'],
              ['Street with a speed limit of 40 km/h or less', 'Yes', '20 km/h'],
              ['Pavement or pedestrian area', 'Only where allowed', '6 km/h'],
              ['Street with a limit above 40 km/h', 'No', '–'],
              ['Highway (rodovia)', 'No', '–'],
            ],
          },
        },
        'Both operators cap their scooters at 20 km/h, and in pedestrian areas they slow to 6 km/h by themselves, the Diario reported in May 2026. Outside the area each operator allows, the scooter slows and may stop the trip. The area can change: in April 2026 JET said it may limit its area for a while, after riders found its scooters slowing to a halt in the Bode community in Pina.',
        'Avenida Boa Viagem, the seafront road, has a 60 km/h limit, to fall to 50 km/h when the works on the Orla (the seafront) end, CTTU told the Diario in July 2026. Either way it is above 40 km/h, so keep to the seafront cycle lane.',
        { note: '**Get off and push across pedestrian crossings.** JET’s rules, as the Prefeitura listed them, and Whoosh’s FAQ both require it. Riding where it isn’t allowed is a medium offence under the Brazilian Traffic Code (Código de Trânsito Brasileiro), fined R$130.16; riding on a pavement where it isn’t authorised is a very serious one, with the fine tripled: R$880.41.' },
      ],
    },
    {
      heading: 'Where to park a JET or Whoosh scooter',
      blocks: [
        'You end a ride only at an authorised point your app shows, and you take a photo of the scooter standing there. In May 2026 the city had 92 points, each with room for up to six scooters from each operator.',
        {
          list: [
            '**Whoosh:** end the ride at a “P” on its map. Anywhere else costs R$40, and R$80 from the second time.',
            '**JET:** end the ride at one of the points in the Go Jet app and photograph it to finish.',
          ],
        },
        'Never leave a scooter where it blocks traffic. You can report a badly parked one in the operator’s app or to the Prefeitura’s ombudsman through Conecta Recife.',
      ],
    },
    {
      heading: 'Age, helmets and the other rules',
      blocks: [
        {
          table: {
            caption: 'E-scooter rules in Recife on 25 October 2026, and who sets them (city rules as the Diario de Pernambuco reported them)',
            head: ['Rule', 'What applies', 'Who sets it'],
            rows: [
              ['Minimum age', '18, with your sign-up validated in the app. JET refuses under-18s even with a parent’s consent', 'Prefeitura; JET and Whoosh'],
              ['Driving licence', 'Not needed', 'CETRAN-PE; JET'],
              ['Helmet', 'Not compulsory, but recommended', 'CTTU; JET'],
              ['Passengers', 'One rider only', 'Prefeitura; JET and Whoosh'],
              ['Alcohol and drugs', 'Banned while riding', 'Prefeitura; JET'],
              ['At night', 'Something reflective recommended', 'JET'],
              ['Insurance', 'Every ride is insured against accidents; Whoosh’s cover excludes misuse such as riding two-up', 'Prefeitura (in the operators’ contracts); JET and Whoosh'],
              ['The scooter', 'Up to 1,000 W and 32 km/h by design, at most 70 cm wide, with a speed display or limiter, a bell and lights at the front, rear and sides', 'National (CONTRAN Resolution 996)'],
              ['Registration and plates', 'None needed', 'National (CONTRAN Resolution 996)'],
              ['Hours', 'No night ban reported; both operators say they monitor the service around the clock', '–'],
            ],
          },
        },
        'The operators enforce the rules too: in the first month they blocked more than 100 users, they told the Diario. A state bill, PL 4009/2026, would set rules for all of Pernambuco, and an amendment would make helmets compulsory; on 26 October 2026 the Legislative Assembly’s (Alepe’s) record showed no vote on it, so it is not law.',
      ],
    },
    {
      heading: 'Where to find JET and Whoosh scooters in Recife',
      blocks: [
        'At 17:40 local time on Sunday 25 October 2026 the [map of Recife](map:br:Recife) showed about 900 standing scooters: 450 JET and 450 Whoosh. That is a snapshot, not the size of either fleet, and scooters on a ride don’t appear.',
        'On the municipal boundaries of IBGE, Brazil’s statistics institute, about 855 stood inside Recife, every Whoosh scooter among them. The other 40 or so were JET scooters, 39 of them at one spot a few dozen metres inside Jaboatão dos Guararapes; since 26 October the map counts them there. About 600 stood north of the Pina basin, in the centre and the north of the city, and about 260 south of it, where the pilot’s bairros are Pina and Boa Viagem; Whoosh had more there, about 160 to JET’s 100. None stood in Olinda or Camaragibe, or as far west as the UFPE campus.',
        'The map shows JET separately in [Paulista](map:br:Paulista), north beyond Olinda (about 630 scooters), and in [Jaboatão dos Guararapes](map:br:Jaboatão dos Guararapes) to the south (about 560).',
        'The map shows Go Jet and Whoosh: each Whoosh scooter’s charge and range, and each JET scooter’s charge. It shows no prices, parking points, zones or hours; the apps do. Both operators run in Porto Alegre and Florianópolis too: see [e-scooters in Porto Alegre](guide:porto-alegre) and [e-scooters in Florianópolis](guide:florianopolis).',
      ],
    },
    {
      heading: 'The metro, the buses and the city’s bikes',
      blocks: [
        'Neither the Metrô do Recife, run by the federal CBTU, nor the Grande Recife Consórcio de Transporte, which runs the buses, mentions scooters aboard on the pages we read. Don’t take a shared one aboard: Whoosh charges R$80 for the metro and R$40 for a bus, and Go Jet’s terms forbid carrying its scooter in any vehicle. End the ride at a point near your station or stop.',
        'Recife’s orange docked bikes are run by Tembici and rented in the Bike Itaú app. Bike Itaú’s Recife page, updated on 22 October 2026, lists 79 stations and 830 bikes: a day pass on the mechanical bikes costs R$9.75, with rides of up to 60 minutes (two hours on Sundays and holidays), and the pedal-assisted e-bikes, from 24 October, R$0.90 a minute with no unlock fee but a 15-minute minimum (R$13.50). In July 2026 Floresta Notícias reported that the Prefeitura was replacing the state’s Bike PE with its own Bike Recife, again run by Tembici. The map shows none of these bikes.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Recife had shared scooters before.** FlipOn started on 20 August 2021 with 30 scooters, and by November it had about 120 at 18 stations, mostly in Boa Viagem and the Bairro do Recife, Folha de Pernambuco reported.',
            '**Over 50,000 rides in the first month.** The operators told the Diario de Pernambuco in April 2026 that riders had made more than 50,000 trips; JET alone counted 31,930 trips by 5,860 people in its first 20 days.',
            '**The pilot is a regulatory sandbox.** Defending it in court, the Prefeitura called it one: a trial under Brazil’s start-up law (the Marco Legal das Startups) that tests a new technology on real streets before any law is settled, the Diario reported.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which companies rent e-scooters in Recife?',
      answer: 'JET, in its Go Jet app, and Whoosh: the two firms in the Prefeitura’s pilot since 22 March 2026. The map shows both.',
    },
    {
      question: 'How much does an e-scooter cost in Recife?',
      answer: 'The app shows the price before you ride, and it changes with demand; neither operator publishes a Recife rate. Whoosh charges R$40 if you end a ride away from a “P” parking point.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Recife?',
      answer: 'Only where it is allowed, at no more than 6 km/h, under the pilot’s rules as the press reported them. Keep to cycle lanes and to streets with a limit of 40 km/h or less; riding on a pavement where it isn’t authorised carries a R$880.41 fine under the national traffic code.',
    },
    {
      question: 'Do you need a helmet or a driving licence?',
      answer: 'Neither: CTTU recommends a helmet but doesn’t require one, and no licence is needed. You must be 18 to rent.',
    },
    {
      question: 'Can you ride a scooter on Avenida Boa Viagem?',
      answer: 'Not on the road: its limit is 60 km/h, above the 40 km/h the rules allow. Use the seafront cycle lane, at up to 20 km/h.',
    },
    {
      question: 'Where can you park a JET or Whoosh scooter?',
      answer: 'Only at a point your own app shows, 92 of them in May 2026 across 19 bairros, with a photo to end the ride. Whoosh charges R$40 for a ride ended anywhere else.',
    },
  ],
  sources: [
    { title: 'Diario de Pernambuco: Recife launches shared e-scooters (22 March 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/03/11710502-recife-lanca-servico-de-patinetes-eletricos-saiba-como-alugar.html' },
    { title: 'Folha de Pernambuco: e-scooters arrive in Recife (22 March 2026), Portuguese', url: 'https://www.folhape.com.br/noticias/sistema-de-patinetes-eletricos-chega-ao-recife-confira-valores/475382/' },
    { title: 'Diario de Pernambuco: the rules for riders (6 April 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711556-patinetes-eletricos-do-recife-confira-regras-de-uso.html' },
    { title: 'Diario de Pernambuco: restricted areas in the Zona Sul (9 April 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11711840-usuarios-de-patinetes-relatam-problemas-em-areas-da-zona-sul-do-recife-empresa-confirma-restricoes.html' },
    { title: 'Diario de Pernambuco: the first month’s figures (20 April 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/04/11712434-empresas-bloqueiam-mais-de-100-usuarios-e-registram-mais-de-50-mil-viagens-no-1-mes-de-patinetes-no-recife.html' },
    { title: 'CETRAN-PE: Technical Note 002/2026 on shared e-scooters (30 April 2026), Portuguese', url: 'https://www.detran.pe.gov.br/notas-tecnicas-cetran' },
    { title: 'Diario de Pernambuco: CETRAN-PE’s note (11 May 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11713986-cetran-pe-reconhece-operacao-dos-patinetes-no-recife-e-faz-serie-de-recomendacoes.html' },
    { title: 'Diario de Pernambuco: insurance and growth (11 May 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11713996-usuarios-de-patinetes-podem-acionar-seguro-contratado-por-empresas-em-caso-de-acidente.html' },
    { title: 'Alepe: state bill PL 4009/2026 and its progress, Portuguese', url: 'https://proposicoes.alepe.pe.gov.br/proposicoes/detalhes?tipo=projeto&numero=4009&ano=2026' },
    { title: 'Diario de Pernambuco: court refuses to suspend the scooters (21 May 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/05/11714741-justica-nega-pedido-de-liminar-de-vereador-para-suspender-patinetes-eletricos-no-recife.html' },
    { title: 'Diario de Pernambuco: Avenida Boa Viagem’s limit (31 July 2026), Portuguese', url: 'https://www.diariodepernambuco.com.br/vida-urbana/2026/07/11719972-limite-de-velocidade-da-avenida-boa-viagem-sera-reduzido-para-50-km-h-apos-obras-na-orla.html' },
    { title: 'Folha de Pernambuco: FlipOn’s scooters arrive in Recife (17 November 2021), Portuguese', url: 'https://www.folhape.com.br/economia/roxinhos-patinetes-eletricos-desembarcam-no-recife-mas-nao-podem-ser/205979/' },
    { title: 'CONTRAN Resolution 996 of 15 June 2023, Portuguese', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao9962023.pdf' },
    { title: 'Chamber of Deputies: Brazilian Traffic Code (Law 9.503 of 1997), Portuguese', url: 'https://www2.camara.leg.br/legin/fed/lei/1997/lei-9503-23-setembro-1997-372348-normaatualizada-pl.html' },
    { title: 'JET Brazil: FAQ and riding rules', url: 'https://jetshr.com/br' },
    { title: 'Go Jet Brazil: rental terms, revised August 2026, Portuguese', url: 'https://static.jetshr.com/jet_website/docs/pdfs/Termos%20Condicoes%20Locacao%20GoJet%20Brasil%20-%20Revisado%20%28Ago26%29.pdf' },
    { title: 'Whoosh Brazil: FAQ, Portuguese', url: 'https://whoosh.bike/faq/br' },
    { title: 'Whoosh Brazil: terms and fines (updated 21 March 2025)', url: 'https://whoosh.bike/terms_br/pt' },
    { title: 'Whoosh Brazil: Whoosh Pass, Portuguese', url: 'https://whoosh.bike/whooshpass/br' },
    { title: 'CBTU: Metrô do Recife, Portuguese', url: 'https://www.gov.br/cbtu/pt-br/servicos/cbtu-recife' },
    { title: 'Grande Recife Consórcio de Transporte: FAQ, Portuguese', url: 'https://www.granderecife.pe.gov.br/fale-conosco/perguntas-frequentes/' },
    { title: 'Bike Itaú (Tembici): bikes in Recife, Portuguese', url: 'https://bikeitau.com.br/recife/' },
    { title: 'Floresta Notícias: Recife prepares Bike Recife (21 July 2026), Portuguese', url: 'https://florestanoticias.com.br/2026/07/11034/' },
    { title: 'Geological Survey of Brazil (SGB): IBGE’s municipal boundaries, map service', url: 'https://geoportal.sgb.gov.br/server/rest/services/cartografia/divisao_politica/MapServer' },
  ],
};

export default guide;
