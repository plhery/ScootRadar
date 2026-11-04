# Ryde bridge implementation and rollout

Status on 4 November 2026: implementation is undergoing live acceptance;
**no production Ryde bridge feed is enabled**. The operator returned in the
evening and authorized resuming the outstanding tests. Apple sign-in completed
without a password prompt. Drammen → Göteborg → Drammen succeeded on one session,
and the sequence still worked after killing the proxy and recovering its durable
state. The Mac is operated unlocked; the operator explicitly waived lock-screen
testing for this deployment.

A full local HTTP broker/worker exercise completed 82 native reads without an
expired or rejected broker result. The 80-query spatial budget retained 1,023
scooter observations, included all 89 stationary before/after reference scooters,
and left three cells unfinished. It is a partial scan, not a validated complete
feed. Geometry pruning and a finer independent scan are the next coverage check.
The explicit clean-stop test also restored an app-owned key and verified a fresh
map response. The operator then completed Apple sign-in for the independent
coverage test and overnight pilot.

The exercise exposed a second race: publishing a job before quitting the app
let a spontaneous map request claim it immediately before being cancelled by
that quit. Jobs now become visible only after graceful termination. An abandoned
in-flight slot also expires after 30 seconds, and late responses cannot clear a
newer pending job. Both transitions have regression tests.

## Components

- `scripts/ryde-bridge/RydeLifecycle.swift`: the operator-authorized helper. Uses
  NSWorkspace only for bundle `com.ryde.NewRyde`; waits for graceful termination
  and opens in the background. No arbitrary application or input automation.
- `producer_addon.py`, `native_protocol.py`, `bridge_crypto.py`: preserve genuine
  native proofs; substitute response recipients only through the authorized
  key bridge; translate replies back to app-owned keys. Each queued map job
  consumes one native request. Credentials remain on the Mac.
- `producer_runner.py`: normal-user LaunchAgent supervisor, existing scoped
  certificate/PAC transport, addon readiness handshake. Its PAC removes DIRECT
  fallback for api.ryde.vip so a proxy restart cannot silently move a key rotation
  outside the bridge. Existing connections/PAC caches remain a live-test concern.
- `worker.py`: one process lock, query deadline, app trigger, private result spool,
  outbound authenticated HTTPS broker polling, idempotent submission, held state
  on failure. Native key-renewal opportunities continue through idle relaunches.
- `shadow.py`: bounded local sampler (maximum 24 hours, minimum 120 seconds
  spacing); stops on its first failed sample and never publishes production data.
- `server/rydeBridge.ts`: account-wide bounded queue. Coalesces identical queries,
  leases one job at a time, reserves every fourth contested turn for routine work,
  spaces new jobs five seconds apart initially, and expires them after two minutes.
  These are conservative configuration defaults, not measured upstream quotas.
- `server/rydeApp.ts`: bounded overlapping scans, adaptive subdivision, retained
  parent observations, stable pseudonyms and a separate coverage-validation gate.
  An unfinished or unreviewed scan fails collection, preserving the old snapshot.

The worker's current client is synchronous: one account and one active native
request. Add account parallelism only after measured need and separate authorized
sessions. No native token, DPoP proof, cookie, encryption key or hardware ID belongs
on the cache server or in logs. The ID HMAC key is stable, mode 0600, on the Mac.
E-bikes are excluded; battery/range/provider position-update time remain unknown.

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

The cache reads dedicated `RYDE_BRIDGE_TOKEN` (at least 32 random characters).
Without it, worker routes return 404. It is distinct from the public snapshot API
and metrics tokens. Configure the same value and the cache's HTTPS origin in
`producer/worker-config.json` (mode 0600): keys `url` and `token`. Do not put actual
values in shell history, docs or Git. Start `worker.py` with no flags under the
Mac's normal-user service manager once live acceptance passes. Until then use
bounded `--once` and shadow runs. Do not start two workers.

- `GET /internal/ryde/job`: one lease or JSON null.
- `POST /internal/ryde/result`: version 1 normalized observations, exact query and
  job identity, original observation time and `coverage: "unknown"`.
- Results are bounded, checked for age, duplicate IDs, unexpected fields and
  distance from the requested centre; acknowledgements are idempotent. A server
  restart expires the old queue rather than accepting a result into a new job.
- The authenticated `/metrics` includes queue/completion/expiry/rejection counts,
  pending jobs and the worker's last poll time. A poll proves connectivity, not
  successful native collection. Feed expiry remains the existing cache contract.

`RYDE_BRIDGE_AREAS` is an explicit comma-separated allowlist. An area also needs
`geometryEvidence`, `coverageEvidence`, `coverageValidated: true`,
`uptimeEvidence` and `uptimeValidated: true` in
`data/ryde-bridge-areas.json`. Unknown or unreviewed areas fail startup. Existing
Ryde feeds with overlapping coverage prevent additions. Drammen has passed the bounded empirical coverage review. The present catalog
has **no uptime-validated area**, so it cannot enable a feed yet. Once enabled,
normal ScootRadar refresh demand reaches the same collector and shared broker;
no new web/iOS refresh control is required. City/catalog presentation must be
reviewed with each rollout, alongside geometry and source ownership.

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

Next live validation after reattachment:

1. Repeat a reference viewport immediately before and after the scan. Keep its
   timestamps; compare only sufficiently stable observations.
2. Scan the six operating rings with overlapping queries and subdivision where
   counts reach the observed saturation candidate. Keep parent observations and
   newest observations of each scooter. A low count does not independently prove
   completeness; a depth/request/time limit leaves explicit unfinished work.
3. Compare repeated shifted/finer scans against the first union and investigate
   interior omissions. Establish a defensible coverage rule; do not reuse the
   nearest-N completeness assumption from other adapters without Ryde evidence.
4. Measure cold/warm cost, queue wait and total sweep age. Split into independently
   refreshed groups if a sweep cannot fit the feed's freshness window.
5. Run shadow mode overnight, backgrounded and locked, and exercise network loss,
   sleep/wake and app/proxy/worker restarts. Confirm normal stop and restoration.
6. Only after those pass, record evidence and enable Drammen. Validate Kristiansand
   and Göteborg next, then Helsinki/Hannover. Other official cities remain survey
   candidates, not automatically enabled feeds.

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
The source remains gated until both the soak and coverage evidence are reviewed.

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
