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
subdivision. The initial idle interval is about 16 hours, originally sized for half
the shared account turns. Under sustained visible demand, routine work now gets
one in four turns and full rounds can take longer. Each background group has at most two initial
views. The visible map uses a separate focused read, shared between viewers and
refreshed at most once a minute, so switching cities does not wait for a group's
adaptive scan to finish.
The queue coalesces identical work and serves up to three urgent reads before a
routine read while both wait. These are conservative operating settings, not an upstream quota.
Saturated cells subdivide within request/depth/time budgets (80 reads, three
halvings, 30 minutes: `RYDE_SCAN_LIMITS`); unresolved groups fail and preserve
prior observations. The reads bound a scan's cost; the time only stops one that
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
The unattended worker still relaunches Ryde for each map query, with its window
hidden. Reopening the existing process does not trigger a map request. An
interactive map pan, followed by recentering, does produce fresh authenticated
requests in the same process; recentering an already centered map does not.
This warm trigger is verified interactively. Replacing the worker's launch trigger
requires app-specific automation that preserves window focus and handles map state,
plus the existing routing lease and key-renewal checks.

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
proofs and payloads are absent from this journal. Operating-fence response caching
is not implemented: the native app still fetches its metadata normally.

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
- Results are bounded, checked for age, duplicate IDs, unexpected fields and
  distance from the requested centre; acknowledgements are idempotent. A server
  restart expires the old queue rather than accepting a result into a new job.
- The authenticated `/metrics` includes queue/completion/expiry/rejection counts,
  pending jobs and the worker's last poll time. A poll proves connectivity, not
  successful native collection. Feed expiry remains the existing cache contract.

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

The existing certificate expires **3 December 2026 at 22:41:56 UTC**. The supervisor
requests restoration seven days before expiry and refuses to start a new proxy
inside the final 15 minutes. Renewal must use the existing attended, Ryde-only
trust procedure; this implementation does not install wider or permanent trust.
If restoration cannot finish, keep the recovery material, hold collection and
notify the operator. After an app-owned key is verified, remove obsolete trust
and routing with the existing scoped setup tools. Never suppress TLS validation.

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
