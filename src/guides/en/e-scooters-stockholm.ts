import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-stockholm',
  topic: 'stockholm',
  name: 'E-scooter hire in Stockholm',
  title: 'E-scooters Stockholm 2026: Voi, Bolt, prices and rules',
  description: 'E-scooters in Stockholm with Voi and Bolt: the price, who can ride, where to ride and park, Gamla stan, the metro ban and Sweden’s fines.',
  headline: 'E-scooters in Stockholm: Voi, Bolt, prices and where to ride and park',
  lede: 'E-scooters in Stockholm are rented from Voi and Bolt, the only two companies with permits since 1 July 2026. Each app shows the price before you unlock, and Bolt rents only to riders aged 18 or over. Ride on cycle lanes or the road, never on the pavement, and park in one of about 700 bays or a city cycle rack. You can’t take an e-scooter into the metro, even folded.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'se:Stockholm',
  sections: [
    {
      heading: 'E-scooters in Stockholm: Voi and Bolt',
      blocks: [
        '**Voi** and **Bolt** are the only companies renting out e-scooters in the City of Stockholm. On 11 December 2025 the city’s traffic committee (trafiknämnden) limited e-scooter operators to two from 1 July 2026, and in June 2026 the city chose Voi and Bolt, Bolt and the local paper Mitt i reported. Lime had to leave and said it would appeal; we found no ruling on that appeal (October 2026).',
        'The city allows up to **12,000** rental e-scooters, a cap it kept in December 2025, and Bolt says its permit covers up to 6,000 of them for about two years. Each company needs a permit from the Swedish Police Authority (Polismyndigheten) to use public land, granted only if the city agrees, and pays the city SEK 1,400 a scooter a year, the city’s traffic office wrote in October 2025. We found no separate cap for the inner city; from 1 July 2026 the city’s criteria for sharing out scooters reward companies that reach the outer districts.',
        'At about 15:20 on Sunday 25 October 2026 the [map of Stockholm](map:se:Stockholm) showed about 12,300 e-scooters, some 6,600 Voi and 5,700 Bolt: a snapshot, not the fleet size. It shows where they stand and their battery, not prices, zones, parking or hours. Its area reaches past the city limits, so the count can’t be compared with the cap. By Statistics Sweden’s boundaries, about 10,950 stood in the City of Stockholm, 590 in Solna, 380 in Nacka and 370 in Sundbyberg, and none on Lidingö.',
        'Voi and Bolt also rent out **e-bikes** here, up to 1,500 each since 1 January 2026, Mitt i reported in June 2026, citing the city. The map shows standing e-scooters only.',
      ],
    },
    {
      heading: 'How much does a Voi or Bolt e-scooter cost in Stockholm?',
      blocks: [
        '**The app shows the price** before you unlock. We found no Stockholm price on an open official page: Bolt’s Swedish website mentions a small unlocking fee plus a per-minute fee that can vary and sends you to the app for prices; Voi’s website refused our requests.',
        {
          table: {
            caption: 'Voi and Bolt in Stockholm at a glance, October 2026, and who says so',
            head: ['Question', 'Answer', 'Who says so'],
            rows: [
              ['Who rents e-scooters?', 'Voi and Bolt, the only two since 1 July 2026', 'The traffic committee (11 December 2025); Bolt and Mitt i (2 June 2026)'],
              ['What does a ride cost?', 'Shown in the app', 'Bolt’s Swedish website (October 2026)'],
              ['How old must you be?', 'Bolt: 18 or over. Voi: shown in its app', 'Bolt’s terms for Sweden (from 1 February 2023)'],
              ['How many scooters?', 'Up to 12,000 in the city', 'The City of Stockholm (21 October 2026)'],
              ['When can you ride?', 'No hours, night ban or winter pause', 'Nothing found from the city'],
              ['Where does a ride end?', 'In a bay or city cycle rack, outside the no-parking areas', 'The City of Stockholm (21 October 2026)'],
            ],
          },
        },
        'If you leave a Bolt scooter outside its permitted parking area, Bolt’s Swedish terms allow two fees of up to SEK 1,000 each: one to collect it and one for the unpermitted parking. From 1 December 2026, new terms let it charge SEK 60 if the photo the app asks for at the end of a ride shows the scooter wrongly parked.',
        'New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'E-scooter rules in Sweden: age, helmets and where to ride',
      blocks: [
        'An e-scooter (elsparkcykel) counts as a bicycle if it goes no faster than 20 km/h and its motor is rated at no more than 250 W, says the Swedish Transport Agency (Transportstyrelsen, 14 August 2026), so cyclists’ rules apply. The law sets no minimum age; under-15s must wear a helmet, and the agency recommends one for everyone.',
        {
          table: {
            caption: 'E-scooter rules in Stockholm and who sets them, October 2026',
            head: ['Rule', 'What it means', 'Set by', 'If you break it'],
            rows: [
              ['Where to ride', 'The cycle lane if there is one, otherwise the road; from 15 you may use the road anyway, with care, where the limit is 50 km/h or less', 'The law', 'SEK 500'],
              ['Pavements', 'Never ride on a pavement or footway', 'The law', 'SEK 500'],
              ['Pedestrian streets', 'Walking pace; give way to people on foot', 'The law', '–'],
              ['Red lights', 'Stop, as on a bicycle', 'The law', 'SEK 1,500'],
              ['One rider', 'No passengers', 'The law', 'SEK 500 for the rider and SEK 500 for the passenger'],
              ['Helmet', 'Compulsory under 15, recommended for all', 'The law', 'No fine for the rider'],
              ['Alcohol', 'No fixed limit, but you may not ride if drink or drugs stop you riding safely', 'The law', '–'],
              ['Slow zones', 'In some places, such as outdoor café areas, hire scooters slow to walking pace by themselves', 'The city', '–'],
              ['Parking', 'Never on a footway or cycle lane except in a bay or cycle rack', 'The law, since 1 September 2022', 'The city may remove it; Bolt may charge you'],
            ],
          },
        },
        'The police issue these fines on the spot (ordningsbot), at the amounts for cyclists set by the Prosecutor-General (1 November 2025).',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Stockholm',
      blocks: [
        'Since 1 September 2022, Swedish law has banned parking an e-scooter on a footway or cycle lane unless it stands in a bay or cycle rack. Stockholm has about **700 bays for e-scooters**, and its ordinary cycle racks may be used too, the city says (21 October 2026). It can remove scooters left on footways or in people’s way, and it invoiced the companies for just over 35,000 such moves in 2024 and just over 55,000 by September 2025.',
        'You may not end a ride along any of the city’s quays, nor in these places:',
        {
          list: [
            'Hornsbergs strand and Kristinebergs strandpark',
            'Rålambshovsparken',
            'Stockholm City Hall (Stadshuset), its courtyard and park',
            'Odenplan',
            'Sergels torg, lower level',
            'Kungsträdgården',
            'Södra Blasieholmshamnen, outside the Grand Hôtel',
            'Helgeandsholmen, except along Norrbro',
            'Gamla stan, except along Munkbroleden and Skeppsbron',
            'Medborgarplatsen',
            'Drakenbergsparken and Tantolunden',
            'The Masthamnen cruise terminal',
            'Grev Turegatan, from Birger Jarlsgatan to Humlegårdsgatan',
          ],
        },
        'Each company may restrict parking further: check its app. To report a badly parked scooter, contact its company or use the city’s Tyck till app; the companies have agreed with the city to remove a reported scooter within two hours.',
      ],
    },
    {
      heading: 'Gamla stan, Djurgården, campuses and the airport',
      blocks: [
        'All streets in inner Gamla stan, the Old Town, are pedestrian streets, and the city bans all vehicle traffic there from 11:00 to 06:00 without a permit (8 October 2026); its page names no exception for cycles. On a pedestrian street the law requires riders to keep to walking pace and give way to people on foot.',
        {
          table: {
            caption: 'Rules on land owned by others, as each owner states them, October 2026',
            head: ['Place', 'Who says so', 'What it says'],
            rows: [
              ['Royal Djurgården', 'Kungliga Djurgårdsförvaltningen (the Royal Djurgården Administration)', 'No e-scooter rule on its visitor pages (25 October 2026); it calls the bicycle an excellent way to explore the park'],
              ['Skeppsholmen', 'Statens fastighetsverk (the National Property Board)', 'No e-scooter rule on its Skeppsholmen page (25 October 2026)'],
              ['KTH campus', 'Akademiska Hus, the campus owner', 'Built separate e-scooter parking areas because scooters were crowding the cycle racks (17 October 2022)'],
              ['Stockholm University', 'The university', 'Cycle racks near many entrances; e-scooter batteries may not be brought into, stored or charged on its premises (24 September 2026)'],
              ['Stockholm Central Station', 'Jernhusen, the station’s owner', 'No e-scooter rule on its station page (25 October 2026)'],
              ['Arlanda Airport', 'Swedavia', 'Free bicycle parking by the terminals and at SkyCity; nothing on e-scooters (25 October 2026)'],
            ],
          },
        },
        'The map shows no hire scooters near Arlanda.',
      ],
    },
    {
      heading: 'Can you take an e-scooter on the metro, trains, buses or ferries?',
      blocks: [
        '**Not on the metro.** Since 25 November 2024, SL, Stockholm’s public transport, has banned e-scooters on the tunnelbana, even folded, because of the fire risk from their lithium batteries. Elsewhere:',
        {
          list: [
            '**Buses, trams and other trains:** folded e-scooters up to 120 cm long, SL says (October 2026).',
            '**Commuter trains (pendeltåg) and Saltsjöbanan:** unfolded ones too, Region Stockholm said in November 2024; SL’s page now mentions only folded ones.',
            '**Commuter boats such as the Djurgården ferry:** e-scooters must always stand outside on deck, if there is room.',
            '**Everywhere:** no riding on platforms or in stations, and since November 2024 no charging aboard.',
          ],
        },
        'A hire scooter stays on the street: SL bans parking e-scooters on its land except in marked places, so end your ride in a bay or cycle rack near the station.',
      ],
    },
    {
      heading: 'Solna, Sundbyberg, Nacka and the rest of Sweden',
      blocks: [
        'The cap, bays and no-parking areas above are the City of Stockholm’s; its neighbours set their own terms. **Solna** has one-year agreements with Voi and Bolt, whose scooters stand at 52 marked stations (2 July 2026). **Nacka** has an agreement with Voi, for western Sicklaön up to Nacka Forum and Kvarnholmen (10 July 2026), and decided in May 2022 to charge companies SEK 1,400 a scooter a year. For **Sundbyberg** we found no current list; on 25 October the map showed only Voi there.',
        'Elsewhere in Sweden the map shows, among other towns, Voi and Lime in [Uppsala](map:se:Uppsala) and [Gothenburg](map:se:Göteborg), Voi, Bolt and Lime in [Malmö](map:se:Malmö), and Voi and Bolt in Lund. Unlike Stockholm, [Oslo](guide:oslo) stops rentals every night and [Helsinki](guide:helsinki) on weekend nights.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**More complaints.** The city’s traffic office received just over 3,000 fault reports about e-scooters in 2024, and over 4,000 by September 2025.',
            '**A camera for pavements.** In June 2026 Bolt said it had launched 100 sixth-generation scooters, Bolt 6, in Stockholm, with an AI camera that detects pavement riding and checks parking.',
            '**Alcohol and helmets.** In a Chalmers University of Technology study of fatal crashes from 2016 to 2024, 8 of the 18 e-scooter riders killed were under the influence of alcohol and none wore a helmet; nearly nine in ten of the alcohol-related deaths were on privately owned scooters (2 July 2026).',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Stockholm?',
      answer: 'Voi and Bolt, the only two with permits since 1 July 2026. Lime had to leave and said it would appeal; we found no ruling (October 2026).',
    },
    {
      question: 'How much does a Voi or Bolt e-scooter cost in Stockholm?',
      answer: 'The app shows the price before you unlock. Bolt charges an unlocking fee plus a fee per minute, its website says; we found no Stockholm price on an open official page.',
    },
    {
      question: 'Do I need a helmet to ride an e-scooter in Stockholm?',
      answer: 'Only if you are under 15: Swedish law requires a helmet for younger riders, and the Swedish Transport Agency recommends one for everyone. Bolt rents only to riders aged 18 or over.',
    },
    {
      question: 'Can I ride an e-scooter on the pavement in Stockholm?',
      answer: 'No. Ride on the cycle lane, or on the road where there is none; riding on a pavement or footway can cost a SEK 500 fine.',
    },
    {
      question: 'Can I take an e-scooter on the Stockholm metro?',
      answer: 'No, not even folded: SL has banned e-scooters on the tunnelbana since 25 November 2024. Folded e-scooters up to 120 cm long may go on buses, trams and other trains.',
    },
    {
      question: 'Can I ride an e-scooter in Stockholm in winter?',
      answer: 'We found no winter pause or night ban from the city. Bolt’s new terms, from 1 December 2026, tell riders not to ride in snow, ice or sleet, and the app shows whether scooters are available.',
    },
  ],
  sources: [
    { title: 'City of Stockholm: Electric scooters (updated 21 October 2026)', url: 'https://trafik.stockholm/en/traffic-regulations/electric-scooters/' },
    { title: 'Stockholms stad: Elsparkcyklar (updated 28 May 2026)', url: 'https://trafik.stockholm/trafikregler/elsparkcyklar/' },
    { title: 'Stockholms stad: Gamla stan (updated 8 October 2026)', url: 'https://trafik.stockholm/trafikregler/gamla-stan/' },
    { title: 'Trafiknämnden: Minutes, § 31 (11 December 2025)', url: 'https://insynsverige.se/documentHandler.ashx?did=2064027' },
    { title: 'Trafikkontoret: Report on rental e-scooters and bikes (22 October 2025)', url: 'https://insynsverige.se/documentHandler.ashx?did=2063931' },
    { title: 'Riksdagen: Ordningslagen (1993:1617)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/ordningslag-19931617_sfs-1993-1617/' },
    { title: 'Bolt: Permit for e-scooters in Stockholm (2 June 2026)', url: 'https://bolt.eu/sv-se/blog/elsparkcykel-tillstand-stockholm/' },
    { title: 'Mitt i: Voi and Bolt take over the e-scooters (2 June 2026)', url: 'https://www.mitti.se/nyheter/de-tar-over-elsparkcyklarna-i-stan-6.3.368726.b4c13ac4fc' },
    { title: 'Bolt: E-scooters in Sweden', url: 'https://bolt.eu/sv-se/scooters/' },
    { title: 'Bolt: Terms for e-vehicles in Sweden (from 1 February 2023)', url: 'https://bolt.eu/sv-se/legal/micromobility/new-terms-for-e-vehicles/' },
    { title: 'Bolt: Terms for e-vehicles in Sweden (from 1 December 2026)', url: 'https://bolt.eu/sv-se/legal/micromobility/tnc-e-vehicles/' },
    { title: 'Transportstyrelsen: Elsparkcykel (updated 14 August 2026)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/fordon/fordonsregler/regler-for-olika-fordonsslag/elsparkcykel/' },
    { title: 'Transportstyrelsen: Traffic rules for cyclists (updated 22 December 2025)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/trafikregler-och-vagmarken/trafikregler/trafikregler-for-dig-som-cyklar/' },
    { title: 'Riksdagen: Trafikförordningen (1998:1276)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/' },
    { title: 'Åklagarmyndigheten: Fixed fines, annex 1A (1 November 2025)', url: 'https://www.aklagare.se/globalassets/dokument/ordningsbotskatalog/bilaga-1a.pdf' },
    { title: 'SL: Bikes and e-scooters on board', url: 'https://sl.se/reseplanering/att-resa-med-sl/vad-du-far-ta-med-pa-resan/cykel' },
    { title: 'Region Stockholm: New rules on SL (25 November 2024)', url: 'https://www.regionstockholm.se/nyheter/2024/11/nya-regler-for-cyklar-och-elsparkcyklar-i-sl-trafiken/' },
    { title: 'Kungliga Djurgården: Maps and cycling', url: 'https://www.kungligaslotten.se/vara-besoksmal/kungliga-djurgarden/infor-besoket/kartor.html' },
    { title: 'Statens fastighetsverk: Skeppsholmen and Kastellholmen', url: 'https://www.sfv.se/vara-fastigheter/sverige/stockholms-lan/skepps-och-kastellholmen/skeppsholmen-och-kastellholmen' },
    { title: 'Akademiska Hus: E-scooter parking at KTH (17 October 2022)', url: 'https://www.akademiskahus.se/campus--fastigheter/stockholm/kth-campus/issues/3032' },
    { title: 'Stockholm University: Bicycle parking (24 September 2026)', url: 'https://medarbetare.su.se/en/support-and-service/campus-and-premises/staff-parking/bicycle-parking' },
    { title: 'Jernhusen: Stockholm Central Station', url: 'https://www.jernhusen.se/hitta-din-station/stockholms-centralstation/' },
    { title: 'Swedavia: Motorcycle and bicycle parking at Arlanda', url: 'https://www.swedavia.com/arlanda/parking/motorcycle-bicycle-parking/' },
    { title: 'Solna stad: E-scooters in Solna (updated 2 July 2026)', url: 'https://www.solna.se/bygga-bo--miljo/trafik-och-framkomlighet/cykla-i-solna/elsparkcyklar-i-solna' },
    { title: 'Nacka kommun: E-scooters (updated 10 July 2026)', url: 'https://www.nacka.se/stadsutveckling-trafik/cykla-i-nacka/elsparkcyklar/' },
    { title: 'Nacka kommun: Fee for renting out e-scooters (25 May 2022)', url: 'https://www.nacka.se/stadsutveckling-trafik/trafik-och-resande/nyheter-om-trafik-vagar-och-resande/2022/05/nacka-kommun-infor-avgift-for-uthyrning-av-elsparkcyklar/' },
    { title: 'Chalmers: Alcohol behind many fatal e-scooter crashes (2 July 2026)', url: 'https://www.chalmers.se/aktuellt/nyheter/me-kraftig-berusning-bakom-manga-dodsolyckor-med-elsparkcykel/' },
  ],
};

export default guide;
