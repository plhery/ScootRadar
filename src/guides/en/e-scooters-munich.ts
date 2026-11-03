import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-munich',
  topic: 'munich',
  name: 'Renting an e-scooter in Munich',
  title: 'E-scooter hire Munich 2026: Dott, Voi, Lime, Bolt prices',
  description: 'Rent a Voi, Lime, Dott or Bolt e-scooter in Munich: 18+, no licence. Ten minutes cost €3.59 on Voi, €4.00 on Dott. Old-town bays, no English Garden or U-Bahn.',
  headline: 'E-scooters in Munich: apps, prices, parking and the Oktoberfest rules',
  lede: 'To rent an e-scooter in Munich, use the Dott, Lime, Voi or Bolt app: you must be 18 and have a payment card, but need no driving licence. Ten minutes cost €3.59 with Voi and €4.00 with Dott at their standard rates (as of November 2026); Lime and Bolt show their price in the app. In the old town you end a ride only at a marked bay, the English Garden is off limits, and MVG bans e-scooters from its U-Bahn, trams and buses.',
  published: '2026-10-13',
  updated: '2026-10-25',
  city: 'de:München',
  sections: [
    {
      heading: 'Which e-scooter apps work in Munich?',
      blocks: [
        'The city and MVV, Munich’s public transport network, list four e-scooter operators: **Dott**, **Lime**, **Voi** and **Bolt**. If an older guide mentions Tier, that’s Dott now: the two merged.',
        'At 9:27 on Friday 30 October 2026 the [map around Munich](map:de:München) showed about 3,400 Dott, 6,700 Voi and 3,600 Bolt scooters free to rent at that moment, and about 9,400 Lime scooters as last counted.',
        'You rent in the operator’s app; Dott and Voi also work in **MVGO**, the app of MVG, Munich’s transport company, with an M-Login account. MVV says all four rent only to riders of 18 or over, as Dott’s and Bolt’s terms confirm, although German law allows e-scooters from 14. Step by step: [how to rent an e-scooter](guide:how-to-rent).',
        'MVV also lists **emmy**, which rents e-mopeds, not e-scooters.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Munich?',
      blocks: [
        'You pay to unlock, then by the minute. Dott and Voi publish their Munich standard rates as open data, Bolt gives a starting price for all of Germany, and Lime shows its price in the app.',
        {
          table: {
            caption: 'E-scooter prices in Munich (standard rates from Voi, Dott and Bolt, as of November 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Voi', '€0.99', '€0.26', '€3.59', '€6.19'],
              ['Dott', '€1.00', '€0.30', '€4.00', '€7.00'],
              ['Bolt', 'Small fee, shown in the app', 'From €0.15 (for all of Germany)', 'In the app', 'In the app'],
            ],
          },
        },
        'The app shows the final price before you unlock. Staying a while? Bolt sells minute passes and unlimited unlocks from €0.99 a month (prices for all of Germany).',
      ],
    },
    {
      heading: 'Where to ride: pedestrian zones, the English Garden and parks',
      blocks: [
        'Ride on the bike lane or path (Radweg) where there is one, otherwise on the road. Pavements and pedestrian zones are off limits, including Neuhauser Strasse and Kaufingerstrasse between Stachus and Marienplatz: Dott also bars riding there and on the Viktualienmarkt, so get off and push.',
        '**The English Garden is closed to e-scooters**, parked ones included. The Bavarian Palace Administration, which runs the park, explains why: e-scooters count as motor vehicles, and the city’s landscape protection rules keep those out. Going to the Chinese Tower or the Eisbach surfers? Leave the scooter outside and walk in. Riding and parking are also banned in Nymphenburg Palace Park, the Hofgarten, the Maximiliansanlagen and every landscape protection area.',
        'Dott bars riding in most of the Olympiapark and ending a ride at the Flaucher on the Isar (as of November 2026). Each app shows its own zones; zoom in on the [map](map:de:München) for the city’s bays and zones and Dott’s.',
        'Cross tram rails as close to a right angle as you can. Munich is mostly flat; the climbs lead up from the Isar, at the Gasteig or the Nockherberg, for example.',
      ],
    },
    {
      heading: 'E-scooter parking in Munich: old-town bays and 100-metre zones',
      blocks: [
        'Since 5 August 2022, inside the Altstadtring, the ring road around the old town, you can end a ride only at a marked bay, such as at Stachus, Rindermarkt, Sendlinger Tor or on Maximilianstrasse. Bays may close during events; the app shows which you can use.',
        'Across the city, Munich is adding parking bays for rental scooters: 375 in April 2024, according to dpa, with 675 planned by 2026. Dott draws a 100 m circle around many bays outside the old town, and inside it you can end a ride only in the bay itself (Dott’s zones, as of November 2026).',
        'Elsewhere you may park freely, as long as you follow the operators’ commitment to the city:',
        {
          list: [
            'leave at least 1.80 m of pavement clear;',
            'stay out of pedestrian zones, parks and roadside grass;',
            'keep off S-Bahn and U-Bahn ramps, away from bike racks and at least 10 m from bus and tram stops;',
            'avoid bridges, where parked scooters are unwelcome.',
          ],
        },
        {
          note: 'If the app won’t end your ride, you’re in the old town outside a bay, inside one of Dott’s 100 m circles around a bay, or in an operator’s no-parking zone. Ride on to a bay or out of the zone: the minutes keep running.',
        },
        'Take a photo of the parked scooter even if the app doesn’t ask: it shows how you left it if the operator later charges a fee.',
      ],
    },
    {
      heading: 'What bad parking costs in Munich',
      blocks: [
        'If your parked scooter gets in people’s way, city traffic wardens or the police can fine you €20, or €30 if it endangers them. From 1 March 2027, parking on a pavement or bike lane where it isn’t allowed costs from €55.',
        'The operators add their own charges:',
        {
          table: {
            caption: 'What Dott and Bolt charge for bad parking (German terms, as of November 2026)',
            head: ['Operator', 'What it can cost'],
            rows: [
              ['Dott', 'Up to €300 to recover the scooter if you ignore its parking or locking instructions; official fines plus a €50 admin fee'],
              ['Bolt', '€15 if badly parked without a clear end-of-ride photo; up to €100 to fetch one left outside the parking area; fines plus an admin fee of up to €30 (terms from 1 December 2026)'],
            ],
          },
        },
        'Voi’s and Lime’s charges are in their own terms.',
      ],
    },
    {
      heading: 'Can you ride an e-scooter to Oktoberfest?',
      blocks: [
        'Only part of the way. Munich sets e-scooter rules for each Oktoberfest, the Wiesn to locals, around its grounds on the Theresienwiese. In 2026, when it ran from 19 September to 4 October, these applied to rental scooters:',
        {
          list: [
            '**Inside the outer cordon** (Äusserer Sperrring): no riding or parking, as for cars. Twelve bays lined the cordon.',
            '**From 5 pm to 6 am:** no renting or parking up to about a kilometre beyond it, in parts of the Westend and the station district and on Sonnenstrasse between Sendlinger Tor and Stachus. You could still park at marked bays.',
            '**From 3 pm to 6 am:** renting only after passing a reaction test in the app.',
          ],
        },
        'The official site oktoberfest.de puts Hackerbrücke, the Hauptbahnhof (main station) and Stachus in the 5 pm zone and is blunt: e-scooters and the Wiesn don’t go together. Expect similar rules next time and check the app.',
        '**Plan your way home without a scooter.** The reaction test, the city says, is there to remind riders that a car’s alcohol limits apply, and a drunk ride can cost you your driving licence too (see the rules below).',
      ],
    },
    {
      heading: 'U-Bahn, S-Bahn and the airport: what MVG and MVV allow',
      blocks: [
        'Since April 2024, MVV says, e-scooters, folded or not, may not travel on MVG’s U-Bahn trains, trams and city buses, because of battery fires. Rental scooters can’t go on the S-Bahn or regional trains either: they don’t fold and are too big and heavy.',
        'Your own scooter may travel folded and free of charge on the S-Bahn, regional trains and regional buses, if it is no larger than 90 × 80 cm and no heavier than 25 kg. With a rental, end the ride outside the station and rent another at the other end.',
        '**Airport:** the terminals lie outside Dott’s area (as of November 2026), so take the S-Bahn there and keep scooters for town.',
      ],
    },
    {
      heading: 'MyRadl and MVGO: rent a bike instead',
      blocks: [
        '**MyRadl** has been the bike-sharing scheme for Munich and 36 towns around it since 7 May 2026, set up by MVV, the city and the surrounding districts and run by nextbike. You pick up and return the bikes at MyRadl stations.',
        {
          list: [
            '**Bike:** €1 per 30 minutes; day rate €9 per ride.',
            '**E-bike:** €3 per 30 minutes; day rate €18 per ride.',
            '**With an MVG subscription (not the €365 pupils’ ticket) or a Deutschlandticket bought in the MVV app:** the first 30 minutes are free on a bike, €1.50 on an e-bike.',
          ],
        },
        'Book in the MVV app, the nextbike app or **MVGO**, where your M-Login also unlocks Dott and Voi scooters (Lime and Bolt you rent in their own apps). To see the nearest free scooter right now, open the [live map of Munich](map:de:München).',
      ],
    },
    {
      heading: 'Munich e-scooter rules: age, alcohol and fines',
      blocks: [
        'Munich follows Germany’s national rules. From 1 March 2027, e-scooters will be treated much like bicycles. The essentials:',
        {
          table: {
            caption: 'E-scooter rules in Germany, today and from 1 March 2027',
            head: ['Rule', 'Today', 'From 1 March 2027'],
            rows: [
              ['Age, licence, helmet', '14 by law, no licence, no helmet required (one is still wise); 18 to rent', 'Unchanged'],
              ['Where to ride', 'Bike lane or path (Radweg) where there is one, otherwise the road; at most 20 km/h by design', 'Bike lanes compulsory where a blue bike sign stands, as for cyclists'],
              ['Pavement (Gehweg) or pedestrian zone', 'Banned unless a sign allows it: €15', 'Banned unless a sign allows it: €25'],
              ['Passengers', 'Banned: €10', 'Banned: €25'],
              ['Red light', '€60 and 1 point', 'Unchanged'],
              ['Phone in hand', '€100 and 1 point', 'New rate, not yet officially explained'],
              ['Alcohol', '0.5‰: €500, 2 points, one-month driving ban that covers cars too. From 1.1‰: a crime, licence usually lost. Under 21 or in your probationary period as a new driver: 0.0‰', 'Unchanged'],
            ],
          },
        },
        'Riding in Berlin too? Its parking rules differ: see [e-scooters in Berlin](guide:berlin).',
        '**A voluntary commitment, for now.** Operators in Munich have signed one with the city, revised in April 2022: at most 100 scooters each in the old town and 1,000 more inside the Mittlerer Ring, the middle ring road; no more than four in one spot within 100 m; badly parked ones collected within 24 hours.',
        'On 19 April 2024 the city’s Mobility Department counted 18,698 rental e-scooters, according to dpa. From 1 March 2027, setting out rental scooters stops counting as parking under German road rules, and cities can then require a permit for it.',
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent e-scooters in Munich?',
      answer: 'Yes. Download the Dott, Lime, Voi or Bolt app, register and add a payment card: you must be 18 but need no driving licence.',
    },
    {
      question: 'Is Lime available in Munich?',
      answer: 'Yes, alongside Dott, Voi and Bolt; the city lists all four. Check the price in its app before you unlock; you can’t book Lime in MVGO. Its free scooters are on the [live map of Munich](map:de:München).',
    },
    {
      question: 'Can I take an e-scooter home from Oktoberfest?',
      answer: 'Not from near the grounds in the evening. In 2026 you couldn’t rent one from 5 pm to 6 am up to about a kilometre beyond the outer cordon, Hackerbrücke, the Hauptbahnhof and Stachus included. After a few beers, don’t ride at all: from 0.5‰ it costs €500 and a driving ban.',
    },
    {
      question: 'Why can’t I end my ride in Munich’s old town?',
      answer: 'Inside the Altstadtring you can end a ride only at a marked bay, and with Dott also within 100 m of many bays elsewhere in the city. Ride to the nearest bay in the app: the minutes keep running until you do.',
    },
    {
      question: 'Can you ride e-scooters in the English Garden?',
      answer: 'No. E-scooters count as motor vehicles, which the park’s landscape protection rules ban, parked ones included. Leave yours outside the park and walk in.',
    },
  ],
  sources: [
    { title: 'City of Munich, Mobility Department: e-scooter sharing (German)', url: 'https://muenchenunterwegs.de/angebote/elektrotretroller-sharing' },
    { title: 'City of Munich: safety and checks at Oktoberfest 2026 (German)', url: 'https://stadt.muenchen.de/news/oktoberfest-2026-sicherheit-und-kontrollen.html' },
    { title: 'oktoberfest.de: to the Wiesn by e-scooter (German)', url: 'https://www.oktoberfest.de/informationen/service-fuer-besucher/mit-dem-e-scooter-zur-wiesn' },
    { title: 'MVV: scooter sharing in Munich and taking scooters on buses and trains (German)', url: 'https://www.mvv-muenchen.de/vernetzte-mobilitaet/shared-mobility/scootersharing/' },
    { title: 'Bavarian Palace Administration: English Garden, notes for visitors (PDF, German)', url: 'https://www.schloesser.bayern.de/deutsch/service/infomat/screen-pdf/engl-garten_dt.pdf' },
    { title: 'muenchen.de: MyRadl, rental bikes for the Munich region (German)', url: 'https://www.muenchen.de/verkehr/aktuell/myradl-im-mvv-muenchen-leihfahrraeder-fuer-die-region' },
    { title: 'dpa in inFranken.de: Nuremberg and Munich on rental e-scooters, 26 April 2024 (German)', url: 'https://www.infranken.de/lk/nuernberg/nuernberg-stadt-ergreift-massnahmen-wegen-e-scootern-kommt-ein-verbot-art-5860300,PRINT' },
    { title: 'MVG: MVGO app and its sharing features (German)', url: 'https://www.mvg.de/services/unsere-apps/mvgo.html' },
    { title: 'Dott: open data feed for Munich with prices and zones (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/munich/gbfs.json' },
    { title: 'Voi: Munich rates in its open data (NeTEx)', url: 'https://api.voiapp.io/gbfs/open/v1/150/netex.xml' },
    { title: 'Bolt: e-scooters in Germany (German)', url: 'https://bolt.eu/de-de/scooters/' },
    { title: 'Dott: terms and conditions for Germany (German)', url: 'https://ridedott.com/de/allgemeine/deutschland/' },
    { title: 'Bolt: terms for e-vehicles in Germany, from 1 December 2026 (German)', url: 'https://bolt.eu/de-de/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Federal Ministry for Transport: questions and answers on e-scooters (German)', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq.html' },
  ],
};

export default guide;
