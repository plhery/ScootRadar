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

Since 28 October 2026 Bolt's scooters in Zürich and Basel, Voi's in its eight
Swiss zones and Dott's in Zürich, Basel, St. Gallen, Romanshorn and Rorschach
stand where the operators' rider maps put them (`server/swissAppMaps.ts`, and
[Bolt's](docs/bolt-app-map.md), [Voi's](docs/voi-app-map.md) and
[Dott's](docs/dott-app-map.md) rider maps). The national platform publishes
them about every six minutes, and Voi's every eight, so a map of Zürich could
be seven minutes old; the rider maps answer with each scooter's last report.
Each collection reads both. A scooter of the rider map takes the price, range
and rental links of the national scooter standing within 15 m of it, the
nearest pairs first, and its battery where the rider map has none (Dott's): on
28 October 933 of Bolt's 955 Zürich scooters had one within 5 m, 731 of Dott's
756 within 15 m, and 85 to 95% of Voi's in each zone. One the national feed
has yet to see where it stands takes the price of the nearest that it has, and
neither range nor rental link: the map opens the operator's app. The national
feeds keep their towns, zones, metrics and alerts; the scooters' ids are the
rider maps'. While a rider map fails the national feed alone stands, and
Sentry hears of it after ten minutes; while sharedmobility.ch fails, or answers
over two seconds after the rider map, the scooters keep the attributes it gave
last. These feeds are collected as the app maps are, every minute while someone
looks and every twenty minutes while nobody does; Switzerland's other feeds
stay on the minute.

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

Lime's Kloten zone, a region apart from its Zürich and Opfikon zones, is in no
feed either, nor is its Sion zone. Since 28 October 2026 the cache reads both
from Lime's rider map, signed in, as in Europe (see
[the Lime catalog](docs/lime-app-map.md)), from Switzerland's catalog,
`data/swiss-scooter-feeds.json`, which holds only such app maps, reported as
`switzerland` in `meta.sources`. Their scooters count under the towns' areas
with the dataset's: Kloten's, and Sion's, which only Lime serves, its zone and
1 km around it, centred on GeoNames' coordinates for the town (CC BY 4.0).
`SCOOTER_ALWAYS_FAST=CH`, which stands for the dataset, Hopp and PubliBike,
leaves them at Lime's own pace.

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

The rider maps of Voi, Lime, Dott and Bolt carry no price either, and since 28
October 2026 their scooters get a listed price in the same way, where there is
one; a Lime market's price covers all its refresh groups. In Germany and the
UK these four show their city prices only in their apps, and voi.com and
li.me refuse automated reads, so the prices come from the city: moBiel's page
for Dott in Bielefeld, Transport for West Midlands' for Lime in Birmingham and
on the University of Warwick's campus, Slough Borough Council's for Voi in
Slough, and Miskolc's for Lime there. Italy, Sweden and Austria had none on
28 October: their cities name the operators but leave the price to the apps.

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
systems in flight: Switzerland every minute, but for its rider maps' feeds, the
others every twenty minutes, or every minute for ten minutes after someone looks at them. Bird's, Spin's and
Bolt's own feeds, whose licences let their data be kept fifteen minutes, are
collected every thirteen minutes while nobody looks: the cache drops their
positions, in memory and in its saved copy, the documents it read them from and
the city totals counting them before they are fifteen minutes old by their
source timestamp, and the Worker keeps an answer holding them no longer. Read
through Entur, MobiData BW, NRW.Mobidrom or the Swiss national platform, the
same operators come under those platforms' licences instead. Map requests read only
the relevant cached systems; one for a system whose data is over a minute old
starts its collection, and, when its positions are over fifteen minutes old and
it collects in under three seconds, waits for it, up to three seconds, answering
as soon as the first such system is in. The local direct-feed fallback selects by viewport
and allows four concurrent French systems. Individual scooter positions remain
usable for at most fifteen minutes from their source timestamp, including when a
refresh fails; missing timestamps and older data are rejected. The operators'
app maps read in slow paced sweeps differ in three ways since 25 October 2026.
Those of Whoosh, GCOO, ATOM and BinBin are collected every two hours while
nobody looks, Bird's once a day, and Lime's many markets every three days. A sweep
starts where the request looked and publishes each part of its area as it
finishes it, so the map fills in as it goes. And since 26 October, any feed whose
collection takes over three seconds, timed on each, is not waited for: while it
is collected again, its positions up to three hours old, a day for Bird's, or three
days for Lime's, stand faded where they were last seen, counted nowhere, until the sweep
reaches them. The national
platform publishes Voi every eight to nine minutes, about ninety seconds after
the timestamp it carries, so a shorter limit blanks Voi whenever it is a little
late. City totals are aggregated hourly, and those of Bird's, Spin's and Bolt's
own feeds again whenever the oldest data they count is about to turn fifteen
minutes old, two or three times a minute. Each scooter counts under the
nearest town whose bounds hold it; outside Switzerland the towns its own
feed serves come first, so a scooter in east Oslo is Oslo's, though
Lørenskog's centre is nearer. Where a town's municipal boundary is listed in
`data/town-outlines.json`, as in Gush Dan, around Lille, Liège, Oslo, Heilbronn, Düsseldorf and Torino, in the Ruhr,
in west Los Angeles or between Recife and Jaboatão dos Guararapes, a scooter inside it counts under that town first, under the
smaller of two outlines that nest. The outlines are OpenStreetMap's (ODbL),
Kartverket's for Norway (CC BY 4.0), the ONS's for Bournemouth, Christchurch
and Poole (OGL v3.0), the Census Bureau's for American towns (public
domain) and IBGE's municipal mesh for Brazil's, as the Geological Survey of
Brazil's map service serves it, simplified to within 20 m, Israel's to within 10 m; the credits
link the licences and IBGE. JET's Recife area runs past the town line into
Jaboatão, where on 25 October 2026 about 40 of its scooters stood, 39 at one
spot a few dozen metres past it: by the outlines they count under Jaboatão. On the
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
its official app shows riders who have not signed in, and since 25 October in
Skopje, Sarajevo and Pristina. The user authorized it on 24 October. No rider
account, token or device id is used. Each reply lists the
ten scooters nearest a point, with their distances, so the Node cache sweeps
each of BinBin's 16 service areas until every point of it lies within a reply
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
Brussels and Liverpool, Entur's Oslo) are left out; Zürich's and Basel's are
read for the Swiss platform's feeds, which keep their prices and rental links. Town centres new to the catalogs are GeoNames' (CC BY 4.0), credited
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

