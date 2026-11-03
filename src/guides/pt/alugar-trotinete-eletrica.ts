import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'alugar-trotinete-eletrica',
  topic: 'how-to-rent',
  name: 'Como alugar uma trotinete elétrica',
  title: 'Alugar trotinete elétrica: passo a passo e regras (2026)',
  description: 'Como alugar uma trotinete elétrica em Portugal: a app, onde estacionar, os minutos grátis do Navegante, o que muda em Lisboa e o que fazer num acidente.',
  headline: 'Alugar trotinete elétrica: como funcionam as trotinetes partilhadas, da app ao fim da viagem',
  lede: 'Para alugar uma trotinete elétrica partilhada em Portugal, descarregue a app do operador, adicione um cartão, leia o código QR do guiador e, no fim, estacione onde a app deixar e tire uma fotografia. A lei não exige carta de condução; a idade mínima e o preço, a app mostra-os antes de desbloquear. Em Lisboa, o passe Navegante dá minutos grátis, mas a Câmara aprovou a 21 de outubro de 2026 suspender as trotinetes partilhadas: os operadores têm de as retirar até ao fim do ano.',
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
            '**Adicione um cartão,** ou Apple Pay, Google Pay ou PayPal onde a app os aceitar.',
            '**Confirme a idade ou a identidade,** se a app o pedir.',
            '**Veja o preço:** toque na trotinete no mapa da app antes de desbloquear.',
            '**Desbloqueie:** leia o código QR do guiador, ou escreva o número impresso por baixo dele.',
            '**Verifique travões, pneus, luzes e bateria.** Se algo falhar, comunique-o na app e escolha outra.',
            '**Ande na ciclovia ou na estrada,** pela direita e sem passageiro.',
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
        'Um telemóvel com dados móveis, uma conta e um meio de pagamento. A lei não exige carta de condução nem seguro e não fixa idade mínima; a do operador e o preço, a app mostra-os antes de desbloquear.',
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
              ['Lisboa', 'Bolt, Lime e Bird', 'A viagem só termina num hotspot; minutos grátis com o Navegante; a Câmara aprovou a 21 de outubro de 2026 suspendê-las, e os operadores têm de as retirar até ao fim do ano'],
              ['Porto', 'Bird e Lime', 'A viagem só termina num ponto de partilha, marcado a azul no chão'],
              ['Oeiras', 'Bird, Lime e Bolt', 'A viagem só começa e acaba num ponto move sinalizado'],
              ['Almada e Costa da Caparica', 'Bird e Lime', 'Siga as zonas do mapa da app'],
              ['Cascais, Maia, Matosinhos, Portimão e Olhão', 'Bird', 'Em Matosinhos, o regulamento municipal de 2022 só permite alugar das 6h00 às 22h00'],
              ['Coimbra', 'Bird', 'Em agosto de 2026, a presidente da Câmara disse que a cidade «não tem condições» para elas e que prepara uma concessão e um regulamento: confirme na app'],
              ['Braga, Vila Nova de Gaia e Espinho', 'Nenhum', 'Braga votou em junho de 2026 o fim das trotinetes; Gaia cancelou o concurso em abril, e Espinho acabou com elas no fim de julho'],
            ],
          },
        },
        'As regras de cada cidade estão nos guias das [trotinetes em Lisboa](guide:lisbon) e das [trotinetes no Porto](guide:porto).',
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
            '**Lime:** a adesão faz-se num formulário à parte.',
          ],
        },
        'A 21 de outubro de 2026, a Câmara aprovou suspender as trotinetes partilhadas na cidade: os operadores têm de as retirar no prazo de 60 dias, até ao fim do ano.',
      ],
    },
    {
      heading: 'Onde estacionar a trotinete e como terminar a viagem',
      blocks: [
        'A app só deixa terminar a viagem onde é permitido estacionar. Em **Lisboa**, é num hotspot assinalado na app. No **Porto**, é num ponto de partilha com lugar livre, marcado a azul no chão e com um sinal vertical. Nas outras cidades, siga as zonas do mapa da app.',
        { note: 'Enquanto a app não aceitar o fim da viagem, o tempo continua a contar. Leve a trotinete à mão até ao lugar permitido mais próximo que a app indicar e tente de novo.' },
        'Deixe-a de pé, no descanso, sem tapar o passeio, entradas ou passadeiras, e tire a fotografia que a app pede, bem nítida.',
      ],
    },
    {
      heading: 'Seguro e acidente: o que fazer',
      blocks: [
        'O seguro não é obrigatório, esclareceu a ANSR a 19 de junho de 2025. O que cobre o seguro do operador dizem os seus termos: leia-os antes da primeira viagem. O seguro de casa pode já incluir responsabilidade civil: pergunte à seguradora.',
        'No **Porto**, o regulamento obriga os operadores a ter seguro de responsabilidade civil e um seguro que cubra os utilizadores.',
        'Depois de um acidente:',
        {
          steps: [
            'Ponha-se em segurança e ligue **112** se houver feridos.',
            'Fotografe o local, os danos e o número da trotinete, e troque contactos com quem estiver envolvido.',
            'Se alguém ficou ferido, participe à polícia.',
            'Avise o operador pela app.',
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
      question: 'Qual é a melhor app para alugar trotinetes?',
      answer: 'A que tiver uma trotinete perto de si. Ter duas apps instaladas, com cartão, poupa caminhadas.',
    },
    {
      question: 'Posso andar de trotinete partilhada no passeio?',
      answer: 'Não. O Código da Estrada só deixa andar no passeio crianças até aos 10 anos, e a coima é de 30 a 150 €. Circule na ciclovia ou na faixa de rodagem, pela direita. Em Lisboa e no Porto, as trotinetes partilhadas também não podem andar em praças, jardins nem ruas pedonais.',
    },
    {
      question: 'Podem ir duas pessoas na mesma trotinete?',
      answer: 'Não: a lei só permite uma pessoa por trotinete, com coima de 60 a 300 €. Para andarem juntos, alugue cada um a sua.',
    },
    {
      question: 'Posso levar a trotinete partilhada no metro ou no comboio?',
      answer: 'Não. Uma trotinete partilhada não entra no metro de Lisboa ou do Porto, nos comboios da CP nem nos barcos da Transtejo e Soflusa: termine a viagem num lugar permitido perto da estação.',
    },
  ],
  sources: [
    { title: 'Lisboa para Pessoas: viagens gratuitas de trotinete com o Navegante, 26 de novembro de 2025', url: 'https://lisboaparapessoas.pt/2025/11/26/lisboa-trotinetas-navegante-viagens-gratuitas/' },
    { title: 'Observador (Lusa): Câmara de Lisboa aprova suspensão das trotinetes partilhadas, 21 de outubro de 2026', url: 'https://observador.pt/2026/10/21/camara-de-lisboa-aprova-suspensao-das-trotinetes-partilhadas-livre-e-il-votaram-contra/' },
    { title: 'Sábado (Lusa): municípios acabam com as trotinetes, 28 de agosto de 2026', url: 'https://www.sabado.pt/portugal/detalhe/municipios-acabam-com-trotinetes-mas-empresas-defendem-que-se-tem-adaptado-as-regras' },
  ],
};

export default guide;
