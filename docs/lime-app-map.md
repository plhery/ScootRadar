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

On 27 October 2026, 278 more towns that no known polygon or public Lime feed
covered were read the same way, most of them in Canada, the United Kingdom,
Chile, France, Mexico and Japan. They found 50 new regions. 27 have no
scooter zone, Oslo, Cambridge, Toulouse, Bordeaux, Osaka, Kyoto, Bogotá and
Medellín among them. Of the 23 with scooter zones, Bergen's, Viña del Mar's,
Saskatoon's, Regina's, Red Deer's, which also serves Lacombe and Blackfalds,
and Waterloo Region's held scooters and are registered below. Waterloo
Region's one zone covers Kitchener, Waterloo and Cambridge, so its market is
named after the region, and search finds it by each town. Dublin's, Be'er
Sheva's and Puebla's only scooter zones are demos, and Toronto's, which bans
shared scooters, are a dogfooding programme and an offline-pause feature.
Lime's public feeds already cover its Marseille, Paris West, Mississauga,
Ottawa and Tel Aviv regions, which Aix-en-Provence, Argenteuil, Brampton,
Gatineau and Jerusalem led to. Sharjah's, Oshawa's, Le Havre's, Lyon's,
Tours's, Tauranga's and Guadalajara's, in Zapopan, held no scooter near their
centres, and Sapporo's one zone is a trial at Es Con Field, in Kitahiroshima,
with none near it.

