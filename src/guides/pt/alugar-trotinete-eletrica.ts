import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'pt',
  slug: 'alugar-trotinete-eletrica',
  topic: 'how-to-rent',
  name: 'Como alugar uma trotinete elétrica',
  title: 'Alugar trotinete elétrica: passo a passo e preços (2026)',
  description: 'Como alugar uma trotinete elétrica em Portugal: a app, a idade, quanto custa, onde estacionar, os minutos grátis do Navegante e o que fazer num acidente.',
  headline: 'Alugar trotinete elétrica: como funcionam as trotinetes partilhadas, da app ao fim da viagem',
  lede: 'Para alugar uma trotinete elétrica partilhada em Portugal, descarregue a app do operador, adicione um cartão, leia o código QR do guiador e, no fim, estacione onde a app deixar e tire uma fotografia. A Lime, a Bird e a Bolt só alugam a maiores de 18 anos, e a lei não exige carta de condução. Paga um valor pelo desbloqueio e um preço por minuto, que a app mostra antes de desbloquear: a Lime e a Bird não publicam tarifas, e a Bolt anuncia minutos a partir de 0,15 €. Em Lisboa, o passe Navegante dá minutos grátis.',
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
            '**Ande na ciclovia ou na estrada,** pela direita e sem passageiro. A Bolt limita as cinco primeiras viagens a 15 km/h, e a Bird tem um modo «Aquecimento», de aceleração mais suave.',
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
        'Um telemóvel com dados móveis, uma conta e um meio de pagamento. A lei não exige carta de condução nem seguro, nem fixa idade mínima: os 18 anos são regra dos operadores.',
        {
          table: {
            caption: 'O que pedem os operadores em Portugal (termos e páginas de ajuda, outubro de 2026)',
            head: ['Operador', 'Idade mínima', 'Documentos', 'Pagamento'],
            rows: [
              ['Lime', '18 anos', 'Um documento de identificação «em determinadas cidades»; não encontrámos nenhuma em Portugal', 'Cartão de crédito, débito ou pré-pago; Apple Pay, Google Pay, PayPal e Klarna em locais selecionados'],
              ['Bird', '18 anos', 'Nenhum pedido encontrado', 'Cartão; Apple Pay, Google Pay e PayPal em cidades selecionadas'],
              ['Bolt', '18 anos, também para os convidados de uma viagem em grupo', 'Pode pedir uma fotografia da carta ou de um documento de identificação', 'Cartão ou outro método aceite; pode cobrar uma taxa de serviço nos cartões Visa e Mastercard'],
            ],
          },
        },
        'Não encontrámos o MB WAY nem o Multibanco em nenhum dos três: conte com o cartão.',
        'Ao conduzir, valem as regras da bicicleta: nada de passeio, uma só pessoa, um auricular no máximo e álcool abaixo de 0,5 g/l. O capacete não é obrigatório em outubro de 2026, mas há dois projetos de lei, aprovados na generalidade a 30 de setembro, que o tornariam obrigatório. Tudo nas [regras da trotinete elétrica em Portugal](guide:portuguese-rules).',
      ],
    },
    {
      heading: 'Trotinetes partilhadas em Portugal: que app funciona em cada cidade',
      blocks: [
        'Em outubro de 2026, há três operadores no país: a Lime, a Bird e a Bolt. A Voi, a Dott e a Hopp não operam em Portugal, e a Circ e a Link já saíram do país.',
        {
          table: {
            caption: 'Operadores de trotinetes partilhadas por cidade (outubro de 2026)',
            head: ['Onde', 'Operadores', 'O que saber'],
            rows: [
              ['Lisboa', 'Bolt, Lime e Bird', 'A viagem só termina num hotspot; 20 km/h no máximo; minutos grátis com o Navegante'],
              ['Porto', 'Bird e Lime', 'A viagem só termina num ponto de partilha, marcado a azul no chão'],
              ['Oeiras', 'Bird, Lime e Bolt', 'A viagem só começa e acaba num ponto move sinalizado'],
              ['Almada e Costa da Caparica', 'Bird e Lime', 'Siga as zonas do mapa da app'],
              ['Cascais, Maia, Matosinhos, Portimão e Olhão', 'Bird; em Matosinhos, também a Bolt, com licença desde 2024 (por confirmar)', 'Em Matosinhos, o regulamento municipal de 2022 só permite alugar das 6h00 às 22h00'],
              ['Faro', 'Lime', 'Consta da lista de cidades da Lime'],
              ['Coimbra', 'Bird; a página da Bolt também lista trotinetes', 'Em agosto de 2026, a presidente da Câmara disse que a cidade «não tem condições» para elas e que prepara uma concessão e um regulamento: confirme na app'],
              ['Braga, Vila Nova de Gaia e Espinho', 'Nenhum', 'Braga suspendeu-as, e a Bolt anunciou a recolha para o fim de agosto de 2026; Gaia cancelou o concurso em abril, e Espinho acabou com elas no fim de julho'],
            ],
          },
        },
        'As regras de cada cidade estão nos guias das [trotinetes em Lisboa](guide:lisbon) e das [trotinetes no Porto](guide:porto).',
      ],
    },
    {
      heading: 'Quanto custa alugar uma trotinete elétrica?',
      blocks: [
        'Paga um valor pelo desbloqueio e cada minuto em que a trotinete está desbloqueada, a andar ou parada. A Lime avisa que as tarifas podem variar com o local e a hora do dia.',
        'A Lime e a Bird não publicam preços para Portugal: a app mostra-os antes de desbloquear. A Bolt anuncia «um pequeno valor pelo desbloqueio» e minutos «a partir de 0,15 €», um valor nacional da própria Bolt, não o de uma cidade. Guias antigos ainda citam preços de 2019: confie no da app.',
        '**Um exemplo, com tarifas inventadas para a conta:** 1 € para desbloquear e 0,20 € por minuto. Se o operador arredondar ao minuto seguinte, como faz a Lime, 9 minutos e 20 segundos contam como 10: 1 + 10 × 0,20 = 3 €. Com mais 3 minutos à procura de um lugar onde terminar, são 13 minutos: 3,60 €.',
        {
          list: [
            '**Bolt:** desbloqueios ilimitados a partir de 0,99 € por mês, e passes semanais e mensais, que só valem na cidade onde os comprou.',
            '**Bird:** o Passe e o Bird+ só existem «em determinados mercados»: veja na app se os há em Portugal.',
            '**Lime:** não encontrámos nenhum passe confirmado para Portugal; a app mostra os que houver.',
          ],
        },
        '**A cativação.** Ao alugar, a app cativa um valor no cartão, e nenhum operador publica quanto em Portugal. A Lime liberta-o no fim da viagem e reembolsa em até 10 dias. Na Bird, o valor pode subir com a duração da viagem, e a maioria dos bancos liberta-o em 7 a 10 dias úteis.',
      ],
    },
    {
      heading: 'Trotinetes grátis em Lisboa com o passe Navegante',
      blocks: [
        'Quem tem 18 anos ou mais, morada fiscal em Lisboa e o passe Navegante mensal recebe até 66 minutos grátis por mês em cada operador, 200 no total entre a Bird, a Bolt e a Lime. Só contam os primeiros 10 minutos de cada viagem: o resto paga-se ao preço do operador. Ative o benefício em cada app:',
        {
          list: [
            '**Bird:** indique o número do cartão Navegante e o NIF. A verificação demora 5 a 10 dias úteis, há um máximo de 10 viagens grátis por mês, os minutos não usados perdem-se e é preciso ativar o benefício todos os meses.',
            '**Bolt:** em «2 rodas», abra «Ferramentas de Segurança» e depois «Passe Navegante».',
            '**Lime:** registe-se em [navegante.li.me](https://navegante.li.me/).',
          ],
        },
        'Os minutos só valem em Lisboa: na Bird, uma viagem que comece ou termine fora da cidade é paga.',
      ],
    },
    {
      heading: 'Reservar, pausar e andar em grupo',
      blocks: [
        {
          list: [
            '**Lime:** reserva até 10 minutos sem custo; pausa até 15 minutos, sempre a pagar.',
            '**Bird:** reserva até 30 minutos e bloqueia a trotinete até 75 minutos, ambos cobrados ao minuto.',
            '**Bolt:** reserva antecipada, com a duração e o preço que a app indicar; só pausa nos lugares de estacionamento marcados, também ao minuto.',
          ],
        },
        'Nunca se afaste sem pausar ou terminar a viagem: a Lime avisa que, se a trotinete for roubada, pode ter de pagar o tempo a mais.',
        '**Em grupo,** uma conta desbloqueia até cinco trotinetes na Lime e até mais quatro na Bird, onde o serviço existe; a Bolt tem viagens em grupo nalgumas zonas. Quem desbloqueia paga todas, e cada pessoa tem de ter 18 anos.',
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
            caption: 'O que os operadores podem cobrar, segundo os seus termos em Portugal (outubro de 2026)',
            head: ['Operador', 'Mau estacionamento', 'Outras penalizações'],
            rows: [
              ['Bolt (termos de 15 de setembro de 2024)', 'Até 680 € por estacionar contra as regras; até 20 € sem fotografia clara', 'Recolha até 100 €, busca até 120 €, até 500 € se a trotinete não voltar em 48 horas; taxa de até 30 € quando lhe passa uma coima'],
              ['Lime (termos de janeiro de 2023)', 'Até 390 € se a deixar num sítio a que a Lime não consegue aceder', 'Recuperação até 110 €'],
              ['Bird (contrato de dezembro de 2021)', 'Passa-lhe as coimas', 'Passa-lhe as taxas de remoção'],
            ],
          },
        },
        'Em Lisboa e no Porto, a câmara cobra a remoção ao operador, que a pode passar a quem conduzia.',
      ],
    },
    {
      heading: 'Seguro e acidente: o que fazer',
      blocks: [
        'O seguro não é obrigatório, esclareceu a ANSR a 19 de junho de 2025. A cobertura muda de operador para operador:',
        {
          list: [
            '**Lime:** a página de ajuda diz que, com a Allianz e outras seguradoras, inclui em Portugal seguro de responsabilidade civil e de acidentes pessoais, sem custo adicional. O texto é antigo: confirme nos termos da app.',
            '**Bird:** seguro de responsabilidade civil para a trotinete e de acidentes pessoais para quem a conduz.',
            '**Bolt:** os termos exigem que tenha um seguro de responsabilidade civil pessoal válido, e a Bolt só «se reserva o direito» de oferecer cobertura. O seguro de casa pode já o incluir: pergunte à seguradora.',
            '**Porto:** o regulamento obriga os operadores a ter seguro de responsabilidade civil e um seguro que cubra os utilizadores.',
          ],
        },
        'Depois de um acidente:',
        {
          steps: [
            'Ponha-se em segurança e ligue **112** se houver feridos.',
            'Fotografe o local, os danos e o número da trotinete, e troque contactos com quem estiver envolvido.',
            'Se alguém ficou ferido, participe à polícia: os termos da Lime e da Bolt pedem-no em 24 horas.',
            'Avise o operador: Bolt, +351 300 528 370; Bird, +351 308 802 352 ou safety@bird.co; Lime, +351 308 800 684 (chamada ou SMS) e accident@li.me.',
          ],
        },
      ],
    },
    {
      heading: 'Como encontrar a trotinete mais próxima, em qualquer app',
      blocks: [
        'A app de cada operador só mostra a sua frota. Para comparar:',
        {
          list: [
            '[O ScootRadar](/map) junta num só mapa as trotinetes da Lime, da Bird e, desde 25 de outubro de 2026, da Bolt, com o tempo a pé e a bateria, quando publicada. É grátis e sem conta. Não mostra preços, que nenhum operador publica nesses dados em Portugal. Não desbloqueia: um botão abre a app do operador, e as posições podem ter alguns minutos de atraso.',
            'A Uber aluga trotinetes da Lime na sua própria app; a página portuguesa da Uber não diz em que cidades.',
            'O Citymapper mostra as trotinetes da Lime em Lisboa e abre a app da Lime para as alugar.',
          ],
        },
        'Não encontrámos nenhuma app de transportes portuguesa que alugue trotinetes. Em Lisboa, espreite o [mapa de Lisboa](map:pt:Lisboa) antes de sair.',
      ],
    },
  ],
  faq: [
    {
      question: 'Como alugar uma trotinete da Bolt em Portugal?',
      answer: 'Na app da Bolt, adicione um cartão e escolha uma trotinete no mapa: em outubro de 2026, a Bolt tem trotinetes em Lisboa, e a sua página também lista Coimbra. Tem de ter 18 anos, as cinco primeiras viagens ficam limitadas a 15 km/h e, a certas horas, a app pode pedir um teste de reação.',
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
      answer: 'Não: a lei só permite uma pessoa por trotinete, com coima de 60 a 300 €, e as trotinetes da Bolt detetam um segundo passageiro. Para andarem juntos, desbloqueie várias trotinetes com a mesma conta, numa viagem em grupo.',
    },
    {
      question: 'Posso levar a trotinete partilhada no metro ou no comboio?',
      answer: 'Não. Uma trotinete partilhada não entra no metro de Lisboa ou do Porto, nos comboios da CP nem nos barcos da Transtejo e Soflusa: termine a viagem num lugar permitido perto da estação.',
    },
  ],
  sources: [
    { title: 'Bolt: termos dos veículos elétricos em Portugal (15 de setembro de 2024)', url: 'https://bolt.eu/pt-pt/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Bolt: aluguer de trotinetes em Portugal', url: 'https://bolt.eu/pt-pt/scooters/' },
    { title: 'Lime: métodos de pagamento', url: 'https://help.li.me/hc/pt/articles/115004914608' },
    { title: 'Lime: seguro e acidentes em Portugal', url: 'https://help.li.me/hc/pt/articles/115004748647' },
    { title: 'Lime: contrato de utilização (janeiro de 2023)', url: 'https://www.li.me/pt-pt/user-agreement' },
    { title: 'Bird: métodos de pagamento', url: 'https://help.bird.co/hc/pt/articles/360031013811' },
    { title: 'Bird: segurança e acidentes', url: 'https://help.bird.co/hc/pt/articles/360030673292' },
    { title: 'Bird: contrato de aluguer em Portugal (dezembro de 2021)', url: 'https://bird.co/rental-agreements/portugal-pt/' },
    { title: 'Bird: benefício do passe Navegante em Lisboa', url: 'https://help.bird.co/hc/pt/articles/48029756932116' },
    { title: 'Câmara Municipal de Lisboa: novas regras para as trotinetas, 23 de junho de 2025', url: 'https://informacao.lisboa.pt/noticias/detalhe/circulacao-de-trotinetas-com-novas-regras-em-lisboa' },
    { title: 'Sábado (Lusa): municípios acabam com as trotinetes, 28 de agosto de 2026', url: 'https://www.sabado.pt/portugal/detalhe/municipios-acabam-com-trotinetes-mas-empresas-defendem-que-se-tem-adaptado-as-regras' },
  ],
};

export default guide;
