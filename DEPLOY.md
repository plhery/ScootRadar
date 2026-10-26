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

The authenticated rider adapters use private files beside the snapshot:
`voi-session.json` and `lime-session.json` by default, overridden with
`VOI_SESSION_PATH` and `LIME_SESSION_PATH`. They must be owned by the cache
user with mode `0600`. Seed them over stdin into the existing persistent
volume, never in Git, command arguments or Worker variables. Token rotation
is saved atomically under that volume. See [Voi](docs/voi-app-map.md) and
[Lime](docs/lime-app-map.md) for the file schemas and renewal requirements.

Lime can use several production accounts through private `/data/lime-accounts.json`
(`LIME_ACCOUNTS_PATH` overrides it). Its version-1 manifest lists non-secret ids
and distinct session filenames; each session keeps the schema above and is
renewed separately. Without the default manifest, the original single session
still works. See [Lime account configuration](docs/lime-app-map.md#production-accounts).
Install the manifest and sessions mode `0600`, owned by Node UID 1000, in the
persistent volume before the code deploys. Research uses its own account.

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
   `/feeds` lists each feed's state and scooters, without errors; the weekly
   catalog check reads the app maps and NRW.Mobidrom's feeds there (`--apps=cache`).
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
redirect, sends a link to the map as it was at `/` on to `/map`, sends a
visit to `/` from outside the site, by a browser that asks for another of the
site's languages before English, on to that language's landing page, proxies
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

When the "Web and backend", the two "End-to-end" (one per browser) and the
"iOS" jobs have passed on a commit pushed to `main`, CI's Deploy job
(`scripts/deploy-after-ci.mjs`) fast-forwards `production` to it. It moves
`production-cache` too when a file the cache is built from, as listed in
[`server/deploy-watch-paths.txt`](server/deploy-watch-paths.txt), changed
between the commit `production-cache` is at and this one. A failed or cancelled
job moves nothing, and the next commit that passes carries the change. A push
goes live about 15 minutes later: CI takes as long as the iOS job, 10 to 13
minutes, or about 7 when that skips its tests (below), then Workers Builds and
Coolify about a minute and a half each. CI runs on one commit of `main` at a
time, to the end. Of the commits pushed meanwhile only the newest waits for it,
and it carries the others: GitHub cancels a waiting run when a later push queues
another. So a commit pushed during a run goes live with the next one, up to a
run later, and a branch never moves back to an earlier commit.

The iOS job skips its tests when no file under `ios/` changed since the commit
`production` is at, which CI last passed on, and the end-to-end jobs skip theirs
when only `ios/`, `docs/` or the Markdown files at the top of the repository
changed (`scripts/ci-changed.sh`). A skipped job passes, with a notice that says
so. The web job's checks, lint and unit tests run on every commit.

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
`next.config.ts`), and every page carries the name. If the website still does
not serve it then, the job fails: the Workers build failed or hangs, the site
keeps the build before, and the log is only in Cloudflare's dashboard (Workers
& Pages › swiss-scooters › Deployments). It then compares the live
sitemap with the one IndexNow last took, which the ref `refs/indexnow/submitted`
keeps (a commit of `sitemap.xml`; `git fetch origin refs/indexnow/submitted` and
`git log -p FETCH_HEAD` show it). Right after a deploy, Next.js can answer with
the sitemap of the build before, marked `x-nextjs-cache: STALE`, while it
renders the new one: the job reads it again every 5 seconds, up to 10 times, and
logs each such read. The ref moves to the live sitemap only once IndexNow takes
every page, so a page a deploy could not send, because the build was not live in
time, its sitemap stayed stale or IndexNow refused, goes with the next deploy.
A stale sitemap or a refusal shows as a warning, not a failure. To send them sooner,
run `node scripts/indexnow.mjs --since=refs/indexnow/submitted
https://scootradar.com` once the site is live (`--dry-run` lists the pages and
sends and moves nothing; `--all` submits every page of the sitemap and leaves
the ref alone). Where the ref is missing, the job sends nothing and starts it at
the live sitemap. The key is public by design, in the file of its name at the
root of `public`, which Workers serves before `worker.ts` runs.

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

