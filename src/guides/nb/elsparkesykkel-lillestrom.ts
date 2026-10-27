import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-lillestrom',
  topic: 'lillestrom',
  name: 'Leie elsparkesykkel i Lillestrøm',
  title: 'Elsparkesykkel i Lillestrøm: Voi, Ryde, pris og stengetid',
  description: 'I Lillestrøm stenger Ryde ved midnatt og Voi kl. 23 natt til lørdag og søndag. Voi koster 10 kr pluss 2,50 kr per minutt. Sesongen slutter senest 30. november.',
  headline: 'Elsparkesykkel i Lillestrøm: operatører, priser, sesong og parkering',
  lede: 'Vil du leie elsparkesykkel i Lillestrøm, velger du mellom Voi og Ryde, som har kommunens tillatelse fram til 30. november 2027. Bolt har ikke tillatelse her. Hos Voi koster det 10 kr å låse opp og 2,50 kr per minutt (17. oktober 2026), og både Voi og Ryde krever at du har fylt 16 år. Kommunen stenger utleien kl. 00–05 natt til lørdag og natt til søndag, og Voi stenger allerede kl. 23 de to nettene. Utleien er bare åpen fra mars til og med november: Om vinteren finnes det ingen sparkesykler å leie.',
  published: '2026-10-17',
  updated: '2026-10-24',
  city: 'no:Lillestrøm',
  sections: [
    {
      heading: 'Leie elsparkesykkel i Lillestrøm: Voi og Ryde',
      blocks: [
        'Lillestrøm kommune har gitt tillatelse til to operatører: **Voi og Ryde**. Hver av dem kan ha opptil 900 kjøretøy ute, og tillatelsene gjelder fra 1. mars 2026 til **30. november 2027**. Kommunen kan forlenge dem med ett år av gangen, for 2028 og 2029. I februar 2026 lyste kommunen ut plass til opptil tre operatører og 1800 kjøretøy til sammen.',
        '**Bolt har ikke tillatelse i Lillestrøm.** Kommunen sendte utlysningen også til Bolt, Dott og Lime, men postjournalen viser bare søknader fra Voi og Ryde, og de to fikk tillatelse 25. mars 2026. Hos Ruter står Bolt bare oppført for Oslo.',
        'Ordningen bygger på kommunens utleieforskrift fra 15. juni 2022. Operatørene betaler et gebyr som skal dekke kommunens kostnader, 417 kr per kjøretøy i 2026, og kommunen følger med på sparkesyklene gjennom plattformen Nivel. Surf og Dott hadde tillatelse tidligere, men sparkesyklene deres som fortsatt står ute, er ikke en del av dagens ordning: Kommunen ba selskapene 19. mai 2026 om å hente dem.',
        'På [ScootRadar-kartet over Lillestrøm](map:no:Lillestrøm) sto det rundt 830 Voi-sparkesykler kl. 19.25 den 17. oktober 2026. Det er det kartet viste akkurat da, ikke hele flåten, og tallet gjelder **Lillestrøm og Rælingen til sammen**, fordi kartet ikke har noen egen grense for Rælingen. Kl. 20.30 samme kveld sto rundt 600 Voi-sparkesykler i Lillestrøm kommune og rundt 230 i Rælingen, ifølge Vois åpne data. Siden 22. oktober 2026 viser kartet også Rydes sparkesykler, og de er mange: rundt 1230 i Rydes åpne data for Lillestrøm den dagen. 8. oktober 2026 skrev kommunen til Ryde at selskapet den siste uken hadde hatt 1200–1350 sparkesykler ute, mot en kvote på 900.',
        'Du låser opp i operatørens app eller i Ruter-appen. I Ruter-appen betaler du enkeltturer med kort, til operatørens pris, og du tar bilde av parkeringen etter turen. Operatørens pass gjelder ikke der. Hvordan du registrerer deg og avslutter turen, står i [guiden om å leie elsparkesykkel](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Hva koster det å leie elsparkesykkel i Lillestrøm?',
      blocks: [
        'Voi oppgir prisen for Lillestrøm på sin egen nettside: 10 kr for å låse opp og 2,50 kr per minutt. I Rydes åpne data for Lillestrøm kostet det 10,90 kr å låse opp og 2,20 kr per minutt 22. oktober 2026, litt mindre enn i Oslo. Sjekk prisen i appen før du låser opp.',
        {
          table: {
            caption: 'Priser 17. oktober 2026 (Ryde: 22. oktober) og aldersgrenser',
            head: ['Operatør', 'Opplåsing', 'Per minutt', '10 minutter', '20 minutter', 'Aldersgrense'],
            rows: [
              ['Voi, Lillestrøm', '10 kr', '2,50 kr', '35 kr', '60 kr', '16 år'],
              ['Ryde, Lillestrøm', '10,90 kr', '2,20 kr', '32,90 kr', '54,90 kr', '16 år'],
            ],
          },
        },
        'Kjører du ofte, kan Vois minuttpakker eller Voi Pass lønne seg. De gjelder i hele Norge, men ikke i Ruter-appen. Tar du en Ryde-sparkesykkel ut av driftsområdet, kan det koste opptil 500 kr ekstra.',
        'Loven sier 12 år, og Lillestrøms forskrift har ingen egen aldersgrense. Voi krever likevel **16 år** på nettsiden for Lillestrøm. Ruter oppgir fortsatt 15 år for Ryde, men Rydes vilkår for Norge krever 16 år (17. oktober 2026). Regjeringen foreslo 5. oktober 2026 å heve den nasjonale aldersgrensen til 16 år. Forslaget er **ikke vedtatt**.',
      ],
    },
    {
      heading: 'Nattestenging og sesong: fra mars til november',
      blocks: [
        'Lillestrøms forskrift sier i § 7 e at utleie kan skje «alle dager i perioden fra mars til og med november, unntatt tidsrommet 00:00–05:00 natt til lørdag og natt til søndag». Resten av uka er utleien åpen hele natten. Voi stenger selv allerede kl. 23 de to nettene, ifølge Vois nettside og Ruter. Nabokommunene har egne regler:',
        {
          table: {
            caption: 'Nattestenging ifølge forskriftene, Ruter og Voi (17. oktober 2026)',
            head: ['Kommune', 'Kommunens forskrift', 'Operatørene'],
            rows: [
              ['Lillestrøm', 'Stengt kl. 00–05 natt til lørdag og natt til søndag', 'Voi stenger kl. 23, Ryde kl. 00'],
              ['Rælingen', 'Stengt kl. 23–05 natt til lørdag og natt til søndag', 'Voi stenger kl. 23. Hos Ryde: sjekk appen'],
              ['Lørenskog', 'Ingen nattestenging', 'Ifølge Ruter stenger Voi og Ryde selv natt til lørdag og natt til søndag, fra kl. 23 eller 00 til 05. Operatørenes åpne data (24. oktober 2026): Voi 23–05 de samme nettene, Ryde døgnåpent'],
              ['Oslo', 'Stengt kl. 23–05 hver natt', 'Bolt, Ryde og Voi er åpne kl. 05–23'],
            ],
          },
        },
        'Om vinteren er det ingen utleie: «Vinterdrift tillates ikke», står det i forskriften. Sesongen 2026 slutter derfor senest 30. november, og sparkesyklene kommer tilbake tidligst 1. mars 2027. Snør det i sesongen, skal operatørene fjerne sparkesyklene fra gater, fortau og gang- og sykkelveier, så de ikke hindrer brøytingen. Lørenskog og Rælingen har samme sesong og samme regel om snø.',
      ],
    },
    {
      heading: 'Parkering i Lillestrøm sentrum og ved stasjonen',
      blocks: [
        'Kommunen ber deg parkere innenfor de sonene som er satt i appen, og slik at sparkesykkelen ikke sperrer innganger, ramper, gangfelt eller utrykningsveier. Barnevogner og rullestoler skal komme forbi.',
        {
          list: [
            'Minst 2,5 meter fra ledelinjene for blinde og svaksynte, og ikke i sykkelfeltet, ifølge Ruter.',
            'I sentrum har Voi egne parkeringsplasser, blant annet på Stortorget, i Torvgata, ved Kirkeparken og Kulturparken, på nordsiden av Lillestrøm stasjon og ved bussterminalen.',
            'Ved Lillestrøm stasjon, på Bane NORs område og ved bussterminalen er det parkeringsforbud i Voi-appen utenom de oppmerkede plassene. Det gjelder også deler av Torvgata og gågata nord med Teatergata (17. oktober 2026).',
            'Ellers ber Voi deg parkere ved et parkeringsskilt, i et sykkelstativ eller på langs inntil en husvegg. Hos Ryde må du ta bilde av parkeringen i appen.',
          ],
        },
        { note: 'Feilparkering kan gi et gebyr på 900 kr, ifølge Ruter, og kommunen kan fjerne sparkesykler og ta dem i forvaring. Har du ikke tatt bilde av parkeringen, kan Ryde sende regningen for gebyret videre til deg. Ser du en feilparkert sparkesykkel, kan du melde fra anonymt i appen «Feilparkering», som kommunen anbefaler.' },
      ],
    },
    {
      heading: 'Hvor kan du kjøre? Strømmen, Skjetten, Kjeller og Fet',
      blocks: [
        'Ifølge kommunens konkurransegrunnlag fra februar 2026 omfatter ordningen blant annet **Strømmen, Skjetten, Lillestrøm, Kjeller og Skedsmokorset**, og der sto det Voi-sparkesykler på kvelden 17. oktober 2026. **Fet og Sørum**, som også hører til Lillestrøm kommune, er ikke med: Fetsund og Frogner ligger i en sone med kjøreforbud i Voi-appen, og Sørumsand ligger utenfor Vois område.',
        'Forskriften lar kommunen kreve kjøreforbud, parkeringsforbud og fartsgrenser i appene. I Voi-appen var dette sonene 17. oktober 2026:',
        {
          list: [
            '**Saktesoner:** 6 km/t rundt Lillestrøm stasjon og 15 km/t i gågata Storgata, mellom Torvgata og Stortorget.',
            '**Kjøreforbud:** ved Lillestrøm kirke, Strømmen kirke, Skedsmo kirke, Stalsberghagen kapell og Lillestrøm videregående skole.',
          ],
        },
        'Rydes soner ser du i Ryde-appen. Skal du på messe eller konsert på NOVA Spektrum, tidligere Norges Varemesse, er det bare noen minutters gange fra Lillestrøm stasjon og bussterminalen.',
        'På fortauet er det lov å kjøre når det er lite folk og du ikke er til fare eller hinder, og forbi gående kjører du i gangfart, aldri over 6 km/t. I gågatene er grensen 6 km/t. Kommunen ber deg ta ekstra hensyn til gående begge steder, og er det mye folk, går du av og triller.',
      ],
    },
    {
      heading: 'Over grensen til Lørenskog, Rælingen og Oslo',
      blocks: [
        'Voi og Ryde kjører også i [Lørenskog](map:no:Lørenskog) og Rælingen, ifølge Ruter. Lørenskog har sin egen forskrift: Der er utleien åpen hele døgnet fra mars til og med november, men ifølge Ruter stenger operatørene selv natt til lørdag og natt til søndag. Rydes åpne data viser likevel døgnåpent, som tabellen over viser. Operatørene skal sørge for minst 2 meter fri passasje på fortau og gang- og sykkelveier. På kartet sto det rundt 390 Voi-sparkesykler i Lørenskog kl. 19.25 den 17. oktober 2026, og siden 22. oktober viser kartet også Rydes, rundt 880 i Rydes åpne data for Lørenskog den dagen.',
        'I Rælingen stenger forskriften utleien kl. 23–05 natt til lørdag og natt til søndag, en time tidligere enn i Lillestrøm. Voi-sparkesyklene i Rælingen telles under Lillestrøm på kartet.',
        'Vest for Skjetten grenser Lillestrøm mot [Oslo](map:no:Oslo). Der har Bolt, Ryde og Voi tillatelse, og du kan ikke leie mellom kl. 23 og 05. Oslo har egne parkeringsforbud og saktesoner, og alt står i [guiden om Oslo](guide:oslo). Om du kan avslutte turen på den andre siden av kommunegrensen, ser du i appen før du kjører.',
      ],
    },
    {
      heading: 'Regler og bøter for elsparkesykkel i Lillestrøm',
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
        'Alle reglene, med hjemmel og flere bøter, står i [reglene for elsparkesykkel i Norge](guide:norwegian-rules).',
      ],
    },
    {
      heading: 'Pendle til Oslo og Gardermoen: tog, Flytoget og buss',
      blocks: [
        {
          list: [
            '**Leid sparkesykkel om bord:** Ryde forbyr å ta med sparkesykkelen på buss, tog og i bil. Avslutt turen på en lovlig plass ved stasjonen, og lei en ny når du går av.',
            '**Egen elsparkesykkel på bussen:** Hos Ruter reiser en sammenslått elsparkesykkel, eller en liten du lett kan ta under armen, gratis. En stor sparkesykkel kan du ta med på buss, trikk og båt når det er plass, men da betaler du barnepris for den.',
            '**Toget til Oslo:** Hos Vy kan en liten elsparkesykkel bli med hvis den ikke står i veien for konduktøren, andre reisende eller passasjen, og den skal ikke ligge på bagasjehylla. Konduktøren avgjør. Store elsparkesykler kan bare bli med på Bergensbanen, med reservert sykkelplass, og batteriet får ikke lades om bord.',
            '**Flytoget:** Flytoget stopper på Lillestrøm på vei mellom Oslo lufthavn og Oslo S. Du får ikke lade elsparkesykler om bord, så lad batteriet før du reiser.',
            '**Vinteren:** Fra desember til februar er det ingen leiesparkesykler i Lillestrøm, så planlegg en annen vei til stasjonen.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Finnes Bolt i Lillestrøm?',
      answer: 'Nei. Kommunen ga tillatelse bare til Voi og Ryde, med 900 kjøretøy hver fram til 30. november 2027. Hos Ruter står Bolt bare oppført for Oslo.',
    },
    {
      question: 'Kan jeg leie elsparkesykkel om natten i Lillestrøm?',
      answer: 'Ja, de fleste netter. Kommunens forskrift stenger utleien bare kl. 00–05 natt til lørdag og natt til søndag, og Voi stenger allerede kl. 23 de to nettene. De andre nettene er utleien åpen hele natten. I Oslo er den stengt fra kl. 23 til 05 hver natt.',
    },
    {
      question: 'Når forsvinner elsparkesyklene om vinteren?',
      answer: 'Forskriften tillater utleie fra mars til og med november, og vinterdrift er forbudt. Sesongen slutter derfor senest 30. november 2026 og starter igjen tidligst 1. mars 2027. Det samme gjelder i Lørenskog og Rælingen.',
    },
    {
      question: 'Kan jeg ta med elsparkesykkelen på toget til Oslo eller Gardermoen?',
      answer: 'En leid sparkesykkel parkerer du før du går om bord, og Ryde forbyr å ta den med. En egen liten elsparkesykkel kan bli med på Vy-toget hvis den ikke står i veien, og konduktøren avgjør. På Flytoget får du ikke lade den om bord.',
    },
    {
      question: 'Finnes det elsparkesykler i Fet og Sørum?',
      answer: 'Ikke hos Voi 17. oktober 2026. Kommunens konkurransegrunnlag nevner Strømmen, Skjetten, Lillestrøm, Kjeller og Skedsmokorset. I Voi-appen er det kjøreforbud ved Fetsund og Frogner, og Sørumsand ligger utenfor området.',
    },
    {
      question: 'Hvordan melder jeg fra om en feilparkert elsparkesykkel?',
      answer: 'Kommunen anbefaler appen «Feilparkering», der du kan melde fra anonymt. Du kan også sende e-post til operatøren: supportnorway@voi.com for Voi og support@ryde-technology.com for Ryde.',
    },
  ],
  sources: [
    { title: 'Lovdata: Lillestrøms forskrift om utleie av små elektriske kjøretøy på offentlig grunn', url: 'https://lovdata.no/dokument/LF/forskrift/2022-06-15-1545' },
    { title: 'Lillestrøm kommune: Elsparkesykkel i Lillestrøm kommune', url: 'https://www.lillestrom.kommune.no/vei-trafikk-og-parkering/sykkel/elsparkesykkel/' },
    { title: 'Lillestrøm kommune, postjournal: sak 26/03794 (tillatelser 2026–2027) og 22/34337 (2023–2025)', url: 'https://lillestrom.pj.360online.com/' },
    { title: 'Lovdata: Lørenskogs forskrift om utleie av små elektriske kjøretøy på offentlig grunn', url: 'https://lovdata.no/dokument/LF/forskrift/2023-06-14-1271' },
    { title: 'Lovdata: Rælingens forskrift om utleie av små elektriske kjøretøy på offentlig grunn', url: 'https://lovdata.no/dokument/LF/forskrift/2022-12-07-2621' },
    { title: 'Ruter: Operatører', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer' },
    { title: 'Ruter: Åpningstider', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/apningstider' },
    { title: 'Ruter: Kjør elsparkesykkel i Ruter-appen', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/kjore-i-appen' },
    { title: 'Ruter: Parkering av elsparkesykkel', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/parkering' },
    { title: 'Ruter: Dette kan du ha med deg om bord', url: 'https://ruter.no/kjop-billett/om-bord' },
    { title: 'Vy: Sykkel på toget', url: 'https://www.vy.no/alt-om-reisen/tog/praktisk-informasjon/sykkel-pa-toget' },
    { title: 'Flytoget: Tog fra Gardermoen til Oslo', url: 'https://flytoget.no/ruter-og-stasjoner/tog-fra-gardermoen-til-oslo/' },
    { title: 'Flytoget: Bagasje', url: 'https://flytoget.no/reiseinformasjon/praktisk-informasjon/bagasje/' },
    { title: 'Voi: Elsparkesykler til leie i Lillestrøm', url: 'https://www.voi.com/nb/by/lillestrom' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Ryde: Åpne data for Lillestrøm (GBFS via Entur)', url: 'https://api.entur.io/mobility/v2/gbfs/v3/rydelillestrom/gbfs' },
    { title: 'Ryde: Åpne data for Lørenskog (GBFS via Entur)', url: 'https://api.entur.io/mobility/v2/gbfs/v3/rydelorenskog/gbfs' },
    { title: 'NOVA Spektrum: Adkomst', url: 'https://novaspektrum.no/adkomst/' },
  ],
};

export default guide;
