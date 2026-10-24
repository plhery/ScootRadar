# Bolt authenticated rider map investigation

Verified 24 October 2026 with Bolt Android `ee.mtakso.client`, CA.230.0,
build 4390. The installed APK's signature matches the publisher's
[app-link association](https://bolt.eu/.well-known/assetlinks.json).
The user completed phone verification and registration, and authorized
testing the rider map. This investigation has not added a cache collector
or catalog entries, or deployed a Bolt integration.

## Live results

Fresh authenticated requests succeeded from the Mac:

| Requested market | Scooters | Bikes |
| --- | ---: | ---: |
| Riga | 4,087 | 92 mechanical |
| Tallinn | 4,134 | 173 electric, 97 mechanical |
| Warsaw | 5,917 | 0 |
| Ljubljana | 385 | 0 |

These are counts in individual responses, not a verified complete fleet
census. IDs were unique within each response. The returned charge values
were percentages between 15 and 100; the static model also permits hiding
the charge. No independent vehicle-position timestamp is supplied.

## Requests and response semantics

`POST https://user.live.boltsvc.net/micromobility/search/getVehicles/v2`
accepts JSON with `viewport.top_right`, `top_left`, `bottom_right` and
`bottom_left`, each containing `lat` and `lng`, plus
`should_include_style_config`. It carries a rider access token as
`Authorization: Bearer …` and Android app/device query parameters.

The verified response is `{code: 0, message: "OK", data: {categories: …}}`.
Each category has an `id` and `markers_on_map`; each marker's `vehicle`
contains `id`, `location`, `charge` and `vehicle_type`. Actual type strings
include `scooter_25`, `ebike_540` and `mechanical_bike_1220`. A collector
must distinguish scooters from both kinds of bicycle and respect
`hide_battery_charge` when present. Range, pricing and a position timestamp
are absent from these map objects.

The viewport selects the market, but does not strictly bound the returned
positions. A tiny Riga viewport still returned about 4,091 scooters across
the city. A Tallinn viewport with the query's GPS position left in Riga
returned Tallinn's categories. Do not assume the GPS query selects the
market or publish all returned positions under an arbitrary catalog region.
Before rollout, establish market identity, clipping/overlap rules and
completeness, including any response caps in larger markets.

The APK also defines `GET /micromobility/cityArea/listByPosition` for map
zones and parking. Authenticated retrieval and its response semantics have
not yet been verified in this investigation.

## Login and renewal

Signed-out map requests previously returned HTTP 401 with
`NOT_AUTHORIZED`. An ordinary sign-in in the unmodified official app
succeeded on the rootable Android emulator. Phone verification was needed;
the user completed the new account's email/name registration. No ride,
reservation or payment action was performed. Earlier concerns that the
emulator would necessarily fail app attestation were not borne out by this
successful sign-in.

`POST https://node.bolt.eu/user-auth/profile/auth/getAccessToken`, with
`Authorization: Bearer <refresh token>`, successfully minted another access
token. Subsequent map reads used that renewed token. The response contained
`access_token`, `expires_timestamp`, `expires_in_seconds`,
`next_update_in_seconds` and `next_update_give_up_timestamp`. This particular
renewal returned no replacement refresh token. The APK separately defines
`getAccessTokenWithRotation` and `rotateRefresh`; rotation has not been tested.

The observed access JWT lasts one hour and the refresh JWT about 364 days.
These observations do not guarantee a session lifetime: revocation or a
provider policy change can require another sign-in. The renewal credential
is saved privately outside the repository. A future collector should keep
tokens out of catalogs, browser/Worker bundles and logs, and save any rotated
refresh token atomically before using the associated access token.

All successful calls above ran on the Mac. The production container's
network/runtime compatibility, sustained polling, rate limits and complete
European coverage still need verification before enabling collection.
