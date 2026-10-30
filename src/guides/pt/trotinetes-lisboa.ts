import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-lisboa',
  topic: 'lisbon',
  name: 'Trotinetes partilhadas em Lisboa',
  title: 'Trotinetes em Lisboa 2026: regras, preços e minutos grátis',
  description: 'Trotinetes em Lisboa: Bolt, Lime e Bird, o limite de 20 km/h, as zonas proibidas, os hotspots e como ter minutos grátis com o passe Navegante.',
  headline: 'Trotinetes em Lisboa: operadores, zonas proibidas, hotspots e minutos grátis com o Navegante',
  lede: 'As trotinetes em Lisboa alugam-se nas apps da Bolt, da Lime e da Bird, que mostram o preço antes de desbloquear: nenhuma publica uma tarifa para a cidade. As regras vêm de um acordo entre a Câmara e os operadores: 20 km/h no máximo, nada de passeios, vias BUS, jardins ou praças, e a viagem só termina num hotspot, um local de estacionamento autorizado. Quem vive em Lisboa e tem o passe Navegante mensal tem até 200 minutos grátis por mês, no máximo 10 por viagem. A 21 de outubro de 2026, a Câmara aprovou o fim das trotinetes partilhadas: os operadores têm 60 dias para as retirar.',
  published: '2026-10-13',
  updated: '2026-10-26',
  city: 'pt:Lisboa',
  sections: [
    {
      heading: 'Trotinetes partilhadas em Lisboa: Bolt, Lime e Bird',
      blocks: [
        'Em outubro de 2026, há três operadores de trotinetes partilhadas em Lisboa: a **Bolt**, a **Lime** e a **Bird**. A Lime também aluga bicicletas elétricas.',
        'Lisboa não tem um regulamento para as trotinetas partilhadas: as regras vêm de um acordo de colaboração entre a Câmara e os operadores, de 9 de janeiro de 2023, alterado por uma adenda a 23 de junho de 2025. O acordo fixa também um limite sazonal por operador: até 1750 veículos de 1 de abril a 31 de outubro e até 1500 de 1 de novembro a 31 de março.',
        'Segundo o vice-presidente da Câmara, Gonçalo Reis, a cidade passou de 15 mil trotinetes para cerca de cinco mil (abril de 2026). Às 4h27 de 30 de outubro de 2026, o [mapa de Lisboa](map:pt:Lisboa) mostrava cerca de 3200 trotinetes da Bolt, 2400 da Lime e 1400 da Bird livres naquele momento, não a frota inteira.',
      ],
    },
    {
      heading: 'Quanto custa andar de trotinete em Lisboa?',
      blocks: [
        'Nenhum dos três operadores publica as tarifas de Lisboa, nem no site nem nos dados abertos, por isso o mapa não consegue estimar o preço aqui. A app mostra-o antes de desbloquear.',
        {
          table: {
            caption: 'Preços das trotinetes em Lisboa publicados pelos operadores (13 de outubro de 2026)',
            head: ['Operador', 'Desbloqueio', 'Por minuto', 'Passes', 'No mapa a 30 de outubro'],
            rows: [
              ['Bolt', 'Um pequeno valor, não indicado', 'A partir de 0,15 € (tarifa da Bolt para Portugal, não de Lisboa)', 'Desbloqueios ilimitados a partir de 0,99 € por mês; passes semanais e mensais', 'Cerca de 3200'],
              ['Lime', 'Na app', 'Na app', 'Não publicados', 'Cerca de 2400'],
              ['Bird', 'Na app', 'Na app', 'Não publicados', 'Cerca de 1400'],
            ],
          },
        },
        'A certas horas, a Bolt pode pedir um teste de reação antes de desbloquear. Os preços de guias antigos estão muitas vezes desatualizados. Se nunca alugou uma trotinete, veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Trotinetes grátis com o passe Navegante: como funciona',
      blocks: [
        'Desde 2025, quem tem 18 anos ou mais, morada fiscal em Lisboa e o passe Navegante mensal recebe até 66 minutos grátis por mês em cada operador, 200 no total entre a Bird, a Bolt e a Lime. Só contam os primeiros 10 minutos de cada viagem: o resto paga-se ao preço do operador.',
        'O benefício ativa-se em cada app:',
        {
          list: [
            '**Bird:** toque no aviso «Viagens Grátis com Navegante» e indique o número do cartão Navegante e o NIF com que comprou o passe.',
            '**Bolt:** em «2 rodas», abra «Ferramentas de Segurança» e depois «Passe Navegante».',
            '**Lime:** registe-se em [navegante.li.me](https://navegante.li.me/).',
          ],
        },
        'Os minutos só valem em Lisboa: na Bird, uma viagem que comece ou termine fora da cidade é paga. Turistas e residentes noutros concelhos não têm direito.',
      ],
    },
    {
      heading: 'Onde é proibido andar de trotinete em Lisboa',
      blocks: [
        'As trotinetes partilhadas estão limitadas a **20 km/h**, abaixo dos 25 km/h que a lei admite para uma trotinete. Circule pela ciclovia sempre que exista ou, se não houver, pela faixa de rodagem, junto à direita e nunca em contramão. O acordo e a adenda de 2025 proíbem as trotinetes partilhadas:',
        {
          list: [
            'nos passeios, ruas pedonais, praças, jardins e parques, salvo onde houver sinalização a permiti-lo;',
            'nas vias BUS;',
            'nas vias de segundo nível do Plano Diretor Municipal, como o eixo central da Avenida da Liberdade;',
            'nas zonas envolventes de monumentos e praças;',
            'em túneis, viadutos e pontes rodoviárias.',
          ],
        },
        'A imprensa apontou como zonas proibidas o Terreiro do Paço, o Rossio, o Castelo, o Parque Eduardo VII, o Jardim da Estrela, o Campo Pequeno e a Praça do Império, em Belém, bem como o eixo central da Avenida D. João II e as zonas das estações do Cais do Sodré, Entrecampos, Sete Rios e Oriente.',
        'As restrições são aplicadas por georreferenciação: nestas zonas, a app impede andar ou terminar a viagem. O mapa de cada app mostra as zonas.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete em Lisboa: só nos hotspots',
      blocks: [
        'A viagem só pode terminar num hotspot, um local de estacionamento autorizado assinalado na app. A Bird, sozinha, listava 1754 nos seus dados abertos a 13 de outubro de 2026. É proibido estacionar junto às entradas do Metro, em paragens de transportes públicos, praças de táxis, passadeiras e passeios.',
        'A Polícia Municipal e a EMEL podem remover as trotinetes mal estacionadas: em 2025, a Polícia Municipal removeu 5505 trotinetes e bicicletas, cerca de 15 por dia. A remoção é paga pelo operador, mas a Bird passa ao utilizador as coimas e as taxas de remoção, e o acordo obriga os operadores a prever penalizações nos seus termos.',
        'Nas estações grandes, termine a viagem num hotspot fora da zona da estação e faça o resto a pé.',
      ],
    },
    {
      heading: 'Código da Estrada: as regras essenciais para trotinetes',
      blocks: [
        'A lei trata uma trotinete elétrica até 0,25 kW e 25 km/h como uma bicicleta: não é necessária carta de condução, a lei não fixa idade mínima (os operadores exigem 18 anos) e o seguro não é obrigatório.',
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
              ['Capacete', 'Não é obrigatório, mas é muito recomendado', 'Nenhuma por agora; 30 a 150 € nos projetos de lei'],
            ],
          },
        },
        'O capacete foi obrigatório de 2014 a janeiro de 2021. Dois projetos de lei, do PSD e do PS, que o tornariam de novo obrigatório foram aprovados na generalidade a 30 de setembro de 2026, mas ainda não são lei. Todas as regras estão no guia das [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Colinas, carris, aeroporto, barco e comboio: dicas para Lisboa',
      blocks: [
        {
          list: [
            '**Colinas e calçada.** A 20 km/h, as subidas fazem-se devagar, e a calçada portuguesa escorrega com a chuva: abrande nas ruas empedradas da Baixa e dos bairros históricos.',
            '**Carris do elétrico.** Atravesse os carris do 28 e das outras linhas o mais perpendicularmente possível: as rodas pequenas prendem-se na calha.',
            '**Aeroporto.** A Bird tem hotspots junto ao Terminal 1, na Rua Interior ao Aeroporto da Portela; a 13 de outubro de 2026 não tinha nenhum junto ao Terminal 2.',
            '**Barco para Cacilhas.** Nos barcos da TTSL só embarcam trotinetes dobráveis, como bagagem de mão, por isso uma partilhada não pode ir. Termine a viagem perto do Cais do Sodré, atravesse até Cacilhas e procure uma Lime ou uma Bird no [mapa de Almada](map:pt:Almada). As pontes 25 de Abril e Vasco da Gama são autoestradas e estão vedadas às trotinetes.',
            '**Metro e comboio.** O Metro e os comboios urbanos da CP levam trotinetes a bordo, mas a viagem numa trotinete partilhada só pode terminar num hotspot: termine-a perto da estação e entre a pé.',
            '**Fora de Lisboa.** A Bird também opera em [Oeiras](guide:oeiras) e em [Cascais](guide:cascais), e a Bolt e a Lime (desde 2024) em Oeiras, todas no mapa. O acordo de Lisboa e os minutos do Navegante não se aplicam lá. Para o Porto, veja o guia das [trotinetes no Porto](guide:porto).',
          ],
        },
      ],
    },
    {
      heading: 'Gira: a alternativa às trotinetes',
      blocks: [
        'A Gira, da EMEL, tem mais de 200 estações e mais de 2000 bicicletas, na maioria elétricas. Funciona das 06h00 às 02h00, e as bicicletas levantam-se e entregam-se nas estações.',
        {
          table: {
            caption: 'Passes e preços da Gira (13 de outubro de 2026)',
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
        'Sim, se nada mudar. A 21 de outubro de 2026, a Câmara aprovou a resolução unilateral, «por razões de interesse público», do acordo de 2023 com os operadores, e a proibição da circulação e do estacionamento das trotinetes partilhadas em todo o concelho. Os operadores têm 60 dias para retirar todas as trotinetes; depois, a Câmara pode removê-las e cobrar-lhes os custos.',
        'Antes disso, os operadores têm 10 dias para responder por escrito; sem resposta, a deliberação torna-se definitiva. A Câmara invoca o aumento das reclamações e das ocorrências, como a circulação em contramão e nos passeios, apesar de haver menos trotinetes.',
        'A Câmara promete também mais estações e bicicletas na rede Gira e um projeto de Regulamento Municipal para a Mobilidade Suave no prazo de um ano. Não é uma medida provisória: «É uma suspensão em que não prevemos o regresso das trotinetas», disse o vice-presidente Gonçalo Reis à RTP Antena 1 em outubro de 2026. Até serem retiradas, as apps funcionam como antes, e o [mapa de Lisboa](map:pt:Lisboa) mostra as trotinetes da Bolt, da Lime e da Bird enquanto estiverem na rua.',
        'Em agosto de 2026, o Automóvel Club de Portugal (ACP) tinha lançado uma petição para um referendo local com a mesma pergunta: se a Câmara deve deixar de autorizar as trotinetes partilhadas.',
      ],
    },
  ],
  faq: [
    {
      question: 'Até quando há trotinetes partilhadas em Lisboa?',
      answer: 'Até ao fim de 2026, previsivelmente. A Câmara aprovou a 21 de outubro de 2026 a suspensão das trotinetes partilhadas, e os operadores têm 60 dias para as retirar. Até lá, alugam-se nas apps da Bolt, da Lime e da Bird, como antes.',
    },
    {
      question: 'Porque é que a app não me deixa terminar a viagem?',
      answer: 'Provavelmente não está num hotspot, ou está numa zona onde é proibido estacionar, como um jardim, uma praça ou a zona de uma estação. Abra o mapa da app, vá até ao hotspot mais próximo e tente de novo.',
    },
    {
      question: 'As trotinetes podem andar no passeio?',
      answer: 'Não: o Código da Estrada só o permite a crianças até 10 anos, e a coima é de 30 a 150 €. Em Lisboa, as trotinetes partilhadas também não podem andar em ruas pedonais nem em praças.',
    },
    {
      question: 'É obrigatório usar capacete na trotinete elétrica?',
      answer: 'Ainda não (outubro de 2026), mas é muito recomendado. Dois projetos de lei que o tornariam obrigatório, com coima prevista de 30 a 150 €, foram aprovados na generalidade a 30 de setembro de 2026, mas falta a votação final.',
    },
    {
      question: 'Quanto custa uma trotinete da Bolt em Lisboa?',
      answer: 'A Bolt anuncia minutos a partir de 0,15 € em Portugal, mais um pequeno valor pelo desbloqueio. Não publica uma tarifa própria para Lisboa: o preço aparece na app antes de desbloquear.',
    },
  ],
  sources: [
    { title: 'Câmara Municipal de Lisboa: Acordo de Colaboração com os operadores de trotinetes, 9 de janeiro de 2023 (PDF)', url: 'https://www.lisboa.pt/fileadmin/atualidade/noticias/user_upload/Acordo_de_Colaborac__a__o_OperdoresTrot_09_01_23.pdf' },
    { title: 'Câmara Municipal de Lisboa: Circulação de trotinetas com novas regras em Lisboa, 23 de junho de 2025', url: 'https://informacao.lisboa.pt/noticias/detalhe/circulacao-de-trotinetas-com-novas-regras-em-lisboa' },
    { title: 'Bird: benefício do passe Navegante em Lisboa', url: 'https://help.bird.co/hc/pt/articles/48029756932116' },
    { title: 'Lisboa para Pessoas: viagens gratuitas de trotinete com o Navegante, 26 de novembro de 2025', url: 'https://lisboaparapessoas.pt/2025/11/26/lisboa-trotinetas-navegante-viagens-gratuitas/' },
    { title: 'Bolt: aluguer de trotinetes em Portugal', url: 'https://bolt.eu/pt-pt/scooters/' },
    { title: 'Gira: passes e tarifários', url: 'https://www.gira-bicicletasdelisboa.pt/passes-e-tarifarios/' },
    { title: 'TTSL: utilização do transporte fluvial', url: 'https://ttsl.pt/passageiros/utilizacao-do-transporte-fluvial/' },
    { title: 'Assembleia da República: Projeto de Lei 622/XVII (PSD), capacete obrigatório', url: 'https://www.parlamento.pt/ActividadeParlamentar/Paginas/DetalheIniciativa.aspx?BID=356782' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'ACP: referendo às trotinetes partilhadas em Lisboa', url: 'https://trotinetessimounao.acp.pt' },
    { title: 'RTP: «Não prevemos regresso». Câmara espera já não ter trotinetas em Lisboa em janeiro de 2027', url: 'https://www.rtp.pt/noticias/pais/nao-prevemos-regresso-camara-espera-ja-nao-ter-trotinetas-em-lisboa-em-janeiro-de-2027_n1772050' },
    { title: 'Metropolitano de Lisboa: como utilizar o metro', url: 'https://www.metrolisboa.pt/viajar/como-utilizar-o-metro/' },
    { title: 'CP: bicicletas e trotinetes nos comboios (em inglês)', url: 'https://www.cp.pt/info/w/bikes-and-scooters' },
    { title: 'Observador: Câmara de Lisboa aprova suspensão das trotinetes partilhadas, 21 de outubro de 2026', url: 'https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/' },
  ],
};

export default guide;
