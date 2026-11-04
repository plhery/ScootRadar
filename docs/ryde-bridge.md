# Ryde bridge implementation and rollout

Status on 4 November 2026: implementation is staged; **no production Ryde bridge
feed is enabled**. Two fully automated native requests succeeded (Drammen and
Göteborg, 100 scooters each) using the same Apple sign-in. A proxy restart near
a native rotation exposed a direct-connection race. Ryde rotated back to its own
key and continued returning native map responses. Reattachment needs a new
operator Apple sign-in. The operator has left for the day and explicitly asked
that subsequent work require no password. Do not sign out or prompt again in
this session.

The fixes for proxy readiness and direct fallback, durable recovery, native
renewal and clean restoration have offline tests. They still need a live repeat;
do not equate passing fixtures with demonstrated unattended operation. No
locked-Mac, sleep/wake or overnight uptime claim has passed yet.

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
`geometryEvidence`, `coverageEvidence` and `coverageValidated: true` in
`data/ryde-bridge-areas.json`. Unknown or unreviewed areas fail startup. Existing
Ryde feeds with overlapping coverage prevent additions. The present catalog has
**no coverage-validated area**, so it cannot enable a feed yet. Once enabled,
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

The current scanner intentionally reports no certified swept bounds while the
selection rule is unknown. Failure and incomplete scans use the normal collector
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
