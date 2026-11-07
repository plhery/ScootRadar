import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-larvik',
  topic: 'larvik',
  name: 'Leie elsparkesykkel i Larvik',
  title: 'Elsparkesykkel Larvik 2026: Ryde, pris, soner og regler',
  description: 'Elsparkesykkel i Larvik: Ryde, 5,90 kr pluss 2,50 kr/min (november 2026), stengt kl. 23–05. Soner i sentrum, stasjonen, ferja til Hirtshals og reglene.',
  headline: 'Elsparkesykkel i Larvik: Ryde, pris, nattestenging, soner og parkering',
  lede: 'Vil du leie elsparkesykkel i Larvik, er det Ryde som gjelder: Ryde var det eneste selskapet som søkte om og fikk kommunens tillatelse for 2026 og 2027, skriver kommunen (mars 2026). Ifølge Rydes åpne data (november 2026) koster det 5,90 kr å låse opp og 2,50 kr per minutt, og du kan leie fra kl. 05 til 23. Kommunens forskrift stenger utleien fra kl. 23 til 05 hver natt, og Ryde skal fjerne sparkesyklene når vinterdriften krever det. Rydes område dekket 1. november 2026 selve byen, fra Nanset til Østre Halsen, men ikke Stavern.',
  published: '2026-11-02',
  updated: '2026-11-02',
  city: 'no:Larvik',
  sections: [
    {
      heading: 'Leie elsparkesykkel i Larvik: bare Ryde',
      blocks: [
        'I Larvik er det **Ryde** som leier ut elsparkesykler. Kommunens side om elsparkesykler (publisert 10. mars 2026) sier at Ryde som eneste selskap søkte om og fikk tillatelse til å leie ut elsparkesykler på offentlig grunn i Larvik kommune i 2026 og 2027, med 750 sparkesykler ved oppstart og mulighet for å øke til 1000. Utleie på offentlig grunn krever tillatelse etter kommunens forskrift, som kommunestyret vedtok 18. juni 2025.',
        '[Kartet over Larvik](map:no:Larvik) viste rundt 210 Ryde-sparkesykler kl. 14.32 søndag 1. november 2026. Tallet gjelder Rydes område i Larvik by: sentrum og bydelene rundt, fra Nanset i nord til Torstrand og Østre Halsen i sørøst og Langestrand og Veldre i vest. Stavern, Kvelde og Tjølling ligger utenfor Rydes område (1. november 2026).',
        'Kl. 14.21 samme dag viste kartet de fleste i bydelene rundt sentrum, mange av dem på Nanset og Byskogen, og ingen i Stavern. Kl. 14.31 viste kartet bare 9 i sentrumsområdet fra Farris Bad og Torget til stasjonen og Herregården. Trykker du på en Ryde-sparkesykkel på kartet, ser du hvor langt den rekker på batteriet og et anslag på hva turen koster.',
        'Hvordan du registrerer deg, låser opp og avslutter turen, står i [guiden om å leie elsparkesykkel](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Hva koster det å leie Ryde i Larvik?',
      blocks: [
        'Ifølge Rydes åpne data (november 2026) koster det 5,90 kr å låse opp en Ryde i Larvik, og deretter 2,50 kr per minutt. Opplåsingen koster dermed 5 kr mindre enn i [Tønsberg](guide:tonsberg), der Ryde tar 10,90 kr. Prisene kan endres, så sjekk appen før du låser opp.',
        {
          table: {
            caption: 'Ryde i Larvik og Tønsberg, ifølge Rydes åpne data i november 2026',
            head: ['By', 'Opplåsing', 'Per minutt', 'Åpent'],
            rows: [
              ['Larvik', '5,90 kr', '2,50 kr', 'Kl. 05–23 alle dager'],
              ['Tønsberg', '10,90 kr', '2,50 kr', 'Kl. 05–01, men 05–23 fredag og lørdag'],
            ],
          },
        },
        'Loven sier at du må ha fylt 12 år, og hjelm er påbudt under 15 år. Statens vegvesen minner om at utleieselskapene kan ha høyere aldersgrense, for eksempel 16 eller 18 år, og hva Ryde krever, ser du i appen. Regjeringen foreslo 5. oktober 2026 å heve den nasjonale aldersgrensen til 16 år. Forslaget ble sendt på høring 5. november 2026, med frist 5. februar 2027, og er **ikke vedtatt**.',
      ],
    },
    {
      heading: 'Når kan du leie? Stengt fra kl. 23 til 05',
      blocks: [
        'Forskriften for Larvik sier i § 6 g at utleie kan skje «alle dager, hele dagen, unntatt i tidsrommet mellom kl. 23.00–05.00». Rydes åpne data (november 2026) viser det samme: Du kan leie fra kl. 05 til 23, alle dager.',
        'Forskriften sier også at alarmer med lyd skal være slått av fra kl. 20 til 07 natt til hverdager, og fra kl. 20 til 09 natt til lørdager, søndager og helligdager.',
        '**Vinter:** Etter forskriften (§ 6 k) skal utleieren på eget initiativ fjerne sparkesyklene når veieier eller grunneier har drifts- og vedlikeholdsoppgaver som krever det, som ved vinterdrift, og kommunen kan i tillegg sette egne frister for rydding og fjerning. Tidene i andre byer står i guiden om [åpningstider for elsparkesykler](guide:opening-hours).',
      ],
    },
    {
      heading: 'Hvor kan du kjøre? Rydes område og soner i Larvik',
      blocks: [
        'Du kan kjøre i veien, i kollektivfeltet, i sykkelfeltet på høyre side og på gang- og sykkelvei. På fortau og gangvei er det lov når det er lite folk og du ikke er til fare eller hinder. Er det mye folk, går du av og triller, og forbi gående holder du gangfart, aldri over 6 km/t. På motorvei og motortrafikkvei, og der skilt forbyr sykling eller elsparkesykler, får du ikke kjøre.',
        'Forskriften lar kommunen bestemme digitale soner med parkeringsforbud, bruksforbud eller lavere fart, og utleieren må legge dem inn. Rydes soner i Larvik viste blant annet dette 1. november 2026:',
        {
          list: [
            '**Saktesoner på 15 km/t** rundt stasjonen og Herregården, langs havna ved Farris Bad og Strandgata, og ved flere skoler, blant annet Langestrand skole, Hedrum ungdomsskole og Fagerli skole.',
            '**Saktesoner på 12 km/t** i Larvik havn og rundt Torget.',
            '**Kjøreforbud** i mindre felt ved flere skoler, barnehager og idrettshaller, blant annet Langestrand skole, Frøy skole, Ra ungdomsskole, Farrishallen og Fagerlihallen, og ved Herregården og Larvik stasjon.',
            '**Parkeringsforbud** blant annet rundt Larvik stasjon, ved Badeparken, på Byskogen og Mesterfjellet og i flere boligområder. Du kan kjøre gjennom, men ikke avslutte turen der.',
            '**Rydes område** dekker byen fra Nanset i nord til Torstrand og Østre Halsen i sørøst, og vestover til Langestrand og Veldre. I noen felt, blant annet Bøkeskogen og fergeterminalen på Revet, kan du kjøre, men ikke avslutte turen. Stavern, Kvelde og Tjølling ligger utenfor, og der får du ikke kjøre.',
          ],
        },
        'Zoomer du inn på [kartet over Larvik](map:no:Larvik), ser du sonene: felt der du ikke får kjøre, felt med parkeringsforbud og saktesonene. Sonene kan endres, så det er appen som gjelder. Kjører du inn i en sone med lav fart, setter sparkesykkelen ned farten selv.',
      ],
    },
    {
      heading: 'Parkering i Larvik: hensyn og forbudssoner',
      blocks: [
        'Statens vegvesen skriver at du kan parkere på gang- og sykkelvei, fortau og i gågate så lenge sparkesykkelen ikke er til hinder eller ulempe for andre, også rullestolbrukere og svaksynte. Sett den slik at den ikke velter.',
        'I Rydes soner (1. november 2026) er det parkeringsforbud rundt Larvik stasjon. Kommunens kart over restriksjonsområder, som kommunen viste i en presentasjon 2. juni 2026, har også parkeringsforbud ved stasjonen.',
        'Etter forskriften skal utleieren på eget initiativ og fortløpende fjerne sparkesykler som er til hinder for fremkommeligheten, som har veltet eller ikke fungerer, eller som har havnet i elver og sjø. Kommunen kan fjerne sparkesykler, ta dem i forvaring og kreve betaling.',
        { note: 'Kommunens side (mars 2026) oppgir Ryde Technology AS som kontakt: telefon 67 79 26 44 og e-post support@ryde-technology.com. Ryde har også egne regler for bruk, som du finner i appen.' },
      ],
    },
    {
      heading: 'Larvik stasjon, VKT-bussen og ferja til Hirtshals',
      blocks: [
        'Larvik stasjon ligger på Vestfoldbanen, og herfra går toget mot Oslo S, Oslo lufthavn, Eidsvoll og Grenland, skriver Bane NOR (november 2026). Stasjonen har et sykkelhotell med 65 plasser som er åpent hele døgnet. I Rydes soner (1. november 2026) er det kjøreforbud i et felt ved selve stasjonen, og parkeringsforbud og 15 km/t rundt den, så avslutt turen utenfor forbudssonen.',
        {
          list: [
            '**Leid elsparkesykkel:** Avslutt turen og parker lovlig før du går på toget, bussen eller ferja.',
            '**Egen elsparkesykkel på bussen:** Hos VKT må du siden 1. februar 2026 betale for sykkel og elsparkesykkel, til samme pris som en barnebillett, og billetten kjøper du hos sjåføren eller i VKT-appen. Bussene har plass til maks to sykler, rullestol og barnevogn har prioritet, og sparkesykkelen kan være maks 175 cm lang og 70 cm bred. Små sparkesykler for barn opptil 10 år, som kan bæres under armen, er gratis (november 2026).',
            '**Bussen til Stavern og Torp:** Ifølge VKT (oktober 2026) går linje 4 mellom Stavern, Larvik, Tjølling, Sandefjord og Torp Sandefjord lufthavn, linje 3 mellom Veldre, Larvik og Sandefjord, og linje 6 Ekspress mellom Larvik og Tønsberg. En voksen enkeltbillett koster 45 kr på mobil og 55 kr kjøpt om bord.',
            '**Toget:** Billetter kjøper du hos togselskapene eller i Entur, skriver Bane NOR. Reglene for egen elsparkesykkel på toget sjekker du hos togselskapet.',
            '**Ferja til Hirtshals:** Ifølge Color Line (november 2026) ligger terminalen i Revet 8, rundt 2,5 km fra tog og buss, og overfarten med SuperSpeed tar 3 timer og 45 minutter. Ved terminalen kan du ikke avslutte en Ryde-tur (1. november 2026), og nærmeste sted der du kan, er rundt 300 meter unna i luftlinje. En egen elsparkesykkel kan bare fraktes på bildekket, og lading om bord er ikke tillatt, skriver Color Line.',
          ],
        },
        'Om Ryde i nabobyene: Se guidene for [Sandefjord](guide:sandefjord), [Tønsberg](guide:tonsberg) og [Skien](guide:skien).',
      ],
    },
    {
      heading: 'Regler og bøter for elsparkesykkel i Larvik',
      blocks: [
        'Trafikkreglene og bøtene er de samme som i resten av landet. Du må ha fylt 12 år, hjelm er påbudt under 15 år, og promillegrensen er 0,2, som for bil. Bare én person får stå på sparkesykkelen, og den er sperret til 20 km/t. I mørket skal du ha hvitt eller gult lys foran og rødt bak. Alle elsparkesykler skal ha ansvarsforsikring, også de private.',
        {
          table: {
            caption: 'Bøter og gebyrer for elsparkesykkel, per oktober 2026',
            head: ['Overtredelse', 'Beløp'],
            rows: [
              ['Holde mobilen i hånden mens du kjører', '10 750 kr'],
              ['Være to på samme sparkesykkel', '3000 kr'],
              ['Kjøre på rødt lys', '1950 kr'],
              ['Kjøre uten påbudt lys i mørket', '1950 kr'],
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
      heading: 'Visste du dette om Larvik?',
      blocks: [
        {
          list: [
            '**Stasjonen er fra 1881.** Larvik stasjon åpnet da Vestfoldbanen sto ferdig i 1881. Bane NOR oppgir Balthazar Lange som arkitekt og skriver at stasjonen er fredet.',
            '**Turene steg fra 7700 i mars til 20 100 i mai 2026.** Det viste kommunens presentasjon om elsparkesykler 2. juni 2026, med 15 500 turer i april. Per 1. juni hadde Ryde 3000 brukere i Larvik, med en snittalder på 33,7 år.',
            '**«Bakkebyen».** I samme presentasjon skriver kommunen at bilandelen i Larvik er svært høy, også på korte reiser under 3 km, og kaller elsparkesykkelen et virkemiddel for å få flere til å velge noe annet enn bilen: «Særlig viktig i bakkebyen – ikke alle har råd til elsykkel».',
            '**Stavern har en egen sone i forskriften.** Kommunen kan begrense antallet sparkesykler i fire soner: Larvik sentrum, Larvik byområde, Stavern og øvrige områder. Stavern lå likevel utenfor Rydes område 1. november 2026.',
            '**En egen sone for 17. mai.** Kommunens kart over restriksjonsområder i presentasjonen 2. juni 2026 har en egen sone merket «Ingen kjøring 17 mai», fra Bøkeskogen gjennom sentrum.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Hvilke elsparkesykler kan jeg leie i Larvik?',
      answer: 'Ryde. Ryde var det eneste selskapet som søkte om og fikk kommunens tillatelse for 2026 og 2027, skriver kommunen (mars 2026). Ryde er med på kartet.',
    },
    {
      question: 'Hva koster det å leie Ryde i Larvik?',
      answer: 'Ifølge Rydes åpne data (november 2026) koster det 5,90 kr å låse opp og 2,50 kr per minutt. Sjekk prisen i appen før du låser opp.',
    },
    {
      question: 'Når stenger utleien om natten i Larvik?',
      answer: 'Fra kl. 23 til 05 hver natt. Det står i kommunens forskrift, og Rydes åpne data (november 2026) viser de samme tidene.',
    },
    {
      question: 'Kan jeg leie elsparkesykkel i Stavern?',
      answer: 'Ikke 1. november 2026: Stavern lå utenfor Rydes område, og kartet viste ingen sparkesykler der. VKTs linje 4 går mellom Larvik og Stavern.',
    },
    {
      question: 'Kan jeg ta med elsparkesykkel på bussen eller ferja?',
      answer: 'En egen elsparkesykkel kan bli med på VKT-bussen hvis det er plass, og siden 1. februar 2026 betaler du barnebillett for den. På Color Lines ferje til Hirtshals skal den stå på bildekket, og den får ikke lades om bord. En leid Ryde parkerer du lovlig før du går om bord.',
    },
  ],
  sources: [
    { title: 'Larvik kommune: Elsparkesykler (publisert 10. mars 2026, oppdatert 12. mars 2026)', url: 'https://www.larvik.kommune.no/vann-vei-og-renovasjon/vei-og-trafikk/elsparkesykler/' },
    { title: 'Larvik kommune: Elsparkesykler, presentasjon 2. juni 2026 (PDF, med forskriften og kartet over restriksjonsområder)', url: 'https://www.larvik.kommune.no/media/ei3jaz1v/20260602-rmnf-elsparkesyklerpptx.pdf' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy på offentlig grunn, Larvik kommune, Vestfold', url: 'https://lovdata.no/dokument/LF/forskrift/2025-06-18-1805' },
    { title: 'Entur: Rydes åpne data for Larvik (GBFS, 7. november 2026)', url: 'https://api.entur.io/mobility/v2/gbfs/v3/rydelarvik/gbfs' },
    { title: 'Entur: Rydes åpne data for Tønsberg (GBFS, 7. november 2026)', url: 'https://api.entur.io/mobility/v2/gbfs/v3/rydetonsberg/gbfs' },
    { title: 'VKT: Ha med om bord', url: 'https://www.vkt.no/reise/ha-med-ombord/' },
    { title: 'VKT: Ta bussen til Torp Sandefjord lufthavn (2. oktober 2026)', url: 'https://www.vkt.no/torp/' },
    { title: 'Bane NOR: Larvik stasjon', url: 'https://www.banenor.no/reise-og-trafikk/stasjoner/-l-/larvik/' },
    { title: 'Color Line: Larvik–Hirtshals', url: 'https://www.colorline.no/larvik-hirtshals' },
    { title: 'Color Line: Larvik–Hirtshals, fakta', url: 'https://www.colorline.no/larvik-hirtshals/fakta' },
    { title: 'Color Line: Sikkerhet om bord', url: 'https://www.colorline.no/praktisk-informasjon/sikkerhet-om-bord' },
    { title: 'Statens vegvesen: Trafikkregler for elsparkesykler', url: 'https://www.vegvesen.no/trafikkinformasjon/trafikksikkerhet/sikker-pa-elsparkesykkel/trafikkregler/' },
    { title: 'Samferdselsdepartementet: Sender forslag om å heve aldersgrense for bruk av elsparkesykkel på høring (5. november 2026)', url: 'https://kommunikasjon.ntb.no/pressemelding/19132352/sender-forslag-om-a-heve-aldersgrense-for-bruk-av-elsparkesykkel-pa-horing?lang=no' },
    { title: 'Samferdselsdepartementet: Regjeringen foreslår å heve aldersgrensen for bruk av elsparkesykler til 16 år (5. oktober 2026)', url: 'https://kommunikasjon.ntb.no/pressemelding/19092540/regjeringen-foreslar-a-heve-aldersgrensen-for-bruk-av-elsparkesykler-til-16-ar?lang=no' },
  ],
};

export default guide;
