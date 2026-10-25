# Lime authenticated operating-area map

The user authorized rider-map access on 24 October 2026 and signed into the
publisher-signed Android app 3.286.0. Its signer was checked against Lime's
[app-link association](https://limebike.app.link/.well-known/assetlinks.json).
This unofficial adapter supplements the existing public feeds. It does not
replace Swiss national data, public Lime GBFS, or the other operators' feeds.

## Whole operating areas

`data/lime-app-regions.json` records the reviewed markets, publisher service
polygons and their public source documents. The first markets are Deva,
České Budějovice, Querétaro, Naha, Doha, Santiago and Brisbane. Coverage includes
all the recorded operating polygons, including Brisbane's separate
Wynnum/Manly and Sandgate/Shorncliffe areas and Doha's outlying tracks.
These seven were the first complete market footprints; the markets
added since are under [every market the map lists](#every-market-the-map-lists-october-2026).

The app's `GET /api/rider/v2/map/static_elements` returns the outline-document
URLs under `zones_physical_attributes.region_zones`. Each public
`https://assets.lime.bike/zones_attributes/…` document identifies its region
and contains `zone_info`. The catalog uses `service_zone` polygons whose
`vehicle_types` include `scooter`, decoded as Google polylines at precision 5.
No rider credentials are sent to the assets host. Source URLs and versions
remain reviewable in the catalog input.

A wide map request can return only vehicles near its centre even when its
reply has fewer than 200 pins. In a live check, subdividing a wide Czech view
only when capped missed vehicles from the original view. The collector now
covers the entire service polygons with local cells at most 1,500 m across,
including empty portions and separate polygons. Cells outside the polygons
are omitted. This prevents an uncapped local sample from being mistaken for
complete coverage of a large box.

The current map response is limited to 200 nearest pins. A capped local view
covers its cell when the returned radius reaches beyond every cell corner,
with a 50 m margin; otherwise the collector subdivides it. A capped response
with mixed or repeated identifiers does not establish that radius. Depth,
request and time limits fail the collection if completeness cannot be
established. Parent observations are retained and those parent views are
queried again on warm refreshes: a live Brisbane child view omitted a valid
scooter seen in its parent, despite returning no pins. Discarding the parent
would therefore lose a known available scooter. Nearby pins outside the
owned cell still count toward the cap;
only positions inside that cell and a reviewed service polygon are published.
The source's selection behaviour was checked against a conservative complete
scan and overlapping reference views. It remains an unofficial protocol.

The conservative České Budějovice scan returned 349 scooters in 65 requests.
The optimized scan returned 348 in 13 requests a little later. Both recovered
all 200 vehicles that remained in the centre reference views. Changes in
counts between scans are expected for a live fleet. Reference checks exclude
vehicles outside the operating polygons and vehicles that moved between
reference calls.

The registered grid was retrieved in every market on 24 October 2026.
[Machine-readable audit](../data/lime-app-audit.json) binds these checks to the
polygons and local query groups; all 1,091 stationary references were recovered.
Counts are inventory snapshots at different times, not a simultaneous fleet total.

| Market | Local cells | Refresh groups | Scooters | Stationary references |
| --- | ---: | ---: | ---: | ---: |
| Deva | 5 | 2 | 126 | 110 |
| České Budějovice | 13 | 4 | 344 | 198 |
| Querétaro | 16 | 4 | 579 | 199 |
| Naha | 22 | 6 | 234 | 186 |
| Doha | 126 | 32 | 325 | 25 |
| Santiago | 97 | 25 | 2,656 | 188 |
| Brisbane | 77 | 20 | 3,146 | 185 |

The 93 groups cover 356 initial local cells. The observed complete query plan
uses 416 map requests, including parent views retained on warm refreshes:
34 minutes 40 seconds at the five-second minimum spacing, before network
latency. They were swept every hour while nobody looked until 25 October 2026;
see below for the cadence that makes room for every Lime market.

Santiago's geographical city centre is outside the published service areas.
The Lime catalog's reference point is inside its main service polygon, while
the collector covers every recorded polygon. The shared Santiago destination
keeps the city centre already registered by the other operators. City coordinates elsewhere include
[GeoNames data, CC BY 4.0](https://www.geonames.org/about.html).

## Every market the map lists, October 2026

On 25 October 2026 the rider map's static elements were read once for each
town [Lime's locations page](https://www.li.me/locations) lists. Besides the
seven above, they name 186 regions. Fourteen have no scooter zone, only
e-bikes: Burnaby, Estérel Côte d'Azur, Nice, Paris, Dresden, Heidelberg,
Castlebar, Naples, Delft, Rotterdam, Tilburg, Utrecht, Zwolle and Barcelona.
Oostende's one scooter zone is a demo. New York's zones, the Bronx and
Queens, hold all 5,130 scooters of Lime's public New York feed, which the map
already reads, so it is left out too. The other 170 regions make 211 markets,
14,980 local cells, about 17,500 requests a sweep.

The locations page is not the whole list: it names no town in the West
Midlands, where Lime's region has scooters in Birmingham and at the
University of Warwick. The static elements name the region nearest the view,
even one far from it (Slough's is London's, Telford's the West Midlands'), so
each large city no known polygon or public Lime feed covers is read once too.
In the United Kingdom, its 54 cities of 150,000 people or more found 16
regions besides: ten list e-bikes only, Bristol's and Edinburgh's only
scooter zones are a test and a demo, and Derby, Sheffield, Stoke-on-Trent and
York have scooter zones but no scooter near their centres, and none is a
trial area. Nottingham's and Oxford's, on the locations page, held no scooter
in their whole scooter zones: Lime rents e-bikes in both.

In Germany, 49 large cities were read: 12, Leipzig among them, found no
region, 20 regions without a scooter zone, as Mannheim's, Karlsruhe's and
Kassel's, and 11 a region already known. Of the six new regions with scooter
zones, Ludwigshafen am Rhein's, Osnabrück's, Paderborn's, Reutlingen's and
Ulm's held no scooter in their whole scooter zones, Reutlingen's in Sankt
Johann and Münsingen neither, on 25 October 2026. Stuttgart's region serves
Pforzheim, Böblingen, Sindelfingen and Waiblingen; its Stuttgart zone is left
out, as Lime's MobiData BW feed, which the map already reads, held 1,410 of
the 1,470 scooters inside it.

In Italy, Lime's regions of Bergamo, Brescia, Firenze, Lago di Garda, Parma
and Livorno, which serves Pisa, held no scooter in their whole scooter zones
on 25 October 2026, and neither did Stromboli's zone in Catania's region.
Firenze has banned shared scooters since 1 April 2026.

In Poland, 15 of Lime's 21 markets held no scooter in their whole scooter
zones on 25 October 2026: Bielsko-Biała, Bydgoszcz, Gliwice, Katowice and
Chorzów, Kielce, Kołobrzeg, Koszalin, Łeba, Legnica, Mielno, Olsztyn, Płock,
Toruń, Władysławowo and Zamość. Kołobrzeg, Łeba, Mielno and Władysławowo are
Baltic seaside resorts; check them again in summer.

In Austria, Lime's Salzburg region held no scooter in its whole scooter zone
on 25 October 2026. In Sweden, neither did its Stockholm region, in Stockholm,
Bromma or Solna and Sundbyberg: Stockholm's permits went to Voi and Bolt alone
from 1 July 2026.

- Zones named as demos, tests, warehouses, events or temporary areas are left
  out, as Rome's three temporary areas and Dortmund's warehouses. So is the
  Tempe zone of Lime's Phoenix region: Lime's public Tempe feed holds it.
- Each town a region serves is a market of its own, named after it: a town
  of its own by GeoNames' municipality codes, or a city the map already
  lists. Lime's Düsseldorf region also serves Neuss and Hilden, and Munich's
  Dachau. A zone over 10 km from every other zone of its region is a town of
  its own too, as Newport, WA in Spokane's region, Stromboli in Catania's,
  Madinat Zayed and Al Mirfa in Abu Dhabi's, and the University of Warwick,
  in Coventry, in the West Midlands'.
- A market takes the city the map already lists for its town, with its
  centre, region and time zone. A new town's come from
  [GeoNames, CC BY 4.0](https://www.geonames.org/about.html), and its centre
  is moved into the polygons where GeoNames' lies outside them, as Montréal's:
  Lime's only scooter zone there is Parc Jean-Drapeau, as the city bans shared
  scooters from its streets.
- No public Lime scooter lies inside the markets' polygons: Lime's public
  feeds in Tempe (805 scooters), New York (5,171), Lisbon (2,737),
  Frankfurt (3,630), Wuppertal (947) and MobiData BW's, outside Stuttgart's
  zone, were checked against them.

Each market is registered once its full-area audit, as above, finds every
stationary reference scooter, country by country:

| Registered | Markets | Local cells | Refresh groups | Scooters | Stationary references |
| --- | --- | ---: | ---: | ---: | ---: |
| 25 October 2026 | United Kingdom: London, Birmingham, Coventry, Milton Keynes, Salford | 336 | 86 | 4,895 | 264 |
| 25 October 2026 | Germany: 39 markets, Berlin, Munich, Hamburg and Cologne the largest | 2,318 | 594 | 58,459 | 1,595 |
| 25 October 2026 | Italy: 10 markets, Rome, Milan, Turin and Catania the largest | 738 | 188 | 12,534 | 658 |
| 25 October 2026 | Poland: Warsaw, Poznań, the Tricity, Kraków, Łódź, Wrocław | 525 | 133 | 14,834 | 504 |
| 25 October 2026 | Austria: Vienna, Linz, Innsbruck, Klagenfurt, Wels | 276 | 70 | 2,987 | 140 |
| 25 October 2026 | Sweden: Göteborg, Malmö | 188 | 47 | 2,750 | 144 |

When the audit and the cache's sweeps shared an account, they shared its limit,
about one request every five seconds. On 24 and 25 October 2026, before the cache's
idle sweeps were slowed to every three days, an audit beside them made the
cache's own Lime feeds fail with 429 for minutes at a time, Doha's and
Santiago's among them. Research now uses a separate account and still stops
at its first 429.

## Cache behaviour

`npm run generate:providers` lays the local cells over these outlines, then
generates the web and iOS catalogs. The same command preserves public GBFS
systems already in a country catalog. A country catalog keeps one entry per
market, its `limeMapGrid`: the grid's corner, its steps, and the cells that meet
a polygon as runs of their indexes (`src/lib/limeGrid.ts`). The site, the cache
and the generators expand it into groups of at most four cells,
`lime_cz_app_ceske_budejovice_000` and on, and the iOS catalog joins a row's
neighbouring cells into one coverage rectangle. Written out cell by cell, each
group added more than a kilobyte to the scripts every map page loads.
`npm run check:providers` checks both generated outputs and requires a successful
full-area audit matching the registered polygons, tile groups and query strategy.
The verified warm query plans of all the registered markets, including parent
views, may take at most half the requests of an idle interval at one every
five seconds.

Each group is an independent cache feed. Looking at one part of a market
wakes its nearby groups rather than rescanning the entire city. Requested
groups are served in arrival order so repeated polling cannot postpone an
area still waiting for its first refresh. Viewed groups
are selected by their individual assigned cells, including where a group's
enclosing rectangle spans a gap between rows or disconnected polygons. They
use the normal active cadence, but a request collects again only the six
nearest the middle of its view (`LIME_GROUPS_PER_REQUEST`, enough for a phone at
zoom 14), and keeps them watched for three minutes (`LIME_WATCH_MS`) rather than
ten: the map asks every minute while it is open. Every Lime town shares the
accounts' 36 requests a minute, four or five a group. On 25 October 2026 a view
of Berlin asked for its 128 groups; Santiago's, watched meanwhile, waited a
quarter of an hour for theirs and expired, and the new German towns' first
collections stalled, some past their 15-minute budget. Idle groups are swept every three days
(`LIME_IDLE_INTERVAL_MS`), not every two hours as the other app maps: every
market Lime's rider map lists takes about 17,500 requests, a day at that pace,
so the idle sweeps take about a third of the requests, and may take half
(`npm run check:providers`): the rest is for the towns people look at. The seven reference windows select 13 groups with this cell
coverage, compared with 23 using enclosing rectangles (see the public audit).
Restored snapshots adopt these current coverage cells immediately while
keeping their scooter observations and timestamps. Monitoring uses that idle
interval plus ten minutes, while the
active 15-minute expiry remains unchanged. Street-level positions older than
15 minutes are not shown live: while a group is swept again for a request, they
stand faded where they were, up to three hours old, and each view the sweep
finishes, the requested one first, replaces them as it goes. The groups a wide
view leaves idle stand faded the same way, and count in the answer's state
neither as served nor as failed. Country totals fill as the background scan completes;
they describe the latest completed inventory, up to three days old where
nobody looks, not simultaneous fleet counts.

Calls start at most once every five seconds per configured account across its
Lime feeds. HTTP 429 pauses that account's client for Retry-After, with a minimum one-minute cooldown. The
limit is the account's, not one client's: a second client beside the cache's
sweeps, starting a call every six seconds and then every nine, received 429
after 142 and 42 calls on 25 October 2026, without Retry-After. Requests
have a 20-second deadline and an 8 MiB response limit. Native requests to
`web-production.lime.bike` use TLS 1.2: the production Linux Node 26 client
received 403 with its default TLS 1.3 handshake, while TLS 1.2 succeeded.
The setting is specific to this provider.

### Production accounts

An optional private `/data/lime-accounts.json` manifest (`LIME_ACCOUNTS_PATH`)
assigns refresh groups to independent accounts:

```json
{"version":1,"accounts":[{"id":"primary","sessionPath":"lime-session.json"},{"id":"lime2","sessionPath":"lime2-session.json"},{"id":"lime3","sessionPath":"lime3-session.json"}]}
```

Paths resolve beside the manifest. Account ids and resolved session paths must
be distinct; up to eight accounts are supported. A missing default manifest
keeps the original `LIME_SESSION_PATH` behaviour. An explicit missing manifest
or malformed configuration is an error. The cache reads the manifest when it
first wraps Lime feeds; restart through the normal deployment to change it.

Each account has one client with its own five-second pacer, renewal, cooldown,
collection slots, and cached query plans. Each refresh group is assigned by
its id, consistently across restarts and manifest reordering. Removing an
account reassigns its groups on restart. A failed or throttled request stays
on its assigned account; it does not retry through the other accounts.
Requested groups keep priority within their account. The network host,
vehicle ids, coverage, and freshness rules are unchanged. The three-day idle
cadence and the catalog's conservative single-account budget remain in place.

The original account, `lime2`, and `lime3` serve production. `lime1` is reserved
for research, whose session has a separate renewal owner. Never share a
refresh-token file between the local research process and production. The
protected metric `scootradar_lime_account_requests_total{account,kind}` shows
requests from each production account using only its manifest id.

Only actual scooter pins are retained. Battery is a percentage; range, fares,
vehicle-specific rental links, parking and zone overlays are not supplied by
this adapter. Stable `secondary_id` values identify vehicles across overlapping
groups when provided by the source. A collection's
start time is its observation time, so a slow scan does not make its oldest
positions appear newly observed. App endpoints never enter GBFS discovery,
parking or zone collection.

A dense Brisbane group was also timed twice with the final collector: 16
requests in 76 seconds cold, then 16 in 80 seconds using its cached query
plan. It returned 766 and 767 scooters respectively. The warm plan retains
parent observations as well as empty leaves.

## Private session and renewal

The Node cache reads `/data/lime-session.json`, or `LIME_SESSION_PATH`:

```json
{"version":1,"accessToken":"…","refreshToken":"…","expiresAt":0,"refreshExpiresAt":0,"renewalWindow":900,"deviceToken":"…","privateKey":"<PKCS8 EC P-256 PEM>"}
```

Expiration timestamps are milliseconds since the epoch; the renewal window is
seconds. Keep the file owned by the cache user with mode `0600` in its private
persistent volume. No session credentials enter the repository, Worker,
browser, generated catalogs or logs. Rotation is saved atomically before a
renewed access token is used. A replacement login file can be read without
restarting the cache. The emulator is not required for ongoing collections.

The access token lasts ten hours and renewal is allowed only in its final
15 minutes. `POST /api/auth/v2/oauth/token` uses a refresh-token grant with an
ES256 client assertion and its public JWK. The refresh token is bound to that
key. A server-owned key was installed before the user's second login so the
server can sign its own proofs. A fresh proof reached the provider's explicit
early-renewal gate; an actual successful timed renewal has not yet been
observed. Tests cover successful rotation, restart, concurrency and rejection.
The observed refresh lifetime is 180 days, subject to upstream revocation.

The OAuth request carries no expired rider bearer header. Map requests carry
the access token and native app/device headers. A rejected map token gets one
renewal attempt; repeated authentication failures back off for a minute.
Session errors omit upstream bodies and credentials.
