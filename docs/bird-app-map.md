# Bird rider map: research reader

Verified on 27 October 2026 with the user's signed-in Bird session. The user
chose to finish the tested reader and findings, without adding live coverage.
[The research client](../scripts/bird-app-map.mjs) is not imported by the
production collector. No catalog, feed, production session or cadence changed.

## The earlier rejection was too strong

The first investigation found real data: 3,454 vehicles across Austin and
582 across Indianapolis, whose public GBFS feed independently confirmed the
positions. At about 20:52 UTC, during a sequence of requests to different
cities, the map began returning synthetic vehicles. These replies had no
brand, invented area and operator identities, and positions on a line
northeast of the query, including in towns without Bird service. A repeat in
Austin at 20:58 UTC was still synthetic. An empty reply at 20:59 had the
same missing metadata.

That established a bad response, but did not establish that moving between
cities caused it, that the account was permanently flagged, or that the app
could never be a source. Those conclusions in the earlier coverage note
have been withdrawn.

The **same credentials and device identity**, without renewal, another login
or an account change, subsequently returned real data. At 21:01 UTC the
cell endpoint returned 1,000 Austin vehicles; 987 IDs matched the earlier
full-area audit. At 21:04 the original nearby helper, with its original
headers, returned branded vehicles and cell metadata in Austin, Charlotte
and Indianapolis, about 3.5 seconds apart. Thus location jumps alone did not
reproduce the failure. The trigger and recovery period remain unknown. A
temporary request limit or client-header treatment is a hypothesis, not a
finding; several header experiments coincided with recovery and cannot
isolate the cause.

