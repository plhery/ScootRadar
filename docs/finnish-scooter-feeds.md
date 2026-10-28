# Finnish scooter feeds

Update, 24 October 2026: 20 mainland Dott regions now use the anonymous app
map, including Helsinki, Espoo, Vantaa and Tampere. Helsinki, Espoo and Vantaa
have their municipal weekend-night curfews in both clients. The audit below
records the original GBFS investigation; see [Dott adapter evidence](dott-app-map.md).

Verified 13 October 2026. Finland's only usable feed is Hopp's, in Mariehamn,
on Åland. The
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
lists 58 Finnish systems and nothing on Åland: Dott's 40 Finnish regions, none
of which answers (see [Known gaps](#known-gaps)), Bird Helsinki, which is stale
and empty, Joe Rauma, which answers but listed no scooter, and 16 bike systems.
Hopp Mariehamn was polled at the address Hopp uses for its other towns on
Tuesday 13 October, 21 times three minutes apart from 17:00 to 18:01
Mariehamn time, which is Helsinki time, and compared with four polls the night
before, from 00:36 to 02:11, which counted the scooters only. Every feed URL is
https, on the discovery's origin and under its directory. No account
credentials or private rider APIs are used.

| Operator | Town | Available scooters | At night |
| --- | --- | ---: | ---: |
| Hopp | Mariehamn, on Åland | 37 to 39 | 39 |

Mariehamn had 4 rides traced by the code printed on each scooter, of 0.6 to
2.1 km: each scooter left between 17:03 and 17:27 and came back under a new id
6 to 24 minutes later, with 2 to 15 points less charge. The bounds, discovery
URL and aliases are in
[`finnish-scooter-feeds.json`](../data/finnish-scooter-feeds.json).

## Town name

Mariehamn is the capital of Åland, an autonomous, Swedish-speaking region of
Finland with its own ISO code (AX). The map keeps it under Finland (FI), as
Hopp does with its `fi-mariehamn` feed, and names it by its Swedish name, the
only official one, which Hopp also uses. Search also finds it by its Finnish
name and by Åland, in Swedish and Finnish, so a rider who types the island's
name finds its only town with scooters.

| Town | Also found as |
| --- | --- |
| Mariehamn | Maarianhamina, Åland, Ahvenanmaa |

Zoomed out, a country's total usually stands inland, about the middle of the
country. Finland's stands inland in the south-west, between Turku and Tampere
(61.1° N, 23.8° E). Its middle, near Jyväskylä, is about 450 km from Åland, and
a total there would point riders to towns with no scooters on the map. Mariehamn
itself is in the sea between Stockholm and Turku: zoomed out to Europe, a total
there touches the Swedish coast and reads as Stockholm's, near Lime's Uppsala.
The south-west of the mainland reads as Finland and is the part of it nearest
Mariehamn, so tapping the total flies a short way west to the town. It stands
about 46 points from Sweden's and Latvia's totals at zoom 3 and 92 at zoom 4,
wider apart than Spain's and Portugal's (64 at zoom 4).

## Data handling

- **Bounds:** Hopp's geofencing draws one polygon around Mariehamn, for the
  scooter types, where a ride may pass but not start or end. Its hole is the
  operating area, from 60.071° to 60.139° N and from 19.892° to 19.987° E.
  The bounds are that hole plus 0.005° of latitude and 0.01° of longitude,
  about 550 m at this latitude. Every scooter of the day's polls stood inside
  them, between 60.080° and 60.128° N and 19.910° and 19.974° E.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns, so the age limit can't tell how old its
  positions are; the rides above show the feed is live.
- **Vehicle types:** `vtp_119` and `vtp_120`, both electric standing scooters,
  and `vtp_116` and `vtp_75`, electric cars, with a geofence of their own. No
  car was listed in any of the day's polls, and the app keeps electric
  scooters only, so a car would never show; a unit test covers it.
- **Prices:** from the pricing feed, in euros: one plan, `flt_457`, at EUR 1.70
  to start and EUR 0.42 a minute, which every scooter of the day's polls was
  on. Each scooter also carries Hopp's own fields, `hopp_start_cost` and
  `hopp_credits_per_min`, in cents; they matched the plan for every scooter of
  the day's polls, and the app reads the plan.
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address, as
  in Hopp's other countries.
- **IDs:** Hopp gives a scooter a new `bike_id` after a ride, a move or a
  battery swap. The code printed on the scooter (`hopp_code`) is masked in this
  feed to two letters and three digits, such as `XX552`, so codes can repeat:
  two scooters shared `XX929` in every poll. Rides were traced only by codes
  held by a single scooter.
- **Parking:** Hopp publishes no stations, so the map shows none. Its
  geofencing marks six small zones in the town centre where a ride may be
  ridden through but not started or ended; the map doesn't draw them, and its
  app does.
- **Time zone:** the feed gives `Europe/Mariehamn`. Neither the app nor the
  scooter cache reads `system_information`.

## Night bans

No law of Åland and no rule of Mariehamn bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Finnish entry.

- **Åland's rules:** Åland has its own road traffic act
  ([ÅFS 2023:108](https://www.regeringen.ax/sites/default/files/attachments/law/afs2023_Nr108.pdf),
  in force since 1 April 2024), so mainland Finland's road traffic act doesn't
  apply there. Its riders of light electric vehicles count as cyclists (§49):
  on the cycle path, or on the road where there is none, never on the
  footway. Riders under 15 must wear a helmet (§67). The Åland government's
  [e-scooter page](https://www.regeringen.ax/infrastruktur-kommunikationer/trafiksakerhet/cykel/elsparkcykel)
  (updated 16 March 2026) adds that a scooter of up to 25 km/h and 1 kW counts
  as a light electric vehicle, carries no passenger, and is ridden sober. The
  law sets no age or alcohol limit; the government had a
  [study](https://www.regeringen.ax/infrastruktur-kommunikationer/trafiksakerhet/cykel/elsparkcykel/barnkonsekvensanalys-om-alders-promillegrans-elsparkcyklar)
  made of both in June 2026 and has not decided. None of these rules sets
  hours.
- **Mariehamn:** the city's site has no page on rental scooters. Hopp's local
  partners agreed with the city where scooters may go when they started in
  2023 ([Ålands Radio](https://alandsradio.ax/aland-idag/elektriska-scootrar-gar-nu-anvanda-mariehamn),
  11 July 2023, press). No decision or permit setting hours was found, though
  the city's minutes server didn't answer.
- **Hopp's terms** ([hopp.bike](https://hopp.bike/tos)) set an age of 18 and
  no hours.

Seven mainland towns ban renting at night, in the terms of the micromobility
permits each gives its operators. Helsinki, Espoo, Vantaa, Turku, Lahti and
Porvoo have curfew entries since 24 October; Oulu, with no scooter on the map,
has none.

- **Helsinki:** operators must switch their scooters off on the nights from
  Friday to Saturday and from Saturday to Sunday, 23:00 to 05:00, and on Vappu
  night (30 April to 1 May), 23:00 to 05:00; on other nights the limit is
  15 km/h ([permit terms](https://ahjojulkaisu.hel.fi/CF797207-A9AA-C8A6-906D-9AE871400002.pdf),
  3 December 2025).
- **Espoo:** the same nights, 00:00 to 05:00, and Vappu night; 15 km/h on
  weeknights from 00:00 to 05:00
  ([permit terms](https://admin.espoo.fi/sites/default/files/2025-12/Mikroliikennelupa_Espoon%20kaupunki.pdf)).
- **Vantaa:** the same as Espoo
  ([permit terms](https://www.vantaa.fi/sites/default/files/document/Vantaa-mikroliikennelupa-ehdot-2026.pdf),
  1 January 2026 to 28 February 2027).
- **Turku:** no riding on weekend nights, Friday to Saturday and Saturday to
  Sunday, from 00:00 to 05:00, nor on the nights of Vappu, Midsummer and New
  Year's Eve when they fall on a weekday
  ([permit terms](https://www.turku.fi/sites/default/files/document/turun-kaupungin-mikroliikenneluvan-lupaehdot_2026.pdf),
  2026).
- **Lahti:** no renting from Friday to Saturday and from Saturday to Sunday,
  00:00 to 05:00, across the whole city, nor on the nights that start on
  Maundy Thursday, 30 April and the day before Midsummer Eve
  ([permit terms](https://www.lahti.fi/app/uploads/2026/04/mikroliikenneluvan-ehdot-2026.pdf),
  section 7, 17 February 2026).
- **Porvoo:** scooters must not be available from Friday to Saturday and from
  Saturday to Sunday, 00:00 to 05:00, nor on the nights of Vappu, Midsummer
  and New Year's Eve; the season runs from 15 April to 31 October
  ([permit terms](https://www.porvoo.fi/app/uploads/2025/12/Mikroliikenneluvan-lupaehdot_fi_sv.pdf),
  28 November 2025).
- **Oulu:** no riding from Friday to Saturday and from Saturday to Sunday,
  00:00 to 05:00, nor on 1 May, 00:00 to 05:00
  ([permit terms](https://www.ouka.fi/media/18301/download), 9 December 2025).
- **Tampere** bans nothing: scooters are limited to 15 km/h from 23:00 to
  05:00, and riders take a reaction test from Thursday to Saturday nights
  ([city of Tampere](https://www.tampere.fi/en/transport-streets-and-maintenance/cycling-and-walking/city-bikes-and-e-scooters/e-scooters)).

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain, Iceland, Sweden, Poland, Hungary, Greece
  and Cyprus.
- The map's credits name Hopp under the GBFS line.

## Known gaps

- **Mainland Finland** has no public scooter feed. Since 24 October 2026 the
  map shows Dott's and Voi's scooters there from their app maps
  ([Dott](dott-app-map.md), [Voi](voi-app-map.md)); Ryde's and Bolt's are not
  on it. Bolt's only public scooter feeds in Europe are Brussels and Liverpool.
- **Ryde** (Helsinki, Espoo, Vantaa, Tampere, Turku), rechecked on 28 October
  2026: it publishes GBFS only through Entur, for its sixteen Norwegian
  systems, and through NRW's closed data hub (factsheet 465, ten German
  zones). MobilityData's registry lists no Finnish system, Transitous's
  Finnish sources are Fintraffic's two national feeds alone, and those listed
  2,727 Dott scooters and nothing else in Helsinki, Espoo and Vantaa at 16:31
  UTC. No Finnish transit app is known to show Ryde's map, as Skyss's does in
  Bergen ([Ryde's map readers](ryde-app-map.md)), and Ryde's own app needs a
  rider session.
- **Dott:** the registry's 40 Finnish regions don't answer. 34 answer 404.
  Six answer 403 `ERR_REGION_OFFLINE`, which means paused, probably for the
  winter: Ekenäs (`tammisaari`), Hamina, Hanko, Imatra, Kalajoki and Kotka.
  Check them again in April.
- **Bird Helsinki** answers, but its vehicle feed is empty and stamped
  `last_updated` 0.
- **Joe Scooter**, a Finnish operator on ATOM Mobility's platform, publishes
  Rauma's feed (id 475), which is in the registry and answers, with a geofence
  and four scooter types, but listed no scooter by night or in any of the 21
  polls by day, from 17:00 to 18:01 Helsinki time. Joe's site also lists
  Kouvola, Kalajoki, Mikkeli and Rovaniemi; ids 69, 72, 73 and 74 at the same
  address answer "GBFS disabled". Check Rauma again in spring, and add it, as a
  new provider, if its scooters are ridden.
- **Public data:** the national access point,
  [finap.fi](https://finap.fi/), run by Fintraffic, lists Voi's NeTEx files
  for Helsinki, Turku, Tampere and Jyväskylä, at
  `https://api.voiapp.io/gbfs/open/v1/{49,122,136,275}/netex.xml`. They give
  Voi's zones, prices and hours, and no vehicles, and the same address has no
  GBFS feed. Digitransit's API needs a subscription key and carries city bikes
  only.
- **Fintraffic's national GBFS feed**
  (`https://mobility-api.mobility-database.fintraffic.fi/gbfs/v2/gbfs.json`)
  carries Dott's Finnish scooters, which Dott's own feeds don't, but answers
  403 without a free key, ordered with an account on the Mobility Database
  site. Seen through Transitous, which has a key, it listed 10,570 Dott
  scooters in 27 towns on Sunday 18 October 2026, Helsinki, Tampere, Lahti,
  Vantaa and Espoo first, with no Voi, Ryde or Bolt. None of them moved from
  04:55 to 09:00 Helsinki time, and 447 stood in Hanko, Raseborg, Kotka and
  Hamina, which Dott reports as paused, so the data looks frozen. The two
  keys ordered on 23 and 25 October 2026 were never activated (the feed
  answered 403 to the end), and the user dropped it on 27 October 2026:
  Finland stays on Dott's and Voi's rider maps and Hopp's feed.
- **Hopp** answers for Mariehamn only: none of 26 other Finnish and Åland
  slugs tried at its address, for Helsinki, Tampere, Turku, Oulu and other
  towns, answered.
- **Donkey Republic** (15 towns) and **Helsinki's city bikes** are bikes only.

## Search

Finland is found in the app's nine languages and as Suomi, typed beside a town.
Mariehamn is also found as Maarianhamina, Åland, Aland and Ahvenanmaa; Åland is
a town alias rather than a country word, so the island's name alone finds the
town.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=FI --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
