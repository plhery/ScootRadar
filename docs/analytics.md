# ScootRadar analytics

Dashboards, one website each in Umami:

- [ScootRadar](https://umami.plhery.com/websites/6e60b4ab-b4ee-4785-9699-a7f32127b358):
  the website and the web app installed on a home screen.
- [ScootRadar iOS](https://umami.plhery.com/websites/72c49567-e00d-4a92-bfaf-d1ae7b083fd8):
  the iPhone and iPad app.
- [ScootRadar Android](https://umami.plhery.com/websites/2bba24f8-8180-4616-ae0e-4bc528957c85):
  the Android app (created 28 October 2026, before its first release), tag `android`.

All three clients POST to `https://u.plhery.com/api/send`, each with its public website ID:
`6e60b4ab-b4ee-4785-9699-a7f32127b358` from the web (`src/lib/analytics.ts`),
`72c49567-e00d-4a92-bfaf-d1ae7b083fd8` from the iOS app (`ScooterAnalytics.swift`),
`2bba24f8-8180-4616-ae0e-4bc528957c85` from the Android app (`ScooterAnalytics.kt`). No
API/admin secret is shipped. The Umami admin dashboard remains protected
independently of its existing public collector. In ScootRadar, filter by **Tag**
(`web`, `pwa`) to tell a browser from the installed web app; everything in ScootRadar
iOS has the tag `ios`. Named events also carry `platform` in event data. Web page
views contain only `/map`, `/privacy`, `/accessibility` and the pages of the site, each under its own
address: the landing page of a language (`/` for English, `/de`, `/fr`, `/it`…), each
guide (`/guides/e-scooters-bristol`, `/de/ratgeber/…`) and each language's list of
guides (`/guides`, `/de/ratgeber`…). The app's screen views are `/` (the map),
`/filters` and `/settings`. Until the landing page took the root, the web map was
counted under `/`: web views of `/` before that are the map.
From the first guides on 12 October 2026 until 19 October 2026, the guides and their
lists were counted as `/map`: web views of `/map` in that week include them.
From 24 October 2026, a visit to `/` from outside the site by a browser that asks
for another of the site's languages before English is sent on to that language's
landing page and counted there: views of `/` fall and the others rise from that day.

Until 24 October 2026 the app reported to ScootRadar too, with the tag `ios`; that day
its 552 events since 8 September moved to ScootRadar iOS (Umami's database lists them
in `backup_scootradar_ios_split_20261024`). Nothing of the app is counted from Umami
3.4.0, installed on 21 October, until riders have the version after 1.0: that Umami's
bot filter (isbot 5.2) takes any user agent with "radar" in it for a bot, and up to 1.0
the app's ended in `ScootRadar/<version>`, so Umami answers `{"beep":"boop"}` and keeps
nothing. Version 1.0, on the App Store since 22 October, also still sends ScootRadar's
website ID. The version after it sends ScootRadar iOS's, with an iPhone web view's user
agent that doesn't name the app.

## Event catalog

| Flow | Events | Data |
| --- | --- | --- |
| Site | `map_open` (web) | a link to the map followed from a page of the site (the landing page, a guide, a list of guides), counted under that page's address; `result`: `city` (a city's map) or `map` (the map) |
| Lifecycle | `app_open`, `app_install` (PWA), `app_foreground` (iOS), `link_open` (iOS) | platform; for `link_open`, a scootradar.com link to the map opened in the app, `result`: `city` (a city's centre, chosen like a city in the search), `place` (another point) or `map` (no place) |
| Search | `search_open`, `search_close`, `search_results`, `search_error`, `search_select`, `search_clear`, `search_forget` | result count only (`count` web, `value` iOS); for `search_select`, `result` `recent` when it is the place chosen last time |
| Filters | `filters_open`, `provider_filter`, `providers_all`, `filters_reset`, `range_filter` | provider, enabled/result, quick/filter source (web), value (for `range_filter`, the range minimum in metres where the slider was let go on the web, or where it rested a second in the apps, 0 for Any) |
| Preferences | `settings_open`, `panel_close`, `map_style`, `zones_toggle`, `language_change`, `units_change` (web) | style (web: the appearance `auto`/`light`/`dark` or the map `calm`/`detailed`; iOS: the appearance `auto`/`light`/`dark` or the map `standard`/`quiet`/`satellite`, in `result`), whether the zones preview was turned on (`enabled`; iOS: `result` `enabled` or `disabled`), language (a code, or `auto` for Automatic, which follows the browser or the iPhone; iOS: in `result`), units (`result`: `auto`, which follows the browser's region, `metric` or `imperial`) |
| Location | `locate`, `location_result` | success/denied/unavailable |
| Map/details | `vehicle_select`, `vehicle_dismiss`, `cluster_select`, `parking_select`, `map_zoom` (web), `compass_reset` (web) | provider; zoom direction |
| Conversion intent | `directions_open`, `rental_open` | provider, vehicle/parking target; for directions on the web, `result`: `route` (drawn on the map) or `maps` (Google Maps); iOS sends it for Directions and for Open in Maps alike, without `result`; for a rental, `result` `app` when the button opens the operator's app rather than the scooter (Lime, Bird and PubliBike, whose feeds link no scooter, and Voi, Dott and Bolt from their rider maps), never whether the app is installed or opened |
| Walking routes | `route_result`, `route_arrived` | web: `success`/`no_route`/`busy`/`failed`/`too_far`; iOS: `success`/`error`/`too_far`, with provider and vehicle/parking target |
| Reliability | `refresh`, `refresh_result` (web), `data_error`, `data_expired` (web), `zones_error` (web) | generic outcome only (`success`/`error`; `timeout`/`request_failed`; for `zones_error`, `status_` and the HTTP status, or `request_failed`) |
| Price tools (iOS) | `ride_duration`, `ride_pass_change` | duration, provider; never pass expiry or financial details |
| Android test (web) | `invite_view`, `invite_open`, `invite_group`, `invite_optin`, `invite_install`, `invite_dismiss`, `invite_never` | `place`: where the invitation to test the Android app on Google Play was: `map` (the chip under the map's search bar), `guide` (the card under a guide's headline), `landing` (the landing page's Android app button) or `settings` (the map's Settings › About › Android app, which sends `invite_open` only) |
| Rating (iOS, Android) | `review_ask` | `result`: the moment the app asked for a rating with Apple's prompt, or on Android Google Play's card: `calm_map` (a fresh feed on a map left untouched 5 seconds with nothing over it, from the third day of use), or `rental_return` (back from the operator's app 5 minutes to 2 hours after **Open in**) from iOS up to 1.4.0 and Android up to 1.3.0, which asked at no other moment. None was sent up to 9 November 2026. It counts asks, not prompts shown: iOS decides whether the prompt appears, at most three times a year, and Google Play whether its card does, only so often and only in a copy of the app it installed |

Useful funnels: `app_open` → `vehicle_select` → `rental_open`, and for the guides,
a guide's page views → its `map_open` events (filter by its URL). The site's links
to the App Store send no event: App Store Connect counts them by campaign
([docs/app-store/README.md](app-store/README.md)). A rental click is
intent, not a confirmed ride. No provider callback exists to verify a booking.
Continuous map coordinates, motion/heading readings, typed searches, chosen
places and vehicle IDs are excluded.

What the events mean on the web:

- `locate` is a request to be located: Near me or the locate button, "Use my
  location" in the search, the `L` key, or "Turn on location to see walking
  time" on a card. When the page locates by itself on load, because the browser
  already has the permission, only `location_result` follows. Once a position is
  known, the page follows it; only a permission taken back is then reported, as
  `denied`, not a signal lost for a while.
- `search_select` covers a result, the place chosen last time (with `result`
  `recent`) and a "Cities with scooters" chip; `search_clear` is the × that
  removes the chosen place from the bar, `search_forget` the × that has the
  search forget the place chosen last time.
  `search_error` is a search that failed, not one the server put off for being
  one too many in a minute: that one is repeated and reports its own outcome.
- `refresh` is a tap on "Try again" where a failure is shown, and
  `refresh_result` its outcome. A tap while a request is already running is
  waited out and sends nothing. Refreshing is otherwise automatic and sends
  nothing. `data_error` is sent once when loading starts to fail, `data_expired`
  when the positions on screen are removed as out of date.
- `zones_error` is the operators' zones of an area failing to load, once each
  time an area is asked for, with the HTTP status of the answer (`status_429`,
  the minute's limit the zones share with the scooters; `status_503`, the cache
  failing) or `request_failed` where none came. A request given up as the view
  moves on sends nothing. The iOS and Android apps don't send it.
- `provider_filter` comes with `source: quick` from the chips and the desktop
  legend, and with `source: filters` and `enabled` from the Filters sheet.
  `filters_reset` is Reset in that sheet or "Show all" on the card that says
  the filters hide every scooter.
- `panel_close` closes Filters or Settings.
- `directions_open` with `result: route` is Directions drawing the way on the
  map; `route_result` follows with what came of the first request for it (a
  way found again as the walker goes is not counted). `result: maps` is the
  Google Maps link that stands in for it where the walk is over 10 km or no way
  was found. `route_arrived` is sent once a walk reaches the scooter or bay.
  Neither carries a position, a distance or the route.
- The desktop keys send the event of the control they stand for: `/` sends
  `search_open`, `+` and `−` send `map_zoom`, Esc sends `search_close` or, on a
  scooter card, `vehicle_dismiss`. A tap on the map that closes a scooter card
  sends `vehicle_dismiss` as well.
- The `invite_*` events follow the invitation to test the Android app
  (`src/lib/playTest.ts`, sent from 3 November 2026): `invite_view` is the
  chip, a guide's card or the landing page's button shown, once a page for each
  place; `invite_open` opens its three steps; `invite_group`, `invite_optin` and
  `invite_install` are each step's link followed (join the testers' group,
  become a tester on Google Play, install); `invite_dismiss` is × or "Not now",
  which hides it for a week, and `invite_never` "Never show" or "Don't ask
  again". They count links followed, not testers: Play Console counts those.
  The chip and the card are shown on Android only. The landing page's button,
  on Android only until 9 November 2026, is from then on shown on every page but
  an iPhone's (5d537745), computers included, so `invite_view` with
  `place: landing` jumps that day. It is neither shown nor counted where the
  browser says it runs an Android older than 12, on which the app does not
  install.
- Not sent at all: opening the location help, closing a parking bay's card, the
  ride length chosen for the price estimate, a "Closest cities" chip, hover tips.

## Delivery and privacy

Events are best effort with a bounded queue of 30, a five-second request timeout,
no retry/offline persistence, and in-memory Umami session-cache reuse. Blocking
analytics never prevents map use or outbound navigation. The first page view of
a page load says where the visit came from (`visitSource` in `src/lib/analytics.ts`):
the referring website's origin alone, or, for a link without one whose `utm_source`
names an AI assistant (ChatGPT's links carry `utm_source=chatgpt.com`), that
assistant's site; and the link's `utm_source`, `utm_medium` and `utm_campaign`, each
a short code. Referrer paths and queries, other query strings, fragments and
arbitrary page titles are excluded. Visits before 22 October 2026 have no source. The collector
receives normal IP/user-agent network metadata; Umami derives coarse geography
and short-lived session/device statistics without storing raw IP addresses.
See PRIVACY.md and the public privacy page for the user-facing notice.

Web collection runs only on `scootradar.com`, honors DNT/GPC and
`localStorage['umami.disabled']`, and has an opt-out on `/privacy`.
iOS has an opt-out under Settings › About › Privacy. Simulators, previews and XCTest are disabled;
launch a simulator with `-analytics-smoke-test` only for an intentional production
collection check. Android sends from the `release` build type only (not the benchmark builds made from it to
measure the app on an emulator): a debug build sends when started with `--ez analytics-smoke-test true`, and
never under its tests. Physical-device installations collect after rebuilding/installing
this revision. Existing installed binaries cannot gain tracking through a web deploy.

## Deployment/verification

Run lint, web tests, OpenNext build and iOS tests. Deploy with `npm run deploy`
(the existing Cloudflare auth is required). Check production CSP allows only the
specific collector origin in `connect-src`; script restrictions stay unchanged.
Use Chrome to interact with the deployed map and verify named events in Umami.
Use a simulator smoke launch for native API/transport verification, and check that
its visit shows in ScootRadar iOS: Umami answers a user agent it takes for a bot
with `{"beep":"boop"}` and HTTP 200, so the app sees no error. Smoke visits remain
visible in production analytics; they can be identified by test time/platform.
