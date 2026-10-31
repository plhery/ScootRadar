import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'scooters-electricos-la-serena',
  topic: 'la-serena',
  name: 'Scooters eléctricos en La Serena',
  title: 'Scooters eléctricos La Serena: arriendo con Whoosh (2026)',
  description: 'Scooters eléctricos La Serena: arriendo con Whoosh en La Serena y Coquimbo, zonas «P», 18 km/h en la Avenida del Mar, casco y lo que cobra Whoosh.',
  headline: 'Scooters eléctricos en La Serena: arriendo con Whoosh, la Avenida del Mar, Coquimbo y las reglas para andar',
  lede: 'El arriendo de scooters en La Serena es con una app, Whoosh, que opera desde diciembre de 2025 por un convenio con la municipalidad y también arrienda en Coquimbo. Sus scooters se toman y se dejan en las zonas «P» de la app, y desde fines de enero de 2026 no pasan de 18 km/h entre el Faro Monumental y Canto del Agua. El precio lo ves en la app. Para la ley son ciclos: ciclovía o calzada, casco y la vereda solo por excepción.',
  published: '2026-10-31',
  updated: '2026-10-31',
  city: 'cl:La Serena',
  sections: [
    {
      heading: '¿Qué scooters de arriendo hay en La Serena?',
      blocks: [
        'Los scooters eléctricos de La Serena son de **Whoosh**, la misma empresa que los arrienda en Santiago y Viña del Mar:',
        {
          list: [
            '**El anuncio.** El 11 de noviembre de 2025, la municipalidad anunció hasta 600 scooters, sobre todo en los sectores turísticos y cerca de universidades e institutos, para unir el casco histórico con la Avenida del Mar.',
            '**El convenio.** El 2 de diciembre de 2025, el administrador municipal, Halid Daud, firmó el convenio con Whoosh, según La Serena Online. Partió con 400 scooters en 96 puntos de estacionamiento autorizados, en sectores como la Avenida del Mar y Francisco de Aguirre, según la municipalidad.',
            '**Puerta del Mar.** En septiembre de 2026, la municipalidad contó a El Día que el servicio se extendió hasta ese sector, con muchos estudiantes universitarios y trabajadores.',
          ],
        },
        'Ni la municipalidad ni la prensa local nombran otra empresa en La Serena o Coquimbo, como Lime o JET.',
        'El 31 de octubre de 2026 a las 00:52, hora de Chile, el [mapa de La Serena](map:cl:La Serena) mostraba unos 670 scooters de Whoosh estacionados, según su último recuento. Esa cifra junta La Serena y Coquimbo: el mapa muestra los Whoosh de las dos ciudades bajo La Serena.',
        'El mapa muestra cada scooter estacionado, su batería y cuántos kilómetros le quedan; no precios, zonas «P» ni zonas de velocidad reducida. Para los pasos en la app, mira [nuestra guía para arrendar](guide:how-to-rent), escrita para España, donde la ley es otra.',
      ],
    },
    {
      heading: '¿Cuánto cuesta arrendar un scooter en La Serena?',
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
        'Si el scooter se pierde por una infracción tuya, Whoosh te cobra $1.340.000. En febrero de 2026, la municipalidad dijo a El Día que no había cursado multas, pero Whoosh sí, y que la falta más común era andar sin casco, seguida de andar de a dos y de los menores al mando.',
      ],
    },
    {
      heading: '¿Por dónde puedes andar en scooter? Ciclovía, calzada y vereda',
      blocks: [
        'En todo Chile rige la Ley de Tránsito (Ley 18.290), reformada en 2018 por la Ley 21.088, de convivencia vial. Para ella, un vehículo con motor eléctrico auxiliar de hasta 0,25 kW, que deja de impulsar a los 25 km/h, es un **ciclo** (art. 2), como una bicicleta. El Decreto 102 de Transportes fija el equipo de seguridad:',
        {
          table: {
            caption: 'Normas para andar en scooter en La Serena, al 31 de octubre de 2026',
            head: ['Norma', 'Qué dice', 'Fuente'],
            rows: [
              ['Por dónde', 'Por la ciclovía; si no hay, por la pista derecha de la calzada', 'Ley 18.290, art. 222'],
              ['Vereda', 'Solo si no hay ciclovía y eres menor de 14 años o adulto mayor, vas con niños menores de 7 o tienes una discapacidad o movilidad reducida, o si la ciclovía, la calzada o el clima hacen peligroso seguir. A velocidad de peatón y con preferencia para él', 'Ley 18.290, art. 222'],
              ['Cruces peatonales', 'Detente y crúzalo a velocidad de peatón; si hay mucha gente, bájate', 'Ley 18.290, art. 222'],
              ['Casco', 'Obligatorio para quien maneja y su acompañante', 'Decreto 102, art. 20'],
              ['Luces', 'Blanca o amarilla adelante y roja atrás, de media hora después de la puesta de sol a media hora antes del amanecer, y ropa reflectante', 'Decreto 102, arts. 19 y 21'],
              ['Pasajeros', 'Ninguno: solo las personas para las que el vehículo fue diseñado', 'Decreto 102, art. 22'],
              ['Alcohol y drogas', 'Prohibido manejar cualquier vehículo bajo su influencia', 'Ley 18.290, art. 110'],
              ['Velocidad', 'Los Whoosh llegan a 25 km/h; desde fines de enero de 2026, a 18 km/h en la Avenida del Mar entre el Faro Monumental y Canto del Agua', 'Whoosh y la municipalidad'],
              ['Edad', '18 años para arrendar un Whoosh', 'Términos de Whoosh'],
            ],
          },
        },
        'En noviembre de 2025, el Ministerio de Transportes anunció en T13 multas de 0,5 a 1 UTM (unos $36.000 a $72.000 en octubre de 2026) desde el 1 de enero de 2026, y el retiro de los scooters que pasen de 25 km/h. En La Serena, los inspectores municipales y Carabineros pueden cursar infracciones y derivarlas al Juzgado de Policía Local, según la municipalidad (El Día, enero de 2026).',
        'Un proyecto de ley de las diputadas Catalina Del Real y Macarena Santelices (El Día, septiembre de 2026) exigiría 18 años, licencia y seguro para los de más de 25 km/h o 0,25 kW, y limitaría a 25 km/h los de arriendo. Aún no es ley.',
      ],
    },
    {
      heading: 'Avenida del Mar, Faro Monumental y centro histórico',
      blocks: [
        {
          list: [
            '**Avenida del Mar.** A fines de enero de 2026, el municipio anunció medidas. Según su jefa de Tránsito, Alejandra Erazo, la velocidad máxima bajó de 25 a 18 km/h entre el Faro Monumental y Canto del Agua, hubo estacionamientos exclusivos con señalética y más controles de inspectores, de Whoosh y de Carabineros (El Día, 14 de febrero).',
            '**Accidentes.** La municipalidad contó 21 de enero a mediados de septiembre de 2026: 9 en la Avenida del Mar en enero, 4 en febrero y 8 desde marzo, sobre todo raspaduras y golpes (El Día, 15 de septiembre).',
            '**Controles de noche.** Desde mediados de diciembre de 2025 hay un punto de seguridad municipal en la Avenida del Mar con Cuatro Esquinas, y en enero sus inspectores recorrían a diario la costanera hasta Canto del Agua, donde La Serena limita con Coquimbo (El Día).',
            '**Centro histórico.** Lo que ha publicado la municipalidad no fija reglas propias para el centro: rigen la Ley de Tránsito y las zonas «P». En la madrugada del 31 de octubre, el mapa mostraba unos 20 Whoosh en torno a la Plaza de Armas, vistos por última vez a las 00:14.',
            '**Universidad de La Serena.** A las 00:49, el mapa mostraba 10 Whoosh estacionados junto a ella.',
            '**Playas.** Whoosh prohíbe andar fuera de superficies pavimentadas: no a la arena.',
          ],
        },
      ],
    },
    {
      heading: 'Coquimbo: la Avenida Costanera y Punta Mira Sur',
      blocks: [
        'Whoosh llegó a Coquimbo antes que a La Serena, el 12 de noviembre de 2025, con 200 scooters que podrían llegar a 500 y 30 puntos de estacionamiento, en sectores como la Avenida Costanera y Punta Mira Sur, según El Día. Las reglas son las mismas: mayores de 18 años, de a uno y con casco.',
        {
          list: [
            '**Multas.** En febrero de 2026, Coquimbo dijo que no multaría hasta el fin del verano. En septiembre, su director de Seguridad Pública dijo que las multas parten en 0,5 UTM, por andar de a dos, con exceso de velocidad o por la vereda, sin implementos de seguridad, sin respetar las señales o dejando que lo use un menor (El Día).',
            '**De una ciudad a la otra.** El 31 de octubre, el mapa mostraba Whoosh a ambos lados de Canto del Agua. Si sales de la zona permitida, Whoosh te cobra $10.000 y puede bloquear el scooter.',
          ],
        },
      ],
    },
    {
      heading: 'Dónde estacionar, micros y colectivos',
      blocks: [
        {
          list: [
            '**Zonas «P».** Según la web de Whoosh (octubre de 2026), sus scooters solo se toman y se dejan en las zonas «P» de la app, que aprueba la municipalidad; algunas no tienen marca en el suelo. Déjalo paralelo a una pared, sin bloquear entradas, salidas ni veredas, y nunca sobre el pasto.',
            '**La ley.** La Ley de Tránsito pide dejar las bicicletas de preferencia en lugares habilitados, con espacio para los peatones, y prohíbe amarrarlas en paraderos, pasos de peatones o estacionamientos para personas con discapacidad (art. 224).',
            '**Micros, colectivos y taxis.** Con un Whoosh, no: sus términos prohíben llevarlo en un auto, un bus, un taxi o cualquier otro vehículo. Termina el viaje en una «P» y sigue en micro o colectivo.',
          ],
        },
        'Whoosh arrienda también en [Viña del Mar](guide:vina-del-mar) y en [Santiago](guide:santiago-de-chile), que tienen su propia guía.',
      ],
    },
    {
      heading: 'Consejos para andar en scooter en La Serena',
      blocks: [
        {
          list: [
            '**Mira la app antes de partir**: la zona permitida, las zonas «P» y las de velocidad reducida, que Whoosh marca en naranja.',
            '**Seguro.** El de accidentes de Whoosh te cubre solo si respetas las normas de tránsito, como usar casco y ser mayor de edad.',
            '**Peso.** Whoosh admite hasta 100 kg y una sola persona.',
          ],
        },
      ],
    },
    {
      heading: '¿Sabías que…?',
      blocks: [
        {
          list: [
            '**Para su alcalde, Ali Manouchehri, Coquimbo fue la primera comuna del norte de Chile con scooters de arriendo**: Whoosh llegó el 12 de noviembre de 2025, 20 días antes del convenio de La Serena (El Día).',
            '**El 27 de enero de 2026 alguien tiró un scooter al mar**, y gracias a su sistema de rastreo y alerta se recuperó pronto, según El Día.',
            '**Para los jóvenes de San Juan, Argentina, los scooters fueron «el imperdible del verano» de 2026 en La Serena**, según Diario de Cuyo.',
            '**El Faro Monumental es de mediados del siglo XX**: la Armada lo levantó entre 1950 y 1951, y es Monumento Histórico desde 2011, según el Consejo de Monumentos Nacionales.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: '¿Cuánto cuesta arrendar un scooter eléctrico en La Serena?',
      answer: 'La app de Whoosh te muestra el precio antes del viaje: un costo de inicio más un precio por minuto, que cambia según la ciudad, la demanda y tu plan.',
    },
    {
      question: '¿Qué app necesito para los scooters de La Serena?',
      answer: 'Whoosh, que arrienda scooters en La Serena y Coquimbo en octubre de 2026. La misma app sirve en Santiago y Viña del Mar.',
    },
    {
      question: '¿Es obligatorio el casco para andar en scooter en La Serena?',
      answer: 'Sí. Los scooters de arriendo cuentan como ciclos, y el Decreto 102 de Transportes obliga a usar casco a quien maneja un ciclo. Sin casco, además, el seguro de Whoosh no te cubre.',
    },
    {
      question: '¿Puedo andar en scooter por la vereda de la Avenida del Mar?',
      answer: 'Por regla general, no: la Ley de Tránsito te manda a la ciclovía o a la pista derecha de la calzada, y la vereda queda para excepciones, a velocidad de peatón.',
    },
    {
      question: '¿Hay scooters de arriendo en Coquimbo?',
      answer: 'Sí. Whoosh arrienda en Coquimbo desde el 12 de noviembre de 2025, en sectores como la Avenida Costanera y Punta Mira Sur, con las mismas reglas.',
    },
    {
      question: '¿Los scooters de La Serena tienen horario?',
      answer: 'Ni los términos de Whoosh ni las reglas que anunció la municipalidad fijan un horario. Eso sí, Whoosh puede terminar un arriendo a las cuatro horas.',
    },
  ],
  sources: [
    { title: 'Municipalidad de La Serena: anuncio de los scooters (noviembre de 2025)', url: 'https://laserena.cl/noticia/989' },
    { title: 'Municipalidad de La Serena: llega Whoosh (diciembre de 2025)', url: 'https://laserena.cl/noticia/998' },
    { title: 'BCN: Ley de Tránsito, texto vigente', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1007469' },
    { title: 'BCN: Ley 21.088 (2018)', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1118358' },
    { title: 'BCN: Decreto 102 de Transportes, seguridad de los ciclos', url: 'https://www.bcn.cl/leychile/navegar?idNorma=1162453' },
    { title: 'SII: valores de la UTM en 2026', url: 'https://www.sii.cl/valores_y_fechas/utm/utm2026.htm' },
    { title: 'Whoosh: términos para Chile', url: 'https://whoosh.bike/terms_cl/es' },
    { title: 'Whoosh: preguntas frecuentes', url: 'https://whoosh.bike/faq/es_la' },
    { title: 'Whoosh: zonas de parking', url: 'https://whoosh.bike/parking_rules/es_la' },
    { title: 'Consejo de Monumentos Nacionales: cuaderno de faros (2025)', url: 'https://www.monumentos.gob.cl/sites/default/files/2025-04/Cuaderno%20Faros%20MN.pdf' },
    { title: 'La Serena Online: firma del convenio con Whoosh (diciembre de 2025)', url: 'https://laserenaonline.cl/2025/12/03/la-serena-amplia-servicio-de-arriendo-de-scooter-electricos-en-la-conurbacion/' },
    { title: 'El Día: llegan los scooters a Coquimbo (noviembre de 2025)', url: 'https://www.diarioeldia.cl/noticias/2025/11/12/129667-cuanto-cuesta-y-donde-encontrarlos-los-primeros-scooters-electricos-del-norte-llegan-a-coquimbo' },
    { title: 'El Día: mal uso de los scooters (enero de 2026)', url: 'https://www.diarioeldia.cl/noticias/2026/01/05/131782-turistas-y-residentes-de-la-serena-y-coquimbo-en-la-mira-por-mal-uso-de-scooters-electricos' },
    { title: 'El Día: controles nocturnos en la Avenida del Mar (enero de 2026)', url: 'https://www.diarioeldia.cl/noticias/2026/01/25/132416-drones-fiscalizacion-y-scooters-asi-operan-los-controles-nocturnos-en-la-avenida-del-mar' },
    { title: 'El Día: disminuyen los accidentes (febrero de 2026)', url: 'https://www.diarioeldia.cl/noticias/2026/02/14/132815-disminuyen-accidentes-por-uso-indebido-de-scooters-en-la-serena' },
    { title: 'El Día: proyecto de ley y accidentes (septiembre de 2026)', url: 'https://www.diarioeldia.cl/noticias/2026/09/15/151171-scooters-electricos-proyecto-busca-exigir-licencia-seguro-y-mayoria-de-edad' },
    { title: 'T13: fiscalización a scooters (noviembre de 2025)', url: 'https://www.t13.cl/noticia/nacional/parte-fiscalizacion-scooters-cuales-son-las-sanciones-desde-cuando-se-aplicaran-20-11-2025' },
    { title: 'Diario de Cuyo: los sanjuaninos en La Serena (enero de 2026)', url: 'https://www.diariodecuyo.com.ar/sanjuan/vacaciones-a-su-ritmo-asi-viven-los-jovenes-y-adolescentes-sanjuaninos-el-verano-en-la-serena-1821506.html' },
  ],
};

export default guide;
