# South Korea scooter feeds

Verified 24 October 2026 through Beam's authenticated rider map in the
unmodified official Android app. The user completed Google sign-in; map
reads and session renewal also succeeded from Netcup's Node cache runtime.
The reviewed catalog contains 28 collection regions and 37,991 standing
scooters in the initial samples. These are observations, not expected totals.

[The Beam collector guide](beam-app-map.md) records app provenance, the
GraphQL route, H3 coverage, credential handling and live verification. Each
entry in [the catalog](../data/south-korean-scooter-feeds.json) binds the
app's numeric city id to reviewed bounds and a local time zone. Some regions
combine towns or campuses; their app names are retained.

| Collection region | Beam city id | Observed scooters |
| --- | ---: | ---: |
| Ansan | 2826 | 1028 |
| Bucheon/Bupyeong | 2292 | 361 |
| Changwon | 2178 | 321 |
| Cheongju | 552 | 3455 |
| Daegu | 356 | 6785 |
| Daejeon | 553 | 761 |
| Dongducheon | 2019 | 303 |
| Dongtan | 5123 | 18 |
| Geumsan | 3026 | 144 |
| Gimcheon | 1592 | 69 |
| Gimhae | 2251 | 616 |
| Gimpo | 1727 | 1724 |
| Goyang-Paju | 612 | 2663 |
| Gwangju | 650 | 3784 |
| Gwangyang | 618 | 224 |
| Gyeonggi 1 | 2715 | 722 |
| Hanam | 2427 | 1073 |
| Iksan | 1780 | 892 |
| Incheon | 416 | 1869 |
| Jinhae | 3920 | 34 |
| Masan | 1762 | 247 |
| Namyangju | 1758 | 1254 |
| Pyeongtaek | 4607 | 706 |
| Seongnam-Suwon | 341 | 2729 |
| Seoul | 121 | 4999 |
| Wirye | 6453 | 971 |
| Yecheon | 6398 | 55 |
| Yeoju | 5294 | 184 |

Only standing scooters belonging to the reviewed city and envelope are
published, with stable ids, coordinates and percentage charge. E-bikes,
seated scooters and unclassified vehicles are excluded. Every H3 batch must
succeed before a new snapshot replaces the previous one. No price, range,
vehicle rental link, parking guidance or zone is inferred.

Two regions use reviewed disjoint operating envelopes; the others use
complete rectangular envelopes. Every region uses Asia/Seoul. Korean aliases
are recorded where reviewed. Address display follows [Korea Post's examples](https://www.koreapost.go.kr/kpost/subIndex/262.do),
keeping road numbers after Hangul street names and before Roman ones.
