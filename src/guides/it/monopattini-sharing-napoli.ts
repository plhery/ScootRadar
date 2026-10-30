import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'it',
  slug: 'monopattini-sharing-napoli',
  topic: 'naples',
  name: 'Monopattini sharing a Napoli',
  title: 'Monopattini sharing a Napoli 2026: noleggio con Bird e Voi',
  description: 'Monopattini a Napoli: Bird e Voi, autorizzati fino al 30 giugno 2027. Voi costa 1 € più 0,28 € al minuto, Bird mostra il prezzo nell’app. Il casco lo porti tu.',
  headline: 'Monopattini sharing a Napoli: operatori, prezzi, zone vietate e parcheggio nel 2026',
  lede: 'I monopattini sharing a Napoli, a ottobre 2026, sono quelli di Bird e Voi, autorizzati dal Comune con 700 mezzi ciascuno fino al 30 giugno 2027. Voi costa 1 euro di sblocco più 0,28 euro al minuto; il prezzo di Bird lo vedi nell’app. Servono 18 anni, un documento d’identità e il casco, obbligatorio per tutti, che porti tu. Nel centro storico, in piazza del Plebiscito e su via Partenope il Comune vieta la sosta libera, anche se a volte l’app ti lascia chiudere la corsa.',
  published: '2026-10-13',
  updated: '2026-10-24',
  city: 'it:Napoli',
  sections: [
    {
      heading: 'Quali monopattini in sharing ci sono a Napoli',
      blocks: [
        'A Napoli possono offrire monopattini in sharing solo gli operatori autorizzati dal Comune: a ottobre 2026 sono **Bird** e **Voi**. Il 1° luglio 2025 il Comune ha rinnovato le loro autorizzazioni, 700 monopattini ciascuno, fino al **30 giugno 2027**; al 30 ottobre 2026 non ha ancora annunciato cosa succederà dopo. L’avviso pubblico del 2023 ammette fino a tre operatori e 2.100 monopattini in tutto.',
        'Sulla [mappa di Napoli](map:it:Napoli) ScootRadar mostra Bird e Voi: venerdì 30 ottobre 2026 alle 10:36 c’erano circa 620 monopattini Bird e 520 Voi liberi in quel momento. Il 13 ottobre i Bird erano soprattutto in centro e a Chiaia; nella periferia nord ed est quasi nessuno.',
        'Si noleggia giorno e notte, tutti i giorni, ma con il maltempo il servizio può essere sospeso.',
      ],
    },
    {
      heading: 'Come noleggiare un monopattino elettrico a Napoli',
      blocks: [
        {
          steps: [
            'Cerca un Bird o un Voi sulla [mappa](map:it:Napoli) o nell’app dell’operatore.',
            'Iscriviti nell’app con un documento d’identità (se sei turista va bene il passaporto) e una carta di pagamento. Prima del primo noleggio il Comune impone la registrazione del documento e un test sulle regole, nell’app. Bird e Voi chiedono **18 anni**; la patente non serve.',
            'Metti il casco, controlla freni e luci e verifica che ci sia il contrassegno, sul parafango posteriore o davanti al piantone dello sterzo.',
            'Inquadra il QR code e guida su strada o su pista ciclabile, mai sul marciapiede.',
            'Chiudi il noleggio dove l’app lo consente, fuori dalle zone in cui il Comune vieta la sosta libera, e scatta la foto di fine corsa, obbligatoria.',
          ],
        },
        { note: 'Il casco lo porti tu: è obbligatorio per chiunque guidi un monopattino, anche in sharing, dal 14 dicembre 2024, e a Napoli gli operatori non lo danno. Va bene un casco da bici (UNI EN 1078); senza, la multa va da 50 a 250 euro.' },
        'Tutti i passaggi sono nella guida su [come noleggiare un monopattino](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Noleggio monopattini a Napoli: quanto costa',
      blocks: [
        'Di solito paghi uno sblocco più una tariffa al minuto. Voi pubblica la tariffa di Napoli; Bird la mostra nell’app prima dello sblocco, e il Comune non fissa prezzi. Sulla mappa vedi la batteria dei monopattini, e per Bird l’autonomia, non il prezzo.',
        {
          table: {
            caption: 'Le tariffe a consumo a Napoli, a ottobre 2026',
            head: ['Operatore', 'Sblocco', 'Al minuto', '10 minuti', '20 minuti'],
            rows: [
              ['Voi', '1 euro', '0,28 euro', '3,80 euro', '6,60 euro'],
              ['Bird', 'Nell’app', 'Nell’app', 'Nell’app', 'Nell’app'],
            ],
          },
        },
        'Voi vende anche pacchetti da 30, 60, 120 o 300 minuti, validi in tutta Italia, e il Pass Voi, con sblocchi illimitati e rinnovo ogni 30 giorni: i prezzi sono nell’app.',
      ],
    },
    {
      heading: 'Zone vietate ai monopattini a Napoli',
      blocks: [
        'Oltre alle regole nazionali, che trovi più sotto, il Comune vieta di circolare in tre posti:',
        {
          list: [
            '**Borgo Marinari**, ai piedi di Castel dell’Ovo;',
            '**via San Gregorio Armeno**, la strada dei presepi;',
            '**i parchi pubblici**, come la Villa Comunale, Capodimonte, il Parco Virgiliano o la Floridiana, a meno che un regolamento non lo permetta.',
          ],
        },
        'Nei dati di Bird del 13 ottobre 2026 Borgo Marinari è fuori dall’area del servizio, mentre via San Gregorio Armeno e i parchi sono solo zone in cui non si chiude la corsa: il monopattino ci passa. Il divieto del Comune vale comunque: scendi e portalo a mano.',
        'Nelle aree pedonali il Comune impone agli operatori un limitatore a 6 km/h: se il monopattino non rallenta da solo, rallenta tu.',
      ],
    },
    {
      heading: 'Dove parcheggiare il monopattino a Napoli',
      blocks: [
        'Mai sul marciapiede: la multa va da 41 a 168 euro. Il Comune chiede di usare prima di tutto gli stalli per bici, motorini e moto, e con una mappa del 2020 vieta la sosta libera in un perimetro fatto di più zone: il centro antico (da piazza Dante al bordo di piazza Garibaldi), piazza Mercato, la zona tra piazza Municipio e il Plebiscito, via Partenope e, al Vomero, piazza Vanvitelli, via Scarlatti e Castel Sant’Elmo.',
        'Quella mappa esiste solo in PDF: quando un operatore l’ha chiesta in GeoJSON o KML, il Comune ha risposto «Il formato richiesto non è disponibile». Ogni operatore la riporta nella sua app, e quella di Bird non coincide:',
        {
          table: {
            caption: 'Dove lasciare il monopattino: la mappa del Comune e l’app di Bird (dati Bird del 13 ottobre 2026)',
            head: ['Luogo', 'Mappa del Comune', 'App di Bird'],
            rows: [
              ['Spaccanapoli, via dei Tribunali, Duomo, Galleria Umberto I', 'Sosta libera vietata', 'La corsa non si chiude'],
              ['Piazza del Plebiscito, piazza Municipio, piazza Dante, piazza Mercato, via Partenope, via Scarlatti', 'Sosta libera vietata', 'La corsa si chiude, ma il divieto del Comune resta'],
              ['Piazza Vanvitelli, Castel Sant’Elmo', 'Sosta libera vietata', 'La corsa non si chiude'],
              ['Villa Comunale, Capodimonte, Parco Virgiliano', 'Parchi: vietato anche circolare', 'La corsa non si chiude'],
              ['Via Caracciolo, Riviera di Chiaia, Mergellina', 'Fuori dal perimetro', 'La corsa si chiude'],
            ],
          },
        },
        'Dentro il perimetro del Comune, quindi, non lasciare il monopattino anche se l’app chiude la corsa: spostati fuori e cerca uno stallo per bici, motorini o moto. Le zone di Voi le vedi nella sua app; quelle in cui Bird non chiude la corsa anche sulla [mappa](map:it:Napoli), da vicino. Possono cambiare: segui l’app, ma il divieto del Comune vale sempre.',
        'Secondo i dati di Bird, la corsa si chiude in meno di un terzo del territorio comunale: in gran parte della periferia, soprattutto a est, puoi passare ma non lasciare il monopattino.',
      ],
    },
    {
      heading: 'Monopattino in metro e funicolare, stazione Centrale e porto',
      blocks: [
        'Con il **tuo** monopattino sali gratis su metro e funicolari ANM, ma non sempre:',
        {
          table: {
            caption: 'Quando il tuo monopattino può salire sui mezzi ANM',
            head: ['Linea', 'Quando'],
            rows: [
              ['Linea 1', 'Dal lunedì al venerdì dalle 6 alle 7 e dalle 20 a fine servizio; sabato e festivi tutto il giorno'],
              ['Linea 6', 'Tutti i giorni'],
              ['Funicolari Centrale, Chiaia, Montesanto e Mergellina', 'Tutti i giorni'],
              ['Monopattino piegato, fino a 20 kg e 80×45×25 cm', 'Sempre, se resta piegato'],
            ],
          },
        },
        'Avvisa il personale e porta il monopattino a mano, **mai sulle scale mobili** (nelle funicolari nemmeno in ascensore). Quello in sharing, invece, in pratica resta fuori: non si piega, e la corsa va chiusa in strada.',
        '**Stazione e aeroporto.** Alla stazione Centrale la corsa con Bird non si chiude: fermati prima, dove l’app lo consente, e prosegui a piedi. Nemmeno all’aeroporto di Capodichino: per il volo conviene un altro mezzo.',
        '**Porto.** Al Molo Beverello, da dove partono gli aliscafi per Capri, Ischia e Procida, la corsa con Bird non si chiude, e la Stazione Marittima e Calata Porta di Massa sono fuori dalla sua area. Piazza Municipio, a due passi, è nel perimetro del Comune: chiudi la corsa prima e fai l’ultimo tratto a piedi.',
      ],
    },
    {
      heading: 'Regole e multe per il monopattino a Napoli',
      blocks: [
        'A Napoli valgono le regole nazionali, spiegate nella [guida alle regole del monopattino elettrico](guide:italian-rules); il Comune non prevede multe sue per chi guida.',
        {
          table: {
            caption: 'Le regole principali e le multe, a ottobre 2026',
            head: ['Regola', 'Cosa prevede', 'Multa'],
            rows: [
              ['Casco', 'Per tutti dal 14 dicembre 2024, anche in sharing', '50-250 euro'],
              ['Contrassegno («targa»)', 'Dal 17 maggio 2026; in sharing ci pensa l’operatore', '100-400 euro'],
              ['Assicurazione', 'Dal 16 luglio 2026; in sharing ci pensa l’operatore', '100-400 euro'],
              ['Dove si guida', 'Strade urbane con limite fino a 50 km/h e piste ciclabili; mai sul marciapiede né contromano', '50-250 euro'],
              ['Velocità', '20 km/h; 6 km/h nelle aree pedonali', '50-250 euro'],
              ['Passeggeri', 'Nessuno: una persona sola', '50-250 euro'],
              ['Di sera', 'Luci accese e giubbotto o bretelle retroriflettenti da mezz’ora dopo il tramonto', '50-250 euro'],
              ['Alcol', 'Limite 0,5 g/l; oltre 0,8 g/l è reato', '543-2.170 euro tra 0,5 e 0,8 g/l'],
              ['Sosta', 'Mai sul marciapiede', '41-168 euro'],
            ],
          },
        },
        'Se paghi entro 5 giorni, di solito la multa si riduce del 30%. Le multe che arrivano dopo, per esempio per la sosta, passano dall’operatore, che sa chi guidava.',
      ],
    },
    {
      heading: 'Basoli, salite, stadio ed eventi: consigli pratici',
      blocks: [
        '**Basoli.** I basoli, le lastre di pietra del centro, fanno sobbalzare il monopattino. Lo sa anche il Comune, che nella gara del 2023 ha valutato le sospensioni e ha provato i mezzi allo stadio Maradona, guardando anche a «comfort di guida e vibrazioni». Rallenta, e con la pioggia evita le frenate brusche.',
        '**Vomero e Posillipo.** Il Vomero arriva ai 251 metri della Certosa di San Martino: parti con la batteria carica e lascia perdere scalinate come il Petraio. Con Bird la corsa si chiude in piazza Medaglie d’Oro, non in piazza Vanvitelli; a Posillipo su via Posillipo e a Marechiaro, non al Parco Virgiliano.',
        '**Stadio.** Allo stadio Maradona la corsa con Bird non si chiude: nei giorni di partita fermati prima.',
        '**America’s Cup.** Dal 22 maggio al 19 luglio 2027 nel Golfo di Napoli si corrono la Louis Vuitton Cup e, dal 10 luglio, la 38ª America’s Cup. Il Comune può vietare i monopattini nelle zone degli eventi: per le regate del settembre 2026 il villaggio era sul lungomare Caracciolo. In quei giorni guarda l’app prima di partire.',
        '**Alternative.** Metro e funicolari ANM. Il Comune ha autorizzato 500 bici elettriche di Lime fino al 30 giugno 2026; al 30 ottobre 2026 non ne ha pubblicato il rinnovo, possibile per altri due anni: controlla l’app di Lime. La nostra mappa mostra solo i monopattini.',
      ],
    },
    {
      heading: 'Lo sapevi?',
      blocks: [
        {
          list: [
            'Bird è entrata a Napoli per circa mezzo punto: nella graduatoria del 2023, dieci operatori in gara per tre posti, è arrivata terza con 70,19 punti, davanti a Bolt con 69,68.',
            'Napoli ha targato i monopattini in sharing prima dello Stato: dal 2023 il Comune chiede su ogni mezzo una targa posteriore con numero e QR code, mentre il contrassegno nazionale è arrivato il 17 maggio 2026. «Anticipando di oltre un anno il Governo», diceva Bird nel 2024.',
            'Nel 2020 i primi 900 monopattini di Napoli, quelli di Helbiz, giravano in circa 3 chilometri quadrati; nel 2024 Voi parlava di oltre 100, in tutte e dieci le municipalità.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Quali app servono per i monopattini a Napoli?',
      answer: 'Quelle di Bird e Voi, autorizzati fino al 30 giugno 2027 con 700 monopattini ciascuno. Sulla mappa di ScootRadar trovi i Bird e i Voi liberi, ma noleggi solo dalle loro app: conviene averle tutte e due.',
    },
    {
      question: 'Il casco è obbligatorio anche per i maggiorenni?',
      answer: 'Sì. Dal 14 dicembre 2024 è obbligatorio per chiunque guidi un monopattino, anche in sharing: gli articoli che parlano solo dei minorenni sono superati. Gli operatori non lo forniscono, quindi portalo da casa.',
    },
    {
      question: 'A che età si può noleggiare un monopattino a Napoli? Serve la patente?',
      answer: 'La legge permette di guidare dai 14 anni, ma Bird e Voi chiedono 18 anni. La patente non serve: bastano un documento d’identità e il test sulle regole che il Comune impone prima del primo noleggio.',
    },
    {
      question: 'Perché non riesco a chiudere la corsa nel centro storico?',
      answer: 'Perché nel centro antico il Comune vieta la sosta libera, e nel cuore della zona, da Spaccanapoli al Duomo, l’app di Bird non chiude il noleggio. Finché non esci continui a pagare: cerca sulla mappa dell’app un punto consentito fuori dal perimetro del Comune.',
    },
    {
      question: 'Si può andare in monopattino sul lungomare di Napoli?',
      answer: 'Sì: su via Caracciolo e via Partenope si circola, a 6 km/h nei tratti pedonali, ma su Borgo Marinari e nella Villa Comunale è vietato. Con Bird puoi lasciare il monopattino su via Caracciolo; su via Partenope il Comune vieta la sosta libera.',
    },
  ],
  sources: [
    { title: 'Comune di Napoli: monopattini elettrici in sharing, atti e documenti', url: 'https://www.comune.napoli.it/novita/manifestazione-di-interesse-per-lindividuazione-di-operatori-interessati-a-svolgere-servizi-di-mobilita-in-sharing-con-monopattini-elettrici-nel-territorio-comunale-2/' },
    { title: 'Comune di Napoli: avviso pubblico 2023 (PDF)', url: 'https://static-www.comune.napoli.it/wp-content/uploads/2026/05/avviso_pubblico_monopattini_2023__pub_160623_signed-1.pdf' },
    { title: 'Comune di Napoli: area di divieto di sosta libera (2020, PDF)', url: 'https://static-www.comune.napoli.it/wp-content/uploads/2026/05/planimetria_Area_interdettA_alla_sosta_libera_signed-1.pdf' },
    { title: 'Comune di Napoli: FAQ sull’avviso 2023 (PDF)', url: 'https://static-www.comune.napoli.it/wp-content/uploads/2026/05/FAQ_monopattini-1.pdf' },
    { title: 'Comune di Napoli: graduatoria finale della gara 2023 (PDF)', url: 'https://static-www.comune.napoli.it/wp-content/uploads/2026/05/DETDI_00905_291223__2_-1.pdf' },
    { title: 'Comune di Napoli: rinnovo dell’autorizzazione a Bird (PDF)', url: 'https://static-www.comune.napoli.it/wp-content/uploads/2026/05/1136E_250625_004-REP.pdf' },
    { title: 'Comune di Napoli: rinnovo dell’autorizzazione a Voi (PDF)', url: 'https://static-www.comune.napoli.it/wp-content/uploads/2026/05/1136E_250625_005_REP.pdf' },
    { title: 'Comune di Napoli: bici elettriche in sharing, avviso e autorizzazione a Lime', url: 'https://www.comune.napoli.it/novita/avviso-pubblico-servizi-di-mobilita-in-sharing-con-biciclette-elettriche/' },
    { title: 'Voi: monopattini a Napoli', url: 'https://www.voi.com/it/citta/naples' },
    { title: 'Bird: contratto di noleggio per l’Italia', url: 'https://www.bird.co/rental-agreements/italy-it/' },
    { title: 'Bird: zone di Napoli (dati GBFS pubblici)', url: 'https://mds.bird.co/gbfs/v2/public/napoli-italy/geofencing_zones.json' },
    { title: 'ANM: regolamento per bici e monopattini', url: 'https://www.anm.it/s/regolamento-bici' },
    { title: 'Comune di Napoli: la 38ª America’s Cup', url: 'https://www.comune.napoli.it/articolo_tematico/napoli-citta-ospitante-della-38esima-edizione-della-americas-cup/' },
  ],
};

export default guide;