Zoomed out, the map lists the regions themselves. `static_elements` at zoom 5
answers with `regions`, each a region token, its name and its bounds: every
region whose bounds meet the view, at most 50 a reply, ordered by their
southern edge, so moving the view's southern edge up to the last one's pages
through them. On 28 October 2026 seven requests read the whole world: 270
regions. They include all 158 regions registered before, and leave out the
dormant ones the town probes had found, as Sharjah's, Oshawa's and North
Vancouver's, so the list is what the app shows as live. 46 were not known,
two of them test regions, and 36 of those have scooter zones. Lime's public
feeds already cover 14, from Calgary, Edmonton and Vancouver to Washington,
Lille and Uppsala; Harrisburg's only zone is a demo and the Mayo Clinic's, in
Florida, one empty campus; and six are Swiss. Thirteen markets of ten regions
held scooters in their full-area audits that night and are registered below:
Feldkirchen bei Graz
(Lime's Graz South region, around Graz's airport), Klosterneuburg and
Korneuburg, near Vienna; Chania; Érd, Százhalombatta and Diósd, the three
zones of Lime's Pest South region, each a town of its own; Ragusa and Marina
di Ragusa, 16 km apart in one region; Ishigaki and North Ishigaki, Lime's
South and North Ishigaki regions; San Marcos, Texas; and UNC Charlotte, the
university's campus, a region apart from Charlotte's. Kortrijk's, Mechelen's,
Lucca's and Keszthely's, on Lake Balaton, and Volos's, found by a town probe,
held no scooter near their centres at midnight, nor anywhere in their zones in
full-area audits at midday on 28 October: dormant regions, left out. Of the
Swiss regions, Basel's, Opfikon's, Uster's and Zurich's are in the national
feed; Sion's and Kloten's are not. Both are registered in Switzerland's own
catalog, `data/swiss-scooter-feeds.json`, which holds only app maps, each in
the town of one of the open data's areas (`swissCatalogProblem` in
`scripts/country-catalog.mjs`), so their scooters count under the towns' areas
with the other operators'. Kloten's zone is apart from Lime's Zürich and
Opfikon zones, which the national feed lists. No feed lists a scooter in Sion,
so it has an area of its own, Lime's zone and 1 km around it, centred on the
town's GeoNames coordinates, and its German name, Sitten, finds it. Sion's 95
scooters all moved between its two reference views that night, leaving none to
check the scan against; audited again at midday, 43 of its 97 stood still, and
the scan found all of them.

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
from 1 July 2026. In Denmark, neither did its Aarhus region. In Czechia,
neither did its Praha, Liberec and Olomouc regions: Prague has banned shared
scooters since 1 January 2026. In Hungary, neither did its Balaton region, 17
zones on the lake's south shore from Siófok to Balatonberény, nor Fót, Göd and
Zalaegerszeg; check the Balaton resorts again in summer. In Romania, neither
did its Arad, Brașov, Constanța and Galați regions, and Oradea's held a single
scooter; check Constanța, on the Black Sea, again in summer. In Bulgaria,
neither did any of its six regions, Sofia, Plovdiv, Varna, Burgas, Ruse and
Stara Zagora; check Varna and Burgas, on the Black Sea, again in summer.
In Belgium, neither did its Brussels region: Lime's public Brussels feed
lists e-bikes only, and Brussels bans shared scooters from 1 January 2027.
In Spain, neither did its Madrid, Alcorcón, Málaga and Sevilla regions:
Madrid revoked Lime's, Dott's and Tier's scooter licences in September 2024.
In Japan, neither did the Chiba and Kawasaki (Takatsu) zones of its Tokyo
region, on the morning of 26 October 2026, so they are left out. In
Australia, neither did its Gold Coast region, where Lime rents e-bikes, nor
its Sydney region, a single small zone in St Peters, nor, on the morning of
27 October, its Perth region: the City of Perth suspended e-scooter hire on
5 June 2025, and its scheme ran with Beam and Neuron. In Mexico, neither did
its Ciudad de México and León regions: SEMOVI's Mexico City scooter pilot
ended on 31 August 2026. In Canada, neither did its New Westminster and
Victoria regions, on the evening of 25 October 2026, local time: Lime rents
only e-bikes in both, and New Westminster isn't in British Columbia's e-scooter
pilot. In the United States, neither did its Charleston and Grand Rapids
regions, on the evening of 25 October 2026, local time: Lime runs e-bikes in
Charleston, with MUSC Health, and Grand Rapids made Veo its only operator from
1 September 2026. Nor did Newport, WA, in Spokane's region, on the night of
25 to 26 October, Pacific time: its city council had Lime take its scooters
away on 3 June 2024. Nor did Carthage, Missouri, and Norman, Oklahoma, on
26 October, Central time: Carthage's city council voted on 26 May 2026 not to
bring Lime's scooters back for the summer, and Norman lists only Veo among the
companies licensed to rent e-scooters there. Nor did Cleveland, Cleveland
Heights, Columbus, West Palm Beach and Wilmington, North Carolina, on the
evening of 26 October, Eastern time: Cleveland names Bird and Veo as its
permit holders, Columbus made Veo and Spin its only scooter operators under
a five-year agreement (Axios, 26 August 2026), West Palm Beach names no
operator, and Wilmington runs no scooter program. Nor did Birmingham, St.
Louis, New Haven, Missouri, Overland Park, Plano and Denver, that evening,
local time: Birmingham's council permitted Lime through 30 June 2024, Lime
paused its Overland Park pilot indefinitely, Plano lists no current
operator, Denver's scooters are Veo's alone since 16 May 2026, and Bird's
St. Louis feed held its fleet while Lime's zone was empty. Farmington, Utah,
held 2 scooters in each of three audits, on 26 October by night and in the
afternoon and on the morning of 27 October, Mountain time, and never a
stationary one to check them against, so it is left out too. In the United
Arab Emirates, neither did Al Mirfa and
Madinat Zayed, in Al Dhafra, the two far zones of its Abu Dhabi region, in the
afternoon of 26 October 2026, Gulf time.

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
  Frankfurt (3,630), Wuppertal (947), Arlington's and Washington's near
  Alexandria (35), Oakland's near Berkeley (11) and MobiData BW's, outside Stuttgart's zone, were checked
  against them. One edge is shared: Montgomery County's
  region meets Washington's at the District line, and Lime's public
  Washington feed reaches 39.0046° N, so a scooter of its Washington fleet
  parked just over the line, as one was in Silver Spring, 53 m north of it,
  shows in both.

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
| 25 October 2026 | Denmark: Copenhagen, Odense | 107 | 28 | 1,291 | 29 |
| 25 October 2026 | Czechia: Brno, Ostrava | 66 | 17 | 807 | 178 |
| 25 October 2026 | Hungary: 15 markets, Budapest, Szeged and Székesfehérvár the largest | 470 | 122 | 7,760 | 465 |
| 25 October 2026 | Romania: 7 markets, Bucharest, Cluj-Napoca and Iași the largest | 183 | 48 | 6,995 | 351 |
| 25 October 2026 | Greece: Athens, Kifisia, Thessaloniki, Heraklion | 111 | 30 | 4,442 | 252 |
| 25 October 2026 | Belgium: Antwerp | 42 | 11 | 880 | 19 |
| 25 October 2026 | Portugal: Porto, Faro, Oeiras | 59 | 16 | 893 | 128 |
| 26 October 2026 | Japan: Tokyo, Yokohama | 263 | 66 | 2,334 | 23 |
| 26 October 2026 | Australia: Port Phillip | 18 | 5 | 239 | 16 |
| 26 October 2026 | New Zealand: Auckland, Christchurch, Hamilton, Wellington, Palmerston North | 311 | 79 | 4,104 | 392 |
| 26 October 2026 | Mexico: Monterrey and Guadalupe | 29 | 8 | 2,912 | 68 |
| 26 October 2026 | Canada: Ajax, Coquitlam, Laval, Montréal (Parc Jean-Drapeau), Port Moody, Richmond, Vaughan | 190 | 50 | 1,876 | 345 |
| 26 October 2026 | United States: Indianapolis, Raleigh, Cincinnati, Fairfax | 756 | 190 | 1,861 | 213 |
| 26 October 2026 | United States: Tampa, Orlando, St. Petersburg, Winston-Salem, Lansing | 503 | 127 | 3,158 | 253 |
| 26 October 2026 | United States: Los Angeles, Portland, Spokane, Sacramento, South Lake Tahoe, Isla Vista, Spokane Valley, West Sacramento, Tualatin | 1,314 | 332 | 16,042 | 555 |
| 26 October 2026 | United States: Salt Lake City, Boise, Phoenix, Boulder, Scottsdale, Arvada | 766 | 194 | 5,532 | 475 |
| 26 October 2026 | Israel: Ashdod, Eilat | 45 | 12 | 711 | 146 |
| 26 October 2026 | United Arab Emirates: Dubai, Abu Dhabi, Al Ain | 266 | 67 | 2,589 | 69 |
| 26 October 2026 | United States: Dallas, Minneapolis, St. Paul, Nashville, Omaha, Montgomery County, Jacksonville, Richmond, St. Louis Park | 1,318 | 333 | 6,124 | 319 |
| 26 October 2026 | United States: Charlotte | 143 | 36 | 767 | 79 |
| 26 October 2026 | United States: Austin, Milwaukee, Tulsa, Oklahoma City, Mobile, Corpus Christi, Lubbock, Little Rock, Rochester, Edmond, Jenks | 1,830 | 462 | 9,235 | 725 |
| 26 October 2026 | United States: Long Beach, Albuquerque, Grand Junction, Knoxville, Clearfield, North Salt Lake | 619 | 158 | 3,150 | 208 |
| 27 October 2026 | Australia: Canberra | 112 | 28 | 1,374 | 104 |
| 27 October 2026 | United States: Alexandria | 30 | 8 | 350 | 22 |
| 27 October 2026 | United States: Tucson, Bellevue, Redmond, Everett, Bothell, Berkeley | 444 | 114 | 2,266 | 346 |
| 27 October 2026 | Norway: Bergen | 81 | 21 | 2,107 | 104 |
| 27 October 2026 | Chile: Viña del Mar | 7 | 2 | 295 | 29 |
| 27 October 2026 | Canada: Waterloo Region, Red Deer, Saskatoon, Regina, Blackfalds, Lacombe | 265 | 67 | 1,105 | 46 |
| 28 October 2026 | Austria: Feldkirchen bei Graz, Klosterneuburg, Korneuburg | 49 | 13 | 229 | 29 |
| 28 October 2026 | Greece: Chania | 6 | 2 | 169 | 46 |
| 28 October 2026 | Hungary: Érd, Százhalombatta, Diósd | 56 | 15 | 221 | 34 |
| 28 October 2026 | Italy: Ragusa, Marina di Ragusa | 15 | 4 | 122 | 21 |
| 28 October 2026 | Japan: Ishigaki, North Ishigaki | 173 | 44 | 264 | 48 |
| 28 October 2026 | United States: San Marcos, UNC Charlotte | 36 | 9 | 214 | 20 |
| 28 October 2026 | Switzerland: Kloten | 8 | 2 | 49 | 1 |
| 28 October 2026 | Switzerland: Sion | 45 | 12 | 97 | 43 |

Budapest's first audit missed one of its 171 stationary references, 6 m inside
the edge of the local view that should have held it: most likely it was
reported just across that edge, in the neighbouring view, when each was
read. Budapest was audited again that evening, from scratch, and found all 172.

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
(`npm run check:providers`): the rest is for the towns people look at. An idle
sweep falls between 08:00 and 21:00 in its town, and a sweep by night there, as a
new town's first or one someone asked for, is followed by one within a day, at the
group's hour, not three days on (`limeDaytime` in `server/limeApp.ts`). Three days
being whole days, a group keeps its hour, and a night's count stood: on 26 and 27
October 2026, Raleigh's, Cincinnati's and Knoxville's first sweeps, on the deploys
just after 00:30 there, held 3 of the 566 scooters Lime had in Raleigh the evening
before, none of Cincinnati's 236 and none of Knoxville's 208. Lime hides its scooters in
Raleigh's and Cincinnati's night bans, and Knoxville's map is empty at night without one. The seven reference windows select 13 groups with this cell
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
