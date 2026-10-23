# Cloudflare deployment

ScootRadar serves its Next.js website and geocoder on Cloudflare Workers
through OpenNext. The scooter API reads persistent snapshots from a small Node
service on Netcup, managed by Coolify; user map requests never fetch GBFS feeds.

- Canonical production host: <https://scootradar.com>, to which
  `www.scootradar.com` and plain HTTP lead
- Legacy compatibility hosts: <https://scooters.plhery.com>,
  <https://swiss-scooters.plhery.com> and <https://zurich-scooter.plhery.com>

The legacy hosts redirect browser pages to the canonical host while continuing
to serve `/api/*` for older native-app installations. Their `/sw.js` remains
available on the original origin: it replaces cached web apps with a migration
worker that clears old app caches and opens the new address.

## Requirements

- Node.js 26+
- npm
- A Cloudflare account
- Wrangler authenticated with `npx wrangler login`

The cache service uses a persistent `/data` volume. Production requires a shared
`SCOOTER_SNAPSHOT_API_TOKEN` (at least 32 characters) on the cache and Worker.
The cache refuses to start in production without it; the Worker fails closed if
its secret is absent. Store it as a Coolify environment secret and a Wrangler
encrypted secret, never in `wrangler.jsonc` or source control. No database is required. The optional
`SHAREDMOBILITY_AUTH_EMAIL` setting is a public contact identifier, not a
credential. Do not put actual credentials in Wrangler `vars`; use encrypted
Worker secrets if future features require them.

The cache also reads `METRICS_TOKEN` (at least 32 characters in production), which
opens `/metrics` to Prometheus, and `SENTRY_DSN`, which turns on Sentry. Both are
optional Coolify secrets; see [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md).

## Validate locally

```bash
npm ci
npm run check:dependencies
npm run check:providers
npm run check:api-contract
npm run lint
npm test
npm run cf-typegen
npm run build
npm run test:e2e
npm run preview
```

## Deploy

For the first release requiring authenticated origin access, use this order:

1. Generate a random service token (for example `openssl rand -hex 32`). Save the
   same value in the cache's Coolify environment as `SCOOTER_SNAPSHOT_API_TOKEN`
   and in the Worker using `npx wrangler secret put SCOOTER_SNAPSHOT_API_TOKEN`.
   Do not print or commit the token. Update the Coolify setting before redeploying
   the cache, but leave the existing container running until step 3.
2. Deploy the Worker with `npm run deploy`. It sends the token to the existing
   origin; this remains compatible with the previous cache release.
3. Deploy the cache. Its scooter API now requires the Worker credential. Normal
   requests to the public origin without it must return 401, while requests through
   `https://scootradar.com/api/scooters` must succeed.
4. Check `/health` for collector liveness and `/ready` for usable live feeds.
   Grafana alerts on the cache's metrics (see [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)).
   Keep the container's restart health check on `/health` so operator outages do
   not cause a restart loop.

The origin also limits authenticated clients to 60 requests/minute and bounds
open API responses. The Worker overwrites the forwarded client IP using
Cloudflare's trusted header. Origin responses are private/no-store; only the
Worker publishes the public response cache policy.

After this one-time migration, keep both sides on the same secret during normal
releases. Update the secret on both sides before any planned rotation cutover.

OpenNext builds `.open-next/worker.js`; `worker.ts` applies the legacy-host
redirect, sends a link to the map as it was at `/` on to `/map`, proxies
`/api/scooters` and `/api/zones` (the operators' zones of the map's layer, read
by the cache only for the areas viewed with it on) to `SCOOTER_SNAPSHOT_API_URL`,
and delegates other requests to
that generated Worker. Every page is prerendered at build
time and served as built, from the Worker's static assets
(`open-next.config.ts`): after a deploy, `curl -sI https://scootradar.com/`
must show `x-nextjs-cache: HIT`. The Worker also drops the parameters of the
link before a page is looked up (the browser reads them), so every link gets
the same page and no link's coordinates are written into it. Wrangler
uploads the bundle and static assets, creates the `scootradar.com` and
`www.scootradar.com` custom domains, and keeps the legacy hostnames attached to
the same Worker.

