# JET authenticated rider map

The user authorized a JET rider login on 22 November 2026. This is the
Central Asian Android app, `com.jetscooters` 2.8.0 / 2080, distinct from
Go Jet. Its APK and Google Play source stamp were verified against the
[previously recorded JET signer](jet-whoosh-beam-luup-app-maps.md#app-provenance).
The official app handled hCaptcha and the user's SMS verification. APKs,
phone details, credentials and raw responses stay outside the repository.

## Coverage

Ten collection regions cover Tbilisi and nine Uzbek cities: Tashkent,
Andijan, Bukhara, Chirchiq, Fergana, Namangan, Navoiy, Termez and Urgench.
Each envelope encloses the city's reviewed rental zones with a 0.001-degree
margin. The app also groups outlying towns under some city ids. Those towns
were queried separately; Khanabad, Beruni, Turtkul, Galaosiyo, Kogon,
Gijduvon, Romitan, Jondor and Khiva held no individual scooter inside their
own reviewed areas and remain excluded. A wide read around Beruni had shown
nearby Urgench scooters, which is not evidence of Beruni coverage. Production
does not download or enable new cities from the operator's directory
automatically.

The [signed-out Go Jet collector](gojet-app-map.md) continues to supply
Almaty, Batumi, Baku and its Latin American regions. No city has both JET
collectors enabled. The authenticated directory includes additional markets,
but a listing alone does not establish an available fleet. Ulaanbaatar,
Darkhan, Erdenet and Dalanzadgad returned no individual scooter on 22
November, nor did the other Kazakh cities surveyed. Dubai, Oran and Utrecht
were also empty; Yerevan was absent from the directory. Those places are
not enabled by this integration. Russian regions remain excluded.

## Map contract and collection

The reader is `GET https://service.jetscooters.fun/gatewayclient/api/v6/transports`,
with `latitude`, `longitude`, `radiusByMeters`, `zoom=18`,
`useBluetooth=false`, `includeEmptyParkings=false` and `withEBikes=true`.
Successful replies have `succeeded: true`, an empty `errors` array, and
`entries.transports` plus `entries.parkings`.

Individual transports have `identifier`, `type`, `location.lat`,
`location.long` and `batteryPercent`, a percentage from 0 to 100. Only
standing `Scooter` and `EScooter` entries are retained. Battery may be
unknown; range and rental links remain unknown. Parking totals do not
identify additional scooters and are not added to the individual fleet.
Consequently this source does not claim to include the additional inventory
represented only by parking counts. It publishes no riding or parking rules.

A wide view stops at 500 individual transports. The cache covers each
reviewed envelope with enclosing circles of at most five kilometres radius.
A reply with 400 or more transports, before bike filtering or deduplication,
is replaced by four smaller views. Overlaps are deduplicated by identifier;
positions outside every reviewed service area are discarded. The entire
region must finish within 160 map requests and 90 seconds, with at most
eight subdivisions. A failed child or a pile that stays capped fails the
whole collection, preserving the previous snapshot under the normal expiry
policy. One shared client spaces all JET rider requests by 500 ms.

## Authentication and renewal

The private file defaults to `/data/jet-rider-session.json`, beside the
snapshot; `JET_RIDER_SESSION_PATH` overrides it. It must be owned by the
cache's Node user (UID 1000) with mode `0600`. Its version-1 schema is:

```json
{
  "version": 1,
  "accessToken": "<JET access token>",
  "refreshToken": "<JET refresh token>",
  "expiresAt": 0,
  "signingKey": "<base64, 64-byte app request-hash key>",
  "oauth": {
    "clientId": "<app client id>",
    "clientSecret": "<app client secret>",
    "scope": "<app scopes including offline_access>"
  },
  "headers": {
    "UR-Brand": "JET",
    "UR-Device-Id": "<dedicated app installation id>",
    "UR-Client-Id": "<app client id>"
  }
}
```

`expiresAt` is the access token's expiry in Unix milliseconds; zero above is
only a placeholder. Preserve the app's device and routing headers when
seeding the file. The client retains only its explicit header allowlist.
Never seed credentials through Git, command arguments or Worker variables.
Transfer them over SSH stdin and install them atomically in the persistent
volume before enabling the feeds.

Access tokens last 1,800 seconds. Renewal posts an encoded form to
`/api/v1/connect/token`, with `grant_type=refresh_token`, the refresh token
and the app's OAuth configuration. Concurrent readers share one renewal.
The replacement session is saved mode `0600` through the volume's `tmp`
directory before it is used; a restart loads that saved session. A map 401
allows one renewal and one retry. Renewal failures back off for a minute;
403 and 429 also hold map requests, honoring a bounded `Retry-After`.
Errors exclude upstream bodies, tokens and private file paths.

The October investigation missed the app's `UR-Request-Data` hash. Unsigned
map reads worked, but unsigned renewal returned `400 invalid_grant`.
The native `HashValidationInterceptor` sorts lower-case `ur-` header names,
excluding `UR-Request-Data`, and concatenates their first values, then
sorted decoded query names and values, then the exact UTF-8 request body.
`HashUtil` signs that string with HMAC-SHA256 and upper-case hexadecimal.
The app-derived, client-specific 64-byte key is private session configuration,
like Go Jet's separate signing configuration; it is not committed. Both map
reads and renewal now carry the native hash.

## Verification on 22 November 2026

A bounded Mac sweep returned 2,619 individual scooters in Tashkent over 36
requests and 1,146 in Tbilisi over 20 requests, compared with 500 in each
initial wide view. Between the initial sample and the bounded sweep, one
Tashkent scooter and five Tbilisi scooters moved at least 20 metres. Counts
are observations, not expected totals.

The official app renewed at its first access-token expiry. The direct client
then reproduced the hash and renewed successfully without another SMS.
On Netcup, the compiled collector renewed a deliberately expired local
session timestamp, saved the replacement as UID 1000 with mode `0600`, and
a fresh client read the saved session without another renewal. Two small
Tbilisi reads succeeded; the first contained 132 individual scooters.

Tests cover native hash ordering, credential containment, renewal and
restart persistence, concurrent readers, rejected tokens, rate limits,
bounded and malformed replies, vehicle types, parking-count exclusion,
circle coverage, capped views, disjoint towns, deduplication, whole-sweep
failure and collector wiring alongside Go Jet.

A full Netcup audit completed all enabled regions before deployment. The
initial regional audit returned 2,603 individual scooters in Tashkent and
1,156 in Tbilisi, with 36 and 24 map requests respectively. Smaller cities
were read separately from their neighbours; the zero result inside Beruni's
and Turtkul's own areas excluded that provisional region from the final catalog.
