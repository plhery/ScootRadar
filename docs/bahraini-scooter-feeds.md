# Bahraini scooter feeds

Verified 4 November 2026. Bahrain's one feed is Hopp's, `bh-bahrain`, whose
scooters stand in three places: Manama, the Amwaj Islands and Zallaq. It is
not in
[MobilityData's GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv):
it answers at the address Hopp uses for its other towns,
`https://api.hopp.bike/gbfs/bh-bahrain/gbfs.json`, a public, keyless GBFS 2.2
feed named "Hopp Bahrain", started on 9 December 2022. Every feed URL is
https, on the discovery's origin and under its directory. No account
credentials or private rider APIs are used. The catalog is
[`bahraini-scooter-feeds.json`](../data/bahraini-scooter-feeds.json); what is
left out, and when to look again, is in
[Coverage gaps](coverage-gaps.md#no-public-data-in-covered-countries).

| Operator | Feed | Town | Scooters | Available |
| --- | --- | --- | ---: | ---: |
| Hopp | `bh-bahrain` | Manama | 4 | 4 |
| Hopp | `bh-bahrain` | Amwaj Islands | 4 | 4 |
| Hopp | `bh-bahrain` | Zallaq | 5 | 5 |

## Why it is on the map

The October audit left Bahrain out: 13 or 14 scooters on three sites, about 2
rides in 10.4 hours on 15 October 2026, fewer than the ten ridden scooters a
town is otherwise added with. It is added on 4 November 2026 under the App
Store rule (Desk [288]): ScootRadar opens in a country once every serious
operator there is on the map, and Hopp is the only one in Bahrain that
publishes anything. The fleet is small and little ridden, and the map shows
it as it is.

## Rides

The feed was polled 3 times, five minutes apart, from 10:45 to 10:55 UTC
(13:45 to 13:55 Bahrain time) on Wednesday 4 November 2026, before the feed
was added: the same 13 scooters, all available, and none moved more than
20 m. Hopp gives a scooter a
new id after each ride, so rides are followed by the code printed on each
scooter (`hopp_code`), masked to two letters and three digits, such as
`XX780`. A ride is a code that comes back more than 150 m away without its
battery going up. The scooters stood in tight groups, four or five within a
few metres of each other, as at a hub: at Al-Qudaibiya in Manama, by the
International School of Choueifat on the Amwaj Islands, and by Zallaq beach
at Al Jazayer.

## Town names

Each of the three places is an area of the feed, and a town of the map:

| Town | Also found as | Centre |
| --- | --- | --- |
| Manama | Al Manamah, المنامة | OpenStreetMap's city node |
| Amwaj Islands | Amwaj, جزر أمواج | OpenStreetMap's city node |
| Zallaq | Az Zallaq, Al Jazayer, الزلاق | OpenStreetMap's town node, 6.5 km north of where the scooters stand |

Bahrain's governorates are not regions of the map: its towns' names are
unique.

## Data handling

- **Bounds:** Hopp's geofencing has one no-riding polygon around the island,
  whose one hole, from 25.89° to 26.33° N and from 50.42° to 50.71° E, is the
  operating area: most of the main island's west and north, Manama, Muharraq
  and the Amwaj Islands. Each area of the catalog is a box around one of the
  three places where the scooters stood, with a kilometre or more to spare:
  - Manama, from 26.185° to 26.252° N and from 50.535° to 50.616° E: Seef,
    the old town, Al-Qudaibiya, Adliya and Juffair;
  - the Amwaj Islands, from 26.274° to 26.31° N and from 50.642° to 50.69° E;
  - Zallaq, from 25.975° to 26.07° N and from 50.448° to 50.505° E: the town
    and the beaches south of it, Al Jazayer's among them.

  The rest of the hole, Riffa, Isa Town, Sitra and Muharraq among them, held
  no scooter in any poll, here or in October, and is left out: a scooter
  ridden there is not shown. Take it in if scooters are found there.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns.
- **Vehicle types:** one, `vtp_119`, an electric standing scooter with a range
  of up to 40 km.
- **Prices:** two plans, `flt_392` (Manama and Zallaq) and `flt_479` (Amwaj),
  both US$0.80 to start and US$0.26 a minute, written as `per_min_price`, as
  in Hopp's other countries. Both are marked `is_taxable` false, and the map
  adds no "+ tax".
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address.
- **Parking:** Hopp publishes no stations, so the map shows none.
- **Time zone:** `Asia/Bahrain`, as the feed's `system_information` gives it.
  Bahrain keeps no summer time. A device on Bahrain's clock opens the map on
  the Amwaj Islands, the town nearest the point the time-zone database gives
  the zone, off the north coast.
- **Language:** Bahraini riders get the app in English.

## Rules

- **Resolution 58 of 2026** lets e-scooters ride only in designated zones, as
  the October audit recorded; its text was not read for this guide. Hopp's
  geofence is its own operating area.
- **Night bans:** none found, so
  [`rental-curfews.json`](../data/rental-curfews.json) has no Bahraini entry.

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in its other countries.
- The map's credits name "Bahrain: Hopp GBFS", and Hopp on the GBFS line for
  Asia.

## Known gaps

- **Spiders, Fenix and BSKL** run scooters in the Gulf and publish no feed;
  none was confirmed running in Bahrain. data.gov.bh has no scooter data.

## Search

Bahrain is found in the app's nine languages, as "Bahrain", "Bahrein",
"Barém", "Baréin", "Barein" and "البحرين", typed beside the town. Search
covers it in West Asia's box. Addresses are written with the building number
before the road, "1234 Road 2209", and the town alone: what OpenStreetMap
tags as a Bahraini postcode is the block number.

## Recheck

```sh
node scripts/check-french-feeds.mjs --countries=BH --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
