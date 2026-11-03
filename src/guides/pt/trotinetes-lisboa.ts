import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-lisboa',
  topic: 'lisbon',
  name: 'Trotinetes partilhadas em Lisboa',
  title: 'Trotinetes em Lisboa 2026: regras, hotspots e suspensão',
  description: 'Trotinetes em Lisboa: Bolt, Lime e Bird, as zonas proibidas, os hotspots, o passe Navegante e a suspensão aprovada pela Câmara em outubro de 2026.',
  headline: 'Trotinetes em Lisboa: operadores, zonas proibidas, hotspots e o fim anunciado',
  lede: 'As trotinetes em Lisboa alugam-se nas apps da Bolt, da Lime e da Bird; a idade mínima e o preço, a app mostra-os antes de desbloquear. As regras vêm de um acordo entre a Câmara e os operadores: nada de vias BUS, jardins ou zonas pedonais, e a viagem só termina num hotspot, um local de estacionamento autorizado. Quem vive em Lisboa e tem o passe Navegante tem até 200 minutos grátis por mês, no máximo 10 por viagem. A 21 de outubro de 2026, a Câmara aprovou o fim das trotinetes partilhadas: depois da notificação definitiva, prevista para novembro, os operadores terão 60 dias para as retirar.',
  published: '2026-10-13',
  updated: '2026-10-26',
  city: 'pt:Lisboa',
  sections: [
    {
      heading: 'Trotinetes partilhadas em Lisboa: Bolt, Lime e Bird',
      blocks: [
        'Em outubro de 2026, há três operadores de trotinetes partilhadas em Lisboa: a **Bolt**, a **Lime** e a **Bird**.',
        'Lisboa não tem um regulamento para as trotinetes partilhadas: as regras vêm de um acordo de colaboração entre a Câmara e os operadores, de 2023, reforçado em 2025 com novas restrições de circulação e estacionamento.',
        'Segundo o vice-presidente da Câmara, Gonçalo Reis, a cidade chegou a ter 15 mil trotinetes partilhadas, reduzidas para cerca de cinco mil (outubro de 2026). Às 23h03 de 30 de outubro de 2026, o [mapa de Lisboa](map:pt:Lisboa) mostrava cerca de 3100 trotinetes da Bolt, 2300 da Lime e 1400 da Bird livres naquele momento.',
        'A idade mínima e o preço, a app mostra-os antes de desbloquear. Se nunca alugou uma trotinete, veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Trotinetes grátis com o passe Navegante: como funciona',
      blocks: [
        'Desde novembro de 2025, quem tem mais de 18 anos, residência fiscal em Lisboa e um passe Navegante válido tem até 66 minutos grátis por mês em cada operador, 200 no total. Só contam os primeiros 10 minutos de cada viagem: o resto paga-se ao preço do operador.',
        'O benefício ativa-se em cada uma das apps.',
        'Turistas e residentes noutros concelhos não têm direito.',
      ],
    },
    {
      heading: 'Onde é proibido andar de trotinete em Lisboa',
      blocks: [
        'Circule pela ciclovia sempre que exista ou, se não houver, pela faixa de rodagem, junto à direita e nunca em contramão. Desde 2025, a Câmara proíbe as trotinetes partilhadas em «zonas críticas», noticiou o Lisboa para Pessoas:',
        {
          list: [
            'nas vias BUS;',
            'nos jardins e nas zonas exclusivamente pedonais;',
            'nos eixos centrais das avenidas principais, como a Avenida da Liberdade e a Avenida D. João II;',
            'junto às estações intermodais, como o Cais do Sodré, Entrecampos, Sete Rios e o Oriente;',
            'à volta dos sítios com muitos peões, como o Terreiro do Paço, o Rossio, o Castelo, o Parque Eduardo VII, o Jardim da Estrela e o Campo Pequeno.',
          ],
        },
        'A Câmara prometeu controlar estas zonas por georreferenciação e reforçar a fiscalização.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete em Lisboa: só nos hotspots',
      blocks: [
        'A viagem só pode terminar num hotspot, um local de estacionamento identificado e georreferenciado: fora destes pontos, não é possível terminar a viagem.',
      ],
    },
    {
      heading: 'Código da Estrada: as regras essenciais para trotinetes',
      blocks: [
        'A lei trata uma trotinete elétrica até 0,25 kW e 25 km/h como uma bicicleta: não é necessária carta de condução, e o seguro não é obrigatório.',
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
            '**Colinas e calçada.** As subidas fazem-se devagar, e a calçada portuguesa escorrega com a chuva: abrande nas ruas empedradas da Baixa e dos bairros históricos.',
            '**Carris do elétrico.** Atravesse os carris do 28 e das outras linhas o mais perpendicularmente possível: as rodas pequenas prendem-se na calha.',
            '**Barco para Cacilhas.** Nos barcos da TTSL só embarcam trotinetes que possam ir como bagagem de mão: uma partilhada não pode. Termine a viagem perto do Cais do Sodré, atravesse até Cacilhas e procure uma trotinete no [mapa de Almada](map:pt:Almada). As pontes 25 de Abril e Vasco da Gama são autoestradas e estão vedadas às trotinetes.',
            '**Metro e comboio.** O Metro e os comboios urbanos da CP levam trotinetes a bordo, mas a viagem numa trotinete partilhada só pode terminar num hotspot: termine-a perto da estação e entre a pé.',
            '**Fora de Lisboa.** Veja os guias de [Oeiras](guide:oeiras), de [Cascais](guide:cascais) e das [trotinetes no Porto](guide:porto): o acordo de Lisboa e os minutos do Navegante não se aplicam fora da cidade.',
          ],
        },
      ],
    },
    {
      heading: 'As trotinetes partilhadas vão acabar em Lisboa?',
      blocks: [
        'Sim, se nada mudar. A 21 de outubro de 2026, a Câmara aprovou a resolução unilateral, «por razões de interesse público», do acordo de 2023 com os operadores, e a proibição da circulação e do estacionamento das trotinetes partilhadas em todo o concelho. Seguiu-se uma audiência prévia de 10 dias para os operadores responderem por escrito; sem resposta, a deliberação torna-se definitiva. Após a notificação definitiva, que o vice-presidente Gonçalo Reis previa para novembro, terão 60 dias para retirar todas as trotinetes; depois, a Câmara pode removê-las e cobrar-lhes os custos.',
        'A Câmara invoca o aumento das reclamações e das ocorrências, como a circulação em contramão e nos passeios, apesar de haver menos trotinetes.',
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
      answer: 'Provavelmente não está num hotspot: fora destes locais identificados, a viagem não termina. Vá até ao hotspot mais próximo e tente de novo.',
    },
    {
      question: 'As trotinetes podem andar no passeio?',
      answer: 'Não: o Código da Estrada só o permite a crianças até 10 anos, e a coima é de 30 a 150 €. Em Lisboa, as trotinetes partilhadas também não podem andar em jardins nem em zonas pedonais.',
    },
    {
      question: 'É obrigatório usar capacete na trotinete elétrica?',
      answer: 'Ainda não (31 de outubro de 2026), mas é muito recomendado. Dois projetos de lei que o tornariam obrigatório, com coima prevista de 30 a 150 €, foram aprovados na generalidade a 30 de setembro de 2026, mas faltam a especialidade e a votação final global.',
    },
  ],
  sources: [
    { title: 'Lisboa para Pessoas: viagens gratuitas de trotinete com o Navegante, 26 de novembro de 2025', url: 'https://lisboaparapessoas.pt/2025/11/26/lisboa-trotinetas-navegante-viagens-gratuitas/' },
    { title: 'TTSL: utilização do transporte fluvial', url: 'https://ttsl.pt/passageiros/utilizacao-do-transporte-fluvial/' },
    { title: 'Assembleia da República: Projeto de Lei 622/XVII (PSD), capacete obrigatório', url: 'https://www.parlamento.pt/ActividadeParlamentar/Paginas/DetalheIniciativa.aspx?BID=356782' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'ACP: referendo às trotinetes partilhadas em Lisboa', url: 'https://trotinetessimounao.acp.pt' },
    { title: 'RTP: «Não prevemos regresso». Câmara espera já não ter trotinetas em Lisboa em janeiro de 2027', url: 'https://www.rtp.pt/noticias/pais/nao-prevemos-regresso-camara-espera-ja-nao-ter-trotinetas-em-lisboa-em-janeiro-de-2027_n1772050' },
    { title: 'Metropolitano de Lisboa: como utilizar o metro', url: 'https://www.metrolisboa.pt/viajar/como-utilizar-o-metro/' },
    { title: 'CP: bicicletas e trotinetes nos comboios (em inglês)', url: 'https://www.cp.pt/info/w/bikes-and-scooters' },
    { title: 'Observador: Câmara de Lisboa aprova suspensão das trotinetes partilhadas, 21 de outubro de 2026', url: 'https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/' },
    { title: 'Jornal Económico: «Queremos as trotinetes removidas até ao final de janeiro», afirma Gonçalo Reis, 16 de outubro de 2026', url: 'https://jornaleconomico.sapo.pt/noticias/queremos-as-trotinetes-removidas-ate-ao-final-de-janeiro-afirma-goncalo-reis-que-garante-que-nao-havera-indemnizacoes/' },
    { title: 'DN/Lusa: ACP satisfeito com suspensão de trotinetes partilhadas em Lisboa, 19 de outubro de 2026', url: 'https://www.dn.pt/local-geral/acp-satisfeito-com-suspenso-de-trotinetes-partilhadas-em-lisboa' },
  ],
};

export default guide;
