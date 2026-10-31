# Observability

The scooter feed cache on Netcup (see [DEPLOY.md](../DEPLOY.md)) reports in four
places. None of them holds a map URL, coordinates or a visitor's address.

- **Prometheus** scrapes its `/metrics` every 30 seconds. **Grafana** draws them on the
  "ScootRadar — Scooter feeds" dashboard and alerts on them; only the site being down
  for its users reaches Telegram.
- **Sentry** (project `scootradar-cache`) gets unexpected errors, plus one event
  each time a feed stops being served for 5 minutes.
- **Loki** keeps its log lines for 30 days under `app="scootradar-cache"`.

The Worker is not in Prometheus or Sentry: its `scooter_origin_failure` lines are in
the Cloudflare dashboard's Workers Logs for `swiss-scooters`. Only its count of requests
to Geoapify reaches Prometheus, through the cache (see below).

## Metrics

`GET /metrics` answers 404 unless `METRICS_TOKEN` is set, and 401 without it as a
bearer token. Production requires at least 32 characters. Prometheus reaches the
container over the `coolify` network through `scootradar-cache`, a Coolify network
alias, in two jobs; the token is in its `prometheus.yml`.

- Job `scootradar-cache` scrapes `scootradar-cache:3001` as one target and keeps the
  gauges and `up`, which "target down" reads.
- Job `scootradar-cache-containers` finds each container behind the alias through
  Docker's DNS (its `instance` is the container's address, port 3001) and keeps only
  the counters and the durations' `_sum` and `_count`, relabelled
  `job="scootradar-cache"`. Its own `up` keeps the job's name. It asks for
  `/metrics?only=counters` (`params: {only: [counters]}`), which renders the counters
  alone: no per-feed gauges, which took most of a render, and no reading of the event
  loop's delay, whose histogram each full render resets. Since 28 October 2026 at
  09:31 UTC.

During a deploy the alias answers from the old and the new container in turn. A gauge
survives that, but a counter read through it falls each time the new container answers
after the old one, and `increase()` and `rate()` took each drop for a restart and counted it
again. Since 20 October 2026 at 16:52 UTC each container's counters are series of
their own, so a query adds them up with `sum`.

