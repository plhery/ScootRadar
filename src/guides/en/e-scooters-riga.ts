import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-riga',
  topic: 'riga',
  name: 'Renting an e-scooter in Riga',
  title: 'E-scooter Riga 2026: Ride, Bolt, prices and the licence rule',
  description: 'E-scooter Riga guide: Ride (the old Tuul fleet) and Bolt, what a ride costs, the licence even adults need, Old Town parking, the airport and Jūrmala.',
  headline: 'E-scooters in Riga: Ride and Bolt, what a ride costs, the licence rule and where to park in the Old Town',
  lede: 'You can rent an e-scooter in Riga with Ride, which took over Tuul’s scooters, or with Bolt. Ride charges €0.29 to unlock plus €0.22 a minute (published rate, 14 October 2026); Bolt shows its price in the app. Latvian law asks every e-scooter rider, adults included, for a driving or bicycle licence, and the apps rent only to adults. In the Old Town you can park only at marked spots, and Ride’s scooters don’t reach the airport.',
  published: '2026-10-14',
  updated: '2026-10-25',
  city: 'lv:Rīga',
  sections: [
    {
      heading: 'Which e-scooter apps work in Riga?',
      blocks: [
        'Two apps rent out stand-up e-scooters in Riga. (Many “scooter rental” offers in Riga are for mopeds, which need a driving licence.)',
        {
          list: [
            '**Ride**, whose app “RIDE: Mobility Solutions” runs in English. Its scooters are Tuul’s old fleet: the Estonian company sold its scooter business to Ride in September 2025 and closed its own service. You sign up with a mobile number, a text code and a card that passes 3-D Secure.',
            '**Bolt**, in the same app as its taxis. New riders are capped at 15 km/h for their first five rides.',
            '**SKOK** rents only e-mopeds, which need a driving licence, and e-bikes.',
          ],
        },
        'On the afternoon of 14 October 2026 the [map of Riga](map:lv:Rīga) showed 649 Ride scooters: a count of what’s on the map, not the fleet. Bolt joined the map on 25 October 2026: about 4,000 scooters at 14:50 that day. Ride’s app also rents seated e-bikes at the same price, which our map doesn’t count.',
        'New to shared e-scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Riga?',
      blocks: [
        'Ride charges €0.29 to unlock, then €0.22 a minute, standing still included. The app shows the final price.',
        {
          table: {
            caption: 'Ride in Riga (published rate, 14 October 2026) and public transport tickets',
            head: ['Ride or ticket', 'Price'],
            rows: [
              ['Ride, 10 minutes', '€2.49'],
              ['Ride, 15 minutes', '€3.59'],
              ['Ride, 20 minutes', '€4.69'],
              ['Ride, 30 minutes', '€6.89'],
              ['Tram, trolleybus or bus, 90 minutes', '€1.50'],
              ['Public transport, 24 hours', '€5'],
            ],
          },
        },
        'Bolt publishes no Riga price. Its Latvian website advertises scooters “starting from €0.15 per minute”, a national figure; the unlock fee and rate vary by place, so check the app.',
        'Ride’s terms add up to €50 to fetch a scooter left outside its area, a €50 fee per incident on top of any fine or cost you cause it, and €1,500 if you don’t end a rental within 24 hours.',
      ],
    },
    {
      heading: 'Do you need a licence for an e-scooter in Riga as a tourist?',
      blocks: [
        'Yes. Latvian law lets you ride an e-scooter from 14, but only with a bicycle licence or a driving licence of any category, and that applies to adults too. Riding without one costs €25. In spring 2026 Riga’s municipal police checked 631 micromobility riders and found 224 without a licence.',
        'Your driving licence from home should count. Latvia’s road authority, CSDD, lets visitors drive on a licence from the EU or EFTA or one showing the 1968 Road Traffic Convention’s categories, and on any other foreign car licence for cars only.',
        'Since 1 April 2026 every shared operator must, before you ride, check your age and licence in the app and test your reactions on screen (a drink-and-drugs check, not a breath test). Neither Ride nor Bolt publishes how it checks a foreign licence.',
        { note: '**Carry your driving licence when you ride.** The app may ask for it, and the police run checks.' },
        'The law’s minimum age is 14, but Ride and Bolt rent only to riders of 18 and over. That’s their own policy, which Latvia’s consumer protection centre checked in January 2026, not a number in the law.',
      ],
    },
    {
      heading: 'Where can you ride and park in Riga’s Old Town?',
      blocks: [
        'Riga’s rules for shared scooters (RD-24-261-sn, in force since 1 May 2024 and amended in 2025) set speed and parking zones, but no permits, fleet caps, fees or night ban; Ride’s open data say it runs 24/7.',
        '**Parking: only at a marked spot in the historic centre.** The no-parking zone covers about 1.2 km² of the Old Town, the canal parks and the boulevards up to Elizabetes iela, from Dome Square, Town Hall Square and Riga Castle to the Opera, Bastejkalns, Esplanāde and the Freedom Monument. It holds 84 marked spots, out of 121 across the city, such as Kaļķu iela 1, Smilšu iela 20, Grēcinieku iela 34, 11. novembra krastmala and Brīvības bulvāris by Esplanāde. The app shows them.',
        'Elsewhere, end a ride where the app allows, but never on a pedestrian crossing, a cycle path or a bridge, on a pavement narrower than 1.5 metres, in Mežaparks or in the grounds of two big hospitals. If a scooter is badly parked, the municipal police order the operator to move it within 3 hours, and Ride’s terms pass the cost on to you.',
        '**Speed: 20 km/h** for shared scooters in a zone of about 13.7 km² over the centre: the Old Town, the boulevard ring, the Art Nouveau quarter around Alberta iela and Elizabetes iela, the Central Market, the station, Skanste and the Vanšu, Stone and Island bridges. Elsewhere the national 25 km/h applies.',
        'The Central Market, the station, Spīķeri and Alberta iela are in the slow zone but outside the no-parking zone, so you don’t need a marked spot there. Ķīpsala, across the Vanšu bridge, is outside Ride’s area: you can ride through but not end a ride there.',
        'Many Old Town lanes are cobbled and busy with people on foot: give way to them and slow to walking pace. Events change the zones too: for Riga’s birthday in mid-August 2026 the city banned scooter riding and parking in the Old Town and on 11. novembra krastmala.',
      ],
    },
    {
      heading: 'Latvia’s e-scooter rules in 2026',
      blocks: [
        'Latvia’s rules are in the [Road Traffic Law](https://likumi.lv/ta/id/45467) (CSL) and the [Road Traffic Regulations](https://likumi.lv/ta/id/274865) (CSN), whose chapter on cyclists and e-scooter riders was rewritten from 31 March 2026.',
        {
          table: {
            caption: 'E-scooter rules in Latvia on 15 October 2026 (Road Traffic Law and Road Traffic Regulations, likumi.lv)',
            head: ['Rule', 'What applies', 'Fine'],
            rows: [
              ['Minimum age', '14 by law; Ride and Bolt set 18 (their own policy)', '–'],
              ['Licence', 'A bicycle licence or a driving licence of any category, at every age', '€25'],
              ['Shared scooters', 'Since 1 April 2026 the app checks age and licence and runs a reaction test', '–'],
              ['Helmet', 'Compulsory and buckled under 18; advised for adults', 'Warning or €10–70'],
              ['Speed', '25 km/h at most; 20 km/h for shared scooters in central Riga', '–'],
              ['Where to ride', 'Cycle lane first, then the right edge of the road; the pavement only when the road is impossible, difficult or dangerous, at walking pace near pedestrians', 'Warning or €10–70'],
              ['Passengers', 'One rider only', 'Warning or €10–70'],
              ['Lights', 'White at the front, red at the back, on whenever you ride, day or night', 'Warning or €10–70'],
              ['Phone', 'Not in your hand while moving', '€10–30'],
              ['Alcohol', 'Limit 0.5 ‰ in the blood', '€70; €120 over 1.0 ‰; €170 over 1.5 ‰ or for drugs'],
              ['Registration and insurance (OCTA)', 'The owner’s job, so the operator’s on a shared scooter. Only residents can register one, so in practice a visitor can’t ride their own', 'Unregistered: €30–70'],
            ],
          },
        },
        '**The pavement rule changed on 31 March 2026.** Before, a rider without a cycle lane could choose the pavement. Now the road comes first and the pavement is the fallback, whatever older pages say.',
      ],
    },
    {
      heading: 'From Riga airport, to Jūrmala and on the tram',
      blocks: [
        '**The airport.** Ride’s scooters don’t reach it: the terminal lies outside all its zones, and Bolt publishes no zone map. Take **bus 22** from the P1 car park, between arrival exits E and C, to the Old Town (11. novembra krastmala), the bus and railway stations and the Central Market in about 30 minutes. It runs 05:25–00:10, 5–8 buses an hour on weekdays. A 90-minute ticket costs €1.50 from the machine at the stop or Narvesen in the terminal, or €1.81 from the driver, by bank card only.',
        '**Jūrmala.** Ride has a small area of its own from Lielupe through Bulduri and Dzintari to Majori. Riding there from Riga is long: take the Vivi train on the Tukums line and pick up a scooter there; the area starts a short walk from Majori station. On Jomas iela, the pedestrian street, walk the scooter when it’s busy.',
        '**Trams, trolleybuses and buses.** Since January 2026 Rīgas satiksme’s rules let you take a bicycle or your own e-scooter on board free of charge, if it can’t roll or tip over; give up the pram and wheelchair space when someone needs it.',
      ],
    },
    {
      heading: 'Winter, events and safety in Riga',
      blocks: [
        '**Winter.** Neither Ride nor Bolt has announced its plans for 2026/27. For winter 2024/25 Bolt said it would keep about a fifth of its Riga scooters on the streets, switched off in heavy snow or ice; in 2023/24 Tuul, whose scooters Ride now runs, kept going all winter. Expect fewer scooters from late November, and check the app.',
        '**Events** to plan around:',
        {
          list: [
            '**Staro Rīga**, the light festival along the Daugava and through the Old Town: 15–18 November 2026, in the evenings.',
            '**The Christmas market on Dome Square**, inside the no-parking zone: 28 November 2025 to 4 January 2026 last time; the 2026 dates aren’t out yet.',
            '**The Rimi Riga Marathon**, 15–16 May 2027.',
          ],
        },
        '**Safety.** The State Police counted 327 crashes involving e-scooters in Latvia in 2025, with 219 riders hurt; the commonest causes were alcohol, two people on one scooter and reckless manoeuvres. Ride will supply a red helmet to any customer who asks, from its Riga warehouse or by parcel locker.',
        'The [Riga map](map:lv:Rīga) shows the nearest Ride scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Ride’s open data still call its scooters “Tuul Riga”**, a year after Ride bought the Estonian company’s fleet.',
            '**Adults need a licence for an e-scooter but not for an e-bike**: since 5 June 2026 e-bike riders of 18 and over are exempt.',
            '**Riga’s Art Nouveau streets are a 20 km/h zone.** UNESCO calls the historic centre, a World Heritage Site since 1997, “the finest concentration of Art Nouveau architecture in the world”.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Does Riga have e-scooters, and which apps work there?',
      answer: 'Yes: Ride, which runs the former Tuul scooters, and Bolt. Ride charges €0.29 to unlock plus €0.22 a minute; Bolt shows its price in the app. [Our map](map:lv:Rīga) shows both, Bolt since 25 October 2026.',
    },
    {
      question: 'Is Tuul still in Riga?',
      answer: 'Not under its own name. Tuul sold its scooter business to Ride in September 2025 and closed its own service; the same scooters now run in the Ride app.',
    },
    {
      question: 'How old do you have to be to rent an e-scooter in Riga?',
      answer: '18 with Ride and Bolt. Latvian law allows riding from 14 with a licence, but both operators set 18 as their own policy, and the app checks your age.',
    },
    {
      question: 'Is a helmet compulsory on an e-scooter in Latvia?',
      answer: 'Only under 18: every rider under 18 must wear a buckled helmet. For adults it’s advised, not compulsory.',
    },
    {
      question: 'Can you ride an e-scooter on the pavement in Riga?',
      answer: 'Only as a last resort. Since 31 March 2026 you ride in the cycle lane or at the right edge of the road; the pavement is for when the road is impossible, difficult or dangerous, at walking pace near pedestrians.',
    },
    {
      question: 'Can I ride an e-scooter from Riga airport to the city?',
      answer: 'Not with Ride: the terminal is outside all its zones, and Bolt publishes no zone map. Bus 22 reaches the Old Town, the station and the Central Market in about 30 minutes for €1.50.',
    },
  ],
  sources: [
    { title: 'Road Traffic Law (Ceļu satiksmes likums), Latvian', url: 'https://likumi.lv/ta/id/45467' },
    { title: 'Road Traffic Regulations (Ceļu satiksmes noteikumi), chapter 22 from 31 March 2026, Latvian', url: 'https://likumi.lv/ta/id/274865' },
    { title: 'Riga City Council: shared vehicle rules RD-24-261-sn, Latvian', url: 'https://likumi.lv/ta/id/350955' },
    { title: 'GeoRīga: e-scooter speed and parking zones (open data)', url: 'https://georiga.lv/server/rest/services/Mikromobilitates_ierobezojumi/MapServer' },
    { title: 'CSDD: foreign driving licences in Latvia, Latvian', url: 'https://www.csdd.lv/transportlidzekla-vaditajs/arvalstu-vaditaja-apliecibas-izmantosana/' },
    { title: 'Riga Municipal Police: spring 2026 checks, Latvian', url: 'https://www.riga.lv/lv/jaunums/rpp-konstatejusi-vairak-ka-600-mikromobilitates-parkapumus' },
    { title: 'State Police: e-scooter crashes, Latvian', url: 'https://www.vp.gov.lv/lv/jaunums/pargalviba-reibums-un-risks-kapec-elektroskrejritenu-braucieni-beidzas-ar-traumam' },
    { title: 'Ride: open data for Riga (GBFS)', url: 'https://rideride.rideatom.com/gbfs/27/v3.0/gbfs' },
    { title: 'Ride: terms and conditions', url: 'https://ridemobility.eu/terms-and-conditions/' },
    { title: 'Bolt: scooters in Latvia', url: 'https://bolt.eu/en-lv/scooters/' },
    { title: 'Riga Airport: public transport', url: 'https://www.riga-airport.com/en/public-transport' },
  ],
};

export default guide;
