# Caribbean Netherlands scooter feeds

Verified 16 October 2026. The Caribbean Netherlands' one feed is Hopp's on
Bonaire, whose scooters stand in and around Kralendijk, the island's capital.
It is not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv):
it answers at the address Hopp uses for its other towns,
`https://api.hopp.bike/gbfs/bq-bonaire/gbfs.json`, a public, keyless GBFS 2.2
feed named "Hopp Bonaire", started on 7 July 2023. Every feed URL is https,
on the discovery's origin and under its directory. No account credentials or
private rider APIs are used. The catalog is
[`caribbean-netherlands-scooter-feeds.json`](../data/caribbean-netherlands-scooter-feeds.json);
what is left out, and when to look again, is in
[Coverage gaps](coverage-gaps.md#no-public-data-in-covered-countries).

| Operator | Feed | Town | Scooters | Available | Rides seen |
| --- | --- | --- | ---: | ---: | ---: |
| Hopp | `bq-bonaire` | Kralendijk | 77 to 80 | 62 to 75 | 11 |

## A country of its own

Bonaire is a special municipality of the Netherlands, with Sint Eustatius and
Saba. ISO 3166 gives the three islands a code of their own, BQ, and so does
the time-zone database, whose `America/Kralendijk` is BQ's zone; they use the
US dollar, and Bonaire has a traffic ordinance of its own. So the map lists Bonaire under the
Caribbean Netherlands, named as CLDR names it in the app's nine languages
("Caribisch Nederland", "Karibische Niederlande", "Pays-Bas caribéens"), not
under the Netherlands, where no scooter is shared. OpenStreetMap counts
Bonaire as part of the Netherlands, and so does Photon, one of the search's
geocoders: the search counts its places on Bonaire as the Caribbean
Netherlands', and Curaçao's, which it counts so too, as Curaçao's.

## Rides

The feed was polled 56 times, every five minutes, from 17:36 to 22:11
Bonaire time on Thursday 15 October 2026, then 13 times more, from 22:15 to
23:15, just before the feed was added. Hopp gives a
scooter a new id after each ride, so rides were followed by the code printed
on each scooter (`hopp_code`), which the feed masks to two letters and three
digits: 2 codes were held by two scooters each, and were left out. A ride is
a code that comes back more than 150 m away without its battery going up.

- **17:36 to 22:11:** 8 rides, by the codes and by the ids alike, of 0.5 to
  3.6 km, each using 2 to 14 points of battery.
- **22:15 to 23:15:** 3 rides, by the codes and by the ids alike: three
  scooters ridden together from the same spot, 1.2 km south, between 22:40
  and 22:55, each using 2 to 4 points of battery. 62 to 66 scooters were
  available in each poll.

## Town names

The map names the feed Kralendijk, the town where its scooters stand, and
centres it on the town's place in OpenStreetMap. One town covers the island:
Hopp's operating area takes in most of Bonaire, and every scooter stood in
or around Kralendijk. It is also found as Bonaire, which is also a word for
the country, as Washington is a city and a state. Not as Playa, Kralendijk's
name in Papiamentu: in Spanish any beach is a "playa", and a town found by
the word typed in full would skip the search for places, so "Playa" would
list Kralendijk first, and no beach or street called Playa something. Nor is Kralendijk a
word for the country, which would keep "Kaya Grandi, Kralendijk" from being
read as an address in the town.

| Town | Also found as |
| --- | --- |
| Kralendijk | Bonaire |

## Data handling

- **Bounds:** Hopp's geofencing has one no-riding polygon around the island,
  with two holes, the operating areas: most of the island, from 12.0192° to
  12.2272° N and from 68.3588° to 68.2219° W, and Rincon, the island's other
  village, from 12.2314° to 12.2437° N. The bounds are both holes plus 0.009°
  of latitude and 0.0092° of longitude, about 1 km: from 12.0102° to
  12.2527° N and from 68.3680° to 68.2127° W. Most of that is bush and salt
  pans, where no scooter stood; a box around the scooters alone would leave
  Rincon out, where Hopp lets riders go.
  - Every scooter of every poll, available or not, stood inside them
    (4,848 sightings of available ones over the 69 polls), between 12.1104° and
    12.1726° N and between 68.2922° and 68.2697° W: from Belnem in the
    south to Noord Saliña in the north, all in Kralendijk. None stood in
    Rincon.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns, so the age limit can't tell how old its
  positions are; the rides above show the feed is live.
- **Vehicle types:** one, `vtp_120`, an electric standing scooter.
- **Prices:** from the pricing feed's one plan, `flt_460`: US$1.00 to start
  and US$0.50 a minute, written as `per_min_price`, as in Hopp's other
  countries, and marked `is_taxable` false. The map adds "+ tax" only in the
  United States and Canada, so none is added. The card writes "$0.50" in an
  English browser set to the US or to Bonaire, "$ 0,50" in a Dutch one set to
  Bonaire, and "US$ 0.50" in one that names no region.
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address, as
  in Hopp's other countries.
- **Parking:** Hopp publishes no stations, so the map shows none.
- **Time zone:** `America/Kralendijk` in the catalog, as the feed's
  `system_information` gives it. Bonaire keeps no summer time.
- **Language:** Bonaire speaks Papiamentu, Dutch and English; Spanish there
  is Spain's, with "patinete", as Spanish is anywhere outside Latin America
  and the United States.

## Rules

- **The island's traffic ordinance,**
  [Wegenverkeersverordening Bonaire](https://lokaleregelgeving.overheid.nl/CVDR703248)
  (in force since 6 March 2020), has no category for e-scooters. A
  two- or three-wheeled vehicle with an electric motor of up to 4 kW is a
  moped, a "bromfiets" (art. 1 k), whose rider must wear a helmet (art. 78),
  be 16 or older and carry a permit (art. 100(2)), with an approval
  certificate for the vehicle (art. 93). The ordinance doesn't say whether a
  stand-up scooter is one. Nothing in it stops a rental, and the map shows
  the scooters as it does elsewhere.
- **Night bans:** none. The ordinance defines night only for lights, so
  [`rental-curfews.json`](../data/rental-curfews.json) has no entry for the
  Caribbean Netherlands.

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in its other countries.
- The map's credits name "Caribbean Netherlands: Hopp GBFS", and Hopp on the
  GBFS line for North America.

## Known gaps

- **Sint Eustatius and Saba,** the other two islands of the Caribbean
  Netherlands: no scooter feed was found.
- **Curaçao and Aruba,** off the same coast, are countries of their own and
  not on the map: their operators' feeds are switched off (see
  [Coverage gaps](coverage-gaps.md#countries-not-covered-yet)).

## Search

The Caribbean Netherlands is found in the app's nine languages, and as
Bonaire, typed beside a town: "Kralendijk, Caribisch Nederland",
"Kaya Grandi, Bonaire". Search covers Bonaire and Curaçao in a box of their
own, off Venezuela's coast but not on it (see `CONTINENT_BOXES` in
[`route.ts`](../src/app/api/geocode/route.ts)); Aruba is left out, as a box
around it would take in Venezuela's Paraguaná peninsula. Bonaire has no
postcodes, and addresses are written the Dutch way, the number after the
street: "Kaya Grandi 22", "Kralendijk".

## Recheck

```sh
node scripts/check-french-feeds.mjs --countries=BQ --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
