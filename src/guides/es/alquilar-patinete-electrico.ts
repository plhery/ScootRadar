import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'es',
  slug: 'alquilar-patinete-electrico',
  topic: 'how-to-rent',
  name: 'Cómo alquilar un patinete eléctrico con app',
  title: 'Alquilar patinete eléctrico con app: dónde, precio y casco',
  description: 'Cómo alquilar un patinete eléctrico con app en España: dónde quedan, paso a paso, precios, edad, casco obligatorio, dónde aparcar y qué hacer si te caes.',
  headline: 'Cómo alquilar un patinete eléctrico con app en España: paso a paso, precios y dónde quedan',
  lede: 'Para alquilar un patinete eléctrico con app, descarga la del operador, regístrate con tu móvil y una tarjeta, escanea el código QR del manillar y, al acabar, aparca donde te deje la app y haz la foto. Necesitas 18 años y, desde el 1 de octubre de 2026, tu propio casco. A 13 de octubre de 2026 no hay patinetes compartidos en Madrid, Barcelona, Valencia, Sevilla ni Málaga: quedan sobre todo en Gijón, Getafe, el sur de Tenerife, Fuerteventura y la Costa Blanca, con Bird o Hopp. Pagas un desbloqueo más cada minuto: con Hopp en Torrevieja, diez minutos salen por 4,29 €.',
  published: '2026-10-13',
  updated: '2026-10-13',
  sections: [
    {
      heading: '¿Hay patinetes de alquiler en Madrid? Dónde quedan en España',
      blocks: [
        'Antes de descargar ninguna app, comprueba si en tu ciudad quedan patinetes. En **Madrid** no hay desde octubre de 2024: el Ayuntamiento revocó en septiembre los permisos de Lime, Dott y Tier (6000 patinetes) y no concederá otros nuevos. Según la prensa, tampoco los hay en **Barcelona**, que nunca los autorizó, ni en **Valencia, Sevilla, Málaga, Palma ni Bilbao**, y Tarragona se quedó sin ellos en septiembre de 2026.',
        'Esta guía va del alquiler con app, por minutos, del patinete que coges en la calle, no de las tiendas que alquilan por horas o por meses. A 13 de octubre de 2026, los patinetes compartidos quedan sobre todo en ciudades medianas y zonas turísticas:',
        {
          list: [
            '**Bird:** [Gijón](map:es:Gijón), [Getafe](map:es:Getafe), el sur de Tenerife y Fuerteventura (Caleta de Fuste, Costa Calma y Morro Jable).',
            '**Hopp:** [Torrevieja](map:es:Torrevieja) y Pilar de la Horadada, en la Costa Blanca; Jávea (y Dénia, según su web), en la Marina Alta; y el sur de Tenerife, en [Playa de las Américas](map:es:Playa de las Américas) y Golf del Sur.',
            '**Dott** tiene condiciones y seguro para España y Canarias, pero no hemos podido confirmar en qué ciudades alquila patinetes.',
          ],
        },
        'En Oviedo, según la prensa, Bird gestiona desde junio de 2025 el servicio municipal, con 200 patinetes en 171 puntos fijos.',
        'Para ver juntos los de Bird y Hopp en estos lugares, abre [nuestro mapa](/map): verás el tiempo a pie y, en Hopp, una estimación del precio; un botón te lleva a la app del operador. No incluye Oviedo, donde Bird no publica sus datos, y otros operadores pueden funcionar sin publicarlos.',
      ],
    },
    {
      heading: 'Cómo alquilar un patinete eléctrico, paso a paso',
      blocks: [
        '¿Cómo funcionan los patinetes de alquiler? Cada operador tiene su app, y necesitas una cuenta en la del patinete que vas a coger. Los pasos apenas cambian de uno a otro:',
        {
          steps: [
            '**Descarga la app y regístrate** con tu móvil y un código por SMS, o con tu correo. En Hopp también puedes entrar con tu cuenta de Apple o de Google.',
            '**Añade una forma de pago:** una tarjeta, o Apple Pay, Google Pay o PayPal si el operador los acepta.',
            '**Mira el precio** antes de desbloquear: toca el patinete en el mapa de la app o escanéalo.',
            '**Ponte tu casco**, obligatorio también en los de alquiler, y de noche lleva un elemento reflectante o luminoso.',
            '**Escanea el código QR** del manillar, o escribe el número que lleva impreso.',
            '**Revisa frenos, ruedas, luces y batería.** Si algo falla, cancela y avisa en la app.',
            '**Ve tú solo**, por la calzada o el carril bici donde se permita, nunca por la acera.',
            '**Aparca donde la app te deje, termina el viaje y haz la foto.** Pagas hasta que la app confirme el final.',
            '**Revisa el recibo:** se libera la retención de la tarjeta y aparece el cargo final.',
          ],
        },
        'Si el Bird lleva candado de cable, activa el Bluetooth, pulsa el botón redondo del candado y, cuando se ponga azul, saca el cable. Reservar un Bird (hasta 30 minutos) o bloquearlo un rato (hasta 75) se paga por minuto.',
      ],
    },
    {
      heading: 'Qué piden para alquilar un patinete eléctrico: edad, casco y pago',
      blocks: [
        '**18 años** en todos los operadores (Bird, Dott, Hopp y Lime), aunque la ley permite conducir un patinete desde los 15.',
        '**Ni carné ni DNI escaneado.** No hemos encontrado ningún operador que pida escanear un documento en España: en el contrato de Bird declaras tú que tienes 18 años.',
        '**Tu casco y, de noche, tu elemento reflectante o luminoso.** Los dos los llevas tú, porque la multa (200 €) es para quien conduce, y no hemos encontrado ningún operador que preste casco. Si alquilas en vacaciones, mételos en la maleta.',
        {
          table: {
            caption: 'Formas de pago y retención en la tarjeta, según los operadores (octubre de 2026)',
            head: ['Operador', 'Formas de pago', 'Retención al empezar'],
            rows: [
              ['Hopp', 'Tarjeta, Apple Pay y Google Pay', 'Normalmente, de 5 a 8 €'],
              ['Bird', 'Tarjeta; Apple Pay, Google Pay y PayPal en algunas ciudades', 'Puede subir según dure el viaje; los bancos suelen liberarla en 7 a 10 días hábiles'],
              ['Dott', 'Tarjeta, PayPal, Apple Pay y Revolut Pay', '3 €'],
            ],
          },
        },
        'La retención no es un cargo, sino un bloqueo temporal: Hopp la libera al acabar, aunque tu banco puede tardar días en reflejarlo. **Bizum** no figura en ningún operador que hayamos consultado.',
      ],
    },
    {
      heading: '¿Cuánto cuesta alquilar un patinete eléctrico?',
      blocks: [
        'Pagas un desbloqueo y cada minuto que tienes el patinete desbloqueado, en marcha o parado. Hopp publica sus tarifas; Bird no, así que su precio solo lo ves en la app, antes de desbloquear.',
        {
          table: {
            caption: 'Tarifas de Hopp a 13 de octubre de 2026 y lo que cuesta un trayecto',
            head: ['Zona de Hopp', 'Desbloqueo + minuto', '5 min', '10 min', '20 min'],
            rows: [
              ['Costa Blanca: Torrevieja y Pilar de la Horadada', '0,99 € + 0,33 €', '2,64 €', '4,29 €', '7,59 €'],
              ['Marina Alta: Jávea y Dénia', '0,95 € + 0,25 €', '2,20 €', '3,45 €', '5,95 €'],
              ['Sur de Tenerife: Playa de las Américas y Golf del Sur', '0,95 € + 0,25 €', '2,20 €', '3,45 €', '5,95 €'],
            ],
          },
        },
        '**Un ejemplo.** Vas 12 minutos en un Hopp por Torrevieja: 0,99 € + 12 × 0,33 € = 4,95 €. Si al llegar das vueltas cinco minutos más buscando dónde dejarlo, son 17 minutos: 6,60 €. El precio final te lo da la app.',
        '**Bird**, según la prensa, rondaba los 0,15 € por minuto en Getafe y cobraba 0,22 € en Oviedo, las dos cifras de junio de 2025; el precio de hoy, en la app.',
        '**Abonos.** Con el abono de Bird (Menú › Abono, en algunos mercados) o un pase de Hopp no pagas el desbloqueo, y solo valen donde los compras.',
        'Ojo: la web española de Bolt anuncia patinetes «desde 0,15 € por minuto», pero no hemos encontrado ninguna ciudad española donde los tenga.',
      ],
    },
    {
      heading: 'Dónde aparcar el patinete y cómo terminar el viaje',
      blocks: [
        'La app te marca zonas en el mapa. En la de Bird, las rojas y las grises son de no aparcar: ahí no puedes terminar el viaje, y en algunas ciudades solo puedes acabarlo en las zonas con una «P».',
        {
          list: [
            '**En Getafe**, según la prensa local de junio de 2025, tienes que atar el Bird con su candado a algo fijo, como un aparcabicis; si no queda bien anclado, no puedes cerrar el viaje.',
            '**En Oviedo**, según la prensa, solo puedes dejarlo en uno de los 171 puntos fijos.',
            '**En cualquier sitio**, déjalo de pie y sin tapar el paso, portales ni vados. Cada ayuntamiento decide si se puede aparcar en la acera, y nunca debe estorbar a los peatones.',
          ],
        },
        {
          note: 'Mientras no termines el viaje, sigues pagando. Si dejas un Bird sin bloquear, según su contrato se te sigue cobrando hasta que finalices el viaje en la app, con un cargo máximo de 100 € por 24 horas. Si la app no te deja terminar, sal unos metros de la zona prohibida o escribe al soporte.',
        },
        {
          table: {
            caption: 'Lo que cobran los operadores en España por aparcar mal y otros incumplimientos (sus condiciones, octubre de 2026)',
            head: ['Operador', 'Aparcar mal o saltarse las normas', 'Otros cargos'],
            rows: [
              ['Bird', 'La primera vez, un aviso; la segunda, 5 €; la tercera, 20 €; a la cuarta puede rescindir tu contrato', 'Hasta 120 € si no puedes devolverlo a una zona válida y Bird tiene que recogerlo'],
              ['Dott', '50 € por cada incumplimiento de sus condiciones', 'Hasta 300 € por recuperar el patinete; 50 € de gestión si te pasa una multa'],
              ['Hopp', '30 € si no haces la foto final', '50 € por recogerlo fuera de la zona, a menos de 20 km; hasta 500 € más lejos o en un terreno privado'],
            ],
          },
        },
        'Las multas del ayuntamiento o de la policía van aparte: si le llegan al operador, te las pasa a ti.',
      ],
    },
    {
      heading: 'Normas básicas si vas en un patinete de alquiler',
      blocks: [
        'La ley es la misma que con un patinete propio, salvo el registro en la DGT y el seguro obligatorio, que son cosa del operador, el propietario. Lo que te toca a ti:',
        {
          list: [
            '**Casco** homologado o certificado y bien abrochado: sin él, 200 €, y los agentes pueden inmovilizar el patinete.',
            '**De noche** o con poca visibilidad, un elemento reflectante o luminoso homologado que se vea a 150 metros (la DGT habla de chaleco): sin él, 200 €.',
            '**Nunca por la acera:** si tienes que cruzar una, bájate y llévalo a pie. Tampoco por autopistas, autovías, carreteras interurbanas ni travesías.',
            '**Uno solo por patinete:** ir dos cuesta 100 €.',
            '**Ni el móvil en la mano ni auriculares**, aunque sea uno: 200 € cada cosa.',
            '**Alcohol:** el límite general es de 0,5 g/l en sangre, y superarlo cuesta 500 €.',
          ],
        },
        'Un patinete de alquiler tampoco puede subir al tren de Renfe. Todo lo demás, con las multas, está en nuestra guía de la [normativa del patinete eléctrico](guide:spanish-rules).',
      ],
    },
    {
      heading: 'Qué hacer si tienes un accidente con un patinete de alquiler',
      blocks: [
        {
          steps: [
            'Ponte a salvo y llama al **112** si hay heridos.',
            'Intercambia datos y haz fotos del lugar, del número del patinete y de los daños.',
            'Si hay heridos o daños, llama a la policía, como piden las condiciones de Hopp.',
            'Avisa enseguida al operador. Hopp: Costa Blanca, +34 722 143 627; Marina Alta, +34 634 451 453; Tenerife, tenerife@hopp.bike. Bird: desde la app o en hello@bird.co. Dott: desde la app o en claims-support@ridedott.com.',
            'No reconozcas la culpa en el momento, como aconseja Dott.',
          ],
        },
        'Lo que cubre el seguro depende del operador. Dott incluye en España responsabilidad civil y un seguro de accidentes para ti (invalidez permanente o fallecimiento) sin coste extra, aunque, según su centro de ayuda general, no cubre lesiones en la cabeza sin casco. El contrato de Bird no detalla ninguna cobertura y advierte de que el seguro de tu coche quizá no te cubra.',
        'Los daños que causes al patinete los pagas tú: Hopp avisa de que reparar uno puede costar hasta 2000 €.',
      ],
    },
    {
      heading: 'Alquilar un patinete fuera de España, o si vienes de fuera',
      blocks: [
        'Tu cuenta te sirve en otros países; el saldo y los abonos, no siempre:',
        {
          list: [
            '**Hopp es islandés** y aquí funciona con franquicias: la misma app vale en Reikiavik o en Tenerife, pero contratas con la franquicia local, pagas en euros y los pases solo sirven donde los compraste.',
            '**Bird:** el abono solo vale en el mercado donde lo compraste, y en un país con otra moneda necesitas un saldo nuevo.',
            '**Lisboa, Roma y París:** en Lisboa hay Lime, Bird y Bolt, y solo puedes acabar el viaje en un punto de aparcamiento marcado en la app; en Italia el casco es obligatorio (llévalo tú) y la ley exige la foto al aparcar; en París no hay patinetes compartidos desde septiembre de 2023.',
          ],
        },
        'Regístrate y añade la forma de pago antes de salir de viaje, no en la acera.',
      ],
    },
  ],
  faq: [
    {
      question: '¿Por qué no hay patinetes de alquiler en Madrid?',
      answer: 'Porque el Ayuntamiento revocó en septiembre de 2024 los permisos de Lime, Dott y Tier por incumplir las condiciones del servicio, y ha dicho que no concederá otros nuevos. Desde octubre de 2024 no queda ninguno en la ciudad. En la Comunidad de Madrid, nuestro mapa los muestra en Getafe, con Bird.',
    },
    {
      question: '¿Se puede alquilar un patinete eléctrico con 16 años?',
      answer: 'No. Bird, Dott, Hopp y Lime exigen 18 años, aunque desde el 1 de octubre de 2026 la ley permite conducir un patinete propio a partir de los 15. En los viajes en grupo de Bird y Dott, cada persona tiene que tener también 18.',
    },
    {
      question: '¿Pueden ir dos personas en un patinete de alquiler?',
      answer: 'No. La ley solo permite una persona por patinete, con una multa de 100 €, y los operadores tampoco lo aceptan. Para ir juntos, haz un viaje en grupo: Hopp deja desbloquear hasta 4 patinetes con una cuenta y Bird, añadir hasta 4 acompañantes donde lo ofrece. Quien los desbloquea paga y responde de todos, y cada uno necesita su casco.',
    },
    {
      question: '¿Cómo se llama la app para alquilar patinetes eléctricos?',
      answer: 'No hay una sola: cada operador tiene la suya, y en España son sobre todo Bird y Hopp. ScootRadar los reúne en un mapa, en las zonas que cubre, y te lleva a la app de cada uno, que es donde desbloqueas y pagas.',
    },
  ],
  sources: [
    { title: 'DGT: reforma del Reglamento General de Circulación (30 de septiembre de 2026)', url: 'https://www.dgt.es/comunicacion/notas-de-prensa/20260930-reforma-del-reglamento-de-circulacion-usuarios-vulnerables/' },
    { title: 'Ayuntamiento de Madrid: revocación de los patinetes de alquiler (5 de septiembre de 2024)', url: 'https://www.madrid.es/portales/munimadrid/es/Inicio/Actualidad/Noticias/Madrid-revoca-las-autorizaciones-de-patinetes-de-alquiler-y-ya-no-podran-circular-por-sus-calles/?vgnextfmt=default&vgnextoid=27c2dbbe991c1910VgnVCM1000001d4a900aRCRD&vgnextchannel=a12149fa40ec9410VgnVCM100000171f5a0aRCRD' },
    { title: 'Bird: contrato de alquiler para España', url: 'https://bird.co/rental-agreements/spain-es/' },
    { title: 'Bird Ayuda: formas de pago aceptadas', url: 'https://help.bird.co/hc/es/articles/360031013811' },
    { title: 'Bird Ayuda: retenciones de autorización y cargos', url: 'https://help.bird.co/hc/es/articles/17879020799124' },
    { title: 'Bird Ayuda: patinetes con candado de cable', url: 'https://help.bird.co/hc/es/articles/30300588013076' },
    { title: 'Bird Ayuda: si no puedes terminar el viaje', url: 'https://help.bird.co/hc/es/articles/5885339314068' },
    { title: 'Hopp: ubicaciones y tarifas', url: 'https://hopp.bike/locations' },
    { title: 'Hopp: condiciones del servicio', url: 'https://hopp.bike/tos' },
    { title: 'Hopp: retención temporal en la tarjeta (en inglés)', url: 'https://support.hopp.bike/en/articles/109688' },
    { title: 'Dott: seguro en España y Canarias', url: 'https://ridedott.com/es/seguro/espana/' },
    { title: 'Dott Ayuda: importe bloqueado en tu cuenta bancaria', url: 'https://help.ridedott.com/es/articles/197' },
  ],
};

export default guide;
