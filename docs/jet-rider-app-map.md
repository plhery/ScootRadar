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

The map is `GET https://service.jetscooters.fun/gatewayclient/api/v6/transports`,
with `latitude`, `longitude`, `radiusByMeters`, `zoom=18`,
`useBluetooth=false`, `includeEmptyParkings=false` and `withEBikes=true`.
Successful replies have `succeeded: true`, an empty `errors` array, and
`entries.transports` plus `entries.parkings`.

The map lists loose transports one by one, with `identifier`, `type`,
`location.lat`, `location.long` and `batteryPercent`, a percentage from 0 to
100. A parking is listed only as `id`, `location`, `countScooters` and
`countBikes`: the scooters standing in it are not on the map. They are
scooters like the others, hired from the app's parking card, and not a
second count of the loose ones; in Tashkent on 23 November 2026 the map's
parkings held 768 scooters beside 2,556 loose ones.

Two further reads list every scooter, parked ones included:

- `POST /api/v6/transports/polygon`, with the JSON body
  `{"polygon":[{"lat":…,"long":…}, … 5 points, closed],"withEBikes":true}`,
  replies `{transports, errors, succeeded}`. Each transport has `state`,
  `parkingId` when it stands in a parking, and `charge.batteryPercent`, a
  fraction from 0 to 1, and `charge.remainKm`, the app's estimated range.
- `GET /api/v1/parkings/{id}` replies `{data: {id, transports, …}}`, the
  scooters of one parking, the same number as its `countScooters`.

Only `Scooter` and `EScooter` entries in state `Available` or
`AvailableWithoutGps` are kept. The collector publishes battery and range;
rental links remain unknown, and it publishes no riding or parking rules.

A polygon's reply stops at 250 transports, and below that it leaves some of
a full box's out, with no sign of it: on 23 November 2026 one Tbilisi box
returned 206 scooters where its sixteen parts returned 319, the same each
time it was read. So the map is read first, and its counts size and check
the polygons:

1. The map covers each reviewed area with circles of at most five kilometres
   radius. A wide view stops at 500 loose transports, and lists 149 parkings
   at most, those holding something first. A reply with 400 or more
   transports, before bike filtering or deduplication, or with 149 parkings
   of which the last still holds a scooter or bike, is replaced by four
   smaller views, to a depth of eight.
2. Each area is then cut into boxes holding at most 150 scooters by the
   map's count, loose ones plus each parking's `countScooters`. A box is read
   as a polygon 60 metres wider, for scooters at the edge of a parking on
   its border. A reply missing more than 3% of the box's count, or more than
   two scooters, is read again as four quarters, down to boxes of 100 metres
   radius.
3. A parking that still holds fewer scooters than its count, one a reply
   left out or one hired since the map was read, is read on its own, at
   most 40 of them per sweep.

Overlaps are deduplicated by identifier, a polygon's record replacing the
map's; positions outside every reviewed area are discarded. A loose scooter
no polygon listed is kept from the map, with no range. The entire region
must finish within 300 requests and 150 seconds. A failed read, a pile that
stays capped, or more than 40 short parkings fails the whole collection,
preserving the previous snapshot under the normal expiry policy. One shared
client spaces all JET rider requests by 500 ms. A sweep waits on that pace,
so it takes one of the host's collection slots but none of the cache's
shared ones (`paced`). A watched region is collected again two minutes after
its last collection started, not one.

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
bounded and malformed replies, vehicle types, circle coverage, capped views,
disjoint towns, deduplication, whole-sweep failure and collector wiring
alongside Go Jet.

A full Netcup audit completed all enabled regions before deployment. The
initial regional audit returned 2,603 individual scooters in Tashkent and
1,156 in Tbilisi, with 36 and 24 map requests respectively. Smaller cities
were read separately from their neighbours; the zero result inside Beruni's
and Turtkul's own areas excluded that provisional region from the final catalog.

## Parked scooters, 23 November 2026

On Netcup, the compiled collector, reading parked scooters as above, swept
every region in the evening, local time:

| Region | Scooters | Loose on the map | Map, polygon and parking requests | Seconds |
| --- | ---: | ---: | --- | ---: |
| Tashkent | 3,340 | 2,556 | 36, 59, 10 | 70 |
| Tbilisi | 1,936 | 1,121 | 20, 44, 2 | 43 |
| Bukhara | 249 | 119 | 4, 4, 0 | 4 |
| Fergana | 197 | 111 | 4, 3, 3 | 6 |
| Namangan | 143 | 96 | 4, 3, 0 | 4 |
| Urgench | 133 | 62 | 1, 1, 0 | 1 |
| Termez | 108 | 108 | 1, 1, 0 | 1 |
| Andijan | 86 | 61 | 1, 1, 0 | 1 |
| Navoiy | 78 | 62 | 1, 1, 0 | 1 |
| Chirchiq | 71 | 68 | 1, 1, 0 | 1 |

That is 6,341 scooters where the map alone listed 4,364, and 6,318 of them
with a range, from 0 to 36 km. Tashkent's map counted 768 scooters in its
parkings and Tbilisi's 811. Sized at 200 and 250 scooters a box instead of
150, the same sweeps took 55 and 65 polygons in Tashkent and 45 and 53 in
Tbilisi, since more replies fell short and were read again as quarters.

Karshi and Jizzakh, in the directory but not enabled, were read at 21:30
local time, when Bukhara and Navoiy had 248 and 77 scooters: Karshi's 149
parkings and Jizzakh's 22 held none, and neither had a loose one. They had
been empty the night before too, as had Bishkek, Ganja and Minsk.
