# JET, Whoosh, Beam and LUUP app map investigation

Checked 24 October 2026 by statically inspecting the Play-distributed Android
apps of JET (two apps), Whoosh, Beam and LUUP, and making bounded, signed-out
requests from the Mac, from 15:44 to 16:12 Paris time. None of the five maps
returns vehicles signed out: each needs a rider account, and none offers a
guest session. No account was created, no SMS code was requested, and no
collector or country entry was added. Each app got a few dozen requests at
most.

| App | Vehicle route | Signed-out reply | Sign-in | Beyond the rider token |
| --- | --- | --- | --- | --- |
| JET's Go Jet (Brazil, Chile, Mexico, Georgia, Azerbaijan) | `GET api.gojet.app/api/v1/geo/transports` | 401 `GW-21`, "Request signature validation failed" | Phone and SMS code | Every request is signed with a key compiled into the app; the code also has an App Check header |
| JET (Kazakhstan, Georgia, Uzbekistan, Mongolia) | `GET service.jetscooters.fun/gatewayclient/api/v6/transports` | 401, `WWW-Authenticate: Bearer` | Phone and SMS code, the request behind an hCaptcha | None found |
| Whoosh | `POST api.whoosh.bike/client/devices/searches` | 401 `{"message":"Unauthorized"}` | Google or Apple outside Russia | None found |
| Beam | GraphQL `vehiclesByH3` at `gateway.ridebeam.com/query` | 200 with an `Unauthorized` error | Phone and SMS code, or Google, Apple, Facebook, Kakao or Microsoft | Its SMS request is signed, and its login probably checks an encrypted fraud header |
| LUUP | `GET mobileApiDBReader-ports/by-location` on LUUP's Cloud Functions | 403 `Forbidden` | Phone and SMS code | None on the port reader |

Some signed-out reads do answer: Beam's zones, region list and parking-spot
counts, Whoosh's region configuration, and the port list on LUUP's website,
which has positions but no availability.

## App provenance

APKPure's downloads passed Android `apksigner verify`, each base APK carries
a verified Google Play source stamp (stamp certificate
`3257d599a49d2c961a471ca9843f59d341a405884583fc087df4237b733bbd6d`), and each
signer is listed in its publisher's app-link association.

