# Turkish scooter app map investigation

Checked 24 October 2026 by statically inspecting the publisher-signed Android
apps and making bounded, signed-out map requests. BinBin has a working guest
map, verified in Istanbul, Antalya and Eskişehir and from Netcup. Its replies
are truncated local selections, so they cannot yet supply complete city
totals. Martı and Hop have identifiable map routes, but neither returned
vehicles without a rider session in these checks.

No production collector or country entry was added. The official apps were
also checked while signed out on an Android 15 emulator. No rider login,
SMS, registration or vehicle action was performed.

## App provenance

The APKPure downloads' base APK signatures passed Android `apksigner verify`.
Each certificate matches the package's association on a publisher domain:

| App | Package | Version / build | Publisher association |
| --- | --- | --- | --- |
| [Martı: TAG & Scooter](https://play.google.com/store/apps/details?id=com.martitech.marti) | `com.martitech.marti` | 7.8.4 / 804 | [qr.martiscooter.com](https://qr.martiscooter.com/.well-known/assetlinks.json) |
| [BinBin: Taxi & Scooter](https://play.google.com/store/apps/details?id=com.BINBIN) | `com.BINBIN` | 1278.3.6 / 40692 | [www.binbin.tech](https://www.binbin.tech/.well-known/assetlinks.json) |
| [Hop - Enjoy the city](https://play.google.com/store/apps/details?id=com.hoplagit.rider) | `com.hoplagit.rider` | 2.8.0 / 2080004 | [link.hoplagit.com](https://link.hoplagit.com/.well-known/assetlinks.json) |

Signer certificate SHA-256 fingerprints, in the same order:

- Martı: `f636df1d253768f344161b06c951bf2a813434df8b78b4f6534f5db1f9a1f044`.
- BinBin: `00322cdcce6a48f8ba36fa400fae62c503b0b5de6e567621b18ec5d0a8927294`.
- Hop: `544e46ec17bde4ecbfc8b23cabea40fa555ca9dd2cf6e4c306a0822cd12e4b47`.

APKs, decompiled code and raw live responses stay outside the repository.

## BinBin: working guest read, incomplete selection

The native client's Retrofit interface (`o7.e`) calls:

```http
POST https://gatewayapi-sp.binbinapp.com/binbin/api/v1/vehicles/list
Content-Type: application/json
User-Agent: okhttp/4.12.0

{"latitude":41.043,"longitude":29.0094,"radius":500,"vehicleTypeIds":"1"}
```

`VehicleListRequest` serializes `latitude`, `longitude`, `radius`, and an
optional string `vehicleTypeIds`. The app's normal request uses radius 500;
the scooter type is `1`, distinct from its bike and moped types. Omitting
the type filter or sending it as null also worked, but a collector must
explicitly retain scooters only.

The `GuestLogin` handler (`K5.g`) sets the local `guest_login` preference;
it makes no guest-token request. The interceptor (`o7.d`) adds
`X-Authorization` only when a stored rider token is nonempty. It also builds
`X-Language`, `X-App-Version`, `X-Device-Language`, `X-Device-Platform`,
`X-Device-OS`, and optional device id and location headers. On the Mac,
Node 26 and curl both succeeded without authorization, cookies, device id
or bootstrap; only `Content-Type` was needed in the reduced Node request.
Netcup curl succeeded with the app User-Agent and ordinary app metadata.
Netcup Python urllib's default client received HTTP 403, `error code: 1010`;
that failure does not establish a rider-login requirement.

Successful responses are JSON envelopes with `status: "SUCCESS"`,
`resultStatus: "Successful"`, and a `data` array. These point checks used
the scooter filter and 500 m radius:

| Point | Coordinates | Returned scooters |
| --- | --- | ---: |
| Istanbul, Beşiktaş | 41.0430, 29.0094 | 10 |
| Antalya | 36.8841, 30.7056 | 10 |
| Eskişehir | 39.7767, 30.5206 | 10 |
| Adana, sampled centre | 36.9914, 35.3308 | 0 |
| Ankara, sampled centre | 39.9208, 32.8541 | 0 |
| Zürich, outside the advertised service | 47.3769, 8.5417 | 0 |

These are local samples, not city totals. An empty centre-point request
does not establish that an operator has left a city.

The Istanbul point returned the same 10 vehicles at radii 500 and 1,000 m,
all within about 224 m. At radius 100 m it returned four. Moving the centre
about 222 m north returned 10, with six shared ids: the union held 14
distinct scooters inside the original 500 m radius. This demonstrates
truncation; increasing the radius alone does not retrieve all scooters.
No pagination or result-count parameter exists in the inspected app
request model. Ten is the observed ceiling, not a documented API guarantee.

Vehicles expose `vehicleId`, `plate`, coordinates, `vehicleTypeId`, battery,
`status`, `statusReason`, `statusTs`, `distance`, `maxRideTimeAsMinute`,
`defaultAreaId` and optional campaign data. The app maps the returned list
directly to its map model and ignores the status fields. Live samples
included status values 3 and 7; their availability semantics remain
unverified. `distance` is distance from the search point, not riding range.
`statusTs` must not be treated as a last-position timestamp; its meaning
is unverified, and some values were from the preceding day. The sampled
list provided no ride price.

Before integration, establish a collection strategy with an acceptable
request budget and measured coverage, availability semantics and freshness.
A deduplicated grid might improve coverage, but these checks do not prove
that it can produce a complete fleet snapshot. The operator's
[locations page](https://www.binbin.tech/lokasyonlar/) also lists Balkan
markets; their current app data has not been checked here.

## Martı: map and phone flow traced, access still blocked

The scooter map lives in the native Kotlin part of this combined app;
the Flutter binary largely covers TAG driver functionality.
`RiderMainApiService` (decompiled as `p227nc.b`) declares
`POST /map/listAvailables`. Its interceptor (`p100fe.a`) prepends
`/v13/scooter/dispatch` to the configured rider host, producing:

```http
POST https://customer.martiscooter.com/v13/scooter/dispatch/map/listAvailables
Content-Type: application/json

{"latitude":41.043,"longitude":29.0094,"minPointLatitude":41.033,"minPointLongitude":28.9994,"maxPointLatitude":41.053,"maxPointLongitude":29.0194,"zoomLevel":15,"vehicleTypes":[]}
```

The coordinates, zoom and vehicle-type list are defined by
`ListAvailablesRequest`. The startup builders also send the current
latitude and longitude with all four bounds set to zero, zoom 16 or 18,
and vehicle types `[1,2,3,4]`. `MartiVehicleTypes` identifies scooter as 1,
e-bike as 2, moped as 3 and Mobilet as 4. These are request contracts from
the APK, not a successfully retrieved vehicle list.

The current bootstrap begins by fetching images and base64-decoding their
EXIF `ImageDescription`. Both checked images,
[`marti_default_page-0001.jpg`](https://d2ohz7o7aejcmt.cloudfront.net/operator-icons/marti_default_page-0001.jpg)
and [`bos-marti.jpeg`](https://d2ohz7o7aejcmt.cloudfront.net/operator-icons/bos-marti.jpeg),
point to
[`/operator/index.txt`](https://d1sygrhnji9maa.cloudfront.net/operator/index.txt).
That file is base64 JSON; `passenger.mm_api` is
`https://customer.martiscooter.com`. The current `BaseUrlModel` reads this
nested schema. The plain `/index.txt` used in the earlier check is only
the fallback and has an older, flat schema. The interceptor's APK fallback
host is `https://customer.pss101.com`. Following the image bootstrap
therefore corrected the configuration flow but did not reveal a different
live rider host.

The interceptor requires a stored token for this map route and sends it
as `X-ACCESS-TOKEN`. The route is absent from `AUTH_FREE_ENDPOINTS` in
`com.martitech.network.utils.g`; without a token the app throws
`No access token found` before sending it. Headers also include the app's
User-Agent, `platform: And`, `user-type: 2`, `timezone`, `vendor-id`,
`Accept-Language`, and a random `X-REQUEST-ID`.

The configured host returned HTML HTTP 403 for both the map request and
the explicitly auth-free `/app/getConfig`, from the Mac and Netcup.
The APK fallback host returned the same responses on the Mac. HTTP/1.1,
TLS 1.2, complete signed-out app headers (including empty `INTEGRATIONID`
and `oneSignalId`), and a normal Chromium same-origin POST all received
the same `server: awselb/2.0` rejection. A geographic restriction is not
established by these checks. Login alone is not proven sufficient to
resolve the HTTP blocker.

The separate public
[`passengerConfig.json`](https://everest-config-files.martiscooter.com/passengerConfig.json)
does load without authorization. Its guest-booking flags concern TAG
bookings; they do not establish a guest scooter map. On the Android 15
emulator, the genuine APK displayed onboarding but then stopped at
**"Invalid installation source. This app can only be installed from
official stores."** This did not verify the live scooter API with the
official Android transport. An official-store installation is needed for
that comparison; a newly created rider account does not remove this local
installation check.

The supported phone flow is statically traced:

- `POST /customer/signin`: `mobilePhoneCountryCode` without `+`, the
  national `mobilePhone`, `oneSignalId`, and optional delivery `type`.
- `POST /customer/validatePhone`: `mobilePhoneCountryCode`, `mobilePhone`,
  `smsCode`, delivery `type` (`sms` or `whatsapp`), and optional
  `socialToken`. The UI collects a four-digit code. The verified reply's
  `accessToken` is saved for subsequent `X-ACCESS-TOKEN` requests.
- A separate `/customer/socialSignin` accepts provider, identity token,
  raw nonce and notification id; it is not a guest sign-in.

The map response classes define `data.response` as a list with `code`,
`batteryPercentage`, coordinates, `statusId`, `lastUpdateTime`,
`vehicleType`, unlock and minute prices, and reservation/incentive fields.
Availability, timestamp and price units still need a live response checked
against the app. No fleet count or phone login was verified.

## Hop: exact map and SMS flow traced; phone login required by the app

The official [hoplagit.com](https://hoplagit.com/) download link targets
the investigated package. A second, ARM64 variant of the same 2.8.0 build
2080004 was obtained from APKPure's variant download link. Every base and
split APK signature verifies and matches the publisher signer above.
The downloader's ARM64 option had returned an ARM32 archive; the native
library's ELF architecture was checked independently.

The ARM64 build uses Dart 3.13.5 and the newer `_kDartSnapshotData` /
`_kDartSnapshotText` format. A compatible object-pool dump plus direct
ARM64 instruction references established the actual request builders.
The main host remains `https://api.hoplagit.com`.

```http
GET https://api.hoplagit.com/v1/scooters:nearby?lat=41.043&lng=29.0094&r=500
```

The exact query names are `lat`, `lng`, `r`, and optional `vehicle_type`.
The scooter filter value is `scooter`; the bike value is `ebike`. The
earlier `latitude` / `longitude` / `distance` probe did not reproduce this
builder. The client sends `accept-language`, a `hop-rider/` User-Agent
derived from its stored device information (fallback `hop-rider/()`),
and Bearer authorization from a stored rider token.

`GET /v0/config` succeeds without login from the Mac and Netcup and
returns Turkish configuration (`currency: "TRY"`). Its
`verification_required: false` flag does not establish anonymous map access.
The exact nearby query above still returned HTTP 403 JSON
`{"code":3,"msg":"Forbidden."}`, including with `hop-rider/()` and
`accept-language: en`. Changing to the native app User-Agent did not grant
guest map access.

The Android app was also opened on a fresh, signed-out installation with
its virtual location set to the sampled Istanbul point. Skipping the
introductory pages and handling the notification/location prompts led to
**"Welcome to hop!"**, a phone field and **"Next"**, with text requiring
a phone number to log in. No guest-map control appeared on that screen.
The phone field was left blank.

The native login sequence is:

1. Run Prelude's mobile SDK `dispatchSignals` and obtain a dispatch id.
2. `POST /v1/auth:reqSMS` with JSON
   `{"phone":"<international phone>","prelude_dispatch_id":"<SDK result>"}`.
3. `POST /v1/auth/token` with JSON
   `{"phone":"<same phone>","code":"<received code>","grant_type":"sms","source":"riders"}`.
4. Store the issued rider credentials privately and use the access token
   for the map. The refresh builder sends `grant_type: "refresh_token"`
   and the stored `refresh_token` to the same token route.

The SMS builder awaits the Prelude dispatch before calling Hop; an SDK
failure is not treated as a successful SMS request. A plain HTTP-only login
is therefore not established. No dispatch id was fabricated, and no SMS
was sent. An `anonymous` grant check returned HTTP 400 naming
`grant_type`, without issuing a token; the earlier `anonymous` binary
string did not establish a guest OAuth grant. Validating the `sms` grant
with no phone/code also returned 400, as expected, without creating an
account. A rider account remains the supported route to test next; no
authenticated map or fleet size has been verified.

The vehicle parser names `id`, `code`, `battery`, `remaining_mileage`,
`coord`, `fare`, and `vehicle_type`; the coordinate parser uses `lat` and
`lng`, and the fare parser includes `preauth`, `per_minute`, and `unlock`.
Units, availability, freshness and completeness must be checked against
an authenticated response before collection.

### Public zones and parking need no account

The app also reads two working static files:

- [`prod.json`](https://storage.googleapis.com/temphop/prod.json): GeoJSON
  with 1,675 polygon features on 24 October 2026, last modified 22 October:
  1,595 `noPark`, 79 `region`, and one `service` feature. Properties include
  `zoneType` and `region`; there are 22 nonempty region labels spanning
  Turkey, Greece and Montenegro, including Istanbul's separate areas.
- [`park-prod.json`](https://storage.googleapis.com/temphop/park-prod.json):
  578 parking records using `ID`, `LAT` and `LONG`.

These supply map boundaries and parking points, not current scooter
positions, availability or proof that a region is operating. They do not
replace the authenticated live map or justify city fleet totals. The
published MDS root `https://api.hoplagit.com/mds/` returned 404 and did not
provide a live alternative.

The earlier `gbfs.heyhop.app` 404 is not evidence about this app's map.
[`heyhop.app`'s association](https://heyhop.app/.well-known/assetlinks.json)
names `com.heyhop.app`, a different Android package. The investigated
`com.hoplagit.rider` signer is associated with `link.hoplagit.com` and
`link.hop.bike`.
