# RideMovi Dresden rider map

Verified on 1 November 2026 using RideMovi's official Android 5.2.0 app
(`com.ridemovi.app`) and a dedicated rider account. The Node cache reads the
same map API at `https://api.ridemoviapp.com`. Dresden is the only enabled
RideMovi city; this is an unofficial authenticated integration.

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
`data.showNearbyBikes: true`. The array is `data.nearbyBikes`.

The endpoint returns at most **30 nearest scooters**. Changing `areaLimit`
from 1 through 100 to 1000 left those scooters unchanged: that parameter
controls parking/restriction arrays. A western view held 29 scooters while
other scooters existed nearby, so **an underfilled reply is not a complete
city or evidence of a fixed search radius**. Each reply certifies only as far
as its last scooter, with a 1% plus 5 m margin and an upper bound of 5 km.
An empty, hidden, malformed, unsorted, wrong-city or unresolved clustered
reply fails the sweep, rather than establishing an empty city.

The reviewed outline is `Dresden_OPS`, area `1286`, city `86`. Its polygon was
returned anonymously by
`GET /bike/operationArea/getNearestOperationArea?vehicleType=escooter` at
51.0504, 13.7373. `data/ridemovi-areas.json` retains its outer ring in lat/lon
order, rounded to seven decimal places. The collector reuses `nearestSweep`
to cover that ring, including sparse edges; all returned scooters contribute
to coverage checks before positions outside the outline are discarded.

The cold audit took **68 requests, 81 seconds**, and found **682 scooters
inside the operating polygon**, with no unresolved cells. Replies held 1–30
scooters. Across overlapping views, 599 scooters were observed repeatedly at
identical positions; none was missing inside another reply's certified radius.
The production collector then completed a separate cold sweep from the Netcup
container: 683 scooters, all with battery and range, in 68 requests and 81
seconds. These counts describe the audits, not future fleet availability.

Only the verified scooter types `SN1` (Ninebot) and `SO1` (Okai) are accepted;
the app identifies e-bikes as `E1`. Every vehicle must match the requested
city, have a unique positive id and valid coordinates, and have an ascending
distance consistent with its position. Battery is `bikePowerBatteryStatus.soc`
in percent; range is `estimatedTravelDistanceInKM`, converted to metres.
Unavailable or implausible battery/range stays unknown. QR numbers, lock ids,
battery hardware identifiers and account data are not published.

The initial production reader completed two sweeps (68 and 59 requests), then
its map requests returned a 118-byte AWS load-balancer HTML 403 without
Retry-After. At the same time the session still returned scooters from the Mac,
and public operating-area metadata still worked from Netcup. This points to an
edge restriction on the server's map requests; the exact quota is unknown.

Requests are now paced at least **five seconds apart**, with a 20-second timeout,
2 MiB body limit, no redirects, a 300-request / 15-minute sweep budget and
Retry-After backoff. A generic HTTP 403 holds requests for at least 15 minutes,
preserves the token and last snapshot, and does not request a new login.
The slower cadence has not yet been verified through a sustained production run.
The new cache waits two minutes so a deployment does not double the pace.
Idle sweeps run every two hours; a map visit keeps the feed watched for two
minutes. Sweeps reuse previous positions to plan fewer requests, report
completed parts progressively, and timestamp the result at the sweep's start.

## App link

The provider opens the download link published by
[RideMovi's website](https://www.ridemovi.com/),
`https://ridemovi.app.link/ZduGyMtOD6`, with
[App Store id 1503536800](https://apps.apple.com/gb/app/ridemovi-smart-sharing-service/id1503536800).
No scooter-specific unlock link is constructed.
