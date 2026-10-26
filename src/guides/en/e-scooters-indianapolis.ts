import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-indianapolis',
  topic: 'indianapolis',
  name: 'E-scooters in Indianapolis',
  title: 'E-scooters in Indianapolis 2026: Bird, Lime, rules, parking',
  description: 'E-scooters in Indianapolis: where Bird and Lime run, how to find the price, why sidewalks and the Cultural Trail are off limits, and how to park.',
  headline: 'E-scooters in Indianapolis: Bird and Lime, the rules, and where you can ride and park',
  lede: 'E-scooters in Indianapolis come from Bird and Lime, the two scooter companies on the City’s shared mobility page (26 October 2026). Bird’s open data gives no Indianapolis price, so check the fare in the Bird or Lime app before you unlock. City rules let you rent from 18 and ride on streets and in bike lanes only: never on sidewalks, the Cultural Trail or the Monon Trail.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'us:in:Indianapolis',
  sections: [
    {
      heading: 'Which e-scooters can you rent in Indianapolis?',
      blocks: [
        'Electric scooter rental in Indianapolis runs under Chapter 905 of the Revised Code of the Consolidated City and County, passed on 16 July 2018. Each company needs a yearly licence from the Department of Business and Neighborhood Services (BNS). The City’s page lists two scooter operators, with the colours of their scooters: **Bird** (black and white) and **Lime** (green).',
        {
          list: [
            '**Caps.** The City’s page says BNS regulations adopted in May 2019 allow up to six operators with 1,000 scooters each, more only if each scooter is ridden often enough. A fleet of 301 to 1,000 must keep at least 10% of its scooters in the City’s “access zones” and no more than 65% in its “high utilization zones”. The regulations were written to lapse after five years unless readopted, and the page doesn’t say whether they were.',
            '**What the licence costs.** $15,000 a year plus $1 per scooter per day, paid by the operator.',
          ],
        },
        'At 2:38 a.m. on Monday 26 October 2026 the [Indianapolis map](map:us:in:Indianapolis) showed about 1,610 scooters, roughly 1,000 Lime and 610 Bird: what stood there at that moment, not the fleets. By the Census Bureau’s boundaries, every one stood inside the consolidated city of Indianapolis, 96% of them in Center Township; one Bird stood in Rocky Ripple, a small town within it. None stood in Speedway, Beech Grove, Lawrence or Southport, the four Marion County cities and towns outside the consolidated city. At least 40 stood on IU Indianapolis’s campus and eight on Butler University’s.',
        'For Lime the map shows each scooter’s position and charge; for Bird, its position, charge and range left, plus Bird’s no-ride and no-parking zones. Scooters on a ride aren’t shown. **First ride?** Get the Bird or Lime app and scan the QR code on the handlebars: see [how to rent an e-scooter](guide:how-to-rent).',
        '**Bikes aren’t on the map.** ScootRadar shows standing e-scooters only. Bird’s open data has an e-bike type but listed none on 26 October 2026. Pacers Bikeshare, the docked bike share the City lists, had 56 stations that day; you rent its bikes in the BCycle app, and they must go back to a dock.',
      ],
    },
    {
      heading: 'How much does a Bird or Lime scooter cost in Indianapolis?',
      blocks: [
        'The City doesn’t set fares: each company files a rate schedule with its licence application. Bird’s open data for Indianapolis held no price plan on 26 October 2026, and Lime’s prices are in its app. So open the Bird or Lime app, which shows the unlock fee and the rate per minute before you start.',
        'Pacers Bikeshare publishes its prices in its open data. On 26 October 2026 pay as you ride cost $0.20 a minute on a classic bike, and a $3 fee plus $0.25 a minute on an e-bike. An Annual Pass costs $160.50 and covers unlimited rides of up to 60 minutes for a year. Marion County residents can ask for an IndyRides Free pass, which covers rides of up to 30 minutes for a year. The BCycle app shows the final price.',
      ],
    },
    {
      heading: 'Indianapolis e-scooter rules: age, helmets, sidewalks',
      blocks: [
        'WISH-TV reported in July 2019 that a state law in force from 1 July called these devices “electric foot scooters”, which left them legal on Indianapolis’s sidewalks and greenways for two weeks, because the City’s ordinance called them only “motorized vehicles”. On 15 July 2019 the City-County Council banned them from both again. The City’s rules are the ones to follow here.',
        {
          table: {
            caption: 'E-scooter rules in Indianapolis, and who sets them (as published on 26 October 2026)',
            head: ['Rule', 'What applies', 'Set by'],
            rows: [
              ['Age', '18 or over to ride a shared scooter', 'Chapter 905 (2018)'],
              ['Where to ride', 'City streets and bike lanes', 'Chapter 905; City (BNS)'],
              ['Sidewalks', 'Never, except briefly to reach or leave a parked spot. WISH-TV reported a ticket of up to $20 when the 2019 ban passed', 'City-County ordinance, 2019; City (BNS)'],
              ['Trails and greenways', 'Not allowed: the Cultural Trail, the Monon Trail, other greenways and any pedestrian or multimodal path, paved or not', 'City-County ordinance, 2019; City (BNS)'],
              ['Helmet', 'Encouraged, not required by the City', 'Chapter 905; City (BNS)'],
              ['Passengers', 'One rider only', 'Chapter 905'],
              ['Animals', 'Don’t ride while controlling an animal, by hand or on a leash', 'Chapter 905'],
              ['Lights', 'A white front and red rear light, visible from 500 feet, on any shared scooter that can run after sunset', 'Chapter 905'],
              ['Speed', 'A shared scooter’s motor must top out at 20 mph; the City’s scooter rules set no riding speed limit', 'Chapter 905'],
            ],
          },
        },
        { note: '**Keep off the sidewalks and the trails.** In Indianapolis a shared scooter belongs on the street or in a bike lane. Sidewalks, the Cultural Trail, the Monon and every other greenway are closed to e-scooters, and WRTV reported in 2025 that IMPD and park rangers patrol the Monon.' },
      ],
    },
    {
      heading: 'Scooters on the Cultural Trail, the Monon and in parks',
      blocks: [
        'The City names the **Indianapolis Cultural Trail** and the **Monon Trail** as trails where scooters aren’t allowed, and the text of its 2019 ordinance bans them from every greenway and pedestrian or multimodal path in the city. When it passed, WISH-TV reported that this includes the canal.',
        {
          list: [
            '**Trail rules.** The IMPD trail rules WRTV published in July 2025 allow Class 1 and 2 e-bikes and manual push scooters but not motorized scooters. Riders who break them may be fined or removed from the trails.',
            '**White River State Park.** The state park’s rules ban motorized vehicles outside its parking areas, sparing only park and police vehicles, Segways and motorized wheelchairs. The park covers the Canal Walk west of West Street, the pedestrian bridge over White River and Military Park, and is open from 5 a.m. to 11 p.m. Bird’s data bars ending a ride across large parts of it, on both banks of the river, and bars riding at all in a smaller area by the river just south of New York Street.',
            '**Indy Parks.** Parks are open dawn to dusk, and vehicles aren’t allowed on the grass.',
            '**Monument Circle.** Bird’s data makes the middle of the Circle, inside the roadway, a no-ride zone.',
          ],
        },
        'Bird’s open data held 10 no-ride and 39 no-parking zones on 26 October 2026, nearly all of them downtown, and the map draws them at street zoom. It has none for Lime, so check the map in the Lime app before you set off.',
      ],
    },
    {
      heading: 'Parking a Bird or Lime scooter in Indianapolis',
      blocks: [
        'The City’s parking rules for shared scooters, from Chapter 905 and its scooter page:',
        {
          list: [
            '**Upright, with 4 feet clear** for people walking, shown by a photo at the end of the ride.',
            '**At a bike rack or dock** where there is one. The grass strip between sidewalk and street is fine; landscaped beds are not.',
            '**Never** blocking a bus stop, BRT station, accessible parking, a curb ramp, a driveway, a loading zone or a bike-share station; never within 10 feet of a building entrance; not in a street or alley unless approved, and not on private property without permission.',
          ],
        },
        '**Mass Ave has its own spots.** In September 2025 WRTV reported a Department of Public Works pilot of about 30 designated scooter parking spots along Massachusetts Avenue: a ride won’t end, and the charges keep running, until the scooter stands within inches of one. In August 2026 INDYtoday pointed riders to the Mass Ave parking zones set up with Bird. Bird’s data marks Mass Ave as no-parking from Delaware Street to 9th Street; the spots themselves aren’t in its open data, so follow the app when you end the ride.',
        'A company must deal with a badly parked scooter within two hours of notice between 6 a.m. and 9 p.m., and within six hours overnight, and the Code sets a $25 penalty, charged to the company, for each one parked illegally. To report one, call Bird on 1-866-205-2442 or Lime on 1-888-LIME-345, the numbers the City lists.',
      ],
    },
    {
      heading: 'IU Indianapolis, IndyGo and the airport',
      blocks: [
        '**IU Indianapolis** says several companies run scooters on campus. Its guidelines: don’t ride on sidewalks, use the bike lanes, yield to pedestrians and always wear a helmet. Park at bike racks, never in walkways leading to buildings, car parking spaces, ADA ramps or indoors. Indiana University’s policy FIN-INS-13, reviewed in June 2026, requires a headlight and tail light from dusk to dawn, bans parking on grass and lets campus officials remove and impound badly parked scooters.',
        '**IndyGo** carries bikes on the outside rack of local buses and the inside rack of its BRT buses, such as the Red Line. Its code of conduct says nothing about scooters, so end the ride before you board, clear of the stop and the station.',
        '**Indianapolis International Airport** lists buses, taxis, Uber and Lyft, black cars and hotel shuttles among its ground transport, not scooters, and it lies well outside Bird’s service area.',
        'For scooters elsewhere in Indiana, the map shows Veo in [West Lafayette](map:us:in:West Lafayette), by Purdue. In Ohio, see [e-scooters in Columbus](guide:columbus).',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**The rules flipped twice in 2019.** A state law in force from 1 July left scooters legal on Indianapolis’s sidewalks and greenways; two weeks later the Council banned both again, WISH-TV reported.',
            '**Open data is a licence condition.** Since 14 May 2020 a City policy has required every licensed operator to make its real-time data public in the GBFS format, for uses that include building apps and research.',
            '**Indiana University’s own policy** lets scooters use campus sidewalks unless the city bans it. Indianapolis does.',
            '**Every shared scooter carries its own number**, a 24-hour phone line and a bell or horn: Chapter 905 requires all three.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Can you ride an e-scooter on the Cultural Trail?',
      answer: 'No. The City names the Indianapolis Cultural Trail and the Monon Trail as trails where scooters aren’t allowed, and its 2019 ordinance bans them from every greenway and pedestrian path in the city. Ride in the street or a bike lane instead.',
    },
    {
      question: 'Can you ride a scooter on the sidewalk in Indianapolis?',
      answer: 'No, except briefly to reach or leave a parked spot. The City-County Council banned sidewalk riding in July 2019, with a ticket of up to $20, WISH-TV reported. Use city streets and bike lanes instead.',
    },
    {
      question: 'How much is a Lime or Bird scooter in Indianapolis?',
      answer: 'Bird’s open data gives no Indianapolis price, and the City doesn’t set fares. Open the Lime or Bird app, which shows the unlock fee and the rate per minute before you start the ride.',
    },
    {
      question: 'How old do you have to be to ride a scooter in Indianapolis?',
      answer: '18. Chapter 905 of the Revised Code, which governs shared scooters, says riders must be at least 18 years old.',
    },
    {
      question: 'Do you need a helmet to ride an e-scooter in Indianapolis?',
      answer: 'The City encourages helmets but its rules don’t require one, and INDYtoday wrote in August 2026 that no law requires one on a stand-up scooter. IU Indianapolis tells riders on campus to always wear one.',
    },
    {
      question: 'Is there a curfew for e-scooters in Indianapolis?',
      answer: 'No City rule sets riding hours, so the app shows whether you can ride late. Indy Parks close at dusk and White River State Park from 11 p.m. to 5 a.m.',
    },
  ],
  sources: [
    { title: 'City of Indianapolis (BNS): Shared Mobility Devices', url: 'https://www.indy.gov/activity/shared-mobility-devices' },
    { title: 'City-County Council: Chapter 905, Shared Mobility Operator, G.O. No. 49, 2018, passed 16 July 2018 (PDF)', url: 'https://citybase-cms-prod.s3.amazonaws.com/9586ae26fd774219a4fad5c45d84f885.pdf' },
    { title: 'BNS: 2019-905 Regulations for Shared Mobility Operators, May 2019 (PDF)', url: 'https://citybase-cms-prod.s3.amazonaws.com/af6cf6e92d5d4f349aad762ac408dc73.pdf' },
    { title: 'BNS: Shared Mobility Data Sharing Specifications Policy, effective 14 May 2020 (PDF)', url: 'https://citybase-cms-prod.s3.amazonaws.com/f6a12e18ac654afa8fdad85c4923de25.pdf' },
    { title: 'BNS: Shared Mobility Operator licence application packet, October 2023 (PDF)', url: 'https://us-east-1-indy.graphassets.com/ActDBC5rvRWeCZlNNnLrDz/8r6HTNPXS2GeKXzLJgeu?dl=true' },
    { title: 'City-County Council: Proposal No. 272, 2019, electric foot scooters on sidewalks and greenways, as introduced (PDF)', url: 'https://citybase-cms-prod.s3.amazonaws.com/d6819c587f1a47609ca646a0da9fb5bd.pdf' },
    { title: 'Bird: Indianapolis open data (GBFS)', url: 'https://mds.bird.co/gbfs/v2/public/indianapolis/gbfs.json' },
    { title: 'Pacers Bikeshare: open data (GBFS)', url: 'https://gbfs.bcycle.com/bcycle_pacersbikeshare/gbfs.json' },
    { title: 'Indy Parks: park rules', url: 'https://parks.indy.gov/rentals-permits-parkrules/' },
    { title: 'White River State Park: 935 IAC 1, park rules, LSA #17-214(F) (PDF)', url: 'https://whiteriverstatepark.org/wp-content/uploads/17-214-Final-Rule_171114.pdf' },
    { title: 'IU Indianapolis Parking and Transportation: Motorized Scooters', url: 'https://parking.indianapolis.iu.edu/transportation/shared-services/scooter.html' },
    { title: 'Indiana University: policy FIN-INS-13, bicycles, scooters and other personal conveyance vehicles', url: 'https://policies.iu.edu/policies/fin-ins-13-bicycles-scooters-other-personal-conveyance-vehicles/index.html' },
    { title: 'IndyGo: code of conduct', url: 'https://www.indygo.net/code-of-conduct/' },
    { title: 'Indianapolis International Airport: transportation and car rental', url: 'https://www.ind.com/transportation-car-rental' },
    { title: 'US Census Bureau: TIGERweb boundaries', url: 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb' },
    { title: 'WISH-TV: e-scooter riders now face $20 ticket under new city law, 16 July 2019', url: 'https://www.wishtv.com/news/e-scooter-riders-now-face-20-ticket-under-new-city-law/' },
    { title: 'WISH-TV: City-County Council approves second scooter ordinance, 16 July 2019', url: 'https://www.wishtv.com/news/city-county-council-approves-second-scooter-ordinance/' },
    { title: 'WRTV: Indy DPW pilot programme for e-scooter parking on Mass Ave, 10 September 2025', url: 'https://www.wrtv.com/news/tired-of-e-scooter-clutter-on-downtown-streets-a-new-indy-dpw-pilot-program-aims-to-fix-that/' },
    { title: 'WRTV: IMPD encourages safety on Indy trails, 3 July 2025', url: 'https://www.wrtv.com/news/impd-encourages-safety-on-indy-trails-as-officers-see-increase-in-prohibited-e-bikes/' },
    { title: 'INDYtoday: rules, regulations and safety tips for scooters in Indy, 24 August 2026', url: 'https://6amcity.com/web/in/indianapolis/city/scooter-season-rules-regulations-safety-tips' },
  ],
};

export default guide;
