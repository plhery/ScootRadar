# Bird rider map

Since 28 October 2026 the Node cache reads Bird's rider map, signed in, where
Bird or Spin publishes no feed ([`server/birdApp.ts`](../server/birdApp.ts)),
44 areas since 5 November. Bird's scooters in the United States: Austin,
Bloomington, IN, Charlotte, Coral Gables, Harrisonburg, Jacksonville,
Knoxville, Long Beach, Mankato, Mesa, Ogden, Sacramento, Scottsdale, Wilmington, NC,
Winona and Yonkers. Spin's: Auburn, AL, Baton Rouge, Canton, OH, Greeley,
Greenwood Village, CO, Kent, OH, Moscow, ID, Pullman, San Diego State and
Santa Monica. Bird's in Canada:
Brampton, Cochrane, Cranbrook, Kamloops, Lethbridge, Medicine Hat,
Mississauga, Okotoks, Oshawa, Penticton, Pickering, Spruce Grove (with
Stony Plain), St. Albert and Vernon. Bird's in Spain: Getafe and Oviedo.
Bird's in Portugal: Covilhã. Bird's in Austria: Innsbruck.
The user asked for it on 27
October 2026, after [the research reader](../scripts/bird-app-map.mjs) had
shown the map's decoys could be told from real replies. Everything Bird
and Spin publish stays read from their public feeds at `mds.bird.co` and
`gbfs.spin.pm`, but for Getafe, whose feed lists fewer than half of its
scooters ([Europe](#europe-november-2026)). Rome's feed leaves out more than
a quarter of them in the centre, which its map adds
([below](#rome-adds-the-scooters-its-feed-leaves-out)).

## What the cache reads

Each market is one of Bird's operating areas, its `OPERATIONAL_AREA` outline
from `GET /area/nearby`, stored in
[`data/bird-app-areas.json`](../data/bird-app-areas.json) and named by its
system's `birdAppArea`. `GET /bird/nearby` lists the 250 rentable vehicles
nearest a point within 5 km, nearest first, so the cache sweeps an area as
BinBin's ([`server/nearestSweep.ts`](../server/nearestSweep.ts)): until every
point of its outline lies within a reply that listed every vehicle that near.
A sweep is planned from the positions the last one published. Only the
system's own brand is kept, inside the outline and the system's service
areas (its `areas`, or its bounds): Bird's app shows Spin's fleet
too, which a Spin system (`spin_us_app_*`) keeps where Spin has no public
feed, and Spin's public feeds supply elsewhere. Each scooter keeps its battery
charge and range. The map gives no position time, so a scooter's is that of
the last reply that listed it, and the sweep's the start of it. A sweep may
take longer than the 15 minutes a position is shown, as Austin's of 22
minutes below: when it ends, the scooters of its last 15 minutes show live,
and those it read before stand faded where they were last seen. The answer's
time is the oldest of those live, which moves on as they grow old, but the
app's read (`meta.shownSince`) is when the sweep's last reply came, until
another sweep ends: a walk tells a second read without its scooter by it, and
from 10 to 14 November 2026 said a scooter one sweep missed was taken a minute
and a half later (Android review of 14 November, S2).

Every reply is checked as the research reader checks it, and Spin's brand is
accepted beside Bird's: the cells it answers for, and for each vehicle a UUID
seen once, a known brand, a 32-character area key, a position within the
radius, nearest first. A reply that fails any check stops the sweep and every
Bird request for 15 minutes; the area keeps its last sweep under the usual
expiry rules. HTTP 403 or 429 holds requests for at least as long, or for
the `Retry-After` Bird asks, up to six hours.

## Pace and budget

One client serves every area, and Rome's additions (`BIRD_PACE`). Since
10 November 2026 a town someone opens has up to ten requests a minute, at
once, and all requests together no more than 30 in any five minutes and 120
in any hour. An idle sweep keeps a request every 30 seconds
(`BIRD_QUERY_INTERVAL_MS`) and waits once 20 have started in five minutes, or
90 in the hour, which leaves the rest to the towns someone opens. Until then
every request came 30 seconds after the one before: a town opened waited for
its first scooters 38 seconds at the median from 8 to 10 November, and
Austin's sweeps of 31 to 37 requests took 17 to 39 minutes.

On 27 October 2026 the map made up its scooters twice, both times after
about 200 requests: in eleven minutes 2.5 to 3 seconds apart, and in 23
minutes six seconds apart (20:52 and 21:48 UTC). Its limit counts requests
over some period, not their pace, and it is not published; 120 an hour is
about half what it took. On 10 November 2026, from 22:28 UTC, the research
account's map answered 66 requests in 44 seconds, up to four at once, with
real scooters: Austin's 2,844 in 45 requests and 31 seconds, where the
cache's sweeps found 2,846 to 2,874 that day. A minute later a second run, a
request every two seconds, had Bird's API refuse the Mac's address after 139
requests in four minutes (HTTP 403 in 15 ms, 22:32:10 UTC), while Bird's
public feeds (`mds.bird.co`) still answered it. So 30 in five minutes is
under a quarter of what that firewall let through.

An area nobody looks at is swept once a day (`BIRD_IDLE_INTERVAL_MS`), between 08:00 and 21:00 in its town, and expires
two hours after a day without a sweep (`BIRD_IDLE_GRACE_MS`): its turn falls at
the same time each day, but its sweep ends after those queued before it and its
own 1 to 50 minutes, and a deploy stops the sweeps under way. With ten minutes,
as before 9 November 2026, 15 of 240 days' sweeps over nine days ended too late.
That night Scottsdale's waited for Austin's of 27 minutes and two others, then
deploys at 23:43 and 23:57 UTC stopped it, and it ended 58 minutes late and
Spin's Kent's, after it, 48: Sentry heard of both as stopped
(SCOOTRADAR-CACHE-6B). A request keeps an area watched for
three minutes (`BIRD_WATCH_MS`), and a watched area is swept again five
minutes after its last sweep began, or when that ends
(`BIRD_WATCHED_INTERVAL_MS`). Only one sweep of an area in half an hour goes
at an opened town's pace (`BIRD_BURST_EVERY_MS`); the next, while it stays
watched, keep an idle sweep's. Austin swept again at that pace as each sweep
ends would spend the hour's 120 in twenty minutes and leave the other towns
none for forty.
The 44 areas took about 300 requests, so a day's round of them all takes
about 150 of the client's 1,440 minutes.
While it is, its last positions, up to a day old, stand faded. A starting
cache waits two minutes, while the cache it replaces may still be sweeping,
then counts that cache's requests of the last hour against its own budgets:
every request saves them as `tmp/bird-pace.tmp` beside the snapshot, as two
caches each with an hour of its own would double the rate.
Each sweep is saved after every reply, with where it stood and the scooters
it had found, as `tmp/bird-sweep.<area>.tmp` beside the snapshot (the host's
backup skips it, as it does the snapshot's own temporary files), and removed
when it ends: the new cache, once its two minutes are over, goes on with a
sweep the deploy stopped, from its start, if saved within ten minutes
(`BIRD_CHECKPOINT_MAX_AGE_MS`), rather than starting it again. It is as old
as its start: the map shows what it finds only within 15 minutes of that
start, as any sweep under way, and once it ends, the scooters it read in its
last 15 minutes live.
Rome's additions take about 24 requests every two hours by day, about 170 a
day, and 24 every half hour while someone looks at Rome, at an opened town's
pace: about three minutes of each 30, twelve before 10 November 2026
([below](#rome-adds-the-scooters-its-feed-leaves-out)).

Production and research share an account's limit, and renewing rotates its
refresh token. So research runs on an account of its own since 1 November
2026, with its own device, kept outside the repository, and never on the
session the cache holds.

| Area | Scooters | Requests | Time | Swept |
| --- | ---: | ---: | ---: | --- |
| Indianapolis (check against the public feed) | 580 | 21 | 121 s | 21:41 UTC |
| Yonkers | 811 | 13 | 73 s | 21:44 UTC |
| Jacksonville | 271 | 6 | 36 s | 21:45 UTC |
| Charlotte | 802 | 20 | 120 s | 21:46 UTC |
| Austin | 3,222 | 46 | 1,351 s | 22:09 UTC |
| Wilmington, NC (UNC Wilmington) | 87 | 1 | 0 s | 22:53 UTC |
| Mankato (Minnesota State University) | 46 | 1 | 30 s | 22:53 UTC |
| Okotoks | 47 | 1 | 30 s | 22:54 UTC |
| Cranbrook | 19 | 1 | 30 s | 22:54 UTC |
| Penticton | 26 | 1 | 30 s | 22:55 UTC |
| St. Albert | 38 | 4 | 120 s | 22:55 UTC |
| Spruce Grove and Stony Plain | 50 | 3 | 90 s | 22:57 UTC |
| Medicine Hat | 44 | 4 | 120 s | 22:59 UTC |
| Cochrane | 69 | 4 | 120 s | 23:01 UTC |
| Oshawa | 117 | 4 | 120 s | 23:03 UTC |
| Vernon | 101 | 4 | 120 s | 23:05 UTC |
| Sacramento | 72 | 4 | 120 s | 23:07 UTC |
| Lethbridge | 212 | 4 | 120 s | 23:09 UTC |
| Kamloops | 158 | 7 | 210 s | 23:11 UTC |
| Bloomington, IN | 267 | 4 | 120 s | 23:14 UTC |
| Brampton | 135 | 11 | 300 s | 23:17 UTC |
| Mississauga | 103 | 17 | 510 s | 23:22 UTC |
| Pickering | 36 | 12 | 330 s | 15:14 UTC, 1 November |
| Knoxville | 303 | 8 | 240 s | 23:03 UTC, 2 November |
| Baton Rouge (Spin, LSU) | 165 | 1 | 30 s | 23:04 UTC, 2 November |
| Coral Gables | 189 | 5 | 150 s | 23:13 UTC, 2 November |
| Harrisonburg | 238 | 4 | 120 s | 23:19 UTC, 2 November |
| Ogden | 108 | 4 | 120 s | 23:27 UTC, 2 November |
| Auburn, AL (Spin, Auburn University) | 120 | 1 | 30 s | 23:27 UTC, 2 November |
| Greeley (Spin) | 16 | 1 | 30 s | 23:29 UTC, 2 November |
| Canton, OH (Spin) | 14 | 4 | 120 s | 23:31 UTC, 2 November |
| Mesa | 90 | 10 | 300 s | 23:36 UTC, 2 November |
| Scottsdale | 170 | 28 | 840 s | 23:53 UTC, 2 November |
| Kent, OH (Spin, Kent State) | 140 | 2 | 60 s | 23:54 UTC, 2 November |
| San Diego State (Spin) | 195 | 1 | 30 s | 23:54 UTC, 2 November |
| Pullman (Spin, Washington State) | 262 | 5 | 150 s | 23:57 UTC, 2 November |
| Winona | 28 | 2 | 60 s | 23:58 UTC, 2 November |
| Moscow, ID (Spin, University of Idaho) | 107 | 2 | 60 s | 00:01 UTC, 3 November |
| Greenwood Village, CO (Spin, with Meridian) | 160 | 2 | 60 s | 04:33 UTC, 4 November |
| Santa Monica (Spin, with Bird's) | 616 | 14 | 420 s | 04:40 UTC, 4 November |
| Oviedo | 359 | 9 | 240 s | 14:59 UTC, 4 November |
| Getafe | 190 | 4 | 120 s | 15:07 UTC, 4 November |
| Long Beach | 974 | 18 | 510 s | 21:59 UTC, 4 November |
| Covilhã | 184 | 1 | 30 s | 22:01 UTC, 4 November |
| Innsbruck | 178 | 2 | 30 s | 17:33 UTC, 5 November |

The last twenty-two were swept with the production code on the research
account, a request every 30 seconds, in the ride checks below. The others were swept with the production code on 27 October 2026, the first four a
request every six seconds, the others at the production pace after Bird's map
had answered real scooters again at 22:04 UTC: 165 requests in 87 minutes
from then, the town search below included, and every reply checked. In Indianapolis, which Bird also publishes, its public feed
listed 586 available scooters inside the same outline two minutes later; 582
of them stood within 50 m of one the sweep found, 568 within 10 m. Only one
scooter of Bird's public New York feed stood inside the Census Bureau's Yonkers line.

## Session

The cache reads mode-0600 `/data/bird-session.json`, owned by its Node UID
(1000); `BIRD_SESSION_PATH` overrides the path for local checks. Its format:

```json
{"version":1,"deviceId":"<app device UUID>","accessToken":"<JWT>","refreshToken":"<JWT>"}
```

Keep it in that private volume, never in Git, catalogs, build variables, logs
or fixtures. An access token lasts a day; an hour before it expires the cache
renews it with `POST https://api-auth.prod.birdapp.com/api/v1/auth/refresh/token`
and its refresh token, which lasts about six months, and saves the result
atomically, unless a new login was seeded meanwhile. Seed a new login before
the refresh token expires. A missing or broken session fails every Bird feed
with "Bird session credentials are missing or unreadable".

## Finding the markets

On 27 October 2026, `GET /area/nearby` within 25 km of US and Canadian towns,
largest first, listed each town's operating areas, and a nearby read at each
new area's centre counted its scooters. The towns already in Bird's or Spin's
public feeds were left aside: Los Angeles, the Bronx and Queens, Dallas, San
Antonio, Phoenix (Spin's), Columbus (Spin's), San Francisco (Spin's),
Indianapolis, Calgary, Edmonton and Ottawa. Areas with `hide_birds`, as
Ottawa's "Collection Nest" warehouses, and areas a few metres wide, as
Indianapolis' fleet managers' homes, are no markets. Toronto, Montréal,
Houston, San Jose, Chula Vista, Washington, Vancouver, Oklahoma City and
Seattle had operating areas without a scooter within 3 km of their centres;
Seattle revoked Bird's permit in March 2026, and we found no 2026 Bird
permit in San Jose, where the City permitted Lime in March 2026. That
search was stopped after the 33 largest of the 1,189 towns it had queued,
and a read at a centre clears a small area only, as 1 November showed below.
That evening, from 22:32 to 22:53 UTC, the same search, an area read every 30
seconds and a scooter read within 5 km of each new area's centre, went
through 25 towns where Bird was said to run without a feed: the Canadian
towns of [Coverage gaps](coverage-gaps.md) and the American ones a search
of the web had named. Fifteen had an operating area with scooters, all in the
table above with Brampton and Mississauga, found by the first search.
Airdrie's and Chestermere's areas, 9 and 7 km across, had no scooter within
5 km of their centres, nor Pickering's, 29 km across, its centre 8 km north
of the town's. Laval, Red Deer, Regina, Springfield,
MO, Pocatello, Athens, OH, Abilene and Amarillo with Canyon had no area at
all. Bird Canada's list names none of Laval, Red Deer, Regina, Airdrie or
Chestermere.
Wilmington's and Mankato's areas are their universities' campuses, so each
town's centre on the map is its campus.

The area list reaches about 9 km, whatever the radius asked. In the 58 reads
above, the farthest area listed began 9 km from the point read, and Laval,
12.8 km from the edge of Montréal's nearest area, listed nothing at 25, 100
or 500 km alike (1 November 2026). So a read clears its own town and no
further, and a search must read every 8 km or so.

On 1 November 2026, on the research account, the areas left unchecked were
swept whole with the production code: 94 requests from 15:08 to 15:55 UTC.
Pickering's held 36 scooters, in the town's south, and Oklahoma City's 43,
downtown, each missed by the read at its area's centre; both went on the
map, and Oklahoma City's came off on 3 November, as its scooters were hardly
ridden (below). Airdrie's, Chestermere's, Vancouver's two, Chula Vista's, San Jose's
two, Washington's own, Alexandria's (3 on 27 October) and Montréal's held
none. An unnamed area of 60 km around Washington held 150, around George
Mason University, 144 of them inside Bird's public Fairfax feed: no new town.
Houston's and Toronto's areas are a few hundred metres across, so their
centre reads cleared them, and Seattle's permit is revoked, so it was left out.

From 16:07 UTC on 1 November 2026 to 16:23 on 2 November, the research
account read the area list at 3,598 towns from GeoNames, every American town
of 15,000 people or more and every Canadian one of 8,000, largest first,
skipping a town within 8 km of a point already read: 2,241 reads, 30 seconds
apart. They listed 265 operating areas outside our Bird and Spin feeds. A
scooter read at each one's centre found scooters in 38. The areas at least
1.5 km across where it found some, and those at least 6 km across where it
found none, were then swept whole with the production code, 97 areas in all:
62 held no scooter, 8 held one to six, and 27 held ten or more, which went to
the ride check below. One reply in Columbia, Missouri, listed a scooter of a
third brand (`71ccde24…`, a Bird partner's): the check stopped the search for
15 minutes, as it should, and the brand is accepted by the research reader
since, though not by the cache, which keeps only Bird's and Spin's.

## Which fleets are ridden

A fleet on the map is not always one people ride. On 16 October 2026, in 71
minutes, 7.5% of Atlanta's Bird scooters and 12.3% of Indianapolis' left
their places, but 0.4% of Orlando's and 1.8% of UCF's, which were left out
then. The bar is that riders use a fleet at all, not its size. Between two
whole sweeps of an area, scooters are matched one to one within 30 m: one
without a match has left, and one that turns up more than 150 m from any
scooter of the first sweep was ridden or taken there.

The 27 areas with ten scooters or more were swept twice on Monday 2
November 2026, from 16:30 and from 23:00 UTC (6.5 hours):

| Area | Scooters | Left | Arrived over 150 m away | Added |
| --- | ---: | ---: | ---: | --- |
| Knoxville | 301 → 303 | 90 (30%) | 14 | yes |
| Baton Rouge (Spin) | 170 → 165 | 71 (42%) | 19 | yes |
| Harrisonburg | 253 → 238 | 94 (37%) | 20 | yes |
| Canton, OH (Spin) | 17 → 14 | 7 (41%) | 2 | yes |
| Coral Gables | 197 → 189 | 57 (29%) | 8 | yes |
| Moscow, ID (Spin) | 113 → 107 | 32 (28%) | 6 | yes |
| Mesa | 99 → 90 | 27 (27%) | 8 | yes |
| San Diego State (Spin) | 202 → 195 | 53 (26%) | 2 | yes |
| Kent, OH (Spin) | 115 → 140 | 29 (25%) | 17 | yes |
| Pullman (Spin) | 257 → 262 | 59 (23%) | 5 | yes |
| Auburn, AL (Spin) | 125 → 120 | 24 (19%) | 6 | yes |
| Greeley (Spin) | 16 → 16 | 3 (19%) | 3 | yes |
| Winona | 28 → 28 | 5 (18%) | 3 | yes |
| Scottsdale | 180 → 170 | 31 (17%) | 9 | yes |
| Ogden | 112 → 108 | 17 (15%) | 7 | yes |
| Alafaya (UCF) | 346 → 339 | 54 (16%) | 1 | no |
| Chandler | 63 → 63 | 8 (13%) | 3 | no |
| South Miami | 24 → 22 | 3 (13%) | 1 | no |
| West Minneapolis (Spin) | 13 → 13 | 1 (8%) | 1 | no |
| Wheeling | 45 → 44 | 3 (7%) | 2 | no |
| Idaho Falls | 129 → 127 | 8 (6%) | 2 | no |
| Owatonna | 67 → 67 | 4 (6%) | 2 | no |
| St. Petersburg (Spin) | 174 → 169 | 8 (5%) | 0 | no |
| Bismarck | 214 → 214 | 9 (4%) | 7 | no |
| Sheboygan | 174 → 172 | 7 (4%) | 2 | no |
| Bridgewater, VA | 28 → 28 | 0 | 0 | no |
| Bakersfield | 75 → 75 | 0 | 0 | no |

The fifteen where 15% or more left and at least two turned up far from any
earlier scooter went on the map on 3 November. On the Sunday before, 4.5
hours apart, Knoxville (21% left) and Baton Rouge (18%) already moved more
than St. Petersburg (8%) and Chandler (4%), and an overnight window had
Harrisonburg, Mesa, Auburn and Greeley moving too. UCF's scooters stirred
within 150 m of where they stood; St. Petersburg's Spin fleet, beside the
city's public feeds, and Bakersfield's barely moved. Coral Gables' area
reaches east into Miami's Coconut Grove, where Bird's public Miami feed,
left out as unridden in October, lists a few scooters: both sides moved, 42
of 163 west of Douglas Road and 15 of 34 east of it.

Bird's earlier areas, read through production a day apart (1 to 2
November), were ridden too: Austin 36% left, Charlotte 40%, Jacksonville
32%, Mankato 57%, Sacramento 35%, Wilmington 60% and Yonkers 38%, and in
Canada Brampton 51%, Kamloops 17%, Lethbridge 22%, Mississauga 19%, St.
Albert 16% and Vernon 48%. Bloomington's re-read on 3 November found 58 of
278 gone since its last daily sweep. Cochrane, Cranbrook and Okotoks had
emptied for the winter, and Oshawa fell from 38 to 11. Oklahoma City's
scooters, 3 of 43 leaving in about 20 hours and 7 of 57 the next day, came
off. Recheck the left-out areas in spring, when fleets and riders come
back ([coverage gaps](coverage-gaps.md)).

### Where an area meets our feeds, November 2026

The searches above left aside the areas our Bird and Spin feeds cover. On 3
November 2026 the research account read a centre of each of those areas
and matched the map's scooters to the cache's, 40 m apart. Three held
scooters the cache lacked, and each was swept whole twice, from 21:54 UTC
on 3 November and from 04:25 UTC on 4 November (6.5 hours):

| Area | Scooters | Left | Arrived over 150 m away | Added |
| --- | ---: | ---: | ---: | --- |
| Santa Monica (Spin) | 364 → 341 | 121 (33%) | 31 | yes |
| Greenwood Village (Spin) | 96 → 94 | 15 (16%) | 9 | yes |
| Long Beach | 968 → 932 | 126 (13%) | 14 | yes, after 24 hours |

- **Santa Monica:** Bird's area holds Bird's fleet, which Bird's public
  Santa Monica feed gives (all but 21 of 318 within 40 m of the cache's), and
  Spin's, which Spin's public Santa Monica feed lists none of: 364 scooters,
  361 in the city and 3 in Pacific Palisades. Bird's own left at the same
  rate, 31%. The City moved its shared-mobility program from contracts to
  permits in July 2025, and Spin has been one of its operators, permitted
  700 scooters
  ([Santa Monica Daily Press](https://www.smdp.com/city-hall-could-allow-fewer-scooter-companies-to-operate-in-santa-monica)).
- **Greenwood Village:** the area of Spin's Meridian, CO, runs from
  Meridian north to Belleview Avenue. Spin's public Meridian feed lists the
  scooters south of County Line Road (39.566° N), the Douglas County line,
  and none of the 96 north of it, about the Denver Tech Center: 68 in
  Greenwood Village and 28 in unincorporated Arapahoe County, by
  OpenStreetMap. Denver South and five metro districts started a $1-a-ride
  Spin pilot there in October 2026, through September 2027
  ([Axios](https://www.axios.com/local/arapahoe/2026/10/26/denver-south-electric-scooter-pilot)).
  `spin_us_app_greenwood_village` sweeps the whole area and keeps, by its
  one service area, the scooters north of 39.567° N; Meridian's stay with
  Spin's feed. The service area's bounds are the outline's from that line
  north, set by hand: the update script sets a system's own bounds only.
- **Long Beach:** Bird is one of the City's two permitted operators, with
  Lime ([coverage gaps](coverage-gaps.md)). Its 968 scooters, which no
  feed of ours has, moved: 126 left and 14 turned up far from any earlier
  one. That was under the bar, so the area was swept again 24 hours after
  its first sweep, from 21:50 UTC on 4 November: 219 of the 968 (23%) had
  left and 27 of the 974 turned up far from any earlier one, so
  `bird_us_app_long_beach` reads it since 5 November. Its outline overlaps
  the box of Bird's public Los Angeles feed, which lists none of its
  scooters.

### Europe, November 2026

On 3 November 2026, from 21:24 UTC, the research account read the area list
at 11 European towns where Bird was said to run without a public feed. From
04:41 UTC on the 4th it reads every town of 15,000 people or more in Spain,
Portugal, Italy, France, Switzerland and Israel, largest first, as the
American search did, and compares each new area's scooters with the cache's
within 40 m: all 2,151 towns, with 164 new areas, by 16:56 UTC. The
candidates were swept whole twice, from 08:30 and 14:55 UTC on 4 November
(6.4 hours), and the two found later, Vichy and Covilhã, from 15:09 and
15:37 UTC and again at 22:01 UTC (6.9 and 6.4 hours):

| Area | Scooters | Left | Arrived over 150 m away | Added |
| --- | ---: | ---: | ---: | --- |
| Oviedo | 327 → 359 | 50 (15%) | 21 | yes |
| Getafe | 183 → 190 | 30 (16%) | 5 | yes |
| Covilhã | 183 → 184 | 28 (15%) | 6 | yes |
| Vichy | 282 → 282 | 32 (11%) | 8 | no |
| Funchal | 188 → 201 | 5 (3%) | 1 | no |
| Murcia | 3 → 3 | | | no |
| Lausanne | 0 → 0 | | | no |

- **Oviedo:** Bird has run the city's service since June 2025, on a
  four-year concession announced with 200 scooters, and publishes no feed
  (`oviedo` answers 404).
- **Getafe:** Bird's public `madrid` feed, which the catalog read as
  Getafe's, listed 80 scooters while the area held 183. 93 of these had none
  of the feed's within 40 m, in the town centre, in the south and among the
  feed's own in the industrial estates, and they were the ridden ones: 23
  of them left, against 7 of the 90 the feed listed, and 4 of the 5 far
  arrivals were not in the feed. Of the feed's 81 at 15:10 UTC, 14 were not
  on the map, 5 of them on one spot, as at a depot. `bird_es_app_getafe`
  reads the area whole, in place of the feed.
- **Covilhã:** Bird's area holds the town, 183 scooters on 4 November,
  none in a feed of ours, and Bird publishes no feed for it. It just cleared
  the bar: 28 left and 6 turned up far from any earlier one. We found no
  council or press notice of the service.
- **Funchal** was hardly ridden in early November; recheck it in spring.
- **Rota:** Bird's public `rota-spain` feed, which MobilityData's list
  lacks, listed 273 to 283 scooters on 3 and 4 November 2026, but in 17.5
  hours 28 left and 1 turned up far from any earlier one, so it stays out.
  The rider map has its area too ("Cadiz - Operational Zone"). Swept whole
  at 22:03 UTC on 4 November it held 282 scooters, and 277 of them stood
  within 40 m of one of the feed's 278 at 23:30 UTC: the feed is current,
  and Rota is quiet in November. Recheck it in spring.
- **Vichy:** Bird's public Vichy feed listed 105 to 108 scooters on 4
  November while the rider map held 282 in its area. Unlike Getafe's, the
  feed lists the ridden ones: read at 21:58 and 22:00 UTC, it had 17 of the
  32 scooters that arrived since 15:09, against 86 of the 250 that stayed,
  so the 179 it left out barely moved (15 arrived). Vichy keeps its feed.

Bird's public Naples and Rome feeds also list fewer scooters than its map: on
4 November, 12 to 17% of the scooters the map held near the centres of
Naples' area and Rome's west one had none of the cache's within 40 m. On 8
November the research account read the 250 scooters nearest three centres
at 11:25 and again at 20:56 UTC (9.5 hours), each time just after asking
the cache for the same circle:

| Circle | Feed's, of the map's 250 | Moved away: listed | Moved away: left out | Arrived over 150 m away, listed |
| --- | ---: | ---: | ---: | ---: |
| Naples (2.1 km) | 223 → 224 | 27 of 207 (13%) | 1 of 27 (4%) | 4 of 4 |
| Rome, by the Vatican (1.7 km) | 189 → 186 | 61 of 183 (33%) | 25 of 57 (44%) | 10 of 10 |
| Rome, east of the centre (2.1 km) | 249 → 250 | 113 of 239 (47%) | 1 of 1 | 18 of 18 |

- **Naples:** as in Vichy, the scooters the feed leaves out stand idle: 25
  of the 27 stood where they had, still left out, and none of the listed
  ones that stayed dropped out. All 26 left out at 20:56 had a `bounty_id`,
  a task Bird sets its chargers, against 40 of the 224 listed, and their
  batteries' median was 51%, against 81%. Naples keeps its feed as it is.
- **Rome, by the Vatican:** the feed leaves out ridden scooters, a quarter
  of the map's there in both reads. The left-out ones moved away more than
  the listed ones, and 18 listed scooters that had not moved were left out
  at 20:56, while 2 went the other way, so it is not the same scooters each
  time. That evening the research account swept Bird's two Rome areas
  whole, the west one (the centre and west of the Tiber) from 21:52 to
  22:00 UTC in 18 requests, the east one from 22:02 to 22:18 in 33, and
  read the feed at the end of each. Of the map's scooters within 4.5 km of
  the system's centre (41.9028, 12.4964, by Piazza Venezia), 490 of 1,673
  had none of the feed's within 40 m, one each, 60 to 70% in the first
  kilometre, against 62 of the 1,704 farther out (4%, about what moved
  while the sweeps ran). The gap ends sooner east of the centre, 3 km out,
  than west of it, where 27% were missing 3 to 4 km out, so the 250
  scooters nearest a point east of the centre, within 2.1 km of it, had
  missed one of the map's, then none. The cache adds them (below).

#### Rome adds the scooters its feed leaves out

Since 8 November 2026 `bird_it_rome` is read from its public feed as before,
and Bird's map adds the scooters the feed leaves out within 4.5 km of its
centre ([`server/birdSupplement.ts`](../server/birdSupplement.ts)). Its
`birdAppSupplement` names both Rome areas and the distance, and the cache
sweeps the part of them within it, clipped to a 64-sided circle, every two
hours between 08:00 and 21:00 in Rome while nobody looks, every 30 minutes
while someone does, never twice at once, through the client every area
shares. Replayed over the scooters of 8 November, such a sweep took 20 to 22
requests where the west area whole took 15 or 16 of its 18, so about 24.
In production the first, from 22:50 to 23:34 UTC on 8 November, took 25,
spaced out by the sweeps the restart had made due elsewhere while nobody
looked at Rome: it found 1,679 scooters and added 543 to the feed's 3,161,
and from the Vatican to Trastevere (41.896 to 41.910 N, 12.452 to 12.478 E)
the map showed 155 where it had shown 64, against the research map's 165 at
22:00.
The map's scooters that none of the feed's stood within 40 m of, one each, on
the first fresh read after a sweep, are added as `bird:<id>` for as long as
none of the feed's stands on one, and for at most two and a half hours after
the sweep. A scooter the feed listed then is not
added later on its old spot once ridden away, while one added and ridden away
stands until the next sweep. The last sweep, its scooters and those it added,
is saved beside the snapshot in `bird-supplements.json`, with it every minute
and on shutdown, and a restart takes it back while its additions stand, its
next sweep due as before: a deploy no longer drops the additions until a new
sweep has ended, by night until someone looks at Rome and that sweep, 12 to 45
minutes, has ended. While the map cannot be read the feed stands as
it is, and Sentry hears once two sweeps in a row have failed
(`bird-supplement:bird_it_rome`). The areas' rings, 15 and 68, are in
[`data/bird-app-areas.json`](../data/bird-app-areas.json), from the European
search of 4 November.

### The rest of the world, November 2026

On 5 November 2026 the research account read the area list the same way at
212 towns in 56 other countries, the three or six largest of each, its
capital and a few towns where Bird or Spin ran, from 03:33 to 05:27 UTC, and
then at every town of 50,000 people or more in 26 European countries, from
Turkey and Britain to Cyprus and Luxembourg, 1,236 towns, from 08:53 to
17:19 UTC: 1,057 reads, the other towns within 8 km of a point already
read. They listed 119 new operating areas, 62
of them more than minor. Two held more than a scooter within 5 km of their
centres, and were swept whole twice:

| Area | Scooters | Left | Arrived over 150 m away | Added |
| --- | ---: | ---: | ---: | --- |
| Innsbruck | 178 → 178 | 45 (25%) | 24 | yes |
| Vienna | 31 → 31 | 0 | 0 | no |

- **Innsbruck:** Bird's area, unnamed and about 9 km from west to east,
  holds the city; it was swept at 11:01 and 17:33 UTC (6.5 hours). Bird
  publishes no feed there. Its scooters are not another operator's under
  Bird's name: 33 of the 178 stood within 5 m of one of Dott's or Voi's, as
  scooters sharing the city's marked parking places do, where 8% of Voi's
  stood that near one of Dott's.
- **Vienna:** 31 scooters spread one by one across the city, swept at 08:03
  and 14:26 UTC (6.4 hours), and none moved. The City's 2023 tender went to
  Bird among others, but by February 2024 only Lime and Voi were left, the
  [Vienna guide](../src/guides/de/e-scooter-wien.ts) says.

Espoo's and Vantaa's areas held one scooter each. The others held none
within 5 km of their centres: Munich, Würzburg and Reutlingen, Antwerp,
Brno (YoYoWay's), Tallinn (Prime's), Budapest (Bird Fly's), Bucharest,
Helsinki and Leppävaara, ten Finnish towns' areas, most called "Fake Ops
Area", Nicosia, Limassol, Larnaca, Rhodes (Nemo Scooters'), Istanbul,
İzmir, Antalya and Adana (Seven Group's), Mexico City, Tijuana, Seoul,
Riyadh, Jeddah, Doha and its Asian Cup stadiums, San Juan and Skootel's
Puerto Rico areas, and test areas in Liverpool and Newcastle. London's area
lists vehicles within 5 km of its centre, but no scooter.

A centre read clears 5 km only, so on 6 November, from 07:30 to 08:39 UTC,
the production code swept whole the 44 areas 6 to 60 km across that a centre
read had left with a scooter or none, here and in the European search, where
no feed of ours covered them: 138 requests. Helsinki's held 3 scooters,
Espoo's, Vantaa's and Santarém's one each, and the others none, Bucharest's,
Munich's, Antwerp's, Doha's, Seville's and Verona's among them. Mexico City's
and San Juan's had been swept whole on 5 November, at 17:46 and 17:48 UTC,
and held none. The partners' areas named above were not swept, nor Finland's
Fake Ops areas, Switzerland's, whose towns read Bird's own feeds, London's
and Barcelona's, whose reads were full, and the areas larger than 60 km:
Jeddah's, one of Doha's, Riyadh's, Seoul's and a default area of thousands
of kilometres.

In Békéscsaba a read listed a brand the reader did not know (`9b2c8a73…`):
the search stopped for 15 minutes, as it should, and the research reader
accepts the brand since, as it does those of two Bird partners, though the
cache does not.

Bird's only ridden European fleets being in Spain, Portugal, Italy, France,
Switzerland, Israel and Austria, the search went on there to every town of
5,000 to 14,999 people: 1,637 reads from 10:37 UTC on 6 November to 00:59 UTC
on the 7th, then 74 in Austria to 01:38 UTC. They listed 12 new areas, three
of them minor (a helmet test area and a warehouse in Rome, a service centre in
Turin). Only Pájara's area at Costa Calma held scooters within 5 km of its
centre, 119, each within 40 m of one in Bird's public Pájara feed.
Anguillara Sabazia's, Riano's, Corralejo's and Fiumicino's two held none, nor
did the test area by Buchs, swept whole on 6 November as Feldkirch's.
Águeda's two, 21.5 and 12.3 km across, held none either when swept whole from
01:38 to 01:43 UTC.

[`scripts/update-bird-areas.mjs`](../scripts/update-bird-areas.mjs) refreshes
the stored outlines, a request per area, with a private session.

## The earlier rejection was too strong

The first investigation found real data: 3,454 vehicles across Austin and
582 across Indianapolis, whose public GBFS feed independently confirmed the
positions. At about 20:52 UTC, during a sequence of requests to different
cities, the map began returning synthetic vehicles. These replies had no
brand, invented area and operator identities, and positions on a line
northeast of the query, including in towns without Bird service. A repeat in
Austin at 20:58 UTC was still synthetic. An empty reply at 20:59 had the
same missing metadata.

That established a bad response, but did not establish that moving between
cities caused it, that the account was permanently flagged, or that the app
could never be a source. Those conclusions in the earlier coverage note
have been withdrawn.

The **same credentials and device identity**, without renewal, another login
or an account change, subsequently returned real data. At 21:01 UTC the
cell endpoint returned 1,000 Austin vehicles; 987 IDs matched the earlier
full-area audit. At 21:04 the original nearby helper, with its original
headers, returned branded vehicles and cell metadata in Austin, Charlotte
and Indianapolis, about 3.5 seconds apart. Thus location jumps alone did not
reproduce the failure. The trigger and recovery period remain unknown. A
temporary request limit or client-header treatment is a hypothesis, not a
finding; several header experiments coincided with recovery and cannot
isolate the cause.

Synthetic Bird replies were also reported by
[WoBike's original investigators](https://github.com/ubahnverleih/WoBike/issues/192#issuecomment-765939688)
in 2021, where a missing User-Agent was implicated. A
[2022 report](https://github.com/ubahnverleih/WoBike/issues/242) describes a
similar symptom with a User-Agent present. Neither establishes the cause
of the October 2026 incident.

## Current app evidence

Static inspection used Android `co.bird.android` 4.420.0.2, version code
908540, published by Blue Jay Transit Inc. The APK was obtained from
APKPure for research, not installed or executed. `apksigner verify`
succeeded. Its certificate SHA-256 was
`BD:0B:C0:56:CB:01:83:83:7E:10:D3:86:D8:C1:81:B6:44:4F:C4:17:4E:D8:BA:DC:D0:D7:29:5C:20:4F:CD:91`,
matching Bird's [app-link association](https://go.bird.co/.well-known/assetlinks.json)
and its [Google Play package](https://play.google.com/store/apps/details?id=co.bird.android).

The app's request builder uses `App-Name: bird`, `App-Type: rider`,
`Platform: android`, `App-Version`, `Device-Id`, bearer authorization,
and a JSON `Location` header. Its User-Agent format is
`Bird/4.420.0.2 (co.bird.android; release; Android - 15)`. The research
reader reproduces that verified version. The Location header and queried
point remain necessary: omitting Location returned 400; a zero location
with the app's CDN-location fallback did not yield verified map data.
A Charlotte cell requested with Location still in Austin returned an
unverified empty reply. The reader rejects it.

The app's map configuration enables level-12 S2 cells, 16 per request,
with a 60-second local cache lifetime. The authenticated map reads are:

- `GET /bird/nearby?latitude=…&longitude=…&radius=…`: up to 250 nearest
  vehicles, with the radius in metres. The tested useful radius is at
  most 5 km. The reader splits capped views and retains valid parent
  observations. It fails the entire sweep if a child fails, a tiny view
  remains capped, or the request budget runs out.
- `POST /map/rider-cells`: `{types:["bird"], geometries:{view:{rect:{
  lo:{latitude,longitude}, hi:{latitude,longitude}}}}}`. The response's
  `cells.view.birds` identifies `strategy: "s2-cell-12"` and signed
  decimal-string `cell_ids`. This avoids implementing S2 geometry just
  to discover the cells overlapping a view.
- `POST /bird/nearby-by-cells`: `{map_center:{latitude,longitude},
  cell_ids:[…]}`. Valid replies carry `birds`, acknowledged `cell_ids`
  and a `cell_id` on each vehicle.

The legacy nearby response's cell IDs were level 9; they cannot be passed
directly to the level-12 endpoint. That mistake returned an explicit 400.
`GET /area/nearby` also returned Austin's and Charlotte's operational
polygons, with `region.rings[].points`. The production catalog has not
been built from them.

## Decoys and truncation must fail collection

The reader requires cell metadata even for empty replies. It rejects
missing or unexpected brands, malformed or duplicate vehicle identities,
invalid positions, incompatible cell strategies, and out-of-radius
nearby results. Scooter filtering happens after counting every candidate
toward the response cap. Vehicles retain battery, estimated range and
area identity, without ride codes or a fabricated position timestamp.

The cell endpoint **silently caps at 1,000 vehicles**. A single Austin
cell held 1,474 vehicles in the earlier audit, but returned exactly 1,000
without `reached_response_limit`. A nine-cell request acknowledged only
one cell before stopping at that cap. Moving the map centre produced
another subset; this is not pagination or evidence of complete coverage.
The reader rejects a capped cell or an incomplete cell acknowledgement.
Its CLI uses smaller nearby views instead. Nearby completeness still
depends on the observed nearest-vehicle selection rule; it is not an
official upstream contract.

All reads share at least five seconds between starts. An untrusted map
holds further map paths for 15 minutes in that reader. HTTP 401, 403 or
429 also stops collection, with a longer Retry-After honoured. There is
no automatic token renewal, identity change, alternate-route retry or
partial-success fallback after a refused or untrusted read. The CLI
exits on failure without writing an inventory. This is conservative
research behaviour; five seconds and fifteen minutes are not claims
about Bird's actual quota or recovery time.

## Live validation of the committed reader

An independent Indianapolis check at 21:03 UTC found 327 of 329 positions
from the cell endpoint within 10 m of Bird's public GBFS feed, 320 within
3 m. Charlotte's central cell returned 376 branded scooters, but has no
public feed for the same comparison.

The final reader then scanned the bounding rectangle of Indianapolis
S2 cell `-8616704745198845952` from **21:10:50 to 21:11:30 UTC**:

- Nine nearby requests, including two capped views and their children,
  returned 335 unique scooters inside the rectangle.
- Independent cell reads before and after held 331 and 332 vehicles.
  All **301 references** whose IDs persisted and whose positions changed
  by less than 1 m appeared in the sweep; none was missed.
- Bird's public feed, read at 21:11:59 UTC, listed 587 available vehicles
  across Indianapolis. Of the sweep's 335 local positions, 326 were within
  3 m and 332 within 10 m of that feed. These are live observations at
  different times, not identical simultaneous inventories.
- The reader's viewport-to-cell discovery method was also exercised
  against the live API and returned nine overlapping level-12 cells.

This proves fresh automated retrieval over that test area and the tested
failure boundaries. It does not prove a whole-city deployment, a sustained
request quota, server-network compatibility, long-term session renewal,
or that future synthetic replies will keep today's distinguishing fields.
Production adoption still needs those checks, reviewed operating polygons,
and a fleet-wide request budget.

## Running the reader

Use an existing, unexpired private session from the sign-in helper. No
credential is passed on the command line or printed. The optional output
is written atomically with mode 0600 only after the entire sweep succeeds;
keep it outside the repository. Collection start and finish are observation
times, not source position timestamps.

```sh
node scripts/bird-app-map.mjs \
  --session /private/path/hello.session.json \
  --bounds 39.753253398056586,-86.17517591229962,39.774500928470104,-86.15482687124187 \
  --max-requests 80 \
  --output /private/path/indianapolis-check.json

npx vitest run scripts/bird-app-map.test.mjs
```

The module also exports `BirdMapReader.cellsForBounds`, `.cells`, `.nearby`
and `scanBirdBounds` for controlled research. Tests cover synthetic empties,
synthetic vehicles, cell identity and truncation, quota holdoff, request
pacing, wrong-location results, and failed or incomplete sweeps. Raw app
replies, credentials, the APK and live audit artifacts stay in the private
Bird research directory, outside Git.
