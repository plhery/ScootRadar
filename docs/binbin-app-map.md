# BinBin guest app map

Since 24 October 2026, BinBin's scooters in 12 Turkish cities come from the
map its official app shows riders who have not signed in, and since 25
October in Skopje, Sarajevo and Pristina. The user asked for it on 24
October, after [the app investigation](turkish-app-maps.md#binbin-working-guest-read-incomplete-selection)
found that the map needs no account. No rider account, token or device id is
used. `server/binbinApp.ts` collects it in the Node cache, and the country
guides list the cities: [Turkey's](turkish-scooter-feeds.md) and
[North Macedonia's, Bosnia and Herzegovina's and Kosovo's](north-macedonian-bosnian-kosovar-scooter-feeds.md).

## The request

```http
POST https://gatewayapi-sp.binbinapp.com/binbin/api/v1/vehicles/list
Content-Type: application/json
User-Agent: okhttp/4.12.0
X-App-Version: 1278.3.6

{"latitude":39.7767,"longitude":30.5206,"radius":15000,"vehicleTypeIds":"1"}
```

The cache also sends the app's `X-Language`, `X-Device-Language`,
`X-Device-Platform` and `X-Device-OS`, never `X-Authorization`. Netcup's Node
26 got HTTP 200 in 0.4 to 0.6 s. Python's default client was refused there
with `error code: 1010`, so the app's headers matter.

The reply is `{"status":"SUCCESS","data":[…]}`. It lists the **ten vehicles
nearest the point**, nearest first, each with its `distance` from the point
in metres, and never more than ten. No parameter pages through the rest. Type
`1` is the electric scooter, and the cache keeps only those. It keeps a
scooter's `vehicleId`, coordinates and `battery`. The app draws every vehicle
of the list whatever its `status`, so the cache does the same. The list has no
range, price or rental link, and `statusTs` is not the time of the position.

## Proving an area complete

Ten at a time can still be complete, because a reply says how far it is
complete. With fewer than ten, it lists every scooter within its radius. With
ten, it lists every scooter nearer than its tenth. So each reply certifies a
circle around its point: its radius, or the tenth's distance. The cache
shrinks that circle by 0.3% and one metre, for BinBin's rounding and because
a parallel bows away from the great circle across a cell. It refuses a reply
whose distances are more than 2 m and 0.5% from the coordinates it gives, are
not in order or reach past the radius, since the circle rests on them.

A sweep covers the area's outline with cells, about 4 km on a side to begin
with. A cell is done once one certified circle holds its four corners. A cell
outside the outline is skipped. A cell no circle reaches is asked at its
middle. A cell some circle reaches but none holds is split in four and tried
again. Where scooters are dense the circles are small, so the cells split
until each fits one, as small as 10 m. A 10 m cell still open after it was
asked holds ten scooters within a few metres: a pile, such as a van's load or
a charging hub. The sweep keeps the ten it saw there and counts the pile.
Every point of the outline then lies within a circle whose reply listed every
scooter that near it. The cache keeps the scooters inside the outline.

## Asking fewer times

Cell by cell, a dense centre takes many requests, since every split costs one.
So each sweep first asks where it would have been best to ask last time. From
the positions the cache published for the area at its last sweep, it works out
each point's tenth-nearest scooter, then picks points greedily until their
circles, at nine tenths of that distance, cover the outline. Scooters ridden
since leave gaps, which the cells then fill. The plan is about 60,000 samples
and takes about a third of a second of processor time, with a pause for other
requests every 10 ms. With fewer than ten scooters known, there is no plan.

A sweep that fails, at its limits or on a failure, publishes nothing, but the
next one plans from what it saw as well as from the last published positions.
So an area too big to sweep from nothing in one go is swept in two or three.

On 24 October 2026, from the Mac:

| Area | Scooters | Requests from nothing | Planned from the last | Seconds, planned |
| --- | ---: | ---: | ---: | ---: |
| İstanbul Anadolu | 3,427 | 1,145 | 887 | 228 |
| İstanbul Avrupa | 2,528 | 840 | 675 | 175 |
| Antalya | 2,342 | 752 | 508 | 129 |
| İzmir | 1,111 | 397 | 295 | 74 |
| Konya | 1,108 | 377 | 246 | 62 |
| Samsun | 869 | 284 | 201 | 51 |
| Bursa | 773 | 248 | 164 | 41 |
| Eskişehir | 643 | 211 | 132 | 36 |
| Kocaeli | 587 | 186 | 132 | 34 |
| Alanya | 533 | 174 | 111 | 28 |
| Sakarya | 436 | 131 | 93 | 24 |
| Adana | 377 | 125 | 75 | 19 |
| Gaziantep | 226 | 77 | 58 | 15 |
| **All 13** | **14,960** | **4,947** | **3,577** | **916** |

Each area was swept from nothing, then again straight after, planned from that
sweep's positions. On 25 October, from nothing, Sarajevo took 236 requests for
767 scooters, Skopje 200 for 591 and Pristina 126 for 372. The planned sweeps asked 28% fewer times, about 4.2
scooters a request; a reply lists ten at most. Their plans took 33 to
1,175 ms of wall time. Piles, ten scooters within a few metres, were found in
İzmir (3), Konya (3) and İstanbul Anadolu (2).

## Pace and failures

One client serves every BinBin area: a request starts at least 250 ms after
the one before, four a second at most. A sweep keeps three under way at once,
since a reply takes longer than 250 ms, each in a lane of its own: the points
of the plan, then the open cells, are listed neighbours next to neighbours and
split in three runs, and a lane that runs out takes the far end of the longest.
A reply can then spare the next cell of its lane, as when one asks at a time.
Three taking from one queue would ask a cell's four quarters at once, before
any reply could spare the others: in simulation, they asked half as many
times again. The scheduler runs at most two sweeps on BinBin's host at a time. A timeout, a 5xx or a reply cut off is asked again
after 3 s, then 6 s; a third failure fails the sweep. HTTP 429 stops every
BinBin request for its `Retry-After`, a minute at least and an hour at most.
A sweep that needs over 3,000 requests or 20 minutes fails. A failed sweep
publishes nothing, so the cache keeps the area's last sweep, under the usual
expiry rules, and the next plans from what it saw. An idle area's failed
sweep is tried again after 1, 2, 4… minutes, an hour apart at most.

An area nobody looks at is swept every two hours
(`BINBIN_IDLE_INTERVAL_MS`), where other feeds are collected every 20 minutes.
The 16 areas take about 4,000 to 5,500 requests a round, by the numbers above:
a little over half a request a second to three quarters on average, where
every 20 minutes would take three to four and a half, past the client's
four. The street view shows no live position over
15 minutes old, so the first person to look at an idle area waits for its
sweep, which the request starts at once: under a minute in Eskişehir, a few
minutes in İstanbul. Meanwhile the area's last positions, up to three hours
old, stand faded where they were, and each ring of the sweep, nearest the view
first, replaces them as it is done. Zoomed out, the city's total is the last sweep's. An idle area
expires, for monitoring, after two hours and ten minutes without a sweep.

A watched area is swept again a minute after its last sweep started;
İstanbul's sweeps take longer than that, so watched İstanbul is swept back to
back, a few minutes apart.

A sweep's positions are as old as its start, its `observedAt`, though it
takes up to a few minutes. A scooter seen twice, ridden meanwhile, keeps its
later position; one ridden from a cell not yet asked into one already asked
can be missed until the next sweep. Each sweep logs a `binbin_sweep` line
with its scooters, requests, planned points, piles and seconds.

## Service areas

`data/binbin-areas.json` holds the outline of each area a system of any
country names by its `binbinAppArea`, from BinBin's public geofences of type
2:

```http
POST https://gatewayapi-sp.binbinapp.com/binbin/api/v1/geofences/get-by-type

{"geofenceTypes":"2"}
```

`node scripts/update-binbin-areas.mjs` fetches them, simplifies each outline
to within 5 m and sets each system's bounds to its outline's. `--check` only
says which outlines BinBin has redrawn, and fails if any. BinBin redraws them
every few weeks, İzmir's and Samsun's on 23 October 2026. `npm run
generate:providers` refuses an outline outside its system's bounds, a centre
outside its outline, an area named twice or not at all, or a missing one.

On 24 October 2026 the geofences also held areas no system sweeps. A third
area in İstanbul, **Etkinlik** ("event"), is a polygon of 10 by 20 m inside
İstanbul Anadolu's outline, so its sweep covers it. The others:

- **İGA**, İstanbul Airport, 6 km by 5, 15 km north of İstanbul Avrupa's
  outline: two scooters, 1.8 km from its middle.
- Two test areas, **Test**, in the Black Sea, and **Test_Erik**, and
  **Şanlıurfa**, marked inactive.
- In the Balkans, **Mostar**, which held no scooter on 25 October 2026,
  **Tirana**, which held 14 under Albania's ban on e-scooters, and **Banja
  Luka**, inactive since BinBin left it in August 2026. **Skopje**,
  **Saraybosna** (Sarajevo) and **Pristina** are swept since that day, each
  in a country of its own; see
  [their guide](north-macedonian-bosnian-kosovar-scooter-feeds.md#known-gaps).

## Checks

`server/binbinApp.test.ts` checks the reply's refusals, the client's headers,
its 429 and its failures, and sweeps an L-shaped area with a simulated fleet:
complete from nothing, complete and cheaper from the last sweep, with a third
of the scooters moved, with a pile of 25, three requests at a time, and with
failures, after which the next sweep plans from what the failed one saw. To check the live
areas:

```sh
node scripts/update-binbin-areas.mjs --check
node scripts/check-french-feeds.mjs --countries=TR,MK,BA,XK
```
