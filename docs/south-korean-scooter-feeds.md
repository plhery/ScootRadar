# South Korean scooter feeds

South Korea is on the map since 24 October 2026, read from five operators'
app maps: Beam's authenticated rider map, and the signed-out maps of GCOO,
Kickgoing, which carries Xingxing's scooters too, Swing, which answers
only with its app's one-time code, and, since 25 October, Alpaca. The user
asked for GCOO's, Kickgoing's and Swing's that day, Swing's one-time code
included, and for Alpaca's the next. No operator publishes a GBFS feed, and
the government's TAGO API lists Sejong only and needs a key only Korean
residents and companies can get (see [the coverage gaps](coverage-gaps.md)).
The signed-out maps' routes, the apps' provenance and the first samples are
in [the app investigation](korean-app-maps.md); Beam's are in
[the Beam collector guide](beam-app-map.md).

GCOO's map also serves its American fleets: Los Angeles, Alexandria and
Arlington are in `data/american-scooter-feeds.json`, read the same way.
Memphis, with 10 scooters in four areas, is left out.

## Catalog

`data/south-korean-scooter-feeds.json` lists 256 systems in 121 towns: Swing
in 82, GCOO in 76, Xingxing in 32, Alpaca in 29, Kickgoing in 9 and Beam's 28
regions in 36 (see [Beam](#beam)). A town is a municipality:
Seoul, the six metropolitan cities, Sejong, and the cities and counties of the
provinces. Each has its usual romanized name and its official Korean name as
an alias, so a search finds 서울 as well as Seoul. Gyeonggi's Gwangju is
"Gwangju (Gyeonggi)", to tell it from the metropolitan city.

GCOO's, Swing's, Kickgoing's and Xingxing's systems come from one sweep of
each operator's whole service area, from
00:00 to 00:30 Korea time on 25 October (17:00 to 17:30 Paris on 24 October),
when most scooters stand idle:

- GCOO's, from its public service-area polygons,
  `https://region.gbike.io/kr/all_polygons.json.gz`;
- Swing's, from the scooter service areas of its geofence file;
- Kickgoing's and Xingxing's, from the map's signed-out area centres, read
  outward until no new scooter came back;
- Alpaca's, a day later, from 01:23 to 01:30 Korea time on 26 October (17:23
  to 17:30 Paris on 25 October), as its collector reads the country: every
  cell where the map's clusters said vehicles stood (see [Alpaca](#alpaca)).

Each scooter was placed in its municipality by its OpenStreetMap boundary. An
operator has a system in a town where the sweep found 30 scooters or more.
Its bounds are the envelope of those scooters, 1.5 km wider (Swing's 2 km),
within the municipality's own box widened by 300 m.

| Operator | Scooters | Towns | Biggest |
| --- | ---: | ---: | --- |
| Swing | 58,741 | 82 | Busan 3,620, Ulsan 3,172, Bucheon 2,689, Hwaseong 2,602 |
| GCOO | 57,338 | 76 | Daejeon 4,245, Incheon 4,080, Gwangju 3,665, Daegu 3,332 |
| Xingxing | 18,924 | 32 | Seoul 4,902, Ulsan 2,833, Hanam 1,276, Jeonju 1,233 |
| Kickgoing | 11,365 | 9 | Seoul 4,863, Busan 4,614, Anyang 720, Bucheon 543 |
| Alpaca | 7,908 | 29 | Cheongju 892, Ulsan 830, Yongin 734, Pyeongtaek 586 |

The biggest towns are Busan (10,386), Seoul (10,310), Ulsan (6,650), Daejeon
(6,397), Daegu (5,391), Jeonju (5,390) and Incheon (5,349), before Alpaca's
830 in Ulsan. Seoul has no GCOO
system and only 545 Swing scooters: both run mostly bikes there, Swing about
1,500 e-bikes around Gangnam station alone. Alpaca is in none of the
metropolitan cities but Ulsan: most of its towns are the capital area's outer
cities, Cheongju and smaller towns further south.

Every town has its municipal boundary in `data/town-outlines.json`, from
OpenStreetMap, as the towns of the capital area and around Busan touch and
their boxes overlap. A scooter counts under the town it stands in, and
GCOO's, Kickgoing's, Xingxing's and Swing's feeds drop the few standing in a
town where their operator has no system: GCOO's Suncheon feed one, in
Gwangyang, on 24 October, and Alpaca's feeds 12, in Gunpo, Uiwang and Suwon,
on 26 October. Nonsan, Pocheon, Gyeryong and Hamyang are Alpaca's alone; they
have their outlines too (relations 7580853, 2409178, 7580846 and 7833356). OpenStreetMap maps Gwangju inside 전남광주통합특별시
(relation 21039457) and has no relation for the city itself, so its outline
joins its five districts (relations 4162635, 7348583, 7348741, 7348758 and
7348759): `boundary()` in `scripts/boundaries.mjs` takes a list of `ids`.

## GCOO

`server/gcooApp.ts` reads
`GET https://live.api.gbike-api.com/api/v1/locations/markers` with `min_lat`,
`min_lng`, `max_lat`, `max_lng` and `cluster_number=100000`, with no
credential, as the app does signed out. The host's firewall turns away some
default user agents, so the client sends okhttp's.

A box about 6.4 km across comes back as single vehicles and clusters. The
collector reads a fixed grid of such tiles over a system's bounds; where a
tile returns clusters, it reads the sixteenths of the tile near them, about
1.6 km across, and halves those again, twice at most, while clusters remain.
A collection that still meets clusters, or that would take more than 600
requests, fails. The grid is fixed, so the systems of neighbouring towns ask
for the same boxes, and a box read in the last 50 seconds is shared.

The collector keeps idle, activated markers of the app's scooter models
(ES4, MAX, MAXPro, K, MAXPlus, K2, MAXPlusX, K3), with their battery in
percent and their range in kilometres. Bicycles, unknown model ids, parking
spots and charging stations are left out.

## Kickgoing and Xingxing

`server/kickgoingApp.ts` reads
`GET https://api.kickgoing.io/v4/kickscooters` with `lat`, `lng`, `zoom=15`,
`alliance=kickgoing`, `mobility=kickboard` and the app's version. At zoom 15
the map answers with every vehicle within 2.4 km of the point, with no cap,
and `map_radius` 1500; at zoom 14 and below, only with clusters. The
collector reads a fixed grid of cells 3.1 km tall and at most 3.36 km wide,
which fit inside that circle, and fails on another radius or on clusters, or
past 300 cells. Seoul is 90 cells. Kickgoing's and Xingxing's systems of a
town read the same cells, shared for 50 seconds.

Each keeps its own operator's standing kickboards, with their battery in
percent: Kickgoing's ids are numbers, Xingxing's hexadecimal. Bikes, and
TMAP's vehicles, are left out.

## Swing

`server/swingApp.ts` reads
`GET https://sfr.swingmobility.dev/map/marker/vehicles` with the app's
headers, among them `X-SW-APP-TS` and `X-SW-OS-FSAN`, an RFC 6238 one-time
code (HMAC-SHA512, 30-second step, six digits) keyed with a constant compiled
into the app. The key enters only through the cache's runtime secret
`SWING_TOTP_SECRET` (see `DEPLOY.md`), never the repository, which is public.
Without it Swing's feeds fail with "Swing one-time code secret is missing or
invalid".

The server reads a box four times as tall and as wide as the one asked for,
and says which box it read in `meta.calcBounds`. The collector asks for the
quarter of a system's bounds around their centre, so one request reads the
whole town; where the server read less, it reads the quarters again, down to
sixteenths, and fails if a box is still not read whole. `VEHICLE=SCOOTER`
with `selectedOnly=true` returns scooters only, and the collector still keeps
only `type` `SCOOTER`. Requests start at least a second apart, and as long
after one another as the server's `meta.throttleMs` asks, up to a minute.

A vehicle's id is its device's IMEI. The collector neither stores nor shows
it: a scooter's id is the first 16 characters of an HMAC-SHA256 of the IMEI,
keyed with the private key. Swing gives a battery band (`FULL`, `HIGH`,
`MIDDLE`, `LOW`), not a level, so the battery stays unknown.

## Alpaca

`server/alpacaApp.ts` reads the GraphQL map of Alpaca (알파카, of MaaS Asia),
`POST https://alpaca.maasasia.com/graphql`, with an empty `Authorization`
header, as its app (`com.trianglewide.sbike`, App Store id 1328860619) asks
before anyone signs in. It needs two of the app's queries:

- `ridableVehicleClusters(size: 0.003)` answers for the whole country at
  once, with a point in each square of a grid of 0.003 degrees, rounded from
  0, where a ridable vehicle stands: 3,111 points, 253 kB, at 01:23 Korea
  time on 26 October 2026. Of the 9,798 vehicles the sweep then found, all but
  two stood in such a square or within 0.0005 degrees of one: a few metres of
  GPS drift, or an edge the server rounds to even. The other two, 190 and 210 m
  from a cluster, were first seen two to four minutes later, in cells read
  for their neighbours.
- `ridableVehicles(center)` answers with every ridable vehicle within 0.017
  degrees of a point, latitude and longitude counted alike: about 1.89 km
  north and south, and 1.39 to 1.56 km east and west in Korea, not a circle
  in kilometres. A vehicle 0.01699 degrees away came back, none 0.01701 or
  more, and in the sweep none from farther than 0.016999. No reply was cut
  short: up to 393 vehicles came back in one.

A collection reads the clusters, then the centre of every cell of a fixed
grid of 0.023 degrees that meets a cluster's square within the system's
bounds, the square widened by 0.0005 degrees, and both squares where the
point is that near an edge. A cell's corners are 0.01626 degrees from its
centre, inside the reach. It fails on an empty cluster list, on a vehicle
beyond the reach, or past 200 cells; the whole of Hwaseong's bounds is 154. The
clusters, and a point read in the last 50 seconds, are shared between towns.

The collector keeps the kickboards (`KICKBOARD`, 7,920 that night, all the
NAMKYUNG_V2 model but five V1s), with their battery in percent, 31 to 100.
E-bikes (`E_BIKE`, 1,878) are left out: most of the fleet in the
Gunpo–Uiwang area, and a third or more in Pyeongtaek, Ansan, Anseong,
Pocheon, Dongducheon, Guri and Yangju. A scooter's id is Alpaca's, a number.
The app's service areas, 58 groups of polygons about 793 km² in all, one of
them a test area in Seoul and Sejong, are not read: the clusters are where
the vehicles are. Hapcheon's and Goryeong's areas had no vehicle that night,
and Gunpo–Uiwang's 9 kickboards, so they have no system.

Two reads of the same point in central Ulsan, 2 minutes 18 seconds apart at
01:05 Korea time on 26 October, came back with 162 vehicles, then 160: two gone, none new,
none moved more than 20 m, one battery changed. In the sweep, the 42 vehicles
read twice at different positions had moved 2 m (median), 13 m at most.
Neither the map nor the app gives a position's time.

The map links no scooter. Its QR codes hold
`https://alpaca.kr/qrcode/?c=<serial>`, a link the app does not claim: on
Android it claims only `alpaca://open` and `sbike://open`, and alpaca.kr has
no `apple-app-site-association` or `assetlinks.json`. So, as for Spin, a
phone's "Open in Alpaca" opens `https://alpaca.kr/`, whose page links both
stores, and the iPhone app opens Alpaca's App Store page (`app` in
`data/providers.json`).

## Beam

Verified 24 October 2026 through Beam's authenticated rider map in the
unmodified official Android app. The user completed Google sign-in; map
reads and session renewal also succeeded from Netcup's Node cache runtime.
The reviewed catalog contains 28 collection regions and 37,991 standing
scooters in the initial samples. These are observations, not expected totals.

[The Beam collector guide](beam-app-map.md) records app provenance, the
GraphQL route, H3 coverage, credential handling and live verification. Each
Beam entry binds the app's numeric city id to reviewed bounds and a local
time zone; `server/beamApp.ts` keeps only the scooters Beam assigns to that
city, inside those bounds, whatever town they stand in.

Beam's regions are franchises, some across several municipalities, and the
catalog names each after the towns it stands in, so that its scooters count
under the same towns as the other operators'. Its app name stays an alias,
or the entry's name where it has a service area per town. The towns were
read from the regions' envelopes (their operating areas where reviewed)
against the municipal outlines: a town holding a twentieth of a region or
more, or named by it, is one of its towns.

| Beam region | Beam city id | Observed scooters | Towns |
| --- | ---: | ---: | --- |
| Ansan | 2826 | 1028 | Ansan |
| Bucheon/Bupyeong | 2292 | 361 | Bucheon |
| Changwon | 2178 | 321 | Changwon |
| Cheongju | 552 | 3455 | Cheongju |
| Daegu | 356 | 6785 | Daegu, Gyeongsan |
| Daejeon | 553 | 761 | Daejeon |
| Dongducheon | 2019 | 303 | Dongducheon, Yangju |
| Dongtan | 5123 | 18 | Hwaseong, Osan |
| Geumsan | 3026 | 144 | Geumsan |
| Gimcheon | 1592 | 69 | Gimcheon |
| Gimhae | 2251 | 616 | Gimhae, Busan |
| Gimpo | 1727 | 1724 | Gimpo |
| Goyang-Paju | 612 | 2663 | Goyang, Paju |
| Gwangju | 650 | 3784 | Gwangju |
| Gwangyang | 618 | 224 | Gwangyang |
| Gyeonggi 1 | 2715 | 722 | Chungju, Eumseong, Jincheon |
| Hanam | 2427 | 1073 | Hanam |
| Iksan | 1780 | 892 | Iksan |
| Incheon | 416 | 1869 | Incheon |
| Jinhae | 3920 | 34 | Changwon, Busan |
| Masan | 1762 | 247 | Changwon |
| Namyangju | 1758 | 1254 | Namyangju, Guri |
| Pyeongtaek | 4607 | 706 | Pyeongtaek |
| Seongnam-Suwon | 341 | 2729 | Yongin, Suwon, Seongnam |
| Seoul | 121 | 4999 | Seoul |
| Wirye | 6453 | 971 | Hanam, Seoul, Seongnam |
| Yecheon | 6398 | 55 | Yecheon, Andong |
| Yeoju | 5294 | 184 | Yeoju |

Bucheon/Bupyeong's Incheon part, and the parts of other regions in towns
that are Beam's through another region, as Hwaseong in Ansan's envelope, need
no service area of their own: their scooters count under the town they stand
in all the same. "Gyeonggi 1" is in North Chungcheong: Chungju, Geumwang in
Eumseong and the Innovation City of Jincheon and Eumseong. "Yecheon" is the
provincial government's new town, across Yecheon and Andong. Gwangyang,
Yeoju and Yecheon are Beam's alone; they have their outlines too.

Only standing scooters belonging to the reviewed city and envelope are
published, with stable ids, coordinates and percentage charge. E-bikes,
seated scooters and unclassified vehicles are excluded. Every H3 batch must
succeed before a new snapshot replaces the previous one. No price, range,
vehicle rental link, parking guidance or zone is inferred.

Two regions use reviewed disjoint operating envelopes; the others use
complete rectangular envelopes. Every region uses Asia/Seoul. Address display
follows [Korea Post's examples](https://www.koreapost.go.kr/kpost/subIndex/262.do),
keeping road numbers after Hangul street names and before Roman ones.

## Load

The cache collects each Kickgoing, Xingxing and Swing town every 20 minutes,
each GCOO and Alpaca town every two hours (`GCOO_IDLE_INTERVAL_MS`,
`APP_MAP_IDLE_INTERVAL_MS`), and any town every minute while someone looks at
it. A round of every town takes about:

- GCOO: 3,300 requests in Korea, over 636 tiles and their parts, and about
  250 in the US, starting at least 250 ms apart. A town waits for each reply
  before its next request, so the first round, on the host's two slots, took
  about 35 minutes on 24 October 2026;
- Kickgoing and Xingxing: 1,072 cells, 747 of them different, starting at
  least 300 ms apart, about 5 minutes;
- Swing: 82 requests, a few more where a box is split;
- Alpaca: 456 cells for the 29 towns, 383 different, and a read of the
  country's clusters for each town that finds none from the last 50
  seconds, starting at least 500 ms apart. The server answered in 0.3 s at
  night (0.34 s at the 95th percentile), in 1.2 to 2.3 s that evening, so a
  round takes 4 to 8 minutes. Ulsan, the biggest, is 47 cells.

Each client spaces the requests of all its towns, so the scheduler runs their
collections on two slots of their host and none of its six shared ones (see
`DEPLOY.md`): the first rounds, on the shared slots, held back every other
feed for over half an hour.

Korea's feeds held 186,528 scooters at 00:54 Korea time on 25 October, more
than the 146,000 or so different ones, as the feeds of neighbouring towns each
hold the scooters where their bounds overlap; the map shows and counts each
once. That is about 120 MB of heap at about 630 bytes each; see the memory
limits in `DEPLOY.md`. Alpaca's 29 feeds would have held 9,347 from its
sweep of 26 October, 7,908 different, about 6 MB. A 429 from any of the four stops its requests for the
time its `Retry-After` asks, a minute at least and an hour at most. Beam's
reads and their pace are in [the Beam collector guide](beam-app-map.md).

## Terms and credits

None of the five publishes a licence or terms for this data. The map's
credits name the source for each country, "Beam authenticated rider map",
"GCOO anonymous app map", "Kickgoing anonymous app map, Xingxing's scooters
included", "Swing anonymous app map" and "Alpaca anonymous app map", and link
to ridebeam.com, gcoo.io, kickgoing.io and alpaca.kr. Swing's site,
swingmobility.com, did not answer from here, so it has no link.

Alpaca's [rider terms](https://alpaca.kr/terms/html/term_01.html)
(회원이용약관), of 주식회사 알파모빌리티 (Alpha Mobility, in Ansan), in force
since 14 May 2026, forbid members, in article 27(2), to copy, transmit,
publish, distribute or broadcast for profit what they obtain through the
service, or let others do so, without the company's prior consent.
ScootRadar reads the map signed out, as no member, and charges nothing; the
clause is the user's to weigh. Alpaca's contact is help@maasasia.com.

## Recheck

```sh
SWING_TOTP_SECRET=… node scripts/check-french-feeds.mjs --countries=KR
```

checks every Korean system live; Beam's need the cache's rider session (see
[the Beam collector guide](beam-app-map.md)). From 00:39 to 00:54 Korea time
on 25 October all 199 of GCOO's, Kickgoing's, Xingxing's and Swing's
answered, none with fewer than 30 scooters (Xingxing in
Seongju). From 01:39 to 01:43 Korea time on 26 October all 29 of Alpaca's
answered, collected one after another by its collector: 413 requests in 3
minutes 29 seconds, 9,340 scooters in the feeds, none fewer than 30 (Icheon
34). To review the catalog, sweep the service areas again as above,
place the scooters by municipality, and compare with the table above. For
Alpaca, its systems' collections read the whole country, every cell its
clusters point to once, and the table above is their scooters by town.

## Known gaps

- **Deer** is inside Swing: Swing bought Deer's business in July 2024
  ([Unicorn Factory](https://www.unicornfactory.co.kr/article/2024071916025018991)),
  Deer's app (`co.deering.deer` 4.6.8) talks to Swing's server, and Swing's
  map gives Deer's scooters `vendor: "DEER"` (model S9). Swing's systems
  hold them: about 13,123 in 39 of its 82 towns on 25 October, Cheongju's
  2,585 (all of Swing's there), Gyeongsan's 2,143, Daegu's 1,633, Paju's
  1,568 and Goyang's 1,231. They are shown as Swing's.
- **DART** (`kr.co.dartapp` 2.3.0) opens its map only after a phone number
  and SMS sign-in. `POST https://app.dartsharing.com:8443/app/vehicle/main_v2`
  answers with user_no 0 and an empty token, but the app never asks it
  signed out, so it is not read until the user decides. Its fleet was about
  1,431: Yeosu 473, Incheon 383, Siheung 192, Gimhae 147, Osan 107, Gimpo 98,
  Anseong 26 and Pyeongtaek 5.
- **Alpaca's e-bikes, and its empty areas:** see [Alpaca](#alpaca).
- **Zones:** GCOO's polygons and Swing's geofence file hold service areas
  and no-parking zones, but they are not published on the map yet.
- **Swing in Japan** (`qr.jp.swingmobility.dev`) and **Kickgoing on
  Yakushima**: not checked.
- **Freshness:** none of the signed-out maps gives a position's time, so a
  snapshot's time is when its first request was made.
