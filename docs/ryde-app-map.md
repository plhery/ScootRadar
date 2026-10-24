# Ryde rider map investigation

Checked 24 October 2026 against the official Android `com.ryde_android`
6.1.0, build 718. APK signatures match the publisher's
[app-link association](https://www.ryde-technology.com/.well-known/assetlinks.json).
No authenticated map retrieval, collector, catalog addition or deployment
has been completed.

## Deferred and how to resume

Deferred at the user's request on 24 October 2026. The emulator is rejected
before phone verification; further SMS attempts on that setup have no new
evidence to justify them. Request signing has been reproduced, but a working
rider session and authenticated response decryption remain unverified.

Resume with the official app on a physical Android phone that meets Ryde's
device-integrity requirements, using a number available at that time. First
confirm that login reaches code entry and completes. Then verify read-only
map retrieval, response decryption and session renewal before considering a
collector. A successful phone login alone does not establish that its session
can be used by a server.

The `ScootRadar_Ryde_Play` AVD is retained for reference. Verified APKs and
private diagnostics are kept outside Git; the local provider-auth progress
note records their locations. Bolt's saved rider session is separate.

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

No OTP has been accepted and no rider session has been obtained. No ride,
reservation, payment or support message was initiated. Signing was a solved
part of this investigation; current authentication and response decryption
remain open work.
