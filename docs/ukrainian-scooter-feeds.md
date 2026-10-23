# Ukrainian scooter feeds

Verified 13 and 14 October 2026. Ukraine's only usable feed is 3electra's, in
Kyiv. The
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
lists it, as 3electra in Kyiv, and no other Ukrainian system. It is system 66
on ATOM Mobility's `zelectra.rideatom.com`: the brand writes 3electra, and
its host and links zelectra, after the company, ТОВ «ЗЕЛЕКТРА». Systems 65,
67 and 68 on the same host answer 400. It was polled 22 times four minutes
apart from 19:26 to 20:50 on Tuesday 13 October, Kyiv time, and 8 times five
minutes apart from 13:25 to 14:00 on Wednesday 14 October. Every feed URL is
https, on the discovery's origin and under its directory. No account
credentials or private rider APIs are used.

| Operator | City | Available scooters in Kyiv | Polled |
| --- | --- | ---: | --- |
| 3electra | Kyiv | 698 to 718 | 19:26 to 20:38 on 13 October |
| 3electra | Kyiv | 541 to 592 | 13:25 to 14:00 on 14 October |

On the evening of 13 October, 53 rides showed as a scooter leaving the feed
and coming back 0.2 to 3.2 km away under a new id, 47 of them with less range.
At midday on 14 October, 10 more were traced by the code printed on each
scooter, of 0.4 to 1.9 km, all under a new id, 9 of them with 0.25 to 9.75 km
less range. The bounds, discovery URL and aliases are in
[`ukrainian-scooter-feeds.json`](../data/ukrainian-scooter-feeds.json).

## Scooters in Lima

The feed lists about 800 vehicles, every one marked available, but not all of
them in Kyiv. Some stand in Lima, Peru, around 12.03° S 77.05° W, inside four
zones the geofencing draws there and opens to every vehicle type: 80 to 99 on
the evening of 13 October, 214 to 256 at midday on 14 October. One stood once
in the Galápagos, at 0.93° N 90.48° W, at 13:25 on 14 October.

They are not scooters in Peru:

- **They hop.** Between two polls a scooter in Lima moves about 1.7 km
  (median 1,719 m, at most 2,084 m), with the same id and, in 665 of 671
  moves, the same range.
- **They come back where they were.** Three that went to Lima on 13 October
  came back to Kyiv 5 to 17 m from where they had left. At midday on 14
  October, 3 to 8 came back every five minutes, each with the id it had in
  Lima, spread across the city beside other scooters, with 3 to 22.5 km of
  range: scooters shown again where they stood, not a van's load at a depot.
- **They leave together.** At 20:42 on 13 October scooters went to Lima by
  the hundred: Kyiv held 715 at 20:38, 656 at 20:42, 515 at 20:46 and 429 at
  20:50. 286 moved to Lima in those three polls, against 17 in the 18 polls
  before. The night before, 714 stood in Lima at 00:40, and most were back in
  Kyiv by 02:10.

