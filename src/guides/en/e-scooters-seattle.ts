import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-seattle',
  topic: 'seattle',
  name: 'E-scooters in Seattle',
  title: 'E-scooters in Seattle 2026: Lime, prices, helmets and rules',
  description: 'E-scooters in Seattle: Lime is the only operator. What a ride costs, the helmet and sidewalk rules, parking, Link light rail and where you can’t ride.',
  headline: 'E-scooters in Seattle: Lime, what a ride costs, the rules, and where you can’t ride',
  lede: 'E-scooters in Seattle come from one app: Lime, the only company in the City’s programme through 2026, with standing scooters and seated ones called Gliders. Lime shows its Seattle price only in the app, and the City bans surge pricing. Lime riders must be 18, the City’s code requires a helmet, sidewalks are off-limits and scooters top out at 15 mph. Shared scooters can’t board Link trains or buses, and Sea-Tac Airport, outside the city, has no Lime scooters.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'us:wa:Seattle',
  sections: [
    {
      heading: 'Which scooter apps work in Seattle?',
      blocks: [
        'One company runs shared scooters in Seattle in October 2026: **Lime**. The Seattle Department of Transportation (SDOT) told its advisory boards in April 2026 that Lime is the sole provider through 2026 while it evaluates the programme. Lime also rents e-bikes. No other company has a permit, so you won’t find Bird, Veo or Lyft scooters in the city.',
        {
          list: [
            '**The permit.** Lime works under SDOT’s permit requirements 6.0, in force since 1 April 2026 “until further notice”. Its term is set in writing, with no published end date, and SDOT hasn’t said who will run scooters after 2026.',
            '**The fleet.** No more than 20,000 devices at a time, and since April 2026 at least half the fleet must be bikes or seated scooters.',
            '**The area.** Scooters may serve the whole city, apart from no-ride zones, and at least 15% of the fleet must stand in the City’s Equity Focus Neighborhoods.',
          ],
        },
        'On the evening of 16 October 2026 the [map of Seattle](map:us:wa:Seattle) showed about 9,100 Lime scooters: what’s on the map, not the fleet. Nearly all were standing scooters: Lime’s open data listed just 20 seated ones early on 17 October. Lime’s e-bikes aren’t shown.',
        '**Visiting?** Get the Lime app before you go. You need no driving licence: Washington law doesn’t ask for one on a scooter. Your first ride is held to 8 mph unless you have ridden Lime in another US city. No smartphone? SDOT’s scooter share page explains how to rent by text. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Seattle?',
      blocks: [
        'Lime shows its Seattle price only in the app and publishes no rates in its open data. SDOT’s permit still shapes what you pay:',
        {
          list: [
            '**No surge pricing.** Lime may not raise rates at busy times, and must show every rate, fee and penalty before you unlock.',
            '**Passes.** Lime must offer passes or bundles that cut the cost per ride for frequent riders.',
            '**Lime Access**, for riders on ORCA LIFT, Apple Health, SNAP or other low-income programmes: $0.75 to unlock and $0.01 a minute, with the $0.75 charged again for each new hour. The permit caps reduced fares at $1.50 for an hour’s ride.',
          ],
        },
      ],
    },
    {
      heading: 'Seattle scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Washington state law sets the frame for what it calls motorized foot scooters, the Seattle Municipal Code adds the city’s rules, and SDOT’s permit sets what Lime must enforce. King County’s Board of Health repealed its all-ages bike helmet law on 17 February 2022, but Seattle’s own code still requires a helmet on a scooter.',
        {
          table: {
            caption: 'Shared e-scooter rules in Seattle on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 and over to ride Lime. State law bars under-16s unless a city allows them', 'SDOT; RCW 46.20.500'],
              ['Driving licence', 'Not needed', 'RCW 46.20.500'],
              ['Helmet', 'Required: a helmet designed for bicycle safety', 'Municipal Code 11.46.020'],
              ['Speed', '15 mph at most; 8 mph in slow zones and on your first ride; 5 mph on sidewalks, crosswalks and pedestrian zones in areas SDOT marks as slow', 'RCW 46.20.500; SDOT permit; Municipal Code 11.46.020'],
              ['Where to ride', 'Streets, bike lanes, alleys, shoulders and public paths', 'Municipal Code 11.46.010'],
              ['Sidewalks', 'Banned, unless a sidewalk is part of a bike or pedestrian path with no other way through', 'Municipal Code 11.46.010; RCW 46.61.710'],
              ['People walking', 'Give way to them, and warn them before you pass', 'Municipal Code 11.46.020'],
              ['Lights', 'White front light and red rear reflector from half an hour after sunset', 'Municipal Code 11.46.020'],
              ['Passengers', 'One rider only', 'Municipal Code 11.46.020'],
              ['Alcohol', 'Don’t ride intoxicated; at night the app asks “safe to ride” questions', 'SDOT'],
              ['Fines', 'Breaking the traffic code is an infraction: up to $250 per offence plus fixed fees', 'Municipal Code 11.31.120'],
            ],
          },
        },
        { note: '**Ride on a sidewalk and the scooter tells you.** Since 1 June 2026 at least half of Lime’s standing scooters must detect sidewalk riding, warn the rider by sound or light, and slow down or cut power; SDOT wants every device fitted by the end of 2026. The permit foresees two warnings, then a fine, then a possible suspension, but SDOT said in May 2026 that fines would come only once testing shows the sensors work.' },
      ],
    },
    {
      heading: 'Where you can’t ride: parks, the waterfront promenade and fast streets',
      blocks: [
        'A shared scooter slows to a stop when it enters a no-ride zone, and the app’s map shows each one. Zones change, so check the map before riding to Pike Place Market or a game at Lumen Field.',
        {
          list: [
            '**Sidewalks**, across the city. People on bikes may use them; people on scooters may not.',
            '**Most parks.** SDOT says most parks are no-ride zones, apart from their shared-use paths and roads.',
            '**The waterfront promenade.** Scooters may use the 1.2-mile protected bike lane along Waterfront Park, from Pioneer Square to Belltown, open since March 2025, but no wheeled devices are allowed on the walking promenade beside it.',
            '**School playfields and playgrounds**, under the City code.',
            '**Fast roads.** State law keeps scooters off limited-access highways, and SDOT tells riders to keep off streets posted above 25 mph.',
          ],
        },
        '**The trails are open.** City law allows scooters on public paths, and Seattle Parks’ trail policy, in force since August 2020, lets e-mobility devices onto its multi-use trails, with a 15 mph limit for everyone. So you may ride the Burke-Gilman Trail, the Elliott Bay Trail and the city’s other paved multi-use trails.',
        '**The University of Washington.** UW tells scooter riders to keep off campus sidewalks and pedestrian paths, use bike lanes or the street, give way to people walking and never ride indoors. On campus, park a Lime only at the spots on UW’s micromobility parking map.',
      ],
    },
    {
      heading: 'Parking a scooter in Seattle',
      blocks: [
        'Seattle doesn’t make you lock the scooter to anything. End the ride with the scooter upright in one of these places, then take the photo the app asks for:',
        {
          list: [
            '**The furniture zone** of the sidewalk, the strip with trees, poles and signs by the curb, leaving at least 6 feet clear for people walking.',
            '**A public bike rack or corral**, many of them new since 2025.',
            '**A parking area marked in the app**, or a marked no-car area at a corner, as long as you block no crosswalk or curb ramp.',
          ],
        },
        '**Never park** in a bus or streetcar zone, within 60 feet before a bus stop sign, in front of doors, benches or curb ramps, in a bike lane, on a bridge or in a City park. Land belonging to Sound Transit, King County Metro, Washington State Ferries or the University of Washington is off-limits too, unless the owner allows it.',
        '**What it costs.** Since 1 April 2026, when its checks find a scooter in the way, SDOT charges Lime $30, or $50 for a major obstruction, such as a blocked curb ramp or less than 4 feet left clear. Lime must pass the fee on to the last rider, except the first time, when it sends a warning instead. SDOT says this raised the most a rider pays from $20 to $50, except on Lime Access; its rider page still shows the old $20.',
        'See a scooter in the way? Report it with the City’s Find It, Fix It app or on (206) 684-ROAD; between 6 am and midnight Lime has two hours to move it.',
      ],
    },
    {
      heading: 'Link light rail, King Street Station, ferries and Sea-Tac',
      blocks: [
        '**No shared scooters on Sound Transit.** Lime scooters may not go on any Sound Transit train or bus, into fare-paid areas or onto platforms, and King County Metro buses take only folding scooters. End your ride in the marked parking at the station; Lime must keep scooters at every Link station in Seattle. Link costs $3.00 for adults, and you can tap a contactless bank card on the reader before you board; riders aged 18 and under travel free.',
        '**King Street Station.** Amtrak and Sounder trains stop on Jackson Street, between 3rd and 4th Avenue South; cross 4th Avenue for International District/Chinatown Link station.',
        '**Ferries.** SDOT’s permit bars Lime parking on Washington State Ferries property, and the ferry service asks that bike-share bikes stay off it, so end your ride before Colman Dock.',
        '**Sea-Tac Airport** is in the city of SeaTac, outside Seattle, and on 17 October Lime’s open data showed no scooter within about 4 miles of the terminal. Take Link instead: 38 minutes from SeaTac/Airport Station to downtown, with trains every 8 to 10 minutes for most of the day and a free shuttle between the station and the skybridge.',
      ],
    },
    {
      heading: 'Rain, hills, night rides and the season',
      blocks: [
        {
          list: [
            '**Rain and hills.** SDOT makes Lime certify its scooters as safe in wet, icy or snowy weather, on steep slopes and over streetcar and train tracks. On ice or snow, SDOT suggests taking transit instead.',
            '**Helmets.** SDOT hands out free adult helmets, one each, at six Customer Service Centers around the city, though not downtown.',
            '**Night.** The permit sets no curfew, and Lime’s open data lists the service as open around the clock. At night the app asks if you’re safe to ride.',
            '**The season.** The permit sets no winter break either. Most trips happen in summer, between 3 and 7 pm, SDOT’s figures show.',
          ],
        },
        'The [Seattle map](map:us:wa:Seattle) shows the nearest Lime scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**The Seahawks’ Super Bowl parade was the busiest day of early 2026**: SDOT counted 59,337 shared bike and scooter trips that day.',
            '**Riders took more than 10.5 million shared bike and scooter trips in Seattle in 2025**, and more than 1.16 million people rode at least once.',
            '**SDOT’s fines for badly parked bikes and scooters rose from 429 in 2021 to 4,006 in 2025.**',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Do you need a helmet to ride a scooter in Seattle?',
      answer: 'Yes. Seattle’s Municipal Code requires a bicycle helmet on a motorized scooter, although King County dropped its bike helmet law in 2022.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in Seattle?',
      answer: 'No, unless the sidewalk is part of a bike or pedestrian path with no other way through. Lime’s scooters are being fitted to detect sidewalk riding and warn you, and SDOT says fines may follow once the sensors are proven.',
    },
    {
      question: 'How much does a Lime scooter cost in Seattle?',
      answer: 'Lime shows its Seattle price only in the app, and the City bans surge pricing. Riders on low incomes can join Lime Access: $0.75 to unlock and $0.01 a minute.',
    },
    {
      question: 'How old do you have to be to ride a scooter in Seattle?',
      answer: '18 to ride Lime, the City’s only scooter operator. State law sets 16 unless a city allows younger riders.',
    },
    {
      question: 'Can you take a Lime scooter on Link light rail?',
      answer: 'No. Sound Transit bans shared scooters and bikes on all its trains and buses, in fare-paid areas and on platforms. Park in the marked area at the station.',
    },
    {
      question: 'Are there scooters at Sea-Tac Airport?',
      answer: 'No. The airport is outside Seattle, and Lime’s open data shows no scooters near it. Link light rail reaches downtown in 38 minutes, and you can pick up a Lime there.',
    },
  ],
  sources: [
    { title: 'SDOT: how to use scooter share and bike share', url: 'https://www.seattle.gov/transportation/projects-and-programs/programs/bike-program/how-to-use-scooter-share-and-bike-share' },
    { title: 'SDOT: shared micromobility permit requirements 6.0, 2026 (PDF)', url: 'https://www.seattle.gov/documents/departments/sdot/newmobilityprogram/shared%20micromobility%20permit%20requirements%206.0%202026%20final.pdf' },
    { title: 'SDOT: shared micromobility update, April 2026 (PDF)', url: 'https://seattle.gov/documents/Departments/SDOT/BoardsCommittees/SPAB/2026/SPAB%20SBAB_Shared%20Micromobility%20Updates.pdf' },
    { title: 'SDOT Blog: new permit rules for bike and scooter share, 14 May 2026', url: 'https://sdotblog.seattle.gov/2026/05/14/e-scooter-safety/' },
    { title: 'Seattle Municipal Code 11.46: scooter rules', url: 'https://library.municode.com/wa/seattle/codes/municipal_code?nodeId=TIT11VETR_SUBTITLE_ITRCO_PT4PEHIBISHSTEPMOFOSCRU_CH11.46RUEPMOFOSC' },
    { title: 'Seattle Municipal Code 11.31.120: penalties', url: 'https://library.municode.com/wa/seattle/codes/municipal_code?nodeId=TIT11VETR_SUBTITLE_ITRCO_PT3EN_CH11.31DITROF_11.31.120MOPE' },
    { title: 'RCW 46.20.500: scooter age and licence', url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=46.20.500' },
    { title: 'RCW 46.61.710: where scooters may be ridden', url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=46.61.710' },
    { title: 'Public Health Insider: King County’s bike helmet policy, 17 February 2022', url: 'https://publichealthinsider.com/2022/02/17/with-a-commitment-to-equity-board-of-health-updates-king-countys-bike-helmet-policy/' },
    { title: 'Seattle Parks: multi-use trail policy, 2020 (PDF)', url: 'https://www.seattle.gov/Documents/Departments/ParksAndRecreation/PoliciesPlanning/Multi-Use%20Trail%20Policy.pdf' },
    { title: 'SDOT Blog: new protected bike lanes at Waterfront Park, 5 March 2025', url: 'https://sdotblog.seattle.gov/2025/03/05/waterfront-seattle-celebrate-new-protected-bike-lanes/' },
    { title: 'UW Transportation Services: electric scooters', url: 'https://transportation.uw.edu/getting-here/electric-scooters' },
    { title: 'Sound Transit: shared scooters and bikes', url: 'https://www.soundtransit.org/ride-with-us/know-before-you-go/bikes-scooters/shared-scooters-bikes' },
    { title: 'Sound Transit: fares', url: 'https://www.soundtransit.org/ride-with-us/how-to-pay/fares' },
    { title: 'Sound Transit: Sea-Tac Airport', url: 'https://www.soundtransit.org/ride-with-us/popular-destinations/sea-tac-airport' },
    { title: 'SDOT: King Street Station', url: 'https://www.seattle.gov/transportation/projects-and-programs/programs/transit-program/king-street-station' },
    { title: 'King County Metro: bikes and transit', url: 'https://kingcounty.gov/en/dept/metro/rider-tools/bikes-and-transit' },
    { title: 'Washington State Ferries: bicycles', url: 'https://wsdot.wa.gov/travel/washington-state-ferries/rider-information/what-you-can-bring-aboard/bicycles' },
  ],
};

export default guide;
