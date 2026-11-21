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
credential; `CONTACT_EMAIL` stands in where it is unset. Do not put actual credentials in Wrangler `vars`; use encrypted
Worker secrets if future features require them.

The website's settings are the `vars` of `wrangler.jsonc` (README.md, "Run your own"), which
the build and the Worker both read. The cache does not read that file: it takes the three it
names itself with to the feeds, in its user agent and its contacts, from its own environment.
Production's Coolify app sets `SITE_NAME=ScootRadar`, `SITE_URL=https://scootradar.com` and
`CONTACT_EMAIL=hello@scootradar.com` (since 21 November 2026), so the feeds see
`scootradar/2.0 (scootradar.com)` as before; without them it would name itself
`scooter-map/2.0 (localhost:3000)`.

The cache also reads `METRICS_TOKEN` (at least 32 characters in production), which
opens `/metrics` to Prometheus, and `SENTRY_DSN`, which turns on Sentry. Both are
optional Coolify secrets; see [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md). Since
6 November 2026 `METRICS_TOKEN` also opens `/feeds` and the detail of `/health` and
`/ready`, which name the feeds and so the operators' apps the cache reads: without
it they answer only from inside the container (no proxy header, as Coolify's health
check). `/feeds` answers 401 to anyone else, and `/health` and `/ready` keep their
status code but say only `live`, `ready`, `draining`, `updatedAt` and `version`.
The weekly catalog check sends the token from the GitHub secret `METRICS_TOKEN`, the
same value as Prometheus's in its `prometheus.yml`. To read them by hand, either
send it, or ask from inside the container:
`ssh netcup 'sudo -n docker exec $(sudo -n docker ps -q --filter name=mouc13tsnvylg0v9ee9wp5v5 | head -1) wget -q -O - http://127.0.0.1:3001/feeds'`.

The authenticated rider adapters use private files beside the snapshot:
`voi-session.json` and `lime-session.json` by default, overridden with
`VOI_SESSION_PATH` and `LIME_SESSION_PATH`. They must be owned by the cache
user with mode `0600`. Seed them over stdin into the existing persistent
volume, never in Git, command arguments or Worker variables. Token rotation
is saved atomically under that volume. See [Voi](docs/voi-app-map.md) and
[Lime](docs/lime-app-map.md) for the file schemas and renewal requirements.

RideMovi uses `/data/ridemovi-session.json` (`RIDEMOVI_SESSION_PATH` overrides
it), mode `0600`, owned by Node UID 1000. Seed it through stdin before enabling
the collector. Unlike the rotating sessions above, its lifetime is unknown
and a rejected token requires a fresh operator login. The client reloads the
file without a restart. See [RideMovi](docs/ridemovi-app-map.md).

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
   `/feeds` lists each feed's state and scooters, without errors, to the metrics
   token (see above); the weekly catalog check reads the app maps and NRW.Mobidrom's
   feeds there (`--apps=cache`).
   Grafana alerts on the cache's metrics (see [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)).
   Keep the container's restart health check on `/health` so operator outages do
   not cause a restart loop.

