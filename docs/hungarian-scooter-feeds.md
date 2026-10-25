# Hungarian scooter feeds

Update, 24 October 2026: additional Dott regions now use its anonymous app
map. The audit below records the original GBFS investigation; the current
catalog and [Dott adapter evidence](dott-app-map.md) supersede its Dott gaps.

Update, 25 October 2026: Lime's scooters in Budapest and 14 other towns, about
7,760, come from its [authenticated rider map](lime-app-map.md), each market
after a clean full-area audit. Its Balaton region, 17 zones on the lake's south
shore from Siófok to Balatonberény, held no scooter that day, nor did Fót, Göd
or Zalaegerszeg; check the Balaton resorts again in summer.


Verified 13 October 2026. The
[MobilityData GBFS registry](https://github.com/MobilityData/gbfs/blob/master/systems.csv)
lists no Hopp feed for Hungary, and its 8 Hungarian Dott entries answer 404.
Hopp's Hungarian towns were polled at the address Hopp uses for its other
towns, 12 times, about five minutes apart, from 09:33 to 10:27 Budapest time on
Tuesday 13 October. Békéscsaba was polled again that evening, 22 times four
minutes apart from 18:26 to 19:50. Every feed URL is https, on the discovery's
origin and under its directory. No account credentials or private rider APIs
are used.

| Operator | City | Available scooters |
| --- | --- | ---: |
| Hopp | Pécs | 222 to 238 |
| Hopp | Békéscsaba | 138 to 140 |

Pécs had 4 rides traced by the code printed on each scooter, of 0.5 to 1.4 km:
each scooter came back under a new id, with 1 to 13 points less charge. Between
10:06 and 10:26 Hopp also moved 7 scooters 0.5 to 0.8 km, with at most a point
less charge, to two spots, and swapped 3 batteries. Békéscsaba was still in
the morning: none of its 140 scooters moved, left or came back from 09:33 to
10:27. By 18:26, 14 had been ridden 0.2 to 4.7 km and come back under new ids,
with 3 to 19 points less charge, and in the evening polls it had 7 rides, of
0.2 to 2.8 km, with 1 to 13 points less charge; one scooter was out when the
polls ended. The bounds, discovery URLs and aliases are in
[`hungarian-scooter-feeds.json`](../data/hungarian-scooter-feeds.json).

## Data handling

- **Bounds:** Hopp's geofencing has one no-riding polygon around each town,
  whose hole is the operating area, and no-riding zones inside it: 2 in Pécs
  and 10 in Békéscsaba. The bounds are the hole plus 0.005° of latitude and
  0.0075° of longitude, about 550 m. Every scooter of every poll, disabled ones
  included, stood inside them.
- **Freshness:** Hopp stamps each response with the time it was asked for
  (`ttl` 0), as in its other towns, so the age limit can't tell how old its
  positions are; the rides above show the feed is live.
- **Vehicle types:** one type in each town, an electric standing scooter:
  `vtp_120` in Pécs and `vtp_119` in Békéscsaba.
- **Prices:** from the pricing feeds, in forints: HUF 272 to start and HUF 76
  a minute in Pécs, HUF 299 and HUF 99 in Békéscsaba. Pécs's feed also lists a
  DKK plan and a USD plan, and Békéscsaba's a HUF 399 plan, Gyula's; no scooter
  of any poll pointed to them. Each scooter is priced from its own
  `pricing_plan_id`, so those plans are never used, and a scooter whose plan is
  missing or unknown gets no price rather than another plan's. A unit test
  covers both. Hopp's own fields, `hopp_start_cost` and `hopp_credits_per_min`,
  matched Békéscsaba's plan for every scooter of every poll.
- **Forints:** the app writes prices in whole forints, "HUF 272", as it does
  Icelandic krónur. The fillér went out of use in 1999, but ISO 4217 still
  gives the forint two decimals; Safari follows it ("HUF 272.00") and Chrome
  doesn't, so the web app and the iOS app both list the forint as written
  without decimals.
- **Battery:** from Hopp's `hopp_battery_level` field. Each scooter also gives
  its range.
- **Rental links:** each scooter links to its own `app.hopp.bike` address, as
  in Hopp's other countries.
- **IDs:** Hopp gives a scooter a new `bike_id` after a ride, a move or a
  battery swap. The code printed on the scooter (`hopp_code`) is masked in
  these feeds to two letters and three digits, such as `XX240`, so codes
  repeat: in each poll 20 to 24 codes were shared by two or more scooters in
  Pécs, and 8 in Békéscsaba. Rides were traced only by codes held by a single
  scooter.
- **Békéscsaba's address:** its feed is at
  `https://api.hopp.bike/gbfs/hu-bekescaba/gbfs.json`, spelt without the second
  "s"; `hu-bekescsaba` answers 404. The catalog's id, `hopp_hu_bekescsaba`,
  spells the town's name.
- **Parking:** Pécs allows parking only at marked spots, and charges 4,000 Ft
  for a scooter left elsewhere ([pecs.hu](https://pecs.hu/e-roller/)).
  Békéscsaba allows it only at marked parking points, at least 60 of them,
  under its 2024 tender (see [Night bans](#night-bans)). Hopp publishes no
  stations, so the map can't show the spots; Hopp's app does.
- **Time zone:** both feeds give `Europe/Budapest`. Neither the app nor the
  scooter cache reads `system_information`.

## Night bans

Neither Pécs nor Békéscsaba bans renting at night, so
[`rental-curfews.json`](../data/rental-curfews.json) has no Hungarian entry.

- **Pécs:** the city's scooter page
  ([pecs.hu](https://pecs.hu/e-roller/)) sets a 10 km/h zone in the centre,
  marked parking and an age of 18, and no hours. Neither the 2023 tender
  ([council proposal](https://gov.pecs.hu/download/index.php?id=1291435)) nor
  the concession contract with HOPP Mecsek Kft.
  ([resolution 190/2023](https://gov.pecs.hu/download/index.php?id=1305840))
  sets any, and the decree on public space, which covers scooter parking,
  doesn't either
  ([31/2008](https://njt.jog.gov.hu/jogszabaly/2008-31-SP-5Y2329)).
- **Békéscsaba:** the council's 2024 tender
  ([proposal](https://bekescsaba.hu/download/1978/02-03-a-koezoessegi-rollerszolgaltatas),
  adopted as resolution 186/2024) sets 25 km/h, slow, no-go and no-parking
  zones, and parking at marked points only, and no hours. The register of
  local decrees (or.njt.hu) refused the connection on 13 October, as it had
  that morning, so no local decree was checked.
- **Hopp's terms** ([hopp.bike](https://hopp.bike/tos)) set an age of 18 and
  no hours, and nothing specific to Hungary.
- **National rules:** Hungary has no law yet on scooter hours, age or
  helmets. The press reports a draft that was open for consultation until 9
  September 2026; nothing has been published in the official gazette since.
- **Budapest:** see the 7th district's ban under [Known gaps](#known-gaps).
- **Dott's and Lime's other towns** have not been checked for local rules on
  hours yet.

## Licences

- **Hopp:** its `license_url` points to its privacy policy, so it publishes no
  data licence, as in Germany, Spain, Iceland, Sweden and Poland.
- The map's credits name Hopp under the GBFS line.

## Known gaps

- **Lime** (Budapest and 16 other places, Szeged, Eger, Sopron and Veszprém
  among them) and **Dott** (Budapest, Győr, Miskolc, Siófok and four other
  towns) publish no public feed; both are now on the map from their apps (see
  the updates above): Dott's 8 Hungarian regions in the registry answer 404, its Hungarian
  listing names none, and Lime's address answers 404 for each town tried.
  **blinkee** (2 towns) publishes nothing either, and **Bolt** runs taxis only
  in Hungary.
- **Hopp, other towns:** Gyula's feed answers but held no scooter in any poll,
  by night or by day, and Hopp's site doesn't list the town. Of 57 other
  Hungarian towns tried at Hopp's address, none answered.
- **Budapest's 7th district** (Erzsébetváros) voted in April 2025 that rental
  e-devices may not be used from 22:00 to 06:00 inside Károly körút, Király
  utca, Erzsébet körút and Rákóczi út, and that operators must switch them off
  there
  ([resolution 149/2025](https://www.erzsebetvaros.hu/uploads/files/php2YGu2i-1746011602-2025_04_29_KT_kivonat_ny%C3%ADlt.pdf);
  [Infostart](https://infostart.hu/belfold/2025/05/16/sebessegsapka-uj-tilalmak-es-egyeb-szabalyok-erzsebetvarosban),
  press). It sets terms for the district's future contracts with operators;
  no report says it is enforced, and none was found on 25 October 2026 either,
  so Budapest has no entry in `rental-curfews.json`.
- **Public data:** MOL Bubi and Donkey Republic are bikes only. The national
  access point ([napportal.kozut.hu](https://napportal.kozut.hu/)) lists
  timetables and road data, no shared mobility, and BKK's FUTÁR API needs a
  key and carries bike stations, not scooters.

## Search

Pécs is found as Pécs, Pecs and Fünfkirchen, its German name, and Békéscsaba
as Békéscsaba, Bekescsaba and Békešská Čaba, the name of its Slovak minority.
Hungary is found in the app's nine languages and as Magyarország, with or
without accents. The app strips accents by Unicode decomposition, which handles
Hungarian's ő and ű too.

## Recheck

```sh
npm run check:europe
node scripts/check-french-feeds.mjs --countries=HU --json
```

The [catalog check workflow](../.github/workflows/catalog-check.yml) runs every
Monday and fails when an entry of a country's catalog is gone.
