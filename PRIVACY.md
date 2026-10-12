# Privacy

Last updated: 12 October 2026

ScootRadar has no accounts or advertising. It does not intentionally retain precise user locations or address
searches.

- With permission, the app uses location coordinates on the device to focus the
  map and calculate distance. Its API receives the visible map bounds needed to
  find vehicles, not a separate user-location coordinate.
- Walking routes on the web: when Directions is pressed, the start (the user's
  location, or the searched place) and the scooter or bay are proxied in a
  non-cacheable request body to the Valhalla routing service run by FOSSGIS e.V.
  in Germany, without the user's IP address. ScootRadar does not log or store
  them; FOSSGIS keeps route requests in its server log. While the route is shown
  it is asked for again when the user leaves it, from where they are, or when
  the scooter moves.
  In the iOS app routes come from Apple Maps on the device's behalf.
- Address text is proxied in a non-cacheable request body, with the language
  the app is shown in, to komoot's Photon service in Germany (OpenStreetMap
  data), without the user's IP address. When the map shows a city or less, its
  centre, rounded to about a kilometre, goes with it so that nearby places come
  first. With the map in or near Switzerland, or without a centre, the text also
  goes to the Swiss federal geo.admin.ch service. The name of a city in the
  ScootRadar catalogue is answered without contacting either.
- OpenFreeMap receives normal map tile requests from the user's device, with the website origin as the referrer (no page path or query string). The tiles hold OpenStreetMap data and are drawn on the device.
- Language, filters, appearance, map style, the ride length chosen for price
  estimates and, in the iOS app, the ride passes entered are stored locally, as is the fact that the device has found its
  location before (a yes or no, never the position). Precise map origins are not
  persisted, and the places chosen in the search are kept in memory only, until
  the app is closed.
- Cloudflare hosts and protects the service. Persisted Worker invocation logs
  are disabled so full coordinate-bearing request URLs are not retained in the
  application's log stream.
- Structured application error logs contain event names and error messages, not
  precise locations or search text.
- When the server fails to answer a map request, an error report is sent to
  Sentry, in the United States, so the failure can be reproduced. It holds the
  request URL (the visible map bounds, zoom level and filters) and the server's
  state at the time, never the IP address, request headers or search text.
  Sentry keeps it for up to 90 days.

Cloudflare, Sentry, FOSSGIS, komoot and upstream providers may process limited network or security
metadata under their own privacy policies. The full user-facing notice is
published at <https://scootradar.com/privacy>.

Questions: `hello@scootradar.com`.

## Usage analytics

The public web/PWA and native iOS app send page/screen views and named actions
(search result counts, filters, selections, directions/rental taps, preferences,
and generic failures) to our self-hosted Umami at `u.plhery.com`. Platform tags
separate web, PWA and iOS. We do not collect search text, precise coordinates,
vehicle IDs, URL queries/fragments, advertising IDs, or session recordings.
Umami processes IP/user-agent information to derive approximate geography,
device information and short-lived sessions; it does not store raw IPs. No
analytics cookies or persistent user IDs are used. Session cache stays in memory.
Disable analytics on the web privacy page or in the iOS app under
Settings › About › Privacy. Web collection also respects Do Not Track and
Global Privacy Control. Development/preview web hosts and iOS simulators/tests
are excluded by default.
