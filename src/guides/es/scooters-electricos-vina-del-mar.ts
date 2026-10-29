import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'scooters-electricos-vina-del-mar',
  topic: 'vina-del-mar',
  name: 'Scooters eléctricos en Viña del Mar',
  title: 'Scooters eléctricos Viña del Mar: Whoosh y Lime (2026)',
  description: 'Scooters eléctricos Viña del Mar: arriendo con Whoosh y Lime, dónde andar y estacionar, casco, el tren y lo que cobra Whoosh si lo dejas mal.',
  headline: 'Scooters eléctricos en Viña del Mar: arriendo con Whoosh y Lime, y las reglas para andar en la Ciudad Jardín',
  lede: 'Los scooters eléctricos de Viña del Mar se arriendan con dos apps, Whoosh y Lime. Whoosh opera desde el verano de 2026 por un convenio con la municipalidad, según la prensa, y sus scooters se toman y se dejan solo en las zonas «P» de su app. El precio lo ves en cada app. Para la ley son ciclos, como las bicicletas: ciclovía o calzada, casco y la vereda solo por excepción.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'cl:Viña del Mar',
  sections: [
    {
      heading: '¿Qué scooters de arriendo hay en Viña del Mar?',
      blocks: [
        'En octubre de 2026 arriendan scooters en Viña del Mar dos empresas:',
        {
          list: [
            '**Whoosh** partió en el verano de 2026 con 350 scooters y 75 puntos de estacionamiento, según G5 Noticias (19 de febrero de 2026), y la alcaldesa Macarena Ripamonti dijo entonces que la ciudad avanzaba «hacia un ecosistema de movilidad inteligente y sustentable». Opera por un convenio con la Municipalidad de Viña del Mar, según UCV Radio (5 de junio de 2026).',
            '**Lime**: La Tercera contaba en noviembre de 2025 que planeaba llegar pronto a Viña del Mar, y en junio de 2026 Forbes Chile ya incluía Viña del Mar entre las comunas donde opera. No hemos encontrado un convenio ni un permiso publicado.',
          ],
        },
        'No hemos encontrado el texto del convenio de Whoosh en el sitio de la municipalidad. El 3 de junio de 2026, la Fundación Comité de Defensa del Borde Costero pidió a la Contraloría Regional de Valparaíso que revisara su legalidad, preocupada por los scooters en las veredas, según Puranoticia (3 de junio) y UCV Radio (5 de junio). No hemos encontrado una respuesta de la Contraloría.',
        'No hemos encontrado otra empresa de scooters en Viña del Mar en 2026, ni a JET.',
        'El 29 de octubre de 2026 a las 11:55, el [mapa de Viña del Mar](map:cl:Viña del Mar) mostraba unos 920 scooters estacionados en el centro y la costa de la ciudad: unos 630 de Whoosh y 290 de Lime, cada uno según su último recuento. No es el tamaño de las flotas, y no incluye los Whoosh de Limache.',
        'El mapa muestra cada scooter estacionado y su batería, no precios, zonas ni horarios. Si nunca has arrendado uno, [nuestra guía para arrendar](guide:how-to-rent) explica los pasos en la app, pero está escrita para España: allá la ley es otra.',
      ],
    },
    {
      heading: '¿Cuánto cuesta arrendar un scooter en Viña del Mar?',
      blocks: [
        'Whoosh no publica su tarifa de Viña del Mar en su web, y no hemos encontrado una tarifa oficial de Lime: el precio lo ves en cada app antes del viaje. Whoosh cobra un costo de inicio más un precio por minuto, según la ciudad, la demanda y tu plan o paquete, y puedes reservar un scooter gratis 10 minutos, o 20 con un plan.',
        'Whoosh puede cobrarte aparte, en pesos chilenos, según sus términos para Chile. Son cobros de la empresa, no multas de la ley:',
        {
          table: {
            caption: 'Multas de Whoosh en Chile, según sus términos del 29 de diciembre de 2025',
            head: ['Qué pasa', 'Cobro de Whoosh'],
            rows: [
              ['Terminar el viaje fuera de una zona «P»', '$5.000'],
              ['Salir de la zona permitida, o dejarlo detenido fuera de una zona «P» más de 30 minutos sin terminar el viaje', '$10.000'],
              ['Subirlo a un tren, al metro, a un auto, una micro o un taxi, o llevarlo dentro de un edificio', '$10.000'],
              ['Dejar que se descargue la batería por completo', '$10.000'],
              ['No respetar las normas de tránsito', '$20.000'],
              ['Andar dos en el mismo scooter, o que lo use un menor de 18 años', '$40.000'],
              ['Manejar bajo los efectos del alcohol o las drogas', '$50.000'],
            ],
          },
        },
        'Si el scooter se pierde por una infracción tuya, Whoosh te cobra $1.340.000. Sus términos no fijan horario, pero Whoosh puede terminar el arriendo a las cuatro horas.',
      ],
    },
    {
      heading: '¿Por dónde puedes andar en scooter? Ciclovía, calzada y vereda',
      blocks: [
        'En todo Chile rige la Ley de Tránsito (Ley 18.290), reformada en 2018 por la Ley 21.088, de convivencia vial. Para ella, un vehículo con motor eléctrico auxiliar de hasta 0,25 kW, que deja de impulsar a los 25 km/h, es un **ciclo** (art. 2), como una bicicleta. El Decreto 102 de Transportes fija el equipo de seguridad:',
        {
          table: {
            caption: 'Normas para andar en scooter en Chile, al 29 de octubre de 2026',
            head: ['Norma', 'Qué dice', 'Fuente'],
            rows: [
              ['Por dónde', 'Por la ciclovía; si no hay, por la pista derecha de la calzada', 'Ley 18.290, art. 222'],
              ['Vereda', 'Solo si no hay ciclovía y eres menor de 14 años o adulto mayor, vas con niños menores de 7 o tienes una discapacidad o movilidad reducida, o si la ciclovía, la calzada o el clima hacen peligroso seguir. A velocidad de peatón y con preferencia para él', 'Ley 18.290, art. 222'],
              ['Cruces peatonales', 'Detente y crúzalo a velocidad de peatón; si hay mucha gente, bájate', 'Ley 18.290, art. 222'],
              ['Casco', 'Obligatorio para quien maneja y su acompañante', 'Decreto 102, art. 20'],
              ['Luces', 'Blanca o amarilla adelante y roja atrás, de media hora después de la puesta de sol a media hora antes del amanecer, y ropa reflectante', 'Decreto 102, arts. 19 y 21'],
              ['Pasajeros', 'Ninguno: solo las personas para las que el vehículo fue diseñado', 'Decreto 102, art. 22'],
              ['Alcohol y drogas', 'Prohibido manejar cualquier vehículo bajo su influencia', 'Ley 18.290, art. 110'],
              ['Edad', '18 años para arrendar un Whoosh; la de Lime, en su app', 'Términos de Whoosh'],
            ],
          },
        },
        'En noviembre de 2025, el Ministerio de Transportes anunció en T13 multas de 0,5 a 1 UTM (unos $36.000 a $72.000 en octubre de 2026) desde el 1 de enero de 2026, y el retiro de los scooters que pasen de 25 km/h. Los Whoosh llegan a 25 km/h y bajan solos la velocidad en las zonas que la app marca en naranja.',
        'Ojo con la vereda: la fundación del Borde Costero reclamaba en junio de 2026, en Puranoticia, que en la Avenida San Martín «andan todos por las veredas». La ley solo lo permite en esas excepciones.',
      ],
    },
    {
      heading: 'Dónde estacionar el scooter en Viña del Mar',
      blocks: [
        {
          list: [
            '**Whoosh.** Según su web (octubre de 2026), sus scooters solo se toman y se dejan en las zonas «P» de la app, que aprueba la municipalidad. Déjalo pegado a una pared, una reja o la solera, paralelo a ella, sin estorbar a peatones ni autos. Terminar fuera de una «P» te cuesta $5.000.',
            '**Lime.** Mira en su app dónde puedes dejarlo: no hemos encontrado sus reglas para Viña del Mar.',
          ],
        },
        'La Ley de Tránsito pide estacionar las bicicletas de preferencia en lugares habilitados, dejando espacio a los peatones, y prohíbe amarrarlas en zonas de carga y descarga, estacionamientos para personas con discapacidad, paraderos o pasos de peatones.',
      ],
    },
    {
      heading: 'Avenida Perú, borde costero, playas y Quinta Vergara',
      blocks: [
        {
          list: [
            '**CicloRecreoVía.** Cada domingo en la mañana, en general de 9:00 a 13:00 o 14:00, la Avenida San Martín y la Avenida Marina, entre 15 Norte y el Reloj de Flores, se cierran a los autos y se abren a bicicletas, patines y scooters, según Visita Viña, el sitio de turismo del municipio (mayo de 2025).',
            '**Avenida Perú.** No hemos encontrado una regla municipal sobre scooters en su paseo. Con marejadas, el municipio la cierra a autos y personas, junto con la Avenida Los Héroes, como el 15 de julio de 2026, y advierte multas a quien se acerque a la costa.',
            '**Playas.** No hemos encontrado una regla municipal para la arena. Los términos de Whoosh prohíben andar fuera de superficies pavimentadas.',
            '**Quinta Vergara.** El parque abre de 7:00 a 19:00, según el municipio (marzo de 2023). No hemos encontrado una regla sobre scooters dentro del parque.',
            '**Reloj de Flores.** No hemos encontrado una regla propia: es el extremo de la CicloRecreoVía.',
            '**Hacia Valparaíso o Concón.** No hemos encontrado un permiso para scooters de arriendo en esas comunas. Si sales de la zona permitida de Whoosh, te cobra $10.000 y puede bloquear el scooter.',
          ],
        },
      ],
    },
    {
      heading: 'Tren Limache-Puerto, micros y Limache',
      blocks: [
        {
          list: [
            '**Tren.** Con un Whoosh, no: sus términos prohíben subirlo a un tren, el metro, una micro, un auto o un taxi, y Whoosh te cobra $10.000 si lo llevas. Termina el viaje en una zona «P» y sigue en tren. EFE Valparaíso deja subir bicicletas al tren Limache-Puerto, el Merval, los fines de semana y festivos; no hemos encontrado una regla suya sobre scooters.',
            '**Micros.** No hemos encontrado una regla publicada para las micros del Gran Valparaíso; Whoosh no te deja subirlo.',
            '**Limache.** Al otro extremo de la línea, Whoosh arrienda también en Limache: el [mapa de Limache](map:cl:Limache) mostraba unos 110 scooters el 29 de octubre a las 11:55, según su último recuento, aparte de los de Viña del Mar.',
          ],
        },
        'Si vas a la capital, en nuestra [guía de Santiago](guide:santiago-de-chile) están las comunas donde arriendan Whoosh, JET y Lime.',
      ],
    },
    {
      heading: 'Consejos para andar en scooter en Viña del Mar',
      blocks: [
        {
          list: [
            '**Casco y seguro.** El seguro de accidentes de Whoosh te cubre solo si respetas las normas de tránsito, como usar casco y ser mayor de edad.',
            '**Peso.** Whoosh admite hasta 100 kg y una sola persona.',
            '**Hora punta.** En su primer mes, los Whoosh se usaron más entre las 18:00 y las 21:00, sobre todo en la Avenida Perú, el entorno del Mall Marina, la costa y cerca de la estación Viña del Mar, según Radio Carnaval (marzo de 2026).',
          ],
        },
      ],
    },
    {
      heading: '¿Sabías que…?',
      blocks: [
        {
          list: [
            '**En abril de 2022, el municipio y EFE Valparaíso estrenaron 30 scooters gratis para los pasajeros del tren**, un piloto de su convenio por la movilidad sustentable, según el municipio.',
            '**Expedio se fue de Viña del Mar en enero de 2025, a menos de un año de partir, diciendo que le habían robado el 80% de su flota**, según BioBioChile.',
            '**En su primer mes, los Whoosh de Viña sumaron más de 53.000 viajes de unos 24.000 usuarios**, y en el Festival de Viña fueron de las formas preferidas para ir y volver de la Quinta Vergara, según Radio Carnaval (marzo de 2026).',
            '**El tren Limache-Puerto fue pionero en Chile al dejar subir bicicletas**: lo hace los fines de semana y festivos desde 2013, según EFE.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: '¿Cuánto cuesta arrendar un scooter eléctrico en Viña del Mar?',
      answer: 'Cada app te muestra el precio antes del viaje: Whoosh no publica su tarifa de Viña del Mar, y no hemos encontrado la de Lime. Whoosh cobra un costo de inicio más un precio por minuto, que cambia según la demanda y tu plan.',
    },
    {
      question: '¿Qué app necesito para los scooters de Viña del Mar?',
      answer: 'Whoosh o Lime, las dos empresas que arriendan scooters en la ciudad en octubre de 2026. El mapa te muestra los de ambas en un solo lugar.',
    },
    {
      question: '¿Es obligatorio el casco para andar en scooter en Viña del Mar?',
      answer: 'Sí. Los scooters de arriendo cuentan como ciclos, y el Decreto 102 de Transportes obliga a quien maneja un ciclo y a su acompañante a usar casco. Sin casco, además, el seguro de accidentes de Whoosh no te cubre.',
    },
    {
      question: '¿Puedo andar en scooter por la vereda en Viña del Mar?',
      answer: 'Por regla general, no: la Ley de Tránsito te manda a la ciclovía o a la pista derecha de la calzada. La vereda queda para excepciones, como los menores de 14 años o cuando la ciclovía es peligrosa, y siempre a velocidad de peatón.',
    },
    {
      question: '¿Puedo subir un scooter de arriendo al tren Limache-Puerto?',
      answer: 'Un Whoosh, no: Whoosh prohíbe subirlo a un tren, una micro o un auto, y te cobra $10.000 si lo haces. Termina el viaje en una zona «P» y sigue en tren.',
    },
    {
      question: '¿Los scooters de Viña del Mar tienen horario?',
      answer: 'No que sepamos: los términos de Whoosh no fijan horario y no hemos encontrado uno de la municipalidad. Eso sí, Whoosh puede terminar un arriendo a las cuatro horas.',
    },
  ],
  sources: [
    { title: 'BCN: Ley de Tránsito, texto vigente', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1007469' },
    { title: 'BCN: Ley 21.088 (2018)', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1118358' },
    { title: 'BCN: Decreto 102 de Transportes, seguridad de los ciclos', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1162453' },
    { title: 'SII: valores de la UTM en 2026', url: 'https://www.sii.cl/valores_y_fechas/utm/utm2026.htm' },
    { title: 'Whoosh: términos para Chile', url: 'https://whoosh.bike/terms_cl/es' },
    { title: 'Whoosh: preguntas frecuentes', url: 'https://whoosh.bike/faq/es_la' },
    { title: 'Whoosh: zonas de parking', url: 'https://whoosh.bike/parking_rules/es_la' },
    { title: 'Municipalidad de Viña del Mar: scooters en las estaciones (abril de 2022)', url: 'https://www.munivina.cl/noticias/vina-del-mar-apuesta-por-scooters-electricos-para-promover-la-movilidad-sustentable/' },
    { title: 'Municipalidad de Viña del Mar: cierre de Av. Perú por marejadas (julio de 2026)', url: 'https://www.munivina.cl/noticias/municipio-de-vina-del-mar-realizo-cierre-preventivo-de-av-peru-por-marejadas-en-borde-costero/' },
    { title: 'Municipalidad de Viña del Mar: reapertura de la Quinta Vergara (marzo de 2023)', url: 'https://www.munivina.cl/noticias/parque-quinta-vergara-reabre-museos-espacios-publicos-y-areas-verdes-para-los-visitantes/' },
    { title: 'Visita Viña: Viña del Mar con niños y la CicloRecreoVía (mayo de 2025)', url: 'https://visitavina.munivina.cl/en/vina-del-mar-con-ninos-aventura-y-diversion-para-toda-la-familia/' },
    { title: 'EFE: preguntas frecuentes del tren Limache-Puerto', url: 'https://www.efe.cl/atencion-a-clientes/preguntas-frecuentes/preguntas-limache-puerto/' },
    { title: 'EFE Valparaíso: bicicletas en el tren (enero de 2023)', url: 'https://www.efe.cl/efe-valparaiso-otorga-nuevas-facilidades-para-viajar-los-fines-de-semana-con-bicicletas-en-el-tren/' },
    { title: 'G5 Noticias: llega Whoosh a Viña del Mar (febrero de 2026)', url: 'https://g5noticias.cl/2026/02/19/vina-del-mar-incorporo-350-scooters-electricos-como-alternativa-de-movilidad-urbana-en-temporada-alta/' },
    { title: 'Radio Carnaval: el primer mes de Whoosh (marzo de 2026)', url: 'https://www.radiocarnaval.cl/scooters-electricos-superan-los-53-mil-viajes-en-su-primer-mes-de-operacion-en-vina-del-mar/' },
    { title: 'Puranoticia: vecinos recurren a Contraloría (junio de 2026)', url: 'https://puranoticia.pnt.cl/region-valparaiso/scooters-electricos-en-la-mira-vecinos-de-vina-del-mar-recurren-a' },
    { title: 'UCV Radio: el convenio con Whoosh ante Contraloría (junio de 2026)', url: 'https://ucvradio.cl/news/piden-a-contraloria-revisar-convenio-para-instalacion-de-scooters-electricos-en-vina-del-mar/' },
    { title: 'La Tercera: Lime y su apuesta por Chile (noviembre de 2025)', url: 'https://www.latercera.com/pulso/noticia/scooters-electricos-el-retorno-de-lime-a-america-latina-y-su-apuesta-por-chile/' },
    { title: 'Forbes Chile: el boom de los scooters (junio de 2026)', url: 'https://forbes.cl/negocios/2026-06-01/el-boom-de-los-scooters-en-chile-es-el-pais-con-mayor-frecuencia-de-uso-en-america-latina/' },
    { title: 'T13: fiscalización a scooters (noviembre de 2025)', url: 'https://www.t13.cl/noticia/nacional/parte-fiscalizacion-scooters-cuales-son-las-sanciones-desde-cuando-se-aplicaran-20-11-2025' },
    { title: 'BioBioChile: Expedio deja Viña del Mar (enero de 2025)', url: 'https://www.biobiochile.cl/noticias/nacional/region-de-valparaiso/2025/01/22/empresa-de-scooters-electricos-se-va-de-vina-del-mar-y-acusa-el-robo-del-80-de-su-flota.shtml' },
  ],
};

export default guide;
