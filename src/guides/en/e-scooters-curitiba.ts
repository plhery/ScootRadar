import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-curitiba',
  topic: 'curitiba',
  name: 'Renting an e-scooter in Curitiba',
  title: 'E-scooters Curitiba 2026: JET, Whoosh and where to ride',
  description: 'E-scooters in Curitiba: JET and Whoosh, the 16 bairros they serve, where you may ride and park, and the city’s rules for riders since September 2026.',
  headline: 'E-scooters in Curitiba: JET and Whoosh, where to ride, where to park and the rules',
  lede: 'You can rent an e-scooter in Curitiba from JET, whose app in Brazil is Go Jet, or from Whoosh: the two operators accredited by Urbs, the city company that runs the scheme, in 16 central bairros (districts). Each app shows its price before you ride. You must be 18. Ride on cycle lanes at up to 20 km/h or on streets with a limit of 40 km/h or less, never on the pavement or the Rua XV de Novembro, and end the ride at a point your app shows.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'br:Curitiba',
  sections: [
    {
      heading: 'Which e-scooter apps work in Curitiba?',
      blocks: [
        'Under the city’s Decree 450 of 2026, as Agora Paraná and Bem Paraná reported it, only firms accredited by Urbs (Urbanização de Curitiba S.A.), a city company, may rent out scooters, and Urbs sets their rules, monitors them and imposes sanctions. Its call for operators, published on 27 May 2026, runs for 60 months and stays open to new firms. By 25 October two were running:',
        {
          list: [
            '**JET**, with blue scooters, the first accredited. It started on 3 July 2026 with 1,000 scooters and 100 pick-up and drop-off points in the Centro, the Centro Cívico and Batel. In Brazil you rent them in the **Go Jet** app, with a phone number, an e-mail address and a card or Pix.',
            '**Whoosh**, with grey and yellow scooters, the second, accredited in September 2026. You sign up with a phone number, an e-mail address and a card or a Pix top-up; its terms say it may also ask for your CPF, Brazil’s taxpayer number.',
          ],
        },
        'On 24 September 2026, BandNews FM and Tribuna PR reported, Urbs let Whoosh put 1,000 scooters on the streets and JET 500 more, 2,500 in all, and widened the area from three bairros to 16: the Centro, Centro Cívico and Batel, plus Água Verde, Alto da Glória, Alto da XV, Bigorrilho, Campina do Siqueira, Cristo Rei, Jardim Botânico, Mercês, Prado Velho, Rebouças, São Francisco, Seminário and Vila Izabel, though not Parque Barigui.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does electric scooter rental in Curitiba cost?',
      blocks: [
        'Each app shows the price before you start, and neither operator publishes a Curitiba rate on its website. JET says its rates vary by city, day of the week and demand, and it charges paused time like riding time. Whoosh shows each scooter’s start cost and price per minute before you start the ride, and adds accident insurance unless you switch it off. A Whoosh Pass (7 days, 30 days or a year) removes the unlock fee, not the per-minute price.',
        {
          table: {
            caption: 'What Whoosh charges in Brazil when a ride goes wrong (terms updated 21 March 2025)',
            head: ['What happens', 'Whoosh charges'],
            rows: [
              ['Ending a ride away from a “P” parking point', 'R$40'],
              ['Two people on one scooter, or letting someone under 18 ride', 'R$40'],
              ['Carrying the scooter in a car, bus or taxi', 'R$40'],
              ['Leaving the scooter standing outside a parking point for more than 30 minutes during a ride', 'R$80'],
              ['Taking the scooter into a building', 'R$80'],
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
      heading: 'Where can you ride an e-scooter in Curitiba?',
      blocks: [
        'Two sets of rules apply to every e-scooter, rented or your own. Paraná’s state traffic council, CETRAN-PR, set guidelines for the state’s towns in Resolution 106 of 14 July 2026, in force since 20 July, under Brazil’s national rule, CONTRAN Resolution 996 of 2023. Curitiba’s Decree 1.520, signed on 17 September 2026, applies them in the city; the table follows the decree as Tribuna PR, Folha de Curitiba and HojePR reported it.',
        {
          table: {
            caption: 'Where a stand-up e-scooter may ride in Curitiba (CETRAN-PR Resolution 106 of 14 July 2026; city Decree 1.520 of 2026, as reported)',
            head: ['Where', 'Allowed?', 'Top speed'],
            rows: [
              ['Cycle track (ciclovia) or cycle lane (ciclofaixa)', 'Yes', '20 km/h, unless signs say otherwise'],
              ['Street with a speed limit of 40 km/h or less', 'Yes, in the right-hand lane, with the traffic', 'The street’s limit'],
              ['Pedestrian area where signs allow scooters', 'Yes', '6 km/h'],
              ['Pavement, pedestrian street (calçadão), footbridge, park, square or pedestrian crossing without such signs', 'No: get off, switch off and push', '–'],
              ['Busway (canaleta), bus lane or the bus roads inside a terminal', 'No', '–'],
              ['Street with a limit above 40 km/h, or an expressway', 'Only on its cycle track', '20 km/h'],
            ],
          },
        },
        'Ride against the traffic only on a cycle track signed for it. Both operators cap their scooters at 20 km/h, and Whoosh slows them to 9–15 km/h where its app marks a limit. Urbs’s call for operators also holds each new rider to 15 km/h for the first five rides or the first 30 minutes, whichever comes first, Agora Paraná reported at the launch.',
        { note: '**The Rua XV de Novembro is for walking.** Since 22 July 2026, Urbs told the Jornal Paraná, a shared scooter switches itself off if you ride into the street’s pedestrian section, the Passeio Público, the Praça Rui Barbosa or the Praça Osório.' },
      ],
    },
    {
      heading: 'Where to park a JET or Whoosh scooter',
      blocks: [
        'Urbs’s rules, as the press reported them at the launch, say a shared scooter goes back only to a point the operator’s app shows, and you take a photo of it standing there.',
        {
          list: [
            '**Whoosh:** end the ride at a “P” on its map. Whoosh aims to keep one within 200–300 metres, asks you to leave two metres clear, and charges R$40 for a ride ended anywhere else.',
            '**JET:** end the ride at one of the parking points in the Go Jet app, and send the photo it asks for.',
          ],
        },
        'Never leave a scooter on the pavement, a pedestrian crossing or a dropped kerb, or across a driveway. If you find one that blocks the way, report it on the city’s 156 line: Urbs passes complaints to the operator, which deals with them.',
      ],
    },
    {
      heading: 'Age, helmets and the other rules',
      blocks: [
        {
          table: {
            caption: 'E-scooter rules in Curitiba on 25 October 2026, and who sets them (city rules as the local press reported them)',
            head: ['Rule', 'What applies', 'Who sets it'],
            rows: [
              ['Minimum age to rent', '18; JET refuses under-18s even with a parent’s consent', 'Urbs; JET and Whoosh'],
              ['Minimum age on your own scooter', '16, with a parent’s authorisation until 18', 'State (CETRAN-PR); city decree'],
              ['Driving licence', 'Not needed', 'JET; city decree'],
              ['Helmet', 'Not compulsory, but recommended', 'State (CETRAN-PR); city decree'],
              ['Passengers and loads', 'One rider only; no loads or deliveries on a shared scooter', 'City decree; Urbs'],
              ['Phone, headphones, alcohol', 'Banned while riding, and so is riding with one hand', 'City decree'],
              ['The scooter', 'Up to 1,000 W and 32 km/h by design, at most 70 cm wide, with a speed display or limiter, a bell and lights at the front, rear and sides', 'National (CONTRAN Resolution 996)'],
              ['Registration and plates', 'None needed', 'National (CONTRAN Resolution 996)'],
              ['Hours', 'No night ban reported', '–'],
            ],
          },
        },
        'The city’s department for public safety and traffic, the Secretaria Municipal de Defesa Social e Trânsito (SMDT), enforces the decree with its traffic agents and the Guarda Municipal. In October 2026 the city told HojePR and Bem Paraná that the law gives it no basis to fine scooter riders in these cases, such as riding on the pavement, so its checks are educational. Under the decree, Folha de Curitiba reported, a scooter may be held or removed only where the conduct is also an offence under Brazil’s traffic code. Operators can still block your account.',
        'On 22 October 2026 the SMDT held one of these checks at the corner of Rua Mariano Torres and Avenida Sete de Setembro, and planned another for the following week. Riders without a helmet are given one.',
      ],
    },
    {
      heading: 'Where to find JET and Whoosh scooters in Curitiba',
      blocks: [
        'At 16:40 local time on Sunday 25 October 2026 the [map of Curitiba](map:br:Curitiba) showed about 1,700 standing scooters: 1,300 JET and 400 Whoosh. That is a snapshot, not the size of either fleet, and scooters on a ride don’t appear.',
        'On the official bairro boundaries of IPPUC, the city’s planning institute, every scooter on the map a few minutes later stood inside Curitiba, in 22 of its 75 bairros. The three where the scheme began, the Centro (572), Batel (215) and the Centro Cívico (158), held more than half. Of the 13 added in September, Bigorrilho had the most (173), ahead of Rebouças (121), Água Verde (117), São Francisco (107) and Mercês (89). JET had most of the scooters from Batel to Bigorrilho and Mercês; Whoosh had most of its own in the Centro, Água Verde and Rebouças.',
        'The map shows Go Jet and Whoosh: each Whoosh scooter’s charge and range, and each JET scooter’s charge. It shows no prices, parking points, zones or hours; the apps do. On Paraná’s coast it also shows JET in [Guaratuba](map:br:Guaratuba) and [Matinhos](map:br:Matinhos). Both operators run in Porto Alegre too: see [e-scooters in Porto Alegre](guide:porto-alegre).',
      ],
    },
    {
      heading: 'Buses, parks and the city’s bikes',
      blocks: [
        'Keep out of the canaletas, the busways kept for Curitiba’s buses, and of the bus roads inside terminals. Paraná’s guidelines ban scooters from bus-only lanes, and the city decree and Urbs’s call, as reported, add the terminals. Whoosh charges R$40 for carrying its scooter on a bus, so end the ride at a point near your stop.',
        'Under the decree, as reported, you may not ride through parks or squares unless signs allow it, and Parque Barigui is outside the operators’ area.',
        'Curitiba’s docked bike share, bike Estácio, is run by Tembici: ordinary bikes and e-bikes you unlock with a QR code in the Tembici app. The map shows standing e-scooters only, not these bikes.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Riding two-up got accounts blocked.** In its first three weeks JET stepped in 516 times and blocked 257 accounts, mostly for two people on one scooter or riders under 18.',
            '**Over 50,000 rides in under a month.** Riders made them between the launch on 3 July 2026 and 23 July.',
            '**On slower streets, scooters come first.** Paraná’s guidelines let them ride on streets with a limit of 40 km/h or less, with the traffic and with priority over motor vehicles.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which companies rent e-scooters in Curitiba?',
      answer: 'JET, in its Go Jet app, and Whoosh: the two operators Urbs has accredited. The map shows both. Urbs’s call stays open until 2031, so more may follow.',
    },
    {
      question: 'How much does an e-scooter cost in Curitiba?',
      answer: 'The app shows the price before you ride, and it changes with demand. Neither JET nor Whoosh publishes a Curitiba rate on its website; a Whoosh Pass removes the unlock fee.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Curitiba?',
      answer: 'No. Ride on cycle lanes, at up to 20 km/h, and on streets with a limit of 40 km/h or less. Where signs let scooters share a pedestrian area, keep to 6 km/h; anywhere else meant for people on foot, get off and push.',
    },
    {
      question: 'Can you ride on the Rua XV de Novembro?',
      answer: 'No. Its pedestrian section is closed to the shared scooters, which switch off there, as they do in the Passeio Público and in the Praça Rui Barbosa and the Praça Osório.',
    },
    {
      question: 'Do you need a helmet or a driving licence?',
      answer: 'Neither: a helmet is recommended but not compulsory, and no licence is needed. You must be 18 to rent.',
    },
    {
      question: 'Where can you park a JET or Whoosh scooter?',
      answer: 'Only at a point your own app shows, with a photo: a “P” in Whoosh, a parking point in Go Jet. Never on the pavement or a crossing; Whoosh charges R$40 for a ride ended anywhere else.',
    },
  ],
  sources: [
    { title: 'CETRAN-PR Resolution 106 of 14 July 2026: guidelines for e-bikes and e-scooters in Paraná, Portuguese', url: 'https://www.cetran.pr.gov.br/sites/cetran/arquivos_restritos/files/documento/2026-07/resolucao_106-26_dispoe_sobre_as_diretrizes_para_a_regulamentacao_da_circulacao_de_ciclomotores.pdf' },
    { title: 'CONTRAN Resolution 996 of 15 June 2023, Portuguese', url: 'https://www.gov.br/transportes/pt-br/assuntos/transito/conteudo-contran/resolucoes/Resolucao9962023.pdf' },
    { title: 'Tribuna PR: Curitiba’s Decree 1.520 on e-bikes and scooters (18 September 2026), Portuguese', url: 'https://www.tribunapr.com.br/noticias/curitiba-regiao/curitiba-regulamenta-bicicletas-eletricas-e-patinetes-veja-o-que-muda-no-transito/' },
    { title: 'Folha de Curitiba: what the decree says (23 September 2026), Portuguese', url: 'https://folhadecuritiba.com.br/curitiba-regulamenta-circulacao-de-patinetes-e-bicicletas-eletricas-especialista-analisa-novas-regras/' },
    { title: 'HojePR: the decree, and a second operator accredited (18 September 2026), Portuguese', url: 'https://hojepr.com/curitiba-proibe-patinetes-nas-calcadas-e-define-onde-veiculos-eletricos-podem-circular/' },
    { title: 'HojePR: no fines for riding on pavements (23 October 2026), Portuguese', url: 'https://hojepr.com/mesmo-proibidos-patinetes-eletricos-avancam-sobre-calcadas-calcadoes-curitiba/' },
    { title: 'Bem Paraná: the SMDT’s checks for scooter riders (24 October 2026), Portuguese', url: 'https://www.bemparana.com.br/noticias/parana/blitze-em-curitiba-orientam-usuarios-de-patinetes-e-bicicletas-eletricas/' },
    { title: 'Bem Paraná: JET’s launch (3 July 2026), Portuguese', url: 'https://www.bemparana.com.br/noticias/parana/curitiba-ganha-novo-servico-de-aluguel-de-patinetes-eletricos-veja-como-funciona/' },
    { title: 'Agora Paraná: the launch, Decree 450 and Urbs’s call (3 July 2026), Portuguese', url: 'https://www.agoraparana.com.br/curitiba/prefeitura-lanca-servico-de-aluguel-de-patinetes-disponivel-no-centro-centro-civico-e-batel/' },
    { title: 'Jornal Paraná: scooters blocked on the Rua XV and in the Passeio Público (23 July 2026), Portuguese', url: 'https://www.parana.jor.br/2026/07/23/patinetes-eletricos-terao-restricoes-em-algumas-regioes-de-curitiba/' },
    { title: 'Bem Paraná: Whoosh joins, 13 more bairros (24 September 2026), Portuguese', url: 'https://www.bemparana.com.br/noticias/parana/patinetes-eletricos-curitiba-3/' },
    { title: 'BandNews FM Curitiba: the 16 bairros (24 September 2026), Portuguese', url: 'https://bandnewsfmcuritiba.com/cobertura-de-patinetes-eletricos-em-curitiba-e-ampliada-para-mais-13-bairros/' },
    { title: 'Tribuna PR: 2,500 scooters in 16 bairros (24 September 2026), Portuguese', url: 'https://www.tribunapr.com.br/noticias/curitiba-regiao/patinetes-eletricos-mais-bairros-curitiba/' },
    { title: 'JET Brazil: FAQ and riding rules, Portuguese', url: 'https://jetshr.com/br' },
    { title: 'Go Jet Brazil: rental terms, revised August 2026, Portuguese', url: 'https://static.jetshr.com/jet_website/docs/pdfs/Termos%20Condicoes%20Locacao%20GoJet%20Brasil%20-%20Revisado%20%28Ago26%29.pdf' },
    { title: 'Whoosh Brazil: FAQ, Portuguese', url: 'https://whoosh.bike/faq/br' },
    { title: 'Whoosh Brazil: terms and fines (updated 21 March 2025)', url: 'https://whoosh.bike/terms_br/pt' },
    { title: 'Whoosh Brazil: parking rules, Portuguese', url: 'https://whoosh.bike/parking_rules/br' },
    { title: 'Whoosh Brazil: Whoosh Pass, Portuguese', url: 'https://whoosh.bike/whooshpass/br' },
    { title: 'Tembici: bike Estácio in Curitiba, Portuguese', url: 'https://www.tembici.com.br/pt/curitiba/' },
    { title: 'IPPUC: official bairro and park boundaries (geodata), Portuguese', url: 'https://ippuc.org.br/geodownloads/geo.htm' },
  ],
};

export default guide;
