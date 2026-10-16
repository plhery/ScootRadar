# Costa Rican scooter feeds

Verified 16 October 2026. Costa Rica's one feed is Hopp's in Tamarindo, a
beach town on the Nicoya peninsula, in Santa Cruz canton, Guanacaste. It is
not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv),
nor on Hopp's own list of towns: it answers at the address Hopp uses for its
other towns, `https://api.hopp.bike/gbfs/cr-tamarindo/gbfs.json`, a public,
keyless GBFS 2.2 feed named "Hopp Tamarindo", started on 10 December 2024.
Every feed URL is https, on the discovery's origin and under its directory.
No account credentials or private rider APIs are used. The catalog is
[`costa-rican-scooter-feeds.json`](../data/costa-rican-scooter-feeds.json);
what is left out, and when to look again, is in
[Coverage gaps](coverage-gaps.md#no-public-data-in-covered-countries).

| Operator | Feed | Town | Scooters | Available | Rides seen |
| --- | --- | --- | ---: | ---: | ---: |
| Hopp | `cr-tamarindo` | Tamarindo | 72 to 73 | 61 to 69 | 14 |

## Rides

The feed was polled 56 times, every five minutes, from 15:36 to 20:11
Costa Rica time on Thursday 15 October 2026, then 13 times more, from 20:15
to 21:15, just before the feed was added. Hopp gives a
scooter a new id after each ride, and when staff put it back into service,
so rides were followed by the code printed on each scooter (`hopp_code`),
which the feed masks to two letters and three digits, such as `XX574`: 4
codes were held by two scooters each, and were left out. A ride is a code
that comes back more than 150 m away without its battery going up.

- **15:36 to 20:11:** 13 rides by the codes, from 17:16 on, of 250 to 770 m;
  two scooters were ridden together, out and back, three times. Counted by
  ids instead (an id that leaves the feed, and a new one that appears away
  from where it stood), 10. Staff also swapped batteries and put scooters
  back into service where they stood.
- **20:15 to 21:15:** 1 ride, by the code and by the ids alike: `XX542`,
  373 m, between 20:40 and 20:45, using 1 point of battery. 68 or 69
  scooters were available in every poll.

Tamarindo is a small town, but it has about 70 available scooters and
riders on them, so it stays.

## Town names

The map names the feed Tamarindo, as Hopp does, and centres it on the
town's place in OpenStreetMap. It is also found as Playa Tamarindo, the name riders and hotels give it, and as
Langosta, the beach and quarter at its south end, inside the operating area.
Costa Rica has one town on the map, so it gets no provinces: their ISO codes
are single letters (Guanacaste is `G`), which the search would read after any
word.

| Town | Also found as |
| --- | --- |
| Tamarindo | Playa Tamarindo, Langosta |

## Data handling

- **Bounds:** Hopp's geofencing has one no-riding polygon around the town,
  whose hole, from 10.2844° to 10.3071° N and from 85.8528° to 85.8332° W,
  is the operating area, and a smaller no-riding zone along the hole's east
  side, where no scooter stood. The bounds are the hole plus 0.009° of
  latitude and 0.0091° of longitude, about 1 km: from 10.2754° to 10.3161° N
  and from 85.8619° to 85.8241° W.
  - Every available scooter of every poll stood inside them (4,673
    sightings over the 69 polls), between 10.2869° and 10.3041° N.
  - Two disabled scooters stood outside: `XX991` at Las Delicias, 13 km
    east, and `XX851`, with an empty battery, by the road 3 km east. The map
    shows neither, as it shows no disabled scooter.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns, so the age limit can't tell how old its
  positions are; the rides above show the feed is live.
- **Vehicle types:** one, `vtp_72`, an electric standing scooter with a
  range of up to 40 km.
- **Prices:** from the pricing feed's one plan, `flt_530`: US$1.00 to start
  and US$0.55 a minute, which Hopp writes as `per_min_price` (GBFS calls it
  `per_min_pricing`), as in its other countries. The plan is marked
  `is_taxable` false, and the map adds "+ tax" only in the United States and
  Canada, so none is added. The card writes the dollars as the browser's
  region does: "$0.55" in an English browser set to the US or to Costa Rica,
  "US$ 0.55" in one that names no region, and "USD 0,55" in a Spanish one
  set to Costa Rica.
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address, as
  in Hopp's other countries.
- **Parking:** Hopp publishes no stations, so the map shows none.
- **Time zone:** `America/Costa_Rica` in the catalog, as the feed's
  `system_information` gives it. Costa Rica keeps no summer time.
- **Language:** Spanish in Costa Rica says "scooter", as in the rest of Latin
  America, where Spain's says "patinete"; the map picks the word by the
  browser's region (`es-CR`).

## Rules

- **The national traffic law** (Ley 9078, de Tránsito por Vías Públicas
  Terrestres y Seguridad Vial), art. 124, bars "patinetas" and other devices,
  motorised or not, that the law or its rules don't authorise from public
  roads: the police remove them until the fine is paid, ₡26,000, said a
  traffic officer to
  [Teletica](https://www.teletica.com/nacional/scooters-electricos-ganan-terreno-pero-regulacion-sigue-pendiente_414029)
  (23 July 2026, press), who added that such devices may be used only in
  parks. The article says the law doesn't count e-scooters as a means of
  transport, which leaves them unregulated. The law's text on the national
  legal database, [SCIJ](https://scij.hacienda.go.cr/SCIJ_MHDA/default.aspx),
  couldn't be read: its page loads the text by script. Nothing in the law
  stops a rental, and the map shows the scooters as it does elsewhere.
- **Ley 10834** (Alcance 164 to La Gaceta 239, 19 December 2025) adds
  "movilidad activa" to the law, in force twelve months after it was
  published, about 20 December 2026. As a law firm's transcription gives it
  ([Bufete de Costa Rica](https://bufetedecostarica.com/reforma-ley-de-transito-por-vias-publicas-terrestres-y-seguridad-vial-en-costa-rica-10834/)),
  that is travel by non-motorised means, such as skateboards, bicycles,
  wheelchairs and skates, and the law is about teaching it in schools; it
  doesn't name e-scooters. The official text wasn't read. Recheck on
  20 December 2026.
- **Night bans:** none in a primary source, so
  [`rental-curfews.json`](../data/rental-curfews.json) has no Costa Rican
  entry.

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in its other countries.
- The map's credits name "Costa Rica: Hopp GBFS", and Hopp on the GBFS line
  for North America.

## Known gaps

- **e-moob**, on the ATOM platform, runs a smaller fleet in Tamarindo, says
  ATOM. Its two systems, 1688 and 2319, answer HTTP 400 "GBFS disabled".
  Recheck on 1 April 2027.
- **The rest of Costa Rica,** San José included: no scooter feed was found.
  Lime's `san_jose` is San José, California.

## Search

Costa Rica is found in the app's nine languages, as "Costa Rica" and
Icelandic "Kostaríka", typed beside the town. Search covers Central America
from Guatemala's Pacific coast to Panama's border with Colombia, in a box of
its own south of 14° N, so that northern Colombia and Venezuela stay out of
North America's searches (see `CONTINENT_BOXES` in
[`route.ts`](../src/app/api/geocode/route.ts)). Addresses are written with
the five-digit postcode after the town: "Calle Central, Tamarindo 50309".

## Recheck

```sh
node scripts/check-french-feeds.mjs --countries=CR --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
