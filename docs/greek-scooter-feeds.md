# Greek scooter feeds

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

| Operator | Town | Available scooters |
| --- | --- | ---: |
| Hopp | Faliraki | 125 to 136 |
| Hopp | Piraeus | 93 to 94 |
| Hopp | Argostoli | 59 to 62 |
| Hopp | Ioannina | 14 to 15 |

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
for the town, the map uses it (Piraeus); elsewhere it uses the Greek name as
the town itself writes it in Latin script (Faliraki, Argostoli, Ioannina).
Every other form finds the town in search: the Greek name in Greek script, the
formal transliteration and the older English name, and for Ioannina the name
it goes by in speech, Giannena.

Two of Hopp's feeds are named after more than their town:

- **Hopp Rhodes** (`gr-rhodes`) has all its scooters in Faliraki, the resort on
  the island's east coast, about 10 km south of the town of Rhodes. Its
  operating area covers Faliraki and the coast north of it, and stops about
  6 km short of the town of Rhodes. The map names it Faliraki, so that nobody
  looks for scooters in the town of Rhodes; it is also found as Rhodes, Rodos
  and Ρόδος, as Vestmannaeyjar is found by its island, Heimaey.
- **Hopp Kefalonia** (`gr-kefalonia`) runs in Argostoli, the island's main
  town, and is named Argostoli. It is also found as Kefalonia, Kefallonia,
  Cephalonia and Κεφαλονιά.
- **Hopp Piraeus** spans the port city and its northern neighbours: in a sample
  of 30 scooters, 15 stood in Piraeus, 6 in Nikaia, 6 in Keratsini and 3 in
  Korydallos. The map names the area Piraeus, after the feed and the regional
  unit, and centres it on Piraeus.

| Town | Also found as |
| --- | --- |
| Faliraki | Φαληράκι, Rhodes, Rodos, Ρόδος |
| Piraeus | Peiraias, Pireas, Πειραιάς |
| Argostoli | Αργοστόλι, Kefalonia, Kefallonia, Cephalonia, Κεφαλονιά |
| Ioannina | Ιωάννινα, Giannena, Γιάννενα |

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
  published a decision on shared scooters in Diavgeia, the register of public
  decisions, searched up to 13 October 2026: Rhodes, which Faliraki belongs
  to; Piraeus, Nikaia–Agios Ioannis Rentis, Keratsini–Drapetsona and
  Korydallos, which the Piraeus area spans; Argostoli; and Ioannina. The
  Rhodes press reports that the municipality has no rules for them at all
  ([Dimokratiki](https://www.dimokratiki.gr/15-08-2026/tilemachos-kabouris-patinia-pantou-pezodromia-katilimmena-ke-o-dimos-aplos-kitazi/),
  15 August 2026).
- **Hopp's terms** ([hopp.bike](https://hopp.bike/tos)) set an age of 18 and
  no hours, and nothing specific to Greece.
- **Athens**, which has no scooter on the map, adopted rules on 18 May 2026
  that deal almost only with parking, after the regional authority struck
  out most of an earlier draft as beyond the city's powers
  ([Dimokratiki](https://www.dimokratiki.gr/19-05-2026/ilektrika-patinia-koftis-apo-tin-apokentromeni-gia-tous-periorismous-i-telikes-rythmisis/),
  press).

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain, Iceland, Sweden, Poland and Hungary.
- The map's credits name Hopp under the GBFS line.

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
- **Athens** has no scooter on the map. **Dott**'s Athens and Thessaloniki
  regions in the registry answer 404 (`ERR_REGION_NOT_FOUND`), **Lime**'s
  address answers 404 for both cities, and **Bolt** publishes no feed.
- **Hopp, other towns:** Athens (Kifisia, `gr-athens`) listed 4 scooters,
  Voula 7, Zakynthos 3 and Lefkada 1, all of them disabled, in each of the
  seven polls from 12:03 to 12:33 that included them, and the same scooters,
  with the same ids and charge, in each of the 22 evening polls from 19:26 to
  20:50. Chania, Rethymno, Kos, Kardamena, Kalymnos, Trikala, Katerini,
  Preveza and Corinth answered with no scooter at all, by day and in the
  evening; they may be closed for the season. Hopp's site lists Preveza, Kifisia,
  Crete, Kos and Trikala besides Rhodes and Piraeus, and neither Kefalonia,
  Nafplio nor Ioannina.
- **nextbike** in four Athens suburbs has e-bikes only.
- **Public data:** the national access point
  ([nap.gov.gr](https://nap.gov.gr/)) is a landing page, and its catalogue,
  data.nap.imet.gr, timed out.

## Search

Greek script is searched as it is typed: the app keeps Greek letters, strips
their accents and reads a final sigma as any other, so Ρόδος, ΡΟΔΟΣ, Ροδος and
Ρόδοσ all find Faliraki. Greece is found in the app's nine languages and as
Hellas, Ellada and Ελλάδα, typed beside a town.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=GR --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
