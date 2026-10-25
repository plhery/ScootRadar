# Estonian, Lithuanian, Slovak, Bulgarian, Moldovan, Slovenian and Irish scooter feeds

Verified 25 October 2026. These seven countries came onto the map that day
with Bolt's authenticated rider map, their only source; how it is read is in
[Bolt rider map](bolt-app-map.md). None has a public scooter feed: Bolt's
GBFS answers 401 in Europe outside Brussels and Liverpool, and Ride Mobility, Dott and
the others publish nothing there (see
[Countries not covered yet](coverage-gaps.md#countries-not-covered-yet) as
it stood before). Each town is one Bolt market, and its catalog
(`data/<adjective>-scooter-feeds.json`) is generated from the market's
operating areas by the research scripts the Bolt guide describes. City
centres are GeoNames' (CC BY 4.0), credited per country.

The counts are one read of each market on the morning of Sunday 25 October
2026, and a second read through the site's own collector half an hour later.

## Estonia

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Tallinn | 4,094 | 4,103 |
| Tartu | 1,216 | 1,216 |
| Kohtla-Järve / Jõhvi | 319 | 315 |
| Pärnu | 285 | 285 |
| Narva | 252 | 251 |
| Haapsalu | 152 | 151 |
| Viljandi | 146 | 150 |
| Rakvere | 138 | 138 |
| Kuressaare | 104 | 107 |
| Võru | 48 | 48 |

Kohtla-Järve and Jõhvi, 9 km apart, are one market with an area each: 88
scooters in Kohtla-Järve and 231 in Jõhvi. The total stands inland between
Tallinn and Tartu (58.7° N, 25.4° E).

## Lithuania

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Vilnius | 2,094 | 2,088 |
| Kaunas | 854 | 847 |
| Kėdainiai | 263 | 262 |
| Panevėžys | 240 | 239 |
| Alytus | 231 | 234 |
| Jonava | 171 | 171 |
| Šiauliai | 165 | 168 |
| Klaipėda | 131 | 131 |

Bolt's Marijampolė market had operating areas and no scooter, and is left
out. Klaipėda is also found as Memel. The total stands near Kėdainiai
(55.3° N, 23.9° E), about the middle of the country.

## Slovakia

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Bratislava | 1,246 | 1,243 |
| Nitra | 151 | 151 |

Bolt's Trenčín market was empty, and no scooter market was found for
Trnava or Zvolen. The total stands east of Banská Bystrica (48.7° N,
19.5° E).

## Bulgaria

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Sofia | 925 | 904 |
| Varna | 145 | 142 |
| Burgas | 137 | 138 |

Varna and Burgas, on the Black Sea, were found later that day by asking
Bolt's map from every large town (see
[Finding the markets](bolt-app-map.md#finding-the-markets)); their second
read was early in the afternoon. Sofia is also found as София and Sofiya,
Varna as Варна and Burgas as Бургас and Bourgas. The total stands north of
Kazanlak (42.7° N, 25.3° E).

## Moldova

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Chișinău | 306 | 342 |

The second read found 36 more scooters than the first. One scooter stood
in no operating area, and one far area, empty, is left outside the
system's bounds. Chișinău is also found as Chisinau and
Kishinev. The country's search words leave out `md`, Maryland's code. The
total stands north-west of Chișinău (47.2° N, 28.5° E).

## Slovenia

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Ljubljana | 376 | 378 |

Bolt's own GBFS feed for Ljubljana, 359, answers 401. A relay at
`gbfs.derp.si` republishes it with login details Bolt issued to someone else,
which Bolt's GBFS licence forbids, so the map does not read it; the rider
map gives the same fleet. Kvik's scooters (Ljubljana, Koper, Piran–Portorož,
Izola) reach the same relay only by scraping Kvik's app, and are left out
too. Bolt's Koper and Maribor markets were empty. The
country's search words leave out `si`, a common word. The total stands east
of Ljubljana (46.1° N, 14.8° E).

## Ireland

| Town | Scooters | Read again |
| --- | ---: | ---: |
| Wexford | 39 | 39 |

Bolt's Wexford scheme began as a trial in 2024. Public funding for
scooter schemes was paused in July 2026, and no other Irish town has a
Bolt scooter market. The total stands in the Midlands, near Athlone
(53.4° N, 8° W).

## Known gaps

- Ride Mobility runs scooters in Estonia and Lithuania and publishes no
  feed; its ATOM ids 1 to 400 answer for Riga only.
- Dott runs in Slovakia, Bulgaria and Moldova with no public feed.
- A Bolt market that fills again needs its system added; one Bolt closes
  fails as "another market" or stays empty.
