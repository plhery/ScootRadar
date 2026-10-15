# American scooter feeds

Verified 14 October 2026. The United States' feeds come from
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and from the addresses the operators use for their other towns: Bird
(`mds.bird.co`), Lime (`data.lime.bike`), Spin, Veo
(`cluster-prod.veoride.com`), Lyft (`gbfs.lyft.com`) and Bolt
(`mds.bolt.eu`). 215 systems were surveyed. Every feed URL is https, on the
discovery's origin and under its directory. No account credentials or private
rider APIs are used. The catalog is
[`american-scooter-feeds.json`](../data/american-scooter-feeds.json); what is
left out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

The map covers 37 towns in 22 states and the District: Washington, DC (Hopp
and Veo), 24 towns of Bird's and 17 of Lime's. In Tempe, Atlanta, Arlington
(VA), the Bronx and Queens, both Bird and Lime run, and the map counts their
scooters as one town's.

Each town is named with its state, "Washington, DC", as the United States has
many towns of one name. Zoomed out, the map shows a total per state, at the
state's centre of population (US Census Bureau, 2020).

## Washington, DC

| Operator | Feed | Available scooters in Washington | Polled |
| --- | --- | ---: | --- |
| Hopp (Bolt) | `mds.bolt.eu/gbfs/3/23` | 1,366 to 1,379 | 16:34 to 16:54 EDT, 14 October |
| Veo | `veoride.com/…/xdc` | 265 to 269 | 16:34 to 16:54 EDT, 14 October |

Both were also polled six times from 11:27 to 12:09 and three times from 16:13
to 16:23 that day, in the survey. Between 16:34 and 16:54, 195 Hopp scooters
left the feed and 190 came back under new ids: Bolt gives a scooter a new id
after each ride. Veo keeps its ids, and 56 of its scooters moved more than
300 m between two polls, up to 1.8 km.

**Hopp is Bolt.** In Washington, Bolt rents its scooters under the name Hopp:
its feed's links open `bolt-hopp://`, the app `ee.hopp.client`, and its site,
gethopp.com, is "© 2026 Hopp by Bolt Services US Inc". Riders see Hopp on the
scooters and in the app they open, so the map names them Hopp, in Hopp's
green, as their own provider, `bolt_hopp`. It is not the Icelandic Hopp the
map shows in Europe, a different company whose links (`app.hopp.bike`) open
another app; neither takes the other's links, nor Bolt's European app
(`bolt://`). The two never share a town, and the provider filter lists only
the providers in view, so the map never offers two "Hopp" side by side. The
feed's system id, "BoltEU_Washington DC", has a space; the app reads its
own ids, `bolt_hopp_us_washington`, never the feed's.

Hopp's feed gives every scooter one of two plans, both $1 to unlock and $0.16
a minute, untaxed ("Unlock 1.00 USD, 0.16 USD/MIN."). That is the price the
map shows; riders in the app may see a city or promotional price.

**Bounds.** Bolt publishes its zones: the "Main allowed area", 164.6 km², is
the District. Washington's bounds are that area's box, 38.795° N to
38.996° N and 77.119° W to 76.909° W, plus about 1 km, and they hold Veo's
scooters too. Left out, in the last poll:

- Hopp: one scooter, disabled, at 38.881° N 76.860° W in Landover, Maryland,
  4 km east of the District, which the map would not show anyway.
- Veo: one at 39.030° N 77.105° W, in North Bethesda, Maryland, which moved
  less than a metre in 20 minutes. One at 22.79° N 113.93° E, in Shenzhen,
  where Veo's test system (`xds`) has its scooters.

Veo's feed also has 7 to 9 scooters in Virginia, inside Washington's box and
counted with it: 7 stand within 30 m of one another at 38.808° N 77.097° W, by
Eisenhower Avenue in Alexandria, as at a depot. Too few, and too still, for an
Alexandria area of their own. Veo's `arl` feed is the same fleet as `xdc`, so
it is left out.

Search finds the city as Washington, Washington DC, Washington, D.C., DC, D.C.
and District of Columbia.

## Bird and Lime

