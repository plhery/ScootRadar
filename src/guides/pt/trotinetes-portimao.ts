import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-portimao',
  topic: 'portimao',
  name: 'Trotinetes em Portimão',
  title: 'Trotinetes em Portimão 2026: Bird, Praia da Rocha e regras',
  description: 'Trotinetes em Portimão: a Bird, onde não pode andar nem estacionar na Praia da Rocha, na Ribeirinha e em Alvor, os passadiços e as regras de 2026.',
  headline: 'Trotinetes em Portimão: a Bird, a Praia da Rocha, Alvor e as regras que a Câmara prepara',
  lede: 'As trotinetes partilhadas em Portimão são da Bird, em outubro de 2026, e o preço só aparece na app, antes de desbloquear. A zona da Bird vai do centro à Praia da Rocha e a Alvor, mas não se termina a viagem junto às praias da Rocha e do Vau, nem se anda nas zonas pedonais do centro, junto ao rio e em Alvor. Nos passadiços das praias, as trotinetes são proibidas, e a Câmara começou em agosto de 2026 a preparar regras próprias.',
  published: '2026-10-18',
  updated: '2026-10-26',
  city: 'pt:Portimão',
  sections: [
    {
      heading: 'Que trotinetes partilhadas há em Portimão?',
      blocks: [
        'Em outubro de 2026, quem aluga trotinetes em Portimão é a **Bird**, que tem também bicicletas elétricas na mesma app. Não encontrámos outra empresa: a página da Bolt para o Algarve só tem viagens de carro, e nas deliberações da Câmara desde 2024 só aparece a Bird.',
        {
          table: {
            caption: 'Trotinetes partilhadas em Portimão: quem as aluga e a que preço (17 de outubro de 2026)',
            head: ['Quem', 'Em Portimão', 'Preço', 'No nosso mapa'],
            rows: [
              ['Bird', 'Trotinetes e bicicletas elétricas', 'Não publicado: veja na app', 'Sim: cerca de 450 trotinetes'],
              ['Bolt, Lime e outras', 'Não encontrámos nenhuma', '–', 'Não'],
            ],
          },
        },
        'O ScootRadar mostra as trotinetes da Bird, com a bateria de cada uma: cerca de 450 no [mapa de Portimão](map:pt:Portimão) às 18h25 de 17 de outubro de 2026, de Alvor à Praia da Rocha. São as que estavam paradas e livres, não a frota da Bird. As bicicletas elétricas da Bird, cerca de 100 nos dados abertos da madrugada seguinte, não aparecem no mapa.',
        '**Preço.** A Bird não publica as tarifas de Portimão, nem no site nem nos dados abertos: a app mostra o preço no ecrã de desbloqueio. Pelo contrato da Bird para Portugal (versão de 8 de dezembro de 2021), o preço pode juntar uma taxa de início, um valor por minuto ou por distância e um mínimo, há passes, e o máximo por dia de calendário é de 100 €. É preciso ter 18 anos. Nunca alugou uma? Veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'As regras da Câmara de Portimão: ainda sem regulamento',
      blocks: [
        'Portimão não tem regulamento municipal para as trotinetes partilhadas, em outubro de 2026. Nas deliberações publicadas, o único acordo com a Bird é um projeto-piloto de **bicicletas** elétricas partilhadas, aprovado a 18 de setembro de 2024, com uma segunda fase em agosto de 2025. Não encontrámos a deliberação que enquadra as trotinetes, nem limites de frota ou taxas.',
        'A 19 de agosto de 2026, numa proposta do PSD, a Câmara aprovou o início do procedimento de regulamentação municipal da micromobilidade partilhada (Deliberação n.º 650/26). Segundo a imprensa, a proposta não cria já um regulamento nem prevê proibir as trotinetes. Antes, haverá um diagnóstico técnico do estacionamento, da circulação e dos conflitos com os passeios e os percursos acessíveis, ouvindo a EMARP, a polícia, os operadores e o comércio.',
        'Até 18 de outubro de 2026, não encontrámos um projeto de regulamento em consulta pública. Desde março de 2026, a Câmara põe sinais de proibição de bicicletas e trotinetes nas zonas pedonais mais movimentadas da cidade e de Alvor, como as da zona ribeirinha e do centro histórico, onde se andava «muitas vezes a velocidades elevadas». Aí, tem de desmontar e levar a trotinete pela mão.',
      ],
    },
    {
      heading: 'Onde pode andar de trotinete em Portimão: Praia da Rocha, Ribeirinha e Alvor',
      blocks: [
        'Nos dados abertos da Bird de 18 de outubro de 2026, a zona de circulação cobre a cidade, a Praia da Rocha, os Três Castelos, o Vau e Alvor; o Autódromo Internacional do Algarve fica de fora. Os sítios mais procurados ficam assim (a app tem sempre a última palavra):',
        {
          table: {
            caption: 'De trotinete Bird em Portimão: onde andar e onde terminar a viagem (18 de outubro de 2026)',
            head: ['Sítio', 'Andar', 'Terminar a viagem'],
            rows: [
              ['Zona ribeirinha, junto ao Arade', 'Na ciclovia; nas praças pedonais, leve-a à mão', 'Não nas praças pedonais'],
              ['Centro histórico: Rua do Comércio, Rua Júdice Fialho, Rua Dr. José Joaquim Nunes, Jardim 1.º de Dezembro', 'Não: leve-a à mão', 'Não'],
              ['Praia da Rocha, Três Castelos e Praia do Vau, junto ao mar', 'Só de passagem', 'Não'],
              ['Avenida Tomás Cabreira e Marina de Portimão', 'Na estrada ou na ciclovia', 'Sim, fora do passeio'],
              ['Prainha e Praia dos Três Irmãos, junto às falésias', 'Não', 'Não'],
              ['Centro antigo de Alvor: Rua Dr. Frederico Ramos Mendes, Rua dos Pescadores', 'Não: leve-a à mão', 'Não'],
              ['Passadiços das praias, como o de Alvor', 'Não: proibido pelo regulamento das praias', 'Não'],
              ['Estação de comboios, Portimão Arena, Mercado Municipal, Museu de Portimão', 'Na estrada ou na ciclovia', 'Sim, fora do passeio'],
            ],
          },
        },
        '**Praia da Rocha.** À beira-mar, da Praia da Rocha aos Três Castelos e ao Vau, a app deixa atravessar, mas não terminar a viagem: termine-a na Avenida Tomás Cabreira ou junto à marina. Mais a oeste, na costa da Prainha e dos Três Irmãos, nem de passagem.',
        '**Passadiços.** O Regulamento Municipal de Gestão de Praias Marítimas, em vigor desde fevereiro de 2024, diz que os passadiços de madeira dão «acesso exclusivamente pedonal às praias» e proíbe neles trotinetes, bicicletas, skates, hoverboards e veículos elétricos (artigos 20.º e 21.º). A coima prevista vai de 55 a 550 € (artigo 24.º).',
        '**Ribeirinha, baixa e Alvor.** Junto ao Arade, ande na ciclovia: a app da Bird trava as trotinetes nas praças pedonais junto ao rio, nas ruas pedonais da baixa e no centro antigo de Alvor. Termine a viagem antes e siga a pé.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete em Portimão',
      blocks: [
        'Fora das zonas acima, a app da Bird deixa terminar a viagem na maior parte da cidade: nos dados abertos da Bird, Portimão não tem estações. A Bird pede que pare numa zona de estacionamento permitida, baixe o descanso, deixe livres passeios, rampas e entradas, e tire a fotografia na app.',
        { note: 'A app não deixa terminar a viagem à beira-mar? Siga até à Avenida Tomás Cabreira ou à Estrada do Vau e pare fora do passeio: enquanto a viagem não acaba, continua a pagar.' },
        'Uma trotinete própria estacionada no passeio ou na ciclovia dá coima de 30 a 150 €, ou de 60 a 300 € se impedir a passagem de peões. Numa partilhada, o contrato da Bird passa as coimas e as despesas a quem a conduzia, e uma trotinete que não seja devolvida em 48 horas pode custar até 500 €.',
      ],
    },
    {
      heading: 'Regras do Código da Estrada para trotinetes em Portimão',
      blocks: [
        'Uma trotinete elétrica até 0,25 kW e 25 km/h é equiparada a velocípede: não precisa de carta, de seguro nem, por agora, de capacete. As regras nacionais que mais pesam, em outubro de 2026:',
        {
          table: {
            caption: 'Regras e coimas para trotinetes elétricas (Código da Estrada, outubro de 2026)',
            head: ['Regra', 'O que fazer', 'Coima'],
            rows: [
              ['Passeio', 'Andar na estrada ou na ciclovia; no passeio, só crianças até aos 10 anos', '60 a 300 €'],
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
        'O capacete pode voltar a ser obrigatório: a 30 de setembro de 2026, a Assembleia da República aprovou na generalidade dois projetos de lei nesse sentido, com coima prevista de 30 a 150 €. Ainda não são lei. Não encontrámos em Portimão nenhum horário noturno nem regra de verão para as trotinetes. Mais pormenores nas [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Comboio, autocarros e aeroporto de Faro: dicas para quem vem de férias',
      blocks: [
        {
          list: [
            '**Comboio.** Desde 19 de julho de 2026, os comboios da Linha do Algarve são elétricos, e há comboios diretos de Lagos a Vila Real de Santo António, sem mudar em Faro. Entre Faro e Lagos, há um comboio a cada duas horas, com reforço nas horas de ponta; de Portimão a Faro são cerca de 1h15, e o último comboio sai por volta das 20h40, nos dois sentidos. Confirme no site da CP.',
            '**Trotinete no comboio.** Uma trotinete própria por passageiro viaja de graça nos comboios regionais, se houver espaço: pergunte ao revisor antes de entrar, e não ande nela no comboio nem na estação. Uma partilhada não entra: termine a viagem antes. A estação de Portimão fica dentro da zona da Bird.',
            '**Aeroporto de Faro.** Não tem ligação ferroviária. Para Portimão, apanhe o comboio na estação de Faro ou veja na Vamus, a rede de autocarros do Algarve, o AeroBus: o passe turístico da Vamus «inclui aerobus para o aeroporto».',
            '**Autocarros Vai e Vem.** Os autocarros urbanos de Portimão têm percursos, horários e carregamento do cartão na plataforma Vamus Algarve.',
          ],
        },
        'Para encontrar a trotinete mais próxima, abra o [mapa de Portimão](map:pt:Portimão) e desbloqueie-a depois na app da Bird.',
      ],
    },
    {
      heading: 'E no resto do Algarve? Faro, Lagos, Lagoa, Albufeira e Olhão',
      blocks: [
        '**Faro.** Em fevereiro de 2025, a Câmara de Faro atribuiu duas licenças em exclusividade, em vigor desde 15 de abril de 2025, por dois anos renováveis até quatro: uma à Lime, com 350 trotinetes e 100 bicicletas, e outra à Bolt, com 350 trotinetes. A página da Bolt para Faro não mostrava trotinetes em outubro de 2026, mas o [mapa de Faro](map:pt:Faro) mostra-as desde 25 de outubro, e as da Lime desde 26.',
        '**Lagos, Lagoa e Albufeira.** Não encontrámos trotinetes partilhadas em outubro de 2026.',
        '**Olhão.** O [mapa de Olhão](map:pt:Olhão) mostrava cerca de 160 trotinetes da Bird às 18h25 de 17 de outubro de 2026.',
      ],
    },
    {
      heading: 'Sabia que…?',
      blocks: [
        {
          list: [
            '**Portimão já teve trotinetes em 2019.** A Circ estreou-as a 10 de julho de 2019, na Praça Manuel Teixeira Gomes: foi a segunda cidade da Circ no Algarve, depois de Faro, e a 11.ª no país.',
            '**Duraram menos de quatro meses.** As 100 trotinetes da Circ saíram no fim de outubro de 2019, quando acabou o período experimental acordado com a Câmara.',
            '**O comboio demorou a passar o Arade.** Com a ponte sobre o rio e a falta de dinheiro pelo meio, a linha até Lagos só abriu a 30 de julho de 1922.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Quanto custa andar de trotinete em Portimão?',
      answer: 'A Bird não publica preços para Portimão: a app mostra o preço no ecrã de desbloqueio, antes de começar. Pelo contrato da Bird, o máximo por dia de calendário é de 100 €.',
    },
    {
      question: 'Posso andar de trotinete na Praia da Rocha?',
      answer: 'Na Avenida Tomás Cabreira, sim, na estrada ou na ciclovia. Junto ao mar, da Praia da Rocha aos Três Castelos e ao Vau, a app da Bird deixa passar, mas não terminar a viagem, e nos passadiços das praias as trotinetes são proibidas, com coima de 55 a 550 €.',
    },
    {
      question: 'Posso andar de trotinete na zona ribeirinha de Portimão?',
      answer: 'Só na ciclovia. As praças pedonais junto ao rio e as ruas pedonais do centro histórico são zonas sem trotinetes na app da Bird, e a Câmara pôs sinais de proibição nas zonas pedonais em 2026.',
    },
    {
      question: 'Há trotinetes em Alvor?',
      answer: 'Sim: a zona da Bird chega a Alvor, mas o centro antigo da vila, à beira-rio, é zona sem trotinetes, e no passadiço são proibidas.',
    },
    {
      question: 'Há trotinetes Bolt ou Lime em Portimão?',
      answer: 'Não encontrámos, em outubro de 2026: em Portimão, as trotinetes partilhadas são da Bird. A Lime e a Bolt têm licenças em Faro desde 2025.',
    },
    {
      question: 'A Câmara de Portimão vai proibir as trotinetes?',
      answer: 'Não há decisão nesse sentido. A 19 de agosto de 2026, a Câmara aprovou o início de um procedimento para criar regras para a micromobilidade partilhada, que, para já, não prevê a proibição.',
    },
  ],
  sources: [
    { title: 'Bird: dados abertos (GBFS) de Portimão', url: 'https://mds.bird.co/gbfs/v2/public/provider/bird/portimao-portugal/gbfs.json' },
    { title: 'Bird: contrato de aluguer em Portugal (8 de dezembro de 2021)', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'Bird: como andar e estacionar', url: 'https://bird.co/pt/how/' },
    { title: 'Postal do Algarve: Portimão avança com regulamentação da micromobilidade partilhada (19 de agosto de 2026)', url: 'https://postal.pt/algarve/portimao-avanca-com-regulamentacao-municipal-da-micromobilidade-partilhada/' },
    { title: 'Barlavento: Portimão inicia processo de regras para trotinetes e bicicletas partilhadas (19 de agosto de 2026)', url: 'https://www.barlavento.pt/portimao-processo-regras-trotinetes-bicicletas-partilhadas/' },
    { title: 'Barlavento: Portimão sinaliza proibição de bicicletas e trotinetes nas zonas pedonais (14 de março de 2026)', url: 'https://www.barlavento.pt/portimao-proibe-bicicletas-trotinetes-zonas-pedonais/' },
    { title: 'Câmara de Portimão: deliberações de 19 de agosto de 2026 (n.º 650/26)', url: 'https://www.cm-portimao.pt/files/1139/2026/7639/Edital---Deliberacoes-da-Reuniao-de-Camara-Ordinaria-de-19-de-agosto-de-2026' },
    { title: 'Câmara de Portimão: regulamentos municipais', url: 'https://www.cm-portimao.pt/doc-regulamentos-municipais' },
    { title: 'Diário da República: Aviso n.º 2549/2024, regulamento das praias de Portimão', url: 'https://diariodarepublica.pt/dr/detalhe/aviso/2549-2024-839799680' },
    { title: 'Câmara de Portimão: projeto-piloto de bicicletas elétricas partilhadas (Deliberação n.º 692/24)', url: 'https://webatas.cm-portimao.pt/pages/deliberacoes.php?id=69871' },
    { title: 'Câmara de Portimão: fase 2 do projeto-piloto (Deliberação n.º 625/25)', url: 'https://webatas.cm-portimao.pt/pages/deliberacoes.php?id=80680' },
    { title: 'Bolt no Algarve: serviços disponíveis', url: 'https://bolt.eu/pt-pt/cities/algarve/' },
    { title: 'Bolt em Faro: serviços disponíveis', url: 'https://bolt.eu/pt-pt/cities/faro/' },
    { title: 'Câmara de Faro: Edital n.º 335/2024, hasta pública das licenças', url: 'https://www.cm-faro.pt/upload_files/client_id_1/website_id_1/EDITAIS%20E%20AVISOS/Editais/hastas_publicas/Hasta_publica_micromobilidade_site_final.pdf' },
    { title: 'Câmara de Faro: Edital n.º 97/2025, adjudicação das licenças', url: 'https://www.cm-faro.pt/upload_files/client_id_1/website_id_1/EDITAIS%20E%20AVISOS/Editais/Deliberacoes%20com%20eficacia%20externa/Edital%20n%C2%BA%2097-2025%20-%20Ef.%20Ext.%20RC-24-02-2025.pdf' },
    { title: 'Barlavento: Faro tem novos operadores licenciados para trotinetes e bicicletas (15 de abril de 2025)', url: 'https://www.barlavento.pt/faro-tem-novos-operadores-licenciados-para-trotinetes-e-bicicletas-partilhadas/' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'Assembleia da República: Projeto de Lei 622/XVII (PSD), capacete', url: 'https://www.parlamento.pt/ActividadeParlamentar/Paginas/DetalheIniciativa.aspx?BID=356782' },
    { title: 'CP: transporte de bicicletas e trotinetas', url: 'https://www.cp.pt/info/w/transporte-bicicletas' },
    { title: 'CP: comboios elétricos na Linha do Algarve (7 de julho de 2026)', url: 'https://www.cp.pt/info/w/nova-oferta-linha-algarve' },
    { title: 'CP: horários da Linha do Algarve desde 19 de julho de 2026', url: 'https://www.cp.pt/info/documents/d/cp/comboios-regionais-vila-real-s-antonio-lagos-19-julho-2026' },
    { title: 'Observador/Lusa: comboios elétricos no Algarve e a ligação ao aeroporto (20 de julho de 2026)', url: 'https://observador.pt/2026/07/20/psd-comboios-eletricos-no-algarve-e-positivo-mas-falta-ligacao-a-aeroporto-e-espanha/' },
    { title: 'Câmara de Portimão: Vai e Vem', url: 'https://www.cm-portimao.pt/menus/servicos/vai-e-vem' },
    { title: 'Vamus: passe turístico e AeroBus', url: 'https://vamus.pt/' },
    { title: 'CP: a Linha do Algarve', url: 'https://www.cp.pt/info/w/the-algarve-line' },
    { title: 'Barlavento: as trotinetes da Circ chegam a Portimão (9 de julho de 2019)', url: 'https://www.barlavento.pt/trotinetes-eletricas-da-circ-estao-a-chegar-a-portimao/' },
    { title: 'Postal do Algarve/Lusa: já não há trotinetes elétricas no Algarve (20 de novembro de 2019)', url: 'https://postal.pt/nacional/ja-nao-ha-trotinetes-eletricas-no-algarve/' },
  ],
};

export default guide;