The outer Worker applies the document CSP at the Cloudflare boundary. It creates
a fresh nonce for every HTML response and uses `HTMLRewriter` to attach it to
framework scripts, Next's hints to fetch them early, and inline styles. This keeps
the policy strict without a Next.js Proxy, which OpenNext Cloudflare does not yet
support. The map's layout carries the rules of leaflet-rotate's panes in a style
of the id the library looks for (`src/lib/mapRotation.ts`), so the library adds
no style of its own, which would have no nonce. The service worker
normalizes nonce values when comparing app shells so nonce rotation does not
cause reload loops.

Production rate limiting is configured in `wrangler.jsonc`. The app fails closed
when a binding is missing or unavailable in production. Persisted invocation
logs are disabled because scooter and geocode URLs can contain precise
coordinates or address text; structured application error logs remain enabled.

Walking routes (`/api/walk`) use two more bindings: `WALK_API_RATE_LIMITER`
per visitor and `WALK_UPSTREAM_RATE_LIMITER`, one key for all visitors, which
keeps to the FOSSGIS limit of about one request a second (Cloudflare counts per
location: under real traffic, run a Valhalla of our own). `WALK_ROUTE_API_URL`
in `vars` is the routing service; only `https://` addresses are used, anything
else falls back to the FOSSGIS server. See DATA_SOURCES.md.

Address search (`/api/geocode`) asks Geoapify when the Worker secret
`GEOAPIFY_API_KEY` is set: store the key with
`npx wrangler secret put GEOAPIFY_API_KEY`. The free plan allows 3,000 requests
a day, and one search takes one to three: places within 50 km of the map
centre, places anywhere when none of those matches, and the towns of the name
for text without digits. A city of the catalog typed in full takes one; so
does an address typed with its city, unless nothing is found in the city. Each
request gets five seconds. If places fail or are slower (out of the day's
requests, key refused or down), the search asks Photon with what is left of
its ten seconds and logs `geoapify_fallback`. When Geoapify finds nothing in the
parts of the world the catalog covers, as for "دبي مول" (the Dubai Mall in
Arabic) away from Dubai, the search asks Photon anywhere with what is left too,
unless a city of the catalog starts with the text. Without the key, the search
asks Photon alone. The cache counts the requests sent to Geoapify, and Grafana
warns past 2,400 in a day (docs/OBSERVABILITY.md).

Photon is komoot's public one unless `PHOTON_API_URL` in `vars` names one of our
own; only `https://` addresses are used. Ours sits behind Cloudflare Access:
store the two halves of an Access service token with
`npx wrangler secret put PHOTON_ACCESS_CLIENT_ID` and
`npx wrangler secret put PHOTON_ACCESS_CLIENT_SECRET`. Without both, no token is
sent. Ours gets three seconds. If it fails or is slower, the search asks the
public Photon and logs `photon_fallback`; it does not when ours answers 429.
Before setting `PHOTON_API_URL`, update the privacy notice (PRIVACY.md and
`src/app/(map)/privacy/page.tsx`), which names komoot as the recipient of
address text when Geoapify cannot answer or finds nothing.

## Deploys wait for CI

Production deploys a commit only once CI has passed on it. Workers Builds and
Coolify deploy from two branches that only CI moves, not from `main`:

- `production`: the website and its Worker, through Workers Builds;
- `production-cache`: the scooter cache, through Coolify.

When the "Web and backend" and "iOS" jobs have both passed on a commit pushed to
`main`, CI's Deploy job (`scripts/deploy-after-ci.mjs`) fast-forwards
`production` to it. It moves `production-cache` too when a file the cache is
built from, as listed in
[`server/deploy-watch-paths.txt`](server/deploy-watch-paths.txt), changed
between the commit `production-cache` is at and this one. A failed or cancelled
job moves nothing, and the next commit that passes carries the change. A push
goes live about 15 minutes later: CI takes 12 to 15 minutes, then Workers Builds
and Coolify about a minute and a half each. Every commit on `main` runs CI to
the end, so a later push does not hold up an earlier one, and a branch never
moves back to a commit whose CI ends after a later one's.

The job leaves `production-cache` where it is from 23:00 to 05:30 Paris time
(AGENTS.md), and when every commit since says `[skip cd]` (or `[skip ci]`): the
change goes with the next commit that passes outside those hours. The job's
notices in the run's summary say what moved and why not.

