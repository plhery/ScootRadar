# Whoosh rider map

Integrated on 24 October 2026 with a user-authorized rider account. A Kazakhstan
phone login works; a UK phone login returned the app's generic error. Latin
American signup offers Google/Apple instead of phone login, but the Kazakhstan
session can read those markets too. The account needs no payment card to read
the map.

The catalog adds 25 reviewed regions: Brazil (9), Chile (7), Colombia (1),
Mexico (3), Kazakhstan (2), and Belarus (3). Russian regions are excluded.
Concepción and Ilhabela were listed but season-closed with no ride polygons;
they were not added. The operator's region centers sometimes lie outside its
ride polygons, so those map anchors use the nearest ride polygon instead.

## API and completeness

The verified Android app is `com.punicapp.whoosh` 4.1.0 / 420790; provenance is
recorded in [the original investigation](jet-whoosh-beam-luup-app-maps.md#app-provenance).
The Node-only adapter is [server/whooshApp.ts](../server/whooshApp.ts).

- `GET https://api.whoosh.bike/regions/active?lat=&lng=` lists regions. The
  `X-region-id` header also changes which group is returned: a Kazakhstan
  header gave Russia/Kazakhstan/Belarus; a Santiago header gave Latin America.
- `GET /regions/location/{id}/info` supplies identity, status, time zone and
  `seasonIsOver`. A closed season is a successful empty fleet, not a feed error.
- `GET /regions/location/{id}/areas` supplies ride polygons. The app's
  `MapAreaUiAssembler` uses enabled `LIMITED` polygons as holes in the global
  out-of-ride-area mask. These are the collection areas. Forbidden polygons
  alone do not define coverage.
- `POST /client/devices/searches` returns `devices`, with the request below.
  Despite the field names, the app sends southwest as `upperLeft` and northeast
  as `bottomRight`, rounded to six decimals.

```json
{"clientSearchDevicesParams":{"visibleArea":{"upperLeft":{"lat":-33.43,"lng":-70.62},"bottomRight":{"lat":-33.41,"lng":-70.59}},"regionIds":["<reviewed region UUID>"],"type":["scooter"]}}
```

The search returned zero for larger viewports even though contained small
views had scooters. A 0.05-degree view returned exactly 300. The collector
therefore covers each ride polygon's envelope with views at most 0.04 degrees
on either axis and subdivides any response of 300 or more. Disjoint polygons
do not cause a sweep of the gap between them. Duplicate scooters at shared
edges are merged. A failed view, persistent cap, unreviewed ride-area expansion,
or budget of more than 512 requests fails the whole collection; partial results
never replace the previous snapshot. HTTP-200 application errors also fail.

Positions are `state.position.point.{lat,lng}`. Battery is `battery.power`;
`battery.distanceToCharge.amount` defaults to kilometres in the app's
amount-unit mapper. The collector excludes known bike models and retains
unknown battery/range values as null. No rider profile or phone number enters
the vehicle snapshot, and no booking or ride endpoint is called.

All requests share a one-second queue, including renewals and cold starts.
Metadata is cached for an hour; 429 respects Retry-After with a bounded cooldown.
A token rejected with 401 gets one renewal/retry before authentication backs off.
Cold sweeps and watched regions can take longer than the normal minute interval.

## Private session

The cache reads mode-0600 `/data/whoosh-session.json`, owned by its Node UID
(1000). `WHOOSH_SESSION_PATH` overrides the path for local checks. Its format is:

```json
{"version":1,"clientId":"<Cognito app client>","deviceId":"<app UUID>","apiKey":"<app API key>","refreshToken":"<rider refresh token>"}
```

Keep all values in that private volume, never Git, public catalogs, browser
code, build variables, logs or fixtures. Access and ID tokens live in memory.
`POST https://cognito.whoosh.bike/` with Cognito `InitiateAuth`,
`AuthFlow: REFRESH_TOKEN_AUTH`, the client ID and refresh token renews the pair.
A rotated refresh token is saved atomically. Replacing the private seed repairs
an expired login without a cache restart after its authentication cooldown.

## Verification

Fresh automated complete sweeps on 24 October 2026 returned:

| Region | Scooters | Vehicle requests | Elapsed |
| --- | ---: | ---: | ---: |
| Santiago | 4,648 | 94 | 96 s |
| São Paulo | 2,914 | 56 | 58 s |
| Almaty, season closed | 0 | 0 | 1 s |

Every returned scooter in both live sweeps had battery and range. The seeded
production cache container also renewed the session and read 73 scooters in a
bounded Santiago view, without restarting the collector. Other catalog entries
were validated against authenticated region identity and ride-area metadata;
their live availability varies, and several were season-closed.

Unit tests cover cap subdivision, deduplication, failed-sweep atomicity,
identity/geometry validation, season closure, application errors, shared
renewal, 401 recovery and 429 cooldown. New countries are included in generated
web/iOS catalogs, credits, provider links and address search. Postal field order
and postcode patterns were checked against Google's primary libaddressinput
metadata ([Brazil](https://www.gstatic.com/chrome/autofill/libaddressinput/chromium-i18n/ssl-address/data/BR),
[Chile](https://www.gstatic.com/chrome/autofill/libaddressinput/chromium-i18n/ssl-address/data/CL),
[Colombia](https://www.gstatic.com/chrome/autofill/libaddressinput/chromium-i18n/ssl-address/data/CO),
[Mexico](https://www.gstatic.com/chrome/autofill/libaddressinput/chromium-i18n/ssl-address/data/MX),
[Kazakhstan](https://www.gstatic.com/chrome/autofill/libaddressinput/chromium-i18n/ssl-address/data/KZ)).
