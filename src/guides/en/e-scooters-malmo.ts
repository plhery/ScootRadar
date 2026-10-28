import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-malmo',
  topic: 'malmo',
  name: 'E-scooters in Malmö, Sweden',
  title: 'E-scooters Malmö 2026: Ryde, Voi, Lime, Bolt and rules',
  description: 'E-scooters in Malmö: Ryde, Voi, Lime and Bolt, the City’s cap, where to ride, the parking stands in the centre, trains to Copenhagen and Sweden’s fines.',
  headline: 'E-scooters in Malmö: Ryde, Voi, Lime and Bolt, and where to ride and park',
  lede: 'E-scooters in Malmö are rented from four companies with permits, Ryde, Voi, Lime and Bolt, up to 2,800 scooters between them until 31 March 2027; our map shows all but Ryde. Each app shows the price before you unlock. Ride on cycle lanes or the road, never on the pavement, and in the centre end your ride in a marked e-scooter stand. Swedish law applies, not Denmark’s.',
  published: '2026-10-28',
  updated: '2026-10-28',
  city: 'se:Malmö',
  sections: [
    {
      heading: 'E-scooters in Malmö: four companies, 2,800 scooters',
      blocks: [
        'Electric scooter rental in Malmö needs a permit from the Swedish Police Authority (Polismyndigheten) to use public land, and the City of Malmö (Malmö stad) gives the police its view, including how many scooters each company should have. On 8 September 2026 the City’s traffic committee (tekniska nämndens trafikutskott) shared out its cap of **2,800 e-scooters** for 1 October 2026 to 31 March 2027. It ranked the companies on how they did from February to August, and keeping to the parking rules weighed most:',
        {
          table: {
            caption: 'E-scooters the City allows each company, 1 October 2026 to 31 March 2027, and what the map shows',
            head: ['Company', 'Scooters allowed', 'On the ScootRadar map'],
            rows: [
              ['Ryde', '1,000', 'No: check the Ryde app'],
              ['Voi', '800', 'Yes, with battery'],
              ['Lime', '500', 'Yes, with battery'],
              ['Bolt', '500', 'Yes, with battery unless Bolt hides it'],
            ],
          },
        },
        '**Ryde has the largest share but isn’t on our map**, so look for its scooters in its own app, and don’t read the map’s total as all the scooters in town. At 21:50 on Wednesday 28 October 2026 the [map of Malmö](map:se:Malmö) showed about 640 Voi and 440 Bolt scooters as they stood at that moment, and about 435 Lime scooters as last counted: a snapshot, not the fleet size. Scooters on a ride aren’t shown, nor prices, zones or parking. The map’s area isn’t cut to the city limits and may take in Arlöv and other edges of Malmö’s neighbours.',
        'Before January 2024, when the cap began, Malmö had up to about 6,500 scooters, the City’s streets office (fastighets- och gatukontoret) wrote in January 2026. Within the cap the City also limits the centre: on a daily average, no more than 600 scooters in the inner centre and 800 in the outer centre, limits it kept for this period (September 2026).',
      ],
    },
    {
      heading: 'How much does a Voi, Lime, Bolt or Ryde scooter cost in Malmö?',
      blocks: [
        '**The app shows the price** before you unlock. We found no Malmö price on an open official page: Bolt’s Swedish website gives only prices in euros for the whole country and sends you to the app, Ryde’s website lists none, and Voi’s and Lime’s websites refused our requests.',
        'Bolt rents only to riders aged 18 or over, its Swedish terms say. If you leave a Bolt scooter outside its permitted parking area, it may charge up to SEK 1,000 to collect it and up to SEK 1,000 for the unpermitted parking. From 1 December 2026, new terms add a SEK 60 fee if the photo the app asks for at the end of a ride shows the scooter wrongly parked. Check each app for its own age limit and fees.',
        'New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'E-scooter rules in Sweden: what applies in Malmö',
      blocks: [
        'An e-scooter, or elsparkcykel as Malmö’s own pages call it, counts as a bicycle if it goes no faster than 20 km/h and its motor is rated at no more than 250 W, says the Swedish Transport Agency (Transportstyrelsen, 14 August 2026), so cyclists’ rules apply. If you come over from Denmark, Swedish law applies here, not Danish law. The law sets no minimum age; under-15s must wear a helmet, and the agency recommends one for everyone.',
        {
          table: {
            caption: 'E-scooter rules in Malmö and who sets them, October 2026',
            head: ['Rule', 'What it means', 'Set by', 'If you break it'],
            rows: [
              ['Where to ride', 'The cycle lane if there is one, otherwise the road; from 15 you may use the road anyway, with care, where the limit is 50 km/h or less', 'The law', 'SEK 500'],
              ['Pavements', 'Never ride on a pavement or footway', 'The law', 'SEK 500'],
              ['Pedestrian streets', 'Walking pace; give way to people on foot', 'The law', '–'],
              ['Red lights', 'Stop, as on a bicycle', 'The law', 'SEK 1,500'],
              ['One rider', 'No passengers', 'The law', 'SEK 500 for the rider and SEK 500 for the passenger'],
              ['Helmet', 'Compulsory under 15, recommended for all', 'The law', 'No fine for the rider'],
              ['Alcohol', 'No fixed limit, but you may not ride if drink or drugs stop you riding safely', 'The law', '–'],
              ['Slow zones', 'The City sets zones where hire scooters go slower; the apps show them', 'The City', '–'],
              ['Parking', 'In the centre only in e-scooter stands; never on a footway or cycle lane except in a stand or cycle rack', 'The City; the law since 1 September 2022', 'The City may remove it; Bolt may charge you'],
            ],
          },
        },
        'The police issue these fines on the spot (ordningsbot), at the amounts for cyclists set by the Prosecutor-General (1 November 2025). The City of Malmö says it sets the parking rules and slow zones, while the police enforce the traffic rules and issue the fines. The same national rules apply in Stockholm: see our [Stockholm guide](guide:stockholm).',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Malmö',
      blocks: [
        'Since January 2024 the City has required hire scooters **in the centre** to be parked only in special e-scooter stands, which its papers call mobilitetshagar. Outside the centre you may also use marked parking places and approved cycle racks. Hire bikes share the same places. The City keeps widening the area where stands are compulsory as it builds more, so check the parking area in the app before you end your ride, or on the City’s map of the stands.',
        'The City can remove a wrongly parked hire scooter without warning under the law on vehicle removal, its streets office wrote in January 2026. If a hire scooter is a danger to other road users and you can’t move it yourself, report it to the City of Malmö, which says it will move it.',
        {
          note: 'In central Malmö a hire scooter belongs in a marked e-scooter stand, not at the kerb or in an ordinary cycle rack. The app shows where the stands are.',
        },
      ],
    },
    {
      heading: 'Gamla staden, Västra hamnen, Ribersborg and the station',
      blocks: [
        'For Gamla staden (the old town), Lilla torg and Stortorget, Västra hamnen and the Turning Torso, and the parks, we found no e-scooter rule from the City beyond its parking stands and the slow zones the apps show. Wherever a street is signed as a pedestrian street (gågata), the law requires walking pace and gives people on foot priority; the City’s map marks its pedestrian zones. Ribersborgsstigen, by Ribersborg beach, is the city’s one cycle street (cykelgata), where vehicles may go no faster than 30 km/h.',
        'Malmö bans motor traffic from 23:00 to 05:00 on parts of Bergsgatan and Stora Nygatan all year, but the ban doesn’t cover cycles, the City says, and an e-scooter counts as one. We found no night rule or winter pause for hire scooters from the City (October 2026).',
        {
          table: {
            caption: 'Rules on land owned by others, as each owner states them, October 2026',
            head: ['Place', 'Who says so', 'What it says'],
            rows: [
              ['Malmö Central Station', 'Jernhusen, the station’s owner', 'No e-scooter rule on its station page (28 October 2026)'],
              ['Station platforms', 'Skånetrafiken', 'No riding or parking cycles on platforms'],
              ['Malmö universitet', 'The university', 'No e-scooter rule found (28 October 2026)'],
              ['Malmö Airport', 'Swedavia', 'No e-scooter rule found; the map’s Malmö area stops well short of the airport at Sturup'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Can you take an e-scooter on the train or bus, or to Copenhagen?',
      blocks: [
        'Skånetrafiken, the region’s public transport, treats an e-scooter as hand luggage if it is **folded as small as it goes** for the whole trip:',
        {
          list: [
            '**Pågatåg and Öresundståg trains:** folded e-scooters count as hand luggage, under the seat, if there is room.',
            '**City and regional buses:** folded e-scooters only, as hand luggage; on city buses, if there is room.',
            '**Platforms:** no riding, and no parking.',
          ],
        },
        'A hire scooter stays on the street: end your ride in a stand near the station before you board. The Öresundståg to Copenhagen takes a folded e-scooter of your own as hand luggage, but not a hire scooter.',
      ],
    },
    {
      heading: 'Lund, city bikes and e-bikes',
      blocks: [
        'Lund is a separate town with its own rules: the [map of Lund](map:se:Lund) shows Voi and Bolt there.',
        'Malmö by Bike, the city bike system, has more than 1,000 bikes at over 100 stations and is open round the clock all year. Bauer Media owns and runs it for the City, and from week 46 of 2026, which starts on 9 November, riders aged 18 to 25 ride it free, the City says (28 October 2026).',
        'Shared e-bikes were last in Malmö in 2024. On 5 October 2026 the traffic committee backed police permits for Voi and Ryde to rent out up to 300 e-bikes each, on trial until 31 March 2027. The map shows standing e-scooters only, not bikes.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Twice as many rides.** About 3.9 million e-scooter rides were taken in Malmö in 2025, twice as many as in 2024, the City’s streets office counted.',
            '**More crashes.** E-scooters, private and hired alike, were in 40.5% of the cycle accidents recorded in Malmö in 2025, against about 29% from 2022 to 2024, and e-scooter accidents among under-18s more than doubled on 2024 (up 116%), by the City’s still incomplete count.',
            '**Two or three on one scooter.** The City saw more riding on footways and two or three people on one scooter in 2025. In February 2026 it added riders’ behaviour to the ways it judges the companies, though by September it had too little data to use it.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Malmö?',
      answer: 'Ryde, Voi, Lime and Bolt hold permits from 1 October 2026 to 31 March 2027, with up to 1,000, 800, 500 and 500 scooters. The ScootRadar map shows Voi, Lime and Bolt; Ryde’s scooters are only in its app.',
    },
    {
      question: 'How much does an e-scooter cost in Malmö?',
      answer: 'Each app shows the price before you unlock. We found no Malmö price on an open official page, and the companies’ prices can change.',
    },
    {
      question: 'Do I need a helmet to ride an e-scooter in Malmö?',
      answer: 'Only if you are under 15: Swedish law requires a helmet for younger riders, and the Swedish Transport Agency recommends one for everyone. Bolt rents only to riders aged 18 or over.',
    },
    {
      question: 'Where can I leave a hire scooter in Malmö?',
      answer: 'In the centre, only in a marked e-scooter stand. Elsewhere in a stand, a marked parking place or an approved cycle rack, never on a footway or cycle lane. The app shows where ending a ride is allowed.',
    },
    {
      question: 'Can I ride a Malmö e-scooter to Copenhagen?',
      answer: 'No. A hire scooter can’t go on the train, so end your ride in Malmö before you board. You may take your own e-scooter on the Öresundståg if it is fully folded, fits under the seat and there is room.',
    },
    {
      question: 'Are e-scooters banned at night in Malmö?',
      answer: 'No. We found no night ban or winter pause for hire scooters from the City (October 2026). Bolt’s terms from 1 December 2026 tell riders not to ride in snow or ice.',
    },
  ],
  sources: [
    { title: 'Malmö stad: Elsparkcyklar (updated 17 August 2026)', url: 'https://malmo.se/Bo-och-leva/Stadsmiljo-och-trafik/Trafik/For-dig-som-cyklar/Elsparkcyklar.html' },
    { title: 'Malmö stad: Minutes of the traffic committee, § 69 (8 September 2026)', url: 'https://motenmedborgarportal.malmo.se/committees/tekniska-namndens-trafikutskott/mote-2026-09-08/protocol/protokoll-tru-2026-09-08pdf?downloadMode=open' },
    { title: 'Malmö stad: Report on permits for rental e-scooters (4 September 2026)', url: 'https://motenmedborgarportal.malmo.se/welcome-sv/namnder-styrelser/tekniska-namndens-trafikutskott/mote-2026-09-08/agenda/g-tjansteskrivelse-tru-260908-tillstandsansokningar-for-uthyrningsverksamhet-av-elsparkcyklarpdf?downloadMode=open' },
    { title: 'Malmö stad: Report on permits for rental e-scooters (25 January 2026)', url: 'https://motenmedborgarportal.malmo.se/welcome-sv/namnder-styrelser/tekniska-namndens-trafikutskott/mote-2026-02-03/agenda/g-tjansteskrivelse-tru-260203-tillstandsansokningar-for-uthyrningsverksamhet-av-elsparkcyklarpdf?downloadMode=open' },
    { title: 'Malmö stad: Minutes of the traffic committee, § 76, rental e-bikes (5 October 2026)', url: 'https://motenmedborgarportal.malmo.se/committees/tekniska-namndens-trafikutskott/mote-2026-10-05/protocol/protokoll-tru-2026-10-05pdf?downloadMode=open' },
    { title: 'Malmö stad: Map of e-scooter stands (mobilitetshagar)', url: 'https://stadsatlas.malmo.se/kartor/mobilitetshagar' },
    { title: 'Malmö stad: Night driving bans (updated 15 September 2026)', url: 'https://malmo.se/Bo-och-leva/Stadsmiljo-och-trafik/Trafik/Korforbud-pa-gator-nattetid.html' },
    { title: 'Malmö kommun: Night ban on Stora Nygatan, 1280 2025:04374 (24 November 2025)', url: 'https://rdt.transportstyrelsen.se/rdt/AF06_View.aspx?UseStfs=1&ForeskriftId=d4d00869-5dd2-4391-bc30-6c4249e9475f' },
    { title: 'Malmö stad: Cykelgata', url: 'https://malmo.se/Bo-och-leva/Stadsmiljo-och-trafik/Trafik/For-dig-som-cyklar/Cykelgata.html' },
    { title: 'Malmö stad: Hyrcykel, Malmö by Bike (updated 28 October 2026)', url: 'https://malmo.se/Bo-och-leva/Stadsmiljo-och-trafik/Trafik/For-dig-som-cyklar/Hyrcykel.html' },
    { title: 'Transportstyrelsen: Elsparkcykel (updated 14 August 2026)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/fordon/fordonsregler/regler-for-olika-fordonsslag/elsparkcykel/' },
    { title: 'Transportstyrelsen: Traffic rules for cyclists (updated 22 December 2025)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/trafikregler-och-vagmarken/trafikregler/trafikregler-for-dig-som-cyklar/' },
    { title: 'Riksdagen: Trafikförordningen (1998:1276)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/' },
    { title: 'Åklagarmyndigheten: Fixed fines, annex 1A (1 November 2025)', url: 'https://www.aklagare.se/globalassets/dokument/ordningsbotskatalog/bilaga-1a.pdf' },
    { title: 'Skånetrafiken: On board', url: 'https://www.skanetrafiken.se/sa-reser-du-med-oss/sa-funkar-det-ombord/' },
    { title: 'Bolt: Terms for e-vehicles in Sweden (from 1 February 2023)', url: 'https://bolt.eu/sv-se/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Bolt: Terms for e-vehicles in Sweden (from 1 December 2026)', url: 'https://bolt.eu/sv-se/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Bolt: E-scooters in Sweden', url: 'https://bolt.eu/sv-se/scooters/' },
    { title: 'Jernhusen: Malmö Central Station', url: 'https://www.jernhusen.se/hitta-din-station/malmo-centralstation' },
  ],
};

export default guide;
