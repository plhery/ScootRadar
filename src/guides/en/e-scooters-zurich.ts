import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-zurich',
  topic: 'zurich',
  name: 'Renting an e-scooter in Zürich',
  title: 'E-scooter Zürich 2026: prices, no-go zones and parking',
  description: 'Rent an e-scooter in Zürich: which apps work, what ten minutes cost, where you can’t ride or end a ride, where to park, and how to handle tram rails.',
  headline: 'E-scooters in Zürich: operators, prices, no-go zones and parking',
  lede: 'To rent an e-scooter in Zürich, open the app of Lime, Bolt, Bird, Voi, Dott, Hopp or PubliBike, scan a scooter and ride on the bike lane at up to 20 km/h. Ten minutes cost CHF 3.00 with PubliBike (CHF 1.00 plus CHF 0.20 a minute, October 2026) and CHF 5.20 with Bolt or Voi (CHF 1.00 plus CHF 0.42, published rates on 12 October 2026). You can’t end a ride in the Old Town or on the station forecourt, so park in a parking zone shown in the app or outside the no-parking area.',
  published: '2026-10-12',
  updated: '2026-10-13',
  city: 'ch:zurich',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Zürich?',
      blocks: [
        'ScootRadar shows e-scooters from seven brands in Zürich: Bird, Bolt, Dott, Hopp, Lime, Voi and PubliBike. The city publishes no list of operators; in March 2025 it counted seven with permits, for e-scooters, e-bikes and e-mopeds together. Worth knowing about four of them:',
        {
          list: [
            '**Lime**: in Zürich you can also rent one through the Uber app.',
            '**Dott** merged with Tier in 2024; Tier riders now use the Dott app.',
            '**Hopp** (Iceland, run through local franchises): its Swiss terms aren’t on its website, so check the age limit and insurance in its app.',
            '**PubliBike**, the Swiss firm behind Züri Velo: e-scooters since 26 February 2026, with a permit for up to 400. They can’t be left at Züri Velo stations.',
          ],
        },
        'On 12 October 2026 the [map around Zürich](map:ch:zurich) showed about 5,200 vehicles from these seven brands, suburbs included. Renting one takes four steps:',
        {
          steps: [
            'Find the nearest scooter of any brand on the [live map of Zürich](map:ch:zurich).',
            'Tap it to open the operator’s app, sign up and add a card. Lime, Bolt, Bird, Voi, Dott and PubliBike all require you to be 18 under their Swiss terms.',
            'Scan the QR code to unlock, then ride on the bike lane or the road.',
            'End the ride where the app allows it, and take the photo it asks for.',
          ],
        },
      ],
    },
    {
      heading: 'What does an e-scooter cost in Zürich?',
      blocks: [
        'You pay an unlock fee plus a price per minute. Bolt, Hopp, Voi, Dott and Lime publish their rates in open data feeds; the table shows them as they stood on 12 October 2026 (Dott’s and Lime’s on 13 October), with PubliBike’s rate from its own price page. Rates can vary by zone and time, and the app shows the final price before you ride.',
        {
          table: {
            caption: 'Published e-scooter rates in Zürich (feeds on 12 and 13 October 2026; PubliBike: publibike.ch, October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes'],
            rows: [
              ['PubliBike (publibike.ch, October 2026)', 'CHF 1.00', 'CHF 0.20', 'CHF 3.00'],
              ['Hopp', 'CHF 1.00', 'CHF 0.40', 'CHF 5.00'],
              ['Dott', 'CHF 0.95', 'CHF 0.41', 'CHF 5.05'],
              ['Bolt', 'CHF 1.00', 'CHF 0.42 (a few at CHF 0.48)', 'CHF 5.20'],
              ['Voi', 'CHF 1.00', 'CHF 0.42 (some at CHF 0.39)', 'CHF 5.20'],
              ['Lime', 'CHF 1.00', 'CHF 0.49 (some at CHF 0.42)', 'CHF 5.90'],
              ['Bird', 'Not published', 'Not published', 'Rate shown in its app'],
            ],
          },
        },
        'Bird publishes no rates, so check its price in the app before you unlock. Lime’s feed marks its rates as excluding tax, so the map gives no estimate for Lime; its app shows the final price. PubliBike’s CHF 69 yearly subscription doesn’t lower its e-scooter rate. The average Zürich rental ride is about 1.5 km and 10 minutes long, says the city’s head of traffic safety. To compare with other Swiss cities, see [e-scooter prices in Switzerland](guide:swiss-prices).',
      ],
    },
    {
      heading: 'How Zürich’s permit system and caps work',
      blocks: [
        'Since 1 April 2019, anyone renting out more than 30 two-wheelers in Zürich without fixed stations needs a city permit. One permit covers up to 800 vehicles of one type, at CHF 10 per vehicle a month, plus a CHF 50 deposit per vehicle and a CHF 1,500 yearly control fee.',
        'Operators must remove a badly parked scooter within 24 hours, or at once if it blocks the way, and share their usage data with the city. There is no cap on the number of operators yet: anyone who meets the conditions gets a permit. On 26 August 2026 the city put the number of shared vehicles on its streets at 7,350, e-bikes and e-mopeds included.',
      ],
    },
    {
      heading: 'Zürich’s plan: three operators and 3,000 vehicles',
      blocks: [
        'On 26 August 2026 the city government told the city parliament that it wants three operators and 3,000 shared vehicles in total, chosen by public tender. In the centre, at the main station and at other busy places you would then park only at fixed, marked stations; elsewhere free-floating would stay. New rules and the tender still have to come first.',
        'No official date exists yet. Councillors spoke of a tender in autumn 2026 and a restart in spring 2027; until the new system starts, today’s rules and zones apply. The city has cited Winterthur as a model: according to SRF, Voi has been the only operator there since early 2026.',
      ],
    },
    {
      heading: 'No-go zones: where you can’t ride or park in Zürich',
      blocks: [
        'The city defines three kinds of GPS zones, publishes them as open data and makes every operator show them in its app. The scooter enforces them itself.',
        {
          table: {
            caption: 'Zürich’s sharing zones',
            head: ['Zone', 'What happens', 'Examples'],
            rows: [
              ['No-riding zone', 'The scooter slows to walking pace; you can’t end the ride', 'Old Town on both banks of the Limmat, most of Bahnhofstrasse between the station and Paradeplatz, Platzspitz, the Arboretum'],
              ['No-parking zone', 'You can ride through but can’t end the ride', 'Bahnhofplatz, Europaplatz, Sechseläutenplatz, Stadelhofen, Oerlikon, Polyterrasse at ETH'],
              ['Parking zone', 'Where you end the ride, often rewarded with credit or free minutes', 'Sechseläutenplatz (at its edge), Bürkliplatz, Löwenplatz, Stadelhofen, Enge, three spots around the main station'],
            ],
          },
        },
        'On the lake, the Arboretum on General-Guisan-Quai and the Stadthausanlage by Bürkliplatz are no-riding zones; on the other quays, stay off footpaths and use the bike lane or the road. Almost all school grounds and cemeteries are closed to riding and parking, and events such as Street Parade and Sechseläuten get temporary zones, shown in the apps beforehand. Pedestrian zones are off limits unless an extra sign allows bikes, and in SBB stations you push.',
        { note: 'In a no-riding or no-parking zone the app won’t let you end the ride, and the minutes keep counting until you reach a place where it will. On Sechseläutenplatz, for example, you can only park in the parking zones at the edge of the square.' },
      ],
    },
    {
      heading: 'Where to park your e-scooter in Zürich',
      blocks: [
        'Parking zones exist only in the apps; nothing is marked on the street. In busy places, look them up before you arrive.',
        'At the main station, Bahnhofplatz and Europaplatz are no-parking zones. Use one of the three parking zones nearby instead: on Bahnhofquai by the Limmat, near Kasernenstrasse, or on the north-west side near Sihlquai.',
        'Everywhere else, park like a bike:',
        {
          list: [
            'on the pavement only with 1.5 m left free for pedestrians, or pay a CHF 20 fine;',
            'never on the tactile guidance lines for blind people;',
            'outside bike parking, no more than two shared vehicles together, at least 50 m from the next pair.',
          ],
        },
        'Bad parking costs you too: Voi may charge CHF 25 after warnings, PubliBike CHF 30 the first time and CHF 50 after that, and Bolt up to CHF 100 to collect a scooter left outside its area. Report a scooter in the way at [trotti-melder.ch](https://trotti-melder.ch) or through the city’s Züri wie neu app.',
      ],
    },
    {
      heading: 'Tram rails, hills and other hazards in Zürich',
      blocks: [
        'The city’s own accident analysis is blunt: its streets are not forgiving enough for e-scooters, as numerous falls on kerbs and tram rails show, and small wheels and a high centre of gravity make the scooters tip over easily.',
        'Our advice, with 15 tram lines in town: cross rails as close to a right angle as you can, and never ride along the groove.',
        'Zürich is steeper than it looks from the lake: the Rigiblick funicular climbs to the Zürichberg at an average gradient of more than 25%, according to the ZVV. A rental scooter’s motor gives at most 0.5 kW and helps only up to 20 km/h, so expect to slow down uphill and brake early on the way down.',
        'Police recorded 130 e-scooter accidents in the city in 2025, up from 101 the year before, and about 60% were falls with no one else involved. The city found that such falls usually involve alcohol, and that riding drunk is common on weekend nights.',
      ],
    },
    {
      heading: 'The rules in 60 seconds',
      blocks: [
        {
          list: [
            '**18+** with every operator whose Swiss terms we checked. The law itself: 16 without a licence, 14 with a category M licence.',
            '**Bike lane or path** if there is one, otherwise the road. **Never the pavement**: CHF 40.',
            '**One rider**, no passengers.',
            '**Lights on**, by day too: CHF 20 without them in daylight.',
            '**Helmet** recommended, not compulsory.',
            '**0.5‰** alcohol limit, also for new drivers on probation.',
            '**Phone in hand**: CHF 40. **Red light**: CHF 60.',
          ],
        },
        'Fines, ages and the 2025 changes are all in [the e-scooter rules for Switzerland](guide:swiss-rules).',
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent e-scooters in Zürich?',
      answer: 'Yes, from 18. None of the Swiss operator terms we read asks for Swiss residence: you sign up in the app and pay by card. Without a Swiss residence, though, you must pay a police fine on the spot or leave a deposit.',
    },
    {
      question: 'Am I insured on a rental e-scooter?',
      answer: 'Lime, Bolt, Voi and Dott include third-party liability insurance in the price, but it only pays after your own private liability insurance. Bird’s terms say its scooters carry liability insurance but name no amounts. PubliBike includes none: under its terms, insurance is the rider’s business. Passengers are never covered.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Zürich?',
      answer: 'No, Swiss law doesn’t require one, but the BFU, the Swiss accident prevention body, strongly recommends it, and Dott warns that head injuries may not be covered without one. In August 2026 the Federal Council said it was ready to put an e-scooter helmet requirement up for consultation at its next revision of the rules; there is no draft or date yet.',
    },
    {
      question: 'How many e-scooters are there in Zürich?',
      answer: 'About 5,000 rental e-scooters, the city’s head of traffic safety said in September 2026. With e-bikes and e-mopeds, the city counted 7,350 shared vehicles in August 2026, and it plans to cut that to 3,000 shared vehicles in total.',
    },
    {
      question: 'Can I take a rental e-scooter on the tram or train?',
      answer: 'Not in practice: a ride has to end inside the operator’s area, and Voi caps a rental at one hour. End the ride by the station, in a parking zone or outside its no-parking zone, and rent another at the other end.',
    },
  ],
  sources: [
    { title: 'City of Zürich: permits for station-less vehicle rental', url: 'https://www.stadt-zuerich.ch/de/stadtleben/veranstaltungen-und-bewilligungen/gewerbe-und-maerkte/andere-nutzungsarten/stationsloser-fahrzeugverleih.html' },
    { title: 'Zürich city council decision 168/2019: permits and fees for station-less rental (PDF, German)', url: 'https://www.stadt-zuerich.ch/dam/web/de/politik-verwaltung/politik-recht/stadtratsbeschluesse/2019/Mrz/StZH_STRB_2019_0168.pdf' },
    { title: 'Zürich city council report GR 2025/210 on regulating shared micromobility (German)', url: 'https://www.gemeinderat-zuerich.ch/dokumente/9c8a7ffaed6e4f3ca6234611a78f2946-332' },
    { title: 'Zürich city parliament: minutes of 26 August 2026 (German)', url: 'https://www.gemeinderat-zuerich.ch/dokumente/d2565cda09634f2fbdfc8e781ba347a4-332' },
    { title: 'City of Zürich open data: sharing zones for no riding, no parking and parking', url: 'https://www.stadt-zuerich.ch/geodaten/download/Sharing_Zonen' },
    { title: 'City of Zürich: rules for e-scooters and other electric vehicles', url: 'https://www.stadt-zuerich.ch/de/mobilitaet/verkehrssicherheit/sicher-auf-dem-velo/elektro-trendfahrzeuge.html' },
    { title: 'Zürich city council decision 1828/2026 on PubliBike e-scooters (PDF, German)', url: 'https://www.stadt-zuerich.ch/content/dam/web/de/politik-verwaltung/politik-recht/stadtratsbeschluesse/2026/05/stzh-strb-2026-1828.pdf' },
    { title: 'PubliBike: prices and subscriptions (German)', url: 'https://www.publibike.ch/de/abos' },
    { title: 'City of Zürich, Street Smart campaign: e-scooter accidents', url: 'https://www.stadt-zuerich.ch/artikel/de/kampagne/street-smart/e-trottinett.html' },
    { title: 'TCS Zürich: interview with the city’s head of traffic safety, September 2026 (German)', url: 'https://www.tcs.ch/de/der-tcs/sektionen/zuerich/news/verkehrssicherheit-10-26.php' },
    { title: 'Swiss Ordinance on Fixed Penalties, list of fines (German)', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
