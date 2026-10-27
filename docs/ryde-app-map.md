# Ryde rider map investigation

Checked 24 and 27 October 2026 against the official Android `com.ryde_android`
6.1.0, build 718. APK signatures match the publisher's
[app-link association](https://www.ryde-technology.com/.well-known/assetlinks.json).
The user subsequently signed in with Apple on an iPhone and on this Mac.
The official Mac-compatible iPhone app opens its map and has a successful
authenticated map response in its local HTTP cache. Independent response
decryption, fresh automated retrieval, collection and deployment remain
unverified.

## Current status and how to resume

Deferred at the user's request on 24 October 2026 and resumed at their
request on 27 October. The emulator is still rejected before phone
verification. Request signing has been reproduced, but a working rider
session could not be obtained there. The user completed Apple sign-in on a
physical iPhone and reported that its map opens. They then installed the
official app on this Apple silicon Mac and completed Apple sign-in there;
its signed-in map was observed through native UI automation.
No additional SMS was requested during the 27 October recheck.

Continue with the signed-in Mac app and its own Ryde keychain entries.
Verify fresh read-only map retrieval, response decryption and session renewal
before considering a collector. A successful app login alone does not
establish that its session can be used by a server.

The `ScootRadar_Ryde_Play` AVD is retained for reference. The fresh verified
APK, decompiled sources and private diagnostics are under
`~/.cache/scootradar/rider-auth/ryde/`, outside Git. Bolt's and Bird's saved
rider sessions are separate.

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
non-exportable-key conclusion to these iOS entries. Local macOS
authentication is needed to continue the scoped key export.

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

These are verified client paths and observed server configuration, not a
live test of an authenticated session's enforcement. The iOS key handling,
actual server rejection conditions and any supported off-device session
remain to be checked. A real-device map read is the next compatibility
test, followed by key binding and renewal; do not promise that one phone
login will produce a portable bearer token.

## Public sources rechecked on 27 October

Entur's GBFS 3 manifest still lists the same sixteen Ryde systems. The
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
missing Bergen, Drammen, Larvik or Kristiansand markets. No new public
source or production feed was added in this recheck.

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
