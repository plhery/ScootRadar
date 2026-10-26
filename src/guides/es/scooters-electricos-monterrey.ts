import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'scooters-electricos-monterrey',
  topic: 'monterrey',
  name: 'Scooters eléctricos en Monterrey',
  title: 'Scooters eléctricos Monterrey y San Pedro: Whoosh y JET',
  description: 'Scooters eléctricos en Monterrey y San Pedro Garza García: Whoosh, JET y Lime, dónde están, cuánto cuesta la renta y dónde puedes andar y estacionar.',
  headline: 'Scooters eléctricos en Monterrey y San Pedro: Whoosh, JET y Lime, dónde encontrarlos y las reglas para andar',
  lede: 'Los scooters eléctricos de Monterrey y San Pedro Garza García se rentan con tres apps: Whoosh, GO JET (de JET) y Lime. El domingo 25 de octubre de 2026 a las 14:09, el mapa mostraba unos 890 scooters en Monterrey, casi todos de Whoosh, y unos 800 en San Pedro, con casi todos los de JET; los Lime solo se ven en su app. En Monterrey, el reglamento de tránsito prohíbe andar por la banqueta, y Whoosh y JET piden ser mayor de edad.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'mx:Monterrey',
  sections: [
    {
      heading: '¿Qué scooters eléctricos hay en Monterrey y San Pedro?',
      blocks: [
        'En octubre de 2026 rentan scooters aquí tres empresas:',
        {
          list: [
            '**Whoosh** empezó en San Pedro Garza García el 15 de abril de 2026, con el programa de micromovilidad del municipio, y en Monterrey el 29 de junio, junto con su gobierno municipal.',
            '**JET** se sumó al programa de San Pedro a finales de abril de 2026, con 200 scooters en la zona de Valle (La Política Online). Se renta con su app **GO JET**.',
            '**Lime** llegó a Monterrey en septiembre de 2025 por un convenio con el municipio, con scooters y bicis eléctricas; se renta con su app o con la de Uber. Ese mes empezó también en Guadalupe (Publimetro). En diciembre de 2025 amplió su zona de Monterrey hacia el Distrito Tec (Notiviral).',
          ],
        },
        'El domingo 25 de octubre de 2026, entre las 14:09 y las 14:11, el [mapa de Monterrey](map:mx:Monterrey) mostraba unos 1,700 scooters estacionados: unos 1,210 de Whoosh y 490 de JET. Es una foto de ese momento, no el tamaño de las flotas. Por municipio (límites del Marco Geoestadístico del INEGI):',
        {
          table: {
            caption: 'Scooters en el mapa por municipio, el 25 de octubre de 2026, de 14:09 a 14:11',
            head: ['Municipio', 'Scooters', 'De quién', 'Dónde'],
            rows: [
              ['Monterrey', 'unos 890', 'Whoosh, y 2 de JET', 'El centro, al norte del río Santa Catarina (unos 450); justo al sur del río, por Colima y Francisco Zarco (unos 190); y alrededor del Tec (unos 160)'],
              ['San Pedro Garza García', 'unos 800', 'JET unos 485, Whoosh unos 315', 'Del Valle, por Río Mississipi, Río Orinoco y Río Suchiate (unos 475); el Casco Urbano (unos 240); Valle Oriente (unos 85)'],
              ['Guadalupe', '6', 'Whoosh', 'En su orilla oeste, junto a Monterrey'],
              ['Santa Catarina y San Nicolás de los Garza', 'ninguno', '—', '—'],
            ],
          },
        },
        'En el centro de Monterrey y cerca del Tec verás Whoosh; los JET están casi todos en San Pedro. Los Lime no salen en el mapa: búscalos en su app.',
        'El mapa muestra GO JET y Whoosh: cada scooter estacionado, su batería y, en Whoosh, su autonomía; no precios, zonas ni horarios.',
        '**Bicis.** El mapa tampoco muestra las bicis eléctricas de Lime. En el Parque Fundidora, Rueda Verde renta bicis y scooters por hora en sus módulos desde abril de 2026 (Publimetro).',
      ],
    },
    {
      heading: '¿Cuánto cuesta la renta de scooters en Monterrey?',
      blocks: [
        'Ninguna empresa publica en su web su tarifa de Monterrey o San Pedro: el precio lo ves en la app antes de desbloquear. JET te lo muestra en GO JET antes de que confirmes la renta, según sus términos para México del 7 de abril de 2026.',
        '**Whoosh en Monterrey.** Al lanzarlo, el 28 de junio de 2026, el Gobierno de Monterrey anunció $8.00 por desbloquear y de $2.49 a $3.00 por minuto, más un pase mensual de $49.99 que quita el desbloqueo. Era el precio de lanzamiento: según sus términos, las tarifas de Whoosh cambian con la demanda y la batería del scooter.',
        'Whoosh puede retener hasta $70 MXN en tu tarjeta al empezar, y cobrarte multas según sus términos para México:',
        {
          table: {
            caption: 'Multas de Whoosh en México, según sus términos del 15 de abril de 2026',
            head: ['Qué pasa', 'Multa'],
            rows: [
              ['Andar dos en el mismo scooter, terminar el viaje fuera de una zona «P» o dejar que lo maneje un menor de 18 años', '$150'],
              ['Salir de la zona permitida y volver en menos de 30 minutos, o subirlo a un auto, un camión o un taxi', '$150'],
              ['Salir de la zona más de 30 minutos, o dejarlo parado fuera de una «P» más de 30 minutos sin terminar el viaje', '$300'],
              ['Subirlo al Metro o meterlo a un edificio', '$300'],
              ['Dejar que se descargue la batería por completo', '$300'],
              ['No respetar las normas de tránsito, o hacer mal uso del scooter o de la app', '$1,500'],
              ['Dañar el scooter', '$3,000'],
            ],
          },
        },
        'Y si el scooter se pierde por una falta tuya, Whoosh te cobra $27,000.',
      ],
    },
    {
      heading: '¿Por dónde puedes andar en scooter? Banqueta, ciclovía y calle',
      blocks: [
        'En Nuevo León, cada municipio pone sus reglas de tránsito en su reglamento. Según el alcalde de San Pedro, Mauricio Farah, hoy a los scooters los regula la Ley de Movilidad del estado, «medio escueta» (ABC Noticias, agosto de 2026). El reglamento de tránsito de Monterrey no menciona los scooters eléctricos, pero prohíbe andar por la banqueta en vehículos motorizados:',
        {
          table: {
            caption: 'Reglas para andar en scooter de renta en Monterrey y San Pedro, al 25 de octubre de 2026',
            head: ['Regla', 'Qué dice', 'Quién la pone'],
            rows: [
              ['Banqueta', 'Prohibido andar por ella en bicicleta, patines, patineta o vehículos motorizados', 'Reglamento de Tránsito de Monterrey, art. 105, fracc. XV'],
              ['Peatones', 'Van primero en la jerarquía de la calle, antes que los ciclistas', 'Reglamento de Tránsito de Monterrey, art. 2'],
              ['Ciclovía', 'Es exclusiva para ciclistas; el reglamento no dice nada de los scooters', 'Reglamento de Tránsito de Monterrey, art. 4, fracc. XII'],
              ['Por dónde', 'En el sentido de la circulación, señalando tus vueltas con el brazo; bájate y camina en andadores y zonas peatonales', 'Whoosh (términos para México)'],
              ['Velocidad', 'Hasta 25 km/h, o 15 km/h en el modo principiante, que puedes activar en tus tres primeros viajes; menos en las zonas que marca la app', 'Whoosh'],
              ['Edad', 'Mayor de edad para rentar; nadie menor de 18 años puede manejarlo', 'Whoosh y JET'],
              ['Pasajeros', 'Una sola persona; en Whoosh, sin niños ni animales y hasta 100 kg con todo lo que cargues', 'Whoosh y JET'],
              ['De noche', 'Luces encendidas y ropa con reflejantes', 'Whoosh'],
              ['Celular y alcohol', 'Nada de celular mientras manejas, ni alcohol ni drogas', 'Whoosh'],
            ],
          },
        },
        '**Casco.** No hemos encontrado una regla vigente en Monterrey ni en San Pedro que lo exija. Úsalo de todos modos.',
        'Los dos municipios preparan reglas propias, aún no vigentes:',
        {
          list: [
            '**San Pedro.** El 22 de septiembre de 2026, el Cabildo aprobó someter a consulta pública una reforma a su Reglamento de Movilidad, Tránsito y Seguridad Vial. La consulta cerró el 23 de octubre; las propuestas pasan a comisiones y luego el Cabildo decidirá. El proyecto propone 20 km/h como máximo, 12 km/h en banquetas de uso compartido y 15 km/h de noche; 18 años para los scooters de renta; casco para menores de edad; luces; registro ante la Dirección de Movilidad; y nada de alcohol, celular ni audífonos (ABC Noticias, MVS, El Horizonte).',
            '**Monterrey.** En una mesa de trabajo del 18 de septiembre de 2026, integrantes del Cabildo plantearon, para los scooters propios, casco y chaleco reflejante, carril derecho, 25 km/h como máximo, luces, registro ante Tránsito y seguro; el municipio analiza también restringirlos en avenidas de alta velocidad (ABC Noticias). No está aprobado.',
          ],
        },
      ],
    },
    {
      heading: 'Dónde estacionar y qué decide cada municipio',
      blocks: [
        'En Whoosh, empiezas y terminas el viaje solo en las zonas «P» de la app, que la empresa aprueba con el municipio, y mandas fotos al terminar; si lo dejas fuera, te cobra $150. En JET, termina en un lugar permitido de GO JET, con la foto que te pida la app. Las dos te piden no bloquear accesos ni la banqueta.',
        'Cada municipio tiene su propio acuerdo con las empresas:',
        {
          table: {
            caption: 'Scooters de renta por municipio, según cada municipio o la prensa',
            head: ['Municipio', 'Qué hay'],
            rows: [
              ['Monterrey', 'Lime desde septiembre de 2025. Whoosh desde el 29 de junio de 2026, con zonas de estacionamiento definidas junto con el municipio, empezando por Centro-sur, Fundidora y la colonia Independencia, y luego el Tec'],
              ['San Pedro Garza García', 'Whoosh desde el 15 de abril de 2026 y JET desde finales de abril, en un programa del municipio, con 400 puntos de estacionamiento que comparten en Valle Oriente, el Casco Urbano y Centrito Valle, y sin uso en las avenidas de alto flujo (Milenio, La Política Online). En agosto de 2026, el alcalde dijo que quiere acotarlos a esas zonas y a Arboleda o Valle del Campestre (ABC Noticias)'],
              ['Guadalupe', 'Lime desde septiembre de 2025, de la avenida Benito Juárez a Chapultepec y de Fundidora al estadio de Rayados (Publimetro)'],
            ],
          },
        },
        'En octubre de 2026 aparecieron más lugares para scooters en San Pedro, tras quejas por los que quedaban en las banquetas (ABC Noticias).',
      ],
    },
    {
      heading: 'Metro, camiones y Circuito San Pedro',
      blocks: [
        {
          list: [
            '**Metro.** Con un scooter de renta, no: Whoosh lo prohíbe y te cobra $300 si lo subes. Termina el viaje en una «P» y sigue en Metro.',
            '**Camiones, autos y taxis.** Tampoco: Whoosh te cobra $150.',
            '**Circuito San Pedro.** El programa de San Pedro conecta los scooters con las paradas de su transporte municipal gratuito, de 19 rutas (Milenio, abril de 2026).',
          ],
        },
        'Fuera de Monterrey, el mapa también muestra los Lime de [Querétaro](map:mx:Querétaro) y los Whoosh de [Zapopan](map:mx:Zapopan); el 25 de octubre de 2026, Whoosh tenía Zapopan fuera de temporada.',
      ],
    },
    {
      heading: 'Consejos para andar en scooter en Monterrey',
      blocks: [
        {
          list: [
            '**Mira la app antes de salir**: la zona permitida, las «P» y las zonas de velocidad reducida. Salir de la zona tiene multa.',
            '**Apártalo.** Whoosh te deja reservar un scooter en la app, con la tarifa y el plazo que ella te indica, y cancelar la reserva.',
            '**Batería.** Mira la carga antes de salir: si dejas que se descargue por completo, Whoosh te cobra $300.',
            '**Parque Fundidora.** El parque tiene sus propias reglas para scooters, según MVS Noticias (diciembre de 2025): hasta 15 km/h, solo por la pista de carreras y los caminos amplios, nunca por andadores peatonales, la ciclovía ni los juegos infantiles, y con casco y luces.',
          ],
        },
      ],
    },
    {
      heading: '¿Sabías que…?',
      blocks: [
        {
          list: [
            '**Monterrey fue la primera ciudad de América Latina donde Lime lanzó bicis eléctricas**, según su director para la región, en septiembre de 2025 (Publimetro).',
            '**JET anunció que donaría ocho scooters a la policía de San Pedro** al sumarse al programa, en abril de 2026 (ABC Noticias).',
            '**Monterrey tenía 18.14 km de infraestructura ciclista** en septiembre de 2025, según Publimetro.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: '¿Cuánto cuesta rentar un scooter eléctrico en Monterrey?',
      answer: 'Lo ves en la app antes de desbloquear. Al lanzar Whoosh, el 28 de junio de 2026, el Gobierno de Monterrey anunció $8 por desbloquear y de $2.49 a $3 por minuto. JET y Lime muestran su tarifa en sus apps.',
    },
    {
      question: '¿Qué app necesito para los scooters de San Pedro Garza García?',
      answer: 'Whoosh o GO JET, de JET: son las dos empresas del programa de San Pedro, y el mapa te muestra las dos.',
    },
    {
      question: '¿Puedo andar en scooter por la banqueta en Monterrey?',
      answer: 'No. El Reglamento de Tránsito y Vialidad de Monterrey prohíbe andar por la banqueta en bicicleta, patines, patineta o vehículos motorizados. Ve por la calle, en el sentido de la circulación.',
    },
    {
      question: '¿Es obligatorio el casco en Monterrey?',
      answer: 'No hemos encontrado una regla vigente que lo exija; San Pedro propone exigirlo a los menores de edad, y en Monterrey lo plantearon integrantes del Cabildo. Úsalo de todos modos.',
    },
    {
      question: '¿Hay scooters de renta en el centro de Monterrey?',
      answer: 'Sí: el 25 de octubre de 2026 a las 14:09, el mapa mostraba unos 450 Whoosh en el centro, al norte del río Santa Catarina. Los de Lime solo salen en su app.',
    },
    {
      question: '¿Los scooters de Monterrey tienen horario?',
      answer: 'No hemos encontrado horarios ni prohibiciones de noche en fuentes oficiales. Players of Life escribió en abril de 2026 que Whoosh funcionaba las 24 horas en San Pedro.',
    },
  ],
  sources: [
    { title: 'Monterrey: llega Whoosh (junio de 2026)', url: 'https://www.monterrey.gob.mx/noticias/ampl%C3%ADa-monterrey-oferta-de-micro-movilidad-sustentable/' },
    { title: 'Monterrey: Reglamento de Tránsito y Vialidad', url: 'https://www.monterrey.gob.mx/pdf/portaln/reglamentos/Reglamento%20de%20Transito%20y%20Vialidad%20del%20Municipio%20de%20Monterrey.pdf' },
    { title: 'INEGI: Marco Geoestadístico', url: 'https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=794551132173' },
    { title: 'Whoosh: términos para México', url: 'https://whoosh.bike/terminos/mx' },
    { title: 'Whoosh: zonas de parking', url: 'https://whoosh.bike/parking_rules/es_la' },
    { title: 'GO JET: términos para México', url: 'https://static.jetshr.com/jet_website/docs/pdfs/Terms_and_Conditions_Mexico.pdf' },
    { title: 'MVS Noticias: reglas de Fundidora (diciembre de 2025)', url: 'https://mvsnoticias.com/nuevo-leon/2025/12/19/este-es-el-reglamento-para-el-uso-de-scooters-electricos-en-el-parque-fundidora-de-monterrey-717287.html' },
    { title: 'Milenio: San Pedro lanza sus scooters (abril de 2026)', url: 'https://www.milenio.com/comunidad/san-pedro-lanza-programa-scooters-electricos-whoosh-movilidad' },
    { title: 'Players of Life: San Pedro (abril de 2026)', url: 'https://playersoflife.com/monterrey/san-pedro-acelera-hacia-el-mundial-2026-asi-funciona-su-innovador-sistema-con-scooters-electricos/' },
    { title: 'ABC Noticias: JET en San Pedro (abril de 2026)', url: 'https://abcnoticias.mx/local/2026/4/27/llegan-scooters-electricos-san-pedro-para-policias-peatones-276868.html' },
    { title: 'La Política Online: JET llega a San Pedro (abril de 2026)', url: 'https://www.lapoliticaonline.com/mexico/en-foco-mx/san-pedro-fortalece-su-programa-de-micromovilidad-con-la-incorporacion-de-la-empresa-jet/' },
    { title: 'ABC Noticias: San Pedro acota las zonas (agosto de 2026)', url: 'https://abcnoticias.mx/local/2026/8/11/san-pedro-busca-limitar-zonas-de-scooters-modificar-reglamento-de-movilidad-286711.html' },
    { title: 'El Horizonte: la consulta en San Pedro (septiembre de 2026)', url: 'https://www.elhorizonte.mx/nuevoleon/somete-san-pedro-a-consulta-publica-regulacion-de-scooter/9067070794' },
    { title: 'ABC Noticias: San Pedro propone 20 km/h (octubre de 2026)', url: 'https://abcnoticias.mx/local/2026/10/22/propone-san-pedro-que-scooters-no-rebasen-los-20-kmh-293203.html' },
    { title: 'MVS Noticias: San Pedro (octubre de 2026)', url: 'https://mvsnoticias.com/nuevo-leon/2026/10/23/ultimo-dia-para-opinar-sobre-reglamento-de-movilidad-en-san-pedro-750958.html' },
    { title: 'ABC Noticias: Monterrey (septiembre de 2026)', url: 'https://abcnoticias.mx/local/2026/9/18/planea-monterrey-regular-scooters-con-reglas-similares-a-motocicletas-290058.html' },
    { title: 'ABC Noticias: mesa de Monterrey (septiembre de 2026)', url: 'https://abcnoticias.mx/local/2026/9/26/aceptan-ciudadanos-regular-scooters-pero-piden-adecuaciones-viales-290706.html' },
    { title: 'Publimetro: Lime en Monterrey (septiembre de 2025)', url: 'https://www.publimetro.com.mx/nuevo-leon/2025/09/23/monterrey-estrena-micromovilidad-rentaran-bicicletas-y-scooters/' },
    { title: 'Notiviral: Lime en el sur (diciembre de 2025)', url: 'https://notiviral.mx/extienden-servicio-de-micromovilidad-en-zona-sur-de-monterrey/' },
    { title: 'Publimetro: Lime en Guadalupe (septiembre de 2025)', url: 'https://www.publimetro.com.mx/nuevo-leon/2025/09/23/micromovilidad-abarcara-62-kilometros-en-guadalupe/' },
    { title: 'Publimetro: renta en Fundidora (abril de 2026)', url: 'https://www.publimetro.com.mx/nuevo-leon/2026/04/06/otra-vez-a-rodar-en-parque-fundidora-vuelve-la-renta-de-bicicletas/' },
  ],
};

export default guide;
