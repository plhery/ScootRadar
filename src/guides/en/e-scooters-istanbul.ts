import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-istanbul',
  topic: 'istanbul',
  name: 'E-scooters in İstanbul',
  title: 'E-scooters Istanbul 2026: BinBin, Martı, Hop and the rules',
  description: 'E-scooters in Istanbul: BinBin, Martı and Hop, how prices work, the age and pavement rules, where to park, the Bosphorus bridges and 2026 fines.',
  headline: 'E-scooters in İstanbul: BinBin, Martı and Hop, prices, where to ride and park, and Turkey’s 2026 rules',
  lede: 'E-scooters in İstanbul are rented through three apps: BinBin, Martı and Hop. None publishes an İstanbul price on its website; the app shows the unlock fee and the price a minute before you start. Turkish law lets you ride from 15 without a licence: in the cycle lane where there is one, otherwise on roads with a limit of 50 km/h or less, never on the pavement and never over the Bosphorus bridges. End your ride only where the app allows; red areas on its map are no-parking zones.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'tr:İstanbul',
  sections: [
    {
      heading: 'E-scooters in İstanbul: BinBin, Martı and Hop',
      blocks: [
        'Three companies rent e-scooters in İstanbul. The Ministry of Transport licenses each operator, and UKOME, the transport coordination centre of İstanbul Metropolitan Municipality (İBB), gives out the scooter permits district by district. In February 2026 it accepted a proposal to raise the total to 78,423 in 39 districts, DHA reported.',
        {
          list: [
            '**BinBin** rents to anyone of 15 or over. Visitors sign up with a passport number, a photo of their ID and a selfie, then save their payment details.',
            '**Martı** asks riders of its scooters and Mobilet e-bikes to be 16; its mopeds need a driving licence and an age of 18.',
            '**Hop** lists İstanbul among its cities and rents e-scooters and e-bikes; its rules ask riders to be over 15.',
          ],
        },
        'At 15:50 on Sunday 25 October 2026 the [İstanbul map](map:tr:İstanbul) showed 6,024 BinBin scooters: a snapshot, not the fleet. That evening, at 21:32, about 2,500 stood on the European side and 3,350 on the Asian side. By district, on the state land registry’s boundaries, Fatih (about 950) and Kadıköy (about 930) led, ahead of Üsküdar, Pendik and Bakırköy; Beyoğlu, around Taksim, had about 50. About 150 of them stood across the provincial line, in Darıca, Gebze and Çayırova in Kocaeli.',
        'The map shows only BinBin’s scooters, with their position and battery: no prices, zones or parking, and not BinBin’s small area at İstanbul Airport. Martı’s and Hop’s scooters are only in their apps, and it shows no e-bikes, mopeds or İBB’s İsbike bikes. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in İstanbul?',
      blocks: [
        'None of the three operators publishes an İstanbul price on its website (checked 25 October 2026). BinBin shows the unlock fee and the price a minute when you pick a scooter, and since June 2026 the national regulation has made every operator show its prices in its app or on its website. BinBin charges your card or prepaid balance at the end of the ride.',
        {
          table: {
            caption: 'E-scooters in İstanbul at a glance, 25 October 2026, and who says so',
            head: ['Question', 'Answer', 'Who says so'],
            rows: [
              ['Which operators?', 'BinBin, Martı and Hop', 'The operators’ websites'],
              ['How many scooters may run?', '78,423 in 39 districts; none on the Princes’ Islands', 'UKOME, February 2026 (DHA report)'],
              ['What does a ride cost?', 'An unlock fee plus a price a minute, shown in the app', 'BinBin; the national regulation'],
              ['Passes?', 'BinPass: prepaid minutes, rides or free unlocks, by credit card only', 'BinBin'],
              ['Who can ride?', '15 and over, no licence; Martı asks for 16', 'The traffic law; Martı'],
              ['Night ban?', 'None found', 'The law; UKOME’s reported decisions; the operators'],
              ['Where does a ride end?', 'Where the app allows, never in a red area', 'BinBin; Martı'],
            ],
          },
        },
        'On BinBin’s map, light areas are where you may ride and park, green marks a discount, orange a speed limit and red a parking ban. Outside the light areas BinBin holds you to 10 km/h.',
      ],
    },
    {
      heading: 'Where can you ride an e-scooter in İstanbul?',
      blocks: [
        'National law, the Highway Traffic Law (Karayolları Trafik Kanunu, KTK), decides where you ride:',
        {
          list: [
            'In the **cycle path or cycle lane** where there is one, not on the carriageway beside it.',
            'Otherwise on the **road**, but only where the limit is **50 km/h or less**; never on motorways or intercity roads.',
            '**Never on the pavement** or anywhere set aside for pedestrians, and no more than two side by side in a lane.',
          ],
        },
        '**The Bosphorus bridges are out.** All three carry motorways (the O-1, O-2 and O-7 on the motorway map of KGM, the state highways agency), which the law closes to e-scooters. BinBin runs the two sides as separate areas: end your ride, cross by ferry or Marmaray, and rent again on the other side.',
        '**No-go and slow zones are UKOME’s.** Under the national regulation, its decisions list where scooters may not run and how fast they may go, at most 25 km/h. İBB’s and UKOME’s websites didn’t answer us on 25 October 2026, so we can’t give today’s list. The latest decision we found cut the limit from 20 to 12.5 km/h in Kadıköy, Şişli, Beşiktaş, Beyoğlu and Fatih, which takes in the historic peninsula and Sultanahmet, Hürriyet Daily News reported on 20 November 2023. Since June 2026 the regulation has made operators enforce these zones: a warning sounds as you near a no-go zone, and inside one the scooter slows gradually to 6 km/h.',
        'The law bans scooters from pedestrian streets such as İstiklal Caddesi: walk the scooter there. On the seafront, ride in the cycle path where there is one, not on the promenade.',
      ],
    },
    {
      heading: 'Where to park an e-scooter in İstanbul',
      blocks: [
        'Parking rules come in three layers:',
        {
          list: [
            '**The national regulation** bans parking that blocks pedestrians, disabled people or traffic, or on private property, and gives the operator two hours to collect such a scooter.',
            '**UKOME** decides on parking areas. In July 2026 it gave the operators 90 days to finish the 1,934 they owe, of which 227 had been built, or lose their permits, AA reported.',
            '**The operators.** BinBin lets you park in the light areas of its map, except on private property, never in a red one, and you end the ride with a photo. Martı accepts only the parking areas its app allows, clear of crossings, pavements and entrances. Hop asks you to keep clear of pavements, bus stops and shop entrances.',
          ],
        },
        'District municipalities act too: Kadıköy towed away badly parked scooters in 2023, Hürriyet Daily News reported.',
      ],
    },
    {
      heading: 'Turkey’s e-scooter rules in 2026, and who sets them',
      blocks: [
        'The rules come from three texts: the KTK, which has covered e-scooters since December 2020 and whose fines Law 7574 set from 27 February 2026; the Highway Traffic Regulation (KTY); and the Ministry of Transport’s Electric Scooter Regulation (Elektrikli Skuter Yönetmeliği) of 14 April 2021, last amended on 13 October 2026.',
        {
          table: {
            caption: 'E-scooter rules in İstanbul on 25 October 2026, who sets them and the 2026 fines',
            head: ['Rule', 'What applies', 'Set by', 'Fine'],
            rows: [
              ['Age', '15 or over; no licence needed', 'National law (KTK); Martı sets 16', '1,246 lira for letting a child under 15 ride'],
              ['Where to ride', 'Cycle path or lane first, then roads with a limit of 50 km/h or less', 'National law', '5,000 lira'],
              ['Pavement', 'Never', 'National law', '5,000 lira'],
              ['Speed', '25 km/h at most; lower in zones', 'The regulation; UKOME', '–'],
              ['Passengers and loads', 'One rider; only personal items carried on your back', 'National law', '5,000 lira'],
              ['Hands', 'Both on the handlebar, except to signal', 'National law', '5,000 lira'],
              ['Red light', 'Stop', 'National law', '5,000 lira'],
              ['One-way streets', 'No riding against the flow', 'National law', '10,000 lira'],
              ['Phone', 'Not while moving', 'National law', '5,000 lira; 10,000 the second and 20,000 the third time in a year'],
              ['Alcohol', '0.50 ‰ for private-car drivers, 0.20 ‰ for other drivers; no separate e-scooter limit, so don’t ride after drinking', 'National law (KTK); Hop says don’t drink and ride', '25,000 lira for a driver over the limit'],
              ['Helmet', 'Not required for e-scooters; the app must remind you to wear one', 'The KTY; the regulation; Hop asks you to', '–'],
              ['Reflective vest', 'Compulsory when riding at night', 'The KTY', '–'],
              ['Parking', 'Not blocking pedestrians, disabled people or traffic; only where the app allows', 'The regulation; UKOME; the operator', 'The operator moves it within 2 hours'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Buses, Metrobüs, metro, Marmaray and ferries',
      blocks: [
        'You can’t take a shared scooter on board: İETT, İBB’s bus company, leaves “the scooters of sharing systems used commercially” out of its scooter rule, and UKOME’s 2021 directive barred them from public transport, Yeni Şafak reported. For your own e-scooter, İETT’s passenger charter (read 25 October 2026) says:',
        {
          list: [
            'A **folding** e-scooter may travel on İETT buses at any time.',
            'A **non-folding** one only 10:00–16:00 and 22:00–06:00.',
            'Both rules end “Metrobüs excepted”, and double-deckers and the Princes’ Islands buses take no scooters.',
          ],
        },
        'Metro İstanbul’s website didn’t answer us, and the Marmaray operator’s and the Şehir Hatları ferry sites refused our requests, so we can’t quote their rules: ask staff before boarding.',
      ],
    },
    {
      heading: 'İstanbul Airport, the palaces, campuses and parks',
      blocks: [
        'Under the national regulation, airports, university campuses, hospitals and national parks decide about shared scooters on their land:',
        {
          table: {
            caption: 'Rules on land owned by others, as each owner states them, 25 October 2026',
            head: ['Place', 'Owner', 'What it says'],
            rows: [
              ['İstanbul Airport', 'İGA, the airport operator', 'Nothing on scooters in its transport pages. BinBin says it is with you “everywhere, airports and shopping centres included”'],
              ['Sabiha Gökçen Airport', 'The airport operator', 'Nothing on scooters in its transport page'],
              ['Topkapı, Dolmabahçe, Beylerbeyi and Yıldız palaces', 'The National Palaces Administration (Milli Saraylar), under the Presidency', 'Its visitor rules ban weapons; nothing on scooters'],
              ['Boğaziçi University, İstanbul Technical University (İTÜ)', 'Each university', 'No scooter rule found: follow the signs and the app'],
              ['Gülhane, Emirgan and Yıldız parks', 'Their managers', 'No rule found: follow the signs and the app'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Winter, rain and riding at night',
      blocks: [
        'We found no night ban, but at night you must wear a reflective vest. From November to February the operators may keep as few as 40% of their permitted scooters out, against 70% the rest of the year, so there may be fewer in winter. UKOME’s 2021 directive also lets them switch scooters off in bad weather, Yeni Şafak reported.',
        'The [map of İstanbul](map:tr:İstanbul) shows which BinBin scooters stand near you and how charged they are.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**İstanbul’s cap is a formula.** A district may have one shared scooter per 200 residents, or up to 50% more, and no operator more than a fifth of the base figure.',
            '**The app must show your carbon footprint.** Since June 2026 the regulation has required every operator’s app to compare it with a car’s.',
            '**The Princes’ Islands have no shared scooters**: UKOME gave Adalar no permits in February 2026.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter apps can I use in İstanbul?',
      answer: 'BinBin, Martı and Hop. Our [İstanbul map](map:tr:İstanbul) shows BinBin’s scooters; Martı’s and Hop’s are only in their own apps.',
    },
    {
      question: 'How much does a BinBin scooter cost in İstanbul?',
      answer: 'BinBin publishes no İstanbul price. The app shows the unlock fee and the price a minute before you start.',
    },
    {
      question: 'Do I need a driving licence to ride an e-scooter in Turkey?',
      answer: 'No. You must be 15 or over (Martı asks for 16). BinBin lets visitors sign up with a passport.',
    },
    {
      question: 'Is a helmet compulsory on an e-scooter in İstanbul?',
      answer: 'No: the law requires one on bicycles and mopeds, not e-scooters, though the app must remind you to wear one. A reflective vest is compulsory at night.',
    },
    {
      question: 'Can I ride an e-scooter on the pavement in İstanbul?',
      answer: 'No: it costs 5,000 lira. Use the cycle lane, or a road with a limit of 50 km/h or less.',
    },
    {
      question: 'Can I cross the Bosphorus on an e-scooter?',
      answer: 'Not over the bridges, which are motorways. End your ride, cross by ferry or Marmaray, and rent again.',
    },
    {
      question: 'Can I take an e-scooter on the bus or the Metrobüs?',
      answer: 'Not a shared one. Your own folding e-scooter may ride İETT buses at any time, a non-folding one only 10:00–16:00 and 22:00–06:00; İETT’s rule leaves out the Metrobüs.',
    },
  ],
  sources: [
    { title: 'Electric Scooter Regulation, consolidated, Turkish', url: 'https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=38528&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5' },
    { title: 'Resmî Gazete: the 2025 amendment, Turkish', url: 'https://www.resmigazete.gov.tr/eskiler/2025/12/20251202-3.htm' },
    { title: 'Highway Traffic Law 2918, consolidated, Turkish', url: 'https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=2918&mevzuatTur=Kanun&mevzuatTertip=5' },
    { title: 'Resmî Gazete: Law 7574 (27 February 2026), Turkish', url: 'https://www.resmigazete.gov.tr/eskiler/2026/02/20260227-0.htm' },
    { title: 'Highway Traffic Regulation, consolidated, Turkish', url: 'https://www.mevzuat.gov.tr/File/GeneratePdf?mevzuatNo=8182&mevzuatTur=KurumVeKurulusYonetmeligi&mevzuatTertip=5' },
    { title: 'EGM (police): 2026 traffic fines guide, Turkish', url: 'https://www.trafik.gov.tr/kurumlar/trafik.gov.tr/trafik-para-cezasi/2026/2026-Yili-Trafik-Idari-Para-Ceza-Rehberi(2).pdf' },
    { title: 'KGM: motorway and bridge restrictions, Turkish', url: 'https://www.kgm.gov.tr/Sayfalar/KGM/SiteTr/Otoyollar/KisitlamalarKanunlar.aspx' },
    { title: 'İETT: passenger charter, Turkish', url: 'https://iett.istanbul/icerik/yolcu-haklari-bildirgesi' },
    { title: 'BinBin: help centre, Turkish', url: 'https://www.binbin.tech/yardim/' },
    { title: 'Martı: micromobility, Turkish', url: 'https://www.marti.tech/tr/hizmetler/mikromobilite' },
    { title: 'Hop: rules and cities', url: 'https://hoplagit.com/' },
    { title: 'DHA: UKOME allows 78,423 e-scooters (26 February 2026), Turkish', url: 'https://www.dha.com.tr/gundem/istanbulda-elektrikli-skuter-sayisinin-78-bin-423e-cikarilma-teklifi-ukomede-kabul-edildi-2826650' },
    { title: 'BirGün (AA): UKOME on parking areas (30 July 2026), Turkish', url: 'https://www.birgun.net/haber/ukome-den-yeni-ulasim-kararlari-eds-kadikoy-hatlari-ve-scooter-duzenlemesi-726546' },
    { title: 'Hürriyet Daily News: lower limit in five districts (20 November 2023)', url: 'https://www.hurriyetdailynews.com/speed-limit-reduced-for-e-scooters-in-istanbuls-5-districts-187959' },
    { title: 'Yeni Şafak: UKOME’s e-scooter directive (4 June 2021), Turkish', url: 'https://www.yenisafak.com/gundem/istanbulda-elektrikli-scooter-duzenlemesi-yas-siniri-ve-kaldirim-yasagi-getirildi-3636592' },
    { title: 'Milli Saraylar: Topkapı Palace, Turkish', url: 'https://www.millisaraylar.gov.tr/Lokasyon/2/topkapi-sarayi' },
    { title: 'TKGM (land registry): Parsel Sorgu, district boundaries, Turkish', url: 'https://parselsorgu.tkgm.gov.tr/' },
  ],
};

export default guide;
