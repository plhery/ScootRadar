import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-sandefjord',
  topic: 'sandefjord',
  name: 'Leie elsparkesykkel i Sandefjord',
  title: 'Elsparkesykkel i Sandefjord 2026: Ryde, priser og regler',
  description: 'Elsparkesykkel i Sandefjord: bare Ryde har tillatelse. Priser, stengt kl. 01–05, borte senest 1. november, parkering i sentrum og veien til Torp.',
  headline: 'Elsparkesykkel i Sandefjord: Ryde, priser, vinterpause og veien til Torp',
  lede: 'Vil du leie elsparkesykkel i Sandefjord, er det bare Ryde som har kommunens tillatelse i 2026. Det koster 10,90 kr å låse opp og 2,50 kr per minutt (17. oktober 2026), og Ryde krever at du har fylt 16 år. Utleien er stengt fra kl. 01 til 05 hver natt. Etter et politisk vedtak skal sparkesyklene bort fra offentlig grunn innen første snøfall, og senest 1. november 2026. Kjøreområdet dekker selve byen, ikke Torp, Stokke eller Andebu.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'no:Sandefjord',
  sections: [
    {
      heading: 'Leie elsparkesykkel i Sandefjord: bare Ryde',
      blocks: [
        'Sandefjord kommune skriver at **Ryde Technology AS** er det eneste firmaet med tillatelse til å leie ut elektriske sparkesykler i kommunen i sommersesongen 2026. Ryde søkte om tillatelse for 2026 i februar, og kommunen svarte 9. mars.',
        'Ordningen bygger på kommunens utleieforskrift fra 22. juni 2022. Det er ingen konkurranse om plassene og ikke noe fast antall operatører: Alle som oppfyller kravene, får tillatelse for ett år om gangen, og kommunen behandler søknadene fortløpende. Kommunen kan sette tak på antallet i tre soner, med sentrum som sone 1, og operatørene betaler et gebyr som skal dekke kommunens kostnader.',
        '**Voi og Bolt kjører ikke i Sandefjord.** Kommunen nevner bare Ryde, og verken Voi eller Bolt publiserer åpne data for byen. I 2024 hadde også Tier og Surf tillatelse her, ifølge kommunens postjournal.',
        'På [kartet over Sandefjord](map:no:Sandefjord) sto det rundt 790 Ryde-sparkesykler kl. 19.25 den 17. oktober 2026. Det er det kartet viste akkurat da, ikke hele flåten. I Rydes åpne data samme kveld sto alle inne i byen, og ingen på Torp, i Stokke eller i Andebu.',
        'Du låser opp i Ryde-appen. Hvordan du registrerer deg og avslutter turen, står i [guiden om å leie elsparkesykkel](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Hva koster det å leie elsparkesykkel i Sandefjord?',
      blocks: [
        'Ryde har ingen prisliste på nettsiden og viser til appen. I Rydes åpne data for Sandefjord kostet det 10,90 kr å låse opp og 2,50 kr per minutt 17. oktober 2026, det samme som i Tønsberg. Sjekk prisen i appen før du låser opp.',
        {
          table: {
            caption: 'Ryde-priser 17. oktober 2026 og aldersgrense',
            head: ['Operatør', 'Opplåsing', 'Per minutt', '10 minutter', '20 minutter', 'Aldersgrense'],
            rows: [
              ['Ryde, Sandefjord', '10,90 kr', '2,50 kr', '35,90 kr', '60,90 kr', '16 år'],
              ['Ryde, Tønsberg', '10,90 kr', '2,50 kr', '35,90 kr', '60,90 kr', '16 år'],
            ],
          },
        },
        'Hos Ryde kan turen avsluttes automatisk etter 60–65 minutter, og tar du sparkesykkelen ut av driftsområdet, kan det koste opptil 500 kr ekstra.',
        'Loven sier 12 år, men Ryde krever **16 år** i vilkårene for Norge. Regjeringen foreslo 5. oktober 2026 å heve den nasjonale aldersgrensen til 16 år. Forslaget er **ikke vedtatt**.',
      ],
    },
    {
      heading: 'Nattestenging og vinterpause: borte senest 1. november',
      blocks: [
        'Forskriften sier i § 7 e at utleie kan skje «alle dager, hele dagen, unntatt i tidsrommet mellom kl. 01.00–05.00». Utleien er altså stengt fra **kl. 01 til 05 hver natt**, også på hverdager, og Rydes åpne data viser de samme tidene. Skal du hjem sent, kan du ikke regne med å låse opp en sparkesykkel etter kl. 01.',
        'Forskriften har ingen fast vintersesong, men operatørene må fjerne sparkesyklene når kommunen trenger det, for eksempel ved vinterdrift, og kommunen kan sette egne frister. Den 29. oktober 2025 vedtok hovedutvalget for miljø- og plansaker enstemmig at «alle elsparkesykler skal fjernes fra offentlig grunn innen første snøfall senest 1.november».',
        'Vedtaket har ikke noe årstall, og kommunen viste til det igjen i juni 2026. Sparkesyklene skal derfor være borte **senest 1. november 2026**, og tidligere hvis det kommer snø før det.',
        'Når sesongen starter igjen, står verken i forskriften eller i vedtaket. De siste tre årene har Ryde fått tillatelse for et nytt år i februar eller mars, og kommunens egen side kaller 2026 for «sommersesongen».',
      ],
    },
    {
      heading: 'Parkering i Sandefjord sentrum',
      blocks: [
        'Du kan parkere på fortau, gang- og sykkelvei eller i gågate, så lenge sparkesykkelen ikke står i veien for gående, syklende eller andre, for eksempel rullestolbrukere og folk med barnevogn. Siden 2024 krever kommunen at det er minst **1,5 meter** fri bredde der du setter den fra deg, og Ryde krever at du tar bilde av parkeringen når turen er slutt.',
        'Kommunen har begynt å merke opp parkeringsplasser for elsparkesykler i sentrum og oppfordrer alle til å bruke dem. Kommunens kart viser 15 plasser, og de er også lagt inn hos Ryde:',
        {
          list: [
            'Brygga, mellom Bryggekapellet og havnekiosken, og Bryggetorget.',
            'Hvaltorget mot Storgata, og flere plasser ved Hvaltorvet.',
            'Ved McDonald’s mot Torggata, Byparken mot Rådhusgata og Aagaards plass.',
            'Sandefjord stasjon, Rådhusplassen/Hjertnes og Thor Dahls gate.',
            'Skateparken.',
          ],
        },
        'Ifølge Rydes åpne data er det parkeringsforbud i rundt 60 soner, blant annet på Hvaltorget utenom de oppmerkede plassene, langs Hjertnespromenaden, ved Brydedammen, i Åslyparken, rundt Sandefjord stasjon, ved Sandefjord videregående skole, svømmehallen og Nygård sykehjem, og i flere boligområder. Du kan kjøre gjennom disse sonene, men ikke avslutte turen der.',
        'I august 2026 fattet Statens vegvesen dessuten et skiltvedtak om parkering for elsparkesykler i sentrum. Der det står skilt, er det de som gjelder.',
        { note: 'Står sparkesykkelen til hinder, kan du få et parkeringsgebyr på 900 kr. Har du ikke tatt bilde av parkeringen, kan Ryde sende regningen videre til deg. Ser du en feilparkert sparkesykkel, kan du melde fra i appen Sandefjord innbygger, som sender meldingen rett til Ryde, eller direkte til Ryde.' },
      ],
    },
    {
      heading: 'Hvor kan du kjøre i Sandefjord?',
      blocks: [
        'Rydes kjøreområde dekker selve byen Sandefjord, og sparkesyklene er sperret til 20 km/t. Ifølge Rydes åpne data 17. oktober 2026 gjelder disse sonene i tillegg:',
        {
          list: [
            '**Kjøreforbud** på Ekeberg gravlund, på gravlunden ved Sandar kirke, i sporområdet ved Sandefjord stasjon og i skateparken.',
            '**Saktesone** på 15 km/t i Krokenskogen.',
          ],
        },
        'Kommunen har vurdert saktesoner på 6–12 km/t i sentrum, men slike soner fantes ikke i Rydes data 17. oktober 2026.',
        'På fortauet gjelder de nasjonale reglene: Det er lov når det er lite folk og du ikke er til fare eller hinder, men forbi gående kjører du i gangfart, aldri over 6 km/t. Hovedutvalget ba i 2025 om en sak om å få sykler og elsparkesykler bort fra fortauene i sentrum. I juni 2026 svarte kommunen at den ikke har hjemmel til et slikt forbud før regjeringen følger opp Stortingets vedtak fra januar 2026.',
        '**Stokke og Andebu** ble en del av Sandefjord kommune 1. januar 2017, men Rydes kjøreområde dekker bare byen Sandefjord. I Stokke og Andebu var det derfor ingen sparkesykler til leie i oktober 2026.',
      ],
    },
    {
      heading: 'Til Torp med elsparkesykkel?',
      blocks: [
        'Torp Sandefjord lufthavn ligger rundt 3 km utenfor Rydes kjøreområde. Du kan derfor ikke kjøre en leid sparkesykkel til flyplassen eller avslutte turen der, og det står ingen Ryde-sparkesykler ved terminalen. Slik kommer du deg dit:',
        {
          list: [
            '**Tog og shuttlebuss:** Vy-togene på Vestfoldbanen stopper på Torp stasjon. Der venter en shuttlebuss som korresponderer med togene og kjører deg til terminalen for 55 kr.',
            '**Buss fra sentrum:** VKTs linje 4 går fra Stavern og Larvik via Sandefjord rett til flyplassen. En voksen enkeltbillett koster 45 kr i appen og 55 kr om bord.',
            '**Torpekspressen** kjører mellom Oslo bussterminal og Torp, og turen tar rundt halvannen time. Skal du leie elsparkesykkel i Oslo, står priser og regler i [guiden om Oslo](guide:oslo).',
            '**Egen elsparkesykkel:** I første etasje i P-hus 1 er det et eget parkeringsområde for sykkel og sparkesykkel, og sykler står gratis der.',
          ],
        },
      ],
    },
    {
      heading: 'Brygga og ferja til Strømstad',
      blocks: [
        'Brygga ligger innenfor kjøreområdet, og den oppmerkede plassen mellom Bryggekapellet og havnekiosken er et naturlig sted å avslutte turen.',
        'Color Line seiler mellom Sandefjord og Strømstad fra terminalen i Strandpromenaden 20, rundt ti minutters gange fra bussterminalen og stasjonen. Ifølge Rydes åpne data ligger selve ferjekaia like utenfor kjøreområdet, så avslutt turen på Brygga og gå det siste stykket.',
        'Ryde forbyr å ta med sparkesykkelen på andre transportmidler, så den leide blir igjen på land. En egen elsparkesykkel må stå på bildekket under overfarten, og den får ikke lades om bord. Fjord Line seilte også mellom Sandefjord og Strømstad, men la ned ruten i oktober 2023.',
      ],
    },
    {
      heading: 'Tønsberg og Larvik',
      blocks: [
        'I [Tønsberg](map:no:Tønsberg) kjører også Ryde, og på kartet sto det rundt 440 sparkesykler der 17. oktober 2026, til samme pris som i Sandefjord. Tønsberg stenger tidligere i helgen: fra kl. 23 til 05 natt til lørdag, søndag og helligdager, ellers fra kl. 01 til 05. Der tas sparkesyklene inn når det er fare for snø og is. VKTs linje 1 går mellom Sandefjord og Tønsberg.',
        'Ryde kjører også i Larvik. Ifølge Larvik kommune hadde Ryde 350 sparkesykler og 3000 brukere der per 1. juni 2026, og antallet turer steg fra 7700 i mars til 20 100 i mai. Larvik har sin egen forskrift fra juni 2025. Ryde publiserer ingen åpne data for Larvik, så kartet viser ikke sparkesyklene der.',
      ],
    },
    {
      heading: 'Regler og bøter for elsparkesykkel i Sandefjord',
      blocks: [
        'Trafikkreglene og bøtene er de samme som i resten av landet. Du må ha fylt 12 år, hjelm er påbudt under 15 år, og promillegrensen er 0,2, som for bil. Du kjører på veien, i sykkelfeltet eller på sykkelveien, og bare én person får stå på sparkesykkelen.',
        {
          table: {
            caption: 'Bøter og gebyrer for elsparkesykkel, per oktober 2026',
            head: ['Overtredelse', 'Beløp'],
            rows: [
              ['Holde mobilen i hånden mens du kjører', '10 750 kr'],
              ['Være to på samme sparkesykkel', '3000 kr'],
              ['Kjøre på rødt lys', '1950 kr'],
              ['Kjøre der skilt forbyr det, også i en skiltet sone med bruksforbud', '1950 kr'],
              ['Kjøre på motorvei eller motortrafikkvei', '1950 kr'],
              ['Parkere til hinder eller der det er forbudt', '900 kr'],
              ['Kjøre med rundt 0,8 promille, tilstått', 'Utgangspunkt 15 000 kr i bot'],
            ],
          },
        },
        'Alle reglene, med hjemmel og flere bøter, står i [reglene for elsparkesykkel i Norge](guide:norwegian-rules).',
      ],
    },
    {
      heading: 'Buss, tog og elsparkesykkel i Vestfold',
      blocks: [
        {
          list: [
            '**Leid sparkesykkel:** Ryde forbyr å ta med sparkesykkelen på buss, tog og i bil. Parker den på en oppmerket plass og gå om bord.',
            '**Egen elsparkesykkel på VKT-bussen:** Siden 1. februar 2026 betaler du for den, og prisen er den samme som for en barnebillett. Bussen har plass til maks to sykler, og rullestol og barnevogn går foran. Sykkelen eller sparkesykkelen kan være maks 175 cm lang og 70 cm bred. Små sparkesykler for barn opptil 10 år, som kan bæres under armen, er gratis.',
            '**Toget fra Sandefjord stasjon:** Hos Vy kan du ta med en liten elsparkesykkel hvis den ikke står i veien, og konduktøren avgjør. Batteriet får ikke lades om bord.',
            '**Ved stasjonen:** Ifølge Rydes åpne data er det kjøreforbud i sporområdet og parkeringsforbud rundt stasjonen, så bruk de oppmerkede plassene ved Sandefjord stasjon.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Finnes Voi eller Bolt i Sandefjord?',
      answer: 'Nei. I 2026 er Ryde det eneste firmaet med kommunens tillatelse. Kommunen gir tillatelse til alle som oppfyller kravene, så det kan endre seg, men i oktober 2026 kjørte verken Voi eller Bolt i byen.',
    },
    {
      question: 'Når stenger utleien om natten i Sandefjord?',
      answer: 'Fra kl. 01 til 05 hver natt, også på hverdager. Det står i kommunens forskrift, og Rydes åpne data viser de samme tidene.',
    },
    {
      question: 'Er elsparkesyklene borte om vinteren?',
      answer: 'Ja. Etter et vedtak i hovedutvalget for miljø- og plansaker fra oktober 2025 skal alle elsparkesykler være fjernet fra offentlig grunn innen første snøfall, og senest 1. november. I år betyr det senest 1. november 2026. Når sesongen starter igjen, er ikke kunngjort.',
    },
    {
      question: 'Kan jeg kjøre elsparkesykkel til Torp?',
      answer: 'Ikke med en leid sparkesykkel. Flyplassen ligger rundt 3 km utenfor Rydes kjøreområde. Ta toget til Torp stasjon og shuttlebussen derfra, eller VKTs linje 4 fra sentrum.',
    },
    {
      question: 'Hvor kan jeg parkere elsparkesykkel i sentrum?',
      answer: 'Helst på en av kommunens oppmerkede plasser, for eksempel på Brygga, ved Hvaltorvet, i Byparken eller ved stasjonen. Ellers setter du den slik at det er minst 1,5 meter fri bredde. Feilparkering kan gi 900 kr i gebyr.',
    },
    {
      question: 'Kan jeg ta med elsparkesykkelen på bussen?',
      answer: 'En leid sparkesykkel kan du ikke ta med. En egen elsparkesykkel kan bli med på VKT-bussen når det er plass, men siden 1. februar 2026 betaler du barnebillett for den.',
    },
  ],
  sources: [
    { title: 'Lovdata: Sandefjords forskrift om utleie av små elektriske kjøretøy på offentlig grunn', url: 'https://lovdata.no/dokument/LF/forskrift/2022-06-22-1166' },
    { title: 'Sandefjord kommune: Sparkesykler', url: 'https://www.sandefjord.kommune.no/parkering-vei-vann-avlop-renovasjon/vei-og-trafikk/sparkesykler/' },
    { title: 'Sandefjord kommune: Parkering for elsparkesykler (kart)', url: 'https://sandefjord.maps.arcgis.com/apps/instant/sidebar/index.html?appid=da0667c746804daa961c177d9254664c' },
    { title: 'Sandefjord kommune, møtekalender: Hovedutvalg for miljø- og plansaker 29. oktober 2025, sak 170/25 (møteprotokoll)', url: 'https://www.sandefjord.kommune.no/engasjer-deg/politikk-og-innsyn/motekalender-2/#/details/m-c983dc0b__41b8__48d4__9c70__849cc83cb998-1749!jisXQF' },
    { title: 'Sandefjord kommune, innsyn: sakene HMP 014/24 og 085/26 og arkivsak 2024/8156, 2026/747 og 2026/17478', url: 'https://www.sandefjord.kommune.no/engasjer-deg/politikk-og-innsyn/sok-etter-saker-og-dokumenter/' },
    { title: 'Sandefjord kommune: Fakta om Sandefjord', url: 'https://www.sandefjord.kommune.no/om-sandefjord-kommune/fakta-om-sandefjord/' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Torp Sandefjord lufthavn: Tog', url: 'https://torp.no/til-og-fra/tog/' },
    { title: 'Torp Sandefjord lufthavn: Buss', url: 'https://torp.no/til-og-fra/buss/' },
    { title: 'Torp Sandefjord lufthavn: Parkering', url: 'https://torp.no/til-og-fra/parkering/' },
    { title: 'VKT: Ta bussen til Torp Sandefjord lufthavn', url: 'https://www.vkt.no/torp/' },
    { title: 'VKT: Ha med om bord', url: 'https://www.vkt.no/reise/ha-med-ombord/' },
    { title: 'Vy: Sykkel på toget', url: 'https://www.vy.no/alt-om-reisen/tog/praktisk-informasjon/sykkel-pa-toget' },
    { title: 'Color Line: Praktisk informasjon Sandefjord–Strømstad', url: 'https://www.colorline.no/sandefjord-stroemstad/fakta' },
    { title: 'Color Line: Sikkerhet om bord', url: 'https://www.colorline.no/praktisk-informasjon/sikkerhet-om-bord' },
    { title: 'Fjord Line: Fjord Line avslutter Oslofjord-ruten tidligere enn planlagt (oktober 2023)', url: 'https://www.fjordline.com/nb/p/presse-og-media/pressemeldinger/fjord-line-avslutter-oslofjord-ruten-tidligere-enn-planlagt' },
    { title: 'Larvik kommune: Elsparkesykler, orientering 2. juni 2026 (PDF)', url: 'https://www.larvik.kommune.no/media/ei3jaz1v/20260602-rmnf-elsparkesyklerpptx.pdf' },
  ],
};

export default guide;