Labels hold feed ids, sources, providers, countries, routes and status codes only. The
feed series follow the snapshot at each scrape, with the states of the
`snapshot_feed_state` log line; feeds never attempted are left out, and so are skipped
feeds, whose operator lists nothing at all, but for the vehicles, pause and country of
those not from sharedmobility.ch (see [Empty feeds](#empty-feeds)):

- `scootradar_feed_state{feed, source, provider, state}`: 1 for the feed's state, 0 for
  the others, judged by the feed's cadence (see [Collection cadence](#collection-cadence)).
  `ok` is served, or would be as soon as someone looked; `failing` means the last
  collection failed and the previous positions are kept; `expired` means the feed is
  late for its cadence and the map says the provider is not sharing data. A Swiss feed
  collected every minute, or a watched feed, expires when its positions are over 15 minutes old; an idle feed only
  after 30 minutes without a successful collection.
- `scootradar_feed_paused`: 1 while every service area of the feed is in its seasonal
  pause (`seasonal` in its catalog, as Montréal each winter), or while its operator says
  its season is over (Whoosh's `seasonIsOver`, as in Almaty since 24 October 2026), else 0. The feed may then
  serve nothing: the map says when its scooters are back rather than that the provider is
  not sharing data, Sentry is not told it stopped, and "feed stopped" and "feed empty"
  ignore it.
- `scootradar_feed_curfewed`: 1 while a night ban (data/rental-curfews.json) holds at
  every service area of the feed, else 0. Its operator may take the feed down until
  morning, as Dott does in Trondheim on Friday and Saturday nights while Entur keeps
  serving its last positions: Sentry and "feed stopped" hear of it only if it is still
  expired 30 minutes after the ban.
- `scootradar_feed_vehicles`: available standing scooters held, 0 once expired, or while
  the operator lists none, or for Bird's, Spin's and Bolt's own feeds once their data is
  fifteen minutes old and dropped (which "feed empty", over 3 days, ignores).
- `scootradar_feed_priced_vehicles`: of those, the scooters with a price. The others
  name no plan (Bird, PubliBike), a plan the feed's plans don't list, or one the app
  cannot show as an unlock fee and a minute price.
- `scootradar_feed_info{country}`: 1, with the feed's country in English
  (`Switzerland` for the national, Hopp and PubliBike sources), for alerts to name.
- `scootradar_feed_observation_timestamp_seconds`: the source's own timestamp of the
  positions held, none for a feed with no positions yet. `time() -` it is their age; an
  idle feed's may pass 15 minutes.
- `scootradar_feed_attempt_timestamp_seconds`, and `scootradar_feed_parking_up` for
  regional feeds: parking as fresh as the cadence promises (5 minutes for a feed
  collected every minute, 30 for an idle one). Not for the app maps, which collect no
  parking; `/ready`'s `failedParkingFeeds` leaves them out likewise.
- `scootradar_feeds_by_cadence{cadence="always|watched|idle"}`: feeds on each cadence now.
- `scootradar_collections_started_total{reason}`: `always`, `watched`, `wake` (a request
  found the data over a minute old), `late` (an idle feed on a paced host, woken five minutes
  before it would expire), `idle` and `retry` (an idle feed that failed).
- `scootradar_request_waits_total{outcome="collected|timeout"}`: requests that waited for
  the collection of feeds whose positions were over 15 minutes old.
- `scootradar_upstream_requests_total{kind="status|metadata"}`: requests sent to
  operators; status covers positions and parking, metadata what is kept an hour or more.
- `scootradar_lime_account_requests_total{account,kind="status|metadata"}`:
  requests per independently paced Lime production account, including each
  account's renewals. The account label is its non-secret manifest id.
- `scootradar_lime_wake_clients_total{refreshes="1|2-3|4-7|8-15|16+"}` and
  `scootradar_lime_wakes_total{refreshes}`: visitors whose requests set off refreshes of
  Lime rider-map feeds, by how many they set off in a quarter hour (UTC), and those
  refreshes. Each counts when its quarter hour closes. A visitor is told apart by a
  hash of their address salted afresh by each process, held only until the quarter
  hour closes; no address is kept. Since 28 October 2026, to tell whether a few
  visitors take most of the accounts' requests (a cap on each visitor would spare
  them) or everyone does (a fourth account would): e.g. the share of refreshes from
  visitors with more than 7 is
  `sum(increase(scootradar_lime_wakes_total{refreshes=~"8-15|16\\+"}[7d])) / sum(increase(scootradar_lime_wakes_total[7d]))`.
- `scootradar_pricing_plan_refreshes_total{outcome="listed|unlisted"}`: a feed's
  pricing plans fetched again because a scooter named a plan they did not list, as
  Lime's do when its rate changes; `unlisted` if one is still missing afterwards or the
  fetch failed. A feed's plans are fetched again at most every two minutes (or their
  `ttl`, if longer); a plan still missing is looked for after 2, 4, 8… minutes, up to
  the hourly refresh of all metadata.
- `scootradar_geoapify_requests_total{version}`: requests the Worker's address searches
  sent to Geoapify. Once its answer is out, a search that asked Geoapify posts the number
  to the cache's `POST /api/geocode-usage?geoapify=N`, with the token the Worker reads
  scooters with; a failure is logged as `geoapify_count_failure` in Workers Logs and
  not retried. By build, as the old and new containers both answer during a deploy.
- `scootradar_feed_collections_total{outcome="ok|failed"}` and
  `scootradar_feed_collection_duration_seconds_sum/_count`, per feed.
- `scootradar_http_requests_total{route, status}` and
  `scootradar_http_request_duration_seconds_sum/_count{route}`. A route is a known path
  without its query, or `other`.
- `scootradar_snapshot_updated_timestamp_seconds` (a collection finished),
  `scootradar_discovery_success_timestamp_seconds`,
  `scootradar_overview_generated_timestamp_seconds` and `scootradar_build_info{version}`.
- `process_*` and `nodejs_*`: memory, CPU, start time and event loop delay.

Counters start at zero with the process; the dashboard's "Deploys" annotation marks
restarts.

## Collection cadence

Few people use the map, so the cache collects a feed every minute only where someone
looks:

- **Always**: the sources in `SCOOTER_ALWAYS_FAST` (Switzerland by default) every minute. `CH`
  means its open data, `national`, `hopp` and `publibike`, and not `switzerland`, Lime's Kloten map.
- **Watched**: a map request covering a feed keeps it on the minute for 10 minutes. If
  its last collection is over a minute old, the request starts one at once.
- **Idle**: every other feed every 20 minutes, each at its own time in the interval
  (from a hash of its id), so about eight a minute start. A failed collection is
  retried after 1, 2, 4, 8, then every 10 minutes, half the interval. The app maps
  read in slow paced sweeps are collected every two hours when idle, for the requests
  they take (`APP_MAP_IDLE_INTERVAL_MS` in `server/appMapCadence.ts`): BinBin's
  ([guide](binbin-app-map.md#pace-and-failures)), GCOO's, ATOM's and Whoosh's. Lime's
  are every three days, so that sweeping all its markets takes at most half of the
  requests a single account may send, even with several configured production
  accounts, in each town's daytime, and at 08:00 after a sweep by night
  ([guide](lime-app-map.md#cache-behaviour)). Any idle feed collected in a night ban is
  collected again within a quarter of an hour of its end (`feedCurfewEnds`). Each
  expires 10 minutes after its own interval and waits up to half of it between
  retries. The app maps read in a few requests keep the 20 minutes, so that one that
  stops answering is reported within half an hour. Bird's, Spin's and Bolt's own feeds
  are collected every 13 minutes, as their licences let their data be kept 15
  (`RETENTION_CAPS_MS` in `server/cadence.ts`); the cache drops it then, but they
  expire after 30 minutes without a successful collection, as the others.

Feeds are sorted by how long a collection takes, timed on each (`collectionMs` on the
feed's record, smoothed over the last few; until it is timed, an app map's counts as
slow). One that takes over 3 seconds (`SLOW_COLLECTION_MS`), as an app map's sweep of
a town, is slow: a request never waits for it. A quick one is waited for when its
positions are over 15 minutes old: the request answers as soon as the first such feed
is in, with those that come within 300 ms of it (`JOIN_WAIT_MS`), and after 3 seconds
at most (`COLD_WAIT_MS`).

When a collection it started is still under way, the answer carries
`meta.refreshing: true` with `refreshAfterSeconds: 3`, is not cached, and says when
to ask again in `meta.followUpMs`: 0 while a quick feed is still on its way, whose
next request the cache holds until the next such feed is in, so each operator's
scooters show as soon as it answers; 3000 while only slow feeds are. The web app
asks again then, as often as it is told, at least 200 ms apart; the iOS app from
the build after 26 October 2026. Older apps ask once more 3 seconds later, or every 3
seconds while scooters stand faded, and otherwise after their usual 10 seconds.

A slow feed's sweep can take minutes, so while one runs for a request:

- it starts where the request looked, and follows the view when the next request
  looks elsewhere; its client gives a town someone looks at the next turn before
  idle sweeps of other towns (`Pacer` in `server/sweeps.ts`), and the scheduler
  gives it two slots of its own on its host;
- each part it finishes is published at once (at most every 2 seconds), and the
  answer shows the scooters found so far;
- the answer carries `lastSeen`, the feed's previous positions where the sweep has
  not looked yet, and `meta.lastSeenAt`; the apps draw them faded, count them nowhere,
  and keep asking every 3 seconds while they stand. They stand up to 3 hours old, or
  until the feed is due again while nobody looks for one collected less often: three
  days and 10 minutes for Lime's groups (`lastSeenMaxAgeMs` in
  `server/scooter-cache.ts`). The dock gives the day of the week of a time on
  another day. A feed quick to collect has none: it is waited for instead.

A request collects again only the six Lime groups nearest the middle of its view,
and keeps them watched for 3 minutes rather than `SCOOTER_WATCH_SECONDS`: every Lime
town shares 36 requests a minute. The other groups in view stay idle; their old
positions stand faded the same way, outside the answer's state
([lime-app-map.md](lime-app-map.md)).

The cadence comes from the cache's environment, every value with a default:

| Variable | Default | |
| --- | --- | --- |
| `SCOOTER_ALWAYS_FAST` | `CH` | country codes (`CH`, `FR`, `DE`…) or source keys, comma-separated, or `all` |
| `SCOOTER_ACTIVE_INTERVAL_SECONDS` | 60 | always-fast and watched feeds |
| `SCOOTER_IDLE_INTERVAL_SECONDS` | 1200 | idle feeds; their expiry is this plus 10 minutes |
| `SCOOTER_WATCH_SECONDS` | 600 | how long a request keeps a feed watched |

## Dashboard and alerts

[observability/grafana/scootradar-cache.json](../observability/grafana/scootradar-cache.json)
is the dashboard; the alert rules are in
[observability/grafana-alerts/scootradar-alerts.json](../observability/grafana-alerts/scootradar-alerts.json).
Both go in Grafana's ScootRadar folder. After changing either, run:

```bash
npm run grafana:sync            # dry run: lists what would change
npm run grafana:sync -- --apply # makes Grafana match the files
```

The script runs `curl` inside the Grafana container over `ssh netcup`, so the admin
credentials never leave it. Rules in the group missing from the file are deleted, and
the dashboard is overwritten: change them here, not in Grafana's UI.

The per-feed rule only covers feeds served more than half of the last seven days,
so a feed that is fresh only now and then does not fire every hour. When it was
written, about 70 of the 146 feeds never served. Each kind is now handled where it
arises:

- Dott's German regions, private since September 2026, left the catalog; a region
  Dott pauses (403 `ERR_REGION_OFFLINE`, as Tignes out of season) is skipped, and the
  weekly [catalog check](../.github/workflows/catalog-check.yml) fails when an entry
  is gone.
- A Swiss system whose positions are over a week old, or never sent, counts as
  inactive, as Bird in Biel and Schaffhausen. Bird Grenchen, inactive since August
  2026, is left out of collection with its town (`LEFT_OUT_SWISS_SYSTEMS`).
- Velospot's copy on sharedmobility.ch, 15 to 75 minutes behind, gave way to the
  PubliBike app's station list (feed `publibike-stations`).

The alert rules:

| Rule | Fires when |
| --- | --- |
| ScootRadar cache target down | Prometheus cannot scrape the cache for 3 minutes |
| ScootRadar serves no scooters | every feed has expired for 5 minutes |
| ScootRadar down for 15 minutes | either of the two above has held for 15 minutes: users see no scooters. The one rule sent to Telegram (see below) |
| ScootRadar collector stalled | no collection has finished for 5 minutes (Swiss feeds alone finish one every few seconds) |
| ScootRadar feed stopped | a feed served more than half of the last 7 days has been expired for 10 minutes (15 for Voi Switzerland, as Sentry), by its cadence's rule; one alert per feed. Not in its seasonal pause, whose days count as served, so a feed that does not come back after its season is reported; nor under a night ban at all its service areas, until 30 minutes after it, as Sentry (the ban holds the feed out for 20 minutes after it ends, then the rule waits its 10) |
| ScootRadar feed empty | a feed has listed no available scooter for 3 days, outside its seasonal pause (see [Empty feeds](#empty-feeds)); a warning |
| ScootRadar feed discovery stale | no successful discovery for 2 hours |
| ScootRadar cache restarting | one build has restarted more than three times in an hour (a deploy is not counted) |
| ScootRadar cache memory high | over 2.7 GB, or a V8 heap over 1.5 GB, for 15 minutes (the container's limit is 3072 MiB, of which Node gives the heap 1632 MiB, and the heap runs out first) |
| ScootRadar Geoapify near its daily limit | address searches sent Geoapify over 2,400 requests in 24 hours (its free plan allows 3,000 a day); a rolling day, so it fires no later than the calendar day does |

While the cache cannot be scraped, as for a moment during a deploy, every rule but
"target down" keeps its last state rather than resolving and firing again. So every
rule must answer 0 when all is well, never nothing: "feed stopped" answers 0 for each
feed it covers rather than filtering with `== 1`. When it filtered, a feed that
recovered before its 10 minutes left the answer empty, and Grafana kept the pending
alert and fired it anyway, as for six Beryl feeds on 12 October 2026.

"Cache restarting" counts the restarts of one build, by joining the start time with
`scootradar_build_info`: a deploy starts another build, so its series begins without a
change. Every commit that changes the cache deploys it once CI passes, and for about a
minute the old and the new container both answer on `scootradar-cache:3001`, so
Prometheus reads one, then the other. When the rule counted every change of the start
time, one deploy made three, and the second deploy within an hour fired it: seven times
from 11 to 13 October 2026, with no crash.

Since 26 October 2026 Grafana's default notification policy sends them to
`grafana-only`, a contact point with no integration: they fire in Grafana and notify
no one. Only a rule labelled `notify=user` reaches the `telegram-paul` contact point,
grouped by alert name; here that is "ScootRadar down for 15 minutes" alone. A rule
takes the label from `"notify": "user"` in the source, and the sync puts it back if it
goes missing live. "Feed stopped" went to Alerting 207 times in the 14 days before, once
per feed; Grafana still shows it. "Down for 15 minutes" adds the two critical rules
that say users see nothing: the cache cannot be scraped (`up`), or every feed has
expired. Each term falls back to 0 when its series are missing, since the feed states
go stale once the cache is down, and a query error keeps its last state, so a
Prometheus outage does not reach Telegram. The Worker's last good answers (see
[DEPLOY.md](../DEPLOY.md)) are at most 15 minutes old and only for a request made
before, so by then no user has scooters: the wait is not lengthened for them.
The dashboard's "Expired, rarely served" table lists the others: silence isn't
success. A feed that dies stops alerting once it has been dead for half a week, and
moves to that table. "Oldest positions held" shows feeds coming close
to the 15-minute limit, as Swiss Voi did with its 8-minute updates published 90
seconds late, until its rider map was read on 28 October 2026; idle feeds pass it between collections, which is expected. The
"Cadence" row shows the feeds on each cadence, the collections started and the
requests sent to operators.

### Empty feeds

A feed can answer on time and list no scooter: "feed stopped" and `/ready` count it
as served. "Feed empty" reports one that has listed no available standing scooter, by
`scootradar_feed_vehicles`, for 3 days in Prometheus, which keeps 15. Lime's
Winterthur, Zug and Wetzikon systems were the first, empty since at least 11 October
2026; they are left out of collection since 15 October 2026, and Hopp Siglufjörður,
Dott Tignes (now paused out of season) and Dott Bourgoin-Jallieu were settled the same
day. Hopp Dalvík and Bird Leduc, emptied for the winter on 20 and 21 October 2026, were
paused on 22 October, before their alerts were due, and Hopp Ólafsvík, emptied on the
22nd, from the 23rd. Hopp Stykkishólmur, emptied on 25 October, is paused from the 26th,
after its alert fired on the 28th. Bird Penticton is paused from 1 November 2026, when the
city's notice ends its season.

- **Not a quiet night or a snow day.** Beryl empties Bournemouth and Brighton every
  night and Voi its Oslo feed during the night ban; Bird lists nothing in Calgary on a
  snow day. A single scooter in 3 days keeps a feed quiet.
- **Not in a seasonal pause.** A feed paused at any time in the last 3 days is left
  out, so one whose season has ended has 3 days to bring its scooters back. A pause
  with no set end, until the streets are clear (Ryde in Skien and Porsgrunn from 15
  December), ends on 1 May at the latest, so the alerts are back by then. A region
  Whoosh says is closed for the season (Almaty, Astana and Zapopan from 24 October
  2026) is paused the same way until Whoosh says it is open again.
- **Feeds that list nothing at all.** Bird's town with no scooter and no time (read
  as an empty town since its Canadian feeds), a Dott region it has paused (403
  `ERR_REGION_OFFLINE`) and a feed without a scooter type are skipped: they have no
  state, but count as empty, so a town Bird leaves for good is reported. Swiss systems
  sharedmobility.ch keeps listing after their operator stopped (Bird in Biel) are
  skipped as inactive and left out.
- **Not a feed that does not answer.** One expired over half of the last day is
  "feed stopped"'s, then the "Expired, rarely served" table's.
- **Not one part of a Lime town.** Lime's rider map is read in groups of map cells
  (`lime_…_app_<town>_000` and on, src/lib/limeGrid.ts), each once in 72 hours, and a
  group over cells where no scooter stands lists none for good: on 27 October 2026, 23
  of Doha's 32 groups, 4 of Brisbane's, one of Santiago's and one of Naha's, while each
  town held its usual fleet. A group is reported only if every group of its town has
  listed none for 3 days.
- **Followed for 3 days.** A feed is reported only if Prometheus held it 3 days ago, so
  a new feed, or one skipped before its vehicles were exported (15 October 2026), waits.

When it fires, check the operator's app or site and the town's pages, then add a
`seasonal` window to the catalog if the city or the operator publishes one, or remove
the feed and record it in [coverage gaps](coverage-gaps.md), or silence it in Grafana
while waiting. A Swiss system comes from sharedmobility.ch or `OPERATOR_SWISS_SYSTEMS`,
not a catalog: add its id to `LEFT_OUT_SWISS_SYSTEMS` in `src/lib/feedCoverage.ts`, and
remove it from `OPERATOR_SWISS_SYSTEMS` if it is there, and its town from
`data/swiss-scooter-areas.json` if no other operator serves it.

## Sentry

The SDK runs only with `SENTRY_DSN`. Its release is the deployed commit
(`SOURCE_COMMIT`), its environment `NODE_ENV`. A request that failed keeps its method
and URL, query included, so its map bounds, zoom and filters reproduce it; its headers
and the user are dropped before sending, since they hold the Worker's token and the
visitor's address. The privacy notice (`PRIVACY.md`, `/privacy`) says so: change it
with this. Stack frames go without their local variables (`includeLocalVariables`), since
24 October 2026: to read them the SDK opened Node's inspector on a random 127.0.0.1 port
inside the container (the `Debugger listening on ws://127.0.0.1:…` line at startup) and
paused the cache at every exception, caught ones included, while a worker read them.
Tracing is off, and no trace headers go to the operators' feeds.

- **Feed stopped being served**: a warning each time a feed becomes `expired` by its
  cadence's rule (an idle feed after 30 minutes without a successful collection, or ten
  minutes past its own interval for one collected less often on purpose: two hours and
  ten for the app maps read in slow sweeps, three days and ten minutes for Lime) and is
  still expired 5 minutes later (15 for Voi Switzerland, whose feed runs 2 or 3 minutes
  short of expiring: on some weekday mornings sharedmobility.ch cuts most of its downloads off
  (see Logs), and it expired 3 times on 17 October 2026 and 9 on the 22nd, back within 8
  minutes each time but once, after 16 minutes on the 22nd; 30 for a feed collected less
  often on purpose for an hour or more, as the app maps: its sweep runs late while views
  someone watches take its client's turns, or after a deploy, and a new feed's first
  collection may fail, as Whoosh's Recife, BinBin's Sakarya and a new Lime group in Rome
  did on 25 October 2026, each back within 10 minutes), outside its seasonal pause. Under a night ban at all its
  service areas, it waits for the ban to end and tells only if the feed is still expired
  30 minutes after: Dott takes Trondheim's feed down on Friday and Saturday nights, which
  Entur keeps serving as it last was, and brought it back 7.5 minutes after the ban on
  17 October 2026 and 16 minutes after it on the 18th, when a 10-minute wait in Grafana
  had already told Telegram. A restart goes on from each feed's state as the cache last
  saved it, with any report still to come and the time it has waited, from
  `feed-states.json` beside the snapshot (saved with it, every minute and on shutdown): a
  feed already expired when the cache deploys, as Dott's in Trondheim during the ban, is
  still reported when its wait ends, and one already reported is not again. States saved
  10 minutes or more before the restart are not restored (`FEED_STATES_MAX_AGE_MS` in
  `server/snapshotFile.ts`): after a longer outage, feeds that were fine have expired for
  the outage alone, and each not collected again within minutes would be reported. Then,
  or when the file is missing or unreadable, each feed's state at the restart is its
  baseline, as before the restore, and a feed already expired then is not reported. This
  gap is why the cache is not deployed during the ban hours (AGENTS.md); the restore
  closes it, but the hold stays until the restore has shipped and been checked in
  production. A feed not collected yet, as one a deploy adds, is warming up:
  the state its first collections leave is a change (`previous: "warming"`), so one that
  never loads is reported. A shorter blip, as Voi
  Switzerland's 105 seconds on 16 October 2026, is only in the logs. One
  issue per host the feeds are collected from ("Feeds stopped being served from
  api.voiapp.io"), as an outage there stops its feeds together: on 25 October 2026 Voi's
  app map stopped ten German towns' feeds within twelve minutes, then ten issues. Each feed
  is an event of its host's issue (tags `feed`, `source`, `provider`, `host`: the `feed`
  tag lists the towns hit), at most one an hour for each, so a feed that keeps expiring
  between updates stays quiet. Its `feed` context has the `snapshot_feed_state` figures of
  its expiry and the last collection error, or says that the last collection succeeded and
  its data then aged past the limit; its `host` context lists the host's other feeds
  expired by then. A feed the catalog no longer has, which nothing collects, is of host
  `unknown`, and says so.
- **Unexpected errors**: the restore and persistence of the snapshot and of the feed
  states (a missing file is not one), feed discovery, a request
  answered 500, and a collection that threw outside the feed's own error handling. Each
  is reported at most once an hour, so a failure repeating every few seconds stays one
  event an hour; the logs keep every occurrence. A failed discovery is tried once more
  5 seconds later, then every minute, and reported only once it has failed for 15
  minutes, as one issue whatever the error: sharedmobility.ch's registry answered a
  single 504 as the cache started on 25 October 2026, and its outage from 02:13 UTC on
  31 October 2026 was three issues by error, one raised by each night's restart. Until
  the registry answers, a restarted cache collects the Swiss national feeds its snapshot
  holds, at the addresses the registry gives them: three deploys while sharedmobility.ch
  refused HTTPS on 31 October 2026 had left the 15 Swiss feeds uncollected, the 8 read
  from rider maps included.
- **A Swiss rider map failing**: Bolt's, Voi's or Dott's rider map read for a Swiss
  national feed (DATA_SOURCES.md) that has failed for ten minutes, at most once an hour
  for each feed (`swiss-app-map:<feed>`). The national feed alone stands meanwhile, so
  the feed neither fails nor expires; each failure is logged as `swiss_app_map_failed`.

Routine feed failures are not sent; the metrics and logs cover them.

## Logs

`snapshot_feed_state` (a feed changing state), `snapshot_feed_failed`,
`parking_feed_failed` and `swiss_app_map_failed` (with the error), and `snapshot_health` (every minute, with the
feeds on each cadence, `warmingFeeds` not collected yet and not counted as failed or
expired, `unobservedFeeds` with no positions yet, and `oldestObservationAgeSeconds` over
the feeds that have some, null when none has) are JSON lines, as is `feed_states_restored`
(at start-up, with the number of `feeds` whose state was restored, 0 when the saved
states are 10 minutes old or more, and the file's `ageSeconds`; see Sentry).
`/ready` likewise lists the feeds not collected yet as `warmingFeeds`, apart from
`failedFeeds`. So is `upstream_stale_fallback`, a request to an
operator that failed while an earlier answer could still be served: its host and path,
and the HTTP status, or the error's type, Node's code for a network error (`errorCode`,
as `ECONNRESET` or `UND_ERR_SOCKET`) and whether it failed before the operator answered
or while reading what it sent (`stage`: `request` or `body`). A body the operator cuts
off (`UND_ERR_SOCKET` or `ECONNRESET` while reading it) is asked for once more at once,
logged as `upstream_body_retry` with its host, path and `errorCode`; only a second cut
falls back. sharedmobility.ch cuts Voi's Swiss vehicles off on some weekday mornings: about
three requests in four from 06:40 to 10:00 on 22 October 2026, and more than half from
07:00 to 10:00 on the 17th, with the others going through in between. In Grafana's Loki data source:

```logql
{app="scootradar-cache", event="snapshot_feed_state"} | json | feed="national:voiscooters.com"
```