Polled every five minutes, 59 times, from 16:34 to 21:24 EDT on 14 October
2026 (13:34 to 18:24 in Seattle), after the survey's polls that afternoon.
One poll of Lime Seattle timed out. Bird gives a scooter a new id at every
request and Lime after each ride, so rides are counted by place: a scooter
*left* when no scooter of the next poll stood within 100 m of it, and one
*arrived* when none of the poll before did. Bird's `last_reported` is the time
of the request, so it tells nothing.

| Operator | Town | Available scooters | Left / arrived | Bounds |
| --- | --- | ---: | ---: | --- |
| Bird | Tempe, AZ | 694 to 713 | 48 / 44 | scooters + 1 km |
| Bird | Culver City, CA | 232 to 256 | 38 / 31 | zone in town + 1 km |
| Bird | Los Angeles, CA | 6,425 to 6,502 | 392 / 424 | zones + 1 km |
| Bird | Santa Monica, CA | 439 to 457 | 70 / 59 | zone in town + 1 km |
| Bird | Gainesville, FL | 142 to 155 | 44 / 47 | zone + 1 km |
| Bird | Atlanta, GA | 2,145 to 2,193 | 302 / 325 | zone + 1 km |
| Bird | Indianapolis, IN | 607 to 637 | 44 / 46 | zone + 1 km |
| Bird | Lexington, KY | 183 to 193 | 19 / 26 | zones + 1 km |
| Bird | Kansas City, MO | 606 to 631 | 44 / 41 | zones + 1 km |
| Bird | St. Louis, MO | 168 to 175 | 28 / 30 | zone + 1 km |
| Bird | Greensboro, NC | 84 to 93 | 9 / 6 | zone + 1 km |
| Bird | Newark, NJ | 708 to 733 | 48 / 71 | zone + 1 km |
| Bird | Reno, NV | 569 to 623 | 39 / 43 | zone + 1 km |
| Bird | Bronx, NY | 843 to 860 | 69 / 79 | zones + 1 km |
| Bird | Queens, NY | 249 to 264 | 24 / 26 | zone + 1 km |
| Bird | Cleveland, OH | 325 to 332 | 29 / 32 | zones + 1 km |
| Bird | Memphis, TN | 326 to 337 | 32 / 39 | zone + 1 km |
| Bird | Nashville, TN | 360 to 373 | 38 / 40 | zone + 1 km |
| Bird | Dallas, TX | 179 to 196 | 9 / 21 | zone + 1 km |
| Bird | San Antonio, TX | 807 to 829 | 38 / 48 | zones + 1 km |
| Bird | Arlington, VA | 263 to 273 | 33 / 43 | zone + 1 km |
| Bird | Fairfax, VA | 91 to 100 | 11 / 16 | zone + 1 km |
| Bird | Richmond, VA | 195 to 215 | 80 / 78 | zone + 1 km |
| Bird | Eau Claire, WI | 207 to 217 | 16 / 14 | zone + 1 km |
| Lime | Tempe, AZ | 730 to 773 | 68 / 87 | scooters + 1 km |
| Lime | Oakland, CA | 300 to 330 | 246 / 283 | scooters + 1 km |
| Lime | San Francisco, CA | 2,840 to 3,160 | 1,448 / 1,673 | scooters + 1 km |
| Lime | San Jose, CA | 983 to 1,008 | 276 / 319 | scooters + 1 km |
| Lime | Colorado Springs, CO | 670 to 688 | 153 / 152 | scooters + 1 km |
| Lime | Atlanta, GA | 1,949 to 2,061 | 1,367 / 1,439 | scooters + 1 km |
| Lime | Chicago, IL | 10,831 to 11,110 | 4,048 / 4,342 | scooters + 1 km |
| Lime | Louisville, KY | 504 to 561 | 360 / 376 | scooters + 1 km |
| Lime | Baltimore, MD | 1,914 to 1,985 | 1,248 / 1,356 | scooters + 1 km |
| Lime | Detroit, MI | 1,818 to 1,887 | 602 / 640 | scooters + 1 km |
| Lime | Durham, NC | 245 to 256 | 75 / 72 | scooters + 1 km |
| Lime | Lincoln, NE | 184 to 192 | 40 / 42 | scooters + 1 km |
| Lime | Bronx, NY | 3,081 to 3,261 | 481 / 577 | scooters + 1 km |
| Lime | Queens, NY | 1,874 to 1,986 | 469 / 597 | scooters + 1 km |
| Lime | Arlington, VA | 411 to 460 | 449 / 460 | scooters + 1 km |
| Lime | Norfolk, VA | 2,748 to 2,785 | 367 / 372 | scooters + 1 km |
| Lime | Seattle, WA | 9,093 to 9,512 | 1,259 / 1,430 | scooters + 1 km |

