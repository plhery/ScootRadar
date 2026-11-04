# Dominican scooter feeds

Verified 4 November 2026. The Dominican Republic's one feed is Hopp's,
`do-punta-cana`, whose scooters stand in Cap Cana, the resort south of Punta
Cana, in Higüey municipality, La Altagracia. It is not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv):
it answers at the address Hopp uses for its other towns,
`https://api.hopp.bike/gbfs/do-punta-cana/gbfs.json`, a public, keyless GBFS
2.2 feed named "Hopp Punta Cana", started on 9 March 2023. Every feed URL is
https, on the discovery's origin and under its directory. No account
credentials or private rider APIs are used. The catalog is
[`dominican-scooter-feeds.json`](../data/dominican-scooter-feeds.json); what
is left out, and when to look again, is in
[Coverage gaps](coverage-gaps.md#no-public-data-in-covered-countries).

| Operator | Feed | Town | Scooters | Available |
| --- | --- | --- | ---: | ---: |
| Hopp | `do-punta-cana` | Punta Cana | 27 | 25 |

## Why it is on the map

The October audit left the Dominican Republic out: 24 to 26 scooters, none
ridden on the evening of 15 October 2026 nor on the morning of Sunday
18 October. It is added on 4 November 2026 under the App Store rule
(Desk [288]): ScootRadar opens in a country once every serious operator there
is on the map, and Hopp is the only one in the Dominican Republic that
publishes anything. The map shows the fleet as it is.

## Rides

The feed was polled 3 times, five minutes apart, from 10:45 to 10:55 UTC
(06:45 to 06:55 Dominican time) on Wednesday 4 November 2026, before the
feed was added: the same 27 scooters, 25 available, and none moved more than
20 m, early in the morning. Rides are followed by
the code printed on each scooter (`hopp_code`), as in Hopp's other towns: a
ride is a code that comes back more than 150 m away without its battery going
up. Most scooters stood in groups, eight at Api Beach, five on Avenida Las
Cañas and four at Green Village, one of them disabled, as at hubs.

## Town names

The map names the feed Punta Cana, as Hopp does and as visitors know the
area, and centres it on Cap Cana's place in OpenStreetMap, where the scooters
are: Punta Cana's own node, by the Puntacana Resort, is 6 km north, outside
Hopp's zone. It is also found as Cap Cana.

| Town | Also found as |
| --- | --- |
| Punta Cana | Cap Cana |

## Data handling

- **Bounds:** Hopp's geofencing has two no-riding polygons. One, around Cap
  Cana, has a hole, from 18.4452° to 18.5213° N and from 68.4445° to
  68.3755° W, the operating area, and a second, smaller one, from 18.631°
  to 18.646° N, in Verón, where no scooter stood, and is left out. The
  other, around La Romana and Casa de Campo, 55 km west, has a hole where no
  scooter stood, and is left out too. The bounds are
  Cap Cana's hole plus 0.009° of latitude and 0.0095° of longitude, about
  1 km: from 18.4362° to 18.5303° N and from 68.454° to 68.366° W. Every
  scooter stood inside them, between 18.4567° and 18.5118° N.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns.
- **Vehicle types:** one, `vtp_120`, an electric standing scooter with a range
  of up to 40 km.
- **Prices:** every scooter is on plan `flt_438`, US$3.00 to start and
  US$0.40 a minute; `flt_463` is the same, and `flt_477`, US$1.00 and US$0.30,
  had no scooter. All are marked `is_taxable` false, and the map adds no
  "+ tax".
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address.
- **Parking:** Hopp publishes no stations, so the map shows none.
- **Time zone:** `America/Santo_Domingo`, as the feed's `system_information`
  gives it. The Dominican Republic keeps no summer time.
- **Language:** Spanish in the Dominican Republic says "scooter", as in the
  rest of Latin America; the map picks the word by the browser's region
  (`es-DO`).

## Rules

- **Night bans:** none found, so
  [`rental-curfews.json`](../data/rental-curfews.json) has no Dominican entry.

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in its other countries.
- The map's credits name "Dominican Republic: Hopp GBFS", and Hopp on the GBFS
  line for North America.

## Known gaps

- **Hopp Las Terrenas** (`do-las-terrenas`) held 2 scooters, none available,
  on 15 October 2026: check again on 15 January 2027.
- **HappyVolts,** in Santo Domingo, is a company's staff fleet.

## Search

The Dominican Republic is found in the app's nine languages, typed beside the
town: "Punta Cana, República Dominicana". Search covers it in North America's
box, which takes in the Caribbean north of 14° N. Addresses are written with
the house number after the street and the five-digit postcode after the town:
"Calle El Conde 101, Santo Domingo 10210".

## Recheck

```sh
node scripts/check-french-feeds.mjs --countries=DO --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
