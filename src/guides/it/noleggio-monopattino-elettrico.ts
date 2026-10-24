import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'it',
  slug: 'noleggio-monopattino-elettrico',
  topic: 'how-to-rent',
  name: 'Noleggio monopattino elettrico: come funziona',
  title: 'Noleggio monopattino elettrico: come funziona e quanto costa',
  description: 'Noleggio monopattino elettrico in sharing, passo per passo: app, età e documento, prezzi e preautorizzazione, parcheggio e foto, incidenti, Italia e Ticino.',
  headline: 'Noleggio monopattino elettrico: come noleggiare un monopattino in sharing',
  lede: 'Il noleggio di un monopattino elettrico in sharing funziona così: scarichi l’app dell’operatore, ti iscrivi con numero di telefono e carta, inquadri il QR code sul manubrio e parti; a fine corsa parcheggi dove l’app lo consente e scatti una foto. Quasi tutti gli operatori chiedono 18 anni e, in Italia come in Svizzera, nessuna patente; in Italia però serve il casco, e lo porti tu. Paghi uno sblocco più una tariffa al minuto: il 12 ottobre 2026 Voi pubblicava a Zurigo 1 franco più 0,42 al minuto, cioè 5,20 franchi per 10 minuti.',
  published: '2026-10-12',
  updated: '2026-10-24',
  sections: [
    {
      heading: 'Noleggio monopattino elettrico: come funziona, passo per passo',
      blocks: [
        'Ogni operatore, da Lime a Dott, da Bird a Voi e Bolt, ha la sua app e il suo account. I passaggi cambiano poco:',
        {
          steps: [
            '**Scarica l’app e iscriviti** con il numero di telefono, che confermi con un codice via SMS, o con l’email.',
            '**Verifica l’età, se l’app lo chiede.** In diverse città italiane, Roma compresa, devi caricare un documento d’identità.',
            '**Aggiungi un metodo di pagamento:** una carta, oppure Apple Pay, Google Pay o PayPal, dove l’operatore li accetta.',
            '**Controlla il prezzo:** tocca il monopattino sulla mappa dell’app, o inquadralo, e vedi sblocco e tariffa al minuto.',
            '**Metti il casco**, se sei in Italia: è obbligatorio per tutti.',
            '**Inquadra il QR code** sul manubrio. Se non si legge, digita il numero stampato sotto.',
            '**Controlla il mezzo:** freni, gomme, luci, batteria e, in Italia, il contrassegno sul parafango posteriore o davanti al piantone. Se qualcosa non va, segnalalo: Voi e Dott non fanno pagare un monopattino sbloccato che non funziona.',
            '**Guida da solo**, con le regole del posto. All’inizio potresti andare più piano: Bolt ti limita a 15 km/h per le prime cinque corse.',
            '**Parcheggia dove l’app lo consente, chiudi la corsa e scatta la foto.** Paghi finché l’app non conferma la fine.',
            '**Controlla la ricevuta:** la somma bloccata sulla carta viene liberata e compare l’importo finale.',
          ],
        },
      ],
    },
    {
      heading: 'Cosa serve per noleggiare un monopattino: età, documento e pagamento',
      blocks: [
        'Uno smartphone con internet, un account e un modo per pagare. Età e documenti dipendono dal Paese, a volte dalla città:',
        {
          table: {
            caption: 'Cosa chiedono gli operatori, per Paese (condizioni lette a ottobre 2026)',
            head: ['Paese', 'Età minima', 'Documento o patente', 'Pagamento da sapere'],
            rows: [
              ['Italia', '18 anni da Lime, Dott, Bird e Voi', 'Patente no. Documento d’identità con tutti gli operatori a Roma, all’iscrizione, e a Torino, prima del primo noleggio; Dott lo chiede anche a Milano, Monza, Varese, Verona, Jesolo, Arezzo e Modena', 'Satispay da Dott'],
              ['Svizzera, Ticino compreso', '18 anni da Lime, Bolt, Voi, Dott, Bird e PubliBike', 'Licenza di condurre no; un documento solo se l’app lo chiede', 'TWINT: trovato solo da Dott'],
            ],
          },
        },
        'Per pagare, Lime accetta anche le carte prepagate, ma Apple Pay, Google Pay e PayPal solo in alcune località; Bolt accetta Visa e Mastercard, l’American Express solo nei Paesi dell’euro. Prima di camminare fino al monopattino, controlla nell’app cosa puoi usare.',
        { note: 'In Italia il casco è obbligatorio per chiunque guidi un monopattino, anche in sharing, dal 14 dicembre 2024, e gli operatori di solito non lo danno: portalo tu. Va bene un casco da bici (UNI EN 1078); senza, la multa va da 50 a 250 euro. Contrassegno e assicurazione, invece, spettano all’operatore. In Svizzera il casco non è obbligatorio.' },
      ],
    },
    {
      heading: 'Quanto costa noleggiare un monopattino elettrico',
      blocks: [
        'Paghi uno sblocco più una tariffa per ogni minuto in cui il monopattino è sbloccato, che tu stia andando o no. Lime, Voi e Dott arrotondano al minuto successivo, e le tariffe cambiano da città a città.',
        'In Italia Lime, Dott e Bird non pubblicano le tariffe nei dati aperti: le vedi nell’app prima di sbloccare, e fa fede il prezzo mostrato lì, non quello dei vecchi articoli. Altrove alcuni operatori le pubblicano:',
        {
          table: {
            caption: 'Tariffe a consumo pubblicate il 12 ottobre 2026, e quanto costa una corsa',
            head: ['Operatore e città', 'Tariffa', '10 minuti', '20 minuti'],
            rows: [
              ['Voi, Zurigo e Berna', '1 franco + 0,42 al minuto', '5,20 franchi', '9,40 franchi'],
              ['Bolt, Basilea', '1 franco + 0,45 al minuto', '5,50 franchi', '10 franchi'],
              ['Bolt, Bruxelles', '0,99 euro + 0,31 al minuto', '4,09 euro', '7,19 euro'],
            ],
          },
        },
        '**Un esempio.** Prendi un Voi a Zurigo e guidi 9 minuti e 20 secondi: te ne contano 10, cioè 1 + 10 × 0,42 = 5,20 franchi. Se poi giri due minuti in cerca di un parcheggio consentito, i minuti diventano 12 e la corsa costa 6,04 franchi.',
        '**Pacchetti e abbonamenti** convengono se usi il monopattino spesso. I pacchetti di minuti (LimePass, Voi, il Minute Pass di Dott) e i pass giornalieri o mensili (LimePrime, Voi Pass, Bolt, Dott, Bird+) tolgono o riducono lo sblocco: un pass conviene se costa meno degli sblocchi che pagheresti prima che scada. A Roma gli abbonati annuali Metrebus hanno corse gratis o quasi, alle condizioni di ciascun operatore: i dettagli sono nella guida sui [monopattini sharing a Roma](guide:rome).',
        '**La preautorizzazione.** All’inizio della corsa l’app blocca una piccola somma sulla carta: da Dott circa 3 euro in Italia e 3 franchi in Svizzera; da Voi 4, 5 o 7,50 euro secondo il Paese, e in Svizzera 5 franchi all’iscrizione. Viene liberata a fine corsa, ma la banca può metterci giorni: secondo Lime, da 5 a 10 giorni lavorativi.',
      ],
    },
    {
      heading: 'Prenotare o mettere in pausa il monopattino: si paga?',
      blocks: [
        'Prenotare a volte è gratis; la pausa quasi mai.',
        {
          list: [
            '**Lime:** prenoti fino a 10 minuti senza costi aggiuntivi (30 con LimePrime o LimePass); in pausa fino a 15 minuti, pagando.',
            '**Dott:** prenoti 10 minuti gratis, nelle città dove la funzione c’è; in pausa fino a 30 minuti alla tariffa normale.',
            '**Bird:** prenoti fino a 30 minuti e blocchi il mezzo fino a 75, sempre pagando al minuto.',
            '**Voi:** la pausa tiene il monopattino per te fino a 2 ore; continui a pagare, in alcune città a tariffa ridotta.',
            '**Bolt:** prenoti per il tempo e al prezzo che mostra l’app; la pausa solo nei parcheggi blu, a pagamento.',
          ],
        },
        'Non allontanarti mai senza chiudere o mettere in pausa: Lime avverte che, se il monopattino viene rubato, potresti pagare il tempo in più.',
      ],
    },
    {
      heading: 'Come chiudere il noleggio: dove parcheggiare e la foto',
      blocks: [
        'La mappa dell’app mostra le zone: in quelle vietate, di solito rosse, il monopattino rallenta fino a fermarsi; in certe aree devi lasciarlo in un parcheggio indicato, di solito blu; nelle zone di divieto di sosta non puoi chiudere la corsa.',
        '**Se l’app non chiude la corsa, continui a pagare**, finché non ti sposti in un punto consentito.',
        'Lascialo dritto sul cavalletto, senza bloccare marciapiedi, ingressi o passi carrai, poi chiudi la corsa e scatta la foto. La foto viene controllata: il software di Dott segnala marciapiedi bloccati e mezzi rovesciati o fuori dagli stalli, e anche Voi fa verificare le foto.',
        '**In Italia** la foto a fine corsa è obbligatoria per legge, e il monopattino si blocca da solo fuori dalle aree consentite. Mai sul marciapiede, salvo nelle aree riservate dal Comune (multa da 41 a 168 euro); puoi sempre usare gli stalli per bici, motorini e moto. **In Svizzera** sul marciapiede devono restare almeno 1,50 m liberi, altrimenti la multa è di 20 franchi.',
        {
          table: {
            caption: 'Cosa addebitano gli operatori, di solito dopo qualche avviso (condizioni lette a ottobre 2026)',
            head: ['Operatore', 'Parcheggio sbagliato', 'Altre spese'],
            rows: [
              ['Dott, Italia', 'Fino a 5 euro', 'La multa più 15 euro di spese; fino a 300 euro per recuperare un mezzo sequestrato'],
              ['Lime, Italia', 'La multa, più rimozione e costi amministrativi', 'Fino a 110 euro per un monopattino lasciato in un posto irraggiungibile'],
              ['Voi, Svizzera', '25 franchi', 'Penali per foto sbagliate ripetute'],
              ['Bolt, Svizzera', 'Fino a 100 franchi per riprenderlo fuori zona', 'Fino a 500 franchi se non torna entro 48 ore'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Incidente o monopattino danneggiato: cosa fare',
      blocks: [
        {
          steps: [
            'Mettiti al sicuro e, se qualcuno è ferito, chiama il 112.',
            'Scambia i dati con le altre persone coinvolte e fotografa il luogo, il numero del monopattino (sotto il QR code) e i danni.',
            'Segnala l’incidente dal menu di aiuto dell’app. Dott ha anche un numero: +39 02 8295 6852 in Italia, +41 43 505 16 18 in Svizzera.',
            'Avvisa la polizia se ci sono feriti o danni: diversi operatori chiedono di farlo entro 24 ore. E non ammettere responsabilità sul posto, come consiglia Dott.',
          ],
        },
        '**L’assicurazione.** In Italia ogni monopattino deve essere assicurato dal 16 luglio 2026, e in sharing ci pensa l’operatore. Dott, per esempio, in Italia include responsabilità civile e infortuni, ma non copre i traumi alla testa senza casco, e un passeggero fa saltare la copertura. In Svizzera Lime, Bolt e Voi pagano solo dopo la tua RC privata, e PubliBike non include nessuna assicurazione.',
        'I danni al monopattino li paghi tu: fino a 1.380 euro con le condizioni italiane di Lime, fino a 1.540 franchi con quelle svizzere.',
      ],
    },
    {
      heading: 'Noleggiare all’estero o oltre il confine: pass, credito e regole',
      blocks: [
        'L’account viaggia con te; pass e credito quasi mai:',
        {
          list: [
            '**I pass valgono in un solo Paese.** LimePass, LimePrime, i pacchetti di Voi e i pass di Dott funzionano solo nel Paese dove li hai comprati, quelli di Bolt solo nella città.',
            '**Il credito resta nella sua valuta.** Bird e Dott aprono un nuovo portafoglio nella valuta locale, e il saldo Bolt vale solo nella sua valuta: un credito in franchi non paga una corsa in Italia.',
            '**Le regole cambiano al confine.** In Italia casco per tutti, 20 km/h e solo strade urbane con limite fino a 50 km/h: vedi le [regole del monopattino in Italia](guide:italian-rules). In Svizzera niente casco obbligatorio, ma luci accese anche di giorno: vedi le [regole in Svizzera](guide:swiss-rules). A Bruxelles devi scansionare il documento, e a Oslo non si noleggia dalle 23 alle 5.',
          ],
        },
        'Iscriviti e aggiungi il pagamento prima di partire, non sul marciapiede.',
      ],
    },
    {
      heading: 'Come trovare il monopattino più vicino, di qualunque operatore',
      blocks: [
        'L’app di ogni operatore mostra solo i suoi mezzi. Per vederne di più ci sono due tipi di app:',
        {
          list: [
            '**Mappe che ti rimandano all’app dell’operatore.** [ScootRadar](/map) mette su una sola mappa i monopattini di molti operatori, con batteria e autonomia quando ci sono, il tempo a piedi e una stima del prezzo dalle tariffe pubblicate. È gratis, senza account e senza pubblicità, nel browser o come app per iPhone. Non prenota e non sblocca: un pulsante apre l’app dell’operatore, e le posizioni possono risalire a qualche minuto prima. Anche Google Maps, nelle città che copre, mostra il mezzo più vicino e poi apre l’app dell’operatore.',
            '**App in cui prenoti e paghi.** In alcune città, Zurigo compresa, noleggi i Lime dall’app di Uber; a Berlino, Monaco e Oslo lo fanno le app dei trasporti pubblici, per alcuni operatori. Lì i pass dell’operatore di solito non valgono.',
          ],
        },
        'In Italia la mappa copre [Roma](map:it:Roma) e [Palermo](map:it:Palermo), con Bird e Dott (Lime lo trovi nella sua app), i Bird di [Napoli](map:it:Napoli) e i monopattini di Elerent a [Catania](map:it:Catania); dal 24 ottobre 2026 mostra anche i Dott di altre città, come [Milano](map:it:Milano) e [Torino](map:it:Torino), e i Voi di Napoli e [Reggio Emilia](map:it:Reggio nell\'Emilia). In Ticino, intorno a [Locarno](map:ch:locarno), mostra i mezzi PubliBike, che prendi e riconsegni in una stazione. [Apri la mappa](/map) per vedere chi ha un monopattino vicino a te.',
      ],
    },
  ],
  faq: [
    {
      question: 'Serve la patente per noleggiare un monopattino, e a che età si può?',
      answer: 'La patente non serve, né in Italia né in Svizzera, dove si chiama licenza di condurre. Quasi tutti gli operatori chiedono 18 anni, anche se la legge italiana permette di guidare dai 14. Alcune app fanno caricare un documento d’identità, e a Roma è obbligatorio. All’estero cambia: nel Regno Unito serve la patente, in Norvegia Bolt e Voi noleggiano dai 16 anni.',
    },
    {
      question: 'Si può andare in due sul monopattino a noleggio?',
      answer: 'No: in Italia costa da 50 a 250 euro di multa, in Svizzera è vietato. Per andare insieme usa una corsa di gruppo: con Lime un account sblocca fino a 5 monopattini, con Dott di solito 3. Paga chi la apre, e tutti devono avere l’età richiesta.',
    },
    {
      question: 'Si può noleggiare un monopattino senza carta di credito?',
      answer: 'Di solito sì: quasi tutti accettano le carte di debito, Lime anche le prepagate, e molti operatori PayPal, Apple Pay o Google Pay. Dott accetta Satispay in Italia e TWINT in Svizzera. Controlla nell’app cosa vale nella tua città.',
    },
    {
      question: 'Cosa succede se il telefono si spegne durante la corsa?',
      answer: 'Senza app non puoi chiudere la corsa, e i minuti possono continuare a correre. Voi la chiude da sola dopo 10 minuti di monopattino fermo, Dott dopo 10-30 minuti di inattività. Parcheggia bene e chiudi la corsa, o scrivi all’assistenza, appena il telefono si riaccende.',
    },
    {
      question: 'Gli operatori danno il casco?',
      answer: 'Di solito no, e in Italia è obbligatorio: portalo tu. Il nuovo bando di Roma premia chi metterà un casco su ogni monopattino, in un vano che si apre con l’app.',
    },
  ],
  sources: [
    { title: 'Legge 160/2019, art. 1, commi 75 e seguenti, testo vigente (Normattiva)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2019-12-27;160~art1' },
    { title: 'Roma Servizi per la Mobilità: nuovo Codice della strada e monopattini', url: 'https://romamobilita.it/primo-piano/nuovo-codice-della-strada-cosa-cambia-per-luso-dei-monopattini-elettrici/' },
    { title: 'Lime: costi e tariffe delle corse', url: 'https://help.li.me/hc/it/articles/115004914208-Costi-e-tariffe-delle-corse' },
    { title: 'Lime: contratto d’uso per l’Italia', url: 'https://www.li.me/it-it/user-agreement' },
    { title: 'Dott: termini e condizioni per l’Italia', url: 'https://ridedott.com/it/termini-condizioni/italia/' },
    { title: 'Dott: quali sono le forme di pagamento accettate?', url: 'https://help.ridedott.com/it/articles/209' },
    { title: 'Voi: pagamenti riservati o in sospeso (in inglese)', url: 'https://www.voi.com/help/accounts-and-payments/why-do-i-see-a-reserved-or-pending-payment-from-voi' },
    { title: 'Voi: prezzi, pacchetti e pass', url: 'https://www.voi.com/pricing-and-passes' },
  ],
};

export default guide;
