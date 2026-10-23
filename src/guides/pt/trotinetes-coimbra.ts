import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-coimbra',
  topic: 'coimbra',
  name: 'Trotinetes em Coimbra',
  title: 'Trotinetes em Coimbra 2026: Bird, Bolt e onde estacionar',
  description: 'Trotinetes em Coimbra: a Bird e a Bolt, os hotspots onde a viagem acaba, a Baixa e a Alta, Coimbra-B e o metrobus, e o que a Câmara prepara em 2026.',
  headline: 'Trotinetes em Coimbra: Bird e Bolt, onde andar, onde estacionar e o que a Câmara prepara',
  lede: 'As trotinetes partilhadas em Coimbra são da Bird e da Bolt, em outubro de 2026, e nenhuma das duas publica preços para a cidade: a app mostra-os antes de desbloquear. Pelo acordo com a Câmara, há zonas onde a viagem só termina num hotspot indicado na app, e nos dados da Bird é o caso de todo o centro. A Bird não deixa andar nas ruas pedonais da Baixa, na Ponte Rainha Santa Isabel nem à volta da estação de Coimbra-B. A Câmara prepara uma concessão com regras novas, ainda sem data.',
  published: '2026-10-17',
  updated: '2026-10-23',
  city: 'pt:Coimbra',
  sections: [
    {
      heading: 'Que trotinetes partilhadas há em Coimbra?',
      blocks: [
        'Em outubro de 2026, alugam trotinetes em Coimbra a **Bird** e a **Bolt**, que tem também bicicletas elétricas na mesma app.',
        {
          table: {
            caption: 'Trotinetes partilhadas em Coimbra: quem as aluga e a que preço (17 de outubro de 2026)',
            head: ['Quem', 'Em Coimbra', 'Preço publicado', 'No nosso mapa'],
            rows: [
              ['Bird', 'Trotinetes', 'Nenhum: veja na app', 'Sim: cerca de 450 trotinetes'],
              ['Bolt', 'Trotinetes e bicicletas elétricas', 'Em Portugal, «a partir de 0,15 € por minuto»; o de Coimbra, na app', 'Não: sem dados abertos'],
            ],
          },
        },
        'O ScootRadar mostra as trotinetes da Bird, com a bateria de cada uma: cerca de 450 no [mapa de Coimbra](map:pt:Coimbra) na madrugada de 17 de outubro de 2026. São as que estavam paradas e livres, não a frota da Bird. A Bolt não publica dados abertos em Portugal e não aparece no mapa: abra também a app da Bolt.',
        'A Bolt diz que o preço por minuto «pode variar consoante a tua localização» e vende passes de desbloqueios ilimitados a partir de 0,99 € por mês. A certas horas, a app da Bolt pode pedir um teste de reação antes de desbloquear. A Bird só aluga a maiores de 18 anos. Nunca alugou uma? Veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'As regras da Câmara de Coimbra e a concessão que vem aí',
      blocks: [
        'Coimbra não tem regulamento municipal para as trotinetes. A Bolt e a Bird operam ao abrigo de acordos de colaboração com a Câmara, celebrados em 2024, cuja minuta foi discutida na reunião do executivo de 18 de março desse ano. O acordo obriga a estacionar em pontos identificados, os hotspots, e divide a cidade em zonas **preta**, **vermelha** e **azul**, mas não encontrámos publicados nem o texto do acordo nem o mapa das zonas.',
        'Os hotspots aparecem na app e podem não ter marca no chão: em 2024, a Câmara previa criar 112, além de 128 novos parqueamentos para bicicletas e trotinetes. Em agosto de 2026, a associação Coimbr’a Pedal perguntava se os 213 lugares de estacionamento previstos chegaram a ser criados.',
        'A 24 de agosto de 2026, a presidente da Câmara, Ana Abrunhosa, disse ter preparado um processo de concessão «com novas regras», com um regulamento em preparação, e que, neste momento, a cidade «não tem condições» para trotinetes partilhadas. Com a concessão, as empresas deixariam de estar na cidade de graça, e o que pagassem iria para infraestruturas como o estacionamento.',
        'Uma petição online, com cerca de 660 assinaturas no fim de agosto, pede o fim das trotinetes e bicicletas partilhadas sem doca. A vereadora da oposição Ana Bastos defende antes regras mais rigorosas, coimas e mais zonas onde a trotinete tem de ficar «obrigatoriamente em doca». Até 17 de outubro de 2026, não encontrámos a concessão lançada nem o regulamento publicado.',
      ],
    },
    {
      heading: 'Onde pode andar de trotinete em Coimbra: Baixa, Alta e Mondego',
      blocks: [
        'Nos dados abertos da Bird de 17 de outubro de 2026, os sítios mais procurados ficam assim (a app tem sempre a última palavra):',
        {
          table: {
            caption: 'De trotinete Bird em Coimbra: onde andar e onde terminar a viagem (17 de outubro de 2026)',
            head: ['Sítio', 'Andar', 'Terminar a viagem'],
            rows: [
              ['Baixa pedonal: Ferreira Borges, Visconde da Luz, Praça do Comércio, Rua Direita', 'Não: leve-a à mão', 'Não'],
              ['Alta e Universidade: Pólo I, Pátio das Escolas, Sé Velha', 'Só nas ruas abertas ao trânsito', 'Não'],
              ['Ponte Rainha Santa Isabel', 'Não', 'Não'],
              ['Coimbra-B: estação e Praça Europa', 'Não', 'Veja na app'],
              ['Parque Verde, Choupalinho, Parque Manuel Braga e Ponte Pedro e Inês', 'Na ciclovia', 'Não'],
              ['Jardim Botânico, Jardim da Sereia, Penedo da Saudade, Quinta de São Jerónimo', 'Não nos jardins', 'Não'],
              ['Portagem, Praça da República, Santa Clara', 'Na estrada ou na ciclovia', 'Só nos hotspots'],
              ['Pólo II, Estádio Cidade de Coimbra, Coimbra Shopping', 'Na estrada ou na ciclovia', 'Sim, fora do passeio'],
            ],
          },
        },
        '**Baixa.** As ruas pedonais da Baixa, da Rua Ferreira Borges à Praça do Comércio e à Rua Direita, estão fechadas às trotinetes: a app da Bird trava-as.',
        '**Alta.** Na Alta não pode terminar a viagem: deixe a trotinete num hotspot cá em baixo e suba a pé ou no Elevador do Mercado, que liga o Mercado D. Pedro V à Rua Padre António Vieira, 51 metros acima. Funciona de segunda a sábado das 7h30 às 21h00, e ao domingo e feriados das 10h00 às 21h00, com qualquer título dos SMTUC.',
        '**Mondego.** Na ciclovia da Câmara, o percurso do Parque Verde muda de margem pela Ponte Pedro e Inês: ande pela ciclovia, devagar e com prioridade a quem vai a pé, e termine a viagem fora das margens. Na Ponte Rainha Santa Isabel, a app da Bird não deixa andar: atravesse pela Ponte de Santa Clara ou pela Pedro e Inês.',
        'A app da Bird deixa atravessar jardins e praças, mas a Câmara quer acabar com a circulação de trotinetes em jardins, praças e ruas pedonais onde não esteja sinalizada: aí, leve-a à mão.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete em Coimbra',
      blocks: [
        'Em parte da cidade, o acordo com a Câmara só deixa terminar a viagem num hotspot. Não encontrámos o mapa publicado, mas nos dados abertos da Bird todo o centro, de Coimbra-B à Praça da República e a Santa Clara, está marcado como zona onde a viagem não pode terminar, e as trotinetes paradas aparecem agrupadas em pontos fixos: tudo indica que são os hotspots que a app mostra.',
        { note: 'A app não deixa terminar a viagem? Siga até ao hotspot mais próximo e pare mesmo em cima dele: enquanto a viagem não acaba, continua a pagar.' },
        'Fora do centro, a app da Bird deixa terminar na maioria das ruas, exceto nos jardins, nas margens do rio e na Alameda Armando Gonçalves, em Celas, até à Praça Mota Pinto, junto aos Hospitais da Universidade. Na app da Bolt, a legenda é a mesma em todo o país: a vermelho, proibido estacionar; a azul, estacionamento obrigatório; a vermelho com o sinal de circulação proibida, nem andar nem estacionar.',
        'Uma trotinete própria estacionada no passeio ou na ciclovia dá coima de 30 a 150 €, ou de 60 a 300 € se impedir a passagem de peões. Numa partilhada, o contrato da Bird passa as coimas e as despesas de remoção a quem a conduzia.',
      ],
    },
    {
      heading: 'Regras do Código da Estrada para trotinetes em Coimbra',
      blocks: [
        'Uma trotinete elétrica até 0,25 kW e 25 km/h é equiparada a velocípede: não precisa de carta, de seguro nem, por agora, de capacete. As regras nacionais, em outubro de 2026:',
        {
          table: {
            caption: 'Regras e coimas para trotinetes elétricas (Código da Estrada, outubro de 2026)',
            head: ['Regra', 'O que fazer', 'Coima'],
            rows: [
              ['Passeio', 'Andar na estrada ou na ciclovia, nunca no passeio', '60 a 300 €'],
              ['Sentido', 'Pela direita, no sentido do trânsito', '250 a 1250 € em sentido contrário'],
              ['Telemóvel e auriculares', 'Não mexer no telemóvel; no máximo um auricular', '250 a 1250 €'],
              ['Passageiro', 'Só uma pessoa por trotinete', '60 a 300 €'],
              ['Álcool', 'Menos de 0,5 g/l', '250 a 2500 €; crime a partir de 1,2 g/l'],
              ['Luzes', 'Acesas do anoitecer ao amanhecer', '30 a 150 €'],
            ],
          },
        },
        'O capacete pode voltar a ser obrigatório: a 30 de setembro de 2026, a Assembleia da República aprovou na generalidade dois projetos de lei nesse sentido, com coima prevista de 30 a 150 €. Ainda não são lei. Não encontrámos em Coimbra nenhum horário noturno. Mais pormenores nas [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Coimbra-B, metrobus e universidade: dicas para estudantes e visitantes',
      blocks: [
        {
          list: [
            '**Comboio.** Os comboios param em Coimbra-B: a Estação Nova (Coimbra-A), na Baixa, fechou aos comboios a 12 de janeiro de 2025.',
            '**Metrobus.** Desde 10 de setembro de 2026, o metrobus liga Coimbra-B à Baixa e à Praça da República, de cinco em cinco minutos nas horas de ponta. Com o cartão MOVE-C, o mesmo título serve nos SMTUC e no metrobus. Os Hospitais da Universidade ainda não têm ligação.',
            '**Trotinete no comboio.** Uma trotinete própria viaja de graça nos comboios urbanos de Coimbra, a qualquer hora, sem andar nela no comboio nem na estação. Uma partilhada não entra nos transportes públicos: termine a viagem antes.',
            '**Estudantes.** O Pólo I fica na Alta, onde não se termina a viagem. À volta do Pólo II havia cerca de 30 trotinetes da Bird na madrugada de 17 de outubro de 2026; junto aos Hospitais da Universidade e ao Pólo III, poucas. Numa noite de festa, o limite de álcool é 0,5 g/l.',
            '**Chuva e calçada.** A calçada escorrega com chuva: abrande nas descidas da Alta.',
            '**Bicicletas.** Coimbra não tem bicicletas partilhadas municipais; para as subidas, a Bolt tem bicicletas elétricas.',
          ],
        },
        'Para encontrar a trotinete mais próxima, abra o [mapa de Coimbra](map:pt:Coimbra) e desbloqueie-a depois na app da Bird.',
      ],
    },
    {
      heading: 'Sabia que…?',
      blocks: [
        {
          list: [
            '**Coimbra foi a segunda cidade portuguesa da Lime.** O acordo com a Câmara foi assinado em fevereiro de 2019, com desbloqueio a 1 € e 0,15 € por minuto.',
            '**Na Queima das Fitas de 2019, as trotinetes iam dormir cedo.** De 2 a 11 de maio, a Câmara mandou retirá-las das ruas todos os dias até às 20h00, e no dia do Cortejo nem chegaram a sair.',
            '**Cerca de 22 mil viagens por mês.** Segundo dados da Câmara publicados em 2022, cada viagem de trotinete durava em média uns 10 minutos e 2,2 km.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Quanto custa andar de trotinete em Coimbra?',
      answer: 'A Bird não publica preços para Coimbra, e a Bolt só publica para o país, «a partir de 0,15 € por minuto», que pode variar consoante o local. Veja o preço na app antes de desbloquear.',
    },
    {
      question: 'Posso deixar a trotinete em qualquer sítio em Coimbra?',
      answer: 'Não. Em todo o centro, segundo os dados da Bird, a viagem só termina num hotspot da app; na Alta, na Baixa, nas margens do Mondego e nos jardins, a app não deixa terminar. Nunca a deixe no passeio.',
    },
    {
      question: 'Posso andar de trotinete na Baixa de Coimbra?',
      answer: 'Nas ruas pedonais, como a Ferreira Borges, a Visconde da Luz e a Praça do Comércio, não: a app da Bird trava a trotinete. Termine a viagem num hotspot antes de entrar e siga a pé.',
    },
    {
      question: 'A Câmara de Coimbra vai acabar com as trotinetes?',
      answer: 'Não há decisão nesse sentido, a 17 de outubro de 2026. Em agosto, a presidente da Câmara anunciou uma concessão com regras novas, em que os operadores pagariam pelo espaço público, e uma petição pede o fim das trotinetes sem doca.',
    },
    {
      question: 'Há trotinetes à saída do comboio em Coimbra-B?',
      answer: 'Na madrugada de 17 de outubro de 2026 havia trotinetes da Bird junto à estação, mas a app não deixa andar na zona da estação e da Praça Europa: veja na app por onde sair. Para o centro, há também o metrobus.',
    },
  ],
  sources: [
    { title: 'Câmara de Coimbra: novo acordo de colaboração com a Bolt e a Bird (20 de março de 2024)', url: 'https://www.coimbra.pt/2024/03/cm-de-coimbra-avanca-com-novo-acordo-de-colaboracao-com-bolt-e-bird-e-com-a-criacao-de-parqueamentos/' },
    { title: 'DN/Lusa: Coimbra prepara nova concessão para as trotinetas (24 de agosto de 2026)', url: 'https://www.dn.pt/sociedade/coimbra-quer-pr-fim-s-trotinetas-sem-regras-e-prepara-nova-concesso' },
    { title: 'Diário de Coimbra: a petição e o Coimbr’a Pedal (30 de agosto de 2026)', url: 'https://www.diariocoimbra.pt/2026/08/30/coimbra-pedal-defende-sistema-de-bicicletas/' },
    { title: 'Bird: dados abertos (GBFS) de Coimbra', url: 'https://mds.bird.co/gbfs/v2/public/provider/bird/coimbra-portugal/gbfs.json' },
    { title: 'Bird: contrato de aluguer em Portugal', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'Bolt em Coimbra: serviços disponíveis', url: 'https://bolt.eu/pt-pt/cities/coimbra/' },
    { title: 'Bolt: trotinetes em Portugal e preços', url: 'https://bolt.eu/pt-pt/scooters/' },
    { title: 'Bolt: zonas no mapa da app', url: 'https://bolt.eu/pt-pt/support/articles/4404302974610/' },
    { title: 'Câmara de Coimbra: a ciclovia de Coimbra-B ao Vale das Flores e à Portela (4 de julho de 2020)', url: 'https://www.coimbra.pt/2020/07/ciclovias-estao-a-valorizar-paisagem-urbana-de-coimbra/' },
    { title: 'Câmara de Coimbra: o metrobus chega a Coimbra-B e à Praça da República (16 de setembro de 2026)', url: 'https://www.coimbra.pt/2026/09/metrobus-chega-a-coimbra-b-e-a-praca-da-republica-e-abre-nova-fase-da-mobilidade-em-coimbra/' },
    { title: 'Diário de Coimbra/Lusa: o metrobus em Coimbra-B (23 de setembro de 2026)', url: 'https://www.diariocoimbra.pt/2026/09/23/presidente-da-metro-mondego-defende-espera-normal-de-passageiros-em-coimbra-b-durante-manhas/' },
    { title: 'SMTUC: Elevador do Mercado', url: 'https://www.smtuc.pt/elevador-do-mercado/' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'Assembleia da República: Projeto de Lei 622/XVII (PSD), capacete', url: 'https://www.parlamento.pt/ActividadeParlamentar/Paginas/DetalheIniciativa.aspx?BID=356782' },
    { title: 'CP: transporte de bicicletas e trotinetas', url: 'https://www.cp.pt/info/w/transporte-bicicletas' },
    { title: 'Echo Boomer: fecho da estação de Coimbra aos comboios (3 de janeiro de 2025)', url: 'https://echoboomer.pt/estacao-ferroviaria-coimbra-desativada-12-janeiro/' },
    { title: 'Coimbra Coolectiva: as trotinetes são uma boa alternativa? (7 de maio de 2022)', url: 'https://coimbracoolectiva.pt/historias/temas/mobilidade/as-trotinetes-sao-uma-boa-alternativa/' },
    { title: 'Câmara de Coimbra: a Lime chega em março de 2019', url: 'https://www.coimbra.pt/2019/02/coimbra-com-sistema-de-partilha-de-trotinetas-eletricas-a-partir-de-marco/' },
    { title: 'Câmara de Coimbra: as trotinetas na Queima das Fitas (maio de 2019)', url: 'https://www.coimbra.pt/2019/05/servicos-de-trotinetas-eletricas-com-limitacoes-na-semana-da-queima-das-fitas/' },
  ],
};

export default guide;
