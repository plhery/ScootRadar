import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-norrkoping',
  topic: 'norrkoping',
  name: 'E-scooters in Norrköping, Sweden',
  title: 'E-scooters Norrköping 2026: Voi, Qick, Ryde and rules',
  description: 'E-scooters in Norrköping: Voi, Qick and Ryde, police permits and the kommun’s conditions, where to ride and park, trams, buses and Sweden’s fines.',
  headline: 'E-scooters in Norrköping: Voi, Qick and Ryde, and where to ride and park',
  lede: 'E-scooters in Norrköping are rented from Voi, Qick and Ryde, the three companies the kommun (the municipality) lists. Our map shows where Voi and Qick scooters stand, but not Ryde’s, and no prices or parking areas: each app shows those. Ride on the cycle lane or the road, never on the pavement, and end your ride in a cycle rack or a marked e-scooter parking place, never on a footway or cycle lane. You may take your own e-scooter, folded, on the trams and buses as hand luggage if there is room.',
  published: '2026-10-29',
  updated: '2026-10-29',
  city: 'se:Norrköping',
  sections: [
    {
      heading: 'E-scooters in Norrköping: Voi, Qick and Ryde',
      blocks: [
        'Electric scooter rental in Norrköping needs a permit from the police to use public land, and the police must include the conditions Norrköpings kommun sets, the kommun says. Its e-scooter page gives contacts for three rental companies (updated 28 July 2026, read 29 October 2026):',
        {
          table: {
            caption: 'E-scooter companies in Norrköping and what the map shows, October 2026',
            head: ['Company', 'On the kommun’s list', 'On the ScootRadar map'],
            rows: [
              ['Voi', 'Yes', 'Yes, with battery'],
              ['Qick', 'Yes', 'Yes, with battery'],
              ['Ryde', 'Yes, and Ryde lists Norrköping among its towns', 'No: check the Ryde app'],
            ],
          },
        },
        '**Ryde isn’t on our map**, so look for its scooters in its own app, and don’t read the map’s total as all the scooters in town. At 13:55 on Thursday 29 October 2026 the [map of Norrköping](/map?origin=58.591,16.1844) showed about 460 Voi scooters free to rent at that moment and about 490 Qick scooters as last counted. Scooters on a ride aren’t shown, nor prices; zoomed in, the map draws the kommun’s e-scooter parking places and zones.',
        'The map has no outline for Norrköping: its total is everything the two companies’ data assign to the town, and Voi’s area takes in Söderköping, a separate municipality, so it isn’t a count within Norrköping’s boundaries. Bolt and Lime aren’t on the kommun’s list.',
      ],
    },
    {
      heading: 'How much does a Voi or Qick scooter cost in Norrköping?',
      blocks: [
        '**The app shows the price** before you unlock. Neither Qick’s nor Ryde’s website lists a Norrköping price (29 October 2026).',
        'Qick rents only to riders aged 18 or over, its website and terms say, and Ryde’s Swedish terms let you ride from 15 (both read 29 October 2026). Check the Voi app for its own age limit and fees.',
        'New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'Norrköping’s conditions for hire scooters',
      blocks: [
        'The kommun’s planning committee (samhällsplaneringsnämnden) set out the conditions it asks of e-scooter companies in land-use guidelines adopted on 11 November 2025, and the kommun’s land-use page lists most of them (30 April 2026). Under them, a company must:',
        {
          list: [
            'move a scooter standing in the way or dangerously to a suitable place **within two hours**, and remove a broken one within a day of learning of it;',
            'keep its scooters out of the way of street cleaning and snow clearing, off the tactile paving that guides blind people, clear of the kommun’s benches, and off grass where they hinder its upkeep;',
            'fit every scooter with a double stand, and have you photograph your parked scooter at the end of each ride;',
            'use geofencing to hold scooters to **6 km/h** on certain stretches and places, and to stop rides ending in areas the kommun marks on its map service.',
          ],
        },
        'The guidelines name no streets, but the kommun’s map service marks those places, and so does our map when you zoom in: its slow zones, the areas where a ride can’t end and those where scooters may not go. The app has the final word. The kommun says it is working with the police to update its conditions (28 July 2026).',
        'The kommun charges each company **SEK 2.50 a day for every scooter** on its land, under fees the municipal council set on 16 December 2024. Its e-scooter page and the guidelines name no cap on numbers, no night rule and no winter pause.',
        'If the kommun picks up a Qick scooter you parked wrongly, Qick’s terms let it charge you up to SEK 1,500; to avoid that, your end-of-ride photo must clearly show the scooter in a cycle rack or other cycle parking. Ryde’s Swedish terms say that if you send no parking photo and a municipality charges Ryde, you pay what Ryde reckons the cost to be.',
      ],
    },
    {
      heading: 'E-scooter rules in Sweden: what applies in Norrköping',
      blocks: [
        'An e-scooter, or elsparkcykel as Norrköping’s own pages call it, counts as a bicycle if it goes no faster than 20 km/h and its motor is rated at no more than 250 W, says the Swedish Transport Agency (Transportstyrelsen, 14 August 2026), so cyclists’ rules apply. The law sets no minimum age; under-15s must wear a helmet, and the agency recommends one for everyone.',
        {
          table: {
            caption: 'E-scooter rules in Norrköping and who sets them, October 2026',
            head: ['Rule', 'What it means', 'Set by', 'If you break it'],
            rows: [
              ['Where to ride', 'The cycle lane if there is one, otherwise the road; from 15 you may use the road anyway, with care, where the limit is 50 km/h or less', 'The law', 'SEK 500'],
              ['Pavements', 'Never ride on a pavement or footway; you may wheel the scooter there', 'The law', 'SEK 500'],
              ['Pedestrian streets', 'Walking pace; give way to people on foot', 'The law', 'SEK 1,000'],
              ['Red lights', 'Stop, as on a bicycle', 'The law', 'SEK 1,500'],
              ['One rider', 'No passengers', 'The law', 'SEK 500 for the rider and SEK 500 for the passenger'],
              ['Helmet', 'Compulsory under 15, recommended for all', 'The law', 'No fine for the rider'],
              ['Alcohol', 'No fixed limit, but you may not ride if drink or drugs stop you riding safely', 'The law', '–'],
              ['Parking', 'In a cycle rack or a marked e-scooter parking place; never on a footway or cycle lane, nor where it blocks the way or puts others in danger', 'The law since 1 September 2022; the kommun', 'The kommun or the police may move it; the company may charge you'],
            ],
          },
        },
        'An e-scooter also needs brakes, a bell, and lights and reflectors in the dark. The police issue these fines on the spot (ordningsbot), at the amounts for cyclists set by the Prosecutor-General (1 November 2025); the kommun says policing traffic is the police’s job. The same national rules apply in Stockholm: see our [Stockholm guide](guide:stockholm).',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Norrköping',
      blocks: [
        'Since 1 September 2022 Swedish law has banned leaving an e-scooter on a footway or cycle lane except in a marked parking place or a cycle rack, though a town may allow exceptions; the kommun’s page makes none. It says you must park **in a cycle rack or in the e-scooter parking places marked with signs and ground markings in the inner city**, just as you would park a bicycle.',
        'The kommun and the police may move a wrongly parked scooter off footways and cycle lanes, at the rental company’s cost, the kommun says. To report one, contact the company that owns it, or use the kommun’s fault-report form (felanmälan) under “parkering”.',
        {
          note: 'In Norrköping a hire scooter belongs in a cycle rack or a marked e-scooter parking place, never on the pavement or a cycle lane. The app shows where ending a ride is allowed.',
        },
      ],
    },
    {
      heading: 'The station, Campus Norrköping, Industrilandskapet and the airport',
      blocks: [
        'Linköping University’s Campus Norrköping lies in the Industrial Landscape (Industrilandskapet), the old mill district along the Motala ström river in the town centre. In the early 1970s the kommun chose to keep the closed mills rather than pull them down, Visit Norrköping says.',
        {
          table: {
            caption: 'Rules on land owned by others, as each owner states them, October 2026',
            head: ['Place', 'Who says so', 'What it says'],
            rows: [
              ['Norrköping Central', 'Jernhusen, the station’s owner', 'No e-scooter rule on its station page'],
              ['Campus Norrköping', 'Linköping University', 'No e-scooter rule found'],
              ['Industrilandskapet', 'Visit Norrköping, the kommun’s visitor service', 'No e-scooter rule found'],
              ['Norrköping Airport', 'The airport, owned by the kommun since 2006', 'No e-scooter rule found; bus 10 from Söder tull stops at Smedbygatan, 1 km away, and buses 440 and 444 from Resecentrum, the travel centre, at Svärmaregatan, 400 m away'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Can you take an e-scooter on a tram, bus or train in Norrköping?',
      blocks: [
        'Östgötatrafiken, the region’s public transport, runs Norrköping’s trams and buses and the Östgötapendeln commuter trains. Its terms (last updated 14 April 2026) let you take your own e-scooter on board as hand luggage if it is **folded as small as it goes** and there is room:',
        {
          list: [
            '**Trams and city buses:** folded e-scooters only, as hand luggage; bicycles aren’t allowed.',
            '**Östgötapendeln and rural buses:** folded e-scooters as hand luggage; bicycles and e-bikes travel free if there is room, at most six bikes on a train, and a simple folding e-scooter with a folding handlebar counts as an e-bike there.',
            '**On board:** it may not block the aisle or an exit or take a seat, and you may not charge it.',
          ],
        },
        'Its terms say nothing about hire scooters: end your ride in a rack or a marked parking place near the stop before you board. On **SJ trains** from Norrköping Central, fold the e-scooter and put it in the luggage rack or under the seat in front of you, not overhead, and don’t charge it on board, SJ says.',
      ],
    },
    {
      heading: 'Linköping and the map',
      blocks: [
        'Östgötapendeln trains run from Norrköping through Linköping to Motala and Tranås, Östgötatrafiken says. Voi, Qick and Ryde rent scooters in Linköping too: see our [Linköping guide](guide:linkoping) and the [Linköping map](map:se:Linköping). To see what is standing near you now, open the [Norrköping map](/map?origin=58.591,16.1844).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Sweden’s oldest airport for airline traffic.** Norrköping’s airport opened in 1934 and is the oldest in Sweden for commercial flights, it says.',
            '**Yellow trams.** Trams carry almost half of all public transport journeys in Norrköping, and having been a symbol of the town for a hundred years, they have kept their original yellow, Östgötatrafiken says.',
            '**A seven-sided mill.** Strykjärnet (“the Flat Iron”), a former cotton mill with seven sides on the islet of Laxholmen, now houses Arbetets museum, the Museum of Work, Visit Norrköping says.',
            '**A station from 1866.** Norrköping Central was built in 1866 and listed in 2001; a new station is to be built a little way off once the Ostlänken line is finished, Jernhusen says.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Norrköping?',
      answer: 'The kommun lists Voi, Qick and Ryde (28 July 2026). The ScootRadar map shows Voi and Qick; Ryde’s scooters are only in its app.',
    },
    {
      question: 'Can I park an e-scooter on the pavement in Norrköping?',
      answer: 'No. Park in a cycle rack or a marked e-scooter parking place, never on a footway or cycle lane, and never in anyone’s way. The kommun and the police may move a wrongly parked scooter, and if the kommun picks up a Qick scooter you left wrongly, Qick can charge you up to SEK 1,500.',
    },
    {
      question: 'How old do you have to be to ride a hire scooter in Norrköping?',
      answer: 'Swedish law sets no minimum age, but Qick rents only to riders aged 18 or over, and Ryde’s Swedish terms say 15. Under-15s must wear a helmet. Check the Voi app for its own limit.',
    },
    {
      question: 'Can I take an e-scooter on a tram or bus in Norrköping?',
      answer: 'Only your own, folded as small as it goes and carried as hand luggage if there is room, Östgötatrafiken says. End a hire-scooter ride before you board.',
    },
    {
      question: 'Is there a cap on e-scooters in Norrköping?',
      answer: 'The kommun names none (28 July 2026). Each company needs a police permit and pays the kommun SEK 2.50 a day per scooter.',
    },
    {
      question: 'Are e-scooters banned at night or in winter in Norrköping?',
      answer: 'No. The kommun’s e-scooter page (28 July 2026) and its guidelines name no night ban, night speed limit or winter pause.',
    },
  ],
  sources: [
    { title: 'Norrköpings kommun: Elsparkcyklar (updated 28 July 2026)', url: 'https://norrkoping.se/boende-trafik-och-miljo/resa-och-parkera/elsparkcyklar' },
    { title: 'Norrköpings kommun: Guidelines for the use of public land (planning committee, 11 November 2025)', url: 'https://norrkoping.se/download/18.5ff942e1184b3f255e218bdc/1770911999429/Markuppl%C3%A5telse%20p%C3%A5%20allm%C3%A4n%20platsmark.pdf' },
    { title: 'Norrköpings kommun: Använda stadens mark, using public land (updated 30 April 2026)', url: 'https://norrkoping.se/arbete-och-naringsliv/etablering-mark-och-byggande/anvanda-stadens-mark' },
    { title: 'Norrköpings kommun: Fees for the use of public land (council, 16 December 2024)', url: 'https://norrkoping.se/download/18.5c87198e194fc3f72312587/1740580096961/Taxa%20f%C3%B6r%20markuppl%C3%A5telser%20241216.pdf' },
    { title: 'Qick: Elsparkcyklar i din stad (read 29 October 2026)', url: 'https://qickscooters.com/sv' },
    { title: 'Qick: Användaravtal, terms of use (read 29 October 2026)', url: 'https://qickscooters.com/sv/terms' },
    { title: 'Ryde: Locations (read 29 October 2026)', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Terms and conditions, Sweden (read 29 October 2026)', url: 'https://www.ryde-technology.com/terms-conditions-sweden' },
    { title: 'Transportstyrelsen: Elsparkcykel (updated 14 August 2026)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/fordon/fordonsregler/regler-for-olika-fordonsslag/elsparkcykel/' },
    { title: 'Riksdagen: Trafikförordningen (1998:1276)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/' },
    { title: 'Åklagarmyndigheten: Fixed fines, annex 1A (1 November 2025)', url: 'https://www.aklagare.se/globalassets/dokument/ordningsbotskatalog/bilaga-1a.pdf' },
    { title: 'Polisen: Cycling rules and fines (reviewed 19 May 2026)', url: 'https://polisen.se/lagar-och-regler/trafik-och-fordon/cykel/' },
    { title: 'Östgötatrafiken: Köp- och resevillkor (updated 14 April 2026)', url: 'https://www.ostgotatrafiken.se/info/kop--och-resevillkor' },
    { title: 'Östgötatrafiken: Vår trafik, our services (updated 20 October 2026)', url: 'https://www.ostgotatrafiken.se/om-oss/darfor-finns-vi/var-trafik' },
    { title: 'SJ: Luggage rules', url: 'https://www.sj.se/en/about-sj/terms-and-conditions/luggage-rules' },
    { title: 'Jernhusen: Norrköpings Centralstation', url: 'https://www.jernhusen.se/hitta-din-station/norrkoping-centralstation/' },
    { title: 'Visit Norrköping: Industrilandskapet, 2026 leaflet', url: 'https://visit.norrkoping.se/download/18.25b3fb9819dd7732d23292b/1778679442411/sve-Industrilandskapet_folder_2026_online.pdf' },
    { title: 'Norrköping Airport: Transfer', url: 'https://www.norrkopingairport.se/forberedelser/transfer' },
    { title: 'Norrköping Airport: About the airport', url: 'https://www.norrkopingairport.se/om-norrkoping-airport' },
  ],
};

export default guide;
