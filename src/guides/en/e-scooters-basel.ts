import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-basel',
  topic: 'basel',
  name: 'Renting an e-scooter in Basel',
  title: 'E-scooter Basel 2026: prices, no-go zones, Rhine parking',
  description: 'Rent an e-scooter in Basel: the six apps, what ten minutes cost, where the old town stops your scooter, why you can’t park on the Rhine, and the border rules.',
  headline: 'E-scooters in Basel: six apps, prices, no-go zones and parking by the Rhine',
  lede: 'To rent an e-scooter in Basel, open the app of Lime, Voi, Dott, Bird, Bolt or Hopp, scan the QR code and ride on the bike lane at up to 20 km/h. Ten minutes cost CHF 4.85 to CHF 5.60: about CHF 1 to unlock plus CHF 0.39 to CHF 0.46 a minute (published rates on 12 October 2026). In the old town the scooter brakes to a halt, you can’t end a ride on the Rhine bridges, and rental scooters can’t cross into Germany or France or reach EuroAirport.',
  published: '2026-10-12',
  updated: '2026-10-12',
  city: 'ch:basel',
  sections: [
    {
      heading: 'Which e-scooter apps work in Basel?',
      blocks: [
        'Six brands rent out e-scooters in Basel: Lime, Voi, Dott (formerly Tier), Bird, Bolt and Hopp, which arrived on 17 March 2026. ScootRadar shows five of them. **Hopp is not on our map**, so open the Hopp app for its scooters, and check its age limit and insurance there: we found no Swiss terms for it.',
        'Basel issues no permits and charges no fees. Instead, since October 2025 every operator must follow the canton’s usage rules: at most **200 scooters or bikes per operator** on public ground in the city (a monthly average), and a photo of the parked scooter at the end of every ride. An operator that keeps breaking them risks a ban on its whole fleet.',
        'On the morning of 12 October 2026 the [map around Basel](map:ch:basel) showed about 1,300 vehicles from the five brands, suburbs included. Renting one takes three steps:',
        {
          steps: [
            'Find the nearest scooter on the [live map of Basel](map:ch:basel) and tap through to its operator’s app.',
            'Sign up and add a credit or debit card. Lime, Voi, Dott, Bird and Bolt require you to be 18 under their Swiss terms.',
            'Scan the QR code and ride. To finish, park where the app allows it and take the photo. Each step in detail: [how to rent an e-scooter](guide:how-to-rent).',
          ],
        },
      ],
    },
    {
      heading: 'What does an e-scooter cost in Basel?',
      blocks: [
        'You pay to unlock, then by the minute. Five of the six brands publish their Basel rates in open data feeds; here they are as of 12 October 2026. Rates can vary by zone and time (Bolt says so itself), and the app shows the final price before you unlock.',
        {
          table: {
            caption: 'Published e-scooter rates in Basel (operators’ data feeds, 12 October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Dott', 'CHF 0.95', 'CHF 0.39', 'CHF 4.85', 'CHF 8.75'],
              ['Voi', 'CHF 1.00', 'CHF 0.39', 'CHF 4.90', 'CHF 8.80'],
              ['Bolt', 'CHF 1.00', 'CHF 0.45', 'CHF 5.50', 'CHF 10.00'],
              ['Hopp', 'CHF 1.00', 'CHF 0.45', 'CHF 5.50', 'CHF 10.00'],
              ['Lime', 'CHF 1.00', 'CHF 0.46', 'CHF 5.60', 'CHF 10.20'],
              ['Bird', 'Not published', 'Not published', 'Price in the app', 'Price in the app'],
            ],
          },
        },
        'Dott and Voi were the cheapest that day and Lime the most expensive, CHF 1.45 apart after 20 minutes. Bolt sells weekly and monthly passes (for the others, check their apps) and says it asks for a short reaction test before you unlock at peak hours. To compare Basel with other Swiss cities, see [e-scooter prices in Switzerland](guide:swiss-prices).',
      ],
    },
    {
      heading: 'No-go zones: where your e-scooter stops in Basel',
      blocks: [
        'The canton draws the zones and every operator must build them into its app. In a **no-go zone** the scooter slows to 0 km/h, and rides again once you push it out. In a **no-parking zone** you may ride through, but you can’t end the ride.',
        {
          table: {
            caption: 'E-scooter zones in Basel, October 2026',
            head: ['Zone', 'What happens', 'Where, for example'],
            rows: [
              ['No-go zone, old town and centre', 'No riding, no parking: the scooter brakes to a halt', 'Marktplatz, Freie Strasse and part of Barfüsserplatz, Gerbergasse and Spalenberg, Münsterplatz, Rheinsprung, Schifflände, Steinenvorstadt, Petersplatz, Centralbahnplatz outside Basel SBB'],
              ['No-go zone, parks and sports grounds', 'The same', 'Kannenfeldpark, Schützenmattpark, Bäumlihof, Eglisee, Bachgraben, the St. Jakob sports grounds'],
              ['No-parking zone', 'Ride through, but you can’t end the ride', 'The Rhine and its bridges from Dreirosenbrücke to Schwarzwaldbrücke, Bahnhof Süd, the Solitude park by the Museum Tinguely, Elisabethenanlage, St. Johanns-Park, Lange Erlen'],
              ['Pedestrian zone', 'Push only, or pay a CHF 30 fine', '48 street sections, such as Freie Strasse, Gerbergasse, Streitgasse and Spalenberg'],
            ],
          },
        },
        'So for the Münster or Marktplatz, end the ride first and walk the last few minutes. Operators may add zones of their own (Bolt also blocks Kohlenberggasse); the map in the app is what counts.',
        { note: 'In a no-go or no-parking zone the app won’t let you end the ride, and the minutes keep running. Decide where you’ll stop before you set off: outside the old-town zones and away from the Rhine.' },
      ],
    },
    {
      heading: 'Where to park: the Rhine, Basel SBB and the pavement',
      blocks: [
        '**By the Rhine:** from Dreirosenbrücke to Schwarzwaldbrücke the river and its bridges are one no-parking zone, the whole Mittlere Brücke included. Ride across on the road or the bike lane, but end the ride away from the bridges and the water; the app shows where the zone stops. The reason: in 2021 the canton told parliament that on average one e-scooter a week was pulled out of the water.',
        '**At Basel SBB:** Centralbahnplatz is a no-go and no-parking zone, Bahnhof Süd a no-parking zone. The canton has marked two small sharing zones at the station instead (the app shows where). Inside the station you push: SBB bans riding on its premises.',
        'Everywhere else, park like a bike and by the canton’s rules:',
        {
          list: [
            'on the pavement only with 1.50 m left free for pedestrians, or pay a CHF 20 fine;',
            'no more than two shared vehicles per spot, meaning within 50 m;',
            'never in a passage or in the way of traffic: such scooters are towed without warning, “as with private vehicles”.',
          ],
        },
        'Bad parking costs you too. The police trace the rider through the operator, and the fine reaches you, often with a handling fee: up to CHF 30 at Bolt, EUR 50 at Dott. Operators also charge their own fees, from CHF 25 at Voi to up to CHF 125 for collection plus CHF 125 for handling at Lime. Report a scooter in the way at [trotti-melder.ch](https://trotti-melder.ch) or on the operator’s hotline, open daily from 7 a.m. to 7 p.m.',
      ],
    },
    {
      heading: 'Germany, France, EuroAirport and tram rails: tips for Basel',
      blocks: [
        '**No crossing the border.** Every operator’s area ends at the border, where Bolt’s scooters brake to a halt, so you can’t ride to Weil am Rhein, Huningue or Saint-Louis: end the ride on the Swiss side. Don’t commute across on your own scooter either: since 1 April 2026 Germany allows foreign e-scooters only with an equivalent EU or EEA approval and insurance, and France requires liability insurance.',
        '**No ride to EuroAirport.** The airport is binational, with a Swiss and a French sector, and no operator in Basel covers it. Take public transport.',
        '**Tram rails.** The canton’s cycling map marks 74 danger spots, among them the junctions at Aeschenplatz, Heuwaage and Wettsteinplatz and the tram stops built out into the road at Bankverein, Kirschgarten and Rheingasse, where you share the tram’s track. Cross rails as close to a right angle as you can, never ride along the groove, and take care when they’re wet.',
        '**Hills.** Spalenberg, Münsterberg and Rheinsprung, the steep old-town lanes, are pedestrian or no-go zones anyway.',
      ],
    },
    {
      heading: 'Herbstmesse, Fasnacht, Art Basel: e-scooters at big events',
      blocks: [
        'For events with road closures, such as Fasnacht, Em Bebbi sy Jazz and the Basel Tattoo parade, the canton sets temporary zones where you can’t park a rental scooter. At Fasnacht 2023, the first with such zones, scooters in the centre were even braked to a halt, and Voi added a reaction test against drunk riding. The app shows which zones apply.',
        {
          table: {
            caption: 'Basel’s next big events',
            head: ['Event', 'Dates', 'What it means for scooters'],
            rows: [
              ['Herbstmesse (autumn fair)', '24 October to 8 November 2026; on Petersplatz until 10 November', 'Petersplatz is a no-go zone all year; the app shows any extra zones'],
              ['Fasnacht', 'Morgestraich at 4 a.m. on Monday 15 February 2027', 'Temporary zones in the centre: no parking there, and possibly no riding'],
              ['Art Basel', '17 to 20 June 2027', 'Messeplatz has no permanent zone; temporary zones are possible, so check the app'],
            ],
          },
        },
      ],
    },
    {
      heading: 'E-scooter rules in Basel, in 60 seconds',
      blocks: [
        {
          list: [
            '**18+** at Lime, Voi, Dott, Bird and Bolt; check Hopp in its app. By law: 16 without a licence, 14 with a category M licence.',
            '**Bike lane or path** if there is one, otherwise the road. **Never the pavement**: CHF 40.',
            '**One rider**, no passengers.',
            '**Lights on**, by day too: CHF 20 without them in daylight.',
            '**Helmet** recommended, not compulsory.',
            '**0.5‰** alcohol limit, also for new drivers on probation, and at Fasnacht.',
            '**Phone in hand**: CHF 40. **Red light**: CHF 60.',
          ],
        },
        'If you don’t live in Switzerland, you pay a fine on the spot or leave a deposit. All fines and age limits are in [the e-scooter rules for Switzerland](guide:swiss-rules).',
      ],
    },
    {
      heading: 'Velospot and other alternatives to e-scooters',
      blocks: [
        {
          list: [
            '**Velospot**, run by PubliBike for the canton, rents bikes and e-bikes all year. The code RIDEBASEL gets you a free monthly pass for 30 days in the Basel-Hochrhein network: the first 30 minutes of each bike ride are free, and an e-bike costs CHF 2 for the first 15 minutes and CHF 1 for the next 15 (October 2026).',
            '**Pick-e-Bike** rents e-bikes and seated e-scooters that are closer to e-mopeds; its app tells you which licence you need.',
            '**Carvelo** rents cargo bikes.',
          ],
        },
        'PubliBike runs no e-scooters in Basel.',
      ],
    },
    {
      heading: 'Did you know? Three Basel scooter stories',
      blocks: [
        {
          list: [
            'Lime arrived in Basel in October 2018 with about 50 scooters. Three months later it pulled its Swiss fleets, 250 scooters in Basel, to fix a software fault that switched off the display and engaged the front brake at speed.',
            'On 14 October 2021 the canton counted 1,008 e-scooters from six firms, against a theoretical maximum of 1,200. Asked whether it knew why one operator had left Basel, the government answered in full: “Nein” (no).',
            'Basel’s four Rhine ferries, Wild Maa, Leu, Vogel Gryff and Ueli, have no engine: they hang on a steel cable and the current pushes them across. A bike rides along for CHF 0.80. No source we found says whether a scooter may board, so end your ride on the street and walk on.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent an e-scooter in Basel?',
      answer: 'Yes, from 18. None of the Swiss operator terms we read asks for Swiss residence: you sign up in the app and pay by card. If you don’t live in Switzerland, though, you pay any police fine on the spot or leave a deposit.',
    },
    {
      question: 'Can I take a rental e-scooter to EuroAirport Basel-Mulhouse?',
      answer: 'No. The airport lies outside every operator’s area, and rental scooters don’t cross into France. End your ride in Basel and take public transport.',
    },
    {
      question: 'Can I ride an e-scooter during Fasnacht or Art Basel?',
      answer: 'Yes, but parts of the centre may be closed to scooters. At Fasnacht you can’t park there, and in 2023 scooters were also braked to a halt. For Art Basel, from 17 to 20 June 2027, temporary zones are possible. The app shows what applies on the day.',
    },
    {
      question: 'Am I insured on a rental e-scooter?',
      answer: 'Lime, Bolt and Voi include third-party liability insurance in the price, but it pays only after your own private liability insurance. Dott’s last published cover paid only beyond your other insurance. Bird names no amounts, and we found no Swiss terms for Hopp. Passengers are never covered.',
    },
  ],
  sources: [
    { title: 'Canton of Basel-Stadt: usage rules for shared micromobility (1 September 2025, PDF, German)', url: 'https://media.bs.ch/original_file/b735d5668e92ceb7f855291962d54dbcb3f62b7f/2025-09-01-nutzungsordnung-bewilligungsfreie-sharingangebote.pdf' },
    { title: 'Canton of Basel-Stadt: shared mobility, with the zone map (German)', url: 'https://www.bs.ch/bvd/mobilitaet/shared-mobility' },
    { title: 'Canton of Basel-Stadt: rental vehicles in Basel (German)', url: 'https://www.bs.ch/themen/mobilitaet/fahren-und-parkieren/oev-und-leihfahrzeuge/leihfahrzeug-finden' },
    { title: 'Grand Council report 22.5513.02 on badly parked e-scooters (2024, PDF, German)', url: 'https://grosserrat.bs.ch/dokumente/100408/000000408531.pdf' },
    { title: 'Government answer 21.5664.02 on e-scooters (2021, PDF, German)', url: 'https://grosserrat.bs.ch/dokumente/100395/000000395878.pdf' },
    { title: 'Basel-Stadt open data: cycling map danger spots', url: 'https://data.bs.ch/explore/dataset/100404/' },
    { title: 'Herbstmesse Basel: 2026 dates', url: 'https://www.herbstmesse.ch/' },
    { title: 'Art Basel: 2027 dates', url: 'https://www.artbasel.com/basel' },
    { title: 'PubliBike: Velospot in Basel (German)', url: 'https://www.publibike.ch/de/basel' },
    { title: 'Swiss Ordinance on Fixed Penalties, list of fines (German)', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
