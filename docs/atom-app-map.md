# ATOM Mobility rider map

Checked 24 October 2026 using Qick Scooters for Android, package
`qickscooters.app`, version 10.80 (build 310800007). This investigation is
for operators missing from the existing ATOM GBFS integration; enabled
GBFS feeds continue to use their existing adapters. The Node cache's
`server/atomApp.ts` collects Qick's authenticated maps in Sweden and Germany.

## Coverage

The authenticated Qick account lists Sweden and Germany. Live scooters
were found in Örebro, Linköping, Norrköping, Jönköping, Eskilstuna, Falun
and Borlänge, and in Kassel, Münster and Göttingen. Stockholm, Västerås
and Trollhättan were empty and are not registered. This fills seven Swedish
and three German fleets; it does not enable every operator using ATOM.

The complete discovery sweep returned 8,148 available scooters, all with
charge, in 133 map views:

| City | Available scooters | Views |
| --- | ---: | ---: |
| Örebro | 1,079 | 12 |
| Linköping | 1,502 | 18 |
| Norrköping | 513 | 9 |
| Jönköping | 328 | 8 |
| Eskilstuna | 558 | 9 |
| Falun | 197 | 9 |
| Borlänge | 311 | 12 |
| Kassel | 1,535 | 20 |
| Münster | 1,769 | 24 |
| Göttingen | 356 | 12 |

Every city had scooters moving at least 20 metres between its initial
point check and the complete sweep: 98 such scooters among 3,834 matched
ids. These are live fleets, rather than the static or disabled vehicles
seen in some older public ATOM feeds. A single centre request had returned
only about 600 scooters in each of Örebro and Linköping.

City bounds were reviewed against the native app's operating-area cutouts,
with a small margin. Their no-go zone ids are 6567, 6570, 3797, 6582, 6584,
6583 and 3807 in Sweden, and 6231, 6232 and 6564 in Germany. The large
outer frames describe where riding is forbidden, not the service extent.
The catalogs use bounds around the inner service outlines, not those frames.
The app's zones also include other accounts' placeholder areas, so a zone
alone is not evidence of a live fleet.

## App identity

