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
A port read may take 90 seconds, a renewal 30. Tokyo's read, the whole city
in one circle, takes 25 to 30 seconds from Netcup, and Kawasaki's and
Yokohama's over 20. With a 30-second limit, 21 of Tokyo's 28 reads in the
three hours to 04:30 Japan time on 30 October 2026 were cut off, and its
scooters left the map for 37 minutes (SCOOTRADAR-CACHE-5Y). LUUP rents all
night; it was not a pause.

The zone reader returned 200 zones, whose completeness has not been established.
Zones and parking guidance are therefore not published by this collector.

**Kyoto's Kamo River.** The banks of the Kamo and Takano rivers are closed to
rented scooters by the prefecture, not by LUUP, so the map shows no zone
there. Kyoto Prefecture's Kamo River Ordinance (京都府鴨川条例) bars
motorised vehicles from them (article 16), with a fine of up to ¥50,000
(article 32), and the prefecture's
[page on its rules](https://www.pref.kyoto.jp/kamogawa/1200551321365.html)
says: "電動キックボードは原動機付自転車に分類されますので、乗り入れは禁止です"
(e-scooters count as motorised bicycles, so riding them in is banned). The
area, bridges and roads aside, is the Kamo from below Takahashi bridge to
the Hiiragino weir and from below Tsūgaku bridge to its confluence with the
Katsura, and the Takano from below Uma bridge to the Kamo. Public zones may be drawn, credited to their publisher, but the
prefecture publishes no geometry: its page has schematic PDFs only, and the
maps of record are kept for inspection at its River Division and the Kyoto
Civil Engineering Office (read on 29 October 2026). So the map doesn't draw
the area; the prefecture's page names it.

**Nagoya's no-parking zones.** The City removes e-scooters left in its
no-parking zones (自転車等放置禁止区域), standing ones among them, and
charges ¥5,000 to give one back. Sakae is one whole area; others run along
the streets around Nagoya Station and other stations. The City publishes them
only as a picture (Sakae's) and as a PDF map for each ward, with no
coordinates, and its site asks for the City's leave before its content is
reused. Its open-data catalogue (CC BY 4.0) holds no parking or scooter
dataset (read on 29 October 2026). So the map doesn't draw them.

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
