# Observability

The scooter feed cache on Netcup (see [DEPLOY.md](../DEPLOY.md)) reports in four
places. None of them holds a map URL, coordinates or a visitor's address.

- **Prometheus** scrapes its `/metrics` every 30 seconds. **Grafana** draws them on the
  "ScootRadar — Scooter feeds" dashboard and alerts on them through Telegram.
- **Sentry** (project `scootradar-cache`) gets unexpected errors, plus one event
  each time a feed stops being served.
- **Loki** keeps its log lines for 30 days under `app="scootradar-cache"`.

The Worker is not in Prometheus or Sentry: its `scooter_origin_failure` lines are in
the Cloudflare dashboard's Workers Logs for `swiss-scooters`.

## Metrics

`GET /metrics` answers 404 unless `METRICS_TOKEN` is set, and 401 without it as a
bearer token. Production requires at least 32 characters. Prometheus reaches the
container over the `coolify` network as `scootradar-cache:3001` (a Coolify network
alias), with job `scootradar-cache`; the token is in its `prometheus.yml`.

Labels hold feed ids, sources, providers, routes and status codes only. The feed
series follow the snapshot at each scrape, with the states of the
`snapshot_feed_state` log line; feeds never attempted or skipped are left out:

- `scootradar_feed_state{feed, source, provider, state}`: 1 for the feed's state, 0 for
  the others, judged by the feed's cadence (see [Collection cadence](#collection-cadence)).
  `ok` is served, or would be as soon as someone looked; `failing` means the last
  collection failed and the previous positions are kept; `expired` means the feed is
  late for its cadence and the map says the provider is not sharing data. A Swiss or
  watched feed expires when its positions are over 15 minutes old; an idle feed only
  after 30 minutes without a successful collection.
- `scootradar_feed_paused`: 1 while every service area of the feed is in its seasonal
  pause (`seasonal` in its catalog, as Montréal each winter), else 0. The feed may then
  serve nothing: the map says when its scooters are back rather than that the provider is
  not sharing data, Sentry is not told it stopped, and "feed stopped" ignores it.
- `scootradar_feed_vehicles`: vehicles held, 0 once expired.
- `scootradar_feed_observation_timestamp_seconds`: the source's own timestamp of the
  positions held. `time() -` it is their age; an idle feed's may pass 15 minutes.
- `scootradar_feed_attempt_timestamp_seconds`, and `scootradar_feed_parking_up` for
  regional feeds: parking as fresh as the cadence promises (5 minutes for a feed
  collected every minute, 30 for an idle one).
- `scootradar_feeds_by_cadence{cadence="always|watched|idle"}`: feeds on each cadence now.
- `scootradar_collections_started_total{reason}`: `always`, `watched`, `wake` (a request
  found the data over a minute old), `idle` and `retry` (an idle feed that failed).
- `scootradar_request_waits_total{outcome="collected|timeout"}`: requests that waited for
  the collection of feeds whose positions were over 15 minutes old.
- `scootradar_upstream_requests_total{kind="status|metadata"}`: requests sent to
  operators; status covers positions and parking, metadata what is kept an hour or more.
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

- **Always**: the sources in `SCOOTER_ALWAYS_FAST` (Switzerland by default) every minute.
- **Watched**: a map request covering a feed keeps it on the minute for 10 minutes. If
  its last collection is over a minute old, the request starts one at once.
- **Idle**: every other feed every 20 minutes, each at its own time in the interval
  (from a hash of its id), so about eight a minute start. A failed collection is
  retried after 1, 2, 4, 8, then every 10 minutes.

A request whose feeds hold positions over 15 minutes old waits up to 3 seconds for
their collection, then answers. When a collection it started is still under way, the
answer carries `meta.refreshing: true` with `refreshAfterSeconds: 3`, is not cached,
and the web and iOS apps ask once more 3 seconds later. Older apps ask again after
their usual 10 seconds.

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
  inactive, as Bird in Biel, Grenchen and Schaffhausen.
- Velospot's copy on sharedmobility.ch, 15 to 75 minutes behind, gave way to the
  PubliBike app's station list (feed `publibike-stations`).

