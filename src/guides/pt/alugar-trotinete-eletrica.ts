import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'alugar-trotinete-eletrica',
  topic: 'how-to-rent',
  name: 'Como alugar uma trotinete elétrica',
  title: 'Alugar trotinete elétrica: passo a passo e preços (2026)',
  description: 'Como alugar uma trotinete elétrica em Portugal: a app, a idade, quanto custa, onde estacionar, o Navegante, o que muda em Lisboa e o que fazer num acidente.',
  headline: 'Alugar trotinete elétrica: como funcionam as trotinetes partilhadas, da app ao fim da viagem',
  lede: 'Para alugar uma trotinete elétrica partilhada em Portugal, descarregue a app do operador, adicione um cartão, leia o código QR do guiador e, no fim, estacione onde a app deixar e tire uma fotografia. A Bird e a Bolt só alugam a maiores de 18 anos, e a lei não exige carta de condução. Paga um valor pelo desbloqueio e um preço por minuto, que a app mostra antes de desbloquear: em novembro de 2026, a Bolt anuncia minutos a partir de 0,15 €. Em Lisboa, o passe Navegante dá minutos grátis, mas a Câmara aprovou a 21 de outubro de 2026 suspender as trotinetes partilhadas: os operadores têm de as retirar até ao fim do ano.',
  published: '2026-10-13',
  updated: '2026-10-26',
  sections: [
    {
      heading: 'Como alugar uma trotinete elétrica, passo a passo',
      blocks: [
        'Este guia trata das trotinetes partilhadas que se alugam ao minuto numa app, e não do aluguer ao dia numa loja. Os passos quase não mudam:',
        {
          steps: [
            '**Descarregue a app** da Lime, da Bird ou da Bolt e crie uma conta.',
            '**Adicione um cartão** de crédito ou de débito.',
            '**Confirme a idade ou a identidade,** se a app o pedir.',
            '**Veja o preço:** toque na trotinete no mapa da app antes de desbloquear.',
            '**Desbloqueie:** leia o código QR do guiador, ou escreva o número impresso por baixo dele.',
            '**Verifique travões, pneus, luzes e bateria.** Se algo falhar, comunique-o na app e escolha outra.',
            '**Ande na ciclovia ou na estrada,** pela direita e sem passageiro. A Bolt limita as cinco primeiras viagens a 15 km/h.',
            '**Estacione onde a app deixar:** em Lisboa, num hotspot; no Porto, num ponto de partilha.',
            '**Termine a viagem na app e tire a fotografia** da trotinete estacionada. Paga até a app confirmar o fim.',
            '**Confira o recibo** com o preço final; o valor cativo no cartão é libertado depois.',
          ],
        },
      ],
    },
    {
      heading: 'O que precisa para alugar: idade, carta e pagamento',
      blocks: [
        'Um telemóvel com dados móveis, uma conta e um meio de pagamento. A lei não exige carta de condução nem seguro, nem fixa idade mínima: os 18 anos são regra dos operadores. A idade mínima da Lime, a app mostra-a antes de desbloquear.',
        {
          table: {
            caption: 'O que pedem a Bird e a Bolt em Portugal (termos, em novembro de 2026)',
            head: ['Operador', 'Idade mínima', 'Pagamento'],
            rows: [
              ['Bird', '18 anos, que declara ao aceitar o contrato', 'Cartão de crédito ou de débito; retém 5 € antes de cada viagem e devolve-os em até 30 dias'],
              ['Bolt', '18 anos, também para os convidados de uma viagem em grupo', 'Cartão ou outro método aceite na app; pode cobrar uma taxa de serviço nos cartões Visa e Mastercard'],
            ],
          },
        },
        'A Bolt pode pedir uma fotografia da carta de condução ou de um documento de identificação.',
        'Ao conduzir, valem as regras da bicicleta: nada de passeio, uma só pessoa, um auricular no máximo e álcool abaixo de 0,5 g/l. O capacete não é obrigatório em outubro de 2026, mas há dois projetos de lei, aprovados na generalidade a 30 de setembro, que o tornariam obrigatório. Tudo nas [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Trotinetes partilhadas em Portugal: que app funciona em cada cidade',
      blocks: [
        'Em Portugal, as trotinetes partilhadas são da Lime, da Bird e da Bolt.',
        {
          table: {
            caption: 'Operadores de trotinetes partilhadas por cidade (outubro de 2026)',
            head: ['Onde', 'Operadores', 'O que saber'],
            rows: [
              ['Lisboa', 'Bolt, Lime e Bird', 'A viagem só termina num hotspot; 20 km/h no máximo; minutos grátis com o Navegante; a Câmara aprovou a 21 de outubro de 2026 suspendê-las, e os operadores têm de as retirar até ao fim do ano'],
              ['Porto', 'Bird e Lime', 'A viagem só termina num ponto de partilha, marcado a azul no chão'],
              ['Matosinhos', 'Bird e Bolt', 'As duas têm licença da Câmara desde 2024; o regulamento municipal de 2022 só permite alugar das 6h00 às 22h00'],
              ['Oeiras', 'Bird, Lime e Bolt', 'A viagem só começa e acaba num ponto move sinalizado'],
              ['Almada e Costa da Caparica', 'Bird e Lime', 'Siga as zonas do mapa da app'],
              ['Cascais, Maia, Portimão e Olhão', 'Bird', '–'],
              ['Coimbra', 'Bird e Bolt', 'Em agosto de 2026, a presidente da Câmara disse que a cidade «não tem condições» para elas e que prepara uma concessão e um regulamento: confirme na app'],
              ['Santarém', 'Bolt', 'A Câmara renovou o acordo com a Bolt em 2024: 20 km/h no máximo, 15 km/h em zonas do centro histórico'],
              ['Faro', 'Lime e Bolt', 'Só elas têm licença da Câmara, desde abril de 2025, com 350 trotinetes cada; a Lime tem também bicicletas'],
              ['Braga, Vila Nova de Gaia e Espinho', 'Nenhum', 'Braga votou em junho de 2026 o fim das trotinetes; Gaia cancelou o concurso em abril, e Espinho acabou com elas no fim de julho'],
            ],
          },
        },
        'As regras de cada cidade estão nos guias das [trotinetes em Lisboa](guide:lisbon) e das [trotinetes no Porto](guide:porto).',
      ],
    },
    {
      heading: 'Quanto custa alugar uma trotinete elétrica?',
      blocks: [
        'Paga um valor pelo desbloqueio e cada minuto em que a trotinete está desbloqueada, a andar ou parada, até a app confirmar o fim da viagem.',
        'Em novembro de 2026, a Bolt anuncia «um pequeno valor pelo desbloqueio» e minutos «a partir de 0,15 €», um valor nacional que pode variar com o local; tem também desbloqueios ilimitados a partir de 0,99 € por mês e passes semanais e mensais. A Lime e a Bird mostram os seus preços na app antes de desbloquear.',
        '**Um exemplo, com tarifas inventadas para a conta:** 1 € para desbloquear e 0,20 € por minuto. Se o operador contar cada minuto iniciado, como faz a Bird, 9 minutos e 20 segundos contam como 10: 1 + 10 × 0,20 = 3 €. Com mais 3 minutos à procura de um lugar onde terminar, são 13 minutos: 3,60 €.',
        '**A cativação.** A Bird retém 5 € no cartão antes de cada viagem e devolve-os em até 30 dias; a Bolt cativa um valor quando reserva a trotinete, para confirmar o pagamento.',
      ],
    },
    {
      heading: 'Trotinetes grátis em Lisboa com o passe Navegante',
      blocks: [
        'Quem tem mais de 18 anos, morada fiscal em Lisboa e um passe Navegante válido recebe 200 minutos grátis por mês, 66 em cada operador: a Bird, a Bolt e a Lime. Só contam os primeiros 10 minutos de cada viagem: o resto paga-se ao preço do operador. Ative o benefício em cada app:',
        {
          list: [
            '**Bird:** toque no aviso «Viagens Grátis com Navegante» e indique o número do cartão Navegante e o NIF.',
            '**Bolt:** em «2 rodas», abra «Ferramentas de Segurança» e depois «Passe Navegante».',
            '**Lime:** registe-se em [navegante.li.me](https://navegante.li.me/).',
          ],
        },
        'A 21 de outubro de 2026, a Câmara aprovou suspender as trotinetes partilhadas na cidade: os operadores têm de as retirar no prazo de 60 dias, até ao fim do ano.',
      ],
    },
    {
      heading: 'Reservar e andar em grupo',
      blocks: [
        'Na app da Bolt, pode reservar a trotinete mais próxima para que esteja à sua espera quando lá chegar.',
        'Nunca se afaste sem terminar a viagem: na Bird e na Bolt, uma trotinete abandonada continua a contar até ser recuperada, e a Bolt pode somar uma taxa de procura de até 120 €.',
        '**Em grupo,** a Bolt deixa, nalgumas zonas, desbloquear várias trotinetes com a mesma conta. Quem desbloqueia paga todas, e cada pessoa tem de ter 18 anos.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete e como terminar a viagem',
      blocks: [
        'A app só deixa terminar a viagem onde é permitido estacionar. Em **Lisboa**, é num hotspot assinalado na app. No **Porto**, é num ponto de partilha com lugar livre, marcado a azul no chão e com um sinal vertical. Nas outras cidades, siga as zonas do mapa da app.',
        { note: 'Enquanto a app não aceitar o fim da viagem, o tempo continua a contar. Leve a trotinete à mão até ao lugar permitido mais próximo que a app indicar e tente de novo.' },
        'Deixe-a de pé, no descanso, sem tapar o passeio, entradas ou passadeiras, e tire a fotografia que a app pede, bem nítida.',
        {
          table: {
            caption: 'O que a Bolt e a Bird podem cobrar, segundo os seus termos em Portugal (em novembro de 2026)',
            head: ['Operador', 'Mau estacionamento', 'Outras penalizações'],
            rows: [
              ['Bolt (termos de 15 de setembro de 2024)', 'Até 680 € por estacionar contra as regras; até 20 € sem fotografia clara', 'Recolha até 100 €, busca até 120 €, até 500 € se a trotinete não voltar em 48 horas; taxa de até 30 € quando lhe passa uma coima'],
              ['Bird (contrato de 8 de dezembro de 2021)', 'Passa-lhe as coimas e as taxas de apreensão; recolha até 120 € se pedir que a recolham de uma área proibida', 'Até 500 € se a trotinete não voltar em 48 horas; uma taxa de administração quando lhe passa uma coima'],
            ],
          },
        },
        'Em Lisboa, o acordo com a Câmara põe a remoção das trotinetes mal estacionadas a cargo do operador, que a pode passar a quem conduzia.',
      ],
    },
    {
      heading: 'Seguro e acidente: o que fazer',
      blocks: [
        'O seguro não é obrigatório, esclareceu a ANSR a 19 de junho de 2025. A cobertura muda de operador para operador:',
        {
          list: [
            '**Bird:** seguro de responsabilidade civil para a trotinete e de acidentes pessoais para quem a conduz; os danos na trotinete não estão cobertos.',
            '**Bolt:** os termos exigem que tenha um seguro de responsabilidade civil pessoal válido, e a Bolt só se reserva o direito de oferecer cobertura. O seguro de casa pode já o incluir: pergunte à seguradora.',
            '**Lime:** veja os termos na app antes da primeira viagem.',
            '**Porto:** o regulamento obriga os operadores a ter seguro de responsabilidade civil e um seguro que cubra os utilizadores.',
          ],
        },
        'Depois de um acidente:',
        {
          steps: [
            'Ponha-se em segurança e ligue **112** se houver feridos.',
            'Fotografe o local, os danos e o número da trotinete, e troque contactos com quem estiver envolvido.',
            'Se alguém ficou ferido, participe à polícia: os termos da Bird e da Bolt pedem-no em 24 horas.',
            'Avise o operador: Bolt, +351 300 528 370; Bird, +351 308 802 352 ou ola@bird.co; Lime, pela app.',
          ],
        },
      ],
    },
    {
      heading: 'Como encontrar a trotinete mais próxima, em qualquer app',
      blocks: [
        'A app de cada operador só mostra a sua frota. Onde há uma livre agora, de qualquer operador, mostra o [mapa](/map); desbloqueia-a na app do operador. Em Lisboa, espreite o [mapa de Lisboa](map:pt:Lisboa) antes de sair.',
      ],
    },
  ],
  faq: [
    {
      question: 'Como alugar uma trotinete da Bolt em Portugal?',
      answer: 'Na app da Bolt, adicione um cartão e leia o código QR de uma trotinete perto de si, ou procure-a no mapa da app. Tem de ter 18 anos, as cinco primeiras viagens ficam limitadas a 15 km/h e, a certas horas, a app pode pedir um teste de reação.',
    },
    {
      question: 'Qual é a melhor app para alugar trotinetes?',
      answer: 'A que tiver uma trotinete perto de si: em Lisboa há três operadores, no Porto dois e, nas outras cidades, sobretudo a Bird. Ter duas apps instaladas, com cartão, poupa caminhadas.',
    },
    {
      question: 'Posso andar de trotinete partilhada no passeio?',
      answer: 'Não. O Código da Estrada só deixa andar no passeio crianças até aos 10 anos, e a coima é de 30 a 150 €. Circule na ciclovia ou na faixa de rodagem, pela direita. Em Lisboa e no Porto, as trotinetes partilhadas também não podem andar em praças, jardins nem ruas pedonais.',
    },
    {
      question: 'Podem ir duas pessoas na mesma trotinete?',
      answer: 'Não: a lei só permite uma pessoa por trotinete, com coima de 60 a 300 €, e as trotinetes da Bolt detetam um segundo passageiro. Para andarem juntos, alugue cada um a sua ou, na Bolt, desbloqueie várias com a mesma conta numa viagem em grupo, onde a houver.',
    },
    {
      question: 'Posso levar a trotinete partilhada no metro ou no comboio?',
      answer: 'Não. Uma trotinete partilhada não entra no metro de Lisboa ou do Porto, nos comboios da CP nem nos barcos da Transtejo e Soflusa: termine a viagem num lugar permitido perto da estação.',
    },
  ],
  sources: [
    { title: 'Bolt: termos dos veículos elétricos em Portugal (15 de setembro de 2024)', url: 'https://bolt.eu/pt-pt/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Bolt: aluguer de trotinetes em Portugal', url: 'https://bolt.eu/pt-pt/scooters/' },
    { title: 'Bolt em Lisboa: serviços disponíveis, com trotinetes partilhadas', url: 'https://bolt.eu/pt-pt/cities/lisbon/' },
    { title: 'Bolt em Coimbra: serviços disponíveis, com trotinetes partilhadas', url: 'https://bolt.eu/pt-pt/cities/coimbra/' },
    { title: 'Câmara de Matosinhos: 800 trotinetes e bicicletas elétricas, licenças da Bird e da Bolt (12 de junho de 2024)', url: 'https://www.cm-matosinhos.pt/noticia/800-trotinetes-e-bicicletas-eletricas' },
    { title: 'Câmara de Matosinhos: regulamento dos serviços de partilha (Edital n.º 1608/2022)', url: 'https://www.cm-matosinhos.pt/cmmatosinhos/uploads/writer_file/document/33006/regulamento_municipal_de_servicos_de_partilha_em_modos_suaves_de_transporte.pdf' },
    { title: 'O Mirante: trotinetas e bicicletas de uso partilhado vão continuar em Santarém (3 de fevereiro de 2024)', url: 'https://omirante.pt/sociedade/2024-02-03-Trotinetas-e-bicicletas-de-uso-partilhado-vao-continuar-em-Santarem-be2bd037' },
    { title: 'barlavento: Faro tem novos operadores licenciados para trotinetes e bicicletas partilhadas (15 de abril de 2025)', url: 'https://www.barlavento.pt/faro-tem-novos-operadores-licenciados-para-trotinetes-e-bicicletas-partilhadas/' },
    { title: 'Bird: contrato de aluguer em Portugal (8 de dezembro de 2021)', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'Lime: minutos grátis para titulares do Navegante mensal', url: 'https://navegante.li.me/' },
    { title: 'Câmara Municipal de Lisboa: Acordo de Colaboração com os operadores de trotinetes, 9 de janeiro de 2023 (PDF)', url: 'https://www.lisboa.pt/fileadmin/atualidade/noticias/user_upload/Acordo_de_Colaborac__a__o_OperdoresTrot_09_01_23.pdf' },
    { title: 'Lisboa para Pessoas: viagens gratuitas de trotinete com o Navegante, 26 de novembro de 2025', url: 'https://lisboaparapessoas.pt/2025/11/26/lisboa-trotinetas-navegante-viagens-gratuitas/' },
    { title: 'Observador (Lusa): Câmara de Lisboa aprova suspensão das trotinetes partilhadas, 21 de outubro de 2026', url: 'https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/' },
    { title: 'Sábado (Lusa): municípios acabam com as trotinetes, 28 de agosto de 2026', url: 'https://www.sabado.pt/portugal/detalhe/municipios-acabam-com-trotinetes-mas-empresas-defendem-que-se-tem-adaptado-as-regras' },
  ],
};

export default guide;
