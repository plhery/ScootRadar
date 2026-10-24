import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-cascais',
  topic: 'cascais',
  name: 'Trotinetes em Cascais',
  title: 'Trotinetes em Cascais 2026: Bird, estações e paredão',
  description: 'Trotinetes em Cascais: a Bird e as 157 estações onde a viagem acaba, o paredão, o centro histórico, a ciclovia do Guincho, o comboio e as regras de 2026.',
  headline: 'Trotinetes em Cascais: a Bird, as estações, o paredão e a ciclovia do Guincho',
  lede: 'As trotinetes partilhadas em Cascais são da Bird, a única operadora no concelho em outubro de 2026, e apanham-se e deixam-se numa das 157 estações de mobilidade partilhada. A Bird não publica tarifas para Cascais: a app mostra o preço antes de desbloquear. O paredão, entre a Conceição e a Azarujinha, é para peões, e a app não deixa circular em cinco zonas do centro histórico, junto à baía. Para o Guincho, há ciclovia ao longo da costa.',
  published: '2026-10-16',
  updated: '2026-10-24',
  city: 'pt:Cascais',
  sections: [
    {
      heading: 'Que trotinetes partilhadas há em Cascais?',
      blocks: [
        'Segundo a MobiCascais, o serviço de mobilidade da Câmara, as 157 estações de mobilidade partilhada do concelho servem veículos «propriedade de uma empresa externa». É a **Bird**, cujos dados abertos para Cascais listam também 157 estações, com trotinetes e bicicletas elétricas. Não há regulamento municipal para as trotinetes: em 2018, a Câmara fez acordos com as empresas «mediante regras e condições muito claras».',
        {
          table: {
            caption: 'Trotinetes em Cascais: quem as aluga e a que preço (16 de outubro de 2026)',
            head: ['Quem', 'Em Cascais', 'Preço', 'No nosso mapa'],
            rows: [
              ['Bird', 'Trotinetes e bicicletas elétricas, nas 157 estações', 'Não publicado: veja na app', 'Sim, só as trotinetes'],
              ['Lime', 'Não: está em Lisboa e Almada', '–', 'Só em Lisboa e Almada'],
              ['Bolt', 'Não: está em Lisboa', '–', 'Não'],
              ['Quiosques MobiCascais', 'Trotinetes ao balcão, em 4 quiosques', '6 € por 30 minutos', 'Não'],
            ],
          },
        },
        'O ScootRadar mostra as trotinetes da Bird, com a bateria de cada uma: cerca de 640 no [mapa de Cascais](map:pt:Cascais) na manhã de 24 de outubro de 2026. As bicicletas elétricas da Bird não aparecem no mapa. Ao lado, em [Oeiras](map:pt:Oeiras), o mapa mostrava cerca de 390 trotinetes, todas da Bird. Nunca alugou uma? Veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Quanto custa: a Bird e as viagens grátis do Cartão Viver Cascais',
      blocks: [
        'A Bird não publica as tarifas de Cascais: a app mostra o preço antes de começar. O contrato de aluguer da Bird para Portugal (de 8 de dezembro de 2021, o ainda publicado) exige 18 anos, prevê uma cativação de 5 € no cartão antes de cada viagem e fixa o preço máximo em 100 € por dia.',
        '**Trotinetes grátis?** Não. Desde 17 de julho de 2026, quem tem o Cartão Viver Cascais (residentes, estudantes e trabalhadores no concelho) anda de graça nas **bicicletas elétricas** da Bird, até 60 minutos por viagem, sem limite diário, dentro do concelho. O benefício «aplica-se exclusivamente às bicicletas elétricas Bird»: nas trotinetes, paga o preço normal. O desbloqueio não está incluído, embora a Bird o tenha posto a 0 € numa campanha no verão de 2026. Para ativar:',
        {
          steps: [
            'Registe-se na app da Bird com o mesmo email da conta MyCascais do Cartão Viver Cascais.',
            'Toque no banner «Viver Cascais» da app.',
            'Entre com as credenciais MyCascais. Para menores, o encarregado de educação tem de ir a um balcão de atendimento.',
          ],
        },
      ],
    },
    {
      heading: 'Alugar uma trotinete sem app: os quiosques MobiCascais',
      blocks: [
        'Para pagar ao balcão, há quatro quiosques da MobiCascais: no Largo da Estação, em Cascais, na Guia, em Carcavelos e no Estoril. Alugam trotinetes elétricas e biCas, as bicicletas da Câmara.',
        {
          table: {
            caption: 'Preços dos quiosques MobiCascais (tabela da MobiCascais, janeiro de 2024)',
            head: ['Tempo', 'Trotinete elétrica', 'biCa elétrica', 'biCa tradicional'],
            rows: [
              ['30 minutos', '6 €', '–', '–'],
              ['1 hora', '10 €', '4 €', '2 €'],
              ['4 horas', '15 €', '–', '–'],
              ['1 dia', '–', '10 €', '6 €'],
            ],
          },
        },
        'O capacete e o cadeado custam 1 € por dia cada. Os quiosques abrem todos os dias das 8h00 às 20h00; do último domingo de outubro (25 de outubro em 2026) até ao fim de março, das 8h00 às 18h00.',
      ],
    },
    {
      heading: 'Onde apanhar e estacionar a trotinete: as estações de mobilidade partilhada',
      blocks: [
        'Em Cascais, a viagem só termina numa estação: a Câmara impôs o geofencing, que «não permite o utilizador terminar a viagem se estacionar o veículo fora de locais autorizados». É também aí que encontra as trotinetes: nos dados abertos da Bird de 17 de outubro de 2026, 607 das 643 estavam a menos de 25 m de uma. Desde 2024, as estações passam a lugares marcados, com suportes, «fora dos passeios e zonas pedonais».',
        'Há estações junto às estações de comboio de Cascais, do Estoril e de São João do Estoril, perto da Boca do Inferno, na Casa da Guia, no Guincho e na Avenida Marginal, em Carcavelos.',
        { note: 'A app não deixa terminar a viagem? Siga até à estação mais próxima: o tempo continua a contar. Pelo contrato da Bird, se não conseguir deixar a trotinete num local válido e pedir à Bird que a vá buscar, a taxa de recolha pode chegar a 120 €, e as coimas e a remoção ficam por sua conta.' },
      ],
    },
    {
      heading: 'Paredão, centro histórico e Marina: onde não pode andar de trotinete',
      blocks: [
        '**Paredão.** O regulamento municipal das praias, na versão publicada em outubro de 2025, reserva os passeios marítimos de Cascais e de Carcavelos à «circulação pedonal». O mesmo artigo só deixa circular bicicletas e trotinetes, elétricas incluídas, «nos locais destinados para o efeito e devidamente assinalados». Não encontrámos nenhum troço do paredão assinalado para trotinetes: entre a Praia da Conceição e a Azarujinha (2,75 km) e em Carcavelos, leve-a à mão. A infração é uma contraordenação ambiental leve, e a lei para que o regulamento remete fixa a coima em 200 a 2000 €, ou 400 a 4000 € se for intencional. A app da Bird pode não a travar aqui: a regra vale na mesma.',
        '**Centro histórico.** Os dados públicos da Bird marcam cinco zonas no centro onde a trotinete não pode circular, nem de passagem. No mapa do OpenStreetMap, cobrem a Praia da Ribeira, o Largo Luís de Camões e boa parte da Rua Frederico Arouca, o Largo da Praia da Rainha, a Praça 5 de Outubro, junto à Câmara, e o Largo da Assunção, junto à Igreja Matriz. Aí, leve-a à mão; a app mostra os limites.',
        '**Marina, Cidadela e Boca do Inferno.** Não são zonas proibidas nos dados da Bird em outubro de 2026, mas valem as regras gerais: nunca no passeio e, na estrada, sempre junto à direita.',
      ],
    },
    {
      heading: 'A ciclovia do Guincho, o vento e Sintra',
      blocks: [
        'A ciclovia sai do Farol de Santa Marta e segue 9 km pela costa até ao Guincho, com mais 1 km até à Areia, segundo a Câmara. A trotinete elétrica, equiparada a bicicleta, deve usar a ciclovia sempre que exista; a pedovia de 7 km, da Casa da Guia ao Guincho, é para quem anda a pé. O Guincho fica dentro da zona da Bird, com estações perto da praia e do parque de campismo.',
        'Conte com vento: a 9 de junho de 2026, por exemplo, o IPMA previa rajadas até 80 km/h «em especial junto ao Cabo Raso e durante a tarde». A Bird dá às trotinetes de Cascais 24 km de autonomia máxima, e até ao Guincho são 9 km: escolha uma com a bateria cheia.',
        '**Sintra e Cabo da Roca** ficam fora da zona da Bird, que chega à Malveira da Serra. Termine a viagem em Cascais e apanhe um autocarro da Carris Metropolitana no terminal: a 1624 sobe pela Malveira da Serra e pela Azóia até Almoçageme e à Portela de Sintra, e alguns autocarros param no Cabo da Roca; a 1621 é a expressa para a Portela de Sintra.',
      ],
    },
    {
      heading: 'Regras do Código da Estrada para trotinetes em Cascais',
      blocks: [
        'Uma trotinete elétrica até 0,25 kW e 25 km/h é equiparada a velocípede: não precisa de carta, de seguro nem, por agora, de capacete. As regras nacionais que mais pesam, em outubro de 2026:',
        {
          table: {
            caption: 'Regras e coimas para trotinetes elétricas (Código da Estrada, outubro de 2026)',
            head: ['Regra', 'O que fazer', 'Coima'],
            rows: [
              ['Passeio', 'Andar na estrada ou na ciclovia, nunca no passeio', '60 a 300 €'],
              ['Sentido', 'Pela direita, no sentido do trânsito', '250 a 1250 € em sentido contrário'],
              ['Telemóvel e auriculares', 'Telemóvel guardado; no máximo um auricular', '250 a 1250 €'],
              ['Passageiro', 'Só uma pessoa por trotinete', '60 a 300 €'],
              ['Álcool', 'Menos de 0,5 g/l', '250 a 2500 €; crime a partir de 1,2 g/l'],
              ['Luzes', 'Acesas do anoitecer ao amanhecer', '30 a 150 €'],
              ['Capacete', 'Não é obrigatório, mas use-o', 'Nenhuma, por agora'],
              ['Idade', 'A lei não fixa mínimo; a Bird pede 18 anos', '–'],
            ],
          },
        },
        'O capacete pode voltar a ser obrigatório: a 30 de setembro de 2026, a Assembleia da República aprovou na generalidade dois projetos de lei nesse sentido, com coima prevista de 30 a 150 €. Ainda não são lei: em outubro de 2026, estavam em discussão na especialidade. Não encontrámos em Cascais nenhum horário noturno nem limite de velocidade municipal para as trotinetes. Mais pormenores nas [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Comboio do Cais do Sodré, aeroporto e Lisboa: dicas para Cascais',
      blocks: [
        {
          list: [
            '**Comboio da Linha de Cascais.** Uma trotinete própria viaja de graça a qualquer hora, uma por passageiro, sem andar nela no comboio nem na estação. Uma partilhada não entra: termine a viagem antes, numa das estações da Bird junto à estação de Cascais.',
            '**Obras na linha.** Desde 6 de abril de 2026, com obras entre Caxias e Cascais, o comboio é substituído por autocarros nos dias úteis a partir das 21h50, ao sábado a partir das 20h50 e ao domingo entre as 5h30 e as 8h50 e a partir das 19h50. A CP só leva trotinetes com o comboio a circular normalmente, não nos autocarros de substituição. Confirme no site da CP.',
            '**Autocarros MobiCascais.** Uma trotinete dobrável pode ir lá dentro, se não tapar lugares nem portas.',
            '**Aeroporto.** No aeroporto, apanhe o metro, linha vermelha até à Alameda e linha verde até ao Cais do Sodré, e aí o comboio para Cascais.',
            '**Lisboa.** A zona de circulação da Bird de Cascais estende-se a Oeiras e a Lisboa, mas as estações desta frota ficam todas no concelho: veja na app onde pode terminar. Lisboa tem regras próprias: veja [trotinetes em Lisboa](guide:lisbon).',
            '**Inverno.** A Bird diz desenvolver «todos os esforços» para funcionar 365 dias por ano, sem o garantir.',
          ],
        },
      ],
    },
    {
      heading: 'Sabia que…?',
      blocks: [
        {
          list: [
            '**As biCas têm 25 anos.** As bicicletas de Cascais nasceram em 2001, em três quiosques, para passear. Em 2016, com a MobiCascais, passaram a transporte diário, com 12 estações; ano e meio depois, eram 87.',
            '**Em 2021, havia escolha.** A LINK chegou a Cascais em agosto de 2021 com 200 trotinetes, a 0,15 € por minuto mais 1 € de desbloqueio, e a Bolt em novembro. Hoje, a Câmara fala de uma só empresa.',
            '**Cada vez mais viagens.** Segundo a MobiCascais, o serviço tem vindo a crescer cerca de 20 mil viagens por ano.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Há trotinetes grátis em Cascais?',
      answer: 'Não. O benefício do Cartão Viver Cascais, em vigor desde 17 de julho de 2026, dá viagens grátis até 60 minutos só nas bicicletas elétricas da Bird. Nas trotinetes, paga o preço da app.',
    },
    {
      question: 'Posso andar de trotinete no paredão de Cascais?',
      answer: 'Só onde um sinal o permita, e não encontrámos nenhum. O regulamento municipal das praias reserva o paredão a quem anda a pé, e a infração dá coima de 200 a 2000 €, ou de 400 a 4000 € se for intencional. Leve a trotinete à mão.',
    },
    {
      question: 'Posso levar a trotinete no comboio de Lisboa para Cascais?',
      answer: 'Uma trotinete própria, sim: é grátis na Linha de Cascais, a qualquer hora, uma por passageiro. Com as obras de 2026, à noite e ao domingo de manhã cedo o comboio é substituído por autocarros, que não levam trotinetes. Uma trotinete partilhada não entra no comboio.',
    },
    {
      question: 'Há trotinetes Lime ou Bolt em Cascais?',
      answer: 'Não, em outubro de 2026. A Lime opera em Lisboa e em Almada (chegou a Oeiras em 2024, mas se ainda lá opera está por confirmar); a Bolt, em Lisboa. Em Cascais, as trotinetes partilhadas são da Bird.',
    },
  ],
  sources: [
    { title: 'MobiCascais: micromobilidade (21 de maio de 2025)', url: 'https://mobi.cascais.pt/geral/micromobilidade' },
    { title: 'MobiCascais: bicicletas elétricas gratuitas com o Cartão Viver Cascais (17 de julho de 2026)', url: 'https://mobi.cascais.pt/noticia/bicicletas-eletricas-gratuitas-24-horas-por-dia' },
    { title: 'MobiCascais: quiosques, preços e horários', url: 'https://mobi.cascais.pt/geral/quiosques-mobicascais' },
    { title: 'Bird: dados abertos (GBFS) de Cascais', url: 'https://mds.bird.co/gbfs/v2/public/cascais/gbfs.json' },
    { title: 'Bird: contrato de aluguer em Portugal (8 de dezembro de 2021)', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'Câmara de Cascais: regulamento das praias balneares (Aviso n.º 25462/2025/2)', url: 'https://www.cascais.pt/sites/default/files/anexos/gerais/new/aviso_n.o_25462_2025_2_dr.pdf' },
    { title: 'Diário da República: Lei-Quadro das Contraordenações Ambientais (Lei n.º 50/2006)', url: 'https://diariodarepublica.pt/dr/legislacao-consolidada/lei/2006-70149602' },
    { title: 'Câmara de Cascais: ciclovias, pedovias e passeios marítimos', url: 'https://www.cascais.pt/sites/default/files/anexos/gerais/05_parques_urbanos_e_infantis.pdf' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'CP: transporte de bicicletas e trotinetas', url: 'https://www.cp.pt/info/w/transporte-bicicletas' },
    { title: 'CP: Linha de Cascais, alterações de serviço (21 de setembro de 2026)', url: 'https://www.cp.pt/info/pt/w/linha-de-cascais-servico-rodoviario' },
    { title: 'Echo Boomer: a LINK chegou a Cascais (26 de agosto de 2021)', url: 'https://echoboomer.pt/trotinetes-link-chegaram-a-cascais/' },
    { title: 'Echo Boomer: a Bolt chegou a Cascais (16 de novembro de 2021)', url: 'https://echoboomer.pt/trotinetes-eletricas-da-bolt-em-cascais/' },
    { title: '24 Notícias: previsão do IPMA para 9 de junho de 2026', url: 'https://24noticias.sapo.pt/atualidade/artigos/ceu-limpo-mas-vento-forte-marcam-o-tempo-esta-terca-feira' },
  ],
};

export default guide;