The origin also limits authenticated clients to 60 requests/minute and bounds
open API responses. The Worker overwrites the forwarded client IP using
Cloudflare's trusted header, an IPv6 one as its /64 (`src/lib/clientNetwork.ts`),
so a client cannot change addresses within its network to pass the limits. A box
too large for its zoom is answered at the zoom it fits, and a visitor who has asked
for 32 areas in a quarter hour no longer keeps feeds collected; a request keeps
collected only the feeds within about 80 km of its view's middle, and the rider maps
every ten minutes, not every one, from zoom 15 out. Answers name
scooters by the cache's own ids, not the operators'. A scooter keeps its id while it stands
within 100 m and is missing for less than a day (5 minutes for Bird's, Spin's and Bolt's own
GBFS feeds), across a deploy too; see [Scraping](docs/OBSERVABILITY.md#scraping). Origin
responses are private/no-store; only the Worker publishes the public response cache policy.

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
centre, then places within 5 km of it when the 20 within 50 km are all farther
or places anywhere when none of those matches, and the towns of the name for
text without digits. A city of the catalog typed in full takes one; so
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

### Map passes

The web map proves it is a browser with Cloudflare Turnstile (docs/OBSERVABILITY.md,
"Scraping"): the widget "ScootRadar map", invisible, for `scootradar.com` alone, in
the account's Turnstile settings. Its site key is the var `TURNSTILE_SITE_KEY` in
`wrangler.jsonc` (README.md, "Run your own"), which the map reads in
`src/lib/mapPassClient.ts`; without it the map never asks for a pass. Its secret is the Worker secret `TURNSTILE_SECRET_KEY`,
and `MAP_PASS_SECRET` (32 random bytes, e.g. `openssl rand -base64 32`) signs the
pass cookie, both stored with `npx wrangler secret put …`. Without either, the Worker
asks no browser for a pass and `/api/pass` answers a browser 503; every browser's
request is then a map's or another client's as before. A new `MAP_PASS_SECRET` voids
every pass: browsers ask again at their next answer, out of sight. Rotating the
widget's secret in the dashboard keeps the old one valid for a while, long enough to
store the new.
The widget's domains must list a host before a map served from it can get a pass
(previews and `localhost` are not listed: they are served as before).
Cloudflare's test keys (site key `1x00000000000000000000BB`, secret
`1x0000000000000000000000000000000AA`) always pass, for a local `wrangler dev`.
With both secrets, a browser on `scootradar.com` gets scooters without a pass only for
its network's first 20 requests of the day, then a 428 until the map has its pass
(docs/OBSERVABILITY.md, "Scraping"); `requirePass: false` in
`server/scooter-cache.ts` turns that off.

Wherever `MAP_PASS_SECRET` is set, the Worker refuses (403) a request for scooters that
is none of our maps and apps: no pass, no `X-Scooter-View`, no app's user agent. Our own
scripts send `X-Scooter-Audit` with the Worker secret `SCOOTER_AUDIT_TOKEN` (32
characters or more, e.g. `openssl rand -hex 32`; a shorter one is ignored) and count as
holding a pass. The same token is the repository secret `SCOOTRADAR_AUDIT_TOKEN`, which
the daily live contract sends, and is kept on our machines in
`~/.config/scootradar/audit-token` (mode 600), which `scripts/auditHeaders.mjs` reads
when the environment has none. It is never printed nor logged. To rotate it, write a new
one to the three places: in between, the scripts get 403.

Wherever `MAP_PASS_SECRET` is set, the Worker also refuses (403) a request for scooters or
zones whose user agent is neither a browser's nor our apps', even naming a view or holding
a pass, unless it carries the audit token: `curl` and Node audits send it. The Worker secret
`SCOOTER_BANS` refuses networks the whole API until a date, one a line; it is put from
`~/.config/scootradar/scooter-bans`, never written to the repository (docs/OBSERVABILITY.md,
"Scraping"). Without it, no network is banned.

The apps' passes need the same `MAP_PASS_SECRET`, which also signs their challenges and
the iPhone app's attested keys: a new one voids those too, and each iPhone attests a
new key at its next ask. They need no Turnstile secret: the Worker asks an app, told by
its user agent, for its pass wherever `MAP_PASS_SECRET` is set. App Attest needs
nothing more: the App ID (`HGC93X794T.com.plhery.scootradar`) and Apple's App
Attestation root key are in
`src/lib/appAttest.ts`. Play Integrity needs a Google Cloud project linked to the app
in Play Console (Protected with Play → Play Integrity API: the project ScootRadar,
`scootradar`, which has the Play Integrity API enabled and nothing else), Play
Console's response encryption managed by us (Classic requests → Response encryption →
"Manage and download my response encryption keys"), and the two keys stored as the
Worker secrets `PLAY_INTEGRITY_DECRYPTION_KEY` (the AES key) and
`PLAY_INTEGRITY_VERIFICATION_KEY` (the EC public key), each as Play Console gives
them, in base64. "Download keys" asks for an RSA public key of 2048 bits in PEM
(`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out private.pem`,
then `openssl rsa -in private.pem -pubout -out public.pem`) and downloads
`com.plhery.scootradar.enc`, which `openssl pkeyutl -decrypt -inkey private.pem
-pkeyopt rsa_padding_mode:oaep -in com.plhery.scootradar.enc` turns into a
`DECRYPTION_KEY=` and a `VERIFICATION_KEY=` line. The key pair is used once and
deleted: the keys can be downloaded again with a new one. Without the secrets,
`/api/pass` answers the Android app 503 and it goes without a pass, as before.
Switching Play Console back to Google-managed encryption voids the downloaded keys
at once.

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