Then the job tells IndexNow, which Bing and the engines that read its index use,
about the pages added to the sitemap or redated since it last took them
([`scripts/indexnow.mjs`](scripts/indexnow.mjs)). It waits up to eight minutes
for the website to serve the commit `production` is at, which is this one or a
later one that carries it (a re-run, or a later commit's job that ended first).
Workers Builds names the build after its commit (`WORKERS_CI_COMMIT_SHA`, in
`next.config.ts`), and every page carries the name. It then compares the live
sitemap with the one IndexNow last took, which the ref `refs/indexnow/submitted`
keeps (a commit of `sitemap.xml`; `git fetch origin refs/indexnow/submitted` and
`git log -p FETCH_HEAD` show it). Right after a deploy, Next.js can answer with
the sitemap of the build before, marked `x-nextjs-cache: STALE`, while it
renders the new one: the job reads it again every 5 seconds, up to 10 times. The
ref moves to the live sitemap only once IndexNow takes every page, so a page a
deploy could not send, because the build was not live in time, its sitemap
stayed stale or IndexNow refused, goes with the next deploy. None of these fails
the deploy; each shows as a warning. To send them sooner, run `node
scripts/indexnow.mjs --since=refs/indexnow/submitted https://scootradar.com`
once the site is live (`--dry-run` lists the pages and sends and moves nothing;
`--all` submits every page of the sitemap and leaves the ref alone). Where the
ref is missing, the job sends nothing and starts it at the live sitemap. The key
is public by design, in the file of its name at the root of `public`, which
Workers serves before `worker.ts` runs.

To deploy a commit of `main` without waiting, push it to the branch, for
example `git push origin <commit>:production-cache`. A branch only moves
forward: never force-push one, or the next Deploy job fails until it is behind
`main` again. Rolling back is done in Cloudflare and Coolify (Rollback below).

## Cloudflare Workers Builds

The GitHub repository is connected to Cloudflare Workers Builds. Its production
branch is `production`, chosen in the Worker's Settings › Build › Branch
control, with:

```bash
npx opennextjs-cloudflare build
npx wrangler deploy
```

Use `npx wrangler versions upload` for non-production branch previews. After a
GitHub repository or Worker rename, verify the build connection in Cloudflare;
the repository is identified by GitHub internally, but the target Worker name
must remain `swiss-scooters`. This is the internal Worker identity; the public
app name and canonical domain are ScootRadar and `scootradar.com`.

## Netcup scooter cache

- Coolify project: `wj03x2nl1vvq9pqdnj9a5177` (Swiss Scooters).
- Application: `mouc13tsnvylg0v9ee9wp5v5` (Scooter feed cache).
- Repository: `plhery/ScootRadar`, branch `production-cache`, Dockerfile `/server/Dockerfile`.
- Origin: `https://scooter-data.plhery.com`, container port 3001.
- Persistent named volume: `mouc13tsnvylg0v9ee9wp5v5-scooter-snapshots`, mounted at `/data`.
- Resource limits: 1 CPU, 1536 MiB. No host port is exposed.
- Network alias `scootradar-cache` on the `coolify` network, where Prometheus scrapes
  `scootradar-cache:3001/metrics` for the gauges and `up` (job `scootradar-cache`), and
  each container the alias resolves to for the counters (job
  `scootradar-cache-containers`, relabelled `job="scootradar-cache"`), so a deploy's
  overlap does not inflate `increase()`; see
  [Metrics](docs/OBSERVABILITY.md#metrics).
- Secrets: `SCOOTER_SNAPSHOT_API_TOKEN`, `METRICS_TOKEN` and `SENTRY_DSN`.
- No custom Docker options. The container resolves through the host's unbound,
  which asks Cloudflare and Quad9 before netcup's resolvers: those answered
  SERVFAIL for `data.lillemetropole.fr`, Lille's parking inventory, from
  11 October 2026.
- Coolify HTTP health check: `http://127.0.0.1:3001/health`, 15-second start
  period. Use the IPv4 address because the server binds to `0.0.0.0`.
- Netcup tunnel: `b1f36e92-77d5-4c92-846c-28848a492643`; exact hostname rule to
  `http://127.0.0.1:80`, routed by Coolify's proxy.

The application deploys the branch `production-cache`, which CI moves when a
commit that passed changes a file the cache is built from (Deploys wait for CI,
above). GitHub sends push events to Coolify's manual GitHub webhook,
`https://coolify.plhery.com/webhooks/source/github/events/manual`, signed with
the application's GitHub webhook secret, and Coolify deploys the application
for a push to its branch. It has no Watch Paths: CI decides, from
[`server/deploy-watch-paths.txt`](server/deploy-watch-paths.txt), and
`server/deployWatchPaths.test.ts` checks that the list matches every file of
the bundle. Coolify matches the webhook to the application by repository name,
so a renamed repository must be renamed in Coolify as well. After a deploy,
`/health` and `/ready` return 200 again.

Workers Builds deploys the website from the same commit, at about the same time
as the cache. When the website needs a cache change first, as the
origin-authentication migration above did, push the cache change alone, wait
for `/ready`, then push the rest. Coolify's Deploy button deploys
`production-cache` as it is.
Coolify remains the source of truth for the application, storage, and resource limits.

The collector schedules each feed independently, with six concurrent systems
and at most two per host. A slow host cannot monopolize collection slots.
Switzerland is collected every minute; any other feed every 20 minutes, or every
minute for 10 minutes after a map request covers it, the request starting a
collection at once when the last is over a minute old (see
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md#collection-cadence)). To collect
another country every minute whether or not anyone looks, set
`SCOOTER_ALWAYS_FAST` in the application's Coolify environment to a
comma-separated list of country codes or source keys, such as `CH,FR`, and
redeploy; `all` restores the old minute-for-everything. `SCOOTER_IDLE_INTERVAL_SECONDS`
(1200), `SCOOTER_ACTIVE_INTERVAL_SECONDS` (60) and `SCOOTER_WATCH_SECONDS` (600)
tune the rest. Vehicle results are published immediately, before optional
parking completes; city overview rebuilding is batched every five seconds, and
the snapshot is written to disk a feed at a time, once a minute and on shutdown.
Discovery/type/pricing metadata lasts an hour, but a scooter naming a pricing
plan the cached plans don't list (Lime's rate changes through the day under new
plan ids) has that feed's plans fetched again, at most every two minutes or
their ttl if longer, and backing off for a plan still missing. The map shows
positions only while their timestamp is within fifteen minutes; failed feeds
retain vehicles only until that observation expires. A request for a feed whose
positions are older waits up to three seconds for the collection it starts. Parking availability expires after five minutes.
Cached metadata is reported as degraded independently and does not prevent live
vehicle timestamps advancing.
Both clients honor response expiry times, including parking expiry, during outages. Snapshots
are written atomically and restored after restarts. City totals are rebuilt
hourly, marked as an overview in the API, and rejected after three hours without
a replacement. Unknown battery values count only when no minimum is selected.

Zoom 0–10 returns one count per city; 11–15 returns spatial clusters; 16–22
returns individual scooters. Old clients understand the same `clusters` and
`vehicles` representations. Optional `city`, `overview`, `refreshAfterSeconds`,
and `availableProviders` fields enrich current clients.

Run the origin locally:

```bash
npx esbuild server/scooter-cache.ts --bundle --platform=node --format=esm --outfile=/tmp/scooter-cache.mjs
SCOOTER_SNAPSHOT_PATH=/tmp/scooters.json node /tmp/scooter-cache.mjs
curl http://localhost:3001/health
```

The public API has edge rate limiting. The cache server logs feed counts,
observation ages, and feed failures; it does not log map URLs, coordinates, or caller IPs.
(A Sentry report of a failed request does keep its URL, never the caller's IP.)
It also logs `snapshot_feed_state` whenever a feed moves between `ok`, `failing`
(the previous positions are still served) and `expired` (nothing is served and
the map says the provider is not sharing data), with the age of its data. That
includes a feed that expires between two collections without any error. Netcup's
Alloy keeps these lines in Loki for 30 days under `app="scootradar-cache"`; in
Grafana: `{app="scootradar-cache", event="snapshot_feed_state"} | json | feed="national:voiscooters.com"`.
When the origin fails, the Worker answers again with the last good answer to
the same request that its Cloudflare data centre keeps, up to 15 minutes old
for scooters and a day for zones (`src/lib/scooterProxy.ts`): `meta.stale` is
true, which the apps show as delayed, and `X-Scooter-Last-Good-Age` gives its
age in seconds. Without one, the map shows its "temporarily unavailable"
banner. Either way the Worker logs `scooter_origin_failure` with the origin
status or error name, and `lastGoodAge` when it gave a last good answer; read
it in the Worker's Logs in the Cloudflare dashboard. The cache's Prometheus metrics, Grafana
dashboard and alerts, and Sentry reports are described in
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md).

## Public launch checklist

1. Confirm the new hostname renders without Cloudflare Access authentication.
2. Confirm the legacy homepage returns a `308` to the canonical hostname.
3. Confirm legacy `/api/scooters` and `/api/geocode` requests still work.
4. Verify valid scooter and address queries, bounds validation, `429` responses,
   and upstream outage behavior.
5. Test a fresh PWA install and an update from each legacy origin. Confirm the
   old app opens the canonical host and clears its `swiss-scooters-*` and
   `zurich-scooter-*` caches.
6. Test the native iOS app against the canonical endpoint.
7. Check only structured, non-location-bearing application errors are persisted.
8. Monitor latency, `429`, `5xx`, upstream failures, and Worker usage.
9. Verify the final security headers at the edge. Cloudflare zone-level HSTS
   settings override the application header; change them only after confirming
   every affected `plhery.com` hostname supports HTTPS. The `scootradar.com`
   zone has no zone-level HSTS, so the application header applies there.

Cloudflare Access should not protect the canonical hostname. Remove or narrow
any wildcard Access application only after the checks above pass. The GitHub
repository can remain private until the separate open-source publication gate.

## Rollback

Cloudflare retains Worker versions. Roll back the deployment through the
Cloudflare dashboard or Wrangler, then point all three custom domains at the last
known-good version. Do not remove the legacy hostname until installed native
clients have had a reasonable migration window.

For cache rollback, keep origin authentication enforced. Rolling the Worker back
to a version that does not send the token breaks API access; rolling the cache
back to a version that ignores it reopens the public origin. Prefer a tested
fix-forward or an earlier authenticated release. Keep `/data`.
The persisted snapshot format is versioned. Removing `SCOOTER_SNAPSHOT_API_URL`
restores the older direct-feed route, but also restores its broad-view Worker
subrequest limitation; prefer rolling back the cache image.

Parking is an optional field in the existing scooter response and snapshot
format; old clients and persisted snapshots remain readable. Deploy the cache
before the clients, then verify `/health` reports `parkingLocations > 0` and an
empty `failedParkingFeeds` list. A French request at zoom 16 includes `parking`
and `meta.parkingStatus`; zoom 15 and below omit individual parking locations.


The Germany/Italy catalog expands the collector to approximately 80 feeds.
Allocate 1536 MiB to the cache container. Node gives its heap half of that, 864
MiB, and the heap is what runs out first. In October 2026, with Europe's 128,000
vehicles, the heap peaked around 575 MiB and the process around 900 MiB while
the snapshot was saved whole every five seconds: each save built its JSON as
one string, two bytes a character as one city name is outside Latin-1, then a
buffer as long again. Measured with the US survey's feeds, each vehicle costs about 630
bytes of heap, its feed's documents included, and a save a feed at a time adds
about 80 MiB at 300,000 vehicles, where a whole save added 330 MiB of heap and a
gigabyte of process memory. Reading the snapshot back at start a feed at a time
holds 146 MiB for 300,000 vehicles, against 429 MiB read whole. The upstream
cache holds nine documents per feed and a fifth more, 2048 at least, to retain
hourly metadata across minute refreshes, dropping the least recently used beyond
that. The country catalogs are bundled into both the cache backend and the
Cloudflare web app, and the same push deploys both. City totals rebuild on
startup when the catalog adds/removes cities, even if the old hourly cache is fresh.

Dott requests are spaced by 150 ms during collection (below 400/minute), including
cold starts and hourly metadata refreshes. A full cold collection can take about
two minutes; persisted snapshots keep map requests independent of that work.
City overviews rebuild when previously failed feeds recover, avoiding an hour
of incomplete startup counts.

ATOM Mobility (`*.rideatom.com`: Hoppy, Ride Mobility, Yoio, Elerent, 3electra, SAHAM) refuses bursts of
requests, so each of its hosts is paced at 500 ms, about two requests a second.
