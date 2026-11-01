import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'scooters-electricos-pucon',
  topic: 'pucon',
  name: 'Scooters eléctricos en Pucón',
  title: 'Scooters eléctricos Pucón: arriendo con Whoosh (2026)',
  description: 'Scooters eléctricos Pucón: arriendo con Whoosh, el permiso municipal y la licitación, 18 km/h, casco, la Playa Grande, Villarrica y lo que cobra Whoosh.',
  headline: 'Scooters eléctricos en Pucón: arriendo con Whoosh, el centro, la Playa Grande, Villarrica y las reglas para andar',
  lede: 'El arriendo de scooters en Pucón es con una app, Whoosh, que opera desde noviembre de 2025 con un permiso municipal precario, mientras la municipalidad prepara una licitación. Sus scooters se toman y se dejan en las zonas «P» de la app, que te muestra el precio. Para la ley son ciclos: ciclovía o calzada, casco y la vereda solo por excepción.',
  published: '2026-11-01',
  updated: '2026-11-01',
  city: 'cl:Pucón',
  sections: [
    {
      heading: '¿Qué scooters de arriendo hay en Pucón?',
      blocks: [
        'Los scooters eléctricos de Pucón son de **Whoosh**, la misma empresa que los arrienda en Santiago, La Serena y Puerto Montt:',
        {
          list: [
            '**La llegada.** Whoosh llegó a Pucón en noviembre de 2025. A comienzos de diciembre, la municipalidad hablaba de 220 scooters y 87 espacios públicos para estacionarlos (Alerta Noticias Temuco).',
            '**El permiso.** Según el administrador municipal, Sergio Núñez, Whoosh ocupa el espacio público con un permiso precario y paga un millón de pesos al mes (La Voz de Pucón, 6 de octubre de 2026). En noviembre de 2025, la municipalidad había hablado de 5 UTM al año, y El Mercurio, en septiembre de 2026, de 5 UTM al mes ($355.755), según La Voz de Pucón. La ordenanza de derechos municipales de 2023 no nombra los scooters.',
            '**La licitación.** Núñez anunció además que la municipalidad prepara una licitación abierta para una concesión, con las bases listas en un 90 %, para operar así desde el verano de 2026-2027, como en Temuco y Concepción. «El scooter llegó para quedarse», dijo.',
          ],
        },
        'Hoy, Whoosh es la única empresa que arrienda scooters en Pucón; la licitación podría traer otra.',
        'El 31 de octubre de 2026 a las 22:03, hora de Chile, el [mapa de Pucón](map:cl:Pucón) mostraba unos 180 scooters de Whoosh estacionados, según su último recuento. Esa cifra es solo la de Pucón: el mapa muestra [Villarrica](map:cl:Villarrica) aparte, y esa noche no mostraba ningún Whoosh allá.',
        'El mapa muestra cada scooter estacionado, su batería y cuántos kilómetros le quedan; no precios, zonas «P», zonas de velocidad reducida, horarios ni el límite de la zona permitida. Para los pasos en la app, mira [nuestra guía para arrendar](guide:how-to-rent), escrita para España, donde la ley es otra.',
      ],
    },
    {
      heading: '¿Cuánto cuesta arrendar un scooter en Pucón?',
      blocks: [
        'La app de Whoosh te muestra el precio antes de cada viaje. Según su web (octubre de 2026), es un costo de inicio, que incluye el primer minuto, más un precio por minuto, según la ciudad, la demanda y tu plan o paquete, y no cambia una vez que partes. Puedes reservar un scooter gratis 10 minutos, o 20 con un plan.',
        'Whoosh puede cobrarte aparte, en pesos chilenos, según sus términos para Chile. Son cobros de la empresa, no multas de la ley:',
        {
          table: {
            caption: 'Multas de Whoosh en Chile, según sus términos del 29 de diciembre de 2025',
            head: ['Qué pasa', 'Cobro de Whoosh'],
            rows: [
              ['Terminar el viaje fuera de una zona «P»', '$5.000'],
              ['Salir de la zona permitida, o dejarlo detenido fuera de una zona «P» más de 30 minutos sin terminar el viaje', '$10.000'],
              ['Subirlo a un auto, una micro, un taxi o un tren, o llevarlo dentro de un edificio', '$10.000'],
              ['Dejar que se descargue la batería por completo', '$10.000'],
              ['No respetar las normas de tránsito', '$20.000'],
              ['Andar dos en el mismo scooter, o que lo use un menor de 18 años', '$40.000'],
              ['Manejar bajo los efectos del alcohol o las drogas', '$50.000'],
            ],
          },
        },
        'Si el scooter se pierde por una infracción tuya, Whoosh te cobra $1.340.000. En diciembre de 2025, Carabineros anunció que Whoosh cerraría para siempre la cuenta de los menores sorprendidos en un scooter (Araucanía Noticias).',
      ],
    },
    {
      heading: '¿Por dónde puedes andar en scooter? Ciclovía, calzada y vereda',
      blocks: [
        'En todo Chile rige la Ley de Tránsito (Ley 18.290), reformada en 2018 por la Ley 21.088, de convivencia vial. Para ella, un vehículo con motor eléctrico auxiliar de hasta 0,25 kW, que deja de impulsar a los 25 km/h, es un **ciclo** (art. 2), como una bicicleta. El Decreto 102 de Transportes fija el equipo de seguridad:',
        {
          table: {
            caption: 'Normas para andar en scooter en Pucón, al 1 de noviembre de 2026',
            head: ['Norma', 'Qué dice', 'Fuente'],
            rows: [
              ['Por dónde', 'Por la ciclovía; si no hay, por la pista derecha de la calzada', 'Ley 18.290, art. 222'],
              ['Vereda', 'Solo si no hay ciclovía y eres menor de 14 años o adulto mayor, vas con niños menores de 7 o tienes una discapacidad o movilidad reducida, o si la ciclovía, la calzada o el clima hacen peligroso seguir. A velocidad de peatón y con preferencia para él', 'Ley 18.290, art. 222'],
              ['Cruces peatonales', 'Detente y crúzalo a velocidad de peatón; si hay mucha gente, bájate', 'Ley 18.290, art. 222'],
              ['Casco', 'Obligatorio para quien maneja y su acompañante', 'Decreto 102, art. 20'],
              ['Luces', 'Blanca o amarilla adelante y roja atrás, de media hora después de la puesta de sol a media hora antes del amanecer, y ropa reflectante', 'Decreto 102, arts. 19 y 21'],
              ['Pasajeros', 'Ninguno: solo las personas para las que el vehículo fue diseñado', 'Decreto 102, art. 22'],
              ['Alcohol y drogas', 'Prohibido manejar cualquier vehículo bajo su influencia', 'Ley 18.290, art. 110'],
              ['Velocidad', 'Los Whoosh llegaban a 25 km/h; en noviembre de 2025 se acordó bajarlos a 18 km/h, y a 15 km/h en algunos sectores céntricos, con el propio sistema del scooter', 'La Voz de Pucón, 29 de noviembre de 2025'],
              ['Edad', '18 años para arrendar un Whoosh, de a uno y con casco', 'Términos de Whoosh y la municipalidad'],
            ],
          },
        },
        'En noviembre de 2025, el Ministerio de Transportes anunció en T13 multas de 0,5 a 1 UTM (unos $36.000 a $72.000 en noviembre de 2026) desde el 1 de enero de 2026, y el retiro de los scooters que pasen de 25 km/h.',
        'En Pucón fiscalizan Carabineros, los inspectores de Seguridad Ciudadana y la Seremi de Transportes; el Juzgado de Policía Local puede cursar multas de $35.000 a $75.000 (Alerta Noticias Temuco, diciembre de 2025). Ese mes, el comisario de Carabineros, mayor Gerard Salazar, anunció partes de cortesía para quien anduviera sin casco (Araucanía Noticias).',
      ],
    },
    {
      heading: 'El centro, la Plaza de Armas, la Playa Grande y Villarrica',
      blocks: [
        {
          list: [
            '**Horario.** El 28 de noviembre de 2025, junto con bajar la velocidad, las autoridades decidieron que los scooters no funcionaran entre la 1 y las 6 de la madrugada, según La Voz de Pucón. Los términos de Whoosh no fijan horarios: la app te dice si puedes partir.',
            '**Plaza de Armas.** En enero de 2026, la municipalidad y Whoosh hicieron una escuela de conducción en plena plaza (Alerta Noticias Temuco). Lo que ha publicado la municipalidad no fija reglas propias para la plaza: rigen la Ley de Tránsito y las zonas «P».',
            '**Centro y Avenida O’Higgins.** Según Whoosh, la mayoría de los viajes van al centro (Araucanía Noticias, marzo de 2026). Tampoco hay reglas propias para O’Higgins: ciclovía o calzada, y 15 km/h donde la app lo marque.',
            '**Camino Internacional.** Para la Secplac es hoy la principal avenida urbana de Pucón, y prepara su remodelación (Araucanía Noticias, agosto de 2026). En diciembre de 2025, un editorial de La Voz de Pucón contó que un usuario de Whoosh había chocado en su ciclovía a un joven ciclista que se preparaba para el Ironman 70.3.',
            '**Veredas.** El 1 de febrero de 2026, según contó un lector en La Voz de Pucón, un adolescente en scooter lo atropelló en la vereda de la calle Colo Colo, camino al lago. La vereda es solo para los casos de excepción de la ley.',
            '**Playa Grande y orilla del lago.** Whoosh prohíbe andar fuera de superficies pavimentadas: no a la arena de la Playa Grande. Junto al lago Villarrica rigen la ley y las zonas «P».',
            '**Villarrica.** Whoosh nombra Villarrica entre sus ciudades, pero el 31 de octubre el mapa no mostraba ningún Whoosh allá. Si sales de la zona permitida, Whoosh te cobra $10.000 y puede bloquear el scooter.',
          ],
        },
      ],
    },
    {
      heading: 'Dónde estacionar, colectivos y buses',
      blocks: [
        {
          list: [
            '**Zonas «P».** Según la web de Whoosh (octubre de 2026), sus scooters solo se toman y se dejan en las zonas «P» de la app, que aprueba la municipalidad; algunas no tienen marca en el suelo. Déjalo paralelo a una pared, sin bloquear entradas, salidas ni veredas, y nunca sobre el pasto.',
            '**La ley.** La Ley de Tránsito pide dejar las bicicletas de preferencia en lugares habilitados, con espacio para los peatones, y prohíbe amarrarlas en paraderos, pasos de peatones o estacionamientos para personas con discapacidad (art. 224).',
            '**Colectivos y Uber.** Según el administrador municipal, el transporte público de Pucón se reduce a taxis colectivos y Uber (La Voz de Pucón, octubre de 2026); la municipalidad planea una red de buses eléctricos (Araucanía Noticias, agosto de 2026).',
            '**Con un Whoosh, no.** Sus términos prohíben llevarlo en cualquier vehículo o dentro de un edificio. Para tomar un bus a Villarrica o a Temuco, termina antes el arriendo en una «P».',
          ],
        },
        'Whoosh arrienda también en [Santiago](guide:santiago-de-chile), que tiene su propia guía; en [Temuco](guide:temuco), los scooters son de JET desde septiembre de 2026.',
      ],
    },
    {
      heading: 'Consejos para andar en scooter en Pucón',
      blocks: [
        {
          list: [
            '**Mira la app antes de partir**: la zona permitida, las zonas «P» y las de velocidad reducida, que Whoosh marca en naranja.',
            '**Seguro.** El de accidentes de Whoosh te cubre solo si respetas las normas de tránsito, como usar casco y ser mayor de edad.',
            '**Peso.** Whoosh admite hasta 100 kg y una sola persona.',
            '**En verano**, el centro se llena de peatones: anda despacio y nunca por la vereda.',
          ],
        },
      ],
    },
    {
      heading: '¿Sabías que…?',
      blocks: [
        {
          list: [
            '**Entre noviembre de 2025 y mayo de 2026, los scooters de Pucón sumaron más de 199.000 viajes**, más de 45.000 usuarios y 348.000 km, con una accidentabilidad no superior al 1 %, según la Secplac (Araucanía Noticias, agosto de 2026).',
            '**Los viajes en scooter en Pucón duran en promedio 10 minutos** y se concentran entre las 18:00 y las 22:00, sobre todo en el centro, según Whoosh (Araucanía Noticias, marzo de 2026).',
            '**Según El Mercurio, Pucón cobra por scooter el 1,4 % de lo que cobra Vitacura**: $1.779 al mes, contra casi $120.000 (La Voz de Pucón, septiembre de 2026). Con el millón al mes que cita el administrador municipal, sería casi el triple.',
            '**En junio de 2018, la municipalidad recibió cinco motos eléctricas donadas para labores de control**, de hasta 45 km/h, y se anunció como la primera del país en usarlas (Araucanía Noticias).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: '¿Cuánto cuesta arrendar un scooter eléctrico en Pucón?',
      answer: 'La app de Whoosh te muestra el precio antes del viaje: un costo de inicio más un precio por minuto, que cambia según la ciudad, la demanda y tu plan.',
    },
    {
      question: '¿Qué app necesito para los scooters de Pucón?',
      answer: 'Whoosh, con un permiso de la municipalidad desde noviembre de 2025. Es la misma app que en Santiago, La Serena y Puerto Montt.',
    },
    {
      question: '¿Es obligatorio el casco para andar en scooter en Pucón?',
      answer: 'Sí. Los scooters de arriendo cuentan como ciclos, y el Decreto 102 de Transportes obliga a usar casco a quien maneja un ciclo. Sin casco, además, el seguro de Whoosh no te cubre.',
    },
    {
      question: '¿Hay scooters de Whoosh en Villarrica?',
      answer: 'Whoosh nombra Villarrica entre sus ciudades de Chile, pero la noche del 31 de octubre de 2026 el mapa no mostraba ninguno allá.',
    },
    {
      question: '¿Los scooters de Pucón tienen horario?',
      answer: 'En noviembre de 2025, las autoridades de Pucón decidieron que no funcionaran entre la 1 y las 6 de la madrugada, según La Voz de Pucón. Los términos de Whoosh no fijan horarios, pero puede terminar un arriendo a las cuatro horas.',
    },
    {
      question: '¿Seguirá Whoosh en Pucón?',
      answer: 'Por ahora opera con un permiso precario. En octubre de 2026, la municipalidad anunció que prepara una licitación abierta para una concesión, que podría cambiar la empresa desde el verano.',
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
    { title: 'Whoosh: ciudades en Latinoamérica', url: 'https://whoosh.bike/es_la' },
    { title: 'Municipalidad de Pucón: ordenanza de derechos municipales (2023)', url: 'https://municipalidadpucon.cl/oldweb/web2010/para%20descarga/ordenanzas/Decreto_3617__Ordenanza_Derechos_Municipales_2023.pdf' },
    { title: 'La Voz de Pucón: baja de la velocidad y horario de los scooters (noviembre de 2025)', url: 'https://www.lavozdepucon.cl/2025/11/29/scooters-autoridades-deciden-baja-de-la-velocidad-y-restringir-el-horario-de-funcionamiento/' },
    { title: 'La Voz de Pucón: editorial sobre los scooters (diciembre de 2025)', url: 'https://www.lavozdepucon.cl/2025/12/26/scooters-beneficios-con-responsabilidad/' },
    { title: 'La Voz de Pucón: carta de un lector (febrero de 2026)', url: 'https://www.lavozdepucon.cl/2026/02/02/accidente-por-scooter-quien-se-hace-responsable/' },
    { title: 'La Voz de Pucón, citando a El Mercurio: lo que cobra Pucón (septiembre de 2026)', url: 'https://www.lavozdepucon.cl/2026/09/29/scooters-electricos-municipios-de-santiago-obtienen-ingresos-millonarios-mientras-pucon-solo-cobra-poco-mas-de-300-mil-al-mes/' },
    { title: 'La Voz de Pucón: la municipalidad prepara una licitación (octubre de 2026)', url: 'https://www.lavozdepucon.cl/2026/10/06/municipalidad-prepara-licitacion-para-los-scooters-electricos-la-apuesta-es-proyectar-la-electromovilidad/' },
    { title: 'Alerta Noticias Temuco: fiscalización en Pucón (diciembre de 2025)', url: 'https://alertanoticiastemuco.cl/2025/12/01/pucon-fiscalizacion-scooters-electricos/' },
    { title: 'Alerta Noticias Temuco: escuela de conducción en la Plaza de Armas (enero de 2026)', url: 'https://alertanoticiastemuco.cl/2026/01/09/seguridad-scooters-electricos-pucon/' },
    { title: 'Araucanía Noticias: sanciones y bloqueo de cuentas (diciembre de 2025)', url: 'https://araucanianoticias.cl/2025/comenzaron-sanciones-de-cortesa-y-multas-por-mal-uso-de-scooters-elctricos-en-pucn/1205295392' },
    { title: 'Araucanía Noticias: 148 mil viajes en el verano (marzo de 2026)', url: 'https://araucanianoticias.cl/2026/scooters-electricos-registran-cerca-de-148-mil-viajes-durante-el-verano-en-pucon/0313302171' },
    { title: 'Araucanía Noticias: plan de movilidad de Pucón (agosto de 2026)', url: 'https://araucanianoticias.cl/2026/pucon-impulsa-un-ambicioso-plan-de-movilidad-centrado-en-el-peaton-los-ciclos-y-el-transporte-publico/0817313746' },
    { title: 'Araucanía Noticias: motos eléctricas municipales (junio de 2018)', url: 'https://araucanianoticias.cl/2018/pucn-ser-el-primer-municipio-del-pas-en-el-uso-de-motos-elctricas-para-labores-de-control/0620147631' },
    { title: 'T13: fiscalización a scooters (noviembre de 2025)', url: 'https://www.t13.cl/noticia/nacional/parte-fiscalizacion-scooters-cuales-son-las-sanciones-desde-cuando-se-aplicaran-20-11-2025' },
  ],
};

export default guide;
