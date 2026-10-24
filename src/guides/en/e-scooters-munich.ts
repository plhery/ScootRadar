import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-munich',
  topic: 'munich',
  name: 'Renting an e-scooter in Munich',
  title: 'E-scooter Munich 2026: apps, prices, parking, Oktoberfest',
  description: 'Rent an e-scooter in Munich: the four apps, what ten minutes cost, where to park in the old town, and the rules for the English Garden, Oktoberfest and U-Bahn.',
  headline: 'E-scooters in Munich: apps, prices, parking and the Oktoberfest rules',
  lede: 'To rent an e-scooter in Munich, use the Dott, Lime, Voi or Bolt app: you must be 18 and have a payment card, but need no driving licence. Ten minutes cost €4.00 with Dott and €3.59 with Voi (published rates, 12 October 2026); Lime and Bolt show their price in the app. In the old town you end a ride only at a marked bay, the English Garden is off limits, and MVG bans e-scooters from its U-Bahn, trams and buses.',
  published: '2026-10-13',
  updated: '2026-10-24',
  city: 'de:München',
  sections: [
    {
      heading: 'Which e-scooter apps work in Munich?',
      blocks: [
        'The city and MVV, Munich’s public transport network, list four e-scooter operators: **Dott**, **Lime**, **Voi** and **Bolt**. If an older guide mentions Tier, that’s Dott now: the two merged.',
        'ScootRadar shows Dott and, since 24 October 2026, Voi on the [map around Munich](map:de:München): at 15:55 that Saturday, about 3,600 Dott and 6,800 Voi scooters, a snapshot, not the fleets. Find Lime and Bolt in their own apps.',
        'You rent in the operator’s app; Dott and Voi also work in **MVGO**, the app of MVG, Munich’s transport company, with an M-Login account. All four rent only to riders of 18 or over, although German law allows e-scooters from 14. Step by step: [how to rent an e-scooter](guide:how-to-rent).',
        'MVV also lists **emmy**, but it rents e-mopeds, not e-scooters: they need a driving licence and a helmet.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Munich?',
      blocks: [
        'You pay to unlock, then by the minute. Dott publishes its Munich rate in its public data feed and Voi on its Munich page; Lime and Bolt publish no Munich rate, so check their apps.',
        {
          table: {
            caption: 'E-scooter prices in Munich (published rates, 12 October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Dott', '€1.00', '€0.30', '€4.00', '€7.00'],
              ['Voi', '€0.99', '€0.26', '€3.59', '€6.19'],
              ['Lime', 'In the app', 'In the app', 'In the app', 'In the app'],
              ['Bolt', 'Small fee, amount not given', 'From €0.15 (for all of Germany)', 'In the app', 'In the app'],
            ],
          },
        },
        'Voi says its prices can vary with place, time and vehicle, and Lime’s German terms charge every started minute as a full one. The app shows the final price before you unlock.',
        'Staying a while? Passes include the unlocks: Voi sells minute bundles and the Voi Pass, and Bolt sells unlimited unlocks in Germany from €0.99 a month.',
      ],
    },
    {
      heading: 'Where to ride: pedestrian zones, the English Garden and parks',
      blocks: [
        'Ride on the bike lane or path (Radweg) where there is one, otherwise on the road. Pavements and pedestrian zones are off limits, including Neuhauser Strasse and Kaufingerstrasse between Stachus and Marienplatz: Dott’s zone data marks them and the Viktualienmarkt as no-riding zones, so get off and push.',
        '**The English Garden is closed to e-scooters**, parked ones included. The Bavarian Palace Administration, which runs the park, explains why: e-scooters count as motor vehicles, and the city’s landscape protection rules keep those out. Going to the Chinese Tower or the Eisbach surfers? Leave the scooter outside and walk in. Riding and parking are also banned in Nymphenburg Palace Park, the Hofgarten, the Maximiliansanlagen and every landscape protection area.',
        'In Dott’s zone data (12 October 2026) you can’t ride in the Olympiapark, nor end a ride at the Flaucher on the Isar. Each app shows its own zones.',
        'Our advice: cross tram rails as close to a right angle as you can. Munich is mostly flat; the climbs lead up from the Isar, at the Gasteig or the Nockherberg, for example.',
      ],
    },
    {
      heading: 'E-scooter parking in Munich: old-town bays and 100-metre zones',
      blocks: [
        'Since 5 August 2022, inside the Altstadtring, the ring road around the old town, you can end a ride only at a marked bay, such as at Stachus, Rindermarkt, Sendlinger Tor or on Maximilianstrasse. Bays may close during events; the app shows which you can use.',
        'Across the city, Munich is adding shared bays for scooters and rental bikes, mostly on former car parking spaces: 365 at the end of June 2026, of 675 planned. Within 100 m of each, you can end a ride only in the bay itself.',
        'Elsewhere you may park freely, as long as you:',
        {
          list: [
            'leave at least 1.80 m of pavement clear;',
            'stay out of pedestrian zones, parks and roadside grass;',
            'keep off S-Bahn and U-Bahn ramps, away from bike racks and at least 10 m from bus and tram stops;',
            'avoid bridges, where parked scooters are unwelcome.',
          ],
        },
        {
          note: 'If the app won’t end your ride, you’re in the old town outside a bay, within 100 m of a bay, or in an operator’s no-parking zone. Ride on to a bay or out of the zone: the minutes keep running.',
        },
        'Take a photo of the parked scooter even if the app doesn’t ask: it shows how you left it if the operator later charges a fee.',
      ],
    },
    {
      heading: 'What bad parking costs in Munich',
      blocks: [
        'If your parked scooter gets in people’s way, city traffic wardens or the police can fine you €20. From 1 March 2027, parking on a pavement or bike lane where it isn’t allowed costs from €55.',
        'The operators add their own charges:',
        {
          table: {
            caption: 'What operators charge for bad parking (German terms, October 2026)',
            head: ['Operator', 'What it can cost'],
            rows: [
              ['Dott', 'Up to €300 to collect the scooter if you ignore parking or locking instructions; official fines plus a €50 handling fee'],
              ['Voi', '€25 for breaking parking rules, though Voi says it tries to warn you first; official fines and fees passed on'],
              ['Bolt', '€15 if badly parked without a clear end-of-ride photo; up to €100 to fetch one left outside the area; fines plus a handling fee of up to €30 (terms from 1 December 2026)'],
              ['Lime', 'No fixed fee; fines, towing and impound costs passed on'],
            ],
          },
        },
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
        'The official site oktoberfest.de puts Hackerbrücke, the Hauptbahnhof (main station) and Stachus in the 5 pm zone and is blunt: e-scooters and the Wiesn don’t go together. Zones with a 5 pm cut-off date back to 2019, so expect similar rules next time and check the app.',
        '**Plan your way home without a scooter.** Police checks around the 2022 Wiesn found 314 drunk e-scooter rides, down from 419 in 2019. A car’s alcohol limits apply, and a drunk ride can cost you your driving licence too (see the rules below).',
      ],
    },
    {
      heading: 'U-Bahn, S-Bahn and the airport: what MVG and MVV allow',
      blocks: [
        'Since 2 April 2024, MVG has banned e-scooters, folded or not, from its U-Bahn trains, trams and city buses and from U-Bahn stations. Rental scooters can’t go on the S-Bahn or regional trains either: they don’t fold, and the operators forbid it.',
        'Your own scooter may travel folded and free of charge on the S-Bahn, regional trains and regional buses, if it is no larger than 90 × 80 cm and no heavier than 25 kg. With a rental, end the ride outside the station and rent another at the other end.',
        '**Airport:** Dott’s zone data puts the terminals outside its area, and we haven’t checked the other operators, so take the S-Bahn there and keep scooters for town.',
      ],
    },
    {
      heading: 'MyRadl and MVGO: rent a bike instead',
      blocks: [
        '**MyRadl**, the successor to MVG Rad, has been the bike-sharing scheme for Munich and 36 towns around it since 7 May 2026, run by nextbike for MVV. You pick up and return the bikes at MyRadl stations.',
        {
          list: [
            '**Bike:** €1 per 30 minutes; day rate €9 per ride.',
            '**E-bike:** €3 per 30 minutes; day rate €18 per ride.',
            '**With an MVG subscription (not the €365 pupils’ ticket) or a Deutschlandticket bought in the MVV app:** the first 30 minutes are free on a bike, €1.50 on an e-bike.',
          ],
        },
        'Book in the MVV app, the nextbike app or **MVGO**, where your M-Login also unlocks Dott and Voi scooters (but not Lime or Bolt). To see where the nearest Dott or Voi stands right now, open the [live map of Munich](map:de:München).',
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
        '**No permit and no binding cap, for now.** In Bavaria, operators need no city permit and pay no fees. All signed a voluntary commitment, revised in April 2022: at most 100 scooters each in the old town and 1,000 more inside the Mittlerer Ring, the middle ring road; no more than four in one spot; badly parked ones collected within 24 hours.',
        'The fleet has grown fast: police counted about 4,000 rental e-scooters in 2019 and about 12,000 in 2022; in April 2024 the city counted 18,698, according to press reports. From 1 March 2027, setting out rental scooters will need a city permit across Germany, and Munich wants to attach fleet caps and fees. As of 12 October 2026 we had found no council decision or figures.',
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
      answer: 'Yes, alongside Dott, Voi and Bolt. Lime publishes no Munich rate, so check the price in its app before you unlock; it charges every started minute in full. You can’t book Lime in MVGO.',
    },
    {
      question: 'Can I take an e-scooter home from Oktoberfest?',
      answer: 'Not from near the grounds in the evening. In 2026 you couldn’t rent one from 5 pm to 6 am up to about a kilometre beyond the outer cordon, Hackerbrücke, the Hauptbahnhof and Stachus included. After a few beers, don’t ride at all: from 0.5‰ it costs €500 and a driving ban.',
    },
    {
      question: 'Why can’t I end my ride in Munich’s old town?',
      answer: 'Inside the Altstadtring you can end a ride only at a marked bay, and within 100 m of any shared bay in the city only in the bay itself. Ride to the nearest bay in the app.',
    },
    {
      question: 'Can you ride e-scooters in the English Garden?',
      answer: 'No. E-scooters count as motor vehicles, which the park’s landscape protection rules ban, parked ones included. Leave yours outside the park and walk in.',
    },
  ],
  sources: [
    { title: 'City of Munich, Mobility Department: e-scooter sharing (German)', url: 'https://muenchenunterwegs.de/angebote/elektrotretroller-sharing' },
    { title: 'Munich Mobility Department: reply on parking bays and special-use permits, 30 June 2026 (German)', url: 'https://risi.muenchen.de/risi/dokument/v/9784088' },
    { title: 'City of Munich: safety and checks at Oktoberfest 2026 (German)', url: 'https://stadt.muenchen.de/news/oktoberfest-2026-sicherheit-und-kontrollen.html' },
    { title: 'oktoberfest.de: to the Wiesn by e-scooter (German)', url: 'https://www.oktoberfest.de/informationen/service-fuer-besucher/mit-dem-e-scooter-zur-wiesn' },
    { title: 'MVV: scooter sharing in Munich and taking scooters on buses and trains (German)', url: 'https://www.mvv-muenchen.de/vernetzte-mobilitaet/shared-mobility/scootersharing/' },
    { title: 'Bavarian Palace Administration: English Garden, notes for visitors (PDF, German)', url: 'https://www.schloesser.bayern.de/deutsch/service/infomat/screen-pdf/engl-garten_dt.pdf' },
    { title: 'muenchen.de: MyRadl, rental bikes for the Munich region (German)', url: 'https://www.muenchen.de/verkehr/aktuell/myradl-im-mvv-muenchen-leihfahrraeder-fuer-die-region' },
    { title: 'Dott: public price feed for Munich (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/munich/system_pricing_plans.json' },
    { title: 'Voi: e-scooters in Munich', url: 'https://www.voi.com/city/munich' },
    { title: 'Munich police: Oktoberfest 2022 final report (PDF, German)', url: 'https://www.polizei.bayern.de/mam/presse/pp-muenchen/pressebericht_sonderbeilage_abschlussbilanz_wiesn_2022.pdf' },
    { title: 'Federal Ministry for Transport: questions and answers on e-scooters (German)', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq.html' },
  ],
};

export default guide;
