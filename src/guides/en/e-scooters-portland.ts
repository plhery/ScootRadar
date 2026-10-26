import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-portland',
  topic: 'portland',
  name: 'E-scooters in Portland',
  title: 'E-scooters in Portland 2026: Lime, Lyft, prices and rules',
  description: 'E-scooters in Portland, Oregon: Lime and Lyft, what a ride costs, the helmet and sidewalk rules, where to lock the scooter, parks and MAX.',
  headline: 'E-scooters in Portland: Lime and Lyft, what a ride costs, the rules, and where to lock up',
  lede: 'E-scooters in Portland, Oregon come from two apps, Lime and Lyft (which runs BIKETOWN), the only companies in the City’s permanent programme since 2024. Lyft’s open data listed $1.00 to unlock and $0.41 a minute on 25 October 2026; Lime shows its price in its app. Ride in the street, in bike lanes or on multi-use paths, never on the sidewalk, wear a bicycle helmet, and lock the scooter to a bike rack or a signpost when you’re done.',
  published: '2026-10-25',
  updated: '2026-10-26',
  city: 'us:or:Portland',
  sections: [
    {
      heading: 'Which scooter apps work in Portland?',
      blocks: [
        'Two companies rent e-scooters in Portland in October 2026: **Lime**, with green scooters, and **Lyft**, with gray and orange ones under the BIKETOWN name. The Portland Bureau of Transportation (PBOT) picked them through a request for proposals in 2023 and made its e-scooter programme permanent in summer 2024, after pilots that began in 2018. You won’t find Bird, Spin or Veo here.',
        {
          list: [
            '**The fleet.** Under their current contracts, Lime and Lyft may run up to about 4,300 scooters between them, after PBOT approved a larger fleet in 2026. In 2025 they had about 3,500.',
            '**The area.** Scooters work citywide, across 145 square miles. Lyft lets you ride anywhere inside the Portland city limits, apart from its no-ride zones.',
            '**The term.** The contracts run from 2024; PBOT’s pages give no end date.',
          ],
        },
        'At 11:47 pm on Saturday 24 October 2026 the [map of Portland](map:us:or:Portland) showed about 1,130 scooters, all Lyft, and about 1,170 at 4:26 am that morning: late-night counts of what’s on the map, not the fleet. Since 26 October 2026 the map shows Lime’s scooters too, from the map in its app: about 2,160 across the city on the night of 25 to 26 October. BIKETOWN’s e-bikes aren’t on the map.',
        '**Visiting?** Get the app before you set out. Lyft’s riders must be 18 or over, and your first Lyft ride is held to 10 mph. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a scooter cost in Portland?',
      blocks: [
        'Lyft publishes its Portland scooter price in its open data and on BIKETOWN’s site. Lime’s standard price is only in its app. Both companies must offer cheaper plans to Portlanders on low incomes, and PBOT lists them.',
        {
          table: {
            caption: 'Scooter prices in Portland on 25 October 2026, before any tax',
            head: ['Plan', 'Unlock', 'Per minute', '10 minutes', '20 minutes'],
            rows: [
              ['Lyft, pay as you go', '$1.00', '$0.41', '$5.10', '$9.20'],
              ['Lyft, BIKETOWN annual member', 'Free', '$0.29', '$2.90', '$5.80'],
              ['Lyft Scooter Community Pass ($5 a month)', 'Free', '$0.13', '$1.30', '$2.60'],
              ['Lime Access', '$0.50', '$0.07', '$1.20', '$1.90'],
              ['Lime, standard', 'In the app', 'In the app', 'In the app', 'In the app'],
            ],
          },
        },
        'Lyft’s open data marks its scooter price as taxable, so the app may add tax. Who qualifies for the low-income plans? PBOT lists SNAP, Medicaid, a reduced-rate utility bill, free or reduced school lunch, an income-based TriMet Honored Citizen pass and subsidized housing, among others; Lyft also accepts the Oregon Health Plan and Pell Grants. BIKETOWN for All members must apply for the Scooter Community Pass separately.',
        'For comparison, a BIKETOWN e-bike costs $1.00 to unlock and $0.35 a minute, but bikes stay inside BIKETOWN’s smaller service area.',
      ],
    },
    {
      heading: 'Portland scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'The State sets the basic riding rules in the Oregon Vehicle Code, which calls an e-scooter a motor assisted scooter, and PBOT sums them up on its rules page. The City adds rules for parks, and PBOT’s contracts set what Lime and Lyft enforce through their apps. A 2026 state law, House Bill 4007, rewrote Oregon’s age requirements and penalties for e-scooters and similar devices; whatever it sets, Lyft rents only to riders 18 and over.',
        {
          table: {
            caption: 'E-scooter rules in Portland on 25 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 and over on a Lyft scooter', 'Lyft'],
              ['Helmet', 'A bicycle helmet', 'State: Oregon Vehicle Code, as PBOT states it'],
              ['Speed', '15 mph at most on a shared scooter; 12 mph in Lyft’s slow zones and on park paths; 10 mph on your first Lyft ride', 'City: PBOT’s citywide limit and the parks rule; Lyft'],
              ['Where to ride', 'Streets, bike lanes and multi-use paths', 'State, as PBOT states it'],
              ['Sidewalks and crosswalks', 'No riding', 'State, as PBOT states it'],
              ['People walking', 'Yield to them', 'State, as PBOT states it'],
              ['Passengers', 'One rider per scooter', 'PBOT; Lyft'],
            ],
          },
        },
        'PBOT staff don’t ticket riders for moving violations or a missing helmet; they hold the companies to their contracts, and the companies message riders in their apps.',
      ],
    },
    {
      heading: 'Where you can’t ride or park: stadiums, schools, MAX platforms and parks',
      blocks: [
        'Lyft lists these places as no-riding, no-parking zones, and PBOT’s contracts make the companies geofence slow zones and no-parking zones:',
        {
          list: [
            '**City parks**;',
            '**the Moda Center** and **Providence Park**;',
            '**Portland Public Schools’ high schools**;',
            '**every TriMet MAX platform**.',
          ],
        },
        '**Slow zones.** On four of the city’s busiest paths, Lyft’s scooters top out at 12 mph: Tom McCall Waterfront Park, the Eastbank Esplanade, the Springwater Corridor and the area around the Portland Aerial Tram.',
        '**What the parks rule says.** Portland Parks & Recreation’s rule on motorized wheeled vehicles, in force since 13 July 2025, lets e-scooters use paved paths and roads in a park, but not buildings or places where signs ban them. On park paths keep to 12 mph unless a sign says otherwise, slow to 5 mph near other people, yield to people walking, warn them before you pass, and walk the scooter where signs tell you to dismount. You may not end a shared ride in a park, and the companies must slow their scooters there.',
        'Lyft’s page still lists City parks as no-riding zones, and PBOT’s rules page still describes the older ban on riding in parks off park roads. If the app or a sign keeps you out, walk the scooter.',
      ],
    },
    {
      heading: 'Parking: lock the scooter to a rack or signpost',
      blocks: [
        { note: '**Lock it, every time.** Since the permanent programme began in 2024, PBOT requires you to lock a shared scooter to a public bike rack, or to a City signpost if there’s no rack nearby. Lyft’s scooters can also lock to a BIKETOWN station. Lyft says unlocked scooters are subject to fines.' },
        {
          list: [
            '**Where.** Lyft accepts a public bike rack, a light pole or a signpost, or a BIKETOWN station, where you lock to the rack with the scooter’s cable. Take the end-of-ride photo if the app asks for one.',
            '**Not there.** Never lock to private property or a tree, and don’t block paths, sidewalks or curb ramps. No parking in parks, at the stadiums, at high schools or on MAX platforms.',
            '**What it costs.** Lyft’s page puts a parking violation at a $25 fine, and parking outside its service area at another $25.',
          ],
        },
        'Racks are thinner on the ground in East and North Portland, where PBOT plans to add more in 2026. PBOT’s public bike rack map shows the nearest ones. See a scooter in the way? Report it to PBOT by calling 311 or with its online e-scooter form; PBOT passes the report on to the company.',
      ],
    },
    {
      heading: 'Can you take a scooter on MAX, buses or the Streetcar?',
      blocks: [
        '**Scooters and transit.** TriMet’s rules allow single-seat two-wheeled bikes, recumbents the size of a standard bike, and folding bikes with wheels of 20 inches or less, kept folded. The Portland Streetcar’s list of onboard items names bikes, shopping carts, dollies and mobility aids. Neither mentions e-scooters. With a rental, end your ride before you reach the station: MAX platforms are no-parking zones for Lyft, and you’ll need a rack or signpost nearby.',
        'Heading to Seattle as well? Our [Seattle guide](guide:seattle) covers Lime’s scooters there, and the [Seattle map](map:us:wa:Seattle) shows them live.',
      ],
    },
    {
      heading: 'Night rides, winter and free helmets',
      blocks: [
        {
          list: [
            '**Night.** Neither PBOT nor Lyft publishes a curfew, and Lyft’s open data lists no rental hours.',
            '**Winter.** PBOT publishes no winter break either, and Lyft’s open data lists no seasonal hours.',
            '**Helmets.** PBOT handed out free helmets with Plaid Pantry stores in summer 2026, and Lime gave away more than 1,000 in 2025.',
          ],
        },
        'The [Portland map](map:us:or:Portland) shows the nearest Lime or Lyft scooter and the walk to it.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Portland’s first scooter pilot, in 2018, saw about 700,000 trips on 2,000 scooters in four months.**',
            '**Riders took about 1.65 million scooter trips in 2025**, the third year in a row above a million, and about 7.3 million since 2018.',
            '**Scooters cover far more of the city than bike share**: 145 square miles for scooters against 45 for BIKETOWN’s bikes at the end of 2025.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooter companies operate in Portland, Oregon?',
      answer: 'Lime and Lyft, which runs BIKETOWN. They are the only two companies in PBOT’s permanent e-scooter programme, which began in summer 2024.',
    },
    {
      question: 'How much does a Lyft scooter cost in Portland?',
      answer: '$1.00 to unlock and $0.41 a minute on 25 October 2026, so a 10-minute ride costs $5.10 before any tax. BIKETOWN annual members unlock free and pay $0.29 a minute.',
    },
    {
      question: 'Do you need a helmet to ride a scooter in Portland?',
      answer: 'Yes. PBOT says the Oregon Vehicle Code requires e-scooter riders to wear a bicycle helmet.',
    },
    {
      question: 'Can you ride an e-scooter on the sidewalk in Portland?',
      answer: 'No. PBOT says the Oregon Vehicle Code bans riding an e-scooter on sidewalks and in crosswalks. Use the street, a bike lane or a multi-use path, and yield to people walking.',
    },
    {
      question: 'Where do you park a rental scooter in Portland?',
      answer: 'Lock it to a public bike rack, or to a City signpost if no rack is near; Lyft scooters can also lock to a BIKETOWN station. Lyft charges $25 for a parking violation.',
    },
    {
      question: 'Can you ride a scooter in Waterfront Park?',
      answer: 'Tom McCall Waterfront Park is one of Lyft’s 12 mph slow zones. The City’s parks rule allows e-scooters on paved park paths at up to 12 mph, but you can’t end a ride in a park.',
    },
  ],
  sources: [
    { title: 'PBOT: Portland E-Scooter Program overview', url: 'https://www.portland.gov/transportation/regulatory/escooterpdx/program-history' },
    { title: 'PBOT: 2025 E-Scooter Snapshot', url: 'https://www.portland.gov/transportation/bike-share/2025e-scootersnapshot' },
    { title: 'PBOT: rules of the road for e-scooters in Portland', url: 'https://www.portland.gov/transportation/regulatory/escooterpdx/rules-road-e-scooters-portland' },
    { title: 'PBOT: e-scooter income-qualifying discount plans', url: 'https://www.portland.gov/transportation/regulatory/escooterpdx/low-income' },
    { title: 'Portland Parks & Recreation: PRK-1.23, motorized wheeled vehicles in parks, 13 July 2025', url: 'https://www.portland.gov/policies/parks-and-recreation/park-uses/prk-123-motorized-wheeled-vehicles-parks' },
    { title: 'Portland City Code 20.12.170: use of certain devices in parks', url: 'https://www.portland.gov/code/20/12/170' },
    { title: 'BIKETOWN: how to ride a scooter', url: 'https://biketownpdx.com/how-it-works/scooter' },
    { title: 'Lyft BIKETOWN open data: pricing plans', url: 'https://gbfs.lyft.com/gbfs/2.3/pdx/en/system_pricing_plans.json' },
    { title: 'ODOT: 2026 legislative summary (House Bill 4007)', url: 'https://www.oregon.gov/odot/About/GR/2026%20Legislative%20Summary.pdf' },
    { title: 'City of Portland: 2026 end of session report', url: 'https://www.portland.gov/ogr/documents/2026-end-session-report-0/download' },
    { title: 'TriMet: types of bikes allowed on board', url: 'https://trimet.org/bikes/bikepolicies.htm' },
    { title: 'Portland Streetcar: onboard items', url: 'https://portlandstreetcar.org/ride-guide/onboard-items' },
  ],
};

export default guide;
