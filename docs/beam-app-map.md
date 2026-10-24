# Beam rider map

Beam's standing scooters are collected from the authenticated map of the
unmodified official Android app, `com.escooterapp` 2.67.0 / 296145. The user
completed Google sign-in on 24 October 2026. The prior
[app investigation](jet-whoosh-beam-luup-app-maps.md#beam) records the verified
publisher certificate and signed-out refusals.

## Coverage and data

The reviewed catalogs contain 54 collection regions: 11 in Australia, ten in
Malaysia, 28 in South Korea and five in Türkiye. Some app regions combine towns
or campuses, so these are collection regions rather than 54 municipal fleets.
South Korea's are named after the municipalities they stand in, as the other
Korean operators' towns are, with Beam's names kept as aliases (see
[the Korean guide](south-korean-scooter-feeds.md#beam)). The initial complete samples contained 44,585 standing scooters. Counts are
observations, not expected fleet totals. Country notes list the reviewed feeds
for [Australia](australian-scooter-feeds.md), [Malaysia](malaysian-scooter-feeds.md),
[South Korea](south-korean-scooter-feeds.md) and [Türkiye](turkish-scooter-feeds.md).

`server/beamApp.ts` reads `POST https://gateway.ridebeam.com/query`:

```graphql
query($indexes: [String]!) {
  vehiclesByH3(indexes: $indexes) {
    id latitude longitude batteryLevel formFactor cityId
  }
}
```

A Beam access token in `Authorization: Bearer …` and numeric `latitude` and
`longitude` headers suffice, including from Netcup's Node 26 cache runtime.
The location headers are required: a valid rider token without them returns
`Invalid location`. No device fingerprint, app signing key, attestation or
Google token is needed by the collector.

Only `ESCOOTER` becomes a vehicle; e-bikes, mopeds, seated scooters and the
observed unclassified empty form factor are excluded. Markers use stable
`beam:<numeric id>` identities, coordinates and percentage charge. Range,
price and per-vehicle rental links remain unknown. Each response is filtered
by the reviewed `cityId` and bounds, because overlapping H3 cells also contain
neighboring regions' scooters. An unknown nonempty form factor or malformed
standing scooter fails the collection instead of silently replacing its map.

Each city's reviewed envelope is covered by overlapping resolution-8 H3 cells,
including cells crossing its boundary. Batches contain at most 500 cells. Eight
regions use reviewed disjoint operating envelopes to avoid querying large
empty gaps between campuses or towns; Johor's 193 cells replace a 21,168-cell
rectangle. The envelopes come from the app's operating polygons, with a small
margin. The union is limited to 10,000 cells and a sweep has a 90-second
budget. All batches must succeed before publication; errors, failed batches
and malformed GraphQL replies leave the last complete snapshot intact.

Requests start at least two seconds apart across all regions. HTTP 429 honors
`Retry-After`; rejected authentication gets one renewal and retry, then a
one-minute cooldown. Responses have streaming size limits and deadlines.
The normal scheduler polls idle regions every 20 minutes and watched regions
every minute.

The discovery sweep reviewed 198 non-test candidate regions. Regions with no
standing scooters, retired/test entries and unresolved service areas are not
published. The sampled New Zealand, Thailand, Indonesia and US regions were
empty. These observations do not establish that the operators have permanently
left those markets. The public region list alone is not evidence of operation.

`isNeuron: true` is a separate vehicle query: a Brisbane sample returned 2,267
Neuron vehicles. Those are not included or labeled as Beam. The ordinary Beam
query does include 459 Beam scooters in the initial Adelaide sample.

Zones and parking guidance are not published yet. In particular, `CityGlobal`
is a no-go mask containing holes for many service areas, not an ordinary local
no-go polygon; publishing it as one would misrepresent the service area.

## Private session

The Node cache reads `/data/beam-session.json`, mode 0600, owned by UID 1000.
`BEAM_SESSION_PATH` overrides the path. Its private structure is:

```json
{"version":1,"userId":123,"authToken":"<Beam access token>","refreshToken":"<Beam refresh token>"}
```

Neither token nor the actual user id belongs in Git, a public catalog, a Worker
variable or a build argument. The collector requires no Google credentials,
phone number, SMS code, profile, payment or trip data.

The observed Beam access tokens last 30 days. Five minutes before expiry, or
once after the server rejects a token, the collector calls:

```graphql
mutation($userId: Int, $refreshToken: String!) {
  refreshToken(userId: $userId, refreshToken: $refreshToken) {
    authToken refreshToken
  }
}
```

Concurrent readers share one renewal. Both returned tokens are saved atomically
with mode 0600, so refresh-token rotation survives restarts. Renewal checks the
access token's account id and expiry. Upstream authentication bodies and
request errors are not logged. A revoked session requires another official-app
sign-in and replacement of the private file, followed by a normal CI-gated
restart. The Android emulator does not need to stay running.

The current Android sign-up flow offers Google. Phone verification is routed
to an existing-account-only mutation while Google SSO is enabled; an
unregistered number returns `No account found` without sending an SMS.
There is no shared rider token or guest login in the app files. Beam, Neuron
and partner vehicle queries all returned `Unauthorized` signed out; regions,
zones and parking counts are separate public reads.

## Verification

Authenticated map reads and refresh-token renewal succeeded from the Mac and
from the running production Node 26.12.1 container. A correct Darwin cell
returned 115 standing scooters from Netcup. Early renewal also succeeded;
the observed refresh token did not rotate. The saved runtime file is mode
0600 and survives normal cache deployments. The compiled collector also completed
a full Darwin read from that runtime, returning 706 standing scooters.

The first production startup also returned transient empty maps late in its
initial burst; complete rereads of the same Korean regions returned scooters.
The shared request pacing was reduced to two seconds to keep startup sweeps
gentle. No particular upstream rate-limit threshold is inferred from those
empty responses.

All 54 raw city samples pass the production parser. Repeated complete city
reads found 144 moved scooters in Darwin, 122 in Kuala Lumpur, 138 in Seoul,
ten in Johor and 789 in Antalya; the first Seoul sweep was also
repeated in 100-cell batches to check the 500-cell batch's completeness.
Tests cover H3 boundary coverage, disjoint areas, standing-scooter and geographic
filtering, complete sweeps, renewal/rotation across restarts, concurrent
readers, token rejection, rate limits, invalid replies, size bounds and
secret-safe failures. APKs, decompiled code, raw responses and credentials stay
outside the repository.
