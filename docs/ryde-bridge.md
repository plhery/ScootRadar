# Ryde bridge implementation and rollout

The catalog covers **all 83 official Ryde cities**. The native Mac bridge uses
the configured datacenter pool below; the original Mac connection is held after
an upstream refusal. A successful native map does not establish complete fleet
coverage or an upstream request allowance.
The operator explicitly waived the separate overnight gate: production is the
continued uptime test. Existing public feeds keep 19 named city areas; the Mac
bridge adds the other 64 (4 Norway, 25 Sweden, 15 Finland, 20 Germany). Each
additional city returned a fresh native map and matching city metadata on the
same signed-in account. No per-city login is required.

The collection envelopes come from native cityRange/type-4 operating rings.
Sola has only a city-selection envelope: it bounds collection and is not
advertised as a riding boundary. Native observations inside an existing public
Ryde feed's catalog coverage are excluded to avoid two identity namespaces for
the same scooters. No riding zones or parking are inferred from these envelopes.

The 1 km grids (2.5 km for Sola's envelope) contain 4,679 initial views in
2,356 independently refreshed groups. At five seconds between job starts, plus
native launch overhead, a full round needs roughly eight hours before adaptive
subdivision. Under sustained visible demand, routine work gets
one in four turns and full rounds can take longer. Each background group has at most two initial
views.

Since 18 November 2026 a group nobody looks at is swept in its town's daytime, between
08:00 and 21:00 there (`daytimeSweeps`): every three days (`RYDE_IDLE_INTERVAL_MS` in
`server/rydeApp.ts`), and every day (`RYDE_LOOKED_INTERVAL_MS`) in a city one of our
maps was opened on within the last seven days (`RYDE_LOOKED_MS`,
`RydeWatchedViews.looked`). A read counts as a look when its request names its view
(`X-Scooter-View`, as the website's and the apps' do), and for the city the view is on,
not the next one over, which is read too: a request without one is answered and read
for all the same, and marks no city. On 18 November, the first day, 16 of the 64
cities were marked, eleven of North Rhine-Westphalia between 14:01 and 16:27, while a
script (`NRW-availability-pilot/1.0`) asked for them some six times a minute. The sweeps keep the city totals and the groups a wide view
shows; what a visitor looks at is read on its own (below), so a city swept every
three days is as fresh as any once someone opens it. When a city is opened after a
week or more without a read, its groups are brought forward (`FeedScheduler.hasten`):
those whose turn of the day has gone by are swept at once, by night too, the others
at their turn. A city nobody opens for a week has one more
daily sweep and goes back to three days. When each city was last looked at is saved
with the feed states (`rydeLooks` in `feed-states.json`), so a deploy keeps it, and
`scootradar_ryde_looked_areas` counts the cities swept daily. Every group's scooters
expire three days and 10 minutes after its last sweep, in either case. Before, every
group was swept about every 16 hours (936 minutes, sized for half the shared account
turns), day and night: some 420 reads an hour, of which visitors' were about 3%.
A sweep by night is as good as one by day, and is not made again at 08:00 as Lime's
is: on 18 November 1,277 groups read between 01:00 and 08:00 and again by day held
30,157 scooters then and 30,026 after, the same in each country. One made in a night
ban is still made again at its end (`feedCurfewEnds`). The visible map uses a separate focused read, shared between viewers and
refreshed at most once a minute, so switching cities does not wait for a group's
adaptive scan to finish.
The queue coalesces identical work and serves up to three urgent reads before a
routine read while both wait. These are conservative operating settings, not an upstream quota.
Saturated cells subdivide within request/depth/time budgets (80 reads, six
halvings, 30 minutes: `RYDE_SCAN_LIMITS`); unresolved groups fail and preserve
prior observations. Three halvings, to circles of 97 m, were not enough at
Linköping's station: from 14 November 2026 at 01:12 UTC its group 025 expired,
as one or two of its 97 m reads still returned Ryde's 100 while 150 to 215
scooters stood in the racks there, and it failed so every weekend, as did
Uppsala's station and Turku's on other days. The densest circles seen there from
6 to 14 November held at most 131 at 49 m, 102 at 24 m and 77 at 12 m, so six
halvings resolve them, each extra quarter at about four reads. The reads bound a scan's cost; the time only stops one that
outlasts any fair share of the worker, which every group being swept shares. It
was ten minutes until 5 November 2026: the worker then answered about nine reads
a minute, central Turku's group got one every 26 seconds or so and failed after
24 of the 34 or so it needed (SCOOTRADAR-CACHE-66). Coverage and uptime flags remain truthful:
the explicit private productionPilot setting authorizes this rollout without
claiming every city has independently passed Drammen's reference scan.

Drammen's independent 1,000 m scan completed 66 queries with zero unfinished
cells and retained all 90 stationary reference observations eligible for its
operating rings. Cross-city collection, proxy recovery, native key renewals,
app restart and clean restoration have passed live tests. The Mac is operated
unlocked; lock-screen testing was explicitly waived. Continuous uptime, adaptive
request cost and city-by-city completeness remain production observations.

## Components

- `scripts/ryde-bridge/RydeLifecycle.swift`: the operator-authorized helper. Uses
  NSWorkspace only for bundle `com.ryde.NewRyde`; waits for graceful termination
  and opens hidden without activation. No arbitrary application or input automation.
- `producer_addon.py`, `native_protocol.py`, `bridge_crypto.py`: preserve genuine
  native proofs; substitute response recipients only through the authorized
  key bridge; translate replies back to app-owned keys. Each queued map job
  consumes one native request. Credentials remain on the Mac.
- `producer_runner.py`: normal-user LaunchAgent supervisor, existing scoped
  certificate/PAC transport, addon readiness handshake. Its PAC removes DIRECT
  fallback for api.ryde.vip so a proxy restart cannot silently move a key rotation
  outside the bridge. Existing connections/PAC caches remain a live-test concern.
- `egress.py`, `egress_addon.py`: private datacenter configuration and rolling-hour
  HTTP accounting in local SQLite. Every Ryde HTTP attempt is charged before
  forwarding, including startup, metadata, renewal, background and failed calls.
  Counts survive process restarts. An upstream refusal holds the entire pool.
  A startup lasting at least 25 seconds with two settled transport failures and
  no HTTP response of any kind temporarily excludes that gateway for 15 minutes,
  assessed only after the app quits. Without this, one unreachable gateway remains
  least used and can trap consecutive launches, causing a service-wide AppFailing
  hold (observed 7 November 2026). A working launch's cancelled requests do not
  qualify; neither do HTTP errors, including authentication failures or 403/429.
  The cooldown survives restarts, changes no request counts, and does not change
  the gateway during a native launch. When every route is cooling, collection waits.
- `worker.py`: one process lock, query deadline, app trigger, private result spool,
  outbound authenticated HTTPS broker polling (ScootRadar-Ryde-Worker client identifier), idempotent submission, held state
  on failure. Native key-renewal opportunities continue through idle relaunches.
- `shadow.py`: bounded local sampler (maximum 24 hours, minimum 120 seconds
  spacing); stops on its first failed sample and never publishes production data.
- `server/rydeBridge.ts`: account-wide bounded queue. Coalesces identical queries,
  leases one job at a time, reserves every fourth contested turn for routine work,
  spaces new jobs five seconds apart initially, and expires them after two minutes.
  Queued reads follow the collection's current watch priority, including a view
  opened after its idle read was queued.
  These are conservative configuration defaults, not measured upstream quotas.
  Visible reads can take up to three consecutive turns while routine work waits;
  an active native read is never interrupted. Idle periods still go entirely to
  routine work. This shortens competing visitors' queues without increasing the
  native request rate or changing the egress budget. It does not promise a
  three-second collection: `followUpMs: 3000` is only the client's cache-check gap.
- `server/rydeWatchedViews.ts`: one focused native read of the visible area, bypassing
  the scheduler's long group scans. Previously, two scans woken in an earlier city
  could hold both watched slots until they completed; switching cities then waited
  minutes even though the worker was healthy. Viewport reads use the same broker,
  native session, routine-turn reservation and durable egress budget. Nearby viewers
  share a quantized centre/radius and a 60-second refresh interval. At most two cities
  are sampled per answer, one read per city may be pending, eight in total, with 128
  recent views retained in memory. Results expire after 15 minutes, retaining their
  actual observation times. They add positive observations to the answer, and never
  replace a full feed, update city totals or change the snapshot file. The sample radius
  is at most 5 km, and a saturated reply can omit scooters. A reply short of the area's
  saturation count is taken as the scans take a cell's (`scanRydeArea`): it lists every
  scooter within its circle, bounded to the circle a scan asks of one of the area's cells
  (about 0.78 km for 1 km cells). The answer then drops the city's older positions in it
  that the reply did not mention, live or faded; elsewhere unmentioned scooters remain
  faded, said to be last seen rather than updating. In Augsburg on 7 November 2026 the
  old positions stood faded beside the scooters' new ones. While no worker has asked for
  a job for `RYDE_WORKER_SILENT_MS`, a queued read is not said to be on its way, so the
  map stops polling every 3 seconds for it. Full group scans continue
  on their routine schedule. A failed focused read waits a minute before retrying.
  The first read of a newly panned or zoomed viewport asks clients to follow up every
  3 seconds even if another viewport in that city has recent observations. Previously
  those observations suppressed `refreshing`, telling iPhone and web clients to wait
  60 seconds for results that could already be available. Once the exact viewport has
  a recent result (including a confirmed empty result), its routine renewal keeps the
  usual 60-second polling interval. These follow-ups read the shared cache and do not
  each launch a native request; per-view coalescing and all bridge budgets still apply.
  Map clients can send `X-Scooter-View` (an in-memory random UUID and increasing
  request number). The edge validates it and the origin scopes it to the authenticated
  forwarded client network. The watched-view service keeps at most 4,096 identities
  for two minutes, never logs or persists them, and ignores reordered older requests.
  Moving a map releases its previous queued views. Work is cancelled only before
  leasing, when no other tracked viewer needs it, no anonymous viewer has joined it,
  and no other broker consumer has coalesced onto it. Older clients remain supported
  and their work is conservatively retained. The web sends the header immediately;
  the matching iOS client change requires an app release.
  A complete response younger than a minute can also answer a different viewport
  without another native read, provided its conservative confirmed circle covers
  every corner of the view. Capped, old, or only partly covering responses cannot.
  The origin starts Ryde collection before waiting for other providers, and reads
  its latest observations again before responding. Cancellation has its own metrics
  outcome and is not counted as a provider failure.
  `scootradar_ryde_watched_views_total` separates requested, completed and failed reads;
  `scootradar_ryde_watched_views_pending` reports current pending reads.
  `scootradar_ryde_looked_areas` is how many cities one of our maps was opened on
  within the week, whose groups are swept every day.
- `server/rydeApp.ts`: bounded overlapping scans, adaptive subdivision, retained
  parent observations, stable pseudonyms and a separate coverage-validation gate.
  An unfinished scan fails collection, preserving the old snapshot. The private production pilot explicitly bypasses preproduction coverage/uptime gates.

The worker's current client is synchronous: one account and one active native
request. Add account parallelism only after measured need and separate authorized
sessions. No native token, DPoP proof, cookie, encryption key or hardware ID belongs
on the cache server or in logs. The ID HMAC key is stable, mode 0600, on the Mac.
E-bikes are excluded; battery/range/provider position-update time remain unknown.

The launch helper confirms termination before returning, so the worker no longer
adds a fixed two-second pause between arming the job and opening Ryde. Proxy readiness,
egress selection, termination and job arming still finish before the new launch.
With `producer/warm-control.json` set to
`{"enabled":true,"mode":"minimized-idle"}` (mode 0600), the worker prefers briefly
activating the existing Ryde process **with its window minimized**. Activation
triggers the app's own fresh map request. No map pan, scooter selection, synthetic
mouse/keyboard event or private API is needed. After publishing each result, the
worker prepares the next read by minimizing and unhiding the home map without
activation. Keeping this window unhidden but minimized avoids hard suspension.

Fast activation requires 15 seconds without keyboard or mouse activity, no held
modifier or mouse button, an unlocked session, a single Ryde instance and the
expected home map with no sheet. The helper checks activity again before activation
and while waiting. Its window stays minimized, but keyboard focus briefly belongs
to Ryde, for at most two seconds plus cleanup; the helper then restores the previous
app. If the user switches apps in the meantime, their selection wins. The cursor
is never moved. A failure to keep the window minimized, or to restore focus and the
cursor when the user did not interrupt, pauses fast mode for an hour (`pausedUntil`
and `lastRestorationFailure` in the control file); three in a row disable it, with
the reason, until the operator enables it again, and a clean read resets the count.
Until 17 November 2026 the first failure disabled it: warm reads were off from
14 November 10:27 CET, for one failed restoration, until they were turned on by hand.
This is a desktop helper, not a promise of entirely background execution.

Install it with `python3 scripts/ryde-bridge/install.py --map-control`. Its bundle is
`~/.local/share/scootradar/ryde-bridge/Ryde Map Control.app`. The operator must grant
macOS **Device Control and Data Access** (called Accessibility on older macOS)
to this app. The OS permission is broader than its fixed Ryde-only commands;
the worker never requests or grants permissions. It launches the signed bundle
through LaunchServices, without activation of the helper itself, and exchanges
nonce-bound, short-lived commands and replies in private files. A command-line
child can otherwise be attributed to the worker rather than the approved app. Removing the enable flag or
revoking permission restores normal hidden restarts. No App Store update is needed.

Opening the helper app pauses fast activation for five minutes, for example before
screen sharing; normal collection continues by the restart path. The same pause is
available with its executable's `pause` command, or set `pausedUntil` in the control
file. `status` reports permission and idle eligibility; the worker asks it for the
permission only every 10 minutes, and reads the screen lock, Ryde's processes and the idle
time itself (WindowServer's port table, below). `show` is operator-only and
unminimizes Ryde; pause collection first if inspecting its UI. A separate Space or
monitor is unnecessary, and should not be relied on to isolate global app focus.

Warm reads reuse the pinned egress only while it has 30 seconds of lease and the
normal launch headroom remaining. They never extend a lease, reset counts, switch
egress mid-cycle or bypass refusal holds. Periodic cold launches retain native
key-renewal opportunities. If activation produces no map within eight seconds,
the proxy first disarms that exact job on its native-hook event loop. It permits a
restart only after assigned native maps and key renewals have finished, with no
unresolved recipient; a live read keeps its deadline instead of being killed.
Missing permission, a busy desktop, unavailable map or expired route falls back to
the existing hidden launch path. Cold requests and queueing can still be slower. Private admission and trigger
records distinguish an idle/permission refusal, a route boundary and a failed fast
trigger. The bridge Python tests must be run explicitly; CI does not run that suite.

## Datacenter egress

The supervised transport can route through the existing paid datacenter pool.
It retains the same Ryde-only PAC and certificate scope. The private
`producer/egress-config.json` is mode 0600 and has this shape (synthetic values):

```json
{
  "version": 1,
  "maxRequestsPerHour": 200,
  "gateways": [
    { "host": "192.0.2.10", "port": 8000, "username": "example", "password": "example" }
  ]
}
```

Use fixed datacenter IP addresses, one entry per distinct IP, at most 100.
The installed transport's private `config.json` also sets
`datacenterEgressRequired: true`. A missing or invalid pool then fails closed;
it cannot restore direct Mac egress. Proxy authentication is added only to the
upstream CONNECT request and never to Ryde's HTTP request or command arguments.
The native request proof, response translation and recovery protocol are unchanged.

After gracefully quitting Ryde, the worker selects the least-used IP with room
for 50 calls and pins it for that launch. Connections are pooled by their upstream
gateway, so reusing a native connection cannot silently reuse a different IP.
Each actual HTTP request is separately checked against **200 in a rolling hour**.
The selected launch expires after 150 seconds; background traffic outside it is
refused locally. The 50-call headroom is conservative and is not a claim that an
app launch always makes exactly that many requests. Native startup has already
been observed to make about 30–40 calls per map, rather than just a map and two
fence requests. All calls count, including ones without a successful response.

When no launch fits, the worker waits before asking the broker for another job.
A real Ryde 403/429 pauses the entire pool for at least 15 minutes, in addition
to the worker's increasing refusal backoff; it does not immediately move the
refused request to another IP. Failed accounting also prevents forwarding.
Readiness checks use a read transaction; actual selection and charging recheck the
budget under the write lock. Time-indexed rolling counts and gateway-specific
charges avoid scanning the retained day for each native request. Local database
contention retries after five seconds without crashing or triggering an app-failure hold.

Inspect private, credential-free counters with:

```sh
python3 ~/.local/share/scootradar/ryde-bridge/egress.py
```

Output contains hashed gateway identities, rolling request counts and HTTP byte
counters. Byte counters exclude TLS/proxy overhead and are not the provider's
billed bandwidth. `egress.sqlite3` retains approximately one day of attempts;
the endpoint/status journal rotates at 8 MiB with one previous file. Credentials,
proofs and payloads are absent from this journal.

The proxy answers the app's `getCityFences` itself, for the job's city, from the last
full reply it kept for that city (`producer/city-metadata/<city>-getCityFences.json`)
while that is under a day old, with its content type and the job's city in it; an
older or missing one, or one kept before its content type was, goes to Ryde, and
Ryde's reply replaces it. The fences were 579 of the 743 MB Ryde sent in the 28
hours to 17 November 2026 21:42 CET, about 165 KB a launch, unchanged from one
launch to the next. A reply the proxy gave never left the Mac: its charge is
refunded (`Pool.refund`) and the journal records it with `"gateway": null` and
`"answeredLocally": true`. The app's other metadata calls still go to Ryde.

To pause collection, boot out only `com.scootradar.ryde-worker`. Keep the proxy,
the required-route setting, pool config and session recovery files. For rollback,
leave the worker paused and preserve datacenter routing while recovering native
key ownership; do not remove the pool config to force a direct connection.
The normal clean-stop operation still needs an available egress budget and may
need to wait for a refusal hold to end. Resume with the existing install command
after verifying the route, session and proxy readiness.

## Install and resume

The already authorized transport is in
`~/.local/share/scootradar/ryde-bridge`; its config, certificate and proxy settings
are prerequisites. Installation does not grant new trust or alter its scope.

```sh
python3 scripts/ryde-bridge/install.py --restart
```

It copies the versioned source, builds the restricted Swift helper and updates
`~/Library/LaunchAgents/com.scootradar.ryde-bridge.plist`. New private files live
under `producer/`, including `session/recovery.json`, `id-key`, `job.json`,
`results/`, `proxy-ready.json` and private logs. An interrupted binding retains
its private key; do not delete or replace that directory to make a warning go away.

When the operator returns, first read `producer/session/status.json` and
`transport-status.json`. If the transport was intentionally left idle and the
native session is verified app-owned, arm it with:

```sh
python3 ~/.local/share/scootradar/ryde-bridge/worker.py --arm
python3 scripts/ryde-bridge/install.py --restart
```

Only then perform the authorized sign-out/Apple sign-in in Ryde. Reattachment
archives previous recovery material after the new native login succeeds; it does
not overwrite an outstanding bound session. Request a first map after sign-in:

```sh
python3 ~/.local/share/scootradar/ryde-bridge/worker.py --once
python3 ~/.local/share/scootradar/ryde-bridge/worker.py --once --city 32 --lat 57.70787 --lng 11.97344
python3 ~/.local/share/scootradar/ryde-bridge/worker.py --once
```

Pass criteria: all three succeed without another login. Then kill/restart only
the supervised proxy, wait for its matching ready PID, repeat the three reads,
observe at least two native renewals, and test worker restart and app restart.
Check both output and app readability. Deliberately test interrupted bind/restore
states using fixtures before low-volume live equivalents.

Clean stop while bound:

```sh
python3 ~/.local/share/scootradar/ryde-bridge/worker.py --stop
```

This waits for a native rotation to pass through unchanged and verifies a
following map envelope addressed to the app-owned key. A timeout retains the
transport for recovery. Stopping the proxy alone is not a clean stop. In the
verified unbound state it can return to idle without another login.

## Broker configuration

The cache reads mode-0600 `/data/ryde-bridge.json`, on the persistent snapshot
volume, owned by Node UID 1000 (`RYDE_BRIDGE_CONFIG_PATH` overrides it). Its
version-1 object contains a random dedicated `token` (at least 32 characters),
`areas` (`"*"` for the reviewed catalog) and `productionPilot: true`. This token
is distinct from the snapshot and metrics tokens. Without configuration, worker
routes return 404. Legacy `RYDE_BRIDGE_TOKEN`/`RYDE_BRIDGE_AREAS` environment
configuration retains strict coverage/uptime gating.

The Mac's private `producer/worker-config.json` contains `url` (the cache HTTPS
origin) and the same `token`, mode 0600. It contains no Ryde credential. Install
and supervise the production worker with:

```sh
python3 scripts/ryde-bridge/install.py --worker
```

This starts normal-user `com.scootradar.ryde-worker`, stops the shadow sampler
and takes the same exclusive worker lock. Do not run live research alongside
production. To pause production, boot out that worker LaunchAgent first. To
unbind the native key, use the clean-stop procedure above; retain the supervised
proxy until restoration is verified.

- `GET /internal/ryde/job`: one lease or JSON null.
- `POST /internal/ryde/result`: version 1 normalized observations, exact query and
  job identity, original observation time and `coverage: "unknown"`.
- `POST /internal/ryde/status`: the worker saying it holds itself off, when a hold
  starts and about once a minute during it:
  `{"version":1,"state":"held","reason":"AppFailing","until":1794951316.47,"detail":"…","at":1794936976.54}`.
  `reason` is 1 to 40 letters, `until` (or null) and `at` are epoch seconds on the
  Mac's clock, and `detail` is 300 characters at most. Any other key, or a body over
  4 KB, is refused (400, 413); it answers 204. It is no request for a job, so the
  worker's silence (below) goes on. The cache keeps the latest, with when it heard it,
  until the worker next asks for a job.
- Results are bounded, checked for age, duplicate IDs, unexpected fields and
  distance from the requested centre; acknowledgements are idempotent. A server
  restart expires the old queue rather than accepting a result into a new job.
- The authenticated `/metrics` includes queue/completion/expiry/rejection counts,
  pending jobs and the worker's last poll time. A poll proves connectivity, not
  successful native collection. Feed expiry remains the existing cache contract.
  `scootradar_ryde_bridge_worker_held{reason}` is 1 while the worker's last word on a
  hold is under 3 minutes old, and absent otherwise.

`scripts/generate-ryde-app-feeds.mjs` derives compact grids and country catalog
entries from `data/ryde-bridge-areas.json`. `generate:providers` and
`check:providers` include it. Web/iOS catalog generation expands the same
independently refreshed groups. Existing refresh demand reaches their collector
and shared broker; no new client refresh control is required.

## Drammen geometry and coverage

The legitimate native getCityFences flow succeeded with city ID 43 and Drammen
coordinates, returning 170 fences. getFencesInfo returned nine dynamic cluster/
parking entries; it is not the operating-area outline. Only the public polygon
coordinates needed for collection were exported. Private metadata, including
operational notes, stays outside Git.

The official APK's `com/ryde_android/map/a.java` calculateCityPolygon puts fence
**type 4** into the CITY_BOUND interior rings and type 12 into CITY_OUT. The
Drammen cityRange is empty; its six type-4 polygons supply the collection rings
(808 vertices). The cityDefinitionZone is not used. No parking or restriction
zone is advertised as an operating area. The geometry is recorded in the staged
catalog; a geometry outline alone does not establish complete vehicle retrieval.

The independent finer scan and operational recovery tests passed. The planned
separate overnight sampler was stopped at the operator's request on 4 November;
it is no longer a condition for production. Additional city coverage and uptime
are evaluated through the production feeds and normal expiry reporting.

The scanner publishes positive observations progressively with no certified
swept bounds while the selection rule is unknown. It skips cells outside all
operating rings, including cells in the gaps between disconnected areas. Failure and incomplete scans use the normal collector
failure path, preserving the prior feed's age and vehicles. No delayed upload or
partial scan may make an old city appear freshly collected.

## Certificate and recovery operations

The certificate `ScootRadar Ryde bridge 5c276275` expires **23 December 2027 at
16:40:18 UTC**. It was issued on 21 November 2026 for 397 days and replaced the first
one, which had been issued on 3 November for 30 days. The supervisor requests
restoration seven days before expiry and refuses to start a new proxy inside the final
15 minutes, so renew it before 16 December 2027:

```sh
~/.cache/scootradar/rider-auth/ryde/iphone-capture/venv/bin/python3 \
  scripts/ryde-bridge/renew_certificate.py --password-file FILE
```

FILE holds the administrator password; only sudo reads it. The script refuses to run
unless the bridge is collecting. It issues a leaf like the first one: RSA 2048, SHA-256,
`api.ryde.vip` only, not a CA, server authentication only. It trusts the leaf in the
System keychain for SSL, `api.ryde.vip` and the Ryde app only, and checks that scope in
`security dump-trust-settings -d` before swapping anything. It then writes `leaf.pem`,
`leaf-cert.pem` and `config.json` (the label, SHA-1 and expiry), restarts the proxy, and
waits up to ten minutes for a map from the restarted proxy with no TLS handshake refused.
Only then does it remove the old certificate and its trust. On a failure, an error or an
interrupt, it puts the old files back, restarts the proxy and removes the new trust.
Copies of the old files stay in `renewal/<time>/`.

On 21 November the trust install needed no confirmation. Removing the old trust showed
macOS's "You are making changes to the System Certificate Trust Settings" dialog, so
someone must be at the Mac. The run took 93 seconds, and maps stopped for 44 of them,
during the proxy restart. 397 days is within Apple's limits: 825 days for a certificate
the user trusts; the 398-day limit applies only to certificates from the authorities
macOS ships.

Renewal never installs wider or permanent trust. If restoration cannot finish, keep the
recovery material, hold collection and notify the operator. After an app-owned key is
verified, remove obsolete trust and routing with the existing scoped setup tools. Never
suppress TLS validation.

## Validation

Run TypeScript tests and type checking through the repository's existing tools.
The Python suite currently runs locally. A ready-to-add CI step is in
`scripts/ryde-bridge/ci-step.yml`: the connected GitHub OAuth app lacks workflow
scope, so this change does not modify `.github/workflows/ci.yml`.
Protocol tests require the isolated Mac venv or a clean environment with
`scripts/ryde-bridge/requirements.txt`:

```sh
PYTHONPATH=scripts/ryde-bridge python -m unittest discover -s scripts/ryde-bridge -p 'test_*.py' -v
npx vitest run server/rydeBridge.test.ts server/rydeApp.test.ts server/snapshotServer.test.ts
npx tsc --noEmit --incremental false
```

The protocol tests are offline and use generated test keys and synthetic tokens.
They cover durable recovery, fresh-proof preservation, app-readable translation,
renewal, restoration, rejection holds and detecting a rotation outside the proxy.

## Evening live validation artifacts

The local harness `scripts/ryde-bridge/liveValidation.ts` exercises the same HTTP
broker and native worker with a temporary loopback-only broker token, removed on
exit. It sends no native credential out of the Mac and enables no feed. Bundle it
with esbuild for Node, and run the bundle on the Mac. Optional
`RYDE_VALIDATION_CELL_M` and `RYDE_VALIDATION_REQUESTS` bound its grid and budget.
It records before/after reference observations and private, pseudonymized scan
results beneath `producer/validation-<UTC>/`; no raw hardware IDs are exported.

The first complete bounded run is `validation-20261104T194256153Z`. Its summary
records 80 scan queries, 3 unfinished cells, 1,023 observations and no omissions
among 89 stationary reference observations. Earlier short failed runs are retained
privately as diagnostics; they are not coverage evidence.

For a supervised overnight sample after the acceptance checks pass:

```sh
python3 scripts/ryde-bridge/install.py --shadow-hours 12
```

This installs the normal-user `com.scootradar.ryde-shadow` LaunchAgent, takes the
exclusive worker lock, samples every two minutes and stops on failure. It records
sample ages, native renewals and process RSS. It never publishes a production feed.
This is optional diagnostic tooling; the operator waived its use as a rollout gate.

## Finer scan and overnight pilot, 4–5 November

The second scan used a different, 1,000 m grid and skipped cells outside the
reviewed operating rings. It completed all planned cells in 66 spatial reads
plus two reference reads, retaining 1,023 distinct observations. There were no
broker expiries or rejected results. All 90 stationary reference scooters inside
the operating area were present. One additional stationary reference point was
outside the operating rings and was intentionally filtered; the raw reference
count was 91, not 90. The reference helper now reports that distinction explicitly.

The first and second scans retained the same number of scooters, with eight IDs
present only in each scan. Availability/position changes between observations
remain possible. This is empirical validation within the reviewed operating
area and the observed 100-result saturation behaviour. It does not establish a
universal nearest-N rule, an upstream quota, or a guaranteed total fleet count.
Observation age and unknown provider position timestamps retain their existing
meaning. The tested 1,000 m grid is now the Drammen configuration.

Private evidence: `producer/validation-20261104T200153530Z/summary.json`,
`scan.json`, and `reference-analysis.json`. The latter records zero missing
eligible reference observations and the one intentionally excluded point.

The normal-user `com.scootradar.ryde-shadow` LaunchAgent started at
**4 November 21:09:53 Europe/Zurich**, ending after 12 hours at about
**5 November 09:09:53 Europe/Zurich**. Its first Drammen sample succeeded and
included an accepted native renewal. It samples Drammen and Göteborg every two
minutes and stops at its first failure. The Mac's actual AC configuration has
`sleep=0`; no power setting was changed. The operator waived lock-screen testing
because this Mac is operated unlocked.

Check `producer/shadow-status.json` and `producer/shadow.jsonl` after the pilot.
Require a completed run with no held state, expected sample spacing, successful
renewals and bounded resource use before setting `uptimeValidated` and its
evidence. Review interruptions rather than averaging them away. The collector
now enforces uptime review independently of coverage review. No broker token,
worker origin or production area has been enabled by this pilot.

Idle waits in both workers observe a stop request within one second, rather than
holding the worker lock through the full two-minute sample interval. The existing
clean-stop command can then acquire the lock and verify native-key restoration.

An automatic, one-off review is scheduled in the existing work context for
**5 November at 09:15 Europe/Zurich**, after the sampler's expected finish.
It will disable its own timer before auditing the results and continuing the
already-authorized rollout work. The timer's private identifier is in the runtime
resume status; it is not an instruction to enable a feed without reviewing the run.

## First soak held and restart, 4 November

The initial overnight run stopped after three successful samples. Its failure
status at 21:16:45 was `TimeoutExpired` in the local app-control/diagnostic path.
The lifecycle journal ended after termination, while later authenticated native
map responses still succeeded. The exact timed-out helper operation was not
retained by that version; the evidence does not show an upstream rate-limit or
expired session.

Status collection is now best-effort. A LaunchServices open-completion timeout
waits for the authenticated native map response instead of immediately aborting
or restarting the app again. The one fallback trigger waits longer for startup,
and local job deadlines match the broker's two-minute budget. A regression test
covers a timed-out callback followed by a successful native reply. A live map
request then succeeded without another sign-in.

Each new shadow run has its own `runId`, preserved in terminal status and journal
entries. Filter the journal by the current run ID when judging completion or
sample gaps. Retained earlier failed runs must not count toward the new soak.
The restart began on 4 November at 21:27:45 Europe/Zurich, ending about 09:27:45
on 5 November. Automatic review moved to **09:33 Europe/Zurich**. Earlier start,
finish and review times above describe the failed first attempt.

## Capacity and multi-city scheduling

The finer Drammen sweep took 66 spatial reads in 355 seconds. Its API job latency
median was 5.128 seconds, with a 12.068-second outlier. The broker currently spaces
new jobs at least five seconds apart: a nominal maximum of 12 reads/minute or
1,440 per two hours, shared by all cities and watched requests. This is configured
capacity, not a measured upstream quota or a sustained two-hour guarantee.

At the same cost as Drammen, 64 full sweeps would require 4,224 reads. Other cities
may cost much less or more; do not extrapolate that example into a measured
coverage promise. Existing Entur/Skyss areas remain on their existing feeds.

The production plan is the existing app-map scheduling pattern: independently
refreshed spatial groups, a two-hour idle target where measured costs fit, and
watched viewport reads prioritized for approximately 30–60-second refreshes
under available capacity. Coalesce viewers of the same area, publish positive
observations progressively, and retain old ages/last-seen data elsewhere. Reserve
routine turns so interactive traffic cannot starve background coverage.

Before promising this cadence for every candidate city, survey its current
identity, operating rings, saturation behaviour and sweep cost, then sum the
account-wide budget including interactive work and recovery overhead. If it does
not fit, improve reliable request generation, adjust idle cadences or add justified
producer capacity. Increasing concurrency alone does not establish upstream quota.

## First production connection, 4 November

The CI-gated rollout loaded 2,356 refresh groups for all 64 additional cities.
Native results were accepted and positive scooter snapshots published in Germany,
Sweden and Finland through the same supervised Mac session. The first connection
exposed Cloudflare rejecting Python's default User-Agent on our cache hostname;
the worker now identifies itself as `ScootRadar-Ryde-Worker/1.0`. Authentication
remains the dedicated broker token. Startup jobs that expired before the worker
connected were rejected without refreshing snapshots. The background fill and
normal client-driven refreshes continue in production; the separate shadow
sampler and its auto-start have been removed.

## Ryde refused the Mac, 5 November

Ryde's load balancer for `api.ryde.vip` has answered every request from the
Mac's connection with `403 Forbidden` (`server: awselb/2.0`) since about
01:07 UTC on 5 November. That includes a plain unauthenticated `GET /`, which
the cache server gets a 200 for from the same address. Before that, the first
round had read about 550 maps an hour since 22:00, with one app launch and its
fence reads for each map. The app now stops on "Please check your network
connection", so every job expired and the groups it reached (Hannover's) were
reported (SCOOTRADAR-CACHE-66). Nothing was done to get past the refusal. At
02:41 UTC the worker LaunchAgent was booted out to pause production, as above.
The proxy, the native session and `producer/` are untouched. Before resuming
with `python3 scripts/ryde-bridge/install.py --worker`, confirm that a plain
request from the Mac is no longer refused, and decide on a lower pace: a
reawakened first round would read at the same rate.

Since then the worker holds itself off Ryde. When the producer sees Ryde refuse
the app (403 or 429 from `api.ryde.vip`, kept in `producer/upstream-refused.json`),
or the app fails to bring a map three times in a row, it makes no request for
15 minutes. The hold doubles each time it goes on, up to 4 hours, and
`worker-status.json` gives the reason and when it ends. The producer only reads
refusals after its proxy restarts (`install.py --restart`). The worker's other
holds work as soon as `install.py --worker` installs it. Failures to reach the
cache are not counted. They are retried after 5 seconds, doubling up to a
minute, and a result for a job the cache no longer has is dropped. A deploy
used to cost the worker two minutes of held waits. While the worker asks for no
jobs for 10 minutes, paused or holding, the cache reports that once ("The Ryde
bridge worker stopped asking for jobs") instead of each group's expiry. It saves
when that silence began with its feed states, so a restart goes on with it
until the worker asks again; counting from the restart reported the groups one
by one for 10 minutes after each deploy, then the silence again.

Every silence was the one Sentry issue SCOOTRADAR-CACHE-68, 14 events in the 6
days to 17 November 2026, and nothing in it told the AppFailing hold of that day,
from 02:33 to 20:48 CET while macOS refused to launch Ryde (below), from a Mac
switched off. The worker now says why it holds (`POST /internal/ryde/status`), and
the event's title ends with the hold it said it was in within the 15 minutes before
the report: "Ryde opened but brought no map" (AppFailing), "Ryde refused it"
(RydeRefused), "Ryde could not be opened on the Mac" (LaunchFailed), "the datacenter
pool's hourly budget is spent" (DatacenterBudget), or any other reason's code; or
"no word from the Mac" when it said nothing (the Mac off, asleep or offline, or the
worker not running). Each cause is an issue of its own, fingerprinted with the
reason or `NoWord`, and the `worker` context adds `reason`, `until`, `detail` and
`statusReceivedAt`.


A failed map transport retires that job and uses the worker's existing bounded
backoff; it does not permanently pause an otherwise valid encryption session.
Legacy transport-only holds are classified separately and released only after a
fresh successful native map decrypts and translates correctly. Renewal, session
and payload failures retain their holds. After a cold launch the enabled helper
also prepares the minimized window, waking a hidden iPhone app that may otherwise
remain suspended before it sends its first request.


If Ryde ignores graceful quit for ten seconds, the worker asks the scoped proxy
for a fresh acknowledgement that no native map or key renewal is in flight and
no recipient change remains unresolved. Only then may the lifecycle helper
force-terminate Ryde, still restricted to its fixed bundle identifier. Confirmed
termination precedes egress selection, job arming and reopening. A missing or busy
proxy acknowledgement leaves the process and routing untouched. Lifecycle records
separate a stuck graceful quit from its guarded forced recovery. This handles the
minimized native process observed ignoring all graceful quits on 9–10 November.
A helper that hangs past its 12-second timeout is treated the same way: on 27 November
at 00:40 Ryde showed its "The service is closed for the season" alert (Sundsvall's
job), the helper's quit hung three times in a row, and the worker, which only forced
a quit the helper had given up on, held itself off as LaunchFailed and read nothing
from 00:40:37 until the fourth quit gave up in time and was forced at 00:45:15.

The proxy counted a flow as in flight from its request hook until its response or error
hook, and mitmproxy can end a flow with neither: once the client side of a stream has
errored, `handle_protocol_error` drops it without the error hook. On 20 November 2026
at 19:45 CET one such flow stayed counted while Ryde ignored its graceful quits, so the
proxy refused every forced quit, about 945 of them, and the worker held itself off as
LaunchFailed ("Ryde quit stalled; native activity prevents forced recovery") and read
nothing for 20 hours, until the proxy was restarted with `install.py --restart` on
21 November at 15:59 and the next forced quit went through. Sentry had the silence once,
at its start (SCOOTRADAR-CACHE-6F). A flow mitmproxy has ended (`flow.live` false) no
longer counts, nor one older than 10 minutes (`NATIVE_FLOW_LIMIT`), whatever mitmproxy
says; `status.json` records each as `native-flow-forgotten` with `ended-without-hook` or
`outlived`. A renewal's unresolved recipient (`pendingPublic`) still keeps the forced quit
refused until the renewal's reply or Ryde's next map shows which key the app kept.

Nobody was told of those 20 hours. Sentry's one event came at the start, and Ryde's
groups expire only 3 days and 10 minutes after their last sweep, so "feed stopped" in
Grafana, which notifies no one, had the first of them about 12 hours in, and 127 by the
end. Since 21 November 2026 Grafana's "ScootRadar Ryde bridge stopped" goes to Telegram
when the worker has said it is held, for any reason, for 15 minutes, has asked for no job
for 30, or has completed none of the jobs queued for 45, and it keeps firing, with a
reminder every 4 hours, until the bridge reads a map again (docs/OBSERVABILITY.md, "The
alert rules"). Replayed over the 14 days before, it fired for each stop told in this
section: the 9 and 10 November quits, the 12 November restart, the 17 November launchd
job (once for the whole day) and this one.

Broker jobs with less than twenty seconds left are rejected without touching the
native app; broker expiry during a query also stays separate from an app timeout.
The worker immediately asks for the next job instead of accumulating app failures
and entering an hours-long hold while draining an old queue.

`config.json`'s `appBinary` is where macOS unpacks the iPhone app to run it, under
`/var/folders/…/X/…/d/Wrapper/`, and a restart of the Mac empties that folder. The
lifecycle helper's `open` of it then fails, and the worker counted each launch as an
app failure: after the restart of 12 November 2026 at 21:28 CET it held itself off as
AppFailing, 15 minutes and then 29, and read nothing until Ryde was opened by hand
from `/Applications/Ryde.app` at 22:03, which unpacked it again at the same path, so
the certificate's trust on that path still held and no sign-in was needed. The worker
now opens `/Applications/Ryde.app` itself when the unpacked folder is missing
(`INSTALLED_APP` in `worker.py`). The Mac had stopped at 18:07 CET with no clean
shutdown recorded; why was not found.

RunningBoard runs Ryde as a launchd job it submits under the same label at every
launch (`application.com.ryde.NewRyde.…`), and removes it when Ryde quits. On
17 November 2026 at 02:33 CET it took a launch's pid for that of a ShipIt updater
that had held it before ("Two equal instances have unequal identities"), so when
that Ryde quit at 02:33:54 the job was never removed. launchd then refused every
launch with error 37, "Operation already in progress" (`log show` has it; the
helper's `open` only exits 1), and the worker held itself off as AppFailing,
doubling to 4 hours, until the job was removed by hand with `launchctl remove` at
20:48. When the helper's `open` fails, the worker now removes any such Ryde job
that runs no process, records `stale-launch-job-removed` in `lifecycle.jsonl`, and
opens Ryde once more (`remove_stale_launch_jobs` in `worker.py`).

A launch that fails on the Mac (the proxy not ready, Ryde not quitting, or `open`
failing with no such job left behind) is no longer an app failure, since Ryde was
not contacted: the job goes back as `worker_failed`, the worker says `LaunchFailed`
with the reason, tries to open Ryde again every minute with no job, and leases jobs
once it opens. The lifecycle helper now says why on stderr: the chain of errors
LaunchServices gave for an `open` (domain, code and reason of each, up to four), "Ryde
did not quit within 10 seconds", or "Ryde did not stop within 3 seconds of a forced
quit". `lifecycle.jsonl` records it as `open-failed` or
`quit-failed` with `error`, and `worker-status.json` as `detail`. A wait for the
datacenter pool's hourly budget is said as `DatacenterBudget` and is not a hold
either: neither one hides a refusal Ryde makes meanwhile.

On 22 November 2026 from 17:31 CET the Mac itself ran out of room. Other work on it, four
booted iOS simulators (about 620 processes, five CPUs' worth), an `xcodebuild test` run and
a headless Android emulator, took the load average to about 600 and the swap to 20.3 of
21.5 GB. The worker's calls to the cache failed (`BrokerError`, `URLError`) while the cache
answered the Mac's other requests, Ryde's quit overran the helper's 12 seconds
(`LaunchFailed`), and no map was read from 17:31:15 to 17:48:32 (SCOOTRADAR-CACHE-66).
Nothing in the bridge was at fault and nothing in it was changed: it read maps again as
the load fell. When `--status` says `BrokerError` or `LaunchFailed` while the cache's
`/health` answers from the Mac, read `uptime` and `sysctl vm.swapusage` before anything
in the bridge.

The maps came back unevenly. Ryde's quit kept overrunning until 18:15 (one forced quit at
18:10), and the maps stopped for three to five minutes at a time until 18:33:49. Each Ryde
group whose last sweep aged out during one of those stops expired on its own, so
SCOOTRADAR-CACHE-66 fired 13 more times from 17:58 to 18:33 after it had first been
resolved. SCOOTRADAR-CACHE-6M ("stopped asking for jobs: no word from the Mac", 17:42) was
the same stop seen from the cache, which had not heard from the worker since 17:32. There
was no second cause: the Mac did not sleep or restart, and the worker kept its process.
After such a stop, resolve these issues once the bridge reads its usual 450 or so maps an
hour again, not at its first map.

The worker keeps results for a day and the Map Control helper's replies for an hour,
deleting older ones hourly, and `lifecycle.jsonl` rotates at 8 MiB with one previous
file (`lifecycle.previous.jsonl`). Nothing else reads a result once the cache has
it, and on 17 November 2026 `results/` held 91,188 files, 533 MB, and
`lifecycle.jsonl` 20 MB.

For the bridge at a glance, read only and without stopping the worker:

```sh
/usr/bin/python3 ~/.local/share/scootradar/ryde-bridge/worker.py --status
```

It gives the worker's state and hold with its reason, the maps of the last hour,
Ryde's process, any Ryde launchd job left with no process, the launches of the last
hour and the last lifecycle event, the session, the proxy, the egress pool's
rolling hour, refusal hold and cooling IPs, warm reads (on, paused or off, and why),
Map Control's launches of the last hour by answer, WindowServer's Mach ports as the
worker last read them, and when the certificate expires and collection stops for its
renewal.

Start there when "ScootRadar Ryde bridge stopped" fires. `python3
scripts/ryde-bridge/install.py --restart` restarts the proxy alone. A new Ryde sign-in,
anything that would get past a refusal from Ryde (RydeRefused, a 403 or 429) and a
faster read pace are the user's call. The rule also fires when collection stops for the
certificate's renewal, until the attended renewal is done.

## WindowServer's port table, 26 November

At 16:54 CET on 26 November 2026 the kernel killed WindowServer, and loginwindow ended
the user's session ("Window Server exited, closing down the session immediately"):
every app and lane on the Mac stopped until the user logged in again at 23:45. launchd
logged its exit reason as namespace 30, code `0xc40000000004aaaa`: an `EXC_RESOURCE`
for Mach ports, flavor "port space full", at 0x4aaaa = 305,834 ports, after 7.8 days.
WindowServer holds about 3,000 ports after a login.

WindowServer keeps about one port for good for each process that connects to it and
exits. Measured on the new WindowServer: 100 launches of Ryde Map Control left 110
ports, and 500 runs of a `ryde-lifecycle status` that read the idle time through
`CGEventSource` left 490, while the same number without that call, or of `ioreg`, left
none. A Ryde cycle, with its WebKit and view-service processes, leaves 5 to 8. By day the
worker launched Map Control about 1,500 times an hour (`status` before each read, then
`refresh`, a `prepare` right after each cold open and another after each publish), and
Ryde 200 to 320 times: about 39,000 ports a day, the 305,834 in 7.8 days.

Nothing crashed. From 16:53:16 warm reads stopped succeeding and every read went cold,
a quit and an open about every 6 seconds, until WindowServer went. Ryde exited 0 each
time, on the worker's quit. The `kLSNotifyApplicationAbnormalDeath` lines in
loginwindow's log are Map Control's exit 4, its routine refusal (a busy desktop, no
map on screen), which LaunchServices counts as a crash: 239 of them from 16:00 to 16:20,
26 in the last 52 seconds. Map Control's reply, which said which refusal, was deleted
with the request; `producer/map-control.jsonl` now keeps each answer.

Since then:

- The worker reads whether a warm read could run (screen lock, one Ryde process, 15
  seconds without keyboard or mouse input) from `ryde-lifecycle status` and IOKit's
  `HIDIdleTime`, neither of which connects to WindowServer, and asks Map Control for its
  permission only every 10 minutes. It no longer prepares Ryde right after a cold open,
  nor after a warm read that left it minimized, nor while the desktop is busy. That is
  one Map Control launch for a warm read and at most one for a cold one.
- Every minute it reads WindowServer's port count (`top`, kept in
  `producer/windowserver.json`). From 200,000 it launches nothing and holds itself off
  as WindowServerPorts. The cache tells Sentry after 10 minutes ("the Mac's WindowServer
  is close to its Mach port limit"). Logging out and back in, or restarting the Mac,
  starts a new WindowServer, and the worker goes on by itself.
- Three abnormal exits within 60 seconds of each other hold it off for 15 minutes as
  AbnormalExits, which the cache reports the same way. These are a crash report of Ryde
  or Map Control, a Map Control run that ended with no reply, and a quit or open of Ryde
  that failed. Map Control's routine refusals are not counted.

Ryde's own cold cycles, about 250 an hour by day, now leave most of the ports: some
20,000 to 30,000 a day, enough to reach 200,000 within one to two weeks of a login.
A Map Control kept running between reads would remove the remaining Map Control launches.
Fewer cold reads would mean fewer maps, which is the user's call.