A preview, on unless turned off (Settings → Map → Ride and parking zones, on
the website and in the iOS app, or `/map?zones=0`), draws from zoom 14 the zones that the Swiss national systems,
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
- GCOO publishes no GBFS feed, but since 29 October 2026 its zones in Los
  Angeles, Arlington and Alexandria come from its app's public area file
  (`region.gbike.io/us/all_polygons.json.gz`): its no-ride and slow zones, which
  give no speed, and its no-parking areas, holes included, credited to GCOO. The
  file is read once an hour for the three towns, and each zone goes to the town
  whose box it reaches into whose centre is nearest, so that a zone in both
  Virginia boxes is drawn once (see the
  [coverage audit](docs/american-scooter-feeds.md#gcoo) for the counts).

Streets where a city or its police forbids riding, in `data/rule-zones.json`,
are drawn as no riding's zones are, from zoom 14 whether the layer is on or
not, dimmer outside their hours; the legend gives the hours and names who
forbids it, linked to where they say so. The iOS app has them as built
(ProviderCatalog.generated.swift). So far Seoul's three kickboard-free
streets, 12:00 to 23:00 every day: Hongdae's Red Road (sections R1 to R6) and
Banpo's academy street since 16 May 2025
([Seoul and the Seoul police](https://news.seoul.go.kr/traffic/archives/514266)),
and Daechi-dong's academy street since 30 September 2026
([Gangnam-gu](https://www.gangnam.go.kr/board/B_000031/1075336/view.do?mid=ID01_0313)).
Each was traced from its authority's map, [Seoul's](https://mediahub.seoul.go.kr/archives/2014422)
and the one in Gangnam's notice, laid over OpenFreeMap's roads: Hongdae's and
Daechi-dong's lines follow the line drawn, Banpo's are the roads under it,
© OpenStreetMap contributors under the ODbL. The pages are under KOGL Type 4
(credit, no commercial use, no changes): only where and when the rule holds is
taken from them, not their maps or words. Yeonsinnae's and Wirye's streets,
which the press reports from 30 September 2026, wait for an official page, and
Antalya's ban on Yaşar Sobutay Bulvarı (UKOME decision 374) for an official
line of which road it means.

The zones cities set for shared e-scooters, in `data/city-zones.json`, are
drawn the same way, from zoom 14 whether the layer is on or not, each kind as
the operators' (no riding, no parking, slow), the places to park in green and
Nagoya's pavements as teal lines; the legend names the city, linked to where it
says so. The web loads a city's zones, `data/city-zones/<id>.json`, only once a
view reaches it; the iOS app has them as built, all but Nagoya's pavements,
which `scripts/generate-provider-catalog.mjs` leaves out of both apps'
catalogs, and Berlin's and Hamburg's, too many to build in: the iOS app
downloads those from the website's `/zones/v1/` once a view reaches the city
([city zone downloads](docs/city-zone-downloads.md)); the website draws them
as it does the others. `scripts/update-city-zones.mjs` reads
them again. Alexandria, Basel, Berlin, Bordeaux, Braunschweig, the City of London,
Hamburg, Helsinki, München, Münster, Reykjavík, Rīga, Rostock, St. Albert,
Santa Monica, Stockholm, Taupō, Turku, Vancouver, Vantaa, Washington, Wien and
Zürich state a licence or terms for their layers, Washington for two of its three; since 28 October 2026 a
city's public zone layers are drawn regardless, credited to the city.

- **Alexandria** (read 30 October 2026): the City of Alexandria's 63 corral
  areas, 13 no-ride zones and 6 slow zones, from its open data under CC0
  ([Corral Areas](https://www.arcgis.com/home/item.html?id=08767b36d91742919d94100b2c8258c7),
  [Micromobile Restrictions](https://www.arcgis.com/home/item.html?id=0a02f6c5b3fc42009ce6420730a12326),
  both updated 7 April 2026). The no-ride zones are pedestrian-only places and
  synthetic athletic fields (`RSTNCAT` "No Ride Zone", 0 mph); the slow zones
  (`RSTNCAT` "Slow Zone, No Parking", 6 mph) are drawn as no-parking zones too.
  The legend links the City's
  [Dockless Mobility page](https://www.alexandriava.gov/DocklessMobility): the
  slow zone of Robinson Landing, made permanent, was extended over the Old Town
  waterfront, the pedestrian blocks of King Street and Founders Park.
- **Antwerpen** (read 30 October 2026): the Stad Antwerpen's zones for shared
  e-steps, layers of its geodata service shown on its open data portal: 38
  no-go zones (36, some of two parts; cemeteries, tunnels), 330 no-parking
  zones (322; parks, the city centre) and 45 low-speed zones (44; the Meir and
  other busy streets), `portal_publiek11/MapServer` layers 1068, 1069 and 1070,
  revised in August 2022 and republished on 17 September 2026; and its 211
  drop zones for e-steps (`modus` "Step" or "scooter en step"), where shared
  vehicles are preferably left, of the 519 in `portal_publiek13/MapServer`
  layer 33, kept daily. They state only "Copyright: Stad Antwerpen" and are
  drawn under the rule of 28 October 2026, credited to the city. The zones'
  names are mostly ids (`GISID_323`), so they are named after the city; the
  drop zones by theirs ("Dropzone Meir 1"). antwerpen.be answers scripts 403,
  so the legend links the portal's
  [NOGO-zones](https://portaal-stadantwerpen.opendata.arcgis.com/datasets/55c2b107304e43bca2c63b9aa516adcf_1068),
  whose description says what each layer is. Left out: the drop zones for
  mopeds (Felyx), cargo bikes (Cargoroo) and bikes (Donkey Republic).
- **Arlington County** (read 30 October 2026): the County's 128 installed
  shared mobility device corrals, for scooters and bicycles, each drawn as a
  disc 5 m round its point, from layer 2 of its `Open_Data/od_Transportation_Layers`
  feature service, which its
  [corrals map](https://arlgis.maps.arcgis.com/apps/instant/basic/index.html?appid=f525cf9c5bce4cbb9c360b2daecdf31c)
  draws ("Last Revision Date: 3/12/2025", synced in October 2026). Left out:
  the corrals proposed, approved, not approved or removed, for good or for a
  while, as the 9 "Temporarily removed" the County's map shows apart. Its GIS
  data is "provided as a public resource", © Arlington County and not in the
  public domain; it is credited "Arlington County". The legend links the
  County's
  [page](https://www.arlingtonva.us/Government/Programs/Transportation/Scooters-and-Dockless-Bikeshare),
  which answers scripts 403: more than 100 corrals give riders safe places to
  park e-scooters and e-bikes upright and out of the way.
- **Arlington National Cemetery** (read 29 October 2026): no city's, but a
  federal rule's. No one may ride "a bicycle or similar conveyance" in an Army
  National Military Cemetery without a pass to visit a grave
  ([32 CFR 553.33(c)(8)](https://www.ecfr.gov/current/title-32/section-553.33)),
  while Bird's zones and GCOO's let scooters ride through it, parking only
  barred. It is one no-riding zone, the cemetery's outline from
  [OpenStreetMap](https://www.openstreetmap.org/relation/2475077) (© OpenStreetMap
  contributors, ODbL), and the legend credits the rule and OpenStreetMap. The
  outline's one hole, about 60 m across, is bleachers within the cemetery, so
  the zone has none.
- **Atlanta** (read 30 October 2026): the City of Atlanta's 19 installed
  micromobility corrals, 10 the City's and 9 Midtown Alliance's, each drawn as
  a disc 5 m round its point, from its `Micromobility_Corrals` feature service
  (`InstallationStatus` "Complete"), which its Department of Transportation's
  [Micromobility Corrals and Racks Map](https://www.arcgis.com/home/item.html?id=bc4a33a056b84971b97b0de992d33b63)
  draws. Left out: the 19 not yet installed. The layer states no licence; it is
  drawn under the rule of 28 October 2026, credited "City of Atlanta".
  ATLDOT's [page](https://atldot.atlantaga.gov/services-2/bikes-and-scooters/)
  doesn't name the corrals, so the legend links the map. Also left out: the
  downtown no-parking and slow zone (`Shared_Micromobility_No_Parking_Slow_Zone`,
  May 2026), which no City page describes; Bird's own no-parking zone there,
  of the same outline, is drawn as Bird's.
- **Baltimore** (read 30 October 2026): the Baltimore City Department of
  Transportation's 71 scooter corrals, "locations of corrals for the shared
  scooter program", each a disc 5 m round its point, from its `Scooter_Corrals`
  feature service (`ScooterCorrals_20240530`, "Last updated 2024"), all of
  which its
  [Bike Racks and Scooter Parking Map](https://www.arcgis.com/home/item.html?id=b14d91d49b584dfdb1c6ca3713a30231),
  updated in August 2026, shows alike: its `Has_Scoote` field, "Yes" for 45, is
  not explained, so all are drawn. The layer states no licence; it is drawn
  under the rule of 28 October 2026, credited to the Department, whose map the
  legend links.
- **Basel** (read 30 October 2026): the Kanton Basel-Stadt's 33
  no-parking zones (`Parkverbotszone`), where a shared vehicle's rental may
  not end, and 21 zones it may not be ridden through (`Sperrzone`), from the
  Amt für Mobilität's open data
  ([dataset 100332](https://data.bs.ch/explore/dataset/100332/), CC BY 4.0,
  "Geodaten Kanton Basel-Stadt"; its "+ OpenStreetMap" is the canton's
  permission for OpenStreetMap to take its CC BY data in), its GeoJSON export,
  last changed 29 January 2025. The legend links the canton's
  [Shared Mobility page](https://www.bs.ch/bvd/mobilitaet/shared-mobility),
  whose map shows the same zones, and whose usage rules of 1 September 2025
  have the providers build them into their apps within a week. The providers
  may set more zones of their own, which these are not. The zones' names,
  codes such as `PV_Bahnhof_Sued`, are left out.
- **Bergen** (read 29 October 2026): Bergen kommune's 176 parking places, 149
  no-parking zones, 74 slow zones and 373 no-riding zones, the layers its
  [e-scooter map](https://www.bergenskart.no/portal/apps/sites/#/bergenskart/app/64eef270a9834ac089dca4d4b217208e)
  draws from `kart.bergen.kommune.no/arcgis/rest/services/Bymiljoetaten/`
  (`Parkeringsplass_for_elsparkesykkel`, `Parkering_forbudt`, `Saktesone`,
  `Sone_med_kjøreforbud`). Their query answers no shapes, so they are read
  with identify, as the map reads a zone clicked. The legend links the city's
  [rules](https://www.bergen.kommune.no/innbyggerhjelpen/vann-vei-og-trafikk/vei-transport-og-parkering/sykkel/elsparkesykler-i-bergen):
  in the inner city centre a scooter is left only on a marked place, and a
  ride cannot end in a no-parking zone. The regulation's three zones
  (`Reguleringssone`) are not drawn: they set how many scooters each operator
  may place, not where to ride or park. Three parking places lie within
  no-riding zones: Festplassen and Steinerskolen Paradis wholly, Torgallmenningen
  nord three quarters. The city's map draws them so, its no-riding zones over
  them, as ScootRadar's does, and lists all three as active (`Status` "Aktiv";
  Festplassen's repainted in May 2023, Steinerskolen's set out with the school),
  so they stay (checked 29 October 2026).
- **Berlin** (read 30 October 2026; the iOS app downloads them, and the
  website draws them since 30 October 2026): the Land Berlin's 2,529 no-parking zones for rental micromobility
  (2,594 parts), parks, playgrounds, cemeteries and places the districts
  report, which the operators keep free under their special-use permits since
  1 September 2022, and its 637 parking places, Jelbi points and stations and
  other marked areas, where riders should preferably leave them, each the
  circle of 10 m the Senate draws round it to find a scooter in it, from the
  Geoportal Berlin's WFS (`parkverbot_mikromob:parkverbot_mikromobilitaet`,
  `abstell_mikromob:ortung_mikromob`) as GeoJSON, of its open data
  ([Parkverbotszonen für Mietfahrzeuge der Mikromobilität](https://gdi.berlin.de/view/parkverbot_mikromob),
  DL-DE Zero 2.0, revised quarterly, last on 1 October 2026). The licence asks
  for no credit, so the legend names only the Land Berlin, in a line on a
  narrow phone, and links the Senate's [e-scooter page](https://www.berlin.de/sen/uvk/mobilitaet-und-verkehr/verkehrsplanung/elektromobilitaet/elektro-tretroller/):
  an e-scooter may not be ridden or parked in a park. The no-parking zones are
  simplified to within 2 m, which takes their 82,432 points to 58,256. Each
  parking place takes its name from the layer: a Jelbi point's or station's
  ("Jelbi U Breitenbachplatz") or a street's, but 210 of the 220 marked areas
  have only the placeholder "VRAO", which names none of them (`unnamed`).
- **Boise** (read 29 October 2026): the City of Boise's 43 parking corrals,
  44 no-parking zones, 9 slow zones and 71 no-riding zones, from the
  `Boise_Micromobility` feature service its
  [micromobility map](https://boise.maps.arcgis.com/apps/instant/basic/index.html?appid=178b5eb1b16b48989624aa28ae6a4506)
  draws (zones last edited 22 May 2026, corrals 10 June 2026). The legend
  links the City's
  [rules](https://www.cityofboise.org/departments/finance/how-to-use-e-scooters-and-e-bikes/):
  obey the geofenced no-ride and slow zones its map shows, and end a trip
  downtown or on Boise State's campus at a mandatory parking pin. The corrals
  are points, drawn as discs 5 m round them; the 23 marked not installed are
  left out. The layer names none, and only types them: each is named for its
  type ("Sidewalk corral"), and the one without, Boise State's on its campus
  (object 63, rechecked 30 October 2026), just "Corral". Left out too: the two mandatory parking zones (Downtown and BSU),
  which ScootRadar has no kind for, the pins being Lime's; and the no-operation
  layer's ring of 5,259 km² round the whole service area, over Meridian, Eagle
  and Nampa, which marks where Lime's service area ends, as Lime's own zones
  do, and which is no rule of the City's there. Lime's own region data has a
  "Grove Center LSZ" over the Grove Plaza: it is the City's slow zone there, the
  same 37 points. Of Lime's 1,405 scooters in Boise at 03:25 MDT on 29 October,
  13 stood in a no-riding zone and 147 in a slow zone. Garden City, whose
  scooters are of Lime's Boise market, publishes its slow zones only as Lime's
  maps in PDF (28 October 2025, on its
  [Greenbelt page](https://gardencityidaho.org/e-vehicles-on-the-greenbelt/)),
  with no shapes to draw.
- **Bordeaux** (read 31 October 2026): Bordeaux Métropole's 556 places for
  shared bikes and e-scooters (`typologie` VT, bikes and e-scooters, and VTS,
  bikes, e-scooters and mopeds), each named for its commune (`nom_commune`),
  from its open data
  [Emplacement freefloating Bordeaux Métropole](https://opendata.bordeaux-metropole.fr/explore/dataset/st_freefloating_s/),
  under the Licence Ouverte, its GeoJSON export, refreshed daily (places
  entered from 25 September 2025, the last on 23 October 2026). Its 40 places
  for bikes or mopeds alone (V, VS and S) are not drawn. The places are those
  marked on the ground, half of them under 10 m². The legend credits
  "Bordeaux Métropole, Licence Ouverte" and links the Métropole's
  [free-floating page](https://sedeplacer.bordeaux-metropole.fr/a-velo/loffre-free-floating-bordeaux-metropole):
  from 1 November 2025 to 1 November 2029, Pony and Dott rent e-scooters in 24
  of its communes, where one is parked in a place set for it, shown in the
  app and marked on the ground. Those communes are not drawn as a zone where a
  scooter is left only in one, the layer holding the places alone. One place
  is in Talence, which the service leaves out.
- **Boulder** (read 29 October 2026): Lime's 42 no-parking zones, 8 slow
  zones and 51 no-riding zones, credited to Lime, from the public
  [zone file](https://assets.lime.bike/zones_attributes/Boulder_1150_exclude_new_type.json)
  its rider app draws them from (version 1150, last changed 18 October 2026),
  drawn with the user's leave of 29 October 2026, as GCOO's file was: the City
  of Boulder's own layer of them, `trans/LimeScooterLocations` on
  gis.bouldercolorado.gov, answers scripts only with a Cloudflare challenge.
  Each zone is an encoded polyline, to within about a metre; Lime's names are
  kept without their codes ("[Boulder][NOZ - Policy][CU Williams Village]" is
  CU Williams Village). The legend links the City's
  [rules](https://bouldercolorado.gov/services/shared-e-scooters-and-e-bikes):
  Lime's scooters, standing and seated (LimeGliders) alike, are geofenced, their
  speed limited in places and stopped in no-go zones, and a ride in the
  Mandatory Parking Zone, most of central Boulder, ends at a Lime parking
  corral. Left out: Lime's five mandatory parking zones, that one among them,
  the corrals not being in the file, so that nothing would show where to park;
  the service area; and two no-operation zones of 88 and 90 km² east and west of the city,
  where Lime's service area ends, as Boise's. The slow zones' speeds are not
  shown: two of the eight give one speed in the zone and another in the
  banner the app shows (10 mph against 5 mph, and against 13 km/h).
- **Braunschweig** (read 31 October 2026): the Stadt Braunschweig's 29
  parking places for e-scooters in force
  ([Abstellflächen für E-Scooter](https://opendata.braunschweig.de/dataset/abstellfl%C3%A4chen-f%C3%BCr-e-scooter),
  published 2 March 2026), its 54 no-parking zones and the old town within the
  Oker, the Okerumflut, where since 26 October 2022 a hired scooter is parked
  only on one of the marked places (`PVZ - Geschäftsgebiet - A1`,
  "Stationsbasiertes System innerhalb der Okerumflut", drawn as racks or
  marked places only, only on the website; its holes, the pedestrian zone
  among them, are left open),
  from [E-Tretroller | Parkverbotszonen](https://opendata.braunschweig.de/dataset/e-tretroller-parkverbotszonen)
  (files of 25 November 2025), both CC BY 4.0 and credited "Stadt Braunschweig,
  CC BY 4.0". Each is a zip of GeoJSON files, one zone a file. The places set
  until a day, as An der Martinikirche until 28 October 2026, are not drawn,
  and the abbreviations the names begin with (AZ, PVZ) are left off. The
  portal's [terms](https://opendata.braunschweig.de/page/nutzungsbedingungen-kontakt-lizenzen)
  ask a service that uses its data to tell the editors where it is found. The
  legend links the city's
  [press release of 26 October 2022](https://www.braunschweig.de/politik_verwaltung/ob/textarchiv/textarchiv-2022/790_E_Scooter_stationsbasiertes-System_2610.pdf).
- **City of London** (read 30 October 2026): the City of London
  Corporation's 45 parking places for hire scooters and bikes, each set by a
  traffic management order (2022/21, 2024/1, 2025/13 and 2025/17) and named
  for its street, from layer 86, "Scooters and Cycle Hire Parking Places", of
  its `INSPIRE/MapServer` on mapping.cityoflondon.gov.uk, revised on 28 April
  2025. They are its open data,
  [Parking Places (Scooters/Cycle Hire)](https://www.data.gov.uk/dataset/fe236d1a-e071-40cc-91d4-ba93e0c7ec07/parking-places-scooters-cycle-hire),
  under the Open Government Licence v3.0 (contains public sector information
  licensed under the Open Government Licence v3.0), and the legend links that
  record: no City page describing the places was found. Its Santander Cycles
  docking stations (layer 65) are left out.
- **Columbus** (read 30 October 2026): the City of Columbus's 47 active
  scooter corrals, 42 marked and 5 virtual, installed from April 2023 to
  January 2026, each a disc 5 m round its point, from layer 42 of
  `Schemas/PublicService/MapServer` on maps2.columbus.gov, which the Division
  of Parking Services'
  [Mobility and Parking Map](https://experience.arcgis.com/experience/648adcf8a293489b9ec3f5017e7c9d2b)
  draws. The City's open data listed an older copy under CC0 (layer 49, gone);
  this one states no licence, and is drawn under the rule of 28 October 2026,
  credited "City of Columbus". columbus.gov answers scripts 403, so the legend
  links the map.
- **Hamburg** (read 30 October 2026; the iOS app downloads them, and the
  website draws them since 30 October 2026): the Freie und Hansestadt Hamburg's 3,043 no-parking zones for
  e-scooters (3,589 parts; one has no shape and is left out, and so are the
  island of Neuwerk's four, off Cuxhaven about 105 km away, which would
  stretch the city's area over all the land between: the WFS is asked only for those within a box
  round the mainland city), where a rental
  can't end, green spaces, schools and sports grounds among them, and its 145
  parking areas, 48 marked on the street and 97 digital ones at stops, each a
  disc 5 m round its point, from the city's WFS (`wfs_hh_escooter` on
  geodienste.hamburg.de) as GeoJSON, of its open data
  ([Abstellflächen und Parkverbotszonen E-Scooter Hamburg](https://metaver.de/trefferanzeige?docuuid=723941D2-768B-4ABB-B657-8C0004AE80DD),
  DL-DE BY 2.0; credit: Freie und Hansestadt Hamburg, Behörde für Verkehr und
  Mobilitätswende). The legend links the city's
  [e-scooter page](https://www.hamburg.de/verkehr/e-mobilitaet/e-scooter-411320):
  a rental can't end in the no-parking zones, shown red in the operators'
  apps, and where it can the city pairs them with marked parking areas. The
  no-parking zones are simplified to within 2 m, which takes their 184,000 or
  so points to 56,736 (Neuwerk's left out, rechecked 30 October 2026).
- **Helsingborg** (read 30 October 2026): central Helsingborg, about 3.9 km²
  from Tågaborg to Söder, where e-scooters park only in a bicycle rack or a
  marked place: the area of Helsingborgs kommun's local traffic rule
  1283 2022:502, in force since 1 September 2022, which lets them park on a
  pavement or cycle track only outside it. The area is one closed line of 33
  points in SWEREF 99 TM, which the rule's page in Transportstyrelsen's
  register,
  [STFS](https://rdt.transportstyrelsen.se/rdt/AF06_View.aspx?UseStfs=1&ForeskriftId=670e14f8-a3d8-447a-ae02-8021396b466a&of=1&ForeskriftIds=670e14f8-a3d8-447a-ae02-8021396b466a&map=1),
  gives its map as GeoJSON; the rule's PDF has it as a picture. Statutes, local
  traffic rules among them, have no copyright in Sweden (upphovsrättslagen
  9 §); drawn credited "Helsingborgs stad", under the rule of 28 October 2026.
  The legend links the rule's page. "Park only in racks or marked places" is a
  kind of the website's alone: neither app draws it yet.
- **Helsinki** (read 30 October 2026): Helsingin kaupunki's 312 e-scooter
  parking places (`tyyppi = 'Sähköpotkulauta'`), from its parking places
  layer `Pysakointipaikat_alue` in the city's open WFS, as GeoJSON
  ([Helsinki Region Infoshare](https://hri.fi/data/en_GB/dataset/helsingin-kantakaupungin-ja-asukaspysakointivyohykkeiden-pysakointipaikat),
  CC BY 4.0, updated daily). The legend links the city's
  [e-scooter page](https://www.hel.fi/fi/kaupunkiymparisto-ja-liikenne/pyoraily/sahkopotkulaudat):
  in the centre, Taka-Töölö, Pasila, Kallio and Kalasatama, and near metro
  and train stations, a rental scooter may be parked only in a marked place,
  painted on the ground and shown in the apps. Its no-parking and no-riding
  areas are published only as PDF maps, so they are not drawn.
- **Järvenpää** (read 30 October 2026): Järvenpään kaupunki's 81 no-riding
  areas (`Ajokielto`), 48 no-parking areas (`Pysäköintikielto`) and 10 areas
  of 10 km/h (`Nopeusrajoitus`), the lasting ones (`Tila = 'Pysyvä'`) of
  layer 26 of the City's public `Sähköpotkulautojen_rajoitusalueet` feature
  service (last edited 28 August 2026); no licence stated. The legend links
  the City's
  [map of the areas](https://experience.arcgis.com/experience/91cba3f79cec46c8a75b36f070ebbe11):
  its micromobility permit terms put them on the City's map service from the
  start of the 2026 season and have the operators enforce them in their apps,
  as the City's
  [answer to the statements on the draft terms](https://jarvenpaa.cloudnc.fi/download/noname/%7Bb2145052-c3b0-4393-8793-156c83927dd8%7D/74751)
  says. Left out: two temporary no-parking areas; 18 speed areas marked not
  yet in use and 4 marked only `rajoitus`; a no-riding sliver of a tenth of a
  square metre; the core centre's 15 km/h, which holds only on weekend and
  holiday nights (23:00–05:00); and the 37 parking places, which the City
  draws as lines.
- **Lambeth** (read 31 October 2026): Lambeth Council's 342 shared parking
  bays for rental e-scooters and e-bikes and Transport for London's 4 in the
  borough, points each drawn as a disc of 5 m and named for their street, and
  the London Borough of Lambeth's outline, where a rental scooter is left only
  in a bay (racks or marked places only, drawn only on the website), from the
  council's map
  [Lambeth Shared E-scooter and E-bike Parking Bays](https://www.google.com/maps/d/viewer?mid=1FbWV3uJ-tR_bJSPB-JhQzy7gUKmwISw),
  a Google My Maps map linked from its
  [Dockless Cycle Hire](https://www.lambeth.gov.uk/shared-mobility-lambeth/dockless-cycle-hire)
  page, read as KML: "Lambeth uses a bay-only parking system". The legend links
  that page. The map states no licence; the council's
  [terms](https://www.lambeth.gov.uk/about-council/using-website/terms-conditions-disclaimer)
  put its website under its copyright and the Open Government Licence. The
  outline's 3,996 points are 855 within half a metre. The other boroughs in
  London's rental trial publish no bays as data (docs/coverage-gaps.md).
- **Minneapolis** (read 30 October 2026): the City of Minneapolis's 206
  zones where a ride may not end (bridges, construction), 8 speed-capped zones
  (8 or 10 mph: the Stone Arch Bridge, the Loring Greenway, the University of
  Minnesota's plazas) and 21 no-riding areas in 23 parts (plazas, parking
  ramps, golf clubs, the university's malls), from layers 2, 1 and 3 of the
  City's public `SBSP_Operations_and_Geofence_Data` feature service (last
  edited 23 October 2026), which states no licence and no City page links.
  The legend links the City's
  [parking rules](https://www.minneapolismn.gov/getting-around/scooters/scooter-rules/scooter-parking-rules/):
  a scooter is locked to a public bike rack, a parking meter hitch or most
  street signs, not a bus stop sign, out of the sidewalk's 4-foot clear zone.
  Left out: the 63 mobility hubs, points where scooters are one service among
  bikes and transit rather than places a ride must end; the University of
  Minnesota's campus; and the equity distribution areas.
- **München** (read 30 October 2026): the Landeshauptstadt München's 430
  parking areas for shared e-scooters, 791 no-parking zones, where a rental
  can't end, and 55 no-riding zones (63 parts), the Mobilitätsreferat's
  layers for e-scooter sharing (`ruhver_mim_abstellfl_ts`,
  `ruhver_mim_abstellverbot_ts`, `ruhver_mim_fahrverbot_ts`) in the city's
  open WFS, as GeoJSON, of its open data
  ([no-parking zones](https://opendata.muenchen.de/dataset/opendata_ruhver_mim_abstellverbot_poly),
  DL-DE BY 2.0, edited to October 2026). The legend links the city's
  [e-scooter sharing page](https://muenchenunterwegs.de/angebote/elektrotretroller-sharing):
  since 5 August 2022 a rental in the old town ends only in a marked parking
  area, and its geoportal shows the parking areas and zones.
  The no-parking zones, drawn to the centimetre, are simplified to within 2 m
  rather than half a metre, which takes their 29,669 points to 17,747. Left
  out: 11 parking areas suspended by building works and 5 standing in for
  them, each until a set day, and 4 no-parking zones of building sites and an
  event, also until a set day.
- **Münster** (read 30 October 2026): the Stadt Münster's 432 parking zones
  for e-scooters and 701 no-parking zones round them, where a rental can't
  end, from its WFS (`ms:parkzonen_emobility`, `ms:sperrzonen_emobility`) as
  GeoJSON, of its open data
  ([Abstellflächen und Parkverbotszonen E-Scooter Münster](https://opendata.stadt-muenster.de/dataset/abstellfl%C3%A4chen-und-parkverbotszonen-e-scooter-m%C3%BCnster),
  DL-DE BY 2.0, zones added to September 2026). The legend links the
  Ordnungsamt's [e-scooter page](https://www.stadt-muenster.de/ordnungsamt/elektro-tretroller):
  since 24 April 2023 the public areas round the parking zones, first in the
  city centre and on Weseler Straße, are no-parking zones. The features have
  no ids, so each zone's is a hash of its shape. Left out: three no-parking
  slivers of under a square metre, which simplify to nothing.
- **Nagoya** (read 29 October 2026): the pavements where an e-scooter in its
  6 km/h mode may ride, 1,801 lines, about 1,508 km: rule 81 (普通自転車歩道通行可)
  of the Aichi police's traffic rules, from the open data
  [「交通規制情報」](https://www.jartic.or.jp/service/opendata/) of the Japan Road
  Traffic Information Center (JARTIC), the file of 1 October 2026
  (`typeD_aichi.zip`, one CSV of the whole prefecture in its spec 拡張版標準フォーマット
  k_2.1), the rules as of August 2026. Credit: 出典：「交通規制情報」（https://www.jartic.or.jp/service/opendata/）（公益財団法人日本道路交通情報センター）を加工して作成.
  Where the sign 325の3 「普通自転車等及び歩行者等専用」 lets bicycles on the
  pavement, a scooter whose speed lamp flashes and which cannot then go over
  6 km/h may ride there too, on the half nearer the road or the part marked for
  bicycles, slowly, stopping rather than get in a pedestrian's way
  ([道路交通法](https://laws.e-gov.go.jp/law/335AC0000000105) 第17条の2 第1項 and
  第2項; the mode, [施行規則](https://laws.e-gov.go.jp/law/335M50000002060)
  第5条の6の2); elsewhere it rides on the road. The legend links the National
  Police Agency's
  [rules](https://www.npa.go.jp/bureau/traffic/anzen/tokuteikogata.html), its
  hover text saying so and giving the credit. Of the prefecture's 17,572 rule-81
  records, the sections whose point halfway along lies within Nagoya's outline
  on [OpenStreetMap](https://www.openstreetmap.org/relation/4576938) are kept,
  1,804, three of them twice, kept once; 11 sections of a single point in the
  prefecture are left out. Each is simplified to within a metre, 32,028 points
  to 13,587 (773 kB, 103 kB gzipped, loaded only once a view reaches Nagoya).
  The file is converted from the police's older format: its record keys change
  each month, so a line's id is the old key within it and a hash of its points,
  and every one of its rule-81 records is for bicycles at all hours, sparing no
  vehicle, so the update stops on one that is not. What the data cannot show: a
  「特例特定原付を除く」 plate under the sign, which keeps scooters off that
  pavement; which side of the street a line is for, one side (片側, code 2) or
  both (両側, 3), each drawn once along the line given; and whether it is
  complete, which JARTIC does not warrant. The signs on the street take
  precedence, as the legend's hover text says. Only the website draws them.
- **Namur** (read 30 October 2026): the Ville de Namur's zones for its shared
  scooters and e-bikes, Bolt's alone since December 2023: 63 parking places
  signed on the street (PRLP physiques, points, each drawn as a disc of 5 m)
  and 82 virtual ones the operator's app shows (PRLP virtuels), the city
  centre and nine other areas where one may be parked only in such a place
  ("No Parking sauf en PRLP", drawn as "Park only in racks or marked places",
  on the website alone), 42 no-parking zones and 3 no-go zones, where riding
  stops and a ride can't end, from the Ville's open data
  ([Namur - Mobilité - Le libre-partage à Namur](https://data.namur.be/explore/dataset/mozonesbolt/),
  `mozonesbolt`, CC BY 4.0, last changed 16 May 2024) as GeoJSON. Its
  operations area is not drawn, nor zones set for a festival or an event,
  which the data doesn't hold. The legend links the Ville's
  [scooter page](https://www.namur.be/fr/ma-ville/mobilite/mobilite/deplacement/trottinette)
  and its leaflet of October 2026 gives the same rule: in the centre a scooter
  is parked only in a reserved place or a virtual one shown in the app. The
  features have no ids, so each zone's is a hash of its shape; a signed
  place is named by its number and street ("3. Rue d'Arquet - P Malin"), the
  others after the city.
- **New York** (read 30 October 2026): NYC DOT's 538 parking corrals for
  shared e-scooters in the East Bronx (307) and Eastern Queens (231), on the
  sidewalk or the roadbed, its open data
  [Shared E-Scooter Parking Corrals](https://data.cityofnewyork.us/Transportation/Shared-E-Scooter-Parking-Corrals/hjz2-y62k)
  (updated every six months), read as GeoJSON and named by their streets. The
  City's open data has no licence: Local Law 11 of 2012 has it published
  without a licence or any restriction on its use, and the City may ask that
  its source be named, so the legend credits the DOT. The features have no
  ids, so each corral's is a hash of its shape. The legend links the
  program's [FAQ](https://nycdotscootershare.info/faq): a shared e-scooter is
  parked upright in the sidewalk's furniture zone, or, in a mandatory corral
  zone, inside a corral to end the trip. Left out: the mandatory corral zones,
  which ScootRadar has no kind for and the open data does not hold.
- **Norfolk** (read 31 October 2026): the City of Norfolk's 23 micromobility
  corrals downtown, each named for its place, from the layer "Existing"
  (last edited 17 March 2026) of the City's
  [Norfolk's Bike Network & Facilities Map](https://www.arcgis.com/home/item.html?id=1f7431fded254a419d1cbf0c25ce3c60)
  on its ArcGIS Online site. Its proposed corrals, a layer of their own, are
  not drawn. Neither the layer nor the City's site or open data states a
  licence. The legend links the City's
  [Micro-Mobility Program](https://www.norfolk.gov/5527/Micro-Mobility-Program)
  page: end a ride in a designated parking corral or at a bike rack, or if none
  is free on the sidewalk close to the curb.
- **Norrköping** (read 29 October 2026): Norrköpings kommun's 57 parking
  places for e-scooters, 29 areas where a scooter may not be returned
  (`NoParking (Återlämning förbjuden)`), 14 slow zones (`Slow
  (hastighetsbegränsning max 6 km/h)`) and 11 `NoGo` areas, where riding and
  parking are both forbidden, drawn as no-riding zones: the themes "P-plats
  elsparkcyklar" and "Elsparkcyklar, begränsningar" of the municipality's
  [map](https://kartor.norrkoping.se/spatialmap), from its WMS
  (`kartor.norrkoping.se/wms?SERVICENAME=kartor`, layers `p_elsparkscykel`,
  `markuppl_elspark_begr_aterlamning` and `markuppl_elspark_begr_hastighet`,
  whose slow and `NoGo` areas differ only by colour). The legend links the
  municipality's
  [page](https://norrkoping.se/boende-trafik-och-miljo/resa-och-parkera/elsparkcyklar):
  park in a bicycle stand or at the marked e-scooter places in the inner city.
  Its land-use guideline,
  [Markupplåtelse på allmän platsmark](https://norrkoping.se/download/18.5ff942e1184b3f255e218bdc/1770911999429/Markuppl%C3%A5telse%20p%C3%A5%20allm%C3%A4n%20platsmark.pdf)
  (12 February 2026, "Friflytande mobilitetstjänster"), has the operators
  geofence scooters to 6 km/h in places and keep them from being returned in
  the areas this map shows. The layers are not queryable: the WMS answers
  only pictures, in SWEREF 99 16 30 (EPSG:3010). Drawn as SVG, each zone is a
  path in the picture's pixels, read back from each pixel's centre to the grid
  and so to latitude and longitude: to within 0.5 m for the parking places,
  which the map draws only from 0.7 m a pixel, and 2.75 m for the other zones,
  in tiles that overlap by 50 m. Twelve of the 14 slow zones are no-return
  areas too.
- **Omaha** (read 30 October 2026): the City of Omaha's automatic enforcement
  zones for scooters, where neither riding nor parking is allowed, drawn as 25
  no-riding zones: the 16 the
  [layer](https://www.arcgis.com/home/item.html?id=4bcc2608d3be41a0bff9aa924ec29c05)
  labels "No Parking or Riding Allowed" (MECA, the Old Market, the Leahy Mall
  redevelopment, Creighton's and UNO's campuses, the Federal Courthouse,
  Aksarben, Soma Townhomes and the Capitol District), Creighton's in 8 parts.
  The layer, on the City's ArcGIS Online account, was last edited on 10 May
  2024 and no City page links it; Lime's public zone file for Omaha holds the
  same zones by name, marked "Auto Enforcement", so they are in force. Its six
  unlabelled shapes are left out: two over the Henry Doorly Zoo, which the
  City's College World Series layer names, two slivers of about 1 m² and two
  near Aksarben. The legend links the City's
  [New Mobility Hub](https://new-mobility-hub-omaha.hub.arcgis.com/): a scooter
  that enters a No Ride Zone is shut off and must be walked out. Council Bluffs'
  site answers scripts only with a challenge, and no layer of its own was
  found.
- **Oslo** (read 30 October 2026): Oslo kommune's 12 areas to park, 12
  no-parking areas, 3 slow areas and 3 of its 4 no-riding areas, in 262, 366,
  129 and 78 parts, from `geodata.bymoslo.no/arcgis/rest/services/geodata/Reguleringer_Mikromobilitet/MapServer`,
  the service Bymiljøetaten's
  [map](https://experience.arcgis.com/experience/e77cffa7119144f3bf9cb57c294cbcef)
  draws, read by query. The map says rental operators must geofence its zones
  (§ 7c of the city's regulation on renting small electric vehicles); the
  legend links the city's
  [rental page](https://www.oslo.kommune.no/gate-transport-og-parkering/sykkel/leie-av-elsparkesykler-og-elsykler/),
  which links the map. Only zones of every day (`days` "Alle dager") are
  drawn, so the school yards, no-riding on weekdays only, are left out; Marka,
  the forest round the city, where riding is forbidden every day, is drawn,
  4,500 of the city's 12,300 points.
- **Ottawa** (read 30 October 2026): the City of Ottawa's 22 designated
  parking places and 6 at transit stations that the apps show, each drawn as a
  disc 5 m round its point, 8 slow ride zones and 38 no-ride areas, from the
  `E_Scooter` feature service its map of shared e-scooter areas draws (last
  edited 8 May 2026; "content provided for informational purposes only"). The
  legend links the City's
  [rules](https://ottawa.ca/en/city-hall/creating-equal-inclusive-and-diverse-city/accessibility-city/transportation/e-scooters):
  a shared scooter is parked upright in a signed designated space or an area
  its provider's app permits, and providers geofence no-ride, no-park and slow
  zones. Left out: the one no-ride area Bird Canada is excepted from; the 330
  no-ride roads over 50 km/h (197) and pathways (133), lines with no width to
  draw as zones; and the deployment area and the two operators' operating
  zones. ottawa.ca answers scripts with an Incapsula challenge, so the layers
  were matched to the map through its ArcGIS web map
  (`15297f33d8a14933b341825e2c81b253`, last changed 16 July 2026).
- **Øygarden** (read 30 October 2026): Øygarden kommune's 10 no-riding zones
  (`køyreforbod`), 4 no-parking zones (`parkeringsforbod`) and the slow zone of
  Straume's centre (`saktesone`), all in Straume on Sotra, from the kommune's
  public `Geogjerder og Soneinndeling ØK` feature service (layer 2,
  `Geogjerder_Straume`, last edited 4 September 2026), which states no
  licence. The legend links the kommune's
  [permit announcement](https://www.oygarden.kommune.no/_f/p1/i062c6fc5-7989-4580-acb2-4892041ce073/kunngjeringstekst.pdf)
  (December 2025): from 1 March 2026 to 29 February 2028 the rental operators
  must geofence its zones, which its overview map, the map link here, shows.
  Left out: the operating area; and the six `parkeringssone` points of 4 to
  19 m², which the announcement calls suggested places to set scooters out,
  as it sets no fixed parking zones while Straume's centre is being built.
  The slow zone's speed is not given.
- **Porto** (read 29 October 2026): the Câmara Municipal do Porto's 230
  sharing points (pontos de partilha), 2,941 spots, from Porto Digital's
  [FIWARE broker](https://broker.fiware.urbanplatform.portodigital.pt/v2/entities?type=OnStreetParking&q=dataProvider==cmp&options=keyValues&limit=1000),
  each a point, drawn as a disc 5 m round it. Shared scooters are left there,
  and the operators are fined for those left elsewhere
  ([echoboomer, 6 December 2022](https://echoboomer.pt/policia-municipal-porto-multou-trotinetes-mal-estacionadas)).
  The broker's scooters themselves are not used: they have not moved since
  8 October 2026.
- **Poznań** (read 31 October 2026): the Zarząd Dróg Miejskich w Poznaniu's
  (the city roads authority's) 270 Hop & Go points, each drawn as a disc of
  5 m, and the zone of the paid parking zones, where since 1 April 2024 a
  shared scooter is left only at one (racks or marked places only, drawn only on
  the website), from the authority's map
  [Punkty mikromobilności Hop & Go](https://www.google.com/maps/d/viewer?mid=10_etpKeXbrF4JTxC-NUQZsePqz-fvdo),
  a Google My Maps map on its
  [Zasady parkowania](https://zdm.poznan.pl/zasady-parkowania-zasady-parkowania)
  page, read as KML. The four points marked inactive (`Nieaktywny` 1) are not
  drawn; two points with no such mark, about 15 m from Piotrowo's points of
  the same numbers, are. The map states no licence, and the authority's site
  sets no terms. The legend credits it by its own short name, ZDM Poznań.
- **Reykjavík** (read 31 October 2026): Reykjavíkurborg's 9 parking places
  for shared vehicles (`Skilasvaedi_deilifarartaekja`, `TEGUND` 1), points
  each drawn as a disc of 5 m, and from its e-scooter geofencing layer
  (`Escooter_geofencing`) 157 no-parking areas (`TYPE` 1: water protection
  areas, underpasses and the like) and 49 slow ones (`TYPE` 2: school grounds
  and pedestrian streets), from the city's map services
  (`lukrgatt.reykjavik.is`, `OpinGognSamgongur`), named by what they are
  (`HEIMILD`: Verndarsvæði, Undirgöng, Grunnskólar, Göngugötur), the master
  plan's name taken off, or after the city where that names an office. The no-parking
  areas, the largest water protection areas of over 1,000 points, are
  simplified to within 2 m. Its data is "©Reykjavíkurborg - LUKR", with no
  restriction on use once its authorship is credited: the legend credits
  Reykjavíkurborg and links its
  [rules for dockless rentals](https://reykjavik.is/sites/default/files/2026-02/Verklagsreglur_um_st%C3%B6%C3%B0valausar_hj%C3%B3laleigur_2026.pdf),
  in force since 4 February 2026: 10 km/h at most in the slow zones, no
  parking in the areas it sets, and the places it sets for parking. Left out:
  the layers' notes (`ATHUGASEMDIR`), one of which holds an e-mail address.
- **Rīga** (read 31 October 2026): the Rīgas dome's 90 parking areas for
  e-scooters and 32 parking points, each drawn as a disc of 5 m, named by their
  address (`adrese`); its historic centre (`Vēsturiskā centra daļa`), where a
  scooter is parked only at one of them (racks or marked places only, drawn
  only on the website); its 353 other no-parking places (crossings, bridges,
  tunnels, cycle paths, pavements under 1.5 m) and its slow zone, the
  dataset
  [Elektroskrejriteņu izmantošanas nosacījumi](https://data.gov.lv/dati/dataset/elektroskrejritenu-izmantosanas-nosacijumi)
  on data.gov.lv, CC BY 4.0, read as KML. 89 of the 121 parking points mark
  parking areas the other layer draws as shapes, and are left out
  (`pointsOutside`); nine parking areas of under 0.1 m² are dropped. The
  legend credits "Rīgas dome, CC BY 4.0" and links the city's
  [binding regulations](https://www.vestnesis.lv/ta/id/350955) No.
  RD-24-261-sn, in force since 1 May 2024: a shared scooter is not left in a
  no-parking zone, but at a parking place the city's map shows, nor ridden
  faster than a speed zone's limit.
- **Rostock** (read 31 October 2026): the Hanse- und Universitätsstadt
  Rostock's 15 marked parking places for e-scooters, points each drawn as a
  disc of 5 m and named by their street, from its open data
  [Abstellflächen für E-Tretroller](https://www.opendata-hro.de/dataset/abstellflaechen_e_tretroller)
  (CC0, file of 30 June 2026; first marked 2023–26). One, on the
  Henrik-Ibsen-Straße, is a pictogram only. The legend credits the city as
  Stadt Rostock, as its full name takes three lines at 320 px, and links its
  [e-scooter page](https://rathaus.rostock.de/de/leih_e_scooter/323713): under
  its voluntary agreements with the operators a ride may not end in the
  no-parking zones, as parks, the Warnow's banks and the pedestrian zones, and
  the city is making parking places at their edges and at public transport
  stops. The zones themselves are PDF maps of July 2021 and are not drawn
  ([coverage gaps](docs/coverage-gaps.md)).
- **Sacramento** (read 30 October 2026): the City of Sacramento's 45 drop
  zones (`RackType` `Dropzone`), points each drawn as a disc of 5 m, from the
  Department of Public Works' public
  [Verified Bike Racks Public Layer](https://www.arcgis.com/home/item.html?id=72bf99301c40483eafa02b028401264f)
  (1,718 points, last edited 26 August 2026), which states no licence; the
  City's [web policies](https://www.cityofsacramento.gov/city-government/web-policies)
  forbid no reuse. The legend links the City's
  [Motorized Scooter Safety & Law](https://www.cityofsacramento.gov/public-works/mobility-and-sustainability/transportation-planning/active_transportation/e-bike-and-scooter-guidelines/motorized-scooter-safety-and-law)
  page: park a shared scooter upright in a designated drop zone or at a public
  bike rack. Since 15 January 2022 a shared scooter is locked to a bike rack,
  or to itself in a drop zone
  ([Sacramento City Express](https://sacramentocityexpress.com/2022/01/18/new-parking-and-locking-requirements-roll-out-for-shared-scooters-bicycles-in-sacramento),
  the City's news site). The layer's other racks, corrals among them, are not
  drawn, as Baltimore's and Västerås's bike racks are not: only the places the
  City sets aside for shared vehicles are.
- **Santa Monica** (read 30 October 2026): the City of Santa Monica's 184
  [Shared Mobility Drop Zones](https://www.arcgis.com/home/item.html?id=2c4ef954b4504cc4853246ddf2bcb90c),
  points each drawn as a disc of 5 m, and its 28
  [Mobility Prohibited Riding Areas](https://www.arcgis.com/home/item.html?id=19b767c0962c4161b2e445cacaec2636),
  both licensed under the Open Data Commons Attribution License 1.0 and
  credited "City of Santa Monica, ODC-By 1.0", as the legend does. The City's
  [Administrative Regulations of 7 November 2025](https://www.santamonica.gov/media/SM-AdminGuidelines_Fall2025Update.pdf)
  name both layers: devices are shut off or slowed to 1 mph on the Promenade,
  the Pier and Pier Bridge and in all City parks, and shared e-scooters also on
  the Beach Path, Ocean Front Walk and the rest of the beach zone, where
  e-bikes may ride, so the areas are drawn as no-riding zones; a ride ended in
  a drop zone costs $1 less. The riding areas were last edited on 18 April
  2019; the drop zones match the "175+ designated parking spaces" of the
  City's [shared mobility page](https://www.santamonica.gov/programs/shared-mobility).
- **Seattle** (read 31 October 2026): the City of Seattle's 135 bike and
  scooter corrals in service (`BIKE_FACILITY` `ONSDW-ZONE` on the sidewalk,
  `ONST-ZONE` in the street), points each drawn as a disc of 5 m, from SDOT's
  [Bicycle Racks](https://data-seattlecitygis.opendata.arcgis.com/datasets/SeattleCityGIS::bicycle-racks)
  layer on Seattle GeoData, edited daily; one without a place is not drawn, nor
  are its other racks. A corral's id is its asset key, `COMPKEY`, as the layer's
  object ids are renumbered as it is loaded anew. The City's
  [data policy](https://data.seattle.gov/stories/s/Data-Policy/6ukr-wvup/):
  "Unless otherwise indicated, data on this site does not require specific
  attribution." The legend credits the City and links SDOT's
  [Bike Racks & Parking](https://seattle.gov/transportation/projects-and-programs/programs/bike-program/bike-racks)
  page: as of May 2026, 204 bike and scooter corrals downtown, organized
  parking for shared bikes and scooters. The layer holds 136.
- **St. Albert** (read 30 October 2026): the City of St. Albert's 13
  [e-scooter restricted zones](https://www.arcgis.com/home/item.html?id=3613eb82e4054d0ca95be60abce3dbe2)
  (12 places, one of two parts), open data under the City of St. Albert Open
  Data License, "updated weekly" (last edited 27 October 2026), drawn as
  no-ride zones and credited "City of St. Albert, Open Data License". The
  legend links the City's
  [e-scooter questions](https://stalbert.ca/city/eps/rcmp/traffic-safety/e-scooters/faq/):
  the companies geofence the no-go zones on its Open Data Portal, so that a
  scooter stops in them. The Farmers' Market's zone is drawn every day, as the
  layer holds it.
- **Stockholm** (read 31 October 2026): Stockholms stad's 834 parking places
  for e-scooters, from Trafikkontoret's
  [Elsparkcykelplats](https://dataportalen.stockholm.se/dataportalen/srv/swe/catalog.search#/metadata/LvFeature19742957)
  on its open data portal, under CC0 (made in 2022, updated as needed and
  reviewed each first quarter), read from its WFS as GeoJSON and credited
  "Stockholms stad". Five are points, each drawn as a disc of 5 m; the rings
  are kept to within 20 cm, so that the place at John Ericssonsgatan 14, 70 cm
  wide, is no line. The service makes the layer anew each night, its ids too,
  so each place's id is a hash of its shape. The legend links the city's
  [Elsparkcyklar](https://trafik.stockholm/trafikregler/elsparkcyklar/) page:
  about 700 parking places, and a scooter may be parked in any of the city's
  bicycle racks too, which are not drawn. Its no-parking along all the city's
  quays and at 13 places, Gamla stan, Medborgarplatsen and Odenplan among them,
  is published only as a picture and is not drawn
  ([coverage gaps](docs/coverage-gaps.md)); none of the city's local traffic
  rules (`ltfr:LTFR_FORESKRIFT`) names e-scooters.
- **Taupō** (read 30 October 2026): the Taupō District Council's
  [Rental E-Scooter Operational Areas](https://www.arcgis.com/home/item.html?id=36092a0943214783afc27bef88cc5430),
  licensed CC BY 4.0 and credited "Taupō District Council (CC BY 4.0)", as the
  legend does: the four no-parking areas and the town centre's 15 km/h
  reduced speed area. The operations area, where the scooters may go at all,
  is not drawn, and no area sets a curfew. The layer was last edited on 13
  December 2022; the council says it may amend the areas from time to time.
  No operator's scooters in Taupō are on the map: Beam's feed is closed.
- **Trondheim** (read 31 October 2026): Trondheim kommune's 16 parking
  zones, 66 no-parking zones, 62 slow zones (6 km/h, one 12 km/h) and 11
  no-riding zones, the layer `samferdsel:elsparkesykkelsoner` its
  [map of e-scooter zones](https://geoinnsyn.no/?application=trondheim&project=Elsparkesykkelsoner)
  draws, from the city's WFS (`kart.trondheim.kommune.no/geoserver`), read as
  GeoJSON. 55 zones are both no-parking and slow (`sonetype`
  "parkeringsforbud/saktesone"), drawn as both. Not drawn: the three zones
  named for the parts of the city where the operators' fleets are capped
  (`midtbyen` and `tiller-heimda-byasen`), one of them a small area by Øya
  with a speed of 0. The layer states no licence and the city's site sets no
  terms: the legend credits Trondheim kommune and links its
  [page on e-scooters](https://www.trondheim.kommune.no/tema/klima-miljo-og-naring/tillatelser-og-bevillinger/elsparkesykler-i-trondheim/),
  which gives Tier-Dott, Voi and Ryde permits for the seasons of 2025 and
  2026, 15 March to 1 December, and links the map of regulated zones.
- **Turku** (read 31 October 2026): Turun kaupunki's 128 parking places for
  e-scooters (`Skuutti_pysakointipaikka`: 113 painted boxes, 9 racks and 6
  in bicycle parking, named by `Sijainti`), points each drawn as a disc of 5 m,
  its 151 no-parking areas, 24 speed-limited areas (10 or 15 km/h) and 157
  no-riding areas, from the city's OGC API
  (`turku.asiointi.fi/TrimbleOGCApi`, collections `GIS:Skuutti_*`), the
  layers of its [service map](https://palvelukartta.turku.fi/fi/mobility/scooters).
  The city's [map terms](https://www.turku.fi/tietoa-turusta/kartat-ja-paikkatieto)
  let anyone use its interfaces freely and publish its open map data with the
  credit "© Turun kaupunki, käyttölupa CC BY 4.0": the legend credits
  "Turun kaupunki, CC BY 4.0" and links its
  [e-scooter page](https://www.turku.fi/liikenne-kadut-ja-kunnossapito/sahkopotkulaudat),
  which asks riders to park preferably in the marked places, never in a
  no-parking area, and says the no-riding areas are kept up to date on the
  service map. The areas' seven stray points, each inside an area of its own
  kind, are left out (`polygonsOnly`); some areas lie in Kaarina, which the
  layers cover too. The weekend night ban and night speed limits are the
  city's for the whole city, not areas, and are not drawn.
- **Vaasa** (read 30 October 2026): Vaasan kaupunki's 229 parking places
  (`Sahkopotkulautojen_pysakointi`) and, from its restriction areas
  (`Rajoitusalueet_sahkopotkulaudat_view`, by `rajoitus`), 66 no-parking
  areas (`pysakointikielto`), 17 no-riding areas (`ajokielto`) and the
  pedestrian centre's 10 km/h area (`nopeusrajoitus`), both last edited
  14 October 2026; no licence stated, and no public map of the City's draws
  them. The legend links the City's
  [news of 10 June 2026](https://www.vaasa.fi/en/news/new-parking-rules-for-electric-scooters/):
  from 15 June scooters may be parked only in designated parking areas in the
  city centre, Palosaari, Vöyrinkaupunki and Hietalahti. The
  [2026 permit terms](https://www.vaasa.fi/app/uploads/2026/03/Mikroliikennelupa-lupaehdot-2026.pdf)
  set the 10 km/h, forbid riding and parking on sports grounds and school and
  day-care yards, and set the season from 20 April to 31 October. That
  restricted parking area (`rajoitetun pysakoinnin alue`), where a ride may
  end only at a parking place, is not drawn: ScootRadar has no kind for it.
- **Vancouver** (read 30 October 2026): the City of Vancouver's 250 shared
  e-scooter stations, each its outline in the street, from its
  `SharedEScooterStation` feature service (last edited 29 October 2026), open
  data under the
  [Open Government Licence – Vancouver](https://opendata.vancouver.ca/pages/licence/):
  "Contains information licensed under the Open Government Licence –
  Vancouver." The legend links the City's
  [page](https://vancouver.ca/streets-transportation/shared-e-scooter-system.aspx),
  which answers scripts 403: the City places parking stations throughout the
  service area, and a Lime ride ends only at one.
- **Vantaa** (read 30 October 2026): Vantaan kaupunki's 76 parking places
  (painted bays, assigned bicycle racks and two places marked only in the
  apps), 29 no-parking zones, 7 low-speed zones at 10 km/h and 5 no-go zones
  round stations, where neither riding nor parking is allowed, drawn as
  no-riding zones: the
  [micromobility permit's geodata](https://hri.fi/data/en_GB/dataset/vantaan-mikroliikenneluvan-paikkatietoaineistot)
  on Helsinki Region Infoshare, licensed CC BY 4.0 and credited "Vantaan
  kaupunki, CC BY 4.0", as the legend does, read from its
  [hub](https://micromobility-cityofvantaa.opendata.arcgis.com/)'s feature
  services (parking places last edited 26 October 2026). The permit, required
  from 1 January 2026, has operators read the zones from that interface. Left
  out: the 12 mandatory parking zones, where a ride may end only at a parking
  place, which ScootRadar has no kind for, and the temporary zones the City
  sets for large events.
- **Västerås** (read 29 October 2026): Västerås stad's 298 places to park
  (293 parking places and 5 sharing points, `Delningspunkter`), 502 no-parking
  areas, 45 slow zones and 17 no-riding zones, from layer 2 of the City's
  `Elsparkcyklar` feature service, which its
  [e-scooter map](https://gisportal.vasteras.se/portal/apps/webappviewer/index.html?id=27c54fbfdc5c47f8b827dca65914920a)
  draws (last edited 26 October 2026). The legend links the City's
  [page](https://www.vasteras.se/trafik-och-gator/hallbara-resor/res-med-elsparkcykel.html),
  whose map shows where e-scooters may not be parked and where their speed
  is limited. Each area's `typ` gives its kind: the three slow zones where
  parking is forbidden too are drawn as both, and the 17 areas where neither
  riding nor parking is allowed as no-riding zones. Left out: Voi's and Ryde's
  29 staging places (`Utställningsplats`), each an operator's own, and one
  no-parking area marked not introduced (`EJ införda`). Eight no-parking areas
  of two or three parts are a zone for each part, numbered, without the 101
  slivers under 5 m² that 34 areas' drawing left. Five keep their holes, each
  ring going round its hole and back: four no-parking areas leave out a block
  each, of 2,200 to 14,600 m², and a slow zone where parking is forbidden too
  leaves out two parking places. The City's summer no-riding zone on the
  Vasagatan pedestrian street (15 June to 16 August) is not in the layer. The
  service accepts edits; ScootRadar only queries it.
- **Washington** (read 30 October 2026): the District Department of
  Transportation's 259 in-street corrals, 252 no-parking zones (365 parts),
  51 no-riding zones and 7 slow zones. The corrals and the no-parking zones are
  the District's open data under CC BY 4.0
  ([In-Street Micromobility Corrals](https://opendata.dc.gov/datasets/DCGIS::in-street-micromobility-corrals),
  [Shared Mobility No Parking Zones](https://opendata.dc.gov/datasets/DCGIS::shared-mobility-no-parking-zones)),
  layers 0 and 7 of `maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_Shared_Mobility_WebMercator/MapServer`.
  The no-riding and slow zones are layer 7 of DDOT's own
  `DDOT/Shared_Micromobility` map service, "Shared Mobility No Ride Zones": 58
  zones named for their places (the Capitol's grounds, the memorials, the
  Wharf, American University), no riding where `SPEED` is 0 and slow where it
  is 3 to 6 mph. The open data's "Shared Mobility Speed Limit Zones" is the
  older layer of the same service, 42 zones of January 2023, without American
  University's, the DC Jail's and others. Left out: the 13 mandatory parking
  zones, which ScootRadar has no kind for, and the 2,678 preferred parking
  points, more than one query answers. The legend links DDOT's
  [rules](https://sharedmobilitydc-dcgis.hub.arcgis.com/pages/safety): a
  scooter is parked locked, on the sidewalk, between it and the kerb or at a
  rack or corral, leaving 3 feet clear, and not ridden on the sidewalk in the
  Central Business District.
- **Wien** (read 30 October 2026): the Stadt Wien's 402 parking areas for
  rented e-scooters, the 392 areas within 100 m of them, where a scooter is
  parked only in the parking area, as no-parking zones, 899 no-riding zones (parks, Wiener Wohnen's
  estates, pedestrian zones, markets) and 295 slow ones (walking pace in
  residential streets and pedestrian zones, 20 km/h in shared spaces), the
  Mobilitätsagentur Wien's
  [E-Scooter-Beschränkungszonen Wien](https://www.data.gv.at/katalog/dataset/a454ea84-6b4f-4961-a511-bf47ef6c1bd0)
  (`ogdwien:ESCOOTPARKVERBOGD`), CC BY 4.0, credited "Stadt Wien –
  data.wien.gv.at" as its terms ask, read from its WFS as GeoJSON one type
  (`TYP`) at a time. The WFS sends its longer answers in more empty HTTP/2
  frames than Node's fetch takes, so the script asks for those again over
  HTTP/1.1. The no-parking and no-riding zones, drawn to the centimetre, are
  simplified to within 2 m, which takes them to 16,547 points. The legend
  links the City's
  [rules](https://www.wien.gv.at/verkehr/scooter-roller-regeln): since 19 May
  2023 a rented e-scooter is parked first in a marked parking area, and not
  within 100 m of one elsewhere. Left out: what holds until a day (6 parking
  areas given up on 30 October 2026 and 3 slow zones ended in 2024) or on
  some days only (the Naschmarkt's flea market, on Saturdays), and 5 empty
  parts of no-riding zones.
- **Zürich** (read 31 October 2026): the Stadt Zürich's 31 parking zones, 35
  no-parking zones and 176 no-riding zones for sharing operators, its
  Dienstabteilung Verkehr's
  [Sharing Zonen](https://data.stadt-zuerich.ch/dataset/geo_sharing_zonen),
  CC0 (the city asks for the credit "Quelle: Stadt Zürich"), read from its WFS
  as GeoJSON, one type at a time (`parkierzonen`, `parkverbotszonen`,
  `fahrverbotszonen`). In a no-riding zone an operator holds a scooter to
  4 km/h and a ride cannot end; in a no-parking zone a ride cannot end. The
  legend credits the Stadt Zürich and links the dataset, whose
  [map](https://www.geocat.ch/geonetwork/srv/ger/md.viewer#/full_view/ece5befa-f8e1-4753-8330-88d9cf09e832)
  geocat.ch describes. The zones have no names, so they are named after the
  city.

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
[Bolt rider app](#bolt-rider-app). Since 27 October 2026, Lime's scooters in
Bergen, where no operator publishes a feed, come from its rider map, signed
in, as in Europe (see [the Lime catalog](docs/lime-app-map.md)).

Since 28 October 2026, Ryde's scooters in Bergen, about 4,700, come from the
map that Skyss, Vestland's public transport authority, shows in its travel
app to riders who have not signed in. The user asked for it on 27 October.
No account, key or cookie is used. A reply lists at most 500 scooters of a
box, so the Node cache sweeps Bergen box by box, quartering each full one:
about 27 requests a round, one a second, every two hours while nobody looks.
The map gives no battery, range or position time; 16 scooters of a round,
read one by one, could all be rented. Each scooter's id is its IMEI, which is
neither stored nor shown, only a hash of it keyed by the process. Skyss's
[terms of use](https://www.skyss.no/en/help-and-contact/terms-and-privacy/terms-of-use-for-services/)
say that data it makes available must not be copied or distributed in any
way; ScootRadar reads its map signed out and charges nothing. The map's
credits name Skyss. See [Ryde's map readers](docs/ryde-app-map.md#the-production-reader).

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
the ODbL. So does East Lansing's, which leaves out Michigan State's campus
(relation 13708038). The credits list all four. American towns are the Census Bureau's
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

The reviewed catalog lives in `data/swedish-scooter-feeds.json`: 29 systems.
Two are the operators' own public GBFS feeds, Lime in Uppsala and Hopp in
Kiruna; the other 27 come from app maps (Voi 15, Qick 7, Bolt 3 and Lime's
Göteborg and Malmö). Lime Uppsala is listed in
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

The reviewed catalog lives in `data/polish-scooter-feeds.json`: 5 feeds across
7 towns. Dott covers Oświęcim, and Wołomin with Kobyłka and Radzymin, which
one Dott region spans; Hopp covers Knurów, Złotów and Września. Dott left
Sosnowiec on 27 October 2026, and its feed was retired
([Polish feeds](docs/polish-scooter-feeds.md)). All are the operators' own
public GBFS feeds. Dott's are named in
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
come from its app's signed-out map, read as in South Korea (below), and since
29 October their zones from its public area file (see
[Ride and parking zones](#ride-and-parking-zones)). GCOO publishes no licence
for either; the credits link to gcoo.io. Since 26 October
2026, Lime's scooters in 58 towns where it publishes no feed, from Los Angeles
and Austin to Milwaukee and Tampa, since 28 October in San Marcos and on
UNC Charlotte's campus, and since 29 October in Farmington, Utah, come from
its rider map, signed in, as in Europe (see
[the Lime catalog](docs/lime-app-map.md)). Since 28 October 2026,
Bird's scooters in eight towns where it publishes no feed, from Austin and
Sacramento to Yonkers, come from its rider map, signed in, each operating area
swept whole, one request every 30 seconds for all of them; Bird publishes no
licence for it (see [Bird's rider map](docs/bird-app-map.md)). Fourteen towns ban renting at
night, by their codes, permit rules or program pages, and South Lake Tahoe's
code takes shared scooters off its streets from 1 November through 30 April,
so the map pauses Lime's market there until 1 May. See the
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
council report and season page. Since 26 October 2026, Lime's scooters in
13 towns where it publishes no feed, from Laval and Vaughan to Saskatoon and
Waterloo Region, come from its rider map, signed in, as in Europe (see
[the Lime catalog](docs/lime-app-map.md)); Red Deer's and Saskatoon's winter
pauses come from their by-laws. Since 28 October 2026, Bird's scooters in
13 towns where it publishes no feed, from Lethbridge and Kamloops to
Brampton and Mississauga, come from its rider map, signed in, as in the
United States (see [Bird's rider map](docs/bird-app-map.md)). See the
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
neither sets hours. Since 26 October 2026, Lime's scooters in Dubai, Abu Dhabi
and Al Ain, where it publishes no feed, come from its rider map, signed in, as
in Europe (see [the Lime catalog](docs/lime-app-map.md)). See the
[coverage audit](docs/emirati-scooter-feeds.md)
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

The reviewed catalog lives in `data/israeli-scooter-feeds.json`: 3 public
feeds in 15 towns, 13 of them in Gush Dan, around Tel Aviv, then Ashdod and,
for Bird alone, Caesarea. Bird's `israel` feed at `mds.bird.co`, Dott's
`tel-aviv` at `gbfs.api.ridedott.com` and Lime's `tel_aviv` at
`data.lime.bike` are each the operator's own public GBFS feed, all three in
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
three under the GBFS line for Asia. Since 26 October 2026, Lime's scooters in
Ashdod and Eilat, which its `tel_aviv` feed leaves out, come from its rider
map, signed in, as in Europe (see [the Lime catalog](docs/lime-app-map.md)).
See the [coverage audit](docs/israeli-scooter-feeds.md) for the systems, the towns,
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

BinBin publishes no data licence. The map's credits link its site as
"TR/MK/BA/XK: BinBin map", and the API names the source "Turkey: BinBin
anonymous app map".
See the [coverage audit](docs/turkish-scooter-feeds.md) for the systems, the
town names, the gaps and the recheck command, and
[the app investigation](docs/turkish-app-maps.md) for Martı and Hop.

## South Korea

The reviewed catalog lives in `data/south-korean-scooter-feeds.json`: 272
systems in 121 towns, GCOO in 76, Swing in 66, Xingxing in 32, Deer in 31,
Alpaca in 29, Kickgoing in 9, DART's one system in 6, and Beam's 28 regions in 36, read
from Beam's rider map (see [Beam rider app](#beam-rider-app)). No operator
publishes a feed. The other six come from the operators' signed-out app
maps, with no rider account: GCOO's, Kickgoing's and Alpaca's with no
credential, and Kickgoing's with its ally Xingxing's scooters; Swing's with
the one-time code its app computes, from a key compiled into the app, and
with Deer's scooters; DART's
as user 0 with the token "scootradar", though its app shows the map only
after a phone sign-in. The user asked for GCOO's, Kickgoing's and Swing's
maps on 24 October 2026, and for Alpaca's and DART's on 25 October, DART's
knowing its app asks for that sign-in first. Deer's
scooters are on Swing's map, as Swing bought Deer's business in 2024, and
are shown as Deer's since 27 October 2026, as its riders know them. Swing's key is a runtime-only secret of the cache, never in Git; the
IMEI that identifies a Swing scooter is neither stored nor shown, only a keyed
hash of it.

Each collection reads its town whole, on a bounded request plan, and fails
rather than publish part of it. Alpaca's reads the country's clusters first,
then every cell of a fixed grid, within 0.017 degrees of its centre, that
meets a square where they say vehicles stand: 456 cells for its 29 towns on
26 October, every two hours while nobody looks. DART's lists its whole fleet
in one reply, so one request a round serves its six towns. Bicycles, e-bikes
and mopeds are left out. Alpaca, Beam, DART, GCOO and Kickgoing give a
battery level, DART and GCOO a range too; Swing gives only a band, for
Deer's scooters too, so their battery stays unknown. None of the signed-out maps gives a position's time.
None of the six operators publishes a licence for this data. Alpaca's rider
terms forbid members to reuse for profit, without consent, what they obtain
through the service (article 27(2)), and DART's the same (article 23(2)),
and also, without written permission, to copy or distribute what DART posts
in its app (article 15(13), item 25); ScootRadar reads both maps signed out
and charges nothing. The map's
credits name them, and link to ridebeam.com, gcoo.io, kickgoing.io and
alpaca.kr. Beam's regions are named after the municipalities they stand
in, Beam's own names kept as aliases. Town outlines are OpenStreetMap
municipalities (ODbL). See the [coverage audit](docs/south-korean-scooter-feeds.md)
for the request plans, the load, the survey, the gaps and the recheck command.

## North Macedonia, Bosnia and Herzegovina and Kosovo

The reviewed catalogs live in `data/north-macedonian-scooter-feeds.json`,
`data/bosnian-scooter-feeds.json` and `data/kosovar-scooter-feeds.json`: one
system each, BinBin's service area in Skopje, Sarajevo and Pristina, read from
its guest app map since 25 October 2026 (see
[BinBin guest app map](#binbin-guest-app-map)). None of the three countries
has a public scooter feed. Kosovo is `XK`, the user-assigned code browsers and
iOS name; its towns, like the others in Europe, give no time zone.

BinBin publishes no data licence. The map's credits link its site as
"TR/MK/BA/XK: BinBin map", and the API names each country's source, as
"Kosovo: BinBin anonymous app map; city centres from GeoNames". The city
centres are GeoNames's, under CC BY 4.0. See the
[coverage audit](docs/north-macedonian-bosnian-kosovar-scooter-feeds.md) for
the systems, the town names, the gaps and the recheck command.
