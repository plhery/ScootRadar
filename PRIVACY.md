# Privacy

Last updated: 19 November 2026

ScootRadar has no accounts or advertising. It does not intentionally retain precise user locations or address
searches, except the last place chosen in the search, which stays on the device (see below).

- With permission, the app uses location coordinates on the device to focus the
  map and calculate distance. Its API receives the visible map bounds needed to
  find vehicles, not a separate user-location coordinate.
- Walking routes on the web and in the Android app: when Directions is pressed, the start (the user's
  location, or the searched place) and the scooter or bay are proxied in a
  non-cacheable request body to the Valhalla routing service run by FOSSGIS e.V.
  in Germany, without the user's IP address. ScootRadar does not log or store
  them; FOSSGIS keeps route requests in its server log. While the route is shown
  it is asked for again when the user leaves it, from where they are, or when
  the scooter moves.
  In the iOS app routes come from Apple Maps on the device's behalf.
- Address text is proxied in a non-cacheable request body, with the language
  the app is shown in, to Geoapify (OpenStreetMap and other open data), a
  company in Cyprus whose servers are in the EU, without the user's IP address.
  When the map shows a city or less, its centre, rounded to about a kilometre,
  goes with it so that nearby places come first; with an address followed by a
  city in the ScootRadar catalogue, that city's centre goes instead. Without a
  centre, the country of the device's time zone, such as "US", worked out on the
  device, goes with it so that places in that country come first. Geoapify
  generally keeps the data of a successful request for no longer than 24
  hours. When Geoapify cannot answer or finds nothing, the same also goes to
  komoot's Photon service in Germany (OpenStreetMap data). Cities in the
  ScootRadar catalogue are found without contacting either; their names still
  go to Geoapify, to find other towns of the same name.
- OpenFreeMap receives normal map tile requests from the user's device: from the website, with its origin as the referrer (no page path or query string), and from the Android app. The iOS app's map comes from Apple Maps. The tiles hold OpenStreetMap data and are drawn on the device.
- Language, units, filters, appearance, map style, whether the map shows ride and
  parking zones, the ride length chosen for price
  estimates and, in the iOS and Android apps, the ride passes entered are stored locally, as is the fact that the device has found its
  location before (a yes or no, never the position) and, in the Android app, the fact that the user refused it
  location, until it is allowed (`android-location-refused`). The website also keeps what was done with its
  invitation to test the Android app (`scooters-android-test`): until when it is hidden, whether it is never to
  be shown again, the last of its steps followed and whether it gave thanks. For its rating prompt each of the
  iOS and Android apps also keeps the number of days it was used and when it last asked (up to
  version 1.4.0 of the iOS app and 1.3.0 of the Android app, also the time "Open in" was last
  tapped, which later versions delete). Precise map origins are not persisted, except the
  last place chosen in the search: it is kept on the device (in the iOS and Android
  apps, outside their backups) so that the search can offer it again, until another
  place is chosen or it is removed with its ×.
  The iOS and Android apps keep on the device the ride and parking zones of the cities
  they download them for, such as Berlin, fetched from ScootRadar's website the first
  time the map shows the city close up: the request names the city, not a
  position, and the zones are kept until the app or the system clears its cache.
- Cloudflare hosts and protects the service. Persisted Worker invocation logs
  are disabled so full coordinate-bearing request URLs are not retained in the
  application's log stream.
