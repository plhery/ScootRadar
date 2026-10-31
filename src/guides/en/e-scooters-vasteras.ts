import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-vasteras',
  topic: 'vasteras',
  name: 'E-scooters in Västerås, Sweden',
  title: 'E-scooters Västerås 2026: Voi, Ryde and the rules',
  description: 'E-scooters in Västerås: Voi and Ryde, the city’s permit conditions, slow zones, where to ride and park, VL buses, trains and Sweden’s fines.',
  headline: 'E-scooters in Västerås: Voi and Ryde, and where to ride and park',
  lede: 'E-scooters in Västerås are rented from Voi and Ryde, the two companies with permits, Västerås stad says (October 2026). Our map shows where Voi scooters stand, but not Ryde’s, and, zoomed in, the city’s parking places and zones; each app shows its prices. Ride on the cycle lane or the road, never on the pavement; hire scooters slow to 10 km/h in the city’s slow zones. End your ride in an e-scooter parking place or cycle parking, never on a pavement or footway.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'se:Västerås',
  sections: [
    {
      heading: 'E-scooters in Västerås: Voi and Ryde',
      blocks: [
        'Electric scooter rental in Västerås needs a permit: companies apply to the police, and Västerås stad (the City of Västerås) sets the conditions. Its e-scooter page names two companies with permits (read 29 October 2026):',
        {
          table: {
            caption: 'E-scooter companies in Västerås and what the map shows, October 2026',
            head: ['Company', 'Permit, as the city lists it', 'On the ScootRadar map'],
            rows: [
              ['Voi', 'Yes (red scooters)', 'Yes, with battery'],
              ['Ryde', 'Yes (green scooters), and Ryde lists Västerås among its towns', 'No: check the Ryde app'],
            ],
          },
        },
        '**Ryde isn’t on our map**, so look for its scooters in its own app, and don’t read the map’s total as all the scooters in town. At 13:55 on Thursday 29 October 2026 the [map of Västerås](map:se:Västerås) showed about 960 Voi scooters free to rent at that moment. Scooters on a ride aren’t shown, nor prices; zoomed in, the map draws Västerås stad’s e-scooter parking places, its slow zones and the areas where you may not park or ride.',
        'That total takes in the whole town and some of the villages around it, in an area up to about 15 km across, but no neighbouring town. Bolt, Lime and Qick aren’t on the city’s list.',
      ],
    },
    {
      heading: 'How much does a Voi or Ryde scooter cost in Västerås?',
      blocks: [
        '**The app shows the price** before you unlock.',
        'Ryde’s Swedish terms let you ride from 15 and allow a fee of up to SEK 500 if you take a scooter outside its operating area (read 29 October 2026). Check the Voi app for its own age limit and fees.',
        'New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Västerås stad’s permit conditions: zones, removals and caps',
      blocks: [
        'The city’s conditions for rental companies (read 29 October 2026) include:',
        {
          list: [
            '**Slow zones:** the companies must set their scooters to go no faster than 10 km/h in the city’s low-speed areas (lågfartszoner).',
            '**No-ride and no-parking areas:** the companies must apply the city’s speed limits, no-ride areas and the places where a ride may not end. The city can add areas while a permit runs, and the companies must put changes into their apps within three working days.',
            '**Removals:** the companies must move a badly parked, fallen or broken scooter within two hours and take broken ones away within 24 hours. If the city’s contractors have to move one, the company pays; the conditions name no amount.',
            '**Caps:** each permit sets the most scooters a company may put out, and the city may lower it after repeated breaches. We found no published figure for 2026.',
          ],
        },
        'Permits run for a season from 1 May to 30 April, and companies must apply by 31 January each year. The conditions name no night ban, night speed limit or winter pause for riders; they only bar the companies from collecting scooters in residential areas between 22:00 and 06:00.',
      ],
    },
    {
      heading: 'E-scooter rules in Sweden: what applies in Västerås',
      blocks: [
        'An e-scooter, or elsparkcykel as Västerås stad’s own pages call it, counts as a bicycle if it goes no faster than 20 km/h and its motor is rated at no more than 250 W, says the Swedish Transport Agency (Transportstyrelsen, 14 August 2026), so cyclists’ rules apply. The law sets no minimum age; under-15s must wear a helmet, and the agency recommends one for everyone.',
        {
          table: {
            caption: 'E-scooter rules in Västerås and who sets them, October 2026',
            head: ['Rule', 'What it means', 'Set by', 'If you break it'],
            rows: [
              ['Where to ride', 'The cycle lane if there is one, otherwise the road; from 15 you may use the road anyway, with care, where the limit is 50 km/h or less', 'The law', 'SEK 500'],
              ['Pavements', 'Never ride on a pavement or footway; you may wheel the scooter there', 'The law', 'SEK 500'],
              ['Pedestrian streets', 'Walking pace; give way to people on foot', 'The law', 'SEK 1,000'],
              ['Red lights', 'Stop, as on a bicycle', 'The law', 'SEK 1,500'],
              ['One rider', 'No passengers', 'The law', 'SEK 500 for the rider and SEK 500 for the passenger'],
              ['Helmet', 'Compulsory under 15, recommended for all', 'The law', 'No fine for the rider'],
              ['Alcohol', 'No fixed limit, but you may not ride if drink or drugs stop you riding safely', 'The law', '–'],
              ['Slow zones', 'Hire scooters go no faster than 10 km/h there', 'The city’s permit conditions', '–'],
              ['Parking', 'Preferably in an e-scooter parking place or cycle parking; never on a footway or cycle lane, nor where it blocks the way or puts others in danger', 'The law since 1 September 2022; the city', 'The city may have it moved; the company may charge you'],
            ],
          },
        },
        'The police issue these fines on the spot (ordningsbot), at the amounts for cyclists set by the Prosecutor-General (1 November 2025). In June 2026 the city and the Västerås police joined forces to warn that giving someone a lift on an e-scooter is dangerous and can lead to a fine. The same national rules apply in Stockholm: see our [Stockholm guide](guide:stockholm).',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Västerås',
      blocks: [
        'Since 1 September 2022 Swedish law has banned leaving an e-scooter on a footway or cycle lane except in a marked parking place or a cycle rack. Västerås stad asks you to park where the scooter doesn’t block anyone, never on a pavement or footway, and to choose an e-scooter parking place (uppställningsplats) or cycle parking first.',
        'The city’s [digital map of e-scooter rules](https://gisportal.vasteras.se/portal/apps/webappviewer/index.html?id=27c54fbfdc5c47f8b827dca65914920a) shows where riding or parking is banned and where slow zones apply. On 29 October 2026 it marked about 500 no-parking areas, among them the bus station and some bus stops and pedestrian crossings; nearly 300 parking places, one of them at the city hall (Stadshuset); and 17 areas where you may neither ride nor park, such as schools, multi-storey car parks and the inside of a shopping centre. Our [map](map:se:Västerås) draws them too when you zoom in.',
        'In April 2025 the city began trying out marked areas for picking up and leaving hire scooters at four central places: two at the travel centre (resecentrum), one at the Silo car park and one at Oxbackens centrum.',
        'To report a badly parked scooter, tell the company that owns it first: Voi at support@voiapp.io, Ryde at geofence.vasteras@ryde-technology.com. If the problem persists, report it to the city with a photo and the position, through its website or its app Mitt Västerås. Ryde’s Swedish terms say that if you send no parking photo and a municipality charges Ryde, you pay what Ryde reckons the cost to be.',
        {
          note: 'In Västerås a hire scooter belongs in an e-scooter parking place or cycle parking, never on the pavement or a footway. The app shows where ending a ride is allowed.',
        },
      ],
    },
    {
      heading: 'Where to ride: the centre, the station, Mälardalen University and the airport',
      blocks: [
        'Ride on the cycle lane, or in some cases the road, the city says. This summer, from 15 June to 16 August 2026, Vasagatan in the city centre was a summer pedestrian street (sommargågata): you had to walk a cycle or e-scooter along it, and hire scooters couldn’t be ridden there at all. Check the city’s map before you head for Stora torget, Vasaparken or the Mälaren shore. We found no e-scooter rule of their own for Vasaparken or the shore; the map shows a parking place at the ferry quay (Färjkajen).',
        {
          table: {
            caption: 'Rules on land owned by others, as each owner states them, October 2026',
            head: ['Place', 'Who says so', 'What it says'],
            rows: [
              ['Västerås Central', 'Jernhusen, the station’s owner', 'No e-scooter rule on its station page (read 29 October 2026)'],
              ['Campus Västerås', 'Mälardalen University', 'No e-scooters or e-bikes on its free student bus (MDU-bussen) to Campus Eskilstuna, for safety; ordinary folding bikes may come (read 29 October 2026)'],
              ['Stockholm Västerås Airport', 'The airport', 'At Hässlö, about 5 km east of the centre; VL bus 3 runs there from the central station and the city every ten minutes on weekdays; no e-scooter rule on its page'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Can you take an e-scooter on a VL bus or the train?',
      blocks: [
        'Västmanlands Lokaltrafik (VL), the county’s public transport, says in its travel conditions (in force from 5 August 2026) that you may not ride an e-scooter on board. You may bring one only folded, as luggage, if you can carry it without trouble; the driver decides what is too bulky or unsafe. End a hire-scooter ride at a rack or parking place near the stop before you board.',
        'For trains, each company sets its own rule:',
        {
          list: [
            '**Mälartåg**, whose regional line from Linköping through Eskilstuna and Västerås to Sala and Uppsala stops here: fold the e-scooter and keep it in the luggage rack or on the floor by your seat, not on the overhead shelf; you may not charge it on board.',
            '**On SJ’s trains**, SJ says, fold it and put it in the luggage rack or under the seat in front of you, not overhead; you may not charge it on board.',
          ],
        },
      ],
    },
    {
      heading: 'Örebro and the map',
      blocks: [
        'Voi and Ryde also rent scooters in Örebro, alongside Qick: see our [Örebro guide](guide:orebro). The map shows standing e-scooters only, not bikes. To see what is standing near you now, open the [Västerås map](map:se:Västerås).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**A surprise in 2019.** Hire e-scooters reached Västerås in June 2019 and took the municipality by surprise; mainly one company had set up, and it said it had 50 scooters in town, SVT reported.',
            '**No limit in 2024.** In April 2024 the city told SVT it had set no limit on numbers and, after three companies applied, expected just over 2,000 scooters that summer; by October 2026 two companies held permits.',
            '**Red or green.** Voi’s Västerås scooters are red and Ryde’s are green, the city says: handy when you report one left in the way.',
            '**Parking bans on request.** Some of the city’s no-parking areas for e-scooters were added at the request of housing co-operatives (bostadsrättsföreningar) or landowners, its map notes.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Västerås?',
      answer: 'Voi and Ryde, the two companies with permits, Västerås stad says (read 29 October 2026). The ScootRadar map shows Voi; Ryde’s scooters are only in its app.',
    },
    {
      question: 'Can I park an e-scooter on the pavement in Västerås?',
      answer: 'No. Park in an e-scooter parking place or cycle parking, never on a pavement, footway or cycle lane, and never in anyone’s way. The city’s map and the app show where a ride may not end.',
    },
    {
      question: 'How old do you have to be to ride a hire scooter in Västerås?',
      answer: 'Swedish law sets no minimum age, but Ryde’s Swedish terms say 15. Under-15s must wear a helmet. Check the Voi app for its own limit.',
    },
    {
      question: 'Can I take an e-scooter on the bus in Västerås?',
      answer: 'Only folded, as luggage you can carry without trouble, under VL’s travel conditions; the driver decides what is too bulky. You may not ride it on board.',
    },
    {
      question: 'Is there a cap on e-scooters in Västerås?',
      answer: 'Each company’s permit sets the most scooters it may put out; we found no published figure for 2026. The city can lower it after repeated breaches.',
    },
    {
      question: 'Are e-scooters banned at night or in winter in Västerås?',
      answer: 'No. The city’s conditions (read 29 October 2026) name no night ban, night speed limit or winter pause for riders.',
    },
  ],
  sources: [
    { title: 'Västerås stad: Res med elsparkcykel, riding an e-scooter (read 29 October 2026)', url: 'https://www.vasteras.se/trafik-och-gator/hallbara-resor/res-med-elsparkcykel.html' },
    { title: 'Västerås stad: Villkor för uthyrning av elsparkcyklar, conditions for rental (read 29 October 2026)', url: 'https://www.vasteras.se/naringsliv-och-foretagande/tillstand-regler-och-tillsyn/villkor-for-uthyrning-av-elsparkcyklar.html' },
    { title: 'Västerås stad: Digital map of e-scooter bans and slow zones (read 29 October 2026)', url: 'https://gisportal.vasteras.se/portal/apps/webappviewer/index.html?id=27c54fbfdc5c47f8b827dca65914920a' },
    { title: 'Västerås stad: Special places for e-scooters (8 April 2025)', url: 'https://www.vasteras.se/nyheter/nyheter/2025-04-08-nu-skapar-vi-sarskilda-platser-for-elsparkcyklar.html' },
    { title: 'Västerås stad: Traffic on the summer pedestrian street (15 June 2026)', url: 'https://www.vasteras.se/nyheter/nyheter/2026-06-15-detta-galler-for-trafiken-langs-sommargagatan-i-city.html' },
    { title: 'Västerås stad: Giving a lift on an e-scooter (22 June 2026)', url: 'https://www.vasteras.se/nyheter/nyheter/2026-06-22-skjutsa-pa-elsparkcykeln---ar-det-vart-det.html' },
    { title: 'Ryde: Locations (read 29 October 2026)', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Terms and conditions, Sweden (read 29 October 2026)', url: 'https://www.ryde-technology.com/terms-conditions-sweden' },
    { title: 'Transportstyrelsen: Elsparkcykel (updated 14 August 2026)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/fordon/fordonsregler/regler-for-olika-fordonsslag/elsparkcykel/' },
    { title: 'Riksdagen: Trafikförordningen (1998:1276)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/' },
    { title: 'Åklagarmyndigheten: Fixed fines, annex 1A (1 November 2025)', url: 'https://www.aklagare.se/globalassets/dokument/ordningsbotskatalog/bilaga-1a.pdf' },
    { title: 'VL: Travel conditions (in force from 5 August 2026)', url: 'https://www.vl.se/biljetter/villkor-och-ersattning/resevillkor/' },
    { title: 'Mälartåg: Travelling with a bike', url: 'https://www.malardalstrafik.se/maelartaag/res-med-cykel/' },
    { title: 'Mälartåg: Our lines', url: 'https://www.malardalstrafik.se/maelartaag/' },
    { title: 'SJ: Luggage rules', url: 'https://www.sj.se/en/about-sj/terms-and-conditions/luggage-rules' },
    { title: 'Jernhusen: Västerås Centralstation', url: 'https://www.jernhusen.se/hitta-din-station/vasteras-centralstation/' },
    { title: 'Stockholm Västerås Airport: Getting to and from the airport', url: 'https://vasterasairport.se/infor-flygresan/ta-dig-till-och-fran-flygplatsen.html' },
    { title: 'Mälardalen University: MDU-bussen, the student bus (read 29 October 2026)', url: 'https://www.mdu.se/student/under-studietiden/campus-och-lokaler/mdu-bussen' },
    { title: 'SVT Västmanland: The e-scooters have come to Västerås (11 June 2019)', url: 'https://www.svt.se/nyheter/lokalt/vastmanland/elsparkcyklarna-har-kommit-till-vasteras' },
    { title: 'SVT Västmanland: A record number of e-scooters in Västerås (10 April 2024)', url: 'https://www.svt.se/nyheter/lokalt/vastmanland/rekordmanga-elsparkcyklar-i-vasteras-okar-till-2-000' },
  ],
};

export default guide;