| App | Package | Version / build | Built with |
| --- | --- | --- | --- |
| [Go Jet](https://play.google.com/store/apps/details?id=com.gojet.app) | `com.gojet.app` | 1.3.35 / 691 | Flutter |
| [JET](https://play.google.com/store/apps/details?id=com.jetscooters) | `com.jetscooters` | 2.7.0 / 2070 | Kotlin, Urent's white-label app |
| [Whoosh](https://play.google.com/store/apps/details?id=com.punicapp.whoosh) | `com.punicapp.whoosh` | 4.1.0 / 420790 | Kotlin, Retrofit |
| [Beam](https://play.google.com/store/apps/details?id=com.escooterapp) | `com.escooterapp` | 2.67.0 / 296145 | Flutter |
| [LUUP](https://play.google.com/store/apps/details?id=sc.luup.luup) | `sc.luup.luup` | 1.137.0 / 265 | Kotlin, Retrofit, Firebase |

Signer certificate SHA-256 fingerprints:

- Go Jet: `17b31605da0ff37489d5ca4e8dbb33002a138d900e7614e8144831f35cc58b8f`,
  listed at [q.gojet.app](https://q.gojet.app/.well-known/assetlinks.json)
  and store.gojet.app.
- JET: `1e31a4aff60c3a4cea1b77f47affb0429641e9561cb95da14b98009c5b61fb28`
  (`CN=Jet`), listed at
  [jet.onelink.me](https://jet.onelink.me/.well-known/assetlinks.json) and
  ure.su.
- Whoosh: `12607a1082202feafaa03ac22a3814f9ec770d731d87c667ce9fca7b164f6bae`
  (`CN=Whoosh.Bike`), listed at
  [wsh.bike](https://wsh.bike/.well-known/assetlinks.json) and
  whoosh.app.link.
- Beam: `f2c78f9b084934097ed94126c015b4fe2f59f3711fec5e8a51479370dd220fea`,
  listed at
  [deeplink.ridebeam.com](https://deeplink.ridebeam.com/.well-known/assetlinks.json).
- LUUP: `ce327697ada44adc52bff6b4df747a57ef1824e80ce3f8e3d59bb7850d544c9a`,
  listed at
  [deeplink.luup.sc](https://deeplink.luup.sc/.well-known/assetlinks.json)
  and ride-your-city.luup.sc.

Beam's 2.66.3 and LUUP's 1.136.0 carry the same certificates, and LUUP's
the same routes.
APKs, decompiled code and raw live responses stay outside the repository.

## JET

JET runs two apps on two backends. Both serve Georgia, Batumi among its
towns.

### Go Jet: every request signed

`com.gojet.app` serves Brazil, Chile, Mexico, Georgia and Azerbaijan: about
69 regions in its code, most of them Brazilian, plus Santiago and Temuco,
Mexico City and San Pedro Garza García, Batumi and Kobuleti, and Baku. Its
API is `https://api.gojet.app/api/v1/`: `geo/transports` and
`geo/transports/clusters/` for vehicles, `geo/zones`, `geo/cities` and
`contents/configs`. Sign-in is `auth/opt/phone/send` and its verification
step, with a bearer token renewed at `token/refresh`. The phone picker lists
206 codes; those with city data are Brazil, Chile, Mexico, Georgia,
Azerbaijan, Kazakhstan, Mongolia and Uzbekistan.

A browser-shaped request gets Cloudflare's challenge (403,
`cf-mitigated: challenge`), which is what earlier checks saw. The app's
`Dart/… (dart:io)` user agent passes Cloudflare, and the gateway behind it
then checks the request itself. Live at 16:11:

- no `X-App-Version`: 400 `{"code":"GW-18"}`;
- version 691 and a timestamp in seconds: 401 `GW-22`, "Request timestamp
  validation failed";
- a timestamp in milliseconds and a wrong signature: 401 `GW-21`, "Request
  signature validation failed".

So every request, signed in or not, carries `X-Timestamp`, `X-Signature`,
`X-App-Version` and `X-Device-Id`. The decompiled Dart code computes the
signature as an HMAC-SHA256 over the request, with a key compiled into the
app, and also has an `X-Firebase-AppCheck` header (Play Integrity); whether
the gateway checks it wasn't reached. A rider token is not enough here: a
collector would have to reproduce the app's signature, and perhaps its
attestation.

### JET in Central Asia: a bearer token only

`com.jetscooters` is Urent's white-label app (its code is `ru.urentbike`,
and it sends `UR-Brand: JET`). Its store listing names Kazakhstan (Almaty),
Georgia (Tbilisi, Batumi), Uzbekistan (Tashkent) and Mongolia
(Ulaanbaatar). Its gateway, behind QRATOR, is
`https://service.jetscooters.fun/gatewayclient`:

| Route | Data |
| --- | --- |
| `GET /api/v6/transports?latitude=&longitude=&radiusByMeters=&zoom=&withEBikes=true` | Vehicles around a point (also `useBluetooth=false`, `includeEmptyParkings`) |
| `GET /api/v6/transports/polygon` | Vehicles in an area |
| `GET /api/v3/zones/rent`, `/api/v5/zones/general`, `/api/v3/zones/lowspeed/` | Zones |
| `GET /api/v1/parkings/` | Parkings |
| `GET /api/v1/cities`, `/api/v1/cities/by_coordinates` | Cities |

Requests carry `UR-*` headers (brand, version, client id, device id,
session, country code) and `Authorization: Bearer …`, with no request
signing. `POST /api/v2/mobile/code` sends the SMS code, with an hCaptcha
token; `POST /api/v1/connect/token`, with `grant_type=password`, the phone
number as user name, the code as password and the app's client credentials,
returns the token.

Signed out, `/api/v1/cities`, `/api/v6/transports` and
`/api/v5/zones/general` answered 401 with an empty body and
`WWW-Authenticate: Bearer`, the same bare and with the app's headers (15:50;
`cities` again at 16:11). Whether one account sees all four countries is
untested.

## Whoosh

One package serves Russia and Whoosh's other markets. Its API is
`https://api.whoosh.bike` (AWS API Gateway, us-east-1), the host of its
private GBFS.

The map is `POST /client/devices/searches` with:

```json
{"clientSearchDevicesParams": {"visibleArea": {"upperLeft": {"lat": -33.42, "lng": -70.66}, "bottomRight": {"lat": -33.46, "lng": -70.62}}, "regionIds": ["<region id>"], "type": ["scooter"]}}
```

It answers `{"devices": [...]}`; in the app's model a device has `id`,
`code`, `state.status`, `state.position`, `battery.power`,
`battery.distanceToCharge` (range) and `model`. Zones and parkings come from
`GET /regions/location/{regionId}/areas`, `/functional-areas` and
`/parkings`, and the region list from `/regions/active`. Requests carry
`X-Id-Token` and `X-Auth-Token` from an AWS Cognito session
(cognito.whoosh.bike), plus a static `X-Api-Key`, `X-Client: android`,
`X-Client-Version`, `x-client-uuid` and `X-region-id`.

Signed out, only `GET /regions/config?lat=&lng=` and `/health` answer.
From 15:49 to 15:51, `regions/config` answered with or without the API key
for Santiago (`SCL`), São Paulo (`GRU`), Medellín (`MDE`), San Pedro Garza
García and Monterrey (`SPR`), Mexico City (`MMMX`) and Almaty (`ALA`);
Lima's answered `regionUndefined: true`. Belarus wasn't checked. The search
answered 401 `{"message":"Unauthorized"}` bare, with the app's headers and
without the key, twice; `regions/active` and `areas` did too.

The region configuration turns phone sign-in off in Latin America
(`isPhoneAuthAvailable: false`) and Google and Apple sign-in on; phone codes
and Russian bank logins are the Russian route. One Cognito pool serves every
region outside Russia, so one account should reach them all (read in the
code, not tested). The app pins its TLS certificates but has no Play
Integrity, SafetyNet, App Check or request signing.

## Beam

Beam's Flutter app talks to one GraphQL endpoint,
`POST https://gateway.ridebeam.com/query`, whose introspection is open. The
map reads vehicles in H3 resolution-8 cells around its centre:

```graphql
query VehiclesByH3($indexes: [String]!) {
  vehiclesByH3(indexes: $indexes) {
    id code formFactor longitude latitude batteryLevel vehicleType imei vehicleModel
  }
}
```

The server also accepts an `isNeuron: Boolean` argument, which the app never
sends. The app sends `Authorization: Bearer <JWT>`,
`user-agent: escooterapp/2.67.0; android`, `deviceId`, `latitude`,
`longitude` and location-accuracy headers, and `compulsaryxy`: the device id
and a FingerprintJS fingerprint, AES-encrypted with a key in the app.

Signed out at 15:52, `vehiclesByH3`, `vehicle`, `vehicleByCode` and
`partnerVehiclesByH3` answered HTTP 200 with
`{"errors":[{"message":"Unauthorized",…}],"data":null}`, bare, with the
app's headers and with a made-up token. Other reads answer without a token:

- **Zones:** `geoFences`, placed by the `latitude` and `longitude` headers,
  returned 13 zones with GeoJSON polygons around Darwin. Styles are
  `OPERATING`, `NO_PARKING`, `SLOW`, `NO_GO` and `PARKING_WITH_FINE`.
- **Regions:** `geofenceByIds` lists 3,830 entries, among them 286 cities
  and 19 countries, many of them test or retired entries.
- **Parking spots:** `parkingSpotsByH3` gives each spot's position, its
  `currentVehicles` and its ideal count. The counts only cover scooters
  standing in spots:

| City | Spots | Scooters in spots |
| --- | ---: | ---: |
| Brisbane | 480 | 521 |
| Darwin | 200 | 425 |
| Kuala Lumpur | 367 | 214 |
| Cairns | 25 | 183 |
| Adelaide | 127 | 123 |

They were identical at 15:55 and 15:59, and 66 spots had changed by 16:09.
Batches of about 1,365 cells or 3,000 ids sometimes got a 503; 500 cells
were fine.

Beam's site lists Australia (12 towns, Darwin and Adelaide among them),
Malaysia (13 states), South Korea (about 37 cities), Türkiye (Ankara,
Antalya, Muğla), Indonesia (9) and the US (Albuquerque, Tulsa). Bangkok,
Queenstown, Taupō and Whangārei are in its region list. Brisbane's entry is
tagged `neuron`, and Neuron's Canadian towns and Newcastle (UK) are now Beam
regions, though Newcastle's 270 spots and Calgary's one held no scooter.
Whether a signed-in `vehiclesByH3` includes Neuron's fleets, with or
without `isNeuron`, is untested.

The map is behind a sign-in guard, with no guest token. Sign-in is a phone
number and SMS code (`requestPhoneNumberVerification`, then
`loginWithPhoneNumber`), or Google, Apple, Facebook, Kakao or Microsoft. It
returns an `authToken` JWT and a `refreshToken`, renewed by
`refreshToken(userId, refreshToken)`. The SMS request carries a SHA-256
signature salted from the app's bundled settings, and the server's settings
say `FraudProtectionAtLoginRequiresValidFraudData: true`, so a scripted login
would probably need a valid `compulsaryxy`; neither was tested. No Play
Integrity, App Check, SafetyNet or reCAPTCHA was found.

## LUUP

**Signed-in follow-up:** the user has since completed phone verification.
The port reader and session renewal work from the cache runtime, and the
collector now supports 19 Japanese cities. See [the integration and private
configuration](luup-app-map.md). The signed-out findings below remain the
original investigation.

LUUP's app reads Firebase project `luup-prod` through
`https://asia-northeast1-luup-prod.cloudfunctions.net/`, with only
`Authorization: Bearer <Firebase ID token>`:

| Route | Data |
| --- | --- |
| `GET mobileApiDBReader-ports/by-location?lat=&lng=&radiusInMeter=` | Ports around a point, the radius from the map view |
| `GET mobileApiDBReader-ports/by-port-id?portId=`, `ports/{documentId}` | One port |
| `GET mobileApiDBReaderV2-areas?type=1&type=4&type=5&type=6&type=22&type=40` | Zones: `{type, cityId, vertexes}` |

A port has `portId`, `name`, `location`, `cityId`, `isAvailable`,
`maximumDeviceCount`, `returnableDeviceCount`, opening hours, `portType`,
and separate counts of scooters (`availableKickboardCount`), e-bikes
(`availableCycleCount`) and seated scooters (`availableSeatboardCount`).
LUUP is station-based like PubliBike: a vehicle's position and battery
appear only during a ride. Zone types are 1 for the service area, 4, 5 and 6
for e-bike, scooter and seated-scooter bans, 22 for speed limits and 40 for
no parking. Port details (`mobileApiPort-detail`) and the city list
(`mobileApiCity-listCities`) are Firebase callable functions.

From 15:50 to 15:58, the port and zone routes answered 403 `Forbidden` with
no token or a made-up one, the callables 401 `UNAUTHENTICATED`, and
Firestore's REST API, for `cities`, `ports` and `devices` with the app's
API key, 403 `PERMISSION_DENIED`.

Sign-in is Firebase phone authentication with an SMS code; the picker lists
228 codes, and whether a code reaches a non-Japanese number is untested. The
app has no anonymous sign-in. Its Firebase libraries attach App Check (Play
Integrity) to callables, Firestore and sign-in, but not to the port reader,
and it pins no certificates. A collector would trade the session's Firebase
refresh token at `securetoken.googleapis.com` for an ID token that lasts an
hour.

**Website:** `GET https://luup.sc/wp-json/luup/port-map-data` returns a
string that the page's `map_drawer.js` decrypts with CryptoJS AES-256-CBC,
under a fixed key and IV written in the script. Decrypted without running
the script, it lists 17,626 ports with a name and position each, and no id
or availability; it is cached for about an hour, and two fetches six
minutes apart were identical. By nearest city centre: Tokyo 8,249, Osaka
2,548, Kyoto 1,499, Nagoya 1,224, Kawasaki 947, Yokohama 546, Sendai 516,
Fukuoka 470, Hiroshima 418, Kobe 287, Utsunomiya 218, and eight smaller
cities (Takamatsu, Hamamatsu, Sapporo, Kitakyushu, Tsu, Naha, Onojo,
Okazaki) with 22 to 165 each.

NAVITIME has shown LUUP's ports and live availability since February 2024
([Impress Watch](https://www.watch.impress.co.jp/docs/news/1567359.html));
that route wasn't looked into.

## What a sign-in would take

Each map but Go Jet's would answer with one rider account, as Bolt's does
([its evidence](bolt-app-map.md)): the user signs in once in the unmodified
official app, and a collector keeps the session's renewal credential
privately. What each would add, outside Russia:

| App | Account | Would add |
| --- | --- | --- |
| JET (Central Asia) | Phone and SMS code | Almaty (about 22,500 scooters, JET over 70%), Ulaanbaatar (3,000+), Tashkent, Tbilisi and Batumi |
| Whoosh | Google or Apple | Chile (8,000+), São Paulo, Curitiba, Florianópolis, Medellín (about 400), Monterrey and San Pedro Garza García, Mexico City, Almaty |
| Beam | Phone and SMS code, or Google or Apple | Malaysia (5,500+), Australia, Thailand, Indonesia, New Zealand, South Korea, Türkiye and two US towns |
| LUUP | Phone and SMS code | Japan's ports, with counts of scooters, e-bikes and seated scooters |

Go Jet, with most of JET's Brazilian fleet and its Chilean and Mexican ones,
needs its request signature reproduced even with an account, so it isn't a
plain HTTP read. Once signed in, each still needs checking: whether a
non-local phone number is accepted, whether one account reaches every
country, response caps, liveness between polls, and whether Netcup gets the
same answers as the Mac.
