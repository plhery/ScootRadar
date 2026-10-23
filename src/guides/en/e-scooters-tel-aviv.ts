import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-tel-aviv',
  topic: 'tel-aviv',
  name: 'Renting an e-scooter in Tel Aviv',
  title: 'E-scooter Tel Aviv 2026: Lime, Bird, Dott, rules and prices',
  description: 'E-scooter Tel Aviv guide: Lime, Bird and Dott, what a ride costs, the licence or riding test, helmet and sidewalk fines, parking bays, Shabbat and the airport.',
  headline: 'E-scooters in Tel Aviv: Lime, Bird and Dott, what a ride costs, the licence rule, parking bays and Shabbat',
  lede: 'You can rent an e-scooter in Tel Aviv with Lime, Bird or Dott. Dott charges ₪5 to unlock plus ₪1.25 a minute (published rate, 16 October 2026); Lime and Bird show their prices in the app. Israeli rules let you ride from 16, with a helmet and a driving licence or a passed test, and never on the sidewalk, the Israeli news site Ice reported in 2024. In the city centre you can end a ride only in a marked bay.',
  published: '2026-10-16',
  updated: '2026-10-23',
  city: 'il:Tel Aviv',
  sections: [
    {
      heading: 'Which e-scooter apps work in Tel Aviv?',
      blocks: [
        'Three apps put stand-up e-scooters on our map of Tel Aviv-Yafo, Jaffa included: **Lime**, **Bird** and **Dott**.',
        'On the evening of 16 October 2026 the [map of Tel Aviv](map:il:Tel Aviv) showed about 7,400 scooters: some 3,000 Lime, 2,400 Bird and 2,000 Dott. That’s a count of what’s on the map, not the fleets, and the map’s area reaches into Ramat Gan, Givatayim, Holon and Bat Yam. The suburbs have scooters of their own: the [Ramat Gan map](map:il:Ramat Gan) showed about 3,600 the same evening.',
        'Tel Aviv-Yafo began regulating the companies in August 2019, with parking bays in the centre and city inspectors, Maariv reported, and in January 2020 it made them fit ID plates, Globes reported. ScootRadar doesn’t show bike share or e-bikes.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Tel Aviv?',
      blocks: [
        'Dott publishes its Tel Aviv rate: ₪5 to unlock, then ₪1.25 a minute. Lime and Bird publish no price in their open data, so compare them in their apps.',
        {
          table: {
            caption: 'Dott in Tel Aviv (published rate, 16 October 2026)',
            head: ['Ride', 'Price'],
            rows: [
              ['5 minutes', '₪11.25'],
              ['10 minutes', '₪17.50'],
              ['20 minutes', '₪30'],
              ['30 minutes', '₪42.50'],
            ],
          },
        },
        'Fines cost far more than rides, and a scooter is easy to trace: since 1 August 2024 e-scooters in Israel have had to be registered and carry an ID plate, Maariv reported in 2026.',
      ],
    },
    {
      heading: 'Do you need a licence for an e-scooter in Tel Aviv as a tourist?',
      blocks: [
        'Yes. Israel’s rules ask every rider for a driving licence or, without one, a passed riding or theory test, Ice reported in 2024. Riding without either has carried a ₪750 fine since 2022, Srugim reported.',
        'We found no news report on whether a foreign licence counts, and no page from Lime, Bird or Dott on how they check one, so carry your licence and follow what your app asks for.',
        { note: '**Carry your driving licence and wear a helmet.** Since 2022 city inspectors, not only the police, can fine you for riding without either, Srugim reported.' },
        'The minimum age is 16; riding younger costs ₪1,000, Srugim reported in 2022.',
      ],
    },
    {
      heading: 'Israel’s e-scooter rules and fines in 2026',
      blocks: [
        'Most rules are national: the Transport Ministry sets them and the Knesset’s Economy Committee approves the fines, Ice and Srugim reported. Tel Aviv-Yafo adds parking and zone rules for the companies and sends its own inspectors onto the streets.',
        {
          table: {
            caption: 'E-scooter rules in Tel Aviv as the press reported them, checked 23 October 2026',
            head: ['Rule', 'What applies', 'Fine', 'Reported by'],
            rows: [
              ['Minimum age', '16', '₪1,000', 'Srugim 2022; Ice 2024'],
              ['Licence or test', 'A driving licence or, without one, a passed test', '₪750', 'Srugim 2022; Ice 2024'],
              ['Helmet', 'Required', 'A fine; reports differ on the amount', 'Srugim 2022; Ice 2024'],
              ['Speed', '25 km/h at most; Dott’s scooters slow to 15 km/h in its slow zones', '–', 'Ice 2024; Dott open data'],
              ['Where to ride', 'Bike path, or the road where there is none; never the sidewalk', '₪250 on the sidewalk', 'dpa 2019; Ice 2023'],
              ['Passengers', 'One rider only', '₪250', 'Srugim 2022; Ice 2023'],
              ['Alcohol', 'No riding drunk, as for any vehicle', 'A court case; you can lose your driving licence', 'Calcalist 2019'],
              ['ID plate', 'Registered, with a plate, since 1 August 2024', '₪750 since 1 September 2026', 'Maariv 2026'],
            ],
          },
        },
        'The Knesset’s Economy Committee approved the ₪1,000 fine for riding under 16 and the ₪750 one for riding without a licence or test in June 2022, Srugim reported. Tel Aviv-Yafo’s 2023 reminder to riders put the sidewalk and passenger fines at ₪250 each, Ice reported.',
        '**Alcohol.** E-scooters are “subject to the same traffic laws as any other vehicle”, a police spokesman told Calcalist in 2019, when Tel Aviv police began breath-testing riders. The paper said a conviction could cost you your driving licence for 24 months.',
        'The city’s inspectors enforce alongside the police. In 2019, 21,000 tickets were written for riding on the sidewalk, Globes reported, and in June 2022 the Knesset’s Economy Committee approved letting municipal inspectors also fine riders for a missing helmet, riding under 16 or without a licence or course, and carrying a passenger, Srugim reported. In January 2020 the city opened its 106 app to reports of shared scooters on the sidewalk; the company then sanctions the rider, from a warning to a ban.',
      ],
    },
    {
      heading: 'Where to ride and park in Tel Aviv and Jaffa',
      blocks: [
        'Ride on a bike path; where a street has none, ride on the road, never on the sidewalk, dpa reported in 2019. Tel Aviv-Yafo repeated the rule in 2023, asking riders to keep to marked paths and the right-hand side of the road, Ice reported.',
        '**Parking in the city centre: bays only.** Tel Aviv-Yafo began requiring marked bays for shared scooters in August 2019, in district 3, between Ibn Gabirol Street and the sea, Maariv reported. Dott’s open data now show its bays-only zone covering the centre, Florentin, Neve Tzedek, the seafront and the area around the Jaffa clock tower; there its app won’t let you end a ride outside a bay.',
        '**Elsewhere**, check the app before you stop: Bird’s and Dott’s open data mark hundreds of spots where you can’t end a ride. City inspectors target scooters left blocking public space, Maariv reported when the rules began.',
        '**No-ride zones.** Dott’s open data mark zones where its scooters won’t run at Habima Square, the deck at Tel Aviv Port, Rabin Square and Sarona; walk the scooter through. The city announced bans on busy areas such as the port from February 2020, Globes reported.',
        '**Slow zones at 15 km/h.** Dott’s open data mark more than 100 small zones around Tel Aviv where its scooters slow to 15 km/h, Nahalat Binyamin among them. The city announced its first such zones for February 2020, Globes reported.',
        '**The promenade (tayelet) and Jaffa.** The seafront down to Jaffa, with the clock tower, the flea market and the port, lies inside Bird’s and Dott’s areas. Give way to people on foot, and walk the scooter where it’s crowded.',
      ],
    },
    {
      heading: 'Ben Gurion airport, the Red Line and Rav-Kav',
      blocks: [
        '**The airport.** Ben Gurion lies about 15 km from Tel Aviv, outside Bird’s and Dott’s areas; on 16 October 2026 Lime’s open data put its nearest scooter more than 2.5 km from either terminal. Take the train from the lower level of Terminal 3 to Tel Aviv’s HaHagana, HaShalom and Savidor Center stations, 15 to 20 minutes away. Trains don’t run on Shabbat or Jewish holidays; check the Israel Railways app.',
        '**The Red Line.** Tel Aviv’s light rail runs from Petah Tikva through central Tel Aviv to [Bat Yam](map:il:Bat Yam), with 34 stations. When it opened in August 2023, scooters and bikes could board only if they fold and are folded, Walla reported. A shared scooter can’t go on board: end your ride near the station, in a bay if you’re in the centre, and walk in.',
        '**Rav-Kav and apps.** On the Red Line you validate a Rav-Kav card at the station, not on board, or pay with a payment app.',
      ],
    },
    {
      heading: 'Shabbat, holidays and the heat',
      blocks: [
        '**Shabbat.** Israel’s trains and the Red Line stop from Friday afternoon to Saturday evening. Shared scooters were still on our map: on Friday evening, 16 October 2026, a few hours after Shabbat began, it showed about 7,400 in and around Tel Aviv. That’s one evening, not a company policy, and we found none published, so check the app.',
        '**Free weekend buses.** Naim BeSofash, a free bus network paid for by Tel Aviv and its neighbours, runs on Friday nights and Saturdays, when regular public transport doesn’t; in February 2026 it linked 14 towns, Walla reported. Since then its line 711 has stopped at Ben Gurion’s Terminal 1 a few times a day on its way to Dizengoff Center.',
        '**The heat.** From July to September daytime highs are usually around 30 °C, in humid sea air, so ride early or late and carry water. Most rain falls from November to March, often in heavy bursts.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Tel Aviv catches sidewalk riders on camera**: in 2023 it put up dozens of cameras around the city, and riders who slip past the inspectors get the ticket by post, Ice reported.',
            '**Bird’s second city outside the US was Tel Aviv**, in mid-August 2018, after Paris.',
            '**Dott’s first city outside Europe was Tel Aviv**, where it launched with 1,800 scooters in May 2022.',
            '**No fine for a helmet without a reflector**: in 2022 the Knesset’s Economy Committee left that rule out of the fines because it wasn’t clear enough and could trip people up, Srugim reported.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter apps work in Tel Aviv?',
      answer: 'Lime, Bird and Dott are the three on our [Tel Aviv map](map:il:Tel Aviv), across Tel Aviv-Yafo, Jaffa included, and in the suburbs. Dott charges ₪5 to unlock plus ₪1.25 a minute; Lime and Bird show their prices in the app.',
    },
    {
      question: 'Do I need a licence to ride an e-scooter in Tel Aviv as a tourist?',
      answer: 'Yes. Every rider needs a driving licence or, without one, a passed test, Ice reported in 2024. We found no report on whether a foreign licence counts, so carry yours and follow what the app asks for.',
    },
    {
      question: 'Is a helmet compulsory on an e-scooter in Israel?',
      answer: 'Yes. Israel’s rules require one, Ice reported in 2024, and since 2022 city inspectors as well as the police can fine you for riding without it, Srugim reported.',
    },
    {
      question: 'Can you ride an e-scooter on the sidewalk in Tel Aviv?',
      answer: 'No. Ride on a bike path, or on the right-hand side of the road where there is none. Riding on the sidewalk costs ₪250, Ice reported in 2023, and the city catches it with inspectors and cameras.',
    },
    {
      question: 'Can you take an e-scooter on the Tel Aviv light rail?',
      answer: 'Only a folding one, folded: that was the rule when the line opened in 2023. A shared scooter doesn’t fold, so it stays outside: end your ride near the station.',
    },
    {
      question: 'Do e-scooters run on Shabbat in Tel Aviv?',
      answer: 'Trains and the Red Line stop from Friday afternoon to Saturday evening. Shared scooters were still on our map on Friday evening, 16 October 2026, a few hours after Shabbat began: about 7,400 in and around Tel Aviv. That’s one evening, not a published policy, so check the app.',
    },
  ],
  sources: [
    { title: 'Srugim: Economy Committee approves ₪1,000 fine for riding without a helmet (13 June 2022), Hebrew', url: 'https://www.srugim.co.il/682043' },
    { title: 'Srugim: municipal inspectors to fine e-scooter riders (20 June 2022), Hebrew', url: 'https://www.srugim.co.il/683771' },
    { title: 'Maariv: Tel Aviv to regulate shared e-scooters from 1 August (16 June 2019), Hebrew', url: 'https://www.maariv.co.il/economy/israel/article-703904' },
    { title: 'Globes: Tel Aviv e-scooters now have license plates (1 January 2020)', url: 'https://en.globes.co.il/en/article-tel-aviv-e-scooters-now-have-license-plates-1001313202' },
    { title: 'Calcalist: a new bump in the road for Tel Aviv’s e-scooter users, DUI charges (22 July 2019)', url: 'https://www.calcalistech.com/articles/0,7340,L-3766823,00.html' },
    { title: 'Jüdische Allgemeine (dpa): Tel Aviv hands out thousands of tickets to e-scooter riders (12 July 2019), German', url: 'https://www.juedische-allgemeine.de/israel/tel-aviv-verteilt-tausende-strafzettel-an-e-roller-fahrer/' },
    { title: 'Ice: Tel Aviv-Yafo reminds riders of the rules and fines (24 September 2023), Hebrew', url: 'https://www.ice.co.il/consumerism/news/article/981670' },
    { title: 'Ice: Tel Aviv-Yafo’s cameras catch riders on the sidewalk (2 October 2023), Hebrew', url: 'https://www.ice.co.il/law/news/article/982628' },
    { title: 'Ice: Transport Ministry campaign for e-scooter ID plates from 1 August (10 July 2024), Hebrew', url: 'https://www.ice.co.il/auto/news/article/1020163' },
    { title: 'Ice: e-scooter and e-bike registration from 1 August 2024 (24 July 2024), Hebrew', url: 'https://www.ice.co.il/auto/news/article/1022195' },
    { title: 'Maariv: the fine for riding without an ID plate rises on 1 September (30 August 2026), Hebrew', url: 'https://www.maariv.co.il/news/israel/article-1361063' },
    { title: 'Israel Airports Authority: about Ben Gurion Airport', url: 'https://www.iaa.gov.il/en/airports/ben-gurion/about/' },
    { title: 'Wikipedia: Ben Gurion Airport railway station', url: 'https://en.wikipedia.org/wiki/Ben_Gurion_Airport_railway_station' },
    { title: 'Wikipedia: Red Line (Tel Aviv Light Rail)', url: 'https://en.wikipedia.org/wiki/Red_Line_(Tel_Aviv_Light_Rail)' },
    { title: 'Walla: the Red Line’s hours, stations and rules on opening day (17 August 2023), Hebrew', url: 'https://news.walla.co.il/item/3602625' },
    { title: 'Walla: free weekend bus from Ben Gurion to Tel Aviv (12 February 2026), Hebrew', url: 'https://cars.walla.co.il/item/3816317' },
    { title: 'IAS: Naim BeSofash line 711 to Ben Gurion, free (12 February 2026), Hebrew', url: 'https://www.ias.co.il/?p=184936' },
    { title: 'Dott: open data for Tel Aviv (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/tel-aviv/gbfs.json' },
    { title: 'Bird: open data for Tel Aviv (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/tel-aviv/gbfs.json' },
  ],
};

export default guide;
