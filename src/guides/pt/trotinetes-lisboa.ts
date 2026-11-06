import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-lisboa',
  topic: 'lisbon',
  name: 'Trotinetes partilhadas em Lisboa',
  title: 'Trotinetes em Lisboa 2026: preços, Navegante e suspensão',
  description: 'Trotinetes em Lisboa: Bolt, Lime e Bird, a Bolt desde 0,15 €/min, 200 minutos grátis por mês para residentes com Navegante, 20 km/h, hotspots e a suspensão.',
  headline: 'Trotinetes em Lisboa: operadores, preços, minutos grátis com o Navegante, zonas proibidas, hotspots e o fim anunciado',
  lede: 'As trotinetes em Lisboa alugam-se nas apps da Bolt, da Lime e da Bird. Em novembro de 2026, a Bolt cobra a partir de 0,15 € por minuto em Portugal, mais um pequeno valor pelo desbloqueio; a Lime e a Bird mostram o preço na app antes de desbloquear. Quem vive em Lisboa e tem o passe Navegante tem até 200 minutos grátis por mês, no máximo 10 por viagem. As regras vêm de um acordo entre a Câmara e os operadores: 20 km/h no máximo, nada de passeios, vias BUS, jardins ou praças, e a viagem só termina num hotspot, um local de estacionamento autorizado. A 21 de outubro de 2026, a Câmara aprovou o fim das trotinetes partilhadas: depois da notificação definitiva, prevista para novembro, os operadores terão 60 dias para as retirar.',
  published: '2026-10-13',
  updated: '2026-10-26',
  city: 'pt:Lisboa',
  sections: [
    {
      heading: 'Trotinetes partilhadas em Lisboa: Bolt, Lime e Bird',
      blocks: [
        'Em novembro de 2026, há três operadores de trotinetes partilhadas em Lisboa: a **Bolt**, a **Lime** e a **Bird**.',
        'Lisboa não tem um regulamento para as trotinetes partilhadas: as regras vêm de um acordo de colaboração entre a Câmara e os operadores, de 9 de janeiro de 2023, reforçado em 2025 com novas restrições de circulação e estacionamento. O acordo fixa também um limite sazonal por operador: até 1750 veículos de 1 de abril a 31 de outubro e até 1500 de 1 de novembro a 31 de março, números que a Câmara pode rever.',
        'Segundo o vice-presidente da Câmara, Gonçalo Reis, a cidade chegou a ter 15 mil trotinetes partilhadas, reduzidas para cerca de cinco mil (outubro de 2026). Às 23h03 de 30 de outubro de 2026, o [mapa de Lisboa](map:pt:Lisboa) mostrava cerca de 3100 trotinetes da Bolt, 2300 da Lime e 1400 da Bird livres naquele momento. Só as livres da Bolt e da Lime já passavam o limite de inverno, 1500 por operador; as da Bird ficavam abaixo.',
      ],
    },
    {
      heading: 'Quanto custa andar de trotinete em Lisboa?',
      blocks: [
        'Paga um valor pelo desbloqueio e um preço por minuto, que a app mostra antes de desbloquear.',
        {
          table: {
            caption: 'Preços das trotinetes em Lisboa publicados pelos operadores, em novembro de 2026',
            head: ['Operador', 'Desbloqueio', 'Por minuto', 'Passes', 'No mapa a 30 de outubro'],
            rows: [
              ['Bolt', 'Um pequeno valor, indicado na app', 'A partir de 0,15 € (tarifa da Bolt para Portugal, que pode variar com o local)', 'Desbloqueios ilimitados a partir de 0,99 € por mês; passes semanais e mensais', 'Cerca de 3100'],
              ['Lime', 'Na app', 'Na app', 'Na app', 'Cerca de 2300'],
              ['Bird', 'Na app', 'Na app; conta cada minuto iniciado', 'Na app', 'Cerca de 1400'],
            ],
          },
        },
        'A Bolt limita as cinco primeiras viagens a 15 km/h e, a certas horas, pode pedir um teste de reação antes de desbloquear. Se nunca alugou uma trotinete, veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Trotinetes grátis com o passe Navegante: como funciona',
      blocks: [
        'Desde novembro de 2025, quem tem mais de 18 anos, residência fiscal em Lisboa e um passe Navegante válido tem até 66 minutos grátis por mês em cada operador, 200 no total. Só contam os primeiros 10 minutos de cada viagem: o resto paga-se ao preço do operador.',
        'O benefício ativa-se em cada app:',
        {
          list: [
            '**Bird:** toque no aviso «Viagens Grátis com Navegante», no fundo da página inicial, e indique o número do cartão Navegante e o NIF.',
            '**Bolt:** em «2 rodas», abra «Ferramentas de Segurança» e depois «Passe Navegante».',
            '**Lime:** registe-se em [navegante.li.me](https://navegante.li.me/).',
          ],
        },
        'Turistas e residentes noutros concelhos não têm direito.',
      ],
    },
    {
      heading: 'Onde é proibido andar de trotinete em Lisboa',
      blocks: [
        'As trotinetes partilhadas estão limitadas a **20 km/h**, abaixo dos 25 km/h que a lei admite para uma trotinete. Circule pela ciclovia sempre que exista ou, se não houver, pela faixa de rodagem, junto à direita e nunca em contramão. O acordo de 2023 e as «zonas críticas» que a Câmara juntou em 2025, noticiadas pelo Lisboa para Pessoas, proíbem as trotinetes partilhadas:',
        {
          list: [
            'nos passeios, ruas pedonais, praças, jardins e parques, salvo onde houver sinalização a permiti-lo;',
            'nas vias BUS;',
            'nos eixos centrais das avenidas principais, como a Avenida da Liberdade e a Avenida D. João II;',
            'junto às estações intermodais, como o Cais do Sodré, Entrecampos, Sete Rios e o Oriente;',
            'à volta dos sítios com muitos peões, como o Terreiro do Paço, o Rossio, o Castelo, o Parque Eduardo VII, o Jardim da Estrela e o Campo Pequeno;',
            'em túneis, viadutos e pontes rodoviárias.',
          ],
        },
        'Nestas zonas, o acordo obriga os operadores a cortar a assistência elétrica e a assinalá-las na app, e a Câmara prometeu controlá-las por georreferenciação e reforçar a fiscalização.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete em Lisboa: só nos hotspots',
      blocks: [
        'A viagem só pode terminar num hotspot, um local de estacionamento identificado e georreferenciado: fora destes pontos, não é possível terminar a viagem. A Bird, sozinha, tinha 1753 a 3 de novembro de 2026. O acordo proíbe estacionar nas placas centrais das praças, junto às entradas de monumentos nacionais, nos passeios, nas passadeiras, nos acessos ao Metro, nas paragens de transportes públicos e nas praças de táxis.',
        'A Polícia Municipal e a EMEL podem remover as trotinetes mal estacionadas, e a remoção é paga pelo operador. Mas a Bird e a Bolt passam ao utilizador as coimas e as taxas de apreensão, e o acordo obriga os operadores a prever penalizações nos seus termos.',
      ],
    },
    {
      heading: 'Código da Estrada: as regras essenciais para trotinetes',
      blocks: [
        'A lei trata uma trotinete elétrica até 0,25 kW e 25 km/h como uma bicicleta: não é necessária carta de condução, a lei não fixa idade mínima (a Bird e a Bolt exigem 18 anos) e o seguro não é obrigatório.',
        {
          table: {
            caption: 'Regras e coimas para trotinetes elétricas em Portugal (Código da Estrada, outubro de 2026)',
            head: ['Regra', 'O que fazer', 'Coima'],
            rows: [
              ['Passeio', 'Não circular nele (só crianças até aos 10 anos); levar a trotinete à mão', '30 a 150 €'],
              ['Sentido do trânsito', 'Circular no sentido do trânsito, junto à direita', '125 a 625 € em contramão'],
              ['Telemóvel e auriculares', 'Não usar o telemóvel; no máximo um auricular', '125 a 625 €'],
              ['Álcool', 'Limite de 0,5 g/l, como para os automobilistas; a partir de 1,2 g/l é crime', '125 a 625 € (0,5 a 0,8 g/l); 250 a 1250 € (0,8 a 1,2 g/l)'],
              ['Passageiros', 'Uma só pessoa por trotinete', '60 a 300 €'],
              ['Luzes', 'Acesas do anoitecer ao amanhecer e com pouca visibilidade', '30 a 150 €'],
              ['Capacete', 'Não é obrigatório, mas é muito recomendado', 'Nenhuma por agora; 60 a 300 € no projeto do PSD'],
            ],
          },
        },
        'O capacete foi obrigatório de 2014 a janeiro de 2021. Dois projetos de lei, do PSD e do PS, que o tornariam de novo obrigatório foram aprovados na generalidade a 30 de setembro de 2026 e seguiram para a especialidade, na Comissão de Infraestruturas, Mobilidade e Habitação: ainda não são lei. Todas as regras estão no guia das [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Colinas, carris, aeroporto, barco e comboio: dicas para Lisboa',
      blocks: [
        {
          list: [
            '**Colinas e calçada.** A 20 km/h, as subidas fazem-se devagar, e a calçada portuguesa escorrega com a chuva: abrande nas ruas empedradas da Baixa e dos bairros históricos.',
            '**Carris do elétrico.** Atravesse os carris do 28 e das outras linhas o mais perpendicularmente possível: as rodas pequenas prendem-se na calha.',
            '**Aeroporto.** A 3 de novembro de 2026, a Bird tinha hotspots junto ao Terminal 1, na Alameda das Comunidades Portuguesas e na Rua Interior ao Aeroporto da Portela, e nenhum junto ao Terminal 2.',
            '**Barco para Cacilhas.** Nos barcos da TTSL só embarcam trotinetes que possam ir como bagagem de mão: uma partilhada não pode. Termine a viagem perto do Cais do Sodré, atravesse até Cacilhas e procure uma Lime ou uma Bird no [mapa de Almada](map:pt:Almada). As pontes 25 de Abril e Vasco da Gama são autoestradas e estão vedadas às trotinetes.',
            '**Metro e comboio.** O Metro e os comboios urbanos da CP levam trotinetes a bordo, mas a viagem numa trotinete partilhada só pode terminar num hotspot: termine-a perto da estação e entre a pé.',
            '**Fora de Lisboa.** A Bird também opera em [Oeiras](guide:oeiras) e em [Cascais](guide:cascais), e a Bolt e a Lime (desde 2024) em Oeiras, todas no mapa. O acordo de Lisboa e os minutos do Navegante não se aplicam lá. Para o Porto, veja o guia das [trotinetes no Porto](guide:porto).',
          ],
        },
      ],
    },
    {
      heading: 'Gira: a alternativa às trotinetes',
      blocks: [
        'A Gira, a rede de bicicletas partilhadas da EMEL, tem estações nas 24 freguesias de Lisboa. Funciona todos os dias das 06h00 às 02h00, e as bicicletas levantam-se e entregam-se nas estações. Pode usá-la a partir dos 16 anos.',
        {
          table: {
            caption: 'Passes e preços da Gira, em novembro de 2026',
            head: ['Passe', 'Preço', 'Viagens até 45 min', '45 a 90 min', 'Cada 45 min a mais'],
            rows: [
              ['Passe Diário', '2 € (só MB Way ou cartão de crédito)', 'Grátis', '+2 €', '+2 €'],
              ['Passe Mensal', '15 €', 'Grátis', '+1 €', '+2 €'],
              ['Passe Anual', '25 €', 'Grátis', '+1 €', '+2 €'],
              ['Gira Navegante (residentes em Lisboa, a partir dos 16 anos, com Navegante mensal)', 'Grátis', 'Grátis', '+1 €', '+2 €'],
            ],
          },
        },
        'Com o Navegante, cada viagem de Gira é grátis até 45 minutos, contra 10 nas trotinetes.',
      ],
    },
    {
      heading: 'As trotinetes partilhadas vão acabar em Lisboa?',
      blocks: [
        'Sim, se nada mudar. A 21 de outubro de 2026, a Câmara aprovou a resolução unilateral, «por razões de interesse público», do acordo de 2023 com os operadores, e a proibição da circulação e do estacionamento das trotinetes partilhadas em todo o concelho. Seguiu-se uma audiência prévia de 10 dias para os operadores responderem por escrito; sem resposta, a deliberação torna-se definitiva. Após a notificação definitiva, que o vice-presidente Gonçalo Reis previa para novembro, terão 60 dias para retirar todas as trotinetes; depois, a Câmara pode removê-las e cobrar-lhes os custos.',
        'A Câmara invoca o aumento das reclamações e das ocorrências, como a circulação em contramão e nos passeios, apesar de haver menos trotinetes. A 23 de outubro, a Bolt disse-se disponível para discutir com a Câmara um modelo que mantenha as trotinetes.',
        'A Câmara promete também mais estações e bicicletas na rede Gira e um projeto de Regulamento Municipal para a Mobilidade Suave no prazo de um ano. «É uma suspensão em que não prevemos o regresso das trotinetas», disse Gonçalo Reis à RTP Antena 1 a 16 de outubro de 2026; a Câmara conta que já não haja trotinetes partilhadas no fim de janeiro de 2027. Até serem retiradas, as apps funcionam como antes, e o [mapa de Lisboa](map:pt:Lisboa) mostra-as.',
        'A 19 de outubro de 2026, o Automóvel Club de Portugal (ACP) entregou na Assembleia Municipal cerca de 20 mil assinaturas para um referendo local sobre as trotinetes partilhadas.',
      ],
    },
  ],
  faq: [
    {
      question: 'Até quando há trotinetes partilhadas em Lisboa?',
      answer: 'Previsivelmente até ao fim de janeiro de 2027. A Câmara aprovou a 21 de outubro de 2026 a suspensão das trotinetes partilhadas; depois da notificação definitiva, prevista para novembro, os operadores terão 60 dias para as retirar. Até lá, alugam-se nas apps da Bolt, da Lime e da Bird, como antes.',
    },
    {
      question: 'Porque é que a app não me deixa terminar a viagem?',
      answer: 'Provavelmente não está num hotspot: fora destes locais identificados, a viagem não termina, e é proibido estacionar em passeios, praças, paragens ou acessos ao Metro. Abra o mapa da app, vá até ao hotspot mais próximo e tente de novo.',
    },
    {
      question: 'As trotinetes podem andar no passeio?',
      answer: 'Não: o Código da Estrada só o permite a crianças até 10 anos, e a coima é de 30 a 150 €. Em Lisboa, as trotinetes partilhadas também não podem andar em ruas pedonais, praças nem jardins.',
    },
    {
      question: 'É obrigatório usar capacete na trotinete elétrica?',
      answer: 'Ainda não (novembro de 2026), mas é muito recomendado. Dois projetos de lei que o tornariam obrigatório, do PSD e do PS, foram aprovados na generalidade a 30 de setembro de 2026 e estão na especialidade, na comissão parlamentar: ainda têm de ser votados no Parlamento.',
    },
    {
      question: 'Quanto custa andar de trotinete em Lisboa?',
      answer: 'Em novembro de 2026, a Bolt anuncia minutos a partir de 0,15 € em Portugal, mais um pequeno valor pelo desbloqueio; o preço por minuto pode variar com o local. A Lime e a Bird mostram o seu preço na app antes de desbloquear. A Bolt tem também desbloqueios ilimitados a partir de 0,99 € por mês. Quem reside em Lisboa e tem o passe Navegante não paga os primeiros 10 minutos de cada viagem, até 200 minutos por mês.',
    },
  ],
  sources: [
    { title: 'Câmara Municipal de Lisboa: Acordo de Colaboração com os operadores de trotinetes, 9 de janeiro de 2023 (PDF)', url: 'https://www.lisboa.pt/fileadmin/atualidade/noticias/user_upload/Acordo_de_Colaborac__a__o_OperdoresTrot_09_01_23.pdf' },
    { title: 'Lisboa para Pessoas: viagens gratuitas de trotinete com o Navegante, 26 de novembro de 2025', url: 'https://lisboaparapessoas.pt/2025/11/26/lisboa-trotinetas-navegante-viagens-gratuitas/' },
    { title: 'Lime: minutos grátis para titulares do Navegante mensal', url: 'https://navegante.li.me/' },
    { title: 'Bolt: aluguer de trotinetes em Portugal', url: 'https://bolt.eu/pt-pt/scooters/' },
    { title: 'Bolt: termos dos veículos elétricos em Portugal (15 de setembro de 2024)', url: 'https://bolt.eu/pt-pt/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Bird: contrato de aluguer em Portugal (8 de dezembro de 2021)', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'Bird: hotspots de Lisboa (dados abertos GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/lisbon/station_information.json' },
    { title: 'Echo Boomer: a Lime chega a Oeiras (6 de junho de 2024)', url: 'https://echoboomer.pt/trotinetes-lime-em-oeiras/' },
    { title: 'Gira: passes e tarifários', url: 'https://www.gira-bicicletasdelisboa.pt/passes-e-tarifarios/' },
    { title: 'Gira: perguntas frequentes', url: 'https://www.gira-bicicletasdelisboa.pt/perguntas-frequentes/' },
    { title: 'Gira: sobre a Gira', url: 'https://www.gira-bicicletasdelisboa.pt/sobre-a-gira/' },
    { title: 'TTSL: utilização do transporte fluvial', url: 'https://ttsl.pt/passageiros/utilizacao-do-transporte-fluvial/' },
    { title: '24notícias: condutores de trotinetes são obrigados a usar capacete? Ainda não, mas podem vir a ser, 2 de outubro de 2026', url: 'https://24noticias.sapo.pt/atualidade/artigos/condutores-de-trotinetes-sao-obrigados-a-usar-capacete-ainda-nao-mas-podem-vir-a-ser' },
    { title: 'Diário de Aveiro/Lusa: uso de capacete para quem utiliza trotinete e bicicleta elétrica aprovado na generalidade, 2 de outubro de 2026', url: 'https://www.diarioaveiro.pt/2026/10/02/uso-de-capacete-para-quem-utiliza-trotinete-e-bicicleta-eletrica-aprovado-na-generalidade/' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'ACP: referendo às trotinetes partilhadas em Lisboa', url: 'https://trotinetessimounao.acp.pt' },
    { title: 'RTP: «Não prevemos regresso». Câmara espera já não ter trotinetas em Lisboa em janeiro de 2027', url: 'https://www.rtp.pt/noticias/pais/nao-prevemos-regresso-camara-espera-ja-nao-ter-trotinetas-em-lisboa-em-janeiro-de-2027_n1772050' },
    { title: 'Metropolitano de Lisboa: como utilizar o metro', url: 'https://www.metrolisboa.pt/viajar/como-utilizar-o-metro/' },
    { title: 'CP: bicicletas e trotinetes nos comboios (em inglês)', url: 'https://www.cp.pt/info/w/bikes-and-scooters' },
    { title: 'Observador: Câmara de Lisboa aprova suspensão das trotinetes partilhadas, 21 de outubro de 2026', url: 'https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/' },
    { title: 'Jornal Económico: «Queremos as trotinetes removidas até ao final de janeiro», afirma Gonçalo Reis, 16 de outubro de 2026', url: 'https://jornaleconomico.sapo.pt/noticias/queremos-as-trotinetes-removidas-ate-ao-final-de-janeiro-afirma-goncalo-reis-que-garante-que-nao-havera-indemnizacoes/' },
    { title: 'Jornal Económico: Bolt diz estar disponível para discutir com a autarquia modelo para manter as trotinetes em Lisboa, 23 de outubro de 2026', url: 'https://jornaleconomico.sapo.pt/noticias/bolt-diz-estar-disponivel-para-discutir-com-a-autarquia-modelo-para-manter-as-trotinetes-em-lisboa/' },
    { title: 'DN/Lusa: ACP satisfeito com suspensão de trotinetes partilhadas em Lisboa, 19 de outubro de 2026', url: 'https://www.dn.pt/local-geral/acp-satisfeito-com-suspenso-de-trotinetes-partilhadas-em-lisboa' },
  ],
};

export default guide;
