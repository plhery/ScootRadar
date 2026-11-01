import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'scooters-electricos-rancagua',
  topic: 'rancagua',
  name: 'Scooters eléctricos en Rancagua',
  title: 'Scooters eléctricos Rancagua: arriendo con Whoosh (2026)',
  description: 'Scooters eléctricos Rancagua: arriendo con Whoosh en Rancagua y Machalí, la estación de trenes, la Plaza de los Héroes, casco y lo que cobra Whoosh.',
  headline: 'Scooters eléctricos en Rancagua: arriendo con Whoosh, la estación, la Plaza de los Héroes, Machalí y las reglas para andar',
  lede: 'El arriendo de scooters en Rancagua es con una app, Whoosh, que opera desde el 8 de septiembre de 2025 en Rancagua y Machalí. Sus scooters se toman y se dejan en las zonas «P» de la app, que te muestra el precio. Para la ley son ciclos: ciclovía o calzada, casco y la vereda solo por excepción. La Plaza de los Héroes y los paseos del centro son peatonales.',
  published: '2026-11-01',
  updated: '2026-11-01',
  city: 'cl:Rancagua',
  sections: [
    {
      heading: '¿Qué scooters de arriendo hay en Rancagua?',
      blocks: [
        'Los scooters eléctricos de Rancagua son de **Whoosh**, la misma empresa que los arrienda en Santiago, [La Serena](guide:la-serena) y [Pucón](guide:pucon):',
        {
          list: [
            '**La llegada.** Whoosh partió el lunes 8 de septiembre de 2025 en Rancagua y Machalí, con 150 scooters: 100 en Rancagua y 50 en Machalí, en puntos como la Universidad de O’Higgins, el Hospital Regional, el Teatro Municipal y la estación de trenes (El Tipógrafo). Para ese diario, fue una gestión municipal, con 76 puntos previstos en la comuna de Rancagua.',
            '**El crecimiento.** En marzo de 2026, Whoosh pasaba de 350 scooters en Rancagua (Diario VI Región, vía TransOHiggins), y entre mayo y agosto pasó de 383 a 455 (Última Hora, vía TransOHiggins).',
            '**Las reglas locales.** En sus noticias, la municipalidad no ha anunciado una ordenanza, un permiso ni un cobro para los scooters de arriendo, y su ordenanza de incivilidades de octubre de 2022 no los nombra.',
          ],
        },
        'Hoy, Whoosh es la única empresa que arrienda scooters en Rancagua y Machalí: ni la municipalidad ni la prensa regional nombran otra, como Lime o JET.',
        'El 31 de octubre de 2026 a las 22:03, hora de Chile, el [mapa de Rancagua](map:cl:Rancagua) mostraba unos 400 scooters de Whoosh estacionados, según su último recuento. Esa cifra junta Rancagua y Machalí: el mapa muestra los Whoosh de las dos comunas bajo Rancagua, y a las 22:44 cerca de uno de cada seis estaba en Machalí.',
        'El mapa muestra cada scooter estacionado, su batería y cuántos kilómetros le quedan; no precios, zonas «P», zonas de velocidad reducida ni el límite de la zona permitida. Para los pasos en la app, mira [nuestra guía para arrendar](guide:how-to-rent), escrita para España, donde la ley es otra.',
      ],
    },
    {
      heading: '¿Cuánto cuesta arrendar un scooter en Rancagua?',
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
        'Si el scooter se pierde por una infracción tuya, Whoosh te cobra $1.340.000.',
      ],
    },
    {
      heading: '¿Por dónde puedes andar en scooter? Ciclovía, calzada y vereda',
      blocks: [
        'En todo Chile rige la Ley de Tránsito (Ley 18.290), reformada en 2018 por la Ley 21.088, de convivencia vial. Para ella, un vehículo con motor eléctrico auxiliar de hasta 0,25 kW, que deja de impulsar a los 25 km/h, es un **ciclo** (art. 2), como una bicicleta. El Decreto 102 de Transportes fija el equipo de seguridad:',
        {
          table: {
            caption: 'Normas para andar en scooter en Rancagua, al 1 de noviembre de 2026',
            head: ['Norma', 'Qué dice', 'Fuente'],
            rows: [
              ['Por dónde', 'Por la ciclovía; si no hay, por la pista derecha de la calzada', 'Ley 18.290, art. 222'],
              ['Vereda', 'Solo si no hay ciclovía y eres menor de 14 años o adulto mayor, vas con niños menores de 7 o tienes una discapacidad o movilidad reducida, o si la ciclovía, la calzada o el clima hacen peligroso seguir. A velocidad de peatón y con preferencia para él', 'Ley 18.290, art. 222'],
              ['Cruces peatonales', 'Detente y crúzalo a velocidad de peatón; si hay mucha gente, bájate', 'Ley 18.290, art. 222'],
              ['Casco', 'Obligatorio para quien maneja y su acompañante', 'Decreto 102, art. 20'],
              ['Luces', 'Blanca o amarilla adelante y roja atrás, de media hora después de la puesta de sol a media hora antes del amanecer, y ropa reflectante', 'Decreto 102, arts. 19 y 21'],
              ['Pasajeros', 'Ninguno: solo las personas para las que el vehículo fue diseñado', 'Decreto 102, art. 22'],
              ['Alcohol y drogas', 'Prohibido manejar cualquier vehículo bajo su influencia', 'Ley 18.290, art. 110'],
              ['Velocidad', 'Los Whoosh llegan a 25 km/h, el máximo que fija la norma', 'El Tipógrafo, 9 de septiembre de 2025'],
              ['Edad', '18 años para arrendar un Whoosh, de a uno y con casco', 'Términos de Whoosh y la municipalidad'],
            ],
          },
        },
        'En noviembre de 2025, el Ministerio de Transportes anunció en T13 multas de 0,5 a 1 UTM (unos $36.000 a $72.000 en noviembre de 2026) desde el 1 de enero de 2026, y el retiro de los scooters que pasen de 25 km/h.',
        'Cuando partió el servicio, las autoridades recordaron que el casco es obligatorio y que los scooters van por la ciclovía o la pista derecha de la calzada, nunca por la vereda (El Tipógrafo, septiembre de 2025).',
        'Según la municipalidad (16 de mayo de 2026), un equipo municipal de Seguridad Pública y personal de Whoosh hicieron una fiscalización preventiva en el centro, con partes de cortesía, sin valor monetario. «Una acción tan simple como usar casco o circular por donde corresponde puede evitar accidentes», dijo el alcalde, Raimundo Agliati, que recordó que los scooters son para mayores de 18 años y de a uno.',
      ],
    },
    {
      heading: 'La Plaza de los Héroes, la estación, la UOH, las ciclovías y Machalí',
      blocks: [
        {
          list: [
            '**Plaza de los Héroes y paseos.** La plaza es peatonal, como los paseos Independencia y Estado, que salen de ella (Wikipedia). Para la Ley de Tránsito, un ciclo va por la ciclovía o la calzada, y por donde caminan los peatones solo por excepción: bájate y camina con el scooter. A las 22:44 del 31 de octubre, el Whoosh más cercano al centro de la plaza estaba a casi 90 metros.',
            '**Estación Rancagua.** Para Whoosh, la estación de EFE, donde termina el tren Rancagua–Estación Central, es uno de sus puntos clave: desde ahí salen viajes hacia el centro y los barrios, por ejes como la Avenida Libertador Bernardo O’Higgins, Membrillar y Miguel Ramírez (Última Hora, octubre de 2026). A las 22:44, el mapa mostraba unos 25 Whoosh a menos de 150 metros de ella.',
            '**EFE Bike.** Si llegas a la estación en tu bicicleta, tiene 96 bicicleteros nuevos desde septiembre de 2025, gratis para los inscritos en EFE Bike y por 24 horas como máximo (Codelco).',
            '**Universidad de O’Higgins.** Su campus de Rancagua fue uno de los primeros puntos de Whoosh (El Tipógrafo). A las 22:44, el mapa mostraba unos 18 Whoosh a menos de 150 metros.',
            '**Ciclovías.** En junio de 2026, la municipalidad publicó una licitación de más de $510 millones para más de 5 km de ciclovías, en la Avenida La Compañía y San Martín, y un cruce; en julio firmó convenios con el Gobierno Regional (FRIL) para conservar las de la Avenida Millán y la Avenida República de Chile (municipalidad).',
            '**Machalí.** Whoosh partió allí el mismo día que en Rancagua, y su alcalde, Juan Carlos Abud, habló de viajes «desde Machalí hacia Rancagua o viceversa» (Última Hora, vía TransOHiggins). La web de Whoosh nombra Rancagua entre sus ciudades, no Machalí.',
          ],
        },
      ],
    },
    {
      heading: 'Dónde estacionar, micros y tren',
      blocks: [
        {
          list: [
            '**Zonas «P».** Según la web de Whoosh (octubre de 2026), sus scooters solo se toman y se dejan en las zonas «P» de la app, que aprueba la municipalidad; algunas no tienen marca en el suelo. Déjalo paralelo a una pared, sin bloquear entradas, salidas ni veredas, y nunca sobre el pasto.',
            '**La ley.** La Ley de Tránsito pide dejar las bicicletas de preferencia en lugares habilitados, con espacio para los peatones, y prohíbe amarrarlas en paraderos, pasos de peatones o estacionamientos para personas con discapacidad (art. 224).',
            '**Micros.** Desde el 29 de agosto de 2025, las micros de Rancagua no aceptan efectivo: se paga con tarjeta Bipay, TNE, QR en la app BipayWallet o tarjeta bancaria sin contacto, en las líneas 100 a 600 (municipalidad, julio de 2025).',
            '**Con un Whoosh, no.** Sus términos prohíben llevarlo en un auto, una micro, un taxi o un tren. Termina el viaje en una «P» y sigue en micro o en tren.',
          ],
        },
        'El tren te deja en [Santiago](guide:santiago-de-chile), donde Whoosh también arrienda y que tiene su propia guía.',
      ],
    },
    {
      heading: 'Consejos para andar en scooter en Rancagua',
      blocks: [
        {
          list: [
            '**Mira la app antes de partir**: la zona permitida, las zonas «P» y las de velocidad reducida, que Whoosh marca en naranja.',
            '**Seguro.** El de accidentes de Whoosh te cubre solo si respetas las normas de tránsito, como usar casco y ser mayor de edad.',
            '**Peso.** Whoosh admite hasta 100 kg y una sola persona.',
            '**Escuelas de conducción.** Whoosh las organiza con la municipalidad, con una parte teórica y otra práctica (Diario VI Región, marzo de 2026).',
          ],
        },
      ],
    },
    {
      heading: '¿Sabías que…?',
      blocks: [
        {
          list: [
            '**En abril de 2026, los Whoosh de Rancagua sumaron más de 40.000 viajes**, su mejor mes; ese año, el viaje medio duró entre 9 y 12 minutos y recorrió, sobre todo, entre 1,7 y 2,3 km, según la empresa (Última Hora, vía TransOHiggins).',
            '**Dos calles atraviesan la Plaza de los Héroes formando una cruz**: de ahí el nombre con que Manso de Velasco fundó la villa el 5 de octubre de 1743, Santa Cruz de Triana (Wikipedia).',
            '**En esa plaza se libró la Batalla de Rancagua, el 1 y 2 de octubre de 1814**; su monumento a O’Higgins es de 1914, por el centenario (Wikipedia).',
            '**Las vías del tren llegaron a Rancagua el 25 de diciembre de 1859** (Wikipedia), y la estación tiene bicicletero desde 2020: partió con 56 plazas, de las que se ocupaban en promedio 45 (Codelco).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: '¿Cuánto cuesta arrendar un scooter eléctrico en Rancagua?',
      answer: 'La app de Whoosh te muestra el precio antes del viaje: un costo de inicio más un precio por minuto, que cambia según la ciudad, la demanda y tu plan.',
    },
    {
      question: '¿Qué app necesito para los scooters de Rancagua?',
      answer: 'Whoosh, en Rancagua y Machalí desde septiembre de 2025. Es la misma app que en Santiago, La Serena y Pucón.',
    },
    {
      question: '¿Es obligatorio el casco para andar en scooter en Rancagua?',
      answer: 'Sí. Los scooters de arriendo cuentan como ciclos, y el Decreto 102 de Transportes obliga a usar casco a quien maneja un ciclo. Sin casco, además, el seguro de Whoosh no te cubre.',
    },
    {
      question: '¿Whoosh Rancagua funciona también en Machalí?',
      answer: 'Sí. Whoosh partió el 8 de septiembre de 2025 en las dos comunas, y el mapa muestra los scooters de Machalí bajo Rancagua.',
    },
    {
      question: '¿Puedo andar en scooter por la Plaza de los Héroes o el Paseo Independencia?',
      answer: 'Son peatonales, y para la Ley de Tránsito un ciclo va por la ciclovía o la calzada, salvo excepciones: lo seguro es bajarte y caminar.',
    },
    {
      question: '¿Puedo subir un Whoosh al tren a Santiago?',
      answer: 'No. Sus términos prohíben subirlo a un tren, una micro o un auto. Termina el viaje en una zona «P» cerca de la estación.',
    },
  ],
  sources: [
    { title: 'Municipalidad de Rancagua: fiscalización educativa de scooters (mayo de 2026)', url: 'https://munirancagua.gob.cl/noticias/municipalidad-de-rancagua-impulsa-convivencia-vial-con-fiscalizacion-educativa-de-scooters' },
    { title: 'Municipalidad de Rancagua: inversión para recuperar ciclovías (junio de 2026)', url: 'https://munirancagua.gob.cl/noticias/rancagua-municipio-anuncio-inversion-de-mas-de-510-millones-para-recuperar-ciclovias-y-reforzar-la-seguridad-vial' },
    { title: 'Municipalidad de Rancagua: conservación de ciclovías (julio de 2026)', url: 'https://munirancagua.gob.cl/noticias/rancagua-municipio-ejecutara-nuevas-obras-de-pavimentacion-semaforizacion-y-conservacion-de-ciclovias' },
    { title: 'Municipalidad de Rancagua: pago electrónico en las micros (julio de 2025)', url: 'https://munirancagua.gob.cl/noticias/rancagua-da-el-salto-al-transporte-publico-digital-desde-el-29-de-agosto-el-pago-del-pasaje-sera-100-electronico' },
    { title: 'Municipalidad de Rancagua: ordenanza de incivilidades (2022)', url: 'https://transparencia.munirancagua.gob.cl/documentos/control/2022-10-ORD-INCIVILIDADES.pdf' },
    { title: 'BCN: Ley de Tránsito, texto vigente', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1007469' },
    { title: 'BCN: Ley 21.088 (2018)', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1118358' },
    { title: 'BCN: Decreto 102 de Transportes, seguridad de los ciclos', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1162453' },
    { title: 'SII: valores de la UTM en 2026', url: 'https://www.sii.cl/valores_y_fechas/utm/utm2026.htm' },
    { title: 'Whoosh: términos para Chile', url: 'https://whoosh.bike/terms_cl/es' },
    { title: 'Whoosh: preguntas frecuentes', url: 'https://whoosh.bike/faq/es_la' },
    { title: 'Whoosh: zonas de parking', url: 'https://whoosh.bike/parking_rules/es_la' },
    { title: 'Whoosh: ciudades en Latinoamérica', url: 'https://whoosh.bike/es_la' },
    { title: 'El Tipógrafo: Rancagua y Machalí suman los scooters (septiembre de 2025)', url: 'https://eltipografo.cl/2025/09/rancagua-y-machali-suman-nueva-alternativa-de-transporte-con-scooters-electricos' },
    { title: 'El Tipógrafo: parte el servicio de scooters (septiembre de 2025)', url: 'https://eltipografo.cl/2025/09/nueva-alternativa-de-transporte-en-ohiggins-rancagua-y-machali-activan-servicio-de-scooters-electricos' },
    { title: 'TransOHiggins: inicio de la operación en Rancagua y Machalí (septiembre de 2025)', url: 'https://www.transohiggins.com/rancagua-y-machali-dan-inicio-a-la-operacion-de-150-scooters-electricos-para-sus-vecinos/' },
    { title: 'TransOHiggins, con Diario VI Región: más de 300 scooters (marzo de 2026)', url: 'https://www.transohiggins.com/whoosh-consolida-su-operacion-en-rancagua-con-mas-de-300-scooters-electricos-en-circulacion/' },
    { title: 'TransOHiggins, con Última Hora: un año de Whoosh en Rancagua (octubre de 2026)', url: 'https://www.transohiggins.com/rancagua-whoosh-cumple-un-ano-con-cerca-de-30-mil-usuarios-y-mas-de-450-scooter-disponibles/' },
    { title: 'Codelco: nuevos bicicleteros en la Estación Rancagua (septiembre de 2025)', url: 'https://codelco.com/division-el-teniente-renueva-bicicleteros-de-la-estacion-de' },
    { title: 'Wikipedia: Plaza de los Héroes (Rancagua)', url: 'https://es.wikipedia.org/wiki/Plaza_de_los_H%C3%A9roes_(Rancagua)' },
    { title: 'Wikipedia: Estación Rancagua', url: 'https://es.wikipedia.org/wiki/Estaci%C3%B3n_Rancagua' },
    { title: 'T13: fiscalización a scooters (noviembre de 2025)', url: 'https://www.t13.cl/noticia/nacional/parte-fiscalizacion-scooters-cuales-son-las-sanciones-desde-cuando-se-aplicaran-20-11-2025' },
  ],
};

export default guide;
