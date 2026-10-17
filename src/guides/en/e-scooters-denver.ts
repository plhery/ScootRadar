import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-denver',
  topic: 'denver',
  name: 'E-scooters in Denver',
  title: 'E-scooters in Denver 2026: Veo, prices, rules and parking',
  description: 'E-scooters in Denver: Veo, the only app since Lime and Bird left, what a ride costs, the sidewalk and 16th Street rules, parking, RTD and the airport.',
  headline: 'E-scooters in Denver: Veo, what a ride costs, the rules, and where you can’t ride',
  lede: 'Since mid-May 2026 Veo has been the only scooter app in Denver: Lime and Bird left when their agreements with the City ended. A ride costs $1 to unlock and $0.39 a minute plus tax, or $0.25 a minute with Veo’s Denver Resident Pass, and you must be 18. Scooters are banned on most sidewalks and on the 16th Street Mall, and by 31 December 2026 rides around Union Station will have to end in a marked corral.',
  published: '2026-10-17',
  updated: '2026-10-17',
  city: 'us:co:Denver',
  sections: [
    {
      heading: 'Which scooter apps work in Denver?',
      blocks: [
        'Denver’s Department of Transportation and Infrastructure (DOTI) runs the City’s shared bike and scooter programme with a single operator. It chose Veo in late 2025, and City Council approved a three-year licence agreement, renewable once for up to two years, on 27 April 2026. Veo started on 1 May 2026, and Lime and Bird stopped renting on 16 May, when their five-year agreements ended.',
        {
          list: [
            '**Veo**, with stand-up scooters, seated scooters (some with two seats) and e-bikes, all in one app. The agreement caps the fleet at 9,000 vehicles, no more than about half of them stand-up scooters at the start.',
            '**Lime and Bird** no longer run in Denver: older articles that send you to their apps are out of date.',
          ],
        },
        'At 11:25 on 17 October 2026 the [Denver map](map:us:co:Denver) showed about 3,460 Veo scooters: what was on the map at that moment, not the fleet. Veo’s open data lists its seated scooters as bicycles, so the map shows only the stand-up ones.',
        '**Visiting?** Get the Veo app before you set out. The City’s code makes Veo test every rider on the local rules before their first scooter ride. Neither DOTI nor Veo has announced a winter break or a night curfew. New to this? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does a Veo scooter cost in Denver?',
      blocks: [
        'Veo’s open data gives one rate for every vehicle: $1 to unlock and $0.39 a minute, plus tax. Denver residents pay $0.25 a minute with the Denver Resident Pass. People on income-based programmes such as SNAP or Medicaid can join Veo Access: 60 free minutes a day, then $0.15 a minute with no unlock fee.',
        {
          table: {
            caption: 'Veo prices in Denver on 17 October 2026, before tax',
            head: ['Ride', 'Standard', 'Denver Resident Pass', 'Veo Access'],
            rows: [
              ['Unlock', '$1', '$1', 'None'],
              ['Rate', '$0.39 a minute', '$0.25 a minute', '60 free minutes a day, then $0.15 a minute'],
              ['10 minutes', '$4.90', '$3.50', 'Free'],
              ['20 minutes', '$8.80', '$6.00', 'Free'],
              ['30 minutes', '$12.70', '$8.50', 'Free'],
            ],
          },
        },
        'Veo’s agreement with the City also sets an automatic discount, to $1 and $0.13 a minute, for any trip that starts or ends in one of DOTI’s Equity Areas. Veo gives $5 of ride credit for taking its “Stay in Your Lane” pledge. Leave a vehicle outside the service area, or somewhere Veo can’t reach it, and its terms allow a pickup fee of up to $120.',
      ],
    },
    {
      heading: 'Denver scooter rules: age, helmets, speed and sidewalks',
      blocks: [
        'Colorado law treats an e-scooter as a vehicle but not a motor vehicle: you need no licence, registration or insurance, and on the road you have a driver’s rights and duties. Denver’s Revised Municipal Code (DRMC) and the City’s agreement with Veo add local rules.',
        {
          table: {
            caption: 'Shared e-scooter rules in Denver on 17 October 2026, and who sets them',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 to rent a Veo; Colorado sets no minimum age for e-scooters', 'Veo’s terms; C.R.S. § 42-4-1412'],
              ['Licence, registration, insurance', 'None: an e-scooter isn’t a motor vehicle and is exempt from registration', 'Colorado, C.R.S. §§ 42-1-102, 42-2-101, 42-3-103, 42-4-1409'],
              ['Helmet', 'Not required by law: Colorado’s helmet rule covers only under-18s on class 3 e-bikes; Veo advises wearing one', 'Colorado, C.R.S. § 42-4-1412; Veo’s terms'],
              ['Speed', 'Veo’s vehicles top out at 15 mph; 6 mph on a sidewalk where riding is allowed; elsewhere no faster than is safe, and never above the posted limit; 15 mph on park trails', 'DOTI’s agreement with Veo; DRMC § 54-619; Denver Parks rules'],
              ['Where to ride', 'In the street or bike lane, as far right as is safe; no more than two abreast outside a bike lane', 'C.R.S. § 42-4-1412; DRMC § 54-618'],
              ['Sidewalks', 'Banned, except where the sidewalk is part of a designated bike route, or on the block where you start or end the ride; always yield to pedestrians', 'DRMC § 54-621'],
              ['16th Street Mall', 'No e-scooters at all', 'DRMC § 54-623'],
              ['Stop signs and red lights', 'From age 15, or younger with an adult, you may treat a stop sign as a yield sign at up to 10 mph, and at a red light stop and yield, then go straight or turn right', 'C.R.S. § 42-4-1412.5'],
              ['Passengers', 'None: the City’s code and Veo’s terms bar passengers, though DOTI allows two on a two-seated scooter', 'DRMC § 54-615; Veo’s terms; DOTI'],
              ['Hands', 'At least one hand on the handlebars at all times', 'C.R.S. § 42-4-1412; DRMC § 54-616'],
              ['Alcohol', 'Colorado’s DUI law covers any vehicle, e-scooters included; Veo bans riding under the influence of alcohol or drugs', 'C.R.S. § 42-4-1301; Veo’s terms'],
              ['Night', 'No curfew; city parks close from 11 pm to 5 am', 'DRMC § 39-3'],
            ],
          },
        },
        { note: '**Stay off the sidewalk.** Since 1 July 2026 the City can fine Veo for its riders’ offences. Veo says its scooters detect sidewalk riding: riders have had warnings since 10 August 2026, and Veo has said repeat offenders will have their account frozen until they pass a rules quiz.' },
        'Breaking the state’s scooter riding rules is a class 2 misdemeanour traffic offence, though Denver police wrote only nine scooter tickets from 2018 to 2024, Westword reported.',
      ],
    },
    {
      heading: 'Where you can’t ride in Denver',
      blocks: [
        {
          list: [
            '**Denver’s 16th Street.** The old 16th Street Mall, renamed and fully reopened in October 2025, is closed to e-scooters by the City’s code. Walk your scooter or take a parallel street.',
            '**Union Station, LoDo, Coors Field and Ball Arena.** The City’s code sets no special riding rules here beyond the street and sidewalk ones; what changes is parking (see below). DOTI told City Council in September 2026 that it is adding slow zones.',
            '**Parks.** Denver Parks and Recreation allows e-scooters on park roads, park sidewalks and certain park trails unless a sign closes them, but never on grass, playgrounds or sports fields. Parks close from 11 pm to 5 am.',
            '**The Cherry Creek and South Platte River trails** are regional trails run by Denver Parks: ride at up to 15 mph, keep right, yield to people on foot and call out before you pass. Don’t leave a Veo along a trail or in a park: the park rules forbid it.',
            '**Red Rocks.** The amphitheatre stands in a Denver Mountain Park near Morrison, outside Veo’s service area: on 17 October 2026 the nearest Veo was almost 6 miles away.',
          ],
        },
      ],
    },
    {
      heading: 'Parking a Veo in Denver',
      blocks: [
        'Park upright on public property, where you block neither people nor traffic:',
        {
          list: [
            'on a wide sidewalk, leaving at least 5 feet clear;',
            'in a car parking space, unless it is metered, time-limited or for permit holders;',
            'at a public bike rack or corral;',
            'on the grass strip between street and sidewalk, at least 4 feet from things like utility boxes.',
          ],
        },
        'Never park on a bike path or private property, block a bus stop, curb ramp, driveway or hydrant, or leave a Veo in a transit station or garage, at a building’s entrance or on rail tracks. The app won’t let you end a ride in a banned area, and walking away without ending it keeps the meter running.',
        '**Mandatory parking zones.** By 31 December 2026 a ride that ends in the Union Station neighbourhood must end in a marked corral, and the Central Business District follows by 1 July 2027; the code adds parts of Five Points, without a date. Veo said in August 2026 that over 280 corrals were in its app, with more than 150 to come.',
      ],
    },
    {
      heading: 'RTD trains, buses and Denver International Airport',
      blocks: [
        '**A Veo can’t go on RTD**: DOTI’s FAQ says shared bikes and scooters aren’t allowed on buses or trains. Your own e-scooter can ride light rail, in a car’s bike area, and commuter trains such as the A Line; on buses it goes on the front rack, except on the 16th Street Free MallRide.',
        '**The airport.** No shared scooter reaches Denver International Airport (DEN): on 17 October 2026 the nearest Veo stood almost 5 miles from the terminal. Take RTD’s A Line from the Transit Center at the south end of the Jeppesen Terminal to Union Station: 23 miles in about 37 minutes, every 15 minutes for most of the day. Any trip to or from the airport needs an airport fare, such as the $10 Airport Day Pass; riders aged 19 and under travel free.',
        'Bringing your own scooter? The airport has scooter parking at the Transit Center.',
      ],
    },
    {
      heading: 'Boulder, Aurora and the rest of Colorado',
      blocks: [
        {
          list: [
            '**Boulder** runs its own scheme with Lime, with stand-up scooters and seated LimeGliders, and a mandatory parking zone across most of central Boulder. You need the Lime app there, and Boulder’s rules differ from Denver’s. Lime publishes no live open data for Boulder, so it isn’t on our map.',
            '**Aurora** has had no shared scooters since its last operator stopped in August 2022, the City says; it still takes licence applications.',
            '**Colorado Springs and Fort Collins.** CDOT’s Bustang coaches run to both from Union Station. At 11:25 on 17 October 2026 the map showed about 660 Lime scooters in [Colorado Springs](map:us:co:Colorado Springs) and about 420 Spin scooters in [Fort Collins](map:us:co:Fort Collins).',
          ],
        },
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Denver’s programme has logged over 34 million rides since it began in 2019**, DOTI told City Council in September 2026, and 21 August 2026 set the one-day record: nearly 35,000 trips.',
            '**More than four in ten rides are taken through Veo Access.** In May and June 2026 its riders made 567,000 of the 1.34 million trips, DOTI’s quarterly report shows.',
            '**Rebuilding the 16th Street Mall took three years and about $175 million.** It reopened in full on 4 October 2025 as “Denver’s 16th Street”, 43 years after the mall first opened.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Are Lime scooters still in Denver?',
      answer: 'No. Lime’s and Bird’s agreements with the City ended on 16 May 2026, and Veo is now Denver’s only shared scooter and bike operator, under a three-year licence agreement. Lime still runs in Boulder.',
    },
    {
      question: 'How much does a Veo scooter cost in Denver?',
      answer: '$1 to unlock and $0.39 a minute plus tax, so a 10-minute ride costs $4.90. Denver residents pay $0.25 a minute with the Resident Pass, and income-qualified riders get 60 free minutes a day with Veo Access.',
    },
    {
      question: 'Can you ride an electric scooter on the sidewalk in Denver?',
      answer: 'No, except where the sidewalk is part of a designated bike route, or on the block where you start or end your ride, at up to 6 mph and giving way to pedestrians.',
    },
    {
      question: 'Can you ride a scooter on the 16th Street Mall?',
      answer: 'No. Denver’s code bans e-scooters on the 16th Street Pedestrian and Transit Mall, now called Denver’s 16th Street.',
    },
    {
      question: 'Do you need a helmet or a licence to ride an e-scooter in Denver?',
      answer: 'Neither. Colorado law doesn’t treat an e-scooter as a motor vehicle and has no helmet rule for scooter riders, though Veo advises wearing one. You must be 18 to rent a Veo.',
    },
    {
      question: 'Can you take a scooter to Denver airport?',
      answer: 'Not a Veo: shared scooters aren’t allowed on RTD, and Veo’s service area stops miles short of DEN. Take the A Line from Union Station, about 37 minutes, with a $10 Airport Day Pass; your own e-scooter can ride it.',
    },
  ],
  sources: [
    { title: 'DOTI: Denver’s Shared Bike and Scooter Program', url: 'https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Department-of-Transportation-and-Infrastructure/Programs-Services/Transit/Micromobility-Program' },
    { title: 'DOTI: Shared Bike and Scooter Program, 2026 Q2 report (PDF)', url: 'https://denvergov.org/files/assets/public/v/1/doti/documents/programsservices/micromobility/2026-q2-program-report.pdf' },
    { title: 'Denver Revised Municipal Code, Chapter 54, Article IX: bicycles, e-bikes and electric scooters', url: 'https://library.municode.com/co/denver/codes/code_of_ordinances?nodeId=TITIIREMUCO_CH54TRRE_ARTIXBIELPEASMODEELSC' },
    { title: 'Denver Revised Municipal Code, Chapter 54, Article I: definitions', url: 'https://library.municode.com/co/denver/codes/code_of_ordinances?nodeId=TITIIREMUCO_CH54TRRE_ARTIINGE' },
    { title: 'Denver Revised Municipal Code, Chapter 39: parks and recreation', url: 'https://library.municode.com/co/denver/codes/code_of_ordinances?nodeId=TITIIREMUCO_CH39PARE' },
    { title: 'Denver Parks and Recreation: Park Use Rules and Regulations, revised December 2022 (PDF)', url: 'https://denvergov.org/files/assets/public/v/3/parks-and-recreation/documents/dpr_parkuserulesregulations.pdf' },
    { title: 'Denver Parks and Recreation: Trail safety, rules and etiquette', url: 'https://denvergov.org/Government/Agencies-Departments-Offices/Agencies-Departments-Offices-Directory/Parks-Recreation/Urban-Parks-Trails/Trails/Trail-Safety-Rules-and-Etiquette' },
    { title: 'Colorado Revised Statutes 2024, Title 42: Vehicles and Traffic (PDF)', url: 'https://leg.colorado.gov/sites/default/files/images/olls/crs2024-title-42.pdf' },
    { title: 'Colorado General Assembly: HB19-1221, Regulation of Electric Scooters (2019)', url: 'https://leg.colorado.gov/bills/hb19-1221' },
    { title: 'Colorado General Assembly: HB22-1028, Statewide Regulation of Controlled Intersections (2022)', url: 'https://leg.colorado.gov/bills/hb22-1028' },
    { title: 'Denver City Council: CR26-0326, approving the Veo agreement, 2026', url: 'https://denver.legistar.com/LegislationDetail.aspx?ID=7946052&GUID=502079D0-27ED-4EE8-81B3-98FFB2B2CA97' },
    { title: 'DOTI: licence agreement with Veo, 2026 (PDF)', url: 'https://denver.legistar1.com/denver/attachments/469459e6-313a-433c-b959-8e674b4a1d7d.pdf' },
    { title: 'Denver City Council: CB25-0599, rules for bike and scooter rental companies, 2025', url: 'https://denver.legistar.com/LegislationDetail.aspx?ID=7351398&GUID=7100D803-247F-4CB2-99E9-F7A85DD1FF05' },
    { title: 'Veo: Denver', url: 'https://www.veoride.com/denver/' },
    { title: 'Veo: User Agreement', url: 'https://www.veoride.com/user-agreement/' },
    { title: 'Veo: Denver open data (GBFS)', url: 'https://cluster-prod.veoride.com/api/shares/name/den/gbfs' },
    { title: 'RTD: Bikes and scooters on rail', url: 'https://www.rtd-denver.com/how-to-ride/bike-n-ride/bikes-scooters-on-rail' },
    { title: 'RTD: Bikes and scooters on buses', url: 'https://www.rtd-denver.com/how-to-ride/bike-n-ride/bikes-scooters-on-buses' },
    { title: 'RTD: Fares', url: 'https://www.rtd-denver.com/fares-passes/fares' },
    { title: 'RTD: A Line facts and figures', url: 'https://www.rtd-denver.com/open-records/reports-and-policies/facts-and-figures/a-line' },
    { title: 'Denver International Airport: Public bus or train', url: 'https://www.flydenver.com/parking-and-transportation/to-and-from/public-bus-or-train-rtd/' },
    { title: 'Denver International Airport: Bike', url: 'https://www.flydenver.com/parking-and-transportation/to-and-from/bike/' },
    { title: 'City of Boulder: Shared Micromobility Program', url: 'https://bouldercolorado.gov/services/shared-micromobility-program' },
    { title: 'City of Aurora: Shared Mobility Program', url: 'https://www.auroragov.org/residents/transportation___mobility_resources/shared_mobility_program' },
    { title: 'Westword: The fight for Denver’s e-scooter contract, 7 April 2026', url: 'https://www.westword.com/news/denver-e-scooter-provider-battle-40866170/' },
    { title: 'Westword: Veo scooters were supposed to stop illegal sidewalk riding, 11 May 2026', url: 'https://www.westword.com/news/can-you-ride-scooters-on-the-sidewalk-in-denver-40882769/' },
    { title: 'Denver7: Denver micromobility trips rise as Veo introduces sidewalk speed reductions, 20 August 2026', url: 'https://www.denver7.com/news/on-two-wheels/denver-micromobility-trips-rise-as-veo-introduces-sidewalk-speed-reductions' },
    { title: 'Denver7: Denver moves toward mandatory parking zones for scooters and bikes, 3 September 2026', url: 'https://www.denver7.com/news/local-news/denver-moves-toward-mandatory-parking-zones-for-scooters-bikes-as-complaints-over-sidewalk-riding-pile-up' },
    { title: 'Denverite: 16th Street is fully reopening next month, 4 September 2025', url: 'https://denverite.com/2025/09/04/16th-street-mall-fully-reopening/' },
  ],
};

export default guide;
