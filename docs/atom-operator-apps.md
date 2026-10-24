# Other ATOM operator apps

Checked on 24 October 2026, after the [Qick integration](atom-app-map.md).
Eight additional brands have a verified native map route, but none returned
scooters without a rider login. No fleet is enabled from this investigation:
an HTTP 401 establishes an access requirement, not an empty or inactive fleet.

## Candidates and access results

The places below come from the operators' listings and existing
[coverage research](coverage-gaps.md). They are potential coverage, not a
measurement of today's fleet. Each app's anonymous settings request returned
HTTP 200 and `multi_account_flow=false`; its map request returned HTTP 401
`Unauthorized Access` with the app's own public configuration and no rider
authorization.

| Brand | Potential coverage | Verified Android package | Version checked | Map probe |
| --- | --- | --- | --- | --- |
| [Zippy](https://play.google.com/store/apps/details?id=zippy.app) | Langebaan, South Africa | `zippy.app` | 10.80 | Langebaan |
| [Reby Mobility](https://play.google.com/store/apps/details?id=reby.mobility.app) | Dakar, Senegal | `reby.mobility.app` | 10.80 | Dakar, near Almadies |
| [wer2 Scooter](https://play.google.com/store/apps/details?id=wer2.ride.app) | Doha, Qatar | `wer2.ride.app` | 10.70 | Doha |
| [IZZY](https://play.google.com/store/apps/details?id=izzy.app) | Tashkent, Uzbekistan | `izzy.app` | 10.80 | Tashkent |
| [Silk Road Samarkand](https://play.google.com/store/apps/details?id=silk.road.samarkand.app) | Samarkand tourist complex, Uzbekistan | `silk.road.samarkand.app` | 10.80 | Tourist complex east of Samarkand |
| [IslaRide](https://play.google.com/store/apps/details?id=isla.ride.app) | Tenerife, Spain | `isla.ride.app` | 10.80 | Costa Adeje |
| [MoVe Scooter Rental](https://play.google.com/store/apps/details?id=move.mobility.app) | Halifax and Dartmouth, Canada | `move.mobility.app` | 10.80 | Halifax |
| [e-moob](https://play.google.com/store/apps/details?id=e.moob.app) | Tamarindo, Costa Rica, and Aruba | `e.moob.app` | 10.80 | Tamarindo |

Zippy, Reby, wer2 and IZZY are useful next candidates for countries with no
current scooter source. South Africa and Senegal also need an Africa catalog
entry if an available live fleet is verified. MoVe could add Halifax/Dartmouth
to Canada, and IslaRide could fill Tenerife gaps. The e-moob
[operator case study](https://www.atommobility.com/blog/how-e-moob-became-arubas-leading-scooter-operator)
describes both Aruba and Costa Rica; neither market's present availability was
established by the login-only response. Follow the existing coverage notes
before enabling Aruba.

IZZY's [website](https://www.izzy.city/en) also links `city.izzy.rent`, a separate
1.2.0 Android package with `https://app.izzy.city` as its backend. That package
does not use the ATOM route, and the backend did not resolve during this
check. This is a conflicting distribution lead, not evidence that IZZY has
left ATOM: `izzy.app` 10.80 has the publisher's matching certificate and its
ATOM settings are live. The current
[iPhone listing](https://apps.apple.com/us/app/izzy-kicksharing-service/id6742253992)
also names SIA ATOM Tech.

## Artifact identity

IslaRide, wer2, Reby and Silk Road Samarkand were downloaded directly from
Google Play using an anonymous Aurora download session through
[apkeep](https://github.com/EFForg/apkeep/blob/master/USAGE-google-play.md).
MoVe, Zippy, IZZY and e-moob came from APKPure. Android `apksigner verify`
accepted all eight base APKs, and every signer matched its package's
publisher-hosted Android app association. The downloaded apps were inspected
statically; no new emulator or app installation was needed.

| Package | Publisher app association | Signer SHA-256 |
| --- | --- | --- |
| `zippy.app` | [zippyride.app.link](https://zippyride.app.link/.well-known/assetlinks.json) | `E24005BB0237130F3A9C02E6F1C429E12FF2FE24723589CC6879F5679AB8A1B5` |
| `reby.mobility.app` | [rebymobility.app.link](https://rebymobility.app.link/.well-known/assetlinks.json) | `666759B7579569F473334FDF78DFE56F5C11810D37EE619A559B36F63F1C193E` |
| `wer2.ride.app` | [wertworide.app.link](https://wertworide.app.link/.well-known/assetlinks.json) | `E6C625DF1D33B77339E1209508A4FCD7E1A93BF834A421376750A926A461782C` |
| `izzy.app` | [rideizzy.app.link](https://rideizzy.app.link/.well-known/assetlinks.json) | `B6E7708D88303B7A30A26AD7EA8F6051722CA61272CFE7D1091C96184907D283` |
| `silk.road.samarkand.app` | [silkroadsamarkand.app.link](https://silkroadsamarkand.app.link/.well-known/assetlinks.json) | `57053311EFDD46708826268158A6BF291DBD1E4195EA9874B9554B47786CCB16` |
| `isla.ride.app` | [islaride.app.link](https://islaride.app.link/.well-known/assetlinks.json) | `7D206DA100AFCD314B8D9510234DDF2D0DE069E373B1EA8A71A6DB8072C8F7E5` |
| `move.mobility.app` | [move-mobility.app.link](https://move-mobility.app.link/.well-known/assetlinks.json) | `3335AFC47B0C60E24791F52C894E725F19F6CD58F0F91084C0898C7F9B255A94` |
| `e.moob.app` | [e-moob.app.link](https://e-moob.app.link/.well-known/assetlinks.json) | `195DD908F8B981E17891A5B5FFB0A144DAF78086D020F2FD2540F685D8BC73A8` |

The older mirror copies of Reby 10.05 and Silk Road Samarkand 9.50 returned
`update_required=true`. They were replaced for the final checks with Google
Play's 10.80 builds, whose settings no longer require an update. The wer2
10.70 build supplied by Google Play also returned `update_required=false`.

## Request and integration handoff

All eight apps use `https://app.rideatom.com/api/v1/`. Their native request
builders supply the app's `Static-App-Public-Key`, the selected
`App-Public-Key`, `device-id`, `device-os`, `device-os-version`, `app-version`,
`Language` and `Accept: application/json`. Extracted client configuration and
raw replies are retained privately, outside the repository.

The read sequence is the same as Qick's:

1. `GET user/app/settings` with `device_os=ANDROID`, `device_os_version`,
   `app_version`, and `allow_switch_account=true`. Use the returned selected
   public key if present. A successful settings reply does not grant map
   access.
2. `GET user/vehicles` with `user_latitude`, `user_longitude`,
   `user_location_timestamp` in epoch seconds, and `fleet_id=0`.
3. For an authorized rider session, the native client sends
   `Authorization: Basic <base64(riderToken + ':')>`. This step has not been
   verified for these eight operators. No Qick token was sent to them.

The settings do not expose a cross-brand account selector. Reby and wer2
explicitly enable Google and Apple sign-in, and Silk Road Samarkand enables
Apple sign-in. ATOM describes these as
[alternatives to phone verification](https://www.atommobility.com/blog/sign-up-made-easy-atom-mobility-adds-apple-and-google-login-options),
including signup without verifying a phone number. Reby is therefore a
candidate for access without a new test number; a Google or Apple identity
is still needed, and its complete sign-in flow has not been exercised.
MoVe and Zippy's settings do not enable those alternative buttons; their
available native sign-in is the phone/SMS flow. Reby also
enables document verification in settings; whether it restricts map access
after login remains unverified.

The next step is a user-authorized rider sign-in for a chosen brand, using
its own app configuration. Phone sign-in may request a human-completed
CAPTCHA and SMS code. No SMS request or new account was created during
this investigation. Keep any resulting credentials in the private ATOM
session bundle described in the Qick guide.

After sign-in, verify actual available electric scooters, operating bounds,
viewport completeness, movement and production-network access before adding
catalog entries. Qick's measured 2 km response radius must be checked for
each new brand. Use the existing shared request queue and credential loader;
do not add a parallel unpaced collector or treat an authorization failure as
an empty map.
