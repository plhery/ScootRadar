import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooter-prices-switzerland',
  topic: 'swiss-prices',
  name: 'E-scooter prices in Switzerland',
  title: 'E-scooter prices in Switzerland 2026: what a ride costs',
  description: 'E-scooter prices in Switzerland: unlock fees and per-minute rates by operator and city, what 5, 10 and 20 minutes cost, passes and the fees that surprise you.',
  headline: 'E-scooter prices in Switzerland: what a shared e-scooter costs, city by city',
  lede: 'E-scooter prices in Switzerland are almost always an unlock fee plus a rate per minute: CHF 1.00 to unlock, then CHF 0.39 to CHF 0.48 a minute at the rates Bolt, Hopp and Voi published on 12 October 2026. Ten minutes therefore cost CHF 4.90 to CHF 5.80. PubliBike is cheaper in Zürich and Biel, at CHF 1 plus CHF 0.20 a minute on its price page (October 2026). Dott charges CHF 0.95 to CHF 1.50 to unlock, depending on the town, Bird publishes no rates, and every operator’s app shows the final price before you unlock.',
  published: '2026-10-12',
  updated: '2026-10-15',
  sections: [
    {
      heading: 'How much does an e-scooter cost in Switzerland?',
      blocks: [
        'Almost every shared e-scooter in Switzerland is priced the same way: a fee to unlock it, then a rate for each minute it stays unlocked, whether you’re riding, waiting at a red light or looking for a place to park.',
        'Rates aren’t national. The same operator charges one rate in Basel and another in Bern, and Lime and Voi both say their prices can also change with the time of day. Lime rounds each ride up to the next full minute and keeps charging until the app confirms the ride has ended, not when you step off.',
      ],
    },
    {
      heading: 'E-scooter prices by operator and city',
      blocks: [
        'Bolt, Hopp, Voi and Zeus publish their rates in the open data feeds the map reads. On the morning of 12 October 2026 they showed these. Lime’s and Dott’s Basel rates come from their own data feeds (read that evening), Dott’s other Swiss rates from the open data on 13 October, Lime’s from the open data on 15 October, and PubliBike’s rate from its own price page. On 15 October the open data still showed the other rates below:',
        {
          table: {
            caption: 'Published rates on 12 October 2026 (Dott outside Basel: 13 October; Lime outside Basel: 15 October): unlock fee and price per minute',
            head: ['Area', 'Operator', 'Unlock', 'Per minute'],
            rows: [
              ['Zürich area', 'Voi', 'CHF 1.00', 'CHF 0.42 (a few at CHF 0.39)'],
              ['Zürich area', 'Bolt', 'CHF 1.00', 'CHF 0.42 (a few at CHF 0.48)'],
              ['Zürich area', 'Hopp', 'CHF 1.00', 'CHF 0.40 (Kloten: CHF 0.42)'],
              ['Zürich area', 'Dott', 'CHF 0.95', 'CHF 0.41'],
              ['Zürich area', 'Lime', 'CHF 1.00', 'CHF 0.40 to CHF 0.49, changing through the day (Uster: CHF 0.49)'],
              ['Winterthur and Frauenfeld', 'Voi', 'CHF 1.00', 'CHF 0.42'],
              ['Bern', 'Voi', 'CHF 1.00', 'CHF 0.42'],
              ['Basel', 'Voi', 'CHF 1.00', 'CHF 0.39'],
              ['Basel', 'Bolt', 'CHF 1.00', 'CHF 0.45'],
              ['Basel', 'Hopp', 'CHF 1.00', 'CHF 0.45'],
              ['Basel', 'Lime (own data feed)', 'CHF 1.00', 'CHF 0.46'],
              ['Basel', 'Dott (own data feed)', 'CHF 0.95', 'CHF 0.39'],
              ['Basel', 'Bird', 'Not published', 'Shown in the app'],
              ['Biel/Bienne', 'Voi', 'CHF 1.00', 'CHF 0.39'],
              ['St. Gallen, Rorschach, Gossau, Flawil, Uzwil, Wil and Lichtensteig', 'Dott', 'CHF 1.20', 'CHF 0.45'],
              ['Romanshorn and Amriswil', 'Dott', 'CHF 1.50', 'CHF 0.45'],
              ['Wädenswil and Richterswil', 'Bolt', 'CHF 1.00', 'CHF 0.48'],
              ['Schaffhausen', 'Voi', 'None', 'CHF 0.39'],
              ['Singen (Germany), across the border from Schaffhausen', 'Zeus', 'EUR 1.00', 'EUR 0.25'],
              ['Zürich and Biel/Bienne', 'PubliBike (price page, October 2026)', 'CHF 1.00', 'CHF 0.20'],
              ['Zürich area and more', 'Bird', 'Not published', 'Shown in the app'],
            ],
          },
        },
        'So Voi charges CHF 0.39 a minute in Basel and Biel but CHF 0.42 in Bern, Bolt CHF 0.42, 0.45 or 0.48 depending on the area, and Dott’s unlock fee runs from CHF 0.95 in Basel and Zürich to CHF 1.50 in Romanshorn. Even within one area a few scooters carry another rate, and Lime’s change through the day: at 6:30 on 15 October every Lime scooter in Zürich charged CHF 0.42 a minute, at 8:20 a third charged CHF 0.49 and a quarter CHF 0.40. The price in the app is the one that counts.',
        'In Schaffhausen, Voi’s feed showed no unlock fee at all, which would make ten minutes CHF 3.90. The Zeus scooters the map shows near Schaffhausen stand across the border in Singen, Germany, and charge in euros.',
        'PubliBike’s standard tariff (B-Quick National) is CHF 1 plus CHF 0.20 a minute for its e-scooters in Zürich and Biel/Bienne, as of October 2026. In Ticino you can’t rent them on that tariff: you need PubliBike’s B-Fit Local subscription for Ticino (CHF 69 a year), and then every 15 minutes cost CHF 3.',
      ],
    },
    {
      heading: 'What a 5-, 10- and 20-minute ride costs',
      blocks: [
        'Add the unlock fee to the minutes times the rate: CHF 1 + 10 × 0.42 = CHF 5.20 for ten minutes on Voi in Bern. The table counts whole minutes and adds nothing for zones or other fees.',
        {
          table: {
            caption: 'What a ride costs at the rates published on 12 October 2026 (Dott outside Basel: 13 October; Lime outside Basel: 15 October; PubliBike: price page, October 2026)',
            head: ['Rate (where)', '5 minutes', '10 minutes', '20 minutes'],
            rows: [
              ['PubliBike, CHF 1 + 0.20 (Zürich, Biel)', 'CHF 2.00', 'CHF 3.00', 'CHF 5.00'],
              ['Dott, CHF 0.95 + 0.39 (Basel)', 'CHF 2.90', 'CHF 4.85', 'CHF 8.75'],
              ['Voi, CHF 1 + 0.39 (Basel, Biel)', 'CHF 2.95', 'CHF 4.90', 'CHF 8.80'],
              ['Hopp, CHF 1 + 0.40 (Zürich area)', 'CHF 3.00', 'CHF 5.00', 'CHF 9.00'],
              ['Dott, CHF 0.95 + 0.41 (Zürich)', 'CHF 3.00', 'CHF 5.05', 'CHF 9.15'],
              ['Voi or Bolt, CHF 1 + 0.42 (Zürich; Voi also in Winterthur, Frauenfeld and Bern)', 'CHF 3.10', 'CHF 5.20', 'CHF 9.40'],
              ['Bolt or Hopp, CHF 1 + 0.45 (Basel)', 'CHF 3.25', 'CHF 5.50', 'CHF 10.00'],
              ['Lime, CHF 1 + 0.46 (Basel)', 'CHF 3.30', 'CHF 5.60', 'CHF 10.20'],
              ['Dott, CHF 1.20 + 0.45 (St. Gallen, Rorschach, Wil and more)', 'CHF 3.45', 'CHF 5.70', 'CHF 10.20'],
              ['Bolt, CHF 1 + 0.48 (Wädenswil, Richterswil)', 'CHF 3.40', 'CHF 5.80', 'CHF 10.60'],
              ['Lime, CHF 1 + 0.49 (Uster; Zürich at times)', 'CHF 3.45', 'CHF 5.90', 'CHF 10.80'],
              ['Dott, CHF 1.50 + 0.45 (Romanshorn)', 'CHF 3.75', 'CHF 6.00', 'CHF 10.50'],
            ],
          },
        },
        'The average rental ride in Zürich lasts about 10 minutes, according to the city’s head of traffic safety. On short rides the unlock fee weighs most: it’s CHF 1 of the CHF 3.10 for five minutes on Voi in Bern. On long rides the rate decides: 20 minutes on Lime at CHF 0.49, its top rate around Zürich, cost CHF 2.00 more than on Voi in Basel.',
      ],
    },
    {
      heading: 'E-scooter passes and subscriptions in Switzerland',
      blocks: [
        'If you ride often, unlock fees add up first: two rides a day on 20 working days is CHF 40 a month in unlocks alone.',
        {
          list: [
            '**Lime:** LimePass minute bundles give free unlocks and a lower rate per minute. They last up to 30 days and are valid only in the country where you bought them. Lime’s help page doesn’t say whether they’re sold in Switzerland; if they are, the app lists them under Plans & Pricing.',
            '**Voi:** its pricing page describes subscriptions with unlimited unlocks, with or without minutes included, and prepaid minute bundles with unlocks included. The app shows which of them your city has.',
            '**Dott:** its Swiss terms provide for subscriptions, paid by credit card only.',
            '**PubliBike:** the B-Fit Local subscription (CHF 69 a year) doesn’t lower the e-scooter rate in Zürich or Biel, and the CHF 29 day pass covers bikes and e-bikes only.',
            '**Bolt, Bird and Hopp:** we found no Swiss pass on an official page.',
          ],
        },
        'We found no Swiss pass prices on the operators’ websites; the apps show them. A pass that waives unlocks pays off if it costs less than CHF 1 for each ride you’ll take before it ends. A minute bundle pays off only if you use the minutes before they expire.',
      ],
    },
    {
      heading: 'Extra costs: parking, fees and fines',
      blocks: [
        {
          note: 'You can’t end a ride in a no-parking zone, and the minutes keep counting while you look for a place where the app lets you stop. In Zürich that includes Europaplatz by the main station and Sechseläutenplatz.',
        },
        'Check in the app where you may park before you set off. For the zones around Zürich’s main station and Old Town, see [e-scooters in Zürich](guide:zurich); for Bern’s station and squares, [e-scooters in Bern](guide:bern); for the Rhine and Basel’s old town, [e-scooters in Basel](guide:basel).',
        {
          table: {
            caption: 'Fees in the operators’ Swiss terms and price pages, as read in October 2026',
            head: ['Operator', 'Parked badly or outside the area', 'A fine sent to the operator'],
            rows: [
              ['Voi', 'CHF 25, after warnings', 'Not stated'],
              ['Bolt', 'Pick-up fee up to CHF 100', 'Passed on, plus up to CHF 30'],
              ['Lime', 'A penalty, amount not stated; pick-up and handling up to CHF 125 each', 'Passed on, plus a “reasonable” fee'],
              ['Dott', 'Up to EUR 300 to recover it if you ignore parking or locking instructions; a fee for leaving the area, amount not stated', 'Passed on, plus EUR 50'],
              ['Bird', 'Relocation costs passed on', 'Passed on'],
              ['PubliBike', 'CHF 30, then CHF 50 from the second time', 'Not stated'],
            ],
          },
        },
        'The police can also fine you directly. Leaving a scooter on the pavement with less than 1.50 m free for pedestrians, or where parking is banned, costs CHF 20; riding on the pavement costs CHF 40. The other fines are in [the Swiss e-scooter rules](guide:swiss-rules).',
        'Expect a hold on your card too: Voi reserves CHF 5 when you sign up, and Bolt and Bird may place an authorisation hold. Lime caps a rental at CHF 195 per 24 hours, and a PubliBike rental lasts 24 hours at most.',
      ],
    },
    {
      heading: 'How to pay less for a shared e-scooter',
      blocks: [
        {
          list: [
            '**Compare before you walk.** The nearest scooter saves you walking, not money. In Basel, ten minutes cost CHF 4.90 on Voi and CHF 5.50 on Bolt at the rates published on 12 October 2026. The [map of Basel](map:ch:basel) shows both, each with its estimate.',
            '**Look for PubliBike in Zürich and Biel.** Ten minutes on its e-scooters cost CHF 3.00, against CHF 5.20 at CHF 0.42 a minute. On the [map of Zürich](map:ch:zurich) they stand among the others.',
            '**Pick a charged scooter.** If the battery runs out halfway, the next scooter costs a second unlock.',
            '**Know where you’ll park.** Stopping just outside a no-parking zone is cheaper than circling it with the meter running.',
          ],
        },
      ],
    },
    {
      heading: 'How the price estimate on the map works',
      blocks: [
        'ScootRadar takes each operator’s published unlock fee and rate per minute from its open data feed and does the same sum as above, for a ride of 5, 10, 15, 20 or 30 minutes (10 unless you pick another). The map finds no rate it can use for Bird and PubliBike, and Lime’s feed marks its rates as excluding tax, so their scooters show no estimate.',
        'In the iPhone app you can add a pass you hold, with its free unlocks, free minutes and end date, and the estimate allows for it. Those details stay on your phone.',
        'Feeds can be a few minutes old and rates can vary by zone or time, so the estimate is a guide, not a quote. The button on each scooter opens the operator’s app, which shows the final price before you unlock. [Open the map](/map) to compare.',
      ],
    },
  ],
  faq: [
    {
      question: 'Is there a monthly pass for e-scooters in Switzerland?',
      answer: 'Dott’s Swiss terms provide for subscriptions, and Voi and Lime describe passes on their websites: unlimited unlocks or prepaid minutes at Voi, minute bundles with free unlocks that last up to 30 days at Lime. None of them lists Swiss prices, so the app is where you see what’s on offer. PubliBike’s CHF 69 yearly subscription doesn’t lower its e-scooter rate in Zürich or Biel.',
    },
    {
      question: 'Why did my ride cost more than the estimate?',
      answer: 'Usually because of time and place. Lime rounds each ride up to the next full minute and charges until the app confirms the end, rates can change by zone or time of day, and Lime says some places add a city permit fee or local costs. Minutes spent looking for a spot outside a no-parking zone count too.',
    },
    {
      question: 'Is insurance included in the price of a rental e-scooter?',
      answer: 'Lime, Bolt, Voi and Dott include third-party liability insurance in the price, but it comes second: your own private liability insurance pays first. PubliBike includes none and leaves accident and liability cover to you. Passengers are never covered, and every operator allows one rider only.',
    },
    {
      question: 'Can I pay for an e-scooter with TWINT?',
      answer: 'Of the big operators, only Dott names TWINT, in its general help, as a method you may see depending on where you are; we found no mention of it at Lime, Voi or Bolt in October 2026. They all take credit and debit cards, and Lime also lists Apple Pay, Google Pay, PayPal and Klarna in selected places. The app shows what works when you add a payment method.',
    },
  ],
  sources: [
    { title: 'PubliBike: Prices and subscriptions (Preise & Abos)', url: 'https://www.publibike.ch/de/abos' },
    { title: 'Lime Help Center: Ride costs and rates', url: 'https://help.li.me/hc/en-us/articles/115004914208' },
    { title: 'Lime Help Center: What is LimePass?', url: 'https://help.li.me/hc/en-us/articles/21280766615963-What-is-LimePass' },
    { title: 'Lime: User agreement for Switzerland', url: 'https://www.li.me/de-ch/user-agreement' },
    { title: 'Voi: Pricing and passes', url: 'https://www.voi.com/pricing-and-passes' },
    { title: 'Voi: Terms of use for Switzerland', url: 'https://www.voi.com/de/rechtliche-hinweise/nutzungsbestimmungen/schweiz' },
    { title: 'Bolt: Terms for e-vehicles in Switzerland', url: 'https://bolt.eu/de-ch/legal/micromobility/terms-for-e-vehicles-pdf/' },
    { title: 'Dott: Terms and conditions for Switzerland', url: 'https://ridedott.com/terms-and-conditions/switzerland/' },
    { title: 'City of Zürich: report on shared e-scooters and their zones (GR No. 2025/210)', url: 'https://www.gemeinderat-zuerich.ch/dokumente/9c8a7ffaed6e4f3ca6234611a78f2946-332' },
    { title: 'Swiss fines ordinance (OBV), Annex 1: list of fines', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
