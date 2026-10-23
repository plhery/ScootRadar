import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'how-to-rent-an-e-scooter',
  topic: 'how-to-rent',
  name: 'How to rent an e-scooter',
  title: 'How to rent an e-scooter: steps, costs, parking (2026)',
  description: 'How to rent an e-scooter, step by step: the app, age and licence, what a ride costs, card holds, reserving, parking and the photo, crashes and riding abroad.',
  headline: 'How to rent an e-scooter: from the app to the end of your ride',
  lede: 'How to rent an e-scooter, in short: install the operator’s app, sign up with your phone number and a card, scan the QR code on the handlebar and ride, then park where the app allows and take a photo to end the ride. Almost every operator rents only to riders aged 18 or over, and in the UK you also need a driving licence. You pay an unlock fee plus a rate per minute: Voi published CHF 1 plus CHF 0.42 a minute in Bern on 12 October 2026, so ten minutes cost CHF 5.20.',
  published: '2026-10-12',
  updated: '2026-10-23',
  sections: [
    {
      heading: 'How to rent (or hire) an e-scooter, step by step',
      blocks: [
        'How do e-scooter rentals work? Every operator (Lime, Voi, Bolt, Dott, Bird and others) has its own app, and you need an account with the one whose scooter you ride. The steps barely differ:',
        {
          steps: [
            '**Install the app and sign up** with your phone number or email.',
            '**Prove your age if asked.** Some cities make you scan an ID; in the UK you scan your driving licence.',
            '**Add a way to pay:** a card, or Apple Pay, Google Pay or PayPal where the operator offers them.',
            '**Do the in-app lesson.** It’s compulsory in London and with Beryl, and every UK operator must offer one.',
            '**Check the price:** tap or scan the scooter to see the unlock fee and the rate per minute.',
            '**Scan the QR code** on the handlebar, or type the number printed under it.',
            '**Check the brakes, tyres, lights and battery.** If the scooter doesn’t work, report it: Voi and Dott don’t charge for one that fails after you unlock it.',
            '**Ride alone** and keep to the local traffic rules. New riders start slower: Bolt caps you at 15 km/h for your first five rides, and Voi may start you at around 15 km/h.',
            '**Park where the app allows, tap End ride and take the photo.** You pay until the app confirms the end.',
            '**Check the receipt:** the hold on your card is released and the final charge appears.',
          ],
        },
        'At peak hours Bolt may make you pass a short reaction test before you unlock. Fail it five times and you can’t rent for three hours.',
      ],
    },
    {
      heading: 'What do you need to rent an e-scooter? Age, licence and payment',
      blocks: [
        'A smartphone with mobile data, an account and a way to pay. Age and papers depend on the country, sometimes on the city:',
        {
          table: {
            caption: 'What the operators ask for, by country, as read in October 2026',
            head: ['Country', 'Minimum age', 'Licence or ID', 'Payment worth knowing'],
            rows: [
              ['Switzerland', '18', 'None; an ID scan only if the app asks', 'TWINT: named only by Dott, depending on location'],
              ['United Kingdom', '18', 'Full or provisional driving licence', 'Beryl: card postcode must match your billing address'],
              ['Germany', '18', 'None', 'PayPal at Bolt (Germany only)'],
              ['France', '18; 16 at Pony', 'ID at Dott in Lyon', 'Pony: refundable deposit of €0–25'],
              ['Italy', '18', 'ID at Dott in Rome, Milan, Turin and more', 'Satispay at Dott'],
              ['Belgium', '18; 16 at Voi in Antwerp, Hoppy and Pony', 'Brussels: one-time ID scan', 'Bancontact at Dott'],
              ['Norway', '16 at Bolt, Voi and Ryde', 'Ryde verifies your card by 3-D Secure or Mobile BankID', 'Vipps at Ryde'],
            ],
          },
        },
        'The law often lets younger riders use their own scooter (from 16 in Switzerland, 14 in Germany), but operators set their own limits. For the Swiss riding rules see [e-scooter rules in Switzerland](guide:swiss-rules); for licences and trial areas in Britain, [e-scooter hire in the UK](guide:uk-hire).',
      ],
    },
    {
      heading: 'How much does e-scooter rental cost?',
      blocks: [
        'You pay an unlock fee plus a rate for every minute the scooter is unlocked, moving or not. Lime, Voi and Dott round each ride up to the next full minute, and rates vary by city, sometimes by time of day.',
        {
          table: {
            caption: 'Pay-as-you-go rates published on 12 October 2026, and what a ride costs',
            head: ['Operator and city', 'Rate', '5 minutes', '10 minutes', '20 minutes'],
            rows: [
              ['Voi, Bern', 'CHF 1 + CHF 0.42 a minute', 'CHF 3.10', 'CHF 5.20', 'CHF 9.40'],
              ['Bolt, Liverpool', '£1 + 25p a minute', '£2.25', '£3.50', '£6.00'],
              ['Voi, Stuttgart', '€0.49 + €0.24 a minute', '€1.69', '€2.89', '€5.29'],
              ['Voi, Oslo', '10 kr + 2.50 kr a minute', '22.50 kr', '35 kr', '60 kr'],
            ],
          },
        },
        '**A worked example.** You ride a Voi in Bern for 9 minutes 20 seconds. That’s billed as 10 minutes: CHF 1 + 10 × CHF 0.42 = CHF 5.20. Spend two more minutes looking for a spot outside a no-parking zone and it’s 12 minutes, or CHF 6.04.',
        'Bird publishes no rates in open data, and Lime’s and Dott’s change from city to city, but like every operator they show the price in the app before you unlock. Swiss rates by city, Dott’s and Lime’s included, are in [e-scooter prices in Switzerland](guide:swiss-prices).',
        '**Passes** pay off if you ride often. Minute bundles (LimePass, Voi, Dott), day passes (Voi, Dott) and monthly passes (LimePrime, Voi Pass, Bolt) cut or waive the unlock fee.',
        '**The hold.** At the start of a ride the app reserves a small sum on your card: about CHF 3, £2.25 or €2.50 to €3 at Dott, and £4 to £7.50 or €4 to €7.50 at Voi, which also reserves CHF 5 when you sign up in Switzerland. It’s released when the ride ends, though your bank may take days to show it.',
      ],
    },
    {
      heading: 'Can you reserve or pause an e-scooter?',
      blocks: [
        'Usually, yes. Reserving is sometimes free; pausing almost never is.',
        {
          list: [
            '**Lime:** reserve for up to 10 minutes free (30 with LimePrime or a LimePass); pause for up to 15 minutes, still charged.',
            '**Dott:** reserve for 10 minutes free, in more than 400 cities (Dott, May 2025); pause for up to 30 minutes at the full rate.',
            '**Voi:** pause to keep a scooter for up to two hours; you keep paying, in some places at a lower rate. Its Swiss terms cap a rental at one hour.',
            '**Bird:** reserve for up to 30 minutes and lock for up to 75, both charged per minute.',
            '**Bolt:** reserve in advance, at the length and cost the app shows; pause only in blue parking spots, charged per minute.',
          ],
        },
        'Never just walk away. Lime warns that if you leave without pausing or ending the ride and the scooter is stolen, you may pay for the extra time.',
      ],
    },
    {
      heading: 'How to end your ride: parking zones and the photo',
      blocks: [
        'The app’s map shows zones. In **no-go zones**, usually red, the scooter slows to a stop. **Low-speed zones** are usually yellow. In **no-parking zones** you can’t end the ride, and in some areas you must end it in a **parking spot**, usually blue, often with a P.',
        {
          note: 'If the app won’t end the ride, you’re still paying. In a no-parking zone or outside the operating area, the minutes keep counting until you move to an allowed spot.',
        },
        'Park upright on the kickstand without blocking the pavement, entrances or driveways, then tap End ride and take the photo. It gets checked: Dott’s software flags blocked pavements, tipped-over scooters and scooters outside bays, and Voi’s Parking Assistant reviews photos too. In Italy the photo is compulsory by law.',
        {
          table: {
            caption: 'What operators charge for bad parking, usually after warnings (terms and help pages, October 2026)',
            head: ['Operator', 'Bad parking', 'Other charges'],
            rows: [
              ['Voi', 'CHF 25 in Switzerland', 'Fees for repeated bad photos'],
              ['Bolt', 'Up to £40 in the UK; €15 in Germany under its terms from 1 November 2026', 'Up to £100, €100 or CHF 100 to fetch one left outside the area'],
              ['Dott', 'Up to €300', '£50 or €50 to pass on a fine'],
              ['Beryl', '£5 or £10 outside a bay', '£80 if not back within 24 hours'],
              ['Lime', 'A penalty, amount not published', 'Pick-up and handling up to CHF 125 each in Switzerland'],
            ],
          },
        },
        'Police fines come on top. In Switzerland, leaving a scooter on the pavement with less than 1.50 m free for pedestrians costs CHF 20.',
      ],
    },
    {
      heading: 'What to do after a crash, or with a damaged scooter',
      blocks: [
        {
          steps: [
            'Get everyone safe, and call 112 (999 in the UK) if anyone is hurt.',
            'Exchange details, and photograph the scene, the scooter’s number and the damage.',
            'Report it in the app’s help menu; at Dott it’s Help & legal › Report accident.',
            'Tell the police if someone is hurt or something is damaged; Bolt’s terms ask you to do so as soon as possible.',
            'Don’t admit liability on the spot, as Dott advises.',
          ],
        },
        'Liability insurance comes with the ride at the big operators, with limits. In Switzerland, Lime, Bolt and Voi pay only after your own private liability insurance, and PubliBike includes none. A passenger voids Dott’s cover, and Dott doesn’t insure head injuries without a helmet. Beryl’s UK cover is third-party only.',
        'Damage you cause to the scooter is billed to you: up to CHF 1,540 under Lime’s Swiss terms.',
      ],
    },
    {
      heading: 'Renting an e-scooter abroad: passes, wallets and local rules',
      blocks: [
        'Your account travels with you. Your passes and credit mostly don’t:',
        {
          list: [
            '**Passes stay in one country.** LimePass, LimePrime, Voi’s bundles and Dott’s passes work only in the country where you bought them, and Bolt’s only in the city.',
            '**Credit stays in one currency.** At Bird and Dott you need a new wallet for each currency, and Bolt Balance works only in the currency it was issued in.',
            '**Rules change at the border.** The UK wants a driving licence: a full EU or EEA one, or another country’s full licence if you entered the UK in the last 12 months, never a foreign provisional one. Brussels makes you scan your ID once, Italy requires a helmet you bring yourself, and Oslo stops rentals from 23:00 to 05:00.',
            '**Cards:** Bolt takes American Express only in euro-zone countries.',
          ],
        },
        'Sign up and add a payment method before you travel, not on the pavement.',
      ],
    },
    {
      heading: 'How to find the nearest e-scooter, whatever the app',
      blocks: [
        'Each operator’s app shows only its own fleet. Two kinds of app show several:',
        {
          list: [
            '**Maps that hand you over.** [ScootRadar](/map) puts on one map the operators whose open data it reads, with battery and range where shared, the walking time and a price estimate from published rates. It’s free, with no account and no ads, in a browser or as an iPhone app. It can’t reserve or unlock: a button opens the operator’s app, and positions can be a few minutes old. Google Maps also shows nearby scooters with prices in the cities it covers, then opens the operator’s app.',
            '**Apps you can book in.** Uber rents Lime scooters in some cities, Zürich among them: tap Services, then 2-Wheels. In Berlin the Jelbi app books Voi, Lime, Bolt and Dott; in Munich, MVGO books Voi and Dott; around Oslo, the Ruter app rents Bolt, Ryde and Voi, paid per trip by card.',
          ],
        },
        'Your operator pass usually doesn’t count in a booking app, as Ruter points out, and a map shows only the operators that share their data. [Open the map](/map) to see who has a scooter near you.',
      ],
    },
  ],
  faq: [
    {
      question: 'Do you need a driving licence to rent an e-scooter?',
      answer: 'In the UK, yes: every operator wants a full or provisional driving licence, scanned in the app. In Switzerland, Germany and most other countries you need none, though some apps ask you to scan an ID to check your age, and in Brussels everyone does so once before the first ride.',
    },
    {
      question: 'How old do you have to be to rent an e-scooter?',
      answer: 'Eighteen at almost every operator, even where the law lets younger riders use their own scooter. Norway is the main exception: Bolt, Voi and Ryde rent from 16. In Belgium, Voi in Antwerp, Hoppy and Pony rent from 16, and Pony does in France too.',
    },
    {
      question: 'Can two people ride one rental e-scooter?',
      answer: 'No: every operator allows one rider per scooter. To ride together, start a group ride, where one account unlocks up to five scooters at Lime and Voi (not in the UK at Voi), usually three at Dott and up to four extra at Bird. The host pays for every scooter, and every rider must be old enough, usually 18.',
    },
    {
      question: 'Can you rent an e-scooter without a credit card?',
      answer: 'Usually, yes. Most operators take debit cards, Lime also takes prepaid cards, and several offer PayPal, Apple Pay or Google Pay in many places. Bolt takes PayPal only in Germany.',
    },
    {
      question: 'What happens if my phone dies during a ride?',
      answer: 'You can’t end the ride without the app, so the minutes may keep counting. Voi ends a ride by itself once the scooter has stood still for 10 minutes, and Dott after 10 to 30 minutes without use. Park properly, and end the ride or contact support as soon as your phone is back on.',
    },
  ],
  sources: [
    { title: 'GOV.UK: Using a rental e-scooter (updated 7 July 2026)', url: 'https://www.gov.uk/guidance/e-scooter-trials-guidance-for-users' },
    { title: 'Lime Help Center: Ride costs and rates', url: 'https://help.li.me/hc/en-us/articles/115004914208' },
    { title: 'Lime Help Center: Payment methods', url: 'https://help.li.me/hc/en-us/articles/115004914608' },
    { title: 'Lime Help Center: How to end a ride and park', url: 'https://help.li.me/hc/en-us/articles/115004745967' },
    { title: 'Voi Help: Why do I see a reserved or pending payment?', url: 'https://www.voi.com/help/accounts-and-payments/why-do-i-see-a-reserved-or-pending-payment-from-voi' },
    { title: 'Voi: Pricing and passes', url: 'https://www.voi.com/pricing-and-passes' },
    { title: 'Dott Help: Payment methods', url: 'https://help.ridedott.com/en/articles/209' },
    { title: 'Dott: Reserve a vehicle for free', url: 'https://ridedott.com/reservations/' },
    { title: 'Bolt: Electric scooters', url: 'https://bolt.eu/en/scooters/' },
    { title: 'Jelbi (BVG): Frequently asked questions (German)', url: 'https://www.jelbi.de/faq-de/' },
    { title: 'Ryde: terms and conditions for Norway', url: 'https://www.ryde-technology.com/terms-conditions-norway' },
  ],
};

export default guide;
