# German and Italian scooter feeds

Verified 8 September 2026. The audit checked 156 scooter candidates from the
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
plus Dott's published country index and selected public Italian alternatives.
No account credentials or private rider APIs were needed for the enabled feeds.

Rechecked 11 October 2026. In September Dott made its GBFS API private
([it now requires authentication](https://ridedott.dev/docs/services/gbfs/introduction/)).
Its public German listing now names 15 regions, and they all still answer. Of
the 82 German Dott regions enabled on 8 September, 65 answered 404
(`ERR_REGION_NOT_FOUND`), and Kassel and Lübeck had answered 403
(`ERR_REGION_OFFLINE`) since late September. Those 67 were removed.

| Country | Operator | Enabled feeds | Coverage |
| --- | --- | ---: | --- |
| Germany | Dott | 15 | Aachen, Berlin, Düsseldorf, Essen, Hannover, Heidelberg, Heilbronn, Kaiserslautern, Köln, Langenfeld, Leipzig, München, Münster, Potsdam and Stuttgart |
| Germany | Bolt | 3 | Karlsruhe, Stuttgart, Reutlingen / Tübingen |
| Germany | Hopp | 1 | Konstanz |
| Germany | Lime | 3 | Frankfurt, Wuppertal, Stuttgart / Konstanz |
| Germany | Voi | 1 | Karlsruhe, Pforzheim, Mannheim, Stuttgart, Tübingen and Reutlingen |
| Italy | Bird | 1 | Roma |

German coverage contains 23 distinct cities. Italy currently covers Rome only.
The complete reviewed city bounds, public discovery URLs and aliases are in
[`german-scooter-feeds.json`](../data/german-scooter-feeds.json) and
[`italian-scooter-feeds.json`](../data/italian-scooter-feeds.json).

## Data handling

- GBFS 2.3 and 3.0 feeds are normalized using electric standing-scooter types.
  Bicycles, seated mopeds, reserved/disabled vehicles and invalid positions are excluded.
- Vehicle timestamps older than fifteen minutes are rejected; snapshot fallback
  never extends the fifteen-minute maximum age of individual scooter positions.
- GBFS discovery links must stay within the reviewed HTTPS city/feed base.
- German MobiData BW feeds use GBFS 3.0 and localized names. Multi-city feeds
  retain their published city subregions for provider filters and overview counts.
- Routing envelopes use published geofencing plus small padding.
  Hopp's global geofence is restricted to its reviewed Konstanz area.
- Parking uses the existing virtual-bay, return-status and geofencing adapter.
  Empty or absent parking data does not imply unrestricted parking.
- Feed collection is independent of map requests. Overview counts refresh hourly;
  individual scooters refresh with the minute collector. City search recognizes
  local names and English aliases (for example München/Munich and Roma/Rome).

## Known gaps

- Dott no longer publishes most German regions, among them Hamburg, Bremen,
  Nürnberg, Dortmund and Karlsruhe (where Bolt and Voi remain). Dott documents
  its authenticated feed among its partner integrations.
- Italian Dott city endpoints returned 404 (`ERR_REGION_NOT_FOUND`, or 403 for
  Catania); the Italy country index contained no city feeds. This is an endpoint
  observation, not proof that Dott no longer operates in those cities.
- Lime Bari, Naples, Rome and Verona public endpoints returned 404.
- Bird Florence, Milan, Munich and Ulm returned abandoned timestamps and were excluded.
- Sampled Zeus feeds contained no compatible available standing scooters.
- German Lime Dresden and Oberhausen contained no available standing scooters;
  the Hamburg and older Stuttgart discovery URLs returned 404.
- Voi's reviewed German proxy covers six cities in Baden-Württemberg; it is not
  a nationwide Voi feed. Other operator/city combinations remain unverified.

## Sources and recheck

[MobiData BW](https://www.mobidata-bw.de/) provides the public regional proxy feeds.
[Dott Germany discovery](https://gbfs.api.ridedott.com/public/v2/countries/de/gbfs.json)
contains repeated feed names for separate cities, so each reviewed city is collected
independently. [Bird Rome](https://mds.bird.co/gbfs/v2/public/rome/gbfs.json) supplies
the enabled Italian service. Operator attribution is retained in the map and API.
Existing operator data terms continue to apply; public access does not replace them.

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=FR,DE,IT --json
SCOOTRADAR_BASE_URL=http://127.0.0.1:3001 node scripts/check-map-performance.mjs
```

The checker compares the catalog with Dott's listing of each country, and the
[catalog check workflow](../.github/workflows/catalog-check.yml) runs it every
Monday. It fails when an entry is gone; see the
[French recheck notes](french-scooter-feeds.md#recheck).
