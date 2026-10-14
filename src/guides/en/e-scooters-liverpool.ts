import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-liverpool',
  topic: 'liverpool',
  name: 'E-scooter hire in Liverpool',
  title: 'E-scooter Liverpool 2026: Bolt prices, no-go zones, bays',
  description: 'E-scooter hire in Liverpool with Bolt: £1 to unlock and 25p a minute, passes and discounts, who can ride, the no-go zones and why every ride ends in a bay.',
  headline: 'E-scooter hire in Liverpool: Bolt’s prices, the no-go zones and where to park',
  lede: 'You can hire an e-scooter in Liverpool around the clock from Bolt, the city’s only operator since 1 February 2026. It costs £1 to unlock and 25p a minute, so 10 minutes cost £3.50, and you must be 18 or over with a full or provisional driving licence. Every ride ends in one of Bolt’s parking bays, shown in the app along with the zones where the scooter slows down or stops. Your own e-scooter is illegal on Liverpool’s roads and pavements.',
  published: '2026-10-13',
  updated: '2026-10-13',
  city: 'gb:Liverpool',
  sections: [
    {
      heading: 'Liverpool e-scooter hire: Bolt, and what happened to Voi',
      blocks: [
        'One company, **Bolt**, runs Liverpool’s shared e-scooters and e-bikes, under a Liverpool City Council contract and in partnership with the Liverpool City Region Combined Authority. Its area covers the whole city, Speke and Garston included, but not Bootle, Crosby, Huyton or the Wirral. The council and Merseyside Police call Bolt’s scooters “the only e-scooters permitted for use on public roads in Liverpool”.',
        '**Voi** launched the trial in October 2020 and ran it for more than five years. Bolt won the council’s tender, signed the contract on 28 October 2025 and took over on 1 February 2026, with about 2,000 e-scooters and a smaller e-bike fleet: Liverpool is its first e-scooter city in the UK. The contract’s end date hasn’t been published, and the national trial that makes hire e-scooters legal is due to run until May 2028.',
        'On the morning of 13 October 2026 the [map of Liverpool](map:gb:Liverpool) showed about 1,800 Bolt e-scooters: a snapshot, not the fleet size. It doesn’t show Bolt’s e-bikes, bays or zones. Tap a scooter to open the Bolt app, where you unlock and pay.',
      ],
    },
    {
      heading: 'How much does a Bolt scooter cost in Liverpool?',
      blocks: [
        'Bolt charges **£1 to unlock and 25p a minute** for e-scooters and e-bikes alike, the rate in its data on 13 October 2026. The app shows the price before you unlock.',
        {
          table: {
            caption: 'Bolt prices in Liverpool, 13 October 2026',
            head: ['Option', 'Price', 'What you get'],
            rows: [
              ['Pay per minute', '£1 + 25p a minute', '5 minutes £2.25, 10 minutes £3.50, 20 minutes £6.00, 30 minutes £8.50'],
              ['Pay per mile', 'In the app', 'An option meant to encourage slower riding; the rate isn’t published'],
              ['Passes', 'In the app', 'Daily, weekly or monthly, as the council and Bolt describe them'],
            ],
          },
        },
        'Some riders can apply to Bolt for a cheaper **monthly pass**. The council lists two discounts:',
        {
          table: {
            caption: 'Monthly pass discounts listed by Liverpool City Council',
            head: ['Discount', 'Who qualifies'],
            rows: [
              ['50%', 'Liverpool residents with an HC2 certificate, on Universal Credit, ESA, JSA or Income Support, with refugee status, or with a Disabled Persons Railcard or an older person’s bus pass'],
              ['20%', 'Students, apprentices, higher-education staff, NHS staff, and Blue Light Card or Defence Discount Service holders'],
            ],
          },
        },
        'The discounts don’t apply to pay-as-you-go rides, and the pass price is shown only in the app. Rates of £1 + 20p a minute, still quoted online, date from Voi’s time. New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Are e-scooters legal in Liverpool? Age, licence and fines',
      blocks: [
        'Hire scooters are legal because Liverpool is one of England’s 21 trial areas. You must be **18 or over** with a **full or provisional driving licence** (category Q, included in every UK car, moped and motorcycle licence), and you don’t need L plates. Visitors can use a full EU or EEA licence, or another country’s full driving licence within 12 months of entering the UK, but never a foreign provisional one.',
        {
          table: {
            caption: 'The rules that get riders fined or banned in Liverpool, October 2026',
            head: ['Rule', 'What it means', 'If you break it'],
            rows: [
              ['Pavements', 'Never: use the road and cycle lanes', '£50 fixed penalty'],
              ['One rider', 'No passengers, and nobody else riding on your account: they wouldn’t be insured', 'A suspension or a permanent ban from Bolt'],
              ['Phone', 'Not in your hand while riding', '£200 and 6 points'],
              ['Drink and drugs', 'Drink-drive law applies; at night the app makes you pass a reaction test first', 'Court, a driving ban, possibly prison'],
              ['Speed', 'The app shows the limit, lower in slow zones and for your first five rides', 'The scooter slows itself'],
              ['Helmet', 'Recommended, not compulsory', '–'],
            ],
          },
        },
        'The council’s launch notices put Bolt’s top speed at 15.5 mph and its FAQ at 12.5 mph, so go by the limit the app shows. The national rules are in [our guide to e-scooter law in the UK](guide:uk-law).',
        {
          note: 'A private e-scooter is illegal on Liverpool’s roads, pavements and cycle lanes and in its parks. Riding one counts as riding an uninsured motor vehicle: a £300 fixed penalty and 6 points, and the police can seize it. Merseyside Police’s Operation Gears has “seized thousands of vehicles”.',
        },
      ],
    },
    {
      heading: 'Bolt Liverpool no-go zones: where you can and can’t ride',
      blocks: [
        'Bolt’s scooters stop in no-go zones and slow down in slow zones. This is how we read Bolt’s zone data on 13 October 2026:',
        {
          table: {
            caption: 'Riding zones as we read Bolt’s data, 13 October 2026 (zones change: check the app)',
            head: ['Where', 'Riding', 'Good to know'],
            rows: [
              ['Liverpool ONE, Church Street, Lord Street, Whitechapel, Williamson Square, Clayton Square', 'No riding', 'Bays around the edge, on the Strand and just off Hanover Street'],
              ['Royal Albert Dock and Salthouse Dock quays, Tate Liverpool', 'No riding', 'Bays on Gower Street and Salthouse Quay, about 150 to 200 m away'],
              ['Pier Head, Mann Island, the Museum of Liverpool', 'Normal', 'A bay by the ferry terminal'],
              ['The Cavern Quarter (Mathew Street), Castle Street, Dale Street', 'Normal', 'A bay on Victoria Street, about 55 m from the Cavern Club'],
              ['Bold Street', 'Mixed', 'The middle is a no-go zone and the upper part slow (10 mph); both ends are open'],
              ['Concert Square, Colquitt Street, St Peter’s Square', 'Slow: 10 mph', 'Slater Street and Concert Street are no-go zones'],
              ['Seel Street, Hanover Street, Duke Street, Hope Street, the Baltic Triangle', 'Normal', '–'],
              ['University of Liverpool precinct, Metropolitan Cathedral plaza', 'No riding', '–'],
              ['Sefton Park, Princes Park, Calderstones Park', 'Slow: 10 mph', '–'],
              ['Stanley Park, Newsham Park, Croxteth Park, Greenbank Park, Festival Gardens', 'Slow: 8 mph', '–'],
              ['Aintree, Bootle, Crosby, Huyton, the Wirral', 'Outside the area', 'You can’t end a ride there'],
            ],
          },
        },
        'Lime Street, many other stations and the airport are no-go zones too (see below).',
      ],
    },
    {
      heading: 'Bolt Liverpool parking: bays, photos and fines',
      blocks: [
        'A ride can only end in one of Bolt’s **parking bays**, shown in the app: about 1,500 in Bolt’s data on 13 October 2026, dense in the centre and thin in the parks and along Otterspool Promenade. Bolt told the BBC in January 2026 that its vehicles “must be parked in specific, identified parking bays”.',
        'Find the bay nearest your destination before you set off: the [map](map:gb:Liverpool) shows the scooters, not the bays. Leave the pavement clear for blind and disabled people, and take the photo the app asks for. Bolt checks it with AI, and the council warns that “improper parking may result in a fine”. No amount is published for Liverpool; Bolt’s UK terms allow up to £40.',
        'The council’s hire page still says you can “just leave them on the street”: that’s out of date. To report a badly parked Bolt, use the app or call 0844 933 4578 (charges may apply).',
      ],
    },
    {
      heading: 'Lime Street, Merseyrail, the Mersey Tunnels and the airport',
      blocks: [
        'In Bolt’s data, **Lime Street** station is a no-go zone, with about 20 bays within 300 metres; the nearest are on the forecourt side and on Copperas Hill. Edge Hill, South Parkway and many suburban stations are no-go zones too; Moorfields, James Street and Sandhills aren’t.',
        '**No e-scooters on Merseyrail:** they have been banned from its trains and stations since 2023, and non-folding e-bikes will be too from 1 January 2027.',
        '**Not through the Mersey Tunnels:** Merseytravel has said e-scooters are not allowed “under any circumstances”. The Wirral is outside Bolt’s area anyway, and we found no e-scooter rule on the Mersey Ferries website, so end your ride at the bay by the Pier Head terminal.',
        '**Liverpool John Lennon Airport** has had Bolt bays since July 2026, near the staff entrance in the free drop-off and pick-up car park, and passengers may use them too. The terminal is a no-go zone: follow the app to the bay and walk the rest. Heading elsewhere? See [e-scooter hire in the UK](guide:uk-hire) for the other trial areas.',
      ],
    },
    {
      heading: 'Match days, the Grand National and concerts',
      blocks: [
        {
          list: [
            '**Anfield and Goodison Park** weren’t in no-go zones in Bolt’s data on 13 October 2026, with about 11 bays within 300 metres of Anfield; Walton Breck Road and Stanley Park are slow (8 mph).',
            '**Hill Dickinson Stadium**, Everton’s new ground at Bramley-Moore Dock, is rideable, but its nearest bay is about 400 metres away. We found no match-day restrictions; check the app before kick-off.',
            '**The Grand National** festival, from 8 to 10 April 2027, is at Aintree, outside Bolt’s area: end your ride at a bay on Longmoor Lane, about 780 metres from the racecourse, and walk the rest.',
            '**M&S Bank Arena:** Kings Parade is open, Keel Wharf is slow (10 mph) and the Albert Dock next door is a no-go zone. The nearest bay is about 100 metres away, at Monarchs Quay.',
          ],
        },
      ],
    },
    {
      heading: 'Bolt e-bikes in Liverpool: no licence needed',
      blocks: [
        'Bolt’s e-bikes cost the same, £1 to unlock and 25p a minute, and need **no driving licence**, though you still register at 18 or over. Liverpool was the first place in the UK to get Bolt’s solar-assisted shared e-bikes. They aren’t on our map: find them in the Bolt app.',
        '**Citybike**, the docked bike share launched in 2014, is gone: Voi’s e-bikes replaced it in November 2022.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Citybike lives on in the bay names.** 73 of Bolt’s virtual bays are still called “Liverpool - Citybike”, Pier Head Ferry and Church Street among them.',
            '**72,000 rides in ten weeks.** That was Voi’s tally from the October 2020 launch to mid-December, as the fleet grew to 400 scooters.',
            '**From weekend curfew to 24/7.** In June 2021 the council ordered “a full stop of the service after 9pm on Friday, Saturday and Sunday”. Bolt runs round the clock.',
            '**The Queensway was the world’s longest road tunnel** from its opening in 1934 until 1948. E-scooters are banned from it.',
            '**Liverpool lost its World Heritage status** in July 2021, only the third site ever removed from UNESCO’s list. Its Albert Dock quays are a Bolt no-go zone.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Are there still Voi scooters in Liverpool?',
      answer: 'No. Voi ran Liverpool’s trial from October 2020 until the end of January 2026, and Bolt took over on 1 February 2026. Voi’s pages and prices still found online are out of date.',
    },
    {
      question: 'Can you leave a Bolt scooter anywhere in Liverpool?',
      answer: 'No. You can end a ride only in one of Bolt’s parking bays shown in the app, about 1,500 across the city in October 2026, and you must take an end-of-ride photo. Parking badly can cost up to £40 under Bolt’s UK terms.',
    },
    {
      question: 'Is Bolt open 24 hours in Liverpool?',
      answer: 'Yes. Bolt’s e-scooters and e-bikes run around the clock, while Voi’s ran from 6am to midnight. At night Bolt makes you pass a short reaction test in the app before each ride, and drink-drive law applies at any hour.',
    },
    {
      question: 'Can I ride my own e-scooter in Liverpool?',
      answer: 'No. As everywhere in the UK, a private e-scooter is illegal on roads, pavements and cycle lanes and in parks, and Merseyside Police seize them. You may ride one only on private land with the owner’s permission.',
    },
    {
      question: 'How long will Bolt run Liverpool’s e-scooters?',
      answer: 'That isn’t known. Bolt took over on 1 February 2026 under a council contract whose end date hasn’t been published. Hire e-scooters also depend on the national trial, due to run until May 2028.',
    },
  ],
  sources: [
    { title: 'Liverpool City Council: E-scooters and e-bikes for hire', url: 'https://liverpool.gov.uk/parking-roads-and-travel/getting-around-liverpool/e-scooters-and-e-bikes-for-hire/' },
    { title: 'Liverpool Express: E-scooter FAQs (February 2026)', url: 'https://liverpoolexpress.co.uk/e-scooter-faqs/' },
    { title: 'Liverpool Express: Bolt launching in Liverpool (30 January 2026)', url: 'https://liverpoolexpress.co.uk/bolt-launching-new-shared-scooters-and-e-bikes-in-liverpool-from-sunday-1-february/' },
    { title: 'Liverpool Express: Council and police e-scooter reminder (August 2026)', url: 'https://liverpoolexpress.co.uk/liverpool-city-council-and-merseyside-police-remind-e-scooter-users-to-stay-safe-and-follow-the-law/' },
    { title: 'Find a Tender: E-Scooter and E-Bike Concession Contract, award notice', url: 'https://www.find-tender.service.gov.uk/Notice/073777-2025' },
    { title: 'Bolt: open data for Liverpool', url: 'https://mds.bolt.eu/gbfs/3/412/gbfs' },
    { title: 'BBC News: Crackdown on e-scooter riders who flout rules (January 2026)', url: 'https://www.bbc.com/news/articles/c78ek4pn8d3o' },
    { title: 'Merseyrail: E-bike ban', url: 'https://www.merseyrail.org/journey-planning/plan-your-journey/e-bike-ban/' },
    { title: 'WCNW Chamber: Liverpool John Lennon Airport partners with Bolt (July 2026)', url: 'https://wcnwchamber.org.uk/news/ljla-partners-with-bolt-to-launch-dedicated-scooter-and-e-bike-parking/' },
    { title: 'GOV.UK: Using a rental e-scooter (updated 7 July 2026)', url: 'https://www.gov.uk/guidance/e-scooter-trials-guidance-for-users' },
  ],
};

export default guide;
