# Data sources and terms

ScootRadar does not own the mobility, address, or map data it displays.

## Mobility data

Lime's authenticated rider map now supplements public feeds in the complete
operating areas recorded in [the Lime catalog](docs/lime-app-map.md). Local
views cover every recorded service polygon; the cache keeps credentials
private, limits requests, and refreshes viewed groups independently.

The main source is the [Open data platform mobility Switzerland shared
mobility dataset](https://data.opentransportdata.swiss/en/dataset/sharedmobility),
published by the Swiss Federal Office of Energy. Its terms permit processing,
analysis, and publication, require `opentransportdata.swiss` source citation,
and require raw data to be refreshed at its underlying cadence.

The app reads GBFS discovery documents instead of assuming endpoint paths,
requests only systems relevant to the visible area, filters for available
electric standing scooters, and keeps short-lived stale values for upstream
resilience. The dataset keeps listing systems after their operator stops
sending positions; one whose positions are over a week old, or were never
sent, counts as inactive rather than failing.

The dataset cuts each unlock fee to whole francs: Dott's CHF 0.95 in Basel and
Zürich arrives as 0, its CHF 1.20 in St. Gallen as 1, while Dott's own feeds
and the plans' descriptions keep the cents. Where a description names a fee
with the same whole francs, the app takes the described fee. Lime's plans carry
no description and say tax comes on top, so Lime's scooters get no price
estimate.

The dataset names most systems after a town, and the map reads a system where
the view touches that town's area. Two serve other towns as well, as their
published geofencing shows, and are read there too: Bolt Zürich's "Wadenswil"
zone takes in Wädenswil and Richterswil, and Dott St. Gallen draws a zone
around Wil. Just after midnight on 14 October 2026 Bolt listed 93 scooters
around Wädenswil, and Dott 35 in Wil. Dott also draws a zone around
Lichtensteig, with 13 scooters, but Lichtensteig left the map's towns on 18
October 2026: from Friday 16 to Sunday 18 October twelve of them stayed at the
same spots, with at most one ride in 33 hours. They still show when the view
reaches Dott St. Gallen's area, about a kilometre east of the town, since a
feed's scooters aren't clipped to its towns' areas.

Each Swiss scooter counts in the city totals under the nearest town whose area
holds it, so on the evening of 14 October 2026 each was placed in its
municipality by swisstopo's boundaries, over six polls (00:01–00:10 and
13:09–13:20). Opfikon's area reached into Zürich's Seebach, Affoltern, Oerlikon
and Schwamendingen, whose scooters lie nearer Opfikon's centre than Zürich's:
414 to 448 of Zürich's counted under Opfikon. Opfikon's area now stops on the
south and west at Opfikon's boundary and Lime Opfikon's furthest scooters
(47.4156 N, 8.5533 E) and runs 1 km beyond them to the north and east, to
47.4568 N and 8.6208 E; Kloten's is the zone where Bird and Hopp allow riding
there, plus 1 km (47.4287–47.4829 N, 8.5477–8.6213 E). 27 of Zürich's
scooters a poll, just south of Opfikon, still counted under it on 15 October
2026, and 11 of Kloten's, south-west of its centre; Zürich, Opfikon and
Kloten now have their municipalities' outlines in `data/town-outlines.json`,
OpenStreetMap's, and none of the 40 is misnamed. Dott's Romanshorn zone
reaches Amriswil and its St. Gallen zone Gossau, Flawil and Uzwil, whose
scooters stand apart from Romanshorn's and St. Gallen's but counted under them:
76 to 79 in Amriswil, 56 or 57 in Gossau, 31 or 32 in Flawil and 18 in Uzwil.
Each is now a town of its own, its boundary plus 1 km, stopping on the side
that faces its neighbour. Wittenbach and Gaiserwald, joined to St. Gallen,
Goldach and Tübach, joined to Rorschach, and Dott's Rheintal zone, where 50 to
70 scooters stand among Au, Balgach, Berneck, Widnau and Diepoldsau, none of
which holds most, still count under St. Gallen and Rorschach.

Lime's Winterthur, Zug and Wetzikon systems are listed with fresh timestamps
but no vehicles, and have been since at least 11 October 2026. Since 15
October 2026 they are left out of collection (`LEFT_OUT_SWISS_SYSTEMS` in
`src/lib/feedCoverage.ts`), so they are not on the map, in the city totals or
in the cache's alerts:

