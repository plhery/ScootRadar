# American scooter feeds

Verified 14 October 2026. The United States' feeds come from
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and from the addresses the operators use for their other towns: Bird
(`mds.bird.co`), Lime (`data.lime.bike`), Spin, Veo
(`cluster-prod.veoride.com`), Lyft (`gbfs.lyft.com`) and Bolt
(`mds.bolt.eu`). 215 systems were surveyed. Every feed URL is https, on the
discovery's origin and under its directory. Two rider apps' maps add the
towns that publish nothing: GCOO's, signed out, in three towns since 24
October 2026 (see [GCOO](#gcoo)), Lime's, signed in, in more since 26
October 2026 (see [Lime supplement](#lime-supplement--26-october-2026)), and
Bird's, signed in, in eight since 28 October 2026 (see
[Bird supplement](#bird-supplement--28-october-2026)). No other account
credentials are used. The catalog is
[`american-scooter-feeds.json`](../data/american-scooter-feeds.json); what is
left out, and when to look again, is in [Coverage gaps](coverage-gaps.md).

The map covers 136 towns in 34 states and the District: Washington, DC
(Hopp, Veo and Lime), 32 towns of Bird's (8 from its rider map), 75 of
Lime's (58 from its rider map), 39 more of Veo's, 29 of Spin's, Lyft's
Chicago and Portland, and GCOO's Los Angeles, Arlington and Alexandria,
Virginia. In 38 of them, from Tempe and
the Bronx to Chicago and Columbus, two or three operators run, and the map
counts their scooters as one town's. Fourteen of the towns ban renting at
night; see [Night bans](#night-bans). South Lake Tahoe's fleet goes away for
the winter; see [Lime supplement](#lime-supplement--26-october-2026).

Each town is named with its state, "Washington, DC", as the United States has
many towns of one name. Zoomed out, the map shows a total per state, at the
state's centre of population (US Census Bureau, 2020).

## Lime supplement — 26 October 2026

Lime publishes no feed for most of its American markets, so its authenticated
rider map supplies them, each market whole after a clean full-area audit,
every stationary reference found. On the evening of 25 October 2026, local
time: Raleigh (566 scooters, beside Spin's), Indianapolis (984, beside
Bird's), Cincinnati (236) and Fairfax (75, beside Bird's, around George Mason
University). Just after midnight on 26 October: Tampa (1,393, beside Spin's),
Orlando (765), St. Petersburg (586, downtown), Winston-Salem (241) and
Lansing (173, with East Lansing and Michigan State's campus). Cincinnati
rents Bird's and Lime's scooters only from 06:00 to 23:00, East Lansing
has Lime take its scooters off the city's streets from 03:00 to 06:00, and
St. Petersburg's program stops from 02:00 to 05:00, so the map holds a night
ban in all three (see [Night bans](#night-bans)).

On the night of 25 to 26 October, Pacific time: Los Angeles (10,040, beside
Bird's and GCOO's), Portland (2,162, beside Lyft's), Spokane (1,749),
Sacramento (1,392), South Lake Tahoe (232), Isla Vista (206, around UC Santa
Barbara), Spokane Valley (125), West Sacramento (121) and Tualatin (15). None
of these towns' rules sets riding hours. South Lake Tahoe's code has
operators "remove all shared mobility devices from operation within the
city" from 1 November through 30 April (City Code
[§ 4.185.090(A)(11)](https://ecode360.com/47753919#51656368), as amended to
19 May 2026), so the map pauses Lime's zone there from 1 November until
1 May, by the town's clock. The zone reaches into Stateline, Nevada, which
the city's rule does not; whether Lime keeps scooters there in winter is
checked on 1 November 2026. Lime's Newport, Washington zone held no scooter:
the city council had Lime take its scooters away on 3 June 2024. Long
Beach's audit missed one stationary scooter, so the market waits for
another.

In the early hours of 26 October, Mountain time: Salt Lake City (1,942,
beside Spin's and Veo's), Boise (1,415), Phoenix (1,074, beside Spin's),
Boulder (800), Scottsdale (162) and Arvada (139). None of these towns' rules
sets riding hours; Boulder's 2021 pilot did, and Lime's map held its 800
scooters at 03:18 (see [Night bans](#night-bans)). The night's audits left
Albuquerque, Clearfield, Farmington, Grand Junction and North Salt Lake no
stationary scooter to check against, or, in Albuquerque, mixed in a scan from
the evening before; all but Farmington passed by day (below).
Lime's Charleston region held no scooter: Lime runs an e-bike programme there
with MUSC Health. Nor did Grand Rapids', where the city made Veo its only
shared scooter and bike operator from 1 September 2026, nor Carthage,
Missouri's, whose city council voted on 26 May 2026 not to bring Lime's
scooters back for the summer, nor Norman, Oklahoma's, where the city lists
only Veo among the companies licensed to rent e-scooters. See
[the Lime guide](lime-app-map.md#every-market-the-map-lists-october-2026).

In the morning of 26 October, local time: Dallas (1,686, beside Bird's),
Minneapolis (1,543, beside Spin's), St. Paul (901, beside Spin's), Charlotte
(767), Nashville (738, beside Bird's and Spin's), Omaha (677), Montgomery
County, Maryland (213, most in Silver Spring, the rest as far as Wheaton,
North Bethesda and Rockville; downtown Bethesda is outside Lime's zone),
Jacksonville (212, downtown), Richmond (112, beside Bird's and Spin's) and
St. Louis Park (42). The bans already held in Dallas, Minneapolis,
Nashville and Richmond now stop Lime's scooters there too. Charlotte's
permit rules let no trip start from 01:30 to 05:00, and Jacksonville's
downtown program rents scooters only from 05:00 to midnight, so the map
holds a night ban in both (see [Night bans](#night-bans)). Charlotte's
first audit, on the evening of 25 October, missed one stationary scooter;
the second, from scratch, found all 79. Omaha's and Montgomery County's hours are
unconfirmed, so the map holds none. Lime's region in Montgomery County meets
Washington's at the District line; a scooter of Lime's Washington fleet,
just over the line in Silver Spring, can show in both, as Lime's public
Washington feed reaches 39.0046° N.

From the morning to the early afternoon of 26 October, Central time: Austin
(3,282, beside Bird's, which publishes no feed), Milwaukee (2,717), Tulsa
(592), Oklahoma City (585), Mobile (498), Corpus Christi (405), Lubbock
(393), Little Rock (374), Rochester, Minnesota (263), Edmond (99) and Jenks
(27). None of these towns' rules sets riding hours: Mobile's franchise lets
Lime run 24 hours a day, seven days a week, Milwaukee's agreement terms (DPW,
§ 9.3) let an operator offer its scooters 24 hours a day, all year (DPW showed
a committee night no-ride zones downtown for spring 2026, which no record
shows in force), and Austin's director rules,
Oklahoma City's, Tulsa's, Jenks's and Little Rock's codes, Corpus Christi's
licence agreements and Lubbock's ordinance set no hours. Rochester's season
runs from spring until the snow; Lime came back on 13 April 2026.

Audited again on the afternoon of 26 October, local time: Long Beach (1,676),
Albuquerque (919), Grand Junction (251), Knoxville (208), Clearfield (76) and
North Salt Lake (20). Long Beach's program regulations (August 2026) and
Albuquerque's permit (revised 9 August 2024) set no riding hours, and none
was found for the others. Long Beach's first audit, by night, missed one
stationary scooter. Bird, the City's other permitted operator, is not on the
map there ([coverage gaps](coverage-gaps.md)). The only zone the map draws in
Long Beach is a no-ride area of Bird's Los Angeles service over Terminal
Island and the Port; the City's regulations keep shared scooters out of the
Port too, so it misleads no one, and Lime's Long Beach map has no zones. In Knoxville, Lime's map held no scooter at 00:30 that
night; its 2020 pilot let scooters run from 07:00 to 21:00, and guides give
07:00 to 23:00, but the city's scooter pages are gone from its new website,
so the map holds no night ban there. Farmington, Utah, showed 2 scooters and
none stationary to check against, and the same on the morning of 27 October,
so it is left out.

On the evening of 26 October, Eastern time: Alexandria, Virginia (350,
beside GCOO's). Its program sets no riding hours. Its zone stops at the
Arlington line: of the 35 scooters of Lime's public Arlington and Washington
feeds in its box at about 20:00, none stood inside it. Lime's Cleveland,
Cleveland Heights, Columbus, West Palm Beach and Wilmington, North Carolina,
regions held no scooter that evening, from about 19:00 to 20:00: Cleveland
names Bird and Veo as its permit holders, a five-year agreement made Veo and
Spin Columbus's only scooter operators (Axios, 26 August 2026), West Palm
Beach, audited before its 21:00 riding ban, names no operator, and
Wilmington runs no scooter program.

The same evening, local time: Tucson (668), Bellevue (533), Redmond (370),
Everett (352), Bothell (197) and Berkeley (146, beside Veo's). Tucson's
permit, under which Lime is the only operator, and Bellevue's, Redmond's,
Bothell's and Berkeley's rules set no riding hours; Everett's code reads
like a ban but its program lets Lime rent around the clock (see
[Night bans](#night-bans)). Lime's public Oakland feed reaches into
Berkeley's box, but none of its 11 scooters there stood in Lime's Berkeley
zone. Lime's Birmingham, St. Louis, New Haven, Missouri, Overland Park,
Plano and Denver regions held no scooter that evening, from about 19:00 to
19:45 local time. Birmingham's council permitted Lime through 30 June 2024
(BirminghamWatch, 15 November 2022), and the audit there came before the
city's 23:00 ban. Lime paused its Overland Park pilot indefinitely (Johnson
County Post), Plano lists no current operator, and Denver's transportation
department says Lime's and Bird's scooters could no longer be rented after
16 May 2026, which leaves Veo. In St. Louis, Bird's feed held about 190
scooters at the time. New Haven is a far zone of Lime's St. Louis region,
about 90 km west of the city.

On the evening of 27 October, local time, two regions that Lime's map lists
only zoomed out: San Marcos, Texas (127), whose Lime contract, approved on 18
August 2026 with Texas State University, brought scooters back to downtown,
the campus and east of Interstate 35 around the clock (Fox 7 Austin), and UNC
Charlotte (87), the university's campus, a region apart from Charlotte's. The
campus is inside Charlotte's city limits, but Lime rents there "24 hours a
day, seven days a week" under the university's own contract, $1 to unlock
and $0.29 a minute
([Parking and Transportation Services](https://pats.charlotte.edu/transportation/on-campus-transportation/bikes-and-e-scooters/),
read on 29 October 2026). So since 29 October the campus, OpenStreetMap's
outline of it, is cut out of the city's night ban, as Michigan State's is
out of East Lansing's, and the price shows on its scooters
([`listed-prices.json`](../data/listed-prices.json)). Keeping the campus as
a hole keeps the city's other holes too: its census outline has 16, pieces
of county inside its limits that the ban never reached.

## Bird supplement — 28 October 2026

Bird publishes no feed for Austin, Bloomington, Indiana, Charlotte,
Jacksonville, Mankato, Sacramento, Wilmington, North Carolina, or Yonkers, so
its rider map, signed in, supplies them: each of Bird's operating areas there
is swept whole, a request every 30 seconds for all of Bird's areas, and once a
day while nobody looks ([Bird's rider app](bird-app-map.md)). On the evening
of 27 October 2026, local time: Yonkers 811 scooters, a town of its own beside
the Bronx, Charlotte 802 and Jacksonville 271, downtown, each beside Lime's,
Bloomington 267, Sacramento 72, beside Lime's, Wilmington 87, all on UNC
Wilmington's campus, as the city runs no scooter program (above), and
Mankato 46, on Minnesota State University's, so each of those two towns
stands at its campus on the map. Austin's area held 3,222 scooters, swept
from 17:09 to 17:31 Central time, beside Lime's 3,282 the afternoon before.
Indianapolis, swept the same way as a check, held 580 scooters, and Bird's
public feed 586 inside the same outline, 582 of them within 50 m of one the
sweep found. Spin's scooters, which Bird's app also shows, are left to
Spin's public feeds.

None of the eight towns sets a season by rule. Bird kept Bloomington's
scooters in from 24 November 2025 to 18 March 2026 by its own choice
([B Square Bulletin](https://bsquarebulletin.com/bloomington-electric-scooter-ridership-drops-82-city-prepares-new-licensing-round/),
18 July 2026), and Mankato's have been stored each November, so either
area may empty this winter: pause it then, as Leduc's was
([Canada](canadian-scooter-feeds.md#winter)). Bloomington's night hours
are under [Night bans](#night-bans).

## Washington, DC

| Operator | Feed | Available scooters in Washington | Polled |
| --- | --- | ---: | --- |
| Hopp (Bolt) | `mds.bolt.eu/gbfs/3/23` | 1,366 to 1,379 | 16:34 to 16:54 EDT, 14 October |
| Veo | `veoride.com/…/xdc` | 265 to 269 | 16:34 to 16:54 EDT, 14 October |
| Lime | `data.lime.bike/…/washington_dc` | 4,581 to 4,597 | 19:54 to 19:58 EDT, 24 October |

Hopp and Veo were also polled six times from 11:27 to 12:09 and three times
from 16:13 to 16:23 that day, in the survey. Between 16:34 and 16:54, 195 Hopp
scooters left the feed and 190 came back under new ids: Bolt gives a scooter a
new id after each ride. Veo keeps its ids, and 56 of its scooters moved more than
300 m between two polls, up to 1.8 km.

**Lime** answered 404 in the survey; on 24 October its feed was back, GBFS 2.2
and a minute old, with about 3,200 e-bikes, which the map leaves out, and no
prices or links. In the four minutes between the first and third polls, 106 of
its scooters left the feed and 90 came in, and six kept their id while moving
more than 300 m, up to 2.5 km. At 19:58, 4,531 of its 4,589 scooters stood in
the District, by its OpenStreetMap outline, and 50 more inside the three boxes
below, in Maryland towns along the District line, none of which had 20.
None stood in Arlington or Alexandria: Lime's Arlington feed is another fleet,
414 scooters that evening, all in Virginia, with no id or position in common.
So Lime takes the same three boxes as Hopp and Veo, and needs no town outline.

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
the District. Its box, 38.795° N to 38.996° N and 77.119° W to 76.909° W, plus
about 1 km, would also hold Old Town Alexandria, Virginia, so search called
Alexandria covered while it has no Hopp scooters and almost no Veo ones.
Washington is three boxes instead, one stacked on the other, each stopping
where the District meets the Potomac:

- north of 38.87° N: the whole width, 77.131° W to 76.898° W;
- 38.82° N to 38.87° N: east of 77.041° W, so Hains Point, the Navy Yard and
  Anacostia stay in and Alexandria's riverside north of Old Town stays out.
  Reagan National Airport, in Virginia, is inside it;
- 38.786° N to 38.82° N: east of 77.03° W, the District's southern tip,
  leaving out Old Town and its waterfront.

Their outer box is the one above. Left out, in the poll of 16 October 2026:

- Hopp: none. Earlier, one scooter, disabled, at 38.881° N 76.860° W in
  Landover, Maryland, 4 km east of the District.
- Lime, at 19:58 EDT on 24 October: 8 of 4,589, all in Maryland, 2 in
  Montgomery County and 6 in Prince George's, up to 7 km east of the District.
  One of them is in College Park's outline, which keeps only its own
  operators' scooters.
- Veo: 11 scooters in Alexandria, 8 of them standing within 30 m of one another
  at 38.808° N 77.097° W, by Eisenhower Avenue, as at a depot. Too few, and too
  still, for an Alexandria area of their own; Alexandria's riders see Bird's and
  Lime's Arlington scooters near the county line, since 24 October 2026
  GCOO's own (see [GCOO](#gcoo)), and since 27 October Lime's (see
  [Lime supplement](#lime-supplement--26-october-2026)). Earlier also one at 39.030° N
  77.105° W, in North Bethesda, Maryland, which moved less than a metre in 20
  minutes, and one at 22.79° N 113.93° E, in Shenzhen, where Veo's test system
  (`xds`) has its scooters.

Veo's `arl` feed is the same fleet as `xdc`, so it is left out.

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

**Rechecked on Friday 16 October 2026,** from 12:00 to 14:00 EDT, in 24 polls
five minutes apart. Bird Atlanta and Bird Indianapolis, both on the map, were
polled the same way from 12:42 as a yardstick. In the 71 minutes when all five
were polled:

| Feed | Scooters | Left their spot | Appeared over 150 m from any earlier scooter |
| --- | --- | --- | --- |
| Bird Atlanta (on the map) | 2,445 | 7.5% | 33 |
| Bird Indianapolis (on the map) | 665 | 12.3% | 4 |
| Bird Orlando | 534 | 0.4% | 1 |
| Bird University of Central Florida | 283 | 1.8% | 1 |
| Bird Miami | 37 | 13.5% | 2 |

So Orlando and UCF are still not ridden, and wait for a recheck in January.
Miami's scooters move, in Brickell, Shenandoah and Coconut Grove: over the two
hours, three appeared 390 m to 1.1 km from any earlier one. That's three rides
at most, so Miami waits for the evening recheck on 21 October.

**Rechecked on Wednesday 21 October 2026,** from 17:32 to 19:34 EDT, in 26
polls five minutes apart, beside Bird Indianapolis. Scooters were grouped by
place, within 30 m, so that one parked beside others still counts: a place
whose count falls has lost a scooter, and one that gains a scooter where none
left in the previous hour, within 60 m, has had one arrive.

| Feed | Scooters | Lost from their place, an hour | Arrived elsewhere, in two hours |
| --- | --- | --- | --- |
| Bird Indianapolis (on the map) | 639 to 684 | 120 (18%) | 148 |
| Bird Miami | 16 to 18 | 0 | 2 |

Miami's fleet is half what it was a week before, and isn't ridden in the
evening either: it waits for a recheck in January with Orlando and UCF.

Search also finds St. Louis as Saint Louis and St Louis, Indianapolis as
Indy, and San Francisco as SF.

## Veo, Spin and Lyft

Polled every five minutes, 58 times, from 16:34 to 21:19 EDT on 14 October
2026 (13:34 to 18:19 in Portland and San Diego), with Bird and Lime, then on
into the night to check the bounds and the quiet feeds. Spin gives a scooter a new id at every
request, as Bird does, and Lyft and Veo after most rides, so rides are
counted by place, as for Bird and Lime.

| Operator | Town | Available scooters | Left / arrived | Bounds |
| --- | --- | ---: | ---: | --- |
| Lyft | Chicago, IL | 700 to 761 | 430 / 510 | scooters + 1 km |
| Lyft | Portland, OR | 1,213 to 1,236 | 110 / 109 | scooters + 1 km |
| Spin | Fayetteville, AR | 288 to 294 | 4 / 3 | zones + 1 km |
| Spin | Phoenix, AZ | 370 to 380 | 10 / 18 | zones + 1 km |
| Spin | Davis, CA (UC Davis) | 474 to 513 | 47 / 53 | zones + 1 km |
| Spin | San Diego, CA (UC San Diego) | 680 to 730 | 8 / 8 | zones + 1 km |
| Spin | San Francisco, CA | 2,941 to 2,997 | 162 / 168 | zones + 1 km |
| Spin | Fort Collins, CO | 451 to 470 | 67 / 66 | zones + 1 km |
| Spin | Meridian, CO | 64 to 68 | 6 / 6 | zones + 1 km |
| Spin | Gainesville, FL | 100 to 131 | 28 / 39 | zones + 1 km |
| Spin | Tallahassee, FL | 31 to 33 | 3 / 6 | zones + 1 km |
| Spin | Tampa, FL | 339 to 351 | 17 / 17 | zones + 1 km |
| Spin | Lexington, KY | 109 to 118 | 14 / 14 | zones + 1 km |
| Spin | Baltimore, MD | 2,041 to 2,093 | 352 / 384 | zones + 1 km |
| Spin | Ann Arbor, MI | 309 to 320 | 86 / 102 | zones + 1 km |
| Spin | Detroit, MI | 323 to 330 | 30 / 39 | zones + 1 km |
| Spin | East Lansing, MI (Michigan State) | 46 to 75 | 35 / 40 | zones + 1 km |
| Spin | Minneapolis, MN | 343 to 355 | 74 / 74 | zones + 1 km |
| Spin | St. Paul, MN | 38 to 40 | 5 / 6 | zones + 1 km |
| Spin | Durham, NC | 147 to 153 | 16 / 12 | zones + 1 km |
| Spin | Raleigh, NC | 270 to 289 | 45 / 37 | zones + 1 km |
| Spin | Raleigh, NC (NC State) | 298 to 324 | 21 / 33 | zones + 1 km |
| Spin | Akron, OH | 369 to 381 | 27 / 29 | zones + 1 km |
| Spin | Columbus, OH | 656 to 716 | 78 / 94 | zones + 1 km |
| Spin | Stillwater, OK | 53 to 59 | 22 / 25 | zones + 1 km |
| Spin | Pawtucket, RI | 77 to 97 | 50 / 37 | zones + 1 km |
| Spin | Providence, RI | 574 to 603 | 147 / 152 | zones + 1 km |
| Spin | Nashville, TN | 398 to 410 | 52 / 55 | zones + 1 km |
| Spin | Salt Lake City, UT (University of Utah) | 296 to 305 | added 22 October, see below | zone + 1 km |
| Spin | St. George, UT | 143 to 147 | 17 / 22 | zones + 1 km |
| Spin | Richmond, VA | 255 to 269 | 89 / 98 | zones + 1 km |
| Spin | Roanoke, VA | 83 to 86 | 3 / 7 | zones + 1 km |
| Veo | Birmingham, AL | 480 to 492 | 39 / 45 | scooters + 1 km |
| Veo | Fayetteville, AR | 620 to 631 | 40 / 36 | scooters + 1 km |
| Veo | Berkeley, Emeryville, CA | 257 to 272 | 129 / 146 | scooters + 1 km |
| Veo | Santa Monica, Los Angeles, CA | 582 to 608 | 112 / 125 | scooters + 1 km |
| Veo | Denver, CO | 3,454 to 3,491 | 746 / 745 | scooters + 1 km |
| Veo | Hartford, CT | 755 to 790 | 290 / 306 | scooters + 1 km |
| Veo | New Haven, CT | 268 to 290 | 48 / 57 | scooters + 1 km |
| Veo | Gainesville, FL | 186 to 199 | 70 / 95 | scooters + 1 km |
| Veo | Sarasota, FL | 277 to 288 | 7 / 12 | scooters + 1 km |
| Veo | Cedar Rapids, IA | 322 to 337 | 61 / 49 | scooters + 1 km |
| Veo | Carbondale, IL | 308 to 328 | 43 / 48 | scooters + 1 km |
| Veo | West Lafayette, IN | 237 to 259 | 62 / 69 | scooters + 1 km |
| Veo | Manhattan, KS | 311 to 335 | 33 / 17 | scooters + 1 km |
| Veo | Wichita, KS | 346 to 364 | 20 / 14 | scooters + 1 km |
| Veo | College Park, University Park, MD | 475 to 502 | 87 / 100 | scooters + 1 km |
| Veo | Asbury Park, NJ | 146 to 161 | 12 / 13 | scooters + 1 km |
| Veo | New Brunswick, Piscataway, Highland Park, NJ | 468 to 485 | 34 / 38 | scooters + 1 km |
| Veo | Newark, NJ | 304 to 322 | 102 / 111 | scooters + 1 km |
| Veo | Bronx, NY | 55 to 59 | 13 / 14 | scooters + 1 km |
| Veo | New Rochelle, NY | 256 to 283 | 37 / 40 | scooters + 1 km |
| Veo | Queens, NY | 257 to 267 | 37 / 45 | scooters + 1 km |
| Veo | Rochester, NY | 454 to 469 | 130 / 137 | scooters + 1 km |
| Veo | Syracuse, NY | 164 to 174 | 71 / 74 | scooters + 1 km |
| Veo | Cleveland, Cleveland Heights, University Heights, South Euclid, OH | 257 to 266 | 32 / 42 | scooters + 1 km |
| Veo | Columbus, OH | 867 to 886 | 92 / 109 | scooters + 1 km |
| Veo | Toledo, OH | 529 to 561 | 131 / 138 | scooters + 1 km |
| Veo | Norman, OK | 449 to 473 | 50 / 56 | scooters + 1 km |
| Veo | San Antonio, TX | 298 to 304 | 22 / 19 | scooters + 1 km |
| Veo | Salt Lake City, South Salt Lake, UT | 279 to 284 | 25 / 27 | scooters + 1 km |
| Veo | Charlottesville, VA | 493 to 524 | 116 / 129 | scooters + 1 km |

That is 66 towns besides Washington, 50 of them new to the map, and 10 more
states: Veo in 39 towns with 14,400 to 14,500 scooters, Spin in 29 with
12,800 to 13,000, and Lyft in Chicago and Portland with 1,900 to 2,000. Where
two operators run in one town, their feeds use the same name and state, and
the map counts their scooters as one town's: Spin with Bird or Lime in
Baltimore, Detroit, Durham, Lexington, Nashville, Richmond and San Francisco;
Veo with Bird or Lime in the Bronx, Queens, Cleveland, Los Angeles, Santa
Monica, Newark and San Antonio; Lyft with Lime in Chicago; Spin and Veo in
Columbus (OH), Fayetteville (AR) and Salt Lake City, and with Bird in
Gainesville (FL).
Spin's Raleigh and NC State feeds are both Raleigh's.

Spin's feeds are at `gbfs.spin.pm/api/gbfs/v2_3/<town>/gbfs`, GBFS 2.3;
Veo's at `cluster-prod.veoride.com/api/shares/name/<code>/gbfs`, GBFS 2.2;
Lyft's at `gbfs.lyft.com/gbfs/2.3/<city>/gbfs.json`. Veo's scooters cost $1
to unlock and $0.32 to $0.50 a minute, by town, and Lyft's $1 and $0.44 a
minute in Chicago, $0.41 in Portland, all taxable. Spin publishes no price.

**Towns.** Each scooter was placed in its town by the US Census Bureau's
places ([TIGERweb](https://tigerweb.geo.census.gov/)). Six Veo feeds run in
more than one town, and get one area per town, with the box of its scooters
plus 1 km; each scooter counts in the nearest town of its feed whose box holds
it:

- Veo Cleveland: Cleveland, Cleveland Heights, University Heights and South
  Euclid.
- Bird Cleveland, since 26 October 2026: the same four and East Cleveland,
  each a zone of its GBFS geofencing where rides may end. Veo's boxes, and East
  Cleveland's outline plus 1 km. That afternoon (16:16 UTC) 9 of its scooters
  stood in Cleveland Heights, 5 in South Euclid and 1 in University Heights.
- Veo College Park: College Park and University Park.
- Veo's Rutgers feed (`rut`): New Brunswick, Piscataway and Highland Park.
- Veo's East Bay feed (`xeb`): Berkeley and Emeryville.
- Veo's Los Angeles feed (`xla`): Santa Monica, and Venice and the coast south
  of it in Los Angeles, with Marina del Rey. Los Angeles keeps Bird's centre.
- Veo Salt Lake City: Salt Lake City and South Salt Lake.

**Town outlines.** Where those towns touch, their boxes overlap, and the
nearest centre named the wrong town for 213 and 217 American scooters in two
polls on 15 October 2026 (16:44 and 17:28 EDT): Veo's in Venice under Santa
Monica (about 100), Bird's in Santa Monica under Los Angeles (23, 25), College
Park's under University Park (33, 35), New Brunswick's under Highland Park
(15, 14), Berkeley's under Emeryville (8, 7), South Euclid's under University
Heights (7) and a few around Cleveland Heights, Culver City and South Salt
Lake. Los Angeles, Santa Monica, Culver City, College Park, University Park,
New Brunswick, Highland Park, Berkeley, Emeryville, Oakland, Cleveland,
Cleveland Heights, University Heights, South Euclid, Salt Lake City and South
Salt Lake now have their incorporated place's outline in
[`town-outlines.json`](../data/town-outlines.json), from TIGERweb, as for the
night bans, simplified to within 20 m; a scooter inside one counts under that
town, whichever feed lists it, so Bird's Los Angeles feed keeps its scooters
in Santa Monica and they count under Santa Monica. After: 5 and 4 a poll, two
within 2 m of a town line and three between Arlington and Washington or St.
Paul and Minneapolis, left as boxes for so few. A feed keeps no scooter in an
outlined town where its operator has no area: Veo Santa Monica's 1 or 2 in
Culver City, Lime Oakland's 1 in Emeryville and Veo Berkeley's 1 in Oakland
are left out (and Bird Cleveland's 2 in Cleveland Heights were, until its
areas there on 26 October 2026). Elsewhere,
including Canada (1 a poll, an Edmonton scooter under St. Albert), the
boxes name nearly every scooter's town, and have no outlines.

**Spokane.** Lime's Spokane market is its whole service area, which reaches
north past Mead and south-west to Cheney, so its box counted every scooter
in it under Spokane. Of its 1,778 in the cache's snapshot at 23:30 PDT on 28
October 2026, 1,632 stood inside the city's TIGERweb outline, 22 inside
Spokane Valley's, and 124 in unincorporated county north of the city
(Country Homes 31, Town and Country 23, Fairwood 12, Mead 5, and 53 in no
census place); none stood in Cheney or Airway Heights. Lime's Spokane Valley
market held 94: 89 in the city, 4 in the county and 1 in Spokane. Since 29
October Spokane and Spokane Valley have their outlines, so the 22 count under
Spokane Valley, and the county's 124, in neither outline, stay under Spokane,
their feed's town: about 1,757 and 115. The city alone holds more than the
1,500 vehicles of Lime's contract (Spokesman-Review, 14 May 2026); Lime asked
for 2,000 in 2026, and no decision was found. Spokane Valley's fall from 125
on 25 October is Lime's own: every cell of its grid was read without error,
by day or in the evening, on 27 and 28 October, and listed fewer scooters.

Campus feeds take their town's name: Spin's UC Davis feed is Davis, its
Michigan State one East Lansing, its NC State one Raleigh, its University of
Utah one Salt Lake City, and its San Diego feed is the UC San Diego campus,
in La Jolla, where the map centres San Diego. Search finds them by the
university too: UC Davis, Michigan State University and MSU, NC State,
University of Utah, U of U and UofU, UC San Diego and UCSD, University of Arkansas,
Oklahoma State University, Purdue, Kansas State University and K-State,
Southern Illinois University and SIU, University of Oklahoma, UVA, Rutgers,
University of Maryland and UMD, UC Berkeley, Yale, UAB and John Carroll
University. It finds St. Paul as Saint Paul, St. George as Saint George and
Salt Lake City as SLC, and Veo's Bronx and Queens with Bird's and Lime's, as
New York and NYC.

**Bounds.** Spin publishes its zones. A town's bounds are the box of the
zones where a ride may end that hold its scooters, plus 1 km. Veo and Lyft
publish none; their bounds are the box of the town's scooters over the
survey's and the evening's polls, plus 1 km, without the strays below. The
polls after, to 22:14 EDT, found nothing more outside them.

**Counted under the town.** Per poll, about:

- Veo Denver: 50 scooters in 12 neighbours, Aurora (15), Berkley (8),
  Glendale (6), Lakewood (5), Four Square Mile (5), Englewood (4) and others.
  Glendale is surrounded by Denver.
- Veo Hartford: West Hartford (7 or 8) and Blue Hills (1).
- Veo Syracuse: DeWitt (2), East Syracuse and Lyncourt.
- Veo Berkeley: Albany (2) and Oakland (1).
- Veo Columbus: Upper Arlington, Dublin, Bexley and Marble Cliff, 1 or 2
  each. Veo Newark: East Orange (2), at times Silver Lake and Ampere North;
  on 26 October 2026 (01:55 UTC, three polls) also Orange (3, at one corner,
  40.770° N 74.228° W), a township, not a Census place. Veo Salt
  Lake City: West Valley City (1 or 2). Veo College Park: Adelphi (1). Veo
  West Lafayette: Lafayette (1 or 2).
- Spin Davis and Veo Charlottesville: most scooters stand on the campuses of
  UC Davis and the University of Virginia, Census places of their own.
  Spin Meridian's town is a Census place of Douglas County, south of Denver.
  Its box, Spin's ride zone plus 1 km, overlaps Veo Denver's from 39.605° N
  to 39.633° N, by Belleview Avenue. In four polls on 15 October 2026
  (17:29 to 17:45 MDT), none of Spin's scooters stood there (the northernmost
  at 39.564° N), and Veo's 7 a poll there counted under Denver, their own
  feed's town: 5 in Denver, 2 in Greenwood Village. Of Spin's 68 to 71,
  about 61 stood in Meridian and 9 in unincorporated Douglas County.

**Left out.** Outside every box of their own feed, in the survey's and the
evening's polls:

- Veo Birmingham: 12 to 17 scooters at one spot in Homewood, 33.453° N
  86.839° W, in every poll, as at a depot.
- Veo Hartford: 8 to 10 at one spot in East Hartford, 41.787° N 72.610° W,
  in every poll.
- Veo New Rochelle: up to 6 at one spot in Mount Vernon, 40.906° N
  73.834° W, one of them disabled in every poll.
- Veo West Lafayette: 1 to 3 at one spot in Lafayette, 40.423° N 86.850° W,
  across the Wabash.
- Veo New Haven: 1 to 3 at one spot in Woodbridge, 41.339° N 72.982° W, 2 km
  west of the box.
- One scooter in every poll: Veo Syracuse's in Salina, north of the city; Veo
  Newark's in Englewood, 25 km north-east (gone by 26 October 2026); Veo
  Columbus's in the north of Toledo, 200 km away.
- Veo College Park's feed listed one scooter at 33.993° N 118.164° W, in Bell,
  California, in 26 polls, and Veo Sarasota's one at the same spot in 2. Veo
  Manhattan (KS) listed one in Wichita in 2 polls.

Veo's Los Angeles feed has about 2 scooters in Culver City, inside the
Los Angeles box. Culver City is Bird's town, and since 15 October 2026 its
outline leaves them out (see **Town outlines** above). Spin Minneapolis's odd
scooter in St. Paul (one on 14 October 2026, none on 26 October) and Spin
Providence's in Pawtucket stand inside their own boxes, and show.

**Thin evidence.** The survey saw few rides at Spin Phoenix, San Diego,
Meridian, Gainesville and Tampa, and at Veo's Bronx, San Antonio, Salt Lake
City, Cedar Rapids, Wichita and Fayetteville feeds. Over the evening, all had
scooters leave places they didn't come back to and arrive elsewhere (see the
table); at Phoenix and Gainesville, 4 and 10 of them at places more than
300 m from any scooter seen before. San Diego and Meridian were the
quietest: by 22:14 EDT, 6 and 3 scooters had left places no scooter came
back to, and 5 and 4 had arrived where none had stood, San Diego's all on
the campus. Spin's `last_reported` is each scooter's own, a few minutes old
in every poll, so their scooters are on and reporting. Eight feeds that
were rechecks in the survey had rides in the evening, and are added: Spin
Tallahassee, Roanoke, St. Paul, Stillwater and Fayetteville, and Veo
Sarasota, Asbury Park and Rutgers. Left out until a recheck (see
[Coverage gaps](coverage-gaps.md)): **Spin East Lansing** (`east_lansing`,
the city's feed, not Michigan State's), 10 to 12 scooters, a few of them
last reported days before. By 22:14 EDT three had left places, two of them
together, and none had arrived at a new one.

**Spin University of Utah** (`university_of_utah`), added on 22 October
2026 as Salt Lake City. On 14 October its 321 to 328 scooters, all
reporting every few minutes, made no ride between two places: by 20:14 in
Salt Lake City, two had left one spot together, one a second, and one had
appeared at a new place two hours before. The university's fall break ran
from 10 to 18 October 2026
([registrar](https://registrar.utah.edu/academic-calendars/fall2026.php)).
After it, polled beside Bird Indianapolis as in
[Bird's recheck](#bird-and-lime) from 15:32 to 17:34 MDT on 21 October, its
296 to 305 available scooters lost about 48 from their places an hour, 16%
of the fleet, against Indianapolis's 18%, and 61 arrived where none had
left in the previous hour. At midnight the night before it lost 1.5% an
hour. Polled four more times, 5 to 6½ minutes apart, from 17:42 to 17:59
MDT, a quieter quarter-hour: 299 to 303 available, 4 lost from their places
and 6 gained, one where none had stood. Every scooter stood in Spin's ride
zone and inside Salt Lake City's outline, its last report a median two
minutes old.

- **Bounds.** The feed's ride area is the campus, 40.751° N to 40.774° N
  and 111.852° W to 111.817° W; its other zones, in and around it, forbid
  riding or parking. Two zones cover the campus: the first forbids ending a
  ride there and the second allows it, and GBFS lets the earlier of two
  clashing rules win, so the map shades the campus no-parking. Rides end in
  the white boxes the app shows, as the University says. The bounds are that zone plus
  1 km, 40.7418° N to 40.7834° N and 111.8643° W to 111.8051° W.
- **Town.** The campus is in Salt Lake City, whose outline the map already
  holds for Veo's feed (see **Town outlines** above). The feed's area is
  Salt Lake City's, so Spin has an area in the town and keeps the scooters
  inside its outline; they count under Salt Lake City, centred downtown as
  for Veo. South Salt Lake's outline ends at 40.726° N, south of the box.
- **Veo.** Spin's box lies inside Veo's Salt Lake City box. At 17:45 MDT,
  20 of Veo's 283 available scooters stood in Spin's box, 2 of them at the
  edge of the campus zone; the two feeds' scooters count as one town's.
  The city's [Shared Mobility page](https://www.slc.gov/transportation/sharedmobility)
  names Veo and Lime as its operators; Commuter Services says Spin's
  scooters "are licensed to operate in Salt Lake City", but the zones in
  Spin's feed allow riding only on the campus.
- **The other Salt Lake City feeds** stay out (see
  [Coverage gaps](coverage-gaps.md)): Spin's city feed (`salt_lake_city`)
  listed 2 scooters that evening, 420 m and 590 m from any of the
  university feed's, and Bird's scooters there are stale.
- Its `vehicle_types` lists an e-bike too; none was in the feed. No rule
  sets riding hours (see [Night bans](#night-bans)).

**No seasons.** St. Paul's operating season is "typically from mid-April to
mid-November each year"
([city](https://www.stpaul.gov/departments/public-works/transportation-and-transit/shared-scooters-bikes)),
and its 2026 agreements with Lime and Spin
([RES 26-676](https://stpaul.legistar.com/LegislationDetail.aspx?ID=7991127&GUID=786A6CED-7BA6-4E53-A74B-971980C199DE),
6 May 2026) estimate the end "on or around November 15th", which the City may
extend to 31 December. Cedar Rapids' runs from 1 April to 31 October but "could extend through
November, depending on weather conditions" (KWWL, 12 March 2026). Rochester's
Veo fleet goes into storage "in mid-December" and comes back about mid-March
(city release, November 2025), the University of Toledo's from mid-November,
and Manhattan's agreement allows a winter pause "for a mutually agreed to
period". None of these is a fixed date, so the catalog pauses none of them;
a fleet put away leaves its feed, and the map, empty.

## GCOO

GCOO, Gbike's scooter brand from South Korea, runs four American towns and
publishes no GBFS feed. Since 24 October 2026 three of them come from its
app's signed-out map, with no credential, read by South Korea's collector on
its request queue (see [the Korean catalog](south-korean-scooter-feeds.md#gcoo)):

| Town | Feed | Scooters in the feed | Polled |
| --- | --- | ---: | --- |
| Los Angeles, CA | `gcoo_us_los_angeles` | 1,712 | 08:54 PDT, 24 October |
| Arlington, VA | `gcoo_us_arlington` | 302 | 11:54 EDT, 24 October |
| Alexandria, VA | `gcoo_us_alexandria` | 328 | 11:54 EDT, 24 October |

GCOO publishes its service areas in
`https://region.gbike.io/us/all_polygons.json.gz`: seven in Los Angeles
(Koreatown, Downtown, Hollywood, East Hollywood, Fairfax, Hancock Park and
USC), one each in Arlington and Alexandria, and four in Memphis. A town's
bounds are the envelope of the scooters standing in its areas, 1.5 km wider.
Memphis, with 10 scooters in its four areas that day, is left out (see
[Coverage gaps](coverage-gaps.md)). GCOO has no area in Washington, and none
of its scooters stood there. The map keeps GCOO's scooter models only, with
their battery and range; none of the three towns bans renting at night.

**Alexandria.** Arlington's and Alexandria's boxes overlap around Four Mile
Run: at 12:05 EDT 116 scooters stood in both feeds, and the map shows and
counts each once. Each would have counted under Arlington, whose feed is read
first, 46 of them inside Alexandria. Alexandria now has its incorporated
place's outline in [`town-outlines.json`](../data/town-outlines.json), as
above, so those count under Alexandria: 254 of the 513 that poll, and 259
under Arlington, which has none. Bird has no area in Alexandria, and Lime's
Alexandria zone, read from its rider map since 27 October 2026, is another
fleet, so their Arlington feeds keep no scooter inside the outline; at 11:59
EDT none of Bird's 284 stood there, nor any of Lime's 495.

## Night bans

Fourteen covered towns ban renting at night, by ordinance, in the rules of
their permits or on the city's own program page. While a ban holds, the dock
tells of it, with a moon, for the town in view, and a scooter's card says
when it can be rented again. Web and iOS read the same
[`rental-curfews.json`](../data/rental-curfews.json). It holds each rule,
its source and the town's boundary: the Census Bureau's incorporated place
from TIGERweb (public domain), East Lansing's without Michigan State's campus
from OpenStreetMap (ODbL), simplified to within 100 m by
`scripts/update-curfew-areas.mjs`. Hours are the town's own. Each ban rests
on the city's own rule, in force and read again on 15 October 2026,
Cincinnati's, East Lansing's, Jacksonville's and Charlotte's on 26 October;
none rests on news or an operator's notice. St. Petersburg publishes no rule with its
hours: its ban rests on the city's own report of its program's hours, which
Lime's map bore out on 26 October.

| Town | Nights | Source |
| --- | --- | --- |
| Dallas, TX | Every night, 20:45–05:00 | [Shared Dockless Vehicle Program Rules](https://www.dallascityhall.com/departments/transportation/PublishingImages/Pages/dockless-vehicle-program/Posted%20Program%20Rules_4.17.26.pdf), 17 April 2026, § 6.A |
| Lincoln, NE | Every night, 23:00–06:00 | [ScooterLNK](https://www.lincoln.ne.gov/City/Departments/LTU/Transportation/Traffic-Engineering/Active-Transportation/ScooterLNK) |
| Atlanta, GA | Every night, 02:00–04:00 | [ATLDOT Administrative Regulations](https://atldot.atlantaga.gov/wp-content/uploads/2025/11/Administrative-Regulations-November-2024.pdf), updated 27 November 2024, § VI(d)(1)(i) |
| Richmond, VA | Every night, 01:00–05:00 | City Code § 24-131(3), as amended by [Ord. 2023-029](https://legistar2.granicus.com/richmondva/attachments/87666009-0d3e-4a81-b6c7-8d74ec1700c1.pdf) |
| Nashville, TN | Every night, 00:00–05:00 | [Metropolitan Transportation Licensing Commission Rules](https://www.nashville.gov/sites/default/files/2026-10/TLC_Rules_9-16-2026.pdf), filed 16 September 2026, § 905.L |
| Gainesville, FL | Every night, 00:00–06:00 | [City Code § 26-196(e)](https://library.municode.com/fl/gainesville/codes/code_of_ordinances?nodeId=PTIICOOR_CH26TRMOVE_ARTVIIMISE) |
| Minneapolis, MN | Every night, 00:00–04:00 | [Rent a scooter](https://www.minneapolismn.gov/getting-around/scooters/rent-a-scooter/), updated 30 June 2026 |
| Raleigh, NC | Every night, 23:00–06:00 | [E-Scooter Program](https://raleighnc.gov/transportation/services/e-scooter-program) |
| Birmingham, AL | Every night, 23:00–06:00 | [City Code § 12-22-6(c)(20)](https://library.municode.com/al/birmingham/codes/code_of_ordinances?nodeId=PT1THCOGEOR_TIT12LIRE_CH22SHMIDESY) |
| Cincinnati, OH | Every night, 23:00–06:00 | [Electric Scooters](https://www.cincinnati-oh.gov/dote/dote-projects/electric-scooters/), Department of Transportation & Engineering |
| East Lansing, MI | Every night, 03:00–06:00, outside Michigan State's campus | [City Code § 8-610(13)](https://library.municode.com/mi/east_lansing/codes/code_of_ordinances?nodeId=PTIIICOOR_CH8BU_ARTXELSKCO) |
| St. Petersburg, FL | Every night, 02:00–05:00 | [Scooter Share program report](https://cms5.revize.com/revize/stpete/2025-05-08%20HLUT%20Agenda%20Packet.pdf), Housing, Land Use and Transportation Committee, 8 May 2025 |
| Jacksonville, FL | Every night, 00:00–05:00 | [Dockless Mobility Program](https://dia.jacksonville.gov/resources/dockless-mobility-program), Downtown Investment Authority |
| Charlotte, NC | Every night, 01:30–05:00 (unconfirmed since 29 October 2026), outside UNC Charlotte's campus | [Shared-Use Mobility System Permit Requirements](https://www.charlottenc.gov/files/sharedassets/city/v/1/city-government/departments/documents/cdot/smp/charlotte-shared-use-mobility-system-permit-requirements_07_01_25.pdf), 1 July 2025, § 5.C |

- A night is named after its evening: Friday's runs into Saturday morning.
- **Dallas:** "Units may only be available to users to start a ride from
  5:00 am to 8:45 pm daily. All rides must end by 9:00 pm." The rules took
  effect on 28 April 2026, and the city's program page says the same. They
  let the city trial one more hour for 30 days in a permit cycle: it ran one
  for the World Cup, 15 June to 15 July 2026, rides from 5:00 to 22:00 and
  none starting after 21:45 ([City memo](https://dallascityhall.com/government/citymanager/Documents/FY25-26%20Memos/Dockless%20Vehicle%20Program%20FIFA%20World%20Cup%20Provisions.pdf),
  12 June 2026), then went back to 21:00. The map keeps the usual window.
- **Lincoln:** the city's page: "E-scooters are allowed to operate from 6
  a.m. to 11 p.m., seven days a week. Users will not be able to start any
  trips outside of that operating window." And: "E-scooters will not be
  available during UNL Husker football home game days", all day and
  city-wide; 31 October and 21 November are left in 2026. A nightly window
  can't hold them, so the map doesn't show them.
- **Atlanta:** the ban has never been in the City Code. It is a city-wide
  no-ride rule: 21:00–04:00 by the mayor's order of August 2019, 00:00–04:00
  from December 2022. Council resolution 24-R-4212 asked ATLDOT to narrow it to
  02:00–04:00, and the regulations operators follow, updated 27 November
  2024, did from 13 November: "No Permitted Device shall be rentable during
  this time period", and scooters stop working from 02:20. ATLDOT's
  [bikes and scooters page](https://atldot.atlantaga.gov/services-2/bikes-and-scooters/)
  still carries the 2022 note, 00:00–04:00. The regulations are the binding
  text, the page links them, and both forbid 02:00–04:00, so the map keeps
  that.
- **Richmond:** the ordinance moved the end of the day from 21:00 to 01:00 in
  February 2023: devices "are only operated from 5:00 a.m. to 1:00 a.m."
  It took force on adoption, and the city's Legistar holds no later
  ordinance on the section. The city's e-scooter FAQ still gives the old
  05:00–21:00.
- **Nashville:** "Operation of SUMDs is prohibited after midnight and before
  5:00 am, except for bicycles and electric bicycles", across Metro
  Nashville-Davidson County. The commission's rules were filed with the
  Metropolitan Clerk on 16 September 2026; a footnote dates this one to the
  amendment of 27 April 2023. The area is Metro's outer edge, so it takes in
  the satellite cities inside it, Belle Meade, Forest Hills, Oak Hill and
  Berry Hill; on 14 October only Berry Hill held a scooter, one or two.
- **Gainesville:** operators "may allow operation of their micromobility
  devices between the hours of 6:00 a.m. to 12:00 a.m." and must disable
  their fleets each night, as the code reads in its latest supplement (64).
  The director may extend the hours and keeps those authorised on file; the
  University of Florida's
  [TAPS page](https://taps.ufl.edu/alternative-transportation/micromobility/)
  gives the same 6 AM to midnight, on campus and in the city.
- **Minneapolis:** the city's page, last updated on 30 June 2026: "Ordinance
  requires companies disable scooters at midnight. They're turned back on
  the following day at 4 a.m." In Spin's feed, polled every 10 minutes on
  the night of 14 October, eight scooters turned up at new places between
  23:00 and midnight, and none from midnight to 01:20. The ban stops at
  the city line, so Spin's St. Paul scooters aren't in it.
- **Raleigh:** "All scooters are available to ride from 6 a.m. to 11 p.m.,
  seven days a week." The page names Lime and Spin and carries no date;
  the City Code (§ 12-1007) leaves operating rules to the City Manager.
  NC State's [Spin page](https://transportation.ncsu.edu/spin-e-scooters-e-bikes/)
  gives the same hours for its campus, which is inside the city, so both
  Spin feeds fall under the ban. Few rides showed that evening, one or two an
  hour before 23:00, and none in the two hours after.
- **Birmingham:** "Shared micromobility devices, except bicycles, shall not
  be enabled for public use between the hours of 11:00 p.m. to 6:00 a.m."
  The city may change the hours on 48 hours' notice to operators; no
  change is published, and Veo's fleet keeps to these. Its ids hold from
  poll to poll: 24 and then 28 scooters moved more than 250 m in the two
  hours before 23:00 on 14 October, 3 in the hour after and 1 in the next.
- **Cincinnati:** the department's page says Bird's and Lime's scooters are
  "available for rent" from 6:00 a.m. to 11:00 p.m., seven days a week. It
  was read in its copy of 18 May 2026 in the Internet Archive, as the city's
  site refuses connections from Europe. WCPO reported the end of the day
  moving back to 23:00 in January 2023. Lime's map there was audited before
  23:00.
- **East Lansing:** a licensee must "Remove all electric skateboards from the
  public rights-of-way within the city between the hours of 3:00 a.m. and
  6:00 a.m. each day" (Ord. 1453, 5 March 2019, as Municode carried it on 5
  May 2026). Michigan law calls stand-up e-scooters electric skateboards, and
  the city's [Electric Scooters page](https://www.cityofeastlansing.com/2035/Electric-Scooters)
  names Lime its only approved scooter company. Michigan State's campus,
  inside the city, is university land under the trustees'
  [Ordinance 33.00](https://trustees.msu.edu/governance/ordinances/ordinance-33)
  (amended 6 September 2024), which sets no hours, so the ban's area is the
  city without the campus (OpenStreetMap relation 13708038): Spin's campus
  fleet and Lime's scooters there stay rentable. Lime's map still listed
  scooters on the city's streets through the ban on 26 October 2026: 9 of
  the 15 positions read at 03:41 EDT were in the city, off the campus.
- **St. Petersburg:** the city's report on its Scooter Share program to the
  Housing, Land Use and Transportation Committee
  ([packet](https://cms5.revize.com/revize/stpete/2025-05-08%20HLUT%20Agenda%20Packet.pdf),
  8 May 2025) charts the curfew: 22:00 to 06:00 at first, then midnight to
  05:00 from 2022, then 02:00 to 05:00 from 2023. A request for proposals of
  January 2025 (RFP 25-002, since cancelled) still gave "between 5am and
  midnight daily". The agreements signed with Lime and Spin in June 2025
  aren't published, and the city's
  [Scooter Safety page](https://www.stpete.org/visitors/scooter_safety.php)
  gives no hours. Lime's map bore the report out on 26 October 2026: its 585
  scooters there, listed until 02:22 EDT, were gone at 02:24, the map was
  still empty at 03:32 and 04:32, and they were back by 05:08.
- **Jacksonville:** the Downtown Investment Authority's program page, under
  "Program Rules of Operation": "Hours of operation: 5 a.m. - midnight".
  The program runs only downtown, with Bird and Lime, and Lime's zone is
  downtown's. The page was read in its copy of 17 May 2026 in the Internet
  Archive, as the city's site refuses connections from Europe; the
  authority's release of 7 March 2023, which made the pilot's rules
  permanent, gives the same hours. The ban's area is the city's, which
  takes in the zone.
- **Charlotte:** "No E-Scooter and E-bike trips may be initiated outside
  permitted operating hours (currently 5:00am – 1:30am but subject to
  change)." An operator pays $25 for each trip started outside them
  (§ 6.B). The Department of Transportation's
  [program page](https://www.charlottenc.gov/City-Government/Departments/Charlotte-Department-of-Transportation-CDOT/Mobility-Planning/Shared-Mobility-Program)
  links the requirements, gives "Operation Hours: 5 a.m. to 1:30 a.m." and
  names Bird and Lime as the operators authorised; Bird publishes no feed
  there. **Unconfirmed since 29 October 2026:** charlottenc.gov answers 403
  to the requirements, the program page and the rest of the site, and the
  Wayback Machine refused the lookup (429), so the hours above are as read
  before and the map keeps them. UNC Charlotte's campus is left out: Lime
  rents there at all hours under the university's contract (see
  [the Lime supplement](#lime-supplement--26-october-2026)).

Spin and Veo keep listing scooters as available through a ban, Gainesville's
too, so only rides stopping can show one in their feeds.

Rules that read like bans but are not, or that no primary source confirms:

- **Chicago:** CDOT's
  [page](https://www.chicago.gov/city/en/depts/cdot/supp_info/escooter-share-pilot-project.html)
  still says "Scooters may be rented between 5:00am-midnight", but the
  Scooter Sharing Business Rules (2025 update, Rule 7.4) let operators rent
  "at all hours of the day upon implementation of in-app impairment testing",
  which riders take from midnight to 05:00 (Rule 11.1). A test, not a ban.
- **Cleveland:** the vendor rules republished in the
  [City Record of 27 March 2026](https://www.clevelandcitycouncil.gov/sites/default/files/2026-03/City%20Record%203-27-26.pdf),
  in force seven days later, say "E-scooters may be available for rent for
  24 hours a day, 7 days a week" (§ VIII(c)). Those of July 2024 kept them
  from being rented from midnight to 03:00, and the map held that ban until
  26 October 2026. The city's
  [shared mobility page](https://clevelandohio.gov/transportation-mobility/shared-mobility)
  still gave the old hours, 3 a.m. to midnight, on 26 October 2026.
  Cuyahoga County's program page, cited here before, refused that day, so
  its Flats East Bank hours are left out.
- **St. Louis:** the city's release of 4 June 2021 set a curfew from 21:00 to
  08:00 in Downtown and Downtown West, "indefinitely". The 2025 permit keeps
  the city's power to draw curfew areas but holds no map of one, and nothing
  later confirms it. Left out: a district rule at most, and unconfirmed.
- **Detroit:** a weekend shutdown of the business district from 21:00 to
  06:00 was reported in 2022. The 2026–2027 permit application sets no hours,
  and its map is captioned "Regular 24/7 Operations".
- **New York:** only a rider's first three trips can't start overnight
  ("Beginner Mode").
- **Durham:** only Duke's campus, from 23:00 to 06:00; the city has "no set
  operating hours".
- **Providence:** Public Works' regulations of April 2022 disabled fleets
  from 23:00 to 05:00; the newest, of 26 January 2023, dropped the clause.
- **Pawtucket:** the pilot's rules, revised 20 April 2023, say "Scooters
  must be unavailable for rental between the hours of 11:00PM Eastern Time
  and 5:00AM Eastern Time" (§ 4). But the pilot ran to the end of 2025,
  with scooters out all night in the summer of 2025, and nothing says what
  its renewal for 2026 keeps. On 14 October a scooter left its place
  between 23:29 and 23:34 EDT, and one appeared 1.5 km away by 23:44. Polled
  again every five minutes from 19:38 EDT on 21 October to 00:30, beside
  Spin Providence, its 77 to 79 available scooters stayed available after
  23:00, and from 23:30 to midnight 3 left their places and 2 arrived where
  none had left, as many as in the evening's quieter half hours (1 to 5).
  The city's [program page](https://pawtucketri.gov/public-works-department/micromobility-scooter-pilot-program/)
  links only the 2023 rules, and its
  [release of 2 May 2025](https://pawtucketri.gov/city-of-pawtucket-and-spin-expand-electric-scooter-pilot-program-ahead-of-centreville-bank-stadium-opening-weekend/)
  extended the pilot to 31 December 2025 "with the potential for a one-year
  renewal through 2026"; nothing newer is published. Left out: the fleet
  runs past 23:00, and no rule in force says it shouldn't.
- **San Diego:** the Municipal Code bars providers from letting devices be
  reserved or activated from midnight to 02:30 (§ 83.0308(i), from
  O-21467, 2022). But the map's San Diego is UC San Diego's own Spin fleet,
  nearly all of it on the campus, which is state land; the university's
  [page](https://transportation.ucsd.edu/campus/shared.html) sets no hours,
  and the city's program pages are gone, so whether the campus fleet
  answers to the city's contract rules is unconfirmed. Polled every five
  minutes from 16:38 PDT on 21 October to 00:38, beside Spin UC Davis, its
  727 to 734 available scooters stayed available after midnight, and from
  midnight to 00:38 single scooters kept leaving their places (29) and
  turning up 140 m to 1.2 km from any that had left (17), about as often as
  from 22:30 to 23:30 (40 and 35). The code's hours bind providers that hold
  a contract with the city (§ 83.0304); the campus fleet is the university's
  [partnership with Spin](https://ipps.ucsd.edu/cpp/partners/spin.html), and
  its riders aren't stopped at midnight, so the map shows no ban there.
- **Toledo:** the city's release of 25 March 2022 moved the curfew to
  02:00–05:00, and UToledo's Veo page says midnight to 05:00, but no rule in
  force today repeats either, and the city's
  [Veo page](https://toledo.oh.gov/residents/community/veo-scooters) gives
  no hours.
- **Omaha:** Park Omaha's scooter page, run by the city's Parking and
  Mobility Division, gave "Scooter Operating Hours: 5:00 a.m. - 10:30 p.m."
  in its copy of 18 January 2025 in the Internet Archive, as news did in
  2019 and 2020. Every copy since, and the live page from Europe, answers
  403, and the city's agreements with Lime aren't published, so whether the
  hours hold in 2026 is unconfirmed. Left out until Lime's map is read there
  after 22:30.
- **Montgomery County, MD:** the 2019 pilot's sample agreement kept riders
  from starting a trip "before 5 a.m. or after 10 p.m.", and a council staff
  memo of 20 July 2022 still lists "Hours of operation 5 am -10 pm". The
  county's [program page](https://www.montgomerycountymd.gov/dot-dir/commuter/bikesharingCSS.html)
  sets no hours and names no operator, and the agreement in force isn't
  published. Left out: unconfirmed.
- **Bloomington:** the Board of Public Works passed the city's
  "Micro-Mobility Renewal Recommendations" (Resolution 2023-20) on 11 April
  2023, which by
  [Indiana Public Media](https://www.ipm.org/2023-03-30/city-recommends-additional-e-scooter-regulations)
  keep stand-up scooters off the streets from 23:00 to 05:00, April to
  October, and from 20:00 to 05:00, November to March. The city code
  (ch. 15.58) sets no hours, the city's site refused this machine on 27
  October 2026, so the resolution wasn't read, and nothing says whether
  Bird's licence of September 2025, which ran out a year later, keeps the
  hours. Left out: unconfirmed.
- **Everett:** the city code bars operating a motorized foot scooter from
  midnight to 05:00 ([§ 46.80.040(B)](https://everett.municipal.codes/EMC/46.80.040),
  "Nighttime operation prohibited", as amended by Ord. 3743-20 in 2020), but
  the city's [scooter sharing page](https://www.everettwa.gov/2461/Scooter-sharing-program)
  and its agreement with Lime of June 2025 let scooters run 24 hours a day.
  Lime's map listed 368 to 375 scooters there at each reading from 00:26 to
  04:46 on 27 October 2026, Pacific time, so Lime rents through those
  hours. Left out: the code governs riding, and neither the program nor
  Lime stops renting then.
- **Baltimore:** the Director's regulations, effective 18 June 2025, set no
  hours. A 23:00–04:00 window in summaries of the 2019 rules isn't in them.
- **Louisville:** only scooters without working lights stop after dark.
- **Washington, DC, Los Angeles, Santa Monica, Culver City, San Francisco,
  Oakland, San Jose, Seattle, Colorado Springs, Tempe, Indianapolis, Kansas
  City, Lexington, San Antonio, Arlington, Fairfax, Norfolk, Eau Claire,
  Sacramento, Mankato, Wilmington and Spokane Valley:** no hours in their
  rules. In Sacramento a councilmember's proposal on the "Regulation and
  Enforcement of E-Bikes, E-Scooters, E-motos, and Plug-in Electric
  Two-wheelers" (file
  [2026-01811](https://webapi.legistar.com/v1/sacramento/matters/21827), introduced
  24 September 2026) was on the Law and Legislation Committee's agenda of 20
  October 2026; Legistar records no action on it by 29 October, so it is
  pending and changes nothing on the map yet. San Antonio's 2019 curfew is gone. Los Angeles' 07:00–22:00 is when
  operators must fix badly parked scooters, not when they may rent them.
- **Greensboro:** since 1 March 2026 a ride started after 22:00 needs
  a "Safe Start Cognitive test", and "the device will remain locked for
  riders who are unable to pass the test"; downtown, speed drops to 10 mph
  from 01:00 to 02:00 (city news release of 16 February 2026). A test, not a
  ban. Code § 16-229 sets no hours.
- **Memphis:** the city's Operating Regulations (version of 2 July 2021) set
  no hours. A weekend curfew from 22:00 to 05:00 in Downtown and on Mud
  Island appears only in news from 2020 and 2022, and would be a district
  rule anyway.
- **Newark:** Chapter 29:29 (2023) sets no hours, and the NewarkGo rules of
  2021 leave "Hours and days of operation" to each operator's plan.
- **Reno:** the Administrative Code (§ 5.90.1180) and the city's e-scooter
  page set no hours; Bird's 2022 franchise agreement couldn't be read.
- **Phoenix:** open all day since the pilot of 1 March 2024; riders take an
  in-app test from 23:00 to 05:00 (subcommittee report of 16 October
  2024). **Ann Arbor:** a test from 22:00 to 04:00 as well, and the city's
  licence agreement with Spin sets no hours.
- **Fort Collins:** Spin stopped from 01:00 to 03:00 until the city's 2023
  annual report: "Spin expanded service hours to 24 hours per day."
- **Orlando:** the city's
  [Bike Share & Scooter Share page](https://www.orlando.gov/Initiatives/Bike-Share-Scooter-Share-Program)
  makes the Orange Avenue corridor of the Downtown Entertainment District a
  no-ride and no-park zone for shared bikes and scooters from 20:00 to 04:00
  on Fridays, Saturdays and Sundays: a district rule. City Code § 10.05 lets
  the director set hours when scooters may not be ridden; none is published.
- **Winston-Salem:** [Ordinance 2024-4](https://www.cityofws.org/DocumentCenter/View/43552/Appendix-A---2024-4)
  (4 March 2024) dropped the 2019 code's 21:00–06:00 hours, and the code's
  micromobility article (Chapter 78, Article XIV, read on 26 October 2026)
  sets none. New permits start on 5 November 2026.
- **Denver, Portland, Columbus, Berkeley, Emeryville, Davis, Tampa, Lansing,
  Fayetteville, Wichita, Manhattan, Charlottesville, Hartford, New Haven,
  Rochester, Syracuse, Akron, Cedar Rapids, West Lafayette, Carbondale,
  Spokane, West Sacramento, Tualatin, South Lake Tahoe and Arvada:** no
  hours in what was read of their rules; SIU's page says Veo runs "24 hours
  per day, seven days per week." College Park, like Durham, limits only its
  university's campus.
- **Isla Vista:** the Isla Vista Community Services District's board
  recommended in 2018 that scooters stop at 22:00 from Thursday to
  Saturday: a recommendation, not a rule.
- **Boulder:** the 2021 pilot rented scooters from 06:00 to 23:00 only, but
  the city's
  [Shared Micromobility Program page](https://bouldercolorado.gov/services/shared-micromobility-program)
  gives no hours now, and Lime's map held 800 scooters there at 03:18 MDT on
  26 October 2026.
- **Boise:** Lime's scooters and e-bikes are capped at 10 mph downtown from
  18:00 to 03:00 and at 12 mph on the Greenbelt at all hours
  ([city news, 23 October 2025](https://www.cityofboise.org/news/planning-and-development-services/2025/october/city-of-boise-strengthens-greenbelt-downtown-pedestrian-and-rider-safety-efforts/)):
  speed limits, not a ban.
- **Scottsdale:** the city's
  [bikes and scooters page](https://www.scottsdaleaz.gov/codes-and-ordinances/bikes-scooters)
  sets no hours; an Old Town rule for 23:30 to 05:00 was only proposed.
- **Salt Lake City and the University of Utah:** read on 22 October 2026,
  no rule sets hours. The City Code's chapters on shared mobility programs
  ([5.67](https://codelibrary.amlegal.com/codes/saltlakecityut/latest/saltlakecity_ut/0-0-0-76867),
  Ord. 56-20 of 2020) and on motor assisted scooters
  ([12.82](https://codelibrary.amlegal.com/codes/saltlakecityut/latest/saltlakecity_ut/0-0-0-76675))
  set none, and leave the rest to the department's rules and the city's
  contracts, none of which was found published with hours. The city's
  [Shared Mobility page](https://www.slc.gov/transportation/sharedmobility)
  gives none. On the campus, Commuter Services'
  [Biking & Rolling page](https://commuterservices.utah.edu/biking-rolling/),
  which carries the Spin program (updated 5 October 2026), and University
  [Policy 3-232](https://regulations.utah.edu/administration/3-232.php)
  (Revision 3, 15 August 2023) set none either, and Spin's zones have no
  times.
- **Not read yet:** Norman, St. George, Meridian, Stillwater, Tallahassee,
  St. Paul, Roanoke, Cleveland Heights, University Heights, South Euclid,
  University Park, South Salt Lake, Sarasota, Asbury Park, New Brunswick,
  Piscataway, Highland Park and New Rochelle.

Of these towns' rules, only South Lake Tahoe's sets a season, from 1
November through 30 April, so Lime's area there is the only Bird or Lime area
that pauses for winter (see
[Lime supplement](#lime-supplement--26-october-2026)). Chicago and Detroit
license scooters all year, Lincoln's code has no winter clause, and Lime ran
through Spokane's winter of 2025–26 (Spokesman-Review, 4 January 2026); its
May 2026 request to make that permanent was undecided as far as found on
29 October 2026, and the City's own site refuses scripts.

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
  `last_reported`, no charge, only `current_range_meters`. Its prices, one
  plan per town, are taxable, shown with "+ tax". Each scooter's link opens
  Veo's app on it through Adjust (`gmjc.adj.st`, with the scooter's number).
  Its campus feeds have short codes (`pur` for Purdue, `ksu` for Kansas State,
  `siu`, `oku`, `cvl`, `rut`); the catalog's ids name the town.
- **Lyft** writes `is_reserved` and `is_disabled` as 0 and 1, its prices as
  strings ("1.00"), and links no plan from its vehicles or their types. Its
  plan for scooters is `SCOOTER_SINGLE_RIDE`, used where the feed lists it and
  has one scooter type naming no plan. Its link is one per city, which opens
  the app's code scanner (`chi.lft.to/lastmile_qr_scan`, and
  `lyft.biketownpdx.com/lastmile_qr_scan` in Portland). No `last_reported`.
  Its systems carry the names of the cities' bike shares, Divvy and Biketown,
  and list their bicycles beside the scooters; only the scooter type is
  shown, as Lyft's.
- **Divvy** docks scooters at its stations too. Its `free_bike_status` lists
  only those left away from a station, none with a `station_id`; the docked
  ones are in `station_status`, counted by type in `vehicle_types_available`
  (type 3) without ids. At 04:11 in Chicago on 17 October, 928 were docked at
  353 of its 2,074 stations, beside 962 free-floating ones. The catalog says
  so (`"stationScooters": true`): each is shown at its station, with the
  station's link and no charge or range, at stations installed and renting.
  The same feed's `num_scooters_available`, 1,033 then, is a count of Lyft's
  own that the map does not read. Biketown's stations in Portland held no
  scooter.
- **Spin:** GBFS 2.3. Nothing in its feeds names Spin but the host:
  `system_information` calls each system "provider null" and its town, its
  operator "Bird Rides, Inc.", which has owned Spin since 2023, and gives
  Bird's apps and Bird's licence. Its `system_pricing_plans` is empty and its
  scooters carry no link, so the map shows neither. Since 23 October 2026,
  by the user's choice, a phone's "Open in Spin" opens `https://www.spin.app/`,
  whose page links both stores; no Spin host is claimed by its app, so the
  iPhone app opens Spin's App Store page (see the note on links in
  [the French audit](french-scooter-feeds.md)). Each scooter's
  `last_reported` is its own, mostly under five minutes old. Some feeds list
  e-bikes too, which are not shown.
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
