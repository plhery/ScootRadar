# Data sources and terms

ScootRadar does not own the mobility, address, or map data it displays.

## Mobility data

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

Provider names remain trademarks of their respective owners. Their appearance
does not imply endorsement.

### French cities

The app also reads 27 reviewed public GBFS feeds from Dott, Bird, Lime, Voi and
Pony across 25 French cities or operating areas. The catalog is checked into
[`data/french-scooter-feeds.json`](data/french-scooter-feeds.json), using the
[MobilityData registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
and [transport.data.gouv.fr](https://transport.data.gouv.fr/datasets?format=gbfs&subtype=scooter)
as discovery sources. Pony is accessed through the National Access Point's proxy;
the other feeds are served directly by their operators.

Production collects each system independently every minute on Netcup, with at
most six systems in flight. Map requests read only the relevant cached systems,
with no operator requests. The local direct-feed fallback selects by viewport
and allows four concurrent French systems. Individual scooter positions remain
usable for at most fifteen minutes from their source timestamp, including when a
refresh fails; missing timestamps and older data are rejected. The national
platform publishes Voi every eight to nine minutes, about ninety seconds after
the timestamp it carries, so a shorter limit blanks Voi whenever it is a little
late. City totals are aggregated hourly.

These endpoints are publicly accessible but do not share one universal license.
In particular, [Dott's API terms](https://ridedott.com/api-licence/) contain
development and commercial/distribution restrictions that need review before
public deployment. See the [investigation and source terms](docs/french-scooter-feeds.md)
for the verified cities, sample counts, excluded feeds, and recheck command.

## Address data

Supported city names and aliases are found in the local, reviewed
scooter-city catalog, without asking any service, and are listed first. Other
places, across Europe, come from the Address Autocomplete API of
[Geoapify](https://www.geoapify.com/) when the Worker secret `GEOAPIFY_API_KEY`
is set.
Geoapify answers from OpenStreetMap data (ODbL, credited with
`© OpenStreetMap contributors`) and other open sources it names in each answer.
Its free plan allows commercial use with visible Geoapify and OpenStreetMap
attribution, which the app displays (`Search · Geoapify`), and 3,000 requests a
day. The Worker sends the typed text, the language the app is shown in, and,
once the map shows a city or less, the map centre, rounded to about a
kilometre, as a location bias (without one, places in Switzerland come first).
With a map centre it asks first for places within 50 km of it, and for places
anywhere, still the nearest first, only when none of those is what was typed
(Geoapify's near misses, as Zürichstrasse for "Zürich HB", do not count).
For text without digits it also asks, at the same time, for the towns of that
name anywhere: towns far from the map, and Fribourg for "Freiburg" next to
Freiburg im Breisgau. They are waited for as long as places are, or for 1.5
seconds. A city of the catalog typed in full asks for these towns alone. An
address typed with a city of the catalog ("Bahnhofstrasse 10, Biel") is looked
for without the city's name within 15 km of the city's centre, wherever the map
is, and anywhere near that centre when nothing is found there. It leaves out
places outside Europe, and asks for up to 20 places each time; the app shows 5.

When Geoapify fails (the day's requests used up, the key refused, the service
down or slower than five seconds), or without `GEOAPIFY_API_KEY`, as in a copy
of this repository run without one, the same search goes to
[Photon](https://photon.komoot.io/), komoot's public geocoder on OpenStreetMap
data. Its use is free within reasonable limits and may be throttled;
`PHOTON_API_URL` points the search at a Photon of our own, with the public one
standing in when ours fails (see DEPLOY.md). The `X-Geocoding-Data-Source`
response header names where the answer came from: `Verified European scooter
city catalog` when the catalog has a city of the name, then the services that
answered (`Geoapify`, `Photon`), then `OpenStreetMap`, as in
`Verified European scooter city catalog, Geoapify, OpenStreetMap`. The app
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
  synthetic whole-city Lille station is excluded. Lime's Lille parking instead
  comes from the official MEL inventory of mandatory e-scooter bays, paginated
  and cached hourly. Bike-only and non-parking records are excluded. This
  municipal inventory does not publish live return availability. Missing spots
  do not imply unrestricted parking.
- `is_returning=false` removes a bay. Virtual stations do not require installed
  docking hardware: Pony publishes `is_installed=false` alongside
  `is_returning=true` throughout its virtual parking feeds.
- Static station/rule metadata is cached for an hour; return status is refreshed
  with the minute collector. A parking failure does not fail scooter collection.
  The API marks retained parking stale and stops exposing it after five minutes.
- Map requests only read the persistent snapshot. Country/city overviews omit
  parking geometry and individual bays to keep low-zoom payloads small.

References: [GBFS station information and geofencing](https://github.com/MobilityData/gbfs/blob/master/gbfs.md),
[Dott France's published GBFS feeds](https://transport.data.gouv.fr/datasets/tier-dott-gbfs-france?locale=fr).

Lille source and attribution: [Métropole Européenne de Lille — mandatory shared
e-scooter and e-bike parking](https://www.data.gouv.fr/datasets/espaces-de-stationnement-des-trottinettes-electriques-et-velos-a-assistance-electrique-en-libre-service).


## Germany and Italy

Reviewed catalogs live in `data/german-scooter-feeds.json` and
`data/italian-scooter-feeds.json`. Germany has 37 verified feeds across 38 cities:
Dott, Bolt, Hopp, Lime, Voi and Zeus. Dott made its GBFS private in September 2026; the
catalog keeps the 15 German regions its public listing still names. Italy has 3
Bird feeds, in Roma, Palermo and Napoli; the other tested Italian scooter feeds
were empty, stale or unavailable. See the [coverage audit](docs/german-italian-scooter-feeds.md).

Sources: [MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
[Dott Germany](https://gbfs.api.ridedott.com/public/v2/countries/de/gbfs.json),
[MobiData BW](https://www.mobidata-bw.de/) and the individual public operator feeds.
MobiData BW supplies the reviewed Bolt, Hopp, Lime and Voi GBFS 3.0 systems and
ten of the fourteen Zeus systems; its Voi feed covers six Baden-Württemberg
cities, not all of Germany. Zeus's own feeds supply Bamberg, Ludwigsburg,
Regensburg and Schweinfurt.

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
Belgium has 6 feeds across 4 cities: Bolt and Dott in Bruxelles, Dott and Pony
in Charleroi, Voi in Antwerpen and Hoppy in Kortrijk. The United Kingdom has 11
feeds across 18 towns: Beryl, Dott and Bolt. Both come from the operators' own
public GBFS feeds, found through
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
[Dott's listings](https://gbfs.api.ridedott.com/public/v2/countries/gb/gbfs.json),
[Beryl's index](https://beryl-gbfs-production.web.app/v2_2/gbfs.json) and, for
Pony, Belgium's national access point
[transportdata.be](https://transportdata.be/dataset/pony_charleroi), which
lists its feed with the key the URL needs.

Norway's 23 feeds across 21 towns (Voi, Ryde, Bolt and Dott) all come from
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
systems, the gaps and the recheck command.

Night bans on renting, in `data/rental-curfews.json`, come from each town's
rules: Lovdata for Norway, the council or the operator for Britain, the
municipal regulation for Matosinhos in Portugal. Their areas are municipal
boundaries from Kartverket under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), local authority
districts from the ONS under the
[Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)
(contains OS data © Crown copyright and database right 2018) and Portuguese
municipalities from the Direção-Geral do Território's
[CAOP](https://www.dgterritorio.gov.pt/cartografia/cartografia-tematica/caop)
under CC BY 4.0 (Informação geográfica cedida pela Direção-Geral do
Território). The credits list all three.

## Portugal, Spain and Iceland

Reviewed catalogs live in `data/portuguese-scooter-feeds.json`,
`data/spanish-scooter-feeds.json` and `data/icelandic-scooter-feeds.json`.
Portugal has 12 feeds across 11 cities (Bird and Lime), Spain 8 across 10
(Bird and Hopp) and Iceland 14 across 18 (Hopp). All come from the operators'
own public GBFS feeds, found through
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv).

Bird's feeds link a
[data licence](https://web.archive.org/web/20260516143232/https://www.bird.co/gbfs-data-license-agreement/)
that now answers 404; its last copy allows showing Bird's vehicles, credited
to Bird, with data no older than fifteen minutes. Lime's
[GBFS terms](https://www.li.me/legal/public-gbfs-terms) allow public display
only where local law requires it and data no older than ten minutes, as in
France and Germany. Hopp links its privacy policy, not a licence. The map's
credits name all three. See the
[coverage audit](docs/portuguese-spanish-icelandic-scooter-feeds.md) for the
systems, the gaps and the recheck command.
