# Go Jet signed-out scooter map

Verified on 24 October 2026. `server/jetApp.ts` reads the normal signed-out
map of Go Jet (`com.gojet.app`), without a rider account, SMS, bearer token
or Firebase App Check token. The earlier conclusion that this map required
a rider sign-in was incorrect: those probes had stopped at request signing.
JET's separate `com.jetscooters` app still requires a rider sign-in.

## Coverage verified live

The official city list returned 61 entries. The rental polygons around those
entries provided 91 distinct service areas. A complete sweep found **45,445
available scooters** in 54 collection regions, with charge on every scooter:

| Market | Collection regions | Available scooters |
| --- | ---: | ---: |
| Brazil | 48 | 32,263 |
| Chile | 2 | 3,713 |
| Mexico | 1 | 491 |
| Kazakhstan | 1 | 4,552 |
| Azerbaijan | 1 | 3,004 |
| Georgia | 1 | 1,422 |

These are available vehicles at the time of the sweep, not fleet sizes.
Examples include São Paulo (3,626), Santiago (3,028), Temuco (685),
Monterrey–San Pedro (491), Almaty (4,552), Baku (3,004) and Batumi (1,422).
São Luís and Mexico City were listed but empty across their complete
envelopes and are not registered. Russia is not included.

The catalogs are `data/{brazilian,chilean,mexican,kazakh,azerbaijani,georgian}-scooter-feeds.json`.
Their bounds enclose the app's rental polygons with a small margin. Polygons
were assigned to their nearest advertised city; overlapping collection
envelopes were merged to avoid counting a scooter in two feeds. Nearby
town names remain search aliases. Florianópolis's separate app entries
share one city label but retain their disjoint collection envelopes.
Coverage is the fleet visible in **Go Jet**, not every fleet in the older
JET app: the Almaty result does not establish all of JET's Almaty inventory,
nor access to Tbilisi, Tashkent or Ulaanbaatar.

Repeat complete sweeps roughly 2½ minutes later found São Paulo at 3,613,
Santiago at 3,013 and Almaty at 4,544. Respectively 4, 9 and 3 matched
scooters had moved at least 20 metres, and 17, 9 and 11 had changed charge.
These are live readings, with HTTP `cf-cache-status: DYNAMIC`.

## Night rules