The job leaves `production-cache` where it is when every commit since says
`[skip cd]` (or `[skip ci]`): the change goes with the next commit that passes
without it. It moves it at any hour. Until 28 October 2026 it held the cache
back from 23:00 to 05:30 Paris time, Norway's night bans and the 30 minutes
Sentry waits after them, as a restart then took each feed's state as its
baseline, and a scheduled run at 04:47 UTC released what the night held. The
cache now keeps those states across a restart (`feed_states_restored` in its
log, docs/OBSERVABILITY.md). The job's notices in the run's summary say what
moved and why not.

Then the job tells IndexNow, which Bing and the engines that read its index use,
about the pages added to the sitemap or redated since it last took them
([`scripts/indexnow.mjs`](scripts/indexnow.mjs)). It waits up to 15 minutes
for the website to serve the commit `production` is at, which is this one or a
later one that carries it (a re-run, or a later commit's job that ended first).
Workers Builds names the build after its commit (`WORKERS_CI_COMMIT_SHA`, in
`next.config.ts`), and every page carries the name. Every answer also names it
in an `X-ScootRadar-Build` header, the one to read by hand
(`curl -sI https://scootradar.com/ | grep -i x-scootradar-build`); the job reads
the landing page. If the website still does
not serve it then, the job fails: the Workers build failed or hangs, the site
keeps the build before, and the log is only in Cloudflare's dashboard (Workers
& Pages › swiss-scooters › Deployments). It only warns, and tells IndexNow
nothing, when the build the site serves comes before the commit and only files
the website is not built from changed since (`ios/`, `android/`, `docs/` or the
Markdown files at the top, as for the end-to-end jobs): the site is then the
same, and the next commit that changes it deploys it. It then compares the live
sitemap with the one IndexNow last took, which the ref `refs/indexnow/submitted`
keeps (a commit of `sitemap.xml`; `git fetch origin refs/indexnow/submitted` and
`git log -p FETCH_HEAD` show it). Right after a deploy, Next.js can answer with
the sitemap of the build before, marked `x-nextjs-cache: STALE`, while it
renders the new one: the job reads it again every 5 seconds, up to 10 times, and
logs each such read. It does the same while the sitemap's `X-ScootRadar-Build`
header names another build than the commit `production` moved to (`--build`):
on 29 October 2026 the landing page named the new build while the sitemap still
came from the one before, unmarked. The ref moves to the live sitemap only once
IndexNow takes every page, so a page a deploy could not send, because the build
was not live in time, its sitemap stayed stale or of the build before, or
IndexNow refused, goes with the next deploy. A stale sitemap, one of the build
before or a refusal shows as a warning, not a failure. To send them sooner,
run `node scripts/indexnow.mjs --since=refs/indexnow/submitted
https://scootradar.com` once the site is live (`--dry-run` lists the pages and
sends and moves nothing; `--all` submits every page of the sitemap and leaves
the ref alone). Where the ref is missing, the job sends nothing and starts it at
the live sitemap. The key is public by design, in the file of its name at the
root of `public`, which Workers serves before `worker.ts` runs.

