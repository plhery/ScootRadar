import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'it',
  slug: 'monopattino-elettrico-regole-svizzera',
  topic: 'swiss-rules',
  name: 'Regole del monopattino elettrico in Svizzera',
  title: 'Monopattino elettrico in Svizzera: regole 2026, età e multe',
  description: 'Le regole del monopattino elettrico in Svizzera nel 2026: età e licenza M, casco, alcol, marciapiede, pista ciclabile, multe, treno FFS, sharing e Ticino.',
  headline: 'Monopattino elettrico in Svizzera: le regole del 2026, dall’età alle multe',
  lede: 'Le regole del monopattino elettrico in Svizzera sono quelle di un ciclomotore leggero: un motore da 0,5 kW al massimo, che non spinge oltre i 20 km/h, e su strada le norme dei ciclisti. Puoi guidarlo da 14 anni con la licenza di condurre categoria M e senza licenza da 16; per lo sharing servono 18 anni. Il casco non è obbligatorio, le luci invece vanno accese anche di giorno. Vietati il marciapiede (40 franchi di multa), i passeggeri e un tasso alcolemico dello 0,5‰ o più.',
  published: '2026-10-12',
  updated: '2026-10-12',
  sections: [
    {
      heading: 'Monopattino elettrico in Svizzera: le regole di base',
      blocks: [
        'Per la legge il monopattino elettrico senza sella è un **ciclomotore leggero** (art. 18 OETV): il motore lo spinge fino a **20 km/h** al massimo e non supera **0,5 kW** di potenza. È un veicolo a motore, ma su strada segui le regole dei ciclisti.',
        'Niente targa, niente contrassegno, niente assicurazione obbligatoria. Se causi un danno ne rispondi tu: controlla che la tua assicurazione di responsabilità civile privata copra il monopattino.',
        {
          table: {
            caption: 'Età e licenza per guidare un monopattino elettrico in Svizzera',
            head: ['Età', 'Il tuo monopattino', 'In sharing'],
            rows: [
              ['Meno di 14 anni', 'Vietato', 'Vietato'],
              ['14 e 15 anni', 'Solo con la licenza di condurre categoria M (o G)', 'No, gli operatori chiedono 18 anni'],
              ['16 e 17 anni', 'Senza licenza', 'No, servono 18 anni'],
              ['Da 18 anni', 'Senza licenza', 'Sì'],
            ],
          },
        },
        'Le licenze delle categorie A, B, C, D, A1, B1, F e G includono la categoria M. Guidare senza la licenza richiesta è un reato (art. 95 LCStr). Sotto i 15 anni non si può ricevere una multa disciplinare: si viene denunciati e si applica il diritto penale minorile.',
        'I ciclomotori leggeri non sono soggetti all’approvazione del tipo (l’omologazione): non tutti i modelli in vendita sono quindi ammessi su strada. Un monopattino truccato non è più un ciclomotore leggero, e guidarlo è un reato. Ad aprile 2026 la polizia cantonale friburghese ne ha sequestrato uno che poteva raggiungere i 127 km/h.',
      ],
    },
    {
      heading: 'Casco, luci e passeggeri: cosa è obbligatorio',
      blocks: [
        '**Il casco non è obbligatorio** (art. 3b ONC), ma l’UPI lo raccomanda con forza. Nelle sue condizioni, però, Voi elenca il casco tra le misure di sicurezza richieste, e Dott avverte che senza casco le ferite alla testa potrebbero non essere coperte.',
        {
          list: [
            '**Luci sempre accese**, di giorno e di notte, dal 1° aprile 2022: bianca fissa davanti, rossa fissa dietro. Senza luci di giorno la multa è di 20 franchi.',
            '**Un campanello** e **un catarifrangente posteriore** fisso.',
            '**Due freni** indipendenti.',
          ],
        },
        'Secondo il TCS, due terzi di chi va in monopattino elettrico non accende le luci di giorno. Eppure è la multa più facile da evitare.',
        '**Niente passeggeri, mai**, nemmeno un bambino. Dal 1° luglio 2025 l’ordinanza lo dice chiaro: «Su velocipedi e ciclomotori senza sella per il conducente non è consentito trasportare persone» (art. 63 ONC). La stampa parla di una multa di 20 franchi, ma l’elenco ufficiale delle multe non prevede ancora chiaramente questo caso.',
      ],
    },
    {
      heading: 'Marciapiede o pista ciclabile: dove circolare e parcheggiare',
      blocks: [
        'Dove ci sono una pista ciclabile (ciclopista) o una corsia ciclabile, **devi usarle**. Altrimenti circoli sulla carreggiata.',
        {
          list: [
            '**Marciapiede:** vietato (40 franchi), salvo se un segnale lo permette alle biciclette; in quel caso dai la precedenza ai pedoni.',
            '**Zona pedonale:** vietata, salvo se una tavola complementare ammette le biciclette; allora vai a passo d’uomo.',
            '**Zona d’incontro:** permessa, a 20 km/h al massimo, con precedenza ai pedoni.',
            '**Senso unico:** dal 1° luglio 2025, dove una tavola permette alle biciclette di circolare in senso contrario, puoi farlo anche tu.',
            '**«Divieto di circolazione per i ciclomotori»:** dalla stessa data non ti riguarda più. Quello «per i velocipedi e i ciclomotori» sì.',
            '**Semaforo rosso:** puoi svoltare a destra solo se una tavola gialla con bicicletta e freccia lo permette.',
            '**Autostrade, semiautostrade e stazioni:** vietate. In stazione, marciapiedi dei binari e sottopassaggi compresi, le FFS vietano di circolare: spingi il monopattino.',
          ],
        },
        '**Parcheggiare:** sul marciapiede solo se restano liberi almeno **1,50 m** per i pedoni (art. 41 ONC). Dal 1° luglio 2025 puoi parcheggiare anche nelle zone d’incontro e nelle zone pedonali, secondo le regole generali. Non bloccare ingressi, passaggi pedonali o linee guida tattili per ciechi e ipovedenti: 20 franchi.',
      ],
    },
    {
      heading: 'Alcol: il limite è 0,5‰',
      blocks: [
        'Il limite è **0,5‰** nel sangue (0,25 mg/l nell’aria espirata). **Non esiste una regola speciale per chi ha meno di 21 anni**, anche se alcune guide online la citano. E lo 0,1‰ della licenza in prova non vale: l’ordinanza lo esclude «durante le corse con veicoli delle categorie speciali F, G e M».',
        'Per le droghe (THC, cocaina, anfetamine…) vale la tolleranza zero, salvo prescrizione medica.',
        {
          list: [
            '**Da 0,5 a 0,79‰:** una multa decisa nella procedura penale ordinaria, non una multa disciplinare.',
            '**Da 0,8‰:** una pena detentiva sino a tre anni o una pena pecuniaria, e un divieto di circolare di almeno un mese con i veicoli a motore per cui non serve la licenza, monopattino compreso.',
          ],
        },
        'Se hai una licenza di condurre, una corsa in monopattino con troppo alcol può portare anche alla sua revoca: decide l’autorità cantonale, caso per caso.',
      ],
    },
    {
      heading: 'Le multe disciplinari per il monopattino elettrico',
      blocks: [
        'Le fissa la Confederazione: gli importi sono uguali in tutta la Svizzera e non sono cambiati dal 2024.',
        {
          table: {
            caption: 'Multe disciplinari per chi guida un monopattino elettrico, in vigore a ottobre 2026',
            head: ['Infrazione', 'Multa'],
            rows: [
              ['Circolare sul marciapiede', '40 franchi'],
              ['Non dare la precedenza a un pedone sul passaggio pedonale', '40 franchi'],
              ['Usare il telefono senza vivavoce mentre guidi', '40 franchi'],
              ['Passare con il rosso', '60 franchi'],
              ['Circolare senza luci di giorno', '20 franchi'],
              ['Circolare senza luci di notte', '40 franchi su strada illuminata, 60 se buia'],
              ['Non usare la pista o la corsia ciclabile', '30 franchi'],
              ['Entrare in una zona pedonale o su un sentiero pedonale', '30 franchi'],
              ['Superare il limite di velocità', '30 franchi'],
              ['Svoltare a sinistra senza segnalarlo con il braccio', '30 franchi'],
              ['Parcheggiare male (meno di 1,50 m liberi, ingresso bloccato…)', '20 franchi'],
              ['Senza campanello / senza catarifrangente posteriore', '20 / 40 franchi'],
            ],
          },
        },
        'Paghi subito o entro 30 giorni, senza spese; se non abiti in Svizzera, subito o lasciando un deposito. Oltre 600 franchi di multe sommate, o se qualcuno è stato messo in pericolo o ferito, si passa alla procedura penale ordinaria, come per l’alcol, il monopattino truccato o la guida senza licenza.',
      ],
    },
    {
      heading: 'Il monopattino elettrico sul treno FFS',
      blocks: [
        'Il tuo monopattino, elettrico o no, viaggia **gratis** se la ruota più grande ha un diametro inferiore a **12 pollici (30,5 cm)**. Piegalo se c’è poco posto. Da 12 pollici in su conta come una bici: servono un biglietto per la bici e, dove richiesta, la prenotazione. Il personale può rifiutarlo se il treno è pieno.',
        'Secondo le FFS la regola vale per i trasporti pubblici in generale; nelle ore di punta, però, alcune aziende di bus e tram possono avere regole proprie.',
        'Un monopattino in sharing, invece, non ti segue sul treno: chiudi la corsa alla stazione e noleggiane un altro all’arrivo. Tenerlo costa caro: se non lo restituisci entro 48 ore, Lime può addebitare fino a 1540 franchi e Bolt fino a 500.',
      ],
    },
    {
      heading: 'Monopattini in sharing e turisti',
      blocks: [
        'Lime, Bolt, Voi, Dott, Bird e PubliBike chiedono tutti **18 anni** nelle loro condizioni svizzere, e una sola persona per monopattino.',
        'L’assicurazione di responsabilità civile inclusa viene **dopo la tua**: con Lime, Bolt e Voi è sussidiaria alla tua RC privata e, secondo l’ultimo certificato pubblicato da Dott (valido fino al 30 giugno 2026), la sua copertura pagava solo a complemento della tua. PubliBike non include nessuna assicurazione. I passeggeri non sono mai coperti.',
        'L’app ti mostra dove puoi chiudere la corsa e dove il monopattino rallenta o si spegne. Le spese dell’operatore si aggiungono alle multe: Voi può addebitare 25 franchi per un parcheggio sbagliato, dopo alcuni avvisi, e Bolt fino a 100 franchi per recuperare un monopattino lasciato fuori zona.',
        'Per trovare il più vicino, di qualunque operatore, apri [la mappa](/map): un pulsante apre poi l’app dell’operatore, dove sblocchi e paghi.',
        '**Turisti:** da 16 anni non serve nessuna licenza, qualunque sia la tua nazionalità. A 14 e 15 anni serve la licenza svizzera categoria M; non abbiamo potuto verificare se basti una licenza estera, quindi meglio rinunciare. Le condizioni degli operatori non chiedono di abitare in Svizzera.',
      ],
    },
    {
      heading: 'Monopattino elettrico in Ticino: sharing e frontalieri',
      blocks: [
        'In Ticino valgono le stesse regole federali del resto della Svizzera, dall’età alle multe.',
        'I monopattini in sharing di PubliBike in Ticino funzionano **a stazioni**: li prendi e li riconsegni in una stazione, e il motore spinge solo fino a **15 km/h** (20 km/h a Bienne). Non è inclusa nessuna assicurazione e, per un monopattino rubato o chiuso male, PubliBike addebita un danno minimo di 1200 franchi.',
        'Il 12 ottobre 2026 ScootRadar mostrava poco più di 60 mezzi PubliBike, bici comprese, intorno a [Locarno](map:ch:locarno), e nessun veicolo intorno a Lugano, dove a luglio 2026 la SRF segnalava una prova di monopattini PubliBike. Altri operatori possono essere attivi in Ticino senza pubblicare i loro dati.',
        '**Frontalieri:** oltre il confine le regole cambiano. Contrassegno (la cosiddetta «targa»), assicurazione obbligatoria e casco per tutti sono regole italiane, non svizzere. Prima di guidare a Como o a Varese, leggi le [regole del monopattino elettrico in Italia](guide:italian-rules).',
      ],
    },
    {
      heading: 'Nuove regole 2026? Cosa è cambiato e cosa si discute',
      blocks: [
        'L’ultimo grande cambiamento risale al **1° luglio 2025**:',
        {
          list: [
            'il limite resta di 20 km/h senza sella, mentre i modelli con sella possono arrivare a 25 km/h;',
            'i passeggeri sono vietati, e il monopattino non può più avere un posto per loro;',
            'le tavole con la bicicletta valgono anche per i monopattini, e il «Divieto di circolazione per i ciclomotori» non li riguarda più;',
            'si può parcheggiare nelle zone d’incontro e nelle zone pedonali.',
          ],
        },
        '**Al 12 ottobre 2026, quest’anno non è entrata in vigore nessuna nuova regola federale** per i monopattini. Il dibattito però va avanti:',
        {
          list: [
            '**Casco:** il 30 aprile 2026 il Consiglio nazionale ha respinto, con 122 voti contro 33, una mozione che voleva casco e licenza obbligatori per gli scooter elettrici e i veicoli di tendenza analoghi. Il 19 agosto 2026 il Consiglio federale si è detto pronto a mettere in consultazione, alla prossima modifica dell’ordinanza, l’obbligo del casco per i monopattini elettrici, ma per ora senza progetto né data.',
            '**Immatricolazione e assicurazione:** la mozione 26.3637 vuole renderle obbligatorie. Il 19 agosto 2026 il Consiglio federale ha proposto di respingerla; il Parlamento non ha ancora votato.',
            '**Monopattini truccati:** il Consiglio federale vuole precisare le regole.',
            '**Treno:** il sindacato del personale dei trasporti SEV chiede un biglietto per i monopattini; la tariffa delle FFS non è cambiata.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Serve la patente per il monopattino elettrico in Svizzera?',
      answer: 'Da 16 anni no. A 14 e 15 anni serve la licenza di condurre categoria M (o G); sotto i 14 anni è vietato. Per noleggiare un monopattino in sharing servono 18 anni.',
    },
    {
      question: 'Il casco per il monopattino è obbligatorio in Svizzera?',
      answer: 'No, è solo raccomandato. Ad agosto 2026 il Consiglio federale si è detto pronto a mettere in consultazione un obbligo per i monopattini elettrici, ma non ci sono ancora né un progetto né una data.',
    },
    {
      question: 'Serve la targa o l’assicurazione per il monopattino elettrico in Svizzera?',
      answer: 'No. In Svizzera il monopattino elettrico non ha né targa né contrassegno, e l’assicurazione non è obbligatoria. Se causi un danno, di solito paga la tua RC privata, se ne hai una: controlla che copra il monopattino.',
    },
    {
      question: 'A che velocità può andare un monopattino elettrico?',
      answer: 'Il motore non deve spingere oltre i 20 km/h; con PubliBike in Ticino il limite è 15 km/h. In discesa andare più veloce non è vietato di per sé, ma i limiti di velocità valgono anche per te: superarli costa 30 franchi.',
    },
    {
      question: 'Quali sono le nuove regole per i monopattini nel 2026?',
      answer: 'In Svizzera, al 12 ottobre 2026, nessuna: l’ultimo cambiamento risale al 1° luglio 2025. Le notizie sulle nuove regole 2026 riguardano soprattutto l’Italia e altri Paesi vicini.',
    },
    {
      question: 'Cosa succede se ti ferma la polizia con il monopattino?',
      answer: 'Per le infrazioni più comuni ricevi una multa disciplinare, da pagare subito o entro 30 giorni. Puoi anche rifiutarla: in quel caso segue la procedura ordinaria. Alcol, guida senza licenza o monopattino truccato portano invece direttamente alla procedura penale ordinaria.',
    },
  ],
  sources: [
    { title: 'Ordinanza sulle norme della circolazione stradale (ONC), RS 741.11', url: 'https://www.fedlex.admin.ch/eli/cc/1962/1364_1409_1420/it' },
    { title: 'Ordinanza concernente le esigenze tecniche per i veicoli stradali (OETV), RS 741.41', url: 'https://www.fedlex.admin.ch/eli/cc/1995/4425_4425_4425/it' },
    { title: 'Ordinanza sull’ammissione alla circolazione di persone e veicoli (OAC), RS 741.51', url: 'https://www.fedlex.admin.ch/eli/cc/1976/2423_2423_2423/it' },
    { title: 'Ordinanza concernente le multe disciplinari (OMD) e il suo elenco delle multe, RS 314.11', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/it' },
    { title: 'Legge sulle multe disciplinari (LMD), RS 314.1', url: 'https://www.fedlex.admin.ch/eli/cc/2017/725/it' },
    { title: 'Ordinanza dell’Assemblea federale concernente i valori limite di alcolemia nella circolazione stradale, RS 741.13', url: 'https://www.fedlex.admin.ch/eli/cc/2015/493/it' },
    { title: 'FFS: bici e monopattini come bagaglio a mano (pagina in francese)', url: 'https://www.sbb.ch/fr/informations-voyages/besoins-individuels/voyager-avec-velo/velo-bagage-main.html' },
    { title: 'Parlamento: mozione 26.3637, immatricolazione e assicurazione obbligatorie per i monopattini elettrici', url: 'https://www.parlament.ch/it/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20263637' },
    { title: 'Parlamento: mozione 26.3010, casco e licenza per scooter elettrici e veicoli di tendenza', url: 'https://www.parlament.ch/it/ratsbetrieb/suche-curia-vista/geschaeft?AffairId=20263010' },
    { title: 'PubliBike: i monopattini elettrici (pagina in tedesco)', url: 'https://www.publibike.ch/de/e-scooter' },
  ],
};

export default guide;
