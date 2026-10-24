# LUUP rider map

Japan's LUUP feed reads the authenticated map of the unmodified official rider
app, `sc.luup.luup` 1.137.0. The user signed in by phone and SMS on 24 October
2026. The prior [app investigation](jet-whoosh-beam-luup-app-maps.md#luup)
records the verified publisher certificate and the signed-out refusals.

## Data and coverage

`server/luupApp.ts` reads
`GET https://asia-northeast1-luup-prod.cloudfunctions.net/mobileApiDBReader-ports/by-location`
with `lat`, `lng`, `radiusInMeter` and a Firebase ID token in `Authorization`.
The radius is limited to 100,000 metres. No App Check header or request signing
was needed on this reader, including from Netcup's Node cache runtime.

The app returns ports with separate `availableKickboardCount`,
`availableCycleCount` and `availableSeatboardCount`. Only standing scooters
become vehicles. Each count produces that many markers at its port, with
stable `system:station:port:ordinal` ids, unknown charge and range, and no
per-vehicle rental link. These are station counts, as with PubliBike, rather
than observed individual vehicle identities.

`data/japanese-scooter-feeds.json` reviews 19 cities: Tokyo, Osaka, Kyoto,
Nagoya, Kawasaki, Yokohama, Sendai, Fukuoka, Hiroshima, Kobe, Utsunomiya,
Takamatsu, Hamamatsu, Sapporo, Kitakyushu, Tsu, Naha, Onojo and Okazaki.
Tokyo combines the app's `shibuya` and `tokyo-east` regions; Osaka combines
`osaka` and `yodogawa`. Bounds enclose the app's service-area polygons, with a
small margin. A circumscribed circle covers each complete city in one read.
The reader returns an oversized geohash neighborhood: an 800 m Shibuya read
reached 2,476 m, so results are filtered by reviewed LUUP city ids and bounds,
and deduplicated by port id. Responses are bounded to 32 MiB; malformed data
fails the collection instead of replacing a good snapshot with an empty map.

Ports marked unavailable are excluded. Opening and closing hours are evaluated
in Japan time. Where holiday hours differ, only their intersection with normal
weekday hours is shown, because no holiday calendar is available. Ambiguous
overnight schedules are hidden conservatively. Private campuses, resorts and
other special-purpose regions are not included. Saitama's sampled ports had
no standing scooters and are not included in this reviewed catalog.

The normal scheduler collects idle cities every 20 minutes and watched cities
every minute. Starts on LUUP's host are at least one second apart, including
renewals. HTTP 429 respects `Retry-After`; failed authentication backs off for
a minute, and a rejected ID token gets one renewal and retry.

The zone reader returned 200 zones, whose completeness has not been established.
Zones and parking guidance are therefore not published by this collector.

## Private configuration

Configure these as **runtime-only Coolify secrets on the Node cache**:

- `LUUP_REFRESH_TOKEN`: the user's Firebase phone-auth refresh token.
- `LUUP_FIREBASE_API_KEY`: LUUP's Firebase client API key.

Neither value belongs in a catalog, Git, a build argument, a public Worker
variable, or a `NEXT_PUBLIC_` variable. No phone number, SMS code, profile or
payment data is required by the collector. Examples contain names only.

ID tokens last about an hour. The collector exchanges the refresh token at
Google's [Secure Token endpoint](https://firebase.google.com/docs/reference/rest/auth#section-refresh-token),
caches the ID token in memory and renews a minute before expiry. Concurrent
city reads share one renewal. If Google rotates the refresh token, it is
saved atomically as mode 0600 in `/data/luup-session.json`, alongside the
persistent snapshot (`LUUP_SESSION_PATH` overrides the path). A digest of the
runtime seed ties this saved rotation to its login, so a replacement secret
supersedes the previous login. Exceptions and logs contain status codes only,
never upstream authentication bodies or request URLs containing the API key.

If the session is revoked, sign in again with the official app, replace
`LUUP_REFRESH_TOKEN` in Coolify and let the normal CI-gated deploy restart the
cache. The Android emulator does not need to remain running.

## Verification on 24 October 2026

The signed-in reader and Google's session renewal returned HTTP 200. Shibuya's
290-port sample changed at ten ports in 56 seconds, from 371 to 372 scooters;
Osaka's initial sample returned 789 ports and 1,034 scooters. A complete
19-city sweep returned 17,430 reviewed ports and 19,737 available scooters
before opening-hour filtering; these are observations, not expected totals.
A separate check in a temporary Node 26.12.1 container on Netcup renewed the
session and collected 12,154 Tokyo scooters without App Check. The compiled
parser accepted all 19 saved city samples, retaining 19,637 scooters after
opening-hour filtering. APKs, raw responses and login credentials stay outside
the repository.

Tests cover renewal and rotation across restarts, concurrent readers, token
rejection and rate limits, secret-safe failures, response limits, full-city
request coverage, geographic and vehicle-type filtering, stable station ids,
closed ports, opening hours and collector wiring.
