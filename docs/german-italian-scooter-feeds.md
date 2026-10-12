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

Zeus was added the same day: 14 feeds, about 2,200 available scooters. Zeus
publishes its own GBFS 2.2 feeds at `zeus.city`, and MobiData BW republishes
the scooters of its newer backend as GBFS 3.0. Where both cover a city, only
one source is read, so no scooter is counted twice: the MobiData BW feed, which
is the live one (Zeus's own Freiburg, Renningen and Tuttlingen feeds are
subsets of it; its own Würzburg and Neustadt feeds hold a few scooters on
depots). Zeus's own Heidelberg feed lies inside MobiData BW's Leimen / Walldorf /
Wiesloch feed, and its Hemmingen feed inside its Ludwigsburg feed.

Italy grew from Rome to three cities on 13 October 2026, with Bird Palermo and
Bird Napoli; see [Italy, October 2026](#italy-october-2026).

| Country | Operator | Enabled feeds | Coverage |
| --- | --- | ---: | --- |
| Germany | Dott | 15 | Aachen, Berlin, Düsseldorf, Essen, Hannover, Heidelberg, Heilbronn, Kaiserslautern, Köln, Langenfeld, Leipzig, München, Münster, Potsdam and Stuttgart |
| Germany | Bolt | 3 | Karlsruhe, Stuttgart, Reutlingen / Tübingen |
| Germany | Hopp | 1 | Konstanz |
| Germany | Lime | 3 | Frankfurt, Wuppertal, Stuttgart / Konstanz |
| Germany | Voi | 1 | Karlsruhe, Pforzheim, Mannheim, Stuttgart, Tübingen and Reutlingen |
| Germany | Zeus | 14 | Bamberg, Donaueschingen, Freiburg im Breisgau, Heidelberg / Leimen / Walldorf / Wiesloch, Konstanz, Ludwigsburg, Neustadt an der Weinstraße, Regensburg, Renningen, Schweinfurt, Singen, Tuttlingen, Villingen-Schwenningen and Würzburg |
| Italy | Bird | 3 | Roma, Palermo and Napoli |

German coverage contains 38 distinct cities, Italian coverage 3.
The complete reviewed city bounds, public discovery URLs and aliases are in
[`german-scooter-feeds.json`](../data/german-scooter-feeds.json) and
[`italian-scooter-feeds.json`](../data/italian-scooter-feeds.json).

## Data handling

- GBFS 2.2, 2.3 and 3.0 feeds are normalized using electric standing-scooter types.
  Bicycles, seated mopeds, reserved/disabled vehicles and invalid positions are excluded.
- Zeus's own feeds give its standing scooters the propulsion `electric_assist`,
  which GBFS keeps for pedal assistance; MobiData BW publishes the same scooters
  as `electric`. Only Zeus's `electric_assist` scooters are read as electric.
- Vehicle timestamps older than fifteen minutes are rejected; snapshot fallback
  never extends the fifteen-minute maximum age of individual scooter positions.
- GBFS discovery links must stay within the reviewed HTTPS city/feed base.
- German MobiData BW feeds use GBFS 3.0 and localized names. Multi-city feeds
  retain their published city subregions for provider filters and overview counts.
- Routing envelopes use published geofencing plus small padding.
  Hopp's global geofence is restricted to its reviewed Konstanz area.
  Zeus's zones are too coarse for this (one polygon of many rings, or zones
  tens of kilometres wide), so its bounds enclose the scooters' positions on
  11 October 2026, without those more than 6 km from the median, plus padding.
- Parking uses the existing virtual-bay, return-status and geofencing adapter.
  Empty or absent parking data does not imply unrestricted parking.
- Feed collection is independent of map requests. Overview counts refresh hourly;
  individual scooters refresh with the minute collector. City search recognizes
  local names and English aliases (for example München/Munich and Napoli/Naples).

## Italy, October 2026

Bird Palermo and Bird Napoli are Bird's own GBFS 2.3 feeds, under the
`palermo-italy` and `napoli-italy` slugs of `mds.bird.co`; the plain `palermo`
and `napoli` slugs answer 404. On 13 October 2026, after midnight Rome time,
each was polled four times, five minutes apart. Palermo listed 1,226 to 1,231
scooters, 1,214 to 1,219 of them available, and Napoli 542 or 543, with 508 or
509 available. Every poll was under a minute old. Between polls, about 450 of
Palermo's positions changed and about 40 of Napoli's, and Bird rotated every
vehicle id, as it does elsewhere. Every feed URL is https, on the discovery's
origin and under its directory.

- **Bounds** enclose every zone where Bird's geofencing allows riding, plus
  0.005° of padding. Palermo publishes 33 zones and Napoli 97, most of them
  no-ride or no-parking zones. Napoli's riding zones include three detached
  ones east and west of the city, where no scooter stood during the polls.