Synthetic Bird replies were also reported by
[WoBike's original investigators](https://github.com/ubahnverleih/WoBike/issues/192#issuecomment-765939688)
in 2021, where a missing User-Agent was implicated. A
[2022 report](https://github.com/ubahnverleih/WoBike/issues/242) describes a
similar symptom with a User-Agent present. Neither establishes the cause
of the October 2026 incident.

## Current app evidence

Static inspection used Android `co.bird.android` 4.420.0.2, version code
908540, published by Blue Jay Transit Inc. The APK was obtained from
APKPure for research, not installed or executed. `apksigner verify`
succeeded. Its certificate SHA-256 was
`BD:0B:C0:56:CB:01:83:83:7E:10:D3:86:D8:C1:81:B6:44:4F:C4:17:4E:D8:BA:DC:D0:D7:29:5C:20:4F:CD:91`,
matching Bird's [app-link association](https://go.bird.co/.well-known/assetlinks.json)
and its [Google Play package](https://play.google.com/store/apps/details?id=co.bird.android).

The app's request builder uses `App-Name: bird`, `App-Type: rider`,
`Platform: android`, `App-Version`, `Device-Id`, bearer authorization,
and a JSON `Location` header. Its User-Agent format is
`Bird/4.420.0.2 (co.bird.android; release; Android - 15)`. The research
reader reproduces that verified version. The Location header and queried
point remain necessary: omitting Location returned 400; a zero location
with the app's CDN-location fallback did not yield verified map data.
A Charlotte cell requested with Location still in Austin returned an
unverified empty reply. The reader rejects it.

The app's map configuration enables level-12 S2 cells, 16 per request,
with a 60-second local cache lifetime. The authenticated map reads are:

- `GET /bird/nearby?latitude=…&longitude=…&radius=…`: up to 250 nearest
  vehicles, with the radius in metres. The tested useful radius is at
  most 5 km. The reader splits capped views and retains valid parent
  observations. It fails the entire sweep if a child fails, a tiny view
  remains capped, or the request budget runs out.
- `POST /map/rider-cells`: `{types:["bird"], geometries:{view:{rect:{
  lo:{latitude,longitude}, hi:{latitude,longitude}}}}}`. The response's
  `cells.view.birds` identifies `strategy: "s2-cell-12"` and signed
  decimal-string `cell_ids`. This avoids implementing S2 geometry just
  to discover the cells overlapping a view.
- `POST /bird/nearby-by-cells`: `{map_center:{latitude,longitude},
  cell_ids:[…]}`. Valid replies carry `birds`, acknowledged `cell_ids`
  and a `cell_id` on each vehicle.

The legacy nearby response's cell IDs were level 9; they cannot be passed
directly to the level-12 endpoint. That mistake returned an explicit 400.
`GET /area/nearby` also returned Austin's and Charlotte's operational
polygons, with `region.rings[].points`. The production catalog has not
been built from them.

## Decoys and truncation must fail collection

The reader requires cell metadata even for empty replies. It rejects
missing or unexpected brands, malformed or duplicate vehicle identities,
invalid positions, incompatible cell strategies, and out-of-radius
nearby results. Scooter filtering happens after counting every candidate
toward the response cap. Vehicles retain battery, estimated range and
area identity, without ride codes or a fabricated position timestamp.

The cell endpoint **silently caps at 1,000 vehicles**. A single Austin
cell held 1,474 vehicles in the earlier audit, but returned exactly 1,000
without `reached_response_limit`. A nine-cell request acknowledged only
one cell before stopping at that cap. Moving the map centre produced
another subset; this is not pagination or evidence of complete coverage.
The reader rejects a capped cell or an incomplete cell acknowledgement.
Its CLI uses smaller nearby views instead. Nearby completeness still
depends on the observed nearest-vehicle selection rule; it is not an
official upstream contract.

All reads share at least five seconds between starts. An untrusted map
holds further map paths for 15 minutes in that reader. HTTP 401, 403 or
429 also stops collection, with a longer Retry-After honoured. There is
no automatic token renewal, identity change, alternate-route retry or
partial-success fallback after a refused or untrusted read. The CLI
exits on failure without writing an inventory. This is conservative
research behaviour; five seconds and fifteen minutes are not claims
about Bird's actual quota or recovery time.

## Live validation of the committed reader

An independent Indianapolis check at 21:03 UTC found 327 of 329 positions
from the cell endpoint within 10 m of Bird's public GBFS feed, 320 within
3 m. Charlotte's central cell returned 376 branded scooters, but has no
public feed for the same comparison.

The final reader then scanned the bounding rectangle of Indianapolis
S2 cell `-8616704745198845952` from **21:10:50 to 21:11:30 UTC**:

- Nine nearby requests, including two capped views and their children,
  returned 335 unique scooters inside the rectangle.
- Independent cell reads before and after held 331 and 332 vehicles.
  All **301 references** whose IDs persisted and whose positions changed
  by less than 1 m appeared in the sweep; none was missed.
- Bird's public feed, read at 21:11:59 UTC, listed 587 available vehicles
  across Indianapolis. Of the sweep's 335 local positions, 326 were within
  3 m and 332 within 10 m of that feed. These are live observations at
  different times, not identical simultaneous inventories.
- The reader's viewport-to-cell discovery method was also exercised
  against the live API and returned nine overlapping level-12 cells.

This proves fresh automated retrieval over that test area and the tested
failure boundaries. It does not prove a whole-city deployment, a sustained
request quota, server-network compatibility, long-term session renewal,
or that future synthetic replies will keep today's distinguishing fields.
Production adoption still needs those checks, reviewed operating polygons,
and a fleet-wide request budget.

## Running the reader

Use an existing, unexpired private session from the sign-in helper. No
credential is passed on the command line or printed. The optional output
is written atomically with mode 0600 only after the entire sweep succeeds;
keep it outside the repository. Collection start and finish are observation
times, not source position timestamps.

```sh
node scripts/bird-app-map.mjs \
  --session /private/path/hello.session.json \
  --bounds 39.753253398056586,-86.17517591229962,39.774500928470104,-86.15482687124187 \
  --max-requests 80 \
  --output /private/path/indianapolis-check.json

npx vitest run scripts/bird-app-map.test.mjs
```

The module also exports `BirdMapReader.cellsForBounds`, `.cells`, `.nearby`
and `scanBirdBounds` for controlled research. Tests cover synthetic empties,
synthetic vehicles, cell identity and truncation, quota holdoff, request
pacing, wrong-location results, and failed or incomplete sweeps. Raw app
replies, credentials, the APK and live audit artifacts stay in the private
Bird research directory, outside Git.