To deploy a commit of `main` without waiting, push it to the branch, for
example `git push origin <commit>:production-cache`. A commit pushed straight
to `production` skips CI's tests and its type check too, which Workers Builds
does not make (`next.config.ts`): run `npx tsc --noEmit -p .` and `npm test`
on it first. A branch only moves
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
- Resource limits: 2 CPUs, 3072 MiB, set in the application's Resource Limits
  (`limits_cpus` in Coolify's database), which every deploy applies. No host port is
  exposed. It had one CPU until 14 November 2026, when the kernel's throttling of
  that CPU held the event loop at the minute's save and at each full Prometheus
  scrape (Desk [362]; [Metrics](docs/OBSERVABILITY.md#metrics)). netcup has 12 cores,
  at a load of 4.9 to 6.5 that evening.
- Network alias `scootradar-cache` on the `coolify` network, where Prometheus scrapes
  `scootradar-cache:3001/metrics` for the gauges and `up` (job `scootradar-cache`), and
  each container the alias resolves to for the counters (job
  `scootradar-cache-containers`, relabelled `job="scootradar-cache"`), so a deploy's
  overlap does not inflate `increase()`; see
  [Metrics](docs/OBSERVABILITY.md#metrics).
- Secrets: `SCOOTER_SNAPSHOT_API_TOKEN`, `METRICS_TOKEN`, `SENTRY_DSN` and
  `VISITOR_COUNT_SECRET` (32 random bytes or more, e.g. `openssl rand -base64 32`),
  the key of each network's counts of the day and hour. Without it the networks'
  limits of 1,500 requests a day and 300 an hour are off; a new one starts every
  network's day afresh ([Scraping](docs/OBSERVABILITY.md#scraping)).
- No custom Docker options. The container resolves through the host's unbound,
  which asks Cloudflare and Quad9 before netcup's resolvers: those answered
  SERVFAIL for `data.lillemetropole.fr`, Lille's parking inventory, from
  11 October 2026.
- Coolify command health check:
  `wget -q -O /dev/null http://127.0.0.1:3001/health` every 2 seconds,
  5-second timeout, 10 retries, 60-second start period. Use the IPv4 address
  because the server binds to `0.0.0.0`. A command since 30 October 2026:
  Coolify's HTTP type runs curl first, which the image lacks, so every check
  logged "curl: not found" before its wget fallback passed. Coolify accepts
  only letters, digits, spaces and `-_./:=@,+` in the command. Stop grace
  period: 60 seconds (Advanced).
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

A deploy starts the new container beside the old one, and Traefik sends it
requests once Docker finds it healthy, at its first check that passes, a few
seconds in. Coolify waits out the start period, then stops the old one with
SIGTERM, then SIGKILL after the stop grace period.
Traefik sends the old container requests until Docker finds it unhealthy, so it
answers them as before for 30 seconds (`DRAIN_MS` in
`server/scooter-cache.ts`) while `/health` and `/ready` answer 503 with
`"draining": true`. Ten failed checks two seconds apart make it unhealthy in
about 21 seconds, and Traefik reloads within two more. Then it saves the
snapshot and exits. Until 30 October 2026 it closed at once, and Traefik
answered 46 requests with a 502 in four days. The first deploy that drained,
e7df8f69's that day, had none: Traefik stopped sending the old container
requests 19.5 seconds after SIGTERM, and Coolify had removed it after 36. A
slower health check needs a longer drain, and the stop grace period must cover
the drain and the save.

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
sweep whose client paces every request to its host (Alpaca, BinBin, Beam, GCOO,
Kickgoing, Lime, Qick, Swing and Whoosh) takes one of its host's two slots but none of
the six: it waits on that pace, not on the cache. Since 8 November 2026 each app
map's client but Beam's, these and Bird's, Bolt's, Dott's, JET's, LUUP's, RideMovi's, Skyss's
and Voi's, lets a minute's worth of requests at its old spacing start at once, and
no more in any 60 seconds (`Pacer` in `server/sweeps.ts`): twelve a minute for each
Lime account, where they started five seconds apart and a town of eight views took
35 seconds. Lime's accounts together start no more than fifty calls in any ten seconds
(`LIME_ADDRESS_CALLS`): Lime answers 60 from one address in a ten-second window of the
clock and refuses the rest, whichever accounts make them (`docs/lime-app-map.md`, "The
address's ten seconds"). Only the towns someone looks at start theirs at once: an idle sweep
keeps the old spacing, so that it cannot spend the minute's turns just before a
town is opened, which could then wait up to 50 seconds for its first view. Beam's
client keeps two seconds between all its requests, as bursts have returned empty
maps (`docs/beam-app-map.md`). A client's first minute keeps the old spacing, as a deploy runs the
old cache beside the new one for about that long. On 24 October 2026 such
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
Spin's and Bolt's own every 13, `RETENTION_CAPS_MS` in `server/cadence.ts`; an operator's
app map once a day, `APP_MAP_IDLE_INTERVAL_MS` in `server/appMapCadence.ts`), or every
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
last positions are shown faded meanwhile, up to three hours old, 26 hours for
Bird's areas or three days for Lime's, and its sweep publishes each part as it finishes (see
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md#collection-cadence)). Parking availability expires after five minutes.
Cached metadata is reported as degraded independently and does not prevent live
vehicle timestamps advancing.
Both clients honor response expiry times, including parking expiry, during outages. Snapshots
are written atomically and restored after restarts. So are each feed's state and the
Sentry reports still to come of the feeds that stopped, in `feed-states.json` beside
the snapshot in `/data`, but only when saved under 10 minutes before the restart: a
longer outage starts from each feed's state at the restart, as before (see
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md#sentry)). City totals are rebuilt
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
age in seconds. Kept zones also say `meta.unavailable`, as zones have no delayed
state: the maps keep them drawn, say the zones are unavailable right now and ask
again, as for a feed the cache could not read. An answer of scooters is also kept
for its area (the zoom and the zoom's tile of its centre, the last one asked
there), and given to a view of the same zoom and filters that it holds whole,
from its tile or the eight around it, if it was not cut short (`meta.truncated`) and the cache would have
answered both at that zoom; its age and limit are kept as for its own request.
Without one, the map shows its "temporarily unavailable" banner. Either way the
Worker logs `scooter_origin_failure` with the origin status or error name,
`down` when the server did not answer, `lastGoodAge` when it gave a last good
answer and `lastGoodArea` when that was a neighbour's; read it in the Worker's
Logs in the Cloudflare dashboard. The cache's Prometheus metrics, Grafana
dashboard and alerts, and Sentry reports are described in
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md).

### Maintenance

Pages, scripts and the zones the apps download come from the Worker, so they
stay up while Netcup reboots. When the server does not answer (the request
fails or times out, or 502, 503, 504, 520–527 or 530: the tunnel gone, Traefik
with no container behind it, or the cache warming up after a start; not the
cache's own 503 for feeds that all failed), the Worker's stale answers and 503s
carry `X-Scooter-Origin: down` and `Retry-After` (30 seconds, up to two minutes
before an announced return), and the 503's JSON a `maintenance` object
`{"planned", "mode", "since", "backAround"}`. The web map and the apps then say
in a calm notice that scooter data is paused for maintenance, ask again quietly
when `Retry-After` says, and drop the notice once data comes back.

Planned maintenance is announced in the account's `MAINTENANCE` KV namespace,
which the edge guards of the other sites share: a JSON value under `all` (the
server) or `scootradar`, such as
`{"since":"2026-11-18T22:00:00Z","backAround":"2026-11-18T22:20:00Z"}`. With a
`backAround`, the Worker sends it as `X-Scooter-Back-Around` and the notice
says "back around" that time. `"mode":"hard"` stops the Worker asking the
server from `since` on, giving what it keeps instead; `{"on":false}` ends it,
and one left on ends three hours after `backAround` (or at `ends`). Each
isolate reads the namespace at most every 30 seconds, and only when the server
is down or to check for `hard`. `GET /maintenance.json` answers
`{"planned", "mode", "since", "backAround"}` from the Worker alone (no-store,
any origin). Without the binding, nothing is announced and the rest works.

`wrangler.jsonc` binds the namespace (`kv_namespaces`). The netcup server's
`maint` switch writes the announcements; by hand, for example:

```bash
npx wrangler kv key put --remote --namespace-id 8b0f39fd21c2415e83cffc05a0307b37 all \
  '{"since":"2026-11-18T22:00:00Z","backAround":"2026-11-18T22:20:00Z"}'
npx wrangler kv key put --remote --namespace-id 8b0f39fd21c2415e83cffc05a0307b37 all '{"on":false}'
```

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
before the clients, then verify `/health` (with the metrics token, or from inside
the container) reports `parkingLocations > 0` and an empty `failedParkingFeeds` list. A French request at zoom 16 includes `parking`
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
`app.rideatom.com`: 15 requests a minute across all accounts.
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
All regions share 60 requests a minute. Ride-area views are subdivided when
capped, and an entire sweep must finish before publication; cold collection
and watched regions can take several minutes. The operator's season flag
produces a clean empty fleet for winter storage. See
[the session format and live verification](docs/whoosh-app-map.md).

Beam's rider map reads mode-0600 `/data/beam-session.json`, owned by Node UID
1000 (`BEAM_SESSION_PATH` overrides it). It holds Beam access and refresh tokens
and the rider id, with no Google credentials. Renewals are saved atomically in
the same private file. Its H3 batches share 30 requests a minute, and every batch of
a region must succeed before publication. See [coverage and renewal](docs/beam-app-map.md).

Bolt's rider map reads mode-0600 `/data/bolt-session.json`, owned by Node UID
1000 (`BOLT_SESSION_PATH` overrides it). It holds the rider refresh token and
the app's device id; access tokens, which last an hour, stay in memory. A
rotated refresh token is saved atomically in the same file. One request reads
a whole market, and all markets share 120 requests a minute. See
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
The Node collector uses TLS 1.2 and starts at most 120 map requests a minute
across all regions. Every city's tiles must succeed before its snapshot is replaced; a
tile that stalls or answers a 5xx is asked for once more.
See [the configuration format and verified coverage](docs/gojet-app-map.md).

BinBin's Turkish guest map needs no secret. Its one client starts at most 240
requests a minute, four a second on average, across all 13 areas, with three of a sweep's
under way at once and at most two sweeps on its host. A sweep asks ten
scooters at a time until its area is proven complete. On 24 October 2026 the 13
areas took 4,947 requests from nothing and 3,577 planned straight after from
those positions. An area nobody looks at is swept once a day
(`APP_MAP_IDLE_INTERVAL_MS`), as every app map, so a day's sweeps should take
between the two, and an idle
area expires after a day and two hours without a sweep. A cold start
keeps what failed sweeps saw for the next.
HTTP 429 stops every BinBin request for its `Retry-After`. See [pace and
failures](docs/binbin-app-map.md#pace-and-failures).

Bird's rider map reads mode-0600 `/data/bird-session.json`, owned by Node UID
1000 (`BIRD_SESSION_PATH` overrides it): the app's device id and a rider's
access and refresh tokens, never in Git or build variables. The access token
is renewed a day at a time and saved atomically in the same file. Every Bird
area shares one budget: a town someone opens up to 20 requests a minute, an
idle sweep one every 30 seconds, and all together 50 in five minutes and 120 an
hour, about half the count after which Bird's map made up its scooters on 27
October 2026; a town opened with nothing shown has two more of each for its
first request. A made-up or refused reply holds every Bird request for 15
minutes. A starting cache counts the hour's requests of the one it replaces,
from `/data/tmp/bird-pace.tmp`. An idle area is swept
once a day, by day in its town. Production and research share the account's
limit: run no Bird research on it while the cache holds it. See [the session
format and the budget](docs/bird-app-map.md).

Swing's Korean app map reads `SWING_TOTP_SECRET`, the Base32 key of the app's
one-time code, from a private, runtime-only Coolify environment secret on the
Node cache. It is never a Worker or build variable, and never in Git: the
repository is public. Without it every Swing feed fails with "Swing one-time
code secret is missing or invalid". GCOO's, Kickgoing's, Alpaca's and DART's
maps need no credential: DART's sends the token "scootradar", which is no
secret ([DART](docs/south-korean-scooter-feeds.md#dart)). See [the Korean catalog](docs/south-korean-scooter-feeds.md#swing).
Skyss's map, which shows Ryde's Bergen scooters, needs none either
([Ryde](docs/ryde-app-map.md#the-production-reader)).
A GCOO town nobody looks at is collected once a day, as every operator's app map
(`APP_MAP_IDLE_INTERVAL_MS`, `withDailySweeps`), and expires after a day and two hours
without a collection (`APP_MAP_IDLE_GRACE_MS`): a
feed with its own idle interval, as those, Bird's (`BIRD_IDLE_INTERVAL_MS`, a day) and
Lime's and Ryde's (`LIME_IDLE_INTERVAL_MS`, `RYDE_IDLE_INTERVAL_MS`, three days), expires
its own grace, or else ten minutes, after it, read from the feed itself.

Ryde's native Mac bridge reads mode-0600 `/data/ryde-bridge.json`, owned by Node
UID 1000, from the persistent snapshot volume. It contains only a dedicated
broker token, version 1, enabled areas and the explicit production-pilot flag.
The Mac worker connects outbound over HTTPS; native credentials and encryption
keys stay on the Mac. See [the rollout and recovery runbook](docs/ryde-bridge.md).
