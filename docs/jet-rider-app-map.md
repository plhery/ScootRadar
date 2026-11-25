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
  `parkingId` when it stands in a parking, `charge.batteryPercent`, a
  fraction from 0 to 1, `charge.remainKm`, the app's estimated range, and
  `model.name`, such as `Ninebot Max Plus`.
- `GET /api/v1/parkings/{id}` replies `{data: {id, transports, …}}`, the
  scooters of one parking, the same number as its `countScooters`.

Only `Scooter` and `EScooter` entries in state `Available` or
`AvailableWithoutGps` are kept. The map's list gives no state, so a loose
scooter it lists that a polygon or parking reply lists in another state, as
`Booked`, is left out too; until 24 November 2026 it was published from the
map, with no range or price. The collector publishes battery and range,
each scooter's link and, where its card gives one, its price (see
[links and prices](#links-and-prices)); it publishes no riding or parking
rules.

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
no polygon listed is kept from the map, with no range; one a polygon lists
in a state that can't be hired is not counted missing from it. The entire region
must finish within 300 requests and 150 seconds, its price reads included. A failed read, a pile that
stays capped, or more than 40 short parkings fails the whole collection,
preserving the previous snapshot under the normal expiry policy. One shared
client starts JET rider requests 250 ms apart, all regions together (see
[request pace](#request-pace-24-and-25-november-2026)). A sweep waits on that pace,
so it takes one of the host's collection slots but none of the cache's
shared ones (`paced`). A watched region is collected again two minutes after
its last collection started, not one, and ten minutes after for a view too
wide to show single scooters, from zoom 15 out, as other app maps are
(`APP_MAP_WIDE_INTERVAL_MS`). From 23 to 24 November 2026 such a view had it
collected every two minutes too.

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

## Links and prices

Each scooter's QR code carries `https://ure.su/j/` and the scooter's
identifier. JET's apps claim that link: on 23 November 2026 ure.su's
`apple-app-site-association` gave `PT6Z25VDAN.com.jetscooters.jet` the
paths `/j/*`, and its `assetlinks.json` named `com.jetscooters`. The app's
deep-link mapper opens the scooter's card from the link's last segment, the
read below. Without the app, the page sends an iPhone to the App Store, an
Android phone to Google Play and anything else to jetshr.com. So every
scooter of the rider map links there on iPhones and Android, and the website
gives a computer no link, as it has no app to open. `ure.su` is the only host
`data/providers.json` allows JET. Go Jet's signed-out map links no scooter.

A scooter's card is `GET /api/v3/transports/{identifier}`, with `modelName`
and `rate.entries`, one entry for each way the app bills a ride. The one
billed by the minute has `periodMinute: 1`, its rate as `debit.value100`, in
hundredths, its start as `activationCost.value100` unless
`useActivationCost` is false, and the `culture` of each, such as `uz-UZ` or
`ka-GE`. The price depends on the city and the model, not on where the
scooter stands. On 23 November 2026, in Tashkent, a Ninebot Max Plus cost
990 soʻm to start and 990 a minute and an SL 90 1,990 and 1,190, the same at
four places across the city; in Tbilisi a Max Plus or Max Pro cost 1 ₾ to
start and 0.32 a minute, an L 60L or Max S100 1 ₾ and 0.40.

After its sweep, the collector reads the card of one scooter of each model in
the region, and reads it again once the price is an hour old: at most six
cards a sweep. A price is shown only where the card's model is the scooter's,
the card has exactly one per-minute entry, and its cultures are of the
region's country, which gives the currency: lari in Georgia, soʻm in
Uzbekistan. A card that can't be read never fails the sweep: the price read
before is shown for six hours at most from when it was read, and the card is
read again on the next sweep. A card that is read but gives no price the map
can show, as one listing two rates by the minute, keeps the price read
before the same way, and is read again an hour later; until 24 November 2026
it erased that price at once. A loose scooter that no polygon
listed has no model, so it has no price. Prices are held in memory, so a
restarted cache reads them again on its first sweeps.

## Range of Go Jet's scooters

Go Jet's signed-out map reports a battery and no range. Since 23 November
2026 the range filter takes a full JET battery at 18 km
(`data/battery-full-ranges.json`). That was the lowest median of range over
battery among the rider map's regions that evening, Bukhara's and
Termez's; Tashkent's was 31.6 km and Tbilisi's 35.9.

## Request pace, 24 and 25 November 2026

Until 25 November the shared client started requests 500 ms apart, the 120 a
minute of Go Jet's signed-out client, not a limit JET was seen to set. The cache sweeps up to two JET rider regions at once, and two
regions sweeping together each had every other turn. At 13:00 in Tashkent on
24 November, with Tashkent and Tbilisi both watched, three pairs of sweeps
took 92 and 85 s, 133 and 121 s, and 91 and 94 s, against 70 and 43 s for
each alone the evening before: the slowest was 17 seconds from the
150-second limit, past which a sweep fails. At 19:00 UTC on 25 November,
midnight in Tashkent, the pair still took 97 and 90 s.

That night, from the cache's container and on its session, JET answered 20
map and polygon reads 500 ms apart, then 120 at 250 ms and 120 at 150 ms,
just after the cache's own sweep of both regions, all with 200 and in 147, 132 and 131 ms at
the median, 195, 174 and 167 ms at the 90th percentile. No 429 from JET has
been seen. Requests now start 250 ms apart: a sweep makes as many as
before, so each region's load on the account is the same every cycle, only
sooner, and a 403 or 429 still holds every request for a minute or more.
Twenty minutes later, on the new pace, three pairs took 40 and 32 s, 42 and
33 s, and 41 and 32 s, with no failure.
