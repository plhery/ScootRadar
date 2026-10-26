import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-budapest',
  topic: 'budapest',
  name: 'E-scooters in Budapest',
  title: 'E-scooters Budapest 2026: Lime, Dott, parking and rules',
  description: 'E-scooters in Budapest: Lime and Dott, the city’s Mobi-pont parking rule, the police on alcohol, BKK’s metro and bus rules, and District VII’s night stop plan.',
  headline: 'E-scooters in Budapest: Lime and Dott, Mobi-pontok, the rules and District VII',
  lede: 'E-scooters in Budapest are rented through Lime and Dott, and our map shows both; each shows its prices in its app, and Dott rents only to riders of 18 and over. On streets the city owns or manages, its public-space decree lets rental scooters stand only at a Mobi-pont, a marked parking bay, except in the outer zone, where they may be left elsewhere if they block no one. Hungary’s police say alcohol is forbidden to e-scooter riders too, and that riding drunk can bring criminal proceedings.',
  published: '2026-10-27',
  updated: '2026-10-27',
  city: 'hu:Budapest',
  sections: [
    {
      heading: 'Lime and Dott: who rents e-scooters in Budapest',
      blocks: [
        'Two companies rent out e-scooters (elektromos roller) in Budapest, and the [Budapest map](map:hu:Budapest) shows both:',
        {
          list: [
            '**Lime**, whose prices and rules are in its app.',
            '**Dott**: under its terms for Hungary (last updated 23 September 2025), you rent from TIER Operations Hungary Kft, in Budapest, and must be 18.',
          ],
        },
        'BKK, the city’s transport authority (Budapesti Közlekedési Központ), lists the same two as the shared scooter services in Budapest on its page on shared micromobility (read 26 October 2026).',
        'At 21:13 on Monday 26 October 2026 the map’s Budapest figure for Dott was 830 scooters: a snapshot, not a fleet size, showing only where each stands. Its Lime figure comes from a separate full scan, finished at 21:48 on Sunday 25 October: about 4,600 scooters, each with its battery charge. Neither company’s prices, zones or parking places come from our map.',
        'The map covers Dott only in central Budapest. Against the official district boundaries (Lechner Tudásközpont), its Dott area takes in all of districts I, V, VI, VII, VIII and XIII, most of IX and XIV, about half of III and XI, a third of IV and less of the rest, and none of XVI, XVII, XVIII, XXII or XXIII: more than three-quarters of the city’s area lies outside it. Whether Dott scooters stand there, the Dott app shows.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Budapest?',
      blocks: [
        'Both companies show their prices in the app. Dott’s terms for Hungary also set what a breach can cost:',
        {
          table: {
            caption: 'Charges in Dott’s terms for Hungary (last updated 23 September 2025, read 26 October 2026)',
            head: ['When', 'What Dott’s terms say'],
            rows: [
              ['Every ride', 'An unlock fee may apply, plus use fees by the time you ride, shown in the app before you unlock'],
              ['You ride out of the operational area shown in the app', 'The scooter may be switched off, and you may be charged a fine if you don’t bring it back'],
              ['You don’t park or lock it as the terms say', 'An administrative fee of up to €300 for recovering it'],
              ['An authority fines you for parking or riding', 'You pay it, and Dott may give your identity to the authority'],
              ['Dott pays that fine for you', 'You repay it, plus a €50 administration fee'],
              ['Any breach of the terms', 'A fine of €50, on top of any other charge'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Where to park an e-scooter in Budapest: Mobi-pontok',
      blocks: [
        'The city sets the parking rule on the streets and squares it owns, and since 1 September 2026 on those it manages too, in its decree on the use of the public space it owns (3/2013. (III. 8.), as amended up to decree 7/2026. (VI. 3.)). There a rental scooter may stand only at a micromobility point, or Mobi-pont, except in the decree’s outer zone, everything beyond its city-centre, transition and outer-centre zones, where it may also be left elsewhere if it hinders neither pedestrians nor traffic.',
        'The decree puts the duty on the operator. A scooter wholly within 5 m of a Mobi-pont’s outer edge counts as parked there if it blocks no one; one left elsewhere is the operator’s unlawful use of public space, and the operator pays the city a fee of HUF 5,000 a day for it.',
        'On 14 August 2026 a committee of the city assembly designated the Mobi-pontok on the city’s land from 1 September (resolution 188/2026. (VIII. 14.) KKVB), and capped, district by district, how many scooters each operator may put out in the outer zone.',
        'Streets a district owns fall outside the city’s decree: under the scheme the city and BKK put to the city assembly in December 2021, operators may sign public-authority contracts with the council that owns the space, and pay it for its use.',
        {
          list: [
            '**How many:** 940 from April 2025, BKK said on 21 March 2025; its page on shared micromobility (read 26 October 2026) counts more than 1,000 across the city.',
            '**How to spot one:** a round green-and-white sign with an information panel below it, the same page says.',
          ],
        },
        'Dott’s terms add their own rule: where an authority has designated parking areas, you park only there, as the app’s map shows; elsewhere you park legally, without blocking entrances, pedestrians or traffic, and Dott may ask for a photo.',
      ],
    },
    {
      heading: 'E-scooter rules in Hungary: alcohol, speed and a new KRESZ',
      blocks: [
        'Hungary’s highway code, the KRESZ (joint decree 1/1975. (II. 5.) KPM–BM on the rules of road traffic), still doesn’t include e-scooters, leaving much about their use unclear, the city’s own news site, ÉnBudapestem, wrote on 15 May 2025. What riders are told comes from the police, the city and the operators:',
        {
          table: {
            caption: 'E-scooter rules in Budapest, by who sets them (read 26 October 2026)',
            head: ['Rule', 'What applies', 'Who says so'],
            rows: [
              ['Alcohol', 'Alcohol is forbidden to e-scooter riders too, and riding drunk can, depending on the level, bring criminal proceedings.', 'The police (Somogy County, 1 July 2026)'],
              ['Faster scooters', 'A scooter with a design speed over 25 km/h counts as a moped (segédmotoros kerékpár), so a licence, insurance and a helmet are compulsory.', 'The police (the same release)'],
              ['Passengers and drink on rental scooters', 'Since 1 September 2026 an operator gets a permit only if it undertakes to tell renters that they may carry no passenger, except a child in a child seat the operator fits, and may not ride drunk or drugged.', 'The city’s public-space decree'],
              ['Age', '18 to rent from Dott.', 'Dott’s terms for Hungary'],
              ['Speed, phone and riders', 'No faster than 20 km/h, or less where the local authority sets it; no phone or music player while riding; one rider only.', 'Dott’s terms for Hungary'],
            ],
          },
        },
        'On 25 June 2025 Győr-Moson-Sopron County police reported that an e-scooter rider in Győr who had tested positive for alcohol faced criminal proceedings for drink-driving.',
        'BKK’s page on shared micromobility asks riders to keep to the road, a cycle track or lane, or a shared pedestrian and cycle zone, and not to ride on the pavement.',
        'Stricter national rules are being prepared, not decided. On 16 July 2026 the prime minister confirmed that a draft of a new KRESZ was being written, and the transport ministry ran a public questionnaire, e-scooters included, until 9 September. On 9 October Dávid Vitézy, minister for transport and investment, said 94% of those who answered backed tightening the e-scooter rules soon, and that the government could present its plans within weeks, eduline reported.',
      ],
    },
    {
      heading: 'Erzsébetváros (District VII): 15 km/h and a night stop, on paper',
      blocks: [
        'On 29 April 2025 the council of Erzsébetváros, District VII, adopted resolution 149/2025. (IV. 29.) by 15 votes to none. It sets terms for the district’s future public-authority contracts with rental operators:',
        {
          list: [
            '**15 km/h** for the operators’ electric devices inside Károly körút, Király utca, Erzsébet körút and Rákóczi út, and in the area bounded by Bethlen Gábor utca, Garay utca, Nefelejcs utca, Thököly út and Baross tér.',
            '**No electric devices from 22:00 to 06:00** inside Károly körút, Király utca, Erzsébet körút and Rákóczi út.',
            '**No micromobility devices** on the paths and roads of parks, with signs to say so.',
            '**Duties for operators:** tidy their scooters at the marked points twice a day, remove a badly parked one within two hours of a report, and apply the speed limit and the night stop automatically.',
          ],
        },
        'The district chose contracts over an administrative decision, its report of the meeting says, and on 18 June 2025 a proposal to write the speed limit and the night stop into its public-space decree failed, by 7 votes to 1 with 7 abstentions. They are terms for contracts, not rules in the decree; any slow zone or no-ride hours on your ride are shown in the app.',
        'On 19 October 2023 the district also reported that its council had, the day before, banned using e-scooters on the district’s pavements.',
      ],
    },
    {
      heading: 'E-scooters on the metro, trams and buses',
      blocks: [
        'BKK’s business rules (Üzletszabályzat), in force since 15 June 2026, define a scooter (roller) as human-powered, with a handlebar, a deck and two wheels; one travels free as hand luggage on every vehicle within 100 × 120 × 20 cm, not counting the handlebar. The rules don’t mention electric scooters.',
        'The same rules ban riding a scooter (rollerezni) on vehicles and in the areas for passengers, such as stations, stops, platforms and pontoons. As we read them, that covers an e-scooter too.',
      ],
    },
    {
      heading: 'Near Budapest: Dunakeszi, Szigetszentmiklós and Gyömrő',
      blocks: [
        'Beyond the city line the map shows Lime in [Dunakeszi](map:hu:Dunakeszi), to the north, in [Szigetszentmiklós](map:hu:Szigetszentmiklós), to the south, and in Gyömrő, to the east. Whether you may end a ride across the city line, the app shows.',
        'New to renting? Our guide on [how to rent an e-scooter](guide:how-to-rent) walks through the app, the unlock and the end-of-ride photo.',
      ],
    },
    {
      heading: 'Did you know? Budapest e-scooter facts',
      blocks: [
        {
          list: [
            'In 2024, 367 road accidents involving e-scooter riders were recorded in Hungary, and 176 in the first five months of 2025; e-scooters cause or suffer 3 to 4% of the country’s road accidents, the police magazine Zsaru wrote on 2 September 2025.',
            'In December 2021 BKK put Budapest’s shared fleet at about 7,000 scooters and 2,000 bikes.',
            'In January 2020 Erzsébetváros began treating e-scooters left in its streets as lost property, held by the district until claimed.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooters can you rent in Budapest?',
      answer: 'Lime and Dott, both on [our Budapest map](map:hu:Budapest). Dott rents only to riders of 18 and over, and both show their prices in the app.',
    },
    {
      question: 'Can you ride an e-scooter after a drink in Budapest?',
      answer: 'No. The police say alcohol is forbidden to e-scooter riders too, and that riding drunk can, depending on the level, bring criminal proceedings. Dott’s terms also bar riding under the influence of alcohol.',
    },
    {
      question: 'Where can you park a rental e-scooter in Budapest?',
      answer: 'On streets the city owns or manages, only at a Mobi-pont, a bay with a round green-and-white sign, except in the outer zone, where it may stand elsewhere if it blocks no one: that is the city’s public-space decree. The app shows where you may end your ride.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Hungary?',
      answer: 'On a scooter with a design speed over 25 km/h, yes: the police say it counts as a moped, which also needs a licence and insurance. They ask every rider to wear protective gear, and Dott’s terms warn that where it provides injury insurance, head injuries may not be covered without a helmet.',
    },
    {
      question: 'Can you take an e-scooter on the metro or a bus in Budapest?',
      answer: 'BKK’s rules let a scooter travel free as hand luggage within 100 × 120 × 20 cm, but they define a scooter as human-powered and don’t mention electric ones. Riding a scooter on vehicles, platforms and stops is banned, and as we read the rules that includes an e-scooter.',
    },
    {
      question: 'Is there a night ban on e-scooters in Budapest?',
      answer: 'Erzsébetváros (District VII) set a stop from 22:00 to 06:00 inside Károly körút, Király utca, Erzsébet körút and Rákóczi út as a term for its future contracts with operators, not in its decree. Whether it applies to your ride, the app shows.',
    },
  ],
  sources: [
    { title: 'Fővárosi Közlöny, 3 June 2026: city decree 7/2026. (VI. 3.) (Hungarian, PDF)', url: 'https://budapest.hu/api/file/doc/fovarosi-kozlony-2026-8.pdf' },
    { title: 'Fővárosi Közlöny, 31 August 2026: the Mobi-pontok, resolution 188/2026. (VIII. 14.) KKVB (Hungarian, PDF)', url: 'https://budapest.hu/api/file/doc/fovarosi-kozlony-2026-12.pdf' },
    { title: 'Fővárosi Közlöny, 5 May 2022: city decree 13/2022. (V. 5.) (Hungarian, PDF)', url: 'https://budapest.hu/api/file/doc/Fovarosi_Kozlony_2022_7_alairt.pdf' },
    { title: 'ÉnBudapestem (City of Budapest): Erzsébetváros tightens its e-scooter rules, 15 May 2025 (Hungarian)', url: 'https://enbudapestem.hu/2025/05/15/erzsebetvaros-jelentosen-szigoritja-a-berelheto-elektromos-rollerek-hasznalatat' },
    { title: 'BKK: shared micromobility in Budapest (Hungarian)', url: 'https://bkk.hu/utazasi-informaciok/aktiv-kozlekedes/megosztott-roller-es-kerekpar/' },
    { title: 'BKK: 940 Mobi-pontok from April, 21 March 2025 (Hungarian)', url: 'https://bkk.hu/hirek/2025/03/bovul-a-mobi-pontok-halozata-mar-940-helyen-parkolhatunk-rollerrel-es-biciklivel.14030/' },
    { title: 'BKK: the scooter framework before the General Assembly, 14 December 2021 (Hungarian)', url: 'https://bkk.hu/hirek/2021/12/kozgyules-elott-a-szabalyozas-terve-budapest-tiltas-helyett-szabalyozassal-segiti-a-megosztott-kerekparok-es-rollerek-hasznalatat.7044/' },
    { title: 'BKK: business rules in force from 15 June 2026 (Hungarian, PDF)', url: 'https://bkk.hu/downloads/42749/' },
    { title: 'Hungarian Police: Somogy County release, 1 July 2026 (Hungarian)', url: 'https://www.police.hu/hu/hirek-es-informaciok/legfrissebb-hireink/kozlekedesrendeszet/ittasan-szenvedett-balesetet-egy' },
    { title: 'Hungarian Police: drink-riding in Győr, 25 June 2025 (Hungarian)', url: 'https://www.police.hu/hu/hirek-es-informaciok/legfrissebb-hireink/kozlekedesrendeszet/e-rollerrel-is-tilos-ittasan-kozlekedni' },
    { title: 'Zsaru magazine: e-scooter accidents, 2 September 2025 (Hungarian)', url: 'https://www.police.hu/hu/hirek-es-informaciok/legfrissebb-hireink/zsaru-magazin/hogy-ne-legyen-romos-az-elektromos' },
    { title: 'Government of Hungary: government press briefing, 16 July 2026 (Hungarian)', url: 'https://kormany.hu/hirek/videkfejlesztes-technologiaiberuhazas-azbesztmentesites' },
    { title: 'Government of Hungary: consultation on road safety, 17 July 2026 (Hungarian)', url: 'https://kormany.hu/hirek/biztonsagosabb-utakat-szeretne-mondja-el-a-velemenyet' },
    { title: 'Government of Hungary: road safety questionnaire (Hungarian)', url: 'https://egyeztetes.kormany.hu/egyeztetes/kozlekedesbiztonsag' },
    { title: 'eduline: Vitézy on stricter e-scooter rules, 9 October 2026 (Hungarian)', url: 'https://eduline.hu/kozoktatas/20261009_vitezy-david-magyar-peter-bejelentes' },
    { title: 'Erzsébetváros: council resolutions of 29 April 2025 (Hungarian, PDF)', url: 'https://www.erzsebetvaros.hu/uploads/files/php2YGu2i-1746011602-2025_04_29_KT_kivonat_ny%C3%ADlt.pdf' },
    { title: 'Erzsébetváros: council decisions of 18 June 2025 (Hungarian, PDF)', url: 'https://www.erzsebetvaros.hu/uploads/files/phpisJnw3-1750672522-2025_06_18_KT_kivonat_ny%C3%ADlt.pdf' },
    { title: 'Erzsébetváros: joint proposals on e-scooters (Hungarian)', url: 'https://www.erzsebetvaros.hu/articles/koezoes-javaslatok-a-keruelet-vezetesetol-es-a-fidesztol' },
    { title: 'Erzsébetváros: stricter rules, 19 October 2023 (Hungarian)', url: 'https://www.erzsebetvaros.hu/articles/kepviselo-testuelet-szigorubb-szabalyok-erzsebetvarosban' },
    { title: 'Erzsébetváros: e-scooters as lost property, 20 January 2020 (Hungarian)', url: 'https://www.erzsebetvaros.hu/articles/matol-erzsebetvaros-talalt-targykent-kezeli-az-elektromos-rollereket' },
    { title: 'Dott: terms and conditions for Hungary', url: 'https://ridedott.com/terms-and-conditions/hungary/' },
    { title: 'Lechner Tudásközpont: Hungarian administrative boundaries (Hungarian)', url: 'https://lechnerkozpont.hu/oldal/magyar-kozigazgatasi-hatarok' },
  ],
};

export default guide;