The alert rules:

| Rule | Fires when |
| --- | --- |
| ScootRadar cache target down | Prometheus cannot scrape the cache for 3 minutes |
| ScootRadar serves no scooters | every feed has expired for 5 minutes |
| ScootRadar collector stalled | no collection has finished for 5 minutes (Swiss feeds alone finish one every few seconds) |
| ScootRadar feed stopped | a feed served more than half of the last 7 days has been expired for 10 minutes, by its cadence's rule; one notification per feed. Not in its seasonal pause, whose days count as served, so a feed that does not come back after its season is reported |
| ScootRadar feed discovery stale | no successful discovery for 2 hours |
| ScootRadar cache restarting | one build has restarted more than three times in an hour (a deploy is not counted) |
| ScootRadar cache memory high | over 1.3 GB for 15 minutes (the limit is 1536 MiB) |

While the cache cannot be scraped, as for a moment during a deploy, every rule but
"target down" keeps its last state rather than resolving and firing again. So every
rule must answer 0 when all is well, never nothing: "feed stopped" answers 0 for each
feed it covers rather than filtering with `== 1`. When it filtered, a feed that
recovered before its 10 minutes left the answer empty, and Grafana kept the pending
alert and fired it anyway, as for six Beryl feeds on 12 October 2026.

"Cache restarting" counts the restarts of one build, by joining the start time with
`scootradar_build_info`: a deploy starts another build, so its series begins without a
change. Every push that changes the cache deploys it, and for about a minute the old
and the new container both answer on `scootradar-cache:3001`, so Prometheus reads one,
then the other. When the rule counted every change of the start time, one deploy made
three, and the second deploy within an hour fired it: seven times from 11 to 13
October 2026, with no crash.

The default notification policy sends them all to the `telegram-paul` contact point.
The dashboard's "Expired, rarely served" table lists the others: silence isn't
success. A feed that dies stops alerting once it has been dead for half a week, and
moves to that table. "Oldest positions held" shows feeds coming close
to the 15-minute limit, as Swiss Voi does with its 8-minute updates published 90
seconds late; idle feeds pass it between collections, which is expected. The
"Cadence" row shows the feeds on each cadence, the collections started and the
requests sent to operators.

## Sentry

The SDK runs only with `SENTRY_DSN`. Its release is the deployed commit
(`SOURCE_COMMIT`), its environment `NODE_ENV`. A request that failed keeps its method
and URL, query included, so its map bounds, zoom and filters reproduce it; its headers
and the user are dropped before sending, since they hold the Worker's token and the
visitor's address. The privacy notice (`PRIVACY.md`, `/privacy`) says so: change it
with this. Stack frames carry their local variables (plain objects one level deep,
class instances by name only); to read them the SDK opens Node's inspector on a random 127.0.0.1 port
inside the container, hence the `Debugger listening on ws://127.0.0.1:…` line at
startup. Tracing is off, and no trace headers go to the operators' feeds.

- **Feed stopped being served**: a warning each time a feed becomes `expired` by its
  cadence's rule (an idle feed after 30 minutes without a successful collection), outside
  its seasonal pause, one
  issue per feed (tags `feed`, `source`, `provider`), at most one event an hour for
  each, so a feed that keeps expiring between updates stays quiet. Its `feed` context has the
  `snapshot_feed_state` figures and the last collection error, or says that the last
  collection succeeded and its data then aged past the limit.
- **Unexpected errors**: snapshot restore and persistence, feed discovery, a request
  answered 500, and a collection that threw outside the feed's own error handling. Each
  is reported at most once an hour, so a failure repeating every few seconds stays one
  event an hour; the logs keep every occurrence.

Routine feed failures are not sent; the metrics and logs cover them.

## Logs

`snapshot_feed_state` (a feed changing state), `snapshot_feed_failed` and
`parking_feed_failed` (with the error), and `snapshot_health` (every minute, with the
feeds on each cadence) are JSON lines. In Grafana's Loki data source:

```logql
{app="scootradar-cache", event="snapshot_feed_state"} | json | feed="national:voiscooters.com"
```