By 25 October 2026 none of Go Jet's towns had a night ban on renting that we
could find, in national rules (Brazil's CONTRAN 996/2023, Chile's DS
102/2019, Kazakhstan's of 1 July 2026) or in a municipal rule or a published
permit, so none is in `data/rental-curfews.json`. Many Brazilian permits and
Chilean comunas' agreements aren't published, so one of them may still set
hours. São José dos Campos says its service runs 24 hours
([city, 28 June 2024](https://www.sjc.sp.gov.br/noticias/2024/junho/28/patinetes-voltam-a-ser-opcao-de-mobilidade-em-sao-jose/)).
The map leaves out only scooters on a ride, not those that can't be hired, so
its night counts can't show a ban; from midnight to 5:00 local on the night of
24 to 25 October every region kept at least 82% of the day's scooters.
Marília (São Paulo) limits its scooter service to 6:00–22:00 by Decree 15.120
of 21 October 2026, but none of the scooters we show runs there.

Rechecked on 28 October 2026 for the biggest Brazilian towns, with the same
result. Fortaleza's press said in 2025 that JET's scooters ran from 6:00 to
22:00 and were collected overnight
([O Povo, 15 June 2025](https://www.opovo.com.br/noticias/fortaleza/2025/06/15/patinete-eletrico-em-fortaleza-como-alugar-qual-o-valor-veja-como-usar.html)),
but the city's Decree 16.261 of 8 May 2025 sets no hours in the summaries
found, and in October 2026 the region's scooters stay out all night (about
900 every hour from 22:00 to 6:00 local on 27 to 28 October), so no ban is
added. Belo Horizonte's, Porto Alegre's, Curitiba's and Salvador's rules, seen
in the cities' own summaries or the press, set no hours either.

## App provenance and protocol

The [Google Play listing](https://play.google.com/store/apps/details?id=com.gojet.app)
names JETSHR LTDA. Version 1.3.35, build 691, was obtained in the earlier
investigation. `apksigner verify --print-certs` again verified the archive
signature and Play source stamp. Its signer SHA-256 is
`17b31605da0ff37489d5ca4e8dbb33002a138d900e7614e8144831f35cc58b8f`,
matching the publisher's [app-link association](https://q.gojet.app/.well-known/assetlinks.json).
The app is Flutter/Dart 3.11.5. Artifacts and extracted signing material
stay outside Git.

All routes below are relative to `https://api.gojet.app/api/v1/`:

- `GET geo/cities` returns `cities`, each with `id`, `name` and
  `coordinates: {lat, lng}`. It works signed out with app signing.
- `GET geo/transports` takes `north_west_lat`, `north_west_lng`,
  `south_east_lat`, `south_east_lng` and `zoom`. At zoom 18 it returns
  `transports`, each with `id`, `type`, `coordinates`, and `battery_percent`
  as a fraction in 0–1. A real empty view can be `{}`.
- At lower zoom, the same route returns `transport_clusters`, whose
  coordinates are aggregate centres and **must not become scooter positions**.
- `GET geo/zones` takes the same bounds and zoom, returning `rental_zones`
  and `regulation_zones` (parking circles, slow, no-parking and no-driving
  polygons). These supplied the reviewed collection bounds; this adapter
  currently collects vehicles, not map overlays.
- `contents/configs` requires rider authorization (`G-4`), independently
  of the signed-out map. No account was created or SMS requested.

The map request carries the app user agent, `X-App-Version` (the integer
build), `X-Device-Id`, `X-Timestamp` (epoch milliseconds) and `X-Signature`.
For a bodyless GET, signing is **base64 HMAC-SHA256 of the full request URL,
including its encoded query, concatenated with the timestamp**, using the
app's signing string as UTF-8. It is not a hex digest. The app's signing
routine also supports body hashes, which this read-only adapter never needs.
A wrong signature returns HTTP 401 `GW-21`; valid signatures returned cities,
zones and individual scooters without either authorization header.

## Completeness and production transport

The API rejects sufficiently large vehicle viewports with `GC-1`. Collection
therefore tiles each reviewed envelope into rectangles no more than 0.08°
wide or high and requests zoom 18 throughout. Every tile must succeed and
contain individual vehicles before any snapshot is published. Clusters,
malformed data and authorization errors fail the collection; the cache then
keeps the previous successful snapshot. Stable `jet:<upstream id>` identities
deduplicate tile overlaps, and the collector clips its results to the reviewed
envelope. A dense São Paulo viewport and four subdivisions returned the same
671 scooter ids after clipping, with no id missing in either direction. Other vehicle types and active rides are excluded. No fabricated
range, price or per-scooter rental URL is added.

The shared client spaces requests 500 ms apart, honors `Retry-After`, holds
off all regions after HTTP 401/403/429, caps replies at 8 MiB and bounds a
collection to 90 seconds and 96 tiles. Larger envelopes require review.

Linux Node 26's default TLS handshake received a Cloudflare HTML challenge
even with correct app headers. Standard `node:https` requests constrained to
TLS 1.2 returned real vehicle JSON from the existing production cache
container on Netcup. Complete collections there returned 3,600 scooters in
São Paulo, 2,985 in Santiago and 2,895 in Baku, with their normal live changes
since the Mac sweep. No browser, emulator or challenge-solving service is
needed by the collector. An emulator was used to inspect startup, then closed;
no account was created in it.

## Private runtime configuration

Keep the following JSON in mode-0600 `/data/jet-config.json` on the cache's
persistent volume, owned by its `node` user. `JET_CONFIG_PATH` overrides the
path. The default directory follows `SCOOTER_SNAPSHOT_PATH`, as the other
private app configurations do.

```json
{"version":1,"appVersion":"691","deviceId":"<stable install UUID>","signingKey":"<private app signing string>"}
```

This is app configuration, not a rider session. The key is not copied into
catalogs, JavaScript sent to browsers, build variables, logs or error bodies.
There is no login token to renew. If the provider rotates its app key or
requires a newer build, update this private file after checking the current
official app. Missing configuration fails the feed, rather than publishing
an empty map.

Validation includes signing and transport fixtures, complete tiling, parser
failures, rate-limit holdoff, deduplication, catalog envelope checks, complete
live sweeps, repeat-position checks, and production-network collection.