Before them it runs `npm ci` with the npm that `packageManager` in
`package.json` names, not its image's default: npm 10.9.2 rejected the
lockfile npm 11 writes once it holds `overrides.miniflare.undici`, and every
build failed from 23 to 24 October 2026. Keep `packageManager` at the npm that
writes `package-lock.json`.

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
- Resource limits: 1 CPU, 3072 MiB. No host port is exposed.
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
and at most two per host. A slow host cannot monopolize collection slots, and a
feed collected every minute takes the next free slot before any idle feed, so a
deploy that adds hundreds of feeds does not hold Switzerland back. An app-map
sweep whose client spaces every request to its host (Alpaca, BinBin, Beam, GCOO,
Kickgoing, Lime, Qick, Swing and Whoosh) takes one of its host's two slots but none of
the six: it waits on that pace, not on the cache. On 24 October 2026 such
sweeps held all six, and idle feeds elsewhere went uncollected for over half an
hour. A sweep a request asked for has two slots of its own on its host, and its
client gives it the next turn before idle sweeps: until 25 October 2026 a town
opened while two idle Lime sweeps ran waited for one to end, then shared Lime's
one request every five seconds with the other. Those requested sweeps cannot hold a host for
good: on such a host, the idle feed longest past its interval is woken once it is five minutes
past it, five before it would expire, and takes its turn with them, one feed per host at a time
(`wakeLate`). From 11:57 to 13:05 on 26 October 2026 a client polling five GCOO towns near Seoul
held both of GCOO's slots and all its turns, and the other 74 towns expired. A restart goes on with the feeds longest overdue, then those with no
record yet; it once took them in the catalog's order, and after that stall
feeds 29 minutes old waited behind ones of 21 and expired. Feeds with no record
that join feeds the cache already holds come due six at a time, 15 seconds
apart, taking their hosts in turn (`warmUp` in `server/feedScheduler.ts`): the
202 feeds added that day, all due at once, held back the feeds already on the
map for over half an hour. A cold start's feeds, an always-fast one and any a
request asks for are collected at once.
Switzerland is collected every minute; any other feed every 20 minutes (Bird's,
Spin's and Bolt's own every 13, `RETENTION_CAPS_MS` in `server/cadence.ts`), or every
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
retain vehicles only until that observation expires. Bird's, Spin's and Bolt's
own feeds' positions and parking leave memory, the snapshot file and the upstream
document cache before they are fifteen minutes old; a restart drops older ones
from the file it reads. A request for a feed whose
positions are older waits, up to three seconds, for the first of the collections
it starts of the feeds quick to collect, and answers with it; the apps ask again at
once for the others. It never waits for a slow feed, as an app map's sweep: its
last positions are shown faded meanwhile, up to three hours old or three days for
Lime's, and its sweep publishes each part as it finishes (see
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md#collection-cadence)). Parking availability expires after five minutes.
Cached metadata is reported as degraded independently and does not prevent live
vehicle timestamps advancing.
Both clients honor response expiry times, including parking expiry, during outages. Snapshots
are written atomically and restored after restarts. City totals are rebuilt
hourly, marked as an overview in the API, and rejected after three hours without
a replacement. Those of Bird's, Spin's and Bolt's own feeds are built apart, in
about a tenth of a second, and again on the five-second tick before the data
they count is fifteen minutes old, two or three times a minute; the file keeps
only the others' (rebuilding all of them takes several seconds). Unknown battery values count only when no minimum is selected.

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
for scooters and a day for zones (`src/lib/scooterProxy.ts`), or less where the
cache's `X-Scooter-Keep-Seconds` says when Bird's, Spin's or Bolt's data in it
turns fifteen minutes old (0: not kept; the browser never sees it): `meta.stale` is
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
Allocate 3072 MiB to the cache container. Node 26 gives its heap 1632 MiB of
that (1072 MiB of 2048 MiB, 816 MiB of 1536 MiB), and the heap is what runs out first. With 1536 MiB
and 594 feeds, the heap peaked at 704 MB in the day before Beam and South
Korea's three signed-out app maps were added, on 24 October 2026. GCOO's,
Kickgoing's and Swing's Korean feeds hold about 187,000 scooters at night,
neighbouring towns' feeds each holding those where their bounds overlap, and
take about 120 MB more; Beam's 54 regions held about 45,000 in their first
samples, about 28 MB. The limit went up to 2048 MiB with them. That evening,
with 777,000 vehicles in all feeds (Korea's 225,000 at night), the heap stayed
around 790 MB between collections and peaked at 925 MB, of 1,124 MB. On 25 October,
with Lime's app maps in the UK, Germany and Italy, about 935,000 vehicles in all, it peaked at
964 MB, and the limit went up to 3072 MiB (a heap of 1,711 MB) before more countries were added. In October
2026, with Europe's 128,000 vehicles, the heap peaked around 575 MiB and the process around 900 MiB while
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
of incomplete startup counts, at most every five minutes: a batch of new feeds
would otherwise rebuild them once for each feed's first collection.

ATOM Mobility (`*.rideatom.com`: Hoppy, Ride Mobility, Yoio, Elerent, 3electra, SAHAM) refuses bursts of
requests, so each of its hosts is paced at 500 ms, about two requests a second.

Qick's authenticated ATOM rider map uses a separate, stricter queue on
`app.rideatom.com`: one request every four seconds across all accounts.
Its two-kilometre views require a complete city sweep before publishing;
a cold start across all ten cities takes several minutes, and watched
cities can refresh more slowly than once a minute. A starting cache waits
90 seconds before its first request, while the cache it replaces still
runs (see [ATOM](docs/atom-app-map.md)). Keep the mode-0600
`atom-sessions.json` in the persistent `/data` volume (`ATOM_SESSION_PATH`
overrides its location). Its app identifiers and rider tokens belong only
there, never in Git or build variables. See [the session format and
verification](docs/atom-app-map.md#session-configuration-and-verification).

Whoosh's rider map reads `/data/whoosh-session.json` (`WHOOSH_SESSION_PATH`
overrides it), mode 0600, owned by Node UID 1000. It holds the rider refresh
token and app identifiers; neither Git nor build variables holds them.
All regions share one request per second. Ride-area views are subdivided when
capped, and an entire sweep must finish before publication; cold collection
and watched regions can take several minutes. The operator's season flag
produces a clean empty fleet for winter storage. See
[the session format and live verification](docs/whoosh-app-map.md).

Beam's rider map reads mode-0600 `/data/beam-session.json`, owned by Node UID
1000 (`BEAM_SESSION_PATH` overrides it). It holds Beam access and refresh tokens
and the rider id, with no Google credentials. Renewals are saved atomically in
the same private file. Its H3 batches share a 700 ms queue, and every batch of
a region must succeed before publication. See [coverage and renewal](docs/beam-app-map.md).

Bolt's rider map reads mode-0600 `/data/bolt-session.json`, owned by Node UID
1000 (`BOLT_SESSION_PATH` overrides it). It holds the rider refresh token and
the app's device id; access tokens, which last an hour, stay in memory. A
rotated refresh token is saved atomically in the same file. One request reads
a whole market, and all markets share one request every half second. See
[the session format and markets](docs/bolt-app-map.md).

LUUP's Japanese rider map reads `LUUP_REFRESH_TOKEN` and `LUUP_FIREBASE_API_KEY`
from private, runtime-only Coolify environment secrets on the Node cache.
Neither is a Worker or build variable. ID tokens stay in memory; refresh-token
rotations are saved mode 0600 in `/data/luup-session.json` (`LUUP_SESSION_PATH`
overrides the path). A replacement runtime token supersedes a previous login's
saved rotation. See [coverage, renewal and verification](docs/luup-app-map.md).

JET's Go Jet map needs no rider account. Its app signing configuration lives
in mode-0600 `/data/jet-config.json`, owned by the cache's `node` user
(`JET_CONFIG_PATH` overrides the path), never in Git, Worker or build variables.
The Node collector uses TLS 1.2 and spaces map requests 500 ms apart across
all regions. Every city's tiles must succeed before its snapshot is replaced.
See [the configuration format and verified coverage](docs/gojet-app-map.md).

BinBin's Turkish guest map needs no secret. Its one client starts a request at
most every 250 ms, four a second, across all 13 areas, with three of a sweep's
under way at once and at most two sweeps on its host. A sweep asks ten
scooters at a time until its area is proven complete. On 24 October 2026 the 13
areas took 4,947 requests from nothing and 3,577 planned straight after from
those positions. An area nobody looks at is swept every two hours
(`BINBIN_IDLE_INTERVAL_MS`), not every 20 minutes, so a round should take
between the two, half a request a second to two thirds on average, and an idle
area expires after two hours and ten minutes without a sweep. A cold start
keeps what failed sweeps saw for the next.
HTTP 429 stops every BinBin request for its `Retry-After`. See [pace and
failures](docs/binbin-app-map.md#pace-and-failures).

Swing's Korean app map reads `SWING_TOTP_SECRET`, the Base32 key of the app's
one-time code, from a private, runtime-only Coolify environment secret on the
Node cache. It is never a Worker or build variable, and never in Git: the
repository is public. Without it every Swing feed fails with "Swing one-time
code secret is missing or invalid". GCOO's, Kickgoing's, Alpaca's and DART's
maps need no credential: DART's sends the token "scootradar", which is no
secret ([DART](docs/south-korean-scooter-feeds.md#dart)). See [the Korean catalog](docs/south-korean-scooter-feeds.md#swing).
A GCOO town nobody looks at is collected every two hours (`GCOO_IDLE_INTERVAL_MS`),
not every 20 minutes, and expires after two hours and ten minutes without one: a
feed that sets its own idle interval, as GCOO, Alpaca, DART, ATOM, Whoosh and BinBin do
(`APP_MAP_IDLE_INTERVAL_MS`) and Lime (`LIME_IDLE_INTERVAL_MS`, three days), expires
ten minutes after it, read from the feed itself.
