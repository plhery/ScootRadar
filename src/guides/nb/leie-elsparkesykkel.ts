import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'leie-elsparkesykkel',
  topic: 'how-to-rent',
  name: 'Leie elsparkesykkel, steg for steg',
  title: 'Leie elsparkesykkel: alder, pris og slik gjør du det',
  description: 'Leie elsparkesykkel i Norge, steg for steg: appen, aldersgrenser, Vipps og kort, hva turen koster, pause, parkering med bilde, nattestenging og utlandet.',
  headline: 'Hvordan leie elsparkesykkel: fra appen til du avslutter turen',
  lede: 'Å leie elsparkesykkel går slik: Du laster ned appen til operatøren, registrerer deg med mobilnummer og betalingskort, skanner QR-koden på styret og kjører, og til slutt parkerer du lovlig, avslutter turen og tar bilde av parkeringen. Ryde og Bolt leier ut fra 16 år, og Voi fra 16 i Oslo. Du betaler for å låse opp og per minutt: I Oslo publiserte Voi og Bolt 10 kr pluss 2,50 kr per minutt 12. oktober 2026, så ti minutter koster 35 kr. Mange byer stenger utleien om natten, Oslo hver natt fra kl. 23 til 05.',
  published: '2026-10-12',
  updated: '2026-10-17',
  sections: [
    {
      heading: 'Hvordan leie elsparkesykkel? Steg for steg',
      blocks: [
        'Voi, Bolt, Ryde og Dott har hver sin app, og du trenger en konto hos operatøren du vil leie av. Stegene er nesten like:',
        {
          steps: [
            '**Last ned appen og registrer deg** med mobilnummer eller e-post. Hos Voi kan du også bruke Apple eller Google.',
            '**Legg til en betalingsmåte:** et kort, eller det operatøren ellers tilbyr (se tabellen nedenfor).',
            '**Bekreft alder eller identitet hvis appen ber om det.**',
            '**Sjekk prisen** ved å trykke på sparkesykkelen eller skanne den, og ta gjerne kurset i appen: Ryde School gir Ryde Credits, og Vois RideSafe Academy en gratis tur.',
            '**Skann QR-koden** på styret, eller skriv inn nummeret som står under den.',
            '**Sjekk bremser, dekk, lys og batteri.** Virker ikke sparkesykkelen etter at du har låst den opp, melder du fra: Voi og Dott tar ikke betalt for det.',
            '**Kjør alene**, etter trafikkreglene. Nye brukere starter rolig: Bolt begrenser deg til 15 km/t de fem første turene, Voi kan starte deg på rundt 15 km/t, og Ryde har en nybegynnermodus du slår på selv.',
            '**Parker lovlig, avslutt turen og ta bilde** når appen ber om det. Du betaler til appen bekrefter at turen er over.',
            '**Sjekk kvitteringen:** Det reserverte beløpet frigis.',
          ],
        },
        'Bolt kan kreve at du består en kognitiv reaksjonstest for å låse opp i topptimer. Ifølge Bolts generelle hjelpeside får du fem forsøk, og stryker du, kan du ikke leie på tre timer. Ryde har en obligatorisk reaksjonstest på kveldstid i helgene.',
        'Mange kommuner stenger utleien om natten, Oslo fra kl. 23 til 05 hver natt. Trondheims forskrift sier det samme, men i 2026 har Voi og Ryde bare stengt natt til lørdag og søndag, så sjekk appen. Tidene for flere byer står i [reglene for elsparkesykkel i Norge](guide:norwegian-rules).',
      ],
    },
    {
      heading: 'Aldersgrense, legitimasjon og betaling hos hver operatør',
      blocks: [
        'Loven sier 12 år, men operatørene setter egne grenser, og noen tar imot mer enn kort:',
        {
          table: {
            caption: 'Hva operatørene krever i Norge (oktober 2026)',
            head: ['Operatør', 'Aldersgrense', 'Legitimasjon', 'Betaling'],
            rows: [
              ['Ryde', '16 år', 'Kortet kan verifiseres med 3-D Secure eller BankID på mobil; nye kontoer kan måtte forhåndsbetale', 'Kort, Vipps, Ryde Credits'],
              ['Bolt', '16 år', 'Kan be om bilde av førerkort eller annen legitimasjon', 'Visa eller Mastercard, Klarna'],
              ['Voi', '16 år i Oslo', 'Ikke oppgitt', 'Kort, Apple Pay, Google Pay, PayPal, Klarna'],
              ['Dott (blant annet Trondheim)', 'Sjekk appen', 'Kan be om førerkort, ID-kort eller pass for å sjekke alderen', 'Kort, PayPal, Apple Pay, Revolut Pay'],
              ['Ruter-appen (Oslo-området)', '15 eller 16 år, som hos operatøren', 'Ruter sjekker alderen før du kan leie', 'Betalingskort, bare enkeltturer'],
            ],
          },
        },
        'Bolts 16 år står både i Ruters oversikt og i Bolts vilkår for Norge fra 1. november 2026. Voi oppgir 16 år for Oslo; i andre byer ser du grensen i appen. Regjeringen har foreslått 16 år som nasjonal aldersgrense, men forslaget er ikke vedtatt.',
        '**Vipps** fant vi bare hos Ryde. Der trekkes turene samlet dagen etter, med et standard tak på 400 kr per dag.',
      ],
    },
    {
      heading: 'Hva koster det å leie elsparkesykkel?',
      blocks: [
        'Du betaler for å låse opp og for hvert minutt, også når du står stille. Voi, Ryde og Dott runder opp til hele minutter, og prisen varierer fra by til by.',
        {
          table: {
            caption: 'Priser publisert 12. oktober 2026, og hva en tur koster',
            head: ['Operatør og by', 'Opplåsing', 'Per minutt', '10 minutter', '20 minutter'],
            rows: [
              ['Voi og Bolt, Oslo', '10 kr', '2,50 kr', '35 kr', '60 kr'],
              ['Ryde, Oslo', '10,90 kr', '2,50 kr', '35,90 kr', '60,90 kr'],
              ['Voi, Kristiansand', '5 kr', '2,50 kr', '30 kr', '55 kr'],
              ['Voi, Stavanger og Sandnes', '0 kr', '2,50 kr', '25 kr', '50 kr'],
            ],
          },
        },
        'Ruter oppgir kilometerpris for Bolt i Oslo, mens Bolt selv publiserer minuttpris, så sjekk prisen i Bolt-appen før du låser opp. Alt om operatørene, sonene og parkeringen i hovedstaden står i [guiden om elsparkesykkel i Oslo](guide:oslo).',
        '**Et regneeksempel.** Du kjører en Voi i [Oslo](map:no:Oslo) i 11 minutter og 20 sekunder. Det blir regnet som 12 minutter: 10 kr + 12 × 2,50 kr = 40 kr. Bruker du tre minutter til på å finne en lovlig parkeringsplass, blir det 47,50 kr.',
        '**Pass** lønner seg hvis du kjører ofte. Voi selger minuttpakker med fri opplåsing og Voi Pass, som fornyes hver 30. dag, Bolt har uke- og månedspass, og hos Ryde kan et dagspass for eksempel gi 75 minutter kjøring i løpet av 24 timer. Prisene står i appene. Et pass med fri opplåsing lønner seg når det koster mindre enn opplåsingene du ellers ville betalt.',
        '**Reservert beløp.** Når turen starter, reserverer appen et lite beløp på kortet ditt: 40, 50 eller 75 kr hos Voi og 25 kr hos Dott. Bolt oppgir ikke beløpet, og nye kontoer hos Ryde kan måtte betale et startbeløp som blir til Ryde Credits. Beløpet frigis når turen er over, men banken kan bruke noen dager på det.',
      ],
    },
    {
      heading: 'Kan man reservere eller pause en elsparkesykkel?',
      blocks: [
        'Ofte, ja. Å reservere er noen ganger gratis, å pause nesten aldri: Minuttene går.',
        {
          list: [
            '**Dott:** Reserver gratis i 10 minutter, i over 400 byer i 21 land ifølge Dott (mai 2025). Pause i opptil 30 minutter til vanlig minuttpris.',
            '**Voi:** En pause holder sparkesykkelen for deg i opptil to timer. Du betaler videre, noen steder til lavere pris, og etter to timer avsluttes turen av seg selv.',
            '**Bolt:** Du kan reservere på forhånd, så lenge og til den prisen appen viser. Pause kan du bare ta på blå parkeringsplasser, og du betaler per minutt.',
          ],
        },
        'Gå aldri bare fra sparkesykkelen. Avslutter du ikke turen, fortsetter den å koste penger.',
      ],
    },
    {
      heading: 'Avslutte turen: parkering, bilde og hva feilparkering koster',
      blocks: [
        'Appen viser soner. I en sone med **kjøreforbud**, ofte rød, bremser sparkesykkelen til den stopper, så du må trille den ut. I en **saktesone**, ofte gul, går den saktere. I en sone med **parkeringsforbud** får du ikke avsluttet turen.',
        { note: 'Får du ikke avsluttet turen, betaler du fortsatt. Står du i en sone med parkeringsforbud eller utenfor området, går minuttene til du flytter sparkesykkelen til et lovlig sted.' },
        'At appen lar deg avslutte, betyr likevel ikke at du har parkert lovlig: I Oslo kan feilparkering gi 900 kr i gebyr, og appen sier ikke fra. Parker i et oppmerket felt, inntil en vegg eller i et sykkelstativ, men ikke i stativene til Oslo Bysykkel, ikke nærmere enn 5 meter fra et kryss eller gangfelt og ikke nærmere enn 2,5 meter fra ledelinjene for blinde og svaksynte.',
        'Bildet blir sjekket. Hos Ryde må du dokumentere parkeringen med bilde; uten bilde betaler du et eventuelt gebyr fra kommunen, og dårlige bilder kan gi sperret konto. Hos Dott ser programvare etter veltede sparkesykler og sperrede fortau, og hos Voi går en «Parking Assistant» gjennom bildene.',
        {
          table: {
            caption: 'Hva feilparkering kan koste, ifølge kommunen og operatørenes vilkår (oktober 2026)',
            head: ['Hvem', 'Hva det kan koste'],
            rows: [
              ['Oslo kommune', '900 kr i parkeringsgebyr, skrevet ut til operatøren'],
              ['Ryde', 'Halvparten av gebyret, 450 kr, når det er din skyld (oppgitt i 2024); opptil 500 kr hvis du forlater området'],
              ['Bolt', 'Kontoen kan bli sperret; sperren oppheves automatisk etter 24 timer'],
              ['Voi', 'Gebyr først etter flere advarsler, og det refunderes ikke'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Ulykke eller skadet sparkesykkel: dette gjør du',
      blocks: [
        {
          steps: [
            'Sørg for at alle er trygge. Ring **113** hvis noen er skadet, og 112 hvis du trenger politiet.',
            'Utveksle kontaktinformasjon, og ta bilder av stedet, sparkesykkelens nummer og skadene.',
            'Meld fra i appen, med dato, sted, tur-ID og eventuelt saksnummer fra politiet.',
            'Meld fra til politiet hvis noen er skadet, eller hvis noe er ødelagt eller stjålet. Bolts vilkår ber deg gjøre det innen 24 timer.',
            'Ikke innrøm skyld på stedet, slik Dott råder deg.',
          ],
        },
        'Ifølge Ruter har alle operatørene ansvarsforsikring. Hos Ryde dekkes personskader uten beløpsgrense og skade på ting med opptil 100 millioner kr. Dott har bare ansvarsforsikring i Norge, og er dere to på sparkesykkelen, faller Dotts dekning bort.',
        'Skader du sparkesykkelen, betaler du: Ryde fakturerer etter egen vurdering. Er den ødelagt før du kjører, melder du fra i appen og tar en annen.',
      ],
    },
    {
      heading: 'Leie elsparkesykkel i utlandet: pass, saldo og regler',
      blocks: [
        'Kontoen din virker i andre land, men pass og saldo blir som regel igjen hjemme:',
        {
          list: [
            '**Pass gjelder i ett land.** Voi-pakkene er merket «gyldig i Norge», Dotts pass virker bare i landet du kjøpte det i, og Bolts pass og Rydes månedspass bare i byen.',
            '**Saldo gjelder i én valuta.** I et land med euro eller en annen valuta må du åpne en ny saldo hos Dott og Bird, og Bolt Balance kan bare brukes i valutaen den ble kjøpt i.',
            '**Aldersgrensen er 18 år nesten overalt ellers.** Er du 15, 16 eller 17, kan du som regel ikke leie i utlandet. Unntak er blant annet Voi i Antwerpen, Hoppy i Kortrijk og Pony i Frankrike og Belgia, som leier ut fra 16.',
            '**Reglene endrer seg ved grensen.** I Storbritannia trenger du førerkort, og i Italia må du ha med egen hjelm og ta bilde av parkeringen. I Brussel skanner du legitimasjon før første tur, og myndighetene der har bestemt at utleien av elsparkesykler stanser etter 31. desember 2026. I Paris har det ikke vært delte elsparkesykler siden 1. september 2023.',
          ],
        },
        'Ta med et betalingskort, og registrer deg før du reiser, ikke på fortauet ved siden av sparkesykkelen.',
      ],
    },
    {
      heading: 'Finn nærmeste elsparkesykkel, uansett operatør',
      blocks: [
        'Hver app viser bare sin egen flåte. To typer apper viser flere:',
        {
          list: [
            '**Kart som sender deg videre.** [ScootRadar](/map) viser elsparkesyklene til alle operatører som publiserer åpne data, på ett kart, med batteri og rekkevidde der operatøren deler det, gangtid og et prisanslag ut fra publiserte priser. Det er gratis, uten konto og uten reklame, i nettleseren eller som iPhone-app. Det kan ikke reservere eller låse opp: En knapp åpner operatørens app, og posisjonene kan være noen minutter gamle. Google Maps viser også nærmeste sparkesykkel med pris i byene det dekker, og åpner så operatørens app.',
            '**Apper du kan leie i.** I Ruter-appen kan du leie Bolt, Ryde og Voi i Oslo, Bærum, Asker, Lørenskog, Lillestrøm og Rælingen. Ruter sjekker alderen din før du kan leie, du betaler enkeltturer med kort til samme pris som i operatørens app, og passene dine hos operatøren gjelder ikke der.',
          ],
        },
        'Den 12. oktober 2026 viste kartet Voi, Bolt og Ryde rundt Oslo, og Ryde, Voi eller Dott i blant annet [Trondheim](map:no:Trondheim), [Stavanger](map:no:Stavanger), Kristiansand og Tromsø. Bergen er ikke med på kartet, selv om Ryde leier ut der. [Åpne kartet](/map) og se hvem som har en sparkesykkel nær deg.',
      ],
    },
  ],
  faq: [
    {
      question: 'Hvor gammel må man være for å leie elsparkesykkel?',
      answer: 'Det kommer an på operatøren og byen: Ryde og Bolt leier ut fra 16 år, og Voi fra 16 i Oslo. Loven sier 12 år, men Oslo kommune ber alle under 15 la være å leie.',
    },
    {
      question: 'Kan man være to på en elsparkesykkel?',
      answer: 'Nei. Elsparkesykkelen er for én person, og står dere to på den, koster det 3000 kr i gebyr. Vil dere kjøre sammen, kan én konto låse opp flere sparkesykler i en gruppetur hos blant annet Bolt og Ryde, men hos Bolt må gjestene ha fylt 18 år.',
    },
    {
      question: 'Kan jeg betale for elsparkesykkelen med Vipps?',
      answer: 'Hos Ryde, ja: Turene trekkes samlet dagen etter, med et standard tak på 400 kr per dag. Hos Bolt, Voi og Dott fant vi ikke Vipps. Der betaler du med kort, hos Voi også med blant annet Apple Pay, Google Pay, PayPal og Klarna.',
    },
    {
      question: 'Kan jeg bruke Voi Pass i Ruter-appen?',
      answer: 'Nei. I Ruter-appen betaler du bare enkeltturer, og pass eller abonnement hos Bolt, Ryde eller Voi kan ikke brukes der.',
    },
    {
      question: 'Hva skjer hvis mobilen går tom for strøm?',
      answer: 'Uten appen får du ikke avsluttet turen, så minuttene kan fortsette å gå. Voi avslutter turen av seg selv når sparkesykkelen har stått stille i 10 minutter, og Dott etter 10 til 30 minutter uten bruk. Parker lovlig, og avslutt turen eller kontakt kundeservice så snart du har strøm.',
    },
    {
      question: 'Kan man leie elsparkesykkel om vinteren?',
      answer: 'Mange steder, men ikke overalt. Oslo har ingen vinterpause, men operatørene kan stenge midlertidig når det snør, slik Bolt gjorde i januar 2026. I Trondheim varer sesongen fra 15. mars til 1. desember, og i Asker er tjenesten vinterstengt.',
    },
  ],
  sources: [
    { title: 'Ruter: Kjør elsparkesykkel og bysykkel i appen', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/kjore-i-appen' },
    { title: 'Ruter: Operatører, priser og aldersgrenser', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Ryde: Betal med Vipps (7. mars 2023)', url: 'https://www.ryde-technology.com/blog/vipps' },
    { title: 'Ryde: Forsikring', url: 'https://www.ryde-technology.com/insurance' },
    { title: 'Voi: Elsparkesykler i Oslo, priser og aldersgrense', url: 'https://www.voi.com/nb/by/oslo' },
    { title: 'Voi Help: Hvorfor ser jeg et reservert beløp? (på engelsk)', url: 'https://www.voi.com/help/accounts-and-payments/why-do-i-see-a-reserved-or-pending-payment-from-voi' },
    { title: 'Bolt: Elsparkesykler', url: 'https://bolt.eu/no-no/scooters/' },
    { title: 'Bolt: Vilkår for elektriske kjøretøy i Norge (på engelsk)', url: 'https://bolt.eu/en-no/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Oslo kommune: Leie av elsparkesykler og elsykler', url: 'https://www.oslo.kommune.no/gate-transport-og-parkering/sykkel/leie-av-elsparkesykler-og-elsykler/' },
  ],
};

export default guide;
