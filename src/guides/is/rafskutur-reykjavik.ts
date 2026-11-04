import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'is',
  slug: 'rafskutur-reykjavik',
  topic: 'reykjavik',
  name: 'Rafskútur til leigu í Reykjavík',
  title: 'Rafskútur í Reykjavík 2026: Hopp, verð, reglur og stæði',
  description: 'Rafskútur í Reykjavík: verðið hjá Hopp, aldur og hjálmur, nýjar reglur borgarinnar frá 2026, hvar má ekki leggja, safnstæðin, veturinn og nágrannabæirnir.',
  headline: 'Rafskútur í Reykjavík: Hopp, verð, reglur borgarinnar og hvar má leggja',
  lede: 'Rafskútur í Reykjavík leigirðu hjá Hopp eða Bolt. Hjá Hopp kostar ferðin 115 kr. í upphafsgjald og 45 kr. á mínútu, svo tíu mínútur kosta 565 kr. (verð í nóvember 2026), og þú þarft að vera 18 ára, þótt lögin leyfi akstur frá 13 ára aldri. Frá 4. febrúar 2026 gilda nýjar reglur borgarinnar: fyrirtækin eiga að takmarka hraðann við 10 km/klst. á grunnskólalóðum og í göngugötum, á sumum svæðum má hvorki aka né leggja og þú tekur mynd af rafskútunni eftir hverja ferð.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'is:Reykjavík',
  sections: [
    {
      heading: 'Hver leigir út rafskútur í Reykjavík? Hopp og Bolt',
      blocks: [
        '**Hopp** hefur leigt út rafskútur í Reykjavík frá árinu 2019. Þjónustusvæðið nær yfir allt höfuðborgarsvæðið, frá Mosfellsbæ til Hafnarfjarðar, og í sama appi eru líka deilibílar og leigubílar Hopp. **Bolt** leigir líka út rafskútur í Reykjavík, á eigin verði sem appið sýnir áður en þú leggur af stað.',
        'Að morgni 13. október 2026 voru um 2.200 Hopp-rafskútur lausar til leigu á [kortinu yfir höfuðborgarsvæðið](map:is:Reykjavík), og upp úr hádegi 25. október 2026 voru um 850 rafskútur frá Bolt lausar, samkvæmt síðustu talningu. Hvernig þú leigir rafskútu stendur í [leiðarvísinum um rafskútuleigu](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Hvað kostar að leigja rafskútu hjá Hopp?',
      blocks: [
        'Þú greiðir upphafsgjald og síðan fyrir hverja mínútu. Endanlegt verð sérðu í appinu.',
        {
          table: {
            caption: 'Verð á rafskútum í Reykjavík í nóvember 2026',
            head: ['Fyrirtæki', 'Upphafsgjald', 'Á mínútu', '10 mínútur', '20 mínútur'],
            rows: [
              ['Hopp', '115 kr.', '45 kr.', '565 kr.', '1.015 kr.'],
              ['Bolt', 'Sjá appið', 'Sjá appið', '–', '–'],
            ],
          },
        },
        'Stakt fargjald fullorðinna í strætó er 690 kr., svo stutt ferð á rafskútu er ódýrari en strætó en tuttugu mínútna ferð dýrari.',
        'Með **Hopp-passa** kaupirðu mínútur fyrir fram á lægra verði og sleppur við upphafsgjaldið. Passarnir fást í appinu, sem sýnir verðið og hvar hver passi gildir.',
      ],
    },
    {
      heading: 'Nýjar reglur borgarinnar um rafskútur frá 2026',
      blocks: [
        'Umhverfis- og skipulagsráð Reykjavíkur samþykkti 4. febrúar 2026 nýjar verklagsreglur um stöðvalausar hjóla- og smáfarartækjaleigur. Þær leysa af hólmi reglurnar frá 2019 og gilda aðeins á borgarlandi Reykjavíkur.',
        {
          list: [
            '**Samningur:** hvert fyrirtæki gerir samning við borgina, og ef rafskúturnar eru að meðaltali notaðar í færri en tvær ferðir á dag í þrjá mánuði getur borgin rift samningnum.',
            '**Lághraðasvæði:** á grunnskólalóðum og í göngugötum eiga fyrirtækin að takmarka hraða rafskútanna við 10 km/klst., og borgin getur bætt við fleiri slíkum svæðum.',
            '**Bannsvæði:** borgin getur bannað akstur á ákveðnum svæðum og bannað að leggja rafskútum, til dæmis á vatnsverndarsvæðum, í göngugötum, á hjólastígum og við munna undirganga.',
            '**Mynd eftir hverja ferð:** þú átt að taka mynd sem sýnir hvar og hvernig rafskútan var skilin eftir.',
            '**Illa lagðar rafskútur:** rafskúta sem hindrar umferð, ekki síst fólks með skerta hreyfigetu eða sjón, eða stendur við gangbraut, gatnamót eða á bannsvæði telst illa lögð. Fyrirtækið á að fjarlægja hana innan þriggja klukkustunda frá ábendingu, eða fyrir kl. 7 ef ábendingin berst milli kl. 22 og 6. Á hverri rafskútu á að vera QR-kóði eða tengill, svo að hver sem er geti tilkynnt hana án þess að sækja app.',
            '**Tími og svæði:** borgin má takmarka hvenær og hvar rafskútur eru leigðar.',
          ],
        },
      ],
    },
    {
      heading: 'Hvar má aka rafskútu? Göngugötur, gangstéttir og bannsvæði',
      blocks: [
        'Notaðu hjólastíg þar sem hann er. Á gangstétt og göngustíg hafa gangandi alltaf forgang, og á götu máttu aðeins aka þar sem hámarkshraði er 30 km/klst. eða lægri.',
        'Árið 2020 urðu þrjár götur í miðborginni varanlegar göngugötur: **Laugavegur** frá Klapparstíg að Þingholtsstræti, **Skólavörðustígur** frá Bergstaðastræti að Laugavegi og **Vegamótastígur** frá Laugavegi að Grettisgötu. Þar máttu ekki fara hraðar en á eðlilegum gönguhraða. Borgin krefst þess líka að fyrirtækin takmarki hraðann í göngugötum við 10 km/klst., svo appið getur hægt á rafskútunni.',
        'Borgin getur bætt við lághraðasvæðum og bannsvæðum, og fyrirtækin eiga að koma þeim upp innan fimm virkra daga. Appið sýnir svæðin, svo líttu á það áður en þú leggur af stað.',
        'Í appi Hopp eru svæðin merkt með litum: á **rauðu** svæði má hvorki aka né ljúka ferð, á **hvítu** má ekki leggja, á **gulu** eða appelsínugulu hægir rafskútan á sér, oftast niður í 15 km/klst., og á **grænu** færðu afslátt ef þú lýkur ferðinni þar. **Blátt** er utan þjónustusvæðisins, og í Reykjavík lýkur ferðinni ef þú ferð út af svæðinu.',
        'Meðal bannsvæða Hopp 4. nóvember 2026 voru:',
        {
          list: [
            'lóðir um 20 grunnskóla, til dæmis Hagaskóla og Rimaskóla í Reykjavík, Kársnesskóla í Kópavogi, Lækjarskóla í Hafnarfirði og Lágafellsskóla í Mosfellsbæ;',
            'Hólavallagarður, gamli kirkjugarðurinn við Suðurgötu;',
            'Nesvöllur og friðlandið við Bakkatjörn á Seltjarnarnesi.',
          ],
        },
      ],
    },
    {
      heading: 'Hvar má leggja rafskútu? Safnstæði og bönnuð svæði',
      blocks: [
        'Leggðu rafskútunni þannig að hún hindri engan: ekki á miðri gangstétt eða stíg, ekki á hjólastíg eða skábraut og ekki við inngang, gangbraut eða gatnamót.',
        'Samkvæmt reglum borgarinnar má ekki leggja leigurafskútu í göngugötu, á hjólastíg, á vatnsverndarsvæði eða nær munna undirganga en 15 metra.',
        'Á hvítum svæðum Hopp máttu aka en ekki ljúka ferð. Þann 4. nóvember 2026 voru slík svæði meðal annars við Hörpu og Sjóminjasafnið á Granda, á stígnum meðfram Sæbraut austur frá Sólfarinu, á torginu við Hallgrímskirkju, í Hljómskálagarðinum við Tjörnina, við BSÍ, í Öskjuhlíð og Fossvogskirkjugarði og í Grasagarðinum í Laugardal. Skarfabakki og Grótta eru utan þjónustusvæðisins.',
        '**Safnstæði:** vorið 2026 voru níu safnstæði fyrir rafskútur á borgarlandi. Í tillögu sem kynnt var umhverfis- og skipulagsráði 6. maí 2026 eru tuttugu stæði fyrir smáfarartæki, ný eða endurgerð, meðal annars á Lækjartorgi og Ingólfstorgi, við Hlemm, á Skólavörðuholti og við Laugardalslaug og Vesturbæjarlaug, og stefnt er að 20 til 30 nýjum stæðum á ári í fimm ár. Óvíst er hvort þau séu öll komin upp.',
        'Fyrirtækin eiga að umbuna þér fyrir að leggja í merkt stæði, með afslætti, inneign eða niðurfelldu upphafsgjaldi, og merkja stæðin með **P** á kortinu í appinu. Hjá Hopp er rautt **P** stæði sem þú átt að leggja í og blátt **%** Hopp Spot með afslætti.',
        { note: 'Taktu mynd af rafskútunni þegar þú lýkur ferð. Það er skylda samkvæmt reglum borgarinnar, og myndin á að sýna hvar og hvernig rafskútan var skilin eftir. Hopp getur rukkað 30 evrur ef myndina vantar. Skiljirðu rafskútuna eftir utan þjónustusvæðisins getur það kostað 50 evrur innan 20 km frá því og allt að 500 evrur lengra í burtu.' },
      ],
    },
    {
      heading: 'Aldur, hjálmur og áfengi: landslögin í stuttu máli',
      blocks: [
        'Í umferðarlögum heita rafskútur smáfarartæki, en lögreglan og fréttamiðlar tala oft um rafhlaupahjól. Sömu reglur gilda um allt land:',
        {
          table: {
            caption: 'Helstu reglur um rafskútur á Íslandi, október 2026',
            head: ['Regla', 'Hvað gildir'],
            rows: [
              ['Aldur', '13 ár samkvæmt lögum; 18 ár til að leigja hjá Hopp eða Bolt'],
              ['Hjálmur', 'Skylda undir 16 ára aldri; mælt með hjálmi fyrir alla'],
              ['Áfengi', 'Refsivert yfir 0,5 prómill í blóði (á bíl: 0,2); Hopp bannar allan akstur undir áhrifum'],
              ['Gata', 'Aðeins þar sem hámarkshraði er 30 km/klst. eða lægri'],
              ['Gangstétt og göngustígur', 'Leyfilegt, en gangandi hafa forgang; notaðu hjólastíg ef hann liggur samhliða'],
              ['Göngugata', 'Ekki hraðar en eðlilegur gönguhraði'],
              ['Hraði', 'Hönnuð fyrir 25 km/klst. að hámarki; bannað að breyta henni svo hún fari hraðar'],
              ['Farþegar', 'Bannaðir samkvæmt skilmálum Hopp og Bolt'],
              ['Sími', 'Aðeins með handfrjálsum búnaði'],
              ['Ljós', 'Hvítt að framan og rautt að aftan þegar dimmt er'],
              ['Trygging', 'Engin tryggingaskylda; samkvæmt skilmálum Hopp berðu ábyrgð á tjóni sem þú veldur'],
            ],
          },
        },
        'Samgöngustofa nefnir 20.000 kr. sekt fyrir brot (nóvember 2026), og samkvæmt sektareglugerðinni lækkar sektin um 25% ef hún er greidd innan 30 daga. Ölvunarakstur á rafskútu getur varðað sektum eða allt að tveggja ára fangelsi, en þú missir ekki ökuréttindin.',
        'Aðeins um 6% þeirra sem eru á leigurafskútu nota hjálm, á móti 51% á eigin rafskútu (Samgöngustofa, júní 2026). Lagagreinarnar, sektirnar og tryggingamálin finnurðu í [leiðarvísinum um reglur um rafskútur](guide:icelandic-rules).',
      ],
    },
    {
      heading: 'Rafskútur á veturna, í myrkri og á Menningarnótt',
      blocks: [
        {
          list: [
            '**Veturinn:** hvert fyrirtæki ákveður hvort og hvar rafskútur þess eru úti á veturna; appið sýnir svæðið.',
            '**Hálka og rok:** samkvæmt skilmálum Hopp áttu að haga hraða og hemlun eftir aðstæðum, til dæmis í hálku, rigningu og snjó, og í appinu geturðu valið stillingu sem takmarkar hraðann við 15 km/klst. Á opnum stígum við sjóinn, meðfram Sæbraut og Ægisíðu, getur blásið hressilega.',
            '**Myrkrið:** í kringum vetrarsólstöður kemur sólin upp laust fyrir hálftólf og sest um hálffjögur.',
            '**Menningarnótt:** laugardaginn 22. ágúst 2026 var hámarkshraði rafskútanna lækkaður í miðborginni, og aðeins mátti hefja og ljúka ferðum á ákveðnum stæðum, til dæmis við BSÍ, í Vatnsmýri og við Skúlagötu 6. Reiknaðu með svipuðu fyrirkomulagi, en staðirnir geta breyst milli ára.',
            '**Gamlárskvöld:** haltu rafskútunni fjarri mannfjöldanum og flugeldunum á Skólavörðuholti.',
          ],
        },
      ],
    },
    {
      heading: 'Nágrannabæirnir, Keflavíkurflugvöllur og strætó',
      blocks: [
        'Þjónustusvæði Hopp nær yfir öll sex sveitarfélög höfuðborgarsvæðisins, svo þú getur farið milli bæja í sömu ferð. Verklagsreglur Reykjavíkur gilda þó aðeins á borgarlandi Reykjavíkur; í nágrannabæjunum gilda landslögin, og appið sýnir svæðin.',
        'Utan höfuðborgarsvæðisins voru um 580 Hopp-rafskútur lausar í 17 bæjum til viðbótar 13. október 2026, flestar á [Akureyri](map:is:Akureyri) (178), á Selfossi (100) og í [Reykjanesbæ](map:is:Reykjanesbær) (79).',
        '**Keflavíkurflugvöllur** er um 50 km frá Reykjavík, og þangað kemstu ekki á rafskútu. Hopp er með rafskútur í Reykjanesbæ, en flugstöðin og bílastæðin við hana eru utan svæðisins. Visit Reykjavík bendir á Flugrútuna, strætó nr. 55, leigubíla, meðal annars Hopp, og bílaleigubíla.',
        '**Strætó:** samkvæmt reglum Strætó áttu að geta borið farangurinn um borð án aðstoðar, og reiðhjól eru leyfð meðan pláss leyfir. Ljúktu því ferðinni á leigurafskútunni áður en þú ferð um borð. Miðinn gildir í 75 mínútur.',
      ],
    },
    {
      heading: 'Vissir þú? Rafskútur í Reykjavík í tölum',
      blocks: [
        {
          list: [
            '**579 sinnum í kringum jörðina.** Frá árinu 2019 hafa verið farnar 11,5 milljónir ferða á rafskútum og deilibílum Hopp í Reykjavík, samtals 23,2 milljónir kílómetra, samkvæmt tölum fyrirtækisins frá október 2026.',
            '**200 metrar.** Samkvæmt reglum borgarinnar telst notkun rafskútu aðeins ferð ef farnir eru að minnsta kosti 200 metrar.',
            '**60 klukkustundir.** Leigurafskútu sem hefur staðið ónotuð á borgarlandi í 60 klukkustundir á fyrirtækið að fjarlægja og koma fyrir í stæði eða þar sem hún veldur ekki ónæði.',
            '**Ljósin kvikna þegar hún dettur.** Ljós leigurafskútu eiga að blikka eða lýsa ef hún fellur á hliðina, og hún á sjálfkrafa að senda fyrirtækinu merki.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Hvað þarf maður að vera gamall til að leigja rafskútu?',
      answer: 'Hjá Hopp og Bolt þarftu að vera 18 ára samkvæmt íslenskum skilmálum fyrirtækjanna (nóvember 2026). Lögin leyfa akstur rafskútu frá 13 ára aldri, og undir 16 ára aldri er hjálmur skylda.',
    },
    {
      question: 'Má keyra rafskútu eftir að hafa drukkið áfengi?',
      answer: 'Mörkin eru 0,5 prómill í blóði, en 0,2 hjá ökumönnum bíla. Brot getur varðað sekt eða fangelsi en kostar þig ekki ökuréttindin. Skilmálar Hopp banna hins vegar allan akstur undir áhrifum áfengis.',
    },
    {
      question: 'Má hjóla á rafskútu á Laugavegi?',
      answer: 'Já, en Laugavegur frá Klapparstíg að Þingholtsstræti er göngugata, og þar máttu ekki fara hraðar en á gönguhraða. Gangandi hafa forgang, og appið getur hægt á rafskútunni.',
    },
    {
      question: 'Er Bolt enn með rafskútur á Íslandi?',
      answer: 'Já. Upp úr hádegi 25. október 2026 voru um 850 rafskútur frá Bolt lausar til leigu á höfuðborgarsvæðinu, samkvæmt síðustu talningu.',
    },
    {
      question: 'Má taka rafskútu með í strætó?',
      answer: 'Samkvæmt reglum Strætó áttu að geta borið farangurinn um borð án aðstoðar, og reiðhjól eru leyfð meðan pláss leyfir. Leigurafskútur fara ekki í strætó: ljúktu ferðinni áður en þú ferð um borð.',
    },
  ],
  sources: [
    { title: 'Reykjavíkurborg: Verklagsreglur um stöðvalausar hjólaleigur (2026)', url: 'https://reykjavik.is/sites/default/files/2026-02/Verklagsreglur_um_st%C3%B6%C3%B0valausar_hj%C3%B3laleigur_2026.pdf' },
    { title: 'Reykjavíkurborg: Tillaga um deilibílastæði og stæði fyrir smáfarartæki (apríl 2026)', url: 'https://fundur.reykjavik.is/sites/default/files/agenda-items/Tillaga_um_deilib%C3%ADlast%C3%A6%C3%B0i_og_st%C3%A6%C3%B0i_fyrir_sm%C3%A1farart%C3%A6ki_%C3%AD_borgarlandi.pdf' },
    { title: 'Reykjavíkurborg: Umferðarmerki komin upp við göngugötur (2020)', url: 'https://www.reykjavik.is/frettir/umferdarmerki-komin-upp-vid-gongugotur' },
    { title: 'Reykjavíkurborg: Menningarnótt 2026, upplýsingar', url: 'https://reykjavik.is/menningarnott/upplysingar' },
    { title: 'Ísland.is (Samgöngustofa): Rafmagnshlaupahjól', url: 'https://island.is/rafmagnshlaupahjol' },
    { title: 'Ísland.is (Samgöngustofa): Electric scooter wheels, um sektir (á ensku, lesið 4. nóvember 2026)', url: 'https://island.is/en/electric-scooter-wheels' },
    { title: 'Stjórnartíðindi: Umferðarlög nr. 77/2019 (25. júní 2019)', url: 'https://island.is/stjornartidindi/nr/371a2e7a-6ed8-4a09-9b5f-330e499fcd81' },
    { title: 'Stjórnartíðindi: Lög nr. 92/2024 um breytingu á umferðarlögum, smáfarartæki o.fl. (4. júlí 2024)', url: 'https://island.is/stjornartidindi/nr/fa202b69-5d84-4dd3-a497-d2261c6bf261' },
    { title: 'Stjórnarráðið: Sérstakar reglur um smáfarartæki í umferðarlögum hafa tekið gildi (25. júní 2024)', url: 'https://www.stjornarradid.is/efst-a-baugi/frettir/stok-frett/2024/06/25/Serstakar-reglur-um-smafarartaeki-i-umferdarlogum-hafa-tekid-gildi/' },
    { title: 'Hopp Reykjavík: verð og fréttir', url: 'https://hopp.bike/is/in/reykjavik' },
    { title: 'Hopp Reykjavík: 7 ár saman og við erum rétt að byrja (október 2026)', url: 'https://hopp.bike/is/in/reykjavik/7-ar-saman-og-vid-erum-rett-ad-byrja' },
    { title: 'Hopp: skilmálar fyrir Ísland (rafskútuhlutinn á ensku)', url: 'https://hopp.bike/is/tos?group=39lJdAWCMXoGMP394YylB' },
    { title: 'Bolt: Skilmálar fyrir rafknúin ökutæki á Íslandi (gilda frá 6. ágúst 2024)', url: 'https://bolt.eu/is-is/legal/micromobility/tnc-bolt-e-vehicles/' },
    { title: 'Hopp: svæðin og kortið í appinu (á ensku)', url: 'https://support.hopp.bike/en/articles/114001-zones-area-and-map' },
    { title: 'Hopp: Hopp-passar (á ensku)', url: 'https://support.hopp.bike/en/articles/258925-hopp-passes' },
    { title: 'Hopp: hraðatakmörkun í appinu, cruising mode (á ensku)', url: 'https://support.hopp.bike/en/articles/109689-cruising-mode-on-scooters' },
    { title: 'Hopp: svæði og verð á höfuðborgarsvæðinu (GBFS)', url: 'https://api.hopp.bike/gbfs/reykjavik/gbfs.json' },
    { title: 'Hopp: svæði í Reykjanesbæ (GBFS)', url: 'https://api.hopp.bike/gbfs/is-reykjanesbaer/gbfs.json' },
    { title: 'Visit Reykjavík: frá Keflavíkurflugvelli til Reykjavíkur (á ensku)', url: 'https://visitreykjavik.is/kef-reykjavik' },
    { title: 'Strætó: reglur og skilmálar', url: 'https://www.straeto.is/notendaupplysingar/reglur-skilmalar' },
    { title: 'Strætó: gjaldskrá', url: 'https://www.straeto.is/verslun/gjaldskra' },
  ],
};

export default guide;
