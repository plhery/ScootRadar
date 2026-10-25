# Greek scooter feeds

Update, 24 October 2026: additional Dott regions now use its anonymous app
map. The audit below records the original GBFS investigation; the current
catalog and [Dott adapter evidence](dott-app-map.md) supersede its Dott gaps.

Update, 25 October 2026: Lime's authenticated rider map supplies **Athens**,
**Kifisia**, **Thessaloniki** and **Heraklion**, each registered after a clean
full-area audit, with about 3,780, 50, 360 and 260 scooters. Kifisia, a
zone of Lime's Athens region, is a municipality apart, so the map lists it
as a town. Only scooter pins inside the published service polygons are
included; see [Lime's map](lime-app-map.md) for the collection and checks.
The regions and their public outline documents:

- Athens and Kifisia, `2P3BV6VNODYR4`: [publisher service polygons](https://assets.lime.bike/zones_attributes/Athens_580_exclude_new_type.json)
- Thessaloniki, `GONJN7YHVDWTK`: [publisher service polygons](https://assets.lime.bike/zones_attributes/Thessaloniki_371_exclude_new_type.json)
- Heraklion, `7BBVLLV5P4HUQ`: [publisher service polygons](https://assets.lime.bike/zones_attributes/Heraklion_90_exclude_new_type.json)


Verified 13 October 2026. The
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
lists no Hopp feed for Greece: its Greek entries are Dott's Athens and
Thessaloniki, which answer 404, and nextbike's four Athens suburbs, which have
e-bikes only. Hopp's Greek towns were polled at the address Hopp uses for its
other towns on Tuesday 13 October, 15 times about five minutes apart from 12:03
to 13:17 Athens time, then 11 times ten minutes apart until 15:07, and compared
with a poll at 02:10 the same night. Nafplio and Ioannina were polled 9 times
more, ten minutes apart until 16:47, and Ioannina 6 times more, five minutes
apart until 17:15. Every feed URL is https, on the discovery's origin and under
its directory. No account credentials or private rider APIs are used.

Hoppy's scooters on Rhodes, on Kos, in Rethymno and on Zakynthos were added on
14 October 2026; see
[Hoppy on Rhodes, Kos, Crete and Zakynthos, October 2026](#hoppy-on-rhodes-kos-crete-and-zakynthos-october-2026).
Hoppy is a different operator from Hopp, despite the name.

| Operator | Town | Available scooters |
| --- | --- | ---: |
| Hopp | Faliraki | 125 to 136 |
| Hopp | Piraeus | 93 to 94 |
| Hopp | Argostoli | 59 to 62 |
| Hopp | Ioannina | 14 to 15 |
| Hoppy | Rhodes, Ialysos, Faliraki, Afantou, Kolymbia | 551 to 558 |
| Hoppy | Kos | 319 to 332 |
| Hoppy | Rethymno | 103 to 105 |
| Hoppy | Zakynthos | 46 |

Faliraki had 33 rides traced by the code printed on each scooter, of 0.3 to
6.3 km: each scooter came back under a new id, with 1 to 19 points less
charge. Riders often went in pairs, and six scooters left one spot together
after 13:57 and were back by 14:17. Five more scooters moved 0.6 to 0.9 km
with no less charge. Piraeus and Argostoli were quiet at midday: no scooter of
either moved before 13:07. From then to 15:07, Piraeus had 3 rides, of 0.6 to
1.0 km, and Argostoli 3, of 0.5 to 1.6 km, with 2 to 7 points less charge;
Hopp also swapped a battery in Argostoli. Ioannina was quiet for longer: no
scooter moved before 15:57. From then to 17:15 it had 3 rides, of 1.1 to
2.6 km, with 6 to 14 points less charge. Between the night poll and the first
poll of the day, 8 Piraeus scooters, 2 Argostoli scooters and 2 Ioannina
scooters had moved 0.4 to 1.4 km with less charge. Nafplio is left out: see
[Known gaps](#known-gaps). The bounds, discovery URLs and aliases are in
[`greek-scooter-feeds.json`](../data/greek-scooter-feeds.json).

## Town names

Each town is named in Latin script, as Greek road signs also write it, since
Greek script would be unreadable to most riders. Where English has its own name
for the town, the map uses it (Piraeus, Rhodes); elsewhere it uses the Greek
name as the town itself writes it in Latin script (Faliraki, Argostoli,
Ioannina, Kos, Rethymno, Zakynthos).
Every other form finds the town in search: the Greek name in Greek script, the
formal transliteration and the older English name, and for Ioannina the name
it goes by in speech, Giannena.

Some feeds are named after more than their town:

- **Hopp Rhodes** (`gr-rhodes`) has all its scooters in Faliraki, the resort on
  the island's east coast, about 10 km south of the town of Rhodes. Its
  operating area covers Faliraki and the coast north of it, and stops about
  6 km short of the town of Rhodes. The map names it Faliraki. Rhodes, Rodos
  and Ρόδος find the town of Rhodes, where Hoppy's scooters are.
- **Hoppy Rhodes** spans the north of the island, so the map splits it into
  five towns (see [below](#hoppy-on-rhodes-kos-crete-and-zakynthos-october-2026)):
  Rhodes, Ialysos, Faliraki, Afantou and Kolymbia. Its Faliraki scooters join
  Hopp's in one town, Faliraki, so the town is counted and found once.
- **Hopp Kefalonia** (`gr-kefalonia`) runs in Argostoli, the island's main
  town, and is named Argostoli. It is also found as Kefalonia, Kefallonia,
  Cephalonia and Κεφαλονιά.
- **Hopp Piraeus** spans the port city and its northern neighbours: in a sample
  of 30 scooters, 15 stood in Piraeus, 6 in Nikaia, 6 in Keratsini and 3 in
  Korydallos. The map names the area Piraeus, after the feed and the regional
  unit, and centres it on Piraeus.

| Town | Also found as |
| --- | --- |
| Rhodes | Rodos, Ρόδος |
| Ialysos | Ialyssos, Ιαλυσός, Trianta, Kremasti |
| Faliraki | Φαληράκι |
| Afantou | Afandou, Αφάντου |
| Kolymbia | Kolympia, Kolimbia, Κολύμπια |
| Kos | Κως, Psalidi, Lambi, Tigaki |
| Rethymno | Ρέθυμνο, Rethymnon, Rethimno |
| Zakynthos | Zante, Ζάκυνθος |
| Piraeus | Peiraias, Pireas, Πειραιάς |
| Argostoli | Αργοστόλι, Kefalonia, Kefallonia, Cephalonia, Κεφαλονιά |
| Ioannina | Ιωάννινα, Giannena, Γιάννενα |

## Hoppy on Rhodes, Kos, Crete and Zakynthos, October 2026

Hoppy runs Rhodes, Kos, Rethymno, on Crete, and Zakynthos on ATOM Mobility, as
in Belgium and Spain: `https://hoppy.rideatom.com/gbfs/<id>/v3.0/gbfs`, with
1487 for Rhodes, 1501 for Kos, 1521 for Rethymno and 2198 for Zakynthos. All
four are keyless GBFS 3.0, and every feed URL is https, on the discovery's
origin and under its directory. Hopp's own Kos, Rethymno and Zakynthos feeds
are empty or disabled (see [Known gaps](#known-gaps)).

- **Liveness:** ATOM stamps `last_updated` with the time of the request and
  gives no `last_reported`, and a scooter's `vehicle_id` changes after each
  ride. So each scooter was followed by the code at the end of its rental link,
  the number printed on it. Each feed was polled every five minutes from
  01:09 to 11:29 Athens time on Wednesday 14 October, 141 to 143 times. Kos
  had 28 rides, Rethymno 9 and Rhodes 7, most of them in the morning: each
  scooter came back 0.2 to 7.7 km away under a new id, with 0.6 to 20 km less
  range. On Rhodes, 22 scooters also moved again and again from 05:40 to
  09:00 with the same id and range, as when staff move them by van. Rhodes
  listed 551 to 558 available scooters, Kos 319 to 332 and Rethymno 103 to
  105.
- **Zakynthos** was quieter, as its season ends. Its 46 scooters, all
  available, stood still with the same ids through 140 polls from 23:41 on
  Tuesday to 11:27 on Wednesday, Athens time; only their range fell, by 1 to
  3 km. Then one was ridden: by 12:22 it was back 2.3 km away under a new id,
  with 6.6 km less range. That is a real ride, and the scooters are there to
  rent, so the town is added; check it again in spring.
- **Scooters:** every vehicle type is `scooter_standing`, `electric`. Most
  have a 60 km maximum range; one Rhodes type, a different model, 51 km.
- **Rhodes** is split into five towns, by where the scooters stand, with no
  overlap between them:

  | Town | Scooters (00:19 CEST) | Covers |
  | --- | ---: | --- |
  | Rhodes | 250 | the town, its old town and the coast south to Kallithea |
  | Ialysos | 61 | Ialysos and Kremasti, west along the coast |
  | Faliraki | 96 | Faliraki, shared with Hopp |
  | Afantou | 24 | Afantou |
  | Kolymbia | 122 | Kolymbia and its hotels |

  Rhodes's bounds end at 36.3823° N, where Faliraki's begin; Hopp's Faliraki
  bounds, unchanged, reach 36.39° N, so the two operators' Faliraki is one
  town on the map. A Hoppy scooter at Lindos, 40 km south, would be left out;
  none stood there.
- **Kos** is one area: Kos town, the hotels of Psalidi along the coast to the
  east, where most scooters stand, and a few at Lambi and Tigaki to the west.
- **Zakynthos** is one area: its scooters stand in and just around the town.
  Hoppy's parking zones also cover Argassi, Kalamaki and Laganas, to the
  south, where no scooter stood in October; the bounds include them. Zante is
  an alias.
- **Rethymno** is one area: the town and the hotels along the beach east of
  it. The town leased Hoppy 29 public spaces for its scooters from 26 June
  2025, and extended the lease to 25 June 2027
  ([decision 194/2026](https://diavgeia.gov.gr/doc/9ΣΗΣΩ1Ψ-31Ο), 18 May 2026).
- **Bounds:** ATOM's geofencing forbids starting or ending a ride everywhere
  (`global_rules`), and allows both in Hoppy's parking zones: 155 on Rhodes,
  112 on Kos, 42 in Rethymno and 205 on Zakynthos. Each feed also has one
  large no-ride polygon without a hole over the whole area, which is how ATOM
  exports the operating area, so it can't serve as bounds; Rhodes has one more
  over the old town.
  The bounds enclose the parking zones and the scooters seen, plus 0.005° of
  latitude and 0.01° of longitude.
- **Prices:** EUR 1.00 to start, then EUR 0.30, 0.33 or 0.35 a minute, by the
  scooter's tier, and EUR 0.25 for Rhodes's 51 km model.
- **Battery:** Hoppy publishes range only, so the map shows range and no
  percentage, as in Belgium.
- **Rental links:** each scooter links to its own `ride-hoppy.app.link`
  address, ending in its printed number.
- **Time zone:** each feed gives `Europe/Athens` and opening hours of `24/7`.
- **Load:** the scooter cache asks for each feed's `vehicle_status` every 20
  minutes, or every minute for 10 minutes after someone looks at the town, and
  its metadata once an hour. So the four feeds add about 32 requests an hour to
  `hoppy.rideatom.com`, and at most about 65 each while watched; see
  [ATOM's request rate](german-italian-scooter-feeds.md#atoms-request-rate-october-2026).

## Data handling

- **Bounds:** Hopp's geofencing has one no-riding polygon around each town,
  whose hole is the operating area, and no-riding or slow zones inside it. The
  bounds are the hole plus 0.005° of latitude and 0.0065° of longitude, about
  550 m at these latitudes. In Faliraki, a scooter ended a 6.3 km ride at
  Kallithea, about 700 m north of the operating area, and stood there,
  available, for the last five polls, so Faliraki's north and east edges are
  set from it, with the same padding. Two disabled Piraeus scooters with
  empty batteries stood together at 38.109° N, 23.560° E, in Aspropyrgos,
  about 14 km north-west of the area and 20 km from Piraeus, in every poll.
  The map never shows disabled scooters, so the bounds leave them out. Every
  other scooter of every poll stood inside the bounds.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns, so the age limit can't tell how old its
  positions are; the rides above show the feeds are live.
- **Vehicle types:** `vtp_119` and `vtp_120`, both electric standing scooters.
  Argostoli and Ioannina list `vtp_119` only.
- **Prices:** from the pricing feed, in euros. Each town has one plan, and
  every scooter of every poll pointed to it:

  | Town | To start | A minute |
  | --- | ---: | ---: |
  | Faliraki | EUR 1.00 | EUR 0.33 |
  | Piraeus | EUR 0.99 | EUR 0.27 |
  | Argostoli | EUR 1.00 | EUR 0.35 |
  | Ioannina | EUR 1.00 | EUR 0.30 |

  Argostoli's feed writes its minute price as `0.35000000000000003`; the app
  rounds a price to the cent, and a unit test covers it. Each scooter also
  carries Hopp's own fields, `hopp_start_cost` and `hopp_credits_per_min`, in
  cents; they matched the plan for every scooter of every poll, and the app
  reads the plan. Hopp's website still gives older prices for some towns (EUR
  0.28 a minute in Rhodes); the map follows the feed.
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address, as
  in Hopp's other countries.
- **IDs:** Hopp gives a scooter a new `bike_id` after a ride, a move or a
  battery swap. The code printed on the scooter (`hopp_code`) is masked in
  these feeds to two letters and three digits, such as `XX732`, so codes
  repeat: Faliraki had 5 or 6 codes shared by two scooters in each poll,
  Piraeus 3, Argostoli 1 and Ioannina none. Rides were traced only by codes
  held by a single scooter.
- **Parking:** Hopp publishes no stations, so the map shows none; its app
  shows where parking is allowed.
- **Time zone:** Hopp Rhodes's `system_information` gives
  `Atlantic/Reykjavik`, Hopp's home time zone, not Greece's; the other feeds
  give `Europe/Athens`. Neither the app nor the scooter cache reads
  `system_information`, so this changes nothing on the map, as for Kiruna
  ([Swedish guide](swedish-scooter-feeds.md)).

## Night bans

No Greek law or covered town bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Greek entry.

- **National rules:** the road traffic code (law 5209/2025) caps scooters at
  25 km/h and keeps them off roads where cars may go faster than 50 km/h
  ([art. 24](https://www.taxheaven.gr/law/5209/2025/arthro/24)), and requires
  a helmet and, at night, reflective clothing, and forbids passengers
  ([art. 44](https://www.taxheaven.gr/law/5209/2025/arthro/44)). Law
  5322/2026, in force since 24 July 2026, sets a riding age of 17
  ([art. 76](https://www.taxheaven.gr/law/5322/2026/arthro/76)) and bans
  renting a scooter to anyone younger
  ([art. 79](https://www.taxheaven.gr/law/5322/2026/arthro/79)). None of them
  sets hours.
- **Towns:** a municipality may name roads and areas where operators must
  stop scooters from riding
  ([law 5322/2026, art. 81](https://www.taxheaven.gr/law/5322/2026/arthro/81)),
  by place, not by hour. None of the covered towns' municipalities has
  published a decision on shared scooters' hours in Diavgeia, the register of
  public decisions, searched up to 14 October 2026: Rhodes, which Faliraki,
  Ialysos, Afantou and Kolymbia belong to; Kos; Rethymno, whose lease to
  Hoppy names no hours; Zakynthos, where only the port fund has decided on
  Hoppy, turning down its request for a space in the port on 30 June 2026; Piraeus, Nikaia–Agios Ioannis Rentis,
  Keratsini–Drapetsona and Korydallos, which the Piraeus area spans;
  Argostoli; and Ioannina. The
  Rhodes press reports that the municipality has no rules for them at all
  ([Dimokratiki](https://www.dimokratiki.gr/15-08-2026/tilemachos-kabouris-patinia-pantou-pezodromia-katilimmena-ke-o-dimos-aplos-kitazi/),
  15 August 2026).
- **Hopp's terms** ([hopp.bike](https://hopp.bike/tos)) set an age of 18 and
  no hours, and nothing specific to Greece.
- **Athens**, where Lime's scooters are on the map, adopted rules on 18 May 2026
  that deal almost only with parking, after the regional authority struck
  out most of an earlier draft as beyond the city's powers
  ([Dimokratiki](https://www.dimokratiki.gr/19-05-2026/ilektrika-patinia-koftis-apo-tin-apokentromeni-gia-tous-periorismous-i-telikes-rythmisis/),
  press).

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain, Iceland, Sweden, Poland and Hungary.
- **Hoppy** gives no `license_url`, as in Belgium and Spain.
- The map's credits name both under the GBFS line.

## Known gaps

- **Hopp Nafplio** (`gr-nafplion`) listed 17 or 18 available scooters, of 26,
  but none moved, left or came back in 35 polls from 12:03 to 16:47, and all
  26 kept their ids from the night poll at 02:10 to the last; only a few
  battery levels changed. Polled again that evening, 22 times four minutes
  apart from 19:26 to 20:50, it still listed 17 until 20:26; then six
  scooters, with 0 to 57% charge, left one by one and didn't come back, as
  when Hopp collects them to charge, leaving 13 available. None was ridden,
  and the other 20 kept their ids from 02:10 the night before. It is left out
  until a later check, in the tourist season or on a weekend, shows rides.
  - Its bounds would be 37.5561° to 37.5919° N and 22.7865° to 22.8407° E,
    from its geofencing as for the other towns. It charges EUR 1.00 to start
    and EUR 0.28 a minute.
  - Nafplio's council discussed rental scooters on 8 May 2026
    ([Anagnostis](https://www.anagnostis.org/2026/05/05/synedriasi-dimotikou-symvouliou-nafpliou-me-6-themata/),
    press); no decision followed in Diavgeia. Check it before adding the town.
- **Athens** has only Lime's scooters on the map, from its rider map.
  **Dott**'s Athens and Thessaloniki regions in the registry answer 404
  (`ERR_REGION_NOT_FOUND`), **Lime**'s public address answers 404 for both
  cities, and **Bolt** publishes no feed.
- **Hopp, other towns:** Athens (Kifisia, `gr-athens`) listed 4 scooters,
  Voula 7, Zakynthos 3 and Lefkada 1, all of them disabled, in each of the
  seven polls from 12:03 to 12:33 that included them, and the same scooters,
  with the same ids and charge, in each of the 22 evening polls from 19:26 to
  20:50. Chania, Rethymno, Kos, Kardamena, Kalymnos, Trikala, Katerini,
  Preveza and Corinth answered with no scooter at all, by day and in the
  evening; they may be closed for the season. Kos, Rethymno and Zakynthos
  have scooters on the map all the same, from Hoppy. Hopp's site lists Preveza, Kifisia,
  Crete, Kos and Trikala besides Rhodes and Piraeus, and neither Kefalonia,
  Nafplio nor Ioannina.
- **nextbike** in four Athens suburbs has e-bikes only.
- **Public data:** the national access point
  ([nap.gov.gr](https://nap.gov.gr/)) is a landing page, and its catalogue,
  data.nap.imet.gr, timed out.

## Search

Greek script is searched as it is typed: the app keeps Greek letters, strips
their accents and reads a final sigma as any other, so Ρόδος, ΡΟΔΟΣ, Ροδος and
Ρόδοσ all find Rhodes. Greece is found in the app's nine languages and as
Hellas, Ellada and Ελλάδα, typed beside a town.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=GR --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
