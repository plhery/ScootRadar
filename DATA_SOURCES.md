# Data sources and terms

Scootradar does not own the mobility, address, or map data it displays.

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

Search uses the federal `geo.admin.ch` SearchServer operated by swisstopo. Its
services are available without registration under FSDI fair-use and attribution
conditions. The app limits and caches requests and displays `© swisstopo`.
Supported French city names are supplied by the local, reviewed scooter-city
catalog. French street-address geocoding is not provided.

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
`data/italian-scooter-feeds.json`. Germany has 23 verified feeds across 23 cities:
Dott, Bolt, Hopp, Lime and Voi. Dott made its GBFS private in September 2026; the
catalog keeps the 15 German regions its public listing still names. Italy currently
has Bird Rome; the other tested Italian scooter feeds were empty, stale or
unavailable. See the [coverage audit](docs/german-italian-scooter-feeds.md).

Sources: [MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
[Dott Germany](https://gbfs.api.ridedott.com/public/v2/countries/de/gbfs.json),
[MobiData BW](https://www.mobidata-bw.de/) and the individual public operator feeds.
MobiData BW supplies the reviewed Bolt, Hopp, Lime and Voi GBFS 3.0 systems;
its Voi feed covers six Baden-Württemberg cities, not all of Germany.

Multi-city feeds are fetched once and routed through separate city envelopes.
City totals remain country-specific, with one count per vehicle. Published
geofencing envelopes take precedence over stray vehicle coordinates when setting
routing bounds. The map never treats these routing envelopes as legal riding
or parking boundaries. Native provider filters use the same generated catalog.
Supported city names and aliases are resolved locally before Swiss address search.
