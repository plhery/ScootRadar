import type { Guide } from '@/lib/guides';

const guide: Guide = {
  locale: 'en',
  slug: 'e-scooters-krakow',
  topic: 'krakow',
  name: 'Renting an e-scooter in Kraków',
  title: 'E-scooters Kraków 2026: Bolt, Dott, Lime, parking and rules',
  description: 'E-scooters in Kraków: Bolt, Dott and Lime, where you may park in the centre, the ban on Wawel Hill, and Poland’s age, helmet and alcohol rules.',
  headline: 'E-scooters in Kraków: Bolt, Dott and Lime, parking points and the places you can’t ride',
  lede: 'You can rent an e-scooter in Kraków (Krakow) with Bolt, Dott or Lime; check the fare and the company’s minimum age in its app. In the centre you may end a ride only at one of the city’s 342 parking points, and Polish law sends you to the cycle path at up to 20 km/h.',
  published: '2026-10-25',
  updated: '2026-10-25',
  city: 'pl:Kraków',
  sections: [
    {
      heading: 'Which e-scooter apps work in Kraków?',
      blocks: [
        'Three companies’ scooters are on our map of Kraków: **Bolt**, **Dott** and **Lime**. Bolt and Lime have been in the city’s parking scheme since it began in August 2023.',
        'Traficar, a car-sharing company, joined the scheme in March 2024, but on 25 October 2026 its website listed only cars. ZTP’s scooter page says “several operators” work in Kraków but names none; any other company’s scooters are only in its own app.',
        'At 13:50 on Sunday 25 October 2026 the [Kraków map](map:pl:Kraków) showed about 4,100 Bolt and Dott scooters (about 3,200 Bolt, 900 Dott): a snapshot, not a fleet size. Matched to the official commune boundaries at about 19:20, after dark, all but 23 of the 4,080 then on the map stood inside the city; the 23, still in the map’s Kraków total, stood in Zielonki, to the north. Skawina, to the south-west, has [its own map](map:pl:Skawina): about 100 Dott scooters that afternoon.',
        'Lime joined the map that evening. A full scan of Lime’s Kraków zone, almost all inside the city, finished at 17:07 that day and found about 1,300 Lime scooters: a separate count, not part of the snapshot above.',
        'Kraków’s Wavelo bike-share is gone; the city now has LajkBike, rented by the month, and Park-e-Bike.',
        'Check the fare, and the company’s minimum age for renting, in its app before you unlock. New to shared scooters? See [how to rent an e-scooter](guide:how-to-rent).',
        'Our guides to [Warsaw](guide:warsaw), [Wrocław](guide:wroclaw), [Łódź](guide:lodz), [Poznań](guide:poznan), [Gdańsk, Gdynia and Sopot](guide:gdansk), [Szczecin](guide:szczecin), [Katowice and Chorzów](guide:katowice), [Bydgoszcz](guide:bydgoszcz) and [Toruń](guide:torun) cover the same national rules.',
      ],
    },
    {
      heading: 'Where to park in Kraków',
      blocks: [
        'With no national law on rental scooters to rely on, the city’s transport authority, ZTP (Zarząd Transportu Publicznego), has had agreements with the operators since August 2023: they rent space for parking points (punkty mobilności) and pay to have stray scooters moved. The area began a little beyond the second ring road (II obwodnica) and nearly doubled in 2024.',
        {
          list: [
            '**Inside that area, end your ride only at a point.** ZTP says points, each with a capacity shared between the companies, are the only places there where you may legally leave a scooter; its map listed 342, with room for about 2,240 scooters (6 October 2026). The apps should block ending a ride elsewhere, it said in 2023.',
            '**Report a scooter left outside a point** there through ZTP’s scooter page, with a photo and the address; ZTP says it should be moved within about two hours, at the operator’s cost.',
            '**Outside the area**, follow the national rule: in a marked place, or else at the pavement’s outer edge, parallel to it, leaving 1.5 m for pedestrians.',
          ],
        },
        { note: 'A scooter left in the way can be towed at its owner’s cost on the orders of the municipal police (Straż Miejska) or the Police: in 2026, PLN 175 plus PLN 33 a day in the pound (city council resolution of 19 November 2025). For a rental that’s the company: check its terms in the app for what it may charge you.' },
      ],
    },
    {
      heading: 'Where can you ride? Poland’s e-scooter rules',
      blocks: [
        'Poland’s Road Traffic Act (Prawo o ruchu drogowym) sets the riding rules in Kraków. An electric scooter (hulajnoga elektryczna) may go no faster than 20 km/h.',
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
        'All are national rules. The tickets come from the government’s fines tariff in force since 1 January 2022, and the helmet fine from the Code of Petty Offences. ZTP’s scooter page adds: walk your scooter across a zebra crossing; riding on one is banned outright.',
      ],
    },
    {
      heading: 'The Old Town, Wawel, Kazimierz and the river',
      blocks: [
        '**Wawel Hill.** Wawel Royal Castle, the state museum that manages the hill, bans visitors from bringing in or riding “bicycles, scooters, roller blades or skates, skate boards, or any other wheeled vehicles or electric wheeled vehicles” (hill rules of 24 February 2021).',
        '**The Old Town and the Main Square (Rynek Główny).** We found no official list of no-ride or slow zones: krakow.pl didn’t respond when we checked, and ZTP’s page names none. But no parking point stands within 300 metres of the Cloth Hall (Sukiennice) in the middle of the square, so you can’t end a ride in the heart of the Old Town; that evening the map showed no Bolt or Dott scooter within 200 metres of it.',
        '**Kazimierz, the Vistula and Błonia.** There are points at Plac Nowy and Plac Wolnica in Kazimierz, at Bulwar Poleski and Bulwar Wołyński on the river, and at Cracovia Błonia by the meadow. We found no official rule there beyond the national ones.',
        '**The universities.** We found no scooter rule published by the Jagiellonian University, and couldn’t check AGH’s.',
      ],
    },
    {
      heading: 'Trams, trains, the main station and the airport',
      blocks: [
        '**Trams and buses (MPK).** The city council’s carriage rules don’t name e-scooters: hand luggage is allowed if it doesn’t block the aisle, soil others’ clothes or limit the driver’s view, and the driver may refuse bulky luggage in a crowd (§ 9, as amended in November 2023).',
        '**Koleje Małopolskie**, the regional trains. Its carriage rules, in force since 11 September 2026, carry a folded scooter, “including an electric scooter”, free as luggage; an unfolded one needs a PLN 6 ticket and a marked space, and staff may refuse it at busy times.',
        '**Kraków Główny.** The main station is run by PKP S.A., the state railway company. Its rules ban riding a scooter “on the platform, the way to the platform, in the hall, waiting room … underpass, on the footbridge … and near the track less than 3 metres from the outer rail” without its consent, and leaving rental scooters “except in the places meant for them” (§ 3, January 2025). City points nearby include Dworzec Główny Wschód 1 and 2. Galeria Krakowska, the shopping centre beside it, publishes no scooter rule.',
        '**Kraków Airport (Balice).** It lies in Zabierzów, outside the city; no scooter on the map stood within 3 km of it that evening. Its internal road rules (2018) set 20 km/h for all vehicles and don’t mention scooters. The airport train, Koleje Małopolskie’s SKA1, runs from Kraków Główny for PLN 20 single, the airport says.',
      ],
    },
    {
      heading: 'Caps, hours and winter',
      blocks: [
        'We found no cap on scooter numbers. In March 2024 ZTP said the operators’ combined fee would rise from April to PLN 23,582.99 a month, for 303 points.',
        'The operators’ fees are charged all year, and from December 2023 to February 2024 scooters had to be moved only 58 times, ZTP said.',
      ],
    },
    {
      heading: 'Did you know?',
      blocks: [
        {
          list: [
            '**Kraków’s points began as a three-month pilot** in August 2023, with 163 points; a year later there were 323.',
            '**More than 15,000 badly parked scooters were moved** in the scheme’s first year, to August 2024, at the operators’ cost.',
            '**The city lends e-bikes for free** at seven Park-e-Bike stations, due back by 22:00, to adults with a PESEL, Poland’s ID number.',
          ],
        },
      ],
    },
  ],
  faq: [
    {
      question: 'Which e-scooters can you rent in Kraków?',
      answer: 'Bolt, Dott and Lime, all three on [our map](map:pl:Kraków). Check the fare and the company’s minimum age for renting in its app before you unlock.',
    },
    {
      question: 'How much does electric scooter rental cost in Krakow?',
      answer: 'Each company sets its own fare and shows it in its app: check it before you unlock.',
    },
    {
      question: 'Where can you park an e-scooter in Kraków?',
      answer: 'In the centre, only at one of the city’s 342 parking points, shown on ZTP’s online map. Elsewhere, in a marked place or at the pavement’s outer edge, leaving 1.5 m for pedestrians.',
    },
    {
      question: 'Do you need a helmet on an e-scooter in Poland?',
      answer: 'Only under 16, since 3 June 2026; the parent or carer can be fined up to PLN 100. From 16 it’s your choice.',
    },
    {
      question: 'Can you ride an e-scooter on Wawel Hill?',
      answer: 'No. Wawel Royal Castle bans bringing scooters on to the hill, let alone riding them.',
    },
    {
      question: 'Can you take an e-scooter on the airport train?',
      answer: 'Yes: Koleje Małopolskie, which runs it, carries a folded scooter free as luggage and an unfolded one for PLN 6, space permitting.',
    },
  ],
  sources: [
    { title: 'ZTP Kraków: e-scooters and parking points (Polish)', url: 'https://ztp.krakow.pl/miasto-15-minutowe/hulajnogi-elektryczne' },
    { title: 'ZTP Kraków: parking points map', url: 'https://gmk-2.maps.arcgis.com/apps/instant/basic/index.html?appid=aafbfe9173d14665ad25169767525560' },
    { title: 'ZTP Kraków: pilot, 4 August 2023 (Polish)', url: 'https://ztp.krakow.pl/wszystkie-aktualnosci/miasto-15-minutowe/rusza-sprzatanie-hulajnog-uruchamiamy-telefon-i-mail-do-zglaszania-porzuconego-sprzetu.html' },
    { title: 'ZTP Kraków: more order, 12 March 2024 (Polish)', url: 'https://ztp.krakow.pl/wszystkie-aktualnosci/miasto-15-minutowe/jeszcze-wiekszy-lad-z-hulajnogami.html' },
    { title: 'ZTP Kraków: new rules, 28 March 2024 (Polish)', url: 'https://ztp.krakow.pl/wszystkie-aktualnosci/miasto-15-minutowe/hulajnogi-w-krakowie-po-nowemu.html' },
    { title: 'ZTP Kraków: first year, 9 August 2024 (Polish)', url: 'https://ztp.krakow.pl/wszystkie-aktualnosci/miasto-15-minutowe/pierwszy-rok-funkcjonowania-porozumienia-i-relokacji-hulajnog-elektrycznych.html' },
    { title: 'ZTP Kraków: LajkBike (Polish)', url: 'https://ztp.krakow.pl/rower/lajkbike' },
    { title: 'ZTP Kraków: Park-e-Bike (Polish)', url: 'https://ztp.krakow.pl/rower/park-e-bike' },
    { title: 'Kraków City Council: 2026 removal fees (Polish, PDF)', url: 'https://edziennik.malopolska.uw.gov.pl/WDU_K/2025/6855/akt.pdf' },
    { title: 'ZDMK: towed vehicles and 2026 rates (Polish)', url: 'https://zdmk.krakow.pl/zalatw-sprawe/odholowany-samochod-co-dalej/' },
    { title: 'Kraków City Council: transport rules, 2023 (Polish, PDF)', url: 'https://edziennik.malopolska.uw.gov.pl/WDU_K/2023/7739/akt.pdf' },
    { title: 'Koleje Małopolskie: carriage rules from 11 September 2026 (Polish, PDF)', url: 'https://www.kolejemalopolskie.com.pl/brepo/panel_repo/2026/09/02/mishvc/rpo-kml-zmiana-nr-11-ost.pdf' },
    { title: 'Koleje Małopolskie: tariff from 1 April 2026 (Polish, PDF)', url: 'https://www.kolejemalopolskie.com.pl/brepo/panel_repo/2026/03/19/cpt2dx/taryfa-przewozowa-kml-zm8-ost.pdf' },
    { title: 'Kraków Airport: by train (Polish)', url: 'https://krakowairport.pl/pl/pasazer/transport/dojazd/z-do-krakow-airport/dojazd-pociag' },
    { title: 'Kraków Airport: internal road rules (Polish, PDF)', url: 'https://krakowairport.pl/storage/2021-01/regulamin-wuk-2018-net-1612101406Aa88p.pdf' },
    { title: 'Wawel Royal Castle: Wawel Hill visitor policies', url: 'https://wawel.krakow.pl/en/wawel-hill-visitor-policies' },
    { title: 'PKP S.A.: station rules (Polish)', url: 'https://www.pkp.pl/images/bezpieczenstwo/Zasady.pdf' },
    { title: 'Dziennik Ustaw: Road Traffic Act, 2024 (Polish)', url: 'https://dziennikustaw.gov.pl/D2024000125101.pdf' },
    { title: 'Dziennik Ustaw: amending act of 17 October 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/DU/2025/1676' },
    { title: 'Dziennik Ustaw: Act on vehicle drivers, 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/D2025000122601.pdf' },
    { title: 'Dziennik Ustaw: Code of Petty Offences, 2025 (Polish)', url: 'https://dziennikustaw.gov.pl/D2025000073401.pdf' },
    { title: 'Dziennik Ustaw: fines tariff from 1 January 2022 (Polish)', url: 'https://dziennikustaw.gov.pl/D2021000248401.pdf' },
    { title: 'Dziennik Ustaw: sobriety act (Polish)', url: 'https://dziennikustaw.gov.pl/D2023000215101.pdf' },
    { title: 'Traficar: fleet (Polish)', url: 'https://traficar.pl/flota/' },
    { title: 'GUGiK: State Register of Boundaries, PRG (Polish)', url: 'https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-granic-prg/' },
  ],
};

export default guide;
