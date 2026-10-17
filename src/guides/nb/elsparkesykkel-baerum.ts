import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-baerum',
  topic: 'baerum',
  name: 'Leie elsparkesykkel i Bærum',
  title: 'Elsparkesykkel i Bærum 2026: priser, regler og parkering',
  description: 'Elsparkesykkel i Bærum: Voi og Ryde har tillatelse, Bolt ikke. Priser, åpningstider, parkering i Sandvika, Lysaker og Bekkestua og grensen mot Oslo.',
  headline: 'Elsparkesykkel i Bærum: operatører, priser, parkering og grensen mot Oslo',
  lede: 'Vil du leie elsparkesykkel i Bærum, velger du mellom Voi og Ryde, som har kommunens tillatelse fram til 31. mars 2028. Bolt har ikke tillatelse i Bærum. Hos Voi koster det 10 kr å låse opp og 2,50 kr per minutt (17. oktober 2026), og både Voi og Ryde krever at du har fylt 16 år. Kommunen har ikke innført nattestenging, men i sentrum av Sandvika, Bekkestua og Lysaker må du parkere på oppmerkede plasser eller i stativ. Krysser du Lysakerelva, gjelder Oslos regler.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'no:Bærum',
  sections: [
    {
      heading: 'Leie elsparkesykkel i Bærum: Voi og Ryde',
      blocks: [
        'Bærum kommune har gitt tillatelse til to operatører: **Voi og Ryde**. Voi kan ha opptil 3000 kjøretøy ute og Ryde opptil 2500, elsykler medregnet. Tillatelsene gjelder fra 8. mai 2026 til **31. mars 2028**. Ruter lyste ut ordningen på vegne av kommunen i mars 2026, og bare de to søkte.',
        '**Bolt har ikke tillatelse i Bærum.** Hos Ruter står Bolt bare oppført for Oslo, og Bolt-sparkesyklene du ser ved Lysaker, hører til Oslo.',
        'Ordningen bygger på kommunens utleieforskrift fra 4. februar 2026. Den gir plass til to operatører i opptil fire år, og operatørene betaler et gebyr som dekker kommunens kostnader: 689 500 kr hver for perioden fram til 31. mars 2027.',
        'Elsparkesykler til leie har vært i Bærum siden 2020, først i et prøveprosjekt med Tier, Ruter og Asker. I 2025 ble det kjørt over 1,2 millioner turer med fire operatører, men Surf og Dott trakk seg ut tidlig på høsten.',
        'På [kartet over Bærum](map:no:Bærum) sto det rundt 460 Voi-sparkesykler innenfor kommunegrensen på ettermiddagen 17. oktober 2026. Det er en telling på kartet den dagen, ikke hele flåten. Ryde publiserer ingen åpne data for Bærum, så kartet viser ikke Rydes sparkesykler her. Bolt- og Ryde-sparkesyklene du ser øst for Lysakerelva, står i Oslo.',
        'Du låser opp i operatørens app eller i Ruter-appen. I Ruter-appen betaler du enkeltturer med kort, til operatørens pris, og du tar bilde av parkeringen etter turen. Operatørens pass gjelder ikke der. Hvordan du registrerer deg og avslutter turen, står i [guiden om å leie elsparkesykkel](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Hva koster det å leie elsparkesykkel i Bærum?',
      blocks: [
        'Voi oppgir prisen for Bærum på sin egen nettside: 10 kr for å låse opp og 2,50 kr per minutt. Ryde publiserer ingen pris for Bærum, så tabellen viser hva Ryde tok i **Oslo** samme dag. Sjekk prisen i appen før du låser opp.',
        {
          table: {
            caption: 'Priser 17. oktober 2026 (Ryde: prisen i Oslo) og aldersgrenser',
            head: ['Operatør', 'Opplåsing', 'Per minutt', '10 minutter', '20 minutter', 'Aldersgrense'],
            rows: [
              ['Voi, Bærum', '10 kr', '2,50 kr', '35 kr', '60 kr', '16 år'],
              ['Ryde, Oslo-pris', '10,90 kr', '2,50 kr', '35,90 kr', '60,90 kr', '16 år'],
            ],
          },
        },
        'Kjører du ofte, kan Vois minuttpakker eller Voi Pass lønne seg. De gjelder i hele Norge, men ikke i Ruter-appen. Hos Ryde kan turen avsluttes automatisk etter 60–65 minutter, og tar du sparkesykkelen ut av driftsområdet, kan det koste opptil 500 kr ekstra.',
        'Loven sier 12 år, og Bærums forskrift har ingen egen aldersgrense. Både Voi og Ryde krever likevel **16 år**: Voi på nettsiden for Bærum, Ryde i vilkårene for Norge. Kommunen og Ruter oppgir fortsatt 15 år for Ryde, også i Ruter-appens vilkår, men Rydes egne vilkår gjelder i tillegg når du leier der (17. oktober 2026). Regjeringen foreslo 5. oktober 2026 å heve den nasjonale aldersgrensen til 16 år. Forslaget er **ikke vedtatt**.',
      ],
    },
    {
      heading: 'Åpningstider og nattestenging i Bærum',
      blocks: [
        'Kommunen har ikke innført nattestenging. Forskriften sier at utleie kan skje «alle dager, hele døgnet», og Ruter oppgir at både Ryde og Voi er døgnåpne i Bærum. Operatørene kan likevel stenge selv. Vois nettside for Bærum og Vois åpne data viser søndag som åpen fra kl. 05, altså stengt fra midnatt til kl. 05 natt til søndag, og Ryde skriver i vilkårene at tjenesten tidvis kan være stengt om natten. Skal du hjem sent, sjekker du appen før du regner med en sparkesykkel.',
        'Politiet, Statens vegvesen og Trygg Trafikk ba kommunen vurdere nattestenging. Kommunedirektøren mente at det ikke var forholdsmessig: Kommunen har fått få klager på nattkjøring, Bærum har ikke et uteliv som Oslos, og kollektivtilbudet er svakere enn i storbyene, så et tilbud om natten kan være til stor nytte. Kommunen kan likevel korte inn åpningstidene eller kreve at du består en reaksjonstest i appen før du låser opp til bestemte tider.',
        'Om vinteren stenges tjenesten når snø og is gjør det risikabelt, og kommunen bestemmer når sparkesyklene skal hentes inn. Ifølge kommunens saksframlegg var sesongslutt 10. desember i 2025. Når vinterpausen 2026–27 begynner, er ikke kunngjort.',
      ],
    },
    {
      heading: 'Parkering i Sandvika, Bekkestua og Lysaker',
      blocks: [
        'I sentrum av **Sandvika, Bekkestua og Lysaker** må du parkere på et oppmerket område eller i et stativ. Der er det også tak på antallet: maks 200 kjøretøy i Sandvika og 100 hver på Bekkestua og Lysaker, delt likt mellom Voi og Ryde. Resten av kommunen, Fornebu medregnet, har ikke noe tak.',
        'Ellers i Bærum kan du parkere fritt, men med omtanke:',
        {
          list: [
            'Sett sparkesykkelen godt til side, så det er minst 2 meter fri bredde på fortauet eller gang- og sykkelveien.',
            'Aldri på et fortau som er smalere enn 2 meter, og aldri der gående skal krysse veien ved et gangfelt.',
            'Minst 2,5 meter fra ledelinjene for blinde og svaksynte, og ikke i sykkelfeltet, ifølge Ruter.',
            'Det er parkeringsforbud i skolegårder, naturområder og parker, på gravplasser og ved idrettsanlegg. Appen viser hvor.',
          ],
        },
        'Voi ber deg parkere ved et parkeringsskilt, i et sykkelstativ, på et oppmerket område eller på langs inntil en husvegg. I Voi-appen var det også parkeringsforbud ved flere T-banestasjoner på Kolsåsbanen, som Haslum, Gjettum og Kolsås, og langs Sandvikselva (17. oktober 2026). Hos Ryde må du ta bilde av parkeringen i appen.',
        { note: 'Bærums trafikkbetjenter har bøtelagt feilparkerte elsparkesykler siden juni 2025. Feilparkering kan gi et gebyr på 900 kr, og en sparkesykkel som står i veien, kan bli tauet bort. Ryde sender regningen videre til deg hvis du ikke tok bilde av parkeringen.' },
      ],
    },
    {
      heading: 'Hvor kan du kjøre? Saktesoner og kjøreforbud',
      blocks: [
        'Forskriften lar kommunen kreve kjøreforbud, parkeringsforbud og fartsgrenser i appene, for hele døgnet eller deler av det. Sonene nedenfor er hentet fra Vois egne data 17. oktober 2026 og gjelder i Voi-appen:',
        {
          list: [
            '**Saktesoner** på 12–15 km/t i sentrum av Sandvika og på Bekkestua.',
            '**Kjøreforbud** ved Hosle skole og Øvrevoll galoppbane.',
          ],
        },
        'Rydes soner ser du i Ryde-appen.',
        'På fortauet er det lov å kjøre når det er lite folk og du ikke er til fare eller hinder. Forbi gående kjører du i gangfart og aldri over 6 km/t, og er det mye folk, går du av og triller. Mange innbyggere har bedt kommunen om å forby fortauskjøring, men den er lov etter trafikkreglene, og GPS-en skiller ikke godt nok mellom fortau og vei til at appen kan stoppe deg.',
      ],
    },
    {
      heading: 'Over grensen til Oslo og Asker',
      blocks: [
        'Lysakerelva er grensen mot Oslo, og mange pendler over den, for eksempel mellom Lysaker og Lilleaker. I [Oslo](map:no:Oslo) gjelder Oslos regler: Bolt, Ryde og Voi har tillatelse der, og du kan ikke leie mellom kl. 23 og 05. Oslo har også egne parkeringsforbud og saktesoner. Alt står i [guiden om Oslo](guide:oslo).',
        'Voi og Ryde kjører på begge sider av grensen. Om du kan avslutte turen på den andre siden, og hva som gjelder etter kl. 23, ser du i appen før du kjører.',
        'I [Asker](map:no:Asker) er det også Ryde og Voi, ifølge Ruter og Asker kommune, og Ruter oppgir begge som døgnåpne. Asker har sin egen forskrift fra 3. februar 2026 med opptil to operatører, tak på antallet i Asker sentrum og vinterstengt utleie. I sentrum parkerer du på oppmerkede områder. I Voi-appen er det en saktesone på 15 km/t i Asker sentrum og kjøreforbud ved Solvang ungdomsskole. På kartet sto det rundt 90 Voi-sparkesykler i Asker 17. oktober 2026. Rydes sparkesykler vises ikke der heller.',
      ],
    },
    {
      heading: 'Regler og bøter for elsparkesykkel i Bærum',
      blocks: [
        'Trafikkreglene og bøtene er de samme som i resten av landet. Du må ha fylt 12 år, hjelm er påbudt under 15 år, og promillegrensen er 0,2, som for bil. Du kjører på veien, i sykkelfeltet eller på sykkelveien, og bare én person får stå på sparkesykkelen. Den er sperret til 20 km/t.',
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
        'Parkeringsgebyret skriver kommunens trafikkbetjenter ut, mens politiet håndhever trafikkreglene. Alle reglene, med hjemmel og flere bøter, står i [reglene for elsparkesykkel i Norge](guide:norwegian-rules).',
      ],
    },
    {
      heading: 'Pendle i Bærum: T-bane, buss, tog og Fornebu',
      blocks: [
        {
          list: [
            '**Leid sparkesykkel om bord:** Ryde forbyr å ta med sparkesykkelen på buss, tog og i bil. Avslutt turen og parker ved stasjonen, og lei en ny når du går av.',
            '**Egen elsparkesykkel hos Ruter:** En sammenslått elsparkesykkel, eller en liten du lett kan bære under armen, reiser gratis, også på T-banen og Kolsåsbanen. En stor sparkesykkel kan du ta med på buss, trikk og båt når det er plass, men da betaler du barnepris for den.',
            '**Toget fra Sandvika, Stabekk og Lysaker:** Hos Vy kan du ta med en liten elsparkesykkel hvis den ikke står i veien, og konduktøren avgjør. Større elsparkesykler er bare lov på Bergensbanen. Batteriet får ikke lades om bord.',
            '**Det meste av T-banen stenger 19.–22. november 2026:** Ruter tester det nye signalsystemet, som også trengs til Fornebubanen. Linje 3 går da bare mellom Kolsås og Ullernåsen, med buss for T-bane fra Åsjordet til Majorstuen.',
            '**Fornebu:** Fornebubanen, T-banen fra Majorstuen til Fornebu, er under bygging. I november 2025 ble Fornebu stasjon forsinket med rundt ett år, og prosjektet vurderte om det meste av banen likevel kan åpne i 2029.',
            '**E18:** Statens vegvesen bygger ny E18 mellom Lysaker og Ramstadsletta, med gang- og sykkelveier og en ny hovedsykkelvei. Ny E18 skal etter planen åpne i 2027/2028 og hele anlegget i 2030.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Finnes Bolt i Bærum?',
      answer: 'Nei. Bærum har gitt tillatelse til Voi og Ryde, og bare de to søkte. Hos Ruter står Bolt bare oppført for Oslo, så Bolt-sparkesyklene ved Lysaker hører til Oslo.',
    },
    {
      question: 'Kan jeg leie elsparkesykkel om natten i Bærum?',
      answer: 'Ja. Kommunen har ikke innført nattestenging, og Ruter oppgir at Voi og Ryde er døgnåpne. Vois egen side viser likevel stengt fra midnatt til kl. 05 natt til søndag, så sjekk appen. I Oslo er utleien stengt fra kl. 23 til 05 hver natt.',
    },
    {
      question: 'Hvor kan jeg parkere elsparkesykkel i Sandvika?',
      answer: 'I sentrum av Sandvika, og på Bekkestua og Lysaker, bare på oppmerkede områder eller i stativ. Ellers i Bærum setter du sparkesykkelen godt til side, med minst 2 meter fri bredde på fortauet. Feilparkering kan gi 900 kr i gebyr.',
    },
    {
      question: 'Kan jeg ta med elsparkesykkelen på T-banen eller bussen?',
      answer: 'En leid sparkesykkel skal du parkere før du går om bord, og Ryde forbyr å ta den med. En egen elsparkesykkel som er slått sammen, eller som er liten nok til å bære under armen, reiser gratis med Ruter.',
    },
    {
      question: 'Er elsparkesyklene borte om vinteren?',
      answer: 'Tjenesten stenger når snø og is gjør det risikabelt, og kommunen setter datoene. Ifølge kommunens saksframlegg var sesongslutt 10. desember i 2025. Datoen for vinteren 2026–27 er ikke kunngjort.',
    },
    {
      question: 'Hvor gammel må jeg være for å leie elsparkesykkel i Bærum?',
      answer: 'Både Voi og Ryde krever 16 år. Kommunen og Ruter oppgir fortsatt 15 år for Ryde, men Rydes egne vilkår sier 16. Loven sier 12 år, og et forslag om 16 år for alle er ikke vedtatt.',
    },
  ],
  sources: [
    { title: 'Lovdata: Bærums forskrift om utleie av små elektriske kjøretøy på offentlig grunn', url: 'https://lovdata.no/dokument/LF/forskrift/2026-02-04-201' },
    { title: 'Bærum kommune: Leie av elsparkesykler', url: 'https://www.baerum.kommune.no/tjenester/vei-trafikk-og-parkering/sykkel/leie-av-elsparkesykler/' },
    { title: 'Bærum kommune, postjournal: tillatelser til Voi og Ryde (arkivsak 2026/12265, brev 5. mai 2026)', url: 'https://innsynpluss.onacos.no/baerum/postliste/' },
    { title: 'Bærum kommune, politiske saker: saksframlegg om utleieforskriften (sak 007/26, kommunestyret 4. februar 2026)', url: 'https://innsynpluss.onacos.no/baerum/moteoversikt/' },
    { title: 'Ruter: Mikromobilitet i Asker og Bærum', url: 'https://ruter.no/prosjekter-og-nyutvikling/mikromobilitet-i-asker-og-baerum' },
    { title: 'Ruter: Operatører', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer' },
    { title: 'Ruter: Åpningstider', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/apningstider' },
    { title: 'Ruter: Kjør elsparkesykkel i Ruter-appen', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/kjore-i-appen' },
    { title: 'Ruter: Avtalevilkår for Ryde i Ruter-appen', url: 'https://ruter.no/om-oss/personvern/mikromobilitet/ryde' },
    { title: 'Ruter: Parkering av elsparkesykkel', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/parkering' },
    { title: 'Ruter: Dette kan du ha med deg om bord', url: 'https://ruter.no/kjop-billett/om-bord' },
    { title: 'Ruter: Stenger T-banen fire dager i november (10. september 2026)', url: 'https://www.mynewsdesk.com/no/ruter/pressreleases/stenger-t-banen-fire-dager-i-november-ikke-reis-hvis-du-ikke-maa-3466538' },
    { title: 'Vy: Sykkel på toget', url: 'https://www.vy.no/alt-om-reisen/tog/praktisk-informasjon/sykkel-pa-toget' },
    { title: 'Voi: Elsparkesykler til leie i Bærum', url: 'https://www.voi.com/nb/by/baerum' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Lovdata: Askers forskrift om utleie av små elektriske kjøretøy på offentlig grunn', url: 'https://lovdata.no/dokument/LF/forskrift/2026-02-03-213' },
    { title: 'Asker kommune: To aktører tilbyr elsparkesykler i Asker', url: 'https://www.asker.kommune.no/klima-og-natur/siste-nytt-om-klima-og-natur/na-kan-du-leie-elsparkesykler/' },
    { title: 'Fornebubanen: Ett års forsinkelse og økte kostnader for Fornebu stasjon og base (12. november 2025)', url: 'https://afk.no/_f/p104/i1beb9328-349c-47b0-abcd-9a95dfc9896d/fornebubanen-orientering-om-forsinket-fremdrift-og-okt-kostnadsprognose.pdf' },
    { title: 'Statens vegvesen: E18 Lysaker–Ramstadsletta', url: 'https://www.vegvesen.no/vegprosjekter/europaveg/e18vestkorridoren/lysaker-ramstadsletta/' },
  ],
};

export default guide;
