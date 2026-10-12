import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-bern',
  topic: 'bern',
  name: 'Renting an e-scooter in Bern',
  title: 'E-scooter Bern 2026: Voi prices, no-ride zones, parking',
  description: 'Rent an e-scooter in Bern: only Voi holds a permit. What ten minutes cost, where the Old Town is off-limits, where to park, and when an e-bike is cheaper.',
  headline: 'E-scooters in Bern: renting a Voi, prices, no-ride zones and where to park',
  lede: 'To rent an e-scooter in Bern, you need the Voi app: since 1 May 2024 the city has licensed Voi alone, for five years and up to 300 scooters. You must be at least 18 and pay CHF 1.00 to unlock plus CHF 0.42 a minute, so ten minutes cost CHF 5.20 (published rate on 12 October 2026). You can’t ride in the Old Town between Spitalgasse and Gerechtigkeitsgasse; in the rest of the centre, at the station or on Bundesplatz for example, you can end a ride only at a Voi parking spot; and Köniz and the Gurten are no-riding zones.',
  published: '2026-10-12',
  updated: '2026-10-12',
  city: 'ch:bern',
  sections: [
    {
      heading: 'Who rents out e-scooters in Bern? Only Voi',
      blocks: [
        'Lime, Bolt, Bird and Dott aren’t here. Renting out e-scooters in Bern takes a city permit, and since 1 May 2024 only Voi has one: for five years, so until spring 2029, and for up to 300 scooters, which you can rent around the clock. PubliBike runs bikes and e-bikes here, not scooters.',
        'On 12 October 2026 the [map around Bern](map:ch:bern) showed about 280 scooters, all Voi. To ride one:',
        {
          steps: [
            'Find the nearest scooter on the [live map of Bern](map:ch:bern).',
            'Tap it to open the Voi app, sign up and add a card. The first time, the app takes you through Bern’s riding and parking rules.',
            'Scan the QR code to unlock, then ride on the bike lane or the road.',
            'End the ride where the app allows it, and take the photo it asks for.',
          ],
        },
        'Voi’s online RideSafe Academy course earned riders 30 free minutes, the city government reported in 2025; the app shows whether it still does. Each step in detail: [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Bern?',
      blocks: [
        'Voi charges CHF 1.00 to unlock and CHF 0.42 a minute: the rate on its website and in its open data feed on 12 October 2026. Prices can vary with place, time and vehicle; the app shows the final one. Compared with Velo Region Bern’s rental bikes:',
        {
          table: {
            caption: 'Prices in Bern (Voi: published rate on 12 October 2026; PubliBike: publibike.ch, October 2026)',
            head: ['Option', 'Base fare', 'After that, per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Voi e-scooter', 'CHF 1.00 to unlock', 'CHF 0.42', 'CHF 5.20', 'CHF 9.40'],
              ['PubliBike e-bike, pay per ride', 'CHF 5.00 for the first 30 minutes', 'CHF 0.20', 'CHF 5.00', 'CHF 5.00'],
              ['PubliBike bike, pay per ride', 'CHF 3.00 for the first 30 minutes', 'CHF 0.10', 'CHF 3.00', 'CHF 3.00'],
              ['PubliBike e-bike with the CHF 69 annual pass', 'CHF 2.00 for 15 minutes, CHF 1.00 for the next 15', 'CHF 0.20', 'CHF 2.00', 'CHF 3.00'],
            ],
          },
        },
        'Five minutes on a Voi cost CHF 3.10, half an hour CHF 13.60. The average ride lasted about ten minutes when the city measured it in 2021, typically from the station to Breitenrain or Länggasse. Minute bundles and a 30-day Voi Pass valid across Switzerland are priced only in the app. In Basel and Biel, Voi charges CHF 0.39 a minute: see [e-scooter prices in Switzerland](guide:swiss-prices).',
      ],
    },
    {
      heading: 'Old Town, Köniz, Gurten: where you can’t ride in Bern',
      blocks: [
        'Voi and the city set the zones, and they change, with temporary ones for events, so the colours in the Voi app are what count.',
        {
          table: {
            caption: 'Voi’s zones in Bern (our analysis of its open data on 12 October 2026)',
            head: ['Zone', 'What applies', 'Where'],
            rows: [
              ['Old Town no-riding zone', 'No riding, not even through, and no parking', 'Spitalgasse, Marktgasse, the Zytglogge, Kramgasse, Gerechtigkeitsgasse, the Minster and the Münsterplattform'],
              ['Rest of the centre (district I, Innere Stadt)', 'Ride through, but end the ride only at a Voi parking spot', 'Bahnhofplatz, Bubenbergplatz, Bundesplatz, Bärenplatz, Waisenhausplatz, Kornhausplatz, Casinoplatz, the Rathaus, the Matte'],
              ['Köniz no-riding zone', 'No riding, no parking', 'Köniz, Liebefeld, Wabern, the Gurtenbahn valley station and Gurten Kulm'],
              ['No-parking zones', 'Ride through, but end the ride only at a Voi parking spot', 'Marzili, Viktoriaplatz, the Monbijoubrücke, Wankdorf stadium, the Dählhölzli zoo, Zentrum Paul Klee, Westside'],
              ['Outside the operating area', 'You can’t end a ride', 'Ostermundigen, Ittigen, Zollikofen, Bremgarten, Bern Airport (Belp)'],
              ['Slow zones', '5 or 10 km/h at most', 'Wankdorf stadium (5 km/h), a site of the Swiss blind association, SBV (10 km/h)'],
            ],
          },
        },
        'The Old Town has been a UNESCO World Heritage Site since 1983, and its arcades, the Lauben, are for walking: riding there is riding on a walkway, which is fined CHF 30 to 40. Yet in May 2026 city councillors complained about people racing down the arcades on scooters and bikes.',
        'In 2021 the city said scooters slowed from 20 to 5 km/h in no-riding zones; Voi’s data doesn’t say whether they slow down or stop today, so plan your route around the Old Town. The Gurten, Bern’s local mountain, lies in Köniz and is off-limits too: take the Gurtenbahn up.',
        { note: 'In the centre and the no-parking zones a ride ends only at a Voi parking spot, in a no-riding zone not at all, and until then the minutes keep counting. Find the nearest spot in the app before you arrive.' },
      ],
    },
    {
      heading: 'Where to park an e-scooter in Bern: station, Bundesplatz, Bärenplatz',
      blocks: [
        'The app shows Voi’s parking spots: we counted about 500 in and around Bern in Voi’s data, some 120 of them in the centre. The nearest to key places:',
        {
          table: {
            caption: 'Voi parking spots near landmarks (names as in Voi’s data, 12 October 2026)',
            head: ['Place', 'Nearby Voi parking spots'],
            rows: [
              ['Station (Bahnhofplatz)', '“Bahnhofplatz 2” (about 90 m), “Bahnhofplatz”, “Bollwerk”, “Velostation PostParc”, “Velostation Welle 7”, “Velostation Schanzenbrücke”'],
              ['Bundesplatz and the Federal Palace', '“Bundesgasse 6”, “Bundesgasse 8”, “Schauplatzgasse 1”, “Amthausgasse 28”'],
              ['Bärenplatz', '“Schauplatzgasse 1” (about 50 m)'],
              ['Waisenhausplatz', '“Nägeligasse 13”, “Predigergasse”, “Zeughausgasse 41”'],
              ['Zytglogge and Kornhausplatz', '“Kornhausplatz 19”, “Kornhausplatz”'],
              ['Casinoplatz', '“Casinoplatz”, “Münzgraben 2”, “Theaterplatz”'],
              ['Rathaus and the Matte', '“Rathausplatz 1”, “Rathausgasse 11”, “Schifflaube 16”, “Schifflaube”'],
              ['Marzili', '“Ländteweg 5”, “Marzilibahn”'],
            ],
          },
        },
        'Elsewhere, park as you would a bike: on the pavement only if 1.50 m stays free for pedestrians (or pay CHF 20), and never on tactile guide lines for blind people, across entrances or on a pedestrian crossing. Leave Velo Region Bern’s stations free.',
        'Bad parking costs you too: Voi’s Swiss terms let it charge CHF 25, after warnings. Report a scooter in the way at [report.voi.com](https://report.voi.com/de) or [trotti-melder.ch](https://trotti-melder.ch); Voi clears dangerously parked ones within 30 minutes on average, the city government reported in 2025.',
      ],
    },
    {
      heading: 'Getting around Bern by e-scooter: station, bridges, hills, airport',
      blocks: [
        {
          list: [
            '**The station:** SBB bans riding anywhere inside it. End your ride at a Voi spot outside and walk in.',
            '**Hills:** the climb from the Matte and the Marzili, down by the Aare, up to the Federal Palace and the Old Town is steep; the Marzilibahn funicular and the Münsterplattform lift are easier.',
            '**Bridges:** the Kirchenfeld, Kornhaus, Lorraine, Nydegg and Untertor bridges are outside every zone. On the Monbijoubrücke you may still use the bike lane on the pavement after the sign rules changed on 1 July 2025, but not park.',
            '**Tram rails:** cross them as close to a right angle as you can, and never ride along the groove.',
            '**Bärengraben:** the BärenPark and the Rosengarten are outside every zone, with a Voi spot called “Bärenpark” right next to them. Ride round the Old Town to get there, not through it.',
            '**Wankdorf:** around the stadium it’s 5 km/h and no parking, while Wankdorf station is outside the zones.',
            '**The airport:** Bern Airport in Belp is outside Voi’s area, so take the bus or train.',
          ],
        },
        'Staying overnight in the city of Bern? The free Bern-Ticket covers trams, buses and trains in Libero zones 100 and 101, the Gurten and Marzili funiculars and the Münsterplattform lift, and the trip to the airport on arrival and departure days. Your host gives you the code.',
      ],
    },
    {
      heading: 'PubliBike in Bern: Velo Region Bern as the alternative',
      blocks: [
        'Velo Region Bern, run by PubliBike, relaunched on 16 January 2026 with more than 300 stations in 17 municipalities, Köniz, Ostermundigen, Ittigen, Zollikofen and Belp among them, and about 70% e-bikes. The city calls it the densest bike-share network in Switzerland.',
        'Unlock with the PubliBike app or your SwissPass. Besides single rides and the B-Fit Local Bern annual pass for CHF 69, there’s a 24-hour day pass for CHF 29. From ten minutes on, an e-bike is cheaper than a Voi, even without a pass.',
        'ScootRadar doesn’t show these bikes: its map shows only PubliBike’s e-scooters, and PubliBike has none in Bern. Find free bikes and stations in the PubliBike app.',
      ],
    },
    {
      heading: 'The rules that get e-scooter riders fined',
      blocks: [
        {
          list: [
            '**18+** to rent from Voi. The law itself: 16 without a licence, 14 with a category M licence.',
            '**Bike lane or bike path** if there is one, otherwise the road. **Never the pavement**: CHF 40.',
            '**Pedestrian zones** only where an extra plate allows bikes, otherwise CHF 30.',
            '**Lights on**, by day too. Riding without them costs CHF 20 in daylight, and at night CHF 40 on a lit street or CHF 60 on an unlit one.',
            '**Red light**: CHF 60. **Phone in hand**: CHF 40.',
            '**One rider** per scooter. **Helmet** recommended, not compulsory.',
            '**0.5‰** alcohol limit: at or above it you face criminal proceedings, not an on-the-spot fine.',
          ],
        },
        'Accidents with e-scooters and e-mopeds show a clear upward trend in the canton, its government said in February 2026. Fines and age limits in full: [e-scooter rules in Switzerland](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Did you know? Three facts about Bern’s e-scooters',
      blocks: [
        {
          list: [
            '**Sunk in the Aare:** the city’s 2020 permit conditions let it dispose of scooters the operator can’t retrieve, such as ones sunk in the Aare, and bill the operator.',
            '**No loud colours:** because the Old Town is World Heritage, the scooters are to avoid signal colours. In 2023 an applicant asked whether its green scooters counted as one; the city said it would check.',
            '**More rides, not more complaints:** Voi rides in Bern rose from 116,380 in 2023 to 200,762 in 2024, yet reports of badly parked scooters stayed level, at 76 in 2024.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Are there Lime or Bolt scooters in Bern?',
      answer: 'No. Since 1 May 2024 Voi has held Bern’s only e-scooter permit, after the city government decided in 2023 to license one operator instead of two and Voi beat two other applicants. Lime and Bolt both run in Zürich, for example.',
    },
    {
      question: 'Do I need a driving licence to rent a Voi scooter in Bern?',
      answer: 'No. Voi requires you to be at least 18, and Swiss law asks for no licence from 16. Visitors sign up and pay by card like anyone else, but if the police fine you and you don’t live in Switzerland, you pay on the spot or leave a deposit.',
    },
    {
      question: 'Can I ride an e-scooter to Ostermundigen, Köniz or the airport?',
      answer: 'Not with Voi. In Voi’s data on 12 October 2026, Köniz, Wabern and the Gurten were a no-riding zone, and rides couldn’t end in Ostermundigen, Ittigen, Zollikofen, Bremgarten or at the airport; the Voi app has the current zones. Take the bus, the train or a Velo Region Bern bike.',
    },
    {
      question: 'Can I use my SwissPass for PubliBike in Bern?',
      answer: 'Yes. Velo Region Bern’s bikes and e-bikes unlock with a SwissPass at no extra cost, and you pay PubliBike’s fares: without a pass, CHF 5.00 for the first 30 minutes on an e-bike.',
    },
    {
      question: 'How many e-scooters are there in Bern?',
      answer: 'At most 300, the cap in Voi’s permit; on 12 October 2026 the map around Bern showed about 280. Bern started in 2021 with up to 250, 125 each from Voi and Tier.',
    },
  ],
  sources: [
    { title: 'City of Bern: city government report on e-scooters as obstacles, 23 April 2025 (in German)', url: 'https://ris.bern.ch/de/dokumente/67b2469b3610416eb307755ff94c94ce-332' },
    { title: 'City of Bern: e-scooter rental permit conditions, 2020 (PDF, in German)', url: 'https://www.bern.ch/mediencenter/medienmitteilungen/aktuell_ptk/gemeinderat-will-e-trottinett-verleih-geordnet-zulassen/dokuemente/allgemeine-bestimmungen-zu-e-trottinett.pdf/download' },
    { title: 'City of Bern: e-scooter rental information sheet, May 2021 (PDF, in German)', url: 'https://www.bern.ch/velohauptstadt/partizipation/resultate/velo-offensive-dienstleistungs-foerdermassnahmen/20210707_InfoblattETrottinettVerleihsysteme.pdf' },
    { title: 'Voi: e-scooters in Bern, prices and minimum age', url: 'https://www.voi.com/city/bern' },
    { title: 'Voi: terms of use for Switzerland (in German)', url: 'https://www.voi.com/de/rechtliche-hinweise/nutzungsbestimmungen/schweiz' },
    { title: 'sharedmobility.ch (Federal Office of Energy): Voi’s open data on prices, zones and parking spots', url: 'https://sharedmobility.ch/v2/gbfs/voiscooters.com/gbfs' },
    { title: 'City of Bern: launch of Velo Region Bern (in German)', url: 'https://www.bern.ch/mediencenter/medienmitteilungen/aktuell_ptk/betriebsstart-des-dichtesten-leihvelo-netzes-der-schweiz' },
    { title: 'PubliBike: prices and passes (in German)', url: 'https://www.publibike.ch/de/abos' },
    { title: 'Bern Welcome: Bern-Ticket for overnight guests', url: 'https://bern.com/en/inform/bern-ticket/bern-ticket-for-overnight-guests' },
    { title: 'Fixed Penalties Ordinance (OBV), list of fines (in German)', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
