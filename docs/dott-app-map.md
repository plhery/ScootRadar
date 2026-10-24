# Dott anonymous map adapter

Verified 24 October 2026 against the publisher-signed Android 2.252.0 APK
(build 12863) and fresh, signed-out map calls. The user explicitly authorized
using this route for regions missing from GBFS on that date.

## Coverage

The app exposed 248 region outlines. A single bounded check of each of the
206 candidate regions outside Switzerland, with two concurrent calls, found
167 nonempty scooter regions and 72,276 scooters. The rough initial
classification used bounding-box centres; Abu Dhabi and Dubai were actually
already covered and were removed from the candidates after checking the
vehicle positions. Switzerland continues to use its existing national feeds.

The catalog adds 157 app-backed regions and 69,570 scooters from that sweep:

| Country | App regions |
| --- | ---: |
| Austria | 11 |
| Germany | 63 |
| Spain | 3 |
| Finland | 20 |
| Greece | 2 |
| Hungary | 5 |
| Italy | 16 |
| Poland | 37 |

Bochum was also live again through public GBFS and uses that richer source.
Previously excluded small Norwegian, Saudi and Emirati fleets retain their
existing audit decisions. Paris's single scooter was excluded: the city's
shared-scooter service is closed. Empty app regions, including all checked
British, Belgian, Danish and Dutch candidates, were not added. Catalog
region ids are exact app ids; city names were reviewed to avoid using a
suburb returned for the centre of a large bounding box as the city name.
Two separate Szczecin regions count under the same city.

## Protocol and collection

The cache now uses Node 26, matching the project's toolchain. A deployment
compatibility check found that Node 24 and Node 26 Linux images with
OpenSSL 3.5 received an HTML 404 during TLS 1.3 requests, while the Mac's
Node 26/OpenSSL 4 client succeeded. Selecting TLS 1.2 for this endpoint
completed a full Hamburg sync from a temporary `node:26-alpine` container
on Netcup (3,548 scooters). This transport setting is limited to Dott;
no proxy, credentials, extra runtime dependency or request-signing workaround
is needed. The earlier assumption that non-app clients were refused was
not enough to explain these results: TLS compatibility affects retrieval.

`server/dottApp.ts` opens a bidirectional HTTP/2 gRPC watch at
`https://rider.api.ridedott.com/ridedott.rider.v1.Vehicles/WatchAvailableVehicles`.
No authorization header, rider account, API key or attestation token is used.
The request carries the Android client metadata, a random device id, map
view `1`, the region's bounds and electric kick-scooter type `1`.

The protobuf fields verified in the APK are:

| Message | Fields |
| --- | --- |
| Request | view `1`, bounding box `2`, packed vehicle types `3` |
| Bounding box | northeast `1`, southwest `2`; points have latitude `1`, longitude `2` as doubles |
| Response oneof | changed vehicle `1`, removed vehicle `2`, synchronization status `3` |
| Changed vehicle | vehicle `1` |
| Removed vehicle | id `1` |
| Vehicle | id `1`, point `2`, type `3`, region id `5` |
| Synchronization | status `1`: synchronized `1`, synchronizing `2` |

Changes replace by vehicle id and removals delete by id. A new synchronizing
status clears accumulated state. Only a synchronized status completes the
snapshot, including an empty one; ending or timing out earlier fails it.
Streams close after synchronization and have a 20-second deadline, a 1 MiB
frame limit and a 16 MiB response limit. Collections start at most twice a
second, with at most two streams to the host under the cache scheduler.

Only type `1`, the exact catalog region and positions inside the reviewed
bounds are published. Bikes and vehicles in adjacent regions are excluded.
The source reports no charge, range, pricing, vehicle-specific rental links,
parking, zones or position timestamp. Charge and range remain unknown; the
completed sync is the observation time, so upstream position age cannot be
independently established. The existing app-level Dott link remains available.
The usual 15-minute snapshot expiry still applies after errors.

The adapter is limited to the Node cache. It is not imported into the
Cloudflare Worker, and app endpoint URLs are never fetched as GBFS discovery,
parking or zones. `scripts/check-french-feeds.mjs` loads the same collector
for app-backed entries, so the catalog audit checks their actual protocol.

Helsinki, Espoo and Vantaa use the existing weekend-night notice system:
Helsinki Friday/Saturday 23:00–05:00; Espoo and Vantaa 00:00–05:00.
Their municipal boundaries are OpenStreetMap's, simplified to within 100 m
and credited under ODbL. As elsewhere, holiday eves are not modeled.
Sources: [Helsinki](https://www.hel.fi/en/urban-environment-and-traffic/cycling/electric-scooters),
[Espoo](https://www.espoo.fi/en/transport-and-streets/sustainable-forms-transport),
[Vantaa's 2026 permit terms, §6.1](https://www.vantaa.fi/sites/default/files/document/Vantaa-mikroliikennelupa-ehdot-2026.pdf).

## Official access and email

Dott documents authenticated partner GBFS through
[Partner Integrations](https://ridedott.dev/docs/services/gbfs/introduction/),
with [signed JWT credentials](https://ridedott.dev/docs/services/gbfs/guides/authentication/)
and per-region access. A supported integration should request these
credentials and explicit permission for public display and caching.

The Dott-published [Belgian national transport-data listing](https://transportdata.be/fr/dataset/dott)
names Dunya Kirkali, **dunya@ridedott.com**, as its GBFS contact (metadata
updated 18 December 2024). That is a published data contact, not a verified
current Partner Integrations mailbox. Dott's current
[imprint](https://ridedott.com/imprint/) lists **support@ridedott.com**;
ask it to route the request if the data contact no longer handles it.

Suggested email, not sent:

> Subject: ScootRadar — request for official Dott GBFS access
>
> Hello Dott team,
>
> I run ScootRadar (https://scootradar.com), a map that helps riders find
> shared e-scooters and open the operator's app to rent them. Could you put
> me in touch with Partner Integrations about official GBFS access across
> Dott's operating regions?
>
> We would display available scooter positions with Dott attribution and
> links to your app. Our server keeps the latest snapshot, normally
> refreshing a region every 20 minutes, or every minute while viewed;
> individual positions expire after 15 minutes. We do not handle rider
> accounts, bookings or payments.
>
> Could you confirm the credentials, permitted regions, rate limits and
> terms for public display and this short-lived caching? We would also
> welcome pricing, parking and geofencing feeds where available.
>
> Thank you.

## Verification

Fresh automated HTTP/2 retrieval completed for all 206 candidate regions.
The first Hamburg check returned 3,551 scooters; counts changed slightly in
the subsequent sweep. Production collector logic was checked against the
local HTTP/2 test server for fragmented frames, resets, changes, removals,
empty maps, incorrect region/type/bounds, malformed data, incomplete streams,
deadlines, HTTP/gRPC failures and connection cleanup. Actual deployment is
separate from these local and upstream checks. The exact Node 26 Alpine
production runtime was also checked on Netcup before committing.