The [Google Play listing](https://play.google.com/store/apps/details?id=qickscooters.app)
names Qick Mobility AB. The APK was obtained from APKPure in the earlier
investigation. Android's `apksigner verify` verified its signature, and its
SHA-256 signer fingerprint matches the publisher's
[app-link association](https://qickscooters.app.link/.well-known/assetlinks.json):
`0D:E5:82:61:03:54:F4:4C:A0:7D:AB:07:E7:EB:99:A5:7D:55:D8:AB:30:B3:6D:C2:D2:B4:92:3B:C8:DC:85:21`.

The app is native Android. Map requests use ATOM's shared rider service at
`https://app.rideatom.com/api/v1/`, rather than each operator's
`*.rideatom.com` GBFS host. ATOM also publishes
[OpenAPI documentation](https://app.rideatom.com/api/docs), whose routes
and authorization scheme differ from the Android routes below.

## Verified requests and access requirements

The Android request builder sends `App-Public-Key`, `Static-App-Public-Key`,
`Language`, `device-id`, `device-os`, `device-os-version`, and `app-version`.
The static key identifies Qick's app; settings can select a different
account's public key. Neither is a rider login token. Keep extracted app
configuration and login credentials outside Git.

- `GET user/app/settings`: `device_os=ANDROID`, `device_os_version`,
  `app_version=10.80`, and `allow_switch_account=true`. A fresh request
  succeeds without rider authorization and returns settings, a selected
  `app_public_key`, and `multi_account_flow=true`. During this check the
  selected account's terms URL named Qick Germany; this does not establish
  Swedish map coverage.
- `GET user/vehicles`: `user_longitude`, `user_latitude`,
  `user_location_timestamp` (epoch seconds), and `fleet_id`. The native
  client's normal fleet selector is separate from the app account selector.
  Calls at Örebro with Qick's static public key and with the account key
  returned by settings both returned HTTP 401 `Unauthorized Access` when
  no rider session was supplied. With a rider session, this returns
  available scooters within **2 km** of the requested point. Adding
  `radius_in_km=10` did not enlarge that circle. The separately documented
  OpenAPI `sharing/get-vehicles` route returned 403 because it requires an
  explicitly whitelisted client IP and is not used.
- `POST user/accounts` and `POST user/accounts/closest` select an app
  account. Both use JSON bodies and also returned 401 without a rider
  session. Account discovery is therefore not proof of access to every
  ATOM operator. Closest-account requests carry `user_longitude`,
  `user_latitude`, and `user_location_timestamp`.
- `POST user/open/app` returned 401 without a rider session. It does not
  bootstrap an anonymous map session.

The native interceptor adds `Authorization: Basic <base64(token + ':')>`
only when a stored rider token is nonempty. No guest token creation was
found in this flow. Successful settings retrieval must not be treated as a
successful scooter retrieval or an empty fleet.

## Phone login

The native login flow requests an SMS at `POST user/phone/code/request`,
verifies it at `POST user/phone/code/verify`, and then calls
`POST user/login`. These requests use form bodies; the SMS requests also
carry the native client's signed `token` field. A new account takes the
separate `user/register` branch. Requesting an SMS or registering requires
the user's supplied number and authorization.

The app's country selector includes Switzerland (`41`), France (`33`),
Sweden (`46`), and other countries. Inclusion in that selector does not
prove that the server will send an SMS to a particular number.

A registration SMS request for each of the user-supplied Belarusian (`375`),
Lebanese (`961`) and Swiss (`41`) numbers returned HTTP 400: "Unfortunately,
we do not currently support this country code and numbers. (43-2/1531)".
Denmark (`45`) passed the human-completed CAPTCHA, but SMS delivery was
not confirmed. Finland (`358`) passed CAPTCHA and SMS verification, and
the authorized test account was created with the supplied name and email.
No phone numbers or credentials belong in Git. The native registration
flow is `REGISTRATION`; OpenAPI's `REGISTER` value is not accepted by this
Android route. CAPTCHA retries preserve the original signed request and
add the human-entered answer and challenge token.

The verified phone token alone was not sufficient for registration:
`user/register` also needed `name` and `email`, with app version, device
id, operating system/version and language. It returned the rider `token`.

`GET user/token/refresh?for_app_public_key=<selected-account-key>` selects
another account exposed by Qick and returns its own rider token. A Qick
login is not evidence of authorization to other ATOM operators. The tokens
observed here are JWTs without an expiry claim; they contain account/phone
information and must remain private.

## Collection and response contract

The APK's vehicle serializer defines a `vehicles` list. Vehicles have a
numeric `id`, `coordinates.latitude`, `coordinates.longitude`, an optional
`type` (`SCOOTER`, `BIKE`, `E_MOPED`, and others), optional `battery_level`,
`battery_mode`, and `is_active_ride`. The enclosing response separately
names `hidden_vehicles`, `active_vehicle_ids`, `currently_not_operating`,
and `night_mode`. Live available vehicles had `type=SCOOTER`,
`fuel_type=ELECTRIC` and `is_active_ride=false`. `reservation_minutes=5`
is the offered reservation duration, not an indication that the scooter
is reserved. Hidden vehicles are a separate list, not available scooters.

The collector covers each reviewed rectangle with a grid of 2.5 km cells:
each cell's corners remain inside its centre's 2 km map circle. Overlapping
responses are deduplicated by numeric scooter id. Hidden and active ids
from any view are excluded from the entire collection, and positions
outside the reviewed city bounds are dropped. Bikes and mopeds are
excluded. Charge is preserved; range and price remain unknown. Qick's
app link is its publisher-claimed universal link.

A failed or malformed view rejects the complete collection, leaving the
existing snapshot to expire normally rather than publishing an incomplete
count. Observation time is the start of the sweep, so later views cannot
make earlier positions appear newer. A region is skipped only when every
view reports `currently_not_operating=true`.

The native API rejected roughly a twentieth consecutive read with HTTP
429, both at 500 ms and 1.1 seconds between request starts. All accounts
therefore share a queue with **four seconds between starts**, at most
15 reads per minute, including token refresh. A 429 holds the whole client
back for at least a minute and respects a longer `Retry-After`. A cold
collection of every Qick city takes about nine minutes; simultaneous watched
cities can refresh more slowly than the scheduler's nominal one-minute
interval. Each city is still collected independently, and ATOM occupies
at most two of the collector's six slots.

The app's zone endpoint is used for the service-area audit. These app-map
systems do not advertise GBFS discovery, parking or zone documents to the
generic collectors.

## Session configuration and verification

The cache reads `/data/atom-sessions.json`, or `ATOM_SESSION_PATH`. It is a
mode-0600 JSON file, owned by the container's user, with this structure:

```json
{
  "version": 1,
  "accounts": {
    "qick-se": {
      "token": "<Sweden rider token>",
      "appPublicKey": "<selected Sweden account key>",
      "staticPublicKey": "<Qick app key>",
      "deviceId": "<login device id>",
      "appVersion": "10.80"
    },
    "qick-de": {
      "token": "<Germany rider token>",
      "appPublicKey": "<selected Germany account key>",
      "staticPublicKey": "<Qick app key>",
      "deviceId": "<login device id>",
      "appVersion": "10.80"
    }
  }
}
```

The catalog's `atomAppAccount` names one of these records. Requests use a
fixed HTTPS origin, bounded response size, a ten-second timeout and no
redirects. Credentials never enter request URLs or diagnostics. A rejected
login gets one native refresh attempt; renewed tokens are saved atomically
while preserving other accounts. An operator can replace a rejected login
without restarting the cache.

The read flow was verified from the production cache container on Netcup,
using Node 26.12.1: an authenticated Örebro request returned HTTP 200 and
604 scooters. Both account credentials are installed in its persistent
private volume, without restarting the collector. Deployment follows CI.

Unit tests cover circular viewport coverage, scooter/availability parsing,
overlap deduplication, partial-sweep rejection, account selection, credential
renewal and replacement, rate-limit backoff, response limits and sanitized
errors. Additional ATOM brands need their own verified app/account session,
coverage audit and provider entry before using the same adapter.

The [other ATOM operator app investigation](atom-operator-apps.md) records
eight more verified apps, their market leads and guest-access results.
