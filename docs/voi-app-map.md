# Voi authenticated rider map

Verified 24 October 2026 using the publisher-signed Android app 3.360.0
(build 4000), after the user signed into their rider account and authorized
using its map. The APK's signer matches Voi's
[app-link association](https://open.voi.com/.well-known/assetlinks.json).
This is an unofficial rider API integration. Existing public GBFS feeds remain
the sources wherever they already cover Voi. In Switzerland, since 28 October
2026, the national feed's scooters stand where the rider map puts them in its
eight zones (`server/swissAppMaps.ts`, DATA_SOURCES.md): Zürich 194, Winterthur
128, Basel 206, Bern 222, Biel/Bienne 418, Frauenfeld 201, Schaffhausen 427 and
Illnau-Effretikon 319, 2,376 scooters that day against the national feed's 2,438.

The live audit checked 148 app regions by their exact zone id, then fetched
117 active, scooter-capable regions after removing test/demo regions and
Port of Moerdijk's restricted employee service. There were 113 nonempty
scooter regions in 11 countries. Arnhem contained bikes only; Skaun Orkland,
Haugesund and Turin contained no scooters. Every returned scooter matched
its requested zone. Public Voi fleets were checked for matching vehicle ids
and positions before adding the 72 app regions below.

| Country | App regions added |
| --- | ---: |
| AT | 2 |
| DE | 22 |
| DK | 3 |
| FI | 4 |
| GB | 17 |
| IT | 2 |
| NO | 7 |
| SE | 15 |

These add 50 destinations, taking the catalog from 534 in 28 countries to
584 in 29. Denmark adds Aarhus, Odense and Aalborg. City names are merged
with the existing catalog, including the separate towns in the Mainz/Wiesbaden and
Cheltenham/Gloucester service areas. The 12 NRW.Mobidrom feeds added in
parallel retain official GBFS instead of the overlapping rider regions.
Counts describe this audit, not a promise that every fleet remains available.

## Session and collection

The Node cache reads `/data/voi-session.json`, or `VOI_SESSION_PATH`:

```json
{"version":1,"authenticationToken":"<rider authentication token>","deviceId":"<app-scoped device id>"}
```

Keep this file owned by the cache user with mode `0600`, outside the repository
and web assets. The production file was seeded into the existing persistent
volume over SSH stdin, with no credentials in command arguments. No login
credentials enter the Worker, browser, generated catalog or logs. A new login
can replace this file without restarting the cache.

`POST https://api.voiapp.io/v1/auth/session` accepts
`{"authenticationToken":"…"}` and the Android app/device headers. It returns
an `accessToken` valid for 15 minutes and an `authenticationToken`. The
observed authentication token lasts approximately 540 days. Renewal is shared
across concurrent collections; rotation, if returned, is saved atomically
before the access token is used. A rejected access token gets one renewal and
retry. Repeated authentication failures back off for a minute; HTTP 429 pauses
requests across all Voi regions for the provider's Retry-After interval.

`GET /v2/rides/vehicles?zone_id=<id>&include_suggestion=false` carries
`X-Access-Token`. The response's `data.vehicle_groups[].vehicles` contains
both bikes and scooters, even with the app's scooter category query filter.
The parser therefore keeps only `category === "scooter"`, requires the exact
zone id and valid coordinates, and deduplicates by vehicle id. `locked: true`
is normal for a parked scooter and does not mean it is unavailable.

Battery is a percentage. Range, fares, vehicle-specific rental links, parking
and zones remain unknown. Since 29 October 2026 the card's **Open in Voi**
opens Voi's app on the link Voi's public feeds give every scooter,
`https://lqfa.adj.st/closest_vehicle?…`, which the app claims; without the
app, a phone goes on to its store (`data/providers.json`). A completed response is its observation time;
the source supplies no independent position timestamp. The map's usual
expiry and municipal night-ban rules still apply. Calls start no more than
twice per second, with the scheduler's two concurrent slots per host; requests
have a 20-second deadline and bounded response bodies. App endpoints are
excluded from GBFS discovery, parking and zone retrieval.

## Validation and official access

The session, parser and collection tests exercise concurrent renewal,
rotation/restart, authentication failure, rate limiting, malformed replies,
wrong zones, mixed vehicle types and bounds. A fresh authenticated collection
also succeeded inside the existing production `node:26-alpine` container;
the emulator is not needed for ongoing refreshes.

Voi's official licensed GBFS access remains a separate option; its previously
published UK contact is nap@voiapp.io. The rider login does not establish
permission under that partner licence. No email was sent.
