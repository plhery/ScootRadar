import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-uppsala',
  topic: 'uppsala',
  name: 'E-scooters in Uppsala, Sweden',
  title: 'E-scooters Uppsala 2026: Voi, Lime, Ryde and rules',
  description: 'E-scooters in Uppsala: Voi, Lime and Ryde, the 4,500 cap, 15 km/h and a reaction test at night, where to ride and park, buses, trains and fines.',
  headline: 'E-scooters in Uppsala: Voi, Lime and Ryde, the night rules and where to park',
  lede: 'E-scooters in Uppsala are rented from Voi, Lime and Ryde, the three companies the municipality lists; our map shows Voi and Lime, not Ryde. Ride on cycle lanes or the road, never on the pavement, and from 23:00 to 05:00 expect hire scooters in the centre to slow to 15 km/h and to ask for a reaction test. End your ride in a cycle rack or e-scooter parking, and photograph the scooter.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'se:Uppsala',
  sections: [
    {
      heading: 'E-scooters in Uppsala: Voi, Lime and Ryde',
      blocks: [
        'Electric scooter rental in Uppsala needs a permit to use public land, granted by the police for a year at a time, and Uppsala kommun (the municipality) backs an application only if the company meets its local conditions. Its e-scooter page lists three rental companies (read 29 October 2026):',
        {
          table: {
            caption: 'E-scooter companies in Uppsala and what the map shows, October 2026',
            head: ['Company', 'On the municipality’s list', 'On the ScootRadar map'],
            rows: [
              ['Voi', 'Yes', 'Yes, with battery'],
              ['Lime', 'Yes', 'Yes'],
              ['Ryde', 'Yes, and Ryde lists Uppsala among its towns', 'No: check the Ryde app'],
            ],
          },
        },
        '**Ryde isn’t on our map**, so look for its scooters in its own app, and don’t read the map’s total as all the scooters in town. At 04:51 on Thursday 29 October 2026 the [map of Uppsala](map:se:Uppsala) showed about 1,250 Voi and about 700 Lime scooters as they stood at that moment: a snapshot, not the fleet size. Scooters on a ride aren’t shown, nor prices, zones or parking. The map’s area isn’t cut to the city limits: its total is everything the two companies’ data assign to Uppsala, which can include scooters just outside town.',
        'Bolt isn’t on the municipality’s list.',
      ],
    },
    {
      heading: 'How much does a Voi or Lime scooter cost in Uppsala?',
      blocks: [
        '**The app shows the price** before you unlock. We found no Uppsala price on an open official page, and Ryde’s website lists none.',
        'The municipality sets no minimum age, and Ryde’s Swedish terms let you ride from 15. Check each app for its own age limit and fees.',
        'New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Uppsala’s permit conditions: the cap, night rules and weather',
      blocks: [
        'The municipality’s street and urban environment committee (gatu- och samhällsmiljönämnden) adopted new conditions for renting out e-scooters on public land on 22 April 2026. The minutes give no start date; Upsala Nya Tidning, the local paper, reported on 27 April 2026 that they would apply from 1 July. The municipality’s page gives them as today’s rules (read 29 October 2026):',
        {
          table: {
            caption: 'Uppsala’s conditions for hire e-scooters, adopted 22 April 2026',
            head: ['Condition', 'What it means for you'],
            rows: [
              ['Cap', 'At most 4,500 hire scooters in the city, all companies together'],
              ['Night speed', 'From 23:00 to 05:00 every night, hire scooters go no faster than 15 km/h in a central area'],
              ['Reaction test', 'In the same area and hours, you must pass a reaction test to start a ride'],
              ['Weather', 'During an orange or red SMHI weather warning for ice, snow or heavy rain, the companies must switch their scooters off'],
              ['Ending a ride', 'Only in cycle parking, e-scooter parking or a place the municipality has clearly marked out, with a photo of the parked scooter'],
              ['Badly parked scooters', 'The company must move a scooter left in the way, dangerously or against the rules within three hours of hearing of it'],
            ],
          },
        },
        'The central area, drawn on a map in the conditions, takes in the city centre on both banks of the Fyris river, from the castle, the cathedral and the university’s main buildings to the railway at Uppsala Central. The officials had proposed 2,500 scooters, at most two companies, 10 km/h and riders aged 18 or over; the committee raised the cap and the speed, and struck out the limits on companies and age.',
      ],
    },
    {
      heading: 'E-scooter rules in Sweden: what applies in Uppsala',
      blocks: [
        'An e-scooter, or elsparkcykel as Uppsala’s own pages call it, counts as a bicycle if it goes no faster than 20 km/h and its motor is rated at no more than 250 W, says the Swedish Transport Agency (Transportstyrelsen, 14 August 2026), so cyclists’ rules apply. The law sets no minimum age; under-15s must wear a helmet, and the agency recommends one for everyone.',
        {
          table: {
            caption: 'E-scooter rules in Uppsala and who sets them, October 2026',
            head: ['Rule', 'What it means', 'Set by', 'If you break it'],
            rows: [
              ['Where to ride', 'The cycle lane if there is one, otherwise the road; from 15 you may use the road anyway, with care, where the limit is 50 km/h or less', 'The law', 'SEK 500'],
              ['Pavements', 'Never ride on a pavement or footway; you may wheel the scooter there', 'The law', 'SEK 500'],
              ['Pedestrian streets', 'Walking pace; give way to people on foot', 'The law', 'SEK 1,000'],
              ['Red lights', 'Stop, as on a bicycle', 'The law', 'SEK 1,500'],
              ['One rider', 'No passengers', 'The law', 'SEK 500 for the rider and SEK 500 for the passenger'],
              ['Helmet', 'Compulsory under 15, recommended for all', 'The law', 'No fine for the rider'],
              ['Alcohol', 'No fixed limit, but you may not ride if drink or drugs stop you riding safely', 'The law', '–'],
              ['Night rules', '15 km/h and a reaction test from 23:00 to 05:00 in the centre, on hire scooters', 'The municipality’s permit conditions', '–'],
              ['Parking', 'In a cycle rack or e-scooter parking; never on a footway or cycle lane, nor where it blocks the way or puts others in danger', 'The law since 1 September 2022; the municipality', 'The municipality may move it; the company may charge you'],
            ],
          },
        },
        'The police issue these fines on the spot (ordningsbot), at the amounts for cyclists set by the Prosecutor-General (1 November 2025). The same national rules apply in Stockholm: see our [Stockholm guide](guide:stockholm).',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Uppsala',
      blocks: [
        'Since 1 September 2022 Swedish law has banned leaving an e-scooter on a footway or cycle lane except in a marked parking place or a cycle rack, though a town may allow exceptions. Gothenburg still lets scooters stand on the pavement outside its old centre where they block no one (see our [Gothenburg guide](guide:gothenburg)); we found no such exception in Uppsala’s local traffic rules (29 October 2026). The municipality asks you to park in **cycle parking or parking meant for e-scooters**, never in anyone’s way or where the scooter puts others in danger. The companies must also keep scooters off the tactile paths that guide blind people (ledstråk).',
        'The companies must make you photograph the parked scooter at the end of every ride. Ryde’s Swedish terms say that if you send no photo and the municipality charges Ryde for that scooter, you pay the cost.',
        'The municipality regularly moves scooters parked dangerously or in the way, though not from private land. To report a badly parked scooter, tell the company that owns it first, the municipality asks: Lime on 08-580 975 13, Ryde on 0775-888 012 and Voi on 020-088 35 14.',
        {
          note: 'In Uppsala a hire scooter belongs in a cycle rack or e-scooter parking, never on the pavement or a cycle lane.',
        },
      ],
    },
    {
      heading: 'Stora torget, cycle streets and the campuses',
      blocks: [
        'The conditions name **Stora torget**, and Kungsängsgatan and Svartbäcksgatan with their side streets between Bangårdsgatan and S:t Olofsgatan, as places where the traffic rules ban vehicles: the companies must make sure you can’t ride or park a scooter there.',
        'Since 22 September 2026 three streets have been cycle streets (cykelgata), under local traffic rules decided on 10 June 2026: Svartbäcksgatan between S:t Olofsgatan and Eddagatan, Östra Ågatan between Hamnesplanaden and Bäverns gränd, and part of Västra Ågatan. There no vehicle may go faster than 30 km/h, drivers must adapt to cyclists, and you may park only in marked places.',
        {
          table: {
            caption: 'Rules on land owned by others, as each owner states them, October 2026',
            head: ['Place', 'Who says so', 'What it says'],
            rows: [
              ['Uppsala Central', 'Jernhusen, the station’s owner', 'No e-scooter rule on its station page; the station is open from 05:00 to 00:40'],
              ['Uppsala University', 'The university', 'Since 1 October 2024 e-bike and e-scooter batteries may not be brought into, stored or charged in its buildings, except its cycle garages; leaving your scooter in a campus cycle rack is fine'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Can you take an e-scooter on a UL bus or the train to Arlanda?',
      blocks: [
        'UL, the region’s public transport, lets you take your own e-scooter on its city and regional buses if it folds, is no longer than 120 cm folded and weighs no more than 15 kg (October 2026).',
        {
          list: [
            '**SL-pendeln, the commuter train to Arlanda and Stockholm:** UL says SL’s rules for bikes apply on the whole line. SL allows folded e-scooters shorter than 120 cm everywhere except the Stockholm metro (tunnelbana).',
            '**SJ trains:** fold the e-scooter and put it in the luggage rack or under the seat in front of you, not overhead; you may not charge it on board, SJ says.',
            '**Arlanda Airport:** UL tickets are valid on SL-pendeln between Uppsala and Arlanda, and from 18 you pay a passage fee to leave the train at Arlanda C, UL says.',
          ],
        },
        'A hire scooter stays on the street: end your ride in a rack or e-scooter parking near the stop or the station before you board.',
      ],
    },
    {
      heading: 'Stockholm and the map',
      blocks: [
        'Heading south? Since 1 July 2026 only Voi and Bolt have permits to rent scooters in Stockholm: see the [map of Stockholm](map:se:Stockholm). The map shows standing e-scooters only, not bikes. To see what is standing near you now, open the [Uppsala map](map:se:Uppsala).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Capped by one vote.** The committee set the 4,500 cap by 7 votes to 6 on 22 April 2026, against its chair’s 3,500.',
            '**A yard for stray scooters.** Since October 2025 the municipality has taken scooters that are dangerous or in the way to a fenced yard for the companies to collect; in June 2026 the committee voted 7 to 6 against charging them SEK 850 a scooter for it.',
            '**Two station houses.** Uppsala Central’s new station building was finished in 2010, Jernhusen says; the old one now houses two restaurants.',
            '**Rules under review.** In 2025, 7 people died and 6,624 were injured in e-scooter accidents in Sweden; in July 2026 the Swedish Transport Agency began a review of the rules, due to end early in 2027.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Uppsala?',
      answer: 'The municipality lists Voi, Lime and Ryde (October 2026). The ScootRadar map shows Voi and Lime; Ryde’s scooters are only in its app.',
    },
    {
      question: 'Is there a speed limit for e-scooters at night in Uppsala?',
      answer: 'Yes, in the centre. From 23:00 to 05:00 every night, hire scooters go no faster than 15 km/h in a central area, and you must pass a reaction test to start a ride there.',
    },
    {
      question: 'Can I park an e-scooter on the pavement in Uppsala?',
      answer: 'No. Park in a cycle rack or e-scooter parking, never on a footway or cycle lane, and never in anyone’s way. A hire-scooter ride can only end in such a place, and you must photograph the parked scooter.',
    },
    {
      question: 'Do I need a helmet to ride an e-scooter in Uppsala?',
      answer: 'Only if you are under 15: Swedish law requires a helmet for younger riders, and the Swedish Transport Agency recommends one for everyone.',
    },
    {
      question: 'Can I take an e-scooter on a bus in Uppsala?',
      answer: 'Only your own, folded, no longer than 120 cm and no heavier than 15 kg, on UL’s city and regional buses; a hire scooter stays on the street.',
    },
    {
      question: 'Are e-scooters banned at night or in winter in Uppsala?',
      answer: 'No. We found no night ban or winter pause (October 2026). The centre has a night speed limit and a reaction test, and scooters are switched off during orange or red SMHI weather warnings.',
    },
  ],
  sources: [
    { title: 'Uppsala kommun: Elsparkcyklar i Uppsala (read 29 October 2026)', url: 'https://www.uppsala.se/gator-trafik-och-resor/trafiksakerhet-och-regler/trafiksakerhet-for-dig-som-cyklar/elsparkcyklar' },
    { title: 'Uppsala kommun: Committee minutes, 22 April 2026, § 35', url: 'https://www.uppsala.se/contentassets/673a65bc3b0e4b3480d5ea37e75060c9/protokoll-gatu--och-samhallsmiljonamnden-2026-04-22---uppsala.se.pdf' },
    { title: 'Uppsala kommun: Proposed conditions and zone map (31 March 2026)', url: 'https://www.uppsala.se/contentassets/b61c2f7c8377425da0a81693e1e5749a/5.-nya-villkor-vid-markupplatelse-for-elsparkcyklar.pdf' },
    { title: 'Uppsala kommun: Committee minutes, 10 June 2026, §§ 48 and 52', url: 'https://www.uppsala.se/contentassets/1947595cbb854658a58a86003697fd40/protokoll-gatu--och-samhallsmiljonamnden-2026-06-10---uppsala.se.pdf' },
    { title: 'Uppsala kommun: Cycle street on Svartbäcksgatan, 0380 2026:436 (in force 22 September 2026)', url: 'https://rdt.transportstyrelsen.se/rdt/AF06_View.aspx?UseStfs=1&ForeskriftId=1134bca0-6810-4d7c-bc28-7e6eb8dac9b7' },
    { title: 'Upsala Nya Tidning: New e-scooter rules in Uppsala this summer (27 April 2026)', url: 'https://www.unt.se/nyheter/uppsala/artikel/nya-regler-for-elsparkcyklar-i-uppsala-i-sommar/r4p77z0r' },
    { title: 'Ryde: Locations', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Terms and conditions, Sweden', url: 'https://www.ryde-technology.com/terms-conditions-sweden' },
    { title: 'Transportstyrelsen: Elsparkcykel (updated 14 August 2026)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/fordon/fordonsregler/regler-for-olika-fordonsslag/elsparkcykel/' },
    { title: 'Transportstyrelsen: Review of the e-scooter rules (27 July 2026)', url: 'https://www.transportstyrelsen.se/sv/om-oss/pressrum/nyhetsarkiv/2026/ny-sidatransportstyrelsen-ser-over-elsparkcykelregler/' },
    { title: 'Riksdagen: Trafikförordningen (1998:1276)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/' },
    { title: 'Åklagarmyndigheten: Fixed fines, annex 1A (1 November 2025)', url: 'https://www.aklagare.se/globalassets/dokument/ordningsbotskatalog/bilaga-1a.pdf' },
    { title: 'UL: What you may bring aboard', url: 'https://www.ul.se/reseinfo/resa-med-oss/vad-galler-ombord/' },
    { title: 'UL: SL-pendeln between Uppsala and Stockholm', url: 'https://www.ul.se/reseinfo/resa-med-oss/vara-bussar-och-tag/sl-pendeln/' },
    { title: 'SL: Bikes and e-scooters on board', url: 'https://sl.se/reseplanering/att-resa-med-sl/vad-du-far-ta-med-pa-resan/cykel' },
    { title: 'SJ: Luggage rules', url: 'https://www.sj.se/en/about-sj/terms-and-conditions/luggage-rules' },
    { title: 'Jernhusen: Uppsala Centralstation', url: 'https://www.jernhusen.se/hitta-din-station/uppsala-centralstation' },
    { title: 'Uppsala University: E-bike batteries banned indoors (2 October 2024)', url: 'https://www.uu.se/student/nyheter/arkiv/2024-10-02-elcykelbatterier-far-inte-tas-in-i-universitetets-lokaler' },
  ],
};

export default guide;