- **Battery** is published for every scooter. There are no rental links, so a
  scooter's card opens Bird's app, and the pricing list is empty, so no ride
  estimate is shown, as for Bird in Portugal and Spain.
- **Licence:** the `license_url` is Bird's 2018 PDF, which answers 404, as in
  the [Portuguese and Spanish audit](portuguese-spanish-icelandic-scooter-feeds.md#licences).
- **Palermo's permits:** the city's final ranking
  ([Determinazione Dirigenziale n. 1874 of 5 February 2025](https://www.comune.palermo.it/wp-content/uploads/2025/02/25a49427-438b-45df-b3bb-483410e652aa.pdf))
  authorises Link your city Italia, Emtransit (Dott) and Lime for five years,
  and gave the other operators 20 days to stop. Bird is not among them, yet its
  feed lists about 1,220 scooters. Bird's other `-italy` slugs (Collegno, Moncalieri,
  Nichelino, Rivoli, Sesto Fiorentino) are former Link towns, so these may be
  Link's fleets, now run by Bird. That is not confirmed.
- **Rome's permits** ran from 1 September 2023 to 31 August 2026. D.D. QG
  1649/2026 extends them for the time a new selection needs; the press gives
  31 October 2026, the day Rome's bike-sharing permits end. Applications close
  on 26 October 2026 at 15:00; the selection picks up to three scooter
  operators, for three years, who then have 150 days to start
  ([Roma Servizi per la Mobilità](https://romamobilita.it/eventi-e-news/selezione-operatori-servizi-di-micromobilita-sharing/)).
- **City rules:** Firenze banned shared scooters from 1 April 2026
  ([Comune di Firenze](https://www.comune.firenze.it/novita/comunicati/sharing-mobility-dal-1deg-aprile-stop-ai-monopattini-sharing)).
  Milano revoked Bird's permit in July 2026, over scooters without the plates
  required since 17 May 2026. BIT's service in Prato ended on 31 December 2025.
  No Italian city was found to ban renting at night.

## Known gaps

- Dott no longer publishes most German regions, among them Hamburg, Bremen,
  Nürnberg, Dortmund and Karlsruhe (where Bolt and Voi remain). Dott documents
  its authenticated feed among its partner integrations.
- Dott's 21 Italian city endpoints returned 404 (`ERR_REGION_NOT_FOUND`), and
  Catania and Alghero 403 (`ERR_REGION_OFFLINE`); the Italy country index
  contained no city feeds, and Dott's API now needs authentication. Dott still
  runs in Roma, Milano, Palermo and other cities.
- Lime's Italian endpoints all returned 404, though Lime runs in Roma, Milano
  and Palermo.
- Bird Milano, Firenze, Torino, Moncalieri, Collegno, Rivoli, Nichelino and
  Sesto Fiorentino were empty, with a timestamp of 0; Bird München and Ulm had
  abandoned timestamps. None was added.
- Hopp Como held no scooters at night on 13 October 2026; check it by day.
- RideMovi's feeds answer 401, and BIT Mobility (Napoli, Bari and others)
  shows its scooters only after a login. Helbiz's and Link's hosts no longer
  resolve. Cooltra lists mopeds and e-bikes, no scooters.
- Zeus's own feeds for Castrop-Rauxel, Duisburg, Friedberg, Gera, Göppingen,
  Hagen, Hattingen, Heilbronn, Herne, Jena, Kempten, Marburg, Pforzheim,
  Reutlingen, Rüsselsheim, Schwäbisch Gmünd and Tübingen held no scooters, and
  Limburgerhof and Straubing a few; none was added. Its Italian feeds were
  stale or empty: Anzio, Augusta and Mazara listed no available scooter, and
  Teramo, Modena and Reggio Emilia none at all.
- German Lime Dresden and Oberhausen contained no available standing scooters;
  the Hamburg and older Stuttgart discovery URLs returned 404.
- Voi's reviewed German proxy covers six cities in Baden-Württemberg; it is not
  a nationwide Voi feed. Other operator/city combinations remain unverified.

## Sources and recheck

[MobiData BW](https://www.mobidata-bw.de/) provides the public regional proxy feeds.
Zeus publishes its own city feeds at `https://zeus.city/api/v1/mds/gbfs/<city>/gbfs.json`.
[Dott Germany discovery](https://gbfs.api.ridedott.com/public/v2/countries/de/gbfs.json)
contains repeated feed names for separate cities, so each reviewed city is collected
independently. Bird's own feeds for
[Roma](https://mds.bird.co/gbfs/v2/public/rome/gbfs.json),
[Palermo](https://mds.bird.co/gbfs/v2/public/palermo-italy/gbfs.json) and
[Napoli](https://mds.bird.co/gbfs/v2/public/napoli-italy/gbfs.json) supply
the enabled Italian services. Operator attribution is retained in the map and API.
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
