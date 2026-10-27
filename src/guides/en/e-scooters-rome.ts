import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-rome',
  topic: 'rome',
  name: 'Renting an e-scooter in Rome',
  title: 'Rome e-scooter rental apps 2026: Bird, Dott, Lime and rules',
  description: 'Which apps rent e-scooters in Rome (Bird, Dott, Lime), the minimum age of 18, the helmet you must bring, where you can’t park and the fines tourists get.',
  headline: 'E-scooters in Rome: who rents them, the helmet rule, no-parking zones and fines',
  lede: 'To rent an e-scooter in Rome, use the app of Bird, Dott or Lime, the three operators the city authorises as of October 2026. You must be 18, sign up with an identity document and bring your own helmet: Italian law requires one for every rider, and no operator supplies it. The price is shown only in the app, and at the big sights, from the Colosseum to the Trevi Fountain and St Peter’s Square, Bird’s app won’t let you end a ride.',
  published: '2026-10-12',
  updated: '2026-10-25',
  city: 'it:Roma',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Rome?',
      blocks: [
        'Only operators authorised by the city may rent out e-scooters in Rome, and as of October 2026 there are three: **Bird**, **Dott** and **Lime**, according to the city’s transport agency, Roma Servizi per la Mobilità. Dott and Lime also rent e-bikes.',
        'At 1:26 pm on Saturday 24 October 2026 the [map around Rome](map:it:Roma) showed about 4,200 Bird scooters and as many Dott, which the map has shown since that day. Since Sunday 25 October it also shows Lime’s, read from the map in its app: about 4,300 at around 4 pm that day. These are snapshots, not the fleets.',
        'The old centre has few by design: each operator may keep only 30 scooters in the Tridente, around Piazza del Popolo, Via del Corso and Piazza di Spagna, 300 in the historic-centre ZTL and 70 in Trastevere. If the map looks empty, walk a few streets out.',
      ],
    },
    {
      heading: 'How to rent an electric scooter in Rome',
      blocks: [
        {
          steps: [
            'Find the nearest Bird, Dott or Lime on the [live map of Rome](map:it:Roma).',
            'Sign up in the operator’s app with an identity document and a card; you must be 18.',
            'Put on your helmet and check the identification sticker, on the rear mudguard or the front of the steering column.',
            'Scan the QR code and ride on the road or a cycle path, never on the pavement.',
            'End the ride where the app allows it and take the compulsory end-of-ride photo.',
          ],
        },
        { note: 'Bring your own helmet. Since 14 December 2024 every e-scooter rider in Italy must wear one, rentals included, and Rome’s tourism office says the operators don’t have to supply it. A bicycle helmet meeting EN 1078 will do; without one the fine is €50–250.' },
        '**Why the sticker?** In June 2026 the Italian press reported stickers being peeled off shared scooters in Rome, dozens a night in the nightlife areas, and a rider stopped on a scooter without one risks a fine of at least €100. If it’s missing, take another scooter. More in [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'What does an e-scooter cost in Rome?',
      blocks: [
        'You usually pay an unlock fee plus a price per minute, but no operator publishes its Rome rates on the web, and Bird’s data feed carries none, so the map can’t estimate a price here.',
        {
          table: {
            caption: 'E-scooter prices in Rome, as the operators describe them (October 2026)',
            head: ['Operator', 'Unlock', 'Per minute', 'Notes'],
            rows: [
              ['Bird', 'In the app', 'In the app', 'Price set per city, shown under Payment in the app; “compliance fees” may apply'],
              ['Dott', 'In the app', 'In the app', 'No price page for Rome on its website'],
              ['Lime', 'Fixed fee, in the app', 'In the app', 'Can vary by place and time of day; time rounded up to the next minute; local fees may be included'],
            ],
          },
        },
        'Prices quoted online for Rome often date from 2020: trust the unlock screen. The free rides you may read about are only for annual Metrebus pass holders, not for the 24-, 48- and 72-hour or weekly tickets visitors buy.',
      ],
    },
    {
      heading: 'Italian e-scooter rules for tourists, in one table',
      blocks: [
        'Italy’s rules apply to visitors too.',
        {
          table: {
            caption: 'Italian e-scooter rules and fines (as of October 2026)',
            head: ['Rule', 'What it means', 'Fine'],
            rows: [
              ['Helmet', 'Every rider, every age, rentals too', '€50–250'],
              ['Age', '18 to rent in Rome; no driving licence needed', '–'],
              ['Sticker (“plate”)', 'Compulsory since 17 May 2026; the operator’s job on a rental', '€100–400'],
              ['Insurance', 'Compulsory since 16 July 2026; the operator’s job on a rental', '€100–400'],
              ['Where to ride', 'Urban roads signed 50 km/h or less, and cycle paths. Never the pavement, never against the traffic', '€50–250'],
              ['Speed', '20 km/h; 6 km/h in pedestrian areas, where rentals slow down by themselves', '€50–250'],
              ['Passengers', 'None: one rider, no objects or animals', '€50–250'],
              ['After dark', 'Lights, plus a reflective vest or braces from half an hour after sunset', '€50–250'],
              ['Alcohol', 'Limit 0.5 g/l; a criminal offence above 0.8 g/l', '€543–2,170 between 0.5 and 0.8 g/l'],
              ['Parking', 'Never on the pavement; bike, moped and motorbike bays are fine', '€41–168'],
            ],
          },
        },
        'Police in Rome do check: in the week the sticker became compulsory, in May 2026, they stopped more than 1,000 vehicles and found more than 400 violations, mostly riders without a helmet, Wanted in Rome reported. Pay within 5 days and a fine is usually cut by 30%.',
      ],
    },
    {
      heading: 'Where you can’t end a ride: the Colosseum, Trevi and St Peter’s',
      blocks: [
        'A rental in Rome ends only where the operator allows it; anywhere else the app won’t close it, and you keep paying. Bird’s zone data, read on 12 October 2026, marks almost 150 no-parking zones you may ride through. Dott and Lime draw their own, which may differ, and zones change: the map in your app is the reference.',
        {
          table: {
            caption: 'Where you couldn’t end a Bird ride on 12 October 2026 (Bird’s data)',
            head: ['Area', 'No-parking zones'],
            rows: [
              ['Ancient Rome', 'Piazza del Colosseo, including the metro exit; the Circus Maximus; Piazza Venezia'],
              ['Squares and fountains', 'The Trevi Fountain; Piazza di Spagna and the Spanish Steps; the Pantheon and Piazza Navona; Campo de’ Fiori; Piazza del Popolo'],
              ['Vatican', 'St Peter’s Square and the area around the Vatican Museums entrance'],
              ['Parks', 'All of Villa Borghese, the Pincio and Galleria Borghese included; Villa Doria Pamphili; Villa Ada; Villa Celimontana'],
              ['River and Trastevere', 'Central Trastevere; long stretches of the Tiber embankments, including Isola Tiberina, Ponte Sisto and Ponte Milvio'],
              ['Other', 'The area around the Stadio Olimpico'],
            ],
          },
        },
        'Just outside them you can park: that day Bird’s data had no restriction at Termini station, Largo Argentina, Piazza Barberini, Via del Corso, Castel Sant’Angelo, Via della Conciliazione or Ottaviano. For St Peter’s, park around Ottaviano or Via della Conciliazione and walk.',
        'Never park on the pavement. The law always lets you use a bike, moped or motorbike bay, but the ride ends only where the app allows it. Rome has no official map of scooter bays, so the parking spots in the app are what counts.',
      ],
    },
    {
      heading: 'Fines, and the fees operators add',
      blocks: [
        'Police fine you on the spot. Anything noticed later, such as bad parking, reaches you through the operator, which knows who was riding: it can pass your details to the police, or pay the fine and charge it to your card with fees of its own:',
        {
          list: [
            '**Dott** (Italian terms of 2 December 2025): the fine plus a €15 admin fee if Dott pays it, up to €5 for bad parking, €50 for any breach of its terms, and up to €300 to recover an impounded scooter.',
            '**Lime**: the fine plus impound and admin costs, up to €110 to recover a scooter left where it can’t be reached, and up to €1,380 for damage.',
            '**Bird**: its help pages warn that “compliance fees” may be added to the ride price.',
          ],
        },
      ],
    },
    {
      heading: 'Cobblestones, hills, the Tiber and the airport',
      blocks: [
        '**Cobbles and tram rails.** The city names them as the hazards: its 2026 tender gives top marks to scooters with wheels of 12 inches or more, to get safely over sampietrini, the cobbles of the centre, and rails. Cobbles are slippery when wet, so slow down in the rain, and cross rails as close to a right angle as you can.',
        '**Hills.** The Aventine, the Esquiline, the Janiculum and the Pincio slow a scooter down on the way up; on the way down, brake early, as the limit is still 20 km/h.',
        '**The Tiber.** The cycle path along the embankments is a popular ride, but you can’t end a Bird ride down there. After floods in late February 2026, mud blocked the stretch between Ponte Sisto and Ponte Garibaldi, and dozens of scooters were left there.',
        '**Airports.** Fiumicino and Ciampino are outside Bird’s operating area, and e-scooters may not use extra-urban roads anyway. Take the train or bus into town; Termini is inside Bird’s area. The Appia Antica around Cecilia Metella is outside it too, and Ostia has a separate Bird area.',
        '**Other ways around.** Dott and Lime e-bikes (their permits end on 31 October 2026, with nothing announced yet about what follows), Cooltra mopeds, and the ATAC metro, buses and trams.',
      ],
    },
    {
      heading: 'Rome’s new e-scooter tender: what may change in 2027',
      blocks: [
        'The permits ran out on 31 August 2026. Since then Bird, Dott and Lime have operated on a technical extension lasting, in the city’s words, the period strictly necessary to choose the next operators; the press gives its end as 31 October 2026, the day the e-bike permits end. As of 12 October, nothing had been announced about what happens after that.',
        'Operators can apply until **26 October 2026 at 15:00**. Rome will pick up to three e-scooter operators for three years, each running 3,000 to 4,500 scooters, and the winners will have up to 150 days from their permit to start, so the line-up may change in 2027. Helmets on board may come too: the tender awards points for an app-unlocked helmet box on every scooter, but no winner has to offer one.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            'In May 2022, Rome’s transport councillor said only 268 of the city’s 14,500 shared scooters were in use at the moment counted: 2.03%.',
            'In June 2022 two American tourists were fined €400 each for riding rented e-scooters down the Spanish Steps at 2:45 am, and banned from the area.',
            'The first sampietrini were cut from the big blocks of ancient Roman roads, and their first documented use in Rome dates from the reign of Pope Pius V (1566–72).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can tourists rent e-scooters in Rome?',
      answer: 'Yes, from 18. You sign up in the Bird, Dott or Lime app with an identity document and a payment card. Bring a helmet, or buy a bicycle helmet in town: the operators don’t provide one.',
    },
    {
      question: 'Do I need a driving licence to ride a Lime or Bird scooter in Italy?',
      answer: 'No. Italian law requires no licence of any kind to ride an e-scooter, and Dott’s and Lime’s terms ask for one only where local law does.',
    },
    {
      question: 'Can I ride an e-scooter from Fiumicino airport into Rome?',
      answer: 'No. Fiumicino and Ciampino are outside Bird’s operating area, and e-scooters are banned from extra-urban roads and roads signed above 50 km/h. Take the train or bus into the city and rent a scooter there.',
    },
    {
      question: 'Are e-scooters allowed in Villa Borghese?',
      answer: 'You can ride through, but in Bird’s data the whole park, the Pincio and Galleria Borghese included, is a no-parking zone, so you can’t end your ride there. Dott and Lime set their own zones: check the app.',
    },
    {
      question: 'Who gets fined if a rented scooter has no sticker?',
      answer: 'According to the Italian press, the rider stopped on it risks the €100 minimum fine, even though the sticker is the operator’s job. Whether police fine the rider or the operator in practice isn’t clear, so look for the sticker before you unlock.',
    },
  ],
  sources: [
    { title: 'Roma Servizi per la Mobilità: shared mobility in Rome (Italian)', url: 'https://romamobilita.it/muoversi-a-roma/mobilita-sharing/' },
    { title: 'Roma Servizi per la Mobilità: selection of shared micromobility operators, 2026 tender (Italian)', url: 'https://romamobilita.it/eventi-e-news/selezione-operatori-servizi-di-micromobilita-sharing/' },
    { title: 'Turismo Roma: helmets and identification plates mandatory on shared scooters too', url: 'https://www.turismoroma.it/en/news/electric-scooters-helmets-and-identification-plate-mandatory-shared-vehicles-too' },
    { title: 'Turismo Roma: shared scooters park only in authorised areas (Italian)', url: 'https://turismoroma.it/it/node/81426' },
    { title: 'Bird: geofencing zones for Rome (public GBFS data)', url: 'https://mds.bird.co/gbfs/v2/public/rome/geofencing_zones.json' },
    { title: 'Italian Law 160/2019, art. 1, paragraphs 75 ff.: the e-scooter rules (Normattiva, Italian)', url: 'https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2019-12-27;160~art1' },
    { title: 'Dott: terms and conditions for Italy (Italian)', url: 'https://ridedott.com/it/termini-condizioni/italia/' },
    { title: 'Lime: user agreement for Italy (Italian)', url: 'https://www.li.me/it-it/user-agreement' },
    { title: 'Lime help: ride costs and fees (Italian)', url: 'https://help.li.me/hc/it/articles/115004914208-Costi-e-tariffe-delle-corse' },
    { title: 'Bird help: ride cost (Italian)', url: 'https://help.bird.co/hc/it/articles/360030667512-Costo-della-corsa' },
  ],
};

export default guide;
