import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-regler',
  topic: 'norwegian-rules',
  name: 'Regler for elsparkesykkel i Norge',
  title: 'Elsparkesykkel-regler 2026: alder, hjelm, promille og bøter',
  description: 'Reglene for elsparkesykkel i Norge i 2026: aldersgrense, hjelm, promille, fortau og bøter i kroner, og hva som gjelder når du leier i Oslo og andre byer.',
  headline: 'Regler for elsparkesykkel i Norge: alder, hjelm, promille og bøter',
  lede: 'Reglene for elsparkesykkel i Norge er enkle å huske: Du må ha fylt 12 år, du må ha hjelm hvis du er under 15, og promillegrensen er 0,2, den samme som for bil. En aldersgrense på 16 år er foreslått, men ikke vedtatt, og operatørene som leier ut, har ofte høyere grense enn loven. Du kjører på veien, i sykkelfeltet eller på sykkelveien, og på fortauet når det er lite folk, men forbi gående holder du gangfart. Bare én person får stå på sparkesykkelen, og i Oslo er utleien stengt hver natt fra kl. 23 til 05.',
  published: '2026-10-12',
  updated: '2026-10-17',
  city: 'no:Oslo',
  sections: [
    {
      heading: 'Regler for elsparkesykkel i korte trekk',
      blocks: [
        'Siden 15. juni 2022 er elsparkesykkelen en «liten elektrisk motorvogn». Den følger derfor mange av reglene for motorvogner, men du trenger ikke førerkort, og den skal ikke registreres.',
        {
          table: {
            caption: 'Det viktigste, per oktober 2026',
            head: ['Regel', 'Dette gjelder', 'Hjemmel'],
            rows: [
              ['Aldersgrense', '12 år. 16 år er foreslått, men ikke vedtatt', 'Førerkortforskriften § 12-1'],
              ['Hjelm', 'Påbudt under 15 år, anbefalt for alle', 'Verneutstyrforskriften § 4'],
              ['Promille', '0,2 promille i blodet, eller 0,1 mg per liter utåndingsluft', 'Vegtrafikkloven § 22'],
              ['Passasjer', 'Forbudt: én person per sparkesykkel', 'Bruksforskriften § 3-1'],
              ['Fart', 'Sperret til maks 20 km/t, maks 6 km/t forbi gående', 'Krav til liten elektrisk motorvogn § 3, trafikkreglene § 20'],
              ['Fortau', 'Lov når det er lite gangtrafikk og du ikke er til fare eller hinder', 'Trafikkreglene § 20'],
              ['Lys', 'Alltid rød refleks bak, i mørket hvitt eller gult lys foran og rødt bak', 'Krav til liten elektrisk motorvogn § 7'],
              ['Forsikring', 'Påbudt ansvarsforsikring, for private sparkesykler siden 1. januar 2023', 'Bilansvarslova'],
              ['Førerkort', 'Ikke nødvendig', 'Førerkortforskriften § 12-1'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Aldersgrense og hjelm på elsparkesykkel',
      blocks: [
        'Du må ha fylt **12 år** og ha «nødvendig ferdighet» for å kjøre elsparkesykkel. Det står i førerkortforskriften § 12-1.',
        'Den 5. oktober 2026 foreslo regjeringen å heve aldersgrensen til **16 år**. Samferdselsdepartementet ber Statens vegvesen sende forslaget på høring, fordi skadene blant barn og unge har økt kraftig fra 2024 til 2026.',
        '**Forslaget er ikke vedtatt.** Pressemeldingen sier ikke når en endring kan tre i kraft, eller om den gjelder både private og leide elsparkesykler. Inntil videre gjelder 12 år. Flere operatører har egne, høyere grenser, se avsnittet om leie nedenfor.',
        'Er du under 15 år, skal du bruke en godkjent og CE-merket sykkelhjelm når du kjører. Fra 15 år er hjelmen frivillig, men Statens vegvesen anbefaler den for alle.',
        { note: 'Tolv personer døde i ulykker med elsparkesykkel i årene 2019–2024. Ingen av dem hadde hjelm, og Statens vegvesen mener at åtte av dem kunne ha overlevd med hjelm.' },
        'Et overtredelsesgebyr kan bare gis til den som har fylt 15 år, så et barn uten hjelm får ikke gebyr, men påbudet gjelder like fullt. Ifølge NAF kan foreldrene holdes ansvarlige. Statens vegvesen utreder i 2026 om alle som kjører elsparkesykkel eller sykkel, skal få hjelmpåbud. Ingenting er bestemt.',
      ],
    },
    {
      heading: 'Hvor kan du kjøre? Vei, sykkelvei og fortau',
      blocks: [
        {
          list: [
            '**Veien:** lov. Du følger de vanlige trafikkreglene, med vikeplikt, lyskryss og fartsgrenser.',
            '**Kollektivfeltet:** lov. Hold deg unna bussens blindsone.',
            '**Sykkelvei og sykkelfelt:** lov, men sykkelfeltet bare på høyre side av veien. Du kan også kjøre på veiskulderen til høyre.',
            '**Fortau, gangvei og gangfelt:** lov når det er lite folk og du ikke er til fare eller hinder. Forbi gående holder du god avstand, kjører i gangfart og aldri over **6 km/t**. Er det mye folk, går du av og triller.',
            '**Gågate:** lov, men maks 6 km/t.',
            '**Forbudt:** motorvei og motortrafikkvei, veier som er skiltet forbudt for syklende (mange tunneler og noen bruer), og der skiltet «Forbudt for liten elektrisk motorvogn» står.',
          ],
        },
        'Kjører du over et gangfelt, regnes du ikke som gående, og bilene har ingen vikeplikt for deg. Går du av og triller over, må de stoppe.',
        'Mange tror det er forbudt å kjøre på fortauet i de fleste byer. Det stemmer ikke: Et nasjonalt forbud ble vurdert i 2022, men ikke innført, og kommunene kan ikke forby det generelt. Lokalt kan et skilt likevel forby elsparkesykler på en strekning, også på fortauet, eller sette fartsgrensen til 6 km/t.',
      ],
    },
    {
      heading: 'Passasjer, lys og forsikring',
      blocks: [
        'Elsparkesykkelen er for én person. Står dere to på den, koster det **3000 kr** i gebyr. Det er heller ikke lov å trekke en passasjer i tilhenger.',
        'Sparkesykkelen skal alltid ha rød refleks bak og ringeklokke eller horn. I mørket eller ved dårlig sikt skal du ha hvitt eller gult lys foran og rødt lys bak, synlig på 300 meters avstand. Lyktene kan sitte på kroppen, men ikke på hodet.',
        'Farten skal være sperret til maks 20 km/t, og sperren skal ikke kunne endres med bryter, kjøremodus eller app. En trimmet sparkesykkel er ikke lenger en liten elektrisk motorvogn. Da må den registreres og forsikres, du må bruke motorsykkelhjelm, og du får bare kjøre i veibanen. I praksis er den derfor ulovlig å kjøre, ifølge Statens vegvesen.',
        'Alle elsparkesykler skal ha ansvarsforsikring: sparkesykler til utleie siden 1. september 2022 og private siden 1. januar 2023. Leier du, er det operatørens ansvar. Eier du en selv, er det straffbart å kjøre uten, og er du under 18, må foreldrene tegne forsikringen. Ifølge Trafikkforsikringsforeningen var bare rundt 120 000 private elsparkesykler forsikret i september 2026, så de fleste kjører uten.',
      ],
    },
    {
      heading: 'Promillegrense på elsparkesykkel: 0,2 som i bil',
      blocks: [
        'Promillegrensen er 0,2, akkurat som for bil. Selv et forsøk på å kjøre i påvirket tilstand er straffbart. Som hovedregel sier vegtrafikkloven § 31 dette:',
        {
          list: [
            '**0,2 til 0,5 promille:** bot.',
            '**Over 0,5 og opptil 1,2:** bot og betinget eller ubetinget fengsel.',
            '**Over 1,2:** bot og ubetinget fengsel.',
          ],
        },
        'I praksis straffes promillekjøring på elsparkesykkel mildere enn i bil. I februar 2023 ga Høyesterett en fører som hadde kjørt med 0,8 promille over Ankerbrua i Oslo, **15 000 kr i bot** og ingen tap av førerett. De lavere instansene hadde gitt 70 000 kr i bot, 14 dagers betinget fengsel og tolv måneders tap av førerett.',
        'Ifølge dommen er 15 000 kr utgangspunktet når du tilstår på dette nivået, ikke halvannen bruttomånedslønn som for bil. Tap av førerett bør normalt ikke idømmes ved så lave promiller på elsparkesykkel, og retten kan heller forby deg å kjøre førerkortfrie kjøretøy. Har du ikke førerkort, kan du få en sperrefrist før du kan ta det.',
        'Har du kjørt og forstår at politiet kan komme til å etterforske saken, må du ikke drikke alkohol de neste seks timene.',
      ],
    },
    {
      heading: 'Bot på elsparkesykkel: dette koster det i 2026',
      blocks: [
        'Satsene for forenklet forelegg ble justert 15. februar 2026. Dette er de viktigste beløpene for elsparkesykkel:',
        {
          table: {
            caption: 'Bøter og gebyrer for elsparkesykkel, per oktober 2026',
            head: ['Overtredelse', 'Beløp', 'Type'],
            rows: [
              ['Holde mobilen i hånden mens du kjører', '10 750 kr', 'Forenklet forelegg'],
              ['Være to på samme sparkesykkel', '3000 kr', 'Overtredelsesgebyr'],
              ['Kjøre på rødt lys', '1950 kr', 'Forenklet forelegg'],
              ['Kjøre uten påbudt lys i mørket', '1950 kr', 'Forenklet forelegg'],
              ['Kjøre der skilt forbyr det, eller i en sone med bruksforbud', '1950 kr', 'Forenklet forelegg'],
              ['Kjøre på motorvei eller motortrafikkvei', '1950 kr', 'Forenklet forelegg'],
              ['Parkere til hinder eller der det er forbudt', '900 kr', 'Parkeringsgebyr'],
              ['Bli tauet bort i Oslo', '7400 kr, pluss 400 kr per døgn og parkeringsgebyret', 'Inntauing, Oslo kommune'],
              ['Kjøre med rundt 0,8 promille, tilstått', 'Utgangspunkt 15 000 kr', 'Bot, Høyesterett (HR-2023-298-A)'],
            ],
          },
        },
        'Mobilforbudet gjelder fordi elsparkesykkelen er en motorvogn, og det er mobilen i hånden som er forbudt. Prikker i førerkortet får du likevel ikke: Prikkforskriften gjelder bare kjøretøy du må ha førerkort for.',
        'Begår du flere overtredelser på én gang, slås bøtene sammen til én: den høyeste fullt ut, pluss halvparten av de andre.',
        'Det finnes ingen fast bot for å kjøre på fortauet, fordi det i utgangspunktet er lov. Kjører du uforsiktig blant gående, kan politiet likevel gi deg et vanlig forelegg eller anmelde deg.',
        'Gebyret for å være to kan bare gis til den som har fylt 15 år. Statens vegvesen minner om at lovbrudd kan stå på politiattesten din, og at det kan hindre deg i å reise til blant annet USA.',
      ],
    },
    {
      heading: 'Leie elsparkesykkel: aldersgrense, ID og reaksjonstest',
      blocks: [
        'Når du leier, gjelder både trafikkreglene og operatørens vilkår, og flere operatører har høyere aldersgrense enn loven. Ifølge regjeringen har mange utleieselskaper allerede 15 eller 16 år som grense.',
        {
          list: [
            '**Ryde:** minst 16 år, etter vilkårene for Norge (oktober 2026; i august 2026 var grensen 15 år). Kontoen er personlig, og Ryde kan kontrollere opplysningene dine. På kveldstid i helgene må du ta en reaksjonstest før turen.',
            '**Bolt:** fra 1. november 2026 minst 16 år, etter Bolts nye vilkår for Norge. Hvilken grense som gjelder før det, ser du i appen. Bolt kan be om bilde av førerkortet eller annen legitimasjon, og for å låse opp i topptimer må du bestå en kognitiv reaksjonstest.',
            '**Voi og Dott:** sjekk appen for aldersgrense og eventuell ID-kontroll.',
          ],
        },
        'Oslo kommune ber deg la være å leie hvis du er under 15 år, og ikke leie for noen andre som er under 15.',
        'For utleie bestemmer kommunene hvor mange sparkesykler som får stå ute, når utleien er stengt, og hvor det er saktesoner og parkeringsforbud. Operatørene håndhever det med geofencing i appen. Ansvaret for å parkere lovlig er likevel ditt: Står sparkesykkelen til hinder eller der det er forbudt å parkere, kan du få 900 kr i parkeringsgebyr.',
        'Vil du se den nærmeste sparkesykkelen uansett operatør, viser [kartet til ScootRadar](/map) dem samlet. Du låser opp og betaler i operatørens egen app.',
      ],
    },
    {
      heading: 'Elsparkesykkel i Oslo: tre operatører, stengt om natten',
      blocks: [
        'Oslos utleieforskrift har gjeldt fullt ut siden 1. april 2025. Kommunen gir tillatelse til nøyaktig tre operatører, og i dag er det **Bolt, Ryde og Voi**. I Ruter-appen kan du også finne og låse opp elsparkesykler. Priser, soner og parkering finner du i guiden [Elsparkesykkel i Oslo](guide:oslo).',
        {
          list: [
            'Taket er **16 000** små elektriske kjøretøy til sammen, og da er elsyklene til leie regnet med. Under den forrige forskriften var taket 8000.',
            'Innenfor Ring 1 kan det stå maks 1200 av dem.',
            '**Stengt fra kl. 23 til 05** hver natt. Byrådet kan korte inn eller oppheve stengingen.',
            'Ikke parker i stativene til Oslo Bysykkel, og heller ikke nærmere enn 5 meter fra et kryss, et gangfelt eller en sykkelkryssing. Feilparkering koster 900 kr, og appen sier ikke fra om du har parkert ulovlig.',
          ],
        },
        'Hvor det er parkeringsforbud, kjøreforbud og saktesoner, ser du i kommunens [kart over reguleringene](https://experience.arcgis.com/experience/e77cffa7119144f3bf9cb57c294cbcef).',
        'På [kartet rundt Oslo](map:no:Oslo) sto det rundt 15 000 kjøretøy fra Voi, Bolt og Ryde 12. oktober 2026. Utsnittet går utover kommunegrensen, så tallet kan ikke sammenlignes med kommunens tak. Samme dag publiserte Bolt og Voi en pris på 10 kr for å låse opp og 2,50 kr per minutt. Den endelige prisen ser du i operatørens app.',
      ],
    },
    {
      heading: 'Bergen, Trondheim og andre byer',
      blocks: [
        'Lovdata har over hundre lokale forskrifter om utleie av små elektriske kjøretøy, og de fleste byene i tabellen stenger utleien om natten, i alle fall natt til helg. Bergen har ikke forbudt elsparkesykler.',
        {
          table: {
            caption: 'Utleieregler i utvalgte byer, per oktober 2026',
            head: ['By', 'Stengt om natten', 'Verdt å vite'],
            rows: [
              ['Trondheim', 'Forskriften: 23–05 hver natt. I 2026 har Voi og Ryde bare stengt natt til lørdag og søndag', 'Sesong fra 15. mars til 1. desember, og stengt ved fare for snø og is. Opptil tre operatører og 3200 kjøretøy til sammen; kommunen fastsetter antallet før hver sesong.'],
              ['Bergen', 'Ny forskrift: 23–05 natt til lørdag, søndag og røde dager', 'Saktesoner i sentrum, de fleste på 12 km/t. Den nye forskriften fra juni 2026 gir opptil to operatører, valgt etter konkurranse. Dagens operatører fortsetter til de nye tillatelsene starter, etter planen 31. mars 2027.'],
              ['Stavanger', '00–05 natt til lørdag, søndag og helligdager', 'Opptil to operatører, med tak på antall kjøretøy per sone.'],
              ['Kristiansand', 'Forskriften: 00–05 natt til lørdag og søndag. Voi stenger allerede kl. 23', 'Opptil to operatører, i dag Voi og Ryde, med avtale til 31. mars 2027. Sparkesyklene tas inn ved fare for snø og is.'],
              ['Tromsø', '23–06 natt til lørdag, søndag og helligdager', 'Ny forskrift fra 1. januar 2026: inntil to operatører (i 2026 bare Ryde) og maks 200 kjøretøy i sentrum.'],
              ['Skien og Porsgrunn', 'Ikke stengt', 'Maks 12 km/t i sentrum fra kl. 00 til 05. Om vinteren bare elsykler med piggdekk.'],
              ['Tønsberg', '23–05 natt til lørdag, søndag og helligdager, ellers 01–05', 'Maks 300 kjøretøy. Tas inn ved fare for snø og is.'],
              ['Fredrikstad og Sarpsborg', 'Ingen fast stenging i forskriften', 'Kommunen kan innføre stengetider, saktesoner og kjøreforbud. Sparkesyklene tas inn når det snør.'],
              ['Arendal', '00–05 hver natt', 'Tillatelsene gjelder for to sesonger.'],
              ['Sandefjord', '01–05', 'Alle kvalifiserte operatører får ettårig tillatelse.'],
              ['Asker', 'Stengt hele vinteren', 'Opptil to operatører.'],
            ],
          },
        },
        'Alle byene i tabellen unntatt Bergen finner du på kartet, for eksempel [Trondheim](map:no:Trondheim) og [Stavanger](map:no:Stavanger).',
      ],
    },
  ],
  faq: [
    {
      question: 'Kan jeg miste lappen for promillekjøring på elsparkesykkel?',
      answer: 'Loven åpner for tap av førerett i minst ett år over 0,5 promille, også på elsparkesykkel. Men Høyesterett slo i 2023 fast at det normalt ikke bør skje ved så lave promiller: For 0,8 promille ble straffen 15 000 kr i bot, uten tap av førerett.',
    },
    {
      question: 'Hvor gammel må du være for å leie elsparkesykkel?',
      answer: 'Loven sier 12 år, men operatørene setter egne grenser. Ryde krever 16 år, og Bolts vilkår for Norge krever 16 år fra 1. november 2026. Oslo kommune ber alle under 15 la være å leie. Hos Voi og Dott ser du grensen i appen.',
    },
    {
      question: 'Må bilene stoppe for meg i gangfeltet?',
      answer: 'Ikke hvis du kjører over. Da regnes du ikke som gående, og bilene har ingen vikeplikt for deg. Går du av og triller sparkesykkelen over, må de stoppe.',
    },
    {
      question: 'Hvor fort kan en elsparkesykkel gå?',
      answer: 'En lovlig elsparkesykkel er sperret til maks 20 km/t, og sperren skal ikke kunne endres. Forbi gående skal du holde gangfart og aldri kjøre fortere enn 6 km/t. I saktesoner setter en leid sparkesykkel ned farten automatisk.',
    },
    {
      question: 'Hvorfor kan jeg ikke leie elsparkesykkel om natten?',
      answer: 'Fordi mange kommuner har bestemt at utleien skal være stengt om natten. I Oslo er den stengt fra kl. 23 til 05 hver natt. Trondheims forskrift sier det samme, men i 2026 har Voi og Ryde bare stengt natt til lørdag og søndag, så sjekk appen. I Stavanger og Tromsø gjelder stengingen bare natt til lørdag, søndag og helligdager.',
    },
    {
      question: 'Blir aldersgrensen for elsparkesykkel 16 år?',
      answer: 'Kanskje. Regjeringen foreslo 5. oktober 2026 å heve den fra 12 til 16 år, og forslaget skal på høring. Det er ikke vedtatt, og det er ikke satt noen dato, så inntil videre gjelder 12 år.',
    },
  ],
  sources: [
    { title: 'Statens vegvesen: Trafikkregler for elsparkesykler', url: 'https://www.vegvesen.no/trafikkinformasjon/trafikksikkerhet/sikker-pa-elsparkesykkel/trafikkregler/' },
    { title: 'Statens vegvesen: Barn og elsparkesykkel', url: 'https://www.vegvesen.no/trafikkinformasjon/trafikksikkerhet/sikker-pa-elsparkesykkel/barn-og-elsparkesykkel/' },
    { title: 'Lovdata: Trafikkreglene (forskrift om kjørende og gående trafikk)', url: 'https://lovdata.no/dokument/SF/forskrift/1986-03-21-747' },
    { title: 'Lovdata: Vegtrafikkloven', url: 'https://lovdata.no/dokument/NL/lov/1965-06-18-4' },
    { title: 'Lovdata: Forskrift om forenklet forelegg i vegtrafikksaker', url: 'https://lovdata.no/dokument/SF/forskrift/1990-06-29-492' },
    { title: 'Høyesterett: HR-2023-298-A, promillekjøring på elsparkesykkel', url: 'https://www.domstol.no/globalassets/upload/hret/avgjorelser/2023/februar/hr-2023-298-a.pdf' },
    { title: 'Samferdselsdepartementet: Regjeringen foreslår å heve aldersgrensen for bruk av elsparkesykler til 16 år (5. oktober 2026)', url: 'https://kommunikasjon.ntb.no/pressemelding/19092540/regjeringen-foreslar-a-heve-aldersgrensen-for-bruk-av-elsparkesykler-til-16-ar?lang=no' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy på offentlig grunn, Oslo', url: 'https://lovdata.no/dokument/LF/forskrift/2024-11-20-2821' },
    { title: 'Oslo kommune: Leie av elsparkesykler og elsykler', url: 'https://www.oslo.kommune.no/gate-transport-og-parkering/sykkel/leie-av-elsparkesykler-og-elsykler/' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy, Bergen (2026)', url: 'https://lovdata.no/dokument/LF/forskrift/2026-06-17-1345' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
  ],
};

export default guide;
