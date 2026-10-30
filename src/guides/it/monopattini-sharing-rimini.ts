import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'it',
  slug: 'monopattini-sharing-rimini',
  topic: 'rimini',
  name: 'Monopattini in sharing a Rimini',
  title: 'Monopattini Rimini 2026: Lime, sharing, regole e sosta',
  description: 'Monopattini elettrici sharing a Rimini nel 2026: Lime e Bit Mobility, zone e limiti del Comune, sosta, lungomare, bus, Metromare, treni e multe.',
  headline: 'Monopattini a Rimini: chi noleggia, dove si guida, sosta, bus e multe nel 2026',
  lede: 'I monopattini elettrici in sharing a Rimini che trovi sulla mappa, a ottobre 2026, sono quelli di Lime. Il Comune, nella pagina aggiornata a giugno 2025, indica due operatori, Lime e Bit Mobility: i monopattini di Bit sulla mappa non ci sono, e se Bit li noleggia ancora a Rimini non l’abbiamo potuto verificare. Il casco, obbligatorio per tutti, lo porti tu, e il prezzo lo vedi nell’app. Secondo il Comune si guida solo in alcune zone, al massimo a 15 km/h sui lungomari e a 6 km/h nel centro storico, e mai sul marciapiede.',
  published: '2026-10-30',
  updated: '2026-10-30',
  city: 'it:Rimini',
  sections: [
    {
      heading: 'Quali monopattini in sharing ci sono a Rimini',
      blocks: [
        'Con la delibera di Giunta 401 del 30 novembre 2021 il Comune ha deciso di affidare a due operatori, scelti con un’indagine di mercato, il noleggio di monopattini e bici elettriche in free floating, con al massimo 1.000 monopattini in tutto il Comune, per un servizio «della durata di 3 anni eventualmente rinnovabile». Dal 2023, scriveva il Comune nella pagina aggiornata il 13 giugno 2025, il servizio è gestito da **Lime** e **Bit Mobility**. Quando scadano i tre anni non lo sappiamo, e un rinnovo o un nuovo avviso, al 30 ottobre 2026, non li abbiamo trovati: Lime, comunque, a Rimini noleggia ancora, come mostra la mappa.',
        'Nella stessa pagina il Comune indica quanti mezzi, d’accordo con gli operatori, ciascuno mette su strada a seconda della stagione:',
        {
          table: {
            caption: 'Monopattini e bici elettriche per operatore, secondo il Comune di Rimini (giugno 2025)',
            head: ['Periodo', 'Monopattini', 'Bici elettriche'],
            rows: [
              ['Dal 1° maggio al 30 settembre', '500', '445'],
              ['Aprile e ottobre', 'Almeno 300', 'Almeno 200'],
              ['Dal 1° novembre al 31 marzo', 'Almeno 200', 'Almeno 100'],
            ],
          },
        },
        'Venerdì 30 ottobre 2026 alle 4:27 la [mappa di Rimini](map:it:Rimini) mostrava circa 600 monopattini Lime all’ultimo conteggio, e qualcuno nel frattempo può essersi spostato: è il conteggio della mappa, non la flotta di Lime. Il totale comprende tutta l’area in cui Lime noleggia, che lungo la costa va da Miramare fino a Bellaria-Igea Marina e San Mauro Mare: conta quindi anche monopattini fuori dal Comune di Rimini.',
        {
          table: {
            caption: 'Gli operatori di Rimini e dove trovarli, a ottobre 2026',
            head: ['Operatore', 'Sulla mappa', 'Cosa noleggia a Rimini'],
            rows: [
              ['Lime', 'Sì, dal 25 ottobre 2026, con la carica della batteria', 'Monopattini; anche bici elettriche, che sulla mappa non compaiono'],
              ['Bit Mobility', 'No', 'Monopattini e bici elettriche, secondo il Comune (giugno 2025); a giugno 2026 noleggiava bici ai congressisti di Velo-city. Il 16 luglio 2026 ha fermato i mezzi in tutta Italia per le nuove polizze, riportava SoldiOnline; il 16 settembre il Comune di Bari lo indicava tra gli operatori in servizio in città. Se a Rimini noleggia ancora monopattini non l’abbiamo potuto verificare: controlla la sua app'],
            ],
          },
        },
        'Altri operatori il Comune non ne nomina, e Dott, Bird, Voi o RideMovi a Rimini non ne abbiamo trovati.',
      ],
    },
    {
      heading: 'Come noleggiare un monopattino elettrico a Rimini',
      blocks: [
        {
          steps: [
            'Cerca un Lime sulla [mappa](map:it:Rimini) e aprilo nell’app dell’operatore.',
            'Iscriviti con una carta di pagamento. Le regole fissate dal Comune nel 2021 chiedono di caricare un documento d’identità al momento dell’iscrizione; l’età minima per noleggiare la vedi nell’app.',
            'Metti il casco: al contrassegno e all’assicurazione, sui mezzi in sharing, ci pensa l’operatore.',
            'Inquadra il QR code e guida su strada o su pista ciclabile, dentro le zone consentite e mai sul marciapiede.',
            'Chiudi la corsa dove l’app lo consente e scatta la foto di fine corsa: finché la corsa non è chiusa, paghi.',
          ],
        },
        { note: 'Il casco lo porti tu. È obbligatorio per chiunque guidi un monopattino, anche in sharing, dal 14 dicembre 2024, e va bene un casco da bici (UNI EN 1078). Senza, la multa va da 50 a 250 euro: a Rimini, nel 2025 e nel 2026, è stata la violazione più contestata.' },
        'Tutti i passaggi sono nella guida su [come noleggiare un monopattino](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Lime a Rimini: quanto costa il noleggio',
      blocks: [
        'Paghi uno sblocco più una tariffa al minuto. Tariffe di Rimini pubblicate non ne abbiamo trovate: il prezzo lo vedi nell’app prima di sbloccare, e sulla mappa non compare.',
        'La delibera del 2021 chiedeva agli operatori di mantenere per tutto il servizio le tariffe offerte al Comune, con la possibilità di abbonamenti giornalieri, settimanali o mensili e di sconti. Quali siano oggi pacchetti e pass di Lime a Rimini lo vedi nell’app.',
      ],
    },
    {
      heading: 'Dove si può andare in monopattino a Rimini',
      blocks: [
        'Nella pagina aggiornata a giugno 2025 il Comune indica dove possono circolare i monopattini:',
        {
          list: [
            '**Rimini sud:** tutta la zona tra il mare e la statale 16, la strada esclusa.',
            '**Rimini nord:** da Rivabella in su, tutta la zona tra il mare e la ferrovia, più una zona di Viserba e Rivabella delimitata da via Marconi, via Sacramora e altre strade.',
            '**Fiera e Celle:** i collegamenti con l’ingresso est della Fiera (via Iolanda Capelli, via Galla Placida e via Costantino il Grande) e con l’ingresso sud (via Emilia), e il quartiere Celle.',
          ],
        },
        'Per legge, dove il Comune limita le aree, l’operatore deve far sì che il monopattino in sharing non funzioni fuori da quelle aree: dove finiscono te lo mostra l’app.',
        '**Lungomari e Parco del Mare.** Sui lungomari, scrive il Comune, non si superano i 15 km/h; nelle altre zone il limite è 20 km/h. Per il Parco del Mare una regola a parte sui monopattini non l’abbiamo trovata.',
        '**Centro storico.** I monopattini possono entrare, scrive il Comune, ma a 6 km/h al massimo, come nelle aree pedonali.',
        '**Ponte di Tiberio.** Dal 4 maggio 2026 il ponte è in restauro. Dal 30 maggio è di nuovo aperto, con un passaggio pedonale ricavato dentro il ponteggio, e i lavori finiscono nella prima parte di dicembre, scriveva il Comune a settembre. Regole per i monopattini sul ponte durante i lavori il Comune non ne indica: nel passaggio pedonale, tra la gente a piedi, conviene portarlo a mano.',
        '**Concerti allo stadio.** Per i grandi eventi il Comune può fermare anche i monopattini. Per Vasco Rossi, il 29 e 30 maggio 2026, nell’«area blu» intorno allo stadio Romeo Neri transito e sosta erano vietati anche a bici e monopattini, dalle 23:59 del 28 maggio alle 6 del 31.',
        '**Di notte e d’inverno.** Divieti notturni per lo sharing non ne abbiamo trovati, e il Comune non prevede una pausa invernale: da novembre a marzo, nella pagina aggiornata a giugno 2025, chiede a ogni operatore almeno 200 monopattini.',
      ],
    },
    {
      heading: 'Dove parcheggiare il monopattino in sharing a Rimini',
      blocks: [
        'Le regole che il Comune ha fissato per il servizio con la delibera 401 del 2021 chiedono di accompagnare a mano il monopattino fino al posto in cui lo lasci:',
        {
          list: [
            '**Sì:** vicino alle rastrelliere per bici, negli stalli per motorini e moto, appena fuori dai parchi se non intralcia, e nelle aree che il Comune indica come preferenziali.',
            '**No:** nei parchi, sulle piste ciclabili e sui marciapiedi. Per legge la sosta sul marciapiede costa da 41 a 168 euro, salvo nelle aree riservate ai monopattini.',
            '**Foto:** a fine corsa la scatti sempre, così si vede dove hai lasciato il mezzo.',
          ],
        },
        'Se il monopattino è parcheggiato male, scriveva il Comune nel 2021, viene rimosso e la multa arriva a chi l’ha usato. Per legge puoi sempre sostare negli stalli per bici, motorini e moto, ma in sharing chiudi la corsa solo dove l’app lo consente.',
      ],
    },
    {
      heading: 'Monopattino su bus, Metromare e treno',
      blocks: [
        'Un monopattino in sharing non si piega e, finché non chiudi la corsa, paghi: chiudila prima della fermata. Se il monopattino è tuo:',
        {
          table: {
            caption: 'Il monopattino privato su bus, Metromare e treni, a ottobre 2026',
            head: ['Servizio', 'Il monopattino a bordo', 'Condizioni'],
            rows: [
              ['Bus Start Romagna', 'Sì, solo pieghevole, uno per passeggero', 'Gratis fino a 110×80×40 cm, tutti i giorni; lo tieni tu, senza bloccare passaggi e uscite'],
              ['Metromare (Rimini-Riccione)', 'Sì, solo pieghevole', 'Le stesse regole dei bus Start Romagna; le bici non pieghevoli non salgono'],
              ['Trenitalia (regionali, anche a Rimini)', 'Sì', 'Gratis fino a 120×80×45 cm, spento e chiuso, sotto il sedile o tra i posti vis-à-vis'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Regole e multe per il monopattino a Rimini',
      blocks: [
        'A Rimini valgono le regole nazionali, spiegate nella [guida alle regole del monopattino elettrico](guide:italian-rules), più le zone e i limiti che il Comune fissa per lo sharing. Si guida dai 14 anni, senza patente. Quelle che contano per chi noleggia:',
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
              ['Passeggeri', 'Nessuno: una persona sola, senza oggetti né animali', '50-250 euro'],
              ['Di sera', 'Luci accese e giubbotto o bretelle retroriflettenti da mezz’ora dopo il tramonto', '50-250 euro'],
              ['Alcol', 'Limite 0,5 g/l; oltre 0,8 g/l è reato', '543-2.170 euro tra 0,5 e 0,8 g/l'],
              ['Sosta', 'Mai sul marciapiede, salvo nelle aree riservate ai monopattini', '41-168 euro'],
            ],
          },
        },
        'Se paghi entro 5 giorni, di solito la multa si riduce del 30%. E i controlli ci sono: nel 2026, fino al 15 luglio, la Polizia Locale aveva contestato 111 violazioni a chi guidava un monopattino, 53 per il casco e 15 per il contrassegno, dopo le 126 del 2025 e le 47 del 2024.',
      ],
    },
    {
      heading: 'Lo sapevi?',
      blocks: [
        {
          list: [
            'A Rimini i monopattini in sharing sono arrivati ad agosto 2019, in prova, quando il Comune ammetteva i monopattini solo in poche zone: alcune piste ciclabili dei lungomari e del porto, i percorsi dei parchi, una zona 30 e, a 6 km/h, le aree pedonali del centro storico e di piazzale Fellini.',
            'Dal 16 al 19 giugno 2026 Rimini ha ospitato Velo-city, il summit mondiale della ciclabilità, tornato in Italia dopo 35 anni: per i congressisti le bici in sharing di Lime e Bit erano gratis.',
            'Il Ponte di Tiberio, che ha duemila anni, avrà una nuova illuminazione che di notte richiama la luce del sole e cambia con le ore: l’accensione, scriveva il Comune a settembre, è prevista entro Natale 2026.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Quali monopattini in sharing ci sono a Rimini?',
      answer: 'Quelli di Lime, che trovi sulla mappa. Il Comune, a giugno 2025, indicava come operatori Lime e Bit Mobility, che sulla mappa non c’è: a luglio 2026 Bit aveva fermato i mezzi in tutta Italia per le polizze, e se a Rimini noleggia ancora monopattini non l’abbiamo potuto verificare.',
    },
    {
      question: 'Quanto costa noleggiare un monopattino a Rimini?',
      answer: 'Uno sblocco più una tariffa al minuto, che vedi nell’app prima di partire: tariffe di Rimini pubblicate non ne abbiamo trovate. Le regole fissate dal Comune nel 2021 chiedevano agli operatori di non cambiare le tariffe offerte per tutta la durata del servizio.',
    },
    {
      question: 'Si può andare in monopattino sul lungomare di Rimini?',
      answer: 'Sì: secondo il Comune i lungomari sono dentro le zone in cui i monopattini possono circolare, ma al massimo a 15 km/h. Per il Parco del Mare non abbiamo trovato regole a parte; il monopattino non va mai lasciato sulla pista ciclabile.',
    },
    {
      question: 'Si può portare il monopattino sul Metromare?',
      answer: 'Il tuo sì, se è pieghevole: gratis, uno per passeggero, fino a 110×80×40 cm, come sui bus Start Romagna. Un mezzo in sharing non si piega: chiudi la corsa prima di salire.',
    },
    {
      question: 'I monopattini in sharing a Rimini ci sono anche d’inverno?',
      answer: 'Il Comune non prevede una pausa: nella pagina aggiornata a giugno 2025, da novembre a marzo chiede a ogni operatore almeno 200 monopattini, contro i 500 dell’estate. Divieti notturni non ne abbiamo trovati.',
    },
  ],
  sources: [
    { title: 'Comune di Rimini: mobilità sostenibile, monopattini e bike sharing (13 giugno 2025)', url: 'https://www.comune.rimini.it/amministrazione/documenti-e-dati/documento-tecnico-di-supporto/mobilita-sostenibile' },
    { title: 'Comune di Rimini: delibera di Giunta 401/2021, noleggio di monopattini e bici elettriche (PDF)', url: 'https://www.comune.rimini.it/sites/default/files/2024-04/dlg_00401_30-11-2021.pdf' },
    { title: 'Comune di Rimini: monopattini, da giovedì 16 luglio obbligo di assicurazione (15 luglio 2026)', url: 'https://www.comune.rimini.it/novita/notizie/monopattini-elettrici-da-giovedi-16-luglio-obbligo-di-assicurazione' },
    { title: 'Comune di Rimini: al via i lavori al Ponte di Tiberio (2 maggio 2026)', url: 'https://www.comune.rimini.it/novita/notizie/al-i-lavori-al-ponte-di-tiberio-da-lunedi-4-maggio-scatta-la-chiusura-temporanea-del' },
    { title: 'Comune di Rimini: Ponte di Tiberio, i lavori alla fase di rifinitura (15 settembre 2026)', url: 'https://www.comune.rimini.it/novita/notizie/ponte-di-tiberio-i-lavori-di-restauro-alla-fase-di-rifinitura' },
    { title: 'Comune di Rimini: Vasco Live 2026, viabilità (27 maggio 2026)', url: 'https://www.comune.rimini.it/novita/notizie/meno-due-al-soundcheck-e-meno-tre-alla-data-zero-del-vasco-live-2026' },
    { title: 'Comune di Rimini: Velo-city 2026 e la Bike Parade (15 giugno 2026)', url: 'https://www.comune.rimini.it/novita/notizie/rimini-capitale-mondiale-della-bicicletta-arriva-velo-city-2026-e-la-grande-bike-0' },
    { title: 'Legge 160/2019, art. 1, commi 75 e seguenti, testo vigente (Normattiva)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2019-12-27;160~art1' },
    { title: 'Start Romagna: regolamento di viaggio (5 maggio 2025, PDF)', url: 'https://www.startromagna.it/wp-content/uploads/2025/05/Regolamento-di-viaggio-Start-Romagna_5.5.25.pdf' },
    { title: 'Start Romagna: regolamento di viaggio del Metromare', url: 'https://www.startromagna.it/servizi/metromare/regolamento-di-viaggio/' },
    { title: 'Trenitalia: bici e mezzi elettrici sui regionali', url: 'https://www.trenitalia.com/it/regionale/bici-e-mezzi-elettrici.html' },
    { title: 'SoldiOnline: monopattini fermi per le Rc auto, il caso Bit Mobility (17 luglio 2026)', url: 'https://www.soldionline.it/notizie/economia-politica/monopattini-fermi-per-le-rc-auto-il-caso-bit-mobility-scuote-lo-sharing' },
    { title: 'Comune di Bari: monopattini in sharing di Bit Mobility (16 settembre 2026)', url: 'https://www.comune.bari.it/-/monopattini-in-sharing-di-bit-mobility-da-oggi-servizio-esteso-a-sette-nuove-aree-in-modalit%C3%A0-station-based-' },
    { title: 'Velo-city 2026: le bici in sharing a Rimini (in inglese)', url: 'https://www.velo-city-conference.com/en/rimini/getting-a-bike/' },
  ],
};

export default guide;
