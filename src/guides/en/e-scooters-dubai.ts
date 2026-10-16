import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-dubai',
  topic: 'dubai',
  name: 'Renting an e-scooter in Dubai',
  title: 'E-scooter Dubai 2026: permit, rules, fines, prices, apps',
  description: 'E-scooter Dubai guide: Dott, Lime and Skurtt, the free RTA permit and who needs it, where you may ride, the AED fines, prices and the Metro rule.',
  headline: 'E-scooters in Dubai: the RTA permit, where you may ride, the fines and what a rental costs',
  lede: 'You can rent an e-scooter in Dubai from Dott, Lime or Skurtt, all approved by the RTA, but only on its designated tracks and districts. Dott charges AED 3.50 to unlock plus AED 1.50 a minute (published rate, 16 October 2026). You must be 16, and unless you hold a UAE or international driving licence, you need the RTA’s free online e-scooter permit, on a rental too. Wear a helmet and a reflective vest: Dubai Police seized 13,657 e-scooters for traffic violations in the first eight months of 2026.',
  published: '2026-10-16',
  updated: '2026-10-16',
  city: 'ae:Dubai',
  sections: [
    {
      heading: 'Which e-scooter apps work in Dubai?',
      blocks: [
        'Dubai’s Roads and Transport Authority (RTA) has approved four rental operators, as of October 2026:',
        {
          list: [
            '**Dott**, which replaced Tier on the list. Its open data cover Dubai Marina and JLT through Downtown and Business Bay to Karama, Al Rigga, Al Qusais and Al Khawaneej, plus Dubai Hills.',
            '**Lime**, which lists Dubai (and Abu Dhabi) among its cities.',
            '**Skurtt**, a local operator (the RTA also writes Skurrt).',
            '**Arnab**, a local operator. It’s still listed, but the RTA’s renting instructions name only the other three, and its page no longer shows Arnab’s phone number.',
          ],
        },
        'The [map of Dubai](map:ae:Dubai) shows only Dott, the one operator here that publishes open data: about 1,700 scooters on the evening of 16 October 2026, about 90 of them in Dubai Hills (a count on the map, not a fleet size). For Lime, Skurtt and Arnab, open their apps: the RTA doesn’t publish which operator serves which district.',
        'Abu Dhabi sets its own rules and zones. Its [map](map:ae:Abu Dhabi) showed about 500 Dott scooters, at AED 3.20 to unlock plus AED 1.20 a minute.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Dubai?',
      blocks: [
        {
          table: {
            caption: 'E-scooter prices in Dubai (published rates, 16 October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Dott, most of Dubai', 'AED 3.50', 'AED 1.50', 'AED 18.50', 'AED 33.50'],
              ['Dott, Dubai Hills', 'AED 3.00', 'AED 1.20', 'AED 15.00', 'AED 27.00'],
              ['Lime, Skurtt, Arnab', 'In the app', 'In the app', 'In the app', 'In the app'],
            ],
          },
        },
        'Dott charges from unlock to lock, stops included; the app shows the final price. The RTA says every authorised operator’s app accepts a **nol card**, the Metro card: link it by NFC, then buy hourly, daily or monthly packages.',
        'Dott’s UAE terms allow up to €300 to recover a scooter you didn’t park as told, and Lime’s Dubai terms up to AED 440 to fetch one left out of reach. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Do you need an RTA e-scooter permit to rent in Dubai?',
      blocks: [
        'Yes, unless you hold a driving licence that counts. Dubai requires a Rider’s Permit for any e-scooter, and the RTA says you must show your driving licence or permit to the rental company. You don’t need the permit with:',
        {
          list: [
            'a UAE driving licence;',
            'a valid international driving licence;',
            'a driving licence from one of the “exception countries” whose licences the UAE accepts (the RTA’s licence-exchange page lists them).',
          ],
        },
        'Dott’s UAE terms agree: a driving licence or the permit, carried on the ride. The minimum age is 16, as Dubai’s resolution, the RTA and Dott say; a December 2025 Media Office release said 17, but the RTA’s copy of it says 16. Lime’s Dubai terms set 18.',
        '**Getting the permit as a tourist.** It’s free and, the RTA says, takes about an hour:',
        {
          steps: [
            'Open the service on rta.ae or in the RTA Dubai app (the Dubai Now app asks you to log in with UAE Pass).',
            'Apply as a tourist with your passport details and unified number. The one-time code goes to a UAE mobile number: any will do, but you need one.',
            'Follow the online lectures, then pass a 20-question test in 30 minutes. Retakes are allowed.',
            'Download the permit. It never expires, and the copy in the RTA app is enough.',
          ],
        },
        { note: 'Riding without a permit, or a licence that replaces it, costs AED 200. Carry one or the other on every ride.' },
      ],
    },
    {
      heading: 'Where are e-scooters allowed in Dubai?',
      blocks: [
        'Only on the tracks and in the districts the RTA designates, marked by signs and red road markings. Dubai’s rules allow e-scooters on cycle lanes designated for them, at up to 20 km/h, and on the shared streets of designated “flexible mobility” areas. On a rental, stay inside the area the app shows: Dott may disable a scooter that leaves it. The RTA’s list in October 2026:',
        {
          list: [
            '**Cycle tracks:** Dubai Marina, JLT, Dubai Internet City, the Greens, Jumeirah, City Walk, Downtown (Mohammed bin Rashid Boulevard), Business Bay and the Dubai Water Canal, 2nd of December Street, Al Rigga and Al Muraqqabat, Al Shindagha Museum, the Mohammed bin Rashid Library, Al Mamzar, and Al Khawaneej with Mushrif Park and Al Warqa. The RTA’s December 2025 permit notice also names Palm Jumeirah.',
            '**Residential districts with shared streets:** Al Mankhool, Al Karama, Al Qusais 1, Al Garhoud, Umm Hurair 1, Muhaisnah 3, Umm Suqeim 3, Al Safa 2, Al Barsha 3, Al Barsha South 2, and Al Tawar 1, 2 and 4.',
          ],
        },
        'Rentals started in 10 districts on 13 April 2022 and reached 21 in 2023. Today’s list no longer names Al Quoz 4 or Nad Al Sheba 1, which some articles still list.',
        '**Where you can’t ride:**',
        {
          list: [
            'Any road or street outside the designated network, main roads included: AED 200.',
            'Pavements and walking or jogging tracks: AED 200, also for leaving a scooter on a walking or jogging track.',
            'The cycle tracks at Saih Al Salam, Al Qudra and Meydan, which are for bicycles.',
            'Inside Metro and tram stations and on footbridges.',
            'Pedestrian crossings: get off and walk the scooter across, or pay AED 200.',
          ],
        },
        '**Parking.** The RTA has set aside spaces for shared scooters along the tracks, at tourist spots and around stations: park only there, blocking no one, or pay AED 200. Dott’s open data list about 350 such spots, and its terms require you to end the ride at one.',
      ],
    },
    {
      heading: 'Dubai e-scooter rules and fines',
      blocks: [
        'These are Dubai’s own rules, not the UAE’s: Executive Council Resolution No. 13 of 2022 covers bicycles, e-bikes and e-scooters across the emirate, free zones included, and the RTA designates the tracks, sets their speed limits and issues the permit. Dubai Police issue the fines.',
        {
          table: {
            caption: 'E-scooter rules and fines in Dubai (Resolution No. 13 of 2022, as of October 2026)',
            head: ['Rule', 'What applies', 'Fine'],
            rows: [
              ['Age', '16 or over; Lime sets 18', '–'],
              ['Permit', 'RTA permit, unless your driving licence counts', 'AED 200'],
              ['Helmet and reflective vest', 'Both required', 'AED 200'],
              ['Speed', '20 km/h on e-scooter tracks, or lower where signs say; Dott’s terms set 20 km/h everywhere', 'AED 100'],
              ['Where to ride', 'Designated tracks and streets only, with the traffic', 'AED 200'],
              ['Passengers', 'One rider only, and nothing that unbalances you', 'AED 300'],
              ['Reckless riding', 'No zigzagging, riding one-handed or holding on to a vehicle', 'AED 300'],
              ['Signs', 'Follow the instructions on track signs', 'AED 200'],
              ['Parking', 'Designated spots only, blocking no one', 'AED 200'],
              ['Accidents', 'Report any crash with injuries or damage to the police, the ambulance or the RTA', 'AED 300'],
            ],
          },
        },
        'Commit the same dangerous violation twice within a year and the RTA can impound the scooter for 30 days or ban you from riding; for riders under 18, the parent or guardian pays. The RTA also asks you not to wear headphones in both ears or use your phone while riding.',
        'Don’t ride after drinking: Dott’s and Lime’s terms forbid it. No published rule sets an alcohol limit for e-scooters, but Dubai’s resolution tells riders to obey the traffic laws, and the UAE’s federal traffic law punishes driving a vehicle under the influence with prison, a fine of AED 20,000 to 100,000, or both.',
        '**The 2026 crackdown.** Since 1 May 2026 a joint RTA and Dubai Police unit has patrolled tracks, main roads and soft mobility zones, checking gear, speed, reckless riding, riding two to a scooter and riding off the tracks, and impounding scooters. Its focus areas include the Jumeirah Beach track, Mohammed bin Rashid Boulevard, the Dubai Water Canal, Business Bay, Dubai Marina, Al Mankhool, Al Karama and Al Muraqqabat. [Dubai Police](https://www.dubaipolice.gov.ae/app/home/media/news/news-details?id=hqpd6zp6dfz6t85lfcz5r5nl) seized 13,657 e-scooters in the first eight months of 2026, singling out riders on roads over 60 km/h, on pavements and in markets; a campaign around the Gold Souk, announced on 5 October, seized 300 more.',
      ],
    },
    {
      heading: 'Summer heat, the Metro and the airports',
      blocks: [
        {
          list: [
            '**Heat.** Dubai’s average daily high is about 40.5 °C in July and August, 35 °C in October and 24 °C in January; an August night averages 29 °C (UAE National Center of Meteorology, via the WMO). Neither the RTA nor Dott publishes riding hours or a summer pause, so from May to October ride early or after sunset, and carry water.',
            '**At night.** Your scooter needs a white front and red rear light, and the RTA asks you to wear bright, light colours.',
            '**Metro and tram.** Since October 2024 the RTA allows folding e-scooters without a seat, at most 120 × 70 × 40 cm and 20 kg, folded from the station entrance and switched off. That’s for your own scooter: end a rental at a parking spot outside, and never ride in a station.',
            '**Dubai International (DXB).** The Metro Red Line leaves from Terminals 1 and 3, 05:00 to midnight most days (to 01:00 on Friday nights, from 08:00 on Sundays). Al Garhoud, beside the airport, is an e-scooter district.',
            '**Al Maktoum International (DWC).** No Metro: bus F55 runs to Expo Metro station and N55 to Ibn Battuta, each every 30 minutes, or take a taxi.',
          ],
        },
        'The [Dubai map](map:ae:Dubai) shows the nearest Dott scooter, its battery and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Tourists and visitors held 29% of the first permits:** 11,206 of 38,102 in the platform’s first three months from 28 April 2022.',
            '**Dubai counted 32.3 million e-scooter trips in 2024**, up from 30 million in 2023, according to the RTA.',
            '**Dott parks scooters in Hatta too.** Its open data list 14 parking spots there, nearly 100 km east of the city centre as the crow flies.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent an e-scooter in Dubai?',
      answer: 'Yes. Bring a valid international driving licence or a licence the UAE accepts; otherwise get the free RTA permit online first, with your passport and a UAE mobile number. You must be 16, or 18 with Lime.',
    },
    {
      question: 'Is the RTA e-scooter permit free, and how long is it valid?',
      answer: 'It’s free and never expires. You follow online lectures and pass a 20-question test on rta.ae or in the RTA Dubai app, in about an hour.',
    },
    {
      question: 'What is the fine for riding an e-scooter without a permit in Dubai?',
      answer: 'AED 200, the same as for riding off the designated tracks, skipping the helmet or vest, or parking badly. A passenger or reckless riding costs AED 300.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Dubai?',
      answer: 'No. You may ride only on the RTA’s designated tracks and shared streets. Riding on a pavement or a walking or jogging track costs you AED 200, and Dubai Police patrols target pavement riders.',
    },
    {
      question: 'Can I take an e-scooter on the Dubai Metro?',
      answer: 'Only your own folding scooter, without a seat, up to 20 kg and 120 × 70 × 40 cm, folded and switched off. A rental scooter stays outside: end the ride at a parking spot near the station.',
    },
    {
      question: 'What is the e-scooter speed limit in Dubai?',
      answer: '20 km/h on e-scooter tracks, or lower where signs say so, and Dott’s terms set 20 km/h for its scooters everywhere. Streets shared with cars in the residential districts have a 30 km/h limit. Speeding costs AED 100.',
    },
  ],
  sources: [
    { title: 'RTA: e-scooters in Dubai (locations, operators, safety rules)', url: 'https://www.rta.ae/wps/portal/rta/ae/home/about-rta/escooter' },
    { title: 'RTA: apply for an electrical scooter driving permit, updated 24 July 2026', url: 'https://www.rta.ae/wps/portal/rta/ae/home/rta-services/service-details?serviceId=141' },
    { title: 'RTA: e-scooter permits via the RTA Dubai and Dubai Now apps, 30 December 2025', url: 'https://www.rta.ae/wps/portal/rta/ae/home/news-and-media/all-news/NewsDetails/providing-e-scooter-permits-via-rta-dubai-and-dubai-now-apps' },
    { title: 'Executive Council Resolution No. 13 of 2022 regulating the use of cycles in Dubai (PDF)', url: 'https://www.rta.ae/wps/wcm/connect/rta/14f85ce1-1c95-4803-bfb4-85e3c2feef22/Executive-Council-Resolution-13-2022-en.pdf?MOD=AJPERES' },
    { title: 'Dubai Legal Portal: Administrative Resolution No. 654 of 2022, the implementing bylaw', url: 'https://dlp.dubai.gov.ae/Legislation%20Reference/2022/Administrative%20Resolution%20No.%20(654)%20of%202022%20Issuing%20the%20Implementing%20Bylaw.html' },
    { title: 'Dubai Media Office: RTA and Dubai Police launch the Personal Mobility Monitoring Unit, 27 April 2026', url: 'https://mediaoffice.ae/en/news/2026/april/27-04/rta-and-dubai-police-launch' },
    { title: 'Dubai Police: 13,657 electric scooters seized in eight months, 3 September 2026', url: 'https://www.dubaipolice.gov.ae/app/home/media/news/news-details?id=hqpd6zp6dfz6t85lfcz5r5nl' },
    { title: 'RTA: requirements for carrying e-scooters on the Metro and tram (PDF)', url: 'https://rta.ae/links/rail//Requirements-for-carrying-E-Scooters.pdf' },
    { title: 'Dott: terms and conditions, United Arab Emirates', url: 'https://ridedott.com/terms-and-conditions/uae/' },
    { title: 'Lime: user agreement, Dubai', url: 'https://www.li.me/en-ae/user-agreement-dubai' },
    { title: 'Dubai Airports: Metro at DXB', url: 'https://dubaiairports.ae/transport/metro' },
    { title: 'WMO World Weather Information Service: climate of Dubai', url: 'https://worldweather.wmo.int/en/city.html?cityId=1190' },
  ],
};

export default guide;