- Winterthur licenses Voi alone, until 31 December 2027
  ([Stadtratsbeschluss 258 of 25 June 2025](https://stadt.winterthur.ch/download/resolution-document/2699/SRB%20258%20%28Optimierung%20stationslose%20Fahrzeugverleihsysteme_%20Kenntnisnahme%20Reduktion%20Anzahl%20Anbieter%20und%20Ausblick%29.pdf)).
  Voi's scooters keep Winterthur on the map.
- Zug has had no rental e-scooters since November 2023, and the city has not
  let them back ([zentralplus, 16 July 2025](https://www.zentralplus.ch/verkehr-mobilitaet/e-scooter-in-zug-sie-sind-weg-und-bleiben-weg-2787774/)).
- Wetzikon ended its e-scooter pilot in February 2023
  ([city media release, 2 February 2023](https://www.wetzikon.ch/wAssets/docs/politik/stadtrat/medienmitteilungen/2023/2023-02-02-Zukunft-Mikromobilitaet-Wetzikon.pdf)).

With no other operator there, Zug and Wetzikon left the map's towns. The
recheck dates are in [coverage gaps](docs/coverage-gaps.md#dates-to-check-again).

Bulle, Grenchen and Nyon left the map's towns on 15 October 2026 too. In ten
polls that day, from 06:17 to 08:23 Swiss time, through the app's own code,
Hopp, the PubliBike app's endpoints, sharedmobility.ch's spatial search and
the production API, no operator showed a scooter in any of them:

- Grenchen: Zisch rents its scooters there in Bird's app
  ([Grenchner Tagblatt, 3 March 2022](https://www.grenchnertagblatt.ch/solothurn/grenchen/e-trottinett-auf-zwei-raedern-durch-die-stadt-pilotversuch-mit-e-trottis-hat-begonnen-er-dauert-vorerst-bis-september-ld.2258520)),
  and Zisch's [site](https://www.e-zisch.ch/) still names Grenchen. But Bird
  Grenchen last sent positions on 8 August 2026, one scooter's, and Bird's own
  Grenchen feed is empty and stamped 0. Neither the city nor Zisch has
  published an end. The Voi and PubliBike scooters inside Grenchen's old
  area stood in Biel, 8 to 10 km from Grenchen, and count under Biel, whose
  [shared mobility page](https://www.biel-bienne.ch/de/shared-mobility.html/2911)
  names those two as its only e-scooter operators.
- Bulle: JM Fleets Intl rents its scooters in its own app, Trott', not
  Bird's ([city of Bulle](https://www.bulle.ch/mobilite/27914)). Bird's Bulle
  system on sharedmobility.ch has no vehicle feed, Bird's own Bulle feed is
  empty and stamped 0, and Trott' publishes no feed.
- Nyon has no scooter system on sharedmobility.ch. Voi's "Nyon" region there
  is the Région de Nyon's bike network, more than 400 e-bikes in 16 towns
  ([Région de Nyon](https://regiondenyon.ch/projet/velos-en-libre-service/)):
  its 54 stations within 10 km of Nyon held 209 to 215 e-bikes and no
  scooter. The map reads that region as naming no town (`REGION_ALIASES` in
  `src/lib/feedCoverage.ts`).

Bird Grenchen and Bird's Bulle system (`bird-platform-partner-jmfleets-bulle`)
are in `LEFT_OUT_SWISS_SYSTEMS`.

Hopp is not in the dataset. Its scooters in Zürich, Basel and Kloten come from
Hopp's own GBFS feeds at `api.hopp.bike/gbfs/ch-<town>`, which link Hopp's
privacy policy, not a licence.

PubliBike / Velospot e-scooters do not come from that dataset, whose copy of
Velospot runs 15 to 75 minutes behind. The app reads two unauthenticated
endpoints used by the official PubliBike Velospot app instead:

- In Zürich, [`pbvsng/freeFloating`](https://velospot.info/customer/public/api/pbvsng/freeFloating)
  returns each free-floating scooter's opaque ID and location, but no battery
  level, range, or rental link.
- In Biel and Locarno, where the scooters are docked, [`pbvsng/stations`](https://velospot.info/customer/public/api/pbvsng/stations)
  returns how many e-scooters each station holds. The map shows that many
  markers at the station: they are not individual vehicle positions or IDs.

PubliBike does not publish a redistribution license for these endpoints; its
[API documentation](https://api.publibike.ch/v1/static/api.html) directs
license questions to PubliBike. Responses advertise a 500-request limit without
documenting the time window, so the app caches each for 30 seconds.

### Listed prices

Lime, Bird and Spin publish no prices in their feeds, nor do PubliBike and a
few others. For their systems the map shows the pay-per-ride price the
operator publishes on its own site, or, where it publishes none there, the
price the city's permit or council report sets out. These are copied by hand
into `data/listed-prices.json`, each with its page, the words it used and the
day it was read, and a scooter's card says "published price, checked 18 Oct".
Passes, subscriptions, discount programmes and first-ride offers are left out,
and a fee charged on every ride, such as San Francisco's permit fee, is counted
with the unlock fee. Where the operator gives a range a minute, as Lime does
in New York ($0.45 to $0.50), the card gives its lowest, "from $0.45 a
minute", with the unlock fee. As of 18 October 2026 there are prices for 14
systems, about 14,500 scooters: PubliBike in Zürich and Biel, Hopp in Konstanz
(from the text of its own feed, which links that price to no vehicle), Naolib
in Nantes, Lime in New York, Lime and Spin in San Francisco, and, from the
city's or programme's page, Lime in Colorado Springs, Lime and Spin in Durham,
Spin in Raleigh, Fort Collins and Davis, and Bird in Windsor. Bird publishes no
prices on its sites, and Lime only for New York and San Francisco, so most of
their systems still show none.

A listed price can also be for some days of the week only, where an operator
charges differently on them and its feed gives one price all week: on those
days it goes before the feed's price. Beryl charges £1 and 22p a minute for its
scooters in Brighton and Hove on Saturdays and Sundays, by its Brighton pricing
guide and the council's trial page, and 20p on weekdays, which is all its feed
gives; so at weekends the card shows 22p, "published price, checked 23 Oct".

The weekly
[catalog check](.github/workflows/catalog-check.yml) runs
`npm run check:listed-prices`, which fails once a price was read more than 90
days ago or its page is gone; the map stops showing a price 180 days after it
was read.

Provider names remain trademarks of their respective owners. Their appearance
does not imply endorsement.

### French cities

The app also reads 32 reviewed public GBFS feeds from Dott, Bird, Lime, Voi and
Pony across 56 French cities or operating areas. The catalog is checked into
[`data/french-scooter-feeds.json`](data/french-scooter-feeds.json), using the
[MobilityData registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and [transport.data.gouv.fr](https://transport.data.gouv.fr/datasets?format=gbfs&subtype=scooter)
as discovery sources. Pony is accessed through the National Access Point's proxy,
apart from La Roche-sur-Yon: its dataset, published by La Roche-sur-Yon
Agglomération under the Licence Ouverte 2.0, links Pony's own feed with the key
the address needs, and the catalog uses that address, key included. The key was
published for La Roche-sur-Yon only; it was decided on 13 October 2026 that it
may be used for Pony's other towns too, but no other is in the catalog. The
scooters of Naolib Micromob', the service of Nantes Métropole's Naolib network
at Chantrerie and in Saint-Herblain, come since 25 October 2026 from Nantes
Métropole's own feed, which it publishes under the Licence Ouverte 2.0; they
were read from Pony's with that key before. Its feeds sit on another host of
Ecovelo's, which runs the service, and the catalog names that host. The other
feeds are served directly by their operators. Lime's
feed west of Paris, in eight towns of Saint Germain Boucles de Seine, is listed
only on data.gouv.fr, where Lime publishes it under the Licence Ouverte 2.0.

Production collects each system independently on Netcup, with at most six
systems in flight: Switzerland every minute, the others every twenty minutes, or
every minute for ten minutes after someone looks at them. Bird's, Spin's and
Bolt's own feeds, whose licences let their data be kept fifteen minutes, are
collected every thirteen minutes while nobody looks: the cache drops their
positions, in memory and in its saved copy, the documents it read them from and
the city totals counting them before they are fifteen minutes old by their
source timestamp, and the Worker keeps an answer holding them no longer. Read
through Entur, MobiData BW, NRW.Mobidrom or the Swiss national platform, the
same operators come under those platforms' licences instead. Map requests read only
the relevant cached systems; one for a system whose data is over a minute old
starts its collection, and waits up to three seconds for it when its positions
are over fifteen minutes old. The local direct-feed fallback selects by viewport
and allows four concurrent French systems. Individual scooter positions remain
usable for at most fifteen minutes from their source timestamp, including when a
refresh fails; missing timestamps and older data are rejected. The operators'
app maps, which no licence holds to fifteen minutes, differ in three ways
since 25 October 2026. Those read in slow paced sweeps (Whoosh, GCOO, ATOM
and BinBin) are collected every two hours while nobody looks, and Lime's many
markets every three days. A sweep
starts where the request looked and publishes each part of its area as it
finishes it, so the map fills in as it goes. And while one is collected
again, its positions up to three hours old stand faded where they were last
seen, counted nowhere, until the sweep reaches them. The national
platform publishes Voi every eight to nine minutes, about ninety seconds after
the timestamp it carries, so a shorter limit blanks Voi whenever it is a little
late. City totals are aggregated hourly, and those of Bird's, Spin's and Bolt's
own feeds again whenever the oldest data they count is about to turn fifteen
minutes old, two or three times a minute. Each scooter counts under the
nearest town whose bounds hold it; outside Switzerland the towns its own
feed serves come first, so a scooter in east Oslo is Oslo's, though
Lørenskog's centre is nearer. Where a town's municipal boundary is listed in
`data/town-outlines.json`, as in Gush Dan, around Lille, Liège, Oslo, Heilbronn, Düsseldorf and Torino, in the Ruhr,
or in west Los Angeles, a scooter inside it counts under that town first, under the
smaller of two outlines that nest. The outlines are OpenStreetMap's (ODbL),
Kartverket's for Norway (CC BY 4.0), the ONS's for Bournemouth, Christchurch
and Poole (OGL v3.0) and the Census Bureau's for American towns (public
domain), simplified to within 20 m, Israel's to within 10 m; the credits
link the licences. On the
evening of 15 October 2026, over two polls of every feed, they cut the
scooters counted under the wrong town from about 950 a poll to about 70,
most of those in Rhodes, Gush Dan and Bath, where no outline was added or
the simplified boundary runs through a parking spot.

These endpoints are publicly accessible but do not share one universal license.
In particular, [Dott's API terms](https://ridedott.com/api-licence/) contain
development and commercial/distribution restrictions that need review before
public deployment. See the [investigation and source terms](docs/french-scooter-feeds.md)
for the verified cities, sample counts, excluded feeds, and recheck command.

## Dott anonymous app map

Since 24 October 2026, 157 regions not served by the public GBFS feeds use
Dott's signed-out Android map endpoint. This adds about 69,500 available
scooters in Austria (11 regions), Germany (63), Spain (3), Finland (20),
Greece (2), Hungary (5), Italy (16) and Poland (37) in the discovery sweep.
Bochum also returned to the catalog through its public GBFS feed.

The Node cache makes one bounded HTTP/2 synchronization per region, at most
two requests a second, on the usual watched/idle schedule. Only electric
standing scooters with the reviewed region id and coordinates inside its
bounds are published. A timeout, malformed response or stream ending before
synchronization fails the collection and retains the previous snapshot under
the usual expiry rules. No rider account or token is used. Charge, range,
pricing, selected-vehicle details, parking and geofencing are absent from
this map view; unknown charge and range stay unknown. The observation time
is the completed map sync, since the endpoint carries no position timestamp.

Helsinki, Espoo and Vantaa include their municipal weekend-night bans on
both clients, with OpenStreetMap boundaries (ODbL). The signed-out map route
was explicitly authorized by the user on 24 October 2026. Official partner
GBFS access remains preferable; [protocol evidence and contacts](docs/dott-app-map.md)
record the source and the request wording. The country-specific GBFS audits
below describe their original checks; this supplement supersedes their
claims that these Dott regions have no usable source.

## Beam rider app

Since 24 October 2026, Beam's authenticated GraphQL rider map supplies 54
reviewed regions in Australia, Malaysia, South Korea and Türkiye. The Node
cache queries bounded H3 cells with a private rider token and publishes only
standing scooters, with stable ids, positions and percentage charge. Bicycles,
seated scooters, unclassified vehicles and neighboring cities are excluded.
Complete sweeps are required before publication. Beam access and refresh
tokens stay in a mode-0600 file on the cache's persistent volume; no Google
credentials or visitor location are sent to Beam. Zones and parking guidance
are not published yet. See [coverage, session renewal and live verification](docs/beam-app-map.md).

## LUUP rider app

Since 24 October 2026, LUUP's authenticated rider map supplies standing-scooter
counts at ports in 19 Japanese cities. The user signed in with the official
app; the cache's runtime-only Coolify secrets hold the refresh token and Firebase
API key. Neither credentials nor profile data enter the public catalog or API.
E-bikes and seated scooters are excluded. Each standing scooter is represented
at its port with a stable ordinal id and unknown charge and range, as with
PubliBike's station counts. Closed ports are excluded, including local opening
hours, with conservative handling of holiday schedules. Complete city reads
are filtered by reviewed LUUP region ids and bounds. See [coverage, credential
renewal and live verification](docs/luup-app-map.md). Zone completeness is not
established, so no LUUP zones or parking guidance are published.

## ATOM rider app

Since 24 October 2026, Qick's authenticated ATOM map supplies Örebro,
Linköping, Norrköping, Jönköping, Eskilstuna, Falun and Borlänge in Sweden,
and Kassel, Münster and Göttingen in Germany. These are app-map systems,
separate from the existing public ATOM GBFS feeds. The user authorized
creating the test rider account; credentials stay in the cache's private
volume and the apps' credits link to Qick.

MoVe's separate authorized account adds Fredericton, Moncton and Saint John
in New Brunswick, Canada. Its native response is account-wide, so one
shared read supplies three reviewed city areas. The collector keeps
available electric scooters with charge, excluding hidden/active vehicles
and positions outside those areas. See the [MoVe verification](docs/move-app-map.md).

Zippy's separately authorized ATOM account adds the Club Mykonos area of
Langebaan, South Africa, using the same full-account collection mode.
South Africa is the first African country catalog. The rider session stays
private; the country and provider credits link to Zippy. See the
[coverage and verification](docs/south-african-scooter-feeds.md).

Each Qick request covers a two-kilometre circle. The collector sweeps
overlapping views across reviewed city bounds, preserving battery charge,
deduplicating scooters and excluding hidden or active vehicles. All views
must succeed before a city's snapshot changes. Rate limiting requires
four seconds between reads across all accounts, so concurrent watched
cities can refresh more slowly than once a minute. See the
[protocol, coverage and session guide](docs/atom-app-map.md). Other ATOM
brands require their own verified app/account access.

## BinBin guest app map

Since 24 October 2026, BinBin's scooters in 12 Turkish cities come from the map
its official app shows riders who have not signed in. The user authorized it
that day. No rider account, token or device id is used. Each reply lists the
ten scooters nearest a point, with their distances, so the Node cache sweeps
each of BinBin's 13 service areas until every point of it lies within a reply
that listed every scooter that near it, planning each sweep from the positions
of the last. One client serves every area, at most four requests a second; a
sweep that fails keeps the area's last snapshot under the usual expiry rules.
Only electric scooters inside the area's outline are published, with their
battery charge; the list gives no range, price or position time, so the
observation time is the sweep's start. The outlines are BinBin's public
service areas, in `data/binbin-areas.json`. See [the request, the proof of
completeness and the load](docs/binbin-app-map.md).

## Bolt rider app

Since 25 October 2026, Bolt's authenticated rider map supplies 118 markets
where no open feed shows Bolt, about 111,000 scooters: Germany (22 markets),
Poland (21), Ukraine (13), Latvia (12), Estonia (10), Romania (8), Lithuania
(8), Belgium (5), Portugal (5), Sweden (3), Bulgaria (3), Slovakia (2),
Kazakhstan, Cyprus, Iceland, Moldova, Slovenia and Ireland (1 each). Estonia,
Lithuania, Slovakia, Bulgaria, Moldova, Slovenia and Ireland are new
countries. The user authorized the
rider account; its refresh token and device id stay in a mode-0600 file on
the cache's persistent volume, and the one-hour access token in memory.

One request reads a whole market, on the usual watched/idle schedule, with
all markets sharing one request every half second. Only scooters are kept,
inside the system's bounds and only when the answer holds the market's own
scooter categories, with stable ids, positions and percentage charge unless
Bolt hides it. There is no range, price, rental link or position timestamp;
the observation time is the read. Markets other sources already cover
(MobiData BW's Stuttgart, Karlsruhe and Reutlingen/Tübingen, Bolt's GBFS in
Brussels and Liverpool, Entur's Oslo, the Swiss platform's Zürich and Basel)
are left out. Town centres new to the catalogs are GeoNames' (CC BY 4.0), credited
with the map. See [the requests, the session, the completeness checks and the
markets left out](docs/bolt-app-map.md).

## Address data

Supported city names and aliases are found in the local, reviewed
scooter-city catalog, without asking any service, and are listed first. A
country, state or province typed after a city ("Lindau Deutschland",
"Portland, OR") says which one is meant, but not within a name: Staten Island
is no place in Iceland. Other places, in the parts of the world where the
catalog has countries (Europe, North America and West Asia), come
from the Address Autocomplete API of
[Geoapify](https://www.geoapify.com/) when the Worker secret `GEOAPIFY_API_KEY`
is set.
Geoapify answers from OpenStreetMap data (ODbL, credited with
`© OpenStreetMap contributors`) and other open sources it names in each answer.
Its free plan allows commercial use with visible Geoapify and OpenStreetMap
attribution, which the app displays (`Search · Geoapify`), and 3,000 requests a
day. The Worker sends the typed text, the language the app is shown in, and,
once the map shows a city or less, the map centre, rounded to about a
kilometre, as a location bias. Without one, places in the country of the
device's time zone come first, a country the browser or the iPhone sends
instead of a centre, and places in Switzerland where none is sent.
With a map centre it asks first for places within 50 km of it, and for places
anywhere, still the nearest first, only when none of those is what was typed
(Geoapify's near misses, as Zürichstrasse for "Zürich HB", do not count).
Without one it asks at the same time for places in that country and for places
anywhere, and lists that country's first: asked anywhere alone, Geoapify finds
Rothschild, Wisconsin, alone for "Rothschild", and the places of Tel Aviv's
Rothschild Boulevard only when asked in Israel; asked in Germany alone, it
finds a street in Dresden and a café for "Times Square", and New York's
square only when asked anywhere.
For text without digits it also asks, at the same time, for the towns of that
name anywhere: towns far from the map, and Fribourg for "Freiburg" next to
Freiburg im Breisgau. They are waited for as long as places are, or for 1.5
seconds. A city of the catalog typed in full asks for these towns alone. An
address typed with a city of the catalog ("Bahnhofstrasse 10, Biel") is looked
for without the city's name within 15 km of the city's centre, wherever the map
is, and anywhere near that centre when nothing is found there; a US or
Canadian address may end with its state or province and postcode
("1100 Congress Ave, Austin, TX 78701"). It leaves out places outside the
parts of the world the catalog covers, and asks for up to 20 places each time;
the app shows 5. Towns whose names are or start with what was typed come
first; those over 30 km from the map centre, unless they are cities of the
catalog, come after the streets and landmarks within 30 km of it named just as
typed ("The" and other articles aside): over Tel Aviv, "Rothschild" is the
boulevard before Rothschild, Wisconsin; "Rothschild Wisconsin" is the town.
A state or a country typed after a name says where the places of that name
are: over Portland, "Austin TX" is Austin, Texas, then a quarter named Austin
in Mesquite, Texas, whose second line names its state too ("Mesquite, TX").
A town the services name in another script than the app's, as "קרית אונו",
is written as the catalog writes it, "Kiryat Ono", or by the name of the
locality or quarter in Latin letters where they give one.

When Geoapify fails (the day's requests used up, the key refused, the service
down or slower than five seconds), or without `GEOAPIFY_API_KEY`, as in a copy
of this repository run without one, the same search goes to
[Photon](https://photon.komoot.io/), komoot's public geocoder on OpenStreetMap
data, within the part of the world around the map centre, or anywhere without
one, leaving out what is outside the catalog's parts of the world. When
Geoapify finds nothing there, as for "دبي مول" (the Dubai Mall in Arabic) away
from Dubai or "Bahnhofstrase 10", Photon is asked anywhere, still near the map
centre, with what is left of the search's ten seconds; not when a city of the
catalog starts with the text, which is shown at once, nor after Geoapify's near
misses. Its use is free within reasonable limits and may be throttled;
`PHOTON_API_URL` points the search at a Photon of our own, with the public one
standing in when ours fails (see DEPLOY.md). The `X-Geocoding-Data-Source`
response header names where the answer came from: `Verified scooter city
catalog` when the catalog has a city of the name, then the services that
answered (`Geoapify`, `Photon`), then `OpenStreetMap`, as in
`Verified scooter city catalog, Geoapify, OpenStreetMap`. The app
rate-limits searches.

## Map tiles

- The web map is drawn in the browser from [OpenFreeMap](https://openfreemap.org/)
  vector tiles in the OpenMapTiles schema, which hold OpenStreetMap data. They
  need no API key and are used only for interactive views, with visible
  attribution (`© OpenStreetMap contributors`, `OpenFreeMap © OpenMapTiles`),
  browser caching, and a valid referrer.
- Day and night, calm and detailed are drawn from the same tiles in the app's
  own colours (`src/lib/quietGround.ts`), so changing the appearance requests nothing.
- Tiles are cut up to zoom 14; closer in, the same data is drawn larger.
- If the tile host cannot be reached the map shows its plain ground colour and
  tries again; there is no second tile source.
- The service worker does not bulk-download or create offline tile archives.
- The iOS app uses Apple Maps.

## Walking routes

- On the web, Directions draws the way on foot on the map. It is asked of
  [Valhalla](https://github.com/valhalla/valhalla) on the
  [FOSSGIS routing servers](https://routing.openstreetmap.de/about.html), which
  route on OpenStreetMap data, through `/api/walk`: the browser never contacts
  them, and the server sends neither the visitor's IP address nor any cookie.
- Their [terms](https://www.fossgis.de/arbeitsgruppen/osm-server/nutzungsbedingungen/)
  ask for at most one request a second, a valid User-Agent and Referer, the
  attribution and a "fix the map" link, and no heavy use. The proxy sends
  `scootradar/2.0 (scootradar.com; hello@scootradar.com)` and the site as the
  referrer, counts all visitors together (`WALK_UPSTREAM_RATE_LIMITER`) and each
  visitor (`WALK_API_RATE_LIMITER`), and refuses walks over 10 km in a straight
  line, which open Google Maps instead. The credits list FOSSGIS and link to
  <https://www.openstreetmap.org/fixthemap>.
- The address is `WALK_ROUTE_API_URL` in `wrangler.jsonc`, as FOSSGIS asks, so
  that a Valhalla of our own can take over (`https://` only). A walk asks again
  at most every 15 seconds and ten times, when the walker leaves the way or the
  scooter moves; routes with a ferry are refused.
- The iOS app routes with Apple Maps (MapKit).

## Scooter parking in France, Germany and Italy

The reviewed regional GBFS systems also supply `station_information`,
`station_status` and `geofencing_zones` where published. Actual virtual parking
bays are shown from zoom 16, filtered to the selected providers. Parking never
adds to scooter counts or disappears because of a battery filter. Selecting a
bay identifies the operator, explains published mandatory-parking rules and
opens directions. The operator app remains the final check for ending a ride.

- GBFS 2.3 `vehicle_type_id` and GBFS 3 `vehicle_type_ids`, localized names,
  polygon holes, ordered rules, global defaults and active dates are supported.
- Only scooter-compatible virtual/infrastructure stations are used. Lime's
  synthetic whole-city stations in Lille and west of Paris are excluded. Lime's Lille parking instead
  comes from the official MEL inventory of mandatory e-scooter bays, paginated
  and cached hourly. Bike-only and non-parking records are excluded. This
  municipal inventory does not publish live return availability. Missing spots
  do not imply unrestricted parking.
- `is_returning=false` removes a bay. Virtual stations do not require installed
  docking hardware: Pony publishes `is_installed=false` alongside
  `is_returning=true` throughout its virtual parking feeds.
- Static station/rule metadata is cached for an hour; return status is refreshed
  with each scooter collection. A parking failure does not fail scooter collection.
  The API marks retained parking stale and stops exposing it after five minutes.
- Map requests read the persistent snapshot, and ask for a collection of the
  systems they cover. Country/city overviews omit
  parking geometry and individual bays to keep low-zoom payloads small.

References: [GBFS station information and geofencing](https://github.com/MobilityData/gbfs/blob/master/gbfs.md),
[Dott France's published GBFS feeds](https://transport.data.gouv.fr/datasets/tier-dott-gbfs-france?locale=fr).

Lille source and attribution: [Métropole Européenne de Lille — mandatory shared
e-scooter and e-bike parking](https://www.data.gouv.fr/datasets/espaces-de-stationnement-des-trottinettes-electriques-et-velos-a-assistance-electrique-en-libre-service).


## Ride and parking zones

A preview, off unless turned on (Settings → Map → Ride and parking zones, on
the website and in the iOS app, or `/map?zones=1`), draws from zoom 14 the zones that the Swiss national systems,
Hopp's towns and the regional GBFS systems publish in `geofencing_zones`:

- No riding (`ride_through_allowed=false`, or a limit of 0 km/h), no parking
  (`ride_allowed=false`, or GBFS 3 `ride_end_allowed=false`) and slow zones (a
  limit of 18 km/h or less, so the UK's 10 mph zones count). Zones whose rules
  allow everything else, such as operating areas, the 19 km/h Dott sets over a
  whole city and zones that ask for parking at a station, are not drawn.
- A zone is read by its first rule for a scooter type, or for every type; zones
  for bikes only, and zones outside their `start` and `end`, are left out.
- Each zone is drawn whole: a parking spot a feed lists before the no-parking
  zone around it is not cut out of that zone, and the operator's app has the
  final word.
- On the map each kind's zones are merged into one shape, whichever operators
  publish them, so the same rule over a street is drawn once, within one edge;
  no parking's and slow zones' edges give way within no riding's zones and along
  their edge. Only the providers shown are merged, so one provider shown shows
  its own.
- The cache reads a system's zones only once a view with the layer on reaches
  its area, keeps them an hour and lets them go after six hours without such a
  view. Shapes are simplified to 2 m; one answer carries at most 60,000 points,
  slow zones left out first, then no-parking zones.

## Germany and Italy

Reviewed catalogs live in `data/german-scooter-feeds.json` and
`data/italian-scooter-feeds.json`. Germany has 53 verified GBFS feeds across 60 cities:
Dott, Bolt, Hopp, Lime, Voi, Zeus and Yoio. Dott made its GBFS private in September 2026; the
catalog keeps the 16 German regions its public listing still names. Italy has 4
feeds: Bird in Roma, Palermo and Napoli, and Elerent in Catania; the other
tested Italian scooter feeds were empty, stale or unavailable. See the [coverage audit](docs/german-italian-scooter-feeds.md).

Sources: [MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
[Dott Germany](https://gbfs.api.ridedott.com/public/v2/countries/de/gbfs.json),
[MobiData BW](https://www.mobidata-bw.de/) and the individual public operator feeds.
MobiData BW supplies the reviewed Bolt, Hopp, Lime and Voi GBFS 3.0 systems,
ten of the fourteen Zeus systems and, since 25 October 2026, Dott's Heidelberg,
Heilbronn, Kaiserslautern and Stuttgart; its Voi feed covers eight Baden-Württemberg
cities, not all of Germany. Zeus's own feeds supply Bamberg, Ludwigsburg,
Regensburg and Schweinfurt. MobiData BW licenses its
[e-scooter dataset](https://mobidata-bw.de/dataset/escootch) under
[dl-de/by-2-0](https://www.govdata.de/dl-de/by-2-0), which asks for the
provider, the licence and the dataset to be named, and for changed data to be
marked: the map's credits link "DE: MobiData BW e-scooter data" to the dataset
and "DE: MobiData BW · dl-de/by-2-0, modified" to the licence, and the API's
`X-Mobility-Data-Source` header names all three.

[NRW.Mobidrom](https://www.mobilitaetsdaten.nrw), North Rhine-Westphalia's
mobility data platform, supplies Voi's 12 feeds there, in 18 towns from Köln
to Münster and Paderborn. They answer only with an OAuth token, for the client
the platform's dataset descriptions publish for all users; the scooter cache
keeps its id and secret in its environment, never in this repository, and one
token in memory for every NRW feed. Voi Technology Germany GmbH licenses this
data under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The
map credits it as "Voi Technology Germany GmbH via NRW.Mobidrom, CC BY-SA 4.0,
modified", and the Voi data of North Rhine-Westphalia that our API serves is
offered under CC BY-SA 4.0 as well. Lime's NRW feeds (dl-de/by-2-0) are not
read yet, nor Bolt's (CC BY 4.0), whose scooters come from Bolt's rider map
since 25 October 2026 (below); see the
[coverage audit](docs/german-italian-scooter-feeds.md#voi-in-north-rhine-westphalia-october-2026).

Zeus is moving its towns from `zeus.city` to ATOM Mobility
(`zeus.rideatom.com`), whose feeds publish no licence. MobiData BW's ten Zeus
feeds already republish Zeus's ATOM feeds, so none is read from ATOM. Ten towns
whose `zeus.city` feeds now list only disabled scooters, among them Kempten,
Pforzheim and Rüsselsheim, have no ATOM feed with scooters yet; see the
[audit](docs/german-italian-scooter-feeds.md#zeuss-move-to-atom-mobility-october-2026).

Yoio, added on 13 October 2026, runs on ATOM Mobility. MobiData BW supplies its
Freiburg im Breisgau scooters, in the same
[bundled e-scooter dataset](https://mobidata-bw.de/dataset/escootch) as the
others, which it licenses under the
[Datenlizenz Deutschland Namensnennung 2.0](https://www.govdata.de/dl-de/by-2-0).
Yoio's own feeds on `yoio.rideatom.com` supply Göttingen and Erfurt; they
publish no licence, as Hoppy and Ride Mobility don't. Elerent, added on
14 October 2026, publishes its Catania scooters on `elerent.rideatom.com`,
with no licence either. ATOM refuses bursts of requests, so the scooter cache
paces each `rideatom.com` host to about two requests a second.

Multi-city feeds are fetched once and routed through separate city envelopes.
City totals remain country-specific, with one count per vehicle. Published
geofencing envelopes take precedence over stray vehicle coordinates when setting
routing bounds, except for Zeus, whose zones are a single polygon or span tens
of kilometres: its bounds enclose where its scooters stood. The map never treats these routing envelopes as legal riding
or parking boundaries. Native provider filters use the same generated catalog.
Supported city names and aliases are resolved locally before address search.

## Belgium, Norway and the United Kingdom

Reviewed catalogs live in `data/belgian-scooter-feeds.json`,
`data/norwegian-scooter-feeds.json` and `data/british-scooter-feeds.json`.
Belgium has 12 feeds across 10 cities: Bolt and Dott in Bruxelles, Dott and Pony
in Charleroi and in Liège and Herstal, Voi in Antwerpen and Hoppy in
Blankenberge, Kortrijk, Mechelen, Oostende and Sint-Niklaas. The United Kingdom has 11
feeds across 18 towns: Beryl, Dott and Bolt. Both come from the operators' own
public GBFS feeds, found through
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
[Dott's listings](https://gbfs.api.ridedott.com/public/v2/countries/gb/gbfs.json),
[Beryl's index](https://beryl-gbfs-production.web.app/v2_2/gbfs.json) and, for
Pony, Belgium's national access point
[transportdata.be](https://transportdata.be/dataset/pony_charleroi), which
lists its Charleroi and Liège feeds with the key each URL needs.

Norway's 28 feeds across 22 towns (Voi, Ryde, Bolt and Dott) all come from
[Entur's Mobility API](https://developer.entur.no/docs/open-services/mobility),
Norway's national access point for shared mobility. Requests identify the app
with `ET-Client-Name: scootradar-map`, as Entur requires. Entur's
[terms](https://developer.entur.no/terms-of-service) put all its API responses
under the [Norwegian licence for Open Government data (NLOD) 2.0](https://data.norge.no/nlod/en/2.0):
contains data under the Norwegian licence for Open Government data (NLOD)
distributed by Entur AS. ScootRadar filters that data to available electric
standing scooters.

Beryl publishes its feeds under
[CDLA-Permissive-2.0](https://cdla.dev/permissive-2-0/). Bolt's
[GBFS licence](https://bolt.eu/en/legal/micromobility/security-gbfs-license/)
allows showing its vehicles, with data no older than fifteen minutes.
transportdata.be marks Pony's dataset open, under attribution. Dott, Voi and
Hoppy publish no licence in these feeds. The map's credits list Entur, the
NLOD, Beryl's licence and Pony's dataset. See the
[coverage audit](docs/belgian-norwegian-british-scooter-feeds.md) for the
systems, the gaps and the recheck command. Since 25 October 2026 Bolt's rider
map adds Antwerpen, Liège, Charleroi, Namur and Dinant in Belgium; see
[Bolt rider app](#bolt-rider-app).

Night bans on renting, in `data/rental-curfews.json`, come from each town's
rules: Lovdata for Norway, except Arendal, whose regulation and city page
disagree, where the hours are those Voi's feed keeps; the council or the
operator for Britain, the
municipal regulation for Matosinhos in Portugal, the Kyiv City Military
Administration's curfew order for Kyiv, and each American city's code,
permit rules or program page. Their areas are municipal
boundaries from Kartverket under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), local authority
districts from the ONS under the
[Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
(contains OS data © Crown copyright and database right 2018) and Portuguese
municipalities from the Direção-Geral do Território's
[CAOP](https://www.dgterritorio.gov.pt/cartografia/cartografia-tematica/caop)
under CC BY 4.0 (Informação geográfica cedida pela Direção-Geral do
Território). Kyiv's is its OpenStreetMap boundary (relation 421866), read
through Nominatim, © OpenStreetMap contributors, under the
[ODbL](https://opendatacommons.org/licenses/odbl/); simplified, it stays under
the ODbL. The credits list all four. American towns are the Census Bureau's
incorporated places, read from
[TIGERweb](https://tigerweb.geo.census.gov/tigerwebmain/TIGERweb_main.html);
as works of the federal government they are in the public domain and need no
credit.

## Portugal, Spain and Iceland

Reviewed catalogs live in `data/portuguese-scooter-feeds.json`,
`data/spanish-scooter-feeds.json` and `data/icelandic-scooter-feeds.json`.
Portugal has 12 feeds across 11 cities (Bird and Lime), Spain 14 across 16
(Bird, Hopp and Hoppy) and Iceland 16 across 20 (Hopp). All come from the
operators' own public GBFS feeds, found through
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
except Hoppy's, found on ATOM Mobility (`hoppy.rideatom.com`): Puerto del
Carmen, Playa de las Américas, Corralejo, Caleta de Fuste, Torrevieja, and
Altea, L'Albir, L'Alfàs del Pi and La Nucía on the Marina Baixa.

Bird's feeds link a
[data licence](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
that now answers 404; its last copy allows showing Bird's vehicles, credited
to Bird, with data no older than fifteen minutes. Lime's
[GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow public display
only where local law requires it and data no older than ten minutes, as in
France and Germany. Hopp links its privacy policy, not a licence, and Hoppy
publishes none. The map's credits name all four. See the
[coverage audit](docs/portuguese-spanish-icelandic-scooter-feeds.md) for the
systems, the gaps and the recheck command. Since 25 October 2026 Bolt's rider
map adds Lisboa with Oeiras, Porto with Matosinhos, Coimbra, Faro and Santarém
in Portugal, and Reykjavík in Iceland; see [Bolt rider app](#bolt-rider-app).

## Sweden

The reviewed catalog lives in `data/swedish-scooter-feeds.json`: 2 feeds in 2
towns, Lime in Uppsala and Hopp in Kiruna. Both are the operators' own public
GBFS feeds. Lime Uppsala is listed in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv);
Hopp Kiruna is not, and answers at the address Hopp uses for its other towns.
Sweden's national access point, [trafficdata.se](https://trafficdata.se),
lists no shared-mobility data.

Lime's [GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow public
display only where local law requires it and data no older than ten minutes,
as in France, Germany and Portugal. Hopp links its privacy policy, not a
licence. The map's credits name both under the GBFS line. See the
[coverage audit](docs/swedish-scooter-feeds.md) for the systems, the gaps and
the recheck command.

Since 25 October 2026 Bolt's rider map adds 3 markets, Stockholm, Malmö and Lund; see
[Bolt rider app](#bolt-rider-app).

## Latvia

The reviewed catalog lives in `data/latvian-scooter-feeds.json`: 1 feed,
Ride Mobility in Rīga. It is the operator's own public GBFS feed, on the ATOM
Mobility platform Hoppy uses too, and is listed in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).
Latvia's national access point, [transportdata.gov.lv](https://transportdata.gov.lv),
lists no shared-mobility data.

Ride Mobility publishes no licence in its feed, as Voi in Antwerpen and Hoppy
don't. The map's credits name it under the GBFS line. See the
[coverage audit](docs/latvian-scooter-feeds.md) for the system, the gaps and
the recheck command.

Since 25 October 2026 Bolt's rider map adds 12 markets, Rīga and 11 other towns; see
[Bolt rider app](#bolt-rider-app).

## Poland

The reviewed catalog lives in `data/polish-scooter-feeds.json`: 6 feeds across
8 towns. Dott covers Sosnowiec, Oświęcim, and Wołomin with Kobyłka and
Radzymin, which one Dott region spans; Hopp covers Knurów, Złotów and
Września. All are the operators' own public GBFS feeds. Dott's are named in
[Dott's Polish listing](https://gbfs.api.ridedott.com/public/v2/countries/pl/gbfs.json)
and in [MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv);
Hopp's are not in the registry, and answer at the address Hopp uses for its
other towns. Poland's national access point register,
[dane.gov.pl dataset 1739](https://dane.gov.pl/dataset/1739), lists no scooter
feed.

Dott publishes no licence in these feeds; its
[API terms](https://ridedott.com/api-licence/) restrict distribution, as
noted for France above. Hopp links its privacy policy, not a licence. The
map's credits name both under the GBFS line. See the
[coverage audit](docs/polish-scooter-feeds.md) for the systems, the gaps and
the recheck command.

Since 25 October 2026 Bolt's rider map adds 21 markets in 25 towns, Warszawa, Kraków and Gdańsk among them; see
[Bolt rider app](#bolt-rider-app).

## Hungary

The reviewed catalog lives in `data/hungarian-scooter-feeds.json`: 2 feeds,
Hopp in Pécs and Békéscsaba. They are Hopp's own public GBFS feeds. They are
not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and answer at the address Hopp uses for its other towns. Hungary's national
access point, [napportal.kozut.hu](https://napportal.kozut.hu/), lists no
shared-mobility data.

Hopp links its privacy policy, not a licence. The map's credits name it under
the GBFS line. See the [coverage audit](docs/hungarian-scooter-feeds.md) for
the systems, the gaps and the recheck command.

## Greece

The reviewed catalog lives in `data/greek-scooter-feeds.json`: 8 feeds across
11 towns. Hopp runs Faliraki, on Rhodes, Piraeus, Argostoli, on Kefalonia, and
Ioannina. Hoppy, a different operator, runs Rhodes town with Ialysos, Faliraki,
Afantou and Kolymbia, and Kos, Rethymno and Zakynthos. Both are the operators'
own public GBFS feeds, not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv):
Hopp's answer at the address it uses for its other towns, Hoppy's on ATOM
Mobility (`hoppy.rideatom.com`), as in Belgium and Spain. Greece's national
access point, [nap.gov.gr](https://nap.gov.gr/), is a landing page, and its
catalogue timed out.

Hopp links its privacy policy, not a licence, and Hoppy publishes none. The
map's credits name both under the GBFS line. See the
[coverage audit](docs/greek-scooter-feeds.md) for the systems, the town names,
the gaps and the recheck command.

## Cyprus

The reviewed catalog lives in `data/cypriot-scooter-feeds.json`: 2 feeds, Hopp
in Paphos and in Limassol, whose feed Hopp names Hopp Cyprus. They are Hopp's
own public GBFS feeds. They are not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and answer at the address Hopp uses for its other towns. Cyprus's national
access point, [traffic4cyprus.org.cy](https://traffic4cyprus.org.cy/), offers
Bolt's 255 e-scooter stations in Nicosia under CC BY 4.0, in DATEX II, with
no vehicles or availability, so the map doesn't use it. Since 25 October 2026
Bolt's rider map shows Nicosia's scooters; see [Bolt rider app](#bolt-rider-app).

Hopp links its privacy policy, not a licence. The map's credits name it under
the GBFS line. See the [coverage audit](docs/cypriot-scooter-feeds.md) for the
systems, the town names, the gaps and the recheck command.

## Finland

The reviewed catalog lives in `data/finnish-scooter-feeds.json`: 1 feed, Hopp
in Mariehamn, on Åland. It is Hopp's own public GBFS feed. It is not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and answers at the address Hopp uses for its other towns. Finland's national
access point, [finap.fi](https://finap.fi/), lists Voi's NeTEx files for
Helsinki, Turku, Tampere and Jyväskylä, with zones, prices and hours and no
vehicles, so the map doesn't use them.

Hopp links its privacy policy, not a licence. The map's credits name it under
the GBFS line. See the [coverage audit](docs/finnish-scooter-feeds.md) for the
system, the town name, the gaps and the recheck command.

## Croatia

The reviewed catalog lives in `data/croatian-scooter-feeds.json`: 1 feed, Hoppy
in Rijeka. It is Hoppy's own public GBFS 3.0 feed, on ATOM Mobility's
`hoppy.rideatom.com`, as in Kortrijk, and is not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
whose Croatian entries are nextbike's bike systems. Croatia's national access
point, [promet-info.hr](https://www.promet-info.hr/), run by Hrvatske ceste,
lists road and traffic data, not shared vehicles. The scooter cache paces
`hoppy.rideatom.com` to about two requests a second, as every ATOM host.

Hoppy publishes no licence in its Rijeka feed, as in Kortrijk. The map's
credits name it under the GBFS line. See the
[coverage audit](docs/croatian-scooter-feeds.md) for the system, the town
name, the gaps and the recheck command.

## Ukraine

The reviewed catalog lives in `data/ukrainian-scooter-feeds.json`: 1 feed,
3electra in Kyiv. It is 3electra's own public GBFS 3.0 feed, system 66 on ATOM
Mobility's `zelectra.rideatom.com`, found through
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
which lists no other Ukrainian system. The feed places the scooters 3electra
doesn't show in Lima, Peru; the scooter cache collects Kyiv within its bounds,
so they never reach the map, its totals or its health. A scooter it had in Kyiv
keeps its last place there for ten minutes, then is dropped, so a short hop
doesn't move Kyiv's count. The cache paces
`zelectra.rideatom.com` to about two requests a second, as every ATOM host.

3electra publishes no licence in its feed. The map's credits name it under the
GBFS line. See the [coverage audit](docs/ukrainian-scooter-feeds.md) for the
system, the scooters in Lima, the city name, the curfew, the gaps and the
recheck command.

Since 25 October 2026 Bolt's rider map adds 13 markets, Kyiv, Lviv and Odesa among them; see
[Bolt rider app](#bolt-rider-app).

## United States

The reviewed catalog lives in `data/american-scooter-feeds.json`: 107 feeds
in 88 towns. In Washington, DC, Hopp (Bolt), Lime and Veo; Bird in 24 towns and
Lime in 17 more, from Seattle to Norfolk, their New York feeds each in the
Bronx and Queens; Veo in 39 more, Spin in 29 and Lyft in Chicago and Portland.
Each is the operator's own public GBFS feed: Bolt's system 23 at
`mds.bolt.eu`, which Bolt
runs in Washington under the name Hopp, Veo's at `cluster-prod.veoride.com`,
Bird's at `mds.bird.co`, Lime's at `data.lime.bike`, Spin's at `gbfs.spin.pm`
and Lyft's at `gbfs.lyft.com`. All were found through
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and the addresses the operators use for their other towns.

Bolt's [GBFS licence](https://bolt.eu/en/legal/micromobility/security-gbfs-license/)
allows showing its vehicles, with data no older than fifteen minutes, as in
Europe. Veo and Lyft publish no licence in their feeds. Bird's feeds link the same
[data licence](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
as in Europe, whose last copy allows showing Bird's vehicles, credited to Bird,
with data no older than fifteen minutes. Spin, which Bird owns, links the same
licence from its feeds. Lime's
[GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow public display
only where local law requires it, the same open question as in Europe. The
map's credits name all six under the GBFS line.

Since 24 October 2026, GCOO's fleets in Los Angeles, Alexandria and Arlington
come from its app's signed-out map, read as in South Korea (below). GCOO
publishes no licence for it; the credits link to gcoo.io. Ten towns ban renting at
night, by their codes, permit rules or program pages. See the
[coverage audit](docs/american-scooter-feeds.md) for the systems, the brand
Hopp, the bounds, the night bans, the gaps and the recheck command.

## Canada

The reviewed catalog lives in `data/canadian-scooter-feeds.json`: 14 feeds,
Bird's 8 at `mds.bird.co` (Calgary, Edmonton, Leduc, Halifax, Hamilton,
Ottawa, Vaughan, Windsor) and Lime's 6 at `data.lime.bike` (Calgary,
Edmonton, Kelowna, Mississauga, Ottawa, Vancouver). Lime's Calgary feed also
holds Airdrie's scooters, and its Edmonton feed those of St. Albert and
Beaumont; each is a town of its own on the map. All but Bird Windsor are in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv);
Windsor answers at the address Bird uses for its other towns.

Bird's feeds point to its 2018 GBFS Data License Agreement, whose PDF answers
404; the archived copy of its licence page allows display. Lime's point to its
[GBFS terms](https://www.li.me/legal/public-gbfs-terms). The map's credits
name both under the GBFS line. Ottawa's winter pause comes from the city's
council report and season page. See the
[coverage audit](docs/canadian-scooter-feeds.md) for the systems, the bounds,
the empty feeds, the winter, the night rules, the parking, the gaps and the
recheck command.

## United Arab Emirates

The reviewed catalog lives in `data/emirati-scooter-feeds.json`: 3 Dott feeds
in 2 cities. Dott's `dubai` and `dubai-hills` regions, two fleets with no
scooter in common, both count under Dubai, and its `abu-dhabi` region is Abu
Dhabi. All three are Dott's own public GBFS 2.3 feeds at
`gbfs.api.ridedott.com`, in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and [Dott's Emirati listing](https://gbfs.api.ridedott.com/public/v2/countries/ae/gbfs.json).

Dott publishes no licence in these feeds; its
[API terms](https://ridedott.com/api-licence/) restrict distribution, as
noted for France above. The map's credits name Dott under the GBFS line. Dubai's
permit and Abu Dhabi's rules come from the RTA's and AD Mobility's own pages;
neither sets hours. See the [coverage audit](docs/emirati-scooter-feeds.md)
for the systems, the bounds, the rules, the gaps and the recheck command.

## Saudi Arabia

The reviewed catalog lives in `data/saudi-scooter-feeds.json`: 2 feeds.
SAHAM's in Riyadh is its own public GBFS 3.0 feed, system 748 on ATOM
Mobility's `saham.rideatom.com`, at the address ATOM gives its other
operators' feeds; it is not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).
Dott's in Jeddah is Dott's own public GBFS 2.3 feed, in the registry and in
[Dott's Saudi listing](https://gbfs.api.ridedott.com/public/v2/countries/sa/gbfs.json).
The cache paces `saham.rideatom.com` to about two requests a second, as every
ATOM host.

Neither SAHAM nor Dott publishes a licence in its feed; Dott's
[API terms](https://ridedott.com/api-licence/) restrict distribution, as noted
for France above. The map's credits name both under the GBFS line. The
national rules come from the press (Gulf News, October 2024) and set no
hours. See the [coverage audit](docs/saudi-scooter-feeds.md) for the systems,
the rides, the rules, the gaps and the recheck command.

## Israel

The reviewed catalog lives in `data/israeli-scooter-feeds.json`: 3 feeds in
14 towns, 13 of them in Gush Dan, around Tel Aviv, and Ashdod. Bird's `israel`
feed at `mds.bird.co`, Dott's `tel-aviv` at `gbfs.api.ridedott.com` and Lime's
`tel_aviv` at `data.lime.bike` are each the operator's own public GBFS feed,
all three in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).
Bird's `tel-aviv` feed, also in the registry, repeats most of `israel`'s
scooters under other ids, so it is left out. Israel's open-data portal,
data.gov.il, has cycle networks and no shared vehicles.

Each feed covers several towns, and their bounds overlap, so each town's
municipal boundary decides which town a scooter counts under. The boundaries
are OpenStreetMap's, read through Nominatim, © OpenStreetMap contributors,
under the [ODbL](https://opendatacommons.org/licenses/odbl/); simplified to
within 10 m in `data/town-outlines.json`, they stay under the ODbL, and the
credits link it.

Bird's feed points to its 2018 GBFS Data License Agreement, whose PDF answers
404; the archived copy of its licence page allows display. Lime's points to
its [GBFS terms](https://www.li.me/legal/public-gbfs-terms). Dott publishes no
licence in its feed; its [API terms](https://ridedott.com/api-licence/)
restrict distribution, as noted for France above. The map's credits name all
three under the GBFS line for Asia. See the
[coverage audit](docs/israeli-scooter-feeds.md) for the systems, the towns,
the rules, the parking, the gaps and the recheck command.

## New Zealand

The reviewed catalog lives in `data/new-zealand-scooter-feeds.json`: 10 feeds
in 11 towns, from Auckland to Dunedin. Flamingo's 8 feeds at
`data.rideflamingo.com` (GBFS 3.0) and JOLT's `new_plymouth` and `selwyn` at
`prod-api.joltscooters.co.nz` (GBFS 2.3) are each the operator's own public
GBFS feed, all in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).
JOLT's `hutt_valley` and `napier` feeds are left out: the first's scooters
weren't ridden while polled, and the second lists none.

Flamingo's `porirua` feed reaches into Tawa, a suburb of Wellington, so
Wellington City's and Porirua City's council boundaries decide which town a
scooter there counts under. They are OpenStreetMap's, read through
Nominatim, © OpenStreetMap contributors, under the
[ODbL](https://opendatacommons.org/licenses/odbl/); simplified to within 20 m
in `data/town-outlines.json`, they stay under the ODbL, and the credits link
it.

Flamingo's feeds give the licence CC-BY-4.0, with no link; the map's credits
name "Flamingo · CC BY 4.0". JOLT's give no licence. The map's credits name
both on a GBFS line for New Zealand. See the
[coverage audit](docs/new-zealand-scooter-feeds.md) for the systems, the
towns, the rules, the parking, the gaps and the recheck command.

## Costa Rica

The reviewed catalog lives in `data/costa-rican-scooter-feeds.json`: 1 feed,
Hopp in Tamarindo. It is Hopp's own public GBFS feed, not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and answers at the address Hopp uses for its other towns. Its prices are in
US dollars, with no tax added.

Hopp links its privacy policy, not a licence. The map's credits name it under
the GBFS line. See the [coverage audit](docs/costa-rican-scooter-feeds.md) for
the system, the town names, the rules, the gaps and the recheck command.

## Caribbean Netherlands

The reviewed catalog lives in `data/caribbean-netherlands-scooter-feeds.json`:
1 feed, Hopp on Bonaire, whose scooters stand in Kralendijk. It is Hopp's own
public GBFS feed, not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and answers at the address Hopp uses for its other towns. Its prices are in
US dollars, with no tax added. Bonaire is listed as the Caribbean Netherlands
(BQ), as ISO 3166 and the time-zone database list it, not under the
Netherlands.

Hopp links its privacy policy, not a licence. The map's credits name it under
the GBFS line. See the
[coverage audit](docs/caribbean-netherlands-scooter-feeds.md) for the system,
the town, the rules, the gaps and the recheck command.

## Turkey

The reviewed catalog lives in `data/turkish-scooter-feeds.json`: 13 systems,
BinBin's service areas in 12 cities, read from its guest app map (see
[BinBin guest app map](#binbin-guest-app-map)). Turkey has no public scooter
feed: none from BinBin, Martı or Hop, none in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
and İstanbul's, İzmir's and Konya's open-data portals hold parking and
routes, not scooters.

BinBin publishes no data licence. The map's credits link its site as "TR:
BinBin map", and the API names the source "Turkey: BinBin anonymous app map".
See the [coverage audit](docs/turkish-scooter-feeds.md) for the systems, the
town names, the gaps and the recheck command, and
[the app investigation](docs/turkish-app-maps.md) for Martı and Hop.

## South Korea

The reviewed catalog lives in `data/south-korean-scooter-feeds.json`: 227
systems in 117 towns, Swing in 82, GCOO in 76, Xingxing in 32, Kickgoing in 9,
and Beam's 28 regions in 36, read from Beam's rider map (see
[Beam rider app](#beam-rider-app)). No operator publishes a feed. The other
four come from the operators' signed-out app maps, with no rider account:
GCOO's and Kickgoing's with no credential, and Kickgoing's with its ally
Xingxing's scooters; Swing's with the one-time code its app computes, from a
key compiled into the app. The user asked for those three maps on 24 October
2026. Swing's key is a runtime-only secret of the cache, never in Git; the
IMEI that identifies a Swing scooter is neither stored nor shown, only a keyed
hash of it.

Each collection reads its town whole, on a bounded request plan, and fails
rather than publish part of it. Bicycles, e-bikes and mopeds are left out.
Beam, GCOO and Kickgoing give a battery level, GCOO a range too; Swing gives
only a band, so its battery stays unknown. None of the signed-out maps gives a
position's time. None of the four operators publishes a licence or terms for
this data. The map's credits name them, and link to ridebeam.com, gcoo.io and
kickgoing.io. Beam's regions are named after the municipalities they stand
in, Beam's own names kept as aliases. Town outlines are OpenStreetMap
municipalities (ODbL). See the [coverage audit](docs/south-korean-scooter-feeds.md)
for the request plans, the load, the survey, the gaps and the recheck command.
