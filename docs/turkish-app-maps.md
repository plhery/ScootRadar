# Turkish scooter app map investigation

Checked 24 October 2026 by statically inspecting the publisher-signed Android
apps and making bounded, signed-out map requests. BinBin has a working guest
map, verified in Istanbul, Antalya and Eskişehir and from Netcup. Its replies
are truncated local selections, so they cannot yet supply complete city
totals. Martı and Hop have identifiable map routes, but neither returned
vehicles without a rider session in these checks.

No production collector or country entry was added. No rider login, SMS,
registration or vehicle action was performed.

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

## Martı: map identified, HTTP access blocked

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
`ListAvailablesRequest`. The live public bootstrap at
[`d1sygrhnji9maa.cloudfront.net/index.txt`](https://d1sygrhnji9maa.cloudfront.net/index.txt)
is base64 JSON naming `https://customer.martiscooter.com` as `rider_url`.
The APK fallback is `https://customer.pss101.com`.

The interceptor requires a stored token for this map route and sends it
as `X-ACCESS-TOKEN`. The route is absent from `AUTH_FREE_ENDPOINTS` in
`com.martitech.network.utils.g`; without a token the app throws
`No access token found` before sending it. Headers also include the app's
User-Agent, `platform: And`, `user-type: 2`, `timezone`, `vendor-id`,
`Accept-Language`, and a random `X-REQUEST-ID`.

The configured host returned HTML HTTP 403 for both the map request and
the explicitly auth-free `/app/getConfig`, from the Mac and Netcup.
The APK fallback host returned the same responses on the Mac. These
failures therefore do not isolate backend authentication from HTTP-edge
filtering. Login alone is not proven sufficient to resolve the blocker.
The phone sign-in and verification routes are `/customer/signin` and
`/customer/validatePhone`; neither was invoked. No vehicle response schema
or fleet count has been verified live.

## Hop: nearby map refuses signed-out requests

The official [hoplagit.com](https://hoplagit.com/) download link targets
the investigated package. Its Flutter binary names
`https://api.hoplagit.com`, `/v0/config`, `/v1/scooters:nearby`,
`/v1/auth`, `/token`, `grant_type`, `access_token`, `refresh_token`,
`msisdn`, phone-number login text and OTP verification screens.

`GET /v0/config` succeeds without login from the Mac and Netcup and
returns Turkish configuration (`currency: "TRY"`). Its
`verification_required: false` flag does not establish anonymous map access.
`GET /v1/scooters:nearby`, including a check with `latitude`, `longitude`
and `distance`, returns HTTP 403 JSON `{"code":3,"msg":"Forbidden."}`
on both networks with the Dart User-Agent. The map query names were
suggested by binary strings; their exact serialization remains unverified
because access was refused before any vehicle payload was returned.

`POST /v1/auth/token` exists: an empty JSON request returns HTTP 400
`Incorrect field.` naming `grant_type`. This does not establish a supported
anonymous grant, a working phone login or a usable guest session. The
downloaded native split is ARM32; string extraction is weaker evidence
than a reconstructed Flutter request builder. No authenticated map was
tested, and no fleet size is known.

The earlier `gbfs.heyhop.app` 404 is not evidence about this app's map.
[`heyhop.app`'s association](https://heyhop.app/.well-known/assetlinks.json)
names `com.heyhop.app`, a different Android package. The investigated
`com.hoplagit.rider` signer is associated with `link.hoplagit.com` and
`link.hop.bike`.
