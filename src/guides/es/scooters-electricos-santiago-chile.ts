import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'scooters-electricos-santiago-chile',
  topic: 'santiago-de-chile',
  name: 'Scooters eléctricos en Santiago de Chile',
  title: 'Scooters eléctricos Santiago de Chile: Whoosh, JET y Lime',
  description: 'Scooters eléctricos en Santiago de Chile: Whoosh, JET y Lime comuna por comuna, dónde ver el precio, casco, ciclovía y dónde estacionar.',
  headline: 'Scooters eléctricos en Santiago de Chile: Whoosh, JET y Lime, comuna por comuna, y las reglas para andar',
  lede: 'Los scooters eléctricos de Santiago de Chile se arriendan con tres apps, Whoosh, GO JET (de JET) y Lime, y cada comuna decide si los permite. El precio lo ves en la app. Para la ley son ciclos, como las bicicletas: ciclovía o calzada, y casco. Whoosh y JET piden 18 años para arrendar.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'cl:Santiago',
  sections: [
    {
      heading: '¿Qué scooters de arriendo hay en Santiago?',
      blocks: [
        'En octubre de 2026 arriendan scooters en Santiago tres empresas:',
        {
          list: [
            '**Whoosh** llegó en 2023 con un «permiso precario» de La Reina, según La Tercera, y en mayo de 2026 sumó Renca, su duodécima comuna de la región.',
            '**JET** llegó a mediados de 2025 por Huechuraba, según El Dínamo, y se arrienda con su app **GO JET**.',
            '**Lime** llegó en 2018 y en junio de 2026 operaba en Las Condes, Vitacura, San Miguel, La Florida y La Cisterna, según Forbes Chile.',
          ],
        },
        'El domingo 25 de octubre de 2026, entre las 11:47 y las 11:56, había unos 9.300 scooters libres en ese momento en las comunas de Santiago: unos 4.700 de Whoosh, 2.700 de Lime y 1.900 de JET, cada uno según su último recuento. Dónde están, lo ves en el [mapa de Santiago](map:cl:Santiago).',
        'Según la prensa, JET opera también en Colina y Paine.',
        '**Bicis.** Whoosh y JET arriendan también bicicletas eléctricas (en Peñalolén, JET tiene solo bicis), y las bicis públicas de **Bike Itaú** tienen estaciones en comunas como Providencia, Las Condes, Vitacura y Ñuñoa.',
        'Fuera de la capital hay guías de [Viña del Mar](guide:vina-del-mar), [La Serena](guide:la-serena), [Rancagua](guide:rancagua), [Pucón](guide:pucon), [Puerto Montt](guide:puerto-montt) y [Temuco](guide:temuco).',
      ],
    },
    {
      heading: '¿Cuánto cuesta arrendar un scooter en Santiago?',
      blocks: [
        'El precio exacto lo ves en la app antes del viaje. Así cobran en noviembre de 2026:',
        {
          list: [
            '**Whoosh** cobra un costo de inicio, que incluye el primer minuto, más un precio por minuto, según la ciudad, la demanda y tu plan o paquete; una vez que partes, la tarifa no cambia. Puedes reservar un scooter gratis 10 minutos, o 20 con un plan.',
            '**JET** te muestra la tarifa en GO JET antes de que confirmes el arriendo, según sus términos.',
          ],
        },
        'Whoosh puede cobrarte aparte, en pesos chilenos, según sus términos para Chile:',
        {
          table: {
            caption: 'Multas de Whoosh en Chile en noviembre de 2026, según sus términos del 29 de diciembre de 2025',
            head: ['Qué pasa', 'Multa'],
            rows: [
              ['Terminar el viaje fuera de una zona «P»', '$5.000'],
              ['Salir de la zona permitida, o dejarlo detenido fuera de una zona «P» más de 30 minutos sin terminar el viaje', '$10.000'],
              ['Subirlo al Metro, a un auto, una micro o un taxi, o llevarlo dentro de un edificio', '$10.000'],
              ['Dejar que se descargue la batería por completo', '$10.000'],
              ['No respetar las normas de tránsito', '$20.000'],
              ['Andar dos en el mismo scooter, o que lo use un menor de 18 años', '$40.000'],
              ['Manejar bajo los efectos del alcohol o las drogas', '$50.000'],
            ],
          },
        },
        'Y si el scooter se pierde por una infracción tuya, Whoosh te cobra $1.340.000.',
      ],
    },
    {
      heading: '¿Por dónde puedes andar en scooter? Ciclovía, calzada y vereda',
      blocks: [
        'En todo Chile rige la Ley de Tránsito (Ley 18.290), reformada en 2018 por la Ley 21.088, de convivencia vial. Para ella, un vehículo con motor eléctrico auxiliar de hasta 0,25 kW, que deja de impulsar a los 25 km/h, es un **ciclo** (art. 2), como una bicicleta; Vitacura recuerda que los scooters lo son. El Decreto 102 de Transportes fija el equipo de seguridad:',
        {
          table: {
            caption: 'Normas para andar en scooter en Chile, al 25 de octubre de 2026',
            head: ['Norma', 'Qué dice', 'Fuente'],
            rows: [
              ['Por dónde', 'Por la ciclovía; si no hay, por la pista derecha de la calzada. En calles de un sentido con pista Solo Buses a la derecha, por el costado izquierdo de la pista izquierda', 'Ley 18.290, art. 222'],
              ['Vereda', 'Solo si no hay ciclovía y eres menor de 14 años o adulto mayor, vas con niños menores de 7 o tienes una discapacidad o movilidad reducida, o si la ciclovía, la calzada o el clima hacen peligroso seguir. A velocidad de peatón y con preferencia para él', 'Ley 18.290, art. 222'],
              ['Cruces peatonales', 'Detente y crúzalo a velocidad de peatón; si hay mucha gente, bájate', 'Ley 18.290, art. 222'],
              ['Casco', 'Obligatorio para quien maneja y su acompañante', 'Decreto 102, art. 20'],
              ['Luces', 'Blanca o amarilla adelante y roja atrás, de media hora después de la puesta de sol a media hora antes del amanecer, y ropa reflectante', 'Decreto 102, arts. 19 y 21'],
              ['Velocidad', 'Los JET no pasan de 20 km/h; los Whoosh llegan a 25 km/h, o a 15 km/h en modo principiante', 'Cada empresa'],
              ['Pasajeros', 'Ninguno: solo las personas para las que el vehículo fue diseñado', 'Decreto 102, art. 22'],
              ['Alcohol y drogas', 'Prohibido manejar cualquier vehículo bajo su influencia', 'Ley 18.290, art. 110'],
              ['Edad', '18 años para arrendar', 'Whoosh y JET'],
            ],
          },
        },
        'En noviembre de 2025, el Ministerio de Transportes anunció en T13 multas de 0,5 a 1 UTM (unos $36.000 a $72.000 en octubre de 2026) desde el 1 de enero de 2026, y el retiro de los scooters que pasen de 25 km/h. Las Condes empezó a cursar partes el 1 de junio de 2024, con multas de 1 a 3 UTM por andar sin casco, por la vereda o sin respetar las señales, según la municipalidad.',
        'Un proyecto de ley de septiembre de 2026 exigiría 18 años, licencia y seguro para los de más de 25 km/h o 0,25 kW, y limitaría a 25 km/h los de arriendo. Aún no es ley.',
      ],
    },
    {
      heading: 'Dónde estacionar y qué decide cada comuna',
      blocks: [
        'En Whoosh, déjalo solo en las zonas «P» de la app, que aprueba la municipalidad; en JET, en un lugar permitido de la zona de GO JET, con una foto si la app te la pide. La Ley de Tránsito pide estacionar las bicicletas de preferencia en lugares habilitados, dejando espacio a los peatones, y prohíbe amarrarlas en zonas de carga y descarga, estacionamientos para personas con discapacidad, paraderos o pasos de peatones. Vitacura pide lo mismo con los scooters.',
        'Cada comuna da su permiso o convenio, o licita el servicio:',
        {
          table: {
            caption: 'Scooters de arriendo por comuna, según cada municipalidad o la prensa',
            head: ['Comuna', 'Qué hay'],
            rows: [
              ['San Miguel', 'Whoosh desde el 27 de junio de 2025, por acuerdo con la municipalidad: un piloto de 200 scooters en estacionamientos exclusivos, que crecería a 500. Lime desde octubre de 2025: 200 de libre flotación dentro de un polígono'],
              ['Renca', 'Whoosh desde mayo de 2026: 400 scooters en más de 250 estaciones; el alcalde anunció 15% de descuento con la Tarjeta Vecino'],
              ['Cerrillos', 'JET, en marcha blanca desde el 2 de octubre de 2026: 300 scooters y 200 bicis'],
              ['Lo Barnechea, Las Condes y Vitacura', 'Licitación conjunta liderada por Lo Barnechea, por casi 1.800 vehículos durante dos años. A comienzos de septiembre de 2026, La Tercera esperaba la adjudicación para noviembre; a fines de mes, El Mercurio informó que la ganó Lime (La Voz de Pucón). Lo Barnechea terminó su contrato el 15 de octubre de 2026 y anunciará cuándo vuelve el servicio'],
              ['La Reina', 'Whoosh partió ahí en mayo de 2023 y se fue el 31 de julio de 2025, cuando la comuna licitaba el servicio para una sola marca (La Tercera, agosto de 2025)'],
              ['Ñuñoa', 'Whoosh tuvo un permiso piloto de ocho meses que no se renovó; en agosto de 2025 conversaba para volver (La Tercera)'],
              ['Providencia', 'En mayo de 2024 dijo que estos scooters no podrían estacionarse en la comuna (La Tercera); en agosto de 2025, Whoosh decía estar ahí'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Metro, micros y trenes',
      blocks: [
        {
          list: [
            '**Metro.** Con un scooter de arriendo, no: Whoosh lo prohíbe y te cobra $10.000 si lo subes. Termina el viaje en una zona «P» y sigue en Metro.',
            '**Micros, trenes, autos y taxis.** Tampoco: los términos de Whoosh lo prohíben, con un cobro de $10.000, y los de JET no te dejan llevarlo en un vehículo.',
          ],
        },
      ],
    },
    {
      heading: 'Consejos para andar en scooter en Santiago',
      blocks: [
        {
          list: [
            '**Mira la app antes de partir**: la zona permitida, las zonas «P» y las de velocidad reducida, que Whoosh marca en naranja. Según JET, en sus zonas rojas el scooter baja la velocidad y al rato se detiene, y si lo dejas ahí te pueden multar.',
            '**Ojo en la mañana.** La ACHS registró 501 accidentes de trayecto en scooter, los del camino entre la casa y el trabajo, de enero a junio de 2026: un 36,9% más que un año antes. El 57,9% fue entre las 7:00 y las 11:59.',
            '**Seguro.** El de accidentes de Whoosh no te cubre si andas sin casco o fuera de las comunas cubiertas.',
            '**Peso.** Whoosh admite hasta 100 kg.',
          ],
        },
      ],
    },
    {
      heading: '¿Sabías que…?',
      blocks: [
        {
          list: [
            '**Lime llegó a Santiago en noviembre de 2018**, y los primeros scooters compartidos se concentraron en Las Condes y La Reina.',
            '**Para el CEO de JET, Santiago es la ciudad de América Latina con más viajes en scooter por día**, según Forbes Chile.',
            '**En las ciclovías se han visto scooters a 90 km/h**, dijo el jefe de fiscalización del Ministerio de Transportes a T13 en noviembre de 2025.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: '¿Cuánto cuesta arrendar un scooter eléctrico en Santiago?',
      answer: 'Cada app te muestra el precio antes del viaje. En noviembre de 2026, Whoosh cobra un costo de inicio, que incluye el primer minuto, más un precio por minuto, y sus multas por infracciones van de $5.000 a $50.000.',
    },
    {
      question: '¿Qué app necesito para los scooters de Santiago?',
      answer: 'Depende de la comuna: Whoosh, GO JET (de JET) o Lime. Dónde están, lo ves en el [mapa de Santiago](map:cl:Santiago).',
    },
    {
      question: '¿Es obligatorio el casco para andar en scooter en Chile?',
      answer: 'Sí. Los scooters de arriendo cuentan como ciclos, y el Decreto 102 de Transportes obliga a quien maneja un ciclo y a su acompañante a usar casco.',
    },
    {
      question: '¿En qué comunas de Santiago hay scooters?',
      answer: 'En las que dan permiso o convenio. En junio de 2026, Lime operaba en Las Condes, Vitacura, San Miguel, La Florida y La Cisterna, y Whoosh en doce comunas, entre ellas Renca, Quinta Normal y Cerro Navia (Forbes Chile); JET, en Huechuraba y, desde octubre, en Cerrillos, entre otras.',
    },
    {
      question: '¿Puedo subir un scooter de arriendo al Metro?',
      answer: 'No. Whoosh lo prohíbe y te cobra $10.000 si lo haces: termina el viaje en una zona «P» y sigue en Metro.',
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
    { title: 'JET: normas de tránsito para Chile', url: 'https://jetshr.com/#/es/riding' },
    { title: 'JET: preguntas frecuentes', url: 'https://jetshr.com/#/es/rules' },
    { title: 'GO JET: términos para Chile (mayo de 2026)', url: 'https://static.jetshr.com/jet_website/docs/pdfs/Terminos_Condiciones_Arriendo_Go_Jet_Chile.pdf' },
    { title: 'San Miguel: llega Whoosh (junio de 2025)', url: 'https://web.sanmiguel.cl/san-miguel-suma-flota-de-scooters-electricos/' },
    { title: 'San Miguel: llega Lime (octubre de 2025)', url: 'https://web.sanmiguel.cl/scooters-lime-llegan-a-san-miguel-como-nueva-alternativa-de-movilidad/' },
    { title: 'Lo Barnechea: término del contrato (octubre de 2026)', url: 'https://lobarnechea.cl/Noticias/termino-de-contrato-servicio-de-scooters-y-bicicletas/' },
    { title: 'Las Condes: fiscalización de scooters (mayo de 2024)', url: 'https://www.lascondes.cl/campana-de-fiscalizacion-de-scooters-electricos-en-las-condes/' },
    { title: 'Vitacura: normas para scooters (septiembre de 2024)', url: 'https://vitacura.cl/noticias/movilidad-sostenible-normas-para-transitar-en-scooters-electricos/' },
    { title: 'La Tercera: Las Condes y Providencia (mayo de 2024)', url: 'https://www.latercera.com/nacional/noticia/hasta-195-mil-pesos-las-condes-comenzara-a-multar-por-mal-uso-de-scooters-electricos/YHQ5LZDXRJDP5DEAF4AUACFWYY/' },
    { title: 'La Tercera: Whoosh en Santiago (agosto de 2025)', url: 'https://www.latercera.com/pulso/noticia/whoosh-apunta-a-llevar-sus-scooters-electricos-a-todo-el-gran-santiago-para-2028/' },
    { title: 'La Tercera: la licitación del sector oriente (septiembre de 2026)', url: 'https://www.latercera.com/pulso/noticia/licitacion-de-scooters-de-lo-barnechea-vitacura-y-las-condes-enfrenta-a-dos-gigantes-de-estados-unidos-y-rusia/' },
    { title: 'La Voz de Pucón, citando a El Mercurio (septiembre de 2026)', url: 'https://www.lavozdepucon.cl/2026/09/29/scooters-electricos-municipios-de-santiago-obtienen-ingresos-millonarios-mientras-pucon-solo-cobra-poco-mas-de-300-mil-al-mes/' },
    { title: 'G5 Noticias: Whoosh en Renca (mayo de 2026)', url: 'https://g5noticias.cl/2026/05/12/renca-incorpora-scooters-electricos-como-nueva-alternativa-de-movilidad-en-la-comuna/' },
    { title: 'El Diario Santiago: JET en Cerrillos (octubre de 2026)', url: 'https://eldiariosantiago.cl/2026/10/03/jet-en-cerrillos-500-vehiculos-electricos/' },
    { title: 'El Diario Santiago: JET en Colina y Peñalolén (octubre de 2026)', url: 'https://eldiariosantiago.cl/2026/10/17/jet-900-vehiculos-electricos-cerrillos-colina-penalolen/' },
    { title: 'Araucanía Noticias: JET en Chile (septiembre de 2026)', url: 'https://araucanianoticias.cl/2026/en-la-semana-mundial-sin-auto-jet-reafirma-su-compromiso-con-la-movilidad-electrica-en-chile/0925316083' },
    { title: 'El Dínamo: JET en Chile (2026)', url: 'https://www.eldinamo.cl/economia/negocios-economia/2026/04/27/el-ruso-que-quiere-tener-200-mil-scooters-electricos-y-ser-lider-en-micro-movilidad-en-chile/' },
    { title: 'Forbes Chile: el boom de los scooters (junio de 2026)', url: 'https://forbes.cl/negocios/2026-06-01/el-boom-de-los-scooters-en-chile-es-el-pais-con-mayor-frecuencia-de-uso-en-america-latina/' },
    { title: 'T13 / Ex-Ante: el mercado de los scooters (junio de 2026)', url: 'https://www.t13.cl/noticia/ex-ante/scooters-electricos-nuevo-mercado-domina-movilidad-urbana-chile-las-cifras-5-6-2026' },
    { title: 'T13: fiscalización a scooters (noviembre de 2025)', url: 'https://www.t13.cl/noticia/nacional/parte-fiscalizacion-scooters-cuales-son-las-sanciones-desde-cuando-se-aplicaran-20-11-2025' },
    { title: 'La Tribuna: proyecto de ley y cifras de la ACHS (septiembre de 2026)', url: 'https://www.latribuna.cl/politica/2026/09/22/proyecto-busca-regular-scooters-electricos-de-alta-velocidad-exigiria-licencia-seguro-y-ser-mayor-de-18-anos.html' },
    { title: 'Pacto Global Chile: Bike Itaú', url: 'https://conecta.pactoglobal.cl/casos-de-empresas/bike-itau-impulsando-una-movilidad-urbana-mas-sostenible/' },
  ],
};

export default guide;
