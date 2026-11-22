# RideMovi rider map

Verified on 1 November 2026 using RideMovi's official Android 5.2.0 app
(`com.ridemovi.app`) and a dedicated rider account. The Node cache reads the
same map API at `https://api.ridemoviapp.com`. Dresden was the first town;
since 22 November 2026 the cache reads every town where RideMovi has a scooter
area with scooters in it ([Towns](#towns)). This is an unofficial
authenticated integration.

## Login and private session

An operator-authorized companion APK on the physical Pixel completed an email
code login and transferred its own issued session to the Mac over a private
ADB reverse port. The official app's private storage was not read. Google's
Android reCAPTCHA SDK performed the email-send check on the phone with the
official installed application's package metadata; the companion's own package
name was rejected. No emulator or attestation keybox was needed for this path.

The app requests `POST /user/sendVerifyCodeByEmail` with query parameters
`mobileNo`, `email`, `deviceId`, and JSON containing `reCaptcha` and `siteKey`.
The action is `email_otp_send`. `mobileNo` is country calling code followed by
the local number, **without a plus sign**. Verification posts `{}` to
`/user/loginByEmail` with `email`, `otp`, and the **same** `deviceId`. A code
already consumed in another app cannot be replayed to obtain its session.
The returned `data.token` worked in ordinary HTTP requests from both the Mac
and the Netcup cache container without a device-id header or a connected phone.
The one session reads every town: on 22 November 2026 its token read the map
in Italy and Norway as in Germany.

The cache reads `/data/ridemovi-session.json`, overridden by
`RIDEMOVI_SESSION_PATH`, beside `SCOOTER_SNAPSHOT_PATH`:

```json
{"version":1,"token":"<issued rider token>"}
```

The issued token was an opaque 32-character hexadecimal value, not a JWT.
No expiration or refresh token was supplied, and no automatic renewal flow
has been verified. Its long-term lifetime remains unknown. The collector
only reads maps: it never requests codes or calls ride or payment endpoints.
On HTTP 401 or API code 15000 it stops using that token until an operator
replaces the file following a fresh login. Other errors fail the collection
and retain the previous snapshot under the cache's usual aging rules.

Keep the file owned by the cache user with mode `0600`; the client rejects
group/world-readable files. Production was seeded through SSH stdin into the
existing persistent volume. Credentials, account identifiers, verification
codes, APKs and diagnostic captures stay outside Git, generated assets, logs
and Worker configuration. Replacing the file recovers without a restart.

## Map and coverage

`GET /bike/nearby?ridingStatus=0&vehicleType=escooter&areaLimit=1` takes
`Authorization: Bearer <token>`, `AppVersion: 5.2.0`, `X-Vivi-Latitude` and
`X-Vivi-Longitude`. Successful envelopes use code `1000` and
`data.showNearbyBikes: true`. The array is `data.nearbyBikes`. Without
`ridingStatus` the map answers HTTP 403 with code `10001`, and with
`ridingStatus=1` it lists no scooter.

The endpoint returns at most **30 nearest scooters**, none farther than
**2 km**. Changing `areaLimit` from 1 through 100 to 1000 left those scooters
unchanged: that parameter controls parking/restriction arrays. On 5 November
2026 a scooter 1,990 m from the point asked was listed and at 2,010 m it was
not. A point with no scooter within 2 km gets code `1000`,
`showNearbyBikes: false` and an empty `nearbyBikes`, as a point far outside
the city does.

**A reply short of 30 does not mean there are no more scooters within 2 km.**
RideMovi takes the 30 nearest scooters, then leaves out those a rider cannot
rent. On 22 November 2026, between 16:40 and 16:55 CET, the cache's session
asked five points in each of eight towns, each town's centre and 1.2 km north,
east, south and west of it. 34 of the 40 replies listed 19 to 29 scooters,
and 33 of those left out scooters that other replies showed within 2 km of
its point; the other, Piacenza's northern one, ended 1,935 m away. Lecce's northern reply listed 19, ending 527 m away, and
left out 52; Bergen's eastern one listed 26, ending 342 m away, and left out
84; Dresden's eastern one listed 28, ending 610 m away, and left out 91. No
reply left out a scooter nearer than its own last one. So a reply vouches for
every scooter nearer than its last one, and for the whole 2 km only when it
lists none, or five or fewer (`RIDEMOVI_SHORT`): for a reply that short to be
cut, 25 of the 30 nearest would have to be scooters a rider cannot rent. Both
keep a 1% plus 5 m margin (1,975 m at most).

From 5 to 22 November 2026 any reply of fewer than 30 vouched for the whole
2 km. That day's audit on a 3 km grid over Dresden found every short reply
ending between 1,915 and 1,997 m, which no longer held on 22 November.
Replayed on Dresden's 641 scooters of 22 November, with one scooter in 21 more
left out, a sweep from no earlier positions missed 189 of them under the old
rule. A sweep planned from where the scooters stood, as the cache's are,
missed none, but could miss a scooter left where none stood before. Under the
new rule no replay missed any, in 54 to 90 requests.

Until 5 November the collector read every reply as vouching only up to its
last scooter and failed on an empty one. From about 09:30 UTC that day
Dresden's eastern edge (51.031, 13.843) had no scooter within 2 km, every
sweep failed there, and the feed expired at 11:45 (SCOOTRADAR-CACHE-69).

A hidden reply that still lists scooters, a visible empty one, a malformed
or unsorted reply fails the sweep, and so does a sweep that finds
no scooter at all, so a map hidden everywhere cannot publish an empty town.
A pile, scooters within a few metres of each other with nothing else listed,
vouches for nothing: the sweep asks closer in and then keeps the scooters it
saw there, as Bird's and BinBin's do. More would take 30 scooters, rentable or
not, within those metres. Until 22 November a pile failed the sweep.

Each town's outline is the scooter area RideMovi's app draws, returned
anonymously by
`GET /bike/operationArea/getNearestOperationArea?vehicleType=escooter`
with the same location headers. Its `inArea` is the area the point is in, and
otherwise `nearestArea` is the nearest. A point in some towns gets neither,
as in Milano, Bologna, Oslo or Wien, though Piacenza's area is 60 km from
Milano: the lookup alone does not list every area. `data/ridemovi-areas.json`
keeps each area's outer rings in lat/lon order, rounded to seven decimal
places; the holes some areas cut out (17 in Bergen's) are not kept, so a
scooter standing in one is still shown. The collector reuses `nearestSweep` to
cover the rings, starting from 2.5 km cells, whose middles reach their corners
within a reply's 1,975 m; all returned scooters contribute to coverage checks
before positions outside the outline are discarded.

Dresden's outline is `Dresden_OPS`, area `1286`, city `86`. Its cold audit on
1 November took **68 requests, 81 seconds**, and found **682 scooters inside
the operating polygon**, with no unresolved cells. Across overlapping views,
599 scooters were observed repeatedly at identical positions; none was missing
inside another reply's certified radius. The production collector then
completed a separate cold sweep from the Netcup container: 683 scooters, all
with battery and range, in 68 requests and 81 seconds. These counts describe
the audits, not future fleet availability.

Only the verified scooter types `SN1` (Ninebot) and `SO1` (Okai) are accepted;
the app identifies e-bikes as `E1`. On 22 November 2026 every town's replies
held only these two. Every vehicle must have a city, a unique positive id and
valid coordinates, and an ascending distance consistent with its position. Battery is `bikePowerBatteryStatus.soc` in
percent; range is `estimatedTravelDistanceInKM`, converted to metres.
Unavailable or implausible battery/range stays unknown. QR numbers, lock ids,
battery hardware identifiers and account data are not published.

## Towns

Each town is one feed, `ridemovi_<country>_<town>`, whose outline is the
area RideMovi's lookup returned at the town's centre on 22 November 2026
(Dresden's on 1 November), and whose bounds are that outline's. The last
column is the reply at the centre that day, from about 16:45 CET, and the
type of its scooters: each listed a single type, and none an e-bike.
Dresden's type was not recorded.

| Town | Area | City | Area's name | Outline | Centre's reply |
| --- | ---: | ---: | --- | ---: | --- |
| Dresden | 1286 | 86 | `Dresden_OPS` | 97 km² | 30 |
| Aachen | 1191 | 65 | `20250512_Ops Area_00` | 40 km², 5 parts | 29 SN1 |
| Bochum | 1563 | 99 | `Update 29.10.26` | 74 km² | 30 SN1 |
| Bonn | 1585 | 89 | `Launch area 1` | 82 km² | 30 SN1 |
| Dortmund | 1406 | 90 | `Operation area` | 121 km² | 29 SN1 |
| Essen | 1532 | 71 | `Ops` | 100 km² | 28 SN1 |
| Köln | 1533 | 83 | `Ops_Area_20250915` | 266 km² | 30 SN1 |
| München | 1534 | 98 | `Munich_Ops` | 308 km² | 28 SN1 |
| Wuppertal | 1451 | 91 | `Wuppertal_OPS_00` | 60 km² | 27 SN1 |
| Bergen | 1552 | 92 | `Operation area` | 114 km², 17 holes | 29 SN1 |
| Parma | 1187 | 73 | `PR_4_DEF` | 30 km², 2 parts | 29 SO1 |
| Piacenza | 1539 | 44 | `Piacenza_28_01` | 21 km², 5 holes | 20 SO1 |
| Vicenza | 1181 | 25 | `Magna gatti 4.0` | 12 km², 81 parts | 25 SN1 |
| Lecce | 1499 | 97 | `OA_LE_High_Season` | 54 km² | 24 SO1 |
| Alghero | 1586 | 85 | `Ao Alghero 2.1` | 5 km² | 26 SN1 |
| Imperia | 1414 | 93 | `Operation area` | 9 km² | 27 SO1, at 17:24 |

Sizes are of the outer rings, holes included. Vicenza's area is 81 separate
parts; a scooter between them is read but not shown.

Bochum's and Dortmund's outlines share about 0.1 km² where they touch; a
scooter there is in both feeds and counts once, as every scooter does that
two feeds list. A reply near a border lists the nearest scooters of every
town, not only the one asked about: on 22 November one on the edge between
Dortmund's area and Bochum's listed 18 of Dortmund's and 10 of Bochum's, and
one between Essen's and Bochum's 6 and 8. So the collector checks that each
scooter has a city, not which: all of a reply's scooters count towards what it
vouches for, and a town shows those inside its outline.

Brindisi's area (`Brindisi`, area 1270, city 82) held no scooter on 22
November 2026: its centre's reply was empty, and a sweep that finds none
fails, so the town is left out. RideMovi's areas were found by asking the
lookup at 958 points 15 to 70 km apart over Germany, Italy and southern Norway
the same day. It returned Brindisi's and the areas above, Imperia's first
from a point at sea west of Corsica. An area that is never the nearest to any
of those points, such as a small one beside a larger one, could still be
missing.

## Requests

The initial production reader completed two sweeps (68 and 59 requests), then
its map requests returned a 118-byte AWS load-balancer HTML 403 without
Retry-After. At the same time the session still returned scooters from the Mac,
and public operating-area metadata still worked from Netcup. This points to an
edge restriction on the server's map requests; the exact quota is unknown.
Those first sweeps sent a request every 1.2 seconds.

Requests are now held to **twelve a minute** for all towns together (five
seconds apart until 8 November 2026), with a 20-second timeout, 2 MiB body
limit, no redirects and Retry-After backoff. In the 14 days to 22 November
Dresden alone was collected about 220 times, with 2 failures. A generic HTTP 403
holds requests for at least 15 minutes, preserves the token and last snapshot,
and does not request a new login. The new cache waits two minutes so a
deployment does not double the pace. Two idle sweeps run at a time.

A sweep may take **600 requests and 90 minutes**. Under the rule of 22
November a reply vouches for less than before: Dresden's sweep, 53 to 66
requests until then, took 52 and 60 that evening, in four to five minutes,
planned from where its scooters stood. The other towns' first sweeps, from no
earlier positions that evening, took 9 requests (Vicenza's 84 scooters,
Alghero's 94) to 286 (Köln's 2,450, in 49 minutes, most of them beside
München's 1,773 in 237); Bergen's 2,319 took 247, in 27 minutes. Most took
one request for every seven to ten scooters, and Lecce's one for every four
(223 in 51).
Until that evening a sweep could take an hour, which Köln's came within 11
minutes of; one that fails keeps none of its scooters. Idle sweeps run
once a day, between 08:00 and 21:00 in the town (`APP_MAP_IDLE_INTERVAL_MS`);
a map visit keeps the feed watched for two minutes. Sweeps reuse previous
positions to plan fewer requests, report completed parts progressively, and
timestamp the result at the sweep's start.

## App link

The provider opens the download link published by
[RideMovi's website](https://www.ridemovi.com/),
`https://ridemovi.app.link/ZduGyMtOD6`, with
[App Store id 1503536800](https://apps.apple.com/gb/app/ridemovi-smart-sharing-service/id1503536800).
No scooter-specific unlock link is constructed.
