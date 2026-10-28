import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'nb',
  slug: 'elsparkesykkel-apningstider',
  topic: 'opening-hours',
  name: 'Åpningstider for elsparkesykkel',
  title: 'Når stenger Voi, Ryde og Bolt? Åpningstider by for by',
  description: 'Voi, Ryde og Bolt stenger kl. 23 og åpner kl. 05 i Oslo, hver natt. Se tidene i Trondheim, Kristiansand, Stavanger og flere byer, og vinterstengingen.',
  headline: 'Åpningstider for elsparkesykkel: når Voi, Ryde og Bolt stenger om natten og om vinteren',
  lede: 'Åpningstidene for elsparkesykkel i Oslo er like hos alle tre operatørene: Voi, Ryde og Bolt stenger kl. 23 og åpner igjen kl. 05, hver natt, også i helgene. Sandefjord, Porsgrunn, Arendal, Grimstad, Lillesand og Sotra stenger også hver natt, Stavanger, Kristiansand, Tromsø, Lillestrøm og Askøy bare natt til helg, mens Bærum, Asker, Bodø, Ålesund og Fredrikstad ikke har nattestenging fra kommunen. Trondheims forskrift stenger utleien kl. 23–05 hver natt, men Voi og Ryde oppgir i sine åpne data at de bare stenger natt til helg. Om vinteren forsvinner sparkesyklene fra mange byer, først fra Tromsø, der sesongen slutter 1. november, og fra Sandefjord, der de skal være fjernet senest samme dag.',
  published: '2026-10-24',
  updated: '2026-10-24',
  city: 'no:Oslo',
  sections: [
    {
      heading: 'Åpningstider for elsparkesykkel, by for by',
      blocks: [
        'Tabellen viser når utleien er stengt om natten i byene på kartet, per 24. oktober 2026. «Natt til lørdag» er natten mellom fredag og lørdag, og «data» er operatørens åpne data på Entur. Der kildene sier noe ulikt, står hver av dem.',
        {
          table: {
            caption: 'Nattestenging for elsparkesykler i norske byer (24. oktober 2026)',
            head: ['By', 'Stengt om natten', 'Operatører', 'Hvem bestemmer'],
            rows: [
              ['[Oslo](guide:oslo)', 'Kl. 23–05 hver natt', 'Bolt, Ryde, Voi', 'Kommunens forskrift'],
              ['Porsgrunn', 'Kl. 23–05 hver natt', 'Ryde', 'Kommunenes kunngjøring for 2026–27'],
              ['[Sandefjord](guide:sandefjord)', 'Kl. 01–05 hver natt', 'Ryde', 'Kommunens forskrift'],
              ['Arendal', 'Vois data: kl. 23–05 hver natt. Kommunens side (endret 7. juli 2026): kl. 23–06. Forskriften: kl. 00–05', 'Voi', 'Voi og kommunen, som kan stramme inn forskriften'],
              ['Vennesla', 'Forskriften: kl. 00–04 hver natt. Vois felles data med Kristiansand viser bare kl. 23–05 natt til lørdag og søndag', 'Voi', 'Kommunens forskrift'],
              ['Lillesand', 'Kl. 23–05 hver natt', 'Voi', 'Kommunens forskrift'],
              ['Grimstad', 'Kl. 00–04 hver natt', 'Voi', 'Kommunens forskrift'],
              ['[Bergen](guide:bergen)', 'Forskriften: kl. 23–05 natt til lørdag og søndag, ellers kl. 01–05. Kommunens side (oppdatert 7. oktober 2026) nevner bare helgen', 'Lime, RideMovi, Ryde', 'Kommunens forskrift'],
              ['Sotra (Øygarden)', 'Kl. 00–05 hver natt', 'Voi', 'Kommunens forskrift'],
              ['Askøy', 'Kl. 00–05 natt til lørdag og søndag', 'Voi', 'Kommunens nettside'],
              ['[Trondheim](guide:trondheim)', 'Forskriften og kommunens side: kl. 23–05 hver natt. Data fra Voi og Ryde: kl. 23–05 bare natt til lørdag og søndag. Dotts data: døgnåpent', 'Dott, Ryde, Voi', 'Kommunens forskrift; operatørene oppgir andre tider'],
              ['[Tromsø](guide:tromso)', 'Kl. 23–06 natt til lørdag, søndag og helligdager', 'Ryde', 'Kommunens forskrift'],
              ['[Stavanger](guide:stavanger)', 'Kl. 00–05 natt til lørdag, søndag og helligdager', 'Ryde, Voi', 'Kommunens forskrift'],
              ['Sandnes', 'Vois data: kl. 00–05 natt til lørdag og søndag', 'Voi', 'Voi (ingen forskrift funnet)'],
              ['[Kristiansand](guide:kristiansand)', 'Forskriften: kl. 00–05 natt til lørdag og søndag. Voi stenger allerede kl. 23', 'Ryde, Voi', 'Kommunens forskrift; Voi stenger tidligere'],
              ['[Tønsberg](guide:tonsberg)', 'Kl. 23–05 natt til lørdag, søndag og bevegelige helligdager, ellers kl. 01–05', 'Ryde', 'Kommunens forskrift'],
              ['[Lillestrøm](guide:lillestrom)', 'Forskriften: kl. 00–05 natt til lørdag og søndag. Voi stenger allerede kl. 23', 'Ryde, Voi', 'Kommunens forskrift; Voi stenger tidligere selv'],
              ['Rælingen', 'Forskriften: kl. 23–05 natt til lørdag og søndag. Ruter oppgir kl. 00–05 for Ryde', 'Ryde, Voi', 'Kommunens forskrift'],
              ['Lørenskog', 'Ikke stengt etter forskriften. Ruter: Ryde kl. 23–05, Voi kl. 00–05 natt til lørdag og søndag. Data: Ryde døgnåpent, Voi kl. 23–05 de samme nettene', 'Ryde, Voi', 'Operatørene'],
              ['[Bærum](guide:baerum) og [Asker](guide:asker)', 'Ikke stengt etter forskriftene. Data: Voi kl. 00–05 natt til søndag, Ryde døgnåpent. Ruter: begge døgnåpne', 'Ryde, Voi', 'Voi'],
              ['[Fredrikstad](guide:fredrikstad) og Sarpsborg', 'Ikke stengt, men maks 10 km/t kl. 23–05 natt til lørdag og søndag', 'Ryde, Voi', 'Kommunene'],
              ['[Skien](guide:skien)', 'Ikke stengt, men maks 12 km/t kl. 00–05', 'Ryde', 'Kommunenes kunngjøring for 2026–27'],
              ['[Bodø](guide:bodo)', 'Ikke stengt', 'Ryde', 'Kommunens forskrift'],
              ['[Ålesund](guide:alesund)', 'Ikke stengt', 'Ryde', 'Kommunens forskrift'],
              ['Moss og Stjørdal', 'Ingen forskrift funnet. Vois data for Moss og Dotts data for Stjørdal: døgnåpent', 'Voi (Moss), Dott (Stjørdal)', 'Operatørene'],
            ],
          },
        },
        'Helligdagsnettene står ikke i operatørenes åpne data, så sjekk appen før en helligdag i Stavanger, Tromsø og Tønsberg.',
      ],
    },
    {
      heading: 'Oslo: stengt fra kl. 23 til 05 hver natt',
      blocks: [
        'Oslos forskrift sier i § 12 at utleie kan skje «alle dager, hele dagen, unntatt i tidsrommet mellom kl. 23.00–05.00». Kommunens nettside sier det samme, og Ruter oppgir åpent kl. 05–23 for Bolt, Ryde og Voi. Byrådet kan korte inn eller oppheve stengingen, men 24. oktober 2026 gjaldt den fortsatt.',
        'Operatørenes åpne data viser de samme tidene: Voi og Bolt er åpne kl. 05.00–23.00 og Ryde kl. 05.00–22.59, alle dager. Du finner sparkesyklene på [kartet over Oslo](map:no:Oslo).',
        'Rett over bygrensen gjelder andre regler. I [Bærum](map:no:Bærum) og Asker har kommunene ikke innført nattestenging: Ryde er døgnåpen, mens Voi stenger selv fra midnatt til kl. 05 natt til søndag, ifølge Vois data.',
      ],
    },
    {
      heading: 'Når stenger Voi, Ryde og Bolt? Operatørenes egne tider',
      blocks: [
        'Forskriften sier når utleien må være stengt, men operatøren kan stenge tidligere. Dette viste operatørenes åpne data på Entur 24. oktober 2026:',
        {
          list: [
            '**Voi** stenger kl. 23 hver natt i Oslo og Arendal, og kl. 23 natt til lørdag og søndag i Trondheim, Kristiansand, Vennesla, Lillestrøm, Lørenskog og Rælingen. I Stavanger og Sandnes stenger Voi ved midnatt de samme nettene, i Bærum og Asker bare natt til søndag. I Fredrikstad, Sarpsborg og Moss er Voi døgnåpen.',
            '**Ryde** stenger kl. 23 hver natt i Oslo og Porsgrunn, og kl. 23 natt til lørdag og søndag i Trondheim, Tromsø og Tønsberg. I Tønsberg stenger Ryde kl. 01 de andre nettene, og i Sandefjord kl. 01 hver natt. I Stavanger og Lillestrøm stenger Ryde ved midnatt natt til lørdag og søndag. Ryde åpner igjen kl. 05, i Tromsø kl. 06.',
            '**Ryde døgnåpent:** Bærum, Asker, Lørenskog, Bodø, Ålesund, Fredrikstad, Sarpsborg og Skien. Ryde skriver likevel i vilkårene at tjenesten tidvis kan være stengt om natten.',
            '**Bolt** stenger kl. 23 og åpner kl. 05 i Oslo. Bolts data for sju andre norske byer, blant dem Lillestrøm og Fredrikstad, viste ingen sparkesykler.',
            '**Dott** oppgir døgnåpent i Trondheim og Stjørdal, men Trondheims forskrift gjelder alle operatører, så sjekk appen.',
          ],
        },
        'Etter Trondheims forskrift og kommunens nettside (19. mai 2026) er utleien stengt kl. 23–05 hver natt. Forskriften lar kommunen prøve ut nattåpent fra søndag kveld til fredag morgen, men et vedtak om det for 2026 er ikke publisert. Et forslag til ny forskrift, på høring til 31. august 2026, vil bare holde stengt natt til lørdag, søndag og helligdager og stille krav som lavere fart eller reaksjonstest de andre nettene. Forslaget var ikke vedtatt 24. oktober 2026. Se sparkesyklene på [kartet over Trondheim](map:no:Trondheim).',
      ],
    },
    {
      heading: 'Vinterstengt: når forsvinner elsparkesyklene?',
      blocks: [
        'Flere kommuner stenger utleien om vinteren. Noen har faste datoer, andre tar inn sparkesyklene når det kommer snø og is.',
        {
          table: {
            caption: 'Vinterstopp for elsparkesykler (24. oktober 2026)',
            head: ['By', 'Sesong eller vinterstopp', 'Kilde'],
            rows: [
              ['Tromsø', 'Sesongen varer til og med 1. november og starter igjen 1. mai', 'Forskriften § 2'],
              ['Sandefjord', 'Fjernes innen første snøfall, senest 1. november. Vedtaket har ikke årstall og sier ikke når sesongen starter', 'Vedtak i hovedutvalget for miljø- og plansaker, 29. oktober 2025'],
              ['Bodø', 'Sesong fra 1. april til og med 30. november', 'Forskriften § 2'],
              ['Trondheim', 'Sesong fra 15. mars til 1. desember, og stengt ved fare for snø og is', 'Forskriften § 3'],
              ['Lillestrøm, Lørenskog og Rælingen', 'Utleie fra mars til og med november. «Vinterdrift tillates ikke»', 'Forskriftene § 7 e'],
              ['Skien og Porsgrunn', 'Ingen utleie fra 15. desember til det er snø- og isfritt på våren', 'Skien kommune'],
              ['Asker', '«Tjenesten er vinterstengt». Vilkårene for sesongstart og -slutt står i kunngjøringen, uten fast dato', 'Forskriften § 12'],
              ['Bærum', 'Stengt når snø og is tilsier det. Kommunedirektøren bestemmer når', 'Forskriften § 13'],
              ['Kristiansand, Vennesla, Arendal og Tønsberg', 'Tas inn ved fare for snø og is, uten fast dato', 'Forskriftene § 6'],
              ['Fredrikstad og Sarpsborg', 'Åpent bare når vær og føre gjør det forsvarlig. Kommunen kan kreve dem fjernet ved snøfall', 'Forskriftene § 7 b'],
              ['Stavanger', 'Ingen sesong, men kommunen kan stanse utleien på dager med snø og is', 'Forskriften § 13'],
              ['Oslo og Ålesund', 'Ingen fast vinterpause, men kommunen kan kreve sparkesyklene fjernet ved vinterdrift', 'Forskriftene'],
            ],
          },
        },
        'I [Tromsø](map:no:Tromsø) og Sandefjord sto Rydes sparkesykler fortsatt ute 24. oktober 2026, ifølge Rydes data, men sesongen har bare dager igjen. Kommer snøen tidlig, kan de forsvinne før datoen.',
      ],
    },
    {
      heading: 'Hva skjer med turen når utleien stenger?',
      blocks: [
        'Ingen forskrift eller kommuneside sier hva som skjer med en tur som er i gang når utleien stenger, og det gjør heller ikke vilkårene til Ryde, Bolt og Dott.',
        'Sjekk derfor i appen når utleien stenger der du er, før du starter en tur sent på kvelden. Hvordan du avslutter og parkerer riktig, står i [guiden om å leie elsparkesykkel](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Hvorfor stenger byene elsparkesyklene om natten?',
      blocks: [
        'Oslo innførte nattestenging i 2021. Da byrådet varslet den i juni det året, sa byråd Lan Marie Nguyen Berg til VG: «Vi ser fra ulykkestallene at det er svært høy risiko for alvorlige skader ved kjøring med elsparkesykkel om natten.» Den gang skulle utleien stenge kl. 01–05. I dag er den stengt kl. 23–05.',
        'Statens vegvesen skrev i mars 2023 at antallet skadde på elsparkesykkel i Oslo falt fra 1878 i 2021 til 673 i 2022, en nedgang på 64 prosent, ifølge Oslo skadelegevakt. Vegvesenet viste til flere tiltak samtidig: færre sparkesykler, nattestenging kl. 23–05, promillegrense på 0,2, aldersgrense på 12 år og hjelmpåbud for barn under 15.',
        'Trondheim kommune skrev i høringen i juni 2026 at promillegrensen har redusert risikoen på hverdagsnetter. Under prøven med nattåpent i 2023 ble det ifølge kommunen kjørt over 48 000 turer om natten, med to registrerte ulykker i lovlig åpningstid.',
        'Hvilke regler som gjelder når du kjører, står i [guiden om reglene for elsparkesykkel](guide:norwegian-rules).',
      ],
    },
    {
      heading: 'Om natten i stedet: bysykkel og nattbuss i Oslo',
      blocks: [
        'Oslo Bysykkel er åpen kl. 05–01, to timer lenger enn elsparkesyklene, ifølge Oslo Bysykkel og Ruter.',
        'Ruters nattbusser kjører natt til lørdag og natt til søndag. De fleste går første gang rundt kl. 01 og kjører til morgenrutene tar over, og du bruker vanlig Ruter-billett. Du kjenner dem på N bak linjenummeret, som 1N og 2N.',
      ],
    },
  ],
  faq: [
    {
      question: 'Når stenger Voi?',
      answer: 'Ifølge Vois åpne data 24. oktober 2026 stenger Voi kl. 23 og åpner kl. 05 hver natt i Oslo og Arendal. I Trondheim, Kristiansand, Lillestrøm, Lørenskog og Rælingen stenger Voi kl. 23 natt til lørdag og natt til søndag, og i Stavanger og Sandnes ved midnatt de samme nettene. I Bærum og Asker er Voi stengt fra midnatt til kl. 05 natt til søndag, og i Fredrikstad, Sarpsborg og Moss er Voi døgnåpen. Trondheims forskrift stenger likevel hver natt.',
    },
    {
      question: 'Når åpner Ryde igjen?',
      answer: 'Etter nattestengingen åpner Ryde igjen kl. 05, i Tromsø kl. 06. Etter vinteren starter sesongen 1. mai i Tromsø, 1. april i Bodø, 15. mars i Trondheim, tidligst 1. mars i Lillestrøm og Lørenskog, og i Skien og Porsgrunn når det er snø- og isfritt. For Sandefjord sier vedtaket ikke når sesongen starter igjen.',
    },
    {
      question: 'Er Bolt stengt om natten?',
      answer: 'Ja. Bolt leier ut i Oslo, der utleien er stengt fra kl. 23 til 05 hver natt, og Bolts data viser åpent kl. 05–23 alle dager. Bolts data for andre norske byer viste ingen sparkesykler 24. oktober 2026.',
    },
    {
      question: 'Hvorfor er elsparkesyklene stengt om natten?',
      answer: 'Fordi kommunen har bestemt det i forskriften sin, og noen steder stenger operatøren i tillegg tidligere. Oslo begrunnet stengingen i 2021 med svært høy risiko for alvorlige skader om natten. Etter flere tiltak samtidig falt antallet skadde i Oslo med 64 prosent fra 2021 til 2022, ifølge Statens vegvesen.',
    },
    {
      question: 'Kan jeg kjøre etter kl. 23?',
      answer: 'Ikke i Oslo, der du ikke kan leie fra kl. 23 til 05. I Bærum, Asker, Bodø, Ålesund, Fredrikstad, Sarpsborg og Skien kan du leie om natten, og i Stavanger, Kristiansand, Tromsø og Lillestrøm hele natten fra søndag kveld til fredag morgen. I Trondheim stenger forskriften hver natt, men Voi og Ryde oppgir åpent på hverdagsnetter. I Tønsberg kan du leie til kl. 01 natt til hverdager, og i Sandefjord til kl. 01 hver natt. Ingen kilde sier hva som skjer med en tur som er i gang ved stengetid, så sjekk appen.',
    },
    {
      question: 'Når stenger elsparkesyklene for vinteren?',
      answer: 'Det varierer. I Tromsø slutter sesongen 1. november, og i Sandefjord skal sparkesyklene være fjernet innen første snøfall og senest samme dag. Bodø stenger etter 30. november og Trondheim senest 1. desember. Lillestrøm, Lørenskog og Rælingen har utleie til og med november, og Skien og Porsgrunn stenger 15. desember. Asker og Bærum har ingen fast dato, og Oslo har ingen fast vinterpause.',
    },
  ],
  sources: [
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy på offentlig grunn, Oslo', url: 'https://lovdata.no/dokument/LF/forskrift/2024-11-20-2821' },
    { title: 'Oslo kommune: Leie av elsparkesykler og elsykler', url: 'https://www.oslo.kommune.no/gate-transport-og-parkering/sykkel/leie-av-elsparkesykler-og-elsykler/' },
    { title: 'Ruter: Åpningstider for sykkel og elsparkesykkel', url: 'https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/apningstider' },
    { title: 'Trondheim kommune: Elsparkesykler i Trondheim (19. mai 2026)', url: 'https://www.trondheim.kommune.no/tema/klima-miljo-og-naring/tillatelser-og-bevillinger/elsparkesykler-i-trondheim/' },
    { title: 'Trondheim kommune: Forslag til revidert forskrift om utleie av små elektriske kjøretøy (høring 2026)', url: 'https://www.trondheim.kommune.no/aktuelt/om-kommunen/kunngjoringer/horinger/forslag-til-revidert-forskrift-om-utleie-av-sma-elektriske-kjoretoy-pa-offentlig-grunn-i-trondheim-kommune/' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy på offentlig grunn, Tromsø', url: 'https://lovdata.no/dokument/LF/forskrift/2025-09-03-1800' },
    { title: 'Skien kommune: Kunngjøring for utleie av elsparkesykler i Grenland 2026–2027 (PDF)', url: 'https://skien.kommune.no/media/mrcb2f5v/2-kunngjoeringsdokument.pdf' },
    { title: 'Skien kommune: Sykkel', url: 'https://www.skien.kommune.no/kultur-idrett-og-frivillighet/parker-og-friluftsliv/sykkel/' },
    { title: 'Arendal kommune: Elsparkesykler', url: 'https://www.arendal.kommune.no/tjenester/vei-parkering-og-havn/parkering/elsparkesykler/' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy på offentlig grunn, Grimstad', url: 'https://lovdata.no/dokument/LF/forskrift/2023-09-05-1534' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy på offentlig grunn, Lillesand', url: 'https://lovdata.no/dokument/LF/forskrift/2024-01-31-325' },
    { title: 'Lovdata: Forskrift om utleie av små elektriske kjøretøy, Bergen (2022, endret 17. desember 2025)', url: 'https://lovdata.no/dokument/LF/forskrift/2022-03-30-521' },
    { title: 'Bergen kommune: Elsparkesykler i Bergen (oppdatert 7. oktober 2026)', url: 'https://www.bergen.kommune.no/innbyggerhjelpen/vann-vei-og-trafikk/vei-transport-og-parkering/sykkel/elsparkesykler-i-bergen' },
    { title: 'Lovdata: Forskrift om utleige av små elektriske køyretøy på offentleg grunn, Øygarden', url: 'https://lovdata.no/dokument/LF/forskrift/2024-02-22-3713' },
    { title: 'Askøy kommune: El-sparkesykler på Askøy: Utleie og bruk (21. august 2026)', url: 'https://askoy.kommune.no/aktuelt/el-sparkesykler-pa-askoy-utleie-og-bruk' },
    { title: 'Ryde: Vilkår for Norge', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
    { title: 'Statens vegvesen: Antall skadde på elsparkesykkel er kraftig redusert (mars 2023)', url: 'https://www.vegvesen.no/om-oss/presse/aktuelt/2023/03/antall-skadde-pa-elsparkesykkel-er-kraftig-redusert/' },
    { title: 'Teknisk Ukeblad: Oslo stenger for utleie av elsparkesykler på nattetid (juni 2021)', url: 'https://www.tu.no/samferdsel/oslo-stenger-for-utleie-av-elsparkesykler-pa-nattetid/453624' },
    { title: 'Ruter: Nattbuss i Oslo og Akershus', url: 'https://ruter.no/planlegg-reise/nattransport/nattbuss' },
    { title: 'Oslo Bysykkel', url: 'https://oslobysykkel.no/' },
  ],
};

export default guide;
