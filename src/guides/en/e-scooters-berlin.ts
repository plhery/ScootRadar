import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-berlin',
  topic: 'berlin',
  name: 'Renting an e-scooter in Berlin',
  title: 'E-scooter Berlin 2026: apps, prices and parking rules',
  description: 'Rent an e-scooter in Berlin: the five apps, what a ride costs, where to park near the sights, why parks are off limits, the U-Bahn ban and the rules.',
  headline: 'E-scooters in Berlin: apps, prices, parking zones and the rules',
  lede: 'To rent an e-scooter in Berlin, use the Lime, Bolt, Voi or Dott app (Zeus in Spandau and Reinickendorf): you must be 18 and have a payment card, but need no driving licence. Dott charges €0.75 to unlock plus €0.29 a minute, about €3.65 for ten minutes (published rate on 12 October 2026); the others show their price in the app. Ride on the bike lane, never on the pavement or through a park, and around the sights of Mitte end your ride only at a marked bay such as a Jelbi point.',
  published: '2026-10-12',
  updated: '2026-10-25',
  city: 'de:Berlin',
  sections: [
    {
      heading: 'Which e-scooter apps work in Berlin?',
      blocks: [
        'Five companies rent out e-scooters in Berlin, all under city permits that run until 31 March 2027:',
        {
          list: [
            '**Lime**, **Bolt** and **Voi**: city-wide, and also bookable in Jelbi, the app of Berlin’s transport company BVG.',
            '**Dott**: city-wide, and also bookable in Jelbi. Dott merged with Tier, and Tier riders have used the Dott app since October 2024.',
            '**Zeus**: only in the outer districts of Spandau and Reinickendorf.',
          ],
        },
        'Bird no longer runs in Berlin. Inside the S-Bahn ring, the circle line around the centre, the city allows at most 19,000 rental e-scooters, split evenly among the four operators there; outside it there is no cap.',
        'At the end of every ride you take a photo of the parked scooter: Berlin’s permits require proof like this. Step-by-step help is in [how to rent an e-scooter](guide:how-to-rent).',
        'ScootRadar shows Dott, Voi since 24 October 2026 and Lime since 25 October on the [map around Berlin](map:de:Berlin): at 15:55 on Saturday 24 October, about 4,800 Dott and 14,400 Voi scooters, and on Sunday morning, 25 October, about 15,400 Lime scooters, a snapshot, not the fleets. Find Bolt and Zeus in their own apps.',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Berlin?',
      blocks: [
        'You pay to unlock, then by the minute. Dott is the only operator whose Berlin rate we found, in its public data feed; Bolt gives a starting price for all of Germany.',
        {
          table: {
            caption: 'E-scooter prices in Berlin as of 12 October 2026',
            head: ['Operator', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Dott (data feed, 12 October 2026)', '€0.75', '€0.29', 'about €3.65', 'about €6.55'],
              ['Bolt (bolt.eu, Germany)', 'Small fee', 'From €0.15, varies by location', 'In the app', 'In the app'],
              ['Lime, Voi, Zeus', 'In the app', 'In the app', 'In the app', 'In the app'],
            ],
          },
        },
        'The app shows the final price before you unlock; prices on older pages, the city’s English portal included, are out of date. For regular riders there are passes: Bolt sells unlimited unlocks in Germany from €0.99 a month, and Voi sells subscriptions and minute packs.',
      ],
    },
    {
      heading: 'Berlin e-scooter rules: where to ride, parks and the law',
      blocks: [
        'The German rules in brief. From 1 March 2027, e-scooters will be treated much like bicycles.',
        {
          table: {
            caption: 'E-scooter rules in Germany, today and from 1 March 2027',
            head: ['Rule', 'Today', 'From 1 March 2027'],
            rows: [
              ['Age, licence, helmet', '14 by law, no licence, no helmet required; 18 to rent', 'Unchanged'],
              ['Where to ride', 'Bike lane or path (Radweg) where there is one, otherwise the road; pedestrian zones only where a sign allows it', 'Bike lanes compulsory where a blue bike sign stands, as for cyclists'],
              ['Pavement (Gehweg)', 'Banned unless a sign allows it: €15', 'Banned unless a sign allows it: €25'],
              ['Passengers', 'Banned', 'Banned: €25'],
              ['Red light', '€60 and 1 point', 'Unchanged'],
              ['Phone in hand', '€100 and 1 point', 'New rate, not yet officially explained'],
              ['Alcohol', '0.5‰: €500, 2 points, one-month driving ban that covers cars too. From 1.1‰: a crime, licence usually lost. Under 21 or in your probationary period as a new driver: 0.0‰', 'Unchanged'],
            ],
          },
        },
        'Riding two up is a common mistake: in 2025 Berlin police recorded 1,087 e-scooter rides with two or more people on board, more than red-light offences (1,012).',
        '**Stay out of the parks.** Berlin’s public parks (Grünanlagen) are closed to motor vehicles, and in German law an e-scooter is one. Look for the **tulip sign** at the entrance: a triangle with a green border and a tulip. Riding or parking there can cost up to €55 on the spot, which is what TV satirist Jan Böhmermann paid for riding through the Tiergarten, the Berliner Zeitung reported in March 2024. Grün Berlin, which runs Tempelhofer Feld, says motor vehicles are banned there too.',
        'No zone slows you down automatically: the Senate says throttling a moving scooter isn’t currently legal in Germany. Slow down yourself on cobblestones, and cross tram tracks as close to a right angle as you can.',
      ],
    },
    {
      heading: 'E-scooter parking in Berlin: Jelbi bays, red zones and the pavement',
      blocks: [
        'If there’s a marked bay nearby, the scooter goes there: a Jelbi point or station run by BVG, or a district bay. Around each bay is a no-parking zone of at least 100 m where the app won’t let you end the ride. In April 2026 no-parking zones covered 28 of the 88 km² inside the S-Bahn ring, almost a third.',
        'In Lime’s app, for example, bays show a blue P or a yellow Jelbi “J”, and red zones mean no parking. Away from bays you may park on the pavement if 2.30 m stays clear for people walking. These places are always off limits, with at least 1.5 m kept clear before and after each:',
        {
          list: [
            'at a bus or tram stop: 25 m either side of the stop sign under the permits since April 2025 (some pages still give the old 15 m);',
            'at the entrance to a building or a U-Bahn or S-Bahn station;',
            'at a pedestrian crossing, driveway or fire lane, or within 10 m of a junction;',
            'on a bike lane or the tactile paving for blind people, or in a pedestrian zone;',
            'in a park, a cemetery or a tree pit;',
            'on a bridge used by pedestrians, unless there’s a marked bay on it.',
          ],
        },
        '**Tip:** you may leave the scooter in a car parking space at the kerb, free of charge: a 2022 change to Berlin’s parking-fee rules exempts e-scooters, to get them off the pavement. It works wherever the app lets you end the ride. At events and building sites you may be unable to end a ride for a while; operators must warn you in the app.',
        { note: 'In a red zone the app won’t let you end the ride, and the minutes keep running. Check the app for the nearest bay before you reach your destination.' },
      ],
    },
    {
      heading: 'Brandenburg Gate, Alexanderplatz and other sights: marked bays only',
      blocks: [
        'Since 11 March 2024, a 3.5 km² area of Mitte, about the size of Tempelhofer Feld, has been a no-parking zone for rental vehicles. You can end a ride there only at a marked bay, roughly every 200 m, including at Alexanderplatz, Unter den Linden and the Brandenburg Gate; at the start there were around 70 Jelbi points and 30 signed bays. Another large no-parking zone runs from the Hauptbahnhof, the main station, south to Potsdamer Platz; at the station, use the Jelbi point S+U Hauptbahnhof/Heidestrasse.',
        {
          table: {
            caption: 'Parking at well-known places, in Dott’s zones on 12 October 2026',
            head: ['Place', 'Parking'],
            rows: [
              ['Brandenburg Gate, Pariser Platz, Reichstag, Holocaust Memorial', 'Marked bay only'],
              ['Unter den Linden, Gendarmenmarkt, Museum Island, Alexanderplatz', 'Marked bay only'],
              ['Hauptbahnhof, Potsdamer Platz, Checkpoint Charlie, Victory Column', 'Marked bay only'],
              ['East Side Gallery, Warschauer Strasse, Kottbusser Tor, Spandau Old Town', 'Marked bay only'],
              ['Tempelhofer Feld, Mauerpark, Volkspark Friedrichshain, Treptower Park', 'No parking at all'],
              ['Kurfürstendamm at Joachimsthaler Strasse', 'No parking at all'],
            ],
          },
        },
        'Each operator maps the city’s zones itself, and they change often, so the map in your app has the final word. To see where Dott and Voi scooters are right now, open the [live map of Berlin](map:de:Berlin).',
      ],
    },
    {
      heading: 'What bad parking costs in Berlin',
      blocks: [
        'Badly parked scooters are mostly a Mitte problem: of 35,026 reports of illegally parked e-scooters in 2025, 31,577 were in that district.',
        {
          table: {
            caption: 'Bad e-scooter parking in Berlin: what it can cost',
            head: ['Offence', 'Consequence'],
            rows: [
              ['Parked so it obstructs or endangers', '€20 to €30 fine (standard rate)'],
              ['From 1 March 2027: parked on a pavement or bike lane where not allowed', '€55, or €70 if it obstructs'],
              ['Parked or ridden in a park', '€5 to €55 on the spot, fines up to €5,000'],
              ['Broke the operator’s rules', 'The operator’s own fee (amounts not published), up to an account block'],
              ['Scooter in the way', 'Police or district staff move it, since 24 July 2025 at the operator’s cost'],
            ],
          },
        },
        'Lime warns you first, then charges a fee and may block your account. Dott blocks repeat offenders for good, and its photo check refuses to end a ride if the scooter is badly parked. To report a scooter in the way, use [Jelbi’s form](https://www.jelbi.de/falschparker-melden/), scooter-melder.de or the hotline on the scooter; by day the operator must move it within four hours.',
      ],
    },
    {
      heading: 'U-Bahn, Jelbi and BER airport',
      blocks: [
        'Since 1 May 2024, BVG has banned e-scooters from its U-Bahn trains, trams, buses and U-Bahn stations, folded or not. With a rental, end the ride outside the station and rent another at the other end.',
        '**Jelbi** is BVG’s mobility app: public transport tickets plus Lime, Bolt, Voi and Dott scooters, with a Jelbi account of its own.',
        '**BER airport:** Dott’s area ends well north of the airport, and BER’s own travel page lists no e-scooter sharing. Take the FEX airport express or the S-Bahn into town and pick up a scooter there.',
        '**Prefer to pedal?** nextbike and DB Call a Bike rent out bikes in Berlin, and so do Lime, Bolt and Voi.',
      ],
    },
    {
      heading: 'Will Berlin ban e-scooters after March 2027?',
      blocks: [
        'Every operator’s permit ends on 31 March 2027, and what comes next hasn’t been decided (as of October 2026): the Senate has published no new rules or tender. In June 2026 an alliance of about 40 organisations called for fixed stations from April 2027.',
        'The long-term plan is settled. Under its Sharing Strategy 2035, adopted on 6 May 2026, the Senate wants to move area by area to about 3,000 fixed mobility hubs, where rentals would start and end. That isn’t a ban, whatever March 2026 headlines said; the Senate says Berlin can’t ban e-scooters outright.',
      ],
    },
    {
      heading: 'Did you know? Berlin e-scooter facts',
      blocks: [
        {
          list: [
            'About 850 e-scooters a year are fished out of Berlin’s waterways, the Senate estimates; the permits oblige operators to recover them.',
            'Every rental scooter must show its complaint hotline number in Braille on the handlebar.',
            'The average ride is short: 1.6 km and 6.5 minutes in the first quarter of 2026.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent e-scooters in Berlin?',
      answer: 'Yes: sign up in the operator’s app with a payment card. You must be 18 but need no driving licence.',
    },
    {
      question: 'Am I insured on a rental e-scooter?',
      answer: 'Yes, for damage you cause to others: the operator insures each scooter, as the sticker on the back shows. Lime and Bolt add accident cover for the ride; where Dott offers it, it excludes head injuries if you rode without a helmet.',
    },
    {
      question: 'Can I take an e-scooter on the U-Bahn or S-Bahn?',
      answer: 'Not on the U-Bahn, trams or buses: BVG has banned e-scooters, folded or not, since 1 May 2024. Your own folded scooter may go on the S-Bahn and regional trains as hand luggage; rental scooters stay on the street.',
    },
    {
      question: 'Why can’t I end my ride here?',
      answer: 'You’re probably in a red no-parking zone: near a marked bay, in a park or in central Mitte. Ride on to the nearest bay shown in the app; the minutes keep running until the ride ends.',
    },
  ],
  sources: [
    { title: 'Berlin Senate: permits for station-less micromobility (German)', url: 'https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/dienste-und-genehmigungen/stationslose-mikromobilitaet/' },
    { title: 'Berlin House of Representatives, written question S19-26660: e-scooter parking and permit conditions, July 2026 (PDF, German)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-26660.pdf' },
    { title: 'Berlin House of Representatives, written question S19-26583: rules, enforcement and accidents, July 2026 (PDF, German)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-26583.pdf' },
    { title: 'Berlin House of Representatives, written question S19-25543: illegally parked e-scooters, March 2026 (PDF, German)', url: 'https://pardok.parlament-berlin.de/starweb/adis/citat/VT/19/SchrAnfr/S19-25543.pdf' },
    { title: 'Senate report to the main committee on shared mobility, June 2026 (PDF, German)', url: 'https://www.parlament-berlin.de/adosservice/19/Haupt/vorgang/h19-2915-v.pdf' },
    { title: 'Mitte district: virtual no-parking zone for rental vehicles, March 2024 (German)', url: 'https://www.berlin.de/ba-mitte/aktuelles/pressemitteilungen/2024/pressemitteilung.1426019.php' },
    { title: 'Berlin Senate: Sharing Strategy 2035 (German)', url: 'https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/verkehrsplanung/geteilte-mobilitaet/sharing-strategie-2035/' },
    { title: 'BVG: ban on e-scooters (German)', url: 'https://www.bvg.de/de/service-und-kontakt/e-tretroller-verbot' },
    { title: 'Tempelhof-Schöneberg district: public parks and the tulip sign (German)', url: 'https://www.berlin.de/ba-tempelhof-schoeneberg/politik-und-verwaltung/aemter/strassen-und-gruenflaechenamt/strassen-gruenflaechen-verwaltung/artikel.349752.php' },
    { title: 'Jelbi: frequently asked questions (German)', url: 'https://www.jelbi.de/faq-de/' },
    { title: 'Dott: public price feed for Berlin (GBFS)', url: 'https://gbfs.api.ridedott.com/public/v2/berlin/system_pricing_plans.json' },
    { title: 'Federal Ministry for Transport: questions and answers on e-scooters (German)', url: 'https://www.bmv.de/SharedDocs/DE/Artikel/StV/Strassenverkehr/elektrokleinstfahrzeuge-verordnung-faq.html' },
  ],
};

export default guide;
