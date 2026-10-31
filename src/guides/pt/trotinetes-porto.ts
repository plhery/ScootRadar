import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'trotinetes-porto',
  topic: 'porto',
  name: 'Trotinetes no Porto',
  title: 'Trotinetes partilhadas no Porto 2026: Bird, Lime e regras',
  description: 'Bird e Lime no Porto: a viagem acaba sempre num ponto de partilha azul; proibido andar em passeios, ruas pedonais e no tabuleiro superior da Ponte Luís I.',
  headline: 'Trotinetes no Porto: Bird e Lime, onde pode andar e onde estacionar',
  lede: 'Pode alugar trotinetes no Porto à Bird e à Lime, as duas empresas licenciadas pela Câmara em 2025; ambas têm também bicicletas elétricas na mesma app. A app mostra o preço antes de desbloquear. A viagem termina sempre num ponto de partilha, marcado a azul no chão, e é proibido andar em passeios, praças, ruas pedonais, corredores BUS e no tabuleiro superior da Ponte Luís I. Desde novembro de 2025, o serviço pode funcionar 24 horas por dia.',
  published: '2026-10-13',
  updated: '2026-10-26',
  city: 'pt:Porto',
  sections: [
    {
      heading: 'Que empresas têm trotinetes partilhadas no Porto?',
      blocks: [
        'Na hasta pública de maio de 2025 havia duas licenças e só duas concorrentes, a **Bird** e a **Lime**. Cada licença é válida por cinco anos, não é renovável e dá direito a 700 veículos (até 900 com acordo escrito do Município), pelo menos 40% deles bicicletas elétricas.',
        'A Bird está no Porto desde o arranque do serviço, em 2020; a Lime começou em setembro de 2025, com 700 trotinetes e bicicletas. A Bolt teve trotinetes no Porto a partir de 2022; a 13 de outubro de 2026 não as incluía na página do Porto, mas a 25 o nosso mapa mostrava cerca de 550.',
        {
          table: {
            caption: 'Trotinetes partilhadas no Porto: operadores e preços (13 de outubro de 2026)',
            head: ['Operador', 'Desbloqueio', 'Por minuto', '10 / 20 minutos', 'No nosso mapa'],
            rows: [
              ['Bird', 'Não publicado', 'Não publicado', 'Preço na app', 'Sim: cerca de 480 trotinetes'],
              ['Lime', 'Não publicado', 'Não publicado', 'Preço na app', 'Sim, desde 26 de outubro de 2026'],
            ],
          },
        },
        'O ScootRadar mostra as trotinetes da Bird, com a bateria de cada uma: cerca de 480 no [mapa do Porto](map:pt:Porto) a 13 de outubro de 2026, livres naquele momento, numa área que entra por Matosinhos. Desde 26 de outubro, o mapa mostra também as da Lime, com a bateria: cerca de 430 na última contagem, às 22h27 de 25 de outubro, que não se somam às da Bird. Se ampliar o mapa, vê também os 230 pontos de partilha da Câmara Municipal do Porto. Nunca alugou uma trotinete? Veja [como alugar uma trotinete elétrica](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Onde pode andar de trotinete no Porto',
      blocks: [
        'As trotinetes partilhadas podem circular em todo o concelho, exceto nestes sítios, segundo o Código Regulamentar do Município, alterado em novembro de 2025:',
        {
          list: [
            'passeios, ruas pedonais, praças e jardins, salvo sinalização em contrário;',
            'corredores BUS e o espaço reservado ao elétrico e ao metro;',
            'a Estrada da Circunvalação (EN12), a VCI (A20, A28 e A1) e os respetivos nós, e a Avenida AEP;',
            'as pontes da Arrábida e do Freixo e o tabuleiro superior da Ponte Luís I;',
            'túneis.',
          ],
        },
        'As trotinetes estão limitadas eletronicamente a 25 km/h. Nas ruas das zonas de acesso automóvel condicionado (ZAAC) do centro, como Cedofeita, Flores e Ribeira, abrandam sozinhas para 10 km/h.',
        {
          table: {
            caption: 'De trotinete partilhada em alguns sítios do Porto: a nossa leitura das regras (outubro de 2026)',
            head: ['Sítio', 'O que se aplica'],
            rows: [
              ['Ribeira', 'Nas ruas, até 10 km/h; no cais e na Praça da Ribeira, proibido. Ponto da Bird na Rua do Infante D. Henrique'],
              ['Rua das Flores', '10 km/h onde passam carros; com tanta gente a pé, leve a trotinete à mão'],
              ['Rua de Santa Catarina', 'A parte comercial é rua pedonal: trotinete à mão'],
              ['Avenida dos Aliados', 'Na faixa de rodagem, sim, mas não nos corredores BUS, na placa central nem na Praça da Liberdade'],
              ['Clérigos e Carmo', '10 km/h; nunca nos carris do elétrico, na Praça de Gomes Teixeira nem no Jardim da Cordoaria'],
              ['Parque da Cidade e jardins do Palácio de Cristal', 'Proibido andar; no Parque da Cidade também não pode terminar a viagem'],
              ['Foz e marginal', 'Na estrada, ou na ciclovia onde houver; nunca no passeio marítimo'],
            ],
          },
        },
        'Confirme sempre a sinalização no local e a app, que pode bloquear outros sítios. Festas e eventos podem fechar mais ruas: na noite de São João, veja a app antes de sair.',
      ],
    },
    {
      heading: 'Ponte Luís I e Gaia: atravessar o rio de trotinete',
      blocks: [
        'A Ponte Luís I tem dois tabuleiros e duas regras. O superior, do metro e dos peões, está vedado às trotinetes partilhadas. No inferior, pode passar: desde 14 de abril de 2023, só lá circulam transportes públicos, velocípedes, táxis e peões, e a trotinete conta como velocípede.',
        'Em Vila Nova de Gaia, não conte com trotinetes: a Câmara cancelou o concurso em abril de 2026. A 13 de outubro de 2026, os dados públicos da Bird ainda mostravam um ponto no Cais de Gaia, na Avenida de Ramos Pinto: antes de atravessar, confirme na app se ainda pode terminar lá a viagem.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete no Porto: os pontos de partilha',
      blocks: [
        'No Porto, a viagem só pode terminar num ponto de partilha com lugar disponível. Os pontos têm marcações azuis no pavimento e um sinal vertical, e aparecem na app; a da Bird nem deixa terminar a viagem fora deles, e a Lime também só aceita zonas marcadas.',
        'Mesmo junto a um ponto, nunca a deixe no passeio, numa rampa ou passadeira, numa paragem de autocarro ou de elétrico, numa praça de táxis, nem em lugares pagos, reservados ou para pessoas com mobilidade reduzida.',
        { note: 'Ponto cheio? Siga para o seguinte. Desde novembro de 2025, o estacionamento «deve ser efetuado num ponto de partilha com lotação disponível».' },
        '**Quem paga a coima?** A coima por mau estacionamento é aplicada ao operador, que paga também a remoção. Mas os termos da Bird em Portugal passam as coimas e as despesas de remoção para o utilizador, e os operadores pedem uma fotografia no fim da viagem.',
      ],
    },
    {
      heading: 'Regras do Código da Estrada para trotinetes',
      blocks: [
        'Uma trotinete elétrica até 0,25 kW e 25 km/h é equiparada a velocípede: não é precisa carta de condução nem, por agora, capacete. As regras que mais custam, em outubro de 2026:',
        {
          table: {
            caption: 'Regras e coimas para trotinetes elétricas (Código da Estrada, outubro de 2026)',
            head: ['Regra', 'O que fazer', 'Coima'],
            rows: [
              ['Passeio', 'Não andar no passeio; usar a estrada ou a ciclovia', '30 a 150 €'],
              ['Sentido', 'Pela direita, no sentido do trânsito', '125 a 625 € em sentido contrário'],
              ['Telemóvel e auriculares', 'Telemóvel guardado; no máximo um auricular', '125 a 625 €'],
              ['Passageiro', 'Só uma pessoa por trotinete', '60 a 300 €'],
              ['Álcool', 'Menos de 0,5 g/l, o limite dos automobilistas', '125 a 1250 €; crime a partir de 1,2 g/l'],
              ['Capacete', 'Não é obrigatório, mas use-o', 'Nenhuma, por agora'],
              ['Idade', 'A lei não fixa mínimo; a Bird exige 18 anos', '–'],
            ],
          },
        },
        'O capacete pode voltar a ser obrigatório: a 30 de setembro de 2026, a Assembleia da República aprovou na generalidade dois projetos de lei nesse sentido, com coima prevista de 30 a 150 €. Faltam a discussão na especialidade e a votação final global.',
        'O seguro não é obrigatório para quem conduz, e o regulamento do Porto obriga os operadores a segurar os utilizadores. Mais pormenores nas [regras da trotinete elétrica em Portugal](guide:portuguese-rules); para Lisboa, que tem regras próprias, veja [trotinetes em Lisboa](guide:lisbon).',
      ],
    },
    {
      heading: 'Horário das trotinetes e o que a Câmara quer mudar',
      blocks: [
        'Desde novembro de 2025, o regulamento permite que o serviço funcione 24 horas por dia. Entre 2020 e 2025, as trotinetes tinham de ser recolhidas entre as 22h00 e as 6h00. A Câmara pode voltar a impor um horário sem serviço, a um operador ou a todos, se a sinistralidade crescer de forma anormal.',
        'Em abril de 2026, uma colisão entre trotinetes no Porto matou uma pessoa de 25 anos. A 21 de abril, a Câmara aprovou por unanimidade um estudo sobre o uso de trotinetes e os acidentes, sem prazo. A 4 de setembro de 2026, o presidente da Câmara, Pedro Duarte, disse que «as trotinetes hoje em dia são um problema na cidade» e que quer «reduzir substancialmente a utilização da trotinete» a favor de outros modos suaves, em conversa com os operadores.',
        'Até 13 de outubro de 2026, não tinha sido aprovada nenhuma nova restrição. Antes de sair, veja a app.',
      ],
    },
    {
      heading: 'Dicas para andar de trotinete no Porto',
      blocks: [
        {
          list: [
            '**Subidas e granito.** Da Ribeira até à Sé, à Batalha, aos Clérigos e aos Aliados, as ruas sobem a pique, muitas vezes em paralelos de granito. Nas ruelas mais íngremes, leve a trotinete à mão. O Funicular dos Guindais (Ribeira–Batalha) e o Elevador da Lada também poupam a subida.',
            '**Carris do elétrico.** Atravesse os carris quase na perpendicular, nunca deixe a roda entrar no sulco e, com chuva, abrande: o granito molhado escorrega.',
            '**Comboio.** Termine a viagem antes de entrar em São Bento ou em Campanhã: a Bird tem pontos de partilha perto das duas estações, e lá dentro não se anda de trotinete. Uma trotinete própria viaja de graça na CP, uma por passageiro; no Alfa Pendular e no Intercidades, vai dobrada, como bagagem de mão.',
            '**Metro.** Uma trotinete partilhada nunca entra no metro, e as condições de transporte da Metro do Porto não falam de trotinetes: não conte com levar a sua.',
            '**Aeroporto.** O Aeroporto Francisco Sá Carneiro fica na Maia, dentro da zona da Bird, mas na manhã de 13 de outubro de 2026 só havia quatro veículos da Bird a menos de 500 m do terminal. São cerca de 11 km até ao centro, onde a viagem tem de acabar num ponto de partilha: vá de metro.',
            '**Matosinhos e Maia.** A Bird também opera nos dois concelhos, com frotas próprias: com pontos de estacionamento em [Matosinhos](map:pt:Matosinhos), como no Porto, e sem eles na [Maia](map:pt:Maia). Da Foz, siga a marginal para norte, pelo Castelo do Queijo, até à praia de Matosinhos, sem entrar no Parque da Cidade. Para terminar a viagem, volte a um ponto do Porto: os dados abertos da Bird do Porto não têm nenhum em Matosinhos. Mais nas [trotinetes em Matosinhos](guide:matosinhos).',
            '**Bicicletas.** O Porto não tem uma rede municipal de bicicletas partilhadas com estações; a alternativa são as bicicletas elétricas da Bird e da Lime, na mesma app.',
          ],
        },
      ],
    },
    {
      heading: 'Sabia que…?',
      blocks: [
        {
          list: [
            '**O Porto fez as regras antes de chegarem as trotinetes.** A Câmara diz ter sido o primeiro município do país com regulamento próprio, escrito para «precaver os problemas relatados, por exemplo, na cidade de Lisboa». O regime de partilha de trotinetas e bicicletas arrancou a 1 de junho de 2020, adiado pela pandemia.',
            '**A coima é do operador.** Quando a Polícia Municipal começou a multar, em dezembro de 2022, o subintendente Afonso Sousa resumiu: «o infrator é o operador». Uma trotinete rebocada custava então 73 €: 15 € de coima, 41 € de remoção e 17 € de parque.',
            '**O centro histórico abriu-se às trotinetes, devagar.** Em agosto de 2022, a Lusa contou pelo menos uma dúzia de trotinetes a circular em pouco mais de uma hora nas ZAAC de Cedofeita, da Ribeira e de Santa Catarina, onde eram proibidas. Desde novembro de 2025, podem lá andar, a 10 km/h.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'As trotinetes funcionam à noite no Porto?',
      answer: 'Sim. Desde novembro de 2025, o regulamento permite o serviço 24 horas por dia, e acabou a recolha obrigatória das 22h00 às 6h00. A Câmara pode voltar a limitar o horário se os acidentes aumentarem: confirme na app.',
    },
    {
      question: 'Quem paga a coima se a trotinete ficar mal estacionada?',
      answer: 'A coima e a remoção são cobradas ao operador, mas os termos da Bird passam-nas para o utilizador, e os operadores têm penalizações próprias. Termine sempre num ponto de partilha com lugar e tire a fotografia que a app pede.',
    },
    {
      question: 'É obrigatório usar capacete na trotinete?',
      answer: 'Não, a 13 de outubro de 2026: deixou de ser obrigatório a 8 de janeiro de 2021. Dois projetos de lei que o tornam obrigatório foram aprovados na generalidade a 30 de setembro de 2026, mas ainda não são lei. A GNR recomenda-o vivamente.',
    },
    {
      question: 'A Câmara do Porto vai acabar com as trotinetes?',
      answer: 'Até 13 de outubro de 2026, não tinha sido tomada nenhuma decisão nesse sentido. O presidente da Câmara quer menos trotinetes e mais bicicletas, por acordo com os operadores, e a Câmara aprovou em abril um estudo sobre o uso de trotinetes e os acidentes. O regulamento já permite reduzir o horário ou fechar ruas.',
    },
  ],
  sources: [
    { title: 'Diário da República: Regulamento n.º 1222/2025 (Porto)', url: 'https://diariodarepublica.pt/dr/detalhe/regulamento/1222-2025-944874377' },
    { title: 'Câmara do Porto: trotinetas e pontos de partilha', url: 'https://mobilidade.cm-porto.pt/modos-suaves/trotinetas' },
    { title: 'Câmara Municipal do Porto: pontos de partilha, na plataforma urbana do Porto Digital', url: 'https://broker.fiware.urbanplatform.portodigital.pt/v2/entities?type=OnStreetParking&q=dataProvider==cmp&options=keyValues&limit=1000' },
    { title: 'Câmara do Porto: arranque do serviço (maio de 2020)', url: 'https://www.porto.pt/pt/noticia/regime-de-partilha-de-trotinetas-e-bicicletas-entra-amanha-em-funcionamento' },
    { title: 'Echo Boomer: as licenças da Bird e da Lime (agosto de 2025)', url: 'https://echoboomer.pt/?p=265398' },
    { title: 'Echo Boomer: a Lime estreia-se no Porto (setembro de 2025)', url: 'https://echoboomer.pt/lime-estreia-porto-700-trotinetes-bicicletas/' },
    { title: 'Observador/Lusa: Pedro Duarte e as trotinetes (4 de setembro de 2026)', url: 'https://observador.pt/2026/09/04/trotinetes-sao-um-problema-e-pedro-duarte-prefere-promover-bicicletas-no-porto/' },
    { title: 'Notícias ao Minuto/Lusa: o estudo da Câmara (abril de 2026)', url: 'https://www.noticiasaominuto.com/pais/2976749/camara-do-porto-vai-fazer-estudo-sobre-utilizacao-e-acidentes-com-trotinetes' },
    { title: 'Sábado/Lusa: Gaia e outros municípios sem trotinetes (agosto de 2026)', url: 'https://www.sabado.pt/portugal/detalhe/municipios-acabam-com-trotinetes-mas-empresas-defendem-que-se-tem-adaptado-as-regras' },
    { title: 'Código da Estrada, versão consolidada (PGDL)', url: 'https://www.pgdlisboa.pt/leis/lei_mostra_articulado.php?nid=349&tabela=leis' },
    { title: 'Bird: contrato de aluguer em Portugal', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'CP: transporte de bicicletas e trotinetas', url: 'https://cp.pt/info/pt/w/transporte-bicicletas' },
  ],
};

export default guide;
