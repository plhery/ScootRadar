import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-helsingborg',
  topic: 'helsingborg',
  name: 'E-scooters in Helsingborg, Sweden',
  title: 'E-scooters Helsingborg 2026: Voi, Ryde and the rules',
  description: 'E-scooters in Helsingborg: Voi and Ryde, the City’s slow zones and fees, where to park in the centre, Skånetrafiken, the Helsingør ferry and Sweden’s fines.',
  headline: 'E-scooters in Helsingborg: Voi and Ryde, and where to ride and park',
  lede: 'E-scooters in Helsingborg are rented from Voi and Ryde, the two companies Helsingborgs stad names (October 2026). Our map shows where Voi scooters stand, but not Ryde’s, nor prices or the companies’ slow zones: each app shows those. Ride on the cycle lane or the road, never on the pavement; hire scooters slow to 10 km/h on pedestrian streets and in Stadsparken. In central Helsingborg, end your ride in a cycle rack or a marked e-scooter place, never on a footway or cycle lane.',
  published: '2026-10-30',
  updated: '2026-10-30',
  city: 'se:Helsingborg',
  sections: [
    {
      heading: 'E-scooters in Helsingborg: Voi and Ryde',
      blocks: [
        'Electric scooter rental in Helsingborg is run by private companies under agreements with Helsingborgs stad (the City of Helsingborg). Its e-scooter page names two of them (updated 6 March 2026, read 30 October 2026):',
        {
          table: {
            caption: 'E-scooter companies in Helsingborg and what the map shows, October 2026',
            head: ['Company', 'On the City’s page', 'On the ScootRadar map'],
            rows: [
              ['Voi', 'Yes', 'Yes, with battery'],
              ['Ryde', 'Yes, and Ryde lists Helsingborg among its towns', 'No: check the Ryde app'],
            ],
          },
        },
        '**Ryde isn’t on our map**, so look for its scooters in its own app, and don’t read the map’s total as all the scooters in town. At 00:34 on Friday 30 October 2026 the [map of Helsingborg](map:se:Helsingborg) showed about 760 Voi scooters free to rent at that moment. Scooters on a ride aren’t shown, nor prices; zoomed in, the map draws central Helsingborg, where Helsingborgs stad’s local traffic rule has you park in a cycle rack or a marked place.',
        'That total takes in the town from Råå in the south almost to Laröd in the north, an area about 11 km long, but not Ödåkra, Påarp or Helsingør across the Sound. Bolt, Dott and Lime aren’t on the City’s list.',
      ],
    },
    {
      heading: 'How much does a Voi or Ryde scooter cost in Helsingborg?',
      blocks: [
        '**The app shows the price** before you unlock.',
        'Ryde’s Swedish terms let you ride from 15, round the per-minute price up to the next whole minute and allow a fee of up to SEK 500 if you take a scooter outside its operating area (read 30 October 2026). Check the Voi app for its own age limit and fees.',
        'New to hire scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'The City’s rules for the companies: slow zones, a parking patrol and fees',
      blocks: [
        'The City issues no special permit for e-scooters, its page says: the companies set up on commercial terms, and the City works with them through agreements. Under those agreements:',
        {
          list: [
            '**Slow zones:** hire scooters slow automatically to 10 km/h on pedestrian streets (gågator) and in Stadsparken, the city park, among other places.',
            '**Parking patrol:** since 2021 the companies have run a parking patrol (parkeringspatrull) that moves scooters parked wrongly, dangerously or in the way of traffic.',
            '**Fees:** each company pays a fee to set up and a recurring fee for the scooters it has out.',
          ],
        },
        'These are the City’s charges to the companies, not to riders. Under its fee schedule for public land (section 6.14, revised 27 August 2024), a company setting up pays SEK 200,000, then a daily charge per scooter on the most scooters it says it will run from May to October and from November to April: SEK 4 a scooter for a fleet of up to 300, SEK 2 for 301 to 700 and SEK 8 for more than 700, indexed yearly.',
        'We found no published cap on numbers, and neither the City’s page nor the fee schedule names a night ban, a night speed limit or a winter pause for riders (October 2026).',
      ],
    },
    {
      heading: 'E-scooter rules in Sweden: what applies in Helsingborg',
      blocks: [
        'An e-scooter, or elsparkcykel as Helsingborgs stad’s own pages call it, counts as a bicycle if it goes no faster than 20 km/h and its motor is rated at no more than 250 W, says the Swedish Transport Agency (Transportstyrelsen, 14 August 2026), so cyclists’ rules apply. If you come over from Denmark, Swedish law applies here, not Danish law. The law sets no minimum age; under-15s must wear a helmet, and the agency recommends one for everyone.',
        {
          table: {
            caption: 'E-scooter rules in Helsingborg and who sets them, October 2026',
            head: ['Rule', 'What it means', 'Set by', 'If you break it'],
            rows: [
              ['Where to ride', 'The cycle lane if there is one, otherwise the road; from 15 you may use the road anyway, with care, where the limit is 50 km/h or less', 'The law', 'SEK 500'],
              ['Pavements', 'Never ride on a pavement or footway; you may wheel the scooter there', 'The law', 'SEK 500'],
              ['Pedestrian streets', 'Walking pace; give way to people on foot', 'The law', 'SEK 1,000'],
              ['Red lights', 'Stop, as on a bicycle', 'The law', 'SEK 1,500'],
              ['One rider', 'No passengers', 'The law', 'SEK 500 for the rider and SEK 500 for the passenger'],
              ['Helmet', 'Compulsory under 15, recommended for all', 'The law', 'No fine for the rider'],
              ['Alcohol', 'No fixed limit, but you may not ride if drink or drugs stop you riding safely', 'The law', '–'],
              ['Slow zones', 'Hire scooters go no faster than 10 km/h on pedestrian streets and in Stadsparken', 'The City’s agreements with the companies', '–'],
              ['Parking', 'In central Helsingborg only in a cycle rack or a marked e-scooter place; elsewhere wherever it is safe and out of the way', 'The law since 1 September 2022; the City’s local traffic rules', 'The company may move it and may charge you'],
            ],
          },
        },
        'The police issue these fines on the spot (ordningsbot), at the amounts for cyclists set by the Prosecutor-General (1 November 2025). The same national rules apply in Stockholm: see our [Stockholm guide](guide:stockholm).',
      ],
    },
    {
      heading: 'Where to park an e-scooter in Helsingborg',
      blocks: [
        'Since 1 September 2022 Swedish law has banned leaving an e-scooter on a footway or cycle lane except in a marked parking place or a cycle rack, though a town may allow exceptions. Helsingborg applies the ban in **central Helsingborg**: there you must park in a cycle rack or one of the special e-scooter places, which the companies’ apps mark. On the City’s maps the zone is the uncoloured area around the centre, Söder, Högaborg, Eneborg, Olympia and Slottshöjden; the red is the rest of the municipality, where the ban doesn’t apply. Our [map](map:se:Helsingborg) draws the same area when you zoom in.',
        'Elsewhere in the municipality parking stays free for e-scooters, with no new ban, the City says (page updated 8 April 2024). Wherever you are, don’t leave a scooter where it is a danger or in anyone’s way.',
        'To report a badly parked scooter, use the City’s fault report (felanmälan) on its website or its app Ett bättre Helsingborg (A better Helsingborg), and the City passes it on to the company. Or contact the company: Voi at support@voiapp.io, Ryde at support@ryde-technology.com. Ryde’s Swedish terms ask for a parking photo at the end of each ride; if you send none and a municipality charges Ryde, you pay what Ryde reckons the cost to be.',
        {
          note: 'In central Helsingborg a hire scooter belongs in a cycle rack or a marked e-scooter place, never on a footway or cycle lane. The app shows where ending a ride is allowed.',
        },
      ],
    },
    {
      heading: 'Where to ride: Knutpunkten, Stortorget, Kullagatan and Campus Helsingborg',
      blocks: [
        'E-scooters follow the same rules as bicycles, the City says, so ride on the cycle lane where there is one, otherwise the road. On pedestrian streets such as Kullagatan, between Stortorget and S:t Jörgens plats, the law allows only walking pace and gives people on foot priority, and hire scooters slow to 10 km/h. For Stortorget itself and the harbour front we found no e-scooter rule of the City’s beyond the parking zone and the slow zones.',
        {
          table: {
            caption: 'Rules at stations and campus, as each owner states them, October 2026',
            head: ['Place', 'Who says so', 'What it says'],
            rows: [
              ['Helsingborg C (Knutpunkten)', 'Jernhusen, on its station page', 'No e-scooter rule (read 30 October 2026)'],
              ['Station platforms', 'Skånetrafiken', 'No riding or parking cycles on platforms'],
              ['Campus Helsingborg', 'Lund University', 'No e-scooter rule found; the campus is at Universitetsplatsen 2, in the centre (read 30 October 2026)'],
              ['Stadsparken', 'Helsingborgs stad', 'Hire scooters slow to 10 km/h'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Can you take an e-scooter on the bus, the train or the ferry to Helsingør?',
      blocks: [
        'Skånetrafiken, the region’s public transport, runs Helsingborg’s city buses and the Pågatåg and Öresundståg trains. It treats an e-scooter as hand luggage only if it is **folded as small as it goes** for the whole trip:',
        {
          list: [
            '**Pågatåg and Öresundståg trains:** if there is room, folded e-scooters count as hand luggage, under the seat.',
            '**City and regional buses:** folded e-scooters only, as hand luggage; on city buses, if there is room.',
            '**Platforms:** no riding, and no parking.',
          ],
        },
        'A hire scooter stays on the street: end your ride near Knutpunkten before you board.',
        'Öresundslinjen runs the ferry to Helsingør; the old ForSea address now opens its website. It lets you bring a bicycle or moped free with a standard foot-passenger ticket, but we found no e-scooter rule on its prices page or in its terms (read 30 October 2026). A hire scooter must stay in its operating area, so end your ride before you board.',
      ],
    },
    {
      heading: 'Malmö and the map',
      blocks: [
        'Down the coast, Ryde, Voi, Lime and Bolt rent scooters in Malmö: see our [Malmö guide](guide:malmo). The map shows standing e-scooters only, not bikes. To see what is standing near you now, open the [Helsingborg map](map:se:Helsingborg).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Sweden’s first pedestrian street.** Kullagatan opened as a pedestrian street on 1 October 1961, the first permanent one in Sweden, the City says: today hire scooters slow to 10 km/h there.',
            '**Voi came first.** Voi was the first company to set up in Helsingborg, putting out 200 e-scooters on 29 May 2019 as a test agreed with the City, SVT reported.',
            '**The parking photo was tried here.** Voi’s end-of-ride parking photo, with a SEK 250 fine for parking badly more than once, was tested in Helsingborg for a year before Voi brought it in across Sweden in November 2021; the City then agreed the same with Bolt and Tier, which also rented scooters here at the time, SVT reported.',
            '**A film for everyone on foot.** The City’s e-scooter page shows a short film by the Swedish Association of the Visually Impaired (Synskadades Riksförbund) with three parking tips.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Helsingborg?',
      answer: 'Voi and Ryde, the two companies Helsingborgs stad names (read 30 October 2026). The ScootRadar map shows Voi; Ryde’s scooters are only in its app.',
    },
    {
      question: 'Where can I park a hire scooter in Helsingborg?',
      answer: 'In central Helsingborg, only in a cycle rack or a marked e-scooter place, never on a footway or cycle lane. Elsewhere in the municipality you may park freely, as long as the scooter is safe and out of the way. The app shows where ending a ride is allowed.',
    },
    {
      question: 'How old do you have to be to ride a hire scooter in Helsingborg?',
      answer: 'Swedish law sets no minimum age, but Ryde’s Swedish terms say 15. Under-15s must wear a helmet. Check the Voi app for its own limit.',
    },
    {
      question: 'How fast can an e-scooter go in central Helsingborg?',
      answer: 'Up to 20 km/h, as the law allows, but hire scooters slow automatically to 10 km/h on pedestrian streets such as Kullagatan and in Stadsparken.',
    },
    {
      question: 'Can I take an e-scooter on the ferry to Helsingør?',
      answer: 'Öresundslinjen lets foot passengers with a standard ticket bring a bicycle or moped free, but we found no e-scooter rule in its terms. A hire scooter must stay in its operating area in Helsingborg, so end your ride before you board.',
    },
    {
      question: 'Are e-scooters banned at night or in winter in Helsingborg?',
      answer: 'No. Neither the City’s page nor its fee schedule names a night ban, a night speed limit or a winter pause for riders (October 2026).',
    },
  ],
  sources: [
    { title: 'Helsingborgs stad: Elsparkcykel, e-scooters (updated 6 March 2026, read 30 October 2026)', url: 'https://helsingborg.se/trafik-och-stadsplanering/cykling/elsparkcykel/' },
    { title: 'Helsingborgs stad: Parking e-scooters since 1 September 2022 (updated 8 April 2024)', url: 'https://helsingborg.se/trafik-och-stadsplanering/cykling/elsparkcykel/elsparkscyklar-parkering/' },
    { title: 'Helsingborgs kommun: Local traffic rule 1283 2022:502, in force since 1 September 2022, and its map (Svensk trafikföreskriftssamling)', url: 'https://rdt.transportstyrelsen.se/rdt/AF06_View.aspx?UseStfs=1&ForeskriftId=670e14f8-a3d8-447a-ae02-8021396b466a&of=1&ForeskriftIds=670e14f8-a3d8-447a-ae02-8021396b466a' },
    { title: 'Helsingborgs stad: Fees for the use of public land, section 6.14 (revised 27 August 2024)', url: 'https://media.helsingborg.se/uploads/networks/1/sites/2/2017/12/taxor_for_markupplatelse_pa_allman_plats_beslutad_i_kf_240827_sbf.pdf' },
    { title: 'Helsingborgs stad: Centrum and Kullagatan', url: 'https://helsingborg.se/bo-bygga-och-miljo/bostader/bostadsomraden-och-samhallen/centrum/' },
    { title: 'Helsingborgs stadslexikon: Kullagatan', url: 'https://stadslexikon.helsingborg.se/kullagatan/' },
    { title: 'Ryde: Locations (read 30 October 2026)', url: 'https://www.ryde-technology.com/Locations' },
    { title: 'Ryde: Terms and conditions, Sweden (read 30 October 2026)', url: 'https://www.ryde-technology.com/terms-conditions-sweden' },
    { title: 'Transportstyrelsen: Elsparkcykel (updated 14 August 2026)', url: 'https://www.transportstyrelsen.se/sv/vagtrafik/fordon/fordonsregler/regler-for-olika-fordonsslag/elsparkcykel/' },
    { title: 'Riksdagen: Trafikförordningen (1998:1276)', url: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/trafikforordning-19981276_sfs-1998-1276/' },
    { title: 'Åklagarmyndigheten: Fixed fines, annex 1A (1 November 2025)', url: 'https://www.aklagare.se/globalassets/dokument/ordningsbotskatalog/bilaga-1a.pdf' },
    { title: 'Skånetrafiken: On board', url: 'https://www.skanetrafiken.se/sa-reser-du-med-oss/sa-funkar-det-ombord/' },
    { title: 'Jernhusen: Helsingborg Central Station', url: 'https://www.jernhusen.se/hitta-din-station/helsingborg-centralstation/' },
    { title: 'Lund University: Campus Helsingborg, contact and parking', url: 'https://www.ch.lu.se/kontakt' },
    { title: 'Öresundslinjen: Prices, Helsingborg–Helsingør', url: 'https://www.oresundslinjen.se/priser' },
    { title: 'Öresundslinjen: Terms', url: 'https://www.oresundslinjen.se/om-oresundslinjen/villkor' },
    { title: 'SVT Helsingborg: The e-scooters are coming to Helsingborg (28 May 2019)', url: 'https://www.svt.se/nyheter/lokalt/helsingborg/nu-kommer-elsparkcyklarna-till-helsingborg' },
    { title: 'SVT Helsingborg: Fines for badly parked e-scooters brought fewer complaints (22 November 2021)', url: 'https://www.svt.se/nyheter/lokalt/helsingborg/boter-for-felparkerade-elsparkcyklar-gav-farre-klagomal' },
  ],
};

export default guide;
