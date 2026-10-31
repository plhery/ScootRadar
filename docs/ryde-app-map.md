# Ryde map readers and rider app investigation

**Ryde's scooters in Bergen are on the map since 28 October 2026**, from
the map Skyss's travel app shows signed out. The scooter cache reads it with
[`server/skyssApp.ts`](../server/skyssApp.ts), as the system
`ryde_no_app_bergen`: a round of the whole city found 4,733 scooters in 30
requests on 27 October, and 4,679 in 27 at midnight. See
[the production reader](#the-production-reader).

Ryde's own authenticated API remains a separate, unfinished path. Its
Mac-compatible iPhone app opens its signed-in map, but exporting the keys
needed for independent proofs and decryption has not succeeded.

Checked 24 and 27 October 2026 against the official Android `com.ryde_android`
6.1.0, build 718. APK signatures match the publisher's
[app-link association](https://www.ryde-technology.com/.well-known/assetlinks.json).
The user subsequently signed in with Apple on an iPhone and on this Mac.
The official Mac-compatible iPhone app opens its map and has a successful
authenticated map response in its local HTTP cache. Independent retrieval and
decryption through that direct rider API remain unverified; Skyss's guest
route below needs neither that session nor its keys, and the direct API is
needed only for Ryde's towns Skyss does not show.

## Current status and how to resume

Deferred at the user's request on 24 October 2026 and resumed at their
request on 27 October. The emulator is still rejected before phone
verification. Request signing has been reproduced, but a working rider
session could not be obtained there. The user completed Apple sign-in on a
physical iPhone and reported that its map opens. They then installed the
official app on this Apple silicon Mac and completed Apple sign-in there;
its signed-in map was observed through native UI automation.
No additional SMS was requested during the 27 October recheck.

Bergen is covered through Skyss since 28 October 2026, at the user's request
of 27 October, and Larvik through Entur's `rydelarvik` since 31 October. The
direct rider route, for Drammen, Kristiansand and Göteborg, still requires independent proof generation, response decryption
and session-renewal tests. A successful app login alone does not establish
that its session can be used by a server.

The `ScootRadar_Ryde_Play` AVD is retained for reference. The fresh verified
APK, decompiled sources and private diagnostics are under
`~/.cache/scootradar/rider-auth/ryde/`, outside Git. Bolt's and Bird's saved
rider sessions are separate.

## Skyss's guest map: Skyss / Tet / Ruter

Skyss's [official travel information](https://www.skyss.no/reise/nyttig-reiseinformasjon/)
and [app FAQ](https://www.skyss.no/en/tickets-and-prices/buying-tickets/appen-skyss/questions-and-answers-about-the-skyss-app/)
describe its Bergen scooter map. Its [Google Play listing](https://play.google.com/store/apps/details?id=no.skyss.planner)
lists finding e-scooters separately from signed-in functions. The inspected
Android package, `no.skyss.planner` 7.102.0 / 40013, contains the current
query and client headers. `apksigner verify` succeeds and reports a Skyss
signer; an independent publisher fingerprint from `skyss.no` could not be
obtained because its app-link association returned 403. The APK was inspected
statically and was not installed or executed.

`POST https://cosmo-router.transhub.io/graphql` accepts these ordinary client
headers without a cookie, API key, rider token, DPoP proof or attestation:

| Header | Inspected value |
| --- | --- |
| `client-platform` | `android` |
| `client-version` | `7.102.0` |
| `client-build-date` | `1790928393` |
| `owner-id` | `SKYSS` |
| `accept-language` | `en` |
| `Content-Type` | `application/json` |

The initial request without client metadata returned HTTP 400 with
`Missing required header: client-platform`. Adding the app's observed
metadata returned real service and map data. No private runtime key from the
app is used or committed.

`mobilityServices_v2` with the Skyss owner confirms `BERGEN`, `RYDE`,
`ESCOOTER`, `NORMAL_SERVICE` and `DEEP_LINK`. The map query is:

```graphql
query nearbyEVehicles(
  $northWest: LocationInput!, $southEast: LocationInput!,
  $vendors: [Vendor_v2!]!, $rentalProductTypes: [RentalProductType!]!
) {
  nearbyVehicles_v4(
    vendors: $vendors, northwest: $northWest, southeast: $southEast,
    rentalProductTypes: $rentalProductTypes
  ) { __typename id vendor lat lon type }
}
```

Inputs use `{ latitude, longitude }`, vendors `["RYDE"]`, and product types
`["ESCOOTER"]`. The result has `VehicleDetailsLite` rows with 15-digit IDs.
Map rows lack battery, range, rentability and a provider position timestamp.
The reader preserves those unknowns; its scan times are observation times.

A separate `vehicleDetails_v2(vehicle: { id, vendor: RYDE })` read matched a
map ID and coordinates exactly, reported the Bergen Ryde service and a
rental link on `new-web-platform.ryde.vip`, and returned `isRentable: true`,
battery and range. A same-shape unknown ID returned null with a
`BAD_USER_INPUT` / `No vehicle found with ID` error. This verifies an actual
overview/detail identity relationship, rather than trusting HTTP 200 alone.

### Limits and the live audit

- One central view, south/west/north/east
  `60.375,5.29,60.405,5.355`, returned exactly 500 scooters. Treat 500 as
  capped even though the reply supplies no truncation flag or total.
- At 23:25 local time on 27 October, the reader confirmed the service, read
  that parent view and four smaller views, and returned 1,055 distinct
  observations in six requests / 10.1 seconds. It retains valid parent
  observations when smaller views omit them.
- A fresh run at 23:32 returned 1,053 observations in six requests / 10.1
  seconds. Its map pages held 500, 292, 324, 155 and 282 rows. Between scans,
  1,046 IDs persisted, nine disappeared and seven appeared; three persistent
  scooters changed position by more than 50 m, one by about 1.05 km. Thus
  the source is updating, although no per-position timestamp or guaranteed
  freshness is available.
- Of 500 earlier parent-view references, 497 appeared in that scan, 494
  within 10 m. All three missing references still had unchanged positions
  and `isRentable: true` in separate detail reads. A tiny local map read
  recovered one; the other two remained absent from map reads. Therefore
  an uncapped reply is **not proof of inventory completeness**, and detail
  rentability is not sufficient to explain current map membership. The
  cause, including possible differing cache ages, remains unverified.
- The radius-based `nearbyVehicles_v3` returned only 150 rows despite a
  requested limit of 1,500. It is not an established completeness shortcut.
- A sweep of the whole municipality, `60.17,5.14,60.54,5.60`, quartering
  each box of 500, found 4,718 scooters in 29 requests just before midnight
  on 27 October, between 60.284 and 60.489 north and 5.177 and 5.395 east.
  The central view had held about a quarter of the fleet.
- A box of fewer than 500 lists the whole box: three of 480, 481 and 495
  rows, and a wide one of 246, were read again with their four quarters,
  which together listed at most one scooter more, one that had moved.
- The router pads a box: 31 of the wide box's 246 rows stood outside it,
  and one of the 480's. The research reader rejected any such reply.
- Of 16 scooters spread over one round, read one by one with
  `vehicleDetails_v2`, all could be rented, with 33 to 93% charge and none
  moved more than 4 m. The map seems to list only scooters that can be
  rented.
- The map's id is the scooter's IMEI: the detail read's rental link carries
  it as `deviceIMEI`, as Ryde's Entur feeds' links do.
- Neither the `RUTER` nor the `SKYSS` owner shows Ryde's Oslo scooters, which
  Entur's feed lists: Skyss's map serves Bergen alone.
- `RUTER` service metadata lists Oslo and its surrounding Ryde areas. The
  gateway rejects `AGDER` as an unsupported owner; it explicitly names only
  `RUTER` and `SKYSS`. Central map probes for Drammen, Larvik, Kristiansand
  and Göteborg returned empty arrays, with no GraphQL errors. Those markets
  remain gaps; nearby Entur data is not evidence of their coverage.

### The production reader

Since 28 October 2026 the scooter cache reads Bergen with
[`server/skyssApp.ts`](../server/skyssApp.ts). Each round asks for the
service list, and fails if Skyss lists no Ryde scooter service in `BERGEN`;
a service it calls `TEMPORARILY_UNAVAILABLE` has no scooter to rent, and is
not swept. It then cuts the system's bounds, `60.275,5.165,60.495,5.405`,
into six boxes, quarters each box of 500 down to about 250 m, and fails past
120 requests or on a reply with an error, another vendor or type, or a
broken row. Rows outside their box are left out, as a neighbouring box
lists them. Requests go one a second, those nearest where people look first,
every two hours while nobody looks and every minute while someone does, as
the other app maps' (`APP_MAP_IDLE_INTERVAL_MS`). A 429 holds the reader off
for at least a minute.

The map gives no battery, range or position time, so the scooters show no
charge, and the observation time is the round's first request. The IMEI is
neither stored nor shown: a scooter's id is a hash of it keyed by the process,
`skyss:` and 16 characters, which changes when the cache restarts. Its card
links to `new-web-platform.ryde.vip/app/ios.html` or `android.html`, Ryde's
link without the IMEI, as its Entur feeds' are once their query is dropped
([rentalLinks.ts](../src/lib/rentalLinks.ts)); both pages answer and open
Ryde's app or its store. It replaces the research reader of 27 October.

Skyss's [terms of use](https://www.skyss.no/en/help-and-contact/terms-and-privacy/terms-of-use-for-services/),
updated 2 December 2024, say that tickets or data Skyss makes available must
not be copied, transferred, traded or distributed in any way, and forbid
reverse engineering its software. They name no scooter or vehicle position.
The map's credits name Skyss.

## Apple sign-in and the Mac-compatible iPhone app

[Ryde's App Store listing](https://apps.apple.com/no/app/ryde-always-nearby/id1495605028)
supports Apple silicon Macs. The installed official app is
`com.ryde.NewRyde` 6.1.0, build 260983. This is the App Store iPhone app
running directly on macOS, rather than an iOS Simulator build.

A private snapshot of the app's HTTP cache contains
`POST https://api.ryde.vip/appRyde/getNearScootersNew`, HTTP 200 and JSON
status 200. The form contains `token`, `cityId`, `iotLa`, `iotLo`,
`nearRadius`, `userDevice`, `timestamp`, `timeSign` and `ekt`. Its headers
include `Authorization: DPoP …`, an ES256 `DPoP` JWT and
`Ryde-API-Security-Version: 2`. The proof carries `ath`, `htm`, `htu`,
`iat` and `jti`. The response's `key` is an ECIES envelope with
`alg: ECDH-ES+A256GCM`, `epk`, `iv`, `data` and `ekt`.
The app log records successful decryption of `key`.

The initial map was around Zürich, outside the investigated Ryde markets;
this cached successful response does not establish a nonempty fleet in a
missing city or a fresh independent retrieval. Replaying its older proof
from this Mac returned HTTP 403 / `DPOP_PROOF_INVALID`; removing the proof
returned HTTP 403 / `DPOP_REQUIRED`. The first test does not isolate proof
expiry from replay rejection. These tests establish live proof enforcement
for this session, rather than merely the presence of client code.

Keychain Access exposes two Ryde application-password entries under the
app's own service: `Ryde.apiSecurity.dpopSigningKey.production.v1` and
`Ryde.apiSecurity.eciesKeyAgreementKey.production.v1`. Their contents and
off-device usability remain unverified. Do not apply the Android
non-exportable-key conclusion to these iOS entries. Key export failed:
macOS logs show `CSSMERR_DL_OPERATION_AUTH_DENIED` during the attempts.
The user reported that Local Items reveals or copies no value despite its
password dialog closing without a visible error. They are using screen
sharing; whether that explains the denial remains unverified. No key was
exported, and no keychain password or security setting was changed.

Raw cache snapshots, session headers and diagnostics are private under
`~/.cache/scootradar/rider-auth/ryde/mac-session/`, outside Git. No proxy
certificate, network proxy or global security setting was changed.

## Recheck: model spoofing, attestation and session keys

The 27 October APK download is still 6.1.0 / 718. `apksigner verify`
succeeded; its SHA-256 certificate fingerprint,
`2F:A2:63:91:05:5F:24:B6:0D:94:8A:03:23:A2:93:83:0A:C6:0F:45:38:DE:F1:E8:BC:2B:FA:7E:42:88:13:D9`,
matches the publisher's app-link association. This recheck found additional
requirements in that same build; it does not establish a new server rollout.

A controlled replay of the public time request changed only `MobileType`:

| MobileType | HTTP result |
| --- | --- |
| `Android/Google/sdk_gphone64_arm64/google` | 403, non-JSON |
| `Android/Google/Pixel 7/google` | 200, JSON status 200 |

This reproduces the simple model-header blocker. It was a host-side
diagnostic replay, not a modified emulator, a successful login or a device
integrity verdict. No emulator properties, app signature, Google verdict
or account identity were changed.

The successful time response still advertises `deviceBlacklistMode: 1`,
`playVerdictRequire: "DEVICE"`, `attestFailPolicy: 1`,
`playIntegrityDegraded: 0`, `secUpgradeMode: 2` and a
`dpopMigrationDeadline` of `2026-09-21 00:00:00`.
Changing the model header does not establish that these subsequent checks
will pass. Google's [integrity-verdict documentation](https://developer.android.com/google/play/integrity/verdicts)
describes `MEETS_DEVICE_INTEGRITY` as a certified physical-device verdict,
with hardware-backed boot evidence on Android 13 and newer. Its separate
virtual-device verdict is for Google Play Games on PC. A model string does
not supply that signed evidence.

The app also offers Google sign-in. In the unmodified retained emulator,
tapping it reached the same failed `getTimeService` prerequisite before
the Google credential picker. Static tracing shows that Google login and
SMS both request `/appRyde/getAttestChallenge`. When a nonempty challenge is
returned, the client obtains a Play Integrity token and passes it to the
login request. Google sign-in is therefore not evidence of a route around
the configured device requirement.

There is also a session-portability requirement beyond obtaining an SMS:

- The Android client creates a P-256 signing key in `AndroidKeyStore`, under
  the alias `com.ryde_android.dpop.signing.v1`. It signs an ES256 DPoP proof
  for each token-bearing first-party request. Proof claims bind the HTTP
  method, URL and token hash, with issuance time and a unique request ID.
  Copying the token does not copy that non-exportable signing key.
- Map reads are in the encrypted-response set. They add an encryption-key
  identifier (`ekt`); the parser handles an ECDH/HKDF/AES-GCM envelope and
  the older AES fallback. On Android 12 and newer the key manager prefers
  an AndroidKeyStore decryption key, with a software-key fallback in code.
- Session registration and rotation have their own endpoints,
  `/appRyde/registerDpopKey` and `/appRyde/rotateSessionKey`. Registration
  also obtains an attestation challenge. Successful login does not prove
  registration, rotation or off-device map decryption.

These Android checks establish client paths and server configuration, rather
than authenticated Android enforcement. The subsequent Mac session confirms
live DPoP enforcement for its iOS token, as described above. Access to its
keys, independent decryption and renewal remain unverified; do not promise
that one phone login will produce a portable bearer token.

## Public sources rechecked on 27 October

Entur's GBFS 3 manifest still listed the same sixteen Ryde systems then
(it has listed `rydelarvik` too since 31 October 2026 at the latest). The
discovery URLs for `rydebergen`, `rydedrammen`, `rydelarvik` and
`rydekristiansand` return 404. Entur GraphQL recognizes
`YRY:Operator:Ryde`: a control in Oslo returned vehicles from `rydeoslo`,
while a 15 km Bergen query returned none. Queries around Drammen and
Larvik returned vehicles from existing Asker and Sandefjord feeds,
respectively, rather than new systems; a nearby result is not evidence of
coverage of the requested town.

The old anonymous route in [WoBike's Ryde notes](https://github.com/ubahnverleih/WoBike/blob/master/Ryde.md),
`qw-test.ryde.vip/appRyde/getNearScooters`, returned JSON status 407 to the
published unsigned request. The current production map route did the same
without signing. This supplies no working anonymous read; it does not
replace the earlier signed-request authentication result below.

Ruter's [published operator coverage](https://ruter.no/flere-transporttilbud/sykkel-og-elsparkesykkel/operatorer)
lists Ryde around Oslo and Asker/Bærum/Lillestrøm/Lørenskog/Rælingen, not the
missing Bergen, Drammen, Larvik or Kristiansand markets. This Ruter/Entur
recheck did not reveal them. The separate Skyss owner later supplied the
Bergen guest map described above; no production feed was added.

## Map protocol and the earlier signing blocker

The app defines `POST https://api.ryde.vip/appRyde/getNearScootersNew`, with
form fields `token`, `iotLa`, `iotLo`, `nearRadius` and `cityId`. An interceptor
adds a millisecond `timestamp` and `timeSign`.

The initial incomplete request returned HTTP 200 with JSON status 407 and
an instruction to install the latest app. This was not enough to conclude
that the map could not be automated. The native key/IV decode routines and
the Java request-signing sequence were subsequently reproduced. A signed
Bergen map request with an empty token reached the authentication check and
returned HTTP 200 with JSON status 401, `Token is invalid.` The old production
`getNearScooters` path returned HTTP 404.

In that inspected build, signing substitutes the timestamp into a resource
template, encrypts with AES/CBC/PKCS5 padding, encodes with Android's default
Base64 formatting and trims it, then takes MD5. Decoded constants, APKs and
raw diagnostics stay outside the repository.

The nearby response model carries encrypted `key`/`key2` fields. Its parser
supports an ECIES envelope and an older AES fallback; the actual format
returned after a successful current login remains unverified. The decrypted
static model has separate scooter and e-bike arrays with coordinates and QR
codes. Battery, range and an independent position timestamp are absent from
that nearby model. Availability, identity stability and completeness still
need a live authenticated check.

## Actual sign-in attempts

The unmodified app requires sign-in before showing its map. Its country
selector includes Indonesia, `+62`; a country being listed does not establish
that the backend will send or deliver an SMS to every number there.

The first Indonesian attempt on the existing Google APIs emulator returned
to sign-in without reaching code entry, and the user received no SMS. That
emulator's `com.android.vending` package was a system `LicenseChecker` stub,
version 1.8, rather than the full Play Store. Ryde's Standard Integrity log
reported that it could not bind to the verification service.

A separate AVD was then created from Google's official Android 35
`google_apis_playstore` ARM64 revision 9 image. It has the full Google Play
Store and its Integrity services. Ryde's log confirmed a successful service
connection and warm-up callback. The same publisher-signed app was installed
with its required ABI and density splits. An Indonesian attempt in this
environment still failed before code entry, displaying:

> An error has occurred. Please contact our support.

The German comparison also returned to sign-in without code entry, and the
user received no SMS. Country selection did not explain these failures.

Tracing `LoginMainActivity` identified an earlier prerequisite: phone login
first fetches `/appRyde/getTimeService`. If that returns no usable result,
the app displays its generic error before checking the number. The app's
`MobileType` header is exactly
`Android/<Build.MANUFACTURER>/<Build.MODEL>/<Build.BRAND>`.

A controlled, unauthenticated check of that time endpoint found:

| Request headers | HTTP result |
| --- | --- |
| Android app/version headers, no `MobileType` | 200, JSON status 200 |
| Same, with `X-Frame-Options: DENY` | 200, JSON status 200 |
| Same, with `MobileType: Android/Google/sdk_gphone64_arm64/google` | 403, HTML |
| Same emulator header and `X-Frame-Options: DENY` | 403, HTML |
| Change only the model in that last request to `Pixel 7` | 200, JSON status 200 |

This establishes a request-header blocker independently of phone country.
The reference-model request was a read-only diagnostic comparison, not a
successful login. Neither app/device identity nor an integrity verdict was
modified in the official client. Its public time response also reports
`deviceBlacklistMode: 1`, `playVerdictRequire: "DEVICE"`,
`playIntegrityDegraded: 0` and `attestFailPolicy: 1`. That is further evidence
that a working verification-service connection alone is insufficient;
successful device attestation and an authenticated map remain unverified.
Further country changes should not be treated as a fix for this emulator.
A real-device sign-in is the next useful compatibility test, and would not
by itself establish a portable server session.

Ryde's
[login help](https://www.ryde-technology.com/help/login-issues) asks users to
check SMS reception, the country code and the app version, but supplies no
complete list of countries supported for SMS verification. Do not describe
all country codes as verified or repeat requests indefinitely without new
evidence.

No OTP was accepted during the emulator attempts. Apple sign-in subsequently
established the app session described above. No ride, reservation, payment or
support message was initiated. Request signing and app login are solved
parts of this investigation; independent proofs, response decryption and
renewal remain open work.
