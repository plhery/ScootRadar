# City zones the apps download

The zones a city sets for shared scooters (`data/city-zones.json`, see
DATA_SOURCES.md, "Ride and parking zones") are built into both apps' catalogs,
`ProviderCatalog.generated.swift` on the iPhone and `catalog.json` on Android.
By 30 October 2026 they were 4 MB of the iPhone's 5.15 MB catalog, and the iOS
check on GitHub took 23.5 of its 30 minutes, longer with every city: Berlin's
no-parking zones alone would have taken the catalog to about 6.8 MB. A city
marked `"download": true` in `data/city-zones.json` is no longer built in: the
apps download its zones when a view reaches it (Desk [222], 30 October 2026).
The website is unchanged: it has always loaded a city's zones only once a view
reaches it (`src/lib/cityZones.ts`).

## What is published

`npm run generate:providers` (`scripts/generate-provider-catalog.mjs`) writes,
beside the catalogs, from the same `data/city-zones/<id>.json` the website
reads, and `npm run check:providers` checks them as it checks the catalogs:

- `public/zones/v1/<id>.json`, a city's zones: its id, then each zone's id,
  kind and ring, one zone a line, the ring as latitude, longitude, latitude,
  longitude… as in Android's `catalog.json`. Only the kinds the apps draw
  (no riding, no parking, slow, parking) are there, as in the catalogs: the
  pavements and racks-only areas only the website draws are left out.
- `public/zones/v1/index.json`, the cities to download: for each its id,
  place, authority, time zone, source, bounds, number of zones, size in bytes
  and the SHA-256 of its file. The index has `"format": 1`.

They are static files of the website, served by Cloudflare at
`https://scootradar.com/zones/v1/…` with every deploy, and so published only
once CI has passed. Nothing about them reaches the scooter cache.

**Versions.** A city's version is the SHA-256 of its file: it changes when
`scripts/update-city-zones.mjs` reads the city again and the catalog is
generated. An app checks every file it downloads against the index, so a
file from another deploy, cut short or changed on the way is never drawn.
The `v1` in the path is the format: a change an app of today could not read
goes under `v2/`, and `v1/` stays published while apps that read it are in use.

## When the iPhone app downloads

- **The index:** when a view from zoom 14 is shown and the index was not
  confirmed in the last 6 hours. It is a few kilobytes and the same for
  everyone, so asking for it says nothing of where the rider is.
- **A city's file:** when a view from zoom 14, and half of it again around,
  reaches the city's bounds (as the built-in cities' zones are picked) and the
  file of the index's version is not on the device. Asking for it tells the
  server the city, no more: the request carries no coordinates.
- Both go through the app's private session, which keeps nothing on disk
  itself.

## What is kept

The index and each city's file are kept in the app's caches directory
(`Library/Caches/CityZones/v1`), which iOS does not back up and may empty when
space runs short; they are then downloaded again. A city's file is kept only
while the index lists it at that version; files of cities no longer listed
are deleted when a new index arrives. The privacy notice says so.

## What the rider sees

A rider must never see a wrong rule because a download is missing or stale,
so the map says when a city's zones are not drawn rather than show none:

- **Drawn:** the city's file of the current index's version is on the device.
  The zones are drawn and listed in the legend as built-in cities' are.
- **Loading:** the file is on its way. The legend says "Loading Berlin's
  zones…", and nothing of the city is drawn, not even an older version.
- **Unavailable:** the file or the index could not be downloaded or checked.
  The legend says "Berlin's zones unavailable right now", and nothing of the
  city is drawn. The app asks again 30 seconds later while the city is in
  view, and whenever the map moves after that.
- **Offline:** the files on the device are drawn while the index was
  confirmed in the last 7 days. After that the city's zones are unavailable
  until the index can be confirmed again: by then a newer version may be
  published, and an older one is not shown.
- **Before the first index:** the app knows the download cities of the day it
  was built (`CityZoneDownloads.builtIn`, generated), so a view over one says
  its zones are loading or unavailable, never nothing. Once an index arrives
  it alone says which cities there are.
- "No zones published here" is never said over a city whose zones are
  loading or unavailable.

A city both built into the app and in the index (one moved to downloads
after this app was built) is drawn from the built-in catalog; its entry in
the index is left aside.

## Old apps

Apps built before downloads read nothing under `/zones/`: they draw the cities
built into them, which stay built in, and `/api/zones` is unchanged. A city
marked `download` is in no catalog, so no app shows it before it can download
it; the first iPhone release that downloads shows every city of the index
from the day it is out.

## Holding a city back from the website

A city marked `"website": false` is published for the apps but not drawn on
the website (`ZONE_CITIES` in `src/lib/cityZones.ts` leaves it out). Berlin
and Hamburg, the first download cities, are so marked until the first iPhone
release that downloads city zones is out (Desk [222]): delete the line to draw
them. Nothing in the design needs the hold: the website loads each city's
zones on demand, as it always has, so it could draw them at once.

Lille is not a download city: its 680 places for e-scooters, in the MEL's
dataset `edpm_vae_libreservice`, are already drawn, on the website and in the
apps, as Lime Lille's mandatory parking (`src/lib/lilleParking.ts`), and as
city zones they would be drawn twice.

## Android

The Android app reads `catalog.json`, from which download cities are left out
as from the iPhone's catalog. Until it downloads them it does not show them;
it is to do as the iPhone app does, from the same files. `catalog.json` has no
list of the download cities yet: Android's decoder refuses keys it does not
know, so the generator adds one only with the Kotlin that reads it.

## Adding a city

Add it to `data/city-zones.json` with `"download": true` (and
`"website": false` only if it is to wait for a release), run
`node scripts/update-city-zones.mjs <id>` and `npm run generate:providers`,
and add its loader to `CITY_ZONE_FILES` in `src/lib/cityZones.ts`. The next
deploy publishes it, and every app that downloads shows it from then on.
