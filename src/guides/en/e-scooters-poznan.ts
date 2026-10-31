import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-poznan',
  topic: 'poznan',
  name: 'Renting an e-scooter in Poznań',
  title: 'E-scooters Poznań 2026: Bolt, Dott, Lime, prices and rules',
  description: 'E-scooters in Poznań: Bolt, Dott and Lime, what a ride costs, the Hop & Go points where central rides must end, and Poland’s age, helmet and alcohol rules.',
  headline: 'E-scooters in Poznań: Bolt, Dott and Lime, prices, parking and where you can’t ride',
  lede: 'You can rent an e-scooter (hulajnoga elektryczna) in Poznań (Poznan) with Bolt, Dott or Lime; Bolt and Dott rent only to riders of 18 and over. Bolt charges from PLN 0.22 a minute plus an unlock fee (its rate for Poland on 25 October 2026); Dott and Lime show prices in the app. In and around the centre a ride may end only at a Hop & Go point. Polish law puts you on the cycle path where there is one, at no more than 20 km/h, and ZTM’s rules keep every e-scooter off trams and buses.',
  published: '2026-10-26',
  updated: '2026-10-26',
  city: 'pl:Poznań',
  sections: [
    {
      heading: 'Which e-scooter apps work in Poznań?',
      blocks: [
        'Three companies’ scooters are on our map of Poznań:',
        {
          list: [
            '**Bolt**, in the same app as its taxis. Its terms for Poland require you to be 18, and its Polish page says new riders are held to 15 km/h for their first five rides.',
            '**Dott**, whose terms for Poland also require 18; its website lists Poznań and neighbouring Luboń.',
            '**Lime**, which the city roads authority lists as “Uber/Lime”.',
          ],
        },
        'By March 2023 the city had signed a cooperation agreement (porozumienie o współpracy) with all three.',
        'At 19:59 on Sunday 25 October 2026 the [Poznań map](map:pl:Poznań) showed about 3,400 Bolt and Dott scooters (about 2,200 Dott, 1,200 Bolt): a snapshot, not a fleet size. Matched to GUGiK’s official commune boundaries at about 21:00, 3,132 of the 3,381 then on the map, every Bolt included, stood inside the city. The other 249, all Dott, stood in Luboń (133), Komorniki, which takes in Plewiska (56), Suchy Las (46) and Dopiewo (14).',
        'A full scan of Lime’s Poznań zone, wholly inside the city, finished at 17:32 that day and found about 1,500 Lime scooters: a separate count, not part of that snapshot.',
        'The map shows where each scooter stands, with Lime’s and Bolt’s battery charge (unless Bolt hides it) but not Dott’s, and no prices or hours; zoomed in, it draws ZDM’s Hop & Go points and the paid parking zones where a ride must end at one. Nor does it show bikes: Poznań dropped its city bike-share when rentals fell (in July 2026 the council asked for a new one), and Bolt’s Poznań page lists no e-bikes.',
        'New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
      ],
    },
    {
      heading: 'How much does an e-scooter cost in Poznań?',
      blocks: [
        'Bolt’s Polish page advertises scooters “from PLN 0.22 a minute” plus a small unlock fee, with rates that can vary by place. It also sells unlimited unlocks from €0.99 a month, and weekly and monthly passes. Dott and Lime show their prices in the app.',
        'Bolt’s and Dott’s terms set the extra charges:',
        {
          table: {
            caption: 'Extra charges in Bolt’s and Dott’s terms for Poland (read 25 October 2026)',
            head: ['Operator', 'Charge', 'When'],
            rows: [
              ['Bolt', 'PLN 30', 'Parking against its rules or without a clear end-of-ride photo'],
              ['Bolt', 'Up to PLN 460', 'Leaving the scooter outside an allowed parking place'],
              ['Bolt', 'Up to PLN 560, plus ride charges until it’s found', 'Abandoning the scooter without telling Bolt'],
              ['Bolt', 'Up to PLN 140', 'Admin fee for handling a breach'],
              ['Dott', 'Up to €300', 'Recovering a scooter parked or locked against its instructions'],
              ['Dott', '€50', 'Any breach of its terms, and again as an admin fee on a fine it pays for you'],
            ],
          },
        },
      ],
    },
    {
      heading: 'Where to park in Poznań: Hop & Go points',
      blocks: [
        'Poznań’s answer to scooters strewn across pavements is Hop & Go parking points (punkty mikromobilności). ZDM (Zarząd Dróg Miejskich, the city roads authority) lists more than 270, each signed and shown in the operators’ apps, most of them in the paid parking zones (8 December 2025).',
        {
          list: [
            '**In the paid parking zones, end your ride only at a point.** Since 1 April 2024, says ZDM, shared scooters must be left at a point throughout the city’s two paid parking zones (ŚSPP and SPP): the city centre, Jeżyce, Wilda, Łazarz, Ostrów Tumski, Śródka and Piotrowo. Leave one anywhere else there, ZDM adds, and you can’t end the rental, so the charge keeps running.',
            '**Outside them, points are recommended.** Otherwise park in a marked place, or at the pavement’s outer edge, parallel to it, leaving 1.5 m for pedestrians, and never on a cycle path.',
            '**Report a badly parked scooter** to its company; ZDM’s parking page lists each one’s contacts.',
          ],
        },
        { note: 'The police or the municipal police (Straż Miejska) can have a scooter left in the way towed at its owner’s cost: in 2026, PLN 170 plus PLN 33 a day in the pound, or PLN 153 if the tow is called off once the truck has arrived (city council resolution of 14 October 2025). For a rental that’s the company, and Bolt’s and Dott’s terms let them pass it on to you.' },
      ],
    },
    {
      heading: 'Where can you ride? Poland’s e-scooter rules',
      blocks: [
        'Poland’s Road Traffic Act (Prawo o ruchu drogowym) sets the riding rules in Poznań. An electric scooter (hulajnoga elektryczna) may go no faster than 20 km/h.',
        {
          list: [
            '**Cycle path or cycle lane first**, where there is one for your direction.',
            '**Otherwise the road**, but only where its speed limit is 30 km/h or less.',
            '**The pavement only as an exception:** beside a road with a limit above 30 km/h and no cycle path or lane, at walking pace, giving way to pedestrians.',
          ],
        },
        {
          table: {
            caption: 'E-scooter rules and fines in Poland on 25 October 2026 (national law and fines tariff)',
            head: ['Rule', 'What applies', 'Fine'],
            rows: [
              ['Minimum age', '13 since 3 March 2026 (10 before); under 13 only in a home zone, with an adult', '–'],
              ['Aged 13 to 17', 'A bicycle card (karta rowerowa) or an AM, A1, B1, B or T licence', '–'],
              ['Helmet', 'Required under 16 since 3 June 2026', 'Up to PLN 100, for the parent or carer'],
              ['Cycle path', 'Use it where there is one', 'PLN 100'],
              ['Pavement', 'Only beside a road over 30 km/h with no cycle path or lane', 'PLN 200'],
              ['On the pavement', 'Walking pace, give way, don’t obstruct', 'PLN 300 each'],
              ['Riding', 'One rider; no passenger, animal, load or towing; not side by side on the road; a hand on the handlebar', 'PLN 50 for side by side or no hands'],
              ['Phone', 'Don’t hold it while riding', 'PLN 500'],
              ['Alcohol, 0.2‰ to 0.5‰', '“After drinking” (stan po użyciu alkoholu)', 'PLN 1,000 ticket; in court up to PLN 5,000 or arrest, and possibly a riding ban'],
              ['Alcohol, over 0.5‰', '“Drunk” (stan nietrzeźwości)', 'PLN 2,500 ticket; in court up to PLN 5,000 or arrest, and possibly a riding ban'],
              ['Parking on the pavement', 'In a marked place, else at the outer edge, parallel to it, leaving 1.5 m for pedestrians', 'Removal at the owner’s cost if it blocks the way'],
            ],
          },
        },
        'All are national rules. The tickets come from the government’s fines tariff in force since 1 January 2022, and the helmet fine from the Code of Petty Offences.',
      ],
    },
    {
      heading: 'Stary Rynek, Cytadela, Malta and the parks',
      blocks: [
        '**Stary Rynek, Śródka and the river.** We found no city rule closing the Old Market Square (Stary Rynek), Śródka or the Warta boulevards to e-scooters or slowing them there; the square and Śródka are in the Hop & Go area. At about 21:00 that evening the nearest Bolt or Dott scooter stood about 150 metres from the town hall, with 63 within 300 metres.',
        '**Cytadela.** The city council set Poznań’s park rules park by park in 2009, and they are still in force. The rules for Cytadela ban riding “any vehicles” (wszelkimi pojazdami) on its paths, except bicycles, wheelchairs and authorised vehicles. Read literally, that takes in e-scooters, which Polish traffic law counts as vehicles.',
        '**The other parks.** Park Maltański, by the lake, has the same rule. In Park Mickiewicza and many others only “children’s bikes” (rowerki dziecięce), wheelchairs and authorised vehicles are exempt. Wilson Park’s rules, rewritten in 2020, ban riding scooters (hulajnogi) on its paths by name.',
        '**Malta.** POSiR, the city’s sports centres, runs the lake’s grounds; its rules (since 1 March 2020) apply the Road Traffic Act there but don’t mention scooters.',
      ],
    },
    {
      heading: 'Universities, the trade fair and Stary Browar',
      blocks: [
        '**Adam Mickiewicz University (UAM).** Since 15 January 2024 only vehicles UAM authorises, city services and MPK may enter or park on its Morasko campus from 21:00 to 06:00. Its notice is about cars.',
        '**Poznań University of Technology.** We found no scooter rule for its Piotrowo campus, in the Hop & Go area.',
        '**The trade fair grounds (MTP).** The Poznań International Fair’s rules for fair participants (from 1 July 2024), which bind its exhibitors, ban bringing bicycles, Segways, skateboards “and similar equipment” on to its grounds unless a fair’s own terms allow it.',
        '**Stary Browar.** The shopping and arts centre’s house rules (18 September 2021) ban riding in on bicycles, skateboards, roller skates, scooters and Segways without the management’s consent.',
      ],
    },
    {
      heading: 'Trams, buses, the main station and the airport',
      blocks: [
        '**Trams and buses (ZTM Poznań).** The city council’s public transport rules, in force since 20 November 2023, ban carrying “scooters and bicycles fitted with a motor”, “scooters and bicycles of shared systems” and personal transport devices; only a folded scooter without a motor may board. So no e-scooter, yours or a rental, folded or not, may go on a tram or bus. Taking a banned item aboard costs a PLN 350 surcharge, PLN 175 if paid at once or within 7 days.',
        '**Poznań Główny.** The main station is one of PKP S.A.’s, the state railway company. Its rules ban riding a scooter “on the platform, the way to the platform, in the hall, waiting room … underpass, on the footbridge … and near the track less than 3 metres from the outer rail” without its consent, and leaving rental scooters “except in the places meant for them” (§ 3, January 2025). That evening about 110 Bolt and Dott scooters stood within 300 metres of its address, ul. Dworcowa 2.',
        '**Poznań–Ławica airport.** Its websites refused our requests, so we couldn’t check its rules.',
      ],
    },
    {
      heading: 'Caps, hours and winter',
      blocks: [
        'We found no cap on scooter numbers, no fee the operators pay the city, no night ban and no winter pause. Bolt’s terms forbid riding in snow, hail, ice or thunderstorms.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Before Hop & Go, ZDM’s 2020 deals with Lime, Blinkee and Bolt** had the companies move badly parked or broken scooters within three hours of a report.',
            '**Poznań had 360 km of cycle paths in 2024**, two and a half times as many as a decade before, the city’s transport report says.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooters can you rent in Poznań?',
      answer: 'Bolt, Dott and Lime, all three on [our map](map:pl:Poznań). Bolt and Dott rent only to riders of 18 and over.',
    },
    {
      question: 'How much does electric scooter rental cost in Poznan?',
      answer: 'Bolt charges from PLN 0.22 a minute plus an unlock fee (its rate for Poland on 25 October 2026). Dott and Lime show their prices in the app.',
    },
    {
      question: 'Where can you park an e-scooter in Poznań?',
      answer: 'In the paid parking zones (the city centre and the districts around it), only at a Hop & Go point, or the rental won’t end. Elsewhere, at a point or at the pavement’s outer edge, leaving 1.5 m for pedestrians.',
    },
    {
      question: 'Can you take an e-scooter on a tram in Poznań?',
      answer: 'No. ZTM’s rules ban every motorised scooter and every rental scooter or bike from trams and buses, folded or not.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Poland?',
      answer: 'Only under 16, since 3 June 2026; the parent or carer can be fined up to PLN 100. From 16 it’s your choice.',
    },
    {
      question: 'Can you ride an e-scooter in Cytadela park?',
      answer: 'Best not on its paths. The park’s 2009 rules ban riding “any vehicles” there except bicycles, wheelchairs and authorised ones, which, read literally, takes in e-scooters.',
    },
  ],
  sources: [
    { title: 'ZDM Poznań: Hop & Go points, 8 December 2025 (Polish)', url: 'https://zdm.poznan.pl/punkty-mikromobilnosci-hop-go-punkty-hop-go' },
    { title: 'ZDM Poznań: parking rules (Polish)', url: 'https://zdm.poznan.pl/zasady-parkowania-zasady-parkowania' },
    { title: 'Poznań City Council: Hop & Go, 23 March 2023 (Polish)', url: 'https://www.poznan.pl/mim/rm/news,1202/hop-and-go-miejsca-dla-hulajnog,200024.html' },
    { title: 'Poznań City Council: scooters, 15 April 2021 (Polish)', url: 'https://www.poznan.pl/mim/rm/news,1202/z-rady-miasta,c,16/nowe-zasady-dla-hulajnog,162412.html' },
    { title: 'City of Poznań: public transport in 2024 (Polish, PDF)', url: 'https://badam.poznan.pl/wp-content/uploads/2025/11/transport-miejski-w-poznaniu-w-2024-r.pdf' },
    { title: 'Poznań City Council: a new city bike scheme, 7 July 2026 (Polish)', url: 'https://bip.poznan.pl/bip/uchwaly/kadencja-2024-2029,15/xxxviii-678-ix-2026-z-dnia-2026-07-07,99357/' },
    { title: 'Poznań City Council: 2026 removal fees (Polish)', url: 'https://bip.poznan.pl/bip/uchwaly/kadencja-2024-2029,15/xxv-461-ix-2025-z-dnia-2025-10-14,97308/' },
    { title: 'Poznań City Council: park rules, 2009 (Polish)', url: 'https://bip.poznan.pl/bip/uchwaly/uchwala-nr-lviii-779-v-2009-z-dnia-2009-07-07,30512/' },
    { title: 'Poznań City Council: Wilson Park rules, 2020 (Polish)', url: 'https://bip.poznan.pl/bip/uchwaly/xxiv-458-viii-2020,81352/' },
    { title: 'ZTM Poznań: public transport rules (Polish)', url: 'https://www.ztm.poznan.pl/regulaminy/przepisy-porzadkowe/' },
    { title: 'ZTM Poznań: surcharges (Polish)', url: 'https://www.ztm.poznan.pl/wszystko-o-biletach/oplaty-dodatkowe-kontrola-biletow/' },
    { title: 'POSiR: Malta site rules (Polish, PDF)', url: 'https://posir.poznan.pl/images/obiekty/Malta/malta-regulamin-obiektu.pdf' },
    { title: 'UAM: Morasko campus traffic, January 2024 (Polish)', url: 'https://amu.edu.pl/dla-mediow/komunikaty-prasowe/nowa-organizacja-ruchu-na-kampusie-morasko' },
    { title: 'MTP: rules for fair participants, 2024 (Polish, PDF)', url: 'https://reg.mtp.pl/terms/Regulamin-dla-uczestnikow-targow.pdf' },
    { title: 'Stary Browar: house rules, 2021 (Polish, PDF)', url: 'https://starybrowar5050.com/wp-content/uploads/2021/09/Regulamin-Starego-Browaru-w-Poznaniu-18_09_2021.pdf' },
    { title: 'PKP S.A.: station rules (Polish)', url: 'https://www.pkp.pl/images/bezpieczenstwo/Zasady.pdf' },
    { title: 'PKP S.A.: Poznań Główny (Polish)', url: 'https://www.pkp.pl/pl/dworce/poznan-glowny-informacje-dla-podroznych' },
    { title: 'Muzeum Poznania: the town hall (Polish)', url: 'https://mnp.art.pl/ratusz-muzeum-poznania' },
    { title: 'Dziennik Ustaw: Road Traffic Act, 2024 (Polish)', url: 'https://dziennikustaw.gov.pl/D2024000125101.pdf' },
    { title: 'Dziennik Ustaw: amending act of 17 October 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/DU/2025/1676' },
    { title: 'Dziennik Ustaw: Act on vehicle drivers, 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/D2025000122601.pdf' },
    { title: 'Dziennik Ustaw: Code of Petty Offences, 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/D2025000073401.pdf' },
    { title: 'Dziennik Ustaw: fines tariff from 1 January 2022 (Polish)', url: 'https://dziennikustaw.gov.pl/D2021000248401.pdf' },
    { title: 'Dziennik Ustaw: sobriety act (Polish)', url: 'https://dziennikustaw.gov.pl/D2023000215101.pdf' },
    { title: 'Bolt: Poznań (Polish)', url: 'https://bolt.eu/pl-pl/cities/poznan/' },
    { title: 'Bolt: scooters in Poland (Polish)', url: 'https://bolt.eu/pl-pl/scooters/' },
    { title: 'Bolt: terms for Poland from 8 May 2026 (Polish)', url: 'https://bolt.eu/pl-pl/legal/micromobility/tnc-micromobility-old/' },
    { title: 'Dott: locations', url: 'https://ridedott.com/locations/' },
    { title: 'Dott: terms and conditions for Poland', url: 'https://ridedott.com/terms-and-conditions/poland/' },
    { title: 'GUGiK: State Register of Boundaries and addresses, PRG (Polish)', url: 'https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-granic-prg/' },
  ],
};

export default guide;