So Lima is a mask over scooters 3electra doesn't show, which ATOM's export
places there instead of leaving out. 3electra publishes no hours. Its terms
offer rental every day, 24 hours a day, which "may be limited ... in
particular to keep the curfew" ("може підлягати обмеженням ... зокрема, з
метою дотримання комендантської години",
[Умови використання](https://3electra.com.ua/umovi-vikoristannya/), § 3.5).
Its rules say vehicles are unavailable in bad weather, heavy rain or gusty
wind, or at hours when vehicles are unavailable, and that the app then says so
([Правила](https://3electra.com.ua/rules/)). At 20:00 and 21:00 on 13 October
Kyiv had no rain and gusts of about 16 km/h (Open-Meteo), after light rain in
the late afternoon, so the weather doesn't explain that drop; the reason isn't
published.

The scooter cache collects Kyiv within its bounds, so no position in Lima or
the Galápagos reaches a snapshot, and the city overview, Ukraine's total, feed
health and metrics only ever count scooters in Kyiv. Since 23 October 2026, by
the user's choice, a scooter the feed puts more than 1,000 km from Kyiv keeps
its last place in Kyiv for ten minutes after its last collection there, then
is dropped (`server/strayHold.ts`). A short hop to Lima no longer moves Kyiv's
count; a longer stay, as the 714 in Lima at 00:40 one night, most of them
back by 02:10, still lowers it after ten minutes, as riders see in 3electra's
app. The cache holds only a scooter it had in Kyiv, by the id it keeps in
Lima, so it applies to any regional feed that does the same. Unit tests cover
the scooter in Lima, the one in the Galápagos, the moped and the hold.

## Town name

The map names the city Kyiv, as the feed does, and search also finds it as
Kiev, Kyjiw, Kiew, Київ and Киев. Cyrillic is matched without its marks, so
Київ is also found typed as Киів.

| City | Also found as |
| --- | --- |
| Kyiv | Kiev, Kyjiw, Kiew, Київ, Киев |

Zoomed out, Ukraine's total stands inland near Zvenyhorodka (49.0° N,
31.0° E), a little north of the country's geographic centre, on Kyiv's side,
where all its scooters are. It stands 143 points from Poland's total and 134
from Hungary's at zoom 4, and 72 and 67 at zoom 3.

## Data handling

- **Bounds:** 3electra's geofencing has 304 zones. Outside them no ride may
  start or end. In Kyiv, 137 let a scooter start and end a ride: 48 for
  scooters only, none in Obolon or on the left bank, 12 shared with the
  mopeds or the e-bike, and 77 open to every vehicle type, some in Obolon and
  on the left bank. Four more are in Lima. So the bounds
  are the extent of the 137, from 50.3798° to 50.5232° N and from 30.4114° to
  30.6552° E, plus 0.005° of latitude and 0.0078° of longitude, about 550 m on
  every side. Every scooter the feed placed in Kyiv in the 30 polls stood
  inside them, between 50.3824° and 50.4767° N and 30.4579° and 30.6272° E,
  the farthest 7.9 km from the median. One, on the evening of 13 October,
  stood on the left bank at 50.460° N 30.627° E; none stood in Obolon.
- **Freshness:** ATOM stamps each response with the time it was asked for
  (`ttl` 0) and gives no `last_reported`, so the age limit can't tell how old
  its positions are; the rides above show the feed is live.
- **Vehicle types:** two electric standing scooters, `1073` and `97`, with
  25 km of range, which the map shows; four electric mopeds, an e-bike and a
  car, which it doesn't. The polls listed scooters of type `1073` and a few
  mopeds of type `96`. No vehicle of the polls was reserved or disabled.
- **Prices:** from the pricing feed, in hryvnias: both scooter plans, `1073`
  (Acton) and `97` (e-Scooter), at UAH 12 to start and UAH 5.60 a minute.
  The hryvnia has kopiyky, so prices keep two decimals: "UAH 12.00 to unlock,
  then UAH 5.60 a minute". Unit tests cover it on the web and on iPhone.
- **Battery:** the feed gives range only (`current_range_meters`, 2.75 to
  22.5 km), so the scooters show their range and no battery level.
- **Rental links:** each scooter links to its own `zelectra.app.link`
  address, which opens it in 3electra's app. The link ends in the code printed
  on the scooter, such as Z3106, not a hardware id, so the app keeps it.
- **IDs:** ATOM gives a scooter a new `vehicle_id` after each ride, and now
  and then while it stands still. The code at the end of the rental link
  stayed the same through every ride and every stay in Lima, so rides were
  traced by it: a Z and four digits on each scooter, an N on the mopeds.
- **Parking:** 3electra publishes no stations, so the map shows none. Its
  zones, which its app shows, are where rides may end.
- **Time zone:** the feed gives `Europe/Kiev` and opening hours `24/7`.
  Neither the app nor the scooter cache reads `system_information`.
- **Load:** the scooter cache asks for Kyiv's `vehicle_status` every 20
  minutes, or every minute for 10 minutes after someone looks at the city, and
  its discovery, vehicle types, prices, stations and geofencing once an hour.
  So Kyiv adds about 8 requests an hour to `zelectra.rideatom.com`, and at
  most about 65 while it is watched; the cache paces every ATOM host to two
  requests a second.

## Night bans

Kyiv is under a martial-law curfew from 01:00 to 05:00, since 10 September
2026, by order no. 1 of the Kyiv City Military Administration of 8 September
2026 ("Наказ Київської міської військової адміністрації від 08.09.2026 № 1
«Про запровадження комендантської години на території міста Києва»"). The
city's page says that in those hours it is forbidden "to be in the street and
in public places, and to travel by transport without a special pass, or on
foot" ("перебувати на вулиці та у
громадських місцях; переміщатися транспортом без спецперепустки або пішки"),
except to reach a shelter during an air-raid alert
([Kyiv city portal](https://kyivcity.gov.ua/bezpeka_ta_pravoporiadok/komendantska_godina_v_kiyevi_trivaye_iz_2300_do_0500/);
its address still says 23:00 to 05:00, the hours of an earlier curfew). The
portal answers 403 to scripts, so it was read in the Internet Archive's copy of
11 September 2026, and the press reported the change
([The Page](https://thepage.ua/ua/news/komendantska-godina-u-kiyevi-zminitsya-z-10-veresnya)).

No scooter may be ridden then, and 3electra's terms limit renting to keep the
curfew, yet its feed listed most of its scooters in Kyiv at 02:10 on 13
October. So [`rental-curfews.json`](../data/rental-curfews.json) has a Kyiv
entry, every night from 01:00 to 05:00 Kyiv time, and the dock and the card
say no scooter can be rented until 05:00.

Its area is Kyiv's boundary in OpenStreetMap (relation 421866), read through
Nominatim and simplified to within 100 m. Ukraine's official boundaries, from
the State Scientific Production Enterprise Kartographia, are on
[HDX](https://data.humdata.org/dataset/cod-ab-ukr) under CC BY-IGO, but only
as zip archives. OpenStreetMap is credited as the ODbL asks, and the
simplified boundary stays under the ODbL. The boundary's two holes, enclaves
of Kyiv Oblast to the west and north-east, are left in; no scooter stands
near them.

## Licences

- **3electra:** its feed gives no `license_url`, so it publishes no data
  licence.
- **OpenStreetMap:** the curfew's boundary, © OpenStreetMap contributors,
  under the [ODbL](https://opendatacommons.org/licenses/odbl/).
- The map's credits name 3electra under the GBFS line and the boundary as
  "UA: OpenStreetMap boundaries · ODbL".

## Known gaps

- **Lima:** what 3electra's hidden scooters are, and when it hides them, is
  not published. Only 3electra can say; nobody has asked it.
- **E-wings and Bolt** run scooters in Kyiv with no public feed. Bolt's only
  public scooter feeds in Europe are Brussels and Liverpool.
- **3electra's other systems:** 65, 67 and 68 on `zelectra.rideatom.com`
  answer 400. Its terms limit rides to districts of Kyiv.
- **Mopeds and e-bikes:** 3electra's mopeds and e-bike are in the same feed;
  the map shows standing scooters only.

## Search

Ukraine is found in the app's nine languages and as Україна, Украина,
Ukraina, Ukrajina and Ukrayina, typed beside a city. Kyiv is also found as
Kiev, Kyjiw, Kiew, Київ and Киев.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=UA --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
