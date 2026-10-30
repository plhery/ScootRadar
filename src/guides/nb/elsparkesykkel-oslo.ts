import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-oslo',
  topic: 'oslo',
  name: 'Leie elsparkesykkel i Oslo',
  title: 'Elsparkesykkel i Oslo: Når stenger Voi, Ryde og Bolt?',
  description: 'I Oslo stenger Voi, Ryde og Bolt kl. 23 og åpner kl. 05 hver natt. Alle tre tar 2,50 kr per minutt og har 16-årsgrense. Se hvor du ikke får kjøre eller parkere.',
  headline: 'Elsparkesykkel i Oslo: operatører, priser, nattestenging og soner',
  lede: 'Vil du leie elsparkesykkel i Oslo, velger du mellom Bolt, Ryde og Voi, som har tillatelse fra kommunen. Det koster 10 kr å låse opp (10,90 kr hos Ryde) og 2,50 kr per minutt, så ti minutter kommer på rundt 35 kr med prisene fra 30. oktober 2026. Du må ha fylt 16 år hos alle tre, og utleien er stengt hver natt fra kl. 23 til 05. På mange torg, i parker og ved stasjoner er det parkeringsforbud eller kjøreforbud, og feilparkering kan koste 900 kr.',
  published: '2026-10-12',
  updated: '2026-10-24',
  city: 'no:Oslo',
  sections: [
    {
      heading: 'Leie elsparkesykkel i Oslo: Bolt, Ryde og Voi',
      blocks: [
        'Oslo kommune gir tillatelse til tre operatører, og i dag er det **Bolt, Ryde og Voi**. Tillatelsene deres varer i to år fra 1. april 2025, altså fram til våren 2027.',
        'Kommunen tillater til sammen **16 000** små elektriske kjøretøy, elsykler til utleie medregnet, fordelt likt på de tre: rundt 5300 hver. Innenfor Ring 1 får det stå maks 1200 av dem. I 2025 ble det kjørt 20,4 millioner leieturer, opp fra 11,2 millioner året før, ifølge Ruter.',
        'På [kartet over Oslo](map:no:Oslo) sto det rundt 14 900 elsparkesykler innenfor kommunegrensen kl. 05.27 den 30. oktober 2026: rundt 5100 fra Voi, 5000 fra Bolt og 4900 fra Ryde. Det er det kartet viste akkurat da, ikke hele flåten. Kartet viser hvor hver sparkesykkel står, hvor langt den kommer, og hva den koster. Hvordan du registrerer deg, låser opp og avslutter turen, står i [guiden om å leie elsparkesykkel](guide:how-to-rent).',
        'Kommunen forbereder en ny tildeling for tiden etter våren 2027, og Dott sier at selskapet vil konkurrere om en plass. Hvem som får tillatelse, og hvor mange kjøretøy det blir, er ikke avgjort (oktober 2026).',
      ],
    },
    {
      heading: 'Hva koster elsparkesykkel i Oslo?',
      blocks: [
        'Tabellen viser prisene operatørene publiserte, men den endelige prisen ser du i appen.',
        {
          table: {
            caption: 'Priser for elsparkesykkel i Oslo, publisert 30. oktober 2026',
            head: ['Operatør', 'Opplåsing', 'Per minutt', '10 minutter', '20 minutter'],
            rows: [
              ['Voi', '10 kr', '2,50 kr', '35 kr', '60 kr'],
              ['Bolt', '10 kr', '2,50 kr', '35 kr', '60 kr'],
              ['Ryde', '10,90 kr', '2,50 kr', '35,90 kr', '60,90 kr'],
            ],
          },
        },
        'En gjennomsnittstur i Oslo varer rundt sju minutter og koster dermed rundt 27,50 kr hos Voi og Bolt. Ruter oppgir kilometerpris for Bolt, mens Bolt selv publiserer minuttpris, så sjekk prisen i Bolt-appen før du låser opp.',
        'Kjører du ofte, kan et pass lønne seg: Voi selger minuttpakker og Voi Pass, og Bolt har uke- og månedspass. Prisene står i appene.',
        'I **Ruter-appen** kan du låse opp sparkesykler fra alle tre og bysykler fra Oslo Bysykkel. Der betaler du per tur, til samme pris som i operatørens egen app, men pass og abonnement fra operatøren kan ikke brukes.',
      ],
    },
    {
      heading: 'Aldersgrense hos Bolt, Ryde og Voi',
      blocks: [
        'Loven sier 12 år, men operatørene har egne grenser. Oslo kommune ber deg dessuten la være å leie hvis du er under 15 år, og ikke leie for noen som er under 15.',
        {
          table: {
            caption: 'Aldersgrenser for å leie i Oslo, oktober 2026',
            head: ['Tjeneste', 'Aldersgrense'],
            rows: [
              ['Ryde', '16 år'],
              ['Bolt', '16 år'],
              ['Voi', '16 år'],
              ['Oslo Bysykkel', '18 år'],
            ],
          },
        },
        'Ruter oppgir fortsatt 15 år for Ryde, men Rydes vilkår for Norge krever 16 år (30. oktober 2026). Bolts nye vilkår for Norge, som gjelder fra 1. desember 2026, krever også 16 år. Bolt kan be om legitimasjon, og i topptimer må du bestå en reaksjonstest for å låse opp. Ryde har reaksjonstest på kveldstid i helgene.',
        'Regjeringen foreslo 5. oktober 2026 å heve den nasjonale aldersgrensen fra 12 til 16 år. Forslaget skal på høring og er **ikke vedtatt**.',
      ],
    },
    {
      heading: 'Nattestenging: stengt fra kl. 23 til 05',
      blocks: [
        'Du kan ikke leie elsparkesykkel i Oslo mellom kl. 23 og 05. Det gjelder hver natt, også i helgene, og står i kommunens utleieforskrift. Byrådet kan korte inn eller oppheve stengingen, men har ikke gjort det (oktober 2026).',
        'Stengingen kom i september 2021, og den første måneden ble det registrert 8 skader på elsparkesykkel om natten, mot knapt 100 i august.',
        'Nabokommunene har egne åpningstider. [Bærum](map:no:Bærum) har ingen nattestenging, og ifølge Ruter er Ryde og Voi døgnåpne der, men Vois åpne data viste stengt fra midnatt til kl. 05 natt til søndag (24. oktober 2026). I Lørenskog og Lillestrøm er utleien åpen hele natten på de fleste hverdager. Skal du videre etter kl. 23 i Oslo, kan du ta Oslo Bysykkel fram til kl. 01. Tidene i resten av landet finner du i guiden [åpningstider for elsparkesykkel](guide:opening-hours).',
        'På 17. mai og ved store arrangementer kan kommunen slå av sparkesyklene i sentrum. Under kvartfinalen i fotball-VM mellom Norge og England 11. juli 2026 var det kjøreforbud fra Jernbanetorget til Uranienborg og fra Tjuvholmen til Hausmannskvartalet, de samme sonene som på 17. mai. Sonene varsles hver gang, og appen viser dem.',
      ],
    },
    {
      heading: 'Hvor kan du kjøre? Kjøreforbud og saktesoner i Oslo',
      blocks: [
        'Kjør i sykkelfeltet eller på sykkelveien der det finnes, ellers i veibanen. På fortau, i gågater, i parker og på torg ber kommunen deg kjøre i gangfart eller trille. Du får ikke kjøre på motorvei, motortrafikkvei eller veier som er skiltet forbudt for syklende, som mange tunneler og noen bruer.',
        'I tillegg har kommunen soner der sparkesykkelen selv setter ned farten eller ikke lar seg kjøre. Du ser dem i appen og i [kommunens kart over reguleringene](https://experience.arcgis.com/experience/e77cffa7119144f3bf9cb57c294cbcef), og zoomer du inn på ScootRadar-kartet, viser det sonene Bolt, Ryde og Voi publiserer. Noen eksempler, per oktober 2026:',
        {
          list: [
            '**Kjøreforbud:** gravlunder som Vår Frelsers gravlund, Marka (også Sognsvann), taket og plassen ved Operaen, Botanisk hage på Tøyen, plassen foran Oslo S og skolegårder på hverdager.',
            '**Saktesoner på 10 km/t:** blant annet Spikersuppa, Munchmuseet og Sukkerbiten, Olaf Ryes plass og langs Akerselva. Kommunen har også soner på 12 km/t, og Slottsplassen har sin egen saktesone.',
            '**Operatørenes egne soner:** Ryde har kjøreforbud på stadioner som Bislett og Ullevaal, Voi har kjøreforbud i Holmenkollen, og Bolt setter ned farten til 15 km/t på Aker Brygge.',
          ],
        },
        'Sonene endres ofte, og kommunens kart viser ikke alt, så sjekk appen før du kjører. Kommunens kart har ikke kjøreforbud på Karl Johans gate, men der den er gågate, kjører du i gangfart og aldri over 6 km/t.',
        'På fortauet er det lov å kjøre når det er lite folk og du ikke er til fare eller hinder, men forbi gående holder du gangfart, aldri over 6 km/t. Byrådet vil forby fortauskjøring så snart loven åpner for det, og Stortinget ba 13. januar 2026 regjeringen om å gi kommunene den muligheten. Forbudet er planlagt, men ikke innført (oktober 2026).',
      ],
    },
    {
      heading: 'Parkering av elsparkesykkel i Oslo',
      blocks: [
        'Parker i et oppmerket felt, inntil en vegg eller i et sykkelstativ, men aldri i stativene til Oslo Bysykkel. På fortauet går det bra så lenge sparkesykkelen ikke står i veien for folk eller for benker, søppelkasser og annet fast utstyr. Her er det forbudt å parkere:',
        {
          list: [
            'ved trikkeholdeplasser og T-banestasjoner, utenom de oppmerkede plassene noen stasjoner har,',
            'ved skoler, barnehager, idrettsanlegg, byggeplasser og viktige bygg som Akershus festning,',
            'på mange torg og i gågater og parker, som Stortorvet, Youngstorget, Rådhusplassen og Frognerparken, utenom de oppmerkede plassene,',
            'i sykkelfeltet, nærmere enn 2,5 meter fra ledelinjene for blinde og svaksynte, og nærmere enn 5 meter fra et kryss, et gangfelt eller en sykkelkryssing.',
          ],
        },
        { note: 'Feilparkering kan gi et gebyr på 900 kr. At appen lar deg avslutte turen, betyr ikke at du har parkert lovlig. Se etter at fortauet er fritt, og ta bilde av parkeringen når appen ber om det.' },
        'Gebyret skrives ut til operatøren. Ryde sa i 2024 at kunden betaler halvparten, 450 kr, når det er kundens skyld. Ryde gikk også til sak mot kommunen om 20 slike gebyrer og vant fram med seks. Det avgjørende er om sparkesykkelen står til «unødig hinder eller ulempe».',
      ],
    },
    {
      heading: 'Regler og bøter for elsparkesykkel i Oslo',
      blocks: [
        'Trafikkreglene og bøtene er de samme som i resten av landet:',
        {
          table: {
            caption: 'Bøter og gebyrer for elsparkesykkel, per oktober 2026',
            head: ['Overtredelse', 'Beløp'],
            rows: [
              ['Holde mobilen i hånden mens du kjører', '10 750 kr'],
              ['Være to på samme sparkesykkel', '3000 kr'],
              ['Kjøre på rødt lys', '1950 kr'],
              ['Kjøre der skilt forbyr det, også i en skiltet sone med bruksforbud', '1950 kr'],
              ['Parkere til hinder eller der det er forbudt', '900 kr'],
              ['Kjøre med rundt 0,8 promille, tilstått', 'Utgangspunkt 15 000 kr i bot'],
            ],
          },
        },
        'Promillegrensen er 0,2, som for bil. Høyesterettsdommen fra 2023, som satte utgangspunktet til 15 000 kr, gjaldt en tur over Ankerbrua i Oslo.',
        'Hjelm er bare påbudt for dem under 15 år, men bruk den likevel: Av dem som skadet seg på en leid elsparkesykkel i Oslo i 2023, hadde bare 1,4 prosent hjelm på, ifølge Statens vegvesen.',
        'Alle reglene, med hjemmel og flere bøter, står i [reglene for elsparkesykkel i Norge](guide:norwegian-rules).',
      ],
    },
    {
      heading: 'Vinter, trikkeskinner og andre tips for Oslo',
      blocks: [
        {
          list: [
            '**Vinter:** Kommunen har ingen vinterpause og krever ikke piggdekk, så det er operatørene som bestemmer. I januar 2026 stengte Bolt midlertidig og Ryde trappet ned, fordi sparkesyklene sto i veien for snøryddingen.',
            '**Trikkeskinner:** Kryss skinnene så nær rett vinkel som mulig, og pass på at hjulet ikke havner i sporet.',
            '**Gangfelt:** Kjører du over, har bilene ikke vikeplikt for deg. Går du av og triller, må de stoppe.',
            '**Oslo S, T-bane og trikk:** Skal du videre med tog, T-bane eller trikk, avslutter du turen et stykke unna: Ved T-banestasjoner og trikkeholdeplasser er det parkeringsforbud, og foran Oslo S er det kjøreforbud.',
            '**Bakker:** Det er bratt opp mot St. Hanshaugen, Ekeberg og Holmenkollen, og husk at Marka er stengt for leide sparkesykler.',
            '**Gardermoen:** Flyplassen ligger i Ullensaker, utenfor området der du kan leie sparkesykkel i Ruter-appen. Ta Flytoget eller toget til Oslo S og finn den nærmeste sparkesykkelen på [kartet over Oslo](map:no:Oslo).',
          ],
        },
      ],
    },
    {
      heading: 'Oslo Bysykkel: alternativet om kvelden og vinteren',
      blocks: [
        'Oslo Bysykkel har 267 stasjoner (30. oktober 2026) og er åpen hele året fra kl. 05 til 01, to timer lenger enn sparkesyklene. Om vinteren er det færre sykler, og de har piggdekk. Du må ha fylt 18 år. Prisene per oktober 2026:',
        {
          list: [
            '**Enkelttur:** 8 kr for å låse opp, så 1 kr per minutt på en vanlig sykkel (blå) eller 2 kr per minutt på en elsykkel (hvit), pluss 3 kr i registreringsgebyr første gang.',
            '**30 dager:** 179 kr.',
            '**365 dager:** 599 kr.',
            '**«Opplev Oslo», tre dager:** 119 kr.',
          ],
        },
        'Ti minutter på en elsykkel koster dermed rundt 28 kr, mot rundt 35 kr på en elsparkesykkel.',
      ],
    },
  ],
  faq: [
    {
      question: 'Kan jeg kjøre elsparkesykkel på Karl Johans gate?',
      answer: 'Ja, kommunens kart har ikke kjøreforbud der (oktober 2026). Men der gaten er gågate, kjører du i gangfart og aldri over 6 km/t, og i den sentrale delen kan du bare parkere på oppmerkede plasser.',
    },
    {
      question: 'Hvorfor kan jeg ikke leie elsparkesykkel om natten i Oslo?',
      answer: 'Kommunens utleieforskrift stenger utleien fra kl. 23 til 05 hver natt. Da regelen kom i 2021, var det først foreslått å stenge fra kl. 01, men Oslo universitetssykehus ba om kl. 23. Den første måneden falt antallet skader om natten fra knapt 100 til 8.',
    },
    {
      question: 'Er det lov å kjøre elsparkesykkel på fortauet i Oslo?',
      answer: 'Ja, når det er lite folk og du ikke er til fare eller hinder, men forbi gående holder du gangfart, aldri over 6 km/t. Der et skilt forbyr elsparkesykler, er det forbudt. Byrådet vil forby fortauskjøring, men forbudet er ikke innført (oktober 2026).',
    },
    {
      question: 'Hva koster det å parkere elsparkesykkelen feil i Oslo?',
      answer: 'Står sparkesykkelen til hinder eller i en sone med parkeringsforbud, kan det bli 900 kr i gebyr. Gebyret skrives ut til operatøren, og Ryde sa i 2024 at kunden betaler halvparten, 450 kr, når det er kundens skyld.',
    },
    {
      question: 'Kan jeg leie elsparkesykkel i Oslo om vinteren?',
      answer: 'Ja, kommunen har ingen vinterpause. Men operatørene kan stenge eller trappe ned når snøen kommer, slik Bolt og Ryde gjorde i januar 2026. Oslo Bysykkel er åpen hele året.',
    },
  ],
  sources: [
    { title: 'Lovdata: Oslos forskrift om utleie av små elektriske kjøretøy', url: 'https://lovdata.no/dokument/LF/forskrift/2024-11-20-2821' },
    { title: 'Oslo kommune: Leie av elsparkesykler', url: 'https://www.oslo.kommune.no/gate-transport-og-parkering/sykkel/leie-av-elsparkesykler-og-elsykler/' },
    { title: 'Ruter: Åpningstider for elsparkesykler og bysykler', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/apningstider' },
    { title: 'Ruter: Operatører, priser og aldersgrenser', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer' },
    { title: 'Ruter: Kjør elsparkesykkel og bysykkel i appen', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/kjore-i-appen' },
    { title: 'Ruter: Parkering av elsparkesykkel', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/parkering' },
    { title: 'Ruter: Slik reiste vi i 2025 (årsrapport)', url: 'https://ruter.no/rapporter/aarsrapport2025/aaret-2025/slik-reiste-vi-i-2025' },
    { title: 'Voi: Elsparkesykler i Oslo, priser og aldersgrense', url: 'https://www.voi.com/nb/by/oslo' },
    { title: 'Bolt: Vilkår for elektriske kjøretøy i Norge (fra 1. desember 2026)', url: 'https://bolt.eu/en-no/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Bolt: Elsparkesykler i Norge (reaksjonstest i topptimer)', url: 'https://bolt.eu/no-no/scooters/' },
    { title: 'Oslo Bysykkel: priser og åpningstider', url: 'https://oslobysykkel.no/' },
    { title: 'Statens vegvesen: Flere skader seg på elsparkesykkel i Oslo (januar 2026)', url: 'https://www.vegvesen.no/om-oss/presse/aktuelt/2026/01/flere-skader-seg-pa-elsparkesykkel-i-oslo/' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Ryde: Sikkerhet (reaksjonstest på kveldstid i helgene)', url: 'https://www.ryde-technology.com/safety' },
  ],
};

export default guide;