Bird's feeds are at `mds.bird.co/gbfs/v2/public/<town>/gbfs.json`, GBFS 2.3;
Lime's at `data.lime.bike/api/partners/v2/gbfs/<town>/gbfs.json`, GBFS 2.2.
Neither publishes a price, so none is shown. Bird gives each scooter's charge,
Lime only its range.

**Towns.** Each scooter of six polls, 17:09 to 17:34 EDT, was placed in its
town by the US Census Bureau's 2024 boundaries of places (cities, towns and census-
designated places), or, outside any, of counties
([cartographic boundary files](https://www.census.gov/geographies/mapping-files/time-series/geo/cartographic-boundary.html)).

**Bounds.** Bird publishes its zones (`geofencing_zones`). A town's bounds are
the box of the zones where a ride may end that hold its scooters, plus 1 km.
Three feeds are different:

- Bird's Culver City and Santa Monica feeds share one zone of 483 km², the
  whole of west Los Angeles, with Bird Los Angeles. Their bounds are the part
  of their zones in their town, plus 1 km: 33.9689–34.0430 N, 118.4584–118.3606 W for
  Culver City, and 33.9876–34.0597 N, 118.5266–118.4328 W for Santa Monica.
- Bird Tempe's zones are in Chandler and Mesa, where none of its scooters
  stand. In Tempe it publishes only zones where riding is forbidden. Its
  bounds are its scooters' box plus 1 km, as for Lime.
- Lime publishes no zones. Its bounds are the box of its scooters in the town
  over those six polls, plus 1 km. The evening's polls found only the strays
  below outside them.

**New York.** Bird's and Lime's New York feeds each run in two boroughs, the
Bronx and Queens, which the map shows as two towns, "Bronx, NY" and "Queens,
NY". Search finds both as New York, NYC and New York City, and the Bronx as The
Bronx too. Their scooters stand apart: in the Bronx north of 40.805° N, in
Queens south of 40.770° N. The two boxes don't overlap, so each scooter counts
in its own borough. Lime's feed has 11 or 12 scooters in Yonkers, just north
of the Bronx, which stood in the same places in every poll. They count under
the Bronx.

**Counted under the town.** These neighbours got no town of their own: their
scooters stand among the town's, and a box for them would take in the town's
streets. Counts are per poll, in the six polls.

- Lime Seattle: about 89 scooters in Shoreline, all within 350 m north of N
  145th Street, the city line, and 3 in Lake Forest Park, on the same street.
- Lime Detroit: Hamtramck (28 to 30) and Highland Park (29), two towns
  surrounded by Detroit.
- Lime San Jose: Santa Clara (19), along the city line, and Burbank (10), an
  unincorporated pocket inside San Jose.
- Lime Norfolk: Virginia Beach (26) and Chesapeake (12), along the city lines.
- Bird Los Angeles: about 48 at one spot in Westwood, 34.056° N 118.446° W, on
  unincorporated county land, as at a depot. The feed lists them as available,
  so the map shows them.

**Left out.** Over the 59 polls, outside every box of their own feed:

- Lime Atlanta: 6 to 8 scooters a poll, each alone, 0.2 to 13 km outside the
  box, in Decatur, Hapeville, Belvedere Park, and unincorporated DeKalb,
  Clayton, Cobb and Henry counties. Five of them stood at the same place in
  every poll.
- Lime New York: up to 19 a poll, in 33 polls, almost all in the evening:
  from 20:29 EDT 5 to 7 in Brooklyn, around Marine Park and Midwood, and a
  few in the Rockaways and Long Island City, ridden there out of the two
  boroughs' boxes, and one or two seen once in Manhattan and Westchester.
- Lime Arlington: 1 or 2 in Lincolnia, 0.5 km south of the box.
- Lime Louisville: one in Jeffersonville, Indiana, in every poll, and one 5 km
  south-east of the box for two hours.
- One scooter in every poll: Lime Chicago's at Bristol, Wisconsin, 58 km north
  of the box; Lime Baltimore's in Anne Arundel County, 13 km south of it; Bird
  Nashville's in Brentwood; Bird Santa Monica's at Playa del Rey, 3 km south of
  its box. A few more, around Chicago, Baltimore and Detroit, were seen in one
  to five polls.

**Thin evidence.** The survey saw at most two rides at Bird Dallas and
Fairfax, and the first hour of these polls one at Bird Cleveland. Over the
evening, 9, 11 and 29 of their scooters left and 21, 16 and 32 arrived, at 7,
10 and 25 different places, so they are added. Bird Greensboro, a recheck in
the survey with no ride, had 9 scooters leave and 6 arrive, and is added too. Left out until a recheck (see
[Coverage gaps](coverage-gaps.md)):

- **Bird Miami:** 33 to 39 scooters. In 59 polls none left a place it didn't
  come back to: one scooter came and went at one spot, and others appeared at
  3 more.
- **Bird University of Central Florida:** 286 to 299 scooters, on the campus.
  The same: two scooters came and went at their spots, and others appeared at
  2 more.
- **Bird Orlando,** a recheck in the survey: 451 to 467 scooters, of which one
  vanished south-east of the city at 17:09 EDT and one appeared 2 km away 15
  minutes later, the only possible ride in five hours.

Search also finds St. Louis as Saint Louis and St Louis, Indianapolis as
Indy, and San Francisco as SF.

## Reading the feeds

- **Time zones.** The app never reads a feed's `timezone`. Bird's and Spin's
  are mostly older names (`US/Eastern`, `US/Central`, `US/Arizona`, and
  `Canada/Eastern` in Canada), and Veo gives `America/Chicago` for every town,
  Washington's included. Each service area in
  the catalog says its own, `"timeZone": "America/New_York"`, by its name today;
  the generator refuses an older name, a zone of another country, a seasonal
  pause in another zone than its town's, and a night ban in
  `data/rental-curfews.json` in another zone than the towns around it.
- **Hopp (Bolt):** GBFS 3.0, whose `last_updated` is a time
  ("2026-10-14T20:32:38Z") rather than a number of seconds. Its vehicles have
  no `last_reported`, so a scooter's age is the feed's. The feed lists Bolt's
  bicycles beside its scooters; only `scooter_standing` types with electric
  propulsion are shown.
- **Veo:** GBFS 2.2, `form_factor` "scooter". Beside its 300 scooters, the
  Washington feed lists 4,294 vehicles typed as electric bicycles (`bicycle`,
  `electric`), the seated Cosmo among them, which are not shown. No
  `last_reported`, no charge, only `current_range_meters`. Its prices are
  taxable, shown with "+ tax". Each scooter's link opens Veo's app on it
  through Adjust (`gmjc.adj.st`, with the scooter's number).
- **Lyft** writes `is_reserved` and `is_disabled` as 0 and 1, its prices as
  strings ("1.00"), and links no plan from its vehicles or their types. Its
  plan for scooters is `SCOOTER_SINGLE_RIDE`, used where the feed lists it and
  has one scooter type naming no plan. Its link is one per city, which opens
  the app's code scanner (`chi.lft.to/lastmile_qr_scan`). No `last_reported`.
- **Bird and Spin** give `bird://charger-onboarding`, the sign-up for chargers,
  as their Android app's address in `system_information` (85 Bird and 50 Spin
  feeds). The map never opens it, in any country.
- **Bird and Spin** give a scooter a new id at every request, and **Lime**
  after each ride, so rides show as a scooter leaving and another coming back
  elsewhere.
- **Lime** writes a `vehicle_type` on each vehicle beside its
  `vehicle_type_id`; it is not GBFS, and only `vehicle_type_id` is read. Lime
  lists its e-bikes in the same files; only its scooters are shown.
- **Size.** Lime's Seattle status file is about 2.9 MB, its Chicago one
  2.5 MB, Bird's Los Angeles one 1.9 MB and Veo's Washington one 1.6 MB, with
  its bicycles. The scooter cache sizes itself by the number of feeds; its
  memory and `scootradar_upstream_cache_evictions_total` are watched as feeds
  are added.

## Recheck

```bash
node scripts/check-french-feeds.mjs --countries=US
```
