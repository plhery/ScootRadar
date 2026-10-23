# ScootRadar analytics

Dashboard: https://umami.plhery.com/websites/6e60b4ab-b4ee-4785-9699-a7f32127b358

Both clients POST to `https://u.plhery.com/api/send`, using the public website ID
`6e60b4ab-b4ee-4785-9699-a7f32127b358`. No API/admin secret is shipped. The Umami
admin dashboard remains protected independently of its existing public collector.
Filter by **Tag** (`web`, `pwa`, `ios`) to compare platforms. Named events also
carry `platform` in event data. Web page views contain only `/map`, `/privacy` and
the pages of the site, each under its own address: the landing page of a language
(`/` for English, `/de`, `/fr`, `/it`…), each guide (`/guides/e-scooters-bristol`,
`/de/ratgeber/…`) and each language's list of guides (`/guides`, `/de/ratgeber`…).
Native screen views use `/`, `/filters`, `/settings`. Until the landing page took the
root, the web map was counted under `/`: web views of `/` before that are the map.
From the first guides on 12 October 2026 until 19 October 2026, the guides and their
lists were counted as `/map`: web views of `/map` in that week include them.

## Event catalog

| Flow | Events | Data |
| --- | --- | --- |
| Site | `map_open` (web) | a link to the map followed from a page of the site (the landing page, a guide, a list of guides), counted under that page's address; `result`: `city` (a city's map) or `map` (the map) |
| Lifecycle | `app_open`, `app_install` (PWA), `app_foreground` (iOS), `link_open` (iOS) | platform; for `link_open`, a scootradar.com link to the map opened in the app, `result`: `city` (a city's centre, chosen like a city in the search), `place` (another point) or `map` (no place) |
| Search | `search_open`, `search_close`, `search_results`, `search_error`, `search_select`, `search_clear` | result count only (`count` web, `value` iOS) |
| Filters | `filters_open`, `provider_filter`, `providers_all`, `filters_reset`, `battery_filter` | provider, enabled/result, quick/filter source (web), value |
| Preferences | `settings_open`, `panel_close`, `map_style`, `zones_toggle` (web), `language_change` | style (web: the appearance `auto`/`light`/`dark` or the map `calm`/`detailed`; iOS: the appearance `auto`/`light`/`dark` or the map `standard`/`quiet`/`satellite`, in `result`), whether the zones preview was turned on (`enabled`), language (a code, or `auto` for Automatic, which follows the browser or the iPhone; iOS: in `result`) |
| Location | `locate`, `location_result` | success/denied/unavailable |
| Map/details | `vehicle_select`, `vehicle_dismiss`, `cluster_select`, `parking_select`, `map_zoom` (web), `compass_reset` (web) | provider; zoom direction |
| Conversion intent | `directions_open`, `rental_open` | provider, vehicle/parking target; for directions on the web, `result`: `route` (drawn on the map) or `maps` (Google Maps); iOS sends it for Directions and for Open in Maps alike, without `result`; for a rental, `result` `app` when the button opens the operator's app rather than the scooter (Lime, Bird and PubliBike, whose feeds link no scooter), never whether the app is installed or opened |
| Walking routes | `route_result`, `route_arrived` | web: `success`/`no_route`/`busy`/`failed`/`too_far`; iOS: `success`/`error`/`too_far`, with provider and vehicle/parking target |
| Reliability | `refresh`, `refresh_result` (web), `data_error`, `data_expired` (web) | generic outcome only (`success`/`error`; `timeout`/`request_failed`) |
| Price tools (iOS) | `ride_duration`, `ride_pass_change` | duration, provider; never pass expiry or financial details |
| Rating (iOS) | `review_ask` | `result`: the moment the app asked for a rating with Apple's prompt, `rental_return` (back from the operator's app 5 minutes to 2 hours after **Open in**). It counts asks, not prompts shown: iOS decides whether the prompt appears, at most three times a year |

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
- `search_select` covers a result, a recent place and a "Cities with scooters"
  chip alike; `search_clear` is the × that removes the chosen place.
  `search_error` is a search that failed, not one the server put off for being
  one too many in a minute: that one is repeated and reports its own outcome.
- `refresh` is a tap on "Try again" where a failure is shown, and
  `refresh_result` its outcome. A tap while a request is already running is
  waited out and sends nothing. Refreshing is otherwise automatic and sends
  nothing. `data_error` is sent once when loading starts to fail, `data_expired`
  when the positions on screen are removed as out of date.
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
collection check. Physical-device installations collect after rebuilding/installing
this revision. Existing installed binaries cannot gain tracking through a web deploy.

## Deployment/verification

Run lint, web tests, OpenNext build and iOS tests. Deploy with `npm run deploy`
(the existing Cloudflare auth is required). Check production CSP allows only the
specific collector origin in `connect-src`; script restrictions stay unchanged.
Use Chrome to interact with the deployed map and verify named events in Umami.
Use a simulator smoke launch for native API/transport verification. Smoke visits
remain visible in production analytics; they can be identified by test time/platform.
