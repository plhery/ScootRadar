# Cypriot scooter feeds

Verified 13 October 2026. The
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
lists no Hopp feed for Cyprus: its one Cypriot entry is nextbike Cyprus, which
has bikes and e-bikes only. Hopp's Cypriot towns were polled at the address
Hopp uses for its other towns on Tuesday 13 October, 14 times about five
minutes apart from 15:29 to 16:34 Nicosia time, and compared with four polls
the night before, from 00:40 to 02:10, which counted the scooters and their
positions only. Every feed URL is https, on the discovery's origin and under
its directory. No account credentials or private rider APIs are used.

| Operator | Town | Available scooters | At night |
| --- | --- | ---: | ---: |
| Hopp | Paphos | 47 to 62 | 71 |
| Hopp | Limassol | 26 to 29 | 29 |

Paphos had 6 rides traced by the code printed on each scooter, of 0.5 to
1.8 km: each scooter came back under a new id, with 3 to 6 points less charge.
Three scooters left one spot together after 15:44 and were back, side by side,
by 16:04. One more scooter moved 2.6 km with no less charge, and Hopp swapped
a battery and put out 7 scooters with 96 to 100% charge, so the count rose
through the afternoon. Limassol was quieter: one scooter was reserved at
15:54, ridden 1.7 km and back by 16:09 under a new id, with 4 points less
charge, and two scooters absent from the first six polls appeared at 15:59,
with 68% and 28% charge. No other Limassol scooter moved. Larnaca is left
out: see [Known gaps](#known-gaps). The bounds, discovery URLs and aliases are
in [`cypriot-scooter-feeds.json`](../data/cypriot-scooter-feeds.json).

## Town names

Each town is named as English names it, in Latin script, and is also found by
its Greek name, in Greek script and transliterated.

- **Hopp Cyprus** (`cy-cyprus`), "Hopp Hopp Cyprus" in its
  `system_information`, has all its scooters in Limassol, and its operating
  area covers Limassol and the coast east of it, to Agios Tychonas. Hopp's
  site lists the town as Limassol, so the map names the feed Limassol.
- **Hopp Paphos** (`cy-paphos`) runs in Paphos, with Geroskipou to the east
  and Chlorakas and Kissonerga to the north, and in a separate area around
  Coral Bay and Peyia, about 10 km north-west of the town centre. The map
  names it Paphos and centres it on Paphos; its bounds take in the Coral Bay
  area, which held 1 or 2 scooters in every poll (see
  [Data handling](#data-handling)).

| Town | Also found as |
| --- | --- |
| Paphos | Pafos, Πάφος |
| Limassol | Lemesos, Λεμεσός |

## Data handling

- **Bounds:** Hopp's geofencing has one no-riding polygon around each town,
  whose holes are the operating areas, and no-riding zones inside them. The
  bounds are the holes that held scooters, plus 0.005° of latitude and 0.0065°
  of longitude, about 550 m at these latitudes.
  - Limassol has one hole, from 34.645° to 34.718° N.
  - Paphos has five. The bounds take in four of them: Paphos with Chlorakas
    and Kissonerga, Paphos's east side with Geroskipou, and the Coral Bay and
    Peyia area with a smaller hole inside it. At night 2 scooters stood in
    Coral Bay; by day 1 or 2 stood near the Sea Caves, west of Peyia, about
    13 km from Paphos's centre, a second one arriving at 15:34 next to the
    first. So the bounds run north past Peyia, to 34.918° N. The fifth hole,
    around Polis and Latchi, 29 km north of Paphos, held no scooter, and is
    left out.
  - Every scooter of every poll, by day and at night, stood inside the
    bounds.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns, so the age limit can't tell how old its
  positions are; the rides above show the feeds are live.
- **Vehicle types:** `vtp_119` and `vtp_120`, both electric standing scooters.
- **Prices:** from the pricing feeds, in euros, with each scooter priced from
  its own `pricing_plan_id`:

  | Town | Plan | To start | A minute |
  | --- | --- | ---: | ---: |
  | Paphos | `flt_470` | EUR 1.00 | EUR 0.25 |
  | Limassol | `flt_466` | EUR 1.20 | EUR 0.25 |

  Limassol's pricing feed also lists `flt_470` and `flt_564`, at EUR 1.00 to
  start and EUR 0.25 a minute, but every Limassol scooter of every poll was
  on `flt_466`. Each scooter also carries Hopp's own fields,
  `hopp_start_cost` and `hopp_credits_per_min`, in cents; they matched its
  plan for every scooter of every poll, and the app reads the plan. A unit
  test covers all three Limassol plans. Hopp's website gives EUR 1 to start and
  EUR 0.24 a minute for both towns; the map follows the feeds.
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address, as
  in Hopp's other countries.
- **IDs:** Hopp gives a scooter a new `bike_id` after a ride, a move or a
  battery swap. The code printed on the scooter (`hopp_code`) is masked in
  these feeds to two letters and three digits, such as `XX553`, so codes
  can repeat: Paphos had 1 or 2 codes shared by two scooters in each poll,
  Limassol none. Rides were traced only by codes held by a single scooter.
- **Parking:** Hopp publishes no stations, so the map shows none; its app
  shows where parking is allowed. Paphos's licensing terms let the
  municipality fix where rental scooters are parked (see below).
- **Time zone:** both feeds give `Asia/Nicosia`. Neither the app nor the
  scooter cache reads `system_information`.

## Night bans

No Cypriot law or covered town bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Cypriot entry.

- **National rules:** the law on bicycles and other personal mobility devices
  (19(I)/2018, as amended in 2022 and 2026;
  [consolidated text](https://www.cylaw.org/nomoi/enop/non-ind/2018_1_19/full.html))
  allows scooters on roads signed 30 km/h and on cycle paths and lanes only,
  and keeps them off squares and pedestrian streets unless the municipality
  allows them there by a decision published in the Gazette. It requires a
  helmet, reflective clothing between sunset and sunrise, and forbids
  passengers (art. 4A). Since the amendments of April 2026, riders must be 17
  or older, up from 14
  ([107(I)/2026](https://www.cylaw.org/nomoi/arith/2026_1_107.pdf)), and
  scooters may go up to 25 km/h, up from 20
  ([106(I)/2026](https://www.cylaw.org/nomoi/arith/2026_1_106.pdf)), and
  10 km/h where pedestrian areas are allowed (art. 8A). Rental firms need a
  yearly licence from each municipality they run in (art. 8A(5)), which sets
  its terms. None of these rules sets hours.
- **Paphos:** the municipality's call for rental licences
  ([call 9/2024](https://pafos.org.cy/wp-content/uploads/2024/04/%CE%A0%CF%81%CF%8C%CF%83%CE%BA%CE%BB%CE%B7%CF%83%CE%B7-%CE%B5%CE%BA%CE%B4%CE%AE%CE%BB%CF%89%CF%83%CE%B7%CF%82-%CE%B5%CE%BD%CE%B4%CE%B9%CE%B1%CF%86%CE%AD%CF%81%CE%BF%CE%BD%CF%84%CE%BF%CF%82-%CF%83%CF%85%CF%83%CE%BA%CE%B5%CF%85%CF%8E%CE%BD-%CF%80%CF%81%CE%BF%CF%83%CF%89%CF%80%CE%B9%CE%BA%CE%AE%CF%82-%CE%BA%CE%B9%CE%BD%CE%B7%CF%84%CE%B9%CE%BA%CF%8C%CF%84%CE%B7%CF%84%CE%B1%CF%82.pdf),
  April 2024) allows up to 250 rental devices, 50 per firm, fixes where they
  are parked and picked up, lists the pedestrian streets and the stretch of
  seafront they may use, at up to 7 km/h, and sets no hours. In summer 2026
  the police reported 132 cases of rental firms working without a licence
  ([Cyprus Mail](https://cyprus-mail.com/2026/07/23/paphos-to-bolster-efforts-to-stamp-out-illegal-scooter-use),
  23 July 2026, press) and fined riders on the harbour promenade, where
  scooters are banned
  ([Politis](https://en.politis.com.cy/news/cy-news/1022527/paphos-police-issue-23-fines-in-e-scooter-crackdown),
  29 July 2026, press). Neither names Hopp.
- **Limassol:** no municipal decision on rental scooters was found on the
  municipality's site or in the press up to 13 October 2026.
- **Hopp's terms** for Cyprus
  ([hopp.bike](https://hopp.bike/tos?group=7mWpfHpyZwNiz66V00Re1c)) set an
  age of 18 and no hours.

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain, Iceland, Sweden, Poland, Hungary and
  Greece.
- The map's credits name Hopp under the GBFS line.

## Known gaps

- **Nicosia** has no scooter on the map. **Bolt** runs e-scooters there,
  parked at fixed stations: in January 2024 Nicosia told its two operators,
  Bolt and Scroll, that the municipalities, not the operators, would decide
  where scooters are left, at pick-up stations
  ([Cyprus Mail](https://cyprus-mail.com/2024/01/16/clamp-down-on-anarchy-of-electric-scooters),
  16 January 2024, press). Bolt publishes no feed for Cyprus; its only public
  scooter feeds in Europe are Brussels and Liverpool. Whether **Scroll** still
  runs in Nicosia is unverified; Bolt told parliament in September 2026 that
  it is the only licensed operator there
  ([Politis](https://en.politis.com.cy/news/cy-news/1032017/cyprus-e-scooter-rules-under-scrutiny-after-two-deaths),
  10 September 2026, press).
- **Public data:** the national access point,
  [traffic4cyprus.org.cy](https://traffic4cyprus.org.cy/dataset/bolt), offers
  "Bolt e-Scooter Stations" under CC BY 4.0, keyless, at
  `https://fixcyprus.cy/gnosis/open/api/nap/datasets/boltstations/`. It is a
  DATEX II file from the Ministry of Transport that lists 255 parking stations
  in Nicosia, with 1,779 places, and no vehicles or availability, so there is
  nothing to show on a scooter map. Its other shared-mobility dataset is
  nextbike's bike stations.
- **Hopp Larnaca** (`cy-larnaca`) answers, with a geofence around Larnaca,
  but listed no scooter and no vehicle type in any poll, by night or by day.
  Hopp's site doesn't list it, and its `system_information` gives
  `Europe/Istanbul`. None of 17 other slugs tried at Hopp's address, for
  Nicosia, Limassol, Larnaca, Paphos, Ayia Napa, Protaras, Paralimni, Polis,
  Peyia, Coral Bay, Troodos, Famagusta and Kyrenia, in several spellings,
  answered.
- **Bird, Lime, Dott and Zeus** have nothing in Cyprus: Dott's Cypriot listing
  names no region, and Bird's, Lime's, Dott's and Zeus's addresses for
  Nicosia, Limassol, Larnaca and Paphos answer 404 or 400.
- **nextbike Cyprus** has bikes and e-bikes only.
- **Northern Cyprus:** no shared-scooter feed was seen.

## Search

Greek script is searched as it is typed, as for Greece: accents are stripped
and a final sigma is read as any other, so Λεμεσός, ΛΕΜΕΣΟΣ and Λεμεσος all
find Limassol. Cyprus is found in the app's nine languages and as Kypros,
Κύπρος, Kıbrıs and Kibris, typed beside a town; a dotless ı is read as an i.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=CY --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
