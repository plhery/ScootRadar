import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-zurich-airport',
  topic: 'zurich-airport',
  name: 'E-scooters at Zurich Airport, Kloten and Opfikon',
  title: 'E-scooter Zurich Airport 2026: no-ride zone, Kloten, prices',
  description: 'E-scooter at Zurich Airport: why you can’t ride or park one at the terminals, where the nearest ones wait in Kloten and Glattbrugg, prices and rules.',
  headline: 'E-scooters at Zurich Airport: the no-ride zone, the nearest scooters in Kloten and Glattbrugg, prices and rules',
  lede: 'You can’t ride a rental e-scooter at Zurich Airport, or end a ride there: at the airport company’s request, the station, the Airport Center, Check-in 1 and 2 and The Circle are a no-ride and no-parking zone. The nearest scooters, from Bolt, Bird, Dott, Voi, Lime and Hopp, are a short bus ride away in Kloten or a short tram ride away in Glattbrugg and Glattpark, both part of Opfikon. Most cost CHF 1.00 to unlock plus CHF 0.41 or 0.42 a minute (published rates on 22 October 2026), and into Zürich itself the train is quicker and cheaper.',
  published: '2026-10-23',
  updated: '2026-10-28',
  city: 'ch:kloten',
  sections: [
    {
      heading: 'Can you ride an e-scooter at Zurich Airport?',
      blocks: [
        'Not a rental one. In a decision of 18 March 2025, Kloten’s town council noted that access to Zurich Airport by e-scooter is closed at the request of Flughafen Zürich AG, the airport company. PubliBike’s rental bikes, by contrast, may ride there.',
        'The operators build the closure into their apps as a no-ride and no-parking zone (Fahrverbotszone). In Bird’s, Bolt’s and Voi’s data on 22 October 2026 it took in:',
        {
          list: [
            'the airport station: the SBB platforms and the tram and bus stop;',
            'the Airport Center and the forecourts of Check-in 1 and 2;',
            'The Circle and the P6 car park;',
            'the Fracht tram stop and the Butzenbüel viewpoint.',
          ],
        },
        'Lime and Hopp close the airport too, and Dott’s area stops short of it. Meetings at The Circle therefore mean public transport and a walk from the airport station.',
        { note: 'In a no-ride zone the scooter won’t go on, and you can’t end the ride there either, so the minutes keep counting. Riding out to catch a flight? End the ride in Kloten or Glattbrugg and take the bus, tram or train for the last stretch.' },
      ],
    },
    {
      heading: 'Where are the nearest e-scooters to the airport?',
      blocks: [
        'In the two towns next door: Kloten, whose centre lies east of the terminals, and Opfikon to the south, which takes in Glattbrugg and the Glattpark district.',
        {
          table: {
            caption: 'From the airport to the nearest e-scooters (timetable for 23 October 2026; map at midday on 28 October 2026)',
            head: ['Where', 'From the airport', 'On the map'],
            rows: [
              ['Kloten station', 'Bus, about 6 minutes; 1.6 km as the crow flies', 'About 220 in Kloten: Bolt and Lime about 50 each, Bird, Hopp and Dott about 40 each, Voi 8'],
              ['Glattbrugg station, Opfikon', 'Tram 10 or 12, 5 to 6 minutes; 2.2 km as the crow flies', 'About 150 in Opfikon: Dott about 45, Bolt, Voi and Lime about 35 each, plus 1 PubliBike e-scooter'],
              ['Glattpark, Opfikon', 'Tram 10 or 12, 8 to 9 minutes', 'Counted with Opfikon'],
            ],
          },
        },
        'The counts are what the [map of Kloten](map:ch:kloten) and the [map of Opfikon](map:ch:opfikon) showed at that moment, not fleet sizes. The PubliBike vehicle was one of the e-scooters PubliBike rents out in the city of Zürich, not one of its bikes.',
      ],
    },
    {
      heading: 'Which e-scooter apps work around Zurich Airport?',
      blocks: [
        'Each town decides who may rent out scooters, so the apps differ on either side of the airport:',
        {
          list: [
            '**Kloten** licenses its operators, and in March 2025 it named Voi, Bird, Bolt, Lime and Dott. Hopp wasn’t on that list. Lime’s Kloten scooters are in no open data feed; since 28 October 2026 ScootRadar has read them from the map in Lime’s app.',
            '**Opfikon** has allowed at most four operators and 160 scooters in all since 1 January 2025. The town says all four places are taken but doesn’t name the firms; Dott, Voi, Bolt and Lime carry Opfikon’s zones in their data.',
          ],
        },
        'Every other operator on ScootRadar’s map comes from its open data, and the map shows only e-scooters, no e-bikes. Bolt, Bird, Dott, Lime and Voi rent from 18; check Hopp’s age limit in its app. Install an app and add a card before you set off; every step is in [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'What does an e-scooter cost near Zurich Airport?',
      blocks: [
        'You pay to unlock, then by the minute, and the clock runs until you end the ride, at red lights and in no-parking zones too. The table shows the operators’ published rates; the app shows the final price before you unlock.',
        {
          table: {
            caption: 'Published e-scooter rates in Kloten and Opfikon, 22 October 2026',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Dott', 'CHF 1.00', 'CHF 0.41', 'CHF 5.10', 'CHF 9.20'],
              ['Bolt', 'CHF 1.00', 'CHF 0.42 (a few at CHF 0.48)', 'CHF 5.20', 'CHF 9.40'],
              ['Voi', 'CHF 1.00', 'CHF 0.42', 'CHF 5.20', 'CHF 9.40'],
              ['Hopp (Kloten)', 'CHF 1.00', 'CHF 0.42', 'CHF 5.20', 'CHF 9.40'],
              ['Lime (Opfikon)', 'CHF 1.00', 'Mostly CHF 0.49, some CHF 0.42, before tax', 'In the app', 'In the app'],
              ['Lime (Kloten)', 'Not published', 'Not published', 'In the app', 'In the app'],
              ['Bird (Kloten)', 'Not published', 'Not published', 'In the app', 'In the app'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Riding to your hotel in Glattbrugg, Glattpark or Kloten',
      blocks: [
        'For the last few streets from a tram stop to your hotel, mind the zones: each town draws its own, and the app shows them.',
        {
          table: {
            caption: 'E-scooter zones near Zurich Airport (the towns’ rules and the operators’ data, 22 October 2026)',
            head: ['Place', 'What applies'],
            rows: [
              ['Glattbrugg and Opfikon stations, Opfikon town hall (Stadthaus), Lindbergh-Platz and Lindbergh-Allee in Glattpark, Sirius-Platz in the Opfikerpark', 'Park only in the parking zone shown in the app: all around it you can’t end a ride'],
              ['The rest of Opfikon', 'Park at the edge of the pavement with 1.50 m left free, without blocking the kerb, hydrants, bus stops, loading bays or entrances'],
              ['The Glatt river through Opfikon, and the forest east of Opfikon', 'No riding'],
              ['Glattpark and the Opfikerpark', 'Slow zone; in the Opfikerpark 10 km/h with Bolt, Dott and Lime, 5 km/h with Voi'],
              ['Kloten station', 'No riding on the platform; no parking with Dott and Hopp, and with Voi only at Voi spots'],
              ['Kloten centre: the Stadtplatz and the entrance to the Schluefweg', 'No parking; 10 km/h on the Stadtplatz'],
              ['Bus stops and regional cycle routes in Kloten', 'No parking'],
            ],
          },
        },
        'Cross the Glatt on the bridges, but don’t park on them. In any SBB station you push: riding on platforms, ramps and in underpasses is banned.',
      ],
    },
    {
      heading: 'From the airport into Zürich: why the train beats a scooter',
      blocks: [
        'Zürich main station (Zürich HB) is about 8 km from the airport as the crow flies. The timetable for Friday 23 October 2026 shows ten direct trains leaving between 10 and 11 a.m., taking 9 to 13 minutes. The airport lies in ZVV zone 121, and the city zone 110 counts as two zones, so you need a 3-zone ticket: CHF 7.20 in second class, valid for an hour on every train, tram and bus in those zones (CHF 7.40 from 13 December 2026).',
        'By scooter you would first have to leave the no-ride zone by tram or bus. From Glattbrugg station the main station is still 6 km away as the crow flies and about 8.6 km by bike route. Even at a steady 20 km/h, as fast as the motor helps, that is at least 25 minutes and more than CHF 11 at Bolt’s or Dott’s rate, before a single red light. And the station forecourt is a no-parking zone. Zürich’s own zones and parking spots are in [e-scooters in Zürich](guide:zurich).',
        'A scooter makes more sense for a short hop across the town line, to a meeting in Oerlikon for instance. In Bolt’s and Dott’s data, Kloten, Opfikon and the city of Zürich form one area, so you can ride from Glattpark (1.4 km as the crow flies) or Glattbrugg (2.4 km) to Oerlikon and end the ride there, just not at Oerlikon station, which is a no-parking zone. From the airport, trains to Oerlikon take 4 to 6 minutes; the [map of Zürich](map:ch:zurich) shows the scooters on the city side.',
      ],
    },
    {
      heading: 'Can you end a ride in another town?',
      blocks: [
        'Only inside your operator’s area. In the operators’ data on 22 October 2026:',
        {
          list: [
            '**Bolt and Dott:** Kloten, Opfikon and the city of Zürich form one area.',
            '**Voi:** its data contradicts itself here, so check the app before you cross a town line.',
            '**Bird and Hopp:** their area here is Kloten alone, so you end the ride in Kloten.',
            '**Lime:** Kloten and Opfikon are separate zones in its data, so check the app before you cross the town line.',
            '**Rümlang, Bassersdorf and Wallisellen** lie outside the areas of Bird, Bolt, Dott and Hopp. Voi marks all three as no-parking, and Lime marks Bassersdorf and Wallisellen as no-ride.',
          ],
        },
        'Outside its area the app won’t end the ride, and the minutes keep counting. Abandon a scooter there and Bolt, for one, charges up to CHF 100 to collect it.',
      ],
    },
    {
      heading: 'Swiss e-scooter rules every visitor should know',
      blocks: [
        'The towns add zones, but on the road Swiss law applies, and an e-scooter is ridden like a bike:',
        {
          list: [
            '**18+** to rent from Bolt, Bird, Dott, Lime and Voi. The law itself lets you ride from 16 without a licence, whatever your nationality.',
            '**20 km/h** is as fast as the motor helps; slow zones go lower.',
            '**Bike lane or bike path** if there is one, otherwise the road. **Not on the pavement** unless a sign allows bikes: CHF 40.',
            '**Pedestrian zones** only where a plate allows bikes, at walking pace; otherwise CHF 30.',
            '**One rider** per scooter.',
            '**Lights on**, by day too: CHF 20 without them in daylight.',
            '**Red light**: CHF 60. **Phone in hand**: CHF 40.',
            '**Helmet** recommended, not compulsory.',
            '**0.5‰** alcohol limit: from 0.5‰ you face criminal proceedings, not an on-the-spot fine.',
          ],
        },
        'If you don’t live in Switzerland, you pay a fine on the spot or leave a deposit. All fines and age limits: [e-scooter rules in Switzerland](guide:swiss-rules).',
      ],
    },
    {
      heading: 'PubliBike: rental bikes that may ride to the terminals',
      blocks: [
        'To ride all the way to the terminals, take a bike. PubliBike may ride to the airport, and its data puts a station right by the airport station’s tram and bus stop. Opfikon has seven, among them Glattbrugg and Opfikon stations, Sirius-Platz, the Ambassador House on Thurgauerstrasse and the Hotel Hilton Zurich Airport.',
        'You can return a bike at any station in Opfikon, Zürich, Kloten, Wallisellen or Dübendorf. ScootRadar’s map shows PubliBike’s e-scooters but not these bikes; the PubliBike app shows them, with its prices.',
      ],
    },
  ],
  faq: [
    {
      question: 'Can I leave a rental e-scooter at Zurich Airport?',
      answer: 'No. From the station and Check-in 1 and 2 to The Circle and the P6 car park, the airport is a no-ride and no-parking zone for rental scooters, at the airport company’s request. End the ride in Kloten or Glattbrugg and take the bus or tram, about 6 minutes.',
    },
    {
      question: 'Can I ride an e-scooter from Zurich Airport into Zürich?',
      answer: 'Not from the airport itself, since scooters can’t ride or park there. Bolt and Dott let you ride from Kloten or Opfikon into the city and end the ride there, outside its no-parking zones. To the main station, though, the direct train takes 9 to 13 minutes and a 3-zone ZVV ticket costs CHF 7.20 (CHF 7.40 from 13 December 2026).',
    },
    {
      question: 'Do tourists need a licence to rent an e-scooter in Switzerland?',
      answer: 'No. From 16 no licence is needed, whatever your nationality, and Bolt, Bird, Dott, Lime and Voi rent from 18 without asking for Swiss residence. If the police fine you and you don’t live in Switzerland, you pay on the spot or leave a deposit.',
    },
    {
      question: 'Why won’t the app let me end my ride?',
      answer: 'You are in a no-ride or no-parking zone, or outside your operator’s area: at the airport, next to a parking zone at Glattbrugg or Opfikon station, or with Bird or Hopp outside Kloten. The minutes keep counting until you reach a place where the app lets you stop.',
    },
    {
      question: 'Is there a night ban on e-scooters around Zurich Airport?',
      answer: 'No. Neither Kloten’s nor Opfikon’s rules hold a night ban or a winter break, and none of the zones in the operators’ open data carried a time limit on 22 October 2026.',
    },
  ],
  sources: [
    { title: 'Kloten town council: decision 89-2025 on an e-scooter fee, 18 March 2025 (PDF, German)', url: 'https://www.kloten.ch/_rte/dokument/5617204' },
    { title: 'Town of Opfikon: e-scooter sharing regulations, 2025 (PDF, German)', url: 'https://www.opfikon.ch/_rte/dokument/5332909' },
    { title: 'Town of Opfikon: e-scooter zone map of 21 September 2026 (PDF, German)', url: 'https://www.opfikon.ch/_rte/dokument/7259647' },
    { title: 'Town of Opfikon: e-scooters (German)', url: 'https://www.opfikon.ch/dienstleistungen/110935' },
    { title: 'Town of Opfikon: sharing services and PubliBike stations (German)', url: 'https://www.opfikon.ch/mobilitaet/27956' },
    { title: 'Zürich city council decision 1828/2026 on PubliBike e-scooters (PDF, German)', url: 'https://www.stadt-zuerich.ch/content/dam/web/de/politik-verwaltung/politik-recht/stadtratsbeschluesse/2026/05/stzh-strb-2026-1828.pdf' },
    { title: 'ZVV: single tickets and prices (German)', url: 'https://www.zvv.ch/de/abos-und-tickets/tickets/einzelbillette.html' },
    { title: 'ZVV: prices from 13 December 2026 (PDF, German)', url: 'https://www.zvv.ch/content/dam/markt/tarif-und-fahrausweiskontrolle/verbundtarif/2027/Preise%20ab%2013.12.2026.pdf' },
    { title: 'ZVV: frequently asked questions, zones 110 and 121', url: 'https://www.zvv.ch/en/service/customer-service/frequently-asked-questions.html' },
    { title: 'Swiss Ordinance on Fixed Penalties, list of fines (German)', url: 'https://www.fedlex.admin.ch/eli/cc/2019/93/de' },
  ],
};

export default guide;