- On the website, a few seconds after the map shows its first scooters, at most once a day,
  Cloudflare Turnstile checks in the background that the browser is not a script. Nothing is
  shown: its script and invisible frame come from `challenges.cloudflare.com` and read signals of
  the browser and device, under the Cloudflare Turnstile Privacy Addendum
  (<https://www.cloudflare.com/turnstile-privacy-policy/>). Once it has passed, the website sets a
  cookie for 24 hours, `__Host-scootradar-pass`, holding when it expires and a signature of that
  time and of the visitor's network (the IP address, or its first half for IPv6), and no
  identifier, so that the map's requests keep the scooters up to date. The map works without it.
- The iOS and Android apps do not use Turnstile: they get the same pass, held on the device until
  it expires and sent with their requests for scooters, by proving in the background that they are
  ScootRadar's own apps, when the server says they have none, at most once every 10 minutes. The
  iOS app uses Apple's App Attest: it makes a key in the device's Secure Enclave, which Apple
  certifies the first time, and signs the server's challenge with it. The Android app from Google
  Play uses Google's Play Integrity API, through Google Play services, which tells whether it is
  the copy Google Play distributes on a device that passes Google's integrity checks. Apple
  (<https://www.apple.com/legal/privacy/>) and Google (<https://policies.google.com/privacy>)
  process the device's signals under their own policies. The server checks the proof and keeps
  nothing of it: the iOS app sends its key's identifier, the same each time on that device, which
  the server neither stores nor logs; the iOS app keeps the identifier and the server's signed copy
  of the key on the device until the app is deleted. The Android app built for F-Droid does not use
  Play Integrity. The apps work without a pass.
- To tell a map's requests from a script's, the server counts each visitor's requests for
  scooters under a hash of their IP address (or its first half for IPv6), salted afresh each time
  the server starts: by quarter hour, and by UTC day the quarter hours in which they kept the
  scooters up to date. A hash is kept for its quarter hour or its day, then only the counts; no IP
  address is stored. It also counts each address's (or IPv6 first half's) requests for scooters of
  the UTC day and hour under a keyed hash of it and that day or hour, with a key only the server
  holds, kept across a restart until the day ends, so that an address making more than a map does
  is answered with the scooters already held. One day's hashes cannot be linked to the next's.
- The website tells the server whether a request for scooters came from a page of ScootRadar,
  another site or none, never the page itself; the server only counts them.
- Structured application error logs contain event names and error messages, not
  precise locations or search text.
- When the server fails to answer a map request, an error report is sent to
  Sentry, in the United States, so the failure can be reproduced. It holds the
  request URL (the visible map bounds, zoom level and filters) and the server's
  state at the time, never the IP address, request headers or search text.
  Sentry keeps it for up to 90 days.
- When the website's own scripts fail in a browser while usage analytics is on,
  the website sends Umami a report of the error (see Usage analytics below): its
  name, message and stack, the page by the path analytics counts it under, the
  website's version (the deployed commit), the browser's language and the
  platform tag. Before it is sent, the addresses in it lose their query and
  fragment, and it loses email addresses, numbers with three decimals or more
  (coordinates), quoted text with a space in it (a search) and anything shaped
  like a key or a long number. At most five are sent per page load, none for an
  error of a browser extension, of another site's script or of the network.
  The website names no Sentry project of its own yet (`SENTRY_BROWSER_DSN` in
  `src/lib/errorReportsConfig.ts`), so these reports go to Umami alone. Once it
  does, they also go to Sentry with the user agent and the pages opened and API
  requests made before the error, each by its path and status, whatever the
  analytics, Do Not Track and Global Privacy Control settings, and the privacy
  page says so; Sentry is told not to store the IP address.

- Location permission can be withdrawn in the browser or device settings, and
  analytics turned off (see below); the map works without either. Nothing kept
  is linked to an account or a person; an error report is deleted on request
  before its 90 days, given its time and place on the map.

Cloudflare, Sentry, FOSSGIS, Geoapify, komoot and upstream providers may process limited network or security
metadata under their own privacy policies. The full user-facing notice is
published at <https://scootradar.com/privacy>.

Questions: `hello@scootradar.com`.

## Usage analytics

The public web/PWA and the native iOS and Android apps send page/screen views and named actions
(the website pages viewed, such as guides, and links to the map followed from them;
search result counts, filters, selections, directions/rental taps, preferences,
and generic failures), and from the website reports of its own errors (see
above), to our self-hosted Umami at `u.plhery.com`. Platform tags
separate web, PWA, iOS and Android. With the first page view of a page load, the website
also sends where the visit came from: the referring website's origin alone (no
path or query) and the link's `utm_source`, `utm_medium` and `utm_campaign` tags.
We do not collect search text, precise coordinates, vehicle IDs, other URL
queries, fragments, advertising IDs, or session recordings.
Umami processes IP/user-agent information to derive approximate geography,
device information and short-lived sessions; it does not store raw IPs. No
analytics cookies or persistent user IDs are used. Session cache stays in memory.
Analytics is on by default. Turn it off on the web privacy page or in the iOS
and Android apps under Settings › About › Privacy. Web collection also respects Do Not Track and
Global Privacy Control. Development/preview web hosts, iOS simulators/tests and Android debug builds
are excluded by default.
